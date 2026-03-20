"use client"

import { signIn } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Github } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGitHubLogin = async () => {
    setLoading(true)
    await signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubLogin}
          disabled={loading}
        >
          <Github className="mr-2 h-4 w-4" />
          {loading ? "Signing in..." : "Continue with GitHub"}
        </Button>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
