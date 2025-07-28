/** 座標を表すポイントのインターフェース */
export interface CoordinatePoint {
  longitude: number; // 経度
  latitude: number;  // 緯度
}

/** タイムスタンプ付き座標ポイントのインターフェース */
export interface TimestampedPoint extends CoordinatePoint {
  timestamp: number; // UNIXタイムスタンプ（秒）
}

/** 停滞グループの情報を表すインターフェース */
export interface StationaryGroup<T = TimestampedPoint> {
  startIndex: number; // 開始インデックス
  endIndex: number;   // 終了インデックス
  points: T[];        // グループに含まれるポイント配列
  centerPoint: T;     // グループの中心点
  duration: number;   // 停滞時間（秒）
  radius: number;     // 停滞範囲の半径（メートル）
}

/** 停滞検出のオプション設定 */
export interface StationaryDetectionOptions {
  distanceThreshold?: number; // 距離閾値（メートル）
  timeThreshold?: number;     // 時間閾値（秒）
}