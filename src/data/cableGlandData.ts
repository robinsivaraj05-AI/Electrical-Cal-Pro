/* ================================================================
   CABLE GLAND DATA
   Sources: BS 6121 Pt1/Pt4, IEC 62444, BS EN 50262
   Cable ODs: Prysmian BICON / Nexans / Polycab catalogues
   ================================================================ */

// ── Cable OD Lookup Table (mm) ─────────────────────────────────

export const CABLE_OD: Record<string, Record<number, number>> = {
  '1C_Cu_XLPE_SWA': {
    1.5: 12, 2.5: 13, 4: 14, 6: 15, 10: 17, 16: 19,
    25: 21, 35: 23, 50: 26, 70: 29, 95: 32, 120: 35,
    150: 38, 185: 42, 240: 47, 300: 52, 400: 58, 500: 64, 630: 71,
  },
  '2C_Cu_XLPE_SWA': {
    1.5: 15, 2.5: 16, 4: 18, 6: 20, 10: 23, 16: 27,
    25: 31, 35: 34, 50: 38, 70: 43, 95: 48, 120: 53,
    150: 58, 185: 65, 240: 73,
  },
  '3C_Cu_XLPE_SWA': {
    1.5: 16, 2.5: 18, 4: 20, 6: 22, 10: 26, 16: 30,
    25: 34, 35: 38, 50: 43, 70: 49, 95: 55, 120: 60,
    150: 66, 185: 73, 240: 82, 300: 90,
  },
  '3.5C_Cu_XLPE_SWA': {
    16: 31, 25: 36, 35: 40, 50: 45, 70: 51,
    95: 57, 120: 63, 150: 70, 185: 77, 240: 87, 300: 96,
  },
  '4C_Cu_XLPE_SWA': {
    1.5: 17, 2.5: 19, 4: 22, 6: 24, 10: 28, 16: 32,
    25: 37, 35: 41, 50: 46, 70: 52, 95: 59, 120: 65,
    150: 72, 185: 80, 240: 90,
  },
  '5C_Cu_XLPE_SWA': {
    1.5: 18, 2.5: 21, 4: 23, 6: 26, 10: 30, 16: 35,
    25: 40, 35: 44, 50: 50,
  },
  '1C_Cu_XLPE_Unarmoured': {
    1.5: 7,  2.5: 8,  4: 9,  6: 10, 10: 11, 16: 13,
    25: 15, 35: 17, 50: 19, 70: 22, 95: 25, 120: 27,
    150: 30, 185: 33, 240: 38, 300: 42, 400: 47, 500: 52, 630: 59,
  },
  '3C_Cu_XLPE_Unarmoured': {
    1.5: 11, 2.5: 12, 4: 14, 6: 16, 10: 18, 16: 21,
    25: 25, 35: 28, 50: 32, 70: 37, 95: 42, 120: 46,
    150: 51, 185: 57, 240: 65,
  },
  '4C_Cu_XLPE_Unarmoured': {
    1.5: 12, 2.5: 14, 4: 16, 6: 18, 10: 21, 16: 24,
    25: 29, 35: 32, 50: 37, 70: 43, 95: 49, 120: 54,
    150: 60, 185: 67,
  },
  '3C_Cu_PVC_SWA': {
    1.5: 16, 2.5: 17, 4: 19, 6: 21, 10: 25, 16: 29,
    25: 33, 35: 37, 50: 42, 70: 48, 95: 54, 120: 60,
    150: 66, 185: 73,
  },
  '4C_Cu_PVC_SWA': {
    1.5: 17, 2.5: 19, 4: 21, 6: 23, 10: 27, 16: 31,
    25: 36, 35: 40, 50: 45, 70: 51, 95: 58, 120: 64,
    150: 71,
  },
};

// ── OD Correction factors ─────────────────────────────────────

export const OD_CORRECTIONS: Record<string, number> = {
  Cu: 0, Al: +3, XLPE: 0, PVC: -1, EPR: +1,
  SWA: 0, STA: -1, AWA: 0, Unarmoured: -5,
};

// ── Gland Thread Size Selection (BS EN 50262) ─────────────────

export interface GlandSizeEntry {
  thread:  string;
  minOD:   number;
  maxOD:   number;
  entryMM: number;
}

export const GLAND_SIZES: GlandSizeEntry[] = [
  { thread: 'M16',  minOD:  4, maxOD: 10, entryMM: 16  },
  { thread: 'M20',  minOD:  7, maxOD: 14, entryMM: 20  },
  { thread: 'M25',  minOD: 11, maxOD: 17, entryMM: 25  },
  { thread: 'M32',  minOD: 15, maxOD: 22, entryMM: 32  },
  { thread: 'M40',  minOD: 22, maxOD: 32, entryMM: 40  },
  { thread: 'M50',  minOD: 30, maxOD: 42, entryMM: 50  },
  { thread: 'M63',  minOD: 39, maxOD: 53, entryMM: 63  },
  { thread: 'M75',  minOD: 48, maxOD: 62, entryMM: 75  },
  { thread: 'M80',  minOD: 55, maxOD: 70, entryMM: 80  },
  { thread: 'M100', minOD: 65, maxOD: 84, entryMM: 100 },
];

// ── Compression Types ──────────────────────────────────────────

export type CompressionType = 'Single Compression' | 'Double Compression' | 'PVC / Plastic';

export interface CompressionTypeDetail {
  type:        CompressionType;
  description: string;
  parts:       string[];
  howItWorks:  string;
  suitable:    string[];
  notSuitable: string[];
}

export const COMPRESSION_TYPES: Record<CompressionType, CompressionTypeDetail> = {
  'PVC / Plastic': {
    type:        'PVC / Plastic',
    description: 'Plastic body with single seal ring. Lowest cost, light duty only.',
    parts:       ['PVC body', 'Single elastomer seal ring', 'PVC locknut'],
    howItWorks:  'One compression nut tightens a rubber/elastomer sealing ring against the cable outer sheath only. No armouring grip. No earth continuity through gland.',
    suitable:    ['Instrument cables (small OD)', 'Signal & data cables', 'Trunking exits (light duty)', 'Panel wiring (control cables only)'],
    notSuitable: ['SWA / armoured cables', 'Outdoor / weatherproof locations', 'High vibration', 'Hazardous areas'],
  },
  'Single Compression': {
    type:        'Single Compression',
    description: 'Brass body, one compression element. Seals outer sheath — no armour clamping.',
    parts:       ['Brass or NP Brass body', 'Single locknut', 'Single elastomer sealing ring (outer sheath)', 'Backnut'],
    howItWorks:  'One compression nut tightens a sealing ring onto the cable outer PVC/LSOH sheath. Provides IP seal and basic mechanical retention. DOES NOT clamp the armouring — not suitable for SWA unless armour is bonded separately.',
    suitable:    ['Unarmoured cables (LV)', 'PVC / LSOH sheathed cables', 'Indoor dry locations', 'Control & instrument cables'],
    notSuitable: ['SWA cables (no armour retention)', 'High mechanical stress locations', 'Where armour earth continuity is required via gland'],
  },
  'Double Compression': {
    type:        'Double Compression',
    description: 'Brass/NP Brass body, TWO compression elements. Clamps armour AND seals outer sheath independently.',
    parts:       ['NP Brass or SS body', 'Inner cone / armour clamp (1st compression)', 'Outer sealing ring on PVC sheath (2nd compression)', 'Two locknuts (inner + outer)', 'Earth tag (ET) for armour continuity'],
    howItWorks:  'INNER cone grips and terminates the steel wire / tape armour — provides mechanical retention and armour earth continuity. OUTER nut independently seals the cable PVC/LSOH outer sheath for IP protection. Both compressions are independent — correct termination of SWA requires both to be properly torqued.',
    suitable:    ['SWA — Steel Wire Armoured', 'STA — Steel Tape Armoured', 'AWA — Aluminium Wire Armoured', 'All industrial armoured LV cables', 'Outdoor / weatherproof (with PVC shroud)', 'Motor terminations', 'Switchgear / MCC / MDB entries'],
    notSuitable: ['Unarmoured cables (over-engineered, but can be used)'],
  },
};

// ── Gland Types (BS 6121 / IEC 62444) ─────────────────────────

export interface GlandTypeEntry {
  code:            string;
  name:            string;
  description:     string;
  compression:     CompressionType;
  standard:        string;
  armoured:        boolean;
  ipRating:        string;
  bodyMaterial:    string;
  color:           string;       // for UI badge color
  applications:    string[];
  accessories:     string[];
}

export const GLAND_TYPES: Record<string, GlandTypeEntry> = {
  PVC_A: {
    code:         'Type A (PVC)',
    name:         'PVC Plastic Gland',
    description:  'Plastic single compression — unarmoured cables, light duty',
    compression:  'PVC / Plastic',
    standard:     'BS 6121 Part 4',
    armoured:     false,
    ipRating:     'IP54',
    bodyMaterial: 'PVC / Nylon',
    color:        'gray',
    applications: ['Signal cables', 'Instrument cables (small OD)', 'Trunking cable entries', 'Panel internal wiring'],
    accessories:  ['PVC locknut (×1)'],
  },
  A2: {
    code:         'A2',
    name:         'Brass Single Compression — Indoor',
    description:  'Single compression brass gland for unarmoured cables, indoor use',
    compression:  'Single Compression',
    standard:     'BS 6121 Part 4',
    armoured:     false,
    ipRating:     'IP54',
    bodyMaterial: 'Nickel Plated Brass',
    color:        'blue',
    applications: ['Unarmoured LV cables (indoor)', 'Control cables', 'Instrument cables', 'Low voltage panels'],
    accessories:  ['Brass locknut (×1)', 'Sealing ring (×1)'],
  },
  A2F: {
    code:         'A2F',
    name:         'Brass Single Compression — Outdoor',
    description:  'Single compression with PVC shroud for outdoor, unarmoured cables',
    compression:  'Single Compression',
    standard:     'BS 6121 Part 4',
    armoured:     false,
    ipRating:     'IP65',
    bodyMaterial: 'Nickel Plated Brass',
    color:        'blue',
    applications: ['Outdoor panels (unarmoured)', 'Junction boxes (sheltered)', 'LSOH sheathed cables outdoors'],
    accessories:  ['Brass locknut (×1)', 'Sealing ring (×1)', 'PVC shroud (×1)'],
  },
  CW: {
    code:         'CW',
    name:         'Brass Double Compression — Indoor SWA',
    description:  'Double compression for SWA/STA/AWA cables, indoor installations',
    compression:  'Double Compression',
    standard:     'BS 6121 Part 1',
    armoured:     true,
    ipRating:     'IP54',
    bodyMaterial: 'Nickel Plated Brass',
    color:        'orange',
    applications: ['MDB / SMDB incomer & feeder cables', 'Motor control centres (MCC)', 'Control panels (indoor)', 'Distribution boards'],
    accessories:  ['Inner locknut (×1)', 'Outer locknut (×1)', 'Earth tag ET (×1)', 'Sealing ring (×1)'],
  },
  CWB: {
    code:         'CWB',
    name:         'Brass Double Compression — Outdoor Weatherproof',
    description:  'Double compression + PVC shroud, IP66 for outdoor SWA terminations',
    compression:  'Double Compression',
    standard:     'BS 6121 Part 1',
    armoured:     true,
    ipRating:     'IP66',
    bodyMaterial: 'Nickel Plated Brass',
    color:        'orange',
    applications: ['Outdoor junction boxes', 'Street lighting panels', 'External MCCs / switchgear', 'Pumping stations'],
    accessories:  ['Inner locknut (×1)', 'Outer locknut (×1)', 'Earth tag ET (×1)', 'PVC shroud (×1)', 'Sealing ring (×1)'],
  },
  CWEX: {
    code:         'CWEX / E1FX',
    name:         'Double Compression — ATEX / IECEx Hazardous Area',
    description:  'Double compression, ATEX-certified for Zone 1/2 (Gas) & Zone 21/22 (Dust)',
    compression:  'Double Compression',
    standard:     'BS 6121 Pt1 · IEC 60079-0 · ATEX 2014/34/EU',
    armoured:     true,
    ipRating:     'IP66 Ex d/e',
    bodyMaterial: 'Nickel Plated Brass (ATEX Certified)',
    color:        'red',
    applications: ['ATEX Zone 1 / Zone 2 (flammable gas)', 'ATEX Zone 21 / Zone 22 (combustible dust)', 'Petrochemical plants', 'Offshore platforms', 'Hazardous area junction boxes'],
    accessories:  ['Inner locknut (×1)', 'Outer locknut (×1)', 'Earth tag ET (×1)', 'Sealing ring (×1)', 'ATEX certificate required'],
  },
  SS_CW: {
    code:         'CW (316 SS)',
    name:         '316 Stainless Steel Double Compression',
    description:  'Double compression in 316 SS for marine, offshore and corrosive environments',
    compression:  'Double Compression',
    standard:     'BS 6121 Part 1',
    armoured:     true,
    ipRating:     'IP66',
    bodyMaterial: '316L Stainless Steel',
    color:        'teal',
    applications: ['Marine / offshore installations', 'Chemical plants (corrosive atmosphere)', 'Food & beverage (wash-down areas)', 'Coastal installations'],
    accessories:  ['SS inner locknut (×1)', 'SS outer locknut (×1)', 'SS earth tag (×1)', 'EPDM sealing ring (×1)'],
  },
  EMC: {
    code:         'EMC / E1WF',
    name:         'EMC Double Compression — Screened Cables',
    description:  'Double compression with 360° screen earth for EMC compliance (screened cables)',
    compression:  'Double Compression',
    standard:     'IEC 62153-4-7 · EN 50174',
    armoured:     true,
    ipRating:     'IP65',
    bodyMaterial: 'Nickel Plated Brass',
    color:        'purple',
    applications: ['Screened instrument cables', 'VFD / inverter cables (EMC)', 'Data & communication cables with screen', 'Process control (4–20mA screened)'],
    accessories:  ['Inner locknut (×1)', 'Outer locknut (×1)', 'Screen clamp ring (360° earth)', 'Sealing ring (×1)'],
  },
};

// ── Body Materials ─────────────────────────────────────────────

export const GLAND_MATERIALS: Record<string, string> = {
  standard:   'Nickel Plated Brass (NP Brass)',
  marine:     '316 Stainless Steel',
  hazardous:  'Nickel Plated Brass (ATEX Certified)',
  corrosive:  '316 Stainless Steel',
  pvc:        'PVC / Nylon (Plastic)',
};

// ── Shroud Required ────────────────────────────────────────────

export const SHROUD_REQUIRED: Record<string, boolean> = {
  PVC_A: false, A2: false, A2F: true,
  CW: false, CWB: true, CWEX: false, SS_CW: false, EMC: false,
};

// ── Standard Sizes ─────────────────────────────────────────────

export const STANDARD_SIZES: number[] = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630,
];

export const CORE_OPTIONS = ['1C', '2C', '3C', '3.5C', '4C', '5C'] as const;
export type CoreOption = typeof CORE_OPTIONS[number];
