# GeoJSON対応仕様書

## 概要
n8n-nodes-rideでTripリソースにGeoJSONフォーマット出力を追加する。

## 現状確認
現在Tripリソースは以下の出力フォーマットに対応：
- **Data**: トリップの生データ（JSON形式）
- **KML**: GPS/マッピングアプリケーション用KMLフォーマット  
- **GPX**: GPSデバイス・アプリケーション用GPXフォーマット
- **Image**: トリップの静的マップ画像（PNG形式）

## 要件

### 1. 機能要件
- TripのGet操作でGeoJSON出力フォーマットを選択可能にする
- 既存の出力フォーマット（Data、KML、GPX、Image）と同様に複数選択対応
- GeoJSONファイルはバイナリデータとして出力（.geojsonファイル）

### 2. データ要件
- トリップの軌跡データ（track_points）をGeoJSON LineString形式で出力
- 停滞ポイント（stationary_points）をGeoJSON Point形式で出力  
- メタデータ（トリップID、距離、時間など）をGeoJSONのpropertiesに含める
- 座標系: WGS84 (EPSG:4326)

### 3. ファイル形式要件
- **出力形式**: JSONデータとして出力（KML/GPXのようなバイナリファイルではない）
- MIME Type: `application/geo+json`
- エンコーディング: UTF-8

## 実装方針

### 1. 既存コンバーターの構成調査

#### KMLコンバーター構成
```
utils/converter/kml/
├── index.ts           # エクスポート (tripToKml, kmlHelpers, types)
├── types.ts           # KML型定義 (KMLTrackPoint, KMLTripData, KMLStyle, KMLPlacemark)
├── tripToKml.ts       # Trip→KML変換メイン関数
└── kmlHelpers.ts      # ヘルパー関数 (escapeXml, formatDuration, formatDistance, generateKMLStyle等)
```

#### GPXコンバーター構成  
```
utils/converter/gpx/
├── index.ts           # エクスポート (tripToGpx, GPXTripData, GPXTrackPoint)
├── types.ts           # GPX型定義 (GPXTrackPoint, GPXTripData)
├── tripToGpx.ts       # Trip→GPX変換メイン関数
└── gpxHelpers.ts      # ヘルパー関数 (escapeXml, formatDuration, generateGPXMetadata等)
```

#### 静的マップ構成
```
utils/converter/staticMap/
├── index.ts                # エクスポート (generateStaticMap)
└── generateStaticMap.ts    # 静的マップ画像生成
```

### 2. GeoJSONコンバーター構成設計
既存パターンに従い、以下の構成で実装：

```
utils/converter/geojson/
├── index.ts              # エクスポート (tripToGeojson, types, helpers)
├── types.ts              # GeoJSON型定義 
│                         #   - GeoJSONFeature, GeoJSONFeatureCollection
│                         #   - GeoJSONGeometry (Point, LineString)
│                         #   - GeoJSONTripData, GeoJSONTrackPoint
├── tripToGeojson.ts      # Trip→GeoJSON変換メイン関数
│                         #   - FeatureCollectionオブジェクト生成
│                         #   - LineString（軌跡）とPoint（停滞点）作成
│                         #   - JSONオブジェクトを返却（文字列ではない）
└── geojsonHelpers.ts     # ヘルパー関数
                          #   - 座標変換 (x,y → longitude,latitude)
                          #   - bbox計算
                          #   - Feature生成ユーティリティ
```

**重要**: GeoJSONはJSONオブジェクトとして出力するため、KML/GPXとは異なり文字列変換は不要。

### 3. 共通パターンの特徴
- **index.ts**: 外部向けエクスポートのみ（1-5行程度）
- **types.ts**: 変換用の型定義（TrackPoint、TripDataの専用型）
- **tripToXxx.ts**: メイン変換関数（TripData | XxxTripData を受け取り文字列/オブジェクトを返す）
  - KML/GPX: 文字列（XML）を返却
  - **GeoJSON: JSONオブジェクトを返却**
- **xxxHelpers.ts**: ユーティリティ関数（XML/JSON処理、フォーマット、座標変換等）

### 4. 変換仕様
- FeatureCollection形式で出力
- Features:
  - トラック: LineString（全track_pointsを結ぶ線）
  - 停滞ポイント: Point（getSignificantLocationsで検出、15分以上・100m以内）
- Properties:
  - トラック: trip全体のメタデータ
  - 停滞ポイント: 各ポイントの詳細情報（座標、タイムスタンプ）
- **統一性**: KML/GPXコンバーターと同じ停滞ポイント検出条件

### 5. 実装ステップ

#### Phase 1: GeoJSONコンバーター作成
- [x] `utils/converter/geojson/` ディレクトリ作成
- [x] `types.ts` - GeoJSON型定義ファイル作成
  - [x] `GeoJSONFeature`, `GeoJSONFeatureCollection` 型定義
  - [x] `GeoJSONGeometry` (Point, LineString) 型定義  
  - [x] `GeoJSONTripData`, `GeoJSONTrackPoint` 型定義
- [x] `geojsonHelpers.ts` - ヘルパー関数作成
  - [x] 座標変換関数 (x,y → longitude,latitude)
  - [x] bbox計算関数
  - [x] Feature生成ユーティリティ関数
- [x] `tripToGeojson.ts` - メイン変換関数作成
  - [x] TripData → FeatureCollection変換
  - [x] LineString feature（軌跡）生成
  - [x] Point features（停滞点）生成  
  - [x] Properties設定（メタデータ）
- [x] `index.ts` - エクスポートファイル作成

#### Phase 2: Ride.node.ts統合
- [x] Trip Get操作の出力フォーマット選択肢に'GeoJSON'追加
- [x] GeoJSON変換・出力処理の実装
  - [x] `tripToGeojson` 関数インポート
  - [x] GeoJSON形式での出力処理追加
  - [x] JSONオブジェクトとして出力（バイナリ不要）
- [x] エラーハンドリング実装
  - [x] 変換失敗時のエラー処理
  - [x] 適切なエラーメッセージ設定

#### Phase 3: テスト・検証 ⚠️ 型エラーのため保留中
- [ ] **型エラー修正が必要** (優先度: 高)
  - [ ] Trip型とGeoJSONTripData型の不整合解決
  - [ ] 型キャスト (`as any`) を型ガードに置き換え
  - [ ] 存在しないプロパティ（`average_speed`, `departed_at`等）の対処
- [ ] 単体テスト実装
  - [ ] 各ヘルパー関数のテスト
  - [ ] `tripToGeojson` 関数のテスト
- [ ] 統合テスト
  - [ ] Ride.node.ts経由でのGeoJSON出力テスト
  - [ ] 複数フォーマット同時出力テスト
- [ ] GeoJSON仕様準拠検証
  - [ ] RFC 7946準拠チェック
  - [ ] 座標系・座標順序確認
  - [ ] MIME Type確認

#### Phase 4: ドキュメント・仕上げ
- [x] 実装知見のドキュメント化 (`GEOJSON_IMPLEMENTATION_NOTES.md`)
- [ ] README.md更新（GeoJSON対応追記）
- [ ] ビルド・リント確認
- [ ] 最終動作確認

## 現在の課題・制約

### 🚨 TypeScript型エラー（未解決）
- **Problem**: `Trip`型と`GeoJSONTripData`型のプロパティ名不一致
- **Impact**: `npm run build` が失敗する
- **Solution**: 型ガードまたは統一型インターフェースが必要

詳細は [`GEOJSON_IMPLEMENTATION_NOTES.md`](./GEOJSON_IMPLEMENTATION_NOTES.md) を参照

## GeoJSONファイルフォーマット仕様 (RFC 7946)

### 1. 基本仕様
- **MIME Type**: `application/geo+json`
- **ファイル拡張子**: `.geojson`
- **エンコーディング**: UTF-8
- **座標系**: WGS84 (World Geodetic System 1984)
- **座標順序**: 経度,緯度 (longitude, latitude)

### 2. オブジェクト構造

#### 2.1 FeatureCollection
最上位オブジェクト。複数のFeatureを含む。
```json
{
  "type": "FeatureCollection",
  "bbox": [west, south, east, north],  // オプション：境界ボックス
  "features": [...]
}
```

#### 2.2 Feature
地理的特徴を表現するオブジェクト。
```json
{
  "type": "Feature",
  "geometry": {...},     // 必須：geometry オブジェクト
  "properties": {...}    // オプション：属性データ（任意のJSONオブジェクトまたはnull）
}
```

#### 2.3 Geometry Types
サポートされる7つのgeometry type：

**Point**
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

**LineString**
```json
{
  "type": "LineString", 
  "coordinates": [[lng1, lat1], [lng2, lat2], ...]
}
```

**Polygon**
```json
{
  "type": "Polygon",
  "coordinates": [
    [[lng1, lat1], [lng2, lat2], ..., [lng1, lat1]]  // 外側の境界（閉じたリング）
  ]
}
```

**MultiPoint, MultiLineString, MultiPolygon, GeometryCollection**もサポート

### 3. Properties仕様
- 任意のJSONオブジェクトまたは`null`
- 文字列、数値、真偽値、配列、オブジェクト等すべてのJSON型に対応
- 地理的特徴の属性情報（名前、ID、メタデータ等）を格納

### 4. 境界ボックス (bbox)
- オプション要素
- 2次元の場合: `[west, south, east, north]`
- geometryと同じ座標順序に従う

## 技術仕様

### GeoJSON構造例（本プロジェクト用）
```json
{
  "type": "FeatureCollection",
  "bbox": [139.123, 35.456, 139.789, 35.678],
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [139.691706, 35.689487],  // 経度,緯度順
          [139.692345, 35.690123], 
          [139.693456, 35.691234]
        ]
      },
      "properties": {
        "type": "track",
        "tripId": "12345",
        "distance": 1500.5,
        "duration": 3600,
        "startTime": "2024-01-01T09:00:00Z",
        "endTime": "2024-01-01T10:00:00Z"
      }
    },
    {
      "type": "Feature", 
      "geometry": {
        "type": "Point",
        "coordinates": [139.692345, 35.690123]
      },
      "properties": {
        "type": "stationary_point",
        "duration": 300,
        "timestamp": "2024-01-01T09:30:00Z"
      }
    }
  ]
}
```

## 参考
- GeoJSON仕様: https://geojson.org/
- 既存変換処理: `utils/converter/kml/`, `utils/converter/gpx/`