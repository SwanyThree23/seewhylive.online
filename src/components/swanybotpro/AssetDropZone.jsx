import React, { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';

const G = '#D4AF37';
const BORDER = 'rgba(212,175,55,0.18)';

/**
 * AssetDropZone — drag-and-drop image upload with preview + replace/clear.
 * Used by Product Ad Studio for the product PNG asset.
 */
export default function AssetDropZone({
  imageUrl,
  onUpload,
  onClear,
  uploading = false,
  label = 'Drop product image',
  hint = 'Drag & drop or tap · background-free PNG works best',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onUpload(file);
  };

  const pickFile = () => fileRef.current?.click();

  // ── Preview state ──
  if (imageUrl) {
    return (
      <div className="rounded-2xl overflow-hidden relative" style={{ border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)' }}>
        <img src={imageUrl} alt="product" className="w-full aspect-square object-contain" style={{ background: 'rgba(0,0,0,0.3)' }} />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button onClick={pickFile}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${BORDER}` }}>
            <Upload className="w-3.5 h-3.5" style={{ color: G }} />
          </button>
          <button onClick={onClear}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(192,57,43,0.85)' }}>
            <X className="w-3.5 h-3.5" style={{ color: '#fff' }} />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      </div>
    );
  }

  // ── Empty drop zone ──
  return (
    <div
      onClick={pickFile}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={handleDrop}
      className="w-full rounded-2xl border-2 border-dashed py-10 px-4 flex flex-col items-center gap-2 cursor-pointer transition-all"
      style={{
        borderColor: isDragging ? G : 'rgba(255,255,255,0.15)',
        background: isDragging ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
      }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: isDragging ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}>
        {uploading ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: G }} /> : <Upload className="w-6 h-6" style={{ color: G }} />}
      </div>
      <span className="text-[12px] font-black uppercase tracking-wider" style={{ color: G, fontFamily: 'Barlow Condensed, sans-serif' }}>
        {uploading ? 'Uploading…' : isDragging ? 'Drop to upload' : label}
      </span>
      <span className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{hint}</span>
    </div>
  );
}