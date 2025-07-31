# 出力機能実装パターン - Trip アウトプット形式

## 概要
Tripリソースでは、API応答データから複数の出力形式を選択できる機能が実装されています。
この実装は **共通のInput処理** + **形式別の個別変換関数** パターンを採用しており、今後の機能追加でも同じ方針で実装することを推奨します。

## アーキテクチャ概要

### 実装場所
- メインノード: `nodes/Ride/Ride.node.ts`
- 変換関数群: `utils/converter/{format}/`

### 共通処理フロー

1. **APIデータ取得** - Ride APIからtripデータを取得
2. **データ変換** - APIレスポンスをTripData型に統一変換 (`transformAPITripData`)
3. **前処理オプション** - サニタイズ・ノーマライズ処理（共通パラメータ）
4. **形式別変換** - 選択された各形式に対して個別の変換関数を実行
5. **出力統合** - 複数形式が選択された場合はMERGEモードで統合

## 形式別実装一覧

### 1. Raw Data (`rawData`)
**処理**: Ride.node.ts:727-735
```typescript
if (format === 'rawData') {
    outputs.push({
        json: {
            ...responseData,
            output_format: 'rawData'
        }
    });
}
```
- **変換**: なし（TripDataをそのまま出力）
- **特徴**: 最もシンプルな形式、デバッグやデータ確認用

### 2. KML (`kml`) 
**処理**: Ride.node.ts:738-764  
**変換関数**: `utils/converter/kml/tripToKml.ts`
```typescript
const kmlData = tripToKml(responseData);
// バイナリファイルとして出力
```
- **変換**: GPSトラックをKML XMLファイルに変換
- **出力**: バイナリファイル (`application/vnd.google-earth.kml+xml`)
- **特徴**: GoogleEarth等のGPSアプリで利用可能

### 3. GPX (`gpx`)
**処理**: Ride.node.ts:766-792  
**変換関数**: `utils/converter/gpx/tripToGpx.ts`
```typescript
const gpxData = tripToGpx(responseData);
// バイナリファイルとして出力
```
- **変換**: GPSトラックをGPX XMLファイルに変換
- **出力**: バイナリファイル (`application/gpx+xml`)
- **特徴**: GPS機器・アプリで標準的に使用される形式

### 4. Image (`image`)
**処理**: Ride.node.ts:794-830  
**変換関数**: `utils/converter/staticMap/generateStaticMap.ts`
```typescript
const imageBuffer = await generateStaticMap(this, responseData, itemIndex, imageWidth, imageHeight);
// バイナリファイルとして出力
```
- **変換**: GoogleMaps StaticAPI経由でルート画像生成
- **出力**: バイナリファイル (`image/png`)
- **特徴**: APIキー必須、可視化用途
- **追加パラメータ**: `imageWidth`, `imageHeight`

### 5. GeoJSON (`geojson`)
**処理**: Ride.node.ts:832-845  
**変換関数**: `utils/converter/geojson/tripToGeojson.ts`
```typescript
const geojsonData = tripToGeojson(responseData);
// JSON形式で出力
```
- **変換**: GeoJSON FeatureCollectionに変換
- **出力**: JSON形式
- **特徴**: 地理情報システムで標準的に使用

## 共通設計パターン

### 1. 入力データの共通化
すべての変換関数は `TripData` 型を受け取ります：
```typescript
export function tripToKml(tripData: TripData | KMLTripData): string
export function tripToGpx(tripData: TripData | GPXTripData): string
export function tripToGeojson(tripData: TripData | GeoJSONTripData): GeoJSONFeatureCollection
```

### 2. エラーハンドリング
各変換でのエラーは `ApplicationError` でラップして統一的に処理：
```typescript
try {
    const kmlData = tripToKml(responseData);
    // 処理...
} catch (error) {
    throw new ApplicationError(`Failed to convert trip to KML: ${error.message}`);
}
```

### 3. 停滞ポイント検出の共通化
全形式で `getSignificantLocations()` を使用して停滞ポイントを検出：
```typescript
const stationaryPoints = getSignificantLocations(standardTrackPoints, 15 * 60, 100);
```
- **15分以上**: 滞在時間の閾値
- **100m以内**: 位置の変動範囲

### 4. 出力の統合パターン
複数形式選択時は、各形式の結果を統合して返却：
```typescript
const mergedOutput = {
    formats: ['rawData', 'kml', 'geojson'],
    rawData: {...}, 
    geojson: {...},
    kml: { fileName: '...', mimeType: '...' }
};
```

## 新機能追加時の推奨手順

### 1. 変換関数の実装
`utils/converter/{新形式}/`ディレクトリを作成し、以下を実装：
```typescript
// utils/converter/{新形式}/tripTo{NewFormat}.ts
export function tripToNewFormat(tripData: TripData): OutputType {
    const { trip } = tripData;
    
    // 1. データ検証
    if (!trip.track_points || trip.track_points.length === 0) {
        throw new Error('Trip data must contain at least one track point');
    }
    
    // 2. 形式固有の変換処理
    const convertedData = transformToNewFormat(trip);
    
    return convertedData;
}
```

### 2. メインノードへの統合
`Ride.node.ts` の以下箇所を更新：

**a) outputFormats オプションに追加**:
```typescript
{
    name: 'New Format',
    value: 'newformat',
    description: '新形式の説明'
}
```

**b) executeTripsOperation内に処理を追加**:
```typescript
if (format === 'newformat' && responseData) {
    try {
        const newFormatData = tripToNewFormat(responseData);
        // JSON出力の場合
        outputs.push({
            json: {
                newformat: newFormatData,
                output_format: 'newformat'
            }
        });
        // または、バイナリ出力の場合
        outputs.push({
            json: {
                trip_id: tripId,
                fileName: fileName,
                mimeType: 'application/...',
                output_format: 'newformat'
            },
            binary: { [fileName]: binaryData }
        });
    } catch (error) {
        throw new ApplicationError(`Failed to convert trip to NewFormat: ${error.message}`);
    }
}
```

### 3. ヘルパー関数の活用
既存の共通ヘルパーを活用：
- **停滞ポイント検出**: `getSignificantLocations()`
- **座標変換**: 各converter内のhelper関数
- **データサニタイズ**: `sanitizeTrackPoints()`
- **データ正規化**: `normalizeTrackPoints()`

## 参考実装ファイル

### メイン処理
- `nodes/Ride/Ride.node.ts:698-864` - executeTripsOperation関数

### 変換関数
- `utils/converter/kml/tripToKml.ts` - KML変換実装
- `utils/converter/gpx/tripToGpx.ts` - GPX変換実装  
- `utils/converter/geojson/tripToGeojson.ts` - GeoJSON変換実装
- `utils/converter/staticMap/generateStaticMap.ts` - 画像生成実装

### 共通処理
- `utils/dataTransformer.ts` - API→TripData変換
- `utils/sanitizers.ts` - データサニタイズ
- `utils/normalizers.ts` - データ正規化
- `utils/common/geoUtils.ts` - 停滞ポイント検出

この設計により、新しい出力形式を追加する際も既存のパターンに従って一貫性のある実装が可能です。

## データ処理機能実装パターン - Sanitize & Normalize

Tripの出力形式と同様に、**Sanitize（データ適正化）** と **Normalize（データ正規化）** も、**共通のInput処理** + **個別の処理関数** パターンで実装されています。

### Sanitize機能アーキテクチャ

**エントリポイント**: `utils/sanitizers/trackPointSanitizer.ts`
```typescript
export function sanitizeTrackPoints<T>(points: T[]): T[] {
  // 共通Input: 任意のTrackPoint配列
  if (points.length === 0) return points;
  
  // 個別処理関数の呼び出し
  const sanitized = removeSpeedOutliers(points);
  
  return sanitized;
}
```

**個別処理関数**: `utils/sanitizers/speedOutlierRemover.ts`
- **機能**: 異常な速度データを統計的に検出・除去
- **判定**: 平均 + 3σを超える移動速度を異常値とする
- **処理**: 前後のポイント間速度を計算し、閾値を超える場合そのポイントを除去

### Normalize機能アーキテクチャ

**エントリポイント**: `utils/normalizers/trackPointNormalizer.ts`
```typescript
export function normalizeTrackPoints<T>(
  points: T[], 
  removalLevel: CollinearRemovalLevel = CollinearRemovalLevel.MEDIUM
): T[] {
  // 共通Input: 任意のTrackPoint配列 + 除去強度レベル
  let normalizedPoints = points;
  
  // Step 1: 個別処理関数1 - 共線ポイント除去
  if (hasCoordinateProperties(normalizedPoints[0])) {
    normalizedPoints = removeCollinearPoints(normalizedPoints, removalLevel);
  }
  
  // Step 2: データ種別判定 + 個別処理関数2
  if (hasTimedPointProperties(normalizedPoints[0])) {
    // Trip データ: 停滞ポイント統合も実行
    return consolidateStationaryPoints(normalizedPoints);
  } else {
    // Route データ: 共線ポイント除去のみ
    return normalizedPoints;
  }
}
```

**個別処理関数群**:

1. **共線ポイント除去** - `utils/normalizers/lineDetection.ts`
   - **機能**: ほぼ直線上にある中間ポイントを除去
   - **判定**: ポイントから直線への垂直距離が許容値以下
   - **除去レベル**: LOW(0.2%), MEDIUM(0.35%), HIGH(0.5%)

2. **停滞ポイント統合** - `utils/normalizers/stationaryPointDetection.ts`
   - **機能**: 長時間同じ場所に留まったポイント群を統合
   - **判定**: 100m以内 & 10分以上の停滞
   - **統合**: 開始・中心・終了の3ポイントに縮約

### 設計パターンの共通点

#### 1. 型汎用性の確保
全ての処理関数でジェネリック型`<T>`を使用：
```typescript
export function sanitizeTrackPoints<T>(points: T[]): T[]
export function normalizeTrackPoints<T>(points: T[], level: CollinearRemovalLevel): T[]
export function removeSpeedOutliers<T>(points: T[]): T[]
```

#### 2. タイプガードによる型安全性
処理前にプロパティ存在確認：
```typescript
function hasTimedPointProperties(point: any): point is TimedPoint
function hasCoordinateProperties(point: any): point is CoordinatePoint
```

#### 3. チェーン可能な単一責任関数
各処理関数は独立しており、組み合わせ可能：
```typescript
// Ride.node.ts での使用例
if (sanitizePoints) {
    responseData.trip.track_points = sanitizeTrackPoints(responseData.trip.track_points);
}
if (normalizePoints) {
    responseData.trip.track_points = normalizeTrackPoints(responseData.trip.track_points, removalLevel);
}
```

#### 4. 処理結果のログ出力
全ての処理関数で統一された形式でログ出力：
```typescript
console.log(`[functionName] ${originalCount} → ${finalCount} points (-${removedCount}, ${reductionPercent}% reduction)`);
```

### 新機能追加時の推奨手順

#### 1. Sanitize機能追加
```typescript
// utils/sanitizers/newSanitizer.ts
export function removeNewAnomalies<T>(points: T[]): T[] {
    // 1. 入力検証
    if (points.length === 0) return points;
    
    // 2. 異常値検出・除去ロジック
    const filtered = points.filter(point => isValidPoint(point));
    
    // 3. 統計ログ出力
    console.log(`[removeNewAnomalies] ${points.length} → ${filtered.length} points`);
    
    return filtered;
}

// trackPointSanitizer.ts に追加
const sanitized = removeSpeedOutliers(points);
const furtherSanitized = removeNewAnomalies(sanitized);
```

#### 2. Normalize機能追加
```typescript
// utils/normalizers/newNormalizer.ts
export function optimizeNewPattern<T extends CoordinatePoint>(
    points: T[], 
    threshold: number = 0.001
): T[] {
    // 1. 入力検証
    if (points.length <= 2) return points;
    
    // 2. パターン検出・最適化ロジック
    const optimized = detectAndOptimize(points, threshold);
    
    // 3. 統計ログ出力
    console.log(`[optimizeNewPattern] Optimization complete`);
    
    return optimized;
}

// trackPointNormalizer.ts のStep 1後に追加
normalizedPoints = optimizeNewPattern(normalizedPoints, customThreshold);
```

### 参考実装ファイル

#### Sanitize関数
- `utils/sanitizers/trackPointSanitizer.ts` - エントリポイント
- `utils/sanitizers/speedOutlierRemover.ts` - 速度異常値除去

#### Normalize関数
- `utils/normalizers/trackPointNormalizer.ts` - エントリポイント
- `utils/normalizers/lineDetection.ts` - 共線ポイント除去
- `utils/normalizers/stationaryPointDetection.ts` - 停滞ポイント統合

#### 共通ユーティリティ
- `utils/common/geoUtils.ts` - 地理計算・タイプガード関数

このアーキテクチャにより、データ処理機能も出力形式と同様に一貫したパターンで拡張可能です。