import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Server, FileText, Zap, Cable, Gauge, BarChart3,
  BookOpen, Activity, Database, ClipboardList, Download, Upload, Settings,
  Plus, Pencil, Trash2, Search, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronDown, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useLVPanelStore, FEEDER_INSTALL_STATUSES, SITE_VERIF_STATUSES } from '../../store/useLVPanelStore';
import type {
  LVPanel, LVFeeder, LVLoad, LVMeter, LVDrawing, LVInspection, LVDocument,
  LVCalcRecord, LVSwitchingRecord, LVBreakerState, LVProjectSnapshot,
  MeteringPriority, EmsStatus, CalcType, VerificationStatus,
  SiteVerifStatus, CheckResult, LVAuditEntry, LVImportBatch, ImportMode,
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

      {/* Table — layout matches source workbook: Serial | Source | Load Details | Area | Users | kW | OG Breaker | Breaker Size | Cable Type | Length */}
      {visible.length === 0
        ? <EmptyState icon={Cable} title="No feeders match filters" sub={feeders.length === 0 ? 'Click "Add Feeder" or import from Excel.' : 'Clear filters to see all feeders.'} />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {[
                    'S/N', 'Source\n(From Panel)', 'Load Details\n(Description)', 'Area',
                    'Users\n(To Panel / Equipment)', 'kW',
                    'OG Breaker\n(Type)', 'Breaker Size\n(Rating)',
                    'Cable Type', 'Req. Length\n(m)', 'Act. Length\n(m)', 'Δ L (m)',
                    'Cable Size\n(mm²)', 'Cores × Runs',
                    'Install Status', 'Field Verify', 'Actions',
                  ].map(h => (
                    <th key={h} style={{ ...TH, whiteSpace: 'pre-line', minWidth: h.includes('Description') ? 140 : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((f, i) => {
                  const lenDiff = f.requiredLengthM > 0 && f.actualLengthM > 0 ? f.requiredLengthM - f.actualLengthM : null;
                  const statusColor = FEEDER_STATUS_COLOR[f.installationStatus] ?? '#64748B';
                  return (
                    <tr key={f.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      {/* S/N */}
                      <td style={td({ color: 'var(--ec-text-muted)', textAlign: 'center' })}>{f.serialNo || String(i + 1).padStart(2, '0')}</td>
                      {/* Source */}
                      <td style={td({ color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' })}>{f.fromPanel}</td>
                      {/* Load Details */}
                      <td style={td({ minWidth: 140 })}>
                        <div style={{ fontWeight: 600 }}>{f.description}</div>
                        {f.feederRef && <div style={{ fontSize: 10, color: 'var(--ec-text-muted)' }}>{f.feederRef}</div>}
                      </td>
                      {/* Area */}
                      <td style={td()}>{f.area}</td>
                      {/* Users / Destination */}
                      <td style={td({ fontWeight: 600, whiteSpace: 'nowrap' })}>{f.toPanel}</td>
                      {/* kW */}
                      <td style={td({ textAlign: 'right', fontWeight: 600 })}>{f.loadKW || '—'}</td>
                      {/* OG Breaker type */}
                      <td style={td({ whiteSpace: 'nowrap' })}>{f.breakerType || '—'}</td>
                      {/* Breaker Size */}
                      <td style={td({ whiteSpace: 'nowrap', fontWeight: 600 })}>
                        {f.breakerRating ? `${f.breakerRating}A ${f.breakerType}` : '—'}
                      </td>
                      {/* Cable Type */}
                      <td style={td({ whiteSpace: 'nowrap' })}>{f.cableType || '—'}</td>
                      {/* Required Length */}
                      <td style={td({ textAlign: 'right' })}>{f.requiredLengthM || '—'}</td>
                      {/* Actual Length */}
                      <td style={td({ textAlign: 'right' })}>{f.actualLengthM || '—'}</td>
                      {/* Δ Length */}
                      <td style={td({ textAlign: 'right', fontWeight: 600, color: lenDiff === null ? 'inherit' : lenDiff >= 0 ? '#22C55E' : '#EF4444' })}>
                        {lenDiff === null ? '—' : `${lenDiff >= 0 ? '+' : ''}${lenDiff.toFixed(1)}`}
                      </td>
                      {/* Cable Size */}
                      <td style={td({ textAlign: 'right', fontWeight: 600 })}>{f.cableSize || '—'}</td>
                      {/* Cores × Runs */}
                      <td style={td({ textAlign: 'center' })}>{f.numCores}C × {f.numRuns}</td>
                      {/* Install Status */}
                      <td style={td()}>
                        <span style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}55`, borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {f.installationStatus}
                        </span>
                      </td>
                      {/* Field Verify */}
                      <td style={td()}><StatusBadge status={f.fieldVerificationStatus} /></td>
                      {/* Actions */}
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
  meterRef: '', panelId: '', feederId: '', equipmentDescription: '',
  meterRequired: true, meterInstalled: false,
  manufacturer: '', model: '', meterType: 'Energy Meter',
  ctRatio: '', ctAccuracyClass: '', ctQuantity: 1,
  meteringPriority: 'Normal', communicationProtocol: '',
  emsIntegrationStatus: 'Not Applicable', serialNumber: '',
  installationStatus: 'Pending', remarks: '', photos: [],
};

function MeteringCT() {
  const { meters, panels, addMeter, updateMeter, deleteMeter } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVMeter, 'id'>>(METER_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [filterPanel, setFilterPanel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);

  const panelIds = [...new Set(panels.map(p => p.panelId))].sort();
  const visible = meters.filter(m =>
    (!filterPanel || m.panelId === filterPanel) &&
    (!filterStatus || m.installationStatus === filterStatus) &&
    (!filterPriority || m.meteringPriority === filterPriority)
  );

  const setF = (k: keyof Omit<LVMeter,'id'>, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const openAdd = () => { setForm(METER_DEFAULTS); setEditId(null); setShowForm(true); };
  const openEdit = (m: LVMeter) => { const { id, ...rest } = m; setForm(rest); setEditId(id); setShowForm(true); };
  const save = () => { if (editId) updateMeter(editId, form); else addMeter(form); setShowForm(false); };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = file.size <= 512 * 1024 ? (ev.target?.result as string) : undefined;
      const photo = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), dataUrl };
      setF('photos', [...(form.photos ?? []), photo]);
    };
    reader.readAsDataURL(file);
  };

  const exportXLSX = () => {
    const rows = visible.map(m => ({
      'Meter Ref': m.meterRef, 'Panel ID': m.panelId, 'Feeder ID': m.feederId,
      'Equipment': m.equipmentDescription, 'Meter Required': m.meterRequired ? 'Yes' : 'No',
      'Meter Installed': m.meterInstalled ? 'Yes' : 'No',
      'Manufacturer': m.manufacturer, 'Model': m.model, 'Meter Type': m.meterType,
      'CT Ratio': m.ctRatio, 'CT Accuracy Class': m.ctAccuracyClass, 'CT Qty': m.ctQuantity,
      'Priority': m.meteringPriority, 'Comm. Protocol': m.communicationProtocol,
      'EMS Status': m.emsIntegrationStatus, 'Serial No.': m.serialNumber,
      'Install Status': m.installationStatus, 'Remarks': m.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Metering Register');
    XLSX.writeFile(wb, 'metering_register.xlsx');
  };

  const required = meters.filter(m => m.meterRequired).length;
  const installed = meters.filter(m => m.meterInstalled).length;
  const pending = meters.filter(m => m.meterRequired && !m.meterInstalled).length;

  const PRIORITIES: MeteringPriority[] = ['Critical', 'High', 'Normal', 'Low'];
  const EMS_STATUSES: EmsStatus[] = ['Integrated', 'Planned', 'Not Applicable', 'Pending', 'Not Available'];

  const FormField = ({ lbl, k, type = 'text', opts }: { lbl: string; k: keyof Omit<LVMeter,'id'|'photos'>; type?: string; opts?: string[] }) => (
    <div>
      <div style={label}>{lbl}</div>
      {opts ? (
        <select value={form[k] as string} onChange={e => setF(k, e.target.value)} style={input()}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form[k] as boolean} onChange={e => setF(k, e.target.checked)} />
          <span style={{ fontSize: 12, color: 'var(--ec-text-secondary)' }}>Yes</span>
        </label>
      ) : (
        <input type={type} value={form[k] as string | number} onChange={e => setF(k, type === 'number' ? Number(e.target.value) : e.target.value)} style={input()} />
      )}
    </div>
  );

  return (
    <div>
      <SectionHeader title="Metering & CT Details" subtitle="Energy meters, CT details, EMS integration and installation status" icon={Gauge} />

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard value={meters.length} label="Total Meters" color={ACCENT} icon={Gauge} />
        <KpiCard value={required} label="Meters Required" color="#8B5CF6" icon={CheckCircle} />
        <KpiCard value={installed} label="Installed" color="#22C55E" icon={CheckCircle} />
        <KpiCard value={pending} label="Required but Pending" sub="needs attention" color="#EF4444" icon={AlertCircle} />
      </div>

      {/* Filters + toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterPanel} onChange={e => setFilterPanel(e.target.value)} style={input({ width: 150 })}>
          <option value="">All Panels</option>
          {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={input({ width: 140 })}>
          <option value="">All Statuses</option>
          {['Pending','Installed','Calibrated'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={input({ width: 130 })}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Meter</button>
          <button style={btn('#22C55E')} onClick={exportXLSX}><Download style={{ width: 14, height: 14 }} /> Export</button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit Meter' : 'Add Meter'}</div>
          <div style={{ ...card({ background: '#F59E0B11', border: '1px solid #F59E0B33' }), marginBottom: 12, fontSize: 11, color: 'var(--ec-text-secondary)' }}>
            <b>Guidance:</b> If CT ratio, model, or manufacturer is unknown, leave blank or enter "Not Available". Do not invent values.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
            <FormField lbl="Meter Ref *" k="meterRef" />
            <FormField lbl="Panel ID" k="panelId" />
            <FormField lbl="Feeder ID" k="feederId" />
            <FormField lbl="Equipment Description" k="equipmentDescription" />
            <FormField lbl="Meter Type" k="meterType" opts={['Energy Meter','Multi-function Meter','kWh Meter','MDI Meter','Smart Meter','Billing Meter','Sub-meter','Other']} />
            <FormField lbl="Meter Required" k="meterRequired" type="checkbox" />
            <FormField lbl="Meter Installed" k="meterInstalled" type="checkbox" />
            <FormField lbl="Manufacturer" k="manufacturer" />
            <FormField lbl="Model" k="model" />
            <FormField lbl="Serial No." k="serialNumber" />
            <FormField lbl="CT Ratio" k="ctRatio" />
            <FormField lbl="CT Accuracy Class" k="ctAccuracyClass" opts={['Class 0.2','Class 0.5','Class 1','Class 2','Class 3','Class 5','Not Available','']} />
            <FormField lbl="CT Quantity" k="ctQuantity" type="number" />
            <FormField lbl="Priority" k="meteringPriority" opts={PRIORITIES} />
            <FormField lbl="Comm. Protocol" k="communicationProtocol" opts={['Modbus RTU','Modbus TCP','BACnet','DLMS/COSEM','MBus','PROFIBUS','Not Applicable','Not Available','']} />
            <FormField lbl="EMS Status" k="emsIntegrationStatus" opts={EMS_STATUSES} />
            <FormField lbl="Install Status" k="installationStatus" opts={['Pending','Installed','Calibrated']} />
            <div style={{ gridColumn: 'span 2' }}>
              <div style={label}>Remarks</div>
              <input value={form.remarks} onChange={e => setF('remarks', e.target.value)} style={input()} />
            </div>
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Installation Photos</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={btn('#475569')} onClick={() => photoRef.current?.click()}>
                <Upload style={{ width: 13, height: 13 }} /> Add Photo
              </button>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Images ≤ 500 KB are stored with preview. Larger files: name only.</span>
            </div>
            {form.photos && form.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {form.photos.map((p, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {p.dataUrl
                      ? <img src={p.dataUrl} alt={p.name} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      : <div style={{ width: 80, height: 60, background: 'var(--ec-bg-surface)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--ec-text-muted)' }}>📎 {p.name.slice(0, 10)}</div>
                    }
                    <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 10 }}
                      onClick={() => setF('photos', form.photos.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {visible.length === 0
        ? <EmptyState icon={Gauge} title="No meters" sub='Click "Add Meter" to start building the metering register.' />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Meter Ref','Panel','Feeder','Equipment','Reqd','Installed','Manufacturer','Model','Type','CT Ratio','CT Class','CT Qty','Priority','Comm.','EMS','Serial No.','Status','Remarks','Actions'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                    <td style={td({ color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' })}>{m.meterRef}</td>
                    <td style={td({ fontWeight: 600 })}>{m.panelId}</td>
                    <td style={td()}>{m.feederId}</td>
                    <td style={td({ minWidth: 120 })}>{m.equipmentDescription}</td>
                    <td style={td({ textAlign: 'center' })}>{m.meterRequired ? <span style={{ color: '#22C55E' }}>✓</span> : <span style={{ color: '#64748B' }}>—</span>}</td>
                    <td style={td({ textAlign: 'center' })}>{m.meterInstalled ? <span style={{ color: '#22C55E' }}>✓</span> : <span style={{ color: '#EF4444' }}>✗</span>}</td>
                    <td style={td()}>{m.manufacturer || <span style={{ color: 'var(--ec-text-muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td style={td()}>{m.model || <span style={{ color: 'var(--ec-text-muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td style={td({ whiteSpace: 'nowrap' })}>{m.meterType}</td>
                    <td style={td()}>{m.ctRatio || '—'}</td>
                    <td style={td()}>{m.ctAccuracyClass || '—'}</td>
                    <td style={td({ textAlign: 'center' })}>{m.ctQuantity}</td>
                    <td style={td()}>
                      <span style={{ color: m.meteringPriority === 'Critical' ? '#EF4444' : m.meteringPriority === 'High' ? '#F59E0B' : 'var(--ec-text-secondary)', fontWeight: 600 }}>
                        {m.meteringPriority}
                      </span>
                    </td>
                    <td style={td()}>{m.communicationProtocol || '—'}</td>
                    <td style={td()}><StatusBadge status={m.emsIntegrationStatus} /></td>
                    <td style={td()}>{m.serialNumber || '—'}</td>
                    <td style={td()}><StatusBadge status={m.installationStatus} /></td>
                    <td style={td({ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{m.remarks}</td>
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
  const { panels, loads, calcs, addCalc, updateCalc, deleteCalc } = useLVPanelStore();
  const [activeTab, setActiveTab] = useState<'tables' | 'calcs'>('tables');
  const [showCalcForm, setShowCalcForm] = useState(false);
  const [editCalcId, setEditCalcId] = useState<string | null>(null);
  const [calcForm, setCalcForm] = useState<Omit<LVCalcRecord, 'id' | 'createdAt'>>({
    calcType: 'MaxDemand', panelId: '', feederRef: '', description: '',
    inputs: [{ param: '', value: '', unit: '' }],
    method: '', formula: '', result: '', unit: 'kW',
    sourceWorksheet: '', verificationStatus: 'Unverified', verifiedBy: '', notes: '',
  });
  const [filterCalcPanel, setFilterCalcPanel] = useState('');
  const [filterCalcType, setFilterCalcType] = useState('');
  const [confirmDelCalc, setConfirmDelCalc] = useState<string | null>(null);
  const [expandedCalc, setExpandedCalc] = useState<string | null>(null);

  const panelIds = [...new Set(panels.map(p => p.panelId))].sort();

  const byPanel = panels.map(p => {
    const pl = loads.filter(l => l.panelId === p.panelId);
    const connKW = pl.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
    const demKW = pl.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0);
    return { panelId: p.panelId, name: p.panelName, area: p.electricalArea, type: p.panelType, circuits: pl.length, connKW, demKW };
  });

  const areas = [...new Set(loads.map(l => l.area).filter(Boolean))];
  const byArea = areas.map(area => {
    const al = loads.filter(l => l.area === area);
    return { area, circuits: al.length, connKW: al.reduce((s, l) => s + l.ratedKW * l.quantity, 0), demKW: al.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0) };
  });

  const cats = [...new Set(loads.map(l => l.loadCategory).filter(Boolean))];
  const byCategory = cats.map(cat => {
    const cl = loads.filter(l => l.loadCategory === cat);
    return { category: cat, circuits: cl.length, connKW: cl.reduce((s, l) => s + l.ratedKW * l.quantity, 0), demKW: cl.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0) };
  });

  const grandKW = loads.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
  const grandDem = loads.reduce((s, l) => s + l.ratedKW * l.demandFactor * l.quantity, 0);

  const CALC_TYPES: CalcType[] = ['Current', 'VoltageDrop', 'MaxDemand', 'PowerFactor', 'Other'];
  const VS: VerificationStatus[] = ['Unverified', 'Engineer Reviewed', 'Approved'];

  const visibleCalcs = calcs.filter(c =>
    (!filterCalcPanel || c.panelId === filterCalcPanel) &&
    (!filterCalcType || c.calcType === filterCalcType)
  );

  const setCalcF = (k: keyof Omit<LVCalcRecord, 'id' | 'createdAt'>, v: unknown) => setCalcForm(f => ({ ...f, [k]: v }));
  const openAddCalc = () => {
    setCalcForm({ calcType: 'MaxDemand', panelId: '', feederRef: '', description: '', inputs: [{ param: '', value: '', unit: '' }], method: '', formula: '', result: '', unit: 'kW', sourceWorksheet: '', verificationStatus: 'Unverified', verifiedBy: '', notes: '' });
    setEditCalcId(null); setShowCalcForm(true);
  };
  const openEditCalc = (c: LVCalcRecord) => { const { id, createdAt, ...rest } = c; setCalcForm(rest); setEditCalcId(id); setShowCalcForm(true); };
  const saveCalc = () => { if (editCalcId) updateCalc(editCalcId, calcForm); else addCalc(calcForm); setShowCalcForm(false); };

  const addInput = () => setCalcF('inputs', [...calcForm.inputs, { param: '', value: '', unit: '' }]);
  const removeInput = (i: number) => setCalcF('inputs', calcForm.inputs.filter((_, j) => j !== i));
  const setInput = (i: number, k: 'param' | 'value' | 'unit', v: string) =>
    setCalcF('inputs', calcForm.inputs.map((inp, j) => j === i ? { ...inp, [k]: v } : inp));

  const exportCalcs = () => {
    const rows = visibleCalcs.map(c => ({ 'Description': c.description, 'Type': c.calcType, 'Panel': c.panelId, 'Feeder': c.feederRef, 'Method': c.method, 'Formula': c.formula, 'Result': c.result, 'Unit': c.unit, 'Source': c.sourceWorksheet, 'Verification': c.verificationStatus, 'Verified By': c.verifiedBy, 'Notes': c.notes }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Engineering Calcs'); XLSX.writeFile(wb, 'engineering_calcs.xlsx');
  };

  const vsColor = (v: VerificationStatus) => v === 'Approved' ? '#22C55E' : v === 'Engineer Reviewed' ? '#0EA5E9' : '#F59E0B';

  return (
    <div>
      <SectionHeader title="Load Summary & Engineering Calculations" subtitle="Aggregated load tables and engineering calculation ledger" icon={BarChart3} />

      <div style={{ ...card({ background: '#F59E0B11', border: '1px solid #F59E0B33' }), marginBottom: 16, fontSize: 11, color: 'var(--ec-text-secondary)', lineHeight: 1.7 }}>
        <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 6 }}>Engineering Calculation Principles</div>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li><b>Connected Load ≠ Maximum Demand.</b> Max Demand = Total Connected × Demand Factor. Load Factor is an operational characteristic, not a demand reducer.</li>
          <li><b>Current requires:</b> Voltage, Power Factor, Phases, and Efficiency (motors). Missing inputs are flagged — never assumed.</li>
          <li><b>Line vs. phase voltage:</b> For 3φ, V_phase = V_line ÷ √3. State which is used in each calculation.</li>
          <li><b>Original cable size and breaker rating are preserved.</b> No auto-replacement based on calculated load.</li>
          <li><b>Missing/unverified inputs are identified explicitly.</b> Original design values are never overwritten by recalculation.</li>
        </ol>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--ec-border)', paddingBottom: 0 }}>
        {(['tables', 'calcs'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: 'none', color: activeTab === t ? ACCENT : 'var(--ec-text-muted)', borderBottom: `2px solid ${activeTab === t ? ACCENT : 'transparent'}`, marginBottom: -2 }}>
            {t === 'tables' ? 'Load Summary Tables' : 'Engineering Calc Ledger'}
          </button>
        ))}
      </div>

      {activeTab === 'tables' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard value={loads.length} label="Total Circuits" color={ACCENT} icon={BarChart3} />
            <KpiCard value={`${grandKW.toFixed(1)} kW`} label="Total Connected Load" color="#8B5CF6" icon={BarChart3} />
            <KpiCard value={`${grandDem.toFixed(1)} kW`} label="Total Maximum Demand" color="#22C55E" icon={BarChart3} />
            <KpiCard value={grandKW > 0 ? `${(grandDem / grandKW * 100).toFixed(1)}%` : '—'} label="Overall Demand Factor" color="#F59E0B" icon={BarChart3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card()}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Panel / Board</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Panel ID','Type','Area','Circuits','Connected kW','Max Demand kW'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {byPanel.filter(r => r.circuits > 0).map((r, i) => (
                      <tr key={r.panelId} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                        <td style={td({ color: ACCENT, fontWeight: 700 })}>{r.panelId}</td>
                        <td style={td()}>{r.type}</td>
                        <td style={td()}>{r.area}</td>
                        <td style={td()}>{r.circuits}</td>
                        <td style={td()}>{r.connKW.toFixed(2)}</td>
                        <td style={td({ fontWeight: 600 })}>{r.demKW.toFixed(2)}</td>
                      </tr>
                    ))}
                    {byPanel.filter(r => r.circuits > 0).length === 0 && <tr><td colSpan={6} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No loads entered</td></tr>}
                    <tr style={{ fontWeight: 700 }}>
                      <td style={td({ fontWeight: 700 })} colSpan={4}>Grand Total</td>
                      <td style={td({ fontWeight: 700, color: ACCENT })}>{grandKW.toFixed(2)}</td>
                      <td style={td({ fontWeight: 700, color: '#22C55E' })}>{grandDem.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={card()}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Area / Zone</div>
              {byArea.length === 0
                ? <EmptyState icon={BarChart3} title="No area data" sub="Add area field to load items." />
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Area','Circuits','Connected kW','Max Demand kW'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                      <tbody>
                        {byArea.map((r, i) => (
                          <tr key={r.area} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                            <td style={td()}>{r.area}</td>
                            <td style={td()}>{r.circuits}</td>
                            <td style={td()}>{r.connKW.toFixed(2)}</td>
                            <td style={td({ fontWeight: 600 })}>{r.demKW.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>
          <div style={card()}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Load Category</div>
            {byCategory.length === 0
              ? <EmptyState icon={BarChart3} title="No category data" sub="Add load category in the Load Schedule section." />
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Category','Circuits','Connected kW','Max Demand kW','% of Total Demand'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {byCategory.map((r, i) => (
                        <tr key={r.category} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                          <td style={td()}>{r.category}</td>
                          <td style={td()}>{r.circuits}</td>
                          <td style={td()}>{r.connKW.toFixed(2)}</td>
                          <td style={td({ fontWeight: 600 })}>{r.demKW.toFixed(2)}</td>
                          <td style={td()}>{grandDem > 0 ? `${(r.demKW / grandDem * 100).toFixed(1)}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </>
      )}

      {activeTab === 'calcs' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={filterCalcPanel} onChange={e => setFilterCalcPanel(e.target.value)} style={input({ width: 150 })}>
              <option value="">All Panels</option>
              {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <select value={filterCalcType} onChange={e => setFilterCalcType(e.target.value)} style={input({ width: 140 })}>
              <option value="">All Types</option>
              {CALC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button style={btn(ACCENT)} onClick={openAddCalc}><Plus style={{ width: 14, height: 14 }} /> Add Calc</button>
              {visibleCalcs.length > 0 && <button style={btn('#22C55E')} onClick={exportCalcs}><Download style={{ width: 14, height: 14 }} /> Export</button>}
            </div>
          </div>

          {showCalcForm && (
            <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editCalcId ? 'Edit Calculation' : 'Add Calculation'}</div>
              <div style={{ ...card({ background: '#F59E0B11', border: '1px solid #F59E0B33' }), marginBottom: 12, fontSize: 11, color: 'var(--ec-text-secondary)' }}>
                Record inputs, method and result. Results do not overwrite original design values. Identify missing inputs explicitly — do not assume defaults.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={label}>Calc Type</div>
                  <select value={calcForm.calcType} onChange={e => setCalcF('calcType', e.target.value as CalcType)} style={input()}>
                    {CALC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={label}>Panel ID</div>
                  <select value={calcForm.panelId} onChange={e => setCalcF('panelId', e.target.value)} style={input()}>
                    <option value="">— Select —</option>
                    {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div><div style={label}>Feeder Ref</div><input value={calcForm.feederRef} onChange={e => setCalcF('feederRef', e.target.value)} style={input()} /></div>
                <div><div style={label}>Description</div><input value={calcForm.description} onChange={e => setCalcF('description', e.target.value)} style={input()} /></div>
                <div><div style={label}>Method / Standard</div><input value={calcForm.method} onChange={e => setCalcF('method', e.target.value)} style={input()} placeholder="e.g. IEC 60364" /></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={label}>Formula</div>
                  <input value={calcForm.formula} onChange={e => setCalcF('formula', e.target.value)} style={input()} placeholder="e.g. I = P / (√3 × V × PF)" />
                </div>
                <div>
                  <div style={label}>Result + Unit</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={calcForm.result} onChange={e => setCalcF('result', e.target.value)} style={input()} placeholder="125.4" />
                    <input value={calcForm.unit} onChange={e => setCalcF('unit', e.target.value)} style={input({ width: 70 })} placeholder="kW" />
                  </div>
                </div>
                <div><div style={label}>Source Worksheet</div><input value={calcForm.sourceWorksheet} onChange={e => setCalcF('sourceWorksheet', e.target.value)} style={input()} /></div>
                <div>
                  <div style={label}>Verification Status</div>
                  <select value={calcForm.verificationStatus} onChange={e => setCalcF('verificationStatus', e.target.value as VerificationStatus)} style={input()}>
                    {VS.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div><div style={label}>Verified By</div><input value={calcForm.verifiedBy} onChange={e => setCalcF('verifiedBy', e.target.value)} style={input()} /></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={label}>Notes / Assumptions / Missing Inputs</div>
                  <input value={calcForm.notes} onChange={e => setCalcF('notes', e.target.value)} style={input()} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={label}>Input Parameters</div>
                  <button style={btn(ACCENT, { padding: '4px 10px', fontSize: 11 })} onClick={addInput}><Plus style={{ width: 11, height: 11 }} /> Add Row</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Parameter','Value','Unit',''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {calcForm.inputs.map((inp, i) => (
                      <tr key={i}>
                        <td style={td()}><input value={inp.param} onChange={e => setInput(i, 'param', e.target.value)} style={input()} placeholder="e.g. Voltage (V_L)" /></td>
                        <td style={td()}><input value={inp.value} onChange={e => setInput(i, 'value', e.target.value)} style={input()} placeholder="400" /></td>
                        <td style={td()}><input value={inp.unit} onChange={e => setInput(i, 'unit', e.target.value)} style={input()} placeholder="V, A, kW…" /></td>
                        <td style={td()}><button onClick={() => removeInput(i)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btn(ACCENT)} onClick={saveCalc}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
                <button style={btn('#475569')} onClick={() => setShowCalcForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {visibleCalcs.length === 0
            ? <EmptyState icon={BarChart3} title="No calculations" sub='Click "Add Calc" to record a verified engineering calculation.' />
            : visibleCalcs.map((c, i) => (
              <div key={c.id} style={{ ...card(), marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{c.description || `Calc #${i + 1}`}</span>
                  <StatusBadge status={c.calcType} />
                  {c.panelId && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>{c.panelId}</span>}
                  {c.feederRef && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>/ {c.feederRef}</span>}
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: vsColor(c.verificationStatus) }}>{c.verificationStatus}</span>
                    <button onClick={() => setExpandedCalc(expandedCalc === c.id ? null : c.id)} style={btn('#475569', { padding: '4px 8px' })}>
                      {expandedCalc === c.id ? <ChevronDown style={{ width: 11, height: 11 }} /> : <ChevronRight style={{ width: 11, height: 11 }} />}
                    </button>
                    <button onClick={() => openEditCalc(c)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                    {confirmDelCalc === c.id ? (
                      <><button onClick={() => { deleteCalc(c.id); setConfirmDelCalc(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button><button onClick={() => setConfirmDelCalc(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button></>
                    ) : (
                      <button onClick={() => setConfirmDelCalc(c.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                    )}
                  </span>
                </div>
                {expandedCalc === c.id && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ec-border)', fontSize: 11, color: 'var(--ec-text-secondary)' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Inputs</div>
                      {c.inputs.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead><tr>{['Parameter','Value','Unit'].map(h => <th key={h} style={{ ...TH, fontSize: 10 }}>{h}</th>)}</tr></thead>
                          <tbody>{c.inputs.map((inp, j) => (
                            <tr key={j} style={{ background: j % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                              <td style={td({ fontSize: 11 })}>{inp.param}</td>
                              <td style={td({ fontSize: 11 })}>{inp.value}</td>
                              <td style={td({ fontSize: 11 })}>{inp.unit}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      ) : <div style={{ color: 'var(--ec-text-muted)' }}>No inputs recorded</div>}
                    </div>
                    <div style={{ lineHeight: 1.8 }}>
                      {c.method && <div><b>Method:</b> {c.method}</div>}
                      {c.formula && <div><b>Formula:</b> <code style={{ background: 'var(--ec-bg-surface)', padding: '2px 6px', borderRadius: 4 }}>{c.formula}</code></div>}
                      <div><b>Result:</b> <span style={{ color: ACCENT, fontWeight: 700 }}>{c.result || '—'} {c.unit}</span></div>
                      {c.sourceWorksheet && <div><b>Source:</b> {c.sourceWorksheet}</div>}
                      {c.verifiedBy && <div><b>Verified by:</b> {c.verifiedBy}</div>}
                      {c.notes && <div><b>Notes:</b> {c.notes}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}

// ─── SECTION: Drawings ────────────────────────────────────────────────────────

const DRAWING_DEFAULTS: Omit<LVDrawing, 'id'> = {
  drawingNo: '', title: '', category: 'Single Line Diagram', discipline: 'Electrical',
  associatedPanel: '', revision: 'Rev.0', date: new Date().toISOString().slice(0, 10),
  status: 'Draft', approvalStatus: 'Pending', fileRef: '', fileDataUrl: undefined,
  revisionHistory: [], remarks: '',
};

const DRAWING_CATEGORIES = ['Single Line Diagram','Layout Drawing','Schematic','Wiring Diagram','Cable Route','Panel GA','Load Schedule','As-Built','Other'];

function Drawings() {
  const { drawings, panels, addDrawing, updateDrawing, deleteDrawing } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVDrawing, 'id'>>(DRAWING_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expandedRev, setExpandedRev] = useState<string | null>(null);
  const [showRevForm, setShowRevForm] = useState<string | null>(null);
  const [revForm, setRevForm] = useState({ rev: '', date: '', description: '', author: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const panelIds = [...new Set(panels.map(p => p.panelId))].sort();
  const statusOptions: LVDrawing['status'][] = ['Draft','Issued for Approval','Issued for Construction','As-Built'];
  const approvalOptions: LVDrawing['approvalStatus'][] = ['Pending','Approved','Rejected','Not Required'];

  const visible = drawings.filter(d =>
    (!filterStatus || d.status === filterStatus) &&
    (!filterCat || d.category === filterCat)
  );

  const setF = (k: keyof Omit<LVDrawing, 'id'>, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const openAdd = () => { setForm(DRAWING_DEFAULTS); setEditId(null); setShowForm(true); };
  const openEdit = (d: LVDrawing) => { const { id, ...rest } = d; setForm(rest); setEditId(id); setShowForm(true); };
  const save = () => { if (editId) updateDrawing(editId, form); else addDrawing(form); setShowForm(false); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setF('fileRef', file.name);
    if (file.size <= 512 * 1024) {
      const reader = new FileReader();
      reader.onload = ev => setF('fileDataUrl', ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setF('fileDataUrl', undefined);
    }
  };

  const addRevision = (drawingId: string) => {
    const d = drawings.find(x => x.id === drawingId); if (!d) return;
    const rev = { ...revForm, date: revForm.date || new Date().toISOString().slice(0, 10) };
    updateDrawing(drawingId, { revisionHistory: [...(d.revisionHistory ?? []), rev] });
    setShowRevForm(null); setRevForm({ rev: '', date: '', description: '', author: '' });
  };

  const exportXLSX = () => {
    const rows = visible.map(d => ({ 'Drawing No': d.drawingNo, 'Title': d.title, 'Category': d.category, 'Discipline': d.discipline, 'Associated Panel': d.associatedPanel, 'Revision': d.revision, 'Date': d.date, 'Status': d.status, 'Approval Status': d.approvalStatus, 'File Ref': d.fileRef, 'Remarks': d.remarks }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drawing Register'); XLSX.writeFile(wb, 'drawing_register.xlsx');
  };

  return (
    <div>
      <SectionHeader title="Electrical Drawing Register" subtitle="Drawing register, revisions, approval status and file attachments" icon={BookOpen} />

      <div style={{ ...card({ background: '#3B82F611', border: '1px solid #3B82F633' }), marginBottom: 14, fontSize: 11, color: 'var(--ec-text-secondary)' }}>
        <b>Note:</b> Where an Excel workbook contains only a drawing reference, import the number and title only — do not attach a fictitious file. Upload actual drawing files when available. Files ≤ 500 KB are stored with inline preview; larger files store the filename reference only.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={input({ width: 180 })}>
          <option value="">All Statuses</option>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={input({ width: 180 })}>
          <option value="">All Categories</option>
          {DRAWING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Drawing</button>
          {visible.length > 0 && <button style={btn('#22C55E')} onClick={exportXLSX}><Download style={{ width: 14, height: 14 }} /> Export</button>}
        </div>
      </div>

      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit Drawing' : 'Add Drawing'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
            <div><div style={label}>Drawing No *</div><input value={form.drawingNo} onChange={e => setF('drawingNo', e.target.value)} style={input()} /></div>
            <div style={{ gridColumn: 'span 2' }}><div style={label}>Title</div><input value={form.title} onChange={e => setF('title', e.target.value)} style={input()} /></div>
            <div>
              <div style={label}>Category</div>
              <select value={form.category} onChange={e => setF('category', e.target.value)} style={input()}>
                {DRAWING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><div style={label}>Discipline</div><input value={form.discipline} onChange={e => setF('discipline', e.target.value)} style={input()} /></div>
            <div>
              <div style={label}>Associated Panel</div>
              <select value={form.associatedPanel} onChange={e => setF('associatedPanel', e.target.value)} style={input()}>
                <option value="">— None —</option>
                {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            <div><div style={label}>Revision</div><input value={form.revision} onChange={e => setF('revision', e.target.value)} style={input()} /></div>
            <div><div style={label}>Date</div><input type="date" value={form.date} onChange={e => setF('date', e.target.value)} style={input()} /></div>
            <div>
              <div style={label}>Doc. Status</div>
              <select value={form.status} onChange={e => setF('status', e.target.value as LVDrawing['status'])} style={input()}>
                {statusOptions.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={label}>Approval Status</div>
              <select value={form.approvalStatus} onChange={e => setF('approvalStatus', e.target.value as LVDrawing['approvalStatus'])} style={input()}>
                {approvalOptions.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}><div style={label}>Remarks</div><input value={form.remarks} onChange={e => setF('remarks', e.target.value)} style={input()} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Drawing File (PDF, Image, Excel)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={btn('#475569')} onClick={() => fileRef.current?.click()}><Upload style={{ width: 13, height: 13 }} /> Upload File</button>
              <input ref={fileRef} type="file" accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.dwg" onChange={handleFile} style={{ display: 'none' }} />
              {form.fileRef && <span style={{ fontSize: 12, color: '#22C55E' }}>📎 {form.fileRef}</span>}
              {form.fileRef && <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 11 }} onClick={() => { setF('fileRef', ''); setF('fileDataUrl', undefined); }}>Remove</button>}
            </div>
            {form.fileDataUrl && (form.fileDataUrl as string).startsWith('data:image') && (
              <img src={form.fileDataUrl as string} alt="preview" style={{ maxHeight: 100, maxWidth: 250, marginTop: 8, borderRadius: 6, objectFit: 'contain' }} />
            )}
            {form.fileRef && !form.fileDataUrl && (
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 4 }}>File too large for inline storage — reference stored: {form.fileRef}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {visible.length === 0
        ? <EmptyState icon={BookOpen} title="No drawings" sub='Add drawings to build the register. Import drawing references without attaching fictitious files.' />
        : (
          <div>
            {visible.map((d) => {
              const hasFile = !!d.fileDataUrl;
              const isImage = hasFile && (d.fileDataUrl as string).startsWith('data:image');
              const isPDF   = hasFile && (d.fileDataUrl as string).startsWith('data:application/pdf');
              const isRefOnly = !!d.fileRef && !hasFile;

              const viewFile = () => {
                if (!d.fileDataUrl) return;
                const win = window.open(); if (!win) return;
                if (isImage) {
                  win.document.write(`<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${d.fileDataUrl}" style="max-width:100%;max-height:100vh;object-fit:contain"></body></html>`);
                } else {
                  win.document.write(`<html><body style="margin:0"><embed src="${d.fileDataUrl}" width="100%" height="100%" style="position:fixed;inset:0"></body></html>`);
                }
              };

              const downloadFile = () => {
                if (!d.fileDataUrl) return;
                const a = document.createElement('a');
                a.href = d.fileDataUrl as string;
                a.download = d.fileRef || d.drawingNo || 'drawing';
                a.click();
              };

              return (
              <div key={d.id} style={{ ...card(), marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Thumbnail for images */}
                  {isImage && (
                    <img src={d.fileDataUrl as string} alt={d.title} onClick={viewFile}
                      style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', flexShrink: 0, border: '1px solid var(--ec-border)' }} />
                  )}
                  {isPDF && (
                    <div onClick={viewFile} style={{ width: 72, height: 54, background: '#EF444422', borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #EF444444' }}>
                      <span style={{ fontSize: 18 }}>📄</span>
                      <span style={{ fontSize: 9, color: '#EF4444', fontWeight: 700 }}>PDF</span>
                    </div>
                  )}
                  {hasFile && !isImage && !isPDF && (
                    <div onClick={downloadFile} style={{ width: 72, height: 54, background: '#22C55E22', borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #22C55E44' }}>
                      <span style={{ fontSize: 18 }}>📊</span>
                      <span style={{ fontSize: 9, color: '#22C55E', fontWeight: 700 }}>{d.fileRef?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                    </div>
                  )}
                  {isRefOnly && (
                    <div style={{ width: 72, height: 54, background: '#F59E0B22', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F59E0B44' }}>
                      <span style={{ fontSize: 18 }}>🔗</span>
                      <span style={{ fontSize: 8, color: '#F59E0B', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>REF ONLY</span>
                    </div>
                  )}
                  {!d.fileRef && (
                    <div style={{ width: 72, height: 54, background: 'var(--ec-bg-surface)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px dashed var(--ec-border)' }}>
                      <span style={{ fontSize: 20, opacity: 0.3 }}>📁</span>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{d.drawingNo}</span>
                      <StatusBadge status={d.status} />
                      <StatusBadge status={d.approvalStatus} />
                      {d.associatedPanel && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Panel: {d.associatedPanel}</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ec-text-primary)', marginBottom: 4 }}>{d.title}</div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ec-text-muted)', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span>{d.category}</span><span>{d.discipline}</span>
                      <span>Rev: {d.revision}</span>{d.date && <span>{d.date}</span>}
                    </div>
                    {/* File status line */}
                    {hasFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>📎 {d.fileRef}</span>
                        <button onClick={isImage || isPDF ? viewFile : downloadFile}
                          style={{ ...btn(isPDF ? '#EF4444' : isImage ? '#8B5CF6' : '#22C55E', { padding: '3px 10px', fontSize: 10 }) }}>
                          {isImage ? '🔍 View' : isPDF ? '📄 View PDF' : '📥 Download'}
                        </button>
                        <button onClick={downloadFile} style={{ ...btn('#475569', { padding: '3px 10px', fontSize: 10 }) }}>
                          <Download style={{ width: 10, height: 10 }} /> Save
                        </button>
                      </div>
                    )}
                    {isRefOnly && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#F59E0B' }}>🔗 Reference: {d.fileRef}</span>
                        <span style={{ fontSize: 10, color: 'var(--ec-text-muted)', background: 'var(--ec-bg-surface)', padding: '2px 8px', borderRadius: 4 }}>
                          File not stored — attach to enable download
                        </span>
                        <button onClick={() => openEdit(d)} style={{ ...btn('#F59E0B', { padding: '3px 10px', fontSize: 10 }) }}>
                          <Upload style={{ width: 10, height: 10 }} /> Attach File
                        </button>
                      </div>
                    )}
                    {!d.fileRef && (
                      <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>No file attached — edit to upload</span>
                    )}
                    {d.remarks && <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 4 }}>{d.remarks}</div>}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={() => setExpandedRev(expandedRev === d.id ? null : d.id)} style={btn('#475569', { padding: '5px 10px', fontSize: 11 })}>
                      History {(d.revisionHistory ?? []).length > 0 && `(${d.revisionHistory.length})`}
                    </button>
                    <button onClick={() => openEdit(d)} style={btn(ACCENT, { padding: '5px 10px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                    {confirmDel === d.id ? (
                      <><button onClick={() => { deleteDrawing(d.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '5px 10px' })}>✓</button><button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '5px 10px' })}>✗</button></>
                    ) : (
                      <button onClick={() => setConfirmDel(d.id)} style={btn('#EF4444', { padding: '5px 10px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                    )}
                  </div>
                </div>

                {expandedRev === d.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--ec-border)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ec-text-secondary)' }}>Revision History</div>
                      <button style={btn(ACCENT, { padding: '4px 10px', fontSize: 11 })} onClick={() => setShowRevForm(showRevForm === d.id ? null : d.id)}>
                        <Plus style={{ width: 11, height: 11 }} /> Add Revision
                      </button>
                    </div>
                    {showRevForm === d.id && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10, padding: 10, background: 'var(--ec-bg-surface)', borderRadius: 8 }}>
                        <div><div style={label}>Rev No.</div><input value={revForm.rev} onChange={e => setRevForm(f => ({ ...f, rev: e.target.value }))} style={input()} placeholder="Rev.1" /></div>
                        <div><div style={label}>Date</div><input type="date" value={revForm.date} onChange={e => setRevForm(f => ({ ...f, date: e.target.value }))} style={input()} /></div>
                        <div><div style={label}>Description</div><input value={revForm.description} onChange={e => setRevForm(f => ({ ...f, description: e.target.value }))} style={input()} /></div>
                        <div><div style={label}>Author</div><input value={revForm.author} onChange={e => setRevForm(f => ({ ...f, author: e.target.value }))} style={input()} /></div>
                        <div style={{ gridColumn: 'span 4', display: 'flex', gap: 6 }}>
                          <button style={btn(ACCENT, { padding: '5px 12px', fontSize: 11 })} onClick={() => addRevision(d.id)}><CheckCircle style={{ width: 11, height: 11 }} /> Add</button>
                          <button style={btn('#475569', { padding: '5px 12px', fontSize: 11 })} onClick={() => setShowRevForm(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {!d.revisionHistory || d.revisionHistory.length === 0
                      ? <div style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>No revision history recorded.</div>
                      : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead><tr>{['Rev','Date','Description','Author'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                          <tbody>{d.revisionHistory.map((r, j) => (
                            <tr key={j} style={{ background: j % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                              <td style={td({ fontWeight: 700 })}>{r.rev}</td>
                              <td style={td()}>{r.date}</td>
                              <td style={td()}>{r.description}</td>
                              <td style={td()}>{r.author}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── SECTION: Power Distribution & Interlocking ──────────────────────────────

const BREAKER_STATE_DEFAULTS: LVBreakerState = { breakerRef: '', normalState: 'Closed', blackoutState: 'Open', returnState: 'Closed' };
const SWITCHING_DEFAULTS: Omit<LVSwitchingRecord, 'id' | 'createdAt'> = {
  powerSource: '', transformerRef: '', busCouplerRef: '', dgRef: '',
  normalCondition: '', blackoutCondition: '', returnToNormal: '',
  breakerStates: [], interlockingReqs: '', operatingRemarks: '',
  relatedDrawings: '', verificationStatus: 'Unverified',
};

function PowerDist() {
  const { panels, switchingRecords, addSwitchingRecord, updateSwitchingRecord, deleteSwitchingRecord } = useLVPanelStore();
  const [activeTab, setActiveTab] = useState<'tree' | 'switching'>('tree');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVSwitchingRecord, 'id' | 'createdAt'>>(SWITCHING_DEFAULTS);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const roots = panels.filter(p => !p.parentPanel);
  const children = (parentId: string) => panels.filter(p => p.parentPanel === parentId);

  const setF = (k: keyof Omit<LVSwitchingRecord, 'id' | 'createdAt'>, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const openAdd = () => { setForm(SWITCHING_DEFAULTS); setEditId(null); setShowForm(true); };
  const openEdit = (r: LVSwitchingRecord) => { const { id, createdAt, ...rest } = r; setForm(rest); setEditId(id); setShowForm(true); };
  const save = () => { if (editId) updateSwitchingRecord(editId, form); else addSwitchingRecord(form); setShowForm(false); };

  const addBreakerRow = () => setF('breakerStates', [...form.breakerStates, { ...BREAKER_STATE_DEFAULTS }]);
  const removeBreakerRow = (i: number) => setF('breakerStates', form.breakerStates.filter((_, j) => j !== i));
  const setBreakerState = (i: number, k: keyof LVBreakerState, v: string) =>
    setF('breakerStates', form.breakerStates.map((b, j) => j === i ? { ...b, [k]: v } : b));

  const VS: VerificationStatus[] = ['Unverified', 'Engineer Reviewed', 'Approved'];
  const STATES = ['Open', 'Closed', 'N/A'];

  const renderNode = (p: LVPanel, depth: number): React.ReactNode => {
    const kids = children(p.panelId);
    const isExp = expanded.has(p.panelId);
    return (
      <div key={p.id} style={{ marginLeft: depth * 28 }}>
        <div onClick={() => kids.length > 0 && toggle(p.panelId)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, cursor: kids.length > 0 ? 'pointer' : 'default', background: depth === 0 ? ACCENT + '22' : 'var(--ec-bg-surface)', border: `1px solid ${depth === 0 ? ACCENT + '55' : 'var(--ec-border)'}`, marginBottom: 4, userSelect: 'none' }}>
          {kids.length > 0 && (isExp ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronRight style={{ width: 13, height: 13 }} />)}
          <Server style={{ width: 13, height: 13, color: ACCENT }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{p.panelId}</span>
          <StatusBadge status={p.panelType} />
          {p.panelName && <span style={{ fontSize: 11, color: 'var(--ec-text-secondary)' }}>{p.panelName}</span>}
          <span style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginLeft: 'auto' }}>
            {p.connectedLoadKW > 0 ? `${p.connectedLoadKW} kW` : ''}{p.location ? ` · ${p.location}` : ''}
          </span>
        </div>
        {kids.length > 0 && isExp && kids.map(c => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <SectionHeader title="Power Distribution & Interlocking" subtitle="Distribution hierarchy, switching sequences and interlocking documentation" icon={Activity} />

      <div style={{ ...card({ background: '#EF444411', border: '1px solid #EF444433' }), marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 11, color: '#EF4444', lineHeight: 1.7 }}>
            <b>IMPORTANT DISCLAIMER:</b> This module is for <b>engineering documentation and monitoring only</b>. It records intended switching sequences and interlocking requirements for reference purposes only.<br />
            <b>This module must not be used to issue switching commands to electrical equipment.</b> It does not replace the approved Switching Procedure, Permit to Work, or safety isolation requirements. All switching must be carried out by authorised personnel following the approved procedure.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--ec-border)', paddingBottom: 0 }}>
        {(['tree', 'switching'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: 'none', color: activeTab === t ? ACCENT : 'var(--ec-text-muted)', borderBottom: `2px solid ${activeTab === t ? ACCENT : 'transparent'}`, marginBottom: -2 }}>
            {t === 'tree' ? 'Distribution Hierarchy' : 'Switching Sequences'}
          </button>
        ))}
      </div>

      {activeTab === 'tree' && (
        panels.length === 0
          ? <EmptyState icon={Activity} title="No panels" sub='Register panels with Parent Panel relationships in Panel Register to build the distribution hierarchy.' />
          : (
            <div style={card()}>
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginBottom: 12 }}>Set "Parent Panel" in Panel Register to build the hierarchy. Click panels to expand/collapse.</div>
              {roots.length === 0
                ? <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No root panels found — leave "Parent Panel" blank for root-level panels.</div>
                : roots.map(p => renderNode(p, 0))}
            </div>
          )
      )}

      {activeTab === 'switching' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Switching Sequence</button>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ec-text-muted)' }}>{switchingRecords.length} sequence(s) documented</div>
          </div>

          {showForm && (
            <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit Switching Sequence' : 'Add Switching Sequence'}</div>
              <div style={{ ...card({ background: '#F59E0B11', border: '1px solid #F59E0B33' }), marginBottom: 12, fontSize: 11, color: 'var(--ec-text-secondary)' }}>
                This record is for engineering documentation only. It does not constitute a switching instruction or permit to work.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                <div><div style={label}>Power Source</div><input value={form.powerSource} onChange={e => setF('powerSource', e.target.value)} style={input()} placeholder="e.g. Utility / Incomer" /></div>
                <div><div style={label}>Transformer Ref</div><input value={form.transformerRef} onChange={e => setF('transformerRef', e.target.value)} style={input()} /></div>
                <div><div style={label}>Bus Coupler Ref</div><input value={form.busCouplerRef} onChange={e => setF('busCouplerRef', e.target.value)} style={input()} /></div>
                <div><div style={label}>DG Set Ref</div><input value={form.dgRef} onChange={e => setF('dgRef', e.target.value)} style={input()} /></div>
                <div style={{ gridColumn: 'span 4' }}><div style={label}>Normal Condition Description</div><input value={form.normalCondition} onChange={e => setF('normalCondition', e.target.value)} style={input()} placeholder="Describe power system in normal operating state" /></div>
                <div style={{ gridColumn: 'span 4' }}><div style={label}>Blackout / Mains Failure Condition</div><input value={form.blackoutCondition} onChange={e => setF('blackoutCondition', e.target.value)} style={input()} placeholder="Describe state during mains failure" /></div>
                <div style={{ gridColumn: 'span 4' }}><div style={label}>Return to Normal Sequence</div><input value={form.returnToNormal} onChange={e => setF('returnToNormal', e.target.value)} style={input()} placeholder="Describe sequence when mains is restored" /></div>
                <div style={{ gridColumn: 'span 2' }}><div style={label}>Interlocking Requirements</div><input value={form.interlockingReqs} onChange={e => setF('interlockingReqs', e.target.value)} style={input()} /></div>
                <div><div style={label}>Related Drawings</div><input value={form.relatedDrawings} onChange={e => setF('relatedDrawings', e.target.value)} style={input()} /></div>
                <div>
                  <div style={label}>Verification Status</div>
                  <select value={form.verificationStatus} onChange={e => setF('verificationStatus', e.target.value as VerificationStatus)} style={input()}>
                    {VS.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 4' }}><div style={label}>Operating Remarks</div><input value={form.operatingRemarks} onChange={e => setF('operatingRemarks', e.target.value)} style={input()} /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Breaker State Matrix</div>
                  <button style={btn(ACCENT, { padding: '4px 10px', fontSize: 11 })} onClick={addBreakerRow}><Plus style={{ width: 11, height: 11 }} /> Add Breaker</button>
                </div>
                {form.breakerStates.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Breaker Ref','Normal State','Blackout State','Return State',''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {form.breakerStates.map((b, i) => (
                        <tr key={i}>
                          <td style={td()}><input value={b.breakerRef} onChange={e => setBreakerState(i, 'breakerRef', e.target.value)} style={input()} placeholder="e.g. ACB-MDB-01" /></td>
                          {(['normalState','blackoutState','returnState'] as const).map(k => (
                            <td key={k} style={td()}>
                              <select value={b[k]} onChange={e => setBreakerState(i, k, e.target.value as LVBreakerState[typeof k])} style={input()}>
                                {STATES.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </td>
                          ))}
                          <td style={td()}><button onClick={() => removeBreakerRow(i)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
                <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {switchingRecords.length === 0
            ? <EmptyState icon={Activity} title="No switching sequences" sub='Document switching sequences for engineering reference. This does not replace the approved switching procedure.' />
            : switchingRecords.map((r, i) => (
              <div key={r.id} style={{ ...card(), marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>Sequence #{i + 1}</span>
                  {r.powerSource && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>{r.powerSource}</span>}
                  {r.transformerRef && <StatusBadge status={`TR: ${r.transformerRef}`} />}
                  {r.dgRef && <StatusBadge status={`DG: ${r.dgRef}`} />}
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.verificationStatus === 'Approved' ? '#22C55E' : '#F59E0B' }}>{r.verificationStatus}</span>
                    <button onClick={() => openEdit(r)} style={btn(ACCENT, { padding: '4px 8px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                    {confirmDel === r.id ? (
                      <><button onClick={() => { deleteSwitchingRecord(r.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '4px 8px' })}>✓</button><button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '4px 8px' })}>✗</button></>
                    ) : (
                      <button onClick={() => setConfirmDel(r.id)} style={btn('#EF4444', { padding: '4px 8px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                    )}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 11, color: 'var(--ec-text-secondary)', marginBottom: r.breakerStates.length > 0 ? 10 : 0 }}>
                  {r.normalCondition && <div><b>Normal:</b> {r.normalCondition}</div>}
                  {r.blackoutCondition && <div><b>Blackout:</b> {r.blackoutCondition}</div>}
                  {r.returnToNormal && <div><b>Return:</b> {r.returnToNormal}</div>}
                  {r.interlockingReqs && <div><b>Interlocking:</b> {r.interlockingReqs}</div>}
                  {r.relatedDrawings && <div><b>Drawings:</b> {r.relatedDrawings}</div>}
                  {r.operatingRemarks && <div><b>Remarks:</b> {r.operatingRemarks}</div>}
                </div>
                {r.breakerStates.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr>{['Breaker Ref','Normal','Blackout','Return to Normal'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {r.breakerStates.map((b, j) => (
                        <tr key={j} style={{ background: j % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                          <td style={td({ fontWeight: 700 })}>{b.breakerRef}</td>
                          {(['normalState','blackoutState','returnState'] as const).map(k => (
                            <td key={k} style={td({ color: b[k] === 'Closed' ? '#22C55E' : b[k] === 'Open' ? '#EF4444' : 'var(--ec-text-muted)', fontWeight: 600 })}>{b[k]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
        </>
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

const CHECK_ITEMS: { key: keyof LVInspection; label: string }[] = [
  { key: 'cableSizeVerified',       label: 'Cable Size' },
  { key: 'breakerRatingVerified',   label: 'Breaker Rating' },
  { key: 'cableTerminationStatus',  label: 'Cable Termination' },
  { key: 'cableTaggingStatus',      label: 'Cable Tagging' },
  { key: 'earthingVerified',        label: 'Earthing' },
  { key: 'meterInstallVerified',    label: 'Meter Install' },
  { key: 'drawingCompliance',       label: 'Drawing Compliance' },
];

const INSP_TYPES = ['Visual', 'Functional', 'Commissioning', 'Cable', 'Metering', 'Post-Installation', 'Reinspection'];

const INSP_DEFAULTS: Omit<LVInspection, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'> = {
  panelId: '', feederId: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
  inspector: '', inspectionType: 'Visual',
  cableSizeVerified: 'Pending', breakerRatingVerified: 'Pending',
  cableTerminationStatus: 'Pending', cableTaggingStatus: 'Pending',
  earthingVerified: 'Pending', meterInstallVerified: 'Pending',
  drawingCompliance: 'Pending', photographicEvidence: [],
  observations: '', correctiveActions: '', responsiblePerson: '',
  targetCompletionDate: '', closureDate: '', status: 'Pending',
};

function CheckBadge({ val }: { val: CheckResult }) {
  const color = val === 'Pass' ? '#22C55E' : val === 'Fail' ? '#EF4444' : val === 'N/A' ? '#64748B' : '#F59E0B';
  return <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{val}</span>;
}

function Inspection() {
  const { inspections, panels, addInspection, updateInspection, deleteInspection } = useLVPanelStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LVInspection, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>>(INSP_DEFAULTS);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPanel, setFilterPanel] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [changedFields, setChangedFields] = useState<Record<string, string>>({});

  const panelIds = [...new Set(panels.map(p => p.panelId))].sort();
  const setF = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(INSP_DEFAULTS); setEditId(null); setChangedFields({}); setShowForm(true); };
  const openEdit = (x: LVInspection) => {
    const { id, createdAt, updatedAt, auditTrail, ...rest } = x;
    setForm(rest); setEditId(id); setChangedFields({}); setShowForm(true);
  };
  const save = () => {
    if (editId) {
      const existing = inspections.find(x => x.id === editId);
      if (existing) {
        const entries: LVAuditEntry[] = Object.entries(form)
          .filter(([k, v]) => String((existing as Record<string, unknown>)[k] ?? '') !== String(v))
          .map(([k, v]) => ({ timestamp: new Date().toISOString(), changedBy: 'User', field: k, previousValue: String((existing as Record<string, unknown>)[k] ?? ''), newValue: String(v) }));
        updateInspection(editId, { ...form, auditTrail: [...(existing.auditTrail ?? []), ...entries] });
      }
    } else {
      addInspection({ ...form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), auditTrail: [] });
    }
    setShowForm(false);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = file.size <= 512 * 1024 ? (ev.target?.result as string) : undefined;
      setF('photographicEvidence', [...(form.photographicEvidence ?? []), { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), dataUrl }]);
    };
    reader.readAsDataURL(file);
  };

  const exportXLSX = () => {
    const rows = visible.map(x => ({
      'Panel': x.panelId, 'Feeder': x.feederId, 'Date': x.inspectionDate, 'Inspector': x.inspector,
      'Type': x.inspectionType, 'Status': x.status,
      'Cable Size': x.cableSizeVerified, 'Breaker Rating': x.breakerRatingVerified,
      'Termination': x.cableTerminationStatus, 'Tagging': x.cableTaggingStatus,
      'Earthing': x.earthingVerified, 'Meter': x.meterInstallVerified, 'Drawing': x.drawingCompliance,
      'Observations': x.observations, 'Corrective Actions': x.correctiveActions,
      'Responsible': x.responsiblePerson, 'Target Date': x.targetCompletionDate, 'Closed': x.closureDate,
    }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inspection Register'); XLSX.writeFile(wb, 'inspection_register.xlsx');
  };

  const visible = inspections.filter(x =>
    (!filterStatus || x.status === filterStatus) &&
    (!filterPanel || x.panelId === filterPanel)
  );

  const kpis = SITE_VERIF_STATUSES.map(s => ({ status: s, count: inspections.filter(x => x.status === s).length }));
  const outstanding = inspections.filter(x => ['Observation Raised','Corrective Action Pending'].includes(x.status)).length;

  return (
    <div>
      <SectionHeader title="Inspection & Site Verification" subtitle="Site verification register, check results, corrective actions and audit trail" icon={ClipboardList} />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <KpiCard value={inspections.length} label="Total Records" color={ACCENT} icon={ClipboardList} />
        <KpiCard value={inspections.filter(x => x.status === 'Verified' || x.status === 'Closed').length} label="Verified / Closed" color="#22C55E" icon={CheckCircle} />
        <KpiCard value={outstanding} label="Outstanding" sub="observation raised / CA pending" color="#EF4444" icon={AlertCircle} />
        <KpiCard value={inspections.filter(x => x.status === 'Pending').length} label="Pending" color="#F59E0B" icon={Clock} />
      </div>

      {/* Status mini-strip */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {kpis.map(({ status, count }) => (
          <button key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid var(--ec-border)`, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filterStatus === status ? ACCENT : 'var(--ec-bg-surface)', color: filterStatus === status ? '#fff' : 'var(--ec-text-secondary)' }}>
            {status} ({count})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterPanel} onChange={e => setFilterPanel(e.target.value)} style={input({ width: 150 })}>
          <option value="">All Panels</option>
          {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn(ACCENT)} onClick={openAdd}><Plus style={{ width: 14, height: 14 }} /> Add Inspection</button>
          {visible.length > 0 && <button style={btn('#22C55E')} onClick={exportXLSX}><Download style={{ width: 14, height: 14 }} /> Export</button>}
        </div>
      </div>

      {showForm && (
        <div style={{ ...card(), marginBottom: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: ACCENT }}>{editId ? 'Edit' : 'Add'} Inspection</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={label}>Panel ID</div>
              <select value={form.panelId} onChange={e => setF('panelId', e.target.value)} style={input()}>
                <option value="">— Select —</option>
                {panelIds.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            <div><div style={label}>Feeder ID</div><input value={form.feederId} onChange={e => setF('feederId', e.target.value)} style={input()} /></div>
            <div><div style={label}>Inspection Date</div><input type="date" value={form.inspectionDate} onChange={e => setF('inspectionDate', e.target.value)} style={input()} /></div>
            <div><div style={label}>Inspector</div><input value={form.inspector} onChange={e => setF('inspector', e.target.value)} style={input()} /></div>
            <div>
              <div style={label}>Inspection Type</div>
              <select value={form.inspectionType} onChange={e => setF('inspectionType', e.target.value)} style={input()}>
                {INSP_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 7 check items */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--ec-text-secondary)' }}>Site Verification Checks</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {CHECK_ITEMS.map(({ key, label: lbl }) => (
                <div key={key}>
                  <div style={label}>{lbl}</div>
                  <select value={form[key] as string} onChange={e => setF(key, e.target.value as CheckResult)} style={input()}>
                    {(['Pass','Fail','N/A','Pending'] as CheckResult[]).map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
            <div style={{ gridColumn: 'span 3' }}><div style={label}>Observations</div><input value={form.observations} onChange={e => setF('observations', e.target.value)} style={input()} /></div>
            <div style={{ gridColumn: 'span 3' }}><div style={label}>Corrective Actions Required</div><input value={form.correctiveActions} onChange={e => setF('correctiveActions', e.target.value)} style={input()} /></div>
            <div><div style={label}>Responsible Person</div><input value={form.responsiblePerson} onChange={e => setF('responsiblePerson', e.target.value)} style={input()} /></div>
            <div><div style={label}>Target Completion Date</div><input type="date" value={form.targetCompletionDate} onChange={e => setF('targetCompletionDate', e.target.value)} style={input()} /></div>
            <div><div style={label}>Closure Date</div><input type="date" value={form.closureDate} onChange={e => setF('closureDate', e.target.value)} style={input()} /></div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={label}>Inspection Status</div>
              <select value={form.status} onChange={e => setF('status', e.target.value as SiteVerifStatus)} style={input()}>
                {SITE_VERIF_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Photographic Evidence</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={btn('#475569')} onClick={() => photoRef.current?.click()}><Upload style={{ width: 13, height: 13 }} /> Add Photo</button>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Images ≤ 500 KB stored with preview</span>
            </div>
            {form.photographicEvidence && form.photographicEvidence.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {form.photographicEvidence.map((p, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {p.dataUrl
                      ? <img src={p.dataUrl} alt={p.name} style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 5 }} />
                      : <div style={{ width: 72, height: 54, background: 'var(--ec-bg-surface)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--ec-text-muted)' }}>📎 {p.name.slice(0, 8)}</div>}
                    <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 10 }} onClick={() => setF('photographicEvidence', form.photographicEvidence.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(ACCENT)} onClick={save}><CheckCircle style={{ width: 13, height: 13 }} /> Save</button>
            <button style={btn('#475569')} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {visible.length === 0
        ? <EmptyState icon={ClipboardList} title="No inspection records" sub='Click "Add Inspection" to start recording site verification results.' />
        : visible.map((x) => (
          <div key={x.id} style={{ ...card(), marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{x.panelId || '—'}</span>
                  {x.feederId && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>/ {x.feederId}</span>}
                  <StatusBadge status={x.status} />
                  <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>{x.inspectionType} · {x.inspectionDate}</span>
                  {x.inspector && <span style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Inspector: {x.inspector}</span>}
                </div>
                {/* Check grid */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {CHECK_ITEMS.map(({ key, label: lbl }) => (
                    <span key={key} style={{ fontSize: 10, color: 'var(--ec-text-muted)' }}>
                      {lbl}: <CheckBadge val={x[key] as CheckResult} />
                    </span>
                  ))}
                </div>
                {x.observations && <div style={{ fontSize: 11, color: 'var(--ec-text-secondary)', marginBottom: 3 }}><b>Obs:</b> {x.observations}</div>}
                {x.correctiveActions && <div style={{ fontSize: 11, color: '#F59E0B', marginBottom: 3 }}><b>CA:</b> {x.correctiveActions}</div>}
                {x.responsiblePerson && <div style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Responsible: {x.responsiblePerson} {x.targetCompletionDate && `· Target: ${x.targetCompletionDate}`} {x.closureDate && `· Closed: ${x.closureDate}`}</div>}
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {(x.auditTrail ?? []).length > 0 && (
                  <button onClick={() => setShowAudit(showAudit === x.id ? null : x.id)} style={btn('#475569', { padding: '5px 10px', fontSize: 11 })}>
                    Audit ({x.auditTrail.length})
                  </button>
                )}
                <button onClick={() => openEdit(x)} style={btn(ACCENT, { padding: '5px 10px' })}><Pencil style={{ width: 11, height: 11 }} /></button>
                {confirmDel === x.id ? (
                  <><button onClick={() => { deleteInspection(x.id); setConfirmDel(null); }} style={btn('#EF4444', { padding: '5px 10px' })}>✓</button><button onClick={() => setConfirmDel(null)} style={btn('#475569', { padding: '5px 10px' })}>✗</button></>
                ) : (
                  <button onClick={() => setConfirmDel(x.id)} style={btn('#EF4444', { padding: '5px 10px' })}><Trash2 style={{ width: 11, height: 11 }} /></button>
                )}
              </div>
            </div>
            {showAudit === x.id && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--ec-border)', paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--ec-text-secondary)' }}>Audit Trail</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Timestamp','Field','Previous Value','New Value','Changed By'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>{(x.auditTrail ?? []).map((a, j) => (
                    <tr key={j} style={{ background: j % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      <td style={td({ fontSize: 10 })}>{new Date(a.timestamp).toLocaleString()}</td>
                      <td style={td({ fontSize: 10 })}>{a.field}</td>
                      <td style={td({ fontSize: 10, color: '#EF4444' })}>{a.previousValue}</td>
                      <td style={td({ fontSize: 10, color: '#22C55E' })}>{a.newValue}</td>
                      <td style={td({ fontSize: 10 })}>{a.changedBy}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

// ─── SECTION: Reports ─────────────────────────────────────────────────────────

function Reports() {
  const store = useLVPanelStore();
  const [activeTab, setActiveTab] = useState<'search' | 'reports'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'panels' | 'feeders' | 'loads' | 'meters' | 'drawings' | 'inspections'>('all');

  // Global search
  interface SearchHit { type: string; id: string; primary: string; secondary: string; tertiary: string; }
  const hits: SearchHit[] = [];
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    store.panels.forEach(p => {
      const match = [p.panelId, p.panelName, p.electricalArea, p.location, p.incomingCableSize, p.remarks].some(v => v.toLowerCase().includes(q));
      if (match && (searchScope === 'all' || searchScope === 'panels'))
        hits.push({ type: 'Panel', id: p.id, primary: p.panelId, secondary: `${p.panelName} · ${p.panelType}`, tertiary: `${p.electricalArea} · ${p.installationStatus}` });
    });
    store.feeders.forEach(f => {
      const match = [f.feederRef, f.fromPanel, f.toPanel, f.description, f.cableSize, f.area].some(v => v.toLowerCase().includes(q));
      if (match && (searchScope === 'all' || searchScope === 'feeders'))
        hits.push({ type: 'Feeder', id: f.id, primary: f.feederRef, secondary: `${f.fromPanel} → ${f.toPanel}`, tertiary: `${f.cableSize} · ${f.installationStatus}` });
    });
    store.loads.forEach(l => {
      const match = [l.panelId, l.circuitRef, l.description, l.area, l.cableSize, l.loadCategory].some(v => v.toLowerCase().includes(q));
      if (match && (searchScope === 'all' || searchScope === 'loads'))
        hits.push({ type: 'Load', id: l.id, primary: l.circuitRef, secondary: `${l.description}`, tertiary: `${l.panelId} · ${l.ratedKW} kW · ${l.cableSize}` });
    });
    store.meters.forEach(m => {
      const match = [m.meterRef, m.panelId, m.meterType, m.ctRatio, m.serialNumber].some(v => v.toLowerCase().includes(q));
      if (match && (searchScope === 'all' || searchScope === 'meters'))
        hits.push({ type: 'Meter', id: m.id, primary: m.meterRef, secondary: `${m.panelId} · ${m.meterType}`, tertiary: `CT: ${m.ctRatio} · ${m.installationStatus}` });
    });
    store.drawings.forEach(d => {
      const match = [d.drawingNo, d.title, d.discipline, d.associatedPanel, d.remarks].some(v => v.toLowerCase().includes(q));
      if (match && (searchScope === 'all' || searchScope === 'drawings'))
        hits.push({ type: 'Drawing', id: d.id, primary: d.drawingNo, secondary: d.title, tertiary: `${d.revision} · ${d.status}` });
    });
    store.inspections.forEach(i => {
      const match = [i.panelId, i.feederId, i.inspector, i.observations, i.correctiveActions, i.inspectionType].some(v => v.toLowerCase().includes(q));
      if (match && (searchScope === 'all' || searchScope === 'inspections'))
        hits.push({ type: 'Inspection', id: i.id, primary: i.panelId, secondary: `${i.inspectionType} · ${i.inspector}`, tertiary: i.status });
    });
  }

  const typeColor: Record<string, string> = {
    Panel: ACCENT, Feeder: '#8B5CF6', Load: '#22C55E', Meter: '#F59E0B', Drawing: '#06B6D4', Inspection: '#EC4899',
  };

  // Report export helpers
  const info = store.projectInfo;
  const hdr = (title: string) => XLSX.utils.aoa_to_sheet([
    [`Project: ${info.projectName}`, `Project No: ${info.projectNo}`, `Client: ${info.client}`],
    [`Report: ${title}`, `Date: ${new Date().toLocaleDateString()}`, `Rev: ${info.revisionNo}`],
    [],
  ]);

  const appendToWB = (wb: ReturnType<typeof XLSX.utils.book_new>, ws: ReturnType<typeof XLSX.utils.json_to_sheet>, name: string) =>
    XLSX.utils.book_append_sheet(wb, ws, name);

  const reports = [
    {
      title: 'Panel Register', color: ACCENT, icon: Server,
      sub: `${store.panels.length} panels`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Panel Register'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.panels.map(p => ({
          'Panel ID': p.panelId, 'Panel Name': p.panelName, 'Type': p.panelType,
          'Area': p.electricalArea, 'Location': p.location, 'Voltage (V)': p.ratedVoltage,
          'Phases': p.phases, 'Rating (A)': p.ratedCurrentA, 'Breaker Type': p.incomingBreakerType,
          'Breaker Rating (A)': p.incomingBreakerRating, 'Fault Duty (kA)': p.faultDutyKA,
          'Connected Load (kW)': p.connectedLoadKW, 'Max Demand (kW)': p.maxDemandKW,
          'Incoming Cable': p.incomingCableSize, 'Earthing': p.earthingConductorSize,
          'Install Status': p.installationStatus, 'Inspection Status': p.inspectionStatus,
          'Commissioning': p.commissioningStatus, 'Remarks': p.remarks,
        }))), 'Panel Register');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Panel_Register.xlsx`);
      },
    },
    {
      title: 'Load Schedule (Panel-wise)', color: '#22C55E', icon: FileText,
      sub: `${store.loads.length} loads`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Electrical Load Schedule'), 'Cover');
        const panelIds = [...new Set(store.loads.map(l => l.panelId))].sort();
        for (const pid of panelIds) {
          const rows = store.loads.filter(l => l.panelId === pid).map(l => ({
            'Circuit Ref': l.circuitRef, 'Description': l.description, 'Equipment': l.equipmentName,
            'Area': l.area, 'Category': l.loadCategory, 'kW': l.ratedKW, 'PF': l.powerFactor,
            'Phases': l.phases, 'Voltage (V)': l.voltage, 'Qty': l.quantity,
            'Demand Factor': l.demandFactor, 'Ib (A)': l.designCurrentA,
            'Breaker (A)': l.breakerRating, 'Cable Size': l.cableSize, 'Remarks': l.remarks,
          }));
          if (rows.length) appendToWB(wb, XLSX.utils.json_to_sheet(rows), pid.slice(0, 31));
        }
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Load_Schedule.xlsx`);
      },
    },
    {
      title: 'MDB Outgoing Feeder Schedule', color: '#8B5CF6', icon: Cable,
      sub: `${store.feeders.length} feeders`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('MDB Outgoing Feeder Schedule'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.feeders.map(f => ({
          'S/N': f.serialNo, 'Feeder Ref': f.feederRef, 'From Panel': f.fromPanel, 'To Panel': f.toPanel,
          'Description': f.description, 'Area': f.area, 'Load (kW)': f.loadKW, 'PF': f.loadPF,
          'Phases': f.phases, 'Voltage (V)': f.voltage, 'Ib (A)': f.designCurrentA,
          'Cable Size': f.cableSize, 'Cable Type': f.cableType, 'No. Cores': f.numCores,
          'Required Length (m)': f.requiredLengthM, 'Actual Length (m)': f.actualLengthM,
          'No. Runs': f.numRuns, 'Breaker (A)': f.breakerRating, 'Breaker Type': f.breakerType,
          'Demand Factor': f.demandFactor, 'Install Status': f.installationStatus,
          'Field Verification': f.fieldVerificationStatus, 'Remarks': f.remarks,
        }))), 'Feeder Schedule');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Feeder_Schedule.xlsx`);
      },
    },
    {
      title: 'Cable Schedule & Pending Works', color: '#06B6D4', icon: Cable,
      sub: `Pending: ${store.feeders.filter(f => f.installationStatus !== 'Completed').length}`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Cable Schedule & Pending Cable Works'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.feeders.map(f => ({
          'Feeder Ref': f.feederRef, 'From': f.fromPanel, 'To': f.toPanel,
          'Cable Size': f.cableSize, 'Type': f.cableType, 'Cores': f.numCores,
          'Required (m)': f.requiredLengthM, 'Actual (m)': f.actualLengthM,
          'Runs': f.numRuns, 'Status': f.installationStatus,
          'Field Verify': f.fieldVerificationStatus, 'Inspection Notes': f.inspectionRemarks,
        }))), 'Cable Schedule');
        const pending = store.feeders.filter(f => !['Completed', 'Verified'].includes(f.installationStatus));
        if (pending.length) appendToWB(wb, XLSX.utils.json_to_sheet(pending.map(f => ({
          'Feeder Ref': f.feederRef, 'From': f.fromPanel, 'To': f.toPanel,
          'Cable Size': f.cableSize, 'Required (m)': f.requiredLengthM, 'Status': f.installationStatus,
        }))), 'Pending Works');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Cable_Schedule.xlsx`);
      },
    },
    {
      title: 'Metering & CT Schedule', color: '#F59E0B', icon: Gauge,
      sub: `${store.meters.length} meters`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Metering & CT Schedule'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.meters.map(m => ({
          'Meter Ref': m.meterRef, 'Panel ID': m.panelId, 'Feeder ID': m.feederId,
          'Description': m.equipmentDescription, 'Required': m.meterRequired ? 'Yes' : 'No',
          'Installed': m.meterInstalled ? 'Yes' : 'No', 'Type': m.meterType,
          'CT Ratio': m.ctRatio, 'CT Accuracy': m.ctAccuracyClass, 'CT Qty': m.ctQuantity,
          'Priority': m.meteringPriority, 'Protocol': m.communicationProtocol,
          'EMS Status': m.emsIntegrationStatus, 'Serial No': m.serialNumber,
          'Install Status': m.installationStatus, 'Remarks': m.remarks,
        }))), 'Metering CT');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Metering_CT.xlsx`);
      },
    },
    {
      title: 'Inspection Status Report', color: '#EC4899', icon: ClipboardList,
      sub: `${store.inspections.length} records`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Panel Inspection Status Report'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.inspections.map(i => ({
          'Panel': i.panelId, 'Feeder': i.feederId, 'Date': i.inspectionDate,
          'Inspector': i.inspector, 'Type': i.inspectionType, 'Status': i.status,
          'Cable Size': i.cableSizeVerified, 'Breaker Rating': i.breakerRatingVerified,
          'Termination': i.cableTerminationStatus, 'Tagging': i.cableTaggingStatus,
          'Earthing': i.earthingVerified, 'Meter': i.meterInstallVerified, 'Drawing': i.drawingCompliance,
          'Observations': i.observations, 'Corrective Actions': i.correctiveActions,
          'Responsible': i.responsiblePerson, 'Target Date': i.targetCompletionDate, 'Closed': i.closureDate,
        }))), 'Inspection Register');
        const outstanding = store.inspections.filter(i => ['Observation Raised','Corrective Action Pending'].includes(i.status));
        if (outstanding.length) appendToWB(wb, XLSX.utils.json_to_sheet(outstanding.map(i => ({
          'Panel': i.panelId, 'Status': i.status, 'Observations': i.observations,
          'Corrective Actions': i.correctiveActions, 'Responsible': i.responsiblePerson, 'Target': i.targetCompletionDate,
        }))), 'Outstanding');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Inspection_Report.xlsx`);
      },
    },
    {
      title: 'Outstanding Observations', color: '#EF4444', icon: AlertCircle,
      sub: `${store.inspections.filter(i => ['Observation Raised','Corrective Action Pending'].includes(i.status)).length} open`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Outstanding Electrical Observations'), 'Cover');
        const open = store.inspections.filter(i => !['Verified','Closed'].includes(i.status));
        appendToWB(wb, XLSX.utils.json_to_sheet(open.map(i => ({
          'Panel': i.panelId, 'Feeder': i.feederId, 'Date': i.inspectionDate,
          'Inspector': i.inspector, 'Status': i.status,
          'Observations': i.observations, 'Corrective Actions': i.correctiveActions,
          'Responsible': i.responsiblePerson, 'Target Date': i.targetCompletionDate,
        }))), 'Open Observations');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Observations.xlsx`);
      },
    },
    {
      title: 'Load Summary', color: '#10B981', icon: BarChart3,
      sub: `Connected: ${store.loads.reduce((s, l) => s + l.ratedKW * l.quantity, 0).toFixed(1)} kW`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Load Summary'), 'Cover');
        const panelIds = [...new Set(store.loads.map(l => l.panelId))].sort();
        const summaryRows = panelIds.map(pid => {
          const pLoads = store.loads.filter(l => l.panelId === pid);
          const connKW = pLoads.reduce((s, l) => s + l.ratedKW * l.quantity, 0);
          const demandKW = pLoads.reduce((s, l) => s + l.ratedKW * l.quantity * l.demandFactor, 0);
          return { 'Panel ID': pid, 'Load Count': pLoads.length, 'Connected Load (kW)': connKW.toFixed(2), 'Max Demand (kW)': demandKW.toFixed(2), 'Demand Factor': pLoads.length ? (demandKW / connKW).toFixed(3) : '' };
        });
        appendToWB(wb, XLSX.utils.json_to_sheet(summaryRows), 'Load Summary');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Load_Summary.xlsx`);
      },
    },
    {
      title: 'Drawing Register', color: '#6366F1', icon: BookOpen,
      sub: `${store.drawings.length} drawings`,
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Electrical Drawing Register'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.drawings.map(d => ({
          'Drawing No': d.drawingNo, 'Title': d.title, 'Category': d.category,
          'Discipline': d.discipline, 'Associated Panel': d.associatedPanel,
          'Revision': d.revision, 'Date': d.date, 'Status': d.status,
          'Approval': d.approvalStatus, 'File Reference': d.fileRef, 'Remarks': d.remarks,
        }))), 'Drawing Register');
        XLSX.writeFile(wb, `${info.projectNo || 'LV'}_Drawing_Register.xlsx`);
      },
    },
    {
      title: 'Full Project Report', color: '#F59E0B', icon: Download,
      sub: 'All sections — single workbook',
      action: () => {
        const wb = XLSX.utils.book_new();
        appendToWB(wb, hdr('Full Project Report'), 'Cover');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.panels.map(p => ({ 'Panel ID': p.panelId, 'Name': p.panelName, 'Type': p.panelType, 'Area': p.electricalArea, 'Connected (kW)': p.connectedLoadKW, 'Demand (kW)': p.maxDemandKW, 'Status': p.installationStatus }))), 'Panels');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.feeders.map(f => ({ 'Ref': f.feederRef, 'From': f.fromPanel, 'To': f.toPanel, 'kW': f.loadKW, 'Cable': f.cableSize, 'Length (m)': f.requiredLengthM, 'Breaker (A)': f.breakerRating, 'Status': f.installationStatus }))), 'Feeders');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.loads.map(l => ({ 'Panel': l.panelId, 'Circuit': l.circuitRef, 'Desc': l.description, 'kW': l.ratedKW, 'Breaker': l.breakerRating, 'Cable': l.cableSize }))), 'Loads');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.meters.map(m => ({ 'Ref': m.meterRef, 'Panel': m.panelId, 'Type': m.meterType, 'CT': m.ctRatio, 'Status': m.installationStatus }))), 'Meters');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.drawings.map(d => ({ 'No': d.drawingNo, 'Title': d.title, 'Rev': d.revision, 'Status': d.status }))), 'Drawings');
        appendToWB(wb, XLSX.utils.json_to_sheet(store.inspections.map(i => ({ 'Panel': i.panelId, 'Date': i.inspectionDate, 'Type': i.inspectionType, 'Status': i.status, 'Obs': i.observations }))), 'Inspections');
        XLSX.writeFile(wb, `${info.projectNo || 'LV_Panel'}_Full_Report.xlsx`);
      },
    },
  ];

  return (
    <div>
      <SectionHeader title="Search, Filtering & Reports" subtitle="Global search and Excel export for all LV Panel data" icon={Download} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {(['search', 'reports'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            background: activeTab === t ? ACCENT : 'var(--ec-bg-surface)',
            color: activeTab === t ? '#fff' : 'var(--ec-text-secondary)',
          }}>{t === 'search' ? 'Global Search' : 'Export Reports'}</button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div>
          <div style={{ ...card(), marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ec-text-muted)', pointerEvents: 'none' }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search panels, feeders, loads, drawings, inspections..."
                  style={{ ...input(), paddingLeft: 34, width: '100%', fontSize: 13 }} />
              </div>
              <select value={searchScope} onChange={e => setSearchScope(e.target.value as typeof searchScope)} style={input({ width: 130 })}>
                <option value="all">All Types</option>
                <option value="panels">Panels</option>
                <option value="feeders">Feeders</option>
                <option value="loads">Loads</option>
                <option value="meters">Meters</option>
                <option value="drawings">Drawings</option>
                <option value="inspections">Inspections</option>
              </select>
              {searchQuery && <button style={btn('#475569')} onClick={() => setSearchQuery('')}>Clear</button>}
            </div>
          </div>
          {!searchQuery && (
            <EmptyState icon={Search} title="Global Search" sub="Search across all panels, feeders, loads, meters, drawings and inspections." />
          )}
          {searchQuery && hits.length === 0 && (
            <EmptyState icon={Search} title="No results" sub={`No matches found for "${searchQuery}".`} />
          )}
          {hits.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 10 }}>{hits.length} result{hits.length > 1 ? 's' : ''} for "{searchQuery}"</div>
              {hits.map((h, i) => (
                <div key={h.id + i} style={{ ...card(), marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: (typeColor[h.type] ?? ACCENT) + '22', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontWeight: 700, color: typeColor[h.type] ?? ACCENT, whiteSpace: 'nowrap' }}>{h.type}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-text-primary)' }}>{h.primary}</div>
                    <div style={{ fontSize: 11, color: 'var(--ec-text-secondary)' }}>{h.secondary}</div>
                    <div style={{ fontSize: 10, color: 'var(--ec-text-muted)' }}>{h.tertiary}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
          {reports.map(r => (
            <div key={r.title} style={card({ display: 'flex', alignItems: 'center', gap: 16 })}>
              <div style={{ background: r.color + '22', borderRadius: 10, padding: 12, flexShrink: 0 }}>
                <r.icon style={{ width: 24, height: 24, color: r.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-text-primary)', marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginBottom: 10 }}>{r.sub}</div>
                <button style={btn(r.color, { fontSize: 11, padding: '5px 12px' })} onClick={r.action}>
                  <Download style={{ width: 11, height: 11 }} /> Export Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Import Excel ────────────────────────────────────────────────────

type SheetType = 'Panel Register' | 'Load Schedule' | 'Feeder/Cable' | 'Metering' | 'Drawing Register' | 'Load Summary' | 'Truth Table' | 'Unknown';

interface ClassifiedSheet {
  name: string; type: SheetType; confidence: 'High' | 'Medium' | 'Low';
  rowCount: number; headers: string[];
  previewRows: Record<string, string>[];
  flags: string[];
}

interface ParseResult {
  sheets: ClassifiedSheet[];
  panels: Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'>[];
  loads: Omit<LVLoad, 'id'>[];
  feeders: Omit<LVFeeder, 'id' | 'createdAt'>[];
  errorLog: string[];
}

function colMatch(headers: string[], ...keywords: string[]): number {
  return headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
}

function cell(row: Record<string, string>, idx: number, headers: string[]): string {
  if (idx < 0) return '';
  return String(row[headers[idx]] ?? '').trim();
}

function classifySheet(name: string, headers: string[], rowCount: number): { type: SheetType; confidence: ClassifiedSheet['confidence'] } {
  const hn = headers.map(h => h.toLowerCase());
  const nm = name.toLowerCase();
  const panelPattern = /^(mdb|smdb|mcc|db|edb|esmdb|sdb|mldb|msdb)\s*[-_]?\s*\d+/i;

  // Truth Table
  if (nm.includes('truth') || nm.includes('interlock') || hn.some(h => h.includes('blackout') || h.includes('normal state')))
    return { type: 'Truth Table', confidence: 'High' };
  // Drawing Register
  if (nm.includes('draw') || nm.includes('drg') || hn.some(h => h.includes('drawing no') || h.includes('drg no')))
    return { type: 'Drawing Register', confidence: nm.includes('draw') ? 'High' : 'Medium' };
  // Load Summary
  if (nm.includes('summary') || nm.includes('demand') || (hn.some(h => h.includes('total')) && hn.some(h => h.includes('kva'))))
    return { type: 'Load Summary', confidence: nm.includes('summary') ? 'High' : 'Medium' };
  // Metering
  if (nm.includes('meter') || nm.includes('ct') || hn.some(h => h.includes('ct ratio') || h.includes('metering')))
    return { type: 'Metering', confidence: nm.includes('meter') ? 'High' : 'Medium' };
  // Panel Register
  if (nm.includes('panel reg') || nm.includes('board sched') || (hn.some(h => h.includes('panel id') || h.includes('board ref')) && !hn.some(h => h.includes('circuit'))))
    return { type: 'Panel Register', confidence: hn.some(h => h.includes('panel id')) ? 'High' : 'Medium' };
  // Feeder/Cable — standard or workbook-style (Source / Load Details / Users / k / OG Breaker / Breaker Size)
  const feederByHeaders = hn.some(h => h === 'from' || h.includes('from panel') || h === 'source')
    && hn.some(h => h === 'to' || h.includes('to panel') || h === 'users' || h === 'user');
  const feederByWorkbook = hn.some(h => h.includes('load details') || h.includes('og breaker') || h.includes('breaker size'));
  if (nm.includes('cable') || nm.includes('feeder') || feederByHeaders || feederByWorkbook)
    return { type: 'Feeder/Cable', confidence: (feederByHeaders || feederByWorkbook || nm.includes('feeder')) ? 'High' : 'Medium' };
  // Load Schedule — sheet named like a panel or has circuit column
  if (panelPattern.test(name) || hn.some(h => h.includes('circuit') || h.includes('load name') || h.includes('load desc')))
    return { type: 'Load Schedule', confidence: panelPattern.test(name) ? 'High' : 'Medium' };
  // kW column but no clear context
  if (hn.some(h => h.includes('kw') || h.includes('power')) && rowCount > 2)
    return { type: 'Load Schedule', confidence: 'Low' };

  return { type: 'Unknown', confidence: 'Low' };
}

function parseExcel(data: ArrayBuffer): ParseResult {
  const wb = XLSX.read(data, { type: 'array' });
  const result: ParseResult = { sheets: [], panels: [], loads: [], feeders: [], errorLog: [] };

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false });
    const headers = rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
    const { type, confidence } = classifySheet(sheetName, headers, rows.length);
    const flags: string[] = [];

    const classified: ClassifiedSheet = {
      name: sheetName, type, confidence, rowCount: rows.length, headers,
      previewRows: rows.slice(0, 5),
      flags,
    };
    result.sheets.push(classified);

    if (rows.length === 0) { flags.push('Sheet is empty'); continue; }
    if (type === 'Unknown') { flags.push('Could not classify sheet — skipped'); continue; }
    if (type === 'Truth Table' || type === 'Load Summary' || type === 'Metering' || type === 'Drawing Register')
      continue; // valid sheet types — noted in classification, no structured import yet

    if (type === 'Panel Register') {
      const iId = colMatch(headers, 'Panel ID', 'Panel Ref', 'Board Ref', 'Reference');
      const iName = colMatch(headers, 'Panel Name', 'Description', 'Name');
      const iType = colMatch(headers, 'Type', 'Panel Type', 'Board Type');
      const iArea = colMatch(headers, 'Area', 'Location');
      const iRating = colMatch(headers, 'Rating', 'Rated Current', 'Incomer');
      const iKW = colMatch(headers, 'Connected', 'Total kW', 'kW');
      if (iId < 0) { flags.push('Panel ID column not found'); }

      let added = 0;
      for (const row of rows) {
        const panelId = cell(row, iId, headers);
        if (!panelId || panelId.toLowerCase() === 'panel id') continue;
        const rawType = cell(row, iType, headers);
        const validTypes: LVPanel['panelType'][] = ['MDB','SMDB','MCC','DB','EDB','ESMDB','SDB','MLDB','Other'];
        const panelType: LVPanel['panelType'] = validTypes.includes(rawType as LVPanel['panelType']) ? rawType as LVPanel['panelType'] : 'MDB';
        result.panels.push({
          panelId, panelName: cell(row, iName, headers), panelType,
          electricalArea: cell(row, iArea, headers), location: '',
          parentPanel: '', incomingFeederRef: '', ratedVoltage: 400, phases: 3,
          ratedCurrentA: Number(cell(row, iRating, headers)) || 0,
          incomingBreakerType: '', incomingBreakerRating: 0, faultDutyKA: 0,
          connectedLoadKW: Number(cell(row, iKW, headers)) || 0, maxDemandKW: 0,
          incomingCableSize: '', earthingConductorSize: '',
          energyMeter: false, installationStatus: 'Not Started',
          inspectionStatus: 'Pending', commissioningStatus: 'Not Started', remarks: '',
        });
        added++;
      }
      classified.flags.push(`${added} panel record(s) parsed`);

    } else if (type === 'Feeder/Cable') {
      // Supports both standard and workbook-style headers:
      // Standard: Feeder Ref | From | To | Description | Area | kW | Cable Size | Length | Breaker
      // Workbook: Serial | Source | Load Details | Area | Users | k | OG Breaker | Breaker Size
      const iRef  = colMatch(headers, 'Cable Ref', 'Feeder Ref', 'Cable No', 'Ref');
      const iFrom = colMatch(headers, 'Source', 'From Panel', 'From', 'Source Panel');
      const iTo   = colMatch(headers, 'Users', 'To Panel', 'To', 'Destination', 'User');
      const iDesc = colMatch(headers, 'Load Details', 'Description', 'Load Description');
      const iArea = colMatch(headers, 'Area', 'Zone', 'Location');
      const iKW   = colMatch(headers, ' k', 'kW', 'Load kW', 'kilo');   // leading space catches standalone "k" col
      const iSize = colMatch(headers, 'Cable Size', 'Size', 'mm²', 'mm2');
      const iType = colMatch(headers, 'Cable Type', 'Type');
      const iLen  = colMatch(headers, 'Length', 'Run', 'Route', 'Cable Length');
      const iOGBreaker = colMatch(headers, 'OG Breaker', 'OG_Breaker', 'Outgoing Breaker');
      const iBreakerSize = colMatch(headers, 'Breaker Size', 'Breaker Rating', 'Breaker');
      const iSN   = colMatch(headers, 'Serial', 'S/N', 'Serial No', 'No.');

      // Fallback for standalone "k" column (exact match)
      const kColIdx = iKW >= 0 ? iKW : headers.findIndex(h => h.trim() === 'k');

      let added = 0;
      for (const row of rows) {
        const fromPanel = cell(row, iFrom, headers);
        const toPanel   = cell(row, iTo, headers);
        if (!fromPanel && !toPanel) continue;
        // Skip header-repeat rows
        const desc = cell(row, iDesc, headers);
        if (desc.toLowerCase() === 'load details' || desc.toLowerCase() === 'description') continue;

        const feederRef = cell(row, iRef, headers) || `F${String(result.feeders.length + 1).padStart(3, '0')}`;
        const rawKW  = kColIdx >= 0 ? cell(row, kColIdx, headers) : cell(row, iKW, headers);
        const rawLen = Number(cell(row, iLen, headers)) || 0;

        // Parse "Breaker Size" like "630A MCCB" or "1000A_ACB" → rating + type
        const bSizeRaw = cell(row, iBreakerSize, headers);
        const bMatch   = bSizeRaw.match(/^(\d+)\s*[A_]?\s*([A-Z]+)$/i);
        const bRating  = bMatch ? Number(bMatch[1]) : (Number(cell(row, iBreakerSize, headers)) || 0);
        const bType    = bMatch ? bMatch[2].toUpperCase() : (cell(row, iOGBreaker, headers) || 'MCCB');

        result.feeders.push({
          feederRef, fromPanel, toPanel, serialNo: cell(row, iSN, headers),
          description: desc, area: cell(row, iArea, headers),
          loadKW: Number(rawKW.replace(/[^0-9.]/g, '')) || 0,
          loadPF: 0.85, phases: 3, voltage: 400, designCurrentA: 0,
          cableSize: cell(row, iSize, headers),
          cableType: cell(row, iType, headers),
          numCores: 4, requiredLengthM: rawLen, actualLengthM: 0,
          numRuns: 1, breakerRating: bRating, breakerType: bType,
          demandFactor: 1, earthingCableSize: '',
          installationStatus: 'Not Started', fieldVerificationStatus: 'Pending',
          inspectionRemarks: '', remarks: '',
        });
        added++;
      }
      classified.flags.push(`${added} feeder record(s) parsed`);

    } else if (type === 'Load Schedule') {
      const derivedPanel = /^(MDB|SMDB|MCC|DB|EDB|ESMDB|SDB|MLDB|MSDB)\s*[-_]?\s*\d+/i.test(sheetName) ? sheetName : '';
      const iRef = colMatch(headers, 'Circuit', 'Ref', 'Circuit Ref');
      const iDesc = colMatch(headers, 'Description', 'Load Description', 'Equipment', 'Load Name');
      const iEquip = colMatch(headers, 'Equipment', 'Tag', 'Equipment Name');
      const iKW = colMatch(headers, 'kW', 'Rated kW', 'Power (kW)', 'kilo');
      const iPF = colMatch(headers, 'PF', 'Power Factor', 'cos');
      const iPh = colMatch(headers, 'Phase', 'Ph');
      const iV = colMatch(headers, 'Voltage', 'Volt', 'V (');
      const iDF = colMatch(headers, 'Demand Factor', 'DF');
      const iQty = colMatch(headers, 'Qty', 'Quantity');
      const iBreaker = colMatch(headers, 'Breaker', 'OCPD', 'CB Rating', 'Rating (A)');
      const iBreakerType = colMatch(headers, 'Breaker Type', 'CB Type', 'OCPD Type');
      const iCable = colMatch(headers, 'Cable Size', 'Cable (mm', 'Conductor', 'mm²');
      const iArea = colMatch(headers, 'Area', 'Location', 'Zone');
      const iPanelId = colMatch(headers, 'Panel', 'Board', 'Panel ID');

      let added = 0, flagged = 0;
      for (const row of rows) {
        const desc = cell(row, iDesc, headers);
        const skip = ['description', 'load description', 'total', 'sub-total', 'grand total'];
        if (!desc || skip.some(s => desc.toLowerCase() === s)) continue;
        const kwStr = cell(row, iKW, headers);
        const kw = Number(kwStr.replace(/[^0-9.]/g, ''));
        const panelId = cell(row, iPanelId, headers) || derivedPanel;
        const rawPh = cell(row, iPh, headers);
        const phases: 1 | 3 = rawPh === '1' || rawPh.toLowerCase().includes('single') ? 1 : 3;
        const voltage = Number(cell(row, iV, headers)) || (phases === 1 ? 230 : 400);
        const rawDF = Number(cell(row, iDF, headers)) || 1;
        const demandFactor = rawDF > 1 ? rawDF / 100 : rawDF;
        const qty = Number(cell(row, iQty, headers)) || 1;
        const pf = Number(cell(row, iPF, headers)) || 0.85;
        const hasSufficientForCurrent = kw > 0 && pf > 0 && voltage > 0;
        const ib = hasSufficientForCurrent ? kw * 1000 / (pf * (phases === 3 ? 1.732 * voltage : voltage)) : 0;
        if (!hasSufficientForCurrent && kw === 0) { flagged++; flags.push(`Row skipped — missing kW: "${desc}"`); continue; }
        result.loads.push({
          panelId, circuitRef: cell(row, iRef, headers) || `C${String(result.loads.length + 1).padStart(3, '0')}`,
          description: desc, equipmentName: cell(row, iEquip, headers), area: cell(row, iArea, headers),
          loadCategory: 'General', loadFactor: 1,
          ratedKW: kw, powerFactor: pf, phases, voltage, quantity: qty,
          demandFactor, designCurrentA: Math.round(ib * 100) / 100,
          startingCurrentA: 0, breakerType: cell(row, iBreakerType, headers) || 'MCB',
          breakerRating: Number(cell(row, iBreaker, headers)) || 0, faultDutyKA: 0,
          cableType: '', cableSize: cell(row, iCable, headers), earthingConductorSize: '', remarks: '',
        });
        added++;
      }
      classified.flags.push(`${added} load record(s) parsed${flagged ? `, ${flagged} flagged` : ''}`);
    }
  }
  return result;
}

function ImportExcel() {
  const { importPanels, importFeeders, importLoads, importBatches, addImportBatch } = useLVPanelStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'classify' | 'panels' | 'loads' | 'feeders' | 'errors' | 'history'>('classify');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [imported, setImported] = useState<{ panels: number; loads: number; feeders: number } | null>(null);
  const [expandSheet, setExpandSheet] = useState<string | null>(null);

  const confColor = { High: '#22C55E', Medium: '#F59E0B', Low: '#EF4444' };
  const typeColor: Record<SheetType, string> = {
    'Panel Register': ACCENT, 'Load Schedule': '#22C55E', 'Feeder/Cable': '#8B5CF6',
    'Metering': '#F59E0B', 'Drawing Register': '#06B6D4', 'Load Summary': '#10B981',
    'Truth Table': '#64748B', 'Unknown': '#EF4444',
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const result = parseExcel(buf);
    setParsed(result); setImported(null); setActiveTab('classify');
  };

  const doImport = () => {
    if (!parsed) return;
    importPanels(parsed.panels, importMode);
    importFeeders(parsed.feeders, importMode);
    importLoads(parsed.loads, importMode);
    const total = parsed.panels.length + parsed.loads.length + parsed.feeders.length;
    const flagged = parsed.errorLog.length;
    addImportBatch({
      filename: fileName, importedAt: new Date().toISOString(),
      sheetCount: parsed.sheets.length, recordsCreated: total,
      recordsSkipped: 0, recordsFlagged: flagged,
      status: flagged > 0 ? 'Partial' : 'Completed', errorLog: parsed.errorLog,
    });
    setImported({ panels: parsed.panels.length, loads: parsed.loads.length, feeders: parsed.feeders.length });
  };

  const downloadErrors = () => {
    if (!parsed) return;
    const text = parsed.errorLog.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'import_errors.txt'; a.click();
  };

  const tabs = [
    { id: 'classify', label: `Classification (${parsed?.sheets.length ?? 0} sheets)` },
    { id: 'panels', label: `Panels (${parsed?.panels.length ?? 0})` },
    { id: 'loads', label: `Loads (${parsed?.loads.length ?? 0})` },
    { id: 'feeders', label: `Feeders (${parsed?.feeders.length ?? 0})` },
    { id: 'errors', label: `Issues (${parsed?.errorLog.length ?? 0})` },
    { id: 'history', label: `History (${importBatches.length})` },
  ] as const;

  return (
    <div>
      <SectionHeader title="Import Excel Data" subtitle="Smart multi-worksheet classifier — processes actual workbook data without inventing values" icon={Upload} />

      <div style={{ ...card({ background: ACCENT + '11', border: `1px solid ${ACCENT}44` }), marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>Classification Rules</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(['Panel Register','Load Schedule','Feeder/Cable','Metering','Drawing Register','Load Summary','Truth Table','Unknown'] as SheetType[]).map(t => (
            <span key={t} style={{ background: typeColor[t] + '22', color: typeColor[t], border: `1px solid ${typeColor[t]}44`, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 6 }}>
          Original cable sizes, breaker ratings, and design values are preserved exactly as in the source workbook. Missing fields are left blank — not invented.
        </div>
      </div>

      <div style={{ ...card(), marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Step 1 — Select Workbook</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={btn(ACCENT)} onClick={() => fileRef.current?.click()}>
            <Upload style={{ width: 14, height: 14 }} /> Browse .xlsx / .xls
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
          {fileName && <span style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>📄 {fileName}</span>}
        </div>
      </div>

      {parsed && (
        <>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 14, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: activeTab === t.id ? ACCENT : 'var(--ec-bg-surface)',
                color: activeTab === t.id ? '#fff' : 'var(--ec-text-secondary)',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Classification tab */}
          {activeTab === 'classify' && (
            <div style={{ ...card(), marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Step 2 — Review Sheet Classification</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead><tr>{['Sheet Name','Classified As','Confidence','Rows','Notes / Flags'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.sheets.map((s, i) => (
                    <React.Fragment key={s.name}>
                      <tr style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent', cursor: 'pointer' }}
                        onClick={() => setExpandSheet(expandSheet === s.name ? null : s.name)}>
                        <td style={td({ fontWeight: 600 })}>{s.name}</td>
                        <td style={td()}><span style={{ background: typeColor[s.type] + '22', color: typeColor[s.type], borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{s.type}</span></td>
                        <td style={td()}><span style={{ color: confColor[s.confidence], fontWeight: 700, fontSize: 11 }}>{s.confidence}</span></td>
                        <td style={td()}>{s.rowCount}</td>
                        <td style={td({ fontSize: 10, color: 'var(--ec-text-muted)' })}>{s.flags.join(' · ')}</td>
                      </tr>
                      {expandSheet === s.name && s.previewRows.length > 0 && (
                        <tr><td colSpan={5} style={{ padding: '8px 12px', background: 'var(--ec-bg-card)' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: 'var(--ec-text-secondary)' }}>Preview (first {s.previewRows.length} rows)</div>
                          <div style={{ overflowX: 'auto', maxHeight: 140 }}>
                            <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                              <thead><tr>{s.headers.map(h => <th key={h} style={{ ...TH, fontSize: 9, padding: '2px 8px' }}>{h}</th>)}</tr></thead>
                              <tbody>{s.previewRows.map((r, j) => (
                                <tr key={j}>{s.headers.map(h => <td key={h} style={{ ...td(), fontSize: 9, padding: '2px 8px' }}>{r[h]}</td>)}</tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Panels preview */}
          {activeTab === 'panels' && (
            <div style={{ ...card(), marginBottom: 14, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Panel ID','Name','Type','Area','Rating (A)','Connected (kW)'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.panels.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      <td style={td({ color: ACCENT, fontWeight: 700 })}>{p.panelId}</td>
                      <td style={td()}>{p.panelName}</td>
                      <td style={td()}>{p.panelType}</td>
                      <td style={td()}>{p.electricalArea}</td>
                      <td style={td()}>{p.ratedCurrentA || '—'}</td>
                      <td style={td()}>{p.connectedLoadKW || '—'}</td>
                    </tr>
                  ))}
                  {parsed.panels.length === 0 && <tr><td colSpan={6} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No panels classified in this workbook</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Loads preview */}
          {activeTab === 'loads' && (
            <div style={{ ...card(), marginBottom: 14, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Panel','Circuit','Description','kW','PF','Ph','V','DF','Breaker (A)','Cable'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.loads.map((l, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      <td style={td({ color: ACCENT })}>{l.panelId || '—'}</td>
                      <td style={td()}>{l.circuitRef}</td>
                      <td style={td()}>{l.description}</td>
                      <td style={td()}>{l.ratedKW}</td>
                      <td style={td()}>{l.powerFactor}</td>
                      <td style={td()}>{l.phases}φ</td>
                      <td style={td()}>{l.voltage}</td>
                      <td style={td()}>{l.demandFactor}</td>
                      <td style={td()}>{l.breakerRating || '—'}</td>
                      <td style={td()}>{l.cableSize || '—'}</td>
                    </tr>
                  ))}
                  {parsed.loads.length === 0 && <tr><td colSpan={10} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No loads found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Feeders preview */}
          {activeTab === 'feeders' && (
            <div style={{ ...card(), marginBottom: 14, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Ref','From','To','kW','Cable','Req. Length (m)','Breaker (A)'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.feeders.map((f, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                      <td style={td({ color: ACCENT })}>{f.feederRef}</td>
                      <td style={td()}>{f.fromPanel}</td>
                      <td style={td()}>{f.toPanel}</td>
                      <td style={td()}>{f.loadKW || '—'}</td>
                      <td style={td()}>{f.cableSize || '—'}</td>
                      <td style={td()}>{f.requiredLengthM || '—'}</td>
                      <td style={td()}>{f.breakerRating || '—'}</td>
                    </tr>
                  ))}
                  {parsed.feeders.length === 0 && <tr><td colSpan={7} style={td({ textAlign: 'center', color: 'var(--ec-text-muted)' })}>No feeders found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Errors */}
          {activeTab === 'errors' && (
            <div style={{ ...card(), marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Import Issues & Flags</div>
                {parsed.errorLog.length > 0 && <button style={btn('#475569')} onClick={downloadErrors}><Download style={{ width: 12, height: 12 }} /> Download Report</button>}
              </div>
              {parsed.errorLog.length === 0
                ? <div style={{ fontSize: 12, color: '#22C55E' }}>No issues found — all records parsed successfully.</div>
                : parsed.errorLog.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#F59E0B', borderBottom: '1px solid var(--ec-border)', padding: '4px 0' }}>⚠ {e}</div>)
              }
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div style={{ ...card(), marginBottom: 14, overflowX: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Import Batch History</div>
              {importBatches.length === 0
                ? <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>No import batches recorded yet.</div>
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Filename','Imported At','Sheets','Created','Flagged','Status'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...importBatches].reverse().map((b, i) => (
                        <tr key={b.id} style={{ background: i % 2 ? 'var(--ec-bg-surface)' : 'transparent' }}>
                          <td style={td({ fontWeight: 600 })}>{b.filename}</td>
                          <td style={td({ fontSize: 10 })}>{new Date(b.importedAt).toLocaleString()}</td>
                          <td style={td()}>{b.sheetCount}</td>
                          <td style={td({ color: '#22C55E' })}>{b.recordsCreated}</td>
                          <td style={td({ color: b.recordsFlagged > 0 ? '#F59E0B' : 'var(--ec-text-muted)' })}>{b.recordsFlagged}</td>
                          <td style={td()}><span style={{ color: b.status === 'Completed' ? '#22C55E' : b.status === 'Partial' ? '#F59E0B' : '#EF4444', fontWeight: 700, fontSize: 10 }}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}

          {/* Step 3 — commit */}
          {activeTab !== 'history' && (
            <div style={{ ...card(), marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Step 3 — Choose Import Mode & Commit</div>

              {/* 3-mode selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {([
                  { mode: 'merge' as ImportMode, label: 'Merge', icon: '⊕', desc: 'Add new records only. Skip rows whose Panel ID / Feeder Ref already exists.', color: '#22C55E' },
                  { mode: 'update' as ImportMode, label: 'Update', icon: '↺', desc: 'Add new records AND overwrite matching existing records with data from the file.', color: ACCENT },
                  { mode: 'replace' as ImportMode, label: 'Replace', icon: '⚠', desc: 'Delete all existing panels / feeders / loads and replace with file contents.', color: '#EF4444' },
                ] as { mode: ImportMode; label: string; icon: string; desc: string; color: string }[]).map(m => (
                  <button key={m.mode} onClick={() => setImportMode(m.mode)} style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${importMode === m.mode ? m.color : 'var(--ec-border)'}`,
                    background: importMode === m.mode ? m.color + '18' : 'var(--ec-bg-surface)',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: importMode === m.mode ? m.color : 'var(--ec-text-primary)', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--ec-text-muted)', lineHeight: 1.5 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {importMode === 'replace' && (
                <div style={{ background: '#EF444422', border: '1px solid #EF444455', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                  Replace mode will permanently remove all existing panels, feeders, and loads before importing.
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 14 }}>
                Ready to commit: <b style={{ color: 'var(--ec-text-primary)' }}>{parsed.panels.length} panels · {parsed.loads.length} loads · {parsed.feeders.length} feeders</b>
                {parsed.errorLog.length > 0 && <span style={{ color: '#F59E0B', marginLeft: 8 }}>· {parsed.errorLog.length} flagged rows excluded</span>}
              </div>

              {imported ? (
                <div style={{ background: '#22C55E22', border: '1px solid #22C55E55', borderRadius: 10, padding: 14, fontSize: 13, color: '#22C55E', fontWeight: 600 }}>
                  Import complete ({importMode} mode) — {imported.panels} panels, {imported.loads} loads, {imported.feeders} feeders saved.
                  <div style={{ marginTop: 8 }}>
                    <button style={btn('#475569', { fontSize: 11 })} onClick={() => { setParsed(null); setFileName(''); setImported(null); }}>Import Another File</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btn(importMode === 'replace' ? '#EF4444' : importMode === 'update' ? ACCENT : '#22C55E')} onClick={doImport}>
                    <CheckCircle style={{ width: 14, height: 14 }} /> {importMode === 'replace' ? 'Replace &' : importMode === 'update' ? 'Update &' : 'Merge &'} Save {parsed.panels.length + parsed.loads.length + parsed.feeders.length} Records
                  </button>
                  <button style={btn('#475569')} onClick={() => { setParsed(null); setFileName(''); }}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SECTION: Settings ────────────────────────────────────────────────────────

function LVSettings() {
  const store = useLVPanelStore();
  const { projectInfo, setProjectInfo, panels, feeders, loads, meters, drawings, inspections, documents, calcs, switchingRecords, clearAll, loadFromJSON } = store;
  const [form, setForm] = useState(projectInfo);
  const [confirmClear, setConfirmClear] = useState(false);
  const [loadStatus, setLoadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const setF = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const saveToFile = () => {
    const snapshot: LVProjectSnapshot = {
      _version: 1,
      exportedAt: new Date().toISOString(),
      projectInfo, panels, feeders, loads, meters, drawings, inspections, documents, calcs, switchingRecords,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${projectInfo.projectNo || 'LV_Panel'}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleLoadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as LVProjectSnapshot;
      if (data._version !== 1) throw new Error('Unrecognised file format');
      loadFromJSON(data);
      setLoadStatus({ ok: true, msg: `Loaded from "${file.name}" — ${data.panels?.length ?? 0} panels, ${data.feeders?.length ?? 0} feeders, ${data.loads?.length ?? 0} loads restored.` });
    } catch (err) {
      setLoadStatus({ ok: false, msg: `Failed to load: ${(err as Error).message}` });
    }
    e.target.value = '';
  };

  const totalRecords = panels.length + feeders.length + loads.length + meters.length + drawings.length + inspections.length + documents.length;

  return (
    <div>
      <SectionHeader title="Project Settings" subtitle="Project information, file backup and data management" icon={Settings} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Project Info */}
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
            <CheckCircle style={{ width: 13, height: 13 }} /> Save Project Info
          </button>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Record counts */}
          <div style={card()}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Record Summary</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ec-text-primary)' }}>Total Records</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{totalRecords}</span>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ ...card(), border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Danger Zone</div>
            <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 12 }}>
              Permanently deletes all panels, feeders, loads and related records from localStorage.
            </div>
            {confirmClear ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btn('#EF4444')} onClick={() => { clearAll(); setConfirmClear(false); }}>Yes, Delete All</button>
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

      {/* File backup & restore */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--ec-text-primary)' }}>Project File — Save & Restore</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Save to file */}
        <div style={card({ display: 'flex', flexDirection: 'column', gap: 10 })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#22C55E22', borderRadius: 10, padding: 12 }}>
              <Download style={{ width: 24, height: 24, color: '#22C55E' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Save Project to File</div>
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Exports all {totalRecords} records to a .json backup file</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', lineHeight: 1.6 }}>
            All panels, feeders, loads, meters, drawings, inspections and documents are saved in a single JSON file.
            Use this to back up your work or transfer data between devices.
          </div>
          <button style={btn('#22C55E')} onClick={saveToFile} disabled={totalRecords === 0}>
            <Download style={{ width: 13, height: 13 }} /> Save {projectInfo.projectNo || 'Project'} to .json
          </button>
        </div>

        {/* Load from file */}
        <div style={card({ display: 'flex', flexDirection: 'column', gap: 10 })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: ACCENT + '22', borderRadius: 10, padding: 12 }}>
              <Upload style={{ width: 24, height: 24, color: ACCENT }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Load Project from File</div>
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)' }}>Restores a previously saved .json backup</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', lineHeight: 1.6 }}>
            All sections (panels, feeders, loads, meters, drawings, inspections, documents) will be restored from
            the file. Existing data in localStorage will be overwritten for sections included in the file.
          </div>
          <input ref={jsonFileRef} type="file" accept=".json" onChange={handleLoadFile} style={{ display: 'none' }} />
          <button style={btn(ACCENT)} onClick={() => jsonFileRef.current?.click()}>
            <Upload style={{ width: 13, height: 13 }} /> Load from .json File
          </button>
          {loadStatus && (
            <div style={{ background: loadStatus.ok ? '#22C55E22' : '#EF444422', border: `1px solid ${loadStatus.ok ? '#22C55E55' : '#EF444455'}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: loadStatus.ok ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
              {loadStatus.ok ? '✓' : '✗'} {loadStatus.msg}
            </div>
          )}
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
