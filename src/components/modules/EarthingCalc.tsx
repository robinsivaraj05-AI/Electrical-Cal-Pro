import React, { useState } from 'react';
import { CloudLightning } from 'lucide-react';
import { calculateEarthing } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#16A34A';

const SOIL_TYPES = [
  { value:'10',    label:'10 Ω·m — Sea water / moist clay' },
  { value:'50',    label:'50 Ω·m — Clay, loam' },
  { value:'100',   label:'100 Ω·m — Agricultural soil' },
  { value:'300',   label:'300 Ω·m — Dry soil / gravel' },
  { value:'1000',  label:'1000 Ω·m — Rock / dry sand' },
  { value:'3000',  label:'3000 Ω·m — Granite / dry rock' },
];

const WHY_ITEMS = [
  { title:'Personnel Safety',       desc:'Touch and step voltage must remain below safe thresholds — IEEE 80 sets tolerable limits based on body weight and soil resistivity' },
  { title:'Equipment Protection',   desc:'Low earth grid resistance ensures fault current flows safely to earth and protection devices operate within required time' },
  { title:'Fault Clearance',        desc:'High earth resistance can prevent adequate fault current flow, causing protection relays to fail to operate or operate slowly' },
  { title:'Lightning Protection',   desc:'Earthing system provides the discharge path for lightning protection systems — must handle peak lightning current (≥100 kA)' },
  { title:'EMC / Interference',     desc:'A low impedance earth reference reduces electromagnetic interference in instrumentation and control systems' },
  { title:'Regulatory Compliance',  desc:'IEEE 80 (substations), IEC 60364-5-54 (buildings) and IS 3043 (India) specify mandatory earthing requirements' },
];

const NOTES = [
  { color:'#16A34A', title:'Earth Grid Resistance — Schwarz Formula (IEEE 80)',
    body:'IEEE 80 uses the Schwarz formula: Rg = ρ/(4√A) + ρ/L. Where ρ = soil resistivity (Ω·m), A = grid area (m²), L = total conductor length (m). The first term represents the resistance due to grid area, the second term accounts for the conductor length contribution. Earth pits contribute in parallel: Rpit = ρ×ln(2h/d)/(2πL_pit). Combined resistance uses parallel combination.' },
  { color:'#DC2626', title:'Touch and Step Voltage Limits (IEEE 80)',
    body:'Tolerable touch voltage: V_touch = (1000 + 1.5×Cs×ρs) × 0.116/√t for 70 kg person. Tolerable step voltage: V_step = (1000 + 6×Cs×ρs) × 0.116/√t. Where Cs is surface layer derating factor and ρs is surface material resistivity. These must exceed the calculated mesh voltage (maximum touch voltage) and step voltage from the grid analysis.' },
  { color:'#7C3AED', title:'Conductor Sizing — IEC 60364-5-54',
    body:'Earth conductor minimum size: A = I_f × √t / k. For copper k=226, galvanised steel k=80. The earth conductor must be ≥16 mm² Cu or equivalent (for protective bonding). For substation grids, the IEEE 80 thermal formula applies: A = I × √(t×ρr×10⁴/(TCAP × ln((Ko+Tm)/(Ko+Ta)))) where TCAP is thermal capacity, ρr is resistivity.' },
  { color:'#475569', title:'Soil Resistivity Measurement',
    body:'Soil resistivity is measured using the Wenner 4-electrode method (IEEE 81). Four electrodes are placed in a line at equal spacing \'a\'; resistivity ρ = 2πa×R (Ω·m). Measurements are repeated at different electrode spacings to obtain soil profile. Seasonal variation (moisture content) can change ρ by a factor of 2–10. Always use the worst-case (dry season, highest resistivity) for design.' },
];

export function EarthingCalc() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [soilResistivity, setSR]  = useState('100');
  const [gridLength,      setGL]  = useState('500');
  const [gridArea,        setGA]  = useState('1000');
  const [conductorSize,   setCS]  = useState('70');
  const [conductor,       setCond]= useState<'Cu'|'GI'>('Cu');
  const [faultCurrent,    setFC]  = useState('20000');
  const [faultDuration,   setFD]  = useState('0.5');
  const [earthPits,       setEP]  = useState('4');
  const [pitDepth,        setPD]  = useState('3');
  const [pitDiameter,     setPDiam]= useState('5');
  const [result,          setResult]= useState<CalculationResult | null>(null);
  const [learningMode,    setLM]  = useState(true);

  const calculate = () => {
    const res = calculateEarthing({ soilResistivity:parseFloat(soilResistivity), gridLength:parseFloat(gridLength), gridArea:parseFloat(gridArea), conductorSize:parseFloat(conductorSize), conductor, faultCurrent:parseFloat(faultCurrent), faultDuration:parseFloat(faultDuration), earthPits:parseInt(earthPits), pitDepth:parseFloat(pitDepth), pitDiameter:parseFloat(pitDiameter) });
    setResult(res);
    addCalculation({ type:'earthing', title:`Earthing — ρ=${soilResistivity}Ω·m, If=${parseInt(faultCurrent)/1000}kA`, inputs:{ soilResistivity, gridLength, gridArea, conductorSize, conductor, faultCurrent, faultDuration, earthPits, pitDepth }, results:res, notes:'', standard:'IEEE 80' });
  };

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'Earthing Calculator', inputs:{ 'Soil Resistivity':`${soilResistivity} Ω·m`, 'Grid Length':`${gridLength} m`, 'Grid Area':`${gridArea} m²`, 'Fault Current':`${parseInt(faultCurrent)/1000} kA` }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'earthing' });
  };
  const handleXLS = () => { if (result) exportToExcel('Earthing Calculator', { soilResistivity, gridLength, gridArea, faultCurrent }, result); };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={CloudLightning} title="EARTHING / GROUNDING CALCULATOR" subtitle="IEEE 80 · Earth grid resistance, touch voltage, step voltage and conductor sizing" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <QuickPills label="Typical Soil Resistivity Values" items={SOIL_TYPES} active={soilResistivity} onSelect={setSR} accentColor={ACCENT} />

          <SectionLabel title="Site Conditions" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Soil Resistivity (ρ)" value={soilResistivity} onChange={setSR} unit="Ω·m" min={1} tooltip="Measured soil resistivity — use Wenner 4-electrode method (IEEE 81)" />
            <TextInput label="Grid Area (A)" value={gridArea} onChange={setGA} unit="m²" min={1} tooltip="Area enclosed by the earth grid — larger area = lower resistance" />
          </FieldRow>
          <TextInput label="Total Grid Conductor Length (L)" value={gridLength} onChange={setGL} unit="m" min={1} tooltip="Total length of all buried earth conductors forming the grid" />

          <SectionLabel title="Earth Pits" />
          <FieldRow cols="1fr 1fr 1fr" cols-template="1fr 1fr 1fr">
            <TextInput label="Number of Pits" value={earthPits} onChange={setEP} min={1} max={100} step={1} />
            <TextInput label="Pit Depth" value={pitDepth} onChange={setPD} unit="m" min={0.5} max={20} step={0.5} />
            <TextInput label="Pit Diameter" value={pitDiameter} onChange={setPDiam} unit="cm" min={2} max={20} step={1} tooltip="Electrode diameter — typical: 5 cm for 50mm Cu rod" />
          </FieldRow>

          <SectionLabel title="Conductor & Fault Data" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Conductor Material" value={conductor} onChange={(v) => setCond(v as 'Cu'|'GI')} options={[{ value:'Cu', label:'Copper — k=226' },{ value:'GI', label:'Galv. Iron — k=80' }]} />
            <TextInput label="Conductor Size" value={conductorSize} onChange={setCS} unit="mm²" min={16} tooltip="Earth conductor cross-sectional area" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Earth Fault Current" value={faultCurrent} onChange={setFC} unit="A" min={100} tooltip="Maximum single-phase-to-earth fault current" />
            <TextInput label="Fault Duration" value={faultDuration} onChange={setFD} unit="s" min={0.01} max={5} step={0.05} tooltip="Protection device operating time — governs conductor thermal sizing" />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate Earthing System" icon={CloudLightning} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
