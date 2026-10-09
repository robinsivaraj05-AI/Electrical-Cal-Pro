import React, { useState, useMemo, useCallback } from 'react';
import {
  Cpu, CheckCircle2, XCircle, AlertTriangle, Download,
  FileSpreadsheet, Info, RefreshCw,
} from 'lucide-react';
import { InputField, SelectField } from '../common/InputField';
import {
  calculate, generateBOM, validateResults,
  CABLE_SIZES, MCCB_SIZES, CONTACTOR_AC3,
  type PumpMotorInputs, type BOMItem, type ValidationCheck,
} from '../../utils/pumpMotorCalc';
import { exportPumpMotorPDF, exportPumpMotorExcel } from '../../utils/pumpMotorExport';

// ── CSS-var shorthand ────────────────────────────────────────
const V = {
  bg:   'var(--ec-bg-card)',
  bgD:  'var(--ec-bg-root)',
  inp:  'var(--ec-bg-input)',
  surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)',
  brdB: 'var(--ec-border)',
  brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)',
  sec:  'var(--ec-text-secondary)',
  muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)',
};

// ── Default inputs ──────────────────────────────────────────
const DEFAULT: PumpMotorInputs = {
  projectName: '', projectNo: '', plantArea: '', equipmentName: 'Centrifugal Pump',
  pumpTag: 'P-001', motorTag: 'M-001', application: 'Water Transfer',
  quantity: 1, preparedBy: '', date: new Date().toISOString().split('T')[0], remarks: '',
  motorKW: 11, voltage: 415, phase: '3', frequency: 50,
  powerFactor: 0.87, efficiency: 92, rpm: 1450,
  startingMethod: 'DOL', motorDuty: 'S1 Continuous', insulationClass: 'Class F', ipRating: 'IP55',
  dolMultiplier: 6, softStarterFactor: 3,
  cableLength: 50, installMethod: 'air', cableMaterial: 'Cu', numCores: 4,
  parallelRuns: 1, ambientTemp: 40, groupingFactor: 0.8,
  cableInsulation: 'XLPE', maxVoltageDrop: 5,
  mccbOverride: 0, contactorOverride: 0, olrOverrideLow: 0, olrOverrideHigh: 0,
  cableSizeOverride: 0, earthSizeOverride: 0,
  panelIP: 'IP54', controlVoltage: '230V AC',
  hasPressureSwitch: false, hasPressureXmtr: false, hasFlowSwitch: false,
  hasFlowMeter: false, hasLevelSwitch: false, hasTempSensor: false,
  hasVibration: false, hasLocalIsolator: true, hasLocalCS: false,
  hasJunctionBox: false, hasFlexConduit: true, hasCableTray: false,
};

const TABS = [
  { id: 'project',     label: '01 Project & Motor' },
  { id: 'calc',        label: '02 Calculations' },
  { id: 'protection',  label: '03 Protection' },
  { id: 'cable',       label: '04 Cable' },
  { id: 'starter',     label: '05 Starter BOM' },
  { id: 'panel',       label: '06 Panel & Field' },
  { id: 'bom',         label: '07 BOM & Cost' },
  { id: 'validation',  label: '08 Validation & Export' },
];

// ── Small UI helpers ─────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '12px 20px', background: V.surf, borderBottom: `1px solid ${V.brdM}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: V.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>{children}</div>;
}
function Grid4({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>{children}</div>;
}

function KPI({ label, value, unit = '', color, sub = '', highlight = false }:
  { label: string; value: string | number; unit?: string; color?: string; sub?: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? 'rgba(37,99,235,.10)' : V.surf,
      border: `1px solid ${highlight ? 'rgba(37,99,235,.30)' : V.brd}`,
      borderRadius: 12, padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, color: V.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? V.txt, letterSpacing: '-0.01em', lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: 13, fontWeight: 500, color: V.muted, marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: V.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: 'PASS' | 'WARNING' | 'FAIL' }) {
  const cfg = {
    PASS:    { bg: 'rgba(34,197,94,.12)',  border: 'rgba(34,197,94,.30)',  color: '#22C55E', icon: <CheckCircle2 style={{ width: 14, height: 14 }} /> },
    WARNING: { bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.30)', color: '#F59E0B', icon: <AlertTriangle style={{ width: 14, height: 14 }} /> },
    FAIL:    { bg: 'rgba(239,68,68,.12)',  border: 'rgba(239,68,68,.30)',  color: '#EF4444', icon: <XCircle style={{ width: 14, height: 14 }} /> },
  }[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
      {cfg.icon}{status}
    </span>
  );
}

function OverrideField({ label, auto, value, onChange, unit = 'A', options }:
  { label: string; auto: number; value: number; onChange: (v: number) => void; unit?: string; options?: number[] }) {
  const isOverride = value > 0;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: V.muted, fontWeight: 600 }}>{label}</span>
        <button
          onClick={() => onChange(isOverride ? 0 : auto)}
          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: `1px solid ${isOverride ? '#F59E0B' : V.brd}`, background: isOverride ? 'rgba(245,158,11,.10)' : V.surf, color: isOverride ? '#F59E0B' : V.muted, cursor: 'pointer' }}
        >
          {isOverride ? 'Manual' : 'Auto'}
        </button>
      </div>
      {options ? (
        <select
          value={isOverride ? value : auto}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%', height: 44, background: V.inp, border: `1px solid ${isOverride ? '#F59E0B' : V.brdB}`, borderRadius: 8, color: V.txt, fontSize: 14, padding: '0 12px' }}
        >
          {options.map((o) => <option key={o} value={o}>{o} {unit}</option>)}
        </select>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(37,99,235,.08)', borderRadius: 8, padding: '10px 14px', fontSize: 15, fontWeight: 700, color: '#60A5FA' }}>
            {isOverride ? value : auto} {unit}
          </div>
          {isOverride && (
            <input
              type="number" value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              style={{ width: 100, height: 44, background: V.inp, border: '1px solid #F59E0B', borderRadius: 8, color: V.txt, fontSize: 14, padding: '0 12px', textAlign: 'right' }}
            />
          )}
        </div>
      )}
      {!isOverride && <div style={{ fontSize: 11, color: V.muted, marginTop: 4, opacity: 0.7 }}>Auto-selected — click "Auto" to override</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, background: checked ? 'rgba(37,99,235,.08)' : V.surf, border: `1px solid ${checked ? 'rgba(37,99,235,.25)' : V.brd}`, transition: 'all 150ms' }}>
      <div style={{ width: 36, height: 20, borderRadius: 10, background: checked ? '#2563EB' : V.bg, border: `1px solid ${checked ? '#1D4ED8' : V.brdB}`, position: 'relative', flexShrink: 0, transition: 'all 150ms' }}>
        <div style={{ position: 'absolute', top: 2, left: checked ? 17 : 2, width: 14, height: 14, borderRadius: 7, background: '#fff', transition: 'left 150ms' }} />
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13, color: checked ? V.sec : V.muted, fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

// ── Main Component ───────────────────────────────────────────

export function PumpMotorCalc() {
  const [inp, setInp] = useState<PumpMotorInputs>(DEFAULT);
  const [tab, setTab]  = useState('project');
  const [bomCosts, setBomCosts] = useState<Record<string, number>>({});

  const set = useCallback(<K extends keyof PumpMotorInputs>(k: K, v: PumpMotorInputs[K]) =>
    setInp((p) => ({ ...p, [k]: v })), []);

  const num = (k: keyof PumpMotorInputs) => (v: string) => set(k, Number(v) as PumpMotorInputs[typeof k]);
  const str = (k: keyof PumpMotorInputs) => (v: string) => set(k, v as PumpMotorInputs[typeof k]);

  const calc   = useMemo(() => calculate(inp), [inp]);
  const bom    = useMemo(() => generateBOM(inp, calc), [inp, calc]);
  const checks = useMemo(() => validateResults(inp, calc), [inp, calc]);

  const bomWithCost: BOMItem[] = useMemo(() =>
    bom.map((item) => {
      const uc = bomCosts[item.id] ?? 0;
      return { ...item, unitCost: uc, totalCost: uc * item.qty };
    }), [bom, bomCosts]);

  const totalCost = bomWithCost.reduce((s, i) => s + i.totalCost, 0);
  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const failCount = checks.filter((c) => c.status === 'FAIL').length;
  const warnCount = checks.filter((c) => c.status === 'WARNING').length;

  const handleExportPDF   = () => exportPumpMotorPDF(inp, calc, bomWithCost, checks);
  const handleExportExcel = () => exportPumpMotorExcel(inp, calc, bomWithCost, checks);

  // ── Tab rendering ─────────────────────────────────────────

  const renderProject = () => (
    <>
      <SectionCard title="Project Details">
        <Grid3>
          <InputField label="Project Name" value={inp.projectName} onChange={str('projectName')} type="text" />
          <InputField label="Project Number" value={inp.projectNo} onChange={str('projectNo')} type="text" />
          <InputField label="Plant / Area" value={inp.plantArea} onChange={str('plantArea')} type="text" />
          <InputField label="Equipment Name" value={inp.equipmentName} onChange={str('equipmentName')} type="text" />
          <InputField label="Pump Tag" value={inp.pumpTag} onChange={str('pumpTag')} type="text" />
          <InputField label="Motor Tag" value={inp.motorTag} onChange={str('motorTag')} type="text" />
          <InputField label="Application" value={inp.application} onChange={str('application')} type="text" />
          <InputField label="Quantity (Sets)" value={inp.quantity} onChange={num('quantity')} min={1} step={1} />
          <InputField label="Prepared By" value={inp.preparedBy} onChange={str('preparedBy')} type="text" />
          <InputField label="Date" value={inp.date} onChange={str('date')} type="text" />
        </Grid3>
        <div style={{ marginTop: 16 }}>
          <InputField label="Remarks" value={inp.remarks} onChange={str('remarks')} type="text" />
        </div>
      </SectionCard>

      <SectionCard title="Motor Parameters">
        <Grid3>
          <InputField label="Motor Rating (kW)" value={inp.motorKW} onChange={num('motorKW')} min={0.37} step={0.1}
            tooltip="Enter actual motor rating e.g. 2.2, 5.5, 7.5, 11, 15, 22, 30, 45 kW" />
          <InputField label="Voltage (V)" value={inp.voltage} onChange={num('voltage')} min={110} step={1} />
          <SelectField label="Phase" value={inp.phase} onChange={str('phase')}
            options={[{ value: '3', label: '3-Phase (√3)' }, { value: '1', label: '1-Phase' }]} />
          <InputField label="Frequency (Hz)" value={inp.frequency} onChange={num('frequency')} min={50} max={60} step={10} />
          <InputField label="Power Factor (cosφ)" value={inp.powerFactor} onChange={num('powerFactor')} min={0.5} max={1} step={0.01} />
          <InputField label="Motor Efficiency (%)" value={inp.efficiency} onChange={num('efficiency')} min={50} max={99} step={0.1}
            tooltip="Motor nameplate efficiency percentage" />
          <InputField label="Rated Speed (RPM)" value={inp.rpm} onChange={num('rpm')} min={500} step={50} />
          <SelectField label="Starting Method" value={inp.startingMethod} onChange={str('startingMethod')}
            options={[
              { value: 'DOL', label: 'DOL — Direct On Line' },
              { value: 'Star-Delta', label: 'Star-Delta' },
              { value: 'Soft Starter', label: 'Soft Starter' },
              { value: 'VFD', label: 'VFD — Variable Frequency Drive' },
            ]} />
          <SelectField label="Motor Duty" value={inp.motorDuty} onChange={str('motorDuty')}
            options={[
              { value: 'S1 Continuous', label: 'S1 — Continuous' },
              { value: 'S2 Short-time', label: 'S2 — Short-time' },
              { value: 'S3 Intermittent', label: 'S3 — Intermittent' },
            ]} />
          <SelectField label="Insulation Class" value={inp.insulationClass} onChange={str('insulationClass')}
            options={[
              { value: 'Class B', label: 'Class B (130°C)' },
              { value: 'Class F', label: 'Class F (155°C)' },
              { value: 'Class H', label: 'Class H (180°C)' },
            ]} />
          <SelectField label="IP Rating" value={inp.ipRating} onChange={str('ipRating')}
            options={['IP44','IP54','IP55','IP56','IP65','IP66','IP67','IP68'].map((v) => ({ value: v, label: v }))} />
          <SelectField label="Panel IP Rating" value={inp.panelIP} onChange={str('panelIP')}
            options={['IP42','IP54','IP55','IP65','IP66'].map((v) => ({ value: v, label: v }))} />
          <SelectField label="Control Voltage" value={inp.controlVoltage} onChange={str('controlVoltage')}
            options={[{ value: '230V AC', label: '230V AC' }, { value: '24V DC', label: '24V DC' }, { value: '110V AC', label: '110V AC' }]} />
        </Grid3>

        {inp.startingMethod === 'DOL' && (
          <div style={{ marginTop: 16 }}>
            <Grid2>
              <InputField label="Starting Current Multiplier (DOL)" value={inp.dolMultiplier} onChange={num('dolMultiplier')} min={3} max={10} step={0.5}
                tooltip="Typically 5–7× FLC for squirrel cage motors. Design estimate only." />
              <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,.20)' }}>
                <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginBottom: 4 }}>DOL ESTIMATE</div>
                <div style={{ fontSize: 13, color: V.sec }}>Starting Current = {calc.flc.toFixed(1)} × {inp.dolMultiplier} = <strong style={{ color: '#F59E0B' }}>{calc.startingCurrent.toFixed(1)} A</strong></div>
              </div>
            </Grid2>
          </div>
        )}
        {inp.startingMethod === 'Soft Starter' && (
          <div style={{ marginTop: 16 }}>
            <Grid2>
              <InputField label="Soft Starter Current Factor" value={inp.softStarterFactor} onChange={num('softStarterFactor')} min={1.5} max={5} step={0.1}
                tooltip="Adjustable starting current as multiple of FLC. Typically 2.5–3.5× FLC." />
              <div style={{ padding: '12px 16px', background: 'rgba(56,189,248,.08)', borderRadius: 10, border: '1px solid rgba(56,189,248,.20)' }}>
                <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, marginBottom: 4 }}>SOFT STARTER ESTIMATE</div>
                <div style={{ fontSize: 13, color: V.sec }}>Starting Current = {calc.flc.toFixed(1)} × {inp.softStarterFactor} = <strong style={{ color: '#38BDF8' }}>{calc.startingCurrent.toFixed(1)} A</strong></div>
              </div>
            </Grid2>
          </div>
        )}
      </SectionCard>

      <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: 4 }}>ENGINEERING DESIGN DISCLAIMER</div>
        <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
          Calculated values are engineering design recommendations. Final equipment ratings, cable sizes, protection settings, and material selections must be verified against actual equipment nameplate data, manufacturer recommendations, installation conditions, applicable IEC/local standards, short-circuit calculations, ambient temperature, cable installation method, and project specifications.
        </div>
      </div>
    </>
  );

  const renderCalc = () => (
    <>
      <SectionCard title="Motor Electrical Calculation">
        <Grid4>
          <KPI label="Motor Power" value={inp.motorKW} unit="kW" />
          <KPI label="Voltage" value={inp.voltage} unit="V" />
          <KPI label="Power Factor" value={inp.powerFactor} />
          <KPI label="Efficiency" value={inp.efficiency} unit="%" />
        </Grid4>
        <div style={{ height: 16 }} />
        <Grid4>
          <KPI label="Full Load Current" value={calc.flc} unit="A" color="#22C55E" highlight />
          <KPI label="Design Current (125%)" value={calc.designCurrent} unit="A" color="#60A5FA" highlight />
          <KPI label="Starting Current" value={calc.startingCurrent} unit="A" color="#F59E0B"
            sub={`Method: ${inp.startingMethod}`} />
          <KPI label="Phase System" value={inp.phase === '3' ? '3-Phase' : '1-Phase'} color={V.muted} />
        </Grid4>
        <div style={{ marginTop: 16, padding: '14px 18px', background: V.bgD, borderRadius: 10, border: `1px solid ${V.brd}` }}>
          <div style={{ fontSize: 11, color: V.lbl, fontWeight: 700, marginBottom: 8 }}>FORMULA</div>
          <code style={{ fontSize: 14, color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace' }}>
            {inp.phase === '3'
              ? `I = P ÷ (√3 × V × PF × η) = ${(inp.motorKW * 1000).toFixed(0)} ÷ (1.732 × ${inp.voltage} × ${inp.powerFactor} × ${(inp.efficiency / 100).toFixed(2)}) = ${calc.flc.toFixed(2)} A`
              : `I = P ÷ (V × PF × η) = ${(inp.motorKW * 1000).toFixed(0)} ÷ (${inp.voltage} × ${inp.powerFactor} × ${(inp.efficiency / 100).toFixed(2)}) = ${calc.flc.toFixed(2)} A`}
          </code>
        </div>
      </SectionCard>

      <SectionCard title="Starting Current Analysis">
        {(['DOL', 'Star-Delta', 'Soft Starter', 'VFD'] as const).map((method) => {
          const isSel = inp.startingMethod === method;
          let sc = 0;
          if (method === 'DOL')          sc = calc.flc * inp.dolMultiplier;
          else if (method === 'Star-Delta') sc = calc.flc * inp.dolMultiplier / 3;
          else if (method === 'Soft Starter') sc = calc.flc * inp.softStarterFactor;
          else sc = calc.flc * 1.05;
          const note = {
            'DOL': `FLC × ${inp.dolMultiplier} (configurable multiplier)`,
            'Star-Delta': `FLC × ${inp.dolMultiplier} ÷ 3 = ${inp.dolMultiplier}/3 of DOL starting current`,
            'Soft Starter': `FLC × ${inp.softStarterFactor} (adjustable 1.5–5×)`,
            'VFD': `≈ FLC (drive limits starting current to motor demand)`,
          }[method];
          return (
            <div key={method} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', marginBottom: 10, borderRadius: 12, border: `1px solid ${isSel ? 'rgba(37,99,235,.40)' : V.brd}`, background: isSel ? 'rgba(37,99,235,.08)' : V.surf }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: isSel ? '#2563EB' : V.brdB, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? '#93C5FD' : V.muted }}>{method}</div>
                <div style={{ fontSize: 12, color: V.muted, marginTop: 2 }}>{note}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: isSel ? '#F59E0B' : V.muted }}>{sc.toFixed(0)} A</div>
                <div style={{ fontSize: 11, color: V.muted }}>Starting Current</div>
              </div>
            </div>
          );
        })}
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,.15)', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#92400E' }}>⚠ Design estimates only. Verify with actual motor manufacturer data and switchgear rating.</span>
        </div>
      </SectionCard>
    </>
  );

  const renderProtection = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <SectionCard title="MCCB Selection">
          <KPI label="Calculated Design Current" value={calc.designCurrent} unit="A" highlight />
          <OverrideField label="MCCB Rating" auto={calc.mccbRating} value={inp.mccbOverride}
            onChange={(v) => set('mccbOverride', v)} options={MCCB_SIZES} />
          <div style={{ marginTop: 12, fontSize: 12, color: V.muted, lineHeight: 1.6 }}>
            <div>Poles: {inp.phase === '3' ? '3P' : '2P'}</div>
            <div>Breaking Capacity: Min 25 kA</div>
            <div>Type: Thermal Magnetic, Motor Duty</div>
            <div>Adjustable Protection: Recommended</div>
          </div>
        </SectionCard>

        <SectionCard title="Contactor (AC-3)">
          <KPI label="Motor FLC" value={calc.flc} unit="A" highlight />
          <OverrideField label="Contactor Rating (AC-3)" auto={calc.contactorRating} value={inp.contactorOverride}
            onChange={(v) => set('contactorOverride', v)} options={CONTACTOR_AC3} />
          <div style={{ marginTop: 12, fontSize: 12, color: V.muted, lineHeight: 1.6 }}>
            <div>Utilization Category: AC-3</div>
            <div>Coil Voltage: {inp.controlVoltage}</div>
            <div>Aux Contacts: Min 2NO+2NC</div>
            {inp.startingMethod === 'Star-Delta' && <div style={{ color: '#F59E0B', marginTop: 4 }}>Star-Delta: 3 contactors required</div>}
          </div>
        </SectionCard>

        <SectionCard title="Overload Relay">
          <KPI label="Motor FLC" value={calc.flc} unit="A" highlight />
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: V.muted }}>OLR Range Override</span>
              <button onClick={() => { set('olrOverrideLow', 0); set('olrOverrideHigh', 0); }}
                style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: `1px solid ${V.brd}`, background: V.surf, color: V.muted, cursor: 'pointer' }}>
                {inp.olrOverrideLow > 0 ? 'Manual' : 'Auto'}
              </button>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(37,99,235,.08)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#60A5FA' }}>
                {calc.olrRange[0]}–{calc.olrRange[1]} A
              </div>
              <div style={{ fontSize: 11, color: V.muted, marginTop: 2 }}>Set at: {calc.olrSetting} A</div>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InputField label="Override Low (A)" value={inp.olrOverrideLow} onChange={num('olrOverrideLow')} min={0} step={0.1} />
              <InputField label="Override High (A)" value={inp.olrOverrideHigh} onChange={num('olrOverrideHigh')} min={0} step={0.1} />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: V.muted, lineHeight: 1.6 }}>
            <div>Trip Class: 10 (Class 10A)</div>
            <div>Reset: Manual + Auto</div>
            <div style={{ color: '#F59E0B', marginTop: 4 }}>⚠ Final OLR setting must match motor nameplate current. Always verify.</div>
          </div>
        </SectionCard>
      </div>
    </>
  );

  const renderCable = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <SectionCard title="Cable Parameters">
            <Grid2>
              <InputField label="Cable Length (m)" value={inp.cableLength} onChange={num('cableLength')} min={1} step={1}
                tooltip="One-way cable run from panel to motor" />
              <SelectField label="Installation Method" value={inp.installMethod} onChange={str('installMethod')}
                options={[
                  { value: 'air', label: 'In Air / Tray' },
                  { value: 'conduit', label: 'In Conduit' },
                  { value: 'ground', label: 'Direct Buried' },
                ]} />
              <SelectField label="Cable Material" value={inp.cableMaterial} onChange={str('cableMaterial')}
                options={[{ value: 'Cu', label: 'Copper (Cu)' }, { value: 'Al', label: 'Aluminium (Al)' }]} />
              <SelectField label="Cable Insulation" value={inp.cableInsulation} onChange={str('cableInsulation')}
                options={[{ value: 'XLPE', label: 'XLPE (90°C)' }, { value: 'PVC', label: 'PVC (70°C)' }]} />
              <InputField label="Number of Cores" value={inp.numCores} onChange={num('numCores')} min={2} max={5} step={1} />
              <InputField label="Parallel Runs" value={inp.parallelRuns} onChange={num('parallelRuns')} min={1} step={1} />
              <InputField label="Ambient Temperature (°C)" value={inp.ambientTemp} onChange={num('ambientTemp')} min={25} max={60} step={5} />
              <InputField label="Grouping Factor" value={inp.groupingFactor} onChange={num('groupingFactor')} min={0.5} max={1} step={0.05}
                tooltip="Derating for cables grouped on same tray. Single cable = 1.0, groups use IEC 60364 Table B.52.17" />
              <InputField label="Max Allowable Voltage Drop (%)" value={inp.maxVoltageDrop} onChange={num('maxVoltageDrop')} min={1} max={10} step={0.5} />
            </Grid2>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Cable Sizing Results">
            <Grid2>
              <KPI label="Design Current" value={calc.designCurrent} unit="A" highlight />
              <KPI label="Derating Factor" value={calc.deratingFactor} sub={`Temp ${getTempDerateDisplay(inp.ambientTemp, inp.cableInsulation)} × Group ${inp.groupingFactor}`} />
            </Grid2>
            <div style={{ height: 12 }} />
            <OverrideField label="Recommended Cable Size" auto={calc.cableSize} value={inp.cableSizeOverride}
              onChange={(v) => set('cableSizeOverride', v)} unit="mm²" options={CABLE_SIZES} />
            <OverrideField label="Earth Cable Size" auto={calc.earthSize} value={inp.earthSizeOverride}
              onChange={(v) => set('earthSizeOverride', v)} unit="mm²" options={CABLE_SIZES} />
            <div style={{ marginTop: 14 }}>
              <Grid2>
                <KPI label="Cable Ampacity" value={calc.cableAmpacity} unit="A"
                  color={calc.cableAmpacity >= calc.designCurrent ? '#22C55E' : '#EF4444'} />
                <KPI label="Ampacity Margin"
                  value={`${((calc.cableAmpacity / calc.designCurrent - 1) * 100).toFixed(0)}%`}
                  color={calc.cableAmpacity >= calc.designCurrent ? '#22C55E' : '#EF4444'} />
              </Grid2>
            </div>
          </SectionCard>

          <SectionCard title="Voltage Drop Calculation">
            <Grid2>
              <KPI label="Cable Resistance" value={calc.cableResistance} unit="Ω" />
              <KPI label="Cable Reactance" value={calc.cableReactance} unit="Ω" />
              <KPI label="Voltage Drop" value={calc.voltageDrop} unit="V" />
              <KPI label="Voltage Drop %" value={calc.voltageDropPct} unit="%"
                color={calc.voltageDropPct <= inp.maxVoltageDrop ? '#22C55E' : '#EF4444'}
                sub={`Limit: ${inp.maxVoltageDrop}%`} highlight />
            </Grid2>
            <div style={{ marginTop: 14, padding: '10px 14px', background: V.bgD, borderRadius: 8, border: `1px solid ${V.brd}` }}>
              <code style={{ fontSize: 12, color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace' }}>
                {inp.phase === '3'
                  ? `ΔV = √3 × I × L × (R·cosφ + X·sinφ) / 1000 = ${calc.voltageDrop} V`
                  : `ΔV = 2 × I × L × (R·cosφ + X·sinφ) / 1000 = ${calc.voltageDrop} V`}
              </code>
            </div>
            <div style={{ marginTop: 10 }}>
              <StatusBadge status={calc.voltageDropPct <= inp.maxVoltageDrop ? 'PASS' : 'FAIL'} />
              <span style={{ fontSize: 12, color: V.muted, marginLeft: 10 }}>{calc.voltageDropPct}% vs limit {inp.maxVoltageDrop}%</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );

  const renderStarterBOM = () => {
    const sm = inp.startingMethod;
    const sections: { title: string; items: { item: string; spec: string; qty: number }[] }[] = [];

    if (sm === 'DOL') {
      sections.push({ title: 'DOL Starter Components', items: [
        { item: 'MCCB', spec: `${calc.mccbRating} A, 3P, Motor Duty, 25 kA`, qty: 1 },
        { item: 'Main Contactor (AC-3)', spec: `${calc.contactorRating} A, ${inp.controlVoltage} Coil`, qty: 1 },
        { item: 'Overload Relay', spec: `${calc.olrRange[0]}–${calc.olrRange[1]} A, Class 10`, qty: 1 },
        { item: 'Auxiliary Contact Block', spec: '2NO+2NC, snap-on', qty: 1 },
        { item: 'Control MCB', spec: `1P 6A C-curve, ${inp.controlVoltage}`, qty: 1 },
        { item: 'Start Push Button', spec: 'Green 22mm, 1NO, "START"', qty: 1 },
        { item: 'Stop Push Button', spec: 'Red 22mm, 1NC, "STOP"', qty: 1 },
        { item: 'Emergency Stop', spec: 'Red mushroom 40mm, 1NC, Key Release', qty: 1 },
        { item: 'L/R Selector Switch', spec: '3-Position Local-Off-Remote, 2NO', qty: 1 },
        { item: 'Run Indicator (Green)', spec: `LED 22mm, ${inp.controlVoltage}`, qty: 1 },
        { item: 'Trip Indicator (Red)', spec: `LED 22mm, ${inp.controlVoltage}`, qty: 1 },
        { item: 'Ready Indicator (White)', spec: `LED 22mm, ${inp.controlVoltage}`, qty: 1 },
        { item: 'Control Relay', spec: `2CO, 10A, ${inp.controlVoltage}, with socket`, qty: 2 },
        { item: 'Terminal Blocks', spec: '4mm² 32A screw type', qty: 30 },
        { item: 'Earth Terminals', spec: '6mm² green/yellow', qty: 6 },
      ]});
    } else if (sm === 'Star-Delta') {
      sections.push({ title: 'Star-Delta Starter Components', items: [
        { item: 'MCCB', spec: `${calc.mccbRating} A, 3P, Motor Duty, 25 kA`, qty: 1 },
        { item: 'Main (Line) Contactor', spec: `${calc.contactorRating} A AC-3, ${inp.controlVoltage} Coil`, qty: 1 },
        { item: 'Star Contactor', spec: `${Math.ceil(calc.contactorRating * 0.58)} A AC-3, ${inp.controlVoltage} Coil`, qty: 1 },
        { item: 'Delta Contactor', spec: `${calc.contactorRating} A AC-3, ${inp.controlVoltage} Coil`, qty: 1 },
        { item: 'Overload Relay', spec: `${calc.olrRange[0]}–${calc.olrRange[1]} A, Class 10`, qty: 1 },
        { item: 'Star-Delta Timer', spec: `Adjustable 3–30 s, ${inp.controlVoltage}`, qty: 1 },
        { item: 'Mechanical Interlock', spec: 'Star-Delta interlock kit', qty: 2 },
        { item: 'Auxiliary Contact Block', spec: '2NO+2NC, snap-on', qty: 3 },
        { item: 'Control MCB', spec: `1P 6A C-curve`, qty: 1 },
        { item: 'Start Push Button', spec: 'Green 22mm, 1NO', qty: 1 },
        { item: 'Stop Push Button', spec: 'Red 22mm, 1NC', qty: 1 },
        { item: 'Emergency Stop', spec: 'Red mushroom, 40mm, Key Release', qty: 1 },
        { item: 'L/R Selector Switch', spec: '3-Position L-O-R', qty: 1 },
        { item: 'Run / Star / Delta Indicators', spec: `LED 22mm, ${inp.controlVoltage}`, qty: 3 },
        { item: 'Trip Indicator', spec: `Red LED 22mm, ${inp.controlVoltage}`, qty: 1 },
        { item: 'Control Relay', spec: `2CO 10A, ${inp.controlVoltage}`, qty: 4 },
        { item: 'Terminal Blocks', spec: '4mm² 32A screw', qty: 40 },
      ]});
    } else if (sm === 'Soft Starter') {
      sections.push({ title: 'Soft Starter Components', items: [
        { item: 'MCCB', spec: `${calc.mccbRating} A, 3P, 25 kA`, qty: 1 },
        { item: 'Soft Starter', spec: `${inp.motorKW} kW, ${inp.voltage}V, Built-in bypass`, qty: 1 },
        { item: 'Bypass Contactor', spec: `${calc.contactorRating} A AC-3, ${inp.controlVoltage} Coil`, qty: 1 },
        { item: 'Motor Protection Relay', spec: 'Electronic, OL/phase loss/stall', qty: 1 },
        { item: 'Control MCB', spec: '1P 6A C-curve', qty: 1 },
        { item: 'Start/Stop PB Set', spec: 'Green/Red 22mm', qty: 1 },
        { item: 'Emergency Stop', spec: 'Red mushroom, 40mm', qty: 1 },
        { item: 'L/R Selector', spec: '3-Position', qty: 1 },
        { item: 'Run / Fault Indicators', spec: `LED 22mm, ${inp.controlVoltage}`, qty: 2 },
        { item: 'Terminal Blocks', spec: '4mm² 32A', qty: 30 },
      ]});
    } else {
      sections.push({ title: 'VFD Drive Components', items: [
        { item: 'MCCB', spec: `${calc.mccbRating} A, 3P, 25 kA`, qty: 1 },
        { item: 'VFD / Variable Speed Drive', spec: `${inp.motorKW} kW, ${inp.voltage}V, IP20, EMC Filter, PID, Modbus RTU`, qty: 1 },
        { item: 'Input Line Reactor (5%)', spec: `${Math.ceil(calc.flc * 1.1)} A, 5% impedance`, qty: 1 },
        { item: 'Bypass Contactor', spec: `${calc.contactorRating} A AC-3`, qty: 1 },
        { item: 'Control MCB', spec: '1P 6A C-curve', qty: 1 },
        { item: 'Speed Reference (Pot)', spec: '10kΩ wirewound, panel mount', qty: 1 },
        { item: 'Start / Stop PB Set', spec: 'Green/Red 22mm', qty: 1 },
        { item: 'Emergency Stop', spec: 'Red mushroom, 40mm, key release', qty: 1 },
        { item: 'L/R Selector', spec: '3-Position L-O-R', qty: 1 },
        { item: 'Run / Fault Indicators', spec: `LED 22mm, ${inp.controlVoltage}`, qty: 2 },
        { item: 'Shielded Control Cable', spec: '2×1.5mm² OS screened (speed ref)', qty: Math.ceil(inp.cableLength * 1.1) },
        { item: 'Terminal Blocks', spec: '4mm² + 1.5mm² mixed', qty: 35 },
      ]});
    }

    return (
      <>
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(37,99,235,.08)', borderRadius: 10, border: '1px solid rgba(37,99,235,.20)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Info style={{ width: 16, height: 16, color: '#60A5FA', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: V.muted }}>Starter BOM is automatically generated based on <strong style={{ color: '#60A5FA' }}>{sm}</strong> starting method. Change the starting method in Tab 01 to regenerate.</span>
        </div>
        {sections.map((sec) => (
          <SectionCard key={sec.title} title={sec.title}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${V.brdM}` }}>
                  {['#', 'Component', 'Specification', 'Qty', 'Unit'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: V.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sec.items.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${V.brdM}`, background: i % 2 === 0 ? 'transparent' : V.surf }}>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: V.muted }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: V.sec, fontWeight: 600 }}>{row.item}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: V.muted }}>{row.spec}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: V.txt, fontWeight: 700 }}>{row.qty}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: V.muted }}>Nos</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        ))}
      </>
    );
  };

  const renderPanel = () => (
    <>
      <SectionCard title="Control Panel — Enclosure & Main Components">
        <Grid2>
          <KPI label="Recommended Panel Size" value={calc.panelSize} color="#60A5FA" highlight />
          <KPI label="Panel IP Rating" value={inp.panelIP} />
        </Grid2>
      </SectionCard>

      <SectionCard title="Field & Installation Items">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            ['hasLocalIsolator', 'Local Isolator (at motor)'],
            ['hasLocalCS', 'Local Control Station'],
            ['hasJunctionBox', 'Junction Box (field)'],
            ['hasFlexConduit', 'Flexible Conduit at motor'],
            ['hasCableTray', 'Cable Tray'],
            ['hasPressureSwitch', 'Pressure Switch'],
            ['hasPressureXmtr', 'Pressure Transmitter'],
            ['hasFlowSwitch', 'Flow Switch'],
            ['hasFlowMeter', 'Flow Meter'],
            ['hasLevelSwitch', 'Level Switch'],
            ['hasTempSensor', 'Motor Temp Sensor (RTD)'],
            ['hasVibration', 'Vibration Sensor'],
          ] as [keyof PumpMotorInputs, string][]).map(([k, label]) => (
            <Toggle key={k} label={label} checked={!!inp[k]} onChange={(v) => set(k, v as PumpMotorInputs[typeof k])} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Cable Parameters">
        <Grid3>
          <InputField label="Control Cable Coil Length (m)" value={inp.cableLength} onChange={num('cableLength')} min={1} step={1} />
          <InputField label="Parallel Cable Runs" value={inp.parallelRuns} onChange={num('parallelRuns')} min={1} step={1} />
          <InputField label="Cable Waste Allowance (%)" value={10} onChange={() => {}} disabled />
        </Grid3>
      </SectionCard>
    </>
  );

  const renderBOM = () => (
    <>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 14, color: V.muted }}>{bomWithCost.length} items · Total Material Cost: </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#22C55E' }}>
            {totalCost > 0 ? `₹ ${totalCost.toLocaleString('en-IN')}` : 'Enter unit costs below'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Download style={{ width: 14, height: 14 }} /> PDF
          </button>
          <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <FileSpreadsheet style={{ width: 14, height: 14 }} /> Excel
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.surf, borderBottom: `2px solid ${V.brdM}` }}>
              {['Sl', 'Category', 'Description', 'Specification', 'Qty', 'Unit', 'Basis', 'Unit Cost', 'Total', 'Remarks'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: V.muted, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bomWithCost.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${V.brdM}`, background: i % 2 === 0 ? 'transparent' : V.surf }}>
                <td style={{ padding: '9px 12px', color: V.muted, fontSize: 12 }}>{item.slNo}</td>
                <td style={{ padding: '9px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(37,99,235,.10)', color: '#60A5FA', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.category}</span>
                </td>
                <td style={{ padding: '9px 12px', color: V.sec, fontWeight: 600, minWidth: 180 }}>{item.description}</td>
                <td style={{ padding: '9px 12px', color: V.muted, fontSize: 12, maxWidth: 260 }}>{item.specification}</td>
                <td style={{ padding: '9px 12px', color: V.txt, fontWeight: 700, textAlign: 'right' }}>{item.qty}</td>
                <td style={{ padding: '9px 12px', color: V.muted }}>{item.unit}</td>
                <td style={{ padding: '9px 12px', color: V.muted, fontSize: 11, maxWidth: 150 }}>{item.basis}</td>
                <td style={{ padding: '9px 12px' }}>
                  <input
                    type="number" min={0} value={bomCosts[item.id] ?? ''}
                    placeholder="0"
                    onChange={(e) => setBomCosts((p) => ({ ...p, [item.id]: Number(e.target.value) }))}
                    style={{ width: 90, background: V.inp, border: `1px solid ${V.brdB}`, borderRadius: 6, color: V.txt, fontSize: 12, padding: '4px 8px', textAlign: 'right' }}
                  />
                </td>
                <td style={{ padding: '9px 12px', color: '#22C55E', fontWeight: 700, textAlign: 'right' }}>
                  {item.totalCost > 0 ? item.totalCost.toLocaleString('en-IN') : '—'}
                </td>
                <td style={{ padding: '9px 12px', color: V.muted, fontSize: 11 }}>{item.remarks}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: V.surf, borderTop: `2px solid ${V.brdM}` }}>
              <td colSpan={8} style={{ padding: '12px', fontWeight: 700, color: V.sec, textAlign: 'right', fontSize: 14 }}>Total Material Cost</td>
              <td style={{ padding: '12px', fontWeight: 800, color: '#22C55E', fontSize: 16 }}>
                {totalCost > 0 ? totalCost.toLocaleString('en-IN') : '—'}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );

  const renderValidation = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KPI label="Total Checks" value={checks.length} color={V.muted} />
        <KPI label="Pass" value={passCount} color="#22C55E" highlight />
        <KPI label="Warnings" value={warnCount} color="#F59E0B" />
        <KPI label="Fail" value={failCount} color="#EF4444" />
      </div>

      <SectionCard title="Calculation Summary">
        <Grid4>
          <KPI label="Motor Rating" value={inp.motorKW} unit="kW" highlight />
          <KPI label="System Voltage" value={inp.voltage} unit="V" />
          <KPI label="Full Load Current" value={calc.flc} unit="A" color="#22C55E" />
          <KPI label="Design Current" value={calc.designCurrent} unit="A" />
          <KPI label="Starting Method" value={inp.startingMethod} color="#60A5FA" />
          <KPI label="MCCB Rating" value={calc.mccbRating} unit="A" />
          <KPI label="Contactor (AC-3)" value={calc.contactorRating} unit="A" />
          <KPI label="OLR Range" value={`${calc.olrRange[0]}–${calc.olrRange[1]}`} unit="A" />
          <KPI label="Power Cable" value={calc.cableSize} unit="mm²" highlight />
          <KPI label="Earth Cable" value={calc.earthSize} unit="mm²" />
          <KPI label="Cable Length" value={inp.cableLength} unit="m" />
          <KPI label="Voltage Drop" value={calc.voltageDropPct} unit="%" color={calc.voltageDropPct <= inp.maxVoltageDrop ? '#22C55E' : '#EF4444'} />
          <KPI label="Panel Size" value={calc.panelSize} />
          <KPI label="Panel IP" value={inp.panelIP} />
          <KPI label="Total BOM Items" value={bom.length} color="#60A5FA" />
          <KPI label="Starting Current" value={calc.startingCurrent} unit="A" color="#F59E0B" />
        </Grid4>
      </SectionCard>

      <SectionCard title="Validation Checks">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checks.map((ck) => (
            <div key={ck.id} style={{
              display: 'grid', gridTemplateColumns: '120px 200px 1fr 1fr 120px',
              alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
              background: ck.status === 'FAIL' ? 'rgba(239,68,68,.05)' : ck.status === 'WARNING' ? 'rgba(245,158,11,.05)' : 'rgba(34,197,94,.03)',
              border: `1px solid ${ck.status === 'FAIL' ? 'rgba(239,68,68,.15)' : ck.status === 'WARNING' ? 'rgba(245,158,11,.12)' : 'rgba(34,197,94,.10)'}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: 'uppercase' }}>{ck.category}</div>
              <div style={{ fontSize: 13, color: V.sec, fontWeight: 600 }}>{ck.description}</div>
              <div style={{ fontSize: 13, color: V.txt }}>Calculated: <strong>{ck.calculated}</strong></div>
              <div style={{ fontSize: 12, color: V.muted }}>Limit: {ck.limit}</div>
              <StatusBadge status={ck.status} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,.15)' }}>
          <span style={{ fontSize: 11, color: '#92400E' }}>⚠ All results are engineering design estimates. Every automatically selected value must be verified against actual equipment data, site conditions, short-circuit studies, and applicable IEC/local standards before procurement or installation.</span>
        </div>
      </SectionCard>

      <SectionCard title="Export">
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,.40)' }}>
            <Download style={{ width: 18, height: 18 }} /> Export PDF Report
          </button>
          <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(22,163,74,.40)' }}>
            <FileSpreadsheet style={{ width: 18, height: 18 }} /> Export Excel BOM
          </button>
          <button onClick={() => { setInp(DEFAULT); setBomCosts({}); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRadius: 12, border: `1px solid ${V.brd}`, background: 'transparent', color: V.muted, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw style={{ width: 16, height: 16 }} /> New Calculation
          </button>
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: V.muted }}>
          PDF includes: Project Details · Motor Calculation · Protection · Cable · Starter BOM · Panel BOM · Field Materials · Instruments · Complete BOM · Cost Summary · Validation
        </div>
      </SectionCard>
    </>
  );

  const tabContent: Record<string, React.ReactNode> = {
    project: renderProject(),
    calc: renderCalc(),
    protection: renderProtection(),
    cable: renderCable(),
    starter: renderStarterBOM(),
    panel: renderPanel(),
    bom: renderBOM(),
    validation: renderValidation(),
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }} className="animate-fadeIn">
      {/* Module Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${V.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu style={{ width: 26, height: 26, color: '#22C55E' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: V.txt, letterSpacing: '-0.01em' }}>PUMP &amp; MOTOR ELECTRICAL CALCULATOR</h2>
            <p style={{ fontSize: 13, color: V.muted, marginTop: 3 }}>IEC 60364 · IEC 60947 · IEC 60228 · Automatic BOM Generator</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: V.muted }}>FLC</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#22C55E' }}>{calc.flc} A</div>
          </div>
          <div style={{ width: 1, height: 40, background: V.brd }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: V.muted }}>Cable</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#60A5FA' }}>{calc.cableSize} mm²</div>
          </div>
          <div style={{ width: 1, height: 40, background: V.brd }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: V.muted }}>MCCB</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{calc.mccbRating} A</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 18px', borderRadius: 10, border: `1px solid ${isActive ? 'rgba(37,99,235,.40)' : V.brd}`,
              background: isActive ? 'rgba(37,99,235,.12)' : V.surf,
              color: isActive ? '#93C5FD' : V.muted,
              fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 150ms',
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div>{tabContent[tab]}</div>
    </div>
  );
}

function getTempDerateDisplay(temp: number, ins: 'XLPE' | 'PVC'): string {
  const tbl: Record<number, number> = ins === 'XLPE'
    ? { 25:1.04,30:1.00,35:0.96,40:0.91,45:0.87,50:0.82,55:0.76,60:0.71 }
    : { 25:1.03,30:1.00,35:0.94,40:0.87,45:0.79,50:0.71 };
  const rounded = Math.round(temp / 5) * 5;
  return `${tbl[rounded] ?? 1.0}`;
}
