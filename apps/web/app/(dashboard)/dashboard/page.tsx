import { db, sites } from "@workspace/database"
import { eq } from "drizzle-orm"
import { requireSession } from "@/lib/auth-session"
import { env } from "@/lib/env"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Plus, ExternalLink, Globe } from "lucide-react"

export default async function DashboardPage() {
  const session = await requireSession()
  const userSites = await db
    .select()
    .from(sites)
    .where(eq(sites.userId, session.user.id))
    .orderBy(sites.createdAt)

  const domain = env.APP_DOMAIN
  const protocol = domain.includes("localhost") ? "http" : "https"

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Sites</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deploy and share files instantly
          </p>
        </div>
        <Link href="/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Button>
        </Link>
      </div>

      {userSites.length === 0 ? (
        <div className="mt-16 text-center">
          <Globe className="text-muted-foreground mx-auto h-12 w-12" />
          <h2 className="mt-4 text-lg font-medium">No sites yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your first site to start sharing files
          </p>
          <Link href="/sites/new" className="mt-4 inline-block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first site
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {userSites.map((site) => {
            const siteUrl = `${protocol}://${site.name}.${domain}`
            return (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="border-border hover:border-foreground/20 rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium">{site.name}</h3>
                    {site.description && (
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {site.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      site.status === "active" ? "default" : "secondary"
                    }
                  >
                    {site.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{siteUrl}</span>
                </div>
                {site.customDomain && (
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{site.customDomain}</span>
                    {site.domainVerified ? (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        pending
                      </Badge>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
