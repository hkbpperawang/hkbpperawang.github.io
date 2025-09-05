import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Normalisasi trailing slash untuk rute BE/BN (tanpa mengganggu nomor lagu)
      {
        source: "/songs/:type(be|bn)/:name(\\d+)/",
        destination: "/songs/:type/:name",
        permanent: true,
      },
      {
        source: "/songs/:type(be|bn)/",
        destination: "/songs/:type",
        permanent: true,
      },
      // Arahkan /songs/be/123.json -> /songs/be/123
      {
        source: "/songs/:type(be|bn)/:name(\\d+)\\.json",
        destination: "/songs/:type/:name",
        permanent: true,
      },
      // Short path: /be -> /songs/be dan /bn -> /songs/bn
      {
        source: "/be",
        destination: "/songs/be",
        permanent: false,
      },
      {
        source: "/bn",
        destination: "/songs/bn",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
