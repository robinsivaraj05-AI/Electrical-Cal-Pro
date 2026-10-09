import React, { useState } from 'react';
import { History, Trash2, Download, Clock, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToPDF } from '../utils/pdfExport';

const V = {
  bg:   'var(--ec-bg-card)',
  bgD:  'var(--ec-bg-root)',
  surf: 'var(--ec-bg-surface)',
  brd:  'var(--ec-border-card)',
  brdB: 'var(--ec-border)',
  brdM: 'var(--ec-border-muted)',
  txt:  'var(--ec-text-primary)',
  sec:  'var(--ec-text-secondary)',
  muted:'var(--ec-text-muted)',
  lbl:  'var(--ec-text-label)',
};

const STATUS_CFG: Record<string, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  PASS:    { bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.35)',  color:'#16A34A', icon:<CheckCircle2 style={{ width:11, height:11 }} /> },
  FAIL:    { bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.35)',  color:'#DC2626', icon:<XCircle style={{ width:11, height:11 }} /> },
  WARNING: { bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.35)', color:'#D97706', icon:<AlertTriangle style={{ width:11, height:11 }} /> },
  INFO:    { bg:'rgba(37,99,235,.12)',  border:'rgba(37,99,235,.35)',  color:'#2563EB', icon:<Info style={{ width:11, height:11 }} /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['INFO'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:800, letterSpacing:'0.04em',
      background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color,
      flexShrink:0,
    }}>
      {cfg.icon}{status}
    </span>
  );
}

const TYPE_LABEL: Record<string, string> = {
  all:'All', harmonic:'Harmonic', dc:'DC', earthing:'Earthing',
  'cable-current':'Cable Current', transformer:'Transformer',
  'cable-gland':'Cable Gland', ups:'UPS', lighting:'Lighting',
  'load-schedule':'Load Schedule', 'pump-motor':'Pump Motor',
};

export function CalcHistory() {
  const { calculationHistory, clearHistory, settings } = useStore();
  const [filter, setFilter] = useState('all');

  const types = ['all', ...new Set(calculationHistory.map((c) => c.type))];
  const filtered = filter === 'all' ? calculationHistory : calculationHistory.filter((c) => c.type === filter);

  return (
    <div className="animate-fadeIn" style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:16, borderBottom:`1px solid ${V.brdM}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:V.surf, border:`1px solid ${V.brdB}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <History style={{ width:20, height:20, color:V.muted }} />
          </div>
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:V.txt, margin:0 }}>Calculation History</h2>
            <p style={{ fontSize:12, color:V.muted, margin:0, marginTop:2 }}>{calculationHistory.length} calculations stored</p>
          </div>
        </div>
        {calculationHistory.length > 0 && (
          <button onClick={clearHistory} style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
            background:'rgba(239,68,68,.10)', border:'1px solid rgba(239,68,68,.30)',
            color:'#DC2626', fontSize:12, fontWeight:700, borderRadius:8, cursor:'pointer',
            transition:'all 150ms', fontFamily:'inherit',
          }}>
            <Trash2 style={{ width:13, height:13 }} /> Clear All
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {types.slice(0, 12).map((type) => {
          const active = filter === type;
          return (
            <button key={type} onClick={() => setFilter(type)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
              border:`1.5px solid ${active ? 'var(--ec-primary,#2563EB)' : V.brdB}`,
              background: active ? 'var(--ec-primary,#2563EB)' : V.surf,
              color: active ? '#fff' : V.sec,
              transition:'all 150ms', fontFamily:'inherit',
            }}>
              {TYPE_LABEL[type] ?? type.replace(/-/g, ' ')}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <History style={{ width:56, height:56, margin:'0 auto 16px', color:V.muted, opacity:0.25 }} />
          <p style={{ fontSize:14, color:V.muted }}>No calculations yet. Start calculating!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((calc) => {
            const highlights = calc.results.values.filter((v) => v.highlight);
            return (
              <div key={calc.id} style={{
                background:V.bg, border:`1px solid ${V.brd}`, borderRadius:14,
                overflow:'hidden', boxShadow:'var(--ec-shadow-card)',
                transition:'box-shadow 150ms',
              }}>
                {/* Row header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom: highlights.length ? `1px solid ${V.brdM}` : undefined }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 }}>
                    <StatusBadge status={calc.results.status} />
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:V.txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{calc.title}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                        <Clock style={{ width:11, height:11, color:V.muted, flexShrink:0 }} />
                        <span style={{ fontSize:11, color:V.muted }}>
                          {new Date(calc.timestamp).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </span>
                        {calc.standard && (
                          <>
                            <span style={{ fontSize:11, color:V.brdB }}>·</span>
                            <span style={{ fontSize:11, color:V.lbl, fontWeight:600 }}>{calc.standard}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => exportToPDF({
                      title: calc.title,
                      inputs: calc.inputs,
                      result: calc.results,
                      settings,
                      calcType: calc.type,
                    })}
                    title="Export PDF"
                    style={{
                      flexShrink:0, marginLeft:12,
                      width:34, height:34, borderRadius:8, border:`1px solid ${V.brdB}`,
                      background:'rgba(37,99,235,.08)', color:'#2563EB',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', transition:'all 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background='rgba(37,99,235,.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background='rgba(37,99,235,.08)'; }}
                  >
                    <Download style={{ width:15, height:15 }} />
                  </button>
                </div>

                {/* Highlighted result chips */}
                {highlights.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'10px 16px', background:V.surf }}>
                    {highlights.map((v, i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'center', gap:5,
                        padding:'4px 10px', borderRadius:8,
                        background:V.bg, border:`1px solid ${V.brd}`,
                        fontSize:12,
                      }}>
                        <span style={{ color:V.muted, fontWeight:500 }}>{v.label}:</span>
                        <span style={{ color:V.txt, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{v.value}</span>
                        {v.unit && <span style={{ color:V.muted, fontSize:11 }}>{v.unit}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
