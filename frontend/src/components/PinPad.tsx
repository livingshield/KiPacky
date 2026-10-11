import React, { useState, useEffect } from 'react';
import { Delete, Lock, Zap } from 'lucide-react';

interface PinPadProps {
  onPinSubmit: (pin: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  isOnline?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
  onPinSubmit,
  isLoading,
  errorMessage,
  isOnline = true,
}) => {
  const [pin, setPin] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (isLoading || pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 4) {
      onPinSubmit(nextPin);
    }
  };

  const handleDelete = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLoading) return;
    setPin('');
  };

  // Podpora hardwarové klávesnice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isLoading]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto px-4 select-none">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border-2 border-sky-500/30 flex items-center justify-center mb-3 text-sky-400 shadow-md">
        <Lock className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1 text-center">
        Pracovní docházka
      </h1>
      <p className="text-sm font-medium text-slate-300 mb-4 text-center">
        Zadejte svůj 4místný osobní PIN
      </p>

      {/* Upozornění na offline režim s podporou fronty */}
      {!isOnline && (
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm mb-0.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Offline režim aktivní</span>
          </div>
          <p className="text-xs text-amber-200/90">
            Zadejte PIN jako obvykle. Záznam se uloží do telefonu a odešle po naskočení signálu.
          </p>
        </div>
      )}

      {/* Indikátor 4 teček */}
      <div className="flex gap-4 mb-5">
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < pin.length;
          return (
            <div
              key={index}
              className={`w-5 h-5 rounded-full transition-all duration-200 border-2 ${
                isFilled
                  ? 'bg-sky-400 border-sky-300 scale-110 shadow-lg shadow-sky-500/50'
                  : 'bg-slate-800 border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {/* Chybová hláška */}
      {errorMessage && (
        <div className="w-full mb-4 px-4 py-2.5 bg-rose-500/20 border-2 border-rose-500/50 rounded-xl text-rose-200 text-sm font-semibold text-center animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Numerická klávesnice Mobile-First (vždy aktivní, touch-friendly min 64px) */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isLoading || pin.length >= 4}
            onClick={() => handleDigit(digit)}
            className="h-16 text-2xl font-bold rounded-2xl bg-slate-800 text-white border-2 border-slate-700 hover:bg-slate-700 active:bg-sky-600 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            {digit}
          </button>
        ))}

        {/* Spodní řádek: Clear, 0, Backspace */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleClear}
          className="h-16 text-base font-bold rounded-2xl bg-slate-800/80 text-slate-200 border-2 border-slate-700/80 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
        >
          Smazat
        </button>

        <button
          type="button"
          disabled={isLoading || pin.length >= 4}
          onClick={() => handleDigit('0')}
          className="h-16 text-2xl font-bold rounded-2xl bg-slate-800 text-white border-2 border-slate-700 hover:bg-slate-700 active:bg-sky-600 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          0
        </button>

        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-slate-800/80 text-slate-200 border-2 border-slate-700/80 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
          title="Smazat poslední číslici"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 text-sm text-sky-400 font-semibold animate-pulse">
          Ověřuji PIN...
        </div>
      )}
    </div>
  );
};
