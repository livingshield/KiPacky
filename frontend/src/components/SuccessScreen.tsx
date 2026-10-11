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
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-b ${
        isProduction ? 'from-indigo-600 to-indigo-800' : 'from-emerald-600 to-emerald-700'
      } flex flex-col items-center justify-center p-6 text-white select-none transition-all duration-300`}
    >
      <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
        {isProduction ? (
          <PackageCheck className="w-16 h-16 text-white stroke-[2.5]" />
        ) : (
          <Check className="w-16 h-16 text-white stroke-[3]" />
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2 tracking-tight">
        {response.employeeName}
      </h1>

      <p className="text-xl md:text-2xl font-semibold text-white/90 text-center mb-6 max-w-md">
        {displayMessage}
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm text-white/90 font-medium">
        <span>
          Návrat na klávesnici za <strong>{secondsLeft}s</strong>...
        </span>
      </div>

      <button
        type="button"
        onClick={onFinished}
        className="mt-8 px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-all cursor-pointer"
      >
        Pokračovat hned
      </button>
    </div>
  );
};
