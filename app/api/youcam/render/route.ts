import { NextRequest, NextResponse } from 'next/server';
import { base64ToBuffer } from '@/lib/image-utils';
import { applyMakeup, MakeupStep } from '@/lib/youcam/makeup-vto';
import { applyOutfit, applyMultiGarmentOutfit, GarmentToApply } from '@/lib/youcam/clothes-vto';
import { getLookSession, saveLookSession, ClosetItem } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      sessionId,
      selfieBase64,
      makeupSteps = [] as MakeupStep[],
      outfitItem = null as ClosetItem | null,
      outfitItems = null as ClosetItem[] | null,
    } = body;

    if (!selfieBase64) {
      return NextResponse.json(
        { error: 'Selfie image is required to render virtual try-on looks.' },
        { status: 400 }
      );
    }

    const { buffer: selfieBuffer, contentType } = base64ToBuffer(selfieBase64);

    // Collect garments to apply (supports both single outfitItem and multi-piece outfitItems)
    const garmentsToApply: GarmentToApply[] = [];
    if (Array.isArray(outfitItems) && outfitItems.length > 0) {
      outfitItems.forEach((item) => {
        if (item && item.image_url) {
          garmentsToApply.push({
            name: item.name,
            category: item.category,
            image_url: item.image_url,
          });
        }
      });
    } else if (outfitItem && outfitItem.image_url) {
      garmentsToApply.push({
        name: outfitItem.name,
        category: outfitItem.category,
        image_url: outfitItem.image_url,
      });
    }

    // Independent parallel execution of Makeup VTO and Clothes VTO with Promise.allSettled
    const [makeupOutcome, clothesOutcome] = await Promise.allSettled([
      makeupSteps.length > 0
        ? applyMakeup(selfieBuffer, makeupSteps, contentType)
        : Promise.resolve(null),
      garmentsToApply.length > 0
        ? garmentsToApply.length === 1
          ? applyOutfit(selfieBuffer, garmentsToApply[0].image_url, {
              garmentName: garmentsToApply[0].name,
              category: garmentsToApply[0].category,
              selfieContentType: contentType,
            })
          : applyMultiGarmentOutfit(selfieBuffer, garmentsToApply, contentType)
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
