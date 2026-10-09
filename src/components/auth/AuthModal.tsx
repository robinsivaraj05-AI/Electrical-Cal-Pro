import React, { useState } from 'react';
import {
  Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Shield, BarChart3, FileText, Cpu, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

// ── Feature bullets shown on left panel ──────────────────────
const FEATURES = [
  { icon: BarChart3, title: '30+ Calculation Modules',  desc: 'Cable sizing, motor, transformer, earthing, UPS, busbar and more' },
  { icon: Shield,    title: 'IEC · IEEE · NEC · BS · IS', desc: 'All calculations verified against international engineering standards' },
  { icon: FileText,  title: 'Professional PDF Reports',  desc: 'Export step-by-step workings with standard references' },
  { icon: Cpu,       title: 'AI Engineering Assistant',  desc: 'Instant answers to complex electrical engineering queries' },
];

// ── Circuit grid SVG pattern ──────────────────────────────────
function CircuitPattern() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#60A5FA" strokeWidth="0.5" />
        </pattern>
        <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1.5" fill="#60A5FA" />
          <circle cx="48" cy="0" r="1.5" fill="#60A5FA" />
          <circle cx="0" cy="48" r="1.5" fill="#60A5FA" />
          <circle cx="48" cy="48" r="1.5" fill="#60A5FA" />
          <circle cx="24" cy="24" r="1" fill="#60A5FA" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

export default function AuthModal() {
  const [mode, setMode]               = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm]               = useState({ email: '', password: '', name: '', company: '' });
  const [focusedField, setFocused]    = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({ email: form.email, password: form.password, name: form.name, company: form.company || undefined });
      }
    } catch {}
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    clearError();
    setForm({ email: '', password: '', name: '', company: '' });
  };

  const fillDemo = () => {
    clearError();
    setForm({ email: 'engineer@eleccalc.pro', password: 'engineer123', name: '', company: '' });
  };

  // Input style factory
  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%',
    height: 52,
    background: '#0A0F1E',
    border: `1.5px solid ${focusedField === name ? '#2563EB' : '#1E293B'}`,
    borderRadius: 10,
    padding: '0 16px',
    fontSize: 15,
    color: '#F8FAFC',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
    boxShadow: focusedField === name ? '0 0 0 3px rgba(37,99,235,.20)' : 'none',
    boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060B18 0%, #0A0F1E 40%, #0D1530 100%)',
      display: 'flex',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: -200, left: -200,
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -150, right: -150,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <CircuitPattern />

      {/* ════ LEFT PANEL — Feature showcase ════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', zIndex: 1,
        borderRight: '1px solid rgba(255,255,255,.04)',
      }}
        className="hidden lg:flex"
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 56 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(37,99,235,.50)',
          }}>
            <Zap style={{ width: 30, height: 30, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', lineHeight: 1 }}>
              ElecCalc Pro
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>
              Engineering Suite
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
            Professional<br />
            <span style={{ background: 'linear-gradient(90deg, #2563EB, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Electrical
            </span><br />
            Engineering
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7, maxWidth: 400 }}>
            Used by engineers in power plants, substations, data centres and EPC projects worldwide.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(37,99,235,.10)', border: '1px solid rgba(37,99,235,.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 20, height: 20, color: '#3B82F6' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#CBD5E1', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom standards */}
        <div style={{ marginTop: 56, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['IEC', 'IEEE', 'NEC', 'BS 7671', 'IS'].map((s) => (
            <span key={s} style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px',
              borderRadius: 6, background: '#111827', border: '1px solid #1E293B',
              color: '#475569', fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.04em',
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* ════ RIGHT PANEL — Auth form ════ */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px',
        position: 'relative', zIndex: 1,
      }}>

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(37,99,235,.45)',
          }}>
            <Zap style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ElecCalc Pro</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>Engineering Suite</div>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 10 }}>Professional Electrical Engineering Calculations</p>
        </div>

        {/* Form card */}
        <div style={{
          width: '100%',
          background: 'rgba(17,24,39,0.90)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 20,
          padding: '40px 40px 36px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,.60), 0 1px 0 rgba(255,255,255,.05) inset',
        }}>

          {/* Form heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p style={{ fontSize: 14, color: '#475569' }}>
              {mode === 'login'
                ? 'Enter your credentials to access ElecCalc Pro'
                : 'Set up your professional engineering workspace'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.30)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#FCA5A5' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {mode === 'register' && (
                <>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      required
                      placeholder="Dr. John Smith"
                      style={inputStyle('name')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company <span style={{ fontSize: 11, color: '#334155', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      onFocus={() => setFocused('company')}
                      onBlur={() => setFocused(null)}
                      placeholder="Engineering Corp."
                      style={inputStyle('company')}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="engineer@company.com"
                  style={inputStyle('email')}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  {mode === 'login' && (
                    <span style={{ fontSize: 13, color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    style={{ ...inputStyle('password'), paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', padding: 4, borderRadius: 6, display: 'flex',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                {mode === 'register' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {[6, 8, 12].map((len) => (
                      <div key={len} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: form.password.length >= len ? '#2563EB' : '#1E293B',
                        transition: 'background 300ms',
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: '#475569', marginLeft: 4, whiteSpace: 'nowrap' }}>
                      {form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  background: isLoading ? '#1D4ED8' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(37,99,235,.45)',
                  transition: 'all 200ms ease',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.01em',
                  marginTop: 4,
                }}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(37,99,235,.60)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,.45)'; }}
              >
                {isLoading && <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                {!isLoading && <ChevronRight style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </form>

          {/* Switch mode */}
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#475569' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#60A5FA')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#3B82F6')}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          {/* Demo credentials */}
          {mode === 'login' && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Demo Account
              </div>
              <button
                type="button"
                onClick={fillDemo}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10,
                  background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.20)',
                  color: '#60A5FA', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.15)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,.40)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.08)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,.20)'; }}
              >
                <CheckCircle2 style={{ width: 14, height: 14, color: '#22C55E' }} />
                engineer@eleccalc.pro / engineer123
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#1E293B', letterSpacing: '0.04em' }}>
            IEC &nbsp;•&nbsp; IEEE &nbsp;•&nbsp; NEC &nbsp;•&nbsp; BS 7671 &nbsp;•&nbsp; IS Standards
          </p>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
