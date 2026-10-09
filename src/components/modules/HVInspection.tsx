import React, { useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Minus, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#059669';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

type ItemStatus = 'PASS' | 'FAIL' | 'NA' | 'PENDING';

interface CheckItem {
  id: string; category: string; description: string; note?: string;
}

const CHECKLIST: CheckItem[] = [
  // External Condition
  { id:'EX01', category:'External Condition', description:'Panel enclosure external — no dents, corrosion or mechanical damage' },
  { id:'EX02', category:'External Condition', description:'Panel door condition — hinges, handles, seals intact' },
  { id:'EX03', category:'External Condition', description:'Door locks and interlocks functional and secure' },
  { id:'EX04', category:'External Condition', description:'Danger / Warning labels clearly visible and legible', note:'IEC 60079-14, BS EN 50110' },
  { id:'EX05', category:'External Condition', description:'Earthing / bonding connections at panel exterior — tight and corrosion-free' },
  { id:'EX06', category:'External Condition', description:'Paint / powder-coat finish — no blistering, peeling or missing areas' },
  { id:'EX07', category:'External Condition', description:'Cable glands — mechanically secure, appropriate IP rating maintained' },
  { id:'EX08', category:'External Condition', description:'Cable entry / exit sealing — sealed against vermin and moisture' },
  { id:'EX09', category:'External Condition', description:'Panel nameplate — legible with correct ratings and ID' },
  { id:'EX10', category:'External Condition', description:'Ventilation louvres / filters — clean, unobstructed' },

  // Internal Condition
  { id:'IN01', category:'Internal Condition', description:'General cleanliness — no dust accumulation on live parts' },
  { id:'IN02', category:'Internal Condition', description:'No moisture, condensation or water ingress evidence' },
  { id:'IN03', category:'Internal Condition', description:'No signs of overheating — burn marks, discolouration, melted insulation' },
  { id:'IN04', category:'Internal Condition', description:'No animal or insect entry evidence (nests, droppings, carcasses)' },
  { id:'IN05', category:'Internal Condition', description:'No water leakage stains or rust internally' },
  { id:'IN06', category:'Internal Condition', description:'Insulation — no cracks, tracking marks or damaged insulation on busbars/cables' },
  { id:'IN07', category:'Internal Condition', description:'All hardware (bolts, nuts, screws) tight — no loose hardware' },
  { id:'IN08', category:'Internal Condition', description:'Cable supports and cleats in position — no sagging cables' },
  { id:'IN09', category:'Internal Condition', description:'Cable terminations — tightness verified (torque check or visual)' },
  { id:'IN10', category:'Internal Condition', description:'Busbar support insulators — clean, no cracking or tracking' },

  // Busbar & Connections
  { id:'BB01', category:'Busbar & Connections', description:'Busbar alignment — no sagging, correct clearances maintained' },
  { id:'BB02', category:'Busbar & Connections', description:'Busbar colour coding / phase identification correct' },
  { id:'BB03', category:'Busbar & Connections', description:'Busbar connections — no discolouration from overheating' },
  { id:'BB04', category:'Busbar & Connections', description:'Busbar earthing points — accessible and clearly marked' },
  { id:'BB05', category:'Busbar & Connections', description:'Creepage distances maintained per IEC 62271-200' },

  // Circuit Breaker Condition
  { id:'CB01', category:'Circuit Breaker', description:'CB position indicator — correct (OPEN/CLOSE/TEST/ISOLATED)' },
  { id:'CB02', category:'Circuit Breaker', description:'CB spring charge indicator — CHARGED (if racking is complete)' },
  { id:'CB03', category:'Circuit Breaker', description:'CB operation counter — recorded (for maintenance records)' },
  { id:'CB04', category:'Circuit Breaker', description:'CB truck/carriage — moves freely on rails, stops at correct positions' },
  { id:'CB05', category:'Circuit Breaker', description:'Shutter mechanism — operates correctly (opens on CB insertion, closes on withdrawal)' },
  { id:'CB06', category:'Circuit Breaker', description:'CB racking mechanism — smooth operation, no excessive force required' },
  { id:'CB07', category:'Circuit Breaker', description:'Trip/close buttons — functional, correct labels, covers in place' },
  { id:'CB08', category:'Circuit Breaker', description:'Auxiliary contacts — correct operation on CB open/close/test' },
  { id:'CB09', category:'Circuit Breaker', description:'Vacuum bottle visual indicator (if fitted) — condition', note:'VCB only' },
  { id:'CB10', category:'Circuit Breaker', description:'SF6 gas pressure gauge — within rated band (alarm and lockout levels noted)', note:'SF6 only' },

  // Earthing Switch
  { id:'ES01', category:'Earthing Switch', description:'Earthing switch position indicator — correct' },
  { id:'ES02', category:'Earthing Switch', description:'Earthing switch mechanical interlocks — functional (prevent closing with CB closed)' },
  { id:'ES03', category:'Earthing Switch', description:'Earthing switch contacts — clean, no pitting or corrosion' },
  { id:'ES04', category:'Earthing Switch', description:'Earthing switch padlocking facility — functional' },

  // Protection & Control
  { id:'PR01', category:'Protection & Control', description:'Protection relay display — no alarms, healthy LED indicators' },
  { id:'PR02', category:'Protection & Control', description:'Protection relay settings — verified against commissioned settings schedule' },
  { id:'PR03', category:'Protection & Control', description:'Trip circuit supervision (74TC) — healthy indication on panel' },
  { id:'PR04', category:'Protection & Control', description:'CT and PT secondary wiring — secure, no loose terminations' },
  { id:'PR05', category:'Protection & Control', description:'Mimic/single line diagram — legible and correct' },
  { id:'PR06', category:'Protection & Control', description:'Control switches — correct position, operates smoothly' },
  { id:'PR07', category:'Protection & Control', description:'Indicating instruments (ammeter, voltmeter, energy meter) — functioning' },

  // Auxiliary Systems
  { id:'AX01', category:'Auxiliary Systems', description:'Space heater — operational (prevents condensation)' },
  { id:'AX02', category:'Auxiliary Systems', description:'Panel internal lighting — functional' },
  { id:'AX03', category:'Auxiliary Systems', description:'Anti-condensation heating thermostat — set correctly (typically 5°C above dew point)' },
  { id:'AX04', category:'Auxiliary Systems', description:'DC auxiliary supply — healthy (110V or 24V DC as applicable)' },
  { id:'AX05', category:'Auxiliary Systems', description:'AC auxiliary supply — healthy (230V or 110V AC as applicable)' },
  { id:'AX06', category:'Auxiliary Systems', description:'Fire detection system (if fitted) — healthy' },

  // Safety & Documentation
  { id:'SA01', category:'Safety & Documentation', description:'Approved single line diagram available and current revision' },
  { id:'SA02', category:'Safety & Documentation', description:'Previous test records reviewed — any previous failures addressed' },
  { id:'SA03', category:'Safety & Documentation', description:'Panel locking/LOTO provisions — adequate and functional' },
  { id:'SA04', category:'Safety & Documentation', description:'Emergency operating procedures — posted on panel' },
  { id:'SA05', category:'Safety & Documentation', description:'Photographs taken — before and after inspection' },
];

const CATEGORIES = [...new Set(CHECKLIST.map((i) => i.category))];

export function HVInspection() {
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [inspector, setInspector] = useState('');
  const [panelId, setPanelId] = useState('HV-01');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSummary, setShowSummary] = useState(false);

  const setStatus = (id: string, s: ItemStatus) => setStatuses((p) => ({ ...p, [id]: s }));
  const setRemark = (id: string, r: string) => setRemarks((p) => ({ ...p, [id]: r }));

  const total = CHECKLIST.length;
  const passed  = CHECKLIST.filter((i) => statuses[i.id] === 'PASS').length;
  const failed  = CHECKLIST.filter((i) => statuses[i.id] === 'FAIL').length;
  const naCount = CHECKLIST.filter((i) => statuses[i.id] === 'NA').length;
  const pending = total - passed - failed - naCount;
  const overallOK = failed === 0 && pending === 0;

  const StatusBtn = ({ id, s, label, color }: { id: string; s: ItemStatus; label: string; color: string }) => (
    <button onClick={() => setStatus(id, statuses[id] === s ? 'PENDING' : s)}
      style={{
        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        background: statuses[id] === s ? color : 'transparent',
        color: statuses[id] === s ? '#fff' : V.muted,
        border: `1.5px solid ${statuses[id] === s ? color : V.brdM}`,
      }}>{label}</button>
  );

  const handleDownload = () => {
    const rows = CHECKLIST.map(item => [
      item.id,
      item.category,
      item.description,
      statuses[item.id] ?? 'PENDING',
      remarks[item.id] ?? '',
    ]);
    const defects = CHECKLIST.filter(i => statuses[i.id] === 'FAIL');
    const defectRows = defects.map(i => [i.id, i.description, remarks[i.id] ?? '— No action noted —']);
    const summaryHTML = `<h2>Inspection Summary</h2>
<table><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>
<tr><td class="lbl">Panel ID</td><td class="val">${panelId}</td></tr>
<tr><td class="lbl">Inspector</td><td class="val">${inspector || '—'}</td></tr>
<tr><td class="lbl">Inspection Date</td><td class="val">${date}</td></tr>
<tr><td class="lbl">Overall Result</td><td class="val" style="color:${failed===0&&pending===0?'#059669':'#DC2626'};font-weight:700">${failed===0&&pending===0?'PASS':'FAIL / INCOMPLETE'}</td></tr>
<tr><td class="lbl">Total Items</td><td class="val">${total}</td></tr>
<tr><td class="lbl">Passed</td><td class="val" style="color:#059669">${passed}</td></tr>
<tr><td class="lbl">Failed</td><td class="val" style="color:#DC2626">${failed}</td></tr>
<tr><td class="lbl">N/A</td><td class="val">${naCount}</td></tr>
</tbody></table>`;
    const checklistHTML = `<h2>Full Checklist Results</h2>${tableHTML(['ID','Category','Description','Status','Remarks'], rows)}`;
    const defectHTML = defects.length > 0 ? `<h2>Defects & Corrective Actions</h2>${tableHTML(['ID','Description','Action Required'], defectRows)}` : '';
    downloadReport(
      'HV Panel Visual Inspection Report',
      `Panel: ${panelId} · Inspector: ${inspector || '—'} · Date: ${date}`,
      'IEC 62271-200 · IEC 60529 · NFPA 70B · IEEE C37.20 · IS 13947',
      summaryHTML + checklistHTML + defectHTML,
      `HV-Inspection-${panelId}-${date}.pdf`,
    );
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={ClipboardList} title="VISUAL INSPECTION CHECKLIST" subtitle="IEC 62271-200 · IEC 60529 · NFPA 70B · IEEE C37 Series · 45+ Inspection Items" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Report
        </button>
      </div>

      {/* Panel Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Panel ID', val: panelId, set: setPanelId },
          { label: 'Inspection Date', val: date, set: setDate },
          { label: 'Inspector Name', val: inspector, set: setInspector },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={(e) => set(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: V.txt }}>Inspection Progress</span>
          <span style={{ fontSize: 12, color: V.muted }}>{total - pending} / {total} items</span>
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
      {CATEGORIES.map((cat) => {
        const items = CHECKLIST.filter((i) => i.category === cat);
        const catFail = items.filter((i) => statuses[i.id] === 'FAIL').length;
        return (
          <div key={cat} style={{ marginBottom: 16, background: V.bg, border: `1.5px solid ${catFail > 0 ? '#DC2626' : V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', background: catFail > 0 ? '#DC262618' : V.surf, borderBottom: `1px solid ${V.brdM}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: catFail > 0 ? '#DC2626' : V.txt }}>{cat}</span>
              <span style={{ fontSize: 11, color: V.muted }}>{items.length} items</span>
            </div>
            <div>
              {items.map((item, i) => (
                <div key={item.id} style={{ padding: '10px 16px', borderBottom: i < items.length-1 ? `1px solid ${V.brdM}` : 'none', background: statuses[item.id] === 'FAIL' ? '#DC262608' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontFamily: V.mono, fontSize: 10, fontWeight: 700, color: V.muted, minWidth: 38, paddingTop: 2 }}>{item.id}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: V.txt, marginBottom: 4, lineHeight: 1.4 }}>{item.description}</div>
                      {item.note && <div style={{ fontSize: 11, color: V.muted, marginBottom: 4 }}>Note: {item.note}</div>}
                      {statuses[item.id] === 'FAIL' && (
                        <input placeholder="Describe defect / corrective action required…"
                          value={remarks[item.id] ?? ''} onChange={(e) => setRemark(item.id, e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '6px 10px', background: V.surf, border: `1px solid #DC262640`, borderRadius: 6, fontSize: 12, color: V.sec, outline: 'none' }} />
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
          </div>
        );
      })}

      {/* Summary Button */}
      <button onClick={() => setShowSummary(!showSummary)}
        style={{ width: '100%', padding: '14px', borderRadius: 10, background: overallOK ? '#059669' : '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, marginTop: 8 }}>
        {showSummary ? 'Hide' : 'Generate'} Inspection Summary — {failed === 0 && pending === 0 ? '✔ PASS' : failed > 0 ? `✘ FAIL (${failed} defects)` : `⏳ INCOMPLETE (${pending} pending)`}
      </button>

      {showSummary && (
        <div style={{ marginTop: 16, background: V.bg, border: `2px solid ${overallOK ? '#059669' : '#DC2626'}`, borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: overallOK ? '#059669' : '#DC2626', marginBottom: 12 }}>
            {overallOK ? '✔ VISUAL INSPECTION PASSED' : '✘ VISUAL INSPECTION — DEFECTS NOTED'}
          </div>
          <div style={{ fontSize: 12, color: V.muted, marginBottom: 16 }}>Panel: {panelId} · Inspector: {inspector} · Date: {date}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[['Total Items',`${total}`,V.txt],['Passed',`${passed}`,'#059669'],['Failed',`${failed}`,'#DC2626'],['N/A',`${naCount}`,'#64748B']].map(([l,v,c]) => (
              <div key={l} style={{ textAlign: 'center', padding: '12px', background: V.surf, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: c as string }}>{v}</div>
                <div style={{ fontSize: 11, color: V.muted }}>{l}</div>
              </div>
            ))}
          </div>
          {failed > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>DEFECTS FOUND — CORRECTIVE ACTION REQUIRED:</div>
              {CHECKLIST.filter((i) => statuses[i.id] === 'FAIL').map((item) => (
                <div key={item.id} style={{ padding: '8px 12px', marginBottom: 6, background: '#DC262612', border: '1px solid #DC262640', borderRadius: 8, fontSize: 12 }}>
                  <strong style={{ color: '#DC2626' }}>[{item.id}]</strong>
                  <span style={{ color: V.sec, marginLeft: 8 }}>{item.description}</span>
                  {remarks[item.id] && <div style={{ color: V.muted, marginTop: 4 }}>Action: {remarks[item.id]}</div>}
                </div>
              ))}
            </>
          )}
          <div style={{ fontSize: 11, color: V.muted, marginTop: 12 }}>Standards: IEC 62271-200 · IEC 60529 · NFPA 70B · IEEE C37.20 · IS 13947</div>
        </div>
      )}
    </div>
  );
}
