/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Property images are served from a CDN in production; add remote hosts here.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // The v1 design was promoted from /v2 to the site root "/". Keep the old preview URL working.
  async redirects() {
    return [{ source: "/v2", destination: "/", permanent: false }];
  },
};

export default nextConfig;
