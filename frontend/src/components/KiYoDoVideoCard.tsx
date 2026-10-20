import React, { useState } from 'react';
import {
  Play,
  Square,
  Headphones,
  Tv,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Terminal,
  Copy,
  Check,
  Film,
  Music,
  Edit3,
  Trash2,
  Users,
  Sparkles,
  Subtitles,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { VideoItem } from '../types';
import { extractYouTubeId } from '../api/client';

interface KiYoDoVideoCardProps {
  video: VideoItem;
  mode: 'kiosk' | 'admin';
  onConfirmWatch?: (video: VideoItem) => Promise<void>;
  onEdit?: (video: VideoItem) => void;
  onDelete?: (video: VideoItem) => void;
  onShowViewers?: (video: VideoItem) => void;
  onToggleVisibility?: (video: VideoItem) => Promise<void>;
}

export const KiYoDoVideoCard: React.FC<KiYoDoVideoCardProps> = ({
  video,
  mode,
  onConfirmWatch,
  onEdit,
  onDelete,
  onShowViewers,
  onToggleVisibility,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [czechSubtitles, setCzechSubtitles] = useState(false);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [downloadQuality, setDownloadQuality] = useState<string>('1080p');
  const [serverDownloading, setServerDownloading] = useState(false);
  const [serverProgress, setServerProgress] = useState<number>(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copiedPs, setCopiedPs] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const videoId = video.videoId || extractYouTubeId(video.url) || '';
  const thumbnailUrl =
    video.thumbnailUrl ||
    (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0${
        czechSubtitles ? '&cc_load_policy=1&cc_lang_pref=cs&hl=cs' : ''
      }`
    : '';

  const handleTogglePlay = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    // Pokud je na kiosku a zaměstnanec spustí přehrávání a ještě nemá potvrzeno, můžeme mu nabídnout nebo rovnou potvrdit po přehrání
  };

  const handleConfirm = async () => {
    if (!onConfirmWatch || confirming) return;
    setConfirming(true);
    try {
      await onConfirmWatch(video);
    } finally {
      setConfirming(false);
    }
  };

  // 1. Přímé serverové stažení přes KiYoDo API (/api/convert -> /api/progress -> /api/download)
  const handleServerDownload = async () => {
    setServerDownloading(true);
    setServerProgress(5);
    setServerError(null);

    try {
      const startRes = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: video.url,
          format: downloadFormat,
          quality: downloadQuality,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}));
        throw new Error(err.error || 'Chyba při spuštění stahování na serveru');
      }

      const { jobId } = await startRes.json();

      await new Promise<void>((resolve, reject) => {
        const poll = setInterval(async () => {
          try {
            const progRes = await fetch(`/api/progress/${jobId}`);
            if (!progRes.ok) {
              clearInterval(poll);
              reject(new Error('Úloha stahování vypršela'));
              return;
            }
            const job = await progRes.json();
            setServerProgress(Math.round(job.progress || 10));

            if (job.status === 'done') {
              clearInterval(poll);
              const a = document.createElement('a');
              a.href = `/api/download/${jobId}`;
              a.download = job.filename || `${video.title}.${downloadFormat}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              resolve();
            } else if (job.status === 'error') {
              clearInterval(poll);
              reject(new Error(job.error || 'YouTube blokuje cloudovou IP serveru'));
            }
          } catch (e) {
            clearInterval(poll);
            reject(e);
          }
        }, 900);
      });
    } catch (err: any) {
      setServerError(
        err?.message ||
          'Přímé stažení ze serveru narazilo na YouTube ochranu. Použijte 1-klik .BAT skript nebo Webovou bránu níže.'
      );
    } finally {
      setServerDownloading(false);
    }
  };

  // 2. 1-klikový automatický .BAT skript pro Windows z projektu KiYoDo
  const handleDownloadBatScript = () => {
    const cleanUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : video.url.trim();
    const safeTitle = (video.title || 'video')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 35);

    const args =
      downloadFormat === 'mp3'
        ? `-x --audio-format mp3 --audio-quality 0`
        : `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"`;

    const batContent = [
      '@echo off',
      'chcp 65001 >nul',
      'title KiYoDo & Kipacky - Automaticke stahovani z YouTube',
      'color 0B',
      'echo ==========================================================',
      'echo   KiYoDo / Kipacky - Automaticke stahovani videa do PC',
      'echo ==========================================================',
      'echo.',
      'set "WORK_DIR=%TEMP%\\kiyodo_dl"',
      'if not exist "%WORK_DIR%" mkdir "%WORK_DIR%"',
      'if not exist "%WORK_DIR%\\yt-dlp.exe" (',
      '    echo [1/2] Pripravuji stahovaci nastroj yt-dlp...',
      '    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri \'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe\' -OutFile \'%WORK_DIR%\\yt-dlp.exe\'"',
      ')',
      'echo.',
      `echo [2/2] Stahuji (${downloadFormat.toUpperCase()}): ${cleanUrl}`,
      'echo Cilova slozka: %USERPROFILE%\\Downloads',
      'echo.',
      `"%WORK_DIR%\\yt-dlp.exe" ${args} -o "%USERPROFILE%\\Downloads\\%(title)s.%(ext)s" "${cleanUrl}"`,
      'echo.',
      'echo ==========================================================',
      'echo   HOTOVO! Soubor najdete ve slozce Stazene soubory (Downloads).',
      'echo ==========================================================',
      'explorer "%USERPROFILE%\\Downloads"',
      'pause',
    ].join('\r\n');

    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Stahnout_${safeTitle}_${downloadFormat.toUpperCase()}.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // 3. Zkopírování PowerShell příkazu z projektu KiYoDo
  const handleCopyPowerShell = async () => {
    const cleanUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : video.url.trim();
    const args =
      downloadFormat === 'mp3'
        ? `-x --audio-format mp3 --audio-quality 0`
        : `-f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'`;

    const psCommand = `$d="$env:TEMP\\kiyodo"; New-Item -ItemType Directory -Force -Path $d | Out-Null; if(!(Test-Path "$d\\yt-dlp.exe")){Invoke-WebRequest "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile "$d\\yt-dlp.exe"}; & "$d\\yt-dlp.exe" ${args} -o "$HOME\\Downloads\\%(title)s.%(ext)s" "${cleanUrl}"; explorer "$HOME\\Downloads"`;

    await navigator.clipboard.writeText(psCommand);
    setCopiedPs(true);
    setTimeout(() => setCopiedPs(false), 3000);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-slate-600">
      {/* HORNÍ ČÁST: PŘEHRÁVAČ NEBO NÁHLED */}
      <div className="relative w-full aspect-video bg-slate-950 overflow-hidden group">
        {isPlaying && embedUrl ? (
          <div className="relative w-full h-full">
            {/* Skutečný YouTube iframe přehrávač */}
            <iframe
              src={embedUrl}
              title={video.title}
              className={`w-full h-full border-0 transition-opacity duration-300 ${
                audioOnlyMode ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />

            {/* KiYoDo Audio-Only Data Saver Overlay */}
            {audioOnlyMode && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-slate-900 flex flex-col items-center justify-center p-4 text-center z-10">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20 animate-[spin_12s_linear_infinite]">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <Headphones className="w-8 h-8 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-slate-950 border border-emerald-400/50" />
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                  <Headphones className="w-3.5 h-3.5" />
                  Režim Pouze Zvuk (Úspora dat -95 %)
                </span>
                <p className="text-xs text-slate-300 max-w-xs line-clamp-1">{video.title}</p>

                {/* Animovaný ekvalizér */}
                <div className="flex items-end gap-1 h-5 mt-2">
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite] h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1.1s_infinite] h-5" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite] h-2" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.9s_infinite] h-4" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1.2s_infinite] h-3" />
                </div>
              </div>
            )}

            {/* Plovoucí lišta ovládání přehrávače nahoře */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20 pointer-events-none">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setAudioOnlyMode(!audioOnlyMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition-all shadow ${
                    audioOnlyMode
                      ? 'bg-emerald-600/90 text-white border-emerald-400'
                      : 'bg-slate-900/85 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                  title="Přepnout mezi videem a úsporným audio režimem"
                >
                  {audioOnlyMode ? (
                    <>
                      <Tv className="w-3.5 h-3.5" />
                      <span>Zobrazit obraz</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pouze zvuk</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCzechSubtitles(!czechSubtitles)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition-all shadow ${
                    czechSubtitles
                      ? 'bg-blue-600/90 text-white border-blue-400'
                      : 'bg-slate-900/85 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                  title="Zapnout automatické české titulky"
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>CZ titulky</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-400/50 shadow backdrop-blur-md transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Zastavit</span>
              </button>
            </div>
          </div>
        ) : (
          /* NÁHLEDOVÝ OBRÁZEK S TLAČÍTKEM PLAY */
          <div
            onClick={handleTogglePlay}
            className="relative w-full h-full cursor-pointer select-none"
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <Film className="w-12 h-12 text-slate-600" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

            {/* Kategorie a stav zhlédnutí nahoře */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600/90 text-white backdrop-blur-sm shadow">
                {video.category || 'BOZP a bezpečnost práce'}
              </span>

              {mode === 'admin' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleVisibility && !togglingVisibility) {
                      setTogglingVisibility(true);
                      onToggleVisibility(video).finally(() => setTogglingVisibility(false));
                    }
                  }}
                  disabled={togglingVisibility}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow backdrop-blur-md transition-all cursor-pointer ${
                    video.isActive
                      ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400'
                      : 'bg-stone-800/90 hover:bg-stone-700 text-amber-300 border border-amber-500/50'
                  }`}
                  title="Klikněte pro zapnutí/vypnutí viditelnosti pro zaměstnance"
                >
                  {togglingVisibility ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : video.isActive ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>{video.isActive ? 'Viditelné pro zaměstnance' : 'Skryté (pouze admin)'}</span>
                </button>
              ) : video.isWatched ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/95 text-white shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Shlédnuto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/95 text-slate-950 shadow">
                  <Clock className="w-3.5 h-3.5" />
                  Ke zhlédnutí
                </span>
              )}
            </div>

            {/* Velké centrální tlačítko Play */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-600/90 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-950/60 group-hover:scale-110 transition-all border-2 border-white/30">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>

            {/* Spodní lišta na náhledu */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
              <span className="font-medium truncate">
                {video.author ? `Autor: ${video.author}` : 'Klikněte pro přehrání v okně'}
              </span>
              {video.duration && (
                <span className="px-2 py-0.5 rounded bg-black/75 text-white font-mono">
                  {video.duration}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SPODNÍ ČÁST KARTY: INFORMACE + TLAČÍTKA */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-white leading-snug">{video.title}</h3>
            {!video.isActive && mode === 'admin' && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                Skryté
              </span>
            )}
          </div>
          {video.description && (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{video.description}</p>
          )}
        </div>

        {/* Hlavní akční tlačítka (Přehrát, Stáhnout z KiYoDo, YouTube) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/50'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Zastavit video</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Přehrát v okně</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDownloadPanel(!showDownloadPanel)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showDownloadPanel
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-700/80 hover:bg-slate-700 text-emerald-300 border-slate-600'
            }`}
            title="Stáhnout video (MP4) nebo zvuk (MP3) přes KiYoDo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Stáhnout (MP4/MP3)</span>
          </button>

          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/80 transition-all"
            title="Otevřít přímo na YouTube"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>YouTube</span>
          </a>
        </div>

        {/* ROZBALOVACÍ PANEL STAHOVÁNÍ (KiYoDo engine) */}
        {showDownloadPanel && (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                KiYoDo Stahování videa a zvuku
              </span>
              <span className="text-[11px] text-slate-400">MP4 / MP3</span>
            </div>

            {/* Volba formátu MP4 vs MP3 + kvalita */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDownloadFormat('mp4');
                  setDownloadQuality('1080p');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  downloadFormat === 'mp4'
                    ? 'bg-indigo-600/30 border-indigo-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <span>MP4 Video ({downloadQuality})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDownloadFormat('mp3');
                  setDownloadQuality('320kbps');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  downloadFormat === 'mp3'
                    ? 'bg-emerald-600/30 border-emerald-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span>MP3 Audio (320 kbps)</span>
              </button>
            </div>

            {/* Možnost 1: 1-klik .BAT stahovač pro Windows PC + Přímé serverové stažení */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBatScript}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                  title="Stáhne 1-klikový skript, který uloží video v plné kvalitě přímo do složky Stažené soubory (Downloads)"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Klik Stáhnout do PC (.bat)</span>
                </button>

                <button
                  type="button"
                  onClick={handleServerDownload}
                  disabled={serverDownloading}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white shadow transition-all"
                >
                  {serverDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zpracovávám ({serverProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Přímé stažení ze serveru</span>
                    </>
                  )}
                </button>
              </div>

              {serverError && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{serverError}</p>
                  </div>
                </div>
              )}

              {/* Možnost 2: PowerShell příkaz + Webové brány pro mobily/tablety */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleCopyPowerShell}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  title="Zkopírovat PowerShell příkaz pro bleskové stažení do složky Downloads"
                >
                  {copiedPs ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Zkopírováno (Win+R → powershell)</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <Copy className="w-3 h-3" />
                      <span>Kopírovat PowerShell příkaz</span>
                    </>
                  )}
                </button>

                {videoId && (
                  <>
                    <a
                      href={`https://10downloader.com/download?v=https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Web brána 1 (Mobil/PC)</span>
                    </a>
                    <a
                      href="https://cobalt.tools/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `https://www.youtube.com/watch?v=${videoId}`
                        );
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-all"
                      title="Zkopíruje odkaz do schránky a otevře Cobalt.tools"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Cobalt (zkopíruje URL)</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KIOSK: Potvrzení zhlédnutí zaměstnancem */}
        {mode === 'kiosk' && onConfirmWatch && (
          <div className="pt-2 border-t border-slate-700/70 flex items-center justify-between gap-2">
            {video.isWatched ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Video máte potvrzené jako zhlédnuté
                  {video.watchedAt
                    ? ` (${new Date(video.watchedAt).toLocaleDateString('cs-CZ')})`
                    : ''}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {confirming ? 'Ukládám potvrzení...' : 'Potvrzuji zhlédnutí tohoto videa'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* ADMIN: Správa videa a statistika zhlédnutí */}
        {mode === 'admin' && (
          <div className="pt-2 border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onShowViewers && onShowViewers(video)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-all"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Zhlédlo: {video.viewsCount ?? 0} zam.</span>
              </button>

              {onToggleVisibility && (
                <button
                  type="button"
                  onClick={() => {
                    if (!togglingVisibility) {
                      setTogglingVisibility(true);
                      onToggleVisibility(video).finally(() => setTogglingVisibility(false));
                    }
                  }}
                  disabled={togglingVisibility}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    video.isActive
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                  }`}
                  title="Klikněte pro zapnutí/vypnutí viditelnosti pro zaměstnance"
                >
                  {togglingVisibility ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : video.isActive ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>{video.isActive ? 'Viditelné' : 'Skryté'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(video)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Upravit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(video)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Smazat</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
