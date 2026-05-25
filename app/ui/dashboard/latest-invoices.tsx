import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { LatestInvoice } from '@/app/lib/definitions';

export default async function LatestInvoices({
  latestInvoices,
}: {
  latestInvoices: LatestInvoice[];
}) {
  return (
    <div className="flex w-full flex-col md:col-span-4">
      {/* 1. Mengubah judul komponen menjadi SYSTEM LOGS sesuai tema maritim */}
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl text-white`}>
        SYSTEM LOGS
      </h2>
      
      {/* 2. Mengubah background menjadi gelap transparan agar serasi dengan dashboard */}
      <div className="flex grow flex-col justify-between rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
        <div className="bg-transparent px-6">
          {latestInvoices.map((log, i) => {
            // Menentukan warna teks log berdasarkan jenis alert (kamuflase dari property name)
            const isCritical = log.name.includes('WARNING') || log.name.includes('SECURITY');

            return (
              <div
                key={log.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t border-zinc-800': i !== 0,
                  },
                )}
              >
                <div className="flex items-center min-w-0">
                  {/* Default avatar maritim */}
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-cyan-400 border border-zinc-700">
                    ⚓
                  </div>
                  
                  <div className="min-w-0">
                    {/* Menampilkan Tipe Alert (Contoh: WEATHER WARNING) */}
                    <p className={clsx("truncate text-sm font-semibold md:text-base", {
                      'text-red-400': isCritical,
                      'text-amber-400': !isCritical,
                    })}>
                      {log.name}
                    </p>
                    {/* Menampilkan Log Waktu / Timestamp (Contoh: 10:45 UTC) */}
                    <p className="text-xs text-zinc-400 sm:block">
                      {log.email}
                    </p>
                  </div>
                </div>

                {/* Menampilkan Isi Pesan / Body Alert di sebelah kanan */}
                <p className="truncate text-xs font-medium text-zinc-300 ml-4 max-w-[150px] md:max-w-[200px]">
                  {log.amount}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center pb-2 pt-6 border-t border-zinc-800/60 mt-2">
          <ArrowPathIcon className="h-5 w-5 text-zinc-500" />
          <h3 className="ml-2 text-xs text-zinc-500">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}
