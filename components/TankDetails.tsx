import React, { useState } from 'react';
import { ChevronLeft, MapPin, Activity, Zap, Gauge, Droplet, ExternalLink } from 'lucide-react';
import { WaterTank } from '../types';

interface TankDetailsProps {
  tank: WaterTank;
  onBack: () => void;
}

// ⚠️ ACTUALIZADO: Puerto 3000 y datos reales de tu dashboard
const GRAFANA_BASE_URL = 'http://34.73.211.235:3001'; 
const DASHBOARD_ID = 'ad9rthz'; 
const DASHBOARD_SLUG = 'augacalidade-zamans';

type FilterMode = '24h' | 'custom';

const TankDetails: React.FC<TankDetailsProps> = ({ tank, onBack }) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('24h');
  const todayDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayDate);
  const [endDate, setEndDate] = useState<string>(todayDate);

  // ⚠️ ACTUALIZADO: El panelId ahora es un string (ej: 'panel-1') y añadimos el parámetro SceneSolo
  const getGrafanaUrl = (panelId: string) => {
    let from = 'now-24h';
    let to = 'now';

    if (filterMode === 'custom') {
      from = new Date(`${startDate}T00:00:00Z`).getTime().toString();
      to = new Date(`${endDate}T23:59:59Z`).getTime().toString();
    }

    return `${GRAFANA_BASE_URL}/d-solo/${DASHBOARD_ID}/${DASHBOARD_SLUG}?orgId=1&from=${from}&to=${to}&timezone=browser&panelId=${panelId}&var-community=${tank.id}&__feature.dashboardSceneSolo=true`;
  };

  const currentLevel = tank.lastReading?.level || tank.lastReading?.water_level || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-blue-600 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Volver al listado
        </button>
        <a 
          href={`${GRAFANA_BASE_URL}/d/${DASHBOARD_ID}/${DASHBOARD_SLUG}?var-community=${tank.id}`} 
          target="_blank" 
          rel="noreferrer"
          className="text-xs flex items-center text-blue-600 font-bold hover:underline"
        >
          Abrir en Grafana Full <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{tank.name}</h2>
            <div className="flex items-center text-slate-500 mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{tank.location?.address || 'Ubicación desconocida'}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-blue-50 rounded-2xl font-bold text-blue-700">
                <span className="flex items-center gap-2"><Droplet size={18}/> Nivel Actual</span>
                <span>{currentLevel} %</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-2xl text-slate-700">
                <span className="flex items-center gap-2"><Gauge size={18} className="text-slate-400"/> Turbidez</span>
                <b>{tank.lastReading?.turbidity || 0} NTU</b>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-2xl text-slate-700">
                <span className="flex items-center gap-2"><Activity size={18} className="text-slate-400"/> pH</span>
                <b>{tank.lastReading?.ph || 0}</b>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-2xl text-slate-700">
                <span className="flex items-center gap-2"><Zap size={18} className="text-slate-400"/> Batería</span>
                <b>{tank.lastReading?.battery || 0} V</b>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Gráficas de Grafana embebidas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CONTROLES DE FECHA */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex space-x-2 w-full sm:w-auto">
              <button 
                onClick={() => setFilterMode('24h')} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '24h' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Últimas 24h
              </button>
              <button 
                onClick={() => setFilterMode('custom')} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Personalizado
              </button>
            </div>
            
            {filterMode === 'custom' && (
              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-4">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 border rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                <span className="text-slate-400 font-medium">a</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="bg-slate-50 border rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            )}
          </div>

          {/* GRÁFICA 1: TURBIDEZ (PanelId: 'panel-1') */}
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="p-4 font-bold text-slate-800 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-blue-500" /> Histórico de Turbidez
            </h3>
            <div className="h-[350px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
              <iframe 
                src={getGrafanaUrl('panel-1')}
                width="100%" 
                height="100%" 
                frameBorder="0"
                title="Gráfica Turbidez Grafana"
              ></iframe>
            </div>
          </div>

          {/* GRÁFICA 2: pH (PanelId: 'panel-2') */}
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="p-4 font-bold text-slate-800 flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-purple-500" /> Variación de pH
            </h3>
            <div className="h-[250px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
              <iframe 
                src={getGrafanaUrl('panel-2')} 
                width="100%" 
                height="100%" 
                frameBorder="0"
                title="Gráfica pH Grafana"
              ></iframe>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TankDetails;