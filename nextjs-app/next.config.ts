import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Arahkan /songs/be/123.json -> /songs/be/123
      {
        source: "/songs/:type(be|bn)/:name(\\d+)\\.json",
        destination: "/songs/:type/:name",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
