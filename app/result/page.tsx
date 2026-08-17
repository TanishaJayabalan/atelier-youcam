'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import ExplanationCard from '@/components/ExplanationCard';
import SkincareRoutineCard from '@/components/SkincareRoutineCard';
import MakeupPreview from '@/components/MakeupPreview';
import OutfitPreview from '@/components/OutfitPreview';
import GapFillShelf from '@/components/GapFillShelf';
import { LookSession } from '@/lib/supabase';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState<LookSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/analyze');
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        if (!res.ok) throw new Error('Session not found');
        const data = await res.json();
        setSession(data.session);
      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-stone-700">
        <div className="w-8 h-8 rounded-full border-3 border-amber-700 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading saved look session...</p>
      </div>
    );
  }

  if (error || !session || !session.recommendation) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center text-stone-700">
        <p className="text-sm font-semibold text-red-700 mb-2">Look session not found.</p>
        <Link
          href="/analyze"
          className="text-xs bg-amber-700 text-white font-semibold px-4 py-2 rounded-xl"
        >
          Create New Look
        </Link>
      </div>
    );
  }

  const { skin_analysis, skin_tone, weather, recommendation } = session;

  return (
    <main className="min-h-screen bg-[#FAF8F5] pb-24 text-stone-900">
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href="/analyze"
            className="flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Atelier
          </Link>
          <span className="text-xs font-mono text-stone-500">ID: {session.id}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <ExplanationCard
          vibe={session.vibe}
          skin={skin_analysis}
          skinTone={skin_tone}
          weather={weather}
          explanation={recommendation.explanation}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MakeupPreview
            makeupSteps={recommendation.makeupSteps}
            renderedImageUrl={session.makeup_result_url || null}
            isRendering={false}
          />
          <OutfitPreview
            outfit={recommendation.outfit}
            renderedImageUrl={session.outfit_result_url || null}
            isRendering={false}
          />
        </div>

        <SkincareRoutineCard
          warnings={recommendation.skincareNotes.warnings}
          amSteps={recommendation.skincareNotes.amSteps}
          pmSteps={recommendation.skincareNotes.pmSteps}
        />

        <GapFillShelf suggestions={recommendation.gapFillSuggestions} />
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-amber-700 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
