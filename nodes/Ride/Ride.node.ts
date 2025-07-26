import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionType } from 'n8n-workflow';
import { TripData, tripToKml } from '../../utils/tripToKml';

export class Ride implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ride',
		name: 'ride',
		icon: 'file:RideWithGPS.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Ride service API',
		defaults: {
			name: 'Ride',
		},
		inputs: [{ displayName: '', type: NodeConnectionType.Main }],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'rideApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://ridewithgps.com',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Event',
						value: 'events',
					},
					{
						name: 'Route',
						value: 'routes',
					},
					{
						name: 'Sync',
						value: 'sync',
					},
					{
						name: 'Trip',
						value: 'trips',
					},
					{
						name: 'User',
						value: 'user',
					}
				],
				default: 'user',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get Current',
						value: 'getCurrent',
						description: 'Get current user information',
						action: 'Get current user',
					},
				],
				default: 'getCurrent',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['events'],
					},
				},
				options: [
					{
						name: 'Get Event',
						value: 'getEvent',
						description: 'Get a specific event by ID',
						action: 'Get an event',
					},
					{
						name: 'Get Events',
						value: 'getEvents',
						description: 'Get a list of events',
						action: 'List events',
					},
				],
				default: 'getEvents',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['routes'],
					},
				},
				options: [
					{
						name: 'Get Route',
						value: 'getRoute',
						description: 'Get a specific route by ID',
						action: 'Get a route',
					},
					{
						name: 'Get Routes',
						value: 'getRoutes',
						description: 'Get a list of routes',
						action: 'List routes',
					},
				],
				default: 'getRoutes',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['sync'],
					},
				},
				options: [
					{
						name: 'Sync',
						value: 'sync',
						description: 'Synchronize changes since a specific datetime',
						action: 'Sync changes',
					},
				],
				default: 'sync',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['trips'],
					},
				},
				options: [
					{
						name: 'Get Trip',
						value: 'getTrip',
						description: 'Get a specific trip by ID',
						action: 'Get a trip',
					},
					{
						name: 'Get Trips',
						value: 'getTrips',
						description: 'Get a list of trips',
						action: 'List trips',
					},
				],
				default: 'getTrips',
			},
			{
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['events'],
						operation: ['getEvent'],
					},
				},
				default: '',
				description: 'The ID of the event to retrieve',
			},
			{
				displayName: 'Route ID',
				name: 'routeId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['routes'],
						operation: ['getRoute'],
					},
				},
				default: '',
				description: 'The ID of the route to retrieve',
			},
			{
				displayName: 'Since Datetime',
				name: 'since',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['sync'],
						operation: ['sync'],
					},
				},
				default: '1970-01-01T00:00:00Z',
				description: 'ISO8601 datetime to sync changes from (e.g., 2024-01-01T00:00:00Z)',
			},
			{
				displayName: 'Asset Types',
				name: 'assets',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['sync'],
						operation: ['sync'],
					},
				},
				options: [
					{
						name: 'Routes',
						value: 'routes',
					},
					{
						name: 'Trips',
						value: 'trips',
					},
				],
				default: ['routes', 'trips'],
				description: 'Types of assets to synchronize',
			},
			{
				displayName: 'Trip ID',
				name: 'tripId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['trips'],
						operation: ['getTrip'],
					},
				},
				default: '',
				description: 'The ID of the trip to retrieve',
			},
			{
				displayName: 'Output Formats',
				name: 'outputFormats',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['trips'],
						operation: ['getTrip'],
					},
				},
				options: [
					{
						name: 'Data',
						value: 'data',
						description: 'Return raw trip data',
					},
					{
						name: 'KML',
						value: 'kml',
						description: 'Convert trip data to KML format for GPS/mapping applications',
					},
					{
						name: 'Image',
						value: 'image',
						description: 'Generate static map image using Google Maps (⚠️ Requires Google Maps API key in credentials)',
					},
				],
				default: ['data'],
				description: 'Choose the output formats for trip data (multiple selections allowed)',
			},
			{
				displayName: 'Page Number',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['events'],
						operation: ['getEvents'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Page Number',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['routes'],
						operation: ['getRoutes'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Page Number',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['trips'],
						operation: ['getTrips'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				

				let responseData;

				if (resource === 'user') {
					responseData = await executeUserOperation.call(this, operation, i);
				} else if (resource === 'events') {
					responseData = await executeEventsOperation.call(this, operation, i);
				} else if (resource === 'routes') {
					responseData = await executeRoutesOperation.call(this, operation, i);
				} else if (resource === 'sync') {
					responseData = await executeSyncOperation.call(this, operation, i);
				} else if (resource === 'trips') {
					responseData = await executeTripsOperation.call(this, operation, i);
				}

				if (Array.isArray(responseData)) {
					// 複数のアウトプット（複数形式選択）の場合
					for (const output of responseData) {
						if (output.binary) {
							// バイナリデータが含まれる場合
							returnData.push({
								json: output.json,
								binary: output.binary,
								pairedItem: { item: i }
							});
						} else {
							// 通常のJSONデータの場合
							returnData.push({
								json: output.json,
								pairedItem: { item: i }
							});
						}
					}
				} else if (responseData && responseData.binary) {
					// バイナリデータ（画像）の場合
					returnData.push({
						json: responseData.json,
						binary: responseData.binary,
						pairedItem: { item: i }
					});
				} else {
					// 通常のJSONデータの場合
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData as any),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						[{ json: { error: error.message } }],
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

}



async function executeUserOperation(this: IExecuteFunctions, operation: string, _itemIndex: number) {
		switch (operation) {
			case 'getCurrent':
				return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
					method: 'GET',
					url: '/api/v1/users/current.json',
				});

			default:
				throw new ApplicationError(`Unknown user operation: ${operation}`);
		}
}


async function executeEventsOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
	switch (operation) {
		case 'getEvent': {
			const eventId = this.getNodeParameter('eventId', itemIndex) as string;
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/events/${eventId}.json`,
			});
		}

		case 'getEvents': {
			const page = this.getNodeParameter('page', itemIndex) as number;
			const queryParams = page > 1 ? `?page=${page}` : '';
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/events.json${queryParams}`,
			});
		}

		default:
			throw new ApplicationError(`Unknown events operation: ${operation}`);
	}
}

async function executeRoutesOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
	switch (operation) {
		case 'getRoute': {
			const routeId = this.getNodeParameter('routeId', itemIndex) as string;
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/routes/${routeId}.json`,
			});
		}

		case 'getRoutes': {
			const page = this.getNodeParameter('page', itemIndex) as number;
			const queryParams = page > 1 ? `?page=${page}` : '';
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/routes.json${queryParams}`,
			});
		}

		default:
			throw new ApplicationError(`Unknown routes operation: ${operation}`);
	}
}

async function executeSyncOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
	switch (operation) {
		case 'sync': {
			const since = this.getNodeParameter('since', itemIndex) as string;
			const assets = this.getNodeParameter('assets', itemIndex) as string[];
			
			// Build query parameters manually
			const queryParts: string[] = [];
			queryParts.push(`since=${encodeURIComponent(since)}`);
			if (assets && assets.length > 0) {
				queryParts.push(`assets=${encodeURIComponent(assets.join(','))}`);
			}
			const queryString = queryParts.join('&');
			
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/sync.json?${queryString}`,
			});
		}

		default:
			throw new ApplicationError(`Unknown sync operation: ${operation}`);
	}
}

async function executeTripsOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
	switch (operation) {
		case 'getTrip': {
			const tripId = this.getNodeParameter('tripId', itemIndex) as string;
			const outputFormats = this.getNodeParameter('outputFormats', itemIndex) as string[];
			
			const responseData: TripData = await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/trips/${tripId}.json`
			});
			
			const outputs: any[] = [];
			
			// 各出力形式に対して処理
			for (const format of outputFormats) {
				if (format === 'data') {
					outputs.push({
						json: {
							...responseData,
							output_format: 'data'
						}
					});
				}
				
				if (format === 'kml' && responseData) {
					try {
						const kmlData = tripToKml(responseData);
						outputs.push({
							json: {
								kml: kmlData,
								trip_id: tripId,
								output_format: 'kml'
							}
						});
					} catch (error) {
						throw new ApplicationError(`Failed to convert trip to KML: ${error.message}`);
					}
				}
				
				if (format === 'image' && responseData) {
					try {
						// Google APIキーの存在をチェック
						const credentials = await this.getCredentials('rideApi');
						const googleMapsApiKey = credentials.googleMapsApiKey as string;
						
						if (!googleMapsApiKey || googleMapsApiKey.trim() === '') {
							throw new ApplicationError('Google Maps API key is required for image generation. Please add it to your Ride credentials.');
						}
						
						const imageBuffer = await generateStaticMap.call(this, responseData, itemIndex);
						const fileName = `trip-${tripId}-map.png`;
						
						// n8nのbinaryDataとして設定
						const binaryData = await this.helpers.prepareBinaryData(
							imageBuffer,
							fileName,
							'image/png'
						);
						
						outputs.push({
							json: {
								trip_id: tripId,
								fileName: fileName,
								mimeType: 'image/png',
								output_format: 'image'
							},
							binary: {
								[fileName]: binaryData
							}
						});
					} catch (error) {
						throw new ApplicationError(`Failed to generate static map: ${error.message}`);
					}
				}
			}
			
			return outputs;
		}

		case 'getTrips': {
			const page = this.getNodeParameter('page', itemIndex) as number;
			const queryParams = page > 1 ? `?page=${page}` : '';
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/trips.json${queryParams}`,
			});
		}

		default:
			throw new ApplicationError(`Unknown trips operation: ${operation}`);
	}
}

async function generateStaticMap(this: IExecuteFunctions, tripData: TripData, itemIndex: number): Promise<Buffer> {
	const credentials = await this.getCredentials('rideApi');
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
				lat: trackPoints[i].y,
				lng: trackPoints[i].x
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
	params.push(`markers=color:green|label:S|${startPoint.y},${startPoint.x}`);
	
	// 終了点マーカー（赤）
	params.push(`markers=color:red|label:E|${endPoint.y},${endPoint.x}`);

	// パス（ルート）を追加 - URLサイズ制限のため座標数を制限
	const maxPathPoints = 50; // Google Static Map APIのURL長制限対応
	const pathStep = Math.max(1, Math.floor(trackPoints.length / maxPathPoints));
	const pathPoints: Array<{x: number, y: number}> = [];
	
	for (let i = 0; i < trackPoints.length; i += pathStep) {
		pathPoints.push(trackPoints[i]);
	}
	
	// 最後の点も含める
	if (pathPoints[pathPoints.length - 1] !== trackPoints[trackPoints.length - 1]) {
		pathPoints.push(trackPoints[trackPoints.length - 1]);
	}
	
	const pathCoords = pathPoints.map(point => `${point.y},${point.x}`).join('|');
	params.push(`path=color:0x0000ff|weight:3|${pathCoords}`);

	// APIキーを追加
	params.push(`key=${googleMapsApiKey}`);

	const staticMapUrl = `${baseUrl}?${params.join('&')}`;

	// Google Static Map APIを呼び出し
	const response = await this.helpers.request({
		method: 'GET',
		url: staticMapUrl,
		encoding: null, // バイナリデータとして取得
	});

	// Bufferとして返す
	return Buffer.from(response, 'binary');
}


