import { NextRequest, NextResponse } from 'next/server';
import { simulateSkinOutcome } from '@/lib/youcam/skin-simulation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userImageUrl, userImageBase64, skinAnalysis } = body;

    let srcImage: Buffer | string = userImageUrl;
    if (userImageBase64) {
      srcImage = Buffer.from(userImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    if (!srcImage) {
      return NextResponse.json({ error: 'Missing image input for skin simulation' }, { status: 400 });
    }

    const defaultSkin = skinAnalysis || {
      overallScore: 80,
      skinType: 'combination',
      concerns: {
        redness: { score: 65, severity: 'moderate' },
        acne: { score: 70, severity: 'moderate' },
        pore: { score: 72, severity: 'moderate' },
        texture: { score: 75, severity: 'moderate' },
      },
    };

    const result = await simulateSkinOutcome(srcImage, defaultSkin);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API Error in skin-simulation:', err);
    return NextResponse.json({ error: err.message || 'Failed to simulate skin' }, { status: 500 });
  }
}
