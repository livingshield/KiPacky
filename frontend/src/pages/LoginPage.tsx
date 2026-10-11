import React, { useState } from 'react';
import { Shield, KeyRound, User, ArrowLeft } from 'lucide-react';
import { adminLogin } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
  onBackToKiosk: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToKiosk }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminLogin(username, password);
      onLoginSuccess(res.username);
    } catch (err: any) {
      setError(err.message || 'Nesprávné přihlašovací údaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F3E9] text-[#232B28]">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E4DDD0] rounded-[20px] p-8 shadow-admin-card">
        <button
          type="button"
          onClick={onBackToKiosk}
          className="inline-flex items-center gap-2 text-xs font-heading font-semibold text-[#55645B] hover:text-[#193F34] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na terminál docházky
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] bg-[#193F34] text-[#D7BE97] mb-3 shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#193F34] tracking-tight">
            Kípačky – Správa
          </h2>
          <p className="text-xs font-sans text-[#55645B] mt-1">
            Greenberg Nepomuk • Administrační rozhraní
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#A53F4E]/10 border border-[#A53F4E]/30 rounded-[12px] text-[#A53F4E] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#55645B] mb-1.5">
              Uživatelské jméno
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55645B]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-[#E4DDD0] rounded-[10px] text-[#232B28] placeholder-[#55645B]/60 focus:outline-none focus:border-[#193F34] transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#55645B] mb-1.5">
              Heslo
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55645B]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-[#E4DDD0] rounded-[10px] text-[#232B28] placeholder-[#55645B]/60 focus:outline-none focus:border-[#193F34] transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-[#193F34] hover:bg-[#285446] active:bg-[#102E26] text-white font-heading font-bold rounded-[12px] transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se do správy'}
          </button>
        </form>
      </div>
    </div>
  );
};
