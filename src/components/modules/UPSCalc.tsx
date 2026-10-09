import React, { useState } from 'react';
import { Battery } from 'lucide-react';
import { calculateUPS } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#CA8A04';

const BACKUP_TIMES = [
  { value:'0.167', label:'10 min' },
  { value:'0.25',  label:'15 min' },
  { value:'0.5',   label:'30 min' },
  { value:'1',     label:'1 hr' },
  { value:'2',     label:'2 hrs' },
  { value:'4',     label:'4 hrs' },
  { value:'8',     label:'8 hrs' },
];

const WHY_ITEMS = [
  { title:'UPS Rating (kVA)',    desc:'UPS must be rated above the peak connected load including power factor — undersizing causes overload trip' },
  { title:'Battery Ah Capacity', desc:'Ah determines how long the UPS can sustain the load — verified as: Ah = (I × T × DF) where DF is depletion factor' },
  { title:'Number of Cells',     desc:'Battery string voltage must equal the UPS DC bus voltage — cell count = V_bus / V_cell_nominal' },
  { title:'Charger Rating',      desc:'Charger must recharge the battery within 8 hours while simultaneously supplying loads' },
  { title:'Redundancy',          desc:'N+1 configuration provides fault tolerance — if one UPS unit fails, the remaining units carry the load' },
  { title:'Battery Type',        desc:'VRLA is the most common — Li-Ion offers smaller size and longer cycle life but higher initial cost' },
];

const NOTES = [
  { color:'#CA8A04', title:'UPS Sizing — IEC 62040-3',
    body:'UPS output rating: S_UPS = S_load × Derating factor. For N+1 redundancy, each UPS unit must be rated for the full load. Battery capacity: Ah = (P × T) / (V_battery × η_discharge) where T is backup time in hours. Always use the battery manufacturer\'s Ah rating at the required discharge rate (C10 for most UPS, C5 or C3 for short backup times).' },
  { color:'#7C3AED', title:'Battery Types: VRLA vs NiCd vs Li-Ion',
    body:'VRLA (Valve Regulated Lead-Acid): 2V/cell, cycle life 200–500 cycles, service life 5–10 years, low cost. NiCd: 1.2V/cell, cycle life >2000 cycles, very wide temperature range (-40°C to +50°C), used in industrial applications. Li-Ion: 3.6V/cell, cycle life 2000+ cycles, 50% smaller and lighter than VRLA, service life >15 years — preferred for modern data centre installations.' },
  { color:'#059669', title:'Redundancy Configurations',
    body:'N (no redundancy): single UPS, no fault tolerance — for non-critical loads. N+1: M units of which any M-1 can supply the load — for critical loads. 2N (dual bus): two completely independent UPS systems each rated for 100% load — for Tier 3/4 data centres. 2N+1: highest availability, used in critical financial and telecommunications infrastructure.' },
  { color:'#475569', title:'Battery Room Design Considerations',
    body:'Battery room requires ventilation to remove hydrogen gas (produced during charging at 0.003% H2 by volume — flammable at >4%). VRLA batteries emit minimal hydrogen but room ventilation is still required. Temperature control: battery life halves for every 8°C above 25°C — maintain 20–25°C for maximum battery life. Battery room fire suppression systems should be compatible with the battery type (clean agent for VRLA, not CO2).' },
];

export function UPSCalc() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [loadKva,       setLoad]    = useState('50');
  const [powerFactor,   setPF]      = useState('0.8');
  const [backupTime,    setBT]      = useState('0.5');
  const [batteryVoltage,setBV]      = useState('240');
  const [efficiency,    setEff]     = useState('0.93');
  const [redundancy,    setRedun]   = useState<'N'|'N+1'|'2N'>('N+1');
  const [batteryType,   setBType]   = useState<'VRLA'|'NiCd'|'Li-Ion'>('VRLA');
  const [dischargeRate, setDR]      = useState('10');
  const [result,        setResult]  = useState<CalculationResult | null>(null);
  const [learningMode,  setLM]      = useState(true);

  const calculate = () => {
    const res = calculateUPS({ loadKva:parseFloat(loadKva), powerFactor:parseFloat(powerFactor), backupTime:parseFloat(backupTime), batteryVoltage:parseFloat(batteryVoltage), efficiency:parseFloat(efficiency), redundancy, batteryType, dischargeRate:parseFloat(dischargeRate) });
    setResult(res);
    addCalculation({ type:'ups', title:`UPS — ${loadKva}kVA, ${parseFloat(backupTime)*60}min backup`, inputs:{ loadKva, powerFactor, backupTime, batteryVoltage, efficiency, redundancy, batteryType }, results:res, notes:'', standard:'IEC 62040-3' });
  };

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'UPS Calculator', inputs:{ Load:`${loadKva} kVA`, 'PF':powerFactor, 'Backup':`${parseFloat(backupTime)*60} min`, 'Battery':`${batteryVoltage}V DC ${batteryType}`, Redundancy:redundancy }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'ups' });
  };
  const handleXLS = () => { if (result) exportToExcel('UPS Calculator', { loadKva, backupTime, batteryType }, result); };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Battery} title="UPS CALCULATOR" subtitle="IEC 62040-3 · UPS rating, battery Ah, cell count, charger sizing and autonomy" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="Load Parameters" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Total Load" value={loadKva} onChange={setLoad} unit="kVA" min={0.1} tooltip="Total connected load apparent power in kVA" />
            <TextInput label="Load Power Factor" value={powerFactor} onChange={setPF} min={0.5} max={1} step={0.05} tooltip="Weighted average load power factor (typically 0.8–0.9 for IT equipment)" />
          </FieldRow>

          <QuickPills label="Required Backup Time" items={BACKUP_TIMES} active={backupTime} onSelect={setBT} accentColor={ACCENT} />
          <TextInput label="Backup Time (hrs)" value={backupTime} onChange={setBT} unit="hrs" min={0.083} max={24} step={0.083} tooltip="0.5 = 30 min, 1 = 1 hour, 4 = 4 hours" />

          <SectionLabel title="Battery System" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Battery Type" value={batteryType} onChange={(v) => setBType(v as 'VRLA'|'NiCd'|'Li-Ion')} options={[
              { value:'VRLA',   label:'VRLA Lead-Acid (2V/cell)' },
              { value:'NiCd',   label:'NiCd (1.2V/cell)' },
              { value:'Li-Ion', label:'Li-Ion (3.6V/cell)' },
            ]} />
            <SelectInput label="DC Bus Voltage" value={batteryVoltage} onChange={setBV} options={[
              { value:'48',  label:'48 V DC' },
              { value:'96',  label:'96 V DC' },
              { value:'110', label:'110 V DC' },
              { value:'120', label:'120 V DC' },
              { value:'240', label:'240 V DC' },
              { value:'480', label:'480 V DC' },
            ]} />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Discharge Rate" value={dischargeRate} onChange={setDR} unit="C" min={1} max={20} step={1} tooltip="C10 = 10-hour discharge rate (standard). Use C5 or C3 for short backup times" />
            <TextInput label="UPS Efficiency (η)" value={efficiency} onChange={setEff} min={0.8} max={0.99} step={0.01} tooltip="Double conversion UPS: typically 0.92–0.96. Online interactive: 0.95–0.99" />
          </FieldRow>

          <SectionLabel title="Redundancy" />
          <SelectInput label="UPS Redundancy Configuration" value={redundancy} onChange={(v) => setRedun(v as 'N'|'N+1'|'2N')} options={[
            { value:'N',   label:'N — No redundancy (single unit)' },
            { value:'N+1', label:'N+1 — One additional unit standby' },
            { value:'2N',  label:'2N — Full dual-bus redundancy' },
          ]} tooltip="N+1 and 2N configurations provide fault tolerance for critical loads" />

          <CalcButton onClick={calculate} label="Calculate UPS System" icon={Battery} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
