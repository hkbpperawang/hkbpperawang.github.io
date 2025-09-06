'use client';

import { useEffect } from 'react';

// Listener global: paksa clipboard menjadi teks polos saat user menyalin.
// Aman: tidak menyuntikkan HTML, tidak mengubah tampilan.
export function CopyPlainText() {
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      try {
        const sel = window.getSelection?.();
        const text = sel?.toString() ?? '';
        if (!text) return; // tidak ada seleksi, biarkan default

        // Cegah default agar tidak menyertakan text/html
        e.preventDefault();

        // Utamakan API event.clipboardData bila tersedia
        if (e.clipboardData) {
          e.clipboardData.clearData();
          e.clipboardData.setData('text/plain', text);
          return;
        }

        // Fallback: navigator.clipboard (izin bergantung browser)
        // Tidak blocking; biarkan gagal diam-diam jika tidak diizinkan
        if (typeof navigator !== 'undefined') {
          const nav = navigator as Navigator & { clipboard?: { writeText?: (t: string) => Promise<void> | void } };
          if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
            void nav.clipboard.writeText(text);
          }
        }
      } catch {
        // Abaikan error agar pengalaman salin default tidak rusak
      }
    };

    document.addEventListener('copy', onCopy, true);
    return () => document.removeEventListener('copy', onCopy, true);
  }, []);

  return null;
}
