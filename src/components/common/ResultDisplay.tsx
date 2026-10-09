import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Download, FileSpreadsheet } from 'lucide-react';
import type { CalculationResult } from '../../types';
import { useStore } from '../../store/useStore';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/excelExport';

interface Props {
  result: CalculationResult;
  title: string;
  inputs: Record<string, string | number>;
  calcType: string;
}

const statusConfig = {
  PASS: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'PASS' },
  FAIL: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'FAIL' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', label: 'WARNING' },
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', label: 'RESULT' },
};

const valueStatusColors: Record<string, string> = {
  PASS: 'text-emerald-400',
  FAIL: 'text-red-400',
  WARNING: 'text-amber-400',
  INFO: 'text-blue-400',
};

export function ResultDisplay({ result, title, inputs, calcType }: Props) {
  const { settings, projects, activeProjectId } = useStore();
  const cfg = statusConfig[result.status];
  const StatusIcon = cfg.icon;
  const project = projects.find((p) => p.id === activeProjectId);

  const handlePDF = () => exportToPDF({ title, inputs, result, project, settings, calcType });
  const handleExcel = () => exportToExcel(title, inputs, result);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Status Banner */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
          <div>
            <div className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</div>
            <div className="text-slate-300 text-sm">{result.recommendation}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExcel}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
            title="Export to Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handlePDF}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            title="Export to PDF"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Result Values Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {result.values.map((v, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${v.highlight ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-800/60 border-slate-700/50'}`}
          >
            <div className="text-xs text-slate-400 mb-1">{v.label}</div>
            <div className={`font-bold text-base ${v.status ? valueStatusColors[v.status] : v.highlight ? 'text-blue-300' : 'text-white'}`}>
              {v.value}
              {v.unit && <span className="text-slate-400 text-xs font-normal ml-1">{v.unit}</span>}
            </div>
            {v.status && (
              <div className={`text-xs font-semibold mt-1 ${valueStatusColors[v.status]}`}>{v.status}</div>
            )}
          </div>
        ))}
      </div>

      {/* Standard Reference */}
      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40">
        <div className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">Standard Reference</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-400">Standard:</span> <span className="text-white font-medium">{result.standardRef.standard}</span></div>
          <div><span className="text-slate-400">Clause:</span> <span className="text-white font-medium">{result.standardRef.clause}</span></div>
          {result.standardRef.table && (
            <div><span className="text-slate-400">Table:</span> <span className="text-white font-medium">{result.standardRef.table}</span></div>
          )}
          <div className="md:col-span-2"><span className="text-slate-400">Title:</span> <span className="text-white">{result.standardRef.title}</span></div>
        </div>
      </div>

      {/* Formula */}
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Formula Used</div>
        <code className="text-blue-300 font-mono text-sm">{result.formula}</code>
      </div>

      {/* Step-by-Step */}
      {result.steps.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50">
            <div className="text-sm font-semibold text-white">Step-by-Step Calculation</div>
          </div>
          <div className="divide-y divide-slate-700/30">
            {result.steps.map((step) => (
              <div key={step.step} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 mb-1">{step.description}</div>
                    <code className="text-blue-300 font-mono text-xs block mb-1 break-all">{step.formula}</code>
                    <div className="text-emerald-400 text-sm font-semibold">= {step.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Factor */}
      {result.safetyFactor !== undefined && (
        <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-sm">
          <span className="text-slate-400">Safety Factor: </span>
          <span className="text-emerald-400 font-bold">{result.safetyFactor.toFixed(3)}</span>
          <span className="text-slate-400 ml-1">{result.safetyFactor >= 1.25 ? '✓ (≥ 1.25 — Acceptable)' : '⚠ (< 1.25 — Review required)'}</span>
        </div>
      )}
    </div>
  );
}
