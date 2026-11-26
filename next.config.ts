import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // "Denial Reasons" is now "Denial Codes"; "Claims" was removed from the nav.
      { source: "/settings/denial-reasons", destination: "/settings/denial-codes", permanent: true },
      { source: "/claims", destination: "/worklist", permanent: true },
    ];
  },
};

export default nextConfig;
