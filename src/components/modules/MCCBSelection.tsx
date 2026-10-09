import React, { useState } from 'react';
import { Bolt } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#BE123C';
const MCCB_RATINGS = [16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600];
const MCCB_ICU     = [10,16,25,36,50,70,85,100,120,150];

function calcMCCB(inputs: {
  loadCurrent:number; faultCurrent:number;
  loadType:'motor'|'feeder'|'transformer'; magneticMult:number; ambient:number;
}): CalculationResult {
  const { loadCurrent, faultCurrent, loadType, magneticMult, ambient } = inputs;
  const tempDerating  = ambient > 40 ? 1 - (ambient - 40) * 0.005 : 1.0;
  const factor        = loadType === 'motor' ? 2.5 : 1.25;
  const designCurrent = loadCurrent * factor;
  const ratedCurrent  = MCCB_RATINGS.find((r) => r >= designCurrent) ?? MCCB_RATINGS[MCCB_RATINGS.length - 1];
  const deratedRating = ratedCurrent * tempDerating;
  const icuRequired   = Math.ceil(faultCurrent / 1000);
  const icuSelected   = MCCB_ICU.find((i) => i >= icuRequired) ?? MCCB_ICU[MCCB_ICU.length - 1];
  const magneticTrip  = ratedCurrent * magneticMult;
  const passes        = deratedRating >= loadCurrent;

  return {
    values: [
      { label:'MCCB Rated Current',     value:ratedCurrent.toString(),          unit:'A',    highlight:true },
      { label:'Derated Capacity',        value:deratedRating.toFixed(1),         unit:'A',    status:passes ? 'PASS' : 'FAIL' },
      { label:'Breaking Capacity (Icu)', value:icuSelected.toString(),           unit:'kA',   highlight:true },
      { label:'Magnetic Trip Setting',   value:magneticTrip.toFixed(0),          unit:'A' },
      { label:'Thermal Trip Range',      value:`${(ratedCurrent*0.8).toFixed(0)}–${ratedCurrent}`, unit:'A' },
      { label:'Frame Size',              value:ratedCurrent<=160?'S':ratedCurrent<=400?'M':'L', unit:'frame' },
    ],
    status: passes ? 'PASS' : 'FAIL',
    recommendation:`Select ${ratedCurrent} A MCCB with ${icuSelected} kA breaking capacity (Icu). Magnetic trip at ${magneticTrip.toFixed(0)} A (${magneticMult}× Iₙ). ${passes ? 'ADEQUATE for load.' : 'INCREASE rating — derated capacity below load current.'}`,
    formula:'Iₙ ≥ I_design; Icu ≥ I_sc',
    steps:[
      { step:1, description:'Design current (with safety margin)', formula:`I_design = I_load × factor = ${loadCurrent} × ${factor}`, result:`${designCurrent.toFixed(1)} A` },
      { step:2, description:'Select MCCB rated current (next standard size)', formula:`Iₙ ≥ ${designCurrent.toFixed(1)} A → Select ${ratedCurrent} A`, result:`${ratedCurrent} A MCCB` },
      { step:3, description:'Temperature derating', formula:`Derated = ${ratedCurrent} × ${tempDerating.toFixed(3)} (at ${ambient}°C)`, result:`${deratedRating.toFixed(1)} A` },
      { step:4, description:'Breaking capacity (Icu) selection', formula:`I_sc = ${faultCurrent} A = ${(faultCurrent/1000).toFixed(1)} kA → Icu ≥ ${icuRequired} kA → Select ${icuSelected} kA`, result:`Icu = ${icuSelected} kA` },
      { step:5, description:'Magnetic (instantaneous) trip setting', formula:`I_mag = ${ratedCurrent} × ${magneticMult} = ${magneticTrip.toFixed(0)} A`, result:`Set at ${magneticTrip.toFixed(0)} A` },
    ],
    standardRef:{ standard:'IEC 60947-2', clause:'4.3', title:'Low-voltage switchgear — Circuit-breakers' },
  };
}

const WHY_ITEMS = [
  { title:'Overload Protection',   desc:'Thermal element trips the MCCB within seconds for sustained overloads, protecting cables and equipment' },
  { title:'Short-circuit Protection', desc:'Instantaneous magnetic element interrupts the circuit in <20 ms for faults, before equipment is damaged' },
  { title:'Breaking Capacity',     desc:'Icu must exceed the prospective fault current — an undersized breaker can weld closed or explode under fault conditions' },
  { title:'Discrimination',        desc:'Upstream and downstream breakers must be coordinated so only the affected breaker trips — selectivity requires careful rating' },
  { title:'Temperature Derating',  desc:'MCCB continuous current rating decreases 0.5% per °C above 40°C — high ambient areas require a higher rated device' },
  { title:'Motor vs Feeder Rating',desc:'Motor circuits use 2.5× design factor to accommodate inrush; general feeders use 1.25× — using wrong factor risks nuisance trips' },
];

const NOTES = [
  { color:'#BE123C', title:'MCCB vs MCB vs RCCB — Selection Guide',
    body:'MCCB (Moulded Case Circuit Breaker): adjustable settings, 16 A–1600 A, Icu 10–150 kA — for feeders, sub-main distribution and motor circuits. MCB (Miniature Circuit Breaker): fixed settings, 1 A–125 A, Icu 6–25 kA — for final circuits. RCCB/RCBO: residual current protection — for personnel protection in SELV/PELV circuits and wet areas.' },
  { color:'#7C3AED', title:'Magnetic Trip Setting',
    body:'For motor circuits: magnetic trip = 10–12× rated current to avoid tripping on starting current. For feeder circuits: magnetic trip = 5–8× rated current. For transformer protection: magnetic trip = 8–12× to accommodate inrush. The magnetic trip level is set considering the maximum asymmetric current contribution and any transformer magnetising inrush.' },
  { color:'#059669', title:'Selectivity (Discrimination)',
    body:'For vertical discrimination (upstream/downstream), the downstream breaker must clear the fault before the upstream breaker trips. Time-Current Characteristic (TCC) plots are used to verify discrimination. A minimum of 10:1 current ratio between upstream and downstream MCCB ratings generally ensures discrimination in the overload region.' },
];

export function MCCBSelection() {
  const { addCalculation } = useStore();
  const [loadCurrent,  setLC]    = useState('150');
  const [faultCurrent, setFC]    = useState('25000');
  const [loadType,     setLT]    = useState<'motor'|'feeder'|'transformer'>('feeder');
  const [magneticMult, setMM]    = useState('10');
  const [ambient,      setAmb]   = useState('40');
  const [result,       setResult]= useState<CalculationResult | null>(null);
  const [learningMode, setLM]    = useState(true);

  const calculate = () => {
    const res = calcMCCB({ loadCurrent:parseFloat(loadCurrent), faultCurrent:parseFloat(faultCurrent), loadType, magneticMult:parseFloat(magneticMult), ambient:parseFloat(ambient) });
    setResult(res);
    addCalculation({ type:'mccb', title:`MCCB Selection — ${loadCurrent}A load, ${(parseFloat(faultCurrent)/1000).toFixed(1)}kA fault`, inputs:{ loadCurrent, faultCurrent, loadType, magneticMult, ambient }, results:res, notes:'', standard:'IEC 60947-2' });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Bolt} title="MCCB SELECTION" subtitle="IEC 60947-2 · Rated current, breaking capacity, magnetic and thermal trip settings" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="Circuit Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Load Current" value={loadCurrent} onChange={setLC} unit="A" min={1} tooltip="Full load current of the protected circuit" />
            <TextInput label="Prospective Fault Current" value={faultCurrent} onChange={setFC} unit="A" min={100} tooltip="Maximum short-circuit current at the MCCB installation point" />
          </FieldRow>
          <TextInput label="Ambient Temperature" value={ambient} onChange={setAmb} unit="°C" min={20} max={60} tooltip="Temperature inside the enclosure — affects MCCB derating" />

          <SectionLabel title="MCCB Configuration" />
          <SelectInput label="Load Type" value={loadType} onChange={(v) => setLT(v as 'motor'|'feeder'|'transformer')} options={[
            { value:'feeder',      label:'Feeder / General (×1.25)' },
            { value:'motor',       label:'Motor circuit (×2.5)' },
            { value:'transformer', label:'Transformer (×1.25)' },
          ]} tooltip="Load type determines the design current safety factor applied before selecting MCCB rating" />
          <div style={{ height:12 }} />
          <TextInput label="Magnetic Trip Multiplier" value={magneticMult} onChange={setMM} min={2} max={15} step={0.5} tooltip="Instantaneous trip = multiplier × Iₙ. Motor: 10-12×  Feeder: 5-8×  Transformer: 8-12×" />

          <CalcButton onClick={calculate} label="Select MCCB" icon={Bolt} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
