import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';

const G = '#d4af37';

const STATUS_COLOR = {
  draft: 'rgba(255,255,255,0.45)',
  active: '#6DBF7E',
  fired: '#CC7755',
};

export default function SavedAdTemplates({ user }) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['my-ad-templates', user?.id],
    queryFn: () => base44.entities.AdTemplate.filter({ creator_id: user.id }, '-created_date', 20),
    enabled: !!user?.id,
  });

  return (
    <section
      className="rounded-2xl p-4"
      style={{ background: 'rgba(13,16,34,0.95)', border: '1px solid rgba(212,175,55,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-4 h-4" style={{ color: G }} />
        <h2 className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: G }}>
          Saved Ad Templates
        </h2>
      </div>

      {isLoading && <p className="text-xs text-white/40 py-4 text-center">Loading…</p>}

      {!isLoading && templates.length === 0 && (
        <p className="text-xs text-white/40 py-4 text-center">
          No saved templates yet — build one in the Product Ad Studio.
        </p>
      )}

      <div className="space-y-1.5">
        {templates.map((tpl) => (
          <div key={tpl.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            {tpl.product_image ? (
              <img src={tpl.product_image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.12)' }}>
                <Megaphone className="w-4 h-4" style={{ color: G }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/85 leading-tight truncate">{tpl.template_name}</p>
              {tpl.product_name && (
                <p className="text-xs text-white/45 mt-0.5 truncate">{tpl.product_name}</p>
              )}
            </div>
            <span className="text-xs font-bold uppercase shrink-0"
              style={{ color: STATUS_COLOR[tpl.status] || STATUS_COLOR.draft }}>
              {tpl.status || 'draft'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}