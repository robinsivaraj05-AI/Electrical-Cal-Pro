import React, { useState } from 'react';
import { FileText, Download, Eye, CheckCircle2, Clock, Zap, Cable, Activity, Shield, BarChart3, CloudLightning, Lightbulb, Cpu, Battery, Package, Grid3x3, TrendingDown, AlertTriangle, FileCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToPDF } from '../utils/pdfExport';

const V = {
  bg:   'var(--ec-bg-card)',
  bgD:  'var(--ec-bg-root)',
  surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)',
  brdB: 'var(--ec-border)',
  brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)',
  sec:  'var(--ec-text-secondary)',
  muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)',
  mono: "'JetBrains Mono',monospace",
};

interface Template {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  sections: string[];
  calcType?: string;
}

const TEMPLATES: Template[] = [
  {
    id:'cable-current', calcType:'cable-current',
    title:'Cable Current Report', color:'#2563EB',
    icon: Zap,
    desc:'Full load current calculation with derating factors, installation method and standard compliance.',
    sections:['Project header','System details','FLC formula & result','Derating factors table','Cable selection','Standard reference','Engineer sign-off'],
  },
  {
    id:'cable-sizing', calcType:'cable-sizing',
    title:'Cable Sizing Report', color:'#16A34A',
    icon: Cable,
    desc:'IEC 60364-5-52 cable sizing with correction factors, voltage drop check and short-circuit thermal rating.',
    sections:['Project header','Load data','Correction factors','Selected cable size','Voltage drop check','Fault rating check','Recommendations'],
  },
  {
    id:'voltage-drop', calcType:'voltage-drop',
    title:'Voltage Drop Report', color:'#D97706',
    icon: TrendingDown,
    desc:'Full impedance method voltage drop calculation with R·cosφ + X·sinφ analysis and limit check.',
    sections:['Circuit data','Cable impedance','Full impedance formula','ΔV result and %','IEC limit comparison','Pass/Fail verdict'],
  },
  {
    id:'short-circuit', calcType:'short-circuit',
    title:'Short Circuit Report', color:'#DC2626',
    icon: AlertTriangle,
    desc:'IEC 60909 symmetrical and asymmetrical fault current at each system point with peak factor.',
    sections:['System one-line data','Source impedance','Transformer impedance','Cable impedance','I″k and ip results','Equipment rating check'],
  },
  {
    id:'load-schedule', calcType:'load-schedule',
    title:'Load Schedule Report', color:'#0D9488',
    icon: FileText,
    desc:'Comprehensive load schedule with diversity factors, maximum demand and recommended transformer/generator sizing.',
    sections:['Project header','Load schedule table','Diversity factors','Maximum demand kW & kVA','System power factor','Transformer sizing recommendation'],
  },
  {
    id:'transformer', calcType:'transformer',
    title:'Transformer Report', color:'#7C3AED',
    icon: Activity,
    desc:'Transformer sizing, rated current, impedance voltage, losses and fault level contribution.',
    sections:['Rating & cooling class','HV/LV currents','Impedance & losses','Efficiency curve','Fault level at LV terminals','Protection recommendation'],
  },
  {
    id:'earthing', calcType:'earthing',
    title:'Earthing System Report', color:'#16A34A',
    icon: CloudLightning,
    desc:'IEEE 80 earthing grid design with GPR, touch voltage, step voltage and safety compliance.',
    sections:['Soil resistivity data','Grid geometry','GPR calculation','Mesh & step voltages','Safety comparison','Electrode sizing'],
  },
  {
    id:'lighting', calcType:'lighting',
    title:'Lighting Design Report', color:'#F59E0B',
    icon: Lightbulb,
    desc:'Room illumination calculation using lumen method with utilisation factor and maintained illuminance.',
    sections:['Room dimensions & reflectances','Luminaire selection','Lumen method calculation','Achieved lux vs EN 12464-1','Power density (LPD) check','Luminaire layout'],
  },
  {
    id:'pump-motor', calcType:'pump-motor',
    title:'Pump & Motor Report', color:'#0891B2',
    icon: Cpu,
    desc:'Motor sizing, pump hydraulic calculations, cable sizing, OLR and starter selection for pump applications.',
    sections:['Pump hydraulic data','Motor sizing','FLC & cable selection','OLR setting','Starter type & rating','BOM summary'],
  },
  {
    id:'ups', calcType:'ups',
    title:'UPS System Report', color:'#059669',
    icon: Battery,
    desc:'UPS capacity sizing, battery bank design, autonomy time and recharge analysis.',
    sections:['Critical load list','Required kVA','Battery bank design','Autonomy calculation','UPS module selection','Maintenance intervals'],
  },
  {
    id:'cable-gland', calcType:'cable-gland',
    title:'Cable Gland Report', color:'#EA580C',
    icon: Package,
    desc:'Cable gland selection with IP rating, material type, armour type and hazardous area suitability.',
    sections:['Cable details','Environment & IP requirement','Selected gland size & type','Ex/HazLoc classification','Installation notes'],
  },
  {
    id:'conduit-tray', calcType:'conduit-tray',
    title:'Conduit & Tray Report', color:'#0E7490',
    icon: Grid3x3,
    desc:'Conduit fill calculation per NEC 300.17 / IEC 61386 and cable tray sizing per IEC 61537.',
    sections:['Cable schedule','Conduit type & size','Fill area & % vs limit','Pass/Fail verdict','Tray width recommendation','Standard reference'],
  },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  PASS:    { bg:'rgba(34,197,94,.12)',  color:'#16A34A', border:'rgba(34,197,94,.35)'  },
  FAIL:    { bg:'rgba(239,68,68,.12)',  color:'#DC2626', border:'rgba(239,68,68,.35)'  },
  WARNING: { bg:'rgba(245,158,11,.12)', color:'#D97706', border:'rgba(245,158,11,.35)' },
  INFO:    { bg:'rgba(37,99,235,.12)',  color:'#2563EB', border:'rgba(37,99,235,.35)'  },
};

export function ReportTemplates() {
  const { calculationHistory, settings } = useStore();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());

  const handleExport = (calcId: string, calc: typeof calculationHistory[0]) => {
    exportToPDF({
      title: calc.title,
      inputs: calc.inputs,
      result: calc.results,
      settings,
      calcType: calc.type,
    });
    setExported((p) => new Set([...p, calcId]));
  };

  const templateCalcs = (tpl: Template) =>
    calculationHistory.filter(c => c.type === tpl.calcType);

  return (
    <div className="animate-fadeIn" style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FileCheck style={{ width:24, height:24, color:'#059669' }} />
        </div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:V.txt, margin:0, letterSpacing:'-0.02em' }}>Report Templates</h1>
          <p style={{ fontSize:13, color:V.muted, margin:'3px 0 0' }}>Export professional PDF calculation reports — click a template to view saved calculations</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { label:'Templates Available', value: TEMPLATES.length,              color:'#2563EB', icon: FileText },
          { label:'Saved Calculations',  value: calculationHistory.length,     color:'#16A34A', icon: CheckCircle2 },
          { label:'Reports Generated',   value: exported.size,                 color:'#7C3AED', icon: Download },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, boxShadow:'var(--ec-shadow-card)' }}>
            <div style={{ width:42, height:42, borderRadius:10, background:`${color}14`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon style={{ width:20, height:20, color }} />
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-0.02em' }}>{value}</div>
              <div style={{ fontSize:12, color:V.muted, marginTop:2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Template grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const calcs = templateCalcs(tpl);
          const isOpen = activeTemplate === tpl.id;
          return (
            <div key={tpl.id} style={{ background:V.bg, border:`1px solid ${isOpen ? tpl.color+'60' : V.brd}`, borderRadius:16, overflow:'hidden', boxShadow: isOpen ? `0 0 0 2px ${tpl.color}20, var(--ec-shadow-card)` : 'var(--ec-shadow-card)', transition:'all 200ms' }}>
              {/* Card header */}
              <div style={{ padding:'18px 20px', borderBottom:`1px solid ${V.brdM}`, display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`${tpl.color}15`, border:`1px solid ${tpl.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon style={{ width:20, height:20, color:tpl.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:V.txt }}>{tpl.title}</div>
                  <div style={{ fontSize:12, color:V.muted, marginTop:4, lineHeight:1.5 }}>{tpl.desc}</div>
                </div>
              </div>

              {/* Sections list */}
              <div style={{ padding:'12px 20px', borderBottom:`1px solid ${V.brdM}`, background:V.surf }}>
                <div style={{ fontSize:11, fontWeight:700, color:V.lbl, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Report Sections</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {tpl.sections.map((s) => (
                    <span key={s} style={{ fontSize:10, padding:'2px 8px', borderRadius:6, background:`${tpl.color}12`, border:`1px solid ${tpl.color}25`, color:tpl.color, fontWeight:600 }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Action row */}
              <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, color:V.muted }}>
                  {calcs.length > 0
                    ? <span style={{ color:'#16A34A', fontWeight:700 }}>✓ {calcs.length} saved calculation{calcs.length > 1 ? 's' : ''}</span>
                    : <span>No saved calculations yet</span>}
                </div>
                <button onClick={() => setActiveTemplate(isOpen ? null : tpl.id)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1px solid ${tpl.color}40`, background:`${tpl.color}12`, color:tpl.color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <Eye style={{ width:13, height:13 }} /> {isOpen ? 'Collapse' : 'View'}
                </button>
              </div>

              {/* Expanded saved calcs */}
              {isOpen && (
                <div style={{ borderTop:`1px solid ${V.brdM}`, background:V.bgD }}>
                  {calcs.length === 0 ? (
                    <div style={{ padding:'24px 20px', textAlign:'center', color:V.muted, fontSize:13 }}>
                      No saved calculations for this type yet.<br />
                      <span style={{ fontSize:12 }}>Run a calculation and it will appear here.</span>
                    </div>
                  ) : (
                    calcs.map((calc) => {
                      const st = STATUS_STYLE[calc.results.status] ?? STATUS_STYLE['INFO'];
                      const done = exported.has(calc.id);
                      return (
                        <div key={calc.id} style={{ padding:'12px 20px', borderBottom:`1px solid ${V.brdM}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:V.txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{calc.title}</div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                              <Clock style={{ width:11, height:11, color:V.muted }} />
                              <span style={{ fontSize:11, color:V.muted }}>{new Date(calc.timestamp).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                              <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:800, background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>{calc.results.status}</span>
                            </div>
                          </div>
                          <button onClick={() => handleExport(calc.id, calc)}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:`1px solid ${done ? 'rgba(34,197,94,.35)' : tpl.color+'50'}`, background: done ? 'rgba(34,197,94,.10)' : `${tpl.color}12`, color: done ? '#16A34A' : tpl.color, fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit', transition:'all 150ms' }}>
                            {done ? <CheckCircle2 style={{ width:13, height:13 }} /> : <Download style={{ width:13, height:13 }} />}
                            {done ? 'Exported' : 'Export PDF'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', gap:12, boxShadow:'var(--ec-shadow-card)' }}>
        <FileCheck style={{ width:18, height:18, color:'#059669', flexShrink:0 }} />
        <p style={{ fontSize:12, color:V.muted, margin:0, lineHeight:1.6 }}>
          Reports are generated as formatted PDFs using your project details from <strong style={{ color:V.sec }}>Settings → Project Info</strong>. Each report includes input data, calculation steps, standard references, and a Pass/Fail verdict ready for submission to engineering review.
        </p>
      </div>
    </div>
  );
}
