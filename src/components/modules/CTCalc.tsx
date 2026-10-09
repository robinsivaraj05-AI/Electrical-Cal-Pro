import React, { useState } from 'react';
import { Radio } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#7C3AED';

function calculateCT(inputs: {
  primaryCurrent:number; secondaryCurrent:number; burden:number;
  accuracyClass:string; application:'protection'|'metering'; cableResistance:number;
}): CalculationResult {
  const { primaryCurrent, secondaryCurrent, burden, accuracyClass, application, cableResistance } = inputs;
  const ratio       = primaryCurrent / secondaryCurrent;
  const totalBurden = burden + cableResistance * secondaryCurrent ** 2;
  const alf         = accuracyClass.includes('5P') ? 20 : accuracyClass.includes('10P') ? 10 : 1;
  const rCT         = 0.5;
  const kneePointVoltage = alf * secondaryCurrent * (rCT + cableResistance);

  return {
    values:[
      { label:'CT Ratio',            value:`${ratio}:1`,               unit:'',   highlight:true },
      { label:'Secondary Current',   value:secondaryCurrent.toString(), unit:'A' },
      { label:'Accuracy Class',      value:accuracyClass,              unit:'' },
      { label:'Burden Rating',       value:burden.toString(),           unit:'VA' },
      { label:'Total Burden',        value:totalBurden.toFixed(2),     unit:'VA', status:totalBurden<=burden*1.5?'PASS':'WARNING' },
      { label:'ALF',                 value:alf.toString(),              unit:'' },
      { label:'Min Knee-Point Voltage', value:kneePointVoltage.toFixed(1), unit:'V', highlight:true },
    ],
    status:totalBurden<=burden*1.5?'PASS':'WARNING',
    recommendation:`CT ratio ${ratio}:1, class ${accuracyClass}. Minimum knee-point voltage: ${kneePointVoltage.toFixed(1)} V. Total burden: ${totalBurden.toFixed(1)} VA. ${application==='protection'?`Specify CT class as ${accuracyClass} with Vk ≥ ${kneePointVoltage.toFixed(0)} V.`:`Specify for metering with accuracy ${accuracyClass}.`}`,
    formula:'Vk ≥ ALF × Is × (Rct + RL)',
    steps:[
      { step:1, description:'CT ratio', formula:`n = Ip / Is = ${primaryCurrent} / ${secondaryCurrent}`, result:`${ratio}:1` },
      { step:2, description:'Total burden (VA)', formula:`VA = burden + R_cable × Is² = ${burden} + ${cableResistance} × ${secondaryCurrent}²`, result:`${totalBurden.toFixed(2)} VA` },
      { step:3, description:'Accuracy limiting factor (ALF)', formula:`ALF = ${alf} (from class ${accuracyClass})`, result:`${alf} (IEC 61869-2)` },
      { step:4, description:'Minimum knee-point voltage', formula:`Vk ≥ ALF × Is × (Rct + RL) = ${alf} × ${secondaryCurrent} × (${rCT} + ${cableResistance})`, result:`Vk ≥ ${kneePointVoltage.toFixed(1)} V` },
    ],
    standardRef:{ standard:'IEC 61869-2', clause:'5.3.1', title:'Instrument transformers — Additional requirements for current transformers' },
  };
}

const WHY_ITEMS = [
  { title:'Protection Relay Setting', desc:'CT ratio determines the relay plug setting — the relay operates when CT secondary current exceeds the plug setting' },
  { title:'Accuracy for Metering',    desc:'Revenue metering CTs must be accuracy class 0.2 or 0.5 to meet utility billing accuracy requirements' },
  { title:'Knee-Point Voltage',       desc:'Protection CTs must saturate above the ALF — knee-point voltage determines how accurately the fault current is reproduced' },
  { title:'Burden Matching',          desc:'Total connected burden (relay + cable) must not exceed the CT VA rating — excess burden degrades accuracy' },
  { title:'Cable Lead Resistance',    desc:'Long cable runs between CT and relay panel add resistance that contributes significantly to total burden and Vk requirement' },
  { title:'Differential Protection',  desc:'Differential protection schemes require matched CT ratios and accuracy classes on both sides of the protected equipment' },
];

const NOTES = [
  { color:'#7C3AED', title:'Protection CT Classes — IEC 61869-2',
    body:'5P20: maximum 5% composite error at 20× rated current (ALF=20). Used for overcurrent and earth-fault protection. 10P10: maximum 10% error at 10× rated current — for less critical protection. PX/PS class: special class for differential and restricted earth-fault protection — specified by knee-point voltage and winding resistance rather than accuracy limit.' },
  { color:'#DB2777', title:'Metering CT Classes',
    body:'Class 0.1, 0.2, 0.5, 1, 3, 5 — number indicates maximum percentage error at rated current. Class 0.2 and 0.5 are required for revenue metering. Class 1 for general industrial metering. Class 3 and 5 for approximate measurement only. Metering CTs must not be overloaded — protection elements (5P, 10P) must not be connected to revenue metering inputs.' },
  { color:'#059669', title:'Secondary Current: 1A vs 5A',
    body:'5A secondary: standard for short lead runs within a panel (low cable resistance — burden is small). 1A secondary: used for long lead runs (100 m+) — at 1A, the cable burden is 25× smaller than at 5A for the same resistance, allowing longer cables without exceeding the CT VA rating. Modern numerical relays with input impedance <0.01Ω work well with 1A CTs on long leads.' },
];

export function CTCalc() {
  const { addCalculation } = useStore();
  const [primaryCurrent,  setPC]   = useState('400');
  const [secondaryCurrent,setSC]   = useState('5');
  const [burden,          setBurden]= useState('15');
  const [accuracyClass,   setAC]   = useState('5P20');
  const [application,     setApp]  = useState<'protection'|'metering'>('protection');
  const [cableResistance, setCR]   = useState('0.5');
  const [result,          setResult]= useState<CalculationResult | null>(null);
  const [learningMode,    setLM]   = useState(true);

  const calculate = () => {
    const res = calculateCT({ primaryCurrent:parseFloat(primaryCurrent), secondaryCurrent:parseFloat(secondaryCurrent), burden:parseFloat(burden), accuracyClass, application, cableResistance:parseFloat(cableResistance) });
    setResult(res);
    addCalculation({ type:'ct', title:`CT — ${primaryCurrent}/${secondaryCurrent}A, ${accuracyClass}`, inputs:{ primaryCurrent, secondaryCurrent, burden, accuracyClass, application }, results:res, notes:'', standard:'IEC 61869-2' });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Radio} title="CURRENT TRANSFORMER (CT) CALCULATOR" subtitle="IEC 61869-2 · Ratio, burden, knee-point voltage and accuracy class selection" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="CT Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Primary Current (Ip)" value={primaryCurrent} onChange={setPC} unit="A" min={1} tooltip="Primary rated current — typically the FLC or cable ampacity" />
            <SelectInput label="Secondary Current (Is)" value={secondaryCurrent} onChange={setSC} options={[{ value:'5', label:'5 A — standard' },{ value:'1', label:'1 A — long leads' }]} tooltip="1A secondary for cable runs > 50 m to relay panel" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Relay/Meter Burden" value={burden} onChange={setBurden} unit="VA" min={1} tooltip="Total burden of connected relays, meters and wiring" />
            <TextInput label="Cable Lead Resistance" value={cableResistance} onChange={setCR} unit="Ω" min={0} step={0.05} tooltip="Round-trip resistance of CT secondary cables to relay panel" />
          </FieldRow>

          <SectionLabel title="Accuracy & Application" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Application" value={application} onChange={(v) => setApp(v as 'protection'|'metering')} options={[{ value:'protection', label:'Protection (5P/10P/PX)' },{ value:'metering', label:'Metering (0.1–1 class)' }]} />
            <SelectInput label="Accuracy Class" value={accuracyClass} onChange={setAC} options={[
              { value:'5P20',  label:'5P20 — Protection, ALF=20' },
              { value:'10P10', label:'10P10 — Protection, ALF=10' },
              { value:'PX',    label:'PX/PS — High accuracy protection' },
              { value:'0.2',   label:'0.2 — Precision metering' },
              { value:'0.5',   label:'0.5 — Revenue metering' },
              { value:'1',     label:'1 — General metering' },
            ]} tooltip="IEC 61869-2: 5P20 = 5% error at 20× rated current" />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate CT Parameters" icon={Radio} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
