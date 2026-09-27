'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { StudentItem, ClassItem } from '@/lib/types';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  Filter,
  User,
  Calendar,
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Permissions
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<'all' | '5-days' | '2-days'>('all');
  const [filterClass, setFilterClass] = useState<number>(0);

  // Form states
  const [formData, setFormData] = useState({
    Name: '',
    NameArabic: '',
    RollNo: '',
    IdNumber: '',
    ClassID: 1,
    Gender: 'Male',
    Tribe: 'Maranao',
    Nationality: 'Filipino',
    DOB: '',
    MobileNumber: '',
    Email: '',
    Address: '',
    AdmissionDate: new Date().toISOString().split('T')[0],
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    setClasses(cls);
    setStudents(DataStore.getStudents());
    if (cls.length > 0 && formData.ClassID === 1) {
      setFormData((prev) => ({ ...prev, ClassID: cls[0].ClassID }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can enroll or edit students.', type: 'error' });
      return;
    }
    if (!formData.Name.trim() || !formData.RollNo.trim()) {
      setMsg({ text: 'Student name and roll number are required.', type: 'error' });
      return;
    }

    if (editingId) {
      DataStore.saveStudent({
        ...formData,
        StudentID: editingId,
        ClassID: Number(formData.ClassID),
      });
      setMsg({ text: 'Student profile updated successfully!', type: 'success' });
      setEditingId(null);
    } else {
      DataStore.saveStudent({
        ...formData,
        ClassID: Number(formData.ClassID),
      });
      setMsg({ text: 'New student enrolled successfully!', type: 'success' });
    }

    setFormData({
      Name: '',
      NameArabic: '',
      RollNo: '',
      IdNumber: '',
      ClassID: classes[0]?.ClassID || 1,
      Gender: 'Male',
      Tribe: 'Maranao',
      Nationality: 'Filipino',
      DOB: '',
      MobileNumber: '',
      Email: '',
      Address: '',
      AdmissionDate: new Date().toISOString().split('T')[0],
    });
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (s: StudentItem) => {
    if (!canManage) return;
    setEditingId(s.StudentID);
    setFormData({
      Name: s.Name,
      NameArabic: s.NameArabic || '',
      RollNo: s.RollNo,
      IdNumber: s.IdNumber || '',
      ClassID: s.ClassID,
      Gender: s.Gender || 'Male',
      Tribe: s.Tribe || 'Maranao',
      Nationality: s.Nationality || 'Filipino',
      DOB: s.DOB || s.BirthDate || '',
      MobileNumber: s.MobileNumber || '',
      Email: s.Email || '',
      Address: s.Address || '',
      AdmissionDate: s.AdmissionDate || new Date().toISOString().split('T')[0],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can delete students.', type: 'error' });
      return;
    }
    const target = students.find((s) => s.StudentID === id);
    if (confirm(`Delete student record for ${target?.Name} (Roll: ${target?.RollNo})?`)) {
      DataStore.deleteStudent(id);
      setMsg({ text: 'Student record deleted successfully.', type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const getClassName = (cid: number) =>
    classes.find((c) => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  const getClassDept = (cid: number) =>
    classes.find((c) => c.ClassID === cid)?.Department || '5-days';

  const filteredStudents = students.filter((s) => {
    const sClass = classes.find((c) => c.ClassID === s.ClassID);
    const matchesSearch =
      s.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.NameArabic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.RollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.IdNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.Tribe || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClassName(s.ClassID).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      filterDepartment === 'all' || sClass?.Department === filterDepartment;
    const matchesClass = filterClass === 0 || s.ClassID === filterClass;
    return matchesSearch && matchesDept && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
              Student Directory & Enrollment
            </h1>
            {canManage ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Permissions Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                View Only
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Manage student registrations across 5-Days and 2-Days departments, roll numbers, and academic profiles.
          </p>
        </div>
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
        {/* Enrollment / Edit Form */}
        {canManage && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                {editingId ? 'Edit Student Profile' : 'Enroll New Student'}
              </h2>
              {editingId && (
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  Editing #{editingId}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  placeholder="e.g. Tariq Bin Ziyad"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name (Arabic - الاسم بالعربية)
                </label>
                <input
                  type="text"
                  value={formData.NameArabic}
                  onChange={(e) => setFormData({ ...formData, NameArabic: e.target.value })}
                  placeholder="e.g. طارق بن زياد"
                  dir="rtl"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.RollNo}
                    onChange={(e) => setFormData({ ...formData, RollNo: e.target.value })}
                    placeholder="e.g. R101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Student ID No
                  </label>
                  <input
                    type="text"
                    value={formData.IdNumber}
                    onChange={(e) => setFormData({ ...formData, IdNumber: e.target.value })}
                    placeholder="e.g. 2024-JMAA-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Class & Department
                </label>
                <select
                  value={formData.ClassID}
                  onChange={(e) => setFormData({ ...formData, ClassID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.ClassID} value={c.ClassID}>
                      {c.ClassName} ({c.Department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.Gender}
                    onChange={(e) => setFormData({ ...formData, Gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Male">Male (ذكر)</option>
                    <option value="Female">Female (أنثى)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tribe
                  </label>
                  <input
                    type="text"
                    value={formData.Tribe}
                    onChange={(e) => setFormData({ ...formData, Tribe: e.target.value })}
                    placeholder="e.g. Maranao"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.MobileNumber}
                    onChange={(e) => setFormData({ ...formData, MobileNumber: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.DOB}
                    onChange={(e) => setFormData({ ...formData, DOB: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="e.g. Marawi City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingId ? 'Update Student Record' : 'Enroll Student'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        Name: '',
                        NameArabic: '',
                        RollNo: '',
                        IdNumber: '',
                        ClassID: classes[0]?.ClassID || 1,
                        Gender: 'Male',
                        Tribe: 'Maranao',
                        Nationality: 'Filipino',
                        DOB: '',
                        MobileNumber: '',
                        Email: '',
                        Address: '',
                        AdmissionDate: new Date().toISOString().split('T')[0],
                      });
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

        {/* Students Table */}
        <div className={`${canManage ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col`}>
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Enrolled Students ({students.length})
              </h2>
              <p className="text-xs text-slate-500">
                Learner directory across 5-Days and 2-Days departments
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-36 sm:w-44 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Department switcher */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value as any)}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Departments</option>
                <option value="5-days">5-Days Dept</option>
                <option value="2-days">2-Days Dept</option>
              </select>

              {/* Class switcher */}
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
                  <th className="py-3 px-4">Roll / ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Department</th>
                  <th className="py-3 px-4">Tribe & Contact</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                      No enrolled students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.StudentID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s.RollNo}
                        </span>
                        {s.IdNumber && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                            {s.IdNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{s.Name}</p>
                        {s.NameArabic && (
                          <p className="text-xs text-amber-700 font-serif" dir="rtl">
                            {s.NameArabic}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-xs text-slate-800">
                          {getClassName(s.ClassID)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {getClassDept(s.ClassID)} department
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600">
                        {s.Tribe && (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-medium mr-1">
                            {s.Tribe}
                          </span>
                        )}
                        {s.MobileNumber && (
                          <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                            {s.MobileNumber}
                          </span>
                        )}
                      </td>

                      {canManage && (
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.StudentID)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
