import { SongListByType } from '@/app/components/song-list-by-type';
import type { Metadata } from 'next';

export default function BeListPage() {
  return <SongListByType type="be" />;
}

export const metadata: Metadata = {
  title: 'Daftar Lagu BE — Nyanyian HKBP Perawang',
  description: 'Daftar lengkap lagu Buku Ende (BE) HKBP versi digital.',
};
