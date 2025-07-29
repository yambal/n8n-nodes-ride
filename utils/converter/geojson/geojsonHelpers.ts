/**
 * GeoJSON変換用のヘルパー関数集
 * 
 * このファイルには、トリップデータをGeoJSON形式に変換するために必要な
 * ユーティリティ関数が含まれています。主な機能：
 * - 座標変換（GPSポイント → GeoJSON座標）
 * - 境界ボックス計算
 * - GeoJSON Feature生成
 * - データフォーマット（時間、距離、速度）
 * - データバリデーション
 */

import { GeoJSONPosition, GeoJSONTrackPoint, GeoJSONFeature, GeoJSONPointGeometry, GeoJSONLineStringGeometry } from './types';

/**
 * トラックポイントをGeoJSON座標[経度, 緯度]に変換する
 * 
 * Rideサービスのトラックポイントはxとyフィールド（または longitude/latitude）で
 * 座標を表現するが、GeoJSONでは[経度, 緯度]の配列形式が必要。
 * この関数は両方の形式に対応し、適切な座標検証も行う。
 * 
 * @param point 変換対象のトラックポイント（x,y形式またはlongitude,latitude形式）
 * @returns GeoJSON座標配列 [経度, 緯度] または [経度, 緯度, 標高]
 * @throws {Error} 座標が無効な場合（数値でない、範囲外など）
 */
export function trackPointToCoordinate(point: GeoJSONTrackPoint): GeoJSONPosition {
  // 経度を取得（longitudeフィールドを優先、なければxフィールドを使用）
  const longitude = point.longitude ?? point.x;
  
  // 緯度を取得（latitudeフィールドを優先、なければyフィールドを使用）
  const latitude = point.latitude ?? point.y;
  
  // 座標値が数値であることを確認
  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    throw new Error('Invalid track point: longitude and latitude must be numbers');
  }
  
  // 座標範囲の妥当性をチェック
  // 経度は-180度から+180度の範囲内である必要がある
  if (longitude < -180 || longitude > 180) {
    throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180`);
  }
  
  // 緯度は-90度から+90度の範囲内である必要がある
  if (latitude < -90 || latitude > 90) {
    throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90`);
  }
  
  // 標高情報が利用可能な場合は3次元座標として返す
  const elevation = point.elevation ?? point.e;
  if (typeof elevation === 'number') {
    return [longitude, latitude, elevation]; // [経度, 緯度, 標高]
  }
  
  // 標高情報がない場合は2次元座標として返す
  return [longitude, latitude]; // [経度, 緯度]
}

/**
 * 座標配列から境界ボックス（BBox）を計算する
 * 
 * 境界ボックスは、全ての座標点を含む最小の矩形範囲を表す。
 * GeoJSON仕様では[西, 南, 東, 北]の順序で経度・緯度の最小最大値を記録する。
 * 地図表示やデータの空間範囲を把握するために使用される。
 * 
 * @param coordinates 境界ボックス計算対象の座標配列
 * @returns 境界ボックス [西経度, 南緯度, 東経度, 北緯度]
 * @throws {Error} 座標配列が空の場合
 */
export function calculateBBox(coordinates: GeoJSONPosition[]): [number, number, number, number] {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bbox from empty coordinates array');
  }
  
  // 初期値として最初の座標を設定
  let west = coordinates[0][0];   // 最西端（最小経度）
  let south = coordinates[0][1];  // 最南端（最小緯度）
  let east = coordinates[0][0];   // 最東端（最大経度）
  let north = coordinates[0][1];  // 最北端（最大緯度）
  
  // 全座標を走査して最小最大値を更新
  for (const coord of coordinates) {
    const [lng, lat] = coord;
    west = Math.min(west, lng);   // より西の経度があれば更新
    south = Math.min(south, lat); // より南の緯度があれば更新
    east = Math.max(east, lng);   // より東の経度があれば更新
    north = Math.max(north, lat); // より北の緯度があれば更新
  }
  
  // GeoJSON仕様に従い [西, 南, 東, 北] の順序で返す
  return [west, south, east, north];
}

/**
 * GeoJSON Point Featureを作成する
 * 
 * Point Featureは単一の地理的位置（停滞ポイント、目印など）を表現する。
 * 座標とその地点に関する属性情報（properties）を組み合わせてFeatureオブジェクトを生成。
 * 
 * @param coordinate Point Featureの座標 [経度, 緯度] または [経度, 緯度, 標高]
 * @param properties その地点の属性情報（停滞時間、名前など）、nullも可
 * @returns GeoJSON Point Feature オブジェクト
 */
export function createPointFeature(
  coordinate: GeoJSONPosition,
  properties: Record<string, any> | null = null
): GeoJSONFeature {
  // Point geometryオブジェクトを作成
  const geometry: GeoJSONPointGeometry = {
    type: 'Point',
    coordinates: coordinate // [経度, 緯度] または [経度, 緯度, 標高]
  };
  
  // GeoJSON Feature標準形式でオブジェクトを返す
  return {
    type: 'Feature',      // GeoJSON Featureの識別子
    geometry,             // 地理的形状（Point）
    properties            // 属性情報（メタデータ）
  };
}

/**
 * GeoJSON LineString Featureを作成する
 * 
 * LineString Featureは連続する複数の座標点を結んだ線（トリップの軌跡など）を表現する。
 * 最低2つの座標点が必要で、それらを順番に結んで線を形成する。
 * 
 * @param coordinates LineStringを構成する座標配列（最低2点必要）
 * @param properties その軌跡の属性情報（距離、時間、速度など）、nullも可
 * @returns GeoJSON LineString Feature オブジェクト
 * @throws {Error} 座標が2点未満の場合
 */
export function createLineStringFeature(
  coordinates: GeoJSONPosition[],
  properties: Record<string, any> | null = null
): GeoJSONFeature {
  // LineStringには最低2つの座標点が必要
  if (coordinates.length < 2) {
    throw new Error('LineString must have at least 2 coordinates');
  }
  
  // LineString geometryオブジェクトを作成
  const geometry: GeoJSONLineStringGeometry = {
    type: 'LineString',
    coordinates // 座標配列を順番に結んで線を形成
  };
  
  // GeoJSON Feature標準形式でオブジェクトを返す
  return {
    type: 'Feature',      // GeoJSON Featureの識別子
    geometry,             // 地理的形状（LineString）
    properties            // 属性情報（トリップの詳細データ）
  };
}

/**
 * 無効なトラックポイントを除外し、有効な座標を持つポイントのみを返す
 * 
 * GPSデータには時として無効な座標（null、範囲外の値など）が含まれることがある。
 * この関数は座標の妥当性をチェックし、GeoJSON変換に適した有効なポイントのみを抽出する。
 * 
 * @param trackPoints フィルタリング対象のトラックポイント配列
 * @returns 有効な経度・緯度を持つトラックポイント配列
 */
export function filterValidTrackPoints(trackPoints: GeoJSONTrackPoint[]): GeoJSONTrackPoint[] {
  return trackPoints.filter(point => {
    // 座標値を抽出（複数のフィールド形式に対応）
    const longitude = point.longitude ?? point.x;
    const latitude = point.latitude ?? point.y;
    
    // 有効な座標の条件をチェック
    return (
      // 経度・緯度が数値型であること
      typeof longitude === 'number' &&
      typeof latitude === 'number' &&
      // 経度が有効範囲内（-180度 ～ +180度）
      longitude >= -180 && longitude <= 180 &&
      // 緯度が有効範囲内（-90度 ～ +90度）
      latitude >= -90 && latitude <= 90
    );
  });
}

/**
 * 秒数を人間が読みやすい時間表現に変換する
 * 
 * トリップの移動時間や停滞時間を表示用にフォーマットする。
 * 時間の長さに応じて適切な単位（秒、分、時間）で表現する。
 * 
 * @param durationInSeconds 変換対象の秒数
 * @returns 人間が読みやすい時間文字列（例: "2h 30m", "45m", "30s"）
 */
export function formatDuration(durationInSeconds: number): string {
  // 1分未満の場合は秒単位で表示
  if (durationInSeconds < 60) {
    return `${Math.round(durationInSeconds)}s`;
  } 
  // 1時間未満の場合は分と秒で表示
  else if (durationInSeconds < 3600) {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.round(durationInSeconds % 60);
    // 秒が0でない場合は秒も表示、そうでなければ分のみ
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  } 
  // 1時間以上の場合は時間と分で表示
  else {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    // 分が0でない場合は分も表示、そうでなければ時間のみ
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * メートル単位の距離を人間が読みやすい表現に変換する
 * 
 * トリップの移動距離を表示用にフォーマットする。
 * 距離に応じてメートルまたはキロメートル単位で適切に表現する。
 * 
 * @param distanceInMeters 変換対象の距離（メートル）
 * @returns 人間が読みやすい距離文字列（例: "5.20km", "800m"）
 */
export function formatDistance(distanceInMeters: number): string {
  // 1km未満の場合はメートル単位で表示（整数に丸める）
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } 
  // 1km以上の場合はキロメートル単位で表示（小数点2桁まで）
  else {
    const kilometers = distanceInMeters / 1000;
    return `${kilometers.toFixed(2)}km`;
  }
}

/**
 * 速度をm/s（メートル毎秒）からkm/h（キロメートル毎時）に変換する
 * 
 * GPSデータの速度はm/s単位で記録されることが多いが、
 * 一般的にはkm/h単位の方が理解しやすいため変換を行う。
 * 
 * @param speedInMps 変換対象の速度（m/s）
 * @returns km/h単位の速度（小数点2桁まで）
 */
export function formatSpeed(speedInMps: number): number {
  // m/sをkm/hに変換（3.6倍）し、小数点2桁で丸める
  return Math.round(speedInMps * 3.6 * 100) / 100;
}