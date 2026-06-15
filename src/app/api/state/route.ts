import { NextResponse } from 'next/server';
import { getPublicState } from '@/lib/serverStore';

// Always run at request time and never cache — scores change live.
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await getPublicState();
  return NextResponse.json(state, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
