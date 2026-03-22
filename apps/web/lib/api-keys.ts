import { nanoid } from "nanoid"
import { createHash } from "crypto"

const KEY_PREFIX = "sk_live_"

export function generateApiKey(): string {
  return `${KEY_PREFIX}${nanoid(32)}`
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

export function getKeyPrefix(key: string): string {
  return key.slice(0, 12)
}
