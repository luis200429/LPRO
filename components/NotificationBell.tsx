import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { WaterTank } from '../types';

interface Props {
  tanks: WaterTank[];
}

const NotificationBell: React.FC<Props> = ({ tanks }) => {
const [isOpen, setIsOpen] = useState(false);

// Filtramos los tanques que no están en estado 'optimal' para las notificaciones
const alerts = tanks.filter(t => t.status !== 'optimal');

const getStatusConfig = (status: string) => {
  if (status === 'critical') return { label: 'CRÍTICO', color: 'bg-red-100 text-red-700 border-red-200' };
  if (status === 'warning') return { label: 'PELIGRO', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: 'NORMAL', color: 'bg-green-100 text-green-700 border-green-200' };
};

  return (
    <div className="relative">
      {/* Botón de la Campana */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center border-2 border-white">
              {alerts.length}
            </span>
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <>
          {/* Capa invisible para cerrar al hacer clic fuera */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700">Alertas Activas</h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  ✅ Todo normal en las comunidades
                </div>
              ) : (
                alerts.map((tank) => {
                  const config = getStatusConfig(tank.status);
                  return (
                    <div key={tank.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800">{tank.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        ICA actual: <b>{tank.lastReading.ica.toFixed(1)}</b>
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;