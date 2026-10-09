import React, { useState } from 'react';
import { BookOpen, Search, ChevronRight, Globe, Building2, FileText, CheckCircle2, X } from 'lucide-react';
import { STANDARDS_DB, STANDARD_EQUATIONS } from '../data/standards';

const V = {
  bg:    'var(--ec-bg-card)',
  bgD:   'var(--ec-bg-root)',
  surf:  'var(--ec-bg-surface)',
  brd:   'var(--ec-border-card)',
  brdM:  'var(--ec-border-muted)',
  txt:   'var(--ec-text-primary)',
  sec:   'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)',
  lbl:   'var(--ec-text-label)',
  mono:  "'JetBrains Mono',monospace",
};

function getAccent(code: string) {
  if (code.startsWith('IEC'))  return { color: '#2563EB', bg: '#2563EB18', border: '#2563EB40', label: 'IEC' };
  if (code.startsWith('IEEE')) return { color: '#7C3AED', bg: '#7C3AED18', border: '#7C3AED40', label: 'IEEE' };
  if (code.startsWith('NEC'))  return { color: '#D97706', bg: '#D9770618', border: '#D9770640', label: 'NEC' };
  if (code.startsWith('BS'))   return { color: '#059669', bg: '#05966918', border: '#05966940', label: 'BS' };
  if (code.startsWith('IS'))   return { color: '#DC2626', bg: '#DC262618', border: '#DC262640', label: 'IS' };
  if (code.startsWith('NFPA')) return { color: '#EA580C', bg: '#EA580C18', border: '#EA580C40', label: 'NFPA' };
  return                         { color: '#64748B', bg: '#64748B18', border: '#64748B40', label: '' };
}

interface FamilyInfo {
  key:       string;
  fullName:  string;
  color:     string;
  bg:        string;
  border:    string;
  flag:      string;
  founded:   string;
  hq:        string;
  usedIn:    string;
  scope:     string;
  why:       string;
  keyAreas:  string[];
  note:      string;
}

const FAMILIES: FamilyInfo[] = [
  {
    key: 'IEC',
    fullName: 'International Electrotechnical Commission',
    color: '#2563EB', bg: '#2563EB18', border: '#2563EB40',
    flag: '🌐',
    founded: '1906',
    hq: 'Geneva, Switzerland',
    usedIn: 'Europe, Asia, Africa, Middle East, South America — 90+ countries',
    scope: 'International standards for all electrical, electronic and related technologies',
    why: 'IEC is the global benchmark for electrical engineering. Most countries outside North America legally adopt IEC standards. Using IEC-compliant designs ensures equipment can be sourced, installed and maintained worldwide without redesign.',
    keyAreas: [
      'IEC 60364 — Low-voltage electrical installations (wiring, protection)',
      'IEC 60287 / 60364-5-52 — Cable current rating and ampacity tables',
      'IEC 60909 — Short-circuit current calculation in three-phase systems',
      'IEC 60947 — Low-voltage switchgear (MCB, MCCB, contactors)',
      'IEC 61439 — Switchboards, MCCs and distribution boards',
      'IEC 61869 — Instrument transformers (CT and VT)',
      'IEC 61537 — Cable management: trays and ladders',
      'IEC 62305 — Lightning protection system design',
    ],
    note: 'IEC standards are adopted by CENELEC in Europe (EN prefix), by IS in India, by AS in Australia and by many Asian national bodies as-is or with minor amendments.',
  },
  {
    key: 'IEEE',
    fullName: 'Institute of Electrical and Electronics Engineers',
    color: '#7C3AED', bg: '#7C3AED18', border: '#7C3AED40',
    flag: '🇺🇸',
    founded: '1963',
    hq: 'Piscataway, New Jersey, USA',
    usedIn: 'USA, Canada; power systems guidance used globally alongside IEC',
    scope: 'Power systems analysis, protection coordination, grounding, arc flash hazard, harmonics',
    why: 'IEEE standards are the definitive authority for power systems engineering — particularly for protection relay coordination (IEEE C37 series), earthing grid design (IEEE 80), arc flash safety (IEEE 1584) and harmonic limits (IEEE 519). These fill gaps left by IEC in power system analysis.',
    keyAreas: [
      'IEEE 80 — Safety in AC substation grounding (touch/step voltage, grid design)',
      'IEEE 141 "Red Book" — Industrial power systems analysis and protection',
      'IEEE 242 "Buff Book" — Protection and coordination of industrial plants',
      'IEEE 519 — Harmonic voltage and current distortion limits',
      'IEEE 1584 — Arc flash hazard calculation and incident energy (PPE selection)',
      'IEEE C37.112 — IDMT overcurrent relay curves (MI, VI, EI)',
      'IEEE C37.90 — Relays and relay systems testing',
    ],
    note: 'For arc flash studies (NFPA 70E compliance) and relay coordination, IEEE 1584 and IEEE C37 series are the mandatory references regardless of whether the project otherwise follows IEC or NEC.',
  },
  {
    key: 'NEC',
    fullName: 'National Electrical Code — NFPA 70',
    color: '#D97706', bg: '#D9770618', border: '#D9770640',
    flag: '🇺🇸',
    founded: '1897 (revised every 3 years)',
    hq: 'Quincy, Massachusetts, USA — Published by NFPA',
    usedIn: 'United States — legally adopted by all 50 states and most US territories',
    scope: 'Safe electrical installation in buildings: wiring methods, conductor sizing, overcurrent protection, grounding and special occupancies',
    why: 'NEC compliance is a legal requirement for all electrical installations in the USA. Inspectors and authorities having jurisdiction (AHJ) enforce it. Without NEC compliance, a building will not pass inspection and cannot be occupied.',
    keyAreas: [
      'Article 220 — Branch-circuit, feeder and service load calculations',
      'Article 230 — Services: metering, disconnecting means',
      'Article 240 — Overcurrent protection: fuse and breaker sizing',
      'Article 250 — Grounding and bonding',
      'Article 310 — Conductors: ampacity tables (Table 310.15)',
      'Article 430 — Motor circuits and controllers',
      'Article 700/701/702 — Emergency, legally required standby, optional standby systems',
    ],
    note: 'NEC uses AWG and kcmil for conductor sizing, whereas IEC uses mm². NEC ambient reference is 60°C/75°C/90°C conductor temperature ratings vs. IEC\'s 70°C/90°C XLPE system.',
  },
  {
    key: 'BS',
    fullName: 'British Standards Institution — BS 7671 (IET Wiring Regulations)',
    color: '#059669', bg: '#05966918', border: '#05966940',
    flag: '🇬🇧',
    founded: '1901 (BSI); BS 7671 first published 1992',
    hq: 'London, United Kingdom',
    usedIn: 'United Kingdom, Ireland, many Commonwealth countries (Nigeria, Malaysia, Singapore, etc.)',
    scope: 'Requirements for electrical installations: design, selection, erection, inspection and testing',
    why: 'BS 7671 is the statutory instrument for UK electrical safety. It is published by the IET and referenced in UK building regulations. Engineers, contractors and inspectors in the UK must comply. Many former British territories still base their national codes on BS 7671.',
    keyAreas: [
      'Part 1 — Scope, object and fundamental principles',
      'Part 3 — Assessment of general characteristics (load calculation)',
      'Part 4 — Protection for safety (overcurrent, earth fault, shock)',
      'Part 5 — Selection and erection of equipment',
      'Appendix 4 — Current-carrying capacity tables (equivalent to IEC 60364-5-52)',
      'Appendix 12 — Voltage drop tables for cables',
      'Chapter 41 — Protection against electric shock (ELV, SELV, PELV)',
      'Chapter 54 — Earthing arrangements and protective conductors',
    ],
    note: 'BS 7671 is harmonised with IEC 60364 series. The 18th Edition (2018, Amendment 2: 2022) is current. It is commonly called "The IET Wiring Regulations."',
  },
  {
    key: 'IS',
    fullName: 'Bureau of Indian Standards — BIS',
    color: '#DC2626', bg: '#DC262618', border: '#DC262640',
    flag: '🇮🇳',
    founded: '1947',
    hq: 'New Delhi, India',
    usedIn: 'India — mandatory for all electrical installations under Indian Electricity Rules',
    scope: 'Indian national standards for electrical equipment, cables, earthing, wiring and power systems — largely adapted from IEC with Indian-specific conditions',
    why: 'IS standards are mandatory for projects in India under the Indian Electricity Act 2003 and Indian Electricity Rules 1956. Statutory bodies (CEIG, state electricity boards) require IS compliance for approval. Indian soil conditions, climate and voltage levels (415 V, 11 kV) require local adaptation from IEC.',
    keyAreas: [
      'IS 3043 — Code of practice for earthing (electrodes, earth continuity, bonding)',
      'IS 1554 — PVC insulated cables for working voltages up to and including 1100V',
      'IS 7098 — XLPE insulated cables for working voltages',
      'IS 732 — Code of practice for electrical wiring installations',
      'IS 13947 — Low-voltage switchgear and controlgear (IEC 60947 adoption)',
      'IS 2026 — Power transformers',
      'IS 12360 — Voltage bands for electrical installations',
      'IS 5216 — Safety in electrical testing — Guide',
    ],
    note: 'India follows 50 Hz, 415 V (3-phase) and 230 V (single-phase). Indian standards often reference IEC but include Indian amendments for hot/humid climate derating and local equipment ratings.',
  },
];

const FAMILY_KEYS = ['All', 'IEC', 'IEEE', 'NEC', 'BS', 'IS'];

export function StandardsLibrary() {
  const [search,     setSearch]     = useState('');
  const [family,     setFamily]     = useState('All');
  const [detailKey,  setDetailKey]  = useState<string | null>(null);
  const [eqOpen,     setEqOpen]     = useState<string | null>(null);

  const filtered = STANDARDS_DB.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.scope.toLowerCase().includes(q);
    const matchFamily = family === 'All' || s.code.startsWith(family);
    return matchSearch && matchFamily;
  });

  const detailInfo = FAMILIES.find((f) => f.key === detailKey) ?? null;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 1100 }}>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid var(--ec-border)` }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563EB18', border: '1px solid #2563EB40', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen style={{ width: 22, height: 22, color: '#2563EB' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: V.txt, margin: 0, letterSpacing: '-0.02em' }}>Engineering Standards Library</h2>
          <p style={{ fontSize: 13, color: V.sec, margin: '4px 0 0', fontWeight: 500 }}>IEC · IEEE · NEC · BS 7671 · IS (BIS) — international, US, UK and Indian electrical standards</p>
        </div>
        <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, background: '#2563EB18', border: '1px solid #2563EB30', fontSize: 12, fontWeight: 700, color: '#2563EB' }}>
          {STANDARDS_DB.length} Standards
        </div>
      </div>

      {/* ── STANDARD FAMILY OVERVIEW CARDS ─────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: V.lbl, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 12 }}>
          Standard Families — click any card to learn more
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {FAMILIES.map((f) => {
            const isDetail = detailKey === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setDetailKey(isDetail ? null : f.key)}
                style={{
                  textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                  background: isDetail ? f.bg : V.bg,
                  border: `2px solid ${isDetail ? f.color : V.brd}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.flag}</div>
                <div style={{ fontFamily: V.mono, fontSize: 16, fontWeight: 900, color: f.color, marginBottom: 4 }}>{f.key}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: V.sec, lineHeight: 1.4 }}>
                  {f.key === 'IEC'  && 'International Electrotechnical Commission'}
                  {f.key === 'IEEE' && 'Institute of Electrical & Electronics Engineers'}
                  {f.key === 'NEC'  && 'National Electrical Code (NFPA 70)'}
                  {f.key === 'BS'   && 'British Standards — IET Wiring Regulations'}
                  {f.key === 'IS'   && 'Bureau of Indian Standards (BIS)'}
                </div>
                <div style={{ marginTop: 10, fontSize: 10, fontWeight: 700, color: f.color, background: f.bg, border: `1px solid ${f.border}`, padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>
                  {f.usedIn.split('—')[0].trim().split(',')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FAMILY DETAIL PANEL ─────────────────────────────── */}
      {detailInfo && (
        <div style={{ marginBottom: 28, background: V.bg, border: `2px solid ${detailInfo.color}40`, borderRadius: 16, overflow: 'hidden', borderLeft: `6px solid ${detailInfo.color}` }}>
          {/* Detail header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px 16px', borderBottom: `1px solid ${V.brdM}`, background: `${detailInfo.bg}` }}>
            <div style={{ fontSize: 36 }}>{detailInfo.flag}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: V.mono, fontSize: 20, fontWeight: 900, color: detailInfo.color }}>{detailInfo.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: V.sec }}>—</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: V.txt }}>{detailInfo.fullName}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: V.sec }}><span style={{ fontWeight: 700, color: V.lbl }}>Founded:</span> {detailInfo.founded}</span>
                <span style={{ fontSize: 12, color: V.sec }}><span style={{ fontWeight: 700, color: V.lbl }}>HQ:</span> {detailInfo.hq}</span>
              </div>
            </div>
            <button onClick={() => setDetailKey(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: V.muted, padding: 4 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Left column */}
            <div style={{ padding: '20px 24px', borderRight: `1px solid ${V.brdM}` }}>
              {/* Scope */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Globe style={{ width: 14, height: 14, color: detailInfo.color }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scope</span>
                </div>
                <p style={{ fontSize: 13, color: V.sec, margin: 0, lineHeight: 1.6 }}>{detailInfo.scope}</p>
              </div>
              {/* Used In */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Building2 style={{ width: 14, height: 14, color: detailInfo.color }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Used In</span>
                </div>
                <p style={{ fontSize: 13, color: V.sec, margin: 0, lineHeight: 1.6 }}>{detailInfo.usedIn}</p>
              </div>
              {/* Why use it */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: detailInfo.color }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Why This Standard Matters</span>
                </div>
                <p style={{ fontSize: 13, color: V.sec, margin: 0, lineHeight: 1.7 }}>{detailInfo.why}</p>
              </div>
            </div>

            {/* Right column */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FileText style={{ width: 14, height: 14, color: detailInfo.color }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Key Standards & Coverage</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detailInfo.keyAreas.map((area, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>
                    <ChevronRight style={{ width: 13, height: 13, color: detailInfo.color, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12.5, color: V.txt, lineHeight: 1.5 }}>{area}</span>
                  </div>
                ))}
              </div>
              {/* Note */}
              <div style={{ marginTop: 14, padding: '10px 14px', background: `${detailInfo.bg}`, border: `1px solid ${detailInfo.border}`, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: detailInfo.color }}>NOTE: </span>
                <span style={{ fontSize: 12, color: V.sec, lineHeight: 1.5 }}>{detailInfo.note}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH + FILTER ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: V.muted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search standards by code, title or scope…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 10,
              padding: '11px 14px 11px 42px', fontSize: 14, color: V.txt,
              outline: 'none', fontFamily: "'Inter',sans-serif",
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FAMILY_KEYS.map((f) => {
            const active = family === f;
            const acc = f === 'All' ? { color: '#2563EB', bg: '#2563EB18', border: '#2563EB40' } : getAccent(f);
            return (
              <button key={f} onClick={() => setFamily(f)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${active ? acc.border : V.brd}`,
                background: active ? acc.bg : V.bg,
                color: active ? acc.color : V.sec,
                transition: 'all 0.15s',
              }}>{f}</button>
            );
          })}
        </div>
      </div>

      {/* ── STANDARDS GRID ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(440px,1fr))', gap: 16, marginBottom: 40 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: V.muted, fontSize: 14 }}>
            No standards match your search.
          </div>
        )}
        {filtered.map((std) => {
          const acc = getAccent(std.code);
          return (
            <div key={std.code} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 14, overflow: 'hidden', borderLeft: `4px solid ${acc.color}` }}>
              <div style={{ padding: '16px 18px 13px', borderBottom: `1px solid ${V.brdM}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: V.mono, fontSize: 15, fontWeight: 800, color: acc.color }}>{std.code}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', background: acc.bg, border: `1px solid ${acc.border}`, color: acc.color }}>{acc.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: V.txt, lineHeight: 1.4 }}>{std.title}</div>
              </div>
              <div style={{ padding: '14px 18px 16px' }}>
                <div style={{ fontSize: 13, color: V.sec, marginBottom: 14, lineHeight: 1.55 }}>{std.scope}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Key Clauses</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {std.clauses.map((c) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <ChevronRight style={{ width: 13, height: 13, color: acc.color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: V.txt, lineHeight: 1.45 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── EQUATIONS SECTION ───────────────────────────────── */}
      <div style={{ borderTop: `2px solid var(--ec-border)`, paddingTop: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: V.txt, margin: 0, letterSpacing: '-0.01em' }}>Key Engineering Equations</h3>
          <p style={{ fontSize: 13, color: V.sec, margin: '4px 0 0' }}>Reference formulas with variable definitions — click to expand</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(420px,1fr))', gap: 14 }}>
          {Object.entries(STANDARD_EQUATIONS).map(([key, eq]) => {
            const eqAny = eq as Record<string, unknown>;
            const hasVars = Boolean(eqAny.variables);
            const isOpen = eqOpen === key;
            const stdAcc = getAccent(eq.standard);
            const label = key.replace(/([A-Z])/g, ' $1').trim();

            return (
              <div key={key} style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => hasVars && setEqOpen(isOpen ? null : key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'transparent', border: 'none',
                    cursor: hasVars ? 'pointer' : 'default',
                    borderBottom: isOpen ? `1px solid ${V.brdM}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: V.sec, textTransform: 'capitalize', flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: stdAcc.color, background: stdAcc.bg, border: `1px solid ${stdAcc.border}`, padding: '2px 8px', borderRadius: 8 }}>{eq.standard}</span>
                    {hasVars && <span style={{ fontSize: 11, color: V.muted, fontWeight: 700 }}>{isOpen ? '▲' : '▼'}</span>}
                  </div>
                  <code style={{ fontFamily: V.mono, fontSize: 14, fontWeight: 700, color: '#60A5FA', display: 'block', padding: '8px 12px', background: V.surf, borderRadius: 8, border: `1px solid ${V.brdM}` }}>{eq.formula}</code>
                  <div style={{ fontSize: 12, color: V.muted, marginTop: 8 }}>{eq.standard} — Clause {eq.clause}</div>
                </button>
                {isOpen && hasVars && (
                  <div style={{ padding: '14px 16px', background: V.surf }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Variable Definitions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(eqAny.variables as Record<string, string>).map(([sym, def]) => (
                        <div key={sym} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <code style={{ fontFamily: V.mono, fontSize: 13, fontWeight: 700, color: '#F59E0B', minWidth: 68, flexShrink: 0 }}>{sym}</code>
                          <span style={{ fontSize: 13, color: V.sec, lineHeight: 1.45 }}>{def}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
