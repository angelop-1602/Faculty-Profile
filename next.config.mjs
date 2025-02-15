/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,  // Disable undici to use node's native fetch
    }
    return config
  },
}

export default nextConfig 