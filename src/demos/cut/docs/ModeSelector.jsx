import { useState } from "react";

// SVG icons for each mode — simple, recognisable at small sizes
const icons = {
  general: (color) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Circular saw blade */}
      <circle cx={12} cy={12} r={9} />
      <circle cx={12} cy={12} r={3} />
      {/* Teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const r1 = 9, r2 = 11;
        const rad = (a * Math.PI) / 180;
        const radN = ((a + 20) * Math.PI) / 180;
        return (
          <path key={a} d={`M${12 + r1 * Math.cos(rad)},${12 + r1 * Math.sin(rad)} L${12 + r2 * Math.cos(radN)},${12 + r2 * Math.sin(radN)}`}
            strokeWidth={1.5} />
        );
      })}
    </svg>
  ),
  fencing: (color) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Fence pickets */}
      <rect x={3} y={4} width={3} height={17} rx={0.5} />
      <rect x={10.5} y={4} width={3} height={17} rx={0.5} />
      <rect x={18} y={4} width={3} height={17} rx={0.5} />
      {/* Rails */}
      <line x1={3} y1={9} x2={21} y2={9} strokeWidth={2} />
      <line x1={3} y1={16} x2={21} y2={16} strokeWidth={2} />
    </svg>
  ),
  walls: (color) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Wall frame — studs + plates */}
      <rect x={2} y={3} width={20} height={18} rx={0.5} />
      {/* Top plate double */}
      <line x1={2} y1={5.5} x2={22} y2={5.5} />
      {/* Studs */}
      <line x1={7} y1={5.5} x2={7} y2={21} />
      <line x1={12} y1={5.5} x2={12} y2={21} />
      <line x1={17} y1={5.5} x2={17} y2={21} />
      {/* Nog */}
      <line x1={2} y1={13} x2={22} y2={13} />
    </svg>
  ),
  decking: (color) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Deck boards — perspective */}
      <line x1={2} y1={6} x2={22} y2={6} />
      <line x1={2} y1={10} x2={22} y2={10} />
      <line x1={2} y1={14} x2={22} y2={14} />
      <line x1={2} y1={18} x2={22} y2={18} />
      {/* Joists underneath hint */}
      <line x1={7} y1={5} x2={7} y2={19} strokeWidth={1} strokeDasharray="2 2" opacity={0.4} />
      <line x1={17} y1={5} x2={17} y2={19} strokeWidth={1} strokeDasharray="2 2" opacity={0.4} />
    </svg>
  ),
};

const MODES = [
  { key: "general", label: "General", enabled: true },
  { key: "fencing", label: "Fencing", enabled: true },
  { key: "walls", label: "Walls", enabled: true },
  { key: "decking", label: "Decking", enabled: false },
];

function ModeSelector({ activeMode, onModeChange }) {
  return (
    <div style={{
      display: "flex", width: "100%",
      background: "#E8ECF1",
      borderRadius: 10, padding: 3,
      gap: 3,
    }}>
      {MODES.map(mode => {
        const isActive = activeMode === mode.key;
        const isDisabled = !mode.enabled;
        const color = isActive ? "#fff" : isDisabled ? "#B0B8C4" : "#4A5568";

        return (
          <button
            key={mode.key}
            onClick={() => !isDisabled && onModeChange(mode.key)}
            disabled={isDisabled}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 8px",
              border: "none",
              borderRadius: 8,
              cursor: isDisabled ? "not-allowed" : "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              background: isActive
                ? "#1E3A5F"
                : "transparent",
              boxShadow: isActive
                ? "0 2px 8px rgba(30,58,95,0.3), 0 1px 2px rgba(0,0,0,0.1)"
                : "none",
            }}
          >
            {/* Icon */}
            <span style={{ display: "flex", alignItems: "center", opacity: isDisabled ? 0.5 : 1, transition: "opacity 0.2s" }}>
              {icons[mode.key](color)}
            </span>

            {/* Label */}
            <span style={{
              fontSize: 13, fontWeight: isActive ? 700 : 600, letterSpacing: 0.2,
              color, transition: "color 0.2s",
              opacity: isDisabled ? 0.5 : 1,
            }}>
              {mode.label}
            </span>

            {/* Coming soon badge for disabled */}
            {isDisabled && (
              <span style={{
                position: "absolute", top: -6, right: -2,
                fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                background: "#D97706", color: "#fff",
                padding: "2px 5px", borderRadius: 4,
                lineHeight: 1,
              }}>
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ========== DEMO ==========
export default function Demo() {
  const [mode, setMode] = useState("general");
  const [costing, setCosting] = useState(true);
  const [inclGst, setInclGst] = useState(false);

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      maxWidth: 800, margin: "0 auto", padding: "32px 16px",
    }}>
      {/* Top bar: mode selector + costing toggle */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        marginBottom: 24,
      }}>
        <div style={{ flex: 1 }}>
          <ModeSelector activeMode={mode} onModeChange={setMode} />
        </div>

        {/* Costing controls — compact */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 12, color: "#64748B", flexShrink: 0,
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <input type="checkbox" checked={costing} onChange={e => setCosting(e.target.checked)}
              style={{ accentColor: "#D97706" }} />
            <span style={{ fontWeight: 600 }}>Costing</span>
          </label>

          {costing && (
            <div style={{
              display: "flex", background: "#F1F5F9", borderRadius: 5, overflow: "hidden",
            }}>
              <button onClick={() => setInclGst(false)}
                style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                  background: !inclGst ? "#475569" : "transparent",
                  color: !inclGst ? "#fff" : "#64748B",
                }}>
                Excl
              </button>
              <button onClick={() => setInclGst(true)}
                style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                  background: inclGst ? "#475569" : "transparent",
                  color: inclGst ? "#fff" : "#64748B",
                }}>
                Incl GST
              </button>
            </div>
          )}

          <button style={{
            background: "none", border: "1px solid #E2E8F0", borderRadius: 6,
            padding: 5, cursor: "pointer", display: "flex", color: "#94A3B8",
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={12} cy={12} r={3} />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area placeholder */}
      <div style={{
        background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0",
        padding: 32, textAlign: "center", minHeight: 200,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>
          {MODES.find(m => m.key === mode)?.label} Mode
        </div>
        <div style={{ fontSize: 13, color: "#94A3B8" }}>
          Calculator content for {mode} goes here
        </div>
      </div>
    </div>
  );
}
