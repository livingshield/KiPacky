import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, WifiOff, Zap, RefreshCw } from 'lucide-react';
import { PinPad } from '../components/PinPad';
import { ActionSelect } from '../components/ActionSelect';
import { SuccessScreen } from '../components/SuccessScreen';
import {
  verifyPin,
  submitClock,
  submitProduction,
  confirmDocument,
  claimShift,
  releaseShift,
  updateProfile,
} from '../api/client';
import { AttendanceStatusResponse, ClockResponse } from '../types';
import {
  addToOfflineQueue,
  processOfflineQueue,
  subscribeOfflineQueue,
  OfflineQueueItem,
} from '../utils/offlineQueue';

const INACTIVITY_TIMEOUT_SECONDS = 60;

export const KioskPage: React.FC = () => {
  const [currentPin, setCurrentPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<AttendanceStatusResponse | null>(null);
  const [successResponse, setSuccessResponse] = useState<ClockResponse | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Stav offline fronty a synchronizace
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Inactivity timeout (Automatické odhlášení po 60 sekundách nečinnosti)
  const [secondsLeft, setSecondsLeft] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Odběr změn ve frontě
  useEffect(() => {
    const unsubscribe = subscribeOfflineQueue((items) => {
      setOfflineQueue(items);
    });
    return () => unsubscribe();
  }, []);

  // Sledování online/offline stavu zařízení
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setErrorMessage(null);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Živý čas pro kiosek
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Pravidelná kontrola a auto-sync každých 20 sekund, pokud jsou položky ve frontě
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && offlineQueue.length > 0 && !isSyncing) {
        triggerSync();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [offlineQueue.length, isSyncing]);

  // Synchronizace offline fronty
  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { syncedCount } = await processOfflineQueue(submitClock, submitProduction);
      if (syncedCount > 0) {
        setSyncToast(`✓ Synchronizováno ${syncedCount} offline záznamů na server.`);
        setTimeout(() => setSyncToast(null), 5000);
      }
    } catch (err: any) {
      console.warn('Chyba při synchronizaci:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Reset do výchozího stavu
  const handleReset = useCallback(() => {
    setCurrentPin('');
    setStatusData(null);
    setSuccessResponse(null);
    setErrorMessage(null);
    setIsLoading(false);
    setIsSubmitting(false);
    setSecondsLeft(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  // Inactivity timeout: resetuje odpočet při jakékoliv aktivitě uživatele
  const resetInactivity = useCallback(() => {
    setSecondsLeft(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  useEffect(() => {
    if (!statusData) {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
      return;
    }

    // Nastavit posluchače aktivity
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll', 'click'];
    const handleActivity = () => resetInactivity();

    events.forEach((evt) => window.addEventListener(evt, handleActivity));

    inactivityTimerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleReset();
          return INACTIVITY_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [statusData, resetInactivity, handleReset]);

  // Krok 1: Odeslání PINu a zjištění stavu
  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentPin(pin);
    resetInactivity();

    try {
      const data = await verifyPin(pin);
      setStatusData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Neplatný PIN. Zkuste to prosím znovu.');
      setCurrentPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Krok 2a: Odeslání akce (Příchod / Odchod / Přestávka)
  const handleActionSubmit = async (
    eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd'
  ) => {
    if (!currentPin) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    resetInactivity();

    const actionNames: Record<string, string> = {
      ClockIn: 'Příchod',
      ClockOut: 'Odchod',
      BreakStart: 'Začátek přestávky',
      BreakEnd: 'Konec přestávky',
    };
    const actionText = actionNames[eventType] || eventType;

    // Pokud jsme offline, uložíme do lokální fronty
    if (!navigator.onLine) {
      const nowTs = new Date().toISOString();
      addToOfflineQueue({
        type: 'clock',
        pinCode: currentPin,
        eventType,
        offlineTimestamp: nowTs,
        employeeName: statusData?.fullName,
      });

      setSuccessResponse({
        success: true,
        employeeName: statusData?.fullName || `Brigádník (${currentPin})`,
        eventType,
        timestamp: nowTs,
        formattedTime: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        message: `${actionText} uložen do telefonu (Offline). Bude odeslán na server automaticky po naskočení signálu.`,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await submitClock(currentPin, eventType);
      setSuccessResponse(result);
    } catch (err: any) {
      // Pokud síť selhala uprostřed odesílání, uložíme do offline fronty
      if (!navigator.onLine || err.name === 'TypeError' || err.message?.includes('fetch')) {
        const nowTs = new Date().toISOString();
        addToOfflineQueue({
          type: 'clock',
          pinCode: currentPin,
          eventType,
          offlineTimestamp: nowTs,
          employeeName: statusData?.fullName,
        });

        setSuccessResponse({
          success: true,
          employeeName: statusData?.fullName || `Brigádník (${currentPin})`,
          eventType,
          timestamp: nowTs,
          formattedTime: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
          message: `${actionText} uložen do telefonu (Offline). Bude odeslán na server po naskočení signálu.`,
        });
      } else {
        setErrorMessage(err.message || 'Chyba při zápisu docházky.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 2b: Odeslání výroby (Fáze 2)
  const handleProductionSubmit = async (orderId: number, operationId: number, pieces: number) => {
    if (!currentPin) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    resetInactivity();

    if (!navigator.onLine) {
      const nowTs = new Date().toISOString();
      addToOfflineQueue({
        type: 'production',
        pinCode: currentPin,
        orderId,
        operationId,
        submittedPieces: pieces,
        offlineTimestamp: nowTs,
        employeeName: statusData?.fullName,
      });

      setSuccessResponse({
        success: true,
        employeeName: statusData?.fullName || `Brigádník (${currentPin})`,
        eventType: 'Production',
        submittedPieces: pieces,
        timestamp: nowTs,
        formattedTime: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        message: `Výroba (${pieces} ks) uložena do telefonu (Offline). Bude odeslána na server po naskočení signálu.`,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await submitProduction({
        pinCode: currentPin,
        orderId,
        operationId,
        submittedPieces: pieces,
      });
      setSuccessResponse(result);
    } catch (err: any) {
      if (!navigator.onLine || err.name === 'TypeError' || err.message?.includes('fetch')) {
        const nowTs = new Date().toISOString();
        addToOfflineQueue({
          type: 'production',
          pinCode: currentPin,
          orderId,
          operationId,
          submittedPieces: pieces,
          offlineTimestamp: nowTs,
          employeeName: statusData?.fullName,
        });

        setSuccessResponse({
          success: true,
          employeeName: statusData?.fullName || `Brigádník (${currentPin})`,
          eventType: 'Production',
          submittedPieces: pieces,
          timestamp: nowTs,
          formattedTime: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
          message: `Výroba (${pieces} ks) uložena do telefonu (Offline). Bude odeslána na server po naskočení signálu.`,
        });
      } else {
        setErrorMessage(err.message || 'Chyba při ukládání výroby.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 2c: Potvrzení seznámení s dokumentem BOZP (Fáze 3)
  const handleDocumentConfirm = async (documentId: number) => {
    if (!currentPin) return;
    resetInactivity();
    try {
      await confirmDocument(currentPin, documentId);
      const refreshed = await verifyPin(currentPin);
      setStatusData(refreshed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba při potvrzení dokumentu.');
    }
  };

  // Krok 2d: Přihlášení na volnou směnu (Fáze 5)
  const handleClaimShift = async (shiftId: number) => {
    if (!currentPin) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    resetInactivity();
    try {
      await claimShift(currentPin, shiftId);
      const refreshed = await verifyPin(currentPin);
      setStatusData(refreshed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba při přihlášení na směnu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 2e: Odhlášení / uvolnění směny (Fáze 5)
  const handleReleaseShift = async (shiftId: number) => {
    if (!currentPin) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    resetInactivity();
    try {
      await releaseShift(currentPin, shiftId);
      const refreshed = await verifyPin(currentPin);
      setStatusData(refreshed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba při uvolnění směny.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 2f: Uložení profilu a čísla účtu (Fáze 5)
  const handleProfileUpdate = async (data: { phone?: string; email?: string; bankAccount?: string }) => {
    if (!currentPin) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    resetInactivity();
    try {
      await updateProfile({
        pinCode: currentPin,
        ...data,
      });
      const refreshed = await verifyPin(currentPin);
      setStatusData(refreshed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba při aktualizaci profilu.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-4 px-4 bg-slate-900 text-slate-100">
      {/* Toast notifikace o synchronizaci */}
      {syncToast && (
        <div className="w-full max-w-lg mx-auto mb-3 bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center justify-between text-sm animate-bounce z-50">
          <span>{syncToast}</span>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-white/80 hover:text-white ml-2 text-xs font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vizuální offline varování při absenci signálu */}
      {!isOnline && (
        <div className="w-full max-w-lg mx-auto mb-3 bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center justify-between gap-2 border-2 border-amber-500 z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm">
              Jste offline. Záznamy se ukládají do telefonu a odešlou po připojení.
            </span>
          </div>
        </div>
      )}

      {/* Horní hlavička kiosku */}
      <div className="flex items-center justify-between max-w-sm w-full mx-auto mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span
            className={`text-xs font-semibold tracking-wider uppercase ${
              isOnline ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isOnline ? 'Kiosk aktivní' : 'Offline fronta'}
          </span>

          {/* Indikátor neodeslaných záznamů */}
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={triggerSync}
              disabled={isSyncing || !isOnline}
              className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer disabled:opacity-60"
              title="Klikněte pro odeslání čekajících záznamů"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{offlineQueue.length}</span>
              {isSyncing && <RefreshCw className="w-2.5 h-2.5 animate-spin ml-0.5" />}
            </button>
          )}
        </div>

        {/* Pravá část hlavičky: Odpočet nečinnosti nebo Čas */}
        <div className="flex items-center gap-2 text-xs">
          {statusData && (
            <span
              onClick={resetInactivity}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                secondsLeft <= 15
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
              title="Automatické odhlášení nečinnosti. Klikněte pro prodloužení."
            >
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{secondsLeft}s</span>
            </span>
          )}

          <span className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span className="capitalize">
              {currentTime.toLocaleDateString('cs-CZ', {
                weekday: 'short',
                day: 'numeric',
                month: 'numeric',
              })}
            </span>
          </span>
          <span className="flex items-center gap-1 font-mono text-white bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/80 shadow-sm">
            <span>
              {currentTime.toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Hlavní obsah podle stavu */}
      <div className="flex-1 flex items-center justify-center">
        {successResponse ? (
          <SuccessScreen response={successResponse} onFinished={handleReset} />
        ) : statusData ? (
          <ActionSelect
            statusData={statusData}
            pinCode={currentPin}
            onActionSubmit={handleActionSubmit}
            onProductionSubmit={handleProductionSubmit}
            onDocumentConfirm={handleDocumentConfirm}
            onClaimShift={handleClaimShift}
            onReleaseShift={handleReleaseShift}
            onProfileUpdate={handleProfileUpdate}
            onBack={handleReset}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            isOnline={isOnline}
          />
        ) : (
          <PinPad
            onPinSubmit={handlePinSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
            isOnline={isOnline}
          />
        )}
      </div>

      {/* Spodní zápatí kiosku */}
      <div className="text-center text-xs text-slate-500 max-w-sm mx-auto w-full pt-3 flex items-center justify-between">
        <span>Kípačky PWA</span>
        {statusData && (
          <span className="text-[11px] text-slate-400">
            Odhlášení za <strong className="text-sky-400">{secondsLeft} s</strong>
          </span>
        )}
        <span>Verze 1.0</span>
      </div>
    </div>
  );
};
