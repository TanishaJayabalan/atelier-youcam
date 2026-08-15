'use client';

import React, { useState, useEffect } from 'react';
import { Shirt, Sparkles, CheckCircle2, PlusCircle, Filter } from 'lucide-react';
import { ClosetItem } from '@/lib/supabase';

interface ClosetShelfProps {
  onItemsUpdated?: () => void;
}

export default function ClosetShelf({ onItemsUpdated }: ClosetShelfProps) {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

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

                {/* Owned Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleOwned(item)}
                  className={`mt-2.5 w-full py-1 px-2 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
