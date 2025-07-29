# GeoJSON実装知見・課題記録

## 実装概要

n8n-nodes-rideにTripリソース用のGeoJSON出力フォーマットを追加実装。

### 完了した作業

#### Phase 1: GeoJSONコンバーター作成 ✅
- `utils/converter/geojson/` ディレクトリ作成
- **types.ts**: RFC 7946準拠のGeoJSON型定義
  - `GeoJSONFeature`, `GeoJSONFeatureCollection`
  - `GeoJSONGeometry` (Point, LineString)
  - `GeoJSONTripData`, `GeoJSONTrackPoint`
- **geojsonHelpers.ts**: ユーティリティ関数群
  - 座標変換 (`trackPointToCoordinate`)
  - 境界ボックス計算 (`calculateBBox`)
  - Feature生成 (`createPointFeature`, `createLineStringFeature`)
  - データフォーマット (`formatDuration`, `formatDistance`, `formatSpeed`)
- **tripToGeojson.ts**: メイン変換関数
  - TripData → GeoJSON FeatureCollection変換
  - LineString feature（軌跡）生成
  - Point features（重要地点）生成
  - メタデータをpropertiesに設定
- **index.ts**: エクスポートファイル

#### Phase 2: Ride.node.ts統合 ✅
- 出力フォーマット選択肢に'GeoJSON'追加
- `tripToGeojson`関数インポート
- GeoJSON変換・出力処理実装（JSONオブジェクトとして出力）
- エラーハンドリング実装

## 重要な設計決定

### 1. 出力形式の違い
- **KML/GPX**: バイナリファイルとして出力（`prepareBinaryData`使用）
- **GeoJSON**: JSONオブジェクトとして直接出力（文字列変換不要）

### 2. 座標系・座標順序
- **座標系**: WGS84 (RFC 7946準拠)
- **座標順序**: 経度,緯度 (longitude, latitude)
- **座標検証**: 経度±180度、緯度±90度の範囲チェック

### 3. Feature構成
- **LineString**: トリップ全体の軌跡（track_points）
- **Point**: 停滞ポイント（getSignificantLocationsで検出、15分以上・100m以内）

## 遭遇した技術的課題

### 1. TypeScript型の不整合

#### 問題
既存の`Trip`型と`GeoJSONTripData`型でプロパティ名が異なる：

```typescript
// Trip型（既存）
interface Trip {
  average_speed?: number;  // snake_case
  departed_at: string;
  // ...
}

// GeoJSONTripData型（新規）
interface GeoJSONTripData {
  trip: {
    avg_speed?: number;      // abbreviated
    start_time?: string;
    // ...
  }
}
```

#### 未解決の型エラー
```
Property 'average_speed' does not exist on type 'Trip | GeoJSONTripData'
Property 'departed_at' does not exist on type 'Trip | GeoJSONTripData'
```

#### 対処方針
1. **型キャスト使用** (`trip as any`) - 暫定対応
2. **型ガード実装** - より安全な方法
3. **共通型インターフェース作成** - 根本解決

### 2. 既存型定義の制約

#### TrackPoint.timestamp型
- **既存**: `number` (Unix timestamp)
- **GeoJSON用**: `Date | string | number` に拡張が必要

#### 未存在フィールド
現在の`Trip`型に存在しないフィールド：
- `stopped_time` (停止時間)
- `stationary_points` (停滞ポイント)
- `start_time`, `end_time` (開始・終了時刻)

#### 対処
- 存在しないフィールドは`null`で埋める
- `getSignificantLocations`で代替的に重要地点を検出

### 3. 依存関係の課題

#### `getSignificantLocations`関数
- `utils/common/geoUtils`から import  
- **修正済み**: KML/GPXと同じパラメータ(`15*60, 100`)を使用
- 戻り値の型が`TimestampedPoint[]`だが、期待する型と不一致
- プロパティ（`name`, `visitCount`, `totalDuration`）が存在しない

## 推奨する解決策

### 1. 型安全性の向上

```typescript
// 型ガードを使用した安全な型チェック
function isStandardTrip(trip: any): trip is Trip {
  return 'departed_at' in trip;
}

function isGeoJSONTrip(trip: any): trip is GeoJSONTripData['trip'] {
  return 'start_time' in trip;
}

// 使用例
const avgSpeed = isStandardTrip(trip) 
  ? trip.average_speed 
  : isGeoJSONTrip(trip) 
    ? trip.avg_speed 
    : null;
```

### 2. 統一型インターフェースの作成

```typescript
// 両方の型をサポートする統一インターフェース
interface UnifiedTripData {
  id: number;
  name?: string;
  distance?: number;
  // 共通フィールド...
  
  // 型固有フィールド（オプション）
  average_speed?: number;  // Trip型用
  avg_speed?: number;      // GeoJSON型用
  departed_at?: string;    // Trip型用
  start_time?: string;     // GeoJSON型用
}
```

### 3. エラーハンドリング強化

```typescript
try {
  const geojsonData = tripToGeojson(responseData);
  // 成功時の処理
} catch (error) {
  if (error.message.includes('coordinate')) {
    // 座標エラー
  } else if (error.message.includes('track point')) {
    // トラックポイントエラー
  }
  throw new ApplicationError(`Failed to convert trip to GeoJSON: ${error.message}`);
}
```

## 次のアクション項目

1. **型エラー完全修正**: 型キャストを型ガードに置き換え
2. **単体テスト実装**: 各ヘルパー関数とメイン変換関数
3. **統合テスト**: Ride.node.ts経由でのGeoJSON出力テスト
4. **バリデーション追加**: GeoJSON仕様準拠チェック
5. **パフォーマンス最適化**: 大量トラックポイント処理
6. **ドキュメント更新**: README.mdへのGeoJSON対応記載

## 参考情報

- **GeoJSON仕様**: RFC 7946
- **座標系**: WGS84 (EPSG:4326) 
- **MIME Type**: `application/geo+json`
- **既存実装参考**: `utils/converter/kml/`, `utils/converter/gpx/`