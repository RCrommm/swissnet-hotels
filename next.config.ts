import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.swissnethotels.com' }],
        destination: 'https://swissnethotels.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;