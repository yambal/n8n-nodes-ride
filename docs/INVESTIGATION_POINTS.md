# 調査ポイント候補機能実装ドキュメント

## 概要
Tripデータから **市町村調査用の重要地点** を抽出する機能。外部API調査コストを考慮し、**最大50地点以内** に厳選して提供します。

## 機能の目的

### 想定利用シーン
- **市町村調査**: 地域の重要地点特定
- **都市計画**: 交通パターンの把握
- **商圏分析**: 顧客行動の重要ポイント抽出
- **外部API連携**: 調査コスト削減のための地点厳選

### 設計思想
**「意味のある地点を高優先度、定点的な地点を低優先度」**
- 実際の活動や特異性がある地点を重視
- 機械的な等間隔分割は補完的役割

## スコアリングシステム

### 意味のある地点（高スコア）
| 地点タイプ | スコア | 選出理由 |
|-----------|--------|----------|
| 開始・終了地点 | 100pt | 必須調査地点（住居・主要目的地） |
| 停滞地点 | 80pt | 活動地点（長時間滞在した場所） |
| 四極端地点 | 70pt | 地域境界（最南北東西の範囲確認） |
| 標高ピーク | 60pt | 峠・県境（行政境界・交通要衝） |

### 定点的な地点（低スコア）
| 地点タイプ | スコア | 選出理由 |
|-----------|--------|----------|
| コース10等分 | 20pt | 機械的等分割（補完的調査地点） |
| 30分間隔 | 10pt | 機械的時間間隔（時系列補完） |
| 5km間隔 | 10pt | 機械的距離間隔（距離補完） |

## 実装アーキテクチャ

### ファイル構成
```
utils/converter/investigationPoints/
├── tripToInvestigationPoints.ts  # メイン実装
├── types.ts                     # 型定義
└── index.ts                     # エクスポート
```

## 処理フロー詳細

### 1. 地点抽出・スコア付与
各条件に基づいて調査候補地点を抽出し、スコアを付与：

```typescript
// 開始・終了地点（必須）
SCORE_START_END_POINT = 100

// 停滞地点（getSignificantLocations使用）
SCORE_STATIONARY_POINT = 80

// 四極端地点
SCORE_EXTREME_POINT = 70

// 標高ピーク（1km範囲で最高標高かつ50m以上差）
SCORE_ELEVATION_PEAK = 60

// コース10等分地点
SCORE_COURSE_DIVISION = 20

// 30分間隔地点
SCORE_TIME_INTERVAL = 10

// 5km間隔地点  
SCORE_DISTANCE_INTERVAL = 10
```

### 2. 近接地点マージ処理
**1km以内の地点をマージ（重複排除）**
- 80ポイント以上は削除禁止（保護）
- 低スコア地点を優先削除
- 同スコアの場合は処理順優先

### 3. 距離による加点処理
**地理的バランス調整**
- 最近傍地点までの距離（km）を四捨五入して加点
- 孤立した地点ほど高評価
- 例：最短2.6km → +3ポイント

### 4. 最終選出
- スコア降順ソート
- 上位50地点以内を選出
- `TrackPoint[]`形式で返却

## パフォーマンス最適化

### 実装された最適化
1. **距離計算キャッシュ**
   - 同一地点ペアの重複計算を回避
   - `Map<string, number>`でキャッシュ管理

2. **早期終了処理**
   - マージ処理：条件満足時の即座break
   - 距離計算：10m未満で最短確定

### 計算量改善
- **従来**: O(n²) + O(n²) = 2×O(n²)
- **最適化後**: O(n²) + O(n) = O(n²) ※キャッシュ効果

## 型定義

### ScoredPoint
```typescript
interface ScoredPoint extends TrackPoint {
  score: number;  // 調査優先度スコア
}
```

### InvestigationPointsOptions
```typescript
interface InvestigationPointsOptions {
  maxPoints?: number;  // 最大出力数（デフォルト50）
  stationaryDetection?: {
    minDuration?: number;    // 最小滞在時間（秒）
    maxDistance?: number;    // 最大半径（メートル）
  };
}
```

## 設定可能パラメータ

### スコアリング定数
```typescript
// ファイル上部で定義、調整容易
const SCORE_START_END_POINT = 100;
const SCORE_STATIONARY_POINT = 80;
const SCORE_EXTREME_POINT = 70;
// ...など
```

### 処理パラメータ
```typescript
const PROTECTED_SCORE_THRESHOLD = 80;    // 削除禁止閾値
const MERGE_DISTANCE_THRESHOLD = 1000;   // マージ距離
const ELEVATION_DIFF_THRESHOLD = 50;     // 標高差閾値
// ...など
```

## ログ出力

### 実行時出力情報
1. **マージ処理結果**
   - マージ前後の件数
   - 削除された地点数

2. **距離加点処理**
   - 各地点の最短距離と加点
   - 合計加点数

3. **最適化統計**
   - キャッシュ効果

4. **最終選出結果**
   - スコア分布
   - 全選出地点詳細

## メインノード統合

### Ride.node.ts の変更点
```typescript
// インポート
import { tripToInvestigationPoints } from '../../utils/converter/investigationPoints';

// outputFormats に追加
{
  name: 'Investigation Points',
  value: 'investigationPoints',
  description: 'Extract key investigation points for municipal surveys (max 50 points)'
}

// 変換処理
if (format === 'investigationPoints' && responseData) {
  const investigationPointsData = tripToInvestigationPoints(responseData, {
    maxPoints: 50
  });
  
  outputs.push({
    json: {
      investigationPoints: investigationPointsData,
      output_format: 'investigationPoints'
    }
  });
}
```

## 使用方法

### n8nワークフロー
1. Rideノードを配置
2. Resource: `trips`
3. Operation: `getTrip` 
4. Output Formats: `Investigation Points`選択
5. 実行 → 最大50地点の調査候補が出力

### 出力形式
```json
{
  "formats": ["investigationPoints"],
  "investigationPoints": [
    {
      "longitude": 139.123456,
      "latitude": 35.123456, 
      "elevation": 150,
      "timestamp": 1640995200,
      "speed": 5.2
    }
    // ...最大50地点
  ]
}
```

## 今後の拡張性

### 容易な調整項目
- **スコア値**: ファイル上部の定数変更のみ
- **最大出力数**: options.maxPoints
- **距離閾値**: 各種THRESHOLD定数
- **時間間隔**: TIME_INTERVAL_SECONDS

### 新しい地点タイプ追加
1. 新スコア定数定義
2. 抽出ロジック追加
3. スコア付与処理追加

この実装により、市町村調査に最適化された重要地点抽出機能が完成しました。