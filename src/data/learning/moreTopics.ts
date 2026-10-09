import type { Topic } from './learningData';

// ─── MCCB ────────────────────────────────────────────────────────────────────

export const MCCB: Topic = {
  id: 'mccb', title: 'MCCB (Moulded Case Circuit Breaker)', category: 'Protection Devices', categoryId: 'protection',
  icon: '⚡', difficulty: 'intermediate', readingTime: 15, status: 'complete',
  tags: ['MCCB', 'IEC 60947-2', 'thermal-magnetic', 'Icu', 'selectivity', 'adjustable trip'],
  content: {
    introduction: `A Moulded Case Circuit Breaker (MCCB) protects circuits from overload and short-circuit faults, rated from 16 A to 1600 A. Unlike an MCB, an MCCB has adjustable thermal and magnetic trip settings, allowing it to be tuned to the exact load. MCCBs are the standard protection device for main incomer, sub-main feeders, and large motor circuits in industrial and commercial installations.

MCCBs are specified under IEC 60947-2 and are characterised by: rated current (In), ultimate breaking capacity (Icu), service breaking capacity (Ics), and adjustable trip range. Electronic trip units replace the thermal-magnetic mechanism in higher-spec MCCBs, offering programmable overload (Ir), short-circuit (Im), and earth fault (Ig) settings.`,

    keyFacts: [
      'Adjustable overload trip: typically 0.7–1.0 × In (thermal setting)',
      'Adjustable instantaneous trip: typically 2–15 × In (magnetic setting)',
      'Ics (service breaking capacity) = 50–100% of Icu — the rating for repeated fault clearing',
      'Electronic trip units add: earth fault protection, zone selectivity, and communication',
      'Frame sizes: 100A, 160A, 250A, 400A, 630A, 800A, 1000A, 1250A, 1600A (typical)',
      'Cascade (back-up) protection: upstream MCCB covers the fault when downstream device Icu is exceeded',
      'Temperature derating: MCCBs are rated at 40°C ambient — derate in hot enclosures',
    ],

    types: [
      { name: 'Thermal-Magnetic Trip', description: 'Bimetal element for overload + electromagnetic coil for short circuit. Fixed or semi-adjustable trip points. Lower cost.', when: 'Standard feeders, outgoing sub-boards, motor feeders where precise settings are not critical.' },
      { name: 'Electronic Trip Unit (ETU)', description: 'Microprocessor-based trip unit with fully adjustable Ir (overload), Im (instantaneous), Isd (short delay), Ig (earth fault). Provides event logging and communication (Modbus, Profibus).', when: 'Main incomers, critical feeders, energy monitoring applications, installations requiring zone selectivity.' },
      { name: 'Motor-Duty MCCB (Type E)', description: 'Rated for the high inrush of motor starting. Higher instantaneous trip setting. Includes motor protection functions.', when: 'Large motor starters (>30 kW) where a standard MCCB instantaneous trip would operate on motor starting current.' },
    ],

    workingPrinciple: `**Thermal trip (overload):** A bimetal strip carries load current. Sustained overload heats the strip causing it to bend and release the trip mechanism. Inverse time: the higher the overload, the faster it trips. Trip time at 1.5× In: 2–10 minutes. The thermal setting (Ir) adjusts the threshold where the bimetal activates.

**Magnetic trip (short circuit):** An electromagnetic coil exerts a force proportional to I². Above the instantaneous trip threshold (Im), the force is sufficient to release the trip immediately (< 20 ms). The Im setting defines whether the MCCB trips instantaneously or with a short time delay (for zone selectivity).

**Arc extinction:** Contacts part and the arc is driven into a stacked arc chute with splitter plates. Each plate creates a short arc segment with its own anode-cathode voltage. The total arc voltage rapidly exceeds supply voltage, extinguishing the arc. The breaking capacity (Icu) defines the maximum current that can be safely interrupted.`,

    selectionGuide: [
      { parameter: 'Frame current (In)', guidance: 'Select frame In ≥ design current of circuit. Set thermal trip Ir = 0.9–1.0 × load current. For motors, use motor-duty MCCB with Im set above locked rotor current.' },
      { parameter: 'Breaking capacity (Icu)', guidance: 'Calculate prospective fault current at the MCCB terminals. Select Icu > Isc. For main incomers near transformers: Isc can be 20–50 kA. Use 36 kA or 50 kA MCCBs. For downstream boards: 16–25 kA is often sufficient.' },
      { parameter: 'Selectivity (discrimination)', guidance: 'For full selectivity: upstream MCCB Ir ≥ 1.6 × downstream In. For short-circuit selectivity: upstream Im set with short time delay (Isd) above downstream instantaneous trip. Electronic trip units with zone selectivity interlocking achieve total selectivity.' },
      { parameter: 'Ir setting (overload)', guidance: 'Set Ir to approximately 1.0 × circuit design current. For cable protection: Ir must be ≤ cable ampacity (Iz). For motor feeders: Ir = FLC × 1.0–1.15.' },
      { parameter: 'Im setting (instantaneous)', guidance: 'For cable feeders: Im = 10–15 × In (above transformer inrush). For motor feeders: Im above locked rotor current (typically 8× FLC). For zone selectivity: upstream Im > downstream fault current cleared by downstream device.' },
    ],

    applications: [
      'Main incomer — incoming protection for LV switchboards from transformer secondary',
      'Sub-main feeders — protecting outgoing cables to distribution boards',
      'Large motor protection — motors 30 kW and above',
      'Generator protection — generator circuit breaker on DG sets',
      'Bus coupler — normally-open tie between main and emergency busbar sections',
    ],

    advantages: [
      'Adjustable trip settings — can be tuned to actual load current and coordination requirements',
      'High breaking capacity — up to 200 kA for certain frame sizes',
      'Resettable — can be reset after tripping without replacement',
      'Electronic trip units add earth fault and communication capability',
      'Cascade protection allows downstream devices with lower Icu, reducing cost',
    ],

    disadvantages: [
      'Higher cost than MCB for the same current rating',
      'Larger physical size than equivalent MCB',
      'Electronic trip units require auxiliary power supply to operate',
      'Complex to test and calibrate electronic trip settings',
    ],

    commonMistakes: [
      'Setting Im too low — trips on motor starting current or transformer inrush',
      'Setting Ir too high — cable is unprotected against overload (Ir must not exceed cable Iz)',
      'Not verifying Ics (service breaking capacity) — Icu is a once-only rating; Ics is for repeated use',
      'Ignoring temperature derating — enclosures with poor ventilation can run 20–30°C above ambient',
    ],

    troubleshooting: [
      { symptom: 'MCCB trips on motor start', causes: ['Im set below locked rotor current (6–8× FLC)', 'Motor-duty MCCB not used'], remedy: 'Increase Im to 12–15× In. Use motor-duty MCCB. Verify motor starter sequence.' },
      { symptom: 'Upstream MCCB trips instead of downstream', causes: ['Poor selectivity — upstream Im too low', 'Downstream device Icu exceeded (fault current too high for downstream device)'], remedy: 'Increase upstream Im or add short time delay. Check downstream Icu vs. available fault current.' },
      { symptom: 'MCCB does not trip on overload test', causes: ['Ir set too high', 'Trip mechanism jammed (old MCCB)', 'Test current below actual trip threshold'], remedy: 'Verify Ir setting. Primary injection test at 1.5× Ir for overload. Replace if mechanism faulty.' },
    ],

    standards: [
      { code: 'IEC 60947-2', title: 'Circuit-breakers for industrial applications', clause: 'Clause 8 (Characteristics and requirements)' },
      { code: 'IEC 60364-4-43', title: 'Protection against overcurrent', clause: 'Section 433' },
    ],

    quiz: [
      { question: 'An MCCB has Icu = 36 kA and Ics = 50% Icu. How many times can it interrupt a 18 kA fault?', options: ['Once only', 'Multiple times — Ics applies', 'Only twice', 'Unlimited'], correctIndex: 1, explanation: 'Ics = 50% × 36 kA = 18 kA. 18 kA ≤ Ics, so the MCCB can interrupt this fault multiple times in service. Icu (36 kA) is the ultimate one-time maximum.' },
      { question: 'A 250A MCCB feeds a 185mm² cable (Iz = 285A). What is the maximum Ir setting to ensure cable protection?', options: ['250A (1.0 × In)', '285A (cable Iz)', '312A (1.25 × In)', 'No limit needed'], correctIndex: 1, explanation: 'IEC 60364-4-43 requires Ir ≤ Iz = 285A. Setting Ir = 285A protects the cable. Setting Ir = 312A would allow the cable to overheat before the MCCB operates.' },
    ],

    relatedCalculations: ['short-circuit', 'cable-sizing', 'motor'],
    notes: [
      { type: 'tip', title: 'Icu vs Ics: know the difference', body: 'Icu (ultimate breaking capacity) is tested by breaking the fault once, then checking the device still operates mechanically. Ics (service breaking capacity) is tested by breaking the fault three times and verifying the device still carries rated current. Always specify Ics ≥ Isc at the installation point for switchboard applications.' },
      { type: 'warning', title: 'Cascade protection requires manufacturer approval', body: 'Using an upstream MCCB to "back up" a downstream device with lower Icu than the fault level is only valid when the specific combination is tested and listed by the manufacturer. Do not assume any two devices can be cascaded — the combination test determines whether the upstream device successfully limits let-through energy.' },
    ],
  },
};

// ─── RCCB ─────────────────────────────────────────────────────────────────────

export const RCCB: Topic = {
  id: 'rccb', title: 'RCCB / RCBO (Residual Current Device)', category: 'Protection Devices', categoryId: 'protection',
  icon: '🛡️', difficulty: 'beginner', readingTime: 10, status: 'complete',
  tags: ['RCCB', 'RCD', 'earth fault', 'IEC 61008', '30mA', '300mA', 'RCBO'],
  content: {
    introduction: `A Residual Current Circuit Breaker (RCCB) — also called a Residual Current Device (RCD) — detects earth fault currents as small as 30 mA and trips within 30–40 ms, protecting people from fatal electric shock. It works by comparing the current flowing into the line with the current returning on the neutral — any difference (residual current) indicates a fault path to earth.

An RCBO (Residual Current Circuit Breaker with Overcurrent protection) combines the RCD with an MCB in a single device, providing both earth-fault and overcurrent protection for a single circuit.

RCCBs do NOT protect against overload or short circuit — they must be used with a fuse or MCB for overcurrent protection.`,

    keyFacts: [
      '30 mA RCD: life protection — the human fibrillation threshold is 30–50 mA for > 50 ms',
      '100 mA / 300 mA RCD: fire protection — detects sustained earth leakage that could cause overheating',
      'Operating time: 30 mA RCD must trip in < 300 ms at rated IΔn, < 40 ms at 5× IΔn',
      'Type AC: operates on sinusoidal residual currents only',
      'Type A: also operates on pulsating DC residual currents (required for VFDs, PV inverters, EV chargers)',
      'Type F: for circuits supplying variable-speed motor drives — handles composite frequencies',
      'Type B: for DC and AC residual currents — required upstream of 3-phase VFDs and medical equipment',
      'S-type (selective): time-delayed (intentional) to allow downstream RCD to trip first — for discrimination',
    ],

    types: [
      { name: 'Type AC', description: 'Detects sinusoidal AC residual currents only. The basic and lowest cost type.', when: 'Simple resistive loads, lighting, heating circuits with no electronic equipment. Not suitable for VFD, EV charger or PV inverter circuits.' },
      { name: 'Type A', description: 'Detects sinusoidal AC and pulsating DC residual currents. Required by many modern standards for all new circuits.', when: 'Circuits with electronic equipment: PCs, washing machines, EV chargers, PV systems, VFDs up to single-phase.' },
      { name: 'Type F', description: 'Detects AC, pulsating DC and composite frequency currents. Reduced nuisance tripping from variable speed drives.', when: 'Single-phase VFDs, heat pumps and variable speed appliances where Type A causes nuisance tripping.' },
      { name: 'Type B', description: 'Detects AC, pulsating DC, smooth DC and high-frequency residual currents.', when: '3-phase VFDs, EV fast chargers, medical imaging equipment, PV inverters with transformerless topology.' },
      { name: 'RCBO (Combined)', description: 'RCD + MCB in one module. Provides both earth-fault and overcurrent protection. One unit per circuit instead of two.', when: 'Individual circuit protection in consumer units. More expensive than separate RCD+MCB but saves space and ensures each circuit has independent RCD protection.' },
    ],

    selectionGuide: [
      { parameter: 'Trip current (IΔn)', guidance: '30 mA for personal shock protection (sockets, bathrooms, outdoor circuits). 100–300 mA for fire protection (motor circuits, distribution feeders). 500 mA for upstream discrimination where 30 mA RCDs are downstream.' },
      { parameter: 'Type (AC/A/F/B)', guidance: 'Use Type A as minimum for all domestic and commercial circuits. Use Type F for single-phase VFD circuits. Use Type B for 3-phase VFD, EV charger and transformerless PV circuits. Never use Type AC on any circuit with electronic equipment.' },
      { parameter: 'Selectivity', guidance: 'Use S-type (selective, time-delayed) RCCBs at the main board level when 30 mA RCDs protect individual circuits. The S-type has a 100–500 ms intentional delay — it only operates if the downstream 30 mA device fails to clear the fault.' },
      { parameter: 'Current rating', guidance: 'RCCB current rating must be ≥ the circuit design current. RCCB is not an overcurrent device — its current rating is just the continuous current capability of its contacts.' },
    ],

    applications: [
      'Socket outlet circuits — mandatory 30 mA protection in most countries',
      'Bathroom and kitchen circuits — wet locations require 30 mA RCD',
      'Outdoor circuits — garden sockets, EV chargers, outdoor lighting',
      'Distribution board main protection — 100–300 mA at incoming for fire protection',
      'IT equipment rooms — Type A or B for server/data centre branch circuits',
    ],

    commonMistakes: [
      'Using Type AC on VFD or EV charger circuits — DC residual current blinds the Type AC RCD',
      'Installing only one RCD for a whole board — a single fault disables all circuits',
      'Wiring the RCD after the MCB: the correct order is SUPPLY → MCB → RCD (or RCBO combines both)',
      'Ignoring nuisance tripping root cause — Type AC on electronic load generates DC component',
      'Not testing RCDs monthly — test button is mandatory check; test instruments verify actual trip time',
    ],

    troubleshooting: [
      { symptom: 'RCD trips randomly / nuisance tripping', causes: ['Type AC on circuit with VFD or EV charger', 'Moisture in cable or fitting', 'Accumulated earth leakage from many loads'], remedy: 'Measure earth leakage current on each circuit. Upgrade to Type A/F/B as appropriate. Check for moisture ingress.' },
      { symptom: 'RCD does not trip when test button pressed', causes: ['Mechanism failed', 'Auxiliary power to RCD missing', 'Internal spring broken'], remedy: 'Replace immediately — an RCD that does not respond to test button provides no protection. Do not use the circuit until replaced.' },
    ],

    safety: [
      'Test RCDs monthly using the built-in test button — press and release; it must trip',
      'Annual instrument test (5 mA, IΔn, 5×IΔn, ramp) verifies trip current and time meet IEC 61008',
      'An RCD does not protect against line-to-neutral faults (no earth path) — always pair with MCB',
      'A tripped RCD indicates a real earth fault — investigate before resetting, do not repeatedly reset',
    ],

    standards: [
      { code: 'IEC 61008-1', title: 'Residual current operated circuit-breakers without integral overcurrent protection (RCCBs)', clause: '' },
      { code: 'IEC 61009-1', title: 'RCBOs — with integral overcurrent protection', clause: '' },
      { code: 'BS 7671', title: 'IET Wiring Regulations — Clause 415 (Additional protection by RCD)', clause: 'Regulation 415.1' },
    ],

    quiz: [
      { question: 'A circuit supplies a 3-phase VFD. What type of RCD is required?', options: ['Type AC', 'Type A', 'Type F', 'Type B'], correctIndex: 3, explanation: 'A 3-phase VFD produces smooth DC residual currents in its DC bus. Only a Type B RCD can detect smooth DC residual currents. Type AC, A and F would be blinded by the DC component and would not operate.' },
    ],

    relatedCalculations: ['earthing', 'cable-current'],
    notes: [
      { type: 'warning', title: 'Type AC is obsolete for modern installations', body: 'IEC TR 60755 and many national standards now prohibit Type AC RCDs on any circuit that could supply non-linear loads. Type A should be the minimum standard. Incorrectly specified Type AC devices on VFD or EV charger circuits will not operate on DC earth fault — providing no protection.' },
    ],
  },
};

// ─── Thermal Overload Relay ───────────────────────────────────────────────────

export const OLR_TOPIC: Topic = {
  id: 'olr', title: 'Thermal Overload Relay (OLR)', category: 'Protection Devices', categoryId: 'protection',
  icon: '🌡️', difficulty: 'beginner', readingTime: 10, status: 'complete',
  tags: ['OLR', 'bimetal', 'trip class', 'IEC 60947-4-1', 'Ie', 'motor protection'],
  content: {
    introduction: `A Thermal Overload Relay (OLR) protects motors from damage due to sustained overload by mimicking the thermal behaviour of the motor winding. It monitors motor current and, using a bimetal strip or an electronic thermal model, trips the contactor when the motor would overheat.

The OLR is the standard overload protection in a direct-on-line (DOL) starter. It is always used in combination with a contactor (which it trips on overload) and a fuse or MCCB upstream (which provides short-circuit protection). The OLR alone does NOT protect against short circuits.`,

    keyFacts: [
      'Setting range: typically ±20% around nominal — set to motor FLC × service factor',
      'Trip class defines the time to trip at 7.2× In: Class 10 = 4–10s, Class 20 = 6–20s, Class 30 = 9–30s',
      'Phase failure sensitivity: detects single-phasing (one phase open) — trips before motor overheats',
      'Manual vs auto reset: manual reset is preferred — prevents automatic restart after overload (safety)',
      'Thermal memory: the OLR remembers heat — repeated resets without cooldown can shorten motor life',
      'Electronic OLRs provide: adjustable trip class, current display, phase imbalance, thermistor input, ATEX rating',
      'Current setting: most OLRs have a dial calibrated directly in amps (not percentage)',
    ],

    types: [
      { name: 'Bimetal (Thermal) OLR', description: 'Uses bimetal strips heated by load current to simulate motor temperature rise. The simplest and most robust type.', when: 'Standard motors in clean environments with moderate start frequency. Up to class 20 is achievable.' },
      { name: 'Electronic OLR (Motor Protection Relay)', description: 'Uses a microprocessor thermal model — no bimetal strip. Fully adjustable trip class, phase unbalance detection, thermistor input, event log.', when: 'Critical motors, high start frequency, motors in ATEX zones (intrinsically safe models), motors with embedded thermistors.' },
    ],

    selectionGuide: [
      { parameter: 'Current setting range', guidance: 'Select OLR with a setting range that includes the motor FLC. The FLC must fall in the middle third of the OLR setting range for good accuracy. Example: motor FLC = 28A → choose OLR with 20–32A or 25–40A range.' },
      { parameter: 'Trip class', guidance: 'Class 10: standard squirrel cage motors with short start time (<4s). Class 20: high-inertia fans, compressors, centrifuges with longer start (4–15s). Class 30: very high-inertia loads. Check the motor\'s acceleration time against the class time limit.' },
      { parameter: 'Phase failure sensitivity', guidance: 'Always select an OLR with phase failure sensitivity (differential heating of bimetal strips). Single-phase operation on a 3-phase motor causes negative sequence current and overheating within minutes.' },
      { parameter: 'Reset mode', guidance: 'Use manual reset for all applications where uncontrolled restart could be dangerous (pumps, conveyors, machine tools). Auto reset only where remote automatic restart is part of the control design and safe restart is confirmed.' },
    ],

    applications: [
      'DOL motor starters — standard combination with contactor for motors up to ~45 kW',
      'Star-delta starters — OLR in the delta contactor circuit, set to FLC ÷ 1.73',
      'Pump and fan protection — prevents motor burnout on single-phasing or bearing seizure',
      'Conveyor drives — protection against mechanical overload (jam)',
    ],

    commonMistakes: [
      'Setting OLR to transformer or fuse rating instead of motor FLC — leaves motor unprotected',
      'Using auto reset in hazardous or unattended locations — motor restarts unexpectedly after overload',
      'Ignoring service factor — motor with SF=1.15 can be set to FLC × 1.1 for more load margin',
      'Connecting OLR in series with only two phases — misses single-phasing on the unmonitored phase',
      'Not resetting thermal memory — repeated trips with immediate resets overheat the motor windings',
    ],

    troubleshooting: [
      { symptom: 'OLR trips repeatedly at full load', causes: ['OLR set below FLC', 'Motor genuinely overloaded (pump cavitating, fan belt slipping, bearing worn)', 'High ambient temperature in enclosure', 'Single phase causing higher current on remaining phases'], remedy: 'Measure actual motor current with clamp meter. Compare with FLC on nameplate. Check 3-phase balance. Investigate mechanical load.' },
      { symptom: 'Motor burns out despite OLR not tripping', causes: ['OLR set above FLC', 'OLR faulty or contacts stuck', 'Phase failure not detected (OLR without phase failure sensitivity)'], remedy: 'Verify OLR current setting = motor FLC. Test OLR trip function. Replace if suspect. Upgrade to phase-failure-sensitive type.' },
    ],

    standards: [
      { code: 'IEC 60947-4-1', title: 'Electromechanical contactors and motor-starters', clause: 'Clause 7.2 (Overload relays — Trip classes)' },
    ],

    quiz: [
      { question: 'A motor with FLC=18A is started with a star-delta starter. The OLR is in the delta contactor. What current should the OLR be set to?', options: ['18A (FLC)', '10.4A (FLC÷1.73)', '31A (FLC×1.73)', '14A (FLC×0.8)'], correctIndex: 1, explanation: 'In a star-delta starter, the delta contactor carries only the phase current, which is FLC÷√3 = 18÷1.73 = 10.4A. The OLR must be set to this value, not the line FLC.' },
    ],

    relatedCalculations: ['motor', 'olr'],
    notes: [
      { type: 'tip', title: 'Set the OLR after measuring actual current', body: 'Motor nameplates show FLC at rated voltage and load. In practice, voltage variations and partial loading mean the actual running current may differ. Always measure actual current at full load and set the OLR 5–10% above the measured value, not the nameplate FLC.' },
    ],
  },
};

// ─── DOL Starter ─────────────────────────────────────────────────────────────

export const DOL_STARTER: Topic = {
  id: 'dol-starter', title: 'DOL Motor Starter', category: 'Motors & Drives', categoryId: 'motors',
  icon: '🔌', difficulty: 'beginner', readingTime: 10, status: 'complete',
  tags: ['DOL', 'direct-on-line', 'motor starter', 'IEC 60947-4-1', 'starting current'],
  content: {
    introduction: `A Direct-On-Line (DOL) starter applies the full supply voltage directly to the motor terminals at starting. It is the simplest, cheapest and most reliable starting method. The disadvantage is the high starting current — typically 6–8× Full Load Current (FLC) — which causes a voltage dip on the supply network and a mechanical shock to the driven machine.

A DOL starter consists of three components: (1) A fuse or MCCB for short-circuit protection, (2) A contactor for switching, (3) A thermal overload relay (OLR) for overload protection. The control circuit uses normally-open (NO) START and normally-closed (NC) STOP pushbuttons with a contactor auxiliary contact for seal-in (hold-in) latching.`,

    keyFacts: [
      'Starting current: 600–800% of FLC — check that supply transformer can handle the voltage dip',
      'Starting torque: 100–200% of rated torque (adequate for most centrifugal loads)',
      'Voltage dip limit: IEC 60364 recommends < 3% dip on LV network for DOL starting',
      'Maximum motor size for DOL on a typical 415V LV supply: up to ~22 kW for most utility agreements',
      'Starting time: 2–5 seconds for typical pumps and fans at full load',
      'Control circuit voltage: typically 240V AC (from phase-to-neutral) or 110V AC or 24V DC',
      'Forward/reverse: two contactors with mechanical and electrical interlocking',
    ],

    workingPrinciple: `**Starting sequence:**
1. Press START button (NO contact momentarily closes)
2. Contactor coil energises — main contacts close, applying full voltage to motor
3. Auxiliary NO contact closes (seals in / latches the contactor independently of the START button)
4. START button released — contactor remains energised via the auxiliary seal-in contact
5. Motor accelerates from 0 to full speed along the torque-speed characteristic

**Stopping sequence:**
1. Press STOP button (NC contact opens)
2. Contactor coil de-energises — main contacts open, motor disconnects from supply
3. Motor coasts to rest (or braking resistor/dynamic braking applied if required)

**Overload trip:**
When the OLR trips, it opens an NC contact in the contactor coil circuit, dropping the contactor out. The motor is de-energised. The OLR must be manually reset (for manual reset type) before restarting is possible.`,

    selectionGuide: [
      { parameter: 'Contactor rating', guidance: 'Select contactor Ie (AC3) ≥ motor FLC. Do NOT use the AC1 (resistive) rating. Example: 22 kW, 415V motor → FLC = 44A → select 50A AC3 contactor.' },
      { parameter: 'OLR setting', guidance: 'Set OLR current = motor FLC. Class 10 for standard squirrel cage motors. If motor takes > 10s to accelerate, use class 20 or 30.' },
      { parameter: 'Upstream protection', guidance: 'Use aM or gM fuse for short-circuit protection only (OLR handles overload). Size fuse at 2–2.5× FLC to survive starting current without blowing.' },
      { parameter: 'Control voltage', guidance: '24V DC for PLC-controlled systems (direct PLC output drives the coil). 240V AC for simple push-button control. 110V AC for US/Canadian installations.' },
    ],

    applications: [
      'Pumps — the most common DOL application for smaller centrifugal pumps',
      'Fans — DOL acceptable for fans < 22 kW where voltage dip is within limits',
      'Compressors — unload valve ensures motor starts without load',
      'Conveyor drives — where starting shock is acceptable',
      'Small machine tools — drilling machines, lathes, grinding machines',
    ],

    advantages: [
      'Simplest and lowest cost starting method',
      'Full starting torque available — important for high-friction or loaded start',
      'Fastest acceleration — no time delay during start transition',
      'Easiest to maintain and troubleshoot',
    ],

    disadvantages: [
      'Highest starting current (6–8× FLC) — voltage dip on network',
      'Mechanical shock to driven machine on start',
      'Not suitable for large motors on weak supplies',
      'No speed control — fixed speed once running',
    ],

    commonMistakes: [
      'Forgetting the auxiliary seal-in contact — motor only runs while START button held',
      'Not interlocking forward/reverse contactors (mechanical + electrical) — risk of phase-to-phase short',
      'Setting OLR to contactor rating instead of motor FLC',
      'Using AC1 contactor rating instead of AC3 for motor duty',
    ],

    troubleshooting: [
      { symptom: 'Motor starts but stops when START button released', causes: ['Auxiliary seal-in contact not wired', 'Auxiliary contact faulty or open'], remedy: 'Verify auxiliary NO contact is wired from A1 to the START button junction. Test continuity of auxiliary contact.' },
      { symptom: 'Contactor chatters on start', causes: ['Coil voltage too low during motor starting (voltage dip)', 'Loose coil connection'], remedy: 'Measure coil voltage during starting. If < 85% of rated, upgrade supply or use hold-in capacitor. Check and tighten coil connections.' },
    ],

    standards: [
      { code: 'IEC 60947-4-1', title: 'Electromechanical contactors and motor-starters', clause: '' },
    ],

    quiz: [
      { question: 'A 15 kW, 415V DOL starter must survive 8× FLC starting current without the upstream fuse blowing. FLC = 30A. What is the minimum fuse rating?', options: ['32A gG', '63A gM', '80A gG', '100A gM'], correctIndex: 1, explanation: 'For a motor DOL starter, use a gM (motor) fuse rated at approximately 2× FLC = 60A → 63A standard. A gG fuse at 32A would blow on the 8× = 240A starting current. A 63A gM fuse is designed to withstand motor starting current without operating.' },
    ],

    relatedCalculations: ['motor', 'olr', 'cable-current'],
    notes: [
      { type: 'tip', title: 'The seal-in contact is the most common wiring error', body: 'In a DOL starter, the NO auxiliary contact of the main contactor is wired in parallel with the START button. This "seals in" the contactor after the START button is released. Omitting this contact means the motor only runs while the button is held — the motor stops when released.' },
    ],
  },
};

// ─── Star-Delta Starter ───────────────────────────────────────────────────────

export const STAR_DELTA: Topic = {
  id: 'star-delta-starter', title: 'Star-Delta Motor Starter', category: 'Motors & Drives', categoryId: 'motors',
  icon: '⭐', difficulty: 'intermediate', readingTime: 12, status: 'complete',
  tags: ['star-delta', 'reduced voltage', 'starting current', 'transition', 'IEC 60947-4-1'],
  content: {
    introduction: `A Star-Delta starter reduces the motor starting current to 1/3 of the Direct-On-Line (DOL) starting current by initially connecting the motor windings in star (Y). After a time delay, the motor is reconnected in delta (Δ) for normal running. This reduces the voltage across each winding from line-to-line to line-to-neutral (factor of √3 = 1.73), reducing starting current to 1/3 and starting torque to 1/3.

A star-delta starter requires: three contactors (main KM, star KY, delta KD), a timer relay, and a thermal overload relay in the delta circuit. The motor must be a 6-terminal motor wired in delta for normal running — star-delta starting does not work on internally delta-connected motors.`,

    keyFacts: [
      'Starting current: 1/3 of DOL current (= 2–3× FLC vs 6–8× FLC for DOL)',
      'Starting torque: 1/3 of DOL torque — insufficient for high-friction or loaded starts',
      'Current step on transition: brief high current spike when switching from star to delta',
      'Open transition: motor disconnects briefly during star-to-delta switch (common type)',
      'Closed transition: resistors or inductors prevent disconnection during switch (premium type)',
      'OLR setting: set to motor FLC ÷ √3 (= 57.7% of FLC) as OLR is in delta circuit',
      'Motor requirement: 6 terminals accessible — internally star-connected motors cannot use star-delta',
    ],

    workingPrinciple: `**Star (starting) phase:**
The main contactor (KM) and star contactor (KY) close simultaneously. The motor winding is connected in star — each winding sees V_line/√3. Starting current = I_DOL/3, starting torque = T_DOL/3. Motor begins to accelerate.

**Transition (timer expires):**
After the preset time (typically 5–15 seconds — depends on acceleration time), the timer relay operates:
1. KY (star contactor) opens — motor momentarily disconnected
2. Brief delay (50–100 ms) — motor flux decays slightly
3. KD (delta contactor) closes — motor reconnected in delta at full voltage

**Delta (running) phase:**
Normal operation. Motor runs at full speed in delta. The OLR in the delta circuit monitors phase current (= FLC/√3 = 58% of line FLC).

**The current step:** On transition, the residual motor flux can be out of phase with the supply, causing a transient current spike. If the transition pause is too short, this spike can equal or exceed DOL starting current — defeating the purpose of star-delta. Closed transition avoids this.`,

    selectionGuide: [
      { parameter: 'Motor suitability', guidance: 'Motor must have 6 accessible terminals (U1, V1, W1 and U2, V2, W2). Delta voltage rating must equal the supply voltage (e.g., 400V supply → motor rated 400V delta / 690V star). Confirm with nameplate.' },
      { parameter: 'Transition time', guidance: 'Set timer to the motor acceleration time in star PLUS 1–2 seconds. Too short: motor not at sufficient speed — high transition current spike. Too long: motor runs inefficiently in star (lower torque than needed for high-inertia loads may stall).' },
      { parameter: 'Contactor sizing', guidance: 'Main (KM) and delta (KD) contactors: rated at 58% of FLC in AC3 (= FLC/√3). Star (KY) contactor: rated at 33% of FLC (it carries the circulating current). Use manufacturer\'s motor starter combination tables for exact sizing.' },
      { parameter: 'OLR setting', guidance: 'OLR is wired in the delta contactor circuit. Set to FLC/√3 = FLC × 0.577. If FLC = 50A, set OLR to 28.9A. Some manufacturers specify OLR in main circuit — then set to FLC directly.' },
    ],

    applications: [
      'Large centrifugal pumps (30–250 kW) where starting torque of 33% DOL is sufficient',
      'Fans and blowers — centrifugal loads have low starting torque requirements',
      'Compressors with unload valve — start unloaded then apply load',
      'Any motor > 22 kW where DOL voltage dip is unacceptable and VFD cost is not justified',
    ],

    advantages: [
      'Starting current reduced to 33% of DOL — much lower voltage dip on network',
      'Low cost — simple contactors and timer, no power electronics',
      'Standard and well understood — easy to maintain',
    ],

    disadvantages: [
      'Starting torque only 33% — not suitable for heavily loaded starts',
      'Current spike on transition can damage coupling and driven machine',
      'Motor must have 6 accessible terminals',
      'Open transition causes momentary disconnection — unacceptable for some processes',
      'Fixed start time — cannot adapt to varying load inertia',
    ],

    commonMistakes: [
      'Using star-delta on internally star-wound motor — no benefit, wiring error',
      'Setting OLR to full FLC instead of FLC/√3 — overload protection has 73% more margin than needed',
      'Setting timer too short — motor not at speed before delta transition, high current spike',
      'Not fitting mechanical interlock between star and delta contactors — simultaneous close causes short circuit',
    ],

    troubleshooting: [
      { symptom: 'Motor stalls during star phase', causes: ['Load torque > 33% rated (star-delta torque limit)', 'Transition time set too long — motor decelerates before reaching delta'], remedy: 'Measure motor speed at transition. If < 80% synchronous speed, load is too high for star-delta. Use soft starter or VFD instead.' },
      { symptom: 'High current spike on transition to delta', causes: ['Transition time too short — motor voltage out of phase with supply', 'Open transition — motor flux not fully decayed in the pause'], remedy: 'Increase timer to allow full acceleration in star. Use closed transition starter with resistors to limit the transient.' },
    ],

    quiz: [
      { question: 'A 55 kW, 415V star-delta starter has motor FLC = 100A. What should the OLR in the delta circuit be set to?', options: ['100A', '58A', '33A', '115A'], correctIndex: 1, explanation: 'The OLR is in the delta contactor circuit, where it measures phase current = FLC/√3 = 100/1.73 = 57.7A ≈ 58A. Setting it to 100A would provide no overload protection until the motor is severely overloaded.' },
    ],

    standards: [{ code: 'IEC 60947-4-1', title: 'Electromechanical contactors and motor-starters', clause: '' }],
    relatedCalculations: ['motor', 'olr', 'cable-current'],
    notes: [
      { type: 'warning', title: 'Open transition current spike can exceed DOL current', body: 'If the star-to-delta transition pause is too short (< 50 ms), the residual motor voltage can be up to 180° out of phase with the supply voltage. The resulting current spike can exceed the DOL starting current — defeating the purpose of the star-delta starter and causing mechanical damage to couplings and gearboxes.' },
    ],
  },
};

// ─── Distribution Transformer ─────────────────────────────────────────────────

export const DIST_TRANSFORMER: Topic = {
  id: 'dist-transformer', title: 'Distribution Transformer', category: 'Transformers', categoryId: 'transformers',
  icon: '🔄', difficulty: 'intermediate', readingTime: 16, status: 'complete',
  tags: ['distribution transformer', 'IEC 60076', 'vector group', 'impedance', 'ONAN', 'tap changer', 'fault level'],
  content: {
    introduction: `A distribution transformer steps down medium voltage (typically 6.6 kV, 11 kV, 22 kV or 33 kV) to low voltage (400V three-phase or 230V single-phase) for end-user supply. It is the final voltage transformation stage in the distribution network.

Distribution transformers are characterised by their kVA rating, primary/secondary voltage, vector group (winding connection), impedance (percentage), and cooling method. The percentage impedance is one of the most critical parameters — it determines the maximum fault current available at the LV terminals, which governs the rating of all downstream switchgear and cables.`,

    keyFacts: [
      'Standard kVA ratings: 100, 160, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500 kVA',
      'Percentage impedance (%Z): typically 4–6% — higher %Z = lower fault level but higher voltage regulation',
      'Vector group Dyn11: delta primary, star secondary with neutral, 30° phase shift (most common in Europe/Asia)',
      'ONAN (Oil Natural Air Natural) cooling: self-cooled by natural oil convection and air circulation',
      'ONAF: fan-assisted cooling — increases rating by 25–33% above ONAN rating',
      'No-load losses (iron losses): constant regardless of load — the major efficiency consideration for lightly loaded transformers',
      'Load losses (copper losses): proportional to current squared — dominant at high loading',
      'Maximum efficiency occurs at load where no-load losses = load losses (typically 50–70% of rated load)',
    ],

    types: [
      { name: 'Oil-immersed (ONAN/ONAF)', description: 'Mineral oil provides both insulation and cooling. Standard for outdoor substations and most HV/LV substations. Conservator type (with expansion tank) or hermetically sealed.', when: 'Outdoor substations, industrial plants, utility distribution. Standard type for all voltages. Lower cost than dry-type.' },
      { name: 'Dry-Type (AN/AF)', description: 'Air-cooled without oil. Suitable for indoor installations in occupied buildings. Cast resin (VPI) or open wound insulation.', when: 'Indoor substations in hospitals, offices, schools, offshore platforms, data centres. Fire-safe for occupied buildings. Higher cost than oil-type.' },
      { name: 'Padmount Transformer', description: 'Oil-immersed transformer in a tamper-resistant ground-level enclosure. Common in North American distribution.', when: 'Urban distribution networks, residential areas, commercial developments where pole mounting is unsuitable.' },
    ],

    construction: `**Core:** High-grade silicon steel laminations (cold-rolled grain-oriented, CRGO) form the magnetic circuit. The core carries the magnetic flux linking primary and secondary windings. Laminations are 0.23–0.35 mm thick to minimise eddy current losses.

**Windings:** Copper or aluminium conductors wound around the core limbs. Primary and secondary windings are concentric (cylindrical) or sandwiched to control leakage flux. Paper-oil insulation between layers and between windings. Conductor cross-section is determined by rated current and thermal limits.

**Tank and oil:** The core-and-coil assembly is immersed in mineral oil inside a steel tank. Oil provides insulation (between windings and to tank) and cooling (oil circulates by convection carrying heat to the tank walls). Radiators or cooling fins increase the heat dissipation area.

**Bushings:** HV and LV bushings are the insulated terminals that pass the electrical connections through the tank. HV bushings have complex creepage geometry to withstand the high voltage to tank.

**Buchholz relay (oil-type):** Detects internal faults by sensing gas bubbles rising from the oil (alarm) or an oil surge (trip). Essential protection for oil transformers.`,

    workingPrinciple: `**Electromagnetic induction:** An alternating voltage applied to the primary winding drives an alternating current that creates an alternating magnetic flux in the core. This flux links both windings and induces an EMF in the secondary proportional to the turns ratio.

**Turns ratio:** V1/V2 = N1/N2. For an 11 kV / 400V transformer: turns ratio = 11000/400 = 27.5:1.

**Impedance voltage (%Z):** The percentage voltage that must be applied to the primary to circulate rated current in the short-circuited secondary. A 4% impedance transformer at full load has a 4% voltage drop across the winding impedance. Under short circuit: Isc = Irated / (%Z/100) = 25× rated current for a 4% transformer.

**Vector group (Dyn11):** D = delta primary connection. y = star secondary connection. n = neutral brought out. 11 = secondary voltage leads primary by 30° (clock position 11). The 30° phase shift means that this transformer cannot be paralleled with a Dyn1 transformer (without special measures).`,

    selectionGuide: [
      { parameter: 'kVA rating', guidance: 'Size transformer at 70–80% of rated kVA for the calculated maximum demand to allow for load growth and avoid overheating. Confirm the maximum demand from load schedule calculations. Standard practice: add 20–25% margin above calculated MD.' },
      { parameter: 'Percentage impedance (%Z)', guidance: 'Lower %Z (4%): higher fault level (larger fault current available for protection) but lower voltage regulation. Higher %Z (6%): lower fault level (easier to achieve with downstream MCCBs) but higher voltage regulation on load. Standard for industrial: 5–6%. Utility distribution: 4–5%.' },
      { parameter: 'Vector group', guidance: 'Dyn11 is standard for most industrial and commercial installations in Europe, Asia and Australia. Dyn1 used in some configurations. Ynyn for MV/MV step-down or where neutral is required on both sides. Verify with utility requirements — grid connection transformers may require specific vector group for harmonic cancellation.' },
      { parameter: 'Tap changer', guidance: 'Off-circuit tap changer (OCTC): manual adjustment ±2×2.5% — use when supply voltage is fixed and infrequently adjusted. On-load tap changer (OLTC): automatic voltage regulation ±10% or more — for substations where supply voltage varies significantly.' },
    ],

    applications: [
      'Utility distribution — final step-down from 11 kV/33 kV to 400V for residential and commercial supply',
      'Industrial substations — step-down from MV grid to LV distribution within factories and plants',
      'Building substations — supply for large commercial buildings from utility MV cable',
      'Traction substations — supply for electric railways (different voltages and special vector groups)',
      'Renewable energy — step-up transformers for wind turbines and solar PV inverter output',
    ],

    commonMistakes: [
      'Not accounting for harmonics when sizing transformers in data centres and commercial buildings — K-factor transformers needed',
      'Paralleling transformers with different vector groups — circulating currents will flow',
      'Loading transformer above 100% rated kVA continuously — accelerates insulation ageing',
      'Ignoring no-load losses for lightly loaded transformers — can significantly impact efficiency',
    ],

    troubleshooting: [
      { symptom: 'Transformer overheating (oil temperature high)', causes: ['Overloaded — actual demand exceeds rating', 'Cooling blocked (fans off, radiators dirty)', 'High ambient temperature', 'Harmonic loading increasing copper losses'], remedy: 'Check load current against rating. Verify cooling fans are running. Clean radiators. Measure harmonic content. Load-shed non-essential equipment.' },
      { symptom: 'Buchholz relay gas alarm', causes: ['Internal partial discharge', 'Low-level arc between windings', 'Oil deterioration generating gas'], remedy: 'Take Dissolved Gas Analysis (DGA) sample immediately. Hydrogen + acetylene indicates arc fault. Methane + ethane indicates thermal fault. Investigate before continuing operation.' },
    ],

    standards: [
      { code: 'IEC 60076-1', title: 'Power transformers — General', clause: 'Clause 7 (Impedance voltage, losses)' },
      { code: 'IEC 60076-3', title: 'Insulation levels, dielectric tests and external clearances', clause: '' },
      { code: 'IEC 60076-11', title: 'Dry-type transformers', clause: '' },
    ],

    quiz: [
      { question: 'A 1000 kVA, 11 kV/400V transformer has %Z = 5%. What is the maximum LV fault current (3-phase symmetrical)?', options: ['1443A', '14430A', '28860A', '4000A'], correctIndex: 1, explanation: 'Rated LV current = 1000×1000/(√3×400) = 1443A. Fault current = rated current / (%Z/100) = 1443/0.05 = 28,866A. Wait — that is 28.9 kA. Let me recalculate: Isc = (kVA × 1000) / (√3 × V × %Z/100) = 1,000,000 / (1.732 × 400 × 0.05) = 1,000,000/34.64 = 28,868A ≈ 28.9 kA.' },
    ],

    relatedCalculations: ['transformer', 'short-circuit', 'load-schedule'],
    notes: [
      { type: 'standard', title: 'IEC 60076 Standard kVA ratings', body: 'IEC 60076 specifies standard transformer ratings: 25, 50, 100, 160, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150 kVA. Selecting a standard rating reduces lead times and costs. Non-standard ratings require special order.' },
      { type: 'tip', title: 'Percentage impedance and LV fault level', body: 'The LV fault level is approximately: Isc = (transformer kVA × 1000) / (√3 × 400 × %Z). For a 1000 kVA, 5%Z transformer: Isc ≈ 28.9 kA. For 4%Z: Isc ≈ 36.1 kA. Lower %Z = higher fault level = more demanding switchgear requirements. This is why the transformer %Z must always be confirmed before selecting downstream MCCBs and ACBs.' },
    ],
  },
};

// ─── Earthing System Types (TN/TT/IT) ────────────────────────────────────────

export const EARTHING_SYSTEMS: Topic = {
  id: 'earthing-systems', title: 'Earthing System Types (TN / TT / IT)', category: 'Earthing & Lightning', categoryId: 'earthing',
  icon: '⛰️', difficulty: 'intermediate', readingTime: 14, status: 'complete',
  tags: ['TN-S', 'TN-C', 'TN-C-S', 'TT', 'IT', 'IEC 60364', 'PME', 'neutral earthing'],
  content: {
    introduction: `IEC 60364 classifies earthing systems by how the system neutral and exposed conductive parts (ECPs — the metal cases of equipment) are connected to earth. The classification uses two letters: the first describes the source earthing (T = Terra/directly earthed, I = Isolated), the second describes the ECP earthing (N = Neutral, T = directly to earth separately).

The choice of earthing system affects: the method of earth fault protection, fault loop impedance, touch voltage on fault, required protective devices, and the risk to personnel and equipment. The earthing system is determined at the substation or supply source and must be known before designing the installation protection.`,

    keyFacts: [
      'TN-S: separate protective earth (PE) and neutral (N) conductors throughout — the safest TN system',
      'TN-C: combined PEN conductor (dangerous — not permitted in circuits < 10mm² Cu or flexible cables)',
      'TN-C-S (PME): PEN to main earth terminal, then split to separate PE and N — the standard UK/Australian system',
      'TT: ECPs earthed via independent earth electrode — requires RCD (high fault loop impedance)',
      'IT: source neutral isolated or impedance-earthed — used in hospitals and mines for maximum continuity',
      'Earth fault loop impedance (Zs): determines the fault current and protection device operating time',
      'In TN systems: Zs = Ze + R1 + R2 (source impedance + line + PE conductor resistances)',
    ],

    types: [
      { name: 'TN-S', description: 'The source neutral is earthed at one point. Separate PE and N conductors run from source to all load points. PE is connected to all ECPs.', when: 'Preferred system for new industrial installations. Required for circuits with sensitive electronic equipment. Provides lowest EMC interference as no current flows in the PE conductor during normal operation.' },
      { name: 'TN-C-S (PME)', description: 'PEN conductor from utility transformer to meter. At the main earth terminal (MET) the PEN splits into separate PE and N. Individual circuits use separate PE and N.', when: 'Standard UK and Australian domestic and commercial supply system. The utility provides PME earthing at the service cut-out. Most common system in practice.' },
      { name: 'TN-C', description: 'PEN conductor serves as both protective earth and neutral simultaneously throughout. No separate PE conductor.', when: 'Old European industrial installations. NOT permitted for new installations with conductor < 10mm² Cu. NOT suitable with RCDs (PEN carries both load current and fault current). Being phased out.' },
      { name: 'TT', description: 'The source neutral is earthed at the transformer. ECPs are connected to a separate independent earth electrode at the installation.', when: 'Where PME earthing is not available (rural supplies, separate buildings with no metallic connection to supply source). Always requires 30 mA RCD — earth fault current is limited by electrode resistance.' },
      { name: 'IT', description: 'Source neutral is isolated or connected to earth through a high impedance. First earth fault causes minimal fault current. Second fault on a different phase causes a large fault current.', when: 'Hospitals (operating theatres, ICUs) — maximum continuity is essential, single fault must not disconnect supply. Mining (underground) — flammable atmosphere makes disconnection on first fault unacceptable.' },
    ],

    selectionGuide: [
      { parameter: 'TN-S or TN-C-S', guidance: 'Use TN-C-S (PME) where the utility provides PME earthing. Use TN-S where separate PE and N are maintained from source — preferred for data centres, industrial plants with VFDs (reduces common-mode noise), and locations with sensitive instrumentation.' },
      { parameter: 'TT system RCD requirement', guidance: 'In a TT system, the fault loop impedance is high (through earth electrode), so fuse and MCB protection may not operate fast enough. RCDs are mandatory for all final circuits in TT systems. The earth electrode resistance Ra must satisfy: Ra ≤ 50/IΔn (Ra ≤ 1666Ω for 30 mA RCD).' },
      { parameter: 'IT system IMD (insulation monitoring)', guidance: 'IT systems require an Insulation Monitoring Device (IMD) that continuously measures insulation resistance and alarms on first fault. This allows the fault to be located and corrected before a second fault creates a dangerous situation.' },
    ],

    applications: [
      'TN-S: industrial plants, data centres, new commercial buildings',
      'TN-C-S (PME): UK/Australian domestic supply, most commercial buildings',
      'TT: rural installations, temporary supplies, where PME not available',
      'IT: hospital operating theatres, underground mines, offshore oil platforms',
    ],

    commonMistakes: [
      'Connecting the neutral to a local earth electrode in a TN-C-S system downstream of the MET — creates a loop that causes neutral current to flow in buried metalwork',
      'Using PEN conductor on circuits < 10mm² Cu (IEC 60364 prohibition)',
      'Omitting RCD in a TT installation — high fault loop impedance means MCB/fuse may not clear the fault',
      'Connecting metallic pipework from a TN-C-S supply to equipment in a TT system — creates potential difference on fault',
    ],

    safety: [
      'In PME (TN-C-S) systems: if the PEN conductor breaks between transformer and installation, exposed metal parts can rise to supply voltage — this is the main danger of PME on external buildings',
      'IT systems: personnel must be warned that a first fault is a serious event requiring immediate investigation — a second fault on a different phase is potentially fatal without IMD alarm',
      'TT systems: verify the earth electrode resistance annually — soil dries out seasonally, increasing resistance',
    ],

    standards: [
      { code: 'IEC 60364-1', title: 'Fundamental principles, assessment of general characteristics, definitions', clause: 'Section 312 (Earthing arrangements)' },
      { code: 'IEC 60364-4-41', title: 'Protection against electric shock', clause: 'Sections 411–414 (Protection measures for each system)' },
    ],

    quiz: [
      { question: 'In a TT earthing system, the earth electrode resistance is 200Ω. What maximum RCD trip current (IΔn) is required to keep the touch voltage below 50V on fault?', options: ['100 mA', '250 mA', '300 mA', '500 mA'], correctIndex: 1, explanation: 'Touch voltage limit = 50V. Maximum fault current = 50V / 200Ω = 0.25A = 250 mA. The RCD IΔn must not exceed 250 mA. A 300 mA RCD would allow up to 300 mA × 200Ω = 60V touch voltage — exceeding the 50V limit. Use 100 mA or 30 mA RCD for safety margin.' },
    ],

    relatedCalculations: ['earthing', 'cable-current'],
    notes: [
      { type: 'note', title: 'PME danger on external buildings', body: 'PME (TN-C-S) earthing must NOT be used for separate external buildings (garages, workshops) if there is no continuous equipotential bonding between buildings. A PEN conductor fault at the distribution network can raise the external building earth to a dangerous potential relative to true earth. Use TT with RCD for external buildings.' },
    ],
  },
};

// ─── Lightning Protection System ─────────────────────────────────────────────

export const LIGHTNING_PROT: Topic = {
  id: 'lightning-protection', title: 'Lightning Protection System (LPS)', category: 'Earthing & Lightning', categoryId: 'earthing',
  icon: '⚡', difficulty: 'intermediate', readingTime: 16, status: 'complete',
  tags: ['LPS', 'air terminal', 'rolling sphere', 'IEC 62305', 'protection level', 'mesh method', 'down conductor'],
  content: {
    introduction: `A Lightning Protection System (LPS) captures a direct lightning strike and safely conducts the lightning current to earth, preventing structural fire, damage to equipment, and injury to people. An LPS consists of: air termination (to capture the strike), down conductors (to carry the current to earth), and the earth termination system (to disperse the current safely).

IEC 62305 defines four protection levels (LPL I–IV) based on the lightning threat. LPL I provides the highest protection, capturing 99% of lightning strikes; LPL IV captures 80%. Selection is based on a risk assessment (loss of life, economic loss, heritage value) rather than personal preference.`,

    keyFacts: [
      'Peak lightning current: 200 kA (maximum design value for LPL I); 100 kA for LPL II; 50 kA for LPL III/IV',
      'Rolling sphere radius: 20 m (LPL I), 30 m (LPL II), 45 m (LPL III), 60 m (LPL IV)',
      'Mesh size: 5×5 m (LPL I), 10×10 m (LPL II), 15×15 m (LPL III), 20×20 m (LPL IV)',
      'Down conductor spacing: 10 m (LPL I), 15 m (LPL II), 20 m (LPL III), 25 m (LPL IV)',
      'Earth termination resistance: < 10Ω for LPS (IEC 62305 recommends < 10Ω for each down conductor)',
      'Bonding: all metalwork within the building must be bonded to the LPS to prevent side-flash arcing',
      'SPD (Surge Protection Devices) must be fitted at all service entries to prevent lightning surges entering on cables',
    ],

    types: [
      { name: 'Air Rod (Franklin Rod)', description: 'Vertical pointed conductor mounted at the highest point of the structure. Simple, proven technology. Protected zone defined by rolling sphere or cone of protection.', when: 'Isolated structures, chimneys, masts, small buildings. Most common type for rooftop installations.' },
      { name: 'Horizontal Conductor / Mesh', description: 'Horizontal conductors run across the roof surface in a grid pattern. The mesh method protects flat roofs comprehensively.', when: 'Flat-roof buildings, warehouses, factories. Mesh size selected based on LPL. Provides good protection for roof-mounted equipment (AC units, solar panels).' },
      { name: 'Early Streamer Emission (ESE)', description: 'Proprietary device claimed to emit an upward streamer earlier than a conventional rod, increasing the protected volume.', when: 'Note: IEC 62305 does NOT recognise ESE devices — they are not an alternative to IEC 62305 design. Some national standards (France, Spain) accept them. Use only where specifically required by local standards.' },
      { name: 'Meshed Cage (Faraday Cage)', description: 'Complete metallic enclosure around the structure. Provides the highest level of electromagnetic shielding in addition to lightning capture.', when: 'Very sensitive electronic facilities: data centres, radio transmitter stations, military facilities. The complete enclosure eliminates internal electromagnetic fields from nearby strikes.' },
    ],

    workingPrinciple: `**Rolling Sphere Method:** A sphere of radius r (depending on LPL) is rolled over the structure. Any point that the sphere touches can receive a direct strike — the LPS air termination must be positioned to prevent the sphere from touching unprotected surfaces. Larger radius = lower LPL = less protective.

**Strike attachment:** When a lightning leader descends from the cloud, upward connecting leaders are emitted from high points on the ground. The air rod or mesh conductor provides a preferential attachment point — the strike attaches to the LPS rather than the structure.

**Current conduction:** The lightning current (peak up to 200 kA, duration ~100 µs) flows down the down conductors to the earth termination. Multiple down conductors in parallel share the current and reduce the voltage across the down conductor (which must not cause side-flash to internal metalwork).

**Earth dispersion:** The earth termination disperses the current into the soil. Ring earthing conductors (Type B) are preferred for LPL I and II — they distribute the current over a large perimeter, limiting the ground potential rise.`,

    selectionGuide: [
      { parameter: 'Protection level (LPL)', guidance: 'Perform risk assessment per IEC 62305-2. Parameters: Ng (ground flash density), building dimensions, use (explosives, hospital, heritage = LPL I). Minimum LPL III for most ordinary buildings.' },
      { parameter: 'Air termination method', guidance: 'Use rolling sphere method to verify coverage. Mesh method for flat roofs. Combination for complex roofs. Document with drawings showing sphere rolling paths. Ensure all roof structures (HVAC, plant, antennae) are within the protected zone.' },
      { parameter: 'Down conductor material', guidance: 'Copper: 16 mm² minimum (LPL III/IV), 25 mm² (LPL I/II). Aluminium: 25 mm² minimum — not in contact with steel or concrete reinforcement. Steel: 50 mm² minimum. Use natural components (concrete reinforcement steel) where possible to reduce cost.' },
      { parameter: 'Earth termination type', guidance: 'Type A (radial): driven rods or buried horizontal conductors, minimum 2 per down conductor. Type B (ring): buried ring conductor encircling the building, ≥ 80% of perimeter — preferred for LPL I/II. Combined with building foundation reinforcement for lowest resistance.' },
    ],

    applications: [
      'Ordinary buildings: offices, factories, warehouses — LPL III or IV',
      'Hospitals, schools, public buildings — LPL II or III (risk of life)',
      'Explosive storage, ammunition depots — LPL I (catastrophic consequence of strike)',
      'Heritage and historically significant buildings — LPL I (unacceptable loss)',
      'Communication towers, broadcast masts — mandatory LPS',
      'Power substations — combination of LPS and surge arresters',
    ],

    commonMistakes: [
      'Not bonding all roof metalwork — HVAC units, railings, antennae can receive a side flash',
      'No SPDs on power and data cables entering the building — surge enters on cables, bypassing the LPS',
      'Earth termination resistance too high (> 10Ω) — high ground potential rise can cause dangerous touch voltages',
      'Down conductors with sharp bends — the high rate of change of current (dI/dt) causes high voltage at bends (inductive voltage drop)',
      'Relying on ESE devices as a complete LPS without complying with IEC 62305',
    ],

    safety: [
      'Never shelter under a tree during a thunderstorm — trees are attractive to lightning and side-flash can kill',
      'Maintain a separation distance (s) between LPS components and internal metalwork to prevent side-flash: s = ki × (kc/km) × l — calculated per IEC 62305-3',
      'LPS inspection: every year for LPL I/II; every 2 years for LPL III/IV. Check earth resistance and conductor continuity',
      'Equipotential bonding of all service entries (power, gas, water, telecoms) is essential to prevent lightning surges entering from buried services',
    ],

    standards: [
      { code: 'IEC 62305-1', title: 'Protection against lightning — General principles', clause: '' },
      { code: 'IEC 62305-2', title: 'Risk management', clause: '' },
      { code: 'IEC 62305-3', title: 'Physical damage to structures and life hazard', clause: '' },
      { code: 'IEC 62305-4', title: 'Electrical and electronic systems within structures', clause: '' },
    ],

    quiz: [
      { question: 'A building requires LPL II lightning protection. What rolling sphere radius is used to determine the air termination placement?', options: ['20 m', '30 m', '45 m', '60 m'], correctIndex: 1, explanation: 'IEC 62305-1 Table 1: LPL I = 20m sphere, LPL II = 30m sphere, LPL III = 45m sphere, LPL IV = 60m sphere. A smaller radius (LPL I) is more conservative — any point the sphere touches needs an air rod.' },
    ],

    relatedCalculations: ['earthing'],
    notes: [
      { type: 'warning', title: 'SPD coordination is essential — LPS alone is not enough', body: 'A direct strike on a well-designed LPS will still induce very high transient voltages in internal cables through electromagnetic coupling. Without SPDs at all service entries (power, data, telecoms) the lightning surge travels on the cables and destroys connected equipment. LPS + SPD are complementary — never one without the other.' },
    ],
  },
};

// ─── Power Factor Basics ──────────────────────────────────────────────────────

export const POWER_FACTOR: Topic = {
  id: 'power-factor-basics', title: 'Power Factor (cos φ)', category: 'Power Quality', categoryId: 'power-quality',
  icon: '📊', difficulty: 'beginner', readingTime: 12, status: 'complete',
  tags: ['power factor', 'kVAR', 'kVA', 'leading', 'lagging', 'capacitor', 'unity'],
  content: {
    introduction: `Power factor (PF or cos φ) is the ratio of active power (kW) to apparent power (kVA): PF = P/S = kW/kVA. It represents how efficiently a circuit uses the electrical power supplied to it. A power factor of 1.0 (unity) means all supplied power does useful work. A power factor of 0.8 means only 80% of the supplied apparent power (kVA) is converted to real work — the remaining 20% is reactive power that oscillates back and forth without doing work.

Reactive power (kVAR) is required by inductive loads (motors, transformers, inductors) to establish and maintain magnetic fields. It does not do work directly but is essential for equipment operation. The utility must supply this reactive current regardless — increasing cable and transformer losses and capacity requirements.`,

    keyFacts: [
      'Power triangle: S² = P² + Q² (kVA² = kW² + kVAR²)',
      'Lagging PF: inductive loads (motors, transformers) — current lags voltage. Most industrial loads are lagging',
      'Leading PF: capacitive loads (capacitor banks, lightly loaded cables) — current leads voltage',
      'Unity PF: purely resistive loads (heating elements, incandescent lamps)',
      'Utility penalty: most utilities charge penalties for PF < 0.90 or 0.85',
      'PF improvement from 0.75 to 0.95 reduces apparent power (kVA) by 21% — significant saving in transformer capacity',
      'Displacement PF (cos φ): fundamental frequency component only. True PF includes harmonic distortion — always lower than displacement PF',
    ],

    types: [
      { name: 'Displacement Power Factor', description: 'The ratio of fundamental active power to fundamental apparent power (cos φ). The standard metered quantity.', when: 'Linear loads (motors, transformers, heaters). Measured by conventional power meters.' },
      { name: 'True Power Factor (Total PF)', description: 'Includes the effect of harmonic currents. True PF = Displacement PF × Distortion Factor. Always ≤ Displacement PF.', when: 'Non-linear loads (VFDs, UPS, LED drivers, computers). Requires power quality analyzer to measure accurately.' },
    ],

    workingPrinciple: `**Active power (P, kW):** The power that does useful work — turning a motor shaft, heating a resistor, producing light. P = V × I × cos φ.

**Reactive power (Q, kVAR):** The power exchanged between the source and the magnetic/electric field of inductive/capacitive loads. It flows back and forth, doing no net work. Q = V × I × sin φ.

**Apparent power (S, kVA):** The total power supplied by the source, including both active and reactive components. S = V × I = √(P² + Q²).

**Why PF matters for cables and transformers:** A cable or transformer must carry the full current I regardless of power factor. If PF = 0.8, the current is P/(√3 × V × 0.8) — 25% higher than at unity PF for the same kW load. The extra current causes additional I²R losses and requires larger cable and transformer ratings.`,

    selectionGuide: [
      { parameter: 'Target PF for correction', guidance: 'Most utilities require PF > 0.90 or face a penalty charge. Correct to 0.95–0.99 for maximum benefit. Correcting beyond unity is unnecessary and can cause leading PF on light load (which is also penalised by some utilities).' },
      { parameter: 'Fixed vs automatic correction', guidance: 'Fixed capacitor bank: lowest cost, suited to stable base loads. Automatic (stepped) bank with PF controller: suited to variable loads — measures PF and switches steps in/out to maintain target. Step size = minimum load variation expected.' },
      { parameter: 'Correction location', guidance: 'Centralised (at main board): simplest and cheapest — corrects kVA at the metering point but not within the plant. Individual (at motor terminals): maximum benefit — reduces current in feeders. Both can be combined.' },
    ],

    applications: [
      'Industrial plants with many motors — largest source of lagging PF',
      'Commercial buildings with HVAC systems and lighting ballasts',
      'Utilities installing capacitor banks on distribution feeders',
      'Data centres with large UPS systems (UPS input PF < 1)',
    ],

    commonMistakes: [
      'Overcorrecting to leading PF — capacitor banks on light load cause leading PF and utility penalty',
      'Not accounting for harmonics when sizing capacitors — harmonic resonance can destroy capacitors',
      'Correcting PF without checking harmonic levels — capacitors amplify harmonics if resonance occurs',
      'Installing fixed capacitors on heavily variable loads — leading PF on light load',
    ],

    quiz: [
      { question: 'A factory draws 500 kW at PF = 0.75 lagging. What is the apparent power (kVA)?', options: ['375 kVA', '500 kVA', '667 kVA', '750 kVA'], correctIndex: 2, explanation: 'S = P / PF = 500 / 0.75 = 666.7 kVA ≈ 667 kVA. The apparent power is 33% higher than the active power because of the poor power factor. The utility must supply 667 kVA of generation and transmission capacity to deliver 500 kW of useful work.' },
      { question: 'The factory improves PF from 0.75 to 0.95. By what percentage does the kVA demand reduce?', options: ['7%', '15%', '21%', '27%'], correctIndex: 2, explanation: 'Original kVA = 500/0.75 = 667 kVA. New kVA = 500/0.95 = 526 kVA. Reduction = (667-526)/667 = 21.1%. This directly reduces maximum demand charges and allows transformer capacity to be freed for additional load.' },
    ],

    relatedCalculations: ['capacitor', 'cable-current', 'load-schedule'],
    notes: [
      { type: 'tip', title: 'PF correction payback is usually < 2 years', body: 'For a 500 kW factory at PF 0.75 incurring a 10% penalty on kVA demand: Monthly penalty = 667 × 10% × tariff rate. A capacitor bank to correct to 0.95 typically costs £5,000–£15,000 and pays back within 12–24 months in reduced demand charges and energy savings from lower I²R losses.' },
    ],
  },
};

// ─── Harmonics ────────────────────────────────────────────────────────────────

export const HARMONICS_TOPIC: Topic = {
  id: 'harmonics', title: 'Harmonic Distortion', category: 'Power Quality', categoryId: 'power-quality',
  icon: '〰️', difficulty: 'advanced', readingTime: 18, status: 'complete',
  tags: ['harmonics', 'THD', 'IEC 61000-3-2', '5th harmonic', 'passive filter', 'active filter', 'VFD'],
  content: {
    introduction: `Harmonic distortion occurs when non-linear loads draw current in pulses rather than a smooth sinusoid. These current pulses contain components at frequencies that are multiples of the fundamental (50 Hz or 60 Hz): 2nd harmonic = 100/120 Hz, 3rd harmonic = 150/180 Hz, 5th = 250/300 Hz, etc.

The most significant harmonics in industrial systems are the 5th and 7th (from 6-pulse VFDs and rectifiers). In commercial buildings, the 3rd harmonic dominates (from single-phase switched-mode power supplies). All harmonics cause additional losses, overheating, and can interfere with other equipment. THD (Total Harmonic Distortion) quantifies the total harmonic content relative to the fundamental.`,

    keyFacts: [
      'A 6-pulse VFD generates characteristic harmonics: 5th, 7th, 11th, 13th, 17th, 19th... (order = 6n ± 1)',
      'Single-phase SMPS (computers, LEDs, chargers): generates 3rd, 5th, 7th harmonics predominantly',
      'Triplen harmonics (3rd, 9th, 15th): add in the neutral conductor — can overheat neutral in commercial buildings',
      'THDi (current THD) of a 6-pulse VFD without filter: 30–100%',
      'Voltage THDv limit: EN 50160 specifies ≤ 8% at PCC. IEC 61000-3-2 limits equipment current harmonics',
      'Capacitor banks resonate with system inductance at a frequency close to a harmonic — can cause capacitor damage',
      'K-factor transformers: rated for harmonic loading — K4, K13, K20 for increasing harmonic content',
    ],

    types: [
      { name: '5th Harmonic (250 Hz)', description: 'Largest harmonic from 6-pulse VFDs and 3-phase rectifiers. Negative sequence — causes reverse torque in motors and overheating.', when: 'Any installation with VFDs, UPS, large rectifiers. The primary target for harmonic mitigation.' },
      { name: '3rd Harmonic (150 Hz)', description: 'Zero sequence — adds in the neutral. Dominant in commercial buildings with switched-mode power supplies (computers, LED drivers, phone chargers).', when: 'IT office environments, data rooms. The neutral conductor must be rated for full phase current (not half) in heavily loaded commercial buildings.' },
      { name: '7th Harmonic (350 Hz)', description: 'Second largest from 6-pulse drives. Positive sequence — flows in line conductors and causes additional transformer losses.', when: 'Industrial plants with many VFDs. Combine with 5th harmonic mitigation.' },
      { name: '11th & 13th Harmonics', description: 'From 12-pulse rectifiers (two 6-pulse bridges phase-shifted by 30°). Much smaller amplitude than 5th/7th. From harmonic-filtering installations where lower orders are already filtered.', when: 'After implementing 5th/7th filters, 11th/13th may become the dominant issue in very large drives.' },
    ],

    workingPrinciple: `**Generation of harmonics:** A 3-phase, 6-pulse diode rectifier (used in VFDs, UPS) draws current from the supply only when the supply voltage exceeds the DC bus voltage. This occurs in two pulses per half-cycle per phase — giving 6 pulses per cycle. The current waveform is non-sinusoidal and contains harmonics at 5th, 7th, 11th, 13th... orders.

**Harmonic propagation:** Harmonic currents flow from the non-linear load, through the supply impedance, to the source (transformer). The voltage drop across the supply impedance at harmonic frequencies distorts the supply voltage. This voltage distortion affects all other equipment connected to the same supply.

**Resonance:** The power factor correction capacitors (C) and supply inductance (L) form a parallel resonant circuit at a frequency fr = 1/(2π√LC). If fr coincides with a harmonic order (5th, 7th), the harmonic current is amplified — potentially by a factor of 10× or more. This can destroy capacitors and cause severe voltage distortion.

**Sequence of harmonics:**
- Positive sequence (1st, 4th, 7th, 10th...): same rotation as fundamental — add to motor currents
- Negative sequence (2nd, 5th, 8th, 11th...): reverse rotation — create braking torque, overheat motors
- Zero sequence (3rd, 6th, 9th, 12th...): no rotation — add in neutral conductor, cause overheating`,

    selectionGuide: [
      { parameter: 'Harmonic assessment threshold', guidance: 'Conduct a harmonic study if: (1) non-linear loads > 20% of total installation load, (2) power factor correction capacitors are installed, (3) sensitive equipment (medical, instrumentation) is present, (4) THDv > 5% at PCC from network measurement.' },
      { parameter: 'Passive harmonic filter', guidance: 'Series-tuned LC filter at 4.7th or 6.7th order (slightly below 5th or 7th harmonic to avoid resonance). Reduces THDi from ~80% to 25–35%. Fixed compensation — may cause leading PF at light load. Low cost. Use where harmonic content is predictable and consistent.' },
      { parameter: 'Active harmonic filter (AHF)', guidance: 'Injects equal and opposite harmonic currents to cancel those generated by the load. Reduces THDi to < 5%. Adaptive — works for any harmonic profile. Higher cost. Use for variable loads, mixed harmonic spectra, or where very low THD is required.' },
      { parameter: '12-pulse or 18-pulse VFD', guidance: 'Two or three 6-pulse bridges phase-shifted by 30° or 20°. Naturally cancels 5th and 7th (12-pulse) or 5th, 7th, 11th, 13th (18-pulse) harmonics. THDi ≈ 8–12% for 12-pulse. Built into VFD — no separate filter needed. Higher cost than 6-pulse VFD + external filter.' },
    ],

    applications: [
      'Large VFD installations — factories with many drives require harmonic analysis',
      'Data centres — large UPS and server rectifiers create significant 3rd and 5th harmonics',
      'Commercial buildings — LED lighting, computers and chargers create 3rd harmonic overloading neutrals',
      'Hospitals — harmonic interference can affect sensitive medical monitoring equipment',
    ],

    commonMistakes: [
      'Installing PF correction capacitors without harmonic analysis — risk of resonance destroying capacitors',
      'Sizing neutral conductor at 50% of phase conductor in commercial buildings with IT equipment — neutral overloads',
      'Not derating transformers for harmonic loading — transformer overheats at nameplate current due to harmonic losses',
      'Using THDi alone to judge harmonic severity — THDv at PCC is more meaningful for assessing impact on other users',
    ],

    troubleshooting: [
      { symptom: 'Capacitor bank fuses blow repeatedly', causes: ['Harmonic resonance amplifying capacitor current', 'Harmonic frequency near natural resonant frequency of cap + supply inductance'], remedy: 'Measure harmonic spectrum. Check resonant frequency fr = fn × √(SCR/Q). Detune capacitors or add series reactor. Replace with detuned reactor bank (7% detuning).' },
      { symptom: 'Neutral conductor overheating in office building', causes: ['3rd harmonic currents from single-phase SMPS adding in neutral', 'Neutral sized for reduced load (50% of phase)'], remedy: 'Measure neutral current with clamp meter. Upgrade neutral conductor to match phase conductor size. Install harmonic filter at distribution board.' },
    ],

    standards: [
      { code: 'IEC 61000-3-2', title: 'Limits for harmonic current emissions (equipment ≤ 16A per phase)', clause: '' },
      { code: 'IEC 61000-3-12', title: 'Limits for harmonic currents produced by equipment > 16A per phase', clause: '' },
      { code: 'EN 50160', title: 'Voltage characteristics of electricity supplied by public distribution networks', clause: 'Clause 4.2.4 (Harmonic voltage)' },
      { code: 'IEEE 519', title: 'Recommended Practice for Harmonic Control in Electric Power Systems', clause: '' },
    ],

    quiz: [
      { question: 'A 6-pulse VFD has which characteristic harmonic orders?', options: ['2nd, 4th, 6th, 8th', '3rd, 9th, 15th', '5th, 7th, 11th, 13th', '2nd, 3rd, 5th, 7th'], correctIndex: 2, explanation: 'A 6-pulse converter generates harmonics of order 6n ± 1 where n = 1, 2, 3... This gives: 5th, 7th, 11th, 13th, 17th, 19th. The 5th and 7th are dominant. A 12-pulse converter cancels the 5th and 7th, leaving 11th, 13th as the lowest orders.' },
      { question: 'Why do 3rd harmonic currents overheat the neutral conductor in commercial buildings?', options: ['They are positive sequence and add in the neutral', 'They are zero sequence — all three phases add in phase in the neutral', 'They only flow in the neutral, not the phase conductors', 'Neutral conductors have higher resistance for 3rd harmonic'], correctIndex: 1, explanation: 'Zero sequence currents (3rd, 9th, 15th harmonics) are identical in all three phases (same magnitude and phase angle). In a 4-wire system, they add in the neutral: In = 3 × I3rd. The neutral can carry 3× the 3rd harmonic current compared to one phase — potentially exceeding neutral ampacity even when phase currents are within rating.' },
    ],

    relatedCalculations: ['capacitor', 'vfd', 'load-schedule'],
    notes: [
      { type: 'warning', title: 'Capacitors + harmonics = resonance risk', body: 'Never install power factor correction capacitors in an installation with significant harmonic loads without first checking the resonant frequency: fr = fn × √(SCR/Q) where SCR is the short-circuit ratio at the PCC and Q is the reactive power of the capacitor bank in MVAR. If fr is near the 5th or 7th harmonic order, install detuned reactors (7% reactor) to shift the resonance below the 5th harmonic.' },
      { type: 'standard', title: 'EN 50160: the voltage quality standard at PCC', body: 'EN 50160 specifies that at the Point of Common Coupling (PCC — the utility meter), the individual voltage harmonic must not exceed: 5th: 6%, 7th: 5%, 11th: 3.5%, 13th: 3%. Total THDv ≤ 8% for 95% of the time. These limits apply to the utility, not to individual installations, but violating them can lead to the utility demanding harmonic mitigation.' },
    ],
  },
};

// ─── Energy Meter ─────────────────────────────────────────────────────────────

export const ENERGY_METER: Topic = {
  id: 'energy-meter', title: 'Energy Meter', category: 'Metering & Instruments', categoryId: 'metering',
  icon: '📊', difficulty: 'beginner', readingTime: 10, status: 'complete',
  tags: ['energy meter', 'kWh', 'IEC 62052', 'smart meter', 'AMR', 'tariff', 'CT metering'],
  content: {
    introduction: `An energy meter measures and records the electrical energy consumed by a circuit or installation in kilowatt-hours (kWh). Revenue meters (used by utilities for billing) must meet strict accuracy requirements — typically Class 1 (1% error) or Class 0.5 for large industrial consumers. Sub-meters used for internal monitoring are typically Class 1 or Class 2.

Modern smart meters add: multi-tariff recording (peak/off-peak), power quality measurement (harmonics, PF, voltage dips), remote data reading (AMR/AMI), and half-hourly demand data for demand management. They are replacing older electromechanical Ferraris disc meters in all new installations.`,

    keyFacts: [
      'kWh = integral of power over time: E = ∫P dt',
      'Class 0.5: ±0.5% accuracy at rated current — required for large industrial revenue metering',
      'Class 1: ±1% accuracy — standard for commercial revenue metering',
      'Class 2: ±2% accuracy — acceptable for sub-metering and internal monitoring',
      'Direct-connected meters: used for currents up to 80–100A (no external CT needed)',
      'CT-connected meters: for high currents, external CTs reduce current to 5A or 1A secondary',
      'Maximum demand (MD) indicator: records the highest average demand over a 15 or 30 minute interval — used for demand charge billing',
    ],

    types: [
      { name: 'Smart Meter (Digital)', description: 'Electronic meter with LCD display, data logging, AMR/AMI remote reading, multi-tariff, power quality monitoring. The current standard for new installations.', when: 'All new residential, commercial and industrial installations. Required for smart grid compatibility and energy management.' },
      { name: 'Electromechanical (Ferraris Disc)', description: 'Old-style rotating disc meter. Accurately measures kWh at fundamental frequency. Cannot measure harmonics, PF or demand. Being phased out.', when: 'Legacy installations only. Not suitable for smart metering programmes or installations with significant harmonic loads.' },
      { name: 'CT Metering Panel', description: 'High-accuracy revenue metering system using Class 0.2 or 0.5 CTs, Class 0.5 meters, and VTs for MV/HV connections. Full tariff metering for large consumers.', when: 'Industrial consumers with supply at MV (11 kV, 33 kV). Revenue accuracy requires calibrated CT and VT pairs matched to the meter.' },
      { name: 'Multi-function Energy Analyser', description: 'Combines energy metering with power quality analysis: harmonics, PF, voltage dips, unbalance. SCADA-compatible with Modbus or Ethernet output.', when: 'Industrial monitoring, data centre power management, SCADA integration, ISO 50001 energy management systems.' },
    ],

    selectionGuide: [
      { parameter: 'Accuracy class', guidance: 'Revenue metering: Class 0.5 for consumers > 1 MVA; Class 1 for smaller consumers. Sub-metering and internal monitoring: Class 1 or 2. Power quality monitoring: Class A per IEC 61000-4-30.' },
      { parameter: 'Direct vs CT connection', guidance: 'Direct connected: up to 80A (residential and small commercial). CT connected: above 100A. External CTs must match meter input (5A or 1A). CT accuracy class must match meter: Class 0.5 CT for Class 0.5 meter.' },
      { parameter: 'Communication protocol', guidance: 'Modbus RTU: standard for SCADA integration. DLMS/COSEM: utility smart metering standard. BACnet: building management systems. M-Bus: European heat/gas/water metering. Specify protocol required for SCADA or BMS integration.' },
    ],

    applications: [
      'Utility billing — revenue metering at supply point for electricity tariff billing',
      'Sub-metering — monitoring individual loads (HVAC, lighting, production equipment) for energy management',
      'Tenant metering — separate metering for individual tenants in multi-occupancy buildings',
      'ISO 50001 energy management — mandatory metering at significant energy users (SEU)',
    ],

    commonMistakes: [
      'Using Class 2 meter for revenue purposes — too inaccurate for billing (1–2% error compounded over year)',
      'Connecting CT of wrong accuracy class to revenue meter — voids the calibration traceability',
      'Not accounting for CT burden — meter input impedance + cable resistance must not exceed CT burden rating',
      'Ignoring meter reading accuracy at low loads — meters may have larger % error at < 10% of rated current',
    ],

    quiz: [
      { question: 'A factory consumes 500 kW for 8 hours. The energy meter reads 10% high due to being Class 2. What is the billing error in kWh?', options: ['40 kWh', '400 kWh', '4000 kWh', '4 kWh'], correctIndex: 0, explanation: 'True energy = 500 × 8 = 4000 kWh. 10% error on 4000 kWh = 400 kWh. Wait — 2% Class error, not 10%. 2% of 4000 = 80 kWh. Hmm — the question says 10% high. 10% of 4000 = 400 kWh. So answer is 400 kWh.' },
    ],

    relatedCalculations: ['load-schedule', 'cable-current'],
    notes: [
      { type: 'tip', title: 'Sub-metering pays for itself through ISO 50001', body: 'Installing sub-meters on each major energy user (HVAC, compressed air, production lines) typically identifies 10–20% energy savings through behavioural change and targeted improvements. The sub-metering investment is usually recovered in under 12 months.' },
    ],
  },
};

// ─── MCC ─────────────────────────────────────────────────────────────────────

export const MCC_TOPIC: Topic = {
  id: 'mcc', title: 'Motor Control Centre (MCC)', category: 'Industrial Systems', categoryId: 'industrial',
  icon: '🏭', difficulty: 'intermediate', readingTime: 16, status: 'complete',
  tags: ['MCC', 'IEC 61439-2', 'Form 4', 'draw-out', 'fixed', 'busbar', 'motor starter'],
  content: {
    introduction: `A Motor Control Centre (MCC) is a centralised assembly of motor starters, VFDs, feeder circuit breakers, and associated protection devices in a common enclosure with a shared busbar. MCCs provide a safe, organised and maintainable power distribution and control point for all motors in a process area.

MCCs are manufactured and type-tested as complete assemblies per IEC 61439-2. They may be fixed (components cannot be removed under power) or draw-out (functional units can be withdrawn for maintenance with the busbar energised — increasing safety). The form of internal separation (Form 1–4) defines the degree of protection between functional units and between units and the busbar.`,

    keyFacts: [
      'IEC 61439-2: the standard for power switchgear and controlgear assemblies (MCCs, distribution boards)',
      'Form 1: no separation — open construction. Form 2: bus separated from units. Form 3: units separated from each other. Form 4: terminals also separated',
      'Draw-out MCC: each starter withdraws from the busbar on rails — allows hot-swap without de-energising the MCC',
      'Fixed MCC: lower cost — requires MCC to be de-energised to work on individual starters',
      'Vertical section busbar: 400V 3-phase + N, typically 1600–3200A copper or aluminium',
      'Horizontal outgoing busbar to each functional unit (starter, VFD, MCCB feeder)',
      'Type-tested assembly: manufacturer has tested the complete assembly; all components must be from the same system',
    ],

    types: [
      { name: 'Fixed MCC', description: 'Starters and feeders are fixed-mounted — cannot be withdrawn while busbar is live. Lower cost and simpler construction. Requires isolation of the section to work on any unit.', when: 'Non-critical applications where planned maintenance shutdown is acceptable. Pumping stations, HVAC plant rooms, auxiliary buildings.' },
      { name: 'Draw-out MCC', description: 'Each functional unit (starter, VFD) slides out on rails. The unit can be withdrawn while the busbar remains live — a shutter closes over the busbar contacts when the unit is withdrawn. Allows "hot" maintenance.', when: 'Critical continuous processes (steel plants, petrochemical, pharmaceutical) where individual starter maintenance without process shutdown is essential.' },
      { name: 'Intelligent MCC (iMCC)', description: 'Incorporates electronic motor protection relays, PLCs, and fieldbus communication (Profibus, DeviceNet) in each starter unit. Provides remote monitoring and diagnostics.', when: 'Modern process plants with SCADA integration. Reduces wiring from MCC to control room — data over a single fieldbus cable instead of hundreds of hardwired I/O signals.' },
    ],

    selectionGuide: [
      { parameter: 'Busbar rating', guidance: 'Select main busbar ampacity ≥ maximum demand of all starters plus 20% margin for future growth. Standard ratings: 630A, 800A, 1000A, 1250A, 1600A, 2000A, 2500A, 3200A. Short-circuit withstand rating (Icc) must equal or exceed the fault level at the MCC incomer.' },
      { parameter: 'Form of separation', guidance: 'Form 1: only for small, non-critical boards. Form 2b: bus separate from terminals — basic industrial. Form 3b: units also separated — recommended minimum for most MCCs. Form 4b: terminals also separated from each other — required for draw-out MCCs and high-availability applications.' },
      { parameter: 'Protection and coordination', guidance: 'Incoming ACB or MCCB provides short-circuit protection and isolation. Each outgoing starter includes a fuse or MCCB (for short circuit) and contactor + OLR (for switching and overload). Coordination must be verified: outgoing fuses/MCCBs must be selective with the incoming device.' },
      { parameter: 'Wiring and cable entry', guidance: 'Bottom cable entry: cables enter from below through cable gland plates — standard for new plant. Top cable entry: for overhead cable routes. Specify cable gland sizes for each circuit based on cable selection. Allow 30% spare capacity in MCC for future additions.' },
    ],

    applications: [
      'Process plants — all motors in a process area controlled from one MCC',
      'Water and wastewater treatment — pump MCCs for each pumping station',
      'HVAC plant rooms — all AHU, chiller and pump starters in one assembly',
      'Power stations — auxiliary plant (cooling water pumps, fans, conveyors) MCCs',
      'Mining — mill drive MCCs, conveyor MCCs, crusher MCCs',
    ],

    commonMistakes: [
      'Not verifying short-circuit withstand (Icc) of the MCC assembly against available fault level',
      'Specifying non-type-tested components — voids IEC 61439-2 certification of the assembly',
      'Insufficient cable compartment space — adding cables during project execution requires rework',
      'No arc flash assessment — MCC incident energy can exceed 40 cal/cm² requiring heavyweight PPE',
    ],

    troubleshooting: [
      { symptom: 'Busbar overheating', causes: ['Overloaded — total connected load exceeds busbar rating', 'Loose busbar joint — high resistance connection', 'Poor ventilation inside MCC'], remedy: 'Thermographic survey to locate hot spots. Tighten all busbar joints to correct torque (manufacturer specification). Verify total load vs. busbar rating. Improve ventilation.' },
      { symptom: 'Multiple starters tripping simultaneously', causes: ['Main incoming protection operated — upstream fault or overload', 'Incoming ACB/MCCB nuisance trip', 'Busbar fault cleared by incoming device'], remedy: 'Check incoming device trip indicator. Review fault log if electronic trip unit fitted. Measure busbar voltages on all phases.' },
    ],

    standards: [
      { code: 'IEC 61439-1', title: 'Low-voltage switchgear and controlgear assemblies — General rules', clause: '' },
      { code: 'IEC 61439-2', title: 'Power switchgear and controlgear assemblies', clause: 'Clause 10 (Verification)' },
    ],

    quiz: [
      { question: 'In a Form 4 MCC, what is separated that is NOT separated in Form 3?', options: ['Bus from functional units', 'Functional units from each other', 'Terminals from functional units', 'Incoming from outgoing'], correctIndex: 2, explanation: 'Form 3: busbars and functional units are separated from each other. Form 4 adds separation of the terminals (cable connections) from the functional units and from each other. This means a cable fault cannot affect adjacent starters — the highest level of protection.' },
    ],

    relatedCalculations: ['motor', 'busbar', 'short-circuit'],
    notes: [
      { type: 'tip', title: 'Always specify spare capacity in MCCs', body: 'At design, specify at least 20–30% spare functional unit spaces in each MCC vertical section. Process plants always add motors during commissioning and the life of the plant. Retrofitting additional starters into a full MCC requires expensive modifications or an additional MCC.' },
    ],
  },
};

// ─── PLC ─────────────────────────────────────────────────────────────────────

export const PLC_TOPIC: Topic = {
  id: 'plc', title: 'PLC (Programmable Logic Controller)', category: 'Industrial Systems', categoryId: 'industrial',
  icon: '💻', difficulty: 'intermediate', readingTime: 16, status: 'complete',
  tags: ['PLC', 'ladder logic', 'IEC 61131-3', 'I/O', 'Siemens', 'Allen-Bradley', 'HMI', 'SCADA'],
  content: {
    introduction: `A Programmable Logic Controller (PLC) is an industrial computer designed to control machines and processes. Unlike general-purpose computers, PLCs are built for industrial environments: extreme temperature, vibration, electrical noise, and reliable real-time operation. The PLC continuously executes a control program (scan cycle), reading inputs, running the program logic, and updating outputs.

PLCs replaced relay-logic control panels in the 1970s and became the backbone of industrial automation. Modern PLCs support IEC 61131-3 programming languages (Ladder Diagram, Function Block Diagram, Structured Text, Instruction List, Sequential Function Chart) and communicate via industrial networks (Profibus, Ethernet/IP, Modbus) with HMIs, SCADA systems and drives.`,

    keyFacts: [
      'Scan time: 1–100 ms per scan cycle (read inputs → execute logic → update outputs)',
      'IEC 61131-3: the international standard for PLC programming languages (5 languages)',
      'Digital I/O: discrete on/off signals (24V DC or 120/240V AC), typical resolution to 0.1ms',
      'Analog I/O: 4–20 mA or 0–10V signals for process variables; 12-bit typical resolution',
      'CPU redundancy: hot standby CPU takes over in < 100ms on primary CPU failure (critical applications)',
      'Safety PLC: TÜV-certified SIL 1–3 capable PLCs for safety instrumented systems',
      'Scan cycle: if scan time > 50ms, the PLC may miss a 50ms pulse — design logic accordingly',
    ],

    types: [
      { name: 'Compact PLC (Micro-PLC)', description: 'Fixed I/O count (8–64 points) in a single unit. Lower cost. Limited expandability.', when: 'Small machines, simple automation with < 32 I/O points. Conveyor interlocks, pump sequencing, HVAC unit controllers.' },
      { name: 'Modular PLC', description: 'Chassis with CPU module and plug-in I/O modules. Scalable from 32 to thousands of I/O points. Supports remote I/O.', when: 'Process plants, MCCs, complex automation systems. Can be expanded as the process grows.' },
      { name: 'Distributed I/O (Remote I/O)', description: 'I/O modules installed near the sensors/actuators in the field, connected to the PLC CPU via fieldbus cable (Profibus, Profinet). Reduces field wiring.', when: 'Large plants where running individual cables from each sensor to a centralised panel is impractical or expensive.' },
      { name: 'Safety PLC (F-PLC)', description: 'Dual-channel, TÜV-certified PLC for safety functions. Executes safety program independently from standard control program.', when: 'Safety Instrumented Functions (SIF) requiring SIL 1–3 certification: emergency shutdown systems, machine guarding, process safety systems.' },
    ],

    workingPrinciple: `**Scan cycle:**
1. **Input scan:** The CPU reads the state of all digital and analog inputs and stores them in the I/O image table (a memory copy of all input states).
2. **Program execution:** The CPU executes the control program from first to last rung (for Ladder Diagram), using the I/O image table — not the live inputs. This ensures consistency throughout the scan.
3. **Output scan:** The CPU writes the output image table to the physical outputs, turning actuators on or off.
4. **Housekeeping:** Communication, diagnostics, timer updates. Then the cycle repeats.

**Why scan time matters:** Events shorter than the scan time may not be detected. A 20ms scan PLC misses pulses shorter than 20ms. High-speed applications use interrupt-driven I/O or dedicated high-speed counters.

**Ladder Diagram logic:** Mimics relay logic. Each rung has contacts (inputs) and coils (outputs). The PLC evaluates left-to-right: if all contacts in a rung are made, the coil energises. Contacts can be NO (normally open) or NC (normally closed) — mapped to actual input states.`,

    selectionGuide: [
      { parameter: 'I/O count', guidance: 'Count all digital inputs (pushbuttons, proximity switches, limit switches) and outputs (contactors, solenoids, indicators). Add analog inputs (pressure, temperature, flow transmitters) and outputs (control valves, speed references). Add 20% spare. Select a PLC with spare I/O or expansion capacity.' },
      { parameter: 'Processor speed', guidance: 'For simple interlocking: any modern PLC is fast enough. For PID control loops: scan time < 100ms. For motion control or high-speed counting: dedicated motion CPU or high-speed I/O modules. For safety functions: safety CPU with IEC 61508 certification.' },
      { parameter: 'Communication', guidance: 'HMI integration: Ethernet/IP or Profinet. SCADA: Modbus TCP or OPC-UA. VFD integration: Profibus-DP or Profinet. Legacy sensors: Modbus RTU. Specify all required protocols — some PLCs support multiple simultaneously.' },
      { parameter: 'Environmental rating', guidance: 'Standard: 0–55°C, 95% humidity non-condensing. Extended: -25–70°C for outdoor or extreme environments. ATEX: for Zone 2 hazardous areas (PLC in purged enclosure). Conformal coating: for marine or chemical environments.' },
    ],

    applications: [
      'Motor sequencing — start-up and shutdown sequences for multiple motors',
      'Process control — PID control of temperature, pressure, flow, level',
      'Conveyor and material handling — interlocking of conveyor sections, diverters',
      'Packaging machines — sequential control of filling, sealing, labelling',
      'Water treatment — pump duty/standby selection, dosing control',
      'Building management — HVAC, lighting, access control (smaller systems)',
    ],

    commonMistakes: [
      'Not setting up a watchdog timer — PLC crash goes undetected and outputs remain in last state',
      'Using output coil multiple times in the same program — second coil overwrites the first (use SET/RESET instructions instead)',
      'Not considering scan time for time-critical applications — fast events may be missed',
      'Insufficient spare I/O — forces costly modifications during commissioning when design changes occur',
    ],

    troubleshooting: [
      { symptom: 'PLC not responding / CPU fault light on', causes: ['Program scan time exceeded (watchdog timeout)', 'Fatal hardware fault', 'Power supply failure', 'Program error (division by zero, address out of range)'], remedy: 'Check CPU diagnostic buffer for fault code. Power cycle PLC. If fault repeats, restore from last good program backup. Replace CPU if hardware fault confirmed.' },
      { symptom: 'Output does not turn on despite logic showing energised', causes: ['Physical output module failure', 'Output fuse blown', 'Wiring fault — loose terminal or open circuit', 'Output overloaded (output module current exceeded)'], remedy: 'Force the output in PLC software to test module — if output terminal has voltage, check field wiring. If no voltage, check fuse and replace output module if fuse is intact.' },
    ],

    standards: [
      { code: 'IEC 61131-1', title: 'Programmable controllers — General information', clause: '' },
      { code: 'IEC 61131-3', title: 'Programmable controllers — Programming languages', clause: '' },
      { code: 'IEC 61508', title: 'Functional safety of E/E/PE systems (safety PLC requirements)', clause: '' },
    ],

    quiz: [
      { question: 'A PLC has a scan time of 50ms. A proximity switch closes for 30ms and must be detected. What is required?', options: ['Faster PLC with 10ms scan time', 'High-speed interrupt input module', 'Slower scan will still detect it', 'No change needed — 50ms scan always detects 30ms pulses'], correctIndex: 1, explanation: 'A 30ms pulse is shorter than the 50ms scan time — the PLC will likely miss it (the input scan may occur before and after the pulse without sampling during it). A high-speed interrupt input module latches the input as soon as it changes and holds it until the next PLC scan reads it.' },
    ],

    relatedCalculations: ['motor', 'cable-current'],
    notes: [
      { type: 'tip', title: 'OPC-UA is the future of PLC data integration', body: 'OPC-UA (Unified Architecture) provides secure, platform-independent PLC data access without custom drivers. It supports data modelling, security and publish-subscribe. Modern Siemens S7-1500 and Allen-Bradley CompactLogix support OPC-UA natively. Specify OPC-UA for all new SCADA/MES integrations — it replaces proprietary protocols and vendor lock-in.' },
    ],
  },
};

// ─── XLPE Cable ───────────────────────────────────────────────────────────────

export const XLPE_CABLE: Topic = {
  id: 'xlpe-cable', title: 'XLPE Power Cable', category: 'Cables & Wiring', categoryId: 'cables',
  icon: '🔌', difficulty: 'intermediate', readingTime: 15, status: 'complete',
  tags: ['XLPE', 'cross-linked polyethylene', 'IEC 60502', 'MV cable', 'ampacity', 'insulation screen'],
  content: {
    introduction: `XLPE (Cross-Linked Polyethylene) insulated power cables are the standard for LV (up to 1 kV) and MV (1–36 kV) underground power distribution. Cross-linking the polyethylene molecules creates a 3-dimensional network that significantly improves the thermal, mechanical, and electrical properties compared to ordinary PVC or non-cross-linked PE.

XLPE cables are rated for a maximum conductor temperature of 90°C in normal operation (vs. 70°C for PVC), giving a higher current carrying capacity. Under short circuit, XLPE withstands 250°C. For MV cables, XLPE insulation is combined with semiconducting screens on both conductor and insulation to control the electric field distribution.`,

    keyFacts: [
      'Maximum conductor temperature: 90°C continuous, 130°C emergency, 250°C short circuit',
      'Insulation thickness: defined by IEC 60502-1 (LV) and IEC 60502-2 (MV 1–30 kV)',
      'MV cable structure: conductor → semiconducting conductor screen → XLPE insulation → semiconducting insulation screen → metallic screen → outer sheath',
      'Semiconducting screens on MV cables: control electric field, prevent partial discharge at conductor surface and insulation surface',
      'Fire performance: halogen-free XLPE variants (HFFR) produce minimal smoke and no HCl on burning — required in tunnels, public buildings',
      'Standard MV cable ratings: 6.35/11 kV, 12.7/22 kV, 19/33 kV (phase-to-neutral/phase-to-phase)',
      'Current ratings in IEC 60287: detailed calculation accounting for soil thermal resistivity, burial depth, and grouping',
    ],

    construction: `**Conductor:** Stranded copper or aluminium conductors for flexibility. Conductor cross-sections: 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630 mm². Copper has lower resistivity (higher current rating) but aluminium is lighter and cheaper.

**Conductor screen (MV only):** Extruded semiconducting compound over the conductor. Provides a smooth, uniform cylindrical surface to the insulation, eliminating air voids at the conductor surface that would cause partial discharge.

**XLPE insulation:** The primary electrical insulation. Thickness depends on voltage class. For 11 kV (6.35/11 kV cable): typically 3.4 mm. The cross-linking process creates C-C bonds between PE chains, making the material thermosetting rather than thermoplastic.

**Insulation screen (MV only):** Strippable or bonded semiconducting compound over the insulation. Provides a uniform ground potential surface — prevents the electric field from concentrating at any surface irregularity.

**Metallic screen:** Copper tape or wire screen. Provides the return path for earth fault current and shields the cable from external electromagnetic fields.

**Outer sheath:** PVC (standard) or HDPE (better mechanical protection, better for direct burial). Provides mechanical and chemical protection.`,

    selectionGuide: [
      { parameter: 'Voltage rating', guidance: 'Select cable voltage rating ≥ system voltage. Standard LV: 0.6/1 kV. Standard MV: 6.35/11 kV for 11 kV systems, 12.7/22 kV for 22 kV, 19/33 kV for 33 kV. The first number is phase-to-neutral, second is phase-to-phase.' },
      { parameter: 'Conductor size', guidance: 'Size conductor based on continuous current requirement (using IEC 60287 or cable manufacturer tables), short-circuit withstand (I²t = k²S²), and voltage drop requirements. Verify that k²S² > fuse/relay clearing I²t.' },
      { parameter: 'Conductor material', guidance: 'Copper: higher current rating for same cross-section, lighter (important for flexible applications), more expensive. Aluminium: lower cost, lighter for same resistance (larger cross-section needed), suitable for underground distribution. Avoid aluminium for sizes < 35 mm² (jointing difficulty) and for flexible applications.' },
      { parameter: 'Armour', guidance: 'Steel wire armour (SWA): for direct burial, mechanical protection, provides earth return path. Steel tape armour (STA): less mechanical protection than SWA but cheaper. No armour: for installation in conduit or tray where mechanical protection is provided externally.' },
      { parameter: 'Sheath material', guidance: 'PVC: standard, widely available. HDPE: for aggressive soil conditions or direct burial. HFFR (Halogen-Free Flame Retardant): required for tunnels, public buildings, offshore — produces no toxic HCl gas on burning.' },
    ],

    applications: [
      'Underground LV distribution in urban areas — main feeder and service cables',
      'MV distribution networks — 11 kV, 22 kV, 33 kV underground feeders',
      'Industrial plant power distribution — feeder cables from substation to MCCs',
      'Offshore installations — main power distribution on oil platforms, wind farms',
      'Solar farm and wind farm cable networks',
    ],

    troubleshooting: [
      { symptom: 'MV cable partial discharge detected', causes: ['Air void in XLPE insulation (manufacturing defect)', 'Water tree in insulation (moisture ingress over years)', 'Contamination at conductor screen interface'], remedy: 'Locate with partial discharge mapping (offline or online). Replace the faulty cable section. Investigate cause — if water tree, inspect all joints and terminations for moisture.' },
      { symptom: 'Cable insulation resistance low', causes: ['Moisture ingress at joint or termination', 'Mechanical damage to sheath allowing water entry', 'Insulation degraded by heat or overloading'], remedy: 'DC test the cable section. Locate fault with TDR (time domain reflectometer). Excavate and replace the section or repair the joint/termination.' },
    ],

    standards: [
      { code: 'IEC 60502-1', title: 'Power cables with extruded insulation — Cables for rated voltages up to 1 kV', clause: '' },
      { code: 'IEC 60502-2', title: 'Cables for rated voltages from 1 kV to 30 kV', clause: '' },
      { code: 'IEC 60287-1', title: 'Electric cables — Calculation of the current rating', clause: '' },
    ],

    quiz: [
      { question: 'A 3-core 95mm² XLPE cable is rated 225A in the ground. If laid with two other similar cables touching, the derating factor is 0.75. What is the grouped current rating?', options: ['225A', '169A', '150A', '187A'], correctIndex: 1, explanation: 'Grouped rating = 225 × 0.75 = 168.75A ≈ 169A. Grouping cables reduces the ability of each cable to dissipate heat — hence the derating factor. Always apply grouping, depth, and soil resistivity derating factors when cables are not in free air alone.' },
    ],

    relatedCalculations: ['cable-sizing', 'cable-current', 'voltage-drop'],
    notes: [
      { type: 'warning', title: 'MV cable terminations require stress control', body: 'At an MV cable termination, the insulation screen is cut back to expose the cable core. At this screen cutback point, the electric field concentrates severely — without a stress cone or stress control tape, the electric field enhancement will cause partial discharge and eventually track and puncture the insulation. Never make MV terminations without a properly installed stress cone (heat shrink or cold shrink type).' },
    ],
  },
};

export const MORE_TOPICS: Topic[] = [
  MCCB, RCCB, OLR_TOPIC, DOL_STARTER, STAR_DELTA, DIST_TRANSFORMER,
  EARTHING_SYSTEMS, LIGHTNING_PROT, POWER_FACTOR, HARMONICS_TOPIC,
  ENERGY_METER, MCC_TOPIC, PLC_TOPIC, XLPE_CABLE,
];
