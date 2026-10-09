import React from 'react';
import {
  LayoutDashboard, Calculator, Flame, ClipboardList, BookOpen,
  FileText, Settings, Activity, Gauge, Zap, TrendingUp, CheckCircle,
} from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { useStore } from '../../store/useStore';

const ACCENT = '#0EA5E9';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

const MODULES = [
  { id: 'ic-calculators', icon: Calculator, label: 'Instrument Calculators', desc: 'Pressure · Flow · Temperature · Level · Control Valve · PID · Signal · Loop', count: '40+', tag: 'Calcs', color: '#0891B2' },
  { id: 'ic-glass',       icon: Flame,      label: 'Glass Process Calcs',    desc: 'Furnace · Batch · Cullet · Combustion · Tin Bath · Lehr · Flue Gas',       count: '20+', tag: 'Glass', color: '#F97316' },
  { id: 'ic-calibration', icon: Settings,   label: 'Calibration Tools',      desc: 'Pressure/Temp/Flow/Level transmitters · Valves · Sensors · Load Cells',  count: '20',  tag: 'Cal',   color: '#8B5CF6' },
  { id: 'ic-verification',icon: Activity,   label: 'Verification Tools',     desc: 'Loop Check · Signal Verify · PLC Scaling · Cable IR · Power Verify',     count: '14',  tag: 'Verify',color: '#059669' },
  { id: 'ic-checklists',  icon: ClipboardList, label: 'I&C Checklists',     desc: 'Daily (30+ items) · Monthly (22 items) · Annual (25+ items)',             count: '75+', tag: 'Check', color: '#14B8A6' },
  { id: 'ic-study',       icon: BookOpen,   label: 'Engineering Study',      desc: 'ISA Standards · PID Theory · Symbols · Glass Instrumentation Guide',     count: '28',  tag: 'Study', color: '#6366F1' },
  { id: 'ic-reports',     icon: FileText,   label: 'Reports & Email',        desc: 'Generate, download and email professional PDF calculation reports',       count: 'PDF', tag: 'PDF',   color: '#DC2626' },
];

const SIGNAL_STD = [
  ['4–20 mA', 'Current Loop', '< 4 mA = fault, > 20 mA = fault', 'NAMUR NE43'],
  ['0–10 V', 'Voltage Signal', '0 V = 0%, 10 V = 100%', 'IEC 60381-2'],
  ['1–5 V', 'Voltage Signal', '1 V = 0%, 5 V = 100%', 'IEC 60381-2'],
  ['HART', 'Digital overlay', '1200 baud FSK on 4-20 mA', 'HART 7'],
  ['Profibus PA', 'Fieldbus', '31.25 kbit/s, MBP encoding', 'IEC 61158'],
  ['Foundation FF', 'Fieldbus', '31.25 kbit/s H1 segment', 'IEC 61158'],
  ['Pulse (0/1)', 'Discrete', 'NAMUR, dry contact, PNP/NPN', 'NAMUR NE28'],
  ['RTD (Pt100)', 'Resistance', '100 Ω @ 0°C, α=0.00385', 'IEC 60751'],
  ['TC Type K', 'Millivolt', '0 mV @ 0°C, −270 to 1372°C', 'IEC 60584'],
];

const QUICK_CONV = [
  ['1 bar', '= 100 kPa = 14.5038 psi = 0.987 atm = 10.197 mH₂O'],
  ['1 psi', '= 0.0689 bar = 6.895 kPa = 27.68 inH₂O = 51.71 mmHg'],
  ['°C → °F', '= °C × 9/5 + 32'],
  ['°F → °C', '= (°F − 32) × 5/9'],
  ['°C → K',  '= °C + 273.15'],
  ['1 m³/hr', '= 16.667 L/min = 4.403 US GPM = 0.2778 L/s'],
  ['1 kg/cm²','= 98.0665 kPa = 0.9807 bar = 14.223 psi'],
];

export function ICDashboard() {
  const { setActiveModule } = useStore();

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader
        icon={LayoutDashboard}
        title="INSTRUMENTATION & CONTROL SUITE"
        subtitle="ISA · IEC 61511 · IEC 60079 · IEC 61131 · API · Glass Manufacturing Process"
        accentColor={ACCENT}
      />

      {/* KPI Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Calculators', value: '40+', icon: Calculator, color: '#0891B2' },
          { label: 'Glass Calcs',  value: '20+', icon: Flame,      color: '#F97316' },
          { label: 'Cal. Tools',   value: '20',  icon: Gauge,      color: '#8B5CF6' },
          { label: 'Study Topics', value: '28',  icon: BookOpen,   color: '#6366F1' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 20, height: 20, color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 11, color: V.muted, fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}>
        {MODULES.map(({ id, icon: Icon, label, desc, count, tag, color }) => (
          <button key={id} onClick={() => setActiveModule(id)}
            style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 14, padding: '18px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = V.brd)}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${color}33` }}>
              <Icon style={{ width: 22, height: 22, color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: V.txt }}>{label}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color, background: color + '22', borderRadius: 6, padding: '2px 7px', border: `1px solid ${color}44` }}>{tag}</span>
              </div>
              <div style={{ fontSize: 12, color: V.muted, lineHeight: 1.5 }}>{desc}</div>
              <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 6 }}>{count} {tag === 'PDF' ? 'format' : 'modules'} →</div>
            </div>
          </button>
        ))}
      </div>

      {/* Signal Standards Quick Reference */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: V.surf, borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 700, color: ACCENT, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap style={{ width: 13, height: 13 }} /> Signal Standards Quick Reference
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: V.surf }}>
                {['Signal','Type','Range / Notes','Standard'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', fontSize: 10, fontWeight: 700, color: V.lbl, textAlign: 'left', borderBottom: `1px solid ${V.brdM}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNAL_STD.map(([sig, type, range, std], i) => (
                <tr key={sig} style={{ background: i % 2 === 0 ? 'transparent' : V.surf + '80' }}>
                  <td style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: ACCENT }}>{sig}</td>
                  <td style={{ padding: '6px 12px', fontSize: 11, color: V.sec }}>{type}</td>
                  <td style={{ padding: '6px 12px', fontSize: 11, color: V.muted }}>{range}</td>
                  <td style={{ padding: '6px 12px', fontSize: 10, color: V.lbl }}>{std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: V.surf, borderBottom: `1px solid ${V.brdM}`, fontSize: 12, fontWeight: 700, color: '#F97316', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp style={{ width: 13, height: 13 }} /> Quick Unit Conversions
          </div>
          <div style={{ padding: '8px 0' }}>
            {QUICK_CONV.map(([from, to]) => (
              <div key={from} style={{ display: 'flex', gap: 12, padding: '6px 16px', borderBottom: `1px solid ${V.brdM}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316', minWidth: 80, fontFamily: "'JetBrains Mono',monospace" }}>{from}</span>
                <span style={{ fontSize: 12, color: V.sec, fontFamily: "'JetBrains Mono',monospace" }}>{to}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 16px', background: V.surf, borderTop: `1px solid ${V.brdM}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Standards Compliance</div>
            <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.6 }}>
              ISA-5.1 · ISA-75.01 · IEC 61511 · IEC 61508 · IEC 60079 · IEC 60529 · IEC 61131 · API RP 551 · ISO 5167 · NAMUR NE43
            </div>
          </div>
        </div>
      </div>

      {/* Standards Banner */}
      <div style={{ marginTop: 16, background: ACCENT + '15', border: `1.5px solid ${ACCENT}33`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CheckCircle style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: V.sec, lineHeight: 1.5 }}>
          <strong style={{ color: ACCENT }}>Session-Based Engineering Tool</strong> — All calculations are for engineering verification, calibration, and learning purposes. Generate professional PDF reports for each calculation. No permanent storage required.
        </div>
      </div>
    </div>
  );
}
