import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionType } from 'n8n-workflow';

export class Ride implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ride',
		name: 'ride',
		icon: 'file:ride.svg',
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
						name: 'User',
						value: 'user',
					},
					{
						name: 'Trip',
						value: 'trip',
					},
					{
						name: 'Trips',
						value: 'trips',
					},
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
						resource: ['trip'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific trip by ID',
						action: 'Get a trip',
					},
				],
				default: 'get',
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
						name: 'List',
						value: 'list',
						description: 'Get a list of trips',
						action: 'List trips',
					},
				],
				default: 'list',
			},
			{
				displayName: 'Trip ID',
				name: 'tripId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['trip'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID of the trip to retrieve',
			},
			{
				displayName: 'Page Number',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['trips'],
						operation: ['list'],
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
				} else if (resource === 'trip') {
					responseData = await executeTripOperation.call(this, operation, i);
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

async function executeTripOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
	switch (operation) {
		case 'get': {
			const tripId = this.getNodeParameter('tripId', itemIndex) as string;
			return await this.helpers.httpRequestWithAuthentication.call(this, 'rideApi', {
				method: 'GET',
				url: `/api/v1/trips/${tripId}.json`,
			});
		}

		default:
			throw new ApplicationError(`Unknown trip operation: ${operation}`);
	}
}

async function executeTripsOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
	switch (operation) {
		case 'list': {
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

