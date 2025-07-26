import { TrackPoint } from '../../nodes/Ride/types/Trip.types';

/**
 * TrackPoint配列から計算される付加価値的な解析結果
 * Ride APIが提供していない、TrackPointデータから得られる有用な情報のみ
 */
export interface TripAnalysis {

  // 地理的極値（APIでは提供されない）
  geographicExtremes: {
    northernmost: TrackPoint; // 最北端のTrackPoint
    southernmost: TrackPoint; // 最南端のTrackPoint
    westernmost: TrackPoint; // 最西端のTrackPoint
    easternmost: TrackPoint; // 最東端のTrackPoint
  };


}