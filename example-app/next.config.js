/** @type {import('next').NextConfig} */
const path = require('path');

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

  // TMK API proxying is handled by app route handlers under app/api/**.
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
