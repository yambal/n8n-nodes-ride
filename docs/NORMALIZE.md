# Pointデータノーマライズ機能実装仕様

## 概要

TripデータのTrackPointに対する停滞ポイント統合機能を実装。
GPS追跡データから停滞地点を検出し、開始・中心・終了の3点に集約することで、データサイズの削減と軌跡の可読性向上を図る。

**重要**: このノーマライズ機能は、API生データ（APITrackPoint）から可読形式に変換済みの **TrackPoint** に対して適用する。

## 実装済み機能

### 停滞ポイント統合
- **対象**: タイムスタンプを持つTripデータのみ（RouteTrackPointには適用されない）
- **検出条件**: 100m以内に10分以上滞在した地点
- **統合方法**: 停滞グループを「開始点 → 中心点 → 終了点」の3点に集約
- **計算方式**: Haversine公式による正確な距離計算と時間平均

## 現在の実装アーキテクチャ

### ファイル構成
```
utils/
├── normalizers/
│   ├── index.ts                       # 関数エクスポートのみ
│   └── stationaryPointDetection.ts    # 既存API互換エクスポート
├── common/
│   ├── geoUtils.ts                    # 汎用地理計算・停滞検知
│   └── stationaryPointDetector.ts     # 停滞ポイント統合処理
└── normalizers/
    └── trackPointNormalizer.ts        # メイン関数
```

### 実装済み関数

#### メイン関数（trackPointNormalizer.ts）
```typescript
export function normalizeTrackPoints<T>(points: T[]): T[] {
  if (hasTimestamp(points)) {
    return consolidateStationaryPoints(points);
  }
  
  console.log(`[normalizeTrackPoints] Route data normalization not implemented yet`);
  return points;
}
```

#### 停滞ポイント統合（stationaryPointDetector.ts）
```typescript
export function consolidateStationaryPoints<T extends TimestampedPoint>(points: T[]): T[] {
  // 停滞グループ検出 → 3点統合 → データ削減
}
```

#### 汎用停滞検知（geoUtils.ts）
```typescript
export function detectStationaryGroups<T extends TimestampedPoint>(
  points: T[], 
  options: StationaryDetectionOptions = {}
): StationaryGroup<T>[] {
  // 汎用的な停滞ポイント検知アルゴリズム
}
```

## データ構造

### Trip TrackPoint構造
```typescript
interface TrackPoint extends TimestampedPoint {
  longitude: number;    // 経度（度）
  latitude: number;     // 緯度（度） 
  elevation: number;    // 標高（m）
  timestamp: number;    // タイムスタンプ（Unix秒）
  speed?: number;       // 速度（m/s）- 使用されない
  heartRate?: number;   // 心拍数（bpm）- 保持される
  cadence?: number;     // ケイデンス（rpm）- 保持される
}
```

### Route TrackPoint構造
```typescript
interface RouteTrackPoint {
  longitude: number;    // 経度（度）
  latitude: number;     // 緯度（度）
  elevation: number;    // 標高（m）
  // タイムスタンプなし → 現在処理対象外
}
```

## 処理詳細

### 停滞グループ検出
1. **距離判定**: 開始点から100m以内にあるポイントをグループ化
2. **時間判定**: 10分以上継続した滞在をグループとして認定
3. **中心点計算**: グループ内ポイントの座標・タイムスタンプ平均値

### ポイント統合
1. **統合前**: 停滞グループ内の全ポイント（例：50ポイント）
2. **統合後**: 開始・中心・終了の3ポイント
3. **データ保持**: 元ポイントの全プロパティを保持（speed, heartRate, cadenceなど）

### 削減効果
- **一般的な削減率**: 30-70%（停滞時間の割合による）
- **停滞地点の可視化**: StaticMapでオレンジマーカーとして表示

## UI統合

### 設定項目
- **Trip**: `getTrip` 操作で "Normalize Track Points" チェックボックス
- **Route**: `getRoute` 操作で "Normalize Track Points" チェックボックス（効果なし）
- **デフォルト**: `false`
- **説明**: "Whether to consolidate stationary points to reduce data size"

### 処理フロー
```typescript
// 1. APIデータ変換（必須前処理）
const responseData = transformAPITripData(apiResponseData);

// 2. サニタイズ適用（条件付き）
if (sanitizePoints) {
  responseData.trip.track_points = sanitizeTrackPoints(responseData.trip.track_points);
}

// 3. ノーマライズ適用（条件付き）
if (normalizePoints) {
  responseData.trip.track_points = normalizeTrackPoints(responseData.trip.track_points);
}
```

## 使用例

```typescript
import { normalizeTrackPoints } from './utils/normalizers';

const trackPoints: TrackPoint[] = [...]; // 1000ポイント（停滞多数）
const normalized: TrackPoint[] = normalizeTrackPoints(trackPoints); // ~400ポイント（60%削減）
```

## StaticMap統合

停滞ポイント検知機能はStaticMap生成でも活用されています：

```typescript
// StaticMap用の重要な停滞地点抽出
const stationaryPoints = getSignificantLocations(trackPoints, 15 * 60, 100); // 15分以上
// → オレンジマーカーとして地図に表示
```

## 汎用ユーティリティ

### 距離計算
```typescript
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number
```

### 停滞地点抽出
```typescript
export function getSignificantLocations<T extends TimestampedPoint>(
  points: T[], 
  minDuration: number = 30 * 60, 
  maxDistance: number = 200
): T[]
```

### マーカー抽出
```typescript
export function extractStationaryMarkers<T extends TimestampedPoint>(groups: StationaryGroup<T>[]): T[]
```

## 実装されていない項目

以下の機能は現在実装されていません：

- ❌ RouteTrackPointの距離ベース間引き
- ❌ Douglas-Peucker アルゴリズムによる軌跡最適化
- ❌ 時間ベース間引き（短時間間隔ポイント削除）
- ❌ 設定可能な閾値パラメータ

## 設計原則

### シンプル性の確保
- 関数は単一責任（停滞ポイント統合のみ）
- オプションなし（UIで制御）
- 汎用ユーティリティとの分離

### 再利用性
- 汎用地理計算関数の独立実装
- StaticMap等の他機能での活用
- 設定可能な検出パラメータ

### データ整合性
- 開始・終了点の必須保持
- 元データのプロパティ継承
- 軌跡形状の基本保持