import { SongListByType } from '@/app/components/song-list-by-type';
import type { Metadata } from 'next';

export default function BnListPage() {
  return <SongListByType type="bn" />;
}

export const metadata: Metadata = {
  title: 'Daftar Lagu BN — Nyanyian HKBP Perawang',
  description: 'Daftar lengkap lagu Buku Nyanyian (BN) HKBP versi digital.',
};
