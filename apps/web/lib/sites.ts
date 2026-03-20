const RESERVED_SLUGS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "ftp",
  "smtp",
  "dashboard",
  "login",
  "register",
  "auth",
  "static",
  "assets",
  "cdn",
  "docs",
  "blog",
  "status",
  "help",
  "support",
])

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/

export function isValidSlug(slug: string): {
  valid: boolean
  error?: string
} {
  if (slug.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" }
  }
  if (slug.length > 63) {
    return { valid: false, error: "Name must be at most 63 characters" }
  }
  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        "Name must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens",
    }
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { valid: false, error: "This name is reserved" }
  }
  return { valid: true }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
