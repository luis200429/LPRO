import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'; // Importamos Tooltip
import L from 'leaflet';
import { Info } from 'lucide-react';
import { WaterTank } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix para iconos por defecto (si fuera necesario)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface MapViewProps {
  tanks: WaterTank[];
  onSelectTank: (tank: WaterTank) => void;
}

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
  const centerPosition: [number, number] = [42.2328, -8.7226]; 

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-blue-50 p-4 rounded-2xl flex items-center space-x-3 border border-blue-100">
        <Info className="text-blue-600 w-5 h-5" />
        <p className="text-sm text-blue-800">
          Ubicación geográfica real mediante GNSS integrado. Pasa el ratón para ver detalles.
        </p>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border border-slate-300 min-h-[500px] relative shadow-inner z-0">
        <MapContainer center={centerPosition} zoom={11} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {tanks.map((tank) => (
            <Marker 
              key={tank.id}
              position={[tank.location.lat, tank.location.lng]}
              icon={createCustomIcon(tank.status)}
              eventHandlers={{
                click: () => onSelectTank(tank), // Mantenemos el click para seleccionar
              }}
            >
              {/* TOOLTIP: Se muestra al hacer HOVER */}
              <Tooltip 
                direction="top" 
                offset={[0, -15]} 
                opacity={1}
                className="custom-leaflet-tooltip" // Clase opcional para quitar estilos por defecto de Leaflet si quieres
              >
                <div className="min-w-[120px] text-center">
                  <p className="font-bold text-slate-800 text-sm">{tank.name}</p>
                  
                  {/* Pequeño indicador de estado */}
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

              {/* POPUP: Se mantiene al hacer CLICK (opcional) */}
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
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
              <span>Estado Óptimo</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm" />
              <span>Advertencia</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
              <span>Crítico</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MapView;