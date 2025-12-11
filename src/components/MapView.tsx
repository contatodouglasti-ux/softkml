import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CoordinateData, PlacemarkData } from '@/utils/kmlValidator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Map, Key, AlertCircle } from 'lucide-react';

interface MapViewProps {
  placemarks: PlacemarkData[];
}

export function MapView({ placemarks }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Get all coordinates from placemarks
  const allCoordinates: CoordinateData[] = placemarks.flatMap(p => p.coordinates);

  // Calculate bounds for all coordinates
  const getBounds = () => {
    if (allCoordinates.length === 0) return null;
    
    const lngs = allCoordinates.map(c => c.longitude);
    const lats = allCoordinates.map(c => c.latitude);
    
    return new mapboxgl.LngLatBounds(
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    );
  };

  const handleSetToken = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        zoom: 2,
        center: [0, 0],
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapReady(true);

        // Fit bounds to all coordinates
        const bounds = getBounds();
        if (bounds && map.current) {
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }

        // Add markers for each placemark
        placemarks.forEach((placemark, placemarkIndex) => {
          placemark.coordinates.forEach((coord, coordIndex) => {
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family: system-ui; padding: 4px;">
                <strong style="color: #1f2937;">${placemark.name}</strong>
                ${placemark.description ? `<p style="color: #6b7280; font-size: 12px; margin: 4px 0 0;">${placemark.description}</p>` : ''}
                <p style="color: #6b7280; font-size: 11px; margin: 4px 0 0;">
                  ${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}
                  ${coord.altitude !== undefined ? ` (alt: ${coord.altitude}m)` : ''}
                </p>
              </div>`
            );

            const marker = new mapboxgl.Marker({
              color: `hsl(${(placemarkIndex * 40) % 360}, 70%, 50%)`,
            })
              .setLngLat([coord.longitude, coord.latitude])
              .setPopup(popup)
              .addTo(map.current!);
          });
        });
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setIsMapReady(false);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, placemarks]);

  if (!mapboxToken) {
    return (
      <div className="w-full p-6 rounded-xl bg-muted/30 border space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Map className="w-5 h-5" />
          <h3 className="font-medium text-foreground">Visualização no Mapa</h3>
        </div>
        
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Para visualizar as coordenadas no mapa, insira seu token público do Mapbox. 
            Você pode obtê-lo em{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              mapbox.com
            </a>
            {' '}na seção Tokens do dashboard.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="pk.eyJ1Ijo..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSetToken()}
            />
          </div>
          <Button onClick={handleSetToken} disabled={!tokenInput.trim()}>
            Carregar Mapa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Map className="w-5 h-5" />
        <h3 className="font-medium text-foreground">Visualização no Mapa</h3>
        <span className="text-xs text-muted-foreground">
          ({allCoordinates.length} coordenadas)
        </span>
      </div>
      
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden border shadow-lg">
        <div ref={mapContainer} className="absolute inset-0" />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Carregando mapa...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
