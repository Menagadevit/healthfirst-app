import { useState, useEffect, useCallback } from "react";

/* ─── Persistence ─────────────────────────────────────────────────────────── */
const KEY = "healthfirst_v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
const uid  = () => `hf_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

/* ─── Validation ──────────────────────────────────────────────────────────── */
function validate(f) {
  const e = {};
  if (!f.fullName.trim())     e.fullName    = "Full name is required.";
  if (!f.dob)                 e.dob         = "Date of birth is required.";
  else if (new Date(f.dob) >= new Date()) e.dob = "Cannot be a future date.";
  if (!f.email.trim())        e.email       = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email.";
  ["glucose","haemoglobin","cholesterol"].forEach(k => {
    if (f[k] === "") e[k] = "Required.";
    else if (isNaN(+f[k]) || +f[k] < 0) e[k] = "Must be a positive number.";
  });
  return e;
}

/* ─── AI ──────────────────────────────────────────────────────────────────── */
async function aiAnalyse({ glucose, haemoglobin, cholesterol, dob }) {
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000,
      messages: [{ role: "user", content:
        `You are a clinical AI. Analyse these blood test results and write a 2-sentence professional health risk assessment. Be specific about conditions if values are abnormal. Plain text only, no markdown.

Age: ${age} years | Glucose: ${glucose} mg/dL (ref 70–99) | Haemoglobin: ${haemoglobin} g/dL (ref 12–17) | Cholesterol: ${cholesterol} mg/dL (ref <200)` }]
    })
  });
  const d = await r.json();
  return d?.content?.find(b => b.type === "text")?.text?.trim() || "Analysis unavailable.";
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const age = dob => dob ? new Date().getFullYear() - new Date(dob).getFullYear() : "—";
const fmt  = dob => dob ? new Date(dob).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const blank = { fullName:"", dob:"", email:"", glucose:"", haemoglobin:"", cholesterol:"" };

function risk(remarks = "") {
  const r = remarks.toLowerCase();
  if (r.match(/high risk|diabetes|critical|severe|significantly elevated/))
    return { label:"High Risk",   dot:"#EF4444", pill:"#FEE2E2", text:"#B91C1C" };
  if (r.match(/borderline|moderate|monitor|prediabetes|attention|slightly/))
    return { label:"Moderate",    dot:"#F59E0B", pill:"#FEF3C7", text:"#92400E" };
  if (r.match(/normal|healthy|within|no significant|well-controlled/))
    return { label:"Normal",      dot:"#10B981", pill:"#D1FAE5", text:"#065F46" };
  if (remarks)
    return { label:"Reviewed",    dot:"#6366F1", pill:"#EEF2FF", text:"#3730A3" };
  return   { label:"Pending",     dot:"#9CA3AF", pill:"#F3F4F6", text:"#6B7280" };
}

/* ─── Micro UI ────────────────────────────────────────────────────────────── */
const C = {
  teal:   "#0D9488",
  teal2:  "#0F766E",
  tealLt: "#CCFBF1",
  green:  "#10B981",
  bg:     "#F0FDF8",
  sidebar:"#0D3D36",
  white:  "#FFFFFF",
  border: "#E2E8F0",
  text:   "#0F172A",
  muted:  "#64748B",
  light:  "#F8FAFC",
};

function Pill({ r }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
      borderRadius:20, fontSize:11.5, fontWeight:700, background:r.pill, color:r.text }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:r.dot, display:"inline-block" }} />
      {r.label}
    </span>
  );
}

function Spinner() {
  return <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.35)",
    borderTopColor:"#fff", borderRadius:"50%", animation:"hf-spin .7s linear infinite" }} />;
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
      padding:"20px 22px", borderLeft:`4px solid ${accent}`, display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${accent}18`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
      <div>
        <p style={{ margin:"0 0 2px", fontSize:12, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
        <p style={{ margin:0, fontSize:26, fontWeight:800, color:C.text, fontFamily:"'Playfair Display',serif" }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Form Field ──────────────────────────────────────────────────────────── */
function Field({ label, error, hint, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:12.5, fontWeight:600, color:"#334155", marginBottom:6 }}>{label}</label>
      {children}
      {hint && !error && <p style={{ margin:"5px 0 0", fontSize:11.5, color:C.muted }}>{hint}</p>}
      {error && <p style={{ margin:"5px 0 0", fontSize:11.5, color:"#EF4444" }}>{error}</p>}
    </div>
  );
}

function Inp({ error, ...props }) {
  return (
    <input {...props} style={{
      width:"100%", padding:"9px 13px", border:`1.5px solid ${error ? "#FCA5A5" : "#CBD5E1"}`,
      borderRadius:9, fontSize:14, color:C.text, background:"#fff", outline:"none",
      fontFamily:"inherit", transition:"all 0.15s", boxSizing:"border-box"
    }}
      onFocus={e => { e.target.style.borderColor = error ? "#EF4444" : C.teal; e.target.style.boxShadow = `0 0 0 3px ${error ? "#FEE2E2" : C.tealLt}`; }}
      onBlur={e  => { e.target.style.borderColor = error ? "#FCA5A5" : "#CBD5E1"; e.target.style.boxShadow = "none"; }}
    />
  );
}

/* ─── Modal shell ─────────────────────────────────────────────────────────── */
function Modal({ title, sub, onClose, width = 580, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", backdropFilter:"blur(5px)",
        display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:width,
        maxHeight:"92vh", overflow:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.18)",
        animation:"hf-up .22s ease" }}>
        <div style={{ padding:"24px 28px 18px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <h2 style={{ margin:0, fontSize:19, fontWeight:700, color:C.text,
              fontFamily:"'Playfair Display',serif" }}>{title}</h2>
            {sub && <p style={{ margin:"4px 0 0", fontSize:13, color:C.muted }}>{sub}</p>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
            color:C.muted, fontSize:22, lineHeight:1, padding:2, marginTop:-2 }}>✕</button>
        </div>
        <div style={{ padding:"22px 28px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Patient Form ────────────────────────────────────────────────────────── */
function PatientForm({ initial, onDone, onCancel, mode = "add" }) {
  const [form, setForm] = useState(initial || blank);
  const [err,  setErr]  = useState({});
  const [busy, setBusy] = useState(false);

  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    setBusy(true);
    let remarks = "";
    try { remarks = await aiAnalyse(form); } catch { remarks = "AI analysis unavailable."; }
    setBusy(false);
    onDone({ ...form, remarks });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Personal */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 16px" }}>
        <div style={{ gridColumn:"1/-1" }}>
          <Field label="Full Name *" error={err.fullName}>
            <Inp value={form.fullName} onChange={s("fullName")} placeholder="e.g. Sarah Johnson" error={err.fullName} />
          </Field>
        </div>
        <Field label="Date of Birth *" error={err.dob}>
          <Inp type="date" value={form.dob} onChange={s("dob")} error={err.dob} />
        </Field>
        <Field label="Email Address *" error={err.email}>
          <Inp type="email" value={form.email} onChange={s("email")} placeholder="sarah@example.com" error={err.email} />
        </Field>
      </div>

      {/* Blood Values */}
      <div style={{ background:"#F0FDF8", border:"1px solid #A7F3D0", borderRadius:12, padding:"16px 18px" }}>
        <p style={{ margin:"0 0 14px", fontSize:12, fontWeight:700, color:C.teal2,
          textTransform:"uppercase", letterSpacing:"0.06em" }}>🩸 Blood Test Results</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 14px" }}>
          <Field label="Glucose (mg/dL) *" error={err.glucose} hint="Ref: 70–99">
            <Inp type="number" value={form.glucose} onChange={s("glucose")} placeholder="95" error={err.glucose} />
          </Field>
          <Field label="Haemoglobin (g/dL) *" error={err.haemoglobin} hint="Ref: 12–17">
            <Inp type="number" value={form.haemoglobin} onChange={s("haemoglobin")} placeholder="14.0" error={err.haemoglobin} />
          </Field>
          <Field label="Cholesterol (mg/dL) *" error={err.cholesterol} hint="Ref: &lt;200">
            <Inp type="number" value={form.cholesterol} onChange={s("cholesterol")} placeholder="180" error={err.cholesterol} />
          </Field>
        </div>
      </div>

      {/* AI Remarks preview */}
      {form.remarks && (
        <div style={{ padding:"14px 16px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10 }}>
          <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#1D4ED8",
            textTransform:"uppercase", letterSpacing:"0.06em" }}>🤖 AI Clinical Remarks</p>
          <p style={{ margin:0, fontSize:13.5, color:"#1E3A8A", lineHeight:1.7 }}>{form.remarks}</p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"10px 0", background:"#fff",
          border:"1.5px solid #CBD5E1", borderRadius:9, color:"#475569", fontSize:14,
          fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
        <button onClick={submit} disabled={busy} style={{
          flex:2, padding:"10px 0", background: busy ? "#5EEAD4" : `linear-gradient(135deg,${C.teal},${C.green})`,
          border:"none", borderRadius:9, color:"#fff", fontSize:14, fontWeight:700,
          cursor: busy ? "not-allowed" : "pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          boxShadow: busy ? "none" : "0 4px 14px rgba(13,148,136,0.35)",
          transition:"all 0.2s"
        }}>
          {busy ? <><Spinner /> Analysing…</> : (mode === "add" ? "✦ Save & Analyse" : "✦ Update & Re-analyse")}
        </button>
      </div>
    </div>
  );
}

/* ─── Patient Detail Modal ─────────────────────────────────────────────────── */
function DetailModal({ p, onClose, onEdit }) {
  const r = risk(p.remarks);
  return (
    <Modal title={p.fullName} sub={p.email} onClose={onClose} width={520}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[["Age", `${age(p.dob)} yrs`], ["Date of Birth", fmt(p.dob)], ["Risk", null]].map(([lbl, val]) => (
            <div key={lbl} style={{ background:C.light, borderRadius:10, padding:"12px 14px",
              border:`1px solid ${C.border}` }}>
              <p style={{ margin:"0 0 4px", fontSize:11, color:C.muted, fontWeight:600,
                textTransform:"uppercase", letterSpacing:"0.05em" }}>{lbl}</p>
              {lbl === "Risk" ? <Pill r={r} /> :
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{val}</p>}
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[["Glucose", p.glucose, "mg/dL"],["Haemoglobin", p.haemoglobin, "g/dL"],["Cholesterol", p.cholesterol, "mg/dL"]].map(([lbl,val,unit]) => (
            <div key={lbl} style={{ background:C.bg, border:"1px solid #A7F3D0", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
              <p style={{ margin:"0 0 2px", fontSize:11, color:C.teal, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{lbl}</p>
              <p style={{ margin:"0 0 1px", fontSize:22, fontWeight:800, color:C.teal2, fontFamily:"'Playfair Display',serif" }}>{val}</p>
              <p style={{ margin:0, fontSize:10.5, color:C.muted }}>{unit}</p>
            </div>
          ))}
        </div>
        {p.remarks && (
          <div style={{ padding:"14px 16px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10 }}>
            <p style={{ margin:"0 0 7px", fontSize:11, fontWeight:700, color:C.teal2,
              textTransform:"uppercase", letterSpacing:"0.06em" }}>🤖 AI Health Remarks</p>
            <p style={{ margin:0, fontSize:13.5, color:"#14532D", lineHeight:1.75 }}>{p.remarks}</p>
          </div>
        )}
        <button onClick={() => { onClose(); onEdit(p); }} style={{
          padding:"10px", background:`linear-gradient(135deg,${C.teal},${C.green})`,
          border:"none", borderRadius:9, color:"#fff", fontSize:14, fontWeight:700,
          cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(13,148,136,0.3)" }}>
          Edit Patient Record
        </button>
      </div>
    </Modal>
  );
}

/* ─── Table Row ────────────────────────────────────────────────────────────── */
function Row({ p, idx, onView, onEdit, onDel }) {
  const r  = risk(p.remarks);
  const hue = (p.fullName.charCodeAt(0) * 13 + 160) % 360;
  return (
    <tr style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer",
      animation:`hf-row .3s ease ${idx * .04}s both` }}
      onClick={() => onView(p)}>
      <td style={{ padding:"13px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
            background:`hsl(${hue},65%,88%)`, color:`hsl(${hue},55%,30%)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, fontWeight:800 }}>
            {p.fullName[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.text }}>{p.fullName}</p>
            <p style={{ margin:0, fontSize:12, color:C.muted }}>{p.email}</p>
          </div>
        </div>
      </td>
      <td style={{ padding:"13px 18px", fontSize:13.5, color:"#334155" }}>{age(p.dob)} yrs</td>
      <td style={{ padding:"13px 18px" }}>
        <div style={{ display:"flex", gap:6 }}>
          {[["G", p.glucose],["Hb", p.haemoglobin],["Ch", p.cholesterol]].map(([k,v]) => (
            <div key={k} style={{ textAlign:"center", background:C.bg, border:"1px solid #A7F3D0",
              borderRadius:8, padding:"4px 9px", minWidth:44 }}>
              <p style={{ margin:0, fontSize:9.5, color:C.teal, fontWeight:700 }}>{k}</p>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.teal2 }}>{v}</p>
            </div>
          ))}
        </div>
      </td>
      <td style={{ padding:"13px 18px" }}><Pill r={r} /></td>
      <td style={{ padding:"13px 18px", maxWidth:220 }}>
        <p style={{ margin:0, fontSize:12.5, color:C.muted, lineHeight:1.5,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {p.remarks || <span style={{ color:"#CBD5E1", fontStyle:"italic" }}>Awaiting analysis</span>}
        </p>
      </td>
      <td style={{ padding:"13px 18px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onEdit(p)} style={{ padding:"5px 12px", background:C.bg,
            border:`1px solid #A7F3D0`, borderRadius:7, color:C.teal2, fontSize:12.5,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>
          <button onClick={() => onDel(p)} style={{ padding:"5px 12px", background:"#FEF2F2",
            border:"1px solid #FECACA", borderRadius:7, color:"#DC2626", fontSize:12.5,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
        </div>
      </td>
    </tr>
  );
}

/* ─── App ──────────────────────────────────────────────────────────────────── */
export default function App() {
  const [patients, setPatients] = useState(load);
  const [modal,    setModal]    = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing,  setViewing]  = useState(null);
  const [search,   setSearch]   = useState("");
  const [nav,      setNav]      = useState("dashboard");

  useEffect(() => save(patients), [patients]);

  const doAdd    = useCallback(d => { setPatients(p => [{ ...d, id:uid(), at:Date.now() }, ...p]); setModal(null); }, []);
  const doUpdate = useCallback(d => { setPatients(p => p.map(x => x.id===editing.id ? { ...d, id:x.id, at:x.at } : x)); setModal(null); setEditing(null); }, [editing]);
  const doDelete = useCallback(() => { setPatients(p => p.filter(x => x.id!==deleting.id)); setModal(null); setDeleting(null); }, [deleting]);

  const filtered = patients.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:   patients.length,
    high:    patients.filter(p => risk(p.remarks).label === "High Risk").length,
    normal:  patients.filter(p => risk(p.remarks).label === "Normal").length,
    pending: patients.filter(p => risk(p.remarks).label === "Pending").length,
  };

  const navItems = [
    { id:"dashboard", icon:"⊞", label:"Dashboard" },
    { id:"patients",  icon:"👤", label:"Patients" },
    { id:"reports",   icon:"📋", label:"Reports" },
    { id:"settings",  icon:"⚙", label:"Settings" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg,
      fontFamily:"'Nunito','Segoe UI',sans-serif", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes hf-spin{to{transform:rotate(360deg)}}
        @keyframes hf-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hf-row{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        @keyframes hf-fade{from{opacity:0}to{opacity:1}}
        input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:.55}
        tbody tr:hover{background:#F0FDF8 !important}
        button:active{transform:scale(.97)}
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{ width:240, background:C.sidebar, flexShrink:0,
        display:"flex", flexDirection:"column", padding:"0 0 24px",
        position:"fixed", top:0, bottom:0, left:0, zIndex:50 }}>

        {/* Brand */}
        <div style={{ padding:"28px 24px 24px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:40, height:40, borderRadius:12,
              background:"linear-gradient(135deg,#0D9488,#10B981)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💚</div>
            <div>
              <p style={{ color:"#fff", fontWeight:800, fontSize:17,
                fontFamily:"'Playfair Display',serif", lineHeight:1 }}>HealthFirst</p>
              <p style={{ color:"rgba(255,255,255,0.38)", fontSize:10,
                letterSpacing:"0.08em", textTransform:"uppercase" }}>Patient Intelligence</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"18px 14px" }}>
          {navItems.map(({ id, icon, label }) => {
            const active = nav === id;
            return (
              <button key={id} onClick={() => setNav(id)} style={{
                display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 14px",
                borderRadius:10, border:"none", cursor:"pointer", fontFamily:"inherit",
                marginBottom:4, fontSize:14, fontWeight: active ? 700 : 500,
                background: active ? "rgba(13,148,136,0.25)" : "transparent",
                color: active ? "#5EEAD4" : "rgba(255,255,255,0.45)",
                textAlign:"left", transition:"all 0.15s",
              }}>
                <span style={{ fontSize:16 }}>{icon}</span> {label}
                {active && <span style={{ marginLeft:"auto", width:5, height:5,
                  borderRadius:"50%", background:"#5EEAD4", flexShrink:0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:"0 24px" }}>
          <div style={{ background:"rgba(13,148,136,0.15)", borderRadius:12, padding:"14px 16px",
            border:"1px solid rgba(13,148,136,0.25)" }}>
            <p style={{ color:"#5EEAD4", fontSize:12, fontWeight:700, marginBottom:4 }}>🤖 AI-Powered</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, lineHeight:1.5 }}>
              Blood test analysis powered by Claude AI
            </p>
          </div>
          <p style={{ color:"rgba(255,255,255,0.2)", fontSize:10.5, marginTop:14, textAlign:"center" }}>
            HealthFirst v1.0 · © 2025
          </p>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main style={{ marginLeft:240, flex:1, padding:"36px 40px",
        minHeight:"100vh", animation:"hf-fade .4s ease" }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:30 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, color:C.text,
              fontFamily:"'Playfair Display',serif", marginBottom:4 }}>
              Patient Management
            </h1>
            <p style={{ fontSize:14, color:C.muted }}>
              Manage records and AI-powered blood test predictions
            </p>
          </div>
          <button onClick={() => setModal("add")} style={{
            display:"flex", alignItems:"center", gap:8, padding:"11px 22px",
            background:`linear-gradient(135deg,${C.teal},${C.green})`,
            border:"none", borderRadius:11, color:"#fff", fontSize:14, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 6px 18px rgba(13,148,136,0.35)",
          }}>＋ Add Patient</button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
          <StatCard icon="👥" label="Total Patients"  value={stats.total}   accent={C.teal} />
          <StatCard icon="✅" label="Normal / Healthy" value={stats.normal}  accent="#10B981" />
          <StatCard icon="⚠️" label="High Risk"        value={stats.high}    accent="#EF4444" />
          <StatCard icon="⏳" label="Pending Analysis" value={stats.pending} accent="#F59E0B" />
        </div>

        {/* Table card */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16,
          overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>

          {/* Toolbar */}
          <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background:"#FAFFFE" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
                color:C.muted, fontSize:15 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                style={{ padding:"8px 14px 8px 38px", border:`1.5px solid ${C.border}`,
                  borderRadius:9, fontSize:13.5, color:C.text, outline:"none",
                  width:270, fontFamily:"inherit", background:"#fff" }}
                onFocus={e => e.target.style.borderColor = C.teal}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
            <p style={{ fontSize:13, color:C.muted }}>
              <b style={{ color:C.text }}>{filtered.length}</b> of {patients.length} patient{patients.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Table */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#F8FFFE" }}>
                  {["Patient", "Age", "Blood Values", "Risk Level", "AI Remarks", "Actions"].map(h => (
                    <th key={h} style={{ padding:"11px 18px", textAlign:"left", fontSize:11.5,
                      fontWeight:700, color:C.muted, textTransform:"uppercase",
                      letterSpacing:"0.05em", borderBottom:`1px solid ${C.border}`,
                      whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:"center", padding:"72px 20px" }}>
                    <div style={{ fontSize:52, marginBottom:14 }}>🩺</div>
                    <p style={{ fontSize:16, fontWeight:700, color:"#334155", marginBottom:6 }}>
                      {search ? "No results found" : "No patients yet"}
                    </p>
                    <p style={{ fontSize:13.5, color:C.muted }}>
                      {search ? `No patient matches "${search}"` : 'Click "Add Patient" to create the first record'}
                    </p>
                  </td></tr>
                ) : filtered.map((p, i) => (
                  <Row key={p.id} p={p} idx={i}
                    onView={setViewing}
                    onEdit={pt => { setEditing(pt); setModal("edit"); }}
                    onDel={pt  => { setDeleting(pt); setModal("delete"); }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {patients.length > 0 && (
            <div style={{ padding:"12px 22px", borderTop:`1px solid ${C.border}`,
              background:"#FAFFFE", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontSize:12.5, color:C.muted }}>
                Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </p>
              <p style={{ fontSize:12, color:"#CBD5E1" }}>
                HealthFirst · AI remarks are for informational purposes only
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────── */}
      {modal === "add" && (
        <Modal title="New Patient Record"
          sub="Enter patient details. AI will analyse blood values automatically on save."
          onClose={() => setModal(null)}>
          <PatientForm onDone={doAdd} onCancel={() => setModal(null)} mode="add" />
        </Modal>
      )}

      {modal === "edit" && editing && (
        <Modal title="Edit Patient Record"
          sub="Update the details below. AI will re-analyse on save."
          onClose={() => { setModal(null); setEditing(null); }}>
          <PatientForm initial={editing} onDone={doUpdate}
            onCancel={() => { setModal(null); setEditing(null); }} mode="edit" />
        </Modal>
      )}

      {modal === "delete" && deleting && (
        <Modal title="Delete Patient Record" onClose={() => { setModal(null); setDeleting(null); }} width={420}>
          <div style={{ textAlign:"center", padding:"10px 0 4px" }}>
            <div style={{ fontSize:54, marginBottom:16 }}>🗑️</div>
            <p style={{ fontSize:15.5, color:"#334155", marginBottom:8 }}>
              Remove <b>{deleting.fullName}</b>?
            </p>
            <p style={{ fontSize:13.5, color:C.muted, marginBottom:26 }}>
              This will permanently delete all records including AI analysis. This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setModal(null); setDeleting(null); }} style={{
                flex:1, padding:"11px 0", background:"#fff", border:`1.5px solid ${C.border}`,
                borderRadius:9, color:"#475569", fontSize:14, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              <button onClick={doDelete} style={{
                flex:1, padding:"11px 0", background:"#DC2626", border:"none",
                borderRadius:9, color:"#fff", fontSize:14, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 14px rgba(220,38,38,0.3)" }}>Delete Patient</button>
            </div>
          </div>
        </Modal>
      )}

      {viewing && !modal && (
        <DetailModal p={viewing} onClose={() => setViewing(null)}
          onEdit={pt => { setViewing(null); setEditing(pt); setModal("edit"); }} />
      )}
    </div>
  );
}
