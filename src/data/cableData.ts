import type { CableData } from '../types';

// IEC 60364-5-52 Table B.52.2 - Current-carrying capacity (Amperes)
// Cu XLPE cables, 3-core, various installation methods
export const CABLE_DATA_CU_XLPE: CableData[] = [
  { size: 1.5,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 22,  T: 18,  G: 22,  D: 17,  C: 16  }, resistance: 14.82, reactance: 0.115, weight: 0.35, od: 10.5 },
  { size: 2.5,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 30,  T: 24,  G: 29,  D: 22,  C: 21  }, resistance: 8.91,  reactance: 0.112, weight: 0.50, od: 11.5 },
  { size: 4,    type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 40,  T: 32,  G: 38,  D: 30,  C: 28  }, resistance: 5.57,  reactance: 0.110, weight: 0.65, od: 12.5 },
  { size: 6,    type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 51,  T: 41,  G: 47,  D: 37,  C: 36  }, resistance: 3.71,  reactance: 0.108, weight: 0.85, od: 13.5 },
  { size: 10,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 70,  T: 57,  G: 63,  D: 50,  C: 49  }, resistance: 2.24,  reactance: 0.106, weight: 1.20, od: 15.5 },
  { size: 16,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 94,  T: 76,  G: 81,  D: 64,  C: 63  }, resistance: 1.41,  reactance: 0.103, weight: 1.70, od: 17.5 },
  { size: 25,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 119, T: 96,  G: 100, D: 80,  C: 79  }, resistance: 0.927, reactance: 0.101, weight: 2.50, od: 20.0 },
  { size: 35,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 147, T: 119, G: 121, D: 96,  C: 95  }, resistance: 0.669, reactance: 0.099, weight: 3.30, od: 22.0 },
  { size: 50,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 174, T: 144, G: 140, D: 113, C: 110 }, resistance: 0.493, reactance: 0.097, weight: 4.30, od: 24.5 },
  { size: 70,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 215, T: 179, G: 167, D: 140, C: 136 }, resistance: 0.342, reactance: 0.096, weight: 5.80, od: 27.5 },
  { size: 95,   type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 260, T: 218, G: 197, D: 169, C: 164 }, resistance: 0.247, reactance: 0.094, weight: 7.60, od: 30.5 },
  { size: 120,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 299, T: 252, G: 224, D: 194, C: 188 }, resistance: 0.196, reactance: 0.093, weight: 9.40, od: 33.5 },
  { size: 150,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 341, T: 289, G: 252, D: 221, C: 215 }, resistance: 0.158, reactance: 0.092, weight: 11.4, od: 36.5 },
  { size: 185,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 386, T: 328, G: 281, D: 250, C: 244 }, resistance: 0.128, reactance: 0.090, weight: 13.8, od: 40.0 },
  { size: 240,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 448, T: 382, G: 320, D: 291, C: 284 }, resistance: 0.099, reactance: 0.089, weight: 17.4, od: 44.5 },
  { size: 300,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 506, T: 432, G: 354, D: 326, C: 318 }, resistance: 0.080, reactance: 0.088, weight: 21.2, od: 49.0 },
  { size: 400,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 570, T: 490, G: 394, D: 369, C: 362 }, resistance: 0.062, reactance: 0.086, weight: 26.8, od: 54.5 },
  { size: 500,  type: 'Cu', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 632, T: 545, G: 432, D: 408, C: 401 }, resistance: 0.052, reactance: 0.085, weight: 32.8, od: 60.0 },
];

// Al XLPE cables
export const CABLE_DATA_AL_XLPE: CableData[] = [
  { size: 16,  type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 73,  T: 59,  G: 63,  D: 50,  C: 49  }, resistance: 2.254, reactance: 0.103, weight: 1.05, od: 17.5 },
  { size: 25,  type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 92,  T: 73,  G: 78,  D: 62,  C: 61  }, resistance: 1.430, reactance: 0.101, weight: 1.55, od: 20.0 },
  { size: 35,  type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 113, T: 91,  G: 94,  D: 74,  C: 74  }, resistance: 1.030, reactance: 0.099, weight: 2.10, od: 22.0 },
  { size: 50,  type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 135, T: 111, G: 109, D: 88,  C: 86  }, resistance: 0.765, reactance: 0.097, weight: 2.75, od: 24.5 },
  { size: 70,  type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 167, T: 139, G: 130, D: 110, C: 107 }, resistance: 0.532, reactance: 0.096, weight: 3.65, od: 27.5 },
  { size: 95,  type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 202, T: 169, G: 153, D: 132, C: 128 }, resistance: 0.387, reactance: 0.094, weight: 4.75, od: 30.5 },
  { size: 120, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 233, T: 195, G: 174, D: 152, C: 148 }, resistance: 0.308, reactance: 0.093, weight: 5.85, od: 33.5 },
  { size: 150, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 267, T: 225, G: 197, D: 173, C: 169 }, resistance: 0.247, reactance: 0.092, weight: 7.20, od: 36.5 },
  { size: 185, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 300, T: 254, G: 220, D: 195, C: 190 }, resistance: 0.200, reactance: 0.090, weight: 8.65, od: 40.0 },
  { size: 240, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 347, T: 297, G: 251, D: 226, C: 221 }, resistance: 0.154, reactance: 0.089, weight: 11.0, od: 44.5 },
  { size: 300, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 393, T: 337, G: 278, D: 255, C: 249 }, resistance: 0.124, reactance: 0.088, weight: 13.5, od: 49.0 },
  { size: 400, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 444, T: 382, G: 310, D: 289, C: 283 }, resistance: 0.096, reactance: 0.086, weight: 16.8, od: 54.5 },
  { size: 500, type: 'Al', insulation: 'XLPE', coreConfig: '3C', ampacity: { A: 492, T: 425, G: 340, D: 319, C: 313 }, resistance: 0.080, reactance: 0.085, weight: 20.5, od: 60.0 },
];

// Cu PVC cables
export const CABLE_DATA_CU_PVC: CableData[] = [
  { size: 1.5,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 17,  T: 14,  G: 18,  D: 14,  C: 13  }, resistance: 15.1,  reactance: 0.118, weight: 0.30, od: 10.0 },
  { size: 2.5,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 23,  T: 19,  G: 24,  D: 18,  C: 17  }, resistance: 9.08,  reactance: 0.115, weight: 0.45, od: 11.0 },
  { size: 4,    type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 31,  T: 25,  G: 31,  D: 24,  C: 23  }, resistance: 5.68,  reactance: 0.112, weight: 0.60, od: 12.0 },
  { size: 6,    type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 40,  T: 32,  G: 39,  D: 30,  C: 29  }, resistance: 3.78,  reactance: 0.110, weight: 0.78, od: 13.0 },
  { size: 10,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 54,  T: 44,  G: 52,  D: 41,  C: 40  }, resistance: 2.27,  reactance: 0.108, weight: 1.10, od: 15.0 },
  { size: 16,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 73,  T: 60,  G: 67,  D: 53,  C: 51  }, resistance: 1.43,  reactance: 0.106, weight: 1.55, od: 17.0 },
  { size: 25,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 93,  T: 76,  G: 83,  D: 66,  C: 65  }, resistance: 0.944, reactance: 0.103, weight: 2.30, od: 19.5 },
  { size: 35,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 114, T: 94,  G: 100, D: 80,  C: 78  }, resistance: 0.682, reactance: 0.101, weight: 3.05, od: 21.5 },
  { size: 50,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 135, T: 113, G: 116, D: 94,  C: 92  }, resistance: 0.500, reactance: 0.099, weight: 3.95, od: 24.0 },
  { size: 70,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 167, T: 141, G: 138, D: 117, C: 113 }, resistance: 0.348, reactance: 0.097, weight: 5.35, od: 27.0 },
  { size: 95,   type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 203, T: 172, G: 163, D: 141, C: 136 }, resistance: 0.252, reactance: 0.096, weight: 7.00, od: 30.0 },
  { size: 120,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 235, T: 200, G: 186, D: 161, C: 156 }, resistance: 0.200, reactance: 0.094, weight: 8.65, od: 33.0 },
  { size: 150,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 268, T: 229, G: 210, D: 183, C: 178 }, resistance: 0.161, reactance: 0.093, weight: 10.5, od: 36.0 },
  { size: 185,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 303, T: 260, G: 234, D: 207, C: 201 }, resistance: 0.131, reactance: 0.092, weight: 12.8, od: 39.5 },
  { size: 240,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 351, T: 303, G: 267, D: 239, C: 232 }, resistance: 0.101, reactance: 0.090, weight: 16.2, od: 44.0 },
  { size: 300,  type: 'Cu', insulation: 'PVC', coreConfig: '3C', ampacity: { A: 396, T: 343, G: 296, D: 268, C: 260 }, resistance: 0.082, reactance: 0.089, weight: 19.8, od: 48.5 },
];

// Temperature correction factors (IEC 60364-5-52 Table B.52.14)
export const TEMP_CORRECTION_XLPE: Record<number, number> = {
  10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.00,
  35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76,
  60: 0.71, 65: 0.65, 70: 0.58, 75: 0.50, 80: 0.41,
};

export const TEMP_CORRECTION_PVC: Record<number, number> = {
  10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.00,
  35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61,
  60: 0.50,
};

// Grouping/bunching correction factors (IEC 60364-5-52 Table B.52.17)
export const GROUPING_FACTORS: Record<number, Record<string, number>> = {
  1:  { clipped: 1.00, tray: 1.00, duct: 1.00 },
  2:  { clipped: 0.80, tray: 0.88, duct: 0.87 },
  3:  { clipped: 0.70, tray: 0.82, duct: 0.82 },
  4:  { clipped: 0.65, tray: 0.77, duct: 0.77 },
  5:  { clipped: 0.60, tray: 0.75, duct: 0.75 },
  6:  { clipped: 0.57, tray: 0.73, duct: 0.73 },
  7:  { clipped: 0.54, tray: 0.68, duct: 0.68 },
  8:  { clipped: 0.52, tray: 0.66, duct: 0.66 },
  9:  { clipped: 0.50, tray: 0.65, duct: 0.65 },
  12: { clipped: 0.45, tray: 0.57, duct: 0.57 },
  16: { clipped: 0.41, tray: 0.53, duct: 0.53 },
  20: { clipped: 0.38, tray: 0.50, duct: 0.50 },
};

// Soil thermal resistivity correction (IEC 60287) for buried cables
export const SOIL_RESISTIVITY_CORRECTION: Record<number, number> = {
  0.5: 1.28, 0.7: 1.20, 1.0: 1.00, 1.5: 0.86,
  2.0: 0.76, 2.5: 0.70, 3.0: 0.65,
};

// Standard cable sizes (mm²)
export const STANDARD_SIZES_MM2 = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630
];

export function getCableData(
  conductor: 'Cu' | 'Al',
  insulation: 'PVC' | 'XLPE' | 'EPR'
): CableData[] {
  if (conductor === 'Cu' && insulation === 'XLPE') return CABLE_DATA_CU_XLPE;
  if (conductor === 'Al' && insulation === 'XLPE') return CABLE_DATA_AL_XLPE;
  if (conductor === 'Cu' && insulation === 'PVC') return CABLE_DATA_CU_PVC;
  return CABLE_DATA_CU_XLPE;
}

export function getTemperatureCorrection(
  temp: number,
  insulation: 'PVC' | 'XLPE' | 'EPR'
): number {
  const table = insulation === 'PVC' ? TEMP_CORRECTION_PVC : TEMP_CORRECTION_XLPE;
  const key = Math.round(temp / 5) * 5;
  return table[key] ?? 1.0;
}

export function getGroupingFactor(
  numCables: number,
  method: 'clipped' | 'tray' | 'duct'
): number {
  const keys = Object.keys(GROUPING_FACTORS).map(Number).sort((a, b) => a - b);
  const key = keys.reduce((prev, curr) =>
    Math.abs(curr - numCables) < Math.abs(prev - numCables) ? curr : prev
  );
  return GROUPING_FACTORS[key]?.[method] ?? 1.0;
}
