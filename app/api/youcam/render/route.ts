import { NextRequest, NextResponse } from 'next/server';
import { base64ToBuffer } from '@/lib/image-utils';
import { applyMakeup, MakeupStep } from '@/lib/youcam/makeup-vto';
import { applyOutfit } from '@/lib/youcam/clothes-vto';
import { getLookSession, saveLookSession, ClosetItem } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      sessionId,
      selfieBase64,
      makeupSteps = [] as MakeupStep[],
      outfitItem = null as ClosetItem | null,
    } = body;

    if (!selfieBase64) {
      return NextResponse.json(
        { error: 'Selfie image is required to render virtual try-on looks.' },
        { status: 400 }
      );
    }

    const { buffer: selfieBuffer, contentType } = base64ToBuffer(selfieBase64);

    // Parallel execution of Makeup VTO and Clothes VTO
    const tasks: [Promise<any>, Promise<any>] = [
      // Task 1: Makeup VTO
      makeupSteps.length > 0
        ? applyMakeup(selfieBuffer, makeupSteps, contentType).catch((err) => {
            console.error('Makeup VTO render error:', err);
            return { resultImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', error: err.message };
          })
        : Promise.resolve({ resultImageUrl: null }),

      // Task 2: Clothes VTO
      outfitItem && outfitItem.image_url
        ? applyOutfit(selfieBuffer, outfitItem.image_url, {
            garmentName: outfitItem.name,
            category: outfitItem.category,
            selfieContentType: contentType,
          }).catch((err) => {
            console.error('Clothes VTO render error:', err);
            return { resultImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', error: err.message };
          })
        : Promise.resolve({ resultImageUrl: null }),
    ];

    const [makeupResult, clothesResult] = await Promise.all(tasks);

    const makeupResultUrl = makeupResult?.resultImageUrl || null;
    const outfitResultUrl = clothesResult?.resultImageUrl || null;

    // Update existing session if sessionId is provided
    if (sessionId) {
      const existingSession = await getLookSession(sessionId);
      if (existingSession) {
        await saveLookSession({
          ...existingSession,
          makeup_result_url: makeupResultUrl,
          outfit_result_url: outfitResultUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId || null,
      makeupResultUrl,
      outfitResultUrl,
    });
  } catch (err: any) {
    console.error('Render route error:', err);
    return NextResponse.json(
      {
        error: err.message || 'An error occurred during look rendering.',
      },
      { status: 500 }
    );
  }
}
