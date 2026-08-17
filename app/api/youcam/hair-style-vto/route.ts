import { NextRequest, NextResponse } from 'next/server';
import { applyHairStyleVTO } from '@/lib/youcam/hair-style-vto';
import { extractYouCamCredentials } from '@/lib/youcam/request-credentials';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userImageUrl, userImageBase64, templateId } = body;
    const credentials = extractYouCamCredentials(req, body);

    let srcImage: Buffer | string = userImageUrl;
    if (userImageBase64) {
      srcImage = Buffer.from(userImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    if (!srcImage) {
      return NextResponse.json({ error: 'Missing image input for hair style VTO' }, { status: 400 });
    }

    const result = await applyHairStyleVTO(srcImage, templateId || 'female_blunt_bob', credentials);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API Error in hair-style-vto:', err);
    return NextResponse.json({ error: err.message || 'Failed to apply hair style' }, { status: 500 });
  }
}
