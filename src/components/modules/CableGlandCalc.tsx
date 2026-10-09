import React, { useState } from 'react';
import { Package, CheckCircle2, XCircle, Info } from 'lucide-react';
import { calculateCableGland } from '../../utils/glandCalculations';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  STANDARD_SIZES, CORE_OPTIONS, GLAND_TYPES, COMPRESSION_TYPES,
  type CoreOption, type CompressionType,
} from '../../data/cableGlandData';
import {
  ModHeader, InputPanel, ResultPanel, CalcButton,
  SelectInput, TextInput, FieldRow, SectionLabel,
  WhyMatters, EngineeringNotes, StepByStep,
} from '../common/ModuleShared';

const ACCENT = '#EA580C';

const QUICK_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

const COMP_CONFIG: Record<CompressionType, { accent: string; label: string }> = {
  'PVC / Plastic':      { accent: '#94A3B8', label: 'Light Duty'     },
  'Single Compression': { accent: '#3B82F6', label: 'Unarmoured'     },
  'Double Compression': { accent: '#EA580C', label: 'SWA / Armoured' },
};

// ── Compression type card ─────────────────────────────────────────────────────
function CompressionCard({ type, isSelected }: { type: CompressionType; isSelected?: boolean }) {
  const ct  = COMPRESSION_TYPES[type];
  const cfg = COMP_CONFIG[type];

  return (
    <div style={{
      borderRadius: 14, padding: 16, transition: 'all 200ms',
      border: `1.5px solid ${isSelected ? cfg.accent : 'var(--ec-border)'}`,
      background: isSelected ? `${cfg.accent}0D` : 'var(--ec-bg-surface)',
      boxShadow: isSelected ? `0 0 0 3px ${cfg.accent}20` : 'none',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.accent, flexShrink:0 }} />
          <span style={{ fontSize:12, fontWeight:700, color:cfg.accent, background:`${cfg.accent}18`, padding:'2px 10px', borderRadius:6 }}>{type}</span>
        </div>
        {isSelected && <span style={{ fontSize:11, color:'#22C55E', fontWeight:700 }}>← Selected</span>}
      </div>

      <p style={{ fontSize:12, color:'var(--ec-text-muted)', marginBottom:12, lineHeight:1.65 }}>{ct.description}</p>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--ec-text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Parts</div>
        {ct.parts.map((p) => (
          <div key={p} style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:12, color:'var(--ec-text-secondary)', marginBottom:3 }}>
            <span style={{ color:'var(--ec-border)', marginTop:1 }}>▸</span>{p}
          </div>
        ))}
      </div>

      <div style={{ padding:'8px 12px', borderRadius:8, background:'var(--ec-bg-surface)', border:'1px solid var(--ec-border)', marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--ec-text-muted)', marginBottom:4 }}>How it works</div>
        <p style={{ fontSize:12, color:'var(--ec-text-muted)', lineHeight:1.65, margin:0 }}>{ct.howItWorks}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
            <CheckCircle2 style={{ width:12, height:12, color:'#22C55E' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'#22C55E' }}>Use for</span>
          </div>
          {ct.suitable.slice(0, 3).map((s) => (
            <div key={s} style={{ fontSize:11, color:'var(--ec-text-muted)', marginBottom:3 }}>· {s}</div>
          ))}
        </div>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
            <XCircle style={{ width:12, height:12, color:'#EF4444' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'#EF4444' }}>Avoid for</span>
          </div>
          {ct.notSuitable.slice(0, 3).map((s) => (
            <div key={s} style={{ fontSize:11, color:'var(--ec-text-muted)', marginBottom:3 }}>· {s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Compression result banner ─────────────────────────────────────────────────
function CompressionResultBanner({ type, glandName }: { type: CompressionType; glandName: string }) {
  const ct  = COMPRESSION_TYPES[type];
  const cfg = COMP_CONFIG[type];

  return (
    <div style={{ borderRadius:14, border:`2px solid ${cfg.accent}60`, background:`${cfg.accent}0A`, padding:20, marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--ec-text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Compression Type</div>
          <div style={{ fontSize:24, fontWeight:800, color:cfg.accent, letterSpacing:'-0.01em' }}>{type}</div>
          <div style={{ fontSize:13, color:'var(--ec-text-muted)', marginTop:3 }}>{glandName}</div>
        </div>
        <span style={{ fontSize:12, fontWeight:800, padding:'5px 14px', borderRadius:8, background:cfg.accent, color:'#fff', flexShrink:0, marginTop:4 }}>
          {cfg.label}
        </span>
      </div>
      <p style={{ fontSize:12, color:'var(--ec-text-muted)', lineHeight:1.65, marginBottom:12 }}>{ct.description}</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {ct.parts.map((p) => (
          <span key={p} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, background:'var(--ec-bg-surface)', border:'1px solid var(--ec-border)', color:'var(--ec-text-secondary)' }}>{p}</span>
        ))}
      </div>
    </div>
  );
}

// ── Educational content ───────────────────────────────────────────────────────
const WHY_ITEMS = [
  { title: 'Armour Earth Continuity', desc: 'Double compression glands clamp the steel wire armour (SWA) — providing both mechanical cable retention AND a low-impedance earth path through the gland body. Single compression does NOT grip the armour.' },
  { title: 'IP Protection Rating',    desc: 'The gland IP rating must equal or exceed the enclosure IP. CW brass glands achieve IP66/68 when the sealing ring is correctly torqued against the cable outer sheath.' },
  { title: 'Thread Standard',         desc: 'BS EN 50262 metric threads (M16–M110) are standard. PG threads are legacy. Never force a metric gland into a PG hole — thread pitch and angle are different, leading to leakage and vibration loosening.' },
  { title: 'ATEX Hazardous Areas',    desc: 'Ex-rated glands (CWB Ex) must be IEC 60079-0 certified. They prevent flame transmission into the enclosure, provide IP66+, and maintain armour continuity as part of the zone 1/2 certification.' },
  { title: 'Marine / Offshore Grade', desc: '316L stainless steel glands are specified for marine, offshore, and corrosive chemical environments — resists chloride pitting and crevice corrosion that destroys standard brass within months.' },
  { title: 'Shroud Requirement',      desc: 'A PVC or neoprene shroud over the gland in outdoor/wet locations extends the IP zone to the thread engagement and prevents water tracking into the enclosure along the thread.' },
];

const NOTES = [
  { color: ACCENT, title: 'Cable OD Tolerance — Always Check the Datasheet',
    body: 'The gland entry range is sized on cable outer diameter (OD) — not conductor cross-section. The same 35 mm² XLPE/SWA cable from two manufacturers can differ by ±2–3 mm OD. A gland ordered purely on nominal cable size may have a sealing ring that cannot compress properly. Always obtain the manufacturer\'s actual OD before specifying gland thread size. The sealing ring must contact the outer sheath with ≥ 2 mm of annular contact for a reliable IP seal.' },
  { color: '#3B82F6', title: 'Earth Continuity — Single vs Double Compression',
    body: 'A single compression gland tightens ONLY the outer sealing ring — it applies no clamping force to the armour wires. The armour has no mechanical grip and no electrical contact at the gland. For SWA/AWA cables terminated with single compression glands, the armour must be bonded to earth separately via an earth tag or bonding conductor bridged across the gland. A double compression gland clamps the inner cone onto the armour, making the gland body a low-resistance armour earth conductor — the preferred method for fault current return paths.' },
  { color: '#8B5CF6', title: 'IP Rating — Gland + Shroud Combination',
    body: 'A correctly torqued CW brass gland achieves IP66 at the cable entry sealing ring. Adding a PVC shroud (Type A or B to BS 6121) extends IP protection to the thread engagement zone and provides UV resistance. For IP68 (submersible to 1 m/1 hr), a special deep-seal gland or factory-potted entry is required — a standard gland with shroud does NOT reliably achieve IP68. Specify IP rating explicitly in procurement documents; do not assume IP68 from a standard gland.' },
  { color: '#D97706', title: 'Torque Requirements — The Most Common Field Failure',
    body: 'Under-torqued glands are the single most common cause of gland failure: sealing ring does not compress, IP is lost, armour is not gripped, and the gland works loose under vibration. BS 6121 specifies torque by gland size — M20 body: 15–20 Nm, locknut: 10–15 Nm. M32 body: 30–40 Nm. Always use a calibrated torque wrench for hazardous, outdoor, and submersible installations. Mark torqued glands with a paint pen for inspection traceability.' },
];

// ── Main component ────────────────────────────────────────────────────────────
export function CableGlandCalc() {
  const { addCalculation } = useStore();

  const [conductorSize, setConductorSize] = useState('25');
  const [cores,         setCores]         = useState<CoreOption>('3C');
  const [conductorMat,  setConductorMat]  = useState<'Cu' | 'Al'>('Cu');
  const [insulation,    setInsulation]    = useState<'XLPE' | 'PVC' | 'EPR'>('XLPE');
  const [armouring,     setArmouring]     = useState<'SWA' | 'STA' | 'AWA' | 'Unarmoured'>('SWA');
  const [installation,  setInstallation]  = useState<'indoor' | 'outdoor' | 'hazardous'>('indoor');
  const [environment,   setEnvironment]   = useState<'standard' | 'marine' | 'corrosive'>('standard');
  const [specialApp,    setSpecialApp]    = useState<'standard' | 'screened' | 'marine' | 'hazardous'>('standard');
  const [manualOD,      setManualOD]      = useState('0');
  const [result,        setResult]        = useState<CalculationResult | null>(null);
  const [resultCompression, setResultCompression] = useState<CompressionType | null>(null);
  const [resultGlandName,   setResultGlandName]   = useState('');
  const [learningMode,      setLM]                = useState(true);

  function deriveCableType(): 'armoured' | 'unarmoured-brass' | 'unarmoured-pvc' | 'screened' | 'hazardous' | 'marine' {
    if (specialApp === 'screened')   return 'screened';
    if (specialApp === 'marine')     return 'marine';
    if (specialApp === 'hazardous' || installation === 'hazardous') return 'hazardous';
    if (armouring === 'Unarmoured')  return 'unarmoured-brass';
    return 'armoured';
  }

  const calculate = () => {
    const cableType = deriveCableType();
    const res = calculateCableGland({
      conductorSize: parseFloat(conductorSize), cores, conductorMat, insulation,
      armouring, installation, environment, cableType,
      manualOD: parseFloat(manualOD) || 0,
    });
    setResult(res);
    const compVal  = res.values.find((v) => v.label === 'Compression Type');
    const glandVal = res.values.find((v) => v.label === 'Gland Name');
    if (compVal)  setResultCompression(compVal.value as CompressionType);
    if (glandVal) setResultGlandName(glandVal.value);
    addCalculation({
      type: 'cable-gland',
      title: `Cable Gland — ${cores} ${conductorSize}mm² ${conductorMat}/${insulation}/${armouring}`,
      inputs: { conductorSize, cores, conductorMat, insulation, armouring, installation, environment, manualOD },
      results: res, notes: '', standard: 'BS 6121 / IEC 62444',
    });
  };

  const ALL_COMP: CompressionType[] = ['PVC / Plastic', 'Single Compression', 'Double Compression'];

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Package} title="CABLE GLAND & ACCESSORIES CALCULATOR"
        subtitle="BS 6121 Pt 1/4 · IEC 62444 · BS EN 50262 — Thread · Compression Type · Shroud · Earth Tag"
        accentColor={ACCENT} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.75fr', gap:24, marginBottom:28 }}>

        {/* ── LEFT: Inputs ─────────────────────────────────────────────── */}
        <InputPanel>
          {/* Quick size chips */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ec-text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
              Standard Cable Sizes (mm²) — click to select
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {QUICK_SIZES.map((s) => {
                const active = conductorSize === s.toString();
                return (
                  <button
                    key={s}
                    onClick={() => setConductorSize(s.toString())}
                    style={{
                      fontSize:11, padding:'4px 8px', borderRadius:6, cursor:'pointer', fontFamily:'inherit',
                      border:`1px solid ${active ? ACCENT : 'var(--ec-border)'}`,
                      background: active ? ACCENT : 'var(--ec-bg-surface)',
                      color: active ? '#fff' : 'var(--ec-text-muted)',
                      fontWeight: active ? 700 : 500, transition:'all 120ms',
                    }}
                  >{s}</button>
                );
              })}
            </div>
          </div>

          <SectionLabel title="Cable Specification" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Conductor Size" value={conductorSize} onChange={setConductorSize}
              options={STANDARD_SIZES.map((s) => ({ value: s.toString(), label: `${s} mm²` }))} />
            <SelectInput label="Number of Cores" value={cores}
              onChange={(v) => setCores(v as CoreOption)}
              options={CORE_OPTIONS.map((c) => ({ value: c, label: c }))} />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Conductor Material" value={conductorMat}
              onChange={(v) => setConductorMat(v as 'Cu' | 'Al')}
              options={[{ value:'Cu', label:'Cu — Copper' }, { value:'Al', label:'Al — Aluminium' }]} />
            <SelectInput label="Insulation Type" value={insulation}
              onChange={(v) => setInsulation(v as 'XLPE' | 'PVC' | 'EPR')}
              options={[
                { value:'XLPE', label:'XLPE (Cross-linked PE)' },
                { value:'PVC',  label:'PVC' },
                { value:'EPR',  label:'EPR (Ethylene Propylene)' },
              ]} />
          </FieldRow>
          <SelectInput label="Armouring Type" value={armouring}
            onChange={(v) => setArmouring(v as 'SWA' | 'STA' | 'AWA' | 'Unarmoured')}
            options={[
              { value:'SWA',        label:'SWA — Steel Wire Armoured' },
              { value:'STA',        label:'STA — Steel Tape Armoured' },
              { value:'AWA',        label:'AWA — Aluminium Wire Armoured' },
              { value:'Unarmoured', label:'Unarmoured (no armour)' },
            ]} />

          <SectionLabel title="Installation Conditions" />
          <SelectInput label="Installation Location" value={installation}
            onChange={(v) => setInstallation(v as 'indoor' | 'outdoor' | 'hazardous')}
            options={[
              { value:'indoor',    label:'Indoor (dry environment)' },
              { value:'outdoor',   label:'Outdoor / Weatherproof' },
              { value:'hazardous', label:'Hazardous Area (ATEX / IECEx)' },
            ]}
            tooltip="CW (indoor) / CWB (outdoor) / CWEX (Ex-rated)" />
          <FieldRow cols="1fr 1fr">
            <SelectInput label="Environment" value={environment}
              onChange={(v) => setEnvironment(v as 'standard' | 'marine' | 'corrosive')}
              options={[
                { value:'standard',  label:'Standard (NP Brass)' },
                { value:'marine',    label:'Marine / Offshore (316 SS)' },
                { value:'corrosive', label:'Corrosive (316 SS)' },
              ]} />
            <SelectInput label="Special Application" value={specialApp}
              onChange={(v) => setSpecialApp(v as 'standard' | 'screened' | 'marine' | 'hazardous')}
              options={[
                { value:'standard',  label:'Standard' },
                { value:'screened',  label:'Screened / EMC' },
                { value:'marine',    label:'Marine / Offshore' },
                { value:'hazardous', label:'Hazardous (ATEX)' },
              ]}
              tooltip="Overrides derived type for screened, marine, or ATEX cables" />
          </FieldRow>

          <SectionLabel title="OD Override (Optional)" />
          <TextInput label="Manual Cable OD" value={manualOD} onChange={setManualOD} unit="mm" min={0} step={0.5}
            tooltip="Set to 0 for automatic lookup from standard table. Enter actual OD from manufacturer datasheet if known." />

          <CalcButton onClick={calculate} label="Select Cable Gland & Accessories" icon={Package} accentColor={ACCENT} />
        </InputPanel>

        {/* ── RIGHT: Compression guide or Results ─────────────────────── */}
        <div>
          {result && resultCompression ? (
            <>
              <CompressionResultBanner type={resultCompression} glandName={resultGlandName} />
              <ResultPanel result={result} learningMode={learningMode} setLearningMode={setLM} accentColor={ACCENT} />
            </>
          ) : (
            /* Pre-calculate: compression type guide */
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 2px' }}>
                <Info style={{ width:16, height:16, color:'var(--ec-text-muted)' }} />
                <span style={{ fontSize:14, fontWeight:700, color:'var(--ec-text-secondary)' }}>Compression Type Guide</span>
                <span style={{ fontSize:12, color:'var(--ec-text-muted)' }}>— fill in cable details above and click Calculate</span>
              </div>

              {ALL_COMP.map((ct) => <CompressionCard key={ct} type={ct} />)}

              {/* Gland code reference table */}
              <div style={{ borderRadius:14, border:'1px solid var(--ec-border)', overflow:'hidden', background:'var(--ec-bg-card)', boxShadow:'var(--ec-shadow-card)' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--ec-border)', background:'var(--ec-bg-surface)' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--ec-text-secondary)' }}>Gland Code Reference — BS 6121 / IEC 62444</div>
                </div>
                <div>
                  {Object.values(GLAND_TYPES).map((g, i, arr) => {
                    const compAccent: Record<CompressionType, string> = {
                      'PVC / Plastic':      'var(--ec-text-muted)',
                      'Single Compression': '#3B82F6',
                      'Double Compression': ACCENT,
                    };
                    return (
                      <div key={g.code} style={{
                        padding:'10px 16px',
                        borderBottom: i < arr.length - 1 ? '1px solid var(--ec-border-muted)' : 'none',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:12, fontWeight:800, color:ACCENT, fontFamily:'JetBrains Mono,monospace', background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, padding:'2px 8px', borderRadius:6 }}>
                              {g.code}
                            </span>
                            <span style={{ fontSize:12, fontWeight:600, color:compAccent[g.compression] }}>{g.compression}</span>
                          </div>
                          <span style={{ fontSize:12, color:'#3B82F6', fontFamily:'JetBrains Mono,monospace' }}>{g.ipRating}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--ec-text-muted)', marginTop:3 }}>{g.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* After calculation: show all compression types for comparison */}
          {result && resultCompression && (
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--ec-text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
                All Compression Types — for reference
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {ALL_COMP.map((ct) => <CompressionCard key={ct} type={ct} isSelected={ct === resultCompression} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {result && learningMode && <StepByStep steps={result.steps ?? []} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
