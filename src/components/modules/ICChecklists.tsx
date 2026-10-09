import React, { useState } from 'react';
import { ClipboardList, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#14B8A6';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

type Status = 'PENDING' | 'PASS' | 'FAIL' | 'NA';

interface CheckItem { id: string; category: string; description: string; note?: string }

const DAILY: CheckItem[] = [
  { id:'D01', category:'Pressure Instruments', description:'All pressure gauges — readable, no cracked glass, correct range' },
  { id:'D02', category:'Pressure Instruments', description:'Pressure transmitters — no alarms, healthy LED, correct 4-20mA output' },
  { id:'D03', category:'Pressure Instruments', description:'Impulse lines — no leaks, no blockage, root valves open' },
  { id:'D04', category:'Pressure Instruments', description:'Pressure switches — tested if possible, or verified by alarm status' },
  { id:'Flow Instruments', category:'Flow Instruments', description:'Flow transmitters — healthy reading, no fault codes' },
  { id:'D05', category:'Flow Instruments', description:'Flow transmitters — healthy reading, no fault codes' },
  { id:'D06', category:'Flow Instruments', description:'Flowmeter totalisers — running, values reasonable' },
  { id:'D07', category:'Temperature Instruments', description:'Temperature transmitters — reading plausible for process conditions' },
  { id:'D08', category:'Temperature Instruments', description:'TC head terminals — no corrosion visible at terminal entries' },
  { id:'D09', category:'Level Instruments', description:'Level transmitters — reading within expected range' },
  { id:'D10', category:'Level Instruments', description:'Level gauge glasses — clean, readable, drain/isolate valves correct' },
  { id:'D11', category:'Control Valves', description:'All control valves — position matches controller output, no hunting' },
  { id:'D12', category:'Control Valves', description:'Air supply to positioners — FRL filter bowl clean, correct pressure' },
  { id:'D13', category:'Control Valves', description:'Valve positioners — feedback signal healthy, no I/P fault' },
  { id:'D14', category:'Instrument Air', description:'Instrument air header pressure — within specified range (typically 5–7 bar)' },
  { id:'D15', category:'Instrument Air', description:'Air filter separators/driers — no excessive drain activity, no water carry-over' },
  { id:'D16', category:'Instrument Air', description:'Local filter regulators on critical instruments — pressure correct', note:'Set point per tag spec' },
  { id:'D17', category:'Solenoid Valves', description:'Solenoid valves — energised state matches interlock logic as expected' },
  { id:'D18', category:'Solenoid Valves', description:'SV coil temperature — not excessively hot to touch on normally energised types' },
  { id:'D19', category:'Field Indicators', description:'Field-mounted indicators — reading, no cracked display or water ingress' },
  { id:'D20', category:'PLC / DCS Status', description:'PLC OK/Healthy indicator — no faults or communications alarms' },
  { id:'D21', category:'PLC / DCS Status', description:'Scan time within limits — no CPU overload' },
  { id:'D22', category:'PLC / DCS Status', description:'Active alarms reviewed — no unacknowledged high-priority alarms unattended' },
  { id:'D23', category:'SCADA / HMI', description:'SCADA trending — all critical tags updating live, no stale data' },
  { id:'D24', category:'SCADA / HMI', description:'HMI displays loading correctly — no communication timeouts' },
  { id:'D25', category:'UPS & Power Supplies', description:'UPS status — on mains, battery healthy, no bypass alarm' },
  { id:'D26', category:'UPS & Power Supplies', description:'24VDC panel power supplies — green OK LED, voltages within spec' },
  { id:'D27', category:'Control Panels', description:'Panel cabinet temperatures — within acceptable range (< 40°C)' },
  { id:'D28', category:'Control Panels', description:'Panel cooling fans — running, no excessive noise or vibration' },
  { id:'D29', category:'Control Panels', description:'Cable condition at panels — no visible damage, strain, or overheating marks' },
  { id:'D30', category:'Housekeeping & Safety', description:'Junction boxes — lids secured, no water ingress evident' },
  { id:'D31', category:'Housekeeping & Safety', description:'Instrument air leaks — no audible leaks in field' },
  { id:'D32', category:'Housekeeping & Safety', description:'Housekeeping — area around instruments clean, no build-up blocking access' },
];

const MONTHLY: CheckItem[] = [
  { id:'M01', category:'Calibration Checks', description:'Selected pressure transmitters — calibration spot-check using reference gauge' },
  { id:'M02', category:'Calibration Checks', description:'Temperature transmitters — cross-check with portable reference (mA output verify)' },
  { id:'M03', category:'Calibration Checks', description:'Flow transmitters — check zero and span if process allows' },
  { id:'M04', category:'Control Valves', description:'Control valve stroke verification — 0%, 50%, 100% position vs controller' },
  { id:'M05', category:'Control Valves', description:'Positioner air consumption — no excessive leakage noted' },
  { id:'M06', category:'Control Valves', description:'Packing gland — no process leakage around stem' },
  { id:'M07', category:'Impulse Lines', description:'Impulse line draining / flushing (if process-safe to do so)' },
  { id:'M08', category:'Impulse Lines', description:'Manifold valves — operate correctly, no seizure, valve integrity' },
  { id:'M09', category:'Instrument Air', description:'Instrument air quality test — dew point, oil content check (or filter change if due)' },
  { id:'M10', category:'Instrument Air', description:'Air compressor hours and service schedule — reviewed' },
  { id:'M11', category:'Electrical & Grounding', description:'Panel cable terminations — torque-check selected terminals' },
  { id:'M12', category:'Electrical & Grounding', description:'Instrument earth continuity — spot-check key instruments' },
  { id:'M13', category:'Electrical & Grounding', description:'Panel interior cleaning — dust removal from panels and marshalling cabinets' },
  { id:'M14', category:'UPS & Power', description:'UPS battery test — self-test run and result verified' },
  { id:'M15', category:'UPS & Power', description:'Redundant power supply switchover — tested (if dual PSU available)' },
  { id:'M16', category:'PLC / DCS', description:'PLC program backup — current logic backed up to off-site server' },
  { id:'M17', category:'PLC / DCS', description:'SCADA/DCS historian — backup verified' },
  { id:'M18', category:'Alarms & Interlocks', description:'Alarm rationalization review — confirmed no suppressed or bypassed alarms' },
  { id:'M19', category:'Alarms & Interlocks', description:'Safety interlock status — SIS bypass/inhibit register reviewed' },
  { id:'M20', category:'Network & Communication', description:'Fieldbus/Profibus/HART network health — diagnostic scan run' },
  { id:'M21', category:'Network & Communication', description:'Network switches and routers — indicator lights healthy, no CRC errors' },
  { id:'M22', category:'Fire & Gas', description:'Fire/Gas detection system — monthly self-test function check per NFPA 72' },
];

const ANNUAL: CheckItem[] = [
  { id:'A01', category:'Full Calibration', description:'All pressure transmitters — full 5-point calibration with certified reference' },
  { id:'A02', category:'Full Calibration', description:'All temperature transmitters — full calibration, TC/RTD replaced if drift >tolerance' },
  { id:'A03', category:'Full Calibration', description:'All flow transmitters — calibration verification, DP zeroing' },
  { id:'A04', category:'Full Calibration', description:'All level transmitters — range calibration, density correction verified' },
  { id:'A05', category:'Full Calibration', description:'All pressure gauges — calibrate against master gauge, condemn if failed' },
  { id:'A06', category:'Control Valves', description:'Control valve overhauled — packing, seat, plug inspection as per ANSI/FCI 70-2' },
  { id:'A07', category:'Control Valves', description:'Positioner full stroke test — HART diagnostics run and documented' },
  { id:'A08', category:'Safety Instruments', description:'Pressure relief valves — bench-tested against set pressure, per API 576' },
  { id:'A09', category:'Safety Instruments', description:'SIS proof testing — all SIF loops tested per IEC 61511 proof test procedure' },
  { id:'A10', category:'Safety Instruments', description:'ESD/PSD system — full shutdown test (planned), response time measured' },
  { id:'A11', category:'PLC / DCS', description:'PLC/DCS emergency shutdown test — full simulated ESD sequence tested' },
  { id:'A12', category:'PLC / DCS', description:'SCADA backup restore — restore tested on test server, recovery time measured' },
  { id:'A13', category:'PLC / DCS', description:'Redundancy failover test — CPU, I/O, power switchover tested under controlled conditions' },
  { id:'A14', category:'Network & Cyber', description:'Network audit — port scan, unused services disabled, firmware updated' },
  { id:'A15', category:'UPS & Power', description:'UPS battery capacity test — full discharge test, replace if < 80% capacity' },
  { id:'A16', category:'Cable Testing', description:'Instrument cable IR test — megger test all critical instrument cables' },
  { id:'A17', category:'Cable Testing', description:'Earth resistance test — all earth electrodes measured, < 1 Ω target' },
  { id:'A18', category:'Thermography', description:'Electrical thermography survey — panel connections, cable tray, junction boxes' },
  { id:'A19', category:'Panel Inspection', description:'Control panel full internal inspection — connections, insulation, components, labels' },
  { id:'A20', category:'Panel Inspection', description:'Marshalling cabinet inspection — terminal labelling, spare capacity review' },
  { id:'A21', category:'Documentation', description:'Instrument index — updated with any changes made during the year' },
  { id:'A22', category:'Documentation', description:'Cause & Effect matrix — reviewed and updated for any process/interlock changes' },
  { id:'A23', category:'Documentation', description:'P&ID walk-down — field-verify P&IDs are as-built, update if differences found' },
  { id:'A24', category:'Performance Test', description:'Instrument performance test — loop response time, accuracy vs design basis' },
  { id:'A25', category:'Master Calibration', description:'Master/reference instruments — calibration certificates renewed, traceability verified' },
];

type Tab = 'daily' | 'monthly' | 'annual';
const CHECKLISTS: Record<Tab, CheckItem[]> = { daily: DAILY, monthly: MONTHLY, annual: ANNUAL };
const TAB_LABELS: Record<Tab, string> = { daily: 'Daily (32 Items)', monthly: 'Monthly (22 Items)', annual: 'Annual (25 Items)' };

export function ICChecklists() {
  const [tab, setTab] = useState<Tab>('daily');
  const [statuses, setStatuses] = useState<Record<string,Status>>({});
  const [remarks, setRemarks] = useState<Record<string,string>>({});
  const [inspector, setInspector] = useState('');
  const [plant, setPlant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const list = CHECKLISTS[tab];
  const cats = [...new Set(list.map(i => i.category))];
  const total = list.length;
  const passed  = list.filter(i => statuses[i.id] === 'PASS').length;
  const failed  = list.filter(i => statuses[i.id] === 'FAIL').length;
  const naCount = list.filter(i => statuses[i.id] === 'NA').length;
  const pending = total - passed - failed - naCount;

  const setStatus = (id: string, s: Status) => setStatuses(p => ({ ...p, [id]: p[id] === s ? 'PENDING' : s }));
  const setRemark = (id: string, r: string) => setRemarks(p => ({ ...p, [id]: r }));

  const StatusBtn = ({ id, s, label, color }: { id: string; s: Status; label: string; color: string }) => (
    <button onClick={() => setStatus(id, s)} style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: statuses[id] === s ? color : 'transparent', color: statuses[id] === s ? '#fff' : V.muted, border: `1.5px solid ${statuses[id] === s ? color : V.brdM}` }}>{label}</button>
  );

  const handleDownload = () => {
    const rows = list.map(item => [item.id, item.category, item.description, statuses[item.id] ?? 'PENDING', remarks[item.id] ?? '']);
    const defects = list.filter(i => statuses[i.id] === 'FAIL');
    const defectRows = defects.map(i => [i.id, i.description, remarks[i.id] ?? '—']);
    const header = `<h2>${TAB_LABELS[tab]} Inspection Summary</h2>
<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
<tr><td class="lbl">Plant</td><td class="val">${plant || '—'}</td></tr>
<tr><td class="lbl">Inspector</td><td class="val">${inspector || '—'}</td></tr>
<tr><td class="lbl">Date</td><td class="val">${date}</td></tr>
<tr><td class="lbl">Total Items</td><td class="val">${total}</td></tr>
<tr><td class="lbl">Pass</td><td class="val" style="color:#059669">${passed}</td></tr>
<tr><td class="lbl">Fail</td><td class="val" style="color:#DC2626">${failed}</td></tr>
<tr><td class="lbl">N/A</td><td class="val">${naCount}</td></tr>
</tbody></table>`;
    const checklistHTML = `<h2>Checklist Results</h2>${tableHTML(['ID','Category','Description','Status','Remarks'], rows)}`;
    const defectHTML = defects.length > 0 ? `<h2>Defects / Actions Required</h2>${tableHTML(['ID','Description','Action'], defectRows)}` : '';
    downloadReport(
      `I&C ${tab.charAt(0).toUpperCase()+tab.slice(1)} Inspection Checklist`,
      `Plant: ${plant || '—'} · Inspector: ${inspector || '—'} · Date: ${date}`,
      'ISA-51.1 · IEC 61511 · NFPA 72 · API 576 · IEC 60381 · ISO 9001',
      header + checklistHTML + defectHTML,
      `IC-${tab}-Checklist-${date}.pdf`
    );
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={ClipboardList} title="I&C INSPECTION CHECKLISTS" subtitle="Daily · Monthly · Annual · ISA-51.1 · IEC 61511 · NFPA 72 · API 576" accentColor={ACCENT} />

      {/* Header Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Plant / Location', plant, setPlant], ['Inspector Name', inspector, setInspector]].map(([label, val, set]) => (
          <div key={label as string}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label as string}</div>
            <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Inspection Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleDownload} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Download style={{ width: 13, height: 13 }} /> Download Report
          </button>
        </div>
      </div>

      {/* Tab Selection */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: V.surf, borderRadius: 10, padding: 6, border: `1px solid ${V.brdM}` }}>
        {(['daily','monthly','annual'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 12px', borderRadius: 7, background: tab === t ? ACCENT : 'transparent', color: tab === t ? '#fff' : V.sec, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 500 }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: V.txt }}>{tab.charAt(0).toUpperCase()+tab.slice(1)} Inspection Progress</span>
          <span style={{ fontSize: 12, color: V.muted }}>{total - pending} / {total} completed</span>
        </div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
          <div style={{ width: `${(passed/total)*100}%`, background: '#059669' }} />
          <div style={{ width: `${(failed/total)*100}%`, background: '#DC2626' }} />
          <div style={{ width: `${(naCount/total)*100}%`, background: '#64748B' }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          {[['PASS',`${passed}`,'#059669'],['FAIL',`${failed}`,'#DC2626'],['N/A',`${naCount}`,'#64748B'],['Pending',`${pending}`,'#D97706']].map(([l,v,c]) => (
            <span key={l} style={{ fontSize: 11, color: c as string }}><strong>{v}</strong> {l}</span>
          ))}
        </div>
      </div>

      {/* Checklist by Category */}
      {cats.map(cat => {
        const items = list.filter(i => i.category === cat);
        const catFail = items.filter(i => statuses[i.id] === 'FAIL').length;
        return (
          <div key={cat} style={{ marginBottom: 14, background: V.bg, border: `1.5px solid ${catFail > 0 ? '#DC2626' : V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: catFail > 0 ? '#DC262618' : V.surf, borderBottom: `1px solid ${V.brdM}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: catFail > 0 ? '#DC2626' : V.txt }}>{cat}</span>
              <span style={{ fontSize: 11, color: V.muted }}>{items.length} items</span>
            </div>
            {items.map((item, idx) => (
              <div key={item.id} style={{ padding: '9px 16px', borderBottom: idx < items.length-1 ? `1px solid ${V.brdM}` : 'none', background: statuses[item.id] === 'FAIL' ? '#DC262608' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontFamily: V.mono, fontSize: 10, fontWeight: 700, color: V.muted, minWidth: 36, paddingTop: 2 }}>{item.id}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: V.txt, lineHeight: 1.4, marginBottom: 2 }}>{item.description}</div>
                    {item.note && <div style={{ fontSize: 10, color: V.muted }}>Note: {item.note}</div>}
                    {statuses[item.id] === 'FAIL' && (
                      <input placeholder="Corrective action / defect description…" value={remarks[item.id] ?? ''} onChange={e => setRemark(item.id, e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '5px 10px', background: V.surf, border: `1px solid #DC262640`, borderRadius: 6, fontSize: 11, color: V.sec, outline: 'none' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <StatusBtn id={item.id} s="PASS" label="PASS" color="#059669" />
                    <StatusBtn id={item.id} s="FAIL" label="FAIL" color="#DC2626" />
                    <StatusBtn id={item.id} s="NA"   label="N/A"  color="#64748B" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
