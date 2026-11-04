import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { FileText, Eye, Save, Send, Trash2, Plus, ChevronLeft, Mail } from 'lucide-react';
import NewsletterPreview from './NewsletterPreview';

const COND = { fontFamily: 'Barlow Condensed, sans-serif' };
const EMPTY = { title: '', preview_text: '', content: '' };

const fieldStyle = {
  width: '100%',
  padding: '11px 13px',
  minHeight: 44,
  background: 'var(--bu)',
  border: '1px solid var(--bd)',
  borderRadius: 12,
  color: 'var(--tx)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'Barlow Condensed, sans-serif',
};

function Label({ children }) {
  return (
    <p className="font-black uppercase mb-1.5"
      style={{ ...COND, fontSize: 11, letterSpacing: '0.14em', color: 'var(--mu)' }}>
      {children}
    </p>
  );
}

export default function NewsletterComposer({ user }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showDrafts, setShowDrafts] = useState(false);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['newsletter-drafts', user?.id],
    queryFn: async () => {
      const res = await base44.entities.Newsletter.filter(
        { creator_id: user.id, status: 'draft' },
        { sort: '-created_date', limit: 30 }
      );
      return res.items || [];
    },
    enabled: !!user?.id,
  });

  const saveMut = useMutation({
    mutationFn: (data) => editingId
      ? base44.entities.Newsletter.update(editingId, data)
      : base44.entities.Newsletter.create({ creator_id: user.id, status: 'draft', source_type: 'manual', ...data }),
    onSuccess: (saved) => {
      setEditingId(saved.id);
      qc.invalidateQueries({ queryKey: ['newsletter-drafts'] });
      toast.success('Draft saved');
    },
    onError: () => toast.error('Could not save this draft'),
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      const payload = { ...form, status: 'sent', sent_at: new Date().toISOString() };
      const saved = editingId
        ? await base44.entities.Newsletter.update(editingId, payload)
        : await base44.entities.Newsletter.create({ creator_id: user.id, source_type: 'manual', ...payload });
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter-drafts'] });
      setForm(EMPTY);
      setEditingId(null);
      toast.success('Newsletter queued for your followers');
    },
    onError: () => toast.error('Could not send this newsletter'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Newsletter.delete(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['newsletter-drafts'] });
      if (editingId === id) { setForm(EMPTY); setEditingId(null); }
      toast.success('Draft deleted');
    },
    onError: () => toast.error('Could not delete this draft'),
  });

  const canSend = !!form.title.trim() && !!form.content.trim();

  function loadDraft(draft) {
    setForm({ title: draft.title || '', preview_text: draft.preview_text || '', content: draft.content || '' });
    setEditingId(draft.id);
    setShowDrafts(false);
  }

  function newDraft() {
    setForm(EMPTY);
    setEditingId(null);
    setShowDrafts(false);
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(7,7,15,0.9)', border: '1px solid var(--bd)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" style={{ color: 'var(--cy)' }} />
          <p className="font-black text-[11px] uppercase"
            style={{ ...COND, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}>
            Newsletter Composer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDrafts(v => !v)}
            className="flex items-center gap-1.5 px-3 rounded-xl tap-44"
            style={{ minHeight: 44, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--bd)', color: 'var(--cy)', ...COND, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>
            <FileText className="w-3.5 h-3.5" />
            {drafts.length} Draft{drafts.length === 1 ? '' : 's'}
          </button>
          <button onClick={newDraft} aria-label="New draft"
            className="flex items-center justify-center rounded-xl tap-44"
            style={{ width: 44, height: 44, background: 'rgba(255,21,100,0.12)', border: '1px solid rgba(255,21,100,0.3)', color: 'var(--ac)' }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDrafts ? (
        <div className="p-3">
          <button onClick={newDraft}
            className="flex items-center gap-1.5 mb-2 px-2 py-1"
            style={{ color: 'var(--cy)', ...COND, fontSize: 12, fontWeight: 700 }}>
            <ChevronLeft className="w-3.5 h-3.5" /> Back to composer
          </button>
          {isLoading ? (
            <p className="px-2 py-6 text-center" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>Loading drafts…</p>
          ) : drafts.length === 0 ? (
            <p className="px-2 py-6 text-center" style={{ ...COND, fontSize: 13, color: 'var(--mu)' }}>
              No saved drafts yet — write one and tap Save draft.
            </p>
          ) : (
            <div className="space-y-2">
              {drafts.map(d => (
                <div key={d.id} className="flex items-center gap-2 px-3 rounded-xl"
                  style={{ minHeight: 56, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bd)' }}>
                  <button onClick={() => loadDraft(d)} className="flex-1 text-left py-2">
                    <p className="font-bold truncate" style={{ ...COND, fontSize: 14, color: 'var(--tx)' }}>
                      {d.title || 'Untitled draft'}
                    </p>
                    <p className="truncate" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--mu)' }}>
                      {d.updated_date ? new Date(d.updated_date).toLocaleDateString() : 'Draft'}
                    </p>
                  </button>
                  <button onClick={() => deleteMut.mutate(d.id)} aria-label="Delete draft"
                    className="flex items-center justify-center rounded-lg tap-44"
                    style={{ width: 44, height: 44, color: 'var(--bl)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <Label>Subject</Label>
            <input style={fieldStyle} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Your newsletter subject…" />
          </div>
          <div>
            <Label>Preview text</Label>
            <input style={fieldStyle} value={form.preview_text}
              onChange={e => setForm(f => ({ ...f, preview_text: e.target.value }))}
              placeholder="Short line shown in the inbox…" />
          </div>
          <div>
            <Label>Body</Label>
            <textarea
              style={{ ...fieldStyle, height: 190, padding: '12px 13px', resize: 'vertical', lineHeight: 1.6 }}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder={'Write your newsletter…\n\n## Section heading\n**bold** *italic*'}
            />
            <p className="mt-1" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--mu)' }}>
              ## heading · **bold** · *italic*
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setPreview({ ...form })} disabled={!canSend}
              className="flex items-center justify-center gap-1.5 rounded-xl tap-44"
              style={{ flex: 1, minHeight: 44, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--bd)', color: canSend ? 'var(--tx)' : 'var(--di)', ...COND, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={() => saveMut.mutate({ ...form })}
              disabled={!form.title.trim() || saveMut.isPending}
              className="flex items-center justify-center gap-1.5 rounded-xl tap-44"
              style={{ flex: 1, minHeight: 44, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: 'var(--cy)', ...COND, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>
              <Save className="w-4 h-4" /> {saveMut.isPending ? 'Saving…' : 'Save draft'}
            </button>
          </div>
          <button onClick={() => sendMut.mutate()} disabled={!canSend || sendMut.isPending}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl tap-44"
            style={{
              minHeight: 46,
              background: canSend ? 'linear-gradient(90deg, var(--ac), var(--go))' : 'rgba(255,255,255,0.05)',
              color: canSend ? '#05050C' : 'var(--di)',
              border: 'none',
              ...COND, fontSize: 13, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
            <Send className="w-4 h-4" /> {sendMut.isPending ? 'Sending…' : 'Send to followers'}
          </button>
          {editingId && (
            <p className="text-center" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--mu)' }}>
              Editing a saved draft
            </p>
          )}
        </div>
      )}

      <NewsletterPreview draft={preview} onClose={() => setPreview(null)} />
    </div>
  );
}