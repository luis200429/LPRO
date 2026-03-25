import React from 'react';

import { 
  Thermometer, 
  Wind, 
  Battery, 
  Waves, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2,
  AlertCircle,
  Droplets,
  Activity 
} from 'lucide-react';
import { WaterTank } from '../types';

interface DashboardProps {
  tanks: WaterTank[];
  onSelectTank: (tank: WaterTank) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tanks, onSelectTank }) => {
  const getStatusStyle = (status: 'optimal' | 'warning' | 'critical') => {
    switch (status) {
      case 'optimal': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const getStatusIcon = (status: 'optimal' | 'warning' | 'critical') => {
    switch (status) {
      case 'optimal': return <CheckCircle2 className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertCircle className="w-5 h-5" />;
      default: return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  // Calculamos el estado de la alerta en base al valor del ica
  const calculateIcaStatus = (icaValue: number): 'optimal' | 'warning' | 'critical' => {
    if (icaValue >= 70) return 'optimal'; // Agua en buen estado
    if (icaValue >= 50) return 'warning'; // Agua regular (posible alerta)
    return 'critical';                    // Agua en mal estado
  };

  // Calculamos cuántos depósitos están en warning o critical en base a su ica actual
  const activeAlertsCount = tanks.filter(tank => {
    const dbData = tank.history && tank.history.length > 0 ? tank.history[0] : null;
    // Si viene como 'ica' o 'ica' desde el backend, ajusta el nombre aquí
    const currentIca = dbData ? (dbData.ica || 0) : (tank.lastReading.ica || tank.lastReading.ica || 0);
    return calculateIcaStatus(currentIca) !== 'optimal';
  }).length;

  if (!tanks || tanks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium text-lg">Conectando con InfluxDB...</p>
        <p className="text-slate-400 text-sm">Cargando histórico de calidad de agua</p>
      </div>
    );
  }

  return (
      <div className="space-y-6">
      {/* Stats Summary - AJUSTADO A 2 COLUMNAS COMO PEDISTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Depósitos</p>
            <p className="text-3xl font-bold text-slate-900">{tanks.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Droplets className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Alertas Activas</p>
            <p className="text-3xl font-bold text-slate-900">{activeAlertsCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800">Estado de los Depósitos</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tanks.map((tank) => {
          
          const dbData = tank.history && tank.history.length > 0 ? tank.history[0] : null;

          const rawIca = dbData 
            ? (dbData.ica ?? dbData.Ica ?? dbData.ICA ?? 0) 
            : (tank.lastReading.ica ?? tank.lastReading.Ica ?? tank.lastReading.ICA ?? 0);

          const safeIca = Number(rawIca);
          
          const currentReading = dbData ? {
            turbidity: dbData.turbidity,
            ph: dbData.ph,
            conductivity: dbData.conductivity,
            level: dbData.water_level,
            temperature: dbData.temperature,
            Ica: dbData.ica || 0, 
            timestamp: String(dbData.timestamp).length === 10 ? dbData.timestamp * 1000 : dbData.timestamp
          } : {
            turbidity: tank.lastReading.turbidity,
            ph: tank.lastReading.ph,
            conductivity: tank.lastReading.conductivity,
            level: tank.lastReading.level,
            temperature: tank.lastReading.temperature,
            Ica: tank.lastReading.Ica || tank.lastReading.ica || 0, // 🔥 Capturamos el Ica
            timestamp: String(tank.lastReading.timestamp).length === 10 ? tank.lastReading.timestamp * 1000 : tank.lastReading.timestamp
          };

          // 🔥 Obtenemos el estado dinámico para este depósito en concreto
          const dynamicStatus = calculateIcaStatus(currentReading.Ica);

          return (
            <div 
              key={tank.id} 
              onClick={() => onSelectTank(tank)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{tank.name}</h3>
                    <p className="text-sm text-slate-500">{tank.location.address}</p>
                  </div>
                  {/* 🔥 Aplicamos el estilo e icono dinámico basado en el Ica */}
                  <div className={`px-3 py-1 rounded-full border flex items-center space-x-1 text-xs font-semibold ${getStatusStyle(dynamicStatus)}`}>
                    {getStatusIcon(dynamicStatus)}
                    <span>{dynamicStatus.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* CAJA: Ica (NUEVA) */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                    <div className="flex items-center space-x-2 text-slate-500 mb-1">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold">ÍndIca ICA</span>
                    </div>
                    <p className={`text-lg font-bold ${dynamicStatus === 'critical' ? 'text-red-600' : dynamicStatus === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {currentReading.Ica.toFixed(1)}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-500 mb-1">
                      <Wind className="w-4 h-4" />
                      <span className="text-xs">Turbidez</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{currentReading.turbidity} NTU</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-500 mb-1">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xs">pH</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{currentReading.ph}</p>
                  </div>
                  
                  {/* CAJA: CONDUCTIVIDAD (Corregida la etiqueta y el icono) */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-500 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs">Conductividad</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{currentReading.conductivity} µS</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-500 mb-1">
                      <Waves className="w-4 h-4" />
                      <span className="text-xs">Nivel</span>
                    </div>
                    <div className="flex items-end space-x-2">
                      <p className="text-lg font-bold text-slate-900">{currentReading.level}%</p>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full mb-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all" 
                          style={{ width: `${currentReading.level}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-500 mb-1">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-xs">Temp.</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{currentReading.temperature}°C</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
              <span className="text-xs text-slate-400">
                  Última lectura: {new Date(currentReading.timestamp).toLocaleDateString('es-ES')} {new Date(currentReading.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
                <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                  Ver detalles <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;