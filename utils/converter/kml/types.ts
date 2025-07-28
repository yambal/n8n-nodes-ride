/**
 * KML generation related types
 */

/**
 * Represents a single GPS track point for KML conversion
 */
export interface KMLTrackPoint {
  x: number; // longitude
  y: number; // latitude
  z?: number; // elevation (optional)
  t?: number; // timestamp (optional, as UNIX timestamp)
}

/**
 * Trip data structure specifically formatted for KML conversion
 */
export interface KMLTripData {
  trip: {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    distance?: number; // in meters
    elevation_gain?: number; // in meters
    elevation_loss?: number; // in meters
    moving_time?: number; // in seconds
    stopped_time?: number; // in seconds
    max_speed?: number; // in m/s
    avg_speed?: number; // in m/s
    user_id: number;
    track_points: KMLTrackPoint[];
  };
}

/**
 * KML Style element configuration
 */
export interface KMLStyle {
  id: string;
  lineColor?: string; // AABBGGRR format (Alpha, Blue, Green, Red)
  lineWidth?: number;
  pointColor?: string; // AABBGGRR format for points
  pointScale?: number;
  polyColor?: string; // AABBGGRR format for filled areas
  iconUrl?: string;
  iconScale?: number;
}

/**
 * KML Placemark element configuration
 */
export interface KMLPlacemark {
  name: string;
  description?: string;
  styleUrl?: string;
  geometry?: 'Point' | 'LineString' | 'Polygon'; // Optional with default handling
  coordinates: string; // KML coordinate format: "lon,lat,alt lon,lat,alt..."
}