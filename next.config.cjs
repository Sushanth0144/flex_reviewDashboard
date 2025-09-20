/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
      { source: '/healthz', destination: 'http://localhost:4000/healthz' },
    ];
  },
};
module.exports = nextConfig;
