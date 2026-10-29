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

// ── Starting kVA multiplier by method — typical values per IEC 60034-1 ────────
// These represent industry-typical assumptions. Actual values depend on motor
// design and must be verified against motor test data or manufacturer curves.
const START_MULTIPLIER: Record<string, { mult: number; note: string }> = {
  dol:          { mult: 6.0, note: 'DOL — IEC 60034-1 class IE2/IE3 typical 5.5–7× FLC; using 6×' },
  'star-delta':  { mult: 2.0, note: 'Star-Delta — reduces starting current to 1/3 of DOL; effective multiplier ≈ 2×' },
  'soft-starter':{ mult: 2.5, note: 'Soft-starter — current-limit setting 2–3× FLC (2.5× default); verify controller datasheet' },
  vfd:           { mult: 1.1, note: 'VFD — controlled ramp, starting kVA ≈ rated kVA + 10% inverter overhead' },
};

function calcDG(inputs: {
  loadKva: number; loadPF: number; largestMotorKw: number;
  startMethod: string; altitude: number; ambientTemp: number;
  redundancy: string; diversityFactor: number;
  // Manufacturer / site parameters — must be verified against product data
  xdReactance: number;    // alternator sub-transient reactance X"d [%] — governs voltage dip
  standbyRatio: number;   // standby uprating above prime [%] — manufacturer-specific (ISO 8528-1 §13)
  allowableVdip: number;  // maximum allowable terminal voltage dip [%] — load/site requirement
}): CalculationResult {
  const {
    loadKva, loadPF, largestMotorKw, startMethod, altitude, ambientTemp,
    redundancy, diversityFactor, xdReactance, standbyRatio, allowableVdip,
  } = inputs;

  const startData = START_MULTIPLIER[startMethod] ?? START_MULTIPLIER.dol;
  const startMult = startData.mult;

  // ── 1. Running load after diversity ─────────────────────────────────────────
  const runningKva = loadKva * diversityFactor;
  const runningKw  = runningKva * loadPF;

  // ── 2. Motor starting kVA ────────────────────────────────────────────────────
  // kVA_start = kW_motor × multiplier / running_PF
  // Assumption: motor rated PF = 0.85 (typical IE2/IE3). Verify with motor nameplate.
  const startingKva = largestMotorKw * startMult / 0.85;

  // ── 3. Transient peak demand (ISO 8528-2 load-acceptance basis) ───────────────
  // Conservative approach: the full starting kVA steps onto the generator
  // simultaneously with the running load (no 50 % credit — ISO 8528-2 §5.3.2).
  const transientLoadKva = runningKva + startingKva;

  // ── 4. Site derating ──────────────────────────────────────────────────────────
  // Rates: 3 %/300 m above 1000 m (naturally aspirated diesel, ISO 3046-4).
  // Turbocharged (TC/TCA) engines have lower derating — verify manufacturer curve.
  const altDerate  = altitude > 1000 ? Math.max(0.5, 1 - ((altitude - 1000) / 300) * 0.03) : 1;
  // 1 %/°C above 40 °C standard test (ISO 8528-1 §12.3). Verify with datasheet.
  const tempDerate = ambientTemp > 40 ? Math.max(0.5, 1 - (ambientTemp - 40) * 0.01) : 1;
  const derating   = altDerate * tempDerate;

  // ── 5. Required prime kVA (site-derated) ─────────────────────────────────────
  const requiredPrimeKva = transientLoadKva / derating;

  // ── 6. Required standby kVA using configurable prime-to-standby ratio ────────
  // ISO 8528-1 §13: standby (ESP) rating is typically 10 % above prime (PRP).
  // Actual ratio is manufacturer-dependent — must be confirmed from datasheet.
  const requiredStandbyKva = requiredPrimeKva * (1 + standbyRatio / 100);

  // ── 7. Redundancy and standard rating ─────────────────────────────────────────
  const unitsRequired = redundancy === 'N+1' ? 2 : redundancy === '2N' ? 2 : 1;
  const ratingPerUnit  = requiredStandbyKva / (unitsRequired === 2 && redundancy === 'N+1' ? 1 : unitsRequired);
  const stdRating      = nextStdRating(Math.ceil(ratingPerUnit));

  // ── 8. Generator rated current ────────────────────────────────────────────────
  const voltage    = 415;
  const genCurrent = (stdRating * 1000) / (Math.sqrt(3) * voltage);

  // ── 9. Voltage dip check — transient performance verification ────────────────
  // Simplified method (IEEE Std 446 / NFPA 110 Annex B):
  //   ΔV% ≈ (kVA_start / kVA_gen) × X"d%
  // This assumes the generator is driving only the starting motor (worst case).
  // Accurate modelling requires the generator AVR transfer function and load
  // characteristics — this is a screening check only.
  const voltageDip    = (startingKva / stdRating) * xdReactance;   // % estimated dip
  const vdipOk        = voltageDip <= allowableVdip;
  const vdipMargin    = allowableVdip - voltageDip;

  // ── 10. Fuel consumption ──────────────────────────────────────────────────────
  const fuelFull = runningKw * 0.27;          // ≈ 0.25–0.30 L/kWh at 100 % load
  const fuel75   = runningKw * 0.75 * 0.32;   // ≈ 0.30–0.35 L/kWh at 75 % load

  // ── Overall status ────────────────────────────────────────────────────────────
  // This function produces a PRELIMINARY ESTIMATE only. 'PASS' is never returned
  // because transient performance, load sequence, AVR/governor response and
  // frequency dip all require manufacturer-specific data and dynamic simulation.
  const overallStatus: CalculationResult['status'] =
    !vdipOk          ? 'WARNING' :   // voltage dip exceeds site limit — generator too small
    derating < 0.85  ? 'WARNING' :   // severe site derating (> 15 %) — confirm with supplier
    'INFO';                          // preliminary estimate looks feasible — validate with manufacturer

  const pendingChecks = [
    `Voltage recovery time — depends on AVR type (static / PMG) and response speed; not calculable here`,
    `Frequency dip and recovery — depends on governor class (ISO 8528-5 G1–G4); specify G3 or better for sensitive loads`,
    `Load acceptance / rejection steps — confirm engine can accept ${transientLoadKva.toFixed(0)} kVA in a single step (ISO 8528-2 §5.3)`,
    `Actual derating curve — above values assume naturally aspirated diesel; turbocharged engines derate less`,
    `Actual prime-to-standby ratio — ${standbyRatio}% assumed; confirm from manufacturer datasheet`,
  ];

  return {
    values: [
      { label: 'Running Load',              value: runningKva.toFixed(1),           unit: 'kVA'  },
      { label: 'Motor Starting kVA',        value: startingKva.toFixed(1),          unit: 'kVA',  status: 'INFO'  },
      { label: 'Transient Peak Demand',     value: transientLoadKva.toFixed(1),      unit: 'kVA',  highlight: true },
      { label: 'Site Derating Factor',      value: (derating * 100).toFixed(1),      unit: '%',    status: derating < 0.9 ? 'WARNING' : 'PASS' },
      { label: 'Required Prime kVA',        value: requiredPrimeKva.toFixed(1),      unit: 'kVA',  highlight: true },
      { label: 'Preliminary Rating',        value: `${unitsRequired} × ${stdRating}`, unit: 'kVA', highlight: true, status: overallStatus },
      { label: 'Starting Method Mult.',     value: `${startMult}×`,                  unit: 'FLC',  status: 'INFO'  },
      { label: 'Estimated Voltage Dip',     value: voltageDip.toFixed(1),            unit: '%',    status: vdipOk ? (vdipMargin < 3 ? 'WARNING' : 'PASS') : 'FAIL' },
      { label: 'Allowable Voltage Dip',     value: allowableVdip.toFixed(0),         unit: '%'    },
      { label: 'Voltage Dip Check',         value: vdipOk ? 'FEASIBLE' : 'EXCEEDS LIMIT', unit: '', status: vdipOk ? 'PASS' : 'FAIL' },
      { label: 'Generator Current',         value: genCurrent.toFixed(1),            unit: 'A'    },
      { label: 'Fuel (Full Load)',           value: fuelFull.toFixed(1),              unit: 'L/hr' },
      { label: 'Fuel (75% Load)',            value: fuel75.toFixed(1),               unit: 'L/hr' },
    ],
    status: overallStatus,
    recommendation: [
      `⚠ PRELIMINARY ESTIMATE — confirm all figures with generator manufacturer before purchasing or specifying.`,
      `Preliminary selection: ${unitsRequired} × ${stdRating} kVA (${redundancy}). Site derating: ${(derating * 100).toFixed(1)}% (${altitude} m, ${ambientTemp}°C). Starting method: ${startMethod} (${startMult}× assumed).`,
      vdipOk
        ? `Voltage dip check: estimated ΔV = ${voltageDip.toFixed(1)}% against ${allowableVdip}% limit — FEASIBLE (X"d = ${xdReactance}%).${vdipMargin < 3 ? ' Margin is small — verify with manufacturer dynamic model.' : ''}`
        : `⚠ Voltage dip check: estimated ΔV = ${voltageDip.toFixed(1)}% EXCEEDS ${allowableVdip}% limit — increase generator rating, reduce motor starting kVA or reduce X"d. (X"d = ${xdReactance}% assumed.)`,
      `Pending manufacturer confirmation: ${pendingChecks.length} items — see Step 10.`,
    ].join('  '),
    formula: 'G_kVA = (kVA_run + kVA_start) ÷ (k_alt × k_temp) × (1 + standby%/100)',
    steps: [
      { step: 1,  description: 'Running load after diversity factor',
        formula:  `kVA_run = ${loadKva} × ${diversityFactor}`,
        result:   `${runningKva.toFixed(1)} kVA` },
      { step: 2,  description: `Motor starting kVA (${startData.note})`,
        formula:  `kVA_start = ${largestMotorKw} kW × ${startMult} ÷ 0.85  [assumed motor PF = 0.85 — verify nameplate]`,
        result:   `${startingKva.toFixed(1)} kVA` },
      { step: 3,  description: 'Transient peak demand — ISO 8528-2 §5.3.2 load acceptance (100% step)',
        formula:  `kVA_peak = kVA_run + kVA_start = ${runningKva.toFixed(1)} + ${startingKva.toFixed(1)}  [conservative: full step, no credit]`,
        result:   `${transientLoadKva.toFixed(1)} kVA` },
      { step: 4,  description: 'Altitude derating — ISO 3046-4 (naturally aspirated diesel assumed; turbocharged engines derate less)',
        formula:  `k_alt = 1 − ((${altitude} − 1000)/300) × 3%`,
        result:   `${(altDerate * 100).toFixed(1)}%` },
      { step: 5,  description: 'Temperature derating — ISO 8528-1 §12.3 (1%/°C above 40°C)',
        formula:  `k_temp = 1 − (${ambientTemp} − 40) × 1%`,
        result:   `${(tempDerate * 100).toFixed(1)}%` },
      { step: 6,  description: 'Required prime kVA (site-derated)',
        formula:  `kVA_prime = ${transientLoadKva.toFixed(1)} ÷ ${derating.toFixed(3)}`,
        result:   `${requiredPrimeKva.toFixed(1)} kVA` },
      { step: 7,  description: `Required standby kVA (prime + ${standbyRatio}% — assumed; verify from manufacturer datasheet)`,
        formula:  `kVA_standby = ${requiredPrimeKva.toFixed(1)} × (1 + ${standbyRatio}/100)`,
        result:   `${requiredStandbyKva.toFixed(1)} kVA` },
      { step: 8,  description: 'Round up to nearest standard rating and calculate rated current',
        formula:  `Next std ≥ ${Math.ceil(ratingPerUnit)} kVA;  I = ${stdRating}×1000 ÷ (√3 × ${voltage})`,
        result:   `${stdRating} kVA — ${genCurrent.toFixed(1)} A` },
      { step: 9,  description: `Voltage dip screening check — simplified method (IEEE Std 446 / NFPA 110 Annex B)`,
        formula:  `ΔV% ≈ (kVA_start / kVA_gen) × X"d% = (${startingKva.toFixed(1)} / ${stdRating}) × ${xdReactance}%  [X"d = ${xdReactance}% assumed — obtain from alternator datasheet]`,
        result:   `ΔV ≈ ${voltageDip.toFixed(1)}%  ${vdipOk ? `≤ ${allowableVdip}% limit — FEASIBLE` : `> ${allowableVdip}% limit — EXCEEDS`}` },
      { step: 10, description: 'Verification checklist — items requiring manufacturer data before finalising',
        formula:  pendingChecks.map((c, i) => `${i + 1}. ${c}`).join('  |  '),
        result:   `${pendingChecks.length} items pending — result is PRELIMINARY ESTIMATE` },
    ],
    standardRef: {
      standard: 'ISO 8528-1 / ISO 8528-2 / IEC 60034-1',
      clause:   '§13 (Ratings) / §5.3 (Load acceptance) / Clause 13',
      title:    'Reciprocating IC engine driven AC generating sets — preliminary sizing',
    },
  };
}

const WHY_ITEMS = [
  { title: 'Preliminary Estimate', desc: 'This calculator produces a first-pass sizing estimate only. All multipliers and derating rates are industry-typical assumptions — actual values depend on alternator sub-transient reactance, engine governor class, and manufacturer test data. Confirm final rating with the supplier.' },
  { title: 'Motor Starting kVA',   desc: 'DOL motor starting draws 5.5–7× FLC — the exact multiplier depends on motor design and must be verified from the motor test certificate. The generator must supply this kVA without the terminal voltage dipping beyond the site limit (typically 15% for general loads, 10% for sensitive equipment).' },
  { title: 'Voltage Dip (X″d)',    desc: 'Terminal voltage dip during motor starting is controlled by the alternator sub-transient reactance X″d. Lower X″d = smaller dip. Typical brushless alternators: 10–15%. This calculator uses a simplified screening formula — accurate assessment requires a dynamic simulation with the AVR transfer function.' },
  { title: 'Site Derating',        desc: 'Derating rates assume a naturally aspirated (NA) diesel engine at ISO 8528-1 / ISO 3046-4 standard conditions. Turbocharged (TC) and turbocharged-aftercooled (TCA) engines have much lower altitude derating. Always obtain the derating curve from the specific engine/alternator manufacturer.' },
  { title: 'Prime vs Standby',     desc: 'ISO 8528-1 defines Prime (PRP) for unlimited variable-load running and Standby (ESP) for ≤500 hr/year emergency use. The standby-to-prime ratio varies by manufacturer (typically 5–15%). Do not assume 10% without confirming the specific product datasheet.' },
  { title: 'N+1 Redundancy',       desc: 'Critical facilities use N+1 (two sets, either capable of full load) — prevents complete power loss if one generator fails to start. For tier-III/IV data centres, use 2N (two fully independent systems, each capable of full load).' },
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
  // Manufacturer / site parameters
  const [xdReactance,    setXd]       = useState('12');
  const [standbyRatio,   setStdby]    = useState('10');
  const [allowableVdip,  setVdip]     = useState('15');
  const [result,         setResult]   = useState<CalculationResult | null>(null);
  const [learningMode,   setLM]       = useState(true);

  const calculate = () => {
    const res = calcDG({
      loadKva: parseFloat(loadKva), loadPF: parseFloat(loadPF),
      largestMotorKw: parseFloat(largestMotorKw), startMethod,
      altitude: parseFloat(altitude), ambientTemp: parseFloat(ambientTemp),
      redundancy, diversityFactor: parseFloat(diversityFactor),
      xdReactance: parseFloat(xdReactance),
      standbyRatio: parseFloat(standbyRatio),
      allowableVdip: parseFloat(allowableVdip),
    });
    setResult(res);
    addCalculation({
      type: 'dg', title: `DG Generator — ${loadKva} kVA load, ${altitude}m altitude`,
      inputs: { loadKva, loadPF, largestMotorKw, startMethod, altitude, ambientTemp, redundancy, xdReactance, standbyRatio, allowableVdip },
      results: res, notes: '', standard: 'ISO 8528 / IEC 60034',
    });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Cpu} title="DG GENERATOR SIZING CALCULATOR"
        subtitle="ISO 8528 / IEC 60034 · Preliminary sizing — validate all assumptions with manufacturer before finalising"
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
                { value: 'dol',          label: 'DOL — 6× (typical)' },
                { value: 'star-delta',   label: 'Star-Delta — 2×' },
                { value: 'soft-starter', label: 'Soft Starter — 2.5×' },
                { value: 'vfd',          label: 'VFD — 1.1×' },
              ]}
              tooltip="Multipliers are typical values (IEC 60034-1). Verify against motor test certificate or manufacturer curve." />
          </FieldRow>

          <SectionLabel title="Site Conditions" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Site Altitude" value={altitude} onChange={setAlt} unit="m" min={0} max={5000}
              tooltip="Elevation above sea level — derates output above 1000 m (ISO 3046-4). Rate assumes naturally aspirated engine." />
            <TextInput label="Ambient Temperature" value={ambientTemp} onChange={setTemp} unit="°C" min={-10} max={55}
              tooltip="Maximum ambient temperature — derates above 40°C (ISO 8528-1 §12.3). Verify with manufacturer for intercooled engines." />
          </FieldRow>

          <SectionLabel title="Redundancy" />
          <SelectInput label="Redundancy Configuration" value={redundancy} onChange={setRedun}
            options={[
              { value: 'N',   label: 'N — Single unit (no redundancy)' },
              { value: 'N+1', label: 'N+1 — Two units, either handles full load' },
              { value: '2N',  label: '2N — Two fully independent systems' },
            ]}
            tooltip="N+1: two generators sized for full load — any one can fail. 2N: two completely independent systems" />

          <SectionLabel title="Manufacturer / Site Parameters" />
          <FieldRow cols="1fr 1fr 1fr">
            <TextInput label="X″d (sub-transient)" value={xdReactance} onChange={setXd} unit="%" min={5} max={30} step={0.5}
              tooltip="Alternator sub-transient reactance — governs voltage dip on motor starting. Typical: 10–15% for brushless alternators. Must be obtained from alternator datasheet." />
            <TextInput label="Prime→Standby Uprating" value={standbyRatio} onChange={setStdby} unit="%" min={5} max={20}
              tooltip="How much the standby (ESP) rating exceeds the prime (PRP) rating. ISO 8528-1 typical: 10%. Must be confirmed from manufacturer datasheet — varies 5–15%." />
            <TextInput label="Max Voltage Dip" value={allowableVdip} onChange={setVdip} unit="%" min={5} max={30}
              tooltip="Site/load voltage dip limit during motor starting. General loads: 15%. Sensitive electronics: 10%. IT equipment / UPS: 5%. Motor control panels: 10–15%." />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate (Preliminary Estimate)" icon={Cpu} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
