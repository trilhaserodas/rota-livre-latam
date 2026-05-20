import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation2, MapPin, Target, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface GPSStatus {
  lat: number | null;
  lng: number | null;
  error: string | null;
  isActive: boolean;
}

interface GPSTrackerProps {
  onCenterMe?: (lat: number, lng: number) => void;
  isSharing?: boolean;
  onToggleSharing?: (active: boolean) => void;
  isSignedIn?: boolean;
  className?: string;
}

const GPSTracker: React.FC<GPSTrackerProps> = ({ 
  onCenterMe, 
  isSharing = false, 
  onToggleSharing,
  isSignedIn = false,
  className 
}) => {
  const [status, setStatus] = useState<GPSStatus>({
    lat: null,
    lng: null,
    error: null,
    isActive: false,
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    setStatus({
      lat: latitude,
      lng: longitude,
      error: null,
      isActive: true,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "LOCALIZAÇÃO NÃO AUTORIZADA";
    if (error.code === error.TIMEOUT) errorMessage = "TEMPO EXCEDIDO";
    if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "SINAL INDISPONÍVEL";
    
    setStatus(prev => ({
      ...prev,
      error: errorMessage,
      isActive: false,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus(prev => ({ ...prev, error: "GPS NÃO SUPORTADO" }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updatePosition, handleError]);

  const handleCenter = () => {
    if (status.lat && status.lng && onCenterMe) {
      onCenterMe(status.lat, status.lng);
    }
  };

  return (
    <div className={cn("pointer-events-auto", className)}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0b0c0d]/65 backdrop-blur-md border border-[#ff641d]/30 rounded-xs p-3 min-w-[170px] shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(255,100,29,0.15)]"
      >
        <div className="flex items-center justify-between mb-2 px-0.5">
           <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                status.isActive ? "bg-[#ff641d] animate-pulse" : "bg-red-500"
              )} />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono font-black text-white uppercase tracking-[0.2em]">
                  {status.isActive ? "📍 GPS ACTIVE" : "⚠️ NO SIGNAL"}
                </span>
                {isSharing && (
                  <span className="text-[6px] font-mono text-[#00d4ff] uppercase tracking-widest animate-pulse">LIVE_SHARING</span>
                )}
              </div>
           </div>
           
           <div className="flex items-center gap-2">
             {status.isActive && (
               <button 
                 onClick={handleCenter}
                 className="text-[#ff641d] hover:text-white transition-all p-1 bg-white/5 rounded-xs"
                 title="Centralizar em mim"
               >
                  <Target size={12} />
               </button>
             )}
           </div>
        </div>

        {status.error ? (
          <div className="text-[7px] font-mono text-red-500/80 uppercase tracking-tight font-black px-0.5 py-1">
            {status.error}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-0.5">
               <div className="flex flex-col">
                  <span className="text-[6px] font-mono text-white/20 uppercase">LATITUDE</span>
                  <span className="text-[10px] font-mono font-black text-[#ff641d] tracking-tighter">
                    {status.lat?.toFixed(5) || "0.00000"}
                  </span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[6px] font-mono text-white/20 uppercase">LONGITUDE</span>
                  <span className="text-[10px] font-mono font-black text-[#ff641d] tracking-tighter">
                    {status.lng?.toFixed(5) || "0.00000"}
                  </span>
               </div>
            </div>

            {isSignedIn && onToggleSharing && (
              <button
                onClick={() => onToggleSharing(!isSharing)}
                className={cn(
                  "w-full py-1.5 rounded-xs text-[8px] font-mono font-black uppercase tracking-widest transition-all border",
                  isSharing 
                    ? "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 hover:bg-[#00d4ff]/20" 
                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                )}
              >
                {isSharing ? "PARAR COMPARTILHAMENTO" : "COMPARTILHAR LOCAL"}
              </button>
            )}
            
            {!isSignedIn && (
              <div className="text-[6px] font-mono text-white/10 uppercase tracking-widest text-center pt-1 border-t border-white/5">
                FAÇA LOGIN PARA COMPARTILHAR
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GPSTracker;
