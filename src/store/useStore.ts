import { create } from 'zustand';
import type { Project, AppSettings, Calculation } from '../types';

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  settings: AppSettings;
  activeModule: string;
  sidebarOpen: boolean;
  calculationHistory: Calculation[];

  // Actions
  setActiveModule: (module: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'calculations'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  addCalculation: (calc: Omit<Calculation, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
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

export const useStore = create<AppState>((set, get) => ({
  projects: loadFromStorage<Project[]>('projects', []),
  activeProjectId: loadFromStorage<string | null>('activeProjectId', null),
  settings: loadFromStorage<AppSettings>('settings', defaultSettings),
  activeModule: 'dashboard',
  sidebarOpen: true,
  calculationHistory: loadFromStorage<Calculation[]>('history', []),

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

  createProject: (data) => {
    const project: Project = {
      ...data,
      id: crypto.randomUUID(),
      calculations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const projects = [...get().projects, project];
    set({ projects, activeProjectId: project.id });
    saveToStorage('projects', projects);
    saveToStorage('activeProjectId', project.id);
  },

  updateProject: (id, data) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
    );
    set({ projects });
    saveToStorage('projects', projects);
  },

  deleteProject: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    const activeProjectId = get().activeProjectId === id ? null : get().activeProjectId;
    set({ projects, activeProjectId });
    saveToStorage('projects', projects);
    saveToStorage('activeProjectId', activeProjectId);
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
    }
  },

  clearHistory: () => {
    set({ calculationHistory: [] });
    saveToStorage('history', []);
  },
}));

// Initialize theme on load
const storedSettings = loadFromStorage<AppSettings>('settings', defaultSettings);
document.documentElement.setAttribute('data-theme', storedSettings.theme);
