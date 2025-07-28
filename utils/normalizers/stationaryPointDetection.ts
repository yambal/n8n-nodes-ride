import { TimestampedPoint, StationaryGroup, StationaryDetectionOptions, calculateDistance, calculateAveragePoint } from '../common/geoUtils';

/**
 * Generic stationary point detection algorithm
 * @param points Array of timestamped coordinate points
 * @param options Detection options (distance and time thresholds)
 * @returns Array of stationary groups
 */
export function detectStationaryGroups<T extends TimestampedPoint>(
  points: T[], 
  options: StationaryDetectionOptions = {}
): StationaryGroup<T>[] {
  const DISTANCE_THRESHOLD = options.distanceThreshold ?? 100; // meters
  const TIME_THRESHOLD = options.timeThreshold ?? 10 * 60; // 10 minutes in seconds
  const groups: StationaryGroup<T>[] = [];
  
  let currentGroupStart = 0;
  
  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(
      points[currentGroupStart].latitude,
      points[currentGroupStart].longitude,
      points[i].latitude,
      points[i].longitude
    );
    
    // If current point is too far from group start, check if previous group was stationary
    if (distance > DISTANCE_THRESHOLD) {
      const groupDuration = points[i - 1].timestamp - points[currentGroupStart].timestamp;
      
      if (groupDuration >= TIME_THRESHOLD && i - 1 > currentGroupStart) {
        // Create stationary group
        const groupPoints = points.slice(currentGroupStart, i);
        const centerPoint = calculateAveragePoint(groupPoints);
        
        // Calculate actual radius of the group
        const maxDistance = Math.max(...groupPoints.map(p => 
          calculateDistance(centerPoint.latitude, centerPoint.longitude, p.latitude, p.longitude)
        ));
        
        groups.push({
          startIndex: currentGroupStart,
          endIndex: i - 1,
          points: groupPoints,
          centerPoint,
          duration: groupDuration,
          radius: maxDistance
        });
      }
      
      // Start new group
      currentGroupStart = i;
    }
  }
  
  // Check the last group
  if (currentGroupStart < points.length - 1) {
    const groupDuration = points[points.length - 1].timestamp - points[currentGroupStart].timestamp;
    
    if (groupDuration >= TIME_THRESHOLD) {
      const groupPoints = points.slice(currentGroupStart);
      const centerPoint = calculateAveragePoint(groupPoints);
      
      const maxDistance = Math.max(...groupPoints.map(p => 
        calculateDistance(centerPoint.latitude, centerPoint.longitude, p.latitude, p.longitude)
      ));
      
      groups.push({
        startIndex: currentGroupStart,
        endIndex: points.length - 1,
        points: groupPoints,
        centerPoint,
        duration: groupDuration,
        radius: maxDistance
      });
    }
  }
  
  return groups;
}

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