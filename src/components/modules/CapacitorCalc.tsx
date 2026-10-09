import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#DB2777';

function calcCapacitor(inputs: {
  kva:number; voltage:number; currentPF:number; targetPF:number; frequency:number; detuning:number;
}): CalculationResult {
  const { kva, voltage, currentPF, targetPF, frequency, detuning } = inputs;
  const kw           = kva * currentPF;
  const kvarCurrent  = kva * Math.sin(Math.acos(currentPF));
  const kvarTarget   = kw * Math.tan(Math.acos(targetPF));
  const kvarRequired = kvarCurrent - kvarTarget;
  const kvaNew       = Math.sqrt(kw ** 2 + kvarTarget ** 2);
  const capacitorCurrent = (kvarRequired * 1000) / (Math.sqrt(3) * voltage);
  const omega  = 2 * Math.PI * frequency;
  const xc     = (voltage / Math.sqrt(3)) ** 2 / ((kvarRequired * 1000) / 3);
  const capacitanceMuF = 1e6 / (omega * xc);
  const detuningFreq   = frequency / Math.sqrt(detuning / 100);
  const reactorKvar    = detuning / 100 * kvarRequired;

  return {
    values:[
      { label:'Capacitor Bank Rating', value:kvarRequired.toFixed(1), unit:'kVAR', highlight:true },
      { label:'Power Factor',          value:`${currentPF} → ${targetPF}`, unit:'' },
      { label:'Reactive Power Reduction', value:(kvarCurrent-kvarTarget).toFixed(1), unit:'kVAR', highlight:true },
      { label:'New kVA Demand',        value:kvaNew.toFixed(1),         unit:'kVA' },
      { label:'Capacitor Current',     value:capacitorCurrent.toFixed(1), unit:'A' },
      { label:'Capacitance per Phase', value:capacitanceMuF.toFixed(1), unit:'μF' },
      { label:'Detuning Reactor',      value:reactorKvar.toFixed(1),    unit:`kVAR @ ${detuningFreq.toFixed(0)} Hz` },
    ],
    status:'INFO',
    recommendation:`Install ${kvarRequired.toFixed(0)} kVAR capacitor bank to correct PF from ${currentPF} to ${targetPF}. kVA demand reduces from ${kva.toFixed(0)} to ${kvaNew.toFixed(0)} kVA. Use ${detuning}% detuned reactor (resonant at ${detuningFreq.toFixed(0)} Hz) to prevent harmonic resonance.`,
    formula:'Q_C = P × (tan φ₁ − tan φ₂)',
    steps:[
      { step:1, description:'Current reactive power (Q₁)', formula:`Q₁ = P × tan(cos⁻¹(PF₁)) = ${kw.toFixed(1)} × tan(cos⁻¹(${currentPF}))`, result:`${kvarCurrent.toFixed(1)} kVAR` },
      { step:2, description:'Target reactive power (Q₂)', formula:`Q₂ = P × tan(cos⁻¹(PF₂)) = ${kw.toFixed(1)} × tan(cos⁻¹(${targetPF}))`, result:`${kvarTarget.toFixed(1)} kVAR` },
      { step:3, description:'Required capacitor bank (Q_C)', formula:`Q_C = Q₁ − Q₂ = ${kvarCurrent.toFixed(1)} − ${kvarTarget.toFixed(1)}`, result:`${kvarRequired.toFixed(1)} kVAR` },
      { step:4, description:'Capacitor current', formula:`I_C = Q_C / (√3 × V) = ${(kvarRequired*1000).toFixed(0)} / (√3 × ${voltage})`, result:`${capacitorCurrent.toFixed(1)} A` },
      { step:5, description:'Capacitance per phase', formula:`C = 1 / (ω × Xc) = 1 / (2π × ${frequency} × ${xc.toFixed(2)})`, result:`${capacitanceMuF.toFixed(1)} μF` },
      { step:6, description:'Detuning reactor (harmonic filter)', formula:`Q_reactor = ${detuning}% × ${kvarRequired.toFixed(1)} kVAR, resonant at ${detuningFreq.toFixed(0)} Hz`, result:`${reactorKvar.toFixed(1)} kVAR reactor` },
    ],
    standardRef:{ standard:'IEC 60831-1', clause:'4', title:'Shunt power capacitors for AC power systems' },
  };
}

const WHY_ITEMS = [
  { title:'Reduce kVA Demand',    desc:'Capacitors supply reactive current locally — this reduces the kVA drawn from the utility, reducing maximum demand charges' },
  { title:'Reduce Line Current',  desc:'Lower reactive current means smaller cables, transformers and switchgear for the same active power load' },
  { title:'Improve Voltage',      desc:'Reactive compensation reduces voltage drop across system impedances, improving voltage at load terminals' },
  { title:'Utility Penalties',    desc:'Many utilities impose penalties for power factor below 0.90 — capacitor correction eliminates these charges' },
  { title:'Reduce Losses',        desc:'Lower current due to improved power factor reduces I²R losses in cables and transformer windings' },
  { title:'Harmonic Mitigation',  desc:'Detuned reactors prevent harmonic resonance which can cause overloading of capacitors and distorted supply voltage' },
];

const NOTES = [
  { color:'#DB2777', title:'Power Factor Correction — The Fundamental Formula',
    body:'The reactive power needed to improve PF from φ₁ to φ₂ is: Q_C = P × (tan φ₁ − tan φ₂). Where P = kW (active power), φ₁ = current PF angle, φ₂ = target PF angle. This assumes a purely inductive load — mixed loads with leading PF elements may require separate analysis. Always calculate based on measured kW, not kVA.' },
  { color:'#7C3AED', title:'Harmonic Resonance and Detuned Reactors',
    body:'Capacitor banks and system inductance form a series resonant circuit. If the resonant frequency falls near a harmonic (5th=250 Hz, 7th=350 Hz), harmonic currents are amplified, overloading capacitors and distorting the supply. A detuned reactor (5.67% at 189 Hz, 7% at 148 Hz) shifts the resonant frequency below the 5th harmonic, preventing resonance.' },
  { color:'#059669', title:'Fixed vs Automatic (Stepped) Compensation',
    body:'Fixed banks: simple and cheap — suited for stable base loads that are always present. Stepped (automatic) banks: controller measures PF and switches capacitor steps in/out — suited for variable loads. Automatic systems use PF controllers that add/remove capacitor steps to maintain PF above the target value. Step size should be ≤ the minimum expected load variation.' },
  { color:'#475569', title:'Capacitor Rating Considerations',
    body:'Capacitors must be rated for: (1) System voltage including harmonics (use 415 V capacitors on 400 V systems). (2) Harmonic current — with detuned reactor, capacitor sees amplified voltage at tuned frequency: V_cap = V_system × 1/(1-p) where p=detuning factor. (3) Thermal rating — capacitors must be rated for ambient temperature at installation location.' },
];

export function CapacitorCalc() {
  const { addCalculation } = useStore();
  const [kva,       setKva]   = useState('500');
  const [voltage,   setVolt]  = useState('415');
  const [currentPF, setCPF]   = useState('0.75');
  const [targetPF,  setTPF]   = useState('0.95');
  const [frequency, setFreq]  = useState('50');
  const [detuning,  setDetuning] = useState('7');
  const [result,    setResult] = useState<CalculationResult | null>(null);
  const [learningMode, setLM] = useState(true);

  const calculate = () => {
    const res = calcCapacitor({ kva:parseFloat(kva), voltage:parseFloat(voltage), currentPF:parseFloat(currentPF), targetPF:parseFloat(targetPF), frequency:parseFloat(frequency), detuning:parseFloat(detuning) });
    setResult(res);
    addCalculation({ type:'capacitor', title:`Capacitor Bank — PF ${currentPF}→${targetPF}, ${kva}kVA`, inputs:{ kva, voltage, currentPF, targetPF, frequency, detuning }, results:res, notes:'', standard:'IEC 60831-1' });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Activity} title="CAPACITOR BANK CALCULATOR" subtitle="IEC 60831-1 · Power factor correction, reactive power sizing and detuned reactor" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="System Load" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="System Apparent Power" value={kva} onChange={setKva} unit="kVA" min={1} tooltip="Total connected load or maximum demand in kVA" />
            <TextInput label="System Voltage" value={voltage} onChange={setVolt} unit="V" min={1} tooltip="Line-to-line system voltage at capacitor installation point" />
          </FieldRow>
          <SelectInput label="Supply Frequency" value={frequency} onChange={setFreq} options={[{ value:'50', label:'50 Hz (IEC / Europe / Asia / Australia)' },{ value:'60', label:'60 Hz (ANSI / Americas / Japan)' }]} />

          <SectionLabel title="Power Factor Correction" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Current Power Factor (PF₁)" value={currentPF} onChange={setCPF} min={0.1} max={1} step={0.01} tooltip="Existing measured or estimated lagging power factor" />
            <TextInput label="Target Power Factor (PF₂)" value={targetPF} onChange={setTPF} min={0.8} max={1} step={0.01} tooltip="Required power factor — typically 0.95–1.0 for most utilities" />
          </FieldRow>
          <TextInput label="Detuning Factor (%)" value={detuning} onChange={setDetuning} unit="%" min={3} max={15} step={0.5} tooltip="5.67% → resonant at 210 Hz (avoids 5th harmonic). 7% → resonant at 189 Hz. Use higher value if 5th harmonic is present" />

          <CalcButton onClick={calculate} label="Calculate Capacitor Bank" icon={Activity} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
