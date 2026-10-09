import React, { useState } from 'react';
import { Calculator, Zap, Shield, Database, Globe, Cpu, Battery, Activity, BarChart3, Download } from 'lucide-react';
import { downloadReport, tableHTML } from '../../utils/reportDownload';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  CalcButton, TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#7C3AED';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

type CalcTab = 'sc' | 'arcflash' | 'relay' | 'ct' | 'grid' | 'pu' | 'ngr' | 'battery' | 'reliability' | 'txfault';
const TABS: { key: CalcTab; label: string; icon: React.ElementType }[] = [
  { key: 'sc',          label: '3-Phase Short Circuit',  icon: Zap },
  { key: 'txfault',     label: 'Transformer Fault',      icon: Activity },
  { key: 'arcflash',    label: 'Arc Flash (HV)',          icon: Shield },
  { key: 'relay',       label: 'IDMT Settings',          icon: Shield },
  { key: 'ct',          label: 'CT / PT Selection',      icon: BarChart3 },
  { key: 'grid',        label: 'Ground Grid (IEEE 80)',   icon: Globe },
  { key: 'pu',          label: 'Per-Unit System',        icon: Calculator },
  { key: 'ngr',         label: 'NGR Sizing',             icon: Zap },
  { key: 'battery',     label: 'DC Battery (Substation)', icon: Battery },
  { key: 'reliability', label: 'Reliability Indices',     icon: Database },
];

// ─── 1. SHORT CIRCUIT ──────────────────────────────────────────────────────
function ShortCircuitCalc() {
  const { addCalculation } = useStore();
  const [kV, setkV] = useState('11');
  const [mvasc, setMvasc] = useState('250');
  const [txMVA, setTxMVA] = useState('5');
  const [txZpct, setTxZpct] = useState('6');
  const [cableZ, setCableZ] = useState('0.05');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const V_kV = parseFloat(kV); const MVAsc = parseFloat(mvasc);
    const Sn = parseFloat(txMVA); const Zk = parseFloat(txZpct) / 100;
    const Zc = parseFloat(cableZ);
    const sqrt3 = Math.sqrt(3);
    // System impedance at 11kV
    const Zsys_pu = 1 / (MVAsc / (V_kV * V_kV)); // in MVA base = Sn
    const Zbase = (V_kV * V_kV) / Sn; // Ω
    const Zsys_ohm = Zsys_pu * Zbase;
    const Ztx_ohm = Zk * (V_kV * V_kV) / Sn; // Ω secondary referred
    const Ztotal = Zsys_ohm + Ztx_ohm + Zc;
    const Isc_3ph = (V_kV * 1000) / (sqrt3 * Ztotal); // A
    const Isc_kA = Isc_3ph / 1000;
    const MVAsc_total = sqrt3 * V_kV * Isc_kA;
    // Asymmetric peak (crest) factor for X/R ~ 10: kpeak ≈ 1.8
    const kpeak = 1.8;
    const Ipeak = kpeak * sqrt3 * Isc_kA; // kA peak
    // Single-phase: If = 3Vph/(Z1+Z2+Z0), assume Z1=Z2=Z0 simplification
    const Isc_1ph = Isc_3ph * 0.87; // approximate for balanced system

    const res: CalculationResult = {
      values: [
        { label: 'System Z (Ω at 11 kV)', value: Zsys_ohm.toFixed(4), unit: 'Ω' },
        { label: 'Transformer Z (Ω)', value: Ztx_ohm.toFixed(4), unit: 'Ω' },
        { label: 'Total Impedance', value: Ztotal.toFixed(4), unit: 'Ω' },
        { label: '3-Phase Fault Current (Isc)', value: Isc_kA.toFixed(3), unit: 'kA (rms)', highlight: true },
        { label: 'Fault Level (MVA)', value: MVAsc_total.toFixed(1), unit: 'MVA' },
        { label: 'Asymmetric Peak Current', value: Ipeak.toFixed(3), unit: 'kA peak' },
        { label: 'Single-Phase Earth Fault (approx)', value: Isc_1ph.toFixed(3), unit: 'kA' },
      ],
      status: 'INFO',
      recommendation: `3-phase fault current at 11 kV bus = ${Isc_kA.toFixed(3)} kA (${MVAsc_total.toFixed(1)} MVA). Asymmetric peak = ${Ipeak.toFixed(3)} kA. All switchgear and busbars must be rated ≥ ${Math.ceil(Isc_kA * 10) / 10} kA (rms) symmetrical. Breaker rated peak making capacity must be ≥ ${Ipeak.toFixed(2)} kA.`,
      formula: 'Isc = V / (√3 × Z_total)  ·  Z_total = Z_system + Z_transformer + Z_cable',
      steps: [
        { step: 1, description: 'System impedance (referred to 11 kV)', formula: `Zbase = kV²/Sn = ${V_kV}²/${Sn} = ${Zbase.toFixed(4)} Ω, Zpu_sys = Sn/MVAsc = ${Sn}/${MVAsc}, Zsys = ${Zsys_ohm.toFixed(4)} Ω`, result: `${Zsys_ohm.toFixed(4)} Ω` },
        { step: 2, description: 'Transformer impedance', formula: `Ztx = Zk% × kV²/Sn = ${txZpct}% × ${V_kV}²/${Sn} = ${Ztx_ohm.toFixed(4)} Ω`, result: `${Ztx_ohm.toFixed(4)} Ω` },
        { step: 3, description: 'Total impedance', formula: `Z = ${Zsys_ohm.toFixed(4)} + ${Ztx_ohm.toFixed(4)} + ${Zc} = ${Ztotal.toFixed(4)} Ω`, result: `${Ztotal.toFixed(4)} Ω` },
        { step: 4, description: '3-phase fault current', formula: `Isc = ${V_kV}×1000 / (√3×${Ztotal.toFixed(4)}) = ${(V_kV*1000).toFixed(0)}/${(sqrt3*Ztotal).toFixed(4)}`, result: `${Isc_kA.toFixed(3)} kA rms` },
        { step: 5, description: 'Asymmetric peak current', formula: `Ipeak = kpeak × √2 × Isc = ${kpeak} × √2 × ${Isc_kA.toFixed(3)} kA`, result: `${Ipeak.toFixed(3)} kA peak` },
      ],
      standardRef: { standard: 'IEC 60909', clause: '4.2', title: 'Short-circuit currents in three-phase a.c. systems' },
    };
    setResult(res);
    addCalculation({ type: 'hv-short-circuit', title: `HV Short Circuit — ${Isc_kA.toFixed(2)} kA at ${kV} kV`, inputs: { kV, mvasc, txMVA, txZpct, cableZ }, results: res, notes: '', standard: 'IEC 60909' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="System Parameters" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="System Voltage" value={kV} onChange={setkV} unit="kV" tooltip="Nominal voltage at the fault point (e.g. 11 kV, 33 kV)" />
          <TextInput label="Grid Fault Level (Utility)" value={mvasc} onChange={setMvasc} unit="MVA" tooltip="Available short-circuit MVA from the grid at the supply point (from utility)" />
        </FieldRow>
        <SectionLabel title="Source Transformer" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Transformer Rating" value={txMVA} onChange={setTxMVA} unit="MVA" tooltip="Rated kVA/MVA of the source transformer" />
          <TextInput label="Impedance (Zk%)" value={txZpct} onChange={setTxZpct} unit="%" tooltip="Short-circuit impedance percentage from nameplate (typically 5–7% for HV transformers)" />
        </FieldRow>
        <TextInput label="Cable/Line Impedance" value={cableZ} onChange={setCableZ} unit="Ω" tooltip="Positive sequence impedance of connecting cables/lines between transformer and bus" />
        <CalcButton onClick={calculate} label="Calculate Short Circuit" icon={Zap} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 2. TRANSFORMER FAULT CURRENT ─────────────────────────────────────────
function TransformerFaultCalc() {
  const { addCalculation } = useStore();
  const [kVA, setkVA] = useState('2000');
  const [primkV, setPrimkV] = useState('33');
  const [seckV, setSeckV] = useState('11');
  const [Zk, setZk] = useState('6.5');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const S = parseFloat(kVA) / 1000; // MVA
    const V1 = parseFloat(primkV); const V2 = parseFloat(seckV);
    const z = parseFloat(Zk) / 100;
    const sqrt3 = Math.sqrt(3);
    const In_prim = S / (sqrt3 * V1); // kA
    const In_sec  = S / (sqrt3 * V2); // kA
    const Isc_sec = In_sec / z;
    const Isc_prim = Isc_sec * (V2 / V1); // reflected to primary
    const Isc_MVA = sqrt3 * V2 * Isc_sec;
    const Inrush = In_sec * 10; // typical 8-12× for inrush

    const res: CalculationResult = {
      values: [
        { label: 'Full Load Current (Primary)', value: `${(In_prim*1000).toFixed(1)}`, unit: 'A', highlight: true },
        { label: 'Full Load Current (Secondary)', value: `${(In_sec*1000).toFixed(1)}`, unit: 'A', highlight: true },
        { label: 'Max Fault Current (Secondary)', value: `${Isc_sec.toFixed(3)}`, unit: 'kA' },
        { label: 'Fault Current (Primary reflected)', value: `${(Isc_prim*1000).toFixed(1)}`, unit: 'A' },
        { label: 'Fault Level at Secondary', value: `${Isc_MVA.toFixed(2)}`, unit: 'MVA' },
        { label: 'Typical Inrush (10× FLC)', value: `${(Inrush*1000).toFixed(0)}`, unit: 'A' },
        { label: 'X/R Ratio (typical HV tx)', value: '15–25', unit: '' },
      ],
      status: 'INFO',
      recommendation: `Transformer ${kVA} kVA, ${primkV}/${seckV} kV, Z=${Zk}%. Max secondary fault = ${Isc_sec.toFixed(3)} kA — all secondary switchgear must be rated ≥ this level. Primary protection (HRC fuse or overcurrent relay) must clear within transformer short-circuit withstand time (typically 2 s at 100% Isc per IEC 60076-5). Inrush current ${(Inrush*1000).toFixed(0)} A — differential relay must have inrush restraint (2nd harmonic blocking).`,
      formula: 'In = S/(√3×V)  ·  Isc = In/z%  ·  Inrush ≈ 8–12× In',
      steps: [
        { step: 1, description: 'Full load current (secondary)', formula: `In_sec = S/(√3×V2) = ${S}×1000/(√3×${V2}) = ${(In_sec*1000).toFixed(1)} A`, result: `${(In_sec*1000).toFixed(1)} A` },
        { step: 2, description: 'Full load current (primary)', formula: `In_prim = S/(√3×V1) = ${S}×1000/(√3×${V1}) = ${(In_prim*1000).toFixed(1)} A`, result: `${(In_prim*1000).toFixed(1)} A` },
        { step: 3, description: 'Maximum fault current (secondary bus)', formula: `Isc = In_sec / z = ${(In_sec*1000).toFixed(1)} / ${Zk/100} = ${Isc_sec.toFixed(3)} kA`, result: `${Isc_sec.toFixed(3)} kA (limited by transformer Z only)` },
        { step: 4, description: 'Fault level at secondary bus', formula: `MVAsc = √3 × ${V2} × ${Isc_sec.toFixed(3)} kA = ${Isc_MVA.toFixed(2)} MVA`, result: `${Isc_MVA.toFixed(2)} MVA` },
      ],
      standardRef: { standard: 'IEC 60076-5', clause: '4', title: 'Power transformers — Ability to withstand short circuit' },
    };
    setResult(res);
    addCalculation({ type: 'hv-transformer-fault', title: `Tx Fault — ${Isc_sec.toFixed(3)} kA at ${seckV} kV`, inputs: { kVA, primkV, seckV, Zk }, results: res, notes: '', standard: 'IEC 60076-5' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="Transformer Nameplate" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Rating" value={kVA} onChange={setkVA} unit="kVA" />
          <TextInput label="Impedance Zk%" value={Zk} onChange={setZk} unit="%" tooltip="Short-circuit voltage percentage from nameplate" />
        </FieldRow>
        <FieldRow cols="1fr 1fr">
          <TextInput label="Primary Voltage" value={primkV} onChange={setPrimkV} unit="kV" />
          <TextInput label="Secondary Voltage" value={seckV} onChange={setSeckV} unit="kV" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Calculate Transformer Fault" icon={Activity} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 3. ARC FLASH (HV) ────────────────────────────────────────────────────
function ArcFlashHV() {
  const { addCalculation } = useStore();
  const [ibf, setIbf] = useState('10');
  const [voltage, setVoltage] = useState('11');
  const [arcDur, setArcDur] = useState('0.1');
  const [workDist, setWorkDist] = useState('914');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const Ibf = parseFloat(ibf); const V_kV = parseFloat(voltage);
    const t = parseFloat(arcDur); const D = parseFloat(workDist);
    // IEEE 1584-2002 simplified (applicable 1–15 kV range)
    const log_Ia = 0.00402 + 0.983 * Math.log10(Ibf);
    const Ia = Math.pow(10, log_Ia);
    const lg_En = -0.792 - 0.555 * Math.log10(D) + 0.973 * Math.log10(Ia) + 0.0011 * 153; // gap 153mm for MV
    const En = Math.pow(10, lg_En);
    const E = 4.184 * 0.85 * En * (t / 0.2) * Math.pow(610 / D, 2); // cal/cm²
    // AFB at 1.2 cal/cm²
    const AFB = 610 * Math.pow(4.184 * 0.85 * En * (t / 0.2) / 1.2, 0.5); // mm
    const PPE = E < 1.2 ? 'Cat 0' : E < 4 ? 'Cat 1' : E < 8 ? 'Cat 2' : E < 25 ? 'Cat 3' : E < 40 ? 'Cat 4' : 'DANGER — Prohibited';

    const res: CalculationResult = {
      values: [
        { label: 'Bolted Fault Current', value: Ibf.toString(), unit: 'kA' },
        { label: 'Arcing Current (Ia)', value: Ia.toFixed(2), unit: 'kA' },
        { label: 'Arc Duration', value: arcDur, unit: 's' },
        { label: 'Incident Energy', value: E.toFixed(2), unit: 'cal/cm²', highlight: true },
        { label: 'Arc Flash Boundary', value: (AFB / 1000).toFixed(2), unit: 'm at 1.2 cal/cm²' },
        { label: 'PPE Category (NFPA 70E)', value: PPE, unit: '', highlight: true, status: E < 40 ? (E < 8 ? 'PASS' : 'WARNING') : 'FAIL' },
      ],
      status: E < 40 ? 'WARNING' : 'FAIL',
      recommendation: `Incident energy = ${E.toFixed(2)} cal/cm² at ${workDist} mm. PPE: ${PPE}. Arc flash boundary = ${(AFB/1000).toFixed(2)} m. CRITICAL: Reduce arc duration by ensuring protection relay operates in < ${arcDur} s. Consider bus differential relay (87B) or zone-selective interlocking for instantaneous clearing. All personnel within ${(AFB/1000).toFixed(2)} m must wear ${PPE} PPE during energised work.`,
      formula: 'log(Ia) = 0.00402 + 0.983×log(Ibf)  ·  E = 4.184×Cf×En×(t/0.2)×(610/D)²',
      steps: [
        { step: 1, description: 'Arcing current (IEEE 1584-2002, 1–15 kV)', formula: `log(Ia) = 0.00402 + 0.983×log(${Ibf}) = ${log_Ia.toFixed(4)}`, result: `Ia = ${Ia.toFixed(2)} kA` },
        { step: 2, description: 'Normalised incident energy at 0.2s, 610mm', formula: `log(En) = −0.792 − 0.555×log(${D}) + 0.973×log(${Ia.toFixed(2)}) + 0.0011×153 = ${lg_En.toFixed(4)}`, result: `En = ${En.toFixed(4)} J/cm²` },
        { step: 3, description: 'Incident energy at actual conditions', formula: `E = 4.184×0.85×En×(${t}/0.2)×(610/${D})² = ${E.toFixed(2)} cal/cm²`, result: `${E.toFixed(2)} cal/cm²` },
        { step: 4, description: 'Arc flash boundary (AFB at 1.2 cal/cm²)', formula: `AFB = 610×√(E/1.2) = ${AFB.toFixed(0)} mm`, result: `${(AFB/1000).toFixed(2)} m` },
        { step: 5, description: 'PPE category (NFPA 70E Table 130.7)', formula: `E = ${E.toFixed(2)} cal/cm² → ${PPE}`, result: PPE },
      ],
      standardRef: { standard: 'IEEE 1584-2002 / NFPA 70E-2021', clause: '5', title: 'Arc-Flash Hazard Calculations — HV equipment' },
    };
    setResult(res);
    addCalculation({ type: 'hv-arc-flash', title: `HV Arc Flash — ${E.toFixed(1)} cal/cm², ${PPE}`, inputs: { ibf, voltage, arcDur, workDist }, results: res, notes: '', standard: 'IEEE 1584' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="System Parameters" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="System Voltage" value={voltage} onChange={setVoltage} unit="kV" tooltip="Nominal voltage (1–15 kV range for IEEE 1584-2002)" />
          <TextInput label="Bolted Fault Current (Ibf)" value={ibf} onChange={setIbf} unit="kA" tooltip="Available 3-phase fault current at equipment location" />
        </FieldRow>
        <FieldRow cols="1fr 1fr">
          <TextInput label="Arc Duration" value={arcDur} onChange={setArcDur} unit="s" tooltip="Total arc duration = relay time + CB operating time (e.g. 0.06+0.05 = 0.11s)" />
          <TextInput label="Working Distance" value={workDist} onChange={setWorkDist} unit="mm" tooltip="Distance from arc source to worker's face/chest (typical: 914mm for MV switchgear)" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Calculate Arc Flash" icon={Shield} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 4. IDMT RELAY SETTINGS ────────────────────────────────────────────────
function IDMTSettingsCalc() {
  const { addCalculation } = useStore();
  const [flc, setFlc] = useState('262');
  const [ctRatio, setCtRatio] = useState('400');
  const [faultCurr, setFaultCurr] = useState('8000');
  const [ctiReq, setCtiReq] = useState('0.35');
  const [dnstreamTime, setDnstreamTime] = useState('0.40');
  const [curve, setCurve] = useState('SI');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const FLC = parseFloat(flc); const CTp = parseFloat(ctRatio);
    const If = parseFloat(faultCurr); const CTI = parseFloat(ctiReq);
    const t_down = parseFloat(dnstreamTime);
    // Required trip time at fault current
    const t_req = t_down + CTI;
    // Plug setting: 1.05–1.3 × FLC
    const PS_primary = FLC * 1.25; // 1.25× FLC
    const PS_sec = PS_primary / CTp * 5; // in secondary amps for 5A CT
    const PS_mult = PS_sec / 5; // as fraction of In
    const M = If / PS_primary; // fault multiplier
    // Calculate required TMS
    let TMS = 0.1;
    const calcTime = (tms: number, m: number): number => {
      if (m <= 1) return Infinity;
      switch (curve) {
        case 'SI':  return tms * 0.14 / (Math.pow(m, 0.02) - 1);
        case 'VI':  return tms * 13.5 / (m - 1);
        case 'EI':  return tms * 80 / (m * m - 1);
        case 'LTI': return tms * 120 / (m - 1);
        default:    return tms * 0.14 / (Math.pow(m, 0.02) - 1);
      }
    };
    // Find TMS to achieve t_req at M
    let tmsCalc = t_req;
    switch (curve) {
      case 'SI':  tmsCalc = t_req * (Math.pow(M, 0.02) - 1) / 0.14; break;
      case 'VI':  tmsCalc = t_req * (M - 1) / 13.5; break;
      case 'EI':  tmsCalc = t_req * (M * M - 1) / 80; break;
      case 'LTI': tmsCalc = t_req * (M - 1) / 120; break;
    }
    TMS = Math.ceil(tmsCalc / 0.025) * 0.025; // round up to nearest 0.025
    const actualTime = calcTime(TMS, M);

    const res: CalculationResult = {
      values: [
        { label: 'Plug Setting (primary current)', value: PS_primary.toFixed(0), unit: 'A', highlight: true },
        { label: 'Plug Setting Multiplier', value: PS_mult.toFixed(2), unit: '× In' },
        { label: 'Current Multiplier (M) at fault', value: M.toFixed(2), unit: '× Is' },
        { label: 'Required TMS (calculated)', value: tmsCalc.toFixed(3), unit: '' },
        { label: 'Selected TMS (rounded up)', value: TMS.toFixed(3), unit: '', highlight: true },
        { label: 'Trip Time at Fault Current', value: actualTime.toFixed(3), unit: 's' },
        { label: 'Required Trip Time (t_dn + CTI)', value: `${t_down} + ${CTI} = ${t_req.toFixed(2)}`, unit: 's' },
        { label: 'Grading Margin Achieved', value: (actualTime - t_down).toFixed(3), unit: 's', status: (actualTime - t_down) >= CTI ? 'PASS' : 'FAIL' },
      ],
      status: (actualTime - t_down) >= CTI ? 'PASS' : 'FAIL',
      recommendation: `Set PS = ${PS_mult.toFixed(2)} (${PS_primary.toFixed(0)} A primary), TMS = ${TMS.toFixed(3)}, Curve = ${curve}. At ${If} A fault: relay trips in ${actualTime.toFixed(3)} s, providing ${(actualTime-t_down).toFixed(3)} s CTI above downstream (${CTI} s required). ${(actualTime-t_down) >= CTI ? 'Coordination achieved.' : 'INCREASE TMS — insufficient coordination time interval.'}`,
      formula: 'PS = 1.25 × FLC  ·  M = If / PS  ·  TMS derived from required trip time and curve equation',
      steps: [
        { step: 1, description: 'Plug setting (1.25 × FLC, rounded to CT primary)', formula: `PS = 1.25 × ${FLC} = ${PS_primary.toFixed(0)} A (primary), ${PS_mult.toFixed(2)} × In`, result: `${PS_primary.toFixed(0)} A primary` },
        { step: 2, description: 'Current multiplier at fault current', formula: `M = I_fault / PS = ${If} / ${PS_primary.toFixed(0)} = ${M.toFixed(2)}`, result: `M = ${M.toFixed(2)}` },
        { step: 3, description: 'Required trip time (grading with downstream)', formula: `t_req = t_downstream + CTI = ${t_down} + ${CTI} = ${t_req.toFixed(2)} s`, result: `${t_req.toFixed(2)} s` },
        { step: 4, description: `TMS calculation (${curve} curve equation)`, formula: `TMS_calc = ${tmsCalc.toFixed(3)}`, result: `Select TMS = ${TMS.toFixed(3)} (next 0.025 step up)` },
        { step: 5, description: 'Verify actual trip time at selected TMS', formula: `t = ${TMS.toFixed(3)} × ... = ${actualTime.toFixed(3)} s`, result: `Grading margin = ${(actualTime-t_down).toFixed(3)} s (need ${CTI} s) → ${(actualTime-t_down) >= CTI ? 'PASS' : 'FAIL'}` },
      ],
      standardRef: { standard: 'IEC 60255-151 / IEEE 242', clause: '4', title: 'IDMT Relay Settings and Coordination' },
    };
    setResult(res);
    addCalculation({ type: 'hv-relay-settings', title: `IDMT Settings — PS=${PS_mult.toFixed(2)}, TMS=${TMS.toFixed(3)}`, inputs: { flc, ctRatio, faultCurr, ctiReq, dnstreamTime, curve }, results: res, notes: '', standard: 'IEC 60255-151' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="Circuit Parameters" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Full Load Current (FLC)" value={flc} onChange={setFlc} unit="A" tooltip="Maximum continuous load current (primary)" />
          <TextInput label="CT Ratio (Primary)" value={ctRatio} onChange={setCtRatio} unit="A/5A" />
        </FieldRow>
        <TextInput label="Maximum Fault Current" value={faultCurr} onChange={setFaultCurr} unit="A" tooltip="3-phase fault current at relay location" />
        <SectionLabel title="Coordination Requirements" />
        <SelectInput label="IDMT Curve" value={curve} onChange={setCurve} options={[
          { value: 'SI',  label: 'Standard Inverse (SI)' },
          { value: 'VI',  label: 'Very Inverse (VI)' },
          { value: 'EI',  label: 'Extremely Inverse (EI)' },
          { value: 'LTI', label: 'Long Time Inverse (LTI)' },
        ]} />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Downstream Relay Trip Time" value={dnstreamTime} onChange={setDnstreamTime} unit="s" tooltip="Trip time of downstream relay at the same fault current" />
          <TextInput label="Required CTI" value={ctiReq} onChange={setCtiReq} unit="s" tooltip="Coordination Time Interval — minimum grading margin (typically 0.3–0.4 s)" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Calculate Relay Settings" icon={Shield} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 5. CT/PT SELECTION ────────────────────────────────────────────────────
function CTSelectionCalc() {
  const { addCalculation } = useStore();
  const [flc, setFlc] = useState('262');
  const [isc, setIsc] = useState('8000');
  const [burdenVA, setBurdenVA] = useState('15');
  const [lead, setLead] = useState('10');
  const [wireSize, setWireSize] = useState('2.5');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const FLC = parseFloat(flc); const Isc = parseFloat(isc);
    const B = parseFloat(burdenVA); const L = parseFloat(lead);
    const A = parseFloat(wireSize);
    // CT primary: 1.2 × FLC, rounded to next standard
    const standards = [5,10,15,20,25,30,40,50,60,75,100,150,200,250,300,400,500,600,800,1000,1200,1500,2000,3000,4000,5000];
    const ctMin = 1.2 * FLC;
    const ctPrimary = standards.find((s) => s >= ctMin) ?? 5000;
    // ALF (Accuracy Limit Factor) required
    const ALFReq = Isc / ctPrimary;
    const ALFRounded = ALFReq <= 10 ? 10 : 20; // 5P10 or 5P20
    // Lead resistance
    const ρCu = 0.0175; // Ω·mm²/m
    const Rlead = ρCu * 2 * L / A; // 2× for return conductor
    const totalBurden = B + (5 * 5 * Rlead); // relay VA + lead losses at 5A
    const kneePt = ALFRounded * (totalBurden + 1.5); // approximate knee point VA

    const res: CalculationResult = {
      values: [
        { label: 'CT Primary Rating', value: `${ctPrimary}/5`, unit: 'A', highlight: true },
        { label: 'Minimum CT Primary (1.2×FLC)', value: ctMin.toFixed(0), unit: 'A' },
        { label: 'Required ALF (Isc/CTp)', value: ALFReq.toFixed(1), unit: '×' },
        { label: 'Recommended Accuracy Class', value: `5P${ALFRounded}`, unit: '', highlight: true },
        { label: 'Lead Resistance (both ways)', value: Rlead.toFixed(3), unit: 'Ω' },
        { label: 'Total Burden at 5A', value: `${(totalBurden).toFixed(1)}`, unit: 'VA' },
        { label: 'Approx. Knee-Point Voltage', value: kneePt.toFixed(0), unit: 'V' },
      ],
      status: 'INFO',
      recommendation: `Select CT ${ctPrimary}/5A, accuracy class 5P${ALFRounded}. Lead resistance ${Rlead.toFixed(3)} Ω. Total secondary burden ${totalBurden.toFixed(1)} VA — CT rated burden must be ≥ this. Knee-point voltage (approx) ${kneePt.toFixed(0)} V — verify with manufacturer datasheet. For differential protection (87): use matched CTs with consistent accuracy class on all ends.`,
      formula: 'CT_primary = 1.2 × FLC (rounded up to std)  ·  ALF = I_sc / CT_primary  ·  Vk ≥ ALF × (Rct + Rlead + Rrelay)',
      steps: [
        { step: 1, description: 'Minimum CT primary current', formula: `1.2 × FLC = 1.2 × ${FLC} = ${ctMin.toFixed(0)} A`, result: `Select ${ctPrimary}/5A (next standard above ${ctMin.toFixed(0)} A)` },
        { step: 2, description: 'Required ALF (Accuracy Limit Factor)', formula: `ALF = I_sc / CT_primary = ${Isc} / ${ctPrimary} = ${ALFReq.toFixed(1)}`, result: `Select 5P${ALFRounded} class CT` },
        { step: 3, description: 'Lead resistance (copper, both ways)', formula: `Rlead = 0.0175 × 2 × ${L} / ${A} = ${Rlead.toFixed(3)} Ω`, result: `${Rlead.toFixed(3)} Ω` },
        { step: 4, description: 'Total secondary burden', formula: `B_relay ${B} VA + lead loss at 5A = ${totalBurden.toFixed(1)} VA`, result: `${totalBurden.toFixed(1)} VA — CT must have rated burden ≥ this` },
      ],
      standardRef: { standard: 'IEC 61869-2', clause: '5.6.201', title: 'Additional requirements for current transformers' },
    };
    setResult(res);
    addCalculation({ type: 'hv-ct-selection', title: `CT Selection — ${ctPrimary}/5A 5P${ALFRounded}`, inputs: { flc, isc, burdenVA, lead, wireSize }, results: res, notes: '', standard: 'IEC 61869-2' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="Load and Fault Data" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Full Load Current" value={flc} onChange={setFlc} unit="A" />
          <TextInput label="Max Fault Current (primary)" value={isc} onChange={setIsc} unit="A" tooltip="Maximum through-fault current — determines required ALF" />
        </FieldRow>
        <SectionLabel title="Secondary Circuit" />
        <TextInput label="Relay + Meter Burden" value={burdenVA} onChange={setBurdenVA} unit="VA" tooltip="Total burden of all connected devices at 5A (from device datasheets)" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Cable Run (one way)" value={lead} onChange={setLead} unit="m" tooltip="One-way length of secondary lead cable" />
          <TextInput label="Cable CSA" value={wireSize} onChange={setWireSize} unit="mm²" tooltip="Cross-sectional area of secondary wiring (copper)" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Select CT Rating" icon={BarChart3} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 6. GROUND GRID (IEEE 80) ─────────────────────────────────────────────
function GroundGridCalc() {
  const { addCalculation } = useStore();
  const [area, setArea] = useState('40');
  const [condLen, setCondLen] = useState('200');
  const [soilRho, setSoilRho] = useState('50');
  const [faultCurr, setFaultCurr] = useState('5000');
  const [faultTime, setFaultTime] = useState('0.5');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const A = parseFloat(area); const L = parseFloat(condLen);
    const ρ = parseFloat(soilRho); const If = parseFloat(faultCurr);
    const t = parseFloat(faultTime);
    const sqrt3 = Math.sqrt(3);
    // Approximate Schwarz formula for grid resistance
    const r = Math.sqrt(A / Math.PI); // equivalent circular radius (m)
    const Rg = (ρ / (4 * r)) + (ρ / L); // Ω (simplified Schwarz)
    // Body tolerance factor (50 kg person, 50 Hz)
    const Ks = 0.116 / Math.sqrt(t);
    // Permissible touch voltage (no surface layer)
    const Cs = 1.0;
    const Vt_max = (1000 + 1.5 * ρ * Cs) * Ks;
    const Vs_max = (1000 + 6 * ρ * Cs) * Ks;
    // Actual GPR and touch voltage
    const GPR = Rg * If;
    // Touch voltage = typically 50% of GPR for well-designed grid
    const Vt_actual = GPR * 0.5;
    const rOK = Rg <= 1.0;
    const touchOK = Vt_actual <= Vt_max;

    const res: CalculationResult = {
      values: [
        { label: 'Grid Resistance Rg (Schwarz)', value: Rg.toFixed(3), unit: 'Ω', highlight: true, status: rOK ? 'PASS' : 'WARNING' },
        { label: 'Ground Potential Rise (GPR)', value: GPR.toFixed(0), unit: 'V' },
        { label: 'Permissible Touch Voltage', value: Vt_max.toFixed(1), unit: 'V' },
        { label: 'Permissible Step Voltage', value: Vs_max.toFixed(1), unit: 'V' },
        { label: 'Estimated Touch Voltage', value: Vt_actual.toFixed(0), unit: 'V', status: touchOK ? 'PASS' : 'FAIL' },
        { label: 'Conductor Length', value: condLen, unit: 'm' },
        { label: 'Grid Area', value: area, unit: 'm²' },
      ],
      status: rOK && touchOK ? 'PASS' : 'FAIL',
      recommendation: `Grid resistance Rg = ${Rg.toFixed(3)} Ω. GPR = ${GPR.toFixed(0)} V. ${!rOK ? 'Rg > 1 Ω — add more conductors or ground rods to reduce resistance.' : 'Grid resistance acceptable.'} ${!touchOK ? `Estimated touch voltage ${Vt_actual.toFixed(0)} V exceeds ${Vt_max.toFixed(0)} V — add surface crushed rock layer (ρs ~2500 Ω·m) or reduce fault clearing time.` : 'Touch voltage within permissible limit.'}`,
      formula: 'Rg = ρ/(4r) + ρ/L  ·  Vt_max = (1000+1.5ρs)×0.116/√t  ·  GPR = Rg×If',
      steps: [
        { step: 1, description: 'Equivalent grid radius', formula: `r = √(A/π) = √(${A}/π) = ${r.toFixed(2)} m`, result: `r = ${r.toFixed(2)} m` },
        { step: 2, description: 'Grid resistance (simplified Schwarz, IEEE 80 eq.52)', formula: `Rg = ρ/(4r) + ρ/L = ${ρ}/(4×${r.toFixed(2)}) + ${ρ}/${L} = ${Rg.toFixed(3)} Ω`, result: `${Rg.toFixed(3)} Ω` },
        { step: 3, description: 'Ground potential rise during fault', formula: `GPR = Rg × If = ${Rg.toFixed(3)} × ${If} = ${GPR.toFixed(0)} V`, result: `${GPR.toFixed(0)} V` },
        { step: 4, description: 'Permissible touch voltage (50 kg, 50 Hz)', formula: `Vt = (1000+1.5×${ρ})×0.116/√${t} = ${Vt_max.toFixed(1)} V`, result: `${Vt_max.toFixed(1)} V permissible` },
        { step: 5, description: 'Touch voltage assessment', formula: `Vt_actual ≈ 0.5×GPR = ${Vt_actual.toFixed(0)} V vs ${Vt_max.toFixed(1)} V limit`, result: touchOK ? 'PASS' : 'FAIL — add surface layer or reduce fault time' },
      ],
      standardRef: { standard: 'IEEE 80-2013', clause: '16.1', title: 'Guide for Safety in AC Substation Grounding' },
    };
    setResult(res);
    addCalculation({ type: 'hv-ground-grid', title: `Ground Grid — Rg=${Rg.toFixed(3)} Ω, GPR=${GPR.toFixed(0)} V`, inputs: { area, condLen, soilRho, faultCurr, faultTime }, results: res, notes: '', standard: 'IEEE 80' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="Grid Geometry" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Grid Area" value={area} onChange={setArea} unit="m²" tooltip="Total area enclosed by the earthing grid" />
          <TextInput label="Total Conductor Length" value={condLen} onChange={setCondLen} unit="m" tooltip="Sum of all grid conductors + rod lengths (L)" />
        </FieldRow>
        <TextInput label="Soil Resistivity" value={soilRho} onChange={setSoilRho} unit="Ω·m" tooltip="Average soil resistivity (from Wenner 4-electrode measurement)" />
        <SectionLabel title="Fault Parameters" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Max Earth Fault Current" value={faultCurr} onChange={setFaultCurr} unit="A" />
          <TextInput label="Fault Clearing Time" value={faultTime} onChange={setFaultTime} unit="s" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Evaluate Ground Grid" icon={Globe} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 7. PER-UNIT SYSTEM ───────────────────────────────────────────────────
function PerUnitCalc() {
  const { addCalculation } = useStore();
  const [mvaBase, setMvaBase] = useState('10');
  const [kv1, setKv1] = useState('33');
  const [kv2, setKv2] = useState('11');
  const [txZpct, setTxZpct] = useState('6.5');
  const [txMVA, setTxMVA] = useState('5');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const Sb = parseFloat(mvaBase); const V1 = parseFloat(kv1); const V2 = parseFloat(kv2);
    const Zk = parseFloat(txZpct) / 100; const Sn = parseFloat(txMVA);
    const Zbase1 = V1 * V1 / Sb; // Ω
    const Zbase2 = V2 * V2 / Sb; // Ω
    const Ibase1 = Sb / (Math.sqrt(3) * V1); // kA
    const Ibase2 = Sb / (Math.sqrt(3) * V2); // kA
    // Convert Tx Z from machine base to system base
    const Zpu_tx = Zk * (Sb / Sn); // pu on system MVA base
    const Isc_pu = 1 / Zpu_tx; // pu (at 1pu voltage)
    const Isc_kA = Isc_pu * Ibase2; // kA

    const res: CalculationResult = {
      values: [
        { label: 'MVA Base', value: mvaBase, unit: 'MVA' },
        { label: 'kV Base (Primary)', value: kv1, unit: 'kV' },
        { label: 'kV Base (Secondary)', value: kv2, unit: 'kV' },
        { label: 'Zbase (Primary)', value: Zbase1.toFixed(3), unit: 'Ω' },
        { label: 'Zbase (Secondary)', value: Zbase2.toFixed(3), unit: 'Ω', highlight: true },
        { label: 'Ibase (Primary)', value: `${(Ibase1*1000).toFixed(1)}`, unit: 'A' },
        { label: 'Ibase (Secondary)', value: `${(Ibase2*1000).toFixed(1)}`, unit: 'A', highlight: true },
        { label: 'Transformer Zpu (on system base)', value: Zpu_tx.toFixed(4), unit: 'pu' },
        { label: 'Max Fault Current (secondary)', value: Isc_kA.toFixed(3), unit: 'kA' },
      ],
      status: 'INFO',
      recommendation: `System base: ${mvaBase} MVA, ${kv1}/${kv2} kV. Transformer Z converted to system base = ${Zpu_tx.toFixed(4)} pu. Maximum fault current at secondary bus = ${Isc_kA.toFixed(3)} kA (assuming negligible source impedance). Use these base values consistently across all equipment in the per-unit study.`,
      formula: 'Zbase = kVbase² / MVAbase  ·  Ibase = MVAbase / (√3 × kVbase)  ·  Zpu_new = Zpu_old × (MVAbase_new/MVAbase_old)',
      steps: [
        { step: 1, description: 'Base impedance (primary side)', formula: `Zbase1 = ${kv1}² / ${mvaBase} = ${Zbase1.toFixed(3)} Ω`, result: `${Zbase1.toFixed(3)} Ω` },
        { step: 2, description: 'Base impedance (secondary side)', formula: `Zbase2 = ${kv2}² / ${mvaBase} = ${Zbase2.toFixed(3)} Ω`, result: `${Zbase2.toFixed(3)} Ω` },
        { step: 3, description: 'Base current (secondary)', formula: `Ibase2 = ${mvaBase} / (√3 × ${kv2}) = ${(Ibase2*1000).toFixed(1)} A`, result: `${(Ibase2*1000).toFixed(1)} A` },
        { step: 4, description: 'Transformer impedance on system base', formula: `Zpu_tx = ${Zk.toFixed(3)} × (${mvaBase}/${txMVA}) = ${Zpu_tx.toFixed(4)} pu`, result: `${Zpu_tx.toFixed(4)} pu` },
        { step: 5, description: 'Max fault current at secondary', formula: `Isc = 1/Zpu × Ibase = 1/${Zpu_tx.toFixed(4)} × ${(Ibase2*1000).toFixed(1)} A`, result: `${Isc_kA.toFixed(3)} kA` },
      ],
      standardRef: { standard: 'IEC 60909 / IEEE 242', clause: '3', title: 'Per-Unit System for Power System Analysis' },
    };
    setResult(res);
    addCalculation({ type: 'hv-per-unit', title: `Per-Unit System — ${mvaBase} MVA base, ${kv1}/${kv2} kV`, inputs: { mvaBase, kv1, kv2, txZpct, txMVA }, results: res, notes: '', standard: 'IEC 60909' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="System Base" />
        <FieldRow cols="1fr 1fr 1fr">
          <TextInput label="MVA Base" value={mvaBase} onChange={setMvaBase} unit="MVA" tooltip="Chosen system base (typically 10, 100 or transformer rating)" />
          <TextInput label="kV Base (Primary)" value={kv1} onChange={setKv1} unit="kV" tooltip="Primary voltage base" />
          <TextInput label="kV Base (Secondary)" value={kv2} onChange={setKv2} unit="kV" tooltip="Secondary voltage base" />
        </FieldRow>
        <SectionLabel title="Source Transformer (for fault study)" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Transformer MVA" value={txMVA} onChange={setTxMVA} unit="MVA" />
          <TextInput label="Transformer Zk%" value={txZpct} onChange={setTxZpct} unit="%" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Calculate Per-Unit Bases" icon={Calculator} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 8. NGR SIZING ────────────────────────────────────────────────────────
function NGRSizingCalc() {
  const { addCalculation } = useStore();
  const [kV, setkV] = useState('11');
  const [igLimit, setIgLimit] = useState('400');
  const [duration, setDuration] = useState('10');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const V_kV = parseFloat(kV); const Ig = parseFloat(igLimit); const t = parseFloat(duration);
    const Vln = (V_kV * 1000) / Math.sqrt(3); // V
    const R_ngr = Vln / Ig; // Ω
    const P_cont = Ig * Ig * R_ngr; // W continuous
    const P_fault = Ig * Ig * R_ngr; // same but for duration t (thermal sizing)
    const E_thermal = P_fault * t / 1000; // kJ
    const pOK = R_ngr > 0;

    const res: CalculationResult = {
      values: [
        { label: 'Phase-to-Neutral Voltage', value: Vln.toFixed(0), unit: 'V' },
        { label: 'NGR Resistance', value: R_ngr.toFixed(2), unit: 'Ω', highlight: true },
        { label: 'Earth Fault Current Limited To', value: igLimit, unit: 'A', highlight: true },
        { label: 'Continuous Power Rating', value: `${(P_cont/1000).toFixed(2)}`, unit: 'kW' },
        { label: 'Thermal Energy (for duration)', value: E_thermal.toFixed(1), unit: 'kJ' },
        { label: 'Rating Duration', value: duration, unit: 's' },
      ],
      status: pOK ? 'INFO' : 'FAIL',
      recommendation: `Neutral Grounding Resistor: ${R_ngr.toFixed(2)} Ω at ${kV} kV. Earth fault current limited to ${igLimit} A — provides high-resistance earthing reducing arc flash hazard while maintaining ground fault detection. NGR must be rated for ${(P_cont/1000).toFixed(2)} kW continuous / ${E_thermal.toFixed(1)} kJ for ${duration} s duration. Specify IEEE C62.92.4 or IEC 60099 compliant NGR. Install NGR protection relay (64N) set to detect minimum fault current.`,
      formula: 'R_NGR = V_LN / I_GF_limit  ·  V_LN = V_LL / √3  ·  P = I² × R',
      steps: [
        { step: 1, description: 'Phase-to-neutral voltage', formula: `V_LN = ${V_kV} × 1000 / √3 = ${Vln.toFixed(0)} V`, result: `${Vln.toFixed(0)} V` },
        { step: 2, description: 'NGR resistance for fault current limit', formula: `R = V_LN / I_limit = ${Vln.toFixed(0)} / ${igLimit} = ${R_ngr.toFixed(2)} Ω`, result: `${R_ngr.toFixed(2)} Ω` },
        { step: 3, description: 'Power dissipated during earth fault', formula: `P = I² × R = ${igLimit}² × ${R_ngr.toFixed(2)} = ${P_cont.toFixed(0)} W = ${(P_cont/1000).toFixed(2)} kW`, result: `${(P_cont/1000).toFixed(2)} kW` },
        { step: 4, description: 'Thermal duty (sizing for fault duration)', formula: `E = P × t = ${(P_cont/1000).toFixed(2)} kW × ${duration} s = ${E_thermal.toFixed(1)} kJ`, result: `NGR must withstand ${E_thermal.toFixed(1)} kJ in ${duration} s` },
      ],
      standardRef: { standard: 'IEEE C62.92.4 / IEC 60099', clause: '4.2', title: 'Neutral Grounding in Industrial Systems' },
    };
    setResult(res);
    addCalculation({ type: 'hv-ngr', title: `NGR Sizing — ${R_ngr.toFixed(2)} Ω, ${igLimit} A limit`, inputs: { kV, igLimit, duration }, results: res, notes: '', standard: 'IEEE C62.92.4' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="NGR Parameters" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="System Voltage" value={kV} onChange={setkV} unit="kV" />
          <TextInput label="Max Earth Fault Current" value={igLimit} onChange={setIgLimit} unit="A" tooltip="Maximum permissible earth fault current (design choice: 100–400 A for HV)" />
        </FieldRow>
        <TextInput label="Fault Duration for Thermal Rating" value={duration} onChange={setDuration} unit="s" tooltip="Time until protection clears fault — NGR must withstand this thermal duty" />
        <CalcButton onClick={calculate} label="Size NGR" icon={Zap} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 9. SUBSTATION BATTERY ────────────────────────────────────────────────
function SubstationBatteryCalc() {
  const { addCalculation } = useStore();
  const [vdc, setVdc] = useState('110');
  const [pload, setPload] = useState('2500');
  const [auton, setAuton] = useState('8');
  const [dod, setDod] = useState('80');
  const [eta, setEta] = useState('90');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lm, setLm] = useState(true);

  const calculate = () => {
    const Vdc = parseFloat(vdc); const P = parseFloat(pload);
    const t = parseFloat(auton); const DoD = parseFloat(dod) / 100;
    const η = parseFloat(eta) / 100;
    const I = P / Vdc; // A
    const Ah_net = I * t; // required Ah
    const Ah_rated = Ah_net / (DoD * η); // rated Ah (accounting for DoD and efficiency)
    // Cell count for 110V DC (1.8V/cell discharge, 2.25V/cell float)
    const cells = Math.ceil(Vdc / 1.8);
    const strings = 1; // assume single string
    const Ah_rounded = Math.ceil(Ah_rated / 50) * 50; // round to next 50 Ah

    const res: CalculationResult = {
      values: [
        { label: 'DC Load Current', value: I.toFixed(1), unit: 'A' },
        { label: 'Required Net Ah', value: Ah_net.toFixed(1), unit: 'Ah' },
        { label: 'Rated Battery Ah (with DoD & η)', value: Ah_rated.toFixed(1), unit: 'Ah', highlight: true },
        { label: 'Selected Capacity', value: Ah_rounded.toString(), unit: 'Ah' },
        { label: 'Number of Cells (110V DC)', value: cells.toString(), unit: 'cells' },
        { label: 'Cell Type', value: 'Lead-Acid VRLA or NiCd', unit: '' },
        { label: 'Float Voltage per Cell', value: '2.25', unit: 'V' },
      ],
      status: 'INFO',
      recommendation: `110V DC substation battery: ${Ah_rounded} Ah @ C${t} rate (${t}-hour discharge). Cells: ${cells} in series. Load ${P} W, autonomy ${auton} hours, DoD ${dod}%. Charger rated: ${(I * 1.15).toFixed(0)} A @ ${(cells * 2.25).toFixed(1)} V float. Consider VRLA (VRLA-AGM or GEL) for sealed installation or vented NiCd for extreme temperatures. Test capacity annually per IEEE 450.`,
      formula: 'Ah = (P/V) × t / (DoD × η)  ·  Cells = V_dc / V_cell_discharge',
      steps: [
        { step: 1, description: 'DC load current', formula: `I = P/V = ${P}/${Vdc} = ${I.toFixed(1)} A`, result: `${I.toFixed(1)} A` },
        { step: 2, description: 'Required Ah over autonomy period', formula: `Ah_net = I × t = ${I.toFixed(1)} × ${auton} = ${Ah_net.toFixed(1)} Ah`, result: `${Ah_net.toFixed(1)} Ah` },
        { step: 3, description: 'Rated capacity (accounting for DoD and efficiency)', formula: `Ah_rated = ${Ah_net.toFixed(1)} / (${DoD} × ${η}) = ${Ah_rated.toFixed(1)} Ah`, result: `${Ah_rated.toFixed(1)} Ah` },
        { step: 4, description: 'Cell count for 110V DC system', formula: `Cells = ${Vdc}V / 1.8V per cell = ${cells} cells`, result: `${cells} cells (VRLA lead-acid)` },
      ],
      standardRef: { standard: 'IEEE 485 / IEEE 1188', clause: '5', title: 'Recommended Practice for Sizing Lead-Acid Batteries for Stationary Applications' },
    };
    setResult(res);
    addCalculation({ type: 'hv-battery-dc', title: `Substation DC Battery — ${Ah_rounded} Ah, ${vdc} V`, inputs: { vdc, pload, auton, dod, eta }, results: res, notes: '', standard: 'IEEE 485' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InputPanel>
        <SectionLabel title="DC System" />
        <FieldRow cols="1fr 1fr">
          <SelectInput label="DC Bus Voltage" value={vdc} onChange={setVdc} options={[
            { value: '24',  label: '24V DC' },
            { value: '48',  label: '48V DC' },
            { value: '110', label: '110V DC (substation std)' },
            { value: '125', label: '125V DC (IEEE std)' },
            { value: '220', label: '220V DC' },
          ]} />
          <TextInput label="Total DC Load" value={pload} onChange={setPload} unit="W" tooltip="Sum of all DC loads: relay coils, SCADA, communications, charger, etc." />
        </FieldRow>
        <TextInput label="Required Autonomy" value={auton} onChange={setAuton} unit="hours" tooltip="Time battery must support load without AC (typically 4–8 hours for substations)" />
        <FieldRow cols="1fr 1fr">
          <TextInput label="Max Depth of Discharge" value={dod} onChange={setDod} unit="%" tooltip="Max DoD before battery cutoff — 80% for lead-acid, 90% for NiCd" />
          <TextInput label="Battery Efficiency" value={eta} onChange={setEta} unit="%" tooltip="Battery efficiency (charge/discharge) — typically 85–92%" />
        </FieldRow>
        <CalcButton onClick={calculate} label="Size DC Battery" icon={Battery} accentColor={ACCENT} />
      </InputPanel>
      <ResultPanel result={result} learningMode={lm} setLearningMode={setLm} accentColor={ACCENT} />
      {result && lm && <div style={{ gridColumn: '1/-1' }}><StepByStep steps={result.steps ?? []} /></div>}
    </div>
  );
}

// ─── 10. RELIABILITY INDICES ──────────────────────────────────────────────
function ReliabilityCalc() {
  const [custTotal, setCustTotal] = useState('5000');
  const [outages, setOutages] = useState('12');
  const [custAff, setCustAff] = useState('300');
  const [outDuration, setOutDuration] = useState('2.5');
  const [failures, setFailures] = useState('8');
  const [repairs, setRepairs] = useState('4');
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calc = () => {
    const N = parseFloat(custTotal); const K = parseFloat(outages);
    const ni = parseFloat(custAff); const ri = parseFloat(outDuration);
    const lambda = parseFloat(failures); const mu = parseFloat(repairs);
    const SAIFI = (K * ni) / N;
    const SAIDI = (K * ni * ri) / N;
    const CAIDI = SAIDI / SAIFI;
    const ASAI = 1 - SAIDI / 8760;
    const MTBF = 8760 / lambda; // hours
    const MTTR = 8760 / mu; // hours
    const Avail = MTBF / (MTBF + MTTR) * 100;

    setResult({
      values: [
        { label: 'SAIFI', value: SAIFI.toFixed(3), unit: 'interruptions/customer/yr', highlight: true },
        { label: 'SAIDI', value: SAIDI.toFixed(3), unit: 'hours/customer/yr', highlight: true },
        { label: 'CAIDI', value: CAIDI.toFixed(3), unit: 'hours/interruption' },
        { label: 'ASAI (System Availability)', value: `${(ASAI*100).toFixed(4)}%`, unit: '' },
        { label: 'MTBF', value: MTBF.toFixed(1), unit: 'hours' },
        { label: 'MTTR', value: MTTR.toFixed(2), unit: 'hours' },
        { label: 'Equipment Availability', value: `${Avail.toFixed(3)}%`, unit: '' },
      ],
      status: SAIFI < 2 && SAIDI < 5 ? 'PASS' : 'WARNING',
      recommendation: `SAIFI = ${SAIFI.toFixed(3)} interruptions/yr (target < 2). SAIDI = ${SAIDI.toFixed(3)} hr/yr (target < 5). ASAI = ${(ASAI*100).toFixed(4)}%. Equipment MTBF = ${MTBF.toFixed(0)} hr, MTTR = ${MTTR.toFixed(1)} hr, Availability = ${Avail.toFixed(3)}%. ${SAIFI >= 2 ? 'SAIFI exceeds target — review protection coordination to reduce sustained interruptions.' : ''} ${SAIDI >= 5 ? 'SAIDI exceeds target — improve restoration time through crew training and spares management.' : ''}`,
      formula: 'SAIFI = ΣλN/N_total  ·  SAIDI = ΣλN·r/N_total  ·  CAIDI = SAIDI/SAIFI  ·  MTBF = 8760/λ',
      steps: [
        { step: 1, description: 'System Average Interruption Frequency Index', formula: `SAIFI = (${K}×${ni}) / ${N} = ${SAIFI.toFixed(3)}`, result: `${SAIFI.toFixed(3)} int/customer/year` },
        { step: 2, description: 'System Average Interruption Duration Index', formula: `SAIDI = (${K}×${ni}×${ri}) / ${N} = ${SAIDI.toFixed(3)}`, result: `${SAIDI.toFixed(3)} hr/customer/year` },
        { step: 3, description: 'Customer Average Interruption Duration Index', formula: `CAIDI = SAIDI/SAIFI = ${SAIDI.toFixed(3)}/${SAIFI.toFixed(3)} = ${CAIDI.toFixed(3)}`, result: `${CAIDI.toFixed(3)} hr/interruption` },
        { step: 4, description: 'Mean Time Between Failures', formula: `MTBF = 8760/${lambda} = ${MTBF.toFixed(1)} hr`, result: `${MTBF.toFixed(1)} hr (${(MTBF/8760).toFixed(2)} years)` },
        { step: 5, description: 'Equipment Availability', formula: `A = MTBF/(MTBF+MTTR) = ${MTBF.toFixed(1)}/(${MTBF.toFixed(1)}+${MTTR.toFixed(1)}) = ${Avail.toFixed(3)}%`, result: `${Avail.toFixed(3)}%` },
      ],
      standardRef: { standard: 'IEEE 1366 / IEEE 493', clause: '3', title: 'IEEE Guide for Electric Power Distribution Reliability Indices' },
    });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 16 }}>System Reliability Inputs</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextInput label="Total Customers" value={custTotal} onChange={setCustTotal} unit="" />
            <TextInput label="Number of Outages/Year" value={outages} onChange={setOutages} unit="" />
            <TextInput label="Customers Affected per Outage" value={custAff} onChange={setCustAff} unit="" />
            <TextInput label="Avg Outage Duration" value={outDuration} onChange={setOutDuration} unit="hours" />
            <TextInput label="Equipment Failures/Year" value={failures} onChange={setFailures} unit="" />
            <TextInput label="Repairs Completed/Year" value={repairs} onChange={setRepairs} unit="" />
          </div>
          <CalcButton onClick={calc} label="Calculate Reliability Indices" icon={Database} accentColor={ACCENT} />
        </div>
        {result && (
          <div>
            <ResultPanel result={result} learningMode={false} setLearningMode={() => {}} accentColor={ACCENT} />
          </div>
        )}
      </div>
      {result && <StepByStep steps={result.steps ?? []} />}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function HVCalcsPage() {
  const [tab, setTab] = useState<CalcTab>('sc');
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Calculator} title="11kV HV CALCULATIONS" subtitle="IEC 60909 · IEEE 80 · IEEE 1584 · IEC 60255 · IEC 61869 · IEEE 485 · IEEE 1366" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => {
          const rows = [
            ['3-Phase Short Circuit', 'IEC 60909', 'Calculates symmetrical fault current, Z, X/R ratio and MVA fault level'],
            ['Transformer Fault Analysis', 'IEC 60909 · IEC 60076', 'Determines fault MVA, %Z contribution and transformer impedance at fault'],
            ['Arc Flash (HV)', 'IEEE 1584-2018', 'Computes incident energy, arc fault current and protection boundary distances'],
            ['IDMT Relay Settings', 'IEC 60255-151 · IEEE C37.112', 'Derives time multiplier setting (TMS), plug setting and grading margins'],
            ['CT / PT Selection', 'IEC 61869-2 / -3', 'Selects burden class, saturation voltage and accuracy class for CTs and PTs'],
            ['Ground Grid (IEEE 80)', 'IEEE 80-2013', 'Calculates touch voltage, step voltage, grid resistance and conductor size'],
            ['Per-Unit System', 'IEC 60909 · IEEE standards', 'Converts system impedances to per-unit on chosen MVA and kV base'],
            ['NGR Sizing', 'IEEE C62.92 · IEC 60364-4-41', 'Sizes neutral grounding resistor to limit earth fault current and step potential'],
            ['DC Battery (Substation)', 'IEEE 485 · IEEE 1188', 'Sizes VRLA / NiCd battery bank for substation DC auxiliary load'],
            ['Reliability Indices', 'IEEE 1366 · IEEE 493', 'Computes SAIFI, SAIDI, CAIDI, MTBF and equipment availability'],
          ];
          const body = `<h2>HV Calculation Modules — Reference Summary</h2>${tableHTML(['Calculator','Standard','Description'], rows)}
<h2>Engineering Notes</h2>
<p>All calculations comply with IEC 60909, IEEE 80, IEEE 1584, IEC 60255, IEC 61869, IEEE 485 and IEEE 1366. Results should be verified against the relevant OEM documentation and site-specific parameters. Use results to guide protection settings, equipment sizing and safety boundary determination.</p>`;
          downloadReport('11kV HV Calculations — Module Reference Report','10 Engineering Calculators · IEC / IEEE Standards','IEC 60909 · IEEE 80 · IEEE 1584 · IEC 60255 · IEC 61869 · IEEE 485 · IEEE 1366', body, 'HV-Calculations-Reference.pdf');
        }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', background: V.surf, borderRadius: 10, padding: 6, border: `1px solid ${V.brdM}` }}>
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7,
              background: isActive ? ACCENT : 'transparent', color: isActive ? '#fff' : V.sec,
              border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: isActive ? 700 : 500,
            }}>
              <t.icon style={{ width: 12, height: 12 }} />{t.label}
            </button>
          );
        })}
      </div>
      {tab === 'sc'          && <ShortCircuitCalc />}
      {tab === 'txfault'     && <TransformerFaultCalc />}
      {tab === 'arcflash'    && <ArcFlashHV />}
      {tab === 'relay'       && <IDMTSettingsCalc />}
      {tab === 'ct'          && <CTSelectionCalc />}
      {tab === 'grid'        && <GroundGridCalc />}
      {tab === 'pu'          && <PerUnitCalc />}
      {tab === 'ngr'         && <NGRSizingCalc />}
      {tab === 'battery'     && <SubstationBatteryCalc />}
      {tab === 'reliability' && <ReliabilityCalc />}
    </div>
  );
}
