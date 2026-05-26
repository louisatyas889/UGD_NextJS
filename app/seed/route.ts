import { NextResponse } from 'next/server';
// Mengambil data dummy dari file placeholder-data Anda
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

    // 2. Buat dan isi Tabel Kapal (Vessels)
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE fleet_vessels
      ADD COLUMN IF NOT EXISTS subtitle VARCHAR(80) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS progress_pct INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `;
    await sql`TRUNCATE TABLE fleet_vessels CASCADE;`;
    for (const v of vessels4) {
      await sql`
        INSERT INTO fleet_vessels (
          id, subtitle, destination, status, status_color, eta, eta_color, monitoring_icon, progress_pct
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
          ${v.pct}
        );
      `;
    }

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
          id,
          name,
          work_shift,
          job_title,
          start_hour,
          end_hour,
          working_hours,
          assigned_vessel
        )
        VALUES (
          ${person.id},
          ${person.name},
          ${person.workShift},
          ${person.jobTitle},
          ${person.startHour},
          ${person.endHour},
          ${person.workingHours},
          ${person.assignedVessel}
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

    return NextResponse.json({ message: 'Database Neon berhasil diisi dengan data dummy!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
