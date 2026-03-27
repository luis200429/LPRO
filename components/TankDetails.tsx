import React, { useState } from 'react';
import { ChevronLeft, MapPin, Activity, Zap, Gauge, Droplet, ExternalLink, Thermometer } from 'lucide-react';
import { WaterTank } from '../types';

interface TankDetailsProps {
  tank: WaterTank;
  onBack: () => void;
}

// Configuración base de Grafana
const GRAFANA_BASE_URL = 'https://augacalidade.duckdns.org/grafana';
// Mapeo dinámico: Relacionamos el ID del tanque con su propio Dashboard en Grafana
const GRAFANA_DASHBOARDS: Record<string, { id: string, slug: string }> = {
  'cm_zamans': { id: 'ad9rthz', slug: 'augacalidade-zamans' },
  'cm_alba': { id: 'adw87hp', slug: 'augacalidade-alba' }, 
  'cm_vincios': { id: 'adqh2j2', slug: 'augacalidade-vincios' },
};

type FilterMode = '24h' | '7d' | '30d' | 'custom';

const TankDetails: React.FC<TankDetailsProps> = ({ tank, onBack }) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('24h');
  const todayDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayDate);
  const [endDate, setEndDate] = useState<string>(todayDate);

  // Obtenemos la info del dashboard para el tanque actual (o usamos Zamans por defecto si no existe)
  const dashboardInfo = GRAFANA_DASHBOARDS[tank.id] || GRAFANA_DASHBOARDS['cm_zamans'];

  const getGrafanaUrl = (panelId: string) => {
    let from = 'now-24h';
    let to = 'now';
    
    if (filterMode === '7d')    { from = 'now-7d'; }
    else if (filterMode === '30d')   { from = 'now-30d'; }
    else if (filterMode === 'custom') {
      from = new Date(`${startDate}T00:00:00Z`).getTime().toString();
      to   = new Date(`${endDate}T23:59:59Z`).getTime().toString();
    }

    // Usamos el ID y SLUG dinámicos sacados del mapeo para los iframes
    return `${GRAFANA_BASE_URL}/d-solo/${dashboardInfo.id}/${dashboardInfo.slug}?orgId=1&from=${from}&to=${to}&timezone=browser&lang=es&panelId=${panelId}&__feature.dashboardSceneSolo=true`;
  }
  
  const currentLevel = tank.lastReading?.level || tank.lastReading?.level || 0;

  // 🔥 ICA LIMPIO Y SEGURO: Lo forzamos a Número y confiamos en 'ica'
  const currentIca = Number(tank.lastReading?.ica) || 0;
  
  // Lógica de colores para el ICA
  let icaStyles = {
    caja: 'bg-emerald-50 border-emerald-100 text-emerald-700', 
    icono: 'text-emerald-600'
  };

  if (currentIca < 50) {
    icaStyles = {
      caja: 'bg-red-50 border-red-100 text-red-700', 
      icono: 'text-red-600'
    };
  } else if (currentIca < 70) {
    icaStyles = {
      caja: 'bg-amber-50 border-amber-100 text-amber-700', 
      icono: 'text-amber-600'
    };
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO: Información Actual */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{tank.name}</h2>
            <div className="flex items-center text-slate-500 mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{tank.location?.address || 'Ubicación desconocida'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-blue-50 rounded-2xl font-bold text-blue-700">
                <span className="flex items-center gap-2"><Droplet size={18}/> Nivel Actual</span>
                <span>{currentLevel} %</span>
              </div>
              
              {/* CAJA DEL ICA DINÁMICA */}
              <div className={`flex justify-between p-3 border rounded-2xl font-bold transition-colors ${icaStyles.caja}`}>
                <span className="flex items-center gap-2">
                  <Activity size={18} className={icaStyles.icono}/> Índice ICA
                </span>
                <span className="text-lg">{currentIca.toFixed(1)}</span>
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
                <span className="flex items-center gap-2"><Thermometer size={18} className="text-slate-400"/> Temperatura</span>
                <b>{tank.lastReading?.temperature || 0} °C</b>
              </div>
          
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Históricos de Grafana */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FILTRO DE FECHAS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex space-x-2 w-full sm:w-auto">
            <button onClick={() => setFilterMode('24h')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '24h' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Últimas 24h
            </button>
            <button onClick={() => setFilterMode('7d')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '7d' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Última semana
            </button>
            <button onClick={() => setFilterMode('30d')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '30d' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Último mes
            </button>
            <button onClick={() => setFilterMode('custom')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
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

          {/* GRID DE GRÁFICAS */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* GRÁFICA 1: ICA (panel-1) */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="p-4 font-bold text-slate-800 flex items-center">
                <Gauge className="w-5 h-5 mr-2 text-blue-500" /> Histórico de ICA
              </h3>
              <div className="h-[300px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-13')} 
                  src={getGrafanaUrl('panel-13')} 
                  width="100%" height="100%" frameBorder="0" title="ICA">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 my-1" />

            {/* GRÁFICA 1: TURBIDEZ (panel-1) */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="p-4 font-bold text-slate-800 flex items-center">
                <Gauge className="w-5 h-5 mr-2 text-blue-500" /> Histórico de Turbidez
              </h3>
              <div className="h-[300px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-1')} 
                  src={getGrafanaUrl('panel-1')} 
                  width="100%" height="100%" frameBorder="0" title="Turbidez">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 my-1" />

            {/* GRÁFICA 2: pH (panel-2) */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="p-4 font-bold text-slate-800 flex items-center">
                <Droplet className="w-5 h-5 mr-2 text-purple-500" /> Variación de pH
              </h3>
              <div className="h-[300px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-2')} 
                  src={getGrafanaUrl('panel-2')} 
                  width="100%" height="100%" frameBorder="0" title="pH">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 my-1" />

            {/* GRÁFICA 3: TEMPERATURA (panel-3) */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="p-4 font-bold text-slate-800 flex items-center">
                <Thermometer className="w-5 h-5 mr-2 text-orange-500" /> Evolución de Temperatura
              </h3>
              <div className="h-[300px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-3')} 
                  src={getGrafanaUrl('panel-3')} 
                  width="100%" height="100%" frameBorder="0" title="Temperatura">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 my-1" />

            {/* GRÁFICA 4: CONDUCTIVIDAD/TDS (panel-4) */}
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="p-4 font-bold text-slate-800 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" /> Conductividad y TDS
              </h3>
              <div className="h-[300px] w-full bg-slate-50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-4')} 
                  src={getGrafanaUrl('panel-4')} 
                  width="100%" height="100%" frameBorder="0" title="Conductividad">
                </iframe>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TankDetails;