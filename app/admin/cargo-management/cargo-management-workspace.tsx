'use client';

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  shipmentStatusOptions,
  transactionStatusOptions,
  type CargoRecord,
} from "@/app/lib/cargo-types";
import DataSearchInput from "@/app/ui/data-search-input";

// ==========================================
// DATA ARMADA KAPAL (SINKRONISASI FLEET VESSELS)
// ==========================================
const AVAILABLE_VESSELS = [
  { name: "KM Merkurius", code: "PL-0909-MERKURIUS" },
  { name: "KM Bulan", code: "PL-123-BULAN" },
  { name: "KM Nana", code: "PL-230-NANA" },
  { name: "KM Nars", code: "PL-234-NARS" },
  { name: "KM Mars", code: "PL-245-MARS" },
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

interface WorkspaceProps {
  initialRecords: CargoRecord[];
  initialSummary: {
    totalShipments: number;
    completedShipments: number;
    totalRevenue: number;
  };
  currentQuery: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function CargoManagementWorkspace({ initialRecords, initialSummary, currentQuery }: WorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [records, setRecords] = useState<CargoRecord[]>(initialRecords);

  // Form & Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Sinkronisasi data real-time jika props dari server berubah (saat searching)
  if (initialRecords !== records && !isEditOpen) {
    setRecords(initialRecords);
  }

  // 👉 SINKRONISASI DROPDOWN ARMADA OTOMATIS SAAT MODAL DIBUKA
  useEffect(() => {
    if (isEditOpen && !formData.vehicleCode && AVAILABLE_VESSELS.length > 0) {
      const defaultVessel = AVAILABLE_VESSELS[0];
      setFormData((prev: any) => ({
        ...prev,
        vehicleCode: defaultVessel.code,
        vehicleName: defaultVessel.name,
        vehicleType: "Kapal Kargo",
      }));
    }
  }, [isEditOpen, formData.vehicleCode]);

  // Handler sinkronisasi Live Search ke URL browser
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("query", value);
    } else {
      params.delete("query");
    }
    router.push(`?${params.toString()}`);
  };

  // Handler Buka Modal Edit
  const handleOpenEdit = (record: CargoRecord) => {
    setEditingId(record.id);
    setFormData({
      shippingDate: record.shippingDate || "",
      senderName: record.senderName || "",
      recipientName: record.recipientName || "",
      phone: record.phone || "",
      originCity: record.originCity || "",
      destinationCity: record.destinationCity || "",
      itemName: record.itemName || "",
      itemType: record.itemType || "",
      itemWeightKg: record.itemWeightKg ? record.itemWeightKg.toString() : "",
      shippingPrice: record.shippingPrice ? record.shippingPrice.toString() : "",
      deliveryType: record.deliveryType || "Biasa",
      shipmentStatus: record.shipmentStatus || "Diproses",
      description: record.description || "",
      transportMode: record.transportMode || "Laut",
      itemStatus: record.itemStatus || "Siap Kirim",
      transactionStatus: record.transactionStatus || "Lunas", 
      vehicleName: record.vehicleName || "",
      vehicleType: record.vehicleType || "Kapal Kargo",
      vehicleCode: record.vehicleCode || "",
      vehicleCapacityKg: record.vehicleCapacityKg ? record.vehicleCapacityKg.toString() : "",
      vehicleStatus: record.vehicleStatus || "Siap Jalan",
      itemPrice: record.itemPrice ? record.itemPrice.toString() : "",
    });
    setFormError("");
    setIsEditOpen(true);
  };

  // Handler Submit Form (PUT Update data ke API internal kamu)
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`/api/admin/cargo/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memperbarui data kargo.");
      }

      const updatedRecord: CargoRecord = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === editingId ? updatedRecord : r)));
      
      // Refresh data server agar Summary Cards ikut ter-update otomatis
      router.refresh();
      setIsEditOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan koneksi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeRecords = Array.isArray(records) ? records : [];

  // Definisi Lebar Kolom Grid yang Konsisten & Presisi (Total: ~1220px)
  const gridLayoutClass = "grid grid-cols-[120px_100px_170px_140px_160px_160px_140px_120px_110px] items-center gap-4 px-5 py-4";

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-white/5 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-mono font-semibold">
            Internal Operations Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono mt-1">
            CARGO DISPATCH WORKSPACE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl">
            Sortir manifes logistik kargo, tentukan alokasi lambung kapal armada, dan pantau status pembaruan manifes masuk secara berkala.
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "TOTAL MANIFES MASUK", value: initialSummary?.totalShipments ?? 0, color: "from-cyan-500/10 to-slate-950/60", border: "border-cyan-500/20", glow: "text-cyan-400" },
          { label: "BELUM SORTIR KAPAL", value: safeRecords.filter(r => !r.vehicleName).length, color: "from-amber-500/10 to-slate-950/60", border: "border-amber-500/20", glow: "text-amber-400" },
          { label: "SELESAI / TERKIRIM", value: initialSummary?.completedShipments ?? 0, color: "from-emerald-500/10 to-slate-950/60", border: "border-emerald-500/20", glow: "text-emerald-400" },
          { label: "TOTAL REVENUE AUDIT", value: formatCurrency(initialSummary?.totalRevenue ?? 0), color: "from-purple-500/10 to-slate-950/60", border: "border-purple-500/20", glow: "text-purple-400" },
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} border ${card.border} p-5 rounded-2xl shadow-xl backdrop-blur-md`}>
            <span className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">{card.label}</span>
            <span className={`block text-xl sm:text-2xl font-bold mt-2 tracking-tight ${card.glow}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Search Bar Container */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase">Manifes Ledger</span>
          <h2 className="text-base font-semibold text-white mt-0.5">Filter Pencarian Manifes</h2>
        </div>
        <div className="w-full md:max-w-md">
          <DataSearchInput ariaLabel="Cari kargo" placeholder="Cari Resi, Pengirim, Penerima, Barang..." value={searchQuery} onChange={handleSearchChange} />
        </div>
      </div>

      {/* Main Data Container dengan Sistem PURE GRID (Kebal Overlap) */}
      <div className="rounded-3xl border border-white/5 bg-slate-950/80 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1220px] text-xs sm:text-sm">
            
            {/* Grid Header */}
            <div className={`${gridLayoutClass} border-b border-white/10 bg-white/[0.02] text-slate-400 font-mono tracking-wider uppercase text-[11px]`}>
              <div>No. Resi</div>
              <div>Tanggal</div>
              <div>Pengirim / Penerima</div>
              <div>Rute Negara</div>
              <div>Detail Barang</div>
              <div>Armada Kapal</div>
              <div>Status Pengiriman</div>
              <div>Tarif (IDR)</div>
              <div className="text-center">Aksi</div>
            </div>

            {/* Grid Body */}
            <div className="divide-y divide-white/5">
              {safeRecords.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-500 font-mono">
                  Tidak ada manifestasi kargo data klien yang terdeteksi.
                </div>
              ) : (
                safeRecords.map((row) => (
                  <div key={row.id} className={`${gridLayoutClass} hover:bg-white/[0.02] transition-colors whitespace-nowrap`}>
                    
                    {/* Kolom 1: No. Resi */}
                    <div className="font-bold text-cyan-400 font-mono tracking-wide overflow-hidden text-ellipsis">
                      {row.trackingNumber}
                    </div>
                    
                    {/* Kolom 2: Tanggal */}
                    <div className="text-slate-300 font-mono">
                      {formatDate(row.shippingDate)}
                    </div>
                    
                    {/* Kolom 3: Pengirim & Penerima */}
                    <div className="overflow-hidden text-ellipsis">
                      <div className="font-medium text-white truncate">{row.senderName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">Ke: {row.recipientName}</div>
                    </div>
                    
                    {/* Kolom 4: Rute Negara */}
                    <div className="overflow-hidden text-ellipsis">
                      <div className="text-slate-200 truncate">{row.originCity || "-"}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">➔ {row.destinationCity || "-"}</div>
                    </div>
                    
                    {/* Kolom 5: Detail Barang */}
                    <div className="overflow-hidden text-ellipsis">
                      <div className="text-white font-medium truncate">{row.itemName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">{row.itemType} • {row.itemWeightKg} Kg</div>
                    </div>
                    
                    {/* Kolom 6: Armada Kapal */}
                    <div className="overflow-hidden text-ellipsis">
                      {row.vehicleName ? (
                        <div>
                          <div className="font-semibold text-purple-300 truncate">{row.vehicleName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{row.vehicleCode || "No Register"}</div>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠️ Belum Ada Kapal
                        </span>
                      )}
                    </div>
                    
                    {/* Kolom 7: Status Pengiriman */}
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        row.shipmentStatus === "Selesai" || row.shipmentStatus === "Sampai Tujuan" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      }`}>{row.shipmentStatus}</span>
                    </div>
                    
                    {/* Kolom 8: Tarif */}
                    <div className="font-semibold text-slate-200 font-mono">
                      {formatCurrency(row.shippingPrice)}
                    </div>
                    
                    {/* Kolom 9: Tombol Aksi */}
                    <div className="text-center">
                      <button onClick={() => handleOpenEdit(row)} className="w-full px-2 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-950/20">
                        {row.vehicleName ? "Re-alokasi" : "Sortir Kapal"}
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Modal Edit / Validasi Cargo */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-white/10 rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-semibold">Otoritas Otorisasi</span>
                <h3 className="text-lg font-bold text-white mt-1 font-mono tracking-wide">VALIDASI MANIFES & ALOKASI</h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xl">&times;</button>
            </div>

            {formError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-mono">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Bagian Kiri: Informasi Pengiriman Klien */}
                <div className="space-y-4 bg-white/[0.01] p-4 border border-white/5 rounded-2xl">
                  <h4 className="text-[10px] font-mono text-slate-400 font-bold tracking-wider uppercase border-b border-white/5 pb-1.5">DATA DEKLARASI KLIEN</h4>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">TANGGAL KIRIM</label>
                    <input type="date" value={formData.shippingDate} onChange={(e) => setFormData({ ...formData, shippingDate: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">NAMA PENGIRIM</label>
                    <input type="text" value={formData.senderName} onChange={(e) => setFormData({ ...formData, senderName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">NAMA PENERIMA</label>
                    <input type="text" value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">NEGARA ASAL</label>
                      <input type="text" value={formData.originCity} onChange={(e) => setFormData({ ...formData, originCity: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">NEGARA TUJUAN</label>
                      <input type="text" value={formData.destinationCity} onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">NAMA BARANG</label>
                      <input type="text" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">BERAT (KG)</label>
                      <input type="number" step="any" value={formData.itemWeightKg || ""} onChange={(e) => setFormData({ ...formData, itemWeightKg: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 transition-all" required />
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Logistik & Alokasi Armada */}
                <div className="space-y-4 bg-cyan-500/[0.02] p-4 border border-cyan-500/20 rounded-2xl">
                  <h4 className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider uppercase border-b border-cyan-500/20 pb-1.5">KONTROL DISPATCH & DISPENSASI</h4>
                  
                  {/* Pilihan armada kapal */}
                  <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-300 mb-1">NAMA KAPAL LAUT</label>
                        <select 
                          value={formData.vehicleCode || ""} 
                          onChange={(e) => {
                            const code = e.target.value;
                            const selectedVessel = AVAILABLE_VESSELS.find(v => v.code === code);
                            setFormData({
                              ...formData,
                              vehicleCode: code,
                              vehicleName: selectedVessel ? selectedVessel.name : "",
                              vehicleType: code ? "Kapal Kargo" : "",
                            });
                          }} 
                          className="w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-2 py-2 text-white outline-none cursor-pointer focus:border-cyan-400 transition-all text-xs"
                          required
                        >
                          <option value="">-- Pilih Kapal --</option>
                          {AVAILABLE_VESSELS.map((v) => (
                            <option key={v.code} value={v.code}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">REGISTRASI KAPAL</label>
                        <input 
                          type="text" 
                          value={formData.vehicleCode || ""} 
                          className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2 text-slate-400 font-mono outline-none text-xs"
                          placeholder="Otomatis" 
                          readOnly 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">STATUS OPERASIONAL PENGIRIMAN</label>
                    <select value={formData.shipmentStatus || ""} onChange={(e) => setFormData({ ...formData, shipmentStatus: e.target.value as any })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white cursor-pointer outline-none focus:border-cyan-400 transition-all">
                      {shipmentStatusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">STATUS AUDIT TRANSAKSI</label>
                    <select value={formData.transactionStatus || ""} onChange={(e) => setFormData({ ...formData, transactionStatus: e.target.value as any })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white cursor-pointer outline-none focus:border-cyan-400 transition-all">
                      {transactionStatusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1.5">BIAYA LOGISTIK FINAL [🔒 TERKUNCI]</label>
                    <div className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2 text-slate-400 font-mono flex items-center justify-between">
                      <span>{formatCurrency(Number(formData.shippingPrice || 0))}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">PAID IN ADVANCE</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">CATATAN / KONDISI MANIFES</label>
                    <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-cyan-400 h-14 resize-none transition-all" placeholder="Catatan internal lambung..." />
                  </div>
                </div>

              </div>

              {/* Tombol Aksi Akhir */}
              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-semibold text-xs">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all text-xs shadow-lg shadow-cyan-500/10">
                  {isSubmitting ? "Menyimpan Alokasi..." : "Konfirmasi & Alokasikan Kapal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
