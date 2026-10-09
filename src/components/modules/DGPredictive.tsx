import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface PredAlert {
  component: string; indicator: string; current: string | number; threshold: string;
  trend: 'Increasing' | 'Stable' | 'Decreasing'; urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionRequired: string; estRemainingLife: string;
}

const ALERTS: PredAlert[] = [
  { component: 'Main Engine Bearing', indicator: 'Vibration (1× component)', current: '4.8 mm/s RMS', threshold: '2.8 mm/s', trend: 'Increasing', urgency: 'HIGH', actionRequired: 'Schedule bearing inspection in next planned outage. Grease bearing and recheck vibration.', estRemainingLife: '3–6 months' },
  { component: 'Alternator Stator', indicator: 'Insulation Resistance', current: '18 MΩ', threshold: '100 MΩ minimum', trend: 'Decreasing', urgency: 'HIGH', actionRequired: 'Investigate moisture ingress. Perform PI test. Consider oven drying of stator winding.', estRemainingLife: '6 months if trend continues' },
  { component: 'Battery Bank', indicator: 'Capacity (load test)', current: '76%', threshold: '80% minimum', trend: 'Decreasing', urgency: 'MEDIUM', actionRequired: 'Replace battery bank. Current capacity below NFPA 110 minimum of 80% for reliable starting.', estRemainingLife: '3 months' },
  { component: 'Air Filter', indicator: 'Restriction Differential Pressure', current: '4.2 kPa', threshold: '3.5 kPa alarm', trend: 'Increasing', urgency: 'MEDIUM', actionRequired: 'Replace air filter element immediately. High restriction causes power loss and over-fuelling.', estRemainingLife: 'Replace now' },
  { component: 'Fuel Injectors', indicator: 'Specific Fuel Consumption', current: '0.321 L/kWh', threshold: '0.300 L/kWh', trend: 'Increasing', urgency: 'MEDIUM', actionRequired: 'Injector calibration or replacement due. High SFC indicates poor atomisation and combustion.', estRemainingLife: '6–12 months' },
  { component: 'Turbocharger', indicator: 'Boost Pressure at 100% Load', current: '0.85 bar', threshold: '1.0 bar minimum', trend: 'Decreasing', urgency: 'HIGH', actionRequired: 'Turbo compressor blade fouling or bearing wear. Overhaul or replacement required.', estRemainingLife: '2–4 months' },
  { component: 'Engine Oil', indicator: 'Iron content (PPM)', current: '95 ppm Fe', threshold: '100 ppm alarm', trend: 'Increasing', urgency: 'MEDIUM', actionRequired: 'Oil analysis indicates bearing wear. Change oil immediately, resample in 250 hours.', estRemainingLife: 'Change now' },
  { component: 'AVR Module', indicator: 'Voltage Steady-State Deviation', current: '2.1%', threshold: '1.0% (Class G1)', trend: 'Increasing', urgency: 'LOW', actionRequired: 'AVR fine-tuning or capacitor replacement. Voltage regulation degrading.', estRemainingLife: '12 months' },
  { component: 'Coolant System', indicator: 'Coolant pH', current: '6.8', threshold: '7.5–10.5 normal', trend: 'Decreasing', urgency: 'MEDIUM', actionRequired: 'Add SCA (Supplemental Coolant Additive). Low pH indicates acidic coolant — liner pitting risk.', estRemainingLife: 'Treat immediately' },
  { component: 'Starter Motor', indicator: 'Cranking Current (cold start)', current: '285 A', threshold: '250 A typical', trend: 'Increasing', urgency: 'LOW', actionRequired: 'Starter motor brushes or commutator wear. Check and service at next planned outage.', estRemainingLife: '12–18 months' },
];

const URGENCY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: '#DC2626', bg: '#DC262615', border: '#DC262640' },
  HIGH:     { color: '#EA580C', bg: '#EA580C15', border: '#EA580C40' },
  MEDIUM:   { color: '#D97706', bg: '#D9770615', border: '#D9770640' },
  LOW:      { color: '#059669', bg: '#05966915', border: '#05966940' },
};

const TREND_ICON = { Increasing: '↑', Stable: '→', Decreasing: '↓' };
const TREND_COLOR = { Increasing: '#DC2626', Stable: '#D97706', Decreasing: '#2563EB' };

// Trend charts data
const IR_TREND = [
  { m: 'Jan', v: 850 }, { m: 'Feb', v: 720 }, { m: 'Mar', v: 580 }, { m: 'Apr', v: 420 },
  { m: 'May', v: 280 }, { m: 'Jun', v: 180 }, { m: 'Jul', v: 115 }, { m: 'Aug', v: 18 },
];
const VIB_TREND = [
  { m: 'Jan', v: 1.8 }, { m: 'Feb', v: 2.1 }, { m: 'Mar', v: 2.4 }, { m: 'Apr', v: 2.9 },
  { m: 'May', v: 3.5 }, { m: 'Jun', v: 4.0 }, { m: 'Jul', v: 4.5 }, { m: 'Aug', v: 4.8 },
];
const SFC_TREND = [
  { m: 'Jan', v: 0.275 }, { m: 'Feb', v: 0.278 }, { m: 'Mar', v: 0.285 }, { m: 'Apr', v: 0.291 },
  { m: 'May', v: 0.298 }, { m: 'Jun', v: 0.306 }, { m: 'Jul', v: 0.314 }, { m: 'Aug', v: 0.321 },
];

export function DGPredictive() {
  const [filter, setFilter] = useState<string>('All');

  const handleDownload = () => {
    const rows = ALERTS.map(a => [a.component, a.indicator, String(a.current), a.threshold, a.trend, a.urgency, a.estRemainingLife, a.actionRequired]);
    const body = `
      <h2>Predictive Maintenance Alerts — ${ALERTS.length} Components Monitored</h2>
      ${tableHTML(['Component','Indicator','Current Value','Threshold','Trend','Urgency','Est. Remaining Life','Recommended Action'], rows)}
      <h2>Report Schedule Summary</h2>
      ${tableHTML(['Period','Reports Included','Next Due'],[
        ['Daily',     'Inspection Checklist, Fuel Report, Alarm Log',             'Tomorrow 08:00'],
        ['Monthly',   'Performance Summary, Load Analysis, Cost Report',          '01 Sep 2026'],
        ['Quarterly', 'Efficiency Trend, Vibration Analysis, Battery Report',     '01 Oct 2026'],
        ['Annual',    'Overhaul Certificate, Performance Test, Thermography',     '01 Jan 2027'],
      ])}`;
    downloadReport('DG Predictive Maintenance Report', 'AI-Assisted Trend Analysis · Component Health Monitoring', 'ISO 8528 · NFPA 110 · IEEE 43 · IEEE 450', body, 'DG-Predictive-Maintenance.pdf');
  };

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  ALERTS.forEach(a => { counts[a.urgency]++; });

  const filtered = ALERTS.filter(a => filter === 'All' || a.urgency === filter);

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={TrendingUp} title="PREDICTIVE MAINTENANCE & REPORTS" subtitle="AI-Assisted Trend Analysis · Component Health Monitoring · ISO 8528 · NFPA 110" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Predictive Report
        </button>
      </div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
        {[['All Alerts', ALERTS.length, '#475569'], ['Critical', counts.CRITICAL, '#DC2626'], ['High', counts.HIGH, '#EA580C'], ['Medium', counts.MEDIUM, '#D97706'], ['Low', counts.LOW, '#059669']].map(([l, n, c]) => (
          <button key={String(l)} onClick={() => setFilter(String(l) === 'All Alerts' ? 'All' : String(l))}
            style={{ padding: '12px 16px', background: (String(l) === 'All Alerts' ? 'All' : String(l)) === filter ? String(c) + '25' : V.bg, border: `2px solid ${(String(l) === 'All Alerts' ? 'All' : String(l)) === filter ? String(c) : V.brd}`, borderRadius: 10, cursor: 'pointer', borderTop: `3px solid ${String(c)}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: String(c) }}>{n}</div>
            <div style={{ fontSize: 11, color: V.muted }}>{l}</div>
          </button>
        ))}
      </div>

      {/* Trend Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { title: 'Stator Insulation Resistance', data: IR_TREND, key: 'v', color: '#DC2626', unit: 'MΩ', refVal: 100, refLabel: 'Min 100 MΩ' },
          { title: 'Bearing Vibration (DG-01)', data: VIB_TREND, key: 'v', color: '#EA580C', unit: 'mm/s', refVal: 2.8, refLabel: 'Alarm 2.8' },
          { title: 'Specific Fuel Consumption', data: SFC_TREND, key: 'v', color: '#D97706', unit: 'L/kWh', refVal: 0.300, refLabel: 'Threshold' },
        ].map(({ title, data, key, color, unit, refVal, refLabel }) => (
          <div key={title} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{title}</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v} ${unit}`, title]} />
                <ReferenceLine y={refVal} stroke={color} strokeDasharray="5 3" label={{ value: refLabel, fontSize: 9, fill: color }} />
                <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Alert List */}
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Predictive Maintenance Alerts — {filtered.length} items
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((alert) => {
          const us = URGENCY_STYLE[alert.urgency];
          return (
            <div key={alert.component} style={{ background: V.bg, border: `2px solid ${us.border}`, borderRadius: 12, padding: '14px 16px', borderLeft: `5px solid ${us.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: V.txt }}>{alert.component}</span>
                    <span style={{ padding: '2px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: us.bg, color: us.color }}>{alert.urgency}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TREND_COLOR[alert.trend] }}>{TREND_ICON[alert.trend]} {alert.trend}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ padding: '7px 10px', background: V.surf, borderRadius: 7, border: `1px solid ${V.brdM}` }}>
                      <div style={{ fontSize: 10, color: V.lbl, textTransform: 'uppercase', marginBottom: 3 }}>Indicator</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: V.txt }}>{alert.indicator}</div>
                    </div>
                    <div style={{ padding: '7px 10px', background: us.bg, borderRadius: 7, border: `1px solid ${us.border}` }}>
                      <div style={{ fontSize: 10, color: V.lbl, textTransform: 'uppercase', marginBottom: 3 }}>Current Value</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: us.color }}>{alert.current}</div>
                    </div>
                    <div style={{ padding: '7px 10px', background: V.surf, borderRadius: 7, border: `1px solid ${V.brdM}` }}>
                      <div style={{ fontSize: 10, color: V.lbl, textTransform: 'uppercase', marginBottom: 3 }}>Threshold</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: V.sec }}>{alert.threshold}</div>
                    </div>
                    <div style={{ padding: '7px 10px', background: V.surf, borderRadius: 7, border: `1px solid ${V.brdM}` }}>
                      <div style={{ fontSize: 10, color: V.lbl, textTransform: 'uppercase', marginBottom: 3 }}>Est. Remaining Life</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: us.color }}>{alert.estRemainingLife}</div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Recommended Action</div>
                    <div style={{ fontSize: 12, color: V.sec, lineHeight: 1.5 }}>{alert.actionRequired}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance Report Schedule */}
      <div style={{ marginTop: 20, background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: V.surf, padding: '10px 16px', borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Automated Report Generation Schedule
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {[
            { period: 'Daily', reports: ['Inspection Checklist', 'Fuel Consumption', 'Operating Hours', 'Alarm Log'], color: '#059669', next: 'Tomorrow 08:00' },
            { period: 'Monthly', reports: ['Performance Summary', 'Load Analysis', 'Cost Report', 'Oil Analysis'], color: '#D97706', next: '01 Sep 2026' },
            { period: 'Quarterly', reports: ['Efficiency Trend', 'Vibration Analysis', 'Battery Report', 'Downtime Analysis'], color: '#7C3AED', next: '01 Oct 2026' },
            { period: 'Annual', reports: ['Overhaul Certificate', 'Performance Test', 'Thermography', 'Carbon Report'], color: '#DC2626', next: '01 Jan 2027' },
          ].map(({ period, reports, color, next }) => (
            <div key={period} style={{ padding: '14px 16px', borderRight: `1px solid ${V.brdM}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 4 }}>{period} Reports</div>
              <div style={{ fontSize: 10, color: V.muted, marginBottom: 10 }}>Next: {next}</div>
              {reports.map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: V.sec }}>{r}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
