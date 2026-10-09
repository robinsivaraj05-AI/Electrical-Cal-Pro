import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

const CONVERSIONS = [
  {
    category: 'Power',
    units: [
      { label: 'kW', factor: 1 },
      { label: 'MW', factor: 0.001 },
      { label: 'HP', factor: 1.341 },
      { label: 'kVA', factor: 1 },
      { label: 'BTU/hr', factor: 3412.14 },
    ],
  },
  {
    category: 'Current',
    units: [
      { label: 'A', factor: 1 },
      { label: 'mA', factor: 1000 },
      { label: 'kA', factor: 0.001 },
    ],
  },
  {
    category: 'Voltage',
    units: [
      { label: 'V', factor: 1 },
      { label: 'kV', factor: 0.001 },
      { label: 'MV', factor: 1e-6 },
      { label: 'mV', factor: 1000 },
    ],
  },
  {
    category: 'Energy',
    units: [
      { label: 'kWh', factor: 1 },
      { label: 'MWh', factor: 0.001 },
      { label: 'MJ', factor: 3.6 },
      { label: 'BTU', factor: 3412.14 },
    ],
  },
  {
    category: 'Resistance',
    units: [
      { label: 'Ω', factor: 1 },
      { label: 'mΩ', factor: 1000 },
      { label: 'kΩ', factor: 0.001 },
      { label: 'MΩ', factor: 1e-6 },
    ],
  },
  {
    category: 'Length',
    units: [
      { label: 'm', factor: 1 },
      { label: 'km', factor: 0.001 },
      { label: 'ft', factor: 3.28084 },
      { label: 'in', factor: 39.3701 },
      { label: 'mm', factor: 1000 },
    ],
  },
  {
    category: 'Temperature',
    units: [
      { label: '°C', factor: 1 },
      { label: '°F', factor: 1 },
      { label: 'K', factor: 1 },
    ],
  },
];

export function UnitConverter() {
  const [value, setValue] = useState('1');
  const [activeCategory, setActiveCategory] = useState('Power');
  const cat = CONVERSIONS.find((c) => c.category === activeCategory)!;

  const convertTo = (factor: number, toLabel: string) => {
    const v = parseFloat(value) || 0;
    if (activeCategory === 'Temperature') {
      if (cat.units[0].label === '°C') {
        if (toLabel === '°F') return ((v * 9) / 5 + 32).toFixed(4);
        if (toLabel === 'K') return (v + 273.15).toFixed(4);
        return v.toFixed(4);
      }
    }
    return (v / cat.units[0].factor * factor).toFixed(6);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
        <div className="p-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
          <Calculator className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Unit Converter</h2>
          <p className="text-xs text-slate-400">Electrical and physical unit conversions</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONVERSIONS.map((c) => (
          <button
            key={c.category}
            onClick={() => setActiveCategory(c.category)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              activeCategory === c.category ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {c.category}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-300 block mb-2">Input Value ({cat.units[0].label})</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cat.units.map((unit) => (
            <div key={unit.label} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <div className="text-xs text-slate-400 mb-1">{unit.label}</div>
              <div className="text-sm font-mono font-bold text-white">
                {convertTo(unit.factor, unit.label)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
