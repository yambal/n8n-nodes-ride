/**
 * GPX Helper functions for XML generation and data formatting
 */

/**
 * Escape XML special characters
 */
export function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Format duration from seconds to human readable string
 */
export function formatDuration(durationInSeconds: number): string {
	if (durationInSeconds < 60) {
		return `${Math.round(durationInSeconds)}s`;
	} else if (durationInSeconds < 3600) {
		const minutes = Math.floor(durationInSeconds / 60);
		const seconds = Math.round(durationInSeconds % 60);
		return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
	} else {
		const hours = Math.floor(durationInSeconds / 3600);
		const minutes = Math.floor((durationInSeconds % 3600) / 60);
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
}

/**
 * Format distance from meters to appropriate unit
 */
export function formatDistance(distanceInMeters: number): string {
	if (distanceInMeters < 1000) {
		return `${Math.round(distanceInMeters)}m`;
	} else {
		const km = distanceInMeters / 1000;
		return `${km.toFixed(2)}km`;
	}
}

/**
 * Format speed from m/s to km/h
 */
export function formatSpeed(speedInMps: number): string {
	const kmh = speedInMps * 3.6;
	return `${kmh.toFixed(1)} km/h`;
}

/**
 * Format timestamp to ISO 8601 format for GPX
 */
export function formatGPXTime(timestamp: Date | string): string {
	const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
	return date.toISOString();
}

/**
 * Generate GPX metadata section
 */
export function generateGPXMetadata(tripData: any): string {
	const { trip } = tripData;
	const name = trip.name || `Trip ${trip.id}`;
	const description = trip.description || `GPS track for trip ${trip.id}`;
	
	let metadata = '  <metadata>\n';
	metadata += `    <name>${escapeXml(name)}</name>\n`;
	metadata += `    <desc>${escapeXml(description)}</desc>\n`;
	metadata += `    <author>\n`;
	metadata += `      <name>n8n Ride Node</name>\n`;
	metadata += `    </author>\n`;
	
	if (trip.start_time) {
		metadata += `    <time>${formatGPXTime(trip.start_time)}</time>\n`;
	}
	
	metadata += '  </metadata>\n';
	return metadata;
}

/**
 * Generate GPX track section
 */
export function generateGPXTrack(tripData: any): string {
	const { trip } = tripData;
	const trackName = trip.name || `Trip ${trip.id}`;
	
	let track = '  <trk>\n';
	track += `    <name>${escapeXml(trackName)}</name>\n`;
	
	// Add description with trip statistics
	let description = `Trip: ${trip.id}`;
	if (trip.distance) {
		description += ` | Distance: ${formatDistance(trip.distance)}`;
	}
	if (trip.duration) {
		description += ` | Duration: ${formatDuration(trip.duration)}`;
	}
	if (trip.avg_speed) {
		description += ` | Avg Speed: ${formatSpeed(trip.avg_speed)}`;
	}
	if (trip.max_speed) {
		description += ` | Max Speed: ${formatSpeed(trip.max_speed)}`;
	}
	
	track += `    <desc>${escapeXml(description)}</desc>\n`;
	track += '    <trkseg>\n';
	
	// Add track points
	for (const point of trip.track_points) {
		track += generateTrackPoint(point);
	}
	
	track += '    </trkseg>\n';
	track += '  </trk>\n';
	
	return track;
}

/**
 * Generate individual track point
 */
function generateTrackPoint(point: any): string {
	const lat = 'latitude' in point ? point.latitude : point.y;
	const lon = 'longitude' in point ? point.longitude : point.x;
	const ele = 'elevation' in point ? point.elevation : ('e' in point ? point.e : undefined);
	
	if (typeof lat !== 'number' || typeof lon !== 'number') {
		return ''; // Skip invalid points
	}
	
	let trkpt = `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}">\n`;
	
	// Add elevation if available
	if (typeof ele === 'number') {
		trkpt += `        <ele>${ele.toFixed(2)}</ele>\n`;
	}
	
	// Add timestamp if available
	if (point.time) {
		trkpt += `        <time>${formatGPXTime(point.time)}</time>\n`;
	}
	
	// Add extensions for additional data
	const hasExtensions = point.speed || point.heart_rate || point.cadence;
	if (hasExtensions) {
		trkpt += '        <extensions>\n';
		
		if (typeof point.speed === 'number') {
			trkpt += `          <speed>${point.speed.toFixed(2)}</speed>\n`;
		}
		
		if (typeof point.heart_rate === 'number') {
			trkpt += `          <heartrate>${point.heart_rate}</heartrate>\n`;
		}
		
		if (typeof point.cadence === 'number') {
			trkpt += `          <cadence>${point.cadence}</cadence>\n`;
		}
		
		trkpt += '        </extensions>\n';
	}
	
	trkpt += '      </trkpt>\n';
	return trkpt;
}