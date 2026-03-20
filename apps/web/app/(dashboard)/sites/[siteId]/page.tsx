import { db, sites, deployments } from "@workspace/database"
import { eq, and, desc } from "drizzle-orm"
import { requireSession } from "@/lib/auth-session"
import { env } from "@/lib/env"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteDetail } from "./site-detail"

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const session = await requireSession()
  const { siteId } = await params

  const site = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))
    .get()

  if (!site) {
    redirect("/dashboard")
  }

  const siteDeployments = await db
    .select()
    .from(deployments)
    .where(eq(deployments.siteId, siteId))
    .orderBy(desc(deployments.createdAt))

  const domain = env.APP_DOMAIN
  const protocol = domain.includes("localhost") ? "http" : "https"

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sites
      </Link>

      <SiteDetail
        site={site}
        deployments={siteDeployments}
        siteUrl={`${protocol}://${site.name}.${domain}`}
      />
    </div>
  )
}
