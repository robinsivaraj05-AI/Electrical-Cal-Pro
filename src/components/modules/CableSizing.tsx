import React, { useState } from 'react';
import { Cable } from 'lucide-react';
import { calculateCableSizing } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton, QuickPills,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';
import { STANDARD_SIZES_MM2 } from '../../data/cableData';

const ACCENT = '#7C3AED';

const INSTALL_METHODS = [
  { value: 'A', label: 'A — In conduit (wall/ceiling)' },
  { value: 'T', label: 'T — On cable tray' },
  { value: 'G', label: 'G — Direct buried' },
  { value: 'D', label: 'D — In duct (ground)' },
  { value: 'C', label: 'C — Clipped to surface' },
];

const WHY_ITEMS = [
  { title: 'Thermal Safety',       desc: 'Undersized cables overheat and risk insulation degradation or fire under sustained overload' },
  { title: 'Voltage Drop',         desc: 'Conductor resistance causes voltage drop — cable must be large enough to maintain voltage at load terminals' },
  { title: 'Short-circuit Withstand', desc: 'The selected cable must withstand the fault current × clearing time energy without damage' },
  { title: 'Protection Coordination', desc: 'Cable rating must exceed the overcurrent protection device rating for correct coordination' },
  { title: 'Derating Factors',     desc: 'Temperature, grouping and installation method reduce the base ampacity — all three must be applied' },
  { title: 'Future Growth',        desc: 'Future load factor reserves capacity for planned expansions without cable replacement' },
];

const NOTES = [
  { color:'#7C3AED', title:'Correction Factor Method (IEC 60364-5-52)',
    body:'The final cable ampacity is: I_z = I_t × C_temp × C_group × C_install where I_t is the tabulated base ampacity, C_temp is the temperature correction factor, C_group is the grouping derating factor and C_install accounts for installation method. The selected cable must satisfy I_z ≥ I_design (= 1.25 × I_load for continuous duty).' },
  { color:'#2563EB', title:'Conductor Material: Copper vs Aluminium',
    body:'Copper conductors carry approximately 1.3× more current than aluminium for the same cross-section. Aluminium cables require a larger conductor size but may be economically preferable for large feeders. Aluminium must not be used for socket outlet circuits or small wiring per IEC 60364-5-52.' },
  { color:'#059669', title:'XLPE vs PVC Insulation',
    body:'XLPE (90°C rated) cables carry approximately 15–20% more current than PVC (70°C rated) cables of the same size due to the higher maximum operating temperature. XLPE is preferred for industrial applications, motors and outdoor installations.' },
  { color:'#475569', title:'Installation Method Selection',
    body:'Method A (in conduit/wall) has the lowest ampacity due to restricted heat dissipation. Method T (on cable tray) allows better cooling. Method G (direct buried) benefits from soil heat sinking but requires derating for soil thermal resistivity. Always use the most conservative method applicable to the actual installation.' },
];

export function CableSizing() {
  const { addCalculation, settings, projects, activeProjectId } = useStore();
  const [current,        setCurrent]      = useState('100');
  const [futureFactor,   setFutureFactor] = useState('1.25');
  const [conductor,      setConductor]    = useState<'Cu' | 'Al'>('Cu');
  const [insulation,     setInsulation]   = useState<'PVC' | 'XLPE'>('XLPE');
  const [installMethod,  setInstallMethod]= useState<'A'|'T'|'G'|'D'|'C'>('T');
  const [ambientTemp,    setAmbientTemp]  = useState('40');
  const [numCables,      setNumCables]    = useState('3');
  const [groupMethod,    setGroupMethod]  = useState<'clipped'|'tray'|'duct'>('tray');
  const [result,         setResult]       = useState<CalculationResult | null>(null);
  const [learningMode,   setLearningMode] = useState(true);

  const calculate = () => {
    const res = calculateCableSizing({
      current: parseFloat(current), conductor, insulation, installMethod,
      ambientTemp: parseFloat(ambientTemp), numCables: parseInt(numCables),
      groupMethod, futureFactor: parseFloat(futureFactor),
    });
    setResult(res);
    addCalculation({
      type: 'cable-sizing',
      title: `Cable Sizing — ${current}A, ${conductor} ${insulation}, Method ${installMethod}`,
      inputs: { current, conductor, insulation, installMethod, ambientTemp, numCables, groupMethod, futureFactor },
      results: res, notes: '', standard: 'IEC 60364-5-52',
    });
  };

  const handlePDF = () => {
    if (!result) return;
    exportToPDF({ title:'Cable Sizing Calculator', inputs:{ 'Design Current':`${current} A`, Conductor:conductor, Insulation:insulation, 'Install Method':installMethod, 'Ambient Temp':`${ambientTemp}°C`, 'Cables in Group':numCables, 'Future Factor':futureFactor }, result, project:projects.find((p) => p.id === activeProjectId), settings, calcType:'cable-sizing' });
  };
  const handleXLS = () => {
    if (!result) return;
    exportToExcel('Cable Sizing Calculator', { 'Design Current':`${current} A`, Conductor:conductor, Insulation:insulation }, result);
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Cable} title="CABLE SIZING CALCULATOR" subtitle="IEC 60364-5-52 · Ampacity with temperature, grouping and installation method correction factors" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="Load Requirements" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Design Current (Iₙ)" value={current} onChange={setCurrent} unit="A" min={0.1} tooltip="Full load current of the circuit including demand factor" />
            <TextInput label="Future Load Factor" value={futureFactor} onChange={setFutureFactor} min={1} max={2} step={0.05} tooltip="Typically 1.25 — reserves 25% capacity for future expansion" />
          </FieldRow>

          <SectionLabel title="Cable Type" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Conductor" value={conductor} onChange={(v) => setConductor(v as 'Cu'|'Al')} options={[{ value:'Cu', label:'Copper (Cu)' },{ value:'Al', label:'Aluminium (Al)' }]} />
            <SelectInput label="Insulation" value={insulation} onChange={(v) => setInsulation(v as 'PVC'|'XLPE')} options={[{ value:'XLPE', label:'XLPE (90°C)' },{ value:'PVC', label:'PVC (70°C)' }]} />
          </FieldRow>

          <SectionLabel title="Installation Conditions" />
          <SelectInput label="Installation Method (IEC 60364-5-52 Table B.52.1)" value={installMethod} onChange={(v) => setInstallMethod(v as 'A'|'T'|'G'|'D'|'C')} options={INSTALL_METHODS} tooltip="Refer to IEC 60364-5-52 Table B.52.1 for detailed method descriptions" />
          <div style={{ height:12 }} />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Ambient Temperature" value={ambientTemp} onChange={setAmbientTemp} unit="°C" min={-20} max={80} step={5} tooltip="Ambient or soil temperature at the installation location" />
            <TextInput label="Cables in Group" value={numCables} onChange={setNumCables} min={1} max={20} step={1} tooltip="Total number of cables installed together in the same route" />
          </FieldRow>
          <SelectInput label="Grouping Method" value={groupMethod} onChange={(v) => setGroupMethod(v as 'clipped'|'tray'|'duct')} options={[{ value:'tray', label:'On tray / free air' },{ value:'clipped', label:'Clipped together' },{ value:'duct', label:'In duct / conduit' }]} />

          <CalcButton onClick={calculate} label="Calculate Cable Size" icon={Cable} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLearningMode} onExportPDF={handlePDF} onExportExcel={handleXLS} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
