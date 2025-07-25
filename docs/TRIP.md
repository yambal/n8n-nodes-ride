# Trip endpoint

This document describes the Trip resource endpoint for the Ride API. This endpoint provides access to individual trip details and requires authentication.

## GET /api/v1/trips/{id}.json

Returns a full representation of the trip identified by its `id`, including detailed track points and comprehensive trip statistics.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/trips/{id}.json`
- **Authentication**: Required (Bearer token)
- **Path params**:
  - `id` - The trip ID (integer)

**Example Response**

```javascript
// GET https://ridewithgps.com/api/v1/trips/1.json
// 200 - OK
{
  "trip": {
    "id": 1,
    "url": "https://ridewithgps.com/api/v1/trips/1.json",
    "name": "Morning Ride",
    "description": null,
    "departed_at": "2008-01-05T11:25:03-08:00",
    "time_zone": "America/Los_Angeles",
    "locality": "Eugene",
    "administrative_area": "OR",
    "country_code": "US",
    "activity_type": "cycling:gravel",
    "fit_sport": 2,
    "fit_sub_sport": 46,
    "is_stationary": false,
    "distance": 16146,
    "duration": 2705,
    "moving_time": 2456,
    "elevation_gain": 363,
    "elevation_loss": 352,
    "first_lat": 44.012199,
    "first_lng": -123.073723,
    "last_lat": 44.012058,
    "last_lng": -123.073715,
    "sw_lat": 43.964836,
    "sw_lng": -123.107689,
    "ne_lat": 44.012199,
    "ne_lng": -123.073715,
    "avg_speed": 23.7,
    "max_speed": 49.3,
    "avg_cad": 77,
    "min_cad": 10,
    "max_cad": 115,
    "avg_hr": 163,
    "min_hr": 92,
    "max_hr": 238,
    "avg_watts": 289,
    "min_watts": null,
    "max_watts": null,
    "calories": 711,
    "track_type": "loop",
    "terrain": "climbing",
    "difficulty": "easy",
    "created_at": "2024-09-09T15:29:01-07:00",
    "updated_at": "2024-09-09T15:29:01-07:00",
    "track_points": [
      {
        "x": -123.073723,
        "y": 44.012199,
        "e": 158.2,
        "s": 0,
        "t": 1199561107,
        "h": 92,
        "c": 0
      },
      {
        "x": -123.073792,
        "y": 44.012196,
        "e": 156.8,
        "s": 2.27,
        "t": 1199561109,
        "h": 92,
        "c": 0
      },
      {
        "x": -123.073952,
        "y": 44.012169,
        "e": 152.9,
        "s": 3.06,
        "t": 1199561113,
        "h": 93,
        "c": 0
      }
      // Additional track points...
    ]
  }
}
```

## Trip Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique trip identifier |
| `url` | string | API URL for this trip |
| `name` | string | Trip name |
| `description` | string/null | Optional trip description |
| `departed_at` | string | ISO 8601 departure timestamp |
| `time_zone` | string | Time zone of the trip |
| `locality` | string | City/locality where trip occurred |
| `administrative_area` | string | State/province code |
| `country_code` | string | ISO 3166-1 country code |
| `activity_type` | string | Activity type (e.g., "cycling:gravel") |
| `distance` | number | Total distance in meters |
| `duration` | number | Total duration in seconds |
| `moving_time` | number | Moving time in seconds |
| `elevation_gain` | number | Total elevation gain in meters |
| `elevation_loss` | number | Total elevation loss in meters |
| `avg_speed` | number | Average speed in km/h |
| `max_speed` | number | Maximum speed in km/h |
| `calories` | number | Estimated calories burned |
| `track_points` | array | Array of GPS track points |

## Track Point Attributes

| Field | Type | Description |
|-------|------|-------------|
| `x` | number | Longitude coordinate |
| `y` | number | Latitude coordinate |
| `e` | number | Elevation in meters |
| `s` | number | Distance from start in meters |
| `t` | number | Unix timestamp |
| `h` | number | Heart rate (BPM) |
| `c` | number | Cadence (RPM) |

## Error Responses

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 401 | Unauthorized - Authentication required | `{"error": "Authentication required"}` |
| 403 | Forbidden - User doesn't have permission to view this trip | `{"error": "Access denied"}` |
| 404 | Not Found - Trip doesn't exist | `{"error": "Trip not found"}` |
| 500 | Internal Server Error | `{"error": "Internal server error"}` |

**Example Error Response**

```javascript
// 404 - Not Found
{
  "error": "Trip not found"
}
```
