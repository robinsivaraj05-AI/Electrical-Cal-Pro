import React, { useState } from 'react';
import { Flame, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#F97316';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};
const inp = (val: string, set: (v: string) => void, label: string, unit = '') => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label}{unit && <span style={{ color: V.muted, marginLeft: 4 }}>({unit})</span>}</div>
    <input value={val} onChange={e => set(e.target.value)} type="number" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', fontFamily: V.mono }} />
  </div>
);
const resBlock = (text: string, color = ACCENT) => (
  <div style={{ marginTop: 10, padding: '10px 14px', background: V.surf, borderRadius: 8, fontSize: 11, color, fontFamily: V.mono, lineHeight: 1.8, whiteSpace: 'pre' }}>{text}</div>
);
const calcBtn = (onClick: () => void, label: string) => (
  <button onClick={onClick} style={{ width: '100%', padding: '11px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 8 }}>{label}</button>
);
const pnl = (title: string, children: React.ReactNode) => (
  <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20, flex: 1, minWidth: 300 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14 }}>{title}</div>
    {children}
  </div>
);

// ── FURNACE HEAT BALANCE ──────────────────────────────────────────────────────
function FurnaceHeatBalance() {
  const [fuelFlow, setFuelFlow] = useState('500'); // Nm³/hr
  const [cv, setCv] = useState('35.8');            // MJ/Nm³ (natural gas LHV)
  const [glassOut, setGlassOut] = useState('200'); // t/day pull rate
  const [heatGlass, setHeatGlass] = useState('1350');// kJ/kg specific heat for melting
  const [result, setResult] = useState('');

  const calc = () => {
    const F = parseFloat(fuelFlow); const CV = parseFloat(cv);
    const pull = parseFloat(glassOut); const hg = parseFloat(heatGlass);
    const inputMW = F * CV / 3600;          // MW heat input
    const inputMJday = F * CV * 24;         // MJ/day
    const usefulMJ = pull * 1000 * hg / 1000; // MJ/day useful heat (1000 kg/t → kJ/kg)
    const eff = (usefulMJ / inputMJday) * 100;
    const lossDay = inputMJday - usefulMJ;
    const fuelPerTon = F * 24 / pull;      // Nm³/t glass
    setResult(`Fuel Input Power = ${F} Nm³/hr × ${CV} MJ/Nm³ / 3600 = ${inputMW.toFixed(2)} MW\nFuel Heat Input = ${F} × ${CV} × 24 = ${(inputMJday/1000).toFixed(0)} GJ/day\n\nGlass Pull Rate = ${pull} t/day = ${(pull*1000/24).toFixed(0)} kg/hr\nUseful Heat = ${pull} × 1000 kg/t × ${hg} kJ/kg = ${(usefulMJ/1000).toFixed(0)} GJ/day\n\nFurnace Thermal Efficiency = ${eff.toFixed(1)}%\nHeat Loss = ${(lossDay/1000).toFixed(0)} GJ/day\nSpecific Fuel Consumption = ${fuelPerTon.toFixed(1)} Nm³/t glass\nSpecific Energy = ${(usefulMJ*1000/pull/1000).toFixed(0)} kWh/t`);
  };

  return pnl('Furnace Heat Balance (ISO 8006 · EN 695)', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(fuelFlow, setFuelFlow, 'Fuel Flow', 'Nm³/hr')}
      {inp(cv, setCv, 'Calorific Value (LHV)', 'MJ/Nm³')}
      {inp(glassOut, setGlassOut, 'Glass Pull Rate', 't/day')}
      {inp(heatGlass, setHeatGlass, 'Specific Melting Heat', 'kJ/kg')}
    </div>
    {calcBtn(calc, 'Calculate Heat Balance')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Typical NG LHV ≈ 35.8 MJ/Nm³ · Specific heat for soda-lime glass ≈ 1300–1500 kJ/kg</div>
  </>);
}

// ── COMBUSTION AIR CALCULATOR ─────────────────────────────────────────────────
function CombustionAir() {
  const [fuelNm3, setFuelNm3] = useState('500');
  const [excessAir, setExcessAir] = useState('10');
  const [result, setResult] = useState('');
  const [flue, setFlue] = useState('');

  const calc = () => {
    const F = parseFloat(fuelNm3); const EA = parseFloat(excessAir)/100;
    // Stoichiometric air for natural gas (CH₄ ~95%): ~9.52 Nm³ air / Nm³ fuel
    const stoich_air = 9.52;
    const theorAir = F * stoich_air;
    const actualAir = theorAir * (1 + EA);
    const afr = actualAir / F;
    const o2pct = EA / (1 + EA) * 21;
    setResult(`Stoichiometric Air Requirement = ${F} × ${stoich_air} = ${theorAir.toFixed(0)} Nm³/hr\nExcess Air = ${excessAir}%\nActual Air Flow = ${theorAir.toFixed(0)} × (1 + ${EA.toFixed(2)}) = ${actualAir.toFixed(0)} Nm³/hr\nAir/Fuel Ratio = ${afr.toFixed(2)} Nm³air/Nm³fuel\nO₂ in Flue Gas ≈ ${o2pct.toFixed(2)}%`);
    // Flue gas composition (simplified for CH4)
    const CO2 = F * 1.0;    // 1 vol CO2 per vol CH4
    const H2O = F * 2.0;    // 2 vol H2O per vol CH4
    const N2 = actualAir * 0.79;
    const O2 = actualAir * 0.21 - F * 2.0; // residual O2
    const total = CO2 + H2O + N2 + O2;
    setFlue(`Flue Gas (Wet Basis, Nm³/hr):\nCO₂ = ${CO2.toFixed(0)}  (${(CO2/total*100).toFixed(1)}%)\nH₂O = ${H2O.toFixed(0)}  (${(H2O/total*100).toFixed(1)}%)\nN₂  = ${N2.toFixed(0)} (${(N2/total*100).toFixed(1)}%)\nO₂  = ${O2.toFixed(0)}  (${(O2/total*100).toFixed(1)}%)\nTotal = ${total.toFixed(0)} Nm³/hr`);
  };

  return pnl('Combustion Air & Flue Gas Calculator', <>
    {inp(fuelNm3, setFuelNm3, 'Fuel Flow (Natural Gas)', 'Nm³/hr')}
    {inp(excessAir, setExcessAir, 'Excess Air', '%')}
    {calcBtn(calc, 'Calculate Combustion')}
    {result && resBlock(result)}
    {flue && resBlock(flue, '#059669')}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Based on CH₄ combustion · Stoich. AFR ≈ 9.52 Nm³/Nm³ · EN 746-2</div>
  </>);
}

// ── CULLET RATIO CALCULATOR ───────────────────────────────────────────────────
function CulletRatio() {
  const [culletPct, setCulletPct] = useState('30');
  const [pull, setPull] = useState('200');
  const [fuelBaseline, setFuelBaseline] = useState('500');
  const [result, setResult] = useState('');

  const calc = () => {
    const cp = parseFloat(culletPct)/100;
    const pullT = parseFloat(pull);
    const fb = parseFloat(fuelBaseline);
    // Each 10% cullet saves ~2.5% fuel (typical industry rule)
    const fuelSaving = cp * 25; // % fuel saving
    const actualFuel = fb * (1 - fuelSaving/100);
    const fuelSaved = fb - actualFuel;
    const co2Factor = 2.0; // kg CO2 per Nm³ NG
    const co2Saved = fuelSaved * 24 * co2Factor; // kg/day
    const co2annual = co2Saved * 365 / 1000; // t/year
    const rawMat = pullT * 1000 * (1 - cp); // kg/day virgin batch
    const culletKg = pullT * 1000 * cp;     // kg/day cullet
    setResult(`Glass Pull = ${pullT} t/day\n\nCullet Mix: ${culletPct}% cullet + ${(100-cp*100).toFixed(0)}% virgin batch\nCullet = ${(culletKg).toFixed(0)} kg/day\nVirgin Raw Materials = ${rawMat.toFixed(0)} kg/day\n\nFuel Saving ≈ ${fuelSaving.toFixed(1)}% (≈2.5% per 10% cullet)\nBaseline Fuel = ${fb} Nm³/hr → Actual = ${actualFuel.toFixed(0)} Nm³/hr\nFuel Saved = ${fuelSaved.toFixed(0)} Nm³/hr = ${(fuelSaved*24).toFixed(0)} Nm³/day\n\nCO₂ Reduction ≈ ${(co2Saved/1000).toFixed(2)} t CO₂/day = ${co2annual.toFixed(0)} t CO₂/year`);
  };

  return pnl('Cullet Ratio & Fuel Saving Calculator', <>
    {inp(culletPct, setCulletPct, 'Cullet Percentage in Batch', '%')}
    {inp(pull, setPull, 'Glass Pull Rate', 't/day')}
    {inp(fuelBaseline, setFuelBaseline, 'Baseline Fuel Flow (0% cullet)', 'Nm³/hr')}
    {calcBtn(calc, 'Calculate Cullet Savings')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Rule of thumb: each 10% cullet ≈ 2.5% fuel saving · ICG Cullet Quality Guidelines</div>
  </>);
}

// ── BATCH COMPOSITION ─────────────────────────────────────────────────────────
function BatchComposition() {
  const [silica, setSilica] = useState('72');
  const [sodaAsh, setSodaAsh] = useState('13');
  const [limestone, setLimestone] = useState('10');
  const [dolomite, setDolomite] = useState('3');
  const [cullet, setCullet] = useState('30');
  const [result, setResult] = useState('');

  const calc = () => {
    const S = parseFloat(silica); const Na = parseFloat(sodaAsh);
    const L = parseFloat(limestone); const D = parseFloat(dolomite);
    const total = S + Na + L + D;
    const co2_na = Na * 0.585;  // CO2 released from soda ash (Na2CO3)
    const co2_l  = L * 0.44;   // CO2 from limestone (CaCO3)
    const co2_d  = D * 0.47;   // CO2 from dolomite
    const batchCo2 = co2_na + co2_l + co2_d;
    const ok = Math.abs(total - 100) < 1;
    setResult(`Batch Composition (Oxide Basis):\nSilica (SiO₂)    = ${S.toFixed(1)}%\nSoda Ash (Na₂O)   = ${Na.toFixed(1)}%\nLimestone (CaO)   = ${L.toFixed(1)}%\nDolomite (MgO+CaO)= ${D.toFixed(1)}%\nTotal Raw Material = ${total.toFixed(1)}% ${ok ? '✔ Balanced' : '✘ Check — should sum to 100%'}\n\nCullet Addition   = ${cullet}%\nTotal Batch Weight (per 100 kg glass output):\n  Virgin Batch ≈ ${(100-parseFloat(cullet)/100*100 + batchCo2).toFixed(1)} kg\n\nCO₂ Evolved from Batch:\n  From Na₂CO₃ = ${co2_na.toFixed(1)} kg/100kg\n  From CaCO₃  = ${co2_l.toFixed(1)} kg/100kg\n  From Dolomite= ${co2_d.toFixed(1)} kg/100kg\n  Total CO₂   = ${batchCo2.toFixed(1)} kg/100kg glass`);
  };

  return pnl('Batch Composition Calculator (Soda-Lime Glass)', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(silica, setSilica, 'Silica Sand SiO₂', '%')}
      {inp(sodaAsh, setSodaAsh, 'Soda Ash Na₂CO₃', '%')}
      {inp(limestone, setLimestone, 'Limestone CaCO₃', '%')}
      {inp(dolomite, setDolomite, 'Dolomite', '%')}
    </div>
    {inp(cullet, setCullet, 'Cullet Addition', '%')}
    {calcBtn(calc, 'Verify Batch Composition')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Soda-lime glass target: SiO₂ 70-74%, Na₂O 12-16%, CaO 8-13% · ASTM C162</div>
  </>);
}

// ── ANNEALING LEHR ────────────────────────────────────────────────────────────
function AnnealingLehr() {
  const [thickness, setThickness] = useState('6');      // mm
  const [glassSpeed, setGlassSpeed] = useState('120'); // m/hr
  const [tempIn, setTempIn] = useState('560');          // °C (annealing point ~550-560°C)
  const [tempOut, setTempOut] = useState('60');          // °C
  const [result, setResult] = useState('');

  const calc = () => {
    const t = parseFloat(thickness); const spd = parseFloat(glassSpeed);
    const Ti = parseFloat(tempIn); const To = parseFloat(tempOut);
    // Cooling time ≈ thickness² × constant (from glass engineering)
    const coolingTime = (t * t * 3) / 60; // approximate, hours
    const lehrLength = spd * coolingTime;
    const coolingRate = (Ti - To) / (lehrLength / spd * 60); // °C/min
    setResult(`Glass Thickness = ${t} mm\nLehr Entry Temperature = ${Ti} °C (≈ Annealing Point)\nLehr Exit Temperature  = ${To} °C\n\nApproximate Cooling Time = t² × 3 = ${t}² × 3 = ${(coolingTime*60).toFixed(0)} min\nLehr Speed = ${spd} m/hr → Transit Time = ${(coolingTime*60).toFixed(0)} min\nEstimated Lehr Length = ${spd} × ${coolingTime.toFixed(2)} hr = ${lehrLength.toFixed(0)} m\n\nCooling Rate ≈ ${coolingRate.toFixed(1)} °C/min\nTypical Max Stress-Free Rate: ${(3/t).toFixed(1)} °C/min for ${t}mm glass\n\nNotes:\n• Annealing Point (soda-lime) ≈ 550–560°C\n• Strain Point ≈ 510–520°C\n• Rapid cooling below strain point → residual stress`);
  };

  return pnl('Annealing Lehr Calculator', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(thickness, setThickness, 'Glass Thickness', 'mm')}
      {inp(glassSpeed, setGlassSpeed, 'Lehr Speed', 'm/hr')}
      {inp(tempIn, setTempIn, 'Lehr Entry Temp', '°C')}
      {inp(tempOut, setTempOut, 'Lehr Exit Temp', '°C')}
    </div>
    {calcBtn(calc, 'Calculate Lehr Parameters')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Based on glass engineering fundamentals · Actual lehr profile from OEM · ASTM C336</div>
  </>);
}

// ── TIN BATH ──────────────────────────────────────────────────────────────────
function TinBath() {
  const [h2Pct, setH2Pct] = useState('8');        // % H2 in N2/H2 atmosphere
  const [tinTemp, setTinTemp] = useState('1050');  // °C entry
  const [tinTempExit, setTinTempExit] = useState('600'); // °C exit
  const [o2ppm, setO2ppm] = useState('5');          // target ppm O2
  const [result, setResult] = useState('');

  const calc = () => {
    const h2 = parseFloat(h2Pct); const Ti = parseFloat(tinTemp);
    const To = parseFloat(tinTempExit); const o2 = parseFloat(o2ppm);
    const n2 = 100 - h2;
    const flammability_lower = 4.0; const flammability_upper = 75.0;
    const safeH2 = h2 < flammability_lower ? 'Below LEL — non-flammable' : h2 < flammability_upper ? `⚠ Between LEL (${flammability_lower}%) & UEL (${flammability_upper}%) — EXPLOSIVE` : 'Above UEL — too rich, non-flammable';
    const reducing = h2 >= 3 ? '✔ Sufficient reducing atmosphere' : '✘ Insufficient H₂ — tin oxidation risk';
    setResult(`Tin Bath Atmosphere Analysis\n\nH₂ = ${h2}%,  N₂ = ${n2.toFixed(1)}%\nH₂ Flammability: ${safeH2}\nReducing Power: ${reducing}\n\nTarget O₂ < 5 ppm. Actual = ${o2} ppm ${o2 < 5 ? '✔ OK' : '✘ Too HIGH — SnO formation risk'}\n\nTemperature Profile:\n  Entry (pour end) = ${Ti}°C  — glass enters at ≈600°C, tin bath melts glass flat\n  Exit (lehr end)  = ${To}°C\n  ΔT across bath   = ${(Ti-To).toFixed(0)}°C\n\nTin Quality Notes:\n• Sn purity ≥ 99.9% required\n• SnO₂ forms if O₂ > 10 ppm at high temp\n• H₂S atmosphere used in sulfur top-surface baths\n• IEC 60079 precautions apply for H₂ handling`);
  };

  return pnl('Tin Bath Atmosphere Calculator (Float Glass)', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(h2Pct, setH2Pct, 'Hydrogen H₂ in Atmosphere', '%')}
      {inp(o2ppm, setO2ppm, 'Measured O₂', 'ppm')}
      {inp(tinTemp, setTinTemp, 'Bath Entry Temperature', '°C')}
      {inp(tinTempExit, setTinTempExit, 'Bath Exit Temperature', '°C')}
    </div>
    {calcBtn(calc, 'Analyse Tin Bath')}
    {result && resBlock(result, o2ppm > '5' ? '#DC2626' : ACCENT)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>LEL H₂ = 4% · UEL H₂ = 75% · NFPA 2 · PPG/Pilkington float process standard</div>
  </>);
}

// ── NATURAL GAS CONSUMPTION ────────────────────────────────────────────────────
function NGasConsumption() {
  const [flow, setFlow] = useState('500');   // Nm³/hr
  const [cv, setCv] = useState('35.8');      // MJ/Nm³
  const [price, setPrice] = useState('0.8'); // USD/Nm³
  const [result, setResult] = useState('');

  const calc = () => {
    const F = parseFloat(flow); const CV = parseFloat(cv); const P = parseFloat(price);
    const daily = F * 24;
    const monthly = daily * 30;
    const annual = daily * 365;
    const energyDay = daily * CV / 1000;      // GJ/day
    const costDay = daily * P;
    const costMonth = monthly * P;
    const costAnnual = annual * P;
    setResult(`Natural Gas Consumption\n\nFlow = ${F} Nm³/hr\nCalorific Value (LHV) = ${CV} MJ/Nm³\n\nHourly Consumption  = ${F.toFixed(0)} Nm³/hr\nDaily Consumption   = ${daily.toFixed(0)} Nm³/day\nMonthly Consumption = ${(monthly/1000).toFixed(0)} kNm³/month\nAnnual Consumption  = ${(annual/1000).toFixed(0)} kNm³/year\n\nEnergy (Thermal):\n  Hourly  = ${(F*CV/3600).toFixed(2)} MW = ${(F*CV/1000).toFixed(2)} GJ/hr\n  Daily   = ${energyDay.toFixed(1)} GJ/day\n  Annual  = ${(energyDay*365/1000).toFixed(1)} TJ/year\n\nCost Analysis (@ ${P} USD/Nm³):\n  Daily   = USD ${costDay.toFixed(0)}\n  Monthly = USD ${costMonth.toFixed(0)}\n  Annual  = USD ${costAnnual.toFixed(0)}`);
  };

  return pnl('Natural Gas Consumption & Cost', <>
    {inp(flow, setFlow, 'Gas Flow Rate', 'Nm³/hr')}
    {inp(cv, setCv, 'Calorific Value LHV', 'MJ/Nm³')}
    {inp(price, setPrice, 'Gas Price', 'USD/Nm³')}
    {calcBtn(calc, 'Calculate Consumption & Cost')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>NG LHV typical: 35–38 MJ/Nm³ · ISO 6976 for calorific value</div>
  </>);
}

// ── MOTOR LOAD CALCULATOR ─────────────────────────────────────────────────────
function MotorLoad() {
  const [current, setCurrent] = useState('45');
  const [voltage, setVoltage] = useState('415');
  const [pf, setPf] = useState('0.85');
  const [eff, setEff] = useState('0.92');
  const [ratedKW, setRatedKW] = useState('30');
  const [result, setResult] = useState('');

  const calc = () => {
    const I = parseFloat(current); const V2 = parseFloat(voltage);
    const pf2 = parseFloat(pf); const eta = parseFloat(eff);
    const kw_rated = parseFloat(ratedKW);
    const kVA = Math.sqrt(3) * V2 * I / 1000;
    const kW = kVA * pf2;
    const kWin = kW / eta;
    const loadPct = kW / kw_rated * 100;
    const kVAR = Math.sqrt(kVA*kVA - kW*kW);
    setResult(`Motor Load Analysis\n\nMeasured Current = ${I} A @ ${V2} V (3-phase)\n\nApparent Power S = √3 × V × I = ${kVA.toFixed(2)} kVA\nActive Power P   = S × PF = ${kW.toFixed(2)} kW\nReactive Power Q = √(S²-P²) = ${kVAR.toFixed(2)} kVAR\nPower Factor = ${pf2}\nMotor Efficiency = ${(eta*100).toFixed(0)}%\n\nInput Power  = P / η = ${kWin.toFixed(2)} kW\nLoad % = ${kW.toFixed(2)} / ${kw_rated} × 100 = ${loadPct.toFixed(1)}%\n${loadPct > 100 ? '✘ OVERLOADED' : loadPct > 90 ? '⚠ Near full load' : loadPct < 40 ? '⚠ Underloaded (<40% — efficiency drops)' : '✔ Normal load range'}`);
  };

  return pnl('Motor Load Calculator (Glass Plant Equipment)', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(current, setCurrent, 'Measured Current', 'A')}
      {inp(voltage, setVoltage, 'Supply Voltage (L-L)', 'V')}
      {inp(pf, setPf, 'Power Factor', '')}
      {inp(eff, setEff, 'Motor Efficiency', '')}
    </div>
    {inp(ratedKW, setRatedKW, 'Motor Rated Output', 'kW')}
    {calcBtn(calc, 'Calculate Motor Load')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>IEC 60034-30 · Motors &lt;40% load: consider IE3/IE4 replacement</div>
  </>);
}

// ── GLASS THICKNESS CALCULATOR ────────────────────────────────────────────────
function GlassThickness() {
  const [width, setWidth] = useState('3.21');   // m
  const [thk, setThk] = useState('6');          // mm
  const [spd, setSpd] = useState('120');        // m/hr
  const [rho, setRho] = useState('2500');       // kg/m³ soda-lime glass density
  const [result, setResult] = useState('');

  const calc = () => {
    const W = parseFloat(width); const T = parseFloat(thk)/1000; // m
    const S = parseFloat(spd); const D = parseFloat(rho);
    const areaHr = W * S;          // m²/hr
    const volHr = areaHr * T;      // m³/hr
    const massHr = volHr * D;      // kg/hr
    const massDay = massHr * 24;   // kg/day
    const massT = massDay / 1000;  // t/day
    setResult(`Glass Ribbon\n  Width = ${W} m\n  Thickness = ${thk} mm = ${T} m\n  Line Speed = ${S} m/hr\n\nProduction Rate:\n  Area    = ${W} × ${S} = ${areaHr.toFixed(1)} m²/hr\n  Volume  = ${areaHr.toFixed(1)} × ${T} = ${volHr.toFixed(4)} m³/hr\n  Mass    = ${volHr.toFixed(4)} × ${D} = ${massHr.toFixed(0)} kg/hr\n  Daily   = ${massDay.toFixed(0)} kg/day = ${massT.toFixed(1)} t/day\n\nGlass Density (soda-lime) ≈ 2490–2510 kg/m³`);
  };

  return pnl('Glass Ribbon Production Rate', <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {inp(width, setWidth, 'Ribbon Width', 'm')}
      {inp(thk, setThk, 'Glass Thickness', 'mm')}
      {inp(spd, setSpd, 'Line Speed', 'm/hr')}
      {inp(rho, setRho, 'Glass Density', 'kg/m³')}
    </div>
    {calcBtn(calc, 'Calculate Production Rate')}
    {result && resBlock(result)}
    <div style={{ marginTop: 8, fontSize: 11, color: V.muted }}>Standard float ribbon: 2.5–3.3 m wide · Thickness 1.8–19 mm</div>
  </>);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
type GlassTab = 'furnace' | 'combustion' | 'cullet' | 'batch' | 'lehr' | 'tinbath' | 'gas' | 'motor' | 'glass';
const TABS: { key: GlassTab; label: string }[] = [
  { key: 'furnace',    label: 'Furnace Heat Balance' },
  { key: 'combustion', label: 'Combustion Air' },
  { key: 'cullet',     label: 'Cullet Ratio' },
  { key: 'batch',      label: 'Batch Composition' },
  { key: 'lehr',       label: 'Annealing Lehr' },
  { key: 'tinbath',    label: 'Tin Bath Atmosphere' },
  { key: 'gas',        label: 'Natural Gas Cost' },
  { key: 'motor',      label: 'Motor Load' },
  { key: 'glass',      label: 'Glass Production Rate' },
];

export function ICGlassCalc() {
  const [tab, setTab] = useState<GlassTab>('furnace');

  const handleDownload = () => {
    const rows = TABS.map(t => [t.label, 'Glass Manufacturing', 'Process calculation']);
    const body = `<h2>Glass Manufacturing Process Calculators</h2>${tableHTML(['Calculator','Industry','Type'], rows)}
<h2>Key Glass Process Parameters (Soda-Lime Float Glass)</h2>
<table><thead><tr><th>Parameter</th><th>Typical Range</th><th>Note</th></tr></thead><tbody>
<tr><td class="lbl">Furnace Temperature</td><td class="val">1550–1600°C</td><td class="note">Melt zone, thermocouple type B/S/R</td></tr>
<tr><td class="lbl">Pull Rate</td><td class="val">100–600 t/day</td><td class="note">Depends on furnace size</td></tr>
<tr><td class="lbl">Specific Energy</td><td class="val">4–6 GJ/t glass</td><td class="note">Regenerative furnace</td></tr>
<tr><td class="lbl">Cullet %</td><td class="val">20–50%</td><td class="note">Higher cullet = lower energy</td></tr>
<tr><td class="lbl">Excess Air</td><td class="val">5–15%</td><td class="note">O₂ in flue ≈ 1–3%</td></tr>
<tr><td class="lbl">Annealing Point</td><td class="val">550–560°C</td><td class="note">ASTM C336</td></tr>
<tr><td class="lbl">Tin Bath Temp</td><td class="val">600–1050°C</td><td class="note">Entry to exit</td></tr>
<tr><td class="lbl">H₂ in N₂ atmosphere</td><td class="val">3–15%</td><td class="note">Reducing atmosphere, tin bath</td></tr>
</tbody></table>`;
    downloadReport('Glass Manufacturing Process Calculators','Furnace · Combustion · Cullet · Batch · Lehr · Tin Bath · Gas · Motor','EN 695 · EN 746-2 · ASTM C336 · ICG · ISO 6976 · IEC 60034', body, 'IC-Glass-Process-Calcs.pdf');
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Flame} title="GLASS MANUFACTURING PROCESS CALCULATORS" subtitle="Furnace · Combustion · Cullet · Batch · Tin Bath · Lehr · EN 695 · ISO 6976" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Reference
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', background: V.surf, borderRadius: 10, padding: 6, border: `1px solid ${V.brdM}` }}>
        {TABS.map(t => {
          const isActive = t.key === tab;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 12px', borderRadius: 7, background: isActive ? ACCENT : 'transparent', color: isActive ? '#fff' : V.sec, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 500, transition: 'all 0.15s' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {tab === 'furnace'    && <FurnaceHeatBalance />}
        {tab === 'combustion' && <CombustionAir />}
        {tab === 'cullet'     && <CulletRatio />}
        {tab === 'batch'      && <BatchComposition />}
        {tab === 'lehr'       && <AnnealingLehr />}
        {tab === 'tinbath'    && <TinBath />}
        {tab === 'gas'        && <NGasConsumption />}
        {tab === 'motor'      && <MotorLoad />}
        {tab === 'glass'      && <GlassThickness />}
      </div>
    </div>
  );
}
