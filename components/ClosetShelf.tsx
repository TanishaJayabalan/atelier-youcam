import React, { useState, useEffect } from 'react';
import { Shirt, Sparkles, CheckCircle2, PlusCircle, Filter, ShoppingBag, Wand2, ArrowRight } from 'lucide-react';
import { ClosetItem } from '@/lib/supabase';
import { useCart } from './CartContext';
import { UserBeautyProfile } from '@/types/beauty-profile';
import { generateLookFromOwnedProducts, GeneratedOwnedLook } from '@/lib/owned-look-generator';

interface ClosetShelfProps {
  onItemsUpdated?: () => void;
  beautyProfile?: UserBeautyProfile;
  onApplyGeneratedLook?: (effects: any[]) => void;
}

export default function ClosetShelf({ onItemsUpdated, beautyProfile, onApplyGeneratedLook }: ClosetShelfProps) {
  const { addToCart } = useCart();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [generatedLook, setGeneratedLook] = useState<GeneratedOwnedLook | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/closet');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch closet:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleGenerateLook = () => {
    const ownedOnly = items.filter((i) => i.is_owned);
    const look = generateLookFromOwnedProducts(ownedOnly, beautyProfile);
    setGeneratedLook(look);
    if (onApplyGeneratedLook && look.vtoPayloadEffects.length > 0) {
      onApplyGeneratedLook(look.vtoPayloadEffects);
    }
  };

  const toggleOwned = async (item: ClosetItem) => {
    const nextOwned = !item.is_owned;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_owned: nextOwned } : i))
    );

    try {
      await fetch('/api/closet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_owned: nextOwned }),
      });
      onItemsUpdated?.();
    } catch (e) {
      console.error('Toggle failed:', e);
      fetchItems(); // revert
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'outfit') return item.category.startsWith('outfit_');
    return item.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'outfit', label: 'Wardrobe & Apparel' },
    { id: 'makeup', label: 'Makeup & Shades' },
    { id: 'skincare', label: 'Skincare & Actives' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Shirt className="w-5 h-5 text-amber-700" />
            Your Digital Wardrobe & Beauty Shelf
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Your inventory is analyzed in real-time to generate custom daily routines and virtual try-on looks.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex bg-stone-100 p-1 rounded-xl gap-1 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature 1.7: Use What You Have - Look Generator Banner */}
      <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 via-purple-50/40 to-amber-50 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full">
              Feature 1.7: Use What You Have
            </span>
            <span className="text-xs font-semibold text-stone-700">Instant Wardrobe Look Synthesizer</span>
          </div>
          <p className="text-xs text-stone-600">
            Synthesizes your owned makeup inventory into an architectural VTO look adapted to your facial geometry.
          </p>
        </div>

        <button
          onClick={handleGenerateLook}
          className="px-4 py-2 bg-stone-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-300" />
          ✨ Generate Look From My Closet
        </button>
      </div>

      {/* Generated Look Breakdown Drawer */}
      {generatedLook && (
        <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {generatedLook.lookName}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {generatedLook.completenessScore}% Wardrobe-Powered
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">{generatedLook.summaryMessage}</p>
            </div>

            <button
              onClick={() => setGeneratedLook(null)}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {generatedLook.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                  step.status === 'covered'
                    ? 'bg-white border-emerald-300 shadow-2xs'
                    : 'bg-amber-50/50 border-amber-200/80 border-dashed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-stone-900 text-[11px]">{step.categoryName}</span>
                    {step.status === 'covered' ? (
                      <span className="text-[10px] text-emerald-700 font-bold">✓ Owned</span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-medium">Gap Missing</span>
                    )}
                  </div>

                  {step.itemUsed ? (
                    <div className="mt-1">
                      <p className="text-[11px] font-medium text-stone-800 truncate">{step.itemUsed.name}</p>
                      <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5">{step.techniqueNote}</p>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-[10px] text-stone-500 line-clamp-2">{step.techniqueNote}</p>
                      <p className="text-[10px] font-medium text-amber-900 mt-1 truncate">Suggested: {step.suggestedGapFill}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl bg-stone-100 aspect-[3/4] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-96 overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isOwned = item.is_owned;
            const meta = item.metadata as any;

            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                  isOwned
                    ? 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                    : 'border-dashed border-stone-300 bg-stone-100/50 opacity-60'
                }`}
              >
                {/* Product Image */}
                <div className="relative rounded-lg overflow-hidden aspect-square bg-stone-200 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {meta?.shade_hex && (
                    <span
                      className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: meta.shade_hex }}
                    />
                  )}
                </div>

                {/* Info */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">
                    {item.brand || item.category.replace('outfit_', '')}
                  </span>
                  <h4 className="text-xs font-semibold text-stone-900 line-clamp-1 mt-0.5">
                    {item.name}
                  </h4>

                  {/* Metadata pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {meta?.formality_tag && (
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                        {meta.formality_tag}
                      </span>
                    )}
                    {meta?.active_ingredients && meta.active_ingredients.length > 0 && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-medium px-1.5 py-0.5 rounded">
                        {meta.active_ingredients[0].replace('_', ' ')}
                      </span>
                    )}
                    {meta?.finish && (
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                        {meta.finish}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleOwned(item)}
                    className={`w-full py-1 px-2 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isOwned
                        ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                        : 'bg-amber-700 hover:bg-amber-800 text-white shadow-2xs'
                    }`}
                  >
                    {isOwned ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Owned in Closet
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3 h-3" />
                        Mark as Owned
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: item.id,
                        name: item.name,
                        brand: item.brand,
                        category: item.category,
                        image_url: item.image_url,
                      })
                    }
                    className="w-full py-0.5 px-2 rounded-lg text-[9px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-2.5 h-2.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
