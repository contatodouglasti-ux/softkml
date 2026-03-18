import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Trash2, MapPin, Search, Navigation } from 'lucide-react';
import { MarkerData, generateKML, downloadKML } from '@/utils/kmlGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZG91Z2dpaXUiLCJhIjoiY21qMjRvNjcyMGNwajNlb2p0M2RoYmVwaCJ9.751h9O2EDapDGxrHVpMMng';

export function MapEditor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isMapReady, setIsMapReady] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [documentName, setDocumentName] = useState('Meu KML');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');

  const searchAddress = async () => {
    const addressParts = [rua, bairro, cidade].filter(Boolean);
    if (addressParts.length === 0) return;
    const address = addressParts.join(', ');
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 2000 });
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const goToCoordinates = () => {
    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);
    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    map.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 2000 });
  };

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
      map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.current.on('load', () => setIsMapReady(true));
      map.current.on('click', (e) => addMarker(e.lngLat));
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setIsMapReady(false);
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
    return () => { map.current?.remove(); };
  }, []);

  useEffect(() => {
    if (!map.current || !isMapReady) return;
    markers.forEach((marker) => {
      if (!markersRef.current[marker.id]) {
        const mapMarker = new mapboxgl.Marker({ color: '#6366f1', draggable: true })
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map.current!);
        mapMarker.on('dragend', () => {
          const lngLat = mapMarker.getLngLat();
          setMarkers(prev => prev.map(m =>
            m.id === marker.id ? { ...m, longitude: lngLat.lng, latitude: lngLat.lat } : m
          ));
        });
        markersRef.current[marker.id] = mapMarker;
      }
    });
  }, [markers, isMapReady]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Map */}
      <div className="relative w-full lg:flex-1 h-[400px] lg:h-[480px] rounded-xl overflow-hidden border min-h-[350px]">
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

      {/* Sidebar */}
      <div className="w-full lg:w-72 space-y-4">
        {/* Search Tabs */}
        <div className="p-3 rounded-xl bg-muted/30 border space-y-2">
          <Tabs defaultValue="address" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="address" className="text-xs">
                <Search className="w-3 h-3 mr-1" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="coordinates" className="text-xs">
                <Navigation className="w-3 h-3 mr-1" />
                Coordenadas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="address" className="space-y-2 mt-2">
              <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua" className="h-8 text-sm" />
              <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="h-8 text-sm" />
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && searchAddress()} />
              <Button onClick={searchAddress} disabled={isSearching || (!rua && !bairro && !cidade)} size="sm" className="w-full">
                {isSearching ? 'Buscando...' : 'Ir para endereço'}
              </Button>
            </TabsContent>
            <TabsContent value="coordinates" className="space-y-2 mt-2">
              <Input value={searchLat} onChange={(e) => setSearchLat(e.target.value)} placeholder="Latitude (ex: -23.5505)" className="h-8 text-sm" type="number" step="any" />
              <Input value={searchLng} onChange={(e) => setSearchLng(e.target.value)} placeholder="Longitude (ex: -46.6333)" className="h-8 text-sm" type="number" step="any" onKeyDown={(e) => e.key === 'Enter' && goToCoordinates()} />
              <Button onClick={goToCoordinates} disabled={!searchLat || !searchLng} size="sm" className="w-full">
                Ir para coordenadas
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Document Name */}
        <div>
          <label className="text-sm font-medium text-foreground">Nome do Documento</label>
          <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="Meu KML" className="mt-1" />
        </div>

        {/* Markers List */}
        <div className="max-h-[250px] overflow-y-auto space-y-2">
          {markers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MapPin className="w-7 h-7 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Clique no mapa para adicionar pontos</p>
            </div>
          ) : (
            markers.map((marker, index) => (
              <div key={marker.id} className="p-3 rounded-lg bg-muted/50 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Ponto {index + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeMarker(marker.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input value={marker.name} onChange={(e) => updateMarker(marker.id, 'name', e.target.value)} placeholder="Nome" className="h-7 text-xs" />
                <Input value={marker.description} onChange={(e) => updateMarker(marker.id, 'description', e.target.value)} placeholder="Descrição (opcional)" className="h-7 text-xs" />
                <p className="text-xs text-muted-foreground">
                  {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Export */}
        <Button onClick={handleExport} disabled={markers.length === 0} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Exportar KML ({markers.length} pontos)
        </Button>
        {markers.length === 0 && (
          <p className="text-xs text-center text-muted-foreground">Clique no mapa para adicionar pontos antes de exportar</p>
        )}
      </div>
    </div>
  );
}
