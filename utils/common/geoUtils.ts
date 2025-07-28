import { TimestampedPoint, StationaryGroup } from '../types/geo.types';

// Re-export types for backward compatibility
export { CoordinatePoint, TimestampedPoint, StationaryGroup, StationaryDetectionOptions } from '../types/geo.types';

/**
 * 2つのGPS座標間の距離をハーベルサイン式で計算する
 * @param lat1 最初のポイントの緯度（度数）
 * @param lon1 最初のポイントの経度（度数）  
 * @param lat2 2番目のポイントの緯度（度数）
 * @param lon2 2番目のポイントの経度（度数）
 * @returns 距離（メートル）
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = (lat2 - lat1) * Math.PI / 180; // 緯度差をラジアンに変換
  const dLon = (lon2 - lon1) * Math.PI / 180; // 経度差をラジアンに変換
  
  // ハーベルサイン式の計算
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // 距離を返す
}

/**
 * 座標ポイントの配列から平均座標を計算する
 * @param points 座標ポイントの配列
 * @returns 平均座標ポイント
 */
export function calculateAveragePoint<T extends TimestampedPoint>(points: T[]): T {
  // 緯度の平均を計算
  const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  // 経度の平均を計算
  const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
  
  // 最初と最後のタイムスタンプから中間時刻を計算
  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const avgTime = Math.round((startTime + endTime) / 2);
  
  // 最初のポイントの他のプロパティを保持しつつ、平均値で上書き
  return {
    ...points[0],
    latitude: avgLat,
    longitude: avgLon,
    timestamp: avgTime
  } as T;
}


/**
 * 停滞グループからマーカー配置用のキーポイントを抽出する
 * @param groups 停滞グループの配列
 * @returns マーカー用に適した中心点の配列
 */
export function extractStationaryMarkers<T extends TimestampedPoint>(groups: StationaryGroup<T>[]): T[] {
  // 各グループの中心点を抽出してマーカー用のポイント配列として返す
  return groups.map(group => group.centerPoint);
}


/**
 * 長時間滞在した重要な場所を取得するためにポイントをフィルタリングする
 * @param points タイムスタンプ付き座標ポイントの配列
 * @param minDuration 最小滞在時間（秒）（デフォルト: 30分）
 * @param maxDistance 最大半径（メートル）（デフォルト: 200m）
 * @returns 重要な場所のポイント配列
 */
export function getSignificantLocations<T extends TimestampedPoint>(
  points: T[], 
  minDuration: number = 30 * 60, 
  maxDistance: number = 200
): T[] {
  // 停滞点検出モジュールを動的に読み込み
  const { detectStationaryGroups } = require('../normalizers/stationaryPointDetection');
  
  // 指定された条件で停滞グループを検出
  const groups = detectStationaryGroups(points, { 
    distanceThreshold: maxDistance,  // 距離閾値
    timeThreshold: minDuration       // 時間閾値
  });
  
  // 停滞グループから重要な場所のマーカーを抽出して返す
  return extractStationaryMarkers(groups);
}