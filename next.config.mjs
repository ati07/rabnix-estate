/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Property images are served from a CDN in production; add remote hosts here.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
