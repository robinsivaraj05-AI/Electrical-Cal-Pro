import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { calculateShortCircuit } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#DC2626';

const FAULT_TYPES = [
  { value:'3ph', label:'3-Phase Symmetrical (Maximum fault)' },
  { value:'SLG', label:'Single Line-to-Ground (SLG)' },
  { value:'DL',  label:'Double Line Fault' },
  { value:'EF',  label:'Earth Fault' },
];

const WHY_ITEMS = [
  { title: 'MCCB / ACB Rating',    desc: 'Breaking capacity (Icu/Ics) must exceed the prospective fault current at the installation point' },
  { title: 'Fuse Selection',        desc: 'Fuse breaking capacity must be rated for the maximum fault current it may be required to interrupt' },
  { title: 'Cable Thermal Withstand', desc: 'Cable must withstand I²t energy without damage — verified as: A ≥ I × √t / k' },
  { title: 'Switchgear Rating',     desc: 'All switchgear (isolators, busbars, contactors) must be rated for the maximum fault current' },
  { title: 'Relay Setting',         desc: 'Fault current magnitude determines the zone of protection and instantaneous trip settings for relays' },
  { title: 'Dynamic Forces',        desc: 'Peak asymmetric fault current creates large electromagnetic forces on busbars and conductors' },
];

const NOTES = [
  { color:'#DC2626', title:'IEC 60909 — Calculation Method',
    body:'IEC 60909 uses the voltage factor c (= 1.05 for LV systems for maximum fault current) to account for voltage variations. The initial symmetrical short-circuit current: I″k = c × Un / (√3 × Zk). The peak short-circuit current: ip = κ × √2 × I″k where κ depends on the X/R ratio and can reach 2.0 for very inductive systems.' },
  { color:'#7C3AED', title:'3-Phase vs Single-Phase Fault Current',
    body:'The three-phase symmetrical fault gives the maximum fault current and is used for equipment rating. Single line-to-ground (SLG) faults in solidly earthed systems can produce currents up to 110% of the three-phase value. In impedance earthed systems, earth fault currents are limited by the earthing impedance.' },
  { color:'#059669', title:'Cable Thermal Withstand (Adiabatic Method)',
    body:'During a fault, the cable temperature rise is approximately adiabatic (no heat dissipation). The thermal withstand equation is: A ≥ I_sc × √t / k. For 90°C XLPE Cu cable: k=143; PVC Cu: k=115; XLPE Al: k=94. If the cable does not satisfy this equation, use a larger cross-section or specify a faster protection relay.' },
  { color:'#475569', title:'X/R Ratio and System Impedance',
    body:'The X/R ratio determines how asymmetric the fault current is. High X/R ratios (common in MV systems) produce large peak currents. At the LV side of a distribution transformer (X/R ≈ 5-10), the peak current multiplier κ ≈ 1.4–1.7. At MV system infeed points (X/R > 10), κ approaches the maximum of 2.0.' },
];

export function ShortCircuit() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [voltage,            setVoltage]   = useState('0.415');
  const [transformerMVA,     setTxMVA]     = useState('1.0');
  const [transformerImpedance, setTxZ]     = useState('6');
  const [cableLength,        setCableLen]  = useState('100');
  const [cableSize,          setCableSize] = useState('95');
  const [conductor,          setConductor] = useState<'Cu'|'Al'>('Cu');
  const [faultType,          setFaultType] = useState<'3ph'|'SLG'|'DL'|'EF'>('3ph');
  const [faultDuration,      setFaultDur]  = useState('0.5');
  const [xrRatio,            setXR]        = useState('10');
  const [deviceBreaking,     setDeviceBrk] = useState('');  // empty = skip check
  const [result,             setResult]    = useState<CalculationResult | null>(null);
  const [learningMode,       setLM]        = useState(true);

  const calculate = () => {
    const res = calculateShortCircuit({
      voltage: parseFloat(voltage), transformerMVA: parseFloat(transformerMVA),
      transformerImpedance: parseFloat(transformerImpedance),
      cableLength: parseFloat(cableLength), cableSize: parseFloat(cableSize),
      conductor, faultType, faultDuration: parseFloat(faultDuration), xrRatio: parseFloat(xrRatio),
      deviceBreakingKA: deviceBreaking !== '' ? parseFloat(deviceBreaking) : undefined,
    });
    setResult(res);
    addCalculation({
      type:'short-circuit',
      title:`Short Circuit — ${voltage}kV, ${transformerMVA}MVA Transformer`,
      inputs:{ voltage:`${voltage}kV`, transformerMVA:`${transformerMVA}MVA`, transformerImpedance:`${transformerImpedance}%`, cableLength, cableSize, conductor, faultType, faultDuration },
      results:res, notes:'', standard:'IEC 60909',
    });
  };

  const sizeItems = [16,25,35,50,70,95,120,150,185,240,300].map((s) => ({ value:s.toString(), label:`${s}` }));

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'Short Circuit Analysis', inputs:{ 'Voltage':`${voltage} kV`, 'Transformer':`${transformerMVA} MVA`, 'Zk%':`${transformerImpedance}%`, 'Cable':`${cableSize}mm² × ${cableLength}m`, 'Fault Type':faultType }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'short-circuit' });
  };
  const handleXLS = () => { if (result) exportToExcel('Short Circuit Analysis', { voltage, transformerMVA, faultType }, result); };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={AlertTriangle} title="SHORT CIRCUIT ANALYSIS" subtitle="IEC 60909 · Fault current, peak current, thermal withstand and cable verification" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="System Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="System Voltage" value={voltage} onChange={setVoltage} unit="kV" min={0.001} step={0.001} tooltip="Nominal line-to-line voltage in kV" />
            <TextInput label="X/R Ratio" value={xrRatio} onChange={setXR} min={1} max={30} step={0.5} tooltip="Typical: 5-10 for LV, 10-20 for MV systems" />
          </FieldRow>

          <SectionLabel title="Transformer Data" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Transformer Rating" value={transformerMVA} onChange={setTxMVA} unit="MVA" min={0.001} step={0.1} />
            <TextInput label="Impedance Voltage (Zk%)" value={transformerImpedance} onChange={setTxZ} unit="%" min={1} max={15} step={0.5} tooltip="Short-circuit impedance as percentage of rated voltage — from nameplate" />
          </FieldRow>

          <SectionLabel title="Cable Data" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Cable Length" value={cableLength} onChange={setCableLen} unit="m" min={0} />
            <SelectInput label="Conductor Material" value={conductor} onChange={(v) => setConductor(v as 'Cu'|'Al')} options={[{ value:'Cu', label:'Copper' },{ value:'Al', label:'Aluminium' }]} />
          </FieldRow>
          <QuickPills label="Cable Size (mm²)" items={sizeItems} active={cableSize} onSelect={setCableSize} accentColor={ACCENT} />

          <SectionLabel title="Fault Parameters" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Fault Type" value={faultType} onChange={(v) => setFaultType(v as '3ph'|'SLG'|'DL'|'EF')} options={FAULT_TYPES} tooltip="3-phase gives maximum fault current for equipment rating" />
            <TextInput label="Fault Clearing Time" value={faultDuration} onChange={setFaultDur} unit="s" min={0.02} max={5} step={0.05} tooltip="Time for the protective device to clear the fault" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Device Breaking Capacity Icu (blank = skip)" value={deviceBreaking} onChange={setDeviceBrk} unit="kA" min={0.5} max={150} step={0.5} tooltip="Prospective fault current the protective device must be rated to interrupt (IEC 60947-2 Icu). Leave blank to skip the breaking capacity check." />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate Fault Current" icon={AlertTriangle} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
