# Sync endpoint

This document describes the Sync resource endpoint for the Ride API. This endpoint is specialized for maintaining synchronized copies of user data and tracking changes over time, requiring authentication.

## GET /api/v1/sync.json

The `sync` endpoint is convenient to maintain a remote copy of a user's library of trips and/or routes. Returns a list of items (routes and/or trips) that the user has interacted with (`created`, `updated`, `deleted`, `pinned` and `unpinned`) since the given `since` datetime.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/sync.json`
- **Authentication**: Required (Bearer token)
- **Query params**:
  - `since=[datetime]` - ISO8601 formatted datetime (required)
  - `assets=[types]` - Comma-separated list of asset types to return (`routes`, `trips`, `routes,trips`). Defaults to API client setting if not specified.

**Example response**

```javascript
// GET https://ridewithgps.com/api/v1/sync.json?since=2024-09-01T00:00:00Z&assets=routes,trips
// 200 - OK
{
  "items": [
    {
      "item_type": "route",
      "item_id": 217,
      "item_user_id": 2,
      "item_url": "https://ridewithgps.com/api/v1/routes/217.json",
      "action": "added",
      "datetime": "2024-09-05T23:17:55Z",
      "collection": {
        "id": 1,
        "type": "pinned",
        "name": "pinned",
        "url": "https://ridewithgps.com/api/v1/collections/1.json"
      }
    },
    {
      "item_type": "route",
      "item_id": 218,
      "item_user_id": 1,
      "item_url": "https://ridewithgps.com/api/v1/routes/218.json",
      "action": "updated",
      "datetime": "2024-09-05T23:19:36Z",
      "collection": null
    },
    {
      "item_type": "trip",
      "item_id": 738,
      "item_user_id": 1,
      "item_url": "https://ridewithgps.com/api/v1/trips/738.json",
      "action": "created",
      "datetime": "2024-09-09T22:29:01Z",
      "collection": null
    },
    {
      "item_type": "route",
      "item_id": 156,
      "item_user_id": 1,
      "item_url": "https://ridewithgps.com/api/v1/routes/156.json",
      "action": "deleted",
      "datetime": "2024-09-08T15:42:21Z",
      "collection": null
    }
  ],
  "meta": {
    "rwgps_datetime": "2024-09-09T22:53:52+00:00",
    "next_sync_url": "https://ridewithgps.com/api/v1/sync.json?assets=routes%2Ctrips&since=2024-09-09T22%3A53%3A52%2B00%3A00",
    "item_count": 4,
    "date_range": {
      "since": "2024-09-01T00:00:00Z",
      "until": "2024-09-09T22:53:52+00:00"
    }
  }
}
```

## Item Attributes

| Field | Type | Description |
|-------|------|-------------|
| `item_type` | string | Type of item (`route` or `trip`) |
| `item_id` | integer | ID of the item |
| `item_user_id` | integer | ID of the user who owns the item |
| `item_url` | string | API URL to fetch the full item details |
| `action` | string | Action performed on the item |
| `datetime` | string | ISO8601 timestamp when the action occurred |
| `collection` | object/null | Collection information for `added`/`removed` actions |

## Action Types

| Action | Description |
|--------|-------------|
| `created` | The user created the item |
| `updated` | The user updated the item |
| `deleted` | The user deleted the item |
| `added` | The user added the item to the specified collection (e.g., pinned) |
| `removed` | The user removed the item from the specified collection |

## Collection Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Collection ID |
| `type` | string | Collection type (currently always `pinned`) |
| `name` | string | Collection name |
| `url` | string | API URL for the collection |

## Meta Attributes

| Field | Type | Description |
|-------|------|-------------|
| `rwgps_datetime` | string | Server timestamp for next sync request |
| `next_sync_url` | string | Pre-constructed URL for the next sync request |
| `item_count` | integer | Number of items returned in this response |
| `date_range` | object | Date range information for this sync |

## Usage Patterns

### Initial Sync (Full Library)
```
GET /api/v1/sync.json?since=1970-01-01T00:00:00Z&assets=routes,trips
```
Retrieves all items in the user's library.

### Incremental Sync
```
GET /api/v1/sync.json?since=2024-09-09T22:53:52+00:00&assets=routes,trips
```
Retrieves only changes since the last sync.

### Routes Only
```
GET /api/v1/sync.json?since=2024-09-01T00:00:00Z&assets=routes
```
Retrieves only route changes.

### Trips Only
```
GET /api/v1/sync.json?since=2024-09-01T00:00:00Z&assets=trips
```
Retrieves only trip changes.

## Sync Workflow

This endpoint is optimized for performance and can return the entire library for the user by using a `since` value well in the past (for example `1970-01-01T00:00:00Z`).

**Recommended workflow to maintain your copy of a user's library:**

1. **Initial Sync**: When the user completes OAuth, get their entire library:
   ```
   GET /api/v1/sync.json?since=1970-01-01T00:00:00Z
   ```

2. **Store Sync Point**: Save the `meta.rwgps_datetime` value from the response

3. **Incremental Updates**: 
   - **With Webhooks**: On webhook reception, sync changes using stored datetime
   - **Without Webhooks**: Periodically poll for changes using stored datetime
   ```
   GET /api/v1/sync.json?since=[stored_rwgps_datetime]
   ```

4. **Update Sync Point**: Store the new `meta.rwgps_datetime` for the next sync

## Error Responses

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 400 | Bad Request - Invalid since parameter | `{"error": "Invalid since parameter format"}` |
| 401 | Unauthorized - Authentication required | `{"error": "Authentication required"}` |
| 422 | Unprocessable Entity - Missing required parameters | `{"error": "Missing required parameter: since"}` |
| 500 | Internal Server Error | `{"error": "Internal server error"}` |

**Example Error Response**

```javascript
// 400 - Bad Request
{
  "error": "Invalid since parameter format",
  "details": "Expected ISO8601 datetime format (e.g., 2024-09-01T00:00:00Z)"
}
```

**Notes**

- The sync endpoint returns changes chronologically ordered by `datetime`
- Deleted items will not have accessible item URLs but are included for sync completeness
- For `added` and `removed` actions, the `collection` field provides context
- The `next_sync_url` in meta can be used directly for the subsequent sync request
- This endpoint is designed for high-frequency polling and can handle large datasets efficiently
