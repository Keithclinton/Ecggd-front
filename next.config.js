/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: false
  },
  async rewrites() {
    return [
      // Serve SVG favicon when browser requests /favicon.ico to avoid 404s in dev
      { source: '/favicon.ico', destination: '/favicon.svg' }
    ]
  }
}
module.exports = nextConfig
