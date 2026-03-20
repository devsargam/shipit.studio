/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui", "@workspace/database"],
  serverExternalPackages: ["adm-zip"],
  allowedDevOrigins: ["*.localhost"],
}

export default nextConfig
