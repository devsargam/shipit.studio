import { NextRequest, NextResponse } from "next/server"
import { db, sites, deployments } from "@workspace/database"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/auth-session"
import { deleteSiteFiles } from "@/lib/storage"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await requireSession()
    const { siteId } = await params

    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const siteDeployments = await db
      .select()
      .from(deployments)
      .where(eq(deployments.siteId, siteId))
      .orderBy(deployments.createdAt)

    return NextResponse.json({ site, deployments: siteDeployments })
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await requireSession()
    const { siteId } = await params

    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    await deleteSiteFiles(siteId)
    await db.delete(sites).where(eq(sites.id, siteId))

    return NextResponse.json({ success: true })
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
