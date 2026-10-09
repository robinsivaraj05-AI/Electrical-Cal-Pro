import React, { useState, useMemo } from 'react';
import { Zap, Download, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { downloadReport, tableHTML } from '../../utils/reportDownload';
import { useStore } from '../../store/useStore';

const V = {
  bg: 'var(--ec-bg-card)', bgD: 'var(--ec-bg-root)', inp: 'var(--ec-bg-input)',
  brd: 'var(--ec-border-card)', brdB: 'var(--ec-border)', brdM: 'var(--ec-border-muted)',
  txt: 'var(--ec-text-primary)', txtS: 'var(--ec-text-secondary)', txtM: 'var(--ec-text-muted)',
  txtL: 'var(--ec-text-label)', surf: 'var(--ec-bg-surface)', mono: "'JetBrains Mono',monospace",
};

// ── Cable Data Tables (IEC 60364-5-52, Method E — free air/clipped direct) ──
const SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

// Ampacity (A) — 3-core copper, Method E, 30°C ambient
const AMP_XLPE   = [24,32,43,55,75,100,133,164,198,253,306,354,406,463,546,629];  // XLPE 90°C
const AMP_SWA    = [23,31,41,53,72,96, 128,158,191,244,295,342,392,447,527,607];  // SWA-XLPE (≈XLPE×0.965)
const AMP_PVC    = [19.5,27,36,46,63,85,112,138,168,213,258,299,344,392,461,530]; // PVC 70°C
const AMP_FLEX   = [16,23,30,38,52,65, 85, 0,  0,  0,  0,  0,  0,  0,  0,  0 ]; // Flexible ≤25mm²

// Resistance mΩ/m at conductor operating temp — Copper
const R90_CU = [14.48,8.71,5.45,3.63,2.18,1.36,0.870,0.625,0.483,0.344,0.253,0.201,0.167,0.134,0.100,0.0836]; // 90°C
const R70_CU = [13.58,8.17,5.11,3.41,2.04,1.28,0.816,0.586,0.453,0.323,0.237,0.189,0.157,0.126,0.0938,0.0785]; // 70°C

// Aluminium cable data (IEC 60364-5-52) — Min size 16mm² (index 5+)
// Ampacity: Al ≈ 76% of Cu for XLPE, ~76% for PVC (0 = not applicable)
const AMP_XLPE_AL = [0,0,0,0,0, 76, 101,125,151,192,232,269,309,353,415,477]; // XLPE Al 90°C
const AMP_SWA_AL  = [0,0,0,0,0, 73,  97,120,145,185,224,259,298,340,400,460]; // SWA-XLPE Al (≈Al×0.965)
const AMP_PVC_AL  = [0,0,0,0,0, 65,  85,104,127,161,195,226,261,298,351,403]; // PVC Al 70°C

// Resistance mΩ/m — Aluminium (Al resistivity ≈ 1.64× Cu at same operating temp)
const R90_AL = [0,0,0,0,0, 2.236,1.430,1.027,0.794,0.565,0.416,0.330,0.275,0.220,0.164,0.137]; // Al 90°C
const R70_AL = [0,0,0,0,0, 2.102,1.340,0.962,0.744,0.530,0.389,0.310,0.258,0.207,0.154,0.129]; // Al 70°C

// OD for aluminium cables (Al conductors → thicker insulation but same cable structure)
const OD_XLPE_AL = [0,0,0,0,0, 22,27,29,33,38,43,47,52,58,65,71]; // Al XLPE 3-core
const OD_SWA_AL  = [0,0,0,0,0, 29,35,38,43,49,55,60,66,73,81,88]; // Al SWA
const OD_PVC_AL  = [0,0,0,0,0, 21,26,28,32,37,42,46,51,57,63,69]; // Al PVC

// Legacy aliases kept for flexible (Cu only)
const R90 = R90_CU;
const R70 = R70_CU;

// Cable OD (mm) — approx 3-core for gland sizing
const OD_XLPE = [12,13,14,16,18,20,24,26,30,34,38,42,46,51,57,62];
const OD_SWA  = [16,18,19,21,24,27,32,35,39,44,49,54,59,66,73,80]; // Armoured OD larger
const OD_PVC  = [12,13,14,16,18,20,23,25,29,33,37,41,45,50,56,61];
const OD_FLEX = [10,11,12,13,16,18,21, 0,  0,  0,  0,  0,  0,  0,  0,  0 ];

// Temp correction factors
const TEMP_XLPE: Record<number,number> = {25:1.04,30:1.00,35:0.96,40:0.91,45:0.87,50:0.82,55:0.76};
const TEMP_PVC:  Record<number,number> = {25:1.06,30:1.00,35:0.94,40:0.87,45:0.79,50:0.71,55:0.61};

// Grouping factors
const GROUP_Cf: Record<number,number> = {1:1.00,2:0.80,3:0.70,4:0.65,5:0.60,6:0.57,7:0.54,8:0.52,9:0.52};

// Install method factors (vs Method E free air = 1.0)
const INSTALL_Cf: Record<string,number> = {
  'Free Air / Cable Tray': 1.00,
  'Clipped to Wall':       0.95,
  'In Conduit on Wall':    0.85,
  'Buried in Ground':      0.90,
  'In Enclosed Trunking':  0.78,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const R3 = (n: number) => Math.round(n * 1000) / 1000;
const SQRT3 = Math.sqrt(3);

function glassGland(od: number): string {
  if (!od) return '—';
  if (od <= 12) return 'M16';
  if (od <= 14) return 'M20';
  if (od <= 18) return 'M25';
  if (od <= 25) return 'M32';
  if (od <= 32) return 'M40';
  if (od <= 40) return 'M50';
  if (od <= 51) return 'M63';
  if (od <= 62) return '75mm';
  return '≥90mm';
}
function trayWidth(od: number): string {
  if (!od) return '—';
  if (od <= 20) return '100mm';
  if (od <= 30) return '150mm';
  if (od <= 40) return '200mm';
  if (od <= 51) return '300mm';
  if (od <= 62) return '450mm';
  return '600mm';
}
function peConductor(size: number, isAl = false): number {
  // IEC 60364-5-54 Table 54.3 — Al PE minimum 16mm²
  if (isAl) {
    if (size <= 35) return 16;
    return Math.ceil(size / 2);
  }
  if (size <= 16) return size;
  if (size <= 35) return 16;
  return Math.ceil(size / 2);
}

interface CableResult {
  type: string; color: string;
  size: number | null;
  idx: number;
  ratedA: number; deratedA: number; designA: number;
  vdV: number; vdPct: number; vdOk: boolean;
  od: number; gland: string; tray: string; pe: number;
  Ct: number; Cg: number; Ci: number;
  note?: string;
}

function sizeCable(
  ampTable: number[], rTable: number[], odTable: number[],
  tempTable: Record<number, number>,
  designI: number, voltage: number, distance: number,
  ambTemp: number, groupN: number, installCf: number,
  maxVdPct: number, label: string, color: string,
  isAl = false,
): CableResult {
  const tempKeys = Object.keys(tempTable).map(Number);
  const nearestTemp = tempKeys.reduce((a, b) => Math.abs(b - ambTemp) < Math.abs(a - ambTemp) ? b : a);
  const Ct = tempTable[nearestTemp] ?? 1.0;
  const Cg = GROUP_Cf[Math.min(groupN, 9)] ?? 0.52;
  const Ci = installCf;

  // Find smallest size where derated ampacity ≥ design current
  let chosenIdx = -1;
  for (let i = 0; i < SIZES.length; i++) {
    const amp = ampTable[i];
    if (!amp) continue;
    const derated = R3(amp * Ct * Cg * Ci);
    if (derated >= designI) { chosenIdx = i; break; }
  }

  if (chosenIdx === -1) {
    return { type: label, color, size: null, idx: -1, ratedA: 0, deratedA: 0, designA: designI, vdV: 0, vdPct: 0, vdOk: false, od: 0, gland: '—', tray: '—', pe: 0, Ct, Cg, Ci, note: 'Load exceeds maximum cable capacity — use parallel cables' };
  }

  // Voltage drop check — start from chosen size, go up if VD fails
  let finalIdx = chosenIdx;
  for (let i = chosenIdx; i < SIZES.length; i++) {
    const amp = ampTable[i];
    if (!amp) break;
    const r = rTable[i];
    const vdV = R3(SQRT3 * designI * distance * r / 1000);
    const vdPct = R3(vdV / voltage * 100);
    if (vdPct <= maxVdPct) { finalIdx = i; break; }
    finalIdx = i;
  }

  const ratedA = ampTable[finalIdx] ?? 0;
  const deratedA = R3(ratedA * Ct * Cg * Ci);
  const r = rTable[finalIdx];
  const vdV = R3(SQRT3 * designI * distance * r / 1000);
  const vdPct = R3(vdV / voltage * 100);
  const od = odTable[finalIdx] ?? 0;
  const size = SIZES[finalIdx];

  return {
    type: label, color, size, idx: finalIdx,
    ratedA, deratedA, designA: designI,
    vdV, vdPct, vdOk: vdPct <= maxVdPct,
    od, gland: glassGland(od), tray: trayWidth(od), pe: peConductor(size, isAl),
    Ct, Cg, Ci,
    note: finalIdx > chosenIdx ? `Size increased from ${SIZES[chosenIdx]}mm² to ${size}mm² to satisfy voltage drop limit` : undefined,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const inp: React.CSSProperties = { width:'100%', height:48, background:V.inp, border:`1px solid ${V.brdB}`, borderRadius:10, color:V.txt, fontSize:14, fontWeight:600, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' };

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:V.txtL, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>
      {children}
      {hint && <span title={hint} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:14, height:14, borderRadius:'50%', background:V.bgD, border:`1px solid ${V.brdB}`, color:V.txtM, fontSize:9, cursor:'help' }}>?</span>}
    </label>
  );
}

function CableCard({ r }: { r: CableResult }) {
  const ok = r.size !== null && r.deratedA >= r.designA && r.vdOk;
  const warn = r.size !== null && !r.vdOk;

  return (
    <div style={{ background:V.bg, border:`2px solid ${ok ? r.color + '50' : warn ? '#F59E0B50' : '#EF444450'}`, borderRadius:14, overflow:'hidden' }}>
      {/* Card Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', background:`${r.color}12`, borderBottom:`1px solid ${r.color}30` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:r.color }} />
          <span style={{ fontSize:14, fontWeight:800, color:V.txt }}>{r.type}</span>
        </div>
        {r.size
          ? (ok ? <CheckCircle style={{ width:18, height:18, color:'#10B981' }} /> : <AlertTriangle style={{ width:18, height:18, color:'#F59E0B' }} />)
          : <XCircle style={{ width:18, height:18, color:'#EF4444' }} />
        }
      </div>

      {/* Recommended Size */}
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${V.brdM}` }}>
        <div style={{ fontSize:10, fontWeight:700, color:V.txtM, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Recommended Size</div>
        {r.size ? (
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:28, fontWeight:900, color:r.color, lineHeight:1 }}>{r.size}</span>
            <span style={{ fontSize:14, fontWeight:700, color:V.txtM }}>mm² Cu</span>
          </div>
        ) : (
          <span style={{ fontSize:14, fontWeight:700, color:'#EF4444' }}>Exceeds range</span>
        )}
        {r.note && <div style={{ fontSize:11, color:'#F59E0B', marginTop:4 }}>{r.note}</div>}
      </div>

      {/* Data grid */}
      <div style={{ padding:'10px 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
        {[
          ['Rated Ampacity', r.ratedA ? `${r.ratedA} A` : '—'],
          ['Derated (×Ct×Cg×Ci)', r.deratedA ? `${r.deratedA} A` : '—'],
          ['Voltage Drop', r.vdPct ? `${r.vdPct.toFixed(2)} %` : '—'],
          ['VD (Volts)', r.vdV ? `${r.vdV.toFixed(2)} V` : '—'],
          ['Temp Factor Ct', r.Ct.toFixed(3)],
          ['Group Factor Cg', r.Cg.toFixed(2)],
          ['Cable OD', r.od ? `~${r.od} mm` : '—'],
          ['Cable Gland', r.gland],
          ['Cable Tray Min.', r.tray],
          ['Earthing (PE)', r.pe ? `${r.pe} mm²` : '—'],
        ].map(([lbl, val]) => (
          <div key={lbl}>
            <div style={{ fontSize:10, color:V.txtM, fontWeight:600 }}>{lbl}</div>
            <div style={{ fontSize:12, fontWeight:700, color:V.txtS }}>{val}</div>
          </div>
        ))}
      </div>

      {/* VD status */}
      {r.size && (
        <div style={{ margin:'0 12px 12px', padding:'6px 10px', background: r.vdOk ? '#D1FAE5' : '#FEF3C7', borderRadius:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color: r.vdOk ? '#065F46' : '#92400E' }}>
            {r.vdOk ? `✓ VD ${r.vdPct.toFixed(2)}% — within limit` : `⚠ VD ${r.vdPct.toFixed(2)}% — exceeds limit`}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CableCurrentCalc() {
  const { addCalculation } = useStore();

  // Inputs
  const [kw, setKw]             = useState('20');
  const [voltage, setVoltage]   = useState('415');
  const [pf, setPf]             = useState('0.85');
  const [eff, setEff]           = useState('1.0');
  const [distance, setDistance] = useState('50');
  const [phases, setPhases]     = useState<'3'|'1'>('3');
  const [ambTemp, setAmbTemp]   = useState('40');
  const [groupN, setGroupN]     = useState('1');
  const [installM, setInstallM]   = useState('Free Air / Cable Tray');
  const [maxVd, setMaxVd]         = useState('5');
  const [dfPct, setDfPct]         = useState('125');
  const [conductor, setConductor] = useState<'Cu' | 'Al'>('Cu');
  const [hasCalc, setHasCalc]     = useState(false);

  // Core calc
  const core = useMemo(() => {
    const P = parseFloat(kw) || 0;
    const V2 = parseFloat(voltage) || 415;
    const PF = parseFloat(pf) || 0.85;
    const EFF = parseFloat(eff) || 1.0;
    const phi = Math.acos(Math.min(PF, 1));
    const sinPhi = Math.sin(phi);
    const S = P / PF;
    const Q = P * Math.tan(phi);
    const FLC = phases === '3'
      ? P * 1000 / (SQRT3 * V2 * PF * EFF)
      : P * 1000 / (V2 * PF * EFF);
    const df = parseFloat(dfPct) / 100;
    const Id = FLC * df;
    return { P, V2, PF, EFF, phi, sinPhi, S: R3(S), Q: R3(Q), FLC: R3(FLC), Id: R3(Id), df };
  }, [kw, voltage, pf, eff, phases, dfPct]);

  // Cable results
  const cables = useMemo<CableResult[]>(() => {
    const Ci  = INSTALL_Cf[installM] ?? 1.0;
    const gN  = Math.max(1, Math.min(9, parseInt(groupN) || 1));
    const aT  = parseInt(ambTemp) || 40;
    const D   = parseFloat(distance) || 50;
    const Vn  = parseFloat(voltage) || 415;
    const Vd  = parseFloat(maxVd) || 5;
    const Id  = core.Id;
    const isAl = conductor === 'Al';

    if (isAl) {
      return [
        sizeCable(AMP_XLPE_AL, R90_AL, OD_XLPE_AL, TEMP_XLPE, Id, Vn, D, aT, gN, Ci, Vd, 'XLPE Al 90°C', '#3B82F6', true),
        sizeCable(AMP_SWA_AL,  R90_AL, OD_SWA_AL,  TEMP_XLPE, Id, Vn, D, aT, gN, Ci, Vd, 'SWA-XLPE Al 90°C', '#7C3AED', true),
        sizeCable(AMP_PVC_AL,  R70_AL, OD_PVC_AL,  TEMP_PVC,  Id, Vn, D, aT, gN, Ci, Vd, 'PVC Al 70°C', '#F97316', true),
        // Flexible cables are copper only per IEC — return placeholder
        { type: 'Flexible (Cu Only)', color: '#94A3B8', size: null, idx: -1, ratedA: 0, deratedA: 0, designA: Id, vdV: 0, vdPct: 0, vdOk: false, od: 0, gland: '—', tray: '—', pe: 0, Ct: 1, Cg: 1, Ci: 1, note: 'Flexible cables are manufactured with copper conductors only (IEC 60227)' } as CableResult,
      ];
    }

    return [
      sizeCable(AMP_XLPE, R90_CU, OD_XLPE, TEMP_XLPE, Id, Vn, D, aT, gN, Ci, Vd, 'XLPE Cu 90°C', '#3B82F6'),
      sizeCable(AMP_SWA,  R90_CU, OD_SWA,  TEMP_XLPE, Id, Vn, D, aT, gN, Ci, Vd, 'SWA-XLPE Cu 90°C', '#7C3AED'),
      sizeCable(AMP_PVC,  R70_CU, OD_PVC,  TEMP_PVC,  Id, Vn, D, aT, gN, Ci, Vd, 'PVC Cu 70°C', '#F97316'),
      sizeCable(AMP_FLEX, R70_CU, OD_FLEX, TEMP_PVC,  Id, Vn, D, aT, gN, Ci, Vd, 'Flexible PVC 70°C', '#10B981'),
    ];
  }, [core.Id, voltage, distance, ambTemp, groupN, installM, maxVd, conductor]);

  const handleCalc = () => {
    setHasCalc(true);
    const xlpe = cables[0];
    addCalculation({
      type: 'cable-current',
      title: `Panel Cable Sizing — ${kw} kW, ${voltage} V, ${distance} m (${conductor})`,
      inputs: { 'Power': `${kw} kW`, 'Voltage': `${voltage} V`, 'PF': pf, 'Distance': `${distance} m`, 'Conductor': conductor, 'Ambient': `${ambTemp}°C` },
      results: {
        values: [
          { label: 'FLC', value: core.FLC, unit: 'A' },
          { label: 'Design Current', value: core.Id, unit: 'A' },
          { label: 'XLPE Cable Size', value: xlpe.size ?? 0, unit: 'mm²' },
        ],
        status: 'PASS', recommendation: '', formula: phases === '3' ? 'I = P×1000/(√3×V×PF×η)' : 'I = P×1000/(V×PF×η)',
        steps: [], standardRef: { standard: 'IEC 60364-5-52', clause: 'Table B.52.2', title: 'Cable Current Rating' },
      },
      notes: '', standard: 'IEC 60364-5-52 / IEC 60364-4-43',
    });
  };

  const handleExport = () => {
    const inputRows = [
      ['Panel Power', `${kw} kW`, ''],
      ['System Voltage', `${voltage} V`, phases === '3' ? 'Line-to-Line (3-phase)' : 'Phase voltage (1-phase)'],
      ['Conductor Material', conductor === 'Cu' ? 'Copper (Cu)' : 'Aluminium (Al)', conductor === 'Al' ? 'Min. size 16mm² — IEC 60364-5-52' : 'Standard for all LV circuits'],
      ['Power Factor', pf, 'cos φ'],
      ['Motor / Load Efficiency', eff, 'η'],
      ['Cable Length (One Way)', `${distance} m`, ''],
      ['Ambient Temperature', `${ambTemp}°C`, ''],
      ['Installation Method', installM, ''],
      ['Cables Per Group', groupN, 'For grouping derating'],
      ['Max Voltage Drop', `${maxVd}%`, 'IEC 60364-5-52 limit'],
      ['Design Factor', `${dfPct}%`, 'IEC 60364-4-43 Cl.433.1'],
    ];
    const currentRows = [
      ['Full Load Current (FLC)', `${core.FLC} A`, phases === '3' ? 'I = P×1000/(√3×V×PF×η)' : 'I = P×1000/(V×PF×η)'],
      ['Design Current (Id)', `${core.Id} A`, `FLC × ${dfPct}%`],
      ['Apparent Power', `${core.S} kVA`, 'S = P / PF'],
      ['Reactive Power', `${core.Q} kVAR`, 'Q = P × tan(φ)'],
    ];
    const cableRows = cables.map(r => [
      r.type,
      r.size ? `${r.size} mm²` : 'Exceeds range',
      r.ratedA ? `${r.ratedA} A` : '—',
      r.deratedA ? `${r.deratedA} A` : '—',
      r.vdPct ? `${r.vdPct.toFixed(2)} %` : '—',
      r.vdOk ? 'PASS' : 'FAIL',
      r.od ? `~${r.od} mm` : '—',
      r.gland,
      r.tray,
      r.pe ? `${r.pe} mm²` : '—',
    ]);
    const stdRows = [
      ['IEC 60364-4-43', 'Protection Against Overcurrent', 'Cl.433.1', 'Design current Id = In × 1.25 for continuous loads. Cable capacity ≥ protective device rating.'],
      ['IEC 60364-5-52', 'Wiring Systems — Current Ratings', 'Table B.52.2', 'Current carrying capacity for different cable types and installation methods.'],
      ['IEC 60364-5-52', 'Voltage Drop Limits', 'Cl.525', 'Max 4% for lighting, 5% for power circuits from supply origin to load terminals.'],
      ['IEC 60364-5-54', 'Protective Conductors (PE)', 'Table 54.3', 'PE ≤16mm²→ = phase; 16–35mm²→16mm²; >35mm²→ phase/2. Minimum 16mm² Cu.'],
      ['IEC 60502-1', 'XLPE & PVC Power Cables 1kV–30kV', 'Full standard', 'Construction, testing and requirements for extruded insulation power cables.'],
      ['IEC 60228', 'Conductors of Insulated Cables', 'Full standard', 'Standard cross-section areas: 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120mm²...'],
      ['IEC 62444', 'Cable Glands for Electrical Installations', 'Full standard', 'Metric thread gland selection: M16 to M75+ based on cable OD.'],
      ['IEC 61084-1', 'Cable Trunking and Ducting Systems', 'Cl.12', 'Fill ratio ≤40% of tray cross-section. Tray width ≥3× cable OD for single cable.'],
      ['IEC 60331', 'Fire Resistance of Cables', 'Full standard', 'Required for cables passing through fire compartments — seal all penetrations.'],
    ];
    const layingRows = [
      ['Bending Radius', 'Min. 6× cable OD (unarmoured), 8× cable OD (armoured)', 'IEC 60502-1'],
      ['Cable Support Spacing', 'Horizontal ≤ 600mm, Vertical ≤ 1000mm for cables on tray', 'IEC 61084 / Manufacturer'],
      ['Cable Tray Fill', 'Max 40% fill ratio of tray cross-sectional area', 'IEC 61084-1 Cl.12'],
      ['Cable Segregation', 'HV/LV separated min. 300mm or by barrier. Power/Control separated.', 'IEC 60364-5-52 Cl.528'],
      ['Underground Depth', 'Min. 600mm below ground in conduit, 800mm direct burial', 'IEC 60364-5-52'],
      ['Glanding', 'Use appropriate IP-rated cable gland for enclosure IP rating', 'IEC 62444 / IEC 60529'],
      ['Cable Termination', 'Use compression lugs. Torque to manufacturer spec. BI-metallic washers for Al-Cu.', 'IEC 60999-1'],
      ['Cable Labelling', 'Permanent tags at each end, every 10m on run, at every penetration', 'IEC 60364-5-51 / Site spec'],
      ['Fire Barriers', 'Seal cable penetrations through fire walls with approved intumescent material', 'IEC 60331 / IEC 60634'],
      ['Earthing Continuity', 'Test PE conductor resistance < 1Ω from MV/LV incomer to furthest point', 'IEC 60364-6 / IEC 60364-5-54'],
      ['Installation Test', 'Insulation resistance ≥1MΩ at 500V DC (LV cables) before energisation', 'IEC 60364-6-61 Table 61.3'],
      ['Cable Marker Colour', 'Phase: Brown/Black/Grey (R/Y/B), Neutral: Blue, Earth: Green-Yellow', 'IEC 60446 / IEC 60364-5-51'],
    ];
    const date = new Date().toISOString().split('T')[0];
    const body = `
      <h2>Project / Panel Details</h2>
      ${tableHTML(['Parameter', 'Value', 'Note'], inputRows)}
      <h2>Current Calculation</h2>
      ${tableHTML(['Parameter', 'Value', 'Formula'], currentRows)}
      <h2>Cable Size Recommendation — All Types</h2>
      ${tableHTML(['Cable Type','Size','Rated A','Derated A','VD%','VD Status','OD','Gland','Tray Width','PE (Earth)'], cableRows)}
      <h2>IEC Standards Reference</h2>
      ${tableHTML(['Standard','Title','Clause','Key Requirement'], stdRows)}
      <h2>Panel Cable Laying Requirements (IEC)</h2>
      ${tableHTML(['Requirement','Specification','Standard'], layingRows)}
      <div style="margin-top:20px;padding:14px;background:#fff8f0;border:1px solid #f59e0b;border-radius:6px">
        <b>⚠ Field Notes:</b>
        <ul style="margin:8px 0 0 16px;font-size:9pt">
          <li>Always verify final cable size with site-specific installation drawings.</li>
          <li>Check cable manufacturer's data sheet for actual rated current and OD.</li>
          <li>Apply additional derating if cables are exposed to direct sunlight (IEC 60364-5-52 Table B.52.14).</li>
          <li>VFD-driven loads: check VFD output current — may exceed motor nameplate current.</li>
        </ul>
      </div>
      <h2>Sign-Off</h2>
      <table>
        <tr><td class="lbl">Designed by</td><td>_________________________ Date: __________</td><td class="lbl">Checked by</td><td>_________________________ Date: __________</td></tr>
      </table>
    `;
    downloadReport(
      'Panel Cable Sizing Report',
      `${kw} kW · ${voltage} V · ${phases}-Phase · ${conductor} Conductor · ${distance} m Run`,
      'IEC 60364-5-52 · IEC 60364-4-43 · IEC 60364-5-54 · IEC 60502-1 · IEC 62444',
      body,
      `Panel-Cable-Sizing-${voltage}V-${kw}kW-${date}.pdf`
    );
  };

  const selBtnStyle = (active: boolean, color = '#2563EB'): React.CSSProperties => ({
    padding:'5px 12px', borderRadius:8, border:`1px solid ${active ? color : V.brdB}`,
    background: active ? color + '20' : V.surf, color: active ? color : V.txtM,
    fontSize:12, fontWeight:700, cursor:'pointer',
  });

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:20, marginBottom:24, borderBottom:`1px solid ${V.brd}` }}>
        <div style={{ width:52, height:52, borderRadius:14, flexShrink:0, background:'rgba(37,99,235,.14)', border:'1px solid rgba(37,99,235,.28)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap style={{ width:26, height:26, color:'#3B82F6' }} />
        </div>
        <div>
          <h2 style={{ fontSize:21, fontWeight:800, color:V.txt, letterSpacing:'-0.01em' }}>PANEL CABLE SIZING CALCULATOR</h2>
          <p style={{ fontSize:13, color:V.txtM, marginTop:3 }}>IEC 60364-5-52 · IEC 60364-4-43 · IEC 60364-5-54 · XLPE / SWA / PVC / Flexible cable sizing + earthing + gland + tray</p>
        </div>
        {hasCalc && (
          <button onClick={handleExport} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#2563EB', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer' }}>
            <Download style={{ width:15, height:15 }} /> Export PDF — Field Work
          </button>
        )}
      </div>

      {/* Inputs + Current Results */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>

        {/* LEFT — Inputs */}
        <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:V.txtM, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:18 }}>Design Inputs</div>

          {/* Power + Phase */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <Label hint="Rated active power of the panel/motor load">Panel Power (kW)</Label>
              <input type="number" value={kw} onChange={e=>setKw(e.target.value)} style={inp} min={0.1} step={0.1} />
            </div>
            <div>
              <Label>Phase System</Label>
              <div style={{ display:'flex', gap:8, height:48, alignItems:'center' }}>
                {['3','1'].map(p => <button key={p} onClick={()=>setPhases(p as '3'|'1')} style={selBtnStyle(phases===p)}>{p === '3' ? '3-Phase (√3)' : '1-Phase'}</button>)}
              </div>
            </div>
          </div>

          {/* Conductor Material */}
          <div style={{ marginBottom:14, padding:'12px 16px', background: conductor === 'Al' ? 'rgba(251,191,36,.08)' : 'rgba(37,99,235,.06)', borderRadius:12, border:`1px solid ${conductor === 'Al' ? 'rgba(251,191,36,.35)' : 'rgba(37,99,235,.25)'}` }}>
            <Label hint="IEC 60364-5-52 provides separate tables for Cu and Al conductors. Al min. size is 16mm².">Conductor Material</Label>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {[
                { val:'Cu', label:'🔴  Copper (Cu)', desc:'Higher current density · Min. 1.5mm²' },
                { val:'Al', label:'⚪  Aluminium (Al)', desc:'Lower cost for large cables · Min. 16mm²' },
              ].map(({ val, label, desc }) => (
                <button key={val} onClick={() => { setConductor(val as 'Cu'|'Al'); setHasCalc(false); }}
                  style={{ flex:1, padding:'10px 14px', borderRadius:10, border:`2px solid ${conductor===val ? (val==='Cu'?'#3B82F6':'#F59E0B') : 'var(--ec-border)'}`, background: conductor===val ? (val==='Cu'?'rgba(59,130,246,.12)':'rgba(245,158,11,.12)') : 'var(--ec-bg-surface)', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontSize:13, fontWeight:800, color: conductor===val ? (val==='Cu'?'#3B82F6':'#F59E0B') : 'var(--ec-text-secondary)' }}>{label}</div>
                  <div style={{ fontSize:11, color:'var(--ec-text-muted)', marginTop:2 }}>{desc}</div>
                </button>
              ))}
            </div>
            {conductor === 'Al' && (
              <div style={{ fontSize:11, color:'#92400E', marginTop:8, padding:'6px 10px', background:'rgba(245,158,11,.10)', borderRadius:6 }}>
                ⚠ Al flexible cables do not exist (IEC 60227). PE min. 16mm² per IEC 60364-5-54. Al not recommended for ≤ 35A circuits.
              </div>
            )}
          </div>

          {/* Voltage + PF */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:6 }}>
            <div>
              <Label hint="Line-to-line voltage for 3-phase">System Voltage (V)</Label>
              <input type="number" value={voltage} onChange={e=>setVoltage(e.target.value)} style={inp} />
            </div>
            <div>
              <Label hint="Power factor cosφ — use nameplate value">Power Factor (cosφ)</Label>
              <input type="number" value={pf} onChange={e=>setPf(e.target.value)} style={inp} min={0.1} max={1} step={0.01} />
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
            {['240','415','440','480','690','1000','3300','6600','11000'].map(v => (
              <button key={v} onClick={()=>setVoltage(v)} style={selBtnStyle(voltage===v, '#2563EB')}>
                {parseInt(v)>=1000 ? `${parseInt(v)/1000}kV` : `${v}V`}
              </button>
            ))}
          </div>

          {/* Efficiency + Distance */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <Label hint="Motor efficiency η — use 1.0 for direct feeder loads">Efficiency (η)</Label>
              <input type="number" value={eff} onChange={e=>setEff(e.target.value)} style={inp} min={0.5} max={1} step={0.01} />
            </div>
            <div>
              <Label hint="One-way cable length from panel to load (m)">Cable Length (m)</Label>
              <input type="number" value={distance} onChange={e=>setDistance(e.target.value)} style={inp} min={1} />
            </div>
          </div>

          {/* Design Factor + Max VD */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <Label hint="IEC 60364-4-43 Cl.433.1 — 125% for continuous loads">Design Factor (%)</Label>
              <div style={{ display:'flex', gap:6 }}>
                <input type="number" value={dfPct} onChange={e=>setDfPct(e.target.value)} style={{ ...inp, width:80 }} />
                {['100','115','125','130'].map(d => <button key={d} onClick={()=>setDfPct(d)} style={selBtnStyle(dfPct===d)}>{d}%</button>)}
              </div>
            </div>
            <div>
              <Label hint="Max permissible voltage drop — IEC 60364-5-52: 5% for power">Max VD (%)</Label>
              <div style={{ display:'flex', gap:6 }}>
                <input type="number" value={maxVd} onChange={e=>setMaxVd(e.target.value)} style={{ ...inp, width:70 }} />
                {['3','4','5'].map(d => <button key={d} onClick={()=>setMaxVd(d)} style={selBtnStyle(maxVd===d, '#059669')}>{d}%</button>)}
              </div>
            </div>
          </div>

          {/* Ambient + Grouping + Install */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <Label hint="Ambient temperature at cable installation location">Ambient Temp (°C)</Label>
              <div style={{ display:'flex', gap:6 }}>
                <input type="number" value={ambTemp} onChange={e=>setAmbTemp(e.target.value)} style={{ ...inp, width:70 }} />
                {['30','35','40','45','50'].map(t => <button key={t} onClick={()=>setAmbTemp(t)} style={selBtnStyle(ambTemp===t, '#F97316')}>{t}°</button>)}
              </div>
            </div>
            <div>
              <Label hint="Number of cables touching in the same tray/conduit">Cables per Group</Label>
              <div style={{ display:'flex', gap:6 }}>
                <input type="number" value={groupN} onChange={e=>setGroupN(e.target.value)} style={{ ...inp, width:60 }} min={1} />
                {['1','2','3','4','6'].map(g => <button key={g} onClick={()=>setGroupN(g)} style={selBtnStyle(groupN===g, '#7C3AED')}>{g}</button>)}
              </div>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <Label hint="Installation method affects current rating — IEC 60364-5-52 Table B.52.2">Installation Method</Label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.keys(INSTALL_Cf).map(m => (
                <button key={m} onClick={()=>setInstallM(m)} style={selBtnStyle(installM===m, '#0EA5E9')}>{m} ({INSTALL_Cf[m]})</button>
              ))}
            </div>
          </div>

          <button onClick={handleCalc} style={{ width:'100%', height:52, borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', fontSize:16, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <Zap style={{ width:20, height:20 }} /> Calculate & Size Cable
          </button>
        </div>

        {/* RIGHT — Current Results */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:V.txtM, textTransform:'uppercase', letterSpacing:'0.08em' }}>Calculation Results</div>

          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {[
              { lbl:'Active Power', val:`${core.P} kW`, color:'#60A5FA' },
              { lbl:'Apparent Power', val:`${core.S} kVA`, color:'#A78BFA' },
              { lbl:'Reactive Power', val:`${core.Q} kVAR`, color:'#F9A8D4' },
            ].map(k => (
              <div key={k.lbl} style={{ background:V.surf, border:`1px solid ${V.brd}`, borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:10, color:V.txtM, fontWeight:600, textTransform:'uppercase', marginBottom:6 }}>{k.lbl}</div>
                <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* FLC */}
          <div style={{ background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.30)', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Full Load Current (FLC)</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontSize:36, fontWeight:900, color:'#22C55E', lineHeight:1 }}>{core.FLC.toFixed(2)}</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#15803D' }}>A</span>
            </div>
            <code style={{ fontSize:12, color:'#15803D', fontFamily:V.mono }}>
              {phases === '3' ? `I = ${core.P}×1000 / (√3 × ${core.V2} × ${core.PF} × ${core.EFF})` : `I = ${core.P}×1000 / (${core.V2} × ${core.PF} × ${core.EFF})`}
            </code>
          </div>

          {/* Design Current */}
          <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.30)', borderRadius:14, padding:'16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#92400E', textTransform:'uppercase', letterSpacing:'0.06em' }}>Design Current (Id)</span>
              <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:'rgba(245,158,11,.15)', color:'#F59E0B', fontWeight:700 }}>{dfPct}% Factor · IEC 60364-4-43</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontSize:32, fontWeight:900, color:'#F59E0B', lineHeight:1 }}>{core.Id.toFixed(2)}</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#92400E' }}>A</span>
            </div>
            <code style={{ fontSize:12, color:'#92400E', fontFamily:V.mono }}>Id = {core.FLC.toFixed(2)} × {core.df.toFixed(2)} = {core.Id.toFixed(2)} A</code>
          </div>

          {/* Derating summary */}
          {hasCalc && (
            <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:12, padding:'14px 18px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:V.txtM, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Applied Derating Factors</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Temp Factor (Ct)', `XLPE: ${cables[0].Ct} | PVC: ${cables[2].Ct}`],
                  ['Group Factor (Cg)', `${cables[0].Cg} (${groupN} cable${parseInt(groupN)>1?'s':''})`],
                  ['Install Factor (Ci)', `${cables[0].Ci} (${installM})`],
                  ['Combined (XLPE)', `${R3(cables[0].Ct * cables[0].Cg * cables[0].Ci)}`],
                  ['VD Limit', `${maxVd}% (IEC 60364-5-52)`],
                  ['Cable Length', `${distance} m one-way`],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding:'8px 12px', background:V.surf, borderRadius:8, border:`1px solid ${V.brdM}` }}>
                    <div style={{ fontSize:10, color:V.txtM, fontWeight:600 }}>{l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:V.txtS }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasCalc && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, border:`1.5px dashed ${V.brd}`, borderRadius:16, minHeight:200 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⚡</div>
                <div style={{ fontSize:14, color:V.txtM }}>Enter parameters and click Calculate</div>
                <div style={{ fontSize:12, color:V.brdB, marginTop:4 }}>Cable sizes for XLPE, SWA, PVC and Flexible will appear here</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cable Size Comparison */}
      {hasCalc && (
        <>
          <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${V.brd}` }}>
              <div>
                <h3 style={{ fontSize:16, fontWeight:800, color:V.txt, textTransform:'uppercase', letterSpacing:'0.04em' }}>Cable Size Recommendation — All Types</h3>
                <p style={{ fontSize:12, color:V.txtM, marginTop:3 }}>IEC 60364-5-52 Method E (Free Air) · Includes gland size, cable tray width and PE earthing conductor</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
              {cables.map(r => <CableCard key={r.type} r={r} />)}
            </div>

            {/* Quick Comparison Table */}
            <div style={{ marginTop:20, overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#1e40af', color:'#fff' }}>
                    {['Cable Type','Size (mm²)','Rated A','Derated A','VD%','VD Status','Cable OD','Gland','Tray Width','PE Conductor'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, letterSpacing:'0.04em', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cables.map((r, i) => (
                    <tr key={r.type} style={{ background: i%2===0 ? V.surf : 'transparent', borderBottom:`1px solid ${V.brdM}` }}>
                      <td style={{ padding:'9px 12px', fontWeight:700, color:r.color }}>{r.type}</td>
                      <td style={{ padding:'9px 12px', fontWeight:800, color:V.txt }}>{r.size ? `${r.size} mm²` : '—'}</td>
                      <td style={{ padding:'9px 12px', color:V.txtS }}>{r.ratedA ? `${r.ratedA} A` : '—'}</td>
                      <td style={{ padding:'9px 12px', color:V.txtS }}>{r.deratedA ? `${r.deratedA} A` : '—'}</td>
                      <td style={{ padding:'9px 12px', fontWeight:700, color: r.vdOk ? '#059669' : '#D97706' }}>{r.vdPct ? `${r.vdPct.toFixed(2)}%` : '—'}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:700, background: r.vdOk ? '#D1FAE5' : '#FEF3C7', color: r.vdOk ? '#065F46' : '#92400E' }}>
                          {r.size ? (r.vdOk ? 'PASS' : 'WARN') : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px', color:V.txtS }}>{r.od ? `~${r.od} mm` : '—'}</td>
                      <td style={{ padding:'9px 12px', fontWeight:700, color:V.txt }}>{r.gland}</td>
                      <td style={{ padding:'9px 12px', fontWeight:700, color:V.txt }}>{r.tray}</td>
                      <td style={{ padding:'9px 12px', fontWeight:700, color:'#10B981' }}>{r.pe ? `${r.pe} mm²` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* IEC Cable Laying Standards */}
          <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, marginBottom:24 }}>
            <div style={{ paddingBottom:14, marginBottom:20, borderBottom:`1px solid ${V.brd}` }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:V.txt, textTransform:'uppercase', letterSpacing:'0.04em' }}>Panel Cable Laying Requirements — IEC Standards</h3>
              <p style={{ fontSize:12, color:V.txtM, marginTop:3 }}>Field work reference — to be verified against project specifications and site drawings</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {[
                { icon:'📐', title:'Bending Radius', spec:'Min. 6× OD (unarmoured) | 8× OD (armoured SWA)', std:'IEC 60502-1', color:'#3B82F6' },
                { icon:'🔩', title:'Cable Support Spacing', spec:'Horizontal ≤ 600 mm | Vertical ≤ 1000 mm', std:'IEC 61084 / Mfg spec', color:'#7C3AED' },
                { icon:'📦', title:'Cable Tray Fill Ratio', spec:'Maximum 40% of tray cross-sectional area', std:'IEC 61084-1 Cl.12', color:'#F97316' },
                { icon:'⚡', title:'Cable Segregation', spec:'HV/LV: min 300mm separation or physical barrier | Power/Control: separate trays', std:'IEC 60364-5-52 Cl.528', color:'#EF4444' },
                { icon:'🌡️', title:'Direct Sunlight', spec:'Apply solar radiation derating factor 0.9 | Use UV-stabilised sheath', std:'IEC 60364-5-52 Table B.52.14', color:'#F59E0B' },
                { icon:'🔥', title:'Fire Barriers', spec:'Seal all cable penetrations through fire walls with intumescent material — class 2 hrs minimum', std:'IEC 60331 / IEC 60634', color:'#DC2626' },
                { icon:'🏷️', title:'Cable Labelling', spec:'Permanent tags at each end, every 10 m on run, at every penetration and junction box', std:'IEC 60364-5-51 / Site spec', color:'#059669' },
                { icon:'🟢🟡🔵', title:'Conductor Colour Code', spec:'Phase: Brown / Black / Grey (R/Y/B) | Neutral: Blue | Earth: Green-Yellow', std:'IEC 60446 / IEC 60364-5-51', color:'#0891B2' },
                { icon:'🔌', title:'Cable Gland', spec:'Select IP-rated gland to match enclosure IP rating | Armour clamped for SWA', std:'IEC 62444 / IEC 60529', color:'#8B5CF6' },
                { icon:'🔩', title:'Termination', spec:'Use compression lugs to BS EN 46234 | Torque to mfg spec | Bi-metallic for Al-Cu', std:'IEC 60999-1', color:'#64748B' },
                { icon:'📏', title:'Underground Burial Depth', spec:'In conduit: min 600 mm | Direct burial: min 800 mm | Under road: min 1000 mm', std:'IEC 60364-5-52 Cl.527', color:'#92400E' },
                { icon:'🧪', title:'Pre-Energisation Tests', spec:'IR test ≥ 1 MΩ at 500 V DC (LV) | ≥ 1000 MΩ at 5 kV DC (MV) | Continuity check of PE conductor < 1 Ω', std:'IEC 60364-6-61 Table 61.3', color:'#065F46' },
              ].map(item => (
                <div key={item.title} style={{ display:'flex', gap:12, padding:'14px 16px', background:V.surf, borderRadius:12, border:`1px solid ${V.brd}`, borderLeft:`4px solid ${item.color}` }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:V.txt, marginBottom:3 }}>{item.title}</div>
                    <div style={{ fontSize:12, color:V.txtS, lineHeight:1.6, marginBottom:4 }}>{item.spec}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:item.color, background:`${item.color}15`, padding:'2px 8px', borderRadius:4, display:'inline-block' }}>{item.std}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* IEC Standards Quick Reference Table */}
            <div style={{ padding:'14px 18px', background:'rgba(37,99,235,.06)', borderRadius:12, border:'1px solid rgba(37,99,235,.20)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', gap:8, alignItems:'center' }}>
                <Info style={{ width:14, height:14 }} /> Key IEC Standards for LV Panel Cable Work
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                {[
                  ['IEC 60364-4-43', 'Overcurrent Protection — cable ≥ protection device', '#2563EB'],
                  ['IEC 60364-5-52', 'Cable current ratings & installation methods', '#2563EB'],
                  ['IEC 60364-5-54', 'PE conductor sizing — Table 54.3', '#7C3AED'],
                  ['IEC 60502-1',    'XLPE/PVC power cable construction', '#7C3AED'],
                  ['IEC 60228',      'Standard conductor cross-sections', '#059669'],
                  ['IEC 60227',      'PVC insulated flexible cables', '#059669'],
                  ['IEC 62444',      'Cable gland selection by OD', '#F97316'],
                  ['IEC 61084-1',    'Cable tray fill ratio ≤ 40%', '#F97316'],
                  ['IEC 60446',      'Conductor colour coding', '#0891B2'],
                  ['IEC 60999-1',    'Cable termination lugs', '#0891B2'],
                  ['IEC 60364-6-61', 'IR test: ≥ 1 MΩ before energisation', '#DC2626'],
                  ['IEC 60331',      'Fire resistance — cable penetration sealing', '#DC2626'],
                ].map(([code, desc, color]) => (
                  <div key={code} style={{ padding:'8px 12px', background:V.bg, borderRadius:8, border:`1px solid ${V.brdM}` }}>
                    <div style={{ fontSize:11, fontWeight:800, color, marginBottom:2 }}>{code}</div>
                    <div style={{ fontSize:11, color:V.txtM }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
