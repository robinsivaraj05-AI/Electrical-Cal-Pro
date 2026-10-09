import React, { useState } from 'react';
import { BookOpen, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface StdParam {
  parameter: string; unit: string;
  normal: string; warning: string; alarm: string; shutdown: string;
  notes: string; standard: string; category: string;
}

const PARAMS: StdParam[] = [
  // Engine
  { parameter: 'Engine Oil Pressure', unit: 'bar', normal: '3.5 – 5.5', warning: '2.5 – 3.5', alarm: '2.0', shutdown: '< 1.5', notes: 'Measured at main oil gallery. Hot idle may be as low as 1.5 bar. Cold start transient peak acceptable.', standard: 'OEM / IS 1460', category: 'Engine' },
  { parameter: 'Engine Oil Temperature', unit: '°C', normal: '90 – 110', warning: '110 – 120', alarm: '120', shutdown: '> 130', notes: 'High oil temp indicates inadequate cooling, low oil level, or oil cooler blockage.', standard: 'OEM', category: 'Engine' },
  { parameter: 'Coolant Temperature', unit: '°C', normal: '70 – 90', warning: '90 – 95', alarm: '95', shutdown: '> 100', notes: 'Radiator-cooled DG. Higher values on jacket-cooled heat exchanger type.', standard: 'ISO 8528-5', category: 'Engine' },
  { parameter: 'Engine RPM (50 Hz)', unit: 'rpm', normal: '1490 – 1510', warning: '1470 – 1490', alarm: '1560', shutdown: '> 1650', notes: '1500 RPM nominal. Governor regulates to ±2% (Class G2). Overspeed at 110% = 1650 RPM.', standard: 'ISO 8528-5', category: 'Engine' },
  { parameter: 'Engine RPM (60 Hz)', unit: 'rpm', normal: '1790 – 1810', warning: '1770 – 1790', alarm: '1870', shutdown: '> 1980', notes: '1800 RPM nominal. Overspeed at 110% = 1980 RPM.', standard: 'ISO 8528-5', category: 'Engine' },
  { parameter: 'Crankcase Pressure', unit: 'kPa', normal: '0 – 0.5', warning: '0.5 – 1.0', alarm: '1.0', shutdown: '> 2.0', notes: 'Positive crankcase pressure indicates blow-by — worn rings, blocked breather, or turbo seal failure.', standard: 'OEM', category: 'Engine' },
  { parameter: 'Cylinder Compression', unit: 'bar', normal: '> 90% of spec', warning: '80 – 90%', alarm: '< 80%', shutdown: 'N/A', notes: 'Variation between cylinders > 10% indicates ring/valve wear. Typical diesel: 28–34 bar.', standard: 'OEM', category: 'Engine' },
  { parameter: 'Exhaust Temperature', unit: '°C', normal: '350 – 550', warning: '550 – 620', alarm: '620', shutdown: '> 650', notes: 'High temp: over-fuelling, restricted air, blocked exhaust. Low temp at rated load: worn injectors.', standard: 'OEM', category: 'Engine' },
  { parameter: 'Turbo Boost Pressure', unit: 'bar (gauge)', normal: '1.0 – 2.5', warning: '< 0.8 or > 2.8', alarm: '> 3.0', shutdown: 'OEM specific', notes: 'Depends heavily on rating. Low boost at load: worn turbo, blocked air filter, exhaust restriction.', standard: 'OEM', category: 'Engine' },
  { parameter: 'Air Filter ΔP', unit: 'kPa', normal: '0 – 3.5', warning: '3.5 – 5.0', alarm: '> 5.0', shutdown: 'N/A', notes: 'Replace filter when restriction indicator activates. High ΔP = reduced air flow = black smoke, power loss.', standard: 'OEM', category: 'Engine' },
  { parameter: 'Fuel Pressure (supply)', unit: 'bar', normal: '3 – 8', warning: '< 2 or > 10', alarm: '< 1.5', shutdown: '< 1.0', notes: 'Varies by injection system. CRS (Common Rail) typically 1400–1800 bar at injector. Lift pump: 3–8 bar.', standard: 'OEM', category: 'Fuel' },
  // Alternator
  { parameter: 'Output Voltage (LL)', unit: 'V', normal: '394 – 436', warning: '360 – 394', alarm: '350', shutdown: '< 340 or > 455', notes: '415 V ±5% per IEC 60034-1. Voltage regulation class G1 ≤ ±1% steady state.', standard: 'IEC 60034 / ISO 8528-3', category: 'Alternator' },
  { parameter: 'Frequency', unit: 'Hz', normal: '49.5 – 50.5', warning: '48 – 49.5', alarm: '48', shutdown: '< 47 or > 52', notes: 'Class G2 governor: ±2% speed band. Steady-state frequency deviation ≤ ±0.5% of rated.', standard: 'ISO 8528-5', category: 'Alternator' },
  { parameter: 'Winding Temperature (Class H)', unit: '°C', normal: '< 125', warning: '125 – 145', alarm: '155', shutdown: '> 165', notes: 'Class H insulation: max 125°C rise at 40°C ambient. Class F: 100°C rise. Measure by RTD or thermistor.', standard: 'IEC 60034-1', category: 'Alternator' },
  { parameter: 'Stator Insulation Resistance', unit: 'MΩ', normal: '> 100', warning: '10 – 100', alarm: '< 10', shutdown: 'N/A', notes: 'Tested at 1 kV DC for 1 min. PI (10min/1min) > 2.0 indicates healthy insulation (IEEE 43).', standard: 'IEEE 43', category: 'Alternator' },
  { parameter: 'Rotor Insulation Resistance', unit: 'MΩ', normal: '> 10', warning: '1 – 10', alarm: '< 1', shutdown: 'N/A', notes: 'Tested at 500V DC. Low IR on rotor causes AVR hunting, voltage instability.', standard: 'IEEE 43', category: 'Alternator' },
  // Battery
  { parameter: 'Battery Voltage (24V System)', unit: 'V', normal: '24 – 27.6', warning: '22 – 24', alarm: '21', shutdown: '< 20', notes: 'Fully charged: 25.4–27.6V. Float voltage: 27.0–27.6V. Never discharge below 20V.', standard: 'IEEE 450', category: 'Battery' },
  { parameter: 'Charging Voltage (24V)', unit: 'V', normal: '27.0 – 28.8', warning: '28.8 – 29.5', alarm: '> 29.5', shutdown: 'N/A', notes: 'Above 29.5V risks gassing and plate damage. Below 27V = undercharging = sulphation.', standard: 'IEEE 450', category: 'Battery' },
  { parameter: 'Battery Specific Gravity', unit: 'SG', normal: '1.270 – 1.290', warning: '1.250 – 1.270', alarm: '< 1.250', shutdown: 'N/A', notes: 'Fully charged flooded: 1.275–1.290. Temperature correct: -0.001 SG per 3°C above 25°C.', standard: 'IEEE 450', category: 'Battery' },
  // Vibration
  { parameter: 'Engine/Alternator Vibration', unit: 'mm/s RMS', normal: '< 2.8', warning: '2.8 – 7.1', alarm: '7.1', shutdown: '> 11.2', notes: 'ISO 10816-3 Class II. Measure at bearing housing. High vibration: misalignment, imbalance, or loose mounts.', standard: 'ISO 10816-3', category: 'Mechanical' },
  { parameter: 'Bearing Temperature', unit: '°C', normal: '< 70', warning: '70 – 85', alarm: '90', shutdown: '> 95', notes: 'Max bearing temp = ambient + 40°C typical. > 95°C indicates lubrication failure or overloading.', standard: 'ISO 10816-3', category: 'Mechanical' },
  // Electrical
  { parameter: 'Earth Resistance', unit: 'Ω', normal: '< 1.0', warning: '1 – 5', alarm: '> 5', shutdown: 'N/A', notes: 'IS 3043: < 1 Ω for generator neutral and frame. IEEE 80 < 5 Ω grid. Measure after monsoon.', standard: 'IS 3043 / IEEE 80', category: 'Electrical' },
  { parameter: 'Insulation Resistance (LV Cable)', unit: 'MΩ', normal: '> 100', warning: '10 – 100', alarm: '1 – 10', shutdown: 'N/A', notes: 'Tested at 1 kV DC per IEEE 43. Minimum = (Rated kV + 1) MΩ per NEC 110.3.', standard: 'IEEE 43 / NEC', category: 'Electrical' },
  { parameter: 'Load Percentage', unit: '%', normal: '40 – 80', warning: '80 – 90', alarm: '90 – 100', shutdown: '> 110', notes: 'ISO 8528 recommends 70–80% continuous load for optimal SFC and longevity. Below 30% causes wet stacking.', standard: 'ISO 8528-5', category: 'Performance' },
  { parameter: 'Specific Fuel Consumption (75% load)', unit: 'L/kWh', normal: '0.270 – 0.300', warning: '0.300 – 0.330', alarm: '> 0.330', shutdown: 'N/A', notes: 'High SFC indicates worn injectors, low compression, turbo fault, or air restriction.', standard: 'ISO 8528 / OEM', category: 'Performance' },
];

const CATEGORIES = [...new Set(PARAMS.map(p => p.category))];

export function DGStandards() {
  const [selCat, setSelCat] = useState<string>('All');
  const [search, setSearch]   = useState('');

  const handleDownload = () => {
    const rows = PARAMS.map(p => [p.parameter, p.unit, p.normal, p.warning, p.alarm, p.shutdown, p.standard]);
    const body = `<h2>Component Standard Operating Values</h2>
      ${tableHTML(['Parameter','Unit','Normal (Green)','Warning (Amber)','Alarm (Orange)','Shutdown (Red)','Standard'], rows)}
      <p style="margin-top:10px;font-size:8.5pt;color:#64748b;padding:8px;background:#f8fafc;border-radius:5px">
        Values are typical ranges. Always verify against OEM documentation for specific model. Derate for: ambient &gt;40°C, altitude &gt;1000m, fuel quality variations.
      </p>`;
    downloadReport('DG Component Standard Values Reference', 'OEM Operating Limits — ISO 8528 · IEC 60034 · IEEE 43 · IS 1460', 'ISO 8528 · IEC 60034 · IEEE 43 · IEEE 450 · IEEE 81 · NFPA 110', body, 'DG-Standard-Values.pdf');
  };

  const filtered = PARAMS.filter(p =>
    (selCat === 'All' || p.category === selCat) &&
    (!search || p.parameter.toLowerCase().includes(search.toLowerCase()) || p.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={BookOpen} title="DG COMPONENT STANDARD VALUES" subtitle="OEM Operating Limits · ISO 8528 · IEC 60034 · IEEE 43 · IS 1460 · NFPA 110" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference PDF
        </button>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['Normal', '#059669'], ['Warning', '#D97706'], ['Alarm', '#EA580C'], ['Shutdown', '#DC2626']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: V.bg, border: `1.5px solid ${c}40`, borderRadius: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: String(c) }}>{l}</span>
          </div>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parameter…"
          style={{ marginLeft: 'auto', padding: '6px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', minWidth: 200 }} />
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setSelCat(c)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: selCat === c ? 700 : 500, border: 'none', cursor: 'pointer', background: selCat === c ? ACCENT : V.surf, color: selCat === c ? '#fff' : V.sec }}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: V.surf, padding: '9px 14px', borderBottom: `1px solid ${V.brdM}`, display: 'grid', gridTemplateColumns: '200px 60px 140px 130px 120px 120px 80px', gap: 10 }}>
          {['Parameter', 'Unit', 'Normal (Green)', 'Warning (Amber)', 'Alarm (Orange)', 'Shutdown (Red)', 'Standard'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {filtered.map((p, i) => (
          <div key={p.parameter} style={{ borderBottom: `1px solid ${V.brdM}` }}>
            {(i === 0 || filtered[i - 1].category !== p.category) && (
              <div style={{ background: ACCENT + '15', padding: '5px 14px', fontSize: 10, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {p.category}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 60px 140px 130px 120px 120px 80px', gap: 10, padding: '10px 14px', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>{p.parameter}</div>
                <div style={{ fontSize: 10, color: V.muted, marginTop: 4, lineHeight: 1.4 }}>{p.notes}</div>
              </div>
              <div style={{ fontSize: 12, color: V.sec, paddingTop: 2 }}>{p.unit}</div>
              <div style={{ padding: '4px 8px', background: '#05966920', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#059669', display: 'inline-block' }}>{p.normal}</div>
              <div style={{ padding: '4px 8px', background: '#D9770620', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#D97706', display: 'inline-block' }}>{p.warning}</div>
              <div style={{ padding: '4px 8px', background: '#EA580C20', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#EA580C', display: 'inline-block' }}>{p.alarm}</div>
              <div style={{ padding: '4px 8px', background: '#DC262620', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#DC2626', display: 'inline-block' }}>{p.shutdown}</div>
              <div style={{ fontSize: 10, color: V.muted, paddingTop: 2 }}>{p.standard}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, padding: '12px 16px', background: V.surf, borderRadius: 9, border: `1px solid ${V.brdM}`, fontSize: 11, color: V.muted }}>
        <strong>Note:</strong> All values are typical ranges. Always verify against OEM documentation for specific model. Values may differ for: (a) prime power vs standby rating, (b) ambient above 40°C (ISO 8528 derate), (c) altitude above 1000m (NFPA 110 derate), (d) fuel quality (cetane number, viscosity).
      </div>
    </div>
  );
}
