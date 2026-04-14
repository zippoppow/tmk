/** @type {import('next').NextConfig} */
const path = require('path');

const RAILWAY_API = process.env.NEXT_PUBLIC_TMK_API_URL_PRODUCTION || 'https://tmk-api.up.railway.app';

const nextConfig = {
  // We import shared files from ../theme, ../tokens, and ../icons.
  // Allow transpiling and resolving external workspace files.
  experimental: {
    externalDir: true,
  },

  // Path alias to import Pegasus library components locally
  webpack: (config) => {
    const appNodeModules = path.resolve(__dirname, 'node_modules');

    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/material': path.resolve(appNodeModules, '@mui/material'),
      '@mui/icons-material': path.resolve(appNodeModules, '@mui/icons-material'),
      '@emotion/react': path.resolve(appNodeModules, '@emotion/react'),
      '@emotion/styled': path.resolve(appNodeModules, '@emotion/styled'),
    };

    config.resolve.modules = [appNodeModules, ...(config.resolve.modules || [])];

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
