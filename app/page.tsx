"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- INTERFACES TYPESCRIPT ---
interface TrackingPackage {
  id: string;
  package_size: string;
  dest: string; 
  lat: number;
  lng: number;
  vesselName: string; 
}

// --- KOMPONEN UI NAVBAR ---
const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#020617]/85 backdrop-blur-md border-b border-white/5 px-8 py-5">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 border border-purple-500/50 rounded-lg flex items-center justify-center bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
          <Image src="/kapal.png" alt="Logo" width={25} height={25} />
        </div>
        <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 group-hover:to-cyan-400 transition-all">
          SERENA SAIL
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-10">
        <Link href="#about" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-cyan-400 transition-colors">
          About Us
        </Link>
        <Link href="#layanan" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-cyan-400 transition-colors">
          Layanan
        </Link>
        <Link href="#tracing" className="text-sm font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
          Tracing Paket
        </Link>
      </div>

      <Link 
        href="/login" 
        className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-gray-200 hover:text-white hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
      >
        Login Admin / User
      </Link>
    </div>
  </nav>
);

interface ServiceCardProps {
  size: string;
  price: string;
  desc: string;
  details: string;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ size, price, desc, details, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white/[0.04] backdrop-blur-md border border-white/10 p-10 rounded-2xl hover:bg-purple-500/10 hover:border-purple-500/40 cursor-pointer transition-all duration-500 group flex flex-col justify-between min-h-[400px]"
  >
    <div>
      <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-sm font-black uppercase tracking-[0.3em] mb-4">{size} Package</div>
      <div className="text-4xl md:text-5xl font-black mb-6 tracking-tighter italic leading-tight text-white">
        <span className="text-xs font-normal not-italic text-gray-400 uppercase tracking-widest block mb-1">Mulai dari</span>
        {price}
      </div>
      <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed font-medium">{desc}</p>
    </div>
    <div className="pt-8 border-t border-white/5 flex justify-between items-center">
      <p className="text-xs md:text-sm text-cyan-400 font-bold uppercase tracking-widest leading-relaxed">{details}</p>
      <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-mono">PILIH</span>
    </div>
  </div>
);

export default function Page() {
  const [packageId, setPackageId] = useState<string>("");
  const [activePkg, setActivePkg] = useState<TrackingPackage | null>(null);
  const [trackingError, setTrackingError] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [checkoutStatus, setCheckoutStatus] = useState<string>("");
  
  const [formData, setFormData] = useState({
    pengirim: "", penerima: "", telepon: "", asal: "", tujuan: "", barang: "", berat: "", pembayaran: "QRIS", tanggal: ""
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const currentMarker = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || leafletMap.current) return;

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap";
    document.head.appendChild(fontLink);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!mapContainerRef.current || (window as any).L === undefined) return;
      const L = (window as any).L;

      const map = L.map(mapContainerRef.current, {
        center: [15.0, 120.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);
      
      leafletMap.current = map;
      setTimeout(() => { map.invalidateSize(); }, 300);
    };
    document.head.appendChild(script);
  }, []);

  const handleTrack = async () => {
    const searchId = packageId.toUpperCase().trim();
    if (!searchId) return;

    setTrackingError("");
    setIsSearching(true);

    try {
      const response = await fetch(`/api/track?id=${encodeURIComponent(searchId)}`);
      const data = await response.json();

      if (data.error) {
        setActivePkg(null);
        setTrackingError(`⚡ ${data.error}`);
        setIsSearching(false);
        return;
      }

      if (data.tracking && leafletMap.current) {
        const L = (window as any).L;
        
        const foundPackage: TrackingPackage = {
          id: data.tracking.id,
          package_size: data.tracking.package_size,
          dest: data.tracking.destination,
          lat: parseFloat(data.tracking.lat),
          lng: parseFloat(data.tracking.lng),
          vesselName: data.tracking.vessel_name
        };

        setActivePkg(foundPackage);
        
        leafletMap.current.invalidateSize();
        leafletMap.current.flyTo([foundPackage.lat, foundPackage.lng], 6, { animate: true, duration: 2 });

        if (currentMarker.current) currentMarker.current.remove();

        const pulseIcon = L.divIcon({
          className: 'map-pulse-icon',
          html: `<div style="width:14px; height:14px; background:#22d3ee; border-radius:50%; box-shadow:0 0 15px #22d3ee;"></div>`,
          iconSize: [14, 14]
        });

        currentMarker.current = L.marker([foundPackage.lat, foundPackage.lng], { icon: pulseIcon }).addTo(leafletMap.current);
        currentMarker.current.bindPopup(
          `<b style="color:black; font-family:sans-serif;">${foundPackage.vesselName}</b><br/>` +
          `<span style="color:#4b5563; font-family:sans-serif;">Dest: ${foundPackage.dest}</span>`
        ).openPopup();
      
      } else if (data.barang) {
        setActivePkg(null);
        setTrackingError(
          `📦 Manifest Terdaftar: Barang dari [${data.barang.nama_pengirim}] tujuan [${data.barang.negara_tujuan}] ` +
          `ditemukan di sistem dengan status operasional [${data.barang.status_barang}]. Menunggu keberangkatan armada kargo.`
        );
      } else {
        setActivePkg(null);
        setTrackingError("❌ Nomor resi kargo atau ID Kontainer tidak terdaftar di database manifest.");
      }
    } catch (err) {
      console.error(err);
      setActivePkg(null);
      setTrackingError("⚡ Kegagalan jaringan. Tidak dapat terhubung ke sistem manifest server.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const generatedId = `PKG-${Math.floor(100000 + Math.random() * 900000)}`;
    setCheckoutStatus("Sedang memproses dan mengamankan data ke database Neon...");

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          no_resi: generatedId,
          nama_pengirim: formData.pengirim,
          nama_penerima: formData.penerima,
          negara_asal: formData.asal,
          negara_tujuan: formData.tujuan,
          package_size: selectedService,
          nama_barang: formData.barang,
          berat: parseFloat(formData.berat) || 0,
          no_telepon: formData.telepon,
          tanggal: formData.tanggal
        }),
      });

      const data = await response.json();

      if (data.error) {
        setCheckoutStatus(`❌ Gagal: ${data.error}`);
        return;
      }

      setCheckoutStatus(`✅ Transaksi Berhasil! ID Resi Otomatis: ${generatedId}. Data sudah disimpan aman di database Neon.`);
      
      setTimeout(() => {
        setIsModalOpen(false);
        setCheckoutStatus("");
        setFormData({ pengirim: "", penerima: "", telepon: "", asal: "", tujuan: "", barang: "", berat: "", pembayaran: "QRIS", tanggal: "" });
      }, 6000);

    } catch (err) {
      console.error(err);
      setCheckoutStatus("❌ Kegagalan sistem jaringan. Tidak dapat mengirim data manifest.");
    }
  };

  const handleZoom = (type: "in" | "out") => {
    if (!leafletMap.current) return;
    if (type === "in") leafletMap.current.zoomIn();
    else leafletMap.current.zoomOut();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openForm = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { background: #020617 !important; cursor: crosshair !important; }
        .leaflet-popup-content-wrapper { border-radius: 8px; font-weight: bold; padding: 4px; }
      `}} />

      <Navbar />

      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute w-[800px] h-[800px] bg-purple-600/10 blur-[180px] rounded-full -z-10" />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none scale-125 md:scale-100 z-0">
          <Image src="/kapal.png" alt="Watermark Logo" width={550} height={550} priority className="object-contain" />
        </div>

        <div className="z-10 pt-20 relative">
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter mb-6 italic leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-purple-300 drop-shadow-[0_0_35px_rgba(168,85,247,0.25)]">
            SERENA SAIL
          </h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-[0.5em] uppercase text-sm md:text-lg font-black opacity-90 drop-shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
            Navigating the Future, Anchored in Precision
          </p>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="bg-purple-500/10 text-purple-300 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              Corporate Profile
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mt-6 uppercase italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400">
              Global Maritime Logistics
            </h2>
            <p className="text-gray-300 mt-6 text-lg leading-relaxed font-medium">
              Serena Sail merupakan integrator logistik maritim terdepan yang menghubungkan rute domestik dan internasional menggunakan keandalan armada kargo modern berteknologi pelacakan satelit real-time terintegrasi.
            </p>
          </div>
          <div className="border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 rounded-2xl relative overflow-hidden group backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-xl rounded-full"></div>
            <h3 style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4 uppercase tracking-wider">
              Visi dan Operasional
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Menghadirkan transparansi end-to-end data barang bawaan dari pelabuhan asal hingga tujuan akhir demi efisiensi rantai pasok industri UMKM global.
            </p>
          </div>
        </div>
      </section>

      {/* LAYANAN SECTION */}
      <section id="layanan" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 bg-[#030712]/50">
        <div className="text-center mb-20">
          <span className="bg-cyan-500/10 text-cyan-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-500/20">Shipping Solutions</span>
          <h2 className="text-5xl md:text-6xl font-bold mt-6 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">Layanan Kami</h2>
          <p className="text-gray-400 mt-4 text-sm md:text-base">Pilih paket dimensi logistik untuk membuka form entry order manifestasi.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <ServiceCard size="Small" price="Rp 250.000" desc="Pengiriman dokumen penting atau paket kecil." details="Standard Domestik" onClick={() => openForm("Small")} />
          <ServiceCard size="Medium" price="Rp 1.200.000" desc="Ideal untuk inventaris bisnis atau elektronik." details="Volume & Koordinat" onClick={() => openForm("Medium")} />
          <ServiceCard size="Large" price="Rp 5.500.000" desc="Kapasitas kontainer besar untuk alat berat." details="Rute Pelayaran Khusus" onClick={() => openForm("Large")} />
        </div>
      </section>

      {/* TRACING PAKET SECTION */}
      <section id="tracing" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 relative">
        <div className="text-left mb-16">
          <span className="bg-orange-500/10 text-orange-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-orange-500/20">Live Tracking</span>
          <h2 className="text-5xl md:text-6xl font-bold mt-6 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Tracing Paket</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-10 rounded-3xl flex flex-col justify-center">
            <h3 style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-xl font-bold mb-8 uppercase tracking-tighter text-cyan-400">Masukkan ID Paket</h3>
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  placeholder="Contoh: PKG-100293 atau LUT-0394392687-825"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-base font-mono focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600 uppercase text-gray-200"
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              </div>
              
              <button 
                onClick={handleTrack}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-5 rounded-xl uppercase tracking-[0.2em] text-xs transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_rgba(147,51,234,0.2)] disabled:opacity-50"
              >
                {isSearching ? "MENGHUBUNGKAN KE NEON DB..." : "LACAK SEKARANG"}
              </button>

              {trackingError && (
                <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 text-xs font-medium leading-relaxed">
                  {trackingError}
                </div>
              )}
            </div>
          </div>

          <div className="relative group min-h-[400px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative h-full w-full bg-[#030712] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-[1000]">
                <span style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span> SATELLITE FEED: NEON DB ACTIVE
                </span>
                
                <div className="flex gap-2">
                  <button onClick={() => handleZoom("in")} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded border border-white/20 text-white font-mono text-sm transition-colors">+</button>
                  <button onClick={() => handleZoom("out")} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded border border-white/20 text-white font-mono text-sm transition-colors">-</button>
                </div>
              </div>
              
              <div className="flex-grow relative w-full h-full min-h-[300px] z-10">
                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
              </div>

              {/* PANEL DETAIL DATA LIVE KAPAL */}
              <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-[1000]">
                <div className="flex justify-between items-end">
                  <div>
                    <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Vessel</div>
                    <div className="text-lg font-bold italic uppercase text-cyan-400">
                      {activePkg ? activePkg.vesselName : "Awaiting Feed..."}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Destination</div>
                    <div className="text-lg font-bold text-gray-200 uppercase tracking-tighter">
                      {activePkg ? activePkg.dest : "---"}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* MODAL FORM ENTRY MANIFEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-20 pb-10 overflow-y-auto bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-8 max-w-3xl w-full relative shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-fade-in">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white text-base transition-colors"
            >
              ✕
            </button>
            
            <div className="mb-6">
              <p style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[#a855f7] text-[10px] tracking-[0.14em] mb-2 uppercase">CARGO SECURE ENTRY FORM</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-100">Formulir Data Diri Pengiriman</h2>
              <p className="text-gray-400 text-xs mt-1">Jenis paket terikat otomatis pada pilihan layanan: <span className="text-cyan-400 font-bold uppercase">{selectedService}</span>.</p>
            </div>

            {checkoutStatus ? (
              <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-center text-xs leading-relaxed">
                {checkoutStatus}
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className="md:col-span-2 mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">JENIS LAYANAN YANG DIPILIH</label>
                  <input type="text" value={`${selectedService} Package`} disabled className="w-full rounded-xl border border-white/5 bg-white/[0.01] text-gray-500 px-3.5 py-2.5 text-xs cursor-not-allowed outline-none" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA PENGIRIM *</label>
                  <input required name="pengirim" value={formData.pengirim} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="text" placeholder="Nama Lengkap Pengirim" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA PENERIMA *</label>
                  <input required name="penerima" value={formData.penerima} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="text" placeholder="Nama Lengkap Penerima" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NOMOR TELEPON PENGIRIM *</label>
                  <input required name="telepon" value={formData.telepon} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="text" placeholder="Contoh: 0812xxxxxxxx" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA BARANG / KOMODITAS *</label>
                  <input required name="barang" value={formData.barang} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="text" placeholder="Contoh: Paket Elektronik, Pakaian" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NEGARA ASAL PENGIRIMAN *</label>
                  <input required name="asal" value={formData.asal} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="text" placeholder="Contoh: Indonesia, Jepang" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NEGARA TUJUAN PENGIRIMAN *</label>
                  <input required name="tujuan" value={formData.tujuan} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="text" placeholder="Contoh: Filipina, Singapura" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">ESTIMASI BERAT BARANG (KG) *</label>
                  <input required name="berat" value={formData.berat} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600" type="number" step="0.1" min="0.1" placeholder="0.0" />
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">TANGGAL PENGIRIMAN *</label>
                  <input required name="tanggal" value={formData.tanggal} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]" type="date" />
                </div>

                <div className="mb-3 md:col-span-2">
                  <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">METODE PEMBAYARAN KUNCI *</label>
                  <select required name="pembayaran" value={formData.pembayaran} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-[#0c0c12] text-gray-200 px-3.5 py-2.5 text-xs outline-none cursor-pointer">
                    <option value="QRIS">QRIS (Automated Feed)</option>
                    <option value="Debit">Transfer Bank / Debit Virtual Account</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  style={{ fontFamily: `'Share Tech Mono', monospace` }}
                  className="md:col-span-2 mt-4 py-4 rounded-xl text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] hover:opacity-90 transition-opacity font-bold shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                >
                  Proses Pembayaran & Buat Resi Otomatis
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="py-20 border-t border-white/5 text-center bg-[#010413]">
        <p className="text-xs md:text-sm text-gray-500 tracking-[0.6em] font-black uppercase">© 2026 SERENA SAIL MARITIME LOGISTICS - ALL RIGHTS RESERVED</p>
      </footer>
    </main>
  );
}
