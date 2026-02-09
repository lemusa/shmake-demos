import React, { useState } from 'react'

/**
 * EXAMPLE DEMO
 *
 * This is a placeholder to show how demos plug in.
 * Replace this with your actual tool component.
 *
 * Each demo is a self-contained React component with a default export.
 * It receives no props — the DemoLayout wrapper handles branding/chrome.
 *
 * Tips:
 *   - Keep demos self-contained (no auth, no external DB calls)
 *   - All state lives in the component
 *   - If you need shared UI components (buttons, cards, inputs),
 *     add them to src/components/ui/ and import as needed
 */

export default function ExampleTool() {
  const [count, setCount] = useState(0)

  return (
    <div className="example-demo">
      <div className="example-demo-card">
        <h2>Example Tool</h2>
        <p>
          This is a placeholder demo. Replace it with your actual tool component.
          Each demo is a self-contained module in <code>src/demos/</code>.
        </p>
        <div className="example-demo-counter">
          <button onClick={() => setCount(c => c - 1)}>−</button>
          <span className="example-demo-count">{count}</span>
          <button onClick={() => setCount(c => c + 1)}>+</button>
        </div>
      </div>
    </div>
  )
}
