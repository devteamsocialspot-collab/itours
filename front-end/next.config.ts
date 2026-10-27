import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // section indexes → their default page (runs before middleware, so auth still applies to the target)
  redirects: async () => [{ source: "/admin", destination: "/admin/review", permanent: false }],
};

export default nextConfig;
