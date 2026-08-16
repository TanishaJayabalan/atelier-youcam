'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, CheckCircle2, Image as ImageIcon, VideoOff, Aperture } from 'lucide-react';

interface SelfieCaptureProps {
  onSelfieSelected: (base64: string | null) => void;
  selectedSelfie: string | null;
}

const SAMPLE_SELFIES = [
  {
    id: 'sample_acne',
    label: '🎯 Blemishes & Texture Portrait',
    url: 'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample_1',
    label: 'Studio Portrait (Warm Golden)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample_2',
    label: 'Natural Daylight (Neutral)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample_3',
    label: 'Deep Melanin (Rich Radiance)',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  },
];

export default function SelfieCapture({ onSelfieSelected, selectedSelfie }: SelfieCaptureProps) {
  const [sourceType, setSourceType] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [capturedFromCamera, setCapturedFromCamera] = useState(false);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Convert image URL to base64
  const loadUrlAsBase64 = useCallback(async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        setCapturedFromCamera(false);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            onSelfieSelected(canvas.toDataURL('image/jpeg', 0.95));
          } else {
            onSelfieSelected(rawBase64);
          }
        };
        img.src = rawBase64;
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to load sample image:', e);
    }
  }, [onSelfieSelected]);

  const isStartingRef = useRef(false);

  // Start live webcam stream
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
          width: { ideal: 1280 },
          height: { ideal: 1280 },
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
        setCameraError('Camera access denied or unavailable. Please enable permissions or use sample presets.');
      }
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  // Stop live webcam stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Control camera start/stop on tab change
  useEffect(() => {
    if (sourceType === 'camera' && !capturedFromCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [sourceType, capturedFromCamera, startCamera, stopCamera]);

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 1280;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.95);

      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      setCapturedFromCamera(true);
      onSelfieSelected(base64);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedFromCamera(false);
    onSelfieSelected(null);
    if (sourceType === 'camera') {
      startCamera();
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG or PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setCapturedFromCamera(false);
          onSelfieSelected(canvas.toDataURL('image/jpeg', 0.95));
        } else {
          setCapturedFromCamera(false);
          onSelfieSelected(rawBase64);
        }
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700" />
            1. Your Portrait &amp; Facial Canvas
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Real YouCam AI biometric facial analysis for skin health and color harmony.
          </p>
        </div>

        {/* Source Mode Selector */}
        <div className="flex bg-stone-100 p-1 rounded-xl gap-1 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSourceType('camera');
              setCapturedFromCamera(false);
              onSelfieSelected(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              sourceType === 'camera'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-700" />
            Live Camera
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceType('upload');
              setCapturedFromCamera(false);
              onSelfieSelected(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              sourceType === 'upload'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Upload Photo
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceType('samples');
              setCapturedFromCamera(false);
              loadUrlAsBase64(SAMPLE_SELFIES[0].url);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              sourceType === 'samples'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Preset Models
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="relative mt-2">
        {flash && <div className="absolute inset-0 bg-white z-20 pointer-events-none transition-opacity" />}

        {selectedSelfie && (capturedFromCamera || sourceType !== 'camera') ? (
          <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-200 aspect-[4/3] max-h-80 flex items-center justify-center group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedSelfie}
              alt="Selected Canvas Selfie"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-xs">
              <button
                type="button"
                onClick={handleRetake}
                className="bg-white text-stone-900 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 hover:bg-stone-100 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {capturedFromCamera ? 'Retake Photo' : 'Change Photo'}
              </button>
            </div>
            <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {capturedFromCamera ? 'Live Camera Snap Ready' : 'Portrait Ready'}
            </div>
          </div>
        ) : sourceType === 'camera' ? (
          <div className="relative rounded-2xl overflow-hidden bg-stone-950 aspect-[4/3] max-h-80 flex flex-col items-center justify-center border border-stone-200">
            {cameraError ? (
              <div className="p-6 text-center text-stone-300">
                <VideoOff className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium mb-3 max-w-xs">{cameraError}</p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Retry Permission
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('samples');
                      loadUrlAsBase64(SAMPLE_SELFIES[0].url);
                    }}
                    className="bg-stone-800 text-stone-200 hover:bg-stone-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Use Sample Model
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Face Guide Oval */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-white/40 shadow-xs" />
                </div>

                {/* Shutter Capture Button */}
                <div className="absolute bottom-4 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full border-4 border-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center justify-center shadow-lg cursor-pointer active:scale-95 group"
                    title="Click to Take Photo"
                  >
                    <Aperture className="w-7 h-7 text-white group-hover:rotate-45 transition-transform" />
                  </button>
                  <span className="text-[10px] font-semibold text-white/90 bg-stone-900/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    Click to Snap Selfie
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all aspect-[4/3] max-h-80 flex flex-col items-center justify-center ${
              isDragging
                ? 'border-amber-700 bg-amber-50/50'
                : 'border-stone-200 bg-stone-50 hover:bg-stone-100/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-stone-200/80 flex items-center justify-center mb-3 text-stone-700">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-stone-800">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Supports high-res JPG or PNG portrait selfies
            </p>
          </div>
        )}
      </div>

      {/* Preset Model Swatches */}
      {sourceType === 'samples' && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-600 mb-2.5 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
            Select Preset Model Canvas:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_SELFIES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadUrlAsBase64(sample.url)}
                className="group relative rounded-xl overflow-hidden border border-stone-200 aspect-square text-left hover:border-amber-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-600/30 cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sample.url}
                  alt={sample.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-medium text-white leading-tight">
                    {sample.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
