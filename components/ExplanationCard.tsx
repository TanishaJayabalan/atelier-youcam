'use client';

import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle, SunMedium, Palette } from 'lucide-react';
import { SkinAnalysisResult } from '@/lib/youcam/skin-analysis';
import { SkinToneResult } from '@/lib/youcam/skin-tone';
import { WeatherResult } from '@/lib/weather';

interface ExplanationCardProps {
  vibe: string;
  skin: SkinAnalysisResult;
  skinTone: SkinToneResult;
  weather: WeatherResult;
  explanation: string;
}

export default function ExplanationCard({
  vibe,
  skin,
  skinTone,
  weather,
}: ExplanationCardProps) {
  const hasRedness = skin.concerns.redness && skin.concerns.redness.severity !== 'low';

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-hidden relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
              Daily Mirror Check Summary
            </span>
            <span className="text-xs font-semibold text-stone-600 capitalize bg-stone-100 px-2.5 py-1 rounded-full">
              {vibe} Vibe Profile
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-2">
            Harmonized Look &amp; Skin Strategy
          </h2>
        </div>

        {/* Vitality Score Badge */}
        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/80 px-4 py-2.5 rounded-xl self-start md:self-auto">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-stone-500">Overall Vitality</div>
            <div className="text-lg font-black text-stone-900 leading-none mt-0.5">
              {skin.overallScore}<span className="text-xs font-medium text-stone-400">/100</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {skin.skinType.charAt(0).toUpperCase() + skin.skinType.slice(1, 4)}
          </div>
        </div>
      </div>

      {/* 3 Core Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* Metric 1: Skin & Barrier */}
        <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center gap-2 mb-1.5">
            {hasRedness ? (
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
            <span className="text-xs font-bold text-stone-900">Barrier Health</span>
          </div>
          <p className="text-xs text-stone-600">
            {hasRedness ? (
              <span className="text-amber-800 font-medium">
                Active redness detected ({skin.concerns.redness.score}%). Routine adjusted for barrier recovery.
              </span>
            ) : (
              'Barrier equilibrium stable. Optimal cellular hydration and radiance.'
            )}
          </p>
        </div>

        {/* Metric 2: Undertone & Season */}
        <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center gap-2 mb-1.5">
            <Palette className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold text-stone-900">Color Harmony</span>
          </div>
          <p className="text-xs text-stone-600">
            <strong className="text-stone-800 capitalize">{skinTone.undertone}</strong> undertone with{' '}
            <strong className="text-stone-800">{skinTone.season || skinTone.seasonPalette}</strong> palette.{' '}
            {skinTone.colorHarmonyDescription || skinTone.palette?.description || 'Harmonized color palette tailored to your undertone.'}
          </p>
        </div>

        {/* Metric 3: Weather Shield */}
        <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/60">
          <div className="flex items-center gap-2 mb-1.5">
            <SunMedium className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-stone-900">Atmospheric Defense</span>
          </div>
          <p className="text-xs text-stone-600">
            {weather.tempC}°C in {weather.city || 'your area'}. UV Index {weather.uvIndex}{' '}
            {weather.uvIndex >= 8
              ? '(Very High UV defense active)'
              : weather.uvIndex >= 6
              ? '(High UV defense active)'
              : weather.uvIndex >= 3
              ? '(Moderate UV)'
              : '(Low UV)'}.
          </p>
        </div>
      </div>
    </div>
  );
}
