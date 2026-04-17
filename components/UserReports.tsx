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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
 // 2. ENVIAR el reporte a la base de datos 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; 
    setIsSubmitting(true);    
    setErrorMessage(null); // Limpiamos errores previos al reintentar
  
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
        setShowModal(false);
        setNewReport({ ubicacion: '', userName: '', isAnonymous: false, type: 'color', description: '', lat: null, lng: null });
      } else {
        // --- AQUÍ CAPTURAMOS EL RECHAZO DEL TROLL ---
        try {
          const errorData = await response.json();
          // Si el backend nos mandó un motivo, lo mostramos
          if (errorData.motivo) {
            setErrorMessage(`Reporte rechazado: ${errorData.motivo}`);
          } else {
            setErrorMessage(errorData.error || "Error al guardar el reporte.");
          }
        } catch (parseError) {
          setErrorMessage("Error de conexión. Inténtalo de nuevo.");
        }
      }
    } catch (error) {
      console.error("Error enviando reporte:", error);
      setErrorMessage("Error de red al conectar con el servidor.");
    } finally {
      setIsSubmitting(false); 
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
    const yaVotado = votedReports.includes(report.id);
  
    // Actualización optimista: toggle en local
    if (yaVotado) {
      const nuevosVotos = votedReports.filter(id => id !== report.id);
      setVotedReports(nuevosVotos);
      localStorage.setItem('mis_votos', JSON.stringify(nuevosVotos));
      setReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, votes: Math.max((r.votes || 1) - 1, 0) } : r
      ));
    } else {
      const nuevosVotos = [...votedReports, report.id];
      setVotedReports(nuevosVotos);
      localStorage.setItem('mis_votos', JSON.stringify(nuevosVotos));
      setReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, votes: (r.votes || 1) + 1 } : r
      ));
    }
  
    try {
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
          currentVotes: report.votes || 1,
          accion: yaVotado ? 'restar' : 'sumar'  // ← nuevo campo
        })
      });
    } catch (error) {
      console.error("Error al votar:", error);
      // Si falla el servidor, revertimos el optimismo
      setReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, votes: report.votes } : r
      ));
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
      case 'color': return { text: 'Color anómalo', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' };
      case 'smell': return { text: 'Olor extraño', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' };
      case 'taste': return { text: 'Mal sabor', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' };
      case 'leak': return { text: 'Posible fuga', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
    }
  };

  return (
    // EL TRUCO ESTÁ AQUÍ ABAJO: Añadimos pb-28 (padding-bottom) para dar espacio al final de la página
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Reportes de la Comunidad</h2>
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full transition-colors">
          {filteredReports.length} activos
          </span>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </h3>
            <div className="space-y-4">
              
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar depósito..." 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              
              {/* Gravedad */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 transition-colors">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Gravedad</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showHighSeverity}
                      onChange={(e) => setShowHighSeverity(e.target.checked)}
                      className="rounded text-blue-600 dark:bg-slate-900 dark:border-slate-600" 
                    />
                    <span>Alta (Fugas)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showMediumSeverity}
                      onChange={(e) => setShowMediumSeverity(e.target.checked)}
                      className="rounded text-blue-600 dark:bg-slate-900 dark:border-slate-600" 
                    />
                    <span>Media (Color/Olor)</span>
                  </label>
                </div>
              </div>

              {/* Ordenación */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 transition-colors">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
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
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-colors ${
                    report.type === 'leak' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' 
                      : report.type === 'color' || report.type === 'smell'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                  }`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{report.userName}</h4>
                    <div className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(report.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${getReportTypeLabel(report.type).color}`}>
                  {getReportTypeLabel(report.type).text}
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed italic">
                "{report.description}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 transition-colors">
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 max-w-[50%]">
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
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 cursor-default' 
                            : 'bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-slate-200 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-500' 
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
                    className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline active:scale-95 transition-transform"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
              <h3 className="text-xl font-bold flex items-center dark:text-white">
                <AlertCircle className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                Registrar Incidencia
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <CheckCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tu Nombre</label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newReport.isAnonymous}
                      onChange={e => setNewReport({...newReport, isAnonymous: e.target.checked})}
                      className="rounded text-blue-600 dark:bg-slate-900 dark:border-slate-600 focus:ring-blue-500" 
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
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Ej: María Gómez"
                  />
                )}
              </div>

              {/* Ubicación Manual + Botón GPS */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ubicación del Problema</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    required
                    value={newReport.ubicacion}
                    onChange={e => setNewReport({...newReport, ubicacion: e.target.value})}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Ej: Depósito de San Andrés..."
                  />
                  <button
                    type="button"
                    onClick={capturarUbicacion}
                    className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors flex items-center justify-center shadow-sm"
                    title="Usar mi ubicación GPS actual"
                  >
                    <MapPin className="w-6 h-6" />
                  </button>
                </div>
                {newReport.lat && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-bold flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> 
                    Coordenadas GPS listas para el mapa
                  </p>
                )}
              </div>

              {/* Tipos de problema */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo de Problema</label>
                <div className="grid grid-cols-2 gap-3">
                  {['color', 'smell', 'taste', 'leak'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewReport({...newReport, type: type as any})}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        newReport.type === type 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md dark:shadow-none' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {getReportTypeLabel(type as any).text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Descripción (Opcional)</label>
                <textarea 
                  value={newReport.description}
                  onChange={e => setNewReport({...newReport, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 h-32 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="Detalla lo que has observado (opcional)..."
                />
              </div>

              <div className="pt-2">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Droplets className="w-5 h-5" />
                    <span>Enviar Reporte</span>
                  </>
                )}
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