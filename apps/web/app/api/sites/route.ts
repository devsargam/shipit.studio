import { NextRequest, NextResponse } from "next/server"
import { db, sites } from "@workspace/database"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { requireSession } from "@/lib/auth-session"
import { isValidSlug } from "@/lib/sites"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const { name, description } = body as {
      name: string
      description?: string
    }

    const validation = isValidSlug(name)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if name is taken
    const existing = await db
      .select()
      .from(sites)
      .where(eq(sites.name, name))
      .get()
    if (existing) {
      return NextResponse.json(
        { error: "This name is already taken" },
        { status: 409 }
      )
    }

    const now = new Date()
    const site = await db
      .insert(sites)
      .values({
        id: nanoid(),
        userId: session.user.id,
        name,
        description: description || null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()

    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create site:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
