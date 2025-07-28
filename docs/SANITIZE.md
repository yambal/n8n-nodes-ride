# Pointデータサニタイズ機能実装方針

## 概要

TripおよびRouteデータのPointデータ（TrackPoint/RouteTrackPoint）に対する適正化サニタイズ機能を実装する。
GPS追跡データの品質向上、異常値検出・修正、データ整合性確保を目的とする。

**重要**: このサニタイズ機能は、API生データ（APITrackPoint）から可読形式に変換済みの **TrackPoint/RouteTrackPoint** に対して適用する。

## 実装済みの基本方針

### シンプル設計原則
1. **適正化のOn/Off制御はUI画面で行う** - Trip/RouteのUI設定にて選択可能
2. **適正化関数はオプションを持たない** - `sanitizeTrackPoints<T>(points: T[]): T[]` のシンプル設計
3. **受け取った型そのものを返す** - 専用の結果型は作成しない
4. **適正化結果のための型を作成しない** - TrackPoint[], RouteTrackPoint[] をそのまま利用

## 現在のデータ構造分析

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

## サニタイズ要件と検証項目

### 1. 地理座標検証・修正
- **経度範囲**: -180 ≤ longitude ≤ 180
- **緯度範囲**: -90 ≤ latitude ≤ 90
- **異常値処理**: 範囲外の場合は前後の点から補間または除外

### 2. 標高データ検証・修正
- **妥当性範囲**: -500m ≤ elevation ≤ 9000m（死海～エベレスト想定）
- **急激な変化検出**: 前後の点との標高差が異常（例: 1秒で100m上昇）
- **スパイク除去**: 明らかに異常な標高値の平滑化

### 3. 時系列データ整合性（Tripのみ）
- **時間順序**: timestamp の昇順確保
- **重複除去**: 同一タイムスタンプの重複点除去
- **時間間隔検証**: 異常に短い間隔（< 0.1秒）や長い間隔（> 1時間）の検出

### 4. 速度・センサーデータ検証（Tripのみ）
- **速度妥当性**: 0 ≤ speed ≤ 200 m/s（～720 km/h、航空機想定上限）
- **心拍数範囲**: 30 ≤ heartRate ≤ 220 bpm
- **ケイデンス範囲**: 0 ≤ cadence ≤ 300 rpm

### 5. 軌跡連続性検証
- **位置ジャンプ検出**: 前の点から物理的に不可能な移動距離
- **速度整合性**: 位置変化から計算される速度と記録速度の乖離

## 現在の実装アーキテクチャ

### 1. ファイル構成（シンプル化済み）

```
utils/
├── sanitizers/
│   ├── index.ts                    # 関数エクスポートのみ
│   └── trackPointSanitizer.ts     # メイン関数実装
└── types/
    └── sanitizer.types.ts         # 最小限の型定義（BasePoint のみ）
```

### 2. 実装済み関数

```typescript
/**
 * TrackPoint/RouteTrackPoint 共通適正化関数
 * @param points 入力配列
 * @returns 適正化済み配列（同じ型）
 */
export function sanitizeTrackPoints<T extends BasePoint>(points: T[]): T[] {
  // TODO: 実際の適正化処理実装予定
  return points; // 現在はパススルー
}
```

### 3. 基底型定義（最小限）

```typescript
interface BasePoint {
  longitude: number;
  latitude: number; 
  elevation: number;
}
```

## 使用方法

### 基本使用例

```typescript
import { sanitizeTrackPoints } from './utils';
import { TrackPoint } from './types';

// TrackPoint配列の適正化
const trackPoints: TrackPoint[] = [...];
const sanitized: TrackPoint[] = sanitizeTrackPoints(trackPoints);

// RouteTrackPoint配列の適正化  
const routePoints: RouteTrackPoint[] = [...];
const sanitizedRoute: RouteTrackPoint[] = sanitizeTrackPoints(routePoints);
```

### UI制御での統合（予定）

```typescript
// Ride.node.ts での将来の実装例
const sanitizeEnabled = this.getNodeParameter('sanitizePoints', itemIndex) as boolean;

if (sanitizeEnabled) {
  trip.track_points = sanitizeTrackPoints(trip.track_points);
}
```

## 実装状況

### 完了項目
- ✅ 基本関数構造の実装（パススルー版）
- ✅ シンプルな型定義（`BasePoint`のみ）
- ✅ エクスポート設定
- ✅ 既存utilsへの統合

### 今後の実装予定
1. **実際の適正化ロジック実装** - 具体的な処理内容は実装に併せて考察
2. **UI設定の追加** - Ride.node.ts にサニタイズ有効/無効の選択肢追加
3. **dataTransformer.ts との統合** - 条件付きサニタイズ適用

## 設計の利点

### シンプル性の確保
- 関数は単一責任（適正化のみ）
- 型は最小限（不要な複雑さを排除）
- オプションなし（UIで制御）

### 型安全性
- 入力と出力の型が一致
- ジェネリクスで TrackPoint/RouteTrackPoint 両対応
- コンパイル時型チェック

## 要件定義と実装ステップ

### 要件
1. **対象**: Trip（単体）とRoute の Point データに適正化サニタイズ機能を追加
2. **適用範囲**: のちに Route にも適用
3. **制御方法**: UI 画面での On/Off 選択
4. **処理対象**: API から変換済みの TrackPoint/RouteTrackPoint データ
5. **返り値**: 受け取った型そのものを返す（専用型なし）

### 実装ステップ（完了済み）

#### Phase 1: 基本設計と実装
1. ✅ **設計方針策定** - シンプル設計原則の確立
2. ✅ **型定義作成** - 最小限の `BasePoint` 型（後に削除）
3. ✅ **基本関数実装** - `sanitizeTrackPoints<T>(points: T[]): T[]`
4. ✅ **パススルー実装** - 実際の処理は後回し、構造のみ実装

#### Phase 2: 統合作業
5. ✅ **方針変更対応** - dataTransformer との統合を取りやめ
6. ✅ **Ride.node.ts への統合** - UI設定とロジックの直接統合
7. ✅ **UI設定追加** - Trip/Route 用の "Sanitize Track Points" チェックボックス
8. ✅ **処理ロジック実装** - 条件分岐によるサニタイズ適用

#### Phase 3: 最適化と修正
9. ✅ **型エラー修正** - `BasePoint` 制約削除、純粋ジェネリック化
10. ✅ **ESLint対応** - boolean パラメーター説明文を "Whether" で開始
11. ✅ **デバッグログ追加** - 動作確認用ログ出力
12. ✅ **ビルドエラー修正** - 不要な型定義エクスポート削除

### 最終実装内容

#### ファイル構成
```
utils/sanitizers/
├── index.ts                    # sanitizeTrackPoints エクスポートのみ
└── trackPointSanitizer.ts     # メイン関数 + デバッグログ
```

#### 実装済み関数
```typescript
export function sanitizeTrackPoints<T>(points: T[]): T[] {
  console.log(`[sanitizeTrackPoints] Processing ${points.length} track points`);
  // TODO: 実際の適正化処理実装予定
  return points; // 現在はパススルー + ログ出力
}
```

#### UI統合
- **Trip**: `getTrip` 操作で "Sanitize Track Points" チェックボックス
- **Route**: `getRoute` 操作で "Sanitize Track Points" チェックボックス  
- デフォルト: `false`
- 説明: "Whether to apply data sanitization to GPS track points"

#### 処理フロー
```typescript
// 1. APIデータ変換（必須前処理）
const responseData = transformAPITripData(apiResponseData);

// 2. サニタイズ適用（条件付き）
if (sanitizePoints) {
  responseData.trip.track_points = sanitizeTrackPoints(responseData.trip.track_points);
}
```

### 削除した項目（シンプル化のため）

#### 不要と判断した機能
- ❌ `SanitizeOptions` - UIで制御するためオプション不要
- ❌ `SanitizeResult<T>` - 受け取った型そのものを返すため不要  
- ❌ `ValidationIssue` - 適正化結果のための型を作成しない方針
- ❌ `SanitizeStats` - 統計情報は実装に併せて考察
- ❌ `validationRules.ts` - 検証ルールは実装に併せて考察
- ❌ `sanitizer.types.ts` - BasePoint のみで他は不要のため削除

#### 方針の明確化
- 複雑な結果レポート機能は作成しない
- 統計情報収集は作成しない  
- バリデーション詳細は実装時に検討
- dataTransformer は純粋なAPI変換処理として維持