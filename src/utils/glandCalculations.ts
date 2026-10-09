/* ================================================================
   CABLE GLAND CALCULATION ENGINE
   Standards: BS 6121 Pt1/Pt4, IEC 62444, BS EN 50262
   ================================================================ */

import type { CalculationResult } from '../types';
import {
  CABLE_OD, OD_CORRECTIONS, GLAND_SIZES, GLAND_TYPES,
  GLAND_MATERIALS, SHROUD_REQUIRED, COMPRESSION_TYPES,
  type CoreOption,
} from '../data/cableGlandData';

export interface CableGlandInputs {
  conductorSize: number;
  cores:         CoreOption;
  conductorMat:  'Cu' | 'Al';
  insulation:    'XLPE' | 'PVC' | 'EPR';
  armouring:     'SWA' | 'STA' | 'AWA' | 'Unarmoured';
  installation:  'indoor' | 'outdoor' | 'hazardous';
  environment:   'standard' | 'marine' | 'corrosive';
  cableType:     'armoured' | 'unarmoured-brass' | 'unarmoured-pvc' | 'screened' | 'hazardous' | 'marine';
  manualOD:      number;
}

export function calculateCableGland(inp: CableGlandInputs): CalculationResult {
  const {
    conductorSize, cores, conductorMat, insulation,
    armouring, installation, environment, cableType, manualOD,
  } = inp;

  // ── Step 1: Cable OD ────────────────────────────────────────────
  let cableOD: number;
  let odSource: string;

  if (manualOD > 0) {
    cableOD = manualOD;
    odSource = 'User-specified (manufacturer datasheet)';
  } else {
    const armourKey = armouring === 'Unarmoured' ? 'Unarmoured' : 'SWA';
    const insKey    = insulation === 'EPR' ? 'XLPE' : insulation;
    const key       = `${cores}_Cu_${insKey}_${armourKey}`;
    const table     = CABLE_OD[key] ?? CABLE_OD['3C_Cu_XLPE_SWA'];
    const baseOD    = table[conductorSize] ?? estimateOD(conductorSize, cores, armourKey);

    const matCorr = conductorMat === 'Al' ? OD_CORRECTIONS.Al : 0;
    const insCorr = insulation === 'PVC' ? OD_CORRECTIONS.PVC : insulation === 'EPR' ? OD_CORRECTIONS.EPR : 0;
    const armCorr = armouring === 'STA' ? OD_CORRECTIONS.STA : 0;

    cableOD  = Math.round(baseOD + matCorr + insCorr + armCorr);
    odSource = `IEC 60228 / BS 7655 catalogue data (${conductorMat}/${insulation}/${armouring})`;
  }

  // ── Step 2: Gland thread size ───────────────────────────────────
  const matched      = GLAND_SIZES.filter((g) => cableOD >= g.minOD && cableOD <= g.maxOD);
  const selectedSize = matched[0] ?? GLAND_SIZES[GLAND_SIZES.length - 1];
  const nextSize     = GLAND_SIZES[GLAND_SIZES.indexOf(selectedSize) + 1];
  const nearLimit    = nextSize && (selectedSize.maxOD - cableOD <= 2);

  // ── Step 3: Gland type selection ────────────────────────────────
  let glandKey: string;

  if (cableType === 'screened') {
    glandKey = 'EMC';
  } else if (cableType === 'marine') {
    glandKey = 'SS_CW';
  } else if (cableType === 'hazardous' || installation === 'hazardous') {
    glandKey = 'CWEX';
  } else if (cableType === 'unarmoured-pvc') {
    glandKey = 'PVC_A';
  } else if (cableType === 'unarmoured-brass') {
    glandKey = installation === 'outdoor' ? 'A2F' : 'A2';
  } else {
    // armoured cable
    if      (environment === 'marine' || environment === 'corrosive') glandKey = 'SS_CW';
    else if (installation === 'outdoor')  glandKey = 'CWB';
    else                                  glandKey = 'CW';
  }

  const glandType    = GLAND_TYPES[glandKey];
  const compression  = COMPRESSION_TYPES[glandType.compression];
  const shroudNeeded = SHROUD_REQUIRED[glandKey];
  const isArmoured   = glandType.armoured;

  // ── Step 4: Body material ───────────────────────────────────────
  let matKey: string;
  if      (cableType === 'unarmoured-pvc')                           matKey = 'pvc';
  else if (environment === 'marine' || environment === 'corrosive')  matKey = 'marine';
  else if (installation === 'hazardous')                             matKey = 'hazardous';
  else                                                               matKey = 'standard';

  const bodyMaterial = GLAND_MATERIALS[matKey];

  // ── Step 5: Accessories ─────────────────────────────────────────
  const accessories  = glandType.accessories;
  const shroudDesc   = shroudNeeded ? `${selectedSize.thread} PVC Shroud (1 No.)` : 'Not required';
  const earthTag     = isArmoured ? 'ET Earth Tag — 1 No. (brass)' : 'Not required';
  const entryHole    = `${selectedSize.entryMM} mm ⌀ knockout / punch`;

  // ── Status ──────────────────────────────────────────────────────
  const status = nearLimit ? 'WARNING' : 'PASS';
  const nearLimitNote = nearLimit
    ? ` ⚠ OD ${cableOD}mm near upper limit (max ${selectedSize.maxOD}mm) — confirm actual OD from manufacturer.`
    : '';

  const recommendation =
    `${selectedSize.thread} ${glandType.compression} (${glandType.code}) | ` +
    `${bodyMaterial} | IP${glandType.ipRating} | ${glandType.standard}` +
    nearLimitNote;

  return {
    values: [
      // Row 1 — Primary selections
      { label: 'Cable Overall OD',    value: `${cableOD} mm`,            unit: '',     highlight: true  },
      { label: 'Gland Thread Size',   value: selectedSize.thread,        unit: '',     highlight: true  },
      { label: 'Compression Type',    value: glandType.compression,      unit: '',     highlight: true  },
      { label: 'Gland Code',          value: glandType.code,             unit: '',     status: 'INFO'   },

      // Row 2 — Construction details
      { label: 'Gland Name',          value: glandType.name,             unit: '',     highlight: false },
      { label: 'Body Material',       value: bodyMaterial,               unit: '',     highlight: false },
      { label: 'IP Rating',           value: glandType.ipRating,         unit: '',     status: 'PASS'   },
      { label: 'Standard',            value: glandType.standard,         unit: '',     highlight: false },

      // Row 3 — Accessories
      { label: 'PVC Shroud',          value: shroudDesc,                 unit: '',     status: shroudNeeded ? 'INFO' : undefined },
      { label: 'Earth Tag (ET)',       value: earthTag,                   unit: '',     status: isArmoured ? 'PASS' : undefined  },
      { label: 'Entry Hole ⌀',        value: entryHole,                  unit: '',     highlight: false },
      { label: 'Sealing Range',       value: `${selectedSize.minOD}–${selectedSize.maxOD} mm`, unit: '', highlight: false },
    ],
    status,
    recommendation,
    formula: 'Cable OD → BS EN 50262 Table 1 (Thread) | Armouring + Location → BS 6121 (Type) | Compression: Double=SWA, Single=Unarmoured',
    steps: [
      {
        step: 1,
        description: 'Identify cable overall diameter (OD)',
        formula: `Cable: ${cores} ${conductorSize}mm² ${conductorMat}/${insulation}/${armouring}`,
        result: `Overall Diameter (OD) = ${cableOD} mm  [${odSource}]`,
      },
      {
        step: 2,
        description: 'Select metric gland thread size — BS EN 50262 Table 1',
        formula: `Find thread: min_OD ≤ ${cableOD} mm ≤ max_OD`,
        result: `Thread = ${selectedSize.thread} | Sealing range: ${selectedSize.minOD}–${selectedSize.maxOD} mm ✓`,
      },
      {
        step: 3,
        description: 'Select compression type',
        formula: `Armouring = ${armouring}  →  Compression type`,
        result: `${glandType.compression}: ${compression.description}`,
      },
      {
        step: 4,
        description: 'Select gland type per installation category — BS 6121',
        formula: `CableType=${cableType}  +  Installation=${installation}  +  Environment=${environment}`,
        result: `Gland Type = ${glandType.code} — ${glandType.name}  |  ${glandType.standard}`,
      },
      {
        step: 5,
        description: 'Compression construction — how the gland works',
        formula: compression.howItWorks,
        result: `Parts: ${compression.parts.join(' | ')}`,
      },
      {
        step: 6,
        description: 'Accessories required',
        formula: 'Shroud (outdoor) | Earth tag (armoured) | Entry knockout',
        result: accessories.join(' | '),
      },
    ],
    standardRef: {
      standard: 'BS 6121 Part 1 / IEC 62444',
      clause:   'BS EN 50262 Table 1',
      table:    'Cable Gland Metric Thread Sealing Ranges',
      title:    'Cable Glands for Electrical Installations — Type, Compression, Accessories',
    },
  };
}

function estimateOD(size: number, cores: CoreOption, armour: string): number {
  const cf: Record<string, number> = {
    '1C': 1.0, '2C': 1.55, '3C': 1.75, '3.5C': 1.85, '4C': 1.95, '5C': 2.1,
  };
  const dc   = Math.sqrt((4 * size) / Math.PI);
  const ins  = 3.5;
  const armW = armour === 'Unarmoured' ? 0 : 4;
  return Math.round((cf[cores] ?? 1.75) * (dc + ins * 2) + armW + 4);
}
