import { NextRequest, NextResponse } from 'next/server';
import { getClosetItems, upsertClosetItem, ClosetItem } from '@/lib/supabase';
import { classifyApparelFromPhotoAndText } from '@/lib/apparel-analyzer';

export async function GET() {
  try {
    const items = await getClosetItems();
    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch closet items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, is_owned, textDescription, photoBase64, image_url, brand, category, name, metadata } = body;

    // Case 1: Adding a new apparel item from photo + text description
    if (action === 'create' || (textDescription && (photoBase64 || image_url))) {
      const finalImage = photoBase64 || image_url;
      if (!finalImage) {
        return NextResponse.json({ error: 'A photo or image URL is required.' }, { status: 400 });
      }

      // Auto-classify using YouCam standards & optical/NLP analysis
      const classification = await classifyApparelFromPhotoAndText({
        textDescription: textDescription || name || 'Custom Fashion Item',
        photoBase64: photoBase64 || undefined,
        brand: brand || undefined,
      });

      const newItem = await upsertClosetItem({
        category: category || classification.category,
        name: name || classification.name,
        brand: brand || classification.brand,
        image_url: finalImage,
        is_owned: true,
        metadata: metadata || classification.metadata,
      });

      return NextResponse.json({
        success: true,
        item: newItem,
        classification,
        message: 'Successfully added to your wardrobe!',
      });
    }

    // Case 2: Toggling or updating an existing item
    if (id) {
      const items = await getClosetItems();
      const existing = items.find((i) => i.id === id);

      if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const updated = await upsertClosetItem({
        ...existing,
        is_owned: is_owned !== undefined ? is_owned : !existing.is_owned,
      });

      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  } catch (err: any) {
    console.error('[Closet API Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to process wardrobe action' }, { status: 500 });
  }
}
