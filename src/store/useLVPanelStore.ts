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

export type MeteringPriority = 'Critical' | 'High' | 'Normal' | 'Low';
export type EmsStatus = 'Integrated' | 'Planned' | 'Not Applicable' | 'Pending' | 'Not Available';

export interface LVMeterPhoto {
  name: string; size: number; type: string; uploadedAt: string;
  /** Base64 data URL — only stored for images ≤ 500 KB */
  dataUrl?: string;
}

export interface LVMeter {
  id: string;
  meterRef: string;
  panelId: string;
  feederId: string;
  equipmentDescription: string;
  meterRequired: boolean;
  meterInstalled: boolean;
  manufacturer: string;
  model: string;
  meterType: string;
  ctRatio: string;
  ctAccuracyClass: string;
  ctQuantity: number;
  meteringPriority: MeteringPriority;
  communicationProtocol: string;
  emsIntegrationStatus: EmsStatus;
  serialNumber: string;
  installationStatus: 'Pending' | 'Installed' | 'Calibrated';
  remarks: string;
  photos: LVMeterPhoto[];
}

export interface LVDrawingRevision {
  rev: string; date: string; description: string; author: string;
}

export interface LVDrawing {
  id: string;
  drawingNo: string;
  title: string;
  category: string;
  discipline: string;
  associatedPanel: string;
  revision: string;
  date: string;
  status: 'Draft' | 'Issued for Approval' | 'Issued for Construction' | 'As-Built';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Not Required';
  fileRef: string;
  /** Data URL only for images ≤ 500 KB */
  fileDataUrl?: string;
  revisionHistory: LVDrawingRevision[];
  remarks: string;
}

export type CalcType = 'Current' | 'VoltageDrop' | 'MaxDemand' | 'PowerFactor' | 'Other';
export type VerificationStatus = 'Unverified' | 'Engineer Reviewed' | 'Approved';

export interface LVCalcInput {
  param: string; value: string; unit: string;
}

export interface LVCalcRecord {
  id: string;
  calcType: CalcType;
  panelId: string;
  feederRef: string;
  description: string;
  inputs: LVCalcInput[];
  method: string;
  formula: string;
  result: string;
  unit: string;
  sourceWorksheet: string;
  verificationStatus: VerificationStatus;
  verifiedBy: string;
  notes: string;
  createdAt: string;
}

export interface LVBreakerState {
  breakerRef: string;
  normalState: 'Open' | 'Closed' | 'N/A';
  blackoutState: 'Open' | 'Closed' | 'N/A';
  returnState: 'Open' | 'Closed' | 'N/A';
}

export interface LVSwitchingRecord {
  id: string;
  powerSource: string;
  transformerRef: string;
  busCouplerRef: string;
  dgRef: string;
  normalCondition: string;
  blackoutCondition: string;
  returnToNormal: string;
  breakerStates: LVBreakerState[];
  interlockingReqs: string;
  operatingRemarks: string;
  relatedDrawings: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export type SiteVerifStatus =
  | 'Pending'
  | 'In Progress'
  | 'Observation Raised'
  | 'Corrective Action Pending'
  | 'Ready for Reinspection'
  | 'Verified'
  | 'Closed';

export const SITE_VERIF_STATUSES: SiteVerifStatus[] = [
  'Pending', 'In Progress', 'Observation Raised', 'Corrective Action Pending',
  'Ready for Reinspection', 'Verified', 'Closed',
];

export type CheckResult = 'Pass' | 'Fail' | 'N/A' | 'Pending';

export interface LVAuditEntry {
  timestamp: string; changedBy: string; field: string;
  previousValue: string; newValue: string;
}

export interface LVImportBatch {
  id: string; filename: string; importedAt: string; sheetCount: number;
  recordsCreated: number; recordsSkipped: number; recordsFlagged: number;
  status: 'Completed' | 'Partial' | 'Failed'; errorLog: string[];
}

export interface LVInspection {
  id: string;
  panelId: string;
  feederId: string;
  inspectionDate: string;
  inspector: string;
  inspectionType: string;
  cableSizeVerified: CheckResult;
  breakerRatingVerified: CheckResult;
  cableTerminationStatus: CheckResult;
  cableTaggingStatus: CheckResult;
  earthingVerified: CheckResult;
  meterInstallVerified: CheckResult;
  drawingCompliance: CheckResult;
  photographicEvidence: LVMeterPhoto[];
  observations: string;
  correctiveActions: string;
  responsiblePerson: string;
  targetCompletionDate: string;
  closureDate: string;
  status: SiteVerifStatus;
  createdAt: string;
  updatedAt: string;
  auditTrail: LVAuditEntry[];
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

/** Migrate stored meters — adds missing fields */
function migrateMeter(raw: Record<string, unknown>): LVMeter {
  return {
    id: String(raw.id ?? uid()),
    meterRef: String(raw.meterRef ?? ''),
    panelId: String(raw.panelId ?? ''),
    feederId: String(raw.feederId ?? ''),
    equipmentDescription: String(raw.equipmentDescription ?? ''),
    meterRequired: raw.meterRequired !== false,
    meterInstalled: Boolean(raw.meterInstalled ?? raw.installationStatus === 'Installed'),
    manufacturer: String(raw.manufacturer ?? ''),
    model: String(raw.model ?? ''),
    meterType: String(raw.meterType ?? ''),
    ctRatio: String(raw.ctRatio ?? ''),
    ctAccuracyClass: String(raw.ctAccuracyClass ?? raw.accuracy ?? ''),
    ctQuantity: Number(raw.ctQuantity ?? 1),
    meteringPriority: (raw.meteringPriority as MeteringPriority) ?? 'Normal',
    communicationProtocol: String(raw.communicationProtocol ?? ''),
    emsIntegrationStatus: (raw.emsIntegrationStatus as EmsStatus) ?? 'Not Applicable',
    serialNumber: String(raw.serialNumber ?? ''),
    installationStatus: (raw.installationStatus as LVMeter['installationStatus']) ?? 'Pending',
    remarks: String(raw.remarks ?? ''),
    photos: (raw.photos as LVMeterPhoto[]) ?? [],
  };
}

/** Migrate stored drawings — adds missing fields */
function migrateDrawing(raw: Record<string, unknown>): LVDrawing {
  return {
    id: String(raw.id ?? uid()),
    drawingNo: String(raw.drawingNo ?? ''),
    title: String(raw.title ?? ''),
    category: String(raw.category ?? 'Electrical'),
    discipline: String(raw.discipline ?? 'Electrical'),
    associatedPanel: String(raw.associatedPanel ?? raw.relatedPanels ?? ''),
    revision: String(raw.revision ?? 'Rev.0'),
    date: String(raw.date ?? ''),
    status: (raw.status as LVDrawing['status']) ?? 'Draft',
    approvalStatus: (raw.approvalStatus as LVDrawing['approvalStatus']) ?? 'Pending',
    fileRef: String(raw.fileRef ?? ''),
    fileDataUrl: raw.fileDataUrl as string | undefined,
    revisionHistory: (raw.revisionHistory as LVDrawingRevision[]) ?? [],
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

/** Migrate stored inspections — maps old fields to new interface */
function migrateInspection(raw: Record<string, unknown>): LVInspection {
  const chk = (v: unknown): CheckResult => (['Pass','Fail','N/A','Pending'].includes(v as string) ? v as CheckResult : 'Pending');
  return {
    id: String(raw.id ?? uid()),
    panelId: String(raw.panelId ?? ''),
    feederId: String(raw.feederId ?? ''),
    inspectionDate: String(raw.inspectionDate ?? ''),
    inspector: String(raw.inspector ?? ''),
    inspectionType: String(raw.inspectionType ?? raw.type ?? 'Visual'),
    cableSizeVerified: chk(raw.cableSizeVerified),
    breakerRatingVerified: chk(raw.breakerRatingVerified),
    cableTerminationStatus: chk(raw.cableTerminationStatus),
    cableTaggingStatus: chk(raw.cableTaggingStatus),
    earthingVerified: chk(raw.earthingVerified),
    meterInstallVerified: chk(raw.meterInstallVerified),
    drawingCompliance: chk(raw.drawingCompliance),
    photographicEvidence: (raw.photographicEvidence as LVMeterPhoto[]) ?? [],
    observations: String(raw.observations ?? raw.findings ?? ''),
    correctiveActions: String(raw.correctiveActions ?? raw.actionRequired ?? ''),
    responsiblePerson: String(raw.responsiblePerson ?? ''),
    targetCompletionDate: String(raw.targetCompletionDate ?? ''),
    closureDate: String(raw.closureDate ?? ''),
    status: (SITE_VERIF_STATUSES.includes(raw.status as SiteVerifStatus) ? raw.status : 'Pending') as SiteVerifStatus,
    createdAt: String(raw.createdAt ?? now()),
    updatedAt: String(raw.updatedAt ?? now()),
    auditTrail: (raw.auditTrail as LVAuditEntry[]) ?? [],
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
  calcs: LVCalcRecord[];
  switchingRecords: LVSwitchingRecord[];
  importBatches: LVImportBatch[];

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
  addCalc: (c: Omit<LVCalcRecord, 'id' | 'createdAt'>) => void;
  updateCalc: (id: string, c: Partial<LVCalcRecord>) => void;
  deleteCalc: (id: string) => void;
  addSwitchingRecord: (r: Omit<LVSwitchingRecord, 'id' | 'createdAt'>) => void;
  updateSwitchingRecord: (id: string, r: Partial<LVSwitchingRecord>) => void;
  deleteSwitchingRecord: (id: string) => void;
  addImportBatch: (b: Omit<LVImportBatch, 'id'>) => void;
  importPanels: (panels: Omit<LVPanel, 'id' | 'createdAt' | 'updatedAt'>[], mode?: ImportMode) => void;
  importFeeders: (feeders: Omit<LVFeeder, 'id' | 'createdAt'>[], mode?: ImportMode) => void;
  importLoads: (loads: Omit<LVLoad, 'id'>[], mode?: ImportMode) => void;
  loadFromJSON: (data: LVProjectSnapshot) => void;
  clearAll: () => void;
}

export type ImportMode = 'merge' | 'update' | 'replace';

export interface LVProjectSnapshot {
  _version: number;
  exportedAt: string;
  projectInfo?: LVProjectInfo;
  panels?: LVPanel[];
  feeders?: LVFeeder[];
  loads?: LVLoad[];
  meters?: LVMeter[];
  drawings?: LVDrawing[];
  inspections?: LVInspection[];
  documents?: LVDocument[];
  calcs?: LVCalcRecord[];
  switchingRecords?: LVSwitchingRecord[];
}

export const useLVPanelStore = create<LVPanelState>((set, get) => ({
  projectInfo: loadLS<LVProjectInfo>('project', defaultProject),
  panels: loadLS<LVPanel[]>('panels', []),
  feeders: (loadLS<Record<string, unknown>[]>('feeders', [])).map(migrateFeeder),
  loads: (loadLS<Record<string, unknown>[]>('loads', [])).map(migrateLoad),
  meters: (loadLS<Record<string, unknown>[]>('meters', [])).map(migrateMeter),
  drawings: (loadLS<Record<string, unknown>[]>('drawings', [])).map(migrateDrawing),
  inspections: (loadLS<Record<string, unknown>[]>('inspections', [])).map(migrateInspection),
  documents: loadLS<LVDocument[]>('documents', []),
  calcs: loadLS<LVCalcRecord[]>('calcs', []),
  switchingRecords: loadLS<LVSwitchingRecord[]>('switching', []),
  importBatches: loadLS<LVImportBatch[]>('importBatches', []),

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
    const meters = [...get().meters, migrateMeter({ ...m, id: uid() })];
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
    const drawings = [...get().drawings, migrateDrawing({ ...d, id: uid() })];
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
    const insp = migrateInspection({ ...i, id: uid() });
    const inspections = [...get().inspections, insp];
    saveLS('inspections', inspections); set({ inspections });
  },
  updateInspection: (id, i) => {
    const inspections = get().inspections.map(x => x.id === id ? migrateInspection({ ...x, ...i, updatedAt: now() }) : x);
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

  addCalc: (c) => {
    const calcs = [...get().calcs, { ...c, id: uid(), createdAt: now() }];
    saveLS('calcs', calcs); set({ calcs });
  },
  updateCalc: (id, c) => {
    const calcs = get().calcs.map(x => x.id === id ? { ...x, ...c } : x);
    saveLS('calcs', calcs); set({ calcs });
  },
  deleteCalc: (id) => {
    const calcs = get().calcs.filter(x => x.id !== id);
    saveLS('calcs', calcs); set({ calcs });
  },

  addSwitchingRecord: (r) => {
    const switchingRecords = [...get().switchingRecords, { ...r, id: uid(), createdAt: now() }];
    saveLS('switching', switchingRecords); set({ switchingRecords });
  },
  updateSwitchingRecord: (id, r) => {
    const switchingRecords = get().switchingRecords.map(x => x.id === id ? { ...x, ...r } : x);
    saveLS('switching', switchingRecords); set({ switchingRecords });
  },
  deleteSwitchingRecord: (id) => {
    const switchingRecords = get().switchingRecords.filter(x => x.id !== id);
    saveLS('switching', switchingRecords); set({ switchingRecords });
  },

  addImportBatch: (b) => {
    const importBatches = [...get().importBatches, { ...b, id: uid() }];
    saveLS('importBatches', importBatches); set({ importBatches });
  },

  importPanels: (panels, mode = 'merge') => {
    const existing = get().panels;
    let newPanels: LVPanel[];
    if (mode === 'replace') {
      newPanels = panels.map(p => ({ ...p, id: uid(), createdAt: now(), updatedAt: now() }));
    } else if (mode === 'update') {
      const byId = new Map(existing.map(p => [p.panelId, p]));
      panels.forEach(p => {
        if (byId.has(p.panelId)) byId.set(p.panelId, { ...byId.get(p.panelId)!, ...p, updatedAt: now() });
        else byId.set(p.panelId, { ...p, id: uid(), createdAt: now(), updatedAt: now() });
      });
      newPanels = [...byId.values()];
    } else {
      const existingIds = new Set(existing.map(p => p.panelId));
      newPanels = [...existing, ...panels.filter(p => !existingIds.has(p.panelId)).map(p => ({ ...p, id: uid(), createdAt: now(), updatedAt: now() }))];
    }
    saveLS('panels', newPanels); set({ panels: newPanels });
  },

  importFeeders: (feeders, mode = 'merge') => {
    const existing = get().feeders;
    let newFeeders: LVFeeder[];
    if (mode === 'replace') {
      newFeeders = feeders.map(f => migrateFeeder({ ...f, id: uid(), createdAt: now() }));
    } else if (mode === 'update') {
      const byRef = new Map(existing.map(f => [f.feederRef, f]));
      feeders.forEach(f => {
        if (byRef.has(f.feederRef)) byRef.set(f.feederRef, migrateFeeder({ ...byRef.get(f.feederRef)!, ...f }));
        else byRef.set(f.feederRef, migrateFeeder({ ...f, id: uid(), createdAt: now() }));
      });
      newFeeders = [...byRef.values()];
    } else {
      const existingRefs = new Set(existing.map(f => f.feederRef));
      newFeeders = [...existing, ...feeders.filter(f => !existingRefs.has(f.feederRef)).map(f => migrateFeeder({ ...f, id: uid(), createdAt: now() }))];
    }
    saveLS('feeders', newFeeders); set({ feeders: newFeeders });
  },

  importLoads: (loads, mode = 'merge') => {
    const existing = get().loads;
    let newLoads: LVLoad[];
    if (mode === 'replace') {
      newLoads = loads.map(l => migrateLoad({ ...l, id: uid() }));
    } else if (mode === 'update') {
      const byKey = new Map(existing.map(l => [`${l.panelId}::${l.circuitRef}`, l]));
      loads.forEach(l => {
        const key = `${l.panelId}::${l.circuitRef}`;
        if (byKey.has(key)) byKey.set(key, migrateLoad({ ...byKey.get(key)!, ...l }));
        else byKey.set(key, migrateLoad({ ...l, id: uid() }));
      });
      newLoads = [...byKey.values()];
    } else {
      newLoads = [...existing, ...loads.map(l => migrateLoad({ ...l, id: uid() }))];
    }
    saveLS('loads', newLoads); set({ loads: newLoads });
  },

  loadFromJSON: (data) => {
    const s: Partial<LVPanelState> = {};
    if (data.projectInfo) { saveLS('project', data.projectInfo); s.projectInfo = data.projectInfo; }
    if (data.panels)       { saveLS('panels', data.panels);      s.panels = data.panels; }
    if (data.feeders)      { const f = data.feeders.map(x => migrateFeeder(x as unknown as Record<string,unknown>)); saveLS('feeders', f); s.feeders = f; }
    if (data.loads)        { const l = data.loads.map(x => migrateLoad(x as unknown as Record<string,unknown>)); saveLS('loads', l); s.loads = l; }
    if (data.meters)       { const m = data.meters.map(x => migrateMeter(x as unknown as Record<string,unknown>)); saveLS('meters', m); s.meters = m; }
    if (data.drawings)     { const d = data.drawings.map(x => migrateDrawing(x as unknown as Record<string,unknown>)); saveLS('drawings', d); s.drawings = d; }
    if (data.inspections)  { const i = data.inspections.map(x => migrateInspection(x as unknown as Record<string,unknown>)); saveLS('inspections', i); s.inspections = i; }
    if (data.documents)    { saveLS('documents', data.documents); s.documents = data.documents; }
    if (data.calcs)        { saveLS('calcs', data.calcs); s.calcs = data.calcs; }
    if (data.switchingRecords) { saveLS('switching', data.switchingRecords); s.switchingRecords = data.switchingRecords; }
    set(s);
  },

  clearAll: () => {
    ['panels','feeders','loads','meters','drawings','inspections','documents','calcs','switching','importBatches'].forEach(k => saveLS(k, []));
    set({ panels: [], feeders: [], loads: [], meters: [], drawings: [], inspections: [], documents: [], calcs: [], switchingRecords: [], importBatches: [] });
  },
}));
