import React, { useState } from 'react';
import { Sun, Zap, Battery, TrendingUp, DollarSign } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  ModHeader, InputPanel, StepByStep, WhyMatters, EngineeringNotes,
  CalcButton, TextInput, SelectInput, FieldRow, SectionLabel, KpiCard,
} from '../common/ModuleShared';

const ACCENT = '#D97706';

const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-card-alt)',
  brd: 'var(--ec-border-card)', txt: 'var(--ec-text-primary)',
  sec: 'var(--ec-text-secondary)', muted: 'var(--ec-text-muted)',
};

interface SolarResult {
  systemKwp: number;
  panelCount: number;
  inverterKw: number;
  batteryAh: number;
  batteryKwh: number;
  annualYield: number;
  dailyYield: number;
  pr: number;
  arrayArea: number;
  annualSaving: number;
  co2Saving: number;
  paybackYears: number;
  lcoe: number;
  steps: { step: number; description: string; formula: string; result: string }[];
}

function calcSolarPV(inp: {
  loadKwh: number; peakSunHours: number; systemLosses: number;
  panelWp: number; panelEff: number; inverterEff: number;
  batteryBackupDays: number; batteryDod: number; batteryVoltage: number;
  gridExport: boolean; tariff: number; installCostPerKwp: number;
  systemLifeYears: number; omCostPerKwpYear: number;
}): SolarResult {
  const { loadKwh, peakSunHours, systemLosses, panelWp, panelEff,
    inverterEff, batteryBackupDays, batteryDod, batteryVoltage,
    tariff, installCostPerKwp, systemLifeYears, omCostPerKwpYear } = inp;

  // 1. Required system size (kWp)
  const totalLoss = systemLosses / 100; // fraction
  const pr = 1 - totalLoss; // performance ratio
  const systemKwp = loadKwh / (peakSunHours * pr);

  // 2. Panel count
  const panelKwp = panelWp / 1000;
  const panelCount = Math.ceil(systemKwp / panelKwp);
  const actualKwp = panelCount * panelKwp;

  // 3. Inverter sizing (110% of PV array)
  const inverterKw = Math.ceil(actualKwp * 1.1 * 10) / 10;

  // 4. Battery sizing
  const batteryKwh = (loadKwh * batteryBackupDays) / (batteryDod / 100);
  const batteryAh = (batteryKwh * 1000) / batteryVoltage;

  // 5. Energy yield
  const dailyYield = actualKwp * peakSunHours * pr;
  const annualYield = dailyYield * 365;

  // 6. Array area
  const arrayArea = (actualKwp * 1000) / (panelEff / 100 * 1000); // m²

  // 7. Financial
  const totalInstallCost = actualKwp * installCostPerKwp;
  const annualOmCost = actualKwp * omCostPerKwpYear;
  const annualSaving = annualYield * tariff;
  const annualNetSaving = annualSaving - annualOmCost;
  const paybackYears = annualNetSaving > 0 ? totalInstallCost / annualNetSaving : 0;
  const totalOmCost = annualOmCost * systemLifeYears;
  const lcoe = (totalInstallCost + totalOmCost) / (annualYield * systemLifeYears);

  // 8. CO2 saving (0.82 kg CO2/kWh grid average)
  const co2Saving = annualYield * 0.82 / 1000; // tonnes/year

  const steps = [
    { step: 1, description: 'Performance Ratio (PR)', formula: `PR = 1 − System Losses = 1 − ${systemLosses}% = ${(pr * 100).toFixed(1)}%`, result: `PR = ${pr.toFixed(3)}` },
    { step: 2, description: 'Required System Size', formula: `P_sys = E_load / (PSH × PR) = ${loadKwh} / (${peakSunHours} × ${pr.toFixed(3)})`, result: `${systemKwp.toFixed(2)} kWp` },
    { step: 3, description: 'Number of Panels', formula: `N = P_sys / P_panel = ${systemKwp.toFixed(2)} kWp / ${panelKwp} kWp → round up`, result: `${panelCount} panels (${actualKwp.toFixed(2)} kWp actual)` },
    { step: 4, description: 'Inverter Rating', formula: `P_inv = 110% × P_array = 1.10 × ${actualKwp.toFixed(2)}`, result: `${inverterKw.toFixed(1)} kW` },
    { step: 5, description: 'Battery Energy Required', formula: `E_bat = (E_load × Days) / DoD = (${loadKwh} × ${batteryBackupDays}) / ${batteryDod}%`, result: `${batteryKwh.toFixed(1)} kWh` },
    { step: 6, description: 'Battery Capacity (Ah)', formula: `Ah = (E_bat × 1000) / V_bat = (${batteryKwh.toFixed(1)} × 1000) / ${batteryVoltage}`, result: `${batteryAh.toFixed(0)} Ah` },
    { step: 7, description: 'Daily Energy Yield', formula: `E_day = P_array × PSH × PR = ${actualKwp.toFixed(2)} × ${peakSunHours} × ${pr.toFixed(3)}`, result: `${dailyYield.toFixed(1)} kWh/day` },
    { step: 8, description: 'Annual Energy Yield', formula: `E_year = E_day × 365 = ${dailyYield.toFixed(1)} × 365`, result: `${annualYield.toFixed(0)} kWh/year` },
    { step: 9, description: 'Simple Payback Period', formula: `Payback = Capital Cost / (Annual Saving − O&M) = ${totalInstallCost.toFixed(0)} / ${annualNetSaving.toFixed(0)}`, result: `${paybackYears.toFixed(1)} years` },
    { step: 10, description: 'Levelised Cost of Energy (LCOE)', formula: `LCOE = (CAPEX + OPEX) / Total Yield`, result: `$${lcoe.toFixed(3)}/kWh` },
  ];

  return { systemKwp: actualKwp, panelCount, inverterKw, batteryAh, batteryKwh, annualYield, dailyYield, pr, arrayArea, annualSaving, co2Saving, paybackYears, lcoe, steps };
}

const WHY_ITEMS = [
  { title: 'Peak Sun Hours (PSH)', desc: 'PSH is the equivalent hours of full 1000 W/m² irradiance per day at a location — determines how much energy the array produces. Ranges from 2 (UK) to 7+ (Middle East/Australia).' },
  { title: 'Performance Ratio (PR)', desc: 'PR accounts for all real-world losses: temperature, soiling, shading, wiring, inverter. Good systems achieve PR 0.75–0.85.' },
  { title: 'System kWp vs kW', desc: 'kWp (kilowatt-peak) is rated at STC (1000 W/m², 25°C). Actual output is lower due to temperature and irradiance variation.' },
  { title: 'Inverter Sizing', desc: 'Inverter is typically sized at 100–110% of PV array. DC/AC ratio > 1 (clipping ratio) improves early morning/evening yield.' },
  { title: 'Battery DoD', desc: 'Depth of Discharge: Li-Ion batteries support 80–95% DoD; Lead-acid only 50%. Higher DoD means smaller, cheaper battery for same usable energy.' },
  { title: 'LCOE', desc: 'Levelised Cost of Energy is the true cost of solar electricity over system lifetime — compare with grid tariff to determine viability.' },
];

const NOTES = [
  {
    color: ACCENT, title: 'Solar PV System Sizing — IEC 61724 / IEC 62548',
    body: 'System size (kWp) = Daily energy demand (kWh) ÷ (Peak Sun Hours × Performance Ratio). Performance Ratio typically 0.75–0.85 accounting for: temperature losses (5–10%), soiling (2–5%), shading (0–10%), inverter losses (3–5%), wiring losses (1–3%). IEC 61724 defines monitoring and performance assessment. IEC 62548 covers PV array design requirements.',
  },
  {
    color: '#7C3AED', title: 'Panel Technology — Monocrystalline vs Polycrystalline vs Thin Film',
    body: 'Monocrystalline (Mono-Si): 18–22% efficiency, best performance in low light and high temperature, highest cost. Polycrystalline (Poly-Si): 15–17% efficiency, lower cost, slightly worse high-temperature performance. Thin Film (CdTe/CIGS): 10–13% efficiency, best temperature coefficient, suited for large utility installations. Bifacial panels: 5–20% higher yield by collecting reflected light from rear surface.',
  },
  {
    color: '#059669', title: 'Inverter Types',
    body: 'String inverters: one inverter for a string of panels — simplest, lowest cost. Suitable for unshaded, same-orientation arrays. Microinverters: one per panel — best for shaded/complex roofs, panel-level MPPT, higher cost. Power optimisers + string inverter: panel-level MPPT with string inverter. Hybrid inverters: integrate battery management, grid export control and solar generation in one unit.',
  },
  {
    color: '#1D4ED8', title: 'Battery Storage Sizing',
    body: 'Battery capacity: E_bat = (Daily load × Autonomy days) ÷ DoD. Li-Ion (LFP): 80–95% DoD, 3000–6000 cycles, 10–15 year life. Lead-acid VRLA: 50% DoD, 300–500 cycles, 5–7 year life. Sizing rule: battery should supply critical loads for 1–3 days without solar input. For grid-tied systems, battery primarily used for self-consumption optimisation and peak shaving.',
  },
];

const LOCATION_PSH: Record<string, number> = {
  'India (South)': 5.5, 'India (North)': 5.0, 'Middle East': 6.5,
  'Southeast Asia': 4.5, 'Australia': 5.5, 'UK / North Europe': 2.5,
  'South Europe': 4.5, 'USA (South)': 5.5, 'USA (North)': 4.0,
  'Africa (Sub-Saharan)': 6.0, 'Custom': 0,
};

export function SolarPVCalc() {
  const { addCalculation } = useStore();
  const [loadKwh,            setLoad]     = useState('30');
  const [location,           setLocation] = useState('India (South)');
  const [peakSunHours,       setPSH]      = useState('5.5');
  const [systemLosses,       setLosses]   = useState('20');
  const [panelWp,            setPanelWp]  = useState('550');
  const [panelEff,           setPanelEff] = useState('21');
  const [inverterEff,        setInvEff]   = useState('97');
  const [batteryBackupDays,  setBBD]      = useState('1');
  const [batteryDod,         setBDod]     = useState('80');
  const [batteryVoltage,     setBV]       = useState('48');
  const [tariff,             setTariff]   = useState('0.12');
  const [installCost,        setInstall]  = useState('800');
  const [systemLife,         setLife]     = useState('25');
  const [omCost,             setOM]       = useState('10');
  const [result,             setResult]   = useState<SolarResult | null>(null);

  const handleLocationChange = (loc: string) => {
    setLocation(loc);
    if (loc !== 'Custom') setPSH(String(LOCATION_PSH[loc]));
  };

  const calculate = () => {
    const res = calcSolarPV({
      loadKwh: parseFloat(loadKwh), peakSunHours: parseFloat(peakSunHours),
      systemLosses: parseFloat(systemLosses), panelWp: parseFloat(panelWp),
      panelEff: parseFloat(panelEff), inverterEff: parseFloat(inverterEff),
      batteryBackupDays: parseFloat(batteryBackupDays), batteryDod: parseFloat(batteryDod),
      batteryVoltage: parseFloat(batteryVoltage), gridExport: true,
      tariff: parseFloat(tariff), installCostPerKwp: parseFloat(installCost),
      systemLifeYears: parseFloat(systemLife), omCostPerKwpYear: parseFloat(omCost),
    });
    setResult(res);
    addCalculation({
      type: 'solar-pv',
      title: `Solar PV — ${res.systemKwp.toFixed(1)} kWp, ${panelCount(res)} panels`,
      inputs: { loadKwh, peakSunHours, panelWp, batteryBackupDays },
      results: { values: [], status: 'INFO', recommendation: '', formula: '', steps: [], standardRef: { standard: 'IEC 61724', clause: '1', title: 'Solar PV Performance' } },
      notes: '', standard: 'IEC 61724 / IEC 62548',
    });
  };

  const panelCount = (r: SolarResult) => r.panelCount;

  return (
    <div className="animate-fadeIn" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Sun} title="SOLAR PV SYSTEM CALCULATOR"
        subtitle="IEC 61724 · IEC 62548 · System sizing, yield analysis, battery storage and financial ROI"
        accentColor={ACCENT} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* INPUT PANEL */}
        <InputPanel>
          <SectionLabel title="Energy Demand" />
          <TextInput label="Daily Energy Consumption" value={loadKwh} onChange={setLoad} unit="kWh/day"
            tooltip="Total daily electrical energy consumption of the building/load" />

          <SectionLabel title="Solar Resource" />
          <SelectInput label="Location / Region" value={location} onChange={handleLocationChange}
            options={Object.keys(LOCATION_PSH).map(k => ({ value: k, label: k }))} />
          <TextInput label="Peak Sun Hours (PSH)" value={peakSunHours} onChange={setPSH} unit="hrs/day"
            min={1} max={8} step={0.1} tooltip="Daily equivalent hours of 1000 W/m² irradiance" />
          <TextInput label="System Losses" value={systemLosses} onChange={setLosses} unit="%"
            min={5} max={40} step={1} tooltip="Total losses: temperature + soiling + shading + wiring + inverter (typically 15–25%)" />

          <SectionLabel title="Panel Specification" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Panel Rating" value={panelWp} onChange={setPanelWp} unit="Wp"
              tooltip="Panel rated power at STC (Standard Test Conditions: 1000 W/m², 25°C)" />
            <TextInput label="Panel Efficiency" value={panelEff} onChange={setPanelEff} unit="%"
              min={10} max={25} step={0.5} tooltip="Panel conversion efficiency (mono: 18–22%, poly: 15–17%)" />
          </FieldRow>

          <SectionLabel title="Battery Storage" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Backup Duration" value={batteryBackupDays} onChange={setBBD} unit="days"
              min={0} max={7} step={0.5} tooltip="Number of days battery should supply load without solar input" />
            <TextInput label="Depth of Discharge" value={batteryDod} onChange={setBDod} unit="%"
              min={30} max={95} step={5} tooltip="Li-Ion LFP: 80–95%. Lead-acid VRLA: 50%. Higher DoD = smaller battery" />
          </FieldRow>
          <SelectInput label="Battery Bank Voltage" value={batteryVoltage} onChange={setBV}
            options={[{ value:'12', label:'12V' }, { value:'24', label:'24V' }, { value:'48', label:'48V (Recommended)' }, { value:'96', label:'96V' }]} />

          <SectionLabel title="Financial Analysis" />
          <FieldRow cols="1fr 1fr">
            <TextInput label="Electricity Tariff" value={tariff} onChange={setTariff} unit="$/kWh"
              min={0.01} max={1} step={0.01} tooltip="Current grid electricity cost per kWh" />
            <TextInput label="Install Cost" value={installCost} onChange={setInstall} unit="$/kWp"
              tooltip="Installed cost per kWp (panels + inverter + structure + wiring)" />
          </FieldRow>
          <FieldRow cols="1fr 1fr">
            <TextInput label="System Life" value={systemLife} onChange={setLife} unit="years"
              min={10} max={30} step={1} tooltip="Expected system operating life (typically 25 years)" />
            <TextInput label="O&M Cost" value={omCost} onChange={setOM} unit="$/kWp/yr"
              tooltip="Annual operation and maintenance cost per kWp" />
          </FieldRow>

          <CalcButton onClick={calculate} label="Calculate Solar PV System" icon={Sun} accentColor={ACCENT} />
        </InputPanel>

        {/* RESULT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result ? (
            <>
              {/* System sizing */}
              <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>System Sizing</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <KpiCard label="System Size" value={result.systemKwp.toFixed(2)} unit="kWp" highlight accentColor={ACCENT} />
                  <KpiCard label="Panel Count" value={String(result.panelCount)} unit="panels" accentColor={ACCENT} />
                  <KpiCard label="Inverter Size" value={result.inverterKw.toFixed(1)} unit="kW" accentColor={ACCENT} />
                  <KpiCard label="Array Area" value={result.arrayArea.toFixed(0)} unit="m²" accentColor={ACCENT} />
                </div>
              </div>

              {/* Battery */}
              <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Battery Storage</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <KpiCard label="Battery Energy" value={result.batteryKwh.toFixed(1)} unit="kWh" highlight accentColor="#7C3AED" />
                  <KpiCard label="Battery Capacity" value={result.batteryAh.toFixed(0)} unit="Ah" accentColor="#7C3AED" />
                </div>
              </div>

              {/* Yield */}
              <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Energy Yield</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <KpiCard label="Daily Yield" value={result.dailyYield.toFixed(1)} unit="kWh/day" accentColor="#059669" />
                  <KpiCard label="Annual Yield" value={(result.annualYield / 1000).toFixed(1)} unit="MWh/yr" highlight accentColor="#059669" />
                  <KpiCard label="Perf. Ratio" value={(result.pr * 100).toFixed(1)} unit="%" accentColor="#059669" />
                </div>
              </div>

              {/* Financial */}
              <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Financial Analysis</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <KpiCard label="Annual Saving" value={result.annualSaving.toFixed(0)} unit="$/yr" highlight accentColor="#2563EB" />
                  <KpiCard label="Payback" value={result.paybackYears.toFixed(1)} unit="years" accentColor="#2563EB" />
                  <KpiCard label="LCOE" value={result.lcoe.toFixed(3)} unit="$/kWh" accentColor="#2563EB" />
                </div>
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🌿</span>
                  <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>
                    CO₂ saved: {result.co2Saving.toFixed(1)} tonnes/year — equivalent to planting {Math.round(result.co2Saving * 45)} trees
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, padding: 40, textAlign: 'center', color: V.muted }}>
              <Sun style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>Enter load and location details, then click Calculate to size your solar PV system</div>
            </div>
          )}
        </div>
      </div>

      {result && <StepByStep steps={result.steps} />}
      <WhyMatters items={WHY_ITEMS} />
      <EngineeringNotes notes={NOTES} />
    </div>
  );
}
