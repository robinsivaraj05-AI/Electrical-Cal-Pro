import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { calculateTransformer } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#4F46E5';

const STANDARD_KVA = [25,50,100,160,200,315,400,500,630,800,1000,1250,1600,2000,2500,3150]
  .map((k) => ({ value:k.toString(), label:k>=1000?`${k/1000}M`:k.toString() }));

const WHY_ITEMS = [
  { title:'LV Feeder Design',   desc:'Secondary full load current determines the size of LV busbars, feeders, switchgear and distribution board' },
  { title:'HV Protection Relay',desc:'Primary current determines the HV current transformer ratio and overcurrent relay plug settings' },
  { title:'Fault Level (MVA)',   desc:'Transformer impedance (Zk%) limits the maximum fault current that can flow on the LV busbars' },
  { title:'Transformer Losses', desc:'Iron losses (no-load) and copper losses (load) affect transformer efficiency and heat generation' },
  { title:'Voltage Regulation', desc:'Zk% causes voltage drop at LV terminals under load — high Zk% means poor regulation' },
  { title:'Parallel Operation', desc:'Transformers can be paralleled only if they have the same Zk%, same vector group and same voltage ratio' },
];

const NOTES = [
  { color:'#4F46E5', title:'Transformer Current Calculation — IEC 60076-1',
    body:'Primary current: I_p = S / (√3 × V_p). Secondary current: I_s = S / (√3 × V_s). Where S is the rated apparent power in VA. These are the rated (nameplate) currents — actual current depends on the load factor applied to the transformer.' },
  { color:'#DC2626', title:'Short-circuit Current at LV Busbars',
    body:'The maximum LV fault current is limited by the transformer impedance: I_sc = I_rated / (Zk% / 100). For example, a 1 MVA, 415V, 6% transformer gives I_rated = 1390 A and I_sc = 1390 / 0.06 = 23.2 kA. This is the value used to select LV circuit breakers (MCCB/ACB) and busbar ratings.' },
  { color:'#059669', title:'Vector Group Selection',
    body:'Dyn11 (HV Delta / LV Star with neutral): most common for distribution transformers supplying mixed loads. Provides neutral for single-phase loads and isolates HV and LV zero-sequence circuits. Yyn0: used when the HV system is also star-connected. The clock group number (0, 11) describes the phase shift between HV and LV windings.' },
  { color:'#475569', title:'Load Factor and Overloading',
    body:'Transformer loading beyond 100% is sometimes acceptable for short periods. IEC 60076-7 (Loading Guide) specifies permissible overloading based on ambient temperature, initial load level and transformer thermal model. In practice, transformers are normally designed for 80% loading to allow for future load growth.' },
];

export function TransformerCalc() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [kva,            setKva]    = useState('1000');
  const [primaryVoltage, setPV]     = useState('11000');
  const [secondaryVoltage, setSV]   = useState('415');
  const [impedance,      setImpedance] = useState('6');
  const [efficiency,     setEff]    = useState('0.985');
  const [powerFactor,    setPF]     = useState('0.85');
  const [loadFactor,     setLF]     = useState('80');
  const [connection,     setConn]   = useState<'Dyn11'|'Yyn0'|'Yzn11'|'DY'>('Dyn11');
  const [result,         setResult] = useState<CalculationResult | null>(null);
  const [learningMode,   setLM]     = useState(true);

  const calculate = () => {
    const res = calculateTransformer({
      kva:parseFloat(kva), primaryVoltage:parseFloat(primaryVoltage), secondaryVoltage:parseFloat(secondaryVoltage),
      impedance:parseFloat(impedance), efficiency:parseFloat(efficiency), powerFactor:parseFloat(powerFactor),
      loadFactor:parseFloat(loadFactor), connection,
    });
    setResult(res);
    addCalculation({ type:'transformer', title:`Transformer — ${kva}kVA, ${parseInt(primaryVoltage)/1000}kV/${secondaryVoltage}V`, inputs:{ kva, primaryVoltage, secondaryVoltage, impedance, efficiency, powerFactor, loadFactor, connection }, results:res, notes:'', standard:'IEC 60076-1' });
  };

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'Transformer Calculator', inputs:{ Rating:`${kva} kVA`, 'HV':`${primaryVoltage} V`, 'LV':`${secondaryVoltage} V`, 'Zk%':`${impedance}%`, 'Vector Group':connection }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'transformer' });
  };
  const handleXLS = () => { if (result) exportToExcel('Transformer Calculator', { kva, primaryVoltage, secondaryVoltage }, result); };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Activity} title="TRANSFORMER CALCULATOR" subtitle="IEC 60076-1 · Primary/secondary currents, fault level, losses and efficiency" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <QuickPills label="Standard kVA Ratings" items={STANDARD_KVA} active={kva} onSelect={setKva} accentColor={ACCENT} />

          <SectionLabel title="Transformer Data" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Rated Apparent Power" value={kva} onChange={setKva} unit="kVA" min={1} />
            <TextInput label="Impedance Voltage (Zk%)" value={impedance} onChange={setImpedance} unit="%" min={1} max={15} step={0.5} tooltip="Short-circuit impedance — limits LV fault current. Typical: 4–8% for distribution transformers" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Primary Voltage (HV)" value={primaryVoltage} onChange={setPV} unit="V" min={1} tooltip="Line-to-line voltage on the high voltage winding" />
            <TextInput label="Secondary Voltage (LV)" value={secondaryVoltage} onChange={setSV} unit="V" min={1} tooltip="Line-to-line no-load voltage on the low voltage winding" />
          </FieldRow>
          <SelectInput label="Vector Group" value={connection} onChange={(v) => setConn(v as 'Dyn11'|'Yyn0'|'Yzn11'|'DY')} options={[
            { value:'Dyn11', label:'Dyn11 (HV Delta / LV Star) — Most common' },
            { value:'Yyn0',  label:'Yyn0 (HV Star / LV Star)' },
            { value:'Yzn11', label:'Yzn11 (HV Star / LV Zigzag)' },
            { value:'DY',    label:'DY (Step-up)' },
          ]} tooltip="Vector group determines winding connections and phase shift. Dyn11 is standard for distribution" />

          <SectionLabel title="Loading Conditions" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Load Factor" value={loadFactor} onChange={setLF} unit="%" min={0} max={150} tooltip="Current loading as percentage of rated kVA" />
            <TextInput label="Load Power Factor" value={powerFactor} onChange={setPF} min={0.1} max={1} step={0.01} tooltip="Weighted average power factor of connected loads" />
          </FieldRow>
          <TextInput label="Transformer Efficiency (η)" value={efficiency} onChange={setEff} min={0.9} max={1} step={0.001} tooltip="Rated efficiency from nameplate (typically 0.980–0.997 for modern transformers)" />

          <CalcButton onClick={calculate} label="Calculate Transformer" icon={Activity} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
