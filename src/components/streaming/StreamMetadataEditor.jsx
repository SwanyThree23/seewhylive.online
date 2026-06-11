import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, X } from 'lucide-react';

const inputStyle = { width:'100%', padding:'10px 14px', background:'rgba(8,11,24,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'Barlow Condensed, sans-serif' };

export default function StreamMetadataEditor({ initialTitle = 'Live Stream', initialCategory = 'gaming' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState('');
  const [tagList, setTagList] = useState([]);

  const CATEGORIES = ['gaming', 'music', 'talk', 'creative', 'educational', 'fitness', 'cooking', 'other'];

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tags.trim()) {
      e.preventDefault();
      if (!tagList.includes(tags.trim())) {
        setTagList([...tagList, tags.trim()]);
      }
      setTags('');
    }
  };

  const removeTag = (tag) => {
    setTagList(tagList.filter(t => t !== tag));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1a0a2e]/50 border border-[#d4af37]/15 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Stream Info</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-[10px] text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
        >
          {isEditing ? (
            <>
              <X className="w-3 h-3" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-3 h-3" />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="text-[11px] text-white/60 uppercase block mb-1.5">Stream Title</label>
          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              style={{ ...inputStyle, height:36 }}
            />
          ) : (
            <div className="text-white text-sm font-semibold line-clamp-2">{title}</div>
          )}
          {isEditing && (
            <p className="text-[11px] text-white/40 mt-1">{title.length}/80 characters</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="text-[11px] text-white/60 uppercase block mb-1.5">Category</label>
          {isEditing ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-2 text-[11px] text-white/80"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          ) : (
            <div className="text-white/70 text-[11px] capitalize">{category}</div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="text-[11px] text-white/60 uppercase block mb-1.5">Tags</label>
          {isEditing ? (
            <>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type a tag, press Enter"
                style={{ ...inputStyle, fontSize:9, height:32, marginBottom:8 }}
              />
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map(tag => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded text-[11px] font-semibold"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-[#d4af37]/60 hover:text-[#d4af37]"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-1">
              {tagList.length > 0 ? (
                tagList.map(tag => (
                  <span key={tag} className="inline-block bg-white/10 text-white/70 px-1.5 py-0.5 rounded text-[11px]">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-white/40">No tags added</span>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <button
            onClick={handleSave}
            style={{ width:'100%', background:'#D4AF37', color:'#000', border:'none', borderRadius:8, fontWeight:600, fontSize:14, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Barlow Condensed, sans-serif' }}
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        )}
      </div>
    </motion.div>
  );
}