import { NextRequest, NextResponse } from "next/server"
import { db, sites } from "@workspace/database"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/auth-session"
import dns from "node:dns/promises"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await requireSession()
    const { siteId } = await params
    const { domain } = (await req.json()) as { domain: string }

    const site = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))
      .get()

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Check domain is not already taken by another site
    const existingDomain = await db
      .select()
      .from(sites)
      .where(eq(sites.customDomain, domain))
      .get()

    if (existingDomain && existingDomain.id !== siteId) {
      return NextResponse.json(
        { error: "This domain is already in use" },
        { status: 409 }
      )
    }

    await db
      .update(sites)
      .set({
        customDomain: domain || null,
        domainVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, siteId))

    return NextResponse.json({
      success: true,
      instructions: domain
        ? `Add a CNAME record pointing "${domain}" to "shipit.studio"`
        : "Custom domain removed",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await requireSession()
    const { siteId } = await params

    const site = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))
      .get()

    if (!site || !site.customDomain) {
      return NextResponse.json(
        { error: "No custom domain configured" },
        { status: 404 }
      )
    }

    try {
      const records = await dns.resolveCname(site.customDomain)
      const verified = records.some(
        (r) => r === "shipit.studio" || r.endsWith(".shipit.studio")
      )

      if (verified) {
        await db
          .update(sites)
          .set({ domainVerified: true, updatedAt: new Date() })
          .where(eq(sites.id, siteId))
      }

      return NextResponse.json({
        domain: site.customDomain,
        verified,
        records,
      })
    } catch {
      return NextResponse.json({
        domain: site.customDomain,
        verified: false,
        records: [],
        error: "Could not resolve DNS records",
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
