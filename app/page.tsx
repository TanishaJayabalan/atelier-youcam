'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Shirt, ShieldAlert } from 'lucide-react';
import SelfieCapture from '@/components/SelfieCapture';
import VibePicker, { VibeType } from '@/components/VibePicker';
import WeatherBar from '@/components/WeatherBar';
import ClosetShelf from '@/components/ClosetShelf';
import ExplanationCard from '@/components/ExplanationCard';
import SkincareRoutineCard from '@/components/SkincareRoutineCard';
import MakeupPreview from '@/components/MakeupPreview';
import OutfitPreview from '@/components/OutfitPreview';
import GapFillShelf from '@/components/GapFillShelf';
import CelebrityLookPanel from '@/components/CelebrityLookPanel';
import HairAnalysisPanel from '@/components/HairAnalysisPanel';
import { WeatherResult } from '@/lib/weather';
import { Recommendation } from '@/lib/recommendation-engine';
import { SkinAnalysisResult } from '@/lib/youcam/skin-analysis';
import { SkinToneResult } from '@/lib/youcam/skin-tone';
import { UserBeautyProfile } from '@/types/beauty-profile';

import { ShoppingBag } from 'lucide-react';
import { CartProvider, useCart } from '@/components/CartContext';
import CartDrawer from '@/components/CartDrawer';

function HeaderCartButton() {
  const { itemCount, setIsCartOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setIsCartOpen(true)}
      className="text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs relative"
    >
      <ShoppingBag className="w-3.5 h-3.5" />
      <span>Wishlist Cart</span>
      {itemCount > 0 && (
        <span className="bg-stone-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function MirrorCheckContent() {
  // Input states
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<VibeType>('classy');
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [showCloset, setShowCloset] = useState(false);

  // Execution states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isRenderingOutfit, setIsRenderingOutfit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [skinTone, setSkinTone] = useState<SkinToneResult | null>(null);
  const [beautyProfile, setBeautyProfile] = useState<UserBeautyProfile | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [engineSource, setEngineSource] = useState<string | null>(null);
  const [engineNotice, setEngineNotice] = useState<string | null>(null);
  const [makeupResultUrl, setMakeupResultUrl] = useState<string | null>(null);
  const [makeupError, setMakeupError] = useState<string | null>(null);
  const [outfitResultUrl, setOutfitResultUrl] = useState<string | null>(null);
  const [outfitError, setOutfitError] = useState<string | null>(null);

  const hasResults = Boolean(recommendation && skinAnalysis && skinTone);

  // Stage 1 & Stage 2 Execution
  const handleAnalyzeAndRender = async () => {
    if (!selectedSelfie) {
      alert('Please upload or snap a portrait selfie first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setRecommendation(null);
    setEngineNotice(null);
    setEngineSource(null);
    setMakeupResultUrl(null);
    setMakeupError(null);
    setOutfitResultUrl(null);
    setOutfitError(null);

    try {
      // Stage 1: Real Multi-AI YouCam Analysis
      const res = await fetch('/api/youcam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieBase64: selectedSelfie,
          vibe: selectedVibe,
          weather,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze selfie.');
      }

      setSessionId(data.sessionId);
      setSkinAnalysis(data.skinAnalysis);
      setSkinTone(data.skinTone);
      setBeautyProfile(data.beautyProfile);
      setRecommendation(data.recommendation);
      setEngineSource(data.engineSource || null);
      setEngineNotice(data.engineNotice || null);
      setIsAnalyzing(false);

      // Smooth scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('mirror-results-section');
        resultsEl?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Stage 2: Render Makeup VTO on facial selfie
      setIsRendering(true);
      const renderRes = await fetch('/api/youcam/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          selfieBase64: selectedSelfie,
          makeupSteps: data.recommendation.makeupSteps,
          outfitItem: null,
        }),
      });

      const renderData = await renderRes.json();
      if (renderData.success) {
        setMakeupResultUrl(renderData.makeupResultUrl || null);
        setMakeupError(renderData.makeupError || null);
      } else {
        setMakeupError(renderData.error || 'Failed to render makeup try-on.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
      setIsRendering(false);
    }
  };

  const handleRetryMakeup = async () => {
    if (!selectedSelfie || !recommendation) return;
    setIsRendering(true);
    setMakeupError(null);
    try {
      const res = await fetch('/api/youcam/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selfieBase64: selectedSelfie,
          makeupSteps: recommendation.makeupSteps,
          outfitItem: null,
        }),
      });
      const data = await res.json();
      if (data.makeupResultUrl) {
        setMakeupResultUrl(data.makeupResultUrl);
      } else if (data.makeupError) {
        setMakeupError(data.makeupError);
      }
    } catch (err: any) {
      setMakeupError(err.message || 'Retry failed');
    } finally {
      setIsRendering(false);
    }
  };

  // Dedicated Clothes Try-On Handler with user-uploaded body photo
  const handleTryOnOutfit = async (bodyPhotoBase64: string, outfitItems: any) => {
    if (!bodyPhotoBase64 || !outfitItems) return;
    const itemsArray = Array.isArray(outfitItems) ? outfitItems : [outfitItems];
    if (itemsArray.length === 0) return;

    setIsRenderingOutfit(true);
    setOutfitError(null);
    try {
      const res = await fetch('/api/youcam/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selfieBase64: bodyPhotoBase64,
          makeupSteps: [],
          outfitItems: itemsArray,
        }),
      });
      const data = await res.json();
      if (data.success && data.outfitResultUrl) {
        setOutfitResultUrl(data.outfitResultUrl);
        setOutfitError(null);
      } else if (data.outfitError) {
        setOutfitError(data.outfitError);
      } else {
        setOutfitError(data.error || 'Failed to render clothes try-on.');
      }
    } catch (err: any) {
      setOutfitError(err.message || 'Failed to render clothes try-on on body photo.');
    } finally {
      setIsRenderingOutfit(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-20 text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      <CartDrawer />
      {/* Top Navigation & Status */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              M
            </div>
            <div>
              <span className="font-semibold tracking-tight text-stone-950 text-base">
                MIRROR CHECK
              </span>
              <span className="text-[10px] text-amber-800 font-mono ml-2 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                YouCam AI Atelier
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCloset(!showCloset)}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shirt className="w-3.5 h-3.5 text-amber-700" />
              {showCloset ? 'Hide Wardrobe Vault' : 'View Wardrobe Vault'}
            </button>
            <HeaderCartButton />
          </div>
        </div>
      </header>

      {/* Atmospheric Real-Time Context Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <WeatherBar weather={weather} onWeatherLoaded={(w: WeatherResult) => setWeather(w)} />
      </div>

      {/* Wardrobe Modal / Shelf */}
      {showCloset && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <ClosetShelf
            beautyProfile={beautyProfile || undefined}
            onApplyGeneratedLook={(effects) => {
              if (effects && effects.length > 0) {
                console.log('Applied generated look effects:', effects);
              }
            }}
          />
        </div>
      )}

      {/* Input Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Selfie / Portrait Selector */}
          <div className="lg:col-span-7">
            <SelfieCapture
              selectedSelfie={selectedSelfie}
              onSelfieSelected={(base64) => {
                setSelectedSelfie(base64);
              }}
            />
          </div>

          {/* Right: Vibe Selector & Trigger */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <VibePicker
              selectedVibe={selectedVibe}
              onSelectVibe={(vibe: VibeType) => setSelectedVibe(vibe)}
            />

            {/* Main Action Trigger Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  Orchestrate Harmonized Look
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Runs 4 parallel YouCam AI engines (Skin Analysis + Fitzpatrick Scale + Facial Color Tones + Facial Geometry) with local atmospheric defense.
                </p>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleAnalyzeAndRender}
                disabled={isAnalyzing || isRendering || !selectedSelfie}
                className={`mt-5 w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isAnalyzing || isRendering
                    ? 'bg-amber-700/80 text-white cursor-not-allowed'
                    : !selectedSelfie
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-amber-700 hover:bg-amber-800 text-white active:scale-[0.99] shadow-amber-900/10'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Facial Canvas &amp; Clinical Concerns...</span>
                  </>
                ) : isRendering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fitting Wardrobe &amp; Virtual Makeup...</span>
                  </>
                ) : (
                  <>
                    <span>Generate My Personalized Daily Look</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Workspace Section */}
      {hasResults && skinAnalysis && skinTone && recommendation && (
        <div id="mirror-results-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
          {/* 1. Header Summary Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                  Daily Mirror Check Summary
                </span>
                <span className="text-xs text-stone-500 capitalize">
                  {selectedVibe} Vibe Profile
                </span>
                {beautyProfile?.fitzpatrick && (
                  <span className="text-xs font-mono font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                    {beautyProfile.fitzpatrick.label}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mt-1.5 tracking-tight">
                Harmonized Look &amp; Skin Strategy
              </h2>
            </div>

            {/* Vitality Badge */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-xs self-start md:self-auto">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Overall Vitality
                </span>
                <span className="text-xl font-bold text-stone-900 leading-none">
                  {skinAnalysis.overallScore}
                  <span className="text-xs font-normal text-stone-400">/100</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-xs capitalize">
                {skinAnalysis.skinType.slice(0, 4)}
              </div>
            </div>
          </div>

          {/* 2. Three Pillars Explanation Card */}
          <ExplanationCard
            skin={skinAnalysis}
            skinTone={skinTone}
            weather={weather || undefined}
            vibe={selectedVibe}
            explanation={recommendation.explanation}
            beautyProfile={beautyProfile || undefined}
            userImageUrl={selectedSelfie || undefined}
            engineSource={engineSource || undefined}
            engineNotice={engineNotice || undefined}
          />

          {/* 3. Personalized Skincare Routine (With Conflict Protection) */}
          <SkincareRoutineCard
            warnings={recommendation.skincareNotes.warnings}
            amSteps={recommendation.skincareNotes.amSteps}
            pmSteps={recommendation.skincareNotes.pmSteps}
          />

          {/* 4. Two-Column Virtual Try-On Stage (Makeup VTO + Wardrobe Styling) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MakeupPreview
              makeupSteps={recommendation.makeupSteps}
              renderedImageUrl={makeupResultUrl}
              makeupError={makeupError}
              isRendering={isRendering}
              originalSelfieUrl={selectedSelfie}
              beautyProfile={beautyProfile || undefined}
              onRetry={handleRetryMakeup}
            />

            <OutfitPreview
              outfit={recommendation.outfit}
              renderedImageUrl={outfitResultUrl}
              outfitError={outfitError}
              isRendering={isRenderingOutfit}
              onTryOnOutfit={handleTryOnOutfit}
            />
          </div>

          {/* 5. Feature 1.4: Celebrity Look Archetypes & AI Makeup Transfer */}
          <CelebrityLookPanel
            userImageUrl={selectedSelfie || undefined}
            beautyProfile={beautyProfile || undefined}
            selectedVibe={selectedVibe}
          />

          {/* 6. Feature 1.6: AI Trichology Diagnostics, Haircut & Color VTO */}
          <HairAnalysisPanel
            userImageUrl={selectedSelfie || undefined}
            beautyProfile={beautyProfile || undefined}
          />

          {/* 7. Wardrobe Gap-Fill & Smart Cross-Sell Shelf */}
          {recommendation.gapFillSuggestions && recommendation.gapFillSuggestions.length > 0 && (
            <GapFillShelf suggestions={recommendation.gapFillSuggestions} />
          )}
        </div>
      )}
    </main>
  );
}

export default function MirrorCheckHome() {
  return (
    <CartProvider>
      <MirrorCheckContent />
    </CartProvider>
  );
}
