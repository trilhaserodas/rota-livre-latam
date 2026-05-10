import React, { useEffect } from 'react';

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layout?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSense({ slot, format = 'auto', layout, className = '', style }: AdSenseProps) {
  useEffect(() => {
    // Only attempt to push if the script is loaded and we have a potentially valid slot
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense notice: Ad slot initialization pending or blocked by browser.', e);
      }
    }
  }, [slot]);

  return (
    <div 
      className={`adsense-container relative my-8 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-center min-h-[90px] transition-all ${className}`} 
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '90px', ...style }}
        data-ad-client="ca-pub-9927699892416636"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
      
      {/* Label discreta (Identidade Rota Livre) que aparece apenas se o anúncio estiver vazio ou carregando */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center gap-2 opacity-[0.03]">
          <div className="w-8 h-[1px] bg-white"></div>
          <span className="text-[8px] font-mono tracking-[0.6em] uppercase">Intel_Stream // Ads_Area</span>
          <div className="w-8 h-[1px] bg-white"></div>
        </div>
      </div>
    </div>
  );
}
