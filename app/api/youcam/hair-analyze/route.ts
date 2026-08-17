import { NextRequest, NextResponse } from 'next/server';
import { analyzeHairDiagnostics } from '@/lib/youcam/hair-analyzer';
import { generateHairCareRoutine } from '@/lib/hair-recommendation-engine';
import { extractYouCamCredentials } from '@/lib/youcam/request-credentials';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userImageUrl, userImageBase64, beautyProfile, weather } = body;
    const credentials = extractYouCamCredentials(req, body);

    let srcImage: Buffer | string = userImageUrl;
    if (userImageBase64) {
      srcImage = Buffer.from(userImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    if (!srcImage) {
      return NextResponse.json({ error: 'Missing image input for hair analysis' }, { status: 400 });
    }

    const hairProfile = await analyzeHairDiagnostics(srcImage, weather, credentials);
    const routine = generateHairCareRoutine(hairProfile, beautyProfile, weather);

    return NextResponse.json({
      success: true,
      hairProfile,
      routine,
    });
  } catch (err: any) {
    console.error('API Error in hair-analyze:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze hair' }, { status: 500 });
  }
}
