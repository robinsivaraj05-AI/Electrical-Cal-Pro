import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, Edit, CheckCircle2, Calendar, User, Building } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ProjectManager() {
  const { projects, createProject, deleteProject, setActiveProject, activeProjectId, updateProject } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', client: '', engineer: '', projectNo: '', revision: 'A',
    companyName: '', date: new Date().toISOString().split('T')[0],
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createProject(form);
    setForm({ name: '', client: '', engineer: '', projectNo: '', revision: 'A', companyName: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
            <FolderOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Project Manager</h2>
            <p className="text-xs text-slate-400">Manage engineering projects and calculation sets</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* New Project Form */}
      {showForm && (
        <div className="rounded-xl bg-slate-800/50 border border-blue-500/30 p-5 animate-fadeIn">
          <h3 className="text-sm font-semibold text-white mb-4">Create New Project</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Project Name *', placeholder: 'e.g. Industrial Plant 33kV Substation' },
              { key: 'client', label: 'Client Name', placeholder: 'e.g. ABC Industries Ltd.' },
              { key: 'engineer', label: 'Engineer Name', placeholder: 'e.g. John Smith, CEng' },
              { key: 'projectNo', label: 'Project / Doc No.', placeholder: 'e.g. EPC-2024-001' },
              { key: 'companyName', label: 'Company Name', placeholder: 'e.g. XYZ Engineering Consultants' },
              { key: 'revision', label: 'Revision', placeholder: 'A' },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-medium text-slate-300">{f.label}</label>
                <input
                  type="text"
                  value={(form as Record<string, string>)[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">Create Project</button>
          </div>
        </div>
      )}

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No projects yet. Create your first project to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-900/20 border-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/30'
                }`}
                onClick={() => setActiveProject(project.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1 truncate">{project.name}</h3>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3 h-3" />
                    <span className="truncate">{project.client || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>{project.engineer || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 rounded font-mono">Doc: {project.projectNo || '—'}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">Rev {project.revision}</span>
                  </div>
                  <span className="text-xs text-slate-500">{project.calculations.length} calcs</span>
                </div>

                {isActive && (
                  <div className="mt-2 text-xs text-emerald-400 font-medium">● Active Project</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
