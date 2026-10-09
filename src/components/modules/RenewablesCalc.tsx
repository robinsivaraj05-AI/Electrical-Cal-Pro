import React, { useState } from 'react';
import { Sun, Wind, Battery, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ModHeader, WhyMatters, EngineeringNotes, KpiCard, SectionLabel } from '../common/ModuleShared';

const ACCENT = '#F59E0B';
const V = {
  bg:   'var(--ec-bg-card)', bgD: 'var(--ec-bg-root)', surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)', brdB: 'var(--ec-border)', brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)', muted: 'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

// ── Global irradiance reference data ──────────────────────────
const IRRADIANCE_DATA = [
  { city:'Dubai, UAE',          psh:5.4, lat:25.2, country:'UAE' },
  { city:'Mumbai, India',       psh:5.1, lat:19.1, country:'India' },
  { city:'Chennai, India',      psh:5.5, lat:13.1, country:'India' },
  { city:'Delhi, India',        psh:5.4, lat:28.6, country:'India' },
  { city:'Singapore',           psh:4.5, lat:1.4,  country:'Singapore' },
  { city:'Sydney, Australia',   psh:4.8, lat:-33.9,country:'Australia' },
  { city:'London, UK',          psh:2.8, lat:51.5, country:'UK' },
  { city:'Madrid, Spain',       psh:5.2, lat:40.4, country:'Spain' },
  { city:'Los Angeles, USA',    psh:5.5, lat:34.1, country:'USA' },
  { city:'Phoenix, USA',        psh:6.5, lat:33.4, country:'USA' },
  { city:'Cairo, Egypt',        psh:6.0, lat:30.1, country:'Egypt' },
  { city:'Riyadh, Saudi Arabia',psh:6.2, lat:24.7, country:'Saudi Arabia' },
  { city:'Nairobi, Kenya',      psh:5.8, lat:-1.3, country:'Kenya' },
  { city:'Mexico City, Mexico', psh:5.3, lat:19.4, country:'Mexico' },
  { city:'Tokyo, Japan',        psh:3.8, lat:35.7, country:'Japan' },
];

// ── Beaufort / Wind class reference ──────────────────────────
const WIND_CLASSES = [
  { bf:1,  desc:'Light air',     speed:'1-3 m/s',  power:'Near zero' },
  { bf:3,  desc:'Gentle breeze', speed:'4-5 m/s',  power:'Low' },
  { bf:4,  desc:'Moderate',      speed:'6-8 m/s',  power:'Moderate' },
  { bf:5,  desc:'Fresh',         speed:'9-11 m/s', power:'Good turbine output' },
  { bf:6,  desc:'Strong',        speed:'12-14 m/s',power:'High — good site' },
  { bf:7,  desc:'Near gale',     speed:'14-17 m/s',power:'Excellent site' },
];

// ── Solar PV System Designer ──────────────────────────────────
function SolarDesigner() {
  const { addCalculation } = useStore();
  const [loadKwh,   setLoadKwh]   = useState(20);
  const [panelWp,   setPanelWp]   = useState(450);
  const [psh,       setPsh]       = useState(5.2);
  const [sysVolt,   setSysVolt]   = useState(48);
  const [efficiency,setEfficiency]= useState(0.80);
  const [tCoeff,    setTCoeff]    = useState(-0.35);  // %/°C
  const [tMax,      setTMax]      = useState(70);      // cell temp °C at worst
  const [voc,       setVoc]       = useState(49.5);
  const [vmpp,      setVmpp]      = useState(41.2);
  const [res, setRes] = useState<null|{ panelsNeeded:number; stringsParallel:number; panelsPerString:number; inverterKva:number; tCorrVoc:number; arrayWp:number; dailyYield:number }>(null);

  const calculate = () => {
    const panelKwh = (panelWp / 1000) * psh * efficiency;
    const panelsNeeded = Math.ceil(loadKwh / panelKwh);
    const panelsPerString = Math.floor(sysVolt * 1.25 / vmpp); // ensure Vmpp string > inverter MPPT min
    const stringsParallel = Math.ceil(panelsNeeded / Math.max(panelsPerString, 1));
    const arrayWp = panelsNeeded * panelWp;
    const inverterKva = arrayWp / 1000 * 1.25;
    const tDelta = tMax - 25;
    const tCorrVoc = voc * (1 + (tCoeff / 100) * tDelta) * panelsPerString;
    const dailyYield = (arrayWp / 1000) * psh * efficiency;
    setRes({ panelsNeeded, stringsParallel, panelsPerString, inverterKva, tCorrVoc, arrayWp, dailyYield });
    addCalculation({
      type:'solar-pv',
      title:`Solar PV — ${panelsNeeded} panels × ${panelWp}Wp, ${(arrayWp/1000).toFixed(1)} kWp`,
      inputs:{ dailyLoad:`${loadKwh} kWh/day`, panelPower:`${panelWp} Wp`, peakSunHours:`${psh} h`, systemVoltage:`${sysVolt} V` },
      results:{
        values:[
          { label:'Panels Required',   value:panelsNeeded.toString(),               unit:'panels', highlight:true },
          { label:'Array Size',        value:(arrayWp/1000).toFixed(2),             unit:'kWp',    highlight:true },
          { label:'Inverter Size',     value:inverterKva.toFixed(1),                unit:'kVA' },
          { label:'Daily Yield',       value:dailyYield.toFixed(1),                 unit:'kWh/day' },
          { label:'Strings × Panels', value:`${stringsParallel} × ${panelsPerString}`, unit:'' },
        ],
        status:'INFO', recommendation:`${panelsNeeded} panels in ${stringsParallel} string(s) of ${panelsPerString}. Array: ${(arrayWp/1000).toFixed(2)} kWp. Inverter: ≥${inverterKva.toFixed(1)} kVA.`,
        formula:'Panels = Daily load / (Wp/1000 × PSH × η)', steps:[],
        standardRef:{ standard:'IEC 62109 / IEC 61215', clause:'—', title:'Solar PV System Design' },
      },
      notes:'', standard:'IEC 61215 / IEC 62109',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="System Parameters" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { label:'Daily Load (kWh/day)',     val:loadKwh,    set:setLoadKwh,    min:0.5, step:0.5  },
            { label:'Panel Wattage (Wp)',        val:panelWp,    set:setPanelWp,    min:50,  step:10   },
            { label:'Peak Sun Hours (h/day)',    val:psh,        set:setPsh,        min:1,   step:0.1  },
            { label:'System Voltage (V DC)',     val:sysVolt,    set:setSysVolt,    min:12,  step:12   },
            { label:'System Efficiency (0-1)',   val:efficiency, set:setEfficiency, min:0.5, step:0.01, max:1 },
            { label:'Panel Voc (V)',             val:voc,        set:setVoc,        min:5,   step:0.1  },
            { label:'Panel Vmpp (V)',            val:vmpp,       set:setVmpp,       min:5,   step:0.1  },
            { label:'Temp Coeff Voc (%/°C)',     val:tCoeff,     set:setTCoeff,     min:-1,  step:0.01, max:0 },
          ].map(({ label, val, set, min, step, max }) => (
            <div key={label}>
              <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>{label}</label>
              <input type="number" value={val} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} style={inp} />
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>Max Cell Temperature (°C)</label>
          <input type="number" value={tMax} min={25} max={90} step={1} onChange={(e) => setTMax(Number(e.target.value))} style={inp} />
        </div>
        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${ACCENT},#D97706)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:`0 8px 24px ${ACCENT}40` }}>
          Design Solar PV System
        </button>
      </div>

      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Design Results" />
        {!res ? (
          <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center', color:V.muted, fontSize:13 }}><Sun style={{ width:32, height:32, margin:'0 auto 8px', opacity:0.3 }} /><br />Enter parameters and design</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <KpiCard label="Panels Needed" value={res.panelsNeeded.toString()} unit="panels" accentColor={ACCENT} />
              <KpiCard label="Array Size" value={(res.arrayWp/1000).toFixed(2)} unit="kWp" accentColor={ACCENT} />
              <KpiCard label="Daily Yield" value={res.dailyYield.toFixed(1)} unit="kWh/day" accentColor={ACCENT} />
              <KpiCard label="Inverter Size" value={res.inverterKva.toFixed(1)} unit="kVA" accentColor={ACCENT} />
            </div>
            <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:V.lbl, marginBottom:10 }}>String Configuration</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[
                  { l:'Strings in Parallel', v:res.stringsParallel },
                  { l:'Panels per String',   v:res.panelsPerString },
                  { l:'Total Panels',        v:res.panelsNeeded },
                ].map(({ l, v }) => (
                  <div key={l} style={{ background:V.bg, borderRadius:8, padding:'10px 12px', border:`1px solid ${V.brd}`, textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:ACCENT, fontFamily:V.mono }}>{v}</div>
                    <div style={{ fontSize:10, color:V.muted, marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:V.lbl, marginBottom:6 }}>Temperature-Corrected Voc (worst case at {tMax}°C)</div>
              <div style={{ fontSize:18, fontWeight:800, color: res.tCorrVoc > sysVolt * 1.5 ? '#DC2626' : '#16A34A', fontFamily:V.mono }}>
                {res.tCorrVoc.toFixed(1)} V per string
              </div>
              <div style={{ fontSize:11, color:V.muted, marginTop:4 }}>Inverter max input voltage must exceed this value</div>
            </div>
          </div>
        )}
        {/* PSH Reference */}
        <div style={{ marginTop:16, background:V.bgD, borderRadius:12, border:`1px solid ${V.brd}`, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:12, fontWeight:700, color:V.txt }}>Peak Sun Hours — Global Reference</div>
          <div style={{ maxHeight:180, overflowY:'auto' }}>
            {IRRADIANCE_DATA.map((r) => (
              <div key={r.city} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 14px', borderBottom:`1px solid ${V.brdM}`, fontSize:12 }}>
                <span style={{ color:V.sec }}>{r.city}</span>
                <span style={{ fontFamily:V.mono, fontWeight:700, color:ACCENT }}>{r.psh} h/day</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Battery Storage Calculator ────────────────────────────────
function BatteryCalc() {
  const { addCalculation } = useStore();
  const [energyKwh,  setEnergyKwh]  = useState(10);
  const [autonomy,   setAutonomy]   = useState(2);
  const [dod,        setDod]        = useState(0.80);
  const [battVolt,   setBattVolt]   = useState(48);
  const [cellVolt,   setCellVolt]   = useState(12);
  const [efficiency, setEfficiency] = useState(0.90);
  const [res, setRes] = useState<null|{ totalKwh:number; requiredAh:number; cellsSerial:number; cellsParallel:number; totalCells:number }>(null);

  const calculate = () => {
    const totalKwh = (energyKwh * autonomy) / (dod * efficiency);
    const requiredAh = (totalKwh * 1000) / battVolt;
    const cellsSerial = Math.ceil(battVolt / cellVolt);
    const standardAh = [26, 50, 100, 150, 200, 250, 300, 400];
    const selectedAh = standardAh.find(a => a >= requiredAh / 2) ?? standardAh[standardAh.length - 1];
    const cellsParallel = Math.ceil(requiredAh / selectedAh);
    const totalCells = cellsSerial * cellsParallel;
    setRes({ totalKwh, requiredAh, cellsSerial, cellsParallel, totalCells });
    addCalculation({
      type:'battery',
      title:`Battery Storage — ${totalKwh.toFixed(1)} kWh @ ${battVolt}V`,
      inputs:{ energyNeeded:`${energyKwh} kWh`, autonomy:`${autonomy} h`, dod:`${(dod*100).toFixed(0)}%`, batteryVoltage:`${battVolt} V` },
      results:{
        values:[
          { label:'Required Capacity', value:totalKwh.toFixed(2),    unit:'kWh', highlight:true },
          { label:'Required Ah',       value:requiredAh.toFixed(0),   unit:'Ah',  highlight:true },
          { label:'Cells Series',      value:cellsSerial.toString(),  unit:'' },
          { label:'Cells Parallel',    value:cellsParallel.toString(),unit:'' },
        ],
        status:'INFO', recommendation:`Battery bank: ${cellsSerial}S × ${cellsParallel}P = ${totalCells} cells.`,
        formula:'C_total = (E × t_aut) / (DoD × η)', steps:[],
        standardRef:{ standard:'IEC 62619', clause:'—', title:'Battery Storage System Safety' },
      },
      notes:'', standard:'IEC 62619',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Battery Parameters" />
        {[
          { label:'Energy to Store (kWh)',     val:energyKwh,  set:setEnergyKwh,  min:0.1, step:0.5 },
          { label:'Autonomy Time (hours)',      val:autonomy,   set:setAutonomy,   min:0.5, step:0.5 },
          { label:'Depth of Discharge (0-1)',  val:dod,        set:setDod,        min:0.1, step:0.05, max:1 },
          { label:'Battery Bank Voltage (V)',  val:battVolt,   set:setBattVolt,   min:12,  step:12  },
          { label:'Individual Cell Voltage (V)',val:cellVolt,  set:setCellVolt,   min:2,   step:2   },
          { label:'Round-trip Efficiency',     val:efficiency, set:setEfficiency, min:0.5, step:0.01, max:1 },
        ].map(({ label, val, set, min, step, max }) => (
          <div key={label} style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>{label}</label>
            <input type="number" value={val} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} style={inp} />
          </div>
        ))}
        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,#8B5CF6,#7C3AED)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:'0 8px 24px rgba(139,92,246,.4)', marginTop:6 }}>
          Calculate Battery Bank
        </button>
      </div>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Battery Bank Results" />
        {!res ? (
          <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center', color:V.muted, fontSize:13 }}><Battery style={{ width:32, height:32, margin:'0 auto 8px', opacity:0.3 }} /><br />Enter parameters and calculate</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <KpiCard label="Required Energy" value={res.totalKwh.toFixed(2)} unit="kWh" accentColor="#8B5CF6" />
              <KpiCard label="Required Capacity" value={res.requiredAh.toFixed(0)} unit="Ah" accentColor="#8B5CF6" />
              <KpiCard label="Cells in Series" value={res.cellsSerial.toString()} unit="" accentColor="#8B5CF6" />
              <KpiCard label="Strings Parallel" value={res.cellsParallel.toString()} unit="" accentColor="#8B5CF6" />
            </div>
            <div style={{ background:V.surf, borderRadius:12, padding:'14px 16px', border:`1px solid ${V.brd}`, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Total Cells Required</div>
              <div style={{ fontSize:36, fontWeight:800, color:'#8B5CF6', fontFamily:V.mono }}>{res.totalCells}</div>
              <div style={{ fontSize:13, color:V.muted, marginTop:4 }}>{res.cellsSerial} series × {res.cellsParallel} parallel</div>
            </div>
            <div style={{ padding:'12px 14px', background:'rgba(139,92,246,.08)', border:'1px solid rgba(139,92,246,.25)', borderRadius:10, fontSize:12, color:V.muted }}>
              <strong style={{ color:V.lbl }}>DoD note:</strong> Li-ion: DoD 80-90% typical. Lead-acid: DoD 50-60% recommended to extend cycle life. LiFePO4: DoD 90% safe.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Wind Power Calculator ─────────────────────────────────────
function WindCalc() {
  const { addCalculation } = useStore();
  const [diameter, setDiameter] = useState(5);   // rotor diameter m
  const [windSpeed, setWindSpeed] = useState(7);  // m/s
  const [cp,        setCp]        = useState(0.40); // Betz coefficient typical
  const [density,   setDensity]   = useState(1.225);// kg/m³ standard air
  const [res, setRes] = useState<null|{ area:number; power:number; betzLimit:number; annualKwh:number }>(null);

  const calculate = () => {
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const power = 0.5 * density * area * Math.pow(windSpeed, 3) * cp;
    const betzLimit = 0.5 * density * area * Math.pow(windSpeed, 3) * 0.593;
    const annualKwh = power * 8760 * 0.35 / 1000; // 35% capacity factor typical
    setRes({ area, power, betzLimit, annualKwh });
    addCalculation({
      type:'wind',
      title:`Wind Power — ${diameter}m rotor, ${windSpeed} m/s, ${(power/1000).toFixed(2)} kW`,
      inputs:{ rotorDiameter:`${diameter} m`, windSpeed:`${windSpeed} m/s`, cp:cp.toString(), airDensity:`${density} kg/m³` },
      results:{
        values:[
          { label:'Power Output', value:(power/1000).toFixed(3), unit:'kW', highlight:true },
          { label:'Swept Area',   value:area.toFixed(2),          unit:'m²' },
          { label:'Betz Limit',   value:(betzLimit/1000).toFixed(3),unit:'kW' },
          { label:'Annual Yield', value:annualKwh.toFixed(0),     unit:'kWh/yr' },
        ],
        status:'INFO', recommendation:`Output ${(power/1000).toFixed(3)} kW at ${windSpeed} m/s. Betz maximum: ${(betzLimit/1000).toFixed(3)} kW (Cp=0.593). Cp efficiency: ${((cp/0.593)*100).toFixed(0)}% of Betz limit.`,
        formula:'P = ½ × ρ × A × v³ × Cp', steps:[],
        standardRef:{ standard:'IEC 61400-1', clause:'—', title:'Wind Turbine Design Requirements' },
      },
      notes:'', standard:'IEC 61400-1',
    });
  };

  const inp: React.CSSProperties = { height:42, background:V.surf, border:`1px solid ${V.brdB}`, borderRadius:9, color:V.txt, fontSize:14, fontWeight:700, padding:'0 14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' };
  const powerSpeeds = [3,4,5,6,7,8,9,10,12,14,16];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Turbine Parameters" />
        {[
          { label:'Rotor Diameter (m)',     val:diameter,  set:setDiameter,  min:0.5, step:0.5 },
          { label:'Wind Speed (m/s)',        val:windSpeed, set:setWindSpeed, min:1,   step:0.5 },
          { label:'Power Coefficient Cp',   val:cp,        set:setCp,        min:0.1, step:0.01, max:0.593 },
          { label:'Air Density (kg/m³)',    val:density,   set:setDensity,   min:1.0, step:0.001 },
        ].map(({ label, val, set, min, step, max }) => (
          <div key={label} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:V.lbl, display:'block', marginBottom:5 }}>{label}</label>
            <input type="number" value={val} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} style={inp} />
          </div>
        ))}
        <div style={{ padding:'12px 14px', background:V.surf, borderRadius:10, border:`1px solid ${V.brd}`, marginBottom:16, fontSize:12, color:V.muted }}>
          <strong style={{ color:V.lbl }}>Betz limit:</strong> Maximum theoretical Cp = 0.593 (59.3%). Practical turbines achieve Cp = 0.35–0.50.
        </div>
        <button onClick={calculate} style={{ width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#0D9488,#0F766E)', color:'#fff', fontSize:15, fontWeight:800, fontFamily:'inherit', boxShadow:'0 8px 24px rgba(13,148,136,.4)' }}>
          Calculate Wind Power
        </button>
      </div>
      <div style={{ background:V.bg, border:`1px solid ${V.brd}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
        <SectionLabel title="Wind Power Results" />
        {!res ? (
          <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', background:V.surf, borderRadius:12, border:`1.5px dashed ${V.brd}` }}>
            <div style={{ textAlign:'center', color:V.muted, fontSize:13 }}><Wind style={{ width:32, height:32, margin:'0 auto 8px', opacity:0.3 }} /><br />Enter parameters and calculate</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <KpiCard label="Power Output" value={(res.power/1000).toFixed(3)} unit="kW" accentColor="#0D9488" />
            <KpiCard label="Swept Area" value={res.area.toFixed(2)} unit="m²" accentColor="#0D9488" />
            <KpiCard label="Betz Limit" value={(res.betzLimit/1000).toFixed(3)} unit="kW" accentColor="#0D9488" />
            <KpiCard label="Est. Annual Yield" value={res.annualKwh.toFixed(0)} unit="kWh/yr" accentColor="#0D9488" />
          </div>
        )}
        {/* Power curve table */}
        <div style={{ marginTop:16, background:V.bgD, borderRadius:12, border:`1px solid ${V.brd}`, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:12, fontWeight:700, color:V.txt }}>
            Power Curve — {diameter}m rotor, Cp={cp}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:`1px solid ${V.brdM}` }}>
            {['Speed (m/s)','Area (m²)','Power (kW)','Betz (kW)'].map(h => (
              <div key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</div>
            ))}
          </div>
          {powerSpeeds.map((v) => {
            const a = Math.PI * Math.pow(diameter/2, 2);
            const p = 0.5 * density * a * Math.pow(v, 3) * cp / 1000;
            const b = 0.5 * density * a * Math.pow(v, 3) * 0.593 / 1000;
            const isSelected = v === windSpeed;
            return (
              <div key={v} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background: isSelected ? `${ACCENT}12` : 'transparent', borderBottom:`1px solid ${V.brdM}` }}>
                <div style={{ padding:'7px 10px', fontSize:12, fontFamily:V.mono, fontWeight:700, color: isSelected ? ACCENT : V.sec }}>{v}</div>
                <div style={{ padding:'7px 10px', fontSize:12, fontFamily:V.mono, color:V.muted }}>{a.toFixed(1)}</div>
                <div style={{ padding:'7px 10px', fontSize:12, fontFamily:V.mono, fontWeight: isSelected ? 800 : 500, color: isSelected ? ACCENT : V.muted }}>{p.toFixed(3)}</div>
                <div style={{ padding:'7px 10px', fontSize:12, fontFamily:V.mono, color:V.muted }}>{b.toFixed(3)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:16, background:V.bg, borderRadius:12, border:`1px solid ${V.brd}`, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:V.surf, borderBottom:`1px solid ${V.brdM}`, fontSize:12, fontWeight:700, color:V.txt }}>Beaufort / Wind Class Reference</div>
          {WIND_CLASSES.map((c) => (
            <div key={c.bf} style={{ display:'grid', gridTemplateColumns:'40px 1fr 90px 1fr', alignItems:'center', padding:'8px 14px', borderBottom:`1px solid ${V.brdM}`, fontSize:12 }}>
              <div style={{ fontFamily:V.mono, fontWeight:800, color:ACCENT }}>{c.bf}</div>
              <div style={{ color:V.sec }}>{c.desc}</div>
              <div style={{ fontFamily:V.mono, color:V.muted }}>{c.speed}</div>
              <div style={{ color:V.muted }}>{c.power}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Why / Notes ───────────────────────────────────────────────
const WHY_ITEMS = [
  { title:'Solar: Avoiding Oversizing', desc:'Over-specifying panel count wastes capital. Accurate PSH data and realistic system efficiency (typically 75-85%) are critical for economic sizing.' },
  { title:'Temperature Derating',       desc:'PV panels lose ~0.35%/°C above 25°C STC. In tropical climates (cell temp 60-75°C), power output is 12-18% below nameplate rating — always apply Pmax correction.' },
  { title:'String Voltage Safety',      desc:'Temperature-corrected Voc at minimum site temperature must never exceed the inverter maximum input voltage. Cold morning starts create the highest string voltage.' },
  { title:'Battery DoD and Life',       desc:'Deep cycle lead-acid batteries should not exceed 50% DoD — beyond this, plate sulfation accelerates and cycle life drops sharply. LiFePO4 allows 90% DoD safely.' },
  { title:'Wind Cube Law',              desc:'Wind power scales with the cube of speed: doubling wind speed gives 8× more power. A site at 7 m/s produces 3.4× more energy than a 5 m/s site.' },
  { title:'Grid Connection Requirements', desc:'IEC 61727 (PV) and IEC 61400-21 (wind) set anti-islanding, voltage, and frequency limits for grid-connected systems. Many utilities require type-tested inverters.' },
];

const NOTES = [
  { color:ACCENT, title:'IEC 61215 / IEC 61853 — PV System Design', body:'Panel output is rated at STC: 1000 W/m² irradiance, 25°C cell temperature, AM1.5 spectrum. Field conditions rarely match STC. Apply derating: irradiance conversion efficiency (96%), wiring losses (2%), inverter efficiency (97%), soiling (3%), shade (5%). Typical system efficiency: 78–85%. Peak Sun Hours = total daily irradiance (kWh/m²) at a given location.' },
  { color:'#8B5CF6', title:'IEC 62619 — Battery Storage Safety', body:'Depth of Discharge (DoD): Li-ion NMC/NCA: 80%, LiFePO4: 90%, Lead-acid: 50%. Round-trip efficiency: Li-ion: 92–97%, Lead-acid: 75–85%, Flow batteries: 70–80%. Battery C-rate: C/10 charging is safe for all chemistry; C/2 is typical for Li-ion; C/5 for lead-acid. Temperature significantly affects capacity: lead-acid loses 1%/°C below 25°C.' },
  { color:'#0D9488', title:'IEC 61400-1 — Wind Turbine Design', body:'Betz limit: maximum extractable power is 16/27 ≈ 59.3% of kinetic wind energy (Betz 1919). Practical turbines achieve Cp = 0.35–0.50. Wind class IEC I: V_avg ≥ 10 m/s; Class II: ≥ 8.5 m/s; Class III: ≥ 7.5 m/s. Cut-in speed typically 3–4 m/s; rated speed 11–13 m/s; cut-out 25 m/s. Annual capacity factor: onshore 25–40%; offshore 40–55%.' },
  { color:'#059669', title:'Hybrid Systems — Grid-Tied vs Off-Grid', body:'Grid-tied systems: no battery needed, anti-islanding protection mandatory (IEEE 1547), excess energy exported. Off-grid systems: battery autonomy (1–3 days typical), generator backup for extended low-sun/wind periods. Hybrid systems combine both: battery buffer for peak demand, grid as backup. Sizing: design for worst-month solar resource, not annual average.' },
];

const TABS_DEF = [
  { id:'solar',   label:'Solar PV Designer', icon: Sun },
  { id:'battery', label:'Battery Storage',   icon: Battery },
  { id:'wind',    label:'Wind Power',        icon: Wind },
];

export function RenewablesCalc() {
  const [tab, setTab] = useState('solar');
  return (
    <div className="animate-fadeIn" style={{ fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Sun} title="RENEWABLES CALCULATOR" subtitle="IEC 61215 · IEC 61400-1 · IEC 62619 — Solar PV, battery storage and wind power design" accentColor={ACCENT} />
      <div style={{ display:'flex', gap:10, marginBottom:28, padding:'6px', background:V.bgD, borderRadius:14, width:'fit-content', border:`1px solid ${V.brd}` }}>
        {TABS_DEF.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:10, border:`1px solid ${tab===t.id?ACCENT:'transparent'}`, background:tab===t.id?`${ACCENT}18`:'transparent', color:tab===t.id?ACCENT:V.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <Icon style={{ width:15, height:15 }} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'solar'   && <SolarDesigner />}
      {tab === 'battery' && <BatteryCalc />}
      {tab === 'wind'    && <WindCalc />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
