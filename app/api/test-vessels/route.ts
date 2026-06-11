import { NextResponse } from 'next/server';
import { fetchVesselData } from '@/app/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const vessels = await fetchVesselData();
    return NextResponse.json({ 
      count: vessels.length,
      vessels 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
