import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Download, CheckCircle, XCircle, Minus,
  ClipboardList, AlertTriangle, Info, Printer,
} from 'lucide-react';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#7C3AED';
const V = {
  bg: 'var(--ec-bg-root)', surf: 'var(--ec-bg-card)', brd: 'var(--ec-border)',
  txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)', muted: 'var(--ec-text-muted)',
};

// ─── Types ───────────────────────────────────────────────────────────────────
type TResult = 'PASS' | 'FAIL' | 'NA' | '';
interface TestStep { step: number; action: string; expectedValue?: string }
interface TestDef {
  id: string;
  no: number;
  name: string;
  category: 'primary' | 'secondary' | 'protection' | 'functional' | 'hv';
  critical: boolean;
  objective: string;
  equipment: string[];
  procedure: TestStep[];
  acceptanceCriteria: string[];
  standard: string;
  caution?: string;
}

// ─── Test Definitions ─────────────────────────────────────────────────────────
const TESTS: TestDef[] = [
  {
    id: 'ct-test', no: 1, name: 'Current Transformer Testing', category: 'primary', critical: false,
    objective: 'Verify CT ratio, polarity, insulation integrity, knee-point voltage and magnetisation curve for metering and protection CTs.',
    equipment: ['CT Ratio Test Set', 'Megger (1 kV DC)', 'Micro-ohmmeter', 'Knee-point tester / AC voltage source & ammeter', 'Multimeter'],
    procedure: [
      { step: 1, action: 'Disconnect all secondary wiring and short unused secondary terminals before any primary-side work.' },
      { step: 2, action: 'Measure insulation resistance — Primary to Secondary & Earth, Secondary to Earth.', expectedValue: '≥ 1000 MΩ at 1 kV DC (IEC 61869-2 Table 5)' },
      { step: 3, action: 'Measure secondary winding resistance using micro-ohmmeter.', expectedValue: 'Compare with factory test report (typically 0.5–5 Ω for 5P20 class)' },
      { step: 4, action: 'Perform ratio test at rated primary current or inject secondary and measure voltage ratio.', expectedValue: 'Ratio error: 0.2 class ≤ ±0.2 %, 0.5 class ≤ ±0.5 %, 1P class ≤ ±1 %, 5P class ≤ ±1 %' },
      { step: 5, action: 'Check polarity (P1→S1 / P2→S2) using battery and galvanometer method.', expectedValue: 'Galvanometer deflects positive on closing switch — confirms subtractive (IEC) polarity' },
      { step: 6, action: 'Perform knee-point voltage test on protection CTs: gradually increase secondary voltage and plot I vs V.', expectedValue: 'Vk ≥ nameplate value. 10 % increase in voltage must not cause > 50 % increase in exciting current (IEC 61869-2 Cl. 5.4)' },
      { step: 7, action: 'Plot magnetisation (excitation) curve and compare with factory curve.', expectedValue: 'Curve shape must match factory. Any significant deviation indicates shorted turns.' },
      { step: 8, action: 'Reconnect secondary wiring and verify correct terminal identification.' },
    ],
    acceptanceCriteria: [
      'IR: ≥ 1000 MΩ (1 kV DC, 1 min) for all windings',
      'Ratio error within class limits (Table above)',
      'Vk ≥ nameplate knee-point voltage',
      'Polarity confirmed correct',
      'Winding resistance within ±5 % of factory value',
    ],
    standard: 'IEC 61869-2 | IEC 61869-1 | IEEE C57.13',
    caution: 'Never open-circuit a CT secondary under energised conditions — dangerous high voltage will appear across open terminals.',
  },
  {
    id: 'vt-test', no: 2, name: 'Voltage Transformer Testing', category: 'primary', critical: false,
    objective: 'Verify VT/PT ratio, polarity, insulation resistance and secondary winding resistance.',
    equipment: ['VT Ratio Test Set', 'Megger (1 kV DC)', 'Micro-ohmmeter', 'Multimeter'],
    procedure: [
      { step: 1, action: 'De-energise and isolate VT. Remove HV fuses (if fitted).' },
      { step: 2, action: 'Measure insulation resistance — HV winding to LV winding & Earth, LV to Earth.', expectedValue: '≥ 1000 MΩ at 1 kV DC' },
      { step: 3, action: 'Measure secondary winding resistance.', expectedValue: 'Compare with factory certificate. Typically 10–200 Ω for 11kV/110V VT' },
      { step: 4, action: 'Perform ratio test: apply safe LV AC (240 V) to secondary and measure primary voltage, then calculate ratio.', expectedValue: 'Ratio error: 0.2 class ≤ ±0.2 %, 0.5 class ≤ ±0.5 %, 3P class ≤ ±3 %' },
      { step: 5, action: 'Verify polarity: A-phase primary (A1) corresponds to A-phase secondary (a1).', expectedValue: 'Confirmed by polarity check — consult vector diagram on nameplate' },
      { step: 6, action: 'Verify burden does not exceed rated VA (sum of connected burdens ≤ rated VA).', expectedValue: 'Total burden ≤ nameplate VA rating' },
    ],
    acceptanceCriteria: [
      'IR: ≥ 1000 MΩ at 1 kV DC',
      'Ratio error within class limits',
      'Polarity confirmed correct',
      'Winding resistance within ±5 % of factory',
      'Connected burden ≤ rated VA',
    ],
    standard: 'IEC 61869-3 | IEEE C57.13',
  },
  {
    id: 'cb-test', no: 3, name: 'Circuit Breaker Testing', category: 'primary', critical: false,
    objective: 'Verify main circuit insulation, contact resistance, minimum operating voltage, SF6 gas pressure (if applicable) and mechanical integrity.',
    equipment: ['Micro-ohmmeter (200 A DC)', 'Megger (5 kV DC)', 'Variable DC supply (0–110 % Vn)', 'Manometer / Gas density relay tester'],
    procedure: [
      { step: 1, action: 'Visually inspect CB for physical damage, correct assembly and lubrication.' },
      { step: 2, action: 'Measure main circuit insulation resistance (pole to pole and pole to earth) in OPEN position.', expectedValue: '≥ 1000 MΩ at 5 kV DC (IEC 62271-100 Cl. 7.5)' },
      { step: 3, action: 'Measure contact resistance across each pole in CLOSED position using 200 A DC micro-ohmmeter.', expectedValue: '≤ 50 µΩ per pole (vacuum CB typical 20–40 µΩ). Compare with manufacturer spec.' },
      { step: 4, action: 'Check SF6 gas density / pressure (for SF6 type only).', expectedValue: 'Rated gas pressure per nameplate (typically 0.4–0.6 MPa at 20 °C). Both alarm and lockout pressure correct.' },
      { step: 5, action: 'Test minimum operating (close) voltage: reduce DC supply and find lowest voltage at which CB closes.', expectedValue: 'CB must close at 85 % of rated control voltage (IEC 62271-100 Cl. 5.7)' },
      { step: 6, action: 'Test minimum operating (trip) voltage: reduce DC supply and find lowest voltage at which CB trips.', expectedValue: 'CB must trip at 70 % of rated control voltage' },
      { step: 7, action: 'Perform 5 mechanical OPEN/CLOSE operations without load and confirm reliable operation.' },
      { step: 8, action: 'Check and confirm all indicating flags, position indicators and local panel indications.' },
    ],
    acceptanceCriteria: [
      'IR: ≥ 1000 MΩ at 5 kV DC (open position)',
      'Contact resistance: ≤ 50 µΩ per pole (or manufacturer value)',
      'Min. close voltage: ≤ 85 % Vn DC',
      'Min. trip voltage: ≤ 70 % Vn DC',
      'SF6 density within rated range (SF6 CBs)',
      '5 mechanical operations — all satisfactory',
    ],
    standard: 'IEC 62271-100 | IEC 62271-200 | ANSI C37.09',
    caution: 'Perform contact resistance test at ≥ 100 A DC to overcome surface oxide films — low-current milli-ohmmeter readings will be incorrect.',
  },
  {
    id: 'timing-test', no: 4, name: 'Timing Tests — Circuit Breakers & Earthing Switches', category: 'primary', critical: false,
    objective: 'Measure open, close and open-close-open (O-CO-OCO) cycle times to verify protection grading and auto-reclose coordination.',
    equipment: ['CB Analyser / Timer (e.g. FREJA, SVERKER, Megger TM1800)', 'Current clamps', 'DC supply at rated control voltage'],
    procedure: [
      { step: 1, action: 'Connect CB analyser to trip coil, close coil and auxiliary contacts.' },
      { step: 2, action: 'Apply rated DC control voltage. Perform OPEN operation and record trip coil current and contact-part separation time.', expectedValue: 'Vacuum CB opening time: 30–60 ms (contact part to contact separation). Per manufacturer spec.' },
      { step: 3, action: 'Perform CLOSE operation and record close coil current and contact touch time.', expectedValue: 'Vacuum CB closing time: 50–80 ms. Per manufacturer spec.' },
      { step: 4, action: 'Measure pole discrepancy time (three poles must operate within 3 ms of each other).', expectedValue: 'Pole discrepancy: ≤ 3 ms (IEC 62271-100 Cl. 5.104)' },
      { step: 5, action: 'Perform CO (close-open) and OCO (auto-reclose) cycle. Measure dead time (O to C) and total cycle time.', expectedValue: 'OCO dead time: per protection study (typically 0.3–0.5 s for 11 kV)' },
      { step: 6, action: 'Perform Earth Switch timing test: close and open and verify interlocking prevents operation when CB is closed.', expectedValue: 'Earth switch operation time: ≤ 3 s (manual), confirmed per nameplate' },
      { step: 7, action: 'Verify trip coil and close coil currents are within manufacturer limits.' },
    ],
    acceptanceCriteria: [
      'Opening time within manufacturer specification',
      'Closing time within manufacturer specification',
      'Pole discrepancy: ≤ 3 ms',
      'O-CO dead time matches protection study requirement',
      'Trip/close coil currents within nameplate limits',
      'Earth switch interlocking confirmed',
    ],
    standard: 'IEC 62271-100 Cl. 5.104 | IEC 62271-102 (Earth Switches)',
  },
  {
    id: 'pfv-aux', no: 5, name: 'Power Frequency Voltage Test — Auxiliary Circuits', category: 'hv', critical: true,
    objective: 'Verify insulation integrity of all auxiliary (secondary) wiring at 2 kV AC power frequency for 1 minute before energisation.',
    equipment: ['Hi-pot / Dielectric test set (2 kV AC output)', 'Protective equipment (HV gloves, face shield)'],
    procedure: [
      { step: 1, action: 'CRITICAL: Disconnect or protect all voltage-sensitive devices (relays, meters, PLCs, transducers) before applying test voltage.' },
      { step: 2, action: 'Short all secondary wiring at each panel/terminal block — connect all conductors together and to test set.' },
      { step: 3, action: 'Apply 2 kV AC between the shorted wiring bundle and earth (panel earth bus) for 60 seconds.', expectedValue: 'No flashover, no puncture, no sustained leakage current spike. Acceptable leakage: < 1 mA (typical)' },
      { step: 4, action: 'Reduce voltage to zero gradually. Reconnect all devices. Repeat test in sections if any anomaly observed.' },
      { step: 5, action: 'Record test voltage, duration and pass/fail for each wiring group tested.' },
    ],
    acceptanceCriteria: [
      '2 kV AC for 60 s — no breakdown, no flashover',
      'Leakage current: < 1 mA throughout test duration',
      'Insulation resistance after test: ≥ 1 MΩ at 500 V DC',
    ],
    standard: 'IEC 60694 Cl. 7.3 | IEC 60255-27 (Relay withstand) | IEC 62271-200',
    caution: 'DISCONNECT all electronic relays, meters, transducers and RTDs before applying 2 kV. Failure to do so WILL damage equipment.',
  },
  {
    id: 'ac-scheme', no: 6, name: 'AC Scheme Checks', category: 'secondary', critical: false,
    objective: 'Verify all AC supply circuits, voltage levels, phase sequence and distribution wiring are correctly installed per the approved schematic.',
    equipment: ['Multimeter', 'Phase sequence indicator', 'Clamp meter'],
    procedure: [
      { step: 1, action: 'Verify AC supply source (110 V AC or 240 V AC as per design) — measure voltage at incomers and distribution MCBs.', expectedValue: 'Voltage within ±10 % of nominal. Phase sequence RYB confirmed.' },
      { step: 2, action: 'Check all AC MCBs/fuses are correctly rated per the approved single-line diagram.' },
      { step: 3, action: 'Verify AC supply to panel heaters, anti-condensation heaters and lighting — thermostat operation confirmed.', expectedValue: 'Heaters energise below set temperature. Lighting operates correctly.' },
      { step: 4, action: 'Trace and verify all AC wiring to each VT secondary metering circuit — check burden values.' },
      { step: 5, action: 'Verify AC supply to SCADA/RTU power supply units, chargers and UPS.' },
      { step: 6, action: 'Check all AC terminal blocks, ferrule numbers and cable tags match wiring schedule.' },
    ],
    acceptanceCriteria: [
      'Voltage: within ±10 % of nominal at all distribution points',
      'Phase sequence confirmed RYB at AC incomer',
      'All MCBs/fuses correctly rated',
      'Heater and lighting circuits operational',
      'All wiring matches approved schematic',
    ],
    standard: 'IEC 61439-1 | IEC 60364-5-52',
  },
  {
    id: 'dc-scheme', no: 7, name: 'DC Scheme Checks including Protection Scheme', category: 'secondary', critical: false,
    objective: 'Verify DC supply voltage levels, polarity, distribution, battery charger operation and all protection relay DC supplies.',
    equipment: ['Multimeter (DC voltage)', 'Clamp meter (DC)'],
    procedure: [
      { step: 1, action: 'Measure DC bus voltage at battery terminals and at distribution board.', expectedValue: '110 V DC: 110–125 V (float charge). 48 V DC: 48–56 V. Within ±10 % of nominal.' },
      { step: 2, action: 'Check polarity of DC at all distribution MCBs and terminal blocks — confirm positive and negative correctly identified.' },
      { step: 3, action: 'Verify battery charger output voltage and current; check float and boost charge settings.' },
      { step: 4, action: 'Measure DC supply voltage at each protection relay, control relay, timer and annunciator — all should receive rated DC.', expectedValue: '≥ 80 % of rated DC voltage at each device under load' },
      { step: 5, action: 'Trace and verify trip coil supply from correct DC MCB/fuse — confirm trip coil rating matches supply fuse.' },
      { step: 6, action: 'Verify close coil supply from separate MCB/fuse (independent of trip supply, per IEC practice).' },
      { step: 7, action: 'Check all DC terminal blocks, ferrule numbers and cable tags match wiring schedule.' },
      { step: 8, action: 'Measure earth leakage on DC system using earth fault relay or voltage to earth measurement.', expectedValue: 'V+ to Earth ≈ V− to Earth (± 5 V). No significant earth fault present.' },
    ],
    acceptanceCriteria: [
      'DC bus voltage within ±10 % of nominal',
      'Correct polarity confirmed throughout DC system',
      'Battery charger float/boost settings verified',
      'All relay DC supplies ≥ 80 % of rated voltage',
      'DC earth leakage: balanced (V+ to E ≈ V− to E)',
    ],
    standard: 'IEC 60896-21 (Battery) | IEC 62271-200 | IEEE 485',
    caution: 'Check DC polarity at EVERY terminal before connecting protection relays — reversed polarity will damage relay electronics.',
  },
  {
    id: 'interlock', no: 8, name: 'Interlocking Tests', category: 'functional', critical: false,
    objective: 'Verify all electrical and mechanical interlocks prevent dangerous operating sequences and that key interlocking functions correctly.',
    equipment: ['Functional test: operate panels manually with DC energised', 'Key interlock management sheet'],
    procedure: [
      { step: 1, action: 'Attempt to CLOSE the earth switch with circuit breaker in CLOSED position.', expectedValue: 'Earth switch must be blocked — cannot close. Confirmed by physical block or electrical interlock.' },
      { step: 2, action: 'Attempt to CLOSE the circuit breaker with earth switch in CLOSED position.', expectedValue: 'CB must be electrically interlocked — close command rejected. Auxiliary contact of ES prevents close.' },
      { step: 3, action: 'Verify BUSBAR earth switch interlock: confirm busbar section earth switch prevents energisation of busbar when closed.' },
      { step: 4, action: 'Verify PANEL DOOR interlock: HV compartment door must be locked closed before CB can close.', expectedValue: 'Door interlock switch in series with close circuit — confirmed' },
      { step: 5, action: 'Verify KEY INTERLOCKING sequence: withdraw the key sequence defined in the site key interlock schedule and confirm correct transfer.' },
      { step: 6, action: 'Verify BUS COUPLER interlocking (if applicable): confirm correct busbar section coupling logic.' },
      { step: 7, action: 'Test CABLE COMPARTMENT SHUTTER: shutter must open only when draw-out unit in correct withdrawn position.' },
      { step: 8, action: 'Document all interlocks tested with pass/fail and any deviations reported for correction.' },
    ],
    acceptanceCriteria: [
      'CB cannot close with Earth Switch CLOSED',
      'Earth Switch cannot close with CB CLOSED',
      'HV compartment door interlock functional',
      'Key interlock sequence per site schedule — all correct',
      'Shutter operation — opens and closes correctly',
    ],
    standard: 'IEC 62271-200 Cl. 6.104 | BS EN 62271-200 | IEC 60947',
  },
  {
    id: 'op-checks', no: 9, name: 'Operational & Functional Checks — CB & Earth Switches', category: 'functional', critical: false,
    objective: 'Confirm reliable local and remote OPEN/CLOSE operations and correct status indication at local panel and SCADA.',
    equipment: ['Control panel local pushbuttons', 'SCADA/RTU workstation', 'Multimeter for indication circuit checks'],
    procedure: [
      { step: 1, action: 'Perform LOCAL CLOSE of circuit breaker using panel pushbutton — confirm CB closes.', expectedValue: 'CB closes, CLOSED indicator (green) extinguishes, OPEN indicator (red) illuminates at local panel' },
      { step: 2, action: 'Perform LOCAL OPEN of circuit breaker — confirm CB opens.', expectedValue: 'CB opens, OPEN indicator (green) illuminates at local panel' },
      { step: 3, action: 'Perform REMOTE CLOSE from SCADA/control room — confirm CB closes and correct status reported.', expectedValue: 'CB CLOSED status reflected correctly at SCADA within 2 s of operation' },
      { step: 4, action: 'Perform REMOTE OPEN from SCADA/control room — confirm CB opens and status updated.', expectedValue: 'CB OPEN status reflected correctly at SCADA within 2 s' },
      { step: 5, action: 'Operate Earth Switch locally — CLOSE and OPEN. Confirm position indication at panel and SCADA.', expectedValue: 'ES CLOSED/OPEN correctly indicated at local panel (flag indicator) and SCADA' },
      { step: 6, action: 'Verify spring-charged indicator is illuminated after CB opens (spring auto-charges).', expectedValue: 'Spring charged indicator ON within 10 s of CB opening (motor-charged mechanism)' },
      { step: 7, action: 'Verify auto-reclose lockout function: check 3-phase trip lockout relay resets the auto-reclose relay correctly.' },
      { step: 8, action: 'Check gas low alarm and gas lockout alarms are correctly displayed at panel and SCADA (SF6 panels).' },
    ],
    acceptanceCriteria: [
      'Local OPEN/CLOSE: 5 operations — all satisfactory',
      'Remote OPEN/CLOSE: confirmed from SCADA',
      'All position indications correct at local panel and SCADA',
      'Spring charged indication correct',
      'Alarms visible at panel and SCADA',
    ],
    standard: 'IEC 62271-200 | IEC 62271-100 | Site-specific SCADA specifications',
  },
  {
    id: 'trip-logic', no: 10, name: 'Trip Logic Testing', category: 'protection', critical: false,
    objective: 'Verify every trip input (protection relay, lockout relay, manual trip) correctly initiates circuit breaker trip.',
    equipment: ['Secondary injection set or relay test set', 'Test leads', 'Multimeter'],
    procedure: [
      { step: 1, action: 'From protection relay test output, inject a trip signal directly to the relay output contact — verify CB trips.', expectedValue: 'CB trips within the relay operating time + CB opening time (< 100 ms total)' },
      { step: 2, action: 'Test OVERCURRENT TRIP (IDMT 50/51): inject overcurrent above pickup and verify trip after correct IDMT delay.', expectedValue: 'Trip time as per approved relay settings (e.g. TMS 0.1 at 10× In: ~0.14 s for Standard Inverse IEC)' },
      { step: 3, action: 'Test EARTH FAULT TRIP (50N/51N): inject residual (zero-sequence) current above pickup.', expectedValue: 'Trip per approved settings. Confirm separate earth fault trip flag on relay.' },
      { step: 4, action: 'Test DIFFERENTIAL TRIP (87T, if transformer bay): inject differential current and verify high-speed trip.', expectedValue: 'Differential trip: < 30 ms (high-set instantaneous)' },
      { step: 5, action: 'Test LOCKOUT RELAY (86) trip: operate 86 relay — verify CB trips and remains tripped even after trip signal removed.', expectedValue: 'CB trips and lockout relay latches. CB cannot close until 86 relay manually reset.' },
      { step: 6, action: 'Test BUS PROTECTION / BUSBAR DIFFERENTIAL trip input to CB if applicable.' },
      { step: 7, action: 'Test MANUAL TRIP from panel emergency trip pushbutton — verify CB trips.' },
      { step: 8, action: 'Restore all relay settings and flag all results.' },
    ],
    acceptanceCriteria: [
      'Every trip input causes CB to trip — confirmed',
      'Trip times match approved protection settings',
      'Lockout relay (86) latches correctly',
      'Trip from manual EPT pushbutton confirmed',
      'All trip flags correctly displayed on relay',
    ],
    standard: 'IEC 60255-151 (Overcurrent) | IEC 60255-181 (Differential) | IEC 62271-200',
  },
  {
    id: 'tcs', no: 11, name: 'Trip Circuit Supervision (TCS) Testing', category: 'protection', critical: false,
    objective: 'Verify that the TCS scheme raises an alarm when the trip circuit is open (broken wire) or shorted (trip coil short-circuit).',
    equipment: ['Multimeter', 'TCS relay test — open-circuit test leads', 'Ammeter'],
    procedure: [
      { step: 1, action: 'With CB CLOSED, measure TCS relay coil voltage — must be energised (trip coil and TCS relay in series, shunted by closed CB auxiliary contact).', expectedValue: 'TCS relay picks up at ≥ 55 V DC (for 110 V DC nominal) — 50 % threshold' },
      { step: 2, action: 'Simulate open-circuit condition: disconnect one trip circuit wire at CB trip coil terminals.', expectedValue: 'TCS alarm raised within 2 s at panel annunciator and SCADA: "TRIP CIRCUIT FAILURE"' },
      { step: 3, action: 'With CB OPEN, verify TCS relay monitors the close circuit (if dual TCS fitted).', expectedValue: 'TCS relay energised through CB auxiliary contact in open position and trip coil' },
      { step: 4, action: 'Reconnect trip circuit and verify TCS alarm clears.' },
      { step: 5, action: 'Verify TCS alarm appears at SCADA and generates an event/log entry.', expectedValue: 'Trip Circuit Failure alarm visible at control room SCADA' },
    ],
    acceptanceCriteria: [
      'TCS alarm raised on trip circuit open condition: < 2 s',
      'TCS alarm clears when trip circuit restored',
      'TCS alarm reported correctly at SCADA',
      'TCS pickup voltage: 50–70 % of rated DC voltage',
    ],
    standard: 'IEC 60255-27 | BS 142 Section 4.3 | IEC 62271-200',
  },
  {
    id: 'busbar-cr', no: 12, name: 'Busbar Contact Resistance Measurement', category: 'primary', critical: false,
    objective: 'Verify that all busbar joints, connections and spigots have low contact resistance to prevent overheating under rated and fault currents.',
    equipment: ['Micro-ohmmeter / Ducter (200 A DC minimum)', 'Test leads (rated for 200 A)', 'Cleaning materials'],
    procedure: [
      { step: 1, action: 'Ensure busbar is de-energised and earthed. Clean joint surfaces where accessible.' },
      { step: 2, action: 'Connect micro-ohmmeter current leads as far apart as possible across each joint, voltage leads directly across the joint.', expectedValue: 'Use Kelvin 4-wire method for accurate measurement' },
      { step: 3, action: 'Apply 200 A DC test current and record resistance reading for each busbar joint.', expectedValue: '≤ 100 µΩ per bolted joint (IEC 62271-200 guidance). Manufacturer specification: compare with erection drawings.' },
      { step: 4, action: 'Measure through busbar-to-spigot connections for each panel incomer.', expectedValue: '≤ 50 µΩ per spigot connection (typical)' },
      { step: 5, action: 'Any joint > 100 µΩ — retighten bolts to specified torque and retest. If still high, clean joint and apply contact grease.' },
      { step: 6, action: 'Record measurements in tabular form: location, measured value, acceptance limit, pass/fail.' },
    ],
    acceptanceCriteria: [
      '≤ 100 µΩ per bolted busbar joint',
      '≤ 50 µΩ per draw-out spigot connection',
      'No joint > 150 µΩ after tightening to correct torque',
      'Values consistent across three phases (within 10 % of each other)',
    ],
    standard: 'IEC 62271-200 | IEEE C37.20 | Manufacturer erection manual',
    caution: 'Minimum 100 A DC test current required. Low-current resistance meters give falsely low readings on oxidised busbars.',
  },
  {
    id: 'es-cr', no: 13, name: 'Earth Switch Contact Resistance Measurement', category: 'primary', critical: false,
    objective: 'Verify earth switch contact resistance is low to ensure adequate fault current path to earth during earth fault conditions.',
    equipment: ['Micro-ohmmeter (200 A DC)', '4-wire test leads'],
    procedure: [
      { step: 1, action: 'Close earth switch and confirm it is fully latched in CLOSED position.' },
      { step: 2, action: 'Apply micro-ohmmeter test current leads: one at earth switch incoming terminal (cable side), other at earth bus/earthing terminal.', expectedValue: '4-wire Kelvin measurement' },
      { step: 3, action: 'Apply 200 A DC and record resistance across each phase earth switch.', expectedValue: '≤ 200 µΩ per phase (for 11 kV earth switch). Manufacturer: typically ≤ 100 µΩ. Per IEC 62271-102.' },
      { step: 4, action: 'Record for all three phases. Values must be consistent within ±20 %.' },
    ],
    acceptanceCriteria: [
      '≤ 200 µΩ per phase (or per manufacturer specification)',
      'Three-phase values within ±20 % of each other',
      'Values within ±10 % of factory test certificate values',
    ],
    standard: 'IEC 62271-102 | IEC 62271-200',
  },
  {
    id: 'meter-cal', no: 14, name: 'Calibration of Measurement Devices (MFM, PQM, Energy Meters)', category: 'secondary', critical: false,
    objective: 'Verify correct CT/VT ratio settings, verify voltage and current measurements against reference standards, and confirm pulse output and communications.',
    equipment: ['Secondary injection set (calibrated reference)', 'Calibrated reference multimeter / power analyser', 'Laptop with meter configuration software'],
    procedure: [
      { step: 1, action: 'Open meter configuration and verify CT ratio and VT ratio are programmed correctly per the approved schedule.' },
      { step: 2, action: 'Inject known 3-phase voltage (110 V secondary) from injection set into VT secondary input of meter.', expectedValue: 'Meter displays: 110 V × PT ratio = primary voltage ± 0.5 % (Class 0.5 meter)' },
      { step: 3, action: 'Inject known 3-phase current (1 A or 5 A from injection set) into CT secondary input of meter.', expectedValue: 'Meter displays: injected current × CT ratio = primary current ± 0.5 %' },
      { step: 4, action: 'Inject balanced 3-phase V and I (with known phase angle) — verify active power (kW), reactive power (kVAR) and power factor readings.', expectedValue: 'kW, kVAR and PF within ±0.5 % of calculated reference values' },
      { step: 5, action: 'Verify energy registration: inject known power for known time and confirm kWh registration.', expectedValue: 'kWh within Class 0.5 accuracy (±0.5 %)' },
      { step: 6, action: 'Verify pulse output from energy meter (for utility billing meters).', expectedValue: 'Pulse constant as programmed (e.g. 800 pulses/kWh). Count pulses during injection.' },
      { step: 7, action: 'Verify Modbus/RS485 or IEC 61850 communications — confirm meter data accessible from SCADA/RTU.', expectedValue: 'All analogue values readable and match local display within ±0.5 %' },
      { step: 8, action: 'Verify Power Quality Monitor (PQM) records voltage sags, swells, harmonics and alarms correctly.' },
    ],
    acceptanceCriteria: [
      'CT/VT ratios correctly programmed',
      'Voltage measurement: ±0.5 % of reference (Class 0.5)',
      'Current measurement: ±0.5 % of reference',
      'kW, kVAR, PF: ±0.5 % of reference',
      'kWh registration: ±0.5 % (Class 0.5)',
      'Communications: all values readable at SCADA',
    ],
    standard: 'IEC 62053-21 (Active Energy Class 1) | IEC 62053-22 (Class 0.5S) | IEC 61557-12 (MFM) | IEC 61850',
  },
  {
    id: 'relay-final', no: 15, name: 'Final Setting Implementation & Relay Testing', category: 'protection', critical: true,
    objective: 'Upload and verify final approved protection settings in all relays, perform complete secondary injection to confirm operate time and selectivity per the protection co-ordination study.',
    equipment: ['Relay Test Set (FREJA 300/OMICRON CMC 356/Megger SMRT)', 'Relay setting sheets (approved by Protection Engineer)', 'Laptop with relay configuration software'],
    procedure: [
      { step: 1, action: 'OBTAIN APPROVED RELAY SETTING SHEETS signed by Protection Engineer before this test. Do not use preliminary/draft settings.' },
      { step: 2, action: 'Upload approved settings file to relay via front panel or laptop software. Print and verify each setting against approved sheet.', expectedValue: 'All settings exactly match approved setting sheet — no deviation' },
      { step: 3, action: 'Overcurrent (51) — Test pickup: inject gradually increasing current and find exact pickup value.', expectedValue: 'Pickup within ±5 % of set value (IEC 60255-151 Cl. 12)' },
      { step: 4, action: 'Overcurrent (51) — Test IDMT operating time at 2×, 5× and 10× pickup. Record times.', expectedValue: 'Operate time within ±5 % or ±40 ms of theoretical IDMT time (whichever is greater)' },
      { step: 5, action: 'Instantaneous overcurrent (50) — test pickup and operate time.', expectedValue: 'Pickup within ±5 % of set value. Operate time: < 40 ms' },
      { step: 6, action: 'Earth fault (51N/51G) — repeat pickup and timing tests.', expectedValue: 'Pickup and timing per approved setting sheet' },
      { step: 7, action: 'Directional elements (67/67N if fitted) — verify correct operation for forward and reverse faults.', expectedValue: 'Operates for forward fault, blocks for reverse fault. MTA (characteristic angle) correct.' },
      { step: 8, action: 'Under-voltage (27) / Over-voltage (59) — test pickup and time delay.', expectedValue: 'Operate at set % of Vn within ±2 % of set value and within ±2 % of time delay' },
      { step: 9, action: 'Auto-reclose (79) — test initiation, dead time (O→C interval), reclaim time and lockout after maximum shots.', expectedValue: 'Dead time, reclaim time and maximum shots as per approved setting sheet' },
      { step: 10, action: 'Verify relay output to CB trip coil confirmed by watching CB trip on relay output inject.' },
    ],
    acceptanceCriteria: [
      'All settings match approved protection setting sheet exactly',
      'Pickup currents within ±5 % of set value',
      'IDMT times within ±5 % or ±40 ms of theoretical',
      'Instantaneous trip time: < 40 ms',
      'Directional element: correct for forward/reverse',
      'Auto-reclose: all timers per setting sheet',
    ],
    standard: 'IEC 60255-151 | IEC 60255-181 | IEC 60255-127 | IEC 60255-185-1',
    caution: 'Never use unverified or draft relay settings for final commissioning. All settings must be signed off by the Protection Engineer.',
  },
  {
    id: 'primary-ct', no: 16, name: 'Primary Injection Test of CTs', category: 'primary', critical: false,
    objective: 'Verify complete CT circuit end-to-end by injecting primary current and confirming correct secondary current at relay, meter and control room inputs.',
    equipment: ['Primary injection test set (100–500 A AC output)', 'Clamp meter (secondary side)', 'Phase angle meter'],
    procedure: [
      { step: 1, action: 'Connect primary injection set to primary conductor of CT under test (bus side of circuit breaker, with CB open and earthed).' },
      { step: 2, action: 'Set injection current to 100 A (or as agreed — ensure < 20 % of rated primary for protection CTs to avoid saturation of measurement CTs).', expectedValue: 'Typical injection: 100 A primary' },
      { step: 3, action: 'Measure secondary current at CT terminals, relay input terminals, and energy meter input.', expectedValue: 'Secondary current = Injected Primary ÷ CT ratio. Example: 100 A ÷ 200/5 = 2.5 A. Within ±1 %.' },
      { step: 4, action: 'Verify polarity: using phasor measurement, confirm secondary current is in phase with primary current (P1→S1 convention).', expectedValue: 'Phase angle between injected primary V reference and secondary current = 0° ± 5°' },
      { step: 5, action: 'Verify relay display shows correct primary current reading (relay multiplies measured secondary by CT ratio).', expectedValue: 'Relay display: 100 A primary (±1 A)' },
      { step: 6, action: 'Verify MFM/energy meter primary current display.', expectedValue: 'Meter display: 100 A ± 0.5 %' },
      { step: 7, action: 'Repeat for each phase (R, Y, B) and for residual/neutral CT if fitted.' },
    ],
    acceptanceCriteria: [
      'Secondary current = primary ÷ CT ratio within ±1 %',
      'Polarity correct (in-phase injection confirmed)',
      'Relay primary current display correct ±1 %',
      'Energy meter primary current display ±0.5 %',
      'Three phases and neutral CT confirmed',
    ],
    standard: 'IEC 61869-2 | IEC 61869-1',
    caution: 'High primary injection current (>300 A) can magnetise busbars and CTs. Demagnetise CTs after high-current injection by gradually reducing current to zero.',
  },
  {
    id: 'pfv-hv', no: 17, name: 'Power Frequency Voltage Test — Switchgear (HV Withstand)', category: 'hv', critical: true,
    objective: 'Verify dielectric integrity of the 11 kV switchgear main circuit by applying the IEC rated power-frequency withstand voltage.',
    equipment: ['HV Test Set (50 Hz AC, capable of 28 kV AC / or 38 kV DC option)', 'Protective screens, barriers and safety signage', 'Insulation resistance meter (5 kV DC) for pre-test check'],
    procedure: [
      { step: 1, action: 'SAFETY: Erect barriers and post "HIGH VOLTAGE TEST IN PROGRESS" signs. Ensure all personnel are clear of the test zone. Earthing of non-test parts to be confirmed.' },
      { step: 2, action: 'Perform 5 kV DC insulation resistance test first (pre-test check).', expectedValue: 'IR ≥ 1000 MΩ at 5 kV DC. If IR < 1000 MΩ, investigate before applying AC Hi-pot.' },
      { step: 3, action: 'With CB OPEN, connect HV test set to one side of CB (cable side). Other side (busbar) and all earth switches to be solidly earthed.', expectedValue: 'Test voltage: 28 kV AC (rms) for 1 minute for 11 kV rated equipment (IEC 62271-200 Table 1, Um=12 kV, LIWV=75 kV, SIW=28 kV AC)' },
      { step: 4, action: 'Raise test voltage slowly (not faster than 2 kV/s) to 28 kV AC. Hold for 60 seconds.', expectedValue: 'No breakdown, no flashover, no sustained discharge during test. Leakage current stable.' },
      { step: 5, action: 'Reduce voltage slowly to zero. Discharge test object immediately through earth stick before disconnecting.' },
      { step: 6, action: 'Repeat test with CB CLOSED to test across open contacts if required by specification.', expectedValue: 'Across open contacts: may be tested at separate higher level per manufacturer — check specification' },
      { step: 7, action: 'Test with earth switch CLOSED: apply HV to busbar side with cable side earthed.', expectedValue: '28 kV AC for 60 s — no breakdown' },
      { step: 8, action: 'Record: test voltage, duration, leakage current (if measured), pass/fail for each test configuration.' },
    ],
    acceptanceCriteria: [
      '28 kV AC (power frequency) for 60 s — NO breakdown',
      'Pre-test IR: ≥ 1000 MΩ at 5 kV DC',
      'No flashover, no sustained discharge during test',
      'Post-test IR: ≥ 1000 MΩ (no degradation from pre-test value)',
    ],
    standard: 'IEC 62271-200 Table 1 (Um=12 kV: PFW = 28 kV) | IEC 60060-1 (HV test techniques) | IEEE C37.20.2',
    caution: 'LETHAL VOLTAGES. Strict HV safety procedures and PTW required. Minimum two persons. All non-test conductors MUST be solidly earthed before test.',
  },
  {
    id: 'surge-arr', no: 18, name: 'Surge Arrester IR Test', category: 'primary', critical: false,
    objective: 'Verify insulation condition of surge arresters and check for moisture ingress, contamination or physical damage.',
    equipment: ['Megger (1 kV DC for distribution class, 5 kV DC for station class)', 'Clamp meter (for leakage current)', 'Visual inspection'],
    procedure: [
      { step: 1, action: 'Visually inspect surge arrester for cracks, contamination, damaged seals and correct mounting.' },
      { step: 2, action: 'Disconnect surge arrester from circuit (disconnect earth lead if accessible, or connect test set between top terminal and earth).', expectedValue: 'Ensure arrester is isolated from line before measurement' },
      { step: 3, action: 'Apply 1 kV DC (for polymer/gapless MOA) and measure insulation resistance after 60 seconds.', expectedValue: 'IR: ≥ 1000 MΩ (for polymer housed MOA). IEC 60099-4: ≥ 1000 MΩ at 1 kV DC.' },
      { step: 4, action: 'Record initial surge arrester counter reading (discharge counter on base).', expectedValue: 'Note initial count for reference at future maintenance inspection.' },
      { step: 5, action: 'Measure leakage current at rated voltage (if AC withstand test set available).', expectedValue: 'Leakage current per manufacturer specification (typically < 1 mA resistive at rated voltage)' },
      { step: 6, action: 'Reconnect earth lead after test. Verify correct installation and tight connections.' },
    ],
    acceptanceCriteria: [
      'IR: ≥ 1000 MΩ at 1 kV DC',
      'No physical damage, cracks or contamination visible',
      'Discharge counter initial reading recorded',
      'Connections tight and correctly made',
    ],
    standard: 'IEC 60099-4 (MOA) | IEC 60099-5 (Selection) | IEEE C62.11',
  },
  {
    id: 'ict-test', no: 19, name: 'Interposing Current Transformer (ICT) IR Test', category: 'secondary', critical: false,
    objective: 'Verify insulation integrity of interposing CTs used in protection schemes (e.g. for differential protection schemes with different CT ratios).',
    equipment: ['Megger (500 V DC)', 'Multimeter', 'Micro-ohmmeter'],
    procedure: [
      { step: 1, action: 'Disconnect ICT from both primary (main CT secondary) and secondary (relay) circuits.' },
      { step: 2, action: 'Measure insulation resistance: Primary winding to Secondary winding.', expectedValue: '≥ 100 MΩ at 500 V DC' },
      { step: 3, action: 'Measure insulation resistance: Primary winding to Earth.', expectedValue: '≥ 100 MΩ at 500 V DC' },
      { step: 4, action: 'Measure insulation resistance: Secondary winding to Earth.', expectedValue: '≥ 100 MΩ at 500 V DC' },
      { step: 5, action: 'Measure primary and secondary winding resistance and compare with factory certificate.', expectedValue: 'Within ±5 % of factory values' },
      { step: 6, action: 'Perform ratio check by injecting secondary AC current and measuring output.', expectedValue: 'Ratio within ±0.5 % of nameplate ratio' },
      { step: 7, action: 'Reconnect ICT and verify correct terminal connections per the approved schematic.' },
    ],
    acceptanceCriteria: [
      'IR Primary-Secondary: ≥ 100 MΩ at 500 V DC',
      'IR Primary-Earth: ≥ 100 MΩ',
      'IR Secondary-Earth: ≥ 100 MΩ',
      'Winding resistance: ±5 % of factory',
      'Ratio: ±0.5 % of nameplate',
    ],
    standard: 'IEC 61869-1 | IEC 61869-2 | BS 3938',
  },
];

const CAT_COLORS: Record<string, string> = {
  primary:    '#7C3AED',
  secondary:  '#0891B2',
  protection: '#DC2626',
  functional: '#D97706',
  hv:         '#991B1B',
};
const CAT_LABELS: Record<string, string> = {
  primary: 'Primary Circuit', secondary: 'Secondary / Aux', protection: 'Protection', functional: 'Functional', hv: '⚠ HV Withstand',
};

type ResultMap = Record<string, { result: TResult; measured: string; remarks: string }>;

// ─── Component ───────────────────────────────────────────────────────────────
export function HVCommissioning() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ResultMap>({});
  const [projInfo, setProjInfo] = useState({ project: '', site: '', panel: '', engineer: '', date: new Date().toISOString().split('T')[0], rev: 'R0' });
  const [filterCat, setFilterCat] = useState<string>('all');

  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const setRes = (id: string, field: 'result' | 'measured' | 'remarks', val: string) =>
    setResults(p => ({ ...p, [id]: { result: '', measured: '', remarks: '', ...p[id], [field]: val } }));

  const passCount = TESTS.filter(t => results[t.id]?.result === 'PASS').length;
  const failCount = TESTS.filter(t => results[t.id]?.result === 'FAIL').length;
  const pendCount = TESTS.filter(t => !results[t.id]?.result).length;

  const filteredTests = filterCat === 'all' ? TESTS : TESTS.filter(t => t.category === filterCat);

  const handleExport = () => {
    const summaryRows = TESTS.map(t => [
      `${t.no}`, t.name, CAT_LABELS[t.category],
      results[t.id]?.result || 'PENDING',
      results[t.id]?.measured || '—',
      results[t.id]?.remarks || '—',
    ]);
    const body = `
      <h2>Project Information</h2>
      <table>
        <tr><td class="lbl">Project</td><td>${projInfo.project}</td><td class="lbl">Site</td><td>${projInfo.site}</td></tr>
        <tr><td class="lbl">Panel / Bay</td><td>${projInfo.panel}</td><td class="lbl">Test Engineer</td><td>${projInfo.engineer}</td></tr>
        <tr><td class="lbl">Test Date</td><td>${projInfo.date}</td><td class="lbl">Revision</td><td>${projInfo.rev}</td></tr>
      </table>
      <h2>Test Summary</h2>
      <div class="grid2">
        <div class="kpi-box"><div class="kpi-lbl">Total Tests</div><div class="kpi-val">${TESTS.length}</div></div>
        <div class="kpi-box"><div class="kpi-lbl">Passed</div><div class="kpi-val" style="color:#166534">${passCount}</div></div>
        <div class="kpi-box"><div class="kpi-lbl">Failed</div><div class="kpi-val" style="color:#991b1b">${failCount}</div></div>
        <div class="kpi-box"><div class="kpi-lbl">Pending</div><div class="kpi-val" style="color:#92400e">${pendCount}</div></div>
      </div>
      <h2>Test Results Schedule</h2>
      ${tableHTML(['No.', 'Test Name', 'Category', 'Result', 'Measured Value', 'Remarks'], summaryRows)}
      <h2>Detailed Procedures & Acceptance Criteria</h2>
      ${TESTS.map(t => `
        <h2>${t.no}. ${t.name} ${t.critical ? '⚠ CRITICAL' : ''}</h2>
        <p><b>Objective:</b> ${t.objective}</p>
        <p><b>Standard:</b> ${t.standard}</p>
        ${t.caution ? `<p style="color:#991b1b;font-weight:bold">⚠ CAUTION: ${t.caution}</p>` : ''}
        <p><b>Equipment:</b> ${t.equipment.join(', ')}</p>
        <table>
          <thead><tr><th>Step</th><th>Action</th><th>Expected Value / Acceptance</th></tr></thead>
          <tbody>${t.procedure.map(s => `<tr><td class="lbl">${s.step}</td><td>${s.action}</td><td class="note">${s.expectedValue ?? '—'}</td></tr>`).join('')}</tbody>
        </table>
        <p><b>Result:</b> ${results[t.id]?.result || 'PENDING'} &nbsp; <b>Measured:</b> ${results[t.id]?.measured || '—'} &nbsp; <b>Remarks:</b> ${results[t.id]?.remarks || '—'}</p>
      `).join('')}
      <h2>Sign-Off</h2>
      <table>
        <tr><td class="lbl">Test Engineer</td><td style="width:40%">_________________________</td><td class="lbl">Date</td><td>_____________</td></tr>
        <tr><td class="lbl">Witness (Client)</td><td>_________________________</td><td class="lbl">Date</td><td>_____________</td></tr>
        <tr><td class="lbl">Approved by</td><td>_________________________</td><td class="lbl">Date</td><td>_____________</td></tr>
      </table>
    `;
    downloadReport(
      'Testing & Commissioning Schedule — 11 kV Switching Station',
      `${projInfo.project} | ${projInfo.site} | ${projInfo.panel}`,
      'IEC 62271-200 · IEC 61869-2 · IEC 60255-151 · IEC 60099-4 · IEEE C37.20',
      body,
      `HV-TC-Schedule-${projInfo.panel || 'Panel'}-${projInfo.date}.pdf`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList style={{ width: 24, height: 24, color: ACCENT }} />
              <h2 style={{ color: V.txt, fontSize: 20, fontWeight: 800, margin: 0 }}>Testing & Commissioning Schedule</h2>
            </div>
            <p style={{ color: V.sec, fontSize: 13, margin: '4px 0 0' }}>11 kV Switching Station — Complete T&C Procedure with Acceptance Criteria</p>
            <p style={{ color: V.muted, fontSize: 12, margin: '3px 0 0' }}>IEC 62271-200 · IEC 61869-2 · IEC 60255-151 · IEC 60099-4 · IEEE C37.20</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Download style={{ width: 14, height: 14 }} /> Export PDF Report
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: `${passCount} Passed`, color: '#10B981', bg: '#D1FAE5' },
            { label: `${failCount} Failed`, color: '#EF4444', bg: '#FEE2E2' },
            { label: `${pendCount} Pending`, color: '#F59E0B', bg: '#FEF3C7' },
            { label: `${TESTS.length} Total`, color: ACCENT, bg: `${ACCENT}20` },
          ].map(s => (
            <div key={s.label} style={{ padding: '4px 12px', background: s.bg, borderRadius: 20, fontSize: 12, fontWeight: 700, color: s.color }}>
              {s.label}
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#10B981', width: `${passCount / TESTS.length * 100}%`, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, color: V.muted }}>{Math.round(passCount / TESTS.length * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div style={{ background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: V.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Project Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { key: 'project', label: 'Project Name' }, { key: 'site', label: 'Site / Substation' },
            { key: 'panel', label: 'Panel / Bay Ref.' }, { key: 'engineer', label: 'Test Engineer' },
            { key: 'date', label: 'Test Date', type: 'date' }, { key: 'rev', label: 'Revision' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, color: V.sec, marginBottom: 4, fontWeight: 600 }}>{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={(projInfo as Record<string, string>)[f.key]}
                onChange={e => setProjInfo(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 7, color: V.txt, fontSize: 12 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'All Tests' }, ...Object.entries(CAT_LABELS).map(([id, label]) => ({ id, label }))].map(f => (
          <button key={f.id} onClick={() => setFilterCat(f.id)} style={{ padding: '6px 14px', border: `1px solid ${filterCat === f.id ? CAT_COLORS[f.id] ?? ACCENT : V.brd}`, borderRadius: 20, background: filterCat === f.id ? (CAT_COLORS[f.id] ?? ACCENT) + '20' : V.surf, color: filterCat === f.id ? (CAT_COLORS[f.id] ?? ACCENT) : V.sec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Test List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredTests.map(test => {
          const res = results[test.id] ?? { result: '' as TResult, measured: '', remarks: '' };
          const isOpen = expanded.has(test.id);
          const catColor = CAT_COLORS[test.category];
          const resultColor = res.result === 'PASS' ? '#10B981' : res.result === 'FAIL' ? '#EF4444' : res.result === 'NA' ? '#94A3B8' : '#F59E0B';

          return (
            <div key={test.id} style={{ background: V.surf, border: `1px solid ${test.critical && !res.result ? '#EF4444' + '60' : V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Test header row */}
              <div
                onClick={() => toggle(test.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', background: isOpen ? `${catColor}08` : 'transparent' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: catColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: catColor }}>{test.no}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: V.txt }}>{test.name}</span>
                    {test.critical && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: 10 }}>⚠ CRITICAL</span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, color: catColor, background: catColor + '18', padding: '2px 8px', borderRadius: 10 }}>
                      {CAT_LABELS[test.category]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: V.muted, marginTop: 2 }}>{test.standard}</div>
                </div>

                {/* Inline result selector */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  {(['PASS', 'FAIL', 'NA'] as TResult[]).map(r => (
                    <button key={r} onClick={() => setRes(test.id, 'result', res.result === r ? '' : r)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: `1.5px solid ${res.result === r ? resultColor : V.brd}`, background: res.result === r ? resultColor + '20' : 'transparent', color: res.result === r ? resultColor : V.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {r}
                    </button>
                  ))}
                  {res.result === 'PASS' && <CheckCircle style={{ width: 18, height: 18, color: '#10B981' }} />}
                  {res.result === 'FAIL' && <XCircle style={{ width: 18, height: 18, color: '#EF4444' }} />}
                  {res.result === 'NA' && <Minus style={{ width: 18, height: 18, color: '#94A3B8' }} />}
                </div>
                {isOpen ? <ChevronDown style={{ width: 16, height: 16, color: V.muted, flexShrink: 0 }} /> : <ChevronRight style={{ width: 16, height: 16, color: V.muted, flexShrink: 0 }} />}
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${V.brd}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Objective */}
                  <div style={{ padding: '10px 14px', background: catColor + '10', border: `1px solid ${catColor}30`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Objective</div>
                    <p style={{ fontSize: 13, color: V.txt, margin: 0 }}>{test.objective}</p>
                  </div>

                  {/* Caution */}
                  {test.caution && (
                    <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, display: 'flex', gap: 8 }}>
                      <AlertTriangle style={{ width: 16, height: 16, color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', marginBottom: 3 }}>CAUTION</div>
                        <p style={{ fontSize: 12.5, color: '#7F1D1D', margin: 0 }}>{test.caution}</p>
                      </div>
                    </div>
                  )}

                  {/* Equipment */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: V.sec, marginBottom: 8 }}>Test Equipment Required</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {test.equipment.map((e, i) => (
                        <span key={i} style={{ padding: '3px 10px', background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 6, fontSize: 12, color: V.sec }}>{e}</span>
                      ))}
                    </div>
                  </div>

                  {/* Procedure */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: V.sec, marginBottom: 10 }}>Test Procedure & Acceptance Criteria</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${V.brd}`, borderRadius: 10, overflow: 'hidden' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 280px', background: catColor, padding: '8px 14px', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>No.</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Action / Procedure</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Expected Value / Acceptance Limit</span>
                      </div>
                      {test.procedure.map((s, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 280px', padding: '10px 14px', gap: 12, borderTop: `1px solid ${V.brd}`, background: i % 2 === 1 ? V.bg : 'transparent' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: catColor }}>{s.step}</span>
                          <span style={{ fontSize: 12.5, color: V.txt, lineHeight: 1.5 }}>{s.action}</span>
                          <span style={{ fontSize: 11.5, color: s.expectedValue ? '#065F46' : V.muted, background: s.expectedValue ? '#D1FAE5' : 'transparent', padding: s.expectedValue ? '4px 8px' : '0', borderRadius: 6, lineHeight: 1.4 }}>
                            {s.expectedValue ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acceptance Criteria Summary */}
                  <div style={{ padding: '12px 16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Acceptance Criteria Summary</div>
                    {test.acceptanceCriteria.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <CheckCircle style={{ width: 13, height: 13, color: '#16A34A', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12.5, color: '#166534' }}>{c}</span>
                      </div>
                    ))}
                  </div>

                  {/* Standards */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Info style={{ width: 13, height: 13, color: V.muted }} />
                    <span style={{ fontSize: 11.5, color: V.muted }}><b>Standards:</b> {test.standard}</span>
                  </div>

                  {/* Result entry */}
                  <div style={{ borderTop: `1px solid ${V.brd}`, paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: V.sec, marginBottom: 10 }}>Test Result Entry</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: V.sec, marginBottom: 4, fontWeight: 600 }}>Result</label>
                        <select value={res.result} onChange={e => setRes(test.id, 'result', e.target.value)} style={{ width: '100%', padding: '8px 10px', background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 8, color: res.result === 'PASS' ? '#10B981' : res.result === 'FAIL' ? '#EF4444' : V.txt, fontSize: 13, fontWeight: 700 }}>
                          <option value="">— Pending —</option>
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                          <option value="NA">N/A</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: V.sec, marginBottom: 4, fontWeight: 600 }}>Measured Value</label>
                        <input value={res.measured} onChange={e => setRes(test.id, 'measured', e.target.value)} placeholder="e.g. 1500 MΩ" style={{ width: '100%', padding: '8px 10px', background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 8, color: V.txt, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: V.sec, marginBottom: 4, fontWeight: 600 }}>Remarks / Deviation</label>
                        <input value={res.remarks} onChange={e => setRes(test.id, 'remarks', e.target.value)} placeholder="Any deviation or notes..." style={{ width: '100%', padding: '8px 10px', background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 8, color: V.txt, fontSize: 13 }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom sign-off note */}
      <div style={{ padding: '14px 18px', background: ACCENT + '10', border: `1px solid ${ACCENT}30`, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Printer style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: V.sec }}>
          Click <b>Export PDF Report</b> to generate a complete signed T&amp;C schedule with all procedures, measured values and sign-off area. All results entered above will be included in the report for client submission.
        </div>
      </div>
    </div>
  );
}
