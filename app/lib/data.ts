import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// Menggunakan POSTGRES_URL sesuai koneksi file .env
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// =========================================================================
// 1. FETCH DATA GRAFIK (revenue)
// =========================================================================
export async function fetchRevenue() {
  try {
    const data = await sql<Revenue[]>`SELECT * FROM revenue`;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return [] as Revenue[]; 
  }
}

// =========================================================================
// 2. FETCH LATEST ALERTS (Kamuflase komponen LatestInvoices bawaan)
// =========================================================================
export async function fetchLatestInvoices() {
  try {
    const data = await sql`
      SELECT id, type, title_color, log_time, body 
      FROM fleet_alerts
      ORDER BY id DESC
      LIMIT 5`;

    const latestAlerts = data.map((alert) => ({
      id: alert.id.toString(),
      name: alert.type || 'Unknown', 
      email: alert.log_time || 'No time', 
      amount: alert.body ? alert.body.substring(0, 20) + '...' : 'No description',
      image_url: '/customers/amy-burns.png', 
    }));

    return latestAlerts as unknown as LatestInvoiceRaw[];
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

    const numberOfInvoices = Number(data[0][0].count ?? '0');      
    const numberOfCustomers = Number(data[1][0].count ?? '0');     
    const totalPaidInvoices = `${data[2][0].count ?? '0'} Alerts`; 
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
// 4. FETCH DATA TABEL PERSONEL (Sesuai kolom asli Neon)
// =========================================================================
const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const personnel = await sql`
      SELECT id, name, work_shift, job_title
      FROM fleet_personnel
      WHERE
        name ILIKE ${`%${query}%`} OR
        job_title ILIKE ${`%${query}%`} OR
        work_shift ILIKE ${`%${query}%`}
      ORDER BY id ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    const formattedPersonnel = personnel.map((p) => ({
      id: p.id.toString(),
      customer_id: p.id.toString(),
      name: p.name,
      email: p.job_title,          
      amount: 4000, // Nominal dummy berformat angka agar tidak memicu crash type di table.tsx
      date: '2026-05-22',     
      status: p.work_shift === 'Day' ? 'paid' : 'pending', // Menyesuaikan status badge bawaan template ('paid'/'pending')
      image_url: '/customers/balazs-orban.png',
    }));

    return formattedPersonnel as unknown as InvoicesTable[];
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

    if (data.length === 0) return undefined;

    const p = data[0];
    const invoiceFormFormat = {
      id: p.id.toString(),
      customer_id: p.name,
      amount: 800, 
      status: p.work_shift === 'Day' ? 'paid' : 'pending',
    };

    return invoiceFormFormat as unknown as InvoiceForm;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch personnel information.');
  }
}

// =========================================================================
// 7. FETCH KOORDINAT PETA (Membaca tracking_packages)
// =========================================================================
export async function fetchCustomers() {
  try {
    const data = await sql`
      SELECT id, destination, name
      FROM app_users
      ORDER BY name ASC
    `;
    return data as unknown as CustomerField[];
  } catch (err) {
    console.error('Database Error:', err);
    return [] as CustomerField[];
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql`
      SELECT id, name, email
      FROM app_users
      WHERE name ILIKE ${`%${query}%`}
    `;
    
    const formatted = data.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      email: c.email,
      image_url: '/customers/evil-rabbit.png',
      total_invoices: 0,
      total_pending: '$0.00',
      total_paid: '$0.00'
    }));

    return formatted as unknown as CustomersTableType[];
  } catch (err) {
    console.error('Database Error:', err);
    return [] as CustomersTableType[];
  }
}
