/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'superprofe-assets.s3.amazonaws.com',
      'superprofe-assets.s3.us-east-1.amazonaws.com',
      'images.unsplash.com',
      'randomuser.me',
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
};

module.exports = nextConfig;
