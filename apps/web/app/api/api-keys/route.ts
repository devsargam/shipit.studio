import { NextRequest, NextResponse } from "next/server"
import { db, apiKeys } from "@workspace/database"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { requireSession } from "@/lib/auth-session"
import { generateApiKey, hashApiKey, getKeyPrefix } from "@/lib/api-keys"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const { name } = body as { name: string }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const key = generateApiKey()
    const keyHash = hashApiKey(key)
    const prefix = getKeyPrefix(key)

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        id: nanoid(),
        userId: session.user.id,
        name: name.trim(),
        keyHash,
        prefix,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json(
      { id: apiKey!.id, name: apiKey!.name, prefix: apiKey!.prefix, key },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create API key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await requireSession()

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
      .orderBy(apiKeys.createdAt)

    return NextResponse.json(keys)
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
