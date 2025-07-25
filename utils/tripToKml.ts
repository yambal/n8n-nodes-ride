export interface TrackPoint {
  x: number; // longitude
  y: number; // latitude
  e: number; // elevation
  t: number; // timestamp
  s?: number; // speed
  h?: number; // heart rate
  c?: number; // cadence
}

export interface TripData {
  trip: {
    id: number;
    name: string;
    description?: string;
    departed_at: string;
    locality?: string;
    administrative_area?: string;
    country_code?: string;
    distance: number;
    duration: number;
    elevation_gain: number;
    elevation_loss: number;
    track_points: Array<TrackPoint>;
  };
}

export function tripToKml(tripData: TripData): string {
  const { trip } = tripData;
  
  // Generate coordinates string for KML
  const coordinates = trip.track_points
    .map(point => `${point.x},${point.y},${point.e}`)
    .join(' ');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(trip.name || `Trip ${trip.id}`)}</name>
    <description>${escapeXml(trip.description || `Ride recorded on ${new Date(trip.departed_at).toLocaleDateString()}`)}</description>
    
    <Style id="trackStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
    </Style>
    
    <Placemark>
      <name>${escapeXml(trip.name || `Trip ${trip.id}`)}</name>
      <description><![CDATA[
        <b>Distance:</b> ${(trip.distance / 1000).toFixed(2)} km<br/>
        <b>Duration:</b> ${Math.floor(trip.duration / 3600)}:${Math.floor((trip.duration % 3600) / 60).toString().padStart(2, '0')}:${(trip.duration % 60).toString().padStart(2, '0')}<br/>
        <b>Elevation Gain:</b> ${trip.elevation_gain} m<br/>
        <b>Location:</b> ${[trip.locality, trip.administrative_area, trip.country_code].filter(Boolean).join(', ')}<br/>
        <b>Date:</b> ${new Date(trip.departed_at).toLocaleString()}
      ]]></description>
      <styleUrl>#trackStyle</styleUrl>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
    
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}