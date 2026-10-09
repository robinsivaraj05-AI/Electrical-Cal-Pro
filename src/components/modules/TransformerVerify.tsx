import React, { useState, useMemo } from 'react';
import { Shield, ChevronDown, ChevronRight, Check, X, AlertTriangle } from 'lucide-react';

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
  cableSize: number;      // mm²
  conductor: 'Cu' | 'Al';
  insulation: 'PVC' | 'XLPE';
  cableLength: number;    // m
  ambientTemp: number;
  groupSize: number;
  numRuns: number;
  installedBreaker: number; // A
  faultClearTime: number;   // s
  currentPF: number;
};

// ─── Cable reference tables (same as Distribution module) ─────────────────────

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
}: {
  title: string; standard: string; clause: string; status: CheckStatus;
  purpose: string; formula: string; variables: string[]; inputs: string[];
  steps: string[]; result: string; explanation: string;
  expanded: boolean; onToggle: () => void;
}) {
  return (
    <div style={{
      border: `1px solid ${statusColor(status)}44`,
      borderLeft: `4px solid ${statusColor(status)}`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 16px', background: 'var(--ec-bg-surface)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Badge status={status} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-text-primary)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 2 }}>{standard} — {clause}</div>
        </div>
        {expanded
          ? <ChevronDown style={{ width: 16, height: 16, color: 'var(--ec-text-muted)', flexShrink: 0 }} />
          : <ChevronRight style={{ width: 16, height: 16, color: 'var(--ec-text-muted)', flexShrink: 0 }} />}
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
              {variables.map((v, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--ec-text-muted)', lineHeight: 1.7 }}>{v}</div>
              ))}
            </div>
            <div style={{ background: 'var(--ec-bg-surface)', borderRadius: 8, padding: 12, border: '1px solid var(--ec-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', marginBottom: 6 }}>INPUTS USED</div>
              {inputs.map((v, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--ec-text-primary)', lineHeight: 1.7, fontFamily: 'monospace' }}>{v}</div>
              ))}
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

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: statusColor(status) + '11', borderRadius: 8,
            border: `1px solid ${statusColor(status)}33`,
          }}>
            <Badge status={status} />
            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(status) }}>{result}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransformerVerify() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [inp, setInp] = useState<VerifyInputs>({
    kva: 1000, secondaryV: 415, primaryKV: 11, impedancePct: 6, phases: 3,
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

  // ── Derived calculations ──
  const calcs = useMemo(() => {
    const { kva, secondaryV, phases, impedancePct, permittedLoadingPct,
      loadKW, loadPF, targetPF, cableSize, conductor, insulation,
      cableLength, ambientTemp, groupSize, numRuns,
      installedBreaker, faultClearTime, currentPF } = inp;

    const sizeIdx = SIZES.indexOf(cableSize) !== -1 ? SIZES.indexOf(cableSize) : 8; // default 50mm²

    // 1. Transformer loading
    const ratedI = xfmrI(kva, secondaryV, phases);
    const loadKVA = loadKW / loadPF;
    const loadI = xfmrI(loadKVA, secondaryV, phases);
    const loadingPct = (loadKVA / kva) * 100;

    // 2. Cable ampacity
    const Ib = loadI;
    const baseAmp = ampacity(sizeIdx, conductor, insulation);
    const Ct = tempCorrFactor(ambientTemp, insulation);
    const Cg = groupFact(groupSize);
    const Iz = baseAmp * Ct * Cg * numRuns;

    // 3. Voltage drop
    const res = conductor === 'Cu' ? RES_CU[sizeIdx] : RES_AL[sizeIdx];
    const Xc = REACT[sizeIdx];
    const sinPhi = Math.sqrt(1 - loadPF * loadPF);
    const Vd = phases === 3
      ? Math.sqrt(3) * Ib * (cableLength / 1000) * (res * loadPF + Xc * sinPhi)
      : 2 * Ib * (cableLength / 1000) * (res * loadPF + Xc * sinPhi);
    const VdPct = (Vd / secondaryV) * 100;

    // 4. OC protection check: Ib ≤ In ≤ Iz
    const In = installedBreaker;
    const ibLeIn = Ib <= In;
    const inLeIz = In <= Iz;
    const i2LeCheck = In * 1.45 <= Iz;

    // 5. Fault current
    const Isc = ratedI / (impedancePct / 100);
    const IscKA = Isc / 1000;

    // 6. Earth conductor adiabatic
    const k = insulation === 'XLPE' ? 143 : 115;
    const minEarthMm2 = (Isc * Math.sqrt(faultClearTime)) / k;
    const minCableEarth = cableSize / 2;
    const earthReqMm2 = Math.max(minEarthMm2, minCableEarth);

    // 7. Capacitor bank
    const capKVAr = loadKW > 0 && currentPF > 0 && targetPF > 0
      ? loadKW * (Math.tan(Math.acos(currentPF)) - Math.tan(Math.acos(targetPF)))
      : 0;
    const capI = phases === 3 ? (capKVAr * 1000) / (Math.sqrt(3) * secondaryV) : (capKVAr * 1000) / secondaryV;
    const maxCapI = capI * 1.3;

    return {
      ratedI, loadKVA, loadI, loadingPct, Ib, baseAmp, Ct, Cg, Iz,
      Vd, VdPct, In, ibLeIn, inLeIz, i2LeCheck,
      Isc, IscKA, minEarthMm2, earthReqMm2, capKVAr, capI, maxCapI,
    };
  }, [inp]);

  // ── Build checks ──
  type CheckDef = {
    title: string; standard: string; clause: string; status: CheckStatus;
    purpose: string; formula: string; variables: string[]; inputs: string[];
    steps: string[]; result: string; explanation: string;
  };

  const checks: CheckDef[] = useMemo(() => {
    const { kva, secondaryV, phases, impedancePct, permittedLoadingPct,
      loadKW, loadPF, targetPF, cableSize, conductor, insulation,
      cableLength, ambientTemp, groupSize, numRuns,
      installedBreaker, faultClearTime, currentPF } = inp;
    const {
      ratedI, loadKVA, loadI, loadingPct, Ib, baseAmp, Ct, Cg, Iz,
      Vd, VdPct, In, ibLeIn, inLeIz, i2LeCheck,
      Isc, IscKA, minEarthMm2, earthReqMm2, capKVAr, capI,
    } = calcs;

    return [
      // 1. Transformer loading
      {
        title: 'Transformer Loading Check',
        standard: 'IEC 60076-1 / IEC 60076-7',
        clause: 'Cl. 4.1, Loading Guide Cl. 7',
        status: loadingPct === 0 ? 'INCOMPLETE' : loadingPct > 100 ? 'FAIL' : loadingPct > permittedLoadingPct ? 'WARNING' : 'PASS',
        purpose: 'Verify that the transformer is not overloaded beyond its thermal rating. Sustained overloading degrades insulation life.',
        formula: 'Loading% = S_load / S_rated × 100',
        variables: [
          'S_load = apparent power demand (kVA)',
          'S_rated = transformer rated kVA',
          'Permitted loading typically 80% for design margin',
        ],
        inputs: [
          `S_rated = ${kva} kVA`,
          `Load P = ${loadKW} kW`,
          `Load PF = ${loadPF}`,
          `S_load = P/PF = ${loadKVA.toFixed(1)} kVA`,
          `Permitted = ${permittedLoadingPct}%`,
        ],
        steps: [
          `S_load = ${loadKW} / ${loadPF} = ${loadKVA.toFixed(1)} kVA`,
          `Loading% = (${loadKVA.toFixed(1)} / ${kva}) × 100 = ${loadingPct.toFixed(1)}%`,
          `Permitted limit = ${permittedLoadingPct}%`,
          `Check: ${loadingPct.toFixed(1)}% ${loadingPct <= permittedLoadingPct ? '≤' : '>'} ${permittedLoadingPct}%`,
        ],
        result: `Loading = ${loadingPct.toFixed(1)}% — ${loadingPct <= permittedLoadingPct ? 'within' : 'EXCEEDS'} permitted limit of ${permittedLoadingPct}%`,
        explanation: 'Transformers can sustain short-term overloads but continuous operation above rated capacity accelerates insulation degradation (Arrhenius rule: 6°C rise halves insulation life). IEC 60076-7 provides detailed thermal models for oil transformers.',
      },

      // 2. Cable ampacity
      {
        title: 'Cable Ampacity Check',
        standard: 'IEC 60364-5-52',
        clause: 'Table B.52.4, Cl. 523',
        status: Iz === 0 ? 'INCOMPLETE' : Ib > Iz ? 'FAIL' : Ib > Iz * 0.9 ? 'WARNING' : 'PASS',
        purpose: 'Verify the cable current-carrying capacity (after derating) is not exceeded by the design current.',
        formula: 'Iz_derated = Iz_base × Ct × Cg\nCheck: Ib ≤ Iz_derated',
        variables: [
          'Iz_base = tabulated ampacity (A)',
          'Ct = temperature correction factor',
          'Cg = grouping derating factor',
          'Ib = design current (A)',
        ],
        inputs: [
          `Cable: ${cableSize}mm² ${conductor}/${insulation}`,
          `Iz_base = ${baseAmp} A (Method E, tray)`,
          `Ambient = ${ambientTemp}°C → Ct = ${Ct.toFixed(3)}`,
          `Group size = ${groupSize} → Cg = ${Cg.toFixed(2)}`,
          `Runs = ${numRuns}`,
          `Ib = ${Ib.toFixed(1)} A`,
        ],
        steps: [
          `Iz_single = ${baseAmp} × ${Ct.toFixed(3)} × ${Cg.toFixed(2)} = ${(baseAmp * Ct * Cg).toFixed(1)} A`,
          `Iz_total = ${(baseAmp * Ct * Cg).toFixed(1)} × ${numRuns} runs = ${Iz.toFixed(1)} A`,
          `Check: Ib (${Ib.toFixed(1)} A) ${Ib <= Iz ? '≤' : '>'} Iz (${Iz.toFixed(1)} A)`,
        ],
        result: `Iz = ${Iz.toFixed(1)} A, Ib = ${Ib.toFixed(1)} A — ${Ib <= Iz ? 'PASS' : 'FAIL: cable undersized'}`,
        explanation: 'The derating ensures the conductor does not exceed its maximum permitted operating temperature. Exceeding Iz accelerates insulation aging and creates fire risk. The grouping factor accounts for mutual heating between adjacent cables in a bundle or tray.',
      },

      // 3. Voltage drop
      {
        title: 'Voltage Drop Check',
        standard: 'IEC 60364-5-52',
        clause: 'Table B.52.12, Cl. 525',
        status: VdPct === 0 ? 'INCOMPLETE' : VdPct > 5 ? 'FAIL' : VdPct > 3 ? 'WARNING' : 'PASS',
        purpose: 'Ensure the voltage at load terminals does not fall below equipment operating limits. Excessive VD causes overheating and poor motor starting.',
        formula: 'Vd = √3 × I × L × (R·cosφ + X·sinφ)\nVd% = (Vd / V_nominal) × 100',
        variables: [
          'I = load current (A)',
          'L = cable length (km)',
          'R = resistance per km (Ω/km)',
          'X = reactance per km (Ω/km)',
          'cosφ = power factor, sinφ = reactive component',
        ],
        inputs: [
          `I = ${Ib.toFixed(1)} A`,
          `L = ${cableLength} m = ${(cableLength / 1000).toFixed(3)} km`,
          `R = ${conductor === 'Cu' ? (SIZES.indexOf(cableSize) >= 0 ? RES_CU[SIZES.indexOf(cableSize)] : '?') : (SIZES.indexOf(cableSize) >= 0 ? RES_AL[SIZES.indexOf(cableSize)] : '?')} Ω/km`,
          `PF = ${loadPF}`,
          `V_nominal = ${secondaryV} V`,
        ],
        steps: [
          `cosφ = ${loadPF}, sinφ = √(1−${loadPF}²) = ${Math.sqrt(1 - loadPF * loadPF).toFixed(4)}`,
          `Vd = 1.732 × ${Ib.toFixed(1)} × ${(cableLength / 1000).toFixed(3)} × (R×${loadPF} + X×${Math.sqrt(1 - loadPF * loadPF).toFixed(4)})`,
          `Vd = ${Vd.toFixed(3)} V`,
          `Vd% = (${Vd.toFixed(3)} / ${secondaryV}) × 100 = ${VdPct.toFixed(2)}%`,
          `Check: ${VdPct.toFixed(2)}% ${VdPct <= 3 ? '≤' : VdPct <= 5 ? '≤' : '>'} ${VdPct <= 3 ? '3%' : VdPct <= 5 ? '5%' : '5%'} limit`,
        ],
        result: `VD = ${Vd.toFixed(2)} V (${VdPct.toFixed(2)}%) — IEC limit: 3% recommended, 5% maximum`,
        explanation: 'IEC 60364-5-52 recommends ≤3% VD for normal circuits and ≤5% for final circuits. For motors, high VD increases running current, reduces torque, and can prevent starting. The resistive and reactive components both contribute; at lower PF the reactive term becomes significant.',
      },

      // 4. Overload protection Ib ≤ In ≤ Iz
      {
        title: 'Overload Protection Check: Ib ≤ In ≤ Iz',
        standard: 'IEC 60364-4-43',
        clause: 'Cl. 433.1',
        status: (!ibLeIn || !inLeIz) ? 'FAIL' : 'PASS',
        purpose: 'Ensure the protective device rating (In) is correctly coordinated between the design current (Ib) and the cable ampacity (Iz).',
        formula: 'Ib ≤ In ≤ Iz',
        variables: [
          'Ib = design current (A)',
          'In = nominal current of protective device (A)',
          'Iz = current-carrying capacity of cable (A)',
        ],
        inputs: [
          `Ib = ${Ib.toFixed(1)} A (load current)`,
          `In = ${In} A (installed breaker)`,
          `Iz = ${Iz.toFixed(1)} A (cable derated ampacity)`,
        ],
        steps: [
          `Condition 1: Ib ≤ In → ${Ib.toFixed(1)} ≤ ${In} → ${ibLeIn ? 'PASS' : 'FAIL'}`,
          `Condition 2: In ≤ Iz → ${In} ≤ ${Iz.toFixed(1)} → ${inLeIz ? 'PASS' : 'FAIL'}`,
          `Overall: ${ibLeIn && inLeIz ? 'Both conditions satisfied — PASS' : 'One or more conditions FAILED'}`,
        ],
        result: `Ib(${Ib.toFixed(1)}) ${ibLeIn ? '≤' : '>'} In(${In}) ${inLeIz ? '≤' : '>'} Iz(${Iz.toFixed(1)}) — ${ibLeIn && inLeIz ? 'PASS' : 'FAIL'}`,
        explanation: 'The protective device must carry the design current (Ib) without tripping, while the cable must carry the device rating (In) without overheating. If In > Iz, the cable can overheat before the device trips, causing insulation damage and fire risk.',
      },

      // 5. I2 ≤ 1.45 × Iz
      {
        title: 'Effective Protection Check: I₂ ≤ 1.45 × Iz',
        standard: 'IEC 60364-4-43',
        clause: 'Cl. 433.1 condition (b)',
        status: !i2LeCheck ? 'FAIL' : 'PASS',
        purpose: 'Verify that the current at which the protective device operates within 1 hour (I₂) does not exceed 1.45 × Iz, ensuring the cable is not damaged before the device trips.',
        formula: 'I₂ ≤ 1.45 × Iz\n(For standard CBs: I₂ = 1.45 × In)',
        variables: [
          'I₂ = current causing device to operate within 1h',
          'In = rated current of device',
          '1.45 = safety factor per IEC 60364-4-43',
          'Iz = cable current-carrying capacity',
        ],
        inputs: [
          `In = ${In} A`,
          `I₂ = 1.45 × ${In} = ${(In * 1.45).toFixed(1)} A`,
          `Iz = ${Iz.toFixed(1)} A`,
          `1.45 × Iz = ${(Iz * 1.45).toFixed(1)} A`,
        ],
        steps: [
          `I₂ = 1.45 × In = 1.45 × ${In} = ${(In * 1.45).toFixed(1)} A`,
          `1.45 × Iz = 1.45 × ${Iz.toFixed(1)} = ${(Iz * 1.45).toFixed(1)} A`,
          `Check: I₂ (${(In * 1.45).toFixed(1)}) ${i2LeCheck ? '≤' : '>'} 1.45×Iz (${(Iz * 1.45).toFixed(1)})`,
        ],
        result: `I₂ = ${(In * 1.45).toFixed(1)} A vs 1.45×Iz = ${(Iz * 1.45).toFixed(1)} A — ${i2LeCheck ? 'PASS' : 'FAIL'}`,
        explanation: 'Standard circuit breakers have a tripping curve where at 1.45×In they trip within 1 hour. If 1.45×In > Iz, the cable reaches its maximum temperature before the breaker trips. This is especially relevant for semi-enclosed fuses where the 2×In convention applies.',
      },

      // 6. Short-circuit breaking capacity
      {
        title: 'Short-Circuit Breaking Capacity Check',
        standard: 'IEC 60947-2',
        clause: 'Cl. 8.3.2 — Rated short-circuit breaking capacity (Icu)',
        status: IscKA === 0 ? 'INCOMPLETE' : (In <= 63 && IscKA > 6) ? 'FAIL' : (In <= 1600 && IscKA > 50) ? 'FAIL' : 'PASS',
        purpose: 'Verify the protective device has sufficient breaking capacity to safely interrupt the prospective short-circuit current.',
        formula: 'Isc = I_rated / (Zk%/100)\nRequired: Icu ≥ Isc',
        variables: [
          'Isc = prospective short-circuit current at point of installation',
          'I_rated = transformer rated secondary current',
          'Zk% = transformer short-circuit impedance',
          'Icu = rated ultimate breaking capacity of device',
        ],
        inputs: [
          `kVA = ${kva}, V = ${secondaryV} V, Zk = ${impedancePct}%`,
          `I_rated = ${ratedI.toFixed(1)} A`,
          `Isc = ${ratedI.toFixed(1)} / (${impedancePct}/100) = ${Isc.toFixed(0)} A`,
          `Isc = ${IscKA.toFixed(2)} kA`,
          `Installed breaker: ${In} A`,
        ],
        steps: [
          `I_rated = ${kva}×1000 / (1.732×${secondaryV}) = ${ratedI.toFixed(1)} A`,
          `Isc = ${ratedI.toFixed(1)} / ${(impedancePct / 100).toFixed(4)} = ${Isc.toFixed(0)} A`,
          `Isc = ${IscKA.toFixed(2)} kA`,
          `Required Icu ≥ ${IscKA.toFixed(2)} kA`,
          `Check device type: ${In <= 63 ? 'MCB (typical Icu 6–10 kA)' : In <= 1600 ? 'MCCB (typical Icu 25–50 kA)' : 'ACB (typical Icu 42–65 kA)'}`,
        ],
        result: `Isc = ${IscKA.toFixed(2)} kA — Ensure installed ${In <= 63 ? 'MCB' : In <= 1600 ? 'MCCB' : 'ACB'} has Icu ≥ ${IscKA.toFixed(2)} kA`,
        explanation: 'If the breaking capacity is insufficient, the device will be destroyed during a fault, likely causing an arc flash, fire and loss of protection. MCCB Icu values range from 10–50 kA; for high fault levels (>25 kA), series current limiting or current-limiting fuses may be required.',
      },

      // 7. Earth conductor adiabatic
      {
        title: 'Earth Conductor Adiabatic Sizing Check',
        standard: 'IEC 60364-5-54',
        clause: 'Annex A, Eq. A.1',
        status: (cableSize / 2) < minEarthMm2 ? 'WARNING' : 'PASS',
        purpose: 'Verify the protective earth (PE) conductor can carry fault current for the fault clearance time without being damaged.',
        formula: 'S = (I × √t) / k\nWhere S = min. cross-section (mm²)',
        variables: [
          'I = fault current (A) = Isc',
          't = fault clearance time (s)',
          'k = material/insulation factor (Cu/XLPE=143, Cu/PVC=115)',
          'S = minimum conductor cross-section (mm²)',
        ],
        inputs: [
          `Isc = ${Isc.toFixed(0)} A`,
          `t = ${faultClearTime} s`,
          `Insulation: ${insulation} → k = ${insulation === 'XLPE' ? 143 : 115}`,
          `Phase cable: ${cableSize} mm²`,
          `Conventional min: ${cableSize}/2 = ${(cableSize / 2).toFixed(1)} mm²`,
        ],
        steps: [
          `k = ${insulation === 'XLPE' ? 143 : 115} (${insulation} insulated copper earth)`,
          `S_min = (${Isc.toFixed(0)} × √${faultClearTime}) / ${insulation === 'XLPE' ? 143 : 115}`,
          `S_min = (${Isc.toFixed(0)} × ${Math.sqrt(faultClearTime).toFixed(3)}) / ${insulation === 'XLPE' ? 143 : 115} = ${minEarthMm2.toFixed(2)} mm²`,
          `Min by convention (S_phase/2): ${(cableSize / 2).toFixed(1)} mm²`,
          `Required: max(${minEarthMm2.toFixed(2)}, ${(cableSize / 2).toFixed(1)}) = ${earthReqMm2.toFixed(2)} mm²`,
        ],
        result: `Minimum PE = ${earthReqMm2.toFixed(2)} mm² — select next standard size ≥ ${earthReqMm2.toFixed(0)} mm²`,
        explanation: 'During earth faults, the PE conductor carries fault current until the protective device clears the fault. The adiabatic equation assumes all heat is absorbed by the conductor (no cooling) — a conservative assumption valid for short fault durations. For t > 5 s, steady-state thermal checks are also required.',
      },

      // 8. Capacitor bank current check
      {
        title: 'Capacitor Bank Current Check',
        standard: 'IEC 60831-1',
        clause: 'Cl. 6.1, 6.3',
        status: capKVAr <= 0 ? 'INCOMPLETE' : 'PASS',
        purpose: 'Verify correct capacitor bank sizing for power factor correction and ensure the contactor/fuse is rated for capacitor inrush and continuous current.',
        formula: 'Qc = P×(tanφ₁ − tanφ₂)\nIc = Qc×1000 / (√3×V)\nI_max = 1.3 × Ic',
        variables: [
          'Qc = reactive power to be compensated (kVAr)',
          'P = active power (kW)',
          'φ₁ = existing PF angle, φ₂ = target PF angle',
          'Ic = nominal capacitor current (A)',
          '1.3 = IEC 60831 overrating factor for contactors',
        ],
        inputs: [
          `P = ${loadKW} kW`,
          `Current PF = ${currentPF}`,
          `Target PF = ${targetPF}`,
          `V = ${secondaryV} V, phases = ${phases}`,
        ],
        steps: [
          `tanφ₁ = tan(acos(${currentPF})) = ${Math.tan(Math.acos(currentPF)).toFixed(4)}`,
          `tanφ₂ = tan(acos(${targetPF})) = ${Math.tan(Math.acos(targetPF)).toFixed(4)}`,
          `Qc = ${loadKW} × (${Math.tan(Math.acos(currentPF)).toFixed(4)} − ${Math.tan(Math.acos(targetPF)).toFixed(4)}) = ${capKVAr.toFixed(2)} kVAr`,
          `Ic = ${capKVAr.toFixed(2)}×1000 / (1.732×${secondaryV}) = ${capI.toFixed(1)} A`,
          `I_contactor = 1.3 × ${capI.toFixed(1)} = ${(capI * 1.3).toFixed(1)} A`,
        ],
        result: `Qc = ${capKVAr.toFixed(2)} kVAr, Ic = ${capI.toFixed(1)} A, Contactor rating ≥ ${(capI * 1.3).toFixed(1)} A`,
        explanation: 'Capacitors draw inrush current significantly higher than steady-state. IEC 60831 requires the switching device to handle at least 1.3× the rated capacitor current for continuous duty. The fuse rating is typically 1.6–2× rated current to avoid nuisance tripping on inrush.',
      },
    ] as CheckDef[];
  }, [inp, calcs]);

  const overallStatus: CheckStatus = useMemo(() => {
    const statuses = checks.map(c => c.status);
    if (statuses.some(s => s === 'FAIL')) return 'FAIL';
    if (statuses.some(s => s === 'WARNING')) return 'WARNING';
    if (statuses.some(s => s === 'INCOMPLETE')) return 'INCOMPLETE';
    return 'PASS';
  }, [checks]);

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0F172A,#1E3A5F)',
        border: '1px solid #1D4ED8',
        borderRadius: 12, padding: '18px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(99,102,241,0.4)' }}>
          <Shield style={{ width: 26, height: 26, color: '#A78BFA' }} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>IEC CROSS VERIFICATION DASHBOARD</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
            Independent verification of distribution design against IEC 60076, IEC 60364, IEC 60947-2, IEC 60831
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge status={overallStatus} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

        {/* Input panel */}
        <div style={{
          background: 'var(--ec-bg-surface)', border: '1px solid var(--ec-border)',
          borderRadius: 12, padding: 20, height: 'fit-content', position: 'sticky', top: 20,
        }}>
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

        {/* Checks panel */}
        <div>
          {/* Summary matrix */}
          <div style={{ background: 'var(--ec-bg-surface)', border: '1px solid var(--ec-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Verification Summary Matrix</div>
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
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid var(--ec-border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-root)' }}
                      onClick={() => toggle(i)}
                    >
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

          {/* Accordion checks */}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Detailed Verification Checks — Click to expand</div>
          {checks.map((c, i) => (
            <CheckCard
              key={i}
              {...c}
              expanded={expanded.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}

          {/* Disclaimer */}
          <div style={{ marginTop: 16, fontSize: 11, color: '#F59E0B', background: '#F59E0B11', border: '1px solid #F59E0B33', borderRadius: 8, padding: '10px 14px' }}>
            ⚠️ Engineering Aid Only — These checks are indicative only. All calculations require review and approval by a qualified electrical engineer (IEng/CEng) before construction, procurement or energization. Site conditions, utility data and detailed engineering studies may alter results.
          </div>
        </div>
      </div>
    </div>
  );
}
