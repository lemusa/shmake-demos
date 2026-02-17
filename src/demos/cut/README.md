# shmakeCut

White-label cutting calculator embeddable on timber wholesaler websites. Multi-tenant SaaS — each wholesaler gets a branded calculator with their product catalogue.

## Architecture

```
shmakecut/
├── src/
│   ├── components/          # Calculator UI (standalone, no framework deps)
│   │   ├── CuttingOptimizer.jsx   # Main calculator component
│   │   └── CuttingOptimizer.css   # Self-contained styles (--tc-* vars)
│   ├── lib/
│   │   ├── cuttingAlgorithm.js    # Pure algorithm (zero deps)
│   │   ├── generateCuttingPlanPDF.js  # PDF export (jsPDF)
│   │   └── supabase.js            # Supabase client
│   ├── config/
│   │   └── embedConfig.js         # Tenant config fetcher + defaults
│   ├── admin/                     # Admin panel (lazy-loaded)
│   │   ├── AdminApp.jsx
│   │   ├── admin.css
│   │   └── components/
│   │       ├── AdminLogin.jsx
│   │       ├── TenantsList.jsx
│   │       └── TenantEditor.jsx
│   ├── main.jsx               # App entry (demo + admin)
│   └── embed.jsx              # Embed entry (IIFE bundle)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── vite.config.js             # App build config
├── vite.embed.config.js       # Embed library build config
└── .env.example
```

## Quick Start

```bash
npm install
cp .env.example .env          # Add your Supabase credentials
npm run dev                    # http://localhost:5173 (calculator demo)
                               # http://localhost:5173/#admin (admin panel)
```

## Supabase Setup

1. Create a new Supabase project
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Copy your URL and anon key to `.env`
4. Create an auth user and add them to `cut_admin_users`

## Build

```bash
npm run build          # App build → dist/app/
npm run build:embed    # Embed bundle → dist/embed/
npm run build:all      # Both
```

## Embedding on a Wholesaler's Site

```html
<div id="shmakecut"></div>
<script
  src="https://app.shmakecut.co.nz/embed/shmakecut.iife.js"
  data-key="TENANT_EMBED_KEY">
</script>
```

The embed script:
1. Reads `data-key` from the script tag
2. Calls Supabase RPC `get_embed_config` to fetch tenant config
3. Applies the tenant's theme as CSS custom properties
4. Renders the calculator into the target `<div>`

## Theming

Each tenant's theme is stored as JSON and injected as `--tc-*` CSS custom properties on the embed container. The calculator CSS uses only these variables — zero dependency on the host page's styles.

## Routes

| URL | What |
|---|---|
| `/` | Calculator demo (DEFAULT_CONFIG) |
| `/?embed_key=abc123` | Calculator preview with tenant config |
| `/#admin` | Admin panel (requires Supabase auth) |

## Database Schema

- `cut_tenants` — Wholesaler companies (branding, theme, settings, subscription)
- `cut_products` — Product catalogue per tenant (species, profile, lengths, pricing)
- `cut_presets` — Named product groups (Framing, Decking, etc.)
- `cut_analytics` — Usage tracking (page views, calculations)
- `cut_admin_users` — Admin access control

RLS policies ensure:
- Anon users can only read active tenant configs (via embed)
- Anon users can insert analytics events
- Authenticated admin users can CRUD everything
