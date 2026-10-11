import React, { useState, useEffect } from 'react';
import { KioskPage } from './pages/KioskPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { checkAuth } from './api/client';
import { Lock } from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<'kiosk' | 'login' | 'admin' | 'document'>('kiosk');
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [viewerDocId, setViewerDocId] = useState<number | null>(null);

  useEffect(() => {
    // Kontrola URL parametrů pro samostatné zobrazení plného znění směrnice
    const params = new URLSearchParams(window.location.search);
    const docParam = params.get('doc') || params.get('documentId');
    if (docParam) {
      const parsedId = parseInt(docParam, 10);
      if (!isNaN(parsedId)) {
        setViewerDocId(parsedId);
        setView('document');
        return;
      }
    }

    // Ověření existence přihlášení administrátora
    checkAuth().then((res) => {
      if (res.isAuthenticated) {
        setAdminUser(res.username);
      }
    });
  }, []);

  const handleOpenAdmin = () => {
    if (adminUser) {
      setView('admin');
    } else {
      setView('login');
    }
  };

  const handleLoginSuccess = (username: string) => {
    setAdminUser(username);
    setView('admin');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setView('kiosk');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-sky-500 selection:text-white">
      {view === 'document' && viewerDocId && (
        <DocumentViewerPage
          documentId={viewerDocId}
          onBack={() => {
            // Odebrat parametr z URL a vrátit se na kiosek
            window.history.pushState({}, '', window.location.pathname);
            setView('kiosk');
          }}
        />
      )}

      {view === 'kiosk' && (
        <div className="relative min-h-screen">
          <KioskPage />
          {/* Nenápadné tlačítko pro vstup do administrace v pravém dolním rohu */}
          <button
            type="button"
            onClick={handleOpenAdmin}
            className="fixed bottom-3 right-3 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-500 hover:text-slate-200 border border-slate-800/80 transition-all cursor-pointer shadow-sm"
            title="Administrace"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      )}

      {view === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToKiosk={() => setView('kiosk')}
        />
      )}

      {view === 'admin' && (
        <AdminPage
          onLogout={handleLogout}
          onGoToKiosk={() => setView('kiosk')}
        />
      )}
    </div>
  );
};

export default App;
