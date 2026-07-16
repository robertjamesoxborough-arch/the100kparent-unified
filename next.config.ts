import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next detects the
  // stray ~/package-lock.json in the home directory and infers that as the
  // root, emitting a build warning and risking wrong file resolution.
  turbopack: {
    root: __dirname,
  },
  // Serve the v2 landing at the root so there is no "/v2" in the address bar.
  // This is a rewrite, not a redirect: it serves public/v2.html for "/" while
  // the URL stays "/". (Previously app/page.tsx redirect()'d to /v2.html, which
  // is what put "/v2.html" in the address bar.)
  async rewrites() {
    return [{ source: "/", destination: "/v2.html" }];
  },
  // Old v2 URLs now permanently point at the new root.
  async redirects() {
    return [
      { source: "/v2.html", destination: "/", permanent: true },
      { source: "/v2", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
