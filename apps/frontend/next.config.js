//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/vgr
    svgr: false,
  },
  transpilePackages: ['crypto-hash'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://postiz-app-test-production.up.railway.app/api',
    NEXT_PUBLIC_UPLOAD_DIRECTORY: process.env.NEXT_PUBLIC_UPLOAD_DIRECTORY || '/uploads',
    NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY: process.env.NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY || '/uploads'
  },
  async redirects() {
    return [
      {
        source: '/api/uploads/:path*',
        destination:
          process.env.STORAGE_PROVIDER === 'local' ? '/uploads/:path*' : '/404',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendRewrites = process.env.NEXT_PUBLIC_BACKEND_URL ? [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`,
      }
    ] : [];

    return [
      ...backendRewrites,
      {
        source: '/uploads/:path*',
        destination:
          process.env.STORAGE_PROVIDER === 'local'
            ? '/api/uploads/:path*'
            : '/404',
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
