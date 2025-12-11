import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Trash2, MapPin, Plus } from 'lucide-react';
import { MarkerData, generateKML, downloadKML } from '@/utils/kmlGenerator';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZG91Z2dpaXUiLCJhIjoiY21qMXNjc2E0MDVhdDNkcHpsOGJyNTVoaiJ9.TvVyw20EZaPUGyDqM7UxMg';

export function MapEditor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isMapReady, setIsMapReady] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [documentName, setDocumentName] = useState('Meu KML');

  const addMarker = (lngLat: mapboxgl.LngLat) => {
    const id = `marker-${Date.now()}`;
    const newMarker: MarkerData = {
      id,
      name: `Ponto ${markers.length + 1}`,
      description: '',
      longitude: lngLat.lng,
      latitude: lngLat.lat,
      altitude: 0,
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const updateMarker = (id: string, field: keyof MarkerData, value: string | number) => {
    setMarkers(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: field === 'altitude' ? parseFloat(value as string) || 0 : value } : m
    ));
  };

  const removeMarker = (id: string) => {
    markersRef.current[id]?.remove();
    delete markersRef.current[id];
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const handleExport = () => {
    if (markers.length === 0) return;
    const kml = generateKML(markers, documentName);
    downloadKML(kml, `${documentName.replace(/\s+/g, '_')}.kml`);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        zoom: 2,
        center: [-47, -15],
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapReady(true);
      });

      map.current.on('click', (e) => {
        addMarker(e.lngLat);
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
  }, []);

  // Sync markers with map
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    markers.forEach((marker) => {
      if (!markersRef.current[marker.id]) {
        const mapMarker = new mapboxgl.Marker({ color: '#3b82f6', draggable: true })
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map.current!);

        mapMarker.on('dragend', () => {
          const lngLat = mapMarker.getLngLat();
          setMarkers(prev => prev.map(m => 
            m.id === marker.id 
              ? { ...m, longitude: lngLat.lng, latitude: lngLat.lat }
              : m
          ));
        });

        markersRef.current[marker.id] = mapMarker;
      }
    });
  }, [markers, isMapReady]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Criar KML</h3>
          <span className="text-xs text-muted-foreground">
            (Clique no mapa para adicionar pontos)
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Map */}
        <div className="relative flex-1 h-[500px] rounded-xl overflow-hidden border shadow-lg">
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

        {/* Sidebar with markers */}
        <div className="w-80 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome do Documento</label>
            <Input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Meu KML"
              className="mt-1"
            />
          </div>

          <div className="flex-1 max-h-[350px] overflow-y-auto space-y-2">
            {markers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Clique no mapa para adicionar pontos</p>
              </div>
            ) : (
              markers.map((marker, index) => (
                <div key={marker.id} className="p-3 rounded-lg bg-muted/50 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">Ponto {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeMarker(marker.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input
                    value={marker.name}
                    onChange={(e) => updateMarker(marker.id, 'name', e.target.value)}
                    placeholder="Nome"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={marker.description}
                    onChange={(e) => updateMarker(marker.id, 'description', e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="h-8 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground shrink-0">Altitude:</label>
                    <Input
                      type="number"
                      value={marker.altitude}
                      onChange={(e) => updateMarker(marker.id, 'altitude', e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm"
                      step="0.001"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                  </p>
                </div>
              ))
            )}
          </div>

          <Button 
            onClick={handleExport} 
            disabled={markers.length === 0}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar KML ({markers.length} pontos)
          </Button>
        </div>
      </div>
    </div>
  );
}