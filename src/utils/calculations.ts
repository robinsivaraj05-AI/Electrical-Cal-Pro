import type { CalculationResult, CalculationStep } from '../types';
import {
  getCableData,
  getTemperatureCorrection,
  getGroupingFactor,
} from '../data/cableData';

// ─── Cable Current ─────────────────────────────────────────────────────────────
export function calculateCableCurrent(inputs: {
  power: number;
  powerUnit: 'kW' | 'kVA' | 'HP';
  voltage: number;
  phases: 1 | 3 | 'DC';
  powerFactor: number;
  efficiency: number;
}): CalculationResult {
  const { power, powerUnit, voltage, phases, powerFactor, efficiency } = inputs;

  // ── Derive apparent power S [kVA] and display active power P [kW] ──────────
  //
  // kVA: supply apparent power is known directly.  η does NOT apply — kVA already
  //      describes what the cable must carry at the supply terminal.
  //
  // kW:  active (shaft) power.  η converts shaft → electrical active;
  //      PF converts active → apparent.  Both factors are single-pass.
  //
  // HP:  shaft power → kW_shaft → same path as kW.
  //
  // DC:  no reactive power (PF = 1).  η applies to shaft-power inputs only.

  let S_kVA: number;   // apparent power the cable carries [kVA]
  let P_kW: number;    // active power at supply terminals [kW]  (display)
  let convStep: CalculationStep;

  if (powerUnit === 'kVA') {
    S_kVA = power;
    P_kW  = power * powerFactor;
    convStep = {
      step: 1,
      description: 'kVA input — apparent power is known directly (no PF or η correction)',
      formula: `S = ${power} kVA  →  P = S × cosφ = ${power} × ${powerFactor}`,
      result: `S = ${S_kVA.toFixed(2)} kVA,  P = ${P_kW.toFixed(2)} kW`,
    };
  } else {
    const kW_shaft = powerUnit === 'HP' ? power * 0.7457 : power;
    const kW_elec  = kW_shaft / efficiency;   // electrical active power input
    P_kW  = kW_elec;
    S_kVA = phases === 'DC' ? kW_elec : kW_elec / powerFactor;
    convStep = powerUnit === 'HP'
      ? {
          step: 1,
          description: 'HP → shaft kW → electrical input → apparent power',
          formula: `P_shaft = ${power} HP × 0.7457 = ${kW_shaft.toFixed(2)} kW;  P_elec = P_shaft / η = ${kW_shaft.toFixed(2)} / ${efficiency} = ${kW_elec.toFixed(2)} kW;  S = P_elec / cosφ = ${kW_elec.toFixed(2)} / ${powerFactor}`,
          result: `S = ${S_kVA.toFixed(2)} kVA`,
        }
      : {
          step: 1,
          description: 'kW shaft power → electrical input → apparent power',
          formula: `P_elec = P / η = ${power} / ${efficiency} = ${kW_elec.toFixed(2)} kW;  S = P_elec / cosφ = ${kW_elec.toFixed(2)} / ${powerFactor}`,
          result: `S = ${S_kVA.toFixed(2)} kVA`,
        };
  }

  const Q_kVAR = Math.sqrt(Math.max(0, S_kVA ** 2 - P_kW ** 2));

  // ── Current — always derived from apparent power ─────────────────────────
  let current: number;
  let formula: string;
  const phaseFactor = phases === 3 ? '√3' : '1';

  if (phases === 3) {
    current = (S_kVA * 1000) / (Math.sqrt(3) * voltage);
    formula = powerUnit === 'kVA' ? 'I = S / (√3 × V)' : 'I = P / (√3 × V × cosφ × η)';
  } else if (phases === 1) {
    current = (S_kVA * 1000) / voltage;
    formula = powerUnit === 'kVA' ? 'I = S / V' : 'I = P / (V × cosφ × η)';
  } else {
    // DC: S_kVA = kW_elec (PF = 1 implicitly)
    current = (S_kVA * 1000) / voltage;
    formula = 'I = P_dc / V';
  }

  const steps: CalculationStep[] = [
    convStep,
    {
      step: 2,
      description: 'Reactive power',
      formula: `Q = √(S² − P²) = √(${S_kVA.toFixed(2)}² − ${P_kW.toFixed(2)}²)`,
      result: `${Q_kVAR.toFixed(2)} kVAR`,
    },
    {
      step: 3,
      description: 'Full load current',
      formula: phases === 'DC'
        ? `I = P_dc / V = ${S_kVA.toFixed(2)}k / ${voltage}`
        : `I = S / (${phaseFactor} × V) = ${S_kVA.toFixed(2)}k / (${phases === 3 ? '√3 × ' : ''}${voltage})`,
      result: `${current.toFixed(2)} A`,
    },
  ];

  return {
    values: [
      { label: 'Active Power',          value: P_kW.toFixed(2),                unit: 'kW'   },
      { label: 'Apparent Power',        value: S_kVA.toFixed(2),               unit: 'kVA'  },
      { label: 'Reactive Power',        value: Q_kVAR.toFixed(2),              unit: 'kVAR' },
      { label: 'Full Load Current',     value: current.toFixed(2),             unit: 'A',    highlight: true },
      { label: 'Design Current (125%)', value: (current * 1.25).toFixed(2),    unit: 'A'    },
    ],
    status: 'INFO',
    recommendation: `Full load current is ${current.toFixed(1)} A. Use ${(current * 1.25).toFixed(0)} A as design current (125% for continuous load per IEC 60364-4-43).`,
    formula,
    steps,
    standardRef: {
      standard: 'IEC 60364-4-43',
      clause: '433.1',
      equation: formula,
      title: 'Protection against overload current — Selection of protective devices',
    },
  };
}

// ─── Voltage Drop ──────────────────────────────────────────────────────────────
export function calculateVoltageDrop(inputs: {
  current: number;
  length: number;
  conductor: 'Cu' | 'Al';
  insulation: 'PVC' | 'XLPE' | 'EPR';
  cableSize: number;
  phases: 1 | 3;
  powerFactor: number;
  voltage: number;
  loadType: 'motor' | 'general';
}): CalculationResult {
  const { current, length, conductor, insulation, cableSize, phases, powerFactor, voltage, loadType } = inputs;

  const cables = getCableData(conductor, insulation);
  const cable = cables.find((c) => c.size === cableSize) ?? cables[cables.length - 1];

  const R = cable.resistance; // Ω/km
  const X = cable.reactance;  // Ω/km
  const cosφ = powerFactor;
  const sinφ = Math.sqrt(1 - cosφ ** 2);

  let voltageDrop: number;
  let formula: string;
  let multiplier: number;

  if (phases === 3) {
    voltageDrop = (Math.sqrt(3) * current * length * (R * cosφ + X * sinφ)) / 1000;
    formula = 'ΔV = √3 × I × L × (R·cosφ + X·sinφ) / 1000';
    multiplier = Math.sqrt(3);
  } else {
    voltageDrop = (2 * current * length * (R * cosφ + X * sinφ)) / 1000;
    formula = 'ΔV = 2 × I × L × (R·cosφ + X·sinφ) / 1000';
    multiplier = 2;
  }

  const vdPercent = (voltageDrop / voltage) * 100;
  const maxVd = loadType === 'motor' ? 5 : 3;
  const status = vdPercent <= maxVd ? 'PASS' : 'FAIL';

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'Cable impedance parameters',
      formula: `R = ${R} Ω/km (at 90°C), X = ${X} Ω/km`,
      result: `From IEC 60364-5-52 Table B.52.2 for ${cableSize} mm² ${conductor} ${insulation}`,
    },
    {
      step: 2,
      description: 'Calculate sinφ',
      formula: `sinφ = √(1 - cos²φ) = √(1 - ${cosφ}²)`,
      result: sinφ.toFixed(4),
    },
    {
      step: 3,
      description: 'Calculate voltage drop',
      formula: `ΔV = ${multiplier.toFixed(4)} × ${current} × ${length} × (${R} × ${cosφ} + ${X} × ${sinφ.toFixed(4)}) / 1000`,
      result: `${voltageDrop.toFixed(2)} V`,
    },
    {
      step: 4,
      description: 'Voltage drop percentage',
      formula: `ΔV% = (${voltageDrop.toFixed(2)} / ${voltage}) × 100`,
      result: `${vdPercent.toFixed(2)}%`,
    },
    {
      step: 5,
      description: `Compare with maximum allowable (${maxVd}% per IEC 60364-5-52)`,
      formula: `${vdPercent.toFixed(2)}% ${vdPercent <= maxVd ? '≤' : '>'} ${maxVd}%`,
      result: status,
    },
  ];

  return {
    values: [
      { label: 'Voltage Drop', value: voltageDrop.toFixed(2), unit: 'V', highlight: true },
      { label: 'Voltage Drop %', value: vdPercent.toFixed(2), unit: '%', status, highlight: true },
      { label: 'Max Allowable', value: maxVd.toString(), unit: '%' },
      { label: 'Receiving End Voltage', value: (voltage - voltageDrop).toFixed(1), unit: 'V' },
      { label: 'Cable R (90°C)', value: R.toString(), unit: 'Ω/km' },
      { label: 'Cable X', value: X.toString(), unit: 'Ω/km' },
    ],
    status,
    recommendation: status === 'PASS'
      ? `Voltage drop of ${vdPercent.toFixed(2)}% is within the ${maxVd}% limit. Cable size ${cableSize} mm² ${conductor} ${insulation} is ACCEPTABLE.`
      : `Voltage drop of ${vdPercent.toFixed(2)}% EXCEEDS the ${maxVd}% limit. Increase cable size or reduce cable length.`,
    formula,
    steps,
    standardRef: {
      standard: 'IEC 60364-5-52',
      clause: 'Annex G',
      table: 'Table B.52.2',
      equation: formula,
      title: 'Voltage drop — Full impedance method',
    },
  };
}

// ─── Cable Sizing ──────────────────────────────────────────────────────────────
export function calculateCableSizing(inputs: {
  current: number;
  conductor: 'Cu' | 'Al';
  insulation: 'PVC' | 'XLPE' | 'EPR';
  installMethod: 'A' | 'T' | 'G' | 'D' | 'C';
  ambientTemp: number;
  numCables: number;
  groupMethod: 'clipped' | 'tray' | 'duct';
  futureFactor: number;
}): CalculationResult {
  const { current, conductor, insulation, installMethod, ambientTemp, numCables, groupMethod, futureFactor } = inputs;

  const tempFactor = getTemperatureCorrection(ambientTemp, insulation);
  const groupFactor = getGroupingFactor(numCables, groupMethod);
  const designCurrent = current * futureFactor;
  const requiredCapacity = designCurrent / (tempFactor * groupFactor);

  const cables = getCableData(conductor, insulation);
  const suitable = cables.filter((c) => c.ampacity[installMethod] >= requiredCapacity);
  const selected = suitable[0];

  if (!selected) {
    return {
      values: [
        { label: 'Required Capacity', value: requiredCapacity.toFixed(1), unit: 'A' },
      ],
      status: 'FAIL',
      recommendation: 'No single cable of this type is adequate. Consider parallel cables.',
      formula: 'I_z = I_t × C_f × C_g',
      steps: [],
      standardRef: {
        standard: 'IEC 60364-5-52',
        clause: 'Table B.52.2',
        title: 'Cable current-carrying capacity',
      },
    };
  }

  const derated     = selected.ampacity[installMethod] * tempFactor * groupFactor;
  const utilization = (designCurrent / derated) * 100;

  // ── Check 1: Ampacity (verifiable here) ───────────────────────────────────
  const ampacityOk  = derated >= designCurrent;

  // ── Check 2: Utilization (verifiable here) ────────────────────────────────
  // > 90 % is borderline; IEC 60364 has no hard cap but good practice is ≤ 80–85 %
  const utilizHigh  = utilization > 90;

  // ── Checks 3–5: require inputs not available in this function ─────────────
  // Voltage drop   → needs cable length, system voltage, PF   (use Voltage Drop module)
  // SC withstand   → needs prospective fault current, duration (use Short-Circuit module)
  // Protection     → needs upstream device In and type         (check separately)
  // We explicitly flag these as pending rather than silently assuming compliance.

  const overallStatus: CalculationResult['status'] =
    !ampacityOk ? 'FAIL'    :  // cable undersized
    utilizHigh  ? 'WARNING' :  // cable marginal — recommend next size
    'INFO';                    // ampacity verified; remaining checks still required

  const installMethodNames: Record<string, string> = {
    A: 'In conduit on wall',
    T: 'On cable tray',
    G: 'Direct in ground',
    D: 'In duct in ground',
    C: 'Clipped to surface',
  };

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'Design current (with future expansion)',
      formula: `I_d = I_n × F_fut = ${current} × ${futureFactor}`,
      result: `${designCurrent.toFixed(2)} A`,
    },
    {
      step: 2,
      description: 'Temperature correction factor (IEC 60364-5-52 Table B.52.14)',
      formula: `C_f at ${ambientTemp}°C for ${insulation} = ${tempFactor}`,
      result: `${tempFactor.toFixed(3)}`,
    },
    {
      step: 3,
      description: 'Grouping/bunching factor (IEC 60364-5-52 Table B.52.17)',
      formula: `C_g for ${numCables} cables on ${groupMethod} = ${groupFactor}`,
      result: `${groupFactor.toFixed(3)}`,
    },
    {
      step: 4,
      description: 'Required tabulated current capacity',
      formula: `I_t = I_d / (C_f × C_g) = ${designCurrent.toFixed(2)} / (${tempFactor.toFixed(3)} × ${groupFactor.toFixed(3)})`,
      result: `${requiredCapacity.toFixed(2)} A`,
    },
    {
      step: 5,
      description: 'Select cable from IEC 60364-5-52 Table',
      formula: `Select next standard size ≥ ${requiredCapacity.toFixed(1)} A for method ${installMethod} (${installMethodNames[installMethod]})`,
      result: `${selected.size} mm² ${conductor} ${insulation} — tabulated ${selected.ampacity[installMethod]} A`,
    },
    {
      step: 6,
      description: 'Verify derated capacity ≥ design current (IEC 60364-5-52 §523)',
      formula: `I_z = ${selected.ampacity[installMethod]} × C_f × C_g = ${selected.ampacity[installMethod]} × ${tempFactor.toFixed(3)} × ${groupFactor.toFixed(3)}`,
      result: `${derated.toFixed(1)} A ${ampacityOk ? '≥' : '<'} ${designCurrent.toFixed(1)} A — ${ampacityOk ? '✓ PASS' : '✗ FAIL'}`,
    },
    {
      step: 7,
      description: 'Design verification summary — checks completed vs. pending',
      formula: [
        `✓ Ampacity check (IEC 60364-5-52): ${ampacityOk ? 'PASS' : 'FAIL'} — I_z ${derated.toFixed(1)} A ${ampacityOk ? '≥' : '<'} I_d ${designCurrent.toFixed(1)} A`,
        `${utilizHigh ? '⚠' : '✓'} Utilization: ${utilization.toFixed(1)}% ${utilizHigh ? '(> 90 % — consider next cable size)' : '(acceptable)'}`,
        '⊙ Voltage drop: PENDING — run Voltage Drop module (needs length, V, PF)',
        '⊙ SC thermal withstand: PENDING — run Short-Circuit module (needs Ik, t)',
        '⊙ Protective device coordination: PENDING — verify I_n_device ≤ I_z',
      ].join('  |  '),
      result: overallStatus === 'FAIL'
        ? 'FAIL — cable must be upsized'
        : overallStatus === 'WARNING'
        ? 'WARNING — ampacity borderline; complete all pending checks before finalising'
        : 'INFO — ampacity check PASSED; complete 3 pending checks to confirm full design compliance',
    },
  ];

  const utilizStatus: CalculationResult['status'] =
    utilization > 90 ? 'WARNING' : utilization > 75 ? 'INFO' : 'PASS';

  return {
    values: [
      { label: 'Selected Cable Size',       value: `${selected.size} mm²`,                 unit: '',    highlight: true },
      { label: 'Cable Type',                value: `${conductor} ${insulation}`,            unit: ''    },
      { label: 'Installation Method',       value: `${installMethod} — ${installMethodNames[installMethod]}`, unit: '' },
      { label: 'Tabulated Ampacity',        value: selected.ampacity[installMethod].toString(), unit: 'A' },
      { label: 'Derated Ampacity (I_z)',    value: derated.toFixed(1),                     unit: 'A',   highlight: true, status: ampacityOk ? 'PASS' : 'FAIL' },
      { label: 'Design Current (I_d)',      value: designCurrent.toFixed(1),               unit: 'A'    },
      { label: 'Cable Utilization',         value: utilization.toFixed(1),                 unit: '%',   status: utilizStatus },
      { label: 'Temperature Factor (Cf)',   value: tempFactor.toFixed(3),                  unit: ''    },
      { label: 'Grouping Factor (Cg)',      value: groupFactor.toFixed(3),                 unit: ''    },
      { label: 'Ampacity Check',            value: ampacityOk ? 'PASS' : 'FAIL',           unit: '',    status: ampacityOk ? 'PASS' : 'FAIL' },
      { label: 'Voltage Drop Check',        value: 'PENDING',                              unit: '',    status: 'INFO'  },
      { label: 'SC Withstand Check',        value: 'PENDING',                              unit: '',    status: 'INFO'  },
      { label: 'Cable Resistance',          value: selected.resistance.toString(),          unit: 'Ω/km' },
      { label: 'Overall Diameter',          value: selected.od.toString(),                 unit: 'mm'  },
    ],
    status: overallStatus,
    recommendation: ampacityOk
      ? `${selected.size} mm² ${conductor} ${insulation} method ${installMethod}: I_z = ${derated.toFixed(1)} A ≥ I_d = ${designCurrent.toFixed(1)} A (${utilization.toFixed(1)}% utilisation) — ampacity check PASSED.${utilizHigh ? ' Utilisation > 90 % — consider next cable size.' : ''} Still required: voltage drop (Voltage Drop module), SC thermal withstand (Short-Circuit module), protective device coordination.`
      : `Ampacity FAIL — derated capacity ${derated.toFixed(1)} A < design current ${designCurrent.toFixed(1)} A. Select a larger cable or reduce grouping/ambient-temperature derating.`,
    formula: 'I_z = I_t × C_f × C_g',
    steps,
    safetyFactor: derated / designCurrent,
    standardRef: {
      standard: 'IEC 60364-5-52',
      clause: '§523, Table B.52.2',
      table: 'Table B.52.14, B.52.17',
      equation: 'I_z ≥ I_d = I_n × F_fut',
      title: 'Wiring systems — Current-carrying capacity and derating',
    },
  };
}

// ─── Short Circuit ─────────────────────────────────────────────────────────────
export function calculateShortCircuit(inputs: {
  voltage: number;              // kV (line-to-line)
  transformerMVA: number;
  transformerImpedance: number; // %
  cableLength: number;          // m
  cableSize: number;            // mm²
  conductor: 'Cu' | 'Al';
  faultType: '3ph' | 'SLG' | 'DL' | 'EF';
  faultDuration: number;        // s
  xrRatio: number;
}): CalculationResult {
  const { voltage, transformerMVA, transformerImpedance, cableLength, cableSize, conductor, faultType, faultDuration, xrRatio } = inputs;

  const Vn  = voltage * 1000;         // V line-to-line
  const Vph = Vn / Math.sqrt(3);      // V phase-to-neutral
  const c   = 1.05;                   // voltage factor — IEC 60909 Table 1 (Un ≤ 1 kV, c_max)

  // ── Transformer positive-sequence impedance ────────────────────────────────
  const Zbase = (Vn ** 2) / (transformerMVA * 1e6);
  const Zt    = (transformerImpedance / 100) * Zbase;
  const Rt    = Zt / Math.sqrt(1 + xrRatio ** 2);
  const Xt    = Zt * xrRatio / Math.sqrt(1 + xrRatio ** 2);

  // ── Cable positive-sequence resistance at 20°C (IEC 60909 §2.5) ──────────
  // R [Ω/km] = 1000 / (σ [S·m/mm²] × S [mm²])
  // Cu at 20°C: σ = 56 S·m/mm²  →  1 mm² gives 17.86 Ω/km  (IEC 60228)
  // Al at 20°C: σ = 34 S·m/mm²  →  1 mm² gives 29.41 Ω/km
  const sigma     = conductor === 'Cu' ? 56.0 : 34.0;
  const cableR_km = 1000 / (sigma * cableSize);           // Ω/km at 20°C
  const Rc        = (cableR_km * cableLength) / 1000;     // Ω
  const Xc        = (0.08 * cableLength) / 1000;          // Ω  (0.08 Ω/km typical for LV power cable)

  // ── PE / protective conductor size (IEC 60364-5-54 Table 54.2) ───────────
  const Spe  = cableSize <= 16 ? cableSize : cableSize <= 35 ? 16 : cableSize / 2;
  const Rpe  = (1000 / (sigma * Spe) * cableLength) / 1000; // Ω

  // ── Total positive-sequence impedance ─────────────────────────────────────
  const R1 = Rt + Rc;
  const X1 = Xt + Xc;
  const Z1 = Math.sqrt(R1 ** 2 + X1 ** 2);
  const XR = X1 / R1;

  // ── 3-phase fault — reference value ───────────────────────────────────────
  const Ik3 = (c * Vn) / (Math.sqrt(3) * Z1);   // IEC 60909 Eq. 29

  // ── Zero-sequence impedance (Dyn11 transformer, TN-S cable) ──────────────
  // Z0_tx = Zt (delta winding limits Z0 to leakage); Z0_cable includes PE return:
  //   R0 = Rt + Rc + 2·Rpe   X0 ≈ Xt + Xc + 2·Xc
  const R0 = Rt + Rc + 2 * Rpe;
  const X0 = Xt + Xc + 2 * Xc;
  const Z0 = Math.sqrt(R0 ** 2 + X0 ** 2);

  // ── Fault-type specific current ───────────────────────────────────────────
  let Ik: number;
  let faultFormula: string;
  let faultStepDesc: string;
  let faultStepResult: string;

  if (faultType === 'DL') {
    // Line-to-line fault: I"k2 = (√3/2)·I"k3  (IEC 60909 Eq. 31)
    Ik = Ik3 * (Math.sqrt(3) / 2);
    faultFormula   = 'I"k2 = (√3/2) · I"k3';
    faultStepDesc  = 'Line-to-line fault current (IEC 60909 Eq. 31)';
    faultStepResult = `${(Ik/1000).toFixed(3)} kA  [= 0.866 × ${(Ik3/1000).toFixed(3)} kA]`;
  } else if (faultType === 'SLG') {
    // Single line-to-ground: I"k1 = √3·c·Un / |2·Z1 + Z0|  (IEC 60909 Eq. 35, Z2 = Z1)
    const mag = Math.sqrt((2*R1 + R0)**2 + (2*X1 + X0)**2);
    Ik = (Math.sqrt(3) * c * Vn) / mag;
    faultFormula   = 'I"k1 = √3·c·Un / |2·Z1 + Z0|';
    faultStepDesc  = 'Single line-to-ground fault (IEC 60909 Eq. 35, Z2 = Z1)';
    faultStepResult = `${(Ik/1000).toFixed(3)} kA  [|2Z1+Z0| = ${mag.toFixed(4)} Ω, Z0 = ${Z0.toFixed(4)} Ω]`;
  } else if (faultType === 'EF') {
    // Earth fault — loop impedance method (IEC 60364-4-41 / BS 7671):
    // Ief = c·Vph / Z_loop   where Z_loop = Z_source + Z_phase_cable + Z_PE_cable
    const R_loop = Rt + Rc + Rpe;
    const X_loop = Xt + Xc + Xc;     // PE reactance ≈ phase cable reactance
    const Z_loop = Math.sqrt(R_loop ** 2 + X_loop ** 2);
    Ik = (c * Vph) / Z_loop;
    faultFormula   = 'Ief = c·Vph / Z_loop   (phase–PE loop impedance)';
    faultStepDesc  = `Earth fault via PE (IEC 60364-4-41), Spe = ${Spe} mm²`;
    faultStepResult = `${(Ik/1000).toFixed(3)} kA  [Vph = ${Vph.toFixed(1)} V, Z_loop = ${Z_loop.toFixed(4)} Ω]`;
  } else {
    // 3-phase symmetrical: I"k3 = c·Un / (√3·Z1)  (IEC 60909 Eq. 29)
    Ik = Ik3;
    faultFormula   = 'I"k3 = c·Un / (√3·Z1)';
    faultStepDesc  = '3-phase symmetrical fault current (IEC 60909 Eq. 29)';
    faultStepResult = `${(Ik/1000).toFixed(3)} kA`;
  }

  const IkKA = Ik / 1000;

  // ── Peak current (IEC 60909 Eq. 52) ───────────────────────────────────────
  const kappa = 1.02 + 0.98 * Math.exp(-3 / XR);
  const Ip    = kappa * Math.sqrt(2) * Ik;
  const IpKA  = Ip / 1000;

  // ── Thermal equivalent current & cable withstand ───────────────────────────
  const IthKA  = (Ik * Math.sqrt(faultDuration)) / 1000;
  const k      = conductor === 'Cu' ? 143 : 95; // IEC 60364-5-54 Table 54.3, XLPE
  const minSize = (Ik * Math.sqrt(faultDuration)) / k;
  const cablePasses = cableSize >= minSize;

  const faultLabel: Record<string, string> = {
    '3ph': '3-Phase Symmetrical',
    DL:   'Line-to-Line (Double Line)',
    SLG:  'Single Line-to-Ground',
    EF:   'Earth Fault (Phase–PE)',
  };

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'System base impedance',
      formula: `Z_base = Un² / S_n = ${Vn}² / (${transformerMVA}×10⁶)`,
      result: `${Zbase.toFixed(4)} Ω`,
    },
    {
      step: 2,
      description: 'Transformer positive-sequence impedance (IEC 60909 §3.3.2)',
      formula: `Z_T = (z_k%/100)×Z_base = (${transformerImpedance}/100)×${Zbase.toFixed(4)}  →  R_T = ${Rt.toFixed(5)} Ω, X_T = ${Xt.toFixed(5)} Ω`,
      result: `|Z_T| = ${Zt.toFixed(5)} Ω`,
    },
    {
      step: 3,
      description: 'Cable positive-sequence resistance at 20°C — R = 1000/(σ·S) Ω/km  (IEC 60909 §2.5)',
      formula: `σ_${conductor} = ${sigma} S·m/mm²  →  R_c/km = 1000/(${sigma}×${cableSize}) = ${cableR_km.toFixed(4)} Ω/km  →  R_c = ${cableR_km.toFixed(4)}×${cableLength}/1000`,
      result: `R_c = ${Rc.toFixed(5)} Ω,  X_c = ${Xc.toFixed(5)} Ω  (0.08 Ω/km)`,
    },
    {
      step: 4,
      description: 'Total positive-sequence impedance',
      formula: `Z_1 = √(R_1² + X_1²) = √((${R1.toFixed(5)})² + (${X1.toFixed(5)})²)`,
      result: `Z_1 = ${Z1.toFixed(5)} Ω  (X/R = ${XR.toFixed(2)})`,
    },
    {
      step: 5,
      description: faultStepDesc,
      formula: faultFormula,
      result: faultStepResult,
    },
    {
      step: 6,
      description: 'Peak current (IEC 60909 Eq. 52)',
      formula: `κ = 1.02 + 0.98·e^(-3/(X/R)) = 1.02 + 0.98·e^(-3/${XR.toFixed(2)}) = ${kappa.toFixed(3)};   i_p = κ·√2·I"k`,
      result: `${IpKA.toFixed(3)} kA peak`,
    },
    {
      step: 7,
      description: 'Cable minimum thermal cross-section (IEC 60364-5-54 adiabatic, Table 54.3)',
      formula: `S_min = I_k·√t / k = ${IkKA.toFixed(3)}k×√${faultDuration} / ${k}  [k=${k} A·s^0.5/mm² for ${conductor}/XLPE]`,
      result: `${minSize.toFixed(1)} mm² min  →  ${cableSize} mm² selected: ${cableSize >= minSize ? '✓ PASS' : '✗ FAIL'}`,
    },
  ];

  return {
    values: [
      { label: 'Fault Type', value: faultLabel[faultType], unit: '' },
      { label: 'Symmetrical Fault Current (I"k)', value: IkKA.toFixed(3), unit: 'kA', highlight: true },
      { label: 'Peak Fault Current (ip)', value: IpKA.toFixed(3), unit: 'kA', highlight: true },
      { label: 'Thermal Equivalent (Ith)', value: IthKA.toFixed(3), unit: 'kA' },
      { label: 'Positive-Seq Impedance Z1', value: Z1.toFixed(4), unit: 'Ω' },
      { label: 'Zero-Seq Impedance Z0', value: Z0.toFixed(4), unit: 'Ω' },
      { label: 'Cable Resistance at 20°C', value: cableR_km.toFixed(4), unit: 'Ω/km', highlight: true },
      { label: 'PE Conductor Size (Spe)', value: Spe.toString(), unit: 'mm²' },
      { label: 'X/R Ratio', value: XR.toFixed(2), unit: '' },
      { label: 'Peak Factor κ', value: kappa.toFixed(3), unit: '' },
      { label: 'Min Cable Thermal Withstand', value: minSize.toFixed(1), unit: 'mm²' },
      { label: 'Cable Thermal Check', value: cablePasses ? 'PASS' : 'FAIL', unit: '', status: cablePasses ? 'PASS' : 'FAIL' },
    ],
    status: cablePasses ? 'PASS' : 'FAIL',
    recommendation: `${faultLabel[faultType]}: ${IkKA.toFixed(3)} kA symmetrical, ${IpKA.toFixed(3)} kA peak. Cable resistance: ${cableR_km.toFixed(4)} Ω/km (${conductor} at 20°C). Thermal withstand needs ≥${minSize.toFixed(1)} mm² — ${cableSize} mm² is ${cablePasses ? 'ADEQUATE' : 'UNDERSIZED — increase to ' + Math.ceil(minSize) + ' mm²'}.`,
    formula: faultFormula,
    steps,
    standardRef: {
      standard: 'IEC 60909-0',
      clause: faultType === 'EF' ? 'IEC 60364-4-41 §411.4' : '4.2–4.3',
      table: 'Table 1 (voltage factor c)',
      equation: faultFormula,
      title: 'Short-circuit currents in three-phase a.c. systems',
    },
  };
}

// ─── Motor Calculator ──────────────────────────────────────────────────────────
export function calculateMotor(inputs: {
  kw: number;
  voltage: number;
  phases: 1 | 3;
  powerFactor: number;
  efficiency: number;
  startingMethod: 'DOL' | 'SD' | 'SS' | 'VFD' | 'ATS';
  serviceClass: 'S1' | 'S2' | 'S3';
  motorClass: 10 | 20 | 30;
}): CalculationResult {
  const { kw, voltage, phases, powerFactor, efficiency, startingMethod, motorClass } = inputs;

  const flc = phases === 3
    ? (kw * 1000) / (Math.sqrt(3) * voltage * powerFactor * efficiency)
    : (kw * 1000) / (voltage * powerFactor * efficiency);

  const startingMultipliers: Record<string, number> = {
    DOL: 6.0, SD: 2.0, SS: 2.5, VFD: 1.5, ATS: 3.0,
  };

  const startCurrent = flc * startingMultipliers[startingMethod];

  // OLR setting: 1.0 × FLC to 1.15 × FLC
  const olrMin = flc * 1.0;
  const olrMax = flc * 1.15;
  const olrSetting = flc * 1.05;

  // MCCB rating: ≥ 2.5 × FLC for motor circuits (IEC 60947-2)
  const mccbRating = calculateBreaker(flc * 2.5);
  const fuseRating = calculateBreaker(flc * 4); // For DOL

  // Cable design current per IEC 60364-4-43
  const cableDesignCurrent = flc * 1.25;
  const recommendedSize = recommendCableSize(cableDesignCurrent);

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'Full Load Current (FLC)',
      formula: `I_FLC = P / (√3 × V × cosφ × η) = ${kw*1000} / (√3 × ${voltage} × ${powerFactor} × ${efficiency})`,
      result: `${flc.toFixed(2)} A`,
    },
    {
      step: 2,
      description: `Starting current (${startingMethod} method)`,
      formula: `I_start = ${startingMultipliers[startingMethod]} × I_FLC = ${startingMultipliers[startingMethod]} × ${flc.toFixed(2)}`,
      result: `${startCurrent.toFixed(1)} A`,
    },
    {
      step: 3,
      description: 'OLR setting range (IEC 60947-4-1)',
      formula: `I_OLR = (1.0 to 1.15) × I_FLC`,
      result: `${olrMin.toFixed(1)} A to ${olrMax.toFixed(1)} A (set at ${olrSetting.toFixed(1)} A)`,
    },
    {
      step: 4,
      description: 'MCCB rating (IEC 60947-2)',
      formula: `I_MCCB ≥ 2.5 × I_FLC = 2.5 × ${flc.toFixed(2)} = ${(flc*2.5).toFixed(1)} A → Select ${mccbRating} A`,
      result: `${mccbRating} A MCCB`,
    },
    {
      step: 5,
      description: 'Cable sizing (IEC 60364-4-43)',
      formula: `I_design = 1.25 × I_FLC = 1.25 × ${flc.toFixed(2)} = ${cableDesignCurrent.toFixed(1)} A`,
      result: `${recommendedSize} mm² Cu XLPE`,
    },
  ];

  return {
    values: [
      { label: 'Full Load Current', value: flc.toFixed(2), unit: 'A', highlight: true },
      { label: `Starting Current (${startingMethod})`, value: startCurrent.toFixed(1), unit: 'A', highlight: true },
      { label: 'OLR Setting', value: `${olrMin.toFixed(1)} – ${olrMax.toFixed(1)}`, unit: 'A' },
      { label: 'Recommended OLR', value: olrSetting.toFixed(1), unit: 'A' },
      { label: 'MCCB Rating', value: mccbRating.toString(), unit: 'A' },
      { label: 'Fuse Rating (DOL)', value: fuseRating.toString(), unit: 'A' },
      { label: 'Motor Class', value: `Class ${motorClass}`, unit: '' },
      { label: 'Cable Design Current', value: cableDesignCurrent.toFixed(1), unit: 'A' },
      { label: 'Recommended Cable', value: `${recommendedSize} mm²`, unit: 'Cu XLPE', highlight: true },
    ],
    status: 'INFO',
    recommendation: `Motor ${kw} kW, FLC = ${flc.toFixed(1)} A. Use Class ${motorClass} OLR set to ${olrSetting.toFixed(1)} A. MCCB ${mccbRating} A. Cable: ${recommendedSize} mm² Cu XLPE. Starting method: ${startingMethod}.`,
    formula: 'I_FLC = P / (√3 × V × cosφ × η)',
    steps,
    standardRef: {
      standard: 'IEC 60947-4-1',
      clause: '5.3.2',
      title: 'Motor starters — Selection and coordination',
    },
  };
}

function calculateBreaker(current: number): number {
  const ratings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200];
  return ratings.find((r) => r >= current) ?? 3200;
}

function recommendCableSize(current: number): number {
  // Simple recommendation for Cu XLPE in air
  const ampacities: [number, number][] = [
    [1.5, 22], [2.5, 30], [4, 40], [6, 51], [10, 70], [16, 94],
    [25, 119], [35, 147], [50, 174], [70, 215], [95, 260], [120, 299],
    [150, 341], [185, 386], [240, 448], [300, 506], [400, 570], [500, 632],
  ];
  const match = ampacities.find(([, amp]) => amp >= current);
  return match ? match[0] : 630;
}

// ─── Transformer Calculator ────────────────────────────────────────────────────
export function calculateTransformer(inputs: {
  kva: number;
  primaryVoltage: number;   // V
  secondaryVoltage: number; // V
  impedance: number;        // %
  efficiency: number;
  powerFactor: number;
  loadFactor: number;       // % of full load
  connection: 'Dyn11' | 'Yyn0' | 'Yzn11' | 'DY';
}): CalculationResult {
  const { kva, primaryVoltage, secondaryVoltage, impedance, powerFactor, loadFactor, connection } = inputs;

  const primaryFLC = (kva * 1000) / (Math.sqrt(3) * primaryVoltage);
  const secondaryFLC = (kva * 1000) / (Math.sqrt(3) * secondaryVoltage);
  const ratio = primaryVoltage / secondaryVoltage;

  // Short-circuit current at secondary terminals
  const Isc = secondaryFLC / (impedance / 100);

  // Losses (typical IEC 60076 values)
  const pFePercent = 0.25; // No-load loss %
  const pCuPercent = 1.2;  // Load loss %
  const pFe = (kva * pFePercent) / 100;
  const pCu = (kva * pCuPercent) / 100;

  const actualLoad = kva * loadFactor / 100;
  const actualKw = actualLoad * powerFactor;
  const actualPCu = pCu * (loadFactor / 100) ** 2;
  const totalLoss = pFe + actualPCu;
  const etaAtLoad = (actualKw / (actualKw + totalLoss)) * 100;

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'Primary full load current',
      formula: `I_HV = S / (√3 × U_HV) = (${kva} × 1000) / (√3 × ${primaryVoltage})`,
      result: `${primaryFLC.toFixed(1)} A`,
    },
    {
      step: 2,
      description: 'Secondary full load current',
      formula: `I_LV = S / (√3 × U_LV) = (${kva} × 1000) / (√3 × ${secondaryVoltage})`,
      result: `${secondaryFLC.toFixed(1)} A`,
    },
    {
      step: 3,
      description: 'Transformation ratio',
      formula: `n = U_HV / U_LV = ${primaryVoltage} / ${secondaryVoltage}`,
      result: `${ratio.toFixed(3)}`,
    },
    {
      step: 4,
      description: 'Short-circuit current at secondary terminals (IEC 60076)',
      formula: `I_sc = I_FLC / (Z_k% / 100) = ${secondaryFLC.toFixed(1)} / (${impedance}% / 100)`,
      result: `${(Isc/1000).toFixed(2)} kA`,
    },
    {
      step: 5,
      description: 'Core loss (no-load) — IEC 60076-1',
      formula: `P_Fe = ${pFePercent}% × ${kva} kVA`,
      result: `${pFe.toFixed(2)} kW`,
    },
    {
      step: 6,
      description: `Efficiency at ${loadFactor}% load, cosφ=${powerFactor}`,
      formula: `η = P_out / (P_out + P_Fe + P_Cu × β²) × 100`,
      result: `${etaAtLoad.toFixed(2)}%`,
    },
  ];

  return {
    values: [
      { label: 'Primary FLC', value: primaryFLC.toFixed(1), unit: 'A', highlight: true },
      { label: 'Secondary FLC', value: secondaryFLC.toFixed(1), unit: 'A', highlight: true },
      { label: 'Turns Ratio', value: ratio.toFixed(3), unit: '' },
      { label: 'Short-Circuit Current', value: (Isc / 1000).toFixed(2), unit: 'kA', highlight: true },
      { label: 'Connection', value: connection, unit: '' },
      { label: 'Impedance Voltage', value: impedance.toString(), unit: '%' },
      { label: 'Core Loss (No-Load)', value: pFe.toFixed(2), unit: 'kW' },
      { label: 'Load Loss @ 100%', value: pCu.toFixed(2), unit: 'kW' },
      { label: `Efficiency at ${loadFactor}%`, value: etaAtLoad.toFixed(2), unit: '%', status: etaAtLoad > 98 ? 'PASS' : 'WARNING' },
      { label: 'Total Loss @ Load', value: totalLoss.toFixed(2), unit: 'kW' },
    ],
    status: 'INFO',
    recommendation: `${kva} kVA, ${primaryVoltage}/${secondaryVoltage} V, ${connection} transformer. Secondary FLC: ${secondaryFLC.toFixed(1)} A. Fault level: ${(Isc/1000).toFixed(2)} kA at secondary terminals. Efficiency: ${etaAtLoad.toFixed(1)}% at ${loadFactor}% load.`,
    formula: 'I = S / (√3 × V)',
    steps,
    standardRef: {
      standard: 'IEC 60076-1',
      clause: '5',
      title: 'Power transformers — General',
    },
  };
}

// ─── Earthing Calculator ───────────────────────────────────────────────────────
export function calculateEarthing(inputs: {
  soilResistivity: number; // Ω·m
  gridLength: number;      // m (total conductor length)
  gridArea: number;        // m²
  conductorSize: number;   // mm²
  conductor: 'Cu' | 'GI';
  faultCurrent: number;    // A
  faultDuration: number;   // s
  earthPits: number;
  pitDepth: number;        // m
  pitDiameter: number;     // m
}): CalculationResult {
  const { soilResistivity: ρ, gridLength: L, gridArea: A, conductorSize, conductor, faultCurrent, faultDuration, earthPits, pitDepth, pitDiameter } = inputs;

  // Grid resistance — Schwarz formula (IEEE 80 Eq. 57)
  const sqrtA = Math.sqrt(A);
  const Rg = ρ / (4 * sqrtA) + ρ / L;

  // Single earth pit resistance (Dwight formula)
  const b = pitDiameter / 2 / 100; // radius in m
  const Rpit = (ρ / (2 * Math.PI * pitDepth)) * (Math.log(4 * pitDepth / b) - 1);

  // Parallel pit resistance
  const Rpits = Rpit / earthPits;

  // Combined resistance (grid + pits in parallel)
  const Rtotal = (Rg * Rpits) / (Rg + Rpits);

  // Touch and step voltages (IEEE 80 Section 16)
  const Vs = Rtotal * faultCurrent;
  const tolerableStep = (1000 + 6 * 150) * (0.157 / Math.sqrt(faultDuration)); // 70 kg body weight
  const tolerableTouch = (1000 + 1.5 * 150) * (0.157 / Math.sqrt(faultDuration));

  // Conductor thermal withstand (IEEE 80 Eq. 37)
  const k = conductor === 'Cu' ? 226 : 80;
  const Amin = (faultCurrent / k) * Math.sqrt(faultDuration) * 1000; // mm²

  const gridPasses = Rtotal <= 5 && Vs <= tolerableTouch;

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'Grid resistance (IEEE 80 Eq. 57 — Schwarz formula)',
      formula: `R_g = ρ/(4√A) + ρ/L = ${ρ}/(4×√${A}) + ${ρ}/${L}`,
      result: `${Rg.toFixed(3)} Ω`,
    },
    {
      step: 2,
      description: 'Earth pit resistance (Dwight formula)',
      formula: `R_pit = ρ/(2πd) × [ln(4d/b) - 1] = ${ρ}/(2π×${pitDepth}) × [ln(4×${pitDepth}/${b.toFixed(3)}) - 1]`,
      result: `${Rpit.toFixed(3)} Ω per pit`,
    },
    {
      step: 3,
      description: `${earthPits} pits in parallel`,
      formula: `R_pits = R_pit / n = ${Rpit.toFixed(3)} / ${earthPits}`,
      result: `${Rpits.toFixed(3)} Ω`,
    },
    {
      step: 4,
      description: 'Combined earth resistance (grid + pits parallel)',
      formula: `R = R_g × R_pits / (R_g + R_pits) = ${Rg.toFixed(3)} × ${Rpits.toFixed(3)} / (${Rg.toFixed(3)} + ${Rpits.toFixed(3)})`,
      result: `${Rtotal.toFixed(3)} Ω`,
    },
    {
      step: 5,
      description: 'Earth surface potential (touch voltage)',
      formula: `V_s = R × I_f = ${Rtotal.toFixed(3)} × ${faultCurrent}`,
      result: `${Vs.toFixed(1)} V`,
    },
    {
      step: 6,
      description: 'Tolerable touch voltage (IEEE 80 Eq. 29, 70 kg body)',
      formula: `V_touch = (1000 + 1.5×ρ_s) × 0.157/√t = (1000 + 1.5×150) × 0.157/√${faultDuration}`,
      result: `${tolerableTouch.toFixed(1)} V`,
    },
    {
      step: 7,
      description: 'Minimum conductor size (IEEE 80 Eq. 37)',
      formula: `A_min = (I_f/k) × √t = (${faultCurrent}/${k}) × √${faultDuration}`,
      result: `${Amin.toFixed(1)} mm² — Selected: ${conductorSize} mm² ${conductor}`,
    },
  ];

  return {
    values: [
      { label: 'Grid Resistance', value: Rg.toFixed(3), unit: 'Ω' },
      { label: 'Combined Earth Resistance', value: Rtotal.toFixed(3), unit: 'Ω', highlight: true, status: Rtotal <= 5 ? 'PASS' : 'FAIL' },
      { label: 'Touch Voltage', value: Vs.toFixed(1), unit: 'V', status: Vs <= tolerableTouch ? 'PASS' : 'FAIL' },
      { label: 'Tolerable Touch Voltage', value: tolerableTouch.toFixed(1), unit: 'V' },
      { label: 'Tolerable Step Voltage', value: tolerableStep.toFixed(1), unit: 'V' },
      { label: 'Min Conductor Size', value: Amin.toFixed(1), unit: 'mm²' },
      { label: 'Selected Conductor', value: conductorSize.toString(), unit: `mm² ${conductor}`, status: conductorSize >= Amin ? 'PASS' : 'FAIL' },
    ],
    status: gridPasses ? 'PASS' : 'FAIL',
    recommendation: `Earth resistance: ${Rtotal.toFixed(3)} Ω ${Rtotal <= 5 ? '(≤ 5 Ω — ACCEPTABLE per IEEE 80)' : '(> 5 Ω — ADD MORE CONDUCTORS or EARTH PITS)'}. Touch voltage: ${Vs.toFixed(1)} V ${Vs <= tolerableTouch ? '(SAFE)' : '(UNSAFE — improve grid)'}. Use ${conductorSize >= Amin ? conductorSize : Math.ceil(Amin)} mm² ${conductor} conductor.`,
    formula: 'R_g = ρ/(4√A) + ρ/L',
    steps,
    standardRef: {
      standard: 'IEEE 80',
      clause: '16.3 — 17',
      title: 'AC Substation Grounding — Grid and step/touch voltage',
    },
  };
}

// ─── UPS Calculator ────────────────────────────────────────────────────────────
export function calculateUPS(inputs: {
  loadKva: number;
  powerFactor: number;
  backupTime: number;      // hours
  batteryVoltage: number;  // V DC
  efficiency: number;
  redundancy: 'N' | 'N+1' | '2N';
  batteryType: 'VRLA' | 'NiCd' | 'Li-Ion';
  dischargeRate: number;  // C rating (e.g., 10 for C10)
}): CalculationResult {
  const { loadKva, powerFactor, backupTime, batteryVoltage, efficiency, redundancy, batteryType, dischargeRate } = inputs;

  const loadKw = loadKva * powerFactor;
  const upsKva = loadKva / efficiency;

  // Battery capacity calculation
  const loadDCWatts = (loadKw * 1000) / efficiency;
  const batteryAh = (loadDCWatts * backupTime) / (batteryVoltage * 0.8); // 80% DoD

  // Typical battery discharge efficiency factors
  const peukertCorrection: Record<string, number> = {
    VRLA: 1.15, NiCd: 1.10, 'Li-Ion': 1.05
  };
  const correctedAh = batteryAh * peukertCorrection[batteryType];

  // Number of cells
  const cellVoltage: Record<string, number> = { VRLA: 2, NiCd: 1.2, 'Li-Ion': 3.6 };
  const numCells = Math.ceil(batteryVoltage / cellVoltage[batteryType]);

  // Redundancy factor
  const redundancyFactor: Record<string, number> = { N: 1, 'N+1': 2, '2N': 2 };
  const numUPS = redundancyFactor[redundancy];

  // Charger rating (10% of battery Ah typical)
  const chargerRating = correctedAh * 0.1;

  const steps: CalculationStep[] = [
    {
      step: 1,
      description: 'Load power (active)',
      formula: `P = S × cosφ = ${loadKva} × ${powerFactor}`,
      result: `${loadKw.toFixed(2)} kW`,
    },
    {
      step: 2,
      description: 'UPS rating (with efficiency)',
      formula: `S_UPS = S_load / η = ${loadKva} / ${efficiency}`,
      result: `${upsKva.toFixed(2)} kVA`,
    },
    {
      step: 3,
      description: 'DC load power',
      formula: `P_DC = P_load / η = ${loadKw.toFixed(2)} / ${efficiency}`,
      result: `${(loadDCWatts / 1000).toFixed(2)} kW`,
    },
    {
      step: 4,
      description: `Battery capacity (C${dischargeRate}, 80% DoD, IEC 62040)`,
      formula: `C = (P_DC × T) / (V_bat × DoD) = (${(loadDCWatts/1000).toFixed(2)}k × ${backupTime}) / (${batteryVoltage} × 0.8)`,
      result: `${correctedAh.toFixed(0)} Ah`,
    },
    {
      step: 5,
      description: 'Number of battery cells',
      formula: `N_cells = V_bat / V_cell = ${batteryVoltage} / ${cellVoltage[batteryType]}`,
      result: `${numCells} cells in series`,
    },
    {
      step: 6,
      description: 'Charger rating (10% of Ah)',
      formula: `I_charger = C × 10% = ${correctedAh.toFixed(0)} × 0.1`,
      result: `${chargerRating.toFixed(1)} A`,
    },
  ];

  return {
    values: [
      { label: 'UPS Rating', value: upsKva.toFixed(1), unit: 'kVA', highlight: true },
      { label: 'Active Load', value: loadKw.toFixed(1), unit: 'kW' },
      { label: 'Backup Time', value: backupTime.toString(), unit: 'hours' },
      { label: 'Battery Capacity', value: correctedAh.toFixed(0), unit: `Ah at C${dischargeRate}`, highlight: true },
      { label: 'Battery Type', value: batteryType, unit: '' },
      { label: 'Battery Cells (series)', value: numCells.toString(), unit: `cells × ${cellVoltage[batteryType]}V` },
      { label: 'Charger Rating', value: chargerRating.toFixed(1), unit: 'A' },
      { label: 'Redundancy', value: redundancy, unit: `(${numUPS} UPS units)` },
    ],
    status: 'INFO',
    recommendation: `UPS rating: ${upsKva.toFixed(1)} kVA (${redundancy} configuration = ${numUPS} units). Battery bank: ${correctedAh.toFixed(0)} Ah ${batteryType} at ${batteryVoltage} V DC. Provides ${backupTime} hours backup at full load.`,
    formula: 'C = (P_DC × T) / (V_bat × DoD)',
    steps,
    standardRef: {
      standard: 'IEC 62040-3',
      clause: '3.2.5',
      title: 'UPS — Method of specifying performance and test requirements',
    },
  };
}

// ─── Load Schedule ─────────────────────────────────────────────────────────────
export interface LoadItem {
  name: string;
  kw: number;
  quantity: number;
  diversityFactor: number;
  powerFactor: number;
  futureFactor?: number;
}

export function calculateLoadSchedule(loads: LoadItem[], systemVoltage: number, phases: 1 | 3): CalculationResult {
  let totalConnected = 0;
  let totalDemand = 0;
  let totalKvar = 0;

  loads.map((load) => {
    const kw = load.kw * load.quantity;
    const demandKw = kw * load.diversityFactor;
    const kva = demandKw / load.powerFactor;
    const kvar = Math.sqrt(kva ** 2 - demandKw ** 2);
    totalConnected += kw;
    totalDemand += demandKw;
    totalKvar += kvar;
    return { ...load, connectedKw: kw, demandKw, kva, kvar };
  });

  const totalKva = Math.sqrt(totalDemand ** 2 + totalKvar ** 2);
  const systemPf = totalDemand / totalKva;
  const totalCurrent = phases === 3
    ? (totalKva * 1000) / (Math.sqrt(3) * systemVoltage)
    : (totalKva * 1000) / systemVoltage;

  const overallDiversity = totalDemand / totalConnected;

  return {
    values: [
      { label: 'Total Connected Load', value: totalConnected.toFixed(1), unit: 'kW' },
      { label: 'Maximum Demand', value: totalDemand.toFixed(1), unit: 'kW', highlight: true },
      { label: 'Total Reactive Load', value: totalKvar.toFixed(1), unit: 'kVAR' },
      { label: 'Total Apparent Load', value: totalKva.toFixed(1), unit: 'kVA', highlight: true },
      { label: 'System Power Factor', value: systemPf.toFixed(3), unit: '' },
      { label: 'Design Current', value: totalCurrent.toFixed(1), unit: 'A', highlight: true },
      { label: 'Overall Diversity Factor', value: overallDiversity.toFixed(3), unit: '' },
      { label: 'Number of Loads', value: loads.length.toString(), unit: '' },
    ],
    status: 'INFO',
    recommendation: `Maximum demand: ${totalDemand.toFixed(1)} kW / ${totalKva.toFixed(1)} kVA at ${(systemPf * 100).toFixed(1)}% PF. Design for ${totalCurrent.toFixed(0)} A feeder current. Consider power factor correction if PF < 0.9.`,
    formula: 'P_max_demand = Σ(P_connected × DF)',
    steps: [
      {
        step: 1,
        description: 'Sum of connected loads',
        formula: `P_connected = Σ(P_i × Q_i)`,
        result: `${totalConnected.toFixed(1)} kW`,
      },
      {
        step: 2,
        description: 'Maximum demand (after diversity)',
        formula: `P_demand = Σ(P_i × DF_i)`,
        result: `${totalDemand.toFixed(1)} kW`,
      },
      {
        step: 3,
        description: 'Total apparent power',
        formula: `S = √(P² + Q²) = √(${totalDemand.toFixed(1)}² + ${totalKvar.toFixed(1)}²)`,
        result: `${totalKva.toFixed(1)} kVA`,
      },
      {
        step: 4,
        description: 'Design current',
        formula: phases === 3
          ? `I = S / (√3 × V) = ${(totalKva*1000).toFixed(0)} / (√3 × ${systemVoltage})`
          : `I = S / V = ${(totalKva*1000).toFixed(0)} / ${systemVoltage}`,
        result: `${totalCurrent.toFixed(1)} A`,
      },
    ],
    standardRef: {
      standard: 'IEC 60364-5-55',
      clause: '5.3',
      title: 'Load schedule — Maximum demand calculation',
    },
  };
}
