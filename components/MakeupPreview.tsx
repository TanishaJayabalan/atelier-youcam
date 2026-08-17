'use client';

import React, { useState } from 'react';
import { CheckCircle2, Paintbrush, SplitSquareVertical, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { MakeupStep } from '@/lib/youcam/makeup-vto';
import { UserBeautyProfile } from '@/types/beauty-profile';
import { findFoundationMatch } from '@/lib/foundation-matcher';

interface MakeupPreviewProps {
  makeupSteps: MakeupStep[];
  renderedImageUrl: string | null;
  makeupError?: string | null;
  isRendering: boolean;
  originalSelfieUrl?: string | null;
  beautyProfile?: UserBeautyProfile;
  onRetry?: () => void;
}

export default function MakeupPreview({
  makeupSteps,
  renderedImageUrl,
  makeupError,
  isRendering,
  originalSelfieUrl,
  beautyProfile,
  onRetry,
}: MakeupPreviewProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isComparingSplit, setIsComparingSplit] = useState(false);
  const [sliderPos, setSliderPos] = useState<number>(50);

  const rawOriginalImage = originalSelfieUrl;
  const activeVtoImage = renderedImageUrl;
  const displayImage = showOriginal ? rawOriginalImage : (activeVtoImage || rawOriginalImage);

  const lipStep = makeupSteps.find((s) => s.category === 'lip');
  const blushStep = makeupSteps.find((s) => s.category === 'blush');

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-amber-700" />
              Makeup Virtual Try-On
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Harmonized shade application on your facial canvas powered by YouCam AI.
            </p>
          </div>

          {activeVtoImage && rawOriginalImage && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsComparingSplit(!isComparingSplit)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                  isComparingSplit
                    ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 bg-stone-100 border-stone-200'
                }`}
                title="Toggle interactive split slider"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Split Slider
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsComparingSplit(false);
                  setShowOriginal(!showOriginal);
                }}
                className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1 cursor-pointer transition-all"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                {showOriginal ? 'Show VTO Look' : 'Show Original'}
              </button>
            </div>
          )}
        </div>

        {/* Main Canvas Viewport */}
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#FAF9F6] border border-stone-200 mb-5 flex items-center justify-center select-none group">
          {makeupError ? (
            <div className="p-6 text-center text-stone-300 max-w-sm flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="text-xs font-bold text-white mb-1">Makeup Try-On Unavailable</h4>
              <p className="text-[11px] text-stone-400 mb-3">{makeupError}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Makeup VTO
                </button>
              )}
            </div>
          ) : isRendering ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center animate-shimmer relative">
              <div className="w-10 h-10 rounded-full border-3 border-amber-600 border-t-transparent animate-spin mb-3" />
              <span className="text-xs font-semibold text-stone-200">
                Rendering Live YouCam Makeup Virtual Try-On...
              </span>
              <span className="text-[11px] text-stone-400 mt-1">
                Applying lipstick, blush, and complexion shades via YouCam S2S AI
              </span>
            </div>
          ) : displayImage ? (
            isComparingSplit && rawOriginalImage && activeVtoImage ? (
              /* Interactive Split Slider View */
              <div className="relative w-full h-full overflow-hidden">
                {/* Bottom: Original Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rawOriginalImage}
                  alt="Original Canvas"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Top: VTO Image (clipped to slider position) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeVtoImage}
                  alt="VTO Render"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                />

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-stone-900 shadow-md flex items-center justify-center text-[10px] font-bold">
                    ⇆
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                />

                <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm pointer-events-none">
                  YouCam VTO
                </div>
                <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm pointer-events-none">
                  Original
                </div>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage}
                  alt="Your Portrait Canvas"
                  className="w-full h-full object-cover transition-opacity duration-300"
                />

                <div className="absolute bottom-3 right-3 bg-stone-900/85 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {showOriginal ? 'Original Canvas' : 'YouCam VTO Applied'}
                </div>

                {lipStep && !showOriginal && (
                  <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <span
                      className="w-3 h-3 rounded-full border border-white/60 shadow-2xs shrink-0"
                      style={{ backgroundColor: lipStep.colorHex }}
                    />
                    <span>Lip: {lipStep.productName || 'Harmonized Lip Shade'}</span>
                  </div>
                )}

                {blushStep && !showOriginal && (
                  <div className="absolute top-10 left-3 mt-1 bg-stone-900/85 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <span
                      className="w-3 h-3 rounded-full border border-white/60 shadow-2xs shrink-0"
                      style={{ backgroundColor: blushStep.colorHex }}
                    />
                    <span>Blush: {blushStep.productName || 'Warm Blush Glow'}</span>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="p-6 text-center text-stone-400 text-xs">
              Waiting for portrait analysis...
            </div>
          )}
        </div>

        {/* Foundation Shade Finder Panel */}
        {beautyProfile && (
          <div className="mb-4 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
            {(() => {
              const match = findFoundationMatch(beautyProfile.colorTones, beautyProfile.fitzpatrick.type);
              return (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full border-2 border-white shadow-xs shrink-0"
                      style={{ backgroundColor: match.matchedHex }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900">{match.shadeName}</span>
                        <span className="font-mono text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded font-semibold">
                          {match.shadeCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {match.undertone} · {match.recommendedFinish}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      ✓ Shade Matched
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Applied Steps List */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
            Formulated Look Breakdown:
          </span>
          {makeupSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full border border-stone-300 shadow-2xs shrink-0"
                  style={{ backgroundColor: step.colorHex }}
                />
                <div>
                  <span className="font-semibold text-stone-900 capitalize text-xs">
                    {step.category}
                  </span>
                  <div className="text-[11px] text-stone-500">{step.productName}</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                  {step.intensity}% {step.finish || 'satin'}
                </span>
                <div className="text-[10px] font-mono text-stone-400 mt-0.5">{step.colorHex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
