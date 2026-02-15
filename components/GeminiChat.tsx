
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, WaterTank } from '../types';

interface GeminiChatProps {
  tanks: WaterTank[];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ tanks }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de AquaVigo. Puedo ayudarte a analizar los datos de los depósitos, detectar anomalías o responder dudas de los vecinos. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const model = 'gemini-3-flash-preview';

      const systemInstruction = `
        Eres un experto ingeniero hidráulico y asistente de comunicación para comunidades de aguas en Galicia.
        Contexto del sistema:
        - El sistema usa sensores NB-IoT para medir turbidez, pH, TDS, nivel y caudal.
        - El objetivo principal es detectar sedimentos post-incendio forestal.
        - Tienes acceso a los siguientes depósitos y sus datos actuales:
        ${JSON.stringify(tanks.map(t => ({ name: t.name, status: t.status, reading: t.lastReading })), null, 2)}

        Reglas:
        1. Sé profesional pero cercano (estilo gallego amable).
        2. Si se pregunta por un depósito específico, analiza sus niveles de turbidez.
        3. Si la turbidez es > 5 NTU, advierte que el agua puede no ser potable según normativa.
        4. Explica conceptos técnicos de forma sencilla (ej. qué es el pH o el TDS).
        5. Sugiere acciones de mantenimiento si ves valores anómalos.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const assistantContent = response.text || 'Lo siento, he tenido un problema procesando tu consulta.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error al conectar con el servidor de IA. Por favor, inténtalo de nuevo.' }]);
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
