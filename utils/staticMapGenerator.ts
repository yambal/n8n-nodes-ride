import type { IExecuteFunctions } from 'n8n-workflow';
import { ApplicationError } from 'n8n-workflow';
import { TripData } from './dataTransformer';
import { getSignificantLocations } from './common/geoUtils';

export async function generateStaticMap(
	context: IExecuteFunctions,
	tripData: TripData,
	itemIndex: number
): Promise<Buffer> {
	const credentials = await context.getCredentials('rideApi');
	const googleMapsApiKey = credentials.googleMapsApiKey as string;

	if (!googleMapsApiKey) {
		throw new ApplicationError('Google Maps API key is required for image generation. Please add it to your Ride credentials.');
	}

	// トリップデータからルート座標を抽出
	if (!tripData.trip || !tripData.trip.track_points || tripData.trip.track_points.length === 0) {
		throw new ApplicationError('No track points found in trip data');
	}

	const trackPoints = tripData.trip.track_points;
	
	// 開始点と終了点を取得
	const startPoint = trackPoints[0];
	const endPoint = trackPoints[trackPoints.length - 1];
	
	// 中間点をいくつか選択（最大8個まで）
	const maxWaypoints = 8;
	const waypointStep = Math.max(1, Math.floor(trackPoints.length / (maxWaypoints + 1)));
	const waypoints: Array<{lat: number, lng: number}> = [];
	
	for (let i = waypointStep; i < trackPoints.length - waypointStep; i += waypointStep) {
		if (waypoints.length < maxWaypoints) {
			waypoints.push({
				lat: trackPoints[i].latitude,
				lng: trackPoints[i].longitude
			});
		}
	}

	// Google Maps Static API URLを構築
	const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
	const params: string[] = [
		'size=800x600',
		'format=png',
		'maptype=roadmap'
	];

	// 開始点マーカー（緑）
	params.push(`markers=color:green|label:S|${startPoint.latitude},${startPoint.longitude}`);
	
	// 終了点マーカー（赤）
	params.push(`markers=color:red|label:E|${endPoint.latitude},${endPoint.longitude}`);
	
	// 停滞ポイントマーカー（黄色）
	const stationaryPoints = getSignificantLocations(trackPoints, 15 * 60, 100); // 15分以上、100m以内
	if (stationaryPoints.length > 0) {
		console.log(`[generateStaticMap] Adding ${stationaryPoints.length} stationary point markers`);
		
		// Google Maps Static APIの制限に合わせて最大10個の停滞ポイントマーカーを追加
		const maxStationaryMarkers = 10;
		const stationaryStep = Math.max(1, Math.ceil(stationaryPoints.length / maxStationaryMarkers));
		
		for (let i = 0; i < stationaryPoints.length; i += stationaryStep) {
			const point = stationaryPoints[i];
			const markerIndex = Math.floor(i / stationaryStep) + 1;
			params.push(`markers=color:orange|label:${markerIndex}|${point.latitude},${point.longitude}`);
		}
	}

	// パス（ルート）を追加 - URLサイズ制限のため座標数を制限
	const maxPathPoints = 200; // Google Static Map APIのURL長制限（16,384文字）対応
	const pathStep = Math.max(1, Math.floor(trackPoints.length / maxPathPoints));
	const pathPoints: Array<{longitude: number, latitude: number}> = [];
	
	for (let i = 0; i < trackPoints.length; i += pathStep) {
		pathPoints.push(trackPoints[i]);
	}
	
	// 最後の点も含める
	if (pathPoints[pathPoints.length - 1] !== trackPoints[trackPoints.length - 1]) {
		pathPoints.push(trackPoints[trackPoints.length - 1]);
	}
	
	const pathCoords = pathPoints.map(point => `${point.latitude},${point.longitude}`).join('|');
	params.push(`path=color:0x0000ff|weight:3|${pathCoords}`);

	// APIキーを追加
	params.push(`key=${googleMapsApiKey}`);

	const staticMapUrl = `${baseUrl}?${params.join('&')}`;

	// Google Static Map APIを呼び出し
	const response = await context.helpers.request({
		method: 'GET',
		url: staticMapUrl,
		encoding: null, // バイナリデータとして取得
	});

	// Bufferとして返す
	return Buffer.from(response, 'binary');
}