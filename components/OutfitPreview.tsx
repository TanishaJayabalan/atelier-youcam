'use client';

import React, { useState } from 'react';
import { Shirt, CheckCircle2, Sparkle, SplitSquareVertical, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { OutfitRecommendation } from '@/lib/recommendation-engine';

interface OutfitPreviewProps {
  outfit: OutfitRecommendation;
  renderedImageUrl: string | null;
  outfitError?: string | null;
  isRendering: boolean;
  originalSelfieUrl?: string | null;
  onRetry?: () => void;
}

export default function OutfitPreview({
  outfit,
  renderedImageUrl,
  outfitError,
  isRendering,
  originalSelfieUrl,
  onRetry,
}: OutfitPreviewProps) {
  const { topOrDress, bottom, outerwear, stylingRationale } = outfit;
  const [viewMode, setViewMode] = useState<'fit' | 'paired'>('fit');

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
              Generative apparel try-on matched against today&apos;s weather and aesthetic vibe.
            </p>
          </div>

          {originalSelfieUrl && garmentImage && (
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

        {/* Render Image or Shimmer Skeleton */}
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-900 border border-stone-200 mb-5 flex items-center justify-center group">
          {outfitError ? (
            <div className="p-6 text-center text-stone-300 max-w-sm flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="text-xs font-bold text-white mb-1">Clothes Try-On Unavailable</h4>
              <p className="text-[11px] text-stone-400 mb-3">{outfitError}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Clothes VTO
                </button>
              )}
            </div>
          ) : isRendering ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center animate-shimmer relative">
              <div className="w-10 h-10 rounded-full border-3 border-amber-600 border-t-transparent animate-spin mb-3" />
              <span className="text-xs font-semibold text-stone-200">
                Fitting Selected Apparel via YouCam AI...
              </span>
              <span className="text-[11px] text-stone-400 mt-1">
                Synthesizing silhouette &amp; draping from your digital wardrobe
              </span>
            </div>
          ) : garmentImage ? (
            viewMode === 'paired' && originalSelfieUrl ? (
              /* Paired Dual Canvas View */
              <div className="w-full h-full grid grid-cols-2 gap-1.5 bg-stone-950 p-1.5">
                <div className="relative h-full rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalSelfieUrl}
                    alt="Your Portrait Canvas"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-xs text-[9px] font-semibold text-white px-2 py-0.5 rounded">
                    Your Canvas
                  </div>
                </div>
                <div className="relative h-full rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={garmentImage}
                    alt="Selected Garment"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-xs text-[9px] font-semibold text-white px-2 py-0.5 rounded">
                    {renderedImageUrl ? 'YouCam VTO Fit' : 'Selected Piece'}
                  </div>
                </div>
              </div>
            ) : (
              /* Clean Single Garment Focus */
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={garmentImage}
                  alt="Selected Outfit Try-On"
                  className="w-full h-full object-cover"
                />

                {/* Status Badge */}
                <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {renderedImageUrl ? 'YouCam Clothes VTO Rendered' : 'Wardrobe Piece Matched'}
                </div>

                {/* Garment Tag */}
                {topOrDress && (
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Sparkle className="w-3 h-3 text-amber-400" />
                    <span>{topOrDress.brand}: {topOrDress.name}</span>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="p-6 text-center text-stone-400 text-xs">
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
