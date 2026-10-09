import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel, QuickPills,
} from '../common/ModuleShared';

const ACCENT = '#059669';

// ── Standard generator ratings (kVA) ──────────────────────────────────────────
const STD_RATINGS = [20, 30, 40, 50, 62.5, 75, 87.5, 100, 125, 150, 175, 200,
  250, 275, 300, 350, 400, 450, 500, 550, 600, 750, 800, 1000, 1100,
  1250, 1500, 1750, 2000, 2500, 3000];

function nextStdRating(kva: number): number {
  return STD_RATINGS.find((r) => r >= kva) ?? kva;
}

// ── Starting kVA multiplier by method ─────────────────────────────────────────
const START_MULTIPLIER: Record<string, number> = {
  dol: 6.0,
  'star-delta': 2.0,
  'soft-starter': 1.5,
  vfd: 1.0,
};

function calcDG(inputs: {
  loadKva: number; loadPF: number; largestMotorKw: number;
  startMethod: string; altitude: number; ambientTemp: number;
  redundancy: string; diversityFactor: number;
}): CalculationResult {
  const { loadKva, loadPF, largestMotorKw, startMethod, altitude, ambientTemp, redundancy, diversityFactor } = inputs;

  // 1. Running load after diversity
  const runningKva = loadKva * diversityFactor;
  const runningKw  = runningKva * loadPF;

  // 2. Motor starting kVA
  const motorFLC = largestMotorKw / (Math.sqrt(3) * 0.4 * 0.85);      // at 400V, PF=0.85
  const startMult = START_MULTIPLIER[startMethod] ?? 6;
  const startingKva = largestMotorKw * startMult / 0.85;              // kVA starting load
  const transientLoadKva = runningKva + startingKva * 0.5;            // transient peak (starting adds 50%)

  // 3. Altitude derating: -3% per 300m above 1000m
  const altDerate = altitude > 1000 ? 1 - ((altitude - 1000) / 300) * 0.03 : 1;

  // 4. Temperature derating: -1% per °C above 40°C
  const tempDerate = ambientTemp > 40 ? 1 - (ambientTemp - 40) * 0.01 : 1;

  const derating = altDerate * tempDerate;

  // 5. Required prime rating (site-derated)
  const requiredPrimeKva = Math.max(runningKva, transientLoadKva) / derating;

  // 6. Standby rating is typically 10% above prime
  const requiredStandbyKva = requiredPrimeKva * 1.1;

  // 7. Redundancy
  const unitsRequired = redundancy === 'N+1' ? 2 : redundancy === '2N' ? 2 : 1;
  const ratingPerUnit  = requiredStandbyKva / (unitsRequired === 2 && redundancy === 'N+1' ? 1 : unitsRequired);
  const stdRating      = nextStdRating(Math.ceil(ratingPerUnit));

  // 8. Generator current at rated kVA
  const voltage = 415;
  const genCurrent = (stdRating * 1000) / (Math.sqrt(3) * voltage);

  // 9. Fuel consumption (diesel): approx 0.25 L/kWh at full load, 0.35 L/kWh at 75%, 0.50 L/kWh at 50%
  const fuelFull = runningKw * 0.25;
  const fuel75   = runningKw * 0.75 * 0.30;

  // 10. Status
  const status = derating < 0.85 ? 'WARNING' : 'PASS';

  return {
    values: [
      { label: 'Running Load',          value: runningKva.toFixed(1),         unit: 'kVA',  highlight: false },
      { label: 'Motor Starting kVA',    value: startingKva.toFixed(1),        unit: 'kVA',  highlight: false },
      { label: 'Derating Factor',       value: (derating * 100).toFixed(1),   unit: '%',    status: derating < 0.9 ? 'WARNING' : 'PASS' },
      { label: 'Required Prime Rating', value: requiredPrimeKva.toFixed(1),   unit: 'kVA',  highlight: true },
      { label: 'Recommended Standard',  value: stdRating.toString(),           unit: 'kVA',  highlight: true, status },
      { label: 'Units Required',        value: `${unitsRequired} × ${stdRating}`, unit: 'kVA' },
      { label: 'Generator Current',     value: genCurrent.toFixed(1),         unit: 'A' },
      { label: 'Fuel (Full Load)',       value: fuelFull.toFixed(1),           unit: 'L/hr' },
      { label: 'Fuel (75% Load)',        value: fuel75.toFixed(1),             unit: 'L/hr' },
    ],
    status,
    recommendation: `Select ${unitsRequired} × ${stdRating} kVA generator set(s) in ${redundancy} configuration. Site derating factor: ${(derating * 100).toFixed(1)}% (altitude ${altitude} m, ${ambientTemp}°C). Motor starting (${startMethod.toUpperCase()}) adds ${startingKva.toFixed(0)} kVA transient. Fuel tank sizing: assume 8-hour autonomy at 75% load = ${(fuel75 * 8).toFixed(0)} litres.`,
    formula: 'G_rating = (Load_kVA × DF + Start_kVA × 0.5) ÷ (Alt_derate × Temp_derate)',
    steps: [
      { step: 1, description: 'Running load after diversity',      formula: `kVA_run = ${loadKva} × ${diversityFactor}`,                             result: `${runningKva.toFixed(1)} kVA` },
      { step: 2, description: 'Motor starting kVA',                formula: `kVA_start = ${largestMotorKw} kW × ${startMult} ÷ 0.85`,                result: `${startingKva.toFixed(1)} kVA` },
      { step: 3, description: 'Transient peak load',               formula: `kVA_peak = ${runningKva.toFixed(1)} + ${startingKva.toFixed(1)} × 0.5`,  result: `${transientLoadKva.toFixed(1)} kVA` },
      { step: 4, description: 'Altitude derating',                 formula: `k_alt = 1 − ((${altitude} − 1000)/300) × 0.03`,                          result: `${(altDerate * 100).toFixed(1)} %` },
      { step: 5, description: 'Temperature derating',              formula: `k_temp = 1 − (${ambientTemp} − 40) × 0.01`,                               result: `${(tempDerate * 100).toFixed(1)} %` },
      { step: 6, description: 'Required prime kVA (site-derated)', formula: `kVA_req = ${transientLoadKva.toFixed(1)} ÷ ${derating.toFixed(3)}`,        result: `${requiredPrimeKva.toFixed(1)} kVA` },
      { step: 7, description: 'Next standard rating',              formula: `Round up to nearest standard kVA`,                                         result: `${stdRating} kVA` },
      { step: 8, description: 'Generator rated current',           formula: `I = ${stdRating}×1000 ÷ (√3 × ${voltage})`,                               result: `${genCurrent.toFixed(1)} A` },
    ],
    standardRef: { standard: 'IEC 60034-1 / ISO 8528', clause: 'Clause 13 (Rating)', title: 'Reciprocating internal combustion engine driven alternating current generating sets' },
  };
}

const WHY_ITEMS = [
  { title: 'Standby Power',       desc: 'Generator provides essential power during utility outage — sized for maximum demand including motor starting transients' },
  { title: 'Motor Starting kVA',  desc: 'DOL motor starting draws 6–8× FLC — the generator must supply the starting kVA without excessive voltage dip (< 15% for sensitive loads)' },
  { title: 'Altitude Derating',   desc: 'Air density falls at altitude — engine breathes less oxygen, reducing output. Derate 3% per 300m above 1000m for naturally aspirated engines' },
  { title: 'Temperature Derating',desc: 'Higher ambient temperature reduces intercooler and alternator cooling efficiency. Derate 1% per °C above 40°C standard test condition' },
  { title: 'Fuel System Sizing',  desc: 'Daily/service tank must hold 8–24 hours of fuel at 75% load. Bulk storage tank sized for the utility outage duration (days or weeks)' },
  { title: 'N+1 Redundancy',      desc: 'Critical facilities use N+1 (two sets, either capable of full load) — prevents complete power loss if one generator fails to start' },
];

const NOTES = [
  { color: ACCENT, title: 'Prime vs Standby vs Continuous Rating',
    body: 'ISO 8528 / IEC 60034-1 defines: Continuous Power (COP): runs indefinitely at rated load. Prime Power (PRP): runs at varying load for unlimited hours — 10% overload for 1hr/12hr permitted. Standby Power (ESP): for utility outage backup only — maximum 500 hrs/year. Standby rating is typically 10% above prime. Always specify which rating you need — "standby" generators are often sold at the highest rating but cannot run continuously at that load.' },
  { color: '#7C3AED', title: 'Generator Voltage Dip on Motor Starting',
    body: 'When a large DOL motor starts, the sudden load causes a voltage dip on the generator terminals. Acceptable dip: < 15% for general loads, < 10% for sensitive electronic loads, < 5% for IT equipment. The voltage dip depends on: generator sub-transient reactance (X"d, typically 10–15%), motor starting kVA, and generator kVA. Rule: motor starting kVA should not exceed generator kVA for acceptable dip. Use star-delta or VFD to reduce starting kVA if dip is excessive.' },
  { color: '#D97706', title: 'AVR and Governor Response',
    body: 'The Automatic Voltage Regulator (AVR) maintains terminal voltage within ±1% in steady state and restores voltage after a transient in < 3 seconds. The governor controls fuel injection to maintain frequency (50 Hz ± 2.5% steady state, ± 10% transient for class G3 per ISO 8528-5). For sensitive loads: specify class G3 governor and PMG (Permanent Magnet Generator) excitation for fast voltage recovery.' },
  { color: '#475569', title: 'Fuel Consumption and Tank Sizing',
    body: 'Diesel consumption: approximately 0.25–0.30 L/kWh at full load, 0.30–0.35 at 75%, 0.40–0.50 at 50%. Engines are most efficient at 70–80% load — do not oversize generators to the point where they run lightly loaded (wet stacking / glazing risk on diesel engines). Service tank: 8-hour supply at 75% load, minimum. Calculate: Volume (L) = Power_kW × Load_factor × Hours × 0.27.' },
];

const LOAD_PRESETS = [
  { value: '0.70', label: '70% Div.' },
  { value: '0.80', label: '80% Div.' },
  { value: '0.90', label: '90% Div.' },
  { value: '1.00', label: '100%' },
];

export function DGCalc() {
  const { addCalculation } = useStore();
  const [loadKva,        setLoad]     = useState('200');
  const [loadPF,         setPF]       = useState('0.85');
  const [largestMotorKw, setMotor]    = useState('22');
  const [startMethod,    setStart]    = useState('star-delta');
  const [altitude,       setAlt]      = useState('0');
  const [ambientTemp,    setTemp]     = useState('40');
  const [redundancy,     setRedun]    = useState('N+1');
  const [diversityFactor,setDF]       = useState('0.80');
  const [result,         setResult]   = useState<CalculationResult | null>(null);
  const [learningMode,   setLM]       = useState(true);

  const calculate = () => {
    const res = calcDG({
      loadKva: parseFloat(loadKva), loadPF: parseFloat(loadPF),
      largestMotorKw: parseFloat(largestMotorKw), startMethod,
      altitude: parseFloat(altitude), ambientTemp: parseFloat(ambientTemp),
      redundancy, diversityFactor: parseFloat(diversityFactor),
    });
    setResult(res);
    addCalculation({
      type: 'dg', title: `DG Generator — ${loadKva} kVA load, ${altitude}m altitude`,
      inputs: { loadKva, loadPF, largestMotorKw, startMethod, altitude, ambientTemp, redundancy },
      results: res, notes: '', standard: 'IEC 60034 / ISO 8528',
    });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Cpu} title="DG GENERATOR SIZING CALCULATOR"
        subtitle="ISO 8528 / IEC 60034 · Prime rating, starting kVA, derating factors, fuel consumption"
        accentColor={ACCENT} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <InputPanel>
          <SectionLabel title="Load Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Total Load" value={loadKva} onChange={setLoad} unit="kVA" min={1}
              tooltip="Maximum demand of all connected loads in kVA" />
            <TextInput label="Load Power Factor" value={loadPF} onChange={setPF} min={0.6} max={1} step={0.01}
              tooltip="Weighted average power factor of the connected loads" />
          </FieldRow>

          <QuickPills label="Diversity Factor" items={LOAD_PRESETS} active={diversityFactor} onSelect={setDF} accentColor={ACCENT} />

          <SectionLabel title="Largest Motor (Starting)" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Largest Motor" value={largestMotorKw} onChange={setMotor} unit="kW" min={0}
              tooltip="The single largest motor that starts under generator supply — governs the starting kVA" />
            <SelectInput label="Starting Method" value={startMethod}
              onChange={setStart}
              options={[
                { value: 'dol',          label: 'DOL — 6× starting' },
                { value: 'star-delta',   label: 'Star-Delta — 2× starting' },
                { value: 'soft-starter', label: 'Soft Starter — 1.5×' },
                { value: 'vfd',          label: 'VFD — 1× (no surge)' },
              ]}
              tooltip="Motor starting method determines the starting kVA demand on the generator" />
          </FieldRow>

          <SectionLabel title="Site Conditions" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Site Altitude" value={altitude} onChange={setAlt} unit="m" min={0} max={5000}
              tooltip="Elevation above sea level — derates output above 1000m" />
            <TextInput label="Ambient Temperature" value={ambientTemp} onChange={setTemp} unit="°C" min={-10} max={55}
              tooltip="Maximum ambient temperature at generator location — derates above 40°C" />
          </FieldRow>

          <SectionLabel title="Redundancy" />
          <SelectInput label="Redundancy Configuration" value={redundancy} onChange={setRedun}
            options={[
              { value: 'N',   label: 'N — Single unit (no redundancy)' },
              { value: 'N+1', label: 'N+1 — Two units, either handles full load' },
              { value: '2N',  label: '2N — Two fully independent systems' },
            ]}
            tooltip="N+1: two generators sized for full load — any one can fail. 2N: two completely independent systems" />

          <CalcButton onClick={calculate} label="Calculate Generator Size" icon={Cpu} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
