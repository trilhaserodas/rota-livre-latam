import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, User, Search, ArrowRight, Share2, X, ChevronLeft, Instagram, MessageCircle, Copy, Check } from 'lucide-react';
import SEO from '@/src/components/SEO';

const posts = [
  {
    id: 4,
    title: 'COMO VIAJAR DE AVIÃO COM BICICLETA SEM DOR DE CABEÇA',
    excerpt: 'Guia definitivo para cicloturistas: regras, embalagens, proteção de componentes e checklist para despachar a bike com segurança.',
    category: 'LOGÍSTICA',
    author: 'TR_COMMUNITY',
    date: '09.05.26',
    image: 'https://i.ibb.co/ycFWcS9D/viajar-de-bike-o-avi-o.png',
    content: `
      <h2>1. Verifique as regras da companhia aérea</h2>
      <p>Cada companhia possui regras diferentes para peso permitido, tamanho da embalagem e taxas extras. Antes da viagem, leia as políticas atualizadas no site oficial. Algumas empresas tratam bicicleta como “equipamento esportivo”, outras como “bagagem especial”.</p>

      <h2>2. Escolha a embalagem correta</h2>
      <ul>
        <li><strong>Caixa de papelão:</strong> Barata, fácil de encontrar em bicicletarias e oferece boa proteção básica.</li>
        <li><strong>Mala rígida (Mala-bike):</strong> Maior segurança, ideal para viagens frequentes, porém mais cara e pesada.</li>
        <li><strong>Soft Bag:</strong> Leve e prática, excelente para quem já tem habilidade em desmontar a bike parcial ou totalmente.</li>
      </ul>

      <h2>3. O que você precisa desmontar</h2>
      <p>Na maioria dos voos será necessário: retirar a roda dianteira, alinhar ou remover o guidão, baixar o canote e remover os pedais. <strong>Dica de ouro:</strong> Use pneus dobráveis se possível. Se usar comuns, a recomendação padrão é esvaziá-los parcialmente.</p>

      <h2>4. Proteja as partes frágeis</h2>
      <p>As áreas mais sensíveis são: câmbio traseiro, discos de freio, quadro, suspensão e coroas. Use espuma, papelão reforçado e plástico bolha. Pequenos cuidados evitam grandes prejuízos.</p>

      <h2>5. Protocolo de Aeroporto</h2>
      <p>Bagagens especiais exigem balcão específico e inspeção adicional. Chegue com pelo menos 3 horas de antecedência para voos internacionais e 2 horas para nacionais.</p>

      <h2>6. Documentação Fotográfica</h2>
      <p>Fotografe o quadro, rodas, embalagem e etiquetas antes do embarque. Isso é fundamental caso ocorra algum dano ou extravio.</p>

      <div class="bg-[#ff641d]/10 p-6 border-l-4 border-[#ff641d] my-8">
        <p class="text-white font-bold mb-2 italic">"A estrada não termina no aeroporto. Ela só muda de direção."</p>
      </div>

      <p>Projeto desenvolvido pela comunidade Trilhas e Rodas.<br/>Instagram: @trilhas_erodas</p>
    `
  },
  {
    id: 1,
    title: 'DOCUMENTAÇÃO PARA TRAVESSIA TRANSBORDE',
    excerpt: 'Manual tático sobre aduanas, seguros de responsabilidade civil e protocolos de entrada em zonas de fronteira.',
    category: 'LOGÍSTICA',
    author: 'RT_EXPLORER',
    date: '12.10.25',
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c4b282?auto=format&fit=crop&q=80&w=600',
    content: '<p>Conteúdo em fase de digitalização...</p>'
  },
  {
    id: 2,
    title: 'EQUIPAMENTOS DE SOBREVIVÊNCIA PATAGÔNIA',
    excerpt: 'Análise técnica de sistemas de camadas e isolamento térmico para ambientes de frio extremo e ventos catabáticos.',
    category: 'GEAR_INTEL',
    author: 'LM_GEAR',
    date: '05.10.25',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600',
    content: '<p>Conteúdo em fase de digitalização...</p>'
  },
  {
    id: 3,
    title: 'MANUTENÇÃO DE CAMPO: REPAROS CRÍTICOS',
    excerpt: 'Protocolos de emergência para falhas mecânicas em isolamento geográfico. O que levar no kit de intervenção.',
    category: 'FIELD_OPS',
    author: 'CC_MECHANIC',
    date: '28.09.25',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600',
    content: '<p>Conteúdo em fase de digitalização...</p>'
  }
];

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-24 relative z-10 antialiased">
        <SEO 
          title={`${selectedPost.title} - Rota Livre Hub`} 
          description={selectedPost.excerpt}
        />
        
        <button 
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-2 text-[10px] font-mono text-[#ff641d] mb-12 hover:gap-4 transition-all uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Voltar para o Arquivo
        </button>

        <article className="prose prose-invert prose-orange max-w-none">
          <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-6 uppercase">
            {selectedPost.category} // {selectedPost.id.toString().padStart(4, '0')}
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black uppercase tracking-tighter mb-8 text-[#F8FAFC]">
            {selectedPost.title}
          </h1>

          <div className="flex items-center gap-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-12 border-b border-white/5 pb-8">
            <span className="flex items-center gap-2"><Calendar size={12} /> {selectedPost.date}</span>
            <span className="flex items-center gap-2"><User size={12} /> {selectedPost.author}</span>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden mb-12 border border-white/5">
            <img 
              src={selectedPost.image} 
              alt={selectedPost.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div 
            className="text-white/60 leading-relaxed space-y-6 text-base italic-content"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />

          <div className="mt-24 pt-12 border-t border-white/5">
            <div className="flex flex-col gap-12">
              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#ff641d] flex items-center justify-center font-display font-black text-white shadow-[0_0_20px_rgba(255,100,29,0.3)]">
                  TR
                </div>
                <div>
                  <div className="text-xs font-mono text-white uppercase tracking-widest">{selectedPost.author}</div>
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Field Intelligence Lead</div>
                </div>
              </div>

              {/* Share Interface */}
              <div className="dashboard-card bg-white/[0.02] border-white/5 p-8 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                  <div>
                    <h4 className="text-sm font-display font-bold text-white uppercase tracking-tight mb-1">Compartilhar Relato</h4>
                    <p className="text-[11px] text-white/30 font-mono uppercase tracking-widest">Disseminar inteligência na rede</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const url = `https://wa.me/?text=${encodeURIComponent(`${selectedPost.title} - Rota Livre Hub: ${window.location.href}`)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 group"
                      title="Compartilhar no WhatsApp"
                    >
                      <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">WhatsApp</span>
                    </button>

                    <button 
                      onClick={() => {
                        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all border border-[#1877F2]/20 group"
                      title="Compartilhar no Facebook"
                    >
                      <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Facebook</span>
                    </button>

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        const btn = document.getElementById('copy-btn');
                        if (btn) {
                          const originalHtml = btn.innerHTML;
                          btn.innerHTML = '<span class="text-[10px] font-mono font-bold uppercase tracking-widest">Copiado!</span>';
                          btn.classList.add('bg-[#ff641d]', 'text-white');
                          setTimeout(() => {
                            btn.innerHTML = originalHtml;
                            btn.classList.remove('bg-[#ff641d]', 'text-white');
                          }, 2000);
                        }
                      }}
                      id="copy-btn"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/10 group"
                      title="Copiar Link"
                    >
                      <Copy size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Copiar Link</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instagram Promo */}
              <div className="flex items-center justify-center py-8">
                <a 
                  href="https://instagram.com/trilhas_erodas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[10px] font-mono text-white/20 hover:text-[#E4405F] transition-colors uppercase tracking-[0.3em]"
                >
                  <Instagram size={14} /> Seguir @trilhas_erodas no Instagram
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
      <SEO 
        title="Intel & Relatos - Rota Livre Hub" 
        description="Fronteiras, mecânica, equipamentos e diários de bordo técnicos para viajantes da América Latina."
      />

      <section className="pt-12 mb-20 flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="flex-1">
          <div className="text-[10px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">INTEL_DATABASE // FIELD_REPORTS</div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-4 text-[#F8FAFC]">
            DIÁRIO<span className="text-[#ff641d]">.</span>DE_BORDO
          </h1>
          <p className="text-[#F8FAFC]/40 text-sm font-medium max-w-xl uppercase tracking-widest leading-loose">
            Arquivos técnicos e relatos de infraestrutura. Experiência bruta acumulada em milhares de quilômetros de rípio e asfalto.
          </p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff641d] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR_INTEL..."
            className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 focus:outline-none focus:border-[#ff641d]/30 transition-all text-[10px] font-mono tracking-widest text-[#F8FAFC]"
          />
        </div>
      </section>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex flex-col cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            <div className="dashboard-card h-full p-0 overflow-hidden border-white/[0.03] flex flex-col">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.8] group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#ff641d] text-[8px] font-mono font-bold uppercase tracking-widest text-white">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-6 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mb-6">
                    <span className="flex items-center gap-2 border-r border-white/5 pr-4"><Calendar size={10} /> {post.date}</span>
                    <span className="flex items-center gap-2"><User size={10} /> {post.author}</span>
                  </div>

                  <h3 className="text-xl font-display font-black tracking-tighter mb-4 text-[#F8FAFC] group-hover:text-[#ff641d] transition-colors leading-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-[10px] text-white/30 leading-relaxed font-medium mb-8 flex-grow">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-[#ff641d] group-hover:gap-5 transition-all">
                      ACCESS_INTEL <ArrowRight size={14} />
                    </div>
                    <button 
                      className="text-white/10 hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // share logic
                      }}
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Ops Center / Sub Block */}
      <div className="mt-32 dashboard-card p-12 md:p-16 border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-[#ff641d]/5 blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-md relative z-10">
          <div className="text-[8px] font-mono tracking-[0.4em] text-[#ff641d] mb-4 uppercase">CORE_COMMUNICATIONS</div>
          <h4 className="text-3xl font-display font-black uppercase tracking-tighter mb-4 text-[#F8FAFC]">CENTRO_DE_OPERAÇÕES</h4>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed">
            Receba coordenadas estratégicas e avisos de condições de estrada diretamente no seu terminal semanalmente.
          </p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3 relative z-10">
          <input 
            type="email" 
            placeholder="TERMINAL_ID@EMAIL.COM"
            className="flex-grow md:w-64 bg-white/[0.02] border border-white/5 rounded-sm px-6 py-4 focus:outline-none focus:border-[#ff641d]/30 text-[10px] font-mono tracking-widest text-[#F8FAFC]"
          />
          <button className="px-8 py-4 bg-[#ff641d] text-white font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-[#ff641d]/80 transition-colors shadow-[0_0_20px_rgba(255,100,29,0.3)]">
            CONNECT
          </button>
        </div>
      </div>
    </div>
  );
}

