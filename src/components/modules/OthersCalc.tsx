import React, { useState } from 'react';
import { Grid3x3, CheckCircle2, AlertTriangle, Thermometer, Shield, Zap, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ModHeader, WhyMatters, EngineeringNotes, KpiCard, SectionLabel } from '../common/ModuleShared';

const ACCENT = '#64748B';
const V = {
  bg:   'var(--ec-bg-card)', bgD: 'var(--ec-bg-root)', surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)', brdB: 'var(--ec-border)', brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)', muted: 'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

// ── IP Rating data ────────────────────────────────────────────
const IP_RATINGS = [
  { ip:'IP20', solid:'Protected against solid objects >12.5mm (fingers)', liquid:'No protection',            nema:'NEMA 1',    use:'Indoor panels, domestic distribution boards' },
  { ip:'IP31', solid:'Protected against solid objects >2.5mm (tools)',    liquid:'Dripping water (vertical)', nema:'NEMA 2',    use:'Indoor, light water drip environments' },
  { ip:'IP44', solid:'Protected against solid objects >1mm (wires)',      liquid:'Water splash (all directions)',nema:'NEMA 3R', use:'Outdoor light-duty, pole-mounted equipment' },
  { ip:'IP54', solid:'Dust protected (limited ingress)',                   liquid:'Water splash (all directions)',nema:'NEMA 3',  use:'Industrial outdoor enclosures' },
  { ip:'IP55', solid:'Dust protected',                                     liquid:'Water jets (all directions)', nema:'NEMA 4',  use:'Outdoor wash-down areas, light hose' },
  { ip:'IP65', solid:'Dust tight (no ingress)',                            liquid:'Water jets (all directions)', nema:'NEMA 4',  use:'Industrial outdoor — standard for most outdoor panels' },
  { ip:'IP66', solid:'Dust tight',                                         liquid:'Powerful water jets',         nema:'NEMA 4X', use:'Wash-down areas, chemical plants, coastal' },
  { ip:'IP67', solid:'Dust tight',                                         liquid:'Temporary immersion (1m/30min)',nema:'NEMA 6', use:'Underground distribution, temporary flooding' },
  { ip:'IP68', solid:'Dust tight',                                         liquid:'Continuous immersion (depth specified)',nema:'NEMA 6P',use:'Submersible equipment, deep water' },
  { ip:'IP69K',solid:'Dust tight',                                         liquid:'High pressure/temp water jets', nema:'—',      use:'Food processing, chemical, steam cleaning' },
];

// ── Wire color code table ─────────────────────────────────────
const WIRE_COLORS = [
  { fn:'Phase L1', iec:'Brown',  nec:'Black',        bs7671:'Brown',  as:'Red',    india:'Red'    },
  { fn:'Phase L2', iec:'Black',  nec:'Red',           bs7671:'Black',  as:'White',  india:'Yellow' },
  { fn:'Phase L3', iec:'Grey',   nec:'Blue',          bs7671:'Grey',   as:'Blue',   india:'Blue'   },
  { fn:'Neutral',  iec:'Blue',   nec:'White',         bs7671:'Blue',   as:'Black',  india:'Black'  },
  { fn:'Earth (PE)',iec:'Green/Yellow',nec:'Green',   bs7671:'Green/Yellow',as:'Green/Yellow',india:'Green/Yellow' },
  { fn:'PEN',      iec:'Green/Yellow + Blue stripe',nec:'n/a',bs7671:'Green/Yellow',as:'—',india:'—' },
  { fn:'DC Positive',iec:'Red', nec:'Red',           bs7671:'Brown',  as:'Red',    india:'Red'    },
  { fn:'DC Negative',iec:'Black',nec:'Black',        bs7671:'Grey',   as:'Black',  india:'Black'  },
];

// ── Country electrical standards ─────────────────────────────
const COUNTRY_STD = [
  { country:'India',          voltage:'230/415 V',  freq:'50 Hz', standard:'IS 732 / IS 3043',  plug:'Type C/D/M' },
  { country:'UAE / GCC',      voltage:'230/400 V',  freq:'50 Hz', standard:'IEC 60364',         plug:'Type G' },
  { country:'UK',             voltage:'230/400 V',  freq:'50 Hz', standard:'BS 7671 (18th Ed)', plug:'Type G' },
  { country:'Germany / EU',   voltage:'230/400 V',  freq:'50 Hz', standard:'IEC 60364',         plug:'Type C/E/F' },
  { country:'USA / Canada',   voltage:'120/208/480 V',freq:'60 Hz',standard:'NEC (NFPA 70)',    plug:'Type A/B' },
  { country:'Australia',      voltage:'230/400 V',  freq:'50 Hz', standard:'AS/NZS 3000',       plug:'Type I' },
  { country:'Japan',          voltage:'100/200 V',  freq:'50/60 Hz',standard:'JIS C 3605',      plug:'Type A' },
  { country:'China',          voltage:'220/380 V',  freq:'50 Hz', standard:'GB 50054',          plug:'Type A/C/I' },
  { country:'South Africa',   voltage:'230/400 V',  freq:'50 Hz', standard:'SANS 10142',        plug:'Type M' },
  { country:'Singapore',      voltage:'230/400 V',  freq:'50 Hz', standard:'SS 638',            plug:'Type G' },
  { country:'Saudi Arabia',   voltage:'127/220/380 V',freq:'60 Hz',standard:'SASO / IEC',       plug:'Type A/B/G' },
  { country:'Brazil',         voltage:'127/220 V',  freq:'60 Hz', standard:'NBR 5410',          plug:'Type N (NBR 14136)' },
];

// ── AWG to mm² cross-reference ────────────────────────────────
const AWG_TABLE = [
  { awg:'28',  mm2:0.08,  dia_mm:0.32, R_ohm_km:213.9, amp:0.5  },
  { awg:'26',  mm2:0.13,  dia_mm:0.40, R_ohm_km:133.8, amp:1.0  },
  { awg:'24',  mm2:0.20,  dia_mm:0.51, R_ohm_km:84.2,  amp:2.0  },
  { awg:'22',  mm2:0.33,  dia_mm:0.64, R_ohm_km:53.5,  amp:3.0  },
  { awg:'20',  mm2:0.52,  dia_mm:0.81, R_ohm_km:33.6,  amp:5.0  },
  { awg:'18',  mm2:0.82,  dia_mm:1.02, R_ohm_km:21.2,  amp:7.0  },
  { awg:'16',  mm2:1.31,  dia_mm:1.29, R_ohm_km:13.3,  amp:13.0 },
  { awg:'14',  mm2:2.08,  dia_mm:1.63, R_ohm_km:8.29,  amp:17.0 },
  { awg:'12',  mm2:3.31,  dia_mm:2.05, R_ohm_km:5.21,  amp:23.0 },
  { awg:'10',  mm2:5.26,  dia_mm:2.59, R_ohm_km:3.28,  amp:33.0 },
  { awg:'8',   mm2:8.37,  dia_mm:3.26, R_ohm_km:2.06,  amp:46.0 },
  { awg:'6',   mm2:13.3,  dia_mm:4.11, R_ohm_km:1.30,  amp:60.0 },
  { awg:'4',   mm2:21.2,  dia_mm:5.19, R_ohm_km:0.815, amp:80.0 },
  { awg:'2',   mm2:33.6,  dia_mm:6.54, R_ohm_km:0.514, amp:100.0},
  { awg:'1/0', mm2:53.5,  dia_mm:8.25, R_ohm_km:0.322, amp:125.0},
  { awg:'2/0', mm2:67.4,  dia_mm:9.27, R_ohm_km:0.256, amp:150.0},
  { awg:'4/0', mm2:107.2, dia_mm:11.7, R_ohm_km:0.161, amp:195.0},
];

// ── Enclosure Heat Calculator (IEC 62208 / IEC TR 62631) ─────
function EnclosureCalc() {
  const { addCalculation } = useStore();
  const [W,       setW]       = useState(0.8);   // m
  const [H,       setH]       = useState(1.8);   // m
  const [D,       setD]       = useState(0.4);   // m
  const [Pd,      setPd]      = useState(500);   // W dissipation inside
  const [Tamb,    setTamb]    = useState(40);    // °C ambient
  const [encType, setEncType] = useState<'sealed'|'ventilated'>('sealed');
  const [res, setRes] = useState<null|{ surfaceArea:number; dT:number; Tint:number; k:number; status:'PASS'|'WARNING'|'FAIL'; heatFlux:number }>(null);

  const calculate = () => {
    // k ≈ 5.5 W/(m²·K) for sealed steel enclosure in free air
    // k ≈ 10-15 W/(m²·K) for ventilated
    const k = encType === 'sealed' ? 5.5 : 12;
    const A = 2 * (W * H + W * D + H * D); // total surface area
    const dT = Pd / (k * A);
    const Tint = Tamb + dT;
    const heatFlux = Pd / A;
    const status: 'PASS'|'WARNING'|'FAIL' = Tint <= 40 ? 'PASS' : Tint <= 55 ? 'WARNING' : 'FAIL';
    setRes({ surfaceArea:A, dT, Tint, k, status, heatFlux });
    addCalculation({
      type:'instrumentation',
      title:`Enclosure Thermal — ${Pd}W in ${W}m×${H}m×${D}m ${encType}`,
      inputs:{ width:`${W} m`, height:`${H} m`, depth:`${D} m`, dissipation:`${Pd} W`, ambient:`${Tamb}°C`, type:encType },
      results:{
        values:[
          { label:'Surface Area',   value:A.toFixed(2),    unit:'m²' },
          { label:'Temp Rise ΔT',   value:dT.toFixed(1),   unit:'°C', highlight:true },
          { label:'Internal Temp',  value:Tint.toFixed(1), unit:'°C', highlight:true, status },
          { label:'Heat Flux',      value:heatFlux.toFixed(0), unit:'W/m²' },
        ],
        status, recommendation: status==='PASS'?`Internal temp ${Tint.toFixed(1)}°C — OK for standard equipment.`:Tint<=55?`WARNING: ${Tint.toFixed(1)}°C — consider ventilation or forced cooling.`:`FAIL: ${Tint.toFixed(1)}°C — forced cooling required.`,
        formula:'ΔT = Pd / (k × A)', steps:[],
        standardRef:{ standard:'IEC 62208', clause:'Annex A', title:'Enclosure Thermal Performance' },
      },
      notes:'', standard:'IEC 62208',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const statusColor = res?.status === 'PASS' ? '#16A34A' : res?.status === 'FAIL' ? '#DC2626' : '#D97706';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Enclosure & Thermal Parameters" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            { label:'Width (m)',  val:W,    set:setW,    min:0.1, step:0.1 },
            { label:'Height (m)', val:H,    set:setH,    min:0.1, step:0.1 },
            { label:'Depth (m)',  val:D,    set:setD,    min:0.1, step:0.1 },
          ].map(({ label, val, set, min, step }) => (
            <div key={label}>
              <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>{label}</label>
              <input type="number" value={val} min={min} step={step} onChange={(e) => set(Number(e.target.value))} style={inp} />
            </div>
          ))}
        </div>
        {[
          { label:'Power Dissipation Inside (W)', val:Pd,   set:setPd,   min:1,   step:10 },
          { label:'Ambient Temperature (°C)',     val:Tamb, set:setTamb, min:-10, step:1  },
        ].map(({ label, val, set, min, step }) => (
          <div key={label} style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>{label}</label>
            <input type="number" value={val} min={min} step={step} onChange={(e) => set(Number(e.target.value))} style={inp} />
          </div>
        ))}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:8 }}>Enclosure Type</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {(['sealed','ventilated'] as const).map((t) => (
              <button key={t} onClick={() => setEncType(t)} style={{ padding:'10px', borderRadius:9, border:`1.5px solid ${encType===t?'#2563EB':V.brdB}`, background:encType===t?'rgba(37,99,235,.12)':V.surf, color:encType===t?'#2563EB':V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>
                {t}<br /><span style={{ fontSize:10, fontWeight:500 }}>{t==='sealed'?'k = 5.5 W/(m²·K)':'k = 12 W/(m²·K)'}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#475569,#334155)', color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:'0 8px 24px rgba(71,85,105,.4)' }}>
          Calculate Thermal Rise
        </button>
      </div>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Thermal Results" />
        {!res ? (
          <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center', color:V.muted, fontSize:13 }}><Thermometer style={{ width:32, height:32, margin:'0 auto 8px', opacity:0.3 }} /><br />Enter dimensions and calculate</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'14px 18px', borderRadius:12, border:`1px solid ${statusColor}40`, background:`${statusColor}0C`, display:'flex', alignItems:'center', gap:12 }}>
              {res.status === 'PASS' ? <CheckCircle2 style={{ width:22, height:22, color:'#22C55E' }} /> : <AlertTriangle style={{ width:22, height:22, color: res.status==='FAIL'?'#EF4444':'#F59E0B' }} />}
              <div style={{ fontSize:14, fontWeight:800, color:statusColor }}>
                {res.status === 'PASS' ? `Internal temp OK — ${res.Tint.toFixed(1)}°C` : res.status === 'WARNING' ? `WARNING — ${res.Tint.toFixed(1)}°C: consider ventilation` : `FAIL — ${res.Tint.toFixed(1)}°C: forced cooling needed`}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <KpiCard label="Surface Area" value={res.surfaceArea.toFixed(2)} unit="m²" accentColor="#475569" />
              <KpiCard label="Temp Rise ΔT" value={res.dT.toFixed(1)} unit="°C" accentColor="#475569" />
              <KpiCard label="Internal Temp" value={res.Tint.toFixed(1)} unit="°C" accentColor="#475569" />
              <KpiCard label="Heat Flux" value={res.heatFlux.toFixed(0)} unit="W/m²" accentColor="#475569" />
            </div>
            <div style={{ padding:'12px 14px', background:V.surf, borderRadius:10, border:`1px solid ${V.brd}`, fontSize:12, color:V.muted }}>
              <strong style={{ color:V.lbl }}>k = {res.k} W/(m²·K)</strong> · Rule of thumb: equipment rated max 70°C internal ambient. For every 10°C rise above 25°C, electronic component life halves (Arrhenius rule).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-table helpers ─────────────────────────────────────────
function Th({ ch }: { ch: string }) {
  return <th style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.brdM}`, background:V.surf, whiteSpace:'nowrap' }}>{ch}</th>;
}
function Td({ ch, mono, color }: { ch: React.ReactNode; mono?: boolean; color?: string }) {
  return <td style={{ padding:'10px 14px', fontSize:13, color:color??V.muted, fontFamily:mono?V.mono:'inherit', fontWeight:mono?700:500, borderBottom:`1px solid ${V.brdM}` }}>{ch}</td>;
}

function IpRef() {
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, fontSize:14, fontWeight:700, color:V.txt }}>IP Ingress Protection Ratings — IEC 60529</div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr><Th ch="IP Rating" /><Th ch="Solid Protection" /><Th ch="Liquid Protection" /><Th ch="NEMA Equiv." /><Th ch="Typical Use" /></tr></thead>
          <tbody>
            {IP_RATINGS.map((r, i) => (
              <tr key={r.ip} style={{ background: i%2?V.surf:'transparent' }}>
                <Td ch={r.ip} mono color="#2563EB" />
                <Td ch={r.solid} />
                <Td ch={r.liquid} />
                <Td ch={r.nema} mono />
                <Td ch={r.use} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WireColors() {
  const colorDot = (c: string) => {
    const map: Record<string, string> = { Brown:'#92400E', Black:'#1F2937', Grey:'#6B7280', Blue:'#1D4ED8', 'Green/Yellow':'#16A34A', Red:'#DC2626', White:'#9CA3AF', Green:'#16A34A' };
    const bg = Object.keys(map).find(k => c.includes(k));
    return <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:'50%', background:bg ? map[bg] : '#64748B', border:'1px solid rgba(0,0,0,.2)', flexShrink:0 }} />{c}</span>;
  };
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, fontSize:14, fontWeight:700, color:V.txt }}>Wire Color Codes by Standard</div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><Th ch="Function" /><Th ch="IEC 60446" /><Th ch="NEC (USA)" /><Th ch="BS 7671 (UK)" /><Th ch="AS/NZS 3000" /><Th ch="India IS 732" /></tr></thead>
        <tbody>
          {WIRE_COLORS.map((r, i) => (
            <tr key={r.fn} style={{ background: i%2?V.surf:'transparent' }}>
              <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:V.sec, borderBottom:`1px solid ${V.brdM}` }}>{r.fn}</td>
              {[r.iec, r.nec, r.bs7671, r.as, r.india].map((c, j) => (
                <td key={j} style={{ padding:'10px 14px', fontSize:12, borderBottom:`1px solid ${V.brdM}` }}>{colorDot(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding:'10px 16px', background:V.surf, borderTop:`1px solid ${V.brdM}`, fontSize:11, color:V.muted }}>IEC 60446 applies to fixed wiring from 2004. Older installations may use pre-2004 colors — always verify with local code.</div>
    </div>
  );
}

function CountryRef() {
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, fontSize:14, fontWeight:700, color:V.txt }}>Country Electrical Standards & Supply Voltages</div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><Th ch="Country / Region" /><Th ch="Voltage" /><Th ch="Frequency" /><Th ch="Standard" /><Th ch="Plug Type" /></tr></thead>
        <tbody>
          {COUNTRY_STD.map((r, i) => (
            <tr key={r.country} style={{ background: i%2?V.surf:'transparent' }}>
              <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:V.sec, borderBottom:`1px solid ${V.brdM}` }}>{r.country}</td>
              <Td ch={r.voltage} mono />
              <Td ch={r.freq} mono color={r.freq==='60 Hz'?'#D97706':ACCENT} />
              <Td ch={r.standard} />
              <Td ch={r.plug} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AwgRef() {
  return (
    <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, fontSize:14, fontWeight:700, color:V.txt }}>AWG to mm² Cross-Reference (ASTM B258 / IEC 60228)</div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><Th ch="AWG" /><Th ch="mm²" /><Th ch="Diameter (mm)" /><Th ch="R @ 20°C (Ω/km)" /><Th ch="Approx. Ampacity (A)" /></tr></thead>
        <tbody>
          {AWG_TABLE.map((r, i) => (
            <tr key={r.awg} style={{ background: i%2?V.surf:'transparent' }}>
              <Td ch={r.awg} mono color="#2563EB" />
              <Td ch={r.mm2} mono />
              <Td ch={r.dia_mm} mono />
              <Td ch={r.R_ohm_km} mono />
              <Td ch={r.amp} mono />
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding:'10px 16px', background:V.surf, borderTop:`1px solid ${V.brdM}`, fontSize:11, color:V.muted }}>Ampacity values are approximate for single conductor in free air at 30°C ambient. Apply NEC 310.15 or IEC 60364-5-52 correction factors for actual installation conditions.</div>
    </div>
  );
}

const WHY_ITEMS = [
  { title:'Enclosure IP Rating Selection',  desc:'IP rating must match the harshest environmental condition. Under-rating risks water ingress causing short circuits; over-rating wastes capital on sealed enclosures in dry indoor areas.' },
  { title:'Wire Color Code Compliance',     desc:'Using wrong colors in multi-standard projects causes commissioning errors and safety hazards during maintenance. Always document the standard used on drawings.' },
  { title:'AWG vs IEC Sizing',              desc:'AWG sizes are used in North American projects; IEC mm² in international and European projects. Direct substitution is not always valid — check ampacity, not just cross-section.' },
  { title:'Enclosure Thermal Management',   desc:'Every 10°C rise above 25°C halves the life of capacitors and PCBs (Arrhenius rule). Forced cooling is economically justified when internal temperature exceeds 55°C.' },
  { title:'Country Standard Compliance',    desc:'Equipment approved for one country standard may not meet requirements in another (e.g., NEC vs IEC). Always check local utility and authority requirements before design.' },
  { title:'Frequency Impact on Equipment',  desc:'60 Hz equipment in a 50 Hz system: motors run slower (1/1.2× speed), transformers risk core saturation. 50 Hz equipment in 60 Hz: motors run faster, reduced torque, fan designs differ.' },
];

const NOTES = [
  { color:'#2563EB', title:'IEC 60529 — IP Code Structure', body:'IP code: IP [first digit] [second digit] [additional letter]. First digit (0-6): solid particle protection. Second digit (0-9K): liquid ingress protection. "X" means not tested for that criterion. IP65 is the minimum for outdoor industrial panels. IP54 is the minimum for control panels in general industrial environments per IEC 61439.' },
  { color:'#16A34A', title:'IEC 60446 — Wire Color Harmonization (2004)', body:'Pre-2004 UK: Red=L1, Yellow=L2, Blue=L3, Black=N, Green/Yellow=PE. Post-2004 BS 7671 aligned with IEC 60446: Brown=L1, Black=L2, Grey=L3, Blue=N, Green/Yellow=PE. Mixed installations (old + new colors) are dangerous — always label and verify before working on live systems.' },
  { color:'#D97706', title:'IEC 62208 — Enclosure Thermal Calculation', body:'Simplified thermal model: ΔT = Pd / (k × A). k ≈ 5.5 W/(m²·K) for painted steel sealed enclosure in free air. k ≈ 5.5–10 for natural convection ventilated. k ≈ 15–25 for forced air cooling. For accurate calculation, use IEC TR 62631 or CFD simulation. Surface finish and color affect radiation: RAL 7035 light grey emissivity ε ≈ 0.85.' },
  { color:'#475569', title:'AWG Standard — ASTM B258 / NEC 310.15', body:'AWG (American Wire Gauge): smaller number = larger wire. AWG 4/0 (000) = 107 mm². NEC ampacity tables (Table 310.15) apply to 60°C/75°C/90°C rated conductors. IEC 60228 Class 1 (solid) and Class 2 (stranded) conductors. For stranded conductors, the same nominal mm² has slightly larger OD. Always check OD when selecting cable glands or conduit fill.' },
];

const TABS_DEF = [
  { id:'thermal', label:'Enclosure Thermal', icon: Thermometer },
  { id:'ip',      label:'IP Rating',         icon: Shield       },
  { id:'colors',  label:'Wire Colors',       icon: Zap          },
  { id:'country', label:'Country Standards', icon: Globe        },
  { id:'awg',     label:'AWG ↔ mm²',        icon: Grid3x3      },
];

export function OthersCalc() {
  const [tab, setTab] = useState('thermal');
  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Grid3x3} title="MISCELLANEOUS REFERENCE" subtitle="IEC 60529 · IEC 60446 · IEC 62208 — Enclosure thermal, IP ratings, wire colors, global standards, AWG reference" accentColor="#475569" />
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:28 }}>
        {TABS_DEF.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:`1.5px solid ${tab===t.id?'#2563EB':V.brdB}`, background:tab===t.id?'rgba(37,99,235,.12)':V.bg, color:tab===t.id?'#2563EB':V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--ec-shadow-card)' }}>
              <Icon style={{ width:14, height:14 }} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'thermal' && <EnclosureCalc />}
      {tab === 'ip'      && <IpRef />}
      {tab === 'colors'  && <WireColors />}
      {tab === 'country' && <CountryRef />}
      {tab === 'awg'     && <AwgRef />}
      <div style={{ marginTop:28 }}>
        <WhyMatters items={WHY_ITEMS} />
        <EngineeringNotes notes={NOTES} />
      </div>
    </div>
  );
}
