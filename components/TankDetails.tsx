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
  'cm_rua': { id: '25aed498-36a7-4f8e-85ef-fe508318e804', slug: 'augacalidade-a-rua' },
  'cm_rua4': { id: 'adab9ddb-8ea0-4fed-8efd-3446d8eddc8a', slug: 'augacalidade-a-rua-4' }
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
  
 // const currentLevel = tank.lastReading?.level || tank.lastReading?.level || 0;
 const currentLevel = (tank.lastReading as any)?.water_level || 0;
  
  // 🔥 ICA LIMPIO Y SEGURO: Lo forzamos a Número y confiamos en 'ica'
  const currentIca = Number(tank.lastReading?.ica) || 0;
  
  // Lógica de colores para el ICA (ADAPTADA AL MODO OSCURO)
  let icaStyles = {
    caja: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400', 
    icono: 'text-emerald-600 dark:text-emerald-400'
  };

  if (currentIca < 50) {
    icaStyles = {
      caja: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400', 
      icono: 'text-red-600 dark:text-red-400'
    };
  } else if (currentIca < 70) {
    icaStyles = {
      caja: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50 text-amber-700 dark:text-amber-400', 
      icono: 'text-amber-600 dark:text-amber-400'
    };
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-28">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO: Información Actual */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-6 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tank.name}</h2>
            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{tank.location?.address || 'Ubicación desconocida'}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl font-bold text-blue-700 dark:text-blue-400 transition-colors">
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

              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-slate-700 dark:text-slate-300 transition-colors">
                <span className="flex items-center gap-2"><Gauge size={18} className="text-slate-400 dark:text-slate-500"/> Turbidez</span>
                <b className="dark:text-white">{tank.lastReading?.turbidity || 0} NTU</b>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-slate-700 dark:text-slate-300 transition-colors">
                <span className="flex items-center gap-2"><Activity size={18} className="text-slate-400 dark:text-slate-500"/> pH</span>
                <b className="dark:text-white">{tank.lastReading?.ph || 0}</b>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-slate-700 dark:text-slate-300 transition-colors">
                <span className="flex items-center gap-2"><Thermometer size={18} className="text-slate-400 dark:text-slate-500"/> Temperatura</span>
                <b className="dark:text-white">{tank.lastReading?.temperature || 0} °C</b>
              </div>
          
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Históricos de Grafana */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FILTRO DE FECHAS */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => setFilterMode('24h')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '24h' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
              Últimas 24h
            </button>
            <button onClick={() => setFilterMode('7d')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '7d' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
              Última semana
            </button>
            <button onClick={() => setFilterMode('30d')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === '30d' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
              Último mes
            </button>
            <button onClick={() => setFilterMode('custom')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
              Personalizado
            </button>
            </div>
            
            {filterMode === 'custom' && (
              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-4">
                {/* En modo oscuro, los inputs de fecha necesitan color-scheme: dark para que el iconito del calendario se vea blanco */}
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:[color-scheme:dark]" />
                <span className="text-slate-400 font-medium">a</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:[color-scheme:dark]" />
              </div>
            )}
          </div>

          {/* GRID DE GRÁFICAS */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* GRÁFICA 1: ICA (panel-13) */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
              <h3 className="p-4 font-bold text-slate-800 dark:text-white flex items-center">
                <Gauge className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" /> Histórico de ICA
              </h3>
              <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-13')} 
                  src={getGrafanaUrl('panel-13')} 
                  width="100%" height="100%" frameBorder="0" title="ICA">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* GRÁFICA 2: TURBIDEZ (panel-1) */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
              <h3 className="p-4 font-bold text-slate-800 dark:text-white flex items-center">
                <Gauge className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" /> Histórico de Turbidez
              </h3>
              <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-1')} 
                  src={getGrafanaUrl('panel-1')} 
                  width="100%" height="100%" frameBorder="0" title="Turbidez">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* GRÁFICA 3: pH (panel-2) */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
              <h3 className="p-4 font-bold text-slate-800 dark:text-white flex items-center">
                <Droplet className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400" /> Variación de pH
              </h3>
              <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-2')} 
                  src={getGrafanaUrl('panel-2')} 
                  width="100%" height="100%" frameBorder="0" title="pH">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* GRÁFICA 4: TEMPERATURA (panel-3) */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
              <h3 className="p-4 font-bold text-slate-800 dark:text-white flex items-center">
                <Thermometer className="w-5 h-5 mr-2 text-orange-500 dark:text-orange-400" /> Evolución de Temperatura
              </h3>
              <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-3')} 
                  src={getGrafanaUrl('panel-3')} 
                  width="100%" height="100%" frameBorder="0" title="Temperatura">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* GRÁFICA 5: CONDUCTIVIDAD/TDS (panel-4) */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
              <h3 className="p-4 font-bold text-slate-800 dark:text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400" /> Conductividad(TDS)
              </h3>
              <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden">
                <iframe 
                  key={getGrafanaUrl('panel-4')} 
                  src={getGrafanaUrl('panel-4')} 
                  width="100%" height="100%" frameBorder="0" title="Conductividad">
                </iframe>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* GRÁFICA 6: NIVEL DE AGUA */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
            <h3 className="p-4 font-bold text-slate-800 dark:text-white flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-cyan-500 dark:text-cyan-400" /> Histórico Nivel de Agua
            </h3>
            <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden">
              <iframe 
                key={getGrafanaUrl('14')} 
                src={getGrafanaUrl('14')} 
                width="100%" height="100%" frameBorder="0" title="Nivel de Agua">
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