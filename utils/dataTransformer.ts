import { APITrackPoint, TrackPoint, APITrip, APITripData } from '../nodes/Ride/types/Trip.types';
import { APIRoute, APIRouteData, APIRoutesListResponse, RouteTrackPoint } from '../nodes/Ride/types/Route.types';

/**
 * Converts APITrackPoint (with single-letter properties) to TrackPoint (with readable property names)
 */
export function transformAPITrackPoint(apiPoint: APITrackPoint): TrackPoint {
  return {
    longitude: apiPoint.x,
    latitude: apiPoint.y,
    elevation: apiPoint.e,
    timestamp: apiPoint.t,
    speed: apiPoint.s,
    heartRate: apiPoint.h,
    cadence: apiPoint.c,
  };
}

/**
 * Converts an array of APITrackPoints to TrackPoints
 */
export function transformAPITrackPoints(apiPoints: APITrackPoint[]): TrackPoint[] {
  return apiPoints.map(transformAPITrackPoint);
}

/**
 * Converts TrackPoint (with readable property names) back to APITrackPoint (with single-letter properties)
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
 * Converts an array of TrackPoints to APITrackPoints
 */
export function transformTrackPointsToAPI(points: TrackPoint[]): APITrackPoint[] {
  return points.map(transformTrackPointToAPI);
}

/**
 * Trip type with transformed TrackPoints for internal use
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
 * Trip data with transformed track points
 */
export interface TripData {
  trip: Trip;
}

/**
 * Converts APITrip to Trip with transformed track points
 */
export function transformAPITrip(apiTrip: APITrip): Trip {
  return {
    ...apiTrip,
    track_points: transformAPITrackPoints(apiTrip.track_points),
  };
}

/**
 * Converts APITripData to TripData with transformed track points
 */
export function transformAPITripData(apiTripData: APITripData): TripData {
  return {
    trip: transformAPITrip(apiTripData.trip),
  };
}

/**
 * Converts Route APITrackPoint (with single-letter properties) to RouteTrackPoint (with readable property names)
 */
export function transformAPIRouteTrackPoint(apiPoint: { x: number; y: number; e: number }): RouteTrackPoint {
  return {
    longitude: apiPoint.x,
    latitude: apiPoint.y,
    elevation: apiPoint.e,
  };
}

/**
 * Converts an array of Route APITrackPoints to RouteTrackPoints
 */
export function transformAPIRouteTrackPoints(apiPoints: Array<{ x: number; y: number; e: number }>): RouteTrackPoint[] {
  return apiPoints.map(transformAPIRouteTrackPoint);
}

/**
 * Converts RouteTrackPoint (with readable property names) back to APITrackPoint (with single-letter properties)
 */
export function transformRouteTrackPointToAPI(point: RouteTrackPoint): { x: number; y: number; e: number } {
  return {
    x: point.longitude,
    y: point.latitude,
    e: point.elevation,
  };
}

/**
 * Converts an array of RouteTrackPoints to API format
 */
export function transformRouteTrackPointsToAPI(points: RouteTrackPoint[]): Array<{ x: number; y: number; e: number }> {
  return points.map(transformRouteTrackPointToAPI);
}

/**
 * Route type with transformed RouteTrackPoints for internal use
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
 * Route data with transformed track points
 */
export interface RouteData {
  route: Route;
}

/**
 * Converts APIRoute to Route with transformed track points
 */
export function transformAPIRoute(apiRoute: APIRoute): Route {
  return {
    ...apiRoute,
    track_points: apiRoute.track_points ? transformAPIRouteTrackPoints(apiRoute.track_points) : undefined,
  };
}

/**
 * Converts APIRouteData to RouteData with transformed track points
 */
export function transformAPIRouteData(apiRouteData: APIRouteData): RouteData {
  return {
    route: transformAPIRoute(apiRouteData.route),
  };
}

/**
 * Routes list response with transformed routes for internal use
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
 * Converts APIRoutesListResponse to RoutesListResponse 
 * Note: Routes list responses don't include track_points, so no transformation needed
 */
export function transformAPIRoutesListResponse(apiResponse: APIRoutesListResponse): RoutesListResponse {
  return {
    routes: apiResponse.routes.map(route => ({
      ...route,
      track_points: undefined, // Routes list never includes track_points
    })),
    meta: apiResponse.meta,
  };
}