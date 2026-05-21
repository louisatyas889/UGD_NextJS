import postgres from 'postgres';
import { NextResponse } from 'next/server';
// Mengambil data dummy dari file placeholder-data Anda
import { users, dummyAdmins, vessels, alerts, fleetPersonnel, TrakingPackages } from '../lib/placeholder-data';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL belum diset di file .env!' }, { status: 500 });
  }

  // Menginisialisasi koneksi Postgres menggunakan connection string dari .env
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
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
        destination VARCHAR(150) NOT NULL,
        status VARCHAR(50) NOT NULL,
        status_color VARCHAR(20),
        eta VARCHAR(50),
        eta_color VARCHAR(20),
        monitoring_icon VARCHAR(20)
      );
    `;
    await sql`TRUNCATE TABLE fleet_vessels CASCADE;`;
    for (const v of vessels) {
      await sql`INSERT INTO fleet_vessels (id, destination, status, status_color, eta, eta_color, monitoring_icon) VALUES (${v.id}, ${v.dest}, ${v.status}, ${v.statusColor}, ${v.eta}, ${v.etaColor}, ${v.mon});`;
    }

    // 3. Buat dan isi Tabel Peringatan (Alerts)
    await sql`
      CREATE TABLE IF NOT EXISTS fleet_alerts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title_color VARCHAR(20),
        log_time VARCHAR(20),
        body TEXT NOT NULL
      );
    `;
    await sql`TRUNCATE TABLE fleet_alerts CASCADE;`;
    for (const al of alerts) {
      await sql`INSERT INTO fleet_alerts (type, title_color, log_time, body) VALUES (${al.type}, ${al.tc}, ${al.time}, ${al.body});`;
    }

    // 4. Buat dan isi Tabel Personel (Fleet Personnel)
    await sql`
      CREATE TABLE IF NOT EXISTS fleet_personnel (
        id VARCHAR(50) PRIMARY KEY,
        package_size VARCHAR(20),
        destination VARCHAR(100),
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        vessel_name VARCHAR(100)
      );
    `;
    await sql`TRUNCATE TABLE fleet_personnel CASCADE;`;

    for (const tp of TrakingPackages) {
      await sql`INSERT INTO tracking_packages (id, package_size, destination, lat, lng, vessel_name) 
        VALUES (${tp.id}, ${tp.size}, ${tp.dest}, ${tp.lat}, ${tp.lng}, ${tp.vesselName});`;
}

    // 5. Buat dan isi Tabel Tracking Cargo
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_packages (
        id VARCHAR(50) PRIMARY KEY,
        package_size VARCHAR(20),
        destination VARCHAR(100),
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        vessel_name VARCHAR(100)
      );
    `;
    await sql`TRUNCATE TABLE tracking_packages CASCADE;`;
    for (const tp of TrakingPackages) {
      await sql`INSERT INTO tracking_packages (id, package_size, destination, lat, lng, vessel_name) VALUES (${tp.id}, ${tp.size}, ${tp.dest}, ${tp.lat}, ${tp.lng}, ${tp.vesselName});`;
    }

    return NextResponse.json({ message: 'Database Neon berhasil diisi dengan data dummy!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
