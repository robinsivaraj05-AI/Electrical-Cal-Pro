import React, { useState } from 'react';
import { Activity, Download, CheckCircle, XCircle } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#059669';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};
const inp = (val: string, set: (v: string) => void, label: string, unit = '', type = 'number') => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label}{unit && <span style={{ color: V.muted, marginLeft: 4 }}>({unit})</span>}</div>
    <input value={val} onChange={e => set(e.target.value)} type={type} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', fontFamily: V.mono }} />
  </div>
);
const resBlock = (text: string, ok: boolean) => (
  <div style={{ marginTop: 10, padding: '12px 14px', background: V.surf, borderRadius: 8, fontSize: 12, color: ok ? '#059669' : '#DC2626', fontFamily: V.mono, lineHeight: 1.8, whiteSpace: 'pre', border: `1.5px solid ${ok ? '#05966944' : '#DC262644'}` }}>{text}</div>
);
const pnl = (title: string, children: React.ReactNode) => (
  <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20, flex: 1, minWidth: 300, marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14, borderBottom: `1px solid ${V.brdM}`, paddingBottom: 10 }}>{title}</div>
    {children}
  </div>
);
const btn = (onClick: () => void, label: string) => (
  <button onClick={onClick} style={{ width: '100%', padding: '10px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 8 }}>{label}</button>
);

// ── 4-20mA Loop Verify ──────────────────────────────────────────────────────
function LoopVerify() {
  const [mA, setMA] = useState('12'); const [euMin, setEuMin] = useState('0'); const [euMax, setEuMax] = useState('100'); const [unit, setUnit] = useState('bar');
  const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const I = parseFloat(mA); const mn = parseFloat(euMin); const mx = parseFloat(euMax);
    const pct = (I-4)/16*100;
    const EU = mn + (I-4)/16*(mx-mn);
    const faulty = I < 3.8 || I > 20.5;
    const loAlarm = I < 4.0 && I >= 3.8;
    setOk(!faulty && !loAlarm);
    setResult(`4-20mA Signal Verification\n\nMeasured Signal  = ${I} mA\nLRV = ${mn} ${unit}  |  URV = ${mx} ${unit}\nSpan = ${(mx-mn).toFixed(3)} ${unit}\n\nPercentage of Span = (${I} - 4) / 16 × 100 = ${pct.toFixed(2)}%\nEngineering Value  = ${EU.toFixed(3)} ${unit}\n\nDiagnostic:\n  ${I < 3.8 ? '✘ FAULT — Signal below 3.8mA (NAMUR NE43 fault low)' : I > 20.5 ? '✘ FAULT — Signal above 20.5mA (NAMUR NE43 fault high)' : I < 4.0 ? '⚠ LOW ALARM — Between 3.8 and 4.0 mA' : '✔ Signal within normal operating range (4.0–20.0 mA)'}`);
  };

  return pnl('4-20mA Loop Signal Verification', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      {inp(mA, setMA, 'Measured Signal', 'mA')}
      {inp(euMin, setEuMin, 'LRV', '')}
      {inp(euMax, setEuMax, 'URV', '')}
    </div>
    {inp(unit, setUnit, 'Engineering Unit', '', 'text')}
    {btn(calc, 'Verify Signal')}
    {result && resBlock(result, ok)}
  </>);
}

// ── PLC Analog Scaling Verify ───────────────────────────────────────────────
function PLCScaling() {
  const [raw, setRaw] = useState('2048'); const [bits, setBits] = useState('12');
  const [euMin, setEuMin] = useState('0'); const [euMax, setEuMax] = useState('100'); const [unit, setUnit] = useState('');
  const [expectedEU, setExpectedEU] = useState('50');
  const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const R = parseFloat(raw); const B = parseInt(bits);
    const max = Math.pow(2, B) - 1;
    const mn = parseFloat(euMin); const mx = parseFloat(euMax);
    const EU = mn + (R/max)*(mx-mn);
    const expected = parseFloat(expectedEU);
    const err = Math.abs(EU - expected);
    const span = mx - mn;
    const errPct = err/span*100;
    const pass = errPct <= 0.1;
    setOk(pass);
    setResult(`PLC Analog Scaling Verification\n\nADC Resolution = ${B}-bit → max count = ${max}\nRaw Count  = ${R}\nLRV = ${mn}  |  URV = ${mx}  |  Span = ${span}\n\nCalculated EU = ${mn} + (${R}/${max}) × ${span} = ${EU.toFixed(4)} ${unit}\nExpected EU   = ${expected} ${unit}\n\nAbsolute Error = ${err.toFixed(4)} ${unit}\nError % of Span = ${errPct.toFixed(4)}%\n\n${pass ? '✔ PASS — Scaling verified within 0.1% tolerance' : '✘ FAIL — Scaling error exceeds 0.1% — check PLC scale blocks'}`);
  };

  return pnl('PLC Analog Input Scaling Verification', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(raw, setRaw, 'PLC Raw Count', 'counts')}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>ADC Resolution</div>
        <select value={bits} onChange={e => setBits(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
          {['8','10','12','14','16'].map(b => <option key={b} value={b}>{b}-bit (0–{Math.pow(2,parseInt(b))-1})</option>)}
        </select>
      </div>
      {inp(euMin, setEuMin, 'LRV', '')}
      {inp(euMax, setEuMax, 'URV', '')}
    </div>
    {inp(unit, setUnit, 'Engineering Unit', '', 'text')}
    {inp(expectedEU, setExpectedEU, 'Expected EU Value (from reference)', '')}
    {btn(calc, 'Verify PLC Scaling')}
    {result && resBlock(result, ok)}
  </>);
}

// ── RTD Check ───────────────────────────────────────────────────────────────
function RTDCheck() {
  const [measR, setMeasR] = useState('119.40'); const [temp, setTemp] = useState('50');
  const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const T = parseFloat(temp);
    const A = 3.9083e-3; const B = -5.775e-7;
    const expectedR = 100 * (1 + A*T + B*T*T);
    const measured = parseFloat(measR);
    const err = measured - expectedR;
    const tempErr = err / 0.3851; // Approx 0.385 Ω/°C for Pt100
    const pass = Math.abs(tempErr) <= 0.5;
    setOk(pass);
    setResult(`RTD Pt100 Verification (IEC 60751)\n\nCallendar-Van Dusen: R = R₀×(1 + AT + BT²)\nA = 3.9083×10⁻³,  B = -5.775×10⁻⁷,  R₀ = 100 Ω\n\nTemp Input   = ${T} °C\nExpected R   = 100×(1 + ${A}×${T} + ${B}×${T}²) = ${expectedR.toFixed(3)} Ω\nMeasured R   = ${measured} Ω\n\nResistance Error = ${err.toFixed(3)} Ω\nTemperature Error ≈ ${tempErr.toFixed(2)} °C  (1°C ≈ 0.385 Ω)\n\n${pass ? '✔ PASS — within ±0.5°C tolerance' : '✘ FAIL — exceeds ±0.5°C — check connections or RTD condition'}`);
  };

  return pnl('RTD Pt100 Resistance Check (IEC 60751)', <>
    {inp(temp, setTemp, 'Actual/Reference Temperature', '°C')}
    {inp(measR, setMeasR, 'Measured RTD Resistance', 'Ω')}
    {btn(calc, 'Verify RTD')}
    {result && resBlock(result, ok)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Pt100 sensitivity ≈ 0.385 Ω/°C at 0°C · Class A: ±(0.15 + 0.002|T|)°C</div>
  </>);
}

// ── TC mV Check ─────────────────────────────────────────────────────────────
const TC_TABLES: Record<string, [number,number][]> = {
  'K': [[-50,-1.889],[-40,-1.527],[-30,-1.156],[-20,-0.778],[-10,-0.392],[0,0.000],[10,0.397],[20,0.798],[30,1.203],[50,2.023],[100,4.096],[200,8.138],[300,12.209],[400,16.397],[500,20.644],[600,24.905],[700,29.129],[800,33.275],[900,37.326],[1000,41.276],[1200,48.838]],
  'J': [[-40,-1.961],[0,0.000],[20,1.019],[50,2.585],[100,5.269],[200,10.779],[300,16.327],[400,21.848],[500,27.393],[600,33.102],[700,39.132]],
  'T': [[-200,-5.603],[-100,-3.379],[0,0.000],[50,2.036],[100,4.279],[200,9.288],[300,14.862],[350,17.819],[400,20.872]],
  'S': [[0,0.000],[100,0.646],[200,1.441],[300,2.323],[400,3.260],[500,4.233],[600,5.239],[800,7.346],[1000,9.587],[1200,11.951],[1400,14.373],[1600,16.777]],
};

function interpolateTC(table: [number,number][], x: number): number {
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

function TCCheck() {
  const [tcType, setTcType] = useState('K'); const [temp, setTemp] = useState('500');
  const [measMV, setMeasMV] = useState('20.644');
  const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const T = parseFloat(temp); const mv = parseFloat(measMV);
    const table = TC_TABLES[tcType];
    const expectedMV = interpolateTC(table, T);
    const errMV = mv - expectedMV;
    // Approx sensitivity for each TC type
    const sensitivity: Record<string,number> = { K: 0.041, J: 0.055, T: 0.046, S: 0.011 };
    const tempErr = errMV / (sensitivity[tcType] || 0.04);
    const tolerances: Record<string,number> = { K: 2.5, J: 2.5, T: 1.0, S: 1.5 };
    const pass = Math.abs(tempErr) <= tolerances[tcType];
    setOk(pass);
    setResult(`Type ${tcType} Thermocouple Verification (IEC 60584)\n\nReference Temperature = ${T} °C\nExpected EMF (IEC table) = ${expectedMV.toFixed(3)} mV\nMeasured EMF            = ${mv} mV\n\nEMF Difference = ${errMV.toFixed(3)} mV\nTemperature Equiv Error ≈ ${tempErr.toFixed(1)} °C  (sens ≈ ${(sensitivity[tcType]*1000).toFixed(0)} μV/°C)\nClass 1 Tolerance: ±${tolerances[tcType]} °C\n\n${pass ? `✔ PASS — within Class 1 tolerance (±${tolerances[tcType]}°C)` : `✘ FAIL — exceeds ±${tolerances[tcType]}°C — check TC & head`}`);
  };

  return pnl('Thermocouple mV Verification (IEC 60584)', <>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>TC Type</div>
      <select value={tcType} onChange={e => setTcType(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
        {Object.keys(TC_TABLES).map(t => <option key={t} value={t}>Type {t}</option>)}
      </select>
    </div>
    {inp(temp, setTemp, 'Reference Temperature', '°C')}
    {inp(measMV, setMeasMV, 'Measured EMF', 'mV')}
    {btn(calc, 'Verify Thermocouple')}
    {result && resBlock(result, ok)}
  </>);
}

// ── Cable Resistance ────────────────────────────────────────────────────────
function CableResistance() {
  const [res_km, setRes_km] = useState('36.7'); const [len, setLen] = useState('0.5');
  const [measured, setMeasured] = useState('36'); const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const R = parseFloat(res_km); const L = parseFloat(len);
    const expectedOneWay = R * L;
    const expectedLoop = expectedOneWay * 2;
    const meas = parseFloat(measured);
    const errPct = (meas - expectedLoop) / expectedLoop * 100;
    const pass = Math.abs(errPct) <= 5;
    setOk(pass);
    setResult(`Cable Resistance Verification\n\nRated Resistance = ${R} Ω/km\nCable Length = ${L} km\nExpected (one-way) = ${R} × ${L} = ${expectedOneWay.toFixed(3)} Ω\nExpected (loop) = ${expectedOneWay.toFixed(3)} × 2 = ${expectedLoop.toFixed(3)} Ω\n\nMeasured Loop Resistance = ${meas} Ω\nDeviation = ${(meas-expectedLoop).toFixed(3)} Ω = ${errPct.toFixed(1)}%\n\n${pass ? '✔ PASS — within ±5% tolerance' : '✘ FAIL — check for high-resistance joints, corrosion, or cross-connection'}`);
  };

  return pnl('Cable Loop Resistance Verification', <>
    {inp(res_km, setRes_km, 'Cable Resistance', 'Ω/km')}
    {inp(len, setLen, 'Cable Length (one-way)', 'km')}
    {inp(measured, setMeasured, 'Measured Loop Resistance', 'Ω')}
    {btn(calc, 'Verify Cable Resistance')}
    {result && resBlock(result, ok)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Cu cable: 1.5mm² ≈ 24.4 Ω/km · 1.0mm² ≈ 36.7 Ω/km · 0.75mm² ≈ 48.9 Ω/km</div>
  </>);
}

// ── Insulation Resistance ───────────────────────────────────────────────────
function InsulationResistance() {
  const [measMΩ, setMeasMΩ] = useState('100'); const [voltage, setVoltage] = useState('500'); const [cableType, setCableType] = useState('instrument');
  const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const IR = parseFloat(measMΩ); const Vtest = parseFloat(voltage);
    const minIR: Record<string,number> = { instrument: 100, power: 1, control: 10, signal: 100 };
    const minVal = minIR[cableType] ?? 100;
    const pass = IR >= minVal;
    setOk(pass);
    setResult(`Insulation Resistance Test\n\nTest Voltage = ${Vtest} V DC (Megger)\nMeasured IR = ${IR} MΩ\nMinimum Acceptable = ${minVal} MΩ (${cableType} cable)\n\nPI (Polarization Index) test: IR_10min / IR_1min ≥ 1.5 (for motors)\n\n${pass ? `✔ PASS — IR = ${IR} MΩ ≥ ${minVal} MΩ minimum` : `✘ FAIL — IR = ${IR} MΩ < ${minVal} MΩ minimum — insulation degraded or moisture ingress`}`);
  };

  return pnl('Insulation Resistance Verification', <>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Cable Type</div>
      <select value={cableType} onChange={e => setCableType(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
        <option value="instrument">Instrument / Signal Cable (≥100 MΩ)</option>
        <option value="control">Control Cable (≥10 MΩ)</option>
        <option value="power">Power Cable (≥1 MΩ)</option>
      </select>
    </div>
    {inp(voltage, setVoltage, 'Test Voltage', 'V DC')}
    {inp(measMΩ, setMeasMΩ, 'Measured Insulation Resistance', 'MΩ')}
    {btn(calc, 'Verify Insulation')}
    {result && resBlock(result, ok)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>IEC 60228 · NFPA 70B · IEEE 43 · Test voltage: 250V (signal), 500V (control), 1000V (power)</div>
  </>);
}

// ── Power Verification ─────────────────────────────────────────────────────
function PowerVerify() {
  const [v, setV] = useState('24.1'); const [i, setI] = useState('0.45');
  const [vNom, setVNom] = useState('24'); const [vTol, setVTol] = useState('5');
  const [result, setResult] = useState(''); const [ok, setOk] = useState(true);

  const calc = () => {
    const V2 = parseFloat(v); const I = parseFloat(i);
    const Vn = parseFloat(vNom); const tol = parseFloat(vTol)/100;
    const P = V2 * I;
    const Vmin = Vn*(1-tol); const Vmax = Vn*(1+tol);
    const pass = V2 >= Vmin && V2 <= Vmax;
    setOk(pass);
    setResult(`24V DC Power Supply Verification\n\nNominal Voltage = ${Vn} V ± ${vTol}%\nAcceptable Range = ${Vmin.toFixed(2)} V to ${Vmax.toFixed(2)} V\n\nMeasured Voltage = ${V2} V  ${pass ? '✔ within tolerance' : '✘ OUT OF TOLERANCE'}\nMeasured Current = ${I} A\nPower Consumption = V × I = ${V2} × ${I} = ${P.toFixed(2)} W\n\n${pass ? '✔ PASS — Power supply within specification' : '✘ FAIL — Voltage outside acceptable range — check PSU and load'}`);
  };

  return pnl('DC Power Supply Verification', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(vNom, setVNom, 'Nominal Voltage', 'V')}
      {inp(vTol, setVTol, 'Tolerance', '%')}
      {inp(v, setV, 'Measured Voltage', 'V')}
      {inp(i, setI, 'Measured Current', 'A')}
    </div>
    {btn(calc, 'Verify Power Supply')}
    {result && resBlock(result, ok)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Typical 24VDC PSU tolerance: ±5% (22.8–25.2V) · IEC 61131-2 PLC power requirements</div>
  </>);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
type VerifyTab = 'loop' | 'plc' | 'rtd' | 'tc' | 'cable' | 'ir' | 'power';
const TABS: { key: VerifyTab; label: string }[] = [
  { key: 'loop',  label: '4-20mA Loop Verify' },
  { key: 'plc',   label: 'PLC Scaling Verify' },
  { key: 'rtd',   label: 'RTD Pt100 Check' },
  { key: 'tc',    label: 'Thermocouple Check' },
  { key: 'cable', label: 'Cable Resistance' },
  { key: 'ir',    label: 'Insulation Resistance' },
  { key: 'power', label: 'Power Supply Verify' },
];

export function ICVerification() {
  const [tab, setTab] = useState<VerifyTab>('loop');

  const handleDownload = () => {
    const rows = TABS.map(t => [t.label, 'Verification', 'Online check tool', 'ISA · IEC 60381 · IEC 60751']);
    const body = `<h2>Instrument Verification Tools</h2>${tableHTML(['Tool','Type','Purpose','Standard'], rows)}
<h2>Verification Best Practices</h2>
<p>1. Always compare against calibrated reference instrument.<br/>2. Record As Found condition before making any adjustments.<br/>3. Record As Left after adjustment and re-verify.<br/>4. Maintain calibration records per ISO 9001 and ISA-51.1.</p>`;
    downloadReport('Instrument Verification Tools Reference','4-20mA · PLC · RTD · TC · Cable · IR · Power Supply','ISA-51.1 · IEC 60381 · IEC 60751 · IEC 60584 · IEC 60228 · NAMUR NE43', body, 'IC-Verification-Reference.pdf');
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Activity} title="INSTRUMENT VERIFICATION TOOLS" subtitle="Loop Check · Signal Verify · PLC Scaling · RTD · TC · Cable · Insulation · Power" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', background: V.surf, borderRadius: 10, padding: 6, border: `1px solid ${V.brdM}` }}>
        {TABS.map(t => {
          const isActive = t.key === tab;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 12px', borderRadius: 7, background: isActive ? ACCENT : 'transparent', color: isActive ? '#fff' : V.sec, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 500 }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'loop'  && <LoopVerify />}
      {tab === 'plc'   && <PLCScaling />}
      {tab === 'rtd'   && <RTDCheck />}
      {tab === 'tc'    && <TCCheck />}
      {tab === 'cable' && <CableResistance />}
      {tab === 'ir'    && <InsulationResistance />}
      {tab === 'power' && <PowerVerify />}
    </div>
  );
}
