import { NextResponse } from 'next/server';
import { getSql } from '@/app/lib/db';

export async function GET() {
  try {
    const sql = getSql();
    
    // Check if table exists and get column info
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'app_users' 
      ORDER BY ordinal_position
    `;
    
    // Get all users
    const users = await sql`SELECT * FROM app_users ORDER BY id`;
    
    return NextResponse.json({
      tableExists: tableInfo.length > 0,
      columns: tableInfo,
      userCount: users.length,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        key: user.key,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}