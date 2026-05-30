# Deploy NSE Pulse to Cloudflare Workers

## Error: "build token has been deleted or rolled"

This is a **Cloudflare dashboard setting**, not an app bug. The API token used for **Worker Builds** (Git integration) is invalid.

### Fix in Cloudflare Dashboard

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Select worker **`nse-momentum-pulse`**
3. Go to **Settings** → **Builds**
4. Under **API token**, click **Create new token** (or select a valid one)
5. Save **Build configuration** (important — do not use `npm run build` alone):
   - **Root directory:** `/` (project root)
   - **Build command:** `npx opennextjs-cloudflare build`  
     (runs `next build` + packages output into `.open-next/`)
   - **Deploy command:** `npx wrangler deploy`
   - **Node version:** `22` (or latest LTS)

### Error: "Could not find compiled Open Next config"

Cause: the build step ran only `next build` (`npm run build`), but deploy needs the **OpenNext** output in `.open-next/`.

| Step | Wrong | Correct |
|------|--------|---------|
| Build | `npm run build` | `npx opennextjs-cloudflare build` |
| Deploy | `npx wrangler deploy` | `npx wrangler deploy` (unchanged) |

Push latest code, update the build command in the dashboard, clear build cache, and retry.
6. **Retry deployment** from the Deployments tab

If it still fails: **Settings → Builds → Clear build cache**, then retry.

---

## Option A — Deploy from your PC (fastest)

No dashboard build token needed.

```powershell
npx wrangler login
npm run deploy
```

Uses your Cloudflare account via Wrangler CLI.

---

## Option B — GitHub Actions (recommended for CI)

1. Create a Cloudflare API token: **My Profile → API Tokens → Create Token**
   - Template: **Edit Cloudflare Workers**
   - Permissions: Account + Workers + D1 (read/write for your DB)

2. In GitHub repo → **Settings → Secrets and variables → Actions**, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (same as in `.env`)

3. Push to `main` — workflow `.github/workflows/deploy.yml` deploys automatically.

---

## Production notes

- **`wrangler.jsonc` must include** the `assets` block (`.open-next/assets`) and `WORKER_SELF_REFERENCE` — without this, CSS/JS return 404 on the live site.
- Set `"keep_names": false` in `wrangler.jsonc` to fix `__name is not defined` (next-themes).
- **D1** is bound as `DB` in `wrangler.jsonc` — contact form and online count work without REST env vars in production.
- **Do not** commit `.env` — use Cloudflare dashboard secrets only if you need extra vars.
- Local-only vars (`D1_TLS_INSECURE`, `NSE_TLS_INSECURE`) are not required on Cloudflare.
