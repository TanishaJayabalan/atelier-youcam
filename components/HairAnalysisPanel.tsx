'use client';

import React, { useState, useEffect } from 'react';
import { HairProfile, UserBeautyProfile } from '@/types/beauty-profile';
import { WeatherResult } from '@/lib/weather';
import { HAIRSTYLE_TEMPLATES, HairStyleTemplate } from '@/lib/youcam/hair-style-vto';
import { HAIR_COLOR_SHADES, HairColorShade } from '@/lib/youcam/hair-color-vto';
import { generateHairCareRoutine, HairCareRoutine, HairProductItem } from '@/lib/hair-recommendation-engine';
import { useCart } from './CartContext';
import { Sparkles, RefreshCw, SlidersHorizontal, Check, AlertTriangle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-fetch';

interface HairAnalysisPanelProps {
  userImageUrl?: string;
  beautyProfile?: UserBeautyProfile;
  weather?: WeatherResult;
}

const CURL_PRESETS = [
  { type: '1a to 1b', term: 'Sleek Straight & Polished', category: 'straight' as const },
  { type: '2a to 2b', term: 'Loose Beach Waves', category: 'wavy' as const },
  { type: '2b to 2c', term: 'Medium to Defined Wavy', category: 'wavy' as const },
  { type: '3a to 3b', term: 'Spiral Curls', category: 'curly' as const },
  { type: '4a to 4c', term: 'Textured Kinks & Coils', category: 'coily' as const },
];

const LENGTH_PRESETS: { id: HairProfile['length']; label: string }[] = [
  { id: 'short hair', label: 'Short / Pixie / Bob' },
  { id: 'above chest', label: 'Medium Shoulder Frame' },
  { id: 'long hair', label: 'Long Flowing Length' },
];

const FRIZZ_PRESETS: { level: 0 | 1 | 2 | 3; term: HairProfile['frizzTerm']; label: string }[] = [
  { level: 0, term: 'Not Frizzy', label: 'Low / Sleek' },
  { level: 1, term: 'Slightly Frizzy', label: 'Slight Frizz' },
  { level: 2, term: 'Frizzy', label: 'Frizzy (Reactive)' },
  { level: 3, term: 'Extreme Frizzy', label: 'Extreme Frizz' },
];

export default function HairAnalysisPanel({
  userImageUrl,
  beautyProfile,
  weather,
}: HairAnalysisPanelProps) {
  const { addToCart } = useCart();
  const [hairProfile, setHairProfile] = useState<HairProfile>({
    curlType: '2b to 2c',
    curlTerm: 'Medium to Defined Wavy',
    curlCategory: 'wavy',
    length: 'above chest',
    lengthTerm: 'Shoulder / Collarbone Frame',
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
  const [isAnalyzingHair, setIsAnalyzingHair] = useState<boolean>(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [showTuning, setShowTuning] = useState<boolean>(false);

  // Dynamic Routine based on active hairProfile + weather
  const routine: HairCareRoutine = generateHairCareRoutine(hairProfile, beautyProfile, weather);

  // Trigger dynamic hair analysis whenever userImageUrl changes
  useEffect(() => {
    if (!userImageUrl) return;

    let isMounted = true;
    const fetchHairDiagnostics = async () => {
      setIsAnalyzingHair(true);
      try {
        const res = await authenticatedFetch('/api/youcam/hair-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userImageUrl: userImageUrl.startsWith('http') ? userImageUrl : undefined,
            userImageBase64: userImageUrl.startsWith('data:') || !userImageUrl.startsWith('http') ? userImageUrl : undefined,
            beautyProfile,
            weather,
          }),
        });

        if (!res.ok) throw new Error('Hair analysis failed');
        const data = await res.json();

        if (isMounted && data.success && data.hairProfile) {
          setHairProfile(data.hairProfile);
        }
      } catch (err) {
        console.warn('Hair diagnostics fetch error:', err);
      } finally {
        if (isMounted) setIsAnalyzingHair(false);
      }
    };

    fetchHairDiagnostics();

    return () => {
      isMounted = false;
    };
  }, [userImageUrl, weather]);

  const handleApplyStyle = async (template: HairStyleTemplate) => {
    if (!userImageUrl) return;
    setSelectedStyle(template.id);
    setIsProcessing(true);

    try {
      const res = await authenticatedFetch('/api/youcam/hair-style-vto', {
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
      const res = await authenticatedFetch('/api/youcam/hair-color-vto', {
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
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              AI Trichology &amp; Hair VTO
            </span>
            <span className="text-xs text-stone-500">Curl Pattern · Frizz Index · Virtual Restyle</span>
            {hairProfile.engineSource && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  hairProfile.engineSource === 'youcam_ai'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
                title={hairProfile.engineNotice || 'Diagnostic Engine Status'}
              >
                {hairProfile.engineSource === 'youcam_ai' ? '✨ Live YouCam AI' : '⚠️ Optical Trichology Fallback'}
              </span>
            )}
            {isAnalyzingHair && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse border border-amber-200">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Scanning Hair Strands...
              </span>
            )}
          </div>
          <h3 className="text-lg font-serif font-medium text-stone-900">
            Hair Diagnostics &amp; Virtual Studio
          </h3>
        </div>

        {/* Tab Controls & Fine-Tuning Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTuning(!showTuning)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showTuning
                ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
            title="Fine-tune detected hair parameters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Fine-Tune</span>
          </button>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => setActiveTab('styles')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'styles' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Hairstyles VTO
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'colors' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Color Shades
            </button>
            <button
              onClick={() => setActiveTab('routine')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'routine' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Care Routine
            </button>
          </div>
        </div>
      </div>

      {/* Fallback Warning Sign Banner */}
      {hairProfile.engineNotice && (
        <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">⚠️ Diagnostics Notice (Fallback Active):</span>
            <span className="text-[11px] text-amber-800">{hairProfile.engineNotice}</span>
          </div>
        </div>
      )}

      {/* Optical Telemetry Badges */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 transition-all hover:border-amber-300">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Curl Type</span>
          <p className="text-sm font-semibold text-stone-900 truncate">{hairProfile.curlTerm}</p>
          <span className="text-[11px] text-amber-700 font-mono">Pattern {hairProfile.curlType}</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 transition-all hover:border-amber-300">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Length Density</span>
          <p className="text-sm font-semibold text-stone-900 capitalize">{hairProfile.length}</p>
          <span className="text-[11px] text-stone-500">{hairProfile.lengthTerm}</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 transition-all hover:border-amber-300">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Frizz Sensitivity</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-semibold text-stone-900">{hairProfile.frizzTerm}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hairProfile.frizziness >= 2 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <span className="text-[11px] text-stone-500">{weather?.humidity ? `${weather.humidity}% Humidity Reactive` : 'Atmospheric Reactive'}</span>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 transition-all hover:border-amber-300">
          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Natural Pigment</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0 shadow-2xs"
              style={{ backgroundColor: hairProfile.naturalColorHex }}
            />
            <span className="text-xs font-semibold text-stone-900 truncate">{hairProfile.naturalColorName}</span>
          </div>
        </div>
      </div>

      {/* Interactive Fine-Tuning Panel */}
      {showTuning && (
        <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Interactive Hair Texture &amp; Length Adjustment
            </span>
            <span className="text-[11px] text-stone-500">
              Updates your care routine &amp; product prescriptions instantly
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Curl Pattern Selector */}
            <div>
              <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                Curl Pattern / Texture:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CURL_PRESETS.map((p) => {
                  const isActive = hairProfile.curlType === p.type;
                  return (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() =>
                        setHairProfile((prev) => ({
                          ...prev,
                          curlType: p.type,
                          curlTerm: p.term,
                          curlCategory: p.category,
                        }))
                      }
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {p.term.split(' ')[0]} ({p.type})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Length Density Selector */}
            <div>
              <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                Hair Length:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LENGTH_PRESETS.map((l) => {
                  const isActive = hairProfile.length === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() =>
                        setHairProfile((prev) => ({
                          ...prev,
                          length: l.id,
                          lengthTerm: l.label,
                        }))
                      }
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frizz Sensitivity Selector */}
            <div>
              <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                Frizz &amp; Humidity Sensitivity:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FRIZZ_PRESETS.map((f) => {
                  const isActive = hairProfile.frizziness === f.level;
                  return (
                    <button
                      key={f.level}
                      type="button"
                      onClick={() =>
                        setHairProfile((prev) => ({
                          ...prev,
                          frizziness: f.level,
                          frizzTerm: f.term,
                        }))
                      }
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="mt-6">
        {/* TAB 1: HAIRSTYLES VTO */}
        {activeTab === 'styles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* VTO Canvas Preview (Moved to Left) */}
            <div className="lg:col-span-7 bg-[#FAF9F6] rounded-3xl overflow-hidden min-h-[500px] flex flex-col items-center justify-center relative shadow-sm border border-[#E8E2D9] p-4">
              {renderedHairUrl ? (
                <img
                  src={renderedHairUrl}
                  alt="Hairstyle Try-On"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : userImageUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={userImageUrl}
                    alt="Original Selfie"
                    className="w-full h-full object-cover rounded-2xl opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex flex-col items-center justify-end p-6 text-center rounded-2xl">
                    <Sparkles className="w-6 h-6 text-amber-400 mb-2 animate-bounce" />
                    <span className="text-sm font-bold text-white tracking-wide">Select Any Haircut For Inspiration</span>
                    <span className="text-[11px] text-stone-200 mt-1">AI 3D Hairstyle Transfer</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-stone-400 bg-white/50 rounded-2xl border border-dashed border-stone-300 w-full max-w-sm mx-auto">
                  <Sparkles className="w-8 h-8 text-[#694A33] mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-semibold text-[#2C2C2C]">AI Hairstyle Try-On Ready</p>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    Upload a selfie first in the Skin Analysis tab, then select any template here for a realistic preview.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-[#2C2C2C] p-4 rounded-2xl z-10">
                  <RefreshCw className="w-8 h-8 text-[#694A33] animate-spin mb-3" />
                  <p className="text-sm font-semibold">Transforming Hair Architecture...</p>
                  <p className="text-[11px] text-stone-500 mt-1">Applying volumetric blending</p>
                </div>
              )}
            </div>

            {/* Template Gallery (Moved to Right) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {HAIRSTYLE_TEMPLATES.map((tmpl) => {
                const isSelected = selectedStyle === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleApplyStyle(tmpl)}
                    className={`cursor-pointer group p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/60 border-amber-500 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-[#E8E2D9] hover:border-stone-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2 mb-3">
                      <img
                        src={tmpl.previewImageUrl}
                        alt={tmpl.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate mb-1">{tmpl.name}</h4>
                        <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                          {tmpl.effortLevel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      className={`w-full py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                        isSelected
                          ? 'bg-[#694A33] text-white shadow-[#694A33]/20'
                          : 'bg-[#F2EBE1] hover:bg-[#E8E2D9] text-[#694A33]'
                      }`}
                    >
                      {isSelected && isProcessing ? 'Rendering...' : 'Try On'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: HAIR COLOR SHADES */}
        {activeTab === 'colors' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* VTO Canvas Preview (Moved to Left) */}
            <div className="lg:col-span-7 bg-[#FAF9F6] rounded-3xl overflow-hidden min-h-[500px] flex flex-col items-center justify-center relative shadow-sm border border-[#E8E2D9] p-4">
              {renderedHairUrl ? (
                <img
                  src={renderedHairUrl}
                  alt="Hair Color Try-On"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : userImageUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={userImageUrl}
                    alt="Original Selfie"
                    className="w-full h-full object-cover rounded-2xl opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex flex-col items-center justify-end p-6 text-center rounded-2xl">
                    <Sparkles className="w-6 h-6 text-amber-400 mb-2 animate-bounce" />
                    <span className="text-sm font-bold text-white tracking-wide">Select Any Hair Color Shade</span>
                    <span className="text-[11px] text-stone-200 mt-1">Renders Neural Hair Tint on Your Selfie</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-stone-400 bg-white/50 rounded-2xl border border-dashed border-stone-300 w-full max-w-sm mx-auto">
                  <Sparkles className="w-8 h-8 text-[#694A33] mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-semibold text-[#2C2C2C]">AI Hair Tint Ready</p>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    Upload a selfie first in the Skin Analysis tab, then select any shade here for a realistic preview.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-[#2C2C2C] p-4 rounded-2xl z-10">
                  <RefreshCw className="w-8 h-8 text-[#694A33] animate-spin mb-3" />
                  <p className="text-sm font-semibold">Synthesizing Keratin Pigment...</p>
                  <p className="text-[11px] text-stone-500 mt-1">Applying global dynamic lighting</p>
                </div>
              )}
            </div>

            {/* Color Gallery (Moved to Right) */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {HAIR_COLOR_SHADES.map((shade) => {
                const isSelected = selectedColor === shade.id;
                return (
                  <div
                    key={shade.id}
                    onClick={() => handleApplyColor(shade)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-center items-center text-center ${
                      isSelected
                        ? 'bg-amber-50/60 border-amber-500 shadow-sm ring-1 ring-amber-400'
                        : 'bg-white hover:bg-stone-50 border-[#E8E2D9] hover:border-stone-300 shadow-sm'
                    }`}
                  >
                    <span
                      className="w-10 h-10 rounded-full border-4 border-white shadow-md shrink-0 mb-3"
                      style={{ backgroundColor: shade.hex }}
                    />
                    <span className="text-xs font-bold text-stone-900 mb-1 leading-tight">{shade.name}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500">
                      {shade.toneFamily}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PERSONALIZED CARE ROUTINE */}
        {activeTab === 'routine' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Steps & Strategy */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                  • Personalized Frizz Defense Routine
                </span>
                <p className="text-xs text-stone-700 leading-relaxed">{routine.frizzDefenseStrategy}</p>
                <p className="text-[11px] text-stone-500 mt-2 italic">{routine.curlClassificationNote}</p>
              </div>

              <div className="space-y-2.5">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-900 block mb-1">1. Cleansing:</span>
                  <p className="text-xs text-stone-600 leading-relaxed">{routine.washRoutine.step1}</p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-900 block mb-1">2. Conditioning:</span>
                  <p className="text-xs text-stone-600 leading-relaxed">{routine.washRoutine.step2}</p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-900 block mb-1">3. Moisture Sealing:</span>
                  <p className="text-xs text-stone-600 leading-relaxed">{routine.washRoutine.step3}</p>
                </div>
              </div>
            </div>

            {/* Prescribed Products */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-900 block mb-0.5">
                Prescribed Haircare Products
              </span>

              {routine.recommendedProducts.map((prod) => {
                const isAdded = addedItemIds[prod.id];
                return (
                  <div
                    key={prod.id}
                    className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 hover:bg-white hover:border-amber-300 transition-all"
                  >
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block truncate">
                        {prod.brand}
                      </span>
                      <h5 className="text-xs font-semibold text-stone-900 truncate">{prod.name}</h5>
                      <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{prod.reason}</p>
                      <span className="text-xs font-bold text-stone-900 mt-1 block">${prod.price}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(prod)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        '+ Add to Cart'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
