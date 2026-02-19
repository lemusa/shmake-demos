# SHMAKE Portal — Refined Spec

## Context

SHMAKE is Sam's product brand. shmakeCut (cutting calculator) is the first product. The portal is where paying clients manage their SHMAKE products. Currently, everything is managed by Sam via a super-admin panel. This spec adds a tenant-facing portal so clients can self-manage.

**Decisions locked in:**
1. Three separate Vercel projects, one repo, one Supabase project
2. Skip dashboard landing for v1 — go straight to shmakeCut on login
3. Supabase Edge Function for widget writes (calculations, leads)
4. Analytics folded into Overview for v1 (full Analytics page later)
5. Superadmin via Supabase dashboard for v1 (existing `#admin` stays as-is)
6. Widget as separate Vercel project for bundle isolation

---

## Domain Map

| Domain | Purpose | Auth | Vercel Project |
|--------|---------|------|----------------|
| `demo.shmake.nz` | PIN-gated demos (sales tool) | PIN code | Existing project (unchanged) |
| `portal.shmake.nz` | Client admin portal | Supabase email/password | New project |
| `widget.shmake.nz` | Embeddable calculator script | None (public, tenant-scoped) | New project |

---

## Repo Structure

Keep existing code in place. Add portal as a new top-level entry point. Share shmakeCut components via Vite path aliases.

```
shmake-demos/
├── src/
│   ├── main.jsx                    ← demo.shmake.nz entry (existing)
│   ├── App.jsx                     ← demo routing (existing)
│   ├── portal/                     ← NEW: portal.shmake.nz
│   │   ├── main.jsx                ← portal entry point
│   │   ├── PortalApp.jsx           ← auth shell + sidebar layout
│   │   ├── portal.css
│   │   ├── components/
│   │   │   ├── PortalLogin.jsx
│   │   │   └── PortalLayout.jsx    ← sidebar + topbar + content area
│   │   └── pages/
│   │       └── shmakecut/
│   │           ├── Overview.jsx    ← at-a-glance stats
│   │           ├── Leads.jsx       ← lead management table
│   │           ├── Products.jsx    ← product catalogue CRUD
│   │           └── Embed.jsx       ← embed code + settings + preview
│   ├── demos/
│   │   └── cut/                    ← existing, untouched
│   │       ├── src/
│   │       │   ├── components/     ← shared: calculator, product selectors
│   │       │   ├── lib/            ← shared: supabase, algorithms, PDF
│   │       │   ├── config/         ← shared: embedConfig
│   │       │   └── admin/          ← Sam's super-admin (stays as-is)
│   │       └── supabase/
│   │           └── migrations/
│   │               ├── 001–003     ← existing
│   │               └── 004_portal_users.sql  ← NEW
│   └── components/                 ← shared landing components (existing)
├── portal.html                     ← NEW: portal HTML entry
├── vite.config.js                  ← demo build (existing)
├── vite.portal.config.js           ← NEW: portal build
├── vite.widget.config.js           ← NEW: widget build (Phase 2)
├── vercel.json                     ← demo config (existing, SPA rewrite)
└── package.json
```

### Path Aliases (in vite.portal.config.js)

```js
resolve: {
  alias: {
    '@shmakecut': path.resolve(__dirname, 'src/demos/cut/src'),
  }
}
```

Portal pages import shared code as:
```js
import CuttingOptimizer from '@shmakecut/components/CuttingOptimizer';
import { fetchEmbedConfig } from '@shmakecut/config/embedConfig';
import { supabasePublic } from '@shmakecut/lib/supabase';
```

---

## Three Vercel Projects

### 1. demo.shmake.nz (existing — no changes)
- **Root dir**: `/`
- **Build**: `npm run build`
- **Output**: `dist/`
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 2. portal.shmake.nz (new)
- **Root dir**: `/`
- **Build command** (Vercel dashboard): `npm run build:portal`
- **Output dir** (Vercel dashboard): `dist-portal`
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Vercel rewrites configured in dashboard: `/(.*) → /portal.html` (SPA fallback)

### 3. widget.shmake.nz (Phase 2)
- **Root dir**: `/`
- **Build command** (Vercel dashboard): `npm run build:widget`
- **Output dir** (Vercel dashboard): `dist-widget`
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Static JS only — no SPA routing needed (IIFE script + static assets)

### package.json scripts
```json
{
  "build": "vite build",
  "build:portal": "vite build --config vite.portal.config.js",
  "build:widget": "vite build --config vite.widget.config.js",
  "dev:portal": "vite --config vite.portal.config.js"
}
```

---

## Database Changes

### Keep existing tables as-is
- `cut_tenants` — already has branding, settings, status, embed_key
- `cut_products` — product catalogue per tenant
- `cut_presets` — product groupings per tenant
- `cut_analytics_events` — usage tracking
- `cut_leads` — lead capture
- `cut_admin_users` — Sam's superadmin access

### New: Migration 004_portal_users.sql

```sql
-- Portal users: tenant employees who log in to manage their account
CREATE TABLE public.cut_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_users_tenant ON public.cut_portal_users(tenant_id);
CREATE INDEX idx_portal_users_auth ON public.cut_portal_users(auth_user_id);

ALTER TABLE public.cut_portal_users ENABLE ROW LEVEL SECURITY;

-- Helper: get the tenant_id for the current portal user
CREATE OR REPLACE FUNCTION public.get_portal_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.cut_portal_users
  WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Portal users can read their own user record
CREATE POLICY "Portal users read own record"
  ON public.cut_portal_users FOR SELECT
  USING (auth_user_id = auth.uid());

-- Portal users can read their own tenant
CREATE POLICY "Portal users read own tenant"
  ON public.cut_tenants FOR SELECT
  USING (id = public.get_portal_tenant_id());

-- Portal users can update own tenant (branding, settings — not status/billing)
CREATE POLICY "Portal users update own tenant"
  ON public.cut_tenants FOR UPDATE
  USING (id = public.get_portal_tenant_id());

-- Portal users: full CRUD on own products
CREATE POLICY "Portal users manage own products"
  ON public.cut_products FOR ALL
  USING (tenant_id = public.get_portal_tenant_id());

-- Portal users: full CRUD on own presets
CREATE POLICY "Portal users manage own presets"
  ON public.cut_presets FOR ALL
  USING (tenant_id = public.get_portal_tenant_id());

-- Portal users: read own analytics
CREATE POLICY "Portal users read own analytics"
  ON public.cut_analytics_events FOR SELECT
  USING (tenant_id = public.get_portal_tenant_id());

-- Portal users: read + update own leads
CREATE POLICY "Portal users read own leads"
  ON public.cut_leads FOR SELECT
  USING (tenant_id = public.get_portal_tenant_id());

CREATE POLICY "Portal users update own leads"
  ON public.cut_leads FOR UPDATE
  USING (tenant_id = public.get_portal_tenant_id());
```

### Future: tenant_products table (multi-product)

Not needed for v1 (only shmakeCut exists). When a second SHMAKE product is added:

```sql
CREATE TABLE public.shmake_tenant_products (
  tenant_id UUID REFERENCES cut_tenants(id),
  product_key TEXT NOT NULL,  -- 'shmakecut', 'future-product'
  enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (tenant_id, product_key)
);
```

---

## Auth Flow

### Portal login
1. Tenant visits `portal.shmake.nz`
2. PortalLogin shows email + password form
3. `supabase.auth.signInWithPassword({ email, password })`
4. On success, query `cut_portal_users` for the auth user's tenant_id
5. If no portal_user record → show "Account not found" (prevents random signups)
6. Store tenant context in React state
7. All subsequent queries scoped via RLS (`get_portal_tenant_id()`)

### Onboarding a new tenant
1. Sam creates tenant in Supabase dashboard (or via existing `#admin`)
2. Sam creates a Supabase auth user: `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
3. Sam inserts row into `cut_portal_users` linking auth_user_id → tenant_id
4. Sam sends tenant their login credentials (or a password reset link)
5. Tenant logs in at portal.shmake.nz

### Password reset
- Portal login page has "Forgot password?" link
- Uses `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://portal.shmake.nz/reset' })`
- Supabase Site URL config: `https://portal.shmake.nz`

---

## Widget Architecture (Phase 2)

### Reads (public)
No change. Widget fetches config via existing `get_embed_config(embed_key)` RPC using the anon key. This is read-only and already secured by RLS.

### Writes (edge function)
Replace direct Supabase inserts with calls to a Supabase Edge Function.

**Why edge function over direct inserts:**
- Validates tenant exists and is active
- Rate limiting
- Input sanitization
- Can add webhook/email notifications later without touching the widget

**Edge function: `supabase/functions/widget-event/index.ts`**
```
POST /functions/v1/widget-event
{
  "embed_key": "abc123",
  "event_type": "calculation_completed",
  "session_id": "...",
  "mode": "fencing",
  "data": { ... }
}
```

**Edge function: `supabase/functions/widget-lead/index.ts`**
```
POST /functions/v1/widget-lead
{
  "embed_key": "abc123",
  "session_id": "...",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "021...",
  "notes": "...",
  "capture_point": "pdf_export",
  "mode": "general",
  "summary": "...",
  "estimated_value": 450.00,
  "specification": { ... },
  "cut_list": { ... }
}
```

Both functions:
1. Look up tenant by embed_key → get tenant_id
2. Verify tenant status is active/trial
3. Insert into `cut_analytics_events` / `cut_leads` using service role
4. Return 200 OK (widget doesn't need response data)

### Widget embed code (what tenants paste on their site)
```html
<div id="shmakecut" data-key="EMBED_KEY"></div>
<script src="https://widget.shmake.nz/shmakecut.iife.js"></script>
```

### Changes to existing analytics.js
- Add a `WIDGET_API_URL` config (env var or derived from widget domain)
- `trackEvent()` switches from `supabasePublic.from().insert()` to `fetch(WIDGET_API_URL + '/widget-event', ...)`
- `saveLead()` switches similarly to `/widget-lead`
- Demo mode still no-ops

---

## Portal Pages (v1)

### PortalLayout
- **Topbar**: SHMAKE logo, tenant name, user menu (logout)
- **Sidebar**: Overview, Leads, Products, Embed
- **Content area**: renders active page

### 1. Overview
At-a-glance stats. Makes the tenant feel the tool is working.

- **This week**: calculations count, PDF exports, enquiries
- **New leads**: last 5, with name + project summary + status badge
- **Trend**: simple bar chart — calculations per day, last 30 days
- **Embed status**: "Live" (if any session_started events in last 7 days) or "Not yet installed"

Data comes from `cut_analytics_events` and `cut_leads` via RLS-scoped queries.

### 2. Leads
Full lead management. Reuses the schema from `cut_leads`.

- **Table**: date, name, email, phone, project summary, estimated value, status
- **Inline status dropdown**: New → Contacted → Quoted → Won → Lost
- **Click to expand**: full specification, cut list, internal notes field
- **Filters**: status, date range, search
- **Export CSV** (stretch)

### 3. Products
Product catalogue management. Reads/writes `cut_products` scoped to tenant.

- **Table**: profile image, name, dims, treatment, grade, price/m, lengths, active toggle
- **Add / Edit**: modal or inline form
- **Delete**: with confirmation
- **Category filter tabs**
- **Drag to reorder** (stretch — updates sort_order)

### 4. Embed
Everything needed to get the widget on their site.

- **Embed snippet**: copy-paste HTML (pre-filled with their embed_key)
- **Embed settings**: (reads/writes `cut_tenants.settings` and `cut_tenants.theme`)
  - Primary + accent colours
  - Logo URL
  - Costing on/off
  - Modes enabled (General, Fencing, Walls)
  - Lead capture on/off
  - "Send to [Name]" on/off
  - Notification email
- **Live preview**: iframe rendering their widget with current settings
- **Installation guide**: WordPress, Shopify, Squarespace, generic

---

## Implementation Phases

### Phase 1 — Portal MVP (get first client self-managing)
1. Migration 004: `cut_portal_users` + RLS policies
2. `vite.portal.config.js` + `portal.html` + Vercel project setup
3. `src/portal/` — login, layout shell, 4 pages
4. Portal pages read from existing `cut_*` tables via RLS
5. Products page: view + add/edit/delete
6. Leads page: view + status update
7. Embed page: snippet + settings
8. Overview page: basic stats

### Phase 2 — Widget isolation
9. `vite.widget.config.js` + Vercel project setup
10. Supabase Edge Functions for widget-event + widget-lead
11. Update analytics.js to call edge functions instead of direct inserts
12. Deploy widget.shmake.nz
13. Update embed snippet in portal to point at widget.shmake.nz

### Phase 3 — Polish
14. Password reset flow
15. Email notifications (new lead → tenant)
16. Weekly summary email
17. CSV export on leads
18. Full Analytics page (separate from Overview)

### Phase 4 — Scale
19. Superadmin page in portal (replace Supabase dashboard)
20. Self-serve onboarding
21. Billing (Stripe)
22. Additional SHMAKE products

---

## Verification

### Portal
1. Log in as a portal user → see only their tenant's data
2. Log in as a different tenant → see different data (RLS isolation)
3. Products: add, edit, delete → changes reflect in widget
4. Leads: status updates persist
5. Embed settings: change colours → preview updates
6. Overview: stats match actual data in tables

### Widget
1. Embed on a test page with tenant's embed_key → loads their products
2. Complete a calculation → event appears in tenant's analytics
3. Export PDF with lead capture → lead appears in tenant's leads table
4. Invalid embed_key → widget shows error / doesn't load
5. Rate limiting → excessive requests get blocked

### Auth isolation
1. Portal user cannot access another tenant's products (RLS)
2. Portal user cannot change tenant status/billing fields
3. Anon users cannot read leads or analytics
4. Existing demo.shmake.nz and #admin continue working unchanged
