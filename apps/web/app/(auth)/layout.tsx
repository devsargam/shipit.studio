import { APP_NAME } from "@workspace/shared/constants"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        {APP_NAME}
      </Link>
      {children}
    </div>
  )
}
