"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Plus, Trash2, Copy, Check, Key } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchKeys = useCallback(async () => {
    const res = await fetch("/api/api-keys")
    if (res.ok) {
      setKeys(await res.json())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function createKey() {
    if (!newKeyName.trim()) return
    setCreating(true)
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setCreatedKey(data.key)
      setNewKeyName("")
      fetchKeys()
    }
    setCreating(false)
  }

  async function deleteKey(id: string) {
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id))
    }
  }

  async function copyKey() {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setCreatedKey(null)
      setNewKeyName("")
      setCopied(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage API keys for programmatic access
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Create Key
          </DialogTrigger>
          <DialogContent>
            {createdKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy this key now. You won&apos;t be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <code className="bg-muted break-all rounded px-3 py-2 text-xs">
                    {createdKey}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyKey}>
                    {copied ? (
                      <Check className="mr-2 h-3 w-3" />
                    ) : (
                      <Copy className="mr-2 h-3 w-3" />
                    )}
                    {copied ? "Copied" : "Copy to clipboard"}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleDialogChange(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Give your key a name to help you remember what it&apos;s
                    for.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g. CI/CD Pipeline"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createKey()}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={createKey}
                    disabled={!newKeyName.trim() || creating}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Loading...
          </div>
        ) : keys.length === 0 ? (
          <div className="mt-16 text-center">
            <Key className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="mt-4 text-lg font-medium">No API keys</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Create an API key to access shipit.studio programmatically
            </p>
          </div>
        ) : (
          <div className="divide-border divide-y rounded-lg border">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {key.prefix}...
                    {" · "}
                    Created{" "}
                    {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && (
                      <>
                        {" · "}
                        Last used{" "}
                        {new Date(key.lastUsedAt).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
