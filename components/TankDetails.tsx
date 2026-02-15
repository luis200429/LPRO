
import React from 'react';
import { 
  ChevronLeft, 
  History, 
  MapPin, 
  Activity,
  Zap,
  Gauge,
  Droplet
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

const TankDetails: React.FC<TankDetailsProps> = ({ tank, onBack }) => {
  const chartData = tank.history.map(h => ({
    ...h,
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

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
        {/* Left Column: Info and Live Stats */}
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
                <span className="text-sm font-bold text-slate-700">{tank.lastReading.battery} V</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Gauge className="text-purple-500" />
                  <span className="text-sm font-medium">TDS (Conductividad)</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{tank.lastReading.tds} ppm</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Droplet className="text-cyan-500" />
                  <span className="text-sm font-medium">Caudal Actual</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{tank.lastReading.flow} L/min</span>
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

        {/* Right Column: Historical Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Turbidity Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800">Histórico de Turbidez (NTU)</h3>
              </div>
              <select className="bg-slate-50 border rounded-lg text-xs font-medium px-2 py-1 outline-none">
                <option>Últimas 24h</option>
                <option>Última semana</option>
              </select>
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

          {/* pH Chart */}
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
                  <Line type="monotone" dataKey="ph" stroke="#8b5cf6" strokeWidth={3} dot={false} />
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
