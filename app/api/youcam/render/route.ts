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

    // Independent parallel execution of Makeup VTO and Clothes VTO with Promise.allSettled
    const [makeupOutcome, clothesOutcome] = await Promise.allSettled([
      makeupSteps.length > 0
        ? applyMakeup(selfieBuffer, makeupSteps, contentType)
        : Promise.resolve(null),
      outfitItem?.image_url
        ? applyOutfit(selfieBuffer, outfitItem.image_url, {
            garmentName: outfitItem.name,
            category: outfitItem.category,
            selfieContentType: contentType,
          })
        : Promise.resolve(null),
    ]);

    const makeupResultUrl =
      makeupOutcome.status === 'fulfilled' ? makeupOutcome.value?.resultImageUrl ?? null : null;
    const makeupError =
      makeupOutcome.status === 'rejected' ? makeupOutcome.reason.message : null;

    const outfitResultUrl =
      clothesOutcome.status === 'fulfilled' ? clothesOutcome.value?.resultImageUrl ?? null : null;
    const outfitError =
      clothesOutcome.status === 'rejected' ? clothesOutcome.reason.message : null;

    // Update existing session if sessionId is provided
    if (sessionId) {
      const existingSession = await getLookSession(sessionId);
      if (existingSession) {
        await saveLookSession({
          ...existingSession,
          makeup_result_url: makeupResultUrl || undefined,
          outfit_result_url: outfitResultUrl || undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId || null,
      makeupResultUrl,
      makeupError,
      outfitResultUrl,
      outfitError,
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
