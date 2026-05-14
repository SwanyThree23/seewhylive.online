import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Plus, Trash2, Copy, Save } from 'lucide-react';

export default function PollManager() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    question: '',
    options: ['', ''],
    timeout_seconds: 60,
    allow_re_vote: false,
    category: 'custom',
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates } = useQuery({
    queryKey: ['pollTemplates', user?.id],
    queryFn: () => user ? base44.entities.PollTemplate.filter({ creator_id: user.id }) : Promise.resolve([]),
    enabled: !!user,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.PollTemplate.create({
      ...data,
      creator_id: user.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollTemplates', user?.id] });
      setFormData({
        name: '',
        question: '',
        options: ['', ''],
        timeout_seconds: 60,
        allow_re_vote: false,
        category: 'custom',
      });
      setShowForm(false);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId) => base44.entities.PollTemplate.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollTemplates', user?.id] });
    },
  });

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const handleRemoveOption = (idx) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  const handleOptionChange = (idx, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === idx ? value : opt),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.question || formData.options.some(o => !o)) {
      alert('Please fill in all fields');
      return;
    }
    createTemplateMutation.mutate(formData);
  };

  const categories = {
    quick: '⚡ Quick',
    engagement: '🎯 Engagement',
    decision: '🤔 Decision',
    feedback: '💬 Feedback',
    custom: '✨ Custom',
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#0B0B18' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#d4af37' }}>Poll Templates</h1>
          <p className="text-white/50">Create reusable poll templates for your streams</p>
        </div>

        {/* Create form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl space-y-4"
            style={{ background: 'rgba(11,11,24,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <h2 className="font-bold text-lg">New Poll Template</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <Input
                placeholder="e.g., Quick Yes/No"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Poll Question</label>
              <Input
                placeholder="What would you like to ask?"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="space-y-2">
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                    {formData.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={handleAddOption}
                variant="ghost"
                className="mt-2 gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Add Option
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Timeout (seconds)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.timeout_seconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_re_vote}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_re_vote: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Allow users to re-vote</span>
            </label>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit} style={{ background: '#d4af37', color: '#000' }} className="gap-2">
                <Save className="w-4 h-4" /> Save Template
              </Button>
            </div>
          </motion.div>
        )}

        {/* Templates grid */}
        <div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="mb-4 gap-2"
              style={{ background: '#d4af37', color: '#000' }}
            >
              <Plus className="w-4 h-4" /> New Template
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates?.map(template => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl"
                style={{ background: 'rgba(11,11,24,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{template.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full mt-1 inline-block" style={{ background: 'rgba(139,92,246,0.2)', color: '#8B5CF6' }}>
                      {categories[template.category]}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                <p className="text-sm text-white/70 mb-3">{template.question}</p>

                <div className="space-y-1 mb-3">
                  {template.options.map((opt, idx) => (
                    <div key={idx} className="text-xs text-white/50 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4af37' }} />
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="text-xs text-white/40 space-y-1 border-t border-white/10 pt-2">
                  <div>⏱ {template.timeout_seconds}s timeout</div>
                  {template.allow_re_vote && <div>🔄 Re-vote allowed</div>}
                </div>
              </motion.div>
            ))}
          </div>

          {templates?.length === 0 && !showForm && (
            <div className="text-center py-12">
              <p className="text-white/50 mb-4">No templates yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}