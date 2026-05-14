import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Wind, Thermometer, Users, Target } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface HUDIndicatorProps {
  label: string;
  value: number; // 0 to 10
  icon: React.ElementType;
  delay?: number;
}

const HUDIndicator = ({ label, value, icon: Icon, delay = 0 }: HUDIndicatorProps) => {
  const blocks = 10;
  
  return (
    <div className="group space-y-2">
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-2">
          <Icon size={12} className="text-[#ff641d] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-[#ff641d] transition-colors">
            {label}
          </span>
        </div>
        <div className="text-[10px] font-mono text-[#ff641d] tabular-nums font-black glow-orange">
          {value}/10
        </div>
      </div>
      
      <div className="flex gap-1 h-3 items-center">
        {Array.from({ length: blocks }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleY: 0.5 }}
            whileInView={{ 
              opacity: i < value ? 1 : 0.1, 
              scaleY: 1,
              backgroundColor: i < value ? '#ff641d' : 'rgba(255, 255, 255, 0.05)'
            }}
            viewport={{ once: true }}
            transition={{ 
              delay: delay + (i * 0.05),
              duration: 0.3,
              ease: "easeOut"
            }}
            className={cn(
              "flex-1 h-full rounded-[1px] relative overflow-hidden",
              i < value && "shadow-[0_0_8px_rgba(255,100,29,0.4)]"
            )}
          >
            {/* Gloss effect on active blocks */}
            {i < value && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function TacticalHUD() {
  const indicators = [
    { label: 'Resistência', value: 8, icon: Shield },
    { label: 'Isolamento', value: 9, icon: Target },
    { label: 'Vento', value: 6, icon: Wind },
    { label: 'Frio', value: 7, icon: Thermometer },
    { label: 'Suporte Humano', value: 3, icon: Users },
  ];

  return (
    <div className="bg-[#0b0c0d] border border-white/5 p-8 relative overflow-hidden group shadow-2xl">
      {/* HUD Frame Micro-details */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ff641d]"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ff641d]"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#ff641d]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#ff641d]"></div>
      
      {/* Decorative scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-[#ff641d] animate-pulse" />
              <span className="text-[9px] font-mono text-[#ff641d] font-black uppercase tracking-[0.4em]">
                System_Operational // Analysis_Pulse
              </span>
            </div>
            <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter">
              ANÁLISE <span className="text-[#ff641d]">TÁTICA</span> DA ROTA
            </h2>
          </div>
          
          <div className="flex gap-8">
            <div className="text-right">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Status_Link</div>
              <div className="text-[10px] font-mono text-green-500 uppercase font-black flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Sinal_Ativo
              </div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Protocol_ID</div>
              <div className="text-[10px] font-mono text-white/60 uppercase font-black">
                TRK-2026-X
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {indicators.map((ind, i) => (
            <HUDIndicator
              key={ind.label}
              label={ind.label}
              value={ind.value}
              icon={ind.icon}
              delay={i * 0.1}
            />
          ))}
          
          {/* Tactical Feedback Card */}
          <div className="lg:col-span-1 border-l border-[#ff641d]/20 pl-6 flex flex-col justify-center">
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mb-3 font-black">
              RELATÓRIO_OPS_RESUMO
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-medium">
              Ambiente de alta volatilidade térmica. Isolamento crítico nível 9. 
              Necessário protocolo de autossuficiência completa. 
              Ventos laterais persistentes detectados em quadrante sul.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-white/5"></div>
              <span className="text-[7px] font-mono text-[#ff641d]/40 uppercase tracking-widest">
                VER_DADOS_COMPLETOS
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Decorative Mesh */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#ff641d]/[0.02] rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
}
