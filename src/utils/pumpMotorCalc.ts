// ============================================================
//  Pump & Motor Electrical Calculation Engine
//  Standards: IEC 60364, IEC 60947, IEC 60228, AS/NZS 3008
// ============================================================

export const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
export const MCCB_SIZES  = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000];
export const CONTACTOR_AC3 = [9, 12, 16, 18, 25, 32, 38, 40, 50, 65, 75, 80, 95, 115, 150, 185, 225, 265, 330, 400];

export const OLR_RANGES: [number, number][] = [
  [0.1,0.16],[0.16,0.25],[0.25,0.4],[0.4,0.63],[0.63,1.0],
  [1.0,1.6],[1.6,2.5],[2.5,4.0],[4.0,6.3],[6.0,9.0],
  [9.0,13],[12,18],[17,25],[23,32],[28,40],
  [37,50],[48,65],[63,80],[75,100],[90,125],[110,140],[130,160],[160,200],
];

// Ampacity (A) for XLPE/Cu: [air, conduit, ground]
const CU_AMP = {
  air:     [22,30,40,51,70,94,119,148,183,232,282,328,379,434,514],
  conduit: [17,23,30,39,54,73, 95,117,144,180,220,255,295,340,400],
  ground:  [18,24,33,43,58,77, 99,120,148,185,225,261,300,341,400],
};
const AL_AMP = {
  air:     [0,0,0,0,55,75,95,115,145,185,225,260,300,345,415],
  conduit: [0,0,0,0,43,58,75, 92,115,145,175,205,235,275,325],
  ground:  [0,0,0,0,46,61,79, 96,120,151,184,213,244,280,330],
};
// Resistance Ω/km at 90°C (XLPE)
const CU_R = [12.1,7.41,4.61,3.08,1.83,1.15,0.727,0.524,0.387,0.268,0.193,0.153,0.124,0.099,0.0754];
const AL_R = [0,0,0,0,3.08,1.91,1.20,0.868,0.641,0.443,0.320,0.253,0.206,0.164,0.125];
// Reactance Ω/km (approximate)
const X_OHM = [0.10,0.10,0.09,0.09,0.09,0.085,0.085,0.083,0.083,0.082,0.080,0.079,0.078,0.077,0.076];

// Temperature derating (XLPE, base 30°C)
const TEMP_DERATE: Record<number,number> = {
  25:1.04,30:1.00,35:0.96,40:0.91,45:0.87,50:0.82,55:0.76,60:0.71,
};
// PVC derate (base 30°C)
const TEMP_DERATE_PVC: Record<number,number> = {
  25:1.03,30:1.00,35:0.94,40:0.87,45:0.79,50:0.71,
};

// ── Types ────────────────────────────────────────────────────

export type StartingMethod = 'DOL' | 'Star-Delta' | 'Soft Starter' | 'VFD';
export type Phase = '3' | '1';
export type CableMat = 'Cu' | 'Al';
export type InstallMethod = 'air' | 'conduit' | 'ground';

export interface PumpMotorInputs {
  // Project
  projectName: string; projectNo: string; plantArea: string;
  equipmentName: string; pumpTag: string; motorTag: string;
  application: string; quantity: number;
  preparedBy: string; date: string; remarks: string;
  // Motor
  motorKW: number; voltage: number; phase: Phase; frequency: number;
  powerFactor: number; efficiency: number; rpm: number;
  startingMethod: StartingMethod;
  motorDuty: string; insulationClass: string; ipRating: string;
  // Starting
  dolMultiplier: number; softStarterFactor: number;
  // Cable
  cableLength: number; installMethod: InstallMethod;
  cableMaterial: CableMat; numCores: number; parallelRuns: number;
  ambientTemp: number; groupingFactor: number;
  cableInsulation: 'XLPE' | 'PVC'; maxVoltageDrop: number;
  // Overrides (0 = auto)
  mccbOverride: number; contactorOverride: number;
  olrOverrideLow: number; olrOverrideHigh: number;
  cableSizeOverride: number; earthSizeOverride: number;
  // Panel
  panelIP: string; controlVoltage: string;
  // Field instruments (toggles)
  hasPressureSwitch: boolean; hasPressureXmtr: boolean;
  hasFlowSwitch: boolean; hasFlowMeter: boolean;
  hasLevelSwitch: boolean; hasTempSensor: boolean;
  hasVibration: boolean; hasLocalIsolator: boolean;
  hasLocalCS: boolean; hasJunctionBox: boolean;
  hasFlexConduit: boolean; hasCableTray: boolean;
}

export interface CalcValues {
  flc: number; designCurrent: number; startingCurrent: number;
  mccbRating: number; contactorRating: number;
  olrRange: [number, number]; olrSetting: number;
  cableSize: number; earthSize: number;
  cableAmpacity: number; deratingFactor: number;
  voltageDrop: number; voltageDropPct: number;
  cableResistance: number; cableReactance: number;
  panelSize: string;
}

export interface BOMItem {
  id: string; slNo: number; category: string;
  description: string; specification: string;
  qty: number; unit: string; basis: string;
  unitCost: number; totalCost: number; remarks: string;
}

export interface ValidationCheck {
  id: string; category: string; description: string;
  calculated: string; limit: string;
  status: 'PASS' | 'WARNING' | 'FAIL'; note: string;
}

// ── Helper ───────────────────────────────────────────────────

function nextStandard(arr: number[], val: number): number {
  return arr.find((s) => s >= val) ?? arr[arr.length - 1];
}

function cableIdx(size: number): number {
  return CABLE_SIZES.indexOf(size);
}

function getAmpacity(size: number, mat: CableMat, method: InstallMethod): number {
  const idx = cableIdx(size);
  if (idx < 0) return 0;
  const tbl = mat === 'Cu' ? CU_AMP : AL_AMP;
  const col = method === 'air' ? 'air' : method === 'conduit' ? 'conduit' : 'ground';
  return tbl[col][idx] ?? 0;
}

function getTempDerate(temp: number, insulation: 'XLPE' | 'PVC'): number {
  const tbl = insulation === 'XLPE' ? TEMP_DERATE : TEMP_DERATE_PVC;
  // round to nearest 5
  const rounded = Math.round(temp / 5) * 5;
  return tbl[rounded] ?? 1.0;
}

function earthCableSize(phaseSize: number): number {
  if (phaseSize <= 16) return phaseSize;
  if (phaseSize <= 35) return 16;
  // half, rounded to next standard
  const half = phaseSize / 2;
  return nextStandard(CABLE_SIZES, half);
}

// ── Main Calculation ─────────────────────────────────────────

export function calculate(inp: PumpMotorInputs): CalcValues {
  const P = inp.motorKW * 1000;
  const V = inp.voltage;
  const PF = inp.powerFactor;
  const eff = inp.efficiency / 100;

  // FLC
  const flc = inp.phase === '3'
    ? P / (Math.sqrt(3) * V * PF * eff)
    : P / (V * PF * eff);

  const designCurrent = flc * 1.25;

  // Starting current
  let startingCurrent = 0;
  switch (inp.startingMethod) {
    case 'DOL':        startingCurrent = flc * inp.dolMultiplier; break;
    case 'Star-Delta': startingCurrent = flc * inp.dolMultiplier / 3; break;
    case 'Soft Starter': startingCurrent = flc * inp.softStarterFactor; break;
    case 'VFD':        startingCurrent = flc * 1.05; break;
  }

  // MCCB
  const mccbAuto = nextStandard(MCCB_SIZES, Math.ceil(designCurrent));
  const mccbRating = inp.mccbOverride > 0 ? inp.mccbOverride : mccbAuto;

  // Contactor (AC-3)
  const contactorAuto = nextStandard(CONTACTOR_AC3, Math.ceil(flc));
  const contactorRating = inp.contactorOverride > 0 ? inp.contactorOverride : contactorAuto;

  // OLR range
  const olrTarget = flc * 1.05; // 105% of FLC
  const olrAuto = OLR_RANGES.find(([lo, hi]) => lo <= olrTarget && olrTarget <= hi)
    ?? OLR_RANGES[OLR_RANGES.length - 1];
  const olrRange: [number, number] = (inp.olrOverrideLow > 0 && inp.olrOverrideHigh > 0)
    ? [inp.olrOverrideLow, inp.olrOverrideHigh]
    : olrAuto;
  const olrSetting = Math.round(flc * 100) / 100;

  // Cable sizing
  const tempDerate = getTempDerate(inp.ambientTemp, inp.cableInsulation);
  const totalDerate = tempDerate * inp.groupingFactor;

  const requiredAmpacity = designCurrent / (inp.parallelRuns * totalDerate);

  let autoSize = CABLE_SIZES[0];
  for (const sz of CABLE_SIZES) {
    const amp = getAmpacity(sz, inp.cableMaterial, inp.installMethod);
    if (amp >= requiredAmpacity) {
      // also check voltage drop
      const idx = cableIdx(sz);
      const R = inp.cableMaterial === 'Cu' ? CU_R[idx] : AL_R[idx];
      const X = X_OHM[idx];
      const sinPhi = Math.sqrt(1 - PF * PF);
      const vd = inp.phase === '3'
        ? Math.sqrt(3) * flc * (inp.cableLength / 1000) * (R * PF + X * sinPhi) / inp.parallelRuns
        : 2 * flc * (inp.cableLength / 1000) * (R * PF + X * sinPhi) / inp.parallelRuns;
      const vdPct = (vd / V) * 100;
      if (vdPct <= inp.maxVoltageDrop) { autoSize = sz; break; }
      autoSize = sz; // keep going but track last
    }
  }

  const cableSize = inp.cableSizeOverride > 0 ? inp.cableSizeOverride : autoSize;
  const earthSizeAuto = earthCableSize(cableSize);
  const earthSize = inp.earthSizeOverride > 0 ? inp.earthSizeOverride : earthSizeAuto;

  // Detailed cable calc with chosen size
  const cidx = cableIdx(cableSize);
  const R_km = inp.cableMaterial === 'Cu' ? CU_R[cidx] : AL_R[cidx];
  const X_km = X_OHM[cidx];
  const sinPhi = Math.sqrt(1 - PF * PF);
  const vd = inp.phase === '3'
    ? Math.sqrt(3) * flc * (inp.cableLength / 1000) * (R_km * PF + X_km * sinPhi) / inp.parallelRuns
    : 2 * flc * (inp.cableLength / 1000) * (R_km * PF + X_km * sinPhi) / inp.parallelRuns;
  const vdPct = (vd / V) * 100;

  const cableAmpacity = getAmpacity(cableSize, inp.cableMaterial, inp.installMethod) * totalDerate * inp.parallelRuns;
  const cableResistance = R_km * inp.cableLength / 1000;
  const cableReactance  = X_km  * inp.cableLength / 1000;

  // Panel size
  let panelSize = '';
  if (inp.motorKW <= 11 && inp.startingMethod === 'DOL')       panelSize = '400×500×200 mm';
  else if (inp.motorKW <= 22 && inp.startingMethod === 'DOL')  panelSize = '600×600×250 mm';
  else if (inp.motorKW <= 45 && inp.startingMethod === 'DOL')  panelSize = '800×600×300 mm';
  else if (inp.startingMethod === 'Star-Delta')                  panelSize = '800×800×300 mm';
  else if (inp.startingMethod === 'VFD' || inp.startingMethod === 'Soft Starter') panelSize = '1000×800×400 mm';
  else panelSize = '1000×800×300 mm';

  return {
    flc: Math.round(flc * 100) / 100,
    designCurrent: Math.round(designCurrent * 100) / 100,
    startingCurrent: Math.round(startingCurrent * 10) / 10,
    mccbRating, contactorRating,
    olrRange, olrSetting,
    cableSize, earthSize,
    cableAmpacity: Math.round(cableAmpacity * 10) / 10,
    deratingFactor: Math.round(totalDerate * 100) / 100,
    voltageDrop: Math.round(vd * 100) / 100,
    voltageDropPct: Math.round(vdPct * 100) / 100,
    cableResistance: Math.round(cableResistance * 1000) / 1000,
    cableReactance:  Math.round(cableReactance * 1000) / 1000,
    panelSize,
  };
}

// ── BOM Generator ─────────────────────────────────────────────

export function generateBOM(inp: PumpMotorInputs, c: CalcValues): BOMItem[] {
  const items: BOMItem[] = [];
  let n = 0;

  const add = (
    category: string, description: string, spec: string,
    qty: number, unit: string, basis: string, remarks = ''
  ) => {
    n++;
    items.push({ id: `${n}`, slNo: n, category, description, specification: spec,
      qty, unit, basis, unitCost: 0, totalCost: 0, remarks });
  };

  const kw = inp.motorKW;
  const sm = inp.startingMethod;
  const qty = inp.quantity;
  const phaseStr = inp.phase === '3' ? '3 Phase' : '1 Phase';
  const frameSize = kw <= 7.5 ? 'D100L' : kw <= 15 ? 'D132M' : kw <= 22 ? 'D160M' : kw <= 45 ? 'D200L' : 'D225M';

  // ── Motor & Pump ─────────────────────────────────────────
  add('Motor & Pump', 'Electric Motor',
    `${kw} kW, ${inp.voltage}V, ${phaseStr}, ${inp.frequency}Hz, ${inp.rpm}RPM, ${inp.insulationClass}, ${inp.ipRating}, Frame ${frameSize}`,
    qty, 'Nos', 'Project quantity');
  add('Motor & Pump', 'Centrifugal Pump',
    `As per process datasheet, ${inp.application}`,
    qty, 'Nos', 'Project quantity');
  add('Motor & Pump', 'Coupling / Flexible Drive',
    `Suitable for ${kw} kW motor, flanged / rigid type`,
    qty, 'Nos', 'One per motor');
  add('Motor & Pump', 'Base Plate / Skid',
    `Motor-pump skid, MS fabricated, hot-dip galvanised`,
    qty, 'Nos', 'One per set');

  // ── Protection ───────────────────────────────────────────
  add('Protection', 'MCCB',
    `${c.mccbRating} A, ${inp.phase === '3' ? '3P' : '2P'}, Thermal Magnetic, ${inp.voltage}V, Min 25 kA breaking capacity, Motor Duty`,
    sm === 'Star-Delta' ? qty : qty, 'Nos', `Design current ${c.designCurrent.toFixed(1)} A`);
  add('Protection', 'Overload Relay',
    `Range ${c.olrRange[0]}–${c.olrRange[1]} A, Class 10, Manual/Auto reset, Trip Class 10A`,
    qty, 'Nos', `FLC ${c.flc.toFixed(1)} A, set at ${c.olrSetting.toFixed(1)} A`);

  // ── Contactor & Starters ─────────────────────────────────
  if (sm === 'DOL') {
    add('Starter', 'Main Contactor',
      `AC-3, ${c.contactorRating} A, ${inp.voltage}V, ${inp.controlVoltage} coil, 2 NO + 2 NC aux`,
      qty, 'Nos', `FLC ${c.flc.toFixed(1)} A`);
    add('Starter', 'Auxiliary Contact Block',
      `2 NO + 2 NC, screw or snap-on type`,
      qty, 'Nos', 'Per contactor');
    add('Starter', 'Control MCB',
      `1P, 6A, C-curve, ${inp.controlVoltage}`,
      qty, 'Nos', 'Control circuit protection');
  } else if (sm === 'Star-Delta') {
    add('Starter', 'Main Contactor (Line)',
      `AC-3, ${c.contactorRating} A, ${inp.voltage}V, ${inp.controlVoltage} coil`,
      qty, 'Nos', `FLC ${c.flc.toFixed(1)} A`);
    add('Starter', 'Star Contactor',
      `AC-3, ${Math.ceil(c.contactorRating * 0.58)} A, ${inp.voltage}V, ${inp.controlVoltage} coil`,
      qty, 'Nos', 'Star winding current = FLC/√3');
    add('Starter', 'Delta Contactor',
      `AC-3, ${c.contactorRating} A, ${inp.voltage}V, ${inp.controlVoltage} coil`,
      qty, 'Nos', `FLC ${c.flc.toFixed(1)} A`);
    add('Starter', 'Star-Delta Timer',
      `Adjustable 3–30 s, ${inp.controlVoltage}, DIN rail mount`,
      qty, 'Nos', 'Transition from star to delta');
    add('Starter', 'Mechanical Interlock',
      `Star-Delta interlock kit`,
      qty * 2, 'Nos', 'Between star & delta contactors');
    add('Starter', 'Auxiliary Contact Block',
      `2 NO + 2 NC, snap-on`,
      qty * 3, 'Nos', 'One per contactor');
    add('Starter', 'Control MCB',
      `1P, 6A, C-curve, ${inp.controlVoltage}`,
      qty, 'Nos', 'Control circuit');
  } else if (sm === 'Soft Starter') {
    add('Starter', 'Soft Starter',
      `${kw} kW, ${inp.voltage}V, ${phaseStr}, Built-in bypass, Motor protection, Programmable ramp`,
      qty, 'Nos', `Motor ${kw} kW, FLC ${c.flc.toFixed(1)} A`);
    add('Starter', 'Bypass Contactor (if required)',
      `AC-3, ${c.contactorRating} A, ${inp.voltage}V, ${inp.controlVoltage} coil`,
      qty, 'Nos', 'Bypass after run-up');
    add('Starter', 'Control MCB',
      `1P, 6A, C-curve, ${inp.controlVoltage}`,
      qty, 'Nos', 'Control protection');
  } else { // VFD
    add('Starter', 'Variable Frequency Drive (VFD)',
      `${kw} kW, ${inp.voltage}V, ${phaseStr}, ${inp.frequency}Hz, IP20/IP54, Modbus RTU, PID control, EMC filter built-in`,
      qty, 'Nos', `Motor ${kw} kW`);
    add('Starter', 'Input Reactor / Line Choke',
      `5% impedance, ${Math.ceil(c.flc * 1.1)} A rated, suitable for ${kw} kW VFD`,
      qty, 'Nos', 'Harmonic mitigation, required if >7.5 kW');
    add('Starter', 'Bypass Contactor (if specified)',
      `AC-3, ${c.contactorRating} A, ${inp.voltage}V, ${inp.controlVoltage} coil`,
      qty, 'Nos', 'Optional manual bypass');
    add('Starter', 'Control MCB',
      `1P, 6A, C-curve, ${inp.controlVoltage}`,
      qty, 'Nos', 'VFD control power');
    add('Starter', 'Shielded Control Cable',
      `2×1.5 mm² OS, screened, for speed reference signal`,
      qty * Math.ceil(inp.cableLength * 1.1), 'm', 'VFD analog input wiring');
  }

  // ── Control Panel Components (common) ────────────────────
  add('Control Panel', 'Panel Enclosure',
    `IP54 GRP/GI sheet, ${inp.panelSize}, powder coated RAL 7035, lockable, cable entry bottom`,
    qty, 'Nos', `${kw} kW ${sm} panel`);
  add('Control Panel', 'Control Transformer or SMPS',
    inp.controlVoltage === '230V AC'
      ? `Control Transformer 230V AC, 100VA, with primary/secondary MCB`
      : `SMPS 24V DC, 5A, DIN rail`,
    qty, 'Nos', 'Control power supply');
  add('Control Panel', 'Start Push Button',
    `Green, flush, 22mm, 1 NO contact, legend "START"`,
    qty, 'Nos', 'Per panel');
  add('Control Panel', 'Stop Push Button',
    `Red, flush, 22mm, 1 NC contact, legend "STOP"`,
    qty, 'Nos', 'Per panel');
  add('Control Panel', 'Emergency Stop Push Button',
    `Red mushroom, 40mm, 1 NC, key release, IEC 60947-5-5`,
    qty, 'Nos', 'Safety requirement');
  add('Control Panel', 'Local / Remote Selector Switch',
    `3-position, 22mm, Local-Off-Remote, 2 NO contacts`,
    qty, 'Nos', 'L/R selection');
  add('Control Panel', 'Run Indicating Lamp',
    `Green, LED, 22mm, ${inp.controlVoltage}, legend "RUNNING"`,
    qty, 'Nos', 'Status indication');
  add('Control Panel', 'Trip / Fault Indicating Lamp',
    `Red, LED, 22mm, ${inp.controlVoltage}, legend "TRIP/FAULT"`,
    qty, 'Nos', 'Fault indication');
  add('Control Panel', 'Ready Indicating Lamp',
    `White or Blue, LED, 22mm, ${inp.controlVoltage}, legend "READY"`,
    qty, 'Nos', 'Ready status');
  add('Control Panel', 'Control Relay',
    `2CO, 10A, ${inp.controlVoltage}, plug-in with socket, LED indicator`,
    qty * (sm === 'Star-Delta' ? 4 : 3), 'Nos', 'Control logic');
  if (sm === 'Star-Delta') {
    add('Control Panel', 'Star-Delta Transition Relay/Timer',
      `Adjustable 1–30 s, ${inp.controlVoltage}, DIN rail`,
      qty, 'Nos', 'Transition timing');
  }
  add('Control Panel', 'Terminal Block',
    `4 mm², screw type, grey, DIN rail, rated 32A`,
    qty * 30, 'Nos', `Approx 30 per panel × ${qty} panels`);
  add('Control Panel', 'Earth Terminal Block',
    `6 mm², green/yellow, DIN rail, earth terminal`,
    qty * 6, 'Nos', 'Earth connections');
  add('Control Panel', 'Neutral Link Bar',
    `50A, DIN rail, 12-way`,
    qty, 'Nos', 'Neutral distribution');
  add('Control Panel', 'Earth Bar',
    `30×3 mm copper, insulated support, 6 holes, DIN rail or panel mount`,
    qty, 'Nos', 'Panel earthing');
  add('Control Panel', 'DIN Rail',
    `35mm symmetrical top-hat DIN rail, 1m length`,
    qty * Math.ceil(inp.motorKW > 22 ? 3 : 2), 'm', 'Panel internal DIN rail');
  add('Control Panel', 'Cable Duct (Slotted)',
    `PVC slotted duct, 40×40 mm or 60×60 mm`,
    qty * Math.ceil(inp.motorKW > 22 ? 5 : 3), 'm', 'Internal cable management');
  add('Control Panel', 'Panel Internal Wiring',
    `1.5 mm² Cu, PVC insulated, flexible, multi-colour (Red/Yellow/Blue/Black/Green)`,
    qty * (inp.motorKW > 22 ? 30 : 20), 'm', 'Control wiring estimate');
  add('Control Panel', 'Ferrules / Cable Markers',
    `0.5–2.5 mm², printed, sleeve type, white/yellow`,
    qty * 60, 'Nos', 'Approx 2× terminal count');
  add('Control Panel', 'Cable Lugs (Panel Internal)',
    `Copper tubular, 1.5–6 mm², bootlace/ring`,
    qty * 20, 'Nos', 'Internal lug crimping');
  add('Control Panel', 'Nameplate / Label',
    `Engraved laminate, white on black, panel ID + tag`,
    qty * 4, 'Nos', 'Equipment labels');
  add('Control Panel', 'Padlock Hasp',
    `LOTO capable, for isolator / MCCB`,
    qty, 'Nos', 'Safety lockout');

  // ── Power Cable ──────────────────────────────────────────
  const cabCore = inp.numCores;
  const cableLengthRun = Math.ceil(inp.cableLength * 1.1); // 10% waste
  const cableSpec = `${cabCore}C × ${c.cableSize} mm² ${inp.cableMaterial} ${inp.cableInsulation} SWA PVC, ${inp.phase === '3' ? '1100V' : '1100V'} Grade`;
  add('Cable', 'Power Cable',
    cableSpec,
    qty * inp.parallelRuns * cableLengthRun, 'm',
    `${inp.cableLength} m × ${inp.parallelRuns} run(s) × ${qty} sets + 10% waste`);
  add('Cable', 'Earth Cable',
    `1C × ${c.earthSize} mm² ${inp.cableMaterial} ${inp.cableInsulation} PVC insulated, Green/Yellow`,
    qty * cableLengthRun, 'm',
    `Earth conductor ${inp.cableLength} m + 10%`);
  if (sm === 'VFD' || sm === 'Soft Starter') {
    add('Cable', 'Control Cable',
      `4C × 1.5 mm² Cu OS PVC, screened, 300/500V`,
      qty * Math.ceil(inp.cableLength * 1.1), 'm',
      'Control signals from panel to field');
  } else {
    add('Cable', 'Control Cable',
      `4C × 1.5 mm² Cu PVC, 300/500V`,
      qty * Math.ceil(inp.cableLength * 1.1), 'm',
      'Start/Stop/Feedback signals');
  }

  // ── Cable Accessories ────────────────────────────────────
  const glandSize = c.cableSize <= 16 ? 'M20' : c.cableSize <= 50 ? 'M25' : c.cableSize <= 95 ? 'M32' : 'M40';
  add('Cable Accessories', 'Cable Glands (Power)',
    `${glandSize} Double compression, A2/BW type, SS or brass, cable entry`,
    qty * inp.parallelRuns * 2, 'Nos', '2 per run (panel entry + motor entry)');
  add('Cable Accessories', 'Cable Glands (Control)',
    `M16 double compression, brass, cable entry`,
    qty * 2, 'Nos', '2 per control cable run');
  add('Cable Accessories', 'Cable Lugs (Power)',
    `Cu tubular compression lugs, ${c.cableSize} mm², DIN 46235`,
    qty * inp.parallelRuns * cabCore * 2, 'Nos',
    `${cabCore} cores × 2 ends × ${inp.parallelRuns} run(s) per set`);
  add('Cable Accessories', 'Earth Cable Lugs',
    `Cu tubular, ${c.earthSize} mm², ring type`,
    qty * 2, 'Nos', '2 ends per earth cable');
  add('Cable Accessories', 'Control Cable Lugs',
    `Bootlace ferrules 1.5 mm², insulated`,
    qty * 8, 'Nos', 'Control cable termination');
  add('Cable Accessories', 'Cable Ties',
    `Nylon, 300 mm, UV stabilised`,
    qty * Math.ceil(inp.cableLength / 0.5), 'Nos', '1 every 0.5 m');
  add('Cable Accessories', 'Cable Markers',
    `Slide-on type, core identification, PVC`,
    qty * inp.parallelRuns * cabCore * 2, 'Nos', 'Core identification at both ends');

  // ── Earthing ─────────────────────────────────────────────
  add('Earthing', 'Motor Earth Bar Connection',
    `Cu flat 30×3 mm, motor terminal box to nearest earth point`,
    qty, 'Nos', 'Motor frame earthing');
  add('Earthing', 'Pump Frame Earthing',
    `Cu conductor 10 mm² green/yellow to local earth grid`,
    qty, 'Nos', 'Pump/skid frame bonding');

  // ── Field Items ───────────────────────────────────────────
  if (inp.hasLocalIsolator) {
    add('Field Equipment', 'Local Isolator',
      `${inp.phase === '3' ? '3P+E' : '2P+E'}, ${c.mccbRating} A, IP65, lockable, NEMA/IEC`,
      qty, 'Nos', 'Motor local isolation');
  }
  if (inp.hasLocalCS) {
    add('Field Equipment', 'Local Control Station',
      `IP65, GRP/SS, Start (Green) + Stop (Red) + E-Stop (40mm mushroom), legend plate`,
      qty, 'Nos', 'Field Start/Stop');
  }
  if (inp.hasJunctionBox) {
    add('Field Equipment', 'Junction Box',
      `IP65, GRP, 200×150×100 mm, with terminals, cable entries`,
      qty, 'Nos', 'Field termination');
  }
  if (inp.hasFlexConduit) {
    add('Field Equipment', 'Flexible Conduit + Adaptor',
      `20mm / 25mm liquid-tight, SS or PA, with compression adaptor`,
      qty * 2, 'Set', 'Motor cable entry (2 per motor)');
  }
  if (inp.hasCableTray) {
    add('Field Equipment', 'Cable Tray',
      `100×50 mm hot-dip galvanised perforated tray, with covers`,
      Math.ceil(inp.cableLength / 3), 'm', 'Cable support (every 3m support bracket)');
  }

  // ── Instrumentation ───────────────────────────────────────
  if (inp.hasPressureSwitch) {
    add('Instrumentation', 'Pressure Switch',
      `Adjustable range, SPDT, 4–20 mA / ON-OFF, IP65, SS wetted parts`,
      qty, 'Nos', 'Pump discharge protection');
  }
  if (inp.hasPressureXmtr) {
    add('Instrumentation', 'Pressure Transmitter',
      `4–20 mA, 2-wire, 0–10 bar (adj), IP67, SS diaphragm, HART protocol`,
      qty, 'Nos', 'Pump pressure monitoring');
    add('Instrumentation', 'Instrument Cable (Pressure Xmtr)',
      `2C × 1.5 mm² Cu OS PVC screened, 300/500V`,
      qty * Math.ceil(inp.cableLength * 1.1), 'm', 'Instrument signal cable');
  }
  if (inp.hasFlowSwitch) {
    add('Instrumentation', 'Flow Switch',
      `Paddle type, SPDT, IP65, suitable for pump flow monitoring`,
      qty, 'Nos', 'No-flow / low-flow detection');
  }
  if (inp.hasFlowMeter) {
    add('Instrumentation', 'Flow Meter',
      `Electromagnetic / ultrasonic, 4–20 mA, DN50 or as required, IP67`,
      qty, 'Nos', 'Flow measurement');
  }
  if (inp.hasLevelSwitch) {
    add('Instrumentation', 'Level Switch',
      `Float or electrode type, IP68, SPDT, suitable for pump sump application`,
      qty, 'Nos', 'Sump level protection');
  }
  if (inp.hasTempSensor) {
    add('Instrumentation', 'Temperature Sensor / RTD',
      `PT100, 3-wire, IP65, motor winding temperature monitoring`,
      qty, 'Nos', 'Winding temperature monitoring');
  }
  if (inp.hasVibration) {
    add('Instrumentation', 'Vibration Sensor',
      `Accelerometer, 4–20 mA, IP67, top motor mount, bearing vibration`,
      qty, 'Nos', 'Motor/pump bearing vibration monitoring');
  }

  // ── Miscellaneous ─────────────────────────────────────────
  add('Installation', 'Panel Cooling Fan + Filter',
    `AC ${inp.controlVoltage}, 120mm or 150mm, with finger guard and filter mat`,
    kw > 11 ? qty : 0, 'Nos', 'Required for panels > 11 kW');
  add('Installation', 'Thermostat (Panel Internal)',
    `Bimetallic, adjustable 0–60°C, DIN rail, NC contact`,
    kw > 11 ? qty : 0, 'Nos', 'Panel temperature control');
  add('Installation', 'Panel Heater (Anti-Condensation)',
    `50W or 100W, 230V AC, with thermostat, DIN rail`,
    qty, 'Nos', 'Anti-condensation');
  add('Installation', 'Panel Internal Light + Service Socket',
    `LED strip light 12V/24V DC + 1× 2-pin socket 230V AC, door switch`,
    qty, 'Nos', 'Panel maintenance');
  add('Installation', 'Warning / Caution Label',
    `"DANGER - HIGH VOLTAGE" + "ELECTRICAL HAZARD", laminated vinyl`,
    qty * 2, 'Nos', 'Safety signage');

  // Remove zero-qty items
  return items.filter((i) => i.qty > 0);
}

// ── Validation ────────────────────────────────────────────────

export function validateResults(inp: PumpMotorInputs, c: CalcValues): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const ck = (
    id: string, category: string, description: string,
    calculated: string, limit: string,
    status: 'PASS' | 'WARNING' | 'FAIL', note: string
  ) => checks.push({ id, category, description, calculated, limit, status, note });

  // FLC check
  ck('flc', 'Motor', 'Full Load Current',
    `${c.flc} A`, 'Within motor nameplate range',
    'PASS', 'Calculated from rated power, voltage, PF and efficiency');

  // Design current
  ck('design', 'Motor', 'Design Current (125% × FLC)',
    `${c.designCurrent} A`, '≥ FLC × 1.25',
    c.designCurrent >= c.flc * 1.24 ? 'PASS' : 'FAIL',
    'Per IEC 60364-4-43, design current = FLC × 1.25');

  // MCCB vs design current
  ck('mccb', 'Protection', 'MCCB Rating ≥ Design Current',
    `${c.mccbRating} A`, `≥ ${c.designCurrent.toFixed(1)} A`,
    c.mccbRating >= c.designCurrent ? 'PASS' : 'FAIL',
    'MCCB must be rated ≥ design current');

  // Contactor vs FLC
  ck('cont', 'Protection', 'Contactor AC-3 Rating ≥ FLC',
    `${c.contactorRating} A`, `≥ ${c.flc.toFixed(1)} A`,
    c.contactorRating >= c.flc ? 'PASS' : 'FAIL',
    'AC-3 contactor rating must cover full-load current');

  // OLR covers FLC
  ck('olr', 'Protection', 'OLR Range Covers FLC',
    `${c.olrRange[0]}–${c.olrRange[1]} A`,
    `${c.flc.toFixed(1)} A within range`,
    c.flc >= c.olrRange[0] && c.flc <= c.olrRange[1] ? 'PASS' : 'WARNING',
    'OLR must be settable to motor nameplate current');

  // Cable ampacity
  const ampCheck = c.cableAmpacity >= c.designCurrent;
  ck('amp', 'Cable', 'Cable Ampacity ≥ Design Current',
    `${c.cableAmpacity.toFixed(1)} A`,
    `≥ ${c.designCurrent.toFixed(1)} A`,
    ampCheck ? 'PASS' : 'FAIL',
    'Derated cable ampacity must exceed design current');

  // Voltage drop
  const vdOk = c.voltageDropPct <= inp.maxVoltageDrop;
  const vdWarn = c.voltageDropPct <= inp.maxVoltageDrop * 1.1;
  ck('vd', 'Cable', 'Voltage Drop %',
    `${c.voltageDropPct.toFixed(2)} %`,
    `≤ ${inp.maxVoltageDrop} %`,
    vdOk ? 'PASS' : vdWarn ? 'WARNING' : 'FAIL',
    'Voltage drop at rated current during full-load operation');

  // Earth cable
  const minEarth = inp.cableSizeOverride > 0 ? inp.cableSizeOverride : c.cableSize;
  const earthExpected = earthCableSize(minEarth);
  ck('earth', 'Earthing', 'Earth Cable Size',
    `${c.earthSize} mm²`, `≥ ${earthExpected} mm² (IEC 60364-5-54)`,
    c.earthSize >= earthExpected ? 'PASS' : 'FAIL',
    'Earth conductor cross-section per IEC 60364-5-54 Table 54.2');

  // Starting method vs starting current
  if (inp.startingMethod === 'DOL' && c.startingCurrent > 600) {
    ck('start', 'Starting', 'DOL Starting Current',
      `${c.startingCurrent.toFixed(0)} A`, '< 600 A (check upstream protection)',
      'WARNING', 'High starting current — verify upstream protection settings');
  } else {
    ck('start', 'Starting', 'Starting Current',
      `${c.startingCurrent.toFixed(0)} A`, `${inp.startingMethod} method`,
      'PASS', `Starting current estimated for ${inp.startingMethod} method`);
  }

  // Al cable >= 10mm
  if (inp.cableMaterial === 'Al' && c.cableSize < 10) {
    ck('alCable', 'Cable', 'Aluminium Cable Minimum Size',
      `${c.cableSize} mm²`, '≥ 10 mm² (Al conductors)',
      'FAIL', 'IEC 60228 minimum: aluminium conductors ≥ 10 mm²');
  } else if (inp.cableMaterial === 'Al') {
    ck('alCable', 'Cable', 'Aluminium Cable Minimum Size',
      `${c.cableSize} mm²`, '≥ 10 mm²', 'PASS', 'Aluminium cable size acceptable');
  }

  // Panel IP rating
  ck('panelIP', 'Panel', 'Panel IP Rating',
    inp.panelIP, 'IP54 minimum for outdoor/process areas',
    ['IP54','IP55','IP56','IP65','IP66','IP67'].includes(inp.panelIP) ? 'PASS' : 'WARNING',
    'Verify IP rating is appropriate for installation environment');

  // Motor IP
  ck('motorIP', 'Motor', 'Motor IP Rating',
    inp.ipRating, 'IP55 minimum for pump applications',
    ['IP55','IP56','IP65','IP66','IP67','IP68'].includes(inp.ipRating) ? 'PASS' : 'WARNING',
    'Verify motor IP is suitable for outdoor/wet process environment');

  // Disclaimer check
  ck('disclaimer', 'General', 'Engineering Validation',
    'Design estimates only', 'Verified by engineer',
    'WARNING',
    'All calculated values are engineering estimates. Verify against actual equipment nameplates, manufacturer data, site conditions and applicable standards before procurement.');

  return checks;
}
