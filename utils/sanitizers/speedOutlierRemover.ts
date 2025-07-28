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

function calculateSpeed(point1: any, point2: any): number {
  if (!point1.timestamp || !point2.timestamp) return 0;
  
  const distance = calculateDistance(
    point1.latitude, point1.longitude,
    point2.latitude, point2.longitude
  );
  // タイムスタンプはUnix時間（秒）で既に格納されている前提
  const timeDiff = Math.abs(point2.timestamp - point1.timestamp); // seconds
  
  if (timeDiff === 0) return 0;
  return distance / timeDiff; // m/s
}

function calculateSpeedStats(points: any[]): { mean: number; stdDev: number; threshold: number } {
  const calculatedSpeeds: number[] = [];
  
  for (let i = 1; i < points.length; i++) {
    const speed = calculateSpeed(points[i-1], points[i]);
    if (speed > 0) {
      calculatedSpeeds.push(speed);
    }
  }
  
  if (calculatedSpeeds.length === 0) {
    return { mean: 0, stdDev: 0, threshold: Infinity };
  }
  
  const mean = calculatedSpeeds.reduce((sum, speed) => sum + speed, 0) / calculatedSpeeds.length;
  const variance = calculatedSpeeds.reduce((sum, speed) => sum + Math.pow(speed - mean, 2), 0) / calculatedSpeeds.length;
  const stdDev = Math.sqrt(variance);
  
  // 平均 + 3σを超える値を異常値とする
  const threshold = mean + (3 * stdDev);
  
  return { mean, stdDev, threshold };
}

export function removeSpeedOutliers<T>(points: T[]): T[] {
  console.log(`[removeSpeedOutliers] Starting speed outlier removal for ${points.length} points`);
  
  if (points.length < 2) {
    console.log(`[removeSpeedOutliers] Too few points (${points.length}), skipping outlier removal`);
    return points;
  }
  
  const { mean, stdDev, threshold } = calculateSpeedStats(points as any[]);
  console.log(`[removeSpeedOutliers] Speed statistics - Mean: ${(mean * 3.6).toFixed(2)} km/h, StdDev: ${(stdDev * 3.6).toFixed(2)} km/h, Threshold: ${(threshold * 3.6).toFixed(2)} km/h`);
  
  let outlierCount = 0;
  const filtered: T[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i] as any;
    let shouldRemove = false;
    
    // 前のポイントとの速度を計算して異常値チェック
    if (i > 0 && point.timestamp && (points[i-1] as any).timestamp) {
      const calculatedSpeed = calculateSpeed(points[i-1] as any, point);
      if (calculatedSpeed > threshold) {
        console.log(`[removeSpeedOutliers] Removing point with outlier calculated speed: ${(calculatedSpeed * 3.6).toFixed(2)} km/h (threshold: ${(threshold * 3.6).toFixed(2)} km/h)`);
        outlierCount++;
        shouldRemove = true;
      }
    }
    
    // 次のポイントとの速度も計算して異常値チェック
    if (i < points.length - 1 && point.timestamp && (points[i+1] as any).timestamp) {
      const calculatedSpeed = calculateSpeed(point, points[i+1] as any);
      if (calculatedSpeed > threshold) {
        console.log(`[removeSpeedOutliers] Removing point with outlier calculated speed: ${(calculatedSpeed * 3.6).toFixed(2)} km/h (threshold: ${(threshold * 3.6).toFixed(2)} km/h)`);
        outlierCount++;
        shouldRemove = true;
      }
    }
    
    if (!shouldRemove) {
      filtered.push(point);
    }
  }
  
  const removalRate = (outlierCount / points.length * 100).toFixed(1);
  console.log(`[removeSpeedOutliers] Completed: Removed ${outlierCount} outlier points (${removalRate}%) - ${points.length} → ${filtered.length} points`);
  
  return filtered;
}