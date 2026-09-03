import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Trash2, Search, Film, Check, FolderOpen } from 'lucide-react';

const G = '#D4AF37';
const ORANGE = '#D4854A';
const PANEL = '#0D1022';
const BORDER = 'rgba(212,175,55,0.18)';

const CATEGORY_SUGGESTIONS = ['general', 'product', 'b-roll', 'logo', 'thumbnail', 'music video', 'promo', 'other'];

/**
 * AssetLibrary — creator's uploaded images + videos.
 * Tag by category, filter/search, delete, and re-use in any SwanyBot Pro studio.
 * selectMode: renders a "Use" action per card and calls onSelect(asset).
 */
export default function AssetLibrary({ selectMode = false, filterMediaType = null, onSelect }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['creative-assets'],
    queryFn: () => base44.entities.CreativeAsset.list('-created_date', 200),
    enabled: !!user,
  });

  const uploadMut = useMutation({
    mutationFn: async (files) => {
      const created = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadFile({ file });
        const rec = await base44.entities.CreativeAsset.create({
          name: file.name,
          file_url: res.file_url,
          media_type: file.type?.startsWith('video/') ? 'video' : 'image',
          category: category !== 'all' ? category : 'general',
          tags: ['swanybot-pro'],
        });
        created.push(rec);
      }
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creative-assets'] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...patch }) => base44.entities.CreativeAsset.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creative-assets'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.CreativeAsset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creative-assets'] }),
  });

  const categories = useMemo(() => {
    const set = new Set();
    assets.forEach((a) => set.add((a.category || 'general').toLowerCase()));
    CATEGORY_SUGGESTIONS.forEach((c) => set.add(c));
    return Array.from(set);
  }, [assets]);

  const filtered = useMemo(() => {
    let list = assets;
    if (filterMediaType) list = list.filter((a) => a.media_type === filterMediaType);
    if (category !== 'all') list = list.filter((a) => (a.category || 'general').toLowerCase() === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (a.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [assets, category, search, filterMediaType]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length && user) uploadMut.mutate(files);
  };

  const pickFiles = () => fileRef.current?.click();

  const allCategoryOptions = useMemo(() => {
    const set = new Set(categories);
    assets.forEach((a) => set.add((a.category || 'general').toLowerCase()));
    return Array.from(set);
  }, [categories, assets]);

  return (
    <div className="space-y-4">
      {/* Upload bar */}
      <div
        onClick={pickFiles}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
        onDrop={handleDrop}
        className="rounded-2xl border-2 border-dashed px-4 py-5 flex items-center gap-3 cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? G : 'rgba(255,255,255,0.15)',
          background: dragOver ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
        }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length && user) uploadMut.mutate(files);
            e.target.value = '';
          }}
        />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.12)' }}>
          {uploadMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: G }} /> : <Upload className="w-5 h-5" style={{ color: G }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
            {uploadMut.isPending ? 'Uploading…' : dragOver ? 'Drop to upload' : 'Upload images or videos'}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Drag & drop or tap · saved to your library{category !== 'all' ? ` as "${category}"` : ''}
          </p>
        </div>
      </div>

      {/* Filter row: categories + search */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {['all', ...categories].map((c) => {
            const active = category === c;
            return (
              <button key={c} onClick={() => setCategory(c)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                style={{
                  background: active ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? G + '88' : 'transparent'}`,
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}>
                {c}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}` }}>
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag, or category…"
            className="flex-1 bg-transparent py-2 text-[12px] outline-none min-w-0" style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: G }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-12 flex flex-col items-center gap-3" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <FolderOpen className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            {assets.length === 0 ? 'No assets yet' : 'No assets match this filter'}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {assets.length === 0 ? 'Upload your first image or video above.' : 'Try a different category or search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
              <div className="relative aspect-video" style={{ background: 'rgba(0,0,0,0.4)' }}>
                {a.media_type === 'video' ? (
                  <video src={a.file_url} muted loop playsInline preload="metadata" className="w-full h-full object-cover" />
                ) : (
                  <img src={a.file_url} alt={a.name} className="w-full h-full object-cover" />
                )}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1"
                  style={{ background: 'rgba(0,0,0,0.7)', color: a.media_type === 'video' ? ORANGE : G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {a.media_type === 'video' ? <><Film className="w-2.5 h-2.5" /> VIDEO</> : 'IMAGE'}
                </span>
              </div>
              <div className="p-2.5 flex flex-col gap-2 flex-1">
                <p className="text-[11px] font-bold truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{a.name || 'Untitled'}</p>
                <select
                  value={(a.category || 'general').toLowerCase()}
                  onChange={(e) => updateMut.mutate({ id: a.id, category: e.target.value })}
                  className="text-[10px]">
                  {allCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-1.5 mt-auto">
                  {selectMode && (
                    <button onClick={() => onSelect && onSelect(a)}
                      className="flex-1 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      style={{ background: 'rgba(212,175,55,0.15)', border: `1px solid ${G}55`, color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      <Check className="w-3 h-3" /> Use
                    </button>
                  )}
                  <button onClick={() => deleteMut.mutate(a.id)}
                    disabled={deleteMut.isPending}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
                    style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)' }}
                    title="Delete asset">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}