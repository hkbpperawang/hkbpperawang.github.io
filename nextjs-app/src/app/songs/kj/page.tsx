import { SongListByType } from '@/app/components/song-list-by-type';
import type { Metadata } from 'next';

export default function KjListPage() {
  return <SongListByType type="kj" />;
}

export const metadata: Metadata = {
  title: 'Daftar Lagu KJ — Nyanyian HKBP Perawang',
  description: 'Daftar lengkap lagu Kidung Jemaat (KJ).',
};
