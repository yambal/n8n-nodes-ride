/**
 * Represents a single GPS track point with optional sensor data from API
 */
export interface APITrackPoint {
  x: number; // longitude
  y: number; // latitude
  e: number; // elevation (meters)
  t: number; // timestamp (Unix time)
  s?: number; // speed (m/s)
  h?: number; // heart rate (bpm)
  c?: number; // cadence (rpm)
}

/**
 * Represents a single GPS track point with readable property names
 */
export interface TrackPoint {
  longitude: number; // longitude in decimal degrees
  latitude: number; // latitude in decimal degrees
  elevation: number; // elevation in meters
  timestamp: number; // timestamp (Unix time)
  speed?: number; // speed in m/s
  heartRate?: number; // heart rate in bpm
  cadence?: number; // cadence in rpm
}

/**
 * Complete Trip object from Ride with GPS API
 */
export interface APITrip {
  id: number;
  name: string;
  description?: string;
  departed_at: string; // ISO8601 timestamp
  locality?: string; // City/location name
  administrative_area?: string; // State/province
  country_code?: string; // ISO country code
  distance: number; // Distance in meters
  duration: number; // Total duration in seconds
  elevation_gain: number; // Elevation gain in meters
  elevation_loss: number; // Elevation loss in meters
  moving_time?: number; // Moving time in seconds
  average_speed?: number; // Average speed in m/s
  max_speed?: number; // Maximum speed in m/s
  average_power?: number; // Average power in watts
  max_power?: number; // Maximum power in watts
  average_heart_rate?: number; // Average heart rate in bpm
  max_heart_rate?: number; // Maximum heart rate in bpm
  average_cadence?: number; // Average cadence in rpm
  max_cadence?: number; // Maximum cadence in rpm
  calories?: number; // Estimated calories burned
  user_id: number; // Owner user ID
  visibility: number; // Visibility setting (0=private, 1=public, etc.)
  created_at: string; // ISO8601 timestamp
  updated_at: string; // ISO8601 timestamp
  track_points: Array<APITrackPoint>; // GPS track data
}

/**
 * Single trip response from API
 */
export interface APITripData {
  trip: APITrip;
}

/**
 * Multiple trips response from API with pagination metadata
 */
export interface APITripsListResponse {
  trips: Array<APITrip>;
  meta: {
    total: number; // Total number of trips
    page: number; // Current page number
    per_page: number; // Items per page
    total_pages: number; // Total number of pages
  };
}