import { NextRequest } from "next/server"
import { db, sites, deployments } from "@workspace/database"
import { eq, and } from "drizzle-orm"
import { readSiteFile, listFiles } from "@/lib/storage"

async function serveSite(
  siteId: string,
  deploymentId: string,
  filePath: string,
  siteName: string
) {
  // Try serving the exact file first
  const result = await readSiteFile(siteId, deploymentId, filePath)
  if (result) {
    return new Response(new Uint8Array(result.data), {
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "public, max-age=3600",
        "X-Served-By": "shipit.studio",
      },
    })
  }

  // No file found — try directory listing
  const dirPath = filePath === "index.html" ? "" : filePath
  const files = await listFiles(siteId, deploymentId, dirPath)

  if (files.length > 0) {
    return directoryListingResponse(siteName, dirPath, files)
  }

  return notFoundResponse()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const pathSegments = await params
  const segments = pathSegments.path

  if (!segments || segments.length === 0) {
    return notFoundResponse()
  }

  if (segments[0] === "_custom" && segments.length >= 2) {
    const customDomain = segments[1]!
    const site = await db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.customDomain, customDomain),
          eq(sites.domainVerified, true),
          eq(sites.status, "active")
        )
      )
      .get()

    if (!site) return notFoundResponse("Site not found for this domain")

    const liveDeployment = await db
      .select()
      .from(deployments)
      .where(
        and(
          eq(deployments.siteId, site.id),
          eq(deployments.status, "live")
        )
      )
      .get()

    if (!liveDeployment) return notFoundResponse("No active deployment")

    const filePath = segments.slice(2).join("/") || "index.html"
    return serveSite(site.id, liveDeployment.id, filePath, site.name)
  }

  // Subdomain: /api/serve/mysite/path/to/file
  const siteName = segments[0]!
  const filePath = segments.slice(1).join("/") || "index.html"

  const site = await db
    .select()
    .from(sites)
    .where(and(eq(sites.name, siteName), eq(sites.status, "active")))
    .get()

  if (!site) return notFoundResponse("Site not found")

  const liveDeployment = await db
    .select()
    .from(deployments)
    .where(
      and(
        eq(deployments.siteId, site.id),
        eq(deployments.status, "live")
      )
    )
    .get()

  if (!liveDeployment) return notFoundResponse("No active deployment")

  return serveSite(site.id, liveDeployment.id, filePath, site.name)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getFileIcon(name: string, isDirectory: boolean) {
  if (isDirectory) return "📁"
  const ext = name.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "pdf": return "📄"
    case "jpg": case "jpeg": case "png": case "gif": case "webp": case "svg": return "🖼️"
    case "mp4": case "webm": case "mov": case "avi": return "🎬"
    case "mp3": case "wav": case "ogg": case "flac": return "🎵"
    case "html": case "htm": return "🌐"
    case "css": return "🎨"
    case "js": case "ts": return "⚡"
    case "json": return "📋"
    case "zip": case "tar": case "gz": return "📦"
    case "eml": return "✉️"
    default: return "📎"
  }
}

function directoryListingResponse(
  siteName: string,
  dirPath: string,
  files: { name: string; path: string; size: number; isDirectory: boolean }[]
) {
  const breadcrumb = dirPath
    ? dirPath.split("/").map((part, i, arr) => {
        const href = "/" + arr.slice(0, i + 1).join("/")
        return `<a href="${href}" style="color:#0969da;text-decoration:none;">${part}</a>`
      }).join(" / ")
    : ""

  const rows = files
    .map((f) => {
      const icon = getFileIcon(f.name, f.isDirectory)
      const href = f.isDirectory ? `/${f.path}/` : `/${f.path}`
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          <span style="margin-right:8px;">${icon}</span>
          <a href="${href}" style="color:#0969da;text-decoration:none;">${f.name}${f.isDirectory ? "/" : ""}</a>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;text-align:right;white-space:nowrap;">
          ${f.isDirectory ? "—" : formatSize(f.size)}
        </td>
      </tr>`
    })
    .join("\n")

  const parentLink = dirPath
    ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;" colspan="2"><a href="/${dirPath.split("/").slice(0, -1).join("/")}" style="color:#0969da;text-decoration:none;">⬆️ ..</a></td></tr>`
    : ""

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${siteName}${dirPath ? " / " + dirPath : ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2328; background: #fff; }
    @media (prefers-color-scheme: dark) {
      body { background: #0d1117; color: #e6edf3; }
      table { border-color: #30363d !important; }
      tr td { border-color: #21262d !important; }
      a { color: #58a6ff !important; }
      .size { color: #8b949e !important; }
      .header { border-color: #30363d !important; }
      .footer { color: #484f58 !important; }
    }
  </style>
</head>
<body>
  <div style="max-width:720px;margin:0 auto;padding:24px 16px;">
    <div class="header" style="padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid #eee;">
      <h1 style="font-size:20px;font-weight:600;">${siteName}</h1>
      ${breadcrumb ? `<p style="font-size:13px;margin-top:4px;color:#666;">/ ${breadcrumb}</p>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${parentLink}
      ${rows}
    </table>
    <p class="footer" style="margin-top:24px;font-size:12px;color:#999;text-align:center;">
      ${files.length} item${files.length === 1 ? "" : "s"} · Powered by shipit.studio
    </p>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Served-By": "shipit.studio",
    },
  })
}

function notFoundResponse(message = "Not Found") {
  const html = `<!DOCTYPE html>
<html>
<head><title>404 - Not Found</title></head>
<body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; color: #333;">
  <div style="text-align: center;">
    <h1 style="font-size: 72px; margin: 0; font-weight: 200;">404</h1>
    <p style="color: #666; margin-top: 8px;">${message}</p>
    <p style="color: #999; font-size: 12px; margin-top: 24px;">Powered by shipit.studio</p>
  </div>
</body>
</html>`

  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html" },
  })
}
