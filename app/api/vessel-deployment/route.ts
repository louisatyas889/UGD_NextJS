import { NextResponse } from "next/server";
import { getSql } from "../../lib/db";

/**
 * Endpoint sinkronisasi data Vessel Deployment.
 * Menggabungkan data dari 3 tabel (sinkron dengan cargo admin + fitur karyawan):
 *   1. fleet_vessels       -> identitas kapal
 *   2. barang + transaksi  -> paket / negara asal-tujuan (tabel asli DB)
 *   3. fleet_personnel     -> anggota kru yang ditugaskan ke kapal
 *
 * PENTING: SEMUA kapal dikembalikan (termasuk yang belum punya paket/kru)
 * agar UI bisa menampilkan status kosong yang informatif. Paket/kru
 * di-match ke kapal dengan logika permisif: exact match, contains,
 * atau case-insensitive (kode_kendaraan <-> vessels.id, assigned_vessel <-> vessels.id).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getSql();

    // 0. Defensive schema: pastikan tabel & kolom yang dipakai ada
    //    (sinkron dengan seed/route.ts & admin-cargo.ts). IF NOT EXISTS
    //    => aman dipanggil berulang tanpa throw error.
    await sql`
      CREATE TABLE IF NOT EXISTS barang (
        id SERIAL PRIMARY KEY,
        no_resi VARCHAR(50),
        tanggal_kirim DATE,
        nama_pengirim VARCHAR(120),
        nama_penerima VARCHAR(120),
        no_telepon VARCHAR(30) DEFAULT '',
        negara_asal VARCHAR(120),
        negara_tujuan VARCHAR(120),
        nama_barang VARCHAR(120),
        jenis_barang VARCHAR(120) DEFAULT '',
        berat_barang_kg NUMERIC(12, 2) DEFAULT 0,
        moda_pengiriman VARCHAR(20) DEFAULT 'Laut',
        jenis_kendaraan VARCHAR(120) DEFAULT '',
        nama_kendaraan VARCHAR(120) DEFAULT '',
        kode_kendaraan VARCHAR(80) DEFAULT '',
        kapasitas_kendaraan_kg NUMERIC(12, 2) DEFAULT 0,
        status_kendaraan VARCHAR(40) DEFAULT 'Siap Jalan',
        jenis_pengiriman VARCHAR(20) DEFAULT 'Biasa',
        status_pengiriman VARCHAR(40) DEFAULT 'Diproses',
        status_barang VARCHAR(40) DEFAULT 'Siap Kirim',
        deskripsi TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE barang
      ADD COLUMN IF NOT EXISTS kode_kendaraan VARCHAR(80) DEFAULT '',
      ADD COLUMN IF NOT EXISTS nama_kendaraan VARCHAR(120) DEFAULT '',
      ADD COLUMN IF NOT EXISTS moda_pengiriman VARCHAR(20) DEFAULT 'Laut',
      ADD COLUMN IF NOT EXISTS negara_asal VARCHAR(120),
      ADD COLUMN IF NOT EXISTS negara_tujuan VARCHAR(120),
      ADD COLUMN IF NOT EXISTS nama_barang VARCHAR(120),
      ADD COLUMN IF NOT EXISTS jenis_barang VARCHAR(120) DEFAULT '',
      ADD COLUMN IF NOT EXISTS berat_barang_kg NUMERIC(12, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status_pengiriman VARCHAR(40) DEFAULT 'Diproses',
      ADD COLUMN IF NOT EXISTS nama_pengirim VARCHAR(120),
      ADD COLUMN IF NOT EXISTS nama_penerima VARCHAR(120),
      ADD COLUMN IF NOT EXISTS no_resi VARCHAR(50),
      ADD COLUMN IF NOT EXISTS tanggal_kirim DATE;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transaksi (
        id SERIAL PRIMARY KEY,
        barang_id INT,
        harga NUMERIC(12, 2) DEFAULT 0,
        status_transaksi VARCHAR(40) DEFAULT 'Belum Dibayar',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE transaksi
      ADD COLUMN IF NOT EXISTS barang_id INT,
      ADD COLUMN IF NOT EXISTS harga NUMERIC(12, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status_transaksi VARCHAR(40) DEFAULT 'Belum Dibayar';
    `;

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
      ADD COLUMN IF NOT EXISTS assigned_vessel VARCHAR(100);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS fleet_vessels (
        id VARCHAR(50) PRIMARY KEY,
        subtitle VARCHAR(80) NOT NULL DEFAULT '',
        destination VARCHAR(150) NOT NULL DEFAULT '',
        status VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
        status_color VARCHAR(20),
        eta VARCHAR(50),
        eta_color VARCHAR(20) DEFAULT '#e5e7eb',
        monitoring_icon VARCHAR(20) DEFAULT 'chart',
        progress_pct INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE fleet_vessels
      ADD COLUMN IF NOT EXISTS subtitle VARCHAR(80) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS progress_pct INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS speed VARCHAR(20) DEFAULT '0 knots',
      ADD COLUMN IF NOT EXISTS fuel VARCHAR(20) DEFAULT '100%',
      ADD COLUMN IF NOT EXISTS diag VARCHAR(50) DEFAULT 'NO ISSUES',
      ADD COLUMN IF NOT EXISTS signal VARCHAR(50) DEFAULT 'STRONG',
      ADD COLUMN IF NOT EXISTS weather VARCHAR(50) DEFAULT 'CLEAR',
      ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#22d3ee',
      ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'Bangka Belitung',
      ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION DEFAULT -2.1300,
      ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION DEFAULT 106.1200,
      ADD COLUMN IF NOT EXISTS route_id INTEGER,
      ADD COLUMN IF NOT EXISTS eta_color VARCHAR(20) DEFAULT '#e5e7eb',
      ADD COLUMN IF NOT EXISTS monitoring_icon VARCHAR(20) DEFAULT 'chart',
      ADD COLUMN IF NOT EXISTS status_color VARCHAR(20) DEFAULT '#22d3ee',
      ADD COLUMN IF NOT EXISTS eta VARCHAR(50),
      ADD COLUMN IF NOT EXISTS destination VARCHAR(150) DEFAULT '',
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'UNKNOWN';
    `;

    // 1. Ambil SEMUA kapal (master) - tidak ada filter
    const vesselsRaw = (await sql`
      SELECT
        id,
        subtitle,
        destination,
        status,
        status_color,
        eta,
        eta_color,
        monitoring_icon,
        progress_pct,
        speed,
        fuel,
        diag,
        signal,
        weather,
        color,
        region,
        current_lat,
        current_lng,
        route_id
      FROM fleet_vessels
      ORDER BY id ASC
    `) as unknown as Array<{
      id: string;
      subtitle: string | null;
      destination: string | null;
      status: string;
      status_color: string | null;
      eta: string | null;
      eta_color: string | null;
      monitoring_icon: string | null;
      progress_pct: number | null;
      speed: string | null;
      fuel: string | null;
      diag: string | null;
      signal: string | null;
      weather: string | null;
      color: string | null;
      region: string | null;
      current_lat: number | null;
      current_lng: number | null;
      route_id: number | null;
    }>;

    // 2. Ambil SEMUA paket kargo (tabel asli: barang + transaksi) - tidak
    //    filter kode_kendaraan agar bisa matching permisif. Paket tanpa
    //    kode_kendaraan tetap dikembalikan sebagai "unassigned".
    const cargoRaw = (await sql`
      SELECT
        b.id                      AS barang_id,
        b.no_resi                 AS tracking_number,
        b.nama_pengirim           AS sender_name,
        b.nama_penerima           AS recipient_name,
        b.negara_asal             AS origin_country,
        b.negara_tujuan           AS destination_country,
        b.nama_barang             AS item_name,
        b.jenis_barang            AS item_type,
        b.berat_barang_kg         AS item_weight_kg,
        b.kode_kendaraan          AS vehicle_code,
        b.nama_kendaraan          AS vehicle_name,
        b.status_pengiriman       AS shipment_status,
        b.tanggal_kirim           AS shipping_date,
        b.created_at              AS created_at,
        t.harga                   AS shipping_price,
        t.status_transaksi        AS transaction_status
      FROM barang b
      LEFT JOIN transaksi t ON t.barang_id = b.id
      WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
      ORDER BY b.created_at DESC NULLS LAST
    `) as unknown as Array<{
      barang_id: number;
      tracking_number: string;
      sender_name: string | null;
      recipient_name: string | null;
      origin_country: string | null;
      destination_country: string | null;
      item_name: string | null;
      item_type: string | null;
      item_weight_kg: number | string | null;
      vehicle_code: string | null;
      vehicle_name: string | null;
      shipment_status: string | null;
      shipping_date: string | null;
      created_at: string | null;
      shipping_price: number | string | null;
      transaction_status: string | null;
    }>;

    // 3. Ambil SEMUA kru (assigned_vessel boleh null/kosong)
    const crewRaw = (await sql`
      SELECT id, name, work_shift, job_title, start_hour, end_hour, working_hours, assigned_vessel
      FROM fleet_personnel
      ORDER BY name ASC
    `) as unknown as Array<{
      id: string;
      name: string;
      work_shift: string;
      job_title: string | null;
      start_hour: number;
      end_hour: number;
      working_hours: string | null;
      assigned_vessel: string | null;
    }>;

    // 4. Helper: matching permisif (case-insensitive, trim, contains both ways)
    const norm = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();
    const matchesVessel = (vehicleCode: string | null, vesselId: string): boolean => {
      const a = norm(vehicleCode);
      const b = norm(vesselId);
      if (!a || !b) return false;
      if (a === b) return true;
      // Bidirectional contains
      if (a.includes(b) || b.includes(a)) return true;
      return false;
    };

    // 5. Normalisasi angka (Postgres NUMERIC bisa balik sebagai string)
    const toNumber = (v: number | string | null | undefined): number => {
      if (v === null || v === undefined || v === "") return 0;
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) ? n : 0;
    };

    // 6. Build struktur data per kapal
    const vessels = vesselsRaw.map((v) => {
      // Paket yang dialokasikan ke kapal ini (matching permisif kode_kendaraan)
      const packages = cargoRaw
        .filter((c) => matchesVessel(c.vehicle_code, v.id))
        .map((c) => ({
          trackingNumber: c.tracking_number,
          senderName: c.sender_name ?? "-",
          recipientName: c.recipient_name ?? "-",
          originCountry: c.origin_country ?? "-",
          destinationCountry: c.destination_country ?? "-",
          itemName: c.item_name ?? "-",
          itemType: c.item_type ?? "-",
          weightKg: toNumber(c.item_weight_kg),
          shippingPrice: toNumber(c.shipping_price),
          status: c.shipment_status ?? "Diproses",
          vehicleName: c.vehicle_name ?? "-",
          transactionStatus: c.transaction_status ?? "-",
        }));

      // Kru yang ditugaskan ke kapal ini (matching permisif assigned_vessel)
      const crew = crewRaw
        .filter((p) => matchesVessel(p.assigned_vessel, v.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          jobTitle: p.job_title ?? "Crew",
          workShift: p.work_shift,
          startHour: p.start_hour,
          endHour: p.end_hour,
          workingHours: p.working_hours ?? `${p.start_hour}:00 - ${p.end_hour}:00`,
        }));

      // Negara yang dikunjungi = unique list dari paket (asal & tujuan)
      const visitedCountries = Array.from(
        new Set(
          packages
            .flatMap((p) => [p.originCountry, p.destinationCountry])
            .filter((x) => x && x !== "-")
        )
      );

      return {
        id: v.id,
        subtitle: v.subtitle ?? "",
        destination: v.destination ?? "UNKNOWN HUB",
        status: v.status,
        statusColor: v.status_color ?? "#22d3ee",
        eta: v.eta ?? "--",
        etaColor: v.eta_color ?? "#e5e7eb",
        monitoringIcon: v.monitoring_icon ?? "anchor",
        progressPct: v.progress_pct ?? 0,
        speed: v.speed ?? "0 knots",
        fuel: v.fuel ?? "100%",
        diag: v.diag ?? "NO ISSUES",
        signal: v.signal ?? "STRONG",
        weather: v.weather ?? "CLEAR",
        color: v.color ?? "#22d3ee",
        region: v.region ?? "—",
        currentLat: v.current_lat ?? null,
        currentLng: v.current_lng ?? null,
        routeId: v.route_id ?? null,
        packages,
        crew,
        visitedCountries,
        packageCount: packages.length,
        crewCount: crew.length,
      };
    });

    // 7. Diagnostics: unassigned packages & crew
    const unassignedPackages = cargoRaw.filter(
      (c) => !c.vehicle_code || c.vehicle_code.trim() === ""
    ).length;
    const unassignedCrew = crewRaw.filter(
      (p) => !p.assigned_vessel || p.assigned_vessel.trim() === ""
    ).length;

    console.log(
      `[vessel-deployment] vessels=${vessels.length} cargo=${cargoRaw.length} crew=${crewRaw.length} unassigned_pkg=${unassignedPackages} unassigned_crew=${unassignedCrew}`
    );

    return NextResponse.json({
      success: true,
      vessels,
      meta: {
        totalVessels: vesselsRaw.length,
        totalCargoRecords: cargoRaw.length,
        totalCrewRecords: crewRaw.length,
        unassignedPackages,
        unassignedCrew,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[/api/vessel-deployment] Error:", error);
    return NextResponse.json(
      {
        success: false,
        vessels: [],
        error: error?.message ?? "Database error",
      },
      { status: 200 }
    );
  }
}
