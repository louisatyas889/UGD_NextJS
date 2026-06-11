import { NextResponse } from 'next/server';
import { getSql } from '../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();

    // 1. Drop dan buat ulang tabel vessel_routes
    await sql`DROP TABLE IF EXISTS vessel_routes CASCADE;`;
    
    await sql`
      CREATE TABLE vessel_routes (
        id SERIAL PRIMARY KEY,
        asal VARCHAR(100) DEFAULT 'Bangka Belitung',
        negara_tujuan VARCHAR(100) NOT NULL,
        nomor_rute INTEGER CHECK (nomor_rute IN (1, 2, 3)),
        status_rute VARCHAR(50) DEFAULT 'safe',
        jalur_koordinat JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`TRUNCATE TABLE vessel_routes RESTART IDENTITY CASCADE;`;

    await sql`
      INSERT INTO vessel_routes (negara_tujuan, nomor_rute, status_rute, jalur_koordinat) VALUES
      ('Singapura', 1, 'safe', '[[-2.13, 106.12], [-0.5, 105.2], [1.13, 103.83]]'),
      ('Malaysia', 1, 'safe', '[[-2.13, 106.12], [1.13, 103.83], [2.2, 102.2], [3.0, 101.39]]'),
      ('Thailand', 1, 'safe', '[[-2.13, 106.12], [2.0, 105.0], [6.0, 102.5], [10.0, 100.5], [13.09, 100.90]]'),
      ('Filipina', 1, 'safe', '[[-2.13, 106.12], [4.0, 112.0], [9.0, 117.0], [14.59, 120.98]]'),
      ('China', 1, 'safe', '[[-2.13, 106.12], [5.0, 110.0], [12.0, 113.0], [22.31, 114.16]]'),
      ('Jepang', 1, 'safe', '[[-2.13, 106.12], [10.0, 120.0], [20.0, 125.0], [30.0, 135.0], [35.67, 139.65]]'),
      ('Korea Selatan', 1, 'safe', '[[-2.13, 106.12], [12.0, 115.0], [24.0, 121.0], [31.0, 125.0], [35.17, 129.07]]');
    `;

    // 2. Buat tabel fleet_vessels
    await sql`
      CREATE TABLE IF NOT EXISTS fleet_vessels (
        id VARCHAR(50) PRIMARY KEY,
        subtitle VARCHAR(80) DEFAULT '',
        destination VARCHAR(150) NOT NULL,
        status VARCHAR(50) NOT NULL,
        status_color VARCHAR(20),
        eta VARCHAR(50),
        eta_color VARCHAR(20),
        monitoring_icon VARCHAR(20),
        progress_pct INTEGER DEFAULT 0,
        speed VARCHAR(20) DEFAULT '0 knots',
        fuel VARCHAR(20) DEFAULT '100%',
        diag VARCHAR(50) DEFAULT 'NO ISSUES',
        signal VARCHAR(50) DEFAULT 'STRONG',
        weather VARCHAR(50) DEFAULT 'CLEAR',
        color VARCHAR(20) DEFAULT '#22d3ee',
        region VARCHAR(50) DEFAULT 'Bangka Belitung',
        current_lat DOUBLE PRECISION DEFAULT -2.1300,
        current_lng DOUBLE PRECISION DEFAULT 106.1200,
        route_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`TRUNCATE TABLE fleet_vessels CASCADE;`;

    // 3. Insert data vessels
    const vessels = [
      { id: 'PL-0909-MERKURIUS', sub: 'KM Merkurius', dest: 'Singapura', status: 'EN ROUTE', pct: 78 },
      { id: 'PL-123-BULAN', sub: 'KM Bulan', dest: 'Malaysia', status: 'IN PORT', pct: 45 },
      { id: 'PL-230-NANA', sub: 'KM Nana', dest: 'Thailand', status: 'EN ROUTE', pct: 65 },
      { id: 'PL-234-NARS', sub: 'KM Nars', dest: 'Filipina', status: 'DELAYED', pct: 30 },
      { id: 'PL-245-MARS', sub: 'KM Mars', dest: 'China', status: 'MAINTENANCE', pct: 12 },
    ];

    for (const v of vessels) {
      await sql`
        INSERT INTO fleet_vessels (
          id, subtitle, destination, status, progress_pct, eta
        ) VALUES (
          ${v.id}, ${v.sub}, ${v.dest}, ${v.status}, ${v.pct}, '2 Days'
        );
      `;
    }

    // 4. Link routes
    await sql`
      UPDATE fleet_vessels f
      SET route_id = r.id
      FROM vessel_routes r
      WHERE LOWER(f.destination) = LOWER(r.negara_tujuan) AND r.nomor_rute = 1;
    `;

    return NextResponse.json({ 
      message: 'Database seeded successfully!',
      vessels: vessels.length
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message, detail: error.detail || '' }, { status: 500 });
  }
}
