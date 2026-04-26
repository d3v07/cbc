/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // ffmpeg.wasm needs SharedArrayBuffer, which requires cross-origin
  // isolation. Scope to /dev/* only — broad COOP/COEP can break embeds /
  // third-party iframes once the public app ships.
  async headers() {
    return [
      {
        source: "/dev/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
