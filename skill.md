# shipit.studio — Agent API

Deploy static sites programmatically to shipit.studio.

## Authentication

All API requests require a Bearer token. Get an API key from the dashboard at `/settings/api-keys`, or create one via the API if you already have a key.

```
Authorization: Bearer sk_live_...
```

## API Endpoints

**Base URL:** `https://shipit.studio`

### Sites

**Create a site:**
```bash
curl -X POST https://shipit.studio/api/sites \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "my-site", "description": "My cool site"}'
```

The `name` becomes the subdomain: `https://my-site.shipit.studio`

**List site details:**
```bash
curl https://shipit.studio/api/sites/SITE_ID \
  -H "Authorization: Bearer sk_live_..."
```

**Delete a site:**
```bash
curl -X DELETE https://shipit.studio/api/sites/SITE_ID \
  -H "Authorization: Bearer sk_live_..."
```

### File Upload

**Upload a single file:**
```bash
curl -X PUT https://shipit.studio/api/sites/SITE_ID/files \
  -H "Authorization: Bearer sk_live_..." \
  -H "X-File-Path: index.html" \
  -H "Content-Type: text/html" \
  --data-binary @index.html
```

Returns: `{ "url": "https://my-site.shipit.studio/index.html", "path": "index.html" }`

**Upload multiple files** (call PUT for each file):
```bash
for f in index.html style.css app.js; do
  curl -X PUT https://shipit.studio/api/sites/SITE_ID/files \
    -H "Authorization: Bearer sk_live_..." \
    -H "X-File-Path: $f" \
    --data-binary @"$f"
done
```

**Upload to subdirectories:**
```bash
curl -X PUT https://shipit.studio/api/sites/SITE_ID/files \
  -H "Authorization: Bearer sk_live_..." \
  -H "X-File-Path: assets/style.css" \
  -H "Content-Type: text/css" \
  --data-binary @style.css
```

**List files:**
```bash
curl https://shipit.studio/api/sites/SITE_ID/files \
  -H "Authorization: Bearer sk_live_..."

# List files in a subdirectory:
curl "https://shipit.studio/api/sites/SITE_ID/files?path=assets" \
  -H "Authorization: Bearer sk_live_..."
```

**Delete a file:**
```bash
curl -X DELETE "https://shipit.studio/api/sites/SITE_ID/files?path=old-file.html" \
  -H "Authorization: Bearer sk_live_..."
```

### Deploy a Zip

**Upload a zip file** (extracts and deploys all files):
```bash
curl -X POST https://shipit.studio/api/sites/SITE_ID/deploy \
  -H "Authorization: Bearer sk_live_..." \
  -F "file=@site.zip"
```

### API Keys

**Create a key:**
```bash
curl -X POST https://shipit.studio/api/api-keys \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "my-key"}'
```

**List keys:**
```bash
curl https://shipit.studio/api/api-keys \
  -H "Authorization: Bearer sk_live_..."
```

**Delete a key:**
```bash
curl -X DELETE https://shipit.studio/api/api-keys/KEY_ID \
  -H "Authorization: Bearer sk_live_..."
```

## Quick Start

1. Create an API key at `https://shipit.studio/settings/api-keys`
2. Create a site: `curl -X POST .../api/sites -d '{"name":"my-site"}'`
3. Upload files: `curl -X PUT .../api/sites/SITE_ID/files -H "X-File-Path: index.html" --data-binary @index.html`
4. Visit `https://my-site.shipit.studio`
