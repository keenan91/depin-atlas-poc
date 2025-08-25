/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.DISABLE_LINT === 'true',
  },
  typescript: {ignoreBuildErrors: false},
}
module.exports = nextConfig
