'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { FormTemplateItem } from '@/lib/types';
import { FileText, Plus, Trash2, CheckCircle, Eye } from 'lucide-react';

export default function FormTemplatesPage() {
  const [forms, setForms] = useState<FormTemplateItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<{ label: string; type: string; required: boolean }[]>([
    { label: 'Full Legal Name', type: 'text', required: true },
    { label: 'Date of Birth', type: 'date', required: true },
  ]);

  const [previewForm, setPreviewForm] = useState<FormTemplateItem | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setForms(DataStore.getForms());
  };

  const addFieldRow = () => {
    setFields([...fields, { label: 'New Field', type: 'text', required: false }]);
  };

  const removeFieldRow = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    DataStore.saveForm({
      title: title.trim(),
      description: description.trim(),
      fields,
    });

    setTitle('');
    setDescription('');
    setFields([
      { label: 'Full Legal Name', type: 'text', required: true },
      { label: 'Date of Birth', type: 'date', required: true },
    ]);
    setMsg('New institutional form template created!');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this form template?')) {
      DataStore.deleteForm(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-800" />
            <span>Form Templates Builder</span>
          </h1>
          <p className="text-sm text-slate-500">
            Create customized templates for Student Admissions, Official ID Issuance, and Affidavits.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Creator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 mb-3">Create New Form</h2>
          <form onSubmit={handleCreateForm} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Form Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Student Library Registration Form"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Description / Instructions</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Guidelines for applicants..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Form Fields</span>
                <button
                  type="button"
                  onClick={addFieldRow}
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
              </div>

              {fields.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => {
                      const copy = [...fields];
                      copy[idx].label = e.target.value;
                      setFields(copy);
                    }}
                    placeholder="Field Label"
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => {
                      const copy = [...fields];
                      copy[idx].type = e.target.value;
                      setFields(copy);
                    }}
                    className="px-2 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="tel">Phone</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeFieldRow(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Template
            </button>
          </form>
        </div>

        {/* Existing Templates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">
              Standard Institution Forms ({forms.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {forms.map(form => (
                <div key={form.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{form.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{form.description}</p>
                    <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                      <span className="font-bold text-slate-700">Fields:</span> {form.fields.map(f => f.label).join(', ')}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewForm(form)}
                      className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Form
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(form.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Preview Modal */}
      {previewForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-2 text-center">
              <h3 className="text-lg font-extrabold text-slate-900">{previewForm.title}</h3>
              <p className="text-xs text-slate-500">{previewForm.description}</p>
            </div>

            <div className="space-y-3 py-2">
              {previewForm.fields.map((f, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={f.type}
                    disabled
                    placeholder={`Enter ${f.label}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 cursor-not-allowed"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPreviewForm(null)}
              className="w-full py-2.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
