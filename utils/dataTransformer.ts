import { APITrackPoint, TrackPoint, APITrip, APITripData } from '../nodes/Ride/types/Trip.types';
import { APIRoute, APIRouteData, APIRoutesListResponse, RouteTrackPoint } from '../nodes/Ride/types/Route.types';

/**
 * APITrackPoint（単一文字プロパティ）をTrackPoint（読みやすいプロパティ名）に変換する
 * @param apiPoint API形式のトラックポイント（x, y, e, t, s, h, c形式）
 * @returns 読みやすい形式のトラックポイント（longitude, latitude, elevation等）
 */
export function transformAPITrackPoint(apiPoint: APITrackPoint): TrackPoint {
  return {
    longitude: apiPoint.x,    // x座標 → 経度
    latitude: apiPoint.y,     // y座標 → 緯度
    elevation: apiPoint.e,    // e → 標高
    timestamp: apiPoint.t,    // t → タイムスタンプ
    speed: apiPoint.s,        // s → 速度
    heartRate: apiPoint.h,    // h → 心拍数
    cadence: apiPoint.c,      // c → ケイデンス（回転数）
  };
}

/**
 * APITrackPointの配列をTrackPointの配列に一括変換する
 * @param apiPoints API形式のトラックポイント配列
 * @returns 読みやすい形式のトラックポイント配列
 */
export function transformAPITrackPoints(apiPoints: APITrackPoint[]): TrackPoint[] {
  // 各APITrackPointに対してtransformAPITrackPointを適用
  return apiPoints.map(transformAPITrackPoint);
}

/**
 * TrackPoint（読みやすいプロパティ名）をAPITrackPoint（単一文字プロパティ）に逆変換する
 * @param point 読みやすい形式のトラックポイント
 * @returns API形式のトラックポイント（x, y, e, t, s, h, c形式）
 */
export function transformTrackPointToAPI(point: TrackPoint): APITrackPoint {
  return {
    x: point.longitude,
    y: point.latitude,
    e: point.elevation,
    t: point.timestamp,
    s: point.speed,
    h: point.heartRate,
    c: point.cadence,
  };
}

/**
 * TrackPointの配列をAPITrackPointの配列に一括逆変換する
 * @param points 読みやすい形式のトラックポイント配列
 * @returns API形式のトラックポイント配列
 */
export function transformTrackPointsToAPI(points: TrackPoint[]): APITrackPoint[] {
  // 各TrackPointに対してtransformTrackPointToAPIを適用
  return points.map(transformTrackPointToAPI);
}

/**
 * 内部利用用の変換済みTrackPointsを含むTripタイプ
 * APIから取得したトリップデータを読みやすい形式に変換したもの
 */
export interface Trip {
  id: number;
  name: string;
  description?: string;
  departed_at: string;
  locality?: string;
  administrative_area?: string;
  country_code?: string;
  distance: number;
  duration: number;
  elevation_gain: number;
  elevation_loss: number;
  moving_time?: number;
  average_speed?: number;
  max_speed?: number;
  average_power?: number;
  max_power?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
  average_cadence?: number;
  max_cadence?: number;
  calories?: number;
  user_id: number;
  visibility: number;
  created_at: string;
  updated_at: string;
  track_points: TrackPoint[]; // Transformed to readable property names
}

/**
 * 変換済みトラックポイントを含むトリップデータ
 * APIレスポンスをラップしたデータ構造
 */
export interface TripData {
  trip: Trip;
}

/**
 * APITripをTrackPointが変換済みのTripに変換する
 * @param apiTrip API形式のトリップデータ（track_pointsがx,y,e,t,s,h,c形式）
 * @returns 読みやすい形式のトリップデータ（track_pointsが変換済み）
 */
export function transformAPITrip(apiTrip: APITrip): Trip {
  return {
    ...apiTrip,  // API形式のTrip属性をそのまま展開
    // track_pointsのみを読みやすい形式に変換して上書き
    track_points: transformAPITrackPoints(apiTrip.track_points),
  };
}

/**
 * APITripDataをTrackPointが変換済みのTripDataに変換する
 * @param apiTripData API形式のトリップデータレスポンス
 * @returns 変換済みトラックポイントを含むトリップデータ
 */
export function transformAPITripData(apiTripData: APITripData): TripData {
  return {
    trip: transformAPITrip(apiTripData.trip),
  };
}

/**
 * Route用のAPITrackPoint（単一文字プロパティ）をRouteTrackPoint（読みやすいプロパティ名）に変換する
 * ルートはタイムスタンプやスピード情報を含まない
 * @param apiPoint Route API形式のトラックポイント（x, y, e形式）
 * @returns 読みやすい形式のルートトラックポイント
 */
export function transformAPIRouteTrackPoint(apiPoint: { x: number; y: number; e: number }): RouteTrackPoint {
  return {
    longitude: apiPoint.x,
    latitude: apiPoint.y,
    elevation: apiPoint.e,
  };
}

/**
 * Route用APITrackPointの配列をRouteTrackPointの配列に一括変換する
 * @param apiPoints Route API形式のトラックポイント配列
 * @returns 読みやすい形式のルートトラックポイント配列
 */
export function transformAPIRouteTrackPoints(apiPoints: Array<{ x: number; y: number; e: number }>): RouteTrackPoint[] {
  return apiPoints.map(transformAPIRouteTrackPoint);
}

/**
 * RouteTrackPoint（読みやすいプロパティ名）をRoute用APITrackPoint（単一文字プロパティ）に逆変換する
 * @param point 読みやすい形式のルートトラックポイント
 * @returns Route API形式のトラックポイント（x, y, e形式）
 */
export function transformRouteTrackPointToAPI(point: RouteTrackPoint): { x: number; y: number; e: number } {
  return {
    x: point.longitude,
    y: point.latitude,
    e: point.elevation,
  };
}

/**
 * RouteTrackPointの配列をRoute API形式に一括逆変換する
 * @param points 読みやすい形式のルートトラックポイント配列
 * @returns Route API形式のトラックポイント配列
 */
export function transformRouteTrackPointsToAPI(points: RouteTrackPoint[]): Array<{ x: number; y: number; e: number }> {
  return points.map(transformRouteTrackPointToAPI);
}

/**
 * 内部利用用の変換済みRouteTrackPointsを含むRouteタイプ
 * APIから取得したルートデータを読みやすい形式に変換したもの
 * ルートはTripと違い、タイムスタンプやスピード情報を含まない
 */
export interface Route {
  id: number;
  name: string;
  description?: string;
  locality?: string;
  administrative_area?: string;
  country_code?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  user_id: number;
  visibility: number;
  created_at: string;
  updated_at: string;
  track_points?: RouteTrackPoint[]; // Transformed to readable property names
}

/**
 * 変換済みトラックポイントを含むルートデータ
 * APIレスポンスをラップしたデータ構造
 */
export interface RouteData {
  route: Route;
}

/**
 * APIRouteをRouteTrackPointが変換済みのRouteに変換する
 * @param apiRoute API形式のルートデータ（track_pointsがx,y,e形式）
 * @returns 読みやすい形式のルートデータ（track_pointsが変換済み）
 */
export function transformAPIRoute(apiRoute: APIRoute): Route {
  return {
    ...apiRoute,
    track_points: apiRoute.track_points ? transformAPIRouteTrackPoints(apiRoute.track_points) : undefined,
  };
}

/**
 * APIRouteDataをRouteTrackPointが変換済みのRouteDataに変換する
 * @param apiRouteData API形式のルートデータレスポンス
 * @returns 変換済みトラックポイントを含むルートデータ
 */
export function transformAPIRouteData(apiRouteData: APIRouteData): RouteData {
  return {
    route: transformAPIRoute(apiRouteData.route),
  };
}

/**
 * 内部利用用の変換済みルートを含むルート一覧レスポンス
 * 一覧レスポンスではtrack_pointsは含まれない
 */
export interface RoutesListResponse {
  routes: Route[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

/**
 * APIRoutesListResponseをRoutesListResponseに変換する
 * 注意：ルート一覧レスポンスはtrack_pointsを含まないため、変換処理は不要
 * @param apiResponse API形式のルート一覧レスポンス
 * @returns 変換済みルート一覧レスポンス
 */
export function transformAPIRoutesListResponse(apiResponse: APIRoutesListResponse): RoutesListResponse {
  return {
    // 各ルートに対してtrack_pointsを明示的にundefinedに設定
    routes: apiResponse.routes.map(route => ({
      ...route,
      track_points: undefined, // ルート一覧ではtrack_pointsは常に含まれない
    })),
    // ページネーション情報はそのままコピー
    meta: apiResponse.meta,
  };
}