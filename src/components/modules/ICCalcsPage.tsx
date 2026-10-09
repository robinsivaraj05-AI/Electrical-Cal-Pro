import React, { useState } from 'react';
import {
  Gauge, Droplets, Thermometer, BarChart3, Settings2, Sliders,
  Zap, Cable, Download,
} from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#0891B2';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};
const inp = (val: string, set: (v: string) => void, label: string, unit = '') => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label}{unit && <span style={{ color: V.muted, marginLeft: 4 }}>({unit})</span>}</div>
    <input value={val} onChange={e => set(e.target.value)} type="number"
      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', fontFamily: V.mono }} />
  </div>
);
const res = (label: string, value: string, color = ACCENT) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: V.surf, borderRadius: 8, marginBottom: 6 }}>
    <span style={{ fontSize: 12, color: V.sec }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: V.mono }}>{value}</span>
  </div>
);
const calcBtn = (onClick: () => void, label = 'Calculate') => (
  <button onClick={onClick} style={{ width: '100%', padding: '11px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 8 }}>{label}</button>
);
const panel = (title: string, children: React.ReactNode) => (
  <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20, flex: 1, minWidth: 280 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14 }}>{title}</div>
    {children}
  </div>
);

// ── PRESSURE ─────────────────────────────────────────────────────────────────
const P_UNITS = ['Pa','kPa','MPa','bar','mbar','psi','kgf/cm²','mmHg','inHg','mmH₂O','inH₂O','atm'];
const TO_PA: Record<string,number> = { Pa:1, kPa:1e3, MPa:1e6, bar:1e5, mbar:100, psi:6894.76, 'kgf/cm²':98066.5, mmHg:133.322, inHg:3386.39, 'mmH₂O':9.80665, 'inH₂O':249.089, atm:101325 };

function PressureCalc() {
  const [val,setVal] = useState('1');
  const [fromU,setFromU] = useState('bar');
  const [rho,setRho] = useState('1000'); const [h,setH] = useState('10');
  const [p1,setP1] = useState('5'); const [p2,setP2] = useState('2'); const [dpU,setDpU] = useState('bar');
  const [result,setResult] = useState<Record<string,string>>({});
  const [headR,setHeadR] = useState(''); const [dpR,setDpR] = useState('');

  const convert = () => {
    const pa = parseFloat(val) * TO_PA[fromU];
    const r: Record<string,string> = {};
    P_UNITS.forEach(u => r[u] = (pa / TO_PA[u]).toPrecision(5));
    setResult(r);
  };
  const calcHead = () => {
    const p = parseFloat(rho) * 9.80665 * parseFloat(h);
    setHeadR(`P = ρgh = ${rho} × 9.81 × ${h} = ${p.toFixed(2)} Pa = ${(p/1e5).toFixed(5)} bar = ${(p/6894.76).toFixed(4)} psi`);
  };
  const calcDp = () => {
    const d = (parseFloat(p1) - parseFloat(p2)) * TO_PA[dpU];
    setDpR(`ΔP = ${p1} - ${p2} = ${(parseFloat(p1)-parseFloat(p2)).toFixed(4)} ${dpU} = ${(d/1e5).toFixed(5)} bar = ${(d/6894.76).toFixed(4)} psi = ${(d/1e3).toFixed(3)} kPa`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('Pressure Unit Converter', <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Value</div>
            <input value={val} onChange={e => setVal(e.target.value)} type="number" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>From Unit</div>
            <select value={fromU} onChange={e => setFromU(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
              {P_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        {calcBtn(convert, 'Convert All Units')}
        {Object.keys(result).length > 0 && (
          <div style={{ marginTop: 12 }}>
            {P_UNITS.map(u => res(u, result[u] + ' ' + u, u === fromU ? '#059669' : ACCENT))}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 11, color: V.muted }}>IEC 60381 · ISO 7-1 · ASME B40.100</div>
      </>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>
        {panel('Static Head (P = ρgh)', <>
          {inp(rho, setRho, 'Fluid Density', 'kg/m³')}
          {inp(h, setH, 'Column Height', 'm')}
          {calcBtn(calcHead, 'Calculate Static Head')}
          {headR && <div style={{ marginTop: 10, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: ACCENT, fontFamily: V.mono, lineHeight: 1.6 }}>{headR}</div>}
          <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>g = 9.80665 m/s² · Water: ρ = 1000 kg/m³</div>
        </>)}
        {panel('Differential Pressure (ΔP = P1 − P2)', <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>P1</div><input value={p1} onChange={e => setP1(e.target.value)} type="number" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>P2</div><input value={p2} onChange={e => setP2(e.target.value)} type="number" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Unit</div><select value={dpU} onChange={e => setDpU(e.target.value)} style={{ width: '100%', padding: '8px 6px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 12, color: V.txt, outline: 'none' }}>{P_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
          </div>
          {calcBtn(calcDp, 'Calculate ΔP')}
          {dpR && <div style={{ marginTop: 10, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: ACCENT, fontFamily: V.mono, lineHeight: 1.6 }}>{dpR}</div>}
        </>)}
      </div>
    </div>
  );
}

// ── FLOW ──────────────────────────────────────────────────────────────────────
function FlowCalc() {
  const [d,setD] = useState('0.1'); const [v,setV] = useState('2'); const [rho,setRho] = useState('1000');
  const [mu,setMu] = useState('0.001');
  const [q,setQ] = useState(''); const [re,setRe] = useState('');
  const [cd,setCd] = useState('0.61'); const [beta,setBeta] = useState('0.5');
  const [dp,setDp] = useState('50000'); const [rhoF,setRhoF] = useState('1000');
  const [qOri,setQOri] = useState('');
  const [cvQ,setCvQ] = useState('100'); const [cvSG,setCvSG] = useState('1.0'); const [cvDP,setCvDP] = useState('1');
  const [cvR,setCvR] = useState('');

  const calcFlow = () => {
    const D = parseFloat(d); const V2 = parseFloat(v); const rhoV = parseFloat(rho); const muV = parseFloat(mu);
    const A = Math.PI * (D/2)**2;
    const Q = A * V2;
    const Re = rhoV * V2 * D / muV;
    setQ(`A = π×(${D}/2)² = ${A.toFixed(5)} m²\nQ = A×V = ${A.toFixed(5)}×${V2} = ${Q.toFixed(4)} m³/s = ${(Q*3600).toFixed(2)} m³/hr = ${(Q*1000).toFixed(2)} L/s = ${(Q*1000*60).toFixed(2)} L/min`);
    const regime = Re < 2300 ? 'Laminar' : Re < 4000 ? 'Transitional' : 'Turbulent';
    setRe(`Re = ρVD/μ = ${rhoV}×${V2}×${D}/${muV} = ${Re.toFixed(0)} → ${regime}`);
  };
  const calcOrifice = () => {
    const Cd = parseFloat(cd); const b = parseFloat(beta); const dp2 = parseFloat(dp); const r = parseFloat(rhoF);
    const D2 = parseFloat(d); const d2 = b * D2;
    const Q = Cd * (Math.PI/4) * d2**2 * Math.sqrt(2*dp2/r);
    setQOri(`d = β×D = ${b}×${D2} = ${d2.toFixed(4)} m\nQ = Cd×(π/4)×d²×√(2ΔP/ρ)\n  = ${Cd}×(π/4)×${d2.toFixed(4)}²×√(2×${dp2}/${r})\n  = ${Q.toFixed(5)} m³/s = ${(Q*3600).toFixed(2)} m³/hr`);
  };
  const calcCv = () => {
    const Q2 = parseFloat(cvQ); const sg = parseFloat(cvSG); const dp2 = parseFloat(cvDP);
    const Cv = Q2 / 0.865 * Math.sqrt(sg / dp2);
    setCvR(`Cv = Q / N₁ × √(SG/ΔP) = ${Q2} / 0.865 × √(${sg}/${dp2}) = ${Cv.toFixed(2)}\n(N₁=0.865 for m³/hr, bar) · ISA-75.01`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('Volumetric Flow (Q = A×V) & Reynolds Number', <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {inp(d, setD, 'Pipe Inner Diameter', 'm')}
          {inp(v, setV, 'Flow Velocity', 'm/s')}
          {inp(rho, setRho, 'Fluid Density', 'kg/m³')}
          {inp(mu, setMu, 'Dynamic Viscosity', 'Pa·s')}
        </div>
        {calcBtn(calcFlow, 'Calculate Flow & Reynolds')}
        {q && <div style={{ marginTop: 10, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{q}</div>}
        {re && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: '#059669', fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{re}</div>}
        <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>ISO 5167 · Re &lt; 2300 Laminar · &gt; 4000 Turbulent</div>
      </>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>
        {panel('Orifice Plate Flow (ISO 5167)', <>
          {inp(cd, setCd, 'Discharge Coefficient Cd', '')}
          {inp(beta, setBeta, 'Diameter Ratio β = d/D', '')}
          {inp(dp, setDp, 'Differential Pressure', 'Pa')}
          {inp(rhoF, setRhoF, 'Fluid Density ρ', 'kg/m³')}
          {calcBtn(calcOrifice, 'Calculate Orifice Flow')}
          {qOri && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{qOri}</div>}
        </>)}
        {panel('Control Valve Cv (ISA-75.01)', <>
          {inp(cvQ, setCvQ, 'Flow Rate Q', 'm³/hr')}
          {inp(cvSG, setCvSG, 'Specific Gravity SG', '')}
          {inp(cvDP, setCvDP, 'Pressure Drop ΔP', 'bar')}
          {calcBtn(calcCv, 'Calculate Valve Cv')}
          {cvR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{cvR}</div>}
        </>)}
      </div>
    </div>
  );
}

// ── TEMPERATURE ───────────────────────────────────────────────────────────────
const PT100_TABLE: [number, number][] = [[-50,80.31],[-40,84.27],[-30,88.22],[-20,92.16],[-10,96.09],[0,100.00],[10,103.90],[20,107.79],[30,111.67],[40,115.54],[50,119.40],[60,123.24],[70,127.07],[80,130.89],[90,134.70],[100,138.50],[120,146.06],[150,157.33],[200,175.84],[250,194.08],[300,212.04],[350,229.72],[400,247.09]];
const TYPE_K_TABLE: [number, number][] = [[-50,-1.889],[-40,-1.527],[-30,-1.156],[-20,-0.778],[-10,-0.392],[0,0.000],[10,0.397],[20,0.798],[30,1.203],[40,1.611],[50,2.023],[100,4.096],[150,6.138],[200,8.138],[250,10.151],[300,12.209],[400,16.397],[500,20.644],[600,24.905],[700,29.129],[800,33.275],[900,37.326],[1000,41.276]];

function interpolate(table: [number,number][], x: number): number {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length-1][0]) return table[table.length-1][1];
  for (let i = 0; i < table.length-1; i++) {
    if (x >= table[i][0] && x <= table[i+1][0]) {
      const t = (x - table[i][0]) / (table[i+1][0] - table[i][0]);
      return table[i][1] + t * (table[i+1][1] - table[i][1]);
    }
  }
  return 0;
}

function TemperatureCalc() {
  const [tc, setTc] = useState('25');
  const [rtdR, setRtdR] = useState('');
  const [tcMv, setTcMv] = useState('');
  const [tConv, setTConv] = useState('');
  const [span0, setSpan0] = useState('0'); const [span100, setSpan100] = useState('100');
  const [actual, setActual] = useState('50'); const [indicated, setIndicated] = useState('52');
  const [errR, setErrR] = useState('');

  const calcAll = () => {
    const t = parseFloat(tc);
    const tf = t * 9/5 + 32;
    const tk = t + 273.15;
    setTConv(`${t} °C = ${tf.toFixed(2)} °F = ${tk.toFixed(2)} K`);
    // Callendar-Van Dusen: R = R0(1 + AT + BT²)
    const A = 3.9083e-3; const B = -5.775e-7;
    const R = 100 * (1 + A*t + B*t*t);
    setRtdR(`Pt100 Resistance = 100×(1 + 3.9083×10⁻³×${t} + (-5.775×10⁻⁷)×${t}²) = ${R.toFixed(3)} Ω`);
    const mv = interpolate(TYPE_K_TABLE, t);
    setTcMv(`Type K @ ${t}°C ≈ ${mv.toFixed(3)} mV (cold junction = 0°C)`);
  };
  const calcErr = () => {
    const span = parseFloat(span100) - parseFloat(span0);
    const err = (parseFloat(indicated) - parseFloat(actual)) / span * 100;
    setErrR(`Error = (${indicated} - ${actual}) / ${span} × 100 = ${err.toFixed(2)}% of span`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('Temperature Conversion & Sensor Reference', <>
        {inp(tc, setTc, 'Temperature Input', '°C')}
        {calcBtn(calcAll, 'Calculate All')}
        {tConv && res('Unit Conversion', tConv, '#F97316')}
        {rtdR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7 }}>{rtdR}</div>}
        {tcMv && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: '#059669', fontFamily: V.mono, lineHeight: 1.7 }}>{tcMv}</div>}
        <div style={{ marginTop: 10, fontSize: 11, color: V.muted }}>IEC 60751 (Pt100 α=0.00385) · IEC 60584 (Type K) · Callendar-Van Dusen equation</div>
      </>)}
      {panel('Temperature Error % of Span', <>
        {inp(span0, setSpan0, 'Span Lower Range (LRV)', '°C')}
        {inp(span100, setSpan100, 'Span Upper Range (URV)', '°C')}
        {inp(actual, setActual, 'Actual / Reference Temperature', '°C')}
        {inp(indicated, setIndicated, 'Indicated / Measured Value', '°C')}
        {calcBtn(calcErr, 'Calculate Error')}
        {errR && <div style={{ marginTop: 10, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: Math.abs(parseFloat(errR)) > 0.5 ? '#DC2626' : '#059669', fontFamily: V.mono }}>{errR}</div>}
        <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Typical accuracy: ±0.1–0.5% of span · IEC 60770</div>
      </>)}
    </div>
  );
}

// ── LEVEL ─────────────────────────────────────────────────────────────────────
function LevelCalc() {
  const [lvlP, setLvlP] = useState('15000'); const [lvlRho, setLvlRho] = useState('1000');
  const [lvlR, setLvlR] = useState('');
  const [pct, setPct] = useState('10'); const [lvlMin, setLvlMin] = useState('0'); const [lvlMax, setLvlMax] = useState('5');
  const [pctR, setPctR] = useState('');
  const [tankType, setTankType] = useState('cylinder');
  const [tD, setTD] = useState('3'); const [tH, setTH] = useState('5');
  const [tL, setTL] = useState('10'); const [tW, setTW] = useState('5');
  const [tFill, setTFill] = useState('80'); const [tankR, setTankR] = useState('');

  const calcHydro = () => {
    const p = parseFloat(lvlP); const r = parseFloat(lvlRho);
    const h = p / (r * 9.80665);
    setLvlR(`h = ΔP / (ρ×g) = ${p} / (${r}×9.81) = ${h.toFixed(3)} m = ${(h*100).toFixed(1)} cm`);
  };
  const calcPct = () => {
    const h2 = parseFloat(pct); const mn = parseFloat(lvlMin); const mx = parseFloat(lvlMax);
    const p2 = (h2 - mn) / (mx - mn) * 100;
    setPctR(`Level% = (${h2} - ${mn}) / (${mx} - ${mn}) × 100 = ${p2.toFixed(1)}%\nSignal = ${(4 + p2/100*16).toFixed(2)} mA`);
  };
  const calcTank = () => {
    const fill = parseFloat(tFill)/100;
    if (tankType === 'cylinder') {
      const r = parseFloat(tD)/2; const hTank = parseFloat(tH);
      const Vtot = Math.PI * r * r * hTank;
      setTankR(`Total Volume = π×r²×H = π×${r}²×${hTank} = ${Vtot.toFixed(2)} m³ = ${(Vtot*1000).toFixed(0)} L\nFilled (${tFill}%) = ${(Vtot*fill).toFixed(2)} m³ = ${(Vtot*fill*1000).toFixed(0)} L`);
    } else {
      const Vtot = parseFloat(tL)*parseFloat(tW)*parseFloat(tH);
      setTankR(`Total Volume = L×W×H = ${tL}×${tW}×${tH} = ${Vtot.toFixed(2)} m³ = ${(Vtot*1000).toFixed(0)} L\nFilled (${tFill}%) = ${(Vtot*fill).toFixed(2)} m³ = ${(Vtot*fill*1000).toFixed(0)} L`);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>
        {panel('Hydrostatic Level (h = ΔP/ρg)', <>
          {inp(lvlP, setLvlP, 'Differential Pressure', 'Pa')}
          {inp(lvlRho, setLvlRho, 'Fluid Density', 'kg/m³')}
          {calcBtn(calcHydro, 'Calculate Level Height')}
          {lvlR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: ACCENT, fontFamily: V.mono, lineHeight: 1.6 }}>{lvlR}</div>}
        </>)}
        {panel('Level % of Span', <>
          {inp(pct, setPct, 'Current Level Height', 'm')}
          {inp(lvlMin, setLvlMin, 'LRV (0%)', 'm')}
          {inp(lvlMax, setLvlMax, 'URV (100%)', 'm')}
          {calcBtn(calcPct, 'Calculate Level %')}
          {pctR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: '#059669', fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{pctR}</div>}
        </>)}
      </div>
      {panel('Tank Volume Calculator', <>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Tank Type</div>
          <select value={tankType} onChange={e => setTankType(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
            <option value="cylinder">Cylindrical (Vertical)</option>
            <option value="rect">Rectangular</option>
          </select>
        </div>
        {tankType === 'cylinder' ? <>
          {inp(tD, setTD, 'Diameter', 'm')}
          {inp(tH, setTH, 'Height', 'm')}
        </> : <>
          {inp(tL, setTL, 'Length', 'm')}
          {inp(tW, setTW, 'Width', 'm')}
          {inp(tH, setTH, 'Height', 'm')}
        </>}
        {inp(tFill, setTFill, 'Fill Level', '%')}
        {calcBtn(calcTank, 'Calculate Volume')}
        {tankR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{tankR}</div>}
        <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>ISO 4266 · API 650 · OIML R 71</div>
      </>)}
    </div>
  );
}

// ── CONTROL VALVE ─────────────────────────────────────────────────────────────
function ValveCalc() {
  const [vQ,setVQ] = useState('50'); const [vSG,setVSG] = useState('1.0'); const [vDP,setVDP] = useState('1.5');
  const [cvR,setCvR] = useState('');
  const [auth_dp_v,setAuth_dp_v] = useState('1.5'); const [auth_dp_sys,setAuth_dp_sys] = useState('5');
  const [authR,setAuthR] = useState('');
  const [rng_cvMax,setRng_cvMax] = useState('80'); const [rng_cvMin,setRng_cvMin] = useState('0.8');
  const [rngR,setRngR] = useState('');
  const [pos,setPos] = useState('50'); const [cv_max,setCv_max] = useState('80'); const [char,setChar] = useState('linear');
  const [posR,setPosR] = useState('');

  const calcCv = () => {
    const Q = parseFloat(vQ); const sg = parseFloat(vSG); const dp = parseFloat(vDP);
    const Cv = Q / 0.865 * Math.sqrt(sg/dp);
    setCvR(`Cv = Q / N₁ × √(SG/ΔP)\n   = ${Q} / 0.865 × √(${sg}/${dp})\n   = ${Cv.toFixed(2)}\n\nKv = Cv × 0.865 = ${(Cv*0.865).toFixed(2)} m³/(h·bar^0.5)\nISA-75.01 · IEC 60534`);
  };
  const calcAuth = () => {
    const dpV = parseFloat(auth_dp_v); const dpSys = parseFloat(auth_dp_sys);
    const N = dpV / dpSys * 100;
    const ok = N >= 30;
    setAuthR(`N = ΔP_valve / ΔP_system = ${dpV} / ${dpSys} = ${N.toFixed(1)}%\n${ok ? '✔ ACCEPTABLE (≥30%)' : '✘ LOW — consider higher ΔP_valve for good control'}`);
  };
  const calcRange = () => {
    const max = parseFloat(rng_cvMax); const min = parseFloat(rng_cvMin);
    const R = max/min;
    setRngR(`Rangeability = Cv_max / Cv_min = ${max} / ${min} = ${R.toFixed(0)}:1\nTypical: Equal% valve = 50:1, Linear = 30:1`);
  };
  const calcPos = () => {
    const p = parseFloat(pos)/100; const cvMax = parseFloat(cv_max);
    let cvActual: number;
    if (char === 'linear') cvActual = p * cvMax;
    else if (char === 'equalpc') cvActual = cvMax * Math.pow(50, p-1);
    else cvActual = cvMax * (p < 0.5 ? 2*p*p : -1+4*p-2*p*p);
    setPosR(`Valve Position: ${pos}% open\nCharacteristic: ${char}\nActual Cv = ${cvActual.toFixed(2)} (of max ${cvMax})`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('Valve Cv / Kv Sizing (ISA-75.01)', <>
        {inp(vQ, setVQ, 'Flow Rate Q', 'm³/hr')}
        {inp(vSG, setVSG, 'Specific Gravity SG', '')}
        {inp(vDP, setVDP, 'Pressure Drop ΔP', 'bar')}
        {calcBtn(calcCv, 'Calculate Cv / Kv')}
        {cvR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{cvR}</div>}
      </>)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>
        {panel('Valve Authority (N)', <>
          {inp(auth_dp_v, setAuth_dp_v, 'Valve ΔP at design flow', 'bar')}
          {inp(auth_dp_sys, setAuth_dp_sys, 'Total System ΔP', 'bar')}
          {calcBtn(calcAuth, 'Calculate Authority')}
          {authR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: authR.includes('✔') ? '#059669' : '#DC2626', fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{authR}</div>}
        </>)}
        {panel('Valve Rangeability & Position', <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {inp(rng_cvMax, setRng_cvMax, 'Cv Maximum', '')}
            {inp(rng_cvMin, setRng_cvMin, 'Cv Minimum', '')}
          </div>
          {calcBtn(calcRange, 'Calculate Rangeability')}
          {rngR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{rngR}</div>}
          <div style={{ marginTop: 12 }}>
            {inp(pos, setPos, 'Valve Position', '%')}
            {inp(cv_max, setCv_max, 'Cv Maximum', '')}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Characteristic</div>
              <select value={char} onChange={e => setChar(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
                <option value="linear">Linear</option>
                <option value="equalpc">Equal Percentage</option>
                <option value="qopen">Quick Opening</option>
              </select>
            </div>
            {calcBtn(calcPos, 'Calculate Cv at Position')}
            {posR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{posR}</div>}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ── PID TUNING ────────────────────────────────────────────────────────────────
function PIDCalc() {
  const [method, setMethod] = useState('zn');
  // ZN
  const [ku,setKu] = useState('5'); const [tu,setTu] = useState('10');
  // FOPDT
  const [kp_proc, setKp_proc] = useState('2'); const [tau,setTau] = useState('20'); const [theta,setTheta] = useState('3');
  const [lambda,setLambda] = useState('10');
  const [pidR, setPidR] = useState('');

  const calcZN = () => {
    const Ku = parseFloat(ku); const Tu = parseFloat(tu);
    setPidR(`Ziegler-Nichols Tuning (Ultimate Gain Method)\n\nP  Controller: Kp = 0.50×Ku = ${(0.5*Ku).toFixed(3)}\nPI Controller: Kp = ${(0.45*Ku).toFixed(3)}, Ti = ${(0.833*Tu).toFixed(2)} s  (Ki = ${(0.45*Ku/0.833/Tu).toFixed(4)})\nPID Controller:\n  Kp = ${(0.6*Ku).toFixed(3)}\n  Ti = ${(0.5*Tu).toFixed(2)} s   (Ki = ${(0.6*Ku/0.5/Tu).toFixed(4)})\n  Td = ${(0.125*Tu).toFixed(2)} s  (Kd = ${(0.6*Ku*0.125*Tu).toFixed(3)})`);
  };
  const calcCohen = () => {
    const K = parseFloat(kp_proc); const t = parseFloat(tau); const th = parseFloat(theta);
    const r = th/t;
    const Kp_P = (1/K)*(t/th)*(1 + r/3);
    const Kp_PI = (1/K)*(t/th)*(0.9 + r/12);
    const Ti_PI = th*(30+3*r)/(9+20*r);
    const Kp_PID = (1/K)*(t/th)*(1.35 + 0.25*r);
    const Ti_PID = th*(32+6*r)/(13+8*r);
    const Td_PID = 4*th/(11+2*r);
    setPidR(`Cohen-Coon Tuning (FOPDT Model: K=${K}, τ=${t}s, θ=${th}s)\nθ/τ ratio = ${r.toFixed(3)}\n\nP  Controller: Kp = ${Kp_P.toFixed(3)}\nPI Controller: Kp = ${Kp_PI.toFixed(3)},  Ti = ${Ti_PI.toFixed(2)} s\nPID Controller:\n  Kp = ${Kp_PID.toFixed(3)}\n  Ti = ${Ti_PID.toFixed(2)} s\n  Td = ${Td_PID.toFixed(2)} s`);
  };
  const calcLambda = () => {
    const K = parseFloat(kp_proc); const t = parseFloat(tau); const th = parseFloat(theta); const lam = parseFloat(lambda);
    const Kp_c = t / (K * (lam + th));
    setPidR(`Lambda Tuning (IMC-based, PI)\nProcess: K=${K}, τ=${t}s, θ=${th}s, λ=${lam}s\n\nPI Controller:\n  Kp = τ / (K×(λ+θ)) = ${t}/(${K}×(${lam}+${th})) = ${Kp_c.toFixed(4)}\n  Ti = τ = ${t} s\n  (Integral-only: Ki = Kp/Ti = ${(Kp_c/t).toFixed(5)})\n\nClosed-loop time constant ≈ λ+θ = ${(lam+th).toFixed(1)} s\nNote: Increase λ for more robust (slower) control`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('PID Tuning Method', <>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Select Method</div>
          <select value={method} onChange={e => setMethod(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
            <option value="zn">Ziegler-Nichols (Ultimate Gain)</option>
            <option value="cohen">Cohen-Coon (FOPDT)</option>
            <option value="lambda">Lambda / IMC Tuning</option>
          </select>
        </div>
        {method === 'zn' && <>
          {inp(ku, setKu, 'Ultimate Gain Ku', '')}
          {inp(tu, setTu, 'Ultimate Period Tu', 's')}
          {calcBtn(calcZN, 'Calculate ZN Tuning')}
        </>}
        {(method === 'cohen' || method === 'lambda') && <>
          {inp(kp_proc, setKp_proc, 'Process Gain K', '%/%')}
          {inp(tau, setTau, 'Process Time Constant τ', 's')}
          {inp(theta, setTheta, 'Dead Time θ', 's')}
          {method === 'lambda' && inp(lambda, setLambda, 'Desired Closed-Loop TC λ', 's')}
          {method === 'cohen' && calcBtn(calcCohen, 'Calculate Cohen-Coon')}
          {method === 'lambda' && calcBtn(calcLambda, 'Calculate Lambda Tuning')}
        </>}
      </>)}
      <div style={{ flex: 1, minWidth: 320 }}>
        {pidR && (
          <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>Tuning Results</div>
            <div style={{ padding: '12px 14px', background: V.surf, borderRadius: 8, fontSize: 12, color: V.txt, fontFamily: V.mono, lineHeight: 1.8, whiteSpace: 'pre' }}>{pidR}</div>
            <div style={{ marginTop: 12, fontSize: 11, color: V.muted }}>ISA-5.1 · Åström & Hägglund "PID Controllers: Theory, Design, and Tuning"</div>
          </div>
        )}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>PID Parameter Summary</div>
          {[['Kp', 'Proportional Gain', 'Increases speed, reduces offset, may cause oscillation'],
            ['Ti', 'Integral Time (s)', 'Eliminates steady-state error; too small → instability'],
            ['Td', 'Derivative Time (s)', 'Reduces overshoot; sensitive to noise'],
            ['Ki', 'Ki = Kp/Ti', 'Integral gain in parallel form'],
            ['Kd', 'Kd = Kp×Td', 'Derivative gain in parallel form'],
          ].map(([param, name, note]) => (
            <div key={param} style={{ padding: '8px 0', borderBottom: `1px solid ${V.brdM}` }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: ACCENT, minWidth: 30, fontFamily: V.mono }}>{param}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: V.txt }}>{name}</span>
              </div>
              <div style={{ fontSize: 11, color: V.muted, marginLeft: 38 }}>{note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SIGNAL ────────────────────────────────────────────────────────────────────
function SignalCalc() {
  const [mA, setMA] = useState('12'); const [euMin, setEuMin] = useState('0'); const [euMax, setEuMax] = useState('100');
  const [maR, setMaR] = useState('');
  const [raw, setRaw] = useState('2048'); const [bits, setBits] = useState('12');
  const [rawR, setRawR] = useState('');
  const [eu, setEu] = useState('50');
  const [backR, setBackR] = useState('');

  const calcMA = () => {
    const I = parseFloat(mA); const mn = parseFloat(euMin); const mx = parseFloat(euMax);
    const EU = mn + (I-4)/(20-4)*(mx-mn);
    const pct = (I-4)/16*100;
    setMaR(`Engineering Unit = ${mn} + (${I} - 4) / 16 × (${mx} - ${mn})\n  = ${EU.toFixed(3)} [${pct.toFixed(1)}% of span]\nDiagnostic: ${I < 3.8 ? '⚠ FAULT (< 3.8 mA)' : I < 4 ? '⚠ LOW ALARM' : I > 20.5 ? '⚠ FAULT (> 20.5 mA)' : '✔ Normal'}`);
  };
  const calcRaw = () => {
    const R = parseFloat(raw); const B = parseInt(bits);
    const maxCount = Math.pow(2, B) - 1;
    const mn = parseFloat(euMin); const mx = parseFloat(euMax);
    const EU = mn + (R/maxCount)*(mx-mn);
    const mA2 = 4 + (R/maxCount)*16;
    setRawR(`Max Count (${B}-bit) = 2^${B} - 1 = ${maxCount}\nEU = ${mn} + (${R}/${maxCount}) × (${mx}-${mn}) = ${EU.toFixed(3)}\n4-20mA equiv = ${mA2.toFixed(2)} mA`);
  };
  const calcBack = () => {
    const EU2 = parseFloat(eu); const mn = parseFloat(euMin); const mx = parseFloat(euMax);
    const I = 4 + (EU2-mn)/(mx-mn)*16;
    const maxCount = Math.pow(2, parseInt(bits)) - 1;
    const R2 = Math.round((EU2-mn)/(mx-mn)*maxCount);
    setBackR(`EU → 4-20mA: I = 4 + (${EU2}-${mn})/(${mx}-${mn})×16 = ${I.toFixed(3)} mA\nEU → ${bits}-bit RAW = ${R2} counts`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('Signal Scaling Configuration', <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {inp(euMin, setEuMin, 'LRV (0% / 4mA)', '')}
          {inp(euMax, setEuMax, 'URV (100% / 20mA)', '')}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>ADC Resolution (bits)</div>
          <select value={bits} onChange={e => setBits(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
            {['8','10','12','14','16'].map(b => <option key={b} value={b}>{b}-bit (0 to {Math.pow(2,parseInt(b))-1})</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11, color: V.muted, padding: '8px 12px', background: V.surf, borderRadius: 8 }}>
          Formula: EU = LRV + (I−4)/16 × (URV−LRV) · IEC 60381 · NAMUR NE43
        </div>
      </>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>
        {panel('4-20mA → Engineering Units', <>
          {inp(mA, setMA, 'Current Signal', 'mA')}
          {calcBtn(calcMA, 'Convert mA → EU')}
          {maR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{maR}</div>}
        </>)}
        {panel('PLC Raw Count → Engineering Units', <>
          {inp(raw, setRaw, 'Raw ADC Count', '')}
          {calcBtn(calcRaw, 'Convert Raw → EU')}
          {rawR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: '#059669', fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{rawR}</div>}
        </>)}
        {panel('Engineering Units → mA & Raw Count', <>
          {inp(eu, setEu, 'Engineering Unit Value', '')}
          {calcBtn(calcBack, 'Convert EU → Signal')}
          {backR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: '#8B5CF6', fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{backR}</div>}
        </>)}
      </div>
    </div>
  );
}

// ── LOOP ──────────────────────────────────────────────────────────────────────
function LoopCalc() {
  const [res_km, setRes_km] = useState('20'); const [len, setLen] = useState('0.5');
  const [r_barrier, setR_barrier] = useState('300'); const [r_recv, setR_recv] = useState('250');
  const [v_supply, setV_supply] = useState('24'); const [loopR, setLoopR] = useState('');
  const [voc, setVoc] = useState('28'); const [isc, setIsc] = useState('93'); const [pmax, setPmax] = useState('660');
  const [isR, setIsR] = useState('');

  const calcLoop = () => {
    const Rcable = parseFloat(res_km) * parseFloat(len) * 2;
    const Rbarrier = parseFloat(r_barrier);
    const Rrecv = parseFloat(r_recv);
    const Rtotal = Rcable + Rbarrier + Rrecv;
    const Vdrop = 0.020 * Rtotal;
    const Vavail = parseFloat(v_supply) - Vdrop;
    const minVtx = 12;
    const ok = Vavail >= minVtx;
    setLoopR(`Cable Resistance = ρ/km × L × 2 = ${res_km} × ${len} × 2 = ${Rcable.toFixed(1)} Ω\nBarrier Resistance = ${Rbarrier} Ω\nReceiver Resistance = ${Rrecv} Ω\nTotal Loop Resistance = ${Rtotal.toFixed(1)} Ω\n\nVoltage Drop @ 20mA = 0.020 × ${Rtotal.toFixed(1)} = ${Vdrop.toFixed(2)} V\nAvailable for Transmitter = ${v_supply} - ${Vdrop.toFixed(2)} = ${Vavail.toFixed(2)} V\nCompliance: ${ok ? `✔ OK (≥${minVtx}V for 2-wire transmitter)` : '✘ INSUFFICIENT — reduce cable length or resistance'}`);
  };
  const calcIS = () => {
    const Vm = parseFloat(voc); const Im = parseFloat(isc)*1e-3; const Pm = parseFloat(pmax)*1e-3;
    const isOK = Vm <= 28 && Im <= 0.093 && Pm <= 0.66;
    setIsR(`IS Entity Parameters (Entity Concept — IEC 60079-11)\n\nBarrier Voc = ${Vm} V ${Vm<=28?'✔':'✘'} (max 28V)\nBarrier Isc = ${(Im*1000).toFixed(0)} mA ${Im<=0.093?'✔':'✘'} (max 93mA)\nBarrier Pmax = ${(Pm*1000).toFixed(0)} mW ${Pm<=0.66?'✔':'✘'} (max 660mW)\n\nConclusion: ${isOK ? '✔ COMPLIANT — Entity concept verified' : '✘ NON-COMPLIANT — Check barrier parameters'}`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {panel('Loop Resistance & Voltage Budget', <>
        {inp(res_km, setRes_km, 'Cable Resistance', 'Ω/km')}
        {inp(len, setLen, 'Cable Length (one way)', 'km')}
        {inp(r_barrier, setR_barrier, 'Zener Barrier / Isolator', 'Ω')}
        {inp(r_recv, setR_recv, 'Receiver / PLC Input', 'Ω')}
        {inp(v_supply, setV_supply, 'Supply Voltage', 'V')}
        {calcBtn(calcLoop, 'Calculate Loop Budget')}
        {loopR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: loopR.includes('✘') ? '#DC2626' : ACCENT, fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{loopR}</div>}
        <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>IEC 60381 · NAMUR NE43 · Typical cable: 0.5mm² Cu ≈ 70 Ω/km</div>
      </>)}
      {panel('Intrinsic Safety — Entity Verification (IEC 60079-11)', <>
        {inp(voc, setVoc, 'Barrier Voc (Open-Circuit Voltage)', 'V')}
        {inp(isc, setIsc, 'Barrier Isc (Short-Circuit Current)', 'mA')}
        {inp(pmax, setPmax, 'Barrier Pmax', 'mW')}
        {calcBtn(calcIS, 'Verify IS Parameters')}
        {isR && <div style={{ marginTop: 8, padding: '10px 12px', background: V.surf, borderRadius: 8, fontSize: 11, color: isR.includes('✘') ? '#DC2626' : '#059669', fontFamily: V.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>{isR}</div>}
        <div style={{ marginTop: 12, fontSize: 11, color: V.muted }}>
          <strong style={{ color: V.lbl }}>IEC 60079-11 Entity Concept Limits:</strong><br/>
          Voc ≤ 28V · Isc ≤ 93mA · Pmax ≤ 660mW<br/>
          Also verify Ca, La entity parameters from certificate.
        </div>
      </>)}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
type CalcTab = 'pressure' | 'flow' | 'temperature' | 'level' | 'valve' | 'pid' | 'signal' | 'loop';
const TABS: { key: CalcTab; label: string; icon: React.ElementType }[] = [
  { key: 'pressure',    label: 'Pressure',       icon: Gauge },
  { key: 'flow',        label: 'Flow',            icon: Droplets },
  { key: 'temperature', label: 'Temperature',     icon: Thermometer },
  { key: 'level',       label: 'Level',           icon: BarChart3 },
  { key: 'valve',       label: 'Control Valve',   icon: Settings2 },
  { key: 'pid',         label: 'PID Tuning',      icon: Sliders },
  { key: 'signal',      label: 'Signal Scaling',  icon: Zap },
  { key: 'loop',        label: 'Loop Budget',     icon: Cable },
];

export function ICCalcsPage() {
  const [tab, setTab] = useState<CalcTab>('pressure');

  const handleDownload = () => {
    const rows = TABS.map(t => [t.label, 'Active', 'Multiple sub-calculators', 'ISA · IEC 60381 · ISO 5167']);
    const body = `<h2>Instrument Engineering Calculators — Module Reference</h2>${tableHTML(['Calculator','Status','Description','Standards'], rows)}
<h2>Key Engineering Formulas</h2>
<table><thead><tr><th>Formula</th><th>Application</th><th>Standard</th></tr></thead><tbody>
<tr><td class="lbl">P = ρgh</td><td class="val">Static head / hydrostatic pressure</td><td class="note">IEC 60770</td></tr>
<tr><td class="lbl">Q = A×V</td><td class="val">Volumetric flow rate</td><td class="note">ISO 5167</td></tr>
<tr><td class="lbl">Re = ρVD/μ</td><td class="val">Reynolds number (flow regime)</td><td class="note">ISO 5167</td></tr>
<tr><td class="lbl">m = ρ×Q</td><td class="val">Mass flow rate</td><td class="note">ISO 5167</td></tr>
<tr><td class="lbl">Cv = Q/N₁×√(SG/ΔP)</td><td class="val">Control valve sizing (liquid)</td><td class="note">ISA-75.01</td></tr>
<tr><td class="lbl">EU = LRV+(I−4)/16×Span</td><td class="val">4-20mA signal scaling</td><td class="note">IEC 60381</td></tr>
<tr><td class="lbl">R = R₀(1+AT+BT²)</td><td class="val">Pt100 RTD resistance (CVD)</td><td class="note">IEC 60751</td></tr>
</tbody></table>`;
    downloadReport('Instrumentation Engineering Calculators','Pressure · Flow · Temp · Level · Valve · PID · Signal · Loop','ISA · IEC 60381 · ISO 5167 · IEC 60751 · IEC 60079-11 · ISA-75.01', body, 'IC-Calculators-Reference.pdf');
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Gauge} title="INSTRUMENT ENGINEERING CALCULATORS" subtitle="Pressure · Flow · Temperature · Level · Control Valve · PID · Signal · Loop · ISA · IEC" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', background: V.surf, borderRadius: 10, padding: 6, border: `1px solid ${V.brdM}` }}>
        {TABS.map(t => {
          const isActive = t.key === tab;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 7, background: isActive ? ACCENT : 'transparent', color: isActive ? '#fff' : V.sec, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 500, transition: 'all 0.15s' }}>
              <t.icon style={{ width: 13, height: 13 }} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'pressure'    && <PressureCalc />}
      {tab === 'flow'        && <FlowCalc />}
      {tab === 'temperature' && <TemperatureCalc />}
      {tab === 'level'       && <LevelCalc />}
      {tab === 'valve'       && <ValveCalc />}
      {tab === 'pid'         && <PIDCalc />}
      {tab === 'signal'      && <SignalCalc />}
      {tab === 'loop'        && <LoopCalc />}
    </div>
  );
}
