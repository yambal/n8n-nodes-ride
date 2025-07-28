import { consolidateStationaryPoints } from './stationaryPointDetection';

interface TimedPoint {
  timestamp: number;
  latitude: number;
  longitude: number;
}

/**
 * Type guard to check if points have timestamp property (Trip data)
 */
function hasTimedPointProperties(point: any): point is TimedPoint {
  return point && typeof point.timestamp === 'number' && 
         typeof point.latitude === 'number' && 
         typeof point.longitude === 'number';
}

/**
 * Normalizes an array of track points by removing redundant data points
 * 
 * @param points Array of TrackPoint or RouteTrackPoint objects
 * @returns Normalized array of the same type
 */
export function normalizeTrackPoints<T>(points: T[]): T[] {
  if (points.length === 0) {
    return points;
  }
  
  // Check if this is Trip data (has timestamp) or Route data (no timestamp)
  if (hasTimedPointProperties(points[0])) {
    // Trip data: Apply stationary point consolidation
    return consolidateStationaryPoints(points as T & TimedPoint[]) as T[];
  } else {
    // Route data: No timestamp, skip stationary point detection for now
    // TODO: Implement distance-based normalization for Route data
    return points;
  }
}