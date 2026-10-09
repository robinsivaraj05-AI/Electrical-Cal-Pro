import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Send, User, Bot, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ENGINEERING_RESPONSES: Record<string, string> = {
  'voltage drop': `**Voltage Drop Calculation (IEC 60364-5-52 Annex G)**

For 3-phase systems:
\`ΔV = √3 × I × L × (R·cosφ + X·sinφ) / 1000\`

For single-phase:
\`ΔV = 2 × I × L × (R·cosφ + X·sinφ) / 1000\`

**Limits per IEC 60364-5-52:**
- General loads: 3% (from MDB to point of use)
- Motor loads: 5% maximum
- Total from supply point: 8% (lighting), 6% (other)

Use the full impedance method with both R and X components for accurate results. Never use resistance-only simplified formula for professional calculations.`,

  'cable sizing': `**Cable Sizing Method (IEC 60364-5-52)**

1. Calculate design current: I_d = I_n × future factor (typically 1.25)
2. Apply correction factors:
   - Temperature factor C_f (Table B.52.14)
   - Grouping factor C_g (Table B.52.17)
   - Soil thermal resistivity C_s (buried cables)
3. Required tabulated capacity: I_t = I_d / (C_f × C_g × C_s)
4. Select next standard size from Table B.52.2

**Installation Methods:**
- Method A: In conduit on wall
- Method B: In conduit in wall
- Method C: Clipped to surface (highest rating)
- Method D: In duct in ground
- Method E: Free air (reference)
- Method F: On tray`,

  'short circuit': `**Short-Circuit Calculation (IEC 60909)**

Three-phase fault current:
\`I"_k3 = c × U_n / (√3 × Z_k)\`

Where:
- c = 1.05 (for max fault current, LV systems)
- U_n = Nominal voltage (V)
- Z_k = Total short-circuit impedance (Ω)

**Peak factor κ:**
\`κ = 1.02 + 0.98 × e^(-3/(X/R))\`
\`i_p = κ × √2 × I"_k\`

**Cable thermal withstand (adiabatic):**
\`S_min = I_k × √t / k\`
Where k = 143 for Cu/XLPE, 115 for Cu/PVC`,

  'motor': `**Motor FLC Calculation (IEC 60034)**

3-phase: \`I_FLC = P / (√3 × V × cosφ × η)\`
1-phase: \`I_FLC = P / (V × cosφ × η)\`

**Starting Methods and Currents:**
- DOL: 5–8× FLC (typically 6×)
- Star-Delta: ~2× FLC
- Soft-Starter: ~2.5× FLC
- VFD: ~1.5× FLC (adjustable)

**Protection:**
- OLR setting: 1.0–1.15× FLC (IEC 60947-4-1)
- MCCB for motor: ≥ 2.5× FLC (type B trip)
- Cable: 1.25× FLC design current`,

  'earthing': `**Earthing System Design (IEEE 80 / IEC 60364-5-54)**

**IEEE 80 Grid Resistance (Schwarz formula):**
\`R_g = ρ/(4√A) + ρ/L\`

**Touch voltage tolerable limit (70 kg body):**
\`V_touch = (1000 + 1.5ρ_s) × 0.157/√t\`

**Step voltage:**
\`V_step = (1000 + 6ρ_s) × 0.157/√t\`

**Earth conductor sizing (adiabatic):**
\`S = I_f × √t / k\` (k=226 for Cu, k=80 for GI)

**Requirements:**
- R ≤ 5 Ω (general)
- R ≤ 1 Ω (substation)
- R ≤ 0.5 Ω (data centres)`,

  'transformer': `**Transformer Sizing (IEC 60076)**

Current at secondary:
\`I_s = S / (√3 × V_s)\`

Short-circuit current at LV terminals:
\`I_sc = I_FLC / (Z_k%/100)\`

**Typical Impedances:**
- ≤ 630 kVA: 4–5%
- 630–2500 kVA: 5–6%
- > 2500 kVA: 6–7.5%

**Vector Groups:**
- Dyn11: Most common distribution (delta HV, star LV, 30° shift)
- Dyn1: Same, opposite rotation
- Yzn11: For 3-phase to single-phase loads`,

  default: `I'm your **AI Engineering Assistant** for electrical calculations. I can help you with:

**Calculation Topics:**
- Cable current calculations
- Cable sizing (IEC 60364-5-52)
- Voltage drop analysis
- Short circuit fault calculations (IEC 60909)
- Motor protection & cable selection
- Transformer parameters
- Earthing system design (IEEE 80)
- Protection coordination
- UPS and battery sizing
- Power factor correction

**How to use:**
Ask me about any electrical engineering topic, standard, formula, or concept. For example:
- "How do I calculate voltage drop?"
- "What is the formula for short circuit current?"
- "How to size a cable for a 75kW motor?"
- "Explain IEC 60909 voltage factor c"

For accurate calculations, use the dedicated calculation modules in the sidebar.`
};

function getResponse(query: string): string {
  const q = query.toLowerCase();
  for (const [key, response] of Object.entries(ENGINEERING_RESPONSES)) {
    if (q.includes(key)) return response;
  }
  if (q.includes('iec') || q.includes('ieee') || q.includes('nec') || q.includes('standard')) {
    return `**Engineering Standards Reference**

The main standards used in ElecCalc Pro:

| Standard | Scope |
|----------|-------|
| IEC 60364-5-52 | Cable installation, current ratings |
| IEC 60909 | Short-circuit calculations |
| IEC 60947-2 | Low-voltage circuit-breakers |
| IEC 60947-4-1 | Motor starters & contactors |
| IEC 60076-1 | Power transformers |
| IEC 61869-2 | Current transformers |
| IEEE 80 | AC substation earthing |
| IEEE 1584 | Arc flash calculations |
| NEC Art. 310 | Conductors — general wiring |
| BS 7671 | UK IET Wiring Regulations |

Ask me about any specific standard or calculation method!`;
  }
  return ENGINEERING_RESPONSES.default;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: ENGINEERING_RESPONSES.default,
    }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const response = getResponse(input);
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const quickQuestions = [
    'How to calculate voltage drop?',
    'Cable sizing formula?',
    'Motor FLC calculation',
    'Short circuit IEC 60909',
    'Earthing system design',
    'OLR selection guide',
  ];

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-10rem)] animate-fadeIn">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50 mb-4">
        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
          <Cpu className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI Engineering Assistant</h2>
          <p className="text-xs text-slate-400">Ask about calculations, standards, formulas and design guidance</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700/30 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Online</span>
        </div>
      </div>

      {/* Quick questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 text-slate-300 rounded-lg transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-blue-400" />}
            </div>
            <div
              className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/70 border border-slate-700/50 text-slate-200 rounded-tl-none'
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="bg-slate-900 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about electrical calculations, standards, formulas..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
