import React, { useState } from 'react';
import { Gauge, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ModHeader, WhyMatters, EngineeringNotes, KpiCard, SectionLabel } from '../common/ModuleShared';

const ACCENT = '#0891B2';
const V = {
  bg:   'var(--ec-bg-card)', bgD: 'var(--ec-bg-root)', surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)', brdB: 'var(--ec-border)', brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)', muted: 'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

// ── RTD Pt100 table (°C → Ω) ──────────────────────────────────
const PT100: [number, number][] = [
  [-50,80.31],[-40,84.27],[-30,88.22],[-20,92.16],[-10,96.09],[0,100.00],
  [10,103.90],[20,107.79],[30,111.67],[40,115.54],[50,119.40],[60,123.24],
  [70,127.07],[80,130.89],[90,134.70],[100,138.50],[120,146.06],[150,157.33],
  [200,175.84],[250,194.08],[300,212.04],[350,229.72],[400,247.09],
];

// ── Thermocouple Type K (°C → mV) ────────────────────────────
const TYPE_K: [number, number][] = [
  [-50,-1.889],[-40,-1.527],[-30,-1.156],[-20,-0.778],[-10,-0.392],[0,0.000],
  [10,0.397],[20,0.798],[30,1.203],[40,1.611],[50,2.023],[60,2.436],
  [70,2.851],[80,3.267],[90,3.682],[100,4.096],[150,6.138],[200,8.138],
  [250,10.151],[300,12.209],[350,14.293],[400,16.397],[500,20.644],
  [600,24.905],[700,29.129],[800,33.275],[900,37.326],[1000,41.276],
  [1100,45.119],[1200,48.838],[1300,52.410],
];

// ── Type J (°C → mV) ─────────────────────────────────────────
const TYPE_J: [number, number][] = [
  [-40,-1.961],[-20,-0.995],[0,0.000],[20,1.019],[40,2.059],[60,3.116],
  [80,4.187],[100,5.269],[150,8.010],[200,10.779],[250,13.555],[300,16.327],
  [400,21.848],[500,27.393],[600,33.102],[700,39.132],[800,45.498],
];

// ── IS Hazardous zones ────────────────────────────────────────
const EX_ZONES = [
  { zone:'Zone 0', atex:'Category 1G', epr:'EPr Ga', desc:'Explosive atmosphere present continuously or for long periods' },
  { zone:'Zone 1', atex:'Category 2G', epr:'EPr Gb', desc:'Explosive atmosphere likely to occur in normal operation' },
  { zone:'Zone 2', atex:'Category 3G', epr:'EPr Gc', desc:'Explosive atmosphere not likely in normal operation' },
  { zone:'Zone 20', atex:'Category 1D', epr:'EPr Da', desc:'Combustible dust: continuously present' },
  { zone:'Zone 21', atex:'Category 2D', epr:'EPr Db', desc:'Combustible dust: likely in normal operation' },
  { zone:'Zone 22', atex:'Category 3D', epr:'EPr Dc', desc:'Combustible dust: not likely in normal operation' },
];

// ── Protection types ─────────────────────────────────────────
const PROT_TYPES = [
  { code:'Ex ia', name:'Intrinsic Safety (ia)', zone:'0,1,2',  standard:'IEC 60079-11', desc:'Limits energy (V, I, P) to below ignition threshold — safest, allows live maintenance' },
  { code:'Ex ib', name:'Intrinsic Safety (ib)', zone:'1,2',    standard:'IEC 60079-11', desc:'Similar to ia but single fault allowed' },
  { code:'Ex d',  name:'Flameproof Enclosure',  zone:'1,2',    standard:'IEC 60079-1',  desc:'Enclosure withstands internal explosion; gases exit through narrow gaps and cool' },
  { code:'Ex e',  name:'Increased Safety',       zone:'1,2',    standard:'IEC 60079-7',  desc:'Prevents arc/sparks by increased design margins — motors, junction boxes' },
  { code:'Ex p',  name:'Pressurisation',         zone:'1,2',    standard:'IEC 60079-2',  desc:'Keeps hazardous gases away with positive pressure purge gas' },
  { code:'Ex n',  name:'Non-sparking',            zone:'2 only', standard:'IEC 60079-15', desc:'Normal operation does not produce sparks — zone 2 only' },
  { code:'Ex m',  name:'Encapsulation',           zone:'0,1,2',  standard:'IEC 60079-18', desc:'Encapsulates components in resin — no contact with atmosphere' },
  { code:'Ex q',  name:'Powder Filling',          zone:'1,2',    standard:'IEC 60079-5',  desc:'Surrounds circuit with powder (quartz/sand) to prevent ignition' },
];

// ── 4-20mA Loop Calculator ────────────────────────────────────
function LoopCalc() {
  const { addCalculation } = useStore();
  const [vSupply,   setVSupply]   = useState(24);
  const [vTx,       setVTx]       = useState(10);  // transmitter voltage
  const [rCable,    setRCable]    = useState(50);   // cable resistance in Ω
  const [rBarrier,  setRBarrier]  = useState(300);  // Zener barrier/isolator resistance
  const [rReceiver, setRReceiver] = useState(250);  // PLC/DCS input resistance
  const [res, setRes] = useState<null | { maxLoop: number; used: number; headroom: number; v20mA: number; v4mA: number; status: 'PASS'|'FAIL'|'WARNING' }>(null);

  const calculate = () => {
    const rTotal = rCable + rBarrier + rReceiver;
    const vTxAtMax = vTx;
    const vAvail = vSupply - vTxAtMax;
    const maxLoop = vAvail / 0.020; // Ω for 20mA
    const headroom = maxLoop - rTotal;
    const v20mA = rReceiver * 0.020;
    const v4mA  = rReceiver * 0.004;
    const status: 'PASS'|'FAIL'|'WARNING' = headroom < 0 ? 'FAIL' : headroom < maxLoop * 0.15 ? 'WARNING' : 'PASS';
    setRes({ maxLoop, used: rTotal, headroom, v20mA, v4mA, status });
    addCalculation({
      type:'instrumentation',
      title:`4-20mA Loop — ${vSupply}V supply, ${rTotal.toFixed(0)}Ω loop`,
      inputs:{ supplyVoltage:`${vSupply} V`, txVoltage:`${vTx} V`, cableR:`${rCable} Ω`, barrierR:`${rBarrier} Ω`, receiverR:`${rReceiver} Ω` },
      results:{
        values:[
          { label:'Max Loop Resistance', value: maxLoop.toFixed(0),    unit:'Ω', highlight:true },
          { label:'Total Loop Resistance',value: rTotal.toFixed(0),    unit:'Ω', highlight:true, status },
          { label:'Headroom',             value: headroom.toFixed(0),  unit:'Ω' },
          { label:'Receiver V at 20mA',  value: v20mA.toFixed(2),     unit:'V' },
        ],
        status, recommendation: status==='PASS'?`Loop OK — ${headroom.toFixed(0)} Ω headroom.`:`Reduce loop resistance or increase supply voltage.`,
        formula:'V_available = V_supply − V_tx ; R_max = V_available / I_max', steps:[],
        standardRef:{ standard:'IEC 60381-1', clause:'4', title:'4-20mA Analogue Signal Loops' },
      },
      notes:'', standard:'IEC 60381-1',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const statusColor = res?.status === 'PASS' ? '#16A34A' : res?.status === 'FAIL' ? '#DC2626' : '#D97706';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Loop Parameters" />
        {[
          { label:'Supply Voltage (V)',             val:vSupply,   set:setVSupply,   min:12,  max:48,  step:1 },
          { label:'Transmitter Voltage Drop (V)',   val:vTx,       set:setVTx,       min:5,   max:20,  step:0.5 },
          { label:'Cable Loop Resistance (Ω)',      val:rCable,    set:setRCable,    min:0,   max:1000,step:1 },
          { label:'Zener Barrier / Isolator (Ω)',  val:rBarrier,  set:setRBarrier,  min:0,   max:800, step:10 },
          { label:'Receiver / PLC Input (Ω)',       val:rReceiver, set:setRReceiver, min:0,   max:500, step:10 },
        ].map(({ label, val, set, min, max, step }) => (
          <div key={label} style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:V.lbl, display:'block', marginBottom:6 }}>{label}</label>
            <input type="number" value={val} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} style={inp} />
          </div>
        ))}
        <div style={{ padding:'12px 14px', background:`${ACCENT}10`, border:`1px solid ${ACCENT}25`, borderRadius:10, fontSize:12, color:V.muted, marginBottom:16 }}>
          <strong style={{ color:V.lbl }}>Cable resistance:</strong> Use R = ρL/A × 2 (go + return). Cu at 20°C: ρ = 0.0172 Ω·mm²/m
        </div>
        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${ACCENT},#0E7490)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:`0 8px 24px ${ACCENT}40` }}>
          Calculate Loop Budget
        </button>
      </div>

      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Loop Results" />
        {!res ? (
          <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center', color:V.muted, fontSize:13 }}>Enter parameters and calculate</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'14px 18px', borderRadius:12, border:`1px solid ${statusColor}40`, background:`${statusColor}0C`, display:'flex', alignItems:'center', gap:12 }}>
              {res.status === 'PASS' ? <CheckCircle2 style={{ width:22, height:22, color:'#22C55E' }} /> : res.status === 'FAIL' ? <XCircle style={{ width:22, height:22, color:'#EF4444' }} /> : <AlertTriangle style={{ width:22, height:22, color:'#F59E0B' }} />}
              <div style={{ fontSize:14, fontWeight:800, color:statusColor }}>{res.status === 'PASS' ? 'Loop OK — Within resistance budget' : res.status === 'FAIL' ? 'FAIL — Resistance exceeds budget' : 'WARNING — Less than 15% headroom'}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <KpiCard label="Max Loop R" value={res.maxLoop.toFixed(0)} unit="Ω" accentColor={ACCENT} />
              <KpiCard label="Total Used" value={res.used.toFixed(0)} unit="Ω" accentColor={ACCENT} />
              <KpiCard label="Headroom" value={res.headroom.toFixed(0)} unit="Ω" accentColor={ACCENT} />
              <KpiCard label="V at 20mA (Rx)" value={res.v20mA.toFixed(2)} unit="V" accentColor={ACCENT} />
            </div>
            {/* Fill bar */}
            <div style={{ background:V.surf, borderRadius:12, padding:16, border:`1px solid ${V.brd}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, marginBottom:8 }}>
                <span style={{ color:V.muted }}>Loop Utilisation</span>
                <span style={{ color:statusColor, fontFamily:V.mono }}>{((res.used / res.maxLoop) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height:12, background:V.bgD, borderRadius:6, overflow:'hidden', border:`1px solid ${V.brdB}` }}>
                <div style={{ height:'100%', width:`${Math.min((res.used/res.maxLoop)*100,100)}%`, background: res.status==='PASS'?'linear-gradient(90deg,#22C55E,#16A34A)':res.status==='FAIL'?'linear-gradient(90deg,#EF4444,#DC2626)':'linear-gradient(90deg,#F59E0B,#D97706)', borderRadius:6 }} />
              </div>
              <div style={{ fontSize:11, color:V.muted, marginTop:6 }}>4mA receiver voltage: <span style={{ fontFamily:V.mono, color:V.sec }}>{res.v4mA.toFixed(2)} V</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RTD Reference Table ───────────────────────────────────────
function RtdRef() {
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, display:'flex', alignItems:'center', gap:10 }}>
        <Gauge style={{ width:16, height:16, color:ACCENT }} />
        <span style={{ fontSize:14, fontWeight:700, color:V.txt }}>RTD Reference — Pt100 (IEC 60751, α=0.00385 Ω/Ω·°C)</span>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:V.surf }}>
              {['Temp (°C)','Pt100 (Ω)','Temp (°C)','Pt100 (Ω)','Connection Type','Advantage'].map((h,i) => (
                <th key={i} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PT100.slice(0, Math.ceil(PT100.length/2)).map((r, i) => {
              const r2 = PT100[i + Math.ceil(PT100.length/2)];
              const conn = i === 0 ? '2-wire' : i === 1 ? '3-wire' : i === 2 ? '4-wire (Kelvin)' : '';
              const adv  = i === 0 ? 'Simplest — includes cable resistance error' : i === 1 ? 'Cable R compensated — most common industrial' : i === 2 ? 'Eliminates cable R — highest accuracy' : '';
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${V.brdM}`, background: i % 2 ? V.surf : 'transparent' }}>
                  <td style={{ padding:'9px 14px', fontSize:13, fontFamily:V.mono, color:V.sec, fontWeight:600 }}>{r[0]}</td>
                  <td style={{ padding:'9px 14px', fontSize:13, fontFamily:V.mono, color:ACCENT, fontWeight:700 }}>{r[1].toFixed(2)}</td>
                  <td style={{ padding:'9px 14px', fontSize:13, fontFamily:V.mono, color:V.sec, fontWeight:600 }}>{r2 ? r2[0] : '—'}</td>
                  <td style={{ padding:'9px 14px', fontSize:13, fontFamily:V.mono, color:ACCENT, fontWeight:700 }}>{r2 ? r2[1].toFixed(2) : '—'}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, fontWeight:700, color:V.txt }}>{conn}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:V.muted }}>{adv}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding:'10px 20px', borderTop:`1px solid ${V.brdM}`, background:V.surf, fontSize:11, color:V.muted }}>
        Pt100: R₀ = 100 Ω at 0°C · Callendar-Van Dusen equation · IEC 60751 Class A (±0.15+0.002|T|) °C · Class B (±0.30+0.005|T|) °C
      </div>
    </div>
  );
}

// ── Thermocouple Reference ────────────────────────────────────
function TcRef() {
  const [tcType, setTcType] = useState<'K'|'J'>('K');
  const data = tcType === 'K' ? TYPE_K : TYPE_J;
  const COLOR: Record<string,'K'|'J'> = { K:'K', J:'J' };
  const TC_INFO = {
    K: { range:'-200 to 1350°C', material:'Ni-Cr / Ni-Al', color:'Green', tol:'Class 1: ±1.5°C or 0.4%; Class 2: ±2.5°C or 0.75%', standard:'IEC 60584-1' },
    J: { range:'-40 to 750°C',  material:'Fe / Cu-Ni',    color:'Black (US) / Black-White (IEC)', tol:'Class 1: ±1.5°C or 0.4%', standard:'IEC 60584-1' },
  };
  const info = TC_INFO[tcType];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:10 }}>
        {(['K','J'] as const).map((t) => (
          <button key={t} onClick={() => setTcType(t)} style={{ padding:'8px 20px', borderRadius:10, border:`1.5px solid ${tcType===t ? ACCENT : V.brdB}`, background: tcType===t ? `${ACCENT}18` : V.bg, color: tcType===t ? ACCENT : V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Type {t}
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[{l:'Range',t:info.range},{l:'Material',t:info.material},{l:'Tolerance',t:info.tol},{l:'Standard',t:info.standard}].map(({l,t}) => (
          <div key={l} style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:10, padding:'12px 14px', boxShadow:'var(--ec-shadow-card)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:12, fontWeight:700, color:V.sec }}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
        <div style={{ padding:'12px 20px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:13, fontWeight:700, color:V.txt }}>
          Type {tcType} — EMF vs Temperature (IEC 60584-1, Cold Junction 0°C)
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', overflowX:'auto' }}>
          {data.map((r,i) => (
            <div key={i} style={{ display:'contents' }}>
              <div style={{ padding:'8px 14px', borderBottom:`1px solid ${V.brdM}`, fontSize:12, fontFamily:V.mono, fontWeight:600, color:V.sec, background: i%2?V.surf:'transparent' }}>{r[0]}°C</div>
              <div style={{ padding:'8px 14px', borderBottom:`1px solid ${V.brdM}`, fontSize:12, fontFamily:V.mono, fontWeight:700, color:ACCENT, background: i%2?V.surf:'transparent', gridColumn:'span 3' }}>{r[1].toFixed(3)} mV</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── IS / Ex Reference ─────────────────────────────────────────
function ExRef() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
        <div style={{ padding:'14px 20px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:14, fontWeight:700, color:V.txt }}>Hazardous Area Zone Classification (IEC 60079-10)</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:V.surf }}>
            {['Zone','ATEX Category','EPr','Description'].map(h => <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {EX_ZONES.map((z,i) => (
              <tr key={z.zone} style={{ borderBottom:`1px solid ${V.brdM}`, background: i%2?V.surf:'transparent' }}>
                <td style={{ padding:'10px 14px', fontFamily:V.mono, fontWeight:800, fontSize:13, color: z.zone.includes('0') || z.zone.includes('20') ? '#DC2626' : z.zone.includes('1') || z.zone.includes('21') ? '#D97706' : '#16A34A' }}>{z.zone}</td>
                <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:V.sec }}>{z.atex}</td>
                <td style={{ padding:'10px 14px', fontSize:12, fontFamily:V.mono, color:ACCENT }}>{z.epr}</td>
                <td style={{ padding:'10px 14px', fontSize:12, color:V.muted }}>{z.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
        <div style={{ padding:'14px 20px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:14, fontWeight:700, color:V.txt }}>Protection Concept Reference (IEC 60079 series)</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:V.surf }}>
            {['Code','Name','Zones','Standard','Description'].map(h => <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {PROT_TYPES.map((p,i) => (
              <tr key={p.code} style={{ borderBottom:`1px solid ${V.brdM}`, background: i%2?V.surf:'transparent' }}>
                <td style={{ padding:'10px 14px', fontFamily:V.mono, fontWeight:800, fontSize:13, color:ACCENT }}>{p.code}</td>
                <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700, color:V.sec }}>{p.name}</td>
                <td style={{ padding:'10px 14px', fontSize:12, fontFamily:V.mono, color:V.muted }}>{p.zone}</td>
                <td style={{ padding:'10px 14px', fontSize:11, color:V.muted }}>{p.standard}</td>
                <td style={{ padding:'10px 14px', fontSize:12, color:V.muted, maxWidth:320 }}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Why / Notes ───────────────────────────────────────────────
const WHY_ITEMS = [
  { title:'4-20mA Loop Integrity',  desc:'The 4mA live-zero allows cable break detection (0mA) vs minimum signal — critical for safety-critical instrument loops.' },
  { title:'Loop Resistance Budget', desc:'Exceeding the maximum loop resistance starves the transmitter, causing signal saturation at 20mA before the process reaches its maximum value.' },
  { title:'RTD vs Thermocouple',    desc:'RTDs (Pt100) offer higher accuracy (±0.1°C), stability, and repeatability. Thermocouples cover wider temperature ranges (up to 1750°C) at lower cost.' },
  { title:'Intrinsic Safety',       desc:'IS (Ex ia/ib) is the safest approach for hazardous areas — it limits electrical energy below ignition levels. Unlike flameproof (Ex d), live maintenance is permitted.' },
  { title:'Signal Cable Shielding', desc:'Instrument cables must be screened (shielded) and grounded at one end only to prevent circulating ground currents that corrupt 4-20mA signals.' },
  { title:'Cold Junction Compensation', desc:'Thermocouple EMF is relative to 0°C reference. Modern instruments use an RTD at the terminal to measure ambient temperature and compensate automatically.' },
];

const NOTES = [
  { color:ACCENT,    title:'IEC 60381-1 — 4-20mA Signal Loops', body:'The 4-20mA current loop is the most common instrumentation signal standard. Maximum loop resistance Rmax = (Vsupply − Vtx) / 0.020A. Typical supply = 24 VDC. NAMUR NE28 recommends minimum 2 V margin across the transmitter at 20mA. For HART communication, the minimum loop resistance at the HART device must be ≥ 230 Ω (typically 250 Ω).' },
  { color:'#7C3AED', title:'IEC 60751 — RTD Classes', body:'Pt100 Class A tolerance: ±(0.15 + 0.002|T|)°C. Class B: ±(0.30 + 0.005|T|)°C. 4-wire (Kelvin) connection eliminates lead resistance error completely. 3-wire connection compensates for lead resistance if all three leads have equal resistance — the most common industrial choice.' },
  { color:'#DC2626', title:'IEC 60079-11 — Intrinsic Safety Design', body:'IS barriers limit Voc (open-circuit voltage), Isc (short-circuit current), and Pi (peak power). Entity parameters of the field device must all be ≤ barrier output parameters. Cable parameters (Ci, Li) must not exceed barrier allowable values. Zener barriers require a reliable earth; galvanic isolators do not and are preferred in modern installations.' },
  { color:'#059669', title:'IEC 60584-1 — Thermocouple Standards', body:'Type K (Ni-Cr/Ni-Al) is the most widely used: -200 to 1350°C. Type J (Fe/Cu-Ni): -40 to 750°C, susceptible to oxidation above 500°C — avoid in hydrogen atmospheres. Type T (Cu/Cu-Ni): -200 to 350°C, excellent for low temperatures. Type E: highest sensitivity, -200 to 900°C. Always use extension cable matching the thermocouple type to avoid parasitic EMF errors.' },
];

const TABS_DEF = [
  { id:'loop',  label:'4-20mA Loop Calculator' },
  { id:'rtd',   label:'RTD / Pt100 Reference'  },
  { id:'tc',    label:'Thermocouple EMF'        },
  { id:'ex',    label:'IS / Ex Zone Reference'  },
];

export function InstControlCalc() {
  const [tab, setTab] = useState('loop');
  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Gauge} title="INSTRUMENT & CONTROL REFERENCE" subtitle="IEC 60381 · IEC 60751 · IEC 60584 · IEC 60079 — 4-20mA loops, RTD, thermocouple, Ex zones" accentColor={ACCENT} />
      <div style={{ display:'flex', gap:8, marginBottom:28, padding:'6px', background:V.bgD, borderRadius:14, width:'fit-content', border:`1px solid ${V.brd}` }}>
        {TABS_DEF.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'9px 18px', borderRadius:10, border:`1px solid ${tab===t.id?ACCENT:'transparent'}`, background:tab===t.id?`${ACCENT}18`:'transparent', color:tab===t.id?ACCENT:V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'loop' && <LoopCalc />}
      {tab === 'rtd'  && <RtdRef />}
      {tab === 'tc'   && <TcRef />}
      {tab === 'ex'   && <ExRef />}
      <div style={{ marginTop:28 }}>
        <WhyMatters items={WHY_ITEMS} />
        <EngineeringNotes notes={NOTES} />
      </div>
    </div>
  );
}
