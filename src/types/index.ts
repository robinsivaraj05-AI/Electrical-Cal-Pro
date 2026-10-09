export interface Project {
  id: string;
  name: string;
  client: string;
  engineer: string;
  projectNo: string;
  revision: string;
  date: string;
  companyName: string;
  companyLogo?: string;
  calculations: Calculation[];
  createdAt: string;
  updatedAt: string;
}

export interface Calculation {
  id: string;
  type: CalculationType;
  title: string;
  inputs: Record<string, number | string>;
  results: CalculationResult;
  timestamp: string;
  notes: string;
  standard: string;
}

export interface CalculationResult {
  values: ResultValue[];
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  recommendation: string;
  formula: string;
  steps: CalculationStep[];
  standardRef: StandardReference;
  safetyFactor?: number;
}

export interface ResultValue {
  label: string;
  value: number | string;
  unit: string;
  status?: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  highlight?: boolean;
}

export interface CalculationStep {
  step: number;
  description: string;
  formula: string;
  result: string;
}

export interface StandardReference {
  standard: string;
  clause: string;
  table?: string;
  equation?: string;
  title: string;
}

export type CalculationType =
  | 'cable-current'
  | 'cable-sizing'
  | 'voltage-drop'
  | 'short-circuit'
  | 'motor'
  | 'olr'
  | 'mccb'
  | 'mcb'
  | 'transformer'
  | 'ct'
  | 'pt'
  | 'busbar'
  | 'ups'
  | 'dg'
  | 'capacitor'
  | 'harmonic'
  | 'earthing'
  | 'lightning'
  | 'lighting'
  | 'load-schedule'
  | 'ht-switchgear'
  | 'relay'
  | 'arc-flash'
  | 'instrumentation'
  | 'battery'
  | 'conduit-tray'
  | 'cable-gland'
  | 'hvac'
  | 'solar-pv'
  | 'wind'
  | 'ev-charger'
  | 'hv-ir-test'
  | 'hv-contact-resistance'
  | 'hv-cb-timing'
  | 'hv-earth-test'
  | 'hv-sf6-test'
  | 'hv-relay-test'
  | 'hv-ct-test'
  | 'hv-short-circuit'
  | 'hv-arc-flash'
  | 'hv-relay-settings'
  | 'hv-ct-selection'
  | 'hv-ground-grid'
  | 'hv-per-unit'
  | 'hv-ngr'
  | 'hv-battery-dc'
  | 'hv-reliability'
  | 'hv-transformer-fault'
  | 'electrical-calc'
  | 'cable-bom';

export interface AppSettings {
  theme: 'dark' | 'light';
  unitSystem: 'metric' | 'imperial';
  standard: 'IEC' | 'IEEE' | 'NEC' | 'BS' | 'IS';
  companyName: string;
  companyLogo?: string;
  engineerName: string;
  autoSave: boolean;
}

export interface CableData {
  size: number; // mm²
  type: 'Cu' | 'Al';
  insulation: 'PVC' | 'XLPE' | 'EPR';
  coreConfig: '1C' | '3C' | '4C';
  ampacity: {
    A: number; // In Air
    T: number; // In Tray
    G: number; // In Ground
    D: number; // In Duct
    C: number; // In Conduit
  };
  resistance: number; // Ω/km at 90°C
  reactance: number;  // Ω/km
  weight: number;     // kg/m
  od: number;         // Overall diameter mm
}

export interface MotorData {
  kw: number;
  hp: number;
  voltage: number;
  phases: 1 | 3;
  fullLoadCurrent: number;
  startingCurrent: number; // × FLC
  efficiency: number;
  powerFactor: number;
  poles: number;
  speed: number; // RPM
  frame: string;
}

export interface Module {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  standard: string;
  implemented: boolean;
}
