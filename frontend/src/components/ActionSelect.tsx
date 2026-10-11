import React, { useState } from 'react';
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

  // State pro zápis výroby (Fáze 2)
  const orders = statusData.activeOrders || [];
  const operations = statusData.activeOperations || [];
  const [selectedOrderId, setSelectedOrderId] = useState<number>(orders[0]?.id || 0);
  const [selectedOpId, setSelectedOpId] = useState<number>(operations[0]?.id || 0);
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
    const selectedOp = operations.find((o) => o.id === selectedOpId);
    const piecesNum = parseInt(piecesStr || '0', 10);

    return (
      <div className="flex flex-col w-full max-w-md mx-auto px-3 select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-indigo-400" />
              Zapsat výrobu
            </h2>
            <span className="text-xs text-slate-400">{statusData.fullName}</span>
          </div>

          {errorMessage && (
            <div className="mb-4 px-3 py-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleProdFormSubmit} className="space-y-4">
            {/* Krok 1: Zakázka */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                1. Vyberte zakázku
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.name} {ord.targetPieces && ord.targetPieces > 0 ? `(Cíl: ${ord.completedPieces || 0} / ${ord.targetPieces} ks)` : ''}
                  </option>
                ))}
              </select>

              {/* Informace o cílovém objemu a rozpracovanosti vybrané zakázky (Fáze 5) */}
              {(() => {
                const currentOrder = orders.find((o) => o.id === selectedOrderId);
                if (!currentOrder || !currentOrder.targetPieces || currentOrder.targetPieces <= 0) return null;
                const percent = Math.min(100, currentOrder.percentDone || 0);

                return (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-300 mb-1.5 font-medium">
                      <span>Postup plnění zakázky:</span>
                      <span className="font-mono font-bold text-sky-400">
                        {currentOrder.completedPieces || 0} / {currentOrder.targetPieces} ks ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {currentOrder.deadline && (
                      <div className="text-[11px] text-amber-300/80 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Termín dokončení: {new Date(currentOrder.deadline).toLocaleDateString('cs-CZ')}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Krok 2: Operace */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                2. Vyberte operaci
              </label>
              <div className="grid grid-cols-2 gap-2">
                {operations.map((op) => {
                  const isSel = op.id === selectedOpId;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setSelectedOpId(op.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSel
                          ? 'bg-indigo-600/25 border-indigo-400 text-white ring-1 ring-indigo-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="font-bold text-xs leading-tight mb-1">{op.name}</div>
                      <div className="text-[11px] text-indigo-300 font-mono">
                        {op.ratePerPiece.toFixed(2)} Kč/ks • {op.normPerHour} ks/h
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Krok 3: Počet hotových kusů */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  3. Počet hotových kusů
                </label>
                {selectedOp && piecesNum > 0 && (
                  <span className="text-xs text-indigo-300 font-mono">
                    ≈ {(piecesNum / selectedOp.normPerHour).toFixed(2)} normohodin
                  </span>
                )}
              </div>

              <div className="bg-slate-950 border-2 border-indigo-500/50 rounded-2xl py-3 px-4 text-center mb-2.5">
                <span className="text-3xl font-extrabold font-mono text-white tracking-wider">
                  {piecesStr || '0'}
                </span>
                <span className="text-sm text-slate-400 ml-2">ks</span>
              </div>

              {/* Rychlé přičítání */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[10, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddQuick(val)}
                    className="py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/40 text-indigo-300 font-bold text-xs cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPiecesStr('')}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs cursor-pointer"
                >
                  Vynulovat
                </button>
              </div>

              {/* Kompaktní numerická klávesnice */}
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigit(d)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-bold text-lg cursor-pointer transition-colors"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPiecesStr('')}
                  className="py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-400 font-semibold text-xs cursor-pointer"
                >
                  Smazat
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-bold text-lg cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPiecesStr((p) => p.slice(0, -1))}
                  className="py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || piecesNum <= 0 || !selectedOrderId || !selectedOpId}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
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
      <div className="flex flex-col w-full max-w-md mx-auto px-3 select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              Směrnice a BOZP
            </h2>
            <span className="text-xs text-slate-400">{statusData.fullName}</span>
          </div>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border ${
                  doc.needsConsent
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-white">{doc.title}</h3>
                  {doc.needsConsent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                      Nutné potvrdit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Platné
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 mb-3 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {doc.shortText || doc.content}
                  </p>

                  {doc.hasFullText && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 w-full gap-2">
                      <button
                        type="button"
                        onClick={() => setReadingDocId(doc.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Číst plné znění směrnice</span>
                      </button>
                      <a
                        href={`./?doc=${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-500 hover:text-sky-300 flex items-center gap-1"
                        title="Otevřít v nové záložce"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {doc.lastAgreedAt && (
                  <div className="text-[11px] text-slate-400 mb-2">
                    Naposledy potvrzeno:{' '}
                    <strong className="text-slate-300">
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
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    doc.needsConsent
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
      <div className="flex flex-col w-full max-w-md mx-auto px-3 select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              Směny & Samoobslužná burza
            </h2>
            <span className="text-xs text-slate-400">{statusData.fullName}</span>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Moje naplánované směny */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Moje přihlášené směny ({upcomingShifts.length})
              </h3>
              {upcomingShifts.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  Nemáte naplánovanou žádnou směnu.
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingShifts.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">
                          {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'numeric',
                          })}
                          <span className="ml-2 font-mono text-sky-400">
                            {s.startTime} – {s.endTime}
                          </span>
                        </div>
                        {s.orderName && (
                          <div className="text-[11px] text-indigo-300 mt-0.5">
                            Zakázka: {s.orderName}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={claimingShiftId === s.id}
                        onClick={() => handleRelease(s.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Volné směny na burze ({openShifts.length})
              </h3>
              {openShifts.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  V této chvíli nejsou vypsány žádné volné směny.
                </div>
              ) : (
                <div className="space-y-2">
                  {openShifts.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">
                          {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'numeric',
                          })}
                          <span className="ml-2 font-mono text-amber-300">
                            {s.startTime} – {s.endTime}
                          </span>
                        </div>
                        {s.orderName && (
                          <div className="text-[11px] text-indigo-300 mt-0.5">
                            Zakázka: {s.orderName}
                          </div>
                        )}
                        {s.note && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">
                            {s.note}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={claimingShiftId === s.id}
                        onClick={() => handleClaim(s.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-all"
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
      <div className="flex flex-col w-full max-w-md mx-auto px-3 select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Můj profil & Výplata
            </h2>
            <span className="text-xs text-slate-400">{statusData.fullName}</span>
          </div>

          {profileSuccessMsg && (
            <div className="mb-4 px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              {profileSuccessMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Číslo bankovního účtu (pro výplatu)
              </label>
              <input
                type="text"
                required
                placeholder="např. 1234567890/0100"
                value={profileBank}
                onChange={(e) => setProfileBank(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Zadejte účet včetně kódu banky (např. 19-123456789/0800).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  Telefon
                </label>
                <input
                  type="text"
                  placeholder="+420 777 123 456"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="brigadnik@email.cz"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {statusData.personalDataConfirmedAt ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                Údaje byly naposledy potvrzeny dne{' '}
                <strong>
                  {new Date(statusData.personalDataConfirmedAt).toLocaleDateString('cs-CZ')}{' '}
                  {new Date(statusData.personalDataConfirmedAt).toLocaleTimeString('cs-CZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
                .
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                ⚠️ Zatím jste nepotvrdili své platební údaje. Prosím zkontrolujte a uložte.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !profileBank.trim()}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
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
    const ytd = summaryData?.yearToDateNetHours || 0;
    const dppDanger = isDpp && ytd >= 290;
    const dppWarning = isDpp && ytd >= 250 && ytd < 290;

    return (
      <div className="flex flex-col w-full max-w-lg mx-auto px-2 select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              Můj měsíční výkaz
            </h2>
            <span className="text-xs text-slate-400">{statusData.fullName}</span>
          </div>

          {/* Přepínač měsíce a roku */}
          <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-4 gap-2">
            <div className="text-xs font-semibold text-slate-300">
              Období:{' '}
              <span className="text-white capitalize">
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
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
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
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Další ▶
              </button>
            </div>
          </div>

          {/* Stav limitu DPP, pokud je brigádník na DPP */}
          {isDpp && (
            <div
              className={`p-3 rounded-xl border mb-4 text-xs flex items-center justify-between ${
                dppDanger
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : dppWarning
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Roční fond DPP:</strong> {ytd.toFixed(1)} / 300 hodin
                </span>
              </div>
              <span className="font-bold">
                {dppDanger
                  ? 'Kritický stav'
                  : dppWarning
                    ? 'Blíží se limitu'
                    : 'V normě'}
              </span>
            </div>
          )}

          {summaryError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center">
              {summaryError}
            </div>
          )}

          {loadingSummary ? (
            <div className="py-12 text-center text-xs text-sky-400">
              Načítám docházku a schválenou výrobu...
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              {/* Přehledové karty součtů */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Čisté hodiny</div>
                  <div className="text-base font-extrabold text-sky-400 font-mono mt-0.5">
                    {summaryData.totalNetHours.toFixed(1)} h
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Schváleno ks</div>
                  <div className="text-base font-extrabold text-indigo-400 font-mono mt-0.5">
                    {summaryData.totalApprovedPieces} ks
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Výdělek celkem</div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                    {summaryData.totalEarnedCzk.toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
              </div>

              {/* Tabulka jednotlivých směn */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50">
                {summaryData.shifts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    V tomto měsíci zatím nemáte žádné zaevidované směny.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-[10px] uppercase text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-2.5">Datum</th>
                        <th className="py-2 px-2">Čas v práci</th>
                        <th className="py-2 px-2 text-center">Čisté h</th>
                        <th className="py-2 px-2 text-right">Schváleno</th>
                        <th className="py-2 px-2.5 text-right">Výdělek</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {summaryData.shifts.map((s, idx) => {
                        const inDate = new Date(s.clockInTime);
                        const outDate = s.clockOutTime ? new Date(s.clockOutTime) : null;
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2 px-2.5 text-slate-200">
                              {inDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                            </td>
                            <td className="py-2 px-2 text-slate-300 text-[11px]">
                              {inDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                              {' – '}
                              {outDate
                                ? outDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
                                : <span className="text-rose-400 font-bold">Chybí odchod</span>}
                            </td>
                            <td className="py-2 px-2 text-center text-sky-400">
                              {s.isIncomplete ? '—' : `${(s.netHours || 0).toFixed(1)} h`}
                            </td>
                            <td className="py-2 px-2 text-right text-indigo-300">
                              {s.approvedPieces || 0} ks
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-400">
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
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto px-4 select-none">
      {/* Karta s informacemi o zaměstnanci */}
      <div className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-xl text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-sky-500/10 text-sky-400 mb-1.5">
          <UserCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{statusData.fullName}</h2>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
            {statusData.contractType}
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isOnSite
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : isOnBreak
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-700/80 text-slate-400 border border-slate-600/40'
            }`}
          >
            {isOnSite
              ? '● Na pracovišti'
              : isOnBreak
                ? '☕ Na přestávce'
                : '○ Mimo pracoviště'}
          </span>
          {(statusData.todaySubmittedPieces ?? 0) > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              Dnes: {statusData.todaySubmittedPieces} ks
            </span>
          )}
        </div>

        {lastTimeFormatted && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Poslední záznam (
              {statusData.lastEventType === 'ClockIn'
                ? 'příchod'
                : statusData.lastEventType === 'BreakStart'
                  ? 'začátek přestávky'
                  : statusData.lastEventType === 'BreakEnd'
                    ? 'konec přestávky'
                    : 'odchod'}
              ): <strong className="text-slate-200">{lastTimeFormatted}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Notifikace nepodepsaných BOZP dokumentů (Fáze 3) */}
      {pendingDocsCount > 0 ? (
        <button
          type="button"
          onClick={() => setSubView('documents')}
          className="w-full mb-4 px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 border-2 border-rose-500/50 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                Dokumenty k podpisu ({pendingDocsCount})
              </div>
              <div className="text-[11px] text-rose-200">
                Klikněte pro potvrzení seznámení s BOZP
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold">
            Otevřít
          </span>
        </button>
      ) : (
        documents.length > 0 && (
          <button
            type="button"
            onClick={() => setSubView('documents')}
            className="w-full mb-3 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Směrnice a BOZP (vše potvrzeno)
            </span>
            <span className="text-sky-400 font-medium">Zobrazit →</span>
          </button>
        )
      )}

      {/* Offline upozornění */}
      {!isOnline && (
        <div className="w-full mb-4 p-3.5 bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl flex items-center justify-center gap-2 text-amber-200 text-sm font-semibold shadow-md">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Offline režim – Záznam se uloží do telefonu a odešle po obnovení signálu.</span>
        </div>
      )}

      {/* Chybová hláška */}
      {errorMessage && (
        <div className="w-full mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-medium text-center">
          {errorMessage}
        </div>
      )}

      {/* Akční tlačítka: Příchod, Odchod, Přestávka, Zapsat výrobu */}
      <div className="flex flex-col gap-3 w-full mb-4">
        {/* Tlačítko PŘÍCHOD */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onActionSubmit('ClockIn')}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
            isSuggestedIn
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-suggested-in ring-2 ring-emerald-400/50'
              : 'bg-slate-800 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-950/40'
          }`}
        >
          <LogIn className="w-6 h-6" />
          <span>PŘÍCHOD</span>
        </button>

        {/* Tlačítko ZAČÁTEK / KONEC PŘESTÁVKY (když je na pracovišti nebo na přestávce) */}
        {(isOnSite || isOnBreak) && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onActionSubmit(isOnBreak ? 'BreakEnd' : 'BreakStart')}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
              isOnBreak
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300/60'
                : 'bg-slate-800 hover:bg-amber-950/40 text-amber-300 border border-amber-600/40'
            }`}
          >
            {isOnBreak ? (
              <>
                <Play className="w-5 h-5" />
                <span>KONEC PŘESTÁVKY (NÁVRAT)</span>
              </>
            ) : (
              <>
                <Coffee className="w-5 h-5" />
                <span>ZAČÁTEK PŘESTÁVKY</span>
              </>
            )}
          </button>
        )}

        {/* Tlačítko ODCHOD */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onActionSubmit('ClockOut')}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
            !isSuggestedIn && !isOnBreak
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-suggested-out ring-2 ring-rose-400/50'
              : 'bg-slate-800 text-rose-400 border border-rose-700/50 hover:bg-rose-950/40'
          }`}
        >
          <LogOut className="w-6 h-6" />
          <span>ODCHOD</span>
        </button>

        {/* Tlačítko ZAPSAT VÝROBU (Fáze 2) */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setSubView('production')}
          className="w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/40 transition-all cursor-pointer disabled:opacity-50"
        >
          <PackagePlus className="w-6 h-6" />
          <span>ZAPSAT VÝROBU (KUSY)</span>
        </button>

        {/* Tlačítka Fáze 5: Burza směn a Osobní profil */}
        <div className="grid grid-cols-2 gap-2.5 mt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setSubView('shifts')}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-sky-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Burza směn {(statusData.openShifts?.length || 0) > 0 ? `(${statusData.openShifts?.length})` : ''}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setSubView('profile')}
            className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              !statusData.personalDataConfirmedAt
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profil & Výplata</span>
            {!statusData.personalDataConfirmedAt && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            )}
          </button>
        </div>

        {/* Tlačítko Fáze 8 / Zadání 04: Můj měsíční výkaz */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleOpenMonthlySummary}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-sky-300 hover:text-sky-200 font-semibold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Můj měsíční výkaz (hodiny a výdělek)</span>
          </span>
          <span className="text-slate-400 text-xs">Zobrazit →</span>
        </button>
      </div>

      {/* Moje nejbližší směny (Fáze 3) */}
      {upcomingShifts.length > 0 && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 mb-4 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Moje nejbližší směny
          </div>
          <div className="space-y-1.5">
            {upcomingShifts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-xs bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80"
              >
                <div>
                  <span className="font-bold text-white">
                    {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric',
                    })}
                  </span>
                  {s.orderName && (
                    <span className="ml-2 text-indigo-300 text-[11px]">• {s.orderName}</span>
                  )}
                </div>
                <span className="font-mono font-bold text-sky-400">
                  {s.startTime} – {s.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tlačítko Zpět */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Zpět / Jiný PIN
      </button>
    </div>
  );
};
