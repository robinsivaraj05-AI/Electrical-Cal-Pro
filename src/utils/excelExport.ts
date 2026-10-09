import * as XLSX from 'xlsx';
import type { CalculationResult } from '../types';

export function exportToExcel(
  title: string,
  inputs: Record<string, string | number>,
  result: CalculationResult
): void {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData: (string | number)[][] = [
    ['ELECTRICAL ENGINEERING CALCULATION REPORT', '', ''],
    ['', '', ''],
    ['Calculation', title, ''],
    ['Date', new Date().toLocaleDateString(), ''],
    ['Standard', result.standardRef.standard, ''],
    ['Clause', result.standardRef.clause, ''],
    ['Status', result.status, ''],
    ['', '', ''],
    ['=== INPUT PARAMETERS ===', '', ''],
    ['Parameter', 'Value', ''],
    ...Object.entries(inputs).map(([k, v]) => [k, v, '']),
    ['', '', ''],
    ['=== CALCULATION RESULTS ===', '', ''],
    ['Parameter', 'Value', 'Status'],
    ...result.values.map((v) => [v.label, `${v.value} ${v.unit}`, v.status ?? '']),
    ['', '', ''],
    ['=== RECOMMENDATION ===', '', ''],
    [result.recommendation, '', ''],
    ['', '', ''],
    ['Formula', result.formula, ''],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Steps sheet
  if (result.steps.length > 0) {
    const stepsData: (string | number)[][] = [
      ['Step-by-Step Calculation'],
      ['Step', 'Description', 'Formula', 'Result'],
      ...result.steps.map((s) => [s.step, s.description, s.formula, s.result]),
    ];
    const wsSteps = XLSX.utils.aoa_to_sheet(stepsData);
    wsSteps['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 60 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSteps, 'Calculation Steps');
  }

  const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
