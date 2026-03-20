import AdmZip from "adm-zip"
import mimeTypes from "mime-types"
import { uploadFile, getFile, listObjects, deletePrefix } from "./r2"

function getMimeType(fileName: string): string {
  return mimeTypes.lookup(fileName) || "application/octet-stream"
}

function stripCommonPrefix(entries: AdmZip.IZipEntry[]): string {
  const nonDirEntries = entries.filter((e) => !e.isDirectory)
  const firstEntry = nonDirEntries[0]
  if (!firstEntry) return ""

  const parts = firstEntry.entryName.split("/")
  if (parts.length <= 1) return ""

  const candidate = parts[0] + "/"
  const allShare = nonDirEntries.every((e) =>
    e.entryName.startsWith(candidate)
  )
  return allShare ? candidate : ""
}

export async function extractAndUploadZip(
  buffer: Buffer,
  siteId: string,
  deploymentId: string
): Promise<{ fileCount: number; totalSize: number }> {
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries()
  const commonPrefix = stripCommonPrefix(entries)

  let fileCount = 0
  let totalSize = 0

  for (const entry of entries) {
    if (entry.isDirectory) continue

    let relativePath = entry.entryName
    if (commonPrefix && relativePath.startsWith(commonPrefix)) {
      relativePath = relativePath.slice(commonPrefix.length)
    }
    if (!relativePath) continue

    const data = entry.getData()
    const contentType = getMimeType(relativePath)

    await uploadFile(siteId, deploymentId, relativePath, data, contentType)
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
  // Try exact path
  const result = await getFile(siteId, deploymentId, filePath)
  if (result) {
    return { data: result.data, mimeType: result.contentType }
  }

  // Try path/index.html
  const indexResult = await getFile(siteId, deploymentId, `${filePath}/index.html`)
  if (indexResult) {
    return { data: indexResult.data, mimeType: indexResult.contentType }
  }

  // Try path.html
  const htmlResult = await getFile(siteId, deploymentId, `${filePath}.html`)
  if (htmlResult) {
    return { data: htmlResult.data, mimeType: htmlResult.contentType }
  }

  return null
}

export async function listSiteFiles(
  siteId: string,
  deploymentId: string,
  dirPath: string = ""
): Promise<{ name: string; path: string; size: number; isDirectory: boolean }[]> {
  const prefix = dirPath
    ? `sites/${siteId}/${deploymentId}/${dirPath}/`
    : `sites/${siteId}/${deploymentId}/`

  const objects = await listObjects(prefix)

  const seen = new Set<string>()
  const results: { name: string; path: string; size: number; isDirectory: boolean }[] = []

  for (const obj of objects) {
    // Strip the prefix to get relative path
    const relative = obj.key.slice(prefix.length)
    if (!relative) continue

    const parts = relative.split("/")
    const name = parts[0]!

    // If there are more parts, this is a directory entry
    if (parts.length > 1) {
      if (!seen.has(name)) {
        seen.add(name)
        results.push({
          name,
          path: dirPath ? `${dirPath}/${name}` : name,
          size: 0,
          isDirectory: true,
        })
      }
    } else {
      results.push({
        name,
        path: dirPath ? `${dirPath}/${name}` : name,
        size: obj.size,
        isDirectory: false,
      })
    }
  }

  return results.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function deleteDeploymentFiles(
  siteId: string,
  deploymentId: string
) {
  await deletePrefix(`sites/${siteId}/${deploymentId}/`)
}

export async function deleteSiteFiles(siteId: string) {
  await deletePrefix(`sites/${siteId}/`)
}
