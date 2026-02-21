import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Info } from 'lucide-react';
import { WaterTank } from '../types';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  tanks: WaterTank[];
  onSelectTank: (tank: WaterTank) => void;
}

// Estilo visual para las zonas quemadas (Ceniza con borde rojizo)
const burnedAreaStyle = {
  color: '#7f1d1d',      // Borde rojo oscuro
  weight: 2,
  fillColor: '#1a1a1a',  // Relleno gris oscuro/negro (ceniza)
  fillOpacity: 0.5,
  dashArray: '4'         // Borde punteado
};

// Generador de iconos para los depósitos de agua
const createCustomIcon = (status: 'optimal' | 'warning' | 'critical') => {
  const colorClass = 
    status === 'optimal' ? 'bg-emerald-500' :
    status === 'warning' ? 'bg-amber-500' : 'bg-red-500';

  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-md ${colorClass}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MapView: React.FC<MapViewProps> = ({ tanks, onSelectTank }) => {
  // Centro ajustado para abarcar Galicia y la mitad norte de Portugal
  const centerPosition: [number, number] = [41.15, -8.3]; 

  // Estados para manejar el mapa de incendios (GeoJSON)
  const [burnedAreas, setBurnedAreas] = useState<any>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Carga del archivo GeoJSON al iniciar el componente
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setIsLoadingGeo(true);
        // La ruta asume que tienes el archivo en public/fotos/incendios-2025.json
        const response = await fetch('/fotos/incendios-2025.json'); 
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el archivo GeoJSON.');
        }
        
        const data = await response.json();
        setBurnedAreas(data);
      } catch (error) {
        console.error("Error cargando las zonas incendiadas:", error);
        setGeoError("No se pudieron cargar las zonas incendiadas.");
      } finally {
        setIsLoadingGeo(false);
      }
    };

    fetchGeoJSON();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Banner de Información Superior */}
      <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between border border-blue-100">
        <div className="flex items-center space-x-3">
          <Info className="text-blue-600 w-5 h-5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Monitorización de arrastre de cenizas en depósitos.
            {isLoadingGeo && <span className="ml-2 font-bold animate-pulse text-blue-600">Cargando mapa de incendios...</span>}
            {geoError && <span className="ml-2 font-bold text-red-600">{geoError}</span>}
          </p>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-300 min-h-[500px] relative shadow-inner z-0">
        {/* Zoom a 7 para ver la panorámica de Galicia y Portugal */}
        <MapContainer center={centerPosition} zoom={7} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Capa de Incendios (GeoJSON) - Renderiza solo si hay datos */}
          {burnedAreas && (
            <GeoJSON 
              key="burned-areas-layer" 
              data={burnedAreas} 
              style={burnedAreaStyle}
              onEachFeature={(feature, layer) => {
                // Lee las propiedades que vengan en tu GeoJSON (Mapshaper suele mantener las originales)
                const nombre = feature.properties?.name || feature.properties?.COUNTRY || 'Área Incendiada';
                
                layer.bindPopup(`
                  <div class="p-1 text-sm">
                    <strong>Incendio detectado</strong><br/>
                    Detalle: ${nombre}
                  </div>
                `);
              }}
            />
          )}

          {/* Capa de Depósitos de Agua (Chinchetas) */}
          {tanks.map((tank) => (
            <Marker 
              key={tank.id}
              position={[tank.location.lat, tank.location.lng]}
              icon={createCustomIcon(tank.status)}
              eventHandlers={{
                click: () => onSelectTank(tank),
              }}
            >
              <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                <div className="min-w-[120px] text-center">
                  <p className="font-bold text-slate-800 text-sm">{tank.name}</p>
                  <div className="flex justify-center items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                      tank.status === 'optimal' ? 'bg-emerald-500' :
                      tank.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {tank.lastReading.level}% Lleno
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {tank.location.address}
                  </p>
                </div>
              </Tooltip>

              <Popup>
                <div className="p-1">
                  <strong className="block mb-1">Detalles Completos</strong>
                  <p className="text-xs">Turbidez: {tank.lastReading.turbidity} NTU</p>
                  <p className="text-xs">pH: {tank.lastReading.ph}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Leyenda flotante sobre el mapa */}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200 z-[400]">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Leyenda</p>
          
          <div className="space-y-3 mb-3 pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-[#1a1a1a] border-2 border-[#7f1d1d] opacity-70" />
              <span className="text-slate-700">Área Incendiada (2025)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
              <span>Depósito Óptimo</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm" />
              <span>Riesgo Moderado</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
              <span>Alerta por Arrastre</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MapView;