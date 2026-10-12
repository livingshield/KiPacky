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

    // Poznámka: Z bezpečnostních důvodů se automaticky nepřeskakuje na admina.
    // Při kliknutí na zámeček na kiosku se VŽDY vyžaduje zadání Master PINu / hesla.
  }, []);

  const handleOpenAdmin = () => {
    // Vždy vyžadovat zadání PINu / hesla před vstupem do administrace
    setView('login');
  };

  const handleLoginSuccess = (username: string) => {
    setAdminUser(username);
    setView('admin');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setView('kiosk');
  };

  const isDark = view === 'kiosk';

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#D7BE97] selection:text-[#193F34] ${
        isDark ? 'bg-[#102E26] text-[#F7F3E9] theme-dark' : 'bg-[#F7F3E9] text-[#232B28] theme-light'
      }`}
    >
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
            className="fixed bottom-3 right-3 p-2.5 rounded-full bg-[#193F34]/80 hover:bg-[#285446] text-[#C9DDD0] hover:text-[#D7BE97] border border-[#426456]/60 transition-all cursor-pointer shadow-sm z-40"
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
