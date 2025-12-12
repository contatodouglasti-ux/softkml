export interface MarkerData {
  id: string;
  name: string;
  description: string;
  longitude: number;
  latitude: number;
  altitude: number;
}

export function generateKML(markers: MarkerData[], documentName: string = 'Meu KML'): string {
  const placemarks = markers.map(marker => `
    <Placemark>
      <name>${escapeXml(marker.name)}</name>
      <description>${escapeXml(marker.description)}</description>
      <LookAt>
        <longitude>${marker.longitude}</longitude>
        <latitude>${marker.latitude}</latitude>
        <altitude>${marker.altitude}</altitude>
        <heading>0</heading>
        <tilt>0</tilt>
        <gx:fovy>35</gx:fovy>
        <range>764.8683811249794</range>
        <altitudeMode>absolute</altitudeMode>
      </LookAt>
      <ExtendedData>
        <Data name="Latitude">
          <value>${marker.latitude.toFixed(6)}</value>
        </Data>
        <Data name="Longitude">
          <value>${marker.longitude.toFixed(6)}</value>
        </Data>
        <Data name="Altitude">
          <value>${marker.altitude.toFixed(3)}</value>
        </Data>
      </ExtendedData>
      <Point>
        <coordinates>${marker.longitude},${marker.latitude},${marker.altitude}</coordinates>
      </Point>
    </Placemark>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>${escapeXml(documentName)}</name>
    ${placemarks}
  </Document>
</kml>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadKML(content: string, filename: string = 'mapa.kml') {
  const blob = new Blob([content], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
