'use client';

import React, { useState } from 'react';
import { UserBeautyProfile } from '@/types/beauty-profile';
import { matchCelebrityLooks, CelebrityMatch } from '@/lib/celebrity-matcher';
import { authenticatedFetch } from '@/lib/api-fetch';

interface CelebrityLookPanelProps {
  userImageUrl?: string;
  beautyProfile?: UserBeautyProfile;
  selectedVibe?: string;
  onApplyLookToMainVTO?: (effects: any[]) => void;
}

export default function CelebrityLookPanel({
  userImageUrl,
  beautyProfile,
  selectedVibe = 'Bold',
}: CelebrityLookPanelProps) {
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [transferredImage, setTransferredImage] = useState<string | null>(null);
  const [transferredCelebName, setTransferredCelebName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [customInspoFile, setCustomInspoFile] = useState<string | null>(null);

  const defaultProfile: any = beautyProfile || {
    skin: {
      overallScore: 85,
      skinType: 'combination',
      concerns: {},
      skinAge: 25,
      topConcerns: [],
    },
    fitzpatrick: {
      type: 'III',
      label: 'Type III: Medium Golden',
      sunReaction: 'Tans with gradual exposure',
      melaninIndex: 50,
      description: 'Balanced baseline',
    },
    colorTones: {
      skinColor: '#DFAC82',
      eyeColor: '#3A2E2B',
      eyeColorName: 'Brown',
      lipColor: '#C86267',
      eyebrowColor: '#4A3B32',
      hairColor: '#2B211D',
      hairColorName: 'Brown',
      undertone: 'warm',
    },
    faceAttributes: {
      faceShape: 'Oval',
      eyeShape: 'Almond',
      eyeSize: 'Average',
      eyeAngle: 'Upturned',
      eyeDistance: 'Average',
      eyelidType: 'Double-lid',
      eyebrowShape: 'Soft Angled',
      eyebrowThickness: 'Dense',
      eyebrowDistance: 'Average',
      lipShape: 'Full',
      noseWidth: 'Average',
      noseLength: 'Average',
      cheekbones: 'High Cheekbone',
      ratios: {},
    },
  };

  const matches = matchCelebrityLooks(defaultProfile, selectedVibe);

  const handleTransfer = async (celebMatch: CelebrityMatch) => {
    if (!userImageUrl) return;
    setActiveTransferId(celebMatch.profile.id);
    setIsProcessing(true);
    setTransferredCelebName(celebMatch.profile.name);

    try {
      const res = await authenticatedFetch('/api/youcam/makeup-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageUrl,
          refImageUrl: celebMatch.profile.referencePhotoUrl,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setTransferredImage(data.imageUrl);
      }
    } catch (err) {
      console.error('Makeup transfer error:', err);
    } finally {
      setIsProcessing(false);
      setActiveTransferId(null);
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userImageUrl) return;

    setIsProcessing(true);
    setTransferredCelebName('Custom Inspo Look');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setCustomInspoFile(base64);

      try {
        const res = await authenticatedFetch('/api/youcam/makeup-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userImageUrl,
            refImageBase64: base64,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setTransferredImage(data.imageUrl);
        }
      } catch (err) {
        console.error('Custom inspo transfer error:', err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              AI Makeup Transfer
            </span>
            <span className="text-xs text-stone-500">Geometry & Pigment Match</span>
          </div>
          <h3 className="text-lg font-serif font-medium text-stone-900">
            Celebrity Look Archetypes & Inspo Transfer
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Matched to your <strong className="text-stone-700">{defaultProfile.faceAttributes.faceShape}</strong> face shape and{' '}
            <strong className="text-stone-700">{defaultProfile.colorTones.undertone}</strong> undertones.
          </p>
        </div>

        {/* Custom Inspo Upload */}
        <label className="cursor-pointer px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl border border-stone-300 transition-colors flex items-center gap-2 self-start md:self-auto">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload Custom Inspo Look
          <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
        </label>
      </div>

      {/* Transferred Result Preview if active */}
      {transferredImage && (
        <div className="mt-5 p-4 bg-purple-50/50 rounded-xl border border-purple-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Look Applied: {transferredCelebName}
              </h4>
            </div>
            <button
              onClick={() => setTransferredImage(null)}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative rounded-lg overflow-hidden border border-stone-200 aspect-[3/4]">
              <img
                src={userImageUrl}
                alt="Original Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono">
                Original Selfie
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-purple-300 aspect-[3/4] shadow-md">
              <img
                src={transferredImage}
                alt="Transferred Makeup Look"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-purple-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-purple-200 font-mono">
                {transferredCelebName} AI Transfer
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebrity Match Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.slice(0, 3).map((celebMatch) => {
          const { profile: celeb, matchScore, matchReasons } = celebMatch;
          const isCurrentProcessing = isProcessing && activeTransferId === celeb.id;

          return (
            <div
              key={celeb.id}
              className="group bg-stone-50 hover:bg-white rounded-xl border border-stone-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between"
            >
              <div>
                {/* Header with photo & score */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-200 shadow-sm">
                    <img
                      src={celeb.referencePhotoUrl}
                      alt={celeb.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        {matchScore}% Match
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase font-mono">
                        {celeb.faceShape}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-stone-900 truncate">
                      {celeb.name}
                    </h4>
                    <p className="text-xs font-serif italic text-purple-700 truncate">
                      {celeb.title}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-3 line-clamp-2">
                  {celeb.description}
                </p>

                {/* Match criteria pills */}
                <div className="space-y-1 mb-4">
                  {matchReasons.slice(0, 2).map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="truncate">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => handleTransfer(celebMatch)}
                disabled={isProcessing}
                className="w-full py-2 bg-stone-900 hover:bg-purple-900 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isCurrentProcessing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Transferring Look...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Clone Look to My Face
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
