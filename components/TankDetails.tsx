import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  History, 
  MapPin, 
  Activity,
  Zap,
  Gauge,
  Droplet,
  Calendar // Añadimos el icono del calendario
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { WaterTank } from '../types';

interface TankDetailsProps {
  tank: WaterTank;
  onBack: () => void;
}

// Tipo para controlar el modo de filtro
type FilterMode = '24h' | 'custom';

const TankDetails: React.FC<TankDetailsProps> = ({ tank, onBack }) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('24h');
  
  // Por defecto, las fechas personalizadas apuntan al día de hoy
  const todayDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayDate);
  const [endDate, setEndDate] = useState<string>(todayDate);

  const chartData = useMemo(() => {
    if (!tank.history) return [];

    const now = new Date().getTime();
    let startTime = 0;
    let endTime = now;

    // 1. Calculamos los rangos de tiempo según el modo
    if (filterMode === '24h') {
      startTime = now - (24 * 60 * 60 * 1000); // 24 horas atrás
      endTime = now;
    } else {
      // Modo personalizado
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Inicio del día
      startTime = start.getTime();

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Final del día
      endTime = end.getTime();
    }

    // 2. Filtramos, ordenamos y formateamos
    return [...tank.history]
      .filter((h: any) => {
        // Obtenemos el timestamp real
        const timeVal = String(h.timestamp).length === 10 ? h.timestamp * 1000 : h.timestamp;
        return timeVal >= startTime && timeVal <= endTime;
      })
      .sort((a: any, b: any) => {
        const timeA = String(a.timestamp).length === 10 ? a.timestamp * 1000 : a.timestamp;
        const timeB = String(b.timestamp).length === 10 ? b.timestamp * 1000 : b.timestamp;
        return timeA - timeB; // Ascendente
      })
      .map((h: any) => {
        const timeVal = String(h.timestamp).length === 10 ? h.timestamp * 1000 : h.timestamp;
        const dateObj = new Date(timeVal);
        
        // Calculamos cuántos días abarca el filtro para mostrar la fecha de forma óptima
        const durationDays = (endTime - startTime) / (1000 * 60 * 60 * 24);
        let timeString = '';
        
        if (durationDays <= 1) {
          // Si es un solo día o 24h, solo mostramos la hora
          timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          // Si son varios días, mostramos Día/Mes y la hora
          const day = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(dateObj);
          const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          timeString = `${day} ${time}`;
        }

        return {
          ...h,
          rawTime: timeVal,
          time: timeString
        };
      });
  }, [tank.history, filterMode, startDate, endDate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-600 hover:text-blue-600 font-medium transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Volver al listado
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL IZQUIERDO (Información del tanque) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{tank.name}</h2>
            <div className="flex items-center text-slate-500 mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{tank.location.address}</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Activity className="text-blue-500" />
                  <span className="text-sm font-medium">Estado Red</span>
                </div>
                <span className="text-sm font-bold text-emerald-600 flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  NB-IoT Conectado
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Zap className="text-amber-500" />
                  <span className="text-sm font-medium">Voltaje Batería</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{tank.lastReading?.battery || '0'} V</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Gauge className="text-purple-500" />
                  <span className="text-sm font-medium">TDS</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{tank.lastReading?.tds || '0'} ppm</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Droplet className="text-cyan-500" />
                  <span className="text-sm font-medium">Caudal</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{tank.lastReading?.flow || '0'} L/min</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-200">
            <h3 className="text-lg font-bold mb-4">Mantenimiento Predictivo</h3>
            <p className="text-blue-100 text-sm mb-4">
              Basado en los niveles de turbidez actuales y las previsiones de lluvia en la zona, 
              se recomienda una limpieza preventiva del filtro en las próximas 48 horas.
            </p>
            <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Generar Orden Trabajo
            </button>
          </div>
        </div>

        {/* PANEL DERECHO (Gráficas y Controles de Fecha) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* BARRA DE CONTROLES DE FECHA */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterMode('24h')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  filterMode === '24h' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Últimas 24h
              </button>
              <button
                onClick={() => setFilterMode('custom')}
                className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  filterMode === 'custom' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Personalizado
              </button>
            </div>

            {/* Selectores de fecha (solo se muestran si está en modo custom) */}
            {filterMode === 'custom' && (
              <div className="flex items-center space-x-2 animate-in slide-in-from-right-4 duration-300">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-slate-400 font-medium text-sm">a</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate} // Evita que la fecha de fin sea anterior a la de inicio
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Histórico de Turbidez (NTU)</h3>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTurb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="turbidity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTurb)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center space-x-2 mb-6">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800">Variación de pH</h3>
              </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} domain={[0, 14]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="ph" stroke="#8b5cf6" strokeWidth={3} dot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TankDetails;