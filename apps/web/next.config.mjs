/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/database"],
  serverExternalPackages: ["better-sqlite3", "adm-zip"],
  allowedDevOrigins: ["*.localhost"],
}

export default nextConfig
