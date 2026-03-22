import { NextRequest, NextResponse } from "next/server"
import { db, sites, deployments } from "@workspace/database"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { requireSession } from "@/lib/auth-session"
import { uploadFile, deleteObject } from "@/lib/r2"
import { listSiteFiles } from "@/lib/storage"
import { env } from "@/lib/env"

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB per file

async function getSiteAndDeployment(siteId: string, userId: string) {
  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, userId)))

  if (!site) return null

  // Find live deployment or create one
  let [deployment] = await db
    .select()
    .from(deployments)
    .where(
      and(eq(deployments.siteId, siteId), eq(deployments.status, "live"))
    )

  if (!deployment) {
    const deploymentId = nanoid()
    ;[deployment] = await db
      .insert(deployments)
      .values({
        id: deploymentId,
        siteId,
        status: "live",
        filePath: `${siteId}/${deploymentId}`,
        fileCount: 0,
        totalSize: 0,
        createdAt: new Date(),
      })
      .returning()
  }

  return { site, deployment: deployment! }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await requireSession()
    const { siteId } = await params

    const filePath = req.headers.get("x-file-path")
    if (!filePath) {
      return NextResponse.json(
        { error: "X-File-Path header is required" },
        { status: 400 }
      )
    }

    // Sanitize file path
    const normalizedPath = filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\.{2,}\//g, "")
    if (!normalizedPath) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      )
    }

    const result = await getSiteAndDeployment(siteId, session.user.id)
    if (!result) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = await req.arrayBuffer()
    if (body.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 413 }
      )
    }

    const contentType =
      req.headers.get("content-type") || "application/octet-stream"

    await uploadFile(
      siteId,
      result.deployment.id,
      normalizedPath,
      Buffer.from(body),
      contentType
    )

    // Update deployment stats
    await db
      .update(deployments)
      .set({
        fileCount: result.deployment.fileCount + 1,
        totalSize: result.deployment.totalSize + body.byteLength,
      })
      .where(eq(deployments.id, result.deployment.id))

    await db
      .update(sites)
      .set({ updatedAt: new Date() })
      .where(eq(sites.id, siteId))

    const domain = env.APP_DOMAIN
    const protocol = domain.includes("localhost") ? "http" : "https"
    const url = `${protocol}://${result.site.name}.${domain}/${normalizedPath}`

    return NextResponse.json({ url, path: normalizedPath }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("File upload failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
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

    const [deployment] = await db
      .select()
      .from(deployments)
      .where(
        and(eq(deployments.siteId, siteId), eq(deployments.status, "live"))
      )

    if (!deployment) {
      return NextResponse.json({ files: [] })
    }

    const path = req.nextUrl.searchParams.get("path") || ""
    const files = await listSiteFiles(siteId, deployment.id, path)

    return NextResponse.json({ files })
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
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await requireSession()
    const { siteId } = await params

    const filePath = req.nextUrl.searchParams.get("path")
    if (!filePath) {
      return NextResponse.json(
        { error: "path query parameter is required" },
        { status: 400 }
      )
    }

    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const [deployment] = await db
      .select()
      .from(deployments)
      .where(
        and(eq(deployments.siteId, siteId), eq(deployments.status, "live"))
      )

    if (!deployment) {
      return NextResponse.json(
        { error: "No active deployment" },
        { status: 404 }
      )
    }

    const key = `sites/${siteId}/${deployment.id}/${filePath}`
    await deleteObject(key)

    await db
      .update(sites)
      .set({ updatedAt: new Date() })
      .where(eq(sites.id, siteId))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("File delete failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
