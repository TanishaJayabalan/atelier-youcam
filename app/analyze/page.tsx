'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ArrowRight, RefreshCw, Shirt, ShieldAlert,
  LayoutDashboard, Droplets, Palette, Scissors, Bell, Heart, User, LogOut, Key, X, Check, AlertCircle
} from 'lucide-react';
import { updateEnvSecrets } from '@/app/actions/env';
import SelfieCapture from '@/components/SelfieCapture';
import VibePicker, { VibeType } from '@/components/VibePicker';
import WeatherBar from '@/components/WeatherBar';
import ClosetShelf from '@/components/ClosetShelf';
import ExplanationCard from '@/components/ExplanationCard';
import SkincareRoutineCard from '@/components/SkincareRoutineCard';
import MakeupPreview from '@/components/MakeupPreview';
import OutfitPreview from '@/components/OutfitPreview';
import WardrobeInput from '@/components/WardrobeInput';
import HairstylePicker from '@/components/HairstylePicker';
import HairAnalysisPanel from '@/components/HairAnalysisPanel';
import GapFillShelf from '@/components/GapFillShelf';
import CelebrityLookPanel from '@/components/CelebrityLookPanel';
import ErrorBanner from '@/components/ErrorBanner';
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
      className="text-xs font-semibold text-[#694A33] bg-[#E8E2D9] hover:bg-[#D9CDB8] px-3 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm relative"
    >
      <ShoppingBag className="w-4 h-4" />
      <span className="hidden sm:inline">Wishlist</span>
      {itemCount > 0 && (
        <span className="bg-[#694A33] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-1">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function MirrorCheckContent() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('atelier_user');
    if (!user) {
      router.replace('/login');
    } else {
      setUserName(user.split('@')[0]);
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('atelier_user');
    document.cookie = 'atelier_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/login');
  };
  const [activeTab, setActiveTab] = useState('skin');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiClientId, setApiClientId] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false);
  const [envUpdateMessage, setEnvUpdateMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleUpdateEnv = async () => {
    if (!apiClientId || !apiSecret) {
      setEnvUpdateMessage({ type: 'error', text: 'Please fill out both API fields.' });
      return;
    }
    setIsUpdatingEnv(true);
    setEnvUpdateMessage(null);
    try {
      const res = await updateEnvSecrets(apiClientId, apiSecret);
      if (res.success) {
        setEnvUpdateMessage({ type: 'success', text: 'Environment secrets successfully updated!' });
        setApiClientId('');
        setApiSecret('');
        setTimeout(() => setIsApiModalOpen(false), 1500);
      } else {
        setEnvUpdateMessage({ type: 'error', text: res.error || 'Failed to update env.' });
      }
    } catch (err: any) {
      setEnvUpdateMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingEnv(false);
    }
  };

  // Input states
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [selectedBodyPhoto, setSelectedBodyPhoto] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<VibeType>('classy');
  const [customVibePrompt, setCustomVibePrompt] = useState<string>('');
  const [selectedHairstyle, setSelectedHairstyle] = useState<string>('modern_blunt_bob');
  const [weather, setWeather] = useState<WeatherResult | null>(null);

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

  const [analyzedTabs, setAnalyzedTabs] = useState<Record<string, boolean>>({});
  const hasResults = analyzedTabs[activeTab] || false;

  // Stage 1 & Stage 2 Execution
  const handleAnalyzeAndRender = async (inlineImage?: string | React.MouseEvent) => {
    const overrideImage = typeof inlineImage === 'string' ? inlineImage : undefined;
    const imageToAnalyze = overrideImage || (activeTab === 'wardrobe' ? (selectedBodyPhoto || selectedSelfie) : selectedSelfie);

    if (!imageToAnalyze) {
      alert(activeTab === 'wardrobe' ? 'Please upload a full body photo first.' : 'Please upload or snap a portrait selfie first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setMakeupError(null);
    setOutfitError(null);
    // don't reset active tab on new scan, so user stays in their tool

    try {
      // Stage 1: Real Multi-AI YouCam Analysis
      const res = await fetch('/api/youcam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieBase64: imageToAnalyze,
          vibe: selectedVibe,
          customPrompt: customVibePrompt,
          weather,
          mode: activeTab,
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

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Stage 2: Render specific VTO
      if (activeTab === 'wardrobe') {
        const outf = data.recommendation?.outfit;
        const garments = [];
        if (outf?.topOrDress) garments.push(outf.topOrDress);
        if (outf?.bottom) garments.push(outf.bottom);
        if (outf?.outerwear) garments.push(outf.outerwear);
        
        if (garments.length > 0) {
          await handleTryOnOutfit(imageToAnalyze, garments, data.sessionId);
        }
      } else {
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
      }

      setAnalyzedTabs(prev => ({ ...prev, [activeTab]: true }));
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
  const handleTryOnOutfit = async (bodyPhotoBase64: string, outfitItems: any, overrideSessionId?: string) => {
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
          sessionId: overrideSessionId || sessionId,
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

  const scrollToSection = (id: string) => {
    setActiveTab(id);
  };

  const handleScanNew = () => {
    setAnalyzedTabs({});
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#694A33] border-t-transparent animate-spin" />
          <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex text-[#2C2C2C] selection:bg-[#D9CDB8] selection:text-[#2C2C2C]">
      <CartDrawer />
      
      {/* Sidebar (Desktop) */}
      <aside className="w-64 fixed inset-y-0 left-0 bg-[#FAF9F6] border-r border-[#E8E2D9] hidden lg:flex flex-col z-40">
        <div className="p-8">
          <div className="text-2xl font-serif tracking-widest text-[#2C2C2C]">ATELIER</div>
        </div>
        
        <div className="px-8 pb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8E2D9] flex items-center justify-center overflow-hidden">
             <User className="w-5 h-5 text-stone-500" />
          </div>
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Welcome back,</p>
            <p className="text-sm font-medium capitalize truncate w-32">{userName || 'Guest'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => scrollToSection('skin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'skin' ? 'bg-[#F2EBE1] text-[#694A33]' : 'text-stone-500 hover:bg-[#F8F6F3] hover:text-[#2C2C2C]'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Skin Analysis
          </button>
          <button 
            onClick={() => scrollToSection('makeup')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'makeup' ? 'bg-[#F2EBE1] text-[#694A33]' : 'text-stone-500 hover:bg-[#F8F6F3] hover:text-[#2C2C2C]'}`}
          >
            <Palette className="w-4 h-4" /> Makeup VTO
          </button>
          <button 
            onClick={() => scrollToSection('wardrobe')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'wardrobe' ? 'bg-[#F2EBE1] text-[#694A33]' : 'text-stone-500 hover:bg-[#F8F6F3] hover:text-[#2C2C2C]'}`}
          >
            <Shirt className="w-4 h-4" /> Clothes VTO
          </button>
          <button 
            onClick={() => scrollToSection('hair')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'hair' ? 'bg-[#F2EBE1] text-[#694A33]' : 'text-stone-500 hover:bg-[#F8F6F3] hover:text-[#2C2C2C]'}`}
          >
            <Scissors className="w-4 h-4" /> Hair Studio
          </button>
        </nav>

        <div className="p-4 border-t border-[#E8E2D9] space-y-2">
          <button 
            onClick={() => setIsApiModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-[#2C2C2C] transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4" /> API Settings
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 relative min-h-screen pb-20 w-full overflow-x-hidden">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#F8F6F3]/80 backdrop-blur-md border-b border-[#E8E2D9]">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-serif text-[#2C2C2C]">
                {hasResults ? `Good morning, ${userName ? userName.split(' ')[0] : 'Guest'} ✨` : 'Start your analysis'}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                {hasResults ? 'Let\'s discover your next best look.' : 'Upload a selfie to get your personalized routine.'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <HeaderCartButton />
              {hasResults && (
                <button
                  onClick={handleScanNew}
                  className="bg-[#D9CDB8] hover:bg-[#C9BCA5] text-[#4A3B2C] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap"
                >
                  Scan New Look
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">


           {/* Input Section - Skin Tab */}
           {!hasResults && activeTab === 'skin' && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <WeatherBar weather={weather} onWeatherLoaded={(w: WeatherResult) => setWeather(w)} />
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">
                    <SelfieCapture
                      captureMode="skin"
                      selectedSelfie={selectedSelfie}
                      onSelfieSelected={(base64) => setSelectedSelfie(base64)}
                    />
                  </div>
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm p-6 flex flex-col justify-between h-full min-h-[300px]">
                      <div>
                        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#694A33]" />
                          Skin & Biomarker Analysis
                        </h3>
                        <p className="text-xs text-stone-500 leading-relaxed mt-2">
                          Runs YouCam AI engines for Skin Health, Fitzpatrick Scale, and Care Routine formulation.
                        </p>
                      </div>

                      {errorMessage && (
                        <div className="mt-4">
                          <ErrorBanner
                            error={errorMessage}
                            onOpenApiSettings={() => setIsApiModalOpen(true)}
                            onSelectNewPhoto={() => setSelectedSelfie(null)}
                            onRetry={() => handleAnalyzeAndRender()}
                          />
                        </div>
                      )}

                      <div className="mt-auto pt-6">
                        <button
                          type="button"
                          onClick={handleAnalyzeAndRender}
                          disabled={isAnalyzing || isRendering || !selectedSelfie}
                          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                            isAnalyzing || isRendering
                              ? 'bg-[#694A33]/80 text-white cursor-not-allowed'
                              : !selectedSelfie
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : 'bg-[#694A33] hover:bg-[#523926] text-white active:scale-[0.99] shadow-[#694A33]/20'
                          }`}
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Analyzing Facial Canvas...</span>
                            </>
                          ) : (
                            <>
                              <span>Analyse Skin</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
               </div>
             </div>
           )}

           {/* Input Section - Makeup Tab */}
           {!hasResults && activeTab === 'makeup' && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <WeatherBar weather={weather} onWeatherLoaded={(w: WeatherResult) => setWeather(w)} />
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">
                    <SelfieCapture
                      captureMode="makeup"
                      selectedSelfie={selectedSelfie}
                      onSelfieSelected={(base64) => setSelectedSelfie(base64)}
                    />
                  </div>
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <VibePicker
                      selectedVibe={selectedVibe}
                      onSelectVibe={(vibe: VibeType) => setSelectedVibe(vibe)}
                      customPrompt={customVibePrompt}
                      onCustomPromptChange={(prompt) => setCustomVibePrompt(prompt)}
                    />
                    <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#694A33]" />
                          Harmonized Makeup VTO
                        </h3>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Runs parallel YouCam AI engines to map facial color tones and geometry for perfect shade matching.
                        </p>
                      </div>

                      {errorMessage && (
                        <div className="mt-4">
                          <ErrorBanner
                            error={errorMessage}
                            onOpenApiSettings={() => setIsApiModalOpen(true)}
                            onSelectNewPhoto={() => setSelectedSelfie(null)}
                            onRetry={() => handleAnalyzeAndRender()}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAnalyzeAndRender}
                        disabled={isAnalyzing || isRendering || !selectedSelfie}
                        className={`mt-5 w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                          isAnalyzing || isRendering
                            ? 'bg-[#694A33]/80 text-white cursor-not-allowed'
                            : !selectedSelfie
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-[#694A33] hover:bg-[#523926] text-white active:scale-[0.99] shadow-[#694A33]/20'
                        }`}
                      >
                        {isRendering ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Applying Virtual Makeup...</span>
                          </>
                        ) : (
                          <>
                            <span className="capitalize">Analyse Makeup</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
               </div>
             </div>
           )}

           {/* Input Section - Wardrobe Tab */}
           {!hasResults && activeTab === 'wardrobe' && (
             <WardrobeInput
               selectedSelfie={selectedBodyPhoto}
               onSelfieSelected={(base64) => setSelectedBodyPhoto(base64)}
               onAnalyze={handleAnalyzeAndRender}
               isAnalyzing={isAnalyzing}
               isRendering={isRenderingOutfit || isRendering}
             />
           )}

           {/* Input Section - Hair Tab */}
           {!hasResults && activeTab === 'hair' && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-7">
                    <SelfieCapture
                      captureMode="hair"
                      selectedSelfie={selectedSelfie}
                      onSelfieSelected={(base64) => setSelectedSelfie(base64)}
                    />
                  </div>
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm p-6 h-full flex flex-col justify-center">
                      <div className="text-center mb-6">
                         <Sparkles className="w-8 h-8 text-[#694A33] mx-auto mb-3 opacity-60" />
                         <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1">Hair Analysis</h3>
                         <p className="text-xs text-stone-500 leading-relaxed max-w-[200px] mx-auto">
                           Upload a selfie to unlock the virtual hair studio and analyze your hair type.
                         </p>
                      </div>

                      {errorMessage && (
                        <div className="mb-4">
                          <ErrorBanner
                            error={errorMessage}
                            onOpenApiSettings={() => setIsApiModalOpen(true)}
                            onSelectNewPhoto={() => setSelectedSelfie(null)}
                            onRetry={() => handleAnalyzeAndRender()}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAnalyzeAndRender}
                        disabled={isAnalyzing || isRendering || !selectedSelfie}
                        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                          isAnalyzing || isRendering
                            ? 'bg-[#694A33]/80 text-white cursor-not-allowed'
                            : !selectedSelfie
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-[#694A33] hover:bg-[#523926] text-white active:scale-[0.99] shadow-[#694A33]/20'
                        }`}
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing Hair...</span>
                          </>
                        ) : (
                          <>
                            <span>Analyze Hair</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
               </div>
             </div>
           )}

           {/* Tab Content Area */}
           {hasResults && skinAnalysis && skinTone && recommendation && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               {activeTab === 'skin' && (
                 <div className="space-y-8">
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
                      customLookTitle={recommendation.customLookTitle}
                      customLookSummary={recommendation.customLookSummary}
                    />
                    
                    <SkincareRoutineCard
                      warnings={recommendation.skincareNotes.warnings}
                      amSteps={recommendation.skincareNotes.amSteps}
                      pmSteps={recommendation.skincareNotes.pmSteps}
                    />
                    
                    {recommendation.gapFillSuggestions && recommendation.gapFillSuggestions.some(s => s.category.toLowerCase().includes('skin')) && (
                      <GapFillShelf suggestions={recommendation.gapFillSuggestions.filter(s => s.category.toLowerCase().includes('skin'))} />
                    )}
                    
                    <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-serif text-[#2C2C2C] mb-2">Ready to see it on?</h3>
                        <p className="text-sm text-stone-500">Try on your personalized makeup recommendations based on this analysis.</p>
                      </div>
                      <button
                        onClick={() => scrollToSection('makeup')}
                        className="whitespace-nowrap px-8 py-3 bg-[#694A33] hover:bg-[#523926] text-white rounded-xl text-sm font-semibold transition-colors shadow-[#694A33]/20 shadow-lg cursor-pointer"
                      >
                        Try Makeup VTO &rarr;
                      </button>
                    </div>
                 </div>
               )}

               {activeTab === 'makeup' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                   <div className="lg:col-span-7">
                     <MakeupPreview
                       makeupSteps={recommendation.makeupSteps}
                       renderedImageUrl={makeupResultUrl}
                       makeupError={makeupError}
                       isRendering={isRendering}
                       originalSelfieUrl={selectedSelfie}
                       beautyProfile={beautyProfile || undefined}
                       onRetry={handleRetryMakeup}
                     />
                   </div>
                   <div className="lg:col-span-5 flex flex-col gap-6">
                     <VibePicker
                       selectedVibe={selectedVibe}
                       onSelectVibe={(vibe: VibeType) => setSelectedVibe(vibe)}
                       customPrompt={customVibePrompt}
                       onCustomPromptChange={(prompt) => setCustomVibePrompt(prompt)}
                     />
                     <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm p-6 flex flex-col justify-between">
                       <div>
                         <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
                           <Sparkles className="w-4 h-4 text-[#694A33]" />
                           Update VTO Look
                         </h3>
                         <p className="text-xs text-stone-500 leading-relaxed">
                           Tweak the AI prompt or change the vibe to regenerate a new makeup look based on the same facial analysis.
                         </p>
                       </div>

                       {errorMessage && (
                         <div className="mt-4">
                           <ErrorBanner
                             error={errorMessage}
                             onOpenApiSettings={() => setIsApiModalOpen(true)}
                             onSelectNewPhoto={() => setSelectedSelfie(null)}
                             onRetry={() => handleAnalyzeAndRender()}
                           />
                         </div>
                       )}

                       <button
                         type="button"
                         onClick={handleAnalyzeAndRender}
                         disabled={isAnalyzing || isRendering || !selectedSelfie}
                         className={`mt-5 w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                           isAnalyzing || isRendering
                             ? 'bg-[#694A33]/80 text-white cursor-not-allowed'
                             : !selectedSelfie
                             ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                             : 'bg-[#694A33] hover:bg-[#523926] text-white active:scale-[0.99] shadow-[#694A33]/20'
                         }`}
                       >
                         {isRendering ? (
                           <>
                             <RefreshCw className="w-4 h-4 animate-spin" />
                             <span>Regenerating...</span>
                           </>
                         ) : (
                           <>
                             <span className="capitalize">Update Makeup</span>
                             <ArrowRight className="w-4 h-4" />
                           </>
                         )}
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {activeTab === 'wardrobe' && (
                 <div className="space-y-8">
                    <OutfitPreview
                      outfit={recommendation.outfit}
                      renderedImageUrl={outfitResultUrl}
                      outfitError={outfitError}
                      isRendering={isRenderingOutfit}
                      initialBodyPhoto={selectedBodyPhoto}
                      onTryOnOutfit={handleTryOnOutfit}
                    />
                    <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden p-6">
                      <h3 className="text-xl font-serif text-[#2C2C2C] mb-6">Wardrobe Vault</h3>
                      <ClosetShelf
                        beautyProfile={beautyProfile || undefined}
                        onApplyGeneratedLook={(effects) => {
                          if (effects && effects.length > 0) {
                            console.log('Applied generated look effects:', effects);
                          }
                        }}
                      />
                    </div>
                    {recommendation.gapFillSuggestions && recommendation.gapFillSuggestions.some(s => !s.category.toLowerCase().includes('skin')) && (
                      <GapFillShelf suggestions={recommendation.gapFillSuggestions.filter(s => !s.category.toLowerCase().includes('skin'))} />
                    )}
                 </div>
               )}

               {activeTab === 'hair' && (
                 <div className="space-y-8">
                    <HairAnalysisPanel
                      userImageUrl={selectedSelfie || undefined}
                      beautyProfile={beautyProfile || undefined}
                      weather={weather || undefined}
                    />
                 </div>
               )}

             </div>
           )}
            {/* API Settings Modal */}
            {isApiModalOpen && (
              <div className="fixed inset-0 bg-[#2C2C2C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between p-6 border-b border-stone-100">
                    <h3 className="text-xl font-serif text-[#2C2C2C] flex items-center gap-2">
                      <Key className="w-5 h-5 text-[#694A33]" />
                      API Settings
                    </h3>
                    <button 
                      onClick={() => setIsApiModalOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                    <p className="text-sm text-stone-500">
                      Update your YouCam Client ID and Secret below. This will directly update your environment variables for local development.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                          Client ID (API Key)
                        </label>
                        <input
                          type="text"
                          value={apiClientId}
                          onChange={(e) => setApiClientId(e.target.value)}
                          className="block w-full px-4 py-3 border border-stone-300 rounded-xl bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                          placeholder="Enter new Client ID"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="block w-full px-4 py-3 border border-stone-300 rounded-xl bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                          placeholder="Enter new Client Secret"
                        />
                      </div>

                      {envUpdateMessage && (
                        <div className={`flex items-start gap-2 p-3 rounded-xl text-xs mt-2 ${
                          envUpdateMessage.type === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {envUpdateMessage.type === 'success' ? (
                            <Check className="w-4 h-4 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          )}
                          <span>{envUpdateMessage.text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-stone-50 border-t border-stone-100 flex gap-3">
                    <button
                      onClick={() => setIsApiModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-medium text-sm text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateEnv}
                      disabled={isUpdatingEnv || !apiClientId || !apiSecret}
                      className="flex-1 py-3 rounded-xl font-medium text-sm text-white bg-[#694A33] hover:bg-[#523926] transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isUpdatingEnv ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default function MirrorCheckHome() {
  return (
    <CartProvider>
      <MirrorCheckContent />
    </CartProvider>
  );
}
