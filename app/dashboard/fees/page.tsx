'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { ClassItem, FeesItem } from '@/lib/types';
import { DollarSign, CheckCircle, Trash2, Edit } from 'lucide-react';

export default function ClassFeesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fees, setFees] = useState<FeesItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const clsList = DataStore.getClasses();
    setClasses(clsList);
    setFees(DataStore.getFees());
    if (clsList.length > 0 && selectedClassId === 0) {
      setSelectedClassId(clsList[0].ClassID);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(feeAmount);
    if (isNaN(amount) || amount < 0 || !selectedClassId) return;

    if (editingId) {
      DataStore.saveFees({ FeesID: editingId, ClassID: selectedClassId, FeesAmount: amount });
      setMsg('Fee record updated successfully!');
      setEditingId(null);
    } else {
      DataStore.saveFees({ ClassID: selectedClassId, FeesAmount: amount });
      setMsg('New fee structure added successfully!');
    }

    setFeeAmount('');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (f: FeesItem) => {
    setEditingId(f.FeesID);
    setSelectedClassId(f.ClassID);
    setFeeAmount(f.FeesAmount.toString());
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this fee record?')) {
      DataStore.deleteFees(id);
      loadData();
    }
  };

  const getClassName = (cid: number) => {
    return classes.find(c => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          Class Fees Structure
        </h1>
        <p className="text-sm text-slate-500">Define and update tuition and admission fees per class</p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">
            {editingId ? 'Edit Class Fee' : 'Set Class Fee'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {classes.map((c) => (
                  <option key={c.ClassID} value={c.ClassID}>
                    {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Fee Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
              >
                {editingId ? 'Update Fee' : 'Save Fee'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFeeAmount('');
                  }}
                  className="py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-800">Defined Fees Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fee ID</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Annual Fee Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400">
                      No fees configured yet.
                    </td>
                  </tr>
                ) : (
                  fees.map((f) => (
                    <tr key={f.FeesID} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">#{f.FeesID}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{getClassName(f.ClassID)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">${f.FeesAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.FeesID)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
