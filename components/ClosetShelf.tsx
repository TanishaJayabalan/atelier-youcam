import React, { useState, useEffect, useRef } from 'react';
import {
  Shirt,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  ShoppingBag,
  Wand2,
  Plus,
  Upload,
  Camera,
  RefreshCw,
  X,
  Tag,
  Palette,
  CloudSun,
  Layers,
  AlertCircle
} from 'lucide-react';
import { ClosetItem, ClosetCategory } from '@/lib/supabase';
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

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addPhotoPreview, setAddPhotoPreview] = useState<string | null>(null);
  const [addDescription, setAddDescription] = useState('');
  const [addBrand, setAddBrand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAddPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPhotoPreview) {
      setAddError('Please upload or snap a photo of your dress or clothing item.');
      return;
    }
    if (!addDescription.trim()) {
      setAddError('Please provide a short description or name of the garment.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    try {
      const res = await fetch('/api/closet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          photoBase64: addPhotoPreview,
          textDescription: addDescription.trim(),
          brand: addBrand.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add item to closet.');
      }

      setAddSuccessMessage(`Added "${data.item.name}" to your closet! Auto-classified as ${data.classification?.category.replace('outfit_', '')} (${data.classification?.youcamCategory}).`);
      
      // Reset form
      setAddPhotoPreview(null);
      setAddDescription('');
      setAddBrand('');
      
      await fetchItems();
      onItemsUpdated?.();

      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccessMessage(null);
      }, 1800);
    } catch (err: any) {
      setAddError(err.message || 'Could not save wardrobe item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReseedDefaults = async () => {
    setIsReseeding(true);
    try {
      const res = await fetch('/api/closet/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchItems();
        onItemsUpdated?.();
        alert(`✓ Wardrobe successfully populated with ${data.count} curated items!`);
      } else {
        throw new Error(data.error || 'Failed to seed database.');
      }
    } catch (err: any) {
      alert(`Seeding notice: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'outfit') return item.category.startsWith('outfit_');
    if (selectedCategory === 'dress') return item.category === 'outfit_dress';
    return item.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'dress', label: '👗 Dresses' },
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
            Your custom inventory is analyzed in real-time to generate custom daily routines and virtual try-on looks.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Dress / Apparel</span>
          </button>

          <button
            type="button"
            onClick={handleReseedDefaults}
            disabled={isReseeding}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Populate or refresh demo seed dataset in database"
          >
            <RefreshCw className={`w-3 h-3 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'Syncing...' : 'Sync Defaults'}</span>
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex bg-stone-100 p-1 rounded-xl gap-1 overflow-x-auto text-xs mb-5">
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

      {/* Feature 1.7: Use What You Have - Look Generator Banner */}
      <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 via-purple-50/40 to-amber-50 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full">
              Wardrobe AI
            </span>
            <span className="text-xs font-semibold text-stone-700">Dynamic Multi-Garment Outfit & VTO Synthesizer</span>
          </div>
          <p className="text-xs text-stone-600">
            Upload custom dresses or apparel to automatically integrate into your daily AI recommendations and virtual try-ons.
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

      {/* Grid of Items */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl bg-stone-100 aspect-[3/4] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[32rem] overflow-y-auto pr-1">
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
                  {meta?.color_hex && (
                    <span
                      className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: meta.color_hex }}
                      title={meta.color || 'Color'}
                    />
                  )}
                  {meta?.shade_hex && (
                    <span
                      className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: meta.shade_hex }}
                      title={meta.shade_name || 'Shade'}
                    />
                  )}
                </div>

                {/* Info */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">
                    {item.brand || item.category.replace('outfit_', '')}
                  </span>
                  <h4 className="text-xs font-semibold text-stone-900 line-clamp-1 mt-0.5" title={item.name}>
                    {item.name}
                  </h4>

                  {/* Metadata pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {meta?.formality_tag && (
                      <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                        {meta.formality_tag}
                      </span>
                    )}
                    {meta?.fabric && (
                      <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                        {meta.fabric}
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

      {/* ========================================================================= */}
      {/* ADD APPAREL MODAL / DRAWER                                                */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Shirt className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-stone-900">Add Garment to Your Wardrobe</h3>
              </div>
              <p className="text-xs text-stone-500">
                Upload a photo of your dress or clothing item and add a quick description. Our AI auto-classifies the category according to YouCam AI Clothes V4 standards.
              </p>
            </div>

            {addSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-emerald-900">{addSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleAddItem} className="space-y-4">
                {/* Photo Upload Box */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Garment Photo *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {addPhotoPreview ? (
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={addPhotoPreview}
                        alt="Garment Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setAddPhotoPreview(null)}
                        className="absolute top-2 right-2 p-1 bg-stone-900/80 text-white rounded-full hover:bg-stone-900 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-amber-600 hover:bg-amber-50/40 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-800">
                          Click to upload garment photo
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          PNG, JPG, or WEBP (clear front-facing shot recommended for YouCam VTO)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description & Type */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    What is this item? (Description & Type) *
                  </label>
                  <input
                    type="text"
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="e.g. Emerald green satin slip midi dress for evening"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Include garment type (dress, top, trouser, blazer), color, and vibe so AI can optimize recommendations.
                  </p>
                </div>

                {/* Brand / Boutique */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Brand or Boutique (Optional)
                  </label>
                  <input
                    type="text"
                    value={addBrand}
                    onChange={(e) => setAddBrand(e.target.value)}
                    placeholder="e.g. Reformation, Zara, COS, Vintage"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                  />
                </div>

                {/* Error Banner */}
                {addError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Analyzing & Saving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>Add to Wardrobe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
