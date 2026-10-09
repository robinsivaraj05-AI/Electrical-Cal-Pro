import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface TestProc {
  id: string; name: string; category: string; duration: string;
  acceptance: string; equipment: string; standard: string;
  steps: string[];
}

const TESTS: TestProc[] = [
  {
    id: 'T01', name: 'No Load Run Test', category: 'Routine', duration: '30 minutes',
    acceptance: 'Voltage ±5%, Frequency ±0.5 Hz, No alarms, Coolant temp stable < 90°C',
    equipment: 'Multimeter, Power analyser, Temperature gun', standard: 'ISO 8528-5',
    steps: ['Ensure fuel, oil, coolant at correct levels — perform pre-start checks', 'Start engine and allow to warm up at no load (5 minutes minimum)', 'Record voltage (all three phases) — should be 415 ±21 V', 'Record frequency — should be 50 ±0.5 Hz', 'Monitor coolant temperature — should stabilise < 90°C', 'Monitor oil pressure — should be 3.5–5.5 bar', 'Listen for abnormal noises — no knock, rattle, or exhaust irregularity', 'Record all parameters at 10, 20, and 30 minutes', 'Stop engine after 30 minutes and record post-shutdown oil level'],
  },
  {
    id: 'T02', name: '25% Load Test', category: 'Performance', duration: '30 minutes',
    acceptance: 'Voltage ±5%, Frequency ±0.5 Hz, No alarms, Temperature stable',
    equipment: 'Resistive load bank (25% rating), Power analyser, Data logger', standard: 'ISO 8528-5 / NFPA 110',
    steps: ['Start engine and warm up for 5 minutes at no load', 'Apply 25% of rated load using load bank in single step', 'Record transient voltage dip — should recover within 3 seconds', 'Measure steady-state voltage and frequency at 25% load', 'Record fuel consumption rate (L/hr) and SFC', 'Allow to run for 30 minutes — record parameters every 5 minutes', 'Monitor exhaust colour — should be light grey at light load', 'Note: Prolonged operation below 30% load causes wet stacking in diesel engines'],
  },
  {
    id: 'T03', name: '50% Load Test', category: 'Performance', duration: '30 minutes',
    acceptance: 'Voltage ±5%, Frequency ±0.5 Hz, Power factor 0.8–0.9, Temp stable',
    equipment: 'Resistive/reactive load bank (50% rating), Power analyser', standard: 'ISO 8528-5',
    steps: ['Apply load in steps from 25% to 50% — monitor transients at each step', 'Record three-phase voltage, current, power factor, kW, kVAR, kVA at steady state', 'Record engine RPM, oil pressure, coolant temperature', 'Calculate SFC at 50% load', 'Run for 30 minutes recording data every 5 minutes', 'Verify governor response — frequency should return to ±0.5 Hz within 5 seconds after each load step'],
  },
  {
    id: 'T04', name: '75% Load Test', category: 'Performance', duration: '1 hour',
    acceptance: 'Voltage ±5%, Frequency ±0.5 Hz, Coolant < 90°C, Oil pressure > 3.5 bar',
    equipment: 'Load bank (75% rating), Power analyser, Data logger', standard: 'ISO 8528-5',
    steps: ['Apply rated load in steps: 25% → 50% → 75% with 5-minute hold at each', 'At 75% load: record all electrical and mechanical parameters', 'Thermal imaging scan of all connections and busbar', 'Record SFC — compare with OEM specification', 'Run for 1 hour recording data every 10 minutes', 'Verify stability — no hunting in voltage or frequency'],
  },
  {
    id: 'T05', name: '100% Full Load Test', category: 'Performance', duration: '2 hours minimum',
    acceptance: 'Voltage ±5%, Frequency ±0.5%, Coolant < 95°C, All parameters within limits for 2 hours',
    equipment: 'Full rating load bank, Data logger, Thermal camera, Portable analyser', standard: 'ISO 8528-5 / NFPA 110',
    steps: ['Apply load progressively to 100% rated kVA', 'Verify voltage at rated load: 415 V ±5% (394–436 V)', 'Verify frequency: 50 ±0.5 Hz steady state', 'Record SFC — should be OEM specified value at 100% load', 'Run for minimum 2 hours — record every 15 minutes', 'Thermal imaging at 1 hour and 2 hours — check for hot spots', 'Vibration measurement at bearings at rated load', 'Calculate efficiency: P_output / P_fuel_input × 100'],
  },
  {
    id: 'T06', name: '110% Overload Test', category: 'Performance', duration: '1 hour (rated), ISO 8528',
    acceptance: 'Must sustain 110% of rated kVA for 1 hour without trip — per ISO 8528-5',
    equipment: 'Load bank (110% capability), Data logger', standard: 'ISO 8528-5',
    steps: ['Apply 110% of rated kVA via load bank', 'Verify generator does not trip on overload protection (may need to temporarily raise OC relay threshold)', 'Monitor all parameters — note any degradation', 'Run for 1 hour', 'Verify all parameters return to normal after removing overload', 'Note: 110% test must be performed within 2 hours of 100% load test'],
  },
  {
    id: 'T07', name: 'Load Acceptance Test', category: 'Transient', duration: '15 minutes',
    acceptance: 'Voltage dip per ISO 8528-5 Class G2: transient < −15%, recovery within 3 sec; Freq dip < −10%, recovery < 5 sec',
    equipment: 'Load bank (100% step), High-speed power recorder', standard: 'ISO 8528-5',
    steps: ['With generator at no load and rated speed, apply 100% rated load in single step', 'Record transient voltage using high-speed recorder (minimum 10 kHz)', 'Measure maximum voltage dip and recovery time', 'Record transient frequency dip and recovery time', 'Repeat three times — report worst case result', 'Compare results with ISO 8528-5 Class G1/G2/G3 limits'],
  },
  {
    id: 'T08', name: 'Load Rejection Test', category: 'Transient', duration: '15 minutes',
    acceptance: 'Frequency overshoot < +10%, Voltage overshoot < +25%, Recovery within 5 seconds',
    equipment: 'Load bank (100% capability), High-speed recorder', standard: 'ISO 8528-5',
    steps: ['Apply 100% rated load to generator', 'Suddenly remove 100% load (open load breaker)', 'Record peak voltage overshoot and time to recovery', 'Record peak frequency overshoot and time to recovery', 'Verify no overvoltage trip occurred', 'Repeat three times — report worst case'],
  },
  {
    id: 'T09', name: 'Black Start Test', category: 'Emergency', duration: '15 minutes',
    acceptance: 'Engine starts and reaches rated voltage/frequency within 10 seconds (NFPA 110 Level 1) or 60 seconds (Level 2)',
    equipment: 'Stopwatch, Voltage recorder, Power analyser', standard: 'NFPA 110 / ISO 8528-5',
    steps: ['Confirm engine has not been running for minimum 4 hours (cold start test)', 'Initiate start from normal position — record start time', 'Record time to first voltage at terminals', 'Record time to reach 90% rated voltage and 96% rated frequency', 'For NFPA 110 Level 1: must close main breaker within 10 seconds of start command', 'Perform monthly and document in maintenance log'],
  },
  {
    id: 'T10', name: 'ATS / AMF Transfer Test', category: 'Emergency', duration: '30 minutes',
    acceptance: 'Normal to Generator transfer ≤ 10 sec (NFPA 110 L1), Return transfer ≤ 1 min delay',
    equipment: 'Stopwatch, Voltage recorder on both bus bars', standard: 'NFPA 110',
    steps: ['Open mains supply breaker to simulate mains failure', 'Record time for AMF controller to detect failure, start engine, and transfer load', 'Verify transfer time meets NFPA 110 Level 1 or Level 2 requirement', 'Monitor generator operation with full load for 15 minutes', 'Restore mains supply — verify retransfer delay timer activates', 'Verify generator runs for cool-down period then stops', 'Record all times and parameters in test certificate'],
  },
  {
    id: 'T11', name: 'Emergency Stop Test', category: 'Safety', duration: '10 minutes',
    acceptance: 'Engine stops within 5 seconds of E-stop activation, CB trips, Controller enters fault state',
    equipment: 'Stopwatch', standard: 'ISO 8528-6 / NFPA 110',
    steps: ['Operate generator at rated load', 'Activate E-stop button — record engine stop time', 'Verify main circuit breaker trips simultaneously', 'Verify controller displays E-stop fault', 'Reset E-stop — verify engine cannot restart until fault is acknowledged', 'Test E-stop from remote panel (if fitted)', 'Document in test log — date, test result, time to stop'],
  },
  {
    id: 'T12', name: 'Synchronization Test (Parallel)', category: 'Advanced', duration: '1 hour',
    acceptance: 'Sync check relay permits closure only when: ΔV < 2%, ΔF < 0.2 Hz, Δφ < 10°; No circulating current > 5% at steady parallel',
    equipment: 'Synchroscope, Phase rotation meter, Circulating current meter', standard: 'IEC 62271-100 / IEEE C37.118',
    steps: ['Both generators running at correct rated voltage and frequency', 'Connect synchroscope and verify slow forward rotation (incoming DG running slightly faster)', 'Close CB at 12 o\'clock position on synchroscope', 'Record circulating current at instant of closure — should be minimal', 'Load share evenly — verify kW and kVAR sharing between both generators', 'Test governor and AVR droop settings — verify stable load sharing', 'Test trip of one generator — other accepts full load without trip'],
  },
  {
    id: 'T13', name: 'Insulation Resistance Test', category: 'Electrical', duration: '15 minutes per winding',
    acceptance: 'IR > 100 MΩ at 1 kV DC (stator); PI > 2.0 for Class A, > 4.0 for Class H; DAR > 1.25',
    equipment: 'Megger insulation tester (1 kV DC / 5 kV DC capable)', standard: 'IEEE 43',
    steps: ['Isolate alternator from all electrical connections', 'Discharge all windings to earth before testing', 'Connect Megger between phase winding and earth (frame)', 'Apply 1 kV DC for 10 minutes (or 5 kV for HV machines)', 'Record reading at 30 sec (R30), 1 min (R1), and 10 min (R10)', 'Calculate PI = R10/R1 — must be > 2.0', 'Calculate DAR = R1/R30 — must be > 1.25', 'Temperature correct to 40°C if ambient differs'],
  },
  {
    id: 'T14', name: 'Earth Resistance Test', category: 'Electrical', duration: '30 minutes',
    acceptance: 'Earth electrode resistance < 1 Ω (IS 3043); Generator neutral earth < 0.5 Ω',
    equipment: 'Earth resistance tester (Fall-of-potential method, e.g., Megger DET)', standard: 'IEEE 81 / IS 3043',
    steps: ['Disconnect earth electrode from system (isolate)', 'Drive current spike (C) 30m from electrode under test', 'Drive potential spike (P) at 62% of C distance (18–20m)', 'Apply test current and measure resistance R = V/I', 'Move potential spike ±3m and re-measure — if R varies < 5% point is in resistive gradient zone', 'Results: < 1 Ω pass, 1–5 Ω marginal, > 5 Ω fail — add additional electrodes'],
  },
  {
    id: 'T15', name: 'Vibration Analysis', category: 'Condition Monitoring', duration: '1 hour',
    acceptance: 'Velocity < 2.8 mm/s RMS (ISO 10816-3 Class II rigid mount); Bearing temp < 70°C',
    equipment: 'Vibration analyser (FFT capability), Accelerometer, Temperature gun', standard: 'ISO 10816-3',
    steps: ['Mount accelerometer on DE and NDE bearing housings of both engine and alternator', 'Measure overall vibration level (mm/s RMS) at no load, 50% load, and 100% load', 'Perform FFT (frequency spectrum) analysis', 'Identify 1× and 2× running frequency components — high 1× = imbalance, high 2× = misalignment', 'Bearing frequencies: BPFO, BPFI (calculate from bearing data)', 'Compare with baseline trend from previous measurements', 'Document and trend — flag any increase > 25% from baseline'],
  },
];

const CATEGORIES = [...new Set(TESTS.map(t => t.category))];

export function DGTesting() {
  const [selCat, setSelCat] = useState('All');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDownload = () => {
    const summaryRows = TESTS.map(t => [t.id, t.name, t.category, t.duration, t.standard]);
    const detailSections = TESTS.map(t =>
      `<h2>${t.id} — ${t.name} (${t.category})</h2>
       ${tableHTML(['Parameter','Details'],[
         ['Duration', t.duration],
         ['Standard', t.standard],
         ['Equipment', t.equipment],
         ['Acceptance Criteria', t.acceptance],
       ])}
       <table><thead><tr><th>Step</th><th>Procedure</th></tr></thead><tbody>
         ${t.steps.map((s, i) => `<tr><td class="lbl" style="width:50px">${i+1}</td><td>${s}</td></tr>`).join('')}
       </tbody></table>`
    ).join('');
    const body = `
      <h2>Test Procedures Summary</h2>
      ${tableHTML(['ID','Test Name','Category','Duration','Standard'], summaryRows)}
      ${detailSections}`;
    downloadReport('DG Testing Procedures Manual', '15 Test Procedures — ISO 8528 · NFPA 110 · IEEE 43 · IEEE 81', 'ISO 8528 · NFPA 110 · IEEE 43 · IEEE 81 · IEC 60034', body, 'DG-Testing-Manual.pdf');
  };

  const filtered = TESTS.filter(t => selCat === 'All' || t.category === selCat);

  const CAT_COLOR: Record<string, string> = {
    'Routine': '#059669', 'Performance': '#2563EB', 'Transient': '#7C3AED',
    'Emergency': '#DC2626', 'Safety': '#EA580C', 'Advanced': '#D97706',
    'Electrical': '#0891B2', 'Condition Monitoring': '#6B7280',
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Wrench} title="DG TESTING MODULE" subtitle="ISO 8528 · NFPA 110 · IEEE 43 · IEEE 81 · 15 Test Procedures" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Testing Manual PDF
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', padding: 5, background: V.surf, borderRadius: 10, border: `1px solid ${V.brdM}` }}>
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setSelCat(c)}
            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: selCat === c ? 700 : 500, border: 'none', cursor: 'pointer', background: selCat === c ? (CAT_COLOR[c] ?? ACCENT) : 'transparent', color: selCat === c ? '#fff' : V.sec }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((test) => {
          const isOpen = expanded.has(test.id);
          const catColor = CAT_COLOR[test.category] ?? ACCENT;
          return (
            <div key={test.id} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', borderLeft: `5px solid ${catColor}` }}>
              <button onClick={() => toggle(test.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: catColor, minWidth: 32 }}>{test.id}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: V.txt }}>{test.name}</div>
                  <div style={{ fontSize: 11, color: V.muted, marginTop: 1 }}>
                    <span style={{ marginRight: 12 }}>⏱ {test.duration}</span>
                    <span style={{ marginRight: 12 }}>📋 {test.standard}</span>
                    <span style={{ background: catColor + '20', color: catColor, padding: '1px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10 }}>{test.category}</span>
                  </div>
                </div>
                {isOpen ? <ChevronDown style={{ width: 16, height: 16, color: V.muted }} /> : <ChevronRight style={{ width: 16, height: 16, color: V.muted }} />}
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 16px 16px', borderTop: `1px solid ${V.brdM}`, paddingTop: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                      { l: 'Acceptance Criteria', v: test.acceptance, c: '#059669' },
                      { l: 'Required Equipment', v: test.equipment, c: '#7C3AED' },
                      { l: 'Reference Standard', v: test.standard, c: '#2563EB' },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ padding: '10px 12px', background: V.surf, borderRadius: 9, border: `1px solid ${V.brdM}`, borderTop: `3px solid ${c}` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{l}</div>
                        <div style={{ fontSize: 12, color: V.sec, lineHeight: 1.5 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Test Procedure Steps</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {test.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: catColor, minWidth: 22, flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: V.sec, lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
