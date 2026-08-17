'use client';

import React from 'react';
import { Filter, Check } from 'lucide-react';

export interface HairstyleOption {
  id: string;
  name: string;
  tag: string;
  imageUrl: string;
}

const HAIRSTYLE_OPTIONS: HairstyleOption[] = [
  { id: 'modern_blunt_bob', name: 'Modern Blunt Bob', tag: 'Low Maintenance', imageUrl: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'soft_layers', name: 'Soft Layers', tag: 'Medium', imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'curtain_bangs', name: 'Curtain Bangs', tag: 'Low Maintenance', imageUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'beach_waves', name: 'Beach Waves', tag: 'Trendy', imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'sleek_straight', name: 'Sleek Straight', tag: 'Low Maintenance', imageUrl: 'https://images.unsplash.com/photo-1512413914595-5dbd79d7219f?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'messy_bun', name: 'Messy Bun', tag: 'Easy', imageUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'wolf_cut', name: 'Wolf Cut', tag: 'Trendy', imageUrl: 'https://images.unsplash.com/photo-1632731885542-f8ab511e64ff?auto=format&fit=crop&w=300&h=400&q=80' },
  { id: 'classic_blowout', name: 'Classic Blowout', tag: 'Medium', imageUrl: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=300&h=400&q=80' }
];

interface HairstylePickerProps {
  selectedStyle: string;
  onSelectStyle: (id: string) => void;
}

export default function HairstylePicker({ selectedStyle, onSelectStyle }: HairstylePickerProps) {
  const filters = ['All Styles', 'Short', 'Medium', 'Long', 'Trendy', 'Low Maintenance'];

  return (
    <div className="bg-[#FAF9F6] p-6 rounded-2xl flex flex-col h-full border border-[#E8E2D9]">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#2C2C2C] mb-1">Try on hairstyles, virtually.</h2>
        <p className="text-sm text-stone-500">Real-time AI try-on tailored to your face shape.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 flex-1 items-center pb-2">
          {filters.map((filter, idx) => (
            <button
              key={filter}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                idx === 0 
                  ? 'bg-white shadow-sm border border-[#E8E2D9] text-[#694A33]' 
                  : 'text-stone-500 hover:text-[#2C2C2C]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-stone-600 shadow-sm shrink-0 mb-2 hover:bg-stone-50">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
        {HAIRSTYLE_OPTIONS.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <div 
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className={`relative bg-white rounded-2xl p-2 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-[#C28250] shadow-md bg-[#FFF9F5]' : 'border border-[#E8E2D9] hover:border-[#D9CDB8]'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#C28250] rounded-full flex items-center justify-center shadow-sm z-10 border-2 border-white">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </div>
              )}
              <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={style.imageUrl} alt={style.name} className="w-full h-full object-cover" />
              </div>
              <div className="px-1">
                <h3 className="text-xs font-bold text-[#2C2C2C] truncate">{style.name}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#F8F6F3] text-stone-500 text-[9px] font-medium rounded-full uppercase tracking-wider">
                  {style.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-[#E8E2D9] text-xs text-stone-400 flex items-center gap-2">
        <span className="text-amber-500 text-lg leading-none">*</span>
        Tip: Try different styles and find what suits you best.
      </div>
    </div>
  );
}
