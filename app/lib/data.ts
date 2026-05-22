import postgres from 'postgres';
import { formatCurrency } from './utils';

// Menggunakan POSTGRES_URL sesuai koneksi file .env kamu
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// =========================================================================
// 1. FETCH DATA GRAFIK (revenue)
// =========================================================================
export async function fetchRevenue() {
  try {
    const data = await sql`SELECT * FROM revenue`;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return []; // Supaya dashboard tidak blank kalau tabel revenue kosong
  }
}

// =========================================================================
// 2. FETCH LATEST ALERTS (Membaca tabel fleet_alerts - AMAN, SUDAH ADA DI NEON)
// =========================================================================
export async function fetchLatestInvoices() {
  try {
    // Mengambil data notifikasi cuaca/mesin dari tabel fleet_alerts (Sesuai image_fda77f.png)
    const data = await sql`
      SELECT id, type, title_color, log_time, body 
      FROM fleet_alerts
      ORDER BY id DESC
      LIMIT 5`;

    const latestAlerts = data.map((alert) => ({
      id: alert.id,
      name: alert.type,           // Contoh: WEATHER WARNING
      email: alert.log_time,      // Contoh: 10:45 UTC
      amount: alert.body ? alert.body.substring(0, 30) + '...' : 'No description', // Mengambil potongan teks body
      image_url: '/customers/amy-burns.png', 
    }));

    return latestAlerts;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest fleet alerts.');
  }
}

// =========================================================================
// 3. FETCH COUNTER CARD (Menghitung total baris armada)
// =========================================================================
export async function fetchCardData() {
  try {
    const vesselCountPromise = sql`SELECT COUNT(*) FROM fleet_vessels`;
    const personnelCountPromise = sql`SELECT COUNT(*) FROM fleet_personnel`;
    const alertCountPromise = sql`SELECT COUNT(*) FROM fleet_alerts`;

    const data = await Promise.all([
      vesselCountPromise,
      personnelCountPromise,
      alertCountPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');      // Total Kapal
    const numberOfCustomers = Number(data[1][0].count ?? '0');     // Total Personel
    const totalPaidInvoices = `${data[2][0].count ?? '0'} Alerts`; // Jumlah Alert aktif
    const totalPendingInvoices = 'Operational';

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch fleet card data.');
  }
}

// =========================================================================
// 4. FETCH DATA TABEL PERSONEL (Disesuaikan dengan kolom asli di image_fd3a66.png)
// =========================================================================
const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // HANYA mengambil kolom yang terbukti ada di Neon Console kamu: id, name, work_shift, job_title
    const personnel = await sql`
      SELECT
        id,
        name,
        work_shift,
        job_title
      FROM fleet_personnel
      WHERE
        name ILIKE ${`%${query}%`} OR
        job_title ILIKE ${`%${query}%`} OR
        work_shift ILIKE ${`%${query}%`}
      ORDER BY id ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return personnel.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.job_title,          // Jabatan masuk ke kolom email
      amount: 'Hadir',             // Karena working_hours tidak ada, kita hardcode status kehadirannya
      date: 'Serena Sail',         // Hardcode nama armada sementara
      status: p.work_shift,        // Shift (Day/Night) masuk ke badge status
      image_url: '/customers/balazs-orban.png',
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch fleet personnel table data.');
  }
}

// =========================================================================
// 5. FETCH TOTAL HALAMAN PAGINATION TABEL PERSONEL
// =========================================================================
export async function fetchInvoicesPages(query: string) {
  try {
    const data = await sql`
      SELECT COUNT(*)
      FROM fleet_personnel
      WHERE
        name ILIKE ${`%${query}%`} OR
        job_title ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of fleet personnel rows.');
  }
}

// =========================================================================
// 6. FETCH DETAIL KRU BY ID
// =========================================================================
export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql`
      SELECT id, name, work_shift, job_title
      FROM fleet_personnel
      WHERE id = ${id};
    `;

    if (data.length === 0) return null;

    const p = data[0];
    return {
      id: p.id,
      customer_id: p.name,
      amount: 8, // Default jam kerja tiruan agar form tidak error
      status: p.work_shift,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch personnel information.');
  }
}

// =========================================================================
// 7. FETCH KOORDINAT PETA (Membaca tracking_packages - Sesuai image_fdae8d.png)
// =========================================================================
export async function fetchCustomers() {
  try {
    const locations = await sql`
      SELECT
        id,
        package_size AS size,
        destination AS dest,
        lat,
        lng
      FROM tracking_packages
      ORDER BY id ASC
    `;
    return locations as any;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch global container tracking coordinates.');
  }
}

// Helper dropdown select
export async function fetchFilteredCustomers(query: string) {
  try {
    const vessels = await sql`SELECT id, destination, status FROM fleet_vessels`;
    return vessels.map((v) => ({
      id: v.id,
      name: v.destination,
      email: v.status,
      image_url: '/customers/evil-rabbit.png',
      total_invoices: 1,
      total_pending: 'Active',
      total_paid: 'Operational',
    }));
  } catch (err) {
    console.error('Database Error:', err);
    return [];
  }
}
