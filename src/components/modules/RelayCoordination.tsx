import React, { useState, useMemo } from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ModHeader, WhyMatters, EngineeringNotes, KpiCard, SectionLabel } from '../common/ModuleShared';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const ACCENT = '#7C3AED';
const V = {
  bg:   'var(--ec-bg-card)', bgD:'var(--ec-bg-root)', surf:'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)', brdB:'var(--ec-border)', brdM:'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)', sec:'var(--ec-text-secondary)', muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)', mono:"'JetBrains Mono',monospace",
};

// ── IDMT curve equations (IEC 60255-151) ─────────────────────
type CurveId = 'SI'|'VI'|'EI'|'LTI'|'MI'|'VIeee'|'EIeee'|'DT';
interface Curve { id: CurveId; name: string; std: string; color: string }

const CURVES: Curve[] = [
  { id:'SI',    name:'Standard Inverse (SI)',     std:'IEC 60255-151', color:'#2563EB' },
  { id:'VI',    name:'Very Inverse (VI)',          std:'IEC 60255-151', color:'#16A34A' },
  { id:'EI',    name:'Extremely Inverse (EI)',     std:'IEC 60255-151', color:'#DC2626' },
  { id:'LTI',   name:'Long-Time Inverse (LTI)',    std:'IEC 60255-151', color:'#D97706' },
  { id:'MI',    name:'Moderately Inverse',         std:'IEEE C37.112',  color:'#0891B2' },
  { id:'VIeee', name:'Very Inverse (IEEE)',        std:'IEEE C37.112',  color:'#7C3AED' },
  { id:'EIeee', name:'Extremely Inverse (IEEE)',   std:'IEEE C37.112',  color:'#EC4899' },
  { id:'DT',    name:'Definite Time (DT)',         std:'IEC 60255-101', color:'#64748B' },
];

function tripTime(curve: CurveId, M: number, tms: number, dt: number): number {
  if (M <= 1) return Infinity;
  switch (curve) {
    case 'SI':    return tms * 0.14  / (Math.pow(M, 0.02) - 1);
    case 'VI':    return tms * 13.5  / (M - 1);
    case 'EI':    return tms * 80    / (M * M - 1);
    case 'LTI':   return tms * 120   / (M - 1);
    case 'MI':    return tms * (0.0515 / (Math.pow(M, 0.02) - 1) + 0.114);
    case 'VIeee': return tms * (19.61 / (M * M - 1) + 0.491);
    case 'EIeee': return tms * (28.2  / (M * M - 1) + 0.1217);
    case 'DT':    return dt;
    default:      return Infinity;
  }
}

// ── Single relay trip-time calculator ────────────────────────
function SingleRelayCalc() {
  const { addCalculation } = useStore();
  const [curve,      setCurve]     = useState<CurveId>('VI');
  const [ctRatio,    setCtRatio]   = useState(400);   // primary/secondary
  const [ctSec,      setCtSec]     = useState(5);
  const [Is,         setIs]        = useState(5);     // pickup current (secondary A)
  const [tms,        setTms]       = useState(0.3);
  const [dtTime,     setDtTime]    = useState(0.5);
  const [faultPrimary,setFaultPrimary]=useState(8000); // primary fault current A

  const pickupPrimary = useMemo(() => Is * ctRatio, [Is, ctRatio]);
  const Ia_sec        = useMemo(() => faultPrimary / ctRatio, [faultPrimary, ctRatio]);
  const M             = useMemo(() => Ia_sec / Is, [Ia_sec, Is]);
  const tripT         = useMemo(() => tripTime(curve, M, tms, dtTime), [curve, M, tms, dtTime]);

  // Build chart data — multiples of Is from 1.1 to 20
  const chartData = useMemo(() => {
    const pts: { M: number; t: number }[] = [];
    for (let m = 1.1; m <= 20; m += 0.1) {
      const t = tripTime(curve, m, tms, dtTime);
      if (t > 0 && t <= 30) pts.push({ M: parseFloat(m.toFixed(1)), t: parseFloat(t.toFixed(3)) });
    }
    return pts;
  }, [curve, tms, dtTime]);

  const calculate = () => {
    addCalculation({
      type:'relay',
      title:`Relay — ${CURVES.find(c=>c.id===curve)?.name ?? curve}, TMS=${tms}, Is=${Is}A (sec)`,
      inputs:{ curve, ctRatio:`${ctRatio}/${ctSec}`, pickupSec:`${Is} A`, tms:tms.toString(), faultCurrent:`${faultPrimary} A` },
      results:{
        values:[
          { label:'Pickup (Primary)', value:pickupPrimary.toFixed(0), unit:'A' },
          { label:'M (I/Is)',         value:M.toFixed(2),             unit:'×', highlight:true },
          { label:'Trip Time',        value:isFinite(tripT)?tripT.toFixed(3):'∞', unit:'s', highlight:true },
        ],
        status:'INFO',
        recommendation:`Trip in ${isFinite(tripT)?tripT.toFixed(3):'∞'} s at ${faultPrimary} A (M = ${M.toFixed(2)}×Is). ${tripT>2?'Consider lower TMS for faster fault clearance.':'Fast trip — verify upstream coordination.'}`,
        formula:'t = TMS × K / [(I/Is)^α − 1]', steps:[],
        standardRef:{ standard:'IEC 60255-151', clause:'Table 1', title:'IDMT Overcurrent Relay Characteristics' },
      },
      notes:'', standard:'IEC 60255-151',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const sel: React.CSSProperties = { ...inp, cursor:'pointer' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:24, marginBottom:28 }}>

      {/* Inputs */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Relay Settings" />
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:6 }}>Characteristic Curve</label>
          <select value={curve} onChange={(e) => setCurve(e.target.value as CurveId)} style={sel}>
            {CURVES.map(c => <option key={c.id} value={c.id}>{c.name} — {c.std}</option>)}
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>CT Ratio (Primary)</label>
            <input type="number" value={ctRatio} min={1} step={50} onChange={(e)=>setCtRatio(Number(e.target.value))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>CT Secondary (A)</label>
            <select value={ctSec} onChange={(e)=>setCtSec(Number(e.target.value))} style={sel}>
              {[1,5].map(v=><option key={v} value={v}>{v} A</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Pickup Current Is (secondary A)</label>
          <input type="number" value={Is} min={0.1} step={0.1} onChange={(e)=>setIs(Number(e.target.value))} style={inp} />
          <div style={{ fontSize:11, color:V.muted, marginTop:4 }}>= {pickupPrimary.toFixed(0)} A primary</div>
        </div>
        {curve !== 'DT' ? (
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Time Multiplier Setting (TMS)</label>
            <input type="number" value={tms} min={0.025} max={2} step={0.025} onChange={(e)=>setTms(Number(e.target.value))} style={inp} />
          </div>
        ) : (
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Definite Time Setting (s)</label>
            <input type="number" value={dtTime} min={0.05} max={10} step={0.05} onChange={(e)=>setDtTime(Number(e.target.value))} style={inp} />
          </div>
        )}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Fault Current — Primary (A)</label>
          <input type="number" value={faultPrimary} min={1} step={100} onChange={(e)=>setFaultPrimary(Number(e.target.value))} style={inp} />
        </div>

        {/* Live result */}
        <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}`, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <KpiCard label="M (I/Is)" value={M.toFixed(2)} unit="×" accentColor={ACCENT} />
            <KpiCard label="Trip Time" value={isFinite(tripT)?tripT.toFixed(3):'∞'} unit="s" accentColor={ACCENT} />
          </div>
        </div>
        <button onClick={calculate} style={{ width:'100%', height:46, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${ACCENT},#6D28D9)`, color:'#fff', fontSize:14, fontWeight:800, fontFamily:'inherit', boxShadow:`0 8px 24px ${ACCENT}40` }}>
          Save to History
        </button>
      </div>

      {/* Chart */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title={`Trip Time Curve — ${CURVES.find(c=>c.id===curve)?.name}`} />
        <div style={{ height:320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top:8, right:8, left:-10, bottom:8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ec-border-muted)" />
              <XAxis dataKey="M" type="number" domain={[1,20]} label={{ value:'I/Is (×)', position:'insideBottom', offset:-4, fontSize:11, fill:'var(--ec-text-muted)' }} tick={{ fontSize:10, fill:'var(--ec-text-muted)' }} />
              <YAxis domain={[0,30]} label={{ value:'Trip time (s)', angle:-90, position:'insideLeft', offset:14, fontSize:11, fill:'var(--ec-text-muted)' }} tick={{ fontSize:10, fill:'var(--ec-text-muted)' }} />
              <Tooltip contentStyle={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border)', borderRadius:8, fontSize:12 }} labelStyle={{ color:'var(--ec-text-primary)', fontWeight:700 }} formatter={(v:unknown) => [`${v} s`,'Trip time']} labelFormatter={(l:unknown) => `M = ${l}×`} />
              <ReferenceLine x={M} stroke="#EF4444" strokeDasharray="4 4" label={{ value:`M=${M.toFixed(2)}`, fontSize:10, fill:'#EF4444' }} />
              <ReferenceLine y={isFinite(tripT)?tripT:undefined} stroke="#EF4444" strokeDasharray="4 4" label={{ value:isFinite(tripT)?`${tripT.toFixed(3)}s`:'', fontSize:10, fill:'#EF4444' }} />
              <Line type="monotone" dataKey="t" stroke={CURVES.find(c=>c.id===curve)?.color??ACCENT} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trip time table at key fault multiples */}
        <div style={{ marginTop:16, background:V.bgD, borderRadius:12, border:`1px solid ${V.brd}`, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:12, fontWeight:700, color:V.txt }}>Trip Time at Key Multiples</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)' }}>
            {[2,3,4,5,7,10,15,20].map(m => {
              const t = tripTime(curve, m, tms, dtTime);
              return (
                <div key={m} style={{ padding:'10px 8px', borderRight:`1px solid ${V.brdM}`, textAlign:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:V.muted, marginBottom:4 }}>{m}×Is</div>
                  <div style={{ fontSize:13, fontWeight:800, fontFamily:V.mono, color:ACCENT }}>{isFinite(t)?t.toFixed(2):'∞'}</div>
                  <div style={{ fontSize:9, color:V.muted }}>s</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Two-relay grading / coordination ─────────────────────────
function GradingCheck() {
  const [curveD, setCurveD] = useState<CurveId>('VI');
  const [curveU, setCurveU] = useState<CurveId>('VI');
  const [IsD,    setIsD]    = useState(5);    // downstream Is (secondary)
  const [tmsD,   setTmsD]   = useState(0.2);
  const [IsU,    setIsU]    = useState(4);    // upstream
  const [tmsU,   setTmsU]   = useState(0.5);
  const [ctiMin, setCtiMin] = useState(0.3);

  const faultMultiples = [2,3,5,8,10,15,20];

  const rows = useMemo(() => faultMultiples.map(m => {
    const tD = tripTime(curveD, m * IsD / IsD, tmsD, 0);
    const tU = tripTime(curveU, m * IsD / IsU, tmsU, 0);
    const cti = tU - tD;
    return { m, tD, tU, cti, ok: cti >= ctiMin };
  }), [curveD, curveU, IsD, tmsD, IsU, tmsU, ctiMin]);

  const allOk = rows.every(r => r.ok);

  // Chart data
  const chartData = useMemo(() => {
    const pts: { m: number; d: number; u: number }[] = [];
    for (let m = 1.1; m <= 20; m += 0.2) {
      const tD = tripTime(curveD, m, tmsD, 0);
      const tU = tripTime(curveU, m * IsD / IsU, tmsU, 0);
      if (tD > 0 && tD < 30 && tU > 0 && tU < 30)
        pts.push({ m: parseFloat(m.toFixed(1)), d: parseFloat(tD.toFixed(3)), u: parseFloat(tU.toFixed(3)) });
    }
    return pts;
  }, [curveD, curveU, IsD, tmsD, IsU, tmsU]);

  const inp: React.CSSProperties = { height:38, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:8, color:V.txt, fontSize:13, fontWeight:700, padding:'0 10px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const sel: React.CSSProperties = { ...inp, cursor:'pointer' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, marginBottom:28 }}>
      {/* Settings */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {[
          { label:'Downstream Relay', curve:curveD, setCurve:setCurveD, Is:IsD, setIs:setIsD, tms:tmsD, setTms:setTmsD, color:'#2563EB' },
          { label:'Upstream Relay',   curve:curveU, setCurve:setCurveU, Is:IsU, setIs:setIsU, tms:tmsU, setTms:setTmsU, color:'#DC2626' },
        ].map(({ label, curve, setCurve, Is, setIs, tms, setTms, color }) => (
          <div key={label} style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:14, padding:20, boxShadow:'var(--ec-shadow-card)', borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:13, fontWeight:800, color, marginBottom:14 }}>{label}</div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Curve</label>
              <select value={curve} onChange={(e)=>setCurve(e.target.value as CurveId)} style={sel}>
                {CURVES.filter(c=>c.id!=='DT').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Is (sec A)</label>
                <input type="number" value={Is} min={0.1} step={0.1} onChange={(e)=>setIs(Number(e.target.value))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>TMS</label>
                <input type="number" value={tms} min={0.025} max={2} step={0.025} onChange={(e)=>setTms(Number(e.target.value))} style={inp} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTI setting */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 20px', background:V.bg, border:`1px solid ${V.brd}`, borderRadius:12, boxShadow:'var(--ec-shadow-card)' }}>
        <span style={{ fontSize:13, fontWeight:700, color:V.lbl, whiteSpace:'nowrap' }}>Minimum CTI (s)</span>
        <input type="number" value={ctiMin} min={0.1} max={1} step={0.05} onChange={(e)=>setCtiMin(Number(e.target.value))} style={{ ...inp, width:100 }} />
        <div style={{ padding:'8px 16px', borderRadius:10, background: allOk?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)', border:`1px solid ${allOk?'rgba(34,197,94,.35)':'rgba(239,68,68,.35)'}`, display:'flex', alignItems:'center', gap:8 }}>
          {allOk ? <CheckCircle2 style={{ width:16, height:16, color:'#22C55E' }} /> : <XCircle style={{ width:16, height:16, color:'#EF4444' }} />}
          <span style={{ fontSize:13, fontWeight:800, color: allOk?'#16A34A':'#DC2626' }}>
            {allOk?'COORDINATED':'NOT COORDINATED'}
          </span>
        </div>
        <span style={{ fontSize:12, color:V.muted }}>LV: 0.3s · HV: 0.5s · Fused: 0.2s typical</span>
      </div>

      {/* Chart + Table */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:20 }}>
        <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:20, boxShadow:'var(--ec-shadow-card)' }}>
          <SectionLabel title="Time-Current Coordination Curves" />
          <div style={{ height:300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top:4, right:8, left:-10, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ec-border-muted)" />
                <XAxis dataKey="m" type="number" domain={[1,20]} label={{ value:'I/Is (downstream ×)', position:'insideBottom', offset:-4, fontSize:11, fill:'var(--ec-text-muted)' }} tick={{ fontSize:10, fill:'var(--ec-text-muted)' }} />
                <YAxis domain={[0,20]} label={{ value:'Trip time (s)', angle:-90, position:'insideLeft', offset:14, fontSize:11, fill:'var(--ec-text-muted)' }} tick={{ fontSize:10, fill:'var(--ec-text-muted)' }} />
                <Tooltip contentStyle={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border)', borderRadius:8, fontSize:12 }} labelStyle={{ color:'var(--ec-text-primary)', fontWeight:700 }} labelFormatter={(l:unknown)=>`M = ${l}×`} />
                <Legend wrapperStyle={{ fontSize:12, color:'var(--ec-text-muted)' }} />
                <Line type="monotone" dataKey="d" name="Downstream" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="u" name="Upstream"   stroke="#DC2626" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
          <div style={{ padding:'12px 16px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:13, fontWeight:700, color:V.txt }}>CTI at Key Multiples</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:V.surf }}>
              {['M×','t Downstream (s)','t Upstream (s)','CTI (s)','Status'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', fontSize:10, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${V.brdM}`, textAlign:'center' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((r,i) => (
                <tr key={r.m} style={{ background:i%2?V.surf:'transparent', borderBottom:`1px solid ${V.brdM}` }}>
                  <td style={{ padding:'9px 12px', fontFamily:V.mono, fontSize:12, fontWeight:700, color:V.sec, textAlign:'center' }}>{r.m}</td>
                  <td style={{ padding:'9px 12px', fontFamily:V.mono, fontSize:12, color:'#2563EB', textAlign:'center' }}>{isFinite(r.tD)?r.tD.toFixed(3):'∞'}</td>
                  <td style={{ padding:'9px 12px', fontFamily:V.mono, fontSize:12, color:'#DC2626', textAlign:'center' }}>{isFinite(r.tU)?r.tU.toFixed(3):'∞'}</td>
                  <td style={{ padding:'9px 12px', fontFamily:V.mono, fontSize:12, fontWeight:700, color: r.ok?'#16A34A':'#DC2626', textAlign:'center' }}>{isFinite(r.cti)?r.cti.toFixed(3):'∞'}</td>
                  <td style={{ padding:'9px 12px', textAlign:'center' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:800, background:r.ok?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)', border:`1px solid ${r.ok?'rgba(34,197,94,.35)':'rgba(239,68,68,.35)'}`, color:r.ok?'#16A34A':'#DC2626' }}>
                      {r.ok?'OK':'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Curve reference table ─────────────────────────────────────
function CurveReference() {
  const rows = [
    { curve:'Standard Inverse (SI)',    k:'0.14',  a:'0.02', std:'IEC 60255-151 Tbl 1', use:'General distribution feeder protection' },
    { curve:'Very Inverse (VI)',         k:'13.5',  a:'1.00', std:'IEC 60255-151 Tbl 1', use:'Fuses / feeders where fast trip at high fault preferred' },
    { curve:'Extremely Inverse (EI)',    k:'80',    a:'2.00', std:'IEC 60255-151 Tbl 1', use:'Co-ordination with fuses, transformer protection' },
    { curve:'Long-Time Inverse (LTI)',   k:'120',   a:'1.00', std:'IEC 60255-151 Tbl 1', use:'Motor starting — high inrush tolerance' },
    { curve:'Moderately Inverse (MI)',   k:'0.0515',a:'0.02', std:'IEEE C37.112 Tbl 1',  use:'North American distribution systems' },
    { curve:'Very Inverse (IEEE)',        k:'19.61', a:'2.00', std:'IEEE C37.112 Tbl 1',  use:'Grids with high X/R ratios' },
    { curve:'Extremely Inverse (IEEE)',   k:'28.2',  a:'2.00', std:'IEEE C37.112 Tbl 1',  use:'Fuse co-ordination, feeder with motor loads' },
    { curve:'Definite Time (DT)',         k:'—',     a:'—',    std:'IEC 60255-101',        use:'Bus protection, known fault levels, simple grading' },
  ];
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)', marginBottom:28 }}>
      <div style={{ padding:'14px 20px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:14, fontWeight:700, color:V.txt }}>
        IDMT Curve Reference — t = TMS × k / [(I/Is)^α − 1]
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr style={{ background:V.surf }}>
          {['Curve','k','α','Standard','Best Used For'].map(h=>(
            <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}` }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={r.curve} style={{ borderBottom:`1px solid ${V.brdM}`, background:i%2?V.surf:'transparent' }}>
              <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:V.sec }}>{r.curve}</td>
              <td style={{ padding:'10px 14px', fontSize:13, fontFamily:V.mono, color:ACCENT }}>{r.k}</td>
              <td style={{ padding:'10px 14px', fontSize:13, fontFamily:V.mono, color:ACCENT }}>{r.a}</td>
              <td style={{ padding:'10px 14px', fontSize:12, color:V.muted }}>{r.std}</td>
              <td style={{ padding:'10px 14px', fontSize:12, color:V.muted }}>{r.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const WHY_ITEMS = [
  { title:'Selectivity (Discrimination)',   desc:'Proper relay coordination ensures only the relay nearest a fault operates, leaving healthy parts of the system energised — minimising outage scope.' },
  { title:'Coordination Time Interval (CTI)',desc:'CTI accounts for circuit breaker interrupting time (3-5 cycles), relay overshoot time (~0.05s), and instrument transformer errors. LV: ≥0.3s; HV: ≥0.5s.' },
  { title:'Why Very Inverse for Cables?',   desc:'VI and EI characteristics match the thermal damage curve of cables and motors — fast operation at high fault currents, slower at sustained low overcurrents.' },
  { title:'IDMT vs Definite Time',          desc:'IDMT adapts trip time to fault severity — faster at higher currents. Definite time gives a fixed delay regardless of fault magnitude, simpler for bus protection.' },
  { title:'CT Saturation Risk',             desc:'At high fault currents, CTs can saturate, reducing secondary output. Over-specified CT accuracy class (5P20 vs 5P10) provides more headroom before saturation.' },
  { title:'Protection vs Overload',         desc:'Overcurrent relays serve both overload (50-150% In, slow) and fault protection (>500% In, fast). Setting Is too high may miss low-level faults that still damage equipment.' },
];

const NOTES = [
  { color:ACCENT, title:'IEC 60255-151 — IDMT Characteristics', body:'Four standard IEC curves: SI (Standard Inverse), VI (Very Inverse), EI (Extremely Inverse), LTI (Long-Time Inverse). General equation: t = TMS × k / [(I/Is)^α − 1]. TMS ranges: typically 0.025–1.0 in 0.025 steps. Is (pickup): 0.5×–2.5× CT secondary rating. IEC 60255-151 superseded IEC 255-4 (1976) and BS 142 (1966) — older relays may use slightly different constants.' },
  { color:'#2563EB', title:'IEEE C37.112 — North American Curves', body:'Three IEEE curves: Moderately Inverse (MI), Very Inverse (VI), Extremely Inverse (EI). Different constants to IEC — cannot be mixed on the same system without verifying coordination curves graphically. IEEE Extremely Inverse closely matches fuse time-current characteristics, making it useful for fuse coordination in North American distribution systems.' },
  { color:'#DC2626', title:'Coordination with Fuses and CBs', body:'Fuses have time-current characteristics that are both minimum melting (MM) and total clearing (TC). The upstream relay must trip slower than the fuse TC curve at all fault currents to ensure the fuse clears the fault first. For MCCB coordination, the MCCB instantaneous trip may limit the range where relay grading is needed. Always use the device manufacturer\'s TCC data.' },
  { color:'#059669', title:'Directional and Differential Protection', body:'Plain overcurrent relays cannot distinguish between load current and fault current flowing in the "wrong" direction in ring or meshed networks. Directional overcurrent relays (67) and current differential relays (87) are required. Differential relay operates on I_in − I_out exceeding a threshold — highly selective for transformer, generator, and busbar protection.' },
];

const TABS_DEF = [
  { id:'single',   label:'Single Relay Calculator' },
  { id:'grading',  label:'Coordination Check (2 Relays)' },
  { id:'ref',      label:'Curve Reference' },
];

export function RelayCoordination() {
  const [tab, setTab] = useState('single');
  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Shield} title="RELAY COORDINATION" subtitle="IEC 60255-151 · IEEE C37.112 — IDMT overcurrent relay settings, grading and time-current curves" accentColor={ACCENT} />
      <div style={{ display:'flex', gap:8, marginBottom:28, padding:'6px', background:V.bgD, borderRadius:14, width:'fit-content', border:`1px solid ${V.brd}` }}>
        {TABS_DEF.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'9px 18px', borderRadius:10, border:`1px solid ${tab===t.id?ACCENT:'transparent'}`, background:tab===t.id?`${ACCENT}18`:'transparent', color:tab===t.id?ACCENT:V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'single'  && <SingleRelayCalc />}
      {tab === 'grading' && <GradingCheck />}
      {tab === 'ref'     && <CurveReference />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
