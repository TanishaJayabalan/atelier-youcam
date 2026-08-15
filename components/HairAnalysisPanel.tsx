'use client';

import React, { useState } from 'react';
import { HairProfile, UserBeautyProfile } from '@/types/beauty-profile';
import { HAIRSTYLE_TEMPLATES, HairStyleTemplate } from '@/lib/youcam/hair-style-vto';
import { HAIR_COLOR_SHADES, HairColorShade } from '@/lib/youcam/hair-color-vto';
import { generateHairCareRoutine, HairCareRoutine, HairProductItem } from '@/lib/hair-recommendation-engine';
import { useCart } from './CartContext';

interface HairAnalysisPanelProps {
  userImageUrl?: string;
  beautyProfile?: UserBeautyProfile;
}

export default function HairAnalysisPanel({
  userImageUrl,
  beautyProfile,
}: HairAnalysisPanelProps) {
  const { addToCart } = useCart();
  const [hairProfile, setHairProfile] = useState<HairProfile>({
    curlType: '2b to 2c',
    curlTerm: 'Medium to Defined Wavy',
    curlCategory: 'wavy',
    length: 'above chest',
    lengthTerm: 'Medium Shoulder / Collarbone Length',
    frizziness: 2,
    frizzTerm: 'Frizzy',
    naturalColorHex: '#2B211D',
    naturalColorName: 'Espresso Brunette',
  });

  const [activeTab, setActiveTab] = useState<'styles' | 'colors' | 'routine'>('styles');
  const [selectedStyle, setSelectedStyle] = useState<string>('style_wavy_lob');
  const [selectedColor, setSelectedColor] = useState<string>('color_caramel_balayage');
  const [renderedHairUrl, setRenderedHairUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const routine: HairCareRoutine = generateHairCareRoutine(hairProfile, beautyProfile);

  const handleApplyStyle = async (template: HairStyleTemplate) => {
    if (!userImageUrl) return;
    setSelectedStyle(template.id);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/youcam/hair-style-vto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageUrl,
          templateId: template.id,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setRenderedHairUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Hair style VTO error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyColor = async (shade: HairColorShade) => {
    if (!userImageUrl) return;
    setSelectedColor(shade.id);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/youcam/hair-color-vto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageUrl,
          colorId: shade.id,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setRenderedHairUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Hair color VTO error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = (item: HairProductItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: 'haircare',
      priceEstimate: `$${item.price}`,
      image_url: item.image_url,
      externalUrl: `https://www.sephora.com/search?keyword=${encodeURIComponent(item.name)}`,
      reason: item.reason,
    });
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              AI Trichology & Hair VTO
            </span>
            <span className="text-xs text-stone-500">Curl Pattern · Frizz Index · Virtual Restyle</span>
          </div>
          <h3 className="text-lg font-serif font-medium text-stone-900">
            Hair Diagnostics & Virtual Studio
          </h3>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'styles' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Hairstyles VTO
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'colors' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Color Shades
          </button>
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'routine' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Care Routine
          </button>
        </div>
      </div>

      {/* Optical Telemetry Badges */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Curl Type</span>
          <p className="text-sm font-semibold text-stone-900">{hairProfile.curlTerm}</p>
          <span className="text-[11px] text-amber-700 font-mono">Pattern {hairProfile.curlType}</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Length Density</span>
          <p className="text-sm font-semibold text-stone-900 capitalize">{hairProfile.length}</p>
          <span className="text-[11px] text-stone-500">Shoulder Frame</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Frizz Sensitivity</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-semibold text-stone-900">{hairProfile.frizzTerm}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-[11px] text-stone-500">Humidity Reactive</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Natural Pigment</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
              style={{ backgroundColor: hairProfile.naturalColorHex }}
            />
            <span className="text-xs font-semibold text-stone-900 truncate">{hairProfile.naturalColorName}</span>
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="mt-6">
        {/* TAB 1: HAIRSTYLES VTO */}
        {activeTab === 'styles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Template Gallery */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-3.5">
              {HAIRSTYLE_TEMPLATES.map((tmpl) => {
                const isSelected = selectedStyle === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleApplyStyle(tmpl)}
                    className={`cursor-pointer group p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/60 border-amber-500 shadow-sm'
                        : 'bg-stone-50 hover:bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2.5">
                      <img
                        src={tmpl.previewImageUrl}
                        alt={tmpl.name}
                        className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
                            {tmpl.effortLevel}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-stone-900 truncate">{tmpl.name}</h4>
                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                          {tmpl.description}
                        </p>
                      </div>
                    </div>

                    <button
                      className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isSelected ? 'bg-amber-700 text-white' : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {isSelected ? '✓ Style Selected' : 'Try On Style'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Live Try-On Render View */}
            <div className="lg:col-span-4 bg-stone-900 rounded-xl overflow-hidden border border-stone-800 p-4 flex flex-col items-center justify-center text-center relative aspect-[3/4] shadow-md">
              {renderedHairUrl ? (
                <img src={renderedHairUrl} alt="Restyled Hair" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="space-y-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <h5 className="text-xs font-semibold text-stone-200">AI Hairstyle Try-On Ready</h5>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Select any haircut template to render a realistic 3D hair transfer preview on your selfie.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                  <span className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  <span className="text-xs font-mono text-amber-300">Simulating Hair Volume & Texture...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COLOR SHADES VTO */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {HAIR_COLOR_SHADES.map((shade) => {
                const isSelected = selectedColor === shade.id;
                return (
                  <div
                    key={shade.id}
                    onClick={() => handleApplyColor(shade)}
                    className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-stone-50 hover:bg-white border-stone-200'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2 border-2 border-white shadow-md"
                      style={{ backgroundColor: shade.hex }}
                    />
                    <h5 className="text-xs font-semibold text-stone-900 truncate">{shade.name}</h5>
                    <span className="text-[10px] text-stone-500 block truncate">{shade.toneFamily}</span>
                  </div>
                );
              })}
            </div>

            {renderedHairUrl && (
              <div className="p-4 bg-stone-900 rounded-xl flex items-center justify-between text-stone-200">
                <div className="flex items-center gap-3">
                  <img src={renderedHairUrl} alt="Applied Color" className="w-12 h-12 rounded-lg object-cover border border-stone-700" />
                  <div>
                    <h6 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Hair Shade Applied</h6>
                    <p className="text-xs text-stone-300">Virtual color glaze active on your selfie.</p>
                  </div>
                </div>
                <button
                  onClick={() => setRenderedHairUrl(null)}
                  className="text-xs text-stone-400 hover:text-white underline"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CARE ROUTINE & PRODUCTS */}
        {activeTab === 'routine' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Step by step routine */}
            <div className="lg:col-span-6 space-y-3">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Personalized Frizz Defense Routine
                </h5>
                <p className="text-xs text-stone-600 leading-relaxed">{routine.frizzDefenseStrategy}</p>
                <div className="space-y-2 pt-2 border-t border-stone-200 text-xs text-stone-700">
                  <p><strong className="text-stone-900">1. Cleansing:</strong> {routine.washRoutine.step1}</p>
                  <p><strong className="text-stone-900">2. Conditioning:</strong> {routine.washRoutine.step2}</p>
                  <p><strong className="text-stone-900">3. Moisture Sealing:</strong> {routine.washRoutine.step3}</p>
                </div>
              </div>
            </div>

            {/* Recommended Products Shelf */}
            <div className="lg:col-span-6 space-y-3">
              <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Prescribed Haircare Products
              </h5>
              <div className="space-y-2.5">
                {routine.recommendedProducts.map((prod) => {
                  const isAdded = addedItemIds[prod.id];
                  return (
                    <div
                      key={prod.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-amber-800 uppercase block">{prod.brand}</span>
                          <h6 className="text-xs font-semibold text-stone-900 truncate">{prod.name}</h6>
                          <p className="text-[11px] text-stone-500 truncate">${prod.price} · {prod.reason}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm'
                        }`}
                      >
                        {isAdded ? '✓ Added' : '+ Add to Cart'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
