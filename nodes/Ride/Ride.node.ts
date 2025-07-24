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

