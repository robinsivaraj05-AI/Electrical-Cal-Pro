import React, { useState, useMemo } from 'react';
import { Grid3x3, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  ModHeader, WhyMatters, EngineeringNotes, KpiCard, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#0891B2'; // cyan

// ── CSS-var shorthand ────────────────────────────────────────
const V = {
  bg:   'var(--ec-bg-card)',
  bgD:  'var(--ec-bg-root)',
  inp:  'var(--ec-bg-input)',
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

// ── Conduit data (internal cross-section area in mm²) ──────
const CONDUIT_DATA: Record<string, Record<string, number>> = {
  'EMT (IEC metric)': {
    '16 mm': 113, '20 mm': 177, '25 mm': 282, '32 mm': 531,
    '40 mm': 855, '50 mm': 1385, '63 mm': 2206, '75 mm': 3117, '100 mm': 5542,
  },
  'PVC-HF (IEC metric)': {
    '16 mm': 103, '20 mm': 164, '25 mm': 261, '32 mm': 490,
    '40 mm': 797, '50 mm': 1277, '63 mm': 2011, '75 mm': 2895, '100 mm': 5153,
  },
  'GRC (IEC metric)': {
    '16 mm': 97, '20 mm': 155, '25 mm': 251, '32 mm': 476,
    '40 mm': 779, '50 mm': 1257, '63 mm': 1963, '75 mm': 2835, '100 mm': 4870,
  },
  'EMT (NEC trade)': {
    '½"': 78, '¾"': 131, '1"': 222, '1¼"': 341, '1½"': 468,
    '2"': 755, '2½"': 1186, '3"': 1764, '3½"': 2360, '4"': 3021,
  },
  'PVC Sch-40 (NEC)': {
    '½"': 69, '¾"': 128, '1"': 213, '1¼"': 330, '1½"': 459,
    '2"': 723, '2½"': 1027, '3"': 1625, '3½"': 2173, '4"': 2809,
  },
  'RMC (NEC trade)': {
    '½"': 72, '¾"': 126, '1"': 214, '1¼"': 336, '1½"': 464,
    '2"': 745, '2½"': 1140, '3"': 1710, '3½"': 2291, '4"': 2943,
  },
};

// ── Cable outer areas (mm²) — typical single-core XLPE/PVC ─
const CABLE_AREA: Record<string, number> = {
  '1.5 mm²':   33,  '2.5 mm²':  44,  '4 mm²':    57,  '6 mm²':    71,
  '10 mm²':    95,  '16 mm²':  133,  '25 mm²':  189,  '35 mm²':  227,
  '50 mm²':   284,  '70 mm²':  380,  '95 mm²':  491,  '120 mm²': 616,
  '150 mm²':  731, '185 mm²':  908, '240 mm²': 1164, '300 mm²': 1419,
};

// Multi-core cable outer areas (larger OD due to jacket)
const CABLE_AREA_MC: Record<string, number> = {
  '1.5 mm²':   64,  '2.5 mm²':  78,  '4 mm²':    95,  '6 mm²':   113,
  '10 mm²':   154,  '16 mm²':  201,  '25 mm²':  283,  '35 mm²':  346,
  '50 mm²':   452,  '70 mm²':  572,  '95 mm²':  760,  '120 mm²': 962,
  '150 mm²': 1134, '185 mm²': 1385, '240 mm²': 1735, '300 mm²': 2122,
};

// ── Cable Tray data ─────────────────────────────────────────
// IEC 61537: usable tray area = width × max-fill-depth
const TRAY_FILL_DEPTH: Record<string, number> = {
  'Ladder': 75, 'Perforated': 65, 'Solid Bottom': 75, 'Wire Basket': 60,
};
const TRAY_WIDTHS = [100, 150, 200, 300, 400, 450, 500, 600, 750, 900];

// NEC/IEC fill rules for conduit
function getMaxFill(n: number): { pct: number; rule: string } {
  if (n === 1)  return { pct: 53, rule: '1 conductor — 53% (NEC 300.17 / IEC 61386)' };
  if (n === 2)  return { pct: 31, rule: '2 conductors — 31% (NEC 300.17 / IEC 61386)' };
  return { pct: 40, rule: '3+ conductors — 40% (NEC 300.17 / IEC 61386)' };
}

// ── Cable entry row type ─────────────────────────────────────
interface CableEntry { id: number; size: string; cores: '1c'|'2c'|'3c'|'4c'; qty: number }

const INITIAL_CABLES: CableEntry[] = [
  { id: 1, size: '16 mm²', cores: '3c', qty: 3 },
  { id: 2, size: '2.5 mm²', cores: '3c', qty: 6 },
];
let _nextId = 10;

// ── WHY / NOTES ──────────────────────────────────────────────
const WHY_ITEMS = [
  { title:'Heat Dissipation',       desc:'Cables generate heat proportional to I²R losses. Conduit restricts cooling — overfill causes thermal runaway and insulation damage.' },
  { title:'Cable Pulling Damage',   desc:'Over-filled conduits require excessive pull force, stretching cable conductors and damaging insulation during installation.' },
  { title:'Fault Current Path',     desc:'Conduit acts as the equipment earth return path — correct sizing ensures low impedance for fault current clearance.' },
  { title:'Maintenance Access',     desc:'Under-filled conduits ease future cable additions and replacement without system shutdown.' },
  { title:'Tray Load Rating',       desc:'Cable trays are rated for distributed mass (kg/m). Over-filling exceeds the rated load and risks mechanical collapse.' },
  { title:'Code Compliance',        desc:'NEC 300.17 and IEC 61386 conduit fill limits are mandatory — non-compliance fails electrical inspection.' },
];

const NOTES = [
  { color: ACCENT, title: 'NEC 300.17 / IEC 61386 — Conduit Fill Rules',
    body: '1 conductor: max 53% fill; 2 conductors: max 31% fill; 3 or more: max 40% fill of conduit internal cross-section. These limits ensure cables can be pulled in without damage and allow adequate heat dissipation. Fill is based on the outer area (including insulation and jacket) of each cable.' },
  { color: '#7C3AED', title: 'IEC 61537 — Cable Tray Fill',
    body: 'For IEC-based designs, cable tray fill is limited by the usable cross-section area: tray width × fill depth. Fill depth is 75 mm for ladder and solid-bottom trays, 65 mm for perforated trays. The sum of all cable cross-section areas must not exceed 40% of the usable tray area (for mixed loads). For power cables only, many utilities allow up to 50%.' },
  { color: '#059669', title: 'Conduit Type Selection',
    body: 'EMT (Electrical Metallic Tubing): lightest, indoor use, mechanically protected areas. RMC/GRC (Rigid Metal Conduit): heaviest, highest mechanical protection, outdoor/underground. PVC Schedule 40: corrosion-resistant, indoor/direct buried, NOT for exposed above-ground (use Sch-80). IEC metric conduits (20–63 mm) are common in Asian and European installations; NEC trade sizes (½"–4") in North America.' },
  { color: '#475569', title: 'Cable Tray vs Conduit — Selection Guide',
    body: 'Use conduit for: individual circuits needing mechanical protection; circuits in hazardous areas; circuits through walls, floors, and plenums. Use cable tray for: multiple parallel circuits in open plant areas; ease of future cable additions; reduced material cost for large power feeders. Tray-in-conduit hybrid systems are common in industrial facilities.' },
];

// ── Sub-components ────────────────────────────────────────────

function FillGauge({ pct, limit }: { pct: number; limit: number }) {
  const over = pct > limit;
  const warn = pct > limit * 0.85;
  const color = over ? '#EF4444' : warn ? '#F59E0B' : '#22C55E';
  const barPct = Math.min(pct, 100);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, fontWeight:600 }}>
        <span style={{ color:V.muted }}>Fill Used</span>
        <span style={{ color, fontFamily:V.mono }}>{pct.toFixed(1)}% / {limit}% max</span>
      </div>
      <div style={{ height:14, background:V.surf, borderRadius:7, overflow:'hidden', border:`1px solid ${V.brdB}` }}>
        <div style={{ height:'100%', width:`${barPct}%`, background: over ? 'linear-gradient(90deg,#EF4444,#DC2626)' : warn ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#22C55E,#16A34A)', borderRadius:7, transition:'width .4s' }} />
      </div>
      <div style={{ height:1, background: V.brdB, marginTop:6, position:'relative' }}>
        <div style={{ position:'absolute', left:`${limit}%`, top:-6, width:2, height:14, background:'rgba(239,68,68,.7)', borderRadius:1 }} />
      </div>
      <div style={{ fontSize:10, color:V.muted, marginTop:8, textAlign:'right' }}>▲ {limit}% limit</div>
    </div>
  );
}

function ConduitFill() {
  const { addCalculation } = useStore();
  const [conduitType, setConduitType] = useState('EMT (IEC metric)');
  const [conduitSize, setConduitSize] = useState('25 mm');
  const [cables, setCables]           = useState<CableEntry[]>(INITIAL_CABLES);
  const [result, setResult]           = useState<null | { totalArea: number; conduitArea: number; fillPct: number; maxPct: number; status: 'PASS'|'FAIL'|'WARNING'; recommendedSize: string | null }>(null);

  const sizes = Object.keys(CONDUIT_DATA[conduitType] ?? {});

  const addCable = () => setCables((p) => [...p, { id: ++_nextId, size:'2.5 mm²', cores:'3c', qty:1 }]);
  const removeCable = (id: number) => setCables((p) => p.filter((c) => c.id !== id));
  const updateCable = (id: number, field: keyof CableEntry, val: string | number) =>
    setCables((p) => p.map((c) => c.id === id ? { ...c, [field]: field === 'qty' ? Number(val) : val } : c));

  const totalCables = useMemo(() => cables.reduce((s, c) => s + c.qty, 0), [cables]);
  const totalArea   = useMemo(() => cables.reduce((s, c) => {
    const areaPerCore = c.cores === '1c' ? (CABLE_AREA[c.size] ?? 95) : (CABLE_AREA_MC[c.size] ?? 154);
    return s + areaPerCore * c.qty;
  }, 0), [cables]);

  const calculate = () => {
    const conduitArea = CONDUIT_DATA[conduitType]?.[conduitSize] ?? 0;
    const { pct: maxPct } = getMaxFill(totalCables);
    const fillPct = conduitArea > 0 ? (totalArea / conduitArea) * 100 : 0;
    const status = fillPct > maxPct ? 'FAIL' : fillPct > maxPct * 0.85 ? 'WARNING' : 'PASS';

    let recommendedSize: string | null = null;
    if (status !== 'PASS') {
      const requiredArea = (totalArea / maxPct) * 100;
      const sizesArr = Object.entries(CONDUIT_DATA[conduitType] ?? {});
      const found = sizesArr.find(([, area]) => area >= requiredArea);
      recommendedSize = found ? found[0] : null;
    }

    setResult({ totalArea, conduitArea, fillPct, maxPct, status, recommendedSize });
    addCalculation({
      type: 'conduit-tray',
      title: `Conduit Fill — ${conduitSize} ${conduitType}, ${totalCables} cables`,
      inputs: { conduitType, conduitSize, cables: `${cables.length} types` },
      results: {
        values: [
          { label:'Conduit Area',  value: conduitArea.toFixed(0),  unit:'mm²' },
          { label:'Cable Fill',    value: totalArea.toFixed(0),    unit:'mm²', highlight:true },
          { label:'Fill %',        value: fillPct.toFixed(1),      unit:'%',   highlight:true, status },
          { label:'Max Fill',      value: maxPct.toString(),       unit:'%' },
        ],
        status, recommendation: status === 'PASS' ? `Conduit fill ${fillPct.toFixed(1)}% — within ${maxPct}% limit.` : `EXCEED — upgrade to ${recommendedSize ?? 'larger'} conduit.`,
        formula: 'Fill% = (ΣA_cables / A_conduit) × 100', steps: [],
        standardRef: { standard:'NEC 300.17 / IEC 61386', clause:'300.17', title:'Number and Size of Conductors in Conduit' },
      },
      notes:'', standard:'NEC 300.17 / IEC 61386',
    });
  };

  const inputSt: React.CSSProperties = { height:40, background:V.inp, border:`1px solid ${V.brdB}`, borderRadius:8, color:V.txt, fontSize:13, fontWeight:600, padding:'0 10px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const selSt: React.CSSProperties = { ...inputSt, cursor:'pointer' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>

      {/* LEFT — Inputs */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Conduit Specification" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:V.lbl, display:'block', marginBottom:6 }}>Conduit Type</label>
            <select value={conduitType} onChange={(e) => { setConduitType(e.target.value); setConduitSize(Object.keys(CONDUIT_DATA[e.target.value]??{})[0]??''); }} style={selSt}>
              {Object.keys(CONDUIT_DATA).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:V.lbl, display:'block', marginBottom:6 }}>Conduit Size</label>
            <select value={conduitSize} onChange={(e) => setConduitSize(e.target.value)} style={selSt}>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionLabel title="Cable Entries" />
          <button onClick={addCable} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'none', background:`${ACCENT}20`, color:ACCENT, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus style={{ width:12, height:12 }} /> Add Cable
          </button>
        </div>

        {/* Cable table */}
        <div style={{ background:V.bgD, borderRadius:10, border:`1px solid ${V.brd}`, overflow:'hidden', marginBottom:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 50px 36px', gap:0, padding:'8px 12px', background:V.surf, borderBottom:`1px solid ${V.brdM}` }}>
            {['Conductor Size','Cores','Qty','Area',''].map((h) => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</div>
            ))}
          </div>
          {cables.map((c) => {
            const area = c.cores === '1c' ? (CABLE_AREA[c.size] ?? 95) : (CABLE_AREA_MC[c.size] ?? 154);
            return (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 50px 36px', gap:4, alignItems:'center', padding:'8px 12px', borderBottom:`1px solid ${V.brdM}` }}>
                <select value={c.size} onChange={(e) => updateCable(c.id,'size',e.target.value)} style={{ ...selSt, height:34, fontSize:12 }}>
                  {Object.keys(CABLE_AREA).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={c.cores} onChange={(e) => updateCable(c.id,'cores',e.target.value)} style={{ ...selSt, height:34, fontSize:12 }}>
                  {['1c','2c','3c','4c'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <input type="number" value={c.qty} min={1} onChange={(e) => updateCable(c.id,'qty',e.target.value)} style={{ ...inputSt, height:34, fontSize:12, textAlign:'center' }} />
                <div style={{ fontSize:11, color:V.muted, fontFamily:V.mono, textAlign:'center' }}>{(area * c.qty).toFixed(0)}</div>
                <button onClick={() => removeCable(c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:V.muted, display:'flex', alignItems:'center', justifyContent:'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.color='#EF4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color=V.muted}>
                  <Trash2 style={{ width:13, height:13 }} />
                </button>
              </div>
            );
          })}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 50px 36px', gap:4, padding:'8px 12px', background:V.surf, borderTop:`1px solid ${V.brdM}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:V.sec }}>Total ({totalCables} cables)</div>
            <div /><div />
            <div style={{ fontSize:12, fontWeight:800, color:ACCENT, fontFamily:V.mono }}>{totalArea.toFixed(0)}</div>
            <div />
          </div>
        </div>

        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${ACCENT},#0E7490)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:`0 8px 24px ${ACCENT}40`, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Grid3x3 style={{ width:18, height:18 }} /> Calculate Conduit Fill
        </button>
      </div>

      {/* RIGHT — Results */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Results" />
        {!result ? (
          <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center' }}>
              <Grid3x3 style={{ width:36, height:36, color:V.muted, margin:'0 auto 10px', opacity:0.4 }} />
              <div style={{ fontSize:13, color:V.muted }}>Enter conduit and cables, then calculate</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Status banner */}
            <div style={{ padding:'14px 18px', borderRadius:12, border:`1px solid ${result.status === 'PASS' ? 'rgba(34,197,94,.35)' : result.status === 'FAIL' ? 'rgba(239,68,68,.35)' : 'rgba(245,158,11,.35)'}`, background: result.status === 'PASS' ? 'rgba(34,197,94,.08)' : result.status === 'FAIL' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)', display:'flex', alignItems:'center', gap:12 }}>
              {result.status === 'PASS'
                ? <CheckCircle2 style={{ width:22, height:22, color:'#22C55E', flexShrink:0 }} />
                : result.status === 'FAIL'
                ? <XCircle style={{ width:22, height:22, color:'#EF4444', flexShrink:0 }} />
                : <AlertTriangle style={{ width:22, height:22, color:'#F59E0B', flexShrink:0 }} />}
              <div>
                <div style={{ fontSize:15, fontWeight:800, color: result.status === 'PASS' ? '#16A34A' : result.status === 'FAIL' ? '#DC2626' : '#D97706' }}>
                  {result.status === 'PASS' ? 'PASS — Conduit fill within limit' : result.status === 'FAIL' ? 'FAIL — Conduit over-filled' : 'WARNING — Near fill limit'}
                </div>
                {result.recommendedSize && (
                  <div style={{ fontSize:12, color:V.muted, marginTop:3 }}>Recommended: upgrade to <strong style={{ color:V.txt }}>{result.recommendedSize}</strong> conduit</div>
                )}
              </div>
            </div>

            {/* KPI grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <KpiCard label="Conduit Internal Area" value={result.conduitArea.toFixed(0)} unit="mm²" accentColor={ACCENT} />
              <KpiCard label="Total Cable Area" value={result.totalArea.toFixed(0)} unit="mm²" accentColor={ACCENT} />
              <KpiCard label="Remaining Area" value={Math.max(0, result.conduitArea - result.totalArea).toFixed(0)} unit="mm²" accentColor={ACCENT} />
              <KpiCard label="Max Fill Allowed" value={result.maxPct.toString()} unit="%" accentColor={ACCENT} />
            </div>

            {/* Fill gauge */}
            <div style={{ background:V.surf, borderRadius:12, padding:'16px 20px', border:`1px solid ${V.brd}` }}>
              <FillGauge pct={result.fillPct} limit={result.maxPct} />
            </div>

            {/* Fill rule note */}
            <div style={{ padding:'10px 14px', background:V.bgD, borderRadius:10, border:`1px solid ${V.brd}`, fontSize:12, color:V.muted }}>
              <span style={{ fontWeight:700, color:V.lbl }}>Fill rule:</span> {getMaxFill(totalCables).rule}
            </div>

            {/* Available conduit sizes */}
            <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>All {conduitType} Sizes — Fill %</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {Object.entries(CONDUIT_DATA[conduitType] ?? {}).map(([size, area]) => {
                  const fp = (result.totalArea / area) * 100;
                  const ok = fp <= result.maxPct;
                  const isCurrent = size === conduitSize;
                  return (
                    <div key={size} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${isCurrent ? ACCENT : ok ? 'rgba(34,197,94,.30)' : 'rgba(239,68,68,.30)'}`, background: isCurrent ? `${ACCENT}18` : ok ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)', fontSize:11, fontFamily:V.mono, color: isCurrent ? ACCENT : ok ? '#16A34A' : '#DC2626' }}>
                      {size}: {fp.toFixed(0)}%
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CableTrayFill() {
  const { addCalculation } = useStore();
  const [trayType,  setTrayType]  = useState<string>('Ladder');
  const [trayWidth, setTrayWidth] = useState<number>(300);
  const [cables, setCables]       = useState<CableEntry[]>(INITIAL_CABLES);
  const [result, setResult]       = useState<null | { totalArea: number; trayArea: number; fillPct: number; status: 'PASS'|'FAIL'|'WARNING'; recommendedWidth: number | null }>(null);

  const addCable = () => setCables((p) => [...p, { id: ++_nextId, size:'16 mm²', cores:'3c', qty:2 }]);
  const removeCable = (id: number) => setCables((p) => p.filter((c) => c.id !== id));
  const updateCable = (id: number, field: keyof CableEntry, val: string | number) =>
    setCables((p) => p.map((c) => c.id === id ? { ...c, [field]: field === 'qty' ? Number(val) : val } : c));

  const totalArea = useMemo(() => cables.reduce((s, c) => {
    const areaPerCore = c.cores === '1c' ? (CABLE_AREA[c.size] ?? 95) : (CABLE_AREA_MC[c.size] ?? 154);
    return s + areaPerCore * c.qty;
  }, 0), [cables]);

  const maxFillPct = 40; // IEC 61537 standard 40% for mixed loads

  const calculate = () => {
    const fillDepth = TRAY_FILL_DEPTH[trayType] ?? 75;
    const trayArea  = trayWidth * fillDepth;
    const fillPct   = (totalArea / trayArea) * 100;
    const status    = fillPct > maxFillPct ? 'FAIL' : fillPct > maxFillPct * 0.85 ? 'WARNING' : 'PASS';

    let recommendedWidth: number | null = null;
    if (status !== 'PASS') {
      const req = totalArea / (fillDepth * maxFillPct / 100);
      recommendedWidth = TRAY_WIDTHS.find((w) => w >= req) ?? null;
    }

    setResult({ totalArea, trayArea, fillPct, status, recommendedWidth });
    addCalculation({
      type: 'conduit-tray',
      title: `Cable Tray — ${trayWidth} mm ${trayType}, ${cables.length} cable types`,
      inputs: { trayType, trayWidth: `${trayWidth} mm`, cables: `${cables.length} types` },
      results: {
        values: [
          { label:'Tray Usable Area', value: trayArea.toFixed(0), unit:'mm²' },
          { label:'Cable Fill Area',  value: totalArea.toFixed(0), unit:'mm²', highlight:true },
          { label:'Fill %',           value: fillPct.toFixed(1),   unit:'%',   highlight:true, status },
        ],
        status, recommendation: status === 'PASS' ? `Tray fill ${fillPct.toFixed(1)}% — within ${maxFillPct}% limit.` : `Upgrade to ${recommendedWidth ?? 'wider'} mm tray.`,
        formula: 'Fill% = ΣA_cables / (Width × Fill depth) × 100', steps: [],
        standardRef: { standard:'IEC 61537', clause:'7', title:'Cable Management — Cable Tray Fill' },
      },
      notes:'', standard:'IEC 61537',
    });
  };

  const inputSt: React.CSSProperties = { height:40, background:V.inp, border:`1px solid ${V.brdB}`, borderRadius:8, color:V.txt, fontSize:13, fontWeight:600, padding:'0 10px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const selSt: React.CSSProperties = { ...inputSt, cursor:'pointer' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>

      {/* LEFT — Inputs */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Cable Tray Specification" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:V.lbl, display:'block', marginBottom:6 }}>Tray Type</label>
            <select value={trayType} onChange={(e) => setTrayType(e.target.value)} style={selSt}>
              {Object.keys(TRAY_FILL_DEPTH).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:V.lbl, display:'block', marginBottom:6 }}>Tray Width (mm)</label>
            <select value={trayWidth} onChange={(e) => setTrayWidth(Number(e.target.value))} style={selSt}>
              {TRAY_WIDTHS.map((w) => <option key={w} value={w}>{w} mm</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding:'10px 14px', background:V.surf, borderRadius:10, border:`1px solid ${V.brd}`, marginBottom:16, fontSize:12, color:V.muted }}>
          <span style={{ fontWeight:700, color:V.lbl }}>Fill depth:</span> {TRAY_FILL_DEPTH[trayType]} mm (IEC 61537) · <span style={{ fontWeight:700, color:V.lbl }}>Usable area:</span> <span style={{ fontFamily:V.mono, color:V.txt }}>{trayWidth * (TRAY_FILL_DEPTH[trayType]??75)} mm²</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <SectionLabel title="Cables on Tray" />
          <button onClick={addCable} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'none', background:`${ACCENT}20`, color:ACCENT, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus style={{ width:12, height:12 }} /> Add Cable
          </button>
        </div>

        <div style={{ background:V.bgD, borderRadius:10, border:`1px solid ${V.brd}`, overflow:'hidden', marginBottom:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 50px 36px', gap:0, padding:'8px 12px', background:V.surf, borderBottom:`1px solid ${V.brdM}` }}>
            {['Conductor Size','Cores','Qty','Area',''].map((h) => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</div>
            ))}
          </div>
          {cables.map((c) => {
            const area = c.cores === '1c' ? (CABLE_AREA[c.size] ?? 95) : (CABLE_AREA_MC[c.size] ?? 154);
            return (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 50px 36px', gap:4, alignItems:'center', padding:'8px 12px', borderBottom:`1px solid ${V.brdM}` }}>
                <select value={c.size} onChange={(e) => updateCable(c.id,'size',e.target.value)} style={{ ...selSt, height:34, fontSize:12 }}>
                  {Object.keys(CABLE_AREA).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={c.cores} onChange={(e) => updateCable(c.id,'cores',e.target.value)} style={{ ...selSt, height:34, fontSize:12 }}>
                  {['1c','2c','3c','4c'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <input type="number" value={c.qty} min={1} onChange={(e) => updateCable(c.id,'qty',e.target.value)} style={{ ...inputSt, height:34, fontSize:12, textAlign:'center' }} />
                <div style={{ fontSize:11, color:V.muted, fontFamily:V.mono, textAlign:'center' }}>{(area * c.qty).toFixed(0)}</div>
                <button onClick={() => removeCable(c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:V.muted, display:'flex', alignItems:'center', justifyContent:'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.color='#EF4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color=V.muted}>
                  <Trash2 style={{ width:13, height:13 }} />
                </button>
              </div>
            );
          })}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 50px 36px', gap:4, padding:'8px 12px', background:V.surf, borderTop:`1px solid ${V.brdM}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:V.sec }}>Total</div>
            <div /><div />
            <div style={{ fontSize:12, fontWeight:800, color:ACCENT, fontFamily:V.mono }}>{totalArea.toFixed(0)}</div>
            <div />
          </div>
        </div>

        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${ACCENT},#0E7490)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:`0 8px 24px ${ACCENT}40`, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Grid3x3 style={{ width:18, height:18 }} /> Calculate Tray Fill
        </button>
      </div>

      {/* RIGHT — Results */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Results" />
        {!result ? (
          <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center' }}>
              <Grid3x3 style={{ width:36, height:36, color:V.muted, margin:'0 auto 10px', opacity:0.4 }} />
              <div style={{ fontSize:13, color:V.muted }}>Select tray and cables, then calculate</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ padding:'14px 18px', borderRadius:12, border:`1px solid ${result.status === 'PASS' ? 'rgba(34,197,94,.35)' : result.status === 'FAIL' ? 'rgba(239,68,68,.35)' : 'rgba(245,158,11,.35)'}`, background: result.status === 'PASS' ? 'rgba(34,197,94,.08)' : result.status === 'FAIL' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)', display:'flex', alignItems:'center', gap:12 }}>
              {result.status === 'PASS'
                ? <CheckCircle2 style={{ width:22, height:22, color:'#22C55E', flexShrink:0 }} />
                : result.status === 'FAIL'
                ? <XCircle style={{ width:22, height:22, color:'#EF4444', flexShrink:0 }} />
                : <AlertTriangle style={{ width:22, height:22, color:'#F59E0B', flexShrink:0 }} />}
              <div>
                <div style={{ fontSize:15, fontWeight:800, color: result.status === 'PASS' ? '#16A34A' : result.status === 'FAIL' ? '#DC2626' : '#D97706' }}>
                  {result.status === 'PASS' ? 'PASS — Tray fill within 40% limit' : result.status === 'FAIL' ? 'FAIL — Tray over-filled' : 'WARNING — Near fill limit (>34%)'}
                </div>
                {result.recommendedWidth && (
                  <div style={{ fontSize:12, color:V.muted, marginTop:3 }}>Recommended: upgrade to <strong style={{ color:V.txt }}>{result.recommendedWidth} mm</strong> wide tray</div>
                )}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <KpiCard label="Tray Usable Area" value={result.trayArea.toFixed(0)} unit="mm²" accentColor={ACCENT} />
              <KpiCard label="Total Cable Area" value={result.totalArea.toFixed(0)} unit="mm²" accentColor={ACCENT} />
              <KpiCard label="Unused Area" value={Math.max(0, result.trayArea - result.totalArea).toFixed(0)} unit="mm²" accentColor={ACCENT} />
              <KpiCard label="IEC 61537 Limit" value="40" unit="%" accentColor={ACCENT} />
            </div>

            <div style={{ background:V.surf, borderRadius:12, padding:'16px 20px', border:`1px solid ${V.brd}` }}>
              <FillGauge pct={result.fillPct} limit={maxFillPct} />
            </div>

            {/* Tray width comparison */}
            <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Tray Width Comparison — Fill %</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {TRAY_WIDTHS.map((w) => {
                  const fillD = TRAY_FILL_DEPTH[trayType] ?? 75;
                  const fp = (result.totalArea / (w * fillD)) * 100;
                  const ok = fp <= maxFillPct;
                  const isCurrent = w === trayWidth;
                  return (
                    <div key={w} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${isCurrent ? ACCENT : ok ? 'rgba(34,197,94,.30)' : 'rgba(239,68,68,.30)'}`, background: isCurrent ? `${ACCENT}18` : ok ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)', fontSize:11, fontFamily:V.mono, color: isCurrent ? ACCENT : ok ? '#16A34A' : '#DC2626' }}>
                      {w}mm: {fp.toFixed(0)}%
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export function ConduitTrayCalc() {
  const [mode, setMode] = useState<'conduit'|'tray'>('conduit');

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader
        icon={Grid3x3}
        title="CONDUIT & CABLE TRAY CALCULATOR"
        subtitle="NEC 300.17 / IEC 61386 · IEC 61537 · Conduit fill, tray fill percentage and size selection"
        accentColor={ACCENT}
      />

      {/* Mode selector */}
      <div style={{ display:'flex', gap:10, marginBottom:28, padding:'6px', background:V.bgD, borderRadius:14, width:'fit-content', border:`1px solid ${V.brd}` }}>
        {([['conduit','Conduit Fill'],['tray','Cable Tray Fill']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} style={{
            padding:'10px 24px', borderRadius:10, border:`1px solid ${mode === id ? ACCENT : 'transparent'}`,
            background: mode === id ? `${ACCENT}20` : 'transparent',
            color: mode === id ? ACCENT : V.muted,
            fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 150ms', fontFamily:'inherit',
          }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'conduit' ? <ConduitFill /> : <CableTrayFill />}

      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
