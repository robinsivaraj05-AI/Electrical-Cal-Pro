import React from 'react';
import { AlertTriangle, CheckCircle2, Activity, Zap, Clock, TrendingUp, Shield, BarChart3, Flame, Download } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

const IR_TREND = [
  { month: 'Feb', r: 3200, y: 3100, b: 3300 },
  { month: 'Mar', r: 3100, y: 2950, b: 3150 },
  { month: 'Apr', r: 2900, y: 2800, b: 3000 },
  { month: 'May', r: 2750, y: 2650, b: 2850 },
  { month: 'Jun', r: 2600, y: 2500, b: 2700 },
  { month: 'Jul', r: 2400, y: 2300, b: 2550 },
  { month: 'Aug', r: 2600, y: 2450, b: 2700 },
];

const CONTACT_TREND = [
  { month: 'Feb', r: 42, y: 38, b: 45 },
  { month: 'Mar', r: 44, y: 40, b: 47 },
  { month: 'Apr', r: 46, y: 42, b: 49 },
  { month: 'May', r: 49, y: 45, b: 52 },
  { month: 'Jun', r: 51, y: 47, b: 55 },
  { month: 'Jul', r: 54, y: 50, b: 58 },
  { month: 'Aug', r: 56, y: 52, b: 60 },
];

const TEMP_TREND = [
  { month: 'Feb', busbar: 42, contacts: 38, cable: 35 },
  { month: 'Mar', busbar: 43, contacts: 39, cable: 36 },
  { month: 'Apr', busbar: 44, contacts: 40, cable: 36 },
  { month: 'May', busbar: 46, contacts: 42, cable: 37 },
  { month: 'Jun', busbar: 51, contacts: 47, cable: 40 },
  { month: 'Jul', busbar: 55, contacts: 52, cable: 43 },
  { month: 'Aug', busbar: 58, contacts: 55, cable: 45 },
];

const PANELS = [
  { id: 'HV-01', name: 'Incomer Panel A', location: 'Main Substation', status: 'Healthy',          health: 94, lastPM: '2024-06-15', nextPM: '2025-06-15', ir: 2600, cr: 56 },
  { id: 'HV-02', name: 'Bus Coupler',     location: 'Main Substation', status: 'Under Maintenance', health: 72, lastPM: '2024-08-01', nextPM: '2024-09-01', ir: 820, cr: 89 },
  { id: 'HV-03', name: 'Feeder Panel 1',  location: 'MV Room',          status: 'Healthy',          health: 91, lastPM: '2024-04-10', nextPM: '2025-04-10', ir: 3100, cr: 48 },
  { id: 'HV-04', name: 'Feeder Panel 2',  location: 'MV Room',          status: 'Healthy',          health: 88, lastPM: '2024-04-10', nextPM: '2025-04-10', ir: 2900, cr: 52 },
  { id: 'HV-05', name: 'Transformer Pnl', location: 'Main Substation', status: 'Test Failed',       health: 45, lastPM: '2024-07-20', nextPM: '2024-08-20', ir: 380, cr: 142 },
  { id: 'HV-06', name: 'Motor Feeder',    location: 'Process Area',     status: 'Healthy',          health: 85, lastPM: '2024-05-12', nextPM: '2025-05-12', ir: 1800, cr: 61 },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  'Healthy':            { color: '#059669', bg: '#05966918', border: '#05966940' },
  'Under Maintenance':  { color: '#D97706', bg: '#D9770618', border: '#D9770640' },
  'Test Failed':        { color: '#DC2626', bg: '#DC262618', border: '#DC262640' },
  'Under Test':         { color: '#7C3AED', bg: '#7C3AED18', border: '#7C3AED40' },
};

function HealthRing({ value, color }: { value: number; color: string }) {
  const r = 28; const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={35} cy={35} r={r} fill="none" stroke={`${color}30`} strokeWidth={7} />
      <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      <text x={35} y={35} fill={color} fontSize={14} fontWeight={800} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '35px 35px' }}>{value}</text>
    </svg>
  );
}

const KPIs = [
  { label: 'Total Panels',          value: '6',    unit: '',    color: '#2563EB', icon: Shield },
  { label: 'Healthy Panels',        value: '4',    unit: '',    color: '#059669', icon: CheckCircle2 },
  { label: 'Under Maintenance',     value: '1',    unit: '',    color: '#D97706', icon: Zap },
  { label: 'Test Failures',         value: '1',    unit: '',    color: '#DC2626', icon: AlertTriangle },
  { label: 'Upcoming PM (30 days)', value: '2',    unit: 'due', color: '#7C3AED', icon: Clock },
  { label: 'Critical Alarms',       value: '1',    unit: '',    color: '#EA580C', icon: Flame },
  { label: 'Avg Health Index',      value: '79',   unit: '%',   color: '#0891B2', icon: Activity },
  { label: 'Test Completion',       value: '83',   unit: '%',   color: '#059669', icon: BarChart3 },
  { label: 'Protection Active',     value: 'OK',   unit: '',    color: '#059669', icon: Shield },
  { label: 'Equipment Risk Index',  value: '2.4',  unit: '/10', color: '#DC2626', icon: TrendingUp },
];

const tooltipStyle = { background: 'var(--ec-bg-card)', border: '1px solid var(--ec-border-card)', color: 'var(--ec-text-primary)', fontSize: 12, borderRadius: 8 };

export function HVDashboard() {
  const { settings } = useStore();
  const isDark = settings.theme === 'dark';

  const gridColor   = isDark ? '#1E293B' : '#E2E8F0';
  const tickColor   = isDark ? '#64748B' : '#94A3B8';

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: `2px solid var(--ec-border)` }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#DC262618', border: '1px solid #DC262640', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap style={{ width: 22, height: 22, color: '#DC2626' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: V.txt, margin: 0, letterSpacing: '-0.02em' }}>11kV HV Panel Maintenance — Dashboard</h2>
          <p style={{ fontSize: 12, color: V.sec, margin: '3px 0 0' }}>IEC 62271 · IEEE C37 · IEEE 43 · NFPA 70B · Real-time Health Monitoring</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '5px 12px', borderRadius: 16, background: '#DC262618', border: '1px solid #DC262640', fontSize: 11, fontWeight: 700, color: '#DC2626' }}>⚠ 1 CRITICAL</span>
          <span style={{ padding: '5px 12px', borderRadius: 16, background: '#05966918', border: '1px solid #05966940', fontSize: 11, fontWeight: 700, color: '#059669' }}>System Online</span>
          <button onClick={() => {
            const panelRows = PANELS.map(p => [p.id, p.name, p.location, p.status, `${p.health}%`, `${p.ir} MΩ`, `${p.cr} μΩ`, p.lastPM, p.nextPM]);
            const body = `<h2>Panel Fleet Status</h2>${tableHTML(['ID','Panel','Location','Status','Health','IR (MΩ)','Contact R (μΩ)','Last PM','Next PM'], panelRows)}<h2>KPI Summary</h2>${tableHTML(['KPI','Value'],[['Total Panels','6'],['Healthy','4'],['Under Maintenance','1'],['Test Failed','1'],['Avg Health Index','79%'],['Equipment Risk Index','2.4/10']])}`;
            downloadReport('11kV HV Panel Dashboard Report','IEC 62271 · IEEE C37 · NFPA 70B · Real-Time Health Monitoring','IEC 62271-100 · IEC 62271-200 · IEEE C37 · IEEE 43 · NFPA 70B', body, 'HV-Dashboard-Report.pdf');
          }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Download style={{ width: 13, height: 13 }} /> Download Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {KPIs.map((k) => (
          <div key={k.label} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '14px 16px', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <k.icon style={{ width: 14, height: 14, color: k.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: V.lbl, letterSpacing: '0.04em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: k.color, letterSpacing: '-0.03em' }}>
              {k.value}<span style={{ fontSize: 13, fontWeight: 600, color: V.sec, marginLeft: 3 }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* IR Trend */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: V.sec, marginBottom: 12, letterSpacing: '0.04em' }}>INSULATION RESISTANCE TREND (MΩ)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={IR_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="r" stroke="#DC2626" strokeWidth={2} dot={false} name="R Phase" />
              <Line type="monotone" dataKey="y" stroke="#D97706" strokeWidth={2} dot={false} name="Y Phase" />
              <Line type="monotone" dataKey="b" stroke="#2563EB" strokeWidth={2} dot={false} name="B Phase" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {[['R Phase','#DC2626'],['Y Phase','#D97706'],['B Phase','#2563EB']].map(([l,c]) => (
              <span key={l} style={{ fontSize: 10, color: V.sec }}><span style={{ color: c as string, fontWeight: 700 }}>— </span>{l}</span>
            ))}
          </div>
        </div>

        {/* Contact Resistance Trend */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: V.sec, marginBottom: 12, letterSpacing: '0.04em' }}>CONTACT RESISTANCE TREND (μΩ)</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={CONTACT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="r" stroke="#DC2626" fill="#DC262620" name="R Phase" />
              <Area type="monotone" dataKey="y" stroke="#D97706" fill="#D9770620" name="Y Phase" />
              <Area type="monotone" dataKey="b" stroke="#2563EB" fill="#2563EB20" name="B Phase" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {[['R','#DC2626'],['Y','#D97706'],['B','#2563EB']].map(([l,c]) => (
              <span key={l} style={{ fontSize: 10, color: V.sec }}><span style={{ color: c as string, fontWeight: 700 }}>■ </span>{l} Phase</span>
            ))}
          </div>
        </div>

        {/* Temperature Trend */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: V.sec, marginBottom: 12, letterSpacing: '0.04em' }}>TEMPERATURE TREND (°C) — Thermography</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={TEMP_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="busbar"   stroke="#EA580C" strokeWidth={2} dot={false} name="Busbar" />
              <Line type="monotone" dataKey="contacts" stroke="#7C3AED" strokeWidth={2} dot={false} name="Contacts" />
              <Line type="monotone" dataKey="cable"    stroke="#059669" strokeWidth={2} dot={false} name="Cable" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {[['Busbar','#EA580C'],['Contacts','#7C3AED'],['Cable','#059669']].map(([l,c]) => (
              <span key={l} style={{ fontSize: 10, color: V.sec }}><span style={{ color: c as string, fontWeight: 700 }}>— </span>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Status Table */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${V.brdM}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>Panel Status Overview</span>
          <span style={{ fontSize: 11, color: V.muted }}>IEC 62271-200 · Last updated: {new Date().toLocaleDateString()}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: V.surf }}>
                {['Panel ID','Name','Location','Status','Health Index','Last PM','Next PM','IR (MΩ)','CR (μΩ)'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PANELS.map((p, i) => {
                const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE['Healthy'];
                const hColor = p.health >= 85 ? '#059669' : p.health >= 60 ? '#D97706' : '#DC2626';
                const irColor = p.ir >= 1000 ? '#059669' : p.ir >= 100 ? '#D97706' : '#DC2626';
                const crColor = p.cr <= 60 ? '#059669' : p.cr <= 100 ? '#D97706' : '#DC2626';
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${V.brdM}`, background: i % 2 ? V.surf : 'transparent' }}>
                    <td style={{ padding: '11px 14px', fontFamily: V.mono, fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{p.id}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: V.txt }}>{p.name}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: V.sec }}>{p.location}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: V.brdM, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${p.health}%`, height: '100%', background: hColor, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: V.mono, fontSize: 12, fontWeight: 700, color: hColor, minWidth: 34 }}>{p.health}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: V.muted }}>{p.lastPM}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: V.muted }}>{p.nextPM}</td>
                    <td style={{ padding: '11px 14px', fontFamily: V.mono, fontSize: 12, fontWeight: 700, color: irColor }}>{p.ir.toLocaleString()}</td>
                    <td style={{ padding: '11px 14px', fontFamily: V.mono, fontSize: 12, fontWeight: 700, color: crColor }}>{p.cr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standards footer */}
      <div style={{ padding: '12px 16px', background: V.surf, border: `1px solid ${V.brdM}`, borderRadius: 10, fontSize: 11, color: V.muted }}>
        <strong style={{ color: V.sec }}>Standards:</strong> IEC 62271-100 (CB testing) · IEC 62271-200 (MV switchgear) · IEEE 43 (IR testing) · IEEE 81 (earth testing) · IEEE 1584 (arc flash) · NFPA 70B (preventive maintenance) · IEC 60255 (protection relays)
      </div>
    </div>
  );
}
