import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3"

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!

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
      Bucket: BUCKET,
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
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
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
        Bucket: BUCKET,
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

export async function deletePrefix(prefix: string) {
  const objects = await listObjects(prefix)
  if (objects.length === 0) return

  // S3 DeleteObjects supports max 1000 keys per request
  const batches: { key: string }[][] = []
  for (let i = 0; i < objects.length; i += 1000) {
    batches.push(objects.slice(i, i + 1000))
  }

  for (const batch of batches) {
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: batch.map((o) => ({ Key: o.key })),
        },
      })
    )
  }
}
