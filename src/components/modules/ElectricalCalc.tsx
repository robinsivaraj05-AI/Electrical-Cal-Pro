import React, { useState, useCallback } from 'react';
import { Download, Copy, BookOpen, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#3B82F6';
const V = {
  bg: 'var(--ec-bg-root)', surf: 'var(--ec-bg-card)', brd: 'var(--ec-border)',
  txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)', muted: 'var(--ec-text-muted)',
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface CInput { id: string; label: string; unit: string; def: number; min?: number; step?: number; hint?: string }
interface CResult { label: string; value: number; unit: string; hi?: boolean }
interface CalcOut { results: CResult[]; steps: string[]; status: 'OK' | 'WARN' | 'ERROR'; msg?: string }
interface CalcDef {
  id: string; label: string; desc: string; formula: string; std: string; assume?: string;
  inputs: CInput[];
  fn: (v: Record<string, number>) => CalcOut;
}
interface Cat { id: string; label: string; icon: string; color: string; calcs: CalcDef[] }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const SQRT3 = Math.sqrt(3);

// ─── Calculator Definitions ───────────────────────────────────────────────────
const CATS: Cat[] = [
  // ══════════════════════════════════════════════════════════ MOTOR
  {
    id: 'motor', label: 'Motor', icon: '⚙️', color: '#3B82F6',
    calcs: [
      {
        id: 'torque-kw', label: 'Torque → kW', desc: 'Mechanical power from shaft torque and speed',
        formula: 'P (kW) = T (N·m) × N (rpm) / 9549', std: 'IEC 60034-1',
        inputs: [
          { id: 'T', label: 'Torque', unit: 'N·m', def: 100, min: 0.1 },
          { id: 'N', label: 'Speed', unit: 'rpm', def: 1450, min: 1 },
        ],
        fn: ({ T, N }) => {
          const P = r3(T * N / 9549);
          return { results: [{ label: 'Mechanical Power', value: P, unit: 'kW', hi: true }], steps: [`P = ${T} × ${N} / 9549 = ${P} kW`], status: 'OK' };
        },
      },
      {
        id: 'kw-torque', label: 'kW → Torque', desc: 'Shaft torque from power and speed',
        formula: 'T (N·m) = P (kW) × 9549 / N (rpm)', std: 'IEC 60034-1',
        inputs: [
          { id: 'P', label: 'Power', unit: 'kW', def: 15, min: 0.1 },
          { id: 'N', label: 'Speed', unit: 'rpm', def: 1450, min: 1 },
        ],
        fn: ({ P, N }) => {
          const T = r3(P * 9549 / N);
          return { results: [{ label: 'Shaft Torque', value: T, unit: 'N·m', hi: true }], steps: [`T = ${P} × 9549 / ${N} = ${T} N·m`], status: 'OK' };
        },
      },
      {
        id: 'hp-kw', label: 'HP → kW', desc: 'Convert horsepower to kilowatts',
        formula: 'P (kW) = HP × 0.7457', std: 'IEC / IEEE',
        inputs: [{ id: 'hp', label: 'Power', unit: 'HP', def: 20, min: 0 }],
        fn: ({ hp }) => {
          const kw = r3(hp * 0.7457);
          return { results: [{ label: 'Power', value: kw, unit: 'kW', hi: true }], steps: [`P = ${hp} × 0.7457 = ${kw} kW`], status: 'OK' };
        },
      },
      {
        id: 'kw-hp', label: 'kW → HP', desc: 'Convert kilowatts to horsepower',
        formula: 'HP = P (kW) × 1.34102', std: 'IEC / IEEE',
        inputs: [{ id: 'kw', label: 'Power', unit: 'kW', def: 15, min: 0 }],
        fn: ({ kw }) => {
          const hp = r3(kw * 1.34102);
          return { results: [{ label: 'Power', value: hp, unit: 'HP', hi: true }], steps: [`HP = ${kw} × 1.34102 = ${hp} HP`], status: 'OK' };
        },
      },
      {
        id: 'motor-current', label: 'Motor Current (3φ)', desc: 'Full-load current from rated power',
        formula: 'I (A) = P (kW) × 1000 / (√3 × V × η × PF)', std: 'IEC 60034-1',
        inputs: [
          { id: 'P', label: 'Rated Power', unit: 'kW', def: 15, min: 0.1 },
          { id: 'V', label: 'Supply Voltage', unit: 'V', def: 415, min: 100 },
          { id: 'eff', label: 'Efficiency', unit: '%', def: 92, min: 1 },
          { id: 'pf', label: 'Power Factor', unit: '', def: 0.85, min: 0.1, step: 0.01 },
        ],
        fn: ({ P, V, eff, pf }) => {
          if (pf > 1) return { results: [], steps: [], status: 'ERROR', msg: 'Power factor must be ≤ 1' };
          const I = r3(P * 1000 / (SQRT3 * V * (eff / 100) * pf));
          return { results: [{ label: 'Full Load Current', value: I, unit: 'A', hi: true }], steps: [`I = ${P}×1000 / (√3 × ${V} × ${eff/100} × ${pf}) = ${I} A`], status: 'OK' };
        },
      },
      {
        id: 'starting-current', label: 'Starting Current (DOL)', desc: 'Inrush current at direct-on-line start',
        formula: 'I_start = FLC × Starting Current Multiplier (typically 6–7×)', std: 'IEC 60034-1 / IEC 60947-4',
        assume: 'DOL starting; multiply by 0.33 for star-delta, 0.5–0.85 for soft-starter',
        inputs: [
          { id: 'flc', label: 'Full Load Current', unit: 'A', def: 28, min: 0.1 },
          { id: 'mult', label: 'Starting Multiplier', unit: '×', def: 6.5, min: 1, step: 0.1 },
        ],
        fn: ({ flc, mult }) => {
          const Is = r3(flc * mult);
          return {
            results: [
              { label: 'Starting Current (DOL)', value: Is, unit: 'A', hi: true },
              { label: 'Star-Delta (÷3)', value: r3(Is / 3), unit: 'A' },
              { label: 'Soft-Starter (60%)', value: r3(Is * 0.6), unit: 'A' },
            ],
            steps: [`I_start(DOL) = ${flc} × ${mult} = ${Is} A`], status: 'OK',
          };
        },
      },
      {
        id: 'motor-efficiency', label: 'Motor Efficiency', desc: 'Efficiency from input and output power',
        formula: 'η (%) = P_out (kW) / P_in (kW) × 100', std: 'IEC 60034-30-1 (IE class)',
        inputs: [
          { id: 'Pout', label: 'Output (Shaft) Power', unit: 'kW', def: 15, min: 0.01 },
          { id: 'Pin', label: 'Input (Electrical) Power', unit: 'kW', def: 16.5, min: 0.01 },
        ],
        fn: ({ Pout, Pin }) => {
          if (Pin <= 0 || Pout > Pin) return { results: [], steps: [], status: 'ERROR', msg: 'Input power must be greater than output power' };
          const eff = r3(Pout / Pin * 100);
          const loss = r3(Pin - Pout);
          let ie = 'IE1';
          if (eff >= 95.4) ie = 'IE4'; else if (eff >= 93.6) ie = 'IE3'; else if (eff >= 91.0) ie = 'IE2';
          return {
            results: [
              { label: 'Efficiency', value: eff, unit: '%', hi: true },
              { label: 'Motor Loss', value: loss, unit: 'kW' },
              { label: 'IE Class (approx.)', value: 0, unit: ie },
            ],
            steps: [`η = ${Pout} / ${Pin} × 100 = ${eff}%`, `Loss = ${Pin} - ${Pout} = ${loss} kW`], status: 'OK',
          };
        },
      },
      {
        id: 'power-factor-calc', label: 'Power Factor', desc: 'Calculate power factor from power measurements',
        formula: 'PF = P (kW) / (√3 × V × I / 1000)', std: 'IEC 60034-1',
        inputs: [
          { id: 'P', label: 'Active Power', unit: 'kW', def: 15, min: 0 },
          { id: 'V', label: 'Voltage (L-L)', unit: 'V', def: 415, min: 1 },
          { id: 'I', label: 'Line Current', unit: 'A', def: 28, min: 0.01 },
        ],
        fn: ({ P, V, I }) => {
          const S = r3(SQRT3 * V * I / 1000);
          const pf = r3(P / S);
          const Q = r3(Math.sqrt(S * S - P * P));
          if (pf > 1) return { results: [], steps: [], status: 'WARN', msg: 'PF > 1: check measurements' };
          return {
            results: [
              { label: 'Power Factor', value: pf, unit: '', hi: true },
              { label: 'Apparent Power', value: S, unit: 'kVA' },
              { label: 'Reactive Power', value: Q, unit: 'kVAR' },
            ],
            steps: [`S = √3 × ${V} × ${I} / 1000 = ${S} kVA`, `PF = ${P} / ${S} = ${pf}`], status: 'OK',
          };
        },
      },
      {
        id: 'motor-speed', label: 'Motor Speed & Slip', desc: 'Synchronous speed, rotor speed and slip',
        formula: 'Ns (rpm) = 120 × f / p   |   Slip (%) = (Ns - Nr) / Ns × 100', std: 'IEC 60034-1',
        inputs: [
          { id: 'f', label: 'Supply Frequency', unit: 'Hz', def: 50, min: 1 },
          { id: 'poles', label: 'Number of Poles', unit: '', def: 4, min: 2, step: 2 },
          { id: 'Nr', label: 'Actual Rotor Speed', unit: 'rpm', def: 1450, min: 0 },
        ],
        fn: ({ f, poles, Nr }) => {
          const Ns = r3(120 * f / poles);
          const slip = r3((Ns - Nr) / Ns * 100);
          return {
            results: [
              { label: 'Synchronous Speed', value: Ns, unit: 'rpm' },
              { label: 'Rotor Speed', value: r3(Nr), unit: 'rpm' },
              { label: 'Slip', value: slip, unit: '%', hi: true },
            ],
            steps: [`Ns = 120 × ${f} / ${poles} = ${Ns} rpm`, `Slip = (${Ns} − ${Nr}) / ${Ns} × 100 = ${slip}%`], status: slip > 10 ? 'WARN' : 'OK',
            msg: slip > 10 ? 'High slip — check motor loading and rotor condition' : undefined,
          };
        },
      },
      {
        id: 'input-output-power', label: 'Input / Output Power', desc: 'Electrical input, shaft output and motor losses',
        formula: 'P_in = P_out / η   |   P_loss = P_in − P_out', std: 'IEC 60034-30-1',
        inputs: [
          { id: 'Pout', label: 'Output (Shaft) Power', unit: 'kW', def: 15, min: 0.01 },
          { id: 'eff', label: 'Efficiency', unit: '%', def: 92, min: 1 },
        ],
        fn: ({ Pout, eff }) => {
          const Pin = r3(Pout / (eff / 100));
          const loss = r3(Pin - Pout);
          return {
            results: [
              { label: 'Electrical Input Power', value: Pin, unit: 'kW', hi: true },
              { label: 'Shaft Output Power', value: Pout, unit: 'kW' },
              { label: 'Motor Loss', value: loss, unit: 'kW' },
            ],
            steps: [`P_in = ${Pout} / ${eff/100} = ${Pin} kW`, `Loss = ${Pin} − ${Pout} = ${loss} kW`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ COMPRESSOR
  {
    id: 'compressor', label: 'Compressor', icon: '🔧', color: '#F97316',
    calcs: [
      {
        id: 'airflow-kw', label: 'Air Flow → Motor kW', desc: 'Compressor motor power from FAD and delivery pressure',
        formula: 'P_motor (kW) = Q (m³/hr) × P (bar·g) / (36 × η_comp × η_motor)',
        std: 'ISO 1217',
        assume: 'Adiabatic compression model; Q is FAD at inlet conditions; add ~10% for mechanical losses; η_comp typically 0.75–0.85, η_motor 0.93–0.96',
        inputs: [
          { id: 'Q', label: 'Air Flow (FAD)', unit: 'm³/hr', def: 500, min: 1 },
          { id: 'P', label: 'Delivery Pressure', unit: 'bar·g', def: 7, min: 0.1 },
          { id: 'ec', label: 'Compressor Efficiency', unit: '%', def: 80, min: 10 },
          { id: 'em', label: 'Motor Efficiency', unit: '%', def: 95, min: 10 },
        ],
        fn: ({ Q, P, ec, em }) => {
          const Pmotor = r3(Q * P / (36 * (ec / 100) * (em / 100)));
          const Pshaft = r3(Q * P / (36 * (ec / 100)));
          return {
            results: [
              { label: 'Motor Input Power', value: Pmotor, unit: 'kW', hi: true },
              { label: 'Shaft Power', value: Pshaft, unit: 'kW' },
            ],
            steps: [
              `P_shaft = Q × P / (36 × η_comp) = ${Q} × ${P} / (36 × ${ec/100}) = ${Pshaft} kW`,
              `P_motor = P_shaft / η_motor = ${Pshaft} / ${em/100} = ${Pmotor} kW`,
            ],
            status: 'OK',
          };
        },
      },
      {
        id: 'cfm-kw', label: 'CFM → Motor kW', desc: 'Imperial unit compressor power calculation',
        formula: 'BHP = Q (CFM) × P (psig) / (229 × η_comp)   |   kW = BHP × 0.7457',
        std: 'ISO 1217 / ASME PTC 9',
        assume: 'Standard atmospheric inlet; η_comp = overall adiabatic efficiency',
        inputs: [
          { id: 'cfm', label: 'Air Flow', unit: 'CFM', def: 300, min: 1 },
          { id: 'psig', label: 'Delivery Pressure', unit: 'psig', def: 100, min: 1 },
          { id: 'ec', label: 'Compressor Efficiency', unit: '%', def: 80, min: 10 },
          { id: 'em', label: 'Motor Efficiency', unit: '%', def: 95, min: 10 },
        ],
        fn: ({ cfm, psig, ec, em }) => {
          const bhp = r3(cfm * psig / (229 * (ec / 100)));
          const kw = r3(bhp * 0.7457 / (em / 100));
          return {
            results: [
              { label: 'BHP Required', value: bhp, unit: 'BHP' },
              { label: 'Motor Input Power', value: kw, unit: 'kW', hi: true },
            ],
            steps: [`BHP = ${cfm} × ${psig} / (229 × ${ec/100}) = ${bhp}`, `kW = ${bhp} × 0.7457 / ${em/100} = ${kw} kW`], status: 'OK',
          };
        },
      },
      {
        id: 'comp-current', label: 'Compressor Current', desc: 'Motor line current from rated power',
        formula: 'I (A) = P_motor (kW) × 1000 / (√3 × V × PF)', std: 'IEC 60034-1',
        inputs: [
          { id: 'P', label: 'Motor Power', unit: 'kW', def: 75, min: 0.1 },
          { id: 'V', label: 'Supply Voltage', unit: 'V', def: 415, min: 100 },
          { id: 'pf', label: 'Power Factor', unit: '', def: 0.87, min: 0.1, step: 0.01 },
          { id: 'eff', label: 'Motor Efficiency', unit: '%', def: 94, min: 10 },
        ],
        fn: ({ P, V, pf, eff }) => {
          const I = r3(P * 1000 / (SQRT3 * V * pf * (eff / 100)));
          return { results: [{ label: 'Line Current', value: I, unit: 'A', hi: true }], steps: [`I = ${P}×1000 / (√3×${V}×${pf}×${eff/100}) = ${I} A`], status: 'OK' };
        },
      },
      {
        id: 'air-receiver', label: 'Air Receiver Tank Size', desc: 'Minimum receiver volume for system pressure stability',
        formula: 'V (L) = Q (m³/min) × t (min) × P_atm / ΔP', std: 'ISO 1217 / AS 1210',
        assume: 'P_atm = 1 bar; ΔP = allowable pressure drop during peak demand; t = acceptable time between compressor cycles',
        inputs: [
          { id: 'Q', label: 'Peak Demand', unit: 'm³/min', def: 5, min: 0.01 },
          { id: 'Pd', label: 'Delivery Pressure', unit: 'bar·g', def: 7, min: 0.5 },
          { id: 'dp', label: 'Allowable Pressure Drop', unit: 'bar', def: 0.5, min: 0.1, step: 0.1 },
          { id: 't', label: 'Cycle Time', unit: 'min', def: 1, min: 0.1 },
        ],
        fn: ({ Q, Pd, dp, t }) => {
          const V = r3(Q * t * 1000 * 1.01325 / dp);
          return {
            results: [{ label: 'Receiver Volume', value: V, unit: 'L', hi: true }, { label: 'Receiver Volume', value: r3(V / 1000), unit: 'm³' }],
            steps: [`V = Q × t × P_atm / ΔP = ${Q} × ${t} × 1.01325 / ${dp} = ${r3(V/1000)} m³`], status: 'OK',
          };
        },
      },
      {
        id: 'air-consumption', label: 'Air Consumption', desc: 'Total compressed air demand for pneumatic tools',
        formula: 'Q_total = Σ(q_i × duty_i)   |   Free Air = Q × P_abs / P_atm', std: 'ISO 1217',
        inputs: [
          { id: 'tools', label: 'Number of Tools', unit: '', def: 5, min: 1 },
          { id: 'qpTool', label: 'Consumption per Tool', unit: 'L/min', def: 200, min: 1 },
          { id: 'duty', label: 'Average Duty Cycle', unit: '%', def: 60, min: 1 },
          { id: 'Pd', label: 'Working Pressure', unit: 'bar·g', def: 6, min: 0.5 },
        ],
        fn: ({ tools, qpTool, duty, Pd }) => {
          const Qtotal = r3(tools * qpTool * (duty / 100));
          const Qfree = r3(Qtotal * (Pd + 1.01325) / 1.01325);
          return {
            results: [
              { label: 'Connected Consumption', value: r3(tools * qpTool), unit: 'L/min' },
              { label: 'Demand (with duty)', value: Qtotal, unit: 'L/min', hi: true },
              { label: 'FAD Required', value: Qfree, unit: 'L/min' },
              { label: 'FAD Required', value: r3(Qfree * 60 / 1000), unit: 'm³/hr' },
            ],
            steps: [`Q_demand = ${tools} × ${qpTool} × ${duty/100} = ${Qtotal} L/min`, `FAD = ${Qtotal} × ${(Pd+1.01325).toFixed(5)} / 1.01325 = ${Qfree} L/min`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ CHILLER
  {
    id: 'chiller', label: 'Chiller', icon: '❄️', color: '#0EA5E9',
    calcs: [
      {
        id: 'tr-kw', label: 'Cooling Capacity TR → kW', desc: 'Convert tons of refrigeration to kilowatts',
        formula: 'Q (kW) = TR × 3.5169', std: 'ASHRAE / IEC',
        inputs: [{ id: 'TR', label: 'Cooling Capacity', unit: 'TR', def: 100, min: 0.1 }],
        fn: ({ TR }) => {
          const kw = r3(TR * 3.5169);
          return { results: [{ label: 'Cooling Capacity', value: kw, unit: 'kW', hi: true }], steps: [`Q = ${TR} × 3.5169 = ${kw} kW`], status: 'OK' };
        },
      },
      {
        id: 'kw-tr', label: 'Cooling Capacity kW → TR', desc: 'Convert kilowatts to tons of refrigeration',
        formula: 'TR = Q (kW) / 3.5169', std: 'ASHRAE / IEC',
        inputs: [{ id: 'kw', label: 'Cooling Capacity', unit: 'kW', def: 350, min: 0.1 }],
        fn: ({ kw }) => {
          const TR = r3(kw / 3.5169);
          return { results: [{ label: 'Cooling Capacity', value: TR, unit: 'TR', hi: true }], steps: [`TR = ${kw} / 3.5169 = ${TR} TR`], status: 'OK' };
        },
      },
      {
        id: 'chiller-motor-kw', label: 'Chiller Motor kW', desc: 'Compressor motor power from cooling load and COP',
        formula: 'P_motor (kW) = Q_cooling (kW) / COP', std: 'ASHRAE 90.1 / IEC 62060',
        assume: 'COP = 3–6 for modern water-cooled chillers; IPLV may differ from COP at full load',
        inputs: [
          { id: 'TR', label: 'Cooling Capacity', unit: 'TR', def: 200, min: 0.1 },
          { id: 'COP', label: 'COP', unit: '', def: 5.0, min: 0.5, step: 0.1 },
        ],
        fn: ({ TR, COP }) => {
          const Qcool = r3(TR * 3.5169);
          const Pmotor = r3(Qcool / COP);
          return {
            results: [
              { label: 'Cooling Capacity', value: Qcool, unit: 'kW' },
              { label: 'Compressor Power', value: Pmotor, unit: 'kW', hi: true },
            ],
            steps: [`Q_cool = ${TR} × 3.5169 = ${Qcool} kW`, `P_motor = ${Qcool} / ${COP} = ${Pmotor} kW`], status: 'OK',
          };
        },
      },
      {
        id: 'chwp-flow', label: 'Chilled Water Flow Rate', desc: 'CHW pump flow from cooling load and temperature differential',
        formula: 'Q (m³/hr) = Q_cooling (kW) / (ρ × Cp × ΔT) = Q_cooling / (1.163 × ΔT)', std: 'ASHRAE HVAC Systems',
        assume: 'Water at 10°C: ρ = 999.7 kg/m³, Cp = 4.191 kJ/kg·K; 1.163 = ρ×Cp/3600 in kW/(m³/hr·°C)',
        inputs: [
          { id: 'TR', label: 'Cooling Capacity', unit: 'TR', def: 200, min: 0.1 },
          { id: 'dT', label: 'Supply/Return ΔT', unit: '°C', def: 6, min: 1 },
        ],
        fn: ({ TR, dT }) => {
          const Qcool = r3(TR * 3.5169);
          const flow = r3(Qcool / (1.163 * dT));
          return {
            results: [
              { label: 'CHW Flow Rate', value: flow, unit: 'm³/hr', hi: true },
              { label: 'CHW Flow Rate', value: r3(flow / 3.6), unit: 'L/s' },
            ],
            steps: [`Q_cool = ${TR} × 3.5169 = ${Qcool} kW`, `Flow = ${Qcool} / (1.163 × ${dT}) = ${flow} m³/hr`], status: 'OK',
          };
        },
      },
      {
        id: 'cdw-flow', label: 'Condenser Water Flow', desc: 'Condenser water pump flow (heat rejection)',
        formula: 'Q_condenser = Q_cooling × (1 + 1/COP)   |   Flow = Q_cond / (1.163 × ΔT)', std: 'ASHRAE HVAC Systems',
        inputs: [
          { id: 'TR', label: 'Cooling Capacity', unit: 'TR', def: 200, min: 0.1 },
          { id: 'COP', label: 'COP', unit: '', def: 5.0, min: 0.5, step: 0.1 },
          { id: 'dT', label: 'Condenser Water ΔT', unit: '°C', def: 5, min: 1 },
        ],
        fn: ({ TR, COP, dT }) => {
          const Qcool = TR * 3.5169;
          const Qcond = r3(Qcool * (1 + 1 / COP));
          const flow = r3(Qcond / (1.163 * dT));
          return {
            results: [
              { label: 'Condenser Heat Rejection', value: Qcond, unit: 'kW' },
              { label: 'Condenser Water Flow', value: flow, unit: 'm³/hr', hi: true },
            ],
            steps: [`Q_cond = ${r3(Qcool)} × (1+1/${COP}) = ${Qcond} kW`, `Flow = ${Qcond} / (1.163 × ${dT}) = ${flow} m³/hr`], status: 'OK',
          };
        },
      },
      {
        id: 'chiller-current', label: 'Chiller Current', desc: 'Chiller compressor motor line current',
        formula: 'I (A) = P (kW) × 1000 / (√3 × V × PF)', std: 'IEC 60034-1',
        inputs: [
          { id: 'P', label: 'Chiller Motor Power', unit: 'kW', def: 140, min: 1 },
          { id: 'V', label: 'Supply Voltage', unit: 'V', def: 415, min: 100 },
          { id: 'pf', label: 'Power Factor', unit: '', def: 0.87, min: 0.1, step: 0.01 },
          { id: 'eff', label: 'Motor Efficiency', unit: '%', def: 95, min: 10 },
        ],
        fn: ({ P, V, pf, eff }) => {
          const I = r3(P * 1000 / (SQRT3 * V * pf * (eff / 100)));
          return { results: [{ label: 'Line Current', value: I, unit: 'A', hi: true }], steps: [`I = ${P}×1000 / (√3×${V}×${pf}×${eff/100}) = ${I} A`], status: 'OK' };
        },
      },
      {
        id: 'chiller-cop', label: 'Chiller COP & EER', desc: 'Performance coefficients from measured data',
        formula: 'COP = Q_cooling (kW) / W_compressor (kW)   |   EER (Btu/Wh) = COP × 3.412', std: 'ASHRAE 90.1 / ISO 16358',
        inputs: [
          { id: 'TR', label: 'Cooling Capacity', unit: 'TR', def: 200, min: 0.1 },
          { id: 'W', label: 'Compressor Input Power', unit: 'kW', def: 120, min: 0.1 },
        ],
        fn: ({ TR, W }) => {
          const Qcool = r3(TR * 3.5169);
          const COP = r3(Qcool / W);
          const EER = r3(COP * 3.412);
          const kWperTR = r3(W / TR);
          return {
            results: [
              { label: 'COP', value: COP, unit: '', hi: true },
              { label: 'EER', value: EER, unit: 'Btu/Wh' },
              { label: 'kW/TR', value: kWperTR, unit: 'kW/TR' },
            ],
            steps: [`Q_cool = ${TR} × 3.5169 = ${Qcool} kW`, `COP = ${Qcool} / ${W} = ${COP}`, `EER = ${COP} × 3.412 = ${EER} Btu/Wh`],
            status: COP < 2.5 ? 'WARN' : 'OK',
            msg: COP < 2.5 ? 'Low COP — check refrigerant charge and heat exchanger fouling' : undefined,
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ PUMP
  {
    id: 'pump', label: 'Pump', icon: '💧', color: '#06B6D4',
    calcs: [
      {
        id: 'flow-kw', label: 'Flow Rate → Motor kW', desc: 'Pump motor power from flow rate and head',
        formula: 'P_hydraulic (kW) = Q (m³/hr) × H (m) / 367.1   |   P_motor = P_hydr / (η_pump × η_motor)', std: 'ISO 9906 / IEC 60034',
        assume: 'Water density = 1000 kg/m³; 367.1 = 3600/(ρg/1000) = 3600/9.81',
        inputs: [
          { id: 'Q', label: 'Flow Rate', unit: 'm³/hr', def: 100, min: 0.1 },
          { id: 'H', label: 'Total Head', unit: 'm', def: 30, min: 0.1 },
          { id: 'ep', label: 'Pump Efficiency', unit: '%', def: 75, min: 10 },
          { id: 'em', label: 'Motor Efficiency', unit: '%', def: 94, min: 10 },
        ],
        fn: ({ Q, H, ep, em }) => {
          const Phyd = r3(Q * H / 367.1);
          const Pshaft = r3(Phyd / (ep / 100));
          const Pmotor = r3(Pshaft / (em / 100));
          return {
            results: [
              { label: 'Hydraulic Power', value: Phyd, unit: 'kW' },
              { label: 'Shaft Power', value: Pshaft, unit: 'kW' },
              { label: 'Motor Input Power', value: Pmotor, unit: 'kW', hi: true },
            ],
            steps: [`P_hyd = ${Q}×${H}/367.1 = ${Phyd} kW`, `P_shaft = ${Phyd}/${ep/100} = ${Pshaft} kW`, `P_motor = ${Pshaft}/${em/100} = ${Pmotor} kW`], status: 'OK',
          };
        },
      },
      {
        id: 'pump-head', label: 'System Head', desc: 'Total head from static, friction and velocity heads',
        formula: 'H_total = H_static + H_friction + H_velocity   |   H_velocity = v² / (2g)', std: 'ISO 9906',
        inputs: [
          { id: 'Hs', label: 'Static Head', unit: 'm', def: 20, min: 0 },
          { id: 'Hf', label: 'Friction Head', unit: 'm', def: 8, min: 0 },
          { id: 'v', label: 'Discharge Velocity', unit: 'm/s', def: 2, min: 0 },
        ],
        fn: ({ Hs, Hf, v }) => {
          const Hv = r3(v * v / (2 * 9.81));
          const Ht = r3(Hs + Hf + Hv);
          return {
            results: [
              { label: 'Velocity Head', value: Hv, unit: 'm' },
              { label: 'Total Head', value: Ht, unit: 'm', hi: true },
            ],
            steps: [`H_v = ${v}²/(2×9.81) = ${Hv} m`, `H_total = ${Hs}+${Hf}+${Hv} = ${Ht} m`], status: 'OK',
          };
        },
      },
      {
        id: 'pump-efficiency', label: 'Pump Efficiency', desc: 'Pump efficiency from hydraulic and shaft power',
        formula: 'η_pump (%) = P_hydraulic / P_shaft × 100', std: 'ISO 9906',
        inputs: [
          { id: 'Q', label: 'Flow Rate', unit: 'm³/hr', def: 100, min: 0.1 },
          { id: 'H', label: 'Total Head', unit: 'm', def: 30, min: 0.1 },
          { id: 'Ps', label: 'Shaft Power', unit: 'kW', def: 12, min: 0.1 },
        ],
        fn: ({ Q, H, Ps }) => {
          const Phyd = r3(Q * H / 367.1);
          const eff = r3(Phyd / Ps * 100);
          return {
            results: [
              { label: 'Hydraulic Power', value: Phyd, unit: 'kW' },
              { label: 'Pump Efficiency', value: eff, unit: '%', hi: true },
            ],
            steps: [`P_hyd = ${Q}×${H}/367.1 = ${Phyd} kW`, `η = ${Phyd}/${Ps}×100 = ${eff}%`],
            status: eff < 50 ? 'WARN' : 'OK',
            msg: eff < 50 ? 'Very low efficiency — check pump selection and wear ring condition' : undefined,
          };
        },
      },
      {
        id: 'pump-current', label: 'Pump Motor Current', desc: 'Pump motor line current from power rating',
        formula: 'I (A) = P (kW) × 1000 / (√3 × V × η × PF)', std: 'IEC 60034-1',
        inputs: [
          { id: 'P', label: 'Motor Power', unit: 'kW', def: 15, min: 0.1 },
          { id: 'V', label: 'Supply Voltage', unit: 'V', def: 415, min: 100 },
          { id: 'eff', label: 'Motor Efficiency', unit: '%', def: 93, min: 10 },
          { id: 'pf', label: 'Power Factor', unit: '', def: 0.85, min: 0.1, step: 0.01 },
        ],
        fn: ({ P, V, eff, pf }) => {
          const I = r3(P * 1000 / (SQRT3 * V * (eff / 100) * pf));
          return { results: [{ label: 'Motor Line Current', value: I, unit: 'A', hi: true }], steps: [`I = ${P}×1000/(√3×${V}×${eff/100}×${pf}) = ${I} A`], status: 'OK' };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ FAN
  {
    id: 'fan', label: 'Fan', icon: '🌀', color: '#8B5CF6',
    calcs: [
      {
        id: 'fan-power', label: 'Fan Motor Power', desc: 'Fan shaft and motor power from airflow and pressure',
        formula: 'P_shaft (kW) = Q (m³/s) × ΔP (Pa) / (η_fan × 1000)   |   P_motor = P_shaft / η_motor', std: 'ISO 5801 / IEC 60034',
        inputs: [
          { id: 'Q', label: 'Air Flow', unit: 'm³/hr', def: 10000, min: 1 },
          { id: 'dP', label: 'Total Static Pressure', unit: 'Pa', def: 500, min: 1 },
          { id: 'ef', label: 'Fan Efficiency', unit: '%', def: 72, min: 10 },
          { id: 'em', label: 'Motor Efficiency', unit: '%', def: 93, min: 10 },
        ],
        fn: ({ Q, dP, ef, em }) => {
          const Qm3s = Q / 3600;
          const Pshaft = r3(Qm3s * dP / ((ef / 100) * 1000));
          const Pmotor = r3(Pshaft / (em / 100));
          return {
            results: [
              { label: 'Fan Shaft Power', value: Pshaft, unit: 'kW' },
              { label: 'Motor Input Power', value: Pmotor, unit: 'kW', hi: true },
            ],
            steps: [`Q = ${Q}/3600 = ${r3(Qm3s)} m³/s`, `P_shaft = ${r3(Qm3s)}×${dP}/(${ef/100}×1000) = ${Pshaft} kW`, `P_motor = ${Pshaft}/${em/100} = ${Pmotor} kW`], status: 'OK',
          };
        },
      },
      {
        id: 'fan-efficiency', label: 'Fan Efficiency', desc: 'Fan efficiency from measured power and air data',
        formula: 'η_fan (%) = Q (m³/s) × ΔP (Pa) / P_shaft (W) × 100', std: 'ISO 5801',
        inputs: [
          { id: 'Q', label: 'Air Flow', unit: 'm³/hr', def: 10000, min: 1 },
          { id: 'dP', label: 'Static Pressure', unit: 'Pa', def: 500, min: 1 },
          { id: 'Ps', label: 'Shaft Power', unit: 'kW', def: 2.5, min: 0.01 },
        ],
        fn: ({ Q, dP, Ps }) => {
          const Qm3s = Q / 3600;
          const eff = r3(Qm3s * dP / (Ps * 1000) * 100);
          return {
            results: [{ label: 'Fan Efficiency', value: eff, unit: '%', hi: true }],
            steps: [`Q = ${r3(Qm3s)} m³/s`, `η = ${r3(Qm3s)}×${dP}/(${Ps}×1000)×100 = ${eff}%`],
            status: eff > 100 ? 'ERROR' : eff < 40 ? 'WARN' : 'OK',
            msg: eff > 100 ? 'Efficiency > 100% — check input values' : eff < 40 ? 'Low efficiency — check fan selection and system resistance' : undefined,
          };
        },
      },
      {
        id: 'fan-laws', label: 'Fan Affinity Laws', desc: 'Speed, flow and power at new operating point',
        formula: 'Q₂/Q₁ = N₂/N₁   |   ΔP₂/ΔP₁ = (N₂/N₁)²   |   P₂/P₁ = (N₂/N₁)³', std: 'ISO 5801',
        assume: 'Fan affinity laws assume constant fan geometry and air density; VFD drive losses not included',
        inputs: [
          { id: 'Q1', label: 'Design Flow', unit: 'm³/hr', def: 10000, min: 1 },
          { id: 'dP1', label: 'Design Pressure', unit: 'Pa', def: 500, min: 1 },
          { id: 'P1', label: 'Design Power', unit: 'kW', def: 2.5, min: 0.01 },
          { id: 'N1', label: 'Design Speed', unit: 'rpm', def: 1450, min: 1 },
          { id: 'N2', label: 'New Speed', unit: 'rpm', def: 1200, min: 1 },
        ],
        fn: ({ Q1, dP1, P1, N1, N2 }) => {
          const ratio = N2 / N1;
          const Q2 = r3(Q1 * ratio);
          const dP2 = r3(dP1 * ratio * ratio);
          const P2 = r3(P1 * ratio * ratio * ratio);
          const saving = r3((1 - ratio * ratio * ratio) * 100);
          return {
            results: [
              { label: 'New Flow Rate', value: Q2, unit: 'm³/hr', hi: true },
              { label: 'New Static Pressure', value: dP2, unit: 'Pa' },
              { label: 'New Motor Power', value: P2, unit: 'kW' },
              { label: 'Power Saving', value: saving, unit: '%' },
            ],
            steps: [`Ratio = ${N2}/${N1} = ${r3(ratio)}`, `Q₂ = ${Q1}×${r3(ratio)} = ${Q2} m³/hr`, `ΔP₂ = ${dP1}×${r3(ratio)}² = ${dP2} Pa`, `P₂ = ${P1}×${r3(ratio)}³ = ${P2} kW`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ HVAC ELECTRICAL
  {
    id: 'hvac', label: 'HVAC', icon: '🌡️', color: '#14B8A6',
    calcs: [
      {
        id: 'ach', label: 'Air Changes Per Hour', desc: 'Required supply airflow from room volume and ACH',
        formula: 'Q (m³/hr) = ACH × Volume (m³)', std: 'ASHRAE 62.1 / EN 15251',
        inputs: [
          { id: 'L', label: 'Room Length', unit: 'm', def: 10, min: 0.1 },
          { id: 'W', label: 'Room Width', unit: 'm', def: 8, min: 0.1 },
          { id: 'H', label: 'Room Height', unit: 'm', def: 3, min: 0.1 },
          { id: 'ach', label: 'Required ACH', unit: '/hr', def: 6, min: 0.5, step: 0.5 },
        ],
        fn: ({ L, W, H, ach }) => {
          const V = r3(L * W * H);
          const Q = r3(V * ach);
          return {
            results: [{ label: 'Room Volume', value: V, unit: 'm³' }, { label: 'Required Air Flow', value: Q, unit: 'm³/hr', hi: true }],
            steps: [`V = ${L}×${W}×${H} = ${V} m³`, `Q = ${V}×${ach} = ${Q} m³/hr`], status: 'OK',
          };
        },
      },
      {
        id: 'cooling-load', label: 'Sensible Cooling Load', desc: 'Basic sensible heat gain through envelope',
        formula: 'Q_sensible (kW) = U (W/m²K) × A (m²) × ΔT (K) / 1000', std: 'ASHRAE Fundamentals / EN ISO 6946',
        assume: 'Sensible load only; excludes latent heat, occupants, lighting and equipment gains',
        inputs: [
          { id: 'U', label: 'U-Value', unit: 'W/m²K', def: 1.5, min: 0.01, step: 0.1 },
          { id: 'A', label: 'Surface Area', unit: 'm²', def: 100, min: 0.1 },
          { id: 'dT', label: 'Indoor-Outdoor ΔT', unit: '°C', def: 25, min: 1 },
        ],
        fn: ({ U, A, dT }) => {
          const Q = r3(U * A * dT / 1000);
          const TR = r3(Q / 3.5169);
          return {
            results: [{ label: 'Sensible Cooling Load', value: Q, unit: 'kW', hi: true }, { label: 'Cooling Load', value: TR, unit: 'TR' }],
            steps: [`Q = ${U}×${A}×${dT}/1000 = ${Q} kW`], status: 'OK',
          };
        },
      },
      {
        id: 'duct-velocity', label: 'Duct Velocity & Size', desc: 'Duct dimensions from airflow and target velocity',
        formula: 'A (m²) = Q (m³/s) / v (m/s)   |   D_round = √(4A/π)   |   v = Q/A', std: 'ASHRAE / CIBSE Guide C',
        assume: 'Recommended velocities: main duct 5–8 m/s, branch 3–5 m/s, terminal <2.5 m/s',
        inputs: [
          { id: 'Q', label: 'Air Flow', unit: 'm³/hr', def: 5000, min: 1 },
          { id: 'v', label: 'Target Velocity', unit: 'm/s', def: 6, min: 0.5, step: 0.5 },
        ],
        fn: ({ Q, v }) => {
          const Qm3s = Q / 3600;
          const A = r3(Qm3s / v);
          const D = r3(Math.sqrt(4 * A / Math.PI) * 1000);
          const side = r3(Math.sqrt(A) * 1000);
          return {
            results: [
              { label: 'Duct Area', value: A, unit: 'm²' },
              { label: 'Round Duct Diameter', value: D, unit: 'mm', hi: true },
              { label: 'Square Duct Side', value: side, unit: 'mm' },
            ],
            steps: [`Q = ${Q}/3600 = ${r3(Qm3s)} m³/s`, `A = ${r3(Qm3s)}/${v} = ${A} m²`, `D = √(4×${A}/π) = ${D/1000} m`], status: 'OK',
          };
        },
      },
      {
        id: 'fresh-air', label: 'Fresh Air Requirement', desc: 'Outdoor air based on occupancy (ASHRAE 62.1)',
        formula: 'Q_oa (L/s) = N_people × q_person + A_floor × q_area', std: 'ASHRAE 62.1 / EN 15251 Cat II',
        assume: 'Office zone: q_person = 10 L/s/person (breathing zone), q_area = 0.3 L/s·m² (pollutant control)',
        inputs: [
          { id: 'N', label: 'Number of Occupants', unit: 'people', def: 20, min: 1 },
          { id: 'A', label: 'Floor Area', unit: 'm²', def: 200, min: 1 },
          { id: 'qp', label: 'Air per Person', unit: 'L/s/person', def: 10, min: 1 },
          { id: 'qa', label: 'Air per Area', unit: 'L/s·m²', def: 0.3, min: 0, step: 0.1 },
        ],
        fn: ({ N, A, qp, qa }) => {
          const Qoa = r3(N * qp + A * qa);
          const Qm3hr = r3(Qoa * 3.6);
          return {
            results: [
              { label: 'Outdoor Air (breathing zone)', value: Qoa, unit: 'L/s', hi: true },
              { label: 'Outdoor Air', value: Qm3hr, unit: 'm³/hr' },
            ],
            steps: [`Q_oa = ${N}×${qp} + ${A}×${qa} = ${Qoa} L/s`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ SOLAR
  {
    id: 'solar', label: 'Solar PV', icon: '☀️', color: '#F59E0B',
    calcs: [
      {
        id: 'panel-size', label: 'Solar Panel Array Size', desc: 'PV system size from daily energy demand',
        formula: 'P_array (kWp) = E_daily (kWh/day) / (PSH × η_system)', std: 'IEC 62548 / IEC 61215',
        assume: 'η_system ≈ 0.75–0.85 (accounts for inverter, cable, soiling, temperature losses); PSH = peak sun hours for location',
        inputs: [
          { id: 'E', label: 'Daily Energy Demand', unit: 'kWh/day', def: 50, min: 0.1 },
          { id: 'PSH', label: 'Peak Sun Hours', unit: 'hr/day', def: 5, min: 0.5, step: 0.5 },
          { id: 'eta', label: 'System Efficiency', unit: '%', def: 80, min: 30 },
          { id: 'Pp', label: 'Panel Peak Power', unit: 'Wp', def: 400, min: 50 },
        ],
        fn: ({ E, PSH, eta, Pp }) => {
          const Parray = r3(E / (PSH * (eta / 100)));
          const Npanels = Math.ceil(Parray * 1000 / Pp);
          return {
            results: [
              { label: 'Array Size Required', value: Parray, unit: 'kWp', hi: true },
              { label: 'Number of Panels', value: Npanels, unit: `× ${Pp}Wp panels` },
              { label: 'Actual Array Size', value: r3(Npanels * Pp / 1000), unit: 'kWp' },
            ],
            steps: [`P_array = ${E} / (${PSH} × ${eta/100}) = ${Parray} kWp`, `Panels = ⌈${Parray}×1000/${Pp}⌉ = ${Npanels}`], status: 'OK',
          };
        },
      },
      {
        id: 'battery-size-solar', label: 'Battery Bank Size (Solar)', desc: 'Battery capacity for off-grid autonomy',
        formula: 'Ah = E_daily (Wh) × Autonomy_days / (V_bank × DOD × η_batt)', std: 'IEC 62619 / IEEE 485',
        assume: 'DOD = Depth of Discharge (50–80% for Li-ion, 50% for lead-acid); η_batt = round-trip efficiency',
        inputs: [
          { id: 'E', label: 'Daily Energy', unit: 'kWh/day', def: 50, min: 0.1 },
          { id: 'days', label: 'Autonomy Days', unit: 'days', def: 2, min: 0.5, step: 0.5 },
          { id: 'V', label: 'Battery Bank Voltage', unit: 'V', def: 48, min: 12 },
          { id: 'dod', label: 'Depth of Discharge', unit: '%', def: 80, min: 10 },
          { id: 'eta', label: 'Battery Efficiency', unit: '%', def: 95, min: 60 },
        ],
        fn: ({ E, days, V, dod, eta }) => {
          const Ah = r3(E * 1000 * days / (V * (dod / 100) * (eta / 100)));
          const kWh = r3(Ah * V / 1000);
          return {
            results: [
              { label: 'Battery Capacity', value: Ah, unit: 'Ah', hi: true },
              { label: 'Total Energy Storage', value: kWh, unit: 'kWh' },
            ],
            steps: [`Ah = ${E}×1000×${days} / (${V}×${dod/100}×${eta/100}) = ${Ah} Ah`], status: 'OK',
          };
        },
      },
      {
        id: 'inverter-size', label: 'Inverter Size', desc: 'Minimum inverter rating from AC load',
        formula: 'P_inv (kVA) = P_load (kW) / (PF × η_inv)   |   Add 25% surge margin for motor loads', std: 'IEC 62109-1 / IEC 62109-2',
        inputs: [
          { id: 'P', label: 'AC Load Power', unit: 'kW', def: 10, min: 0.1 },
          { id: 'pf', label: 'Load Power Factor', unit: '', def: 0.9, min: 0.5, step: 0.05 },
          { id: 'eta', label: 'Inverter Efficiency', unit: '%', def: 97, min: 70 },
          { id: 'surge', label: 'Surge Margin', unit: '%', def: 25, min: 0 },
        ],
        fn: ({ P, pf, eta, surge }) => {
          const Pbase = r3(P / ((eta / 100) * pf));
          const Prated = r3(Pbase * (1 + surge / 100));
          return {
            results: [
              { label: 'Minimum Inverter Size', value: Pbase, unit: 'kVA' },
              { label: 'Rated Inverter Size (with surge)', value: Prated, unit: 'kVA', hi: true },
            ],
            steps: [`P_base = ${P}/(${eta/100}×${pf}) = ${Pbase} kVA`, `P_rated = ${Pbase}×${1+surge/100} = ${Prated} kVA`], status: 'OK',
          };
        },
      },
      {
        id: 'pv-string', label: 'PV String Calculation', desc: 'Number of panels in series and parallel strings',
        formula: 'N_series = V_mpp_system / V_mpp_panel   |   N_parallel = I_required / I_mpp_panel', std: 'IEC 62548',
        inputs: [
          { id: 'Vsys', label: 'MPPT Voltage Range (mid)', unit: 'V', def: 600, min: 50 },
          { id: 'Vmp', label: 'Panel Vmp', unit: 'V', def: 37.5, min: 1, step: 0.5 },
          { id: 'Imp', label: 'Panel Imp', unit: 'A', def: 10.7, min: 0.1, step: 0.1 },
          { id: 'Parray', label: 'Total Array Power', unit: 'kWp', def: 10, min: 0.1 },
        ],
        fn: ({ Vsys, Vmp, Imp, Parray }) => {
          const Nseries = Math.round(Vsys / Vmp);
          const Vstring = r3(Nseries * Vmp);
          const Istring = r3(Imp);
          const Ptotal = r3(Vstring * Istring / 1000);
          const Nstrings = Math.ceil(Parray / Ptotal);
          const Ntotal = Nseries * Nstrings;
          return {
            results: [
              { label: 'Panels in Series (per string)', value: Nseries, unit: 'panels' },
              { label: 'String Voltage', value: Vstring, unit: 'V' },
              { label: 'Number of Strings', value: Nstrings, unit: 'strings', hi: true },
              { label: 'Total Panels', value: Ntotal, unit: 'panels' },
            ],
            steps: [`N_series = round(${Vsys}/${Vmp}) = ${Nseries}`, `V_string = ${Nseries}×${Vmp} = ${Vstring} V`, `P_string = ${Vstring}×${Istring}/1000 = ${Ptotal} kWp`, `N_strings = ⌈${Parray}/${Ptotal}⌉ = ${Nstrings}`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ BATTERY
  {
    id: 'battery', label: 'Battery', icon: '🔋', color: '#10B981',
    calcs: [
      {
        id: 'battery-runtime', label: 'Battery Runtime', desc: 'How long a battery can power a load',
        formula: 't (hr) = C (Ah) × V (V) × η / P_load (W)', std: 'IEEE 485 / IEC 62619',
        assume: 'Peukert effect not applied; use 10-hr (C10) rating; reduce by 0.8–0.85 for temperature < 25°C',
        inputs: [
          { id: 'Ah', label: 'Battery Capacity', unit: 'Ah', def: 200, min: 1 },
          { id: 'V', label: 'Battery Voltage', unit: 'V', def: 48, min: 6 },
          { id: 'P', label: 'Load Power', unit: 'W', def: 2000, min: 1 },
          { id: 'eta', label: 'Battery Efficiency', unit: '%', def: 90, min: 50 },
          { id: 'dod', label: 'Usable DOD', unit: '%', def: 80, min: 10 },
        ],
        fn: ({ Ah, V, P, eta, dod }) => {
          const t = r3(Ah * V * (eta / 100) * (dod / 100) / P);
          const tMin = Math.floor((t % 1) * 60);
          return {
            results: [
              { label: 'Runtime', value: t, unit: 'hours', hi: true },
              { label: 'Runtime (hr:min)', value: 0, unit: `${Math.floor(t)}h ${tMin}m` },
            ],
            steps: [`t = ${Ah}×${V}×${eta/100}×${dod/100} / ${P} = ${t} hr`], status: 'OK',
          };
        },
      },
      {
        id: 'battery-ah', label: 'Required Battery Ah', desc: 'Battery capacity for target backup time',
        formula: 'Ah = P_load (W) × t (hr) / (V × η × DOD)', std: 'IEEE 485',
        inputs: [
          { id: 'P', label: 'Load Power', unit: 'W', def: 2000, min: 1 },
          { id: 't', label: 'Required Backup Time', unit: 'hr', def: 4, min: 0.1 },
          { id: 'V', label: 'Battery Voltage', unit: 'V', def: 48, min: 6 },
          { id: 'eta', label: 'Battery Efficiency', unit: '%', def: 90, min: 50 },
          { id: 'dod', label: 'Usable DOD', unit: '%', def: 80, min: 10 },
        ],
        fn: ({ P, t, V, eta, dod }) => {
          const Ah = r3(P * t / (V * (eta / 100) * (dod / 100)));
          return {
            results: [{ label: 'Required Battery Capacity', value: Ah, unit: 'Ah', hi: true }],
            steps: [`Ah = ${P}×${t} / (${V}×${eta/100}×${dod/100}) = ${Ah} Ah`], status: 'OK',
          };
        },
      },
      {
        id: 'charging-time', label: 'Charging Time', desc: 'Time to fully charge a battery',
        formula: 't_charge (hr) = Ah_required / I_charge', std: 'IEC 62619',
        assume: 'Assumes constant-current charging; actual time may be 10–20% longer due to CV phase (absorption stage)',
        inputs: [
          { id: 'Ah', label: 'Battery Capacity', unit: 'Ah', def: 200, min: 1 },
          { id: 'dod', label: 'Current DOD (discharged)', unit: '%', def: 80, min: 5 },
          { id: 'Ich', label: 'Charger Current', unit: 'A', def: 20, min: 0.1 },
        ],
        fn: ({ Ah, dod, Ich }) => {
          const AhNeeded = r3(Ah * (dod / 100));
          const t = r3(AhNeeded / Ich);
          const tMin = Math.floor((t % 1) * 60);
          return {
            results: [
              { label: 'Ah to Restore', value: AhNeeded, unit: 'Ah' },
              { label: 'Charging Time', value: t, unit: 'hours', hi: true },
              { label: 'Charging Time', value: 0, unit: `${Math.floor(t)}h ${tMin}m` },
            ],
            steps: [`Ah_needed = ${Ah}×${dod/100} = ${AhNeeded} Ah`, `t = ${AhNeeded}/${Ich} = ${t} hr`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ PROTECTION
  {
    id: 'protection', label: 'Protection', icon: '🛡️', color: '#EF4444',
    calcs: [
      {
        id: 'mccb-select', label: 'MCCB Selection', desc: 'MCCB rating from motor or feeder load',
        formula: 'I_n ≥ 1.25 × I_FLC (motor) or ≥ 1.0 × I_FL (feeder)   |   Icu ≥ I_sc', std: 'IEC 60947-2',
        inputs: [
          { id: 'FLC', label: 'Full Load Current', unit: 'A', def: 28, min: 0.1 },
          { id: 'Isc', label: 'Prospective Short-Circuit Current', unit: 'kA', def: 10, min: 0.1, step: 0.5 },
          { id: 'isMotor', label: 'Motor Load (1=Yes, 0=Feeder)', unit: '', def: 1, min: 0, step: 1 },
        ],
        fn: ({ FLC, Isc, isMotor }) => {
          const factor = isMotor >= 0.5 ? 1.25 : 1.0;
          const Imin = r3(FLC * factor);
          const ratings = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600];
          const Irated = ratings.find(r => r >= Imin) ?? ratings[ratings.length - 1];
          const icuOptions = [10, 16, 25, 36, 50, 70, 100];
          const Icu = icuOptions.find(r => r >= Isc) ?? 100;
          return {
            results: [
              { label: 'Minimum Rating Required', value: Imin, unit: 'A' },
              { label: 'Selected MCCB Rating', value: Irated, unit: 'A', hi: true },
              { label: 'Min. Breaking Capacity', value: r3(Isc), unit: 'kA' },
              { label: 'Selected Icu', value: Icu, unit: 'kA' },
            ],
            steps: [`I_min = ${FLC}×${factor} = ${Imin} A → select ${Irated} A`, `Icu required ≥ ${Isc} kA → select ${Icu} kA`], status: 'OK',
          };
        },
      },
      {
        id: 'mcb-select', label: 'MCB Selection', desc: 'MCB type and rating for circuit protection',
        formula: 'I_n ≥ I_b (design current)   |   Type B: 3–5×, Type C: 5–10×, Type D: 10–20× trip multiplier', std: 'IEC 60898-1',
        inputs: [
          { id: 'Ib', label: 'Design Current', unit: 'A', def: 16, min: 0.5 },
          { id: 'type', label: 'MCB Type (B=1, C=2, D=3)', unit: '', def: 2, min: 1, step: 1 },
        ],
        fn: ({ Ib, type }) => {
          const t = type <= 1 ? 'B' : type <= 2 ? 'C' : 'D';
          const multMin = type <= 1 ? 3 : type <= 2 ? 5 : 10;
          const multMax = type <= 1 ? 5 : type <= 2 ? 10 : 20;
          const ratings = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
          const In = ratings.find(r => r >= Ib) ?? 63;
          return {
            results: [
              { label: 'MCB Type', value: 0, unit: `Type ${t}` },
              { label: 'Selected Rating', value: In, unit: 'A', hi: true },
              { label: 'Magnetic Trip Range', value: 0, unit: `${In * multMin}–${In * multMax} A` },
            ],
            steps: [`I_design = ${Ib} A → select Type-${t} ${In}A MCB`, `Magnetic trip = ${In}×${multMin}..${multMax} = ${In*multMin}–${In*multMax} A`], status: 'OK',
          };
        },
      },
      {
        id: 'rccb-select', label: 'RCCB Selection', desc: 'Residual current device selection',
        formula: 'I_Δn: 10/30 mA (personal protection), 100/300 mA (fire protection)', std: 'IEC 61008-1',
        inputs: [
          { id: 'Itotal', label: 'Total Load Current', unit: 'A', def: 32, min: 0.5 },
          { id: 'purpose', label: 'Purpose (1=Personal, 2=Fire)', unit: '', def: 1, min: 1, step: 1 },
        ],
        fn: ({ Itotal, purpose }) => {
          const sens = purpose <= 1 ? 30 : 300;
          const ratings = [16, 25, 32, 40, 63, 80, 100, 125];
          const In = ratings.find(r => r >= Itotal) ?? 125;
          return {
            results: [
              { label: 'Selected RCCB Rating', value: In, unit: 'A', hi: true },
              { label: 'Trip Sensitivity', value: sens, unit: 'mA' },
            ],
            steps: [`Load = ${Itotal} A → select ${In} A RCCB`, `Sensitivity = ${sens} mA (${purpose <= 1 ? 'personal protection' : 'fire protection'})`], status: 'OK',
          };
        },
      },
      {
        id: 'relay-setting', label: 'Overcurrent Relay Setting', desc: 'IDMT overcurrent relay pickup and TMS',
        formula: 'I_pickup = 1.05–1.1 × I_FLC   |   t_op = TMS × K / ((I/I_pickup)^α − 1)   [IEC Standard Inverse]', std: 'IEC 60255-151',
        assume: 'IEC Standard Inverse: K=0.14, α=0.02; multiplied by TMS; I_fault at relay location',
        inputs: [
          { id: 'FLC', label: 'Full Load Current', unit: 'A', def: 100, min: 1 },
          { id: 'CT', label: 'CT Ratio (primary)', unit: 'A', def: 200, min: 1 },
          { id: 'Ifault', label: 'Maximum Fault Current', unit: 'A', def: 5000, min: 1 },
          { id: 'tdes', label: 'Desired Trip Time at Max Fault', unit: 's', def: 0.3, min: 0.05, step: 0.05 },
        ],
        fn: ({ FLC, CT, Ifault, tdes }) => {
          const Ipickup = r3(FLC * 1.05);
          const Ipickup_sec = r3(Ipickup / CT * 5);
          const ratio = Ifault / Ipickup;
          const TMS = r3(tdes * (Math.pow(ratio, 0.02) - 1) / 0.14);
          const topGrade = r3(TMS * 0.14 / (Math.pow(ratio, 0.02) - 1));
          return {
            results: [
              { label: 'Pickup Current (primary)', value: Ipickup, unit: 'A' },
              { label: 'Pickup Current (secondary 5A base)', value: Ipickup_sec, unit: 'A' },
              { label: 'TMS Setting', value: TMS, unit: '', hi: true },
              { label: 'Trip Time at Max Fault', value: r3(topGrade), unit: 's' },
            ],
            steps: [`I_pickup = ${FLC}×1.05 = ${Ipickup} A`, `M = ${Ifault}/${Ipickup} = ${r3(ratio)}`, `TMS = ${tdes}×(M^0.02−1)/0.14 = ${TMS}`], status: 'OK',
          };
        },
      },
      {
        id: 'fuse-select', label: 'Fuse Selection', desc: 'HRC fuse rating for motor or feeder',
        formula: 'I_fuse ≥ 1.6 × I_FLC (motor, gG type)   |   I_fuse ≥ 1.0 × I_FL (feeder)', std: 'IEC 60269-1',
        inputs: [
          { id: 'FLC', label: 'Full Load Current', unit: 'A', def: 28, min: 0.1 },
          { id: 'isMotor', label: 'Motor Load (1=Yes, 0=Feeder)', unit: '', def: 1, min: 0, step: 1 },
        ],
        fn: ({ FLC, isMotor }) => {
          const factor = isMotor >= 0.5 ? 1.6 : 1.0;
          const Imin = r3(FLC * factor);
          const ratings = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000];
          const If = ratings.find(r => r >= Imin) ?? ratings[ratings.length - 1];
          return {
            results: [
              { label: 'Minimum Fuse Rating', value: Imin, unit: 'A' },
              { label: 'Selected Fuse (gG/gM)', value: If, unit: 'A', hi: true },
            ],
            steps: [`I_min = ${FLC}×${factor} = ${Imin} A → select ${If} A gG fuse`], status: 'OK',
          };
        },
      },
      {
        id: 'sc-current', label: 'Short-Circuit Current', desc: '3-phase bolted fault current at load end',
        formula: 'I_sc3φ (kA) = V_LL / (√3 × Z_total)   |   Z_total = Z_source + Z_cable', std: 'IEC 60909',
        assume: 'Z_source ≈ V²/Ssc; cable Z from resistance + reactance; voltage factor c=1.05 (IEC 60909)',
        inputs: [
          { id: 'V', label: 'System Voltage (L-L)', unit: 'kV', def: 0.415, min: 0.1, step: 0.001 },
          { id: 'Ssc', label: 'Source Short-Circuit MVA', unit: 'MVA', def: 250, min: 1 },
          { id: 'Rcable', label: 'Cable Resistance', unit: 'mΩ', def: 20, min: 0 },
          { id: 'Xcable', label: 'Cable Reactance', unit: 'mΩ', def: 5, min: 0 },
        ],
        fn: ({ V, Ssc, Rcable, Xcable }) => {
          const Zsrc = r3((V * V / Ssc) * 1000);
          const Ztotal_mO = Math.sqrt(Math.pow(Zsrc + Rcable, 2) + Math.pow(Xcable, 2));
          const Isc = r3(V * 1000 / (SQRT3 * Ztotal_mO / 1000));
          return {
            results: [
              { label: 'Source Impedance', value: Zsrc, unit: 'mΩ' },
              { label: '3-Phase Fault Current', value: r3(Isc / 1000), unit: 'kA', hi: true },
              { label: '3-Phase Fault Current', value: Isc, unit: 'A' },
            ],
            steps: [`Z_src = ${V}²/${Ssc}×1000 = ${Zsrc} mΩ`, `Z_total = √((${Zsrc}+${Rcable})²+${Xcable}²) = ${r3(Ztotal_mO)} mΩ`, `I_sc = ${V*1000}/(√3×${r3(Ztotal_mO/1000)}) = ${Isc} A`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ EARTHING
  {
    id: 'earthing', label: 'Earthing', icon: '⏚', color: '#6B7280',
    calcs: [
      {
        id: 'earth-pit', label: 'Earth Pit Resistance', desc: 'Resistance of a single vertical rod electrode',
        formula: 'R = ρ / (2πL) × [ln(8L/d) − 1]', std: 'IS 3043 / IEEE 80 / IEC 60364-5-54',
        assume: 'Uniform soil resistivity; L = rod length, d = rod diameter; typical ρ: dry sand 1000, clay 50, wet soil 20 Ω·m',
        inputs: [
          { id: 'rho', label: 'Soil Resistivity', unit: 'Ω·m', def: 100, min: 1 },
          { id: 'L', label: 'Rod Length', unit: 'm', def: 3, min: 0.5 },
          { id: 'd', label: 'Rod Diameter', unit: 'mm', def: 16, min: 6 },
        ],
        fn: ({ rho, L, d }) => {
          const dm = d / 1000;
          const R = r3(rho / (2 * Math.PI * L) * (Math.log(8 * L / dm) - 1));
          const Rparallel2 = r3(R / 2 * 1.1);
          return {
            results: [
              { label: 'Single Rod Resistance', value: R, unit: 'Ω', hi: true },
              { label: '2 Rods in Parallel (×1.1 factor)', value: Rparallel2, unit: 'Ω' },
            ],
            steps: [`R = ${rho}/(2π×${L}) × [ln(8×${L}/${dm}) − 1] = ${rho/(2*Math.PI*L)} × ${r3(Math.log(8*L/dm)-1)} = ${R} Ω`],
            status: R > 10 ? 'WARN' : 'OK',
            msg: R > 10 ? 'Resistance > 10 Ω — consider multiple rods, deeper burial, or soil treatment' : undefined,
          };
        },
      },
      {
        id: 'earth-conductor', label: 'Earthing Conductor Size', desc: 'Minimum protective earth conductor cross-section',
        formula: 'S_pe = I_fault (A) × √t (s) / k   |   k: Cu-PVC = 143, Cu-XLPE = 176, Al-PVC = 95', std: 'IEC 60364-5-54 / BS 7671 Table 54.3',
        inputs: [
          { id: 'If', label: 'Fault Current', unit: 'A', def: 5000, min: 1 },
          { id: 't', label: 'Fault Clearance Time', unit: 's', def: 0.4, min: 0.01, step: 0.05 },
          { id: 'k', label: 'k Factor (Cu-PVC=143, Cu-XLPE=176, Al=95)', unit: '', def: 143, min: 50 },
        ],
        fn: ({ If, t, k }) => {
          const Smin = r3(If * Math.sqrt(t) / k);
          const sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
          const Ssel = sizes.find(s => s >= Smin) ?? 300;
          return {
            results: [
              { label: 'Minimum Section Required', value: Smin, unit: 'mm²' },
              { label: 'Selected PE Conductor', value: Ssel, unit: 'mm²', hi: true },
            ],
            steps: [`S = ${If}×√${t}/${k} = ${If}×${r3(Math.sqrt(t))}/${k} = ${Smin} mm² → select ${Ssel} mm²`], status: 'OK',
          };
        },
      },
      {
        id: 'earth-grid', label: 'Earth Grid Resistance (Substation)', desc: 'Approximate earth grid resistance using simplified Sverak formula',
        formula: 'R_grid = ρ × [1/√(20A) + 1/L × (1 + 1/(1 + h√(20/A)))]', std: 'IEEE 80-2013 Eq. (57)',
        assume: 'Simplified for preliminary design; final design requires IEEE 80 full analysis; h = burial depth (typ. 0.5 m)',
        inputs: [
          { id: 'rho', label: 'Soil Resistivity', unit: 'Ω·m', def: 100, min: 1 },
          { id: 'A', label: 'Grid Area', unit: 'm²', def: 400, min: 1 },
          { id: 'L', label: 'Total Conductor Length', unit: 'm', def: 200, min: 1 },
          { id: 'h', label: 'Burial Depth', unit: 'm', def: 0.5, min: 0.1, step: 0.1 },
        ],
        fn: ({ rho, A, L, h }) => {
          const R = r3(rho * (1 / Math.sqrt(20 * A) + 1 / L * (1 + 1 / (1 + h * Math.sqrt(20 / A)))));
          return {
            results: [{ label: 'Grid Resistance', value: R, unit: 'Ω', hi: true }],
            steps: [`R = ${rho} × [1/√(20×${A}) + 1/${L} × (1 + 1/(1+${h}×√(20/${A})))] = ${R} Ω`],
            status: R > 1 ? 'WARN' : 'OK',
            msg: R > 1 ? 'Grid resistance > 1 Ω — increase conductor length or grid area per IEEE 80' : undefined,
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ LOAD
  {
    id: 'load', label: 'Load Calcs', icon: '📊', color: '#A855F7',
    calcs: [
      {
        id: 'connected-load', label: 'Connected & Demand Load', desc: 'Total connected load and maximum demand',
        formula: 'P_demand = P_connected × Demand Factor   |   S (kVA) = P / PF', std: 'IEC 60364 / NEC Article 220',
        inputs: [
          { id: 'P', label: 'Total Connected Load', unit: 'kW', def: 500, min: 0.1 },
          { id: 'df', label: 'Demand Factor', unit: '', def: 0.8, min: 0.1, step: 0.05 },
          { id: 'pf', label: 'Average Power Factor', unit: '', def: 0.85, min: 0.1, step: 0.05 },
        ],
        fn: ({ P, df, pf }) => {
          const Pdem = r3(P * df);
          const S = r3(Pdem / pf);
          const Q = r3(Math.sqrt(S * S - Pdem * Pdem));
          return {
            results: [
              { label: 'Maximum Demand', value: Pdem, unit: 'kW', hi: true },
              { label: 'Apparent Power (kVA)', value: S, unit: 'kVA' },
              { label: 'Reactive Power', value: Q, unit: 'kVAR' },
            ],
            steps: [`P_demand = ${P}×${df} = ${Pdem} kW`, `S = ${Pdem}/${pf} = ${S} kVA`], status: 'OK',
          };
        },
      },
      {
        id: 'diversity-factor', label: 'Diversity Factor', desc: 'Diversity factor from multiple individual maximum demands',
        formula: 'DF = Σ Individual Max Demands / Simultaneous Maximum Demand', std: 'IEC 60364 / CIBSE Guide',
        inputs: [
          { id: 'sumMD', label: 'Sum of Individual Max Demands', unit: 'kW', def: 800, min: 0.1 },
          { id: 'simMD', label: 'Simultaneous Max Demand', unit: 'kW', def: 500, min: 0.1 },
        ],
        fn: ({ sumMD, simMD }) => {
          if (simMD > sumMD) return { results: [], steps: [], status: 'ERROR', msg: 'Simultaneous MD cannot exceed sum of individual MDs' };
          const df = r3(sumMD / simMD);
          return {
            results: [{ label: 'Diversity Factor', value: df, unit: '', hi: true }],
            steps: [`DF = ${sumMD} / ${simMD} = ${df}`], status: 'OK',
          };
        },
      },
      {
        id: 'load-factor', label: 'Load Factor', desc: 'Load factor from energy consumption data',
        formula: 'LF = Average Load (kW) / Peak Load (kW) = Energy (kWh) / (Peak × Hours)', std: 'IEEE / IEC',
        inputs: [
          { id: 'E', label: 'Energy Consumed', unit: 'kWh', def: 2400, min: 1 },
          { id: 'peak', label: 'Peak Demand', unit: 'kW', def: 400, min: 0.1 },
          { id: 'hours', label: 'Time Period', unit: 'hours', def: 24, min: 1 },
        ],
        fn: ({ E, peak, hours }) => {
          const avg = r3(E / hours);
          const lf = r3(avg / peak);
          return {
            results: [
              { label: 'Average Load', value: avg, unit: 'kW' },
              { label: 'Load Factor', value: lf, unit: '', hi: true },
              { label: 'Load Factor', value: r3(lf * 100), unit: '%' },
            ],
            steps: [`Avg = ${E}/${hours} = ${avg} kW`, `LF = ${avg}/${peak} = ${lf}`], status: 'OK',
          };
        },
      },
      {
        id: 'transformer-sizing', label: 'Transformer Sizing (from Load)', desc: 'Distribution transformer kVA from load schedule',
        formula: 'S_transformer ≥ P_total / (PF × DF × η_load_diversity)   |   Add 20–25% growth margin', std: 'IEC 60076-1',
        inputs: [
          { id: 'P', label: 'Total Connected Load', unit: 'kW', def: 500, min: 1 },
          { id: 'df', label: 'Demand Factor', unit: '', def: 0.8, min: 0.1, step: 0.05 },
          { id: 'pf', label: 'Power Factor', unit: '', def: 0.85, min: 0.1, step: 0.05 },
          { id: 'margin', label: 'Future Growth Margin', unit: '%', def: 20, min: 0 },
        ],
        fn: ({ P, df, pf, margin }) => {
          const Smin = r3(P * df / pf);
          const Sfinal = r3(Smin * (1 + margin / 100));
          const std_sizes = [25, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500];
          const Ssel = std_sizes.find(s => s >= Sfinal) ?? 2500;
          return {
            results: [
              { label: 'Min. Transformer Size', value: Smin, unit: 'kVA' },
              { label: 'Size with Growth Margin', value: Sfinal, unit: 'kVA' },
              { label: 'Selected Standard Size', value: Ssel, unit: 'kVA', hi: true },
            ],
            steps: [`S = ${P}×${df}/${pf} = ${Smin} kVA`, `With margin: ${Smin}×${1+margin/100} = ${Sfinal} kVA → select ${Ssel} kVA`], status: 'OK',
          };
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════ CAPACITOR
  {
    id: 'capacitor', label: 'Capacitor', icon: '⚡', color: '#EC4899',
    calcs: [
      {
        id: 'kvar-required', label: 'Required kVAR', desc: 'Capacitor bank size for power factor correction',
        formula: 'Q_c (kVAR) = P (kW) × [tan(φ₁) − tan(φ₂)]', std: 'IEC 60831-1 / IEEE 18',
        inputs: [
          { id: 'P', label: 'Active Power', unit: 'kW', def: 400, min: 0.1 },
          { id: 'pf1', label: 'Existing Power Factor', unit: '', def: 0.75, min: 0.1, step: 0.01 },
          { id: 'pf2', label: 'Target Power Factor', unit: '', def: 0.95, min: 0.1, step: 0.01 },
        ],
        fn: ({ P, pf1, pf2 }) => {
          if (pf1 >= pf2) return { results: [], steps: [], status: 'ERROR', msg: 'Target PF must be greater than existing PF' };
          const phi1 = Math.acos(pf1);
          const phi2 = Math.acos(pf2);
          const Qc = r3(P * (Math.tan(phi1) - Math.tan(phi2)));
          const Q1 = r3(P * Math.tan(phi1));
          const Q2 = r3(P * Math.tan(phi2));
          return {
            results: [
              { label: 'Existing Reactive Power', value: Q1, unit: 'kVAR' },
              { label: 'Target Reactive Power', value: Q2, unit: 'kVAR' },
              { label: 'Capacitor Bank Required', value: Qc, unit: 'kVAR', hi: true },
            ],
            steps: [`Q_c = ${P}×[tan(cos⁻¹(${pf1})) − tan(cos⁻¹(${pf2}))] = ${P}×[${r3(Math.tan(phi1))} − ${r3(Math.tan(phi2))}] = ${Qc} kVAR`], status: 'OK',
          };
        },
      },
      {
        id: 'pf-improvement', label: 'Power Factor After Correction', desc: 'Resulting PF after adding a capacitor bank',
        formula: 'PF_new = P / √[P² + (Q_load − Q_capacitor)²]', std: 'IEC 60831-1',
        inputs: [
          { id: 'P', label: 'Active Power', unit: 'kW', def: 400, min: 0.1 },
          { id: 'Qload', label: 'Existing Reactive Power', unit: 'kVAR', def: 300, min: 0 },
          { id: 'Qcap', label: 'Capacitor Bank Added', unit: 'kVAR', def: 150, min: 0 },
        ],
        fn: ({ P, Qload, Qcap }) => {
          const Qnew = r3(Qload - Qcap);
          const S = r3(Math.sqrt(P * P + Qnew * Qnew));
          const pf = r3(P / S);
          return {
            results: [
              { label: 'Residual Reactive Power', value: Qnew, unit: 'kVAR' },
              { label: 'New Apparent Power', value: S, unit: 'kVA' },
              { label: 'New Power Factor', value: pf, unit: '', hi: true },
            ],
            steps: [`Q_new = ${Qload}−${Qcap} = ${Qnew} kVAR`, `S = √(${P}²+${Qnew}²) = ${S} kVA`, `PF = ${P}/${S} = ${pf}`],
            status: pf > 1 ? 'ERROR' : pf < 0.85 ? 'WARN' : 'OK',
          };
        },
      },
      {
        id: 'cap-current', label: 'Capacitor Bank Current', desc: 'Line current drawn by capacitor bank',
        formula: 'I_cap (A) = Q_c (kVAR) × 1000 / (√3 × V)   [3-phase]', std: 'IEC 60831-1',
        inputs: [
          { id: 'Qc', label: 'Capacitor Bank', unit: 'kVAR', def: 100, min: 0.1 },
          { id: 'V', label: 'System Voltage', unit: 'V', def: 415, min: 100 },
        ],
        fn: ({ Qc, V }) => {
          const I = r3(Qc * 1000 / (SQRT3 * V));
          const C = r3(Qc * 1000 / (2 * Math.PI * 50 * V * V / 3) * 1e6);
          return {
            results: [
              { label: 'Capacitor Line Current', value: I, unit: 'A', hi: true },
              { label: 'Capacitance (per phase)', value: C, unit: 'μF' },
            ],
            steps: [`I = ${Qc}×1000/(√3×${V}) = ${I} A`], status: 'OK',
          };
        },
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function ElectricalCalc() {
  const { addCalculation } = useStore();
  const [catIdx, setCatIdx] = useState(0);
  const [calcIdx, setCalcIdx] = useState(0);
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CalcOut | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('ec-fav-calcs') ?? '[]')));
  const [search, setSearch] = useState('');

  const cat = CATS[catIdx];
  const calc = cat.calcs[calcIdx];

  const getVal = useCallback((inp: CInput) =>
    inputs[`${cat.id}:${calc.id}:${inp.id}`] ?? inp.def, [inputs, cat.id, calc.id]);

  const setVal = (inp: CInput, val: string) => {
    const n = parseFloat(val);
    setInputs(prev => ({ ...prev, [`${cat.id}:${calc.id}:${inp.id}`]: isNaN(n) ? inp.def : n }));
    setResult(null);
  };

  const handleCalcSwitch = (ci: number, cj: number) => {
    setCatIdx(ci); setCalcIdx(cj); setResult(null);
  };

  const handleCalculate = () => {
    const vals: Record<string, number> = {};
    calc.inputs.forEach(inp => { vals[inp.id] = getVal(inp); });
    const out = calc.fn(vals);
    setResult(out);
    if (out.status !== 'ERROR') {
      addCalculation({
        type: 'electrical-calc',
        title: `${cat.label} — ${calc.label}`,
        inputs: Object.fromEntries(calc.inputs.map(i => [i.label, vals[i.id]])),
        results: {
          values: out.results.map(r => ({ label: r.label, value: r.value, unit: r.unit })),
          status: out.status === 'WARN' ? 'WARNING' : 'PASS',
          recommendation: out.msg ?? '',
          formula: calc.formula,
          steps: out.steps.map((s, i) => ({ step: i + 1, description: s, formula: s, result: s })),
          standardRef: { standard: calc.std, clause: '', title: calc.label },
        },
        notes: calc.assume ?? '',
        standard: calc.std,
      });
    }
  };

  const handleExport = () => {
    if (!result || result.status === 'ERROR') return;
    const inputRows = calc.inputs.map(i => [i.label, `${getVal(i)}`, i.unit]);
    const resultRows = result.results.map(r => [r.label, `${r.value}`, r.unit]);
    const body = `
      <h2>Inputs</h2>${tableHTML(['Parameter', 'Value', 'Unit'], inputRows)}
      <h2>Results</h2>${tableHTML(['Parameter', 'Value', 'Unit'], resultRows)}
      <h2>Formula</h2><p style="padding:8px;background:#f8fafc;border-left:4px solid #1e40af;font-family:monospace">${calc.formula}</p>
      <h2>Calculation Steps</h2>${result.steps.map(s => `<p style="padding:4px 8px;font-family:monospace;font-size:9pt">${s}</p>`).join('')}
      ${calc.assume ? `<h2>Engineering Assumptions</h2><p style="padding:8px;font-size:9pt;color:#64748b">${calc.assume}</p>` : ''}
      <h2>Standards Reference</h2><p style="padding:8px">${calc.std}</p>
    `;
    const date = new Date().toISOString().split('T')[0];
    downloadReport(`${cat.label} — ${calc.label}`, 'Electrical Engineering Calculator', calc.std, body, `${cat.id}-${calc.id}-${date}.pdf`);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = result.results.map(r => `${r.label}: ${r.value} ${r.unit}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('ec-fav-calcs', JSON.stringify([...next]));
      return next;
    });
  };

  const filteredCats = search
    ? CATS.map(c => ({ ...c, calcs: c.calcs.filter(cl => cl.label.toLowerCase().includes(search.toLowerCase()) || cl.desc.toLowerCase().includes(search.toLowerCase())) })).filter(c => c.calcs.length > 0)
    : CATS;

  const statusColor = result ? (result.status === 'OK' ? '#10B981' : result.status === 'WARN' ? '#F59E0B' : '#EF4444') : ACCENT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: V.txt, fontSize: 22, fontWeight: 800, margin: 0 }}>Electrical Calculators</h2>
          <p style={{ color: V.sec, fontSize: 13, margin: '4px 0 0' }}>Motor · Compressor · Chiller · Pump · Fan · HVAC · Solar · Battery · Protection · Earthing · Load · Capacitor</p>
        </div>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) { setCatIdx(0); setCalcIdx(0); } }}
          placeholder="Search calculators..."
          style={{ padding: '8px 14px', background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 8, color: V.txt, fontSize: 13, width: 220 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Category + Calculator list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredCats.map((c, ci) => {
            const realCatIdx = CATS.findIndex(x => x.id === c.id);
            const isOpen = catIdx === realCatIdx;
            return (
              <div key={c.id} style={{ background: V.surf, border: `1px solid ${isOpen ? c.color + '60' : V.brd}`, borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => { setCatIdx(realCatIdx); setCalcIdx(0); setResult(null); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: V.txt }}
                >
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 13, color: isOpen ? c.color : V.txt }}>{c.label}</span>
                  <span style={{ fontSize: 11, color: V.muted }}>{c.calcs.length}</span>
                  {isOpen ? <ChevronDown style={{ width: 14, height: 14, color: V.muted }} /> : <ChevronRight style={{ width: 14, height: 14, color: V.muted }} />}
                </button>
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${V.brd}`, padding: '4px 0' }}>
                    {c.calcs.map((cl, cj) => {
                      const realCalcIdx = cat.calcs.findIndex(x => x.id === cl.id);
                      const isActive = calcIdx === realCalcIdx;
                      const isFav = favorites.has(cl.id);
                      return (
                        <button
                          key={cl.id}
                          onClick={() => handleCalcSwitch(realCatIdx, realCalcIdx)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px 7px 28px', background: isActive ? `${c.color}18` : 'none', border: 'none', cursor: 'pointer', color: isActive ? c.color : V.sec, fontSize: 12, textAlign: 'left', borderLeft: isActive ? `3px solid ${c.color}` : '3px solid transparent' }}
                        >
                          <span style={{ flex: 1 }}>{cl.label}</span>
                          {isFav && <span style={{ fontSize: 10, color: '#F59E0B' }}>★</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Calculator Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Calc Header */}
          <div style={{ background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 12, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <h3 style={{ color: V.txt, fontSize: 18, fontWeight: 800, margin: 0 }}>{calc.label}</h3>
                  <button onClick={() => toggleFav(calc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: favorites.has(calc.id) ? '#F59E0B' : V.muted }}>
                    {favorites.has(calc.id) ? '★' : '☆'}
                  </button>
                </div>
                <p style={{ color: V.sec, fontSize: 13, margin: '4px 0 0' }}>{calc.desc}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {result && result.status !== 'ERROR' && (
                  <>
                    <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      <Download style={{ width: 13, height: 13 }} /> PDF
                    </button>
                    <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: V.surf, border: `1px solid ${V.brd}`, color: V.sec, borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                      <Copy style={{ width: 13, height: 13 }} /> Copy
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Formula banner */}
            <div style={{ marginTop: 14, padding: '10px 14px', background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Formula</div>
              <code style={{ fontSize: 12, color: V.txt, fontFamily: 'monospace' }}>{calc.formula}</code>
            </div>
            {calc.assume && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#F59E0B10', border: '1px solid #F59E0B30', borderRadius: 8, display: 'flex', gap: 8 }}>
                <Info style={{ width: 14, height: 14, color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11.5, color: V.sec }}>{calc.assume}</span>
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <BookOpen style={{ width: 13, height: 13, color: V.muted }} />
              <span style={{ fontSize: 11, color: V.muted }}>{calc.std}</span>
            </div>
          </div>

          {/* Inputs + Calculate */}
          <div style={{ background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 12, padding: '18px 22px' }}>
            <h4 style={{ color: V.txt, fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>Inputs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {calc.inputs.map(inp => (
                <div key={inp.id}>
                  <label style={{ display: 'block', fontSize: 12, color: V.sec, marginBottom: 5, fontWeight: 600 }}>
                    {inp.label} {inp.unit && <span style={{ color: V.muted, fontWeight: 400 }}>({inp.unit})</span>}
                  </label>
                  <input
                    type="number"
                    value={getVal(inp)}
                    min={inp.min}
                    step={inp.step ?? 'any'}
                    onChange={e => setVal(inp, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: V.bg, border: `1px solid ${V.brd}`, borderRadius: 8, color: V.txt, fontSize: 13 }}
                  />
                  {inp.hint && <p style={{ fontSize: 11, color: V.muted, margin: '3px 0 0' }}>{inp.hint}</p>}
                </div>
              ))}
            </div>
            <button
              onClick={handleCalculate}
              style={{ marginTop: 18, padding: '10px 28px', background: cat.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em' }}
            >
              Calculate
            </button>
          </div>

          {/* Results */}
          {result && (
            <div style={{ background: V.surf, border: `2px solid ${statusColor}40`, borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {result.status === 'ERROR'
                  ? <AlertTriangle style={{ width: 18, height: 18, color: '#EF4444' }} />
                  : result.status === 'WARN'
                  ? <AlertTriangle style={{ width: 18, height: 18, color: '#F59E0B' }} />
                  : <CheckCircle style={{ width: 18, height: 18, color: '#10B981' }} />}
                <h4 style={{ color: V.txt, fontSize: 14, fontWeight: 700, margin: 0 }}>Results</h4>
                {result.msg && <span style={{ fontSize: 12, color: statusColor, marginLeft: 4 }}>— {result.msg}</span>}
              </div>

              {result.status === 'ERROR' ? (
                <p style={{ color: '#EF4444', fontSize: 13 }}>{result.msg}</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                    {result.results.map((r, i) => (
                      <div key={i} style={{ padding: '12px 16px', background: r.hi ? `${statusColor}15` : V.bg, border: `1px solid ${r.hi ? statusColor + '50' : V.brd}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: V.muted, marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontSize: r.hi ? 22 : 16, fontWeight: 800, color: r.hi ? statusColor : V.txt, lineHeight: 1.1 }}>
                          {r.value !== 0 ? r.value.toFixed(3) : r.unit}
                        </div>
                        {r.value !== 0 && <div style={{ fontSize: 12, color: V.sec, marginTop: 3 }}>{r.unit}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Calc steps */}
                  <div style={{ padding: '10px 14px', background: V.bg, borderRadius: 8, border: `1px solid ${V.brd}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Calculation Steps</div>
                    {result.steps.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: V.sec, fontFamily: 'monospace', padding: '3px 0', borderBottom: i < result.steps.length - 1 ? `1px solid ${V.brd}` : 'none' }}>
                        <span style={{ color: ACCENT, marginRight: 8, fontWeight: 700 }}>{i + 1}.</span>{s}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
