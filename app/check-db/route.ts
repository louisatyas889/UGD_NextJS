import { NextResponse } from 'next/server';
import { getSql } from '../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();

    const columns = await sql`
      SELECT table_name, column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND character_maximum_length = 10;
    `;

    return NextResponse.json({ columns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
