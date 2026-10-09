import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#0369A1';

// IEC 60898-1 standard current ratings
const MCB_RATINGS = [1, 2, 3, 4, 6, 8, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

// Breaking capacity classes per IEC 60898-1 (kA)
const ICU_CLASSES: Record<string, number> = {
  '3kA (In≤25A)': 3,
  '6kA — Class 1': 6,
  '10kA — Class 2': 10,
  '15kA — Class 3': 15,
  '25kA — Class H': 25,
};

// MCB curve types with instantaneous trip ranges
const CURVE_DATA: Record<string, { low: number; high: number; desc: string; use: string }> = {
  B: { low:  3, high:  5, desc: 'Trip at 3–5× Iₙ',  use: 'Resistive loads, lighting, long cables with low inrush' },
  C: { low:  5, high: 10, desc: 'Trip at 5–10× Iₙ', use: 'General loads, motors with low-medium inrush, fluorescent lighting' },
  D: { low: 10, high: 20, desc: 'Trip at 10–20× Iₙ', use: 'High-inrush loads: transformers, motor starters, solenoids, X-ray equipment' },
  K: { low:  8, high: 12, desc: 'Trip at 8–12× Iₙ',  use: 'Motor circuits (IEC 60947-2 alternative); inductive and resistive mixed loads' },
  Z: { low:  2, high:  3, desc: 'Trip at 2–3× Iₙ',   use: 'Semiconductor protection, sensitive electronic equipment' },
};

type CurveType = 'B' | 'C' | 'D' | 'K' | 'Z';
type CircuitType = 'lighting' | 'socket' | 'motor' | 'hvac' | 'welder' | 'general';

const CIRCUIT_DEFAULTS: Record<CircuitType, { curve: CurveType; factor: number; note: string }> = {
  lighting: { curve: 'B', factor: 1.0,  note: 'Lighting circuits — low inrush, use Curve B' },
  socket:   { curve: 'B', factor: 1.0,  note: 'Socket outlet circuits — general purpose, Curve B' },
  motor:    { curve: 'D', factor: 1.25, note: 'Motor — high starting inrush; 1.25× FLC factor per IEC 60364-4-43' },
  hvac:     { curve: 'C', factor: 1.15, note: 'HVAC — moderate inrush, Curve C' },
  welder:   { curve: 'D', factor: 1.5,  note: 'Welding equipment — very high inrush, Curve D × 1.5 factor' },
  general:  { curve: 'C', factor: 1.0,  note: 'General circuit — standard factor' },
};

function calcMCB(inputs: {
  loadCurrent: number;
  faultCurrent: number;
  circuitType: CircuitType;
  curveType: CurveType;
  poles: number;
  ambient: number;
  cableLength: number;
  cableCsa: number;
}): CalculationResult {
  const { loadCurrent, faultCurrent, circuitType, curveType, poles, ambient, cableLength, cableCsa } = inputs;

  // Temperature derating: IEC 60898-1, 0.5%/°C above 30°C (reference temp for MCBs)
  const refTemp = 30;
  const tempDerating = ambient > refTemp ? Math.max(0.7, 1 - (ambient - refTemp) * 0.005) : 1.0;

  const { factor } = CIRCUIT_DEFAULTS[circuitType];
  const designCurrent = loadCurrent * factor;
  const ratedCurrent = MCB_RATINGS.find((r) => r >= designCurrent) ?? MCB_RATINGS[MCB_RATINGS.length - 1];
  const deratedRating = ratedCurrent * tempDerating;
  const adequateRating = deratedRating >= loadCurrent;

  // Breaking capacity check
  const faultKA = faultCurrent / 1000;
  const requiredIcu = faultKA;
  const selectedIcuEntry = Object.entries(ICU_CLASSES).find(([, v]) => v >= requiredIcu);
  const selectedIcuLabel = selectedIcuEntry ? selectedIcuEntry[0] : '25kA — Class H';
  const selectedIcuVal = selectedIcuEntry ? selectedIcuEntry[1] : 25;
  const icuOk = selectedIcuVal >= faultKA;

  // Magnetic trip range
  const curve = CURVE_DATA[curveType];
  const tripLow = ratedCurrent * curve.low;
  const tripHigh = ratedCurrent * curve.high;

  // Cable protection check: I²t ≤ k²S² (simplified: ensure fault clears within 5 s)
  // Minimum fault current at end of cable (simplified: V=230V, R=ρL/A, ρ=0.0175 Ω·mm²/m)
  const rCable = (0.0175 * cableLength * 2) / cableCsa; // 2× for loop
  const minFault = 230 / (rCable + 0.05); // 0.05Ω source impedance approximation
  const minFaultKA = minFault / 1000;
  const cableProtected = minFault > tripLow; // fault at cable end exceeds instantaneous trip

  const overallStatus = adequateRating && icuOk && cableProtected ? 'PASS' : 'FAIL';

  return {
    values: [
      { label: 'MCB Rated Current',        value: `${ratedCurrent}`,                   unit: 'A',  highlight: true },
      { label: 'Curve Type',               value: curveType,                             unit: '',   highlight: true },
      { label: 'Breaking Capacity',        value: `${selectedIcuVal}`,                  unit: 'kA', status: icuOk ? 'PASS' : 'FAIL' },
      { label: 'Derated Capacity',         value: `${deratedRating.toFixed(1)}`,         unit: 'A',  status: adequateRating ? 'PASS' : 'FAIL' },
      { label: 'Instantaneous Trip Range', value: `${tripLow.toFixed(0)}–${tripHigh.toFixed(0)}`, unit: 'A' },
      { label: 'Min Fault at Cable End',   value: `${minFault.toFixed(0)}`,              unit: 'A',  status: cableProtected ? 'PASS' : 'WARNING' },
      { label: 'Poles',                    value: `${poles}`,                             unit: 'P' },
    ],
    status: overallStatus,
    recommendation: `Select ${ratedCurrent} A Curve-${curveType} MCB, ${poles}-pole, ${selectedIcuLabel}. ${
      adequateRating ? '' : `DERATED CAPACITY (${deratedRating.toFixed(1)} A) below load current — select higher rating. `
    }${
      icuOk ? '' : `BREAKING CAPACITY insufficient for ${faultKA.toFixed(1)} kA fault — upgrade to higher Icu class. `
    }${
      cableProtected ? `Cable end fault (${minFault.toFixed(0)} A) exceeds instantaneous trip — cable protected.` : `Cable end fault (${minFault.toFixed(0)} A) may be below instantaneous trip — check Curve B or shorten cable.`
    }`,
    formula: 'Iₙ ≥ I_design; Icu ≥ I_sc; I_fault_end > I_instantaneous',
    steps: [
      { step: 1, description: 'Design current (apply load factor)', formula: `I_design = ${loadCurrent} × ${factor} = ${designCurrent.toFixed(2)} A`, result: `${designCurrent.toFixed(2)} A` },
      { step: 2, description: 'Select MCB standard rated current', formula: `Next standard ≥ ${designCurrent.toFixed(2)} A → ${ratedCurrent} A`, result: `${ratedCurrent} A MCB` },
      { step: 3, description: 'Temperature derating (IEC 60898-1 ref. 30°C)', formula: `${ratedCurrent} × ${tempDerating.toFixed(3)} = ${deratedRating.toFixed(1)} A (at ${ambient}°C)`, result: `${deratedRating.toFixed(1)} A derated` },
      { step: 4, description: 'Breaking capacity selection', formula: `I_sc = ${faultKA.toFixed(2)} kA → use ${selectedIcuLabel}`, result: `${selectedIcuVal} kA Icu` },
      { step: 5, description: `Curve ${curveType} instantaneous trip range`, formula: `${ratedCurrent} × ${curve.low} to ${ratedCurrent} × ${curve.high} = ${tripLow.toFixed(0)}–${tripHigh.toFixed(0)} A`, result: `${curve.desc}` },
      { step: 6, description: 'Minimum fault at cable end (cable protection check)', formula: `I_min = 230 / (2×0.0175×${cableLength}/${cableCsa} + 0.05) = ${minFault.toFixed(0)} A`, result: cableProtected ? `${minFault.toFixed(0)} A > ${tripLow.toFixed(0)} A — PROTECTED` : `${minFault.toFixed(0)} A < ${tripLow.toFixed(0)} A — REVIEW` },
    ],
    standardRef: { standard: 'IEC 60898-1 / IEC 60364-4-43', clause: '4.3 / 433', title: 'Circuit-breakers for overcurrent protection in household and similar installations' },
  };
}

const WHY_ITEMS = [
  { title: 'Overload Protection',      desc: 'Thermal bimetal trips within seconds for sustained overloads — protecting cables and final circuit equipment' },
  { title: 'Short-circuit Protection', desc: 'Instantaneous magnetic element clears faults in milliseconds — before thermal damage occurs in conductors' },
  { title: 'Curve Selection',          desc: 'Wrong curve = nuisance trips (Curve B on motor) or delayed protection (Curve D on lighting). Match curve to inrush characteristics' },
  { title: 'Cable End Protection',     desc: 'MCB must clear faults at the far end of the circuit. If fault current at cable end < instantaneous trip, thermal trip takes too long for small cables' },
  { title: 'Breaking Capacity',        desc: 'Icu must exceed the prospective short-circuit current — an undersized MCB can weld shut or arc explosively under fault conditions' },
  { title: 'Temperature Derating',     desc: 'MCBs are rated at 30°C ambient. At 50°C, derating is ~10% — a 32 A MCB carries only ~29 A continuously in a hot panel' },
];

const NOTES = [
  { color: ACCENT, title: 'MCB vs MCCB — Key Differences',
    body: 'MCB (Miniature Circuit Breaker): IEC 60898-1 / BS EN 60898-1. Fixed thermal and magnetic settings. Ratings 1–125 A. Icu 3–25 kA. For final circuits (lighting, sockets, small equipment). MCCB (Moulded Case Circuit Breaker): IEC 60947-2. Adjustable thermal and magnetic settings. Ratings 16–1600 A. Icu 10–150 kA. For sub-main distribution and motor feeders.' },
  { color: '#7C3AED', title: 'Curve Selection by Application',
    body: 'Curve B (3–5×): Resistive loads, long cables — lowest risk of nuisance tripping on capacitive inrush. Curve C (5–10×): Most common; general lighting, power sockets, mixed loads. Curve D (10–20×): Transformers, motors, solenoids with high inrush — prevents nuisance trips on start-up. Curve K (8–12×): IEC 60947-2 motor protection, similar to D but with tighter tolerance. Curve Z (2–3×): Semiconductors, PLCs, sensitive electronics — trips at very low fault currents.' },
  { color: '#059669', title: 'Discrimination (Selectivity)',
    body: 'For cascading protection: downstream MCB should clear before upstream breaker operates. Rule of thumb: upstream rating ≥ 2× downstream. Use TCC (Time-Current Characteristic) curves for verification. Current limiting MCBs (Class 3, 10 kA) can achieve selectivity through current limitation when paired with properly rated upstream MCCB — check manufacturer cascade tables.' },
];

// MCB curve chart reference data
const CURVE_TABLE_DATA: { curve: CurveType; low: number; high: number; desc: string; typicalUse: string }[] = [
  { curve: 'B', low:  3, high:  5, desc: 'Sensitive',  typicalUse: 'Lighting, resistive, long cables' },
  { curve: 'C', low:  5, high: 10, desc: 'General',    typicalUse: 'Sockets, mixed loads, standard' },
  { curve: 'D', low: 10, high: 20, desc: 'High inrush', typicalUse: 'Transformers, motors, solenoids' },
  { curve: 'K', low:  8, high: 12, desc: 'Motor',       typicalUse: 'Motor feeders (IEC 60947-2)' },
  { curve: 'Z', low:  2, high:  3, desc: 'Electronic',  typicalUse: 'Semiconductors, PLCs' },
];

const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

function CurveReference() {
  return (
    <div style={{ marginTop: 24, background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 700, color: V.sec, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        MCB Curve Reference — IEC 60898-1
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: V.surf }}>
            {['Curve', 'Instantaneous Range', 'Characteristic', 'Typical Application'].map((h) => (
              <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CURVE_TABLE_DATA.map((row, i) => (
            <tr key={row.curve} style={{ borderTop: `1px solid ${V.brdM}`, background: i % 2 ? V.surf : 'transparent' }}>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800, background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, color: ACCENT }}>{row.curve}</span>
              </td>
              <td style={{ padding: '10px 14px', fontFamily: V.mono, fontSize: 12, color: V.txt }}>{row.low}–{row.high}× Iₙ</td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: V.sec }}>{row.desc}</td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: V.muted }}>{row.typicalUse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IcuReference() {
  const classes = [
    { label: '3 kA', note: 'In ≤ 25 A only', use: 'Domestic final circuits, low fault-level boards' },
    { label: '6 kA', note: 'Class 1',         use: 'Standard domestic/commercial distribution' },
    { label: '10 kA', note: 'Class 2',        use: 'Commercial/light industrial, near transformer' },
    { label: '15 kA', note: 'Class 3',        use: 'Industrial boards, high available fault level' },
    { label: '25 kA', note: 'Class H',        use: 'HV/LV sub-station boards, large transformers' },
  ];
  return (
    <div style={{ marginTop: 16, background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 700, color: V.sec, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Breaking Capacity (Icu) Classes
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: V.surf }}>
            {['Icu', 'Class / Note', 'Typical Application'].map((h) => (
              <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((row, i) => (
            <tr key={row.label} style={{ borderTop: `1px solid ${V.brdM}`, background: i % 2 ? V.surf : 'transparent' }}>
              <td style={{ padding: '10px 14px', fontFamily: V.mono, fontSize: 13, fontWeight: 700, color: ACCENT }}>{row.label}</td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: V.sec }}>{row.note}</td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: V.muted }}>{row.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MCBSelection() {
  const { addCalculation } = useStore();
  const [loadCurrent,  setLC]  = useState('16');
  const [faultCurrent, setFC]  = useState('6000');
  const [circuitType,  setCT]  = useState<CircuitType>('general');
  const [curveType,    setCurve] = useState<CurveType>('C');
  const [poles,        setPoles] = useState('1');
  const [ambient,      setAmb] = useState('35');
  const [cableLength,  setLen] = useState('20');
  const [cableCsa,     setCsa] = useState('2.5');
  const [result,       setResult] = useState<CalculationResult | null>(null);
  const [learningMode, setLM]  = useState(true);

  // Auto-select curve when circuit type changes
  const handleCircuitType = (v: string) => {
    const ct = v as CircuitType;
    setCT(ct);
    setCurve(CIRCUIT_DEFAULTS[ct].curve);
  };

  const calculate = () => {
    const res = calcMCB({
      loadCurrent: parseFloat(loadCurrent),
      faultCurrent: parseFloat(faultCurrent),
      circuitType,
      curveType,
      poles: parseInt(poles),
      ambient: parseFloat(ambient),
      cableLength: parseFloat(cableLength),
      cableCsa: parseFloat(cableCsa),
    });
    setResult(res);
    addCalculation({
      type: 'mcb',
      title: `MCB Selection — ${loadCurrent} A, Curve ${curveType}, ${poles}P`,
      inputs: { loadCurrent, faultCurrent, circuitType, curveType, poles, ambient, cableLength, cableCsa },
      results: res,
      notes: '',
      standard: 'IEC 60898-1',
    });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader
        icon={Zap}
        title="MCB SELECTION"
        subtitle="IEC 60898-1 · Rated current, curve type, breaking capacity & cable protection check"
        accentColor={ACCENT}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <InputPanel>
          <SectionLabel title="Circuit Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Load Current" value={loadCurrent} onChange={setLC} unit="A" min={0.5} tooltip="Full load current of the circuit to be protected" />
            <TextInput label="Prospective Fault Current" value={faultCurrent} onChange={setFC} unit="A" min={100} tooltip="Available short-circuit current at the MCB terminals (from network calculation or measurement)" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Ambient Temperature" value={ambient} onChange={setAmb} unit="°C" min={15} max={60} tooltip="Temperature at MCB mounting location. IEC 60898-1 reference is 30°C — derating applies above this." />
            <SelectInput label="Poles" value={poles} onChange={setPoles} options={[
              { value: '1', label: '1P — Single-pole' },
              { value: '2', label: '2P — Double-pole' },
              { value: '3', label: '3P — Three-pole' },
              { value: '4', label: '4P — Four-pole' },
            ]} tooltip="Number of poles. Use 1P for single-phase final circuits, 3P for three-phase, 4P when neutral switching required." />
          </FieldRow>

          <SectionLabel title="Cable Details (for End-of-Cable Protection Check)" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Cable Length" value={cableLength} onChange={setLen} unit="m" min={1} tooltip="One-way length of circuit cable" />
            <TextInput label="Cable CSA" value={cableCsa} onChange={setCsa} unit="mm²" min={0.5} tooltip="Cable cross-sectional area (copper conductor assumed)" />
          </FieldRow>

          <SectionLabel title="MCB Characteristics" />
          <SelectInput label="Circuit Type" value={circuitType} onChange={handleCircuitType} options={[
            { value: 'general',  label: 'General — mixed loads' },
            { value: 'lighting', label: 'Lighting circuit' },
            { value: 'socket',   label: 'Socket outlets' },
            { value: 'motor',    label: 'Motor circuit' },
            { value: 'hvac',     label: 'HVAC / AC unit' },
            { value: 'welder',   label: 'Welding equipment' },
          ]} tooltip="Circuit type auto-selects recommended curve and load factor" />
          <div style={{ height: 8 }} />
          <SelectInput label="Curve Type" value={curveType} onChange={(v) => setCurve(v as CurveType)} options={[
            { value: 'B', label: 'Curve B — 3–5× Iₙ (sensitive)' },
            { value: 'C', label: 'Curve C — 5–10× Iₙ (general)' },
            { value: 'D', label: 'Curve D — 10–20× Iₙ (high inrush)' },
            { value: 'K', label: 'Curve K — 8–12× Iₙ (motor)' },
            { value: 'Z', label: 'Curve Z — 2–3× Iₙ (electronic)' },
          ]} tooltip="Instantaneous (magnetic) trip threshold as multiple of rated current" />

          <CalcButton onClick={calculate} label="Select MCB" icon={Zap} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}

      <CurveReference />
      <IcuReference />
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
