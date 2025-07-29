import { TripData } from '../../dataTransformer';
import { GeoJSONTripData, GeoJSONFeatureCollection } from './types';
import { 
  trackPointToCoordinate, 
  calculateBBox, 
  createLineStringFeature, 
  createPointFeature,
  filterValidTrackPoints,
  formatDuration,
  formatDistance,
  formatSpeed
} from './geojsonHelpers';
import { getSignificantLocations } from '../../common/geoUtils';

/**
 * トリップデータをGeoJSON FeatureCollectionに変換する
 * 
 * この関数は、Rideサービスから取得したトリップデータを地理情報標準フォーマットの
 * GeoJSON形式に変換します。変換結果には以下が含まれます：
 * - LineString: トリップの軌跡（トラックポイントを結んだ線）
 * - Point: 停滞ポイント（15分以上滞在し100m以内の地点）
 * - 境界ボックス: 全座標を含む矩形範囲
 * 
 * @param tripData TripDataまたはGeoJSONTripData形式のトリップデータ
 * @returns GeoJSON FeatureCollectionオブジェクト
 * @throws {Error} トラックポイントが存在しない場合、または有効な座標がない場合
 */
export function tripToGeojson(tripData: TripData | GeoJSONTripData): GeoJSONFeatureCollection {
  const { trip } = tripData;
  
  // 1. トラックポイントの存在確認
  // トリップデータにGPSトラックポイントが含まれているかチェック
  if (!trip.track_points || trip.track_points.length === 0) {
    throw new Error('Trip data must contain at least one track point');
  }
  
  // 2. 有効なトラックポイントのフィルタリング
  // 経度・緯度が正しい範囲内にある有効なポイントのみを抽出
  const validTrackPoints = filterValidTrackPoints(trip.track_points);
  
  if (validTrackPoints.length === 0) {
    throw new Error('Trip data must contain at least one valid track point with coordinates');
  }
  
  // 3. GeoJSON Feature配列の初期化
  const features: GeoJSONFeatureCollection['features'] = [];
  
  // 4. トラックポイントをGeoJSON座標に変換
  // 各GPSポイント（緯度・経度）をGeoJSON形式の座標[経度, 緯度]に変換
  const trackCoordinates = validTrackPoints.map(point => trackPointToCoordinate(point));
  
  // 5. トリップ軌跡のLineString Featureを作成
  // 2つ以上のポイントがある場合のみ軌跡線を作成（線には最低2点が必要）
  if (trackCoordinates.length >= 2) {
    // トリップの詳細情報をGeoJSONのpropertiesに設定
    // 距離、時間、速度などの統計情報を含める
    const trackProperties = {
      type: 'track', // フィーチャータイプ識別子
      tripId: trip.id,
      name: trip.name || `Trip ${trip.id}`,
      description: trip.description || '',
      // 距離情報（人間が読みやすい形式とメートル単位の両方）
      distance: trip.distance ? formatDistance(trip.distance) : null,
      distanceMeters: trip.distance || null,
      // 移動時間情報
      duration: trip.moving_time ? formatDuration(trip.moving_time) : null,
      durationSeconds: trip.moving_time || null,
      // 停止時間（現在のTrip型では提供されない）
      stoppedTime: null,
      stoppedTimeSeconds: null,
      // 標高情報
      elevationGain: trip.elevation_gain || null,
      elevationLoss: trip.elevation_loss || null,
      // 速度情報（km/h形式とm/s形式）
      maxSpeed: trip.max_speed ? formatSpeed(trip.max_speed) : null,
      maxSpeedMps: trip.max_speed || null,
      // 平均速度（型安全性のためasを使用）
      avgSpeed: (trip as any).average_speed ? formatSpeed((trip as any).average_speed) : null,
      avgSpeedMps: (trip as any).average_speed || null,
      // 時刻情報
      startTime: (trip as any).departed_at || trip.created_at || null,
      endTime: trip.updated_at || null,
      // その他のメタデータ
      userId: trip.user_id || null,
      trackPointsCount: validTrackPoints.length
    };
    
    // LineString Featureを作成してfeatures配列に追加
    const trackFeature = createLineStringFeature(trackCoordinates, trackProperties);
    features.push(trackFeature);
  }
  
  // 6. 停滞ポイントをPoint Featureとして追加
  // 現在のTrip型にはstationary_pointsフィールドがないため、トラックポイントから検出
  try {
    // トラックポイントを停滞検出用の標準形式に変換
    const standardTrackPoints = validTrackPoints.map(point => ({
      latitude: point.latitude ?? point.y ?? 0,
      longitude: point.longitude ?? point.x ?? 0,
      elevation: point.elevation ?? point.e,
      // タイムスタンプを数値形式に統一（停滞検出には数値が必要）
      timestamp: typeof (point.time ?? point.timestamp) === 'number' 
        ? (point.time ?? point.timestamp) as number
        : 0 // 無効な場合は0で代用
    }));
    
    // 停滞ポイントを検出（15分以上滞在かつ100m以内の範囲）
    const stationaryPoints = getSignificantLocations(standardTrackPoints, 15 * 60, 100);
    
    // 検出された各停滞ポイントをGeoJSON Point Featureとして追加
    for (const point of stationaryPoints) {
      // 停滞ポイントの座標をGeoJSON形式に変換
      const coordinate = trackPointToCoordinate({
        longitude: point.longitude,
        latitude: point.latitude
      });
      
      // 停滞ポイントの詳細情報を設定
      const pointProperties = {
        type: 'stationary_point', // フィーチャータイプ識別子
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp // 停滞開始時刻
      };
      
      // Point Featureを作成してfeatures配列に追加
      const pointFeature = createPointFeature(coordinate, pointProperties);
      features.push(pointFeature);
    }
  } catch (error) {
    // 停滞ポイント検出に失敗した場合は警告を出力して続行
    console.warn('Failed to detect stationary points:', error);
  }
  
  // 7. 境界ボックス（BBox）の計算
  // 全ての座標点を含む矩形範囲[西, 南, 東, 北]を計算
  let bbox: [number, number, number, number] | undefined;
  if (trackCoordinates.length > 0) {
    try {
      bbox = calculateBBox(trackCoordinates);
    } catch (error) {
      console.warn('Failed to calculate bounding box:', error);
    }
  }
  
  // 8. GeoJSON FeatureCollectionの作成
  const featureCollection: GeoJSONFeatureCollection = {
    type: 'FeatureCollection', // GeoJSON標準の必須フィールド
    features // 軌跡LineStringと停滞ポイントPoint配列
  };
  
  // 9. 境界ボックスをFeatureCollectionに追加（計算できた場合のみ）
  if (bbox) {
    featureCollection.bbox = bbox;
  }
  
  return featureCollection;
}