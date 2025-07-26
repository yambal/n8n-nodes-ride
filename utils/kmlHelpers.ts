import { KMLStyle, KMLPlacemark } from './types/kml.types';

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
 * Format duration in seconds to HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert distance in meters to kilometers with proper formatting
 */
export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/**
 * Generate KML style definition
 */
export function generateKMLStyle(style: KMLStyle): string {
  return `
    <Style id="${style.id}">
      <LineStyle>
        <color>${style.lineColor || 'ff0000ff'}</color>
        <width>${style.lineWidth || 3}</width>
      </LineStyle>
      ${style.pointColor ? `
      <IconStyle>
        <color>${style.pointColor}</color>
        <scale>${style.pointScale || 1.0}</scale>
      </IconStyle>
      ` : ''}
    </Style>`;
}

/**
 * Generate KML placemark
 */
export function generateKMLPlacemark(placemark: KMLPlacemark): string {
  return `
    <Placemark>
      <name>${escapeXml(placemark.name)}</name>
      ${placemark.description ? `<description>${escapeXml(placemark.description)}</description>` : ''}
      ${placemark.styleUrl ? `<styleUrl>${placemark.styleUrl}</styleUrl>` : ''}
      <LineString>
        <coordinates>${placemark.coordinates}</coordinates>
      </LineString>
    </Placemark>`;
}