import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trash2, Copy, Save } from 'lucide-react';

const BG = '#080B18';
const GOLD = '#D4AF37';
const CRIMSON = '#800020';
const T = { fontFamily: 'Barlow Condensed, sans-serif' };
const inp = { width: '100%', padding: '10px 14px', background: 'rgba(17,8,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Barlow Condensed, sans-serif' };
const lbl = { display: 'block', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14 };

const categories = {
  quick: '⚡ Quick', engagement: '🎯 Engagement', decision: '🤔 Decision', feedback: '💬 Feedback', custom: '✨ Custom',
};

export default function PollManager() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', question: '', options: ['', ''], timeout_seconds: 60, allow_re_vote: false, category: 'custom' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: templates } = useQuery({
    queryKey: ['pollTemplates', user?.id],
    queryFn: () => user ? base44.entities.PollTemplate.filter({ creator_id: user.id }) : Promise.resolve([]),
    enabled: !!user,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.PollTemplate.create({ ...data, creator_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollTemplates', user?.id] });
      setFormData({ name: '', question: '', options: ['', ''], timeout_seconds: 60, allow_re_vote: false, category: 'custom' });
      setShowForm(false);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.PollTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pollTemplates', user?.id] }),
  });

  const handleAddOption = () => setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
  const handleRemoveOption = (idx) => setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  const handleOptionChange = (idx, value) => setFormData(prev => ({ ...prev, options: prev.options.map((opt, i) => i === idx ? value : opt) }));

  const handleSubmit = () => {
    if (!formData.name || !formData.question || formData.options.some(o => !o)) { alert('Please fill in all fields'); return; }
    createTemplateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 md:px-8 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,11,24,0.97)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={T}>Poll Templates</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Create reusable poll templates for your streams</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
            style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        {/* Create form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <h2 className="font-black text-sm text-white mb-2" style={T}>New Poll Template</h2>
            <label style={lbl}>Template Name</label>
            <input placeholder="e.g., Quick Yes/No" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inp} />
            <label style={lbl}>Poll Question</label>
            <input placeholder="What would you like to ask?" value={formData.question} onChange={e => setFormData(p => ({ ...p, question: e.target.value }))} style={inp} />
            <label style={lbl}>Options</label>
            <div className="space-y-2">
              {formData.options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input placeholder={`Option ${idx + 1}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} style={{ ...inp, flex: 1 }} />
                  {formData.options.length > 2 && (
                    <button onClick={() => handleRemoveOption(idx)}
                      className="px-3 rounded-lg" style={{ background: 'rgba(255,21,100,0.08)', border: '1px solid rgba(255,21,100,0.2)', cursor: 'pointer' }}>
                      <Trash2 className="w-4 h-4" style={{ color: '#FF1564' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleAddOption}
              className="mt-2 flex items-center gap-1.5 text-xs font-black uppercase"
              style={{ ...T, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 0' }}>
              <Plus className="w-3.5 h-3.5" /> Add Option
            </button>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label style={lbl}>Timeout (seconds)</label>
                <input type="number" min="0" value={formData.timeout_seconds}
                  onChange={e => setFormData(p => ({ ...p, timeout_seconds: parseInt(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(categories).map(([key, label]) => (
                    <button key={key} onClick={() => setFormData(p => ({ ...p, category: key }))}
                      style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, border: `1px solid ${formData.category === key ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: formData.category === key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: formData.category === key ? '#D4AF37' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-3">
              <input type="checkbox" checked={formData.allow_re_vote} onChange={e => setFormData(p => ({ ...p, allow_re_vote: e.target.checked }))} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Allow users to re-vote</span>
            </label>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg font-black uppercase text-xs"
                style={{ ...T, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs"
                style={{ ...T, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD})`, border: 'none', color: '#000', cursor: 'pointer' }}>
                <Save className="w-4 h-4" /> Save Template
              </button>
            </div>
          </motion.div>
        )}

        {/* Templates grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates?.map(template => (
            <motion.div key={template.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 rounded-2xl" style={{ background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-black text-sm text-white" style={T}>{template.name}</h3>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full uppercase mt-1 inline-block"
                    style={{ ...T, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#a78bfa' }}>
                    {categories[template.category]}
                  </span>
                </div>
                <button onClick={() => deleteTemplateMutation.mutate(template.id)}
                  className="p-1.5 rounded-lg" style={{ background: 'rgba(255,21,100,0.06)', border: '1px solid rgba(255,21,100,0.15)', cursor: 'pointer' }}>
                  <Trash2 className="w-4 h-4" style={{ color: '#FF1564' }} />
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{template.question}</p>
              <div className="space-y-1 mb-3">
                {template.options.map((opt, idx) => (
                  <div key={idx} className="text-xs flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                    {opt}
                  </div>
                ))}
              </div>
              <div className="text-xs space-y-1 border-t pt-2" style={{ color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>⏱ {template.timeout_seconds}s timeout</div>
                {template.allow_re_vote && <div>🔄 Re-vote allowed</div>}
              </div>
            </motion.div>
          ))}
        </div>

        {templates?.length === 0 && !showForm && (
          <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <p className="text-sm mb-4" style={T}>No templates yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
