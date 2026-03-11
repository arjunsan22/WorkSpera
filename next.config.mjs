/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for file uploads (default is 4.5MB which fails on Vercel)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
