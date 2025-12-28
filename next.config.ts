import type { NextConfig } from "next";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      // Ensure any `@mysten/bcs` import uses the version pinned at the workspace root.
      // This avoids build-time ESM export mismatches caused by older nested copies.
      "@mysten/bcs": require.resolve("@mysten/bcs", {
        paths: [path.join(__dirname, "..")],
      }),
    };

    return config;
  },

  // Resolve symlinks so the local SDK package is traced correctly.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
