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
      case 'optimal': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
      default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Conectando con InfluxDB...</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando histórico de calidad de agua</p>
      </div>
    );
  }

  return (
      <div className="space-y-6 pb-28">
        {/* Stats Summary - AJUSTADO A 2 COLUMNAS COMO PEDISTE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-transparent dark:border-slate-700 shadow-sm flex items-center space-x-4 transition-colors duration-300">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400">Total Depósitos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tanks.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-transparent dark:border-slate-700 shadow-sm flex items-center space-x-4 transition-colors duration-300">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400">Alertas Activas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeAlertsCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-transparent dark:border-slate-700 shadow-sm flex items-center space-x-4 transition-colors duration-300">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400">Óptimos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {tanks.filter(t => t.status === 'optimal').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-transparent dark:border-slate-700 shadow-sm flex items-center space-x-4 transition-colors duration-300">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400">Críticos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {tanks.filter(t => t.status === 'critical').length}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Estado de los Depósitos</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tanks.map((tank) => {
          
          const dbData = tank.history && tank.history.length > 0 ? tank.history[0] : null;

         // --- NUEVO CÁLCULO DE ICA A PRUEBA DE BALAS ---
         let bestIca = 0;

         if (tank.history && tank.history.length > 0) {
           // Busca hacia atrás en el historial la primera fila que tenga un ICA mayor que 0
           const rowWithIca = tank.history.find((row: any) => {
             const val = Number(row.ica || row.ica_value || row.ICA || row.Ica || 0);
             return !isNaN(val) && val > 0;
           });

           if (rowWithIca) {
             bestIca = Number(rowWithIca.ica);
           }
         }

         // Si el historial no tiene nada, miramos en los datos de último recurso
         if (bestIca === 0) {
           bestIca = Number(tank.lastReading?.ica || 0);
         }

         const safeIca = bestIca;
         // ----------------------------------------------
          
          const currentReading = dbData ? {
            turbidity: dbData.turbidity,
            ph: dbData.ph,
            conductivity: dbData.conductivity,
            level: dbData.water_level,
            temperature: dbData.temperature,
            Ica: dbData.ica || safeIca || 0, 
            timestamp: String(dbData.timestamp).length === 10 ? dbData.timestamp * 1000 : dbData.timestamp
          } : {
            turbidity: tank.lastReading.turbidity,
            ph: tank.lastReading.ph,
            conductivity: tank.lastReading.conductivity,
            level: tank.lastReading.level,
            temperature: tank.lastReading.temperature,
            Ica: tank.lastReading.ica || tank.lastReading.ica || safeIca || 0, // 🔥 Capturamos el Ica
            timestamp: String(tank.lastReading.timestamp).length === 10 ? Number(tank.lastReading.timestamp) * 1000 : tank.lastReading.timestamp
          };

          // 🔥 Obtenemos el estado dinámico para este depósito en concreto
          const dynamicStatus = calculateIcaStatus(currentReading.Ica);

          return (
            <div 
              key={tank.id} 
              onClick={() => onSelectTank(tank)}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all cursor-pointer duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tank.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{tank.location.address}</p>
                  </div>
                  {/* 🔥 Aplicamos el estilo e icono dinámico basado en el Ica */}
                  <div className={`px-3 py-1 rounded-full border flex items-center space-x-1 text-xs font-semibold ${getStatusStyle(dynamicStatus)}`}>
                    {getStatusIcon(dynamicStatus)}
                    <span>{dynamicStatus.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* 1. CAJA: ICA (Ocupa 2 en móvil, 1 en PC) */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl col-span-2 sm:col-span-1 transition-colors">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span className="text-xs font-bold">Índice ICA</span>
                    </div>
                    <p className={`text-lg font-bold ${dynamicStatus === 'critical' ? 'text-red-600 dark:text-red-400' : dynamicStatus === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {currentReading.Ica.toFixed(1)}
                    </p>
                  </div>

                  {/* 2. CAJA: TURBIDEZ */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Wind className="w-4 h-4" />
                      <span className="text-xs">Turbidez</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currentReading.turbidity} NTU</p>
                  </div>

                  {/* 3. CAJA: pH */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xs">pH</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currentReading.ph}</p>
                  </div>
                  
                  {/* 4. CAJA: CONDUCTIVIDAD */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs">Conductividad</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currentReading.conductivity} µS</p>
                  </div>

                  {/* 5. CAJA: TEMPERATURA (Movida aquí arriba para hacer pareja) */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-xs">Temp.</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currentReading.temperature}°C</p>
                  </div>

                  {/* 6. CAJA: NIVEL (Movida al final y con col-span-2 para ocupar todo el ancho en móvil) */}
                  <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Waves className="w-4 h-4" />
                      <span className="text-xs">Nivel</span>
                    </div>
                    <div className="flex items-end space-x-2">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{currentReading.level}%</p>
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mb-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 dark:bg-blue-400 transition-all" 
                          style={{ width: `${currentReading.level}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                </div>
              
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                  Última lectura: {new Date(currentReading.timestamp).toLocaleDateString('es-ES')} {new Date(currentReading.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
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