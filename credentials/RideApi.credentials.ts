import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import { Buffer } from 'buffer';
import axios from 'axios';

export class RideApi implements ICredentialType {
	name = 'rideApi';

	displayName = 'Ride with GPS API';

	documentationUrl = 'https://github.com/ridewithgps/developers/blob/master/authentication.md';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Ride with GPS API key',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Ride with GPS email address',
		},
		{
			displayName: 'Password',
			name: 'userPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			noDataExpression: true,
			description: 'Your Ride with GPS password',
		},
	];

	authenticate = async (
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> => {
		// URLを設定（固定ベースURL）
		if (requestOptions.url && !requestOptions.url.startsWith('http')) {
			requestOptions.url = `https://ridewithgps.com${requestOptions.url}`;
		}

		const apiKey = credentials.apiKey as string;
		const email = credentials.email as string;
		const userPassword = credentials.userPassword as string;


		// auth_tokenを取得
		const authToken = await this.getAuthToken(apiKey, email, userPassword);

		// Basic認証ヘッダーを設定
		const authString = Buffer.from(`${apiKey}:${authToken}`, 'utf8').toString('base64');
		
		return {
			...requestOptions,
			headers: {
				...requestOptions.headers,
				Authorization: `Basic ${authString}`,
				'Content-Type': 'application/json',
			},
		};
	};

	private async getAuthToken(apiKey: string, email: string, userPassword: string): Promise<string> {
		// n8nのHTTP request機能を使用するため、fetchの代わりにaxiosを使用
		
		
		try {
			const requestData = {
				user: {
					email: email,
					password: userPassword
				}
			};
			
			const requestHeaders = {
				'x-rwgps-api-key': apiKey,
				'Content-Type': 'application/json',
			};
			
			const response = await axios.post('https://ridewithgps.com/api/v1/auth_tokens.json', requestData, {
				headers: requestHeaders,
			});

			const authToken = response.data.auth_token?.auth_token;
			
			if (!authToken) {
				throw new Error('Failed to get auth token');
			}

			return authToken;
		} catch (error: any) {
			throw new Error(`Auth token request failed: ${error.response?.status || error.message}`);
		}
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://ridewithgps.com',
			url: '/api/v1/auth_tokens.json',
			method: 'POST',
			headers: {
				'x-rwgps-api-key': '={{$credentials.apiKey}}',
				'Content-Type': 'application/json',
			},
			body: {
				user: {
					email: '={{$credentials.email}}',
					password: '={{$credentials.userPassword}}',
				},
			},
		},
	};
}