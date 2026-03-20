import { APP_NAME } from "@workspace/shared/constants"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import { Upload, Globe, Zap, Share2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="px-4 py-24 text-center md:py-32">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Share anything on the web.
            <br />
            <span className="text-muted-foreground">Instantly.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">
            Upload your files — websites, PDFs, photos, videos — and get a
            shareable link in seconds. No config needed.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Start Shipping</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Log in
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            Free to start. No credit card required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Three steps. That&apos;s it.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              number="1"
              title="Name your site"
              description="Pick a name and get your own subdomain at yourname.shipit.studio"
            />
            <Step
              number="2"
              title="Upload a zip"
              description="Drag and drop your files — HTML, PDFs, images, videos, whatever you want to share"
            />
            <Step
              number="3"
              title="Share the link"
              description="Your content is live instantly. Share the URL with anyone."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Everything you need to ship
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Instant deploys"
              description="Upload and your site is live. No build steps, no waiting."
            />
            <Feature
              icon={<Globe className="h-5 w-5" />}
              title="Custom domains"
              description="Add your own domain with simple CNAME setup. SSL included."
            />
            <Feature
              icon={<Upload className="h-5 w-5" />}
              title="Host anything"
              description="Static sites, PDFs, images, videos — if it's a file, you can host it."
            />
            <Feature
              icon={<Share2 className="h-5 w-5" />}
              title="Shareable links"
              description="Every site gets a clean URL you can share anywhere."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to ship?
          </h2>
          <p className="text-muted-foreground mt-2">
            Get your site online in under a minute.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="bg-foreground text-background mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
        {number}
      </div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="border-border rounded-lg border p-4">
      <div className="text-foreground">{icon}</div>
      <h3 className="mt-2 font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  )
}
