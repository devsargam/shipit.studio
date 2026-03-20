import { NextRequest, NextResponse } from "next/server"
import { db, sites, deployments } from "@workspace/database"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { requireSession } from "@/lib/auth-session"
import { extractZip } from "@/lib/storage"

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(
  req: NextRequest,
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

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const deploymentId = nanoid()

    // Set site status to deploying
    await db
      .update(sites)
      .set({ status: "deploying", updatedAt: new Date() })
      .where(eq(sites.id, siteId))

    try {
      const { fileCount, totalSize } = await extractZip(
        buffer,
        siteId,
        deploymentId
      )

      // Mark previous live deployments as inactive
      await db
        .update(deployments)
        .set({ status: "failed" })
        .where(
          and(
            eq(deployments.siteId, siteId),
            eq(deployments.status, "live")
          )
        )

      // Create deployment record
      const deployment = await db
        .insert(deployments)
        .values({
          id: deploymentId,
          siteId,
          status: "live",
          filePath: `${siteId}/${deploymentId}`,
          fileCount,
          totalSize,
          createdAt: new Date(),
        })
        .returning()
        .get()

      // Update site status
      await db
        .update(sites)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(sites.id, siteId))

      return NextResponse.json(deployment, { status: 201 })
    } catch (error) {
      // Reset site status on failure
      await db
        .update(sites)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(sites.id, siteId))
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Deploy failed:", error)
    return NextResponse.json(
      { error: "Deployment failed" },
      { status: 500 }
    )
  }
}
