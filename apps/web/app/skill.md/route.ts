import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { resolve } from "path"

export async function GET() {
  try {
    // skill.md lives at repo root, cwd is apps/web
    const paths = [
      resolve(process.cwd(), "skill.md"),
      resolve(process.cwd(), "../../skill.md"),
    ]

    let content: string | null = null
    for (const p of paths) {
      try {
        content = await readFile(p, "utf-8")
        break
      } catch {
        continue
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: "skill.md not found" },
        { status: 404 }
      )
    }

    return new NextResponse(content, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
