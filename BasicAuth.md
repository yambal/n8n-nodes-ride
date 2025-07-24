## [Basic authentication](#basic-authentication)

Basic authentication suits the needs of organization accounts and single user applications.

### 1. Get an authentication token for your account

#### User accounts

Knowing your email and password, get an authentication token associated with your API key.

**Request**

- **Method**: `POST`
- **URL**: `https://ridewithgps.com/api/v1/auth_tokens.json`
- **Authentication**: Not required
- **Header**: `x-rwgps-api-key: [api_key]`

**Request body**

```javascript
{
  user: {
    email: "[your_email]",
    password: "[your_password]"
  }
}
```

**Example Response**

```javascript
// 201 - Created
{
  "auth_token": {
    "auth_token": "c0cc78875f250604f9abac97712e314c",
    "api_key": "2704a8df",
    "created_at": "2024-09-05T05:47:53Z",
    "updated_at": "2024-09-05T05:47:53Z",
    "user": {
      "id": 1,
      "email": "bob@example.com",
      "name": "Bob",
      "created_at": "2024-01-17T01:45:09Z",
      "updated_at": "2024-09-04T17:18:52Z"
    }
  }
}
```

#### Organization accounts

Unlike user accounts, organization accounts are not setup with an email and password, which prevents them from using the endpoint above to generate authentication tokens.

Instead, to create authentication tokens, **administrators** of the organisation can:

- Go to to their organization home page
- Sign into the organization
- Click the "Manage Account" link
- Click the "Developers" tab
- Create a new API client if needed
- Go to the edit API client page and click the "Create new Auth Token" button

The page will then display the authentication token and it can be used authenticate the API requests.

> [!NOTE]
> The "Developers" tab is currently an opt-in for organization accounts.
> [Email us](mailto:developers@ridewithgps.com) so we can enable it for your organization.

### 2. Make Basic authenticated requests

You can then authenticate with Basic authentication, using your `api_key` for the username and `auth_token` for the password and base64 encode them:

```
// header
Authorization: Basic base64encode("[api_key]:[auth_token]")
```

Alternatively, you can also authenticate with the following headers:

```
// headers
x-rwgps-api-key: [api_key]
x-rwgps-auth-token: [auth_token]
```

## Convert legacy Basic tokens to OAuth access tokens

The `GET /oauth_access_token.json` endpoint issues OAuth `access_token`s for the `auth_token`s your application might have stored for your users. Use this endpoint to migrate to OAuth without requiring your users to authorize your application with Ride with GPS again.

The endpoint requires authenticating with the `auth_token` for which a OAuth `access_token` is to be issued, which is done by adding the following headers to the request:

**Request**

- **Method**: `GET`
- **URL**: `http://ridewithgps.com/oauth_access_token.json`
- **Authentication**: None
- **Headers**:
  - `x-rwgps-auth-token: [auth_token]`
  - `x-rwgps-api-key: [api_key]`

**Example response**

If your `api_key` has been configured to support OAuth, the response contains the `access_token`:

```javascript
{
  "access_token": "fJO-dk2RE4gkKyVhRY9xzgBiQjSFZXEpA3UbMFlHVXk",
  "token_type": "Bearer",
  "scope": "user",
  "created_at": 1725911852
  "rwgps_user_id": 1
}
```

- The request is idempotent, it will respond with the same `access_token` when repeated.
- `auth_token` remains valid for authentication after a corresponding OAuth `access_token` has been issued.

To authenticate requests with the OAuth `access_token`, add it as a header of your requests:

```
Authorization: Bearer [access_token]
```
