import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles the build output natively; `output: "standalone"` is for
     self-hosting/Docker and can drop prerendered nested routes on Vercel. */
};

export default nextConfig;
