import React, { useState } from 'react';
import { Shield, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface ProtFunc {
  ansi: string; name: string; action: 'Trip' | 'Alarm' | 'Trip+Alarm';
  typicalSetting: string; tripDelay: string; purpose: string; testMethod: string; standard: string;
}

const PROT_FUNCS: ProtFunc[] = [
  { ansi: '59', name: 'Over Voltage',            action: 'Trip+Alarm', typicalSetting: '110% rated voltage', tripDelay: '5–10 s (alarm 2s)',  purpose: 'Protects alternator winding and loads from excessive voltage. Caused by AVR failure or sudden load rejection.', testMethod: 'Increase reference voltage or inject test voltage via secondary injection. Verify alarm then trip sequence.', standard: 'IEC 60255-127' },
  { ansi: '27', name: 'Under Voltage',           action: 'Trip+Alarm', typicalSetting: '90% rated voltage',  tripDelay: '5–10 s (alarm 3s)',  purpose: 'Detects low voltage due to overload, short circuit, or AVR failure. Prevents motor stall torque damage.', testMethod: 'Reduce reference voltage via AVR setpoint or inject reduced voltage. Verify operating sequence.', standard: 'IEC 60255-127' },
  { ansi: '81O', name: 'Over Frequency',         action: 'Trip+Alarm', typicalSetting: '102% of rated Hz',   tripDelay: '3–5 s (alarm 1s)',   purpose: 'Governor failure or load rejection causes overspeed which produces over frequency. Must trip before overspeed relay.', testMethod: 'Apply simulated frequency above setting using relay test set.', standard: 'IEC 60255-181' },
  { ansi: '81U', name: 'Under Frequency',        action: 'Trip+Alarm', typicalSetting: '97% of rated Hz',    tripDelay: '5–10 s (alarm 2s)',  purpose: 'Overload or governor failure produces under frequency. Progressive load shedding should be triggered first.', testMethod: 'Apply simulated frequency below setting via relay test set.', standard: 'IEC 60255-181' },
  { ansi: '32', name: 'Reverse Power',           action: 'Trip',       typicalSetting: '5–10% rated kW (motoring)', tripDelay: '2–5 s',      purpose: 'Prevents alternator from motoring when generator breaker is closed during paralleling or after prime mover failure.', testMethod: 'Inject signals representing reverse active power direction via secondary injection.', standard: 'IEC 60255-140' },
  { ansi: '51N', name: 'Earth Fault (TOC)',       action: 'Trip+Alarm', typicalSetting: 'PS = 5–10% rated I, TMS per grading', tripDelay: 'IDMT', purpose: 'Detects phase-to-earth insulation failures in alternator winding or cables. Most common DG fault.', testMethod: 'Secondary injection to neutral CT (residual or dedicated CT). Verify IDMT characteristic.', standard: 'IEC 60255-151' },
  { ansi: '51', name: 'Over Current (TOC)',       action: 'Trip+Alarm', typicalSetting: 'PS = 110% FLC, TMS co-ordinated', tripDelay: 'IDMT',  purpose: 'Graded backup protection for downstream faults. Also protects alternator from sustained overload.', testMethod: 'Inject current multiples at 1.5×, 2×, 5× pickup. Verify operating time against IDMT curve.', standard: 'IEC 60255-151' },
  { ansi: '50', name: 'Instantaneous OC',        action: 'Trip',       typicalSetting: '200–500% rated current', tripDelay: '< 100 ms',       purpose: 'High speed clearing of bus faults and close-in cable faults.', testMethod: 'Inject high current (above threshold). Measure trip time.', standard: 'IEC 60255-151' },
  { ansi: '46', name: 'Phase Unbalance (NPS)',   action: 'Alarm/Trip', typicalSetting: '10–15% negative sequence', tripDelay: '5–30 s',       purpose: 'Unbalanced loading produces negative phase sequence current which causes 2× frequency rotor heating.', testMethod: 'Inject negative sequence current component via relay test set.', standard: 'IEC 60034-26' },
  { ansi: '49', name: 'Alternator Over Temp',    action: 'Alarm/Trip', typicalSetting: 'Per RTD/PTC class (Class H: 165°C)', tripDelay: 'Direct', purpose: 'Winding temperature directly measured by embedded sensors. Prevents insulation thermal degradation.', testMethod: 'Simulate RTD resistance corresponding to alarm and trip temperature values.', standard: 'IEC 60034-1' },
  { ansi: '87G', name: 'Generator Differential', action: 'Trip',       typicalSetting: '20% bias, 5–10% sensitive element', tripDelay: '< 40 ms', purpose: 'Compares currents at both ends of stator winding. Detects internal winding faults with high speed and sensitivity.', testMethod: 'Inject differential current above setting while maintaining bias balance.', standard: 'IEC 60255-187' },
  { ansi: '40', name: 'Loss of Excitation',      action: 'Alarm/Trip', typicalSetting: 'Impedance (Mho) char, per OEM', tripDelay: 'Stage 1 alarm, Stage 2 trip', purpose: 'AVR failure causes loss of field. Machine absorbs reactive power as induction generator and can damage rotor.', testMethod: 'Simulate loss of excitation by reducing excitation while running at rated load.', standard: 'IEEE C37.102' },
  { ansi: '47', name: 'Phase Failure / Sequence', action: 'Trip',       typicalSetting: 'Phase presence < 50%, Wrong sequence', tripDelay: '< 1 s',  purpose: 'Phase failure causes single phasing. Wrong phase sequence damages motors and three-phase loads.', testMethod: 'Remove one phase from measurement circuit. Verify phase sequence by reversing two wires.', standard: 'IEC 60255-127' },
  { ansi: '12', name: 'Over Speed',              action: 'Trip',       typicalSetting: '110% rated RPM (1650 rpm at 50 Hz)', tripDelay: '< 0.2 s',  purpose: 'Engine governor failure can cause uncontrolled acceleration. Mechanical or electronic overspeed switch.', testMethod: 'Engine overspeed test with fuel rack — carefully bring to 110% speed and verify shutdown.', standard: 'ISO 8528-5' },
  { ansi: 'LOP', name: 'Low Oil Pressure',       action: 'Alarm/Shutdown', typicalSetting: 'Alarm 2.0 bar, Shutdown 1.5 bar', tripDelay: 'Alarm 5s, Shutdown 2s', purpose: 'Oil pump failure, low oil level, or oil gallery blockage. Engine must shut down immediately to prevent seizure.', testMethod: 'Simulate low oil pressure via pressure transducer or pressure switch bypass.', standard: 'OEM / NFPA 110' },
  { ansi: 'HCT', name: 'High Coolant Temp',      action: 'Alarm/Shutdown', typicalSetting: 'Alarm 95°C, Shutdown 100°C',  tripDelay: 'Alarm 5s, Shutdown 2s', purpose: 'Thermostat failure, blocked radiator, or coolant loss. Immediate shutdown prevents head gasket or liner damage.', testMethod: 'Simulate thermocouple or resistance sensor reading at alarm and shutdown values.', standard: 'OEM / NFPA 110' },
  { ansi: 'LF', name: 'Low Fuel Level',          action: 'Alarm',      typicalSetting: 'Alarm 25%, Critical 10%',          tripDelay: '10 s (alarm)',  purpose: 'Warns operator to arrange fuel delivery before generator is forced to stop due to fuel starvation.', testMethod: 'Check float switch or transducer at 25% tank level — verify alarm on controller.', standard: 'NFPA 110' },
  { ansi: 'BCF', name: 'Battery Charger Failure', action: 'Alarm',     typicalSetting: 'Charger output < 26.5 V (24V sys)', tripDelay: '30 s',         purpose: 'Uncharged battery will prevent engine starting on demand. NFPA 110 requires continuous monitoring.', testMethod: 'Disconnect charger and verify alarm. Check alarm persists for 30 s delay.', standard: 'NFPA 110' },
  { ansi: '86ES', name: 'Emergency Stop',         action: 'Trip',       typicalSetting: 'Hardwired — normally open',        tripDelay: 'Immediate',     purpose: 'Manual emergency shutdown. Hardwired to engine shutdown solenoid independent of controller.', testMethod: 'Press E-stop button — verify immediate engine shutdown and CB trip.', standard: 'ISO 8528-6 / NFPA 110' },
  { ansi: 'AVR', name: 'AVR Failure',            action: 'Alarm/Trip', typicalSetting: 'Voltage deviation > ±15% for > 10 s', tripDelay: '10 s',        purpose: 'AVR malfunction causes uncontrolled voltage. Protection prevents over-voltage damage to loads.', testMethod: 'Remove AVR reference signal — verify voltage protection responds.', standard: 'ISO 8528-3 / OEM' },
  { ansi: '25', name: 'Synchro-Check (Parallel)', action: 'Permissive', typicalSetting: 'ΔV < 2%, ΔF < 0.2 Hz, Δφ < 10°', tripDelay: 'Close permissive', purpose: 'Prevents paralleling on wrong phase angle (circulating currents, mechanical shock to shaft coupling).', testMethod: 'Apply two voltage sources with varying phase angle. Verify close permission only within window.', standard: 'IEC 62271-100 / IEEE C37.118' },
];

export function DGProtection() {
  const [sel, setSel] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleDownload = () => {
    const rows = PROT_FUNCS.map(p => [p.ansi, p.name, p.action, p.typicalSetting, p.tripDelay, p.standard]);
    const detailRows = PROT_FUNCS.map(p => [p.ansi, p.name, p.purpose, p.testMethod]);
    const body = `
      <h2>Protection Function Settings Summary</h2>
      ${tableHTML(['ANSI','Function','Action','Typical Setting','Trip Delay','Standard'], rows)}
      <h2>Protection Function Details</h2>
      ${tableHTML(['ANSI','Function','Purpose','Test Method'], detailRows)}`;
    downloadReport('DG Protection System Report', '21 Protection Functions — ANSI Device Numbers · Settings & Test Methods', 'IEC 60255 · IEEE C37.102 · NFPA 110 · ISO 8528', body, 'DG-Protection-System.pdf');
  };

  const filtered = PROT_FUNCS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ansi.toLowerCase().includes(search.toLowerCase()) ||
    p.purpose.toLowerCase().includes(search.toLowerCase())
  );

  const selFunc = filtered.find(p => p.ansi === sel) ?? null;

  const ACTION_COLOR: Record<string, string> = {
    'Trip':       '#DC2626',
    'Alarm':      '#D97706',
    'Trip+Alarm': '#EA580C',
    'Alarm/Trip': '#D97706',
    'Alarm/Shutdown': '#DC2626',
    'Permissive': '#2563EB',
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Shield} title="DG PROTECTION SYSTEM" subtitle="21 Protection Functions · ANSI Device Numbers · Settings & Test Methods · IEC 60255" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Protection Report
        </button>
      </div>
      <input value={search} onChange={e => { setSearch(e.target.value); setSel(null); }}
        placeholder="Search by function name, ANSI number, or keyword…"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '10px 14px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10, fontSize: 13, color: V.txt, outline: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: selFunc ? '300px 1fr' : '1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {filtered.map((p) => {
            const ac = ACTION_COLOR[p.action] ?? ACCENT;
            return (
              <button key={p.ansi} onClick={() => setSel(sel === p.ansi ? null : p.ansi)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', textAlign: 'left', background: sel === p.ansi ? ACCENT + '15' : V.bg, border: `1.5px solid ${sel === p.ansi ? ACCENT : V.brd}`, borderRadius: 10, cursor: 'pointer' }}>
                <div style={{ minWidth: 36, padding: '3px 6px', background: ac + '20', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 800, color: ac, flexShrink: 0 }}>{p.ansi}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: V.muted }}>{p.typicalSetting}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: ac, background: ac + '15', padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>{p.action}</span>
                {sel === p.ansi ? <ChevronDown style={{ width: 12, height: 12, color: V.muted }} /> : <ChevronRight style={{ width: 12, height: 12, color: V.muted }} />}
              </button>
            );
          })}
        </div>

        {selFunc && (
          <div style={{ background: V.bg, border: `2px solid ${ACCENT}30`, borderRadius: 14, overflow: 'hidden', borderTop: `4px solid ${ACCENT}` }}>
            <div style={{ background: V.surf, padding: '14px 20px', borderBottom: `1px solid ${V.brdM}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: '5px 12px', background: ACCENT + '20', borderRadius: 8, fontSize: 15, fontWeight: 900, color: ACCENT }}>{selFunc.ansi}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: V.txt }}>{selFunc.name}</div>
                  <div style={{ fontSize: 11, color: V.muted }}>{selFunc.standard}</div>
                </div>
                <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: (ACTION_COLOR[selFunc.action] ?? ACCENT) + '20', color: ACTION_COLOR[selFunc.action] ?? ACCENT }}>{selFunc.action}</span>
              </div>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Purpose / Hazard Covered', body: selFunc.purpose, color: '#2563EB' },
                { label: 'Typical Setting', body: selFunc.typicalSetting, color: ACCENT },
                { label: 'Trip Delay', body: selFunc.tripDelay, color: '#D97706' },
                { label: 'Test Method', body: selFunc.testMethod, color: '#7C3AED' },
              ].map(({ label, body, color }) => (
                <div key={label} style={{ padding: '12px 14px', background: V.surf, borderRadius: 9, border: `1px solid ${V.brdM}`, borderLeft: `4px solid ${color}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 13, color: V.sec, lineHeight: 1.6 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: '10px 16px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}`, fontSize: 11, color: V.muted }}>
        Standards: IEC 60255-151 (Time Overcurrent) · IEC 60255-127 (Voltage) · IEC 60255-181 (Frequency) · IEC 60255-187 (Differential) · NFPA 110 (Emergency Power) · ISO 8528-5 (Performance) · IEEE C37.102 (Generator Protection Guide)
      </div>
    </div>
  );
}
