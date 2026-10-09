import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, ChevronDown, CheckCircle2, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#EA580C';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface FaultCase {
  symptom: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  causes: string[]; checks: string[]; remedies: string[]; standards: string;
}

const FAULTS: FaultCase[] = [
  {
    symptom: 'Breaker Not Closing',
    severity: 'HIGH',
    causes: [
      'Trip circuit supervision (74TC) healthy but close coil open-circuit',
      'Spring not charged — motor circuit fault or manual spring drive not operated',
      'Interlock preventing close (e.g., earthing switch closed, CB in test position)',
      'Anti-pumping relay (47) preventing closure',
      'Control fuse blown on close circuit',
      'Binary output from protection relay in TRIP or BLOCK',
      'Local/remote selector in wrong position',
      'Low auxiliary supply voltage',
    ],
    checks: [
      'Check close coil resistance (should be 20–100 Ω depending on type)',
      'Check spring charged indicator — manually charge spring if not charged',
      'Verify all interlocks are released (earthing switch OPEN, CB in service position)',
      'Check control fuse (F1/F2 on close circuit) — replace if blown',
      'Measure DC auxiliary voltage at close coil terminals',
      'Check protection relay — no active BLOCK or TRIP output',
      'Trace close circuit schematic — identify open-circuit point',
      'Check anti-pumping relay contacts with multimeter',
    ],
    remedies: [
      'Replace blown fuse with correct rating',
      'Repair or replace close coil if resistance is very high or open-circuit',
      'Restore spring charging motor circuit',
      'Release interlocks as appropriate after confirming safety',
      'Reset protection relay after investigating cause of trip',
    ],
    standards: 'IEC 62271-100 · IEC 60255',
  },
  {
    symptom: 'Breaker Trips Immediately After Closing',
    severity: 'CRITICAL',
    causes: [
      'Persistent fault on feeder — CB closing onto fault',
      'Protection relay not reset after previous trip — trip output still latched',
      'Relay setting too sensitive — pickup below energisation current',
      'Anti-pumping relay or trip coil fault',
      'Reverse power (32) or undervoltage (27) relay operating on energisation',
      'Faulty CB — contact bounce causing zero-crossing re-arcing in VCB',
      'Differential relay (87) operating due to CT mismatch or inrush',
    ],
    checks: [
      'Check protection relay event record — which function caused trip?',
      'Verify there is no fault on feeder (IR test if accessible)',
      'Check if trip is on same phase consistently — indicates phase fault',
      'Check relay settings — is pickup above energisation current?',
      'Check anti-pumping relay — is it releasing cleanly?',
      'Review 87T inrush restraint setting — 2nd harmonic blocking enabled?',
    ],
    remedies: [
      'Clear downstream fault before re-energising',
      'Increase relay pickup or add deliberate time delay for energisation',
      'Check and replace faulty CB if contact bounce is causing re-arc',
      'Adjust differential relay inrush restraint (increase 2nd harmonic threshold)',
    ],
    standards: 'IEC 62271-100 · IEC 60255-151',
  },
  {
    symptom: 'Low Insulation Resistance (< 100 MΩ)',
    severity: 'HIGH',
    causes: [
      'Moisture ingress through failed cable glands, door seals or cracks',
      'Contamination — dust, oil or salt deposits tracking across insulator surfaces',
      'Insulation ageing — material degradation in HV cables, transformers',
      'Partial discharge activity etching conductor insulation',
      'Overheating damage — thermal degradation of insulation',
      'Mechanical damage — cut or abraded insulation',
    ],
    checks: [
      'Measure IR at 5 kV or 10 kV DC — record all three phases to earth',
      'Calculate PI (IR10min/IR1min) — < 1.25 indicates moisture/contamination',
      'Inspect for visible moisture, condensation, dust, or tracking marks',
      'Check cable gland seals and IP rating maintenance',
      'Thermal image to identify hot spots indicating degraded insulation',
      'Check space heater — ensure operational (prevents moisture)',
    ],
    remedies: [
      'Dry out equipment using space heaters, external hot air blowers or oven drying (disconnect first)',
      'Clean insulators using approved insulation cleaning agent and lint-free cloth',
      'Repair or replace cable gland seals',
      'If IR remains low after drying → suspect aged or damaged insulation → replace cable/bushing',
      'Schedule partial discharge test to locate defect',
    ],
    standards: 'IEEE 43 · IEC 60243',
  },
  {
    symptom: 'High Contact Resistance (> 60 μΩ for VCB main contacts)',
    severity: 'MEDIUM',
    causes: [
      'Contact pitting or erosion from repeated arcing',
      'Oxide layer formation from long inactivity',
      'Contamination on contact surfaces',
      'Inadequate contact pressure — spring mechanism worn',
      'CB operated beyond rated operations count',
    ],
    checks: [
      'Measure contact resistance with Ductor tester (100A DC)',
      'Compare with previous measurements and manufacturer limit',
      'Inspect contact surfaces visually for pitting, scoring',
      'Check CB operation counter vs rated operations (typically 10,000–30,000 for VCB)',
      'Measure contact travel / stroke (compare with manufacturer spec)',
    ],
    remedies: [
      'Clean contacts with approved contact cleaner (no abrasives)',
      'Apply approved contact grease where specified by manufacturer',
      'If resistance remains high after cleaning — replace vacuum bottles (VCB) or fixed contacts (ACB)',
      'Check and adjust contact pressure (mechanism spring)',
      'Retire CB if operations count exceeds rated limit',
    ],
    standards: 'IEC 62271-100 · IEEE C37.09',
  },
  {
    symptom: 'SF6 Gas Pressure Alarm / Low Pressure',
    severity: 'CRITICAL',
    causes: [
      'Gas leakage through faulty gaskets, sealing rings or joints',
      'Leakage through pressure gauge connections',
      'SF6 gas absorbed by moisture (forms SF6 decomposition products reducing purity)',
      'Temperature drop (cold weather) causing apparent pressure reduction',
    ],
    checks: [
      'Correct measured pressure to 20°C using Gay-Lussac law',
      'Locate leak with SF6 leak detector (electronic sniffer — detect at < 1 ppm)',
      'Check moisture content (dew-point meter) — high moisture reduces effective pressure',
      'Check all gasket and seal areas, especially pressure gauge connection',
    ],
    remedies: [
      'ISOLATE CB — DO NOT OPERATE if at lockout pressure level',
      'Repair leak using manufacturer-approved sealing kit (replace gaskets)',
      'Reclaim SF6 using certified gas cart (IEC 62271-4 / EN 14912)',
      'Refill to rated pressure with certified SF6 (IEC 60376 grade)',
      'Verify no SF6 decomposition products present (HF, SO2) with analyser before refilling',
      'Log leak rate for regulatory reporting (SF6 is a greenhouse gas — EU F-Gas regulation)',
    ],
    standards: 'IEC 62271-100 · IEC 62271-4 · EU F-Gas Regulation',
  },
  {
    symptom: 'Protection Relay Maloperation (Nuisance Trip)',
    severity: 'HIGH',
    causes: [
      'Relay pickup set too low — trips on normal load variations or motor starting',
      'Incorrect IDMT curve or TMS — trips before downstream device',
      'CT saturation under fault current — delayed trip gives false timing',
      'Interharmonics or DC offset causing relay misoperation',
      'Faulty CT or PT — spurious secondary signals',
      'Loss of PT supply causing 27 or 64 relay operation (voltage-dependent functions)',
      'Relay firmware issue or memory corruption',
    ],
    checks: [
      'Review relay event records and disturbance recorder (if fitted)',
      'Check relay settings vs commissioning settings schedule — any unauthorised changes?',
      'Verify CT burden and check for CT saturation on oscillography',
      'Check PT fuses — all three phases intact',
      'Secondary injection test — verify relay operating at correct pickup/timing',
      'Check relay binary inputs — any spurious input causing unwanted operation?',
    ],
    remedies: [
      'Adjust relay settings (pickup and TMS) to provide correct discrimination',
      'Replace or recalibrate CT if saturation is proven',
      'Replace PT fuses',
      'Update relay firmware if known defect',
      'Add filter or additional time delay if harmonic interference is cause',
      'Re-commission and test all affected protection functions',
    ],
    standards: 'IEC 60255 · IEEE C37.112 · IEEE 242',
  },
  {
    symptom: 'Busbar Overheating (Thermography Hot Spot)',
    severity: 'HIGH',
    causes: [
      'Loose bolted joint — reduced contact area increases resistance',
      'Oxide layer on aluminium/copper busbar joint',
      'Incorrect torque — over or under-torqued joint',
      'Undersized busbar for actual load current',
      'Blocked ventilation causing poor heat dissipation',
      'Uneven load distribution on parallel busbars',
    ],
    checks: [
      'Thermal imaging — classify hot spot: ΔT < 5°C normal, 5–15°C warning, 15–40°C serious, > 40°C critical',
      'Contact resistance measurement (Ductor) on suspected joint',
      'Verify actual load current vs busbar ampacity',
      'Visual inspection for corrosion, discolouration, loose hardware',
      'Check torque on all bolted connections vs specification',
    ],
    remedies: [
      'De-energise and retorque suspect joint to specification (typically 30–60 Nm for 50mm² Al busbar)',
      'Clean contact surface with brass wire brush + Penetrox A or approved joint compound',
      'Replace discoloured or pitted contact surfaces',
      'If ΔT > 40°C — treat as EMERGENCY — reduce load or isolate immediately',
      'Increase busbar CSA if sustained overload is confirmed',
    ],
    standards: 'IEC 62271-200 · NFPA 70B · IEEE C37.20',
  },
  {
    symptom: 'Earth Fault Alarm (51N/64 Operation)',
    severity: 'CRITICAL',
    causes: [
      'Insulation failure to earth on cable or switchgear',
      'Moisture ingress causing partial discharge leading to earth fault',
      'Animal entry or foreign object bridging phase to earth',
      'Accidental contact of cable during installation or maintenance',
      'Overvoltage event damaging cable insulation',
    ],
    checks: [
      'Identify affected feeder from relay event record',
      'Isolate feeder and perform IR test — locate low-IR section',
      'Partial discharge test to precisely locate insulation defect',
      'Visual inspection of cable route and terminations',
      'Check for animal entry, rodent damage at cable entries',
    ],
    remedies: [
      'Replace damaged cable section or re-terminate damaged joint',
      'Repair or replace terminations in affected equipment',
      'Improve cable route protection against physical damage',
      'Improve vermin exclusion measures at cable entries',
      'Monitor with online PD detection system if repair is deferred',
    ],
    standards: 'IEC 60255 · IEC 60364-4-43 · IEEE 400',
  },
  {
    symptom: 'CT Failure (Open Secondary / Incorrect Ratio)',
    severity: 'CRITICAL',
    causes: [
      'CT secondary open-circuit — very high induced voltage, possible arcing',
      'Shorted turns — reduced ratio accuracy',
      'Insulation breakdown in CT body',
      'Incorrect connection — CT wired in reverse polarity',
    ],
    checks: [
      'NEVER open-circuit CT secondary with primary energised — extremely dangerous',
      'Measure CT secondary voltage — unusually high indicates open circuit',
      'Ratio test — compare against nameplate ratio',
      'Excitation curve test — check knee-point voltage',
      'Insulation resistance test of CT',
      'Check CT accuracy class vs application requirements',
    ],
    remedies: [
      'SHORT CIRCUIT CT secondary before any work on CT circuit',
      'Replace CT if shorted turns proven (ratio error > class limit)',
      'Re-terminate if incorrect polarity (reverse leads, re-test)',
      'Replace CT if insulation breakdown',
    ],
    standards: 'IEC 61869-2 · IEEE C57.13',
  },
  {
    symptom: 'Undervoltage Alarm (27 Operation)',
    severity: 'HIGH',
    causes: [
      'Supply voltage genuinely reduced — network undervoltage event',
      'Blown PT fuse causing spurious 27 operation (no actual undervoltage)',
      'Connection loose on PT secondary',
      'Network voltage regulation issue — high load, low generation',
    ],
    checks: [
      'Check actual supply voltage with independent voltmeter',
      'Check all three PT fuses — one blown = single-phase undervoltage',
      'Check network grid voltage — co-ordinate with utility',
      'Check transformer tap position — on correct tap for load conditions',
    ],
    remedies: [
      'If PT fuse blown — replace fuse, re-test protection',
      'If actual network undervoltage — contact utility, apply emergency load shedding',
      'Adjust transformer tap if required (within permitted range)',
    ],
    standards: 'IEC 60255-127 · IEEE C37.102',
  },
  {
    symptom: 'Differential Relay (87T) Spurious Operation',
    severity: 'HIGH',
    causes: [
      'Transformer inrush current — 2nd harmonic blocking inadequate',
      'CT saturation on through-fault — spill current into operate coil',
      'CT mismatch — ratio or vector group compensation incorrect',
      'CT wiring error — polarity reversal or incorrect connection',
      'Overexcitation (V/Hz) — produces 5th harmonic (not blocked by 2nd harmonic inhibit)',
    ],
    checks: [
      'Review relay disturbance record — is 2nd harmonic present? (inrush)',
      'Check CT ratio and vector group compensation settings in relay',
      'Verify CT wiring polarity matches relay model',
      'Through-fault stability test — balance currents from both ends',
      'Check ratio match — HV and LV CTs must give equal secondary currents at rated load',
    ],
    remedies: [
      'Increase 2nd harmonic inrush blocking threshold (typically 15–20%)',
      'Correct CT ratio compensation factor in relay settings',
      'Re-wire CT polarity if found reversed',
      'Increase bias slope setting to improve through-fault stability',
    ],
    standards: 'IEC 60255-187-2 · IEEE C37.91',
  },
  {
    symptom: 'Partial Discharge Detected',
    severity: 'HIGH',
    causes: [
      'Voids in cable insulation — internal PD',
      'Surface tracking on contaminated insulators — external PD',
      'Delamination or moisture in cable joints or terminations',
      'Metallic sharp edges in GIS — protrusion discharge',
      'Aged XLPE cable with water trees — tree-initiated PD',
    ],
    checks: [
      'Measure PD level (pC) using IEC 60270 or UHF/acoustic methods',
      'PRPD (Phase Resolved PD) pattern analysis — identifies defect type',
      'Locate PD source using time domain reflectometry or acoustic mapping',
      'Trend analysis — increasing PD magnitude over time indicates progressive degradation',
    ],
    remedies: [
      'If PD > 1000 pC on cable — schedule cable replacement within 12 months',
      'Clean insulators and apply corona grease to reduce surface PD',
      'Replace damaged cable joint or termination',
      'If GIS — locate and remove protrusion (requires specialist)',
      'Install online PD monitoring until cable replacement',
    ],
    standards: 'IEC 60270 · IEC 62478 · IEEE 400.3',
  },
];

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: '#DC2626', bg: '#DC262618', border: '#DC262640' },
  HIGH:     { color: '#EA580C', bg: '#EA580C18', border: '#EA580C40' },
  MEDIUM:   { color: '#D97706', bg: '#D9770618', border: '#D9770640' },
};

export function HVFaultDiag() {
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAULTS.filter((f) =>
    !search || f.symptom.toLowerCase().includes(search.toLowerCase()) ||
    f.causes.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  const sel = selected !== null ? filtered[selected] : null;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={AlertTriangle} title="FAULT DIAGNOSIS MODULE" subtitle="Symptom-Based Troubleshooting · 12 Common HV Switchgear Faults · IEC 62271 · IEEE C37" accentColor={ACCENT} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => {
          const body = FAULTS.map(f => `<h2>${f.symptom} — <span style="color:${SEVERITY_STYLE[f.severity].color}">${f.severity}</span></h2>
            ${tableHTML(['Category','Details'],[
              ['Standards',f.standards],
              ['Possible Causes',f.causes.join('<br/>')],
              ['Investigation Checks',f.checks.join('<br/>')],
              ['Corrective Actions',f.remedies.join('<br/>')],
            ])}`).join('');
          downloadReport('11kV HV Fault Diagnosis Guide','Symptom-Based Troubleshooting · 12 Fault Scenarios','IEC 62271-100 · IEC 62271-200 · IEEE C37.09 · NFPA 70B', body, 'HV-Fault-Diagnosis.pdf');
        }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Download Fault Guide PDF
        </button>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
        placeholder="Search by symptom or cause keyword…"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 20, padding: '11px 16px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10, fontSize: 14, color: V.txt, outline: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: sel ? '320px 1fr' : '1fr', gap: 16 }}>
        {/* Symptom List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((f, i) => {
            const ss = SEVERITY_STYLE[f.severity];
            return (
              <button key={i} onClick={() => setSelected(selected === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', textAlign: 'left',
                  background: selected === i ? ss.bg : V.bg,
                  border: `1.5px solid ${selected === i ? ss.color : V.brd}`,
                  borderRadius: 10, cursor: 'pointer',
                }}>
                <AlertTriangle style={{ width: 16, height: 16, color: ss.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: V.txt, lineHeight: 1.3 }}>{f.symptom}</div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: ss.color, letterSpacing: '0.06em' }}>{f.severity}</span>
                </div>
                {selected === i ? <ChevronDown style={{ width: 13, height: 13, color: V.muted }} /> : <ChevronRight style={{ width: 13, height: 13, color: V.muted }} />}
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        {sel && (
          <div style={{ background: V.bg, border: `2px solid ${SEVERITY_STYLE[sel.severity].border}`, borderRadius: 14, overflow: 'hidden', borderLeft: `5px solid ${SEVERITY_STYLE[sel.severity].color}` }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: SEVERITY_STYLE[sel.severity].bg, borderBottom: `1px solid ${V.brdM}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <AlertTriangle style={{ width: 18, height: 18, color: SEVERITY_STYLE[sel.severity].color }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: V.txt }}>{sel.symptom}</span>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: SEVERITY_STYLE[sel.severity].color, color: '#fff' }}>{sel.severity}</span>
              </div>
              <div style={{ fontSize: 11, color: V.muted }}>Standards: {sel.standards}</div>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Possible Causes', items: sel.causes, color: '#DC2626', icon: '⚠' },
                { label: 'Investigation Checks', items: sel.checks, color: '#D97706', icon: '🔍' },
                { label: 'Corrective Actions / Remedies', items: sel.remedies, color: '#059669', icon: '✔' },
              ].map(({ label, items, color, icon }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{icon} {label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((item, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>
                        <span style={{ color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{j + 1}.</span>
                        <span style={{ fontSize: 13, color: V.sec, lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!sel && (
        <div style={{ marginTop: 20, padding: '20px', background: V.surf, borderRadius: 10, border: `1px solid ${V.brdM}`, textAlign: 'center', fontSize: 13, color: V.muted }}>
          Select a symptom above to view probable causes, investigation steps and corrective actions.
        </div>
      )}
    </div>
  );
}
