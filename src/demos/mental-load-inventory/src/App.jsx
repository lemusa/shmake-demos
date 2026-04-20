import { useState, useEffect } from "react";

/* ───── constants ───── */
const CATEGORIES = ["Work", "Financial", "Family", "Health", "Personal", "Other"];
const CAT_COLORS = {
  Work: "#e07a2f", Financial: "#ca8a04", Family: "#16a34a",
  Health: "#0891b2", Personal: "#9333ea", Other: "#6b7280",
};

const QUADRANT_INFO = {
  focus:    { label: "Focus",       color: "#15803d", bg: "rgba(22,163,74,0.06)",  border: "rgba(22,163,74,0.18)",  emoji: "🎯" },
  accept:   { label: "Accept",      color: "#c2410c", bg: "rgba(234,88,12,0.05)",  border: "rgba(234,88,12,0.16)",  emoji: "🌊" },
  quickwin: { label: "Quick win",   color: "#0369a1", bg: "rgba(14,165,233,0.05)", border: "rgba(14,165,233,0.16)", emoji: "⚡" },
  journey:  { label: "Long game",   color: "#7c6f3e", bg: "rgba(161,138,52,0.06)", border: "rgba(161,138,52,0.18)", emoji: "🏔️" },
  letgo:    { label: "Let go",      color: "#7c3aed", bg: "rgba(124,58,237,0.04)", border: "rgba(124,58,237,0.13)", emoji: "🍃" },
};

function getQuadrant(item) {
  const dur = item.duration || 5;
  if (item.impact >= 6 && item.control >= 6) return "focus";
  if (item.impact >= 6 && item.control < 6) return "accept";
  if (item.impact < 6 && item.control >= 6) return dur >= 7 ? "journey" : "quickwin";
  return "letgo";
}

function getDriveLabel(v) {
  if (v <= 3) return "obligation";
  if (v >= 8) return "dream";
  if (v >= 6) return "aspiration";
  return "mixed";
}

function getUrgencyLabel(v) {
  if (v >= 8) return "burning";
  if (v >= 6) return "pressing";
  if (v >= 4) return "simmering";
  return "someday";
}

function generateId() { return Math.random().toString(36).slice(2, 9); }

const font = "'Segoe UI', system-ui, -apple-system, sans-serif";

/* ───── components ───── */
function QuadrantDot({ item, onHover, hovered }) {
  const x = ((item.control - 1) / 9) * 86 + 7;
  const y = 100 - (((item.impact - 1) / 9) * 86 + 7);
  const active = hovered === item.id;
  const urgency = item.urgency || 5;
  const r = 4 + (urgency / 10) * 7;
  return (
    <g
      style={{ transform: `translate(${x}%, ${y}%)`, cursor: "pointer" }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {active && <circle r={r + 10} fill={CAT_COLORS[item.category]} opacity={0.1} />}
      <circle
        r={active ? r + 3 : r}
        fill={CAT_COLORS[item.category]}
        opacity={active ? 1 : 0.85}
        stroke={active ? "#fff" : "rgba(255,255,255,0.6)"}
        strokeWidth={active ? 2.5 : 1.5}
        style={{ transition: "all 0.2s ease" }}
      />
      {/* Drive ring: dashed for obligations, solid for aspirations */}
      {(item.drive || 5) >= 7 && (
        <circle r={r + (active ? 6 : 3)} fill="none" stroke="#ca8a04" strokeWidth={1.5}
          strokeDasharray="0" opacity={0.5} style={{ transition: "all 0.2s" }} />
      )}
      {(item.drive || 5) <= 3 && (
        <circle r={r + (active ? 6 : 3)} fill="none" stroke="#78716c" strokeWidth={1}
          strokeDasharray="3 2" opacity={0.5} style={{ transition: "all 0.2s" }} />
      )}
      {active && (
        <>
          <rect x={r + 10} y={-17} width={item.name.length * 7 + 24} height={28} rx={8}
            fill="rgba(30,30,40,0.92)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <text x={r + 22} y={1} fontSize={12.5} fill="#fff" fontFamily={font} fontWeight={500}>{item.name}</text>
        </>
      )}
    </g>
  );
}

function Bar({ value, max = 10, color }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${(value / max) * 100}%`, height: "100%", borderRadius: 2, background: color, opacity: 0.75, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 9, color: "#a8a29e", minWidth: 12 }}>{value}</span>
    </div>
  );
}

function DriveTag({ drive }) {
  const d = drive || 5;
  if (d >= 7) return <span style={{ fontSize: 9, fontWeight: 700, color: "#ca8a04", letterSpacing: "0.06em" }}>★ WANT</span>;
  if (d <= 3) return <span style={{ fontSize: 9, fontWeight: 700, color: "#78716c", letterSpacing: "0.06em" }}>HAVE TO</span>;
  return null;
}

function UrgencyDot({ urgency }) {
  const u = urgency || 5;
  const color = u >= 8 ? "#dc2626" : u >= 6 ? "#ea580c" : u >= 4 ? "#ca8a04" : "#a8a29e";
  return <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} title={`Urgency: ${u}`} />;
}

function DurationTag({ duration }) {
  const d = duration || 5;
  if (d >= 8) return <span style={{ fontSize: 9, fontWeight: 600, color: "#7c6f3e", letterSpacing: "0.04em" }}>🏔️ long game</span>;
  if (d <= 2) return <span style={{ fontSize: 9, fontWeight: 600, color: "#0891b2", letterSpacing: "0.04em" }}>⚡ quick</span>;
  return null;
}

/* ───── landscape analysis ───── */
function buildLandscape(items) {
  if (!items.length) return [];
  const lines = [];
  const obligations = items.filter(i => (i.drive || 5) <= 3);
  const aspirations = items.filter(i => (i.drive || 5) >= 7);
  const burning = items.filter(i => (i.urgency || 5) >= 8);
  const neglectedDreams = aspirations.filter(i => (i.urgency || 5) <= 3);
  const obligationOverload = obligations.length > items.length * 0.6;
  const grouped = { focus: [], accept: [], quickwin: [], journey: [], letgo: [] };
  items.forEach(i => grouped[getQuadrant(i)].push(i));
  const focusDreams = aspirations.filter(i => getQuadrant(i) === "focus");

  // The big picture
  if (obligationOverload) {
    lines.push({ emoji: "⚖️", color: "#78716c", text: `Over ${Math.round(obligations.length / items.length * 100)}% of your mental load is obligations. Your brain is in "have to" mode — there's little room for what you actually want.` });
  }
  if (aspirations.length > 0 && obligations.length > 0) {
    lines.push({ emoji: "🧭", color: "#ca8a04", text: `You're balancing ${obligations.length} obligation${obligations.length !== 1 ? "s" : ""} against ${aspirations.length} thing${aspirations.length !== 1 ? "s" : ""} you genuinely want. ${aspirations.length >= obligations.length ? "That's a healthy ratio — your desires have a seat at the table." : "Your obligations are crowding out your aspirations."}` });
  }
  if (burning.length > 0) {
    lines.push({ emoji: "🔥", color: "#dc2626", text: `${burning.length} thing${burning.length !== 1 ? "s" : ""} feel${burning.length === 1 ? "s" : ""} urgent right now: ${burning.map(i => i.name).join(", ")}. ${burning.length >= 3 ? "That's a lot of fires — triage ruthlessly." : "Handle what you can, accept the rest."}` });
  }
  if (neglectedDreams.length > 0) {
    lines.push({ emoji: "💫", color: "#9333ea", text: `You have ${neglectedDreams.length} dream${neglectedDreams.length !== 1 ? "s" : ""} on the back burner (${neglectedDreams.map(i => i.name).join(", ")}). No urgency means they'll stay there forever unless you schedule them.` });
  }
  if (focusDreams.length > 0) {
    lines.push({ emoji: "🌟", color: "#15803d", text: `Good news: ${focusDreams.map(i => i.name).join(" and ")} ${focusDreams.length === 1 ? "is something" : "are things"} you want AND can act on. That's your sweet spot — protect time for ${focusDreams.length === 1 ? "it" : "them"}.` });
  }
  if (grouped.accept.length > 0) {
    const acceptObligations = grouped.accept.filter(i => (i.drive || 5) <= 3);
    if (acceptObligations.length > 0) {
      lines.push({ emoji: "🌊", color: "#c2410c", text: `${acceptObligations.map(i => i.name).join(" and ")} ${acceptObligations.length === 1 ? "is" : "are"} hitting hard, you can't control ${acceptObligations.length === 1 ? "it" : "them"}, AND ${acceptObligations.length === 1 ? "it's" : "they're"} not even something you chose. That's heavy — be gentle with yourself here.` });
    }
  }
  if (grouped.letgo.length > 0 && grouped.letgo.length >= items.length * 0.3) {
    lines.push({ emoji: "🍃", color: "#7c3aed", text: `Nearly a third of your list is low-impact, low-control stuff. Releasing those would free up real mental bandwidth.` });
  }
  // Quadrant tips
  if (grouped.focus.length > 0) {
    lines.push({ emoji: "🎯", color: "#15803d", text: `${grouped.focus.length} item${grouped.focus.length !== 1 ? "s" : ""} in your focus zone. Break them into the smallest next step. 25 minutes is enough to start.` });
  }
  if (grouped.quickwin.length > 0) {
    lines.push({ emoji: "⚡", color: "#0369a1", text: `${grouped.quickwin.length} quick win${grouped.quickwin.length !== 1 ? "s" : ""} ready to go. Batch them and knock them out — momentum is medicine.` });
  }
  if (grouped.journey.length > 0) {
    const journeyNames = grouped.journey.map(i => i.name).join(", ");
    lines.push({ emoji: "🏔️", color: "#7c6f3e", text: `${grouped.journey.length} long game${grouped.journey.length !== 1 ? "s" : ""}: ${journeyNames}. These won't happen overnight — break them into monthly milestones so progress feels real.` });
  }
  // Duration-aware insights
  const longDreamItems = items.filter(i => (i.duration || 5) >= 7 && (i.drive || 5) >= 7);
  if (longDreamItems.length > 0) {
    lines.push({ emoji: "🧗", color: "#7c6f3e", text: `${longDreamItems.map(i => i.name).join(" and ")} ${longDreamItems.length === 1 ? "is" : "are"} something you deeply want but ${longDreamItems.length === 1 ? "it's" : "they're"} a marathon, not a sprint. Celebrate small wins along the way.` });
  }
  const longObligations = items.filter(i => (i.duration || 5) >= 7 && (i.drive || 5) <= 3);
  if (longObligations.length > 0) {
    lines.push({ emoji: "⏳", color: "#78716c", text: `${longObligations.map(i => i.name).join(" and ")} — long commitments you didn't choose. If you can't exit, find ways to make the journey lighter.` });
  }
  return lines;
}

/* ───── main app ───── */
export default function App() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Work", impact: 5, control: 5, drive: 5, urgency: 5, duration: 5, notes: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("mental-load-items");
        if (r?.value) setItems(JSON.parse(r.value));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => { try { await window.storage.set("mental-load-items", JSON.stringify(items)); } catch {} })();
  }, [items, loaded]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", category: "Work", impact: 5, control: 5, drive: 5, urgency: 5, duration: 5, notes: "" });
    setShowForm(true);
  }
  function openEdit(item) {
    setEditing(item.id);
    setForm({ name: item.name, category: item.category, impact: item.impact, control: item.control, drive: item.drive || 5, urgency: item.urgency || 5, duration: item.duration || 5, notes: item.notes || "" });
    setShowForm(true);
  }
  function saveForm() {
    if (!form.name.trim()) return;
    if (editing) setItems(p => p.map(i => (i.id === editing ? { ...i, ...form } : i)));
    else setItems(p => [...p, { id: generateId(), ...form }]);
    setShowForm(false);
  }
  function deleteItem(id) { setItems(p => p.filter(i => i.id !== id)); }

  const sorted = [...items].sort((a, b) => {
    const ua = (a.urgency || 5), ub = (b.urgency || 5);
    const sa = a.impact * a.control * (1 + ua / 10), sb = b.impact * b.control * (1 + ub / 10);
    return sb - sa;
  });
  const grouped = { focus: [], accept: [], quickwin: [], journey: [], letgo: [] };
  items.forEach(i => grouped[getQuadrant(i)].push(i));
  const hasItems = items.length > 0;
  const landscape = buildLandscape(items);

  return (
    <div style={{
      minHeight: "100vh", fontFamily: font,
      background: "linear-gradient(170deg, #fefcf9 0%, #faf7f2 40%, #f7f4ee 100%)",
      color: "#292524",
    }}>
      {/* ── HEADER ── */}
      <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "28px 32px 22px", background: "rgba(255,255,255,0.5)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#a8a29e", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Mental Load Inventory</div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 300, color: "#1c1917" }}>What's weighing on you?</h1>
          </div>
          <button onClick={openAdd} style={{
            padding: "9px 24px", border: "none", borderRadius: 28, cursor: "pointer", fontSize: 14, fontWeight: 600,
            background: "linear-gradient(135deg, #f59e42, #ea580c)", color: "#fff", fontFamily: font,
            boxShadow: "0 4px 16px rgba(234,88,12,0.25)",
          }}>+ Add something</button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px 60px" }}>

        {!hasItems && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>☀️</div>
            <div style={{ fontSize: 22, color: "#78716c", fontWeight: 300, marginBottom: 10 }}>Your mind is clear — for now</div>
            <div style={{ fontSize: 15, color: "#a8a29e", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
              Tap <b style={{ color: "#ea580c" }}>+ Add something</b> to dump obligations, goals, worries — everything. We'll help you see the full picture.
            </div>
          </div>
        )}

        {hasItems && (
          <>
            {/* ── YOUR MENTAL LANDSCAPE ── */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#a8a29e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                Your mental landscape
              </div>
              <div style={{
                background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16,
                padding: "22px 26px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                {landscape.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{line.emoji}</span>
                    <div style={{ fontSize: 14, color: "#44403c", lineHeight: 1.7 }}>{line.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TWO-COLUMN: MAP + LIST ── */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 24, marginBottom: 32, alignItems: "start" }}>
              {/* Map */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#a8a29e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  Stress map <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11, color: "#c4b5a5" }}>— dot size = urgency</span>
                </div>
                <div style={{
                  position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "1.3 / 1",
                  background: "linear-gradient(135deg, #f5f0ea, #ede8e0)", border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ position: "absolute", top: 12, left: 14, fontSize: 11, color: QUADRANT_INFO.accept.color, opacity: 0.7, fontWeight: 600 }}>Accept & cope</div>
                  <div style={{ position: "absolute", top: 12, right: 14, fontSize: 11, color: QUADRANT_INFO.focus.color, opacity: 0.9, fontWeight: 600, textAlign: "right" }}>Focus zone ✦</div>
                  <div style={{ position: "absolute", bottom: 12, left: 14, fontSize: 11, color: "#a8a29e", fontWeight: 500 }}>Let go</div>
                  <div style={{ position: "absolute", bottom: 12, right: 14, fontSize: 11, color: QUADRANT_INFO.quickwin.color, opacity: 0.6, fontWeight: 600, textAlign: "right" }}>Quick wins / Long game</div>
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.07)" }} />
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.07)" }} />
                  <div style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "50%", background: "rgba(22,163,74,0.04)", borderRadius: "0 16px 0 0" }} />
                  <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                    {items.map(item => <QuadrantDot key={item.id} item={item} onHover={setHovered} hovered={hovered} />)}
                  </svg>
                </div>
                {/* Legend */}
                <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {CATEGORIES.filter(c => items.some(i => i.category === c)).map(c => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#78716c" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_COLORS[c] }} />{c}
                    </div>
                  ))}
                  <span style={{ fontSize: 10, color: "#c4b5a5", marginLeft: 6 }}>
                    ★ = want &nbsp; ┄ = have to
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#a8a29e", marginTop: 4 }}>
                  <span>← less control</span><span>more control →</span>
                </div>
              </div>

              {/* List */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#a8a29e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Everything on your plate</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
                  {sorted.map(item => {
                    const qi = QUADRANT_INFO[getQuadrant(item)];
                    return (
                      <div key={item.id} onClick={() => openEdit(item)} style={{
                        display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 12,
                        cursor: "pointer", border: `1px solid ${qi.border}`, background: qi.bg, transition: "all 0.15s",
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 2 }}>
                          <div style={{ width: 9, height: 9, borderRadius: "50%", background: CAT_COLORS[item.category] }} />
                          <UrgencyDot urgency={item.urgency} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: "#1c1917" }}>{item.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: qi.color, opacity: 0.75, textTransform: "uppercase" }}>{qi.label}</span>
                            <DriveTag drive={item.drive} />
                            <DurationTag duration={item.duration} />
                          </div>
                          {item.notes && <div style={{ fontSize: 12, color: "#a8a29e", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.notes}</div>}
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ fontSize: 9, color: "#a8a29e" }}>Impact</span>
                              <Bar value={item.impact} color="#e07a2f" />
                            </div>
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ fontSize: 9, color: "#a8a29e" }}>Control</span>
                              <Bar value={item.control} color="#0891b2" />
                            </div>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                          style={{ background: "none", border: "none", color: "#d6d3d1", cursor: "pointer", padding: "2px 5px", fontSize: 18, lineHeight: 1, flexShrink: 0, borderRadius: 6 }}
                          onMouseEnter={e => e.target.style.color = "#78716c"}
                          onMouseLeave={e => e.target.style.color = "#d6d3d1"}
                        >×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{
            background: "#fffcf8", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 22,
            padding: "30px 30px 26px", width: "100%", maxWidth: 500,
            boxShadow: "0 32px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 24px", fontSize: 21, fontWeight: 400, color: "#1c1917" }}>
              {editing ? "Edit this one" : "What's on your mind?"}
            </h2>

            {/* Name */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>What is it</label>
              <input autoFocus value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && saveForm()}
                placeholder="A goal, worry, task, obligation..."
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#e07a2f"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Category</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{
                    padding: "5px 13px", border: "1px solid", borderRadius: 20, cursor: "pointer",
                    fontSize: 13, fontFamily: font, fontWeight: 500,
                    borderColor: form.category === c ? CAT_COLORS[c] : "rgba(0,0,0,0.1)",
                    background: form.category === c ? `${CAT_COLORS[c]}15` : "transparent",
                    color: form.category === c ? CAT_COLORS[c] : "#78716c",
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Sliders in 2-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginBottom: 20 }}>
              {/* Impact */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Impact</label>
                  <span style={{ fontSize: 13, color: "#e07a2f", fontWeight: 700 }}>{form.impact}</span>
                </div>
                <input type="range" min={1} max={10} value={form.impact}
                  onChange={e => setForm(f => ({ ...f, impact: +e.target.value }))}
                  style={{ width: "100%", accentColor: "#e07a2f" }} />
                <div style={sliderLabelStyle}><span>barely</span><span>consuming</span></div>
              </div>
              {/* Control */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Control</label>
                  <span style={{ fontSize: 13, color: "#0891b2", fontWeight: 700 }}>{form.control}</span>
                </div>
                <input type="range" min={1} max={10} value={form.control}
                  onChange={e => setForm(f => ({ ...f, control: +e.target.value }))}
                  style={{ width: "100%", accentColor: "#0891b2" }} />
                <div style={sliderLabelStyle}><span>helpless</span><span>in charge</span></div>
              </div>
              {/* Drive */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Drive</label>
                  <span style={{ fontSize: 13, color: "#ca8a04", fontWeight: 700 }}>{form.drive}</span>
                </div>
                <input type="range" min={1} max={10} value={form.drive}
                  onChange={e => setForm(f => ({ ...f, drive: +e.target.value }))}
                  style={{ width: "100%", accentColor: "#ca8a04" }} />
                <div style={sliderLabelStyle}><span>have to</span><span>want to</span></div>
              </div>
              {/* Urgency */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Urgency</label>
                  <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>{form.urgency}</span>
                </div>
                <input type="range" min={1} max={10} value={form.urgency}
                  onChange={e => setForm(f => ({ ...f, urgency: +e.target.value }))}
                  style={{ width: "100%", accentColor: "#dc2626" }} />
                <div style={sliderLabelStyle}><span>someday</span><span>on fire</span></div>
              </div>
              {/* Duration */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Duration</label>
                  <span style={{ fontSize: 13, color: "#7c6f3e", fontWeight: 700 }}>{form.duration}</span>
                </div>
                <input type="range" min={1} max={10} value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                  style={{ width: "100%", accentColor: "#7c6f3e" }} />
                <div style={sliderLabelStyle}><span>minutes</span><span>years</span></div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Notes <span style={{ fontWeight: 400, opacity: 0.5, letterSpacing: 0, textTransform: "none" }}>(optional)</span></label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Context, triggers, next steps..."
                style={{ ...inputStyle, resize: "vertical", fontSize: 14 }}
                onFocus={e => e.target.style.borderColor = "#e07a2f"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: "10px 22px", background: "transparent", border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 14, color: "#78716c", cursor: "pointer", fontFamily: font, fontSize: 14,
              }}>Cancel</button>
              <button onClick={saveForm} style={{
                padding: "10px 28px", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 600,
                background: "linear-gradient(135deg, #f59e42, #ea580c)", color: "#fff", fontFamily: font,
                boxShadow: "0 4px 16px rgba(234,88,12,0.25)",
              }}>{editing ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, color: "#78716c", letterSpacing: "0.04em", marginBottom: 8, fontWeight: 600 };
const inputStyle = { width: "100%", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "11px 15px", color: "#1c1917", fontSize: 15, fontFamily: font, boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" };
const sliderLabelStyle = { display: "flex", justifyContent: "space-between", fontSize: 9, color: "#a8a29e", marginTop: 2 };
