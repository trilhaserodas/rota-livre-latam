import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Coins, Clock, Map as MapIcon, Calculator, BookOpen, Menu, X, ArrowRight, Bell, LogIn, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { auth } from '@/src/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';

const ADMIN_EMAIL = "trilhaserodas@gmail.com";

const navItems = [
  { name: 'Início', path: '/', icon: Compass },
  { name: 'Hub Alerta', path: '/alert-hub', icon: Bell },
  { name: 'Rotas', path: '/rotas', icon: Compass },
  { name: 'Mapa', path: '/mapa', icon: MapIcon },
  { name: 'Moedas', path: '/conversor', icon: Coins },
  { name: 'Fusos', path: '/horarios', icon: Clock },
  { name: 'Blog', path: '/blog', icon: BookOpen },
  { name: 'Sobre', path: '/sobre', icon: Compass },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user?.email === ADMIN_EMAIL);
    });
    return () => unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro no login:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro no logout:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0d] font-sans selection:bg-[#ff641d]/30">
      {/* Navigation */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b',
          scrolled 
            ? 'bg-[#0b0c0d]/90 backdrop-blur-xl border-white/5 py-4' 
            : 'bg-transparent border-transparent py-8'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-sm overflow-hidden group-hover:scale-105 transition-transform">
              <img src="https://i.ibb.co/NnNRsj5N/Facion-site-rota-livre-hub.png" alt="Rota Livre Hub" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-display font-black tracking-tighter uppercase text-[#F8FAFC]">Rota Livre</span>
              <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-[#ff641d]">Dashboard</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F8FAFC]/40">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'hover:text-[#ff641d] transition-all duration-300 relative group py-2',
                  location.pathname === item.path && 'text-[#F8FAFC]'
                )}
              >
                {item.name}
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#ff641d]"
                  />
                )}
              </Link>
            ))}
            
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            
            {isAdmin && (
              <Link to="/admin" className="text-[#ff641d] hover:opacity-80 flex items-center gap-2">
                <Shield size={12} />
                ADMIN
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-white/60 mb-0.5">{user.displayName?.split(' ')[0]}</span>
                  <button onClick={handleLogout} className="text-[8px] text-white/20 hover:text-red-400 transition-colors">SAIR</button>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                  <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#ff641d] text-white transition-all rounded-lg border border-white/10 group"
              >
                <LogIn size={12} className="group-hover:translate-x-0.5 transition-transform" />
                ACESSO
              </button>
            )}
          </div>

          <div className="flex xl:hidden items-center gap-4">
            {user && (
              <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              className="text-[#F8FAFC]/60 hover:text-[#ff641d] p-2 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-[#0b0c0d] flex flex-col justify-center px-12 xl:hidden"
          >
            <div className="flex flex-col gap-6">
              {navItems.map((item, idx) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "text-3xl font-display font-black uppercase tracking-tighter transition-colors",
                      location.pathname === item.path ? "text-[#ff641d]" : "text-[#F8FAFC]"
                    )}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
              
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link to="/admin" className="text-3xl font-display font-black uppercase tracking-tighter text-[#ff641d]">
                    ADMIN_MOD
                  </Link>
                </motion.div>
              )}
            </div>
            
            <div className="mt-16 pt-10 border-t border-white/5 flex flex-col gap-8">
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="w-fit flex items-center gap-4 px-8 py-4 bg-[#ff641d] text-white font-display font-black uppercase tracking-tighter rounded-xl"
                >
                  <LogIn size={20} />
                  FAZER LOGIN GOOGLE
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="w-fit flex items-center gap-4 px-8 py-4 bg-white/5 text-white/40 font-display font-black uppercase tracking-tighter rounded-xl"
                >
                  <LogOut size={20} />
                  DESCONECTAR
                </button>
              )}
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-mono tracking-[0.4em] text-[#ff641d]">Localização_Atual</span>
                <span className="text-xs font-mono text-[#F8FAFC]/40">-34.6037° S, -58.3816° W</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <main className="flex-grow pt-24 topo-grid">
        {children}
      </main>

      {/* Adsense Placeholder */}
      <div className="w-full max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <div className="w-full h-[120px] bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-center text-white/5 text-[8px] font-mono tracking-[0.4em] uppercase">
          ADS_UNIT_01 // PUBLICIDADE
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-24 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-sm overflow-hidden">
                <img src="https://i.ibb.co/NnNRsj5N/Facion-site-rota-livre-hub.png" alt="Rota Livre Hub" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-display font-black tracking-tighter uppercase text-[#F8FAFC]">Rota Livre</span>
            </Link>
            <p className="text-[#F8FAFC]/40 max-w-sm mb-10 leading-relaxed text-sm">
              O painel do aventureiro moderno para quem vive a estrada na América Latina. 
              Tecnologia e utilidade pública gratuita para desbravadores.
            </p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/trilhas_erodas/" target="_blank" rel="noopener noreferrer" className="text-[#ff641d] text-[10px] font-mono tracking-widest hover:opacity-80 transition-opacity">INSTAGRAM</a>
              <a href="https://www.youtube.com/@TrilhaserodasOficial" target="_blank" rel="noopener noreferrer" className="text-[#ff641d] text-[10px] font-mono tracking-widest hover:opacity-80 transition-opacity">YOUTUBE</a>
              <span className="text-[#ff641d] text-[10px] font-mono tracking-widest opacity-20">GITHUB</span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff641d] mb-8">Sistemas</h4>
            <div className="flex flex-col gap-4 text-xs font-semibold uppercase tracking-widest text-[#F8FAFC]/30">
              <Link to="/alert-hub" className="hover:text-white transition-colors">Alert_Hub</Link>
              <Link to="/conversor" className="hover:text-white transition-colors">Currency_Hub</Link>
              <Link to="/horarios" className="hover:text-white transition-colors">Time_Zones</Link>
              <Link to="/mapa" className="hover:text-white transition-colors">Live_Maps</Link>
              <Link to="/calculadoras" className="hover:text-white transition-colors">Ops_Calcs</Link>
              <Link to="/rotas" className="hover:text-white transition-colors">Global_Routes</Link>
              <Link to="/aviao" className="hover:text-white transition-colors">Air_Protocol</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff641d] mb-8">Legal</h4>
            <div className="flex flex-col gap-4 text-xs font-semibold uppercase tracking-widest text-[#F8FAFC]/30">
              <Link to="/privacidade" className="hover:text-white transition-colors">Privacy_Protocol</Link>
              <Link to="/termos" className="hover:text-white transition-colors">Service_Terms</Link>
              <Link to="/sobre" className="hover:text-white transition-colors">Mission_Log</Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[8px] text-white/10 uppercase font-mono tracking-[0.4em]">
            © {new Date().getFullYear()} RL.HUB // ALL_SYSTEMS_GO
          </p>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff641d] animate-pulse"></span>
            <span className="text-[8px] text-[#ff641d] uppercase font-mono tracking-[0.4em]">Signal: Valid</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
