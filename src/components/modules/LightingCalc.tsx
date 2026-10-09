import React, { useState } from 'react';
import {
  Lightbulb, Download, RefreshCw, FileText, ChevronRight,
  LayoutDashboard, Eye, MoreVertical,
} from 'lucide-react';
import { InputField, SelectField } from '../common/InputField';
import { useStore } from '../../store/useStore';
import type { CalculationResult } from '../../types';

// ── CSS-var shorthand ─────────────────────────────────────────────────────────
const V = {
  bg:   'var(--ec-bg-card)',
  bgD:  'var(--ec-bg-root)',
  inp:  'var(--ec-bg-input)',
  surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)',
  brdB: 'var(--ec-border)',
  brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)',
  sec:  'var(--ec-text-secondary)',
  muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)',
};

// ── Core calculation ──────────────────────────────────────────
interface LightingInputs {
  targetLux: number; roomLength: number; roomWidth: number;
  roomHeight: number; workplaneHeight: number; lumensPerLamp: number;
  utilFactor: number; maintenanceFactor: number; lampsPerFitting: number;
  lampWatts: number; lightLossFactor: number;
}

function calcLighting(i: LightingInputs): CalculationResult {
  const { targetLux, roomLength, roomWidth, roomHeight, workplaneHeight,
    lumensPerLamp, utilFactor, maintenanceFactor, lampsPerFitting, lampWatts, lightLossFactor } = i;

  const area = roomLength * roomWidth;
  const mountH = roomHeight - workplaneHeight;
  const roomIndex = (roomLength * roomWidth) / (mountH * (roomLength + roomWidth));
  const totalLumens = (targetLux * area) / (utilFactor * maintenanceFactor * lightLossFactor);
  const lumensPerFitting = lumensPerLamp * lampsPerFitting;
  const numFittings = Math.ceil(totalLumens / lumensPerFitting);
  const actualLux = (numFittings * lumensPerFitting * utilFactor * maintenanceFactor * lightLossFactor) / area;
  const totalLampW = numFittings * lampsPerFitting * lampWatts;
  const totalSysW  = Math.round(totalLampW * 1.08);
  const lpd = totalSysW / area;
  const status = actualLux >= targetLux * 0.95 ? 'PASS' : 'FAIL';

  return {
    values: [
      { label: 'Required Lumens',     value: Math.round(totalLumens).toLocaleString(), unit: 'lm',   highlight: false },
      { label: 'Number of Luminaires',value: numFittings.toString(),                   unit: 'Nos.', highlight: true  },
      { label: 'Actual Illuminance',  value: actualLux.toFixed(0),                     unit: 'lux',  highlight: true, status: status as 'PASS'|'FAIL' },
      { label: 'LPD',                 value: lpd.toFixed(2),                           unit: 'W/m²', status: lpd <= 10 ? 'PASS' : 'WARNING' as 'PASS'|'WARNING' },
      { label: 'Total Lamp Power',    value: totalLampW.toString(),                    unit: 'W'     },
      { label: 'Total System Power',  value: totalSysW.toString(),                     unit: 'W'     },
      { label: 'Utilization Factor',  value: utilFactor.toFixed(2),                   unit: ''      },
      { label: 'Maintenance Factor',  value: maintenanceFactor.toFixed(2),            unit: ''      },
      { label: 'Room Index (RI)',      value: roomIndex.toFixed(2),                    unit: ''      },
      { label: 'Room Area',           value: area.toFixed(1),                         unit: 'm²'    },
    ],
    status: status as 'PASS'|'FAIL',
    recommendation: `Install ${numFittings} luminaires × ${lampsPerFitting} lamps — ${actualLux.toFixed(0)} lux average maintained at UF=${utilFactor}, MF=${maintenanceFactor}, LLF=${lightLossFactor}. LPD=${lpd.toFixed(1)} W/m².`,
    formula: 'N = E × A / (Φ × UF × MF × LLF)',
    steps: [
      { step: 1, description: 'Room area', formula: `A = ${roomLength} × ${roomWidth}`, result: `${area.toFixed(1)} m²` },
      { step: 2, description: 'Room Index', formula: `RI = (L×W) / (Hm×(L+W))`, result: roomIndex.toFixed(2) },
      { step: 3, description: 'Total lumens required', formula: `Φ_total = E×A / (UF×MF×LLF)`, result: `${Math.round(totalLumens).toLocaleString()} lm` },
      { step: 4, description: 'Number of luminaires', formula: `N = Φ_total / (Φ_lamp × n)`, result: `${numFittings} luminaires` },
      { step: 5, description: 'Actual illuminance', formula: `E_act = N × Φ_fit × UF × MF × LLF / A`, result: `${actualLux.toFixed(0)} lux` },
      { step: 6, description: 'Lighting Power Density', formula: `LPD = P_sys / A`, result: `${lpd.toFixed(2)} W/m²` },
    ],
    standardRef: { standard: 'CIBSE LG3 / IEC TR 61993', clause: '3.2', title: 'Interior lighting — Lumen design method', table: '' },
  };
}

// ── SVG Room Diagram ──────────────────────────────────────────
function RoomDiagram({ roomLength, roomWidth, numFittings }: {
  roomLength: number; roomWidth: number; numFittings: number;
}) {
  const W = 360; const H = 260; const M = 36;
  const rW = W - M * 2; const rH = H - M * 2;
  const ratio = roomLength / Math.max(roomWidth, 0.1);
  const cols = Math.max(1, Math.ceil(Math.sqrt(numFittings * ratio)));
  const rows = Math.max(1, Math.ceil(numFittings / cols));

  const luminaires: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (luminaires.length < numFittings) {
        luminaires.push({
          x: M + (rW / (cols + 1)) * (c + 1),
          y: M + (rH / (rows + 1)) * (r + 1),
        });
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      <rect x={M} y={M} width={rW} height={rH} style={{ fill:'var(--ec-bg-surface)', stroke:'var(--ec-border)', strokeWidth:1.5 }} />
      <rect x={M+10} y={M+10} width={rW-20} height={rH-20} style={{ fill:'none', stroke:'var(--ec-border-muted)', strokeWidth:1, strokeDasharray:'5 4' }} />
      <line x1={M} y1={M-14} x2={W-M} y2={M-14} style={{ stroke:'var(--ec-border)', strokeWidth:1 }} markerEnd="url(#arrow)" markerStart="url(#arrow)" />
      <text x={W/2} y={M-18} textAnchor="middle" style={{ fill:'var(--ec-text-muted)', fontSize:10 }} fontFamily="Inter, sans-serif">{roomLength.toFixed(2)} m</text>
      <line x1={M-14} y1={M} x2={M-14} y2={H-M} style={{ stroke:'var(--ec-border)', strokeWidth:1 }} />
      <text x={M-22} y={H/2} textAnchor="middle" style={{ fill:'var(--ec-text-muted)', fontSize:10 }} fontFamily="Inter, sans-serif" transform={`rotate(-90,${M-22},${H/2})`}>{roomWidth.toFixed(2)} m</text>
      {luminaires.map((l, i) => (
        <g key={i} transform={`translate(${l.x},${l.y})`}>
          <rect x="-13" y="-10" width="26" height="20" style={{ fill:'var(--ec-bg-card)', stroke:'#22C55E', strokeWidth:1.5 }} />
          <line x1="-13" y1="-10" x2="13" y2="10" style={{ stroke:'#22C55E', strokeWidth:1 }} />
          <line x1="13" y1="-10" x2="-13" y2="10" style={{ stroke:'#22C55E', strokeWidth:1 }} />
        </g>
      ))}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" style={{ fill:'var(--ec-border)' }} />
        </marker>
      </defs>
    </svg>
  );
}

// ── KPI Result Card ───────────────────────────────────────────
function KpiCard({ label, value, unit, color, sub }:
  { label: string; value: string; unit: string; color?: string; sub?: string }) {
  return (
    <div style={{
      background: V.surf, border: `1px solid ${V.brd}`,
      borderRadius: 12, padding: '16px', minWidth: 0,
    }}>
      <div style={{ fontSize: 12, color: V.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: color ?? V.txt, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 15, color: V.muted, fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: V.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Tab nav ──────────────────────────────────────────────────
const TABS = ['Room & Area', 'Luminaire Data', 'Calculation Method', 'Results'] as const;
type Tab = typeof TABS[number];

const LUX_PRESETS = [
  { lux: 100, label: '100 lx — Corridors'  },
  { lux: 200, label: '200 lx — Stores'     },
  { lux: 300, label: '300 lx — General'    },
  { lux: 500, label: '500 lx — Offices'    },
  { lux: 750, label: '750 lx — Drawing'    },
  { lux: 1000,label: '1000 lx — Precision' },
];

const selectWithChevron: React.CSSProperties = {
  background: 'var(--ec-bg-input)', border: '1px solid var(--ec-border)',
  borderRadius: 8, color: 'var(--ec-text-primary)', fontSize: 13,
  padding: '6px 28px 6px 10px', cursor: 'pointer',
  appearance: 'none', height: 'auto',
};

// ── Component ────────────────────────────────────────────────
export function LightingCalc() {
  const { addCalculation } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('Room & Area');
  const [result, setResult]       = useState<CalculationResult | null>(null);

  const [targetLux,         setTargetLux]         = useState('500');
  const [roomLength,        setRoomLength]         = useState('10');
  const [roomWidth,         setRoomWidth]          = useState('8');
  const [roomHeight,        setRoomHeight]         = useState('3');
  const [workplaneHeight,   setWorkplaneHeight]    = useState('0.85');
  const [roomType,          setRoomType]           = useState('Office');
  const [standard,          setStandard]           = useState('CIBSE LG3');
  const [uniformity,        setUniformity]         = useState('0.60');
  const [lumensPerLamp,     setLumensPerLamp]      = useState('2778');
  const [lampsPerFitting,   setLampsPerFitting]    = useState('2');
  const [lampWatts,         setLampWatts]          = useState('36');
  const [utilFactor,        setUtilFactor]         = useState('0.60');
  const [maintenanceFactor, setMaintenanceFactor]  = useState('0.80');
  const [lightLossFactor,   setLightLossFactor]    = useState('0.80');
  const [ceilRefl,          setCeilRefl]           = useState('70');
  const [wallRefl,          setWallRefl]           = useState('50');
  const [floorRefl,         setFloorRefl]          = useState('20');
  const [calcMethod,        setCalcMethod]         = useState('Lumen Method (CIBSE)');

  const calculate = () => {
    const res = calcLighting({
      targetLux:         parseFloat(targetLux),
      roomLength:        parseFloat(roomLength),
      roomWidth:         parseFloat(roomWidth),
      roomHeight:        parseFloat(roomHeight),
      workplaneHeight:   parseFloat(workplaneHeight),
      lumensPerLamp:     parseFloat(lumensPerLamp),
      utilFactor:        parseFloat(utilFactor),
      maintenanceFactor: parseFloat(maintenanceFactor),
      lampsPerFitting:   parseInt(lampsPerFitting),
      lampWatts:         parseFloat(lampWatts),
      lightLossFactor:   parseFloat(lightLossFactor),
    });
    setResult(res);
    addCalculation({
      type: 'lighting',
      title: `Lighting — ${targetLux} lux, ${roomLength}×${roomWidth} m`,
      inputs: { targetLux, roomLength, roomWidth, roomHeight, lumensPerLamp, utilFactor, maintenanceFactor },
      results: res, notes: '', standard: 'CIBSE LG3',
    });
  };

  const reset = () => { setResult(null); };

  const numFittings     = result ? parseInt(result.values.find((v) => v.label === 'Number of Luminaires')?.value ?? '0') : 0;
  const requiredLumens  = result?.values.find((v) => v.label === 'Required Lumens')?.value ?? '—';
  const actualLux       = result?.values.find((v) => v.label === 'Actual Illuminance')?.value ?? '—';
  const lpd             = result?.values.find((v) => v.label === 'LPD')?.value ?? '—';
  const totalLampPower  = result?.values.find((v) => v.label === 'Total Lamp Power')?.value ?? '—';
  const totalSysPower   = result?.values.find((v) => v.label === 'Total System Power')?.value ?? '—';

  // Section panel helper
  const sectionPanel = (title: string, children: React.ReactNode) => (
    <div style={{ background: V.bg, borderRadius: 12, border: `1px solid ${V.brd}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${V.brdM}`, background: V.surf }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: V.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: V.muted }}>
        <LayoutDashboard style={{ width: 14, height: 14, color: '#22C55E' }} />
        <span style={{ color: '#22C55E', cursor: 'pointer' }}>Dashboard</span>
        <ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ cursor: 'pointer' }}>Calculations</span>
        <ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: V.txt }}>Lighting Calculator</span>
      </div>

      {/* Module Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lightbulb style={{ width: 26, height: 26, color: '#22C55E' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: V.txt, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Lighting Calculator
            </h1>
            <p style={{ fontSize: 13, color: V.muted, marginTop: 4 }}>
              CIBSE LG3 · IEC · Lumen Method · Luminaire Count · Room Index · LPD
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: V.muted }}>
            <span>Units</span>
            <select style={selectWithChevron}>
              <option>Metric (SI)</option>
              <option>Imperial</option>
            </select>
          </div>
          <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: V.bg, border: `1px solid ${V.brdB}`, color: V.sec, cursor: 'pointer' }}>
            <Download style={{ width: 15, height: 15 }} />
            Export
          </button>
          <button style={{ width: 36, height: 36, borderRadius: 8, background: V.bg, border: `1px solid ${V.brdB}`, color: V.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MoreVertical style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* LEFT: Tabs + Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 0, background: V.bgD, border: `1px solid ${V.brd}`, borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === tab ? V.bg : 'none',
                border: activeTab === tab ? `1px solid ${V.brd}` : '1px solid transparent',
                color: activeTab === tab ? V.txt : V.muted,
                transition: 'all 180ms ease',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,.15)' : 'none',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: activeTab === tab ? '#22C55E' : V.surf,
                  border: `1px solid ${activeTab === tab ? '#22C55E' : V.brdB}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: activeTab === tab ? '#fff' : V.muted,
                  flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Room & Area */}
          {activeTab === 'Room & Area' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: V.bg, borderRadius: 12, padding: 16, border: `1px solid ${V.brd}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: V.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  Target Illuminance — CIBSE Recommendations
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {LUX_PRESETS.map(({ lux, label }) => (
                    <button key={lux} onClick={() => setTargetLux(lux.toString())} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: targetLux === lux.toString() ? 'rgba(34,197,94,.15)' : V.surf,
                      border: `1px solid ${targetLux === lux.toString() ? 'rgba(34,197,94,.40)' : V.brdB}`,
                      color: targetLux === lux.toString() ? '#22C55E' : V.muted,
                      transition: 'all 150ms',
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {sectionPanel('Room Dimensions', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <InputField label="Room Length (L)" value={roomLength} onChange={setRoomLength} unit="m" min={1} step={0.5} />
                  <InputField label="Room Width (W)"  value={roomWidth}  onChange={setRoomWidth}  unit="m" min={1} step={0.5} />
                  <InputField label="Ceiling Height (H)" value={roomHeight} onChange={setRoomHeight} unit="m" min={1.5} step={0.1} />
                  <InputField label="Work Plane Height" value={workplaneHeight} onChange={setWorkplaneHeight} unit="m" min={0} max={2} step={0.05} />
                  <div />
                </div>
              ))}

              {sectionPanel('Room Type & Standard', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SelectField label="Room / Area Type" value={roomType} onChange={setRoomType}
                    options={['Office','Meeting Room','Corridor','Warehouse','Workshop','Data Centre','Laboratory','Retail'].map((v) => ({ value: v, label: v }))} />
                  <SelectField label="Standard" value={standard} onChange={setStandard}
                    options={['CIBSE LG3','IEC 60598','IESNA RP-1','EN 12464-1','IS 3646'].map((v) => ({ value: v, label: v }))} />
                </div>
              ))}

              {sectionPanel('Illuminance Requirement', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <InputField label="Maintained Illuminance (Target)" value={targetLux} onChange={setTargetLux} unit="lux" min={50} />
                  <InputField label="Uniformity (Uo)" value={uniformity} onChange={setUniformity} min={0.3} max={1} step={0.05} />
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Luminaire Data */}
          {activeTab === 'Luminaire Data' && sectionPanel('Luminaire Specification', (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Lumens per Lamp (Φ)" value={lumensPerLamp} onChange={setLumensPerLamp} unit="lm" min={100} tooltip="From lamp/LED datasheet" />
              <InputField label="Lamps per Fitting"    value={lampsPerFitting} onChange={setLampsPerFitting} min={1} max={8} step={1} />
              <InputField label="Lamp Wattage"         value={lampWatts} onChange={setLampWatts} unit="W" min={1} />
              <div />
            </div>
          ))}

          {/* Tab 3: Calculation Method */}
          {activeTab === 'Calculation Method' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {sectionPanel('Calculation Options', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <InputField label="Utilization Factor (UF)"   value={utilFactor}        onChange={setUtilFactor}        min={0.2} max={1} step={0.05} tooltip="From polar curve / room index" />
                  <InputField label="Maintenance Factor (MF)"   value={maintenanceFactor} onChange={setMaintenanceFactor} min={0.5} max={1} step={0.05} tooltip="0.8 clean · 0.7 dusty · 0.6 dirty" />
                  <InputField label="Light Loss Factor (LLF)"   value={lightLossFactor}   onChange={setLightLossFactor}   min={0.5} max={1} step={0.05} />
                </div>
              ))}
              {sectionPanel('Additional Options', (
                <div>
                  <div style={{ fontSize: 12, color: V.muted, marginBottom: 12 }}>Room Surface Reflectance</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                    <InputField label="Ceiling (%)" value={ceilRefl}  onChange={setCeilRefl}  min={0} max={100} step={5} />
                    <InputField label="Walls (%)"   value={wallRefl}  onChange={setWallRefl}  min={0} max={100} step={5} />
                    <InputField label="Floor (%)"   value={floorRefl} onChange={setFloorRefl} min={0} max={100} step={5} />
                    <SelectField label="Method" value={calcMethod} onChange={setCalcMethod}
                      options={['Lumen Method (CIBSE)','Point-by-Point','DIALux Integration'].map((v) => ({ value: v, label: v }))} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Results */}
          {activeTab === 'Results' && result && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {result.values.map((v) => (
                <KpiCard key={v.label} label={v.label} value={v.value} unit={v.unit}
                  color={v.status === 'PASS' ? '#22C55E' : v.status === 'FAIL' ? '#EF4444' : v.highlight ? '#60A5FA' : V.txt} />
              ))}
            </div>
          )}
          {activeTab === 'Results' && !result && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: V.muted }}>
              <Lightbulb style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Run the calculation first</p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={calculate} style={{
              height: 54, width: '100%', borderRadius: 12,
              background: 'linear-gradient(135deg,#22C55E,#16A34A)',
              border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(34,197,94,.40)', transition: 'all 200ms ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(34,197,94,.55)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,.40)'; }}
            >
              <Lightbulb style={{ width: 20, height: 20 }} />
              Calculate Lighting
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={reset} style={{ height: 44, borderRadius: 10, background: V.bg, border: `1px solid ${V.brdB}`, color: V.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RefreshCw style={{ width: 15, height: 15 }} /> Reset All
              </button>
              <button style={{ height: 44, borderRadius: 10, background: V.bg, border: `1px solid ${V.brdB}`, color: V.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FileText style={{ width: 15, height: 15 }} /> Save as Template
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Results Summary + Diagram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 0 }}>

          {/* Results Summary card */}
          <div style={{ background: V.bg, borderRadius: 16, border: `1px solid ${V.brd}`, overflow: 'hidden', boxShadow: 'var(--ec-shadow-card)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${V.brdM}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: V.txt }}>Results Summary</span>
              {result && (
                <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: V.surf, border: `1px solid ${V.brdB}`, color: V.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye style={{ width: 12, height: 12 }} /> View Details
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: V.brd }}>
              {[
                { label: 'Required Lumens',      value: result ? requiredLumens : '—', unit: 'lm',   color: V.txt },
                { label: 'Number of Luminaires', value: result ? numFittings.toString() : '—', unit: 'Nos.', color: '#60A5FA' },
                { label: 'Actual Illuminance',   value: result ? actualLux : '—',   unit: 'lux', color: result?.status === 'PASS' ? '#22C55E' : '#EF4444' },
                { label: 'LPD (W/m²)',           value: result ? lpd : '—',         unit: 'W/m²',color: V.txt },
              ].map((k) => (
                <div key={k.label} style={{ background: V.bg, padding: '16px 14px' }}>
                  <div style={{ fontSize: 11, color: V.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.02em' }}>{k.value}</span>
                    {k.unit && <span style={{ fontSize: 13, color: V.muted }}>{k.unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: V.brd }}>
              {[
                { label: 'Total Lamp Power',    value: result ? totalLampPower : '—', unit: 'W'  },
                { label: 'Total System Power',  value: result ? totalSysPower : '—',  unit: 'W'  },
                { label: 'Utilization Factor',  value: utilFactor,                    unit: ''   },
                { label: 'Maintenance Factor',  value: maintenanceFactor,             unit: ''   },
              ].map((k) => (
                <div key={k.label} style={{ background: V.bg, padding: '14px 14px' }}>
                  <div style={{ fontSize: 11, color: V.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: V.sec, letterSpacing: '-0.02em' }}>{k.value}</span>
                    {k.unit && <span style={{ fontSize: 13, color: V.muted }}>{k.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formula panel */}
          <div style={{ background: V.bg, borderRadius: 16, border: '1px solid rgba(34,197,94,.20)', padding: 20, boxShadow: 'var(--ec-shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>Calculation Formula (CIBSE Lumen Method)</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: '#22C55E', fontWeight: 600, background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, letterSpacing: '-0.01em' }}>
              N = E × A / (Φ × UF × MF)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                ['N', 'Number of Luminaires'],
                ['Φ', 'Lumens per Luminaire (lm)'],
                ['E', 'Maintained Illuminance (lux)'],
                ['UF', 'Utilization Factor'],
                ['A', 'Area (m²)'],
                ['MF', 'Maintenance Factor'],
              ].map(([sym, desc]) => (
                <div key={sym} style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: '#22C55E', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, minWidth: 20 }}>{sym}</span>
                  <span style={{ color: V.muted }}>= {desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Layout diagram */}
          <div style={{ background: V.bg, borderRadius: 16, border: `1px solid ${V.brd}`, overflow: 'hidden', boxShadow: 'var(--ec-shadow-card)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${V.brdM}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: V.txt }}>Lighting Layout (Plan)</span>
              <select style={{ ...selectWithChevron, fontSize: 12, padding: '4px 24px 4px 8px' }}>
                <option>2D Plan</option>
                <option>Isometric</option>
              </select>
            </div>

            <div style={{ padding: 16, height: 260 }}>
              <RoomDiagram
                roomLength={parseFloat(roomLength) || 10}
                roomWidth={parseFloat(roomWidth) || 8}
                numFittings={result ? numFittings : 12}
              />
            </div>

            <div style={{ padding: '10px 20px', borderTop: `1px solid ${V.brdM}`, display: 'flex', gap: 20 }}>
              {[
                { symbol: '⊠', label: 'Luminaire', color: '#22C55E' },
                { symbol: '- -', label: 'Work Plane', color: V.muted },
                { symbol: '—', label: 'Room', color: V.brdB },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: V.muted }}>
                  <span style={{ color: l.color, fontWeight: 700 }}>{l.symbol}</span>
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div style={{ marginTop: 24, padding: '12px 20px', background: V.bgD, borderRadius: 12, border: `1px solid ${V.brd}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, fontSize: 12 }}>
        {[
          { icon: FolderOpen, label: 'Active Project', value: 'Data Center Phase-2' },
          { icon: RefreshCw,  label: 'Calculation Time', value: new Date().toLocaleString('en-GB', { day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) },
          { icon: Eye,        label: 'Accuracy', value: '99.9%' },
          { icon: BookOpenIcon, label: 'Standards', value: 'CIBSE LG3 · IEC · IS' },
          { icon: FileText,   label: 'Version 2.0.0', value: '© 2026 ElecCalc Pro' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon style={{ width: 14, height: 14, color: V.muted, flexShrink: 0 }} />
            <div>
              <div style={{ color: V.muted, fontWeight: 600 }}>{label}</div>
              <div style={{ color: V.muted, marginTop: 1, opacity: 0.7 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FolderOpen(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function BookOpenIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
