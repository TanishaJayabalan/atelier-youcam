import { NextRequest, NextResponse } from 'next/server';
import { transferMakeupLook } from '@/lib/youcam/makeup-transfer';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const userImageFile = formData.get('userImage') as File | null;
      const refImageFile = formData.get('refImage') as File | null;
      const refImageUrl = formData.get('refImageUrl') as string | null;
      const userImageUrl = formData.get('userImageUrl') as string | null;

      let srcImage: Buffer | string;
      if (userImageFile && typeof userImageFile.arrayBuffer === 'function') {
        const bytes = await userImageFile.arrayBuffer();
        srcImage = Buffer.from(bytes);
      } else if (userImageUrl) {
        srcImage = userImageUrl;
      } else {
        return NextResponse.json({ error: 'Missing user image' }, { status: 400 });
      }

      let refImage: Buffer | string;
      if (refImageFile && typeof refImageFile.arrayBuffer === 'function') {
        const bytes = await refImageFile.arrayBuffer();
        refImage = Buffer.from(bytes);
      } else if (refImageUrl) {
        refImage = refImageUrl;
      } else {
        return NextResponse.json({ error: 'Missing reference look photo' }, { status: 400 });
      }

      const result = await transferMakeupLook({ srcImage, refImage });
      return NextResponse.json({ success: true, ...result });
    }

    const body = await req.json();
    const { userImageUrl, refImageUrl, userImageBase64, refImageBase64 } = body;

    let srcImage: Buffer | string = userImageUrl;
    if (userImageBase64) {
      srcImage = Buffer.from(userImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    let refImage: Buffer | string = refImageUrl;
    if (refImageBase64) {
      refImage = Buffer.from(refImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    if (!srcImage || !refImage) {
      return NextResponse.json({ error: 'Missing user image or reference look' }, { status: 400 });
    }

    const result = await transferMakeupLook({ srcImage, refImage });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API Error in makeup-transfer:', err);
    return NextResponse.json({ error: err.message || 'Failed to transfer makeup' }, { status: 500 });
  }
}
