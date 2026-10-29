import React, { useState, useMemo } from 'react';
import {
  Zap, Plus, Trash2, ChevronDown, ChevronRight,
  Download, CheckCircle, XCircle, AlertTriangle, Info,
  Package, BarChart3, FileText, Settings, Calculator,
} from 'lucide-react';
import { downloadReport, tableHTML } from '../../utils/reportDownload';
import { useStore } from '../../store/useStore';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type CableIns     = 'XLPE' | 'PVC';
type ConductorM   = 'Cu' | 'Al';
type ArmourT      = 'SWA' | 'Non-SWA';
type CoreCfg      = '3C' | '4C' | '3C+E' | '4C+E' | '1C×3 Parallel' | '1C×4 Parallel';
type EarthArr     = 'Separate Earth' | 'Core Earth' | 'None';
type StartM       = 'DOL' | 'Star-Delta' | 'Soft Starter' | 'VFD' | 'Auto-Transformer' | 'Direct / MCCB' | 'Direct / MCB' | 'Direct / Isolator' | 'Direct / RCCB';
type EquipT       = 'Motor' | 'Pump' | 'Fan' | 'Chiller' | 'Compressor' | 'Heater' | 'Lighting' | 'Socket' | 'Panel' | 'General';
type CalcSt       = 'PASS' | 'FAIL' | 'VERIFY' | 'N/A';

interface Machine {
  id: string; tag: string; name: string; equipType: EquipT;
  kw: number; qty: number; voltage: number; phases: 1 | 3;
  pf: number; efficiency: number; startMethod: StartM;
  cableLength: number; installMethod: string;
  cableInsulation: CableIns; armour: ArmourT;
  conductor: ConductorM; coreConfig: CoreCfg;
  earthArrangement: EarthArr; earthCableMaterial: ConductorM;
  earthCableType: CableIns; wastage: number; remarks: string;
}

interface CalcResult {
  machineId: string; flc: number; designCurrent: number;
  numRuns: number; currentPerRun: number;
  cableSizeIdx: number; cableSize: number; cableDesc: string;
  ratedAmpacity: number; deratedAmpacity: number;
  Ct: number; Cg: number; Ci: number;
  vdVolts: number; vdPct: number; vdLimit: number;
  cableOD: number; glandSize: string; glandType: string;
  earthCableSize: number; earthDesc: string;
  powerPurchaseQty: number; earthPurchaseQty: number;
  powerTagMotor: string; powerTagSMDB: string;
  earthTagMotor: string; earthTagSMDB: string;
  scWithstandA: number; faultCurrentKA: number;
  ampStatus: CalcSt; vdStatus: CalcSt; scStatus: CalcSt;
  glandStatus: CalcSt; earthStatus: CalcSt; overallStatus: CalcSt;
  notes: string[];
}

interface BOMLine {
  id: string; category: string; catCode: string;
  description: string; spec: string; unit: string;
  qty: number; source: string; unitRate: number;
}

interface ManualTrayItem {
  id: string; type: string; description: string;
  width: string; height: string; material: string;
  qty: number; unit: string; remarks: string;
}

interface ProjectInfo {
  smdbId: string; projectName: string; projectNo: string;
  engineer: string; checker: string; approved: string;
  date: string; rev: string; faultCurrentKA: number;
  ambientTemp: number; groupN: number; installMethod: string;
  vdLimit: number; designFactor: number; defaultWastage: number;
  trayRouteLength: number; trayPieceLength: number;
  trayFillPct: number; traySpare: number;
  // BOM quick-edit overrides
  trayType: string; trayMaterial: string; trayHeight: number;
  trayWidthOverride: number; // 0 = auto-calculated
  tagType: string; tagBrand: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CABLE DATABASE  (IEC 60364-5-52, Method E — free air / cable tray, 30°C)
// ─────────────────────────────────────────────────────────────────────────────
const SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

const AMP: Record<string, number[]> = {
  'XLPE-Cu': [24, 32, 43, 55, 75, 100, 133, 164, 198, 253, 306, 354, 406, 463, 546, 629],
  'XLPE-Al': [0, 0, 0, 0, 0, 76, 101, 125, 151, 192, 232, 269, 309, 353, 415, 477],
  'PVC-Cu':  [19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299, 344, 392, 461, 530],
  'PVC-Al':  [0, 0, 0, 0, 0, 65, 85, 104, 127, 161, 195, 226, 261, 298, 351, 403],
  'Flex-Cu': [16, 23, 30, 38, 52, 65, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// Resistance mΩ/m at operating temp (90°C XLPE, 70°C PVC)
const RES: Record<string, number[]> = {
  'XLPE-Cu': [14.48, 8.71, 5.45, 3.63, 2.18, 1.36, 0.870, 0.625, 0.483, 0.344, 0.253, 0.201, 0.167, 0.134, 0.100, 0.0836],
  'XLPE-Al': [0, 0, 0, 0, 0, 2.236, 1.430, 1.027, 0.794, 0.565, 0.416, 0.330, 0.275, 0.220, 0.164, 0.137],
  'PVC-Cu':  [13.58, 8.17, 5.11, 3.41, 2.04, 1.28, 0.816, 0.586, 0.453, 0.323, 0.237, 0.189, 0.157, 0.126, 0.0938, 0.0785],
  'PVC-Al':  [0, 0, 0, 0, 0, 2.102, 1.340, 0.962, 0.744, 0.530, 0.389, 0.310, 0.258, 0.207, 0.154, 0.129],
  'Flex-Cu': [13.58, 8.17, 5.11, 3.41, 2.04, 1.28, 0.816, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// Cable OD (mm) by core config × armour × insulation × conductor
// Format key: '{ins}-{cond}-{cores}-{armour}'
const OD_DB: Record<string, number[]> = {
  'XLPE-Cu-3C-Non-SWA': [10.5, 11.8, 13.0, 14.5, 17.0, 19.5, 23.5, 26.0, 30.0, 34.5, 39.0, 44.0, 49.0, 55.0, 62.0, 68.0],
  'XLPE-Cu-3C-SWA':     [15.0, 17.0, 18.5, 20.5, 23.5, 27.0, 32.0, 35.5, 40.0, 45.5, 51.0, 56.5, 62.0, 69.0, 77.0, 84.0],
  'XLPE-Cu-4C-Non-SWA': [11.5, 13.0, 14.5, 16.0, 19.0, 22.0, 27.0, 30.0, 34.5, 39.5, 44.5, 50.0, 56.0, 63.0, 71.0, 78.0],
  'XLPE-Cu-4C-SWA':     [16.5, 18.5, 20.0, 22.0, 25.5, 29.5, 35.5, 39.0, 44.0, 50.0, 56.5, 63.0, 70.0, 78.0, 87.0, 95.0],
  'XLPE-Al-3C-Non-SWA': [0, 0, 0, 0, 0, 20.5, 25.0, 27.5, 31.5, 36.5, 41.5, 47.0, 52.5, 59.0, 66.5, 73.0],
  'XLPE-Al-3C-SWA':     [0, 0, 0, 0, 0, 27.5, 33.0, 36.5, 41.5, 47.5, 54.0, 60.0, 66.5, 74.0, 83.0, 91.0],
  'XLPE-Al-4C-Non-SWA': [0, 0, 0, 0, 0, 23.0, 28.5, 31.5, 36.0, 41.5, 47.5, 53.5, 60.0, 67.5, 76.0, 83.5],
  'XLPE-Al-4C-SWA':     [0, 0, 0, 0, 0, 30.5, 37.0, 41.0, 46.5, 53.0, 60.5, 68.0, 75.5, 84.5, 95.0, 104.0],
  'PVC-Cu-3C-Non-SWA':  [10.0, 11.0, 12.0, 13.5, 16.0, 18.5, 22.5, 25.0, 28.5, 33.0, 37.5, 42.5, 47.0, 53.0, 60.0, 66.0],
  'PVC-Cu-3C-SWA':      [14.5, 16.0, 17.5, 19.0, 22.0, 25.5, 30.5, 34.0, 38.5, 44.0, 49.5, 55.0, 60.5, 67.0, 75.0, 82.0],
  'PVC-Cu-4C-Non-SWA':  [11.0, 12.5, 14.0, 15.5, 18.5, 21.0, 26.0, 29.0, 33.5, 38.0, 43.0, 49.0, 54.5, 61.0, 68.5, 75.5],
  'PVC-Cu-4C-SWA':      [15.5, 17.5, 19.5, 21.0, 24.5, 28.5, 34.0, 38.0, 43.0, 49.0, 55.0, 61.5, 68.0, 75.5, 84.5, 93.0],
  'PVC-Al-3C-Non-SWA':  [0, 0, 0, 0, 0, 19.5, 24.0, 26.5, 30.5, 35.5, 40.5, 46.0, 51.5, 58.0, 65.0, 71.5],
  'PVC-Al-3C-SWA':      [0, 0, 0, 0, 0, 26.5, 32.0, 35.5, 40.5, 46.5, 53.0, 59.0, 65.5, 73.0, 82.0, 90.0],
  'Flex-Cu-3C-Non-SWA': [8.5, 10.0, 11.5, 13.0, 15.5, 18.0, 21.5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// Temp correction factors (base 30°C)
const TEMP_XLPE: Record<number, number> = { 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76 };
const TEMP_PVC:  Record<number, number> = { 25: 1.06, 30: 1.00, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61 };
const GROUP_Cf:  Record<number, number> = { 1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.52 };
const INSTALL_Cf: Record<string, number> = {
  'Free Air / Cable Tray': 1.00,
  'Clipped to Wall': 0.95,
  'In Conduit on Wall': 0.85,
  'Buried in Ground': 0.90,
  'In Enclosed Trunking': 0.78,
};

// SC withstand constant k (IEC 60949): I²t = k²S²
const SC_K: Record<string, number> = {
  'XLPE-Cu': 143, 'XLPE-Al': 94, 'PVC-Cu': 115, 'PVC-Al': 76, 'Flex-Cu': 115,
};

// Standard tray widths (mm)
const TRAY_WIDTHS = [100, 150, 225, 300, 450, 600, 750, 900];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const R3   = (n: number) => Math.round(n * 1000) / 1000;
const R2   = (n: number) => Math.round(n * 100) / 100;
const SQRT3 = Math.sqrt(3);
const uid  = () => Math.random().toString(36).slice(2, 9);

// Typical cable reactance (mΩ/m at 50 Hz, multi-core) — IEC 60364-5-52 Annex B
const CABLE_X_MOM = 0.08;

// IEC 60364-5-52: ΔV = √3 × I × L × (R·cosφ + X·sinφ) / 1000  (3-phase)
//                 ΔV = 2  × I × L × (R·cosφ + X·sinφ) / 1000  (1-phase)
// r, x in mΩ/m; L in m; I in A → ΔV in V
function calcVdrop(I: number, L: number, r: number, pf: number, phases: 1 | 3, voltage: number) {
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));
  const mult = phases === 3 ? SQRT3 : 2;
  const vdV   = R3(mult * I * L * (r * pf + CABLE_X_MOM * sinPhi) / 1000);
  const vdPct = R3(vdV / voltage * 100);
  return { vdV, vdPct };
}

function ampKey(ins: CableIns, cond: ConductorM): string { return `${ins}-${cond}`; }
function odKey(ins: CableIns, cond: ConductorM, cores: string, armour: ArmourT): string {
  const c = cores.startsWith('4') ? '4C' : cores.startsWith('3') ? '3C' : '3C';
  return `${ins}-${cond}-${c}-${armour}`;
}

function getTempFactor(ins: CableIns, ambTemp: number): number {
  const tbl = ins === 'XLPE' ? TEMP_XLPE : TEMP_PVC;
  const keys = Object.keys(tbl).map(Number);
  const nearest = keys.reduce((a, b) => Math.abs(b - ambTemp) < Math.abs(a - ambTemp) ? b : a);
  return tbl[nearest] ?? 1.0;
}

function getGland(od: number, isArmoured: boolean): { size: string; type: string } {
  const type = isArmoured ? 'CW' : 'BW';
  if (od <= 12)  return { size: 'M16', type: `${type}16` };
  if (od <= 15)  return { size: 'M20', type: `${type}20` };
  if (od <= 20)  return { size: 'M25', type: `${type}25` };
  if (od <= 28)  return { size: 'M32', type: `${type}32` };
  if (od <= 36)  return { size: 'M40', type: `${type}40` };
  if (od <= 46)  return { size: 'M50', type: `${type}50` };
  if (od <= 58)  return { size: 'M63', type: `${type}63` };
  if (od <= 72)  return { size: 'M75', type: `${type}75` };
  if (od <= 90)  return { size: 'M90', type: `${type}90` };
  return { size: 'M110', type: `${type}110` };
}

function earthCableSize(phaseSize: number, isAl: boolean): number {
  if (isAl) {
    if (phaseSize <= 35) return 16;
    return Math.ceil(phaseSize / 2);
  }
  if (phaseSize <= 16) return phaseSize;
  if (phaseSize <= 35) return 16;
  return Math.ceil(phaseSize / 2);
}

function selectTrayWidth(neededMm: number, sparePct: number): number {
  const required = neededMm * (1 + sparePct / 100);
  return TRAY_WIDTHS.find(w => w >= required) ?? 900;
}

function cableTagFmt(smdbId: string, machTag: string, run: number, type: 'P' | 'E'): string {
  const sid = smdbId.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const mid = machTag.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return `${sid}-${mid}-${type}${String(run).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function calcMachine(m: Machine, proj: ProjectInfo): CalcResult {
  const notes: string[] = [];
  const isAl = m.conductor === 'Al';
  const isArmoured = m.armour === 'SWA';
  const ins = m.cableInsulation;
  const aKey = ampKey(ins, m.conductor);
  const ampTable = AMP[aKey] ?? AMP['XLPE-Cu'];
  const resTable = RES[aKey] ?? RES['XLPE-Cu'];

  // Step 1: FLC
  const flc = m.phases === 3
    ? m.kw * 1000 / (SQRT3 * m.voltage * m.pf * m.efficiency)
    : m.kw * 1000 / (m.voltage * m.pf * m.efficiency);

  // Step 2: Design current
  const designCurrent = flc * (proj.designFactor / 100);

  // Step 3: Derating
  const Ct = getTempFactor(ins, proj.ambientTemp);
  const Cg = GROUP_Cf[Math.min(proj.groupN, 9)] ?? 0.52;
  const Ci = INSTALL_Cf[proj.installMethod] ?? 1.0;

  // Step 4: Find cable size (ampacity + VD)
  const vdLimit = proj.vdLimit;
  let chosenIdx = -1;

  for (let i = 0; i < SIZES.length; i++) {
    if (!ampTable[i]) continue;
    const derated = R3(ampTable[i] * Ct * Cg * Ci);
    if (derated >= designCurrent) { chosenIdx = i; break; }
  }

  // Max single-cable ampacity
  const maxSingleAmp = (() => {
    for (let i = SIZES.length - 1; i >= 0; i--) {
      const d = R3((ampTable[i] ?? 0) * Ct * Cg * Ci);
      if (d > 0) return d;
    }
    return 0;
  })();

  let numRuns = 1;
  if (chosenIdx === -1) {
    // Need parallel runs
    numRuns = Math.ceil(designCurrent / maxSingleAmp);
    const currentPerRun = designCurrent / numRuns;
    for (let i = 0; i < SIZES.length; i++) {
      if (!ampTable[i]) continue;
      const derated = R3(ampTable[i] * Ct * Cg * Ci);
      if (derated >= currentPerRun) { chosenIdx = i; break; }
    }
    if (numRuns > 1) notes.push(`Parallel ${numRuns} runs required — single cable exceeds max rated capacity`);
  }

  if (chosenIdx === -1) {
    // Still not found — return error result
    return buildErrorResult(m, proj, flc, designCurrent, notes);
  }

  const currentPerRun = R3(designCurrent / numRuns);

  // Step 5: Voltage drop check — step up if fails
  let finalIdx = chosenIdx;
  for (let i = chosenIdx; i < SIZES.length; i++) {
    if (!ampTable[i]) break;
    const r = resTable[i];
    const { vdPct } = calcVdrop(currentPerRun, m.cableLength, r, m.pf, m.phases, m.voltage);
    if (vdPct <= vdLimit) { finalIdx = i; break; }
    finalIdx = i;
    if (i === chosenIdx) notes.push(`Cable size stepped up from ${SIZES[chosenIdx]}mm² to satisfy VD ≤ ${vdLimit}%`);
  }

  const cableSize = SIZES[finalIdx];
  const ratedAmpacity = ampTable[finalIdx] ?? 0;
  const deratedAmpacity = R3(ratedAmpacity * Ct * Cg * Ci);
  const r = resTable[finalIdx] ?? 0;
  const { vdV: vdVolts, vdPct } = calcVdrop(currentPerRun, m.cableLength, r, m.pf, m.phases, m.voltage);

  // Step 6: Cable description
  const cores = m.coreConfig.startsWith('4') ? '4C' : '3C';
  const armourStr = isArmoured ? '/SWA' : '';
  const cableDesc = `${cores} × ${cableSize} mm² ${m.conductor} ${ins}${armourStr}`;

  // Step 7: Cable OD and gland
  const odk = odKey(ins, m.conductor, cores, m.armour);
  const odTable = OD_DB[odk] ?? OD_DB['XLPE-Cu-4C-SWA'];
  const cableOD  = odTable[finalIdx] ?? 0;
  const { size: glandSize, type: glandType } = getGland(cableOD, isArmoured);

  // Step 8: Earth cable
  const eSize = earthCableSize(cableSize, m.earthCableMaterial === 'Al');
  const eDesc = m.earthArrangement === 'Separate Earth'
    ? `1C × ${eSize} mm² ${m.earthCableMaterial} ${m.earthCableType} G/Y`
    : '—';

  // Step 9: Short-circuit withstand (adiabatic: I_sc = k·S/√t)
  const k = SC_K[aKey] ?? 115;
  const scT = 0.2; // assumed fault clearing time 200ms (MCCB)
  const scWithstandA = R3(k * cableSize / Math.sqrt(scT));
  const faultCurrentKA = proj.faultCurrentKA;
  const scStatus: CalcSt = faultCurrentKA > 0
    ? (scWithstandA >= faultCurrentKA * 1000 ? 'PASS' : 'FAIL')
    : 'VERIFY';

  // Step 10: Purchase quantities (with wastage)
  const wf = 1 + m.wastage / 100;
  const powerPurchaseQty = R2(m.cableLength * numRuns * wf);
  const earthPurchaseQty = m.earthArrangement === 'Separate Earth'
    ? R2(m.cableLength * numRuns * wf)
    : 0;

  // Step 11: Cable tags
  const powerTagMotor = cableTagFmt(proj.smdbId, m.tag, 1, 'P');
  const powerTagSMDB  = cableTagFmt(proj.smdbId, m.tag, 1, 'P');
  const earthTagMotor = m.earthArrangement === 'Separate Earth' ? cableTagFmt(proj.smdbId, m.tag, 1, 'E') : '—';
  const earthTagSMDB  = earthTagMotor;

  // Status
  const ampStatus: CalcSt  = deratedAmpacity >= currentPerRun ? 'PASS' : 'FAIL';
  const vdStatus: CalcSt   = vdPct <= vdLimit ? 'PASS' : 'FAIL';
  const glandStatus: CalcSt = cableOD > 0 ? 'PASS' : 'VERIFY';
  const earthStatus: CalcSt = m.earthArrangement !== 'None' ? 'PASS' : 'N/A';
  const overallStatus: CalcSt = (ampStatus === 'PASS' && vdStatus === 'PASS' && scStatus !== 'FAIL') ? 'PASS' : 'FAIL';

  if (m.conductor === 'Al' && cableSize < 16) notes.push('Aluminium conductor minimum size is 16mm² per IEC 60228');
  if (scStatus === 'VERIFY') notes.push('Enter prospective fault current (kA) in project settings to verify short-circuit withstand');

  return {
    machineId: m.id, flc: R3(flc), designCurrent: R3(designCurrent),
    numRuns, currentPerRun,
    cableSizeIdx: finalIdx, cableSize, cableDesc, ratedAmpacity, deratedAmpacity, Ct, Cg, Ci,
    vdVolts, vdPct, vdLimit,
    cableOD, glandSize, glandType,
    earthCableSize: eSize, earthDesc: eDesc,
    powerPurchaseQty, earthPurchaseQty,
    powerTagMotor, powerTagSMDB, earthTagMotor, earthTagSMDB,
    scWithstandA, faultCurrentKA,
    ampStatus, vdStatus, scStatus, glandStatus, earthStatus, overallStatus,
    notes,
  };
}

function buildErrorResult(m: Machine, proj: ProjectInfo, flc: number, designCurrent: number, notes: string[]): CalcResult {
  notes.push('ERROR: No cable in database can carry this load — check inputs or use multiple parallel runs');
  return {
    machineId: m.id, flc: R3(flc), designCurrent: R3(designCurrent),
    numRuns: 1, currentPerRun: R3(designCurrent),
    cableSizeIdx: -1, cableSize: 0, cableDesc: 'ERROR — Check inputs',
    ratedAmpacity: 0, deratedAmpacity: 0, Ct: 1, Cg: 1, Ci: 1,
    vdVolts: 0, vdPct: 0, vdLimit: proj.vdLimit,
    cableOD: 0, glandSize: '—', glandType: '—',
    earthCableSize: 0, earthDesc: '—',
    powerPurchaseQty: 0, earthPurchaseQty: 0,
    powerTagMotor: '—', powerTagSMDB: '—', earthTagMotor: '—', earthTagSMDB: '—',
    scWithstandA: 0, faultCurrentKA: 0,
    ampStatus: 'FAIL', vdStatus: 'FAIL', scStatus: 'VERIFY',
    glandStatus: 'FAIL', earthStatus: 'FAIL', overallStatus: 'FAIL',
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CABLE SIZE OVERRIDE — recalculates gland, OD, earth, VD for new size
// ─────────────────────────────────────────────────────────────────────────────
function applyOverride(c: CalcResult, m: Machine, newIdx: number): CalcResult {
  const newSize = SIZES[newIdx];
  if (!newSize) return c;
  const ins = m.cableInsulation;
  const aKey = ampKey(ins, m.conductor);
  const ampTable = AMP[aKey] ?? AMP['XLPE-Cu'];
  const resTable = RES[aKey] ?? RES['XLPE-Cu'];
  const cores = m.coreConfig.startsWith('4') ? '4C' : '3C';
  const odk = odKey(ins, m.conductor, cores, m.armour);
  const odTable = OD_DB[odk] ?? OD_DB['XLPE-Cu-4C-SWA'];
  const newRatedA = ampTable[newIdx] ?? 0;
  const newDeratedA = R3(newRatedA * c.Ct * c.Cg * c.Ci);
  const newR = resTable[newIdx] ?? 0;
  const { vdV: newVdV, vdPct: newVdPct } = calcVdrop(c.currentPerRun, m.cableLength, newR, m.pf, m.phases, m.voltage);
  const newOD = odTable[newIdx] ?? 0;
  const { size: newGland, type: newGlandType } = getGland(newOD, m.armour === 'SWA');
  const newEarthSize = earthCableSize(newSize, m.earthCableMaterial === 'Al');
  const armourStr = m.armour === 'SWA' ? '/SWA' : '';
  const newCableDesc = `${cores} × ${newSize} mm² ${m.conductor} ${ins}${armourStr}`;
  const newEarthDesc = m.earthArrangement === 'Separate Earth'
    ? `1C × ${newEarthSize} mm² ${m.earthCableMaterial} ${m.earthCableType} G/Y` : '—';
  const wf = 1 + m.wastage / 100;
  const overNote = `Cable size manually overridden: ${c.cableSize}mm² → ${newSize}mm²`;
  return {
    ...c,
    cableSizeIdx: newIdx, cableSize: newSize, cableDesc: newCableDesc,
    ratedAmpacity: newRatedA, deratedAmpacity: newDeratedA,
    vdVolts: newVdV, vdPct: newVdPct,
    vdStatus: newVdPct <= c.vdLimit ? 'PASS' : 'FAIL',
    ampStatus: newDeratedA >= c.currentPerRun ? 'PASS' : 'FAIL',
    cableOD: newOD, glandSize: newGland, glandType: newGlandType,
    earthCableSize: newEarthSize, earthDesc: newEarthDesc,
    powerPurchaseQty: R2(m.cableLength * c.numRuns * wf),
    earthPurchaseQty: m.earthArrangement === 'Separate Earth' ? R2(m.cableLength * c.numRuns * wf) : 0,
    notes: [...c.notes.filter(n => !n.startsWith('Cable size manually')), overNote],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BOM GENERATION
// ─────────────────────────────────────────────────────────────────────────────
function generateBOM(machines: Machine[], calcs: Map<string, CalcResult>, proj: ProjectInfo, manualItems: ManualTrayItem[]): BOMLine[] {
  const lines: BOMLine[] = [];
  let idN = 0;
  const nid = () => `bom-${++idN}`;
  // Fallbacks for fields added after initial state was created (HMR / old saved state)
  const tagType     = proj.tagType     ?? 'Stainless Steel Tie Tag';
  const tagBrand    = proj.tagBrand    ?? 'Brady';
  const trayType    = proj.trayType    ?? 'Perforated';
  const trayMaterial= proj.trayMaterial?? 'Galvanised Steel';
  const trayHeight  = proj.trayHeight  ?? 75;
  const trayWidthOv = proj.trayWidthOverride ?? 0;

  // --- Power Cables, Earth Cables, Glands, Tags per machine ---
  for (const m of machines) {
    const c = calcs.get(m.id);
    if (!c || c.cableSize === 0) continue;
    const numRuns = c.numRuns;

    // A: Power Cable
    lines.push({ id: nid(), catCode: 'A', category: 'Power Cables', description: 'Power Cable', spec: c.cableDesc, unit: 'm', qty: c.powerPurchaseQty, source: m.tag, unitRate: 0 });

    // B: Earth Cable
    if (m.earthArrangement === 'Separate Earth') {
      lines.push({ id: nid(), catCode: 'B', category: 'Earth Cables', description: 'Earth Cable', spec: c.earthDesc, unit: 'm', qty: c.earthPurchaseQty, source: m.tag, unitRate: 0 });
    }

    // C: Cable Glands (2 per run)
    const glandQty = numRuns * 2;
    lines.push({ id: nid(), catCode: 'C', category: 'Cable Glands', description: `Cable Gland ${c.glandType}`, spec: `${c.glandSize} ${m.armour === 'SWA' ? 'Brass SWA Armour Clamp Gland' : 'Brass Cable Gland'}`, unit: 'No', qty: glandQty, source: m.tag, unitRate: 0 });

    // D: Gland Accessories
    lines.push({ id: nid(), catCode: 'D', category: 'Gland Accessories', description: 'Gland Locknut', spec: `${c.glandSize} Brass Locknut`, unit: 'No', qty: glandQty, source: m.tag, unitRate: 0 });
    lines.push({ id: nid(), catCode: 'D', category: 'Gland Accessories', description: 'Earth Tag', spec: `M4 Brass Earth Tag`, unit: 'No', qty: glandQty, source: m.tag, unitRate: 0 });
    if (m.armour === 'SWA') {
      lines.push({ id: nid(), catCode: 'D', category: 'Gland Accessories', description: 'Gland Shroud', spec: `${c.glandSize} PVC Shroud`, unit: 'No', qty: glandQty, source: m.tag, unitRate: 0 });
    }

    // E: Cable Tags
    const tagQty = numRuns * 2; // both ends
    lines.push({ id: nid(), catCode: 'E', category: 'Cable Tags', description: 'Cable Identification Tag - Power', spec: `${tagType} / ${tagBrand} - ${c.powerTagMotor}`, unit: 'No', qty: tagQty, source: m.tag, unitRate: 0 });
    if (m.earthArrangement === 'Separate Earth') {
      lines.push({ id: nid(), catCode: 'E', category: 'Cable Tags', description: 'Cable Identification Tag - Earth', spec: `${tagType} / ${tagBrand} - ${c.earthTagMotor}`, unit: 'No', qty: tagQty, source: m.tag, unitRate: 0 });
    }
  }

  // --- Cable Tray ---
  const allODs = machines.flatMap(m => {
    const c = calcs.get(m.id);
    return c && c.cableOD > 0 ? Array(c.numRuns).fill(c.cableOD) : [];
  });
  const totalCableWidth = allODs.reduce((a, b) => a + b, 0);
  const autoTrayWidth = selectTrayWidth(totalCableWidth / (proj.trayFillPct / 100), proj.traySpare);
  const requiredTrayWidth = trayWidthOv > 0 ? trayWidthOv : autoTrayWidth;
  const trayPieces = Math.ceil(proj.trayRouteLength / proj.trayPieceLength);
  const trayM = proj.trayRouteLength;
  const matAbbr = ({ 'Galvanised Steel': 'GS', 'Hot Dip Galvanised': 'HDG', 'Stainless Steel 304': 'SS304', 'Stainless Steel 316': 'SS316', 'Aluminium': 'Al', 'FRP (Fibreglass)': 'FRP' } as Record<string,string>)[trayMaterial] ?? 'GS';

  lines.push({ id: nid(), catCode: 'F', category: 'Cable Tray', description: `Cable Tray (${trayType})`, spec: `${requiredTrayWidth}mm W x ${trayHeight}mm H x ${proj.trayPieceLength}m L ${trayMaterial}`, unit: 'Pcs', qty: trayPieces, source: 'SMDB', unitRate: 0 });
  lines.push({ id: nid(), catCode: 'G', category: 'Cable Tray Cover', description: `Cable Tray Cover (${trayType})`, spec: `${requiredTrayWidth}mm W x ${proj.trayPieceLength}m L ${trayMaterial}`, unit: 'Pcs', qty: trayPieces, source: 'SMDB', unitRate: 0 });

  // H: Tray Accessories
  const couplers = Math.max(trayPieces - 1, 1);
  lines.push({ id: nid(), catCode: 'H', category: 'Tray Accessories', description: 'Tray Coupler', spec: `${requiredTrayWidth}mm ${matAbbr} Coupler Plate (2-piece)`, unit: 'Set', qty: couplers, source: 'SMDB', unitRate: 0 });
  lines.push({ id: nid(), catCode: 'H', category: 'Tray Accessories', description: 'Coupler Bolts & Nuts', spec: `M8 x 20mm ${matAbbr} Bolts + Nuts + Washers`, unit: 'Set', qty: couplers * 4, source: 'SMDB', unitRate: 0 });
  lines.push({ id: nid(), catCode: 'H', category: 'Tray Accessories', description: 'Tray Support Bracket', spec: `${requiredTrayWidth}mm ${matAbbr} Wall Bracket (per 1.5m)`, unit: 'No', qty: Math.ceil(trayM / 1.5), source: 'SMDB', unitRate: 0 });
  lines.push({ id: nid(), catCode: 'H', category: 'Tray Accessories', description: 'Tray Earthing Jumper', spec: '4sqmm G/Y Flexible Earth Lead with Crimp Lugs', unit: 'No', qty: Math.ceil(trayM / 20), source: 'SMDB', unitRate: 0 });
  lines.push({ id: nid(), catCode: 'H', category: 'Tray Accessories', description: 'Threaded Rod + Spring Nut', spec: `M8 x 1m ${matAbbr} Threaded Rod + Spring Nut`, unit: 'Set', qty: Math.ceil(trayM / 1.5), source: 'SMDB', unitRate: 0 });

  // Manual tray items
  for (const item of manualItems) {
    const catMap: Record<string, string> = {
      'Horizontal Bend': 'I', 'Vertical Bend': 'I', 'Inside Bend': 'I', 'Outside Bend': 'I',
      'T-Tray': 'J', 'Cross': 'K', 'Reducer': 'K',
      'Tray Support': 'H', 'Hanger': 'H', 'Custom': 'M',
    };
    const code = catMap[item.type] ?? 'M';
    const catNames: Record<string, string> = { I: 'Tray Bends', J: 'T-Trays', K: 'Cross / Reducer', H: 'Tray Accessories', M: 'Miscellaneous' };
    lines.push({ id: nid(), catCode: code, category: catNames[code] ?? 'Miscellaneous', description: item.description || item.type, spec: item.width ? `${item.width} × ${item.height} mm ${item.material}` : item.material, unit: item.unit, qty: item.qty, source: 'Manual', unitRate: 0 });
  }

  return lines;
}

function consolidateBOM(lines: BOMLine[]): BOMLine[] {
  const map = new Map<string, BOMLine>();
  for (const l of lines) {
    const key = `${l.catCode}||${l.description}||${l.spec}||${l.unit}`;
    if (map.has(key)) {
      const ex = map.get(key)!;
      ex.qty = R2(ex.qty + l.qty);
      ex.source += ex.source.includes(l.source) ? '' : `, ${l.source}`;
    } else {
      map.set(key, { ...l });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.catCode.localeCompare(b.catCode));
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', inp: 'var(--ec-bg-input)',
  brd: 'var(--ec-border-card)', brdB: 'var(--ec-border)', brdM: 'var(--ec-border-muted)',
  txt: 'var(--ec-text-primary)', txtS: 'var(--ec-text-secondary)', txtM: 'var(--ec-text-muted)',
  txtL: 'var(--ec-text-label)',
};

const inp: React.CSSProperties = {
  width: '100%', height: 40, background: V.inp, border: `1px solid ${V.brdB}`,
  borderRadius: 8, color: V.txt, fontSize: 13, fontWeight: 600,
  padding: '0 10px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const sel: React.CSSProperties = { ...inp, paddingRight: 28, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' };

function Lbl({ ch, hint }: { ch: string; hint?: string }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: V.txtL, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {ch}{hint && <span title={hint} style={{ marginLeft: 4, fontSize: 9, color: V.txtM, cursor: 'help' }}>ⓘ</span>}
    </label>
  );
}

function SelWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={V.txtM} strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
    </div>
  );
}

function StatusBadge({ status }: { status: CalcSt }) {
  const map: Record<CalcSt, { bg: string; color: string; label: string }> = {
    PASS:   { bg: '#D1FAE5', color: '#065F46', label: '✓ PASS' },
    FAIL:   { bg: '#FEE2E2', color: '#991B1B', label: '✗ FAIL' },
    VERIFY: { bg: '#FEF3C7', color: '#92400E', label: '⚠ VERIFY' },
    'N/A':  { bg: '#F1F5F9', color: '#64748B', label: 'N/A' },
  };
  const s = map[status];
  return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>{s.label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MACHINE FORM
// ─────────────────────────────────────────────────────────────────────────────
function MachineForm({ m, idx, proj, onChange, onDelete }: { m: Machine; idx: number; proj: ProjectInfo; onChange: (m: Machine) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(idx === 0);

  const set = <K extends keyof Machine>(k: K, v: Machine[K]) => onChange({ ...m, [k]: v });
  const setN = <K extends keyof Machine>(k: K, v: string) => onChange({ ...m, [k]: parseFloat(v) || 0 });

  return (
    <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 12, marginBottom: 10 }}>
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: open ? '12px 12px 0 0' : 12, background: open ? `rgba(37,99,235,.06)` : 'transparent' }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#3B82F6' }}>{idx + 1}</div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: V.txt }}>{m.tag || `Machine ${idx + 1}`}</span>
          {m.name && <span style={{ fontSize: 12, color: V.txtM, marginLeft: 10 }}>{m.name}</span>}
          {m.kw > 0 && <span style={{ fontSize: 12, color: '#60A5FA', marginLeft: 10 }}>{m.kw} kW · {m.voltage} V · {m.cableLength} m</span>}
        </div>
        <span style={{ fontSize: 11, color: V.txtM, marginRight: 8 }}>{m.equipType}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,.12)', color: '#EF4444', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}><Trash2 style={{ width: 12, height: 12 }} /></button>
        {open ? <ChevronDown style={{ width: 16, height: 16, color: V.txtM, flexShrink: 0 }} /> : <ChevronRight style={{ width: 16, height: 16, color: V.txtM, flexShrink: 0 }} />}
      </div>

      {open && (
        <div style={{ padding: '16px', borderTop: `1px solid ${V.brdM}` }}>
          {/* Row 1: Tag, Name, EquipType */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 160px', gap: 10, marginBottom: 10 }}>
            <div><Lbl ch="Machine Tag" /><input style={inp} value={m.tag} onChange={e => set('tag', e.target.value)} placeholder="M-101" /></div>
            <div><Lbl ch="Machine Name" /><input style={inp} value={m.name} onChange={e => set('name', e.target.value)} placeholder="Conveyor Motor" /></div>
            <div><Lbl ch="Equipment Type" /><SelWrap><select style={sel} value={m.equipType} onChange={e => set('equipType', e.target.value as EquipT)}>
              {['Motor', 'Pump', 'Fan', 'Chiller', 'Compressor', 'Heater', 'Lighting', 'Socket', 'Panel', 'General'].map(t => <option key={t}>{t}</option>)}
            </select></SelWrap></div>
          </div>

          {/* Row 2: kW, Qty, Voltage, Phases, PF, Efficiency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 10 }}>
            <div><Lbl ch="Motor Power" hint="Rated shaft power in kW" /><input style={inp} type="number" value={m.kw} onChange={e => setN('kw', e.target.value)} min={0.1} step={0.1} /></div>
            <div><Lbl ch="Quantity" /><input style={inp} type="number" value={m.qty} onChange={e => setN('qty', e.target.value)} min={1} /></div>
            <div><Lbl ch="Voltage (V)" /><SelWrap><select style={sel} value={m.voltage} onChange={e => set('voltage', parseInt(e.target.value) as Machine['voltage'])}>
              {[110, 220, 240, 380, 400, 415, 440, 480, 690, 1000, 3300, 6600, 11000].map(v => <option key={v} value={v}>{v >= 1000 ? `${v / 1000}kV` : `${v}V`}</option>)}
            </select></SelWrap></div>
            <div><Lbl ch="Phases" /><SelWrap><select style={sel} value={m.phases} onChange={e => set('phases', parseInt(e.target.value) as 1 | 3)}>
              <option value={3}>3-Phase</option><option value={1}>1-Phase</option>
            </select></SelWrap></div>
            <div><Lbl ch="Power Factor" hint="cos φ — motor nameplate" /><input style={inp} type="number" value={m.pf} onChange={e => setN('pf', e.target.value)} min={0.5} max={1} step={0.01} /></div>
            <div><Lbl ch="Efficiency η" hint="Motor nameplate efficiency" /><input style={inp} type="number" value={m.efficiency} onChange={e => setN('efficiency', e.target.value)} min={0.5} max={1} step={0.01} /></div>
          </div>

          {/* Row 3: Starting method, Cable length, Installation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: 10, marginBottom: 10 }}>
            <div><Lbl ch="Starting Method" /><SelWrap><select style={sel} value={m.startMethod} onChange={e => set('startMethod', e.target.value as StartM)}>
              <optgroup label="Motor Starters">
                <option value="DOL">DOL — Direct On Line (6x FLC)</option>
                <option value="Star-Delta">Star-Delta (2x FLC in Star)</option>
                <option value="Soft Starter">Soft Starter (2.5x FLC)</option>
                <option value="VFD">VFD Drive (1.5x FLC)</option>
                <option value="Auto-Transformer">Auto-Transformer (3x FLC)</option>
              </optgroup>
              <optgroup label="Machine Panel / Distribution">
                <option value="Direct / MCCB">Direct / MCCB (Panel Feeder)</option>
                <option value="Direct / MCB">Direct / MCB (Small Panel)</option>
                <option value="Direct / Isolator">Direct / Isolator (Switch Panel)</option>
                <option value="Direct / RCCB">Direct / RCCB (DB / Final Circuit)</option>
              </optgroup>
            </select></SelWrap></div>
            <div><Lbl ch="Cable Length (m)" hint="One-way route length" /><input style={inp} type="number" value={m.cableLength} onChange={e => setN('cableLength', e.target.value)} min={1} /></div>
            <div><Lbl ch="Installation Method" /><SelWrap><select style={sel} value={m.installMethod} onChange={e => set('installMethod', e.target.value)}>
              {Object.keys(INSTALL_Cf).map(k => <option key={k}>{k}</option>)}
            </select></SelWrap></div>
            <div><Lbl ch="Wastage %" hint="Purchase allowance" /><input style={inp} type="number" value={m.wastage} onChange={e => setN('wastage', e.target.value)} min={0} max={30} /></div>
          </div>

          {/* Row 4: Cable Construction — Power + Earth aligned */}
          <div style={{ background: V.surf, borderRadius: 8, padding: '12px', marginBottom: 10, border: `1px solid ${V.brdM}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Cable Construction</div>

            {/* Power Cable Row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 88, flexShrink: 0, paddingBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px', background: 'rgba(59,130,246,.10)', borderRadius: 6, textAlign: 'center', border: '1px solid rgba(59,130,246,.25)' }}>Power Cable</div>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                <div><Lbl ch="Insulation" /><SelWrap><select style={sel} value={m.cableInsulation} onChange={e => set('cableInsulation', e.target.value as CableIns)}>
                  <option value="XLPE">XLPE 90°C</option><option value="PVC">PVC 70°C</option>
                </select></SelWrap></div>
                <div><Lbl ch="Armour" /><SelWrap><select style={sel} value={m.armour} onChange={e => set('armour', e.target.value as ArmourT)}>
                  <option value="SWA">SWA (Armoured)</option><option value="Non-SWA">Non-SWA (Unarmoured)</option>
                </select></SelWrap></div>
                <div><Lbl ch="Conductor" /><SelWrap><select style={sel} value={m.conductor} onChange={e => set('conductor', e.target.value as ConductorM)}>
                  <option value="Cu">Copper (Cu)</option><option value="Al">Aluminium (Al)</option>
                </select></SelWrap></div>
                <div><Lbl ch="Core Config" /><SelWrap><select style={sel} value={m.coreConfig} onChange={e => set('coreConfig', e.target.value as CoreCfg)}>
                  <option value="3C">3C (3-core)</option>
                  <option value="4C">4C (4-core)</option>
                  <option value="3C+E">3C+E</option>
                  <option value="4C+E">4C+E</option>
                  <option value="1C×3 Parallel">1C×3 Parallel</option>
                  <option value="1C×4 Parallel">1C×4 Parallel</option>
                </select></SelWrap></div>
                <div><Lbl ch="Earth Arrangement" /><SelWrap><select style={sel} value={m.earthArrangement} onChange={e => set('earthArrangement', e.target.value as EarthArr)}>
                  <option value="Separate Earth">Separate Earth Cable</option>
                  <option value="Core Earth">Core Earth (within cable)</option>
                  <option value="None">None / Armour Earth Only</option>
                </select></SelWrap></div>
              </div>
            </div>

            {/* Earth Cable Row — same grid, always shown when Separate Earth */}
            {m.earthArrangement === 'Separate Earth' && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ width: 88, flexShrink: 0, paddingBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px', background: 'rgba(16,185,129,.10)', borderRadius: 6, textAlign: 'center', border: '1px solid rgba(16,185,129,.25)' }}>Earth Cable</div>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <div><Lbl ch="Insulation" /><SelWrap><select style={sel} value={m.earthCableType} onChange={e => set('earthCableType', e.target.value as CableIns)}>
                    <option value="XLPE">XLPE 90°C</option><option value="PVC">PVC 70°C</option>
                  </select></SelWrap></div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', padding: '0 0 10px', fontSize: 12, color: V.txtM, fontStyle: 'italic' }}>Non-SWA</div>
                  </div>
                  <div><Lbl ch="Conductor" /><SelWrap><select style={sel} value={m.earthCableMaterial} onChange={e => set('earthCableMaterial', e.target.value as ConductorM)}>
                    <option value="Cu">Copper (Cu)</option><option value="Al">Aluminium (Al)</option>
                  </select></SelWrap></div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', padding: '0 0 10px', fontSize: 12, color: V.txtM, fontStyle: 'italic' }}>1C Single Core</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', padding: '4px 8px 6px', fontSize: 12, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,.08)', borderRadius: 6, border: '1px solid rgba(16,185,129,.20)' }}>Green / Yellow (G/Y)</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div><Lbl ch="Remarks" /><input style={inp} value={m.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional site notes..." /></div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACHINE RESULT CARD
// ─────────────────────────────────────────────────────────────────────────────
function MachineResultCard({ m, c }: { m: Machine; c: CalcResult }) {
  const [open, setOpen] = useState(false);
  const overall = c.overallStatus;

  return (
    <div style={{ background: V.bg, border: `2px solid ${overall === 'PASS' ? '#10B98130' : '#EF444430'}`, borderRadius: 12, marginBottom: 12 }}>
      {/* Header */}
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: V.txt }}>{m.tag}</span>
          <span style={{ fontSize: 13, color: V.txtM, marginLeft: 10 }}>{m.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#60A5FA', fontWeight: 700 }}>{m.kw} kW</span>
          <span style={{ fontSize: 12, color: V.txtM }}>{c.flc.toFixed(1)} A FLC</span>
          {c.cableSize > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: V.txt }}>{c.cableDesc}</span>}
          <StatusBadge status={c.overallStatus} />
        </div>
        {open ? <ChevronDown style={{ width: 16, height: 16, color: V.txtM }} /> : <ChevronRight style={{ width: 16, height: 16, color: V.txtM }} />}
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${V.brdM}`, padding: '16px 18px' }}>
          {/* Status row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {([['Ampacity', c.ampStatus], ['Voltage Drop', c.vdStatus], ['Short-Circuit', c.scStatus], ['Cable Gland', c.glandStatus], ['Earth Cable', c.earthStatus]] as [string, CalcSt][]).map(([l, s]) => (
              <div key={l} style={{ padding: '6px 12px', borderRadius: 8, background: V.surf, border: `1px solid ${V.brdM}` }}>
                <div style={{ fontSize: 10, color: V.txtM, fontWeight: 600, marginBottom: 2 }}>{l}</div>
                <StatusBadge status={s} />
              </div>
            ))}
          </div>

          {/* Calculation grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {/* Col 1: Current */}
            <div style={{ background: V.surf, borderRadius: 10, padding: '12px 14px', border: `1px solid ${V.brdM}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', marginBottom: 8 }}>Current Calculation</div>
              {[
                ['Full Load Current', `${c.flc.toFixed(3)} A`],
                [`Design Factor (${proj_design_temp_placeholder})`, `${c.designCurrent.toFixed(3)} A`],
                ['Parallel Runs', `${c.numRuns} run${c.numRuns > 1 ? 's' : ''}`],
                ['Current per Run', `${c.currentPerRun.toFixed(3)} A`],
                ['Temp Factor Ct', c.Ct.toFixed(3)],
                ['Group Factor Cg', c.Cg.toFixed(2)],
                ['Install Factor Ci', c.Ci.toFixed(2)],
                ['Derated Ampacity', `${c.deratedAmpacity.toFixed(1)} A`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: V.txtM }}>{l}</span>
                  <span style={{ fontWeight: 700, color: V.txtS }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Col 2: Voltage Drop */}
            <div style={{ background: V.surf, borderRadius: 10, padding: '12px 14px', border: `1px solid ${c.vdStatus === 'PASS' ? '#10B98130' : '#EF444430'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', marginBottom: 8 }}>Voltage Drop</div>
              {[
                ['Cable Size Selected', `${c.cableSize} mm²`],
                ['Cable Length', `${m.cableLength} m`],
                ['Load Current / Run', `${c.currentPerRun.toFixed(1)} A`],
                ['Voltage Drop', `${c.vdVolts.toFixed(3)} V`],
                ['Voltage Drop %', `${c.vdPct.toFixed(3)} %`],
                ['Permitted VD', `${c.vdLimit} %`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: V.txtM }}>{l}</span>
                  <span style={{ fontWeight: 700, color: l === 'Voltage Drop %' ? (c.vdStatus === 'PASS' ? '#10B981' : '#EF4444') : V.txtS }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Col 3: Cable + Gland + Earth + Tags */}
            <div style={{ background: V.surf, borderRadius: 10, padding: '12px 14px', border: `1px solid ${V.brdM}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', marginBottom: 8 }}>Cable, Gland & Tags</div>
              {[
                ['Power Cable', c.cableDesc],
                ['Cable OD', c.cableOD ? `~${c.cableOD} mm` : '—'],
                ['Cable Gland', `${c.glandType} / ${c.glandSize}`],
                ['Earth Cable', c.earthDesc],
                ['SC Withstand', `${(c.scWithstandA / 1000).toFixed(1)} kA (200ms)`],
                ['Power Tag', c.powerTagMotor],
                ['Purchase Qty', `${c.powerPurchaseQty} m (${m.wastage}% wastage)`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: V.txtM }}>{l}</span>
                  <span style={{ fontWeight: 700, color: V.txtS, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {c.notes.length > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,.30)' }}>
              {c.notes.map((n, i) => <div key={i} style={{ fontSize: 12, color: '#92400E', marginBottom: i < c.notes.length - 1 ? 4 : 0 }}>⚠ {n}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// placeholder helper (actual value supplied from parent)
const proj_design_temp_placeholder = 'Design Current';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PROJ: ProjectInfo = {
  smdbId: 'SMDB-01', projectName: '', projectNo: '', engineer: '', checker: '', approved: '',
  date: new Date().toISOString().split('T')[0], rev: 'A',
  faultCurrentKA: 0, ambientTemp: 40, groupN: 1,
  installMethod: 'Free Air / Cable Tray', vdLimit: 5, designFactor: 125, defaultWastage: 5,
  trayRouteLength: 100, trayPieceLength: 3, trayFillPct: 40, traySpare: 20,
  trayType: 'Perforated', trayMaterial: 'Galvanised Steel', trayHeight: 75, trayWidthOverride: 0,
  tagType: 'Stainless Steel Tie Tag', tagBrand: 'Brady',
};

const defaultMachine = (n: number, proj: ProjectInfo): Machine => ({
  id: uid(), tag: `M-${101 + n}`, name: '', equipType: 'Motor',
  kw: 22, qty: 1, voltage: 415, phases: 3, pf: 0.85, efficiency: 0.92,
  startMethod: 'DOL', cableLength: 50, installMethod: proj.installMethod,
  cableInsulation: 'XLPE', armour: 'SWA', conductor: 'Cu', coreConfig: '4C',
  earthArrangement: 'Separate Earth', earthCableMaterial: 'Cu', earthCableType: 'XLPE',
  wastage: proj.defaultWastage, remarks: '',
});

export function CableBOMPro() {
  const { addCalculation } = useStore();
  const [tab, setTab] = useState(0);
  const [proj, setProj] = useState<ProjectInfo>(DEFAULT_PROJ);
  const [machines, setMachines] = useState<Machine[]>([defaultMachine(0, DEFAULT_PROJ)]);
  const [calcs, setCalcs] = useState<Map<string, CalcResult>>(new Map());
  const [hasCalc, setHasCalc] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [manualItems, setManualItems] = useState<ManualTrayItem[]>([]);
  const [bomRates, setBomRates] = useState<Map<string, number>>(new Map());
  const [cableOverrides, setCableOverrides] = useState<Record<string, number>>({}); // machineId → SIZES index

  const setP = <K extends keyof ProjectInfo>(k: K, v: ProjectInfo[K]) => setProj(p => ({ ...p, [k]: v }));
  const setPN = <K extends keyof ProjectInfo>(k: K, v: string) => setProj(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const addMachine = () => setMachines(ms => [...ms, defaultMachine(ms.length, proj)]);
  const delMachine = (id: string) => setMachines(ms => ms.filter(m => m.id !== id));
  const updMachine = (m: Machine) => setMachines(ms => ms.map(x => x.id === m.id ? m : x));

  const runCalcAll = () => {
    const map = new Map<string, CalcResult>();
    for (const m of machines) { map.set(m.id, calcMachine(m, proj)); }
    setCalcs(map);
    setHasCalc(true);
    setTab(1);
    const totalKw = machines.reduce((s, m) => s + m.kw * m.qty, 0);
    addCalculation({
      type: 'cable-bom',
      title: `Cable BOM — ${proj.smdbId} — ${machines.length} machines — ${totalKw} kW`,
      inputs: { 'SMDB': proj.smdbId, 'Machines': machines.length, 'Total kW': totalKw, 'Ambient': `${proj.ambientTemp}°C`, 'VD Limit': `${proj.vdLimit}%` },
      results: { values: [{ label: 'Machines', value: String(machines.length), unit: 'No' }, { label: 'Total Power', value: String(totalKw), unit: 'kW' }], status: 'INFO', recommendation: '', formula: 'Ib = P/(SQRT3·V·PF·η)', steps: [], standardRef: { standard: 'IEC 60364-5-52', clause: 'Table B.52.2', title: 'Cable Current Ratings' } },
      notes: '', standard: 'IEC 60364-5-52 / IEC 60364-4-43 / IEC 60364-5-54',
    });
  };

  // Apply overrides to calcs
  const effectiveCalcs = useMemo(() => {
    const map = new Map<string, CalcResult>();
    for (const m of machines) {
      const c = calcs.get(m.id);
      if (!c) continue;
      const oi = cableOverrides[m.id];
      map.set(m.id, oi !== undefined && oi !== c.cableSizeIdx ? applyOverride(c, m, oi) : c);
    }
    return map;
  }, [calcs, cableOverrides, machines]);

  // BOM
  const rawBOM = useMemo<BOMLine[]>(() => {
    if (!hasCalc) return [];
    return generateBOM(machines, effectiveCalcs, proj, manualItems);
  }, [hasCalc, machines, effectiveCalcs, proj, manualItems]);

  const consolidatedBOM = useMemo(() => consolidateBOM(rawBOM), [rawBOM]);

  // Summary stats
  const summary = useMemo(() => {
    if (!hasCalc) return null;
    const totalKw    = machines.reduce((s, m) => s + m.kw * m.qty, 0);
    const allCalcs   = machines.map(m => calcs.get(m.id)).filter(Boolean) as CalcResult[];
    const totalFlc   = allCalcs.reduce((s, c) => s + c.flc, 0);
    const powerCable = rawBOM.filter(b => b.catCode === 'A').reduce((s, b) => s + b.qty, 0);
    const earthCable = rawBOM.filter(b => b.catCode === 'B').reduce((s, b) => s + b.qty, 0);
    const glands     = rawBOM.filter(b => b.catCode === 'C').reduce((s, b) => s + b.qty, 0);
    const tags       = rawBOM.filter(b => b.catCode === 'E').reduce((s, b) => s + b.qty, 0);
    const tray       = rawBOM.filter(b => b.catCode === 'F').reduce((s, b) => s + b.qty * proj.trayPieceLength, 0);
    const sizes      = allCalcs.filter(c => c.cableSize > 0).map(c => c.cableSize);
    return { totalKw, totalFlc: R2(totalFlc), powerCable: R2(powerCable), earthCable: R2(earthCable), glands, tags, tray: R2(tray), maxSize: sizes.length ? Math.max(...sizes) : 0, minSize: sizes.length ? Math.min(...sizes) : 0 };
  }, [hasCalc, rawBOM, machines, calcs, proj.trayPieceLength]);

  // ── Export PDF ──
  const handlePDF = () => {
    const calcRows = machines.map(m => {
      const c = calcs.get(m.id);
      if (!c) return [m.tag, m.name, `${m.kw} kW`, '—', '—', '—', '—', '—', '—', '—', '—'];
      return [m.tag, m.name, `${m.kw} kW`, `${c.flc.toFixed(1)} A`, c.cableDesc, `${m.cableLength} m`, `${c.numRuns}`, c.earthDesc, `${c.glandType}/${c.glandSize}`, `${c.vdPct.toFixed(2)}%`, c.overallStatus];
    });
    const bomRows = consolidatedBOM.map(b => [b.catCode, b.category, b.description, b.spec, b.unit, b.qty.toString(), showCost ? (b.unitRate > 0 ? `${(b.qty * b.unitRate).toFixed(2)}` : '—') : ''].filter((_, i) => showCost || i < 6));

    const date = new Date().toISOString().split('T')[0];
    const body = `
      <h2>Project Information</h2>
      ${tableHTML(['Field', 'Value'], [
        ['SMDB ID', proj.smdbId], ['Project Name', proj.projectName], ['Project No.', proj.projectNo],
        ['Prepared By', proj.engineer], ['Checked By', proj.checker], ['Date', proj.date], ['Revision', proj.rev],
        ['Ambient Temp', `${proj.ambientTemp}°C`], ['VD Limit', `${proj.vdLimit}%`], ['Design Factor', `${proj.designFactor}%`],
        ['Installation Method', proj.installMethod], ['Fault Current', proj.faultCurrentKA > 0 ? `${proj.faultCurrentKA} kA` : 'Not specified'],
      ])}
      <h2>SMDB Summary — ${proj.smdbId}</h2>
      ${tableHTML(['Parameter', 'Value'], [
        ['Total Machines', String(machines.length)], ['Total Connected Load', `${summary?.totalKw ?? 0} kW`],
        ['Total Calculated Current', `${summary?.totalFlc ?? 0} A`],
        ['Total Power Cable', `${summary?.powerCable ?? 0} m`], ['Total Earth Cable', `${summary?.earthCable ?? 0} m`],
        ['Total Cable Glands', `${summary?.glands ?? 0} No`], ['Total Cable Tags', `${summary?.tags ?? 0} No`],
        ['Total Cable Tray', `${summary?.tray ?? 0} m`],
      ])}
      <h2>Machine-wise Cable Schedule</h2>
      ${tableHTML(['Tag', 'Name', 'Power', 'FLC', 'Cable', 'Length', 'Runs', 'Earth Cable', 'Gland', 'VD%', 'Status'], calcRows)}
      <h2>Consolidated Purchase BOM</h2>
      ${tableHTML(showCost ? ['Cat', 'Category', 'Description', 'Specification', 'Unit', 'Qty', 'Total Cost'] : ['Cat', 'Category', 'Description', 'Specification', 'Unit', 'Qty'], bomRows)}
      <div style="margin-top:20px;padding:14px;background:#fffbeb;border:1px solid #f59e0b;border-radius:6px">
        <b>Engineering Basis:</b> IEC 60364-5-52 (Cable Ratings) · IEC 60364-4-43 (Overcurrent Protection) · IEC 60364-5-54 (Earthing) · IEC 60502-1 (Cable Construction) · IEC 62444 (Glands)<br/>
        <b>Installation:</b> ${proj.installMethod} · ${proj.ambientTemp}°C Ambient · ${proj.groupN} cable group<br/>
        <b>Voltage Drop Limit:</b> ${proj.vdLimit}% · <b>Design Factor:</b> ${proj.designFactor}%
      </div>
      <h2>Sign-Off</h2>
      <table><tr>
        <td class="lbl">Prepared By</td><td>_________________________ Date: __________</td>
        <td class="lbl">Checked By</td><td>_________________________ Date: __________</td>
        <td class="lbl">Approved By</td><td>_________________________ Date: __________</td>
      </tr></table>
    `;
    downloadReport(`Cable BOM — ${proj.smdbId}`, `${proj.projectName || proj.smdbId} · ${machines.length} Machines · ${summary?.totalKw ?? 0} kW`, 'IEC 60364-5-52 · IEC 60364-4-43 · IEC 60364-5-54 · IEC 60502-1 · IEC 62444', body, `Cable-BOM-${proj.smdbId}-${date}.pdf`);
  };

  // ── Export Formatted Excel — SpreadsheetML (guaranteed 2-sheet .xls) ──
  const handleExcel = () => {
    const bCols = showCost ? 8 : 6;
    const mCols = 16;

    // XML-safe string
    const xe = (v: string | number) =>
      String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    // Cell builder
    const C = (sid: string, val: string | number, merge = 0) => {
      const ma = merge > 0 ? ` ss:MergeAcross="${merge}"` : '';
      return `<Cell ss:StyleID="${sid}"${ma}><Data ss:Type="String">${xe(val)}</Data></Cell>`;
    };
    const R = (...cells: string[]) => `<Row>${cells.join('')}</Row>\n`;
    const ER = () => `<Row ss:AutoFitHeight="0"><Cell/></Row>\n`;

    // Border fragments
    const brdL = `<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/></Borders>`;

    // Style factory — SpreadsheetML required order: Alignment → Borders → Font → Interior
    const sty = (id: string, align: string, fg: string, bg: string, sz: number, bold: boolean, italic: boolean, borders: string) =>
      `<Style ss:ID="${id}"><Alignment ss:Horizontal="${align}" ss:Vertical="Center" ss:WrapText="1"/>${borders || '<Borders/>'}<Font ss:Color="${fg}" ss:Size="${sz}" ss:Name="Arial"${bold?' ss:Bold="1"':''}${italic?' ss:Italic="1"':''}/><Interior ss:Color="${bg}" ss:Pattern="Solid"/></Style>`;

    const hdr = (id: string, align: string, fg: string, bg: string) =>
      sty(id, align, fg, bg, 9, true, false, '');

    const dat = (id: string, align: string, fg: string, bg: string, bold = false, sz = 9) =>
      sty(id, align, fg, bg, sz, bold, false, brdL);

    const catBg: Record<string,string> = {
      A:'#DBEAFE',B:'#D1FAE5',C:'#EDE9FE',D:'#E0E7FF',E:'#CFFAFE',F:'#FED7AA',
      G:'#FEF3C7',H:'#F1F5F9',I:'#FEE2E2',J:'#FFE4E6',K:'#FEF9C3',M:'#F8FAFC',
    };
    const catFg: Record<string,string> = {
      A:'#1E40AF',B:'#065F46',C:'#5B21B6',D:'#3730A3',E:'#0E7490',F:'#9A3412',
      G:'#92400E',H:'#334155',I:'#991B1B',J:'#9F1239',K:'#854D0E',M:'#475569',
    };

    const styles = `<Styles>
      <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Borders/><Font ss:Name="Arial" ss:Size="10" ss:Color="#000000"/><Interior/><NumberFormat/><Protection/></Style>
      ${sty('s_title','Center','#FFFFFF','#1E3A8A',16,true,false,'')}
      ${sty('s_sub','Center','#93C5FD','#1D4E89',10,true,false,'')}
      ${sty('s_info','Left','#1E40AF','#EFF6FF',9,false,false,'')}
      ${sty('s_std','Left','#64748B','#F8FAFC',8,false,true,'')}
      ${hdr('ch_bl','Left','#FFFFFF','#1E3A8A')}
      ${hdr('ch_br','Right','#FFFFFF','#1E3A8A')}
      ${hdr('ch_bc','Center','#FFFFFF','#1E3A8A')}
      ${hdr('ch_gbl','Left','#FFFFFF','#155E3A')}
      ${hdr('ch_gbr','Right','#FFFFFF','#155E3A')}
      ${hdr('ch_gbc','Center','#FFFFFF','#155E3A')}
      ${hdr('sh_blue','Center','#93C5FD','#1E3A8A')}
      ${hdr('sh_green','Center','#6EE7B7','#064E3B')}
      ${hdr('sec_teal','Left','#FFFFFF','#064E3B')}
      ${hdr('sec_brn','Left','#FFFFFF','#78350F')}
      ${hdr('sec_blue','Left','#FFFFFF','#1E3A8A')}
      ${dat('d0l','Left','#1A1A2E','#FFFFFF')}
      ${dat('d1l','Left','#1A1A2E','#F0F7FF')}
      ${dat('d0r','Right','#1A1A2E','#FFFFFF')}
      ${dat('d1r','Right','#1A1A2E','#F0F7FF')}
      ${dat('d0c','Center','#1A1A2E','#FFFFFF')}
      ${dat('d1c','Center','#1A1A2E','#F0F7FF')}
      ${dat('tg0','Left','#4338CA','#FFFFFF',true)}
      ${dat('tg1','Left','#4338CA','#F0F7FF',true)}
      ${dat('dc0','Right','#DC2626','#FFFFFF',true)}
      ${dat('dc1','Right','#DC2626','#F0F7FF',true)}
      ${dat('e0l','Left','#065F46','#F0FDF4')}
      ${dat('e1l','Left','#065F46','#DCFCE7')}
      ${dat('e0r','Right','#065F46','#F0FDF4')}
      ${dat('e1r','Right','#065F46','#DCFCE7')}
      ${dat('e0c','Center','#065F46','#F0FDF4')}
      ${dat('e1c','Center','#065F46','#DCFCE7')}
      ${dat('etg0','Left','#059669','#F0FDF4',true)}
      ${dat('etg1','Left','#059669','#DCFCE7',true)}
      ${dat('sz0','Right','#1E40AF','#F0FDF4',true)}
      ${dat('sz1','Right','#1E40AF','#DCFCE7',true)}
      ${dat('gld0','Center','#7C3AED','#F0FDF4',true)}
      ${dat('gld1','Center','#7C3AED','#DCFCE7',true)}
      ${dat('ct0','Left','#0369A1','#F0FDF4')}
      ${dat('ct1','Left','#0369A1','#DCFCE7')}
      ${dat('vd0','Right','#166534','#F0FDF4',true)}
      ${dat('vd1','Right','#166534','#DCFCE7',true)}
      ${dat('vdf0','Right','#991B1B','#FEE2E2',true)}
      ${dat('vdf1','Right','#991B1B','#FEE2E2',true)}
      ${dat('st_pass','Center','#166534','#DCFCE7',true,9)}
      ${dat('st_fail','Center','#991B1B','#FEE2E2',true,9)}
      ${dat('st_warn','Center','#92400E','#FEF3C7',true,9)}
      ${dat('st_def','Center','#374151','#F3F4F6',true,9)}
      ${dat('nc_err','Left','#991B1B','#FEF2F2')}
      ${dat('qty_r','Right','#1E40AF','#FFFFFF',true,10)}
      ${dat('qty_rs','Right','#1E40AF','#F8FAFC',true,10)}
      ${dat('kpi_l','Left','#374151','#F0F7FF',true)}
      ${dat('kpi_v','Center','#1E40AF','#DBEAFE',true)}
      ${dat('tot_l','Right','#FFFFFF','#1E3A8A',true,9.5)}
      ${dat('tot_v','Right','#FCD34D','#1E3A8A',true,11)}
      ${Object.keys(catBg).map(k =>
        `${dat(`catk_${k}`,'Center',catFg[k],catBg[k],true,9.5)}${dat(`catl_${k}`,'Left',catFg[k],catBg[k],true,9)}`
      ).join('\n      ')}
    </Styles>`;

    const stSid = (s: string) => ({ PASS:'st_pass', FAIL:'st_fail', WARNING:'st_warn' }[s] ?? 'st_def');
    const ck = (code: string) => Object.keys(catBg).includes(code) ? code : 'M';

    const titleRows = (cols: number, subtitle: string) =>
      R(C('s_title', `CABLE BILL OF MATERIALS — ${proj.smdbId}`, cols - 1)) +
      R(C('s_sub', subtitle, cols - 1)) +
      R(C('s_info', `Project: ${proj.projectName || '—'}  |  Engineer: ${proj.engineer || '—'}  |  SMDB: ${proj.smdbId}  |  Date: ${proj.date}  |  Rev: ${proj.rev}`, cols - 1)) +
      R(C('s_std', `IEC 60364-5-52 · IEC 60364-4-43 · IEC 60364-5-54 · IEC 60502-1 · IEC 62444  |  Generated: ${new Date().toLocaleDateString('en-IN')} — ElecCalc Pro`, cols - 1)) +
      ER();

    // ═══ SHEET 1 — Machine-wise Cable Schedule ═══
    let s1 = titleRows(mCols, 'SHEET 1 OF 2 — MACHINE-WISE CABLE SCHEDULE');
    s1 += R(C('sec_teal', '| MACHINE-WISE CABLE SCHEDULE', mCols - 1));
    s1 += R(C('sh_blue', 'POWER CABLE', 7), C('sh_green', 'EARTH CABLE', 7));
    s1 += R(
      C('ch_bl','Tag'), C('ch_bl','Machine Name'), C('ch_bl','Type'), C('ch_br','kW'),
      C('ch_br','Voltage'), C('ch_br','FLC (A)'), C('ch_br','Design I (A)'), C('ch_bc','Runs'),
      C('ch_gbr','Size (mm2)'), C('ch_gbl','Cable Description'),
      C('ch_gbr','Length (m)'), C('ch_gbr','VD%'),
      C('ch_gbc','Gland'), C('ch_gbl','Cable Tag No.'),
      C('ch_gbr','Purchase Qty (m)'), C('ch_gbc','Status'),
    );
    machines.forEach((m, i) => {
      const c = effectiveCalcs.get(m.id);
      const ev = i % 2 === 0;
      const dl = ev?'d0l':'d1l', dr = ev?'d0r':'d1r', dc = ev?'d0c':'d1c';
      const el = ev?'e0l':'e1l', er = ev?'e0r':'e1r', ec = ev?'e0c':'e1c';
      const tg = ev?'tg0':'tg1', etg = ev?'etg0':'etg1';
      const sz = ev?'sz0':'sz1', gld = ev?'gld0':'gld1';
      const ct = ev?'ct0':'ct1', dc2 = ev?'dc0':'dc1';
      if (!c) {
        s1 += R(C(tg,m.tag), C(dl,m.name||m.equipType), C(dl,m.equipType), C(dr,m.kw), C(dl,`${m.voltage}V`), C('nc_err','Not calculated',10));
        return;
      }
      const vdSid = c.vdStatus==='PASS' ? (ev?'vd0':'vd1') : (ev?'vdf0':'vdf1');
      s1 += R(
        C(tg, m.tag), C(dl, m.name||m.equipType), C(dl, m.equipType),
        C(dr, m.kw), C(dl, `${m.voltage}V`),
        C(dr, c.flc.toFixed(2)), C(dc2, c.designCurrent.toFixed(2)), C(dc, String(c.numRuns)),
        C(sz, `${c.cableSize} mm2`), C(el, c.cableDesc),
        C(er, `${m.cableLength} m`), C(vdSid, `${c.vdPct.toFixed(2)}%`),
        C(gld, `${c.glandType}/${c.glandSize}`), C(ct, c.powerTagMotor),
        C(er, `${c.powerPurchaseQty} m`), C(stSid(c.overallStatus), c.overallStatus),
      );
      if (m.earthArrangement === 'Separate Earth' && c.earthDesc && c.earthDesc !== '—') {
        s1 += R(
          C(etg, m.tag),
          C(el, '↳ Earth Cable (IEC 60364-5-54)', 6),
          C(sz, c.earthDesc.split(' ')[0] || ''),
          C(el, c.earthDesc), C(er, `${m.cableLength} m`),
          C(ec, ''), C(ec, ''),
          C(ct, c.earthTagMotor), C(er, `${c.earthPurchaseQty} m`), C(ec, ''),
        );
      }
    });

    // ═══ SHEET 2 — Consolidated Purchase BOM ═══
    let s2 = titleRows(bCols, 'SHEET 2 OF 2 — CONSOLIDATED PURCHASE BOM');
    s2 += R(C('sec_brn', '| CONSOLIDATED PURCHASE BOM', bCols - 1));
    s2 += R(
      C('ch_bc','Cat'), C('ch_bl','Category'), C('ch_bl','Description'), C('ch_bl','Specification'),
      C('ch_bc','Unit'), C('ch_br','Quantity'),
      ...(showCost ? [C('ch_br','Unit Rate'), C('ch_br','Total Cost')] : []),
    );
    consolidatedBOM.forEach((b, i) => {
      const k = ck(b.catCode);
      const ev = i % 2 === 0;
      const dl = ev?'d0l':'d1l', dr = ev?'d0r':'d1r', dc = ev?'d0c':'d1c';
      const qSid = ev?'qty_r':'qty_rs';
      s2 += R(
        C(`catk_${k}`, b.catCode), C(`catl_${k}`, b.category),
        C(dl, b.description), C(dl, b.spec), C(dc, b.unit), C(qSid, String(b.qty)),
        ...(showCost ? [
          C(dr, b.unitRate > 0 ? b.unitRate.toFixed(2) : '—'),
          C(dr, b.unitRate > 0 ? (b.qty * b.unitRate).toFixed(2) : '—'),
        ] : []),
      );
    });
    if (showCost) {
      const totalCost = consolidatedBOM.reduce((s, b) => s + b.qty * b.unitRate, 0);
      if (totalCost > 0)
        s2 += R(C('tot_l', 'TOTAL BOM COST', bCols - 2), C('tot_v', totalCost.toFixed(2)));
    }
    if (summary) {
      s2 += ER();
      s2 += R(C('sec_blue', '| PROJECT SUMMARY', bCols - 1));
      const pad = bCols > 6 ? [C('d0l',''), C('d0l','')] : [];
      s2 += R(C('kpi_l','Total Machines'), C('kpi_v',String(machines.length)), C('kpi_l','Total Load'), C('kpi_v',`${summary.totalKw} kW`), C('kpi_l','Total FLC'), C('kpi_v',`${summary.totalFlc} A`), ...pad);
      s2 += R(C('kpi_l','Power Cable'), C('kpi_v',`${summary.powerCable} m`), C('kpi_l','Earth Cable'), C('kpi_v',`${summary.earthCable} m`), C('kpi_l','Cable Tray'), C('kpi_v',`${summary.tray} m`), ...pad);
    }

    // ── Assemble SpreadsheetML workbook ──
    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:o="urn:schemas-microsoft-com:office:office">
${styles}
<Worksheet ss:Name="Cable Schedule">
<Table ss:DefaultRowHeight="15">
${s1}</Table>
</Worksheet>
<Worksheet ss:Name="Purchase BOM">
<Table ss:DefaultRowHeight="15">
${s2}</Table>
</Worksheet>
</Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Cable-BOM-${proj.smdbId}-${proj.date}.xls`;
    a.click(); URL.revokeObjectURL(url);
  };

  const addManualItem = () => setManualItems(it => [...it, { id: uid(), type: 'Horizontal Bend', description: '', width: '300', height: '75', material: 'Galvanised Steel', qty: 1, unit: 'No', remarks: '' }]);
  const delManualItem = (id: string) => setManualItems(it => it.filter(x => x.id !== id));
  const updManualItem = (item: ManualTrayItem) => setManualItems(it => it.map(x => x.id === item.id ? item : x));

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 800, letterSpacing: '0.02em',
    background: active ? V.bg : 'transparent',
    color: active ? '#3B82F6' : V.txtM,
    borderBottom: active ? `2px solid #3B82F6` : `2px solid transparent`,
  });

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${V.brd}` }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'rgba(99,102,241,.14)', border: '1px solid rgba(99,102,241,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package style={{ width: 26, height: 26, color: '#6366F1' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: V.txt }}>CABLE BOM PRO</h2>
          <p style={{ fontSize: 13, color: V.txtM, marginTop: 3 }}>IEC 60364-5-52 · Full Cable Calculation + Material Take-Off + Purchase BOM Generator · SMDB / MCC Cable Schedule</p>
        </div>
        {hasCalc && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={handleExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(34,197,94,.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,.30)', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              <FileText style={{ width: 15, height: 15 }} /> Excel (.xls)
            </button>
            <button onClick={handlePDF} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              <Download style={{ width: 15, height: 15 }} /> PDF Report
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${V.brd}`, marginBottom: 24 }}>
        <button style={tabStyle(tab === 0)} onClick={() => setTab(0)}><Calculator style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />① Setup & Machines</button>
        <button style={tabStyle(tab === 1)} onClick={() => setTab(1)}><BarChart3 style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />② Cable Results</button>
        <button style={tabStyle(tab === 2)} onClick={() => setTab(2)}><Package style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />③ Purchase BOM</button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — SETUP & MACHINES
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <>
          {/* Project Info */}
          <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Project & SMDB Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><Lbl ch="SMDB / MCC ID" /><input style={inp} value={proj.smdbId} onChange={e => setP('smdbId', e.target.value)} /></div>
              <div><Lbl ch="Machine / Project Name" /><input style={inp} value={proj.projectName} onChange={e => setP('projectName', e.target.value)} /></div>
              <div><Lbl ch="Prepared By" /><input style={inp} value={proj.engineer} onChange={e => setP('engineer', e.target.value)} /></div>
              <div><Lbl ch="Date" /><input style={inp} type="date" value={proj.date} onChange={e => setP('date', e.target.value)} /></div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 6 }}>Engineering Basis — Applied to All Machines</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 10 }}>
              <div><Lbl ch="Ambient Temp (°C)" hint="Temperature at cable installation location" /><input style={inp} type="number" value={proj.ambientTemp} onChange={e => setPN('ambientTemp', e.target.value)} /></div>
              <div><Lbl ch="Cables per Group" hint="Number of cables touching in same tray/conduit" /><input style={inp} type="number" value={proj.groupN} onChange={e => setPN('groupN', e.target.value)} min={1} max={9} /></div>
              <div><Lbl ch="VD Limit (%)" hint="Max permissible voltage drop — IEC 60364-5-52: 5% power" /><input style={inp} type="number" value={proj.vdLimit} onChange={e => setPN('vdLimit', e.target.value)} min={1} max={10} /></div>
              <div><Lbl ch="Design Factor (%)" hint="IEC 60364-4-43: 125% for continuous motor loads" /><input style={inp} type="number" value={proj.designFactor} onChange={e => setPN('designFactor', e.target.value)} /></div>
              <div><Lbl ch="Default Wastage (%)" hint="Purchase/installation allowance" /><input style={inp} type="number" value={proj.defaultWastage} onChange={e => setPN('defaultWastage', e.target.value)} /></div>
              <div><Lbl ch="Fault Current (kA)" hint="Prospective short-circuit current — for SC withstand check. Leave 0 to show VERIFY." /><input style={inp} type="number" value={proj.faultCurrentKA} onChange={e => setPN('faultCurrentKA', e.target.value)} step={0.1} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
              <div><Lbl ch="Default Installation Method" /><SelWrap><select style={sel} value={proj.installMethod} onChange={e => setP('installMethod', e.target.value)}>
                {Object.keys(INSTALL_Cf).map(k => <option key={k}>{k}</option>)}
              </select></SelWrap></div>
              <div><Lbl ch="Tray Route Length (m)" hint="Total cable tray route from SMDB to furthest load" /><input style={inp} type="number" value={proj.trayRouteLength} onChange={e => setPN('trayRouteLength', e.target.value)} /></div>
              <div><Lbl ch="Tray Piece Length (m)" hint="Standard tray section length" /><SelWrap><select style={sel} value={proj.trayPieceLength} onChange={e => setP('trayPieceLength', parseFloat(e.target.value))}>
                <option value={2}>2.0 m</option><option value={2.5}>2.5 m</option><option value={3}>3.0 m</option>
              </select></SelWrap></div>
              <div><Lbl ch="Tray Fill %" hint="Max fill ratio of tray cross-section (IEC 61084: 40%)" /><input style={inp} type="number" value={proj.trayFillPct} onChange={e => setPN('trayFillPct', e.target.value)} min={20} max={60} /></div>
            </div>
          </div>

          {/* Machine List */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 800, color: V.txt }}>Machines / Loads — {proj.smdbId}</span>
              <span style={{ fontSize: 13, color: V.txtM, marginLeft: 12 }}>{machines.length} machine{machines.length !== 1 ? 's' : ''} entered</span>
            </div>
            <button onClick={addMachine} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(37,99,235,.12)', color: '#3B82F6', border: '1px solid rgba(37,99,235,.30)', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              <Plus style={{ width: 15, height: 15 }} /> Add Another Machine
            </button>
          </div>

          {machines.map((m, i) => (
            <MachineForm key={m.id} m={m} idx={i} proj={proj} onChange={updMachine} onDelete={() => delMachine(m.id)} />
          ))}

          {/* Calculate Button */}
          <button onClick={runCalcAll} style={{ width: '100%', height: 56, marginTop: 16, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', fontSize: 17, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Calculator style={{ width: 22, height: 22 }} />
            Calculate All Cables & Generate BOM — {machines.length} Machine{machines.length !== 1 ? 's' : ''}
          </button>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — CABLE RESULTS
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <>
          {!hasCalc ? (
            <div style={{ textAlign: 'center', padding: 60, background: V.surf, borderRadius: 16, border: `1.5px dashed ${V.brd}` }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 15, color: V.txtM }}>Add machines in Setup and click Calculate</div>
            </div>
          ) : (
            <>
              {/* SMDB Summary Banner */}
              {summary && (
                <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(37,99,235,.08))', border: '1px solid rgba(99,102,241,.30)', borderRadius: 14, padding: '18px 24px', marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#6366F1', marginBottom: 12 }}>SMDB SUMMARY — {proj.smdbId}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {[
                      ['Total Machines', String(machines.length)],
                      ['Total Power', `${summary.totalKw} kW`],
                      ['Total FLC', `${summary.totalFlc} A`],
                      ['Power Cable', `${summary.powerCable} m`],
                      ['Earth Cable', `${summary.earthCable} m`],
                      ['Cable Glands', `${summary.glands} No`],
                      ['Cable Tags', `${summary.tags} No`],
                      ['Cable Tray', `${summary.tray} m`],
                      ['Largest Cable', `${summary.maxSize} mm²`],
                      ['Smallest Cable', `${summary.minSize} mm²`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, color: '#A5B4FC', fontWeight: 600, marginBottom: 4 }}>{l}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#E0E7FF' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Machine-wise Cable Schedule Table */}
              <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${V.brd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: V.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Machine-wise Cable Schedule</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#1e3a8a' }}>
                        {['Tag', 'Name', 'kW', 'FLC (A)', 'Cable Size', 'Cable Description', 'Length', 'Runs', 'VD%', 'VD', 'Amp', 'SC', 'Earth Cable', 'Gland', 'Status'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {machines.map((m, i) => {
                        const c = calcs.get(m.id);
                        if (!c) return null;
                        return (
                          <tr key={m.id} style={{ background: i % 2 === 0 ? V.surf : 'transparent', borderBottom: `1px solid ${V.brdM}` }}>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#6366F1' }}>{m.tag}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS }}>{m.name}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: V.txt }}>{m.kw}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS }}>{c.flc.toFixed(1)}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: V.txt }}>{c.cableSize ? `${c.cableSize} mm²` : 'ERROR'}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS, whiteSpace: 'nowrap' }}>{c.cableDesc}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS }}>{m.cableLength} m</td>
                            <td style={{ padding: '8px 12px', color: V.txtS }}>{c.numRuns}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: c.vdStatus === 'PASS' ? '#10B981' : '#EF4444' }}>{c.vdPct.toFixed(2)}%</td>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={c.vdStatus} /></td>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={c.ampStatus} /></td>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={c.scStatus} /></td>
                            <td style={{ padding: '8px 12px', color: V.txtS, whiteSpace: 'nowrap' }}>{c.earthDesc}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS }}>{c.glandType}/{c.glandSize}</td>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={c.overallStatus} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-machine detailed cards */}
              <div style={{ fontSize: 14, fontWeight: 800, color: V.txt, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>Detailed Calculation Results</div>
              {machines.map(m => {
                const c = calcs.get(m.id);
                if (!c) return null;
                return <MachineResultCard key={m.id} m={m} c={c} />;
              })}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — PURCHASE BOM
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <>
          {!hasCalc ? (
            <div style={{ textAlign: 'center', padding: 60, background: V.surf, borderRadius: 16, border: `1.5px dashed ${V.brd}` }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 15, color: V.txtM }}>Run calculations first to generate BOM</div>
            </div>
          ) : (
            <>
              {/* BOM Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: V.txt }}>Consolidated Purchase BOM — {proj.smdbId}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: V.txtM, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showCost} onChange={e => setShowCost(e.target.checked)} />
                    Show Costing
                  </label>
                  <button onClick={handleExcel} style={{ padding: '8px 16px', background: 'rgba(34,197,94,.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,.30)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText style={{ width: 13, height: 13 }} /> Excel
                  </button>
                  <button onClick={handlePDF} style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download style={{ width: 13, height: 13 }} /> PDF
                  </button>
                </div>
              </div>

              {/* SMDB Summary */}
              {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { l: 'Total Machines', v: String(machines.length), c: '#6366F1' },
                    { l: 'Total Power', v: `${summary.totalKw} kW`, c: '#3B82F6' },
                    { l: 'Power Cable', v: `${summary.powerCable} m`, c: '#10B981' },
                    { l: 'Earth Cable', v: `${summary.earthCable} m`, c: '#F59E0B' },
                    { l: 'Cable Glands', v: `${summary.glands} No`, c: '#7C3AED' },
                    { l: 'Cable Tags', v: `${summary.tags} No`, c: '#0891B2' },
                    { l: 'Cable Tray', v: `${summary.tray} m`, c: '#F97316' },
                    { l: 'Tray Cover', v: `${summary.tray} m`, c: '#DC2626' },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 10, padding: '12px 16px', borderLeft: `4px solid ${c}` }}>
                      <div style={{ fontSize: 11, color: V.txtM, fontWeight: 600, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── BOM Quick Edits ── */}
              <div style={{ background: V.bg, border: '1px solid rgba(99,102,241,.40)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '12px 18px', background: 'rgba(99,102,241,.08)', borderBottom: '1px solid rgba(99,102,241,.22)' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#4338CA' }}>⚡ BOM Quick Edits</span>
                  <span style={{ fontSize: 12, color: '#6366F1', marginLeft: 12 }}>Adjust cable tag, tray spec and cable sizes before final download — BOM regenerates instantly</span>
                </div>
                <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* ── Cable Tag Section ── */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0891B2', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0891B2', display: 'inline-block' }} />
                      Cable Tags (Cat E)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <Lbl ch="Tag Type" />
                        <SelWrap>
                          <select style={sel} value={proj.tagType} onChange={e => setP('tagType', e.target.value)}>
                            <option>Stainless Steel Tie Tag</option>
                            <option>Aluminium Tie Tag</option>
                            <option>PVC Cable Marker</option>
                            <option>Plastic Clip-on Tag</option>
                            <option>Embossed Aluminium</option>
                            <option>Engraved Brass</option>
                          </select>
                        </SelWrap>
                      </div>
                      <div>
                        <Lbl ch="Tag Brand" />
                        <SelWrap>
                          <select style={sel} value={proj.tagBrand} onChange={e => setP('tagBrand', e.target.value)}>
                            <option>Brady</option>
                            <option>Partex</option>
                            <option>HellermannTyton</option>
                            <option>Grafoplast</option>
                            <option>Phoenix Contact</option>
                            <option>Custom / Local</option>
                          </select>
                        </SelWrap>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(8,145,178,.07)', border: '1px solid rgba(8,145,178,.20)', fontSize: 11, color: '#0891B2' }}>
                      Preview: <strong>{proj.tagType} / {proj.tagBrand}</strong>
                    </div>
                  </div>

                  {/* ── Cable Tray Section ── */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#F97316', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
                      Cable Tray (Cat F / G / H)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <Lbl ch="Tray Type" />
                        <SelWrap>
                          <select style={sel} value={proj.trayType} onChange={e => setP('trayType', e.target.value)}>
                            <option>Perforated</option>
                            <option>Ladder</option>
                            <option>Solid Bottom</option>
                            <option>Wire Mesh</option>
                            <option>Channel</option>
                          </select>
                        </SelWrap>
                      </div>
                      <div>
                        <Lbl ch="Material" />
                        <SelWrap>
                          <select style={sel} value={proj.trayMaterial} onChange={e => setP('trayMaterial', e.target.value)}>
                            <option>Galvanised Steel</option>
                            <option>Hot Dip Galvanised</option>
                            <option>Stainless Steel 304</option>
                            <option>Stainless Steel 316</option>
                            <option>Aluminium</option>
                            <option>FRP (Fibreglass)</option>
                          </select>
                        </SelWrap>
                      </div>
                      <div>
                        <Lbl ch="Tray Height (mm)" />
                        <SelWrap>
                          <select style={sel} value={proj.trayHeight} onChange={e => setP('trayHeight', parseInt(e.target.value))}>
                            {[50, 75, 100, 150].map(h => <option key={h} value={h}>{h} mm</option>)}
                          </select>
                        </SelWrap>
                      </div>
                      <div>
                        <Lbl ch="Width Override" hint="0 = auto-calculated from cable fill" />
                        <SelWrap>
                          <select style={sel} value={proj.trayWidthOverride} onChange={e => setP('trayWidthOverride', parseInt(e.target.value))}>
                            <option value={0}>Auto (from cable fill)</option>
                            {[100, 150, 225, 300, 450, 600, 750, 900].map(w => <option key={w} value={w}>{w} mm</option>)}
                          </select>
                        </SelWrap>
                      </div>
                    </div>
                    <div style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(249,115,22,.07)', border: '1px solid rgba(249,115,22,.20)', fontSize: 11, color: '#C2410C' }}>
                      Preview: <strong>Cable Tray ({proj.trayType})</strong> — {proj.trayWidthOverride > 0 ? proj.trayWidthOverride : 'Auto'}mm W × {proj.trayHeight}mm H × {proj.trayPieceLength}m L <strong>{proj.trayMaterial}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Cable Size Override Panel ── */}
              <div style={{ background: V.bg, border: '1px solid rgba(245,158,11,.40)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(245,158,11,.08)', borderBottom: '1px solid rgba(245,158,11,.25)' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#92400E' }}>✏ Cable Size Override</span>
                    <span style={{ fontSize: 12, color: '#B45309', marginLeft: 12 }}>Select next size if required — gland, OD and earth cable update automatically</span>
                  </div>
                  {Object.keys(cableOverrides).length > 0 && (
                    <button onClick={() => setCableOverrides({})} style={{ padding: '5px 12px', background: 'rgba(239,68,68,.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,.30)', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Reset All Overrides
                    </button>
                  )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'rgba(245,158,11,.06)' }}>
                        {['Tag', 'Machine', 'Calculated Cable', 'Override Cable Size', 'New OD', 'New Gland', 'New Earth Cable', 'VD%', 'Amp Status', 'Status'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: V.txtM, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {machines.map((m, i) => {
                        const c = calcs.get(m.id);
                        if (!c || c.cableSize === 0) return null;
                        const isOverridden = cableOverrides[m.id] !== undefined && cableOverrides[m.id] !== c.cableSizeIdx;
                        const ec = effectiveCalcs.get(m.id) ?? c;
                        const aKey = ampKey(m.cableInsulation, m.conductor);
                        const ampTable = AMP[aKey] ?? AMP['XLPE-Cu'];
                        const currentOverrideIdx = cableOverrides[m.id] ?? c.cableSizeIdx;
                        return (
                          <tr key={m.id} style={{ borderBottom: `1px solid ${V.brdM}`, background: isOverridden ? 'rgba(245,158,11,.05)' : i % 2 === 0 ? V.surf : 'transparent' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#6366F1' }}>{m.tag}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS }}>{m.name || m.equipType}</td>
                            <td style={{ padding: '8px 12px', color: V.txtM, fontSize: 11 }}>{c.cableDesc}</td>
                            <td style={{ padding: '8px 12px', minWidth: 200 }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <SelWrap>
                                  <select
                                    style={{ ...sel, height: 34, fontSize: 12, border: isOverridden ? '2px solid #F59E0B' : `1px solid ${V.brdB}`, background: isOverridden ? 'rgba(245,158,11,.08)' : V.inp }}
                                    value={currentOverrideIdx}
                                    onChange={e => {
                                      const newIdx = parseInt(e.target.value);
                                      if (newIdx === c.cableSizeIdx) {
                                        const n = { ...cableOverrides }; delete n[m.id]; setCableOverrides(n);
                                      } else {
                                        setCableOverrides(prev => ({ ...prev, [m.id]: newIdx }));
                                      }
                                    }}
                                  >
                                    {SIZES.map((s, idx) => {
                                      if (!ampTable[idx]) return null;
                                      return (
                                        <option key={s} value={idx}>
                                          {s} mm²{idx === c.cableSizeIdx ? ' ★ Calculated' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </SelWrap>
                                {isOverridden && (
                                  <button onClick={() => { const n = { ...cableOverrides }; delete n[m.id]; setCableOverrides(n); }} style={{ padding: '3px 8px', background: 'rgba(239,68,68,.12)', color: '#EF4444', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>↩ Reset</button>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', color: V.txtS, fontWeight: 600 }}>{ec.cableOD ? `~${ec.cableOD} mm` : '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: isOverridden ? '#F59E0B' : V.txt }}>{ec.glandType}/{ec.glandSize}</td>
                            <td style={{ padding: '8px 12px', color: V.txtS, fontSize: 11 }}>{ec.earthDesc}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: ec.vdStatus === 'PASS' ? '#10B981' : '#EF4444' }}>{ec.vdPct.toFixed(2)}%</td>
                            <td style={{ padding: '8px 12px' }}><StatusBadge status={ec.ampStatus} /></td>
                            <td style={{ padding: '8px 12px' }}>
                              {isOverridden
                                ? <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#92400E' }}>⚠ Overridden</span>
                                : <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: '#D1FAE5', color: '#065F46' }}>✓ Calculated</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── BOM by Category ── */}
              {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'M'] as const).map(cat => {
                const items = consolidatedBOM.filter(b => b.catCode === cat);
                if (!items.length) return null;
                const catLabels: Record<string, string> = { A: 'Power Cables', B: 'Earth Cables', C: 'Cable Glands', D: 'Gland Accessories', E: 'Cable Tags', F: 'Cable Tray', G: 'Cable Tray Cover', H: 'Tray Accessories', I: 'Tray Bends', J: 'T-Trays', K: 'Cross / Reducer', M: 'Miscellaneous' };
                const catColors: Record<string, string> = { A: '#3B82F6', B: '#10B981', C: '#7C3AED', D: '#6366F1', E: '#0891B2', F: '#F97316', G: '#F59E0B', H: '#64748B', I: '#DC2626', J: '#E11D48', K: '#D97706', M: '#475569' };
                const totalCost = items.reduce((s, b) => s + b.qty * b.unitRate, 0);
                return (
                  <div key={cat} style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: `${catColors[cat]}10`, borderBottom: `1px solid ${catColors[cat]}30` }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: catColors[cat] }}>{cat}. {catLabels[cat]}</span>
                      {showCost && totalCost > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: catColors[cat] }}>Total: {totalCost.toFixed(2)}</span>}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: `${catColors[cat]}08` }}>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Description</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Specification</th>
                          <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Unit</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Qty</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Source</th>
                          {showCost && <>
                            <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Unit Rate</th>
                            <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: V.txtM, textTransform: 'uppercase' }}>Total</th>
                          </>}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((b, i) => (
                          <tr key={b.id} style={{ borderBottom: `1px solid ${V.brdM}`, background: i % 2 === 0 ? V.surf : 'transparent' }}>
                            <td style={{ padding: '9px 14px', fontWeight: 700, color: V.txt }}>{b.description}</td>
                            <td style={{ padding: '9px 14px', color: V.txtS }}>{b.spec}</td>
                            <td style={{ padding: '9px 14px', color: V.txtM, textAlign: 'center' }}>{b.unit}</td>
                            <td style={{ padding: '9px 14px', fontWeight: 800, color: catColors[cat], textAlign: 'right' }}>{b.qty}</td>
                            <td style={{ padding: '9px 14px', color: V.txtM, fontSize: 11 }}>{b.source}</td>
                            {showCost && <>
                              <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                                <input type="number" value={bomRates.get(b.id) ?? b.unitRate} onChange={e => { const m = new Map(bomRates); m.set(b.id, parseFloat(e.target.value) || 0); setBomRates(m); }} style={{ ...inp, width: 80, height: 30, textAlign: 'right', fontSize: 12 }} />
                              </td>
                              <td style={{ padding: '9px 14px', fontWeight: 700, color: V.txt, textAlign: 'right' }}>{((bomRates.get(b.id) ?? b.unitRate) * b.qty).toFixed(2)}</td>
                            </>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Manual Tray Accessories */}
              <div style={{ background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(71,85,105,.10)', borderBottom: `1px solid ${V.brdM}` }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: V.txt }}>+ Manual Tray Accessories — Bends, Tees, Custom Items</span>
                  <button onClick={addManualItem} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(37,99,235,.12)', color: '#3B82F6', border: '1px solid rgba(37,99,235,.30)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Plus style={{ width: 12, height: 12 }} /> Add Item
                  </button>
                </div>
                {manualItems.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: V.txtM, fontSize: 13 }}>
                    Click "Add Item" to add horizontal bends, vertical bends, T-trays, reducers, custom items...
                  </div>
                )}
                {manualItems.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px 80px 1fr 60px 60px 1fr auto', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${V.brdM}`, alignItems: 'end' }}>
                    <div>
                      <Lbl ch="Type" />
                      <SelWrap><select style={sel} value={item.type} onChange={e => updManualItem({ ...item, type: e.target.value })}>
                        {['Horizontal Bend', 'Vertical Bend', 'Inside Bend', 'Outside Bend', 'T-Tray', 'Cross', 'Reducer', 'Tray Joint', 'Tray Support', 'Hanger', 'Custom'].map(t => <option key={t}>{t}</option>)}
                      </select></SelWrap>
                    </div>
                    <div><Lbl ch="Description" /><input style={inp} value={item.description} onChange={e => updManualItem({ ...item, description: e.target.value })} placeholder={item.type} /></div>
                    <div><Lbl ch="Width (mm)" /><input style={inp} value={item.width} onChange={e => updManualItem({ ...item, width: e.target.value })} /></div>
                    <div><Lbl ch="Height (mm)" /><input style={inp} value={item.height} onChange={e => updManualItem({ ...item, height: e.target.value })} /></div>
                    <div><Lbl ch="Material" /><input style={inp} value={item.material} onChange={e => updManualItem({ ...item, material: e.target.value })} /></div>
                    <div><Lbl ch="Qty" /><input style={inp} type="number" value={item.qty} onChange={e => updManualItem({ ...item, qty: parseInt(e.target.value) || 1 })} min={1} /></div>
                    <div><Lbl ch="Unit" /><SelWrap><select style={sel} value={item.unit} onChange={e => updManualItem({ ...item, unit: e.target.value })}>
                      {['No', 'Set', 'm', 'Lot'].map(u => <option key={u}>{u}</option>)}
                    </select></SelWrap></div>
                    <div><Lbl ch="Remarks" /><input style={inp} value={item.remarks} onChange={e => updManualItem({ ...item, remarks: e.target.value })} /></div>
                    <button onClick={() => delManualItem(item.id)} style={{ padding: '6px 8px', background: 'rgba(239,68,68,.12)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}><Trash2 style={{ width: 13, height: 13 }} /></button>
                  </div>
                ))}
              </div>

              {/* Engineering Standards Footer */}
              <div style={{ padding: '14px 18px', background: 'rgba(37,99,235,.06)', borderRadius: 12, border: '1px solid rgba(37,99,235,.20)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Info style={{ width: 14, height: 14 }} /> Calculation Basis & Standards
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: V.txtM }}>
                  {[
                    ['Cable Rating', `IEC 60364-5-52 Table B.52.2 — Method E (Free Air / Tray) — ${proj.ambientTemp}°C ambient`],
                    ['Overcurrent', `IEC 60364-4-43 Cl.433.1 — Design factor ${proj.designFactor}% for continuous loads`],
                    ['Voltage Drop', `IEC 60364-5-52 Cl.525 — Limit: ${proj.vdLimit}% from supply origin`],
                    ['Earthing', 'IEC 60364-5-54 Table 54.3 — PE conductor sizing (Cu min 6mm², Al min 16mm²)'],
                    ['Cable Construction', 'IEC 60502-1 — XLPE/PVC power cables, IEC 60228 — Standard conductor sizes'],
                    ['Cable Glands', 'IEC 62444 — Gland selection by actual cable OD and armour type'],
                    ['Short-Circuit', 'IEC 60949 — Adiabatic: I_sc = k·S/√t (k=143 Cu XLPE, 115 Cu PVC)'],
                    ['Cable Tray', 'IEC 61084-1 — Max fill ratio 40% of tray cross-sectional area'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <span style={{ fontWeight: 700, color: '#3B82F6' }}>{l}: </span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
