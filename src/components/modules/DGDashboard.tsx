import React from 'react';
import { Activity, Zap, Droplets, AlertTriangle, CheckCircle2, Clock, DollarSign, Leaf, Gauge, TrendingUp, Thermometer, Battery, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

const TREND_24H = Array.from({ length: 24 }, (_, i) => ({
  h: `${String(i).padStart(2, '0')}:00`,
  kw:   Math.round(390 + Math.sin(i * 0.4) * 80 + Math.random() * 30),
  fuel: parseFloat((19 + Math.sin(i * 0.35) * 3.5 + Math.random() * 1.5).toFixed(1)),
  load: Math.round(72 + Math.sin(i * 0.4) * 14 + Math.random() * 8),
}));

const WEEKLY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
  day: d,
  fuel: Math.round(380 + Math.sin(i) * 55 + Math.random() * 30),
  eff:  parseFloat((86.5 + Math.sin(i * 0.6) * 2.5).toFixed(1)),
}));

const DG_FLEET = [
  { id: 'DG-01', name: 'Main DG Set',     kva: 500, kw: 390, status: 'Running',        load: 78, fuel: 72, hours: 12450, health: 92, pf: 0.91, v: 415, hz: 50.0 },
  { id: 'DG-02', name: 'Standby DG Set',  kva: 500, kw: 0,   status: 'Standby',        load: 0,  fuel: 88, hours: 8320,  health: 96, pf: 0,    v: 415, hz: 0    },
  { id: 'DG-03', name: 'Emergency DG',    kva: 250, kw: 0,   status: 'Available',       load: 0,  fuel: 95, hours: 3200,  health: 98, pf: 0,    v: 415, hz: 0    },
  { id: 'DG-04', name: 'Auxiliary DG',    kva: 125, kw: 0,   status: 'Maintenance Due', load: 0,  fuel: 45, hours: 18900, health: 74, pf: 0,    v: 415, hz: 0    },
  { id: 'DG-05', name: 'Process DG Set',  kva: 320, kw: 0,   status: 'Breakdown',       load: 0,  fuel: 60, hours: 22100, health: 41, pf: 0,    v: 0,   hz: 0    },
];

const STATUS_C: Record<string, { bg: string; color: string; dot: string }> = {
  'Running':          { bg: '#05966920', color: '#059669', dot: '#059669' },
  'Standby':          { bg: '#2563EB20', color: '#2563EB', dot: '#2563EB' },
  'Available':        { bg: '#7C3AED20', color: '#7C3AED', dot: '#7C3AED' },
  'Maintenance Due':  { bg: '#D9770620', color: '#D97706', dot: '#D97706' },
  'Breakdown':        { bg: '#DC262620', color: '#DC2626', dot: '#DC2626' },
};

function KPI({ label, value, unit = '', color, icon: Icon }: { label: string; value: string | number; unit?: string; color: string; icon: React.ElementType }) {
  return (
    <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10, padding: '14px 16px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <Icon style={{ width: 15, height: 15, color }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: V.muted }}>{unit}</span>}
      </div>
    </div>
  );
}

function GBar({ label, value, max, unit, warn, alarm }: { label: string; value: number; max: number; unit: string; warn: number; alarm: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= alarm ? '#DC2626' : value >= warn ? '#D97706' : '#059669';
  return (
    <div style={{ padding: '9px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: V.sec }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value} <span style={{ fontSize: 10, color: V.muted }}>{unit}</span></span>
      </div>
      <div style={{ height: 5, background: V.brdM, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function DGDashboard() {
  const totalKW  = DG_FLEET.reduce((a, d) => a + d.kw, 0);
  const fuelDay  = Math.round(19.2 * 24);
  const co2Day   = (fuelDay * 2.68).toFixed(0);
  const costDay  = (fuelDay * 92).toLocaleString();
  const running  = DG_FLEET.filter(d => d.status === 'Running').length;
  const standby  = DG_FLEET.filter(d => d.status === 'Standby').length;
  const avail    = DG_FLEET.filter(d => d.status === 'Available').length;
  const down     = DG_FLEET.filter(d => d.status === 'Breakdown').length;
  const mdue     = DG_FLEET.filter(d => d.status === 'Maintenance Due').length;

  const handleDownload = () => {
    const fleetRows = DG_FLEET.map(dg => [dg.id, `${dg.name} (${dg.kva} kVA)`, dg.status, `${dg.load ? dg.load + '%' : '—'}`, `${dg.fuel}%`, `${dg.hours.toLocaleString()} hr`, `${dg.health}%`]);
    const body = `
      <h2>Fleet Status Summary</h2>
      ${tableHTML(['ID','Name / Rating','Status','Load','Fuel Level','Hours','Health Index'], fleetRows)}
      <h2>Fleet Performance KPIs</h2>
      ${tableHTML(['Parameter','Value','Note'],[
        ['Total DG Sets', String(DG_FLEET.length), ''],
        ['Running', String(running), ''],
        ['Standby', String(standby), ''],
        ['Available', String(avail), ''],
        ['Breakdown', String(down), ''],
        ['Maintenance Due', String(mdue), ''],
        ['Total Active Power', `${totalKW} kW`, 'Running units'],
        ['Daily Fuel Consumption', `${fuelDay} L/day`, 'Estimated'],
        ['Daily CO₂ Emissions', `${co2Day} kg/day`, 'Fuel × 2.68'],
        ['Daily Fuel Cost', `₹${costDay}`, 'At current diesel price'],
        ['Fleet Avg SFC', '0.285 L/kWh', 'ISO 8528 reference'],
        ['Fleet Avg Efficiency', '87.2%', 'Calculated'],
      ])}
      <h2>DG-01 Live Parameters (Main DG Set)</h2>
      ${tableHTML(['Parameter','Value','Limit / Note'],[
        ['Output Voltage','415 V','394–436 V (±5%)'],
        ['Frequency','50.0 Hz','49.5–50.5 Hz'],
        ['Load','78%','ISO 8528 recommend ≤ 80% continuous'],
        ['Power Factor','0.91','Rated 0.8 pf lagging'],
        ['Coolant Temperature','82°C','Alarm: 95°C, Shutdown: 100°C'],
        ['Oil Pressure','4.2 bar','Normal: 3.5–5.5 bar'],
        ['Fuel Level','72%','Low alarm: 25%'],
        ['Battery Voltage','27.2 V','Normal: 24–27.6 V'],
        ['Active Power','390 kW',''],
        ['Apparent Power','429 kVA',''],
        ['Reactive Power','167 kVAR',''],
      ])}`;
    downloadReport('DG Fleet Dashboard Report', 'Real-Time Fleet Monitoring · 5 DG Sets', 'ISO 8528 · IEC 60034 · NFPA 110', body, 'DG-Dashboard-Report.pdf');
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Activity} title="DG PERFORMANCE DASHBOARD" subtitle="ISO 8528 · IEC 60034 · NFPA 110 · Real-Time Fleet Monitoring" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Dashboard Report
        </button>
      </div>

      {/* Fleet Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 16 }}>
        <KPI label="Total DG Sets"  value={DG_FLEET.length} color="#475569"  icon={Activity}     />
        <KPI label="Running"         value={running}         color="#059669"  icon={CheckCircle2} />
        <KPI label="Standby"         value={standby}         color="#2563EB"  icon={Clock}        />
        <KPI label="Available"       value={avail}           color="#7C3AED"  icon={Gauge}        />
        <KPI label="Breakdown"       value={down}            color="#DC2626"  icon={AlertTriangle}/>
        <KPI label="Maint Due"       value={mdue}            color="#D97706"  icon={Zap}          />
      </div>

      {/* Key Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <KPI label="Total Active Power"  value={totalKW}         unit="kW"      color={ACCENT}   icon={Zap}         />
        <KPI label="Daily Fuel Used"     value={fuelDay}         unit="L/day"   color="#D97706"  icon={Droplets}    />
        <KPI label="CO₂ Emissions"       value={co2Day}          unit="kg/day"  color="#6B7280"  icon={Leaf}        />
        <KPI label="Daily Fuel Cost"     value={`₹${costDay}`}   unit=""        color="#DC2626"  icon={DollarSign}  />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Live Parameters */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            ⚡ DG-01 Main DG Set — Live Parameters
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <GBar label="Voltage"        value={415}  max={460}  unit="V"    warn={440} alarm={450} />
            <GBar label="Frequency"      value={50}   max={52}   unit="Hz"   warn={51}  alarm={51.5}/>
            <GBar label="Load"           value={78}   max={110}  unit="%"    warn={85}  alarm={100} />
            <GBar label="Power Factor"   value={91}   max={100}  unit="%"    warn={75}  alarm={60}  />
            <GBar label="Coolant Temp"   value={82}   max={105}  unit="°C"   warn={90}  alarm={98}  />
            <GBar label="Oil Pressure"   value={4.2}  max={7}    unit="bar"  warn={5.5} alarm={6.5} />
            <GBar label="Fuel Level"     value={72}   max={100}  unit="%"    warn={25}  alarm={10}  />
            <GBar label="Battery"        value={27.2} max={30}   unit="V"    warn={28}  alarm={29}  />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              { l: 'Active Power', v: '390 kW' },
              { l: 'Apparent Power', v: '429 kVA' },
              { l: 'Reactive Power', v: '167 kVAR' },
              { l: 'SFC', v: '0.285 L/kWh' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: V.surf, padding: '8px 10px', borderRadius: 8, border: `1px solid ${V.brdM}` }}>
                <div style={{ fontSize: 10, color: V.lbl, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Engine Health Fleet */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            🔧 Engine Health Index — Fleet Overview
          </div>
          {DG_FLEET.map((dg) => {
            const hi = dg.health;
            const hColor = hi >= 85 ? '#059669' : hi >= 60 ? '#D97706' : '#DC2626';
            const ss = STATUS_C[dg.status] ?? STATUS_C['Available'];
            return (
              <div key={dg.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, padding: '8px 10px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: V.txt, minWidth: 60 }}>{dg.id}</span>
                <span style={{ fontSize: 11, color: V.sec, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dg.name}</span>
                <div style={{ width: 90, height: 5, background: V.brdM, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: `${hi}%`, height: '100%', background: hColor, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: hColor, minWidth: 30, textAlign: 'right' }}>{hi}%</span>
                <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: ss.bg, color: ss.color, minWidth: 90, textAlign: 'center', flexShrink: 0 }}>{dg.status}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#16A34A10', border: '1px solid #16A34A30', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fleet Performance Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[{ l: 'Avg SFC', v: '0.285 L/kWh' }, { l: 'Avg Load', v: '78%' }, { l: 'Avg Efficiency', v: '87.2%' }].map(({ l, v }) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: ACCENT }}>{v}</div>
                  <div style={{ fontSize: 10, color: V.muted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Load Trend — 24 Hours</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={TREND_24H}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#64748B' }} interval={5} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 9, fill: '#64748B' }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="load" stroke={ACCENT} fill={ACCENT + '25'} name="Load %" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Fuel Consumption — 24 Hours (L/hr)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={TREND_24H}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#64748B' }} interval={5} />
              <YAxis domain={[12, 28]} tick={{ fontSize: 9, fill: '#64748B' }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="fuel" stroke="#D97706" strokeWidth={2} dot={false} name="L/hr" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Weekly Fuel Consumption vs Efficiency</div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={WEEKLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
            <YAxis yAxisId="l" domain={[200, 500]} tick={{ fontSize: 9, fill: '#64748B' }} />
            <YAxis yAxisId="r" orientation="right" domain={[80, 95]} tick={{ fontSize: 9, fill: '#64748B' }} />
            <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 11 }} />
            <Line yAxisId="l" type="monotone" dataKey="fuel"  stroke="#D97706" strokeWidth={2} name="Fuel L/day" />
            <Line yAxisId="r" type="monotone" dataKey="eff"   stroke={ACCENT}  strokeWidth={2} name="Efficiency %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fleet Table */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ background: V.surf, padding: '9px 16px', borderBottom: `1px solid ${V.brdM}`, display: 'grid', gridTemplateColumns: '70px 1fr 70px 70px 70px 60px 60px 90px 110px', gap: 8 }}>
          {['ID', 'Name', 'kVA', 'kW', 'Load%', 'Freq', 'PF', 'Hours', 'Status'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>
        {DG_FLEET.map((dg) => {
          const ss = STATUS_C[dg.status] ?? STATUS_C['Available'];
          return (
            <div key={dg.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px 70px 70px 60px 60px 90px 110px', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${V.brdM}`, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{dg.id}</span>
              <span style={{ fontSize: 12, color: V.txt }}>{dg.name}</span>
              <span style={{ fontSize: 12, color: V.sec }}>{dg.kva}</span>
              <span style={{ fontSize: 12, color: V.sec }}>{dg.kw || '—'}</span>
              <span style={{ fontSize: 12, color: dg.load > 85 ? '#D97706' : V.sec }}>{dg.load ? `${dg.load}%` : '—'}</span>
              <span style={{ fontSize: 12, color: V.sec }}>{dg.hz || '—'}</span>
              <span style={{ fontSize: 12, color: V.sec }}>{dg.pf ? dg.pf.toFixed(2) : '—'}</span>
              <span style={{ fontSize: 12, color: V.sec }}>{dg.hours.toLocaleString()}</span>
              <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700, background: ss.bg, color: ss.color, textAlign: 'center' }}>{dg.status}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '10px 16px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}`, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['ISO 8528', 'IEC 60034', 'IEC 60364', 'NFPA 110', 'IS 1460', 'IEEE 446', 'IEEE 602'].map(s => (
          <span key={s} style={{ fontSize: 10, fontWeight: 700, color: V.lbl }}>{s}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: V.muted }}>OEM: Cummins · Caterpillar · Perkins · MTU · Kirloskar · Volvo Penta · FG Wilson · Kohler</span>
      </div>
    </div>
  );
}
