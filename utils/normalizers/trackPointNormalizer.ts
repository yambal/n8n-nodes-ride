// 停滞ポイント統合機能をインポート
import { consolidateStationaryPoints } from './stationaryPointDetection';
// 地理座標の基本インターフェースをインポート
import { CoordinatePoint } from '../common/geoUtils';
// 直線上の冗長ポイント除去機能をインポート
import { removeCollinearPoints } from './lineDetection';

// タイムスタンプ付きポイントのインターフェース（Trip データ用）
interface TimedPoint {
  timestamp: number;  // UNIX タイムスタンプ
  latitude: number;   // 緯度
  longitude: number;  // 経度
}

/**
 * Trip データかどうかを判定するタイプガード関数
 * タイムスタンプが含まれているかをチェック
 */
function hasTimedPointProperties(point: any): point is TimedPoint {
  return point && typeof point.timestamp === 'number' && 
         typeof point.latitude === 'number' && 
         typeof point.longitude === 'number';
}

// 直線削除の強度レベル定数
export enum CollinearRemovalLevel {
  LOW = 0.002,      // 弱（0.2%）- より多くのポイントを保持
  MEDIUM = 0.0035,  // 中（0.35%） - バランス重視
  HIGH = 0.005      // 強（0.5%） - より積極的に除去
}

/**
 * トラックポイント配列を正規化して冗長なデータポイントを除去
 * 
 * 処理の流れ：
 * 1. 共線ポイント除去：ほぼ直線上にある中間ポイントを除去
 * 2. データ種別判定：タイムスタンプの有無でTrip/Routeデータを判別
 * 3. 停滞ポイント統合：Trip データの場合のみ、停滞グループを統合
 * 
 * @param points TrackPoint または RouteTrackPoint オブジェクトの配列
 * @param removalLevel 共線ポイント除去の強度レベル（デフォルト: MEDIUM）
 * @returns 正規化された同じ型の配列
 */
export function normalizeTrackPoints<T>(
  points: T[], 
  removalLevel: CollinearRemovalLevel = CollinearRemovalLevel.MEDIUM
): T[] {
  // 空配列の場合はそのまま返す
  if (points.length === 0) {
    return points;
  }
  
  let normalizedPoints = points;
  
  // Step 1: 共線ポイント除去
  // 座標プロパティを持つポイントの場合、直線上の冗長なポイントを除去
  if (hasCoordinateProperties(normalizedPoints[0])) {
    normalizedPoints = removeCollinearPoints(
      normalizedPoints as T & CoordinatePoint[], 
      removalLevel
    ) as T[];
  }
  
  // Step 2: データ種別に応じた追加処理
  // タイムスタンプの有無でTrip データかRoute データかを判別
  if (hasTimedPointProperties(normalizedPoints[0])) {
    // Trip データの場合：停滞ポイント統合も実行
    // 長時間同じ場所に留まったポイント群を開始・中心・終了の3ポイントに統合
    return consolidateStationaryPoints(normalizedPoints as T & TimedPoint[]) as T[];
  } else {
    // Route データの場合：共線ポイント除去のみ適用済み
    return normalizedPoints;
  }
}

/**
 * 座標プロパティを持つかどうかを判定するタイプガード関数
 * latitude, longitude が数値として存在するかをチェック
 */
function hasCoordinateProperties(point: any): point is CoordinatePoint {
  return point && typeof point.latitude === 'number' && typeof point.longitude === 'number';
}