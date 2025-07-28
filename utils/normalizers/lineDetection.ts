import { CoordinatePoint, calculateDistance } from '../common/geoUtils';

/**
 * Calculates the perpendicular distance from a point to a line segment
 * @param pointLat Point latitude
 * @param pointLon Point longitude
 * @param line1Lat Line start latitude
 * @param line1Lon Line start longitude
 * @param line2Lat Line end latitude
 * @param line2Lon Line end longitude
 * @returns Distance in meters
 */
export function calculatePerpendicularDistance(
  pointLat: number, pointLon: number,
  line1Lat: number, line1Lon: number,
  line2Lat: number, line2Lon: number
): number {
  // Convert to radians
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371000; // Earth's radius in meters
  
  const lat1 = toRad(line1Lat);
  const lon1 = toRad(line1Lon);
  const lat2 = toRad(line2Lat);
  const lon2 = toRad(line2Lon);
  const latP = toRad(pointLat);
  const lonP = toRad(pointLon);
  
  // If start and end points are the same, return distance to that point
  if (Math.abs(lat1 - lat2) < 1e-10 && Math.abs(lon1 - lon2) < 1e-10) {
    return calculateDistance(pointLat, pointLon, line1Lat, line1Lon);
  }
  
  // Calculate cross track distance (perpendicular distance)
  const dLon13 = lonP - lon1;
  const bearing13 = Math.atan2(
    Math.sin(dLon13) * Math.cos(latP),
    Math.cos(lat1) * Math.sin(latP) - Math.sin(lat1) * Math.cos(latP) * Math.cos(dLon13)
  );
  
  const dLon12 = lon2 - lon1;
  const bearing12 = Math.atan2(
    Math.sin(dLon12) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon12)
  );
  
  const distance13 = Math.acos(
    Math.sin(lat1) * Math.sin(latP) + Math.cos(lat1) * Math.cos(latP) * Math.cos(dLon13)
  ) * R;
  
  const crossTrackDistance = Math.abs(Math.asin(Math.sin(distance13 / R) * Math.sin(bearing13 - bearing12)) * R);
  
  return crossTrackDistance;
}

/**
 * Removes collinear points that lie approximately on a straight line between their neighbors
 * @param points Array of coordinate points
 * @param toleranceRatio Relative tolerance as a ratio of the line segment length (default: 0.01 = 1%)
 * @returns Array with collinear intermediate points removed
 */
export function removeCollinearPoints<T extends CoordinatePoint>(
  points: T[], 
  toleranceRatio: number = 0.001
): T[] {
  if (points.length <= 2) {
    return points;
  }
  
  const result: T[] = [points[0]]; // Always keep the first point
  
  for (let i = 1; i < points.length - 1; i++) {
    const prevPoint = result[result.length - 1]; // Use last point added to result
    const currentPoint = points[i];
    const nextPoint = points[i + 1];
    
    // Calculate distance between prev and next points to determine relative tolerance
    const lineDistance = calculateDistance(
      prevPoint.latitude, prevPoint.longitude,
      nextPoint.latitude, nextPoint.longitude
    );
    
    // Calculate relative tolerance based on line segment length
    const tolerance = lineDistance * toleranceRatio;
    
    // Calculate perpendicular distance from current point to line between prev and next
    const distance = calculatePerpendicularDistance(
      currentPoint.latitude, currentPoint.longitude,
      prevPoint.latitude, prevPoint.longitude,
      nextPoint.latitude, nextPoint.longitude
    );
    
    // Keep the point if it's not collinear (distance > tolerance)
    if (distance > tolerance) {
      result.push(currentPoint);
    }
  }
  
  // Always keep the last point
  result.push(points[points.length - 1]);
  
  // ログ出力：除去結果の表示
  const originalCount = points.length;
  const finalCount = result.length;
  const removedCount = originalCount - finalCount;
  const reductionPercent = ((removedCount / originalCount) * 100).toFixed(1);
  
  console.log(`[removeCollinearPoints] ${originalCount} → ${finalCount} points (-${removedCount}, ${reductionPercent}% reduction)`);
  
  return result;
}