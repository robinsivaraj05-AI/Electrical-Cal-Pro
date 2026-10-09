import React, { useState } from 'react';
import { Server, Plus, Edit2, ChevronRight, X, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#2563EB';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface Panel {
  id: string; name: string; location: string; voltage: string; rating: string;
  manufacturer: string; yearInstalled: string; type: string; status: string;
  healthIndex: number; lastMaintDate: string; nextMaintDate: string; notes: string;
}

const DEFAULT_PANELS: Panel[] = [
  { id: 'HV-001', name: 'Incomer Panel A', location: 'Main Substation Bay 1', voltage: '11 kV', rating: '630 A', manufacturer: 'Schneider Electric', yearInstalled: '2015', type: 'VCB (Vacuum Circuit Breaker)', status: 'Healthy', healthIndex: 94, lastMaintDate: '2025-01-15', nextMaintDate: '2026-01-15', notes: 'IR test excellent. PD clear. Contact resistance 28 μΩ.' },
  { id: 'HV-002', name: 'Bus Coupler Panel', location: 'Main Substation Bay 2', voltage: '11 kV', rating: '630 A', manufacturer: 'ABB', yearInstalled: '2015', type: 'VCB (Vacuum Circuit Breaker)', status: 'Healthy', healthIndex: 88, lastMaintDate: '2025-01-15', nextMaintDate: '2026-01-15', notes: 'Minor surface contamination cleaned during last maintenance.' },
  { id: 'HV-003', name: 'Transformer 1 Feeder', location: 'Main Substation Bay 3', voltage: '11 kV', rating: '400 A', manufacturer: 'Schneider Electric', yearInstalled: '2015', type: 'VCB (Vacuum Circuit Breaker)', status: 'Under Maintenance', healthIndex: 72, lastMaintDate: '2025-06-01', nextMaintDate: '2025-12-01', notes: 'IR test borderline — drying out underway. Retest scheduled.' },
  { id: 'HV-004', name: 'Feeder Panel F1', location: 'Sub Substation 1', voltage: '11 kV', rating: '200 A', manufacturer: 'Siemens', yearInstalled: '2012', type: 'VCB (Vacuum Circuit Breaker)', status: 'Healthy', healthIndex: 81, lastMaintDate: '2024-09-10', nextMaintDate: '2025-09-10', notes: '13 years in service. Contact wear approaching 70% — monitor closely.' },
  { id: 'HV-005', name: 'Feeder Panel F2', location: 'Sub Substation 1', voltage: '11 kV', rating: '200 A', manufacturer: 'Siemens', yearInstalled: '2012', type: 'VCB (Vacuum Circuit Breaker)', status: 'Test Failed', healthIndex: 45, lastMaintDate: '2025-07-20', nextMaintDate: '2025-08-20', notes: 'CB timing test FAILED — close time 145 ms (limit 120 ms). Mechanism repair required.' },
  { id: 'HV-006', name: 'MV Motor Feeder', location: 'Motor Control Centre', voltage: '6.6 kV', rating: '150 A', manufacturer: 'ABB', yearInstalled: '2018', type: 'SF6 CB', status: 'Healthy', healthIndex: 97, lastMaintDate: '2025-03-01', nextMaintDate: '2026-03-01', notes: 'All tests passed. SF6 pressure nominal. IR 1800 MΩ.' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  'Healthy':           { color: '#059669', bg: '#05966918' },
  'Under Maintenance': { color: '#D97706', bg: '#D9770618' },
  'Test Failed':       { color: '#DC2626', bg: '#DC262618' },
  'Under Test':        { color: '#2563EB', bg: '#2563EB18' },
  'Decommissioned':    { color: '#6B7280', bg: '#6B728018' },
};

const EMPTY: Panel = { id: '', name: '', location: '', voltage: '11 kV', rating: '', manufacturer: '', yearInstalled: '', type: 'VCB (Vacuum Circuit Breaker)', status: 'Healthy', healthIndex: 100, lastMaintDate: '', nextMaintDate: '', notes: '' };

function HealthBar({ value }: { value: number }) {
  const color = value >= 85 ? '#059669' : value >= 60 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: V.brdM, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36 }}>{value}%</span>
    </div>
  );
}

export function HVPanels() {
  const [panels, setPanels] = useState<Panel[]>(DEFAULT_PANELS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Panel | null>(null);
  const [isNew, setIsNew] = useState(false);

  const selected = panels.find((p) => p.id === selectedId) ?? null;

  const save = () => {
    if (!editing) return;
    if (isNew) {
      setPanels((p) => [...p, editing]);
    } else {
      setPanels((p) => p.map((x) => (x.id === editing.id ? editing : x)));
    }
    setEditing(null);
    setSelectedId(editing.id);
    setIsNew(false);
  };

  const F = ({ label, field, type = 'text', options }: { label: string; field: keyof Panel; type?: string; options?: string[] }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      {options ? (
        <select value={editing?.[field] as string ?? ''} onChange={(e) => setEditing((p) => p ? { ...p, [field]: e.target.value } : p)}
          style={{ width: '100%', padding: '9px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : type === 'range' ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="range" min={0} max={100} value={editing?.[field] as number ?? 100} onChange={(e) => setEditing((p) => p ? { ...p, [field]: Number(e.target.value) } : p)} style={{ flex: 1 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT, minWidth: 40 }}>{editing?.[field]}%</span>
        </div>
      ) : type === 'textarea' ? (
        <textarea rows={3} value={editing?.[field] as string ?? ''} onChange={(e) => setEditing((p) => p ? { ...p, [field]: e.target.value } : p)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', resize: 'vertical' }} />
      ) : (
        <input type={type} value={editing?.[field] as string ?? ''} onChange={(e) => setEditing((p) => p ? { ...p, [field]: e.target.value } : p)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Server} title="HV PANEL REGISTRY" subtitle="11kV Switchgear Asset Database · Maintenance Status Tracking · IEC 62271-200" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => {
          const rows = panels.map(p => [p.id, p.name, p.location, `${p.voltage} / ${p.rating}`, p.type, p.manufacturer, p.status, `${p.healthIndex}%`, p.lastMaintDate, p.nextMaintDate]);
          const body = `<h2>Panel Registry — ${panels.length} Registered Panels</h2>${tableHTML(['Panel ID','Name','Location','Rating','CB Type','Manufacturer','Status','Health','Last Maint','Next Maint'], rows)}`;
          downloadReport('11kV HV Panel Registry Report','Switchgear Asset Database · IEC 62271-200','IEC 62271-100 · IEC 62271-200 · IEEE C37.20', body, 'HV-Panel-Registry.pdf');
        }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Export Registry PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || editing ? '300px 1fr' : '1fr', gap: 16 }}>
        {/* Panel List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: V.muted }}>{panels.length} panels registered</span>
            <button onClick={() => { setIsNew(true); setEditing({ ...EMPTY, id: `HV-${String(panels.length + 1).padStart(3, '0')}` }); setSelectedId(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 14, height: 14 }} /> Add Panel
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {panels.map((p) => {
              const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE['Healthy'];
              return (
                <button key={p.id} onClick={() => { setSelectedId(p.id); setEditing(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left', background: selectedId === p.id ? ACCENT + '18' : V.bg, border: `1.5px solid ${selectedId === p.id ? ACCENT : V.brd}`, borderRadius: 10, cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: V.txt, marginBottom: 2 }}>{p.id} — {p.name}</div>
                    <div style={{ fontSize: 11, color: V.muted, marginBottom: 6 }}>{p.location} · {p.voltage}</div>
                    <HealthBar value={p.healthIndex} />
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ss.color, background: ss.bg, padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>{p.status}</span>
                    <ChevronRight style={{ width: 14, height: 14, color: V.muted, display: 'block', margin: '4px auto 0' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail / Edit Panel */}
        {editing && (
          <div style={{ background: V.bg, border: `2px solid ${ACCENT}40`, borderRadius: 14, padding: '20px 22px', borderTop: `4px solid ${ACCENT}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: V.txt }}>{isNew ? 'Register New Panel' : `Edit — ${editing.id}`}</div>
              <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: V.muted }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <F label="Panel ID" field="id" />
              <F label="Panel Name" field="name" />
              <F label="Location / Bay" field="location" />
              <F label="Rated Voltage" field="voltage" options={['11 kV', '6.6 kV', '3.3 kV', '33 kV', '66 kV', '132 kV']} />
              <F label="Current Rating" field="rating" />
              <F label="CB Type" field="type" options={['VCB (Vacuum Circuit Breaker)', 'SF6 CB', 'Air CB (ACB)', 'Oil CB']} />
              <F label="Manufacturer" field="manufacturer" />
              <F label="Year Installed" field="yearInstalled" />
              <F label="Status" field="status" options={Object.keys(STATUS_STYLE)} />
              <F label="Last Maintenance Date" field="lastMaintDate" type="date" />
              <F label="Next Maintenance Date" field="nextMaintDate" type="date" />
              <F label="Health Index (%)" field="healthIndex" type="range" />
            </div>
            <F label="Notes / Observations" field="notes" type="textarea" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: '9px 20px', background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.sec, cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding: '9px 22px', background: ACCENT, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save Panel</button>
            </div>
          </div>
        )}

        {/* Selected Panel View */}
        {selected && !editing && (
          <div style={{ background: V.bg, border: `2px solid ${V.brd}`, borderRadius: 14, overflow: 'hidden', borderTop: `4px solid ${ACCENT}` }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: V.surf, borderBottom: `1px solid ${V.brdM}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: V.txt }}>{selected.id} — {selected.name}</div>
                <div style={{ fontSize: 12, color: V.muted, marginTop: 2 }}>{selected.location}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: (STATUS_STYLE[selected.status] ?? STATUS_STYLE['Healthy']).bg, color: (STATUS_STYLE[selected.status] ?? STATUS_STYLE['Healthy']).color }}>{selected.status}</span>
                <button onClick={() => setEditing({ ...selected })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Edit2 style={{ width: 13, height: 13 }} /> Edit
                </button>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>
              {/* Health */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Health Index</div>
                <HealthBar value={selected.healthIndex} />
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { l: 'Voltage', v: selected.voltage },
                  { l: 'Rating', v: selected.rating },
                  { l: 'CB Type', v: selected.type },
                  { l: 'Manufacturer', v: selected.manufacturer },
                  { l: 'Year Installed', v: selected.yearInstalled },
                  { l: 'Age', v: `${2026 - Number(selected.yearInstalled)} years` },
                  { l: 'Last Maintenance', v: selected.lastMaintDate || '—' },
                  { l: 'Next Maintenance', v: selected.nextMaintDate || '—' },
                ].map(({ l, v }) => (
                  <div key={l} style={{ background: V.surf, padding: '10px 14px', borderRadius: 10, border: `1px solid ${V.brdM}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selected.notes && (
                <div style={{ background: '#2563EB10', border: '1px solid #2563EB30', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' }}>Latest Observation</div>
                  <div style={{ fontSize: 13, color: V.sec, lineHeight: 1.6 }}>{selected.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
