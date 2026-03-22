import { headers } from "next/headers"
import { auth, type Session } from "./auth"
import { db, apiKeys, user } from "@workspace/database"
import { eq } from "drizzle-orm"
import { hashApiKey } from "./api-keys"

async function getSessionFromApiKey(
  authHeader: string
): Promise<Session | null> {
  const token = authHeader.replace("Bearer ", "")
  if (!token.startsWith("sk_live_")) return null

  const keyHash = hashApiKey(token)
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))

  if (!apiKey) return null

  const [dbUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, apiKey.userId))

  if (!dbUser) return null

  // Update lastUsedAt (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .then(() => {})
    .catch(() => {})

  return {
    session: {
      id: `apikey_${apiKey.id}`,
      userId: dbUser.id,
      token: "",
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: null,
      userAgent: null,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.createdAt,
    },
    user: dbUser,
  } as Session
}

export async function getSession() {
  const hdrs = await headers()

  // Check API key auth first
  const authHeader = hdrs.get("authorization")
  if (authHeader?.startsWith("Bearer sk_live_")) {
    return getSessionFromApiKey(authHeader)
  }

  // Fall back to Better Auth session (cookies)
  const session = await auth.api.getSession({
    headers: hdrs,
  })
  return session
}

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
