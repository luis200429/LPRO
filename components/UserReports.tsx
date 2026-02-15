
import React, { useState } from 'react';
import { 
  MessageCircle, 
  Clock, 
  MapPin, 
  Filter, 
  Plus, 
  AlertCircle,
  Droplets,
  Search,
  CheckCircle
} from 'lucide-react';
import { WaterTank, UserReport } from '../types';
import { MOCK_REPORTS } from '../constants';

interface UserReportsProps {
  tanks: WaterTank[];
}

const UserReports: React.FC<UserReportsProps> = ({ tanks }) => {
  const [reports, setReports] = useState<UserReport[]>(MOCK_REPORTS);
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({
    tankId: tanks[0]?.id || '',
    type: 'color' as UserReport['type'],
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report: UserReport = {
      id: Math.random().toString(36).substr(2, 9),
      tankId: newReport.tankId,
      userName: 'Usuario Anónimo',
      description: newReport.description,
      type: newReport.type,
      timestamp: new Date().toISOString()
    };
    setReports([report, ...reports]);
    setShowModal(false);
    setNewReport({ tankId: tanks[0].id, type: 'color', description: '' });
  };

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
            {reports.length} activos
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
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar depósito..." 
                  className="w-full bg-slate-50 border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gravedad</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                    <span>Alta (Fugas)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                    <span>Media (Color/Olor)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List of reports */}
        <div className="md:col-span-3 space-y-4">
          {reports.map((report) => (
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

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-xs text-slate-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  {tanks.find(t => t.id === report.tankId)?.name}
                </div>
                <button className="text-blue-600 text-xs font-bold hover:underline">
                  Marcar como resuelto
                </button>
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
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Depósito Afectado</label>
                <select 
                  value={newReport.tankId}
                  onChange={e => setNewReport({...newReport, tankId: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
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
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                <textarea 
                  required
                  value={newReport.description}
                  onChange={e => setNewReport({...newReport, description: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 h-32 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalla lo que has observado en el suministro..."
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
