import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, InputPanel, ResultPanel, StepByStep,
  WhyMatters, EngineeringNotes, CalcButton,
  TextInput, SelectInput, FieldRow, SectionLabel,
} from '../common/ModuleShared';

const ACCENT = '#0284C7';

function calcBusbar(inputs: {
  current:number; conductor:'Cu'|'Al'; sections:number; width:number; thickness:number;
  ambientTemp:number; maxTemp:number; faultCurrent:number; faultDuration:number; supportSpacing:number;
}): CalculationResult {
  const { current, conductor, sections, width, thickness, ambientTemp, maxTemp, faultCurrent, faultDuration, supportSpacing } = inputs;
  const area      = width * thickness * sections;
  const perimeter = 2 * (width + thickness) * sections;
  const deltaT    = maxTemp - ambientTemp;
  const k         = conductor === 'Cu' ? 0.48 : 0.40;
  const ampacity  = k * Math.sqrt(area / perimeter) * Math.pow(deltaT, 0.61) * sections;

  const kFactor   = conductor === 'Cu' ? 176 : 105;
  const Ith       = kFactor * area * Math.sqrt(1 / faultDuration) / 1000;

  const l         = supportSpacing / 100;
  const d         = 0.05;
  const forceN    = (2e-7 * faultCurrent ** 2 * l) / d;

  const utilization = (current / ampacity) * 100;
  const thermalOK   = Ith >= faultCurrent / 1000;
  const status      = utilization <= 100 && thermalOK ? 'PASS' : 'FAIL';

  return {
    values:[
      { label:'Configuration',        value:`${sections} × ${width}×${thickness} mm`, unit:conductor, highlight:true },
      { label:'Cross-Section',         value:area.toString(),                           unit:'mm²' },
      { label:'Current Rating',        value:ampacity.toFixed(0),                       unit:'A', highlight:true, status:utilization<=100?'PASS':'FAIL' },
      { label:'Utilization',           value:utilization.toFixed(1),                   unit:'%',  status:utilization<=80?'PASS':utilization<=100?'WARNING':'FAIL' },
      { label:'Thermal Withstand',     value:Ith.toFixed(1),                           unit:'kA', status:thermalOK?'PASS':'FAIL' },
      { label:'Electromagnetic Force', value:forceN.toFixed(0),                        unit:'N/m' },
    ],
    status,
    recommendation:`Busbar: ${sections} × ${width}×${thickness}mm ${conductor}, rating ${ampacity.toFixed(0)} A (${utilization.toFixed(1)}% utilized). Thermal withstand: ${Ith.toFixed(1)} kA for ${faultDuration}s. ${status==='PASS'?'Design is ADEQUATE.':'INCREASE section or reduce spacing.'}`,
    formula:'I = k × √(A/P) × ΔT^0.61',
    steps:[
      { step:1, description:'Cross-sectional area', formula:`A = w × t × n = ${width} × ${thickness} × ${sections}`, result:`${area} mm²` },
      { step:2, description:'Current rating (IEC 61439 simplified method)', formula:`I = ${k} × √(${area}/${perimeter.toFixed(0)}) × ${deltaT}^0.61`, result:`${ampacity.toFixed(0)} A` },
      { step:3, description:'Thermal short-circuit withstand (adiabatic)', formula:`I_th = k × A / √t = ${kFactor} × ${area} / √${faultDuration}`, result:`${Ith.toFixed(1)} kA (${thermalOK?'≥':'<'} ${(faultCurrent/1000).toFixed(1)} kA required)` },
      { step:4, description:'Electromagnetic force on support (IEC 62271)', formula:`F = 2×10⁻⁷ × I² × L / d = 2×10⁻⁷ × ${faultCurrent}² × ${l} / ${d}`, result:`${forceN.toFixed(0)} N` },
      { step:5, description:'Busbar utilization', formula:`${current} / ${ampacity.toFixed(0)} × 100`, result:`${utilization.toFixed(1)}% (${utilization<=100?'OK':'OVERLOADED'})` },
    ],
    standardRef:{ standard:'IEC 61439-1', clause:'10.10', title:'Low-voltage switchgear assemblies — Current rating and temperature rise' },
  };
}

const WHY_ITEMS = [
  { title:'Panel MCC Rating',     desc:'Busbar current rating determines the maximum total connected load in a motor control centre or distribution panel' },
  { title:'Fault Level',          desc:'Busbars must withstand the thermal and dynamic effects of the maximum prospective fault current' },
  { title:'Voltage Drop',         desc:'Busbar resistance and reactance contribute to voltage drop at the point of supply for each feeder circuit' },
  { title:'Support Spacing',      desc:'Electromagnetic forces during fault conditions require mechanical supports at intervals determined by the fault current' },
  { title:'Temperature Rise',     desc:'IEC 61439-1 limits the busbar temperature rise to 55°C for PVC-insulated connections and 70°C for bare copper' },
  { title:'Panel Classification', desc:'The busbar rating determines the form of separation (Form 1–4) and the panel assembly type classification' },
];

const NOTES = [
  { color:'#0284C7', title:'Current Rating Method — IEC 61439',
    body:'The simplified method uses: I = k × √(A/P) × ΔT^0.61 where k=0.48 for Cu, A is cross-section in mm², P is perimeter in mm and ΔT is the temperature rise. This is an approximation — for precise ratings, use the IEC 61439 type-test data from the switchboard manufacturer or perform thermal calculations with manufacturer software.' },
  { color:'#DC2626', title:'Thermal Short-Circuit Withstand',
    body:'During a fault, the busbar temperature rises rapidly (adiabatic heating). The withstand equation: A ≥ I_sc × √t / k. For copper k=176, aluminium k=105. If the required cross-section exceeds the actual busbar, the design fails thermally — increase cross-section, reduce fault current with impedance earthing, or reduce clearing time.' },
  { color:'#059669', title:'Electromagnetic Forces and Support Spacing',
    body:'Peak asymmetric fault currents create large repulsive forces between parallel conductors. The electromagnetic force: F = 2×10⁻⁷ × I_peak² × L/d (N). Support spacing is determined by the bending strength of the busbar material and the calculated force. Typical support spacing is 600–1200 mm for standard copper flat bars.' },
  { color:'#475569', title:'Conductor Material Selection',
    body:'Copper: higher conductivity (1.72 μΩ·cm), lower resistivity, smaller cross-section required — preferred for dense switchgear. Aluminium: lower conductivity (2.83 μΩ·cm) but lighter and less expensive — preferred for large busbars and busducts. All connections to aluminium busbars require bi-metallic washers or anti-oxidant compound to prevent galvanic corrosion.' },
];

export function BusbarCalc() {
  const { addCalculation } = useStore();
  const [current,        setCurrent]  = useState('1000');
  const [conductor,      setCond]     = useState<'Cu'|'Al'>('Cu');
  const [sections,       setSections] = useState('2');
  const [width,          setWidth]    = useState('100');
  const [thickness,      setThickness]= useState('10');
  const [ambientTemp,    setAmb]      = useState('40');
  const [maxTemp,        setMaxT]     = useState('90');
  const [faultCurrent,   setFC]       = useState('50000');
  const [faultDuration,  setFD]       = useState('1');
  const [supportSpacing, setSS]       = useState('120');
  const [result,         setResult]   = useState<CalculationResult | null>(null);
  const [learningMode,   setLM]       = useState(true);

  const calculate = () => {
    const res = calcBusbar({ current:parseFloat(current), conductor, sections:parseInt(sections), width:parseFloat(width), thickness:parseFloat(thickness), ambientTemp:parseFloat(ambientTemp), maxTemp:parseFloat(maxTemp), faultCurrent:parseFloat(faultCurrent), faultDuration:parseFloat(faultDuration), supportSpacing:parseFloat(supportSpacing) });
    setResult(res);
    addCalculation({ type:'busbar', title:`Busbar — ${sections}×${width}×${thickness}mm ${conductor}, ${current}A`, inputs:{ current, conductor, sections, width, thickness, ambientTemp, faultCurrent }, results:res, notes:'', standard:'IEC 61439-1' });
  };

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={BarChart3} title="BUSBAR CALCULATOR" subtitle="IEC 61439-1 · Current rating, thermal withstand and electromagnetic forces" accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
        <InputPanel>
          <SectionLabel title="Busbar Dimensions" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Conductor Material" value={conductor} onChange={(v) => setCond(v as 'Cu'|'Al')} options={[{ value:'Cu', label:'Copper (Cu)' },{ value:'Al', label:'Aluminium (Al)' }]} />
            <TextInput label="Sections per Phase" value={sections} onChange={setSections} min={1} max={6} step={1} tooltip="Number of parallel flat bars per phase" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Width (b)" value={width} onChange={setWidth} unit="mm" min={10} max={400} step={10} tooltip="Flat bar width" />
            <TextInput label="Thickness (d)" value={thickness} onChange={setThickness} unit="mm" min={3} max={50} step={1} tooltip="Flat bar thickness" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Design Current" value={current} onChange={setCurrent} unit="A" min={1} />
            <TextInput label="Support Spacing" value={supportSpacing} onChange={setSS} unit="cm" min={20} max={300} step={10} tooltip="Distance between insulated busbar supports" />
          </FieldRow>

          <SectionLabel title="Thermal & Fault Data" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Ambient Temperature" value={ambientTemp} onChange={setAmb} unit="°C" min={0} max={50} step={5} />
            <TextInput label="Max Conductor Temp" value={maxTemp} onChange={setMaxT} unit="°C" min={50} max={150} step={5} tooltip="65°C for PVC-covered, 90°C for bare Cu in free air" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="Fault Current" value={faultCurrent} onChange={setFC} unit="A" min={1000} tooltip="Maximum prospective short-circuit current" />
            <TextInput label="Fault Duration" value={faultDuration} onChange={setFD} unit="s" min={0.05} max={3} step={0.05} tooltip="Protection clearing time — typically 0.5–1 s for overcurrent protection" />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate Busbar" icon={BarChart3} accentColor={ACCENT} />
        </InputPanel>

        <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
