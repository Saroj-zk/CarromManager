import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local JSON data store lives in `.data/`, which is never imported into
  // the bundle, so file-watchers ignore its writes. No extra config needed.
};

export default nextConfig;
