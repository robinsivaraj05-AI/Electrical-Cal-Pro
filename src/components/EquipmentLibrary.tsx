import React, { useState } from 'react';
import { Server, Search, Cable, Cpu, Zap, Activity, Shield, BarChart3, Package } from 'lucide-react';

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

// ── Data tables ───────────────────────────────────────────────

const CABLE_DATA = [
  { size:'1.5',  cu_pvc:17.5, cu_xlpe:19.5, al_pvc:13.5, al_xlpe:15,   r20:12.10, x:0.115, weight_cu:50 },
  { size:'2.5',  cu_pvc:24,   cu_xlpe:27,   al_pvc:18.5, al_xlpe:21,   r20:7.41,  x:0.110, weight_cu:70 },
  { size:'4',    cu_pvc:32,   cu_xlpe:36,   al_pvc:25,   al_xlpe:28,   r20:4.61,  x:0.107, weight_cu:105 },
  { size:'6',    cu_pvc:41,   cu_xlpe:46,   al_pvc:32,   al_xlpe:36,   r20:3.08,  x:0.100, weight_cu:145 },
  { size:'10',   cu_pvc:57,   cu_xlpe:63,   al_pvc:44,   al_xlpe:50,   r20:1.83,  x:0.094, weight_cu:215 },
  { size:'16',   cu_pvc:76,   cu_xlpe:85,   al_pvc:59,   al_xlpe:66,   r20:1.15,  x:0.090, weight_cu:320 },
  { size:'25',   cu_pvc:101,  cu_xlpe:112,  al_pvc:78,   al_xlpe:87,   r20:0.727, x:0.086, weight_cu:480 },
  { size:'35',   cu_pvc:125,  cu_xlpe:138,  al_pvc:96,   al_xlpe:107,  r20:0.524, x:0.083, weight_cu:640 },
  { size:'50',   cu_pvc:151,  cu_xlpe:168,  al_pvc:117,  al_xlpe:130,  r20:0.387, x:0.082, weight_cu:890 },
  { size:'70',   cu_pvc:192,  cu_xlpe:213,  al_pvc:149,  al_xlpe:165,  r20:0.268, x:0.080, weight_cu:1200 },
  { size:'95',   cu_pvc:232,  cu_xlpe:258,  al_pvc:180,  al_xlpe:200,  r20:0.193, x:0.078, weight_cu:1600 },
  { size:'120',  cu_pvc:269,  cu_xlpe:299,  al_pvc:209,  al_xlpe:232,  r20:0.153, x:0.077, weight_cu:1950 },
  { size:'150',  cu_pvc:309,  cu_xlpe:344,  al_pvc:240,  al_xlpe:267,  r20:0.124, x:0.076, weight_cu:2400 },
  { size:'185',  cu_pvc:353,  cu_xlpe:392,  al_pvc:274,  al_xlpe:305,  r20:0.0991,x:0.074, weight_cu:2950 },
  { size:'240',  cu_pvc:415,  cu_xlpe:461,  al_pvc:323,  al_xlpe:359,  r20:0.0754,x:0.073, weight_cu:3750 },
  { size:'300',  cu_pvc:477,  cu_xlpe:530,  al_pvc:371,  al_xlpe:412,  r20:0.0601,x:0.072, weight_cu:4600 },
  { size:'400',  cu_pvc:546,  cu_xlpe:607,  al_pvc:424,  al_xlpe:472,  r20:0.0470,x:0.071, weight_cu:5900 },
];

const MCCB_DATA = [
  { frame:'NS100', rating:[16,25,32,40,50,63,80,100], icw:'10 kA', icu:'25/36/50 kA', standard:'IEC 60947-2' },
  { frame:'NS160', rating:[100,125,160],               icw:'15 kA', icu:'36/50/70 kA', standard:'IEC 60947-2' },
  { frame:'NS250', rating:[160,200,250],               icw:'20 kA', icu:'36/50/70 kA', standard:'IEC 60947-2' },
  { frame:'NS400', rating:[320,400],                   icw:'20 kA', icu:'50/70/85 kA', standard:'IEC 60947-2' },
  { frame:'NS630', rating:[500,630],                   icw:'30 kA', icu:'70/85 kA',    standard:'IEC 60947-2' },
  { frame:'NW08',  rating:[630,800],                   icw:'42 kA', icu:'85/100 kA',   standard:'IEC 60947-2' },
  { frame:'NW10',  rating:[800,1000],                  icw:'42 kA', icu:'85/100 kA',   standard:'IEC 60947-2' },
  { frame:'NW16',  rating:[1250,1600],                 icw:'65 kA', icu:'100/130 kA',  standard:'IEC 60947-2' },
  { frame:'NW20',  rating:[2000],                      icw:'65 kA', icu:'100/130 kA',  standard:'IEC 60947-2' },
  { frame:'NW32',  rating:[2500,3200],                 icw:'85 kA', icu:'130/150 kA',  standard:'IEC 60947-2' },
];

const MOTOR_DATA = [
  { kw:0.37, poles4_rpm:1380, flc_415v:1.1,  flc_690v:0.67, frame:'71',  efficiency:'IE2', startingI:6.6  },
  { kw:0.55, poles4_rpm:1380, flc_415v:1.5,  flc_690v:0.9,  frame:'71',  efficiency:'IE2', startingI:6.6  },
  { kw:0.75, poles4_rpm:1380, flc_415v:1.9,  flc_690v:1.1,  frame:'80',  efficiency:'IE2', startingI:6.6  },
  { kw:1.1,  poles4_rpm:1420, flc_415v:2.7,  flc_690v:1.6,  frame:'80',  efficiency:'IE2', startingI:6.6  },
  { kw:1.5,  poles4_rpm:1420, flc_415v:3.5,  flc_690v:2.1,  frame:'90',  efficiency:'IE2', startingI:7.0  },
  { kw:2.2,  poles4_rpm:1430, flc_415v:5.0,  flc_690v:3.0,  frame:'90',  efficiency:'IE2', startingI:7.0  },
  { kw:3.0,  poles4_rpm:1440, flc_415v:6.7,  flc_690v:4.0,  frame:'100', efficiency:'IE2', startingI:7.0  },
  { kw:4.0,  poles4_rpm:1440, flc_415v:8.6,  flc_690v:5.2,  frame:'112', efficiency:'IE3', startingI:7.5  },
  { kw:5.5,  poles4_rpm:1445, flc_415v:11.5, flc_690v:6.9,  frame:'132', efficiency:'IE3', startingI:7.5  },
  { kw:7.5,  poles4_rpm:1450, flc_415v:15.2, flc_690v:9.1,  frame:'132', efficiency:'IE3', startingI:7.5  },
  { kw:11,   poles4_rpm:1460, flc_415v:21.5, flc_690v:12.9, frame:'160', efficiency:'IE3', startingI:8.0  },
  { kw:15,   poles4_rpm:1460, flc_415v:29.0, flc_690v:17.4, frame:'160', efficiency:'IE3', startingI:8.0  },
  { kw:18.5, poles4_rpm:1460, flc_415v:35.5, flc_690v:21.3, frame:'180', efficiency:'IE3', startingI:8.0  },
  { kw:22,   poles4_rpm:1465, flc_415v:42.0, flc_690v:25.2, frame:'180', efficiency:'IE3', startingI:8.0  },
  { kw:30,   poles4_rpm:1465, flc_415v:57.0, flc_690v:34.2, frame:'200', efficiency:'IE3', startingI:8.5  },
  { kw:37,   poles4_rpm:1470, flc_415v:70.0, flc_690v:42.0, frame:'200', efficiency:'IE3', startingI:8.5  },
  { kw:45,   poles4_rpm:1470, flc_415v:85.0, flc_690v:51.0, frame:'225', efficiency:'IE3', startingI:8.5  },
  { kw:55,   poles4_rpm:1475, flc_415v:103,  flc_690v:61.8, frame:'250', efficiency:'IE3', startingI:8.5  },
  { kw:75,   poles4_rpm:1475, flc_415v:140,  flc_690v:84.0, frame:'280', efficiency:'IE3', startingI:9.0  },
  { kw:90,   poles4_rpm:1478, flc_415v:167,  flc_690v:100,  frame:'315', efficiency:'IE3', startingI:9.0  },
  { kw:110,  poles4_rpm:1480, flc_415v:203,  flc_690v:122,  frame:'315', efficiency:'IE3', startingI:9.0  },
  { kw:132,  poles4_rpm:1480, flc_415v:242,  flc_690v:145,  frame:'355', efficiency:'IE3', startingI:9.5  },
  { kw:160,  poles4_rpm:1480, flc_415v:292,  flc_690v:175,  frame:'355', efficiency:'IE3', startingI:9.5  },
  { kw:200,  poles4_rpm:1483, flc_415v:364,  flc_690v:218,  frame:'400', efficiency:'IE3', startingI:9.5  },
  { kw:250,  poles4_rpm:1483, flc_415v:455,  flc_690v:273,  frame:'400', efficiency:'IE3', startingI:10.0 },
];

const TRANSFORMER_DATA = [
  { kva:25,   hv:'11kV', lv:'415V', vk:4,  pno:0.10, pcu:0.60,  iex:2.5, inrush:8  },
  { kva:50,   hv:'11kV', lv:'415V', vk:4,  pno:0.17, pcu:1.10,  iex:2.5, inrush:8  },
  { kva:100,  hv:'11kV', lv:'415V', vk:4,  pno:0.29, pcu:1.75,  iex:2.0, inrush:10 },
  { kva:160,  hv:'11kV', lv:'415V', vk:4,  pno:0.42, pcu:2.35,  iex:2.0, inrush:10 },
  { kva:200,  hv:'11kV', lv:'415V', vk:4,  pno:0.50, pcu:2.80,  iex:2.0, inrush:10 },
  { kva:250,  hv:'11kV', lv:'415V', vk:4,  pno:0.60, pcu:3.25,  iex:1.8, inrush:10 },
  { kva:315,  hv:'11kV', lv:'415V', vk:4,  pno:0.72, pcu:3.90,  iex:1.8, inrush:12 },
  { kva:400,  hv:'11kV', lv:'415V', vk:4,  pno:0.87, pcu:4.60,  iex:1.8, inrush:12 },
  { kva:500,  hv:'11kV', lv:'415V', vk:4,  pno:1.00, pcu:5.40,  iex:1.5, inrush:12 },
  { kva:630,  hv:'11kV', lv:'415V', vk:6,  pno:1.20, pcu:6.50,  iex:1.5, inrush:12 },
  { kva:800,  hv:'11kV', lv:'415V', vk:6,  pno:1.45, pcu:7.80,  iex:1.2, inrush:12 },
  { kva:1000, hv:'11kV', lv:'415V', vk:6,  pno:1.70, pcu:9.50,  iex:1.2, inrush:14 },
  { kva:1250, hv:'11kV', lv:'415V', vk:6,  pno:2.00, pcu:11.50, iex:1.0, inrush:14 },
  { kva:1600, hv:'11kV', lv:'415V', vk:6,  pno:2.45, pcu:14.00, iex:1.0, inrush:14 },
  { kva:2000, hv:'11kV', lv:'415V', vk:6,  pno:2.90, pcu:17.00, iex:0.8, inrush:16 },
  { kva:2500, hv:'11kV', lv:'415V', vk:6,  pno:3.40, pcu:20.00, iex:0.8, inrush:16 },
];

const BUSBAR_DATA = [
  { size:'25×3', area:75,  ampacity_cu:180,  ampacity_al:140, weight_cu:0.67, weight_al:0.20 },
  { size:'30×5', area:150, ampacity_cu:270,  ampacity_al:210, weight_cu:1.34, weight_al:0.41 },
  { size:'40×5', area:200, ampacity_cu:340,  ampacity_al:265, weight_cu:1.78, weight_al:0.54 },
  { size:'50×5', area:250, ampacity_cu:410,  ampacity_al:320, weight_cu:2.23, weight_al:0.68 },
  { size:'60×5', area:300, ampacity_cu:475,  ampacity_al:370, weight_cu:2.67, weight_al:0.81 },
  { size:'80×6', area:480, ampacity_cu:670,  ampacity_al:525, weight_cu:4.27, weight_al:1.30 },
  { size:'100×6',area:600, ampacity_cu:820,  ampacity_al:640, weight_cu:5.34, weight_al:1.62 },
  { size:'100×8',area:800, ampacity_cu:1000, ampacity_al:775, weight_cu:7.12, weight_al:2.16 },
  { size:'100×10',area:1000,ampacity_cu:1150,ampacity_al:900,weight_cu:8.90, weight_al:2.70 },
  { size:'120×10',area:1200,ampacity_cu:1350,ampacity_al:1050,weight_cu:10.7,weight_al:3.24 },
  { size:'160×10',area:1600,ampacity_cu:1700,ampacity_al:1325,weight_cu:14.2,weight_al:4.32 },
];

const TABS = [
  { id:'cable',       label:'Cable Ampacity',    icon: Cable,    color:'#2563EB' },
  { id:'mccb',        label:'MCCB / ACB',         icon: Shield,   color:'#DC2626' },
  { id:'motor',       label:'Motor Reference',   icon: Cpu,      color:'#0891B2' },
  { id:'transformer', label:'Transformers',       icon: Activity, color:'#7C3AED' },
  { id:'busbar',      label:'Busbar Ratings',    icon: BarChart3, color:'#D97706' },
];

function ThCell({ ch, right }: { ch: React.ReactNode; right?: boolean }) {
  return <th style={{ padding:'9px 12px', textAlign: right ? 'right' : 'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}`, background:V.surf, whiteSpace:'nowrap' }}>{ch}</th>;
}
function TdCell({ ch, mono, right, highlight }: { ch: React.ReactNode; mono?: boolean; right?: boolean; highlight?: boolean }) {
  return <td style={{ padding:'10px 12px', textAlign: right ? 'right' : 'left', fontSize:13, fontWeight: highlight ? 700 : 500, color: highlight ? V.sec : V.muted, fontFamily: mono ? V.mono : 'inherit', borderBottom:`1px solid ${V.brdM}` }}>{ch}</td>;
}

export function EquipmentLibrary() {
  const [tab,   setTab]   = useState('cable');
  const [query, setQuery] = useState('');

  const active = TABS.find(t => t.id === tab) ?? TABS[0];

  return (
    <div className="animate-fadeIn" style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(124,58,237,.12)', border:'1px solid rgba(124,58,237,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Server style={{ width:24, height:24, color:'#7C3AED' }} />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:V.txt, margin:0, letterSpacing:'-0.02em' }}>Equipment Library</h1>
            <p style={{ fontSize:13, color:V.muted, margin:'3px 0 0' }}>Standard electrical equipment reference data — IEC 60947 · IEC 60076 · IEC 60034</p>
          </div>
        </div>
        <div style={{ position:'relative', width:260 }}>
          <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:V.muted }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter table…"
            style={{ width:'100%', height:42, paddingLeft:36, paddingRight:12, background:V.bg, border:`1px solid ${V.brdB}`, borderRadius:10, color:V.txt, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:10, padding:'6px', background:V.bgD, borderRadius:14, width:'fit-content', border:`1px solid ${V.brd}` }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setQuery(''); }} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:`1px solid ${isActive ? t.color : 'transparent'}`, background: isActive ? `${t.color}18` : 'transparent', color: isActive ? t.color : V.muted, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}>
              <Icon style={{ width:15, height:15 }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, display:'flex', alignItems:'center', gap:10 }}>
          <active.icon style={{ width:16, height:16, color:active.color }} />
          <span style={{ fontSize:14, fontWeight:700, color:V.txt }}>{active.label}</span>
        </div>
        <div style={{ overflowX:'auto' }}>

          {tab === 'cable' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <ThCell ch="Size (mm²)" />
                <ThCell ch="Cu/PVC (A)" right />
                <ThCell ch="Cu/XLPE (A)" right />
                <ThCell ch="Al/PVC (A)" right />
                <ThCell ch="Al/XLPE (A)" right />
                <ThCell ch="R₂₀ (Ω/km)" right />
                <ThCell ch="X (Ω/km)" right />
                <ThCell ch="Weight Cu (g/m)" right />
              </tr></thead>
              <tbody>
                {CABLE_DATA.filter(r => !query || r.size.includes(query)).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : V.surf }}>
                    <TdCell ch={`${r.size} mm²`} highlight />
                    <TdCell ch={r.cu_pvc} mono right />
                    <TdCell ch={r.cu_xlpe} mono right />
                    <TdCell ch={r.al_pvc} mono right />
                    <TdCell ch={r.al_xlpe} mono right />
                    <TdCell ch={r.r20} mono right />
                    <TdCell ch={r.x} mono right />
                    <TdCell ch={r.weight_cu} mono right />
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'mccb' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <ThCell ch="Frame" />
                <ThCell ch="Ratings (A)" />
                <ThCell ch="ICw (Short-time)" right />
                <ThCell ch="Icu (Breaking)" right />
                <ThCell ch="Standard" />
              </tr></thead>
              <tbody>
                {MCCB_DATA.filter(r => !query || r.frame.toLowerCase().includes(query.toLowerCase())).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : V.surf }}>
                    <TdCell ch={r.frame} highlight />
                    <TdCell ch={r.rating.join(', ')} mono />
                    <TdCell ch={r.icw} mono right />
                    <TdCell ch={r.icu} mono right />
                    <TdCell ch={r.standard} />
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'motor' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <ThCell ch="kW" />
                <ThCell ch="RPM (4P)" right />
                <ThCell ch="FLC @ 415V (A)" right />
                <ThCell ch="FLC @ 690V (A)" right />
                <ThCell ch="Frame" right />
                <ThCell ch="Efficiency" />
                <ThCell ch="Starting I (×FLC)" right />
              </tr></thead>
              <tbody>
                {MOTOR_DATA.filter(r => !query || r.kw.toString().includes(query) || r.frame.includes(query)).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : V.surf }}>
                    <TdCell ch={`${r.kw} kW`} highlight />
                    <TdCell ch={r.poles4_rpm} mono right />
                    <TdCell ch={r.flc_415v} mono right />
                    <TdCell ch={r.flc_690v} mono right />
                    <TdCell ch={r.frame} mono right />
                    <TdCell ch={<span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background: r.efficiency === 'IE3' ? 'rgba(34,197,94,.12)' : 'rgba(245,158,11,.12)', color: r.efficiency === 'IE3' ? '#16A34A' : '#D97706', border:`1px solid ${r.efficiency === 'IE3' ? 'rgba(34,197,94,.3)' : 'rgba(245,158,11,.3)'}` }}>{r.efficiency}</span>} />
                    <TdCell ch={`${r.startingI}×`} mono right />
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'transformer' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <ThCell ch="kVA" />
                <ThCell ch="HV" />
                <ThCell ch="LV" />
                <ThCell ch="Vk (%)" right />
                <ThCell ch="No-load Loss (kW)" right />
                <ThCell ch="Load Loss (kW)" right />
                <ThCell ch="Iex (%)" right />
                <ThCell ch="Inrush (×In)" right />
              </tr></thead>
              <tbody>
                {TRANSFORMER_DATA.filter(r => !query || r.kva.toString().includes(query)).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : V.surf }}>
                    <TdCell ch={`${r.kva} kVA`} highlight />
                    <TdCell ch={r.hv} />
                    <TdCell ch={r.lv} />
                    <TdCell ch={`${r.vk}%`} mono right />
                    <TdCell ch={r.pno.toFixed(2)} mono right />
                    <TdCell ch={r.pcu.toFixed(2)} mono right />
                    <TdCell ch={`${r.iex}%`} mono right />
                    <TdCell ch={`${r.inrush}×`} mono right />
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'busbar' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <ThCell ch="Size (mm)" />
                <ThCell ch="Area (mm²)" right />
                <ThCell ch="Cu Ampacity (A)" right />
                <ThCell ch="Al Ampacity (A)" right />
                <ThCell ch="Cu Weight (kg/m)" right />
                <ThCell ch="Al Weight (kg/m)" right />
              </tr></thead>
              <tbody>
                {BUSBAR_DATA.filter(r => !query || r.size.includes(query)).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : V.surf }}>
                    <TdCell ch={r.size} highlight />
                    <TdCell ch={r.area} mono right />
                    <TdCell ch={r.ampacity_cu} mono right />
                    <TdCell ch={r.ampacity_al} mono right />
                    <TdCell ch={r.weight_cu.toFixed(2)} mono right />
                    <TdCell ch={r.weight_al.toFixed(2)} mono right />
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
        <div style={{ padding:'10px 16px', borderTop:`1px solid ${V.brdM}`, background:V.surf, fontSize:11, color:V.muted }}>
          Data sourced from IEC 60364-5-52, IEC 60947-2, IEC 60034, IEC 60076-1. Values are indicative — always verify with manufacturer datasheets.
        </div>
      </div>
    </div>
  );
}
