import { KMLStyle, KMLPlacemark } from './types';

/**
 * Escape XML special characters for safe KML generation
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
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format distance in meters to human readable format
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  } else {
    return `${Math.round(meters)} m`;
  }
}

/**
 * Generate KML style element
 */
export function generateKMLStyle(style: KMLStyle): string {
  const lineColor = style.lineColor || 'ff0000ff'; // Default: red
  const lineWidth = style.lineWidth || 3;
  const pointColor = style.pointColor || 'ff0000ff';
  const pointScale = style.pointScale || 1.0;

  return `
    <Style id="${escapeXml(style.id)}">
      <LineStyle>
        <color>${lineColor}</color>
        <width>${lineWidth}</width>
      </LineStyle>
      <IconStyle>
        <color>${pointColor}</color>
        <scale>${pointScale}</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
        </Icon>
      </IconStyle>
    </Style>`;
}

/**
 * Generate KML placemark element
 */
export function generateKMLPlacemark(placemark: KMLPlacemark): string {
  const styleUrl = placemark.styleUrl ? `<styleUrl>${escapeXml(placemark.styleUrl)}</styleUrl>` : '';
  const description = placemark.description ? `<description><![CDATA[${placemark.description}]]></description>` : '';
  const geometry = placemark.geometry || 'LineString'; // Default to LineString
  
  let geometryElement = '';
  
  switch (geometry) {
    case 'Point':
      geometryElement = `
        <Point>
          <coordinates>${placemark.coordinates}</coordinates>
        </Point>`;
      break;
    case 'Polygon':
      geometryElement = `
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${placemark.coordinates}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>`;
      break;
    default: // LineString
      geometryElement = `
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
            ${placemark.coordinates}
          </coordinates>
        </LineString>`;
      break;
  }
  
  return `
    <Placemark>
      <name>${escapeXml(placemark.name)}</name>
      ${description}
      ${styleUrl}
      ${geometryElement}
    </Placemark>`;
}