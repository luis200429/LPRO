import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, WaterTank } from '../types';

interface GeminiChatProps {
  tanks: WaterTank[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const SUGGESTENCIAS = [
  "💧 ¿Cómo está la calidad del agua hoy?",
  "🌧️ ¿Afectaron las lluvias a la turbidez?",
  "⚠️ ¿Hay alguna alerta en los manantiales?"
];

const GeminiChat: React.FC<GeminiChatProps> = ({ tanks, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. EL TRUCO DEFINITIVO: Bloquear el scroll de toda la página
  useEffect(() => {
    // Guardamos los estilos originales por si acaso
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Forzamos a que la ventana principal sea estática e inamovible
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Restauramos el scroll si el usuario cambia de pestaña
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // 2. Mantener el scroll ABAJO solo en la caja de mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    <div
      className="flex flex-col bg-white dark:bg-slate-900 overflow-hidden overscroll-none"
      style={{ height: 'calc(100dvh - 4rem)' }} 
    >
      {/* Header Local del Chat */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-blue-600 dark:bg-blue-800 text-white flex items-center justify-between flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-400 dark:bg-blue-600 p-2 rounded-xl transition-colors">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Asistente AugaCalidade</h3>
            <p className="text-xs text-blue-100 dark:text-blue-200 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" /> IA Monitorización de Manantiales
            </p>
          </div>
        </div>
      </div>

      {/* Caja de Mensajes (Esta es la ÚNICA parte que hace scroll gracias a flex-1 y overflow-y-auto) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                msg.role === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                  : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  : <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                }
              </div>
              <div className={`p-4 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed space-y-2 [&>ul]:list-disc [&>ul]:pl-4 [&>strong]:font-bold [&>p]:mb-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400 italic">Analizando sensores...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias e Input */}
      <div className="p-4 pb-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 transition-colors duration-300">
          {messages.length === 1 && !isLoading && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {SUGGESTENCIAS.map((sug, index) => (
              <button
                key={index}
                onClick={() => handleSend(sug)}
                className="text-xs bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 px-3 py-1.5 rounded-full transition-colors flex items-center flex-shrink-0"
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
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiChat;