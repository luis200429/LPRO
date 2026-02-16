import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, Bell, MessageSquare, 
  AlertTriangle, Droplets, Wifi
} from 'lucide-react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import GeminiChat from './components/GeminiChat';
import UserReports from './components/UserReports';
import TankDetails from './components/TankDetails';
import { WaterTank } from './types';
import { MOCK_TANKS } from './constants';

const BACKEND_URL = 'http://34.73.211.235:3000';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'chat' | 'reports'>('dashboard');
  const [tanks, setTanks] = useState<WaterTank[]>(MOCK_TANKS);
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const selectedTank = useMemo(() => 
    tanks.find(t => t.id === selectedTankId) || null, 
  [tanks, selectedTankId]);

  // Carga inicial masiva y ORDENADA de InfluxDB
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log('📡 Iniciando carga masiva de datos desde InfluxDB...');
      try {
        const updatedTanks = await Promise.all(
          MOCK_TANKS.map(async (tank) => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/historico/${tank.id}`);
              if (response.ok) {
                const historico = await response.json();
                
                // 🔥 Ordenamos forzosamente de más reciente a más antiguo
                const sortedHistorico = historico.sort((a: any, b: any) => {
                  const timeA = String(a.timestamp).length === 10 ? a.timestamp * 1000 : a.timestamp;
                  const timeB = String(b.timestamp).length === 10 ? b.timestamp * 1000 : b.timestamp;
                  return timeB - timeA; // Descendente (el más nuevo en [0])
                });

                return { ...tank, history: sortedHistorico };
              }
            } catch (err) {
              console.error(`❌ Error cargando el tanque ${tank.id}:`, err);
            }
            return tank;
          })
        );
        
        setTanks(updatedTanks);
        console.log('✅ Carga inicial completada con éxito');
      } catch (error) {
        console.error('❌ Error global en la carga inicial:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Conexión Socket.io para Tiempo Real
  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      console.log('✅ Conectado al Backend por Socket en:', BACKEND_URL);
      setIsConnected(true);
    });

    socket.on('actualizacion_sensores', (data: { comunidad: string, datos: any, timestamp: string }) => {
      setTanks(currentTanks => currentTanks.map(tank => {
        if (tank.id === data.comunidad) {
          
          let status: 'optimal' | 'warning' | 'critical' = 'optimal';
          if (data.datos.turbidity > 10) status = 'critical';
          else if (data.datos.turbidity > 5) status = 'warning';

          const newReading = { ...data.datos, timestamp: data.timestamp };

          return {
            ...tank,
            status,
            lastReading: newReading,
            history: tank.history 
          };
        }
        return tank;
      }));
    });

    socket.on('disconnect', () => {
      console.warn('❌ Desconectado del servidor');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Error de conexión Socket:', err.message);
      setIsConnected(false);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleSelectTank = (tank: WaterTank) => {
    setSelectedTankId(tank.id);
  };

  const criticalCount = useMemo(() => tanks.filter(t => t.status === 'critical').length, [tanks]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Mapa', icon: MapIcon },
    { id: 'reports', label: 'Incidencias', icon: AlertTriangle },
    { id: 'chat', label: 'Asistente IA', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm">
        <div className="p-6 flex items-center space-x-2">
          <Droplets className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            AquaVigo
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSelectedTankId(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id && !selectedTank ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isConnected ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
            <Wifi className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
            <span>{isConnected ? 'SISTEMA EN VIVO' : 'CONEXIÓN FALLIDA'}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            {selectedTank ? `Detalles: ${selectedTank.name}` : navItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-slate-500 cursor-pointer" />
              {criticalCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">{criticalCount}</span>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {selectedTank ? (
            <TankDetails 
              tank={selectedTank} 
              onBack={() => setSelectedTankId(null)} 
            />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard tanks={tanks} onSelectTank={handleSelectTank} />}
              {activeTab === 'map' && <MapView tanks={tanks} onSelectTank={handleSelectTank} />}
              {activeTab === 'chat' && <GeminiChat tanks={tanks} />}
              {activeTab === 'reports' && <UserReports tanks={tanks} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;