import React, { useState } from 'react';
import { BookOpen, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#6366F1';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

interface Topic {
  id: string; category: string; title: string; summary: string;
  keyPoints: string[]; formula?: string; standard: string; tag: string;
}

const TOPICS: Topic[] = [
  { id:'T01', category:'Pressure', title:'Pressure Measurement Fundamentals', standard:'IEC 60770 · ASME B40.100', tag:'Pressure', summary:'Pressure is the force per unit area. In process industries, three references are used: gauge (relative to atmosphere), absolute (relative to perfect vacuum), and differential (difference between two process points). Instruments include: bourdon tube gauges (elastic-element mechanical), capacitance cells, strain-gauge and resonant-wire sensors, and piezoelectric transmitters.',
    keyPoints:['Gauge Pressure = Absolute − Atmospheric (101.325 kPa at MSL)','Differential DP transmitters use two-chamber capacitance cells','Minimum span typically 1:5 turndown from URV','Wet-leg vs dry-leg for DP instruments on liquids','Overpressure protection ≥ 1.5 × URV per IEC 60770'], formula:'P = F/A (Pa = N/m²)  |  P = ρgh (hydrostatic)' },

  { id:'T02', category:'Temperature', title:'Temperature Measurement — RTD & Thermocouple', standard:'IEC 60751 (RTD) · IEC 60584 (TC)', tag:'Temp', summary:'RTDs (Pt100/Pt1000) use resistance change with temperature via Callendar-Van Dusen equation. Type K thermocouples (Chromel-Alumel) are the most common industrial TC covering −200 to 1372°C. Transmitters convert to 4-20mA. Cold-junction compensation is mandatory for all TC circuits.',
    keyPoints:['Pt100: R = 100Ω at 0°C, sensitivity ≈ 0.385 Ω/°C','Class A accuracy: ±(0.15+0.002|T|)°C  |  Class B: ±(0.3+0.005|T|)°C','Type K: 0 mV at 0°C, 41.276 mV at 1000°C, ≈41 μV/°C','3-wire RTD eliminates lead resistance error — use 4-wire for best accuracy','Cold junction compensation required for all TC head transmitters'], formula:'R(T) = R₀(1 + AT + BT²)  A=3.9083×10⁻³  B=−5.775×10⁻⁷' },

  { id:'T03', category:'Flow', title:'Flow Measurement — Principles & Technologies', standard:'ISO 5167 · AGA-9 · API 2534', tag:'Flow', summary:'Flow technologies: Differential Pressure (orifice/venturi/pitot), Vortex, Magnetic (EMF), Coriolis (mass flow), Ultrasonic (transit time/Doppler), Turbine, Positive Displacement. Each has specific fluid compatibility, Reynolds number requirements, and installation straight-run requirements.',
    keyPoints:['Orifice plate: Q = Cd×(π/4)×d²×√(2ΔP/ρ) — low cost, requires straight run','Magnetic: only for conductive liquids (≥5 μS/cm), no moving parts','Coriolis: direct mass flow, bidirectional, ±0.1% accuracy','Vortex: Strouhal number St = f×d/V ≈ 0.2','Installation: 10–20D upstream, 5D downstream straight run minimum'], formula:'Q = Cd×(π/4)×d²×√(2ΔP/ρ)  |  Re = ρVD/μ' },

  { id:'T04', category:'Level', title:'Level Measurement — Hydrostatic, Guided Wave, Ultrasonic', standard:'OIML R 71 · API 2350', tag:'Level', summary:'Level measurement technologies: hydrostatic (pressure-based), guided wave radar (GWR), free-space radar, ultrasonic (echo time-of-flight), float/displacer, capacitance, magnetostrictive. Selection depends on fluid properties, tank pressure, foam, turbulence, and SIL requirement.',
    keyPoints:['Hydrostatic: h = ΔP/(ρ×g) — simple but requires density correction','GWR (TDR): suitable for interface measurement, foam, vapour','Ultrasonic: lower cost, limited by vapour, foam, tank geometry','Displacer: very accurate for interface, no external power needed','Closed tank with gas blanket: use differential DP, not gauge pressure'], formula:'h = ΔP / (ρ × g)  |  Level% = (h − LRV)/(URV − LRV) × 100' },

  { id:'T05', category:'Control Valves', title:'Control Valves — Sizing, Characteristics, Selection', standard:'ISA-75.01 · IEC 60534 · ANSI/FCI 70-2', tag:'Valve', summary:'Control valves modulate flow by varying the restriction in a process line. Cv (US) or Kv (metric) is the flow coefficient. Valve characteristics: linear (equal increment of travel = equal change in Cv), equal percentage (equal % change in Cv per % travel), quick-opening. Valve authority N = ΔP_valve/ΔP_system must be ≥0.25 for good control.',
    keyPoints:['Cv = Q/N₁ × √(SG/ΔP)  where N₁=0.865 for m³/hr and bar','Kv = Q × √(ρ/ΔP) in m³/h at ΔP=1 bar, ρ=1000 kg/m³','Valve authority N ≥ 0.25–0.30 for good controllability','Equal% characteristic used for most processes — inherently compensates for system curve','Spring-return fail position must be defined (FC/FO/FL) in SIL analysis'], formula:'Cv = Q / N₁ × √(SG/ΔP)  |  Kv = Cv × 0.865' },

  { id:'T06', category:'PID Control', title:'PID Controller Theory & Tuning', standard:'ISA-5.1 · ISA-TR5.4 · IEC 61131', tag:'PID', summary:'A PID (Proportional-Integral-Derivative) controller corrects process error e(t) = Setpoint − Process Variable. Output = Kp×e + Ki×∫e dt + Kd×de/dt. In parallel form: Kp, Ki=Kp/Ti, Kd=Kp×Td. Three main tuning methods: Ziegler-Nichols (ultimate cycle), Cohen-Coon (open-loop step test), Lambda/IMC (model-based).',
    keyPoints:['P-only: offset remains. PI: eliminates offset. PID: reduces overshoot.','Ziegler-Nichols PID: Kp=0.6Ku, Ti=0.5Tu, Td=0.125Tu','Cohen-Coon uses FOPDT model (K, τ, θ) from step test','Lambda tuning: adjust λ for robust control, λ >> θ = very stable','Integral windup — must use anti-windup for saturating outputs'], formula:'u(t) = Kp[e(t) + 1/Ti×∫e dt + Td×de/dt]' },

  { id:'T07', category:'Signal Standards', title:'4-20mA & HART Signal Standard', standard:'IEC 60381 · NAMUR NE43 · HART 7', tag:'Signal', summary:'4-20mA is the dominant process industry signal standard. 4mA represents 0% and 20mA represents 100% of span. NAMUR NE43 defines fault detection: <3.6mA = instrument failure (low), >21.0mA = instrument failure (high). HART (Highway Addressable Remote Transducer) overlays digital 1200-baud FSK communication on the 4-20mA signal.',
    keyPoints:['4mA = LRV (0%)  |  20mA = URV (100%)  |  Range: 0–100% = 4–20mA','NAMUR NE43: 3.8mA alarm low, <3.6mA fault. 20.5mA alarm high, >21.0mA fault','HART 7: 250–500Ω minimum load required for HART communication','Foundation Fieldbus H1: 31.25 kbps, max 32 devices per segment','Profibus PA: IEC 61158, 31.25 kbps, intrinsically safe segment possible'], formula:'EU = LRV + (I−4)/16 × Span  |  I = 4 + (EU−LRV)/Span × 16' },

  { id:'T08', category:'Intrinsic Safety', title:'Intrinsic Safety & Ex Zone Classification', standard:'IEC 60079-0 · IEC 60079-11 · IEC 60079-10', tag:'ATEX', summary:'Intrinsic Safety (Ex i) limits electrical energy in hazardous areas so ignition cannot occur. Zone classification: Zone 0 (continuous), Zone 1 (intermittent normal), Zone 2 (abnormal only). Zener barriers or galvanic isolators limit Voc, Isc, Pmax to safe levels. Entity concept verifies compatibility between barrier and field device.',
    keyPoints:['Ex ia: Suitable for Zone 0, 1, 2 — two-fault safe','Ex ib: Suitable for Zone 1, 2 — one-fault safe','Temperature classes: T1(450°C) through T6(85°C)','Entity check: barrier Voc ≤ instrument Vmax, Isc ≤ Imax','IIB: most common gas group — hydrogen (IIC) requires special barriers'], formula:'Voc × Isc ≤ 4 × Pmax  (entity concept, IEC 60079-11)' },

  { id:'T09', category:'ISA Symbols', title:'ISA-5.1 P&ID Symbols & Loop Numbering', standard:'ISA-5.1 · ISA-5.4 · ISA-5.06.01', tag:'Symbols', summary:'ISA-5.1 defines instrument symbols for P&IDs. First letter = measured variable (P=Pressure, T=Temp, F=Flow, L=Level, A=Analyzer). Second+ letters = function (T=Transmitter, C=Controller, I=Indicator, R=Recorder, Y=Relay, S=Switch, V=Valve). Bubbles: circle = field instrument, circle with line = panel, circle with DCS symbol = DCS, diamond = computer.',
    keyPoints:['PT = Pressure Transmitter · TIC = Temperature Indicating Controller','FCV = Flow Control Valve · LSH = Level Switch High','First number = loop number, Letter suffix = instrument in loop (e.g. FT-101A)','Double line through bubble = shared display (DCS/SCADA)','ISA-5.4 defines standard instrument loop diagrams (ILD format)'], formula:'Tag format: XXNNN where XX=function letters, NNN=loop number' },

  { id:'T10', category:'Calibration', title:'Calibration Principles & Traceability', standard:'ISA-51.1 · ISO/IEC 17025 · ILAC-G8 · OIML', tag:'Cal', summary:'Calibration is the comparison of a measurement instrument against a reference standard of known accuracy. As-Found condition documents the pre-adjustment state. As-Left condition documents post-adjustment. Traceability chain: National Standard → Transfer Standard → Working Standard → Process Instrument. Calibration certificates must include measurement uncertainty.',
    keyPoints:['Error % = (Indicated − Reference) / Span × 100','Hysteresis = upscale vs downscale reading difference','Repeatability = spread of repeated readings at same input','Measurement uncertainty: Type A (statistical), Type B (certificate/data)','Calibration interval: based on drift history, criticality, SIL requirement'], formula:'Error% = (I − Ref) / Span × 100  |  Accuracy = ±X% of span' },

  { id:'T11', category:'Glass Manufacturing', title:'Glass Furnace Instrumentation', standard:'EN 695 · EN 746-2 · ISO 8006', tag:'Glass', summary:'Float glass furnaces require critical temperature profiling across the melt zone, refiner, and conditioner. Thermocouples Type B (Pt-30%Rh/Pt-6%Rh) or Type S/R are used at high-temperature zones. Furnace pressure is controlled near neutral/slightly positive to prevent air ingress. Combustion control uses cross-limited air/fuel ratio control.',
    keyPoints:['Melt zone temperature: 1550–1600°C — Type B TC recommended','Furnace pressure control: ±0.02 mmH₂O — critical for combustion quality','Regenerator temperature: up to 1300°C — Type S TC with protection tube','Oxygen trim control: O₂ analyser in flue, target 1–3% O₂','Batch blanket temperature: controlled by batch feeder speed and firing rate'], formula:'Q_fuel = m_fuel × LHV  |  η = Q_useful / Q_fuel × 100' },

  { id:'T12', category:'Glass Manufacturing', title:'Burner Management System (BMS)', standard:'IEC 61511 · NFPA 86 · EN 746-2', tag:'BMS', summary:'A BMS controls the safe operation of industrial burners including purge, ignition, flame proving, and shutdown sequences. For glass furnaces, the BMS interfaces with the combustion control system (CCS). Flame detectors (UV/IR) provide flame presence confirmation. Safety interlock functions are assigned SIL ratings per IEC 61511.',
    keyPoints:['Pre-purge: minimum 4 air changes before ignition attempt','Flame-out shutdown time: maximum 2–4 seconds from NFPA 86','Pilot flame proving via UV scanner before main fuel open','SIL 2 typically required for main fuel safety shutoff valves','Cross-limiting: air leads fuel on increase, air lags fuel on decrease'], formula:'SIL 2: PFDavg 10⁻³ to 10⁻² (Risk Reduction Factor 100–1000)' },

  { id:'T13', category:'Glass Manufacturing', title:'Annealing Lehr Control Systems', standard:'ASTM C336 · EN 12150', tag:'Glass', summary:'Annealing Lehrs cool glass ribbon from the annealing point (~550°C) to below the strain point (~510°C) in a controlled profile to eliminate residual stress. PID-controlled zones with thermocouples (Type K or N) and variable-speed drives control cooling air/heating elements to maintain the profile. Glass breakage often results from excessive cooling rate below the strain point.',
    keyPoints:['Annealing point: viscosity log η = 13 (ASTM C336), typically 550–570°C for soda-lime','Strain point: log η = 14.5, typically 510–525°C — no rapid cooling below this','Controlled cooling rate: ~3–5°C/min for 6mm glass below strain point','Zone temperature control accuracy: ±2°C for float glass quality','Ribbon tracking and edge detection used for width measurement'], formula:'Cooling time ∝ thickness²  |  Max rate ≈ 3/t °C/min (t in mm)' },

  { id:'T14', category:'Glass Manufacturing', title:'Tin Bath Atmosphere Control', standard:'NFPA 2 · IEC 60079 · PPG Process', tag:'Glass', summary:'The tin bath in float glass production requires a reducing H₂/N₂ atmosphere to prevent SnO₂ formation which causes defects. H₂ concentration is typically 5–15% with O₂ maintained below 5 ppm. Atmosphere analysers (paramagnetic O₂, thermal conductivity H₂) continuously monitor. ATEX/IECEx equipment required throughout the tin bath area.',
    keyPoints:['H₂ LEL = 4%, UEL = 75% — zone classification required throughout','O₂ target < 5 ppm at high-temperature zones (>600°C)','Gas purge sequence: N₂ purge → H₂ introduction → stable atmosphere → glass introduction','Tin quality: ≥99.9% pure Sn, monitor for SnO accumulation (dross)','SIL 2 for H₂ supply shutoff on atmosphere fault or fire/gas alarm'], formula:'SnO₂ formation occurs when O₂ > ~10 ppm at T > 600°C' },

  { id:'T15', category:'SIS/Safety', title:'Safety Instrumented Systems (IEC 61511)', standard:'IEC 61511 · IEC 61508 · ISA-84', tag:'SIS', summary:'A Safety Instrumented System (SIS) brings a process to a safe state when predetermined conditions are violated. The SIS is independent of the Basic Process Control System (BPCS). SIL (Safety Integrity Level) is assigned based on risk reduction required. SIL 1 = PFDavg 0.1–0.01, SIL 2 = 0.01–0.001, SIL 3 = 0.001–0.0001.',
    keyPoints:['Safety Instrumented Function (SIF) = sensor + logic solver + final element','Proof test interval determines PFDavg — more frequent = lower PFD','Architecture: 1oo1, 1oo2, 2oo3 voting — redundancy reduces spurious trips','BPCS and SIS must be independent (separate sensors, controllers)','SIL verification: FMEA, RBD or Markov analysis per IEC 61508'], formula:'PFDavg = λDU × TI / 2  (1oo1 non-repairable, λDU = dangerous undetected FR)' },

  { id:'T16', category:'PLC/SCADA', title:'PLC Fundamentals & IEC 61131-3', standard:'IEC 61131-3 · IEC 61131-9', tag:'PLC', summary:'PLCs execute scan cycles: Read Inputs → Execute Program → Write Outputs → Repeat. IEC 61131-3 defines 5 programming languages: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), Sequential Function Chart (SFC). Typical I/O types: DI, DO, AI (4-20mA), AO, RTD, TC, High-Speed Counter, Serial.',
    keyPoints:['Scan time: typically 5–20ms for standard PLC, 1ms for safety PLC','AI resolution: 12-bit (0-4095), 16-bit (0-65535), 14-bit (0-16383)','Modbus TCP/RTU: most common fieldbus for legacy integration','OPC-UA: standard protocol for SCADA/MES data exchange (IEC 62541)','Safety PLC (SIL-capable): TÜV-certified, redundant CPUs, diverse firmware'], formula:'AI_EU = LRV + (Raw / Max_Count) × (URV - LRV)' },

  { id:'T17', category:'Troubleshooting', title:'Instrument Troubleshooting Guide', standard:'ISA-TR18.2 · NAMUR NE107', tag:'Troubleshoot', summary:'Systematic troubleshooting: 1. Verify alarm is real (not instrument fault). 2. Check signal (mA, display). 3. Check power supply. 4. Check impulse lines/connections. 5. Check process. NAMUR NE107 defines 4 device status signals: Failure, Maintenance Required, Out of Specification, Function Check.',
    keyPoints:['No signal (4mA fixed): check power, cable continuity, transmitter power terminals','High/low signal stuck: check impulse line blockage, freeze, sediment','4-20mA drifting: check grounding, EMI, temperature effects on transmitter','HART comm fault: check load resistance ≥250Ω, check master/slave config','Valve hunting: check positioner tuning, mechanical friction, air supply stability'], formula:'Signal check: V_loop = V_supply − I × R_loop (V for transmitter ≥10.5V)' },

  { id:'T18', category:'Troubleshooting', title:'Control Valve Troubleshooting', standard:'ISA-75.13 · ISA-75.25 · FCI 70-2', tag:'Valve', summary:'Common control valve problems: valve does not move (no air, positioner fault, seized stem), valve does not reach setpoint (too small Cv or over-ranged), valve hunts (positioner gain too high, sticky packing), excessive noise (cavitation or flashing for liquid, sonic for gas). Smart positioners with HART diagnostics provide step-response, signature, and friction data.',
    keyPoints:['Dead band: typical smart positioner ≤0.1%, pneumatic positioner ≤1%','Valve leakage class: ANSI/FCI 70-2 Class I to VI (VI = tightest, ≤0.0005% of Cv)','Air-to-open (ATO) = Direct Acting body, Fail Closed (FC)','Air-to-close (ATC) = Reverse Acting body, Fail Open (FO)','Stroke time: consider process response — slow for surge control, fast for ESD'], formula:'Cv_actual = Q × √(SG/ΔP) / N₁  (compare to nameplate Cv)' },
];

const CATEGORIES = [...new Set(TOPICS.map(t => t.category))];
const TAG_COLORS: Record<string,string> = {
  Pressure:'#0891B2', Temp:'#F97316', Flow:'#059669', Level:'#14B8A6',
  Valve:'#8B5CF6', PID:'#6366F1', Signal:'#0EA5E9', ATEX:'#DC2626',
  Symbols:'#64748B', Cal:'#D97706', Glass:'#EA580C', BMS:'#B91C1C',
  SIS:'#991B1B', PLC:'#1D4ED8', Troubleshoot:'#7C3AED',
};

export function ICStudy() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = TOPICS.filter(t =>
    (filter === 'All' || t.category === filter) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.summary.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownload = () => {
    const rows = TOPICS.map(t => [t.tag, t.title, t.standard]);
    const body = `<h2>Engineering Study Topics — Index</h2>${tableHTML(['Tag','Topic','Standard'], rows)}
<h2>Key Formulas Quick Reference</h2>
<table><thead><tr><th>Formula</th><th>Application</th></tr></thead><tbody>
${TOPICS.filter(t => t.formula).map(t => `<tr><td class="lbl">${t.formula}</td><td class="val">${t.title}</td></tr>`).join('')}
</tbody></table>`;
    downloadReport('I&C Engineering Reference Library','18 Topics · ISA · IEC 61511 · IEC 60584 · ISO 5167 · Glass Manufacturing','ISA-5.1 · IEC 60381 · IEC 60751 · IEC 60534 · IEC 61131 · IEC 61511', body, 'IC-Engineering-Study-Reference.pdf');
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={BookOpen} title="ENGINEERING REFERENCE LIBRARY" subtitle="ISA · IEC · ISO · Glass Manufacturing · PID · Calibration · Safety · Troubleshooting" accentColor={ACCENT} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Search topics…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 14px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(topic => {
          const isExp = expanded === topic.id;
          const tagColor = TAG_COLORS[topic.tag] ?? ACCENT;
          return (
            <div key={topic.id} style={{ background: V.bg, border: `1.5px solid ${isExp ? ACCENT : V.brd}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
              <button onClick={() => setExpanded(isExp ? null : topic.id)}
                style={{ width: '100%', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: tagColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${tagColor}44` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: tagColor }}>{topic.tag.slice(0,3)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>{topic.title}</span>
                    <span style={{ fontSize: 10, color: tagColor, background: tagColor+'22', borderRadius: 5, padding: '1px 6px', border: `1px solid ${tagColor}44`, fontWeight: 700, flexShrink: 0 }}>{topic.tag}</span>
                  </div>
                  <div style={{ fontSize: 12, color: V.muted }}>{topic.category} · {topic.standard}</div>
                </div>
                {isExp ? <ChevronDown style={{ width: 16, height: 16, color: V.muted, flexShrink: 0 }} /> : <ChevronRight style={{ width: 16, height: 16, color: V.muted, flexShrink: 0 }} />}
              </button>

              {isExp && (
                <div style={{ padding: '0 18px 18px 66px', borderTop: `1px solid ${V.brdM}` }}>
                  <p style={{ fontSize: 13, color: V.sec, lineHeight: 1.7, marginTop: 14, marginBottom: 14 }}>{topic.summary}</p>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 8 }}>KEY POINTS</div>
                    {topic.keyPoints.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: tagColor, marginTop: 6, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: V.sec, lineHeight: 1.5 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                  {topic.formula && (
                    <div style={{ padding: '10px 14px', background: tagColor + '15', borderRadius: 8, border: `1px solid ${tagColor}33` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>KEY FORMULA</div>
                      <div style={{ fontFamily: V.mono, fontSize: 13, color: tagColor, lineHeight: 1.7 }}>{topic.formula}</div>
                    </div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 11, color: V.muted }}>Standard: {topic.standard}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: V.muted }}>No topics match your search.</div>
      )}
    </div>
  );
}
