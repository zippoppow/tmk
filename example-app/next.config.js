/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
