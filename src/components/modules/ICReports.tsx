import React, { useState } from 'react';
import { FileText, Download, Mail, Printer, Copy, CheckCircle } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#DC2626';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)', mono: "'JetBrains Mono',monospace",
};

const REPORT_TYPES = [
  { id: 'loop-summary',    label: 'Loop Verification Summary',   desc: 'All instrument loops checked, signal verified, scaling confirmed',   modules: ['4-20mA', 'PLC Scaling', 'RTD', 'TC'], standards: 'ISA-51.1 · NAMUR NE43 · IEC 60381' },
  { id: 'calibration',     label: 'Calibration Record Sheet',    desc: '5-point as-found / as-left calibration record with pass/fail',       modules: ['Any instrument type'], standards: 'ISA-51.1 · IEC 60770 · OIML · ISO 9001' },
  { id: 'pressure',        label: 'Pressure Calculations',       desc: 'Unit conversions, static head, differential pressure, hydrostatic',   modules: ['Pressure Calculator'], standards: 'IEC 60770 · ASME B40.100 · ISO 7-1' },
  { id: 'flow',            label: 'Flow Calculations',           desc: 'Q=AV, orifice plate, valve Cv, Reynolds number, mass flow',           modules: ['Flow Calculator'], standards: 'ISO 5167 · AGA-9 · API 2534 · ISA-75.01' },
  { id: 'temperature',     label: 'Temperature Report',          desc: 'Unit conversion, RTD Pt100 resistance, thermocouple mV, error %',     modules: ['Temperature Calculator'], standards: 'IEC 60751 · IEC 60584 · ASTM E230' },
  { id: 'pid',             label: 'PID Tuning Report',           desc: 'Ziegler-Nichols / Cohen-Coon / Lambda tuning results',               modules: ['PID Tuning Calculator'], standards: 'ISA-5.1 · ISA-TR5.4 · IEC 61131' },
  { id: 'glass-furnace',   label: 'Glass Furnace Report',        desc: 'Furnace heat balance, combustion, cullet savings, gas consumption',   modules: ['Glass Process Calcs'], standards: 'EN 695 · EN 746-2 · ISO 8006 · NFPA 86' },
  { id: 'daily-checklist', label: 'Daily Inspection Report',     desc: 'Daily I&C inspection checklist with pass/fail and defects',           modules: ['I&C Checklists'], standards: 'ISA-51.1 · IEC 61511 · ISO 9001' },
  { id: 'valve-sizing',    label: 'Control Valve Sizing Report', desc: 'Cv/Kv calculation, authority, rangeability, characteristic analysis', modules: ['Control Valve Calculator'], standards: 'ISA-75.01 · IEC 60534 · ANSI/FCI 70-2' },
  { id: 'is-verification', label: 'IS Entity Verification',      desc: 'Intrinsic safety entity concept check — Voc, Isc, Pmax, Ca, La',     modules: ['Loop Budget Calculator'], standards: 'IEC 60079-11 · IEC 60079-14 · ATEX 2014/34/EU' },
];

export function ICReports() {
  const [company, setCompany] = useState('');
  const [engineer, setEngineer] = useState('');
  const [project, setProject] = useState('');
  const [docNo, setDocNo] = useState('');
  const [date] = useState(new Date().toLocaleDateString('en-GB'));
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('I&C Engineering Calculation Report');
  const [emailBody, setEmailBody] = useState('Please find attached the I&C engineering calculation report generated using ElecCalc Pro.');
  const [copied, setCopied] = useState(false);

  const generateModuleSummary = () => {
    const rows = REPORT_TYPES.map(r => [r.label, r.modules.join(', '), r.standards]);
    const body = `
<h2>Company Information</h2>
<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
<tr><td class="lbl">Company</td><td class="val">${company || '—'}</td></tr>
<tr><td class="lbl">Engineer</td><td class="val">${engineer || '—'}</td></tr>
<tr><td class="lbl">Project</td><td class="val">${project || '—'}</td></tr>
<tr><td class="lbl">Document No.</td><td class="val">${docNo || '—'}</td></tr>
<tr><td class="lbl">Date</td><td class="val">${date}</td></tr>
</tbody></table>

<h2>I&C Module Summary — Available Calculation Reports</h2>
${tableHTML(['Report Type', 'Source Modules', 'Standards'], rows)}

<h2>Module Capabilities Summary</h2>
<table><thead><tr><th>Module</th><th>Calculators</th><th>Key Output</th></tr></thead><tbody>
<tr><td class="lbl">Instrument Calculators</td><td class="val">40+ (Pressure, Flow, Temp, Level, Valve, PID, Signal, Loop)</td><td class="note">Calculation results with step-by-step working</td></tr>
<tr><td class="lbl">Glass Process Calculators</td><td class="val">9 (Furnace, Combustion, Cullet, Batch, Lehr, Tin Bath, Gas, Motor, Production)</td><td class="note">Glass plant engineering calculations</td></tr>
<tr><td class="lbl">Calibration Tools</td><td class="val">23 instrument types, 5-point As Found/As Left</td><td class="note">Calibration certificate PDF</td></tr>
<tr><td class="lbl">Verification Tools</td><td class="val">7 (4-20mA, PLC, RTD, TC, Cable, IR, Power)</td><td class="note">Pass/Fail verification records</td></tr>
<tr><td class="lbl">I&C Checklists</td><td class="val">Daily (32), Monthly (22), Annual (25)</td><td class="note">Inspection records with defect log</td></tr>
<tr><td class="lbl">Engineering Study</td><td class="val">18 topics across all I&C disciplines</td><td class="note">Reference manual PDF</td></tr>
</tbody></table>

<h2>Standards Compliance</h2>
<p>All calculations comply with: ISA-5.1 · ISA-51.1 · ISA-75.01 · IEC 60381 · IEC 60534 · IEC 60751 · IEC 60584 · IEC 60770 · IEC 61131 · IEC 61511 · IEC 60079 · ISO 5167 · NAMUR NE43 · API RP 551 · EN 695 · EN 746-2</p>

<h2>Engineer Sign-off</h2>
<p>Prepared By: _________________________ Signature: _________________________  Date: _________________________</p>
<p>Checked By: _________________________ Signature: _________________________  Date: _________________________</p>
<p>Approved By: ________________________ Signature: _________________________  Date: _________________________</p>`;

    downloadReport(
      'I&C Engineering Module — Calculation Report Summary',
      `${company ? company + ' · ' : ''}${engineer ? 'Prepared by: ' + engineer + ' · ' : ''}${project ? 'Project: ' + project + ' · ' : ''}Date: ${date}`,
      'ISA · IEC 60381 · IEC 60751 · IEC 60584 · IEC 61511 · ISO 5167 · NAMUR NE43 · EN 695',
      body,
      `IC-Report-Summary-${date.replace(/\//g,'-')}.pdf`
    );
  };

  const openEmailClient = () => {
    const subject = encodeURIComponent(emailSubject);
    const body2 = encodeURIComponent(`${emailBody}\n\nCompany: ${company}\nEngineer: ${engineer}\nProject: ${project}\nDate: ${date}\n\nGenerated by ElecCalc Pro — I&C Engineering Module`);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body2}`);
  };

  const copyEmailText = () => {
    const text = `${emailSubject}\n\nTo: ${emailTo}\n\n${emailBody}\n\nCompany: ${company}\nEngineer: ${engineer}\nProject: ${project}\nDate: ${date}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={FileText} title="REPORTS & EMAIL" subtitle="Generate · Download PDF · Send by Email · ISA · IEC · Glass Manufacturing Standards" accentColor={ACCENT} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Report Header Config */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14 }}>Report Header Information</div>
          {[
            ['Company Name', company, setCompany],
            ['Engineer / Prepared By', engineer, setEngineer],
            ['Project / Plant Name', project, setProject],
            ['Document Number', docNo, setDocNo],
          ].map(([label, val, set]) => (
            <div key={label as string} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label as string}</div>
              <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} placeholder={`Enter ${label as string}…`}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
            </div>
          ))}
          <div style={{ padding: '8px 12px', background: V.surf, borderRadius: 8, fontSize: 12, color: V.muted, marginBottom: 14 }}>
            Date: <strong style={{ color: V.txt }}>{date}</strong> (auto)
          </div>
          <button onClick={generateModuleSummary} style={{ width: '100%', padding: '12px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download style={{ width: 14, height: 14 }} /> Generate & Download Module Summary PDF
          </button>
          <div style={{ marginTop: 10, fontSize: 11, color: V.muted, textAlign: 'center' }}>
            Opens print dialog → Save as PDF
          </div>
        </div>

        {/* Email Feature */}
        <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0EA5E9', marginBottom: 14 }}>Email Report</div>
          {[
            ['Recipient Email', emailTo, setEmailTo, 'email', 'engineer@company.com'],
            ['Email Subject', emailSubject, setEmailSubject, 'text', ''],
          ].map(([label, val, set, type, placeholder]) => (
            <div key={label as string} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>{label as string}</div>
              <input type={type as string} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} placeholder={placeholder as string}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' }} />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.lbl, marginBottom: 4 }}>Message Body</div>
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={4}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={openEmailClient} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#0EA5E9', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Mail style={{ width: 13, height: 13 }} /> Open Email Client
            </button>
            <button onClick={copyEmailText} style={{ flex: 1, padding: '10px', borderRadius: 8, background: copied ? '#059669' : V.surf, color: copied ? '#fff' : V.txt, border: `1.5px solid ${V.brd}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {copied ? <CheckCircle style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#0EA5E9' + '15', borderRadius: 8, fontSize: 11, color: V.muted, lineHeight: 1.5 }}>
            <strong style={{ color: '#0EA5E9' }}>Workflow:</strong> 1. Generate & Download PDF from any calculator module. 2. Open your email client via the button above. 3. Attach the downloaded PDF manually. 4. Send to recipient.
          </div>
        </div>
      </div>

      {/* Available Report Types */}
      <div style={{ background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', background: V.surf, borderBottom: `1px solid ${V.brdM}`, fontSize: 13, fontWeight: 700, color: ACCENT }}>
          Available Calculation Reports — Download from Each Module
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
          {REPORT_TYPES.map((r, i) => (
            <div key={r.id} style={{ padding: '12px 20px', borderBottom: `1px solid ${V.brdM}`, borderRight: i % 2 === 0 ? `1px solid ${V.brdM}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <FileText style={{ width: 14, height: 14, color: ACCENT, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: V.txt, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.4, marginBottom: 3 }}>{r.desc}</div>
                  <div style={{ fontSize: 10, color: V.lbl }}>{r.standards}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print hint */}
      <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, padding: '12px 16px', background: V.surf, borderRadius: 10, border: `1px solid ${V.brdM}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Printer style={{ width: 16, height: 16, color: V.muted, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: V.muted }}>Each Download button opens a print-ready HTML report in a new tab. Use <strong style={{ color: V.txt }}>File → Print → Save as PDF</strong> to save to your device.</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: ACCENT + '15', borderRadius: 10, border: `1px solid ${ACCENT}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: V.sec }}>All reports include: <strong style={{ color: V.txt }}>Company info · Date · Engineer · Standards · Step-by-step working · Sign-off area</strong></div>
        </div>
      </div>
    </div>
  );
}
