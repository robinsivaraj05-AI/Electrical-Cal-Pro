import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#EA580C';

function calculateOLR(inputs: {
  flc: number; motorClass: 10|20|30; serviceClass: string;
  startingFactor: number; tempClass: 'A'|'B'|'F'|'H';
}): CalculationResult {
  const { flc, motorClass, startingFactor } = inputs;
  const olrMin      = flc * 1.0;
  const olrMax      = flc * 1.15;
  const setting     = flc * 1.05;
  const classTrip: Record<number, string> = { 10:'4–10 s', 20:'4–20 s', 30:'4–30 s' };
  const startCurrent = flc * startingFactor;

  return {
    values: [
      { label:'Motor FLC',            value:flc.toFixed(1),       unit:'A' },
      { label:'OLR Min Setting',      value:olrMin.toFixed(1),    unit:'A' },
      { label:'OLR Max Setting',      value:olrMax.toFixed(1),    unit:'A' },
      { label:'Recommended Setting',  value:setting.toFixed(1),   unit:'A', highlight:true },
      { label:'Motor Tripping Class', value:`Class ${motorClass}`,unit:'',  highlight:true },
      { label:'Trip Time at 7.2×Iₙ', value:classTrip[motorClass],unit:'' },
      { label:'Starting Current',     value:startCurrent.toFixed(1), unit:'A' },
    ],
    status:'INFO',
    recommendation:`Select Class ${motorClass} thermal overload relay. Set between ${olrMin.toFixed(1)}–${olrMax.toFixed(1)} A. Recommended setting: ${setting.toFixed(1)} A (1.05× FLC). Verify thermal rating matches motor insulation class ${inputs.tempClass}.`,
    formula:'I_OLR = (1.0 to 1.15) × I_FLC',
    steps:[
      { step:1, description:'Full load current (motor nameplate)', formula:`I_FLC = ${flc} A`, result:`${flc} A` },
      { step:2, description:'OLR setting range (IEC 60947-4-1 Cl. 5.3)', formula:`I_OLR = 1.0 × I_FLC to 1.15 × I_FLC = ${olrMin.toFixed(1)} to ${olrMax.toFixed(1)} A`, result:`Set at ${setting.toFixed(1)} A (1.05 × FLC recommended)` },
      { step:3, description:`Thermal class selection (Class ${motorClass})`, formula:`Tripping time at 7.2 × Iₙ: ${classTrip[motorClass]}`, result:`Class ${motorClass} suitable for starting factor ${startingFactor}×` },
      { step:4, description:'Verify starting current does not trip OLR', formula:`I_start = ${startingFactor} × ${flc} = ${startCurrent.toFixed(1)} A — OLR must withstand this during Class ${motorClass} time`, result:`Class ${motorClass} selected — ACCEPTABLE` },
    ],
    standardRef:{ standard:'IEC 60947-4-1', clause:'5.3.2', title:'Low-voltage switchgear — Electromechanical contactors and motor-starters' },
  };
}

const WHY_ITEMS = [
  { title:'Motor Protection',    desc:'OLR prevents motor winding damage from sustained overloads, blocked rotor and phase unbalance conditions' },
  { title:'Trip Class Selection',desc:'Trip class must allow the motor to start (withstand starting current) while still tripping quickly enough to protect windings' },
  { title:'OLR Setting Range',   desc:'IEC 60947-4-1 allows setting 1.0–1.15× FLC — setting too high risks motor damage; too low causes nuisance tripping' },
  { title:'Phase Unbalance',     desc:'Electronic OLRs detect phase unbalance (>5% voltage unbalance doubles heating) and trip within seconds' },
  { title:'Auto-reset vs Manual',desc:'Manual reset is required for motors driving pumps, compressors or other equipment where auto-restart could be hazardous' },
  { title:'Insulation Monitoring',desc:'Combined OLR + thermistor/PTC protection provides both electrical and thermal protection of motor windings' },
];

const NOTES = [
  { color:'#EA580C', title:'Setting Range — IEC 60947-4-1',
    body:'The OLR setting range is always 100–115% of motor FLC. The recommended setting is 105% of FLC (1.05× I_FLC). This allows for normal current variations under varying load while protecting against sustained overload. Never set above 115% — this is the IEC 60947-4-1 limit.' },
  { color:'#7C3AED', title:'Trip Class Definition',
    body:'The class number defines the maximum tripping time in seconds at 7.2× rated current from cold condition. Class 10: ≤10 s — standard duty motors (centrifugal pumps, fans, compressors). Class 20: ≤20 s — high-inertia loads (crushers, large fans). Class 30: ≤30 s — extremely high-inertia loads. Higher class = longer starting time tolerance.' },
  { color:'#059669', title:'Electronic vs Thermal OLRs',
    body:'Thermal (bimetal) OLRs use a bimetal element that bends with heat — simple, cheap, but affected by ambient temperature and respond to average heating only. Electronic (microprocessor) OLRs provide: phase unbalance protection, thermistor input, earth fault detection, communication interface, accurate current measurement and motor thermal model. Electronic OLRs are preferred for IE3/IE4 motors.' },
];

export function OLRSelection() {
  const { addCalculation } = useStore();
  const [flc,            setFlc]  = useState('100');
  const [motorClass,     setMC]   = useState<10|20|30>(10);
  const [serviceClass,   setSC]   = useState('S1');
  const [startingFactor, setSF]   = useState('6');
  const [tempClass,      setTC]   = useState<'A'|'B'|'F'|'H'>('F');
  const [result,         setResult] = useState<CalculationResult | null>(null);
  const [learningMode,   setLM]   = useState(true);

  const calculate = () => {
    const res = calculateOLR({ flc:parseFloat(flc), motorClass, serviceClass, startingFactor:parseFloat(startingFactor), tempClass });
    setResult(res);
    addCalculation({ type:'olr', title:`OLR Selection — ${flc}A FLC, Class ${motorClass}`, inputs:{ flc, motorClass:motorClass.toString(), serviceClass, startingFactor, tempClass }, results:res, notes:'', standard:'IEC 60947-4-1' });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Shield} title="OVERLOAD RELAY SELECTION" subtitle="IEC 60947-4-1 · Thermal/electronic OLR setting, class selection and starting current verification" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="Motor Data" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Full Load Current (FLC)" value={flc} onChange={setFlc} unit="A" min={0.1} step={0.1} tooltip="Motor nameplate full load current in amperes" />
            <TextInput label="Starting Current Factor" value={startingFactor} onChange={setSF} min={1} max={10} step={0.5} tooltip="DOL: 6×  Star-Delta: 2×  Soft-Starter: 2.5×  VFD: 1.5×" />
          </FieldRow>

          <SectionLabel title="OLR Selection" />
          <SelectInput label="Motor Tripping Class" value={motorClass.toString()} onChange={(v) => setMC(parseInt(v) as 10|20|30)} options={[
            { value:'10', label:'Class 10 — Normal duty motors' },
            { value:'20', label:'Class 20 — High-inertia loads' },
            { value:'30', label:'Class 30 — Very heavy duty' },
          ]} tooltip="IEC 60947-4-1: Class number = max cold trip time in seconds at 7.2×In" />
          <div style={{ height:12 }} />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Service Class" value={serviceClass} onChange={setSC} options={[{ value:'S1', label:'S1 — Continuous' },{ value:'S3', label:'S3 — Intermittent' }]} />
            <SelectInput label="Motor Insulation Class" value={tempClass} onChange={(v) => setTC(v as 'A'|'B'|'F'|'H')} options={[
              { value:'A', label:'Class A (105°C)' },
              { value:'B', label:'Class B (130°C)' },
              { value:'F', label:'Class F (155°C)' },
              { value:'H', label:'Class H (180°C)' },
            ]} />
          </FieldRow>

          <CalcButton onClick={calculate} label="Select Overload Relay" icon={Shield} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
