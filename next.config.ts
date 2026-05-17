import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/tcpa-demand-letter",
        destination: "/tcpa-violation-checker",
        permanent: true,
      },
      {
        source: "/:company([a-z0-9]+(?:-[a-z0-9]+)*)-spam-calls-compensation",
        destination: "/:company-spam-calls",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
