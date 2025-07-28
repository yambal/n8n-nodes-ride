
import { removeSpeedOutliers } from './speedOutlierRemover';

/**
 * Sanitizes an array of track points
 * 
 * @param points Array of TrackPoint or RouteTrackPoint objects
 * @returns Sanitized array of the same type
 */
export function sanitizeTrackPoints<T>(points: T[]): T[] {
  console.log(`[sanitizeTrackPoints] Processing ${points.length} track points`);
  
  if (points.length === 0) {
    return points;
  }

  // 速度異常の削除
  const sanitized = removeSpeedOutliers(points);
  
  console.log(`[sanitizeTrackPoints] Sanitized ${points.length} -> ${sanitized.length} points`);
  return sanitized;
}