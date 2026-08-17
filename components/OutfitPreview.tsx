'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Shirt,
  CheckCircle2,
  Sparkle,
  SplitSquareVertical,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Upload,
  Camera,
  User,
  Image as ImageIcon,
  Aperture,
  VideoOff,
} from 'lucide-react';
import { OutfitRecommendation } from '@/lib/recommendation-engine';
import ErrorBanner from './ErrorBanner';

interface OutfitPreviewProps {
  outfit: OutfitRecommendation;
  renderedImageUrl: string | null;
  outfitError?: string | null;
  isRendering: boolean;
  initialBodyPhoto?: string | null;
  customGarment?: any | null;
  onClearCustomGarment?: () => void;
  onTryOnOutfit?: (bodyPhotoBase64: string, outfitItems: any[]) => Promise<void>;
  onRetry?: () => void;
}

const SAMPLE_BODY_PHOTOS = [
  {
    id: 'body_sample_1',
    label: 'Studio Full Body (Casual Standing)',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&h=900&q=80',
  },
  {
    id: 'body_sample_2',
    label: 'Minimalist Studio (Neutral Torso)',
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&h=900&q=80',
  },
  {
    id: 'body_sample_3',
    label: 'Daylight Street (Full Length)',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&h=900&q=80',
  },
];

export default function OutfitPreview({
  outfit,
  renderedImageUrl,
  outfitError,
  isRendering,
  initialBodyPhoto,
  customGarment,
  onClearCustomGarment,
  onTryOnOutfit,
  onRetry,
}: OutfitPreviewProps) {
  const { topOrDress, bottom, outerwear, stylingRationale } = outfit;

  const [bodyPhoto, setBodyPhoto] = useState<string | null>(initialBodyPhoto || null);
  const [sourceType, setSourceType] = useState<'upload' | 'camera' | 'samples'>('upload');
  const [selectedPieceMode, setSelectedPieceMode] = useState<'all' | 'top' | 'bottom' | 'outerwear'>('all');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'fit' | 'paired'>('fit');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  const getGarmentsToTryOn = () => {
    if (customGarment) {
      return [customGarment];
    }
    if (selectedPieceMode === 'top' && topOrDress) return [topOrDress];
    if (selectedPieceMode === 'bottom' && bottom) return [bottom];
    if (selectedPieceMode === 'outerwear' && outerwear) return [outerwear];

    // Default: 'all' -> Full Ensemble in sequential pipeline (Top -> Bottom -> Outerwear)
    const list: any[] = [];
    if (topOrDress) list.push(topOrDress);
    if (bottom) list.push(bottom);
    if (outerwear) list.push(outerwear);
    return list;
  };

  // Convert image URL to base64
  const loadUrlAsBase64 = useCallback(async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setBodyPhoto(canvas.toDataURL('image/jpeg', 0.95));
          } else {
            setBodyPhoto(rawBase64);
          }
        };
        img.src = rawBase64;
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to load sample body image:', e);
    }
  }, []);

  // Start live webcam stream for body photo
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== 'AbortError') {
            console.warn('Video play error:', playErr);
          }
        }
      }
      setCameraActive(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Camera permission error:', err);
        setCameraError('Camera access unavailable. Please upload a file or choose a sample.');
      }
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    setBodyPhoto(base64);
    stopCamera();
  }, [stopCamera]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG or PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBodyPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBodyPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerTryOn = async () => {
    if (!bodyPhoto) return;
    const garments = getGarmentsToTryOn();
    if (garments.length === 0) return;
    if (onTryOnOutfit) {
      await onTryOnOutfit(bodyPhoto, garments);
    }
  };

  const garmentImage = renderedImageUrl || topOrDress?.image_url;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-amber-700" />
              Wardrobe Virtual Try-On &amp; Styling
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Generative apparel try-on fitted to your full-body silhouette via YouCam AI.
            </p>
          </div>

          {renderedImageUrl && bodyPhoto && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'fit' ? 'paired' : 'fit')}
              className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              {viewMode === 'fit' ? 'Paired Fit' : 'Garment Focus'}
            </button>
          )}
        </div>

        {/* Custom Selected Closet Item Indicator */}
        {customGarment && (
          <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-amber-200 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={customGarment.imageUrl || customGarment.image_url}
                  alt={customGarment.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  Selected From Your Closet
                </span>
                <p className="text-xs font-semibold text-stone-900">
                  {customGarment.name}
                </p>
              </div>
            </div>
            {onClearCustomGarment && (
              <button
                type="button"
                onClick={onClearCustomGarment}
                className="text-[11px] font-semibold text-[#694A33] hover:text-[#523926] underline cursor-pointer"
              >
                Reset to AI Look
              </button>
            )}
          </div>
        )}

        {/* Dedicated Full-Body Photo Input Area when not rendered or when changing */}
        {!renderedImageUrl && !isRendering && (
          <div className="mb-5 bg-stone-50 rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Full-Body / Outfit Canvas
                </h4>
              </div>

              {/* Source Switcher */}
              <div className="flex bg-stone-200/80 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setSourceType('upload');
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sourceType === 'upload' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceType('camera');
                    startCamera();
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sourceType === 'camera' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setSourceType('samples');
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sourceType === 'samples' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Samples
                </button>
              </div>
            </div>

            {/* TAB 1: FILE UPLOAD DROPZONE */}
            {sourceType === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-600 bg-amber-50/50'
                      : bodyPhoto
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-stone-300 hover:border-amber-500 bg-white'
                  }`}
                >
                  {bodyPhoto ? (
                    <div className="flex items-center justify-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bodyPhoto} alt="Selected Body" className="w-14 h-18 object-cover rounded-lg border border-stone-200 shadow-xs" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Full-Body Photo Ready
                        </span>
                        <p className="text-[11px] text-stone-500 mt-0.5">Click to choose a different photo</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center mx-auto mb-1">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-stone-800">
                        Upload a full body photo to try on this outfit
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Drag &amp; drop or click to browse (standing full-body or half-body portrait)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE WEBCAM */}
            {sourceType === 'camera' && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex flex-col items-center justify-center">
                {cameraError ? (
                  <div className="p-4 text-center text-stone-300 max-w-xs">
                    <VideoOff className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs">{cameraError}</p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCapture}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Aperture className="w-4 h-4" />
                        Snap Body Photo
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: SAMPLE FULL-BODY PRESETS */}
            {sourceType === 'samples' && (
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_BODY_PHOTOS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => loadUrlAsBase64(sample.url)}
                    className={`group relative rounded-lg overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                      bodyPhoto === sample.url ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="aspect-[3/4] rounded overflow-hidden bg-stone-100 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sample.url} alt={sample.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-[10px] font-medium text-stone-800 line-clamp-1 block">{sample.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Ensemble Piece Selector Chips (When multi-piece outfit exists) */}
            {bodyPhoto && (bottom || outerwear) && (
              <div className="mt-3.5 pt-3 border-t border-stone-200">
                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                  Try-On Selection:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPieceMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedPieceMode === 'all'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    ✨ Full Ensemble ({topOrDress ? 'Top' : ''}{bottom ? ' + Pants' : ''})
                  </button>
                  {topOrDress && (
                    <button
                      type="button"
                      onClick={() => setSelectedPieceMode('top')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedPieceMode === 'top'
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      Top Only
                    </button>
                  )}
                  {bottom && (
                    <button
                      type="button"
                      onClick={() => setSelectedPieceMode('bottom')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedPieceMode === 'bottom'
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      Pants Only
                    </button>
                  )}
                  {outerwear && (
                    <button
                      type="button"
                      onClick={() => setSelectedPieceMode('outerwear')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedPieceMode === 'outerwear'
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      Outerwear Only
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Trigger Button */}
            {bodyPhoto && (
              <button
                type="button"
                onClick={handleTriggerTryOn}
                disabled={isRendering}
                className="mt-3 w-full py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                {selectedPieceMode === 'all'
                  ? '✨ Try On Full Ensemble on My Body'
                  : selectedPieceMode === 'top'
                  ? '✨ Try On Top on My Body'
                  : selectedPieceMode === 'bottom'
                  ? '✨ Try On Pants on My Body'
                  : '✨ Try On Outerwear on My Body'}
              </button>
            )}
          </div>
        )}

        {/* Main Canvas Viewport */}
        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#FAF9F6] border border-[#E8E2D9] mb-5 flex items-center justify-center group p-4">
          {outfitError ? (
            <div className="w-full max-w-sm">
              <ErrorBanner
                error={outfitError}
                onRetry={onRetry}
              />
            </div>
          ) : isRendering ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative">
              <div className="w-10 h-10 rounded-full border-3 border-[#694A33] border-t-transparent animate-spin mb-3" />
              <span className="text-xs font-semibold text-[#2C2C2C]">
                Fitting Selected Apparel onto Body via YouCam AI...
              </span>
              <span className="text-[11px] text-stone-500 mt-1">
                Synthesizing silhouette &amp; draping from your digital wardrobe
              </span>
            </div>
          ) : garmentImage ? (
            viewMode === 'paired' && bodyPhoto ? (
              /* Paired Dual Canvas View */
              <div className="w-full h-full grid grid-cols-2 gap-1.5 bg-[#FAF9F6] p-1.5">
                <div className="relative h-full rounded-xl overflow-hidden bg-white border border-[#E8E2D9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bodyPhoto}
                    alt="Your Body Canvas"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-xs text-[9px] font-semibold text-[#2C2C2C] px-2 py-0.5 rounded border border-[#E8E2D9]">
                    Your Canvas
                  </div>
                </div>
                <div className="relative h-full rounded-xl overflow-hidden bg-white border border-[#E8E2D9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={garmentImage}
                    alt="Selected Garment"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-xs text-[9px] font-semibold text-[#2C2C2C] px-2 py-0.5 rounded border border-[#E8E2D9]">
                    {renderedImageUrl ? 'YouCam Clothes VTO' : 'Selected Piece'}
                  </div>
                </div>
              </div>
            ) : (
              /* Clean Single Garment / Fitted Body View */
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={garmentImage}
                  alt="Selected Outfit Try-On"
                  className="w-full h-full object-contain"
                />

                {/* Status Badge */}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-[#2C2C2C] text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-[#E8E2D9]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4A5D23]" />
                  {renderedImageUrl ? 'YouCam Clothes VTO Rendered' : 'Wardrobe Piece Matched'}
                </div>

                {/* Change Body Photo Trigger if rendered */}
                {renderedImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setBodyPhoto(null);
                    }}
                    className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-[#2C2C2C] text-[10px] font-medium px-2.5 py-1 rounded-lg border border-[#E8E2D9] shadow-sm transition-all"
                  >
                    Change Body Photo
                  </button>
                )}

                {/* Garment Tag */}
                {topOrDress && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[#2C2C2C] text-[10px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-[#E8E2D9]">
                    <Sparkle className="w-3 h-3 text-[#C28250]" />
                    <span>{topOrDress.brand}: {topOrDress.name}</span>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="p-6 text-center text-stone-500 text-xs">
              Waiting for analysis...
            </div>
          )}
        </div>

        {/* Selected Garment Pieces */}
        <div className="space-y-2.5 mb-4">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
            Selected Closet Ensemble:
          </span>

          {topOrDress && (
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topOrDress.image_url}
                  alt={topOrDress.name}
                  className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                />
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    {topOrDress.category.replace('outfit_', '')}
                  </span>
                  <div className="font-semibold text-stone-900">{topOrDress.name}</div>
                  <div className="text-[10px] text-stone-500">{topOrDress.brand}</div>
                </div>
              </div>
              <span className="text-[10px] font-medium bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                {(topOrDress.metadata as any)?.fabric || 'Owned'}
              </span>
            </div>
          )}

          {bottom && (
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bottom.image_url}
                  alt={bottom.name}
                  className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                />
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Bottom
                  </span>
                  <div className="font-semibold text-stone-900">{bottom.name}</div>
                  <div className="text-[10px] text-stone-500">{bottom.brand}</div>
                </div>
              </div>
              <span className="text-[10px] font-medium bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                {(bottom.metadata as any)?.fabric || 'Owned'}
              </span>
            </div>
          )}

          {outerwear && (
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outerwear.image_url}
                  alt={outerwear.name}
                  className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                />
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Outerwear Layer
                  </span>
                  <div className="font-semibold text-stone-900">{outerwear.name}</div>
                  <div className="text-[10px] text-stone-500">{outerwear.brand}</div>
                </div>
              </div>
              <span className="text-[10px] font-medium bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                Weather Layer
              </span>
            </div>
          )}
        </div>

        {/* Styling Rationale Box */}
        {stylingRationale && (
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-xs text-stone-700 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{stylingRationale}</p>
          </div>
        )}
      </div>
    </div>
  );
}

