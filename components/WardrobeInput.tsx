'use client';

import React, { useRef, useState } from 'react';
import { Shirt, Upload, Camera, ImageIcon } from 'lucide-react';

interface WardrobeInputProps {
  selectedSelfie: string | null;
  onSelfieSelected: (base64: string | null) => void;
  onAnalyze: (base64?: string) => void;
  isAnalyzing: boolean;
  isRendering: boolean;
}

export default function WardrobeInput({
  selectedSelfie,
  onSelfieSelected,
  onAnalyze,
  isAnalyzing,
  isRendering,
}: WardrobeInputProps) {
  const [sourceType, setSourceType] = useState<'upload' | 'camera' | 'samples'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onSelfieSelected(base64);
      onAnalyze(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full">
      {/* Upload Card */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#2C2C2C] flex items-center gap-2 mb-2">
            <Shirt className="w-5 h-5 text-[#E57A2A]" />
            Wardrobe Virtual Try-On & Styling
          </h2>
          <p className="text-sm text-stone-500">
            Generative apparel try-on fitted to your full-body silhouette via YouCam AI.
          </p>
        </div>

        <div className="border border-[#E8E2D9] rounded-2xl p-4 bg-[#FAF9F6]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E57A2A]" />
              <span className="text-xs font-bold text-[#2C2C2C] tracking-widest uppercase">
                Full-Body / Outfit Canvas
              </span>
            </div>
            
            <div className="flex bg-[#E8E2D9]/50 p-1 rounded-xl">
              {(['upload', 'camera', 'samples'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSourceType(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    sourceType === type ? 'bg-white shadow-sm text-[#2C2C2C]' : 'text-stone-500 hover:text-[#2C2C2C]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`border-2 border-dashed border-[#D9CDB8] rounded-xl bg-white flex flex-col items-center justify-center text-center transition-colors overflow-hidden relative ${selectedSelfie ? 'p-2 cursor-default' : 'py-16 px-4 cursor-pointer hover:bg-stone-50'}`}
            onClick={() => !selectedSelfie && fileInputRef.current?.click()}
          >
            {selectedSelfie ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedSelfie} alt="Selected full body" className="w-full max-h-[500px] object-contain rounded-lg" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2C2C2C] shadow-sm hover:bg-white transition-colors"
                >
                  Change Photo
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-[#FFF3E5] rounded-full flex items-center justify-center mb-4 shadow-sm border border-[#FFE4C4]">
                  <Upload className="w-5 h-5 text-[#E57A2A]" />
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-2">
                  Upload a full body photo to try on this outfit
                </h3>
                <p className="text-xs text-stone-400">
                  Drag & drop or click to browse (standing full-body or half-body portrait)
                </p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          {selectedSelfie && (
            <div className="mt-4 flex items-center justify-end">
              <button 
                onClick={() => onAnalyze()}
                disabled={isAnalyzing || isRendering}
                className="bg-[#2C2C2C] hover:bg-black text-white px-6 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isRendering ? 'Fitting...' : 'Start Try-On'}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
