import React, { useState } from 'react';
import { Activity, Zap, Clock, Globe, Wind, Radio, BarChart3, Download } from 'lucide-react';
import { downloadReport, tableHTML } from '../../utils/reportDownload';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  CalcButton, TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#DC2626';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

type TestTab = 'ir' | 'contact' | 'timing' | 'earth' | 'sf6' | 'relay' | 'ct';
const TABS: { key: TestTab; label: string; icon: React.ElementType }[] = [
  { key: 'ir',      label: 'Insulation Resistance',  icon: Activity },
  { key: 'contact', label: 'Contact Resistance',      icon: Zap },
  { key: 'timing',  label: 'CB Timing Test',          icon: Clock },
  { key: 'earth',   label: 'Earth Resistance',        icon: Globe },
  { key: 'sf6',     label: 'SF6 Gas Analysis',        icon: Wind },
  { key: 'relay',   label: 'IDMT Relay Test',         icon: Radio },
  { key: 'ct',      label: 'CT / PT Test',            icon: BarChart3 },
];

// ── IR TEST ──────────────────────────────────────────────────────────────────
function IRTest() {
  const { addCalculation } = useStore();
  const [temp, setTemp] = useState('30');
  const [humidity, setHumidity] = useState('65');
  const [tvolt, setTvolt] = useState('5000');
  const [ir1, setIr1] = useState('1800');
  const [ir10, setIr10] = useState('4500');
  const [ir30s, setIr30s] = useState('1400');
  const [ir60s, setIr60s] = useState('1800');
  const [eqType, setEqType] = useState('switchgear');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const T = parseFloat(temp); const ir1m = parseFloat(ir1); const ir10m = parseFloat(ir10);
    const ir30 = parseFloat(ir30s); const ir60 = parseFloat(ir60s);
    // Correction: K=2 doubles per 10°C, referenced to 20°C
    const correction = Math.pow(2, (T - 20) / 10);
    const ir1_corr = ir1m * correction;
    const ir10_corr = ir10m * correction;
    const pi = ir10m / ir1m;
    const dar = ir60 / ir30;
    const minIR = eqType === 'switchgear' ? 1000 : eqType === 'transformer' ? 500 : eqType === 'motor' ? 100 : 200;
    const piMin = eqType === 'transformer' ? 1.5 : 1.25;
    const piStatus = pi >= 2.0 ? 'Excellent' : pi >= piMin ? 'Good' : pi >= 1.1 ? 'Questionable' : pi >= 1.0 ? 'Poor' : 'Dangerous';
    const irOK = ir1_corr >= minIR; const piOK = pi >= piMin; const darOK = dar >= 1.25;
    const res: CalculationResult = {
      values: [
        { label: 'Temp Correction Factor', value: correction.toFixed(3), unit: '×' },
        { label: 'IR @ 1 min → corrected to 20°C', value: ir1_corr.toFixed(0), unit: 'MΩ', highlight: true, status: irOK ? 'PASS' : 'FAIL' },
        { label: 'IR @ 10 min (corrected)', value: ir10_corr.toFixed(0), unit: 'MΩ' },
        { label: 'Polarization Index (PI)', value: pi.toFixed(2), unit: '', highlight: true, status: piOK ? 'PASS' : 'FAIL' },
        { label: 'PI Assessment', value: piStatus, unit: '', status: piOK ? 'PASS' : 'WARNING' },
        { label: 'DAR (60s / 30s)', value: dar.toFixed(2), unit: '', status: darOK ? 'PASS' : 'FAIL' },
        { label: 'Minimum Acceptable IR', value: minIR.toString(), unit: 'MΩ' },
      ],
      status: irOK && piOK && darOK ? 'PASS' : 'FAIL',
      recommendation: `${irOK && piOK && darOK ? '✔ INSULATION ACCEPTABLE' : '✘ INSULATION REQUIRES INVESTIGATION'}. IR@20°C = ${ir1_corr.toFixed(0)} MΩ (min ${minIR} MΩ). PI = ${pi.toFixed(2)} [${piStatus}]. DAR = ${dar.toFixed(2)} [${darOK ? 'Good' : 'Poor'}]. ${!irOK ? 'Dry out equipment in oven/heater before re-test. Check for moisture ingress or contamination.' : ''} ${!piOK ? 'PI below threshold — progressive insulation degradation suspected. Schedule detailed inspection.' : ''}`,
      formula: 'IR_20°C = IR_meas × 2^((T−20)/10)  ·  PI = IR10min/IR1min  ·  DAR = IR60s/IR30s',
      steps: [
        { step: 1, description: 'Temperature correction (reference 20°C)', formula: `K = 2^((${T}−20)/10) = 2^${((T-20)/10).toFixed(2)}`, result: `Correction = ${correction.toFixed(3)}` },
        { step: 2, description: 'Corrected IR at 1 minute', formula: `${ir1m} MΩ × ${correction.toFixed(3)} = ${ir1_corr.toFixed(0)} MΩ`, result: `${ir1_corr.toFixed(0)} MΩ ${irOK ? '≥' : '<'} ${minIR} MΩ → ${irOK ? 'PASS' : 'FAIL'}` },
        { step: 3, description: 'Polarization Index (IEEE 43)', formula: `PI = IR10min / IR1min = ${ir10m} / ${ir1m}`, result: `PI = ${pi.toFixed(2)} → ${piStatus} (${piOK ? 'PASS' : 'FAIL'}, min ${piMin})` },
        { step: 4, description: 'Dielectric Absorption Ratio', formula: `DAR = IR60s / IR30s = ${ir60} / ${ir30}`, result: `DAR = ${dar.toFixed(2)} ${darOK ? '≥ 1.25 PASS' : '< 1.25 FAIL'}` },
        { step: 5, description: 'Overall decision', formula: 'All three criteria required: IR_corr ≥ min, PI ≥ min, DAR ≥ 1.25', result: irOK && piOK && darOK ? 'ALL CRITERIA MET — ACCEPTABLE' : 'ONE OR MORE FAILURES — INVESTIGATE' },
      ],
      standardRef: { standard: 'IEEE 43-2013', clause: '5.3', title: 'Insulation Resistance Testing of Electric Machinery' },
    };
    setResult(res);
    addCalculation({ type: 'hv-ir-test', title: `HV IR Test — PI=${pi.toFixed(2)}, IR=${ir1_corr.toFixed(0)} MΩ@20°C`, inputs: { temp, humidity, tvolt, ir1, ir10 }, results: res, notes: '', standard: 'IEEE 43 / IEC 60243' });
  };

  return (
    <div>
      <div style={{ marginBottom: 12, padding: '10px 14px', background: '#DC262618', border: '1px solid #DC262640', borderRadius: 8, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
        ⚡ Safety: ISOLATE, LOCK OUT, EARTH, TEST FOR DEAD before connecting test equipment. Minimum PPE: Arc Flash Suit (Cat 2+), HV Rubber Gloves, Face Shield. Test voltage: 5 kV DC for 11 kV equipment.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SectionLabel title="Equipment & Conditions" />
          <SelectInput label="Equipment Type" value={eqType} onChange={setEqType} options={[
            { value: 'switchgear',   label: 'HV Switchgear (11kV)' },
            { value: 'transformer',  label: 'Power Transformer' },
            { value: 'motor',        label: 'HV Motor / Generator' },
            { value: 'cable',        label: 'HV Cable' },
          ]} tooltip="Determines minimum acceptable IR value and PI threshold" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Ambient Temperature" value={temp} onChange={setTemp} unit="°C" min={-10} max={60} tooltip="Equipment surface temperature at time of test — used for temperature correction" />
            <TextInput label="Relative Humidity" value={humidity} onChange={setHumidity} unit="%" min={0} max={100} tooltip="Record for test report — high humidity (>80%) may depress IR readings" />
          </FieldRow>
          <TextInput label="Test Voltage Applied" value={tvolt} onChange={setTvolt} unit="V DC" tooltip="5 kV DC for 11 kV class equipment (per IEEE 43 Table 1)" />
          <SectionLabel title="Measured Insulation Resistance" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="IR at 30 seconds" value={ir30s} onChange={setIr30s} unit="MΩ" tooltip="Read at 30 s (for DAR calculation)" />
            <TextInput label="IR at 60 seconds" value={ir60s} onChange={setIr60s} unit="MΩ" tooltip="Read at 60 s (for DAR calculation)" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="IR at 1 minute" value={ir1} onChange={setIr1} unit="MΩ" tooltip="Main acceptance value — read at exactly 1 minute" />
            <TextInput label="IR at 10 minutes" value={ir10} onChange={setIr10} unit="MΩ" tooltip="For PI calculation — most important for HV equipment" />
          </FieldRow>
          <CalcButton onClick={calculate} label="Calculate IR / PI / DAR" icon={Activity} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}

      {/* Acceptance Table */}
      <div style={{ marginTop: 20, background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${V.brdM}`, fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase' }}>IEEE 43 Acceptance Criteria</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: V.surf }}>
            {['PI Range','Assessment','Action','Colour'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: V.lbl }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              ['< 1.0',     'Dangerous',     'Do NOT energise — immediate investigation',         '#DC2626'],
              ['1.0 – 1.1', 'Poor',          'Dry out before energising — monitor closely',       '#EA580C'],
              ['1.1 – 1.25','Questionable',  'Proceed with caution — monitor trend',              '#D97706'],
              ['1.25 – 2.0','Good',          'Acceptable for service — continue schedule',        '#059669'],
              ['> 2.0',     'Excellent',     'Excellent condition — extend PM interval',          '#0891B2'],
            ].map(([pi, assess, action, color]) => (
              <tr key={pi as string} style={{ borderTop: `1px solid ${V.brdM}` }}>
                <td style={{ padding: '8px 12px', fontFamily: V.mono, fontSize: 12, fontWeight: 700, color: color as string }}>{pi}</td>
                <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: color as string }}>{assess}</td>
                <td style={{ padding: '8px 12px', fontSize: 12, color: V.sec }}>{action}</td>
                <td style={{ padding: '8px 12px' }}><div style={{ width: 16, height: 16, borderRadius: 4, background: color as string }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CONTACT RESISTANCE TEST ───────────────────────────────────────────────────
function ContactResistanceTest() {
  const { addCalculation } = useStore();
  const [current, setCurrent] = useState('100');
  const [r1, setR1] = useState('52'); const [r2, setR2] = useState('54'); const [r3, setR3] = useState('51');
  const [component, setComponent] = useState('main-contacts');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const I = parseFloat(current);
    const R_R = parseFloat(r1); const R_Y = parseFloat(r2); const R_B = parseFloat(r3);
    const avg = (R_R + R_Y + R_B) / 3;
    const maxR = Math.max(R_R, R_Y, R_B); const minR = Math.min(R_R, R_Y, R_B);
    const discrepancy = maxR - minR;
    const limits: Record<string, number> = { 'main-contacts': 60, 'earth-switch': 150, 'busbar-joint': 10, 'cable-lug': 20 };
    const limit = limits[component] ?? 60;
    const vDrop = (avg * I) / 1e6 * 1000; // mV
    const pLoss = Math.pow(I, 2) * avg * 1e-6; // W
    const allOK = R_R <= limit && R_Y <= limit && R_B <= limit;

    const res: CalculationResult = {
      values: [
        { label: 'R Phase', value: R_R.toString(), unit: 'μΩ', status: R_R <= limit ? 'PASS' : 'FAIL' },
        { label: 'Y Phase', value: R_Y.toString(), unit: 'μΩ', status: R_Y <= limit ? 'PASS' : 'FAIL' },
        { label: 'B Phase', value: R_B.toString(), unit: 'μΩ', status: R_B <= limit ? 'PASS' : 'FAIL' },
        { label: 'Average Resistance', value: avg.toFixed(1), unit: 'μΩ', highlight: true, status: avg <= limit ? 'PASS' : 'FAIL' },
        { label: 'Phase Discrepancy', value: discrepancy.toFixed(1), unit: 'μΩ', status: discrepancy <= 20 ? 'PASS' : 'WARNING' },
        { label: 'Voltage Drop (at test current)', value: vDrop.toFixed(2), unit: 'mV' },
        { label: 'Power Loss per Phase', value: pLoss.toFixed(2), unit: 'W' },
        { label: 'Acceptance Limit', value: limit.toString(), unit: 'μΩ' },
      ],
      status: allOK ? 'PASS' : 'FAIL',
      recommendation: `${allOK ? '✔ ALL CONTACTS WITHIN LIMIT' : '✘ CONTACTS EXCEED LIMIT — CLEANING / REPLACEMENT REQUIRED'}. Average = ${avg.toFixed(1)} μΩ (limit: ${limit} μΩ). ${!allOK ? 'Clean contacts with contact cleaning spray. Check for pitting, arcing damage or inadequate contact pressure. If cleaning does not reduce resistance, replace vacuum bottles or contact assembly.' : 'Continue normal maintenance schedule.'}`,
      formula: 'V_drop = I × R  ·  P_loss = I² × R  ·  Limit per IEC 62271-100',
      steps: [
        { step: 1, description: 'Test current applied (DC micro-ohmmeter)', formula: `Test current = ${I} A DC (per ANSI/IEEE C37.09)`, result: `${I} A DC` },
        { step: 2, description: 'Phase resistances measured', formula: `R: ${R_R} μΩ, Y: ${R_Y} μΩ, B: ${R_B} μΩ`, result: `Max = ${maxR} μΩ, Min = ${minR} μΩ` },
        { step: 3, description: 'Average contact resistance', formula: `(${R_R} + ${R_Y} + ${R_B}) / 3 = ${avg.toFixed(1)} μΩ`, result: `${avg.toFixed(1)} μΩ ${avg <= limit ? '≤' : '>'} ${limit} μΩ → ${avg <= limit ? 'PASS' : 'FAIL'}` },
        { step: 4, description: 'Voltage drop at rated current', formula: `V = I × R = ${I} × ${avg.toFixed(1)}e-6 = ${vDrop.toFixed(2)} mV`, result: `${vDrop.toFixed(2)} mV` },
        { step: 5, description: 'Power loss per phase', formula: `P = I² × R = ${I}² × ${avg.toFixed(1)}e-6 = ${pLoss.toFixed(2)} W`, result: `${pLoss.toFixed(2)} W per phase` },
      ],
      standardRef: { standard: 'IEC 62271-100 / IEEE C37.09', clause: '6.4', title: 'High-voltage alternating-current circuit-breakers' },
    };
    setResult(res);
    addCalculation({ type: 'hv-contact-resistance', title: `HV Contact Resistance — Avg ${avg.toFixed(1)} μΩ`, inputs: { current, r1, r2, r3, component }, results: res, notes: '', standard: 'IEC 62271-100' });
  };

  return (
    <div>
      <div style={{ marginBottom: 12, padding: '10px 14px', background: '#DC262618', border: '1px solid #DC262640', borderRadius: 8, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
        ⚡ LOTO mandatory. Micro-ohmmeter (Ductor) test using 100A or 200A DC. Connections: 4-wire Kelvin method for accuracy.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SectionLabel title="Test Configuration" />
          <SelectInput label="Component Under Test" value={component} onChange={setComponent} options={[
            { value: 'main-contacts', label: 'VCB Main Contacts (≤60 μΩ)' },
            { value: 'earth-switch',  label: 'Earth Switch Contacts (≤150 μΩ)' },
            { value: 'busbar-joint',  label: 'Busbar Joints / Connections (≤10 μΩ)' },
            { value: 'cable-lug',     label: 'Cable Lug / Termination (≤20 μΩ)' },
          ]} tooltip="Each component has a different acceptance limit per IEC 62271" />
          <TextInput label="Test Current" value={current} onChange={setCurrent} unit="A DC" tooltip="Micro-ohmmeter test current — typically 100A or 200A DC" />
          <SectionLabel title="Measured Resistance (μΩ)" />
          <FieldRow cols="1fr 1fr 1fr">
            <TextInput label="R Phase" value={r1} onChange={setR1} unit="μΩ" />
            <TextInput label="Y Phase" value={r2} onChange={setR2} unit="μΩ" />
            <TextInput label="B Phase" value={r3} onChange={setR3} unit="μΩ" />
          </FieldRow>
          <CalcButton onClick={calculate} label="Evaluate Contact Resistance" icon={Zap} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── CB TIMING TEST ────────────────────────────────────────────────────────────
function CBTimingTest() {
  const { addCalculation } = useStore();
  const [o1, setO1] = useState('48'); const [o2, setO2] = useState('50'); const [o3, setO3] = useState('47');
  const [c1, setC1] = useState('68'); const [c2, setC2] = useState('72'); const [c3, setC3] = useState('70');
  const [bounce, setBounce] = useState('1.2');
  const [cbType, setCbType] = useState('vcb');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const O1 = parseFloat(o1); const O2 = parseFloat(o2); const O3 = parseFloat(o3);
    const C1 = parseFloat(c1); const C2 = parseFloat(c2); const C3 = parseFloat(c3);
    const B = parseFloat(bounce);
    const avgOpen = (O1 + O2 + O3) / 3;
    const avgClose = (C1 + C2 + C3) / 3;
    const openDisc = Math.max(O1, O2, O3) - Math.min(O1, O2, O3);
    const closeDisc = Math.max(C1, C2, C3) - Math.min(C1, C2, C3);

    const limits = cbType === 'vcb'
      ? { openMin: 30, openMax: 80, closeMin: 50, closeMax: 120, discMax: 3, bounceMax: 2 }
      : { openMin: 25, openMax: 70, closeMin: 40, closeMax: 100, discMax: 3, bounceMax: 3 };

    const openOK  = avgOpen  >= limits.openMin  && avgOpen  <= limits.openMax;
    const closeOK = avgClose >= limits.closeMin && avgClose <= limits.closeMax;
    const odiscOK = openDisc <= limits.discMax;
    const cdiscOK = closeDisc <= limits.discMax;
    const bounceOK = B <= limits.bounceMax;

    const res: CalculationResult = {
      values: [
        { label: 'Avg Open Time',    value: avgOpen.toFixed(1),   unit: 'ms', highlight: true, status: openOK  ? 'PASS' : 'FAIL' },
        { label: 'Avg Close Time',   value: avgClose.toFixed(1),  unit: 'ms', highlight: true, status: closeOK ? 'PASS' : 'FAIL' },
        { label: 'Open Pole Discrepancy',  value: openDisc.toFixed(1),  unit: 'ms', status: odiscOK ? 'PASS' : 'FAIL' },
        { label: 'Close Pole Discrepancy', value: closeDisc.toFixed(1), unit: 'ms', status: cdiscOK ? 'PASS' : 'FAIL' },
        { label: 'Contact Bounce',   value: B.toString(),         unit: 'ms', status: bounceOK ? 'PASS' : 'WARNING' },
        { label: 'Open Limit Range', value: `${limits.openMin}–${limits.openMax}`, unit: 'ms' },
        { label: 'Close Limit Range', value: `${limits.closeMin}–${limits.closeMax}`, unit: 'ms' },
      ],
      status: openOK && closeOK && odiscOK && cdiscOK && bounceOK ? 'PASS' : 'FAIL',
      recommendation: `${openOK && closeOK && odiscOK && cdiscOK ? '✔ CB TIMING ACCEPTABLE' : '✘ TIMING OUTSIDE LIMITS — ADJUST OR OVERHAUL'}. Open=${avgOpen.toFixed(1)}ms, Close=${avgClose.toFixed(1)}ms. ${!odiscOK || !cdiscOK ? 'Pole discrepancy exceeds 3ms — check dashpot, mechanism spring or worn linkages. Significant discrepancy causes asymmetric current interruption which stresses the vacuum bottles.' : ''} ${!openOK ? `Open time ${avgOpen.toFixed(1)}ms outside ${limits.openMin}–${limits.openMax}ms. Check charging spring condition and dashpot adjustment.` : ''} ${!closeOK ? `Close time ${avgClose.toFixed(1)}ms outside ${limits.closeMin}–${limits.closeMax}ms. Check close spring and mechanism.` : ''}`,
      formula: 'Avg = (T1+T2+T3)/3  ·  Discrepancy = Tmax−Tmin  ·  Limits per IEC 62271-100',
      steps: [
        { step: 1, description: 'Average opening time (3-phase)', formula: `(${O1}+${O2}+${O3})/3 = ${avgOpen.toFixed(1)} ms`, result: `${avgOpen.toFixed(1)} ms (${limits.openMin}–${limits.openMax} ms) → ${openOK ? 'PASS' : 'FAIL'}` },
        { step: 2, description: 'Open pole discrepancy', formula: `max(${O1},${O2},${O3}) − min = ${Math.max(O1,O2,O3)}−${Math.min(O1,O2,O3)} = ${openDisc.toFixed(1)} ms`, result: `${openDisc.toFixed(1)} ms (max ${limits.discMax} ms) → ${odiscOK ? 'PASS' : 'FAIL'}` },
        { step: 3, description: 'Average closing time (3-phase)', formula: `(${C1}+${C2}+${C3})/3 = ${avgClose.toFixed(1)} ms`, result: `${avgClose.toFixed(1)} ms (${limits.closeMin}–${limits.closeMax} ms) → ${closeOK ? 'PASS' : 'FAIL'}` },
        { step: 4, description: 'Close pole discrepancy', formula: `max−min = ${Math.max(C1,C2,C3)}−${Math.min(C1,C2,C3)} = ${closeDisc.toFixed(1)} ms`, result: `${closeDisc.toFixed(1)} ms → ${cdiscOK ? 'PASS' : 'FAIL'}` },
        { step: 5, description: 'Contact bounce', formula: `Bounce = ${B} ms (max ${limits.bounceMax} ms)`, result: `${bounceOK ? 'PASS' : 'EXCEEDS LIMIT — rebound may cause re-strike'}` },
      ],
      standardRef: { standard: 'IEC 62271-100', clause: '6.102', title: 'High-voltage alternating-current circuit-breakers — Test procedures' },
    };
    setResult(res);
    addCalculation({ type: 'hv-cb-timing', title: `CB Timing — Open ${avgOpen.toFixed(1)}ms, Close ${avgClose.toFixed(1)}ms`, inputs: { o1, o2, o3, c1, c2, c3, bounce, cbType }, results: res, notes: '', standard: 'IEC 62271-100' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SelectInput label="Circuit Breaker Type" value={cbType} onChange={setCbType} options={[
            { value: 'vcb', label: 'Vacuum Circuit Breaker (VCB)' },
            { value: 'sf6', label: 'SF6 Gas Circuit Breaker (GCB)' },
          ]} tooltip="Limits differ slightly between VCB and SF6 breakers" />
          <SectionLabel title="Opening Times (ms)" />
          <FieldRow cols="1fr 1fr 1fr">
            <TextInput label="R Phase" value={o1} onChange={setO1} unit="ms" />
            <TextInput label="Y Phase" value={o2} onChange={setO2} unit="ms" />
            <TextInput label="B Phase" value={o3} onChange={setO3} unit="ms" />
          </FieldRow>
          <SectionLabel title="Closing Times (ms)" />
          <FieldRow cols="1fr 1fr 1fr">
            <TextInput label="R Phase" value={c1} onChange={setC1} unit="ms" />
            <TextInput label="Y Phase" value={c2} onChange={setC2} unit="ms" />
            <TextInput label="B Phase" value={c3} onChange={setC3} unit="ms" />
          </FieldRow>
          <TextInput label="Contact Bounce Time" value={bounce} onChange={setBounce} unit="ms" tooltip="Bounce time from timing analyser trace — max 2 ms for VCB" />
          <CalcButton onClick={calculate} label="Evaluate CB Timing" icon={Clock} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── EARTH RESISTANCE TEST ─────────────────────────────────────────────────────
function EarthResistanceTest() {
  const { addCalculation } = useStore();
  const [volt, setVolt] = useState('25.4');
  const [curr, setCurr] = useState('12.5');
  const [soilRes, setSoilRes] = useState('50');
  const [faultCurr, setFaultCurr] = useState('1000');
  const [duration, setDuration] = useState('1.0');
  const [appType, setAppType] = useState('substation');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const V = parseFloat(volt); const I = parseFloat(curr);
    const ρs = parseFloat(soilRes); const If = parseFloat(faultCurr); const t = parseFloat(duration);
    const R = V / I;
    const limits: Record<string, number> = { substation: 1, generation: 0.5, building: 5, general: 10 };
    const limit = limits[appType] ?? 1;
    const rOK = R <= limit;
    // Touch & step voltage (IEEE 80 simplified)
    const Cs = 0.96; // surface layer derating factor (no surface layer)
    const ks = 0.116 / Math.sqrt(t); // body current factor 50kg person
    const vTouch = (1000 + 1.5 * ρs * Cs) * ks;
    const vStep  = (1000 + 6.0 * ρs * Cs) * ks;
    const actualTouch = R * If;

    const res: CalculationResult = {
      values: [
        { label: 'Measured Earth Resistance', value: R.toFixed(3), unit: 'Ω', highlight: true, status: rOK ? 'PASS' : 'FAIL' },
        { label: 'Acceptance Limit', value: limit.toString(), unit: 'Ω' },
        { label: 'Test Voltage', value: volt, unit: 'V' },
        { label: 'Test Current', value: curr, unit: 'A' },
        { label: 'Permissible Touch Voltage', value: vTouch.toFixed(1), unit: 'V', status: actualTouch <= vTouch ? 'PASS' : 'FAIL' },
        { label: 'Permissible Step Voltage', value: vStep.toFixed(1), unit: 'V' },
        { label: 'Actual Touch Voltage (If×R)', value: actualTouch.toFixed(1), unit: 'V', status: actualTouch <= vTouch ? 'PASS' : 'FAIL' },
      ],
      status: rOK && actualTouch <= vTouch ? 'PASS' : 'FAIL',
      recommendation: `Earth resistance R = ${R.toFixed(3)} Ω. Limit for ${appType}: ${limit} Ω → ${rOK ? 'PASS' : 'FAIL'}. Touch voltage = ${actualTouch.toFixed(1)} V (permissible: ${vTouch.toFixed(1)} V) → ${actualTouch <= vTouch ? 'PASS' : 'FAIL'}. ${!rOK ? 'Augment earthing: add more earth rods in parallel, use bentonite/chemrod treatment, extend earth mat.' : 'Earth system adequate for fault current dissipation.'}`,
      formula: 'R = V/I  ·  Vtouch_max = (1000+1.5ρs)×0.116/√t  ·  Vstep_max = (1000+6ρs)×0.116/√t',
      steps: [
        { step: 1, description: 'Fall-of-potential method (IEEE 81)', formula: `R = V/I = ${V}/${I}`, result: `R = ${R.toFixed(3)} Ω (limit ${limit} Ω for ${appType}) → ${rOK ? 'PASS' : 'FAIL'}` },
        { step: 2, description: 'Body current factor (50kg, 50Hz)', formula: `Ks = 0.116/√t = 0.116/√${t} = ${ks.toFixed(4)}`, result: `Ks = ${ks.toFixed(4)} A (fault duration ${t} s)` },
        { step: 3, description: 'Permissible touch voltage (IEEE 80)', formula: `Vt = (1000+1.5×${ρs}×${Cs})×${ks.toFixed(4)}`, result: `Permissible Vt = ${vTouch.toFixed(1)} V` },
        { step: 4, description: 'Permissible step voltage', formula: `Vs = (1000+6×${ρs}×${Cs})×${ks.toFixed(4)}`, result: `Permissible Vs = ${vStep.toFixed(1)} V` },
        { step: 5, description: 'Actual touch voltage at fault current', formula: `Vt_actual = R × If = ${R.toFixed(3)} × ${If} = ${actualTouch.toFixed(1)} V`, result: `${actualTouch.toFixed(1)} V ${actualTouch <= vTouch ? '≤' : '>'} ${vTouch.toFixed(1)} V → ${actualTouch <= vTouch ? 'PASS' : 'FAIL'}` },
      ],
      standardRef: { standard: 'IEEE 80-2013 / IEEE 81', clause: '15', title: 'Guide for Safety in AC Substation Grounding' },
    };
    setResult(res);
    addCalculation({ type: 'hv-earth-test', title: `Earth Test — R=${R.toFixed(3)} Ω`, inputs: { volt, curr, soilRes, faultCurr, duration, appType }, results: res, notes: '', standard: 'IEEE 80 / IEEE 81' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SelectInput label="Installation Type" value={appType} onChange={setAppType} options={[
            { value: 'substation',  label: 'HV Substation (≤1 Ω)' },
            { value: 'generation', label: 'Generating Station (≤0.5 Ω)' },
            { value: 'building',   label: 'Commercial Building (≤5 Ω)' },
            { value: 'general',    label: 'General LV (≤10 Ω)' },
          ]} tooltip="Acceptance limit varies by installation type per IEEE 80 and IS 3043" />
          <SectionLabel title="Fall-of-Potential Test Readings (IEEE 81)" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Measured Voltage" value={volt} onChange={setVolt} unit="V" tooltip="Voltage measured between earth electrode and potential probe" />
            <TextInput label="Test Current" value={curr} onChange={setCurr} unit="A" tooltip="Current injected between current probe and earth electrode" />
          </FieldRow>
          <SectionLabel title="Touch/Step Voltage Analysis (IEEE 80)" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Soil Resistivity" value={soilRes} onChange={setSoilRes} unit="Ω·m" tooltip="Measured or assumed soil resistivity (Wenner method)" />
            <TextInput label="Max Fault Current" value={faultCurr} onChange={setFaultCurr} unit="A" tooltip="Maximum earth fault current from protection study" />
          </FieldRow>
          <TextInput label="Fault Clearing Time" value={duration} onChange={setDuration} unit="s" tooltip="Relay + breaker operating time for fault clearance" />
          <CalcButton onClick={calculate} label="Evaluate Earth System" icon={Globe} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── SF6 GAS TEST ──────────────────────────────────────────────────────────────
function SF6Test() {
  const { addCalculation } = useStore();
  const [pressure, setPressure] = useState('0.52');
  const [temp, setTemp] = useState('35');
  const [rated, setRated] = useState('0.50');
  const [moisture, setMoisture] = useState('80');
  const [purity, setPurity] = useState('98.5');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const P = parseFloat(pressure); const T = parseFloat(temp);
    const Pr = parseFloat(rated); const M = parseFloat(moisture); const Pu = parseFloat(purity);
    // Correct pressure to 20°C using Gay-Lussac law: P1/T1 = P2/T2 (absolute)
    const P20 = P * (293.15 / (273.15 + T));
    const alarm = Pr * 0.90; const lockout = Pr * 0.85;
    const pressOK = P20 >= alarm;
    const moistOK = M <= 150; // IEC 62271-100: < 150 ppm new, < 500 ppm in-service
    const moistInService = M <= 500;
    const purityOK = Pu >= 99.8; // New gas; in-service ≥ 97%
    const purityInService = Pu >= 97.0;

    const res: CalculationResult = {
      values: [
        { label: 'Measured Pressure', value: P.toString(), unit: 'MPa (abs)' },
        { label: 'Corrected to 20°C', value: P20.toFixed(3), unit: 'MPa (abs)', highlight: true, status: pressOK ? 'PASS' : 'FAIL' },
        { label: 'Alarm Level (90%)', value: alarm.toFixed(3), unit: 'MPa (abs)' },
        { label: 'Lockout Level (85%)', value: lockout.toFixed(3), unit: 'MPa (abs)' },
        { label: 'Moisture Content', value: M.toString(), unit: 'ppm v/v', status: moistOK ? 'PASS' : moistInService ? 'WARNING' : 'FAIL' },
        { label: 'Gas Purity', value: `${Pu}%`, unit: '', status: purityOK ? 'PASS' : purityInService ? 'WARNING' : 'FAIL' },
      ],
      status: pressOK && moistInService && purityInService ? 'PASS' : 'FAIL',
      recommendation: `SF6 pressure @ 20°C = ${P20.toFixed(3)} MPa (rated ${Pr} MPa, alarm ${alarm.toFixed(3)} MPa, lockout ${lockout.toFixed(3)} MPa). ${!pressOK ? '⚠ PRESSURE BELOW ALARM — DO NOT OPERATE. Locate and repair leakage. Refill with certified SF6 per IEC 60376.' : 'Pressure acceptable.'} Moisture ${M} ppm: ${moistOK ? 'New gas acceptable' : moistInService ? 'Marginally acceptable (in-service max 500 ppm) — monitor closely' : 'EXCEEDS LIMIT — Moisture reduces dielectric strength. Replace or reclaim gas.'}. Purity ${Pu}%: ${purityOK ? 'New gas acceptable' : purityInService ? 'Acceptable for service (min 97%)' : 'BELOW LIMIT — Reclaim and replace gas'}.`,
      formula: 'P_20°C = P_meas × 293.15/(273.15+T)  ·  Alarm = 0.90 × Prated  ·  Lockout = 0.85 × Prated',
      steps: [
        { step: 1, description: 'Temperature-correct pressure to 20°C reference', formula: `P20 = ${P} × 293.15/(273.15+${T}) = ${P} × ${(293.15/(273.15+T)).toFixed(4)}`, result: `P20 = ${P20.toFixed(3)} MPa (abs)` },
        { step: 2, description: 'Compare with alarm and lockout levels', formula: `Alarm = 0.90 × ${Pr} = ${alarm.toFixed(3)} MPa, Lockout = 0.85 × ${Pr} = ${lockout.toFixed(3)} MPa`, result: `P20 = ${P20.toFixed(3)} ${P20 >= alarm ? '≥' : '<'} ${alarm.toFixed(3)} → ${P20 >= alarm ? 'OK' : 'ALARM'}` },
        { step: 3, description: 'Moisture assessment (IEC 62271-100 Annex B)', formula: `Limit: 150 ppm (new), 500 ppm (in-service)`, result: `${M} ppm → ${moistOK ? 'PASS (new gas OK)' : moistInService ? 'WARNING (in-service marginal)' : 'FAIL'}` },
        { step: 4, description: 'Gas purity check (IEC 60376)', formula: `Limit: 99.8% (new), 97.0% (in-service)`, result: `${Pu}% → ${purityOK ? 'PASS' : purityInService ? 'ACCEPTABLE IN-SERVICE' : 'FAIL — RECLAIM'}` },
      ],
      standardRef: { standard: 'IEC 62271-100 / IEC 60376', clause: 'Annex B', title: 'SF6 gas analysis for circuit-breakers' },
    };
    setResult(res);
    addCalculation({ type: 'hv-sf6-test', title: `SF6 Gas Test — P20=${P20.toFixed(3)} MPa, ${M} ppm`, inputs: { pressure, temp, rated, moisture, purity }, results: res, notes: '', standard: 'IEC 62271-100' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SectionLabel title="SF6 Gas Pressure" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Rated Filling Pressure" value={rated} onChange={setRated} unit="MPa abs" tooltip="Manufacturer rated filling pressure at 20°C (typically 0.4–0.6 MPa abs)" />
            <TextInput label="Measured Pressure" value={pressure} onChange={setPressure} unit="MPa abs" tooltip="Absolute gauge reading at current ambient temperature" />
          </FieldRow>
          <TextInput label="Ambient Temperature" value={temp} onChange={setTemp} unit="°C" tooltip="Temperature at time of pressure measurement — used for Gay-Lussac correction to 20°C" />
          <SectionLabel title="Gas Quality Analysis" />
          <TextInput label="Moisture Content" value={moisture} onChange={setMoisture} unit="ppm v/v" tooltip="Measured by dew-point meter. Limit: 150 ppm new, 500 ppm in-service (IEC 62271-100)" />
          <TextInput label="SF6 Gas Purity" value={purity} onChange={setPurity} unit="%" tooltip="Min 99.8% new gas (IEC 60376). Min 97% in-service. Measured by gas analyser." />
          <CalcButton onClick={calculate} label="Analyse SF6 Gas" icon={Wind} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── IDMT RELAY TEST ───────────────────────────────────────────────────────────
function IDMTRelayTest() {
  const { addCalculation } = useStore();
  const [ctRatio, setCtRatio] = useState('400');
  const [ps, setPs] = useState('0.8');
  const [tms, setTms] = useState('0.3');
  const [curve, setCurve] = useState('SI');
  const [faultCurr, setFaultCurr] = useState('3200');
  const [injectCurr, setInjectCurr] = useState('48');
  const [measTime, setMeasTime] = useState('1.42');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const CTp = parseFloat(ctRatio); const PS = parseFloat(ps);
    const TMS = parseFloat(tms); const If = parseFloat(faultCurr);
    const Ij = parseFloat(injectCurr); const tm = parseFloat(measTime);
    // Plug setting current (primary)
    const Is_primary = CTp * PS;
    // Multiplier M for fault current
    const M_fault = If / Is_primary;
    const M_inject = (Ij / 5) / PS; // secondary injection: 5A CT, PS in secondary terms
    // Trip time calculations
    const calcTime = (M: number): number => {
      if (M <= 1) return Infinity;
      switch (curve) {
        case 'SI':  return TMS * 0.14 / (Math.pow(M, 0.02) - 1);
        case 'VI':  return TMS * 13.5 / (M - 1);
        case 'EI':  return TMS * 80 / (M * M - 1);
        case 'LTI': return TMS * 120 / (M - 1);
        case 'MI':  return TMS * (0.0515 / (Math.pow(M, 0.02) - 1) + 0.114);
        default:    return TMS * 0.14 / (Math.pow(M, 0.02) - 1);
      }
    };
    const calcTime_fault = calcTime(M_fault);
    const calcTime_inject = calcTime(M_inject);
    const timingError = Math.abs(tm - calcTime_inject) / calcTime_inject * 100;
    const timeOK = timingError <= 5; // ±5% or ±0.05s whichever is greater

    const res: CalculationResult = {
      values: [
        { label: 'Plug Setting Current (primary)', value: Is_primary.toFixed(0), unit: 'A', highlight: true },
        { label: 'Fault Current Multiplier (M)', value: M_fault.toFixed(2), unit: '× Is' },
        { label: 'Calculated Trip Time (fault)', value: calcTime_fault.toFixed(3), unit: 's', highlight: true },
        { label: 'Injection Multiplier', value: M_inject.toFixed(2), unit: '× Is' },
        { label: 'Calculated Time (at injection)', value: calcTime_inject.toFixed(3), unit: 's' },
        { label: 'Measured Trip Time', value: tm.toString(), unit: 's' },
        { label: 'Timing Error', value: `${timingError.toFixed(1)}%`, unit: '', status: timeOK ? 'PASS' : 'FAIL' },
      ],
      status: timeOK ? 'PASS' : 'FAIL',
      recommendation: `Relay set: PS=${PS} (${Is_primary.toFixed(0)} A primary), TMS=${TMS}, Curve=${curve}. At fault current ${If} A (M=${M_fault.toFixed(2)}×): relay should trip in ${calcTime_fault.toFixed(3)} s. Injection test: ${timingError.toFixed(1)}% error ${timeOK ? '✔ within ±5% tolerance' : '✘ EXCEEDS ±5% — relay calibration suspect, contact manufacturer for recalibration'}.`,
      formula: curve === 'SI' ? 't = TMS × 0.14 / (M^0.02 − 1)' : curve === 'VI' ? 't = TMS × 13.5 / (M − 1)' : curve === 'EI' ? 't = TMS × 80 / (M² − 1)' : 't = TMS × 120 / (M − 1)',
      steps: [
        { step: 1, description: 'Plug setting current (primary)', formula: `Is = CT_ratio × PS = ${CTp} × ${PS} = ${Is_primary.toFixed(0)} A`, result: `${Is_primary.toFixed(0)} A primary (${PS * 5} A secondary)` },
        { step: 2, description: 'Fault current multiplier', formula: `M = I_fault / Is = ${If} / ${Is_primary.toFixed(0)} = ${M_fault.toFixed(2)}`, result: `M = ${M_fault.toFixed(2)}` },
        { step: 3, description: `Calculated trip time at fault (${curve})`, formula: calcTime_fault.toFixed(3) + ' s', result: `${calcTime_fault.toFixed(3)} s at ${If} A fault` },
        { step: 4, description: 'Injection test multiplier (5A CT secondary basis)', formula: `M_inj = (${Ij}/5)/${PS} = ${M_inject.toFixed(2)}`, result: `Calculated time = ${calcTime_inject.toFixed(3)} s` },
        { step: 5, description: 'Measured vs calculated timing error', formula: `Error = |${tm} − ${calcTime_inject.toFixed(3)}| / ${calcTime_inject.toFixed(3)} × 100%`, result: `${timingError.toFixed(1)}% ${timeOK ? '≤ 5% → PASS' : '> 5% → FAIL'}` },
      ],
      standardRef: { standard: 'IEC 60255-151 / IEEE C37.112', clause: '6', title: 'Measuring relays and protection equipment — IDMT overcurrent protection' },
    };
    setResult(res);
    addCalculation({ type: 'hv-relay-test', title: `IDMT Relay Test — ${curve}, TMS=${tms}, PS=${ps}`, inputs: { ctRatio, ps, tms, curve, faultCurr, injectCurr, measTime }, results: res, notes: '', standard: 'IEC 60255-151' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SectionLabel title="Relay Settings" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="CT Primary Ratio" value={ctRatio} onChange={setCtRatio} unit="A/5A" tooltip="CT primary current (denominator is always 5A for this calculation)" />
            <TextInput label="Plug Setting (PS)" value={ps} onChange={setPs} unit="× In" min={0.1} max={1.0} step={0.05} tooltip="Plug setting as multiplier of 5A secondary nominal (0.1 to 1.0)" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="TMS (Time Multiplier Setting)" value={tms} onChange={setTms} unit="" min={0.025} max={1.0} step={0.025} tooltip="Time multiplier setting 0.025–1.0" />
            <SelectInput label="IDMT Curve Type" value={curve} onChange={setCurve} options={[
              { value: 'SI',  label: 'Standard Inverse (SI) — IEC' },
              { value: 'VI',  label: 'Very Inverse (VI) — IEC' },
              { value: 'EI',  label: 'Extremely Inverse (EI) — IEC' },
              { value: 'LTI', label: 'Long Time Inverse (LTI) — IEC' },
              { value: 'MI',  label: 'Moderately Inverse (MI) — IEEE' },
            ]} />
          </FieldRow>
          <TextInput label="Maximum Fault Current (primary)" value={faultCurr} onChange={setFaultCurr} unit="A" tooltip="3-phase fault current at relay location (from fault study)" />
          <SectionLabel title="Secondary Injection Test Data" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Injected Secondary Current" value={injectCurr} onChange={setInjectCurr} unit="A" tooltip="Current injected during secondary injection test (5A base)" />
            <TextInput label="Measured Trip Time" value={measTime} onChange={setMeasTime} unit="s" tooltip="Actual time measured by test set — compare with calculated" />
          </FieldRow>
          <CalcButton onClick={calculate} label="Verify IDMT Relay" icon={Radio} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── CT TEST ───────────────────────────────────────────────────────────────────
function CTTest() {
  const { addCalculation } = useStore();
  const [nomRatio, setNomRatio] = useState('400');
  const [primCurr, setPrimCurr] = useState('200');
  const [secCurr, setSecCurr] = useState('2.490');
  const [burden, setBurden] = useState('7.5');
  const [accClass, setAccClass] = useState('5P20');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const Nr = parseFloat(nomRatio); const Ip = parseFloat(primCurr);
    const Is = parseFloat(secCurr); const B = parseFloat(burden);
    // Actual ratio = Ip / Is (but Is is for 5A CT, so multiply by 5)
    const actualRatio = Ip / Is;
    const ratioError = ((actualRatio - Nr) / Nr) * 100;
    const errorLimit: Record<string, number> = { '5P10': 1.0, '5P20': 1.0, '1': 1.0, '0.5': 0.5, '0.2': 0.2, '0.1': 0.1 };
    const limit = errorLimit[accClass] ?? 1.0;
    const ratioOK = Math.abs(ratioError) <= limit;
    const nomBurden: Record<string, number> = { '5P10': 15, '5P20': 15, '1': 30, '0.5': 15, '0.2': 10, '0.1': 5 };
    const bnominal = nomBurden[accClass] ?? 15;
    const burdenOK = B <= bnominal;

    const res: CalculationResult = {
      values: [
        { label: 'Nominal CT Ratio', value: `${Nr}/5`, unit: 'A/A' },
        { label: 'Actual Measured Ratio', value: `${actualRatio.toFixed(1)}/5`, unit: 'A/A' },
        { label: 'Ratio Error', value: `${ratioError > 0 ? '+' : ''}${ratioError.toFixed(3)}%`, unit: '', highlight: true, status: ratioOK ? 'PASS' : 'FAIL' },
        { label: 'Accuracy Class Limit', value: `±${limit}%`, unit: '', status: ratioOK ? 'PASS' : 'FAIL' },
        { label: 'Connected Burden', value: B.toString(), unit: 'VA', status: burdenOK ? 'PASS' : 'WARNING' },
        { label: 'Nominal Burden', value: `${bnominal}`, unit: 'VA' },
        { label: 'Accuracy Class', value: accClass, unit: '' },
      ],
      status: ratioOK && burdenOK ? 'PASS' : ratioOK ? 'WARNING' : 'FAIL',
      recommendation: `CT Ratio error = ${ratioError.toFixed(3)}% (limit ±${limit}% for class ${accClass}) → ${ratioOK ? 'PASS' : 'FAIL'}. Burden ${B} VA vs nominal ${bnominal} VA → ${burdenOK ? 'OK' : 'EXCEEDS NOMINAL — accuracy not guaranteed at this burden. Reduce burden by using shorter leads or lower impedance relays.'} ${!ratioOK ? 'CT ratio error exceeds limit — check for shorted turns, insulation damage, or incorrect connections. Consider CT replacement.' : ''}`,
      formula: 'Ratio Error (%) = (N_actual − N_nominal) / N_nominal × 100',
      steps: [
        { step: 1, description: 'Actual transformation ratio', formula: `N_actual = I_primary / I_secondary = ${Ip} / ${Is} = ${actualRatio.toFixed(1)}`, result: `${actualRatio.toFixed(1)}` },
        { step: 2, description: 'Ratio error calculation', formula: `ε = (${actualRatio.toFixed(1)} − ${Nr}) / ${Nr} × 100`, result: `${ratioError > 0 ? '+' : ''}${ratioError.toFixed(3)}% (limit ±${limit}%) → ${ratioOK ? 'PASS' : 'FAIL'}` },
        { step: 3, description: 'Connected burden vs nominal burden', formula: `${B} VA vs ${bnominal} VA nominal for class ${accClass}`, result: `${burdenOK ? 'Burden within nominal — accuracy maintained' : 'Burden exceeds nominal — accuracy class NOT guaranteed'}` },
      ],
      standardRef: { standard: 'IEC 61869-2', clause: '5.6', title: 'Additional requirements for current transformers' },
    };
    setResult(res);
    addCalculation({ type: 'hv-ct-test', title: `CT Test — ${nomRatio}/5A, Error=${ratioError.toFixed(2)}%`, inputs: { nomRatio, primCurr, secCurr, burden, accClass }, results: res, notes: '', standard: 'IEC 61869-2' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <InputPanel>
          <SectionLabel title="CT Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Nominal CT Ratio (Primary)" value={nomRatio} onChange={setNomRatio} unit="A/5A" tooltip="Nameplate CT ratio primary amps (secondary always 5A)" />
            <SelectInput label="Accuracy Class" value={accClass} onChange={setAccClass} options={[
              { value: '5P10',  label: '5P10 — Protection (10× ALF)' },
              { value: '5P20',  label: '5P20 — Protection (20× ALF)' },
              { value: '1',     label: 'Class 1 — Metering' },
              { value: '0.5',   label: 'Class 0.5 — Metering' },
              { value: '0.2',   label: 'Class 0.2 — Revenue Metering' },
            ]} />
          </FieldRow>
          <TextInput label="Connected Burden" value={burden} onChange={setBurden} unit="VA" tooltip="Total VA burden of leads + relay + meter at secondary terminals" />
          <SectionLabel title="Ratio Test Readings" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Applied Primary Current" value={primCurr} onChange={setPrimCurr} unit="A" tooltip="Primary current applied during ratio test" />
            <TextInput label="Measured Secondary Current" value={secCurr} onChange={setSecCurr} unit="A" tooltip="Secondary current measured with precision ammeter" />
          </FieldRow>
          <CalcButton onClick={calculate} label="Evaluate CT Performance" icon={BarChart3} accentColor={ACCENT} />
        </InputPanel>
        <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      </div>
      {result && lm && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function HVTesting() {
  const [tab, setTab] = useState<TestTab>('ir');
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Activity} title="11kV HV TESTING MODULE" subtitle="IEC 62271-100 · IEEE 43 · IEEE 81 · IEC 61869 · IEC 60255 · NFPA 70B" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => {
          const rows = [
            ['Insulation Resistance', 'Megger / IR Tester', 'Min 1000 MΩ (new), Min 100 MΩ (service)', 'IEEE 43 · IEC 60085'],
            ['Contact Resistance', 'Micro-ohmmeter (DLRO)', 'Max 50–100 μΩ per manufacturer', 'IEC 62271-100 · IEEE C37.09'],
            ['CB Timing Test', 'CB Analyser', 'Close: <80 ms, Open: <60 ms, Spread: <5 ms', 'IEC 62271-100'],
            ['Earth Resistance', 'Earth Tester (Fall-of-Potential)', 'Max 1 Ω (HV substation)', 'IEEE 81 · IS 3043'],
            ['SF6 Gas Analysis', 'SF6 Gas Analyser', 'Purity >98%, Moisture <200 ppmv', 'IEC 60480 · IEC 60376'],
            ['IDMT Relay Test', 'Secondary Injection Test Set', 'Trip time within ±5% of TCC curve', 'IEC 60255-151 · IEEE C37.112'],
            ['CT / PT Test', 'CT Analyser / Turns Ratio Meter', 'Ratio error <0.5%, Phase error <30 min', 'IEC 61869-2 · IEEE C57.13'],
          ];
          const body = `<h2>HV Test Procedures Reference</h2>${tableHTML(['Test Procedure','Equipment Required','Acceptance Criteria','Standards'], rows)}
<h2>General Testing Requirements</h2>
<p>All HV testing must be conducted by competent persons as per IEC 60900 and NFPA 70E. Ensure equipment is isolated and earthed (LOTO) before any maintenance or testing activities. Test results must be recorded and compared against OEM values and previous test records for trend analysis.</p>`;
          downloadReport('11kV HV Testing Module — Reference Report','Test Procedures, Equipment & Acceptance Criteria','IEC 62271-100 · IEEE 43 · IEEE 81 · IEC 61869 · IEC 60255 · NFPA 70B', body, 'HV-Testing-Reference.pdf');
        }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', background: V.surf, borderRadius: 10, padding: 6, border: `1px solid ${V.brdM}` }}>
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7,
              background: isActive ? ACCENT : 'transparent',
              color: isActive ? '#fff' : V.sec,
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 500,
              transition: 'all 0.15s',
            }}>
              <t.icon style={{ width: 13, height: 13 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Active Test */}
      {tab === 'ir'      && <IRTest />}
      {tab === 'contact' && <ContactResistanceTest />}
      {tab === 'timing'  && <CBTimingTest />}
      {tab === 'earth'   && <EarthResistanceTest />}
      {tab === 'sf6'     && <SF6Test />}
      {tab === 'relay'   && <IDMTRelayTest />}
      {tab === 'ct'      && <CTTest />}
    </div>
  );
}
