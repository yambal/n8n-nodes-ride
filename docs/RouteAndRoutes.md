# Routes endpoints

This document describes the Routes resource endpoints for the Ride API. These endpoints provide access to route lists and individual route details, requiring authentication.

## GET /api/v1/routes.json

Returns a paginated list of routes owned by the authenticated user, ordered by `updated_at` descending.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/routes.json`
- **Authentication**: Required (Bearer token)
- **Query params**:
  - `page=<page_number>` - Optional, used for pagination

**Example response**

```javascript
// GET https://ridewithgps.com/api/v1/routes.json
// 200 - OK
{
  "routes": [
    {
      "id": 999,
      "url": "https://ridewithgps.com/api/v1/routes/999.json",
      "name": "Last route",
      "description": "Scenic mountain loop",
      "locality": "Portland",
      "administrative_area": "OR",
      "country_code": "US",
      "distance": 42500,
      "elevation_gain": 850,
      "elevation_loss": 845,
      "track_type": "loop",
      "terrain": "climbing",
      "difficulty": "moderate",
      "surface": "mostly_paved",
      "created_at": "2024-01-20T10:30:00-08:00",
      "updated_at": "2024-01-20T10:30:00-08:00"
    },
    {
      "id": 844,
      "url": "https://ridewithgps.com/api/v1/routes/844.json",
      "name": "Another route",
      "description": "Urban commute route",
      "locality": "Seattle",
      "administrative_area": "WA",
      "country_code": "US",
      "distance": 15200,
      "elevation_gain": 120,
      "elevation_loss": 115,
      "track_type": "point_to_point",
      "terrain": "flat",
      "difficulty": "easy",
      "surface": "paved",
      "created_at": "2024-01-15T08:15:00-08:00",
      "updated_at": "2024-01-15T08:15:00-08:00"
    }
  ],
  "meta": {
    "pagination": {
      "record_count": 22,
      "page_count": 1,
      "next_page_url": "https://ridewithgps.com/api/v1/routes.json?page=2"
    }
  }
}
```

Each route in the response has all the attributes of the route detail request below, except the `track_points`, `course_points` and `points_of_interest` attributes.

## GET /api/v1/routes/{id}.json

Returns a full representation of the route identified by its `id`, including track points, course points, and points of interest.

**Request**

- **Method**: `GET`
- **URL**: `https://ridewithgps.com/api/v1/routes/{id}.json`
- **Authentication**: Required (Bearer token)
- **Path params**:
  - `id` - The route ID (integer)

**Example Response**

```javascript
// GET https://ridewithgps.com/api/v1/routes/1.json
// 200 - OK
{
  "route": {
    "id": 1,
    "url": "https://ridewithgps.com/api/v1/routes/1.json",
    "name": "Drummond Round Trip",
    "description": "Easy loop around Portland",
    "locality": "Portland",
    "administrative_area": "OR",
    "country_code": "US",
    "distance": 21453,
    "elevation_gain": 133,
    "elevation_loss": 134,
    "first_lat": 45.58787,
    "first_lng": -122.69944,
    "last_lat": 45.58824,
    "last_lng": -122.69944,
    "sw_lat": 45.52858,
    "sw_lng": -122.70294,
    "ne_lat": 45.58824,
    "ne_lng": -122.64282,
    "track_type": "loop",
    "terrain": "rolling",
    "difficulty": "easy",
    "unpaved_pct": 5,
    "surface": "mostly_paved",
    "visibility": "public",
    "privacy": "public",
    "created_at": "2024-01-16T17:46:23-08:00",
    "updated_at": "2024-01-22T16:42:37-08:00",
    "track_points": [
      {
        "x": -122.69944,
        "y": 45.58708,
        "e": 25.5,
        "d": 87.9
      },
      {
        "x": -122.7014,
        "y": 45.58709,
        "e": 25.6,
        "d": 240.6
      }
    ],
    "course_points": [
      {
        "x": -122.69944,
        "y": 45.58708,
        "d": 87.9,
        "i": 0,
        "t": "Right",
        "n": "Turn right onto North Houghton Street"
      },
      {
        "x": -122.70224,
        "y": 45.58709,
        "d": 306,
        "i": 3,
        "t": "Left",
        "n": "Turn slight left onto North Hamlin Avenue"
      }
    ],
    "points_of_interest": [
      {
        "id": 1,
        "type": "convenience_store",
        "type_id": 24,
        "type_name": "Convenience Store",
        "name": "Seven Eleven",
        "description": "Get snacks on the way home.",
        "url": null,
        "lat": 45.561964,
        "lng": -122.68902
      }
    ]
  }
}
```

## Route Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique route identifier |
| `url` | string | API URL for this route |
| `name` | string | Route name |
| `description` | string | Route description |
| `locality` | string | City/locality |
| `administrative_area` | string | State/province code |
| `country_code` | string | ISO 3166-1 country code |
| `distance` | number | Total distance in meters |
| `elevation_gain` | number | Total elevation gain in meters |
| `elevation_loss` | number | Total elevation loss in meters |
| `first_lat` | number | Latitude of starting point |
| `first_lng` | number | Longitude of starting point |
| `last_lat` | number | Latitude of ending point |
| `last_lng` | number | Longitude of ending point |
| `sw_lat` | number | Southwest boundary latitude |
| `sw_lng` | number | Southwest boundary longitude |
| `ne_lat` | number | Northeast boundary latitude |
| `ne_lng` | number | Northeast boundary longitude |
| `track_type` | string | Type of route (loop, point_to_point, out_and_back) |
| `terrain` | string | Terrain type (flat, rolling, climbing) |
| `difficulty` | string | Difficulty level (easy, moderate, hard) |
| `unpaved_pct` | number | Percentage of unpaved surface (0-100) |
| `surface` | string | Surface type (paved, mostly_paved, mixed, mostly_unpaved, unpaved) |
| `visibility` | string | Route visibility setting |
| `privacy` | string | Route privacy setting |
| `track_points` | array | Array of GPS track points |
| `course_points` | array | Array of navigation course points |
| `points_of_interest` | array | Array of points of interest |

## Track Point Attributes

| Field | Type | Description |
|-------|------|-------------|
| `x` | number | Longitude coordinate |
| `y` | number | Latitude coordinate |
| `e` | number | Elevation in meters |
| `d` | number | Distance from start in meters |

## Course Point Attributes

| Field | Type | Description |
|-------|------|-------------|
| `x` | number | Longitude coordinate |
| `y` | number | Latitude coordinate |
| `d` | number | Distance from start in meters |
| `i` | number | Index/order of the course point |
| `t` | string | Turn type (Left, Right, Straight, etc.) |
| `n` | string | Navigation instruction text |

## Point of Interest Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique POI identifier |
| `type` | string | POI type identifier |
| `type_id` | integer | Numeric type identifier |
| `type_name` | string | Human-readable type name |
| `name` | string | POI name |
| `description` | string/null | POI description |
| `url` | string/null | Related URL |
| `lat` | number | Latitude coordinate |
| `lng` | number | Longitude coordinate |

## Error Responses

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 401 | Unauthorized - Authentication required | `{"error": "Authentication required"}` |
| 403 | Forbidden - User doesn't have permission to view this route | `{"error": "Access denied"}` |
| 404 | Not Found - Route doesn't exist | `{"error": "Route not found"}` |
| 500 | Internal Server Error | `{"error": "Internal server error"}` |

**Example Error Response**

```javascript
// 404 - Not Found
{
  "error": "Route not found"
}
```

**Notes**

- Routes in the list response do not include `track_points`, `course_points`, or `points_of_interest`
- To get full route details including navigation data, query the individual route URL
- Course points provide turn-by-turn navigation instructions
- Points of interest highlight notable locations along the route
