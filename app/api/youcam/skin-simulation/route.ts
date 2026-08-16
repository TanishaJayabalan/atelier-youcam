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

    if (!skinAnalysis || !skinAnalysis.concerns) {
      return NextResponse.json({ error: 'Valid skin analysis results are required for simulation' }, { status: 400 });
    }

    const result = await simulateSkinOutcome(srcImage, skinAnalysis);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API Error in skin-simulation:', err);
    return NextResponse.json({ error: err.message || 'Failed to simulate skin outcome' }, { status: 500 });
  }
}
