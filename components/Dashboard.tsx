
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
  // Fix: Added missing Droplets icon from lucide-react
  Droplets
} from 'lucide-react';
import { WaterTank } from '../types';

interface DashboardProps {
  tanks: WaterTank[];
  onSelectTank: (tank: WaterTank) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tanks, onSelectTank }) => {
  const getStatusStyle = (status: WaterTank['status']) => {
    switch (status) {
      case 'optimal': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusIcon = (status: WaterTank['status']) => {
    switch (status) {
      case 'optimal': return <CheckCircle2 className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <p className="text-3xl font-bold text-slate-900">{tanks.filter(t => t.status !== 'optimal').length}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Media Batería</p>
            <p className="text-3xl font-bold text-slate-900">
              {(tanks.reduce((acc, t) => acc + t.lastReading.battery, 0) / tanks.length).toFixed(1)}V
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Battery className="w-6 h-6" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800">Estado de los Depósitos</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tanks.map((tank) => (
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
                <div className={`px-3 py-1 rounded-full border flex items-center space-x-1 text-xs font-semibold ${getStatusStyle(tank.status)}`}>
                  {getStatusIcon(tank.status)}
                  <span>{tank.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs">Turbidez</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{tank.lastReading.turbidity} NTU</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Droplets className="w-4 h-4" />
                    <span className="text-xs">pH</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{tank.lastReading.ph}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Waves className="w-4 h-4" />
                    <span className="text-xs">Nivel</span>
                  </div>
                  <div className="flex items-end space-x-2">
                    <p className="text-lg font-bold text-slate-900">{tank.lastReading.level}%</p>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full mb-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all" 
                        style={{ width: `${tank.lastReading.level}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-xs">Temp.</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{tank.lastReading.temperature}°C</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
              <span className="text-xs text-slate-400">Última lectura: {new Date(tank.lastReading.timestamp).toLocaleTimeString()}</span>
              <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                Ver detalles <ArrowUpRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
