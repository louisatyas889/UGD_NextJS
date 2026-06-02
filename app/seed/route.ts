import { NextResponse } from 'next/server';
import { users, dummyAdmins, vessels4, fleetPersonnel, TrakingPackages } from '../lib/placeholder-data';
import { getSql } from '../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();

    // 1. Buat dan isi Tabel Users/Admins
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id VARCHAR(50) PRIMARY KEY,
        key VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'STANDARD',
        status VARCHAR(20) DEFAULT 'Active',
        avatar VARCHAR(5) DEFAULT 'U'
      );
    `;

    await sql`TRUNCATE TABLE app_users CASCADE;`;

    for (const u of users) {
      await sql`INSERT INTO app_users (id, key, name, role, status, avatar) VALUES (${u.id}, ${u.key}, ${u.name}, 'STANDARD', 'Active', 'U');`;
    }
    for (const a of dummyAdmins) {
      await sql`INSERT INTO app_users (id, key, name, role, status, avatar) VALUES (${a.id}, ${a.key}, ${a.name}, ${a.role}, ${a.status}, ${a.avatar});`;
    }
    await sql`INSERT INTO app_users (id, key, name, role, status, avatar) VALUES ('customer-01', 'CUST-1234', 'Customer Akun', 'STANDARD', 'Active', 'C');`;

    // NEW: 1.5. Buat dan isi Tabel Master Rute (vessel_routes)
    await sql`
      CREATE TABLE IF NOT EXISTS vessel_routes (
        id SERIAL PRIMARY KEY,
        asal VARCHAR(100) DEFAULT 'Bangka Belitung',
        negara_tujuan VARCHAR(100) NOT NULL,
        nomor_rute INTEGER CHECK (nomor_rute IN (1, 2, 3)),
        status_rute VARCHAR(50) DEFAULT 'safe',
        jalur_koordinat JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`TRUNCATE TABLE vessel_routes CASCADE;`;

    // Pengisian 3 alternatif rute untuk masing-masing 7 negara tujuan dari Bangka Belitung
    await sql`
      INSERT INTO vessel_routes (negara_tujuan, nomor_rute, status_rute, jalur_koordinat) VALUES
      ('Singapura', 1, 'safe', '[[-2.13, 106.12], [-0.5, 105.2], [1.13, 103.83]]'),
      ('Singapura', 2, 'congested', '[[-2.13, 106.12], [-0.8, 104.5], [1.10, 103.75]]'),
      ('Singapura', 3, 'safe', '[[-2.13, 106.12], [-0.2, 105.8], [1.15, 103.90]]'),

      ('Malaysia', 1, 'safe', '[[-2.13, 106.12], [1.13, 103.83], [2.2, 102.2], [3.0, 101.39]]'),
      ('Malaysia', 2, 'safe', '[[-2.13, 106.12], [0.5, 103.5], [1.8, 101.9], [3.0, 101.39]]'),
      ('Malaysia', 3, 'weather_alert', '[[-2.13, 106.12], [1.5, 104.8], [2.8, 103.2], [3.0, 101.39]]'),

      ('Thailand', 1, 'safe', '[[-2.13, 106.12], [2.0, 105.0], [6.0, 102.5], [10.0, 100.5], [13.09, 100.90]]'),
      ('Thailand', 2, 'safe', '[[-2.13, 106.12], [3.5, 107.0], [7.5, 104.0], [11.2, 101.5], [13.09, 100.90]]'),
      ('Thailand', 3, 'safe', '[[-2.13, 106.12], [1.13, 103.83], [4.0, 100.0], [8.0, 98.5], [13.09, 100.90]]'),

      ('Filipina', 1, 'safe', '[[-2.13, 106.12], [4.0, 112.0], [9.0, 117.0], [14.59, 120.98]]'),
      ('Filipina', 2, 'safe', '[[-2.13, 106.12], [2.5, 109.5], [7.0, 114.2], [12.0, 120.0], [14.59, 120.98]]'),
      ('Filipina', 3, 'blocked', '[[-2.13, 106.12], [5.5, 115.0], [10.2, 122.0], [14.59, 120.98]]'),

      ('China', 1, 'safe', '[[-2.13, 106.12], [5.0, 110.0], [12.0, 113.0], [22.31, 114.16]]'),
      ('China', 2, 'safe', '[[-2.13, 106.12], [3.0, 108.0], [15.0, 116.0], [22.31, 114.16]]'),
      ('China', 3, 'weather_alert', '[[-2.13, 106.12], [6.0, 115.0], [16.0, 119.0], [22.31, 114.16]]'),

      ('Jepang', 1, 'safe', '[[-2.13, 106.12], [10.0, 120.0], [20.0, 125.0], [30.0, 135.0], [35.67, 139.65]]'),
      ('Jepang', 2, 'safe', '[[-2.13, 106.12], [5.0, 115.0], [18.0, 130.0], [28.0, 130.0], [35.67, 139.65]]'),
      ('Jepang', 3, 'safe', '[[-2.13, 106.12], [15.0, 118.0], [25.0, 122.0], [32.0, 128.0], [35.67, 139.65]]'),

      ('Korea Selatan', 1, 'safe', '[[-2.13, 106.12], [12.0, 115.0], [24.0, 121.0], [31.0, 125.0], [35.17, 129.07]]'),
      ('Korea Selatan', 2, 'safe', '[[-2.13, 106.12], [8.0, 112.0], [22.0, 119.0], [33.0, 127.0], [35.17, 129.07]]'),
      ('Korea Selatan', 3, 'safe', '[[-2.13, 106.12], [4.0, 118.0], [18.0, 124.0], [29.0, 124.0], [35.17, 129.07]]');
    `;

    // 2. Buat dan isi Tabel Kapal (Vessels) - UPDATE: Tambah field pendukung peta interaktif
    await sql`
      CREATE TABLE IF NOT EXISTS fleet_vessels (
        id VARCHAR(50) PRIMARY KEY,
        subtitle VARCHAR(80) NOT NULL DEFAULT '',
        destination VARCHAR(150) NOT NULL,
        status VARCHAR(50) NOT NULL,
        status_color VARCHAR(20),
        eta VARCHAR(50),
        eta_color VARCHAR(20),
        monitoring_icon VARCHAR(20),
        progress_pct INTEGER NOT NULL DEFAULT 0,
        
        -- Kolom Tambahan Sinkronisasi Telemetri UI Map Anda
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

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    // Melakukan alter penambahan kolom baru jika tabel sudah terlanjur ada di database Neon Anda
    await sql`
      ALTER TABLE fleet_vessels
      ADD COLUMN IF NOT EXISTS subtitle VARCHAR(80) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS progress_pct INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS speed VARCHAR(20) DEFAULT '22 knots',
      ADD COLUMN IF NOT EXISTS fuel VARCHAR(20) DEFAULT '85%',
      ADD COLUMN IF NOT EXISTS diag VARCHAR(50) DEFAULT 'NO ISSUES',
      ADD COLUMN IF NOT EXISTS signal VARCHAR(50) DEFAULT 'STRONG',
      ADD COLUMN IF NOT EXISTS weather VARCHAR(50) DEFAULT 'CLEAR',
      ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#22d3ee',
      ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'Bangka Belitung',
      ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION DEFAULT -2.1300,
      ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION DEFAULT 106.1200,
      ADD COLUMN IF NOT EXISTS route_id INTEGER,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `;

    await sql`TRUNCATE TABLE fleet_vessels CASCADE;`;

    for (const v of vessels4) {
      // Menghasilkan koordinat awal default (Bangka Belitung) untuk posisi awal live-map kapal
      await sql`
        INSERT INTO fleet_vessels (
          id, subtitle, destination, status, status_color, eta, eta_color, monitoring_icon, progress_pct,
          speed, fuel, diag, signal, weather, color, region, current_lat, current_lng
        )
        VALUES (
          ${v.id},
          ${v.sub},
          ${v.dest},
          ${v.status},
          ${"#22d3ee"},
          ${"etaValue"},
          ${"#e5e7eb"},
          ${"chart"},
          ${v.pct},
          '24.5 knots',    -- Contoh data dummy telemetri map
          '82%',
          'NO ISSUES',
          'MAX SIGNAL',
          'FAVORABLE',
          '#22d3ee',      -- Hex warna default marker berpendar di peta
          ${v.dest},       -- Menyinkronkan region dengan destinasi tujuan
          -2.1300,         -- Titik Awal Bujur Bangka Belitung
          106.1200         -- Titik Awal Lintang Bangka Belitung
        );
      `;
    }

    // OTOMATISASI LINKING: Menyambungkan route_id kapal secara otomatis ke Rute Nomor 1 berdasarkan kesamaan nama negara tujuan
    await sql`
      UPDATE fleet_vessels f
      SET route_id = r.id
      FROM vessel_routes r
      WHERE LOWER(f.destination) = LOWER(r.negara_tujuan) AND r.nomor_rute = 1;
    `;

    // 3. Buat dan isi Tabel Personel (Fleet Personnel)
    await sql`
      CREATE TABLE IF NOT EXISTS fleet_personnel (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        work_shift VARCHAR(20),
        job_title VARCHAR(100),
        start_hour INTEGER,
        end_hour INTEGER,
        working_hours VARCHAR(20),
        assigned_vessel VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE fleet_personnel
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS work_shift VARCHAR(20),
      ADD COLUMN IF NOT EXISTS job_title VARCHAR(100),
      ADD COLUMN IF NOT EXISTS start_hour INTEGER,
      ADD COLUMN IF NOT EXISTS end_hour INTEGER,
      ADD COLUMN IF NOT EXISTS working_hours VARCHAR(20),
      ADD COLUMN IF NOT EXISTS assigned_vessel VARCHAR(100),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `;

    await sql`TRUNCATE TABLE fleet_personnel CASCADE;`;
    for (const person of fleetPersonnel) {
      await sql`
        INSERT INTO fleet_personnel (
          id, name, work_shift, job_title, start_hour, end_hour, working_hours, assigned_vessel
        )
        VALUES (
          ${person.id}, ${person.name}, ${person.workShift}, ${person.jobTitle}, ${person.startHour}, ${person.endHour}, ${person.workingHours}, ${person.assignedVessel}
        );
      `;
    }

    // 4. Buat dan isi Tabel Tracking Cargo
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_packages (
        id VARCHAR(50) PRIMARY KEY,
        package_size VARCHAR(20),
        destination VARCHAR(100),
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        vessel_name VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE tracking_packages
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `;
    await sql`TRUNCATE TABLE tracking_packages CASCADE;`;
    for (const tp of TrakingPackages) {
      await sql`INSERT INTO tracking_packages (id, package_size, destination, lat, lng, vessel_name) VALUES (${tp.id}, ${tp.size}, ${tp.dest}, ${tp.lat}, ${tp.lng}, ${tp.vesselName});`;
    }

    // 5. Buat dan isi Tabel Security Logs
    await sql`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        actor VARCHAR(120) NOT NULL,
        location VARCHAR(120) NOT NULL,
        severity VARCHAR(40) NOT NULL,
        message TEXT NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#22d3ee',
        log_time VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`TRUNCATE TABLE security_logs RESTART IDENTITY;`;
    await sql`
      INSERT INTO security_logs (actor, location, severity, message, color, log_time)
      VALUES
        ('Captain Elias Thorne', 'BRIDGE', 'ROOT', 'Root access granted to primary command console.', '#22c55e', '14:22:01'),
        ('Unknown Source', 'REMOTE NODE', 'ALERT', 'Failed login attempt from IP 104.22.1.9.', '#f87171', '12:15:44'),
        ('Sarah Jenkins', 'ENGINE ROOM', 'SECURE', 'Engine room diagnostics package synchronized.', '#22d3ee', '11:48:19')
    `;

    return NextResponse.json({ message: 'Database Neon berhasil diisi dengan master rute internasional dan data dummy telemetri map!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
