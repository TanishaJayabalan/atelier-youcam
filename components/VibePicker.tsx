'use client';

import React from 'react';
import { Crown, Sparkles, Flame, Leaf, Check } from 'lucide-react';

export type VibeType = 'classy' | 'elegant' | 'bold' | 'natural';

interface VibePickerProps {
  selectedVibe: VibeType;
  onSelectVibe: (vibe: VibeType) => void;
}

interface VibeOption {
  id: VibeType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  swatches: string[];
}

const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'classy',
    title: 'Classy Chic',
    subtitle: 'Tailored silhouettes, velvety satin finish, and refined balance',
    icon: Crown,
    tags: ['Structured', 'Satin Finish', 'Berry / Terracotta'],
    swatches: ['#FDFBF7', '#C19A6B', '#3D2B1F', '#B85D43'],
  },
  {
    id: 'elegant',
    title: 'Ethereal Elegant',
    subtitle: 'Luminous glowing base, flowing fabrics, and romantic soft-rose tones',
    icon: Sparkles,
    tags: ['Luminous Glow', 'Silk Satin', 'Soft Rose'],
    swatches: ['#097969', '#E68A9E', '#D2B48C', '#E89078'],
  },
  {
    id: 'bold',
    title: 'Statement Bold',
    subtitle: 'High-contrast editorial focus, architectural lines, and crimson lips',
    icon: Flame,
    tags: ['Editorial Focus', 'Matte Finish', 'Crimson Lip'],
    swatches: ['#1B1B1B', '#CC5500', '#B31B1B', '#422B1E'],
  },
  {
    id: 'natural',
    title: 'Effortless Natural',
    subtitle: 'Clean girl minimalism, sheer tinted moisture, and breathable linens',
    icon: Leaf,
    tags: ['Clean Minimalism', 'Dewy Sheer', 'Warm Nude'],
    swatches: ['#708238', '#DFAC82', '#C97A63', '#264366'],
  },
];

export default function VibePicker({ selectedVibe, onSelectVibe }: VibePickerProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-700" />
          2. Choose Today&apos;s Desired Vibe
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Our recommendation engine will formulate makeup intensities, color palettes, and outfit pairings tailored to your aesthetic.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {VIBE_OPTIONS.map((vibe) => {
          const isSelected = selectedVibe === vibe.id;
          const Icon = vibe.icon;

          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => onSelectVibe(vibe.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-700 bg-amber-50/40 shadow-xs ring-2 ring-amber-600/20'
                  : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-stone-900">{vibe.title}</span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-3">{vibe.subtitle}</p>
              </div>

              <div>
                {/* Micro tags */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {vibe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium bg-stone-200/70 text-stone-700 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Swatch dots */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-200/60">
                  <span className="text-[10px] text-stone-600 font-medium mr-1">Palette:</span>
                  {vibe.swatches.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
