# Events endpoints

This document describes the Events resource endpoints for the Ride API. These endpoints provide access to event lists and individual event details, requiring authentication.

## GET /api/v1/events.json

Returns a paginated list of events owned by the authenticated user, ordered by `created_at` descending.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/events.json`
- **Authentication**: Required (Bearer token)
- **Query params**:
  - `page=<page_number>` - Optional, used for pagination

**Example response**

```javascript
// GET https://ridewithgps.com/api/v1/events.json
// 200 - OK
{
  "events": [
    {
      "id": 999,
      "url": "https://ridewithgps.com/api/v1/events/999.json",
      "name": "Last event",
      "description": "Annual cycling event",
      "starts_on": "2024-12-15",
      "starts_at": "2024-12-15T08:00:00-08:00",
      "ends_on": "2024-12-15",
      "ends_at": "2024-12-15T18:00:00-08:00",
      "locality": "San Francisco",
      "created_at": "2024-10-01T10:30:00-08:00",
      "updated_at": "2024-10-01T10:30:00-08:00"
    },
    {
      "id": 844,
      "url": "https://ridewithgps.com/api/v1/events/844.json",
      "name": "Another event",
      "description": "Mountain bike race",
      "starts_on": "2024-11-20",
      "starts_at": "2024-11-20T09:00:00-08:00",
      "ends_on": "2024-11-20",
      "ends_at": "2024-11-20T17:00:00-08:00",
      "locality": "Portland",
      "created_at": "2024-09-15T14:20:00-08:00",
      "updated_at": "2024-09-15T14:20:00-08:00"
    }
  ],
  "meta": {
    "pagination": {
      "record_count": 12,
      "page_count": 2,
      "next_page_url": "https://ridewithgps.com/api/v1/events.json?page=2"
    }
  }
}
```

Events in this representation do not include details on the routes they are associated with.

## GET /api/v1/events/{id}.json

Returns a full representation of the event identified by its `id`, including associated routes.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/events/{id}.json`
- **Authentication**: Required (Bearer token)
- **Path params**:
  - `id` - The event ID (integer)

**Example Response**

```javascript
// GET https://ridewithgps.com/api/v1/events/1.json
// 200 - OK
{
  "event": {
    "id": 1,
    "url": "https://ridewithgps.com/api/v1/events/1.json",
    "name": "It's going to be a long day",
    "description": "Multi-day cycling event with challenging routes",
    "starts_on": "2024-11-02",
    "starts_at": "2024-11-02T00:00:00-07:00",
    "ends_on": "2024-11-03",
    "ends_at": "2024-11-03T23:59:59-07:00",
    "locality": "Portland",
    "state": "Oregon",
    "country": "United States",
    "registration_open": true,
    "max_participants": 500,
    "current_participants": 245,
    "entry_fee": 75.00,
    "currency": "USD",
    "created_at": "2024-10-25T09:27:00-07:00",
    "updated_at": "2024-10-25T09:27:00-07:00",
    "routes": [
      {
        "id": 3,
        "url": "https://ridewithgps.com/api/v1/routes/3.json",
        "name": "A very hard century",
        "description": "Challenging 100-mile route",
        "locality": "Portland",
        "distance": 160934,
        "elevation_gain": 2500,
        "difficulty": "hard",
        "created_at": "2024-10-20T12:00:00-07:00",
        "updated_at": "2024-10-20T12:00:00-07:00"
      }
    ],
    "organizer": {
      "name": "Portland Cycling Club",
      "email": "info@portlandcycling.com",
      "website": "https://portlandcycling.com"
    }
  }
}
```

## Event Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique event identifier |
| `url` | string | API URL for this event |
| `name` | string | Event name |
| `description` | string/null | Event description |
| `starts_on` | string | Event start date (YYYY-MM-DD) |
| `starts_at` | string | Event start timestamp (ISO 8601) |
| `ends_on` | string | Event end date (YYYY-MM-DD) |
| `ends_at` | string/null | Event end timestamp (ISO 8601) |
| `locality` | string | City/locality where event occurs |
| `state` | string | State/province |
| `country` | string | Country name |
| `registration_open` | boolean | Whether registration is open |
| `max_participants` | integer | Maximum number of participants |
| `current_participants` | integer | Current number of registered participants |
| `entry_fee` | number | Registration fee |
| `currency` | string | Currency code (ISO 4217) |
| `routes` | array | Array of associated routes |
| `organizer` | object | Event organizer information |

## Route Attributes (in event response)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique route identifier |
| `url` | string | API URL for this route |
| `name` | string | Route name |
| `description` | string | Route description |
| `locality` | string | City/locality |
| `distance` | number | Distance in meters |
| `elevation_gain` | number | Total elevation gain in meters |
| `difficulty` | string | Difficulty level |

## Error Responses

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 401 | Unauthorized - Authentication required | `{"error": "Authentication required"}` |
| 403 | Forbidden - User doesn't have permission to view this event | `{"error": "Access denied"}` |
| 404 | Not Found - Event doesn't exist | `{"error": "Event not found"}` |
| 500 | Internal Server Error | `{"error": "Internal server error"}` |

**Example Error Response**

```javascript
// 404 - Not Found
{
  "error": "Event not found"
}
```

**Notes**

- The routes in the event response are in their short representation
- To get full route details including track points, course points and points of interest, query the individual route URL
- Events in the list response do not include associated route details
