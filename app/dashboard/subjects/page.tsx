'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  ClassItem,
  SubjectItem,
  TeacherItem,
  SubjectTeacherItem,
  ClassScheduleItem,
} from '@/lib/types';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function SubjectsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);

  // Permissions
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // Form states
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [subjectName, setSubjectName] = useState('');
  const [subjectArabic, setSubjectArabic] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<number>(0);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const clsList = DataStore.getClasses();
    setClasses(clsList);
    setSubjects(DataStore.getSubjects());
    setTeachers(DataStore.getTeachers());
    setSubjectTeachers(DataStore.getSubjectTeachers());
    setSchedules(DataStore.getSchedules());

    if (clsList.length > 0 && selectedClassId === 0) {
      setSelectedClassId(clsList[0].ClassID);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can add or edit subjects.', type: 'error' });
      return;
    }
    if (!subjectName.trim() || !selectedClassId) {
      setMsg({ text: 'Subject name and class are required.', type: 'error' });
      return;
    }

    if (editingId) {
      DataStore.saveSubject({
        SubjectID: editingId,
        ClassID: selectedClassId,
        SubjectClass: subjectName.trim(),
        SubjectArabic: subjectArabic.trim() || undefined,
        SubjectCode: subjectCode.trim() || undefined,
      });
      setMsg({ text: 'Subject updated successfully!', type: 'success' });
      setEditingId(null);
    } else {
      DataStore.saveSubject({
        ClassID: selectedClassId,
        SubjectClass: subjectName.trim(),
        SubjectArabic: subjectArabic.trim() || undefined,
        SubjectCode: subjectCode.trim() || undefined,
      });
      setMsg({ text: 'New subject added successfully!', type: 'success' });
    }

    setSubjectName('');
    setSubjectArabic('');
    setSubjectCode('');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (s: SubjectItem) => {
    if (!canManage) return;
    setEditingId(s.SubjectID);
    setSelectedClassId(s.ClassID);
    setSubjectName(s.SubjectClass);
    setSubjectArabic(s.SubjectArabic || '');
    setSubjectCode(s.SubjectCode || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can delete subjects.', type: 'error' });
      return;
    }
    if (confirm('Are you sure you want to delete this subject? All related schedules and grades will also be affected.')) {
      DataStore.deleteSubject(id);
      setMsg({ text: 'Subject deleted successfully.', type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const getClassName = (cid: number) => {
    return classes.find((c) => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.SubjectClass.toLowerCase().includes(search.toLowerCase()) ||
      (s.SubjectArabic || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.SubjectCode || '').toLowerCase().includes(search.toLowerCase()) ||
      getClassName(s.ClassID).toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 0 || s.ClassID === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              Curriculum & Subjects
            </h1>
            {canManage ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Permissions Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Read-Only View
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Manage course curriculum, Arabic subject titles, and review assigned faculty and timetable slots.
          </p>
        </div>

        <Link
          href="/dashboard/teachers/assignments"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <UserCheck className="w-4 h-4" />
          <span>Assign Teachers & Schedules</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Form (Add/Edit) */}
        {canManage && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                {editingId ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              {editingId && (
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  Editing #{editingId}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Class & Section
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.ClassID} value={c.ClassID}>
                      {c.ClassName} ({c.Department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Fiqh, Hadith, Mathematics"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject Name (Arabic - اسم المادة)
                </label>
                <input
                  type="text"
                  value={subjectArabic}
                  onChange={(e) => setSubjectArabic(e.target.value)}
                  placeholder="e.g. الفقه الإسلامي"
                  dir="rtl"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="e.g. FQH-101, TAW-201"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingId ? 'Update Subject' : 'Add Subject'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setSubjectName('');
                      setSubjectArabic('');
                      setSubjectCode('');
                    }}
                    className="py-2.5 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Subjects Directory Table */}
        <div className={`${canManage ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Curriculum Subjects ({subjects.length})
              </h2>
              <p className="text-xs text-slate-500">
                Subjects with assigned faculty teachers and scheduled dates/times
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-36 sm:w-44 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(Number(e.target.value))}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value={0}>All Classes</option>
                {classes.map((c) => (
                  <option key={c.ClassID} value={c.ClassID}>
                    {c.ClassName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Assigned Teacher</th>
                  <th className="py-3 px-4">Schedule Date & Time</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No curriculum subjects found.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((s) => {
                    // Find assigned teacher
                    const alloc = subjectTeachers.find(
                      (st) => st.SubjectID === s.SubjectID && st.ClassID === s.ClassID
                    );
                    const teacher = alloc
                      ? teachers.find((t) => t.TeacherID === alloc.TeacherID)
                      : null;

                    // Find scheduled slots
                    const subjectSchedules = schedules.filter(
                      (sch) => sch.SubjectID === s.SubjectID && sch.ClassID === s.ClassID
                    );

                    return (
                      <tr key={s.SubjectID} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-900">{s.SubjectClass}</span>
                            {s.SubjectCode && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                {s.SubjectCode}
                              </span>
                            )}
                          </div>
                          {s.SubjectArabic && (
                            <span className="text-xs text-amber-700 font-serif block mt-0.5" dir="rtl">
                              {s.SubjectArabic}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                            {getClassName(s.ClassID)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {teacher ? (
                            <div>
                              <p className="font-bold text-xs text-slate-800">{teacher.Name}</p>
                              {teacher.NameArabic && (
                                <p className="text-[11px] text-slate-500 font-serif" dir="rtl">
                                  {teacher.NameArabic}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {subjectSchedules.length > 0 ? (
                            <div className="space-y-1">
                              {subjectSchedules.map((slot) => (
                                <div
                                  key={slot.ID}
                                  className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono"
                                >
                                  <Calendar className="w-3 h-3 text-emerald-600" />
                                  <span className="font-bold">{slot.Day}</span>
                                  <span className="text-slate-500">
                                    {slot.StartTime}-{slot.EndTime}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No schedule</span>
                          )}
                        </td>

                        {canManage && (
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              title="Edit Subject"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.SubjectID)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
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
