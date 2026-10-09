import React, { useState, useMemo } from 'react';
import { Flame, AlertTriangle, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ModHeader, WhyMatters, EngineeringNotes, KpiCard, SectionLabel } from '../common/ModuleShared';

const ACCENT = '#EF4444';
const V = {
  bg:   'var(--ec-bg-card)', bgD:'var(--ec-bg-root)', surf:'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)', brdB:'var(--ec-border)', brdM:'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)', sec:'var(--ec-text-secondary)', muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)', mono:"'JetBrains Mono',monospace",
};

// ── PPE Categories (NFPA 70E-2021 Table 130.7(C)(15)(c)) ────
const PPE_CATS = [
  {
    cat:'0', min:0, max:1.2, color:'#22C55E', bg:'rgba(34,197,94,.10)', border:'rgba(34,197,94,.30)',
    ppe:'Non-melting, flammable natural fibre (minimum)',
    examples:'Cotton shirt, cotton pants',
    cal:'< 1.2 cal/cm²',
  },
  {
    cat:'1', min:1.2, max:4, color:'#84CC16', bg:'rgba(132,204,22,.10)', border:'rgba(132,204,22,.30)',
    ppe:'Arc-rated clothing with min 4 cal/cm² rating',
    examples:'Arc-rated shirt & pants or coverall, safety glasses, hearing protection',
    cal:'1.2 – 4 cal/cm²',
  },
  {
    cat:'2', min:4, max:8, color:'#F59E0B', bg:'rgba(245,158,11,.10)', border:'rgba(245,158,11,.30)',
    ppe:'Arc-rated clothing with min 8 cal/cm² rating',
    examples:'Arc-rated shirt & pants, arc-rated face shield (8 cal min) or arc flash hood, hearing protection',
    cal:'4 – 8 cal/cm²',
  },
  {
    cat:'3', min:8, max:25, color:'#F97316', bg:'rgba(249,115,22,.10)', border:'rgba(249,115,22,.30)',
    ppe:'Arc-rated suit with min 25 cal/cm² system rating',
    examples:'Arc flash suit, arc-rated hood (25 cal), leather gloves (Type R or S), leather over boots',
    cal:'8 – 25 cal/cm²',
  },
  {
    cat:'4', min:25, max:40, color:'#EF4444', bg:'rgba(239,68,68,.10)', border:'rgba(239,68,68,.30)',
    ppe:'Arc-rated suit with min 40 cal/cm² system rating',
    examples:'Heavy duty arc flash suit, 40 cal/cm² face shield, arc-rated gloves, leather over boots',
    cal:'25 – 40 cal/cm²',
  },
  {
    cat:'DANGER', min:40, max:Infinity, color:'#9F1239', bg:'rgba(159,18,57,.15)', border:'rgba(159,18,57,.40)',
    ppe:'⛔ DO NOT WORK ENERGISED — de-energise before working',
    examples:'Incident energy > 40 cal/cm². No PPE category defined. Equipment must be de-energised.',
    cal:'> 40 cal/cm²',
  },
];

// ── Equipment configurations (IEEE 1584-2018 Table 3) ────────
const EQUIP_CONFIGS = [
  { id:'VCB',    label:'15 kV switchgear (VCB)',       gap:152, D:914,  x:0.973, K1:-0.555, K2:0 },
  { id:'VCBB',   label:'15 kV switchgear (VCBB)',      gap:152, D:914,  x:0.973, K1:-0.555, K2:0 },
  { id:'HCB',    label:'LV switchgear (HCB)',          gap:32,  D:610,  x:1.473, K1:-0.555, K2:0 },
  { id:'MCC',    label:'LV MCC / panel (box)',         gap:25,  D:457,  x:1.473, K1:-0.555, K2:0 },
  { id:'CB',     label:'LV panelboard (CB, open)',     gap:25,  D:457,  x:1.473, K1:-0.792, K2:0 },
  { id:'open',   label:'Open air conductors',          gap:40,  D:900,  x:1.641, K1:-0.792, K2:0 },
];

// ── IEEE 1584-2002 arcing current (log10 basis) ───────────────
function calcArcingCurrent(Ibf_kA: number, V_kV: number, gap_mm: number, isLV: boolean): number {
  const logIbf = Math.log10(Ibf_kA);
  if (isLV) {
    const K1 = -0.153; // open air  (use -0.097 for enclosed — we use open for conservative)
    const logIa = K1 + 0.662 * logIbf + 0.0966 * V_kV + 0.000526 * gap_mm
      + 0.5588 * V_kV * logIbf - 0.00304 * gap_mm * logIbf;
    return Math.pow(10, logIa); // kA
  } else {
    // MV (1–15 kV)
    const logIa = 0.00402 + 0.983 * logIbf;
    return Math.pow(10, logIa); // kA
  }
}

// ── Incident energy (IEEE 1584-2002 eq. 4) ───────────────────
function calcIncidentEnergy(Ia_kA: number, t_s: number, D_mm: number, gap_mm: number, K1: number, K2: number, x: number): number {
  // Normalised energy at t=0.2s, D=610mm
  const logEn = K1 + K2 + 1.081 * Math.log10(Ia_kA) + 0.0011 * gap_mm;
  const En = Math.pow(10, logEn); // cal/cm²
  // Scale to actual distance and time
  const E = En * (t_s / 0.2) * Math.pow(610 / D_mm, x);
  return E; // cal/cm²
}

// ── Arc flash boundary (D at 1.2 cal/cm²) ────────────────────
function calcAFB(Ia_kA: number, t_s: number, gap_mm: number, K1: number, K2: number, x: number): number {
  const logEn = K1 + K2 + 1.081 * Math.log10(Ia_kA) + 0.0011 * gap_mm;
  const En = Math.pow(10, logEn);
  // AFB = 610 × [En × (t/0.2) / 1.2]^(1/x)
  return 610 * Math.pow((En * t_s / 0.2) / 1.2, 1 / x); // mm
}

function getPpeCategory(E: number) {
  return PPE_CATS.find(c => E >= c.min && E < c.max) ?? PPE_CATS[PPE_CATS.length - 1];
}

// ── Main Calculator ───────────────────────────────────────────
function ArcFlashCalculator() {
  const { addCalculation } = useStore();
  const [sysVolt,    setSysVolt]    = useState(415);     // V
  const [Ibf_kA,    setIbf]        = useState(25);      // kA
  const [equipId,   setEquipId]    = useState('MCC');
  const [arcDur_ms, setArcDur]     = useState(200);     // ms
  const [workingD,  setWorkingD]   = useState(457);     // mm custom working distance
  const [grounding, setGrounding]  = useState<'solidly'|'ungrounded'>('solidly');

  const equip = EQUIP_CONFIGS.find(e => e.id === equipId) ?? EQUIP_CONFIGS[0];
  const isLV  = sysVolt <= 1000;
  const V_kV  = sysVolt / 1000;
  const t_s   = arcDur_ms / 1000;
  const K2    = grounding === 'ungrounded' ? -0.681 : 0;

  const [res, setRes] = useState<null|{
    Ia: number; E: number; AFB_mm: number; AFB_m: number;
    ppe: typeof PPE_CATS[0]; energyStr: string;
    status: 'PASS'|'FAIL'|'WARNING'|'INFO';
  }>(null);

  const calculate = () => {
    const Ia  = calcArcingCurrent(Ibf_kA, V_kV, equip.gap, isLV);
    const E   = calcIncidentEnergy(Ia, t_s, workingD, equip.gap, equip.K1, K2, equip.x);
    const AFB = calcAFB(Ia, t_s, equip.gap, equip.K1, K2, equip.x);
    const ppe = getPpeCategory(E);
    const status = E > 40 ? 'FAIL' : E > 25 ? 'WARNING' : 'INFO';
    setRes({ Ia, E, AFB_mm: AFB, AFB_m: AFB / 1000, ppe, energyStr: E.toFixed(2), status });
    addCalculation({
      type:'arc-flash',
      title:`Arc Flash — ${sysVolt}V, ${Ibf_kA}kA, ${E.toFixed(1)} cal/cm², Cat ${ppe.cat}`,
      inputs:{ voltage:`${sysVolt} V`, faultCurrent:`${Ibf_kA} kA`, equipment:equip.label, duration:`${arcDur_ms} ms`, workingDistance:`${workingD} mm` },
      results:{
        values:[
          { label:'Arcing Current', value:(Ia * 1000).toFixed(0), unit:'A' },
          { label:'Incident Energy', value:E.toFixed(2), unit:'cal/cm²', highlight:true, status },
          { label:'Arc Flash Boundary', value:(AFB/1000).toFixed(2), unit:'m' },
          { label:'PPE Category', value:`Cat ${ppe.cat}`, unit:'', highlight:true },
        ],
        status, recommendation:`PPE Category ${ppe.cat}: ${ppe.ppe}. Boundary: ${(AFB/1000).toFixed(2)} m.`,
        formula:'E = En × (t/0.2) × (610/D)^x ; En from IEEE 1584 regression', steps:[],
        standardRef:{ standard:'IEEE 1584-2018 / NFPA 70E-2021', clause:'§5', title:'IEEE Guide for Performing Arc Flash Hazard Calculations' },
      },
      notes:'', standard:'IEEE 1584-2018',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const sel: React.CSSProperties = { ...inp, cursor:'pointer' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:24, marginBottom:28 }}>
      {/* Inputs */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="System Parameters" />
        {[
          { label:'System Voltage (V)',              val:sysVolt,   set:setSysVolt,  min:208,  max:15000, step:1 },
          { label:'3-Phase Bolted Fault Current (kA)',val:Ibf_kA,  set:setIbf,      min:0.5,  max:100,   step:0.5 },
          { label:'Working Distance (mm)',           val:workingD,  set:setWorkingD, min:150,  max:3000,  step:10 },
          { label:'Arc Duration (ms)',               val:arcDur_ms, set:setArcDur,   min:10,   max:5000,  step:10 },
        ].map(({ label, val, set, min, max, step }) => (
          <div key={label} style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>{label}</label>
            <input type="number" value={val} min={min} max={max} step={step} onChange={(e)=>set(Number(e.target.value))} style={inp} />
          </div>
        ))}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Equipment Configuration</label>
          <select value={equipId} onChange={(e)=>setEquipId(e.target.value)} style={sel}>
            {EQUIP_CONFIGS.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:8 }}>System Grounding</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {([['solidly','Solidly Grounded'],['ungrounded','Ungrounded / HRG']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setGrounding(id)} style={{ padding:'9px', borderRadius:9, border:`1.5px solid ${grounding===id?ACCENT:V.brdB}`, background:grounding===id?`${ACCENT}12`:V.surf, color:grounding===id?ACCENT:V.muted, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding:'10px 12px', background:V.surf, borderRadius:10, border:`1px solid ${V.brd}`, fontSize:11, color:V.muted, marginBottom:16 }}>
          <strong style={{ color:V.lbl }}>Gap:</strong> {equip.gap} mm · <strong style={{ color:V.lbl }}>Default D:</strong> {equip.D} mm · <strong style={{ color:V.lbl }}>x:</strong> {equip.x}
        </div>
        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${ACCENT},#B91C1C)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:`0 8px 24px ${ACCENT}40`, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Flame style={{ width:18, height:18 }} /> Calculate Arc Flash
        </button>
      </div>

      {/* Results */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Arc Flash Results" />
        {!res ? (
          <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center', color:V.muted }}>
              <Flame style={{ width:36, height:36, margin:'0 auto 10px', opacity:0.3 }} />
              <div style={{ fontSize:13 }}>Enter system parameters and calculate</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* PPE banner */}
            <div style={{ padding:'16px 20px', borderRadius:14, border:`2px solid ${res.ppe.border}`, background:res.ppe.bg, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:60, height:60, borderRadius:12, background:res.ppe.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Shield style={{ width:30, height:30, color:'#fff' }} />
              </div>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:res.ppe.color, letterSpacing:'-0.02em' }}>
                  PPE Category {res.ppe.cat}
                </div>
                <div style={{ fontSize:13, color:V.sec, marginTop:3 }}>{res.ppe.cal}</div>
                <div style={{ fontSize:12, color:V.muted, marginTop:4 }}>{res.ppe.ppe}</div>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              <KpiCard label="Arcing Current" value={(res.Ia * 1000).toFixed(0)} unit="A" accentColor={ACCENT} />
              <KpiCard label="Incident Energy" value={res.E.toFixed(2)} unit="cal/cm²" accentColor={ACCENT} />
              <KpiCard label="Arc Flash Boundary" value={res.AFB_m.toFixed(2)} unit="m" accentColor={ACCENT} />
              <KpiCard label="Working Distance" value={(workingD/1000).toFixed(3)} unit="m" accentColor={ACCENT} />
            </div>

            {/* Energy gauge */}
            <div style={{ background:V.surf, borderRadius:12, padding:'16px 20px', border:`1px solid ${V.brd}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:8 }}>
                <span style={{ color:V.muted }}>Incident Energy vs Boundaries</span>
                <span style={{ fontFamily:V.mono, color:res.ppe.color }}>{res.E.toFixed(2)} cal/cm²</span>
              </div>
              <div style={{ display:'flex', gap:2, height:20, borderRadius:8, overflow:'hidden', border:`1px solid ${V.brdB}` }}>
                {PPE_CATS.slice(0,5).map((c,i) => {
                  const width = i < 4 ? `${(c.max - c.min) / 40 * 100}%` : '10%';
                  return <div key={c.cat} style={{ height:'100%', width, background:c.color, opacity:0.6 }} />;
                })}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                {[1.2,4,8,25,40].map(v=>(
                  <span key={v} style={{ fontSize:10, color:V.muted }}>{v} ▲</span>
                ))}
              </div>
            </div>

            {/* PPE detail */}
            <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Required PPE — {res.ppe.cal}</div>
              <div style={{ fontSize:13, color:V.sec, lineHeight:1.7 }}>{res.ppe.examples}</div>
            </div>

            {/* Safety distances */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ background:V.bgD, borderRadius:10, padding:'12px 14px', border:`1px solid ${V.brd}` }}>
                <div style={{ fontSize:11, color:V.muted, fontWeight:700, marginBottom:4 }}>Arc Flash Boundary</div>
                <div style={{ fontSize:18, fontWeight:800, color:ACCENT, fontFamily:V.mono }}>{res.AFB_m.toFixed(3)} m</div>
                <div style={{ fontSize:11, color:V.muted }}>= {res.AFB_mm.toFixed(0)} mm — stay beyond unless PPE worn</div>
              </div>
              <div style={{ background:V.bgD, borderRadius:10, padding:'12px 14px', border:`1px solid ${V.brd}` }}>
                <div style={{ fontSize:11, color:V.muted, fontWeight:700, marginBottom:4 }}>Limited Approach Boundary</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#D97706', fontFamily:V.mono }}>{(sysVolt<=150?1.07:sysVolt<=750?1.22:sysVolt<=15000?2.44:3.66).toFixed(2)} m</div>
                <div style={{ fontSize:11, color:V.muted }}>NFPA 70E Table 130.4(D)(a) — unqualified persons</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PPE Category reference ────────────────────────────────────
function PpeReference() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
      <div style={{ fontSize:14, fontWeight:700, color:V.txt, marginBottom:4 }}>PPE Categories — NFPA 70E-2021 Table 130.7(C)(15)(c)</div>
      {PPE_CATS.map(c=>(
        <div key={c.cat} style={{ background:V.bg, border:`1px solid ${c.border}`, borderRadius:14, padding:'16px 20px', boxShadow:'var(--ec-shadow-card)', display:'flex', gap:16, alignItems:'flex-start' }}>
          <div style={{ width:50, height:50, borderRadius:12, background:c.bg, border:`1.5px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:18, fontWeight:900, color:c.color }}>{c.cat}</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:14, fontWeight:800, color:c.color }}>Category {c.cat}</span>
              <span style={{ padding:'2px 10px', borderRadius:20, background:c.bg, border:`1px solid ${c.border}`, fontSize:12, fontWeight:700, color:c.color, fontFamily:V.mono }}>{c.cal}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:V.sec, marginBottom:4 }}>{c.ppe}</div>
            <div style={{ fontSize:12, color:V.muted }}>{c.examples}</div>
          </div>
        </div>
      ))}
      <div style={{ padding:'12px 16px', background:V.bg, border:`1px solid ${V.brd}`, borderRadius:12, fontSize:12, color:V.muted, boxShadow:'var(--ec-shadow-card)' }}>
        NFPA 70E-2021 also defines the <strong style={{ color:V.sec }}>Restricted Approach Boundary</strong> (only qualified persons with relevant PPE) and the <strong style={{ color:V.sec }}>Limited Approach Boundary</strong> (unqualified persons must be escorted). Both are based on voltage level, not incident energy. Arc flash boundary (AFB) is energy-based and must be calculated per IEEE 1584.
      </div>
    </div>
  );
}

// ── Typical incident energy table ────────────────────────────
function TypicalEnergyTable() {
  const cases = [
    { system:'120V, 1kA, 100ms, open panel',     ia:'0.8 kA',  e:'0.1', ppe:'0' },
    { system:'208V, 5kA, 200ms, MCC box',        ia:'3.7 kA',  e:'1.8', ppe:'1' },
    { system:'400V, 10kA, 200ms, MCC',           ia:'7.2 kA',  e:'5.5', ppe:'2' },
    { system:'400V, 25kA, 200ms, LV switchgear', ia:'17.1 kA', e:'14.2',ppe:'3' },
    { system:'400V, 50kA, 200ms, LV switchgear', ia:'28.1 kA', e:'28.0',ppe:'4' },
    { system:'6.6kV, 20kA, 300ms, MV board',     ia:'18.7 kA', e:'19.5',ppe:'3' },
    { system:'11kV, 25kA, 500ms, MV switchgear', ia:'23.1 kA', e:'60+', ppe:'DANGER' },
  ];
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)', marginBottom:28 }}>
      <div style={{ padding:'14px 20px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:14, fontWeight:700, color:V.txt }}>Typical Incident Energy Examples (IEEE 1584-2002, indicative)</div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr style={{ background:V.surf }}>
          {['System / Conditions','Arcing Current','Incident Energy','PPE Cat'].map(h=>(
            <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}` }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {cases.map((r,i)=>{
            const ppe = PPE_CATS.find(c=>c.cat===r.ppe) ?? PPE_CATS[0];
            return (
              <tr key={i} style={{ borderBottom:`1px solid ${V.brdM}`, background:i%2?V.surf:'transparent' }}>
                <td style={{ padding:'10px 14px', fontSize:12, color:V.sec }}>{r.system}</td>
                <td style={{ padding:'10px 14px', fontFamily:V.mono, fontSize:12, color:V.muted }}>{r.ia}</td>
                <td style={{ padding:'10px 14px', fontFamily:V.mono, fontSize:13, fontWeight:700, color:ppe.color }}>{r.e} cal/cm²</td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:800, background:ppe.bg, border:`1px solid ${ppe.border}`, color:ppe.color }}>{r.ppe==='DANGER'?'DANGER':r.ppe==='0'?'Cat 0':`Cat ${r.ppe}`}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding:'10px 16px', background:V.surf, borderTop:`1px solid ${V.brdM}`, fontSize:11, color:V.muted }}>Values are indicative only. Always perform site-specific calculations with actual fault current data and confirmed protective device clearing times.</div>
    </div>
  );
}

const WHY_ITEMS = [
  { title:'Why Arc Flash Is Lethal',        desc:'An arc flash converts electrical energy to heat — temperatures reach 20,000°C (4× the sun surface). The pressure wave, flying shrapnel, molten copper, and UV flash all cause severe injury within milliseconds.' },
  { title:'Arc Duration = Critical Variable',desc:'Incident energy is directly proportional to arc duration. Reducing clearing time from 500ms to 100ms reduces energy by 5×. Fast-acting relays and current-limiting fuses dramatically reduce PPE requirements.' },
  { title:'Reduced Working Distance',       desc:'Incident energy drops with the square of distance (E ∝ 1/D^x). Doubling the working distance reduces energy by 75% for switchgear (x≈2). Use remote racking, remote switching, and remote monitoring.' },
  { title:'Maintenance Mode Setting',       desc:'Many modern protection relays include an "arc flash maintenance mode" that temporarily reduces clearing time (e.g., to 50ms) when personnel are working — significantly lowering PPE requirements.' },
  { title:'High-Resistance Grounding (HRG)',desc:'Ungrounded and HRG systems have higher incident energy in some configurations. HRG limits ground fault current but does not eliminate the arc flash hazard for phase-to-phase faults.' },
  { title:'IEEE 1584-2018 vs 2002',         desc:'The 2018 revision uses a much more complex multi-variable regression model with enclosure effects, busbar orientation, and equipment gaps — generally giving different (sometimes lower) incident energy than 2002.' },
];

const NOTES = [
  { color:ACCENT, title:'IEEE 1584-2018 — Incident Energy Calculation', body:'IEEE 1584-2018 requires: system voltage (208V–15kV), available 3-phase fault current (0.2–106 kA), conductor gap (G), working distance (D), and arc duration (t). Arcing current is calculated via regression equations. Incident energy E = En × (t/0.2) × (610/D)^x. The 2018 model includes separate equations for different electrode configurations (VCB, HCB, MCC) and enclosure sizes.' },
  { color:'#D97706', title:'NFPA 70E-2021 — Safe Work Practices', body:'NFPA 70E requires arc flash risk assessment for any energised work on 50V+ circuits. Results must be posted on equipment labels: voltage, available fault current, clearing time, incident energy, working distance, and PPE category. "Energised electrical work permit" required when working on energised equipment > 50V. Risk assessment must be reviewed when system changes occur (new transformers, new feeders, etc.).' },
  { color:'#7C3AED', title:'Approach Boundaries (NFPA 70E Table 130.4)', body:'Three concentric boundaries: (1) Arc Flash Boundary — PPE required, based on incident energy (E ≥ 1.2 cal/cm²); (2) Restricted Approach Boundary — qualified workers only with full PPE (e.g., 300mm for 480V); (3) Limited Approach Boundary — unqualified persons may not cross without escort and full PPE (e.g., 1.07m for 120V, 1.22m for 480V). The innermost boundary is Prohibited Approach (<12mm for MV).' },
  { color:'#059669', title:'Arc Flash Label Requirements (NFPA 70E §130.5(H))', body:'Equipment labels must show: nominal system voltage, arc flash boundary distance, incident energy at the stated working distance, the working distance, minimum arc rating of PPE, and date of the study. Labels must be replaced when the equipment changes. Many jurisdictions (US, UAE, others) require NFPA 70E compliance on industrial installations. AS/NZS 4836 and EN 50110 have similar requirements.' },
];

const TABS_DEF = [
  { id:'calc',  label:'Arc Flash Calculator' },
  { id:'ppe',   label:'PPE Category Reference' },
  { id:'table', label:'Typical Energy Examples' },
];

export function ArcFlashCalc() {
  const [tab, setTab] = useState('calc');
  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Flame} title="ARC FLASH CALCULATOR" subtitle="IEEE 1584-2018 · NFPA 70E-2021 — Incident energy, PPE category, arc flash boundary and approach distances" accentColor={ACCENT} />
      <div style={{ display:'flex', gap:8, marginBottom:28, padding:'6px', background:V.bgD, borderRadius:14, width:'fit-content', border:`1px solid ${V.brd}` }}>
        {TABS_DEF.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'9px 18px', borderRadius:10, border:`1px solid ${tab===t.id?ACCENT:'transparent'}`, background:tab===t.id?`${ACCENT}18`:'transparent', color:tab===t.id?ACCENT:V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'calc'  && <ArcFlashCalculator />}
      {tab === 'ppe'   && <PpeReference />}
      {tab === 'table' && <TypicalEnergyTable />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
