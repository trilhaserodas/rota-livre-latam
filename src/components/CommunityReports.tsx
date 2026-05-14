import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { MessageCircle, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Report {
  id: string;
  userName: string;
  content: string;
  category: string;
  location?: string;
  createdAt: any;
}

export default function CommunityReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(docs);
      setLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'reports');
      setError('Falha ao conectar com o banco de inteligência.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={24} />
        <p className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {reports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="dashboard-card p-6 border-white/[0.03] bg-gradient-to-br from-white/[0.02] to-transparent hover:border-[#ff641d]/20 transition-all group relative overflow-hidden"
          >
            {/* Tactical category tag */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-[#ff641d]/10 border-l border-b border-[#ff641d]/20 rounded-bl-xl text-[8px] font-mono font-bold text-[#ff641d] uppercase tracking-widest">
              {report.category}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff641d]/10 flex items-center justify-center text-[#ff641d] border border-[#ff641d]/20">
                <User size={16} />
              </div>
              <div>
                <div className="text-[11px] font-mono font-black text-white uppercase tracking-widest">{report.userName}</div>
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-[#ff641d]" /> 
                  {report.createdAt?.toDate ? new Date(report.createdAt.toDate()).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'SINAL_RECENTE'}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-2 top-0 w-[1px] h-full bg-gradient-to-b from-[#ff641d]/40 to-transparent" />
              <p className="text-[12px] text-white/70 leading-relaxed font-sans mb-4 pl-4">
                {report.content}
              </p>
            </div>

            <div className="flex items-center justify-between">
              {report.location ? (
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/30 uppercase tracking-widest bg-white/[0.02] px-2 py-1 rounded border border-white/5">
                  <MapPin size={10} className="text-[#ff641d]" /> 
                  <span className="truncate max-w-[200px]">{report.location}</span>
                </div>
              ) : <div />}
              
              <div className="flex items-center gap-2 text-[8px] font-mono text-white/10 uppercase tracking-widest">
                 ID_SENSOR: {report.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {reports.length === 0 && (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
          <MessageCircle className="mx-auto text-white/5 mb-4" size={32} />
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">Aguardando inteligência local da comunidade...</p>
        </div>
      )}
    </div>
  );
}

