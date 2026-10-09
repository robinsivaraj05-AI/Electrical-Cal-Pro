import React, { useState } from 'react';
import { Zap, Droplets, Gauge, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

type CalcTab = 'electrical' | 'fuel' | 'engine';

const DL_BTN_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
  background: ACCENT, color: '#fff', border: 'none', borderRadius: 8,
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

function Inp({ label, value, onChange, unit, note }: { label: string; value: string; onChange: (v: string) => void; unit?: string; note?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}{unit && <span style={{ color: V.muted, fontWeight: 400, marginLeft: 4 }}>({unit})</span>}
      </div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 14, color: V.txt, outline: 'none' }} />
      {note && <div style={{ fontSize: 10, color: V.muted, marginTop: 3 }}>{note}</div>}
    </div>
  );
}

function Res({ label, value, unit, accent, formula }: { label: string; value: string; unit?: string; accent?: boolean; formula?: string }) {
  return (
    <div style={{ padding: '10px 14px', background: accent ? ACCENT + '15' : V.surf, borderRadius: 9, border: `1px solid ${accent ? ACCENT + '40' : V.brdM}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: accent ? ACCENT : V.txt }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: V.muted }}>{unit}</span>}
      </div>
      {formula && <div style={{ fontSize: 10, color: V.muted, marginTop: 4, fontFamily: 'monospace' }}>{formula}</div>}
    </div>
  );
}

function ElectricalCalc() {
  const [vll, setVll]     = useState('415');
  const [il, setIl]       = useState('695');
  const [pf, setPf]       = useState('0.85');
  const [rKVA, setRKVA]   = useState('500');
  const [pinKW, setPinKW] = useState('');

  const V_LL  = parseFloat(vll)  || 0;
  const I_L   = parseFloat(il)   || 0;
  const PF    = Math.min(1, parseFloat(pf) || 0);
  const R_KVA = parseFloat(rKVA) || 1;
  const P_in  = parseFloat(pinKW) || 0;
  const sqrt3 = Math.sqrt(3);

  const S      = parseFloat(((sqrt3 * V_LL * I_L) / 1000).toFixed(2));
  const P      = parseFloat((S * PF).toFixed(2));
  const Q      = parseFloat((Math.sqrt(Math.max(0, S * S - P * P))).toFixed(2));
  const Vph    = parseFloat((V_LL / sqrt3).toFixed(1));
  const loadPct = parseFloat(((S / R_KVA) * 100).toFixed(1));
  const eff    = P_in > 0 ? parseFloat(((P / P_in) * 100).toFixed(2)) : 0;
  const In     = parseFloat(((R_KVA * 1000) / (sqrt3 * V_LL)).toFixed(1));

  const handleDownload = () => {
    const rows = [
      ['Line Voltage (V_LL)', `${V_LL} V`, 'Input'],
      ['Line Current (I_L)', `${I_L} A`, 'Input'],
      ['Power Factor (PF)', PF.toFixed(2), 'Input'],
      ['Rated kVA', `${R_KVA} kVA`, 'Nameplate'],
      ['Apparent Power (S)', `${S} kVA`, 'S = √3 × V × I / 1000'],
      ['Active Power (P)', `${P} kW`, 'P = S × PF'],
      ['Reactive Power (Q)', `${Q} kVAR`, 'Q = √(S²−P²)'],
      ['Phase Voltage', `${Vph} V`, 'V_ph = V_LL / √3'],
      ['Phase Current', `${I_L} A`, 'Star connection'],
      ['Rated Current (In)', `${In} A`, 'In = kVA×1000 / (√3×V)'],
      ['Load Percentage', `${loadPct} %`, 'Load% = (S/S_rated)×100'],
      ...(eff > 0 ? [['Efficiency', `${eff} %`, 'η = P_out/P_in×100']] : []),
    ];
    const body = `
      <h2>Electrical Performance Results</h2>
      ${tableHTML(['Parameter', 'Value', 'Formula / Reference'], rows)}
      <h2>Status</h2>
      <p style="padding:8px 12px;background:${loadPct > 100 ? '#fee2e2' : loadPct > 85 ? '#fef3c7' : '#dcfce7'};border-radius:6px;font-size:10pt;margin-top:4px">
        <strong>Load:</strong> ${loadPct}% — ${loadPct > 100 ? '⚠ OVERLOAD' : loadPct > 85 ? '⚡ WARNING — Approaching rated capacity' : '✔ Within acceptable range'}<br/>
        ISO 8528 recommends ≤ 80% continuous load. Rated kVA = ${R_KVA}.
      </p>`;
    downloadReport('DG Electrical Performance Report', `Voltage: ${V_LL} V | Current: ${I_L} A | PF: ${PF}`, 'ISO 8528-5 · IEC 60034-1 · NFPA 110', body, 'DG-Electrical-Performance.pdf');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Input Parameters</div>
        <Inp label="Line-to-Line Voltage" value={vll} onChange={setVll} unit="V" note="Alternator output terminal voltage" />
        <Inp label="Line Current" value={il} onChange={setIl} unit="A" note="Measured at output terminals" />
        <Inp label="Power Factor" value={pf} onChange={setPf} note="0 to 1 (lagging typical: 0.8)" />
        <Inp label="Rated kVA" value={rKVA} onChange={setRKVA} unit="kVA" note="Nameplate rating" />
        <Inp label="Input Power (optional)" value={pinKW} onChange={setPinKW} unit="kW" note="For efficiency calculation" />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Calculated Results</div>
          <button onClick={handleDownload} style={DL_BTN_STYLE}><Download style={{ width: 14, height: 14 }} /> Download Report</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <Res label="Apparent Power (S)" value={S.toFixed(1)} unit="kVA" accent formula="S = √3 × V_LL × I_L" />
          <Res label="Active Power (P)"   value={P.toFixed(1)} unit="kW"  accent formula="P = S × PF" />
          <Res label="Reactive Power (Q)" value={Q.toFixed(1)} unit="kVAR"      formula="Q = √(S²−P²)" />
          <Res label="Load Percentage"    value={loadPct.toFixed(1)} unit="%" accent formula="Load% = (S/S_rated)×100" />
          <Res label="Phase Voltage"      value={Vph.toFixed(0)} unit="V"       formula="V_ph = V_LL / √3" />
          <Res label="Phase Current"      value={I_L.toFixed(0)} unit="A"       formula="Star — I_ph = I_L" />
          <Res label="Rated Current"      value={In.toFixed(0)} unit="A"        formula="I_n = kVA×1000/(√3×V)" />
          {eff > 0 && <Res label="Efficiency" value={eff.toFixed(1)} unit="%" accent formula="η = P_out/P_in × 100" />}
        </div>
        <div style={{ padding: '12px 14px', background: loadPct > 100 ? '#DC262615' : loadPct > 85 ? '#D9770615' : '#05966915', border: `1px solid ${loadPct > 100 ? '#DC262640' : loadPct > 85 ? '#D9770640' : '#05966940'}`, borderRadius: 9 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: loadPct > 100 ? '#DC2626' : loadPct > 85 ? '#D97706' : ACCENT }}>
            {loadPct > 100 ? '⚠ OVERLOAD — Reduce load immediately' : loadPct > 85 ? '⚡ WARNING — Approaching rated capacity' : '✔ Load is within acceptable range'}
          </div>
          <div style={{ fontSize: 11, color: V.muted, marginTop: 4 }}>ISO 8528 recommends ≤ 80% continuous load. Maximum rated kVA = {rKVA}.</div>
        </div>
      </div>
    </div>
  );
}

function FuelCalc() {
  const [totalFuel, setTotalFuel] = useState('460');
  const [hours, setHours]         = useState('8');
  const [loadPct, setLoadPct]     = useState('78');
  const [ratedKW, setRatedKW]     = useState('400');
  const [price, setPrice]         = useState('92');

  const tf   = parseFloat(totalFuel) || 0;
  const hr   = parseFloat(hours)     || 1;
  const lp   = parseFloat(loadPct)   || 0;
  const rkw  = parseFloat(ratedKW)   || 1;
  const pri  = parseFloat(price)     || 0;

  const actualKW   = rkw * (lp / 100);
  const fuelHr     = tf / hr;                            // L/hr
  const sfc        = actualKW > 0 ? fuelHr / actualKW : 0; // L/kWh
  const kwhPerL    = sfc > 0 ? 1 / sfc : 0;             // kWh/L
  const co2Total   = tf * 2.68;                          // kg
  const co2Hr      = fuelHr * 2.68;                      // kg/hr
  const fuelCost   = tf * pri;
  // Daily = fuel consumed in the entered running hours per day
  const fuelDay    = fuelHr * hr;                        // L/day (based on entered hours)
  const fuelMonth  = fuelDay * 30;
  const fuelAnnual = fuelDay * 365;
  const costDay    = fuelDay  * pri;
  const costMonth  = fuelMonth * pri;
  const costAnnual = fuelAnnual * pri;

  const sfcStatus = sfc > 0.33 ? 'HIGH — check injectors, air filter, load' : sfc > 0.30 ? 'FAIR — monitor trend' : 'GOOD';

  const handleDownload = () => {
    const body = `
      <h2>Input Data</h2>
      ${tableHTML(['Parameter', 'Value', 'Note'], [
        ['Total Fuel Used', `${tf} L`, 'Measurement period'],
        ['Running Hours / Day', `${hr} hr`, 'Daily operating hours'],
        ['Load Percentage', `${lp} %`, 'Average during period'],
        ['Rated Power', `${rkw} kW`, 'Nameplate rating'],
        ['Diesel Price', `₹${pri}/L`, 'Current market price'],
      ])}
      <h2>Fuel Analysis Results</h2>
      ${tableHTML(['Parameter', 'Value', 'Formula'], [
        ['Fuel Rate',           `${fuelHr.toFixed(2)} L/hr`,    '= Total Fuel / Hours'],
        ['Actual Power Output', `${actualKW.toFixed(0)} kW`,    '= Rated kW × Load%'],
        ['Specific Fuel Consumption', `${sfc.toFixed(3)} L/kWh`, 'SFC = (L/hr) ÷ kW'],
        ['Fuel Efficiency',     `${kwhPerL.toFixed(2)} kWh/L`,  '= 1 / SFC'],
        ['CO₂ (period total)',  `${co2Total.toFixed(0)} kg`,    'Fuel × 2.68 kg/L'],
        ['CO₂ Rate',            `${co2Hr.toFixed(2)} kg/hr`,   'L/hr × 2.68'],
        ['Fuel Cost (period)',  `₹${fuelCost.toLocaleString(undefined,{maximumFractionDigits:0})}`, ''],
        ['SFC Assessment',      sfcStatus, 'ISO 8528 reference range'],
      ])}
      <h2>Projection (based on ${hr} hrs/day operation)</h2>
      ${tableHTML(['Period', 'Fuel (L)', 'Cost (₹)'], [
        ['Daily',   fuelDay.toFixed(0),   `₹${costDay.toLocaleString(undefined,{maximumFractionDigits:0})}`],
        ['Monthly', fuelMonth.toFixed(0), `₹${costMonth.toLocaleString(undefined,{maximumFractionDigits:0})}`],
        ['Annual',  fuelAnnual.toFixed(0),`₹${costAnnual.toLocaleString(undefined,{maximumFractionDigits:0})}`],
      ])}
      <p style="margin-top:10px;padding:8px 12px;background:#eff6ff;border-radius:6px;font-size:9pt;color:#374151">
        <strong>ISO 8528 SFC Reference:</strong> 100% load: 0.265–0.285 L/kWh · 75% load: 0.270–0.300 L/kWh · 50% load: 0.290–0.330 L/kWh<br/>
        Your SFC: <strong>${sfc.toFixed(3)} L/kWh</strong> — ${sfcStatus}
      </p>`;
    downloadReport('DG Fuel Consumption Report', `DG Rating: ${rkw} kW | Load: ${lp}% | Running: ${hr} hrs/day | Diesel: ₹${pri}/L`, 'ISO 8528 · IEC 60034 · NFPA 110', body, 'DG-Fuel-Consumption.pdf');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Fuel Input Data</div>
        <Inp label="Total Fuel Used" value={totalFuel} onChange={setTotalFuel} unit="L" note="Measured from fuel meter or tank dip" />
        <Inp label="Running Hours / Day" value={hours} onChange={setHours} unit="hr/day" note="Daily operating hours (e.g. 8 for day shift, 16 for two shifts)" />
        <Inp label="Load Percentage" value={loadPct} onChange={setLoadPct} unit="%" note="Average load during measurement period" />
        <Inp label="Rated Power" value={ratedKW} onChange={setRatedKW} unit="kW" note="Generator nameplate kW rating" />
        <Inp label="Diesel Price" value={price} onChange={setPrice} unit="₹/L" />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fuel Analysis Results</div>
          <button onClick={handleDownload} style={{ ...DL_BTN_STYLE, background: '#D97706' }}><Download style={{ width: 14, height: 14 }} /> Download Report</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Res label="Fuel Rate"       value={fuelHr.toFixed(2)}   unit="L/hr"   accent  formula="= Total Fuel / Hours" />
          <Res label="Actual Power"    value={actualKW.toFixed(0)} unit="kW"             formula="= Rated kW × Load%" />
          <Res label="SFC"             value={sfc.toFixed(3)}      unit="L/kWh"  accent  formula="SFC = (L/hr) ÷ kW" />
          <Res label="Fuel Efficiency" value={kwhPerL.toFixed(2)}  unit="kWh/L"          formula="= 1 / SFC" />
          <Res label="CO₂ Total"       value={co2Total.toFixed(0)} unit="kg"             formula="Fuel × 2.68 kg/L" />
          <Res label="CO₂ Rate"        value={co2Hr.toFixed(2)}    unit="kg/hr"          formula="L/hr × 2.68" />
          <Res label="Fuel Cost (Period)" value={`₹${fuelCost.toLocaleString(undefined,{maximumFractionDigits:0})}`} accent />
          <Res label={`Daily Fuel (${hr}h/day)`} value={fuelDay.toFixed(0)} unit="L/day" />
        </div>
        <div style={{ marginTop: 10, background: V.surf, borderRadius: 10, border: `1px solid ${V.brdM}`, overflow: 'hidden' }}>
          <div style={{ background: '#D9770618', padding: '7px 14px', borderBottom: `1px solid ${V.brdM}`, fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Cost Projection — based on {hr} hr/day operation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {([['Daily', fuelDay, costDay], ['Monthly', fuelMonth, costMonth], ['Annual', fuelAnnual, costAnnual]] as [string, number, number][]).map(([p, fuel, cost]) => (
              <div key={p} style={{ padding: '12px 14px', borderRight: `1px solid ${V.brdM}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', marginBottom: 6 }}>{p}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>{fuel.toFixed(0)} L</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#D97706' }}>₹{cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '10px 14px', background: '#6B728015', borderRadius: 9, border: '1px solid #6B728040' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: V.sec, marginBottom: 4 }}>ISO 8528 Reference SFC Values</div>
          <div style={{ fontSize: 11, color: V.muted }}>
            100% load: 0.265–0.285 L/kWh · 75% load: 0.270–0.300 L/kWh · 50% load: 0.290–0.330 L/kWh
            <br />Your SFC: <strong style={{ color: sfc > 0.33 ? '#DC2626' : sfc > 0.30 ? '#D97706' : ACCENT }}>{sfc.toFixed(3)} L/kWh</strong> — {sfcStatus}
          </div>
        </div>
      </div>
    </div>
  );
}

function EngineCalc() {
  const [kw, setKw]       = useState('390');
  const [rpm, setRpm]     = useState('1500');
  const [fuelL, setFuelL] = useState('19.2');
  const [texh, setTexh]   = useState('450');
  const [tamb, setTamb]   = useState('35');

  const kW_out = parseFloat(kw)   || 0;
  const RPM    = parseFloat(rpm)  || 1;
  const fRate  = parseFloat(fuelL)|| 0;

  const BHP       = kW_out / 0.7457;
  const torqLbft  = (BHP * 5252) / RPM;
  const torqNm    = torqLbft * 1.356;
  const fuelKW    = fRate * 0.83 * 42700 / 3600;   // kW fuel energy rate
  const thermEff  = fuelKW > 0 ? (kW_out / fuelKW) * 100 : 0;
  const texhV     = parseFloat(texh) || 0;
  const tambV     = parseFloat(tamb) || 0;

  const handleDownload = () => {
    const body = `
      <h2>Input Data</h2>
      ${tableHTML(['Parameter', 'Value', 'Note'], [
        ['Output Power', `${kW_out} kW`, 'Electrical output'],
        ['Engine Speed', `${RPM} RPM`, '1500 RPM = 50 Hz'],
        ['Fuel Flow Rate', `${fRate} L/hr`, 'Measured from flow meter'],
        ['Exhaust Temperature', `${texhV} °C`, 'At exhaust manifold'],
        ['Ambient Temperature', `${tambV} °C`, ''],
      ])}
      <h2>Engine Performance Results</h2>
      ${tableHTML(['Parameter', 'Value', 'Formula'], [
        ['Brake Horse Power', `${BHP.toFixed(0)} BHP`, 'BHP = kW / 0.7457'],
        ['Torque (N·m)', `${torqNm.toFixed(0)} N·m`, 'T = (BHP×5252/RPM)×1.356'],
        ['Torque (lb·ft)', `${torqLbft.toFixed(0)} lb·ft`, 'T = BHP×5252/RPM'],
        ['Thermal Efficiency', `${thermEff.toFixed(1)} %`, 'η_th = P_out/P_fuel×100'],
        ['Fuel Energy Rate', `${fuelKW.toFixed(1)} kW`, 'L/hr × ρ × LHV / 3600'],
        ['Heat Rejected', `${(fuelKW - kW_out).toFixed(1)} kW`, 'Q_loss = Q_in − P_out'],
        ['Exhaust Temp Rise', `${(texhV - tambV).toFixed(0)} K`, 'T_exh − T_amb'],
        ['Air/Fuel Ratio', '14.7:1', 'Stoichiometric diesel'],
      ])}
      <p style="margin-top:10px;padding:8px 12px;background:#eff6ff;border-radius:6px;font-size:9pt;color:#374151">
        <strong>Engineering Reference:</strong> Thermal efficiency 35–42% is normal for diesel engines at rated load.
        Exhaust temp 400–550°C indicates proper combustion at 75–100% load.
      </p>`;
    downloadReport('DG Engine Performance Report', `Output: ${kW_out} kW | Speed: ${RPM} RPM | Fuel: ${fRate} L/hr`, 'ISO 8528-5 · IEC 60034 · OEM Specification', body, 'DG-Engine-Performance.pdf');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Engine Input Data</div>
        <Inp label="Actual Output Power" value={kw} onChange={setKw} unit="kW" />
        <Inp label="Engine Speed" value={rpm} onChange={setRpm} unit="RPM" note="1500 RPM (50 Hz) or 1800 RPM (60 Hz)" />
        <Inp label="Fuel Flow Rate" value={fuelL} onChange={setFuelL} unit="L/hr" />
        <Inp label="Exhaust Temperature" value={texh} onChange={setTexh} unit="°C" note="Normal: 350–550°C at rated load" />
        <Inp label="Ambient Temperature" value={tamb} onChange={setTamb} unit="°C" />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Engine Performance Results</div>
          <button onClick={handleDownload} style={{ ...DL_BTN_STYLE, background: '#7C3AED' }}><Download style={{ width: 14, height: 14 }} /> Download Report</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Res label="Brake Horse Power"  value={BHP.toFixed(0)}          unit="BHP"  accent  formula="BHP = kW / 0.7457" />
          <Res label="Torque (N·m)"       value={torqNm.toFixed(0)}        unit="N·m"  accent  formula="T = (BHP×5252/RPM)×1.356" />
          <Res label="Torque (lb·ft)"     value={torqLbft.toFixed(0)}      unit="lb·ft"        formula="T = BHP × 5252 / RPM" />
          <Res label="Thermal Efficiency" value={thermEff.toFixed(1)}      unit="%"    accent  formula="η_th = P_out / P_fuel × 100" />
          <Res label="Fuel Energy Rate"   value={fuelKW.toFixed(1)}        unit="kW"           formula="L/hr × ρ × LHV / 3600" />
          <Res label="Heat Rejected"      value={(fuelKW - kW_out).toFixed(1)} unit="kW"       formula="Q_loss = Q_in − P_out" />
          <Res label="Exhaust Temp Rise"  value={(texhV - tambV).toFixed(0)} unit="K"          formula="T_exh − T_amb" />
          <Res label="Air/Fuel Ratio"     value="14.7"                     unit=":1"           formula="Stoichiometric diesel" />
        </div>
        <div style={{ marginTop: 10, padding: '12px 14px', background: V.surf, borderRadius: 9, border: `1px solid ${V.brdM}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: V.sec, marginBottom: 6 }}>Engineering Notes — IEC 60034 / ISO 8528</div>
          <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.6 }}>
            • Thermal efficiency 35–42% is normal for diesel engines at rated load<br />
            • Exhaust temp 400–550°C indicates proper combustion at 75–100% load<br />
            • Exhaust temp &gt;550°C may indicate over-fuelling or high back pressure<br />
            • Air density derating: 1% kW loss per 100m altitude, 0.5% per 5°C above 25°C
          </div>
        </div>
      </div>
    </div>
  );
}

export function DGPerfCalc() {
  const [tab, setTab] = useState<CalcTab>('electrical');

  const TABS: { key: CalcTab; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'electrical', label: 'Electrical Performance', icon: Zap,      color: ACCENT    },
    { key: 'fuel',       label: 'Fuel Consumption',       icon: Droplets,  color: '#D97706' },
    { key: 'engine',     label: 'Engine Performance',     icon: Gauge,     color: '#7C3AED' },
  ];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Zap} title="DG PERFORMANCE CALCULATOR" subtitle="ISO 8528 · IEC 60034 · Electrical · Fuel · Engine Calculations" accentColor={ACCENT} />

      <div style={{ display: 'flex', gap: 6, padding: 6, background: V.surf, borderRadius: 10, border: `1px solid ${V.brdM}`, marginBottom: 20 }}>
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === key ? color : 'transparent', color: tab === key ? '#fff' : V.sec, fontWeight: tab === key ? 700 : 500, fontSize: 13 }}>
            <Icon style={{ width: 15, height: 15 }} /> {label}
          </button>
        ))}
      </div>

      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: '22px 24px' }}>
        {tab === 'electrical' && <ElectricalCalc />}
        {tab === 'fuel'       && <FuelCalc />}
        {tab === 'engine'     && <EngineCalc />}
      </div>

      <div style={{ marginTop: 14, padding: '10px 16px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}`, fontSize: 11, color: V.muted }}>
        Formulas per ISO 8528-5 (Performance Requirements) · IEC 60034-1 (Rotating Machines) · NFPA 110 (Emergency Standby Power)
      </div>
    </div>
  );
}
