import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PanelType = 'MDB' | 'SMDB' | 'MCC' | 'DB' | 'EDB' | 'ESMDB' | 'SDB' | 'MLDB' | 'Other';
export type InstallStatus = 'Not Started' | 'In Progress' | 'Completed';
export type InspStatus = 'Pending' | 'Scheduled' | 'Passed' | 'Failed';

export type FeederInstallStatus =
  | 'Not Started'
  | 'Cable Required'
  | 'Cable Laid'
  | 'Termination Pending'
  | 'Terminated'
  | 'Field Verification Pending'
  | 'Verified'
  | 'Cable Not Connected'
  | 'Completed'
  | 'On Hold';

export const FEEDER_INSTALL_STATUSES: FeederInstallStatus[] = [
  'Not Started', 'Cable Required', 'Cable Laid', 'Termination Pending',
  'Terminated', 'Field Verification Pending', 'Verified',
  'Cable Not Connected', 'Completed', 'On Hold',
];

export const FIELD_VERIFY_STATUSES = ['Pending', 'In Progress', 'Verified', 'Not Required', 'Failed'] as const;

export interface LVPanel {
  id: string; panelId: string; panelName: string; panelType: PanelType;
  electricalArea: string; location: string; parentPanel: string;
  incomingFeederRef: string; ratedVoltage: number; phases: 1 | 3;
  ratedCurrentA: number; incomingBreakerType: string; incomingBreakerRating: number;
  faultDutyKA: number; connectedLoadKW: number; maxDemandKW: number;
  incomingCableSize: string; earthingConductorSize: string; energyMeter: boolean;
  installationStatus: InstallStatus; inspectionStatus: InspStatus;
  commissioningStatus: InstallStatus; remarks: string;
  createdAt: string; updatedAt: string;
}

export interface LVLoad {
  id: string;
  panelId: string;
  circuitRef: string;
  /** Feeder or equipment description */
  description: string;
  /** Equipment name (tag or nameplate label) */
  equipmentName: string;
  area: string;
  loadCategory: string;
  /**
   * Load Factor = average demand / peak demand over a period.
   * This is an operational characteristic of the load, NOT used to reduce
   * connected load in demand calculations. Range 0–1.
   */
  loadFactor: number;
  ratedKW: number;
  powerFactor: number;
  phases: 1 | 3;
  voltage: number;
  quantity: number;
  /**
   * Demand Factor = maximum demand / total connected load.
   * Applied as: Maximum Demand = Total Connected Load × Demand Factor.
   * Range 0–1 (occasionally >1 for future-proofing). Default 1.0.
   */
  demandFactor: number;
  /** Operating current (A) — derived from kW, PF, V, phases */
  designCurrentA: number;
  startingCurrentA: number;
  breakerType: string;
  breakerRating: number;
  /** Fault-duty rating of the protective device (kA) */
  faultDutyKA: number;
  cableType: string;
  cableSize: string;
  earthingConductorSize: string;
  remarks: string;
}

export interface LVFeeder {
  id: string;
  serialNo: string;
  feederRef: string;
  fromPanel: string;
  toPanel: string;
  description: string;
  area: string;
  loadKW: number;
  loadPF: number;
  phases: 1 | 3;
  voltage: number;
  designCurrentA: number;
  cableSize: string;
  cableType: string;
  numCores: number;
  /** Required cable length from design drawings (m) */
  requiredLengthM: number;
  /** Actual installed cable length measured on site (m) */
  actualLengthM: number;
  numRuns: number;
  breakerRating: number;
  breakerType: string;
  demandFactor: number;
  earthingCableSize: string;
  installationStatus: FeederInstallStatus;
  fieldVerificationStatus: string;
  inspectionRemarks: string;
  remarks: string;
  createdAt: string;
}

export interface LVMeter {
  id: string; meterRef: string; panelId: string; meterType: string;
  ctRatio: string; accuracy: string; serialNumber: string;
  installationStatus: 'Pending' | 'Installed' | 'Calibrated'; remarks: string;
}

export interface LVDrawing {
  id: string; drawingNo: string; title: string; discipline: string;
  revision: string; date: string;
  status: 'Draft' | 'Issued for Approval' | 'Issued for Construction' | 'As-Built';
  relatedPanels: string; remarks: string;
}

export interface LVInspection {
  id: string; panelId: string; inspectionDate: string; inspector: string;
  type: 'Visual' | 'Functional' | 'Commissioning';
  status: 'Pending' | 'Passed' | 'Failed' | 'Conditional';
  findings: string; actionRequired: string; remarks: string;
}

export interface LVDocument {
  id: string; docRef: string; title: string; category: string;
  revision: string; date: string; author: string; status: string;
  relatedPanels: string; remarks: string;
}

export interface LVProjectInfo {
  projectName: string; projectNo: string; client: string; site: string;
  engineer: string; revisionNo: string; date: string;
  systemVoltage: number; frequency: number; remarks: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultProject: LVProjectInfo = {
  projectName: 'MEP RAK-516', projectNo: 'RAK-516', client: '',
  site: '', engineer: '', revisionNo: 'Rev.0',
  date: new Date().toISOString().slice(0, 10),
  systemVoltage: 400, frequency: 50, remarks: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LS_PREFIX = 'elec-lv-';

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function saveLS<T>(key: string, value: T): void {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch { /* quota */ }
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toISOString();

/** Migrate stored loads — adds missing fields introduced in later versions */
function migrateLoad(raw: Record<string, unknown>): LVLoad {
  return {
    id: String(raw.id ?? uid()),
    panelId: String(raw.panelId ?? ''),
    circuitRef: String(raw.circuitRef ?? ''),
    description: String(raw.description ?? ''),
    equipmentName: String(raw.equipmentName ?? ''),
    area: String(raw.area ?? ''),
    loadCategory: String(raw.loadCategory ?? raw.loadType ?? 'General'),
    loadFactor: Number(raw.loadFactor ?? 1),
    ratedKW: Number(raw.ratedKW ?? 0),
    powerFactor: Number(raw.powerFactor ?? 0.85),
    phases: (raw.phases === 1 || raw.phases === '1') ? 1 : 3,
    voltage: Number(raw.voltage ?? 400),
    quantity: Number(raw.quantity ?? 1),
    demandFactor: Number(raw.demandFactor ?? 1),
    designCurrentA: Number(raw.designCurrentA ?? 0),
    startingCurrentA: Number(raw.startingCurrentA ?? 0),
    breakerType: String(raw.breakerType ?? 'MCB'),
    breakerRating: Number(raw.breakerRating ?? 0),
    faultDutyKA: Number(raw.faultDutyKA ?? 0),
    cableType: String(raw.cableType ?? ''),
    cableSize: String(raw.cableSize ?? ''),
    earthingConductorSize: String(raw.earthingConductorSize ?? ''),
    remarks: String(raw.remarks ?? ''),
  };
}

/** Migrate stored feeders — adds missing fields */
function migrateFeeder(raw: Record<string, unknown>): LVFeeder {
  return {
    id: String(raw.id ?? uid()),
    serialNo: String(raw.serialNo ?? ''),
    feederRef: String(raw.feederRef ?? ''),
    fromPanel: String(raw.fromPanel ?? ''),
    toPanel: String(raw.toPanel ?? ''),
    description: String(raw.description ?? ''),
    area: String(raw.area ?? ''),
    loadKW: Number(raw.loadKW ?? 0),
    loadPF: Number(raw.loadPF ?? 0.85),
    phases: (raw.phases === 1 || raw.phases === '1') ? 1 : 3,
    voltage: Number(raw.voltage ?? 400),
    designCurrentA: Number(raw.designCurrentA ?? 0),
    cableSize: String(raw.cableSize ?? ''),
    cableType: String(raw.cableType ?? ''),
    numCores: Number(raw.numCores ?? 4),
    requiredLengthM: Number(raw.requiredLengthM ?? raw.cableLength ?? 0),
    actualLengthM: Number(raw.actualLengthM ?? 0),
    numRuns: Number(raw.numRuns ?? 1),
    breakerRating: Number(raw.breakerRating ?? 0),
    breakerType: String(raw.breakerType ?? 'MCCB'),
    demandFactor: Number(raw.demandFactor ?? 1),
    earthingCableSize: String(raw.earthingCableSize ?? ''),
    installationStatus: (raw.installationStatus as FeederInstallStatus) ?? 'Not Started',
    fieldVerificationStatus: String(raw.fieldVerificationStatus ?? 'Pending'),
    inspectionRemarks: String(raw.inspectionRemarks ?? ''),
    remarks: String(raw.remarks ?? ''),
    createdAt: String(raw.createdAt ?? now()),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface LVPanelState {
  projectInfo: LVProjectInfo;
  panels: LVPanel[];
  feeders: LVFeeder[];
  loads: LVLoad[];
  meters: LVMeter[];
  drawings: LVDrawing[];
  inspections: LVInspection[];
  documents: LVDocument[];

  setProjectInfo: (info: Partial<LVProjectInfo>) => void;
  addPanel: (p: Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePanel: (id: string, p: Partial<LVPanel>) => void;
  deletePanel: (id: string) => void;
  addFeeder: (f: Omit<LVFeeder, 'id' | 'createdAt'>) => void;
  updateFeeder: (id: string, f: Partial<LVFeeder>) => void;
  deleteFeeder: (id: string) => void;
  addLoad: (l: Omit<LVLoad, 'id'>) => void;
  updateLoad: (id: string, l: Partial<LVLoad>) => void;
  deleteLoad: (id: string) => void;
  addMeter: (m: Omit<LVMeter, 'id'>) => void;
  updateMeter: (id: string, m: Partial<LVMeter>) => void;
  deleteMeter: (id: string) => void;
  addDrawing: (d: Omit<LVDrawing, 'id'>) => void;
  updateDrawing: (id: string, d: Partial<LVDrawing>) => void;
  deleteDrawing: (id: string) => void;
  addInspection: (i: Omit<LVInspection, 'id'>) => void;
  updateInspection: (id: string, i: Partial<LVInspection>) => void;
  deleteInspection: (id: string) => void;
  addDocument: (d: Omit<LVDocument, 'id'>) => void;
  updateDocument: (id: string, d: Partial<LVDocument>) => void;
  deleteDocument: (id: string) => void;
  importPanels: (panels: Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'>[], merge?: boolean) => void;
  importFeeders: (feeders: Omit<LVFeeder, 'id' | 'createdAt'>[], merge?: boolean) => void;
  importLoads: (loads: Omit<LVLoad, 'id'>[], merge?: boolean) => void;
  clearAll: () => void;
}

export const useLVPanelStore = create<LVPanelState>((set, get) => ({
  projectInfo: loadLS<LVProjectInfo>('project', defaultProject),
  panels: loadLS<LVPanel[]>('panels', []),
  feeders: (loadLS<Record<string, unknown>[]>('feeders', [])).map(migrateFeeder),
  loads: (loadLS<Record<string, unknown>[]>('loads', [])).map(migrateLoad),
  meters: loadLS<LVMeter[]>('meters', []),
  drawings: loadLS<LVDrawing[]>('drawings', []),
  inspections: loadLS<LVInspection[]>('inspections', []),
  documents: loadLS<LVDocument[]>('documents', []),

  setProjectInfo: (info) => {
    const updated = { ...get().projectInfo, ...info };
    saveLS('project', updated); set({ projectInfo: updated });
  },

  addPanel: (p) => {
    const panels = [...get().panels, { ...p, id: uid(), createdAt: now(), updatedAt: now() }];
    saveLS('panels', panels); set({ panels });
  },
  updatePanel: (id, p) => {
    const panels = get().panels.map(x => x.id === id ? { ...x, ...p, updatedAt: now() } : x);
    saveLS('panels', panels); set({ panels });
  },
  deletePanel: (id) => {
    const panels = get().panels.filter(x => x.id !== id);
    saveLS('panels', panels); set({ panels });
  },

  addFeeder: (f) => {
    const feeders = [...get().feeders, migrateFeeder({ ...f, id: uid(), createdAt: now() })];
    saveLS('feeders', feeders); set({ feeders });
  },
  updateFeeder: (id, f) => {
    const feeders = get().feeders.map(x => x.id === id ? { ...x, ...f } : x);
    saveLS('feeders', feeders); set({ feeders });
  },
  deleteFeeder: (id) => {
    const feeders = get().feeders.filter(x => x.id !== id);
    saveLS('feeders', feeders); set({ feeders });
  },

  addLoad: (l) => {
    const loads = [...get().loads, migrateLoad({ ...l, id: uid() })];
    saveLS('loads', loads); set({ loads });
  },
  updateLoad: (id, l) => {
    const loads = get().loads.map(x => x.id === id ? { ...x, ...l } : x);
    saveLS('loads', loads); set({ loads });
  },
  deleteLoad: (id) => {
    const loads = get().loads.filter(x => x.id !== id);
    saveLS('loads', loads); set({ loads });
  },

  addMeter: (m) => {
    const meters = [...get().meters, { ...m, id: uid() }];
    saveLS('meters', meters); set({ meters });
  },
  updateMeter: (id, m) => {
    const meters = get().meters.map(x => x.id === id ? { ...x, ...m } : x);
    saveLS('meters', meters); set({ meters });
  },
  deleteMeter: (id) => {
    const meters = get().meters.filter(x => x.id !== id);
    saveLS('meters', meters); set({ meters });
  },

  addDrawing: (d) => {
    const drawings = [...get().drawings, { ...d, id: uid() }];
    saveLS('drawings', drawings); set({ drawings });
  },
  updateDrawing: (id, d) => {
    const drawings = get().drawings.map(x => x.id === id ? { ...x, ...d } : x);
    saveLS('drawings', drawings); set({ drawings });
  },
  deleteDrawing: (id) => {
    const drawings = get().drawings.filter(x => x.id !== id);
    saveLS('drawings', drawings); set({ drawings });
  },

  addInspection: (i) => {
    const inspections = [...get().inspections, { ...i, id: uid() }];
    saveLS('inspections', inspections); set({ inspections });
  },
  updateInspection: (id, i) => {
    const inspections = get().inspections.map(x => x.id === id ? { ...x, ...i } : x);
    saveLS('inspections', inspections); set({ inspections });
  },
  deleteInspection: (id) => {
    const inspections = get().inspections.filter(x => x.id !== id);
    saveLS('inspections', inspections); set({ inspections });
  },

  addDocument: (d) => {
    const documents = [...get().documents, { ...d, id: uid() }];
    saveLS('documents', documents); set({ documents });
  },
  updateDocument: (id, d) => {
    const documents = get().documents.map(x => x.id === id ? { ...x, ...d } : x);
    saveLS('documents', documents); set({ documents });
  },
  deleteDocument: (id) => {
    const documents = get().documents.filter(x => x.id !== id);
    saveLS('documents', documents); set({ documents });
  },

  importPanels: (panels, merge = false) => {
    const existing = get().panels;
    const existingIds = new Set(existing.map(p => p.panelId));
    const newPanels = merge
      ? [...existing, ...panels.filter(p => !existingIds.has(p.panelId)).map(p => ({ ...p, id: uid(), createdAt: now(), updatedAt: now() }))]
      : panels.map(p => ({ ...p, id: uid(), createdAt: now(), updatedAt: now() }));
    saveLS('panels', newPanels); set({ panels: newPanels });
  },

  importFeeders: (feeders, merge = false) => {
    const existing = get().feeders;
    const existingRefs = new Set(existing.map(f => f.feederRef));
    const toAdd = merge ? feeders.filter(f => !existingRefs.has(f.feederRef)) : feeders;
    const newFeeders = merge
      ? [...existing, ...toAdd.map(f => migrateFeeder({ ...f, id: uid(), createdAt: now() }))]
      : feeders.map(f => migrateFeeder({ ...f, id: uid(), createdAt: now() }));
    saveLS('feeders', newFeeders); set({ feeders: newFeeders });
  },

  importLoads: (loads, merge = false) => {
    const existing = get().loads;
    const newLoads = merge
      ? [...existing, ...loads.map(l => migrateLoad({ ...l, id: uid() }))]
      : loads.map(l => migrateLoad({ ...l, id: uid() }));
    saveLS('loads', newLoads); set({ loads: newLoads });
  },

  clearAll: () => {
    ['panels', 'feeders', 'loads', 'meters', 'drawings', 'inspections', 'documents'].forEach(k => saveLS(k, []));
    set({ panels: [], feeders: [], loads: [], meters: [], drawings: [], inspections: [], documents: [] });
  },
}));
