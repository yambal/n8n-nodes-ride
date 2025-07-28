interface TimedCoordinatePoint {
  longitude: number;
  latitude: number;
  timestamp: number;
}

interface StationaryGroup {
  startIndex: number;
  endIndex: number;
  points: TimedCoordinatePoint[];
  centerPoint: TimedCoordinatePoint;
}

/**
 * Calculates the distance between two GPS coordinates using Haversine formula
 * @param lat1 First point latitude in degrees
 * @param lon1 First point longitude in degrees  
 * @param lat2 Second point latitude in degrees
 * @param lon2 Second point longitude in degrees
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
function calculateAveragePoint(points: TimedCoordinatePoint[]): TimedCoordinatePoint {
  const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
  const startTime = points[0].timestamp;
  const endTime = points[points.length - 1].timestamp;
  const avgTime = Math.round((startTime + endTime) / 2);
  
  return {
    latitude: avgLat,
    longitude: avgLon,
    timestamp: avgTime
  };
}

/**
 * Detects stationary point groups within 100m radius for more than 15 minutes
 * @param points Array of timed coordinate points
 * @returns Array of stationary groups
 */
function detectStationaryGroups<T extends TimedCoordinatePoint>(points: T[]): StationaryGroup[] {
  const DISTANCE_THRESHOLD = 100; // meters
  const TIME_THRESHOLD = 10 * 60; // 10 minutes in seconds (timestamp is in seconds)
  const groups: StationaryGroup[] = [];
  
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
        const groupPoints = points.slice(currentGroupStart, i) as TimedCoordinatePoint[];
        const centerPoint = calculateAveragePoint(groupPoints);
        
        groups.push({
          startIndex: currentGroupStart,
          endIndex: i - 1,
          points: groupPoints,
          centerPoint
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
      const groupPoints = points.slice(currentGroupStart) as TimedCoordinatePoint[];
      const centerPoint = calculateAveragePoint(groupPoints);
      
      groups.push({
        startIndex: currentGroupStart,
        endIndex: points.length - 1,
        points: groupPoints,
        centerPoint
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
export function consolidateStationaryPoints<T extends TimedCoordinatePoint>(points: T[]): T[] {
  if (points.length < 2) {
    return points;
  }
  
  const stationaryGroups = detectStationaryGroups(points);
  
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