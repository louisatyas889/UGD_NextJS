import { Inter, Space_Grotesk } from 'next/font/google';
import './ui/global.css';
import { Metadata } from 'next';
// 1. Pastikan path import ini benar sesuai dengan lokasi file FleetContext.tsx kamu
import { FleetProvider } from './context/FleetContext'; 
// 2. Provider untuk sinkronisasi kapal MAINTENANCE ke seluruh topbar
import { MaintenanceProvider } from './context/MaintenanceContext';

// Font untuk teks body (Inter)
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

// Font untuk judul/heading (Space Grotesk) agar lebih futuristik
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Serena Sail | Maritime Logistics',
  description: 'Navigating the Future, Anchored in Precision.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased bg-[#020617] text-white font-sans selection:bg-cyan-500/30">
        {/* 3. Bungkus dengan kedua provider. FleetProvider di luar MaintenanceProvider 
            agar tidak ada konflik dependency. */}
        <FleetProvider>
          <MaintenanceProvider>
            {children}
          </MaintenanceProvider>
        </FleetProvider>
      </body>
    </html>
  );
}
