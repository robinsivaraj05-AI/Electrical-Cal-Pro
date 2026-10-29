import React, { useState, useMemo, useRef } from 'react';
import { LayoutDashboard, Zap, Cable, Shield, Cpu, Battery, AlertTriangle, FileText, BookOpen, Plus, Trash2, Edit2, Check, X, Download, Upload, Copy, FolderOpen, Save, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────────────

type TransformerConfig = {
  id: string;
  kva: number;
  primaryKV: number;
  secondaryV: number;
  phases: 1 | 3;
  frequency: number;
  impedancePct: number;
  targetPF: number;
  permittedLoadingPct: number;
  ambientTemp: number;
  type: 'oil' | 'dry';
  numTransformers: number;
  config: 'single' | 'parallel' | 'N+1';
  existingLoadKVA: number;
};

type Feeder = {
  id: string;
  feederNo: string;
  dbName: string;
  description: string;
  quantity: number;
  ratedKW: number;
  voltage: number;
  phases: 1 | 3;
  powerFactor: number;
  efficiency: number;
  loadType: 'motor' | 'heater' | 'lighting' | 'HVAC' | 'UPS' | 'socket' | 'VFD' | 'other';
  demandFactor: number;
  diversityFactor: number;
  utilizationFactor: number;
  startingMethod: string;
  startingCurrentMult: number;
  isExisting: boolean;
  cableLength: number;
  conductor: 'Cu' | 'Al';
  insulation: 'PVC' | 'XLPE';
  multicore: boolean;
  armoured: boolean;
  installMethod: string;
  ambientTemp: number;
  groupSize: number;
};

type DistSnapshot = {
  id: string;
  name: string;
  savedAt: string;
  xfmr: TransformerConfig;
  feeders: Feeder[];
};

const DIST_KEY = 'elec-dist-projects';
const loadSnaps = (): DistSnapshot[] => {
  try { return JSON.parse(localStorage.getItem(DIST_KEY) ?? '[]'); } catch { return []; }
};
const saveSnaps = (snaps: DistSnapshot[]) => localStorage.setItem(DIST_KEY, JSON.stringify(snaps));

// ─── Cable Tables ─────────────────────────────────────────────────────────────

const SIZES   = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
const AMP_CU_XLPE = [26, 34, 44, 56, 73, 95, 119, 145, 171, 213, 252, 289, 328, 371, 424, 469];
const AMP_CU_PVC  = [22, 29, 37, 47, 63, 81, 103, 125, 147, 183, 216, 249, 285, 324, 370, 410];
const AMP_AL_XLPE = [20, 26, 33, 43, 56, 73, 91, 111, 131, 162, 193, 221, 250, 282, 323, 358];
const RES_CU = [14.5, 8.7, 5.5, 3.7, 2.24, 1.41, 0.889, 0.641, 0.473, 0.328, 0.236, 0.188, 0.153, 0.123, 0.0965, 0.0775];
const RES_AL = [24.0, 14.4, 9.1, 6.0, 3.71, 2.34, 1.47, 1.06, 0.786, 0.545, 0.391, 0.312, 0.253, 0.204, 0.160, 0.128];
const REACT  = [0.115, 0.110, 0.107, 0.103, 0.101, 0.098, 0.096, 0.093, 0.089, 0.086, 0.083, 0.080, 0.078, 0.076, 0.074, 0.072];

// ─── Calc helpers ─────────────────────────────────────────────────────────────

const xfmrCurrent = (kva: number, voltage: number, phases: 1 | 3) =>
  phases === 3 ? (kva * 1000) / (Math.sqrt(3) * voltage) : (kva * 1000) / voltage;

const faultCurrent = (ratedI: number, zPct: number) => ratedI / (zPct / 100);

const designCurrent = (kw: number, eff: number, pf: number, v: number, ph: 1 | 3, qty: number) => {
  const inputKW = kw / eff;
  const kva = inputKW / pf;
  return ph === 3 ? (kva * 1000 * qty) / (Math.sqrt(3) * v) : (kva * 1000 * qty) / v;
};

const operatingDemand = (kw: number, qty: number, df: number, uf: number) =>
  kw * qty * df * uf;

const tempCorrection = (ambient: number, insul: 'PVC' | 'XLPE') => {
  const maxT = insul === 'XLPE' ? 90 : 70;
  return Math.sqrt((maxT - ambient) / (maxT - 30));
};

const groupFactor = (n: number) => [1.0, 0.80, 0.70, 0.65, 0.60, 0.57][Math.min(n - 1, 5)];

const installMultiplier = (method: string): number =>
  ({ 'Tray': 1.0, 'Conduit': 0.77, 'Underground': 0.85, 'Open Air': 1.22, 'Wall': 0.90 } as Record<string, number>)[method] ?? 1.0;

const selectCableSize = (designI: number, f: Feeder): { sizeIdx: number; derated: number; numRuns: number } => {
  const baseAmps = f.insulation === 'XLPE'
    ? (f.conductor === 'Cu' ? AMP_CU_XLPE : AMP_AL_XLPE)
    : AMP_CU_PVC;
  const ct = tempCorrection(f.ambientTemp, f.insulation);
  const gf = groupFactor(f.groupSize);
  const im = installMultiplier(f.installMethod);
  // Auto-determine runs: how many parallel cables needed if even 300mm² is undersized
  const maxDerated = baseAmps[SIZES.length - 1] * ct * gf * im;
  const numRuns = Math.max(1, Math.ceil(designI / maxDerated));
  const required = designI / numRuns;
  for (let i = 0; i < SIZES.length; i++) {
    const derated = baseAmps[i] * ct * gf * im;
    if (derated >= required) return { sizeIdx: i, derated: derated * numRuns, numRuns };
  }
  return { sizeIdx: SIZES.length - 1, derated: maxDerated * numRuns, numRuns };
};

const voltageDrop = (I: number, L: number, R: number, X: number, pf: number, phases: 1 | 3) => {
  const sinPhi = Math.sqrt(1 - pf * pf);
  return phases === 3
    ? Math.sqrt(3) * I * L * (R * pf + X * sinPhi) / 1000
    : 2 * I * L * (R * pf + X * sinPhi) / 1000;
};

const MCB_SIZES  = [6, 10, 16, 20, 25, 32, 40, 50, 63];
const MCCB_SIZES = [63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600];
const ACB_SIZES  = [1600, 2000, 2500, 3200, 4000, 5000, 6300];

const selectBreaker = (I: number, Iz: number): number => {
  const all = [...MCB_SIZES, ...MCCB_SIZES, ...ACB_SIZES];
  return all.find(r => r >= I && r <= Iz) ?? all.find(r => r >= I) ?? all[all.length - 1];
};

const capacitorKVAr = (kw: number, pf1: number, pf2: number) =>
  kw * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2)));

const earthSize = (I: number, t: number, insul: 'PVC' | 'XLPE') => {
  const k = insul === 'XLPE' ? 143 : 115;
  return (I * Math.sqrt(t)) / k;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultXfmr: TransformerConfig = {
  id: '1', kva: 1000, primaryKV: 11, secondaryV: 400,
  phases: 3, frequency: 50, impedancePct: 6, targetPF: 0.95,
  permittedLoadingPct: 80, ambientTemp: 40, type: 'oil',
  numTransformers: 1, config: 'single', existingLoadKVA: 0,
};

const defaultFeeder = (): Feeder => ({
  id: Date.now().toString(),
  feederNo: '', dbName: '', description: '',
  quantity: 1, ratedKW: 10, voltage: 400, phases: 3,
  powerFactor: 0.85, efficiency: 0.92,
  loadType: 'motor', demandFactor: 0.8, diversityFactor: 1.0, utilizationFactor: 0.85,
  startingMethod: 'DOL', startingCurrentMult: 6, isExisting: false,
  cableLength: 50, conductor: 'Cu', insulation: 'XLPE', multicore: true, armoured: true,
  installMethod: 'Tray', ambientTemp: 40, groupSize: 1,
});

// ─── Styling helpers ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'transformer',  label: 'Transformer',      icon: Zap },
  { id: 'loads',        label: 'Load Entry',       icon: Plus },
  { id: 'cables',       label: 'Cable Sizing',     icon: Cable },
  { id: 'breakers',     label: 'Breaker Selection',icon: Shield },
  { id: 'capacitor',    label: 'Capacitor Bank',   icon: Battery },
  { id: 'shortcircuit', label: 'Short Circuit',    icon: AlertTriangle },
  { id: 'schedule',     label: 'Feeder Schedule',  icon: FileText },
  { id: 'iec',          label: 'IEC Library',      icon: BookOpen },
];

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--ec-bg-surface)',
  border: '1px solid var(--ec-border)',
  borderRadius: 12,
  padding: 20,
  ...extra,
});

const statusColor = (s: string) =>
  s === 'PASS' ? '#22C55E' : s === 'WARNING' ? '#F59E0B' : s === 'FAIL' ? '#EF4444' : '#64748B';

const Badge = ({ status }: { status: string }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: statusColor(status) + '22', color: statusColor(status),
    border: `1px solid ${statusColor(status)}44`,
  }}>{status}</span>
);

// ─── Input helpers ────────────────────────────────────────────────────────────

function FInput({ label, value, onChange, unit, min, max, step, type: inputType = 'number' }: {
  label: string; value: string | number; onChange: (v: string) => void;
  unit?: string; min?: number; max?: number; step?: number; type?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--ec-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)',
            borderRadius: 8, padding: unit ? '8px 36px 8px 10px' : '8px 10px',
            color: 'var(--ec-text-primary)', fontSize: 13, boxSizing: 'border-box',
          }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ec-text-muted)' }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

function FSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--ec-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)',
          borderRadius: 8, padding: '8px 10px', color: 'var(--ec-text-primary)', fontSize: 13,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function CalcBox({ formula, substituted, result }: { formula: string; substituted: string; result: string }) {
  return (
    <div style={{ background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)', borderRadius: 8, padding: 14, marginTop: 8 }}>
      <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 700, marginBottom: 4 }}>FORMULA</div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 4 }}>{formula}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ec-text-primary)', marginBottom: 4 }}>{substituted}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#22C55E', fontWeight: 700 }}>{result}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransformerDistribution() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [xfmr, setXfmr] = useState<TransformerConfig>(defaultXfmr);
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [editFeeder, setEditFeeder] = useState<Feeder | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newFeeder, setNewFeeder] = useState<Feeder>(defaultFeeder());
  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [snapName, setSnapName]         = useState('');
  const [snaps, setSnaps]               = useState<DistSnapshot[]>(loadSnaps);

  // ── Transformer calcs ──
  const ratedCurrent = useMemo(() =>
    xfmrCurrent(xfmr.kva * xfmr.numTransformers, xfmr.secondaryV, xfmr.phases),
    [xfmr]);
  const Isc = useMemo(() => faultCurrent(ratedCurrent, xfmr.impedancePct), [ratedCurrent, xfmr.impedancePct]);

  // ── Per-feeder calcs ──
  const feederCalcs = useMemo(() => feeders.map(f => {
    const Ib = designCurrent(f.ratedKW, f.efficiency, f.powerFactor, f.voltage, f.phases, f.quantity);
    const { sizeIdx, derated, numRuns } = selectCableSize(Ib, f);
    const Iz = derated;
    const In = selectBreaker(Ib, Iz);
    const res_per_km = f.conductor === 'Cu' ? RES_CU[sizeIdx] : RES_AL[sizeIdx];
    const Xc = REACT[sizeIdx];
    // voltage drop per run (each cable carries Ib/numRuns)
    const Vd = voltageDrop(Ib / numRuns, f.cableLength / 1000, res_per_km, Xc, f.powerFactor, f.phases);
    const VdPct = (Vd / f.voltage) * 100;
    const demandKW = operatingDemand(f.ratedKW, f.quantity, f.demandFactor, f.utilizationFactor);
    const demandKVA = demandKW / f.powerFactor;
    const Istart = Ib * f.startingCurrentMult;
    const earthSz = earthSize(Isc, 0.5, f.insulation);
    return { Ib, sizeIdx, Iz, In, Vd, VdPct, demandKW, demandKVA, Istart, earthSz, res_per_km, numRuns };
  }), [feeders, Isc]);

  // ── Dashboard metrics ──
  const metrics = useMemo(() => {
    const totalConnKW = feeders.reduce((a, f) => a + f.ratedKW * f.quantity, 0);
    const totalConnKVA = feeders.reduce((a, f) => a + (f.ratedKW * f.quantity) / f.powerFactor, 0);
    const totalDemandKW = feeders.reduce((a, f) => a + operatingDemand(f.ratedKW, f.quantity, f.demandFactor, f.utilizationFactor), 0);
    const weightedPF = totalDemandKW > 0
      ? feeders.reduce((a, f) => a + operatingDemand(f.ratedKW, f.quantity, f.demandFactor, f.utilizationFactor) * f.powerFactor, 0) / totalDemandKW
      : 0.85;
    const totalDemandKVA = weightedPF > 0 ? totalDemandKW / weightedPF : 0;
    const demandCurrent = xfmrCurrent(totalDemandKVA, xfmr.secondaryV, xfmr.phases);
    const totalCapacity = xfmr.kva * xfmr.numTransformers;
    const loadingPct = totalCapacity > 0 ? ((xfmr.existingLoadKVA + totalDemandKVA) / totalCapacity) * 100 : 0;
    const permittedKVA = totalCapacity * (xfmr.permittedLoadingPct / 100);
    const remainingKVA = permittedKVA - xfmr.existingLoadKVA - totalDemandKVA;
    const totalCableLength = feeders.reduce((a, f) => a + f.cableLength, 0);
    const capKVAr = totalDemandKW > 0 ? capacitorKVAr(totalDemandKW, weightedPF, xfmr.targetPF) : 0;
    let status = 'INCOMPLETE';
    if (feeders.length > 0) {
      if (loadingPct > 100) status = 'FAIL';
      else if (loadingPct > 80) status = 'WARNING';
      else status = 'PASS';
    }
    return {
      totalConnKW, totalConnKVA, totalDemandKW, totalDemandKVA, weightedPF,
      demandCurrent, loadingPct, remainingKVA, totalCableLength, capKVAr,
      status, permittedKVA, totalCapacity,
    };
  }, [feeders, xfmr]);

  // ── Feeder handlers ──
  const nextFeederNo = (list: Feeder[]) => `F${String(list.length + 1).padStart(2, '0')}`;

  const addFeeder = () => {
    setFeeders(prev => {
      const feederNo = newFeeder.feederNo.trim() || nextFeederNo(prev);
      return [...prev, { ...newFeeder, id: Date.now().toString(), feederNo }];
    });
    setNewFeeder(defaultFeeder());
    setIsAdding(false);
  };

  const deleteFeeder = (id: string) => setFeeders(prev => prev.filter(f => f.id !== id));

  const saveEdit = () => {
    if (!editFeeder) return;
    setFeeders(prev => prev.map(f => f.id === editFeeder.id ? editFeeder : f));
    setEditFeeder(null);
  };

  const copyFeeder = (f: Feeder) => {
    setFeeders(prev => {
      const feederNo = nextFeederNo(prev);
      return [...prev, { ...f, id: Date.now().toString(), feederNo }];
    });
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = ['No', 'DB', 'Description', 'Qty', 'kW', 'kVA', 'PF', 'V', 'Ph',
      'Ib (A)', 'Cable mm²', 'Iz (A)', 'In (A)', 'VD (V)', 'VD%', 'Demand kW', 'Status'];
    const rows = feeders.map((f, i) => {
      const c = feederCalcs[i];
      const vdStatus = c.VdPct <= 3 ? 'PASS' : c.VdPct <= 5 ? 'WARNING' : 'FAIL';
      return [f.feederNo, f.dbName, f.description, f.quantity, f.ratedKW,
        (f.ratedKW / f.powerFactor).toFixed(1), f.powerFactor, f.voltage, f.phases,
        c.Ib.toFixed(1), SIZES[c.sizeIdx], c.Iz.toFixed(1), c.In,
        c.Vd.toFixed(2), c.VdPct.toFixed(2), c.demandKW.toFixed(1), vdStatus];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'feeder_schedule.csv';
    a.click();
  };

  // ── Excel Template Download ──
  const downloadTemplate = () => {
    const headers = [
      'Feeder No', 'DB / Panel', 'Description', 'Quantity', 'Rated kW', 'Voltage (V)',
      'Phases (1/3)', 'Power Factor', 'Efficiency', 'Load Type',
      'Demand Factor', 'Diversity Factor', 'Utilization Factor',
      'Starting Method', 'Starting Current Mult', 'Is Existing (yes/no)',
      'Cable Length (m)', 'Conductor (Cu/Al)', 'Insulation (PVC/XLPE)',
      'Multicore (yes/no)', 'Armoured (yes/no)', 'Install Method',
      'Ambient Temp (°C)', 'Group Size',
    ];
    const sample = [
      'F01', 'MDB', 'Air Handling Unit', 1, 22, 400,
      3, 0.85, 0.95, 'motor',
      0.8, 1.0, 0.85,
      'Star-Delta', 6, 'no',
      50, 'Cu', 'XLPE',
      'yes', 'no', 'Tray',
      35, 1,
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feeders');
    XLSX.writeFile(wb, 'feeder_template.xlsx');
  };

  // ── Excel Import ──
  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      if (!data) return;
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const parsed: Feeder[] = rows.map((row) => {
        const str  = (k: string) => String(row[k] ?? '').trim();
        const num  = (k: string, def: number) => { const v = parseFloat(str(k)); return isNaN(v) ? def : v; };
        const bool = (k: string) => /^yes$/i.test(str(k));
        const phases = parseInt(str('Phases (1/3)')) === 1 ? 1 : 3;
        const loadTypeRaw = str('Load Type').toLowerCase();
        const validLoad = ['motor','heater','lighting','HVAC','UPS','socket','VFD','other'];
        const loadType = (validLoad.includes(loadTypeRaw) ? loadTypeRaw : 'other') as Feeder['loadType'];
        const conductorRaw = str('Conductor (Cu/Al)').toUpperCase();
        const conductor: 'Cu' | 'Al' = conductorRaw === 'Al' ? 'Al' : 'Cu';
        const insulationRaw = str('Insulation (PVC/XLPE)').toUpperCase();
        const insulation: 'PVC' | 'XLPE' = insulationRaw === 'PVC' ? 'PVC' : 'XLPE';
        return {
          id: crypto.randomUUID(),
          feederNo:           str('Feeder No'),
          dbName:             str('DB / Panel'),
          description:        str('Description'),
          quantity:           num('Quantity', 1),
          ratedKW:            num('Rated kW', 1),
          voltage:            num('Voltage (V)', 400),
          phases,
          powerFactor:        Math.min(1, Math.max(0.5, num('Power Factor', 0.85))),
          efficiency:         Math.min(1, Math.max(0.5, num('Efficiency', 0.95))),
          loadType,
          demandFactor:       Math.min(1, Math.max(0.1, num('Demand Factor', 0.8))),
          diversityFactor:    Math.min(1, Math.max(0.1, num('Diversity Factor', 1.0))),
          utilizationFactor:  Math.min(1, Math.max(0.1, num('Utilization Factor', 0.85))),
          startingMethod:     str('Starting Method') || 'Direct-on-line',
          startingCurrentMult: num('Starting Current Mult', 6),
          isExisting:         bool('Is Existing (yes/no)'),
          cableLength:        Math.max(1, num('Cable Length (m)', 10)),
          conductor,
          insulation,
          multicore:          bool('Multicore (yes/no)'),
          armoured:           bool('Armoured (yes/no)'),
          installMethod:      str('Install Method') || 'Tray',
          ambientTemp:        num('Ambient Temp (°C)', 35),
          groupSize:          Math.max(1, num('Group Size', 1)),
        };
      });
      if (parsed.length > 0) {
        setFeeders(prev => [...prev, ...parsed]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // ── Project save / load ──
  const saveProject = () => {
    const name = snapName.trim() || `Design ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;
    const snap: DistSnapshot = { id: crypto.randomUUID(), name, savedAt: new Date().toISOString(), xfmr, feeders };
    const updated = [snap, ...snaps];
    setSnaps(updated);
    saveSnaps(updated);
    setSnapName('');
  };

  const loadProject = (snap: DistSnapshot) => {
    setXfmr(snap.xfmr);
    setFeeders(snap.feeders);
    setShowProjects(false);
    setActiveTab('dashboard');
  };

  const deleteSnap = (id: string) => {
    const updated = snaps.filter(s => s.id !== id);
    setSnaps(updated);
    saveSnaps(updated);
  };

  const updateProject = (id: string) => {
    const updated = snaps.map(s =>
      s.id === id ? { ...s, xfmr, feeders, savedAt: new Date().toISOString() } : s
    );
    setSnaps(updated);
    saveSnaps(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 1400, margin: '0 auto' }}>

      {/* Project Manager Panel (slide-in from right) */}
      {showProjects && (
        <>
          {/* backdrop */}
          <div onClick={() => setShowProjects(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, width: 400, height: '100vh', background: 'var(--ec-bg-card)', zIndex: 1000, boxShadow: '-8px 0 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Panel header */}
            <div style={{ padding: '20px 20px 16px', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FolderOpen style={{ width: 20, height: 20, color: '#fff' }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Distribution Design Projects</span>
                </div>
                <button onClick={() => setShowProjects(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '4px 8px' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
                {snaps.length} saved {snaps.length === 1 ? 'project' : 'projects'}
              </div>
            </div>

            {/* Save current design */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ec-border)', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Save Current Design</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={snapName}
                  onChange={e => setSnapName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveProject()}
                  placeholder={`e.g. Block-A MDB, ${new Date().getFullYear()}`}
                  style={{ flex: 1, background: 'var(--ec-bg-input)', border: '1px solid var(--ec-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--ec-text-primary)', fontSize: 12 }}
                />
                <button onClick={saveProject} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Save style={{ width: 13, height: 13 }} /> Save
                </button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ec-text-muted)', marginTop: 6 }}>
                Saves: transformer config ({xfmr.kva} kVA) + {feeders.length} feeder{feeders.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Project list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {snaps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ec-text-muted)', fontSize: 13 }}>
                  <FolderOpen style={{ width: 36, height: 36, marginBottom: 12, opacity: 0.4 }} />
                  <div>No saved projects yet.</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Enter a name above and click Save.</div>
                </div>
              ) : snaps.map(snap => (
                <div key={snap.id} style={{ background: 'var(--ec-bg-surface)', border: '1px solid var(--ec-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snap.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ec-text-muted)', marginTop: 4 }}>
                        Saved {new Date(snap.savedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 10, background: '#4F46E522', color: '#818CF8', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{snap.xfmr.kva} kVA</span>
                        <span style={{ fontSize: 10, background: '#22C55E22', color: '#22C55E', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{snap.feeders.length} Feeders</span>
                        <span style={{ fontSize: 10, background: '#3B82F622', color: '#3B82F6', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{snap.xfmr.secondaryV} V</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => loadProject(snap)} title="Load this project into the workspace" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <RefreshCw style={{ width: 11, height: 11 }} /> Load
                      </button>
                      <button onClick={() => updateProject(snap.id)} title="Overwrite this project with the current design" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#F59E0B22', color: '#D97706', border: '1px solid #F59E0B55', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <Save style={{ width: 11, height: 11 }} /> Update
                      </button>
                      <button onClick={() => deleteSnap(snap.id)} title="Delete this project permanently" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#EF444422', color: '#EF4444', border: '1px solid #EF444433', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <Trash2 style={{ width: 11, height: 11 }} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ ...card(), marginBottom: 24, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', border: 'none', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LayoutDashboard style={{ width: 26, height: 26, color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>ELECTRICAL DISTRIBUTION DESIGN</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
            IEC 60076 · IEC 60364-5-52 · IEC 60364-4-43 · Transformer loading, cable sizing, breaker selection & PF correction
          </div>
        </div>
        <button
          onClick={() => setShowProjects(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, backdropFilter: 'blur(4px)' }}
        >
          <FolderOpen style={{ width: 15, height: 15 }} />
          Projects {snaps.length > 0 && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{snaps.length}</span>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: active ? '#3B82F6' : 'var(--ec-bg-surface)',
                color: active ? '#fff' : 'var(--ec-text-muted)',
                boxShadow: active ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: DASHBOARD ─────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Status banner */}
          <div style={{ ...card({ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${statusColor(metrics.status)}` }) }}>
            <Badge status={metrics.status} />
            <span style={{ fontSize: 13, color: 'var(--ec-text-primary)', fontWeight: 600 }}>
              {metrics.status === 'INCOMPLETE' && 'No feeders added — enter transformer parameters and add feeders to begin.'}
              {metrics.status === 'PASS' && `System loading ${metrics.loadingPct.toFixed(1)}% — within permitted limit of ${xfmr.permittedLoadingPct}%.`}
              {metrics.status === 'WARNING' && `System loading ${metrics.loadingPct.toFixed(1)}% — exceeds 80% threshold. Review load growth margin.`}
              {metrics.status === 'FAIL' && `System loading ${metrics.loadingPct.toFixed(1)}% — OVERLOADED. Increase transformer capacity or shed load.`}
            </span>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Transformer Rated Current', value: ratedCurrent.toFixed(1), unit: 'A', sub: `${xfmr.kva} kVA × ${xfmr.numTransformers}, ${xfmr.secondaryV} V` },
              { label: 'Total Connected Load', value: metrics.totalConnKW.toFixed(1), unit: 'kW', sub: `${metrics.totalConnKVA.toFixed(1)} kVA connected` },
              { label: 'Total Demand', value: metrics.totalDemandKVA.toFixed(1), unit: 'kVA', sub: `${metrics.totalDemandKW.toFixed(1)} kW at PF ${metrics.weightedPF.toFixed(3)}` },
              { label: 'Demand Current', value: metrics.demandCurrent.toFixed(1), unit: 'A', sub: `At ${xfmr.secondaryV} V, 3-phase` },
              { label: 'Transformer Loading', value: metrics.loadingPct.toFixed(1), unit: '%', sub: `Permitted: ${xfmr.permittedLoadingPct}%`, highlight: metrics.loadingPct > xfmr.permittedLoadingPct },
              { label: 'Remaining Capacity', value: metrics.remainingKVA.toFixed(1), unit: 'kVA', sub: `Permitted: ${metrics.permittedKVA.toFixed(0)} kVA`, highlight: metrics.remainingKVA < 0 },
              { label: 'Fault Current (Isc)', value: Isc.toFixed(0), unit: 'A', sub: `At ${xfmr.impedancePct}% impedance` },
              { label: 'Total Cable Runs', value: metrics.totalCableLength.toFixed(0), unit: 'm', sub: `${feeders.length} feeders` },
              { label: 'Capacitor Bank Required', value: metrics.capKVAr > 0 ? metrics.capKVAr.toFixed(1) : '0.0', unit: 'kVAr', sub: `PF ${metrics.weightedPF.toFixed(3)} → ${xfmr.targetPF}` },
            ].map(m => (
              <div key={m.label} style={card({ borderLeft: m.highlight ? '3px solid #EF4444' : undefined })}>
                <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: m.highlight ? '#EF4444' : '#3B82F6', lineHeight: 1 }}>
                  {m.value}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 6 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Loading bar */}
          <div style={card({ marginBottom: 20 })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Transformer Loading</span>
              <span style={{ fontSize: 13, color: statusColor(metrics.status), fontWeight: 700 }}>{metrics.loadingPct.toFixed(1)}%</span>
            </div>
            <div style={{ background: 'var(--ec-bg-root)', borderRadius: 6, height: 16, overflow: 'hidden', border: '1px solid var(--ec-border)' }}>
              <div style={{
                height: '100%', borderRadius: 6,
                width: `${Math.min(metrics.loadingPct, 100)}%`,
                background: metrics.loadingPct > 100 ? '#EF4444' : metrics.loadingPct > 80 ? '#F59E0B' : '#22C55E',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ec-text-muted)', marginTop: 6 }}>
              <span>0%</span>
              <span style={{ color: '#F59E0B' }}>80% (Warning)</span>
              <span style={{ color: '#EF4444' }}>100% (Limit)</span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#F59E0B', background: '#F59E0B11', border: '1px solid #F59E0B33', borderRadius: 8, padding: '10px 14px' }}>
            ⚠️ Engineering Aid Only — All calculations require review and approval by a qualified electrical engineer before construction, procurement or energization.
          </div>
        </div>
      )}

      {/* ── TAB: TRANSFORMER ───────────────────────────────────────────────── */}
      {activeTab === 'transformer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--ec-text-primary)' }}>Transformer Parameters</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FInput label="Rated kVA" value={xfmr.kva} onChange={v => setXfmr(p => ({ ...p, kva: +v }))} unit="kVA" min={25} />
              <FInput label="Primary Voltage" value={xfmr.primaryKV} onChange={v => setXfmr(p => ({ ...p, primaryKV: +v }))} unit="kV" min={0.1} />
              <FInput label="Secondary Voltage" value={xfmr.secondaryV} onChange={v => setXfmr(p => ({ ...p, secondaryV: +v }))} unit="V" min={110} />
              <FInput label="Impedance %" value={xfmr.impedancePct} onChange={v => setXfmr(p => ({ ...p, impedancePct: +v }))} unit="%" min={1} max={20} step={0.5} />
              <FInput label="Num. Transformers" value={xfmr.numTransformers} onChange={v => setXfmr(p => ({ ...p, numTransformers: +v }))} min={1} max={4} />
              <FInput label="Permitted Loading" value={xfmr.permittedLoadingPct} onChange={v => setXfmr(p => ({ ...p, permittedLoadingPct: +v }))} unit="%" min={50} max={110} />
              <FInput label="Ambient Temp" value={xfmr.ambientTemp} onChange={v => setXfmr(p => ({ ...p, ambientTemp: +v }))} unit="°C" min={20} max={55} />
              <FInput label="Existing Load" value={xfmr.existingLoadKVA} onChange={v => setXfmr(p => ({ ...p, existingLoadKVA: +v }))} unit="kVA" min={0} />
              <FInput label="Target PF" value={xfmr.targetPF} onChange={v => setXfmr(p => ({ ...p, targetPF: +v }))} min={0.8} max={1} step={0.01} />
              <FSelect label="Type" value={xfmr.type} onChange={v => setXfmr(p => ({ ...p, type: v as 'oil' | 'dry' }))}
                options={[{ value: 'oil', label: 'Oil Immersed (ONAN)' }, { value: 'dry', label: 'Dry Type (Cast Resin)' }]} />
              <FSelect label="Configuration" value={xfmr.config} onChange={v => setXfmr(p => ({ ...p, config: v as 'single' | 'parallel' | 'N+1' }))}
                options={[{ value: 'single', label: 'Single' }, { value: 'parallel', label: 'Parallel' }, { value: 'N+1', label: 'N+1 Redundancy' }]} />
              <FSelect label="Phases" value={xfmr.phases.toString()} onChange={v => setXfmr(p => ({ ...p, phases: +v as 1 | 3 }))}
                options={[{ value: '3', label: '3-Phase' }, { value: '1', label: '1-Phase' }]} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Rated Secondary Current</div>
              <CalcBox
                formula="I = kVA × 1000 / (√3 × V)"
                substituted={`I = ${xfmr.kva * xfmr.numTransformers} × 1000 / (1.732 × ${xfmr.secondaryV})`}
                result={`I = ${ratedCurrent.toFixed(1)} A`}
              />
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8 }}>IEC 60076-1: Cl. 4.1 — Rated current at secondary terminals</div>
            </div>

            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Prospective Short-Circuit Current</div>
              <CalcBox
                formula="Isc = I_rated / (Zk% / 100)"
                substituted={`Isc = ${ratedCurrent.toFixed(1)} / (${xfmr.impedancePct} / 100)`}
                result={`Isc = ${Isc.toFixed(0)} A  (${(Isc / 1000).toFixed(2)} kA)`}
              />
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8 }}>IEC 60076-5: Ability to withstand short circuits. Used to select LV switchgear breaking capacity.</div>
            </div>

            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Primary Current</div>
              <CalcBox
                formula="Ip = kVA × 1000 / (√3 × Vp_V)"
                substituted={`Ip = ${xfmr.kva * xfmr.numTransformers} × 1000 / (1.732 × ${xfmr.primaryKV * 1000})`}
                result={`Ip = ${xfmrCurrent(xfmr.kva * xfmr.numTransformers, xfmr.primaryKV * 1000, xfmr.phases).toFixed(2)} A`}
              />
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8 }}>Used to select HV fuse/relay and CT ratio on primary side.</div>
            </div>

            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Transformer Summary</div>
              {[
                ['Rating', `${xfmr.kva} kVA × ${xfmr.numTransformers} = ${xfmr.kva * xfmr.numTransformers} kVA total`],
                ['Voltage Ratio', `${xfmr.primaryKV} kV / ${xfmr.secondaryV} V`],
                ['Impedance', `${xfmr.impedancePct}%`],
                ['Permitted Loading', `${xfmr.permittedLoadingPct}% = ${(xfmr.kva * xfmr.numTransformers * xfmr.permittedLoadingPct / 100).toFixed(0)} kVA`],
                ['Existing Load', `${xfmr.existingLoadKVA} kVA`],
                ['Available for New', `${((xfmr.kva * xfmr.numTransformers * xfmr.permittedLoadingPct / 100) - xfmr.existingLoadKVA).toFixed(0)} kVA`],
                ['Type', xfmr.type === 'oil' ? 'Oil Immersed (ONAN)' : 'Dry Type (Cast Resin)'],
                ['Configuration', xfmr.config],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--ec-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--ec-text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LOAD ENTRY ────────────────────────────────────────────────── */}
      {activeTab === 'loads' && (
        <div>
          {/* Add feeder form */}
          <div style={card({ marginBottom: 16 })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isAdding ? 16 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Feeder List ({feeders.length})</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={downloadTemplate}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--ec-bg-surface)', color: 'var(--ec-text-primary)', border: '1px solid var(--ec-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  title="Download Excel template with all column headers and a sample row"
                >
                  <Download style={{ width: 14, height: 14 }} /> Download Template
                </button>
                <button
                  onClick={() => xlsxInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#22C55E22', color: '#22C55E', border: '1px solid #22C55E55', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  title="Import feeders from a filled Excel template"
                >
                  <Upload style={{ width: 14, height: 14 }} /> Import Excel
                </button>
                <input
                  ref={xlsxInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={importFromExcel}
                />
                <button
                  onClick={() => { setIsAdding(v => !v); setNewFeeder({ ...defaultFeeder(), feederNo: nextFeederNo(feeders) }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Add Feeder
                </button>
              </div>
            </div>

            {isAdding && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                  <FInput label="Feeder No." value={newFeeder.feederNo} onChange={v => setNewFeeder(p => ({ ...p, feederNo: v }))} type="text" />
                  <FInput label="DB / Panel" value={newFeeder.dbName} onChange={v => setNewFeeder(p => ({ ...p, dbName: v }))} type="text" />
                  <FInput label="Description" value={newFeeder.description} onChange={v => setNewFeeder(p => ({ ...p, description: v }))} type="text" />
                  <FInput label="Qty" value={newFeeder.quantity} onChange={v => setNewFeeder(p => ({ ...p, quantity: +v }))} min={1} />
                  <FInput label="Rated kW" value={newFeeder.ratedKW} onChange={v => setNewFeeder(p => ({ ...p, ratedKW: +v }))} unit="kW" min={0.1} step={0.1} />
                  <FInput label="Voltage" value={newFeeder.voltage} onChange={v => setNewFeeder(p => ({ ...p, voltage: +v }))} unit="V" />
                  <FInput label="Power Factor" value={newFeeder.powerFactor} onChange={v => setNewFeeder(p => ({ ...p, powerFactor: +v }))} min={0.5} max={1} step={0.01} />
                  <FInput label="Efficiency" value={newFeeder.efficiency} onChange={v => setNewFeeder(p => ({ ...p, efficiency: +v }))} min={0.5} max={1} step={0.01} />
                  <FSelect label="Load Type" value={newFeeder.loadType} onChange={v => setNewFeeder(p => ({ ...p, loadType: v as Feeder['loadType'] }))}
                    options={['motor', 'heater', 'lighting', 'HVAC', 'UPS', 'socket', 'VFD', 'other'].map(t => ({ value: t, label: t }))} />
                  <FInput label="Demand Factor" value={newFeeder.demandFactor} onChange={v => setNewFeeder(p => ({ ...p, demandFactor: +v }))} min={0.1} max={1} step={0.05} />
                  <FInput label="Util. Factor" value={newFeeder.utilizationFactor} onChange={v => setNewFeeder(p => ({ ...p, utilizationFactor: +v }))} min={0.1} max={1} step={0.05} />
                  <FSelect label="Phases" value={newFeeder.phases.toString()} onChange={v => setNewFeeder(p => ({ ...p, phases: +v as 1 | 3 }))}
                    options={[{ value: '3', label: '3-Ph' }, { value: '1', label: '1-Ph' }]} />
                  <FInput label="Cable Length" value={newFeeder.cableLength} onChange={v => setNewFeeder(p => ({ ...p, cableLength: +v }))} unit="m" min={1} />
                  <FSelect label="Conductor" value={newFeeder.conductor} onChange={v => setNewFeeder(p => ({ ...p, conductor: v as 'Cu' | 'Al' }))}
                    options={[{ value: 'Cu', label: 'Copper (Cu)' }, { value: 'Al', label: 'Aluminium (Al)' }]} />
                  <FSelect label="Insulation" value={newFeeder.insulation} onChange={v => setNewFeeder(p => ({ ...p, insulation: v as 'PVC' | 'XLPE' }))}
                    options={[{ value: 'XLPE', label: 'XLPE (90°C)' }, { value: 'PVC', label: 'PVC (70°C)' }]} />
                  <FSelect label="Install Method" value={newFeeder.installMethod} onChange={v => setNewFeeder(p => ({ ...p, installMethod: v }))}
                    options={['Tray', 'Conduit', 'Underground', 'Open Air', 'Wall'].map(m => ({ value: m, label: m }))} />
                  <FInput label="Group Size" value={newFeeder.groupSize} onChange={v => setNewFeeder(p => ({ ...p, groupSize: +v }))} min={1} max={6} />
                  <FInput label="Ambient Temp" value={newFeeder.ambientTemp} onChange={v => setNewFeeder(p => ({ ...p, ambientTemp: +v }))} unit="°C" min={20} max={55} />
                  <FInput label="Starting I mult." value={newFeeder.startingCurrentMult} onChange={v => setNewFeeder(p => ({ ...p, startingCurrentMult: +v }))} min={1} max={12} step={0.5} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addFeeder} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Check style={{ width: 14, height: 14 }} /> Confirm Add
                  </button>
                  <button onClick={() => setIsAdding(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--ec-bg-root)', color: 'var(--ec-text-muted)', border: '1px solid var(--ec-border)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                    <X style={{ width: 14, height: 14 }} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feeder table */}
          {feeders.length === 0 ? (
            <div style={{ ...card(), textAlign: 'center', padding: 40, color: 'var(--ec-text-muted)' }}>
              No feeders added yet. Click "Add Feeder" to begin.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--ec-bg-surface)', borderBottom: '2px solid var(--ec-border)' }}>
                    {['No.', 'DB', 'Description', 'Qty', 'kW', 'PF', 'V', 'Ph', 'DF', 'UF', 'Load Type', 'Length', 'Conductor', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeders.map((f, idx) => {
                    const isEdit = editFeeder?.id === f.id;
                    const ef = isEdit ? editFeeder! : f;
                    return (
                      <tr key={f.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)', borderBottom: '1px solid var(--ec-border)' }}>
                        <td style={{ padding: '7px 10px' }}>{isEdit ? <input value={ef.feederNo} onChange={e => setEditFeeder(p => p ? { ...p, feederNo: e.target.value } : p)} style={{ width: 50, background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)', borderRadius: 4, padding: '2px 4px', color: 'var(--ec-text-primary)', fontSize: 12 }} /> : f.feederNo}</td>
                        <td style={{ padding: '7px 10px' }}>{isEdit ? <input value={ef.dbName} onChange={e => setEditFeeder(p => p ? { ...p, dbName: e.target.value } : p)} style={{ width: 60, background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)', borderRadius: 4, padding: '2px 4px', color: 'var(--ec-text-primary)', fontSize: 12 }} /> : f.dbName}</td>
                        <td style={{ padding: '7px 10px', maxWidth: 160 }}>{isEdit ? <input value={ef.description} onChange={e => setEditFeeder(p => p ? { ...p, description: e.target.value } : p)} style={{ width: 120, background: 'var(--ec-bg-root)', border: '1px solid var(--ec-border)', borderRadius: 4, padding: '2px 4px', color: 'var(--ec-text-primary)', fontSize: 12 }} /> : f.description}</td>
                        <td style={{ padding: '7px 10px' }}>{f.quantity}</td>
                        <td style={{ padding: '7px 10px' }}>{f.ratedKW}</td>
                        <td style={{ padding: '7px 10px' }}>{f.powerFactor}</td>
                        <td style={{ padding: '7px 10px' }}>{f.voltage}</td>
                        <td style={{ padding: '7px 10px' }}>{f.phases}</td>
                        <td style={{ padding: '7px 10px' }}>{f.demandFactor}</td>
                        <td style={{ padding: '7px 10px' }}>{f.utilizationFactor}</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ fontSize: 10, background: '#3B82F633', color: '#3B82F6', borderRadius: 4, padding: '2px 6px' }}>{f.loadType}</span></td>
                        <td style={{ padding: '7px 10px' }}>{f.cableLength}m</td>
                        <td style={{ padding: '7px 10px' }}>{f.conductor}/{f.insulation}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {isEdit ? (
                              <button onClick={saveEdit} title="Save" style={{ background: '#22C55E', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                                <Check style={{ width: 11, height: 11 }} />
                              </button>
                            ) : (
                              <button onClick={() => setEditFeeder({ ...f })} title="Edit" style={{ background: 'var(--ec-bg-root)', color: 'var(--ec-text-muted)', border: '1px solid var(--ec-border)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                                <Edit2 style={{ width: 11, height: 11 }} />
                              </button>
                            )}
                            <button onClick={() => copyFeeder(f)} title="Copy (same spec, new number)" style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                              <Copy style={{ width: 11, height: 11 }} />
                            </button>
                            <button onClick={() => deleteFeeder(f.id)} title="Delete" style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444433', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                              <Trash2 style={{ width: 11, height: 11 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CABLE SIZING ──────────────────────────────────────────────── */}
      {activeTab === 'cables' && (
        <div>
          <div style={{ ...card({ marginBottom: 16 }), fontSize: 12, color: 'var(--ec-text-muted)' }}>
            Cable selection per IEC 60364-5-52. Correction factors applied: temperature (Ct), grouping (Cg), installation method (Cm). Selected size satisfies Ib ≤ Iz.
          </div>
          {feeders.length === 0 ? (
            <div style={{ ...card(), textAlign: 'center', padding: 40, color: 'var(--ec-text-muted)' }}>Add feeders in "Load Entry" tab first.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--ec-bg-surface)', borderBottom: '2px solid var(--ec-border)' }}>
                    {['Feeder', 'Description', 'Ib (A)', 'Size (mm²)', 'Runs', 'Iz (A)', 'Ct', 'Cg', 'Cm', 'VD (V)', 'VD%', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeders.map((f, i) => {
                    const c = feederCalcs[i];
                    const ct = tempCorrection(f.ambientTemp, f.insulation);
                    const cg = groupFactor(f.groupSize);
                    const cm = installMultiplier(f.installMethod);
                    const vdStatus = c.VdPct <= 3 ? 'PASS' : c.VdPct <= 5 ? 'WARNING' : 'FAIL';
                    return (
                      <tr key={f.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)', borderBottom: '1px solid var(--ec-border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{f.feederNo}</td>
                        <td style={{ padding: '8px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.description}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#3B82F6' }}>{c.Ib.toFixed(1)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{SIZES[c.sizeIdx]}</td>
                        <td style={{ padding: '8px 10px' }}>{c.numRuns}</td>
                        <td style={{ padding: '8px 10px', color: '#22C55E', fontWeight: 700 }}>{c.Iz.toFixed(1)}</td>
                        <td style={{ padding: '8px 10px' }}>{ct.toFixed(3)}</td>
                        <td style={{ padding: '8px 10px' }}>{cg.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px' }}>{cm.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px' }}>{c.Vd.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px' }}>{c.VdPct.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px' }}><Badge status={vdStatus} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--ec-text-muted)' }}>
            VD ≤ 3%: PASS | 3–5%: WARNING | &gt;5%: FAIL — per IEC 60364-5-52:2009 Table B.52.12
          </div>
        </div>
      )}

      {/* ── TAB: BREAKER SELECTION ─────────────────────────────────────────── */}
      {activeTab === 'breakers' && (
        <div>
          <div style={{ ...card({ marginBottom: 16 }), fontSize: 12, color: 'var(--ec-text-muted)' }}>
            Overcurrent protection per IEC 60364-4-43. Condition: Ib ≤ In ≤ Iz and I₂ ≤ 1.45 × Iz. Breaking capacity ≥ Isc = {(Isc / 1000).toFixed(2)} kA.
          </div>
          {feeders.length === 0 ? (
            <div style={{ ...card(), textAlign: 'center', padding: 40, color: 'var(--ec-text-muted)' }}>Add feeders in "Load Entry" tab first.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--ec-bg-surface)', borderBottom: '2px solid var(--ec-border)' }}>
                    {['Feeder', 'Description', 'Ib (A)', 'In (A)', 'Iz (A)', 'In ≤ Iz?', '1.45Iz', 'Type', 'Isc Cap. (kA)', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeders.map((f, i) => {
                    const c = feederCalcs[i];
                    const inLeIz = c.In <= c.Iz;
                    // IEC 60364-4-43: I₂ (= 1.45 × In) ≤ 1.45 × Iz
                    const i2Check = c.In * 1.45 <= c.Iz * 1.45;
                    const status = inLeIz && i2Check ? 'PASS' : 'FAIL';
                    const bType = c.In <= 63 ? 'MCB' : c.In <= 1600 ? 'MCCB' : 'ACB';
                    return (
                      <tr key={f.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)', borderBottom: '1px solid var(--ec-border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{f.feederNo}</td>
                        <td style={{ padding: '8px 10px' }}>{f.description}</td>
                        <td style={{ padding: '8px 10px', color: '#3B82F6', fontWeight: 700 }}>{c.Ib.toFixed(1)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{c.In}</td>
                        <td style={{ padding: '8px 10px', color: '#22C55E' }}>{c.Iz.toFixed(1)}</td>
                        <td style={{ padding: '8px 10px' }}><Badge status={inLeIz ? 'PASS' : 'FAIL'} /></td>
                        <td style={{ padding: '8px 10px' }}>{(c.Iz * 1.45).toFixed(1)}</td>
                        <td style={{ padding: '8px 10px' }}><span style={{ fontSize: 10, background: '#6366F133', color: '#6366F1', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>{bType}</span></td>
                        <td style={{ padding: '8px 10px' }}>{(Isc / 1000).toFixed(1)}</td>
                        <td style={{ padding: '8px 10px' }}><Badge status={status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CAPACITOR BANK ────────────────────────────────────────────── */}
      {activeTab === 'capacitor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>PF Correction Parameters</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--ec-bg-root)', borderRadius: 8, border: '1px solid var(--ec-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginBottom: 4 }}>Current Demand (from Load Entry)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#3B82F6' }}>{metrics.totalDemandKW.toFixed(1)} kW</div>
                <div style={{ fontSize: 12, color: 'var(--ec-text-muted)' }}>at PF = {metrics.weightedPF.toFixed(3)}</div>
              </div>
              <FInput label="Target Power Factor" value={xfmr.targetPF} onChange={v => setXfmr(p => ({ ...p, targetPF: +v }))} min={0.8} max={1} step={0.01} />
              <FInput label="System Voltage" value={xfmr.secondaryV} onChange={v => setXfmr(p => ({ ...p, secondaryV: +v }))} unit="V" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Capacitor Bank Sizing</div>
              <CalcBox
                formula="Qc = P × (tan φ₁ − tan φ₂)"
                substituted={`Qc = ${metrics.totalDemandKW.toFixed(1)} × (tan(acos(${metrics.weightedPF.toFixed(3)})) − tan(acos(${xfmr.targetPF})))`}
                result={`Qc = ${metrics.capKVAr.toFixed(2)} kVAr`}
              />
              <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8 }}>IEC 60831-1: Shunt power capacitors for AC power systems</div>
            </div>
            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Capacitor Current</div>
              {(() => {
                const Qc = metrics.capKVAr;
                const Ic = xfmr.phases === 3 ? (Qc * 1000) / (Math.sqrt(3) * xfmr.secondaryV) : (Qc * 1000) / xfmr.secondaryV;
                const maxIc = Ic * 1.3;
                return (
                  <>
                    <CalcBox
                      formula="Ic = Qc × 1000 / (√3 × V)"
                      substituted={`Ic = ${Qc.toFixed(1)} × 1000 / (1.732 × ${xfmr.secondaryV})`}
                      result={`Ic = ${Ic.toFixed(1)} A`}
                    />
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ec-text-muted)' }}>
                      Max capacitor current (×1.3): <strong>{maxIc.toFixed(1)} A</strong> — used to select capacitor contactor per IEC 60831
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Summary</div>
              {[
                ['Active Power', `${metrics.totalDemandKW.toFixed(1)} kW`],
                ['Current PF', metrics.weightedPF.toFixed(3)],
                ['Target PF', xfmr.targetPF.toString()],
                ['Required kVAr', `${metrics.capKVAr.toFixed(1)} kVAr`],
                ['New kVA', `${(metrics.totalDemandKW / xfmr.targetPF).toFixed(1)} kVA`],
                ['kVA Reduction', `${(metrics.totalDemandKVA - metrics.totalDemandKW / xfmr.targetPF).toFixed(1)} kVA`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--ec-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--ec-text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SHORT CIRCUIT ─────────────────────────────────────────────── */}
      {activeTab === 'shortcircuit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Prospective Short-Circuit Current</div>
              <CalcBox
                formula="Isc = I_rated / (Zk% / 100)"
                substituted={`Isc = ${ratedCurrent.toFixed(1)} / (${xfmr.impedancePct} / 100)`}
                result={`Isc = ${Isc.toFixed(0)} A = ${(Isc / 1000).toFixed(2)} kA`}
              />
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ec-text-muted)' }}>
                IEC 60909: Short-circuit currents in three-phase AC systems. All LV switchgear must have breaking capacity ≥ {(Isc / 1000).toFixed(2)} kA.
              </div>
            </div>

            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Peak Short-Circuit Current</div>
              {(() => {
                const peakFactor = 1.8; // IEC 60909 Cl. 4.3.1 — kappa factor
                const Ip = peakFactor * Math.sqrt(2) * Isc;
                return (
                  <>
                    <CalcBox
                      formula="ip = κ × √2 × Isc"
                      substituted={`ip = ${peakFactor} × 1.414 × ${Isc.toFixed(0)}`}
                      result={`ip = ${Ip.toFixed(0)} A (peak)`}
                    />
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ec-text-muted)' }}>κ = 1.8 (IEC 60909 Cl. 4.3.1 — typical for LV systems)</div>
                  </>
                );
              })()}
            </div>

            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Fault MVA</div>
              {(() => {
                const Smva = (Math.sqrt(3) * xfmr.secondaryV * Isc) / 1e6;
                return (
                  <CalcBox
                    formula="S_fault = √3 × V × Isc"
                    substituted={`S_fault = 1.732 × ${xfmr.secondaryV} × ${Isc.toFixed(0)}`}
                    result={`S_fault = ${Smva.toFixed(3)} MVA`}
                  />
                );
              })()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Earth Conductor Adiabatic Check (IEC 60364-5-54)</div>
              {feeders.length === 0 ? (
                <div style={{ color: 'var(--ec-text-muted)', fontSize: 12 }}>Add feeders to see earth conductor checks.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--ec-border)' }}>
                        {['Feeder', 'Isc (A)', 't (s)', 'Min. mm²', 'Cable mm²', 'Status'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, color: 'var(--ec-text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {feeders.map((f, i) => {
                        const c = feederCalcs[i];
                        const minEarth = earthSize(Isc, 0.5, f.insulation);
                        const selectedCable = SIZES[c.sizeIdx];
                        const earthRequired = Math.max(minEarth, selectedCable / 2);
                        const status = selectedCable >= earthRequired ? 'PASS' : 'WARNING';
                        return (
                          <tr key={f.id} style={{ borderBottom: '1px solid var(--ec-border)', background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{f.feederNo}</td>
                            <td style={{ padding: '6px 8px' }}>{Isc.toFixed(0)}</td>
                            <td style={{ padding: '6px 8px' }}>0.5</td>
                            <td style={{ padding: '6px 8px' }}>{minEarth.toFixed(1)}</td>
                            <td style={{ padding: '6px 8px' }}>{selectedCable}</td>
                            <td style={{ padding: '6px 8px' }}><Badge status={status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ec-text-muted)' }}>
                S = (I × √t) / k — k = 143 (XLPE), 115 (PVC). IEC 60364-5-54 Annex A.
              </div>
            </div>

            <div style={card()}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Switchgear Breaking Capacity</div>
              <div style={{ fontSize: 12, color: 'var(--ec-text-muted)', marginBottom: 8 }}>Required: ≥ {(Isc / 1000).toFixed(2)} kA (prospective Isc)</div>
              {[
                { type: 'MCB (up to 63A)', icu: 6, status: Isc / 1000 <= 6 ? 'PASS' : 'FAIL' },
                { type: 'MCCB (63–1600A)', icu: 25, status: Isc / 1000 <= 25 ? 'PASS' : 'WARNING' },
                { type: 'MCCB High Cap.', icu: 50, status: Isc / 1000 <= 50 ? 'PASS' : 'WARNING' },
                { type: 'ACB (≥1600A)', icu: 65, status: Isc / 1000 <= 65 ? 'PASS' : 'FAIL' },
              ].map(b => (
                <div key={b.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ec-border)' }}>
                  <span style={{ fontSize: 12 }}>{b.type} — Icu {b.icu} kA</span>
                  <Badge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FEEDER SCHEDULE ───────────────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Consolidated Feeder Schedule</div>
            <button
              onClick={exportCSV}
              disabled={feeders.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: feeders.length === 0 ? 'var(--ec-bg-surface)' : '#22C55E', color: feeders.length === 0 ? 'var(--ec-text-muted)' : '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: feeders.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              <Download style={{ width: 14, height: 14 }} /> Export CSV
            </button>
          </div>
          {feeders.length === 0 ? (
            <div style={{ ...card(), textAlign: 'center', padding: 40, color: 'var(--ec-text-muted)' }}>Add feeders in "Load Entry" tab first.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--ec-bg-surface)', borderBottom: '2px solid var(--ec-border)' }}>
                    {['Feeder No.', 'DB / Panel', 'Description', 'Qty', 'kW', 'kVA', 'PF', 'Ib (A)', 'Cable', 'Runs', 'Iz (A)', 'In (A)', 'VD (V)', 'VD%', 'Demand kW', 'VD Status', 'OC Status'].map(h => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)', whiteSpace: 'nowrap', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeders.map((f, i) => {
                    const c = feederCalcs[i];
                    const vdStatus = c.VdPct <= 3 ? 'PASS' : c.VdPct <= 5 ? 'WARNING' : 'FAIL';
                    const ocStatus = c.In <= c.Iz ? 'PASS' : 'FAIL';
                    return (
                      <tr key={f.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)', borderBottom: '1px solid var(--ec-border)' }}>
                        <td style={{ padding: '7px 8px', fontWeight: 700 }}>{f.feederNo}</td>
                        <td style={{ padding: '7px 8px' }}>{f.dbName}</td>
                        <td style={{ padding: '7px 8px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</td>
                        <td style={{ padding: '7px 8px' }}>{f.quantity}</td>
                        <td style={{ padding: '7px 8px' }}>{f.ratedKW}</td>
                        <td style={{ padding: '7px 8px' }}>{(f.ratedKW / f.powerFactor).toFixed(1)}</td>
                        <td style={{ padding: '7px 8px' }}>{f.powerFactor}</td>
                        <td style={{ padding: '7px 8px', color: '#3B82F6', fontWeight: 700 }}>{c.Ib.toFixed(1)}</td>
                        <td style={{ padding: '7px 8px', fontWeight: 700 }}>{SIZES[c.sizeIdx]}</td>
                        <td style={{ padding: '7px 8px' }}>{c.numRuns}</td>
                        <td style={{ padding: '7px 8px', color: '#22C55E' }}>{c.Iz.toFixed(1)}</td>
                        <td style={{ padding: '7px 8px', fontWeight: 700 }}>{c.In}</td>
                        <td style={{ padding: '7px 8px' }}>{c.Vd.toFixed(2)}</td>
                        <td style={{ padding: '7px 8px' }}>{c.VdPct.toFixed(2)}%</td>
                        <td style={{ padding: '7px 8px' }}>{c.demandKW.toFixed(1)}</td>
                        <td style={{ padding: '7px 8px' }}><Badge status={vdStatus} /></td>
                        <td style={{ padding: '7px 8px' }}><Badge status={ocStatus} /></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--ec-border)', background: 'var(--ec-bg-surface)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '8px 8px' }}>TOTALS</td>
                    <td style={{ padding: '8px 8px' }}>{feeders.reduce((a, f) => a + f.ratedKW * f.quantity, 0).toFixed(1)}</td>
                    <td style={{ padding: '8px 8px' }}>{feeders.reduce((a, f) => a + (f.ratedKW / f.powerFactor) * f.quantity, 0).toFixed(1)}</td>
                    <td colSpan={8} />
                    <td style={{ padding: '8px 8px' }}>{metrics.totalDemandKW.toFixed(1)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <div style={{ marginTop: 16, fontSize: 11, color: '#F59E0B', background: '#F59E0B11', border: '1px solid #F59E0B33', borderRadius: 8, padding: '10px 14px' }}>
            ⚠️ Engineering Aid Only — All calculations require review and approval by a qualified electrical engineer before construction, procurement or energization.
          </div>
        </div>
      )}

      {/* ── TAB: IEC LIBRARY ───────────────────────────────────────────────── */}
      {activeTab === 'iec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Applicable IEC Standards</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--ec-border)' }}>
                    {['Standard', 'Title', 'Clause / Part', 'Application in this tool'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['IEC 60076-1', 'Power transformers — General', 'Cl. 4, 5', 'Rated current, impedance, loading'],
                    ['IEC 60076-5', 'Transformers — Short-circuit withstand', 'Cl. 4', 'Fault current calculation'],
                    ['IEC 60076-7', 'Transformers — Loading guide (oil)', 'Cl. 7', 'Permissible overloading'],
                    ['IEC 60364-5-52', 'Wiring systems — Selection & erection', 'Table B.52.1–B.52.17', 'Cable ampacity, correction factors'],
                    ['IEC 60364-4-43', 'Protection against overcurrent', 'Cl. 433, 434', 'Ib ≤ In ≤ Iz, I₂ ≤ 1.45×Iz'],
                    ['IEC 60364-5-54', 'Earthing arrangements', 'Annex A', 'Earth conductor adiabatic sizing'],
                    ['IEC 60909', 'Short-circuit currents (3-phase AC)', 'Cl. 4.2–4.3', 'Isc, peak factor κ, ip'],
                    ['IEC 60947-2', 'LV circuit breakers', 'Cl. 8.3', 'Breaking capacity (Icu, Ics)'],
                    ['IEC 60831-1', 'Shunt power capacitors', 'Cl. 6', 'Capacitor bank sizing & current'],
                    ['BS 7671:2018', 'IET Wiring Regulations (UK)', 'Part 4, 5', 'Overcurrent, VD limits (3%, 5%)'],
                  ].map(([std, title, clause, app], idx) => (
                    <tr key={std} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)', borderBottom: '1px solid var(--ec-border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#6366F1', whiteSpace: 'nowrap' }}>{std}</td>
                      <td style={{ padding: '8px 10px' }}>{title}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--ec-text-muted)', whiteSpace: 'nowrap' }}>{clause}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--ec-text-muted)' }}>{app}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Cable Ampacity Reference (Cu/XLPE, Method E — Tray)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--ec-border)' }}>
                    {['Size (mm²)', 'Cu/XLPE (A)', 'Cu/PVC (A)', 'Al/XLPE (A)', 'Resistance Cu (Ω/km)', 'Reactance (Ω/km)'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ec-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((s, i) => (
                    <tr key={s} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--ec-bg-surface)', borderBottom: '1px solid var(--ec-border)' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700 }}>{s}</td>
                      <td style={{ padding: '6px 10px', color: '#22C55E' }}>{AMP_CU_XLPE[i]}</td>
                      <td style={{ padding: '6px 10px' }}>{AMP_CU_PVC[i]}</td>
                      <td style={{ padding: '6px 10px' }}>{AMP_AL_XLPE[i]}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{RES_CU[i]}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{REACT[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ec-text-muted)', marginTop: 8 }}>Source: IEC 60364-5-52:2009, Table B.52.4 (Cu/XLPE), B.52.2 (Cu/PVC), B.52.6 (Al/XLPE). Method E: Perforated tray, free air.</div>
          </div>

          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Correction Factor Reference</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#6366F1' }}>Temperature Correction (Ct)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ec-border)' }}>
                      {['Ambient (°C)', 'XLPE Ct', 'PVC Ct'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 10, color: 'var(--ec-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[25, 30, 35, 40, 45, 50, 55].map(t => (
                      <tr key={t} style={{ borderBottom: '1px solid var(--ec-border)' }}>
                        <td style={{ padding: '5px 8px' }}>{t}</td>
                        <td style={{ padding: '5px 8px' }}>{tempCorrection(t, 'XLPE').toFixed(3)}</td>
                        <td style={{ padding: '5px 8px' }}>{tempCorrection(t, 'PVC').toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#6366F1' }}>Grouping Factor (Cg)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ec-border)' }}>
                      {['Cables in Group', 'Cg'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 10, color: 'var(--ec-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <tr key={n} style={{ borderBottom: '1px solid var(--ec-border)' }}>
                        <td style={{ padding: '5px 8px' }}>{n}</td>
                        <td style={{ padding: '5px 8px' }}>{groupFactor(n).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
