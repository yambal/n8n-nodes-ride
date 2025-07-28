export interface CoordinatePoint {
  longitude: number;
  latitude: number;
}

export interface TimestampedPoint extends CoordinatePoint {
  timestamp: number;
}

export interface StationaryGroup<T = TimestampedPoint> {
  startIndex: number;
  endIndex: number;
  points: T[];
  centerPoint: T;
  duration: number;
  radius: number;
}

export interface StationaryDetectionOptions {
  distanceThreshold?: number; // meters
  timeThreshold?: number; // seconds
}

/**
 * Calculates the distance between two GPS coordinates using Haversine formula
 * @param lat1 First point latitude in degrees
 * @param lon1 First point longitude in degrees  
 * @param lat2 Second point latitude in degrees
 * @param lon2 Second point longitude in degrees
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculates the average coordinate from an array of points
 * @param points Array of coordinate points
 * @returns Average coordinate point
 */
export function calculateAveragePoint<T extends TimestampedPoint>(points: T[]): T {
  const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const avgTime = Math.round((startTime + endTime) / 2);
  
  return {
    ...points[0],
    latitude: avgLat,
    longitude: avgLon,
    timestamp: avgTime
  } as T;
}


/**
 * Extract key points from stationary groups for marker placement
 * @param groups Array of stationary groups
 * @returns Array of center points suitable for markers
 */
export function extractStationaryMarkers<T extends TimestampedPoint>(groups: StationaryGroup<T>[]): T[] {
  return groups.map(group => group.centerPoint);
}


/**
 * Filter points to get significant locations (long stays)
 * @param points Array of timestamped coordinate points
 * @param minDuration Minimum duration in seconds (default: 30 minutes)
 * @param maxDistance Maximum radius in meters (default: 200m)
 * @returns Array of significant location points
 */
export function getSignificantLocations<T extends TimestampedPoint>(
  points: T[], 
  minDuration: number = 30 * 60, 
  maxDistance: number = 200
): T[] {
  const { detectStationaryGroups } = require('../normalizers/stationaryPointDetection');
  
  const groups = detectStationaryGroups(points, { 
    distanceThreshold: maxDistance, 
    timeThreshold: minDuration 
  });
  
  return extractStationaryMarkers(groups);
}