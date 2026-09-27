'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { ExamItem, ClassItem, SubjectItem, StudentItem } from '@/lib/types';
import { ClipboardList, Plus, Trash2, Edit, CheckCircle, Award } from 'lucide-react';

export default function ExaminationsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedRollNo, setSelectedRollNo] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<string>('');
  const [outofMarks, setOutofMarks] = useState<string>('100');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    const sub = DataStore.getSubjects();
    const std = DataStore.getStudents();
    setClasses(cls);
    setSubjects(sub);
    setStudents(std);
    setExams(DataStore.getExams());

    if (cls.length > 0 && selectedClassId === 0) {
      setSelectedClassId(cls[0].ClassID);
      const matchedSubs = sub.filter(s => s.ClassID === cls[0].ClassID);
      if (matchedSubs.length > 0) setSelectedSubjectId(matchedSubs[0].SubjectID);
      const matchedStd = std.filter(s => s.ClassID === cls[0].ClassID);
      if (matchedStd.length > 0) setSelectedRollNo(matchedStd[0].RollNo);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scored = parseFloat(totalMarks);
    const max = parseFloat(outofMarks);

    if (isNaN(scored) || isNaN(max) || !selectedRollNo || !selectedClassId || !selectedSubjectId) return;

    if (editingId) {
      DataStore.saveExam({
        ExamID: editingId,
        ClassID: selectedClassId,
        SubjectID: selectedSubjectId,
        RollNo: selectedRollNo,
        TotalMarks: scored,
        OutofMarks: max,
      });
      setMsg('Exam marks updated successfully!');
      setEditingId(null);
    } else {
      DataStore.saveExam({
        ClassID: selectedClassId,
        SubjectID: selectedSubjectId,
        RollNo: selectedRollNo,
        TotalMarks: scored,
        OutofMarks: max,
      });
      setMsg('Examination score saved successfully!');
    }

    setTotalMarks('');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (exam: ExamItem) => {
    setEditingId(exam.ExamID);
    setSelectedClassId(exam.ClassID);
    setSelectedSubjectId(exam.SubjectID);
    setSelectedRollNo(exam.RollNo);
    setTotalMarks(exam.TotalMarks.toString());
    setOutofMarks(exam.OutofMarks.toString());
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this examination score?')) {
      DataStore.deleteExam(id);
      loadData();
    }
  };

  const getClassName = (cid: number) => classes.find(c => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  const getSubjectName = (sid: number) => subjects.find(s => s.SubjectID === sid)?.SubjectClass || `Subject #${sid}`;
  const getStudentName = (roll: string) => students.find(s => s.RollNo === roll)?.Name || roll;

  const getGrade = (scored: number, max: number) => {
    const pct = (scored / max) * 100;
    if (pct >= 90) return { letter: 'A+', color: 'text-emerald-700 bg-emerald-100' };
    if (pct >= 80) return { letter: 'A', color: 'text-emerald-600 bg-emerald-50' };
    if (pct >= 70) return { letter: 'B', color: 'text-blue-600 bg-blue-50' };
    if (pct >= 60) return { letter: 'C', color: 'text-amber-600 bg-amber-50' };
    if (pct >= 50) return { letter: 'D', color: 'text-orange-600 bg-orange-50' };
    return { letter: 'F', color: 'text-rose-700 bg-rose-100' };
  };

  const availableSubjects = subjects.filter(s => s.ClassID === selectedClassId);
  const availableStudents = students.filter(s => s.ClassID === selectedClassId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-emerald-600" />
          Examinations & Marks
        </h1>
        <p className="text-sm text-slate-500">Record academic examination scores and inspect calculated student grade standings</p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">
            {editingId ? 'Edit Exam Score' : 'Add Exam Score'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const cid = Number(e.target.value);
                  setSelectedClassId(cid);
                  const subs = subjects.filter(s => s.ClassID === cid);
                  if (subs.length > 0) setSelectedSubjectId(subs[0].SubjectID);
                  const stds = students.filter(s => s.ClassID === cid);
                  if (stds.length > 0) setSelectedRollNo(stds[0].RollNo);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {classes.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Subject</label>
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

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Student</label>
              <select
                value={selectedRollNo}
                onChange={(e) => setSelectedRollNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {availableStudents.map(s => (
                  <option key={s.RollNo} value={s.RollNo}>{s.RollNo} - {s.Name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Scored Marks</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Out Of Marks</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={outofMarks}
                  onChange={(e) => setOutofMarks(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
              >
                {editingId ? 'Update Score' : 'Save Score'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTotalMarks('');
                  }}
                  className="py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Exam Results Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-800">Recorded Exam Results ({exams.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      No examination marks logged yet.
                    </td>
                  </tr>
                ) : (
                  exams.map((e) => {
                    const grade = getGrade(e.TotalMarks, e.OutofMarks);
                    const pct = Math.round((e.TotalMarks / e.OutofMarks) * 100);
                    return (
                      <tr key={e.ExamID} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{getStudentName(e.RollNo)}</div>
                          <div className="text-xs font-mono text-slate-400">{e.RollNo}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{getSubjectName(e.SubjectID)}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{getClassName(e.ClassID)}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-800">
                          {e.TotalMarks} / {e.OutofMarks} ({pct}%)
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${grade.color}`}>
                            {grade.letter}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(e)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e.ExamID)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
