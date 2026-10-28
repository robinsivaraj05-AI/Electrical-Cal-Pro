import React, { useState } from 'react';
import { Shield, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#0891B2';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

interface ProtFunction {
  ansi: string; name: string; purpose: string; principle: string;
  typicalSetting: string; curve: string; testProcedure: string;
  standard: string; application: string; color: string;
}

const PROT_FUNCTIONS: ProtFunction[] = [
  { ansi:'50',  name:'Instantaneous Overcurrent',            color:'#DC2626',
    purpose:'Fast-clear close-in faults before thermal damage. Selectivity by current discrimination.',
    principle:'Compares measured current against fixed pickup threshold. Trips with no intentional delay (< 50 ms CB time).',
    typicalSetting:'Set above max load and motor inrush; typically 8–12× FLC for motor feeders, 5–8× for feeders.',
    curve:'Definite time (instantaneous)',
    testProcedure:'Inject secondary current above pickup. Verify trip < 50 ms. Check reset. Verify no operation below 0.95× pickup.',
    standard:'IEC 60255-151', application:'All HV feeders, transformers, motors, busbars' },
  { ansi:'51',  name:'Time-Overcurrent (IDMT)',               color:'#EA580C',
    purpose:'Time-selective clearance of overloads and phase faults. Graded with upstream/downstream devices.',
    principle:'IDMT (Inverse Definite Minimum Time): t = TMS × k / (M^α − 1). Trip time inversely proportional to fault magnitude.',
    typicalSetting:'PS = 1.05–1.3 × FLC. TMS set to achieve CTI of 0.3–0.4 s above downstream. Use SI/VI/EI/LTI curves.',
    curve:'Standard Inverse (SI), Very Inverse (VI), Extremely Inverse (EI), Long Time Inverse (LTI)',
    testProcedure:'Secondary injection at 2×, 5×, 10× PS. Measure trip time. Compare with characteristic. Timing tolerance ±5%.',
    standard:'IEC 60255-151 / IEEE C37.112', application:'Feeders, transformers, incomers, bus couplers' },
  { ansi:'50N', name:'Instantaneous Earth Fault',             color:'#7C3AED',
    purpose:'Fast clearance of earth faults. Sensitive to earth faults which may not operate phase 51.',
    principle:'Residual current or zero-sequence current scheme. Trips when zero-sequence current exceeds pickup.',
    typicalSetting:'PS: 10–20% of CT rating. For high-resistance earthed systems: 5–10% of earth fault current. No delay.',
    curve:'Instantaneous / Definite time',
    testProcedure:'Inject zero-sequence current into all three CTs simultaneously. Verify pickup and trip time.',
    standard:'IEC 60255-151', application:'All solidly earthed and low-resistance earthed HV systems' },
  { ansi:'51N', name:'IDMT Earth Fault',                      color:'#6D28D9',
    purpose:'Time-graded earth fault protection with inverse characteristic for coordination.',
    principle:'Same as 51 but uses residual or core-balance CT. Provides backup to 50N.',
    typicalSetting:'PS: 10–40% of CT rating. TMS lower than 51 to trip faster for earth faults.',
    curve:'SI or VI typically',
    testProcedure:'Same as 51 but using residual connection. Check polarity — ensure R+Y+B secondary currents sum to zero at balance.',
    standard:'IEC 60255-151', application:'All earthed systems, especially HV/LV transformer secondaries' },
  { ansi:'67',  name:'Directional Overcurrent',               color:'#0369A1',
    purpose:'Selectively operate only for faults in protected direction. Used in ring main, parallel feeders, or grid-connected systems.',
    principle:'Compares current magnitude and phase angle relative to voltage reference. Trips only if fault power flows in defined direction.',
    typicalSetting:'Same as 51 for current. Maximum torque angle (MTA): typically 30–45° for Phase, 0° for Earth fault direction.',
    curve:'IDMT as per 51',
    testProcedure:'Apply voltage (polarising quantity) and inject current. Test for forward and reverse faults. Verify directionality — should NOT trip for reverse fault.',
    standard:'IEC 60255-160', application:'Ring mains, interconnected busbars, grid-connected feeders, parallel transformers' },
  { ansi:'67N', name:'Directional Earth Fault',               color:'#0891B2',
    purpose:'Earth fault protection with directional control in meshed or ring systems.',
    principle:'Uses zero-sequence or negative-sequence voltage as polarising reference. Detects earth faults in one direction only.',
    typicalSetting:'PS: 5–20% of CT rating. MTA: 0° for resistive earthed, 90° for solidly earthed (for lagging characteristic).',
    curve:'IDMT or definite time',
    testProcedure:'Apply zero-sequence voltage polarising and residual current. Verify tripping in forward direction, blocking in reverse.',
    standard:'IEC 60255-160', application:'Petersen coil earthed, solidly earthed ring systems, cable distribution networks' },
  { ansi:'27',  name:'Undervoltage',                          color:'#D97706',
    purpose:'Protect equipment against low voltage. Initiate load shedding on significant voltage depression.',
    principle:'Compares positive-sequence or phase voltage against set pickup. Trips after time delay.',
    typicalSetting:'Stage 1: 0.85 pu, 5 s. Stage 2: 0.75 pu, 1 s. Motor protection: 0.8 pu, 1–5 s.',
    curve:'Definite time (two stage)',
    testProcedure:'Gradually reduce applied PT voltage below pickup. Verify pickup and timing for each stage. Check reset at 0.90 pu.',
    standard:'IEC 60255-127', application:'Bus protection, motor feeders, generator buses, load shedding schemes' },
  { ansi:'59',  name:'Overvoltage',                           color:'#B45309',
    purpose:'Protect insulation against sustained overvoltage. Prevent resonance and ferroresonance effects.',
    principle:'Compares phase or positive-sequence voltage against pickup. Trips after time delay.',
    typicalSetting:'Stage 1: 1.10 pu, 10 s. Stage 2: 1.20 pu, 2 s. Generator: 1.05 pu, 0.5 s.',
    curve:'Definite time (two stage)',
    testProcedure:'Increase PT secondary voltage above pickup. Verify trip times. Check reset at 1.05 pu.',
    standard:'IEC 60255-127', application:'Generator protection, transformer protection, bus protection, capacitor banks' },
  { ansi:'81O', name:'Overfrequency',                         color:'#059669',
    purpose:'Detect system overfrequency (generator over-speed, load rejection). Initiate generator protection.',
    principle:'Measures fundamental frequency. Trips when frequency exceeds setting.',
    typicalSetting:'51.5 Hz, 1 s delay (50 Hz system). Adjustable per grid code.',
    curve:'Definite time',
    testProcedure:'Apply voltage at frequency above pickup. Verify trip. Confirm no trip below 0.95× pickup frequency.',
    standard:'IEC 60255-167', application:'Generators, embedded generation, grid-connected systems requiring frequency monitoring' },
  { ansi:'81U', name:'Underfrequency',                        color:'#0891B2',
    purpose:'Detect system underfrequency (generation deficit, overload). Initiate load shedding.',
    principle:'Measures fundamental frequency. Trips when frequency falls below setting.',
    typicalSetting:'Stage 1: 49.0 Hz, 0.3 s. Stage 2: 48.5 Hz, 0.2 s. Stage 3: 47.5 Hz, 0.1 s.',
    curve:'Definite time (multi-stage)',
    testProcedure:'Apply voltage at reduced frequency. Verify each stage trips at correct frequency and time.',
    standard:'IEC 60255-167', application:'Automatic Load Frequency Control (ALFC) and load shedding relays' },
  { ansi:'46',  name:'Negative Sequence Overcurrent',         color:'#7C3AED',
    purpose:'Detect unbalanced faults (phase-to-phase), open conductors, unbalanced loading causing motor heating.',
    principle:'Calculates negative-sequence component of three-phase currents. Trips when negative sequence exceeds pickup.',
    typicalSetting:'PS: 5–20% of CT rating. For motors: 0.1–0.2 pu. For generators: 0.1 pu.',
    curve:'Inverse time (thermal analogy for motor protection)',
    testProcedure:'Inject unbalanced three-phase currents to create negative sequence. Measure trip time vs characteristic.',
    standard:'IEC 60255-46', application:'Motor protection, generator protection, unbalanced fault detection' },
  { ansi:'49',  name:'Thermal Overload',                      color:'#EA580C',
    purpose:'Protect motors, transformers and cables against sustained thermal overload.',
    principle:'Mathematical thermal model: dθ/dt = I²R − (θ−θamb)/τ. Models heating and cooling. Trips when thermal level exceeds limit.',
    typicalSetting:'Service Factor: 1.0–1.15×. Thermal time constant: as per motor/transformer datasheet. Hot/cold ratio from manufacturer.',
    curve:'Thermal inverse',
    testProcedure:'Inject current at 1.15× rated. Verify thermal trip. Check cooling model with current removal. Verify thermal memory.',
    standard:'IEC 60255-149', application:'Motors, transformers, cables, generators — wherever thermal damage risk exists' },
  { ansi:'87',  name:'Current Differential (87T/87B)',        color:'#DC2626',
    purpose:'Unit protection scheme — high-speed, zone-selective, very sensitive. Primary protection for transformers and busbars.',
    principle:'Compares current entering and leaving the protected zone. Trip if differential current exceeds operate threshold accounting for restraint.',
    typicalSetting:'Operate setting: 0.2–0.3 pu. Slope 1: 20–30%. Slope 2: 60–80% (for high through-fault). Inrush restraint: 2nd harmonic 15–20%.',
    curve:'Percentage differential (bias characteristic)',
    testProcedure:'Inject currents to simulate internal fault (unbalanced). Verify operation. Simulate through-fault (balanced, high magnitude) — must NOT trip. Test inrush restraint.',
    standard:'IEC 60255-187', application:'Transformers (87T), generators (87G), busbars (87B), motors (87M), lines (87L)' },
  { ansi:'21',  name:'Distance (Impedance)',                  color:'#1D4ED8',
    purpose:'Primary protection for HV and EHV transmission lines. Fast, distance-measured protection.',
    principle:'Measures positive-sequence impedance Z=V/I. Trip if impedance falls within zone reach settings (Z1, Z2, Z3, Z4).',
    typicalSetting:'Z1 (instantaneous): 85% of line impedance. Z2 (time-delayed): 120% of line + 50% of shortest adjacent line. Z3: 120% of longest adjacent line.',
    curve:'Impedance circles/polygons (different for different manufacturers)',
    testProcedure:'Apply voltage and current to simulate impedance at various points. Verify zone boundaries and timing. Test characteristic shape.',
    standard:'IEC 60255-121', application:'Transmission and sub-transmission lines (132 kV and above, sometimes 33 kV)' },
  { ansi:'79',  name:'Auto-Recloser',                         color:'#059669',
    purpose:'Restore supply after transient faults on overhead lines without manual intervention.',
    principle:'After trip, opens and reclosing sequence follows: dead time (0.5–30 s), then close — if fault persists, trip and lock out.',
    typicalSetting:'Dead time: 0.5 s (first), 5 s (second), 15 s (third) for 3-shot recloser. Lock-out after 3 unsuccessful reclosures.',
    curve:'Fixed time (programmable sequence)',
    testProcedure:'Simulate trip-reclose-trip-lockout sequence. Verify dead times. Check lockout function. Verify inhibit functions (e.g., earthfault lockout).',
    standard:'IEC 62271-111', application:'Overhead line feeders, rural distribution, 11 kV overhead lines' },
  { ansi:'86',  name:'Lockout Relay',                         color:'#DC2626',
    purpose:'Lockout and trip signal latching. Requires manual reset after trip. Prevents automatic restart.',
    principle:'Electrically latching relay. Once energised, remains latched until deliberately reset. Sends simultaneous trip to all breakers and inhibit to close coils.',
    typicalSetting:'Instantaneous. No intentional delay. Configure for all protection functions requiring lockout.',
    curve:'Instantaneous',
    testProcedure:'Energise trip coil. Verify all associated breakers trip. Verify cannot close until 86 reset. Verify manual reset operation.',
    standard:'IEEE C37.90', application:'All HV installations requiring lockout: transformer faults, busbar faults, fire, gas alarms' },
  { ansi:'74TC', name:'Trip Circuit Supervision',             color:'#D97706',
    purpose:'Monitor integrity of trip circuit continuously. Alert before protection circuit failure causes non-operation.',
    principle:'Monitors continuity of trip coil circuit via low-level current. Alarm on circuit open or short. Does not consume trip coil energy.',
    typicalSetting:'Alarm: 5–15 s delay (to avoid nuisance on CB operation). Monitor CB open and closed positions separately.',
    curve:'Alarm only (no trip)',
    testProcedure:'Open trip circuit. Verify alarm within delay time. Close circuit — verify alarm reset. Test both open and closed CB positions.',
    standard:'IEC 60255', application:'All HV circuit breakers — critical for safety and protection reliability' },
  { ansi:'50BF', name:'Breaker Failure',                      color:'#DC2626',
    purpose:'Initiate backup trip to adjacent breakers if primary breaker fails to operate.',
    principle:'Timer starts on trip signal. If fault current still flows after set time (typically 200–300 ms), trip adjacent breakers.',
    typicalSetting:'BF timer: 0.1–0.2 s (relay + CB trip time + margin). Current check: 10–20% of rated to confirm CB has opened.',
    curve:'Definite time',
    testProcedure:'Apply fault current. Send trip command. After BF delay, verify adjacent CB trip commands are issued. Verify reset when current drops.',
    standard:'IEC 60255 / IEEE C37.119', application:'All HV circuit breakers where backup clearance of busbar or transformer is required' },
  { ansi:'32',  name:'Directional Power',                     color:'#0891B2',
    purpose:'Detect reverse power flow (motoring in generator, back-feeding from grid). Anti-islanding.',
    principle:'Measures three-phase power P=3×V×I×cosθ. Trips when power flows in reverse direction beyond setting.',
    typicalSetting:'-2 to -5% of rated MW for generator anti-motoring. Delay 1–10 s.',
    curve:'Definite time',
    testProcedure:'Apply voltage and inject current with leading phase angle (reverse power). Verify trip. Test with lagging (forward) — must not trip.',
    standard:'IEC 60255-160', application:'Generators (anti-motoring), embedded generation (anti-islanding), parallel feeders' },
  { ansi:'40',  name:'Loss of Field (Under-Excitation)',      color:'#7C3AED',
    purpose:'Protect synchronous generator against loss of excitation which causes asynchronous operation.',
    principle:'Measures generator impedance. During loss of field, generator absorbs reactive power — impedance locus enters underexcited region.',
    typicalSetting:'Zone 1 (definite): offset = -0.1 pu, diameter = 1.0 pu. Zone 2 (IDMT) with longer delay.',
    curve:'Impedance-based (mho characteristic)',
    testProcedure:'Simulate loss of field by reducing excitation voltage while generator on load. Verify impedance moves into relay characteristic and trip occurs.',
    standard:'IEEE C37.102', application:'Synchronous generators exclusively' },
  { ansi:'24',  name:'Volts/Hz (Overexcitation)',             color:'#B45309',
    purpose:'Protect transformer and generator core from saturation due to overvoltage or underfrequency.',
    principle:'V/Hz ratio directly proportional to core flux. Measures V/Hz — trips on inverse time when exceeds threshold.',
    typicalSetting:'Pickup: 1.05 pu V/Hz. Alarm: 1.08 pu. Trip: 1.10 pu with inverse time characteristic.',
    curve:'Inverse time (V/Hz characteristic)',
    testProcedure:'Apply high voltage at reduced frequency. Verify V/Hz calculation and trip according to characteristic.',
    standard:'IEC 60255-127 / IEEE C37.102', application:'Generator step-up transformers, generator terminals, power transformers' },
  { ansi:'25',  name:'Synchronism Check',                     color:'#059669',
    purpose:'Prevent closing a circuit breaker when systems are out of synchronism. Prevent large mechanical torque transients.',
    principle:'Measures angle, frequency difference and voltage difference across open CB. Permits close only within limits.',
    typicalSetting:'Max angle: 25–35°. Max frequency diff: 0.1–0.2 Hz. Max voltage diff: 5–10%.',
    curve:'Window (permissive only)',
    testProcedure:'Apply two voltage sources with varying phase angle and frequency difference. Verify close permit only within window. Verify block outside window.',
    standard:'IEC 60255 / IEEE C37.102', application:'Generator circuit breakers, bus ties, sectionalising points, grid connections' },
  { ansi:'64REF', name:'Restricted Earth Fault',              color:'#7C3AED',
    purpose:'Sensitive earth fault protection for transformer windings. Detects earth faults down to 5% of winding.',
    principle:'High-impedance scheme comparing sum of phase CTs with neutral CT. Very sensitive, inherently stable against through-faults.',
    typicalSetting:'Pickup: typically 20–40 V on relay element. Metrosil surge protection required on secondary.',
    curve:'Instantaneous or definite time',
    testProcedure:'Short-circuit secondary neutral CT while applying current to one phase. Verify relay operates. Simulate through-fault (balanced) — must NOT operate.',
    standard:'IEC 60255-187-3', application:'Transformer windings (delta and star), generator stator windings' },
  { ansi:'87T', name:'Transformer Differential',              color:'#DC2626',
    purpose:'Unit protection for power transformers. Primary protection — trips both HV and LV breakers.',
    principle:'Compares CTs on primary and secondary. Compensates for vector group, tap ratio and load. Detects internal faults.',
    typicalSetting:'Operate: 0.2 pu. Bias slope 1: 25%. Bias slope 2: 80% (for through-fault stability). 2nd harmonic inrush: 15%.',
    curve:'Percentage differential (bias characteristic)',
    testProcedure:'Test internal fault simulation (inject unbalanced). Through-fault stability test (balanced, 5–10× rated). Inrush test (2nd harmonic content applied). Vector group compensation test.',
    standard:'IEC 60255-187-2', application:'All power transformers — essential for transformers above 5 MVA' },
  { ansi:'87B', name:'Busbar Differential',                   color:'#B91C1C',
    purpose:'Fast unit protection for HV busbars. Clears busbar faults in < 20 ms avoiding extensive switchgear damage.',
    principle:'Compares sum of all currents flowing into busbar zone. Detects difference (internal fault) vs through-fault (balanced).',
    typicalSetting:'Operate: 0.2 pu differential. Check zone: 0.1 pu. Saturation detection algorithm enabled.',
    curve:'High-impedance or low-impedance biased differential',
    testProcedure:'Inject currents to simulate busbar fault. Verify ALL connected breakers receive trip. Through-fault test — one feeder in, one out with equal magnitude — must NOT trip.',
    standard:'IEC 60255-187-1', application:'All HV busbars (11 kV and above) in primary substations, power stations' },
];

export function HVProtection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = PROT_FUNCTIONS.filter((p) =>
    !search || p.ansi.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.application.toLowerCase().includes(search.toLowerCase())
  );

  const selFn = PROT_FUNCTIONS.find((p) => p.ansi === selected) ?? null;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Shield} title="PROTECTION SYSTEM MODULE" subtitle="IEC 60255 · IEEE C37 Series · ANSI Device Numbers · Commissioning & Testing Guide" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => {
          const rows = PROT_FUNCTIONS.map((p) => [p.ansi, p.name, p.principle, p.typicalSetting, p.standard]);
          const detail = PROT_FUNCTIONS.map((p) => [p.ansi, p.name, p.purpose, p.testProcedure]);
          const body = `<h2>Protection Functions — Settings Summary</h2>${tableHTML(['ANSI','Function','Action','Typical Setting','Standard'], rows)}<h2>Purpose & Test Methods</h2>${tableHTML(['ANSI','Function','Purpose','Test Procedure'], detail)}`;
          downloadReport('11kV HV Protection System Report','25 Protection Functions — ANSI Device Numbers · Settings · Test Methods','IEC 60255 · IEEE C37.102 · IEC 62271-100 · NFPA 70B', body, 'HV-Protection-System.pdf');
        }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Protection Report
        </button>
      </div>

      {/* Search */}
      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by ANSI number, function name or application…"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 20, padding: '11px 16px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10, fontSize: 14, color: V.txt, outline: 'none' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: selFn ? '300px 1fr' : '1fr', gap: 16 }}>
        {/* Function List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((p) => (
            <button key={p.ansi} onClick={() => setSelected(selected === p.ansi ? null : p.ansi)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textAlign: 'left',
                background: selected === p.ansi ? `${p.color}18` : V.bg,
                border: `1.5px solid ${selected === p.ansi ? p.color : V.brd}`,
                borderRadius: 10, cursor: 'pointer',
              }}>
              <span style={{ fontFamily: V.mono, fontSize: 14, fontWeight: 900, color: p.color, minWidth: 44 }}>{p.ansi}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: V.txt, flex: 1 }}>{p.name}</span>
              {selected === p.ansi ? <ChevronDown style={{ width: 13, height: 13, color: V.muted }} /> : <ChevronRight style={{ width: 13, height: 13, color: V.muted }} />}
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        {selFn && (
          <div style={{ background: V.bg, border: `2px solid ${selFn.color}40`, borderRadius: 14, overflow: 'hidden', borderLeft: `5px solid ${selFn.color}` }}>
            {/* Header */}
            <div style={{ padding: '18px 20px', background: `${selFn.color}14`, borderBottom: `1px solid ${V.brdM}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: V.mono, fontSize: 22, fontWeight: 900, color: selFn.color }}>ANSI {selFn.ansi}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: V.txt }}>{selFn.name}</span>
              </div>
              <div style={{ fontSize: 12, color: V.muted }}>{selFn.standard}</div>
            </div>
            {/* Content */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Purpose',            value: selFn.purpose },
                { label: 'Operating Principle', value: selFn.principle },
                { label: 'Typical Setting',     value: selFn.typicalSetting },
                { label: 'Characteristic',      value: selFn.curve },
                { label: 'Test Procedure',      value: selFn.testProcedure },
                { label: 'Application',         value: selFn.application },
                { label: 'Standard Reference',  value: selFn.standard },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: selFn.color, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 13, color: V.sec, lineHeight: 1.65, padding: '10px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* IDMT Curve Quick Reference */}
      <div style={{ marginTop: 28, background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 700, color: V.sec, letterSpacing: '0.06em', textTransform: 'uppercase' }}>IDMT Curve Equations — IEC 60255-151</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: V.surf }}>
            {['Curve','ANSI','k constant','α exponent','Formula','Typical Use'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: V.lbl }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              ['Standard Inverse (SI)',  '51/67', '0.14',  '0.02', 't = TMS × 0.14 / (M^0.02 − 1)', 'General feeders, most common setting'],
              ['Very Inverse (VI)',      '51/67', '13.5',  '1.0',  't = TMS × 13.5 / (M − 1)',      'Feeders where fast operation at high multiples required'],
              ['Extremely Inverse (EI)', '51/67', '80',    '2.0',  't = TMS × 80 / (M² − 1)',       'Transformer protection, fuse coordination'],
              ['Long Time Inverse (LTI)','51/67', '120',   '1.0',  't = TMS × 120 / (M − 1)',       'Cable overload protection, thermal protection'],
              ['Mod. Inverse (IEEE MI)', '51',    '0.0515','0.02', 't = TMS × (0.0515/(M^0.02−1)+0.114)', 'IEEE C37.112 — North American standard'],
              ['Definite Time (DT)',     '50',    '—',     '—',    't = TDS (fixed time)',            'Instantaneous or fixed-delay stage; bus, transformer'],
            ].map(([curve, ansi, k, a, formula, use]) => (
              <tr key={curve as string} style={{ borderTop: `1px solid ${V.brdM}` }}>
                <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: V.txt }}>{curve}</td>
                <td style={{ padding: '9px 14px', fontFamily: V.mono, fontSize: 12, color: ACCENT }}>{ansi}</td>
                <td style={{ padding: '9px 14px', fontFamily: V.mono, fontSize: 12, color: V.sec }}>{k}</td>
                <td style={{ padding: '9px 14px', fontFamily: V.mono, fontSize: 12, color: V.sec }}>{a}</td>
                <td style={{ padding: '9px 14px', fontFamily: V.mono, fontSize: 11, color: '#60A5FA', background: V.surf }}>{formula}</td>
                <td style={{ padding: '9px 14px', fontSize: 11, color: V.muted }}>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', background: V.surf, fontSize: 11, color: V.muted, borderTop: `1px solid ${V.brdM}` }}>
          M = Fault current / Pickup current (plug setting multiplier). TMS = Time Multiplier Setting (0.025–1.0). Timing tolerance: ±5% or ±0.04 s, whichever is greater (IEC 60255-151 Table 2).
        </div>
      </div>
    </div>
  );
}
