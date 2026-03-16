import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage, WaterTank } from '../types';

interface GeminiChatProps {
  tanks: WaterTank[];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ tanks }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de AugaCalidade. Puedo ayudarte a analizar los datos de los depósitos, detectar anomalías o responder dudas de los vecinos. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hacia abajo cuando hay mensajes nuevos
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // 1. "Adelgazamos" los datos: Solo enviamos la foto actual, nada de históricos gigantes
      const resumenDepositos = tanks.map(t => ({
        name: t.name, 
        status: t.status, 
        lastReading: t.lastReading 
      }));

      // 2. Llamada segura a nuestro propio backend con los datos filtrados
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: userMessage,
          contextoDepositos: resumenDepositos
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      
      // Opcional: Ver en consola la "magia" de los ítems detectados
      console.log("🧠 Análisis de la IA:", data.items);
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.respuesta }]);
    } catch (error) {
      console.error('Error llamando al backend:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error de conexión con el servidor. Por favor, inténtalo de nuevo más tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-400 p-2 rounded-xl">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Asistente Técnico IA</h3>
            <p className="text-xs text-blue-100 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" /> Analizando datos en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50"
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-lg flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-white shadow-sm border'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-indigo-600" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border text-slate-800'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl border shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500 italic">Analizando telemetría...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe una pregunta sobre los depósitos..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          El asistente puede cometer errores. Verifica siempre los datos críticos manualmente.
        </p>
      </div>
    </div>
  );
};

export default GeminiChat;