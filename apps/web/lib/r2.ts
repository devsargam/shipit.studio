import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { env } from "./env"

const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

function siteKey(siteId: string, deploymentId: string, filePath: string) {
  return `sites/${siteId}/${deploymentId}/${filePath}`
}

export async function uploadFile(
  siteId: string,
  deploymentId: string,
  filePath: string,
  data: Buffer,
  contentType: string
) {
  const key = siteKey(siteId, deploymentId, filePath)
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  )
}

export async function getFile(
  siteId: string,
  deploymentId: string,
  filePath: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const key = siteKey(siteId, deploymentId, filePath)
  try {
    const response = await r2.send(
      new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key })
    )
    const data = Buffer.from(await response.Body!.transformToByteArray())
    const contentType =
      response.ContentType || "application/octet-stream"
    return { data, contentType }
  } catch {
    return null
  }
}

export async function listObjects(
  prefix: string
): Promise<{ key: string; size: number }[]> {
  const results: { key: string; size: number }[] = []
  let continuationToken: string | undefined

  do {
    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    for (const obj of response.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined) {
        results.push({ key: obj.Key, size: obj.Size })
      }
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return results
}

export async function deleteObject(key: string) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    })
  )
}

export async function deletePrefix(prefix: string) {
  const objects = await listObjects(prefix)
  if (objects.length === 0) return

  const batches: { key: string }[][] = []
  for (let i = 0; i < objects.length; i += 1000) {
    batches.push(objects.slice(i, i + 1000))
  }

  for (const batch of batches) {
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET,
        Delete: {
          Objects: batch.map((o) => ({ Key: o.key })),
        },
      })
    )
  }
}
