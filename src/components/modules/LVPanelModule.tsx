import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Server, FileText, Zap, Cable, Gauge, BarChart3,
  BookOpen, Activity, Database, ClipboardList, Download, Upload, Settings,
  Plus, Pencil, Trash2, Search, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronDown, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useLVPanelStore, FEEDER_INSTALL_STATUSES } from '../../store/useLVPanelStore';
import type {
  LVPanel, LVFeeder, LVLoad, LVMeter, LVDrawing, LVInspection, LVDocument,
} from '../../store/useLVPanelStore';

// ─── Style helpers ────────────────────────────────────────────────────────────

const ACCENT = '#0EA5E9';

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--ec-bg-card)', border: '1px solid var(--ec-border-card)',
  borderRadius: 12, padding: 20, ...extra,
});

const TH: React.CSSProperties = {
  padding: '7px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase',
  color: 'var(--ec-text-muted)', borderBottom: '2px solid var(--ec-border)',
  whiteSpace: 'nowrap', fontWeight: 700,
};

const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 10px', fontSize: 12, borderBottom: '1px solid var(--ec-border)',
  color: 'var(--ec-text-primary)', ...extra,
});

const btn = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  background: color, color: '#fff', ...extra,
});

const input = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--ec-bg-input)', border: '1px solid var(--ec-border)',
  borderRadius: 8, padding: '7px 10px', color: 'var(--ec-text-primary)',
  fontSize: 13, width: '100%', outline: 'none', ...extra,
});

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--ec-text-muted)', marginBottom: 4, display: 'block',
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = (() => {
    const s = status.toLowerCase();
    if (s.includes('complet') || s.includes('pass') || s.includes('install') || s.includes('calibrat') || s.includes('verif') || s === 'as-built') return '#22C55E';
    if (s.includes('progress') || s.includes('schedul') || s.includes('draft') || s.includes('conditional')) return '#F59E0B';
    if (s.includes('fail')) return '#EF4444';
    return '#64748B';
  })();
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ec-text-muted)' }}>
      <Icon style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--ec-text-secondary)' }}>{title}</div>
      <div style={{ fontSize: 12 }}>{sub}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ElementType }) {
  return (
    <div style={{
      background: `linear-gradient(135deg,${ACCENT},${ACCENT}bb)`,
      borderRadius: 12, padding: '16px 22px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 10, flexShrink: 0 }}>
        <Icon style={{ width: 22, height: 22, color: '#fff' }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function KpiCard({ value, label: lbl, sub, color, icon: Icon }: {
  value: string | number; label: string; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div style={card({ padding: '18px 20px' })}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--ec-text-secondary)', marginTop: 4 }}>{lbl}</div>
          {sub && <div style={{ fontSize: 10, color: 'var(--ec-text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ background: color + '22', borderRadius: 10, padding: 10 }}>
          <Icon style={{ width: 20, height: 20, color }} />
        </div>
      </div>
    </div>
  );
}

// ─── uid helper ──────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── SECTION: Dashboard ───────────────────────────────────────────────────────

function Dashboard() {
  const { panels, feeders, loads, meters, inspections, projectInfo } = useLVPanelStore();

  const totalKW = panels.reduce((s, p) => s + (p.connectedLoadKW || 0), 0);
  const totalDemand = panels.reduce((s, p) => s + (p.maxDemandKW || 0), 0);
  const completed = panels.filter(p => p.installationStatus === 'Completed').length;
  const inProgress = panels.filter(p => p.installationStatus === 'In Progress').length;
  const passed = inspections.filter(i => i.status === 'Passed').length;
  const failed = inspections.filter(i => i.status === 'Failed').length;
  const meterCount = panels.filter(p => p.energyMeter).length;

  const byType = (['MDB', 'SMDB', 'MCC', 'DB', 'EDB', 'Other'] as const).map(t => ({
    type: t, count: panels.filter(p => p.panelType === t || (t === 'Other' && !['MDB','SMDB','MCC','DB','EDB'].includes(p.panelType))).length,
  })).filter(x => x.count > 0);

  const areas = [...new Set(panels.map(p => p.electricalArea).filter(Boolean))];
  const areaRows = areas.map(area => {
    const ap = panels.filter(p => p.electricalArea === area);
    return { area, count: ap.length, kw: ap.reduce((s, p) => s + p.connectedLoadKW, 0) };
  });

  const pct = panels.length ? Math.round(completed / panels.length * 100) : 0;

  return (
    <div>
      <SectionHeader title="Project Dashboard" subtitle={`${projectInfo.projectName} · ${projectInfo.projectNo}`} icon={LayoutDashboard} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <KpiCard value={panels.length} label="Total Panels" sub="in register" color={ACCENT} icon={Server} />
        <KpiCard value={totalKW.toFixed(0) + ' kW'} label="Connected Load" sub="sum of panels" color="#8B5CF6" icon={Zap} />
        <KpiCard value={totalDemand.toFixed(0) + ' kW'} label="Max Demand" sub="sum of panels" color="#F59E0B" icon={Activity} />
        <KpiCard value={feeders.length} label="Feeder Circuits" sub="in schedule" color="#22C55E" icon={Cable} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard value={completed} label="Install Complete" sub={`${pct}% done`} color="#22C55E" icon={CheckCircle} />
        <KpiCard value={inProgress} label="In Progress" sub="" color="#F59E0B" icon={RefreshCw} />
        <KpiCard value={passed} label="Inspections Passed" sub="" color="#22C55E" icon={CheckCircle} />
        <KpiCard value={failed} label="Inspections Failed" sub="requires action" color="#EF4444" icon={XCircle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Type Breakdown */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--ec-text-primary)' }}>Panel Type Breakdown</div>
          {byType.length === 0 && <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No panels registered yet.</div>}
          {byType.map(row => (
            <div key={row.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--ec-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--ec-text-secondary)' }}>{row.type}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ec-text-primary)' }}>{row.count}</span>
            </div>
          ))}
        </div>

        {/* Installation Progress */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--ec-text-primary)' }}>Installation Progress</div>
          {panels.length === 0 && <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No panels registered yet.</div>}
          {(['Completed', 'In Progress', 'Not Started'] as const).map(s => {
            const cnt = panels.filter(p => p.installationStatus === s).length;
            const p2 = panels.length ? Math.round(cnt / panels.length * 100) : 0;
            const col = s === 'Completed' ? '#22C55E' : s === 'In Progress' ? '#F59E0B' : '#64748B';
            return (
              <div key={s} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--ec-text-secondary)' }}>{s}</span>
                  <span style={{ color: col, fontWeight: 700 }}>{cnt} ({p2}%)</span>
                </div>
                <div style={{ height: 6, background: 'var(--ec-border)', borderRadius: 3 }}>
                  <div style={{ height: 6, width: `${p2}%`, background: col, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--ec-text-primary)' }}>Summary</div>
          {[
            { l: 'Loads in Schedule', v: loads.length },
            { l: 'Energy Meters', v: meterCount },
            { l: 'Inspections (Total)', v: inspections.length },
            { l: 'System Voltage', v: projectInfo.systemVoltage + ' V' },
            { l: 'Frequency', v: projectInfo.frequency + ' Hz' },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--ec-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--ec-text-secondary)' }}>{row.l}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ec-text-primary)' }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Area table */}
      {areaRows.length > 0 && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Area Summary</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Area', 'Panels', 'Connected kW'].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {areaRows.map((r, i) => (
                <tr key={r.area} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                  <td style={td()}>{r.area}</td>
                  <td style={td()}>{r.count}</td>
                  <td style={td()}>{r.kw.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Panel Register ──────────────────────────────────────────────────

const PANEL_DEFAULTS: Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'> = {
  panelId: '', panelName: '', panelType: 'MDB', electricalArea: '', location: '',
  parentPanel: '', incomingFeederRef: '', ratedVoltage: 400, phases: 3,
  ratedCurrentA: 0, incomingBreakerType: 'ACB', incomingBreakerRating: 0,
  faultDutyKA: 50, connectedLoadKW: 0, maxDemandKW: 0,
  incomingCableSize: '', earthingConductorSize: '', energyMeter: false,
  installationStatus: 'Not Started', inspectionStatus: 'Pending',
  commissioningStatus: 'Not Started', remarks: '',
};

function PanelRegister() {
  const { panels, addPanel, updatePanel, deletePanel } = useLVPanelStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'>>(PANEL_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const areas = useMemo(() => [...new Set(panels.map(p => p.electricalArea).filter(Boolean))], [panels]);

  const filtered = panels.filter(p => {
    const q = search.toLowerCase();
    return (
      (!q || p.panelId.toLowerCase().includes(q) || p.panelName.toLowerCase().includes(q) || p.electricalArea.toLowerCase().includes(q)) &&
      (!filterType || p.panelType === filterType) &&
      (!filterArea || p.electricalArea === filterArea) &&
      (!filterStatus || p.installationStatus === filterStatus)
    );
  });

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(PANEL_DEFAULTS); setEditId(null); setShowForm(true); };
  const openEdit = (p: LVPanel) => {
    const { id, createdAt, updatedAt, ...rest } = p;
    setForm(rest); setEditId(id); setShowForm(true);
  };

  const save = () => {
    if (!form.panelId.trim()) return;
    if (editId) updatePanel(editId, form); else addPanel(form);
    setShowForm(false); setEditId(null);
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(panels.map(p => ({
      'Panel ID': p.panelId, 'Panel Name': p.panelName, 'Type': p.panelType,
      'Area': p.electricalArea, 'Location': p.location, 'Parent': p.parentPanel,
      'Voltage (V)': p.ratedVoltage, 'Phases': p.phases, 'Rating (A)': p.ratedCurrentA,
      'Breaker (A)': p.incomingBreakerRating, 'Fault Duty (kA)': p.faultDutyKA,
      'Connected kW': p.connectedLoadKW, 'Max Demand kW': p.maxDemandKW,
      'Cable Size': p.incomingCableSize, 'Earth Size': p.earthingConductorSize,
      'Energy Meter': p.energyMeter ? 'Yes' : 'No',
      'Install Status': p.installationStatus, 'Inspection Status': p.inspectionStatus,
      'Commission Status': p.commissioningStatus, 'Remarks': p.remarks,
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Panel Register');
    XLSX.writeFile(wb, 'panel_register.xlsx');
  };

  const F = ({ lbl, k, type = 'text', opts }: { lbl: string; k: keyof typeof form; type?: string; opts?: string[] }) => (
    <div>
      <div style={label}>{lbl}</div>
      {opts ? (
        <select value={form[k] as string} onChange={e => set(k, e.target.value)} style={input()}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
          <input type="checkbox" checked={form[k] as boolean} onChange={e => set(k, e.target.checked)} />
          <span style={{ fontSize: 12, color: 'var(--ec-text-secondary)' }}>Yes</span>
        </label>
      ) : (
        <input type={type} value={form[k] as string | number} onChange={e => set(k, type === 'number' ? Number(e.target.value) : e.target.value)} style={input()} />
      )}
    </div>
  );

  return (
    <div>
      <SectionHeader title="Panel Register" subtitle="Add, edit and manage all LV distribution panels" icon={Server} />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ec-text-muted)' }} />
          <input placeholder="Search by ID, name, area…" value={search} onChange={e => setSearch(e.target.value)} style={input({ paddingLeft: 32, width: '100%' })} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={input({ width: 120 })}>
          <option value="">All Types</option>
          {['MDB','SMDB','MCC','DB','EDB','ESMDB','SDB','MLDB','Other'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={input({ width: 140 })}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={input({ width: 150 })}>
          <option value="">All Statuses</option>
          {['Not Started','In Progress','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Panel</button>
        <button style={btn('#22C55E')} onClick={exportCSV}><Download style={{ width: 14, height: 14 }} /> Export</button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: ACCENT }}>
            {editId ? 'Edit Panel' : 'Add New Panel'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            <F lbl="Panel ID *" k="panelId" />
            <F lbl="Panel Name" k="panelName" />
            <F lbl="Panel Type" k="panelType" opts={['MDB','SMDB','MCC','DB','EDB','ESMDB','SDB','MLDB','Other']} />
            <F lbl="Electrical Area" k="electricalArea" />
            <F lbl="Location" k="location" />
            <F lbl="Parent Panel" k="parentPanel" />
            <F lbl="Incoming Feeder Ref" k="incomingFeederRef" />
            <F lbl="Rated Voltage (V)" k="ratedVoltage" type="number" />
            <F lbl="Phases" k="phases" opts={['1','3']} />
            <F lbl="Rated Current (A)" k="ratedCurrentA" type="number" />
            <F lbl="Breaker Type" k="incomingBreakerType" opts={['ACB','MCCB','MCB','Fuse','RCCB']} />
            <F lbl="Breaker Rating (A)" k="incomingBreakerRating" type="number" />
            <F lbl="Fault Duty (kA)" k="faultDutyKA" type="number" />
            <F lbl="Connected Load (kW)" k="connectedLoadKW" type="number" />
            <F lbl="Max Demand (kW)" k="maxDemandKW" type="number" />
            <F lbl="Incoming Cable Size" k="incomingCableSize" />
            <F lbl="Earth Conductor Size" k="earthingConductorSize" />
            <F lbl="Energy Meter" k="energyMeter" type="checkbox" />
            <F lbl="Install Status" k="installationStatus" opts={['Not Started','In Progress','Completed']} />
            <F lbl="Inspection Status" k="inspectionStatus" opts={['Pending','Scheduled','Passed','Failed']} />
            <F lbl="Commission Status" k="commissioningStatus" opts={['Not Started','In Progress','Completed']} />
            <F lbl="Remarks" k="remarks" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}><XCircle style={{ width: 13, height: 13 }} /> Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0
        ? <EmptyState icon={Server} title="No panels found" sub='Click "Add Panel" to register your first panel.' />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Panel ID','Name','Type','Area','Location','Parent','V','Ph','A','kW','Demand','E.Meter','Install','Inspect','Actions'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                    <td style={td({ fontWeight: 700, color: ACCENT })}>{p.panelId}</td>
                    <td style={td()}>{p.panelName}</td>
                    <td style={td()}><StatusBadge status={p.panelType} /></td>
                    <td style={td()}>{p.electricalArea}</td>
                    <td style={td()}>{p.location}</td>
                    <td style={td()}>{p.parentPanel}</td>
                    <td style={td()}>{p.ratedVoltage}</td>
                    <td style={td()}>{p.phases}φ</td>
                    <td style={td()}>{p.ratedCurrentA}</td>
                    <td style={td()}>{p.connectedLoadKW}</td>
                    <td style={td()}>{p.maxDemandKW}</td>
                    <td style={td()}>{p.energyMeter ? '✓' : '—'}</td>
                    <td style={td()}><StatusBadge status={p.installationStatus} /></td>
                    <td style={td()}><StatusBadge status={p.inspectionStatus} /></td>
                    <td style={td()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(p)} style={{ ...btn(ACCENT, { padding: '4px 8px' }) }}>
                          <Pencil style={{ width: 11, height: 11 }} />
                        </button>
                        {confirmDel === p.id ? (
                          <>
                            <button onClick={() => { deletePanel(p.id); setConfirmDel(null); }} style={{ ...btn('#EF4444', { padding: '4px 8px' }) }}>✓</button>
                            <button onClick={() => setConfirmDel(null)} style={{ ...btn('#475569', { padding: '4px 8px' }) }}>✗</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(p.id)} style={{ ...btn('#EF4444', { padding: '4px 8px' }) }}>
                            <Trash2 style={{ width: 11, height: 11 }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Load Schedule ───────────────────────────────────────────────────

const LOAD_DEFAULTS: Omit<LVLoad, 'id'> = {
  panelId: '', circuitRef: '', description: '', equipmentName: '',
  area: '', loadCategory: 'General', loadFactor: 1,
  ratedKW: 0, powerFactor: 0.85, phases: 3, voltage: 400,
  quantity: 1, demandFactor: 1, designCurrentA: 0, startingCurrentA: 0,
  breakerType: 'MCB', breakerRating: 16, faultDutyKA: 0,
  cableType: '', cableSize: '', earthingConductorSize: '',
  remarks: '',
};

/** Calculate operating current from load parameters */
function calcIb(kw: number, pf: number, phases: 1 | 3, voltage: number): number {
  if (!kw || !pf || !voltage) return 0;
  const denom = phases === 3 ? (pf * voltage * 1.732) : (pf * voltage);
  return Math.round((kw * 1000 / denom) * 10) / 10;
}

function LoadSchedule() {
  const { panels, loads, addLoad, updateLoad, deleteLoad } = useLVPanelStore();
  const [panelFilter, setPanelFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVLoad, 'id'>>(LOAD_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [groupByPanel, setGroupByPanel] = useState(false);

  const panelIds = [...new Set(panels.map(p => p.panelId).concat(loads.map(l => l.panelId))).values()].filter(Boolean).sort();

  const visible = loads.filter(l => {
    const q = search.toLowerCase();
    return (
      (!panelFilter || l.panelId === panelFilter) &&
      (!q || l.circuitRef.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.equipmentName.toLowerCase().includes(q) || l.area.toLowerCase().includes(q))
    );
  });

  const setF = (k: keyof Omit<LVLoad, 'id'>, v: unknown) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      // Auto-compute designCurrentA if load params change
      if (['ratedKW','powerFactor','phases','voltage','quantity'].includes(k)) {
        const ib = calcIb(updated.ratedKW, updated.powerFactor, updated.phases, updated.voltage);
        return { ...updated, designCurrentA: ib };
      }
      return updated;
    });
  };

  const openAdd = () => {
    const base = { ...LOAD_DEFAULTS, panelId: panelFilter };
    setForm(base); setEditId(null); setShowForm(true);
  };
  const openEdit = (l: LVLoad) => {
    const { id, ...rest } = l; setForm(rest); setEditId(id); setShowForm(true);
  };
  const save = () => {
    if (editId) updateLoad(editId, form); else addLoad(form);
    setShowForm(false); setEditId(null);
  };

  const exportXLSX = () => {
    const rows = visible.map(l => ({
      'Panel ID': l.panelId, 'Circuit Ref': l.circuitRef,
      'Description': l.description, 'Equipment Name': l.equipmentName,
      'Area': l.area, 'Category': l.loadCategory,
      'Ph': l.phases === 1 ? '1φ' : '3φ', 'V': l.voltage,
      'kW': l.ratedKW, 'PF': l.powerFactor, 'Qty': l.quantity,
      'Total Connected kW': +(l.ratedKW * l.quantity).toFixed(3),
      'Load Factor (LF)': l.loadFactor,
      'Demand Factor (DF)': l.demandFactor,
      'Max Demand kW': +(l.ratedKW * l.quantity * l.demandFactor).toFixed(3),
      'Ib (A)': l.designCurrentA || calcIb(l.ratedKW, l.powerFactor, l.phases, l.voltage),
      'Starting I (A)': l.startingCurrentA,
      'Breaker Type': l.breakerType, 'Breaker (A)': l.breakerRating,
      'Fault Duty (kA)': l.faultDutyKA, 'Cable Type': l.cableType,
      'Cable mm²': l.cableSize, 'Earth mm²': l.earthingConductorSize,
      'Remarks': l.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Load Schedule');
    XLSX.writeFile(wb, 'electrical_load_schedule.xlsx');
  };

  // Group visible loads by panel for subtotals
  const panelGroups = useMemo(() => {
    if (!groupByPanel) return null;
    const map = new Map<string, LVLoad[]>();
    for (const l of visible) {
      const arr = map.get(l.panelId) ?? [];
      arr.push(l); map.set(l.panelId, arr);
    }
    return map;
  }, [visible, groupByPanel]);

  const grandTotal = {
    connected: visible.reduce((s, l) => s + l.ratedKW * l.quantity, 0),
    demand: visible.reduce((s, l) => s + l.ratedKW * l.quantity * l.demandFactor, 0),
  };

  const LOAD_CATEGORIES = ['General','Lighting','HVAC','Power','Fire & Safety','BMS','IT/Comms','Lifts','Pumps','Emergency','Other'];

  const FormField = ({ lbl, k, type = 'text', opts }: { lbl: string; k: keyof Omit<LVLoad,'id'>; type?: string; opts?: string[] }) => (
    <div>
      <div style={label}>{lbl}</div>
      {opts ? (
        <select value={form[k] as string} onChange={e => setF(k, e.target.value)} style={input()}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] as string | number}
          onChange={e => setF(k, type === 'number' ? Number(e.target.value) : e.target.value)}
          style={input()} />
      )}
    </div>
  );

  const renderRows = (rows: LVLoad[]) => rows.map((l, i) => {
    const totalKW = l.ratedKW * l.quantity;
    const maxDem = totalKW * l.demandFactor;
    const ib = l.designCurrentA || calcIb(l.ratedKW, l.powerFactor, l.phases, l.voltage);
    return (
      <tr key={l.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
        <td style={td({ color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' })}>{l.panelId}</td>
        <td style={td({ whiteSpace: 'nowrap' })}>{l.circuitRef}</td>
        <td style={td({ minWidth: 140 })}>{l.description}</td>
        <td style={td({ minWidth: 110 })}>{l.equipmentName}</td>
        <td style={td()}>{l.area}</td>
        <td style={td({ whiteSpace: 'nowrap' })}>{l.loadCategory}</td>
        <td style={td({ textAlign: 'center' })}>{l.phases}φ</td>
        <td style={td({ textAlign: 'right' })}>{l.ratedKW}</td>
        <td style={td({ textAlign: 'center' })}>{l.quantity}</td>
        <td style={td({ textAlign: 'right', fontWeight: 600 })}>{totalKW.toFixed(2)}</td>
        <td style={td({ textAlign: 'right', color: 'var(--ec-text-muted)' })}>{l.loadFactor.toFixed(2)}</td>
        <td style={td({ textAlign: 'right' })}>{l.demandFactor.toFixed(2)}</td>
        <td style={td({ textAlign: 'right', fontWeight: 600, color: '#F59E0B' })}>{maxDem.toFixed(2)}</td>
        <td style={td({ textAlign: 'right' })}>{ib.toFixed(1)}</td>
        <td style={td({ whiteSpace: 'nowrap' })}>{l.breakerType}</td>
        <td style={td({ textAlign: 'right' })}>{l.breakerRating}</td>
        <td style={td({ textAlign: 'right' })}>{l.faultDutyKA || '—'}</td>
        <td style={td({ whiteSpace: 'nowrap' })}>{l.cableType}</td>
        <td style={td({ textAlign: 'right' })}>{l.cableSize}</td>
        <td style={td({ textAlign: 'right' })}>{l.earthingConductorSize}</td>
        <td style={td({ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{l.remarks}</td>
        <td style={td()}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => openEdit(l)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
            {confirmDel === l.id ? (
              <>
                <button onClick={() => { deleteLoad(l.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button>
                <button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button>
              </>
            ) : (
              <button onClick={() => setConfirmDel(l.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
            )}
          </div>
        </td>
      </tr>
    );
  });

  const COLS = ['Panel','Circuit','Description','Equipment','Area','Category','Ph','kW','Qty','Total kW','LF','DF','Max Dem kW','Ib (A)','Bkr Type','Bkr (A)','FD kA','Cable Type','mm²','Earth mm²','Remarks','Actions'];

  return (
    <div>
      <SectionHeader title="Electrical Load Schedule" subtitle="Circuit-level load data with demand calculations" icon={FileText} />

      {/* Calculation methodology note */}
      <div style={{ ...card({ background: '#0EA5E911', border: '1px solid #0EA5E933' }), marginBottom: 14 }}>
        <button onClick={() => setShowMethodology(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 0 }}>
          {showMethodology ? <ChevronDown style={{ width: 14, height: 14, color: ACCENT }} /> : <ChevronRight style={{ width: 14, height: 14, color: ACCENT }} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>Calculation Methodology &amp; Assumptions</span>
        </button>
        {showMethodology && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 11, color: 'var(--ec-text-secondary)', lineHeight: 1.6 }}>
            <div>
              <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 4 }}>Computed Fields</div>
              <div><b>Total Connected kW</b> = Rated kW × Quantity</div>
              <div><b>Maximum Demand kW</b> = Total Connected kW × Demand Factor</div>
              <div><b>Ib (A) — 3φ</b> = (kW × 1000) ÷ (√3 × V × PF)</div>
              <div><b>Ib (A) — 1φ</b> = (kW × 1000) ÷ (V × PF)</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>Load Factor ≠ Demand Factor</div>
              <div><b>Load Factor (LF)</b>: Average load ÷ Peak load over a period. Operational characteristic of the equipment. <em>Not used in demand calculations.</em> Stored for reference only.</div>
              <div style={{ marginTop: 6 }}><b>Demand Factor (DF)</b>: Maximum demand ÷ Total connected load. Applied to reduce connected load to expected peak demand. <em>Used in: Max Demand = Total Connected × DF.</em></div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={panelFilter} onChange={e => setPanelFilter(e.target.value)} style={input({ width: 160 })}>
          <option value="">All Panels</option>
          {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--ec-text-muted)' }} />
          <input placeholder="Search description, circuit…" value={search} onChange={e => setSearch(e.target.value)} style={input({ paddingLeft: 28 })} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ec-text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={groupByPanel} onChange={e => setGroupByPanel(e.target.checked)} />
          Group by panel
        </label>
        <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Load</button>
        <button style={btn('#22C55E')} onClick={exportXLSX}><Download style={{ width: 14, height: 14 }} /> Export</button>
        <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', whiteSpace: 'nowrap' }}>
          {visible.length} circuits · <b>{grandTotal.connected.toFixed(1)}</b> kW conn · <b style={{ color: '#F59E0B' }}>{grandTotal.demand.toFixed(1)}</b> kW demand
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>
            {editId ? 'Edit Circuit Load' : 'Add Circuit Load'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
            <FormField lbl="Panel ID *" k="panelId" />
            <FormField lbl="Circuit Ref" k="circuitRef" />
            <FormField lbl="Description" k="description" />
            <FormField lbl="Equipment Name" k="equipmentName" />
            <FormField lbl="Area" k="area" />
            <FormField lbl="Load Category" k="loadCategory" opts={LOAD_CATEGORIES} />
            <FormField lbl="Phases" k="phases" opts={['1','3']} />
            <FormField lbl="Voltage (V)" k="voltage" type="number" />
            <FormField lbl="Rated kW" k="ratedKW" type="number" />
            <FormField lbl="Power Factor" k="powerFactor" type="number" />
            <FormField lbl="Quantity" k="quantity" type="number" />
            <FormField lbl="Load Factor (LF)" k="loadFactor" type="number" />
            <FormField lbl="Demand Factor (DF)" k="demandFactor" type="number" />
            <div>
              <div style={label}>Ib (A) — auto-computed</div>
              <input readOnly value={form.designCurrentA || calcIb(form.ratedKW, form.powerFactor, form.phases, form.voltage)} style={input({ opacity: 0.7 })} />
            </div>
            <FormField lbl="Starting I (A)" k="startingCurrentA" type="number" />
            <FormField lbl="Breaker Type" k="breakerType" opts={['MCB','MCCB','ACB','RCBO','Fuse']} />
            <FormField lbl="Breaker Rating (A)" k="breakerRating" type="number" />
            <FormField lbl="Fault Duty (kA)" k="faultDutyKA" type="number" />
            <FormField lbl="Cable Type" k="cableType" />
            <FormField lbl="Cable Size (mm²)" k="cableSize" />
            <FormField lbl="Earth Cond. (mm²)" k="earthingConductorSize" />
            <div style={{ gridColumn: 'span 4' }}>
              <div style={label}>Remarks</div>
              <input value={form.remarks} onChange={e => setF('remarks', e.target.value)} style={input()} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {visible.length === 0
        ? <EmptyState icon={FileText} title="No loads" sub='Click "Add Load" or import from Excel.' />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>{COLS.map(h => <th key={h} style={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {panelGroups
                  ? Array.from(panelGroups.entries()).map(([pid, rows]) => {
                    const subConn = rows.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
                    const subDem = rows.reduce((s, l) => s + l.ratedKW * l.quantity * l.demandFactor, 0);
                    return (
                      <React.Fragment key={pid}>
                        {renderRows(rows)}
                        <tr style={{ background: ACCENT + '22' }}>
                          <td colSpan={9} style={td({ fontWeight: 700, color: ACCENT })}>{pid} — Subtotal ({rows.length} circuits)</td>
                          <td style={td({ fontWeight: 700, textAlign: 'right' })}>{subConn.toFixed(2)}</td>
                          <td colSpan={2} />
                          <td style={td({ fontWeight: 700, textAlign: 'right', color: '#F59E0B' })}>{subDem.toFixed(2)}</td>
                          <td colSpan={9} />
                        </tr>
                      </React.Fragment>
                    );
                  })
                  : renderRows(visible)
                }
                {/* Grand total */}
                <tr style={{ background: 'var(--ec-border)', fontWeight: 700 }}>
                  <td colSpan={9} style={td({ fontWeight: 800 })}>Grand Total ({visible.length} circuits)</td>
                  <td style={td({ fontWeight: 800, textAlign: 'right' })}>{grandTotal.connected.toFixed(2)}</td>
                  <td colSpan={2} />
                  <td style={td({ fontWeight: 800, textAlign: 'right', color: '#F59E0B' })}>{grandTotal.demand.toFixed(2)}</td>
                  <td colSpan={9} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: MDB Details ─────────────────────────────────────────────────────

const MDB_TABS = ['A — General','B — Incoming','C — Feeders Out','D — Loads','E — Cable','F — Metering','G — Drawings','H — Inspection'] as const;
type MdbTab = typeof MDB_TABS[number];

function PanelDetail({ panel }: { panel: LVPanel }) {
  const { feeders, loads, meters, drawings, inspections, documents } = useLVPanelStore();
  const [tab, setTab] = useState<MdbTab>('A — General');

  const outFeeders = feeders.filter(f => f.fromPanel === panel.panelId);
  const inFeeders = feeders.filter(f => f.toPanel === panel.panelId);
  const panelLoads = loads.filter(l => l.panelId === panel.panelId);
  const panelMeters = meters.filter(m => m.panelId === panel.panelId);
  const panelDrawings = drawings.filter(d => d.relatedPanels.split(/[,;]/).map(s => s.trim()).includes(panel.panelId));
  const panelDocs = documents.filter(d => d.relatedPanels.split(/[,;]/).map(s => s.trim()).includes(panel.panelId));
  const panelInsp = inspections.filter(i => i.panelId === panel.panelId);

  const totalConn = panelLoads.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
  const totalDem = panelLoads.reduce((s, l) => s + l.ratedKW * l.quantity * l.demandFactor, 0);

  const Row = ({ lbl, val }: { lbl: string; val: React.ReactNode }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--ec-border)', padding: '7px 0' }}>
      <div style={{ width: 200, flexShrink: 0, fontSize: 11, fontWeight: 600, color: 'var(--ec-text-muted)', textTransform: 'uppercase' }}>{lbl}</div>
      <div style={{ fontSize: 12, color: 'var(--ec-text-primary)', flex: 1 }}>{val ?? '—'}</div>
    </div>
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {MDB_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 600,
            background: tab === t ? ACCENT : 'var(--ec-bg-surface)',
            color: tab === t ? '#fff' : 'var(--ec-text-secondary)',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab A — General */}
      {tab === 'A — General' && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{panel.panelId} — General Information</div>
          <Row lbl="Panel ID" val={<span style={{ fontWeight: 700, color: ACCENT }}>{panel.panelId}</span>} />
          <Row lbl="Panel Name" val={panel.panelName} />
          <Row lbl="Panel Type" val={<StatusBadge status={panel.panelType} />} />
          <Row lbl="Electrical Area" val={panel.electricalArea} />
          <Row lbl="Location" val={panel.location} />
          <Row lbl="Parent / Source Panel" val={panel.parentPanel || 'Root (no parent)'} />
          <Row lbl="System Voltage" val={`${panel.ratedVoltage} V, ${panel.phases}φ`} />
          <Row lbl="Installation Status" val={<StatusBadge status={panel.installationStatus} />} />
          <Row lbl="Inspection Status" val={<StatusBadge status={panel.inspectionStatus} />} />
          <Row lbl="Commissioning Status" val={<StatusBadge status={panel.commissioningStatus} />} />
          <Row lbl="Energy Meter" val={panel.energyMeter ? '✓ Installed' : '✗ Not Installed'} />
          <Row lbl="Remarks" val={panel.remarks} />
        </div>
      )}

      {/* Tab B — Incoming Supply */}
      {tab === 'B — Incoming' && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{panel.panelId} — Incoming Supply</div>
          <Row lbl="Incoming Feeder Ref" val={panel.incomingFeederRef} />
          <Row lbl="Rated Current (A)" val={`${panel.ratedCurrentA} A`} />
          <Row lbl="Incoming Breaker Type" val={panel.incomingBreakerType} />
          <Row lbl="Incoming Breaker Rating" val={`${panel.incomingBreakerRating} A`} />
          <Row lbl="Fault Duty Rating" val={`${panel.faultDutyKA} kA`} />
          <Row lbl="Incoming Cable Size" val={panel.incomingCableSize} />
          <Row lbl="Earthing Conductor" val={panel.earthingConductorSize} />
          {inFeeders.length > 0 && (
            <>
              <div style={{ marginTop: 12, marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--ec-text-muted)' }}>Upstream Feeder Records</div>
              {inFeeders.map(f => (
                <div key={f.id} style={{ background: 'var(--ec-bg-surface)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: ACCENT, fontWeight: 700 }}>{f.feederRef}</span>
                  {' — From: '}<span style={{ color: 'var(--ec-text-secondary)' }}>{f.fromPanel}</span>
                  {' · '}{f.cableSize} mm² {f.cableType}{' · '}{f.requiredLengthM} m (req)
                  {' · '}<StatusBadge status={f.installationStatus} />
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab C — Outgoing Feeders */}
      {tab === 'C — Feeders Out' && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>Outgoing Feeders from {panel.panelId}</div>
          {outFeeders.length === 0
            ? <EmptyState icon={Cable} title="No outgoing feeders" sub="Add feeders in Feeder & Cable Schedule." />
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Ref','To','Description','kW','Cable','Cores','Req L(m)','Act L(m)','Breaker','Status','Field Verify'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {outFeeders.map((f, i) => (
                      <tr key={f.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                        <td style={td({ color: ACCENT, fontWeight: 700 })}>{f.feederRef}</td>
                        <td style={td({ fontWeight: 600 })}>{f.toPanel}</td>
                        <td style={td()}>{f.description}</td>
                        <td style={td({ textAlign: 'right' })}>{f.loadKW}</td>
                        <td style={td()}>{f.cableSize} mm²</td>
                        <td style={td({ textAlign: 'center' })}>{f.numCores}C</td>
                        <td style={td({ textAlign: 'right' })}>{f.requiredLengthM}</td>
                        <td style={td({ textAlign: 'right' })}>{f.actualLengthM || '—'}</td>
                        <td style={td()}>{f.breakerType} {f.breakerRating}A</td>
                        <td style={td()}><StatusBadge status={f.installationStatus} /></td>
                        <td style={td()}><StatusBadge status={f.fieldVerificationStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8 }}>
                  {outFeeders.length} feeders · Total {outFeeders.reduce((s, f) => s + f.loadKW, 0).toFixed(1)} kW
                </div>
              </div>
            )}
        </div>
      )}

      {/* Tab D — Load Details */}
      {tab === 'D — Loads' && (
        <div style={card()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Load Details — {panel.panelId}</div>
            <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>
              {panelLoads.length} circuits · <b>{totalConn.toFixed(1)}</b> kW connected · <b style={{ color: '#F59E0B' }}>{totalDem.toFixed(1)}</b> kW demand
            </div>
          </div>
          {panelLoads.length === 0
            ? <EmptyState icon={FileText} title="No loads" sub="Add loads in Electrical Load Schedule." />
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Circuit','Description','Category','kW','Qty','Total kW','DF','Max Dem','Ib (A)','Breaker','Cable','Remarks'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {panelLoads.map((l, i) => {
                      const tot = l.ratedKW * l.quantity;
                      const dem = tot * l.demandFactor;
                      const ib = l.designCurrentA || calcIb(l.ratedKW, l.powerFactor, l.phases, l.voltage);
                      return (
                        <tr key={l.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                          <td style={td({ color: ACCENT })}>{l.circuitRef}</td>
                          <td style={td()}>{l.description}</td>
                          <td style={td()}>{l.loadCategory}</td>
                          <td style={td({ textAlign: 'right' })}>{l.ratedKW}</td>
                          <td style={td({ textAlign: 'center' })}>{l.quantity}</td>
                          <td style={td({ textAlign: 'right', fontWeight: 600 })}>{tot.toFixed(2)}</td>
                          <td style={td({ textAlign: 'right' })}>{l.demandFactor}</td>
                          <td style={td({ textAlign: 'right', color: '#F59E0B' })}>{dem.toFixed(2)}</td>
                          <td style={td({ textAlign: 'right' })}>{ib.toFixed(1)}</td>
                          <td style={td()}>{l.breakerType} {l.breakerRating}A</td>
                          <td style={td()}>{l.cableSize}</td>
                          <td style={td()}>{l.remarks}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: ACCENT + '22', fontWeight: 700 }}>
                      <td colSpan={5} style={td({ fontWeight: 800 })}>Panel Total</td>
                      <td style={td({ fontWeight: 800, textAlign: 'right' })}>{totalConn.toFixed(2)}</td>
                      <td />
                      <td style={td({ fontWeight: 800, textAlign: 'right', color: '#F59E0B' })}>{totalDem.toFixed(2)}</td>
                      <td colSpan={4} />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* Tab E — Cable Details */}
      {tab === 'E — Cable' && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>Cable Details — {panel.panelId}</div>
          <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: 'var(--ec-text-muted)' }}>Incoming</div>
          {inFeeders.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 12 }}>No incoming feeder records.</div>
            : inFeeders.map((f, i) => (
              <div key={f.id} style={{ ...card({ padding: '10px 14px', marginBottom: 8 }) }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                  <span><b style={{ color: ACCENT }}>{f.feederRef}</b></span>
                  <span>From: <b>{f.fromPanel}</b></span>
                  <span>Size: <b>{f.cableSize} mm²</b></span>
                  <span>Type: <b>{f.cableType}</b></span>
                  <span>Cores: <b>{f.numCores}C</b></span>
                  <span>Req: <b>{f.requiredLengthM} m</b></span>
                  <span>Act: <b>{f.actualLengthM || '—'} m</b></span>
                  <span>Earth: <b>{f.earthingCableSize || '—'}</b></span>
                  <span>Runs: <b>×{f.numRuns}</b></span>
                </div>
              </div>
            ))}
          <div style={{ marginBottom: 10, marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--ec-text-muted)' }}>Outgoing</div>
          {outFeeders.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No outgoing feeder records.</div>
            : outFeeders.map(f => (
              <div key={f.id} style={{ ...card({ padding: '10px 14px', marginBottom: 8 }) }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                  <span><b style={{ color: ACCENT }}>{f.feederRef}</b></span>
                  <span>To: <b>{f.toPanel}</b></span>
                  <span>Size: <b>{f.cableSize} mm²</b></span>
                  <span>Type: <b>{f.cableType}</b></span>
                  <span>Cores: <b>{f.numCores}C</b></span>
                  <span>Req: <b>{f.requiredLengthM} m</b></span>
                  <span>Act: <b>{f.actualLengthM || '—'} m</b></span>
                  {f.requiredLengthM > 0 && f.actualLengthM > 0 && (
                    <span style={{ color: f.requiredLengthM - f.actualLengthM >= 0 ? '#22C55E' : '#EF4444' }}>
                      Δ {(f.requiredLengthM - f.actualLengthM).toFixed(1)} m
                    </span>
                  )}
                  <span>Earth: <b>{f.earthingCableSize || '—'}</b></span>
                  <span>Runs: <b>×{f.numRuns}</b></span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tab F — Metering */}
      {tab === 'F — Metering' && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>Metering — {panel.panelId}</div>
          <Row lbl="Energy Meter Flag" val={panel.energyMeter ? <span style={{ color: '#22C55E', fontWeight: 700 }}>✓ Yes</span> : '✗ No'} />
          {panelMeters.length === 0
            ? <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ec-text-muted)' }}>No meter records. Add meters in Metering & CT Details.</div>
            : panelMeters.map(m => (
              <div key={m.id} style={{ ...card({ padding: '10px 14px', marginTop: 10 }) }}>
                <Row lbl="Meter Ref" val={<span style={{ color: ACCENT, fontWeight: 700 }}>{m.meterRef}</span>} />
                <Row lbl="Type" val={m.meterType} />
                <Row lbl="CT Ratio" val={m.ctRatio} />
                <Row lbl="Accuracy" val={m.accuracy} />
                <Row lbl="Serial No." val={m.serialNumber} />
                <Row lbl="Status" val={<StatusBadge status={m.installationStatus} />} />
                <Row lbl="Remarks" val={m.remarks} />
              </div>
            ))}
        </div>
      )}

      {/* Tab G — Drawings & Documents */}
      {tab === 'G — Drawings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card()}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>Drawings — {panel.panelId}</div>
            {panelDrawings.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No drawings. Enter the panel ID in the "Related Panels" field of drawings.</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Drawing No','Title','Rev','Date','Status','Remarks'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {panelDrawings.map((d, i) => (
                      <tr key={d.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                        <td style={td({ color: ACCENT })}>{d.drawingNo}</td>
                        <td style={td()}>{d.title}</td>
                        <td style={td()}>{d.revision}</td>
                        <td style={td()}>{d.date}</td>
                        <td style={td()}><StatusBadge status={d.status} /></td>
                        <td style={td()}>{d.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
          <div style={card()}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>Documents — {panel.panelId}</div>
            {panelDocs.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No documents linked to this panel.</div>
              : panelDocs.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--ec-border)', fontSize: 12 }}>
                  <span style={{ color: ACCENT, fontWeight: 700 }}>{d.docRef}</span>
                  <span style={{ flex: 1 }}>{d.title}</span>
                  <span style={{ color: 'var(--ec-text-muted)' }}>{d.revision} · {d.date}</span>
                  <StatusBadge status={d.status} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab H — Inspection */}
      {tab === 'H — Inspection' && (
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>Inspection & Maintenance — {panel.panelId}</div>
          {panelInsp.length === 0
            ? <EmptyState icon={ClipboardList} title="No inspections" sub="Add inspections in Inspection & Site Verification." />
            : panelInsp.map((x, i) => (
              <div key={x.id} style={{ ...card({ padding: '12px 16px', marginBottom: 10, borderLeft: `3px solid ${x.status === 'Passed' ? '#22C55E' : x.status === 'Failed' ? '#EF4444' : '#F59E0B'}` }) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{x.type} — {x.inspectionDate}</div>
                  <StatusBadge status={x.status} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ec-text-secondary)', marginBottom: 4 }}>Inspector: <b>{x.inspector}</b></div>
                {x.findings && <div style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Findings: {x.findings}</div>}
                {x.actionRequired && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Action: {x.actionRequired}</div>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function MDBDetails() {
  const { panels } = useLVPanelStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');

  const filtered = panels.filter(p =>
    (!search || p.panelId.toLowerCase().includes(search.toLowerCase()) || p.panelName.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || p.panelType === filterType)
  );

  const selected = panels.find(p => p.id === selectedId) ?? (filtered.length > 0 ? filtered[0] : null);

  return (
    <div>
      <SectionHeader title="MDB / SMDB / MCC Management" subtitle="Detailed panel pages with incoming, feeders, loads, metering and inspections" icon={Zap} />
      {panels.length === 0
        ? <EmptyState icon={Zap} title="No panels registered" sub="Add panels in Panel Register first." />
        : (
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Left panel list */}
            <div style={{ width: 220, flexShrink: 0 }}>
              <div style={{ marginBottom: 8 }}>
                <input placeholder="Search panel…" value={search} onChange={e => setSearch(e.target.value)} style={input({ fontSize: 11 })} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={input({ fontSize: 11, marginBottom: 8 })}>
                <option value="">All Types</option>
                {['MDB','SMDB','MCC','DB','EDB','ESMDB','SDB','MLDB','Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                {filtered.map(p => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 4,
                    background: (selected?.id === p.id) ? ACCENT + '33' : 'var(--ec-bg-surface)',
                    borderLeft: `3px solid ${selected?.id === p.id ? ACCENT : 'transparent'}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selected?.id === p.id ? ACCENT : 'var(--ec-text-primary)' }}>{p.panelId}</div>
                    <div style={{ fontSize: 10, color: 'var(--ec-text-muted)', marginTop: 2 }}>{p.panelType} · {p.electricalArea || p.location}</div>
                    <div style={{ marginTop: 4 }}><StatusBadge status={p.installationStatus} /></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right detail */}
            {selected
              ? <PanelDetail key={selected.id} panel={selected} />
              : <div style={{ flex: 1, ...card(), textAlign: 'center', padding: 40, color: 'var(--ec-text-muted)' }}>Select a panel from the list.</div>
            }
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Feeder & Cable Schedule ────────────────────────────────────────

const FEEDER_DEFAULTS: Omit<LVFeeder, 'id' | 'createdAt'> = {
  serialNo: '', feederRef: '', fromPanel: '', toPanel: '',
  description: '', area: '', loadKW: 0, loadPF: 0.85,
  phases: 3, voltage: 400, designCurrentA: 0,
  cableSize: '', cableType: 'XLPE/SWA/PVC', numCores: 4,
  requiredLengthM: 0, actualLengthM: 0, numRuns: 1,
  breakerRating: 0, breakerType: 'MCCB', demandFactor: 1,
  earthingCableSize: '', installationStatus: 'Not Started',
  fieldVerificationStatus: 'Pending', inspectionRemarks: '', remarks: '',
};

const FEEDER_STATUS_COLOR: Record<string, string> = {
  'Not Started': '#64748B', 'Cable Required': '#F59E0B', 'Cable Laid': '#3B82F6',
  'Termination Pending': '#8B5CF6', 'Terminated': '#0EA5E9',
  'Field Verification Pending': '#F97316', 'Verified': '#22C55E',
  'Cable Not Connected': '#EF4444', 'Completed': '#22C55E', 'On Hold': '#EF4444',
};

function FeederCable() {
  const { feeders, panels, addFeeder, updateFeeder, deleteFeeder } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVFeeder, 'id' | 'createdAt'>>(FEEDER_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // 5 filters
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('') ;
  const [fSize, setFSize] = useState('');
  const [fInstall, setFInstall] = useState('');
  const [fVerify, setFVerify] = useState('');

  const panelIds = [...new Set(panels.map(p => p.panelId))].sort();
  const cableSizes = [...new Set(feeders.map(f => f.cableSize).filter(Boolean))].sort();

  const visible = feeders.filter(f =>
    (!fFrom || f.fromPanel === fFrom) &&
    (!fTo || f.toPanel === fTo) &&
    (!fSize || f.cableSize === fSize) &&
    (!fInstall || f.installationStatus === fInstall) &&
    (!fVerify || f.fieldVerificationStatus === fVerify)
  );

  const setF = (k: keyof Omit<LVFeeder, 'id' | 'createdAt'>, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    const sn = String(feeders.length + 1).padStart(3, '0');
    setForm({ ...FEEDER_DEFAULTS, serialNo: sn }); setEditId(null); setShowForm(true);
  };
  const openEdit = (f: LVFeeder) => {
    const { id, createdAt, ...rest } = f; setForm(rest); setEditId(id); setShowForm(true);
  };
  const save = () => {
    if (editId) updateFeeder(editId, form); else addFeeder(form);
    setShowForm(false);
  };

  const exportXLSX = () => {
    const rows = visible.map(f => ({
      'S/N': f.serialNo, 'Feeder Ref': f.feederRef,
      'From Panel': f.fromPanel, 'To Panel / Equipment': f.toPanel,
      'Description': f.description, 'Area': f.area, 'kW': f.loadKW,
      'Cable Type': f.cableType, 'Runs': f.numRuns, 'Size (mm²)': f.cableSize,
      'Cores': f.numCores, 'Required Length (m)': f.requiredLengthM,
      'Actual Length (m)': f.actualLengthM,
      'Length Diff (m)': f.requiredLengthM > 0 && f.actualLengthM > 0 ? +(f.requiredLengthM - f.actualLengthM).toFixed(2) : '',
      'Earth Cable Size': f.earthingCableSize, 'Breaker Type': f.breakerType,
      'Breaker Rating (A)': f.breakerRating, 'Install Status': f.installationStatus,
      'Field Verify': f.fieldVerificationStatus, 'Inspection Remarks': f.inspectionRemarks,
      'Remarks': f.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Feeder Schedule');
    XLSX.writeFile(wb, 'feeder_cable_schedule.xlsx');
  };

  const totalReq = visible.reduce((s, f) => s + f.requiredLengthM * f.numRuns, 0);
  const totalAct = visible.reduce((s, f) => s + f.actualLengthM * f.numRuns, 0);
  const totalKW = visible.reduce((s, f) => s + f.loadKW, 0);

  const FormField = ({ lbl, k, type = 'text', opts }: { lbl: string; k: keyof Omit<LVFeeder,'id'|'createdAt'>; type?: string; opts?: string[] }) => (
    <div>
      <div style={label}>{lbl}</div>
      {opts ? (
        <select value={form[k] as string} onChange={e => setF(k, e.target.value)} style={input()}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] as string | number} onChange={e => setF(k, type === 'number' ? Number(e.target.value) : e.target.value)} style={input()} />
      )}
    </div>
  );

  return (
    <div>
      <SectionHeader title="Feeder & Cable Schedule" subtitle="Cable routing, lengths, status and site verification" icon={Cable} />

      {/* 5 filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={fFrom} onChange={e => setFFrom(e.target.value)} style={input({ width: 150 })}>
          <option value="">All Source Panels</option>
          {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <select value={fTo} onChange={e => setFTo(e.target.value)} style={input({ width: 150 })}>
          <option value="">All Destinations</option>
          {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <select value={fSize} onChange={e => setFSize(e.target.value)} style={input({ width: 130 })}>
          <option value="">All Cable Sizes</option>
          {cableSizes.map(s => <option key={s} value={s}>{s} mm²</option>)}
        </select>
        <select value={fInstall} onChange={e => setFInstall(e.target.value)} style={input({ width: 200 })}>
          <option value="">All Install Statuses</option>
          {FEEDER_INSTALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fVerify} onChange={e => setFVerify(e.target.value)} style={input({ width: 160 })}>
          <option value="">All Field Verify</option>
          {['Pending','In Progress','Verified','Not Required','Failed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(fFrom || fTo || fSize || fInstall || fVerify) && (
          <button style={btn('#475569', { fontSize: 11 })} onClick={() => { setFFrom(''); setFTo(''); setFSize(''); setFInstall(''); setFVerify(''); }}>
            Clear Filters
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Feeder</button>
          <button style={btn('#22C55E')} onClick={exportXLSX}><Download style={{ width: 14, height: 14 }} /> Export</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        <KpiCard value={visible.length} label="Feeders Shown" sub={`of ${feeders.length} total`} color={ACCENT} icon={Cable} />
        <KpiCard value={totalKW.toFixed(1) + ' kW'} label="Total Load" color="#8B5CF6" icon={Zap} />
        <KpiCard value={totalReq.toFixed(0) + ' m'} label="Required Cable" sub="sum × runs" color="#F59E0B" icon={Activity} />
        <KpiCard value={totalAct.toFixed(0) + ' m'} label="Installed Cable" sub="sum × runs" color="#22C55E" icon={CheckCircle} />
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>
            {editId ? 'Edit Feeder' : 'Add Feeder'}
          </div>
          <div style={{ ...card({ background: '#F59E0B11', border: '1px solid #F59E0B33' }), marginBottom: 12, fontSize: 11, color: 'var(--ec-text-secondary)' }}>
            <b>Note:</b> "Required Length" is from design drawings. "Actual Length" is measured on site after installation.
            Length Difference = Required − Actual. Do not mark status as Completed based on cable length alone — use status field explicitly.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
            <FormField lbl="Serial No." k="serialNo" />
            <FormField lbl="Feeder Ref *" k="feederRef" />
            <FormField lbl="From Panel" k="fromPanel" />
            <FormField lbl="To Panel / Equipment" k="toPanel" />
            <FormField lbl="Description" k="description" />
            <FormField lbl="Area" k="area" />
            <FormField lbl="Load kW" k="loadKW" type="number" />
            <FormField lbl="Power Factor" k="loadPF" type="number" />
            <FormField lbl="Phases" k="phases" opts={['1','3']} />
            <FormField lbl="Voltage (V)" k="voltage" type="number" />
            <FormField lbl="Design Ib (A)" k="designCurrentA" type="number" />
            <FormField lbl="Cable Size (mm²)" k="cableSize" />
            <FormField lbl="Cable Type" k="cableType" />
            <FormField lbl="No. of Cores" k="numCores" type="number" />
            <FormField lbl="No. of Runs" k="numRuns" type="number" />
            <FormField lbl="Required Length (m)" k="requiredLengthM" type="number" />
            <FormField lbl="Actual Installed (m)" k="actualLengthM" type="number" />
            <div>
              <div style={label}>Length Diff (m)</div>
              <input readOnly value={form.requiredLengthM > 0 && form.actualLengthM > 0 ? (form.requiredLengthM - form.actualLengthM).toFixed(2) : '—'} style={input({ opacity: 0.7 })} />
            </div>
            <FormField lbl="Earth Cable Size" k="earthingCableSize" />
            <FormField lbl="Breaker Type" k="breakerType" opts={['MCCB','MCB','ACB','Fuse']} />
            <FormField lbl="Breaker Rating (A)" k="breakerRating" type="number" />
            <FormField lbl="Demand Factor" k="demandFactor" type="number" />
            <FormField lbl="Install Status" k="installationStatus" opts={FEEDER_INSTALL_STATUSES} />
            <FormField lbl="Field Verify Status" k="fieldVerificationStatus" opts={['Pending','In Progress','Verified','Not Required','Failed']} />
            <div style={{ gridColumn: 'span 2' }}>
              <div style={label}>Inspection Remarks (site)</div>
              <input value={form.inspectionRemarks} onChange={e => setF('inspectionRemarks', e.target.value)} style={input()} />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <div style={label}>Remarks</div>
              <input value={form.remarks} onChange={e => setF('remarks', e.target.value)} style={input()} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {visible.length === 0
        ? <EmptyState icon={Cable} title="No feeders match filters" sub={feeders.length === 0 ? 'Click "Add Feeder" or import from Excel.' : 'Clear filters to see all feeders.'} />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['S/N','Ref','From','To','Description','Area','kW','Type','Runs','Size mm²','Cores','Req L(m)','Act L(m)','Δ L(m)','Earth','Breaker','Install Status','Field Verify','Insp. Remarks','Actions'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((f, i) => {
                  const lenDiff = f.requiredLengthM > 0 && f.actualLengthM > 0 ? f.requiredLengthM - f.actualLengthM : null;
                  const statusColor = FEEDER_STATUS_COLOR[f.installationStatus] ?? '#64748B';
                  return (
                    <tr key={f.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      <td style={td({ color: 'var(--ec-text-muted)' })}>{f.serialNo}</td>
                      <td style={td({ color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' })}>{f.feederRef}</td>
                      <td style={td({ fontWeight: 600, whiteSpace: 'nowrap' })}>{f.fromPanel}</td>
                      <td style={td({ fontWeight: 600, whiteSpace: 'nowrap' })}>{f.toPanel}</td>
                      <td style={td({ minWidth: 130 })}>{f.description}</td>
                      <td style={td()}>{f.area}</td>
                      <td style={td({ textAlign: 'right' })}>{f.loadKW}</td>
                      <td style={td({ whiteSpace: 'nowrap' })}>{f.cableType}</td>
                      <td style={td({ textAlign: 'center' })}>×{f.numRuns}</td>
                      <td style={td({ textAlign: 'right', fontWeight: 600 })}>{f.cableSize}</td>
                      <td style={td({ textAlign: 'center' })}>{f.numCores}C</td>
                      <td style={td({ textAlign: 'right' })}>{f.requiredLengthM || '—'}</td>
                      <td style={td({ textAlign: 'right' })}>{f.actualLengthM || '—'}</td>
                      <td style={td({ textAlign: 'right', fontWeight: 600, color: lenDiff === null ? 'inherit' : lenDiff >= 0 ? '#22C55E' : '#EF4444' })}>
                        {lenDiff === null ? '—' : `${lenDiff >= 0 ? '+' : ''}${lenDiff.toFixed(1)}`}
                      </td>
                      <td style={td()}>{f.earthingCableSize}</td>
                      <td style={td({ whiteSpace: 'nowrap' })}>{f.breakerType} {f.breakerRating}A</td>
                      <td style={td()}>
                        <span style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}55`, borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {f.installationStatus}
                        </span>
                      </td>
                      <td style={td()}><StatusBadge status={f.fieldVerificationStatus} /></td>
                      <td style={td({ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{f.inspectionRemarks}</td>
                      <td style={td()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(f)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                          {confirmDel === f.id ? (
                            <>
                              <button onClick={() => { deleteFeeder(f.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button>
                              <button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDel(f.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8, paddingLeft: 4 }}>
              {visible.length} records · Required: {totalReq.toFixed(0)} m · Installed: {totalAct.toFixed(0)} m
              {totalReq > 0 && totalAct > 0 && <span style={{ color: totalReq >= totalAct ? '#22C55E' : '#EF4444' }}> · Δ {(totalReq - totalAct).toFixed(0)} m</span>}
            </div>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Metering & CT ───────────────────────────────────────────────────

const METER_DEFAULTS: Omit<LVMeter, 'id'> = {
  meterRef: '', panelId: '', meterType: 'Energy Meter', ctRatio: '100/5',
  accuracy: 'Class 1', serialNumber: '', installationStatus: 'Pending', remarks: '',
};

function MeteringCT() {
  const { meters, addMeter, updateMeter, deleteMeter } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVMeter, 'id'>>(METER_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const setF = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const openAdd = () => { setForm(METER_DEFAULTS); setEditId(null); setShowForm(true); };
  const openEdit = (m: LVMeter) => {
    const { id, ...rest } = m; setForm(rest); setEditId(id); setShowForm(true);
  };
  const save = () => {
    if (editId) updateMeter(editId, form); else addMeter(form);
    setShowForm(false);
  };

  return (
    <div>
      <SectionHeader title="Metering & CT Details" subtitle="Energy meters, CTs and instrumentation" icon={Gauge} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Meter</button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ec-text-muted)' }}>
          {meters.filter(m => m.installationStatus !== 'Pending').length} installed / {meters.length} total
        </div>
      </div>
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit Meter' : 'Add Meter'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
            {([['Meter Ref','meterRef'],['Panel ID','panelId'],['Meter Type','meterType'],['CT Ratio','ctRatio'],['Accuracy','accuracy'],['Serial No.','serialNumber'],['Remarks','remarks']] as [string,keyof Omit<LVMeter,'id'>][]).map(([lbl, k]) => (
              <div key={k}>
                <div style={label}>{lbl}</div>
                <input value={form[k] as string} onChange={e => setF(k, e.target.value)} style={input()} />
              </div>
            ))}
            <div>
              <div style={label}>Status</div>
              <select value={form.installationStatus} onChange={e => setF('installationStatus', e.target.value)} style={input()}>
                {['Pending','Installed','Calibrated'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {meters.length === 0
        ? <EmptyState icon={Gauge} title="No meters" sub="Add meters for energy monitoring." />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Meter Ref','Panel','Type','CT Ratio','Accuracy','Serial No.','Status','Remarks','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {meters.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                    <td style={td({ color: ACCENT, fontWeight: 700 })}>{m.meterRef}</td>
                    <td style={td()}>{m.panelId}</td>
                    <td style={td()}>{m.meterType}</td>
                    <td style={td()}>{m.ctRatio}</td>
                    <td style={td()}>{m.accuracy}</td>
                    <td style={td()}>{m.serialNumber}</td>
                    <td style={td()}><StatusBadge status={m.installationStatus} /></td>
                    <td style={td()}>{m.remarks}</td>
                    <td style={td()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(m)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                        {confirmDel === m.id ? (
                          <>
                            <button onClick={() => { deleteMeter(m.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button>
                            <button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(m.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Load Summary ────────────────────────────────────────────────────

function LoadSummary() {
  const { panels, loads } = useLVPanelStore();

  const byPanel = panels.map(p => {
    const pl = loads.filter(l => l.panelId === p.panelId);
    const connKW = pl.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
    const demKW = pl.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0);
    return { panelId: p.panelId, name: p.panelName, area: p.electricalArea, circuits: pl.length, connKW, demKW };
  }).filter(r => r.circuits > 0 || panels.length > 0);

  const areas = [...new Set(loads.map(l => l.area).filter(Boolean))];
  const byArea = areas.map(area => {
    const al = loads.filter(l => l.area === area);
    return {
      area, circuits: al.length,
      connKW: al.reduce((s, l) => s + l.ratedKW * l.quantity, 0),
      demKW: al.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0),
    };
  });

  const grandKW = loads.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
  const grandDem = loads.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0);

  return (
    <div>
      <SectionHeader title="Load Summary" subtitle="Aggregated totals by panel and area" icon={BarChart3} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Panel</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Panel','Area','Circuits','Connected kW','Demand kW'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {byPanel.map((r, i) => (
                <tr key={r.panelId} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                  <td style={td({ color: ACCENT, fontWeight: 700 })}>{r.panelId}</td>
                  <td style={td()}>{r.area}</td>
                  <td style={td()}>{r.circuits}</td>
                  <td style={td()}>{r.connKW.toFixed(1)}</td>
                  <td style={td()}>{r.demKW.toFixed(1)}</td>
                </tr>
              ))}
              <tr style={{ background: 'var(--ec-bg-surface)', fontWeight: 700 }}>
                <td style={td({ fontWeight: 700 })} colSpan={3}>Grand Total</td>
                <td style={td({ fontWeight: 700, color: ACCENT })}>{grandKW.toFixed(1)}</td>
                <td style={td({ fontWeight: 700, color: ACCENT })}>{grandDem.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Area</div>
          {byArea.length === 0
            ? <EmptyState icon={BarChart3} title="No area data" sub="Add area to load items." />
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Area','Circuits','Connected kW','Demand kW'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {byArea.map((r, i) => (
                    <tr key={r.area} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      <td style={td()}>{r.area}</td>
                      <td style={td()}>{r.circuits}</td>
                      <td style={td()}>{r.connKW.toFixed(1)}</td>
                      <td style={td()}>{r.demKW.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: Drawings ────────────────────────────────────────────────────────

const DRAWING_DEFAULTS: Omit<LVDrawing, 'id'> = {
  drawingNo: '', title: '', discipline: 'Electrical', revision: 'Rev.0',
  date: new Date().toISOString().slice(0, 10),
  status: 'Draft', relatedPanels: '', remarks: '',
};

function Drawings() {
  const { drawings, addDrawing, updateDrawing, deleteDrawing } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVDrawing, 'id'>>(DRAWING_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const setF = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const openAdd = () => { setForm(DRAWING_DEFAULTS); setEditId(null); setShowForm(true); };
  const openEdit = (d: LVDrawing) => {
    const { id, ...rest } = d; setForm(rest); setEditId(id); setShowForm(true);
  };
  const save = () => {
    if (editId) updateDrawing(editId, form); else addDrawing(form);
    setShowForm(false);
  };

  const statusOptions = ['Draft','Issued for Approval','Issued for Construction','As-Built'];

  return (
    <div>
      <SectionHeader title="Electrical Drawings Register" subtitle="Drawing list, revisions and status tracking" icon={BookOpen} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Drawing</button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ec-text-muted)' }}>{drawings.length} drawings</div>
      </div>
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit Drawing' : 'Add Drawing'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
            {(['drawingNo','title','discipline','revision','date','relatedPanels','remarks'] as const).map(k => (
              <div key={k}>
                <div style={label}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
                <input value={form[k]} onChange={e => setF(k, e.target.value)} style={input()} type={k === 'date' ? 'date' : 'text'} />
              </div>
            ))}
            <div>
              <div style={label}>Status</div>
              <select value={form.status} onChange={e => setF('status', e.target.value as LVDrawing['status'])} style={input()}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {drawings.length === 0
        ? <EmptyState icon={BookOpen} title="No drawings" sub="Add drawings to track your electrical drawing register." />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Drawing No','Title','Discipline','Rev','Date','Status','Related Panels','Remarks','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {drawings.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                    <td style={td({ color: ACCENT, fontWeight: 700 })}>{d.drawingNo}</td>
                    <td style={td()}>{d.title}</td>
                    <td style={td()}>{d.discipline}</td>
                    <td style={td()}>{d.revision}</td>
                    <td style={td()}>{d.date}</td>
                    <td style={td()}><StatusBadge status={d.status} /></td>
                    <td style={td()}>{d.relatedPanels}</td>
                    <td style={td()}>{d.remarks}</td>
                    <td style={td()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(d)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                        {confirmDel === d.id ? (
                          <>
                            <button onClick={() => { deleteDrawing(d.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button>
                            <button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(d.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Power Distribution Tree ────────────────────────────────────────

function PowerDist() {
  const { panels } = useLVPanelStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const roots = panels.filter(p => !p.parentPanel);
  const children = (parentId: string) => panels.filter(p => p.parentPanel === parentId);

  const renderNode = (p: LVPanel, depth: number): React.ReactNode => {
    const kids = children(p.panelId);
    const isExp = expanded.has(p.panelId);
    return (
      <div key={p.id} style={{ marginLeft: depth * 24 }}>
        <div
          onClick={() => kids.length > 0 && toggle(p.panelId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderRadius: 8, cursor: kids.length > 0 ? 'pointer' : 'default',
            background: depth === 0 ? ACCENT + '22' : 'var(--ec-bg-surface)',
            border: `1px solid ${depth === 0 ? ACCENT + '55' : 'var(--ec-border)'}`,
            marginBottom: 4, userSelect: 'none',
          }}
        >
          {kids.length > 0 && (isExp ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronRight style={{ width: 13, height: 13 }} />)}
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{p.panelId}</span>
          <StatusBadge status={p.panelType} />
          {p.panelName && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>{p.panelName}</span>}
          <span style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginLeft: 'auto' }}>
            {p.connectedLoadKW > 0 && `${p.connectedLoadKW} kW`} {p.location && `· ${p.location}`}
          </span>
        </div>
        {kids.length > 0 && isExp && kids.map(c => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <SectionHeader title="Power Distribution Tree" subtitle="Panel hierarchy and single-line view" icon={Activity} />
      {panels.length === 0
        ? <EmptyState icon={Activity} title="No panels" sub='Register panels with parent relationships to build the distribution tree.' />
        : (
          <div style={card()}>
            <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 12 }}>
              Click on panels to expand/collapse children. Set "Parent Panel" in Panel Register to build hierarchy.
            </div>
            {roots.map(p => renderNode(p, 0))}
            {roots.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>
                No root panels found. Leave the "Parent Panel" field empty in Panel Register for root panels.
              </div>
            )}
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Document Management ────────────────────────────────────────────

const DOC_DEFAULTS: Omit<LVDocument, 'id'> = {
  docRef: '', title: '', category: 'Technical', revision: 'Rev.0',
  date: new Date().toISOString().slice(0, 10), author: '',
  status: 'Draft', relatedPanels: '', remarks: '',
};

function Documents() {
  const { documents, addDocument, updateDocument, deleteDocument } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVDocument, 'id'>>(DOC_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const setF = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (d: LVDocument) => { const { id, ...rest } = d; setForm(rest); setEditId(id); setShowForm(true); };
  const save = () => {
    if (editId) updateDocument(editId, form); else addDocument(form);
    setShowForm(false);
  };

  return (
    <div>
      <SectionHeader title="Document Management" subtitle="Submittals, reports and technical documents" icon={Database} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button style={btn(ACCENT)} onClick={() => { setForm(DOC_DEFAULTS); setEditId(null); setShowForm(true); }}>
          <Plus style={{ width: 14, height: 14 }} /> Add Document
        </button>
      </div>
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit Document' : 'Add Document'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
            {(['docRef','title','category','revision','date','author','status','relatedPanels','remarks'] as const).map(k => (
              <div key={k}>
                <div style={label}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
                <input value={form[k]} onChange={e => setF(k, e.target.value)} style={input()} type={k === 'date' ? 'date' : 'text'} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {documents.length === 0
        ? <EmptyState icon={Database} title="No documents" sub="Track submittals, reports and approvals." />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Doc Ref','Title','Category','Rev','Date','Author','Status','Related Panels','Remarks','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {documents.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                    <td style={td({ color: ACCENT, fontWeight: 700 })}>{d.docRef}</td>
                    <td style={td()}>{d.title}</td>
                    <td style={td()}>{d.category}</td>
                    <td style={td()}>{d.revision}</td>
                    <td style={td()}>{d.date}</td>
                    <td style={td()}>{d.author}</td>
                    <td style={td()}><StatusBadge status={d.status} /></td>
                    <td style={td()}>{d.relatedPanels}</td>
                    <td style={td()}>{d.remarks}</td>
                    <td style={td()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(d)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                        {confirmDel === d.id ? (
                          <>
                            <button onClick={() => { deleteDocument(d.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button>
                            <button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(d.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Inspection ──────────────────────────────────────────────────────

const INSP_DEFAULTS: Omit<LVInspection, 'id'> = {
  panelId: '', inspectionDate: new Date().toISOString().slice(0, 10),
  inspector: '', type: 'Visual', status: 'Pending',
  findings: '', actionRequired: '', remarks: '',
};

function Inspection() {
  const { inspections, addInspection, updateInspection, deleteInspection } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVInspection, 'id'>>(INSP_DEFAULTS);
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const setF = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (x: LVInspection) => { const { id, ...rest } = x; setForm(rest); setEditId(id); setShowForm(true); };
  const save = () => {
    if (editId) updateInspection(editId, form); else addInspection(form);
    setShowForm(false);
  };

  const visible = filterStatus ? inspections.filter(x => x.status === filterStatus) : inspections;
  const passed = inspections.filter(x => x.status === 'Passed').length;
  const failed = inspections.filter(x => x.status === 'Failed').length;
  const pending = inspections.filter(x => x.status === 'Pending').length;

  return (
    <div>
      <SectionHeader title="Inspection & Site Verification" subtitle="Site inspection records and action tracking" icon={ClipboardList} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard value={passed} label="Passed" color="#22C55E" icon={CheckCircle} />
        <KpiCard value={failed} label="Failed" color="#EF4444" icon={XCircle} />
        <KpiCard value={pending} label="Pending" color="#F59E0B" icon={Clock} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <button style={btn(ACCENT)} onClick={() => { setForm(INSP_DEFAULTS); setEditId(null); setShowForm(true); }}>
          <Plus style={{ width: 14, height: 14 }} /> Add Inspection
        </button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={input({ width: 150 })}>
          <option value="">All Statuses</option>
          {['Pending','Passed','Failed','Conditional'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit' : 'Add'} Inspection</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
            <div><div style={label}>Panel ID</div><input value={form.panelId} onChange={e => setF('panelId', e.target.value)} style={input()} /></div>
            <div><div style={label}>Inspection Date</div><input type="date" value={form.inspectionDate} onChange={e => setF('inspectionDate', e.target.value)} style={input()} /></div>
            <div><div style={label}>Inspector</div><input value={form.inspector} onChange={e => setF('inspector', e.target.value)} style={input()} /></div>
            <div>
              <div style={label}>Type</div>
              <select value={form.type} onChange={e => setF('type', e.target.value)} style={input()}>
                {['Visual','Functional','Commissioning'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={label}>Status</div>
              <select value={form.status} onChange={e => setF('status', e.target.value)} style={input()}>
                {['Pending','Passed','Failed','Conditional'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}><div style={label}>Findings</div><input value={form.findings} onChange={e => setF('findings', e.target.value)} style={input()} /></div>
            <div style={{ gridColumn: 'span 2' }}><div style={label}>Action Required</div><input value={form.actionRequired} onChange={e => setF('actionRequired', e.target.value)} style={input()} /></div>
            <div style={{ gridColumn: 'span 2' }}><div style={label}>Remarks</div><input value={form.remarks} onChange={e => setF('remarks', e.target.value)} style={input()} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {visible.length === 0
        ? <EmptyState icon={ClipboardList} title="No inspections" sub="Record site inspections and verification results." />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Panel','Date','Inspector','Type','Status','Findings','Action Required','Remarks','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {visible.map((x, i) => (
                  <tr key={x.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                    <td style={td({ color: ACCENT, fontWeight: 700 })}>{x.panelId}</td>
                    <td style={td()}>{x.inspectionDate}</td>
                    <td style={td()}>{x.inspector}</td>
                    <td style={td()}>{x.type}</td>
                    <td style={td()}><StatusBadge status={x.status} /></td>
                    <td style={td()}>{x.findings}</td>
                    <td style={td()}>{x.actionRequired}</td>
                    <td style={td()}>{x.remarks}</td>
                    <td style={td()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(x)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                        {confirmDel === x.id ? (
                          <>
                            <button onClick={() => { deleteInspection(x.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button>
                            <button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(x.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Reports ─────────────────────────────────────────────────────────

function Reports() {
  const store = useLVPanelStore();

  const exportPanels = () => {
    const ws = XLSX.utils.json_to_sheet(store.panels.map(p => ({
      'Panel ID': p.panelId, 'Panel Name': p.panelName, 'Type': p.panelType,
      'Area': p.electricalArea, 'Location': p.location, 'Voltage (V)': p.ratedVoltage,
      'Rating (A)': p.ratedCurrentA, 'Breaker (A)': p.incomingBreakerRating,
      'Fault kA': p.faultDutyKA, 'Connected kW': p.connectedLoadKW, 'Demand kW': p.maxDemandKW,
      'Cable': p.incomingCableSize, 'Install': p.installationStatus, 'Inspect': p.inspectionStatus,
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Panel Register');
    XLSX.writeFile(wb, 'panel_register.xlsx');
  };

  const exportFeeders = () => {
    const ws = XLSX.utils.json_to_sheet(store.feeders.map(f => ({
      'Ref': f.feederRef, 'From': f.fromPanel, 'To': f.toPanel, 'Description': f.description,
      'kW': f.loadKW, 'PF': f.loadPF, 'Phases': f.phases, 'V': f.voltage,
      'Ib (A)': f.designCurrentA, 'Cable mm²': f.cableSize, 'Type': f.cableType,
      'Length (m)': f.cableLength, 'Runs': f.numRuns, 'Breaker (A)': f.breakerRating,
      'Status': f.installationStatus,
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Feeder Schedule');
    XLSX.writeFile(wb, 'feeder_cable_schedule.xlsx');
  };

  const exportLoads = () => {
    const ws = XLSX.utils.json_to_sheet(store.loads.map(l => ({
      'Panel': l.panelId, 'Circuit': l.circuitRef, 'Description': l.description,
      'Area': l.area, 'kW': l.ratedKW, 'PF': l.powerFactor, 'Phases': l.phases,
      'V': l.voltage, 'DF': l.demandFactor, 'Qty': l.quantity,
      'Ib (A)': l.designCurrentA, 'Breaker (A)': l.breakerRating, 'Cable': l.cableSize,
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Load Schedule');
    XLSX.writeFile(wb, 'load_schedule.xlsx');
  };

  const exportFull = () => {
    const wb = XLSX.utils.book_new();
    const info = store.projectInfo;
    const infoWS = XLSX.utils.aoa_to_sheet([
      ['Project Name', info.projectName], ['Project No', info.projectNo],
      ['Client', info.client], ['Site', info.site], ['Engineer', info.engineer],
      ['Revision', info.revisionNo], ['Date', info.date],
      ['System Voltage', info.systemVoltage + ' V'], ['Frequency', info.frequency + ' Hz'],
    ]);
    XLSX.utils.book_append_sheet(wb, infoWS, 'Project Info');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.panels), 'Panels');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.feeders), 'Feeders');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.loads), 'Loads');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.meters), 'Meters');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.drawings), 'Drawings');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.inspections), 'Inspections');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(store.documents), 'Documents');
    XLSX.writeFile(wb, `${info.projectNo || 'LV_Panel'}_Full_Report.xlsx`);
  };

  const exports = [
    { title: 'Panel Register', sub: `${store.panels.length} panels`, color: ACCENT, action: exportPanels, icon: Server },
    { title: 'Feeder & Cable Schedule', sub: `${store.feeders.length} feeders`, color: '#8B5CF6', action: exportFeeders, icon: Cable },
    { title: 'Electrical Load Schedule', sub: `${store.loads.length} loads`, color: '#22C55E', action: exportLoads, icon: FileText },
    { title: 'Full Project Report', sub: 'All data, all sheets', color: '#F59E0B', action: exportFull, icon: Download },
  ];

  return (
    <div>
      <SectionHeader title="Reports & Excel Export" subtitle="Generate Excel reports for submission" icon={Download} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {exports.map(e => (
          <div key={e.title} style={card({ display: 'flex', alignItems: 'center', gap: 20 })}>
            <div style={{ background: e.color + '22', borderRadius: 12, padding: 14 }}>
              <e.icon style={{ width: 28, height: 28, color: e.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ec-text-primary)', marginBottom: 4 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 12 }}>{e.sub}</div>
              <button style={btn(e.color)} onClick={e.action}>
                <Download style={{ width: 13, height: 13 }} /> Download Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION: Import Excel ────────────────────────────────────────────────────

interface ParseResult {
  panels: Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'>[];
  loads: Omit<LVLoad, 'id'>[];
  feeders: Omit<LVFeeder, 'id' | 'createdAt'>[];
}

function colMatch(headers: string[], ...keywords: string[]): number {
  return headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
}

function cell(row: Record<string, string>, idx: number, headers: string[]): string {
  if (idx < 0) return '';
  return String(row[headers[idx]] ?? '').trim();
}

function parseExcel(data: ArrayBuffer): ParseResult {
  const wb = XLSX.read(data, { type: 'array' });
  const result: ParseResult = { panels: [], loads: [], feeders: [] };

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false });
    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0] ?? {});
    const hn = headers.map(h => h.toLowerCase());

    // Detect sheet type
    const hasCircuit = hn.some(h => h.includes('circuit') || h.includes('ref'));
    const hasFrom = hn.some(h => h === 'from' || h.includes('source') || h.includes('from panel'));
    const hasPanel = hn.some(h => h.includes('panel id') || h.includes('panel ref') || h.includes('board ref'));
    const hasKW = hn.some(h => h.includes('kw') || h.includes('power'));
    const sheetUpper = sheetName.toUpperCase();
    const panelPattern = /^(MDB|SMDB|MCC|DB|EDB|ESMDB|SDB|MLDB|MSDB)\s*[-_]?\s*\d+/;
    const sheetIsPanel = panelPattern.test(sheetUpper);

    if (hasPanel && !hasCircuit) {
      // Panel register sheet
      const iId = colMatch(headers, 'Panel ID', 'Panel Ref', 'Board Ref', 'Reference');
      const iName = colMatch(headers, 'Panel Name', 'Description', 'Name');
      const iType = colMatch(headers, 'Type', 'Panel Type', 'Board Type');
      const iLoc = colMatch(headers, 'Location', 'Area');
      const iRating = colMatch(headers, 'Rating', 'Rated Current', 'Incomer');
      const iKW = colMatch(headers, 'Connected', 'Total kW', 'kW');

      for (const row of rows) {
        const panelId = cell(row, iId, headers);
        if (!panelId || panelId.toLowerCase() === 'panel id') continue;
        result.panels.push({
          panelId, panelName: cell(row, iName, headers),
          panelType: (cell(row, iType, headers) as LVPanel['panelType']) || 'MDB',
          electricalArea: cell(row, iLoc, headers), location: '',
          parentPanel: '', incomingFeederRef: '', ratedVoltage: 400, phases: 3,
          ratedCurrentA: Number(cell(row, iRating, headers)) || 0,
          incomingBreakerType: 'ACB', incomingBreakerRating: 0,
          faultDutyKA: 50,
          connectedLoadKW: Number(cell(row, iKW, headers)) || 0,
          maxDemandKW: 0, incomingCableSize: '', earthingConductorSize: '',
          energyMeter: false, installationStatus: 'Not Started',
          inspectionStatus: 'Pending', commissioningStatus: 'Not Started', remarks: '',
        });
      }
    } else if (hasFrom && hasKW) {
      // Feeder / cable schedule
      const iRef = colMatch(headers, 'Cable Ref', 'Feeder Ref', 'Cable No', 'Ref');
      const iFrom = colMatch(headers, 'From', 'Source', 'From Panel');
      const iTo = colMatch(headers, 'To', 'Destination', 'To Panel');
      const iKW2 = colMatch(headers, 'kW', 'Load kW', 'kilo');
      const iSize = colMatch(headers, 'Size', 'Cable Size', 'mm²', 'mm2');
      const iLen = colMatch(headers, 'Length', 'Run', 'Route');
      const iBreaker = colMatch(headers, 'Breaker', 'OCPD', 'Rating');
      const iDesc = colMatch(headers, 'Description', 'Load Description');

      for (const row of rows) {
        const feederRef = cell(row, iRef, headers) || `F${result.feeders.length + 1}`.padStart(3, '0');
        const fromPanel = cell(row, iFrom, headers);
        const toPanel = cell(row, iTo, headers);
        if (!fromPanel && !toPanel) continue;
        result.feeders.push({
          feederRef, fromPanel, toPanel,
          description: cell(row, iDesc, headers), area: '',
          loadKW: Number(cell(row, iKW2, headers)) || 0,
          loadPF: 0.85, phases: 3, voltage: 400, designCurrentA: 0,
          cableSize: cell(row, iSize, headers),
          cableType: 'XLPE/SWA/PVC',
          cableLength: Number(cell(row, iLen, headers)) || 0,
          numRuns: 1, breakerRating: Number(cell(row, iBreaker, headers)) || 0,
          breakerType: 'MCCB', demandFactor: 1,
          installationStatus: 'Pending', remarks: '',
        });
      }
    } else if (hasCircuit || sheetIsPanel || hasKW) {
      // Load schedule sheet
      const derivedPanel = sheetIsPanel ? sheetName : '';
      const iRef = colMatch(headers, 'Circuit', 'Ref', 'Item', 'No.', 'Circuit Ref');
      const iDesc = colMatch(headers, 'Description', 'Load Description', 'Equipment', 'Load Name');
      const iKW2 = colMatch(headers, 'kW', 'Rated kW', 'Power (kW)', 'kilo');
      const iPF = colMatch(headers, 'PF', 'Power Factor', 'cos');
      const iPh = colMatch(headers, 'Phase', 'Ph');
      const iV = colMatch(headers, 'Voltage', 'Volt', 'V (');
      const iDF = colMatch(headers, 'Demand Factor', 'DF');
      const iQty = colMatch(headers, 'Qty', 'Quantity', 'No.');
      const iBreaker = colMatch(headers, 'Breaker', 'OCPD', 'CB Rating', 'Rating (A)');
      const iCable = colMatch(headers, 'Cable Size', 'Cable (mm', 'Conductor', 'mm²');
      const iArea = colMatch(headers, 'Area', 'Location', 'Zone');
      const iPanelId = colMatch(headers, 'Panel', 'Board', 'Panel ID');

      let rowIdx = 0;
      for (const row of rows) {
        const desc = cell(row, iDesc, headers);
        if (!desc || desc.toLowerCase() === 'description' || desc.toLowerCase() === 'load description') continue;
        const kwStr = cell(row, iKW2, headers);
        const kw = Number(kwStr.replace(/[^0-9.]/g, ''));
        if (isNaN(kw) && !desc) continue;
        rowIdx++;
        const panelId = cell(row, iPanelId, headers) || derivedPanel;
        const rawPh = cell(row, iPh, headers);
        const phases: 1 | 3 = rawPh === '1' || rawPh.toLowerCase() === 'single' ? 1 : 3;
        const rawV = cell(row, iV, headers);
        const voltage = Number(rawV) || (phases === 1 ? 230 : 400);
        const df = Number(cell(row, iDF, headers)) || 1;
        const qty = Number(cell(row, iQty, headers)) || 1;
        const pf = Number(cell(row, iPF, headers)) || 0.85;
        const ib = kw * 1000 / (pf * (phases === 3 ? 1.732 * voltage : voltage)) || 0;

        result.loads.push({
          panelId, circuitRef: cell(row, iRef, headers) || `C${rowIdx}`,
          description: desc, area: cell(row, iArea, headers),
          loadType: 'General', ratedKW: kw, powerFactor: pf, phases, voltage,
          demandFactor: df > 1 ? df / 100 : df, quantity: qty,
          designCurrentA: Math.round(ib * 10) / 10, startingCurrentA: 0,
          breakerRating: Number(cell(row, iBreaker, headers)) || 0,
          cableSize: cell(row, iCable, headers), remarks: '',
        });
      }
    }
  }
  return result;
}

function ImportExcel() {
  const { importPanels, importFeeders, importLoads } = useLVPanelStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('panels');
  const [mergeMode, setMergeMode] = useState(true);
  const [imported, setImported] = useState<{ panels: number; loads: number; feeders: number } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const result = parseExcel(buf);
    setParsed(result); setImported(null);
  };

  const doImport = () => {
    if (!parsed) return;
    importPanels(parsed.panels, mergeMode);
    importFeeders(parsed.feeders, mergeMode);
    importLoads(parsed.loads, mergeMode);
    setImported({ panels: parsed.panels.length, loads: parsed.loads.length, feeders: parsed.feeders.length });
  };

  const tabs = [
    { id: 'panels', label: `Panels (${parsed?.panels.length ?? 0})` },
    { id: 'loads', label: `Loads (${parsed?.loads.length ?? 0})` },
    { id: 'feeders', label: `Feeders (${parsed?.feeders.length ?? 0})` },
  ];

  return (
    <div>
      <SectionHeader title="Import Excel Data" subtitle="Import load schedules, panels and cable data from Excel" icon={Upload} />

      {/* Info */}
      <div style={{ ...card({ background: ACCENT + '11', border: `1px solid ${ACCENT}44` }), marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>Smart Excel Parser</div>
        <div style={{ fontSize: 12, color: 'var(--ec-text-secondary)', lineHeight: 1.6 }}>
          Supports load schedule workbooks (e.g. MEP RAK-516). The parser automatically detects sheet types:
          <br />• Sheets named like <strong>MDB-01, SMDB-02</strong> are parsed as load schedules for that panel
          <br />• Sheets with "From / To" columns are parsed as feeder/cable schedules
          <br />• Sheets with "Panel ID" columns are parsed as panel registers
        </div>
      </div>

      {/* Upload */}
      <div style={{ ...card(), marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Step 1 — Select Excel File</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={btn(ACCENT)} onClick={() => fileRef.current?.click()}>
            <Upload style={{ width: 14, height: 14 }} /> Browse File
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
          {fileName && <span style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>📄 {fileName}</span>}
        </div>
      </div>

      {/* Preview */}
      {parsed && (
        <>
          <div style={{ ...card(), marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Step 2 — Preview Parsed Data</div>
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginLeft: 'auto' }}>
                Found {parsed.panels.length} panels · {parsed.loads.length} loads · {parsed.feeders.length} feeders
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: activeTab === t.id ? ACCENT : 'var(--ec-bg-surface)',
                  color: activeTab === t.id ? '#fff' : 'var(--ec-text-secondary)',
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', overflowX: 'auto' }}>
              {activeTab === 'panels' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Panel ID','Name','Type','Area','Rating (A)','kW'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {parsed.panels.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                        <td style={td({ color: ACCENT, fontWeight: 700 })}>{p.panelId}</td>
                        <td style={td()}>{p.panelName}</td>
                        <td style={td()}>{p.panelType}</td>
                        <td style={td()}>{p.electricalArea}</td>
                        <td style={td()}>{p.ratedCurrentA}</td>
                        <td style={td()}>{p.connectedLoadKW}</td>
                      </tr>
                    ))}
                    {parsed.panels.length === 0 && <tr><td colSpan={6} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No panels detected</td></tr>}
                  </tbody>
                </table>
              )}
              {activeTab === 'loads' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Panel','Circuit','Description','kW','PF','Ph','V','DF','Breaker','Cable'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {parsed.loads.map((l, i) => (
                      <tr key={i} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                        <td style={td({ color: ACCENT })}>{l.panelId}</td>
                        <td style={td()}>{l.circuitRef}</td>
                        <td style={td()}>{l.description}</td>
                        <td style={td()}>{l.ratedKW}</td>
                        <td style={td()}>{l.powerFactor}</td>
                        <td style={td()}>{l.phases}φ</td>
                        <td style={td()}>{l.voltage}</td>
                        <td style={td()}>{l.demandFactor}</td>
                        <td style={td()}>{l.breakerRating}</td>
                        <td style={td()}>{l.cableSize}</td>
                      </tr>
                    ))}
                    {parsed.loads.length === 0 && <tr><td colSpan={10} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No loads detected</td></tr>}
                  </tbody>
                </table>
              )}
              {activeTab === 'feeders' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Ref','From','To','kW','Cable','Length'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {parsed.feeders.map((f, i) => (
                      <tr key={i} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                        <td style={td({ color: ACCENT })}>{f.feederRef}</td>
                        <td style={td()}>{f.fromPanel}</td>
                        <td style={td()}>{f.toPanel}</td>
                        <td style={td()}>{f.loadKW}</td>
                        <td style={td()}>{f.cableSize}</td>
                        <td style={td()}>{f.cableLength}</td>
                      </tr>
                    ))}
                    {parsed.feeders.length === 0 && <tr><td colSpan={6} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No feeders detected</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ ...card(), marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Step 3 — Import Options</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
              <input type="checkbox" checked={mergeMode} onChange={e => setMergeMode(e.target.checked)} />
              <span style={{ fontSize: 12, color: 'var(--ec-text-secondary)' }}>
                Merge mode — skip existing panels/feeders (by ID), only add new records
              </span>
            </label>
            {!mergeMode && (
              <div style={{ background: '#EF444422', border: '1px solid #EF444455', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#EF4444' }}>
                ⚠️ Replace mode will overwrite all existing panels and feeders.
              </div>
            )}
            <button style={btn('#22C55E')} onClick={doImport}>
              <CheckCircle style={{ width: 14, height: 14 }} /> Import {parsed.panels.length + parsed.loads.length + parsed.feeders.length} Records
            </button>
          </div>

          {imported && (
            <div style={{ background: '#22C55E22', border: '1px solid #22C55E55', borderRadius: 10, padding: 16, fontSize: 13, color: '#22C55E' }}>
              ✅ Import successful — {imported.panels} panels, {imported.loads} loads, {imported.feeders} feeders added.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SECTION: Settings ────────────────────────────────────────────────────────

function LVSettings() {
  const { projectInfo, setProjectInfo, panels, feeders, loads, meters, drawings, inspections, documents, clearAll } = useLVPanelStore();
  const [form, setForm] = useState(projectInfo);
  const [confirmClear, setConfirmClear] = useState(false);
  const setF = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <SectionHeader title="Project Settings" subtitle="Project information and data management" icon={Settings} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Project Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {([
              ['Project Name', 'projectName'], ['Project No', 'projectNo'],
              ['Client', 'client'], ['Site', 'site'], ['Engineer', 'engineer'],
              ['Revision No', 'revisionNo'],
            ] as [string, keyof typeof form][]).map(([lbl, k]) => (
              <div key={k}>
                <div style={label}>{lbl}</div>
                <input value={form[k] as string} onChange={e => setF(k, e.target.value)} style={input()} />
              </div>
            ))}
            <div>
              <div style={label}>System Voltage (V)</div>
              <input type="number" value={form.systemVoltage} onChange={e => setF('systemVoltage', Number(e.target.value))} style={input()} />
            </div>
            <div>
              <div style={label}>Frequency (Hz)</div>
              <input type="number" value={form.frequency} onChange={e => setF('frequency', Number(e.target.value))} style={input()} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={label}>Date</div>
              <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} style={input()} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={label}>Remarks</div>
              <input value={form.remarks} onChange={e => setF('remarks', e.target.value)} style={input()} />
            </div>
          </div>
          <button style={btn(ACCENT)} onClick={() => setProjectInfo(form)}>
            <CheckCircle style={{ width: 13, height: 13 }} /> Save Changes
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card()}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Record Counts</div>
            {[
              ['Panels', panels.length], ['Feeders', feeders.length], ['Loads', loads.length],
              ['Meters', meters.length], ['Drawings', drawings.length],
              ['Inspections', inspections.length], ['Documents', documents.length],
            ].map(([l, v]) => (
              <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--ec-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--ec-text-secondary)' }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ ...card(), border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Danger Zone</div>
            <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 12 }}>
              This will permanently delete all panels, loads, feeders, and related records.
            </div>
            {confirmClear ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btn('#EF4444')} onClick={() => { clearAll(); setConfirmClear(false); }}>
                  Yes, Delete All
                </button>
                <button style={btn('#475569')} onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            ) : (
              <button style={btn('#EF4444')} onClick={() => setConfirmClear(true)}>
                <AlertCircle style={{ width: 13, height: 13 }} /> Clear All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

const SECTION_MAP: Record<string, React.ComponentType> = {
  'dashboard': Dashboard,
  'panel-register': PanelRegister,
  'load-schedule': LoadSchedule,
  'mdb-details': MDBDetails,
  'feeder-cable': FeederCable,
  'metering-ct': MeteringCT,
  'load-summary': LoadSummary,
  'drawings': Drawings,
  'power-dist': PowerDist,
  'documents': Documents,
  'inspection': Inspection,
  'reports': Reports,
  'import-excel': ImportExcel,
  'lv-settings': LVSettings,
};

export function LVPanelModule({ section }: { section: string }) {
  const { panels, addPanel } = useLVPanelStore();

  // Seed one demo panel on first load
  useEffect(() => {
    if (panels.length === 0) {
      addPanel({
        panelId: 'MDB-01', panelName: 'Main Distribution Board',
        panelType: 'MDB', electricalArea: 'Utility Room', location: 'Ground Floor',
        parentPanel: '', incomingFeederRef: 'DEWA-INC-01',
        ratedVoltage: 400, phases: 3, ratedCurrentA: 1600,
        incomingBreakerType: 'ACB', incomingBreakerRating: 1600, faultDutyKA: 50,
        connectedLoadKW: 0, maxDemandKW: 0, incomingCableSize: '4×300 mm²',
        earthingConductorSize: '150 mm²', energyMeter: true,
        installationStatus: 'Not Started', inspectionStatus: 'Pending',
        commissioningStatus: 'Not Started', remarks: 'Main incomer from DEWA',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Section = SECTION_MAP[section] ?? Dashboard;

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 4px' }}>
      <Section />
    </div>
  );
}
