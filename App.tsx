import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, Bell, MessageSquare, 
  AlertTriangle, Wifi
} from 'lucide-react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import GeminiChat from './components/GeminiChat';
import UserReports from './components/UserReports';
import TankDetails from './components/TankDetails';
import { WaterTank } from './types';
import { MOCK_TANKS } from './constants';

// Importamos el logo
import logo from './fotos/logo.png';

const BACKEND_URL = 'http://34.73.211.235:3000';

const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ahora la pestaña activa se calcula leyendo la URL
  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  const [tanks, setTanks] = useState<WaterTank[]>(MOCK_TANKS);
  const [isConnected, setIsConnected] = useState(false);

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
                
                // Ordenamos forzosamente de más reciente a más antiguo
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

  // FUNCIONES DE NAVEGACIÓN (En lugar de cambiar estados, cambian la URL)
  const handleSelectTank = (tank: WaterTank) => {
    navigate(`/tank/${tank.id}`);
  };

  const criticalCount = useMemo(() => tanks.filter(t => t.status === 'critical').length, [tanks]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'map', label: 'Mapa', icon: MapIcon, path: '/map' },
    { id: 'reports', label: 'Incidencias', icon: AlertTriangle, path: '/reports' },
    { id: 'chat', label: 'Asistente IA', icon: MessageSquare, path: '/chat' },
  ];

  // Componente interno para manejar la vista de detalles con parámetros de URL
  const TankDetailsWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const selectedTank = tanks.find(t => t.id === id);
    
    if (!selectedTank) return <div>Tanque no encontrado</div>;
    
    // 🔥 SOLUCIÓN APLICADA: Siempre volvemos al dashboard '/' en lugar de retroceder en el historial
    return <TankDetails tank={selectedTank} onBack={() => navigate('/')} />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm">
        {/* Aquí está el cambio del logo */}
        <div className="p-6 flex items-center justify-center">
          <img src={logo} alt="Logo AquaVigo" className="h-10 w-auto" />
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                (activeTab === item.id || (activeTab === '' && item.id === 'dashboard')) && !location.pathname.includes('/tank/')
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50'
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
             {location.pathname.includes('/tank/') 
                ? 'Detalles del Depósito' 
                : navItems.find(i => i.path === location.pathname || (location.pathname === '/' && i.id === 'dashboard'))?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-slate-500 cursor-pointer" />
              {criticalCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">{criticalCount}</span>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard tanks={tanks} onSelectTank={handleSelectTank} />} />
            <Route path="/map" element={<MapView tanks={tanks} onSelectTank={handleSelectTank} />} />
            <Route path="/chat" element={<GeminiChat tanks={tanks} />} />
            <Route path="/reports" element={<UserReports tanks={tanks} />} />
            <Route path="/tank/:id" element={<TankDetailsWrapper />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <MainApp />
    </Router>
  );
};

export default App;