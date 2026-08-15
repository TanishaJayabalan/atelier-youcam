import { NextRequest, NextResponse } from 'next/server';
import { getClosetItems, upsertClosetItem } from '@/lib/supabase';

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
    const { id, is_owned } = body;

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update item' }, { status: 500 });
  }
}
