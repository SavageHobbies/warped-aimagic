/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is required for the Dockerfile's standalone output to work.
  output: 'standalone',
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  transpilePackages: [],
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig