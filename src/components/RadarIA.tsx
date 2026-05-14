import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2, Zap } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';

// Prompt do Sistema para manter a personalidade
const SYSTEM_PROMPT = `Você é o "RADAR IA", o assistente tático do Rota Livre Hub. 
Sua missão é auxiliar cicloviajantes e aventureiros na América Latina com informações precisas sobre:
1. Logística de cicloviagem (rotas, equipamentos, acampamento).
2. Protocolos de sobrevivência e segurança em climas extremos (frio, calor, altitude).
3. Conversão de moedas e fusos horários na América Latina.
4. Manutenção básica de bicicletas em campo.

Seu tom é: Técnico, direto, prestativo e "High-Tech". Use uma linguagem que remeta a painéis de controle, radares e protocolos (ex: "Sinal Verde", "Protocolo Ativado", "Análise Concluída").

Seja conciso mas detalhado no que importa. Sempre priorize a segurança do ciclista.
Se perguntarem algo fora desses temas, tente gentilmente trazer de volta para a aventura, mas responda se for útil.
Responda sempre em Português do Brasil.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function RadarIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "SINAL_CONECTADO // Protocolo RADAR_IA ativo. Como posso auxiliar em sua missão hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages as Message[]);
    setIsLoading(true);

    try {
      // @ts-ignore
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      // Simple history mapping for the SDK
      // Note: chat metadata is handled internally by the SDK when using chat objects
      // but for simple stateless calls we can also just pass the message.
      // Since history persistence across turns is handled by the SDK chat object:
      
      const response = await chat.sendMessage({
        message: userMessage,
      });

      const responseText = response.text || "Erro na comunicação via satélite. Tente novamente.";
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "ERRO_SISTEMA: Conexão instável. Verifique seu sinal e tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:right-6 z-50 p-3.5 sm:p-4 bg-[#ff641d] text-white rounded-full shadow-[0_0_20px_rgba(255,100,29,0.4)] border border-[#ff641d]/50 group"
      >
        <Zap size={22} className="sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            className="fixed bottom-4 left-4 sm:bottom-6 sm:right-6 z-[60] w-[calc(100vw-32px)] sm:w-[400px] h-[500px] sm:h-[600px] max-h-[calc(100vh-48px)] bg-[#0b0c0d] border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff641d]/10 flex items-center justify-center border border-[#ff641d]/20">
                  <Zap size={16} className="text-[#ff641d]" />
                </div>
                <div>
                  <h3 className="text-xs font-display font-black uppercase tracking-widest text-[#F8FAFC]">Radar IA</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20">SAT_LINK_ACTIVE</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/20 hover:text-white transition-colors"
                aria-label="Fecar Radar IA"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[90%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-[#ff641d] text-white rounded-tr-none shadow-lg shadow-[#ff641d]/10" 
                      : "bg-white/5 border border-white/5 text-white/80 rounded-tl-none"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none text-white/80">
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-white/10 mt-1 uppercase tracking-widest">
                    {msg.role === 'user' ? 'OPERADOR' : 'RADAR_IA'}
                  </span>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-white/20">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em]">Processando_Dados...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="DIGITE SEU COMANDO..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-white/10 focus:outline-none focus:border-[#ff641d]/50 pr-12 transition-all"
                />
                <button
                  disabled={isLoading || !input.trim()}
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#ff641d] disabled:text-white/10 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-3 flex justify-between items-center text-[7px] font-mono tracking-widest text-white/5 uppercase">
                <span>Versão: v3.1.0-radar</span>
                <span>Gemini_Satellite_Engine</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
