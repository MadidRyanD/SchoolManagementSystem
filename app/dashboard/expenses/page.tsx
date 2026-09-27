'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { ExpenseItem, ClassItem, SubjectItem } from '@/lib/types';
import { Receipt, Plus, Trash2, Edit, CheckCircle, DollarSign, Calendar } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    const sub = DataStore.getSubjects();
    setClasses(cls);
    setSubjects(sub);
    setExpenses(DataStore.getExpenses());

    if (cls.length > 0 && selectedClassId === 0) {
      setSelectedClassId(cls[0].ClassID);
      const matchedSubs = sub.filter(s => s.ClassID === cls[0].ClassID);
      if (matchedSubs.length > 0) setSelectedSubjectId(matchedSubs[0].SubjectID);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt <= 0 || !selectedClassId || !selectedSubjectId) return;

    if (editingId) {
      DataStore.saveExpense({
        ExpenseID: editingId,
        ClassID: selectedClassId,
        SubjectID: selectedSubjectId,
        ChargeAmount: amt,
        Date: date,
        Remarks: remarks,
      });
      setMsg('Expense record updated successfully!');
      setEditingId(null);
    } else {
      DataStore.saveExpense({
        ClassID: selectedClassId,
        SubjectID: selectedSubjectId,
        ChargeAmount: amt,
        Date: date,
        Remarks: remarks,
      });
      setMsg('New expense recorded successfully!');
    }

    setChargeAmount('');
    setRemarks('');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (exp: ExpenseItem) => {
    setEditingId(exp.ExpenseID);
    setSelectedClassId(exp.ClassID);
    setSelectedSubjectId(exp.SubjectID);
    setChargeAmount(exp.ChargeAmount.toString());
    setDate(exp.Date || new Date().toISOString().split('T')[0]);
    setRemarks(exp.Remarks || '');
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this expense entry?')) {
      DataStore.deleteExpense(id);
      loadData();
    }
  };

  const getClassName = (cid: number) => classes.find(c => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  const getSubjectName = (sid: number) => subjects.find(s => s.SubjectID === sid)?.SubjectClass || `Subject #${sid}`;

  const totalSpent = expenses.reduce((acc, curr) => acc + (Number(curr.ChargeAmount) || 0), 0);
  const availableSubjects = subjects.filter(s => s.ClassID === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            School Expenses Management
          </h1>
          <p className="text-sm text-slate-500">Record equipment, lab supplies, and operational department charges</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Recorded</div>
            <div className="text-lg font-extrabold text-slate-900">${totalSpent.toLocaleString()}</div>
          </div>
        </div>
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
            {editingId ? 'Edit Expense Record' : 'Record Expense'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Class / Department</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const cid = Number(e.target.value);
                  setSelectedClassId(cid);
                  const subs = subjects.filter(s => s.ClassID === cid);
                  if (subs.length > 0) setSelectedSubjectId(subs[0].SubjectID);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {classes.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Subject / Area</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {availableSubjects.map(s => (
                  <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectClass}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Remarks / Details</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Science lab equipment"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
              >
                {editingId ? 'Update Expense' : 'Save Expense'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setChargeAmount('');
                    setRemarks('');
                  }}
                  className="py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-800">Expense Logs ({expenses.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Class & Subject</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No expense records logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.ExpenseID} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{exp.Date || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{getClassName(exp.ClassID)}</div>
                        <div className="text-xs text-slate-400">{getSubjectName(exp.SubjectID)}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{exp.Remarks || '-'}</td>
                      <td className="py-3 px-4 font-bold text-rose-600 text-right">
                        ${exp.ChargeAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.ExpenseID)}
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
