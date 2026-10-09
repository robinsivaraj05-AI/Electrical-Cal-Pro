import React, { useState, useMemo } from 'react';
import { Database, Search, BookOpen, Zap, Activity, Shield, Cpu, CloudLightning, Lightbulb, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';

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

interface Formula {
  name: string;
  eq: string;
  vars: string;
  standard: string;
  tag: string;
}

const FORMULAS: Formula[] = [
  // Cable & Current
  { tag:'cable', name:'Full Load Current (3-phase)',     eq:'I = P / (√3 × V × cosφ)',          vars:'P = kW, V = line voltage (V), cosφ = power factor',                              standard:'IEC 60364-5-52' },
  { tag:'cable', name:'Full Load Current (1-phase)',     eq:'I = P / (V × cosφ)',                vars:'P = watts, V = voltage (V)',                                                      standard:'IEC 60364-5-52' },
  { tag:'cable', name:'Corrected Cable Ampacity',        eq:'Iᶻ = Iₜ × Ca × Cg × Ci × Cc',     vars:'Iₜ = tabulated, Ca = ambient, Cg = grouping, Ci = insulation, Cc = conduit',      standard:'IEC 60364-5-52' },
  { tag:'cable', name:'Current Density',                 eq:'J = I / A',                         vars:'I = current (A), A = conductor area (mm²)',                                      standard:'IEC 60287' },
  { tag:'cable', name:'Resistance (DC)',                 eq:'R = ρ × L / A',                     vars:'ρ = resistivity (Ω·mm²/m), L = length (m), A = area (mm²)',                    standard:'IEC 60228' },
  { tag:'cable', name:'Resistance (AC, temp corrected)', eq:'Rθ = R₂₀ × [1 + α(θ − 20)]',      vars:'R₂₀ = DC resistance at 20°C, α = temperature coefficient',                       standard:'IEC 60287' },
  { tag:'cable', name:'Cable Thermal Rating (adiabatic)',eq:'I²t = k²S²',                       vars:'k = material factor (Cu=143, Al=94), S = cross-section (mm²), t = time (s)',     standard:'IEC 60364-5-54' },

  // Voltage Drop
  { tag:'drop', name:'Voltage Drop (3-phase)',           eq:'ΔV = √3 × I × L × (R cosφ + X sinφ)', vars:'I = current (A), L = length (km), R = resistance (Ω/km), X = reactance (Ω/km)', standard:'IEC 60364-5-52' },
  { tag:'drop', name:'Voltage Drop (1-phase)',           eq:'ΔV = 2 × I × L × (R cosφ + X sinφ)', vars:'Factor 2 for go-and-return single-phase',                                       standard:'IEC 60364-5-52' },
  { tag:'drop', name:'Voltage Drop % (3-phase)',         eq:'%ΔV = (ΔV / Vₙ) × 100',            vars:'Vₙ = nominal line voltage',                                                       standard:'IEC 60364-5-52' },
  { tag:'drop', name:'Simplified VD (resistive)',        eq:'ΔV ≈ I × R × L × 2 / 1000',        vars:'R in mΩ/m — valid when cosφ ≈ 1',                                                standard:'IEC 60364-5-52' },

  // Power & Load
  { tag:'power', name:'Active Power (3-phase)',          eq:'P = √3 × V × I × cosφ',             vars:'V = line voltage (V), I = line current (A)',                                     standard:'IEC 60038' },
  { tag:'power', name:'Apparent Power (3-phase)',        eq:'S = √3 × V × I',                    vars:'S in VA or kVA',                                                                 standard:'IEC 60038' },
  { tag:'power', name:'Reactive Power',                  eq:'Q = √3 × V × I × sinφ',             vars:'Q in VAR or kVAR',                                                               standard:'IEC 60038' },
  { tag:'power', name:'Power Triangle',                  eq:'S² = P² + Q²',                      vars:'S = √(P² + Q²)',                                                                 standard:'IEC 60038' },
  { tag:'power', name:'Power Factor',                    eq:'cosφ = P / S',                      vars:'P = active (kW), S = apparent (kVA)',                                            standard:'IEC 60038' },
  { tag:'power', name:'Maximum Demand',                  eq:'MD = Σ(Pᵢ × Qᵢ × DFᵢ)',            vars:'Pᵢ = unit kW, Qᵢ = quantity, DFᵢ = diversity factor',                           standard:'IEC 60364-5-55' },
  { tag:'power', name:'Transformer kVA',                 eq:'kVA = kW / pf × margin',            vars:'Typical margin = 1.25 for future growth',                                        standard:'IEC 60364-5-55' },
  { tag:'power', name:'Capacitor Reactive Power',        eq:'Qc = P × (tanφ₁ − tanφ₂)',         vars:'φ₁ = original angle, φ₂ = target angle',                                        standard:'IEC 60831' },

  // Short Circuit
  { tag:'fault', name:'Symmetrical Fault Current',       eq:'Isc = V / (√3 × Ztotal)',           vars:'V = system voltage (V), Ztotal = total impedance to fault (Ω)',                 standard:'IEC 60909' },
  { tag:'fault', name:'Fault MVA',                       eq:'MVAsc = MVAbase / Z_pu',            vars:'Z_pu = per-unit impedance',                                                      standard:'IEC 60909' },
  { tag:'fault', name:'Initial Symmetrical SC Current',  eq:"I''k = c × Vn / (√3 × Zk)",        vars:"c = voltage factor (1.05 LV/1.10 HV), Zk = fault impedance",                   standard:'IEC 60909 §4.3' },
  { tag:'fault', name:'Peak Short Circuit Current',      eq:"ip = κ × √2 × I''k",                vars:'κ = peak factor (1.02–1.8 per IEC 60909)',                                       standard:'IEC 60909' },
  { tag:'fault', name:'Thevenin Impedance (transformer)',eq:'Zt = Vk% × V²n / (100 × Sn)',      vars:'Vk% = short-circuit voltage %, Sn = rated MVA',                                  standard:'IEC 60909' },
  { tag:'fault', name:'Cable Impedance',                 eq:'Zc = (R + jX) × L',                 vars:'R = resistance (Ω/km), X = reactance (Ω/km), L = length (km)',                  standard:'IEC 60909' },

  // Motors
  { tag:'motor', name:'Slip',                            eq:'s = (ns − n) / ns',                 vars:'ns = synchronous speed (rpm), n = rotor speed (rpm)',                            standard:'IEC 60034' },
  { tag:'motor', name:'Synchronous Speed',               eq:'ns = 120f / p',                     vars:'f = supply frequency (Hz), p = number of poles',                                standard:'IEC 60034' },
  { tag:'motor', name:'Motor Efficiency',                eq:'η = Pout / Pin = Pout / (Pout + losses)', vars:'Losses = copper + iron + friction + windage',                             standard:'IEC 60034-2-1' },
  { tag:'motor', name:'Starting Current (DOL)',           eq:'Ist = 6 × Ifull-load',              vars:'Typical 5–8× FLC; confirm with motor datasheet',                                standard:'IEC 60947-4-1' },
  { tag:'motor', name:'OLR Setting (Class 10)',          eq:'Iset = 1.05 × IFL',                 vars:'Range: 0.9–1.15 × IFL per relay class',                                          standard:'IEC 60947-4-1' },
  { tag:'motor', name:'Motor Torque',                    eq:'T = 9550 × P / n',                  vars:'T in Nm, P in kW, n in rpm',                                                    standard:'IEC 60034' },
  { tag:'motor', name:'Motor Starting kVA',              eq:'kVA_start = √3 × V × Ist / 1000',   vars:'Used for generator/transformer sizing',                                          standard:'IEC 60947' },

  // Transformers
  { tag:'transformer', name:'Transformer Turns Ratio',   eq:'a = N₁/N₂ = V₁/V₂ = I₂/I₁',       vars:'N = turns, V = voltage, I = current',                                            standard:'IEC 60076-1' },
  { tag:'transformer', name:'Transformer Losses',        eq:'Ptotal = Pno-load + Pload × (I/In)²', vars:'Pno-load = iron losses, Pload = copper losses at full load',                 standard:'IEC 60076-1' },
  { tag:'transformer', name:'Impedance Voltage',         eq:'Vk% = (Isc / In) × 100',            vars:'Isc = short-circuit current at rated voltage',                                   standard:'IEC 60076-1' },
  { tag:'transformer', name:'Transformer Efficiency',    eq:'η = P2 / (P2 + Pfe + Pcu × L²)',   vars:'L = load factor (0–1), Pfe = iron, Pcu = copper losses',                        standard:'IEC 60076-1' },

  // Earthing
  { tag:'earthing', name:'Earth Electrode Resistance (rod)', eq:'R = ρ/(2πL) × ln(4L/d)',       vars:'ρ = soil resistivity (Ω·m), L = rod length (m), d = diameter (m)',              standard:'IEEE 80' },
  { tag:'earthing', name:'Touch Voltage Limit (IEC)',     eq:'Vtouch = Zb × Ib',                 vars:'Zb = body impedance (1000Ω), Ib = threshold current',                           standard:'IEC 60364-4-41' },
  { tag:'earthing', name:'GPR (Ground Potential Rise)',   eq:'GPR = Ig × Rg',                    vars:'Ig = fault current into earth (A), Rg = earth grid resistance (Ω)',             standard:'IEEE 80' },
  { tag:'earthing', name:'Mesh Voltage',                  eq:'Em = ρ × Km × Ki × Ig / Lm',      vars:'Km = mesh factor, Ki = irregularity factor, Lm = mesh conductor length',         standard:'IEEE 80 §16' },
  { tag:'earthing', name:'Step Voltage',                  eq:'Es = ρ × Ks × Ki × Ig / Ls',      vars:'Ks = step factor, Ls = buried conductor length',                                 standard:'IEEE 80 §16' },

  // Lighting
  { tag:'lighting', name:'Average Illuminance (Lumen method)', eq:'E = Φ × η × UF × MF / A',  vars:'Φ = lamp flux (lm), η = luminous efficacy, UF = utilisation, MF = maintenance',  standard:'IEC 60598' },
  { tag:'lighting', name:'Luminaire Spacing Criterion',   eq:'SHR = S / Hm',                    vars:'S = spacing (m), Hm = mounting height above work plane (m), SHR ≤ SHRmax',      standard:'EN 12464-1' },
  { tag:'lighting', name:'Room Index',                    eq:'RI = (L × W) / [Hm × (L + W)]',   vars:'L = room length (m), W = width (m), Hm = mounting height (m)',                  standard:'IEC 60598' },
  { tag:'lighting', name:'Power Density',                 eq:'LPD = (n × P) / A',               vars:'n = number of luminaires, P = wattage each (W), A = area (m²)',                  standard:'ASHRAE 90.1' },

  // Protection
  { tag:'protection', name:'Relay Pickup Current',        eq:'Ipickup = CTR × Iset',             vars:'CTR = CT ratio (primary/secondary), Iset = relay setting (A)',                  standard:'IEC 60255' },
  { tag:'protection', name:'IDMT Trip Time (SI)',         eq:'t = TMS × 0.14 / [(I/Is)^0.02 − 1]', vars:'TMS = time multiplier, Is = pickup current, I = fault current',               standard:'IEC 60255-151' },
  { tag:'protection', name:'IDMT Trip Time (VI)',         eq:'t = TMS × 13.5 / [(I/Is) − 1]',   vars:'Very Inverse characteristic',                                                    standard:'IEC 60255-151' },
  { tag:'protection', name:'CT Accuracy Limit Factor',    eq:'ALF = n × (Rct + Rb) / (Rct + Rbn)', vars:'Rct = CT secondary resistance, Rb = burden',                                 standard:'IEC 61869-2' },
  { tag:'protection', name:'Overcurrent Coordination Time',eq:'CTI = t_downstream + error + overshoot', vars:'CTI = 0.3–0.5s typical for LV; 0.5–1.0s for HV',                        standard:'IEC 60255' },
];

const CATS = [
  { id:'all',         label:'All Formulas', icon: Database,     count: FORMULAS.length },
  { id:'cable',       label:'Cable & Current', icon: Zap,       count: FORMULAS.filter(f=>f.tag==='cable').length },
  { id:'drop',        label:'Voltage Drop',    icon: TrendingDown, count: FORMULAS.filter(f=>f.tag==='drop').length },
  { id:'power',       label:'Power & Load',    icon: Activity,  count: FORMULAS.filter(f=>f.tag==='power').length },
  { id:'fault',       label:'Short Circuit',   icon: AlertTriangle, count: FORMULAS.filter(f=>f.tag==='fault').length },
  { id:'motor',       label:'Motors',          icon: Cpu,       count: FORMULAS.filter(f=>f.tag==='motor').length },
  { id:'transformer', label:'Transformers',    icon: BarChart3, count: FORMULAS.filter(f=>f.tag==='transformer').length },
  { id:'earthing',    label:'Earthing',        icon: CloudLightning, count: FORMULAS.filter(f=>f.tag==='earthing').length },
  { id:'lighting',    label:'Lighting',        icon: Lightbulb, count: FORMULAS.filter(f=>f.tag==='lighting').length },
  { id:'protection',  label:'Protection',      icon: Shield,    count: FORMULAS.filter(f=>f.tag==='protection').length },
];

const TAG_COLOR: Record<string, string> = {
  cable:'#2563EB', drop:'#D97706', power:'#7C3AED', fault:'#DC2626',
  motor:'#0891B2', transformer:'#A855F7', earthing:'#16A34A', lighting:'#F59E0B', protection:'#EA580C',
};

export function FormulaLibrary() {
  const [cat,   setCat]   = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    let list = cat === 'all' ? FORMULAS : FORMULAS.filter(f => f.tag === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.eq.toLowerCase().includes(q) ||
        f.vars.toLowerCase().includes(q) ||
        f.standard.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cat, query]);

  return (
    <div className="animate-fadeIn" style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(37,99,235,.12)', border:'1px solid rgba(37,99,235,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Database style={{ width:24, height:24, color:'#2563EB' }} />
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:V.txt, margin:0, letterSpacing:'-0.02em' }}>Formula Library</h1>
            <p style={{ fontSize:13, color:V.muted, margin:'3px 0 0' }}>{FORMULAS.length} electrical engineering formulas — IEC · IEEE · NEC</p>
          </div>
        </div>
        {/* Search */}
        <div style={{ position:'relative', width:280 }}>
          <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:V.muted }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search formulas, variables, standards…"
            style={{ width:'100%', height:42, paddingLeft:36, paddingRight:12, background:V.bg, border:`1px solid ${V.brdB}`, borderRadius:10, color:V.txt, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {CATS.map((c) => {
          const Icon = c.icon;
          const active = cat === c.id;
          const color = c.id === 'all' ? '#2563EB' : (TAG_COLOR[c.id] ?? '#2563EB');
          return (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:`1.5px solid ${active ? color : V.brdB}`, background: active ? `${color}15` : V.bg, color: active ? color : V.muted, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}>
              <Icon style={{ width:14, height:14 }} />
              {c.label}
              <span style={{ fontSize:11, padding:'1px 6px', borderRadius:10, background: active ? `${color}20` : V.surf, color: active ? color : V.muted }}>{c.count}</span>
            </button>
          );
        })}
      </div>

      {/* Formula grid */}
      {visible.length === 0 ? (
        <div style={{ padding:'60px 0', textAlign:'center', color:V.muted }}>
          <Search style={{ width:40, height:40, margin:'0 auto 12px', opacity:0.2 }} />
          <p>No formulas match your search.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(480px,1fr))', gap:14 }}>
          {visible.map((f, i) => {
            const color = TAG_COLOR[f.tag] ?? '#2563EB';
            return (
              <div key={i} style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:14, overflow:'hidden', boxShadow:'var(--ec-shadow-card)', borderLeft:`3px solid ${color}` }}>
                <div style={{ padding:'14px 18px', borderBottom:`1px solid ${V.brdM}`, background:V.surf, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:V.txt }}>{f.name}</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:8, background:`${color}18`, color, border:`1px solid ${color}30` }}>{f.standard}</span>
                </div>
                <div style={{ padding:'14px 18px' }}>
                  <div style={{ fontFamily:V.mono, fontSize:15, fontWeight:700, color, background:`${color}0A`, padding:'10px 14px', borderRadius:8, border:`1px solid ${color}20`, marginBottom:10, letterSpacing:'0.01em' }}>
                    {f.eq}
                  </div>
                  <div style={{ fontSize:12, color:V.muted, lineHeight:1.7 }}>{f.vars}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
