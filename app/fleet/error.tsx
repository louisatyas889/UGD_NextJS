"use client"; // Wajib untuk file error

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Kamu bisa log error ke sistem monitoring di sini
    console.error(error);
  }, [error]);

  return (
    <div className="main-container" style={{ textAlign: 'center', padding: '50px' }}>
      <h2 className="title-h1" style={{ color: '#f87171' }}>SISTEM ERROR</h2>
      <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
        Terjadi kendala pada modul telemetri: {error.message}
      </p>
      <button 
        className="btn-cyber" 
        onClick={() => reset()}
      >
        COBA MUAT ULANG
      </button>
    </div>
  );
}
