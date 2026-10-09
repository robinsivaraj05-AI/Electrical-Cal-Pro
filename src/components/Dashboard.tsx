import React from 'react';
import {
  Zap, Cable, TrendingDown, AlertTriangle, Cpu, Activity,
  Battery, FileText, CloudLightning, Shield, BarChart3,
  FolderOpen, History, BookOpen, Clock, Wrench, Eye,
  MoreVertical, Plus, CheckCircle2, XCircle, Info, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ── CSS-var shorthand ─────────────────────────────────────────
const V = {
  bg:   'var(--ec-bg-card)',
  bgD:  'var(--ec-bg-root)',
  surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)',
  brdB: 'var(--ec-border)',
  brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)',
  sec:  'var(--ec-text-secondary)',
  muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)',
  mono: "'JetBrains Mono',monospace",
};

const QUICK_MODULES = [
  { id: 'cable-current', label: 'Cable Current',  icon: Zap,           color: '#16A34A', bg: 'rgba(34,197,94,.10)',   border: 'rgba(34,197,94,.25)',  desc: 'FLC for motors, generators, loads'         },
  { id: 'cable-sizing',  label: 'Cable Sizing',   icon: Cable,         color: '#2563EB', bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)', desc: 'IEC 60364-5-52 with correction factors'    },
  { id: 'voltage-drop',  label: 'Voltage Drop',   icon: TrendingDown,  color: '#D97706', bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.25)', desc: 'Full impedance method R·cosφ+X·sinφ'       },
  { id: 'short-circuit', label: 'Short Circuit',  icon: AlertTriangle, color: '#DC2626', bg: 'rgba(239,68,68,.10)',   border: 'rgba(239,68,68,.25)',  desc: 'IEC 60909 fault current analysis'           },
  { id: 'motor',         label: 'Motor',          icon: Cpu,           color: '#0891B2', bg: 'rgba(6,182,212,.10)',   border: 'rgba(6,182,212,.25)',  desc: 'FLC, starting, OLR, MCCB, cable'           },
  { id: 'transformer',   label: 'Transformer',    icon: Activity,      color: '#7C3AED', bg: 'rgba(168,85,247,.10)',  border: 'rgba(168,85,247,.25)', desc: 'Current, losses, fault, impedance'          },
  { id: 'earthing',      label: 'Earthing',       icon: CloudLightning,color: '#16A34A', bg: 'rgba(34,197,94,.10)',   border: 'rgba(34,197,94,.25)',  desc: 'IEEE 80 grid resistance & voltages'         },
  { id: 'load-schedule', label: 'Load Schedule',  icon: FileText,      color: '#0D9488', bg: 'rgba(20,184,166,.10)',  border: 'rgba(20,184,166,.25)', desc: 'Maximum demand calculation'                },
  { id: 'ups',           label: 'UPS',            icon: Battery,       color: '#059669', bg: 'rgba(16,185,129,.10)',  border: 'rgba(16,185,129,.25)', desc: 'UPS sizing and battery capacity'            },
  { id: 'olr',           label: 'OLR Selection',  icon: Shield,        color: '#EA580C', bg: 'rgba(249,115,22,.10)',  border: 'rgba(249,115,22,.25)', desc: 'IEC 60947-4-1 overload relay'              },
  { id: 'mccb',          label: 'MCCB',           icon: Wrench,        color: '#DC2626', bg: 'rgba(239,68,68,.10)',   border: 'rgba(239,68,68,.25)',  desc: 'IEC 60947-2 breaker selection'             },
  { id: 'standards',     label: 'Standards',      icon: BookOpen,      color: '#475569', bg: 'rgba(100,116,139,.10)', border: 'rgba(100,116,139,.25)',desc: 'IEC · IEEE · NEC · BS · IS library'        },
];

const STANDARDS = [
  { code: 'IEC 60364-5-52', scope: 'Cable sizing & current ratings',  color: '#16A34A' },
  { code: 'IEC 60909',       scope: 'Short-circuit calculations',      color: '#2563EB' },
  { code: 'IEC 60287',       scope: 'Cable thermal rating',            color: '#D97706' },
  { code: 'IEEE 80',         scope: 'Substation earthing',             color: '#16A34A' },
  { code: 'IEEE 1584',       scope: 'Arc flash calculation',           color: '#DC2626' },
  { code: 'IEC 60947-2',     scope: 'Low-voltage circuit-breakers',    color: '#7C3AED' },
  { code: 'NEC Art. 310',    scope: 'Conductors — general wiring',     color: '#D97706' },
  { code: 'BS 7671',         scope: 'UK wiring regulations',           color: '#059669' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  PASS:    { bg:'rgba(34,197,94,.12)',  color:'#16A34A', border:'rgba(34,197,94,.35)'  },
  FAIL:    { bg:'rgba(239,68,68,.12)',  color:'#DC2626', border:'rgba(239,68,68,.35)'  },
  WARNING: { bg:'rgba(245,158,11,.12)', color:'#D97706', border:'rgba(245,158,11,.35)' },
  INFO:    { bg:'rgba(37,99,235,.12)',  color:'#2563EB', border:'rgba(37,99,235,.35)'  },
};

export function Dashboard() {
  const { setActiveModule, calculationHistory, projects, settings } = useStore();
  const displayName = settings.engineerName ?? 'Engineer';

  const dayMap: Record<string, number> = {};
  calculationHistory.forEach((c) => {
    const d = new Date(c.timestamp).getDate().toString().padStart(2, '0');
    dayMap[d] = (dayMap[d] || 0) + 1;
  });
  const activityData = Array.from({ length: 30 }, (_, i) => ({
    day: (i + 1).toString().padStart(2, '0'),
    count: dayMap[(i + 1).toString().padStart(2, '0')] ?? 0,
  }));

  const recentCalcs = calculationHistory.slice(0, 5);
  const typeLabel = (t: string) => t.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const kpis = [
    { label: 'Modules',      value: '30+',                                              sub: 'Comprehensive Suite',      color: '#2563EB', bg: 'rgba(37,99,235,.12)',   border: 'rgba(37,99,235,.25)',   icon: Zap         },
    { label: 'Calculations', value: calculationHistory.length.toString(),               sub: 'Completed This Month',     color: '#16A34A', bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.25)',   icon: BarChart3   },
    { label: 'Projects',     value: projects.length.toString(),                         sub: 'Total In Progress',        color: '#7C3AED', bg: 'rgba(124,58,237,.12)',  border: 'rgba(124,58,237,.25)',  icon: FolderOpen  },
    { label: 'Hours Saved',  value: Math.max(calculationHistory.length * 2, 145).toString(), sub: 'By Using ElecCalc Pro', color: '#D97706', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.25)', icon: Clock       },
    { label: 'Accuracy',     value: '99.9%',                                            sub: 'Verified by Standards',    color: '#059669', bg: 'rgba(16,185,129,.12)',  border: 'rgba(16,185,129,.25)',  icon: CheckCircle2},
  ];

  return (
    <div className="animate-fadeIn" style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* ── Welcome row ─────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, paddingBottom:4 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:V.txt, letterSpacing:'-0.02em', lineHeight:1.2, margin:0 }}>
            Welcome back, {displayName}! <span role="img" aria-label="wave">👋</span>
          </h1>
          <p style={{ fontSize:14, color:V.muted, marginTop:4, margin:'4px 0 0' }}>Compute with confidence. Design with precision.</p>
        </div>
        <button
          onClick={() => setActiveModule('projects')}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'0 22px', height:46, borderRadius:10, background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(37,99,235,.35)', transition:'all 200ms', fontFamily:'inherit' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(37,99,235,.45)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,.35)'; }}
        >
          <Plus style={{ width:18, height:18 }} /> New Project
        </button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background:V.bg, borderRadius:16, border:`1px solid ${k.border}`, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start', boxShadow:'var(--ec-shadow-card)', transition:'transform 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:k.bg, border:`1px solid ${k.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon style={{ width:22, height:22, color:k.color }} />
              </div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:k.color, letterSpacing:'-0.02em', lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:13, fontWeight:700, color:V.txt, marginTop:4 }}>{k.label}</div>
                <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Access + Standards ─────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }}>

        {/* Quick Access */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:V.sec, margin:0 }}>Quick Access — Calculation Modules</h2>
            <button style={{ fontSize:13, color:'#2563EB', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', fontWeight:600 }}>
              View All Modules <ChevronRight style={{ width:14, height:14 }} />
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {QUICK_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setActiveModule(m.id)} style={{ background:V.bg, border:`1px solid ${m.border}`, borderRadius:14, padding:'16px 10px', textAlign:'left', cursor:'pointer', transition:'all 200ms', display:'flex', flexDirection:'column', gap:8, boxShadow:'var(--ec-shadow-card)', fontFamily:'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 10px 24px ${m.color}22`; e.currentTarget.style.borderColor=m.border; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--ec-shadow-card)'; }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:m.bg, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon style={{ width:18, height:18, color:m.color }} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:V.txt, lineHeight:1.3 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:V.muted, lineHeight:1.5 }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standards panel */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <BookOpen style={{ width:16, height:16, color:'#2563EB' }} />
            <h2 style={{ fontSize:14, fontWeight:700, color:V.sec, margin:0 }}>Standards Quick Reference</h2>
          </div>
          <div style={{ background:V.bg, borderRadius:14, border:`1px solid ${V.brd}`, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
            {STANDARDS.map((s, i) => (
              <div key={s.code} style={{ padding:'11px 16px', borderBottom: i < STANDARDS.length - 1 ? `1px solid ${V.brdM}` : 'none', transition:'background 150ms', cursor:'default' }}
                onMouseEnter={(e) => { e.currentTarget.style.background=V.surf; }}
                onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:V.mono, color:s.color }}>{s.code}</span>
                </div>
                <div style={{ fontSize:11, color:V.muted, marginTop:3, paddingLeft:15 }}>{s.scope}</div>
              </div>
            ))}
            <div style={{ padding:'10px 16px', borderTop:`1px solid ${V.brdM}` }}>
              <button onClick={() => setActiveModule('standards')} style={{ fontSize:12, color:'#2563EB', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                View full standards library →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Calcs + Activity Chart ────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>

        {/* Recent calculations table */}
        <div style={{ background:V.bg, borderRadius:16, border:`1px solid ${V.brd}`, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${V.brdM}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:V.surf }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <History style={{ width:16, height:16, color:'#2563EB' }} />
              <span style={{ fontSize:14, fontWeight:700, color:V.txt }}>Recent Calculations</span>
            </div>
            <button onClick={() => setActiveModule('history')} style={{ fontSize:12, color:'#2563EB', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>View All →</button>
          </div>

          {recentCalcs.length === 0 ? (
            <div style={{ padding:'48px 20px', textAlign:'center', color:V.muted, fontSize:14 }}>
              <History style={{ width:40, height:40, margin:'0 auto 12px', opacity:0.2 }} />
              No calculations yet. Start with any module above.
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.2fr 70px 44px', padding:'10px 20px', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}`, background:V.surf }}>
                <span>Name</span><span>Category</span><span>Project</span><span>Date & Time</span><span style={{ textAlign:'center' }}>Status</span><span style={{ textAlign:'center' }}>Action</span>
              </div>
              {recentCalcs.map((calc) => {
                const st = STATUS_STYLE[calc.results.status] ?? STATUS_STYLE['INFO'];
                return (
                  <div key={calc.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.2fr 70px 44px', padding:'13px 20px', alignItems:'center', borderBottom:`1px solid ${V.brdM}`, transition:'background 150ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background=V.surf; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; }}
                  >
                    <div style={{ fontSize:13, color:V.txt, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:8 }}>{calc.title}</div>
                    <div style={{ fontSize:12, color:V.sec }}>{typeLabel(calc.type)}</div>
                    <div style={{ fontSize:12, color:V.muted }}>—</div>
                    <div style={{ fontSize:12, color:V.muted }}>{new Date(calc.timestamp).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</div>
                    <div style={{ display:'flex', justifyContent:'center' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:800, letterSpacing:'0.04em', background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>
                        {calc.results.status}
                      </span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'center', gap:4 }}>
                      <button onClick={() => setActiveModule('history')} style={{ background:'none', border:'none', color:V.muted, cursor:'pointer', padding:4, borderRadius:6 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color='#2563EB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color=V.muted; }}
                      >
                        <Eye style={{ width:14, height:14 }} />
                      </button>
                      <button style={{ background:'none', border:'none', color:V.muted, cursor:'pointer', padding:4, borderRadius:6 }}>
                        <MoreVertical style={{ width:14, height:14 }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Activity chart */}
        <div style={{ background:V.bg, borderRadius:16, border:`1px solid ${V.brd}`, padding:20, boxShadow:'var(--ec-shadow-card)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <BarChart3 style={{ width:16, height:16, color:'#2563EB' }} />
              <span style={{ fontSize:14, fontWeight:700, color:V.txt }}>Calculation Activity</span>
            </div>
            <select style={{ background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:7, color:V.muted, fontSize:12, padding:'4px 8px', fontFamily:'inherit', outline:'none' }}>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top:4, right:4, left:-22, bottom:0 }}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ec-border-muted)" />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:'var(--ec-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'var(--ec-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border)', borderRadius:8, fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,.12)' }}
                  labelStyle={{ color:'var(--ec-text-primary)', fontWeight:700 }}
                  itemStyle={{ color:'#2563EB' }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fill="url(#cg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <span style={{ width:20, height:2, background:'#2563EB', borderRadius:2, display:'inline-block' }} />
            <span style={{ fontSize:11, color:V.muted }}>Calculations per day</span>
          </div>
        </div>
      </div>

      {/* ── Footer status bar ────────────────────────────────── */}
      <div style={{ background:V.bg, borderRadius:14, border:`1px solid ${V.brd}`, padding:'14px 24px', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, boxShadow:'var(--ec-shadow-card)' }}>
        {[
          { label:'Active Project', value:'Select or create a project', icon: FolderOpen,   color:'#2563EB' },
          { label:'Standards',      value:'IEC · IEEE · NEC · BS · IS', icon: BookOpen,     color:'#7C3AED' },
          { label:'Accuracy',       value:'Verified & Tested',          icon: CheckCircle2, color:'#16A34A' },
          { label:'Support',        value:'support@eleccalcpro.com',    icon: Zap,          color:'#D97706' },
          { label:'Version 2.0.0', value:'© 2026 ElecCalc Pro',        icon: Shield,       color:'#0891B2' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`${color}14`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon style={{ width:14, height:14, color }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:V.lbl, fontWeight:700 }}>{label}</div>
              <div style={{ fontSize:11, color:V.muted, marginTop:1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
