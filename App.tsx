
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Bell, 
  MessageSquare, 
  AlertTriangle, 
  Settings, 
  Droplets,
  Menu,
  X,
  User
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import GeminiChat from './components/GeminiChat';
import UserReports from './components/UserReports';
import TankDetails from './components/TankDetails';
import { WaterTank } from './types';
import { MOCK_TANKS } from './constants';
import logoAuga from './fotos/logo.png'; // O la ruta donde guardes la imagen

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'chat' | 'reports'>('dashboard');
  const [selectedTank, setSelectedTank] = useState<WaterTank | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const criticalCount = useMemo(() => 
    MOCK_TANKS.filter(t => t.status === 'critical').length, 
  []);

  const renderContent = () => {
    if (selectedTank) {
      return <TankDetails tank={selectedTank} onBack={() => setSelectedTank(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tanks={MOCK_TANKS} onSelectTank={setSelectedTank} />;
      case 'map':
        return <MapView tanks={MOCK_TANKS} onSelectTank={setSelectedTank} />;
      case 'chat':
        return <GeminiChat tanks={MOCK_TANKS} />;
      case 'reports':
        return <UserReports tanks={MOCK_TANKS} />;
      default:
        return <Dashboard tanks={MOCK_TANKS} onSelectTank={setSelectedTank} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Mapa', icon: MapIcon },
    { id: 'reports', label: 'Incidencias', icon: AlertTriangle },
    { id: 'chat', label: 'Asistente IA', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm">
        
        {/* CAMBIO AQUÍ: Reemplazamos icono y texto por la imagen */}
        <div className="p-6 flex items-center justify-center">
          <img 
            src={logoAuga} 
            alt="Auga Calidade" 
            className="w-full h-auto max-h-16 object-contain" 
          />
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSelectedTank(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id && !selectedTank
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Comunidad de Montes</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 flex items-center justify-between px-4 h-16">
        
        {/* CAMBIO AQUÍ: Reemplazamos icono y texto 'AquaVigo' por la imagen */}
        <div className="flex items-center">
           <img 
            src={logoAuga} 
            alt="Auga Calidade" 
            className="h-10 w-auto object-contain" 
          />
        </div>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>
      
      {/* Mobile Nav Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6 pt-20" onClick={e => e.stopPropagation()}>
            <nav className="space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSelectedTank(null);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-16 md:pt-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">
            {selectedTank ? `Detalles: ${selectedTank.name}` : navItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-slate-500 cursor-pointer" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">
                  {criticalCount}
                </span>
              )}
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <button className="flex items-center space-x-2 text-sm text-slate-600 font-medium hover:text-blue-600 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Configuración</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
