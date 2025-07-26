/**
 * KML generation related types
 */

/**
 * Represents a single GPS track point for KML conversion
 */
export interface KMLTrackPoint {
  x: number; // longitude
  y: number; // latitude
  e: number; // elevation (meters)
  t: number; // timestamp (Unix time)
  s?: number; // speed (m/s)
  h?: number; // heart rate (bpm)
  c?: number; // cadence (rpm)
}

/**
 * Trip data structure for KML conversion
 */
export interface KMLTripData {
  trip: {
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
    track_points: Array<KMLTrackPoint>;
  };
}

/**
 * KML placemark configuration
 */
export interface KMLPlacemark {
  name: string;
  description?: string;
  coordinates: string;
  styleUrl?: string;
}

/**
 * KML style configuration
 */
export interface KMLStyle {
  id: string;
  lineColor?: string;
  lineWidth?: number;
  pointColor?: string;
  pointScale?: number;
}