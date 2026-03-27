import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, MessageSquare, 
  AlertTriangle, Wifi, Menu, X
} from 'lucide-react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import GeminiChat from './components/GeminiChat';
import UserReports from './components/UserReports';
import TankDetails from './components/TankDetails';
import { MOCK_TANKS } from './constants';
import { WaterTank, ChatMessage } from './types';
import NotificationBell from './components/NotificationBell';

import logo from './fotos/logo.png';

const BACKEND_URL = '';

// ── TankDetailsWrapper FUERA de MainApp para no violar las reglas de hooks ──
interface TankDetailsWrapperProps {
  tanks: WaterTank[];
  onBack: () => void;
}

const TankDetailsWrapper: React.FC<TankDetailsWrapperProps> = ({ tanks, onBack }) => {
  const { id } = useParams<{ id: string }>();
  const selectedTank = tanks.find(t => t.id === id);
  if (!selectedTank) return <div className="p-8 text-center text-slate-500">Tanque no encontrado</div>;
  return <TankDetails tank={selectedTank} onBack={onBack} />;
};

// ── Componente principal ─────────────────────────────────────────────────────
const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de AugaCalidade. Puedo ayudarte a analizar los datos de los manantiales, detectar anomalías por lluvias o responder dudas. ¿En qué puedo ayudarte hoy?' }
  ]);  
  const [tanks, setTanks] = useState<WaterTank[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

                const historico = historicoRaw.map((item: any) => ({
                  ...item,
                  timestamp: item._time || item.timestamp,
                  ica: item.ica || item.Ica || 0
                }));

                const sortedHistorico = historico.sort((a: any, b: any) => {
                  const timeA = new Date(a.timestamp).getTime();
                  const timeB = new Date(b.timestamp).getTime();
                  return timeB - timeA;
                });

                const lecturaMasReciente = sortedHistorico.length > 0 ? sortedHistorico[0] : tank.lastReading;

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

  // 2. Conexión Socket.io para Tiempo Real
  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      console.log('✅ Conectado al Backend por Socket en:', BACKEND_URL);
      setIsConnected(true);
    });

    socket.on('actualizacion_sensores', (mensaje) => {
      const { comunidad, datos } = mensaje;
      console.log('📥 Nuevo dato en tiempo real para:', comunidad, datos);

      setTanks(currentTanks => currentTanks.map(tank => {
        if (tank.id === comunidad) {
          let status: 'optimal' | 'warning' | 'critical' = 'optimal';
          if (datos.ica >= 70) status = 'optimal';
          else if (datos.ica >= 50 && datos.ica < 70) status = 'warning';
          else status = 'critical';

          const newReading = {
            ...datos,
            ica: datos.ica || 0,
            timestamp: datos.timestamp
          };

          return {
            ...tank,
            status,
            lastReading: newReading,
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

  // 3. Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSelectTank = (tank: WaterTank) => {
    navigate(`/tank/${tank.id}`);
  };

  const criticalCount = useMemo(() => tanks.filter(t => t.status === 'critical').length, [tanks]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard, path: '/'        },
    { id: 'map',       label: 'Mapa',         icon: MapIcon,         path: '/map'     },
    { id: 'reports',   label: 'Incidencias',  icon: AlertTriangle,   path: '/reports' },
    { id: 'chat',      label: 'Asistente IA', icon: MessageSquare,   path: '/chat'    },
  ];

  const currentPageLabel = location.pathname.includes('/tank/')
    ? 'Detalles del Depósito'
    : navItems.find(i =>
        i.path === location.pathname ||
        (location.pathname === '/' && i.id === 'dashboard')
      )?.label || 'Dashboard';

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="relative h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm z-30 flex-shrink-0">

        {/* IZQUIERDA: logo + separador + título página */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center hover:opacity-80 active:scale-95 transition-all">
            <img src={logo} alt="AugaCalidade" className="h-9 w-auto object-contain" />
          </Link>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <span className="hidden sm:block text-sm font-semibold text-slate-600">
            {currentPageLabel}
          </span>
        </div>

        {/* CENTRO: nav horizontal (solo desktop) */}
        <nav className="hidden md:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (location.pathname === '/' && item.id === 'dashboard');
            const active = isActive && !location.pathname.includes('/tank/');
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* DERECHA: estado conexión + campana + hamburguesa */}
        <div className="flex items-center space-x-2">

          {/* Estado conexión — solo desktop */}
          <div className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            isConnected ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
            <span>{isConnected ? 'EN VIVO' : 'DESCONECTADO'}</span>
          </div>

          {/* Campana */}
          <NotificationBell tanks={tanks} />

          {/* Hamburguesa — solo mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Menú"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── MENÚ DESPLEGABLE MOBILE ── */}
        {menuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Panel */}
            <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-100 shadow-2xl z-50 px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (location.pathname === '/' && item.id === 'dashboard');
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.path); setMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive && !location.pathname.includes('/tank/')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Estado conexión en mobile */}
              <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold mt-1 ${
                isConnected ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
              }`}>
                <Wifi className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
                <span>{isConnected ? 'SISTEMA EN VIVO' : 'CONEXIÓN FALLIDA'}</span>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── CONTENIDO ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Routes>
          <Route path="/"         element={<Dashboard   tanks={tanks} onSelectTank={handleSelectTank} />} />
          <Route path="/map"      element={<MapView     tanks={tanks} onSelectTank={handleSelectTank} />} />
          <Route path="/chat" element={<GeminiChat tanks={tanks} messages={chatMessages} setMessages={setChatMessages} />} />
          <Route path="/reports"  element={<UserReports tanks={tanks} />} />
          <Route path="/tank/:id" element={<TankDetailsWrapper tanks={tanks} onBack={() => navigate('/')} />} />
        </Routes>
      </main>

    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <MainApp />
  </Router>
);

export default App;