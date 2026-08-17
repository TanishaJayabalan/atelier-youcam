'use client';

import React from 'react';
import { ShoppingBag, AlertCircle, PlusCircle } from 'lucide-react';
import { GapFillSuggestion } from '@/lib/recommendation-engine';
import { useCart } from './CartContext';

interface GapFillShelfProps {
  suggestions: GapFillSuggestion[];
}

export default function GapFillShelf({ suggestions }: GapFillShelfProps) {
  const { addToCart } = useCart();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#E57A2A]" />
            Curated Gap-Fill Recommendations
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Key items your wardrobe/beauty shelf is currently missing to unlock complete atmospheric protection or stylistic synergy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[#E8E2D9] bg-[#FAF9F6] p-4 flex flex-col justify-between hover:border-[#D9CDB8] transition-all text-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#694A33] bg-[#E8E2D9] px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    item.urgency === 'high'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : item.urgency === 'medium'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {item.urgency.toUpperCase()} PRIORITY
                </span>
              </div>

              <h4 className="font-bold text-stone-900 text-sm mb-1.5 flex items-center justify-between">
                {item.suggestedProduct}
              </h4>

              <p className="text-stone-600 leading-relaxed text-[11px]">
                <strong className="text-stone-800">Why You Need It: </strong>
                {item.reason}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between">
              <span className="text-[10px] text-stone-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Missing in current closet
              </span>
              <button
                type="button"
                onClick={() =>
                  addToCart({
                    name: item.suggestedProduct,
                    category: item.category,
                    reason: item.reason,
                    brand: 'Atelier Pick',
                  })
                }
                className="text-[11px] font-semibold text-[#694A33] hover:text-[#523926] bg-white hover:bg-[#FAF9F6] px-3 py-1 rounded-lg border border-[#E8E2D9] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
