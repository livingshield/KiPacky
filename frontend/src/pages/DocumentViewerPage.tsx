import React, { useEffect, useState } from 'react';
import { fetchDocumentDetail } from '../api/client';
import { DocumentItem } from '../types';
import { Printer, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface DocumentViewerPageProps {
  documentId: number;
  onBack?: () => void;
}

export const DocumentViewerPage: React.FC<DocumentViewerPageProps> = ({
  documentId,
  onBack,
}) => {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDocumentDetail(documentId)
      .then((data) => setDoc(data))
      .catch((err) => setError(err.message || 'Nepodařilo se načíst dokument.'))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Načítám plné znění směrnice...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Chyba při načtení</h2>
          <p className="text-sm text-slate-600 mb-5">{error || 'Dokument nebyl nalezen.'}</p>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Zpět do aplikace
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.close()}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Zavřít záložku
            </button>
          )}
        </div>
      </div>
    );
  }

  // Formátování textu na odstavce
  const fullTextToRender = doc.fullText || doc.content || '';
  const paragraphs = fullTextToRender.split(/\r?\n\r?\n|\r?\n(?=[0-9]+\.)/);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white text-slate-900 py-6 px-4 sm:px-6">
      {/* Tiskový a navigační panel (skrytý při tisku) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zpět do aplikace
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.close()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zavřít záložku
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-slate-500">
            Formát A4 pro tisk směrnice
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            Vytisknout dokument
          </button>
        </div>
      </div>

      {/* Samotný dokument – čistý A4 minimalistický design */}
      <article className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* Úřední hlavička */}
        <header className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider mb-2">
            <span className="font-semibold text-slate-700">Dílna EkoBio.org • Kípačky</span>
            <span>Vnitřní provozní předpis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {doc.title}
          </h1>
          {doc.createdAt && (
            <div className="text-xs text-slate-500 mt-2">
              Platnost předpisu od: {new Date(doc.createdAt).toLocaleDateString('cs-CZ')}
            </div>
          )}
        </header>

        {/* Zkrácené poučení (Shrnutí) */}
        {doc.shortText && doc.shortText !== doc.fullText && (
          <div className="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200 print:bg-slate-50 print:border-slate-300 text-xs leading-relaxed text-slate-800">
            <strong className="block font-bold text-sky-950 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />
              Zkrácené znění (potvrzované na terminálu):
            </strong>
            {doc.shortText}
          </div>
        )}

        {/* Plné znění předpisu */}
        <div className="space-y-4 text-sm text-slate-800 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
            Plné znění směrnice a pokynů
          </h2>

          <div className="space-y-3.5 whitespace-pre-line text-[13.5px]">
            {paragraphs.map((p, idx) => {
              const trimmed = p.trim();
              if (!trimmed) return null;
              return (
                <p key={idx} className="leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>

        {/* Závěrečné poučení a podpisová doložka */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-600 print:mt-16">
          <p className="mb-6 italic">
            Tento dokument je uložen v elektronickém systému docházky Kípačky. Pracovníci potvrzují
            seznámení s tímto předpisem svým osobním PIN kódem.
          </p>
          <div className="flex justify-between items-end pt-8 print:pt-12">
            <div className="w-48 text-center border-t border-slate-400 pt-1">
              <strong>Marta Chorobiková</strong>
              <div className="text-[11px] text-slate-500">Vedoucí provozu dílny</div>
            </div>
            <div className="w-48 text-center border-t border-slate-400 pt-1">
              <strong>Razítko organizace</strong>
              <div className="text-[11px] text-slate-500">EkoBio.org</div>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
};
