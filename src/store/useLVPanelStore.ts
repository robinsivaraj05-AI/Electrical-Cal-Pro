import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PanelType = 'MDB' | 'SMDB' | 'MCC' | 'DB' | 'EDB' | 'ESMDB' | 'SDB' | 'MLDB' | 'Other';
export type InstallStatus = 'Not Started' | 'In Progress' | 'Completed';
export type InspStatus = 'Pending' | 'Scheduled' | 'Passed' | 'Failed';

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

export interface LVFeeder {
  id: string; feederRef: string; fromPanel: string; toPanel: string;
  description: string; area: string; loadKW: number; loadPF: number;
  phases: 1 | 3; voltage: number; designCurrentA: number;
  cableSize: string; cableType: string; cableLength: number; numRuns: number;
  breakerRating: number; breakerType: string; demandFactor: number;
  installationStatus: 'Pending' | 'Installed' | 'Verified'; remarks: string; createdAt: string;
}

export interface LVLoad {
  id: string; panelId: string; circuitRef: string; description: string;
  area: string; loadType: string; ratedKW: number; powerFactor: number;
  phases: 1 | 3; voltage: number; demandFactor: number; quantity: number;
  designCurrentA: number; startingCurrentA: number; breakerRating: number;
  cableSize: string; remarks: string;
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

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toISOString();

// ─── Store Interface ──────────────────────────────────────────────────────────

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

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLVPanelStore = create<LVPanelState>((set, get) => ({
  projectInfo: load<LVProjectInfo>('project', defaultProject),
  panels: load<LVPanel[]>('panels', []),
  feeders: load<LVFeeder[]>('feeders', []),
  loads: load<LVLoad[]>('loads', []),
  meters: load<LVMeter[]>('meters', []),
  drawings: load<LVDrawing[]>('drawings', []),
  inspections: load<LVInspection[]>('inspections', []),
  documents: load<LVDocument[]>('documents', []),

  setProjectInfo: (info) => {
    const updated = { ...get().projectInfo, ...info };
    save('project', updated);
    set({ projectInfo: updated });
  },

  addPanel: (p) => {
    const panel: LVPanel = { ...p, id: uid(), createdAt: now(), updatedAt: now() };
    const panels = [...get().panels, panel];
    save('panels', panels);
    set({ panels });
  },

  updatePanel: (id, p) => {
    const panels = get().panels.map(x => x.id === id ? { ...x, ...p, updatedAt: now() } : x);
    save('panels', panels);
    set({ panels });
  },

  deletePanel: (id) => {
    const panels = get().panels.filter(x => x.id !== id);
    save('panels', panels);
    set({ panels });
  },

  addFeeder: (f) => {
    const feeder: LVFeeder = { ...f, id: uid(), createdAt: now() };
    const feeders = [...get().feeders, feeder];
    save('feeders', feeders);
    set({ feeders });
  },

  updateFeeder: (id, f) => {
    const feeders = get().feeders.map(x => x.id === id ? { ...x, ...f } : x);
    save('feeders', feeders);
    set({ feeders });
  },

  deleteFeeder: (id) => {
    const feeders = get().feeders.filter(x => x.id !== id);
    save('feeders', feeders);
    set({ feeders });
  },

  addLoad: (l) => {
    const lObj: LVLoad = { ...l, id: uid() };
    const loads = [...get().loads, lObj];
    save('loads', loads);
    set({ loads });
  },

  updateLoad: (id, l) => {
    const loads = get().loads.map(x => x.id === id ? { ...x, ...l } : x);
    save('loads', loads);
    set({ loads });
  },

  deleteLoad: (id) => {
    const loads = get().loads.filter(x => x.id !== id);
    save('loads', loads);
    set({ loads });
  },

  addMeter: (m) => {
    const meter: LVMeter = { ...m, id: uid() };
    const meters = [...get().meters, meter];
    save('meters', meters);
    set({ meters });
  },

  updateMeter: (id, m) => {
    const meters = get().meters.map(x => x.id === id ? { ...x, ...m } : x);
    save('meters', meters);
    set({ meters });
  },

  deleteMeter: (id) => {
    const meters = get().meters.filter(x => x.id !== id);
    save('meters', meters);
    set({ meters });
  },

  addDrawing: (d) => {
    const drawing: LVDrawing = { ...d, id: uid() };
    const drawings = [...get().drawings, drawing];
    save('drawings', drawings);
    set({ drawings });
  },

  updateDrawing: (id, d) => {
    const drawings = get().drawings.map(x => x.id === id ? { ...x, ...d } : x);
    save('drawings', drawings);
    set({ drawings });
  },

  deleteDrawing: (id) => {
    const drawings = get().drawings.filter(x => x.id !== id);
    save('drawings', drawings);
    set({ drawings });
  },

  addInspection: (i) => {
    const inspection: LVInspection = { ...i, id: uid() };
    const inspections = [...get().inspections, inspection];
    save('inspections', inspections);
    set({ inspections });
  },

  updateInspection: (id, i) => {
    const inspections = get().inspections.map(x => x.id === id ? { ...x, ...i } : x);
    save('inspections', inspections);
    set({ inspections });
  },

  deleteInspection: (id) => {
    const inspections = get().inspections.filter(x => x.id !== id);
    save('inspections', inspections);
    set({ inspections });
  },

  addDocument: (d) => {
    const doc: LVDocument = { ...d, id: uid() };
    const documents = [...get().documents, doc];
    save('documents', documents);
    set({ documents });
  },

  updateDocument: (id, d) => {
    const documents = get().documents.map(x => x.id === id ? { ...x, ...d } : x);
    save('documents', documents);
    set({ documents });
  },

  deleteDocument: (id) => {
    const documents = get().documents.filter(x => x.id !== id);
    save('documents', documents);
    set({ documents });
  },

  importPanels: (panels, merge = false) => {
    const existing = get().panels;
    const existingIds = new Set(existing.map(p => p.panelId));
    const toAdd = merge
      ? panels.filter(p => !existingIds.has(p.panelId))
      : panels;
    const newPanels = merge
      ? [...existing, ...toAdd.map(p => ({ ...p, id: uid(), createdAt: now(), updatedAt: now() }))]
      : panels.map(p => ({ ...p, id: uid(), createdAt: now(), updatedAt: now() }));
    save('panels', newPanels);
    set({ panels: newPanels });
  },

  importFeeders: (feeders, merge = false) => {
    const existing = get().feeders;
    const existingRefs = new Set(existing.map(f => f.feederRef));
    const toAdd = merge
      ? feeders.filter(f => !existingRefs.has(f.feederRef))
      : feeders;
    const newFeeders = merge
      ? [...existing, ...toAdd.map(f => ({ ...f, id: uid(), createdAt: now() }))]
      : feeders.map(f => ({ ...f, id: uid(), createdAt: now() }));
    save('feeders', newFeeders);
    set({ feeders: newFeeders });
  },

  importLoads: (loads, merge = false) => {
    const existing = get().loads;
    const newLoads = merge
      ? [...existing, ...loads.map(l => ({ ...l, id: uid() }))]
      : loads.map(l => ({ ...l, id: uid() }));
    save('loads', newLoads);
    set({ loads: newLoads });
  },

  clearAll: () => {
    save('panels', []);
    save('feeders', []);
    save('loads', []);
    save('meters', []);
    save('drawings', []);
    save('inspections', []);
    save('documents', []);
    set({
      panels: [], feeders: [], loads: [], meters: [],
      drawings: [], inspections: [], documents: [],
    });
  },
}));
