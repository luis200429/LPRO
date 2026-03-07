
import React, { useState, useEffect } from 'react';

import { 
  MessageCircle, 
  Clock, 
  MapPin, 
  Filter, 
  Plus, 
  AlertCircle,
  Droplets,
  Search,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';
import { WaterTank, UserReport } from '../types';
import { MOCK_REPORTS } from '../constants';

const BACKEND_URL = '';

interface UserReportsProps {
  tanks: WaterTank[];
}

const UserReports: React.FC<UserReportsProps> = ({ tanks }) => {
  // Empezamos con un array vacío en lugar de MOCK_REPORTS
  const [reports, setReports] = useState<UserReport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newReport, setNewReport] = useState({
    ubicacion: '', 
    userName: '',
    isAnonymous: false,
    type: 'color' as UserReport['type'],
    description: '',
    // Coordenadas (latitud y longitud)
    lat: null as number | null,
    lng: null as number | null
  });

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showHighSeverity, setShowHighSeverity] = useState(true);
  const [showMediumSeverity, setShowMediumSeverity] = useState(true);
  
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'votes'>('recent');
  
  // Memoria de votos locales para que un usuario solo pueda votar una vez al mismo depósito
  const [votedReports, setVotedReports] = useState<string[]>([]);

  // Cargar los votos guardados en el navegador al abrir la página
  useEffect(() => {
    const savedVotes = localStorage.getItem('mis_votos');
    if (savedVotes) {
      setVotedReports(JSON.parse(savedVotes));
    }
  }, []);


  // 1. CARGAR los reportes al abrir la pantalla
  useEffect(() => {
    const fetchReportes = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/reportes`);
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error("Error cargando reportes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportes();
  }, []);


  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewReport(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          // Si el texto estaba vacío, le ponemos un aviso visual
          ubicacion: prev.ubicacion ? prev.ubicacion : 'Ubicación GPS capturada'
        }));
      },
      (error) => {
        alert("No pudimos obtener tu ubicación. Comprueba los permisos de tu navegador o escríbela a mano.");
      }
    );
  };

  // 2. ENVIAR el reporte a la base de datos 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si marcó anónimo o dejó el nombre vacío, lo forzamos a Anónimo
    const finalUserName = newReport.isAnonymous || !newReport.userName.trim() 
      ? 'Usuario Anónimo' 
      : newReport.userName;

      const reportData = {
        tankId: newReport.ubicacion, 
        userName: finalUserName,
        description: newReport.description,
        type: newReport.type,
        lat: newReport.lat,  
        lng: newReport.lng   
      };

    try {
      const response = await fetch(`${BACKEND_URL}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        const nuevoReporteVisual: UserReport = {
          id: Date.now().toString(),
          tankId: reportData.tankId,
          userName: reportData.userName,
          description: reportData.description,
          type: reportData.type,
          timestamp: new Date().toISOString(),
          lat: reportData.lat,
          lng: reportData.lng
        };

        setReports(prevReports => [nuevoReporteVisual, ...prevReports]);
        
        // Limpiamos y cerramos
        setShowModal(false);
        setNewReport({ ubicacion: '', userName: '', isAnonymous: false, type: 'color', description: '' });
      } else {
        alert("Error al guardar el reporte");
      }
    } catch (error) {
      console.error("Error enviando reporte:", error);
      alert("Error de conexión al guardar el reporte");
    }
  };

  // 3. Borrar un reporte
  const handleResolve = async (id: string) => {
    // Lo quitamos de la pantalla instantáneamente
    setReports(prevReports => prevReports.filter(report => report.id !== id));

    try {
      // Hacemos la llamada al backend para que lo borre de la base de datos
      const response = await fetch(`${BACKEND_URL}/api/reportes/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Si por lo que sea falla el servidor, recargamos la lista para recuperar el reporte que quitamos
        console.error("El servidor falló al borrar, recargando datos...");
        const fetchResponse = await fetch(`${BACKEND_URL}/api/reportes`);
        const data = await fetchResponse.json();
        setReports(data);
        alert("Hubo un problema al resolver la incidencia. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error al borrar el reporte:", error);
    }
  };

  // Función que permita votar en los reportes
 const handleVote = async (report: UserReport) => {
  // 1. El Portero: Comprobamos si ya votó
  if (votedReports.includes(report.id)) {
    alert("Ya has validado esta incidencia anteriormente.");
    return;
  }

  // 2. Guardamos el voto en la memoria del navegador
  const nuevosVotosLocales = [...votedReports, report.id];
  setVotedReports(nuevosVotosLocales);
  localStorage.setItem('mis_votos', JSON.stringify(nuevosVotosLocales));

  // 3. Actualización optimista en pantalla
  setReports(prevReports => prevReports.map(r => 
    r.id === report.id ? { ...r, votes: (r.votes || 1) + 1 } : r
  ));

  try {
    // 4. Avisamos al backend
    await fetch(`${BACKEND_URL}/api/reportes/${encodeURIComponent(report.id)}/votar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tankId: report.tankId,
        type: report.type,
        userName: report.userName,
        description: report.description,
        lat: report.lat,
        lng: report.lng,
        currentVotes: report.votes || 1
      })
    });
  } catch (error) {
    console.error("Error al votar:", error);
  }
};

  // Lógica de filtrado y reordenación
  const filteredReports = reports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (report.tankId && report.tankId.toLowerCase().includes(searchLower)) ||
      (report.description && report.description.toLowerCase().includes(searchLower)) ||
      (report.userName && report.userName.toLowerCase().includes(searchLower));

    const isHigh = report.type === 'leak';
    const isMedium = ['color', 'smell', 'taste'].includes(report.type);
    const matchesSeverity = (showHighSeverity && isHigh) || (showMediumSeverity && isMedium);

    return matchesSearch && matchesSeverity;
  }).sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    if (sortBy === 'votes') return (b.votes || 1) - (a.votes || 1);
    return 0;
  });

  const getReportTypeLabel = (type: UserReport['type']) => {
    switch (type) {
      case 'color': return { text: 'Color anómalo', color: 'bg-orange-100 text-orange-700' };
      case 'smell': return { text: 'Olor extraño', color: 'bg-purple-100 text-purple-700' };
      case 'taste': return { text: 'Mal sabor', color: 'bg-blue-100 text-blue-700' };
      case 'leak': return { text: 'Posible fuga', color: 'bg-red-100 text-red-700' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-800">Reportes de la Comunidad</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {filteredReports.length} activos
          </span>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        {/* Filters */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </h3>
            <div className="space-y-4">
              
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar depósito..." 
                  className="w-full bg-slate-50 border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              {/* Gravedad */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gravedad</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showHighSeverity}
                      onChange={(e) => setShowHighSeverity(e.target.checked)}
                      className="rounded text-blue-600" 
                    />
                    <span>Alta (Fugas)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showMediumSeverity}
                      onChange={(e) => setShowMediumSeverity(e.target.checked)}
                      className="rounded text-blue-600" 
                    />
                    <span>Media (Color/Olor)</span>
                  </label>
                </div>
              </div>

              {/* 🔥 NUEVO: Desplegable de Ordenación */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="recent">Más recientes primero</option>
                  <option value="votes">Más relevantes (Votos)</option>
                  <option value="oldest">Más antiguos primero</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* List of reports */}
        <div className="md:col-span-3 space-y-4">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{report.userName}</h4>
                    <div className="flex items-center text-xs text-slate-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(report.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getReportTypeLabel(report.type).color}`}>
                  {getReportTypeLabel(report.type).text}
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-4 leading-relaxed italic">
                "{report.description}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="flex items-center text-xs text-slate-500 max-w-[50%]">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{report.tankId}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Botón de Votar */}
                  {(() => {
                    const yaVotado = votedReports.includes(report.id);
                    return (
                      <button 
                        onClick={() => handleVote(report)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors border active:scale-95 ${
                          yaVotado 
                            ? 'bg-blue-100 text-blue-700 border-blue-200 cursor-default' // Estilo si YA ha votado
                            : 'bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200' // Estilo normal
                        }`}
                        title={yaVotado ? "Ya has validado esto" : "Confirmar que yo también veo esto"}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${yaVotado ? 'fill-current' : ''}`} />
                        <span className="text-xs font-bold">{report.votes || 1}</span>
                      </button>
                    );
                  })()}

                  <button 
                    onClick={() => handleResolve(report.id)}
                    className="text-blue-600 text-xs font-bold hover:underline active:scale-95 transition-transform"
                  >
                    Marcar resuelto
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center">
                <AlertCircle className="w-6 h-6 mr-2 text-blue-600" />
                Registrar Incidencia Vecinal
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <CheckCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Nuevo: Nombre o Anónimo */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Tu Nombre</label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newReport.isAnonymous}
                      onChange={e => setNewReport({...newReport, isAnonymous: e.target.checked})}
                      className="rounded text-blue-600 focus:ring-blue-500" 
                    />
                    <span>Publicar como anónimo</span>
                  </label>
                </div>
                {!newReport.isAnonymous && (
                  <input 
                    type="text" 
                    required={!newReport.isAnonymous}
                    value={newReport.userName}
                    onChange={e => setNewReport({...newReport, userName: e.target.value})}
                    className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ej: María Gómez"
                  />
                )}
              </div>

              {/* Ubicación Manual + Botón GPS */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ubicación del Problema</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    required
                    value={newReport.ubicacion}
                    onChange={e => setNewReport({...newReport, ubicacion: e.target.value})}
                    className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ej: Depósito de San Andrés..."
                  />
                  <button
                    type="button"
                    onClick={capturarUbicacion}
                    className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center shadow-sm"
                    title="Usar mi ubicación GPS actual"
                  >
                    <MapPin className="w-6 h-6" />
                  </button>
                </div>
                {/* Feedback visual chulo si tenemos coordenadas */}
                {newReport.lat && (
                  <p className="text-xs text-emerald-600 mt-2 font-bold flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> 
                    Coordenadas GPS listas para el mapa
                  </p>
                )}
              </div>

              {/* Se mantienen los tipos de problema */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Problema</label>
                <div className="grid grid-cols-2 gap-3">
                  {['color', 'smell', 'taste', 'leak'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewReport({...newReport, type: type as any})}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        newReport.type === type 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {getReportTypeLabel(type as any).text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Se mantiene la descripción */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción (Opcional)</label>
                <textarea 
                  value={newReport.description}
                  onChange={e => setNewReport({...newReport, description: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 h-32 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Detalla lo que has observado (opcional)..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center space-x-2"
                >
                  <Droplets className="w-5 h-5" />
                  <span>Enviar Reporte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReports;
