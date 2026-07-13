import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Home, AlertTriangle } from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BG }}>
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-black mb-4" style={{ color: 'rgba(212,175,55,0.15)', fontFamily: 'Orbitron, monospace' }}>404</div>
        <div className="w-12 h-0.5 mx-auto mb-6" style={{ background: 'rgba(212,175,55,0.3)' }} />
        <h2 className="text-2xl font-black text-white mb-2" style={T}>Page Not Found</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          The page <span style={{ color: GOLD, fontWeight: 900 }}>"{pageName}"</span> could not be found.
        </p>

        {isFetched && authData?.isAuthenticated && authData?.user?.role === 'admin' && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-left"
            style={{ background: 'rgba(212,133,74,0.08)', border: '1px solid rgba(212,133,74,0.2)' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4854A' }} />
            <div>
              <p className="text-sm font-black text-white mb-0.5" style={T}>Admin Note</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                This page hasn't been implemented yet. Ask Claude to build it in the chat.
              </p>
            </div>
          </div>
        )}

        <button onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase text-sm transition-opacity hover:opacity-80"
          style={{ ...T, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, cursor: 'pointer' }}>
          <Home className="w-4 h-4" /> Go Home
        </button>
      </div>
    </div>
  );
}
