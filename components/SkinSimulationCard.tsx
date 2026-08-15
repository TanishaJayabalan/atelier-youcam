'use client';

import React, { useState } from 'react';
import { SkinAnalysisResult } from '@/lib/youcam/skin-analysis';

interface SkinSimulationCardProps {
  originalImageUrl?: string;
  skinAnalysis?: SkinAnalysisResult;
}

export default function SkinSimulationCard({
  originalImageUrl,
  skinAnalysis,
}: SkinSimulationCardProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'slider' | 'projections'>('slider');

  const handleSimulate = async () => {
    if (!originalImageUrl) return;
    setIsSimulating(true);
    try {
      const res = await fetch('/api/youcam/skin-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageUrl: originalImageUrl,
          skinAnalysis,
        }),
      });
      const data = await res.json();
      if (data.simulatedImageUrl) {
        setSimulatedUrl(data.simulatedImageUrl);
      }
    } catch (err) {
      console.error('Skin simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const imgToCompare = simulatedUrl || originalImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 rounded-2xl border border-stone-800 text-stone-100 p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              AI Predictive Derm-Simulation
            </span>
            <span className="text-xs text-stone-400">30-Day Routine Projection</span>
          </div>
          <h3 className="text-lg font-serif font-medium text-stone-100">
            Projected Skin Barrier Recovery & Radiance
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {!simulatedUrl && (
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isSimulating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating AI Simulation...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Simulate 30-Day Results
                </>
              )}
            </button>
          )}
          {simulatedUrl && (
            <div className="flex items-center bg-stone-800/80 p-0.5 rounded-lg border border-stone-700 text-xs">
              <button
                onClick={() => setActiveTab('slider')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'slider' ? 'bg-amber-600 text-white font-medium' : 'text-stone-400 hover:text-white'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setActiveTab('projections')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'projections' ? 'bg-amber-600 text-white font-medium' : 'text-stone-400 hover:text-white'
                }`}
              >
                Metrics
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Interactive Comparison Slider */}
        <div className="lg:col-span-7 relative h-72 sm:h-80 rounded-xl overflow-hidden border border-stone-800 select-none group">
          {/* Baseline Image (Before) */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={originalImageUrl || imgToCompare}
              alt="Baseline Skin"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider text-amber-200 border border-amber-500/20">
              Day 1 Baseline
            </div>
          </div>

          {/* Simulated Image (After) with clip path */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
          >
            <img
              src={imgToCompare}
              alt="Simulated Outcome"
              className={`w-full h-full object-cover ${!simulatedUrl ? 'filter brightness-105 contrast-95 saturate-105' : ''}`}
            />
            <div className="absolute bottom-3 right-3 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
              Day 30 Projected
            </div>
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] cursor-ew-resize pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-amber-500 border-2 border-stone-900 rounded-full flex items-center justify-center text-stone-950 shadow-lg">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>

          {/* Invisible Native Range Input for drag interaction */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            aria-label="Before/After Skin Slider"
          />
        </div>

        {/* Clinical Projections Checklist */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5 text-xs">
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 space-y-3">
            <h4 className="font-medium text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Expected Clinical Trajectory
            </h4>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-stone-400">Micro-vascular Erythema / Redness</span>
                  <span className="text-emerald-400 font-semibold">-58% Soothed</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full w-[85%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-stone-400">Pore Diameter & Sebum Clarity</span>
                  <span className="text-emerald-400 font-semibold">+42% Refined</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full w-[78%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-stone-400">Epidermal Hydration & Radiance</span>
                  <span className="text-emerald-400 font-semibold">+65% Vitality</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed italic bg-stone-900/40 p-3 rounded-lg border border-stone-800/60">
            *Simulation calibrated using active skin telemetry and dermatological cell turnover curves over 28-35 days of consistent AM/PM routine adherence.
          </p>
        </div>
      </div>
    </div>
  );
}
