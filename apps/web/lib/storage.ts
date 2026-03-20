import AdmZip from "adm-zip"
import fs from "node:fs/promises"
import path from "node:path"
import mimeTypes from "mime-types"

const STORAGE_PATH = process.env.SITES_STORAGE_PATH || "../../data/sites"

function getStorageRoot() {
  return path.resolve(process.cwd(), STORAGE_PATH)
}

export function getDeploymentPath(siteId: string, deploymentId: string) {
  return path.join(getStorageRoot(), siteId, deploymentId)
}

export async function extractZip(
  buffer: Buffer,
  siteId: string,
  deploymentId: string
): Promise<{ fileCount: number; totalSize: number }> {
  const destPath = getDeploymentPath(siteId, deploymentId)
  await fs.mkdir(destPath, { recursive: true })

  const zip = new AdmZip(buffer)
  const entries = zip.getEntries()

  // Check if all entries share a common root folder
  const nonDirEntries = entries.filter((e) => !e.isDirectory)
  const firstEntry = nonDirEntries[0]
  let commonPrefix = ""
  if (firstEntry) {
    const parts = firstEntry.entryName.split("/")
    if (parts.length > 1) {
      const candidate = parts[0] + "/"
      const allSharePrefix = nonDirEntries.every((e) =>
        e.entryName.startsWith(candidate)
      )
      if (allSharePrefix) {
        commonPrefix = candidate
      }
    }
  }

  let fileCount = 0
  let totalSize = 0

  for (const entry of entries) {
    if (entry.isDirectory) continue

    let relativePath = entry.entryName
    if (commonPrefix && relativePath.startsWith(commonPrefix)) {
      relativePath = relativePath.slice(commonPrefix.length)
    }
    if (!relativePath) continue

    // Prevent path traversal
    const resolved = path.resolve(destPath, relativePath)
    if (!resolved.startsWith(destPath)) {
      throw new Error("Zip contains path traversal")
    }

    await fs.mkdir(path.dirname(resolved), { recursive: true })
    await fs.writeFile(resolved, entry.getData())
    fileCount++
    totalSize += entry.header.size
  }

  return { fileCount, totalSize }
}

export async function readSiteFile(
  siteId: string,
  deploymentId: string,
  filePath: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  const deploymentPath = getDeploymentPath(siteId, deploymentId)

  // Normalize and prevent path traversal
  const normalized = path.normalize(filePath).replace(/^\/+/, "")
  const resolved = path.resolve(deploymentPath, normalized)
  if (!resolved.startsWith(deploymentPath)) {
    return null
  }

  // Try the exact path, then path/index.html, then path.html
  const candidates = [resolved]
  if (!path.extname(resolved)) {
    candidates.push(path.join(resolved, "index.html"))
    candidates.push(resolved + ".html")
  }

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) {
        const data = await fs.readFile(candidate)
        const ext = path.extname(candidate)
        const mimeType = mimeTypes.lookup(ext) || "application/octet-stream"
        return { data: Buffer.from(data), mimeType }
      }
    } catch {
      continue
    }
  }

  return null
}

export async function listFiles(
  siteId: string,
  deploymentId: string,
  dirPath: string = ""
): Promise<{ name: string; path: string; size: number; isDirectory: boolean }[]> {
  const deploymentPath = getDeploymentPath(siteId, deploymentId)
  const targetPath = dirPath
    ? path.resolve(deploymentPath, path.normalize(dirPath).replace(/^\/+/, ""))
    : deploymentPath

  if (!targetPath.startsWith(deploymentPath)) return []

  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    const results = await Promise.all(
      entries.map(async (entry) => {
        const relativePath = path.join(dirPath, entry.name)
        const fullPath = path.join(targetPath, entry.name)
        const stat = await fs.stat(fullPath)
        return {
          name: entry.name,
          path: relativePath,
          size: stat.size,
          isDirectory: entry.isDirectory(),
        }
      })
    )
    // Directories first, then alphabetical
    return results.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
}

export async function deleteDeploymentFiles(
  siteId: string,
  deploymentId: string
) {
  const deploymentPath = getDeploymentPath(siteId, deploymentId)
  await fs.rm(deploymentPath, { recursive: true, force: true })
}

export async function deleteSiteFiles(siteId: string) {
  const sitePath = path.join(getStorageRoot(), siteId)
  await fs.rm(sitePath, { recursive: true, force: true })
}
