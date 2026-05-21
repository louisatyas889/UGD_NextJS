"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrakingPackages } from './lib/placeholder-data';

// --- KOMPONEN UI ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 px-8 py-5">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 border border-purple-500/50 rounded-lg flex items-center justify-center bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
          <Image src="/kapal.png" alt="Logo" width={25} height={25} />
        </div>
        <span className="text-xl font-black italic tracking-tighter group-hover:text-purple-400 transition-colors">
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
        className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
      >
        Employee Login
      </Link>
    </div>
  </nav>
);

const MissionCard = ({ number, title, desc, iconSrc, iconAlt }: any) => (
  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 p-10 rounded-xl hover:border-purple-500/50 transition-all group relative overflow-hidden text-left min-h-[300px]">
    <div className="absolute top-0 right-0 p-6 text-6xl font-black text-white/5 group-hover:text-purple-500/10 transition-colors">
      {number}
    </div>
    <div className="relative w-16 h-16 mb-8">
      <Image src={iconSrc} alt={iconAlt} fill className="object-contain" />
    </div>
    <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-tight">{title}</h3>
    <p className="text-gray-300 text-lg md:text-xl leading-relaxed">{desc}</p>
  </div>
);

const ServiceCard = ({ size, price, desc, details }: any) => (
  <div className="bg-white/[0.05] backdrop-blur-md border border-white/10 p-10 rounded-2xl hover:bg-purple-500/10 transition-all duration-500 group flex flex-col justify-between min-h-[400px]">
    <div>
      <div className="text-purple-400 text-sm font-black uppercase tracking-[0.3em] mb-4">{size} Package</div>
      <div className="text-4xl md:text-5xl font-black mb-6 tracking-tighter italic leading-tight">
        <span className="text-lg font-normal not-italic text-gray-400 uppercase tracking-widest">Mulai dari</span> <br />
        {price}
      </div>
      <p className="text-gray-200 text-lg md:text-xl mb-8 leading-relaxed font-medium">{desc}</p>
    </div>
    <div className="pt-8 border-t border-white/10">
      <p className="text-xs md:text-sm text-cyan-400 font-bold uppercase tracking-widest leading-relaxed">{details}</p>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function Page() {
  const [packageId, setPackageId] = useState("");
  const [activePkg, setActivePkg] = useState<any>(null); // Untuk simpan info paket yang ketemu
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const currentMarker = useRef<any>(null);

  // LOGIKA MAP INTERAKTIF
  useEffect(() => {
    if (typeof window === "undefined" || leafletMap.current) return;

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
        center: [-2.5489, 118.0149], 
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);
      leafletMap.current = map;
    };
    document.head.appendChild(script);
  }, []);

  // FUNGSI HANDLE LACAK
  const handleTrack = () => {
    const found = TrakingPackages.find(p => p.id.toUpperCase() === packageId.toUpperCase());
    
    if (found && leafletMap.current) {
      const L = (window as any).L;
      setActivePkg(found);

      // Geser peta ke koordinat kapal
      leafletMap.current.flyTo([found.lat, found.lng], 7, { animate: true, duration: 2 });

      // Hapus marker lama jika ada
      if (currentMarker.current) currentMarker.current.remove();

      const pulseIcon = L.divIcon({
        className: 'map-pulse-icon',
        html: `<div style="width:12px; height:12px; background:#22d3ee; border-radius:50%; box-shadow:0 0 15px #22d3ee; animation: blink 1.5s infinite"></div>`,
        iconSize: [12, 12]
      });

      // Tambah marker baru
      currentMarker.current = L.marker([found.lat, found.lng], { icon: pulseIcon }).addTo(leafletMap.current);
      currentMarker.current.bindPopup(`<b style="color:black">${found.vesselName}</b><br/><span style="color:gray">Dest: ${found.dest}</span>`).openPopup();
    } else {
      alert("ID Paket tidak ditemukan!");
    }
  };

  const handleZoom = (type: "in" | "out") => {
    if (!leafletMap.current) return;
    if (type === "in") leafletMap.current.zoomIn();
    else leafletMap.current.zoomOut();
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } }
        .leaflet-container { background: #030712 !important; cursor: crosshair !important; }
        .leaflet-popup-content-wrapper { border-radius: 8px; font-weight: bold; }
      `}</style>

      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="absolute w-[800px] h-[800px] bg-purple-600/10 blur-[180px] rounded-full" />
        <div className="z-10 pt-20">
          <div className="relative w-32 h-32 mx-auto mb-10 group">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full group-hover:bg-purple-500/40 transition-all duration-700" />
            <div className="relative w-full h-full border-2 border-purple-500/30 rounded-2xl flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm p-4">
              <Image src="/kapal.png" alt="Logo" width={120} height={120} priority className="object-contain" />
            </div>
          </div>
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter mb-6 italic leading-none">SERENA SAIL</h1>
          <p className="text-cyan-400 tracking-[0.5em] uppercase text-sm md:text-lg font-black opacity-90">
            Navigating the Future, Anchored in Precision
          </p>
        </div>
      </section>

      {/* 2. ABOUT US SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-8 py-40 border-t border-white/5 relative bg-[#020617]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-500/20">Corporate Identity</span>
            <h2 className="text-6xl md:text-7xl font-bold mt-8 mb-8 uppercase italic">About Us</h2>
            <p className="text-2xl md:text-3xl text-blue-100/80 leading-relaxed font-light">
              Serena Sail adalah pionir solusi maritim global. Kami menciptakan sistem yang <span className="text-purple-400 font-bold">presisi</span> dan <span className="text-cyan-400 font-bold">mudah digunakan</span> oleh semua kalangan.
            </p>
          </div>
          <div className="bg-white/[0.03] p-12 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-6 text-cyan-400 uppercase tracking-tighter">Our Core Identity</h3>
            <p className="text-gray-300 text-xl md:text-2xl leading-relaxed">Kami mendigitalkan pencatatan logistik tradisional menjadi sistem yang transparan, aman, dan dapat diakses mudah oleh siapa saja.</p>
          </div>
        </div>
      </section>

      {/* 3. VISI SECTION */}
      <section className="max-w-7xl mx-auto px-8 py-40 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center border-t border-white/5">
        <div>
          <span className="bg-purple-500/10 text-purple-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-purple-500/20">Strategic Vision</span>
          <h2 className="text-6xl md:text-7xl font-bold mt-8 mb-10 uppercase italic">Visi</h2>
          <p className="text-3xl md:text-4xl text-blue-100 leading-tight font-light">Menjadi pionir logistik maritim yang paling <span className="text-purple-400 font-bold underline decoration-purple-500/30">aman</span>, <span className="text-cyan-400 font-bold underline decoration-cyan-500/30">transparan</span>, dan <span className="text-orange-400 font-bold underline decoration-orange-500/30">berkelanjutan</span>.</p>
        </div>
        <div className="relative group aspect-video">
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
          <div className="relative h-full w-full bg-white/[0.02] border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
            <Image src="/fotoCompany.jpeg" alt="Vessel" fill className="object-cover opacity-70 group-hover:scale-110 transition-transform duration-1000" />
          </div>
        </div>
      </section>

      {/* 4. MISI SECTION */}
      <section className="max-w-7xl mx-auto px-8 py-40 border-t border-white/5 relative">
        <h2 className="text-5xl md:text-6xl font-black mb-20 text-center uppercase tracking-[0.2em] italic">Misi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <MissionCard number="01" title="Operasional" desc="Pemantauan armada presisi real-time untuk jaminan ketepatan waktu." iconSrc="/tabel1.png" iconAlt="Operasional" />
          <MissionCard number="02" title="Inovasi" desc="Sistem navigasi satelit canggih untuk adaptasi cuaca ekstrem." iconSrc="/roket1.png" iconAlt="Inovasi" />
          <MissionCard number="03" title="Efisiensi" desc="Optimasi bahan bakar untuk mengurangi jejak karbon dunia." iconSrc="/daun1.png" iconAlt="Efisiensi" />
        </div>
      </section>

      {/* 5. LAYANAN SECTION */}
      <section id="layanan" className="max-w-7xl mx-auto px-8 py-40 border-t border-white/5 bg-[#030712]/50">
        <div className="text-center mb-20">
          <span className="bg-cyan-500/10 text-cyan-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-500/20">Shipping Solutions</span>
          <h2 className="text-6xl md:text-7xl font-bold mt-8 uppercase italic">Layanan Kami</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <ServiceCard size="Small" price="Rp 250.000" desc="Pengiriman dokumen penting atau paket kecil." details="Standard Domestik." />
          <ServiceCard size="Medium" price="Rp 1.200.000" desc="Ideal untuk inventaris bisnis atau elektronik." details="Volume & Koordinat." />
          <ServiceCard size="Large" price="Rp 5.500.000" desc="Kapasitas kontainer besar untuk alat berat." details="Rute Pelayaran Khusus." />
        </div>
      </section>

      {/* 6. TRACING PAKET SECTION */}
      <section id="tracing" className="max-w-7xl mx-auto px-8 py-40 border-t border-white/5 relative">
        <div className="text-left mb-16">
          <span className="bg-orange-500/10 text-orange-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-orange-500/20">Live Tracking</span>
          <h2 className="text-6xl md:text-7xl font-bold mt-8 uppercase italic">Tracing Paket</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-10 rounded-3xl flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-8 uppercase tracking-tighter text-cyan-400">Masukkan ID Paket</h3>
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  placeholder="Contoh: PKG-100293"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-xl font-mono focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600 uppercase"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
              </div>
              
              <button 
                onClick={handleTrack}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-5 rounded-xl uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Lacak Sekarang
              </button>
            </div>
          </div>

          <div className="relative group min-h-[400px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative h-full w-full bg-[#030712] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-[1000]">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span> SATELLITE FEED: ACTIVE
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleZoom("in")} className="w-7 h-7 bg-white/10 rounded flex items-center justify-center hover:bg-cyan-500 transition-colors">+</button>
                  <button onClick={() => handleZoom("out")} className="w-7 h-7 bg-white/10 rounded flex items-center justify-center hover:bg-cyan-500 transition-colors">−</button>
                </div>
              </div>
              
              <div className="flex-grow relative z-1">
                <div ref={mapContainerRef} className="absolute inset-0" />
              </div>

              <div className="p-6 bg-gradient-to-t from-black to-transparent z-[1000]">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Vessel</div>
                    <div className="text-lg font-bold italic uppercase text-cyan-400">
                      {activePkg ? activePkg.vesselName : "Awaiting Track..."}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Destination</div>
                    <div className="text-lg font-bold text-white uppercase tracking-tighter">
                      {activePkg ? activePkg.dest : "---"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center bg-[#010413]">
        <p className="text-sm md:text-lg text-gray-500 tracking-[0.6em] font-black uppercase">© 2026 SERENA SAIL MARITIME LOGISTICS // ALL RIGHTS RESERVED</p>
      </footer>
    </main>
  );
}
