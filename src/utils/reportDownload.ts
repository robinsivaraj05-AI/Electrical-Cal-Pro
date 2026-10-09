const STYLE = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:10pt;color:#1a1a2e;background:#fff;padding:12mm}
h1{font-size:15pt;color:#1e40af;margin-bottom:3px}
h2{font-size:10pt;font-weight:bold;color:#1e40af;background:#eff6ff;border-left:4px solid #1e40af;padding:5px 10px;margin:14px 0 0}
table{width:100%;border-collapse:collapse;margin-bottom:2px}
th{background:#1e40af;color:#fff;padding:5px 10px;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:.04em}
td{padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:9.5pt;vertical-align:top}
tr:nth-child(even) td{background:#f8fafc}
td.lbl{font-weight:600;color:#374151;width:30%}
td.val{color:#1e40af;font-weight:bold;width:20%}
td.note{color:#64748b;font-size:8.5pt}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #1e40af;margin-bottom:14px;padding-bottom:8px}
.hdr-right{text-align:right;font-size:8.5pt;color:#64748b}
.hdr-app{font-size:13pt;font-weight:bold;color:#1e40af}
.badge{display:inline-block;padding:1px 7px;border-radius:4px;font-size:8pt;font-weight:bold}
.b-pass{background:#dcfce7;color:#166534}.b-fail{background:#fee2e2;color:#991b1b}
.b-na{background:#f3f4f6;color:#374151}.b-warn{background:#fef3c7;color:#92400e}
.b-crit{background:#fee2e2;color:#991b1b}.b-high{background:#ffedd5;color:#9a3412}
.b-med{background:#fef3c7;color:#92400e}.b-low{background:#dcfce7;color:#166534}
.ftr{margin-top:16px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:7.5pt;color:#94a3b8;display:flex;justify-content:space-between}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.kpi-box{border:1px solid #e2e8f0;border-radius:5px;padding:8px 12px}
.kpi-lbl{font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.kpi-val{font-size:14pt;font-weight:900;color:#1e40af}
@page{margin:10mm;size:A4}
@media print{body{padding:0}}
`;

export function downloadReport(
  title: string,
  subtitle: string,
  standards: string,
  bodyHTML: string,
  filename: string
): void {
  const date = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' } as Intl.DateTimeFormatOptions);

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="hdr">
  <div>
    <h1>${title}</h1>
    <div style="font-size:9pt;color:#64748b;margin-top:2px">${subtitle}</div>
    <div style="font-size:8pt;color:#94a3b8;margin-top:2px">${standards}</div>
  </div>
  <div class="hdr-right">
    <div class="hdr-app">ElecCalc Pro</div>
    <div>Professional Engineering Suite</div>
    <div style="margin-top:4px">Generated: ${date}</div>
  </div>
</div>
${bodyHTML}
<div class="ftr">
  <span>ElecCalc Pro — ${title}</span>
  <span>${standards} &nbsp;|&nbsp; ${date}</span>
</div>
<script>setTimeout(function(){window.print();},350);</script>
</body>
</html>`;

  const blob = new Blob([full], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url; a.download = filename.replace('.pdf', '.html');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/** Convenience: build a <table> from rows */
export function tableHTML(headers: string[], rows: string[][]): string {
  return `<table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? 'lbl' : i === 1 ? 'val' : 'note'}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}
