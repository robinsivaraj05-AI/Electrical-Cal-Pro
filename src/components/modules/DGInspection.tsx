import React, { useState } from 'react';
import { ClipboardList, CheckSquare, Square, XSquare, MinusSquare, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

type Status = 'PENDING' | 'PASS' | 'FAIL' | 'NA';

interface CheckItem { id: string; task: string; acceptableValue: string; category: string; }

const A_CHECKLIST: CheckItem[] = [
  // Engine
  { id: 'A01', task: 'Engine Oil Level',          acceptableValue: 'Between MIN and MAX on dipstick',           category: 'Engine' },
  { id: 'A02', task: 'Engine Oil Leakage',        acceptableValue: 'No visible leaks on engine/sump',           category: 'Engine' },
  { id: 'A03', task: 'Engine Oil Pressure',       acceptableValue: '3.5–5.5 bar at rated RPM (OEM spec)',       category: 'Engine' },
  { id: 'A04', task: 'Engine Oil Colour',         acceptableValue: 'Amber to dark brown — not milky or black',  category: 'Engine' },
  { id: 'A05', task: 'Oil Contamination (Water)', acceptableValue: 'No emulsification or water droplets',       category: 'Engine' },
  // Cooling
  { id: 'A06', task: 'Coolant Level',             acceptableValue: 'Between MIN and MAX in header tank',        category: 'Cooling' },
  { id: 'A07', task: 'Coolant Leakage',           acceptableValue: 'No leaks at hoses, pump, or radiator',     category: 'Cooling' },
  { id: 'A08', task: 'Radiator Condition',        acceptableValue: 'Fins clean, no blockage or damage',        category: 'Cooling' },
  { id: 'A09', task: 'Cooling Fan Operation',     acceptableValue: 'Fan belt intact, correct tension, no noise', category: 'Cooling' },
  { id: 'A10', task: 'Coolant Temperature',       acceptableValue: '70–90°C at rated load (alarm ≥ 98°C)',     category: 'Cooling' },
  { id: 'A11', task: 'Radiator Pressure Cap',     acceptableValue: 'Cap sealing, rated pressure marked',       category: 'Cooling' },
  // Fuel
  { id: 'A12', task: 'Fuel Level',                acceptableValue: '> 25% tank capacity (critical < 10%)',     category: 'Fuel' },
  { id: 'A13', task: 'Fuel Leakage',              acceptableValue: 'No leaks at injectors, lines, or filter',  category: 'Fuel' },
  { id: 'A14', task: 'Fuel Filter Condition',     acceptableValue: 'Clean, no blocked or wet housing',         category: 'Fuel' },
  { id: 'A15', task: 'Water Separator',           acceptableValue: 'Bowl clear — no water accumulation',       category: 'Fuel' },
  { id: 'A16', task: 'Fuel Lines & Fittings',     acceptableValue: 'No chafing, corrosion or loose fittings',  category: 'Fuel' },
  // Battery
  { id: 'A17', task: 'Battery Voltage',           acceptableValue: '24–27.6 V (24V system) at rest',           category: 'Battery' },
  { id: 'A18', task: 'Battery Terminal Tightness',acceptableValue: 'Terminals tight, no corrosion or sulphation', category: 'Battery' },
  { id: 'A19', task: 'Battery Charger Output',    acceptableValue: 'Float charge 27.0–27.6 V (24V system)',    category: 'Battery' },
  { id: 'A20', task: 'Electrolyte Level',         acceptableValue: 'Above plates — top up with distilled water', category: 'Battery' },
  { id: 'A21', task: 'Charging Voltage',          acceptableValue: 'Charging alternator 28.0–29.0 V',          category: 'Battery' },
  // Alternator
  { id: 'A22', task: 'Output Voltage',            acceptableValue: '415 ± 5% (394–436 V) three-phase',         category: 'Alternator' },
  { id: 'A23', task: 'Output Frequency',          acceptableValue: '50 ± 0.5 Hz (49.5–50.5 Hz)',               category: 'Alternator' },
  { id: 'A24', task: 'Output Current',            acceptableValue: '≤ Rated Full Load Current per nameplate',  category: 'Alternator' },
  { id: 'A25', task: 'Bearing Condition',         acceptableValue: 'No abnormal noise or vibration from bearing', category: 'Alternator' },
  { id: 'A26', task: 'AVR Indication',            acceptableValue: 'AVR LED healthy, voltage stable',          category: 'Alternator' },
  { id: 'A27', task: 'Terminal Tightness',        acceptableValue: 'All output terminals tight, no discolouration', category: 'Alternator' },
  // Control Panel
  { id: 'A28', task: 'Controller Status',         acceptableValue: 'Ready/Healthy displayed, no fault codes',  category: 'Control Panel' },
  { id: 'A29', task: 'Emergency Stop Button',     acceptableValue: 'Not pressed, released, guarded',           category: 'Control Panel' },
  { id: 'A30', task: 'Alarm Indications',         acceptableValue: 'No active alarms — all cleared',           category: 'Control Panel' },
  { id: 'A31', task: 'Trip History Review',       acceptableValue: 'No unexplained trips since last check',    category: 'Control Panel' },
  { id: 'A32', task: 'Meters / Instruments',      acceptableValue: 'All meters reading, no stuck pointers',    category: 'Control Panel' },
  // Mechanical
  { id: 'A33', task: 'Engine Vibration',          acceptableValue: '< 4 mm/s RMS at rated load (ISO 10816)',   category: 'Mechanical' },
  { id: 'A34', task: 'Unusual Noise',             acceptableValue: 'No knocking, rattling, or abnormal exhaust', category: 'Mechanical' },
  { id: 'A35', task: 'Anti-Vibration Mounts',     acceptableValue: 'Mounts intact, not oil soaked or cracked', category: 'Mechanical' },
  { id: 'A36', task: 'Foundation Bolts',          acceptableValue: 'All bolts tight, no movement observed',    category: 'Mechanical' },
  { id: 'A37', task: 'Exhaust System',            acceptableValue: 'No excessive smoke, no leaks at joints',   category: 'Mechanical' },
  // Electrical
  { id: 'A38', task: 'Main CB Status',            acceptableValue: 'Correct position (ON/Standby per procedure)', category: 'Electrical' },
  { id: 'A39', task: 'Earth Connection',          acceptableValue: 'Earth straps in place, all connections tight', category: 'Electrical' },
  { id: 'A40', task: 'Cable Tightness',           acceptableValue: 'No loose lugs or overheated cables',       category: 'Electrical' },
  // Safety
  { id: 'A41', task: 'Fire Extinguisher',         acceptableValue: 'In position, charged, within inspection date', category: 'Safety' },
  { id: 'A42', task: 'Room Ventilation',          acceptableValue: 'Louvers open, fans operational',           category: 'Safety' },
  { id: 'A43', task: 'Warning Labels',            acceptableValue: 'All warning labels visible and legible',   category: 'Safety' },
  { id: 'A44', task: 'LOTO Provisions',           acceptableValue: 'Lockout padlock and hasp available',       category: 'Safety' },
  { id: 'A45', task: 'Housekeeping',              acceptableValue: 'Room clean, no oil spills, clear access',  category: 'Safety' },
];

const B_CHECKLIST: CheckItem[] = [
  { id: 'B01', task: 'Engine Oil Sample Analysis',     acceptableValue: 'Send to lab — Fe <100ppm, Pb <20ppm, Cr <10ppm, viscosity within spec', category: 'Oil' },
  { id: 'B02', task: 'Coolant Quality Test',           acceptableValue: 'pH 7.5–10.5, freeze point per climate, DCA concentration per OEM',       category: 'Cooling' },
  { id: 'B03', task: 'Coolant Inhibitor Level',        acceptableValue: 'SCA (Supplemental Coolant Additive) per OEM DCA4 or equivalent',         category: 'Cooling' },
  { id: 'B04', task: 'Battery Load Test',              acceptableValue: '> 80% capacity at rated load current (per IEEE 450)',                     category: 'Battery' },
  { id: 'B05', task: 'Battery Specific Gravity',       acceptableValue: '1.27–1.29 fully charged (flooded type)',                                  category: 'Battery' },
  { id: 'B06', task: 'Fuel Filter Replacement',        acceptableValue: 'Replace at 250–500 hours or monthly (whichever first)',                   category: 'Fuel' },
  { id: 'B07', task: 'Air Filter Inspection',          acceptableValue: 'Replace if restriction indicator triggered or ΔP > 3.5 kPa',              category: 'Engine' },
  { id: 'B08', task: 'Turbocharger Inspection',        acceptableValue: 'No axial or radial play, no oil leakage from seals',                      category: 'Engine' },
  { id: 'B09', task: 'Governor Operation Test',        acceptableValue: 'Frequency stable 49.5–50.5 Hz under load step per ISO 8528-5',           category: 'Performance' },
  { id: 'B10', task: 'AVR Voltage Regulation Test',   acceptableValue: 'Voltage ± 1% at no load and full load (steady state)',                    category: 'Alternator' },
  { id: 'B11', task: 'Insulation Resistance Test',     acceptableValue: 'Alternator winding IR > 10 MΩ at 500V DC (per IEEE 43)',                 category: 'Alternator' },
  { id: 'B12', task: 'Alternator Bearing Greasing',   acceptableValue: 'Grease per OEM schedule (typically 500 hr interval)',                     category: 'Alternator' },
  { id: 'B13', task: 'Starter Motor Inspection',       acceptableValue: 'Starter engages cleanly, current draw within spec',                       category: 'Engine' },
  { id: 'B14', task: 'Charging Alternator Check',      acceptableValue: 'Output 27.2–28.8 V (24V system) under engine running',                   category: 'Battery' },
  { id: 'B15', task: 'Engine Mount Inspection',        acceptableValue: 'No cracks, sagging, or oil contamination',                               category: 'Mechanical' },
  { id: 'B16', task: 'Radiator Cleaning',              acceptableValue: 'Fins clean — blow from inside out with compressed air',                   category: 'Cooling' },
  { id: 'B17', task: 'Exhaust System Inspection',      acceptableValue: 'No corrosion, cracks, or leaks at joints',                               category: 'Mechanical' },
  { id: 'B18', task: 'Flexible Exhaust Pipe',         acceptableValue: 'No fatigue cracks or excessive movement',                                 category: 'Mechanical' },
  { id: 'B19', task: 'Silencer Condition',             acceptableValue: 'No corrosion through, discharge clear',                                   category: 'Mechanical' },
  { id: 'B20', task: 'Control Panel Cleaning',         acceptableValue: 'No dust on relays, all ventilation holes clear',                          category: 'Control Panel' },
  { id: 'B21', task: 'Earth Resistance Test',         acceptableValue: '< 1 Ω (per IS 3043 / IEEE 80)',                                          category: 'Electrical' },
  { id: 'B22', task: '25% Load Test (No Load Run)',   acceptableValue: 'Run 15 min — frequency/voltage stable, no alarms',                        category: 'Performance' },
  { id: 'B23', task: 'ATS / AMF Test',                acceptableValue: 'Transfer within rated time (NFPA 110 Lev 1: 10 sec, Lev 2: 60 sec)',      category: 'Performance' },
  { id: 'B24', task: 'Synchronizing Check (if paralleled)', acceptableValue: 'Sync within ±1% voltage, ±0.5% freq, ±10° phase angle',             category: 'Performance' },
];

const C_CHECKLIST: CheckItem[] = [
  { id: 'C01', task: 'Engine Compression Test',         acceptableValue: '> 90% of rated compression (OEM spec), < 10% variation between cylinders', category: 'Engine' },
  { id: 'C02', task: 'Cylinder Liner Inspection',       acceptableValue: 'No scoring, no excessive taper or ovality beyond OEM limit',              category: 'Engine' },
  { id: 'C03', task: 'Injector Calibration & Test',     acceptableValue: 'Opening pressure per OEM (typically 200–350 bar), spray pattern correct',  category: 'Fuel System' },
  { id: 'C04', task: 'Fuel Injection Pump Calibration', acceptableValue: 'Rack position, delivery volume per OEM test bench specification',          category: 'Fuel System' },
  { id: 'C05', task: 'Turbocharger Overhaul',           acceptableValue: 'Axial play < 0.12mm, radial play < 0.15mm (OEM spec)',                    category: 'Engine' },
  { id: 'C06', task: 'Main Engine Bearing Check',       acceptableValue: 'Clearance within OEM tolerance — replace if out of spec',                 category: 'Engine' },
  { id: 'C07', task: 'Alternator Stator IR (PI Test)',  acceptableValue: 'IR > 100 MΩ (1 kV DC), PI > 2.0 (IEEE 43)',                              category: 'Alternator' },
  { id: 'C08', task: 'Rotor IR Test',                   acceptableValue: 'Rotor winding IR > 10 MΩ at 500V DC',                                    category: 'Alternator' },
  { id: 'C09', task: 'Alternator Bearing Replacement',  acceptableValue: 'Replace per OEM interval or condition — grease type per OEM',             category: 'Alternator' },
  { id: 'C10', task: 'Bearing Vibration (Running)',     acceptableValue: '< 2.8 mm/s RMS velocity (ISO 10816-3 Class II)',                          category: 'Alternator' },
  { id: 'C11', task: 'Bearing Temperature',             acceptableValue: '< 70°C (rise above ambient < 40°C)',                                      category: 'Alternator' },
  { id: 'C12', task: 'Shaft Alignment Check',           acceptableValue: 'Radial misalignment < 0.05mm, angular < 0.05mm/100mm',                   category: 'Mechanical' },
  { id: 'C13', task: 'Dynamic Balancing (Rotor)',       acceptableValue: 'Balance quality G 6.3 (ISO 1940) for assembled rotor',                    category: 'Alternator' },
  { id: 'C14', task: 'Governor Calibration',            acceptableValue: 'Speed regulation < ±2% (Class G2, ISO 8528-5)',                           category: 'Engine' },
  { id: 'C15', task: 'AVR Calibration',                 acceptableValue: 'Voltage regulation < ±1% (Class G1, ISO 8528-3)',                         category: 'Alternator' },
  { id: 'C16', task: 'Protection Relay Test',           acceptableValue: 'All functions (OV, UV, OF, UF, RP, EF, OC) operate within settings ±5%', category: 'Protection' },
  { id: 'C17', task: 'Main Circuit Breaker Test',       acceptableValue: 'Contact resistance < 100 μΩ, trip time within spec',                     category: 'Electrical' },
  { id: 'C18', task: 'Cable Insulation Resistance',     acceptableValue: '> 1 MΩ for LV cables (IEEE 43), > 100 MΩ for MV cables',                 category: 'Electrical' },
  { id: 'C19', task: 'Earth System Resistance',         acceptableValue: '< 1 Ω (IS 3043), < 0.5 Ω for critical installations',                    category: 'Electrical' },
  { id: 'C20', task: 'Thermographic Survey',            acceptableValue: 'No hot spots > ΔT 15°C above ambient on any connection',                 category: 'Electrical' },
  { id: 'C21', task: '100% Load Bank Test (1 hour)',    acceptableValue: 'Voltage ±5%, frequency ±5%, no alarms, stable temperature',               category: 'Performance' },
  { id: 'C22', task: '110% Load Test (1 hour)',         acceptableValue: 'Performs at 110% without trip per ISO 8528-5',                            category: 'Performance' },
  { id: 'C23', task: 'Load Acceptance Test',            acceptableValue: 'Accept 100% load in single step — voltage/freq dip within ISO 8528-5 limits', category: 'Performance' },
  { id: 'C24', task: 'Load Rejection Test',             acceptableValue: 'Reject 100% load — frequency overshoot < 10%, recover within 5 sec',     category: 'Performance' },
  { id: 'C25', task: 'Performance Test Report',         acceptableValue: 'Full factory acceptance test (FAT) record per ISO 8528',                  category: 'Performance' },
];

type Tab = 'A' | 'B' | 'C';

const CHECKLISTS: Record<Tab, { label: string; items: CheckItem[]; color: string; standard: string }> = {
  A: { label: 'A — Daily Inspection', items: A_CHECKLIST, color: '#059669', standard: 'NFPA 110 / ISO 8528 / OEM Daily Walkdown' },
  B: { label: 'B — Monthly Inspection', items: B_CHECKLIST, color: '#D97706', standard: 'NFPA 110 / ISO 8528 / IEEE 450' },
  C: { label: 'C — Annual / Shutdown Overhaul', items: C_CHECKLIST, color: '#DC2626', standard: 'ISO 8528 / IEC 60034 / IEEE 43 / OEM Overhaul Manual' },
};

function StatusBtn({ status, target, onSet, color }: { status: Status; target: Status; onSet: () => void; color: string }) {
  const active = status === target;
  const icons: Record<Status, React.ElementType> = { PASS: CheckSquare, FAIL: XSquare, NA: MinusSquare, PENDING: Square };
  const colors: Record<Status, string> = { PASS: '#059669', FAIL: '#DC2626', NA: '#6B7280', PENDING: V.muted };
  const Icon = icons[target];
  return (
    <button onClick={onSet} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${active ? colors[target] : V.brdM}`, background: active ? colors[target] + '20' : 'transparent', cursor: 'pointer', color: active ? colors[target] : V.muted, fontSize: 11, fontWeight: active ? 700 : 400 }}>
      <Icon style={{ width: 13, height: 13 }} /> {target}
    </button>
  );
}

export function DGInspection() {
  const [tab, setTab] = useState<Tab>('A');
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [inspector, setInspector] = useState('');
  const [dgId, setDgId] = useState('DG-01');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const ch = CHECKLISTS[tab];
  const cats = [...new Set(ch.items.map(i => i.category))];
  const setStatus = (id: string, s: Status) => setStatuses(p => ({ ...p, [id]: s }));

  const handleDownload = () => {
    const rows = ch.items.map(item => {
      const st = statuses[item.id] ?? 'PENDING';
      const badge = st === 'PASS' ? '<span class="badge b-pass">PASS</span>' : st === 'FAIL' ? '<span class="badge b-fail">FAIL</span>' : st === 'NA' ? '<span class="badge b-na">N/A</span>' : '<span class="badge b-warn">PENDING</span>';
      return [item.id, item.task, badge, remarks[item.id] || ''];
    });
    const failItems = ch.items.filter(i => statuses[i.id] === 'FAIL');
    const defectHtml = failItems.length > 0 ? `<h2>Defect Summary — ${failItems.length} items failed</h2>` + tableHTML(['ID','Task','Remark'], failItems.map(i => [i.id, i.task, remarks[i.id] || 'No remark'])) : '';
    const body = `
      <h2>Inspection Details — ${ch.label}</h2>
      <p style="margin-bottom:8px;font-size:9pt;color:#64748b">Inspector: ${inspector || '—'} &nbsp;|&nbsp; DG ID: ${dgId} &nbsp;|&nbsp; Date: ${date}</p>
      <p style="margin-bottom:10px;font-size:9pt;padding:6px 10px;background:#eff6ff;border-radius:5px">
        PASS: <strong>${pass}</strong> &nbsp; FAIL: <strong>${fail}</strong> &nbsp; N/A: <strong>${na}</strong> &nbsp; PENDING: <strong>${pending}</strong> &nbsp;|&nbsp; Total: ${total}
      </p>
      ${tableHTML(['ID','Task / Activity','Status','Remark / Observation'], rows)}
      ${defectHtml}`;
    downloadReport(`DG Inspection Report — ${ch.label}`, `Inspector: ${inspector || 'N/A'} | DG: ${dgId} | Date: ${date}`, ch.standard, body, `DG-Inspection-${tab}-${date}.pdf`);
  };

  const pass    = ch.items.filter(i => statuses[i.id] === 'PASS').length;
  const fail    = ch.items.filter(i => statuses[i.id] === 'FAIL').length;
  const na      = ch.items.filter(i => statuses[i.id] === 'NA').length;
  const pending = ch.items.length - pass - fail - na;
  const total   = ch.items.length;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={ClipboardList} title="DG INSPECTION CHECKLISTS" subtitle="NFPA 110 · ISO 8528 · OEM Recommendations · A/B/C Checklists" accentColor={ACCENT} />

      {/* Header Fields */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[['DG Asset ID', dgId, setDgId, 'text'], ['Inspector Name', inspector, setInspector, 'text'], ['Inspection Date', date, setDate, 'date']].map(([l, v, fn, t]) => (
          <div key={String(l)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
            <input type={String(t)} value={String(v)} onChange={e => (fn as (v: string) => void)(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: V.surf, border: `1px solid ${V.brdM}`, borderRadius: 7, fontSize: 13, color: V.txt, outline: 'none' }} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 11, color: V.muted }}>Progress: <strong style={{ color: ch.color }}>{pass}/{total - na}</strong> items verified</div>
          <div style={{ height: 6, background: V.brdM, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ height: '100%', background: ch.color, width: `${total > na ? (pass / (total - na)) * 100 : 0}%`, borderRadius: 3 }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 5, background: V.surf, borderRadius: 10, border: `1px solid ${V.brdM}`, marginBottom: 18 }}>
        {(Object.entries(CHECKLISTS) as [Tab, typeof ch][]).map(([key, val]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === key ? val.color : 'transparent', color: tab === key ? '#fff' : V.sec, fontWeight: tab === key ? 700 : 500, fontSize: 13 }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[['PASS', pass, '#059669'], ['FAIL', fail, '#DC2626'], ['N/A', na, '#6B7280'], ['Pending', pending, V.muted]].map(([l, n, c]) => (
          <div key={String(l)} style={{ padding: '10px 14px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 9, textAlign: 'center', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: String(c) }}>{n}</div>
            <div style={{ fontSize: 11, color: V.muted }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ch.color }}>Reference Standard: {ch.standard}</div>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: ch.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 13, height: 13 }} /> Download Report
        </button>
      </div>

      {cats.map((cat) => (
        <div key={cat} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: ch.color + '18', padding: '9px 16px', borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 800, color: ch.color, letterSpacing: '0.06em' }}>{cat.toUpperCase()}</div>
          {ch.items.filter(i => i.category === cat).map((item) => {
            const st = statuses[item.id] ?? 'PENDING';
            return (
              <div key={item.id} style={{ borderBottom: `1px solid ${V.brdM}`, padding: '10px 16px', background: st === 'FAIL' ? '#DC262608' : st === 'PASS' ? '#05966908' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: V.muted, minWidth: 36, paddingTop: 2 }}>{item.id}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: V.txt, marginBottom: 3 }}>{item.task}</div>
                    <div style={{ fontSize: 11, color: V.muted }}>Acceptable: {item.acceptableValue}</div>
                    {st === 'FAIL' && (
                      <input value={remarks[item.id] ?? ''} onChange={e => setRemarks(p => ({ ...p, [item.id]: e.target.value }))}
                        placeholder="Enter observation / defect detail…"
                        style={{ marginTop: 6, width: '100%', boxSizing: 'border-box', padding: '6px 10px', background: '#DC262610', border: '1px solid #DC262640', borderRadius: 6, fontSize: 12, color: V.txt, outline: 'none' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {(['PASS', 'FAIL', 'NA'] as Status[]).map(s => (
                      <StatusBtn key={s} status={st} target={s} onSet={() => setStatus(item.id, s)} color={ch.color} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {fail > 0 && (
        <div style={{ background: '#DC262610', border: '2px solid #DC262640', borderRadius: 12, padding: '16px 20px', marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginBottom: 10 }}>⚠ DEFECT SUMMARY — {fail} Items Failed</div>
          {ch.items.filter(i => statuses[i.id] === 'FAIL').map(i => (
            <div key={i.id} style={{ fontSize: 12, color: V.sec, marginBottom: 4, padding: '6px 10px', background: '#DC262608', borderRadius: 6 }}>
              <strong>{i.id} — {i.task}:</strong> {remarks[i.id] || 'No remark entered'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
