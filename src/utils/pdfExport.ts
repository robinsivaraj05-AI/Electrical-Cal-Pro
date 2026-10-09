import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CalculationResult, Project, AppSettings } from '../types';

interface ExportOptions {
  title: string;
  inputs: Record<string, string | number>;
  result: CalculationResult;
  project?: Project;
  settings?: AppSettings;
  calcType: string;
}

export function exportToPDF(options: ExportOptions): void {
  const { title, inputs, result, project, settings } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Color palette
  const PRIMARY = [30, 64, 175] as [number, number, number];
  const DARK = [15, 23, 42] as [number, number, number];
  const GRAY = [100, 116, 139] as [number, number, number];
  const SUCCESS = [21, 128, 61] as [number, number, number];
  const DANGER = [185, 28, 28] as [number, number, number];
  const WARN = [161, 98, 7] as [number, number, number];

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ELECTRICAL ENGINEERING CALCULATION', margin, 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Software: ElecCalc Pro  |  Standard: ${settings?.standard ?? 'IEC'}  |  Units: ${settings?.unitSystem ?? 'Metric'}`, margin, 16);

  // Company / Project info
  const company = settings?.companyName ?? 'Engineering Corp.';
  const engineer = settings?.engineerName ?? 'Engineer';
  const projName = project?.name ?? 'Untitled Project';
  const client = project?.client ?? '-';
  const projNo = project?.projectNo ?? '-';
  const rev = project?.revision ?? 'A';
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(9);
  doc.text(`${company}  |  Engineer: ${engineer}`, pageW - margin, 10, { align: 'right' });
  doc.text(`Project: ${projName}  |  Client: ${client}`, pageW - margin, 16, { align: 'right' });
  doc.text(`Doc No: ${projNo}-ELEC  |  Rev: ${rev}  |  Date: ${date}`, pageW - margin, 22, { align: 'right' });

  y = 36;

  // Calculation Title
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - 2 * margin, 12, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), margin + 4, y + 8);
  y += 18;

  // Standard Reference
  const ref = result.standardRef;
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, pageW - 2 * margin, 18, 'F');
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, 3, 18, 'F');
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STANDARD REFERENCE', margin + 6, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(`Standard: ${ref.standard}  |  Clause: ${ref.clause}  |  ${ref.table ?? ''}`, margin + 6, y + 12);
  doc.text(ref.title, margin + 6, y + 17);
  y += 24;

  // Formula box
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, pageW - 2 * margin, 12, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageW - 2 * margin, 12);
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Formula: ${result.formula}`, margin + 3, y + 7);
  y += 18;

  // Input parameters table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('1. INPUT PARAMETERS', margin, y);
  y += 6;

  const inputRows = Object.entries(inputs).map(([k, v]) => [k, String(v)]);
  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value']],
    body: inputRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold' }, 1: { cellWidth: 85 } },
    margin: { left: margin, right: margin },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Results table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('2. CALCULATION RESULTS', margin, y);
  y += 6;

  const resultRows = result.values.map((v) => [
    v.label,
    `${v.value} ${v.unit}`,
    v.status ?? '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value', 'Status']],
    body: resultRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 70 }, 2: { cellWidth: 15 } },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const status = data.cell.text[0];
        if (status === 'PASS') data.cell.styles.textColor = SUCCESS;
        else if (status === 'FAIL') data.cell.styles.textColor = DANGER;
        else if (status === 'WARNING') data.cell.styles.textColor = WARN;
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Step-by-step calculation
  if (result.steps.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('3. STEP-BY-STEP CALCULATION', margin, y);
    y += 6;

    const stepsRows = result.steps.map((s) => [
      `Step ${s.step}`,
      s.description,
      s.formula,
      s.result,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Step', 'Description', 'Formula', 'Result']],
      body: stepsRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 55 }, 2: { cellWidth: 65 }, 3: { cellWidth: 40 } },
      margin: { left: margin, right: margin },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Recommendation box
  if (y > 220) { doc.addPage(); y = 20; }
  const statusColor = result.status === 'PASS' ? SUCCESS : result.status === 'FAIL' ? DANGER : result.status === 'WARNING' ? WARN : GRAY;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`OVERALL STATUS: ${result.status}`, margin + 4, y + 5.5);
  y += 12;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageW - 2 * margin, 20, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ENGINEERING RECOMMENDATION:', margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  const recLines = doc.splitTextToSize(result.recommendation, pageW - 2 * margin - 6);
  doc.text(recLines, margin + 3, y + 12);
  y += 24;

  // Signature block
  if (y > 240) { doc.addPage(); y = 20; }
  y = Math.max(y + 10, 240);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageW / 2, y, pageW / 2 + 70, y);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Prepared by: ' + engineer, margin, y + 5);
  doc.text('Approved by: ___________________', pageW / 2, y + 5);
  doc.text(`Date: ${date}`, margin, y + 10);
  doc.text(`Revision: ${rev}`, pageW / 2, y + 10);

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 285, pageW, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`ElecCalc Pro  |  ${company}  |  Generated: ${new Date().toISOString()}`, margin, 291);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, 291, { align: 'right' });
  }

  // Save
  const filename = `${title.replace(/\s+/g, '_')}_${date.replace(/\s/g, '')}.pdf`;
  doc.save(filename);
}
