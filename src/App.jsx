import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DemoLayout from './components/DemoLayout'
import Landing from './components/Landing'
import NotFound from './components/NotFound'

// ============================================================
// DEMO REGISTRY
// Add new demos here. Each demo is lazy-loaded so the landing
// page stays fast regardless of how many demos exist.
//
// To add a new demo:
//   1. Create a folder in src/demos/your-demo-name/
//   2. Add an index.jsx with a default export component
//   3. Add an entry below
//
// Set fullPage: true for demos with their own layout/header
// ============================================================

const demos = [
  {
    path: 'example-tool',
    title: 'Example Tool',
    component: lazy(() => import('./demos/example-tool')),
  },
  {
    path: 'ecoglo-luminance',
    title: 'Luminance Testing',
    component: lazy(() => import('./demos/ecoglo-luminance')),
    fullPage: true,
  },
  {
    path: 'cut',
    title: 'Cutting Optimizer',
    component: lazy(() => import('./demos/cut/src/DemoWrapper')),
    fullPage: true,
  },
]

function DemoLoader() {
  return (
    <div className="demo-loader">
      <div className="demo-loader-spinner" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {demos.map(({ path, title, component: Component, fullPage }) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              fullPage ? (
                <Suspense fallback={<DemoLoader />}>
                  <Component />
                </Suspense>
              ) : (
                <DemoLayout title={title}>
                  <Suspense fallback={<DemoLoader />}>
                    <Component />
                  </Suspense>
                </DemoLayout>
              )
            }
          />
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
