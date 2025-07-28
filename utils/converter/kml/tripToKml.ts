import { TripData } from '../../dataTransformer';
import { KMLTripData } from './types';
import { escapeXml, formatDuration, formatDistance, generateKMLStyle, generateKMLPlacemark } from './kmlHelpers';
import { getSignificantLocations } from '../../common/geoUtils';

export function tripToKml(tripData: TripData | KMLTripData): string {
  const { trip } = tripData;
  
  // Generate coordinates string for KML
  const coordinates = trip.track_points
    .map(point => {
      // Handle both TripData and KMLTripData formats
      const lon = 'longitude' in point ? point.longitude : point.x;
      const lat = 'latitude' in point ? point.latitude : point.y;
      const alt = 'elevation' in point ? point.elevation : ('e' in point ? point.e : 0);
      
      return `${lon},${lat},${alt || 0}`;
    })
    .join('\n          ');

  // Trip metadata
  const tripName = escapeXml(trip.name || `Trip ${trip.id}`);
  const tripDescription = generateTripDescription(trip);
  
  // Generate KML styles
  const tripLineStyle = generateKMLStyle({
    id: 'tripLineStyle',
    lineColor: 'ff0000ff', // Red line
    lineWidth: 3,
    pointColor: 'ff00ff00', // Green points
    pointScale: 1.2
  });

  const stationaryPointStyle = generateKMLStyle({
    id: 'stationaryPointStyle',
    lineColor: 'ffff8000', // Orange line (not used for points)
    lineWidth: 2,
    pointColor: 'ffff8000', // Orange points
    pointScale: 1.5
  });

  // Generate main placemark for the trip route
  const mainPlacemark = generateKMLPlacemark({
    name: tripName,
    description: tripDescription,
    styleUrl: '#tripLineStyle',
    coordinates: coordinates
  });

  // Generate stationary point markers
  // Convert track points to standard format for stationary detection
  const standardTrackPoints = trip.track_points.map(point => {
    if ('longitude' in point) {
      // Already in TrackPoint format
      return point;
    } else {
      // Convert from KMLTrackPoint format
      return {
        longitude: point.x,
        latitude: point.y,
        elevation: point.z || 0,
        timestamp: point.t || 0,
        speed: 0,
        heartRate: 0,
        cadence: 0
      };
    }
  });
  
  const stationaryPoints = getSignificantLocations(standardTrackPoints, 15 * 60, 100); // 15分以上、100m以内
  const stationaryPlacemarks = stationaryPoints.map((point, index) => {
    return generateKMLPlacemark({
      name: `${index + 1}`,
      description: `${index + 1}<br/>座標: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}<br/>標高: ${point.elevation?.toFixed(0) || 0}m`,
      styleUrl: '#stationaryPointStyle',
      coordinates: `${point.longitude},${point.latitude},${point.elevation || 0}`,
      geometry: 'Point'
    });
  }).join('\n    ');

  // Generate complete KML document
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${tripName}</name>
    <description><![CDATA[${tripDescription}]]></description>
    
    ${tripLineStyle}
    
    ${stationaryPointStyle}
    
    ${mainPlacemark}
    
    ${stationaryPlacemarks}
    
  </Document>
</kml>`;

  return kml;
}

/**
 * Generate detailed trip description for KML
 */
function generateTripDescription(trip: any): string {
  const parts = [];
  
  // Basic trip info
  if (trip.description) {
    parts.push(escapeXml(trip.description));
    parts.push('<br/><br/>');
  }
  
  // Trip statistics
  parts.push('<strong>Trip Details:</strong><br/>');
  
  if (trip.distance) {
    parts.push(`Distance: ${formatDistance(trip.distance)} km<br/>`);
  }
  
  if (trip.duration || trip.moving_time) {
    const duration = trip.duration || trip.moving_time;
    parts.push(`Duration: ${formatDuration(duration)}<br/>`);
  }
  
  if (trip.elevation_gain) {
    parts.push(`Elevation Gain: ${trip.elevation_gain.toFixed(0)}m<br/>`);
  }
  
  if (trip.elevation_loss) {
    parts.push(`Elevation Loss: ${trip.elevation_loss.toFixed(0)}m<br/>`);
  }
  
  if (trip.max_speed) {
    const maxSpeedKmh = (trip.max_speed * 3.6).toFixed(1);
    parts.push(`Max Speed: ${maxSpeedKmh} km/h<br/>`);
  }
  
  if (trip.avg_speed) {
    const avgSpeedKmh = (trip.avg_speed * 3.6).toFixed(1);
    parts.push(`Avg Speed: ${avgSpeedKmh} km/h<br/>`);
  }
  
  // Timestamps
  const departedAt = trip.departed_at || trip.created_at;
  if (departedAt) {
    const date = new Date(departedAt);
    parts.push(`<br/>Date: ${date.toLocaleDateString()}<br/>`);
    parts.push(`Time: ${date.toLocaleTimeString()}<br/>`);
  }
  
  // Location info (if available)
  if (trip.locality || trip.administrative_area || trip.country_code) {
    parts.push('<br/>');
    if (trip.locality) parts.push(`Location: ${escapeXml(trip.locality)}<br/>`);
    if (trip.administrative_area) parts.push(`Region: ${escapeXml(trip.administrative_area)}<br/>`);
    if (trip.country_code) parts.push(`Country: ${trip.country_code}<br/>`);
  }
  
  return parts.join('');
}