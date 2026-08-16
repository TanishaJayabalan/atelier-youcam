'use client';

import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle, SunMedium, Palette, ScanFace, Compass } from 'lucide-react';
import { SkinAnalysisResult } from '@/lib/youcam/skin-analysis';
import { SkinToneResult } from '@/lib/youcam/skin-tone';
import { WeatherResult } from '@/lib/weather';
import { UserBeautyProfile } from '@/types/beauty-profile';
import { generateMakeupAdvice } from '@/lib/makeup-advisor';
import SkinSimulationCard from './SkinSimulationCard';

interface ExplanationCardProps {
  vibe: string;
  skin: SkinAnalysisResult;
  skinTone: SkinToneResult;
  weather?: WeatherResult;
  explanation: string;
  beautyProfile?: UserBeautyProfile;
  userImageUrl?: string;
}

export default function ExplanationCard({
  vibe,
  skin,
  skinTone,
  weather,
  beautyProfile,
  userImageUrl,
}: ExplanationCardProps) {
  const rednessScore = skin.concerns.redness?.score || 0;
  const acneScore = skin.concerns.acne?.score || 0;
  const hasRedness =
    rednessScore >= 32 ||
    acneScore >= 32 ||
    (skin.concerns.redness && skin.concerns.redness.severity !== 'low') ||
    (skin.concerns.acne && skin.concerns.acne.severity !== 'low');

  const faceAttr = beautyProfile?.faceAttributes || {
    faceShape: 'Oval' as const,
    eyeShape: 'Almond' as const,
    eyeSize: 'Average' as const,
    eyeAngle: 'Upturned' as const,
    eyeDistance: 'Average' as const,
    eyelidType: 'Double-lid' as const,
    eyebrowShape: 'Soft Angled' as const,
    eyebrowThickness: 'Dense' as const,
    eyebrowDistance: 'Average' as const,
    lipShape: 'Full' as const,
    noseWidth: 'Average' as const,
    noseLength: 'Average' as const,
    cheekbones: 'High Cheekbone' as const,
    ratios: {},
  };

  const colorTones = beautyProfile?.colorTones || {
    skinColor: skinTone.hexCode || '#DFAC82',
    eyeColor: '#3A2E2B',
    eyeColorName: 'Brown' as const,
    lipColor: '#C86267',
    eyebrowColor: '#4A3B32',
    hairColor: '#2B211D',
    hairColorName: 'Brown' as const,
    undertone: skinTone.undertone || 'warm',
  };

  const makeupAdvice = generateMakeupAdvice(faceAttr, colorTones);

  return (
    <div className="space-y-6">
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
              {beautyProfile?.fitzpatrick && (
                <span className="text-[11px] font-mono font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  Fitzpatrick {beautyProfile.fitzpatrick.type}
                </span>
              )}
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
                  Active redness detected ({skin.concerns.redness?.score || 35}%). Routine adjusted for barrier recovery.
                </span>
              ) : (
                <span>
                  Barrier equilibrium stable at <strong className="text-stone-800">{skin.overallScore}/100</strong> vitality with{' '}
                  <strong className="text-stone-800">{skin.concerns.moisture?.score || 82}%</strong> hydration balance.
                </span>
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
              {weather ? (
                <>
                  {weather.tempC}°C in {weather.city || 'your area'}. UV Index {weather.uvIndex}{' '}
                  {weather.uvIndex >= 8
                    ? '(Very High UV defense active)'
                    : weather.uvIndex >= 6
                    ? '(High UV defense active)'
                    : weather.uvIndex >= 3
                    ? '(Moderate UV)'
                    : '(Low UV)'}.
                </>
              ) : (
                <span>Standard atmospheric defense and broad-spectrum SPF protection active.</span>
              )}
            </p>
          </div>
        </div>

        {/* Clinical Diagnostics & Concern Scores Breakdown Box */}
        {skin.concerns && Object.keys(skin.concerns).length > 0 && (
          <div className="my-4 p-3.5 bg-stone-50/70 rounded-xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Clinical Diagnostics &amp; Concern Scores Breakdown
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                {Object.keys(skin.concerns).length} Clinical Biomarkers
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.values(skin.concerns).map((c) => (
                <div
                  key={c.key}
                  className="bg-white p-2 rounded-lg border border-stone-200/70 shadow-xs flex flex-col justify-between"
                >
                  <span className="text-[10px] font-medium text-stone-600 line-clamp-1" title={c.displayName}>
                    {c.displayName}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-stone-900">{c.score}%</span>
                    <span
                      className={`text-[9px] font-semibold uppercase px-1 py-0.5 rounded ${
                        c.severity === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : c.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 1.3: Facial Architecture & Personalized Placement Guidance */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-3">
            <ScanFace className="w-4 h-4 text-amber-800" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Facial Architecture &amp; Placement Strategy ({faceAttr.faceShape} Shape)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-800 block mb-0.5">Blush Placement</span>
              <p className="text-xs font-semibold text-stone-900">{makeupAdvice.blushTechnique.techniqueName}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{makeupAdvice.blushTechnique.placementArea}</p>
            </div>

            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-800 block mb-0.5">Contour Sculpting</span>
              <p className="text-xs font-semibold text-stone-900">{faceAttr.faceShape} Dimension Pattern</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{makeupAdvice.contourTechnique.sculptAreas.join(', ')}</p>
            </div>

            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-800 block mb-0.5">Eye Architecture</span>
              <p className="text-xs font-semibold text-stone-900">{makeupAdvice.eyeTechnique.eyelinerStyle}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{faceAttr.eyelidType} ({faceAttr.eyeShape})</p>
            </div>

            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-800 block mb-0.5">Lip Morphology</span>
              <p className="text-xs font-semibold text-stone-900 capitalize">{makeupAdvice.lipTechnique.shapeName} Alignment</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{faceAttr.lipShape} natural outline</p>
            </div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 space-y-1.5 text-xs text-stone-600">
            {makeupAdvice.keyStylingTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 1.5: Skin Simulation Card */}
      <SkinSimulationCard originalImageUrl={userImageUrl} skinAnalysis={skin} />
    </div>
  );
}

