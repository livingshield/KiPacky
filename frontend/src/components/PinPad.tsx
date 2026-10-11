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
    <div className="flex flex-col items-center justify-center w-full max-w-[420px] mx-auto px-4 select-none">
      {/* Greenberg Logo na průhledném pozadí */}
      <div className="mb-4 flex flex-col items-center">
        <img
          src="greenberg_logo.png"
          alt="Greenberg"
          className="h-16 w-auto object-contain max-w-[220px] drop-shadow-sm"
        />
      </div>

      {/* 2. Zmenšený centrální indikátor zámku */}
      <div className="w-12 h-12 rounded-[14px] bg-[#285446] border border-[#426456] flex items-center justify-center mb-3 shadow-md">
        <Lock className="w-6 h-6 text-[#D7BE97]" />
      </div>

      {/* 3. Nadpis Manrope Bold */}
      <h1 className="text-2xl sm:text-[28px] font-heading font-extrabold tracking-tight text-[#F7F3E9] mb-1 text-center">
        Pracovní docházka
      </h1>

      {/* 4. Podnadpis */}
      <p className="text-[15px] font-medium text-[#C9DDD0] mb-4 text-center">
        Zadejte svůj 4místný osobní PIN
      </p>

      {/* Upozornění na offline režim */}
      {!isOnline && (
        <div className="w-full mb-4 p-3 rounded-[14px] bg-[#285446] border border-[#D7BE97]/60 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-[#D7BE97] font-bold text-sm mb-0.5">
            <Zap className="w-4 h-4 shrink-0" />
            <span>Offline režim aktivní</span>
          </div>
          <p className="text-xs text-[#C9DDD0]">
            Zadejte PIN jako obvykle. Záznam se bezpečně uloží do telefonu a odešle po naskočení signálu.
          </p>
        </div>
      )}

      {/* 5. Čtyři indikátory zadaných číslic (průměr 14-16 px) */}
      <div className="flex gap-4 mb-5 items-center justify-center">
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < pin.length;
          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-150 border-2 ${
                isFilled
                  ? 'bg-[#D7BE97] border-[#D7BE97] scale-110 shadow-md shadow-[#D7BE97]/40'
                  : 'bg-transparent border-[#789184]'
              }`}
            />
          );
        })}
      </div>

      {/* Chybová hláška */}
      {errorMessage && (
        <div className="w-full mb-4 px-4 py-2.5 bg-[#A53F4E]/20 border border-[#A53F4E] rounded-[12px] text-[#FFE0DE] text-sm font-semibold text-center">
          {errorMessage}
        </div>
      )}

      {/* 6. Velká numerická klávesnice Mobile-First */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isLoading || pin.length >= 4}
            onClick={() => handleDigit(digit)}
            className="h-[68px] text-[28px] font-heading font-bold rounded-[14px] bg-[#193F34] text-[#F7F3E9] border border-[#426456] hover:bg-[#285446] active:bg-[#285446] active:border-[#D7BE97] active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            {digit}
          </button>
        ))}

        {/* Spodní řádek: Smazat, 0, Backspace */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleClear}
          className="h-[68px] text-[15px] font-heading font-semibold rounded-[14px] bg-[#193F34]/70 text-[#C9DDD0] border border-[#426456]/80 hover:bg-[#285446] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
        >
          Smazat
        </button>

        <button
          type="button"
          disabled={isLoading || pin.length >= 4}
          onClick={() => handleDigit('0')}
          className="h-[68px] text-[28px] font-heading font-bold rounded-[14px] bg-[#193F34] text-[#F7F3E9] border border-[#426456] hover:bg-[#285446] active:bg-[#285446] active:border-[#D7BE97] active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          0
        </button>

        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleDelete}
          className="h-[68px] rounded-[14px] bg-[#193F34]/70 text-[#C9DDD0] border border-[#426456]/80 hover:bg-[#285446] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
          title="Smazat poslední číslici"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* 7. Spodní informační patička */}
      <div className="mt-5 text-center text-xs text-[#789184]">
        <span>Chráněno osobním PINem • Greenberg Nepomuk</span>
      </div>
    </div>
  );
};
