/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@healthflow/shared', '@healthflow/ui'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
