import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, WaterTank } from '../types';

interface GeminiChatProps {
  tanks: WaterTank[];
}

// Sugerencias de preguntas para romper el hielo
const SUGGESTENCIAS = [
  "💧 ¿Cómo está la calidad del agua hoy?",
  "🌧️ ¿Afectaron las lluvias a la turbidez?",
  "⚠️ ¿Hay alguna alerta en los manantiales?"
];

const GeminiChat: React.FC<GeminiChatProps> = ({ tanks }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de AugaCalidade. Puedo ayudarte a analizar los datos de los manantiales, detectar anomalías por lluvias o responder dudas. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Modificamos handleSend para que acepte un texto opcional (para los botones)
  const handleSend = async (textoSugerido?: string) => {
    const textoAEnviar = textoSugerido || input;
    if (!textoAEnviar.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textoAEnviar.trim() }]);
    setIsLoading(true);

    try {
      const resumenDepositos = tanks.map(t => ({
        id: t.id,
        name: t.name, 
        status: t.status, 
        lastReading: t.lastReading 
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: textoAEnviar.trim(),
          contextoDepositos: resumenDepositos,
          historial: messages
        })
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.respuesta }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error de conexión con el servidor.' }]);
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
            <h3 className="font-bold">Asistente AugaCalidade</h3>
            <p className="text-xs text-blue-100 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" /> IA Monitorización de Manantiales
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-lg flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-white shadow-sm border'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-indigo-600" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm overflow-hidden ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800'
              }`}>
                {/* Aquí renderizamos Markdown en lugar de texto plano */}
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed space-y-2 [&>ul]:list-disc [&>ul]:pl-4 [&>strong]:font-bold [&>p]:mb-2">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="flex items-center space-x-2 bg-white p-4 rounded-2xl border shadow-sm">
               <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
               <span className="text-sm text-slate-500 italic">Analizando sensores...</span>
             </div>
           </div>
        )}
      </div>

      {/* Sugerencias y Input */}
      <div className="p-4 bg-white border-t">
        {/* Botones de sugerencias */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTENCIAS.map((sug, index) => (
              <button
                key={index}
                onClick={() => handleSend(sug)}
                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-colors flex items-center"
              >
                <MessageSquare className="w-3 h-3 mr-1" /> {sug}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre la calidad del agua..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiChat;