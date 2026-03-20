"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Upload, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"

export default function NewSitePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const domain = typeof window !== "undefined" ? window.location.host : "shipit.studio"
  const protocol = domain.includes("localhost") ? "http" : "https"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a zip file to upload")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create site
      const createRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: slug, description }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error || "Failed to create site")
      }

      const site = await createRes.json()

      // Deploy
      const formData = new FormData()
      formData.append("file", file)

      const deployRes = await fetch(`/api/sites/${site.id}/deploy`, {
        method: "POST",
        body: formData,
      })

      if (!deployRes.ok) {
        const data = await deployRes.json()
        throw new Error(data.error || "Deployment failed")
      }

      router.push(`/sites/${site.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sites
      </Link>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Create a new site</CardTitle>
          <CardDescription>
            Upload a zip file with your static files — HTML, PDFs, images,
            videos, or anything you want to share online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Site name</Label>
              <Input
                id="name"
                placeholder="my-awesome-site"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {slug && (
                <p className="text-muted-foreground text-xs">
                  Your site will be available at{" "}
                  <span className="text-foreground font-medium">
                    {protocol}://{slug}.{domain}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="A brief description of your site"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload zip file</Label>
              <div
                className="border-border hover:border-foreground/20 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="text-muted-foreground mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">
                  {file ? (
                    <span className="text-foreground font-medium">
                      {file.name}{" "}
                      <span className="text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Click to select a .zip file (max 50MB)
                    </span>
                  )}
                </p>
              </div>
              <input
                ref={fileRef}
                id="file"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !slug}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Create & Deploy"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
