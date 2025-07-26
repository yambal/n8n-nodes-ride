import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionType } from 'n8n-workflow';
import { TripData, tripToKml } from '../../utils/tripToKml';
import { StaticMap } from 'static-map-generator';

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
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
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
						description: 'Generate a static map image of the trip route',
					},
				],
				default: 'data',
				description: 'Choose the output format for trip data',
			},
			{
				displayName: 'Image Width',
				name: 'imageWidth',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['trips'],
						operation: ['getTrip'],
						outputFormat: ['image'],
					},
				},
				default: 600,
				typeOptions: {
					minValue: 100,
					maxValue: 2000,
				},
				description: 'Width of the generated image in pixels',
			},
			{
				displayName: 'Image Height',
				name: 'imageHeight',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['trips'],
						operation: ['getTrip'],
						outputFormat: ['image'],
					},
				},
				default: 600,
				typeOptions: {
					minValue: 100,
					maxValue: 2000,
				},
				description: 'Height of the generated image in pixels',
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

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as any),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
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
			const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
			
			const responseData: TripData = await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/trips/${tripId}.json`
			});
			
			if (outputFormat === 'kml' && responseData) {
				try {
					const kmlData = tripToKml(responseData);
					return {
						kml: kmlData
					};
				} catch (error) {
					throw new ApplicationError(`Failed to convert trip to KML: ${error.message}`);
				}
			}
			
			if (outputFormat === 'image' && responseData) {
				try {
					const imageWidth = this.getNodeParameter('imageWidth', itemIndex) as number;
					const imageHeight = this.getNodeParameter('imageHeight', itemIndex) as number;
					const imageBuffer = await generateTripImage(responseData, { width: imageWidth, height: imageHeight });
					// Return as n8n binary data for easier handling
					const binaryData = await this.helpers.prepareBinaryData(
						imageBuffer,
						`trip_${tripId}.png`,
						'image/png'
					);
					return {
						json: {
							tripId,
							message: 'Trip image generated successfully',
							width: imageWidth,
							height: imageHeight
						},
						binary: {
							data: binaryData
						}
					};
				} catch (error) {
					throw new ApplicationError(`Failed to generate trip image: ${error.message}`);
				}
			}
			
			return responseData;
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

async function generateTripImage(tripData: TripData, size: { width: number, height: number } = { width: 600, height: 600 }): Promise<Buffer> {
	if (!tripData.trip?.track_points || tripData.trip.track_points.length === 0) {
		throw new ApplicationError('No track points found in trip data');
	}

	const trackPoints = tripData.trip.track_points;
	
	// Extract coordinates from track points
	const coordinates = trackPoints.map(point => ({
		lat: point.y,
		lng: point.x
	}));

	// Calculate bounds
	const lats = coordinates.map(coord => coord.lat);
	const lngs = coordinates.map(coord => coord.lng);
	const bounds = {
		north: Math.max(...lats),
		south: Math.min(...lats),
		east: Math.max(...lngs),
		west: Math.min(...lngs),
	};

	// Add padding to bounds (10% on each side)
	const latPadding = (bounds.north - bounds.south) * 0.1;
	const lngPadding = (bounds.east - bounds.west) * 0.1;
	bounds.north += latPadding;
	bounds.south -= latPadding;
	bounds.east += lngPadding;
	bounds.west -= lngPadding;

	// Create static map
	const map = new StaticMap({
		bounds,
		padding: 5,
		size,
		paths: [{
			coordinates,
			color: '#FF0000'
		}],
		markers: [
			{
				coordinate: coordinates[0],
				color: '#00FF00',
				size: 'medium',
				label: 'S'
			},
			{
				coordinate: coordinates[coordinates.length - 1],
				color: '#FF0000',
				size: 'medium',
				label: 'E'
			}
		]
	});

	return await map.render();
}

