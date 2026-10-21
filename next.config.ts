import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare')
    .then(({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev())
    .catch((error) => console.error('OpenNext Cloudflare dev setup failed:', error));
}

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
};

export default nextConfig;
