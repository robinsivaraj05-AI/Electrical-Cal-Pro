import React, { useState } from 'react';
import {
  Zap, Cable, TrendingDown, AlertTriangle, Cpu, Shield, Battery,
  Sun, LayoutDashboard, Settings, History,
  Lightbulb, Activity, Gauge, Server, Bolt, Grid3x3, Flame, Radio,
  Calculator, BookOpen, Wrench, CloudLightning, BarChart3, FileText,
  Package, ChevronRight, ChevronDown, Moon, Database, Package2, ClipboardList,
  Download, Upload,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  implemented?: boolean;
  badge?: string;
}

// Sub-items for expandable categories
const CATEGORY_SUBITEMS: Record<string, NavItem[]> = {
  _cables: [
    { id: 'cable-current',  label: 'Cable Current',    icon: Zap,           implemented: true  },
    { id: 'cable-sizing',   label: 'Cable Sizing',     icon: Cable,         implemented: true  },
    { id: 'voltage-drop',   label: 'Voltage Drop',     icon: TrendingDown,  implemented: true  },
    { id: 'short-circuit',  label: 'Short Circuit',    icon: AlertTriangle, implemented: true  },
    { id: 'cable-gland',    label: 'Cable Gland',      icon: Package,       implemented: true  },
    { id: 'conduit-tray',   label: 'Conduit & Tray',   icon: Grid3x3,       implemented: true  },
    { id: 'cable-bom',      label: 'Cable BOM Pro',    icon: FileText,      implemented: true },
  ],
  _motors: [
    { id: 'motor',  label: 'Motor Calculator', icon: Cpu,    implemented: true  },
    { id: 'olr',    label: 'OLR Selection',    icon: Shield, implemented: true  },
    { id: 'mccb',   label: 'MCCB Selection',   icon: Bolt,   implemented: true  },
    { id: 'mcb',    label: 'MCB Selection',    icon: Gauge,  implemented: true  },
  ],
  _power: [
    { id: 'ups',       label: 'UPS Calculator',   icon: Battery,   implemented: true  },
    { id: 'capacitor', label: 'Capacitor Bank',   icon: Activity,  implemented: true  },
    { id: 'busbar',    label: 'Busbar Calculator', icon: BarChart3, implemented: true  },
    { id: 'dg',        label: 'DG Generator',     icon: Cpu,       implemented: true  },
    { id: 'harmonic',  label: 'Harmonic Calc',    icon: BarChart3, implemented: true  },
  ],
  _protection: [
    { id: 'earthing',   label: 'Earthing',            icon: CloudLightning, implemented: true  },
    { id: 'ct',         label: 'CT Calculator',        icon: Radio,          implemented: true  },
    { id: 'relay',      label: 'Relay Coordination',   icon: Shield,         implemented: true  },
    { id: 'arc-flash',  label: 'Arc Flash (IEEE 1584)', icon: Flame,         implemented: true  },
  ],
  _dg: [
    { id: 'dg-dashboard',   label: 'DG Dashboard',        icon: Activity,        implemented: true },
    { id: 'dg-performance', label: 'Performance Calc',    icon: Gauge,           implemented: true },
    { id: 'dg-inspection',  label: 'A/B/C Checklists',    icon: Package2,        implemented: true },
    { id: 'dg-testing',     label: 'Testing Procedures',  icon: Wrench,          implemented: true },
    { id: 'dg-protection',  label: 'Protection System',   icon: Shield,          implemented: true },
    { id: 'dg-standards',   label: 'OEM Standard Values', icon: BookOpen,        implemented: true },
    { id: 'dg-predictive',  label: 'Predictive Maint.',   icon: TrendingDown,    implemented: true },
  ],
  _hv: [
    { id: 'hv-dashboard',     label: 'HV Dashboard',        icon: LayoutDashboard, implemented: true },
    { id: 'hv-inspection',    label: 'Visual Inspection',    icon: Package2,        implemented: true },
    { id: 'hv-testing',       label: 'HV Testing',           icon: Activity,        implemented: true },
    { id: 'hv-protection',    label: 'Protection Relay Ref', icon: Shield,          implemented: true },
    { id: 'hv-calcs',         label: 'HV Calculations',      icon: Calculator,      implemented: true },
    { id: 'hv-maintenance',   label: 'Maint. Schedule',      icon: Wrench,          implemented: true },
    { id: 'hv-fault-diag',    label: 'Fault Diagnosis',      icon: AlertTriangle,   implemented: true },
    { id: 'hv-commissioning', label: 'T&C Schedule',         icon: ClipboardList,   implemented: true },
  ],
  _ic: [
    { id: 'ic-dashboard',    label: 'I&C Dashboard',        icon: LayoutDashboard, implemented: true },
    { id: 'ic-calculators',  label: 'Instrument Calcs',     icon: Gauge,           implemented: true },
    { id: 'ic-glass',        label: 'Glass Process Calcs',  icon: Flame,           implemented: true },
    { id: 'ic-calibration',  label: 'Calibration Tools',    icon: Settings,        implemented: true },
    { id: 'ic-verification', label: 'Verification Tools',   icon: Activity,        implemented: true },
    { id: 'ic-checklists',   label: 'I&C Checklists',       icon: Package2,        implemented: true },
    { id: 'ic-study',        label: 'Engineering Study',    icon: BookOpen,        implemented: true },
    { id: 'ic-reports',      label: 'Reports & Email',      icon: FileText,        implemented: true },
  ],
  _transformer: [
    { id: 'transformer',        label: 'Transformer Calc',    icon: Activity,        implemented: true },
    { id: 'transformer-dist',   label: 'Distribution Design', icon: LayoutDashboard, implemented: true },
    { id: 'transformer-verify', label: 'Cross Verification',  icon: Shield,          implemented: true },
  ],
  _lv: [
    { id: 'lv-dashboard',       label: 'Project Dashboard',         icon: LayoutDashboard, implemented: true },
    { id: 'lv-panel-register',  label: 'Panel Register',            icon: Server,          implemented: true },
    { id: 'lv-load-schedule',   label: 'Electrical Load Schedule',  icon: FileText,        implemented: true },
    { id: 'lv-mdb-details',     label: 'MDB / SMDB / MCC Details',  icon: Zap,             implemented: true },
    { id: 'lv-feeder-cable',    label: 'Feeder & Cable Schedule',   icon: Cable,           implemented: true },
    { id: 'lv-metering-ct',     label: 'Metering & CT Details',     icon: Gauge,           implemented: true },
    { id: 'lv-load-summary',    label: 'Load Summary',              icon: BarChart3,       implemented: true },
    { id: 'lv-drawings',        label: 'Electrical Drawings',       icon: BookOpen,        implemented: true },
    { id: 'lv-power-dist',      label: 'Power Distribution',        icon: Activity,        implemented: true },
    { id: 'lv-documents',       label: 'Document Management',       icon: Database,        implemented: true },
    { id: 'lv-inspection',      label: 'Inspection & Verification', icon: ClipboardList,   implemented: true },
    { id: 'lv-reports',         label: 'Reports & Export',          icon: Download,        implemented: true },
    { id: 'lv-import',          label: 'Import Excel Data',         icon: Upload,          implemented: true },
    { id: 'lv-settings',        label: 'Settings',                  icon: Settings,        implemented: true },
  ],
};

export function Sidebar() {
  const { activeModule, setActiveModule, sidebarOpen, settings, toggleTheme } = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['_cables']));

  const toggle = (id: string) => setExpanded((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const isCatActive = (catId: string) =>
    (CATEGORY_SUBITEMS[catId] ?? []).some((s) => s.id === activeModule);

  const handleClick = (id: string) => {
    if (id.startsWith('_')) { toggle(id); }
    else { setActiveModule(id); }
  };

  if (!sidebarOpen) return null;

  const NavItem = ({
    id, label, icon: Icon, implemented = true, badge,
    depth = 0,
  }: NavItem & { depth?: number }) => {
    const isActive   = id === activeModule;
    const isCActive  = isCatActive(id);
    const isExp      = expanded.has(id);
    const hasSubs    = !!CATEGORY_SUBITEMS[id];
    const isDisabled = !implemented;
    const isSub      = depth > 0;

    return (
      <>
        <button
          onClick={() => !isDisabled && handleClick(id)}
          disabled={isDisabled}
          className={[
            isSub ? 'ec-nav-item ec-nav-sub' : 'ec-nav-item',
            isActive ? 'active' : '',
            isCActive && !isSub ? 'cat-active' : '',
            isDisabled ? 'disabled' : '',
          ].filter(Boolean).join(' ')}
        >
          <Icon className="ec-nav-icon" style={{ width: isSub ? 15 : 20, height: isSub ? 15 : 20 }} />
          <span className="flex-1 text-left truncate">{label}</span>
          {hasSubs && !isDisabled && (
            isExp
              ? <ChevronDown style={{ width: 14, height: 14, opacity: 0.5, flexShrink: 0 }} />
              : <ChevronRight style={{ width: 14, height: 14, opacity: 0.5, flexShrink: 0 }} />
          )}
        </button>
        {hasSubs && isExp && (
          <div className="mb-1">
            {CATEGORY_SUBITEMS[id].map((sub) => (
              <NavItem key={sub.id} {...sub} depth={1} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <aside className="ec-sidebar">
      {/* Logo */}
      <div className="ec-sidebar-logo">
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(37,99,235,.40)',
        }}>
          <Zap style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>ElecCalc Pro</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 1 }}>Engineering Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="ec-sidebar-nav">
        {/* MAIN */}
        <div className="ec-nav-section">Main</div>
        <NavItem id="dashboard" label="Dashboard"       icon={LayoutDashboard} />
        <NavItem id="history"   label="Calc History"    icon={History} />

        {/* CALCULATION MODULES */}
        <div className="ec-nav-section">Calculation Modules</div>
        <NavItem id="_cables"        label="Cable & Wiring"       icon={Cable} />
        <NavItem id="_motors"        label="Motor & Drives"        icon={Cpu} />
        <NavItem id="_power"         label="Power System"          icon={Bolt} />
        <NavItem id="_protection"    label="Protection"            icon={Shield} />
        <NavItem id="pump-motor"     label="Pump & Motor Design"    icon={Cpu} />
        <NavItem id="_transformer"   label="Transformer"           icon={Activity} />
        <NavItem id="load-schedule"  label="Load Schedule"         icon={FileText} />
        <NavItem id="earthing"       label="Earthing"              icon={CloudLightning} />
        <NavItem id="lighting"       label="Lighting"              icon={Lightbulb} />
        <NavItem id="inst-control"   label="Instrument & Control"   icon={Gauge} implemented={true} />
        <NavItem id="renewables"     label="Renewables"             icon={Sun}   implemented={true} />
        <NavItem id="others-calc"       label="Others"                  icon={Grid3x3} implemented={true} />
        <NavItem id="electrical-calc"   label="Electrical Calculators"  icon={Calculator} />

        {/* DG MAINTENANCE SUITE */}
        <div className="ec-nav-section">DG Maintenance Suite</div>
        <NavItem id="_dg" label="DG Performance Suite" icon={Activity} />

        {/* 11kV HV MAINTENANCE */}
        <div className="ec-nav-section">11kV HV Maintenance</div>
        <NavItem id="_hv" label="11kV HV Suite" icon={Server} />

        {/* I&C ENGINEERING SUITE */}
        <div className="ec-nav-section">Instrumentation & Control</div>
        <NavItem id="_ic" label="I&C Engineering Suite" icon={Gauge} />

        {/* PROJECT LV PANEL */}
        <div className="ec-nav-section">Project LV Panel</div>
        <NavItem id="_lv" label="Project LV Panel" icon={Server} />

        {/* TOOLS & RESOURCES */}
        <div className="ec-nav-section">Tools & Resources</div>
        <NavItem id="standards"        label="Standards Library"  icon={BookOpen} />
        <NavItem id="learning-center"  label="Electrical Learning" icon={BookOpen} />
        <NavItem id="formula-library"  label="Formula Library"    icon={Database} />
        <NavItem id="unit-converter"   label="Unit Converter"     icon={Calculator} />
        <NavItem id="settings"         label="Settings"           icon={Settings} />
        <NavItem id="ai-assistant"     label="AI Assistant"       icon={Cpu} />
      </div>

      {/* Footer — dark mode */}
      <div className="ec-sidebar-footer">
        <button
          onClick={toggleTheme}
          className="ec-nav-item"
          style={{ height: 40, fontSize: 13 }}
        >
          {settings.theme === 'dark'
            ? <Sun style={{ width: 16, height: 16, color: '#F59E0B' }} />
            : <Moon style={{ width: 16, height: 16 }} />}
          <span className="flex-1 text-left">
            {settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
          <ChevronDown style={{ width: 13, height: 13, opacity: 0.4 }} />
        </button>
        <div style={{ fontSize: 10, color: '#64748B', marginTop: 6, paddingLeft: 4 }}>
          IEC · IEEE · NEC · BS · IS &nbsp;·&nbsp; v2.0.0
        </div>
      </div>
    </aside>
  );
}
