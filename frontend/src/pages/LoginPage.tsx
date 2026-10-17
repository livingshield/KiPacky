import React, { useState } from 'react';
import { Shield, KeyRound, User, ArrowLeft, Hash, Delete } from 'lucide-react';
import { adminLogin, adminPinLogin } from '../api/client';
import { GREENBERG_LOGO } from '../assets/logoBase64';
import { APP_VERSION } from '../version';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
  onBackToKiosk: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToKiosk }) => {
  const [loginMode, setLoginMode] = useState<'pin' | 'credentials'>('pin');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4 && !loading) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        performPinLogin(nextPin);
      }
    }
  };

  const handlePinBackspace = () => {
    if (!loading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const performPinLogin = async (inputPin: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminPinLogin(inputPin);
      onLoginSuccess(res.username);
    } catch (err: any) {
      setError(err.message || 'Nesprávný Master PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent text-[#232B28]">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E4DDD0] rounded-[20px] p-8 shadow-admin-card">
        <button
          type="button"
          onClick={onBackToKiosk}
          className="inline-flex items-center gap-2 text-xs font-heading font-semibold text-[#55645B] hover:text-[#193F34] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na terminál docházky
        </button>

        <div className="text-center mb-6 flex flex-col items-center">
          <img
            src={GREENBERG_LOGO}
            alt="Greenberg"
            className="h-14 w-auto object-contain max-w-[200px] mb-4"
          />
          <h2 className="text-2xl font-heading font-extrabold text-[#193F34] tracking-tight">
            Kípačky – Správa
          </h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs font-sans text-[#55645B]">Greenberg Nepomuk</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#193F34] text-[#D7BE97] shadow-xs">
              v{APP_VERSION}
            </span>
          </div>
        </div>

        {/* Přepínač režimu přihlášení */}
        <div className="flex bg-[#F0EAE1] p-1 rounded-[12px] mb-6">
          <button
            type="button"
            onClick={() => { setLoginMode('pin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'pin'
                ? 'bg-[#193F34] text-white shadow-sm'
                : 'text-[#55645B] hover:text-[#193F34]'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Rychlý Master PIN
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('credentials'); setError(null); }}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'credentials'
                ? 'bg-[#193F34] text-white shadow-sm'
                : 'text-[#55645B] hover:text-[#193F34]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Jméno a heslo
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#A53F4E]/10 border border-[#A53F4E]/30 rounded-[12px] text-[#A53F4E] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {loginMode === 'pin' ? (
          <div>
            <div className="text-center mb-5">
              <span className="text-xs text-[#55645B] font-sans">
                Zadejte 4místný administrátorský PIN
              </span>
              <div className="flex justify-center gap-3 mt-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? 'bg-[#193F34] border-[#193F34] scale-110'
                        : 'border-[#C9DDD0] bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Klávesnice 1-9, 0 */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={loading}
                  onClick={() => handlePinDigit(digit.toString())}
                  className="h-13 bg-[#F7F3E9] hover:bg-[#EAE4D5] active:bg-[#D7BE97] border border-[#E4DDD0] rounded-[12px] font-heading font-extrabold text-xl text-[#193F34] transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePinDigit('0')}
                className="h-13 bg-[#F7F3E9] hover:bg-[#EAE4D5] active:bg-[#D7BE97] border border-[#E4DDD0] rounded-[12px] font-heading font-extrabold text-xl text-[#193F34] transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                disabled={loading || pin.length === 0}
                onClick={handlePinBackspace}
                className="h-13 bg-[#F7F3E9] hover:bg-[#EAE4D5] active:bg-[#D7BE97] border border-[#E4DDD0] rounded-[12px] font-heading font-semibold text-sm text-[#8E4B2F] transition-all shadow-sm flex items-center justify-center cursor-pointer select-none disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
            {loading && (
              <p className="text-center text-xs text-[#55645B] mt-4">Ověřuji PIN...</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
        )}

        {/* Spodní lišta na přihlašovací kartě */}
        <div className="mt-6 pt-4 border-t border-[#E4DDD0] flex items-center justify-between text-xs text-[#55645B]">
          <span>Kípačky • Greenberg</span>
          <span className="font-mono font-bold text-[#193F34] bg-[#F7F3E9] px-2.5 py-0.5 rounded border border-[#E4DDD0]">
            v{APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
};
