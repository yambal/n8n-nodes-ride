import { TripData } from '../../dataTransformer';
import { GPXTripData } from './types';
import { generateGPXMetadata, generateGPXTrack, generateGPXWaypoints } from './gpxHelpers';
import { getSignificantLocations } from '../../common/geoUtils';

export function tripToGpx(tripData: TripData | GPXTripData): string {
	const { trip } = tripData;
	
	// Validate track points exist
	if (!trip.track_points || trip.track_points.length === 0) {
		throw new Error('Trip data must contain at least one track point');
	}

	// Validate that at least some track points have valid coordinates
	const validPoints = trip.track_points.filter(point => {
		const lat = 'latitude' in point ? point.latitude : point.y;
		const lon = 'longitude' in point ? point.longitude : point.x;
		return typeof lat === 'number' && typeof lon === 'number';
	});

	if (validPoints.length === 0) {
		throw new Error('Trip data must contain at least one valid track point with coordinates');
	}

	// Generate GPX metadata
	const metadata = generateGPXMetadata(tripData);
	
	// Generate waypoints for stationary points
	// Convert track points to standard format for stationary detection
	const standardTrackPoints = trip.track_points.map(point => {
		if ('longitude' in point && point.longitude !== undefined && point.latitude !== undefined && 'timestamp' in point) {
			// Already in TrackPoint format
			return point;
		} else {
			// Convert from GPXTrackPoint format
			const gpxPoint = point as any; // Type assertion to access GPXTrackPoint properties
			const lat = gpxPoint.latitude || gpxPoint.y || 0;
			const lon = gpxPoint.longitude || gpxPoint.x || 0;
			const ele = gpxPoint.elevation || gpxPoint.e || 0;
			
			return {
				longitude: lon,
				latitude: lat,
				elevation: ele,
				timestamp: 0, // GPXTrackPoint doesn't have timestamp for stationary detection
				speed: gpxPoint.speed || 0,
				heartRate: gpxPoint.heart_rate || 0,
				cadence: gpxPoint.cadence || 0
			};
		}
	});
	
	const stationaryPoints = getSignificantLocations(standardTrackPoints, 15 * 60, 100); // 15分以上、100m以内
	const waypoints = generateGPXWaypoints(stationaryPoints);
	
	// Generate GPX track
	const track = generateGPXTrack(tripData);
	
	// Generate complete GPX document
	const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="n8n Ride Node" 
     xmlns="http://www.topografix.com/GPX/1/1" 
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
${metadata}${waypoints}${track}</gpx>`;

	return gpx;
}