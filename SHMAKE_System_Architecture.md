# SHMAKE — System Architecture

**Last updated:** February 2026

---

## Overview

Three frontend applications backed by a single Supabase project. Each app has its own Git repo, its own Vercel deployment, and its own subdomain. They share a database and auth system but deploy independently.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                 │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Auth     │  │  Tables  │  │  Edge Fns  │  │  Storage     │  │
│  │          │  │  14 core │  │            │  │  (receipts,  │  │
│  │  Admin   │  │  tables  │  │ validate-  │  │   logos,     │  │
│  │  login   │  │          │  │ pin        │  │   files)     │  │
│  │          │  │          │  │            │  │              │  │
│  │          │  │          │  │ submit-    │  │              │  │
│  │          │  │          │  │ enquiry    │  │              │  │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────┘  │
└──────────┬──────────┬──────────────┬──────────────┬────────────┘
           │          │              │              │
     Authenticated   Public      Public        Authenticated
     (RLS)        (service key) (service key)    (RLS)
           │          │              │              │
    ┌──────┴──┐  ┌────┴────┐  ┌─────┴─────┐       │
    │  admin  │  │  demo   │  │  shmake   │       │
    │.shmake  │  │.shmake  │  │  .nz      │       │
    │  .nz    │  │  .nz    │  │           │       │
    └─────────┘  └─────────┘  └───────────┘       │
         │                                         │
         └─────────────────────────────────────────┘
```

---

## Applications

### 1. shmake.nz — Marketing Site

| | |
|---|---|
| **Purpose** | Portfolio, about, contact form |
| **Hosting** | GitHub Pages (current) or Vercel (future) |
| **Repo** | `lemusa/shmake` |
| **Stack** | Static HTML (migrating to React later) |
| **Auth** | None |
| **Supabase access** | Edge function only (`submit-enquiry`) |

**How it connects:**
- Contact form submits to the `submit-enquiry` edge function
- Creates a row in the `enquiries` table with `source = 'website'`
- No Supabase client library needed — just a `fetch()` POST
- Can work with a `<script>` tag on the existing HTML site

**DNS:** Root domain → GitHub Pages (or Vercel when migrated)

---

### 2. demo.shmake.nz — Client Demo Sandbox

| | |
|---|---|
| **Purpose** | Host interactive tool demos for potential clients |
| **Hosting** | Vercel |
| **Repo** | `lemusa/shmake-demos` |
| **Stack** | Vite + React + React Router |
| **Auth** | None (pin-based access) |
| **Supabase access** | Edge function only (`validate-pin`) |

**How it connects:**
- Landing page has a pin input
- Pin submitted to `validate-pin` edge function
- Edge function checks the `demos` table, increments `view_count`, logs to `demo_views`
- Returns the demo slug → frontend navigates to `/{slug}`
- Demo components are lazy-loaded React modules in the codebase

**Key behaviour:**
- Adding a new demo tool = code deploy (new component + route in `App.jsx`)
- Managing access (create pin, deactivate, set expiry) = admin portal, no deploy
- No directory of demos — unlisted, pin-only access
- `robots.txt` disallows all indexing

**DNS:** CNAME `demo` → `cname.vercel-dns.com`

**Environment variables (Vercel):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

### 3. admin.shmake.nz — Admin Portal

| | |
|---|---|
| **Purpose** | Business management — jobs, clients, quotes, invoicing, expenses, demos, enquiries |
| **Hosting** | Vercel |
| **Repo** | `lemusa/shmake-admin` |
| **Stack** | Vite + React + Tailwind + Recharts + Lucide |
| **Auth** | Supabase Auth (email/password, single user) |
| **Supabase access** | Authenticated client (full RLS access) |

**How it connects:**
- Authenticated Supabase client reads/writes all tables directly
- RLS policies grant full access to authenticated users
- This is the only app that modifies data (other than the two public edge functions)

**Modules:**
- **Dashboard** — overview metrics, recent activity
- **Jobs** — project pipeline (lead → completed)
- **Tasks** — per-job task management
- **Clients** — client directory with contacts
- **Quotes** — line items, GST calc, PDF export
- **Invoices** — line items, GST calc, payment tracking, PDF export
- **Expenses** — logging, receipt upload, job linking
- **Reports** — P&L, GST summary, job profitability
- **Demos** — create/manage pins, view access stats
- **Enquiries** — lead pipeline, convert to client/job/quote
- **Settings** — business details, invoice/quote defaults, GST rate

**DNS:** CNAME `admin` → `cname.vercel-dns.com`

**Environment variables (Vercel):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Supabase Project

Single project shared by all three apps.

### Tables

**Core business:**

| Table | Purpose |
|---|---|
| `settings` | Business details, invoice/quote defaults, GST rate |
| `clients` | Client records |
| `contacts` | Multiple contacts per client |
| `jobs` | Projects with status pipeline |
| `tasks` | Per-job tasks |
| `quotes` | Quote headers (linked to job + client) |
| `quote_items` | Quote line items (auto-calculates totals + GST) |
| `invoices` | Invoice headers (linked to job + client + quote) |
| `invoice_items` | Invoice line items (auto-calculates totals + GST) |
| `expenses` | Expense records (optionally linked to job) |
| `notes` | Polymorphic notes (attachable to job, client, quote, invoice) |

**Demos:**

| Table | Purpose |
|---|---|
| `demos` | Demo definitions — slug, pin, client, expiry, view count |
| `demo_views` | Access log — timestamp, partial IP, user agent |

**Leads:**

| Table | Purpose |
|---|---|
| `enquiries` | Incoming leads — contact info, status pipeline, linked to client/job/demo |

### Edge Functions

| Function | Auth | Called by | Purpose |
|---|---|---|---|
| `validate-pin` | Public (`--no-verify-jwt`) | demo.shmake.nz | Validate demo pin, return slug, log view |
| `submit-enquiry` | Public (`--no-verify-jwt`) | shmake.nz | Accept contact form submissions |

Both use the service role key internally to bypass RLS.

### Auth

- Single admin user (you)
- Email/password login
- Only used by admin.shmake.nz
- RLS policies: authenticated = full access to all tables

### Storage Buckets

| Bucket | Purpose |
|---|---|
| `receipts` | Expense receipt uploads |
| `logos` | Business logo for PDF export |
| `files` | General attachments (future) |

---

## Pipeline Flow

```
shmake.nz                    admin.shmake.nz              demo.shmake.nz
─────────                    ───────────────              ──────────────

Visitor fills                 You see new enquiry
contact form ──── API ────→  in Enquiries module
                                    │
                              Add notes, update status
                                    │
                              Build demo tool ─── git push ──→ Component deployed
                                    │
                              Create pin in
                              Demos module ──── DB ────────→ Pin is live
                                    │
                              Send client the link + pin
                                                              Client enters pin
                                                              ──── API ────→ Validated
                                                              Demo loads
                                                              Views tracked ──→ You see stats
                                    │
                              Convert enquiry → client
                              Create job
                              Send quote
                              Send invoice
                              Track payment
                              Log expenses
                              Run reports at tax time
```

---

## DNS Summary

| Record | Type | Value |
|---|---|---|
| `shmake.nz` | A / CNAME | GitHub Pages (or Vercel later) |
| `demo.shmake.nz` | CNAME | `cname.vercel-dns.com` |
| `admin.shmake.nz` | CNAME | `cname.vercel-dns.com` |

---

## Repo Summary

| Repo | Deploys to | Stack |
|---|---|---|
| `lemusa/shmake` | shmake.nz | Static HTML (→ React later) |
| `lemusa/shmake-demos` | demo.shmake.nz | Vite + React |
| `lemusa/shmake-admin` | admin.shmake.nz | Vite + React + Tailwind |

---

## Future Considerations

- **Multi-tenancy:** Schema is designed for single user. Adding `org_id` to all tables enables multi-tenant use (e.g. forking for brother's cabinet installation business). Settings table becomes per-org config.
- **shmake.nz React migration:** Convert to Vite + React, deploy on Vercel, share Supabase project. Contact form becomes a React component.
- **Stripe integration:** Webhook edge function for subscription tracking (myMECA, TeaBreak). Separate tables for subscriptions/transactions, feeding into the Reports module.
- **Email notifications:** Edge function sends email (via Resend/Postmark) when new enquiry arrives, or when invoice is sent.
