# Pointデータノーマライズ機能実装方針

## 概要

TripおよびRouteデータのPointデータ（TrackPoint/RouteTrackPoint）に対するノーマライズ（正規化・間引き）機能を実装する。
無駄なデータポイントを間引くことで、データサイズの削減、処理速度の向上、ストレージ効率の改善を目的とする。

**重要**: このノーマライズ機能は、API生データ（APITrackPoint）から可読形式に変換済みの **TrackPoint/RouteTrackPoint** に対して適用する。

## 基本方針（サニタイズ機能と同様）

### シンプル設計原則
1. **ノーマライズのOn/Off制御はUI画面で行う** - Trip/RouteのUI設定にて選択可能
2. **ノーマライズ関数はオプションを持たない** - `normalizeTrackPoints<T>(points: T[]): T[]` のシンプル設計
3. **受け取った型そのものを返す** - 専用の結果型は作成しない
4. **ノーマライズ結果のための型を作成しない** - TrackPoint[], RouteTrackPoint[] をそのまま利用

## データ構造（サニタイズと共通）

### Trip TrackPoint構造
```typescript
interface TrackPoint {
  longitude: number;    // 経度（度）
  latitude: number;     // 緯度（度） 
  elevation: number;    // 標高（m）
  timestamp: number;    // タイムスタンプ（Unix時間）
  speed?: number;       // 速度（m/s）- オプション
  heartRate?: number;   // 心拍数（bpm）- オプション
  cadence?: number;     // ケイデンス（rpm）- オプション
}
```

### Route TrackPoint構造
```typescript
interface RouteTrackPoint {
  longitude: number;    // 経度（度）
  latitude: number;     // 緯度（度）
  elevation: number;    // 標高（m）
}
```

## ノーマライズ要件と間引き手法

（これから一緒に考察・定義予定）

## 実装アーキテクチャ

### 1. ファイル構成（サニタイズと並行）

```
utils/
├── normalizers/
│   ├── index.ts                     # 関数エクスポートのみ
│   └── trackPointNormalizer.ts      # メイン関数実装
└── types/
    └── normalizer.types.ts          # 必要に応じて最小限の型定義
```

### 2. 実装予定関数

```typescript
/**
 * TrackPoint/RouteTrackPoint 共通ノーマライズ関数
 * @param points 入力配列
 * @returns ノーマライズ済み配列（同じ型、削減されたポイント数）
 */
export function normalizeTrackPoints<T>(points: T[]): T[] {
  // TODO: 実際のノーマライズ処理実装予定
  return points; // 初期実装はパススルー
}
```

### 3. ノーマライズ手法の選択基準

#### Trip データ（タイムスタンプ有り）
1. **時間ベース間引き**: 短時間間隔のポイント削除
2. **距離ベース間引き**: 近距離ポイント削除
3. **優先順位**: 時間ベース → 距離ベース

#### Route データ（タイムスタンプ無し）
1. **距離ベース間引き**: 近距離ポイント削除のみ
2. **Douglas-Peucker アルゴリズム**: 形状保持重視の場合

## 使用方法

### 基本使用例

```typescript
import { normalizeTrackPoints } from './utils';
import { TrackPoint } from './types';

// TrackPoint配列のノーマライズ
const trackPoints: TrackPoint[] = [...]; // 1000ポイント
const normalized: TrackPoint[] = normalizeTrackPoints(trackPoints); // ~300ポイント

// RouteTrackPoint配列のノーマライズ  
const routePoints: RouteTrackPoint[] = [...]; // 500ポイント
const normalizedRoute: RouteTrackPoint[] = normalizeTrackPoints(routePoints); // ~150ポイント
```

### UI制御での統合（予定）

```typescript
// Ride.node.ts での将来の実装例
const normalizeEnabled = this.getNodeParameter('normalizePoints', itemIndex) as boolean;

if (normalizeEnabled) {
  trip.track_points = normalizeTrackPoints(trip.track_points);
}
```

## 実装ステップ

### Phase 1: 基本設計と実装
1. **設計方針策定** - シンプル設計原則の確立（サニタイズと同様）
2. **基本関数実装** - `normalizeTrackPoints<T>(points: T[]): T[]`
3. **パススルー実装** - 実際の処理は後回し、構造のみ実装

### Phase 2: コア機能実装
（具体的な実装内容は要件定義後に決定）

### Phase 3: 統合作業
4. **Ride.node.ts への統合** - UI設定とロジックの統合
5. **UI設定追加** - Trip/Route 用の "Normalize Track Points" チェックボックス
6. **処理ロジック実装** - 条件分岐によるノーマライズ適用

## 期待される効果

### データサイズ削減
- **一般的な削減率**: 60-80%（記録密度による）
- **ストレージ効率**: APIレスポンス、データベース容量の削減
- **転送効率**: ネットワーク帯域使用量の削減

### 処理性能向上
- **描画性能**: マップ表示、KML変換の高速化
- **分析処理**: 統計計算、解析処理の高速化
- **メモリ使用量**: 大量ポイントデータの軽量化

### データ品質
- **ノイズ除去**: GPS精度誤差による微細な揺れの除去
- **可読性向上**: 重要な軌跡特徴の強調
- **視覚的改善**: 地図表示でのライン品質向上

## 設計の利点（サニタイズと共通）

### シンプル性の確保
- 関数は単一責任（ノーマライズのみ）
- 型は最小限（不要な複雑さを排除）
- オプションなし（UIで制御）

### 型安全性
- 入力と出力の型が一致
- ジェネリクスで TrackPoint/RouteTrackPoint 両対応
- コンパイル時型チェック

### 既存システムとの親和性
- サニタイズ機能と同じ実装パターン
- 既存のデータ変換フローに自然に統合
- 段階的な機能追加が可能

## 注意事項

### データ整合性
- ノーマライズ後もGPS軌跡の基本的な形状を保持
- 開始・終了点は必ず保持
- 極端な削減は避ける（最低限のポイント数を確保）

### 設定バランス
- 削減率と品質のトレードオフを考慮
- 用途に応じた最適な閾値設定
- ユーザーフィードバックによる調整

### パフォーマンス
- 大量データ処理時のメモリ使用量監視
- 計算量O(n)以下のアルゴリズム選択
- 必要に応じたバッチ処理の検討