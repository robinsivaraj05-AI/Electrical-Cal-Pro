import React, { useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { calculateVoltageDrop } from '../../utils/calculations';
import { STANDARD_SIZES_MM2 } from '../../data/cableData';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#D97706';

const WHY_ITEMS = [
  { title: 'Motor Performance',   desc: 'Low voltage causes motors to draw higher current, overheat and deliver reduced torque — IEC limit: 5% for motors' },
  { title: 'Lighting Quality',    desc: 'Voltage below rated value causes dimming, flickering and reduced lamp life — IEC limit: 3% for lighting circuits' },
  { title: 'Equipment Reliability', desc: 'Most electronic equipment requires voltage within ±5% of nominal for reliable operation' },
  { title: 'Cable Selection',     desc: 'Voltage drop can govern cable selection even when thermal current is satisfied — longer runs often need upsizing' },
  { title: 'Harmonics',           desc: 'Higher harmonic content increases effective cable impedance and worsens voltage drop at harmonic frequencies' },
  { title: 'Power Quality',       desc: 'Excessive voltage drop reduces apparent power factor at the load terminals, affecting metering and billing' },
];

const NOTES = [
  { color:'#D97706', title:'Full Impedance Method — IEC 60364-5-52 Annex G',
    body:'ΔV = √3 × I × L × (R·cosφ + X·sinφ) / 1000 (3-phase). For single phase: ΔV = 2 × I × L × (R·cosφ + X·sinφ) / 1000 (factor 2 for return conductor). R and X are the conductor resistance and reactance per km. The percentage voltage drop is ΔV% = (ΔV / Vn) × 100.' },
  { color:'#2563EB', title:'Standard Voltage Drop Limits',
    body:'IEC 60364-5-52 Annex G recommends: 3% for lighting circuits; 5% for other loads (motors, general). These are from the supply terminals to the load. Local regulations or project specifications may impose stricter limits (e.g., 2.5% for critical loads, 3% for general LV from MV/LV transformer). Always check the applicable standard and project specification.' },
  { color:'#059669', title:'Resistance and Reactance Values',
    body:'The resistance values used are at maximum operating temperature (90°C for XLPE, 70°C for PVC). Cu resistivity at 90°C: ≈0.0217 Ω·mm²/m; at 70°C: ≈0.0196 Ω·mm²/m. Al resistivity is approximately 1.64× higher. Cable reactance X ≈ 0.08 Ω/km for multi-core cables — significant for large cross-sections and long runs.' },
  { color:'#475569', title:'When Voltage Drop Governs Cable Selection',
    body:'For long cable runs (>100 m) supplying motors, voltage drop commonly requires a larger cable than the thermal calculation alone. Run both calculations — cable sizing (ampacity) and voltage drop — and select the larger of the two cross-sections.' },
];

export function VoltageDrop() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [current,     setCurrent]    = useState('100');
  const [length,      setLength]     = useState('200');
  const [voltage,     setVoltage]    = useState('415');
  const [powerFactor, setPF]         = useState('0.85');
  const [phases,      setPhases]     = useState<'1'|'3'>('3');
  const [conductor,   setConductor]  = useState<'Cu'|'Al'>('Cu');
  const [insulation,  setInsulation] = useState<'PVC'|'XLPE'>('XLPE');
  const [cableSize,   setCableSize]  = useState('35');
  const [loadType,    setLoadType]   = useState<'motor'|'general'>('motor');
  const [maxVdPct,    setMaxVdPct]   = useState('');   // empty = use IEC default
  const [result,      setResult]     = useState<CalculationResult | null>(null);
  const [learningMode, setLM]        = useState(true);

  // Keep the custom limit in sync with the load-type default so users see the pre-fill
  const iecDefault = loadType === 'motor' ? '5' : '3';
  const effectiveMax = maxVdPct !== '' ? parseFloat(maxVdPct) : undefined;

  const calculate = () => {
    const res = calculateVoltageDrop({
      current: parseFloat(current), length: parseFloat(length), conductor, insulation,
      cableSize: parseFloat(cableSize), phases: parseInt(phases) as 1|3,
      powerFactor: parseFloat(powerFactor), voltage: parseFloat(voltage),
      loadType, maxVdPct: effectiveMax,
    });
    setResult(res);
    addCalculation({
      type:'voltage-drop',
      title:`Voltage Drop — ${cableSize}mm² ${conductor}, ${length}m`,
      inputs:{ current, length, conductor, insulation, cableSize, phases, powerFactor, voltage, loadType },
      results:res, notes:'', standard:'IEC 60364-5-52',
    });
  };

  const sizeItems = (STANDARD_SIZES_MM2.filter((s) => s <= 300) as number[]).map((s) => ({ value:s.toString(), label:`${s}` }));

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'Voltage Drop Calculator', inputs:{ 'Load Current':`${current} A`, 'Cable Length':`${length} m`, 'Cable Size':`${cableSize} mm²`, 'System Voltage':`${voltage} V`, Phase:`${phases}-Phase`, Conductor:conductor }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'voltage-drop' });
  };
  const handleXLS = () => { if (result) exportToExcel('Voltage Drop', { current, length, cableSize, voltage }, result); };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={TrendingDown} title="VOLTAGE DROP CALCULATOR" subtitle="IEC 60364-5-52 Annex G · Full impedance method R·cosφ + X·sinφ" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="Load & Circuit" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Load Current" value={current} onChange={setCurrent} unit="A" min={0.1} tooltip="Full load current in amperes" />
            <TextInput label="Cable Length (one-way)" value={length} onChange={setLength} unit="m" min={1} tooltip="One-way cable run length — the formula accounts for the return path" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="System Voltage" value={voltage} onChange={setVoltage} unit="V" min={1} />
            <TextInput label="Power Factor (cos φ)" value={powerFactor} onChange={setPF} min={0.1} max={1} step={0.01} tooltip="Load power factor — affects the R·cosφ + X·sinφ impedance components" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Phase System" value={phases} onChange={(v) => setPhases(v as '1'|'3')} options={[{ value:'3', label:'3-Phase (√3 factor)' },{ value:'1', label:'1-Phase (×2 factor)' }]} />
            <SelectInput label="Load Type (IEC default)" value={loadType} onChange={(v) => setLoadType(v as 'motor'|'general')} options={[{ value:'motor', label:'Motor — IEC default 5%' },{ value:'general', label:'General — IEC default 3%' }]} tooltip="Sets the IEC 60364-5-52 Annex G default limit; override below if project specification differs" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label={`Max VD limit (blank = IEC default ${iecDefault}%)`} value={maxVdPct} onChange={setMaxVdPct} unit="%" min={0.1} max={20} step={0.1} tooltip="Override the IEC default with project specification limit (e.g. 2.5% for critical loads, 5% per AS/NZS 3008). Leave blank to use IEC 60364-5-52 recommendation." />
          </FieldRow>

          <SectionLabel title="Cable Properties" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Conductor" value={conductor} onChange={(v) => setConductor(v as 'Cu'|'Al')} options={[{ value:'Cu', label:'Copper (Cu)' },{ value:'Al', label:'Aluminium (Al)' }]} />
            <SelectInput label="Insulation" value={insulation} onChange={(v) => setInsulation(v as 'PVC'|'XLPE')} options={[{ value:'XLPE', label:'XLPE (90°C)' },{ value:'PVC', label:'PVC (70°C)' }]} />
          </FieldRow>

          <QuickPills label="Cable Size (mm²)" items={sizeItems} active={cableSize} onSelect={setCableSize} accentColor={ACCENT} />

          <CalcButton onClick={calculate} label="Calculate Voltage Drop" icon={TrendingDown} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
