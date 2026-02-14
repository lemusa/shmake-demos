# SHMAKE Demos

Demo sandbox for sharing tools with clients. Hosted at `demo.shmake.nz`.

Demos are **unlisted** — no directory, no sitemap. If you have the link, you can see it. If you don't, you can't.

## Quick Start

```bash
npm install
npm run dev
```

## Adding a New Demo

1. **Create a folder** in `src/demos/`:

```
src/demos/acme-cutting-stock/
  index.jsx    ← default export component
```

2. **Register the route** in `src/App.jsx`:

```js
const demos = [
  {
    path: 'acme-cutting-stock',         // → demo.shmake.nz/acme-cutting-stock
    title: 'Cutting Stock Optimizer',    // shown in header
    component: lazy(() => import('./demos/acme-cutting-stock')),
  },
]
```

3. **Push to main** — Vercel deploys automatically.

That's it. The demo is now live at `demo.shmake.nz/acme-cutting-stock`.

## Demo Guidelines

- **Self-contained**: No auth, no database calls. All state lives in the component.
- **No navigation between demos**: Each demo is isolated. No links to other demos.
- **Use shared CSS classes**: `demo-card`, `demo-btn`, `demo-input`, `demo-table`, `demo-label` — see `index.css` for the full set.
- **Client-specific paths**: Use `clientname-toolname` format (e.g., `acme-cutting-stock`) so URLs are unguessable.

## Deployment (Vercel)

1. Create a new Vercel project linked to this repo
2. Add `demo.shmake.nz` as a custom domain in Project Settings → Domains
3. In your DNS, add a CNAME record: `demo` → `cname.vercel-dns.com`
4. Vercel handles SSL and deploys on push to main

### Vercel SPA Config

For client-side routing to work, add this `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Structure

```
src/
  App.jsx              ← Router + demo registry
  index.css            ← Global styles + shared utility classes
  main.jsx             ← Entry point
  components/
    DemoLayout.jsx     ← Shared header/footer wrapper
    Landing.jsx        ← Root page (logo + contact)
    NotFound.jsx       ← 404 (no hints about what exists)
  demos/
    example-tool/      ← Example demo (delete when you have real ones)
      index.jsx
```

## Workflow: Artifact → Demo

1. Build the tool with Claude as an artifact
2. Copy the component into `src/demos/client-tool-name/index.jsx`
3. Strip any artifact-specific boilerplate, use shared CSS classes where possible
4. Register the route in `App.jsx`
5. `git push` → live
