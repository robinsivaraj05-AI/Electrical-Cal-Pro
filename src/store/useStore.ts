import { create } from 'zustand';
import type { Project, AppSettings, Calculation } from '../types';
import { getToken } from '../api/client';
import { projectsApi, calculationsApi } from '../api';

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  settings: AppSettings;
  activeModule: string;
  sidebarOpen: boolean;
  calculationHistory: Calculation[];
  isSyncing: boolean;

  setActiveModule: (module: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'calculations'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  addCalculation: (calc: Omit<Calculation, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  syncFromCloud: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  unitSystem: 'metric',
  standard: 'IEC',
  companyName: 'Engineering Corp.',
  engineerName: 'Engineer',
  autoSave: true,
};

const STORAGE_KEY = 'elec-eng-suite';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(data));
  } catch {}
}

const isLoggedIn = () => !!getToken();

export const useStore = create<AppState>((set, get) => ({
  projects:           loadFromStorage<Project[]>('projects', []),
  activeProjectId:    loadFromStorage<string | null>('activeProjectId', null),
  settings:           loadFromStorage<AppSettings>('settings', defaultSettings),
  activeModule:       'dashboard',
  sidebarOpen:        true,
  calculationHistory: loadFromStorage<Calculation[]>('history', []),
  isSyncing:          false,

  setActiveModule: (module) => set({ activeModule: module }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setTheme: (theme) => {
    set((s) => ({ settings: { ...s.settings, theme } }));
    saveToStorage('settings', { ...get().settings, theme });
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme: () => {
    const current = get().settings.theme;
    get().setTheme(current === 'dark' ? 'light' : 'dark');
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    saveToStorage('settings', next);
  },

  createProject: async (data) => {
    const localId = crypto.randomUUID();
    const project: Project = {
      ...data,
      id: localId,
      calculations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const projects = [...get().projects, project];
    set({ projects, activeProjectId: project.id });
    saveToStorage('projects', projects);
    saveToStorage('activeProjectId', project.id);

    // Sync to cloud
    if (isLoggedIn()) {
      try {
        const res = await projectsApi.create({
          name: data.name, client: data.client, engineer: data.engineer,
          projectNo: data.projectNo, revision: data.revision, date: data.date,
          companyName: data.companyName,
        });
        // Replace local id with cloud id
        const cloudId = res.project.id;
        const updated = get().projects.map((p) =>
          p.id === localId ? { ...p, id: cloudId } : p
        );
        set({ projects: updated, activeProjectId: cloudId });
        saveToStorage('projects', updated);
        saveToStorage('activeProjectId', cloudId);
      } catch { /* offline — local only */ }
    }
  },

  updateProject: (id, data) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
    );
    set({ projects });
    saveToStorage('projects', projects);
    if (isLoggedIn()) {
      projectsApi.update(id, data).catch(() => {});
    }
  },

  deleteProject: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    const activeProjectId = get().activeProjectId === id ? null : get().activeProjectId;
    set({ projects, activeProjectId });
    saveToStorage('projects', projects);
    saveToStorage('activeProjectId', activeProjectId);
    if (isLoggedIn()) {
      projectsApi.delete(id).catch(() => {});
    }
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id });
    saveToStorage('activeProjectId', id);
  },

  addCalculation: (calc) => {
    const calculation: Calculation = {
      ...calc,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const history = [calculation, ...get().calculationHistory].slice(0, 100);
    set({ calculationHistory: history });
    saveToStorage('history', history);

    const { activeProjectId, projects } = get();
    if (activeProjectId) {
      const updatedProjects = projects.map((p) =>
        p.id === activeProjectId
          ? { ...p, calculations: [calculation, ...p.calculations], updatedAt: new Date().toISOString() }
          : p
      );
      set({ projects: updatedProjects });
      saveToStorage('projects', updatedProjects);

      // Sync to cloud
      if (isLoggedIn()) {
        calculationsApi.save({
          projectId: activeProjectId,
          type: calc.type,
          title: calc.title,
          inputs: calc.inputs as Record<string, unknown>,
          results: calc.results as Record<string, unknown>,
          notes: calc.notes,
          standard: calc.standard,
        }).catch(() => {});
      }
    }
  },

  clearHistory: () => {
    set({ calculationHistory: [] });
    saveToStorage('history', []);
  },

  syncFromCloud: async () => {
    if (!isLoggedIn()) return;
    set({ isSyncing: true });
    try {
      const res = await projectsApi.list({ limit: 50 });
      const cloudProjects: Project[] = res.projects.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.client ?? '',
        engineer: p.engineer,
        projectNo: p.projectNo ?? '',
        revision: p.revision,
        date: p.date ?? '',
        companyName: p.companyName ?? '',
        calculations: [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
      if (cloudProjects.length > 0) {
        set({ projects: cloudProjects });
        saveToStorage('projects', cloudProjects);
      }
    } catch { /* offline */ }
    set({ isSyncing: false });
  },
}));

// Initialize theme on load
const storedSettings = loadFromStorage<AppSettings>('settings', defaultSettings);
document.documentElement.setAttribute('data-theme', storedSettings.theme);
