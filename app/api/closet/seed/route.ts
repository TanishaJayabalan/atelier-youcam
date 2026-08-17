import { NextResponse } from 'next/server';
import { seedDatabase } from '@/scripts/seed';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.count} items into the wardrobe database.`,
      count: result.count,
    });
  } catch (err: any) {
    console.error('[Closet Seed Route Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to seed wardrobe database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
