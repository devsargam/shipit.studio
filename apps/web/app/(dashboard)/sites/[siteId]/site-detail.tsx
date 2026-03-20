"use client"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Separator } from "@workspace/ui/components/separator"
import {
  ExternalLink,
  Upload,
  Globe,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"

type Site = {
  id: string
  name: string
  description: string | null
  customDomain: string | null
  domainVerified: boolean
  status: string
  createdAt: Date
  updatedAt: Date
}

type Deployment = {
  id: string
  siteId: string
  status: string
  filePath: string
  fileCount: number
  totalSize: number
  createdAt: Date
}

export function SiteDetail({
  site,
  deployments,
  siteUrl,
}: {
  site: Site
  deployments: Deployment[]
  siteUrl: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [deploying, setDeploying] = useState(false)
  const [domain, setDomain] = useState(site.customDomain || "")
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainMessage, setDomainMessage] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleDeploy = async (file: File) => {
    setDeploying(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/sites/${site.id}/deploy`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Deployment failed")
      } else {
        router.refresh()
      }
    } finally {
      setDeploying(false)
    }
  }

  const handleSetDomain = async () => {
    setDomainLoading(true)
    setDomainMessage("")
    try {
      const res = await fetch(`/api/sites/${site.id}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (res.ok) {
        setDomainMessage(data.instructions)
        router.refresh()
      } else {
        setDomainMessage(data.error)
      }
    } finally {
      setDomainLoading(false)
    }
  }

  const handleVerifyDomain = async () => {
    setDomainLoading(true)
    try {
      const res = await fetch(`/api/sites/${site.id}/domain`)
      const data = await res.json()
      if (data.verified) {
        setDomainMessage("Domain verified!")
      } else {
        setDomainMessage("Domain not verified yet. Make sure your CNAME record is set.")
      }
      router.refresh()
    } finally {
      setDomainLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this site? This cannot be undone.")) return
    setDeleting(true)
    try {
      await fetch(`/api/sites/${site.id}`, { method: "DELETE" })
      router.push("/dashboard")
    } finally {
      setDeleting(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{site.name}</h1>
          {site.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {site.description}
            </p>
          )}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {siteUrl}
          </a>
        </div>
        <Badge variant={site.status === "active" ? "default" : "secondary"}>
          {site.status}
        </Badge>
      </div>

      <Tabs defaultValue="deployments" className="mt-6">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="domain">Custom Domain</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Deployments</h2>
            <div>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={deploying}
              >
                {deploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    New Deploy
                  </>
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleDeploy(f)
                }}
              />
            </div>
          </div>

          {deployments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No deployments yet. Upload a zip file to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {deployments.map((d) => (
                <div
                  key={d.id}
                  className="border-border flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {d.status === "live" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : d.status === "failed" ? (
                      <XCircle className="text-destructive h-4 w-4" />
                    ) : (
                      <Clock className="text-muted-foreground h-4 w-4" />
                    )}
                    <div>
                      <p className="font-mono text-sm">{d.id.slice(0, 8)}</p>
                      <p className="text-muted-foreground text-xs">
                        {d.fileCount} files, {formatBytes(d.totalSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={d.status === "live" ? "default" : "secondary"}
                    >
                      {d.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="domain" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Domain</CardTitle>
              <CardDescription>
                Point your own domain to this site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="app.example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <Button
                  onClick={handleSetDomain}
                  disabled={domainLoading}
                  variant="outline"
                >
                  {domainLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Set"
                  )}
                </Button>
              </div>

              {site.customDomain && (
                <div className="space-y-2">
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      Add a CNAME record pointing{" "}
                      <code className="font-mono text-sm font-medium">
                        {site.customDomain}
                      </code>{" "}
                      to{" "}
                      <code className="font-mono text-sm font-medium">
                        shipit.studio
                      </code>
                    </AlertDescription>
                  </Alert>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={site.domainVerified ? "default" : "secondary"}
                    >
                      {site.domainVerified ? "Verified" : "Pending"}
                    </Badge>
                    {!site.domainVerified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleVerifyDomain}
                        disabled={domainLoading}
                      >
                        Verify DNS
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {domainMessage && (
                <p className="text-muted-foreground text-sm">
                  {domainMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete this site and all its deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Site
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
