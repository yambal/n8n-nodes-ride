import { Trip } from './dataTransformer';
import { TripAnalysis } from './types/analysis.types';



/**
 * Trip型からTrackPoint配列を解析して付加価値的な分析結果を生成
 * Ride APIが提供していない有用な情報のみを計算
 */
export function analyzeTripData(trip: Trip): TripAnalysis {
  const trackPoints = trip.track_points;
  
  if (!trackPoints || trackPoints.length === 0) {
    throw new Error('No track points available for analysis');
  }



  // 地理的極値を計算
  let northernmost = trackPoints[0];
  let southernmost = trackPoints[0];
  let westernmost = trackPoints[0];
  let easternmost = trackPoints[0];

  for (const point of trackPoints) {
    if (point.latitude > northernmost.latitude) northernmost = point;
    if (point.latitude < southernmost.latitude) southernmost = point;
    if (point.longitude < westernmost.longitude) westernmost = point;
    if (point.longitude > easternmost.longitude) easternmost = point;
  }

  const analysis: TripAnalysis = {
    // 地理的極値（APIでは提供されない）
    geographicExtremes: {
      northernmost,
      southernmost,
      westernmost,
      easternmost
    }
  };

  return analysis;
}