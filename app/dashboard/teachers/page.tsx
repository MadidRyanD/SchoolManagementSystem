'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  TeacherItem,
  SubjectTeacherItem,
  ClassScheduleItem,
  SubjectItem,
  ClassItem,
} from '@/lib/types';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Crown,
  Search,
  BookOpen,
  Calendar,
  Clock,
  UserCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacherItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);

  // Permissions
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // Search & filter
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'mudir' | 'faculty'>('all');

  // Form states
  const [formData, setFormData] = useState({
    Name: '',
    NameArabic: '',
    Gender: 'Male',
    Tribe: 'Maranao',
    Nationality: 'Filipino',
    DOB: '',
    MobileNumber: '',
    Address: '',
    Email: '',
    Password: 'teacher123',
    Degree: 'Bachelor of Islamic Studies',
    IsMudir: false,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTeachers(DataStore.getTeachers());
    setSubjects(DataStore.getSubjects());
    setClasses(DataStore.getClasses());
    setAssignments(DataStore.getSubjectTeachers());
    setSchedules(DataStore.getSchedules());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can add or edit teachers.', type: 'error' });
      return;
    }
    if (!formData.Name.trim()) {
      setMsg({ text: 'Teacher name is required.', type: 'error' });
      return;
    }

    if (editingId) {
      DataStore.saveTeacher({
        ...formData,
        TeacherID: editingId,
      });
      setMsg({ text: 'Teacher profile updated successfully!', type: 'success' });
      setEditingId(null);
    } else {
      DataStore.saveTeacher({
        ...formData,
      });
      setMsg({ text: 'New faculty member registered successfully!', type: 'success' });
    }

    setFormData({
      Name: '',
      NameArabic: '',
      Gender: 'Male',
      Tribe: 'Maranao',
      Nationality: 'Filipino',
      DOB: '',
      MobileNumber: '',
      Address: '',
      Email: '',
      Password: 'teacher123',
      Degree: 'Bachelor of Islamic Studies',
      IsMudir: false,
    });
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (t: TeacherItem) => {
    if (!canManage) return;
    setEditingId(t.TeacherID);
    setFormData({
      Name: t.Name,
      NameArabic: t.NameArabic || '',
      Gender: t.Gender || 'Male',
      Tribe: t.Tribe || 'Maranao',
      Nationality: t.Nationality || 'Filipino',
      DOB: t.DOB || t.BirthDate || '',
      MobileNumber: t.MobileNumber || '',
      Address: t.Address || '',
      Email: t.Email || '',
      Password: t.Password || 'teacher123',
      Degree: t.Degree || 'Bachelor of Islamic Studies',
      IsMudir: !!t.IsMudir,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can delete teachers.', type: 'error' });
      return;
    }
    const target = teachers.find((t) => t.TeacherID === id);
    if (target?.IsMudir && !isAdmin) {
      setMsg({ text: 'Only System Admin can delete a Mudir/Principal account.', type: 'error' });
      return;
    }

    if (confirm(`Are you sure you want to delete teacher ${target?.Name}? All their assignments will be removed.`)) {
      DataStore.deleteTeacher(id);
      setMsg({ text: 'Teacher account deleted successfully.', type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.Name.toLowerCase().includes(search.toLowerCase()) ||
      (t.NameArabic || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.Degree || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.Tribe || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'mudir' && t.IsMudir) ||
      (filterRole === 'faculty' && !t.IsMudir);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              Faculty & Teachers Directory
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
            Manage academic faculty, view assigned subjects & teaching timetables, and maintain credentials.
          </p>
        </div>

        <Link
          href="/dashboard/teachers/assignments"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <UserCheck className="w-4 h-4" />
          <span>Allocate Subjects & Schedules</span>
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
        {/* Form: Add/Edit Teacher */}
        {canManage && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                {editingId ? 'Edit Faculty Details' : 'Register New Faculty'}
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
                  placeholder="e.g. Ustadh Ahmad Al-Farouqi"
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
                  placeholder="e.g. أستاذ أحمد الفاروقي"
                  dir="rtl"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
                />
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
                    Tribe / Ethnicity
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
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.Nationality}
                    onChange={(e) => setFormData({ ...formData, Nationality: e.target.value })}
                    placeholder="e.g. Filipino, Egyptian"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Degree / Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.Degree}
                    onChange={(e) => setFormData({ ...formData, Degree: e.target.value })}
                    placeholder="e.g. MA Islamic Studies"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email / Login
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    placeholder="teacher@jmaa.edu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Login Password
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Password}
                    onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
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
                  Residential Address
                </label>
                <input
                  type="text"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="e.g. Marawi City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              {/* Mudir Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <input
                    type="checkbox"
                    checked={formData.IsMudir}
                    onChange={(e) => setFormData({ ...formData, IsMudir: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                  />
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Designate as Mudir / Principal / Dean (المدير)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingId ? 'Update Faculty Details' : 'Register Faculty'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        Name: '',
                        NameArabic: '',
                        Gender: 'Male',
                        Tribe: 'Maranao',
                        Nationality: 'Filipino',
                        DOB: '',
                        MobileNumber: '',
                        Address: '',
                        Email: '',
                        Password: 'teacher123',
                        Degree: 'Bachelor of Islamic Studies',
                        IsMudir: false,
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

        {/* Teachers List & Schedule Overview */}
        <div className={`${canManage ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teachers by name, Arabic, degree, tribe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  filterRole === 'all'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({teachers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('mudir')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  filterRole === 'mudir'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mudir / Dean
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('faculty')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  filterRole === 'faculty'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Faculty
              </button>
            </div>
          </div>

          {/* Teacher Cards */}
          <div className="space-y-3">
            {filteredTeachers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                No faculty members match your search criteria.
              </div>
            ) : (
              filteredTeachers.map((t) => {
                // Find teacher's assigned subjects & schedules
                const teacherAllocs = assignments.filter((a) => a.TeacherID === t.TeacherID);
                const teacherSchs = schedules.filter((s) => s.TeacherID === t.TeacherID);

                return (
                  <div
                    key={t.TeacherID}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow shrink-0 ${
                            t.IsMudir
                              ? 'bg-gradient-to-tr from-amber-500 to-amber-700'
                              : 'bg-gradient-to-tr from-emerald-600 to-teal-700'
                          }`}
                        >
                          {t.IsMudir ? <Crown className="w-6 h-6" /> : t.Name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-base">{t.Name}</h3>
                            {t.IsMudir ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                <Crown className="w-3 h-3" /> Mudir / Principal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
                                Faculty Teacher
                              </span>
                            )}
                          </div>

                          {t.NameArabic && (
                            <p className="text-xs text-amber-700 font-serif" dir="rtl">
                              {t.NameArabic}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                            {t.Degree && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                {t.Degree}
                              </span>
                            )}
                            {t.Email && (
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {t.Email}
                              </span>
                            )}
                            {t.MobileNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {t.MobileNumber}
                              </span>
                            )}
                            {t.Tribe && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                                {t.Tribe} ({t.Nationality || 'Filipino'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {canManage && (
                        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                          <Link
                            href={`/dashboard/teachers/assignments?teacherId=${t.TeacherID}`}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1"
                            title="Manage Subjects"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEdit(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.TeacherID)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ASSIGNED SUBJECTS & SCHEDULE TIME SLOTS */}
                    <div className="pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          Assigned Subjects & Timetable Schedule ({teacherAllocs.length})
                        </span>
                      </div>

                      {teacherAllocs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No subjects currently assigned to this faculty member.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {teacherAllocs.map((alloc) => {
                            const sub = subjects.find((s) => s.SubjectID === alloc.SubjectID);
                            const cls = classes.find((c) => c.ClassID === alloc.ClassID);
                            const slot = teacherSchs.find(
                              (s) => s.SubjectID === alloc.SubjectID && s.ClassID === alloc.ClassID
                            );

                            return (
                              <div
                                key={alloc.ID}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-2"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">
                                    {sub?.SubjectClass || `Subject #${alloc.SubjectID}`}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    {cls?.ClassName || `Class #${alloc.ClassID}`}
                                  </span>
                                </div>

                                {slot ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                                    <Clock className="w-3 h-3 text-emerald-700" />
                                    {slot.Day.substring(0, 3)} {slot.StartTime}-{slot.EndTime}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    No time set
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
