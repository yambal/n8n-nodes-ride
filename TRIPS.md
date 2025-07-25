# Trips endpoint

This document describes the Trips resource endpoint for the Ride API. This endpoint provides access to trip lists and requires authentication.

## GET /api/v1/trips.json

Returns a paginated list of trips owned by the authenticated user, ordered by `updated_at` descending.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/trips.json`
- **Authentication**: Required (Bearer token)
- **Query params**:
  - `page=<page_number>` - Optional, used for pagination

**Example response**

```javascript
// 200 - OK
{
  "trips": [
    {
      "id": 999,
      "url": "https://ridewithgps.com/api/v1/trips/999.json",
      "name": "Last trip",
      "description": "A great ride through the mountains",
      "distance": 25.6,
      "duration": 3600,
      "elevation_gain": 500,
      "started_at": "2024-01-15T10:00:00Z",
      "ended_at": "2024-01-15T11:00:00Z",
      "privacy": "public",
      "visibility": "everyone"
    },
    {
      "id": 844,
      "url": "https://ridewithgps.com/api/v1/trips/844.json",
      "name": "Another trip",
      "description": "City commute",
      "distance": 12.3,
      "duration": 1800,
      "elevation_gain": 100,
      "started_at": "2024-01-14T08:30:00Z",
      "ended_at": "2024-01-14T09:00:00Z",
      "privacy": "private",
      "visibility": "friends"
    }
  ],
  "meta": {
    "pagination": {
      "record_count": 22,
      "page_count": 1,
      "next_page_url": "https://ridewithgps.com/api/v1/trips.json?page=2"
    }
  }
}
```

## Error responses

The endpoint may return the following error responses:

```javascript
// 401 - Unauthorized
{
  "error": "Authentication required"
}

// 403 - Forbidden
{
  "error": "Access denied"
}

// 500 - Internal Server Error
{
  "error": "Internal server error"
}
```
