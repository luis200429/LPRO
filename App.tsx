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
import { Link } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';

// Importamos el logo
import logo from './fotos/logo.png';

const BACKEND_URL = '';

const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ahora la pestaña activa se calcula leyendo la URL
  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  const [tanks, setTanks] = useState<WaterTank[]>([]);
    const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  // 1. Carga inicial masiva y ORDENADA de InfluxDB
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log('📡 Iniciando carga masiva de datos desde InfluxDB...');
      try {
        const updatedTanks = await Promise.all(
          MOCK_TANKS.map(async (tank) => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/historico/${tank.id}`);
              if (response.ok) {
                const historicoRaw = await response.json();
                
                // 🔥 EL TRUCO: InfluxDB nos manda '_time', lo traducimos a 'timestamp' para que React lo entienda
                const historico = historicoRaw.map((item: any) => ({
                  ...item,
                  timestamp: item._time || item.timestamp,
                  ica: item.ica || item.Ica || 0 
                }));

                // Ordenamos de más reciente a más antiguo
                const sortedHistorico = historico.sort((a: any, b: any) => {
                  const timeA = new Date(a.timestamp).getTime();
                  const timeB = new Date(b.timestamp).getTime();
                  return timeB - timeA; 
                });

                // 🔥 Sobrescribimos la 'lastReading' con el último dato real de la base de datos
                const lecturaMasReciente = sortedHistorico.length > 0 ? sortedHistorico[0] : tank.lastReading;

                // Calculamos el estado de alerta para que la tarjeta cargue del color correcto al refrescar
                let status: 'optimal' | 'warning' | 'critical' = 'optimal';
                if (lecturaMasReciente.ica < 50) status = 'critical';
                else if (lecturaMasReciente.ica < 70) status = 'warning';

                return { 
                  ...tank, 
                  status,
                  lastReading: lecturaMasReciente,
                  history: sortedHistorico 
                };
              }
            } catch (err) {
              console.error(`❌ Error cargando el tanque ${tank.id}:`, err);
            }
            return tank;
          })
        );
        
        setTanks(updatedTanks);
        setIsLoading(false);
        console.log('✅ Carga inicial completada con éxito');
      } catch (error) {
        console.error('❌ Error global en la carga inicial:', error);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Conexión Socket.io para Tiempo Real (Corregido)
  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      console.log('✅ Conectado al Backend por Socket en:', BACKEND_URL);
      setIsConnected(true);
    });

    // Escuchamos el evento exacto que emite tu backend ('actualizacion_sensores')
    socket.on('actualizacion_sensores', (mensaje) => {
      const { comunidad, datos } = mensaje;
      console.log('📥 Nuevo dato en tiempo real para:', comunidad, datos);

      setTanks(currentTanks => currentTanks.map(tank => {
        if (tank.id === comunidad) {
          
          // Calculamos el estado de alerta general (puedes ajustar esta lógica a tu gusto)
          let status: 'optimal' | 'warning' | 'critical' = 'optimal';
          if (datos.ica >= 70) status = 'optimal';
          else if (datos.ica >= 50 && datos.ica <70) status = 'warning';
          else status = 'critical';

          // Preparamos la nueva lectura mapeando correctamente el ICA
          const newReading = { 
            ...datos, 
            ica: datos.ica || 0, // Aseguramos que la variable ica exista
            timestamp: datos.timestamp 
          };

          return {
            ...tank,
            status,
            lastReading: newReading,
            // Añadimos el nuevo dato al principio del historial para que las gráficas y el Dashboard lo pillen
            history: [newReading, ...(tank.history || [])]
          };
        }
        return tank;
      }));
    });

    socket.on('disconnect', () => {
      console.warn('❌ Desconectado del servidor WebSockets');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Error de conexión Socket:', err.message);
      setIsConnected(false);
    });

    return () => { socket.disconnect(); };
  }, []);

  // FUNCIONES DE NAVEGACIÓN
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

  // Componente interno para manejar la vista de detalles
  const TankDetailsWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const selectedTank = tanks.find(t => t.id === id);
    
    if (!selectedTank) return <div className="p-8 text-center text-slate-500">Tanque no encontrado</div>;
    
    return <TankDetails tank={selectedTank} onBack={() => navigate('/')} />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm">
        {/* 1. Eliminamos el div p-6 y lo metemos dentro del Link para que todo sea clickable */}
        <div className="p-6 flex items-center justify-center">
        <Link 
          to="/" 
          className="relative group flex items-center justify-center w-full h-full p-2 hover:opacity-80 active:scale-95 transition-all"
          style={{ display: 'inline-flex', minWidth: '150px' }} // Asegura un ancho mínimo para el clic
        >
          {/* Imagen del logo */}
          <img 
            src={logo} 
            alt="AugaCalidade" 
            className="h-12 w-auto object-contain pointer-events-none" 
          />
          
          {/* Capa invisible encima para capturar el clic en toda la zona */}
          <div className="absolute inset-0 z-10 cursor-pointer"></div>
        </Link>
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
            {/* Pasamos el array de tanks que ya tienes en el estado de App.tsx */}
            <NotificationBell tanks={tanks} />
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