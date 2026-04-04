import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Info } from 'lucide-react';
import { WaterTank, UserReport } from '../types';
import 'leaflet/dist/leaflet.css';

// Importamos solo la función buffer para evitar conflictos
import buffer from '@turf/buffer';

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

const alertAreaStyle = {
  color: '#ea580c', 
  weight: 2,
  fillColor: '#fb923c', 
  fillOpacity: 0.3,
  dashArray: '5, 5'
};

const createCustomIcon = (status: 'optimal' | 'warning' | 'critical') => {
  const colorClass = 
    status === 'optimal' ? 'bg-emerald-500' :
    status === 'warning' ? 'bg-amber-500' : 'bg-red-500';

  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 shadow-md ${colorClass} transition-colors"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MapView: React.FC<MapViewProps> = ({ tanks, onSelectTank }) => {
  const centerPosition: [number, number] = [41.15, -8.3]; 

  const [burnedAreas, setBurnedAreas] = useState<any>(null);
  const [alertAreas, setAlertAreas] = useState<any>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [reports, setReports] = useState<UserReport[]>([]);

  // Carga del GeoJSON y cálculo del área de alerta
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setIsLoadingGeo(true);
        const response = await fetch('/fotos/incendios-2025.json'); 
        if (!response.ok) throw new Error('No se pudo cargar el archivo GeoJSON.');
        const data = await response.json();
        
        setBurnedAreas(data);

        // --- CÁLCULO SEGURO DEL BUFFER (POLÍGONO A POLÍGONO) ---
        if (data && data.features && Array.isArray(data.features)) {
          const validBufferedFeatures: any[] = [];

          data.features.forEach((feature: any) => {
            try {
              if (feature && feature.geometry && feature.geometry.coordinates) {
                const buffered = buffer(feature, 2, { units: 'kilometers' });
                if (buffered) {
                  validBufferedFeatures.push(buffered);
                }
              }
            } catch (err) {
              console.warn("Polígono ignorado por geometría inválida:", feature.properties?.name || 'Desconocido');
            }
          });

          if (validBufferedFeatures.length > 0) {
            setAlertAreas({
              type: "FeatureCollection",
              features: validBufferedFeatures
            });
          }
        }

      } catch (error) {
        console.error("Error cargando las zonas incendiadas:", error);
        setGeoError("No se pudieron cargar las zonas incendiadas.");
      } finally {
        setIsLoadingGeo(false);
      }
    };
    fetchGeoJSON();
  }, []);

  // Carga de los reportes vecinales
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
      {/* TRUCO PROFESIONAL: Estilos para invertir el mapa de Leaflet y sus popups en modo oscuro */}
      <style>{`
        .dark .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .dark .leaflet-popup-content-wrapper, .dark .leaflet-popup-tip {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .dark .leaflet-tooltip {
          background-color: #1e293b;
          color: #f1f5f9;
          border-color: #334155;
        }
        .dark .leaflet-tooltip::before {
          border-top-color: #1e293b;
        }
      `}</style>

      {/* BANNER SUPERIOR */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-800/50 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <Info className="text-blue-600 dark:text-blue-400 w-5 h-5 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Monitorización de arrastre de cenizas e incidencias vecinales.
            {isLoadingGeo && <span className="ml-2 font-bold animate-pulse text-blue-600 dark:text-blue-400">Cargando mapa...</span>}
            {geoError && <span className="ml-2 font-bold text-red-600 dark:text-red-400">{geoError}</span>}
          </p>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-700 min-h-[500px] relative shadow-inner z-0 transition-colors duration-300">
        <MapContainer center={centerPosition} zoom={7} scrollWheelZoom={true} className="h-full w-full bg-slate-50 dark:bg-slate-900">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* CAPA DE ALERTA NARANJA (Debajo de los incendios) */}
          {alertAreas && alertAreas.features && alertAreas.features.length > 0 && (
            <GeoJSON 
              key={`alert-layer-${alertAreas.features.length}`} 
              data={alertAreas} 
              style={alertAreaStyle}
              interactive={false} 
            />
          )}

          {/* CAPA DE INCENDIOS ORIGINAL */}
          {burnedAreas && burnedAreas.features && burnedAreas.features.length > 0 && (
            <GeoJSON 
              key={`burned-layer-${burnedAreas.features.length}`} 
              data={burnedAreas} 
              style={burnedAreaStyle}
              onEachFeature={(feature, layer) => {
                const nombre = feature.properties?.name || feature.properties?.COUNTRY || 'Área Incendiada';
                layer.bindPopup(`
                  <div class="p-1 text-sm dark:text-white">
                    <strong class="dark:text-white">Incendio detectado</strong><br/>
                    <span class="dark:text-slate-300">Detalle: ${nombre}</span>
                  </div>
                `);
              }}
            />
          )}

          {/* CAPA DE DEPÓSITOS */}
          {tanks.map((tank) => (
            <Marker 
              key={tank.id}
              position={[tank.location.lat, tank.location.lng]}
              icon={createCustomIcon(tank.status)}
              eventHandlers={{ click: () => onSelectTank(tank) }}
            >
              <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                <div className="min-w-[120px] text-center">
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{tank.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{tank.location.address}</p>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* CAPA DE REPORTES VECINALES */}
          {reports.map((report) => {
            if (!report.lat || !report.lng || (report.lat === 0 && report.lng === 0)) return null;

            return (
              <CircleMarker
                key={report.id}
                center={[report.lat, report.lng]}
                radius={8}
                pathOptions={{ 
                  fillColor: '#3b82f6',
                  color: '#1e3a8a',
                  weight: 2, 
                  fillOpacity: 0.9 
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <div className="flex items-center space-x-1 mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Incidencia
                      </span>
                    </div>
                    <strong className="block text-sm text-slate-800 dark:text-white">{report.type}</strong>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-1">"{report.description}"</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 border-t dark:border-slate-700 pt-1">
                      Por: <b className="dark:text-slate-300">{report.userName}</b>
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* LEYENDA */}
        <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-[400] transition-colors duration-300">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">Leyenda</p>
          
          <div className="space-y-3 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-[#1a1a1a] border-2 border-[#7f1d1d] opacity-70" />
              <span className="text-slate-700 dark:text-slate-300">Área Incendiada</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-[#fb923c] border-2 border-[#ea580c] opacity-50" />
              <span className="text-slate-700 dark:text-slate-300">Zona de Alerta (2km)</span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-900 opacity-90" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Reporte Vecinal</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-800 shadow-sm transition-colors" />
              <span className="text-slate-700 dark:text-slate-300">Depósito Óptimo</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-white dark:border-slate-800 shadow-sm transition-colors" />
              <span className="text-slate-700 dark:text-slate-300">Riesgo Moderado</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white dark:border-slate-800 shadow-sm transition-colors" />
              <span className="text-slate-700 dark:text-slate-300">Alerta por Arrastre</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;