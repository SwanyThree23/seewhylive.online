import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';

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
          <label className="text-[9px] text-white/60 uppercase block mb-1.5">Stream Title</label>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="bg-white/5 border-white/10 text-white text-sm h-9"
            />
          ) : (
            <div className="text-white text-sm font-semibold line-clamp-2">{title}</div>
          )}
          {isEditing && (
            <p className="text-[8px] text-white/40 mt-1">{title.length}/80 characters</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="text-[9px] text-white/60 uppercase block mb-1.5">Category</label>
          {isEditing ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-2 text-[9px] text-white/80"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          ) : (
            <div className="text-white/70 text-[9px] capitalize">{category}</div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="text-[9px] text-white/60 uppercase block mb-1.5">Tags</label>
          {isEditing ? (
            <>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type a tag, press Enter"
                className="bg-white/5 border-white/10 text-white text-[9px] h-8 mb-2"
              />
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map(tag => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded text-[8px] font-semibold"
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
                  <span key={tag} className="inline-block bg-white/10 text-white/70 px-1.5 py-0.5 rounded text-[8px]">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-white/40">No tags added</span>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <Button
            onClick={handleSave}
            className="w-full bg-[#d4af37] text-black hover:bg-[#e6c158] font-semibold text-sm h-9 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        )}
      </div>
    </motion.div>
  );
}