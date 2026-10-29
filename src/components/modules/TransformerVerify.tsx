import React, { useState, useMemo, useRef } from 'react';
import { Shield, ChevronDown, ChevronRight, Check, X, AlertTriangle, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'INCOMPLETE';

type VerifyInputs = {
  kva: number;
  secondaryV: number;
  primaryKV: number;
  impedancePct: number;
  phases: 1 | 3;
  permittedLoadingPct: number;
  loadKW: number;
  loadPF: number;
  targetPF: number;
  cableSize: number;
  conductor: 'Cu' | 'Al';
  insulation: 'PVC' | 'XLPE';
  cableLength: number;
  ambientTemp: number;
  groupSize: number;
  numRuns: number;
  installedBreaker: number;
  faultClearTime: number;
  currentPF: number;
};

type CheckDef = {
  title: string; standard: string; clause: string; status: CheckStatus;
  purpose: string; formula: string; variables: string[]; inputs: string[];
  steps: string[]; result: string; explanation: string;
};

type BatchRow = VerifyInputs & { name: string };
type BatchResult = { row: BatchRow; checks: CheckDef[]; overall: CheckStatus };

// ─── Cable reference tables ───────────────────────────────────────────────────

const SIZES   = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
const AMP_CU_XLPE = [26, 34, 44, 56, 73, 95, 119, 145, 171, 213, 252, 289, 328, 371, 424, 469];
const AMP_CU_PVC  = [22, 29, 37, 47, 63, 81, 103, 125, 147, 183, 216, 249, 285, 324, 370, 410];
const AMP_AL_XLPE = [20, 26, 33, 43, 56, 73, 91, 111, 131, 162, 193, 221, 250, 282, 323, 358];
const RES_CU = [14.5, 8.7, 5.5, 3.7, 2.24, 1.41, 0.889, 0.641, 0.473, 0.328, 0.236, 0.188, 0.153, 0.123, 0.0965, 0.0775];
const RES_AL = [24.0, 14.4, 9.1, 6.0, 3.71, 2.34, 1.47, 1.06, 0.786, 0.545, 0.391, 0.312, 0.253, 0.204, 0.160, 0.128];
const REACT  = [0.115, 0.110, 0.107, 0.103, 0.101, 0.098, 0.096, 0.093, 0.089, 0.086, 0.083, 0.080, 0.078, 0.076, 0.074, 0.072];

// ─── Calculation helpers ──────────────────────────────────────────────────────

const xfmrI = (kva: number, v: number, ph: 1 | 3) =>
  ph === 3 ? (kva * 1000) / (Math.sqrt(3) * v) : (kva * 1000) / v;

const tempCorrFactor = (ambient: number, insul: 'PVC' | 'XLPE') => {
  const maxT = insul === 'XLPE' ? 90 : 70;
  return Math.sqrt((maxT - ambient) / (maxT - 30));
};

const groupFact = (n: number) => [1.0, 0.80, 0.70, 0.65, 0.60, 0.57][Math.min(n - 1, 5)];

const ampacity = (sizeIdx: number, conductor: 'Cu' | 'Al', insul: 'PVC' | 'XLPE'): number => {
  if (insul === 'XLPE') return conductor === 'Cu' ? AMP_CU_XLPE[sizeIdx] : AMP_AL_XLPE[sizeIdx];
  return AMP_CU_PVC[sizeIdx];
};

// ─── Pure verification engine (reused for single + batch) ────────────────────

function runVerification(inp: VerifyInputs): CheckDef[] {
  const { kva, secondaryV, phases, impedancePct, permittedLoadingPct,
    loadKW, loadPF, targetPF, cableSize, conductor, insulation,
    cableLength, ambientTemp, groupSize, numRuns,
    installedBreaker, faultClearTime, currentPF } = inp;

  const sizeIdx = SIZES.indexOf(cableSize) !== -1 ? SIZES.indexOf(cableSize) : 8;

  const ratedI   = xfmrI(kva, secondaryV, phases);
  const loadKVA  = loadKW / loadPF;
  const loadI    = xfmrI(loadKVA, secondaryV, phases);
  const loadingPct = (loadKVA / kva) * 100;

  const Ib      = loadI;
  const baseAmp = ampacity(sizeIdx, conductor, insulation);
  const Ct      = tempCorrFactor(ambientTemp, insulation);
  const Cg      = groupFact(groupSize);
  const Iz      = baseAmp * Ct * Cg * numRuns;

  const res    = conductor === 'Cu' ? RES_CU[sizeIdx] : RES_AL[sizeIdx];
  const Xc     = REACT[sizeIdx];
  const sinPhi = Math.sqrt(1 - loadPF * loadPF);
  const Vd     = phases === 3
    ? Math.sqrt(3) * Ib * (cableLength / 1000) * (res * loadPF + Xc * sinPhi)
    : 2          * Ib * (cableLength / 1000) * (res * loadPF + Xc * sinPhi);
  const VdPct  = (Vd / secondaryV) * 100;

  const In        = installedBreaker;
  const ibLeIn    = Ib <= In;
  const inLeIz    = In <= Iz;
  const i2LeCheck = In * 1.45 <= Iz * 1.45;

  const Isc    = ratedI / (impedancePct / 100);
  const IscKA  = Isc / 1000;

  const k           = insulation === 'XLPE' ? 143 : 115;
  const minEarthMm2 = (Isc * Math.sqrt(faultClearTime)) / k;
  const earthReqMm2 = Math.max(minEarthMm2, cableSize / 2);

  const capKVAr = loadKW > 0 && currentPF > 0 && targetPF > 0
    ? loadKW * (Math.tan(Math.acos(currentPF)) - Math.tan(Math.acos(targetPF)))
    : 0;
  const capI    = phases === 3 ? (capKVAr * 1000) / (Math.sqrt(3) * secondaryV) : (capKVAr * 1000) / secondaryV;

  return [
    {
      title: 'Transformer Loading Check',
      standard: 'IEC 60076-1 / IEC 60076-7', clause: 'Cl. 4.1, Loading Guide Cl. 7',
      status: loadingPct === 0 ? 'INCOMPLETE' : loadingPct > 100 ? 'FAIL' : loadingPct > permittedLoadingPct ? 'WARNING' : 'PASS',
      purpose: 'Verify that the transformer is not overloaded beyond its thermal rating.',
      formula: 'Loading% = S_load / S_rated × 100',
      variables: ['S_load = apparent power demand (kVA)', 'S_rated = transformer rated kVA', 'Permitted loading typically 80% for design margin'],
      inputs: [`S_rated = ${kva} kVA`, `Load P = ${loadKW} kW`, `Load PF = ${loadPF}`, `S_load = ${loadKVA.toFixed(1)} kVA`, `Permitted = ${permittedLoadingPct}%`],
      steps: [`S_load = ${loadKW} / ${loadPF} = ${loadKVA.toFixed(1)} kVA`, `Loading% = (${loadKVA.toFixed(1)} / ${kva}) × 100 = ${loadingPct.toFixed(1)}%`, `Permitted = ${permittedLoadingPct}%`, `Check: ${loadingPct.toFixed(1)}% ${loadingPct <= permittedLoadingPct ? '≤' : '>'} ${permittedLoadingPct}%`],
      result: `Loading = ${loadingPct.toFixed(1)}% — ${loadingPct <= permittedLoadingPct ? 'within' : 'EXCEEDS'} permitted limit of ${permittedLoadingPct}%`,
      explanation: 'Transformers can sustain short-term overloads but continuous operation above rated capacity accelerates insulation degradation (Arrhenius rule: 6°C rise halves insulation life).',
    },
    {
      title: 'Cable Ampacity Check',
      standard: 'IEC 60364-5-52', clause: 'Table B.52.4, Cl. 523',
      status: Iz === 0 ? 'INCOMPLETE' : Ib > Iz ? 'FAIL' : Ib > Iz * 0.9 ? 'WARNING' : 'PASS',
      purpose: 'Verify the cable current-carrying capacity (after derating) is not exceeded by the design current.',
      formula: 'Iz_derated = Iz_base × Ct × Cg\nCheck: Ib ≤ Iz_derated',
      variables: ['Iz_base = tabulated ampacity (A)', 'Ct = temperature correction factor', 'Cg = grouping derating factor', 'Ib = design current (A)'],
      inputs: [`Cable: ${cableSize}mm² ${conductor}/${insulation}`, `Iz_base = ${baseAmp} A`, `Ambient = ${ambientTemp}°C → Ct = ${Ct.toFixed(3)}`, `Group = ${groupSize} → Cg = ${Cg.toFixed(2)}`, `Runs = ${numRuns}`, `Ib = ${Ib.toFixed(1)} A`],
      steps: [`Iz_single = ${baseAmp} × ${Ct.toFixed(3)} × ${Cg.toFixed(2)} = ${(baseAmp * Ct * Cg).toFixed(1)} A`, `Iz_total = ${(baseAmp * Ct * Cg).toFixed(1)} × ${numRuns} = ${Iz.toFixed(1)} A`, `Check: Ib (${Ib.toFixed(1)}) ${Ib <= Iz ? '≤' : '>'} Iz (${Iz.toFixed(1)})`],
      result: `Iz = ${Iz.toFixed(1)} A, Ib = ${Ib.toFixed(1)} A — ${Ib <= Iz ? 'PASS' : 'FAIL: cable undersized'}`,
      explanation: 'The derating ensures the conductor does not exceed its maximum permitted operating temperature. Exceeding Iz accelerates insulation aging and creates fire risk.',
    },
    {
      title: 'Voltage Drop Check',
      standard: 'IEC 60364-5-52', clause: 'Table B.52.12, Cl. 525',
      status: VdPct === 0 ? 'INCOMPLETE' : VdPct > 5 ? 'FAIL' : VdPct > 3 ? 'WARNING' : 'PASS',
      purpose: 'Ensure voltage at load terminals does not fall below equipment operating limits.',
      formula: 'Vd = √3 × I × L × (R·cosφ + X·sinφ)\nVd% = (Vd / V_nom) × 100',
      variables: ['I = load current (A)', 'L = cable length (km)', 'R = resistance (Ω/km)', 'X = reactance (Ω/km)', 'cosφ = power factor'],
      inputs: [`I = ${Ib.toFixed(1)} A`, `L = ${cableLength} m`, `R = ${res} Ω/km`, `PF = ${loadPF}`, `V_nom = ${secondaryV} V`],
      steps: [`sinφ = ${sinPhi.toFixed(4)}`, `Vd = 1.732 × ${Ib.toFixed(1)} × ${(cableLength / 1000).toFixed(3)} × (${res}×${loadPF} + ${Xc}×${sinPhi.toFixed(4)}) = ${Vd.toFixed(3)} V`, `Vd% = ${VdPct.toFixed(2)}%`],
      result: `VD = ${Vd.toFixed(2)} V (${VdPct.toFixed(2)}%) — IEC limit: 3% recommended, 5% maximum`,
      explanation: 'IEC 60364-5-52 recommends ≤3% VD for normal circuits and ≤5% for final circuits.',
    },
    {
      title: 'Overload Protection Check: Ib ≤ In ≤ Iz',
      standard: 'IEC 60364-4-43', clause: 'Cl. 433.1',
      status: (!ibLeIn || !inLeIz) ? 'FAIL' : 'PASS',
      purpose: 'Ensure the protective device rating (In) is correctly coordinated between Ib and Iz.',
      formula: 'Ib ≤ In ≤ Iz',
      variables: ['Ib = design current (A)', 'In = rated current of protective device (A)', 'Iz = cable ampacity (A)'],
      inputs: [`Ib = ${Ib.toFixed(1)} A`, `In = ${In} A`, `Iz = ${Iz.toFixed(1)} A`],
      steps: [`Ib ≤ In → ${Ib.toFixed(1)} ≤ ${In} → ${ibLeIn ? 'PASS' : 'FAIL'}`, `In ≤ Iz → ${In} ≤ ${Iz.toFixed(1)} → ${inLeIz ? 'PASS' : 'FAIL'}`],
      result: `Ib(${Ib.toFixed(1)}) ${ibLeIn ? '≤' : '>'} In(${In}) ${inLeIz ? '≤' : '>'} Iz(${Iz.toFixed(1)}) — ${ibLeIn && inLeIz ? 'PASS' : 'FAIL'}`,
      explanation: 'If In > Iz, the cable can overheat before the device trips, causing insulation damage and fire risk.',
    },
    {
      title: 'Effective Protection Check: I₂ ≤ 1.45 × Iz',
      standard: 'IEC 60364-4-43', clause: 'Cl. 433.1 condition (b)',
      status: !i2LeCheck ? 'FAIL' : 'PASS',
      purpose: 'Verify that the conventional tripping current I₂ does not exceed 1.45 × Iz.',
      formula: 'I₂ ≤ 1.45 × Iz  (I₂ = 1.45 × In for standard CBs)',
      variables: ['I₂ = current causing device operation within 1h', 'In = rated current', '1.45 = safety factor', 'Iz = cable ampacity'],
      inputs: [`In = ${In} A`, `I₂ = 1.45 × ${In} = ${(In * 1.45).toFixed(1)} A`, `1.45 × Iz = ${(Iz * 1.45).toFixed(1)} A`],
      steps: [`I₂ = 1.45 × ${In} = ${(In * 1.45).toFixed(1)} A`, `1.45 × Iz = 1.45 × ${Iz.toFixed(1)} = ${(Iz * 1.45).toFixed(1)} A`, `Check: ${(In * 1.45).toFixed(1)} ${i2LeCheck ? '≤' : '>'} ${(Iz * 1.45).toFixed(1)}`],
      result: `I₂ = ${(In * 1.45).toFixed(1)} A vs 1.45×Iz = ${(Iz * 1.45).toFixed(1)} A — ${i2LeCheck ? 'PASS' : 'FAIL'}`,
      explanation: 'Standard circuit breakers trip within 1 hour at 1.45×In. If 1.45×In > 1.45×Iz (i.e. In > Iz), the cable reaches maximum temperature before the breaker trips.',
    },
    {
      title: 'Short-Circuit Breaking Capacity Check',
      standard: 'IEC 60947-2', clause: 'Cl. 8.3.2 — Rated short-circuit breaking capacity (Icu)',
      status: IscKA === 0 ? 'INCOMPLETE' : (In <= 63 && IscKA > 6) ? 'FAIL' : (In <= 1600 && IscKA > 50) ? 'FAIL' : 'PASS',
      purpose: 'Verify the protective device has sufficient breaking capacity to safely interrupt prospective fault current.',
      formula: 'Isc = I_rated / (Zk%/100)  —  Required: Icu ≥ Isc',
      variables: ['Isc = prospective short-circuit current', 'I_rated = transformer secondary rated current', 'Zk% = transformer impedance', 'Icu = rated breaking capacity'],
      inputs: [`kVA = ${kva}, V = ${secondaryV} V, Zk = ${impedancePct}%`, `I_rated = ${ratedI.toFixed(1)} A`, `Isc = ${Isc.toFixed(0)} A = ${IscKA.toFixed(2)} kA`],
      steps: [`I_rated = ${kva}×1000 / (1.732×${secondaryV}) = ${ratedI.toFixed(1)} A`, `Isc = ${ratedI.toFixed(1)} / ${(impedancePct / 100).toFixed(4)} = ${Isc.toFixed(0)} A = ${IscKA.toFixed(2)} kA`, `Required Icu ≥ ${IscKA.toFixed(2)} kA`],
      result: `Isc = ${IscKA.toFixed(2)} kA — Ensure ${In <= 63 ? 'MCB' : In <= 1600 ? 'MCCB' : 'ACB'} has Icu ≥ ${IscKA.toFixed(2)} kA`,
      explanation: 'If breaking capacity is insufficient, the device will be destroyed during a fault, likely causing arc flash and loss of protection.',
    },
    {
      title: 'Earth Conductor Adiabatic Sizing Check',
      standard: 'IEC 60364-5-54', clause: 'Annex A, Eq. A.1',
      status: (cableSize / 2) < minEarthMm2 ? 'WARNING' : 'PASS',
      purpose: 'Verify the PE conductor can carry fault current for the clearance time without being damaged.',
      formula: 'S = (I × √t) / k',
      variables: ['I = fault current (A) = Isc', 't = fault clearance time (s)', 'k = 143 (Cu/XLPE) or 115 (Cu/PVC)', 'S = min. cross-section (mm²)'],
      inputs: [`Isc = ${Isc.toFixed(0)} A`, `t = ${faultClearTime} s`, `k = ${k}`, `Phase cable: ${cableSize} mm²`],
      steps: [`S_min = (${Isc.toFixed(0)} × √${faultClearTime}) / ${k} = ${minEarthMm2.toFixed(2)} mm²`, `Min by convention (S/2) = ${(cableSize / 2).toFixed(1)} mm²`, `Required: max = ${earthReqMm2.toFixed(2)} mm²`],
      result: `Minimum PE = ${earthReqMm2.toFixed(2)} mm² — select next standard size ≥ ${earthReqMm2.toFixed(0)} mm²`,
      explanation: 'The adiabatic equation assumes all heat absorbed by conductor (conservative, valid for short fault durations ≤5 s).',
    },
    {
      title: 'Capacitor Bank Current Check',
      standard: 'IEC 60831-1', clause: 'Cl. 6.1, 6.3',
      status: capKVAr <= 0 ? 'INCOMPLETE' : 'PASS',
      purpose: 'Verify capacitor bank sizing for PF correction and contactor/fuse rating.',
      formula: 'Qc = P×(tanφ₁ − tanφ₂)\nIc = Qc×1000 / (√3×V)',
      variables: ['Qc = reactive power (kVAr)', 'φ₁ = existing PF angle', 'φ₂ = target PF angle', 'Ic = capacitor current (A)', '1.3 = IEC 60831 overrating factor'],
      inputs: [`P = ${loadKW} kW`, `Current PF = ${currentPF}`, `Target PF = ${targetPF}`, `V = ${secondaryV} V`],
      steps: [`tanφ₁ = ${Math.tan(Math.acos(currentPF)).toFixed(4)}`, `tanφ₂ = ${Math.tan(Math.acos(targetPF)).toFixed(4)}`, `Qc = ${capKVAr.toFixed(2)} kVAr`, `Ic = ${capI.toFixed(1)} A`, `Contactor rating ≥ 1.3 × ${capI.toFixed(1)} = ${(capI * 1.3).toFixed(1)} A`],
      result: `Qc = ${capKVAr.toFixed(2)} kVAr, Ic = ${capI.toFixed(1)} A, Contactor ≥ ${(capI * 1.3).toFixed(1)} A`,
      explanation: 'Capacitors draw inrush current much higher than steady-state. IEC 60831 requires switching device rated at ≥1.3× rated capacitor current for continuous duty.',
    },
  ];
}

const overallFromChecks = (checks: CheckDef[]): CheckStatus => {
  if (checks.some(c => c.status === 'FAIL')) return 'FAIL';
  if (checks.some(c => c.status === 'WARNING')) return 'WARNING';
  if (checks.some(c => c.status === 'INCOMPLETE')) return 'INCOMPLETE';
  return 'PASS';
};

// ─── Styling helpers ──────────────────────────────────────────────────────────

const statusColor = (s: CheckStatus) =>
  s === 'PASS' ? '#22C55E' : s === 'WARNING' ? '#F59E0B' : s === 'FAIL' ? '#EF4444' : '#64748B';

const statusIcon = (s: CheckStatus) =>
  s === 'PASS' ? <Check style={{ width: 13, height: 13 }} /> :
  s === 'FAIL' ? <X style={{ width: 13, height: 13 }} /> :
  s === 'WARNING' ? <AlertTriangle style={{ width: 13, height: 13 }} /> :
  <span style={{ fontSize: 10 }}>—</span>;

function Badge({ status }: { status: CheckStatus }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: statusColor(status) + '22', color: statusColor(status),
      border: `1px solid ${statusColor(status)}44`,
    }}>
      {statusIcon(status)} {status}
    </span>
  );
}

function FInput({ label, value, onChange, unit, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--ec-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="number" value={value} min={min} max={max} step={step ?? 1}
          onChange={e => onChange(+e.target.value)}
          style={{
            width: '100%', background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)',
            borderRadius: 8, padding: unit ? '8px 36px 8px 10px' : '8px 10px',
            color: 'var(--ec-text-primary)', fontSize: 13, boxSizing: 'border-box',
          }}
        />
        {unit && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ec-text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function FSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--ec-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)', borderRadius: 8, padding: '8px 10px', color: 'var(--ec-text-primary)', fontSize: 13 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Accordion check card ─────────────────────────────────────────────────────

function CheckCard({
  title, standard, clause, status, purpose, formula, variables, inputs,
  steps, result, explanation, expanded, onToggle,
}: CheckDef & { expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{ border: `1px solid ${statusColor(status)}44`, borderLeft: `4px solid ${statusColor(status)}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'var(--ec-bg-surface)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <Badge status={status} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-text-primary)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 2 }}>{standard} — {clause}</div>
        </div>
        {expanded ? <ChevronDown style={{ width: 16, height: 16, color: 'var(--ec-text-muted)', flexShrink: 0 }} /> : <ChevronRight style={{ width: 16, height: 16, color: 'var(--ec-text-muted)', flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: '16px', background: 'var(--ec-bg-root)', borderTop: `1px solid ${statusColor(status)}22` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginBottom: 5 }}>Purpose</div>
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', lineHeight: 1.5 }}>{purpose}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginBottom: 5 }}>Engineering Explanation</div>
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', lineHeight: 1.5 }}>{explanation}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'var(--ec-bg-surface)', borderRadius: 8, padding: 12, border: '1px solid var(--ec-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', marginBottom: 6 }}>FORMULA</div>
              <code style={{ fontSize: 12, color: 'var(--ec-text-primary)', lineHeight: 1.6 }}>{formula}</code>
            </div>
            <div style={{ background: 'var(--ec-bg-surface)', borderRadius: 8, padding: 12, border: '1px solid var(--ec-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', marginBottom: 6 }}>VARIABLES</div>
              {variables.map((v, i) => <div key={i} style={{ fontSize: 11, color: 'var(--ec-text-muted)', lineHeight: 1.7 }}>{v}</div>)}
            </div>
            <div style={{ background: 'var(--ec-bg-surface)', borderRadius: 8, padding: 12, border: '1px solid var(--ec-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', marginBottom: 6 }}>INPUTS USED</div>
              {inputs.map((v, i) => <div key={i} style={{ fontSize: 11, color: 'var(--ec-text-primary)', lineHeight: 1.7, fontFamily: 'monospace' }}>{v}</div>)}
            </div>
          </div>
          <div style={{ background: 'var(--ec-bg-surface)', borderRadius: 8, padding: 12, border: '1px solid var(--ec-border)', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', marginBottom: 8 }}>STEP-BY-STEP CALCULATION</div>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', minWidth: 18, marginTop: 2 }}>S{i + 1}</span>
                <code style={{ fontSize: 12, color: 'var(--ec-text-primary)', lineHeight: 1.5 }}>{s}</code>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: statusColor(status) + '11', borderRadius: 8, border: `1px solid ${statusColor(status)}33` }}>
            <Badge status={status} />
            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(status) }}>{result}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Excel helpers ────────────────────────────────────────────────────────────

const TEMPLATE_HEADERS = [
  'Load Name', 'Load kW', 'Load PF', 'Current System PF', 'Target PF',
  'Cable Size (mm²)', 'Conductor (Cu/Al)', 'Insulation (PVC/XLPE)',
  'Cable Length (m)', 'Ambient Temp (°C)', 'Group Size', 'Num Runs',
  'Installed Breaker (A)', 'Fault Clear Time (s)',
];

const TEMPLATE_SAMPLE = [
  'MDB Feeder-01', 250, 0.85, 0.82, 0.95,
  95, 'Cu', 'XLPE', 80, 40, 2, 1, 315, 0.5,
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransformerVerify() {
  const [expanded, setExpanded]       = useState<Set<number>>(new Set());
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const xlsxRef                       = useRef<HTMLInputElement>(null);

  const [inp, setInp] = useState<VerifyInputs>({
    kva: 1000, secondaryV: 400, primaryKV: 11, impedancePct: 6, phases: 3,
    permittedLoadingPct: 80, loadKW: 600, loadPF: 0.82, targetPF: 0.95,
    cableSize: 95, conductor: 'Cu', insulation: 'XLPE', cableLength: 80,
    ambientTemp: 40, groupSize: 3, numRuns: 1, installedBreaker: 250,
    faultClearTime: 0.5, currentPF: 0.82,
  });

  const toggle = (i: number) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const upd = (k: keyof VerifyInputs, v: number | string) =>
    setInp(p => ({ ...p, [k]: v }));

  const checks        = useMemo(() => runVerification(inp), [inp]);
  const overallStatus = useMemo(() => overallFromChecks(checks), [checks]);

  // ── Template download ──
  const downloadTemplate = () => {
    const infoRow = [
      `Transformer: ${inp.kva} kVA | ${inp.secondaryV} V | ${inp.impedancePct}% Zk | ${inp.phases === 3 ? '3-Phase' : '1-Phase'} | Permitted Loading: ${inp.permittedLoadingPct}%`,
      '', '', '', '', '', '', '', '', '', '', '', '', '',
    ];
    const ws = XLSX.utils.aoa_to_sheet([
      ['IEC Cross Verification — Multi-Load Template', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      infoRow,
      ['NOTE: Transformer parameters are taken from the left panel inputs.', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      TEMPLATE_HEADERS,
      TEMPLATE_SAMPLE,
      ['MDB Feeder-02', 180, 0.80, 0.78, 0.95, 70, 'Cu', 'XLPE', 60, 40, 2, 1, 250, 0.5],
    ]);
    ws['!cols'] = TEMPLATE_HEADERS.map((h, i) => ({ wch: Math.max(h.length + 2, i === 0 ? 20 : 14) }));
    // Style the header row (row index 4)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Load Verification Template');
    XLSX.writeFile(wb, 'iec_verification_template.xlsx');
  };

  // ── Excel import ──
  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result;
      if (!data) return;
      const wb   = XLSX.read(data, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const str  = (row: Record<string, unknown>, k: string) => String(row[k] ?? '').trim();
      const num  = (row: Record<string, unknown>, k: string, def: number) => { const v = parseFloat(str(row, k)); return isNaN(v) ? def : v; };

      const results: BatchResult[] = rows
        .filter(row => str(row, 'Load Name') !== '')
        .map(row => {
          const conductorRaw  = str(row, 'Conductor (Cu/Al)').toUpperCase();
          const insulationRaw = str(row, 'Insulation (PVC/XLPE)').toUpperCase();
          const cableSize     = num(row, 'Cable Size (mm²)', 95);
          const rowInp: BatchRow = {
            ...inp,                       // inherit transformer params from panel
            name:             str(row, 'Load Name') || 'Unnamed',
            loadKW:           num(row, 'Load kW', 100),
            loadPF:           Math.min(1, Math.max(0.5, num(row, 'Load PF', 0.85))),
            currentPF:        Math.min(1, Math.max(0.5, num(row, 'Current System PF', 0.82))),
            targetPF:         Math.min(1, Math.max(0.8, num(row, 'Target PF', 0.95))),
            cableSize:        SIZES.includes(cableSize) ? cableSize : 95,
            conductor:        conductorRaw === 'AL' ? 'Al' : 'Cu',
            insulation:       insulationRaw === 'PVC' ? 'PVC' : 'XLPE',
            cableLength:      Math.max(1, num(row, 'Cable Length (m)', 50)),
            ambientTemp:      num(row, 'Ambient Temp (°C)', 40),
            groupSize:        Math.max(1, num(row, 'Group Size', 1)),
            numRuns:          Math.max(1, num(row, 'Num Runs', 1)),
            installedBreaker: num(row, 'Installed Breaker (A)', 250),
            faultClearTime:   num(row, 'Fault Clear Time (s)', 0.5),
          };
          const chks    = runVerification(rowInp);
          const overall = overallFromChecks(chks);
          return { row: rowInp, checks: chks, overall };
        });

      setBatchResults(results);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // ── Report download ──
  const downloadReport = () => {
    const wb = XLSX.utils.book_new();
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ── Sheet 1: Cover / Summary ──
    const checkTitles = ['1.Xfmr Loading', '2.Cable Ampacity', '3.Voltage Drop', '4.OC Ib≤In≤Iz', '5.I₂≤1.45Iz', '6.SC Breaking', '7.Earth PE', '8.Cap Bank'];
    const summaryData: unknown[][] = [
      ['IEC CROSS VERIFICATION REPORT'],
      [`Generated: ${now}`],
      [`Transformer: ${inp.kva} kVA | ${inp.secondaryV} V | Zk = ${inp.impedancePct}% | ${inp.phases === 3 ? '3-Phase' : '1-Phase'}`],
      [`Permitted Loading: ${inp.permittedLoadingPct}%  |  Standard: IEC 60076 / IEC 60364 / IEC 60947-2 / IEC 60831`],
      [],
      ['SINGLE LOAD VERIFICATION (from panel inputs)'],
      [],
      ['#', 'Check Name', 'Standard', 'Clause', 'Result Summary', 'STATUS'],
      ...checks.map((c, i) => [i + 1, c.title, c.standard, c.clause, c.result, c.status]),
      [],
      ['Overall Single Load Status:', '', '', '', '', overallStatus],
    ];

    if (batchResults.length > 0) {
      summaryData.push([]);
      summaryData.push(['MULTI-LOAD BATCH VERIFICATION SUMMARY']);
      summaryData.push([]);
      summaryData.push(['Load Name', 'kW', 'PF', 'Cable', 'Ib (A)', 'Iz (A)', 'VD%', 'Breaker', ...checkTitles, 'OVERALL']);

      batchResults.forEach(({ row, checks: chks, overall }) => {
        const SIZES2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
        const sI = SIZES2.indexOf(row.cableSize) !== -1 ? SIZES2.indexOf(row.cableSize) : 8;
        const baseA = row.insulation === 'XLPE' ? (row.conductor === 'Cu' ? AMP_CU_XLPE[sI] : AMP_AL_XLPE[sI]) : AMP_CU_PVC[sI];
        const maxT  = row.insulation === 'XLPE' ? 90 : 70;
        const Ct    = Math.sqrt((maxT - row.ambientTemp) / (maxT - 30));
        const Cg    = [1.0, 0.80, 0.70, 0.65, 0.60, 0.57][Math.min(row.groupSize - 1, 5)];
        const Iz    = baseA * Ct * Cg * row.numRuns;
        const Ib    = row.phases === 3 ? (row.loadKW / row.loadPF * 1000) / (Math.sqrt(3) * row.secondaryV) : (row.loadKW / row.loadPF * 1000) / row.secondaryV;
        const resArr = row.conductor === 'Cu' ? RES_CU : RES_AL;
        const Xc    = REACT[sI];
        const sinP  = Math.sqrt(1 - row.loadPF * row.loadPF);
        const Vd    = row.phases === 3 ? Math.sqrt(3) * Ib * (row.cableLength / 1000) * (resArr[sI] * row.loadPF + Xc * sinP) : 2 * Ib * (row.cableLength / 1000) * (resArr[sI] * row.loadPF + Xc * sinP);
        const VdPct = (Vd / row.secondaryV) * 100;
        summaryData.push([
          row.name, row.loadKW, row.loadPF,
          `${row.cableSize}mm² ${row.conductor}/${row.insulation}`,
          Ib.toFixed(1), Iz.toFixed(1), VdPct.toFixed(2) + '%', row.installedBreaker,
          ...chks.map(c => c.status),
          overall,
        ]);
      });
    }

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, ...checkTitles.map(() => ({ wch: 14 })), { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Verification Summary');

    // ── Sheet 2: Detailed checks for each batch row ──
    if (batchResults.length > 0) {
      const detailData: unknown[][] = [
        ['DETAILED CHECK RESULTS — ALL BATCH LOADS'],
        [],
      ];
      batchResults.forEach(({ row, checks: chks }) => {
        detailData.push([`Load: ${row.name}  (${row.loadKW} kW, PF ${row.loadPF}, ${row.cableSize}mm² ${row.conductor}/${row.insulation}, ${row.cableLength}m, Breaker ${row.installedBreaker}A)`]);
        detailData.push(['#', 'Check', 'Standard', 'STATUS', 'Result', 'Step Details']);
        chks.forEach((c, i) => {
          detailData.push([i + 1, c.title, `${c.standard} — ${c.clause}`, c.status, c.result, c.steps.join(' | ')]);
        });
        detailData.push([]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(detailData);
      ws2['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 28 }, { wch: 10 }, { wch: 55 }, { wch: 90 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Detailed Checks');
    }

    XLSX.writeFile(wb, `IEC_Verification_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const sourceLabel = batchResults.length > 0 ? `Batch: ${batchResults.length} loads verified` : 'Single load mode';

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', border: '1px solid #1D4ED8', borderRadius: 12, padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(99,102,241,0.4)' }}>
          <Shield style={{ width: 26, height: 26, color: '#A78BFA' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>IEC CROSS VERIFICATION DASHBOARD</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
            Independent verification against IEC 60076, IEC 60364, IEC 60947-2, IEC 60831 · {sourceLabel}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download style={{ width: 13, height: 13 }} /> Template
          </button>
          <button onClick={() => xlsxRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#22C55E22', color: '#22C55E', border: '1px solid #22C55E55', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Upload style={{ width: 13, height: 13 }} /> Upload Loads
          </button>
          <input ref={xlsxRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={importExcel} />
          <button onClick={downloadReport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download style={{ width: 13, height: 13 }} /> Download Report
          </button>
          <Badge status={overallStatus} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

        {/* Input panel */}
        <div style={{ background: 'var(--ec-bg-surface)', border: '1px solid var(--ec-border)', borderRadius: 12, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--ec-text-primary)' }}>Verification Inputs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginTop: 4 }}>Transformer</div>
            <FInput label="Rated kVA" value={inp.kva} onChange={v => upd('kva', v)} unit="kVA" min={25} />
            <FInput label="Secondary Voltage" value={inp.secondaryV} onChange={v => upd('secondaryV', v)} unit="V" min={110} />
            <FInput label="Impedance %" value={inp.impedancePct} onChange={v => upd('impedancePct', v)} unit="%" min={1} max={20} step={0.5} />
            <FInput label="Permitted Loading %" value={inp.permittedLoadingPct} onChange={v => upd('permittedLoadingPct', v)} unit="%" min={50} max={110} />
            <FSelect label="Phases" value={inp.phases.toString()} onChange={v => upd('phases', +v)}
              options={[{ value: '3', label: '3-Phase' }, { value: '1', label: '1-Phase' }]} />

            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginTop: 8 }}>Load</div>
            <FInput label="Load (kW)" value={inp.loadKW} onChange={v => upd('loadKW', v)} unit="kW" min={1} />
            <FInput label="Load PF" value={inp.loadPF} onChange={v => upd('loadPF', v)} min={0.5} max={1} step={0.01} />
            <FInput label="Current System PF" value={inp.currentPF} onChange={v => upd('currentPF', v)} min={0.5} max={1} step={0.01} />
            <FInput label="Target PF" value={inp.targetPF} onChange={v => upd('targetPF', v)} min={0.8} max={1} step={0.01} />

            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginTop: 8 }}>Cable</div>
            <FSelect label="Cable Size" value={inp.cableSize.toString()} onChange={v => upd('cableSize', +v)}
              options={SIZES.map(s => ({ value: s.toString(), label: `${s} mm²` }))} />
            <FSelect label="Conductor" value={inp.conductor} onChange={v => upd('conductor', v)}
              options={[{ value: 'Cu', label: 'Copper (Cu)' }, { value: 'Al', label: 'Aluminium (Al)' }]} />
            <FSelect label="Insulation" value={inp.insulation} onChange={v => upd('insulation', v)}
              options={[{ value: 'XLPE', label: 'XLPE (90°C)' }, { value: 'PVC', label: 'PVC (70°C)' }]} />
            <FInput label="Cable Length" value={inp.cableLength} onChange={v => upd('cableLength', v)} unit="m" min={1} />
            <FInput label="Ambient Temp" value={inp.ambientTemp} onChange={v => upd('ambientTemp', v)} unit="°C" min={20} max={55} />
            <FInput label="Group Size" value={inp.groupSize} onChange={v => upd('groupSize', v)} min={1} max={6} />
            <FInput label="Num. Runs" value={inp.numRuns} onChange={v => upd('numRuns', v)} min={1} max={6} />

            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginTop: 8 }}>Protection</div>
            <FInput label="Installed Breaker (A)" value={inp.installedBreaker} onChange={v => upd('installedBreaker', v)} unit="A" min={1} />
            <FInput label="Fault Clearance Time" value={inp.faultClearTime} onChange={v => upd('faultClearTime', v)} unit="s" min={0.1} max={5} step={0.1} />
          </div>
        </div>

        {/* Right panel */}
        <div>

          {/* Batch results table */}
          {batchResults.length > 0 && (
            <div style={{ background: 'var(--ec-bg-surface)', border: '1px solid var(--ec-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Batch Verification Results — {batchResults.length} Loads</div>
                  <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 3 }}>Transformer params from left panel · each row = one feeder/load</div>
                </div>
                <button onClick={() => setBatchResults([])} style={{ fontSize: 11, color: 'var(--ec-text-muted)', background: 'none', border: '1px solid var(--ec-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--ec-bg-root)', borderBottom: '2px solid var(--ec-border)' }}>
                      {['Load', 'kW', 'PF', 'Cable', 'Breaker', '①Xfmr', '②Ampacity', '③VD', '④OC', '⑤I₂', '⑥SC', '⑦Earth', '⑧Cap', 'OVERALL'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map(({ row, checks: chks, overall }, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--ec-border)', background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-root)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{row.name}</td>
                        <td style={{ padding: '7px 10px' }}>{row.loadKW}</td>
                        <td style={{ padding: '7px 10px' }}>{row.loadPF}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{row.cableSize}mm² {row.conductor}</td>
                        <td style={{ padding: '7px 10px' }}>{row.installedBreaker}A</td>
                        {chks.map((c, ci) => (
                          <td key={ci} style={{ padding: '7px 8px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: statusColor(c.status) + '22', color: statusColor(c.status) }}>{c.status}</span>
                          </td>
                        ))}
                        <td style={{ padding: '7px 10px' }}><Badge status={overall} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Single load summary matrix */}
          <div style={{ background: 'var(--ec-bg-surface)', border: '1px solid var(--ec-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              {batchResults.length > 0 ? 'Single Load Verification (panel inputs)' : 'Verification Summary Matrix'}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--ec-border)' }}>
                    {['#', 'Check Name', 'Standard', 'Status'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ec-border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-root)' }} onClick={() => toggle(i)}>
                      <td style={{ padding: '7px 10px', color: 'var(--ec-text-muted)' }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{c.title}</td>
                      <td style={{ padding: '7px 10px', color: '#6366F1', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.standard}</td>
                      <td style={{ padding: '7px 10px' }}><Badge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['PASS', 'WARNING', 'FAIL', 'INCOMPLETE'] as CheckStatus[]).map(s => {
                const count = checks.filter(c => c.status === s).length;
                return count > 0 ? (
                  <span key={s} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: statusColor(s) + '22', color: statusColor(s), border: `1px solid ${statusColor(s)}44`, fontWeight: 700 }}>
                    {count} {s}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Accordion */}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Detailed Verification Checks — Click to expand</div>
          {checks.map((c, i) => (
            <CheckCard key={i} {...c} expanded={expanded.has(i)} onToggle={() => toggle(i)} />
          ))}

          <div style={{ marginTop: 16, fontSize: 11, color: '#F59E0B', background: '#F59E0B11', border: '1px solid #F59E0B33', borderRadius: 8, padding: '10px 14px' }}>
            ⚠️ Engineering Aid Only — These checks are indicative only. All calculations require review and approval by a qualified electrical engineer (IEng/CEng) before construction, procurement or energization.
          </div>
        </div>
      </div>
    </div>
  );
}
