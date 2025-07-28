import { TimestampedPoint, detectStationaryGroups } from './geoUtils';

/**
 * Consolidates stationary points by replacing groups with start, center, and end points
 * @param points Array of timed coordinate points
 * @returns Array with consolidated stationary points
 */
export function consolidateStationaryPoints<T extends TimestampedPoint>(points: T[]): T[] {
  if (points.length < 2) {
    return points;
  }
  
  const stationaryGroups = detectStationaryGroups(points, { distanceThreshold: 100, timeThreshold: 10 * 60 });
  
  if (stationaryGroups.length === 0) {
    return points;
  }

  const result: T[] = [];
  let lastProcessedIndex = -1;
  
  for (const group of stationaryGroups) {
    // Add points before this group
    for (let i = lastProcessedIndex + 1; i < group.startIndex; i++) {
      result.push(points[i]);
    }
    
    // Add first point of the group
    result.push(points[group.startIndex]);
    
    // Add center point (with averaged coordinates and timestamp)
    const centerPoint = {
      ...points[group.startIndex],
      latitude: group.centerPoint.latitude,
      longitude: group.centerPoint.longitude,
      timestamp: group.centerPoint.timestamp
    } as T;
    result.push(centerPoint);
    
    // Add last point of the group
    if (group.endIndex > group.startIndex) {
      result.push(points[group.endIndex]);
    }
    
    lastProcessedIndex = group.endIndex;
  }
  
  // Add remaining points after the last group
  for (let i = lastProcessedIndex + 1; i < points.length; i++) {
    result.push(points[i]);
  }
  
  const originalCount = points.length;
  const finalCount = result.length;
  const reductionCount = originalCount - finalCount;
  const reductionPercent = ((reductionCount / originalCount) * 100).toFixed(1);
  
  console.log(`[consolidateStationaryPoints] ${originalCount} → ${finalCount} points (-${reductionCount}, ${reductionPercent}% reduction)`);
  
  return result;
}