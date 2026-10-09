import React from 'react';

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'number' | 'text';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  disabled?: boolean;
  required?: boolean;
}

export function InputField({
  label, value, onChange, type = 'number', unit, min, max, step, tooltip, disabled, required,
}: InputFieldProps) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600, color:'var(--ec-text-label)' }}>
        {label}
        {required && <span style={{ color:'#EF4444' }}>*</span>}
        {tooltip && (
          <span title={tooltip} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:15, height:15, borderRadius:'50%', background:'var(--ec-bg-card)', border:'1px solid var(--ec-border)', color:'var(--ec-text-muted)', fontSize:9, cursor:'help', flexShrink:0 }}>?</span>
        )}
      </label>
      <div style={{ position:'relative' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          style={{
            width:'100%', height:46, background: disabled ? 'var(--ec-bg-surface)' : 'var(--ec-bg-input)',
            border:`1px solid ${disabled ? 'var(--ec-border-muted)' : 'var(--ec-border)'}`,
            borderRadius:10, color: disabled ? 'var(--ec-text-muted)' : 'var(--ec-text-primary)',
            fontSize:14, fontWeight:600, padding: unit ? '0 48px 0 14px' : '0 14px',
            fontFamily:'inherit', outline:'none', boxSizing:'border-box',
            cursor: disabled ? 'not-allowed' : 'auto', opacity: disabled ? 0.6 : 1,
            transition:'border-color 150ms',
          }}
        />
        {unit && (
          <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--ec-text-muted)', fontWeight:600, pointerEvents:'none', fontFamily:"'JetBrains Mono',monospace" }}>
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  tooltip?: string;
  disabled?: boolean;
}

export function SelectField({ label, value, onChange, options, tooltip, disabled }: SelectFieldProps) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600, color:'var(--ec-text-label)' }}>
        {label}
        {tooltip && (
          <span title={tooltip} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:15, height:15, borderRadius:'50%', background:'var(--ec-bg-card)', border:'1px solid var(--ec-border)', color:'var(--ec-text-muted)', fontSize:9, cursor:'help', flexShrink:0 }}>?</span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width:'100%', height:46, background:'var(--ec-bg-input)',
          border:'1px solid var(--ec-border)', borderRadius:10,
          color:'var(--ec-text-primary)', fontSize:14, fontWeight:600,
          padding:'0 14px', fontFamily:'inherit', outline:'none',
          boxSizing:'border-box', cursor: disabled ? 'not-allowed' : 'pointer',
          appearance:'none', opacity: disabled ? 0.6 : 1, transition:'border-color 150ms',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: SectionProps) {
  return (
    <div style={{ borderRadius:14, background:'var(--ec-bg-card)', border:'1px solid var(--ec-border-card)', overflow:'hidden', boxShadow:'var(--ec-shadow-card)', marginBottom:16 }} className={className}>
      <div style={{ padding:'12px 16px', background:'var(--ec-bg-surface)', borderBottom:'1px solid var(--ec-border-muted)' }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:'var(--ec-text-secondary)', margin:0 }}>{title}</h3>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
