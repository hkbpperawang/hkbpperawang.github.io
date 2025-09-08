import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {

  outputFileTracingRoot: path.join(process.cwd(), ".."),
  async redirects() {
    return [

      {
        source: "/songs/:type(be|bn|kj)/:name(\\d+)/",
        destination: "/songs/:type/:name",
        permanent: true,
      },
      {
        source: "/songs/:type(be|bn|kj)/",
        destination: "/songs/:type",
        permanent: true,
      },

      {
        source: "/songs/:type(be|bn|kj)/:name(\\d+)\\.json",
        destination: "/songs/:type/:name",
        permanent: true,
      },

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
      {
        source: "/kj",
        destination: "/songs/kj",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
