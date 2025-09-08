// Cache judul sisi-klien dengan deduplikasi request dan TTL di sessionStorage
// Tujuan: mempercepat pemuatan daftar judul per buku (be/bn/kj)

export type Book = 'be' | 'bn' | 'kj';

type TitlesMap = Record<string, string>; // key: `${type}/${name}` -> cleaned title

const inMemory: Partial<Record<Book, Promise<TitlesMap>>> = {};
const STORAGE_KEY = 'titles-cache-v1';
const TTL_MS = 60 * 60 * 1000; // 1 jam

type PersistShape = {
  ts: number;
  data: Partial<Record<Book, TitlesMap>>;
};

function readPersist(): PersistShape | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistShape;
  } catch { return null; }
}

function writePersist(p: PersistShape) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function getFromPersist(book: Book): TitlesMap | null {
  const p = readPersist();
  if (!p) return null;
  if (Date.now() - p.ts > TTL_MS) return null;
  const map = p.data[book];
  return map ?? null;
}

function setToPersist(book: Book, map: TitlesMap) {
  const existing = readPersist();
  const next: PersistShape = existing && (Date.now() - existing.ts) <= TTL_MS
    ? { ts: existing.ts, data: { ...existing.data, [book]: map } }
    : { ts: Date.now(), data: { [book]: map } };
  writePersist(next);
}

async function fetchTitles(book: Book): Promise<TitlesMap> {
  const res = await fetch(`/api/titles?type=${book}`, { cache: 'no-cache' });
  if (!res.ok) return {};
  const data = await res.json() as { titles: { name: string; type: Book; title: string }[] };
  const map: TitlesMap = {};
  for (const t of data.titles) map[`${t.type}/${t.name}`] = t.title;
  return map;
}

export function loadTitles(book: Book): Promise<TitlesMap> {
  // 1) In-flight dedupe
  if (inMemory[book]) return inMemory[book]!;
  // 2) sessionStorage cached
  const cached = getFromPersist(book);
  if (cached) return Promise.resolve(cached);
  // 3) fetch & persist
  const p = fetchTitles(book).then((map) => {
    setToPersist(book, map);
    return map;
  }).finally(() => {
    // Lepas promise agar tidak disajikan stale di masa depan
    delete inMemory[book];
  });
  inMemory[book] = p;
  return p;
}

export function prefetchOtherBooks(current: Book) {
  const books: Book[] = ['be', 'bn', 'kj'];
  for (const b of books) {
    if (b === current) continue;
    // Fire-and-forget; tidak perlu await
    loadTitles(b).catch(() => {});
  }
}
