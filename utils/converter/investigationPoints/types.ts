import { TrackPoint } from '../../../nodes/Ride/types';

/**
 * スコア付きの調査ポイント候補
 */
export interface ScoredPoint extends TrackPoint {
  /** 調査優先度スコア（高いほど重要） */
  score: number;
}

/**
 * 調査ポイント抽出のオプション設定
 */
export interface InvestigationPointsOptions {
  /** 出力する調査ポイントの最大数（デフォルト: 50） */
  maxPoints?: number;
  
  /** 停滞検出の設定 */
  stationaryDetection?: {
    /** 最小滞在時間（秒）デフォルト: 30分 */
    minDuration?: number;
    /** 最大半径（メートル）デフォルト: 200m */
    maxDistance?: number;
  };
}