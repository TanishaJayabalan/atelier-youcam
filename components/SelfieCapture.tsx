'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, CheckCircle2, Image as ImageIcon, VideoOff, Aperture } from 'lucide-react';
import ErrorBanner from './ErrorBanner';

interface SelfieCaptureProps {
  onSelfieSelected: (base64: string | null) => void;
  selectedSelfie: string | null;
  captureMode?: 'portrait' | 'full-body' | 'hair' | 'makeup' | 'skin';
  title?: string;
  subtitle?: string;
}

const SAMPLE_SELFIES = [
  {
    id: 'sample_1',
    label: 'Deep Melanin / Braided (Type V-VI)',
    url: '/images/model-1.jpg',
  },
  {
    id: 'sample_2',
    label: 'Porcelain Dewy / Bob (Type I-II)',
    url: '/images/model-2.jpg',
  },
  {
    id: 'sample_3',
    label: 'Sun-Kissed Olive / Freckles (Type IV)',
    url: '/images/model-3.jpg',
  },
  {
    id: 'sample_4',
    label: 'Fair Rosy / Blonde (Type I-II)',
    url: '/images/model-4.jpg',
  },
];

export default function SelfieCapture({
  onSelfieSelected,
  selectedSelfie,
  captureMode = 'portrait',
  title,
  subtitle,
}: SelfieCaptureProps) {
  const [sourceType, setSourceType] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [capturedFromCamera, setCapturedFromCamera] = useState(false);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Convert image URL to base64
  const loadUrlAsBase64 = useCallback(async (url: string) => {
    try {
      setFileError(null);
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
      setFileError('Failed to load sample model image.');
    }
  }, [onSelfieSelected]);

  const isStartingRef = useRef(false);

  // Start live webcam stream
  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    setFileError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(
        'Camera access denied or unavailable. Please enable permissions or use sample presets.'
      );
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  // Stop live webcam stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Control camera start/stop on tab change
  useEffect(() => {
    if (sourceType === 'camera' && !selectedSelfie) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [sourceType, selectedSelfie]);

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedFromCamera(true);
    setFileError(null);
    onSelfieSelected(base64);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedFromCamera(false);
    setFileError(null);
    onSelfieSelected(null);
    if (sourceType === 'camera') {
      startCamera();
    }
  };

  const processFile = (file: File) => {
    setFileError(null);

    // 1. Validate file format
    if (!file.type.startsWith('image/')) {
      setFileError('The selected file format is not accepted. Please upload a JPG, PNG, or WEBP photo.');
      return;
    }

    // 2. Validate file size (under 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setFileError('Photo file size is too large (exceeds 15MB). Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        setFileError('Could not decode the uploaded image. Please try another photo.');
      };
      img.onload = () => {
        // High-precision client-side downscale to prevent payload overflows
        const maxDim = 1920;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setCapturedFromCamera(false);
          onSelfieSelected(canvas.toDataURL('image/jpeg', 0.92));
        } else {
          setCapturedFromCamera(false);
          onSelfieSelected(rawBase64);
        }
      };
      img.src = rawBase64;
    };
    reader.onerror = () => {
      setFileError('Failed to read the selected file.');
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

  const headerTitle = title || (
    captureMode === 'hair'
      ? 'Your Hair & Crown Canvas'
      : captureMode === 'makeup'
      ? 'Your Makeup & Facial Canvas'
      : captureMode === 'full-body'
      ? 'Your Full Body Canvas'
      : 'Your Portrait & Facial Canvas'
  );

  const headerSubtitle = subtitle || (
    captureMode === 'hair'
      ? 'Scan hair architecture, curl pattern, and natural pigment for restyling & care.'
      : captureMode === 'makeup'
      ? 'Facial geometry and undertone analysis for perfect cosmetic shade matching.'
      : captureMode === 'full-body'
      ? 'Upload a full body photo for accurate wardrobe recommendations.'
      : 'Real YouCam AI biometric facial analysis for skin health and color harmony.'
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700" />
            {headerTitle}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {headerSubtitle}
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

        {selectedSelfie ? (
          <div className="relative rounded-2xl overflow-hidden bg-[#FAF9F6] border border-stone-200 aspect-[3/4] max-h-96 mx-auto flex items-center justify-center group">
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
          <div className="relative rounded-2xl overflow-hidden bg-[#FAF9F6] aspect-[3/4] max-h-96 mx-auto flex flex-col items-center justify-center border border-stone-200">
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
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-52 h-68 rounded-[50%] border-2 border-dashed border-white/60 shadow-xs" />
                  <span className="text-[11px] font-medium text-white/90 bg-stone-900/60 px-3 py-1 rounded-full backdrop-blur-xs mt-3">
                    Position face inside oval &amp; look straight ahead
                  </span>
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

        {/* File Error Notice */}
        {fileError && (
          <div className="mt-3">
            <ErrorBanner
              error={fileError}
              onSelectNewPhoto={() => fileInputRef.current?.click()}
            />
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
