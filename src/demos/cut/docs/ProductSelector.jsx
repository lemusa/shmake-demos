import { useState, useMemo, useRef, useEffect } from "react";

const PRODUCTS = [
  { id: "p1", name: "Radiata Pine H3.2 90×45", category: "framing", grade: "MSG8", treatment: "H3.2", dims: "90×45", pricePerM: 4.50, stockLengths: [2400, 3000, 3600, 4200, 4800, 6000] },
  { id: "p2", name: "Radiata Pine H1.2 90×45", category: "framing", grade: "MSG8", treatment: "H1.2", dims: "90×45", pricePerM: 3.80, stockLengths: [2400, 3000, 3600, 4200, 4800, 6000] },
  { id: "p3", name: "Radiata Pine H3.2 140×45", category: "framing", grade: "MSG8", treatment: "H3.2", dims: "140×45", pricePerM: 6.90, stockLengths: [2400, 3000, 3600, 4800, 6000] },
  { id: "p4", name: "Radiata Pine H1.2 140×45", category: "framing", grade: "MSG8", treatment: "H1.2", dims: "140×45", pricePerM: 5.95, stockLengths: [2400, 3600, 4800, 6000] },
  { id: "p5", name: "Radiata Pine H3.2 190×45", category: "framing", grade: "MSG8", treatment: "H3.2", dims: "190×45", pricePerM: 9.20, stockLengths: [3600, 4800, 6000] },
  { id: "p6", name: "LVL Beam 200×45", category: "framing", grade: "LVL11", treatment: "—", dims: "200×45", pricePerM: 14.50, stockLengths: [4800, 6000, 7200] },
  { id: "p7", name: "LVL Beam 240×45", category: "framing", grade: "LVL11", treatment: "—", dims: "240×45", pricePerM: 17.80, stockLengths: [4800, 6000, 7200] },
  { id: "p8", name: "Kwila Decking 140×19", category: "decking", grade: "—", treatment: "Natural", dims: "140×19", pricePerM: 18.50, stockLengths: [1800, 2400, 3000, 3600] },
  { id: "p9", name: "Pine Decking H3.2 90×23", category: "decking", grade: "—", treatment: "H3.2", dims: "90×23", pricePerM: 5.20, stockLengths: [2400, 3600, 4800] },
  { id: "p10", name: "Vitex Decking 140×19", category: "decking", grade: "—", treatment: "Natural", dims: "140×19", pricePerM: 22.00, stockLengths: [1800, 2400, 3000] },
  { id: "p11", name: "Treated Pine Paling 150×19", category: "fencing", grade: "—", treatment: "H3.2", dims: "150×19", pricePerM: 2.80, stockLengths: [1200, 1500, 1800] },
  { id: "p12", name: "Treated Pine Paling 100×19", category: "fencing", grade: "—", treatment: "H3.2", dims: "100×19", pricePerM: 2.10, stockLengths: [1200, 1500, 1800] },
  { id: "p13", name: "Cedar Paling 150×20", category: "fencing", grade: "—", treatment: "Natural", dims: "150×20", pricePerM: 7.50, stockLengths: [1200, 1500, 1800, 2000] },
  { id: "p14", name: "Post H4 100×100", category: "fencing", grade: "—", treatment: "H4", dims: "100×100", pricePerM: 8.90, stockLengths: [2400, 3000, 3600] },
  { id: "p15", name: "Rail H3.2 65×35", category: "fencing", grade: "—", treatment: "H3.2", dims: "65×35", pricePerM: 2.40, stockLengths: [2400, 3000, 3600, 4800] },
  { id: "p16", name: "Fence Capping H3.2 65×19", category: "fencing", grade: "—", treatment: "H3.2", dims: "65×19", pricePerM: 1.80, stockLengths: [3600, 4800, 6000] },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "framing", label: "Framing" },
  { key: "decking", label: "Decking" },
  { key: "fencing", label: "Fencing" },
];

function TreatmentBadge({ t }) {
  if (!t || t === "—") return null;
  const isH = t.startsWith("H");
  return (
    <span style={{
      background: isH ? "#ECFDF5" : "#FEF3C7",
      color: isH ? "#047857" : "#92400E",
      padding: "1px 5px", borderRadius: 3, fontWeight: 600, fontSize: 10,
      lineHeight: "16px", whiteSpace: "nowrap",
    }}>
      {t}
    </span>
  );
}

function ProductSelector({ onSelect, selectedId, filterCategory, label }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(filterCategory || "all");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = PRODUCTS.find(p => p.id === selectedId);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (filterCategory) setActiveCategory(filterCategory);
  }, [filterCategory]);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.dims.includes(q) ||
        p.treatment.toLowerCase().includes(q) || p.grade.toLowerCase().includes(q);
    });
  }, [search, activeCategory]);

  const handleSelect = (product) => {
    onSelect?.(product);
    setIsOpen(false);
    setSearch("");
  };

  const fmt = (p) => `$${p.toFixed(2)}`;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>{label}</div>
      )}

      {/* Trigger */}
      <button
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 60); }}
        style={{
          width: "100%", padding: 0, border: "1.5px solid",
          borderColor: isOpen ? "#D97706" : "#D1D5DB",
          borderRadius: 8, background: "#fff", cursor: "pointer",
          display: "flex", alignItems: "stretch", overflow: "hidden",
          boxShadow: isOpen ? "0 0 0 3px rgba(217,119,6,0.08)" : "0 1px 2px rgba(0,0,0,0.04)",
          transition: "all 0.15s", textAlign: "left",
        }}
      >
        {selected ? (
          <>
            <div style={{
              background: "#1E3A5F", color: "#fff", padding: "10px 12px",
              display: "flex", alignItems: "center", fontWeight: 700, fontSize: 13,
              fontFamily: "monospace", minWidth: 66, justifyContent: "center", letterSpacing: 0.5,
            }}>
              {selected.dims}
            </div>
            <div style={{ flex: 1, padding: "6px 12px", minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "#1E293B",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {selected.name}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                {selected.grade !== "—" && <span style={{ fontWeight: 600 }}>{selected.grade}</span>}
                <TreatmentBadge t={selected.treatment} />
                <span>{selected.stockLengths.map(l => `${l/1000}m`).join(" · ")}</span>
              </div>
            </div>
            <div style={{
              padding: "6px 12px", display: "flex", flexDirection: "column",
              alignItems: "flex-end", justifyContent: "center", flexShrink: 0,
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#D97706", fontFamily: "monospace" }}>
                {fmt(selected.pricePerM)}/m
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>excl GST</div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, padding: "14px 16px", color: "#94A3B8", fontSize: 13 }}>
            Select a product…
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", color: "#94A3B8", flexShrink: 0 }}>
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <path d={isOpen ? "M4 10L8 6L12 10" : "M4 6L8 10L12 6"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", borderRadius: 10, border: "1.5px solid #E2E8F0",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          zIndex: 100, overflow: "hidden",
        }}>
          {/* Search + category filter */}
          <div style={{ padding: "10px 10px 8px" }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <svg width={15} height={15} viewBox="0 0 16 16" fill="none"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>
                <circle cx={7} cy={7} r={5} stroke="#64748B" strokeWidth={1.5} />
                <path d="M11 11L14 14" stroke="#64748B" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
              <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search size, treatment, name…"
                style={{
                  width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #E2E8F0",
                  borderRadius: 6, fontSize: 13, outline: "none", background: "#F8FAFC",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#D97706"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
            </div>
            {!filterCategory && (
              <div style={{ display: "flex", gap: 3 }}>
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setActiveCategory(c.key)}
                    style={{
                      padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      borderRadius: 4, border: "none",
                      background: activeCategory === c.key ? "#1E3A5F" : "transparent",
                      color: activeCategory === c.key ? "#fff" : "#64748B",
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column headers */}
          <div style={{
            display: "flex", padding: "5px 10px", borderTop: "1px solid #F1F5F9",
            borderBottom: "1px solid #F1F5F9", background: "#FAFBFC",
            fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            <div style={{ width: 58, textAlign: "center" }}>Size</div>
            <div style={{ flex: 1, paddingLeft: 10 }}>Product</div>
            <div style={{ width: 60, textAlign: "right" }}>$/m</div>
            <div style={{ width: 110, textAlign: "right", paddingRight: 4 }}>Lengths</div>
          </div>

          {/* Product rows */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                No products found
              </div>
            ) : (
              filtered.map(p => {
                const isSel = p.id === selectedId;
                return (
                  <button key={p.id} onClick={() => handleSelect(p)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      padding: "7px 10px", border: "none", cursor: "pointer",
                      background: isSel ? "#FFF7ED" : "#fff",
                      borderBottom: "1px solid #F8FAFC",
                      borderLeft: isSel ? "3px solid #D97706" : "3px solid transparent",
                      transition: "background 0.08s", textAlign: "left",
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSel ? "#FFF7ED" : "#fff"; }}
                  >
                    <div style={{
                      width: 58, textAlign: "center", fontWeight: 700, fontSize: 11,
                      fontFamily: "monospace", color: isSel ? "#1E3A5F" : "#475569",
                      background: isSel ? "#DBEAFE" : "#F1F5F9",
                      padding: "3px 0", borderRadius: 4, flexShrink: 0,
                    }}>
                      {p.dims}
                    </div>
                    <div style={{ flex: 1, paddingLeft: 10, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: "#1E293B",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, display: "flex", gap: 4, alignItems: "center" }}>
                        {p.grade !== "—" && <span style={{ fontWeight: 600 }}>{p.grade}</span>}
                        <TreatmentBadge t={p.treatment} />
                      </div>
                    </div>
                    <div style={{
                      width: 60, textAlign: "right", fontWeight: 700, fontSize: 13,
                      fontFamily: "monospace", color: isSel ? "#D97706" : "#475569", flexShrink: 0,
                    }}>
                      {fmt(p.pricePerM)}
                    </div>
                    <div style={{
                      width: 110, textAlign: "right", fontSize: 10, color: "#94A3B8",
                      paddingRight: 4, flexShrink: 0,
                    }}>
                      {p.stockLengths.map(l => `${l/1000}m`).join("  ")}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "5px 12px", borderTop: "1px solid #F1F5F9",
            fontSize: 10, color: "#94A3B8", background: "#FAFBFC",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
            {search && <span>matching "{search}"</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ============= DEMO =============
export default function Demo() {
  const [studs, setStuds] = useState("p1");
  const [plates, setPlates] = useState(null);
  const [lintel, setLintel] = useState(null);
  const [palings, setPalings] = useState(null);

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      maxWidth: 680, margin: "0 auto", padding: 24,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>
        Product Selector
      </h2>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
        Searchable, filterable product picker. Try typing "140", "H3.2", or "LVL".
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ProductSelector
          label="Studs / Framing"
          selectedId={studs}
          onSelect={p => setStuds(p.id)}
          filterCategory="framing"
        />

        <ProductSelector
          label="Top & Bottom Plates"
          selectedId={plates}
          onSelect={p => setPlates(p.id)}
          filterCategory="framing"
        />

        <ProductSelector
          label="Lintel (any category)"
          selectedId={lintel}
          onSelect={p => setLintel(p.id)}
        />

        <ProductSelector
          label="Palings"
          selectedId={palings}
          onSelect={p => setPalings(p.id)}
          filterCategory="fencing"
        />
      </div>

      <div style={{
        marginTop: 24, padding: 14, background: "#F8FAFC", borderRadius: 8,
        border: "1px solid #E2E8F0", fontSize: 12, color: "#64748B", lineHeight: 1.7,
      }}>
        <strong style={{ color: "#475569" }}>Props:</strong> {" "}
        <code>filterCategory</code> locks to a category (Studs, Plates, Palings above). 
        Without it, the dropdown shows category chips to filter across all products (Lintel above). {" "}
        <code>selectedId</code> + <code>onSelect</code> for controlled state.
      </div>
    </div>
  );
}
