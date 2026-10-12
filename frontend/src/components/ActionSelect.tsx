import React, { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  ArrowLeft,
  Clock,
  UserCheck,
  PackagePlus,
  FileCheck2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Delete,
  Send,
  Coffee,
  Play,
  Briefcase,
  User,
  CreditCard,
  Phone,
  Mail,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  WifiOff,
  Zap,
} from 'lucide-react';
import { AttendanceStatusResponse, KioskMonthlySummary } from '../types';
import { fetchEmployeeMonthlySummary } from '../api/client';
import { DocumentViewerPage } from '../pages/DocumentViewerPage';

interface ActionSelectProps {
  statusData: AttendanceStatusResponse;
  pinCode?: string;
  onActionSubmit: (eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd') => void;
  onProductionSubmit: (orderId: number, operationId: number, pieces: number) => void;
  onDocumentConfirm: (documentId: number) => Promise<void>;
  onClaimShift: (shiftId: number) => Promise<void>;
  onReleaseShift: (shiftId: number) => Promise<void>;
  onProfileUpdate: (data: { phone?: string; email?: string; bankAccount?: string }) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
  isOnline?: boolean;
}

export const ActionSelect: React.FC<ActionSelectProps> = ({
  statusData,
  pinCode,
  onActionSubmit,
  onProductionSubmit,
  onDocumentConfirm,
  onClaimShift,
  onReleaseShift,
  onProfileUpdate,
  onBack,
  isSubmitting,
  errorMessage,
  isOnline = true,
}) => {
  const [subView, setSubView] = useState<
    'main' | 'production' | 'documents' | 'shifts' | 'profile' | 'monthly-summary'
  >('main');

  // State pro měsíční výkaz brigádníka (Fáze 8 / Zadání 04)
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState<number>(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState<number>(now.getMonth() + 1);
  const [summaryData, setSummaryData] = useState<KioskMonthlySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Vnitřní prohlížeč směrnice přímo v přihlášeném kiosku (bez opuštění PIN relace)
  const [readingDocId, setReadingDocId] = useState<number | null>(null);

  const loadMonthlySummary = async (yr: number, mo: number) => {
    if (!pinCode) return;
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await fetchEmployeeMonthlySummary(pinCode, yr, mo);
      setSummaryData(data);
    } catch (err: any) {
      setSummaryError(err.message || 'Nepodařilo se načíst měsíční výkaz.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleOpenMonthlySummary = () => {
    setSubView('monthly-summary');
    if (!summaryData) {
      loadMonthlySummary(summaryYear, summaryMonth);
    }
  };

  // State pro profil brigádníka (Fáze 5)
  const [profilePhone, setProfilePhone] = useState(statusData.phone || '');
  const [profileEmail, setProfileEmail] = useState(statusData.email || '');
  const [profileBank, setProfileBank] = useState(statusData.bankAccount || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [claimingShiftId, setClaimingShiftId] = useState<number | null>(null);

  // State pro zápis výroby (Fáze 2 & 2.1 – dynamické operace dle zakázky)
  const orders = statusData.activeOrders || [];
  const allOperations = statusData.activeOperations || [];
  const [selectedOrderId, setSelectedOrderId] = useState<number>(orders[0]?.id || 0);

  const availableOperations = allOperations.filter(
    (op) => !op.orderId || op.orderId === selectedOrderId
  );
  const [selectedOpId, setSelectedOpId] = useState<number>(availableOperations[0]?.id || 0);

  useEffect(() => {
    const validOps = allOperations.filter(
      (op) => !op.orderId || op.orderId === selectedOrderId
    );
    if (!validOps.some((op) => op.id === selectedOpId)) {
      setSelectedOpId(validOps[0]?.id || 0);
    }
  }, [selectedOrderId, allOperations]);

  const [piecesStr, setPiecesStr] = useState<string>('');
  const [confirmingDocId, setConfirmingDocId] = useState<number | null>(null);

  const isOnSite = statusData.status === 'OnSite';
  const isOnBreak = statusData.status === 'OnBreak';
  const isSuggestedIn = statusData.suggestedAction === 'ClockIn';

  const documents = statusData.documents || [];
  const pendingDocsCount = documents.filter((d) => d.needsConsent).length;
  const upcomingShifts = statusData.upcomingShifts || [];

  const formatLastTime = (timestampStr: string | null) => {
    if (!timestampStr) return null;
    try {
      const d = new Date(timestampStr);
      return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const lastTimeFormatted = formatLastTime(statusData.lastEventTimestamp);

  const handleDigit = (digit: string) => {
    if (piecesStr.length < 5) {
      setPiecesStr((prev) => (prev === '0' ? digit : prev + digit));
    }
  };

  const handleAddQuick = (addAmount: number) => {
    const current = parseInt(piecesStr || '0', 10);
    setPiecesStr(String(current + addAmount));
  };

  const handleProdFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pcs = parseInt(piecesStr || '0', 10);
    if (!selectedOrderId || !selectedOpId || pcs <= 0) return;
    onProductionSubmit(selectedOrderId, selectedOpId, pcs);
  };

  const handleConfirmDoc = async (docId: number) => {
    setConfirmingDocId(docId);
    try {
      await onDocumentConfirm(docId);
    } finally {
      setConfirmingDocId(null);
    }
  };

  // ====================================================
  // POHLED 2: ZÁPIS VÝROBY (FÁZE 2)
  // ====================================================
  if (subView === 'production') {
    const selectedOp = availableOperations.find((o) => o.id === selectedOpId);
    const piecesNum = parseInt(piecesStr || '0', 10);

    return (
      <div className="flex flex-col w-full max-w-[440px] mx-auto px-1 select-none">
        <div className="bg-[#193F34] border border-[#426456] rounded-[20px] p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#C9DDD0] hover:text-[#193F34] hover:bg-[#D7BE97] px-2.5 py-1.5 rounded-[10px] bg-[#285446] border border-[#426456] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base sm:text-lg font-heading font-bold text-[#F7F3E9] flex items-center gap-1.5">
              <PackagePlus className="w-5 h-5 text-[#D7BE97]" />
              Zapsat výrobu
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#FFE0DE] bg-[#A53F4E]/20 hover:bg-[#A53F4E]/35 px-2.5 py-1.5 rounded-[10px] border border-[#A53F4E]/50 cursor-pointer transition-colors"
              title="Okamžitě se odhlásit a zavřít terminál"
            >
              <LogOut className="w-3.5 h-3.5" />
              Odhlásit
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 px-3 py-2 bg-[#A53F4E]/20 border border-[#A53F4E] rounded-[12px] text-[#FFE0DE] text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleProdFormSubmit} className="space-y-4">
            {/* 1. Vyberte zakázku (sekce 9.2) */}
            <div>
              <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] mb-1.5">
                1. Vyberte zakázku
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-[#102E26] border border-[#426456] rounded-[12px] text-[#F7F3E9] font-medium text-sm focus:outline-none focus:border-[#D7BE97]"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id} className="bg-[#102E26] text-[#F7F3E9]">
                    {ord.name} {ord.targetPieces && ord.targetPieces > 0 ? `(Cíl: ${ord.completedPieces || 0} / ${ord.targetPieces} ks)` : ''}
                  </option>
                ))}
              </select>

              {/* Informace o cílovém objemu a rozpracovanosti (sekce 9.3) */}
              {(() => {
                const currentOrder = orders.find((o) => o.id === selectedOrderId);
                if (!currentOrder || !currentOrder.targetPieces || currentOrder.targetPieces <= 0) return null;
                const percent = Math.min(100, currentOrder.percentDone || 0);

                return (
                  <div className="mt-2.5 p-3 rounded-[12px] bg-[#102E26] border border-[#426456] text-xs">
                    <div className="flex items-center justify-between text-[#C9DDD0] mb-1.5 font-medium">
                      <span>Postup plnění zakázky:</span>
                      <span className="font-mono font-bold text-[#D7BE97]">
                        {currentOrder.completedPieces || 0} / {currentOrder.targetPieces} ks ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#285446] rounded-full h-2.5 overflow-hidden mb-1">
                      <div
                        className="bg-[#D7BE97] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {currentOrder.deadline && (
                      <div className="text-[11px] text-[#D7BE97]/90 flex items-center gap-1 mt-1 font-medium">
                        <Clock className="w-3 h-3 text-[#D7BE97]" />
                        Termín dokončení: {new Date(currentOrder.deadline).toLocaleDateString('cs-CZ')}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 2. Vyberte operaci (vázáno na zakázku dle Fáze 2.1) */}
            <div>
              <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] mb-1.5">
                2. Vyberte operaci pro vybranou zakázku
              </label>
              {availableOperations.length === 0 ? (
                <div className="p-3 bg-[#102E26] border border-[#426456] rounded-[12px] text-xs text-[#C9DDD0] text-center font-medium">
                  Pro tuto zakázku nejsou definovány žádné specifické operace.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableOperations.map((op) => {
                    const isSel = op.id === selectedOpId;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setSelectedOpId(op.id)}
                        className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer min-h-[64px] flex flex-col justify-between ${
                          isSel
                            ? 'bg-[#285446] border-2 border-[#D7BE97] text-[#F7F3E9] shadow-md'
                            : 'bg-[#102E26] border-[#426456] text-[#F7F3E9] hover:bg-[#285446]/50'
                        }`}
                      >
                        <div className="font-heading font-bold text-xs leading-tight mb-1">{op.name}</div>
                        <div className="text-[11px] text-[#D7BE97] font-mono font-bold">
                          {op.ratePerPiece.toFixed(2)} Kč/ks • {op.normPerHour} ks/h
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Počet vyrobených kusů (sekce 9.5 & 9.6) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0]">
                  3. Počet vyrobených kusů
                </label>
                {selectedOp && piecesNum > 0 && (
                  <span className="text-xs text-[#D7BE97] font-mono font-semibold">
                    ≈ {(piecesNum / selectedOp.normPerHour).toFixed(2)} normohodin
                  </span>
                )}
              </div>

              <div className="bg-[#102E26] border border-[#426456] rounded-[14px] py-3 px-4 text-center mb-2.5 shadow-inner">
                <span className="text-3xl sm:text-[38px] font-heading font-extrabold font-mono text-[#F7F3E9] tracking-wider">
                  {piecesStr || '0'}
                </span>
                <span className="text-sm font-sans font-medium text-[#C9DDD0] ml-2">ks</span>
              </div>

              {/* Rychlé přičítání (sekce 9.6) */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[10, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddQuick(val)}
                    className="py-2.5 rounded-[10px] bg-[#285446] hover:bg-[#285446]/80 border border-[#426456] text-[#D7BE97] font-heading font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                  >
                    +{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPiecesStr('')}
                  className="py-2.5 rounded-[10px] bg-[#432F32] hover:bg-[#52393d] border border-[#52393d] text-[#FFE0DE] font-heading font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  Vynulovat
                </button>
              </div>

              {/* Kompaktní numerická klávesnice (sekce 9.7) */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigit(d)}
                    className="h-[52px] rounded-[12px] bg-[#102E26] hover:bg-[#285446] active:bg-[#285446] active:border-[#D7BE97] border border-[#426456] text-[#F7F3E9] font-heading font-bold text-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPiecesStr('')}
                  className="h-[52px] rounded-[12px] bg-[#102E26]/80 hover:bg-[#285446] border border-[#426456] text-[#C9DDD0] font-heading font-semibold text-xs cursor-pointer flex items-center justify-center"
                >
                  Smazat
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-[52px] rounded-[12px] bg-[#102E26] hover:bg-[#285446] active:bg-[#285446] active:border-[#D7BE97] border border-[#426456] text-[#F7F3E9] font-heading font-bold text-xl cursor-pointer flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPiecesStr((p) => p.slice(0, -1))}
                  className="h-[52px] rounded-[12px] bg-[#102E26]/80 hover:bg-[#285446] border border-[#426456] text-[#C9DDD0] flex items-center justify-center cursor-pointer"
                  title="Smazat poslední číslici"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 8. Odeslat výrobu (sekce 9.8) */}
            <button
              type="submit"
              disabled={isSubmitting || piecesNum <= 0 || !selectedOrderId || !selectedOpId}
              className="w-full h-[62px] rounded-[14px] bg-[#9B623F] hover:bg-[#ad6e47] disabled:bg-[#43574E] disabled:text-[#ADBDB3] text-white font-heading font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? 'Ukládám...' : `Odeslat výrobu (${piecesNum} ks)`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ====================================================
  // POHLED 3: DOKUMENTY BOZP K PODPISU (FÁZE 3)
  // ====================================================
  if (subView === 'documents') {
    if (readingDocId) {
      return (
        <div className="w-full max-w-3xl mx-auto px-2">
          <DocumentViewerPage
            documentId={readingDocId}
            onBack={() => setReadingDocId(null)}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full max-w-[440px] mx-auto px-1 select-none">
        <div className="bg-[#193F34] border border-[#426456] rounded-[20px] p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#C9DDD0] hover:text-[#193F34] hover:bg-[#D7BE97] px-2.5 py-1.5 rounded-[10px] bg-[#285446] border border-[#426456] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-heading font-bold text-[#F7F3E9] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#D7BE97]" />
              Směrnice a BOZP
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#FFE0DE] bg-[#A53F4E]/20 hover:bg-[#A53F4E]/35 px-2.5 py-1.5 rounded-[10px] border border-[#A53F4E]/50 cursor-pointer transition-colors"
              title="Okamžitě se odhlásit a zavřít terminál"
            >
              <LogOut className="w-3.5 h-3.5" />
              Odhlásit
            </button>
          </div>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-[16px] border ${
                  doc.needsConsent
                    ? 'bg-[#8E4B2F]/15 border-[#B96543]'
                    : 'bg-[#102E26] border-[#426456]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading font-bold text-sm text-[#F7F3E9]">{doc.title}</h3>
                  {doc.needsConsent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A53F4E]/25 text-[#FFE0DE] border border-[#A53F4E] whitespace-nowrap">
                      Nutné potvrdit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#16634D]/40 text-[#34C790]">
                      <CheckCircle2 className="w-3 h-3" />
                      Platné
                    </span>
                  )}
                </div>

                <div className="bg-[#193F34] p-3 rounded-[12px] border border-[#426456] mb-3 space-y-2">
                  <p className="text-xs text-[#C9DDD0] leading-relaxed whitespace-pre-line">
                    {doc.shortText || doc.content}
                  </p>

                  {doc.hasFullText && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#426456]/60 w-full gap-2">
                      <button
                        type="button"
                        onClick={() => setReadingDocId(doc.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold text-[#D7BE97] hover:underline transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#D7BE97]" />
                        <span>Číst plné znění směrnice</span>
                      </button>
                      <a
                        href={`./?doc=${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#C9DDD0]/60 hover:text-[#D7BE97] flex items-center gap-1"
                        title="Otevřít v nové záložce"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {doc.lastAgreedAt && (
                  <div className="text-[11px] text-[#C9DDD0] mb-2 font-mono">
                    Naposledy potvrzeno:{' '}
                    <strong className="text-[#F7F3E9]">
                      {new Date(doc.lastAgreedAt).toLocaleDateString('cs-CZ')}{' '}
                      {new Date(doc.lastAgreedAt).toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                )}

                <button
                  type="button"
                  disabled={confirmingDocId === doc.id}
                  onClick={() => handleConfirmDoc(doc.id)}
                  className={`w-full py-2.5 px-4 rounded-[12px] font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    doc.needsConsent
                      ? 'bg-[#16634D] hover:bg-[#1d775d] text-white shadow-md'
                      : 'bg-[#285446] hover:bg-[#D7BE97] hover:text-[#193F34] text-[#F7F3E9]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {confirmingDocId === doc.id
                    ? 'Ukládám podpis...'
                    : 'Potvrzuji seznámení s dokumentem'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // POHLED 4: BURZA VOLNÝCH SMĚN (FÁZE 5)
  // ====================================================
  if (subView === 'shifts') {
    const openShifts = statusData.openShifts || [];

    const handleClaim = async (shiftId: number) => {
      setClaimingShiftId(shiftId);
      try {
        await onClaimShift(shiftId);
      } finally {
        setClaimingShiftId(null);
      }
    };

    const handleRelease = async (shiftId: number) => {
      setClaimingShiftId(shiftId);
      try {
        await onReleaseShift(shiftId);
      } finally {
        setClaimingShiftId(null);
      }
    };

    return (
      <div className="flex flex-col w-full max-w-[440px] mx-auto px-1 select-none">
        <div className="bg-[#193F34] border border-[#426456] rounded-[20px] p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#C9DDD0] hover:text-[#193F34] hover:bg-[#D7BE97] px-2.5 py-1.5 rounded-[10px] bg-[#285446] border border-[#426456] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-heading font-bold text-[#F7F3E9] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D7BE97]" />
              Směny & Samoobslužná burza
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#FFE0DE] bg-[#A53F4E]/20 hover:bg-[#A53F4E]/35 px-2.5 py-1.5 rounded-[10px] border border-[#A53F4E]/50 cursor-pointer transition-colors"
              title="Okamžitě se odhlásit a zavřít terminál"
            >
              <LogOut className="w-3.5 h-3.5" />
              Odhlásit
            </button>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Moje naplánované směny */}
            <div>
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34C790]" />
                Moje přihlášené směny ({upcomingShifts.length})
              </h3>
              {upcomingShifts.length === 0 ? (
                <div className="text-xs text-[#C9DDD0]/70 bg-[#102E26] p-3 rounded-[12px] border border-[#426456] text-center font-medium">
                  Nemáte naplánovanou žádnou směnu.
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingShifts.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-[#102E26] border border-[#426456] rounded-[12px] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-heading font-bold text-[#F7F3E9]">
                          {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'numeric',
                          })}
                          <span className="ml-2 font-mono text-[#D7BE97]">
                            {s.startTime} – {s.endTime}
                          </span>
                        </div>
                        {s.orderName && (
                          <div className="text-[11px] text-[#C9DDD0] mt-0.5">
                            Zakázka: {s.orderName}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={claimingShiftId === s.id}
                        onClick={() => handleRelease(s.id)}
                        className="px-2.5 py-1 rounded-[8px] bg-[#432F32] hover:bg-[#52393d] border border-[#52393d] text-[#FFE0DE] text-xs font-heading font-semibold cursor-pointer transition-colors"
                      >
                        {claimingShiftId === s.id ? 'Odlašuji...' : 'Uvolnit směnu'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Volné směny k rozebrání */}
            <div>
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#D7BE97] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D7BE97]" />
                Volné směny na burze ({openShifts.length})
              </h3>
              {openShifts.length === 0 ? (
                <div className="text-xs text-[#C9DDD0]/70 bg-[#102E26] p-3 rounded-[12px] border border-[#426456] text-center font-medium">
                  V této chvíli nejsou vypsány žádné volné směny.
                </div>
              ) : (
                <div className="space-y-2">
                  {openShifts.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-[#285446] border border-[#D7BE97]/40 rounded-[12px] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-heading font-bold text-[#F7F3E9]">
                          {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'numeric',
                          })}
                          <span className="ml-2 font-mono text-[#D7BE97]">
                            {s.startTime} – {s.endTime}
                          </span>
                        </div>
                        {s.orderName && (
                          <div className="text-[11px] text-[#C9DDD0] mt-0.5">
                            Zakázka: {s.orderName}
                          </div>
                        )}
                        {s.note && (
                          <div className="text-[11px] text-[#C9DDD0]/80 italic mt-0.5">
                            {s.note}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={claimingShiftId === s.id}
                        onClick={() => handleClaim(s.id)}
                        className="px-3 py-1.5 rounded-[10px] bg-[#D7BE97] hover:bg-[#c9b089] text-[#193F34] text-xs font-heading font-bold shadow-sm cursor-pointer transition-colors"
                      >
                        {claimingShiftId === s.id ? 'Zapisuji...' : 'Přihlásit se'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // POHLED 5: OSOBNÍ PROFIL A ČÍSLO ÚČTU (FÁZE 5)
  // ====================================================
  if (subView === 'profile') {
    const handleProfileSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await onProfileUpdate({
          phone: profilePhone,
          email: profileEmail,
          bankAccount: profileBank,
        });
        setProfileSuccessMsg('Údaje byly úspěšně uloženy a potvrzeny.');
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } catch (err: any) {
        // handled in parent or message
      }
    };

    return (
      <div className="flex flex-col w-full max-w-[440px] mx-auto px-1 select-none">
        <div className="bg-[#193F34] border border-[#426456] rounded-[20px] p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#C9DDD0] hover:text-[#193F34] hover:bg-[#D7BE97] px-2.5 py-1.5 rounded-[10px] bg-[#285446] border border-[#426456] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-heading font-bold text-[#F7F3E9] flex items-center gap-2">
              <User className="w-5 h-5 text-[#D7BE97]" />
              Můj profil & Výplata
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#FFE0DE] bg-[#A53F4E]/20 hover:bg-[#A53F4E]/35 px-2.5 py-1.5 rounded-[10px] border border-[#A53F4E]/50 cursor-pointer transition-colors"
              title="Okamžitě se odhlásit a zavřít terminál"
            >
              <LogOut className="w-3.5 h-3.5" />
              Odhlásit
            </button>
          </div>

          {profileSuccessMsg && (
            <div className="mb-4 px-3 py-2 bg-[#16634D]/30 border border-[#16634D] rounded-[12px] text-[#34C790] text-xs text-center flex items-center justify-center gap-1.5 font-medium">
              <Check className="w-4 h-4" />
              {profileSuccessMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#D7BE97]" />
                Číslo bankovního účtu (pro výplatu)
              </label>
              <input
                type="text"
                required
                placeholder="např. 1234567890/0100"
                value={profileBank}
                onChange={(e) => setProfileBank(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#102E26] border border-[#426456] rounded-[10px] text-[#F7F3E9] font-mono text-sm focus:outline-none focus:border-[#D7BE97]"
              />
              <span className="text-[11px] text-[#C9DDD0]/70 mt-1 block">
                Zadejte účet včetně kódu banky (např. 19-123456789/0800).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#D7BE97]" />
                  Telefon
                </label>
                <input
                  type="text"
                  placeholder="+420 777 123 456"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#102E26] border border-[#426456] rounded-[10px] text-[#F7F3E9] text-xs focus:outline-none focus:border-[#D7BE97]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D7BE97]" />
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="brigadnik@email.cz"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#102E26] border border-[#426456] rounded-[10px] text-[#F7F3E9] text-xs focus:outline-none focus:border-[#D7BE97]"
                />
              </div>
            </div>

            {statusData.personalDataConfirmedAt ? (
              <div className="p-3 rounded-[12px] bg-[#16634D]/20 border border-[#16634D]/40 text-xs text-[#34C790] font-medium">
                Údaje byly naposledy potvrzeny dne{' '}
                <strong className="text-[#F7F3E9]">
                  {new Date(statusData.personalDataConfirmedAt).toLocaleDateString('cs-CZ')}{' '}
                  {new Date(statusData.personalDataConfirmedAt).toLocaleTimeString('cs-CZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
                .
              </div>
            ) : (
              <div className="p-3 rounded-[12px] bg-[#835614]/20 border border-[#835614] text-xs text-[#FFF1D7] font-medium">
                ⚠️ Zatím jste nepotvrdili své platební údaje. Prosím zkontrolujte a uložte.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !profileBank.trim()}
              className="w-full py-3.5 rounded-[12px] bg-[#16634D] hover:bg-[#1d775d] disabled:bg-[#43574E] disabled:text-[#ADBDB3] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Ukládám...' : 'Potvrdit a uložit platební profil'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ====================================================
  // POHLED 6: MĚSÍČNÍ VÝKAZ PRO BRIGÁDNÍKA (ZADÁNÍ 04)
  // ====================================================
  if (subView === 'monthly-summary') {
    const isDpp = statusData.contractType === 'DPP';
    const ytdNorm = summaryData?.yearToDateNormHours ?? summaryData?.yearToDateNetHours ?? 0;
    const normH = summaryData?.totalNormHours ?? summaryData?.totalProductiveHours ?? 0;
    const dppDanger = isDpp && ytdNorm >= 290;
    const dppWarning = isDpp && ytdNorm >= 250 && ytdNorm < 290;

    return (
      <div className="flex flex-col w-full max-w-[460px] mx-auto px-1 select-none">
        <div className="bg-[#193F34] border border-[#426456] rounded-[20px] p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#C9DDD0] hover:text-[#193F34] hover:bg-[#D7BE97] px-2.5 py-1.5 rounded-[10px] bg-[#285446] border border-[#426456] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-heading font-bold text-[#F7F3E9] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D7BE97]" />
              Můj měsíční výkaz
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#FFE0DE] bg-[#A53F4E]/20 hover:bg-[#A53F4E]/35 px-2.5 py-1.5 rounded-[10px] border border-[#A53F4E]/50 cursor-pointer transition-colors"
              title="Okamžitě se odhlásit a zavřít terminál"
            >
              <LogOut className="w-3.5 h-3.5" />
              Odhlásit
            </button>
          </div>

          {/* Přepínač měsíce a roku */}
          <div className="flex items-center justify-between bg-[#102E26] p-2.5 rounded-[12px] border border-[#426456] mb-4 gap-2">
            <div className="text-xs font-medium text-[#C9DDD0]">
              Období:{' '}
              <span className="text-[#F7F3E9] font-heading font-bold capitalize">
                {new Date(summaryYear, summaryMonth - 1, 1).toLocaleDateString('cs-CZ', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const newMo = summaryMonth === 1 ? 12 : summaryMonth - 1;
                  const newYr = summaryMonth === 1 ? summaryYear - 1 : summaryYear;
                  setSummaryMonth(newMo);
                  setSummaryYear(newYr);
                  loadMonthlySummary(newYr, newMo);
                }}
                className="px-2.5 py-1 rounded-[8px] bg-[#285446] hover:bg-[#D7BE97] hover:text-[#193F34] text-[#F7F3E9] text-xs font-heading font-bold cursor-pointer transition-colors"
              >
                ◀ Předchozí
              </button>
              <button
                type="button"
                onClick={() => {
                  const newMo = summaryMonth === 12 ? 1 : summaryMonth + 1;
                  const newYr = summaryMonth === 12 ? summaryYear + 1 : summaryYear;
                  setSummaryMonth(newMo);
                  setSummaryYear(newYr);
                  loadMonthlySummary(newYr, newMo);
                }}
                className="px-2.5 py-1 rounded-[8px] bg-[#285446] hover:bg-[#D7BE97] hover:text-[#193F34] text-[#F7F3E9] text-xs font-heading font-bold cursor-pointer transition-colors"
              >
                Další ▶
              </button>
            </div>
          </div>

          {/* Stav limitu DPP na základě Normočasu (Fáze 2.3) */}
          {isDpp && (
            <div
              className={`p-3 rounded-[12px] border mb-4 text-xs flex items-center justify-between ${
                dppDanger
                  ? 'bg-[#A53F4E]/20 border-[#A53F4E] text-[#FFE0DE]'
                  : dppWarning
                    ? 'bg-[#835614]/25 border-[#835614] text-[#FFF1D7]'
                    : 'bg-[#16634D]/25 border-[#16634D] text-[#34C790]'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Limit DPP (Normočas):</strong> {ytdNorm.toFixed(1)} / 300 h
                  <span className="text-[11px] text-[#C9DDD0] block">
                    Zbývá do limitu: <strong>{Math.max(0, 300 - ytdNorm).toFixed(1)} h</strong>
                  </span>
                </span>
              </div>
              <span className="font-heading font-bold">
                {dppDanger
                  ? 'Kritický stav'
                  : dppWarning
                    ? 'Blíží se limitu'
                    : 'V normě'}
              </span>
            </div>
          )}

          {summaryError && (
            <div className="p-3 mb-4 rounded-[12px] bg-[#A53F4E]/20 border border-[#A53F4E] text-[#FFE0DE] text-xs text-center font-medium">
              {summaryError}
            </div>
          )}

          {loadingSummary ? (
            <div className="py-12 text-center text-xs text-[#D7BE97] font-medium">
              Načítám docházku a schválenou výrobu...
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              {/* Přehledové karty součtů */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-[#102E26] border border-[#426456] rounded-[12px]">
                  <div className="text-[10px] uppercase font-heading font-bold text-[#C9DDD0]">Čistý čas</div>
                  <div className="text-base font-extrabold text-[#F7F3E9] font-mono mt-0.5 tabular-nums">
                    {summaryData.totalNetHours.toFixed(1)} h
                  </div>
                </div>
                <div className="p-2.5 bg-[#102E26] border border-[#426456] rounded-[12px]">
                  <div className="text-[10px] uppercase font-heading font-bold text-[#D7BE97]">Normočas</div>
                  <div className="text-base font-extrabold text-[#D7BE97] font-mono mt-0.5 tabular-nums">
                    {normH.toFixed(1)} h
                  </div>
                </div>
                <div className="p-2.5 bg-[#102E26] border border-[#426456] rounded-[12px]">
                  <div className="text-[10px] uppercase font-heading font-bold text-[#C9DDD0]">Schváleno ks</div>
                  <div className="text-base font-extrabold text-[#F7F3E9] font-mono mt-0.5 tabular-nums">
                    {summaryData.totalApprovedPieces} ks
                  </div>
                </div>
                <div className="p-2.5 bg-[#285446] border border-[#D7BE97]/50 rounded-[12px]">
                  <div className="text-[10px] uppercase font-heading font-bold text-[#D7BE97]">Výdělek</div>
                  <div className="text-base font-extrabold text-[#34C790] font-mono mt-0.5 tabular-nums">
                    {summaryData.totalEarnedCzk.toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
              </div>

              {/* Tabulka jednotlivých směn */}
              <div className="max-h-64 overflow-y-auto rounded-[12px] border border-[#426456] bg-[#102E26]">
                {summaryData.shifts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#C9DDD0]/70">
                    V tomto měsíci zatím nemáte žádné zaevidované směny.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#193F34] text-[10px] uppercase text-[#C9DDD0] sticky top-0 border-b border-[#426456]">
                      <tr>
                        <th className="py-2.5 px-2.5">Datum</th>
                        <th className="py-2.5 px-2">Čas v práci</th>
                        <th className="py-2.5 px-2 text-center">Čisté h</th>
                        <th className="py-2.5 px-2 text-right">Schváleno</th>
                        <th className="py-2.5 px-2.5 text-right">Výdělek</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#426456]/50 font-mono">
                      {summaryData.shifts.map((s, idx) => {
                        const inDate = new Date(s.clockInTime);
                        const outDate = s.clockOutTime ? new Date(s.clockOutTime) : null;
                        return (
                          <tr key={idx} className="hover:bg-[#285446]/40 transition-colors">
                            <td className="py-2 px-2.5 text-[#F7F3E9]">
                              {inDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                            </td>
                            <td className="py-2 px-2 text-[#C9DDD0] text-[11px]">
                              {inDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                              {' – '}
                              {outDate
                                ? outDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
                                : <span className="text-[#FFE0DE] bg-[#432F32] px-1 py-0.5 rounded font-bold">Chybí odchod</span>}
                            </td>
                            <td className="py-2 px-2 text-center text-[#D7BE97] tabular-nums">
                              {s.isIncomplete ? '—' : `${(s.netHours || 0).toFixed(1)} h`}
                            </td>
                            <td className="py-2 px-2 text-right text-[#F7F3E9] tabular-nums">
                              {s.approvedPieces || 0} ks
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-[#34C790] tabular-nums">
                              {(s.earnedCzk || 0).toLocaleString('cs-CZ')} Kč
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ====================================================
  // POHLED 1: HLAVNÍ ROZCESTNÍK BRIGÁDNÍKA
  // ====================================================
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[440px] mx-auto px-1 select-none">
      {/* Karta s informacemi o zaměstnanci (sekce 8.4 A) */}
      <div className="w-full bg-[#193F34] border border-[#426456] rounded-[16px] p-5 mb-4 shadow-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#285446] text-[#D7BE97] mb-2 shadow-inner">
          <UserCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-[22px] font-heading font-extrabold text-[#F7F3E9] mb-1.5">
          {statusData.fullName}
        </h2>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
          <span className="text-xs px-2.5 py-0.5 rounded-[8px] bg-[#285446] text-[#D7BE97] font-heading font-bold border border-[#426456]">
            {statusData.contractType}
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-[8px] font-heading font-bold ${
              isOnSite
                ? 'bg-[#16634D]/50 text-[#34C790] border border-[#16634D]'
                : isOnBreak
                  ? 'bg-[#835614]/40 text-[#FFF1D7] border border-[#835614]'
                  : 'bg-[#285446]/60 text-[#C9DDD0] border border-[#426456]'
            }`}
          >
            {isOnSite
              ? '● Na pracovišti'
              : isOnBreak
                ? '☕ Na přestávce'
                : '○ Mimo pracoviště'}
          </span>
          {(statusData.todaySubmittedPieces ?? 0) > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-[8px] bg-[#285446] text-[#D7BE97] border border-[#426456] font-mono font-bold">
              Dnes: {statusData.todaySubmittedPieces} ks
            </span>
          )}
        </div>

        {lastTimeFormatted && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#C9DDD0]">
            <Clock className="w-3.5 h-3.5 text-[#D7BE97]" />
            <span>
              Poslední záznam (
              {statusData.lastEventType === 'ClockIn'
                ? 'příchod'
                : statusData.lastEventType === 'BreakStart'
                  ? 'začátek přestávky'
                  : statusData.lastEventType === 'BreakEnd'
                    ? 'konec přestávky'
                    : 'odchod'}
              ): <strong className="text-[#F7F3E9] font-mono">{lastTimeFormatted}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Informační karta BOZP (sekce 8.4 B) */}
      {pendingDocsCount > 0 ? (
        <button
          type="button"
          onClick={() => setSubView('documents')}
          className="w-full mb-4 px-4 py-3 bg-[#8E4B2F]/20 hover:bg-[#8E4B2F]/30 border-2 border-[#B96543] rounded-[16px] flex items-center justify-between text-left transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D7BE97] shrink-0" />
            <div>
              <div className="text-xs font-heading font-bold text-[#F7F3E9]">
                Dokumenty k podpisu ({pendingDocsCount})
              </div>
              <div className="text-[11px] text-[#FFE0DE]">
                Klikněte pro potvrzení seznámení s BOZP
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-[8px] bg-[#B96543] text-white text-xs font-heading font-bold">
            Otevřít
          </span>
        </button>
      ) : (
        documents.length > 0 && (
          <button
            type="button"
            onClick={() => setSubView('documents')}
            className="w-full mb-3 px-3.5 py-2.5 bg-[#285446] hover:bg-[#285446]/80 border border-[#426456] rounded-[14px] flex items-center justify-between text-xs text-[#F7F3E9] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <FileCheck2 className="w-4 h-4 text-[#D7BE97]" />
              Směrnice a BOZP (vše potvrzeno)
            </span>
            <span className="text-[#D7BE97] font-heading font-bold text-xs">Zobrazit →</span>
          </button>
        )
      )}

      {/* Offline upozornění */}
      {!isOnline && (
        <div className="w-full mb-4 p-3 bg-[#8E4B2F]/20 border border-[#B96543] rounded-[14px] flex items-center justify-center gap-2 text-[#FFE0DE] text-xs font-semibold shadow-sm">
          <Zap className="w-4 h-4 text-[#D7BE97] shrink-0" />
          <span>Offline režim – Záznam se uloží do telefonu a odešle po obnovení signálu.</span>
        </div>
      )}

      {/* Chybová hláška */}
      {errorMessage && (
        <div className="w-full mb-4 px-4 py-2.5 bg-[#A53F4E]/20 border border-[#A53F4E] rounded-[12px] text-[#FFE0DE] text-sm font-semibold text-center">
          {errorMessage}
        </div>
      )}

      {/* Akční tlačítka: Příchod, Odchod, Přestávka, Zapsat výrobu (sekce 8.4 C & D) */}
      <div className="flex flex-col gap-3 w-full mb-4">
        {/* Tlačítko PŘÍCHOD (sekce 8.4 C: #16634D, výška 72 px, radius 16 px) */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onActionSubmit('ClockIn')}
          className={`w-full h-[72px] px-6 rounded-[16px] font-heading font-extrabold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50 ${
            isSuggestedIn
              ? 'bg-[#16634D] hover:bg-[#1d775d] text-white shadow-lg shadow-[#16634D]/30 border-2 border-[#34C790]/50'
              : 'bg-[#285446] hover:bg-[#285446]/80 text-[#C9DDD0] border border-[#426456]'
          }`}
        >
          <LogIn className="w-6 h-6 text-white" />
          <span>PŘÍCHOD</span>
        </button>

        {/* Tlačítko ZAČÁTEK / KONEC PŘESTÁVKY (zachováno dle dohody v jantarovém odstínu pauzy #835614) */}
        {(isOnSite || isOnBreak) && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onActionSubmit(isOnBreak ? 'BreakEnd' : 'BreakStart')}
            className={`w-full h-[64px] px-6 rounded-[16px] font-heading font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50 ${
              isOnBreak
                ? 'bg-[#835614] hover:bg-[#996517] text-white border-2 border-[#D7BE97]/60'
                : 'bg-[#835614]/80 hover:bg-[#835614] text-[#FFF1D7] border border-[#835614]'
            }`}
          >
            {isOnBreak ? (
              <>
                <Play className="w-5 h-5 text-[#D7BE97]" />
                <span>KONEC PŘESTÁVKY (NÁVRAT)</span>
              </>
            ) : (
              <>
                <Coffee className="w-5 h-5 text-[#D7BE97]" />
                <span>ZAČÁTEK PŘESTÁVKY</span>
              </>
            )}
          </button>
        )}

        {/* Tlačítko ODCHOD (sekce 8.4 C: #432F32, text #FFE0DE, výška 72 px, radius 16 px) */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onActionSubmit('ClockOut')}
          className={`w-full h-[72px] px-6 rounded-[16px] font-heading font-extrabold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50 ${
            !isSuggestedIn && !isOnBreak
              ? 'bg-[#432F32] hover:bg-[#52393d] text-[#FFE0DE] border-2 border-[#8E4B2F]/60 shadow-lg'
              : 'bg-[#432F32]/80 hover:bg-[#432F32] text-[#FFE0DE] border border-[#52393d]'
          }`}
        >
          <LogOut className="w-6 h-6 text-[#FFE0DE]" />
          <span>ODCHOD</span>
        </button>

        {/* Tlačítko ZAPSAT VÝROBU (sekce 8.4 D: #9B623F měděná, výška 68 px, radius 16 px) */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setSubView('production')}
          className="w-full h-[68px] px-6 rounded-[16px] font-heading font-extrabold text-lg flex items-center justify-center gap-3 bg-[#9B623F] hover:bg-[#ad6e47] text-white shadow-lg transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
        >
          <PackagePlus className="w-6 h-6 text-white" />
          <span>ZAPSAT VÝROBU (KUSY)</span>
        </button>

        {/* Tlačítka Burza směn a Profil & Výplata (sekce 8.4 E) */}
        <div className="grid grid-cols-2 gap-2.5 mt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setSubView('shifts')}
            className="py-3.5 px-3 rounded-[14px] bg-[#285446] hover:bg-[#285446]/80 border border-[#426456] text-[#F7F3E9] font-heading font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#D7BE97] shrink-0" />
            <span>Burza směn {(statusData.openShifts?.length || 0) > 0 ? `(${statusData.openShifts?.length})` : ''}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setSubView('profile')}
            className="py-3.5 px-3 rounded-[14px] bg-[#D7BE97] hover:bg-[#c9b089] text-[#193F34] font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-[#193F34] shrink-0" />
            <span>Profil & Výplata</span>
            {!statusData.personalDataConfirmedAt && (
              <span className="w-2 h-2 rounded-full bg-[#8E4B2F] shrink-0" />
            )}
          </button>
        </div>

        {/* Tlačítko Můj měsíční výkaz (sekce 8.4 F) */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleOpenMonthlySummary}
          className="w-full mt-2 py-3.5 px-4 rounded-[14px] bg-[#193F34] hover:bg-[#285446] border border-[#426456] text-[#F7F3E9] font-heading font-semibold text-xs flex items-center justify-between cursor-pointer transition-colors shadow-sm"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#D7BE97]" />
            <span>Můj měsíční výkaz (hodiny a výdělek)</span>
          </span>
          <span className="text-[#D7BE97] font-heading font-bold text-xs">Zobrazit →</span>
        </button>
      </div>

      {/* Moje nejbližší směny */}
      {upcomingShifts.length > 0 && (
        <div className="w-full bg-[#193F34] border border-[#426456] rounded-[16px] p-4 mb-4 text-left shadow-sm">
          <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#C9DDD0] flex items-center gap-1.5 mb-2.5">
            <Calendar className="w-3.5 h-3.5 text-[#D7BE97]" />
            Moje nejbližší směny
          </div>
          <div className="space-y-2">
            {upcomingShifts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-xs bg-[#102E26] px-3.5 py-2.5 rounded-[12px] border border-[#426456]"
              >
                <div>
                  <span className="font-heading font-bold text-[#F7F3E9]">
                    {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric',
                    })}
                  </span>
                  {s.orderName && (
                    <span className="ml-2 text-[#C9DDD0] text-[11px]">• {s.orderName}</span>
                  )}
                </div>
                <span className="font-mono font-bold text-[#D7BE97] tabular-nums">
                  {s.startTime} – {s.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tlačítko Odhlásit se a zavřít */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onBack}
        className="w-full mt-2 py-3 px-4 rounded-[14px] bg-[#8E4B2F]/20 hover:bg-[#8E4B2F]/40 border border-[#8E4B2F]/50 text-[#F7F3E9] font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4 text-[#D7BE97]" />
        <span>Odhlásit se a zavřít</span>
      </button>
    </div>
  );
};
