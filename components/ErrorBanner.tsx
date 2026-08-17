'use client';

import React from 'react';
import { CreditCard, Image as ImageIcon, UserX, WifiOff, AlertTriangle, Key, RefreshCw, Upload } from 'lucide-react';
import { formatError, FormattedError } from '@/lib/error-formatter';

interface ErrorBannerProps {
  error: string | FormattedError | null | undefined;
  onOpenApiSettings?: () => void;
  onSelectNewPhoto?: () => void;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorBanner({
  error,
  onOpenApiSettings,
  onSelectNewPhoto,
  onRetry,
  className = '',
}: ErrorBannerProps) {
  if (!error) return null;

  const formatted: FormattedError | null = typeof error === 'string' ? formatError(error) : error;
  if (!formatted) return null;

  const getIcon = () => {
    switch (formatted.type) {
      case 'credits':
        return <CreditCard className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />;
      case 'image_format':
        return <ImageIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
      case 'face_detection':
        return <UserX className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
      case 'network':
        return <WifiOff className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />;
    }
  };

  const getBorderAndBg = () => {
    switch (formatted.type) {
      case 'credits':
        return 'bg-red-50/90 border-red-200 text-red-950';
      case 'image_format':
      case 'face_detection':
        return 'bg-amber-50/90 border-amber-200 text-amber-950';
      case 'network':
        return 'bg-stone-50 border-stone-300 text-stone-900';
      default:
        return 'bg-red-50/90 border-red-200 text-red-950';
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300 ${getBorderAndBg()} ${className}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div>
          <h4 className="text-sm font-semibold mb-0.5">{formatted.title}</h4>
          <p className="text-xs leading-relaxed opacity-90">{formatted.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {formatted.actionType === 'api_settings' && onOpenApiSettings && (
          <button
            type="button"
            onClick={onOpenApiSettings}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        )}

        {formatted.actionType === 'change_photo' && onSelectNewPhoto && (
          <button
            type="button"
            onClick={onSelectNewPhoto}
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Select Photo</span>
          </button>
        )}

        {formatted.actionType === 'retry' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}
