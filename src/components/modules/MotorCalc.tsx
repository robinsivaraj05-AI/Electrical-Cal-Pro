import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { calculateMotor } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#0891B2';

const STANDARD_MOTORS = [
  0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5,
  11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200,
].map((kw) => ({ value: kw.toString(), label: kw.toString() }));

const WHY_ITEMS = [
  { title: 'Cable Sizing',       desc: 'Full load current determines the minimum cable cross-section per IEC 60364-5-52 — starting current sizing is not needed for cable' },
  { title: 'OLR Setting',        desc: 'Overload relay is set between 1.0–1.15× FLC per IEC 60947-4-1 — must match motor nameplate current exactly' },
  { title: 'MCCB Selection',     desc: 'For motor circuits MCCB must coordinate with starting current — trip setting above starting current but below cable damage curve' },
  { title: 'Contactor Rating',   desc: 'Contactor AC-3 rating must exceed FLC × service factor — selected from IEC 60947-4-1 tables' },
  { title: 'Starter Sizing',     desc: 'DOL, Star-Delta, Soft Starter and VFD ratings are all based on FLC and starting current requirements' },
  { title: 'Thermal Protection', desc: 'Motor winding thermal protection (PTC thermistor or thermostat) is calibrated to FLC and insulation class' },
];

const NOTES = [
  { color:'#0891B2', title:'Full Load Current Formula (3-Phase)',
    body:'FLC = P × 1000 / (√3 × V × cos φ × η). The starting current multiplies FLC by the starting factor: 6× for DOL, 2× for Star-Delta (during star), 2.5× for Soft Starter, 1.5× for VFD. Starting current determines motor protection device settings but NOT cable sizing — cable is sized for FLC only.' },
  { color:'#7C3AED', title:'Motor Tripping Classes — IEC 60947-4-1',
    body:'Class 10: motor trips within 10 s at 7.2× FLC (cold) — for normal duty motors (centrifugal pumps, fans). Class 20: trips within 20 s at 7.2× FLC — for high inertia loads (crushers, conveyors). Class 30: trips within 30 s at 7.2× FLC — for very heavy starting duty. Select the lowest class that allows the motor to start reliably.' },
  { color:'#059669', title:'IE Efficiency Classes (IEC 60034-30)',
    body:'IE1 (Standard), IE2 (High), IE3 (Premium), IE4 (Super Premium). IE3 motors are mandatory for new installations ≥0.75 kW in many jurisdictions. IE3 motors typically have η = 91–97% at full load vs IE2 at 87–95%. The efficiency difference directly affects FLC: a 1% efficiency improvement reduces current by about 1%.' },
  { color:'#475569', title:'Service Factor and Derating',
    body:'Service factor SF > 1.0 means the motor can be operated at SF × nameplate kW without overheating under ideal conditions. A 75 kW motor with SF=1.15 can sustain 86.25 kW. However, the OLR must still be set to the nameplate FLC, not SF×FLC. For high ambient temperature (>40°C), motor must be derated — check manufacturer curves.' },
];

export function MotorCalc() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [kw,            setKw]          = useState('75');
  const [voltage,       setVoltage]     = useState('415');
  const [phases,        setPhases]      = useState<'1'|'3'>('3');
  const [powerFactor,   setPF]          = useState('0.87');
  const [efficiency,    setEff]         = useState('0.93');
  const [startingMethod,setSM]          = useState<'DOL'|'SD'|'SS'|'VFD'|'ATS'>('DOL');
  const [serviceClass,  setSC]          = useState<'S1'|'S2'|'S3'>('S1');
  const [motorClass,    setMC]          = useState<10|20|30>(10);
  const [result,        setResult]      = useState<CalculationResult | null>(null);
  const [learningMode,  setLM]          = useState(true);

  const calculate = () => {
    const res = calculateMotor({
      kw: parseFloat(kw), voltage: parseFloat(voltage), phases: parseInt(phases) as 1|3,
      powerFactor: parseFloat(powerFactor), efficiency: parseFloat(efficiency),
      startingMethod, serviceClass, motorClass,
    });
    setResult(res);
    addCalculation({
      type:'motor', title:`Motor — ${kw}kW, ${voltage}V, ${startingMethod} Start`,
      inputs:{ kw, voltage, phases, powerFactor, efficiency, startingMethod, serviceClass, motorClass },
      results:res, notes:'', standard:'IEC 60947-4-1',
    });
  };

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'Motor Calculator', inputs:{ 'Motor Rating':`${kw} kW`, 'Voltage':`${voltage} V`, Phase:`${phases}-Phase`, 'cos φ':powerFactor, 'η':efficiency, 'Starting Method':startingMethod }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'motor' });
  };
  const handleXLS = () => { if (result) exportToExcel('Motor Calculator', { kw, voltage, startingMethod }, result); };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Cpu} title="MOTOR CALCULATOR" subtitle="IEC 60947-4-1 · FLC, starting current, OLR, MCCB, cable selection and starter sizing" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <QuickPills label="IEC Standard Motor Ratings (kW)" items={STANDARD_MOTORS} active={kw} onSelect={setKw} accentColor={ACCENT} />

          <SectionLabel title="Motor Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Motor Power" value={kw} onChange={setKw} unit="kW" min={0.1} step={0.1} />
            <TextInput label="Supply Voltage" value={voltage} onChange={setVoltage} unit="V" min={1} />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Phase System" value={phases} onChange={(v) => setPhases(v as '1'|'3')} options={[{ value:'3', label:'3-Phase AC' },{ value:'1', label:'1-Phase AC' }]} />
            <TextInput label="Power Factor (cos φ)" value={powerFactor} onChange={setPF} min={0.5} max={1} step={0.01} tooltip="Full load power factor (typical: 0.80–0.90)" />
          </FieldRow>
          <TextInput label="Efficiency (η)" value={efficiency} onChange={setEff} min={0.5} max={1} step={0.01} tooltip="Full load efficiency from motor nameplate (typical: 0.85–0.96)" />

          <SectionLabel title="Starting & Protection" />
          <SelectInput label="Starting Method" value={startingMethod} onChange={(v) => setSM(v as 'DOL'|'SD'|'SS'|'VFD'|'ATS')} options={[
            { value:'DOL', label:'DOL — Direct On Line (6× FLC)' },
            { value:'SD',  label:'Star-Delta — 2× FLC' },
            { value:'SS',  label:'Soft Starter — 2.5× FLC' },
            { value:'VFD', label:'VFD Drive — 1.5× FLC' },
            { value:'ATS', label:'Auto-Transformer — 3× FLC' },
          ]} />
          <div style={{ height:12 }} />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Motor Tripping Class" value={motorClass.toString()} onChange={(v) => setMC(parseInt(v) as 10|20|30)} options={[
              { value:'10', label:'Class 10 — Normal duty' },
              { value:'20', label:'Class 20 — Heavy duty' },
              { value:'30', label:'Class 30 — Very heavy' },
            ]} tooltip="IEC 60947-4-1: Class = max cold trip time at 7.2× FLC" />
            <SelectInput label="Service Duty" value={serviceClass} onChange={(v) => setSC(v as 'S1'|'S2'|'S3')} options={[
              { value:'S1', label:'S1 — Continuous' },
              { value:'S2', label:'S2 — Short time' },
              { value:'S3', label:'S3 — Intermittent' },
            ]} />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate Motor Parameters" icon={Cpu} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
