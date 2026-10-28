import { MORE_TOPICS } from './moreTopics';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HighlightNote {
  type: 'note' | 'warning' | 'tip' | 'standard';
  title: string;
  body: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StandardRef {
  code: string;
  title: string;
  clause?: string;
}

export interface TroubleshootItem {
  symptom: string;
  causes: string[];
  remedy: string;
}

export interface TypeItem {
  name: string;
  description: string;
  when: string;
}

export interface SelectionItem {
  parameter: string;
  guidance: string;
}

export interface TopicContent {
  introduction: string;
  keyFacts: string[];
  types?: TypeItem[];
  construction?: string;
  workingPrinciple?: string;
  selectionGuide?: SelectionItem[];
  applications?: string[];
  advantages?: string[];
  disadvantages?: string[];
  commonMistakes?: string[];
  troubleshooting?: TroubleshootItem[];
  testing?: string[];
  installation?: string[];
  maintenance?: string[];
  safety?: string[];
  standards?: StandardRef[];
  faqs?: FAQ[];
  quiz?: QuizQuestion[];
  relatedCalculations?: string[];
  notes?: HighlightNote[];
}

export interface Topic {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readingTime: number;
  tags: string[];
  status: 'complete' | 'coming-soon';
  content?: TopicContent;
  // stub data for coming-soon topics
  intro?: string;
  relatedTopics?: string[];
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  topicCount: number;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  { id: 'protection',    label: 'Protection Devices',      icon: '🛡️', color: '#DC2626', description: 'Fuses, circuit breakers, contactors, relays and overcurrent protection', topicCount: 12 },
  { id: 'cables',        label: 'Cables & Wiring',          icon: '🔌', color: '#2563EB', description: 'Power cables, control cables, cable management and terminations', topicCount: 12 },
  { id: 'motors',        label: 'Motors & Drives',          icon: '⚙️', color: '#0891B2', description: 'AC/DC motors, VFDs, starters and motor protection', topicCount: 12 },
  { id: 'transformers',  label: 'Transformers',             icon: '🔄', color: '#7C3AED', description: 'Distribution, power, instrument transformers and tap changers', topicCount: 10 },
  { id: 'power-system',  label: 'Power Systems',            icon: '⚡', color: '#D97706', description: 'Substations, switchgear, busbar design and power flow', topicCount: 12 },
  { id: 'earthing',      label: 'Earthing & Lightning',     icon: '⛰️', color: '#16A34A', description: 'Earthing systems, lightning protection and surge coordination', topicCount: 10 },
  { id: 'power-quality', label: 'Power Quality',            icon: '📊', color: '#DB2777', description: 'Harmonics, power factor, voltage stability and power conditioning', topicCount: 10 },
  { id: 'metering',      label: 'Metering & Instruments',   icon: '🔬', color: '#0D9488', description: 'Energy meters, analyzers, CTs/PTs and instrumentation', topicCount: 10 },
  { id: 'industrial',    label: 'Industrial Systems',       icon: '🏭', color: '#CA8A04', description: 'MCC, PLC, SCADA, control panels and industrial automation', topicCount: 14 },
  { id: 'standards',     label: 'Standards & Safety',       icon: '📋', color: '#475569', description: 'IEC, IEEE, NEC, BS 7671, arc flash, LOTO and electrical safety', topicCount: 17 },
];

// ─── Complete Topic: Fuse ────────────────────────────────────────────────────

const FUSE: Topic = {
  id: 'fuse',
  title: 'Fuse',
  category: 'Protection Devices',
  categoryId: 'protection',
  icon: '🔧',
  difficulty: 'beginner',
  readingTime: 12,
  tags: ['overcurrent protection', 'fusing', 'IEC 60269', 'HRC fuse', 'semiconductor fuse'],
  status: 'complete',
  content: {
    introduction: `A fuse is the simplest and oldest form of overcurrent protection. It consists of a thin metal element (fusible link) that melts and opens the circuit when excessive current flows through it. Unlike circuit breakers, a fuse is a single-use device — once it operates it must be replaced.

The key characteristic of a fuse is its time-current characteristic (TCC): at 1.25× rated current it may take hours to operate, while at 10× rated current it operates in milliseconds. This discrimination capability makes fuses excellent for protecting semiconductors and cables against short-circuit faults.

Fuses are rated by: (1) Current rating — the continuous current the fuse can carry, (2) Voltage rating — the maximum voltage across the fuse after operation, (3) Breaking capacity (Icu) — the maximum prospective fault current the fuse can safely interrupt, (4) Time-current characteristic — the curve that defines how quickly the fuse operates at each overload current.`,

    keyFacts: [
      'Fuses operate on the principle of I²t (current-squared × time) — energy to melt the fusible element',
      'HRC (High Rupturing Capacity) fuses can interrupt up to 80–100 kA fault current',
      'Semiconductor fuses (aR type) have very fast operation (< 1 ms) to protect thyristors and diodes',
      'Fuse time-current curves have two regions: the melting region and the total clearing region',
      'Pre-arcing I²t must be less than the withstand I²t of the protected equipment',
      'gG fuses protect cables from overload and short circuit; gM fuses protect motors (have higher short-time withstand)',
      'Fuses provide a natural current-limiting effect — they interrupt before the fault current reaches its prospective peak',
    ],

    types: [
      { name: 'gG / gL (General Purpose)', description: 'General purpose fuse that protects cables from both overload and short circuit. The most common type for general wiring protection in distribution boards.', when: 'Use for cable and wiring protection in LV distribution systems. IEC 60269-1 type.' },
      { name: 'gM (Motor Protection)', description: 'Motor-rated fuse with a higher short-time withstand to allow motor starting current without operating. Provides short-circuit protection only — needs an OLR for overload.', when: 'Use in motor circuits with a separate overload relay for the overload protection. Do not use gG — motor starting current will blow it.' },
      { name: 'aR (Semiconductor)', description: 'Ultra-fast fuse specifically for semiconductor protection (thyristors, diodes, IGBTs). Operates in < 1 ms to prevent silicon junction damage.', when: 'Use in VFD DC buses, UPS rectifiers and thyristor drives. Must be coordinated with the device I²t rating.' },
      { name: 'aM (Motor Circuit)', description: 'Partial-range fuse that only protects against short circuits — does NOT protect against overloads. Typically used upstream of a motor starter.', when: 'Use when the overload protection is provided by a separate OLR or motor protection relay. Common in IEC motor starter combination assemblies.' },
      { name: 'HV Fuse (HRC)', description: 'Medium/high voltage fuse for transformer and capacitor protection. Available as expulsion type or current-limiting (DIN type). Ratings up to 36 kV.', when: 'Use on MV side of distribution transformers up to 2500 kVA and MV motor circuits. Replace the feeder circuit breaker for simple radial feeders.' },
      { name: 'Cartridge Fuse', description: 'The standard cylindrical fuse body with end contacts. Fully enclosed, no external arc. Sizes range from 2A to 800A in standard DIN sizes.', when: 'Standard for industrial distribution boards, switchgear and motor control centers. Easy to replace and available worldwide.' },
    ],

    construction: `A typical HRC cartridge fuse consists of:

**1. Body (ceramic or glass):** Provides mechanical strength and contains the arc energy during operation. Ceramic is used for high-current, high-voltage rated fuses; glass allows visual inspection of the element.

**2. Fusible element:** A silver or silver-alloy strip with notches (restriction zones) that control where the fuse melts first. Multiple parallel elements improve current distribution and TCC shape. For current-limiting fuses, the element is a ribbon in a helical pattern.

**3. Filler material:** Quartz sand packed around the element. During a fault, the arc is quenched in the sand. The sand also absorbs heat energy and fragments the arc into many short arcs, enabling the high breaking capacity (> 80 kA).

**4. End caps and contacts:** Copper or brass end caps make the electrical connection. Contact clips must grip firmly to maintain low contact resistance.

**5. Indicator (optional):** A striker pin or lamp indicator that pops out or illuminates when the fuse operates, allowing quick visual identification of a blown fuse.`,

    workingPrinciple: `**Normal operation:** Current flows through the fusible element. The element heats up proportionally to I²R, but at rated current the heat dissipated to the surrounding quartz sand is enough to keep the element below its melting point.

**Overload operation:** At currents above rating, the element heats faster than it can cool. The restriction zones heat up first (higher resistance per unit length). The element slowly melts at these zones — this can take minutes for small overloads or seconds for larger ones. The time-current characteristic governs this behavior.

**Short circuit operation:** At very high fault currents (5–100× rated), the element melts in microseconds before the current reaches its prospective peak. This is the current-limiting effect — the fuse "cuts off" the fault current before it peaks, reducing the let-through energy (I²t) to levels safe for the protected equipment.

**Arc extinction:** After the element melts, an arc forms across the gap. The arc plasma heats the quartz sand, which melts and forms a fulgurite (glassy tube) around the arc. This rapidly de-ionizes and extinguishes the arc, and the silica absorbs the arc energy. The HRC fuse can interrupt up to 100 kA in this way.`,

    selectionGuide: [
      { parameter: 'Current rating (In)', guidance: 'Select fuse In at 100–125% of the load current. For cables, the fuse In must be ≤ the cable ampacity (Iz). For motors, use a gM fuse at approximately 200–250% of the motor FLC to allow starting current.' },
      { parameter: 'Voltage rating (Un)', guidance: 'Fuse voltage rating must be ≥ the system operating voltage. Note: a 240V rated fuse must NOT be used in a 415V system — the arc may not extinguish after the element melts.' },
      { parameter: 'Breaking capacity (Icu)', guidance: 'The fuse Icu must be ≥ the prospective short-circuit current (Isc) at the point of installation. Calculate Isc from the transformer fault level. Typical LV boards: 25–50 kA.' },
      { parameter: 'Time-current characteristic', guidance: 'Select the TCC based on what is being protected: gG for cables (slow), aR for semiconductors (fast), gM for motor feeders (intermediate). Check that the fuse TCC coordinates with upstream and downstream devices.' },
      { parameter: 'Pre-arcing I²t', guidance: 'The pre-arcing I²t of the fuse must be less than the I²t withstand of the protected cable or semiconductor. The cable I²t = k²S² where k=115 for PVC/copper, S is cable CSA in mm².' },
      { parameter: 'Physical size', guidance: 'Standard DIN sizes: 00 (160A), 0 (160A), 1 (250A), 2 (400A), 3 (630A). Select based on the current rating. Different DIN sizes cannot be interchanged, providing foolproofing for different circuit ratings.' },
    ],

    applications: [
      'LV distribution boards — protecting outgoing feeders and branch circuits',
      'Motor control centers — short-circuit protection upstream of contactors and OLRs',
      'Transformer HV protection — expulsion or current-limiting HV fuses on primary side',
      'Semiconductor protection — aR fuses in VFD DC links, rectifiers and UPS',
      'Capacitor banks — protecting capacitors from short-circuit faults',
      'Instrumentation circuits — small glass fuses (0.1A–5A) protecting control wiring',
      'Automotive and battery systems — blade fuses, MIDI and MEGA fuses',
    ],

    advantages: [
      'Simple, reliable and inherently fail-safe — open circuit on operation',
      'Current-limiting effect reduces damage to downstream equipment under fault conditions',
      'Very high breaking capacity (up to 100 kA) for low cost',
      'No moving parts — not subject to mechanical wear or adjustment drift',
      'Excellent short-circuit protection with fast operating time',
      'Low initial cost compared to MCBs and MCCBs',
      'Compact size for high breaking capacity',
    ],

    disadvantages: [
      'Single-use — must be replaced after every operation (unlike MCB which can be reset)',
      'Requires fuse stock to be maintained on site for each fuse type and rating used',
      'Cannot be remotely operated or automated for load switching',
      'Risk of wrong fuse being fitted (wrong rating or type) during replacement',
      'Cannot provide earth fault protection on its own (needs separate RCCB)',
      'Difficult to test without removing — no "test" function',
      'Operating time increases as current decreases — slow for minor overloads',
    ],

    commonMistakes: [
      'Using gG fuses in motor circuits — motor starting current blows the fuse; use gM or aM type',
      'Upsizing the fuse rating to prevent nuisance tripping instead of fixing the overload',
      'Using the wrong voltage rating (e.g., 240V fuse on a 415V system)',
      'Fitting the wrong fuse type (e.g., aR semiconductor fuse in a general circuit — too fast for load switching)',
      'Not checking breaking capacity against the available fault current at the installation point',
      'Replacing a blown fuse without investigating the cause of the fault first',
    ],

    troubleshooting: [
      { symptom: 'Fuse blows immediately on replacement', causes: ['Permanent short-circuit fault in the circuit', 'Fuse undersized for the load', 'Ground fault present'], remedy: 'Disconnect all loads. Test circuit for insulation resistance (>1 MΩ). Locate and repair fault before replacing fuse.' },
      { symptom: 'Fuse blows after a delay (minutes/hours)', causes: ['Circuit is overloaded — continuous current exceeds fuse rating', 'Multiple loads added since fuse was sized', 'High ambient temperature derating'], remedy: 'Measure actual load current. If > 80% of fuse rating, reduce load or upsize fuse and cable together.' },
      { symptom: 'Fuse does not blow despite overload', causes: ['Fuse oversized for the cable (cable at risk of overheating)', 'High contact resistance preventing heat transfer to element', 'Fuse degraded or incorrect type'], remedy: 'Check fuse rating against cable ampacity. Replace old fuses periodically in high-vibration environments.' },
    ],

    testing: [
      'Visual inspection: check fuse body for cracks, discoloration or struck indicator pin',
      'Continuity test: with circuit de-energized, check fuse resistance with a low-range ohmmeter — blown fuse reads OL (open)',
      'Insulation resistance test: measure IR of connected cable with fuse removed (should be > 1 MΩ)',
      'TCC verification: compare fuse markings with manufacturer TCC curves to confirm correct type',
      'Breaking capacity check: verify Icu rating ≥ available fault level from network calculations',
    ],

    installation: [
      'Ensure the circuit is de-energized and isolated before opening fuse holder',
      'Verify the fuse type, rating, and voltage rating match the circuit design',
      'Clean fuse contacts and holder contacts — oxidized contacts increase resistance',
      'Ensure fuse is fully seated in the holder — partial contact causes arcing and overheating',
      'For DIN-rail fuse holders: check ferrule fuse size matches holder size (wrong size fuses can appear seated but have poor contact)',
      'Record the installation date on HV fuses — some types have limited shelf life',
      'Label fuse boards clearly: each fuse position should show circuit, current rating and type',
    ],

    maintenance: [
      'Inspect all fuse holders annually for signs of overheating (discoloration, deformation)',
      'Tighten all fuse holder screws annually — vibration causes contact loosening',
      'Replace glass fuses that appear darkened inside (indicates the element has operated at some point)',
      'Maintain adequate fuse stock: at minimum 3 spare fuses for each rating and type in use',
      'Log all fuse operations (date, circuit, likely cause) for trending and root cause analysis',
      'Test RCDs and other protective devices annually — fuses themselves require no functional testing',
    ],

    safety: [
      'Never bypass a blown fuse with wire or metal objects — this removes all overcurrent protection',
      'Always use the correct voltage-rated fuse — undersized voltage rating can cause the arc to sustain after operation',
      'Wear appropriate PPE (arc flash face shield, insulating gloves) when working on live fuse boards',
      'De-energize and lock-out before replacing HRC fuses rated above 63A',
      'HV fuses must only be replaced by qualified personnel with HV live-working authorization',
      'Check that fuse holder ratings match or exceed the fuse rating',
      'Never use a higher-rated fuse as a temporary measure without engineering review',
    ],

    standards: [
      { code: 'IEC 60269-1', title: 'Low-voltage fuses — General requirements', clause: '6 (Characteristics)' },
      { code: 'IEC 60269-2', title: 'Supplementary requirements for fuses for use by authorized persons', clause: '' },
      { code: 'IEC 60269-3', title: 'Supplementary requirements for fuses for use by unskilled persons', clause: '' },
      { code: 'IEC 60947-3', title: 'Switches, disconnectors, switch-disconnectors and fuse-combination units', clause: '' },
      { code: 'IEEE C37.40', title: 'Service conditions and definitions for high-voltage fuses', clause: '' },
      { code: 'BS EN 60269', title: 'Low-voltage fuses (UK adoption of IEC 60269)', clause: '' },
    ],

    faqs: [
      { question: 'Why does replacing a blown fuse with a higher-rated fuse cause cable fires?', answer: 'The cable ampacity is sized to match the original fuse rating. A higher-rated fuse allows more current to flow before operating. If the overload that blew the original fuse continues, the cable overheats and insulation degrades, leading to fire. The fuse protects the cable, not the load.' },
      { question: 'What is the difference between rated current and ultimate breaking capacity?', answer: 'Rated current (In) is the maximum continuous current the fuse can carry without operating. Ultimate breaking capacity (Icu) is the maximum fault current the fuse can safely interrupt (clear the arc) without the fuse body shattering or the arc sustaining. A 63A fuse may have an Icu of 80 kA — these are completely separate parameters.' },
      { question: 'Can I use the same fuse in both 50 Hz and 60 Hz systems?', answer: 'Yes, fuses are generally rated for both 50 Hz and 60 Hz as their operation is governed by the I²t of the element, not by frequency. Always check the manufacturer\'s datasheet to confirm dual-frequency ratings.' },
      { question: 'What does "current-limiting" mean for a fuse?', answer: 'A current-limiting fuse interrupts the fault current before it reaches its prospective peak value. In an AC system, the prospective peak can be 2.2× the RMS value. A current-limiting fuse operates in the first quarter cycle (< 5 ms), limiting the peak let-through current to a fraction of the prospective peak. This dramatically reduces the mechanical and thermal stress on downstream equipment.' },
    ],

    quiz: [
      { question: 'A motor rated 15 kW, 400V, 3-phase has an FLC of 30A. Which fuse type and rating should be used for short-circuit protection only (overload protection by OLR)?', options: ['gG fuse, 32A', 'aM fuse, 63A', 'gM fuse, 63A', 'gG fuse, 63A'], correctIndex: 1, explanation: 'An aM (or gM) fuse is the correct type for motor circuit short-circuit protection. aM fuses are partial-range (short-circuit only) and can be sized at 2× FLC = 60A → 63A standard rating. gG fuses are not suitable because motor starting current would blow a gG fuse sized for the FLC.' },
      { question: 'The prospective short-circuit current at an LV board is 22 kA. Which minimum breaking capacity fuse must be used?', options: ['10 kA', '16 kA', '25 kA', '50 kA'], correctIndex: 2, explanation: 'The fuse Icu (ultimate breaking capacity) must be ≥ the prospective fault current. 22 kA requires at minimum a 25 kA rated fuse. Using a 10 kA or 16 kA fuse would risk the fuse body shattering or the arc not being extinguished during a fault.' },
      { question: 'A cable has k²S² = 1,500,000 A²s. The upstream fuse has a pre-arcing I²t of 800,000 A²s. Is the cable protected against short circuit?', options: ['Yes — pre-arcing I²t of fuse is less than cable withstand', 'No — the cable withstand must be less than the fuse I²t', 'Cannot determine without voltage rating', 'Only if the fuse is a gG type'], correctIndex: 0, explanation: 'The cable withstand I²t (k²S²) must be GREATER than the fuse pre-arcing I²t. Here, 1,500,000 > 800,000 — so the cable is protected. The fuse will operate before the cable reaches its thermal damage limit.' },
    ],

    relatedCalculations: ['cable-current', 'mccb', 'short-circuit'],
    notes: [
      { type: 'warning', title: 'Never use a higher-rated fuse to solve nuisance tripping', body: 'If a fuse blows frequently, the cause is either an overloaded circuit or a fault. Upsizing the fuse removes protection from the cable — the cable insulation can overheat and start a fire before the oversized fuse operates.' },
      { type: 'standard', title: 'IEC 60269 Fuse Utilization Categories', body: 'gG = general purpose (full range — overload + short circuit). gM = motor circuit (full range). aR = semiconductor (partial range — short circuit only). aM = motor circuit (partial range — short circuit only). The first letter (g/a) indicates range: g=full, a=partial. The second letter indicates the application.' },
      { type: 'tip', title: 'Pre-arcing I²t: the key selection parameter for semiconductor protection', body: 'For semiconductor protection, always check that fuse pre-arcing I²t < device I²t withstand. The device I²t is given in the thyristor/IGBT datasheet. If the fuse I²t is too high, the junction will be destroyed before the fuse clears the fault.' },
    ],
  },
};

// ─── Complete Topic: MCB ─────────────────────────────────────────────────────

const MCB: Topic = {
  id: 'mcb',
  title: 'Miniature Circuit Breaker (MCB)',
  category: 'Protection Devices',
  categoryId: 'protection',
  icon: '⚡',
  difficulty: 'beginner',
  readingTime: 14,
  tags: ['MCB', 'circuit breaker', 'IEC 60898', 'overcurrent', 'tripping characteristic'],
  status: 'complete',
  content: {
    introduction: `A Miniature Circuit Breaker (MCB) is an automatically operated electrical switch that protects circuits from overcurrent damage. Unlike a fuse, an MCB can be reset after tripping — making it reusable and convenient. MCBs are the most common form of overcurrent protection in residential, commercial and light industrial installations.

The MCB combines two protection mechanisms: a thermal bimetal element for overload protection (inverse time characteristic) and an electromagnetic trip for instantaneous short-circuit protection. The threshold at which the magnetic trip operates defines the MCB's "curve type" (B, C, D or K).

MCBs are rated by current (from 0.5A to 125A), number of poles (1P, 2P, 3P, 4P), tripping curve, and breaking capacity (typically 6 kA or 10 kA). They are standardized under IEC 60898-1 (household and similar) and IEC 60947-2 (industrial MCBs).`,

    keyFacts: [
      'MCBs use both thermal (bimetal) and magnetic (electromagnetic coil) trip mechanisms',
      'IEC 60898 curve B trips at 3–5× In, curve C at 5–10× In, curve D at 10–20× In',
      'Standard MCB breaking capacity: 6 kA (domestic) to 10 kA (industrial) — MCCBs needed for higher fault levels',
      'MCBs can be reset immediately after a thermal trip but should not be reset repeatedly without investigating the fault',
      '4-pole MCBs break all phases plus neutral — required in TN-S earthing systems',
      'Rated diversity factor allows multiple MCBs in one board to be loaded at 80% of combined rating',
      'Electronic MCBs (eMCB) offer programmable trip settings and monitoring capability',
    ],

    types: [
      { name: 'Curve B (3–5× In)', description: 'Magnetic instantaneous trip at 3–5× rated current. The most sensitive curve — protects circuits with no inrush current.', when: 'Residential circuits, lighting, resistive loads, electronic equipment, socket circuits. Use where false tripping from inrush is not expected.' },
      { name: 'Curve C (5–10× In)', description: 'Magnetic instantaneous trip at 5–10× rated current. The most common industrial type — handles moderate inrush loads.', when: 'Distribution boards, commercial wiring, motors up to 2.2 kW. The standard choice for most commercial and industrial applications.' },
      { name: 'Curve D (10–20× In)', description: 'High magnetic threshold for circuits with very high inrush. Survives transformer energization and large motor starting.', when: 'Transformer feeders, large motor circuits, welding equipment, X-ray machines. Only use where inrush genuinely requires the high threshold.' },
      { name: 'Curve K (8–12× In)', description: 'Similar to D curve but with tighter tolerance band. IEC 60947-2 specifies K curve for industrial MCBs with specific trip tolerances.', when: 'Industrial motor and transformer circuits requiring more precise protection coordination than D curve. Specified under IEC 60947-2.' },
      { name: 'RCBO (MCB + RCD)', description: 'Residual Current operated circuit Breaker with Overcurrent protection. Combines MCB overcurrent protection with 30mA RCD for earth-fault protection.', when: 'Individual circuit protection where earth fault protection is needed. More expensive than separate MCB+RCD but saves space and provides per-circuit protection.' },
    ],

    workingPrinciple: `**Thermal (Overload) Trip:**
Current flows through a bimetal strip — two metals with different expansion coefficients bonded together. When current exceeds the rated value, the I²R heating causes the bimetal to bend. At a preset deflection angle, it triggers the trip mechanism and opens the contacts. The time to trip is inversely proportional to the overload current — small overloads take minutes, larger overloads take seconds. This gives the inverse time characteristic.

**Magnetic (Instantaneous) Trip:**
An electromagnetic coil carries the load current. Under a short circuit, the sudden high current creates a strong magnetic field that attracts a plunger or armature, which immediately trips the mechanism open. This operates in < 20 ms (less than one AC cycle), providing fast fault clearance. The magnetic trip threshold defines the curve type (B, C, or D).

**Arc Extinction:**
When the contacts open under fault current, an arc forms. The MCB contact geometry forces the arc into an arc chute — a series of metal splitter plates that divide the arc into many short arcs in series. Each arc has its own anode-cathode drop (~20V), so the arc voltage quickly exceeds the system voltage and the arc extinguishes. The arc chute is the key to the MCB's breaking capacity.`,

    selectionGuide: [
      { parameter: 'Current rating (In)', guidance: 'Select MCB In ≥ design current of circuit. MCB In must be ≤ cable ampacity (Iz). For socket circuits: 16A MCB with 2.5mm² cable. For lighting: 10A MCB with 1.5mm² cable. For distribution feeders: select based on sub-board demand.' },
      { parameter: 'Tripping curve', guidance: 'Use curve B for sensitive electronics, resistive loads and lighting. Use curve C for most commercial and industrial circuits, small motors. Use curve D only for transformer primaries, large motor DOL starters, high-inrush equipment. When in doubt, start with curve C.' },
      { parameter: 'Breaking capacity', guidance: 'Calculate the prospective short-circuit current (Isc) at the MCB terminals. Use 6 kA MCBs where Isc < 6 kA (most residential and small commercial), 10 kA where 6 kA < Isc < 10 kA. For Isc > 10 kA, use MCCB or check upstream fuse current-limiting effect.' },
      { parameter: 'Number of poles', guidance: '1P for single-phase branch circuits. 2P for single-phase with switched neutral (TT systems). 3P for 3-phase circuits (neutral protected by separate device). 4P for 3-phase + neutral with all poles switched (required in some TN-S configurations and for main incoming).' },
      { parameter: 'Selectivity (discrimination)', guidance: 'Upstream MCB/MCCB must not trip for faults on downstream circuits. Ensure: upstream In ≥ 1.6× downstream In. For full selectivity, check that the upstream device does not enter its instantaneous trip zone for the maximum fault current cleared by the downstream device.' },
    ],

    applications: [
      'Residential distribution boards — protecting ring mains, lighting, kitchen circuits',
      'Commercial office buildings — protecting each office circuit, computer room feeders',
      'Industrial MCC auxiliary circuits — control supply, lighting, socket outlets',
      'DIN-rail distribution enclosures — protecting instrument power supplies, PLC power',
      'Data centre power distribution units (PDUs) — branch circuit protection',
      'Street lighting control panels — protecting outdoor lighting circuits',
    ],

    advantages: [
      'Resettable — can be reset after tripping without replacement',
      'Visible trip indication — handle position shows tripped state',
      'Consistent protection characteristics — no aging of fusible element',
      'Space efficient — multiple MCBs on standard DIN rail in compact distribution boards',
      'Can be manually switched — acts as isolator when off',
      'Wide range of accessories: auxiliary contacts, shunt trips, motor operators for remote operation',
    ],

    disadvantages: [
      'Limited breaking capacity (typically ≤ 10 kA) — not suitable where fault levels are high',
      'Fixed trip settings — cannot be adjusted (unlike MCCBs and electronic relays)',
      'Not current-limiting like fuses — let-through energy can be higher',
      'Mechanical wear accumulates with every operation',
      'Ambient temperature affects thermal trip point — MCBs derate at elevated temperatures',
    ],

    commonMistakes: [
      'Using curve C where curve D is needed — motor starting current trips the MCB',
      'Using curve D where curve B or C is needed — small faults take longer to clear, increasing damage',
      'Exceeding breaking capacity — MCB fails explosively on a high fault current',
      'Not accounting for temperature derating — MCBs derate at 35°C+ ambient (enclosed boards run hot)',
      'Overloading a board by adding circuits beyond the diversity-derated capacity',
    ],

    troubleshooting: [
      { symptom: 'MCB trips immediately on reset', causes: ['Persistent short-circuit fault', 'Ground fault on circuit', 'Faulty load connected'], remedy: 'Disconnect all loads. Measure insulation resistance to earth (>1 MΩ). Reconnect loads one at a time to identify the faulty load.' },
      { symptom: 'MCB trips after a delay (minutes)', causes: ['Circuit overloaded — too many loads', 'High ambient temperature in board', 'MCB contacts worn (higher contact resistance)'], remedy: 'Measure actual current with clamp meter. If > MCB rating, reduce load. Check board temperature. Replace MCB if contact resistance is high.' },
      { symptom: 'MCB trips on large motor start', causes: ['Curve B or C MCB cannot handle DOL motor inrush (6–8× FLC)', 'Motor start current duration exceeds MCB thermal withstand'], remedy: 'Replace with curve D MCB or size up to accommodate the locked rotor current. Check that the MCB still protects the cable — verify In ≤ cable Iz.' },
    ],

    standards: [
      { code: 'IEC 60898-1', title: 'Circuit-breakers for overcurrent protection in household and similar installations', clause: 'Clause 9 (Tripping characteristics)' },
      { code: 'IEC 60947-2', title: 'Circuit-breakers for industrial applications', clause: '' },
      { code: 'BS EN 60898', title: 'UK adoption of IEC 60898 — the standard for domestic MCBs in the UK', clause: '' },
      { code: 'IEC 60364-4-43', title: 'Protection against overcurrent', clause: 'Section 433 (Protection of conductors in parallel)' },
    ],

    faqs: [
      { question: 'Can I use a 16A MCB on a 1.5mm² cable?', answer: 'No. A 1.5mm² copper cable has an ampacity of approximately 14.5A in conduit. IEC 60364-4-43 requires that the MCB rated current (In) does not exceed the cable ampacity (Iz). Use a 10A MCB for 1.5mm² or upgrade to 2.5mm² cable for a 16A MCB.' },
      { question: 'Why does my MCB trip with curve C but not curve D for the same motor?', answer: 'The DOL starting current of a 3-phase motor is typically 6–8× FLC. A curve C MCB trips instantaneously at 5–10× In. If the starting current peak exceeds 5× MCB rating, the magnetic element trips. Curve D has an instantaneous threshold of 10–20× In — motor starting current stays below this threshold.' },
      { question: 'What is the difference between IEC 60898 and IEC 60947-2 MCBs?', answer: 'IEC 60898 MCBs are for household and similar installations — fixed trip characteristics, not adjustable, typically 6 kA or 10 kA breaking capacity. IEC 60947-2 MCBs are for industrial use — may have adjustable trip settings, higher breaking capacities (25 kA), and are compatible with accessories like shunt trips and motor operators.' },
    ],

    quiz: [
      { question: 'A 7.5 kW, 400V, 3-phase motor has an FLC of 15A. What MCB curve and rating provides correct protection for DOL starting?', options: ['B curve, 16A', 'C curve, 16A', 'D curve, 20A', 'C curve, 32A'], correctIndex: 2, explanation: 'Motor starting current ≈ 6-8× FLC = 90-120A. A 20A D-curve MCB has an instantaneous trip at 10-20× = 200-400A, safely above the starting current. A C-curve 16A trips at 80-160A, which may catch the starting current peak. Use D curve for DOL motors.' },
      { question: 'What is the purpose of the arc chute in an MCB?', options: ['Increase contact gap', 'Cool the bimetal strip', 'Divide and extinguish the arc by raising arc voltage', 'Prevent contact welding'], correctIndex: 2, explanation: 'The arc chute splits the arc into multiple short arcs in series. Each arc segment has its own cathode/anode voltage drop. The total arc voltage quickly exceeds the system voltage, quenching the arc. This is the mechanism that gives MCBs their breaking capacity.' },
    ],

    relatedCalculations: ['cable-current', 'short-circuit', 'mccb'],
    notes: [
      { type: 'tip', title: 'Quick curve selection guide', body: 'Lighting, sockets, electronics → Curve B. General distribution, small motors → Curve C. Large motors, transformers, high-inrush → Curve D. When in doubt, start with C and step up to D only if nuisance tripping occurs on commissioning.' },
      { type: 'warning', title: 'Breaking capacity vs fault level', body: 'Always check the prospective fault current at the MCB terminals. A standard 6 kA MCB in a system with 15 kA available fault current will fail explosively and dangerously. Use an upstream current-limiting fuse or upgrade to a higher-rated device.' },
    ],
  },
};

// ─── Complete Topic: Induction Motor ────────────────────────────────────────

const INDUCTION_MOTOR: Topic = {
  id: 'induction-motor',
  title: 'Three-Phase Induction Motor',
  category: 'Motors & Drives',
  categoryId: 'motors',
  icon: '⚙️',
  difficulty: 'intermediate',
  readingTime: 18,
  tags: ['induction motor', 'squirrel cage', 'slip', 'torque-speed', 'IEC 60034', 'efficiency class'],
  status: 'complete',
  content: {
    introduction: `The three-phase induction motor is the workhorse of industry — responsible for approximately 70% of all industrial electricity consumption globally. Its simplicity, robustness and reliability make it the default choice for pumps, fans, compressors, conveyors, and virtually every rotating machine application.

The operating principle is electromagnetic induction: a rotating magnetic field in the stator induces currents in the short-circuited rotor bars, which in turn creates forces that rotate the rotor. The rotor always rotates slightly slower than the field — this difference is called slip. The motor produces torque only because of this slip.

Key parameters that define an induction motor: rated power (kW), rated voltage (V), rated frequency (Hz), rated speed (rpm), power factor (cos φ), efficiency (η), and efficiency class (IE1–IE4 under IEC 60034-30).`,

    keyFacts: [
      'Synchronous speed = 120 × frequency / number of poles (e.g., 4-pole, 50 Hz → 1500 rpm synchronous)',
      'Slip at full load: typically 2–8% for squirrel cage motors (rotor speed = synchronous speed × (1-slip))',
      'Starting current (DOL): typically 6–8× FLC; starting torque: typically 1.5–2.5× rated torque',
      'Efficiency class: IE1 (standard), IE2 (high), IE3 (premium), IE4 (super premium) per IEC 60034-30',
      'IE3 is now mandatory for motors >0.75 kW in many countries (EU, India) unless fitted with VFD',
      'Power factor at full load: typically 0.80–0.92 lagging; at light load, PF drops significantly',
      'NEMA/IEC design class determines starting torque, starting current and breakdown torque characteristics',
    ],

    types: [
      { name: 'Squirrel Cage (SCIM)', description: 'The most common type. Rotor bars are short-circuited aluminum or copper bars in a laminated steel core — no external connections to rotor. Simple, rugged, low maintenance.', when: 'Default choice for nearly all industrial applications. Direct-on-line (DOL), star-delta or VFD starting. Use for pumps, fans, compressors, conveyors.' },
      { name: 'Wound Rotor (SRIM)', description: 'Rotor has a 3-phase winding connected to external resistors via slip rings. External rotor resistance can be varied to control starting torque and speed.', when: 'High inertia loads requiring high starting torque with controlled acceleration. Cranes, hoists, ball mills. Less common now — largely replaced by VFD + squirrel cage motor.' },
      { name: 'Deep Bar / Double Cage', description: 'Special squirrel cage design with high starting torque due to skin effect in deep rotor bars. Better than standard squirrel cage for high-inertia loads.', when: 'DOL starting of high-inertia loads (fans, compressors, centrifuges) where standard squirrel cage has insufficient starting torque.' },
      { name: 'TEFC (Totally Enclosed Fan Cooled)', description: 'Motor enclosure is sealed — no ventilation openings. An external fan on the shaft provides cooling. Standard industrial enclosure.', when: 'Default for industrial environments. Suitable for dusty, damp and outdoor locations. IP54 or IP55 as standard.' },
      { name: 'ATEX / Ex-rated Motor', description: 'Special construction to prevent ignition of explosive atmospheres. Different protection concepts: Ex d (flameproof), Ex e (increased safety), Ex n (non-sparking).', when: 'Hazardous area classification requires Ex-rated equipment. Oil refineries, chemical plants, grain silos, paint booths. Zone/division classification determines which Ex type is required.' },
    ],

    construction: `**Stator:**
The stator consists of a laminated silicon steel core with slots that hold the 3-phase winding. Laminations (0.3–0.5mm thick) reduce eddy current losses. The winding is typically a distributed winding connected in star (Y) or delta (Δ). The stator is housed in a cast iron or aluminum frame with cooling fins.

**Rotor (Squirrel Cage):**
A laminated steel core with aluminum or copper bars cast into slots. End rings short-circuit all the bars at each end, forming the "squirrel cage". The bars are slightly skewed (twisted) relative to the shaft axis to reduce torque pulsations and improve starting. The cage has no external connections — this is what makes the SCIM so robust and maintenance-free.

**Bearings:**
Deep groove ball bearings (most common) or cylindrical roller bearings for heavy radial loads. Bearing housings on drive end (DE) and non-drive end (NDE). Lubrication: grease-packed sealed bearings (maintenance-free up to 20,000 hours) or re-greaseable bearings for large motors.

**Cooling:**
TEFC motors have an external fan on the shaft that forces air over the fins. At low speed (VFD operation below 25 Hz), the internal fan is ineffective — a separately powered auxiliary fan is needed for continuous operation at low speed.`,

    workingPrinciple: `**Rotating Magnetic Field:**
The three-phase stator winding carries balanced 3-phase currents (120° apart). These create a rotating magnetic field that sweeps around the stator bore at synchronous speed (Ns = 120f/p rpm). This is the fundamental phenomenon that makes the induction motor work.

**Electromagnetic Induction:**
The rotating field cuts the stationary rotor bars and induces voltages in them (by transformer action). Since the rotor bars are short-circuited, large currents flow. The interaction of these currents with the rotating field produces a torque on the rotor (Lenz's law — the induced current tries to oppose the change causing it, so the rotor is "pulled" in the direction of the field).

**Slip:**
As the rotor accelerates, the relative velocity between the field and the rotor decreases. The induced rotor EMF and current decrease, reducing torque. At no-load, slip is very small (0.1–0.5%) — just enough to produce the torque to overcome friction and windage. At full load, slip is typically 2–8%. At synchronous speed, there is zero slip, zero induced EMF, zero current, and zero torque — the motor cannot operate at synchronous speed.

**Torque-Speed Characteristic:**
Starting (0 rpm): slip = 1, low torque (high rotor reactance dominates). Accelerating zone: torque increases as speed increases. Breakdown (maximum torque): peak torque, typically at 80–90% synchronous speed. Normal operating zone: nearly linear — torque proportional to slip. The rated operating point is on the steep portion of the curve near synchronous speed.`,

    selectionGuide: [
      { parameter: 'Power rating (kW)', guidance: 'Use P = T×ω/1000 for mechanical applications, or P = flow × head / (η_pump × η_motor) for pumps. Add a service factor of 1.15–1.25 for heavy or variable duty. Never size with zero margin — motor efficiency drops dramatically below 50% load.' },
      { parameter: 'Speed (rpm / number of poles)', guidance: '2-pole = 3000 rpm (50Hz) / 3600 rpm (60Hz). 4-pole = 1500/1800 rpm. 6-pole = 1000/1200 rpm. 8-pole = 750/900 rpm. Match motor speed to the required mechanical speed to avoid unnecessary gearboxes. High-speed motors are smaller and cheaper for the same power.' },
      { parameter: 'Voltage rating', guidance: 'LV motors: 400V (3-phase) standard for motors up to 500 kW. 690V for larger motors (smaller current, smaller cables). MV motors (3.3 kV, 6.6 kV, 11 kV) for motors > 500 kW where LV current would be prohibitively high.' },
      { parameter: 'Efficiency class', guidance: 'Select IE3 or IE4 for continuously-operated motors >0.75 kW. IE3 pays back through energy savings within 2–3 years in most applications. Exception: IE2 is permitted if the motor is used with a VFD. Never use IE1 — now prohibited in most markets.' },
      { parameter: 'Enclosure (IP rating)', guidance: 'IP23 (open drip-proof): clean, dry indoor only. IP44/54: dusty or damp locations. IP55: outdoor with protection from water jets. IP65: complete dust-tight. IP68: submersible. Always specify higher IP than needed — cleaning a contaminated motor is expensive.' },
      { parameter: 'Insulation class', guidance: 'Class F insulation (155°C) is standard. Class H (180°C) for VFD operation (high dV/dt stresses) and hot environments. Always confirm class with the motor manufacturer when specifying VFD duty.' },
    ],

    applications: [
      'Pumps — the largest single application globally (water supply, HVAC, process)',
      'Fans and blowers — HVAC, combustion air, industrial ventilation',
      'Compressors — refrigeration, pneumatic tools, gas compression',
      'Conveyors and material handling — aggregate, mining, food processing',
      'Machine tools — lathes, milling machines, grinding machines',
      'Cranes and hoists — overhead cranes, elevator drives',
      'Mixers and agitators — chemical, food, pharmaceutical',
    ],

    advantages: [
      'Robust and reliable — squirrel cage rotor has no brushes, slip rings or commutator',
      'Low maintenance — only bearings require periodic service',
      'Self-starting — applies torque from standstill (unlike synchronous motors)',
      'Low cost — most mass-produced electrical machine',
      'Wide range of powers (0.1 kW to 15 MW) and speeds',
      'High efficiency at rated load (IE3: >90% for motors >5.5 kW)',
    ],

    disadvantages: [
      'Fixed speed when connected to fixed-frequency supply (without VFD)',
      'High starting current (6–8× FLC) for DOL starting — voltage dip and mechanical shock',
      'Poor power factor at light load (< 0.6 lagging) — requires reactive compensation',
      'Cannot operate at synchronous speed (always has slip)',
      'Speed regulation by voltage reduction is very inefficient',
    ],

    safety: [
      'Always lock-out before working on motor or driven machine — stored energy in rotating parts',
      'Check motor terminal box for LIVE voltage before touching — VFD-driven motors can have stored charge on capacitors for minutes after power removal',
      'Verify motor rotation direction before coupling to driven machine to prevent damage',
      'Never run motor with terminal box open — arc flash hazard if fault occurs',
      'ATEX motors: only qualified Ex-rated technicians should repair or modify Ex motors',
    ],

    standards: [
      { code: 'IEC 60034-1', title: 'Rotating electrical machines — Rating and performance', clause: '' },
      { code: 'IEC 60034-30-1', title: 'Efficiency classes of line-operated AC motors (IE code)', clause: '' },
      { code: 'IEC 60034-14', title: 'Mechanical vibration of machines', clause: '' },
      { code: 'NEMA MG1', title: 'Motors and Generators (North American standard)', clause: '' },
    ],

    quiz: [
      { question: 'A 4-pole induction motor operates on a 50 Hz supply. At full load the speed is 1440 rpm. What is the slip?', options: ['0.02 (2%)', '0.04 (4%)', '0.06 (6%)', '0.08 (8%)'], correctIndex: 1, explanation: 'Synchronous speed Ns = 120 × 50 / 4 = 1500 rpm. Slip s = (Ns - Nr)/Ns = (1500 - 1440)/1500 = 60/1500 = 0.04 = 4%.' },
      { question: 'An induction motor has efficiency IE3 class (η=92%) and rated power 15 kW. What is the input electrical power?', options: ['13.8 kW', '15 kW', '16.3 kW', '17.1 kW'], correctIndex: 2, explanation: 'Input = Output / η = 15 / 0.92 = 16.3 kW. The motor draws 16.3 kW from the supply but delivers only 15 kW mechanical — 1.3 kW is lost as heat in the windings, core and friction.' },
    ],

    relatedCalculations: ['motor', 'cable-current', 'olr'],
    notes: [
      { type: 'tip', title: 'Service Factor vs Motor Size', body: 'A service factor (SF) of 1.15 on the motor nameplate means it can operate at 1.15× rated power for short periods without damage. This is NOT a design margin to be permanently used — operating at SF continuously shortens insulation life. Use a larger motor instead.' },
      { type: 'warning', title: 'VFD operation: use inverter-duty motors', body: 'Standard motors operated from a VFD experience additional stresses: high dV/dt voltage spikes (up to 2× DC bus voltage at motor terminals), increased bearing currents from common-mode voltages, and reduced cooling at low speed. Always specify inverter-duty motors (reinforced insulation, Class F or H, insulated bearings) for VFD applications.' },
    ],
  },
};

// ─── Complete Topic: VFD ─────────────────────────────────────────────────────

const VFD: Topic = {
  id: 'vfd',
  title: 'Variable Frequency Drive (VFD)',
  category: 'Motors & Drives',
  categoryId: 'motors',
  icon: '🔄',
  difficulty: 'advanced',
  readingTime: 20,
  tags: ['VFD', 'variable speed drive', 'IGBT', 'PWM', 'harmonics', 'energy saving'],
  status: 'complete',
  content: {
    introduction: `A Variable Frequency Drive (VFD) — also known as an inverter, variable speed drive (VSD) or adjustable speed drive (ASD) — converts fixed-frequency AC power into variable-frequency, variable-voltage AC output to control motor speed. By varying the frequency, the VFD directly controls the synchronous speed and hence the actual speed of the motor.

The primary energy-saving benefit of a VFD comes from the affinity laws for centrifugal machines: for a fan or pump, power is proportional to the cube of speed. Reducing speed to 80% reduces power to 51% — a 49% saving. This makes VFDs one of the most cost-effective energy efficiency investments in industry.

A VFD consists of three stages: (1) AC-DC rectifier, (2) DC link with filter capacitors, (3) DC-AC inverter using IGBTs switching at 2–16 kHz. The output waveform is a pulse-width modulated (PWM) approximation of a sinusoid.`,

    keyFacts: [
      'Affinity laws: Flow ∝ speed, Pressure ∝ speed², Power ∝ speed³ — small speed reductions save large amounts of energy',
      'IGBTs switch at 2–16 kHz — higher switching frequency = smoother output but more IGBT losses',
      'VFD input current contains significant harmonics (5th, 7th, 11th, 13th orders) that cause distortion',
      'V/f (volts per hertz) control is the simplest; vector control (FOC) gives high dynamic performance',
      'VFDs provide controlled acceleration and deceleration — eliminates motor starting current surge',
      'Common mode voltages from VFD cause bearing current damage — insulated bearings required for large motors',
      'Line reactor (3–5% impedance) reduces harmonics and protects VFD from utility voltage transients',
    ],

    types: [
      { name: 'V/f (Scalar) Control', description: 'Maintains a constant V/f ratio throughout the speed range. Simple, reliable, no feedback required. Limited performance at low speed and under dynamic load changes.', when: 'Fans, pumps, centrifugal compressors — quadratic V/f profile. Simple applications where speed accuracy is ±1–2% and dynamic performance is not critical.' },
      { name: 'Sensorless Vector (Open Loop FOC)', description: 'Motor model embedded in VFD estimates rotor flux and controls torque and flux independently. Better low-speed performance than V/f, no encoder required.', when: 'Conveyors, mixers, extruders where moderate dynamic performance is needed without the cost and complexity of an encoder. Speed accuracy ±0.5%.' },
      { name: 'Closed Loop Vector (with Encoder)', description: 'Encoder feedback provides exact rotor position for maximum dynamic performance. Fastest torque response, highest speed accuracy, can operate at zero speed with full torque.', when: 'Cranes, hoists, elevators, winders — applications requiring precise speed/position control, holding torque at zero speed, or very fast torque response.' },
      { name: 'Active Front End (AFE)', description: 'Replaces the passive diode rectifier with an IGBT bridge. Provides unity power factor at input, bidirectional power flow (regenerative braking), and significantly reduced input harmonics (< 5% THD).', when: 'Large drives where regenerative energy should be returned to the grid (cranes, elevators, test benches) or where harmonics must be minimized without separate filters.' },
    ],

    selectionGuide: [
      { parameter: 'Power rating', guidance: 'Select VFD power rating ≥ motor rated power. For high inertia or high duty cycle applications, use VFD 1 frame size larger than the motor rating. Continuous torque at low speed requires derating of both motor and VFD.' },
      { parameter: 'Input voltage', guidance: 'Match to supply voltage. Standard: 400V 3-phase (±10%). 690V drives for large industrial motors. Single-phase input drives available for small VFDs (< 3 kW) but output is always 3-phase.' },
      { parameter: 'Overload capacity', guidance: 'Standard (Normal Duty): 110% for 60s. Heavy Duty: 150% for 60s. Select Heavy Duty for high-inertia loads (fans, compressors) or applications with frequent acceleration.' },
      { parameter: 'Protection rating', guidance: 'IP20 for panel-mounted (MCC or VFD panel). IP55 for wall-mounted outdoors. Standalone outdoor drives: IP66. Consider cooling requirements — drives dissipate 2–3% of motor power as heat; backplates require cooling airflow.' },
      { parameter: 'Line reactor vs choke', guidance: 'Always install a 2–5% line reactor on the VFD input. Reduces harmonic current (reduces THDI from 90% to 35–40%), protects VFD from voltage spikes, and prevents capacitor bank resonance. Essential, not optional.' },
      { parameter: 'Motor compatibility', guidance: 'Use inverter-duty motors (reinforced insulation, Class F or H). For motors > 7.5 kW with cable runs > 50m, use a dV/dt filter or sine filter on the output to protect motor insulation from high-frequency voltage spikes.' },
    ],

    applications: [
      'Pumps — most common VFD application. Speed control saves 30–70% energy vs throttling valves',
      'Fans and air handling units — HVAC supply and return air flow control',
      'Compressors — air compressor capacity control, refrigeration compressors',
      'Conveyors — adjustable speed for production line synchronization',
      'Mixers and agitators — soft start and variable mixing speed',
      'Cranes and hoists — precise speed control with regenerative braking',
      'CNC machine tool spindles — spindle speed control',
    ],

    commonMistakes: [
      'Not installing a line reactor — causes harmonic distortion and risk of VFD input bridge failure from notching',
      'Using standard motor without inverter-duty rating — insulation premature failure from dV/dt spikes',
      'Not sizing motor thermally for low-speed operation — internal fan is ineffective below 20 Hz',
      'Setting minimum speed too low — motor runs continuously at low efficiency when process demand is zero (use a sleep function instead)',
      'Bypassing VFD with a direct-on-line bypass without checking compatibility with the load and motor',
    ],

    troubleshooting: [
      { symptom: 'VFD trips on overcurrent (OC) at startup', causes: ['Acceleration time too short for the load inertia', 'Motor stalled or mechanical jam', 'Current limit set too low'], remedy: 'Increase acceleration ramp time (A-ramp). Check that the motor shaft and driven machine turn freely. Set current limit to 150% of motor FLC.' },
      { symptom: 'Motor vibrates or makes noise at certain speeds', causes: ['Resonance at a natural frequency of the mechanical system', 'Damaged motor bearings', 'V/f ratio incorrect'], remedy: 'Program a "skip frequency" band (±3 Hz) around the resonant frequency to prevent continuous operation there. Check bearings.' },
      { symptom: 'VFD trips on DC bus overvoltage during deceleration', causes: ['Deceleration time too short — braking energy cannot dissipate', 'No braking resistor fitted'], remedy: 'Increase deceleration ramp time. Or fit a braking resistor (dynamic braking) to absorb the regenerated energy. For large motors: use AFE drive for energy recovery.' },
    ],

    safety: [
      'Wait 5–10 minutes after switching off before opening VFD — DC bus capacitors remain charged at > 600V DC',
      'Test for voltage with a CAT III voltmeter at the DC bus test points before touching internal components',
      'Always fit a disconnect switch upstream of the VFD — the VFD does not provide safe isolation on its own',
      'Motor cables must be shielded (screened) and the shield grounded at both ends to prevent EMI radiation',
      'Ground the VFD enclosure and motor frame to equipotential bonding to prevent common-mode voltages',
    ],

    standards: [
      { code: 'IEC 61800-3', title: 'Adjustable speed electrical power drive systems — EMC requirements', clause: '' },
      { code: 'IEC 61800-5-1', title: 'Safety requirements — Electrical, thermal and energy', clause: '' },
      { code: 'IEC 61000-3-12', title: 'Limits for harmonic currents produced by equipment > 16A per phase', clause: '' },
    ],

    quiz: [
      { question: 'A pump motor runs at 50 Hz drawing 100 kW. If speed is reduced to 40 Hz (80% speed) using a VFD, what is the approximate new power consumption?', options: ['80 kW', '64 kW', '51 kW', '40 kW'], correctIndex: 2, explanation: 'By the affinity laws: Power ∝ speed³. New power = 100 × (40/50)³ = 100 × (0.8)³ = 100 × 0.512 = 51.2 kW. This is the key energy-saving benefit of VFDs on centrifugal machines.' },
    ],

    relatedCalculations: ['motor', 'cable-current', 'harmonic'],
    notes: [
      { type: 'tip', title: 'Simple energy payback calculation', body: 'For a pump running 8,000 hr/year at 50% load with a VFD: Power at full speed = P_rated. Power at 50% flow = P_rated × (0.5)³ = 12.5% of rated. Annual energy saving = P_rated × (1 - 0.125) × 8000 / 1000 kWh. At £0.12/kWh, even a 30 kW pump pays back a £3,000 VFD in less than 6 months.' },
      { type: 'warning', title: 'Harmonic distortion can damage other equipment', body: 'VFD drives inject 5th, 7th, 11th and 13th harmonic currents into the supply network. On a "weak" supply (high source impedance), this causes voltage distortion (THDv > 8%) that can damage capacitor banks, misoperate electronics and cause overheating of transformers. Always calculate harmonic impact and specify line reactors or harmonic filters.' },
    ],
  },
};

// ─── Complete Topic: Contactor ───────────────────────────────────────────────

const CONTACTOR: Topic = {
  id: 'contactor',
  title: 'Contactor',
  category: 'Protection Devices',
  categoryId: 'protection',
  icon: '🔌',
  difficulty: 'beginner',
  readingTime: 10,
  tags: ['contactor', 'AC1', 'AC3', 'utilization category', 'IEC 60947-4-1', 'motor switching'],
  status: 'complete',
  content: {
    introduction: `A contactor is an electrically operated switch used for switching power circuits — primarily motor loads. It is designed for frequent operation (millions of operations over its life) and is controlled by a low-power coil signal. Unlike a circuit breaker, a contactor does NOT provide overcurrent protection — it must be used in combination with a fuse or circuit breaker and an overload relay for complete motor protection.

The key characteristic of a contactor is its utilization category (AC1, AC2, AC3, AC4) which defines the switching duty the contacts must handle. An AC3 contactor for squirrel cage motors switches the full starting current (6–8× FLC) when switching motors — the contacts must withstand this duty for the rated number of operations.

Contactors are selected by: utilization category, rated operational current (Ie), rated voltage (Ue), coil voltage, and required number of auxiliary contacts (NO/NC).`,

    keyFacts: [
      'AC3 category: rated for switching squirrel cage motors — breaks up to 8× Ie at rated voltage',
      'AC4 category: rated for jogging and plugging — breaks up to 10× Ie (very severe duty)',
      'Contactor coil consumes 15–100 VA during pick-up, reducing to 5–10 VA holding (AC coils have transient inrush)',
      'Electronic coil modules (ES devices) reduce power consumption by 80% and enable 24VDC coil operation',
      'Mechanical interlocking of forward/reverse contactors prevents phase-to-phase short circuit',
      'Contactor thermal rating in AC3 category is typically 3× the AC1 rating (motor switching heats contacts more)',
      'Life expectancy: typically 1–3 million mechanical operations; AC3 electrical life: 0.5–1 million operations',
    ],

    types: [
      { name: 'Standard AC Contactor (AC1, AC3)', description: 'Electromagnetic contactor with AC coil. Standard for most motor switching applications. Available from 9A to 2500A.', when: 'Default choice for motor starting, stopping and reversing in standard industrial environments.' },
      { name: 'DC Contactor', description: 'Designed for DC load switching. Contacts have permanent magnets to blow out the arc. Different construction from AC contactors.', when: 'Battery systems, DC drives, traction systems, any DC load switching application.' },
      { name: 'Capacitor Switching Contactor (AC6b)', description: 'Special contactor with pre-charge resistors to limit the very high inrush current when energizing capacitor banks (can be 30–100× Ie).', when: 'Automatic power factor correction (APFC) panels. Never use a standard AC3 contactor to switch capacitor banks — the inrush destroys the contacts.' },
      { name: 'Reversing Contactor Pair', description: 'Two contactors with mechanical and electrical interlocking. Switching between contactors reverses two phases, reversing motor direction.', when: 'Reversible motor drives, forward/reverse conveyors, cranes, machine tools.' },
      { name: 'Soft Starter with Bypass Contactor', description: 'The soft starter controls starting; after acceleration, a bypass contactor closes to put the motor direct-on-line, reducing soft starter losses.', when: 'Applications where continuous VFD is not required but smooth starting is needed (pumps, fans with >5 starts/day).' },
    ],

    selectionGuide: [
      { parameter: 'Utilization category', guidance: 'AC1: resistive or slightly inductive loads (heating, incandescent lighting). AC2: wound rotor motors. AC3: squirrel cage motors (most common). AC4: plugging or jogging duty (very demanding). Select AC3 for most motor applications. Use AC4 only if jogging is required.' },
      { parameter: 'Rated operational current (Ie)', guidance: 'Select Ie ≥ motor FLC for AC3 category. Note: Ie in AC3 ≈ 40–50% of Ie in AC1 category — a 25A AC1 contactor may only be rated 9A in AC3. Always check the AC3 rating column in the catalogue, not the AC1 rating.' },
      { parameter: 'Coil voltage', guidance: 'Match coil voltage to the control circuit voltage. Common: 230V AC (from lighting circuit), 110V AC (US and safe-extra-low-voltage control), 24V DC (PLC output compatibility). DC coil is preferred for PLC-controlled systems — instantaneous response without transient inrush.' },
      { parameter: 'Auxiliary contacts', guidance: 'Standard: 1 NO + 1 NC auxiliary. Additional auxiliary contacts or mirror contacts for interlocking, feedback signals and PLC inputs. Mirror contact is essential for safety interlocking — it reflects the main contact state rather than the coil state.' },
      { parameter: 'Number of main poles', guidance: '3-pole for 3-phase loads (most common). 4-pole for loads where neutral must be switched. 2-pole for single-phase loads. For star-delta starters: 3 contactors are needed (main + star + delta).' },
    ],

    applications: [
      'Motor starting and stopping — direct-on-line (DOL) starters',
      'Star-delta motor starters — 3 contactors for reduced voltage starting',
      'Reversing drives — forward/reverse pairs for cranes, conveyors',
      'Lighting control — switching high-power lighting circuits (use AC1 rated)',
      'Capacitor bank switching — special AC6b contactors for APFC panels',
      'Heating element control — cooking, industrial furnaces, ovens',
    ],

    troubleshooting: [
      { symptom: 'Contactor coil burns out repeatedly', causes: ['Coil voltage too high or too low', 'Contactor not fully pulling in (mechanical jam)', 'Incorrect duty cycle — too many operations per hour'], remedy: 'Measure coil voltage with contactor operated. Should be within ±10% of rated. Check mechanism is not sticking. Check catalogue for maximum operations/hour.' },
      { symptom: 'Contactor chatters (vibrates/buzzes)', causes: ['AC coil — shading ring damaged', 'Coil voltage too low to maintain hold-in', 'Control circuit voltage instability'], remedy: 'Inspect shading ring on pole faces — replace if cracked. Measure coil voltage during chattering. Switch to DC coil for stable operation.' },
      { symptom: 'Contacts welded closed', causes: ['Short circuit through contactor (very high current)', 'Overload caused the motor to stall — high sustained current', 'Wrong utilization category — AC1 contactor on AC3 duty'], remedy: 'Check upstream fuse/MCCB operated correctly. Verify correct AC3 rated contactor for motor duty. Replace contactor — never attempt to manually separate welded contacts.' },
    ],

    standards: [
      { code: 'IEC 60947-4-1', title: 'Contactors and motor-starters — Electromechanical contactors and motor-starters', clause: 'Clause 7 (Utilization categories)' },
      { code: 'IEC 60947-1', title: 'General rules for low-voltage switchgear and controlgear', clause: '' },
    ],

    quiz: [
      { question: 'A 22 kW, 400V motor has an FLC of 44A. For AC3 duty, what minimum contactor Ie (AC3) is required?', options: ['40A (AC1)', '44A (AC3)', '50A (AC3)', '63A (AC3)'], correctIndex: 1, explanation: 'The contactor Ie in AC3 must be ≥ the motor FLC = 44A. Select the next standard size ≥ 44A in AC3 category — this would be a contactor rated 50A AC3 (or exactly 44A if available). Never use the AC1 rating to size a contactor for motor duty.' },
    ],

    relatedCalculations: ['motor', 'olr', 'mccb'],
    notes: [
      { type: 'warning', title: 'AC1 vs AC3 rating confusion', body: 'A catalogue may show a contactor as "25A" which is its AC1 (resistive) rating. For AC3 (motor) duty, the same contactor may only be rated 9A or 12A. Always look up the AC3 column specifically for motor applications. Using an AC1-rated device on AC3 duty results in premature contact erosion.' },
      { type: 'tip', title: 'Electrical interlock is not enough — use mechanical interlock too', body: 'In a reversing starter, the forward and reverse contactors must never close simultaneously (phase-to-phase short circuit). Electrical interlock through the auxiliary NC contacts is essential. But also add a mechanical interlock (direct coupled) as a failsafe for the case where both coils are energized simultaneously.' },
    ],
  },
};

// ─── Stub helper ─────────────────────────────────────────────────────────────

const stub = (
  id: string, title: string, categoryId: string, category: string,
  icon: string, difficulty: Topic['difficulty'], readingTime: number,
  tags: string[], intro: string, relatedTopics: string[],
): Topic => ({
  id, title, category, categoryId, icon, difficulty, readingTime, tags,
  status: 'coming-soon', intro, relatedTopics,
});

// ─── All Topics ──────────────────────────────────────────────────────────────

export const ALL_TOPICS: Topic[] = [
  // ── Protection Devices ──────────────────────────────────────────────────────
  FUSE,
  MCB,
  CONTACTOR,
  stub('mccb',       'MCCB (Moulded Case Circuit Breaker)',   'protection', 'Protection Devices', '⚡', 'intermediate', 15, ['MCCB','IEC 60947-2','thermal-magnetic','Icu','selectivity'], 'Moulded Case Circuit Breakers provide overcurrent and short-circuit protection for main feeders, distribution boards and motor circuits up to 1600A with adjustable trip settings.', ['mcb','fuse','short-circuit']),
  stub('rccb',       'RCCB / RCBO (Residual Current Device)', 'protection', 'Protection Devices', '🛡️', 'beginner',     10, ['RCCB','earth fault','RCD','IEC 61008','30mA','300mA'], 'Residual Current Circuit Breakers detect earth fault currents as low as 30mA and trip within 30ms, providing life protection against electric shock.', ['mcb','earthing']),
  stub('acb',        'Air Circuit Breaker (ACB)',              'protection', 'Protection Devices', '⚡', 'advanced',     18, ['ACB','draw-out','electronic trip','IEC 60947-2','zone selectivity'], 'Air Circuit Breakers are the main incoming and bus coupler devices in LV switchboards, offering fully electronic adjustable protection with zone selectivity.', ['mccb','busbar','short-circuit']),
  stub('vcb',        'Vacuum Circuit Breaker (VCB)',           'protection', 'Protection Devices', '🔧', 'advanced',     18, ['VCB','medium voltage','vacuum interrupter','IEC 62271-100'], 'Vacuum Circuit Breakers use a vacuum interrupter to extinguish the arc — the dominant technology for medium voltage (6.6–36 kV) switchgear.', ['sf6-breaker','transformer','short-circuit']),
  stub('sf6-breaker','SF6 Circuit Breaker',                   'protection', 'Protection Devices', '🌡️', 'advanced',     16, ['SF6','GIS','IEC 62271','high voltage','arc quenching'], 'SF6 Circuit Breakers use sulphur hexafluoride gas as both insulation and arc-quenching medium, dominant in HV (33 kV–800 kV) transmission switchgear.', ['vcb','acb']),
  stub('olr',        'Thermal Overload Relay (OLR)',           'protection', 'Protection Devices', '🌡️', 'beginner',     10, ['OLR','bimetal','trip class','IEC 60947-4-1','Ie'], 'Thermal Overload Relays protect motors from sustained overload by sensing motor current and tripping when the thermal image exceeds the trip threshold.', ['contactor','motor','mccb']),
  stub('protection-relay','Electronic Protection Relay',      'protection', 'Protection Devices', '📡', 'advanced',     20, ['relay','IDMT','IEC 60255','overcurrent','differential'], 'Numerical protection relays provide sophisticated protection functions (overcurrent, earth fault, differential, distance) with setting flexibility and event recording.', ['ct','acb','vcb']),
  stub('spd',        'Surge Protection Device (SPD)',          'protection', 'Protection Devices', '⚡', 'intermediate', 10, ['SPD','surge arrestor','IEC 61643-11','lightning','MOV'], 'Surge Protection Devices clamp transient overvoltages caused by lightning and switching to safe levels, protecting equipment connected to the supply.', ['earthing','lightning-protection']),
  stub('isolator',   'Isolator / Disconnect Switch',           'protection', 'Protection Devices', '🔌', 'beginner',     8,  ['isolator','disconnect','IEC 60947-3','safe isolation','LOTO'], 'Isolators provide visible open-circuit isolation of circuits for safe maintenance — they must NOT interrupt load current on their own (no arc interruption capability).', ['acb','mccb']),

  // ── Cables & Wiring ─────────────────────────────────────────────────────────
  stub('xlpe-cable',    'XLPE Power Cable',          'cables', 'Cables & Wiring', '🔌', 'intermediate', 15, ['XLPE','cross-linked polyethylene','IEC 60502','cable rating','ampacity'], 'XLPE insulated power cables are the standard for medium and high voltage underground distribution (1 kV to 132 kV), offering high thermal rating, moisture resistance and long service life.', ['cable-sizing','cable-gland','voltage-drop']),
  stub('pvc-cable',     'PVC Insulated Cable',       'cables', 'Cables & Wiring', '🔌', 'beginner',     12, ['PVC','IEC 60227','LV wiring','flat cable','twin & earth'], 'PVC insulated cables are the most widely used type for fixed LV wiring in buildings and light industrial applications, rated to 70°C conductor temperature.', ['cable-sizing','mcb']),
  stub('armoured-cable','Armoured Cable (SWA/AWA)',  'cables', 'Cables & Wiring', '⚙️', 'intermediate', 12, ['SWA','armoured','steel wire armour','IEC 60502','underground'], 'Steel Wire Armoured cables provide mechanical protection for underground and outdoor exposed installations. The armour also provides the circuit protective conductor in many installations.', ['cable-sizing','cable-gland','earthing']),
  stub('flexible-cable','Flexible Cable & Cord',     'cables', 'Cables & Wiring', '🔌', 'beginner',     8,  ['flex','rubber cable','trailing cable','H07RN-F','IEC 60245'], 'Flexible cables and cords are used for connecting portable equipment, machine tools and applications requiring frequent movement. Rubber insulated types are used in harsh environments.', ['cable-sizing']),
  stub('bus-duct',      'Busbar Trunking (Busway)',  'cables', 'Cables & Wiring', '📦', 'intermediate', 14, ['busbar trunking','busway','IEC 61439-6','sandwich busbar','current capacity'], 'Busbar trunking systems carry high currents (400A–6300A) between transformers, generators and switchboards over short distances with lower losses than equivalent cables.', ['busbar','cable-sizing','transformer']),
  stub('cable-tray',    'Cable Tray & Ladder',       'cables', 'Cables & Wiring', '🏗️', 'beginner',     10, ['cable tray','cable ladder','IEC 61537','fill factor','EMC'], 'Cable trays and ladders support cables in industrial plants and commercial buildings. Selection considers load capacity, fill factor, separation requirements and EMC considerations.', ['cable-sizing','cable-gland']),
  stub('cable-gland',   'Cable Gland Selection',     'cables', 'Cables & Wiring', '🔩', 'beginner',     8,  ['cable gland','IP rating','EMC gland','ATEX gland','armour clamp'], 'Cable glands provide cable entry sealing, strain relief and EMC screening at enclosures. Selection depends on cable type, enclosure IP requirement and hazardous area classification.', ['armoured-cable','atex']),
  stub('termination',   'Cable Termination & Jointing','cables','Cables & Wiring','🔧', 'intermediate', 12, ['MV termination','heat shrink','cold shrink','stress cone','IEC 60502-4'], 'Cable termination and jointing require careful preparation of XLPE cables to control electrical stress at the insulation screen cutback point using stress control materials.', ['xlpe-cable','cable-gland']),
  stub('overhead-line', 'Overhead Conductor (ACSR)', 'cables', 'Cables & Wiring', '🔌', 'intermediate', 12, ['ACSR','AAAC','overhead line','conductor sag','IEC 61089'], 'Overhead conductors (ACSR, AAAC) transmit power on overhead lines from 11 kV to 765 kV. Selection balances current rating, mechanical strength and conductor sag.', ['cable-sizing','voltage-drop']),
  stub('conduit',       'Conduit Systems',           'cables', 'Cables & Wiring', '🔧', 'beginner',     8,  ['conduit','trunking','IEC 61386','fill factor','wiring method'], 'Conduit systems protect wiring in buildings and industrial installations. PVC conduit for indoor, galvanised steel for industrial, flexible conduit for machine connections.', ['cable-sizing','cable-tray']),
  stub('fire-cable',    'Fire Resistant Cable',      'cables', 'Cables & Wiring', '🔥', 'intermediate', 10, ['fire cable','circuit integrity','BS 8519','FP200','MICC'], 'Fire resistant cables maintain circuit integrity during a fire for a defined duration (30, 60, 90 or 120 minutes) to power escape lighting, fire alarms and smoke control.', ['pvc-cable','cable-sizing']),
  stub('data-cable',    'Data & Control Cable',      'cables', 'Cables & Wiring', '📡', 'beginner',     8,  ['control cable','screened cable','Profibus','shielding','EMC'], 'Multi-core control cables connect sensors, instruments and actuators to control panels. Screened types prevent interference in noisy industrial environments.', ['flexible-cable','conduit']),

  // ── Motors & Drives ─────────────────────────────────────────────────────────
  INDUCTION_MOTOR,
  VFD,
  stub('synchronous-motor','Synchronous Motor',       'motors', 'Motors & Drives', '⚙️', 'advanced',     16, ['synchronous','leading PF','excitation','IEC 60034','salient pole'], 'Synchronous motors operate at exactly synchronous speed with no slip. They can be operated at leading power factor, providing reactive power to improve system PF.', ['induction-motor','vfd','capacitor']),
  stub('bldc',           'BLDC Motor',                'motors', 'Motors & Drives', '⚙️', 'advanced',     14, ['BLDC','brushless DC','permanent magnet','servo','PMSM'], 'Brushless DC motors use permanent magnets on the rotor and electronic commutation, offering high efficiency, high torque density and long life without brush maintenance.', ['vfd','servo']),
  stub('dol-starter',    'DOL Motor Starter',         'motors', 'Motors & Drives', '🔌', 'beginner',     10, ['DOL','direct-on-line','IEC 60947-4-1','motor starting','starting current'], 'Direct-on-line starters apply full voltage directly to the motor terminals. Simplest and lowest cost starting method but has the highest starting current (6-8× FLC).', ['contactor','olr','mccb','star-delta-starter']),
  stub('star-delta-starter','Star-Delta Starter',    'motors', 'Motors & Drives', '⭐', 'intermediate', 12, ['star-delta','reduced voltage','IEC 60947-4-1','starting torque','transition'], 'Star-delta starters reduce starting current to 1/3 of DOL current by initially connecting the motor in star, then switching to delta at full speed.', ['contactor','vfd','dol-starter']),
  stub('soft-starter',   'Soft Starter',             'motors', 'Motors & Drives', '🌡️', 'intermediate', 12, ['soft starter','thyristor','ramp','IEC 60947-4-2','electronic'], 'Electronic soft starters control motor starting current and torque by gradually increasing voltage via thyristors — smoother than star-delta with no current step on transition.', ['vfd','star-delta-starter','dol-starter']),
  stub('servo-drive',    'Servo Drive & Servo Motor', 'motors', 'Motors & Drives', '🎯', 'advanced',     16, ['servo','encoder','position control','motion control','CNC'], 'Servo drives provide closed-loop position, velocity and torque control with high dynamic response, used in CNC machines, robotics and precision automation.', ['bldc','vfd']),
  stub('dc-motor',       'DC Motor',                  'motors', 'Motors & Drives', '⚙️', 'intermediate', 12, ['DC motor','commutator','armature','field weakening','SCR drive'], 'DC motors were historically the standard for variable speed drives. Commutator and brushes require regular maintenance. Still used in traction and some specialized applications.', ['induction-motor','vfd']),
  stub('motor-testing',  'Motor Testing & Condition Monitoring','motors','Motors & Drives','🔬','intermediate',14,['motor testing','insulation resistance','vibration','thermography','MCA'],'Condition monitoring of electric motors includes insulation resistance testing, vibration analysis, motor current signature analysis and infrared thermography.',['induction-motor','olr']),
  stub('motor-prot-relay','Motor Protection Relay',  'motors', 'Motors & Drives', '🛡️', 'advanced',     16, ['motor protection','RTD','thermistor','differential protection','IEC 60255'], 'Comprehensive motor protection relays provide overload, stall, earth fault, negative sequence, thermistor and differential protection in a single device.', ['olr','induction-motor','protection-relay']),
  stub('generator-alternator','AC Generator (Alternator)','motors','Motors & Drives','⚡','intermediate',14,['alternator','AVR','excitation','synchronization','IEC 60034'],'Synchronous generators (alternators) convert mechanical energy to electrical energy. Used in standby generators, renewable energy and large power stations.',['synchronous-motor','transformer']),

  // ── Transformers ────────────────────────────────────────────────────────────
  stub('dist-transformer','Distribution Transformer', 'transformers','Transformers','🔄','intermediate',16,['distribution transformer','IEC 60076','tap changer','vector group','ONAN'],'Distribution transformers step down MV (6.6–33 kV) to LV (400V) for end-user supply. Selection covers kVA rating, impedance, vector group, cooling and losses.',['transformer','ct','busbar']),
  stub('dry-transformer','Dry-Type Transformer',      'transformers','Transformers','🔄','intermediate',14,['dry-type','cast resin','VPI','IEC 60076-11','fire-safe'],'Dry-type transformers use air or resin insulation instead of oil — safer for indoor installations in schools, hospitals, commercial buildings and offshore platforms.',['dist-transformer','transformer']),
  stub('auto-transformer','Auto-Transformer',         'transformers','Transformers','🔄','intermediate',12,['auto-transformer','variac','IEC 60076','reduced voltage starting'],'Auto-transformers have a single winding that acts as both primary and secondary — more compact than a double-wound transformer but without galvanic isolation.',['dist-transformer','star-delta-starter']),
  stub('measurement-ct','Current Transformer (CT)',   'transformers','Transformers','📡','intermediate',14,['CT','IEC 61869-2','knee-point','burden','class 5P20'],'Instrument CTs reduce high line currents to 1A or 5A secondary for metering and protection relays. Selection covers ratio, accuracy class, burden and knee-point voltage.',['ct','protection-relay','energy-meter']),
  stub('vt-pt',          'Voltage Transformer (VT/PT)','transformers','Transformers','📡','intermediate',12,['VT','PT','voltage transformer','IEC 61869-3','metering accuracy'],'Voltage transformers reduce high system voltages (6.6–400 kV) to 100V or 110V for metering and protection. Selection covers accuracy class, burden and insulation level.',['measurement-ct','protection-relay','energy-meter']),
  stub('tap-changer',    'On-Load Tap Changer (OLTC)', 'transformers','Transformers','🔧','advanced',14,['OLTC','tap changer','voltage regulation','IEC 60214','oil'],'On-load tap changers regulate the transformer output voltage while energized by switching between transformer taps, maintaining constant voltage despite load and supply variations.',['dist-transformer']),
  stub('transformer-testing','Transformer Testing',   'transformers','Transformers','🔬','advanced',16,['DGA','dissolved gas analysis','transformer testing','IEC 60296','sweep frequency'],'Transformer condition assessment includes dissolved gas analysis (DGA), power factor testing, frequency response analysis and thermographic inspection.',['dist-transformer','dry-transformer']),
  stub('earthing-transformer','Earthing Transformer', 'transformers','Transformers','⛰️','advanced',12,['earthing transformer','neutral earthing','zig-zag','IEC 60076','NEO'],'Earthing (neutral earthing) transformers create an artificial neutral point on delta-connected systems for earth fault protection and neutral earthing.',['earthing','dist-transformer']),
  stub('buchholz-relay', 'Buchholz Relay',            'transformers','Transformers','🛡️','intermediate',10,['Buchholz','oil gas relay','transformer protection','IEC 60214'],'The Buchholz relay detects gas accumulation and oil surges inside transformer conservator type tanks, providing early warning of internal faults.',['dist-transformer','protection-relay']),
  stub('impulse-testing','Transformer Impulse Testing','transformers','Transformers','⚡','advanced',12,['BIL','lightning impulse','switching impulse','IEC 60076-3'],'Impulse testing verifies that transformer insulation can withstand the basic lightning impulse level (BIL) and switching surge voltages specified for its voltage class.',['dist-transformer']),

  // ── Power Systems ────────────────────────────────────────────────────────────
  stub('substation',     'Substation Design',         'power-system','Power Systems','🏭','advanced',20,['substation','GIS','AIS','IEC 61439','protection layout'],'Electrical substations transform voltage levels and distribute power. Design covers single-line diagram, equipment layout, protection scheme and earthing design.',['busbar','vcb','transformer','earthing']),
  stub('busbar-design',  'Busbar Design',             'power-system','Power Systems','📊','intermediate',14,['busbar','copper','aluminium','IEC 61439-1','ampacity','electrodynamic'],'Busbars carry large currents within switchboards and substations. Design addresses current rating, thermal withstand during faults and electrodynamic forces between conductors.',['busbar','acb','short-circuit']),
  stub('lv-switchboard', 'LV Switchboard & MCC',     'power-system','Power Systems','🔌','intermediate',16,['switchboard','MCC','IEC 61439-2','form of separation','diversity factor'],'LV switchboards and motor control centers house the incoming and outgoing devices for LV distribution. IEC 61439-2 defines the verification requirements and separation forms.',['acb','busbar','mccb','load-schedule']),
  stub('hv-switchgear',  'MV/HV Switchgear',         'power-system','Power Systems','⚡','advanced',18,['MV switchgear','GIS','ring main unit','IEC 62271','C&R relay'],'Medium voltage switchgear (1–36 kV) comprises metal-clad cubicles or GIS panels with VCBs or SF6 breakers, current transformers and bus protection relays.',['vcb','sf6-breaker','substation']),
  stub('sld',            'Single Line Diagram (SLD)', 'power-system','Power Systems','📋','intermediate',12,['SLD','one-line diagram','power system design','IEC 617'],'A Single Line Diagram is the fundamental engineering drawing for a power system, showing all generation, transformation and distribution in simplified form.',['substation','lv-switchboard','load-schedule']),
  stub('load-flow',      'Load Flow Study',           'power-system','Power Systems','💻','advanced',20,['load flow','power flow','Newton-Raphson','bus voltage','reactive power'],'Load flow (power flow) studies calculate the steady-state voltages, currents and power flows throughout a power network under various operating conditions.',['substation','voltage-drop']),
  stub('short-circuit-study','Short Circuit Study',   'power-system','Power Systems','⚡','advanced',18,['short circuit','IEC 60909','Isc','fault level','impedance'],'Short circuit studies calculate the maximum fault current at every bus in the network to verify that protection devices and equipment ratings are adequate.',['short-circuit','acb','mccb','busbar']),
  stub('arc-flash-study','Arc Flash Assessment',      'power-system','Power Systems','🔥','advanced',20,['arc flash','IEEE 1584','incident energy','PPE','boundary'],'Arc flash hazard assessment per IEEE 1584 calculates the incident energy and arc flash boundary at every switchboard to determine the minimum PPE category required.',['short-circuit-study','ppe','loto']),
  stub('protection-coord','Protection Coordination',  'power-system','Power Systems','🛡️','advanced',20,['selectivity','discrimination','time-grading','IEC 60255','relay settings'],'Protection coordination ensures that only the fuse, relay or breaker closest to a fault operates, isolating the minimum amount of the system.',['protection-relay','mccb','fuse','acb']),
  stub('emergency-power','Emergency Power System',    'power-system','Power Systems','🔋','intermediate',14,['ATS','generator','UPS','IEC 60364-5-56','essential services'],'Emergency power systems (generators + UPS + ATS) maintain supply to life safety and critical loads during utility outages. Design covers classification and load sequencing.',['ups','generator-alternator','load-schedule']),
  stub('reactive-power', 'Reactive Power Management', 'power-system','Power Systems','📊','intermediate',14,['reactive power','kVAR','power factor','STATCOM','SVR'],'Reactive power management maintains voltage levels and reduces system losses through capacitor banks, synchronous condensers or STATCOMs.',['capacitor','power-factor-basics','synchronous-motor']),
  stub('power-system-protection','Power System Protection Overview','power-system','Power Systems','🛡️','advanced',18,['protection','zones of protection','backup protection','IEC 60255'],'Power system protection uses relays, CTs and circuit breakers to rapidly detect and isolate faults, preventing equipment damage and limiting outage scope.',['protection-relay','protection-coord','measurement-ct']),

  // ── Earthing & Lightning ─────────────────────────────────────────────────────
  stub('earthing-systems','Earthing System Types (TN/TT/IT)','earthing','Earthing & Lightning','⛰️','intermediate',14,['TN-S','TT','IT','IEC 60364','neutral','PME'],'The three earthing system types (TN, TT, IT) define how the system neutral and exposed conductive parts are connected to earth. Each has different protection and safety characteristics.',['earthing','mcb','rccb']),
  stub('earth-pit',      'Earth Pit Design',          'earthing','Earthing & Lightning','⛰️','intermediate',12,['earth pit','electrode','soil resistivity','IEC 60364-5-54','IS 3043'],'Driven rod and excavated plate earth pits reduce the overall earth grid resistance. Design covers electrode dimensions, burial depth and parallel combination calculations.',['earthing','earthing-systems']),
  stub('touch-step-voltage','Touch & Step Voltage',   'earthing','Earthing & Lightning','⚡','advanced',14,['touch voltage','step voltage','IEEE 80','tolerable limits','mesh voltage'],'Touch and step voltage during earth fault conditions are the primary safety criteria for substation earthing design per IEEE 80 and IEC 60479.',['earthing','earth-pit']),
  stub('bonding',        'Equipotential Bonding',     'earthing','Earthing & Lightning','🔗','intermediate',10,['bonding','equipotential','IEC 60364-5-54','structural steel','main bonding'],'Equipotential bonding connects all extraneous conductive parts to the main earthing terminal, preventing dangerous touch voltages in the event of a fault.',['earthing-systems','rccb']),
  stub('lightning-protection','Lightning Protection System','earthing','Earthing & Lightning','⚡','intermediate',16,['LPS','air terminal','rolling sphere','IEC 62305','protection level'],'Lightning protection systems (LPS) capture the lightning stroke, conduct it safely to earth and prevent side-flash, protecting buildings and personnel.',['earthing','spd','earth-pit']),
  stub('lightning-arrestor','Lightning Arrestor (Surge Arrester)','earthing','Earthing & Lightning','⚡','intermediate',12,['surge arrester','MOV','IEC 60099-4','coordination voltage','energy absorption'],'Surge arresters (lightning arresters) clamp overvoltages on power lines and equipment from lightning strikes and switching surges.',['spd','lightning-protection']),
  stub('earthing-conductor','Earthing Conductor Sizing','earthing','Earthing & Lightning','🔌','intermediate',10,['earth conductor','IEC 60364-5-54','k factor','thermal withstand','CPC'],'Earth conductors (circuit protective conductors, earth electrodes conductors) must be sized to carry fault current without overheating.', ['earthing','cable-sizing']),
  stub('atex',           'Hazardous Area Classification (ATEX/IECEx)','earthing','Earthing & Lightning','🔥','advanced',18,['ATEX','IECEx','Zone 0','Zone 1','Ex d','Ex e'],'Hazardous area classification identifies zones where flammable atmospheres may be present and determines which types of explosion-protected equipment (Ex) are permitted.',['sf6-breaker','motor-prot-relay']),
  stub('cathodic-protection','Cathodic Protection',   'earthing','Earthing & Lightning','🔬','advanced',12,['cathodic protection','sacrificial anode','impressed current','IS 13173'],'Cathodic protection prevents electrochemical corrosion of buried pipelines and structures using sacrificial anodes or impressed current systems.',['earthing','earth-pit']),
  stub('earthing-mv-substation','MV Substation Earthing','earthing','Earthing & Lightning','⛰️','advanced',16,['substation earthing','IEEE 80','GPR','earth grid','touch potential'],'Substation earthing design per IEEE 80 calculates the earth grid resistance, ground potential rise (GPR) and step/touch voltages for safety verification.',['touch-step-voltage','earthing','substation']),

  // ── Power Quality ────────────────────────────────────────────────────────────
  stub('power-factor-basics','Power Factor (cos φ)',  'power-quality','Power Quality','📊','beginner',12,['power factor','kVAR','kVA','leading','lagging','capacitor'],'Power factor is the ratio of active power (kW) to apparent power (kVA). Low power factor increases current, cable losses and utility demand charges.',['capacitor','harmonics','vfd']),
  stub('harmonics',      'Harmonic Distortion',       'power-quality','Power Quality','〰️','advanced',18,['harmonics','THD','IEC 61000-3-2','5th harmonic','passive filter'],'Harmonic currents (5th, 7th, 11th order) generated by non-linear loads (VFDs, UPS, LED drivers) distort the supply voltage and cause overheating of transformers and cables.',['vfd','capacitor','power-factor-basics']),
  stub('voltage-unbalance','Voltage Unbalance',       'power-quality','Power Quality','⚡','intermediate',12,['voltage unbalance','negative sequence','IEC 60034','derating','three-phase'],'Voltage unbalance causes negative sequence current in motors, creating a braking torque that overheats the motor. Even 2% unbalance reduces motor life significantly.',['induction-motor','dist-transformer']),
  stub('voltage-flicker','Voltage Flicker',           'power-quality','Power Quality','💡','intermediate',10,['flicker','IEC 61000-3-3','Pst','Plt','arc furnace'],'Voltage flicker is rapid voltage fluctuations (0.5–35 Hz) caused by arc furnaces, welders and motor starting, perceived as annoying light flicker by building occupants.',['power-factor-basics']),
  stub('voltage-regulation','Voltage Regulation',     'power-quality','Power Quality','📊','intermediate',12,['voltage regulation','IEC 60038','±10%','AVR','tap changer'],'Voltage regulation ensures the supply voltage stays within ±10% of nominal under all load conditions using transformers with tap changers, voltage regulators and reactive compensation.',['dist-transformer','tap-changer','reactive-power']),
  stub('power-quality-standard','Power Quality Standards','power-quality','Power Quality','📋','intermediate',14,['EN 50160','IEC 61000','power quality','limits','monitoring'],'EN 50160 defines the voltage characteristics of the public distribution supply. IEC 61000 series covers EMC and power quality requirements for equipment and installations.',['harmonics','voltage-regulation']),
  stub('active-harmonic-filter','Active Harmonic Filter','power-quality','Power Quality','🔧','advanced',14,['AHF','active filter','harmonic cancellation','IGBT','current injection'],'Active harmonic filters inject equal and opposite harmonic currents to cancel the harmonics generated by non-linear loads, achieving THD < 5% on the supply.',['harmonics','vfd','capacitor']),
  stub('power-conditioner','Power Conditioner & UPS', 'power-quality','Power Quality','🔋','intermediate',12,['power conditioner','isolation transformer','line conditioner','voltage regulation'],'Power conditioners use isolation transformers, voltage regulators and filters to provide a clean regulated supply to sensitive electronic equipment.',['ups','harmonics','spd']),
  stub('energy-monitoring','Energy Monitoring & Metering','power-quality','Power Quality','📊','beginner',10,['energy monitoring','sub-metering','SCADA','IEC 62052','ISO 50001'],'Energy monitoring systems measure and record electrical consumption at multiple points in a facility to identify waste, optimize demand and support ISO 50001 energy management.',['energy-meter','scada','power-factor-basics']),
  stub('demand-management','Demand Management',       'power-quality','Power Quality','💰','intermediate',12,['demand management','peak shaving','load shedding','half-hourly metering','tariff'],'Demand management reduces electricity costs by limiting peak demand, shifting loads off-peak and shedding non-essential loads during high-tariff periods.',['energy-monitoring','ups','load-schedule']),

  // ── Metering & Instrumentation ───────────────────────────────────────────────
  stub('energy-meter',   'Energy Meter',              'metering','Metering & Instruments','📊','beginner',10,['energy meter','kWh','IEC 62052','Ferraris','AMR','AMI'],'Energy meters measure electrical energy consumption in kWh. Modern smart meters support remote reading, multi-tariff billing and power quality monitoring.',['measurement-ct','vt-pt','power-quality-standard']),
  stub('power-quality-analyzer','Power Quality Analyzer','metering','Metering & Instruments','🔬','advanced',14,['power quality analyzer','PQ monitor','IEC 61000','EN 50160','waveform capture'],'Power quality analyzers measure and record voltage and current waveforms, harmonics, flicker, dips and swells to assess supply quality and diagnose problems.',['harmonics','voltage-flicker','energy-meter']),
  stub('pressure-transmitter','Pressure Transmitter', 'metering','Metering & Instruments','🔬','intermediate',10,['4-20mA','pressure sensor','HART','IEC 60770','process instrumentation'],'Pressure transmitters convert fluid pressure to 4–20 mA or digital HART signals for monitoring and control of process systems.',['plc','scada']),
  stub('temperature-sensor','Temperature Sensor',     'metering','Metering & Instruments','🌡️','beginner',10,['RTD','thermocouple','Pt100','4-20mA','IEC 60751'],'Temperature sensors (RTDs, thermocouples, thermistors) measure temperature in processes, motors and electrical equipment. Selection depends on range, accuracy and response time.',['plc','motor-prot-relay']),
  stub('level-sensor',   'Level Sensor',              'metering','Metering & Instruments','🔬','intermediate',10,['level sensor','ultrasonic','radar','guided wave','4-20mA'],'Level sensors measure liquid or solid levels in tanks and vessels using ultrasonic, radar, float or differential pressure methods.',['plc','scada']),
  stub('flow-meter',     'Flow Meter',                'metering','Metering & Instruments','💧','intermediate',12,['flow meter','electromagnetic','Coriolis','vortex','IEC 60534'],'Flow meters measure the volumetric or mass flow rate of liquids and gases. Electromagnetic types for conductive liquids; Coriolis for high-accuracy mass flow.',['plc','pressure-transmitter']),
  stub('signal-conditioning','Signal Conditioning',   'metering','Metering & Instruments','🔧','intermediate',10,['signal conditioning','isolation barrier','galvanic isolation','4-20mA to HART','shielding'],'Signal conditioning amplifies, filters, isolates and converts instrument signals to prevent interference and protect PLCs from hazardous voltages.',['plc','pressure-transmitter','data-cable']),
  stub('protection-ct-metering','CT & VT Selection for Metering','metering','Metering & Instruments','📡','intermediate',12,['metering CT','class 0.2','IEC 61869','burden','burden cable'],'Accurate energy and power metering requires correctly selected CTs and VTs with accuracy class matching the metering application and total burden within CT VA rating.',['measurement-ct','vt-pt','energy-meter']),
  stub('fieldbus',       'Fieldbus & Industrial Communication','metering','Metering & Instruments','📡','advanced',14,['Profibus','Modbus','HART','Foundation Fieldbus','IEC 61158'],'Industrial fieldbuses connect sensors, actuators and controllers using digital communication protocols, replacing 4-20 mA analog wiring in complex systems.',['plc','scada','pressure-transmitter']),
  stub('calibration',    'Instrument Calibration',    'metering','Metering & Instruments','🔬','intermediate',10,['calibration','traceability','NIST','ISO 17025','uncertainty'],'Calibration verifies that instruments measure within specified accuracy limits traceable to national standards. Critical for revenue metering and safety systems.',['energy-meter','pressure-transmitter']),

  // ── Industrial Systems ───────────────────────────────────────────────────────
  stub('mcc',            'Motor Control Centre (MCC)', 'industrial','Industrial Systems','🏭','intermediate',16,['MCC','Form 4','IEC 61439-2','draw-out','fixed',], 'Motor Control Centres house motor starters, VFDs and associated protection in a unified enclosure with common busbar and inter-panel wiring.',['contactor','olr','mccb','busbar-design']),
  stub('plc',            'PLC (Programmable Logic Controller)','industrial','Industrial Systems','💻','intermediate',16,['PLC','ladder logic','IEC 61131-3','I/O','Siemens','Allen-Bradley'],'PLCs are industrial computers that execute control programs to automate machines and processes. Programming uses ladder logic, function block diagram or structured text.',['scada','hmi','pressure-transmitter']),
  stub('scada',          'SCADA System',              'industrial','Industrial Systems','💻','advanced',18,['SCADA','supervisory control','HMI','OPC','historian','cybersecurity'],'SCADA systems monitor and control distributed industrial processes from a central control room using real-time data acquisition, alarming and historical trending.',['plc','hmi','fieldbus']),
  stub('hmi',            'HMI (Human Machine Interface)','industrial','Industrial Systems','🖥️','intermediate',12,['HMI','touchscreen','SCADA','OPC-UA','Ignition'],'HMIs provide the graphical interface for operators to monitor and control processes. Modern HMIs are web-based or run on industrial PCs with touch screens.',['plc','scada']),
  stub('control-panel',  'Control Panel Design',      'industrial','Industrial Systems','🏭','intermediate',16,['control panel','IEC 61439-2','wiring','terminal blocks','cable management'],'Electrical control panel design covers component selection, layout, wiring, terminal blocks, cable management and IEC 61439 verification documentation.',['plc','mcc','cable-gland']),
  stub('dcs',            'Distributed Control System (DCS)','industrial','Industrial Systems','💻','advanced',18,['DCS','distributed IO','Foxboro','Honeywell','redundancy'],'DCS systems control complex continuous processes (oil refineries, chemical plants) with redundant controllers, I/O and operator workstations.',['scada','plc','fieldbus']),
  stub('bms',            'Building Management System (BMS)','industrial','Industrial Systems','🏢','intermediate',14,['BMS','BACnet','HVAC control','energy management','DDC'],'Building Management Systems control and monitor HVAC, lighting, security and fire systems in commercial buildings using DDC controllers and BACnet/Modbus networks.',['plc','hmi','energy-monitoring']),
  stub('ups-system',     'UPS System Design',         'industrial','Industrial Systems','🔋','intermediate',16,['UPS design','N+1','2N','battery runtime','IEC 62040'],'UPS system design covers topology selection, capacity sizing, battery runtime calculation, redundancy configuration and bypass arrangements for critical power protection.',['ups','load-schedule','battery-sizing']),
  stub('battery-sizing', 'Battery System Design',     'industrial','Industrial Systems','🔋','intermediate',14,['VRLA','lithium-ion','battery sizing','C10 rate','IEEE 485'],'Battery system design covers chemistry selection, capacity calculation, battery room design, charging systems and maintenance for standby and energy storage applications.',['ups-system','renewable-energy']),
  stub('renewable-energy','Renewable Energy Integration','industrial','Industrial Systems','☀️','advanced',18,['solar PV','wind power','grid-tie','islanding','IEC 62116'],'Integrating renewable generation (solar PV, wind) with the grid requires inverter selection, protection coordination, harmonic analysis and anti-islanding schemes.',['vfd','earthing','harmonics']),
  stub('generator-protection','Generator Protection', 'industrial','Industrial Systems','🛡️','advanced',16,['generator protection','loss of field','differential','reverse power','IEEE C37.102'],'Generator protection relays protect against loss of excitation, differential faults, reverse power, over/under voltage and off-nominal frequency conditions.',['generator-alternator','protection-relay','synchronous-motor']),
  stub('energy-audit',   'Electrical Energy Audit',   'industrial','Industrial Systems','📊','intermediate',14,['energy audit','ISO 50001','power quality','kWh','demand analysis'],'Energy audits identify opportunities to reduce electrical energy consumption through measurement, analysis and implementation of energy efficiency measures.',['energy-monitoring','vfd','power-factor-basics']),
  stub('panel-schedule', 'Panel Schedule & Load Schedule','industrial','Industrial Systems','📋','beginner',10,['panel schedule','load schedule','demand factor','IEC 60364','board design'],'Panel schedules document every circuit in a distribution board — circuit number, description, rating, current, cable size and phase allocation.',['load-schedule','mccb','cable-sizing']),

  // ── Standards & Safety ───────────────────────────────────────────────────────
  stub('iec-60364',     'IEC 60364 — Building Wiring',      'standards','Standards & Safety','📋','intermediate',16,['IEC 60364','BS 7671','wiring regulations','installation design'],'IEC 60364 (Electrical installations of buildings) is the international standard for the design, installation and testing of electrical installations in buildings.',['cable-sizing','earthing-systems','mcb']),
  stub('iec-60947',     'IEC 60947 — LV Switchgear',        'standards','Standards & Safety','📋','intermediate',14,['IEC 60947','switchgear','controlgear','ACB','MCCB','contactor'],'IEC 60947 series covers low-voltage switchgear and controlgear, specifying performance requirements for circuit breakers, contactors, fuses and starters.',['acb','mccb','contactor','fuse']),
  stub('iec-61439',     'IEC 61439 — Switchboard Assemblies','standards','Standards & Safety','📋','advanced',16,['IEC 61439','LV switchboard','form of separation','verification','type test'],'IEC 61439 defines requirements for LV switchboard assemblies and MCCs including temperature rise, short-circuit withstand and internal separation.',['lv-switchboard','mcc','busbar-design']),
  stub('ieee-80',       'IEEE 80 — Substation Earthing',     'standards','Standards & Safety','📋','advanced',16,['IEEE 80','earth grid','touch voltage','step voltage','GPR'],'IEEE 80 provides the methodology for designing safe earthing systems for power substations, including grid resistance, touch and step voltage calculations.',['earthing','touch-step-voltage','earthing-mv-substation']),
  stub('ieee-1584',     'IEEE 1584 — Arc Flash',             'standards','Standards & Safety','📋','advanced',18,['IEEE 1584','arc flash','incident energy','PPE category','boundary'],'IEEE 1584 is the standard method for calculating arc flash hazard in power systems. The 2018 edition includes improved models for a wider range of configurations.',['arc-flash-study','ppe','short-circuit-study']),
  stub('nec',           'NEC (NFPA 70)',                      'standards','Standards & Safety','📋','intermediate',16,['NEC','NFPA 70','US wiring','article 310','conduit fill'],'The National Electrical Code (NEC) is the US standard for safe electrical installation, covering wiring methods, equipment and special occupancy requirements.',['iec-60364']),
  stub('bs-7671',       'BS 7671 — IET Wiring Regulations',  'standards','Standards & Safety','📋','intermediate',16,['BS 7671','18th edition','UK wiring','IET','Part P'],'BS 7671 (IET Wiring Regulations, 18th Edition) is the UK standard for electrical installations. Harmonized with IEC 60364 but with UK-specific amendments.',['iec-60364']),
  stub('ppe',           'Electrical PPE Selection',           'standards','Standards & Safety','🦺','intermediate',14,['PPE','arc flash','IEC 61482','face shield','gloves','insulated tools'],'Personal Protective Equipment for electrical work must be selected based on the arc flash incident energy (cal/cm²) at the point of work.',['arc-flash-study','ieee-1584','loto']),
  stub('loto',          'Lock-Out Tag-Out (LOTO)',            'standards','Standards & Safety','🔒','beginner',12,['LOTO','isolation','safe isolation','IEC 60364-6','permit to work'],'Lock-out Tag-out procedures ensure that energy sources are safely isolated and cannot be accidentally re-energized while work is being performed on equipment.',['ppe','isolator']),
  stub('ptw',           'Permit to Work (PTW)',               'standards','Standards & Safety','📋','intermediate',10,['permit to work','electrical safety','high voltage','live working'],'Permit to Work systems control high-risk electrical work through formal authorization, isolation verification and sign-off procedures.',['loto','ppe']),
  stub('ip-rating',     'IP Rating (Ingress Protection)',     'standards','Standards & Safety','🔧','beginner',8, ['IP54','IP65','IEC 60529','enclosure','dust water protection'],'IP (Ingress Protection) ratings define the degree of protection provided by an enclosure against dust and water ingress per IEC 60529.',['cable-gland','control-panel','mcc']),
  stub('thermal-imaging','Thermal Imaging in Electrical Inspections','standards','Standards & Safety','🌡️','intermediate',12,['thermography','infrared camera','hot spot','IEC 62446','condition monitoring'],'Thermal imaging (infrared thermography) identifies overloaded connections, failing components and unbalanced loads in switchboards and motors non-invasively.',['motor-testing','transformer-testing','lv-switchboard']),
  stub('electrical-testing','Electrical Testing & Commissioning','standards','Standards & Safety','🔬','intermediate',16,['commissioning','insulation resistance','continuity','RCD test','IEC 60364-6'],'Electrical installation testing and commissioning verifies safety before energization: continuity, insulation resistance, polarity, earth electrode resistance and RCD operation.',['iec-60364','earthing','rccb']),
  stub('energy-efficiency','Energy Efficiency Standards',     'standards','Standards & Safety','📊','intermediate',14,['IE3','IEC 60034-30','ErP directive','MEPS','energy label'],'Energy efficiency standards for motors (IE3/IE4), transformers (Ecodesign), lighting (LED) and buildings (EPBD) mandate minimum energy performance.',['induction-motor','dist-transformer','vfd']),
  stub('neta-testing',  'Acceptance Testing (NETA/IEC)',     'standards','Standards & Safety','🔬','advanced',14,['NETA','acceptance test','commissioning','circuit breaker testing','relay testing'],'Acceptance testing of new electrical equipment per NETA ATS or IEC standards verifies that installed equipment meets specification before energization.',['electrical-testing','acb','vcb','protection-relay']),
  stub('live-working',  'Live Working Safety',               'standards','Standards & Safety','⚡','advanced',14,['live working','IEC 60900','insulated tools','hot sticks','approach limits'],'Live working on energized equipment requires specialized training, insulated tools and clearly defined approach limits to prevent electric shock and arc flash.',['ppe','loto','ptw']),
  stub('harmonic-standard','Harmonic Standards',             'standards','Standards & Safety','〰️','intermediate',12,['IEC 61000-3-2','EN 50160','THD limits','harmonic assessment','G5/4'],'Harmonic emission standards (IEC 61000-3-2 for equipment, G5/4 for installations) set limits on harmonic currents and voltage distortion to protect power quality.',['harmonics','active-harmonic-filter']),
];

// ─── Merge MORE_TOPICS — replace stubs with complete versions ────────────────

const moreById = new Map(MORE_TOPICS.map((t) => [t.id, t]));
for (let i = 0; i < ALL_TOPICS.length; i++) {
  const full = moreById.get(ALL_TOPICS[i].id);
  if (full) ALL_TOPICS[i] = full;
}

// ─── Build category topic counts ────────────────────────────────────────────

const counts: Record<string, number> = {};
ALL_TOPICS.forEach((t) => { counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1; });
CATEGORIES.forEach((c) => { c.topicCount = counts[c.id] ?? 0; });

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getTopicsByCategory(categoryId: string): Topic[] {
  return ALL_TOPICS.filter((t) => t.categoryId === categoryId);
}

export function getTopicById(id: string): Topic | undefined {
  return ALL_TOPICS.find((t) => t.id === id);
}

export function searchTopics(query: string): Topic[] {
  const q = query.toLowerCase();
  return ALL_TOPICS.filter((t) =>
    t.title.toLowerCase().includes(q) ||
    t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
    (t.intro ?? t.content?.introduction ?? '').toLowerCase().includes(q)
  );
}
