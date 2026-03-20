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
import { useState } from "react"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)

  const handleGitHubSignUp = async () => {
    setLoading(true)
    await signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Get started with ShipIt Studio</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignUp}
          disabled={loading}
        >
          <Github className="mr-2 h-4 w-4" />
          {loading ? "Creating account..." : "Continue with GitHub"}
        </Button>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
