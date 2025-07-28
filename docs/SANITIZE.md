# Pointデータサニタイズ機能実装仕様

## 概要

TripデータのTrackPointに対する速度異常値除去機能を実装。
位置とタイムスタンプから速度を計算し、統計的手法により異常な速度のポイントを除去することで、GPS追跡データの品質向上を図る。

**重要**: このサニタイズ機能は、API生データ（APITrackPoint）から可読形式に変換済みの **TrackPoint** に対して適用する。

## 実装済み機能

### 速度異常値除去
- **対象**: タイムスタンプを持つTripデータのみ（RouteTrackPointには適用されない）
- **検出方法**: 前後のポイント間の距離・時間から速度を計算
- **除去条件**: 平均 + 3標準偏差を超える速度のポイントを異常値として除去
- **計算方式**: Haversine公式による正確な距離計算

## 現在の実装アーキテクチャ

### ファイル構成
```
utils/sanitizers/
├── index.ts                     # 関数エクスポートのみ
├── trackPointSanitizer.ts      # メイン関数
└── speedOutlierRemover.ts      # 速度異常値除去ヘルパー
```

### 実装済み関数

#### メイン関数
```typescript
export function sanitizeTrackPoints<T>(points: T[]): T[] {
  console.log(`[sanitizeTrackPoints] Processing ${points.length} track points`);
  
  if (points.length === 0) {
    return points;
  }

  // 速度異常の削除
  const sanitized = removeSpeedOutliers(points);
  
  console.log(`[sanitizeTrackPoints] Sanitized ${points.length} -> ${sanitized.length} points`);
  return sanitized;
}
```

#### 速度異常値除去ヘルパー（speedOutlierRemover.ts）
```typescript
export function removeSpeedOutliers<T>(points: T[]): T[] {
  // 統計計算 → 異常値検出 → ポイント除去
}
```

## データ構造

### Trip TrackPoint構造
```typescript
interface TrackPoint {
  longitude: number;    // 経度（度）
  latitude: number;     // 緯度（度） 
  elevation: number;    // 標高（m）
  timestamp: number;    // タイムスタンプ（Unix秒）
  speed?: number;       // 速度（m/s）- 使用されない
  heartRate?: number;   // 心拍数（bpm）- 処理対象外
  cadence?: number;     // ケイデンス（rpm）- 処理対象外
}
```

## 処理詳細

### 速度計算
1. **距離計算**: Haversine公式で前後ポイント間の距離（m）を算出
2. **時間差計算**: タイムスタンプの差（秒）
3. **速度算出**: 距離 ÷ 時間 = 速度（m/s）

### 統計的異常値検出
1. **統計計算**: 全ポイント間の速度の平均値・標準偏差を算出
2. **閾値設定**: 平均 + 3σを異常値の閾値とする
3. **異常値除去**: 閾値を超える速度を持つポイントを除去

### ログ出力
- 処理開始・完了時の詳細情報
- 速度統計情報（平均・標準偏差・閾値）をkm/h表示
- 異常値検出時の個別ログ
- 削除数・削除率の集計結果

## UI統合

### 設定項目
- **Trip**: `getTrip` 操作で "Sanitize Track Points" チェックボックス
- **Route**: `getRoute` 操作で "Sanitize Track Points" チェックボックス（効果なし）
- **デフォルト**: `false`
- **説明**: "Whether to apply data sanitization to GPS track points"

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
import { sanitizeTrackPoints } from './utils/sanitizers';

const trackPoints: TrackPoint[] = [...]; // 1000ポイント
const sanitized: TrackPoint[] = sanitizeTrackPoints(trackPoints); // ~950ポイント（異常値5%除去）
```

## 実装されていない項目

以下の機能は現在実装されていません：

- ❌ 地理座標検証・修正（緯度経度範囲チェック）
- ❌ 標高データ検証・修正
- ❌ 時系列データ整合性（タイムスタンプ順序・重複除去）
- ❌ センサーデータ検証（心拍数・ケイデンス）
- ❌ 軌跡連続性検証（位置ジャンプ検出）

## 設計原則

### シンプル性の確保
- 関数は単一責任（速度異常値除去のみ）
- オプションなし（UIで制御）
- ヘルパー関数への分離で機能明確化

### 型安全性
- 入力と出力の型が一致
- ジェネリクスでTripデータに適用
- タイムスタンプ有無の動的判定