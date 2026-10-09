export const STANDARDS_DB = [
  {
    code: 'IEC 60364-5-52',
    title: 'Electrical installations of buildings — Wiring systems',
    scope: 'Cable installation, current ratings, wiring systems',
    clauses: ['52.1 General', '52.2 Selection of wiring systems', 'Table B.52.2 Current-carrying capacity', 'Table B.52.14 Temperature correction factors', 'Annex G Voltage drop'],
  },
  {
    code: 'IEC 60909',
    title: 'Short-circuit currents in three-phase a.c. systems',
    scope: 'Short-circuit fault current calculation',
    clauses: ['4 Impedance corrections', '5 Calculation of short-circuit currents', 'Table 1 Voltage factor c'],
  },
  {
    code: 'IEC 60287',
    title: 'Calculation of current rating of cables',
    scope: 'Detailed cable thermal rating calculation',
    clauses: ['2.1 Heat balance equation', '2.2 Thermal resistance components', '2.3 Losses in cable'],
  },
  {
    code: 'IEC 61439',
    title: 'Low-voltage switchgear and controlgear assemblies',
    scope: 'Switchboard, MCC, distribution board',
    clauses: ['7 Requirements', '8 Construction requirements', '9 Performance requirements'],
  },
  {
    code: 'IEC 61869',
    title: 'Instrument transformers',
    scope: 'CT and VT selection, accuracy, burden',
    clauses: ['3 Terms and definitions', '5 Rated characteristics', '7 Tests'],
  },
  {
    code: 'IEC 62305',
    title: 'Protection against lightning',
    scope: 'Lightning protection system design',
    clauses: ['1 General principles', '2 Risk management', '3 Physical damage', '4 Electrical and electronic systems'],
  },
  {
    code: 'IEEE 80',
    title: 'Guide for Safety in AC Substation Grounding',
    scope: 'Earthing/grounding grid design',
    clauses: ['7 Criteria', '16 Design of grounding system', '17 Touch and step voltage'],
  },
  {
    code: 'IEEE 141',
    title: 'IEEE Red Book — Industrial Power Systems Analysis',
    scope: 'Power system protection coordination',
    clauses: ['1 Introduction', '3 System protection'],
  },
  {
    code: 'IEEE 519',
    title: 'Recommended Practices for Harmonic Control in Electric Power Systems',
    scope: 'Harmonic limits and filter design',
    clauses: ['5.1 Voltage distortion limits', '6.2 Current distortion limits'],
  },
  {
    code: 'IEEE 1584',
    title: 'Guide for Performing Arc-Flash Hazard Calculations',
    scope: 'Arc flash incident energy and PPE',
    clauses: ['4 Scope', '6 Arc-flash hazard calculations', '7 Boundary calculations'],
  },
  {
    code: 'NEC NFPA 70',
    title: 'National Electrical Code',
    scope: 'US electrical installation standard',
    clauses: ['Art. 220 Branch-circuit, feeder and service loads', 'Art. 230 Services', 'Art. 310 Conductors for general wiring'],
  },
  {
    code: 'BS 7671',
    title: 'Requirements for Electrical Installations (IET Wiring Regulations)',
    scope: 'UK electrical installation standard',
    clauses: ['Appendix 4 Current-carrying capacity', 'Appendix 12 Voltage drop'],
  },
  {
    code: 'IS 3043',
    title: 'Code of Practice for Earthing',
    scope: 'Indian standard for earthing systems',
    clauses: ['4 Types of earthing', '9 Earth electrode', '11 Earth continuity conductor'],
  },
];

export const STANDARD_EQUATIONS = {
  voltageDrop3Phase: {
    formula: 'ΔV = √3 × I × L × (R·cosφ + X·sinφ) / 1000',
    standard: 'IEC 60364-5-52',
    clause: 'Annex G',
    variables: {
      'ΔV': 'Voltage drop (V)',
      'I': 'Load current (A)',
      'L': 'Cable length (m)',
      'R': 'Cable resistance (Ω/km)',
      'X': 'Cable reactance (Ω/km)',
      'cosφ': 'Power factor (dimensionless)',
      'sinφ': 'Reactive factor = √(1 - cos²φ)',
    },
  },
  voltageDropSinglePhase: {
    formula: 'ΔV = 2 × I × L × (R·cosφ + X·sinφ) / 1000',
    standard: 'IEC 60364-5-52',
    clause: 'Annex G',
  },
  cableAmpacity: {
    formula: 'I_z = I_t × C_f × C_g × C_s',
    standard: 'IEC 60364-5-52',
    clause: 'Table B.52.2',
    variables: {
      'I_z': 'Derated current capacity (A)',
      'I_t': 'Tabulated current from table (A)',
      'C_f': 'Temperature correction factor',
      'C_g': 'Grouping/bunching factor',
      'C_s': 'Soil thermal resistivity factor (buried)',
    },
  },
  motorCurrent3Phase: {
    formula: 'I_FLC = P / (√3 × V × η × cosφ)',
    standard: 'IEC 60034',
    clause: '1',
    variables: {
      'I_FLC': 'Full load current (A)',
      'P': 'Motor power (W)',
      'V': 'Line voltage (V)',
      'η': 'Efficiency',
      'cosφ': 'Power factor',
    },
  },
  shortCircuit3Phase: {
    formula: 'I_k3 = c × U_n / (√3 × Z_k)',
    standard: 'IEC 60909',
    clause: '4.2',
    variables: {
      'I_k3': 'Initial symmetrical short-circuit current (kA)',
      'c': 'Voltage factor (1.05 for max, 0.95 for min)',
      'U_n': 'Nominal voltage (V)',
      'Z_k': 'Short-circuit impedance (Ω)',
    },
  },
  transformerCurrent: {
    formula: 'I = S / (√3 × V)',
    standard: 'IEC 60076',
    clause: '1',
  },
  earthGridResistance: {
    formula: 'R = ρ / (4r) + ρ / A',
    standard: 'IEEE 80',
    clause: '16.3',
  },
  cableThermalWithstand: {
    formula: 'S ≥ I_k × √t / k',
    standard: 'IEC 60364-5-54',
    clause: '543.1',
    variables: {
      'S': 'Cable cross-section (mm²)',
      'I_k': 'Fault current (A)',
      't': 'Fault duration (s)',
      'k': 'Material factor (115 for Cu/PVC, 143 for Cu/XLPE)',
    },
  },
};
