/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.legato.com'],
  },
  compress: true,
  poweredByHeader: false,
};

// Only use PWA in production builds
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.legato\.com\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\/chapters\/.*$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'chapter-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
    ],
  });
  
  module.exports = withPWA(nextConfig);
} else {
  module.exports = nextConfig;
}