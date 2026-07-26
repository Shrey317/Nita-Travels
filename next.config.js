// Postgres DATE columns come back from Prisma as UTC-midnight Date objects. Without forcing
// the process timezone, date-fns' format() would interpret them in the host's local time and
// could display the wrong calendar day near midnight in any non-UTC environment (this mirrors
// the same fix already applied in prisma/seed.ts, for the same reason).
process.env.TZ = "UTC";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'prisma'],
  },
};

module.exports = nextConfig;
