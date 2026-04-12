/** @type {import('next').NextConfig} */
const RAILWAY_API = process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION || 'https://tmk-api.up.railway.app';

const nextConfig = {
  // Path alias to import Pegasus library components locally
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Allows importing from '../tokens', '../theme', '../icons'
      // In a real monorepo, you'd use workspaces or npm link
    };
    return config;
  },

  // Proxy API routes that have no local implementation to the Railway API.
  // This runs server-to-server so there is no CORS issue on localhost.
  // On production the client calls Railway directly, so these rewrites are unused.
  async rewrites() {
    return [
      {
        source: '/api/auth/user/:path*',
        destination: `${RAILWAY_API}/api/auth/user/:path*`,
      },
      {
        source: '/api/lesson-activities/:path*',
        destination: `${RAILWAY_API}/api/lesson-activities/:path*`,
      },
      {
        source: '/api/diy-projects/:path*',
        destination: `${RAILWAY_API}/api/diy-projects/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
