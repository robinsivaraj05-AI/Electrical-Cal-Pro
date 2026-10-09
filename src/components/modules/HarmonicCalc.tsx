import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, KpiCard,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#7C3AED';

// ── Harmonic current spectra (% of fundamental) ───────────────────────────────
// Based on IEEE 519 / IEC 61000-3-12 typical values
const SPECTRUM: Record<string, Record<number, number>> = {
  '6pulse':  { 5: 0.250, 7: 0.130, 11: 0.090, 13: 0.070, 17: 0.045, 19: 0.035, 23: 0.025, 25: 0.020 },
  '12pulse': { 5: 0.060, 7: 0.035, 11: 0.090, 13: 0.060, 17: 0.020, 19: 0.015, 23: 0.025, 25: 0.018 },
  'ups6p':   { 5: 0.280, 7: 0.150, 11: 0.085, 13: 0.060, 17: 0.040, 19: 0.030 },
  'smps':    { 3: 0.700, 5: 0.420, 7: 0.200, 9: 0.100, 11: 0.065, 13: 0.040 },
};

const HARMONIC_ORDERS = [3, 5, 7, 11, 13, 17, 19, 23, 25] as const;

function calcHarmonic(inputs: {
  voltage: number; faultLevelKva: number;
  linearKva: number; pulse6Kva: number; pulse12Kva: number;
  upsKva: number; smpsKva: number; pfcKvar: number;
}): CalculationResult {
  const { voltage, faultLevelKva, linearKva, pulse6Kva, pulse12Kva, upsKva, smpsKva, pfcKvar } = inputs;

  const totalKva = linearKva + pulse6Kva + pulse12Kva + upsKva + smpsKva;
  if (totalKva <= 0) {
    return { values: [], status: 'INFO', recommendation: 'Enter load values to calculate harmonics.', formula: '', steps: [] };
  }

  // Fundamental current from each load type
  const Isqrt3V = Math.sqrt(3) * voltage;
  const I1_6p   = (pulse6Kva  * 1000) / Isqrt3V;
  const I1_12p  = (pulse12Kva * 1000) / Isqrt3V;
  const I1_ups  = (upsKva     * 1000) / Isqrt3V;
  const I1_smps = (smpsKva    * 1000) / Isqrt3V;
  const I1_lin  = (linearKva  * 1000) / Isqrt3V;
  const I1_total = I1_6p + I1_12p + I1_ups + I1_smps + I1_lin;

  // Harmonic current magnitudes (sum of squares — not in phase)
  const Ih: Record<number, number> = {};
  for (const h of HARMONIC_ORDERS) {
    const i6   = I1_6p   * (SPECTRUM['6pulse'][h]  ?? 0);
    const i12  = I1_12p  * (SPECTRUM['12pulse'][h] ?? 0);
    const iups = I1_ups  * (SPECTRUM['ups6p'][h]   ?? 0);
    const ismps= I1_smps * (SPECTRUM['smps'][h]    ?? 0);
    // RMS sum (uncorrelated sources)
    Ih[h] = Math.sqrt(i6**2 + i12**2 + iups**2 + ismps**2);
  }

  // THDi (%)
  const thdi = Math.sqrt(HARMONIC_ORDERS.reduce((s, h) => s + Ih[h]**2, 0)) / I1_total * 100;

  // Supply impedance
  const ZsOhm = (voltage ** 2) / (faultLevelKva * 1000);

  // Voltage distortion at PCC — THDv ≈ sum(Ih × h × Zs) / V_phase
  const Vphase = voltage / Math.sqrt(3);
  let thsvNum = 0;
  for (const h of HARMONIC_ORDERS) {
    thsvNum += (Ih[h] * h * ZsOhm) ** 2;
  }
  const thdv = Math.sqrt(thsvNum) / Vphase * 100;

  // Resonant frequency with PFC capacitors (if any)
  let resonantHz = 0;
  let resonantOrder = 0;
  if (pfcKvar > 0) {
    const Xc = (voltage ** 2) / (pfcKvar * 1000);        // capacitive reactance at 50 Hz
    const Xl = ZsOhm;                                      // system inductance ≈ supply impedance
    resonantOrder = Math.sqrt(Xc / Xl);
    resonantHz = resonantOrder * 50;
  }

  const resonanceRisk = pfcKvar > 0 && (
    Math.abs(resonantOrder - 5) < 1.5 ||
    Math.abs(resonantOrder - 7) < 1.5 ||
    Math.abs(resonantOrder - 11) < 1.5
  );

  const thdvStatus = thdv > 8 ? 'FAIL' : thdv > 5 ? 'WARNING' : 'PASS';
    const thdiStatus = thdi > 40 ? 'FAIL' : thdi > 20 ? 'WARNING' : 'PASS';

  return {
    values: [
      { label: 'Total Load',          value: totalKva.toFixed(1),     unit: 'kVA' },
      { label: 'Fund. Current (I₁)',  value: I1_total.toFixed(1),     unit: 'A' },
      { label: '5th Harmonic (I₅)',   value: Ih[5].toFixed(2),        unit: 'A',  highlight: true },
      { label: '7th Harmonic (I₇)',   value: Ih[7].toFixed(2),        unit: 'A',  highlight: true },
      { label: '11th Harmonic (I₁₁)', value: Ih[11].toFixed(2),       unit: 'A' },
      { label: '13th Harmonic (I₁₃)', value: Ih[13].toFixed(2),       unit: 'A' },
      { label: '3rd Harmonic (I₃)',   value: Ih[3].toFixed(2),        unit: 'A' },
      { label: 'Current THDi',        value: thdi.toFixed(1),         unit: '%',  highlight: true, status: thdiStatus },
      { label: 'Voltage THDv (est.)', value: thdv.toFixed(2),         unit: '%',  highlight: true, status: thdvStatus },
      ...(pfcKvar > 0 ? [{ label: 'Resonant Order', value: resonantOrder.toFixed(1), unit: `(${resonantHz.toFixed(0)} Hz)`, status: resonanceRisk ? 'WARNING' as const : 'PASS' as const }] : []),
    ],
    status: thdvStatus === 'FAIL' || resonanceRisk ? 'FAIL' : thdvStatus,
    recommendation: `Current THDi: ${thdi.toFixed(1)}%. Estimated voltage THD at PCC: ${thdv.toFixed(2)}% (EN 50160 limit: 8%). ${
      thdv > 8 ? 'EXCEEDS LIMIT — install harmonic filters. ' :
      thdv > 5 ? 'Approaching limit — monitor and consider mitigation. ' : 'Within EN 50160 limits. '
    }${resonanceRisk ? `WARNING: PFC capacitors resonate at ${resonantHz.toFixed(0)} Hz (order ${resonantOrder.toFixed(1)}) — near a dominant harmonic. Install detuned reactor (7% p=0.07 for <210Hz tuning).` : ''}${
      thdi > 30 ? ' Consider: 12-pulse/18-pulse drives, line reactors (5% impedance), active harmonic filters.' : ''
    }`,
    formula: 'THDi = √(I₅²+I₇²+I₁₁²+…) / I₁ × 100%',
    steps: [
      { step: 1, description: 'Fundamental current from all loads', formula: `I₁ = S_total × 1000 / (√3 × ${voltage}) = ${totalKva.toFixed(0)} × 1000 / (√3 × ${voltage})`, result: `${I1_total.toFixed(1)} A` },
      { step: 2, description: '5th harmonic (dominant from 6-pulse drives)', formula: `I₅ = I₁_6p × 25% + I₁_UPS × 28% (RSS)`, result: `${Ih[5].toFixed(2)} A` },
      { step: 3, description: '7th harmonic current', formula: `I₇ = I₁_6p × 13% + I₁_UPS × 15% (RSS)`, result: `${Ih[7].toFixed(2)} A` },
      { step: 4, description: '3rd harmonic (from SMPS loads)', formula: `I₃ = I₁_SMPS × 70% (adds in neutral)`, result: `${Ih[3].toFixed(2)} A` },
      { step: 5, description: 'Current THDi', formula: `THDi = √(I₃²+I₅²+I₇²+I₁₁²+I₁₃²+…) / I₁ × 100`, result: `${thdi.toFixed(1)} %` },
      { step: 6, description: 'Supply impedance at PCC', formula: `Zs = V² / S_fault = ${voltage}² / (${faultLevelKva} × 1000)`, result: `${ZsOhm.toFixed(4)} Ω` },
      { step: 7, description: 'Voltage THD at PCC (estimated)', formula: `THDv ≈ √Σ(Ih × h × Zs)² / Vphase × 100`, result: `${thdv.toFixed(2)} %` },
      ...(pfcKvar > 0 ? [{ step: 8, description: 'Resonant order with PFC capacitors', formula: `hr = √(Xc/Xl) = √(V²/Q_cap / Zs)`, result: `Order ${resonantOrder.toFixed(1)} = ${resonantHz.toFixed(0)} Hz` }] : []),
    ],
    standardRef: { standard: 'IEC 61000-3-12 / EN 50160 / IEEE 519', clause: '', title: 'Harmonic limits for industrial installations' },
  };
}

// ── Harmonic bar chart ────────────────────────────────────────────────────────

function HarmonicChart({ values }: { values: CalculationResult['values'] }) {
  const orders = [3, 5, 7, 11, 13, 17, 19];
  const currents: Record<number, number> = {};
  for (const h of orders) {
    const label = ['3rd','5th','7th','11th','13th','17th','19th'][orders.indexOf(h)];
    const v = values.find((x) => x.label.includes(label) || x.label.includes(`I${h}`));
    currents[h] = v ? parseFloat(v.value) : 0;
  }
  const max = Math.max(...Object.values(currents), 1);
  const colors: Record<number, string> = { 3:'#DB2777', 5:'#DC2626', 7:'#D97706', 11:'#7C3AED', 13:'#2563EB', 17:'#16A34A', 19:'#0D9488' };

  return (
    <div style={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border-card)', borderRadius:14, padding:'20px 24px', marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--ec-text-secondary)', marginBottom:16 }}>Harmonic Current Spectrum</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:140 }}>
        {orders.map((h) => {
          const pct = (currents[h] / max) * 100;
          return (
            <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:10, color:'var(--ec-text-muted)', fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                {currents[h].toFixed(1)}A
              </div>
              <div style={{ width:'100%', height:110, display:'flex', alignItems:'flex-end' }}>
                <div style={{ width:'100%', height:`${Math.max(pct, 2)}%`, background:colors[h], borderRadius:'4px 4px 0 0', minHeight:3, transition:'height .3s' }} />
              </div>
              <div style={{ fontSize:11, color:'var(--ec-text-muted)', fontWeight:700 }}>{h}ᵗʰ</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const WHY_ITEMS = [
  { title: 'Equipment Overheating',  desc: 'Harmonic currents cause additional I²R losses at harmonic frequencies in transformers, cables and motors — increasing heat without doing extra work' },
  { title: 'Neutral Overloading',    desc: '3rd harmonics from single-phase SMPS add in the neutral conductor — can exceed phase current and overheat undersized neutrals' },
  { title: 'Capacitor Resonance',    desc: 'PFC capacitors can resonate with system inductance at a harmonic frequency — amplifying harmonic currents to dangerous levels' },
  { title: 'Relay Maloperation',     desc: 'Harmonic distortion can cause protection relays to operate incorrectly — particularly electromechanical types that respond to waveform shape' },
  { title: 'Voltage Distortion',     desc: 'Harmonic currents flowing through supply impedance distort the voltage waveform — affecting all other equipment on the same supply' },
  { title: 'Regulatory Compliance',  desc: 'EN 50160 limits voltage THD to 8% at the PCC. IEC 61000-3-12 limits harmonic currents for equipment > 16A per phase' },
];

const NOTES = [
  { color: ACCENT, title: 'IEEE 519 Harmonic Limits',
    body: 'IEEE 519-2014 specifies voltage THD limits at the PCC: ≤5% for systems ≤69 kV (general distribution), ≤3% for dedicated systems. Current distortion limits (TDD) depend on the short-circuit ratio Isc/IL at the PCC. Higher short-circuit ratio = higher permitted harmonics (stronger supply can absorb more distortion without significant voltage impact).' },
  { color: '#DC2626', title: 'Resonance: the hidden danger of PFC + Harmonics',
    body: 'Parallel resonance between PFC capacitors and system inductance occurs at: fr = fn × √(Ssc/Qcap) where Ssc = fault level (kVA) and Qcap = capacitor kVAR. If fr falls near the 5th (250 Hz) or 7th (350 Hz) harmonic, the harmonic impedance becomes very high — small harmonic currents cause large voltage distortion. Solution: detune the capacitor bank with a 7% series reactor (resonates at 210 Hz — below the 5th harmonic).' },
  { color: '#16A34A', title: 'Mitigation Options — Comparison',
    body: '5% Line reactor: reduces 6-pulse drive THDi from 80% to ~35%. Cost: low. Passive LC filter (5th/7th tuned): reduces specific harmonics to < 5%. Cost: medium. Active harmonic filter (AHF): reduces all harmonics to THDi < 5%. Cost: high. 12-pulse drive: eliminates 5th and 7th naturally. Cost: medium-high (transformer + dual rectifier). 18-pulse: eliminates 5th, 7th, 11th, 13th. Best choice for large individual drives.' },
  { color: '#475569', title: 'Triplen Harmonics and Neutral Sizing',
    body: '3rd, 9th and 15th harmonics are zero sequence — they do not cancel in the neutral but ADD: In = 3 × I3. In commercial buildings heavily loaded with computers (SMPS), the neutral current can reach 1.73× the phase current. IEC 60364 and BS 7671 require that in such installations the neutral conductor cross-section is doubled (equal to phase conductor for single-phase circuits). Never use shared neutrals in multi-phase circuits with high SMPS loading.' },
];

export function HarmonicCalc() {
  const { addCalculation } = useStore();
  const [voltage,     setVolt]    = useState('415');
  const [faultLevel,  setFL]      = useState('25000');
  const [linearKva,   setLin]     = useState('100');
  const [pulse6Kva,   set6p]      = useState('150');
  const [pulse12Kva,  set12p]     = useState('0');
  const [upsKva,      setUps]     = useState('50');
  const [smpsKva,     setSmps]    = useState('30');
  const [pfcKvar,     setPFC]     = useState('0');
  const [result,      setResult]  = useState<CalculationResult | null>(null);
  const [learningMode,setLM]      = useState(true);

  const calculate = () => {
    const res = calcHarmonic({
      voltage: parseFloat(voltage), faultLevelKva: parseFloat(faultLevel),
      linearKva: parseFloat(linearKva), pulse6Kva: parseFloat(pulse6Kva),
      pulse12Kva: parseFloat(pulse12Kva), upsKva: parseFloat(upsKva),
      smpsKva: parseFloat(smpsKva), pfcKvar: parseFloat(pfcKvar),
    });
    setResult(res);
    addCalculation({
      type: 'harmonic', title: `Harmonics — ${pulse6Kva}kVA 6-pulse, THDi analysis`,
      inputs: { voltage, faultLevel, linearKva, pulse6Kva, pulse12Kva, upsKva, smpsKva, pfcKvar },
      results: res, notes: '', standard: 'IEC 61000 / IEEE 519',
    });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Activity} title="HARMONIC CALCULATOR"
        subtitle="IEC 61000-3-12 / IEEE 519 · THDi, voltage distortion, resonance analysis and filter sizing"
        accentColor={ACCENT} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <InputPanel>
          <SectionLabel title="Supply System" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Supply Voltage" value={voltage} onChange={setVolt}
              options={[
                { value: '400',  label: '400 V (IEC)' },
                { value: '415',  label: '415 V (UK/Asia)' },
                { value: '480',  label: '480 V (US/Canada)' },
                { value: '690',  label: '690 V (HV motors)' },
                { value: '11000',label: '11 kV (MV system)' },
              ]} />
            <TextInput label="System Fault Level" value={faultLevel} onChange={setFL} unit="kVA"
              tooltip="3-phase short-circuit level at the PCC in kVA. Convert from kA: S_fault = √3 × V × Isc" />
          </FieldRow>

          <SectionLabel title="Load Mix (by Type)" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Linear Load" value={linearKva} onChange={setLin} unit="kVA" min={0}
              tooltip="Resistive / linear loads: heating, lighting (incandescent), motors without drives" />
            <TextInput label="6-pulse VFD / Rectifier" value={pulse6Kva} onChange={set6p} unit="kVA" min={0}
              tooltip="Standard 6-pulse drives, rectifiers, battery chargers — main source of 5th and 7th harmonics" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="12-pulse Drive / Rectifier" value={pulse12Kva} onChange={set12p} unit="kVA" min={0}
              tooltip="12-pulse drives (phase-shifted transformer) — 5th and 7th cancelled, 11th and 13th dominant" />
            <TextInput label="UPS (6-pulse input)" value={upsKva} onChange={setUps} unit="kVA" min={0}
              tooltip="Double-conversion UPS — similar harmonic profile to 6-pulse drive" />
          </FieldRow>
          <TextInput label="Single-phase SMPS (PCs, LEDs, chargers)" value={smpsKva} onChange={setSmps} unit="kVA" min={0}
            tooltip="Single-phase switch-mode power supplies — dominant source of 3rd harmonic (adds in neutral)" />

          <SectionLabel title="Power Factor Correction (optional)" />
          <TextInput label="PFC Capacitor Bank" value={pfcKvar} onChange={setPFC} unit="kVAR" min={0}
            tooltip="Existing PFC capacitor bank rating in kVAR — used to calculate resonant frequency with supply inductance" />

          <CalcButton onClick={calculate} label="Analyse Harmonics" icon={Activity} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {/* Spectrum chart */}
      {result && result.values.length > 0 && <HarmonicChart values={result.values} />}

      {/* THD limits reference */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'EN 50160 THDv limit',  value: '8 %',  sub: 'at PCC for LV distribution', color: '#DC2626' },
          { label: 'IEEE 519 THDv limit',   value: '5 %',  sub: 'at PCC for ≤69 kV systems',  color: '#D97706' },
          { label: 'Good practice target',  value: '< 3 %', sub: 'for sensitive equipment',     color: '#16A34A' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'var(--ec-bg-card)', border: '1px solid var(--ec-border-card)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
