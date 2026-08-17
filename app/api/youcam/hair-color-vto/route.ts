import { NextRequest, NextResponse } from 'next/server';
import { applyHairColorVTO } from '@/lib/youcam/hair-color-vto';
import { extractYouCamCredentials } from '@/lib/youcam/request-credentials';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userImageUrl, userImageBase64, colorId } = body;
    const credentials = extractYouCamCredentials(req, body);

    let srcImage: Buffer | string = userImageUrl;
    if (userImageBase64) {
      srcImage = Buffer.from(userImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    if (!srcImage) {
      return NextResponse.json({ error: 'Missing image input for hair color VTO' }, { status: 400 });
    }

    const result = await applyHairColorVTO(srcImage, colorId || 'color_caramel_balayage', credentials);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API Error in hair-color-vto:', err);
    return NextResponse.json({ error: err.message || 'Failed to apply hair color' }, { status: 500 });
  }
}
