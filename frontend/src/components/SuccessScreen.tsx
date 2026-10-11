import React, { useEffect, useState } from 'react';
import { Check, PackageCheck } from 'lucide-react';
import { ClockResponse } from '../types';

interface SuccessScreenProps {
  response: ClockResponse;
  onFinished: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ response, onFinished }) => {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinished]);

  const isProduction = response.eventType === 'Production';
  let actionText = 'Odchod';
  if (response.eventType === 'ClockIn') actionText = 'Příchod';
  else if (response.eventType === 'BreakStart') actionText = 'Začátek přestávky';
  else if (response.eventType === 'BreakEnd') actionText = 'Konec přestávky';

  const time =
    response.formattedTime ||
    (response.timestamp
      ? new Date(response.timestamp).toLocaleTimeString('cs-CZ', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '');

  const displayMessage = isProduction
    ? `Uloženo (${response.submittedPieces || ''} ks). Čeká na kontrolu a schválení.`
    : `${actionText} zaznamenán v ${time}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#102E26]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-[#F7F3E9] select-none transition-all duration-300">
      <div className="w-full max-w-sm bg-[#193F34] border border-[#426456] rounded-[20px] p-6 text-center shadow-2xl flex flex-col items-center">
        {/* Ikona v kruhu */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 border-2 shadow-lg ${
            isProduction
              ? 'bg-[#9B623F]/20 border-[#9B623F] text-[#D7BE97]'
              : 'bg-[#16634D]/30 border-[#16634D] text-[#34C790]'
          }`}
        >
          {isProduction ? (
            <PackageCheck className="w-12 h-12 stroke-[2.2]" />
          ) : (
            <Check className="w-12 h-12 stroke-[2.5]" />
          )}
        </div>

        <h2 className="text-2xl font-heading font-extrabold text-[#F7F3E9] mb-1">
          {response.employeeName}
        </h2>

        <p
          className={`text-base font-heading font-semibold mb-3 ${
            isProduction ? 'text-[#D7BE97]' : 'text-[#34C790]'
          }`}
        >
          {displayMessage}
        </p>

        {response.message && !isProduction && (
          <p className="text-xs text-[#C9DDD0] max-w-xs mb-4">
            {response.message}
          </p>
        )}

        {/* Odpočet a tlačítko OK */}
        <div className="mt-4 pt-4 border-t border-[#426456]/60 w-full flex items-center justify-between text-xs text-[#C9DDD0]">
          <span>Návrat za {secondsLeft} s</span>
          <button
            type="button"
            onClick={onFinished}
            className="px-4 py-1.5 rounded-[10px] bg-[#285446] hover:bg-[#D7BE97] hover:text-[#193F34] text-[#F7F3E9] font-heading font-bold text-xs transition-colors cursor-pointer"
          >
            Hotovo (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
