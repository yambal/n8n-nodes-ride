import { TripData } from '../../dataTransformer';
import { GPXTripData } from './types';
import { generateGPXMetadata, generateGPXTrack } from './gpxHelpers';

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
	
	// Generate GPX track
	const track = generateGPXTrack(tripData);
	
	// Generate complete GPX document
	const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="n8n Ride Node" 
     xmlns="http://www.topografix.com/GPX/1/1" 
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
${metadata}${track}</gpx>`;

	return gpx;
}