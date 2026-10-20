import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Sparkles,
  Search,
  RefreshCw,
  CheckCircle2,
  Users,
  X,
  Film,
  Link as LinkIcon,
  FolderKanban,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { VideoItem, VideoViewItem } from '../types';
import {
  fetchVideos,
  saveVideo,
  deleteVideo,
  fetchVideoViews,
  fetchYouTubeVideoMeta,
  extractYouTubeId,
} from '../api/client';
import { KiYoDoVideoCard } from './KiYoDoVideoCard';

const CATEGORY_PRESETS = [
  'BOZP a bezpečnost práce',
  'Výrobní postupy a kompletace',
  'Zaškolení nových pracovníků',
  'Ostatní videa',
];

export const AdminVideosSection: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoViews, setVideoViews] = useState<VideoViewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtry
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Formulář pro přidání / úpravu videa
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('BOZP a bezpečnost práce');
  const [authorInput, setAuthorInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [thumbnailInput, setThumbnailInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal zhlédnutí konkrétního videa
  const [selectedVideoForViews, setSelectedVideoForViews] = useState<VideoItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vids, views] = await Promise.all([
        fetchVideos({ includeInactive: true }),
        fetchVideoViews(),
      ]);
      setVideos(vids);
      setVideoViews(views);
    } catch (err: any) {
      setError(err?.message || 'Chyba při načítání videí');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAutoFetchMeta = async (targetUrl?: string) => {
    const u = (targetUrl ?? urlInput).trim();
    if (!u) return;
    const vid = extractYouTubeId(u);
    if (!vid) {
      setError('Zadejte platný YouTube odkaz (např. https://www.youtube.com/watch?v=...)');
      return;
    }

    setFetchingMeta(true);
    setError(null);
    try {
      const meta = await fetchYouTubeVideoMeta(u);
      if (meta.title && !titleInput) setTitleInput(meta.title);
      else if (meta.title && targetUrl === undefined) setTitleInput(meta.title);
      if (meta.author) setAuthorInput(meta.author);
      if (meta.thumbnailUrl) setThumbnailInput(meta.thumbnailUrl);
    } catch (err: any) {
      setError(err?.message || 'Nepodařilo se načíst metadata z YouTube');
    } finally {
      setFetchingMeta(false);
    }
  };

  const resetForm = () => {
    setEditingId(undefined);
    setUrlInput('');
    setTitleInput('');
    setCategoryInput('BOZP a bezpečnost práce');
    setAuthorInput('');
    setDescriptionInput('');
    setThumbnailInput('');
    setIsActiveInput(true);
    setShowForm(false);
  };

  const handleOpenEdit = (video: VideoItem) => {
    setEditingId(video.id);
    setUrlInput(video.url);
    setTitleInput(video.title);
    setCategoryInput(video.category || 'BOZP a bezpečnost práce');
    setAuthorInput(video.author || '');
    setDescriptionInput(video.description || '');
    setThumbnailInput(video.thumbnailUrl || '');
    setIsActiveInput(video.isActive);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim()) {
      setError('Vyplňte název videa a YouTube odkaz.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await saveVideo({
        id: editingId,
        title: titleInput.trim(),
        url: urlInput.trim(),
        category: categoryInput.trim() || 'BOZP a bezpečnost práce',
        author: authorInput.trim(),
        description: descriptionInput.trim(),
        thumbnailUrl: thumbnailInput.trim(),
        isActive: isActiveInput,
      });
      setSuccessMsg(editingId ? 'Video bylo upraveno.' : 'Nové video bylo přidáno.');
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Chyba při ukládání videa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (video: VideoItem) => {
    if (!window.confirm(`Opravdu chcete smazat video "${video.title}"?`)) return;
    setError(null);
    try {
      await deleteVideo(video.id);
      setSuccessMsg(`Video "${video.title}" bylo odstraněno.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Chyba při mazání videa');
    }
  };

  const categories = Array.from(
    new Set([
      ...CATEGORY_PRESETS,
      ...videos.map((v) => v.category || 'BOZP a bezpečnost práce'),
    ])
  );

  const filteredVideos = videos.filter((v) => {
    if (selectedCategory !== 'ALL' && v.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.author || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const modalViews = selectedVideoForViews
    ? videoViews.filter((vv) => vv.videoId === selectedVideoForViews.id)
    : [];

  return (
    <div className="space-y-6">
      {/* HLAVIČKA SEKCE VIDEA */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Videa, BOZP & Školení</span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  KiYoDo přehrávač & stahovač
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Správa instruktážních a bezpečnostních videí pro zaměstnance s přehráváním v okně,
                úsporným režimem zvuku a možností stažení (MP4 / MP3).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Obnovit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                <span>Zavřít formulář</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Přidat nové video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STAVOVÉ HLÁŠKY */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FORMULÁŘ PRO PŘIDÁNÍ / ÚPRAVU VIDEA */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-slate-800/95 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" />
              <span>{editingId ? 'Upravit video' : 'Přidat nové školící / BOZP video'}</span>
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-white text-xs"
            >
              Zrušit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* YouTube odkaz + tlačítko Načíst metadata */}
            <div className="md:col-span-8">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Odkaz na YouTube video (URL) *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onBlur={() => {
                      if (urlInput && !titleInput) handleAutoFetchMeta(urlInput);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoFetchMeta()}
                  disabled={fetchingMeta || !urlInput.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{fetchingMeta ? 'Načítám...' : 'Načíst z YouTube'}</span>
                </button>
              </div>
            </div>

            {/* Kategorie */}
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kategorie videa
              </label>
              <input
                type="text"
                list="video-category-presets"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="BOZP a bezpečnost práce"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <datalist id="video-category-presets">
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Název videa */}
            <div className="md:col-span-8">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Název videa *
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Např. Vizuální průvodce 101/2005 Sb."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            {/* Autor / kanál */}
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Autor / Kanál (volitelné)
              </label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                placeholder="Např. Jan Kytýr"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Popis videa */}
            <div className="md:col-span-12">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Popis a pokyny pro zaměstnance
              </label>
              <textarea
                rows={2}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Stručný popis toho, na co se mají zaměstnanci ve videu zaměřit..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={isActiveInput}
                onChange={(e) => setIsActiveInput(e.target.checked)}
                className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Aktivní (zobrazovat zaměstnancům na kiosku)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg"
              >
                {saving
                  ? 'Ukládám...'
                  : editingId
                  ? 'Uložit změny videa'
                  : 'Uložit a publikovat video'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FILTRY KATEGORIÍ A VYHLEDÁVÁNÍ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Všechna videa ({videos.length})
          </button>
          {categories.map((cat) => {
            const count = videos.filter((v) => v.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>
                  {cat} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat video..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* MŘÍŽKA VIDEÍ (KiYoDoVideoCard) */}
      {filteredVideos.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-8 text-center text-slate-400 text-sm">
          Zatím nebyla nalezena žádná videa v této kategorii.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredVideos.map((video) => (
            <KiYoDoVideoCard
              key={video.id}
              video={video}
              mode="admin"
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onShowViewers={(v) => setSelectedVideoForViews(v)}
            />
          ))}
        </div>
      )}

      {/* PŘEHLED ZHLÉDNUTÍ ZAMĚSTNANCI (HISTORIE POTVRZENÍ) */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Evidence zhlédnutí videí zaměstnanci ({videoViews.length})</span>
          </h3>
        </div>

        {videoViews.length === 0 ? (
          <p className="text-xs text-slate-400">
            Zatím žádný zaměstnanec nepotvrdil zhlédnutí videa na kiosku.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-2 px-3">Zaměstnanec</th>
                  <th className="py-2 px-3">Úvazek</th>
                  <th className="py-2 px-3">Video</th>
                  <th className="py-2 px-3">Datum a čas zhlédnutí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {videoViews.slice(0, 30).map((vv) => (
                  <tr key={vv.id} className="hover:bg-slate-700/30">
                    <td className="py-2 px-3 font-semibold text-white">{vv.employeeName}</td>
                    <td className="py-2 px-3 text-slate-300">{vv.contractType}</td>
                    <td className="py-2 px-3 text-indigo-300 font-medium">{vv.videoTitle}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(vv.viewedAt).toLocaleString('cs-CZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PRO ZHLÉDNUTÍ KONKRÉTNÍHO VIDEA */}
      {selectedVideoForViews && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Kdo zhlédl: {selectedVideoForViews.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Celkem potvrzených zhlédnutí: {modalViews.length}
                </p>
              </div>
              <button
                onClick={() => setSelectedVideoForViews(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalViews.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Toto video zatím žádný zaměstnanec nepotvrdil jako zhlédnuté.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {modalViews.map((mv) => (
                  <div key={mv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{mv.employeeName}</span>
                      <span className="ml-2 text-slate-400">({mv.contractType})</span>
                    </div>
                    <span className="text-emerald-400 font-mono">
                      {new Date(mv.viewedAt).toLocaleString('cs-CZ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedVideoForViews(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
