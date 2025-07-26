/**
 * Complete Route object from Ride with GPS API
 */
export interface Route {
  id: number;
  name: string;
  description?: string;
  locality?: string; // City/location name
  administrative_area?: string; // State/province
  country_code?: string; // ISO country code
  distance: number; // Distance in meters
  elevation_gain: number; // Elevation gain in meters
  elevation_loss: number; // Elevation loss in meters
  user_id: number; // Owner user ID
  visibility: number; // Visibility setting (0=private, 1=public, etc.)
  created_at: string; // ISO8601 timestamp
  updated_at: string; // ISO8601 timestamp
  track_points?: Array<{
    x: number; // longitude
    y: number; // latitude
    e: number; // elevation (meters)
  }>;
}

/**
 * Single route response from API
 */
export interface RouteData {
  route: Route;
}

/**
 * Multiple routes response from API with pagination metadata
 */
export interface RoutesListResponse {
  routes: Array<Route>;
  meta: {
    total: number; // Total number of routes
    page: number; // Current page number
    per_page: number; // Items per page
    total_pages: number; // Total number of pages
  };
}