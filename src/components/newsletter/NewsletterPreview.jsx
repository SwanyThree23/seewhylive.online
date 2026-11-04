import React from 'react';
import { X } from 'lucide-react';

// Minimal markdown → HTML for newsletter bodies (## headings, **bold**, *italic*)
export function renderNewsletterBody(md) {
  return String(md || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]*)"/g, '&quot;$1&quot;')
    .replace(/## (.*)/g, '<h2 style="color:#FFB800;font-family:Syne,sans-serif;font-size:19px;margin:18px 0 6px">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F0F0FF">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:rgba(240,240,255,0.6)">$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function NewsletterPreview({ draft, onClose }) {
  if (!draft) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--cd)', border: '1px solid var(--bd)', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--bd)' }}>
          <span className="font-black uppercase"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, letterSpacing: '0.14em', color: 'var(--go)' }}>
            Inbox Preview
          </span>
          <button onClick={onClose} aria-label="Close preview"
            className="flex items-center justify-center rounded-xl tap-44"
            style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="px-5 py-4" style={{ borderBottom: '3px solid var(--go)' }}>
            <p className="font-black text-white" style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, lineHeight: 1.25 }}>
              {draft.title || 'Untitled newsletter'}
            </p>
            {draft.preview_text && (
              <p className="mt-1" style={{ fontSize: 12, color: 'var(--mu)' }}>{draft.preview_text}</p>
            )}
            <p className="mt-2" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--mu)' }}>
              SeeWhy LIVE · to your followers
            </p>
          </div>

          <div
            className="px-5 py-4 leading-relaxed"
            style={{ fontSize: 13, color: 'rgba(240,240,255,0.78)' }}
            dangerouslySetInnerHTML={{ __html: renderNewsletterBody(draft.content) }}
          />

          <div className="px-5 py-3 text-center"
            style={{ background: 'rgba(255,184,0,0.05)', borderTop: '1px solid var(--bd)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: 'var(--mu)' }}>
            Sent from your SeeWhy LIVE creator channel · Unsubscribe
          </div>
        </div>
      </div>
    </div>
  );
}