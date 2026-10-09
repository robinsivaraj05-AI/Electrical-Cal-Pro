import React, { useState } from 'react';
import { Server, Plus, Edit2, X, ChevronRight, Download } from 'lucide-react';
import { ModHeader } from '../common/ModuleShared';
import { downloadReport, tableHTML } from '../../utils/reportDownload';

const ACCENT = '#16A34A';
const V = {
  bg: 'var(--ec-bg-card)', surf: 'var(--ec-bg-surface)', brd: 'var(--ec-border-card)',
  brdM: 'var(--ec-border-muted)', txt: 'var(--ec-text-primary)', sec: 'var(--ec-text-secondary)',
  muted: 'var(--ec-text-muted)', lbl: 'var(--ec-text-label)',
};

interface DGAsset {
  id: string; name: string; assetId: string; manufacturer: string; model: string;
  serialNo: string; engineModel: string; alternatorModel: string; controllerType: string;
  ratedKVA: string; ratedKW: string; voltage: string; frequency: string; rpm: string;
  cylinders: string; fuelTankL: string; oilCapL: string; coolantL: string; batteryV: string;
  installDate: string; lastServiceDate: string; nextServiceDate: string; warranty: string; location: string;
  status: string;
}

const EMPTY: DGAsset = {
  id: '', name: '', assetId: '', manufacturer: '', model: '', serialNo: '',
  engineModel: '', alternatorModel: '', controllerType: '', ratedKVA: '', ratedKW: '',
  voltage: '415', frequency: '50', rpm: '1500', cylinders: '6',
  fuelTankL: '', oilCapL: '', coolantL: '', batteryV: '24',
  installDate: '', lastServiceDate: '', nextServiceDate: '', warranty: '', location: '', status: 'Available',
};

const INITIAL: DGAsset[] = [
  { id: '1', name: 'Main DG Set', assetId: 'DG-01', manufacturer: 'Cummins', model: 'C500D5', serialNo: 'CUM2019001', engineModel: 'QSZ13-G2', alternatorModel: 'HCI634H', controllerType: 'DEIF AGC-4', ratedKVA: '500', ratedKW: '400', voltage: '415', frequency: '50', rpm: '1500', cylinders: '6', fuelTankL: '1000', oilCapL: '35', coolantL: '80', batteryV: '24', installDate: '2019-03-15', lastServiceDate: '2025-07-01', nextServiceDate: '2026-01-01', warranty: '5 years (expired)', location: 'Block A — Main Substation', status: 'Running' },
  { id: '2', name: 'Standby DG Set', assetId: 'DG-02', manufacturer: 'Caterpillar', model: 'C500 D5e', serialNo: 'CAT2020045', engineModel: 'C13', alternatorModel: 'SR4B', controllerType: 'CAT EMCP 4.2', ratedKVA: '500', ratedKW: '400', voltage: '415', frequency: '50', rpm: '1500', cylinders: '6', fuelTankL: '1000', oilCapL: '32', coolantL: '75', batteryV: '24', installDate: '2020-06-20', lastServiceDate: '2025-06-15', nextServiceDate: '2025-12-15', warranty: '3 years (expired)', location: 'Block A — Standby Bay', status: 'Standby' },
  { id: '3', name: 'Emergency DG', assetId: 'DG-03', manufacturer: 'Perkins', model: '2806A-E18TAG2', serialNo: 'PER2022088', engineModel: '2806A-E18TAG2', alternatorModel: 'UCI274H', controllerType: 'Deep Sea DSE7320', ratedKVA: '250', ratedKW: '200', voltage: '415', frequency: '50', rpm: '1500', cylinders: '6', fuelTankL: '500', oilCapL: '20', coolantL: '45', batteryV: '24', installDate: '2022-09-01', lastServiceDate: '2025-08-01', nextServiceDate: '2026-02-01', warranty: '2 years remaining', location: 'Hospital Block — Emergency Bay', status: 'Available' },
  { id: '4', name: 'Auxiliary DG', assetId: 'DG-04', manufacturer: 'Kirloskar', model: 'KG1-125AS', serialNo: 'KIR2015033', engineModel: 'TA45001', alternatorModel: 'AE2', controllerType: 'DSE7310', ratedKVA: '125', ratedKW: '100', voltage: '415', frequency: '50', rpm: '1500', cylinders: '4', fuelTankL: '330', oilCapL: '14', coolantL: '30', batteryV: '24', installDate: '2015-01-10', lastServiceDate: '2025-04-01', nextServiceDate: '2025-10-01', warranty: 'Expired', location: 'Utility Block', status: 'Maintenance Due' },
  { id: '5', name: 'Process DG Set', assetId: 'DG-05', manufacturer: 'MTU', model: '12V2000G65', serialNo: 'MTU2013022', engineModel: '12V2000G65', alternatorModel: 'LSA 46.2', controllerType: 'MTU MDEC', ratedKVA: '320', ratedKW: '256', voltage: '415', frequency: '50', rpm: '1500', cylinders: '12', fuelTankL: '700', oilCapL: '28', coolantL: '60', batteryV: '24', installDate: '2013-05-18', lastServiceDate: '2024-12-01', nextServiceDate: '2025-06-01', warranty: 'Expired', location: 'Process Plant — East Wing', status: 'Breakdown' },
];

const STATUS_C: Record<string, { bg: string; color: string }> = {
  Running:          { bg: '#05966920', color: '#059669' },
  Standby:          { bg: '#2563EB20', color: '#2563EB' },
  Available:        { bg: '#7C3AED20', color: '#7C3AED' },
  'Maintenance Due':{ bg: '#D9770620', color: '#D97706' },
  Breakdown:        { bg: '#DC262620', color: '#DC2626' },
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: V.surf, padding: '8px 12px', borderRadius: 8, border: `1px solid ${V.brdM}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: V.txt }}>{value || '—'}</div>
    </div>
  );
}

function InputF({ label, field, dg, setDg, options }: { label: string; field: keyof DGAsset; dg: DGAsset; setDg: (d: DGAsset) => void; options?: string[] }) {
  const common: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: V.bg, border: `1.5px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.txt, outline: 'none' };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: V.lbl, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      {options ? (
        <select style={common} value={dg[field] as string} onChange={(e) => setDg({ ...dg, [field]: e.target.value })}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input style={common} value={dg[field] as string} onChange={(e) => setDg({ ...dg, [field]: e.target.value })} />
      )}
    </div>
  );
}

export function DGInfo() {
  const [assets, setAssets] = useState<DGAsset[]>(INITIAL);

  const handleDownload = () => {
    const rows = assets.map(a => [a.assetId, a.name, a.manufacturer, a.model, `${a.ratedKVA} kVA / ${a.ratedKW} kW`, `${a.voltage}V / ${a.frequency}Hz`, a.status, a.lastServiceDate, a.nextServiceDate, a.location]);
    const body = `
      <h2>DG Asset Registry — ${assets.length} Units</h2>
      ${tableHTML(['Asset ID','Name','Manufacturer','Model','Rating','Voltage/Freq','Status','Last Service','Next Service','Location'], rows)}`;
    downloadReport('DG Asset Registry Report', `Fleet of ${assets.length} Diesel Generator Sets`, 'ISO 8528 · IEC 60034 · NFPA 110 · IS 1460', body, 'DG-Asset-Registry.pdf');
  };
  const [selId, setSelId] = useState<string | null>('1');
  const [editing, setEditing] = useState<DGAsset | null>(null);
  const [isNew, setIsNew] = useState(false);

  const selected = assets.find(a => a.id === selId) ?? null;

  const save = () => {
    if (!editing) return;
    if (isNew) setAssets(p => [...p, editing]);
    else setAssets(p => p.map(a => a.id === editing.id ? editing : a));
    setSelId(editing.id);
    setEditing(null);
    setIsNew(false);
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ModHeader icon={Server} title="DG ASSET REGISTRY" subtitle="ISO 8528 · OEM Asset Information · Maintenance Records · Fleet Database" accentColor={ACCENT} />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#1E293B', color: '#94A3B8', border: `1px solid ${V.brd}`, borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>
            <Download style={{ width: 12, height: 12 }} /> Export
          </button>
          <span style={{ fontSize: 12, color: V.muted }}>{assets.length} assets registered</span>
            <button onClick={() => { const id = String(Date.now()); setEditing({ ...EMPTY, id }); setIsNew(true); setSelId(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 13, height: 13 }} /> Add DG
            </button>
          </div>
          {assets.map((a) => {
            const ss = STATUS_C[a.status] ?? STATUS_C['Available'];
            return (
              <button key={a.id} onClick={() => { setSelId(a.id); setEditing(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', marginBottom: 6, textAlign: 'left', background: selId === a.id ? ACCENT + '18' : V.bg, border: `1.5px solid ${selId === a.id ? ACCENT : V.brd}`, borderRadius: 10, cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: V.txt, marginBottom: 2 }}>{a.assetId} — {a.name}</div>
                  <div style={{ fontSize: 11, color: V.muted }}>{a.manufacturer} · {a.ratedKVA} kVA</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ss.color, background: ss.bg, padding: '2px 7px', borderRadius: 6, marginTop: 5, display: 'inline-block' }}>{a.status}</span>
                </div>
                <ChevronRight style={{ width: 13, height: 13, color: V.muted }} />
              </button>
            );
          })}
        </div>

        {/* Detail / Edit */}
        {editing ? (
          <div style={{ background: V.bg, border: `2px solid ${ACCENT}40`, borderRadius: 14, padding: '20px 22px', borderTop: `4px solid ${ACCENT}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: V.txt }}>{isNew ? 'Register New DG Set' : `Edit — ${editing.assetId}`}</div>
              <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: V.muted }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
              <InputF label="Asset ID"          field="assetId"       dg={editing} setDg={setEditing} />
              <InputF label="DG Name"            field="name"          dg={editing} setDg={setEditing} />
              <InputF label="Manufacturer"       field="manufacturer"  dg={editing} setDg={setEditing} options={['Cummins','Caterpillar','Perkins','MTU','Kirloskar','Volvo Penta','FG Wilson','Mitsubishi','Kohler','Doosan','Other']} />
              <InputF label="Model"              field="model"         dg={editing} setDg={setEditing} />
              <InputF label="Serial Number"      field="serialNo"      dg={editing} setDg={setEditing} />
              <InputF label="Engine Model"       field="engineModel"   dg={editing} setDg={setEditing} />
              <InputF label="Alternator Model"   field="alternatorModel" dg={editing} setDg={setEditing} />
              <InputF label="Controller Type"    field="controllerType" dg={editing} setDg={setEditing} />
              <InputF label="Status"             field="status"        dg={editing} setDg={setEditing} options={Object.keys(STATUS_C)} />
              <InputF label="Rated kVA"          field="ratedKVA"      dg={editing} setDg={setEditing} />
              <InputF label="Rated kW"           field="ratedKW"       dg={editing} setDg={setEditing} />
              <InputF label="Voltage (V)"        field="voltage"       dg={editing} setDg={setEditing} options={['415','400','380','11000','6600']} />
              <InputF label="Frequency (Hz)"     field="frequency"     dg={editing} setDg={setEditing} options={['50','60']} />
              <InputF label="RPM"                field="rpm"           dg={editing} setDg={setEditing} options={['1500','1800','1000']} />
              <InputF label="No. of Cylinders"   field="cylinders"     dg={editing} setDg={setEditing} options={['4','6','8','12','16']} />
              <InputF label="Fuel Tank (L)"      field="fuelTankL"     dg={editing} setDg={setEditing} />
              <InputF label="Oil Capacity (L)"   field="oilCapL"       dg={editing} setDg={setEditing} />
              <InputF label="Coolant Cap. (L)"   field="coolantL"      dg={editing} setDg={setEditing} />
              <InputF label="Battery Voltage"    field="batteryV"      dg={editing} setDg={setEditing} options={['12','24','48']} />
              <InputF label="Install Date"       field="installDate"   dg={editing} setDg={setEditing} />
              <InputF label="Last Service Date"  field="lastServiceDate" dg={editing} setDg={setEditing} />
              <InputF label="Next Service Date"  field="nextServiceDate" dg={editing} setDg={setEditing} />
              <InputF label="Warranty"           field="warranty"      dg={editing} setDg={setEditing} />
              <InputF label="Location"           field="location"      dg={editing} setDg={setEditing} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: '9px 18px', background: V.surf, border: `1px solid ${V.brd}`, borderRadius: 8, fontSize: 13, color: V.sec, cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding: '9px 22px', background: ACCENT, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save Asset</button>
            </div>
          </div>
        ) : selected ? (
          <div style={{ background: V.bg, border: `2px solid ${V.brd}`, borderRadius: 14, overflow: 'hidden', borderTop: `4px solid ${ACCENT}` }}>
            <div style={{ background: V.surf, padding: '14px 20px', borderBottom: `1px solid ${V.brdM}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: V.txt }}>{selected.assetId} — {selected.name}</div>
                <div style={{ fontSize: 12, color: V.muted }}>{selected.location}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: (STATUS_C[selected.status] ?? STATUS_C['Available']).bg, color: (STATUS_C[selected.status] ?? STATUS_C['Available']).color }}>{selected.status}</span>
                <button onClick={() => setEditing({ ...selected })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: ACCENT, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  <Edit2 style={{ width: 13, height: 13 }} /> Edit
                </button>
              </div>
            </div>
            <div style={{ padding: '18px 20px' }}>
              {[
                { title: 'Nameplate Data', fields: [['Manufacturer', selected.manufacturer], ['Model', selected.model], ['Serial No.', selected.serialNo], ['Engine Model', selected.engineModel], ['Alternator Model', selected.alternatorModel], ['Controller', selected.controllerType]] },
                { title: 'Electrical Ratings', fields: [['Rated kVA', `${selected.ratedKVA} kVA`], ['Rated kW', `${selected.ratedKW} kW`], ['Voltage', `${selected.voltage} V`], ['Frequency', `${selected.frequency} Hz`], ['RPM', selected.rpm], ['No. of Cylinders', selected.cylinders]] },
                { title: 'Capacities', fields: [['Fuel Tank', `${selected.fuelTankL} L`], ['Lube Oil', `${selected.oilCapL} L`], ['Coolant', `${selected.coolantL} L`], ['Battery Voltage', `${selected.batteryV} V`]] },
                { title: 'Maintenance Records', fields: [['Installation Date', selected.installDate], ['Last Service', selected.lastServiceDate], ['Next Service', selected.nextServiceDate], ['Warranty', selected.warranty]] },
              ].map(({ title, fields }) => (
                <div key={title} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {fields.map(([l, v]) => <Field key={l} label={l} value={v} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
