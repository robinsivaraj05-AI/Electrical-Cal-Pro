import React, { useState } from 'react';
import { Wrench, CheckSquare, Square, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#D97706';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

type SchedKey = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'halfyearly' | 'annual' | 'shutdown';

interface ScheduleItem { task: string; responsibility: string; tool?: string; }
interface Schedule { title: string; color: string; standard: string; items: ScheduleItem[]; }

const SCHEDULES: Record<SchedKey, Schedule> = {
  daily: {
    title: 'Daily Maintenance / Walkdown',
    color: '#059669', standard: 'NFPA 70B / IEC 62271-200',
    items: [
      { task: 'Visual check of panel exterior — no alarms, damage, or unusual conditions', responsibility: 'Operator/Technician' },
      { task: 'Read and record electrical parameters (voltage, current, power factor) from metering', responsibility: 'Operator', tool: 'Metering panel / SCADA' },
      { task: 'Check all indicating lamps — all healthy/status correct', responsibility: 'Operator' },
      { task: 'Check SF6 gas pressure gauge (if SF6 CB) — within normal band', responsibility: 'Operator' },
      { task: 'Check panel alarms — no new alarms', responsibility: 'Operator' },
      { task: 'Check space heater operation (where energised continuously)', responsibility: 'Operator' },
      { task: 'Record CB operation counter reading', responsibility: 'Operator' },
      { task: 'Log entry — sign and date', responsibility: 'Operator' },
    ],
  },
  weekly: {
    title: 'Weekly Inspection',
    color: '#0891B2', standard: 'NFPA 70B',
    items: [
      { task: 'Open panel door and visually inspect interior — no new moisture, pests, or loose hardware', responsibility: 'Technician' },
      { task: 'Check cleanliness — dust accumulation on insulators/relay panels', responsibility: 'Technician' },
      { task: 'Check relay indication — no uncleared trip flags', responsibility: 'Technician' },
      { task: 'Check auxilary DC supply voltage — 110V or 48V DC within ±5%', responsibility: 'Technician', tool: 'Digital voltmeter' },
      { task: 'Check control fuses — none blown or deteriorated', responsibility: 'Technician' },
      { task: 'Operate local/remote selector switches — smooth operation', responsibility: 'Technician' },
      { task: 'Check communication links (RTU/IED) — in service', responsibility: 'Technician' },
    ],
  },
  monthly: {
    title: 'Monthly Maintenance',
    color: '#7C3AED', standard: 'NFPA 70B / IEEE C37.20',
    items: [
      { task: 'Clean exterior panel surface and ventilation filters', responsibility: 'Technician', tool: 'Soft brush, vacuum' },
      { task: 'Inspect cable glands and entry points — seal integrity', responsibility: 'Technician' },
      { task: 'Check and clean panel interior using approved vacuum/brush method', responsibility: 'Technician', tool: 'Industrial vacuum, ESD safe brush' },
      { task: 'Test panel lighting — functional', responsibility: 'Technician' },
      { task: 'Test alarm/trip circuit — local lamp test', responsibility: 'Technician' },
      { task: 'Check busbar terminations for discolouration (thermal imaging if available)', responsibility: 'Technician', tool: 'Thermal camera (optional monthly)' },
      { task: 'Check CT/PT secondary wiring — all terminal screws tight', responsibility: 'Technician' },
      { task: 'Check earthing connections — tight, no corrosion', responsibility: 'Technician', tool: 'Torque wrench' },
      { task: 'Review alarm log — investigate and clear all entries', responsibility: 'Engineer' },
    ],
  },
  quarterly: {
    title: 'Quarterly Maintenance',
    color: '#D97706', standard: 'NFPA 70B / IEC 62271-100',
    items: [
      { task: 'Thermographic survey — scan all HV connections, busbars and cable terminations', responsibility: 'Engineer', tool: 'Calibrated thermal imaging camera' },
      { task: 'CB mechanism inspection — clean and lubricate mechanism', responsibility: 'Technician', tool: 'Approved contact grease' },
      { task: 'Check CB spring charge — manually charge and verify indicator', responsibility: 'Technician' },
      { task: 'Test protective relay functions — lamp test, binary input/output check', responsibility: 'Technician', tool: 'OMICRON CMC / relay test set' },
      { task: 'Test trip coil continuity — measure resistance', responsibility: 'Technician', tool: 'Digital ohmmeter' },
      { task: 'Test close coil continuity', responsibility: 'Technician', tool: 'Digital ohmmeter' },
      { task: 'Check 74TC (trip circuit supervision) — healthy', responsibility: 'Technician' },
      { task: 'Insulation resistance test of control wiring (500V DC)', responsibility: 'Technician', tool: 'Megger 500V' },
      { task: 'Check anti-condensation heater thermostat — correct setting', responsibility: 'Technician' },
      { task: 'Update maintenance log — calibration due dates, next service dates', responsibility: 'Engineer' },
    ],
  },
  halfyearly: {
    title: 'Half-Yearly (6-Month) Maintenance',
    color: '#EA580C', standard: 'IEC 62271-100 / NFPA 70B',
    items: [
      { task: 'Full partial discharge measurement on HV insulation systems', responsibility: 'Specialist Engineer', tool: 'PD measurement system (IEC 60270)' },
      { task: 'Insulation resistance test (5 kV or 10 kV DC) — IR, PI, DAR measured', responsibility: 'Engineer', tool: 'Megger 5 kV or 10 kV DC' },
      { task: 'Contact resistance measurement (Ductor test) on CB main contacts', responsibility: 'Technician', tool: 'Micro-ohmmeter 100A DC' },
      { task: 'Earth resistance measurement (fall-of-potential method)', responsibility: 'Engineer', tool: 'Earth resistance tester (Megger DET series)' },
      { task: 'SF6 gas analysis — pressure, moisture, purity (if SF6 CB)', responsibility: 'Specialist', tool: 'SF6 gas analyser' },
      { task: 'Full protection relay test (secondary injection) — 50/51/50N/51N/27/59/86', responsibility: 'Engineer', tool: 'OMICRON CMC or equivalent' },
      { task: 'CB timing test (open, close, pole discrepancy)', responsibility: 'Engineer', tool: 'CB analyser' },
      { task: 'CT and PT ratio and insulation test', responsibility: 'Engineer', tool: 'CT/PT ratio tester, Megger' },
    ],
  },
  annual: {
    title: 'Annual Overhaul / Planned Outage',
    color: '#DC2626', standard: 'IEC 62271-100 / IEEE C37.09 / NFPA 70B',
    items: [
      { task: 'Full isolation, LOTO, earthing — permit-to-work issued', responsibility: 'Senior Engineer + Authorised Person' },
      { task: 'Complete visual inspection checklist (all 45+ items)', responsibility: 'Engineer + Technician' },
      { task: 'Withdraw CB and inspect vacuum bottles (VCB) or SF6 compartment', responsibility: 'Specialist Technician' },
      { task: 'Clean and lubricate CB mechanism — replace lubricant per manufacturer interval', responsibility: 'Technician', tool: 'Approved switchgear lubricant' },
      { task: 'Insulation resistance test — all phases, earth, across open contacts', responsibility: 'Engineer', tool: 'Megger 5/10 kV' },
      { task: 'Contact resistance test — all phases (Ductor 100A DC)', responsibility: 'Technician', tool: 'Micro-ohmmeter' },
      { task: 'CB timing test — open, close, pole discrepancy, contact bounce', responsibility: 'Engineer', tool: 'CB analyser' },
      { task: 'Primary injection test — CT ratio check, relay pickup verification', responsibility: 'Specialist Engineer', tool: 'Primary injection test set' },
      { task: 'Full secondary injection — all protection functions per settings schedule', responsibility: 'Protection Engineer', tool: 'OMICRON CMC / FREJA 306' },
      { task: 'Earth resistance measurement and comparison with previous results', responsibility: 'Engineer', tool: 'Earth tester' },
      { task: 'Busbar torque verification — retorque all bolted joints per spec', responsibility: 'Technician', tool: 'Calibrated torque wrench' },
      { task: 'Thermographic scan — all connections before outage start', responsibility: 'Engineer', tool: 'Thermal camera' },
      { task: 'Battery capacity test (discharge test)', responsibility: 'Engineer', tool: 'Battery analyser' },
      { task: 'Update SLD and settings schedule — as-found / as-left record', responsibility: 'Engineer' },
      { task: 'Perform function test before re-energisation (trip, close, alarms)', responsibility: 'Engineer + AP' },
      { task: 'Issue clearance — permit-to-work cancelled, panel re-energised', responsibility: 'Authorised Person' },
    ],
  },
  shutdown: {
    title: 'Major Overhaul / Shutdown (Every 3–5 Years)',
    color: '#7C3AED', standard: 'IEC 62271-100 / Manufacturer Recommendations',
    items: [
      { task: 'All annual maintenance items (complete)', responsibility: 'Team' },
      { task: 'Replace vacuum bottles (VCB) if contact wear >80% life or > rated operations', responsibility: 'OEM or Specialist', tool: 'Manufacturer test kit' },
      { task: 'SF6 gas reclaim, test and refill to rated density (SF6 CB)', responsibility: 'Certified SF6 Handler', tool: 'SF6 gas cart (IEC 62271-4)' },
      { task: 'Replace all gaskets, seals and weatherstripping', responsibility: 'Technician' },
      { task: 'Complete rewiring inspection — all control and auxiliary cables', responsibility: 'Technician' },
      { task: 'Replace protection relay if > 15 years or obsolete (parts unavailable)', responsibility: 'Protection Engineer' },
      { task: 'Paint / refinish panel exterior and interior', responsibility: 'Technician', tool: 'Panel-grade paint system' },
      { task: 'Complete high-voltage withstand test (power frequency, 1 minute) if feasible', responsibility: 'HV Test Specialist', tool: 'HV test set per IEC 60060' },
      { task: 'Replace motor operator if > 10 years or unreliable operation history', responsibility: 'OEM Technician' },
      { task: 'Replace DC battery if capacity < 80% of rated (per IEEE 450)', responsibility: 'Engineer', tool: 'Battery analyser' },
      { task: 'Factory acceptance test (FAT) level documentation — as-found vs design spec', responsibility: 'Protection Engineer' },
      { task: 'Independent commissioning check (third party or in-house team)', responsibility: 'Senior Engineer' },
    ],
  },
};

export function HVMaintSched() {
  const [activeTab, setActiveTab] = useState<SchedKey>('annual');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecked((p) => ({ ...p, [k]: !p[k] }));

  const sched = SCHEDULES[activeTab];
  const done = sched.items.filter((_, i) => checked[`${activeTab}-${i}`]).length;

  const handleDownload = () => {
    const rows = sched.items.map((item, i) => {
      const isDone = checked[`${activeTab}-${i}`];
      return [String(i + 1), item.task, item.responsibility, item.tool || '—', isDone ? '<span class="badge b-pass">DONE</span>' : '<span class="badge b-warn">PENDING</span>'];
    });
    const body = `
      <h2>${sched.title}</h2>
      <p style="margin-bottom:10px;font-size:9pt;color:#64748b">Reference: ${sched.standard} &nbsp;|&nbsp; Completed: ${done}/${sched.items.length}</p>
      ${tableHTML(['#','Task / Activity','Responsibility','Tools Required','Status'], rows)}`;
    downloadReport(`HV Maintenance Schedule — ${sched.title}`, `IEC 62271-100 · NFPA 70B · IEEE C37.20`, 'IEC 62271-100 · IEC 62271-200 · NFPA 70B · IEEE C37.09', body, `HV-Maint-Schedule-${activeTab}.pdf`);
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Wrench} title="MAINTENANCE SCHEDULE" subtitle="NFPA 70B · IEC 62271-100 · IEEE C37.20 · Daily → Shutdown Checklists" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Schedule PDF
        </button>
      </div>

      {/* Schedule Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: V.surf, padding: 6, borderRadius: 10, border: `1px solid ${V.brdM}` }}>
        {(Object.entries(SCHEDULES) as [SchedKey, Schedule][]).map(([key, s]) => (
          <button key={key} onClick={() => { setActiveTab(key); setChecked({}); }}
            style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: activeTab === key ? 700 : 500, cursor: 'pointer',
              background: activeTab === key ? s.color : 'transparent',
              color: activeTab === key ? '#fff' : V.sec, border: 'none',
            }}>{s.title.split(' ')[0]}{s.title.split(' ')[1] ? ` ${s.title.split(' ')[1]}` : ''}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ background: V.bg, border: `2px solid ${sched.color}40`, borderRadius: 12, padding: '16px 20px', marginBottom: 16, borderLeft: `5px solid ${sched.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: sched.color, marginBottom: 3 }}>{sched.title}</div>
            <div style={{ fontSize: 11, color: V.muted }}>Reference: {sched.standard}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: sched.color }}>{done}/{sched.items.length}</div>
            <div style={{ fontSize: 11, color: V.muted }}>Tasks Complete</div>
          </div>
        </div>
        {done > 0 && (
          <div style={{ marginTop: 12, height: 6, background: V.brdM, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(done/sched.items.length)*100}%`, height: '100%', background: sched.color, borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      {/* Task List */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: V.surf, padding: '9px 16px', borderBottom: `1px solid ${V.brdM}`, display: 'grid', gridTemplateColumns: '40px 1fr 180px', gap: 12 }}>
          {['#','Task / Activity','Responsibility'].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.06em' }}>{h}</div>)}
        </div>
        {sched.items.map((item, i) => {
          const key = `${activeTab}-${i}`;
          const isDone = checked[key];
          return (
            <div key={key} onClick={() => toggle(key)} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 180px', gap: 12,
              padding: '12px 16px', borderBottom: `1px solid ${V.brdM}`,
              background: isDone ? '#05966910' : 'transparent', cursor: 'pointer',
              alignItems: 'flex-start',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 2 }}>
                {isDone
                  ? <CheckSquare style={{ width: 18, height: 18, color: '#059669' }} />
                  : <Square style={{ width: 18, height: 18, color: V.muted }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, color: isDone ? V.muted : V.txt, textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.45, marginBottom: item.tool ? 4 : 0 }}>{item.task}</div>
                {item.tool && <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Tool: {item.tool}</div>}
              </div>
              <div style={{ fontSize: 12, color: V.sec }}>{item.responsibility}</div>
            </div>
          );
        })}
      </div>

      {done === sched.items.length && sched.items.length > 0 && (
        <div style={{ marginTop: 16, padding: '14px 20px', background: '#05966918', border: '2px solid #05966940', borderRadius: 10, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#059669' }}>
          ✔ ALL {sched.items.length} TASKS COMPLETE — {sched.title.toUpperCase()} DONE
        </div>
      )}
    </div>
  );
}
