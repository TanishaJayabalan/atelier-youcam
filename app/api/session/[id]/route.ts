import { NextRequest, NextResponse } from 'next/server';
import { getLookSession } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await getLookSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve session' }, { status: 500 });
  }
}
