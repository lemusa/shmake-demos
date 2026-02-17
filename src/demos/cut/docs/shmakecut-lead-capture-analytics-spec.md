# shmakeCut: Lead Capture & Analytics — Spec

## Context

The cutting calculator runs on the timber yard's website. Without any usage tracking or lead capture, the yard owner has no way to measure the tool's value. This spec covers three layers: anonymous usage analytics, identified lead capture, and an admin dashboard where the yard owner sees it all.

This is a platform-level feature — it applies across all modes (General, Fencing, Walls, Decking).

---

## Layer 1: Anonymous Usage Analytics

Every calculation is logged, no user details required. This is passive — the customer doesn't know or care.

### What to Track

- **Calculation completed** — timestamp, mode (fencing/walls/general), key parameters
  - Fencing: total length, height, style, number of sections
  - Walls: wall length, height, number of openings
  - General: number of products, number of cuts
- **Estimated order value** — total material cost if costing is enabled, otherwise total lineal metres
- **Session data** — device type (mobile/desktop), referral source if available, time spent on calculator
- **Funnel steps** — how far through the form did they get? Started → Selected products → Calculated → Exported PDF. Drop-off points are useful.

### What NOT to Track

- IP addresses or anything that creates privacy obligations beyond what's needed
- Personal data at this layer — that's Layer 2

### Storage

Events stored against the tenant (yard) account. Retained for 12 months rolling. No cross-tenant analytics — each yard only sees their own data.

---

## Layer 2: Lead Capture

This is the point where an anonymous session becomes an identified lead. It happens at the moment the customer wants to take their results away.

### Capture Points

**Primary: PDF Export**
- Customer uses the calculator freely with zero friction
- When they click "Download PDF" or "Email my cut list", a modal appears:
  - Name (required)
  - Email (required)
  - Phone (optional)
  - Notes / message to the yard (optional, free text — e.g. "Can you deliver to Rangiora?")
- On submit: PDF is generated and either downloaded or emailed to the customer
- The lead + full cut list is saved and visible in the admin dashboard

**Secondary: "Send to [Yard Name]"**
- A button alongside the PDF export: "Send this to [Yard Name]"
- Same capture fields as above
- Instead of (or in addition to) downloading a PDF, the cut list is sent directly to the yard as an inbound enquiry
- The yard receives an email notification: "New enquiry from [Name] — 18m fence, $1,240 in materials — view details"
- This is the highest-intent action — it's basically a quote request

**Optional: Save for Later**
- "Email me a link to this calculation" — lighter touch, just requires email
- Sends a link that reloads the calculator with their configuration pre-filled
- Lower commitment than PDF export, but still captures an email
- Could be useful for customers who are still in the planning stage

> **Ask the user:** Should all three capture points be built for v1, or just the PDF gate + Send to Yard? Save for Later adds complexity (persistent calculation state, unique URLs) that may not be worth it yet.

### What Gets Captured Per Lead

```js
{
  id: "lead_xxx",
  tenantId: "yard_xxx",
  createdAt: "2026-02-17T14:30:00Z",
  
  // Contact
  name: "Dave Thompson",
  email: "dave@email.com",
  phone: "027 123 4567",        // optional
  notes: "Can you deliver?",     // optional
  
  // How they submitted
  capturePoint: "send_to_yard",  // "pdf_export" | "send_to_yard" | "save_for_later"
  
  // What they calculated
  mode: "fencing",
  summary: "18m fence, 1800mm, standard vertical, 2 sections",
  estimatedValue: 1240.50,       // if costing enabled, null otherwise
  
  // Full specification (stored as JSON)
  specification: { ... },        // complete form state — sections, products, quantities
  
  // Generated cut list (stored as JSON)
  cutList: { ... },              // full optimizer output
  
  // Status (managed by yard owner in dashboard)
  status: "new",                 // "new" | "contacted" | "quoted" | "won" | "lost"
}
```

### Privacy & Consent

- Clear statement on the capture modal: "Your details will be shared with [Yard Name] so they can follow up on your enquiry."
- No shmakeCut marketing — the lead belongs to the yard, full stop
- Yard's own privacy policy applies (link to it if they provide one)
- Comply with NZ Privacy Act 2020 — collected for a stated purpose, not used beyond that

---

## Layer 3: Admin Dashboard

The yard owner's view of everything above. This is where the tool proves its value.

### Dashboard Home — At a Glance

A simple summary panel, not a complex BI tool. These are busy people.

- **This week / this month** toggle
- Calculations completed (total count)
- PDF exports (count)
- Enquiries received (Send to Yard count)
- Estimated pipeline value (sum of estimated order values from leads)
- Most popular mode (fencing/walls/general)
- Conversion funnel: Calculated → Exported → Enquired (simple bar or percentage)

### Leads List

A table/list of captured leads, most recent first.

Columns:
- Date
- Name
- Contact (email, phone)
- Project summary (e.g. "12m fence, 1800mm standard vertical")
- Estimated value
- Status (dropdown: New → Contacted → Quoted → Won → Lost)
- Actions: View full spec, Download PDF, Reply (opens email client)

Filters:
- Status filter (show me all "New" leads)
- Date range
- Mode (fencing/walls/general)
- Search by name or email

### Lead Detail View

Click a lead to see the full picture:
- Contact info
- Their notes/message
- Complete specification (readable summary, not raw JSON)
- Cut list with quantities and products
- Downloadable PDF (same one the customer got)
- Status history (when it changed from New → Contacted etc.)
- Quick actions: email the customer, mark as quoted, add internal notes

### Usage Stats

A secondary tab — not the first thing they see, but available.

- Calculations per day/week/month (simple line chart)
- Breakdown by mode
- Average order value (if costing enabled)
- Popular configurations (e.g. "1800mm standard vertical fence" is your most calculated project)
- Device split (mobile vs desktop — useful for the yard to know how customers are using their site)
- Drop-off funnel (how many start vs complete vs export)

---

## Weekly Summary Email

Don't rely on the owner logging into a dashboard. Push the value to them.

**Subject:** "Your shmakeCut this week — [X] calculations, [Y] leads"

**Content:**
- Calculations completed this week
- New leads with names and project summaries
- Estimated pipeline value
- Link to dashboard for full details

Keep it to 3–4 lines and a table. These get read on phones.

**Frequency:** Weekly, sent Monday morning. If zero activity that week, still send it but keep it short: "Quiet week — 0 calculations. Here's a tip: share the calculator link on your Facebook page."

> **Ask the user:** Should the zero-activity email include a nudge/tip? Or skip sending entirely if there's nothing to report? Sending nothing means they forget the tool exists. Sending something keeps it front of mind but could feel naggy.

---

## Notification Emails

Real-time notifications for high-intent actions.

**"Send to Yard" enquiry:**
- Immediate email to the yard's configured notification address
- Subject: "New enquiry from [Name] — [Project Summary]"
- Body: name, email, phone, their message, project summary, estimated value, link to full detail in dashboard
- This should feel like an inbound order, not a system notification

**PDF export (optional, configurable):**
- The yard can choose whether to be notified on PDF exports
- Default: off (too noisy for busy yards)
- If on: daily digest rather than per-export

---

## Integration Points

### Where It Sits in the Codebase

- **Event logging** — lightweight client-side calls on key actions (calculation complete, PDF requested, form abandoned). Send to backend API.
- **Lead storage** — backend/database. Supabase tables or equivalent.
- **Admin dashboard** — separate route/page within the tenant admin area. Not part of the embedded widget.
- **Email notifications** — triggered by backend on lead creation. Use a transactional email service (Resend, Postmark, or similar).
- **Weekly digest** — scheduled job (cron or Supabase edge function).

### Tenant Configuration

In the yard's admin settings:
- Notification email address (where enquiries go)
- PDF export notification on/off
- Weekly summary on/off
- Whether "Send to [Yard Name]" is enabled (some might not want it initially)
- Custom message on the lead capture modal (optional — e.g. "We'll get back to you within 24 hours")

---

## What This Enables for shmakeCut's Business

Beyond serving the yard owner, this data helps you:

- **Demonstrate value at renewal time** — "Your calculator had 120 uses and 34 leads last quarter"
- **Case studies for new sales** — anonymised stats across tenants show the tool works
- **Product decisions** — which modes get used most? What configurations are popular? Where do people drop off?
- **Pricing confidence** — when you can say "yards using shmakeCut see X enquiries per month", the $129/month sells itself

---

## Questions to Resolve

1. Build all three capture points for v1 (PDF gate, Send to Yard, Save for Later) or just the first two?
2. Send weekly summary on zero-activity weeks or skip?
3. Should the dashboard be part of the shmakeCut admin app, or a standalone page/link the yard owner bookmarks?
4. Real-time notification for every "Send to Yard" enquiry, or batched daily?
5. Should usage analytics be visible to the yard owner from day one, or start with just the leads list and add stats later?

Do not assume answers. Ask the user and wait for direction.
