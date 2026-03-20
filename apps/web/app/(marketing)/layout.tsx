import { APP_NAME } from "@workspace/shared/constants"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-muted-foreground text-center text-sm">
            &copy; {new Date().getFullYear()} {APP_NAME}. Ship faster, ship
            better.
          </p>
        </div>
      </footer>
    </div>
  )
}
