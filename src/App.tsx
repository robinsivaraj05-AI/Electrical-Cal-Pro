import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/Dashboard';
import { CalcHistory } from './components/CalcHistory';
import { SettingsPage } from './components/SettingsPage';
import { StandardsLibrary } from './components/StandardsLibrary';
import { UnitConverter } from './components/UnitConverter';
import { AIAssistant } from './components/AIAssistant';
import { CableCurrentCalc } from './components/modules/CableCurrentCalc';
import { CableSizing } from './components/modules/CableSizing';
import { VoltageDrop } from './components/modules/VoltageDrop';
import { ShortCircuit } from './components/modules/ShortCircuit';
import { MotorCalc } from './components/modules/MotorCalc';
import { OLRSelection } from './components/modules/OLRSelection';
import { MCCBSelection } from './components/modules/MCCBSelection';
import { TransformerCalc } from './components/modules/TransformerCalc';
import { CTCalc } from './components/modules/CTCalc';
import { BusbarCalc } from './components/modules/BusbarCalc';
import { UPSCalc } from './components/modules/UPSCalc';
import { CapacitorCalc } from './components/modules/CapacitorCalc';
import { EarthingCalc } from './components/modules/EarthingCalc';
import { LightingCalc } from './components/modules/LightingCalc';
import { LoadSchedule } from './components/modules/LoadSchedule';
import { CableGlandCalc } from './components/modules/CableGlandCalc';
import { PumpMotorCalc } from './components/modules/PumpMotorCalc';
import { DGCalc } from './components/modules/DGCalc';
import { HarmonicCalc } from './components/modules/HarmonicCalc';
import { ConduitTrayCalc } from './components/modules/ConduitTrayCalc';
import { LearningCenter } from './components/learning/LearningCenter';
import { FormulaLibrary } from './components/FormulaLibrary';
import { InstControlCalc } from './components/modules/InstControlCalc';
import { RenewablesCalc } from './components/modules/RenewablesCalc';
import { OthersCalc } from './components/modules/OthersCalc';
import { ElectricalCalc } from './components/modules/ElectricalCalc';
import { CableBOMPro }   from './components/modules/CableBOMPro';
import { MCBSelection } from './components/modules/MCBSelection';
import { RelayCoordination } from './components/modules/RelayCoordination';
import { ArcFlashCalc } from './components/modules/ArcFlashCalc';
import { SolarPVCalc } from './components/modules/SolarPVCalc';
import { DGDashboard }   from './components/modules/DGDashboard';
import { DGPerfCalc }    from './components/modules/DGPerfCalc';
import { DGInspection }  from './components/modules/DGInspection';
import { DGTesting }     from './components/modules/DGTesting';
import { DGProtection }  from './components/modules/DGProtection';
import { DGStandards }   from './components/modules/DGStandards';
import { DGPredictive }  from './components/modules/DGPredictive';
import { HVDashboard }   from './components/modules/HVDashboard';
import { HVInspection } from './components/modules/HVInspection';
import { HVTesting } from './components/modules/HVTesting';
import { HVProtection } from './components/modules/HVProtection';
import { HVCalcsPage } from './components/modules/HVCalcsPage';
import { HVMaintSched } from './components/modules/HVMaintSched';
import { HVFaultDiag } from './components/modules/HVFaultDiag';
import { HVCommissioning } from './components/modules/HVCommissioning';
import { ICDashboard }   from './components/modules/ICDashboard';
import { ICCalcsPage }   from './components/modules/ICCalcsPage';
import { ICGlassCalc }   from './components/modules/ICGlassCalc';
import { ICCalibration } from './components/modules/ICCalibration';
import { ICVerification }from './components/modules/ICVerification';
import { ICChecklists }  from './components/modules/ICChecklists';
import { ICStudy }       from './components/modules/ICStudy';
import { ICReports }     from './components/modules/ICReports';
import { TransformerDistribution } from './components/modules/TransformerDistribution';
import { TransformerVerify }       from './components/modules/TransformerVerify';
import { LVPanelModule }           from './components/modules/LVPanelModule';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import AuthModal from './components/auth/AuthModal';

function ComingSoon({ module }: { module: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px] rounded-xl border border-dashed border-slate-700">
      <div className="text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚡</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{module}</h3>
        <p className="text-slate-400 text-sm mb-4">This module is coming in a future update.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
          🔨 In Development
        </div>
      </div>
    </div>
  );
}

const MODULE_COMPONENTS: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  history: <CalcHistory />,
  settings: <SettingsPage />,
  standards: <StandardsLibrary />,
  'unit-converter': <UnitConverter />,
  'ai-assistant': <AIAssistant />,
  'cable-current': <CableCurrentCalc />,
  'cable-sizing': <CableSizing />,
  'voltage-drop': <VoltageDrop />,
  'short-circuit': <ShortCircuit />,
  motor: <MotorCalc />,
  olr: <OLRSelection />,
  mccb: <MCCBSelection />,
  mcb: <MCBSelection />,
  transformer: <TransformerCalc />,
  ct: <CTCalc />,
  pt: <ComingSoon module="PT / VT Calculator" />,
  busbar: <BusbarCalc />,
  'load-schedule': <LoadSchedule />,
  ups: <UPSCalc />,
  capacitor: <CapacitorCalc />,
  earthing: <EarthingCalc />,
  lighting: <LightingCalc />,
  dg: <DGCalc />,
  harmonic: <HarmonicCalc />,
  lightning: <ComingSoon module="Lightning Protection" />,
  battery: <ComingSoon module="Battery Calculator" />,
  'ht-switchgear': <ComingSoon module="HT Switchgear" />,
  relay: <RelayCoordination />,
  'arc-flash': <ArcFlashCalc />,
  instrumentation: <ComingSoon module="Instrumentation Module" />,
  'cable-gland':  <CableGlandCalc />,
  'pump-motor':   <PumpMotorCalc />,
  'conduit-tray': <ConduitTrayCalc />,
  hvac: <ComingSoon module="HVAC Electrical Design" />,
  'solar-pv': <SolarPVCalc />,
  wind: <ComingSoon module="Wind Power" />,
  'ev-charger': <ComingSoon module="EV Charger Design" />,
  'learning-center':   <LearningCenter />,
  'formula-library':   <FormulaLibrary />,
  'inst-control':      <InstControlCalc />,
  'renewables':        <RenewablesCalc />,
  'others-calc':       <OthersCalc />,
  'electrical-calc':   <ElectricalCalc />,
  'cable-bom':         <CableBOMPro />,
  'dg-dashboard':      <DGDashboard />,
  'dg-performance':    <DGPerfCalc />,
  'dg-inspection':     <DGInspection />,
  'dg-testing':        <DGTesting />,
  'dg-protection':     <DGProtection />,
  'dg-standards':      <DGStandards />,
  'dg-predictive':     <DGPredictive />,
  'hv-dashboard':      <HVDashboard />,
  'hv-inspection':     <HVInspection />,
  'hv-testing':        <HVTesting />,
  'hv-protection':     <HVProtection />,
  'hv-calcs':          <HVCalcsPage />,
  'hv-maintenance':    <HVMaintSched />,
  'hv-fault-diag':     <HVFaultDiag />,
  'hv-commissioning':  <HVCommissioning />,
  'ic-dashboard':      <ICDashboard />,
  'ic-calculators':    <ICCalcsPage />,
  'ic-glass':          <ICGlassCalc />,
  'ic-calibration':    <ICCalibration />,
  'ic-verification':   <ICVerification />,
  'ic-checklists':     <ICChecklists />,
  'ic-study':          <ICStudy />,
  'ic-reports':        <ICReports />,
  'transformer-dist':   <TransformerDistribution />,
  'transformer-verify': <TransformerVerify />,
  'lv-dashboard':       <LVPanelModule section="dashboard" />,
  'lv-panel-register':  <LVPanelModule section="panel-register" />,
  'lv-load-schedule':   <LVPanelModule section="load-schedule" />,
  'lv-mdb-details':     <LVPanelModule section="mdb-details" />,
  'lv-feeder-cable':    <LVPanelModule section="feeder-cable" />,
  'lv-metering-ct':     <LVPanelModule section="metering-ct" />,
  'lv-load-summary':    <LVPanelModule section="load-summary" />,
  'lv-drawings':        <LVPanelModule section="drawings" />,
  'lv-power-dist':      <LVPanelModule section="power-dist" />,
  'lv-documents':       <LVPanelModule section="documents" />,
  'lv-inspection':      <LVPanelModule section="inspection" />,
  'lv-reports':         <LVPanelModule section="reports" />,
  'lv-import':          <LVPanelModule section="import-excel" />,
  'lv-settings':        <LVPanelModule section="lv-settings" />,
};

export default function App() {
  const { activeModule, syncFromCloud } = useStore();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) syncFromCloud();
  }, [isAuthenticated]);

  if (isLoading && !isAuthenticated) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#475569', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="flex overflow-hidden" style={{ width: '100%', height: '100%', background: 'var(--ec-bg-root)', color: 'var(--ec-text-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--ec-bg-root)' }}>
          <div style={{ padding: '28px 32px', minHeight: '100%' }}>
            {MODULE_COMPONENTS[activeModule] ?? <ComingSoon module={activeModule} />}
          </div>
        </main>
      </div>
    </div>
  );
}
