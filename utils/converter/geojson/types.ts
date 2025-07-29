/**
 * GeoJSON変換関連の型定義
 * 
 * このファイルには、RFC 7946 GeoJSON仕様に準拠した型定義が含まれています。
 * Rideサービスのトリップデータを標準的なGeoJSON形式に変換するために使用されます。
 * 
 * 主な型カテゴリ：
 * - 座標・位置に関する型（Coordinate, Position）
 * - GeoJSONジオメトリ型（Point, LineString）
 * - GeoJSON Feature型（Feature, FeatureCollection）
 * - トリップデータ専用型（TripData, TrackPoint）
 * 
 * @see https://tools.ietf.org/html/rfc7946 - GeoJSON仕様
 */

/**
 * GeoJSON座標配列 [経度, 緯度]
 * 
 * GeoJSON仕様では座標を[経度, 緯度]の順序で記録する。
 * 注意：一般的な[緯度, 経度]とは順序が逆なので要注意。
 */
export type GeoJSONCoordinate = [number, number];

/**
 * GeoJSON位置座標（標高情報を含む可能性がある座標）
 * 
 * 2次元座標：[経度, 緯度]
 * 3次元座標：[経度, 緯度, 標高]
 * 
 * RFC 7946では標高（elevation）はオプションとして3番目の要素に記録可能。
 */
export type GeoJSONPosition = [number, number] | [number, number, number];

/**
 * GeoJSON Point ジオメトリ
 * 
 * 単一の地理的位置を表現するジオメトリ型。
 * 停滞ポイント、目印、イベント発生地点などに使用される。
 * 
 * 例：駅、休憩地点、事故発生場所など
 */
export interface GeoJSONPointGeometry {
  type: 'Point';                   // ジオメトリタイプ識別子
  coordinates: GeoJSONPosition;    // 点の座標 [経度, 緯度] or [経度, 緯度, 標高]
}

/**
 * GeoJSON LineString ジオメトリ
 * 
 * 複数の座標点を順番に結んだ線を表現するジオメトリ型。
 * トリップの移動軌跡、道路、境界線などに使用される。
 * 
 * 最低2つの座標点が必要で、それらを順番に結んで線を形成する。
 * 例：移動ルート、バス路線、ハイキングコースなど
 */
export interface GeoJSONLineStringGeometry {
  type: 'LineString';              // ジオメトリタイプ識別子
  coordinates: GeoJSONPosition[];  // 線を構成する座標配列（最低2点）
}

/**
 * サポートするGeoJSONジオメトリの統合型
 * 
 * 現在の実装ではPointとLineStringのみをサポート。
 * 将来的にはPolygon、MultiPoint等の追加も可能。
 */
export type GeoJSONGeometry = GeoJSONPointGeometry | GeoJSONLineStringGeometry;

/**
 * GeoJSON Feature（地理的特徴）
 * 
 * ジオメトリ（形状）と属性情報（properties）を組み合わせたオブジェクト。
 * GeoJSONの基本構成要素で、地理的な「もの」を表現する。
 * 
 * 構成要素：
 * - type: 'Feature'（固定値）
 * - geometry: 地理的形状（Point、LineString等）
 * - properties: 属性データ（名前、説明、統計情報等）
 * 
 * 例：「新宿駅」（Point + {name: "新宿駅", 乗降客数: 100万人}）
 */
export interface GeoJSONFeature {
  type: 'Feature';                           // Feature識別子（固定値）
  geometry: GeoJSONGeometry;                 // 地理的形状
  properties: Record<string, any> | null;   // 属性情報（任意のJSONオブジェクト）
}

/**
 * GeoJSON FeatureCollection（Feature集合）
 * 
 * 複数のFeatureをまとめたコレクション。
 * GeoJSONファイルの最上位オブジェクトとして使用されることが多い。
 * 
 * 構成要素：
 * - type: 'FeatureCollection'（固定値）
 * - features: Feature配列
 * - bbox: 境界ボックス（オプション）
 * 
 * 例：トリップ全体（軌跡LineString + 停滞Point群）
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';                     // FeatureCollection識別子（固定値）
  bbox?: [number, number, number, number];      // 境界ボックス [西, 南, 東, 北]（オプション）
  features: GeoJSONFeature[];                   // Feature配列
}

/**
 * GeoJSON変換用のGPSトラックポイント
 * 
 * Rideサービスのトラックポイントデータを受け入れるための柔軟な型定義。
 * 複数の座標フィールド形式（x,y / longitude,latitude）に対応し、
 * タイムスタンプや速度等のオプション情報も含む。
 * 
 * 対応フィールド形式：
 * - 座標: x,y（レガシー） / longitude,latitude（推奨）
 * - 標高: e（レガシー） / elevation（推奨）
 * - 時刻: time / timestamp（複数形式対応）
 */
export interface GeoJSONTrackPoint {
  // 座標情報（複数フィールド形式対応）
  x?: number;                              // 経度（レガシー形式、互換性維持用）
  y?: number;                              // 緯度（レガシー形式、互換性維持用）
  longitude?: number;                      // 経度（推奨形式）
  latitude?: number;                       // 緯度（推奨形式）
  
  // 標高情報
  elevation?: number;                      // 標高（推奨形式）
  e?: number;                             // 標高（レガシー形式、互換性維持用）
  
  // 時刻情報（複数データ型対応）
  time?: Date | string | number;         // 時刻（Date、ISO文字列、Unix timestamp）
  timestamp?: Date | string | number;    // タイムスタンプ（別名フィールド）
  
  // 追加センサーデータ
  speed?: number;                         // 速度（m/s）
}

/**
 * GeoJSON変換専用のトリップデータ構造
 * 
 * 標準のTripData型とは別に、GeoJSON変換で使用される可能性がある
 * 拡張フィールドを含むトリップデータ型。
 * 
 * 既存のTrip型にない以下のフィールドもサポート：
 * - start_time, end_time: 開始・終了時刻
 * - avg_speed: 平均速度（average_speedの短縮形）
 * - stationary_points: 停滞ポイント配列
 */
export interface GeoJSONTripData {
  trip: {
    // 基本情報
    id: number;                           // トリップID
    name?: string;                        // トリップ名
    description?: string;                 // 説明文
    
    // 時刻情報
    created_at?: string;                  // 作成日時（ISO文字列）
    updated_at?: string;                  // 更新日時（ISO文字列）
    start_time?: string;                  // 開始時刻（拡張フィールド）
    end_time?: string;                    // 終了時刻（拡張フィールド）
    
    // 統計情報
    distance?: number;                    // 総距離（メートル）
    elevation_gain?: number;              // 獲得標高（メートル）
    elevation_loss?: number;              // 損失標高（メートル）
    moving_time?: number;                 // 移動時間（秒）
    stopped_time?: number;                // 停止時間（秒）
    
    // 速度情報
    max_speed?: number;                   // 最高速度（m/s）
    avg_speed?: number;                   // 平均速度（m/s、短縮形）
    
    // 関連情報
    user_id?: number;                     // ユーザーID
    
    // GPS軌跡データ
    track_points: GeoJSONTrackPoint[];    // トラックポイント配列（必須）
    
    // 停滞ポイント（オプション）
    stationary_points?: Array<{
      // 座標（複数フィールド形式対応）
      latitude?: number;                  // 緯度
      longitude?: number;                 // 経度
      x?: number;                        // 経度（レガシー形式）
      y?: number;                        // 緯度（レガシー形式）
      
      // 停滞情報
      duration?: number;                  // 停滞時間（秒）
      timestamp?: Date | string;          // 停滞開始時刻
    }>;
  };
}