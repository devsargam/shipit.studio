import { NextRequest, NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const url = req.nextUrl.clone()

  // Extract subdomain
  let subdomain: string | null = null

  if (host.endsWith(".localhost:3000") || host.endsWith(".localhost")) {
    // Local dev: mysite.localhost:3000
    subdomain = host.split(".localhost")[0] || null
  } else if (host.endsWith(".shipit.studio")) {
    // Production: mysite.shipit.studio
    subdomain = host.replace(".shipit.studio", "")
  } else if (
    !host.includes("localhost") &&
    !host.includes("shipit.studio") &&
    host.includes(".")
  ) {
    // Custom domain: app.example.com
    // Rewrite to serve route with custom domain marker
    url.pathname = `/api/serve/_custom/${host}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Skip if main domain or www
  if (!subdomain || subdomain === "www") {
    return NextResponse.next()
  }

  // Rewrite subdomain requests to serve API
  url.pathname = `/api/serve/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    "/((?!_next|api/auth|api/sites|api/serve|favicon.ico).*)",
  ],
}
