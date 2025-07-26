import { TripData } from '../nodes/Ride/types/Trip.types';
import { KMLTripData } from './types/kml.types';
import { escapeXml, formatDuration, formatDistance, generateKMLStyle, generateKMLPlacemark } from './kmlHelpers';

export function tripToKml(tripData: TripData | KMLTripData): string {
  const { trip } = tripData;
  
  // Generate coordinates string for KML
  const coordinates = trip.track_points
    .map(point => `${point.x},${point.y},${point.e}`)
    .join(' ');

  // Generate track style
  const trackStyle = generateKMLStyle({
    id: 'trackStyle',
    lineColor: 'ff0000ff',
    lineWidth: 3
  });

  // Generate main track placemark
  const trackPlacemark = generateKMLPlacemark({
    name: trip.name || `Trip ${trip.id}`,
    description: `
      <b>Distance:</b> ${formatDistance(trip.distance)} km<br/>
      <b>Duration:</b> ${formatDuration(trip.duration)}<br/>
      <b>Elevation Gain:</b> ${trip.elevation_gain} m<br/>
      <b>Location:</b> ${[trip.locality, trip.administrative_area, trip.country_code].filter(Boolean).join(', ')}<br/>
      <b>Date:</b> ${new Date(trip.departed_at).toLocaleString()}
    `,
    coordinates: coordinates,
    styleUrl: '#trackStyle'
  });

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(trip.name || `Trip ${trip.id}`)}</name>
    <description>${escapeXml(trip.description || `Ride recorded on ${new Date(trip.departed_at).toLocaleDateString()}`)}</description>
    
    ${trackStyle}
    
    ${trackPlacemark}
    
    <!-- Start Point -->
    <Placemark>
      <name>Start</name>
      <Point>
        <coordinates>${trip.track_points[0]?.x},${trip.track_points[0]?.y},${trip.track_points[0]?.e}</coordinates>
      </Point>
    </Placemark>
    
    <!-- End Point -->
    <Placemark>
      <name>End</name>
      <Point>
        <coordinates>${trip.track_points[trip.track_points.length - 1]?.x},${trip.track_points[trip.track_points.length - 1]?.y},${trip.track_points[trip.track_points.length - 1]?.e}</coordinates>
      </Point>
    </Placemark>
    
  </Document>
</kml>`;

  return kml;
}