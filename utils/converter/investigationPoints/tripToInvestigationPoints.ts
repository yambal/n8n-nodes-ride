/**
 * 調査ポイント候補機能実装
 * 
 * 【概要】
 * Tripデータから市町村調査用の重要地点を抽出する機能。
 * 外部API調査コストを考慮し、最大50地点以内に厳選。
 * 
 * 【スコアリング方式】
 * - 意味のある地点：高スコア（重要度・特異性に基づく）
 * - 定点的な地点：低スコア（機械的な等間隔分割）
 * 
 * 【処理フロー】
 * 1. 各種条件による地点抽出とスコア付与
 * 2. 1km以内の近接地点マージ（低スコア削除、80pt以上保護）
 * 3. 最近傍距離による加点（km単位で四捨五入）
 * 4. 上位50地点選出・TrackPoint[]変換
 * 
 * 【パフォーマンス最適化】
 * - 距離計算キャッシュ（同一地点ペアの重複計算回避）
 * - 早期終了（条件満足時の即座break）
 */

import { TrackPoint } from '../../../nodes/Ride/types';
import { TripData } from '../../dataTransformer';
import { ScoredPoint, InvestigationPointsOptions } from './types';
import { getSignificantLocations, calculateDistance } from '../../common/geoUtils';

// ============================================================================
// スコアリング定数（調整可能）
// ============================================================================

// === 意味のある地点（高スコア）===
const SCORE_START_END_POINT = 100;       // 開始・終了地点（必須調査地点）
const SCORE_STATIONARY_POINT = 80;       // 停滞地点（長時間滞在＝活動地点）
const SCORE_EXTREME_POINT = 70;          // 四極端（最南北東西＝地域境界）
const SCORE_ELEVATION_PEAK = 60;         // 標高ピーク（峠＝県境・交通要衝）

// === 定点的な地点（低スコア）===
const SCORE_COURSE_DIVISION = 20;        // コース10等分地点（機械的等分割）
const SCORE_TIME_INTERVAL = 10;          // 30分間隔地点（機械的時間間隔）
const SCORE_DISTANCE_INTERVAL = 10;      // 5km間隔地点（機械的距離間隔）

// ============================================================================
// 処理パラメータ定数
// ============================================================================
const PROTECTED_SCORE_THRESHOLD = 80;    // この値以上は削除禁止
const MERGE_DISTANCE_THRESHOLD = 1000;   // マージ対象距離（メートル）
const ELEVATION_DIFF_THRESHOLD = 50;     // 標高差閾値（メートル）
const ELEVATION_RANGE = 1000;            // 標高チェック範囲（メートル）
const TIME_INTERVAL_SECONDS = 30 * 60;   // 時間間隔（秒）
const DISTANCE_INTERVAL_METERS = 5000;   // 距離間隔（メートル）
const EARLY_EXIT_DISTANCE = 10;          // 早期終了距離（メートル）

export function tripToInvestigationPoints(
  tripData: TripData,
  options?: InvestigationPointsOptions
): TrackPoint[] {
  const trackPoints = tripData.trip.track_points;
  const maxPoints = options?.maxPoints || 50;
  
  if (trackPoints.length === 0) {
    return [];
  }
  
  // 調査ポイント候補の配列（空から開始）
  const investigationPoints: ScoredPoint[] = [];
  
  // 開始地点を追加
  if (trackPoints.length > 0) {
    investigationPoints.push({
      ...trackPoints[0],
      score: SCORE_START_END_POINT
    });
  }
  
  // 終了地点を追加（開始地点と異なる場合）
  if (trackPoints.length > 1) {
    investigationPoints.push({
      ...trackPoints[trackPoints.length - 1],
      score: SCORE_START_END_POINT
    });
  }
  
  // 停滞地点を追加
  const minDuration = options?.stationaryDetection?.minDuration || TIME_INTERVAL_SECONDS;
  const maxDistance = options?.stationaryDetection?.maxDistance || 200;
  
  const significantLocations = getSignificantLocations(trackPoints, minDuration, maxDistance);
  
  for (const location of significantLocations) {
    investigationPoints.push({
      ...location,
      score: SCORE_STATIONARY_POINT
    });
  }
  
  // 標高ピーク地点を追加（前後1kmで最高標高かつ標高差50m以上）
  for (let i = 0; i < trackPoints.length; i++) {
    const currentPoint = trackPoints[i];
    let minElevation = currentPoint.elevation;
    let maxElevation = currentPoint.elevation;
    let isHighestInRange = true;
    
    // 指定範囲内の地点をチェック
    for (let j = 0; j < trackPoints.length; j++) {
      if (i === j) continue;
      
      const distance = calculateDistance(
        currentPoint.latitude, currentPoint.longitude,
        trackPoints[j].latitude, trackPoints[j].longitude
      );
      
      // 指定範囲以内の地点のみ考慮
      if (distance <= ELEVATION_RANGE) {
        // 最高標高チェック
        if (trackPoints[j].elevation > currentPoint.elevation) {
          isHighestInRange = false;
        }
        
        // 標高差計算用の最小・最大標高を更新
        minElevation = Math.min(minElevation, trackPoints[j].elevation);
        maxElevation = Math.max(maxElevation, trackPoints[j].elevation);
      }
    }
    
    // 条件を満たす地点を追加
    const elevationDifference = maxElevation - minElevation;
    if (isHighestInRange && elevationDifference >= ELEVATION_DIFF_THRESHOLD) {
      investigationPoints.push({
        ...currentPoint,
        score: SCORE_ELEVATION_PEAK
      });
    }
  }
  
  // コースを10等分した地点を追加
  if (trackPoints.length >= 10) {
    for (let i = 1; i <= 10; i++) {
      const index = Math.floor((trackPoints.length - 1) * (i / 10));
      investigationPoints.push({
        ...trackPoints[index],
        score: SCORE_COURSE_DIVISION
      });
    }
  }
  
  // 最南端、最北端、最西端、最東端の地点を追加
  if (trackPoints.length > 0) {
    let northernmost = trackPoints[0];
    let southernmost = trackPoints[0];
    let easternmost = trackPoints[0];
    let westernmost = trackPoints[0];
    
    for (const point of trackPoints) {
      if (point.latitude > northernmost.latitude) northernmost = point;
      if (point.latitude < southernmost.latitude) southernmost = point;
      if (point.longitude > easternmost.longitude) easternmost = point;
      if (point.longitude < westernmost.longitude) westernmost = point;
    }
    
    // 各極端点を追加
    investigationPoints.push({
      ...northernmost,
      score: SCORE_EXTREME_POINT
    });
    
    investigationPoints.push({
      ...southernmost,
      score: SCORE_EXTREME_POINT
    });
    
    investigationPoints.push({
      ...easternmost,
      score: SCORE_EXTREME_POINT
    });
    
    investigationPoints.push({
      ...westernmost,
      score: SCORE_EXTREME_POINT
    });
  }
  
  // 時間間隔地点を追加
  if (trackPoints.length > 0) {
    const startTime = trackPoints[0].timestamp;
    
    for (const point of trackPoints) {
      const elapsedTime = point.timestamp - startTime;
      
      // 指定間隔の倍数かチェック（±30秒の誤差を許容）
      if (elapsedTime > 0 && Math.abs(elapsedTime % TIME_INTERVAL_SECONDS) <= 30) {
        investigationPoints.push({
          ...point,
          score: SCORE_TIME_INTERVAL
        });
      }
    }
  }
  
  // 距離間隔地点を追加
  if (trackPoints.length > 1) {
    let totalDistance = 0;
    let lastMarkedDistance = 0;
    
    for (let i = 1; i < trackPoints.length; i++) {
      const prevPoint = trackPoints[i - 1];
      const currentPoint = trackPoints[i];
      
      // 前の地点からの距離を累積
      const segmentDistance = calculateDistance(
        prevPoint.latitude, prevPoint.longitude,
        currentPoint.latitude, currentPoint.longitude
      );
      totalDistance += segmentDistance;
      
      // 指定間隔ごとの地点をチェック
      if (totalDistance - lastMarkedDistance >= DISTANCE_INTERVAL_METERS) {
        investigationPoints.push({
          ...currentPoint,
          score: SCORE_DISTANCE_INTERVAL
        });
        lastMarkedDistance = Math.floor(totalDistance / DISTANCE_INTERVAL_METERS) * DISTANCE_INTERVAL_METERS;
      }
    }
  }
  
  // スコア順でソート（降順）
  investigationPoints.sort((a, b) => b.score - a.score);
  
  // === 最適化: 距離計算の一元化とマージ処理 ===
  const mergedPoints: ScoredPoint[] = [];
  const distanceCache = new Map<string, number>();
  
  // 距離計算の最適化関数（キャッシュ付き）
  const getDistanceWithCache = (point1: ScoredPoint, point2: ScoredPoint): number => {
    // 一意のキーを生成（緯度経度の組み合わせ）
    const key1 = `${point1.latitude.toFixed(6)},${point1.longitude.toFixed(6)}`;
    const key2 = `${point2.latitude.toFixed(6)},${point2.longitude.toFixed(6)}`;
    const cacheKey = key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
    
    if (!distanceCache.has(cacheKey)) {
      const distance = calculateDistance(
        point1.latitude, point1.longitude,
        point2.latitude, point2.longitude
      );
      distanceCache.set(cacheKey, distance);
    }
    
    return distanceCache.get(cacheKey)!;
  };
  
  for (const currentPoint of investigationPoints) {
    let shouldAdd = true;
    
    // 既にmergedPointsに追加済みの地点との距離をチェック
    for (const existingPoint of mergedPoints) {
      const distance = getDistanceWithCache(currentPoint, existingPoint);
      
      // 指定距離以内に既存地点がある場合
      if (distance <= MERGE_DISTANCE_THRESHOLD) {
        // 保護スコア以上の地点は削除禁止
        if (existingPoint.score >= PROTECTED_SCORE_THRESHOLD && currentPoint.score >= PROTECTED_SCORE_THRESHOLD) {
          // 両方とも保護スコア以上の場合は両方残す（削除しない）
          continue; // 次の既存地点をチェック
        } else if (existingPoint.score >= PROTECTED_SCORE_THRESHOLD) {
          // 既存地点が保護スコア以上の場合、既存地点は削除せずcurrentPointを追加しない
          shouldAdd = false;
          break; // 早期終了
        } else if (currentPoint.score >= PROTECTED_SCORE_THRESHOLD) {
          // currentPointが保護スコア以上の場合、既存地点を削除してcurrentPointを追加
          const index = mergedPoints.indexOf(existingPoint);
          mergedPoints.splice(index, 1);
          break; // 早期終了、currentPointを追加するためshouldAddはtrueのまま
        } else {
          // 両方とも80ポイント未満の場合は通常のスコア比較
          if (currentPoint.score > existingPoint.score) {
            const index = mergedPoints.indexOf(existingPoint);
            mergedPoints.splice(index, 1);
            // currentPointを追加するためshouldAddはtrueのまま
          } else {
            // 既存地点の方がスコアが高い、または同スコアの場合、currentPointは追加しない
            // （同スコアの場合は最初に処理された方を優先）
            shouldAdd = false;
          }
          break; // 早期終了
        }
      }
    }
    
    if (shouldAdd) {
      mergedPoints.push(currentPoint);
    }
  }
  
  // === 最適化: 距離による加点処理（キャッシュを再利用） ===
  for (let i = 0; i < mergedPoints.length; i++) {
    const currentPoint = mergedPoints[i];
    let minDistance = Infinity;
    
    // 他の地点との最短距離を求める（キャッシュを活用）
    for (let j = 0; j < mergedPoints.length; j++) {
      if (i === j) continue; // 自分自身は除外
      
      const distance = getDistanceWithCache(currentPoint, mergedPoints[j]);
      
      if (distance < minDistance) {
        minDistance = distance;
        // 早期終了の最適化: 距離が0に近い場合（同一地点）はすぐに終了
        if (minDistance < EARLY_EXIT_DISTANCE) break;
      }
    }
    
    // 最短距離を km 単位に変換し、四捨五入で加点
    if (minDistance !== Infinity) {
      const bonusPoints = Math.round(minDistance / 1000); // メートルをkmに変換して四捨五入
      mergedPoints[i].score += bonusPoints;
    }
  }
  
  // 最終ソート（スコア順降順）
  mergedPoints.sort((a, b) => b.score - a.score);
  
  // maxPoints数に切り落とし
  const finalPoints = mergedPoints.slice(0, maxPoints);
  
  // TrackPoint[]として返す（scoreプロパティを除去）
  const result: TrackPoint[] = finalPoints.map(point => ({
    longitude: point.longitude,
    latitude: point.latitude,
    elevation: point.elevation,
    timestamp: point.timestamp,
    speed: point.speed,
    heartRate: point.heartRate,
    cadence: point.cadence
  }));
  
  return result;
}