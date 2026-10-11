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
import { GREENBERG_LOGO } from '../assets/logoBase64';
import { APP_VERSION } from '../version';

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
    <div className="min-h-screen flex flex-col justify-between py-3 px-3 sm:py-4 sm:px-4 bg-[#102E26] text-[#F7F3E9] max-w-[460px] mx-auto w-full">
      {/* Toast notifikace o synchronizaci */}
      {syncToast && (
        <div className="w-full mb-3 bg-[#16634D] text-[#F7F3E9] font-heading font-bold py-2.5 px-4 rounded-[14px] shadow-xl flex items-center justify-between text-sm z-50 border border-[#34C790]/40">
          <span>{syncToast}</span>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-[#F7F3E9]/80 hover:text-white ml-2 text-xs font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vizuální offline varování při absenci signálu */}
      {!isOnline && (
        <div className="w-full mb-3 bg-[#8E4B2F] text-[#F7F3E9] font-heading font-bold py-2.5 px-4 rounded-[14px] shadow-xl flex items-center justify-between gap-2 border border-[#B96543] z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-[#D7BE97]" />
            <span className="text-xs sm:text-sm font-sans font-medium">
              Jste offline. Záznamy se ukládají do telefonu a odešlou po připojení.
            </span>
          </div>
        </div>
      )}

      {/* Horní stavová lišta (sekce 8.2) */}
      <div className="flex items-center justify-between w-full mb-2 sm:mb-3 px-3 py-2 rounded-[16px] bg-[#193F34] border border-[#426456] shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Logo Greenberg na světlém podkladu pro perfektní čitelnost textu */}
          <div className="bg-white/95 px-2 py-1 rounded-[8px] flex items-center justify-center shadow-xs">
            <img
              src={GREENBERG_LOGO}
              alt="Greenberg"
              className="h-6 w-auto object-contain shrink-0"
            />
          </div>
          <div className="h-6 w-px bg-[#426456]" />
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-[#34C790] shadow-sm shadow-[#34C790]/50' : 'bg-[#D7BE97]'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-heading font-bold tracking-wider uppercase text-[#F7F3E9] leading-tight">
                {isOnline ? 'DOCHÁZKA ONLINE' : 'OFFLINE FRONTA'}
              </span>
              <span className="text-[9.5px] text-[#C9DDD0]/80 font-medium leading-tight">
                Nepomuk
              </span>
            </div>
          </div>

          {/* Indikátor neodeslaných záznamů */}
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={triggerSync}
              disabled={isSyncing || !isOnline}
              className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D7BE97] text-[#193F34] hover:bg-[#D7BE97]/90 transition-colors cursor-pointer disabled:opacity-60"
              title="Klikněte pro odeslání čekajících záznamů"
            >
              <Zap className="w-3 h-3 text-[#193F34]" />
              <span>{offlineQueue.length}</span>
              {isSyncing && <RefreshCw className="w-2.5 h-2.5 animate-spin ml-0.5" />}
            </button>
          )}
        </div>

        {/* Pravá část hlavičky: Odpočet nečinnosti a Živý čas */}
        <div className="flex items-center gap-2 text-xs">
          {statusData && (
            <span
              onClick={resetInactivity}
              className={`px-2 py-0.5 rounded-[8px] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                secondsLeft <= 15
                  ? 'bg-[#A53F4E]/30 text-[#FFE0DE] border border-[#A53F4E]'
                  : 'bg-[#285446] text-[#D7BE97] border border-[#426456]'
              }`}
              title="Automatické odhlášení nečinnosti. Klikněte pro prodloužení."
            >
              <Clock className="w-3 h-3 text-[#D7BE97]" />
              <span>{secondsLeft}s</span>
            </span>
          )}

          <div className="flex items-center gap-1.5 tabular-nums font-mono text-[#F7F3E9] bg-[#285446] px-2.5 py-1 rounded-[8px] border border-[#426456] shadow-inner text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 text-[#D7BE97]" />
            <span className="capitalize font-sans font-medium text-[11px] text-[#C9DDD0]">
              {currentTime.toLocaleDateString('cs-CZ', {
                weekday: 'short',
                day: 'numeric',
                month: 'numeric',
              })}
            </span>
            <span className="text-[#F7F3E9] font-bold ml-0.5">
              {currentTime.toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Hlavní obsah podle stavu - kompaktnější vertikální vycentrování */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-1">
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
      <div className="text-center text-xs text-[#55645B] w-full pt-2 pb-1 flex items-center justify-between">
        <span>Kípačky • Greenberg</span>
        {statusData && (
          <span className="text-[11px] text-[#C9DDD0]">
            Odhlášení za <strong className="text-[#D7BE97]">{secondsLeft} s</strong>
          </span>
        )}
        <span>v{APP_VERSION} Nepomuk</span>
      </div>
    </div>
  );
};
