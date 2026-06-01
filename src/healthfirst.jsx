import { useState } from "react";

const SIDEBAR_LINKS = [
  { icon: "⊞", label: "Dashboard", id: "dashboard" },
  { icon: "👥", label: "Patients", id: "patients" },
  { icon: "📊", label: "Reports", id: "reports" },
  { icon: "⚙️", label: "Settings", id: "settings" },
];

const RISK_COLORS = {
  Normal: { bg: "#e6f7f1", text: "#1d9e75", border: "#1d9e75" },
  "High Risk": { bg: "#fdeaea", text: "#e24b4a", border: "#e24b4a" },
  Pending: { bg: "#fef6e7", text: "#ef9f27", border: "#ef9f27" },
};

const INITIAL_PATIENTS = [];

function Badge({ label }) {
  const c = RISK_COLORS[label] || RISK_COLORS["Pending"];
  return (
    <span style={{
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 20, padding: "2px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function Modal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", age: "", email: "",
    hemoglobin: "", wbc: "", platelets: "",
    risk: "Normal", remarks: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "8px 12px",
    border: "1px solid #d1d5db", borderRadius: 8,
    fontFamily: "inherit", fontSize: 13, outline: "none",
    background: "#fafafa", color: "#111",
    transition: "border 0.15s"
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4, display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        maxHeight: "90vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Add New Patient</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} placeholder="John Doe" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input style={inputStyle} placeholder="35" type="number" value={form.age} onChange={e => set("age", e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} placeholder="john@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>

        <div style={{ background: "#f9fafb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Blood Values</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[["Hemoglobin", "hemoglobin", "g/dL"], ["WBC", "wbc", "K/μL"], ["Platelets", "platelets", "K/μL"]].map(([lbl, key, unit]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl} <span style={{ color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>({unit})</span></label>
                <input style={inputStyle} placeholder="—" type="number" value={form[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Risk Level</label>
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.risk} onChange={e => set("risk", e.target.value)}>
            <option>Normal</option>
            <option>High Risk</option>
            <option>Pending</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>AI Remarks</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} placeholder="Enter clinical remarks..." value={form.remarks} onChange={e => set("remarks", e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid #d1d5db",
            background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#374151"
          }}>Cancel</button>
          <button onClick={() => { if (form.name && form.age) { onSave(form); onClose(); } }} style={{
            padding: "9px 20px", borderRadius: 8, border: "none",
            background: "#1d9e75", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}>Save Patient</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const addPatient = (form) => {
    setPatients(p => [...p, {
      id: Date.now(),
      name: form.name, age: form.age, email: form.email,
      blood: `Hb:${form.hemoglobin || "—"} WBC:${form.wbc || "—"} Plt:${form.platelets || "—"}`,
      risk: form.risk,
      remarks: form.remarks || "No remarks"
    }]);
  };

  const deletePatient = (id) => setPatients(p => p.filter(x => x.id !== id));

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: patients.length,
    normal: patients.filter(p => p.risk === "Normal").length,
    high: patients.filter(p => p.risk === "High Risk").length,
    pending: patients.filter(p => p.risk === "Pending").length,
  };

  const stats = [
    { label: "Total Patients", val: counts.total, icon: "👥", color: "#378add", accent: "#378add" },
    { label: "Normal / Healthy", val: counts.normal, icon: "✅", color: "#1d9e75", accent: "#1d9e75" },
    { label: "High Risk", val: counts.high, icon: "⚠️", color: "#e24b4a", accent: "#e24b4a" },
    { label: "Pending Analysis", val: counts.pending, icon: "⏳", color: "#ef9f27", accent: "#ef9f27" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f4f6f5", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        .nav-link:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        .action-btn:hover { background: #f3f4f6 !important; }
        .delete-btn:hover { background: #fdeaea !important; color: #e24b4a !important; }
        .add-btn:hover { background: #179063 !important; }
        .row-hover:hover { background: #f9fafb !important; }
        @media (max-width: 700px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .main-content { margin-left: 0 !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .table-head { display: none !important; }
          .patient-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; padding: 14px 16px !important; }
          .patient-row > * { width: 100% !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 200, minHeight: "100vh",
        background: "#0a3d2e",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50
      }}>
        <div style={{ padding: "20px 16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{
            width: 36, height: 36, background: "#1d9e75",
            borderRadius: 9, display: "flex", alignItems: "center",
            justifyContent: "center", marginBottom: 9, fontSize: 18
          }}>🩺</div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>HealthFirst</div>
          <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase", marginTop: 2 }}>Patient Intelligence</div>
        </div>

        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {SIDEBAR_LINKS.map(link => (
            <button key={link.id} className="nav-link" onClick={() => setActive(link.id)} style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "9px 10px",
              fontSize: 13, fontFamily: "inherit",
              color: active === link.id ? "#fff" : "rgba(255,255,255,0.55)",
              background: active === link.id ? "rgba(255,255,255,0.11)" : "transparent",
              border: "none", borderRadius: 7,
              cursor: "pointer", textAlign: "left", marginBottom: 2,
              transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 15 }}>{link.icon}</span>
              {link.label}
              {active === link.id && (
                <span style={{ marginLeft: "auto", width: 6, height: 6, background: "#1d9e75", borderRadius: "50%" }} />
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#5dcaa5", marginBottom: 4 }}>
            <span style={{ fontSize: 13 }}>🤖</span> AI-Powered
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", lineHeight: 1.5 }}>
            Blood test analysis powered by advanced AI
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 8 }}>HealthFirst © 2025</div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{
        display: "none", position: "fixed", top: 0, left: 0, right: 0,
        height: 52, background: "#0a3d2e",
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", zIndex: 60
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🩺</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>HealthFirst</span>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: "#1d9e75", color: "#fff", border: "none",
          borderRadius: 7, padding: "6px 12px", fontSize: 12,
          fontFamily: "inherit", fontWeight: 600, cursor: "pointer"
        }}>+ Add Patient</button>
      </div>

      {/* Main */}
      <div className="main-content" style={{ marginLeft: 200, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Topbar */}
        <div style={{
          background: "#fff", padding: "18px 28px",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 16
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>Patient Management</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Manage records and AI-powered blood test predictions</div>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#1d9e75", color: "#fff", border: "none",
            borderRadius: 8, padding: "9px 18px",
            fontSize: 13, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0,
            transition: "background 0.15s"
          }}>
            + Add Patient
          </button>
        </div>

        {/* Stats */}
        <div style={{ background: "#fff", padding: "18px 28px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={{
                border: `1px solid rgba(0,0,0,0.07)`,
                borderTop: `3px solid ${s.accent}`,
                borderRadius: 10, padding: 14,
                background: "#fff", transition: "all 0.2s", cursor: "default"
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 28px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#fff", border: "1px solid rgba(0,0,0,0.09)",
              borderRadius: 8, padding: "8px 12px", flex: 1, maxWidth: 340
            }}>
              <span style={{ color: "#9ca3af", fontSize: 15 }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: "inherit", color: "#111", width: "100%" }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
              {filtered.length} of {patients.length} patients
            </span>
          </div>

          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }}>
            {/* Table head */}
            <div className="table-head" style={{
              display: "grid",
              gridTemplateColumns: "2fr 0.6fr 1.8fr 1fr 1.8fr 0.8fr",
              padding: "10px 16px",
              background: "#f9fafb",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              fontSize: 10, fontWeight: 600,
              color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px"
            }}>
              {["Patient", "Age", "Blood Values", "Risk Level", "AI Remarks", "Actions"].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🩺</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 6 }}>No patients yet</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Click "Add Patient" to create the first record</div>
              </div>
            ) : filtered.map((p, i) => (
              <div key={p.id} className="row-hover patient-row" style={{
                display: "grid",
                gridTemplateColumns: "2fr 0.6fr 1.8fr 1fr 1.8fr 0.8fr",
                padding: "12px 16px",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                alignItems: "center", gap: 8,
                transition: "background 0.12s"
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{p.email || "—"}</div>
                </div>
                <div style={{ fontSize: 13, color: "#374151" }}>{p.age}</div>
                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{p.blood}</div>
                <div><Badge label={p.risk} /></div>
                <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.remarks}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="delete-btn" onClick={() => deletePatient(p.id)} style={{
                    padding: "4px 10px", borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "#fff", fontSize: 11,
                    cursor: "pointer", fontFamily: "inherit",
                    color: "#6b7280", transition: "all 0.15s"
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={addPatient} />}
    </div>
  );
}
