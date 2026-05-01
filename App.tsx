import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Map as MapIcon, MessageSquare,
  AlertTriangle, Wifi, Menu, X, Sun, Moon
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
import logoDark from './fotos/logo-dark.png'; 

const BACKEND_URL = 'http://localhost:3002'

// ── TankDetailsWrapper fuera de MainApp ──────────────────────────────────────
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

// ── Componente principal ──────────────────────────────────────────────────────
const MainApp: React.FC = () => {
  const navigate    = useNavigate();
  const location    = useLocation();

  // ── Estado — todos los useState JUNTOS y PRIMERO ──────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de AugaCalidade. Puedo ayudarte a analizar los datos de los manantiales, detectar anomalías por lluvias o responder dudas. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [tanks,       setTanks]       = useState<WaterTank[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);
  const [menuOpen,    setMenuOpen]    = useState(false);

  // 1. Inicializamos leyendo la memoria del navegador. Si dice 'dark', arranca en oscuro.
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // 2. Cada vez que cambias el modo, aplicamos la clase y guardamos la elección
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Guardamos la preferencia
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Guardamos la preferencia
    }
  }, [isDark]);

  // Carga inicial de InfluxDB
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const updatedTanks = await Promise.all(
          MOCK_TANKS.map(async (tank) => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/historico/${tank.id}`);
              
              if (response.ok) {
                const historicoRaw = await response.json();
                
                if (historicoRaw.length > 0) {
                  const historico = historicoRaw
                  .filter((item: any) => item.ph !== undefined || item.turbidity !== undefined)
                  .map((item: any) => ({
                    ...item,
                    timestamp: item._time || item.timestamp,
                    ica: item.ica || item.ica_value || item.Ica || 0
                  }));
                  
                  const sortedHistorico = historico.sort((a: any, b: any) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  
                  // Usamos SIEMPRE el real de la BD
                  const lecturaMasReciente = sortedHistorico[0]; 
                  
                  let status: 'optimal' | 'warning' | 'critical' = 'optimal';
                  if (lecturaMasReciente.ica < 50) status = 'critical';
                  else if (lecturaMasReciente.ica < 70) status = 'warning';
                  
                  return { ...tank, status, lastReading: lecturaMasReciente, history: sortedHistorico };
                } else {
                  // Si la BD está vacía, mostramos todo a 0 para no confundir con MOCKS
                  console.warn(`⚠️ Sin datos en InfluxDB para ${tank.id}.`);
                  const zeroReading = { turbidity: 0, ph: 0, conductivity: 0, level: 0, temperature: 0, ica: 0, timestamp: Date.now() };
                  return { ...tank, status: 'critical', lastReading: zeroReading, history: [] };
                }
              } else {
                console.error(`Error HTTP ${response.status} en tanque ${tank.id}`);
              }
            } catch (err) {
              console.error(`❌ Error de RED cargando el tanque ${tank.id}:`, err);
            }
            
            // Si todo falla dramáticamente, devolvemos el tanque con ceros para evidenciar el error de red
            const errorReading = { turbidity: 0, ph: 0, conductivity: 0, level: 0, temperature: 0, ica: 0, timestamp: Date.now() };
            return { ...tank, status: 'critical', lastReading: errorReading, history: [] };
          })
        );
        setTanks(updatedTanks as WaterTank[]);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error global en la carga inicial:', error);
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  

  // Socket.io tiempo real
  useEffect(() => {
    const socket = io(BACKEND_URL);
    socket.on('connect', () => setIsConnected(true));
    socket.on('actualizacion_sensores', (mensaje) => {
      const { comunidad, datos } = mensaje;
      setTanks(current => current.map(tank => {
        if (tank.id !== comunidad) return tank;
        let status: 'optimal' | 'warning' | 'critical' = 'optimal';
        if (datos.ica >= 70) status = 'optimal';
        else if (datos.ica >= 50) status = 'warning';
        else status = 'critical';
        const newReading = { ...datos, ica: datos.ica || 0 };
        return { ...tank, status, lastReading: newReading, history: [newReading, ...(tank.history || [])] };
      }));
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));
    return () => { socket.disconnect(); };
  }, []);

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleSelectTank = (tank: WaterTank) => navigate(`/tank/${tank.id}`);
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          HEADER — grid de 3 columnas: logo | nav | acciones
      ═══════════════════════════════════════════════════════ */}
        <header className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 md:px-10 grid grid-cols-2 md:grid-cols-3 items-center shadow-sm z-30 flex-shrink-0">  
        {/* COL 1 — Logo + título */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center hover:opacity-80 active:scale-95 transition-all">
            {/* 2. Muestra el logo claro y ocúltalo en modo oscuro */}
            <img 
              src={logo} 
              alt="AugaCalidade" 
              className="h-11 w-auto object-contain dark:hidden" 
            />
            
            {/* 3. Muestra el logo oscuro solo en modo oscuro */}
            <img 
              src={logoDark} 
              alt="AugaCalidade" 
              className="h-11 w-auto object-contain hidden dark:block" 
            />
          </Link>
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-600" />
          <span className="hidden sm:block text-lg font-semibold text-slate-600 dark:text-slate-300">
            {currentPageLabel}
          </span>
        </div>

        {/* COL 2 — Nav centrada (solo desktop) */}
        <nav className="hidden md:flex items-center justify-center space-x-1">
          {navItems.map((item) => {
            const active =
              (location.pathname === item.path ||
               (location.pathname === '/' && item.id === 'dashboard')) &&
              !location.pathname.includes('/tank/');
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-base font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* COL 3 — Toggle + EN VIVO + campana + hamburguesa */}
        <div className="flex items-center justify-end space-x-3">

          {/* Toggle claro/oscuro */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-full">
            <button
              onClick={() => setIsDark(false)}
              title="Modo claro"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                !isDark ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDark(true)}
              title="Modo oscuro"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'bg-slate-600 shadow-sm text-blue-400' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* EN VIVO — solo desktop */}
          <div className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg text-base font-bold transition-colors ${
            isConnected
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
              : 'text-red-600 bg-red-50 dark:bg-red-900/30'
          }`}>
            <Wifi className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
            <span>{isConnected ? 'EN VIVO' : 'DESCONECTADO'}</span>
          </div>

          {/* Campana */}
          <NotificationBell tanks={tanks} />

          {/* Hamburguesa — solo mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Menú"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          MENÚ DESPLEGABLE MOBILE
      ═══════════════════════════════════════════════ */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 top-20 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-20 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-2xl z-50 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const active =
                (location.pathname === item.path ||
                 (location.pathname === '/' && item.id === 'dashboard')) &&
                !location.pathname.includes('/tank/');
              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Toggle en mobile */}
            <div className="flex items-center space-x-2 px-4 py-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Tema:</span>
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-full">
                <button
                  onClick={() => setIsDark(false)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    !isDark ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsDark(true)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isDark ? 'bg-slate-600 shadow-sm text-blue-400' : 'text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Estado conexión mobile */}
            <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold ${
              isConnected ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
            }`}>
              <Wifi className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
              <span>{isConnected ? 'SISTEMA EN VIVO' : 'CONEXIÓN FALLIDA'}</span>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ═══════════════════════════════════════════════ */}
      <main className={`flex-1 overflow-y-auto overscroll-y-contain ${
        location.pathname === '/chat' ? 'p-0' : 'p-4 md:p-8'
      }`}>
        <Routes>
          <Route path="/"         element={<Dashboard   tanks={tanks} onSelectTank={handleSelectTank} />} />
          <Route path="/map"      element={<MapView     tanks={tanks} onSelectTank={handleSelectTank} />} />
          <Route path="/chat"     element={<GeminiChat  tanks={tanks} messages={chatMessages} setMessages={setChatMessages} />} />
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