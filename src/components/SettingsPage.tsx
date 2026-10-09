import React from 'react';
import { Settings, Sun, Moon, Globe, Ruler, Building, User, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

// ── Theme-aware style helpers ──────────────────────────────────────────────────
const S = {
  card:   { borderRadius:16, background:'var(--ec-bg-card)', border:'1px solid var(--ec-border-card)', overflow:'hidden' as const, boxShadow:'var(--ec-shadow-card)' },
  hdr:    { padding:'12px 16px', borderBottom:'1px solid var(--ec-border-muted)', fontSize:11, fontWeight:700 as const, color:'var(--ec-text-muted)', textTransform:'uppercase' as const, letterSpacing:'0.08em', background:'var(--ec-bg-surface)' },
  body:   { padding:20, display:'flex' as const, flexDirection:'column' as const, gap:20 },
  label:  { fontSize:13, fontWeight:600 as const, color:'var(--ec-text-secondary)', display:'block', marginBottom:10 },
  input:  { width:'100%', height:46, background:'var(--ec-bg-input)', border:'1px solid var(--ec-border)', borderRadius:10, padding:'0 14px', fontSize:14, color:'var(--ec-text-primary)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const },
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={S.card}>
      <div style={S.hdr}>{title}</div>
      <div style={S.body}>{children}</div>
    </div>
  );
}

function ToggleBtn({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
        borderRadius:10, border:`1.5px solid ${active ? 'var(--ec-primary)' : 'var(--ec-border)'}`,
        background: active ? 'var(--ec-primary)' : 'var(--ec-bg-surface)',
        color: active ? '#fff' : 'var(--ec-text-secondary)',
        fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 180ms', fontFamily:'inherit',
      }}
    >
      <Icon style={{ width:15, height:15 }} />
      {label}
      {active && <Check style={{ width:13, height:13, marginLeft:2 }} />}
    </button>
  );
}

function PillBtn({
  active, onClick, label,
}: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:'8px 16px', borderRadius:8,
        border:`1.5px solid ${active ? 'var(--ec-primary)' : 'var(--ec-border)'}`,
        background: active ? 'var(--ec-primary)' : 'var(--ec-bg-surface)',
        color: active ? '#fff' : 'var(--ec-text-secondary)',
        fontSize:13, fontWeight:600, cursor:'pointer',
        transition:'all 150ms', fontFamily:'inherit',
      }}
    >
      {label}
    </button>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, setTheme } = useStore();

  return (
    <div style={{ maxWidth:680, display:'flex', flexDirection:'column', gap:24 }} className="animate-fadeIn">
      {/* Page header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:16, borderBottom:'1px solid var(--ec-border-muted)' }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'var(--ec-bg-surface)', border:'1px solid var(--ec-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Settings style={{ width:20, height:20, color:'var(--ec-text-muted)' }} />
        </div>
        <div>
          <h2 style={{ fontSize:18, fontWeight:800, color:'var(--ec-text-primary)', margin:0 }}>Settings</h2>
          <p style={{ fontSize:12, color:'var(--ec-text-muted)', margin:0 }}>Application preferences and defaults</p>
        </div>
      </div>

      {/* Appearance */}
      <Card title="Appearance">
        <div>
          <span style={S.label}>Theme</span>
          <div style={{ display:'flex', gap:12 }}>
            <ToggleBtn active={settings.theme === 'dark'}  onClick={() => setTheme('dark')}  icon={Moon} label="Dark Mode"  />
            <ToggleBtn active={settings.theme === 'light'} onClick={() => setTheme('light')} icon={Sun}  label="Light Mode" />
          </div>
          <p style={{ fontSize:12, color:'var(--ec-text-muted)', marginTop:10 }}>
            {settings.theme === 'dark'
              ? 'Dark mode — optimised for low-light environments and extended engineering sessions.'
              : 'Light mode — ideal for bright environments and printed report previews.'}
          </p>
        </div>
      </Card>

      {/* Engineering Defaults */}
      <Card title="Engineering Defaults">
        <div>
          <span style={S.label}>Preferred Standard</span>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {(['IEC', 'IEEE', 'NEC', 'BS', 'IS'] as const).map((std) => (
              <PillBtn key={std} active={settings.standard === std} onClick={() => updateSettings({ standard: std })} label={std} />
            ))}
          </div>
          <p style={{ fontSize:12, color:'var(--ec-text-muted)', marginTop:10 }}>
            Selected: <strong style={{ color:'var(--ec-text-accent)' }}>{settings.standard}</strong> — used as the default standard reference in calculations and exports.
          </p>
        </div>

        <div>
          <span style={S.label}>Unit System</span>
          <div style={{ display:'flex', gap:10 }}>
            <ToggleBtn active={settings.unitSystem === 'metric'}   onClick={() => updateSettings({ unitSystem: 'metric' })}   icon={Globe} label="Metric (SI)"  />
            <ToggleBtn active={settings.unitSystem === 'imperial'} onClick={() => updateSettings({ unitSystem: 'imperial' })} icon={Ruler} label="Imperial"     />
          </div>
          <p style={{ fontSize:12, color:'var(--ec-text-muted)', marginTop:10 }}>
            Selected: <strong style={{ color:'var(--ec-text-accent)' }}>{settings.unitSystem === 'metric' ? 'Metric (SI)' : 'Imperial'}</strong> — kW / kVA / metres / mm² vs HP / kVA / feet / AWG.
          </p>
        </div>
      </Card>

      {/* Company & Engineer Details */}
      <Card title="Company & Engineer Details">
        <div>
          <label style={{ ...S.label, display:'flex', alignItems:'center', gap:6 }}>
            <Building style={{ width:14, height:14 }} /> Company Name
          </label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => updateSettings({ companyName: e.target.value })}
            style={S.input}
            placeholder="e.g. ABC Engineering Consultants"
          />
        </div>

        <div>
          <label style={{ ...S.label, display:'flex', alignItems:'center', gap:6 }}>
            <User style={{ width:14, height:14 }} /> Engineer Name
          </label>
          <input
            type="text"
            value={settings.engineerName}
            onChange={(e) => updateSettings({ engineerName: e.target.value })}
            style={S.input}
            placeholder="e.g. John Smith, CEng MIElecE"
          />
        </div>

        <p style={{ fontSize:12, color:'var(--ec-text-muted)', margin:0 }}>
          These details appear on exported calculation sheets and PDF reports.
        </p>
      </Card>

      {/* About */}
      <div style={{ borderRadius:14, background:'var(--ec-bg-surface)', border:'1px solid var(--ec-border)', padding:'16px 20px' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--ec-text-secondary)', marginBottom:8 }}>ElecCalc Pro v1.0.0</div>
        <div style={{ fontSize:12, color:'var(--ec-text-muted)', lineHeight:1.7 }}>
          Professional Electrical Engineering Calculation Suite<br />
          Standards: IEC · IEEE · NEC · BS 7671 · IS 3043<br />
          <span style={{ opacity:0.7 }}>All calculations are for engineering guidance only. Always verify with applicable local standards and a qualified engineer.</span>
        </div>
      </div>
    </div>
  );
}
