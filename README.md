# n8n-nodes-ride

This is an n8n community node. It lets you use Ride with GPS in your n8n workflows.

Ride with GPS is a comprehensive cycling platform that allows users to plan routes, track rides, organize events, and share their cycling adventures with a community of riders.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node supports the following resources and operations:

### User
- **Get Current**: Retrieve information about the currently authenticated user

### Events
- **Get Event**: Retrieve details of a specific event by ID (including associated routes and organizer info)
- **Get Events**: Retrieve a paginated list of events owned by the authenticated user

### Routes
- **Get Route**: Retrieve details of a specific route by ID (including track points, course points, and points of interest)
- **Get Routes**: Retrieve a paginated list of routes owned by the authenticated user

### Trips
- **Get Trip**: Retrieve details of a specific trip by ID (including track points and comprehensive trip statistics)
- **Get Trips**: Retrieve a paginated list of trips owned by the authenticated user

### Sync
- **Sync**: Retrieve changes to routes and/or trips since a specific datetime (specialized for data synchronization)

## Credentials

To use this node, you need to authenticate with Ride with GPS using a Bearer token.

### Prerequisites
1. Sign up for a [Ride with GPS account](https://ridewithgps.com)
2. Obtain an API token from your Ride with GPS account settings

### Authentication Setup
1. In n8n, create new credentials of type "Ride API"
2. Enter your Ride with GPS API Bearer token
3. Configure the base URL (defaults to `https://ridewithgps.com`)

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Node.js version**: 20.15 or higher
- **Tested with**: n8n v1.x

## Usage

### Basic Examples

**Get Current User Information:**
- Select Resource: User
- The node will automatically fetch the current user's profile information

**List Your Routes:**
- Select Resource: Routes
- Select Operation: Get Routes
- Optionally specify a page number for pagination

**Get Specific Route Details:**
- Select Resource: Routes  
- Select Operation: Get Route
- Enter the Route ID

**Sync Changes:**
- Select Resource: Sync
- Enter a "Since Datetime" in ISO8601 format (e.g., `2024-01-01T00:00:00Z`)
- Select Asset Types (Routes, Trips, or both)
- This is useful for maintaining synchronized copies of user data

### Pagination
Most list operations support pagination through the "Page Number" parameter. The response will include metadata about pagination, including total record count and links to additional pages.

### Data Synchronization
The Sync operation is particularly useful for:
- Initial full synchronization (use `1970-01-01T00:00:00Z` as since datetime)
- Incremental updates (use the timestamp from previous sync)
- Maintaining backup copies of user's route and trip libraries

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Ride with GPS API Documentation](https://ridewithgps.com/api)
* [Ride with GPS Platform](https://ridewithgps.com)

## License

This project is licensed under the MIT License.
