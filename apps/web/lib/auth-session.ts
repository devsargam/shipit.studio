import { headers } from "next/headers"
import { getAuth } from "./auth"

export async function getSession() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
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
