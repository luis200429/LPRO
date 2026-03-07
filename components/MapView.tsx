import React, { useState, useEffect } from 'react';
// 1. Añadimos CircleMarker a las importaciones de react-leaflet
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Info } from 'lucide-react';
// 2. Importamos UserReport (asegúrate de que lo tienes exportado en types.ts)
import { WaterTank, UserReport } from '../types';
import 'leaflet/dist/leaflet.css';

// Pon aquí tu URL del backend si no estás usando un proxy
const BACKEND_URL = ''; 

interface MapViewProps {
  tanks: WaterTank[];
  onSelectTank: (tank: WaterTank) => void;
}

const burnedAreaStyle = {
  color: '#7f1d1d',
  weight: 2,
  fillColor: '#1a1a1a',
  fillOpacity: 0.5,
  dashArray: '4'
};

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
  const centerPosition: [number, number] = [41.15, -8.3]; 

  const [burnedAreas, setBurnedAreas] = useState<any>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // 3. Nuevo estado para guardar los reportes vecinales
  const [reports, setReports] = useState<UserReport[]>([]);

  // Carga del GeoJSON
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setIsLoadingGeo(true);
        const response = await fetch('/fotos/incendios-2025.json'); 
        if (!response.ok) throw new Error('No se pudo cargar el archivo GeoJSON.');
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

  // 4. Nuevo useEffect para cargar los reportes de la base de datos
  useEffect(() => {
    const fetchReportes = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/reportes`);
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error("Error cargando reportes para el mapa:", error);
      }
    };
    fetchReportes();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between border border-blue-100">
        <div className="flex items-center space-x-3">
          <Info className="text-blue-600 w-5 h-5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Monitorización de arrastre de cenizas e incidencias vecinales.
            {isLoadingGeo && <span className="ml-2 font-bold animate-pulse text-blue-600">Cargando mapa...</span>}
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-300 min-h-[500px] relative shadow-inner z-0">
        <MapContainer center={centerPosition} zoom={7} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {burnedAreas && (
            <GeoJSON 
              key="burned-areas-layer" 
              data={burnedAreas} 
              style={burnedAreaStyle}
              onEachFeature={(feature, layer) => {
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

          {/* Capa de Depósitos Oficiales */}
          {tanks.map((tank) => (
            <Marker 
              key={tank.id}
              position={[tank.location.lat, tank.location.lng]}
              icon={createCustomIcon(tank.status)}
              eventHandlers={{ click: () => onSelectTank(tank) }}
            >
              <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                <div className="min-w-[120px] text-center">
                  <p className="font-bold text-slate-800 text-sm">{tank.name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{tank.location.address}</p>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* 5. NUEVA CAPA: Reportes Vecinales (Círculos Azules) */}
          {reports.map((report) => {
            // Ignoramos los reportes que no tienen coordenadas válidas (0.0 es lo que guarda Influx por defecto si no hay datos)
            if (!report.lat || !report.lng || (report.lat === 0 && report.lng === 0)) return null;

            return (
              <CircleMarker
                key={report.id}
                center={[report.lat, report.lng]}
                radius={8} // Tamaño del círculo
                pathOptions={{ 
                  fillColor: '#3b82f6', // Azul Tailwind (blue-500)
                  color: '#1e3a8a',     // Borde azul oscuro (blue-900)
                  weight: 2, 
                  fillOpacity: 0.9 
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <div className="flex items-center space-x-1 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Incidencia
                      </span>
                    </div>
                    <strong className="block text-sm text-slate-800">{report.type}</strong>
                    <p className="text-xs text-slate-600 italic mt-1">"{report.description}"</p>
                    <p className="text-[10px] text-slate-400 mt-2 border-t pt-1">
                      Por: <b>{report.userName}</b>
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Leyenda flotante sobre el mapa */}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200 z-[400]">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Leyenda</p>
          
          <div className="space-y-3 mb-3 pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-[#1a1a1a] border-2 border-[#7f1d1d] opacity-70" />
              <span className="text-slate-700">Área Incendiada</span>
            </div>
            {/* 6. Añadido a la leyenda */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-900 opacity-90" />
              <span className="text-slate-700 font-medium">Reporte Vecinal</span>
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