import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

type Database = PostgresJsDatabase<typeof schema>

let _db: Database | null = null

export function getDb(): Database {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!)
    _db = drizzle(client, { schema })
  }
  return _db
}

export const db = new Proxy({} as Database, {
  get(_, prop: string | symbol) {
    const instance = getDb()
    const value = instance[prop as keyof Database]
    if (typeof value === "function") {
      return value.bind(instance)
    }
    return value
  },
})

export * from "./schema"
export { schema }
