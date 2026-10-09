import React, { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { calculateLoadSchedule, type LoadItem } from '../../utils/calculations';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';
import {
  ModHeader, StepByStep, WhyMatters, EngineeringNotes, KpiCard, QuickPills,
} from '../common/ModuleShared';

const ACCENT = '#0D9488';

const DEFAULT_LOADS: LoadItem[] = [
  { name: 'Lighting Panel',   kw: 15,  quantity: 1, diversityFactor: 0.80, powerFactor: 0.95 },
  { name: 'HVAC — Chiller',   kw: 110, quantity: 2, diversityFactor: 0.85, powerFactor: 0.88 },
  { name: 'Lift / Elevator',  kw: 22,  quantity: 3, diversityFactor: 0.60, powerFactor: 0.85 },
  { name: 'General Power',    kw: 50,  quantity: 1, diversityFactor: 0.70, powerFactor: 0.90 },
  { name: 'Fire Pump',        kw: 30,  quantity: 1, diversityFactor: 1.00, powerFactor: 0.88 },
];

const WHY_ITEMS = [
  { title:'Transformer Sizing',   desc:'Maximum demand determines the minimum transformer rating — adding 25% margin for future growth' },
  { title:'Main Incomer Rating',  desc:'Incoming cable and circuit breaker must be rated for the maximum demand current at the specified voltage' },
  { title:'Generator Sizing',     desc:'Standby generator rating is based on maximum demand plus motor starting kVA requirements' },
  { title:'Busbar Design',        desc:'Main LV busbar must be rated for the maximum demand current including harmonic content' },
  { title:'Power Bill Reduction', desc:'Identifying high-demand loads enables load management strategies to reduce peak demand charges' },
  { title:'Diversity Analysis',   desc:'Diversity factors reflect that not all loads operate simultaneously — without diversity, equipment would be severely over-specified' },
];

const NOTES = [
  { color:'#0D9488', title:'Diversity Factor vs Demand Factor',
    body:'Diversity Factor (DF) applies to each load: it represents the fraction of the time the load is operating at its rated value. Maximum Demand = Σ(kW × Qty × DF). The Demand Factor applies to the whole system: MD = Connected Load × Demand Factor. Both approaches give the same result when applied correctly. Use actual measured data or IEC 60364-5-55 Annex A typical values.' },
  { color:'#7C3AED', title:'Power Factor and kVA Demand',
    body:'Apparent power (kVA) demand = Active power demand (kW) / Overall system power factor. The system power factor is the weighted average of all load power factors. kVA determines transformer and generator sizing, cable and switchgear rating. A low system power factor (< 0.85) significantly increases kVA demand — capacitor correction reduces both kVA demand and utility charges.' },
  { color:'#059669', title:'Standard Load Classifications',
    body:'IEC 60364-5-55 and AS/NZS 3000 provide typical demand factors: General power (lighting, small power): DF=0.6–0.8. HVAC (chiller, AHU): DF=0.7–0.9. Lifts: DF=0.5–0.7 (not all lifts run simultaneously). Essential loads (fire pump, UPS): DF=1.0 (must always be available at full rating). Welding loads: DF=0.3–0.5 (highly intermittent).' },
  { color:'#475569', title:'Future Load Allowance',
    body:'IEC 60364-5-55 recommends provision for future load growth. Transformer: typically sized at 80% of rated kVA for the initial maximum demand, leaving 20% for growth. Busbar and cable: sized with a 1.25 factor on calculated maximum demand. In data centre design, ASHRAE A1/A2 standards recommend 100% future growth margin on power infrastructure.' },
];

export function LoadSchedule() {
  const { addCalculation } = useStore();
  const [loads,         setLoads]   = useState<LoadItem[]>(DEFAULT_LOADS);
  const [systemVoltage, setVoltage] = useState('415');
  const [phases,        setPhases]  = useState<'1'|'3'>('3');
  const [result,        setResult]  = useState<CalculationResult | null>(null);

  const updateLoad = (index: number, field: keyof LoadItem, value: string) => {
    setLoads((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'name' ? value : parseFloat(value) || 0 };
      return next;
    });
  };

  const addLoad = () => {
    setLoads((prev) => [...prev, { name:`Load ${prev.length+1}`, kw:10, quantity:1, diversityFactor:0.8, powerFactor:0.85 }]);
  };

  const removeLoad = (index: number) => {
    setLoads((prev) => prev.filter((_, i) => i !== index));
  };

  const calculate = () => {
    const res = calculateLoadSchedule(loads, parseFloat(systemVoltage), parseInt(phases) as 1|3);
    setResult(res);
    addCalculation({ type:'load-schedule', title:`Load Schedule — ${loads.length} loads, ${systemVoltage}V`, inputs:{ systemVoltage, phases, loads:loads.length.toString() }, results:res, notes:'', standard:'IEC 60364-5-55' });
  };

  const totalConnected = loads.reduce((s, l) => s + l.kw * l.quantity, 0);
  const totalDemand    = loads.reduce((s, l) => s + l.kw * l.quantity * l.diversityFactor, 0);

  const voltageItems = ['240','415','440','480','690','1000','3300','6600','11000'].map((v) => ({
    value:v, label:parseInt(v)>=1000?`${parseInt(v)/1000}kV`:`${v}V`,
  }));

  // input cell style (avoids forms.css width:100% override problem)
  const cellInput = (extraStyle: React.CSSProperties = {}) => ({
    background:'var(--ec-bg-input)', border:'1px solid var(--ec-border)', borderRadius:6,
    color:'var(--ec-text-primary)', fontSize:13, fontWeight:600, padding:'4px 8px',
    fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const,
    ...extraStyle,
  });

  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={FileText} title="LOAD SCHEDULE CALCULATOR" subtitle="IEC 60364-5-55 · Maximum demand, diversity factor, system power factor and current" accentColor={ACCENT} />

      {/* ── Header Controls ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--ec-text-label)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>System Voltage</div>
          <select value={systemVoltage} onChange={(e) => setVoltage(e.target.value)}
            style={{ ...cellInput(), width:'100%', height:44, paddingLeft:12 }}>
            {voltageItems.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--ec-text-label)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Phase System</div>
          <select value={phases} onChange={(e) => setPhases(e.target.value as '1'|'3')}
            style={{ ...cellInput(), width:'100%', height:44, paddingLeft:12 }}>
            <option value="3">3-Phase AC</option>
            <option value="1">1-Phase AC</option>
          </select>
        </div>
        <div style={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border-card)', borderRadius:12, padding:'10px 16px' }}>
          <div style={{ fontSize:11, color:'var(--ec-text-muted)', fontWeight:700 }}>Total Loads</div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--ec-text-primary)', marginTop:2 }}>{loads.length}</div>
        </div>
        <div style={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border-card)', borderRadius:12, padding:'10px 16px' }}>
          <div style={{ fontSize:11, color:'var(--ec-text-muted)', fontWeight:700 }}>Connected kW</div>
          <div style={{ fontSize:22, fontWeight:800, color:`${ACCENT}`, marginTop:2 }}>{totalConnected.toFixed(0)} kW</div>
        </div>
      </div>

      {/* ── Load Table ──────────────────────────────────────── */}
      <div style={{ background:'var(--ec-bg-card)', border:'1px solid var(--ec-border-card)', borderRadius:16, marginBottom:20, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'var(--ec-bg-surface)', borderBottom:'1px solid var(--ec-border-muted)' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--ec-text-secondary)' }}>Load Schedule</div>
          <button onClick={addLoad} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:`${ACCENT}20`, color:ACCENT, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus style={{ width:13, height:13 }} /> Add Load
          </button>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--ec-bg-surface)' }}>
                {['Load Description','kW/unit','Qty','Diversity','PF (cos φ)','Connected kW','Demand kW',''].map((h) => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:h==='Load Description'?'left':'center', fontSize:11, fontWeight:700, color:'var(--ec-text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--ec-border-muted)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loads.map((load, i) => {
                const connected = load.kw * load.quantity;
                const demand    = connected * load.diversityFactor;
                return (
                  <tr key={i} style={{ borderBottom:'1px solid var(--ec-border-muted)' }}>
                    <td style={{ padding:'8px 12px' }}>
                      <input type="text" value={load.name} onChange={(e) => updateLoad(i,'name',e.target.value)}
                        style={{ ...cellInput(), width:180 }} />
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <input type="number" value={load.kw} onChange={(e) => updateLoad(i,'kw',e.target.value)} min={0} step={0.1}
                        style={{ ...cellInput({ width:72, textAlign:'center' }) }} />
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <input type="number" value={load.quantity} onChange={(e) => updateLoad(i,'quantity',e.target.value)} min={1}
                        style={{ ...cellInput({ width:56, textAlign:'center' }) }} />
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <input type="number" value={load.diversityFactor} onChange={(e) => updateLoad(i,'diversityFactor',e.target.value)} min={0.1} max={1} step={0.05}
                        style={{ ...cellInput({ width:72, textAlign:'center' }) }} />
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <input type="number" value={load.powerFactor} onChange={(e) => updateLoad(i,'powerFactor',e.target.value)} min={0.1} max={1} step={0.01}
                        style={{ ...cellInput({ width:72, textAlign:'center' }) }} />
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center', fontSize:13, fontWeight:600, color:'var(--ec-text-muted)', fontFamily:"'JetBrains Mono',monospace" }}>
                      {connected.toFixed(1)}
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center', fontSize:13, fontWeight:800, color:ACCENT, fontFamily:"'JetBrains Mono',monospace" }}>
                      {demand.toFixed(1)}
                    </td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <button onClick={() => removeLoad(i)} style={{ padding:4, background:'transparent', border:'none', cursor:'pointer', color:'#475569', borderRadius:4 }}
                        onMouseEnter={(e) => e.currentTarget.style.color='#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color='#475569'}>
                        <Trash2 style={{ width:14, height:14 }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'var(--ec-bg-surface)', borderTop:'1px solid var(--ec-border-muted)' }}>
                <td style={{ padding:'10px 12px', fontSize:13, fontWeight:800, color:'var(--ec-text-secondary)' }} colSpan={5}>Total</td>
                <td style={{ padding:'10px 12px', textAlign:'center', fontSize:13, fontWeight:800, color:'var(--ec-text-muted)', fontFamily:"'JetBrains Mono',monospace" }}>{totalConnected.toFixed(1)}</td>
                <td style={{ padding:'10px 12px', textAlign:'center', fontSize:13, fontWeight:800, color:ACCENT, fontFamily:"'JetBrains Mono',monospace" }}>{totalDemand.toFixed(1)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Calculate button ─────────────────────────────────── */}
      <button onClick={calculate} style={{
        width:'100%', height:54, borderRadius:12, border:'none', cursor:'pointer',
        background:`linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT}CC 100%)`,
        color:'#fff', fontSize:16, fontWeight:800,
        boxShadow:`0 8px 24px ${ACCENT}40`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:24,
        fontFamily:'inherit',
      }}>
        <FileText style={{ width:20, height:20 }} /> Calculate Maximum Demand
      </button>

      {/* ── Result KPI cards ──────────────────────────────────── */}
      {result && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {result.values.map((v) => (
              <KpiCard key={v.label} label={v.label} value={v.value} unit={v.unit} highlight={v.highlight} status={v.status} accentColor={ACCENT} />
            ))}
          </div>

          {/* Recommendation box */}
          <div style={{ background:`${ACCENT}0A`, border:`1px solid ${ACCENT}25`, borderRadius:14, padding:'16px 20px', marginBottom:24 }}>
            <div style={{ fontSize:11, color:'var(--ec-text-label)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Assessment & Recommendation</div>
            <p style={{ fontSize:13, color:'var(--ec-text-muted)', lineHeight:1.7 }}>{result.recommendation}</p>
          </div>

          <StepByStep steps={result.steps ?? []} />
        </>
      )}

      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
