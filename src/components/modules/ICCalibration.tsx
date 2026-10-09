import React, { useState } from 'react';
import { Settings, Download, CheckCircle, XCircle } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#8B5CF6';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

const INST_TYPES = [
  'Pressure Transmitter', 'Temperature Transmitter', 'RTD (Pt100)', 'Thermocouple',
  'DP Flow Transmitter', 'Vortex Flowmeter', 'Magnetic Flowmeter', 'Level Transmitter',
  'DP Level Transmitter', 'Control Valve Positioner', 'Smart Positioner (HART)',
  'Pressure Gauge', 'Digital Pressure Gauge', 'Pressure Switch', 'Temperature Switch',
  'Level Switch', 'Proximity Sensor', 'Limit Switch', 'Load Cell', 'Weigh Scale',
  'VFD Analog Signal', 'pH Transmitter', 'Conductivity Transmitter',
];

const ACCURACY_STD: Record<string, number> = {
  'Pressure Transmitter': 0.1, 'Temperature Transmitter': 0.1,
  'RTD (Pt100)': 0.1, 'Thermocouple': 0.25,
  'DP Flow Transmitter': 0.1, 'Vortex Flowmeter': 0.5,
  'Magnetic Flowmeter': 0.2, 'Level Transmitter': 0.1,
  'DP Level Transmitter': 0.1, 'Control Valve Positioner': 0.5,
  'Smart Positioner (HART)': 0.3, 'Pressure Gauge': 1.0,
  'Digital Pressure Gauge': 0.1, 'Pressure Switch': 2.0,
  'Temperature Switch': 2.0, 'Level Switch': 2.0,
  'Proximity Sensor': 0.5, 'Limit Switch': 0.5,
  'Load Cell': 0.05, 'Weigh Scale': 0.1,
  'VFD Analog Signal': 0.1, 'pH Transmitter': 0.5,
  'Conductivity Transmitter': 0.5,
};

const PCT_POINTS = [0, 25, 50, 75, 100];

interface CalPoint {
  pct: number;
  refValue: number;
  asFound: string;
  asLeft: string;
}

export function ICCalibration() {
  const [instType, setInstType] = useState('Pressure Transmitter');
  const [tagNo, setTagNo] = useState('PT-101');
  const [location, setLocation] = useState('');
  const [lrv, setLrv] = useState('0');
  const [urv, setUrv] = useState('100');
  const [unit, setUnit] = useState('bar');
  const [output, setOutput] = useState('4-20mA');
  const [calibDate, setCalibDate] = useState(new Date().toISOString().split('T')[0]);
  const [calibBy, setCalibBy] = useState('');
  const [refInstrument, setRefInstrument] = useState('');
  const [points, setPoints] = useState<CalPoint[]>(
    PCT_POINTS.map(pct => ({ pct, refValue: 0, asFound: '', asLeft: '' }))
  );
  const [remarks, setRemarks] = useState('');
  const [showResults, setShowResults] = useState(false);

  const span = parseFloat(urv) - parseFloat(lrv);
  const accuracy = ACCURACY_STD[instType] ?? 0.5;

  const getRefValue = (pct: number) => parseFloat(lrv) + (pct/100) * span;
  const getRefSignal = (pct: number) => output === '4-20mA' ? 4 + pct/100 * 16 : output === '0-10V' ? pct/10 : pct/100;

  const allPoints: CalPoint[] = PCT_POINTS.map((pct, i) => ({
    ...points[i],
    refValue: getRefValue(pct),
    pct,
  }));

  const setPointField = (idx: number, field: 'asFound' | 'asLeft', val: string) => {
    setPoints(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const getError = (refValue: number, actual: string) => {
    if (!actual) return null;
    return (parseFloat(actual) - refValue) / span * 100;
  };

  const overallPass = (field: 'asFound' | 'asLeft') =>
    allPoints.every(pt => {
      const err = getError(pt.refValue, points[allPoints.indexOf(pt)][field]);
      return err !== null && Math.abs(err) <= accuracy;
    });

  const generateCalSheet = () => {
    const rows = allPoints.map((pt, i) => {
      const errAF = getError(pt.refValue, points[i].asFound);
      const errAL = getError(pt.refValue, points[i].asLeft);
      return [
        `${pt.pct}%`,
        `${pt.refValue.toFixed(3)} ${unit}`,
        `${getRefSignal(pt.pct).toFixed(3)} ${output.includes('mA') ? 'mA' : 'V'}`,
        points[i].asFound || '—',
        errAF !== null ? `${errAF.toFixed(3)}%` : '—',
        errAF !== null ? (Math.abs(errAF) <= accuracy ? 'PASS' : 'FAIL') : '—',
        points[i].asLeft || '—',
        errAL !== null ? `${errAL.toFixed(3)}%` : '—',
        errAL !== null ? (Math.abs(errAL) <= accuracy ? 'PASS' : 'FAIL') : '—',
      ];
    });
    const afPass = overallPass('asFound');
    const alPass = overallPass('asLeft');
    const body = `
<h2>Calibration Record Header</h2>
<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
<tr><td class="lbl">Instrument Type</td><td class="val">${instType}</td></tr>
<tr><td class="lbl">Tag Number</td><td class="val">${tagNo}</td></tr>
<tr><td class="lbl">Location</td><td class="val">${location || '—'}</td></tr>
<tr><td class="lbl">Range (LRV)</td><td class="val">${lrv} ${unit}</td></tr>
<tr><td class="lbl">Range (URV)</td><td class="val">${urv} ${unit}</td></tr>
<tr><td class="lbl">Output Signal</td><td class="val">${output}</td></tr>
<tr><td class="lbl">Calibration Date</td><td class="val">${calibDate}</td></tr>
<tr><td class="lbl">Calibrated By</td><td class="val">${calibBy || '—'}</td></tr>
<tr><td class="lbl">Reference Instrument</td><td class="val">${refInstrument || '—'}</td></tr>
<tr><td class="lbl">Required Accuracy</td><td class="val">±${accuracy}% of span</td></tr>
</tbody></table>
<h2>Calibration Data — 5-Point Check</h2>
${tableHTML(['Test Point','Reference Value','Reference Signal','As Found','AF Error%','AF Pass/Fail','As Left','AL Error%','AL Pass/Fail'], rows)}
<h2>Overall Results</h2>
<table><thead><tr><th>Condition</th><th>Result</th></tr></thead><tbody>
<tr><td class="lbl">As Found</td><td class="val" style="color:${afPass?'#059669':'#DC2626'};font-weight:700">${afPass ? 'PASS' : 'FAIL'}</td></tr>
<tr><td class="lbl">As Left</td><td class="val" style="color:${alPass?'#059669':'#DC2626'};font-weight:700">${alPass ? 'PASS' : 'FAIL'}</td></tr>
<tr><td class="lbl">Required Accuracy</td><td class="val">±${accuracy}% of span</td></tr>
<tr><td class="lbl">Remarks</td><td class="val">${remarks || '—'}</td></tr>
</tbody></table>
<h2>Engineer Certification</h2>
<p>Calibrated By: __________________ Signature: __________________  Date: __________________</p>
<p>Verified By: __________________ Signature: __________________  Date: __________________</p>`;
    downloadReport(
      `Calibration Record — ${instType}`,
      `Tag: ${tagNo} · Range: ${lrv}–${urv} ${unit} · ${output} · Date: ${calibDate}`,
      'ISA-51.1 · IEC 60770 · OIML · ILAC-G8 · ISO 9001',
      body,
      `Calibration-${tagNo.replace(/[^a-zA-Z0-9]/g, '-')}-${calibDate}.pdf`
    );
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Settings} title="CALIBRATION TOOLS" subtitle="ISA-51.1 · IEC 60770 · OIML · ILAC-G8 · As Found / As Left · 5-Point Calibration" accentColor={ACCENT} />

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Config Panel */}
        <div>
          <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14 }}>Instrument Configuration</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Instrument Type</div>
              <select value={instType} onChange={e => setInstType(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
                {INST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {[['Tag Number', tagNo, setTagNo], ['Location / Service', location, setLocation]].map(([label, val, set]) => (
              <div key={label as string} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label as string}</div>
                <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[['LRV', lrv, setLrv], ['URV', urv, setUrv]].map(([label, val, set]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label as string}</div>
                  <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} type="number" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Engineering Unit</div>
                <input value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Output Signal</div>
                <select value={output} onChange={e => setOutput(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }}>
                  <option>4-20mA</option><option>0-10V</option><option>1-5V</option><option>HART</option><option>Profibus PA</option>
                </select>
              </div>
            </div>

            {[['Calibration Date', calibDate, setCalibDate, 'date'], ['Calibrated By', calibBy, setCalibBy, 'text'], ['Reference Instrument', refInstrument, setRefInstrument, 'text']].map(([label, val, set, type]) => (
              <div key={label as string} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label as string}</div>
                <input type={type as string} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
              </div>
            ))}

            <div style={{ padding: '10px 12px', background: ACCENT + '20', borderRadius: 8, border: `1px solid ${ACCENT}44`, fontSize: 12, color: V.sec }}>
              <strong style={{ color: ACCENT }}>Required Accuracy:</strong> ±{accuracy}% of span<br />
              <span style={{ color: V.muted }}>Span = {span.toFixed(3)} {unit}</span>
            </div>
          </div>
        </div>

        {/* Calibration Table */}
        <div>
          <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 20px', background: V.surf, borderBottom: `1px solid ${V.brdM}`, fontSize: 13, fontWeight: 700, color: ACCENT }}>
              5-Point Calibration Data Entry
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: V.surf }}>
                    {['Test Point','Reference Value','Ref Signal','As Found','AF Error%','AF','As Left','AL Error%','AL'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: V.lbl, textAlign: 'left', borderBottom: `1px solid ${V.brdM}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPoints.map((pt, i) => {
                    const errAF = getError(pt.refValue, points[i].asFound);
                    const errAL = getError(pt.refValue, points[i].asLeft);
                    const passAF = errAF !== null && Math.abs(errAF) <= accuracy;
                    const passAL = errAL !== null && Math.abs(errAL) <= accuracy;
                    return (
                      <tr key={pt.pct} style={{ borderBottom: `1px solid ${V.brdM}` }}>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: ACCENT }}>{pt.pct}%</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: V.txt, fontFamily: V.mono }}>{pt.refValue.toFixed(3)} {unit}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: V.muted, fontFamily: V.mono }}>{getRefSignal(pt.pct).toFixed(3)}{output.includes('mA') ? ' mA' : ' V'}</td>
                        <td style={{ padding: '4px 8px' }}>
                          <input value={points[i].asFound} onChange={e => setPointField(i, 'asFound', e.target.value)} placeholder="0.000" type="number" style={{ width: 80, padding: '5px 8px', background: V.surf, border: `1.5px solid ${V.brd}`, borderRadius: 6, fontSize: 12, color: V.txt, outline: 'none', fontFamily: V.mono }} />
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: V.mono, color: errAF !== null ? (Math.abs(errAF) <= accuracy ? '#059669' : '#DC2626') : V.muted }}>
                          {errAF !== null ? `${errAF > 0 ? '+' : ''}${errAF.toFixed(3)}%` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {errAF !== null ? (passAF ? <CheckCircle style={{ width: 16, height: 16, color: '#059669' }} /> : <XCircle style={{ width: 16, height: 16, color: '#DC2626' }} />) : <span style={{ color: V.muted }}>—</span>}
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input value={points[i].asLeft} onChange={e => setPointField(i, 'asLeft', e.target.value)} placeholder="0.000" type="number" style={{ width: 80, padding: '5px 8px', background: V.surf, border: `1.5px solid ${V.brd}`, borderRadius: 6, fontSize: 12, color: V.txt, outline: 'none', fontFamily: V.mono }} />
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: V.mono, color: errAL !== null ? (Math.abs(errAL) <= accuracy ? '#059669' : '#DC2626') : V.muted }}>
                          {errAL !== null ? `${errAL > 0 ? '+' : ''}${errAL.toFixed(3)}%` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {errAL !== null ? (passAL ? <CheckCircle style={{ width: 16, height: 16, color: '#059669' }} /> : <XCircle style={{ width: 16, height: 16, color: '#DC2626' }} />) : <span style={{ color: V.muted }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Remarks / Corrective Action</div>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowResults(!showResults)} style={{ flex: 1, padding: '12px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {showResults ? 'Hide' : 'Show'} Summary
            </button>
            <button onClick={generateCalSheet} style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Download style={{ width: 14, height: 14 }} /> Download Calibration Sheet
            </button>
          </div>

          {showResults && (
            <div style={{ marginTop: 16, background: V.bg, border: `2px solid ${overallPass('asLeft') ? '#059669' : '#DC2626'}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: overallPass('asLeft') ? '#059669' : '#DC2626', marginBottom: 8 }}>
                {overallPass('asLeft') ? '✔ CALIBRATION PASSED (As Left)' : '✘ CALIBRATION FAILED (As Left — requires re-calibration)'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['As Found', overallPass('asFound') ? 'PASS' : 'FAIL', overallPass('asFound') ? '#059669' : '#DC2626'],
                  ['As Left', overallPass('asLeft') ? 'PASS' : 'FAIL', overallPass('asLeft') ? '#059669' : '#DC2626'],
                ].map(([label, val, color]) => (
                  <div key={label as string} style={{ textAlign: 'center', padding: 12, background: V.surf, borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: color as string }}>{val as string}</div>
                    <div style={{ fontSize: 11, color: V.muted }}>{label as string}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: V.muted }}>Accuracy class: ±{accuracy}% of span · Standard: ISA-51.1 · IEC 60770 · OIML</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
