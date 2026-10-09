import React from 'react';
import { BookOpen, Download, FileSpreadsheet } from 'lucide-react';
import type { CalculationResult } from '../../types';

// ── CSS-variable tokens — respond to [data-theme="light/dark"] ────────────────
const C = {
  bg:    'var(--ec-bg-card)',
  bgDark:'var(--ec-bg-root)',
  border:'var(--ec-border-card)',
  text:  'var(--ec-text-primary)',
  muted: 'var(--ec-text-muted)',
  dim:   'var(--ec-border)',
  label: 'var(--ec-text-label)',
  surf:  'var(--ec-bg-surface)',
  sec:   'var(--ec-text-secondary)',
  input: 'var(--ec-bg-input)',
  mono:  "JetBrains Mono, 'Courier New', monospace",
};

// ── ModHeader ─────────────────────────────────────────────────────────────────
export function ModHeader({
  icon: Icon,
  title,
  subtitle,
  accentColor = '#2563EB',
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accentColor?: string;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:20, marginBottom:24, borderBottom:`1px solid ${C.border}` }}>
      <div style={{
        width:52, height:52, borderRadius:14, flexShrink:0,
        background:`${accentColor}22`, border:`1px solid ${accentColor}44`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon style={{ width:26, height:26, color:accentColor }} />
      </div>
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.01em' }}>{title}</h2>
        <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── InputPanel ────────────────────────────────────────────────────────────────
export function InputPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:24, boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:20 }}>Design Inputs</div>
      {children}
    </div>
  );
}

// ── ResultPanel ───────────────────────────────────────────────────────────────
export function ResultPanel({
  result,
  learningMode,
  setLearningMode,
  onExportPDF,
  onExportExcel,
  accentColor = '#2563EB',
}: {
  result: CalculationResult | null;
  learningMode: boolean;
  setLearningMode: (v: boolean) => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  accentColor?: string;
}) {
  if (!result) {
    return (
      <div style={{
        height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
        background:C.surf, border:`1.5px dashed ${C.border}`,
        borderRadius:16, minHeight:380,
      }}>
        <div style={{ textAlign:'center', padding:32 }}>
          <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 16px', background:`${accentColor}11`, border:`1px solid ${accentColor}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${accentColor}44` }} />
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:C.muted }}>Enter design parameters and click Calculate</div>
          <div style={{ fontSize:12, color:C.dim, marginTop:6 }}>Results and step-by-step workings will appear here</div>
        </div>
      </div>
    );
  }

  const highlights = result.values.filter((v) => v.highlight);
  const others     = result.values.filter((v) => !v.highlight);
  const status     = result.status;

  const statusColor = status === 'PASS' ? '#22C55E' : status === 'FAIL' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : '#60A5FA';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Results</div>
          <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:`${statusColor}18`, color:statusColor, fontWeight:700, border:`1px solid ${statusColor}30` }}>
            {status}
          </span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {onExportExcel && (
            <button onClick={onExportExcel} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'rgba(34,197,94,.15)', color:'#22C55E', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <FileSpreadsheet style={{ width:13, height:13 }} /> Excel
            </button>
          )}
          {onExportPDF && (
            <button onClick={onExportPDF} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'rgba(37,99,235,.15)', color:'#60A5FA', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <Download style={{ width:13, height:13 }} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Highlight KPIs */}
      {highlights.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(highlights.length, 2)}, 1fr)`, gap:10 }}>
          {highlights.map((v) => (
            <KpiCard key={v.label} label={v.label} value={v.value} unit={v.unit} highlight status={v.status} accentColor={accentColor} />
          ))}
        </div>
      )}

      {/* Other values */}
      {others.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
          {others.map((v) => (
            <KpiCard key={v.label} label={v.label} value={v.value} unit={v.unit} status={v.status} />
          ))}
        </div>
      )}

      {/* Formula */}
      {result.formula && (
        <div style={{ background:C.bgDark, borderRadius:12, padding:'12px 16px', border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.dim, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Key Formula</div>
          <code style={{ fontSize:13, color:'#93C5FD', fontFamily:C.mono }}>{result.formula}</code>
        </div>
      )}

      {/* Recommendation */}
      {result.recommendation && (
        <div style={{ background:`${accentColor}0A`, border:`1px solid ${accentColor}25`, borderRadius:12, padding:'12px 16px' }}>
          <div style={{ fontSize:11, color:C.dim, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Assessment</div>
          <p style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{result.recommendation}</p>
        </div>
      )}

      {/* Standard reference */}
      {result.standardRef && (
        <div style={{ display:'flex', gap:10, padding:'10px 14px', background:C.surf, borderRadius:10, border:`1px solid ${C.border}` }}>
          <span style={{ fontSize:12, fontWeight:700, color:accentColor }}>{result.standardRef.standard}</span>
          {result.standardRef.clause && <span style={{ fontSize:12, color:C.dim }}>Clause {result.standardRef.clause}</span>}
          {result.standardRef.title && <span style={{ fontSize:12, color:C.dim }}>— {result.standardRef.title}</span>}
        </div>
      )}

      {/* Learning mode toggle */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:C.surf, borderRadius:12, border:`1px solid ${C.border}`, marginTop:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <BookOpen style={{ width:16, height:16, color:learningMode ? '#22C55E' : C.dim }} />
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:learningMode ? C.sec : C.muted }}>Learning Mode</div>
            <div style={{ fontSize:11, color:C.dim }}>Step-by-step workings and engineering explanation</div>
          </div>
        </div>
        <button
          onClick={() => setLearningMode(!learningMode)}
          style={{
            width:44, height:24, borderRadius:12,
            background:learningMode ? '#22C55E' : C.bg,
            border:`1px solid ${learningMode ? '#16A34A' : C.dim}`,
            position:'relative', cursor:'pointer', transition:'all 150ms', flexShrink:0,
          }}
        >
          <div style={{ position:'absolute', top:3, left:learningMode ? 21 : 3, width:16, height:16, borderRadius:8, background:'#fff', transition:'left 150ms' }} />
        </button>
      </div>
    </div>
  );
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
export function KpiCard({
  label, value, unit, highlight = false, status, accentColor = '#2563EB',
}: {
  label: string; value: string; unit?: string;
  highlight?: boolean; status?: string; accentColor?: string;
}) {
  const sc = status === 'PASS' ? '#22C55E' : status === 'FAIL' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : null;
  const valueColor = sc ?? (highlight ? accentColor : C.text);
  return (
    <div style={{
      background: highlight ? `${accentColor}0F` : C.surf,
      border:`1px solid ${highlight ? `${accentColor}30` : C.border}`,
      borderRadius:14, padding:'16px 18px',
    }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
        <span style={{ fontSize:22, fontWeight:800, color:valueColor, letterSpacing:'-0.02em', lineHeight:1, fontFamily:sc || highlight ? C.mono : 'inherit' }}>{value}</span>
        {unit && <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>{unit}</span>}
      </div>
      {status && (
        <div style={{ marginTop:8 }}>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:`${sc}18`, color:sc ?? C.muted, fontWeight:700 }}>{status}</span>
        </div>
      )}
    </div>
  );
}

// ── StepByStep ────────────────────────────────────────────────────────────────
export function StepByStep({ steps }: { steps: Array<{ step: number; description: string; formula: string; result: string }> }) {
  if (!steps?.length) return null;
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:28, marginBottom:24, boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:C.text, letterSpacing:'0.03em', textTransform:'uppercase' }}>ENGINEERING CALCULATION — STEP BY STEP</h3>
        <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Complete working using your entered values — all numbers match the result above exactly</p>
      </div>
      {steps.map((s, i) => (
        <div key={s.step} style={{ display:'flex', gap:20, padding:'18px 0', borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>{s.step}</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.sec, marginBottom:10 }}>{s.description}</div>
            <div style={{ background:C.bgDark, borderRadius:10, padding:'10px 14px', border:`1px solid ${C.border}`, marginBottom:8 }}>
              <div style={{ fontSize:11, color:C.dim, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Formula / Working</div>
              <code style={{ fontSize:13, color:'#93C5FD', fontFamily:C.mono }}>{s.formula}</code>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:13, color:C.muted }}>Result:</span>
              <span style={{ fontSize:15, fontWeight:800, color:'#22C55E', fontFamily:C.mono }}>{s.result}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── WhyMatters ─────────────────────────────────────────────────────────────────
export function WhyMatters({ items }: { items: Array<{ title: string; desc: string }> }) {
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:28, marginBottom:24, boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:C.text, letterSpacing:'0.03em', textTransform:'uppercase' }}>WHY THIS CALCULATION MATTERS</h3>
        <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>The result is a fundamental input for these downstream engineering decisions</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        {items.map(({ title, desc }) => (
          <div key={title} style={{ padding:'12px 14px', background:C.surf, borderRadius:12, border:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:6, height:6, borderRadius:3, background:'#2563EB', flexShrink:0 }} />
              <span style={{ fontSize:13, fontWeight:700, color:C.sec }}>{title}</span>
            </div>
            <span style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NoteBlock ──────────────────────────────────────────────────────────────────
export function NoteBlock({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding:'14px 18px', borderRadius:12, background:`${color}0D`, border:`1px solid ${color}30`, borderLeft:`3px solid ${color}` }}>
      <div style={{ fontSize:13, fontWeight:700, color, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{children}</div>
    </div>
  );
}

// ── EngineeringNotes ───────────────────────────────────────────────────────────
export function EngineeringNotes({ notes }: { notes: Array<{ color: string; title: string; body: string }> }) {
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:28, boxShadow:'var(--ec-shadow-card)' }}>
      <div style={{ marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:C.text, letterSpacing:'0.03em', textTransform:'uppercase' }}>ENGINEERING NOTES</h3>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {notes.map(({ color, title, body }) => (
          <NoteBlock key={title} color={color} title={title}>{body}</NoteBlock>
        ))}
      </div>
    </div>
  );
}

// ── CalcButton ─────────────────────────────────────────────────────────────────
export function CalcButton({
  onClick, label, icon: Icon, accentColor = '#2563EB',
}: {
  onClick: () => void; label: string;
  icon?: React.ElementType; accentColor?: string;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:'100%', height:54, borderRadius:12, border:'none', cursor:'pointer',
        background:`linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
        color:'#fff', fontSize:16, fontWeight:800, letterSpacing:'0.01em',
        boxShadow:hovered ? `0 14px 32px ${accentColor}55` : `0 8px 24px ${accentColor}40`,
        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        fontFamily:'inherit', transition:'all 200ms',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        marginTop:20,
      }}
    >
      {Icon && <Icon style={{ width:20, height:20 }} />}
      {label}
    </button>
  );
}

// ── QuickPills ─────────────────────────────────────────────────────────────────
export function QuickPills({
  label, items, active, onSelect, accentColor = '#2563EB',
}: {
  label: string;
  items: Array<{ label: string; value: string }>;
  active: string;
  onSelect: (v: string) => void;
  accentColor?: string;
}) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>{label}</div>}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            style={{
              padding:'5px 12px', borderRadius:8,
              border:`1px solid ${active === item.value ? accentColor : C.border}`,
              background:active === item.value ? `${accentColor}18` : C.surf,
              color:active === item.value ? '#93C5FD' : C.muted,
              fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 120ms',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SectionLabel ───────────────────────────────────────────────────────────────
export function SectionLabel({ title }: { title: string }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14, marginTop:6 }}>{title}</div>
  );
}

// ── FieldRow ───────────────────────────────────────────────────────────────────
export function FieldRow({
  children, cols = '1fr 1fr', gap = 12,
}: {
  children: React.ReactNode; cols?: string; gap?: number;
}) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:cols, gap, marginBottom:14 }}>
      {children}
    </div>
  );
}

// ── TextInput — avoids forms.css width:100% flex override ─────────────────────
export function TextInput({
  label, value, onChange, unit, min, max, step, disabled, tooltip,
}: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; min?: number; max?: number; step?: number;
  disabled?: boolean; tooltip?: string;
}) {
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', fontSize:13, fontWeight:600, color:C.label, marginBottom:8 }}>
        {label}
        {tooltip && (
          <span title={tooltip} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:15, height:15, borderRadius:'50%', background:C.bg, border:`1px solid ${C.border}`, color:C.muted, fontSize:9, cursor:'help', marginLeft:5, flexShrink:0 }}>?</span>
        )}
        {unit && <span style={{ marginLeft:'auto', fontSize:11, color:C.dim, fontWeight:600 }}>{unit}</span>}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width:'100%', height:50, background: disabled ? C.surf : C.input,
          border:`1px solid ${disabled ? C.border : C.dim}`,
          borderRadius:10, color: disabled ? C.muted : C.text,
          fontSize:15, fontWeight:600, padding:'0 14px',
          fontFamily:'inherit', outline:'none', boxSizing:'border-box',
          cursor: disabled ? 'not-allowed' : 'auto',
        }}
      />
    </div>
  );
}

// ── SelectInput ────────────────────────────────────────────────────────────────
export function SelectInput({
  label, value, onChange, options, tooltip,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  tooltip?: string;
}) {
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', fontSize:13, fontWeight:600, color:C.label, marginBottom:8 }}>
        {label}
        {tooltip && (
          <span title={tooltip} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:15, height:15, borderRadius:'50%', background:C.bg, border:`1px solid ${C.border}`, color:C.muted, fontSize:9, cursor:'help', marginLeft:5, flexShrink:0 }}>?</span>
        )}
      </label>
      <div style={{ position:'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width:'100%', height:50, background:C.input,
            border:`1px solid ${C.dim}`, borderRadius:10,
            color:C.text, fontSize:14, fontWeight:600,
            padding:'0 36px 0 14px', fontFamily:'inherit', outline:'none',
            boxSizing:'border-box', cursor:'pointer',
            WebkitAppearance:'none', MozAppearance:'none', appearance:'none',
          }}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Custom dropdown arrow — pointer-events none so clicks reach the select */}
        <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', display:'flex', alignItems:'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
