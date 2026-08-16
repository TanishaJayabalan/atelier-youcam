import { NextRequest, NextResponse } from 'next/server';
import { generateCustomBeautyLook } from '@/lib/gemini/beauty-stylist';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, skinTone, weather, beautyProfile } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const customLook = await generateCustomBeautyLook({
      prompt: prompt.trim(),
      skinTone,
      weather,
      beautyProfile,
    });

    return NextResponse.json({
      success: true,
      customLook,
    });
  } catch (err: any) {
    console.error('[API Gemini Stylist Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate custom beauty look' },
      { status: 500 }
    );
  }
}
