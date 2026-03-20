import { betterAuth, type Auth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { getDb } from "@workspace/database"
import * as schema from "@workspace/database/schema"
import { getEnv } from "./env"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null

export function getAuth(): Auth {
  if (!_auth) {
    const env = getEnv()
    _auth = betterAuth({
      database: drizzleAdapter(getDb(), {
        provider: "pg",
        schema,
      }),
      socialProviders: {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      },
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60,
        },
      },
    })
  }
  return _auth as Auth
}
