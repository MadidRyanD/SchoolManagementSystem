'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  LayoutGrid,
  List,
  Filter,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacherItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);

  // Permissions & Current User
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // View & Filter states
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'mudir' | 'faculty'>('all');
  const [filterTribe, setFilterTribe] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'academic' | 'personal' | 'credentials'>('academic');
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Data
  const initialForm = {
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
  };
  const [formData, setFormData] = useState(initialForm);

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

  // Quick stats
  const stats = useMemo(() => {
    const total = teachers.length;
    const mudirs = teachers.filter((t) => t.IsMudir).length;
    const faculty = teachers.filter((t) => !t.IsMudir).length;
    const totalAssignments = assignments.length;
    return { total, mudirs, faculty, totalAssignments };
  }, [teachers, assignments]);

  // Unique tribes for filter
  const tribesList = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.Tribe) set.add(t.Tribe);
    });
    return Array.from(set);
  }, [teachers]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setActiveTab('academic');
    setIsModalOpen(true);
  };

  const openEditModal = (t: TeacherItem) => {
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
    setActiveTab('academic');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'Permission denied: Only Admin and Mudir can manage faculty.', type: 'error' });
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
      setMsg({ text: `Faculty details for "${formData.Name}" updated successfully!`, type: 'success' });
    } else {
      DataStore.saveTeacher({
        ...formData,
      });
      setMsg({ text: `New faculty member "${formData.Name}" registered successfully!`, type: 'success' });
    }

    closeModal();
    loadData();
    setTimeout(() => setMsg(null), 3500);
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

    if (confirm(`Are you sure you want to delete teacher "${target?.Name}"? All their subject allocations and timetable slots will be removed.`)) {
      DataStore.deleteTeacher(id);
      setMsg({ text: `Teacher "${target?.Name}" deleted successfully.`, type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // Auto-generate suggested email
  const generateEmail = () => {
    if (!formData.Name.trim()) return;
    const clean = formData.Name.toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');
    setFormData((prev) => ({ ...prev, Email: `${clean}@jmaa.edu` }));
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
    const matchesTribe = filterTribe === 'all' || t.Tribe === filterTribe;
    return matchesSearch && matchesRole && matchesTribe;
  });

  return (
    <div className="space-y-6">
      {/* Top Principal Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-3.5 h-3.5" />
              <span>Principal & Academic Governance (إدارة هيئة التدريس)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Faculty & Teachers Directory
            </h1>
            <p className="text-sm text-emerald-200/90 max-w-2xl">
              Easily onboard instructors, update Arabic profiles and academic degrees, and monitor teaching schedules across the 5-Days and 2-Days departments.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canManage && (
              <button
                type="button"
                onClick={openAddModal}
                className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register New Teacher</span>
              </button>
            )}

            <Link
              href="/dashboard/teachers/assignments"
              className="px-4 py-3 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold border border-emerald-600/60 shadow transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Subject Allocation</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-emerald-800/60">
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Total Faculty
            </span>
            <span className="text-2xl font-black text-white">{stats.total}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
              Mudir & Deans
            </span>
            <span className="text-2xl font-black text-amber-400">{stats.mudirs}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider block">
              Instructors
            </span>
            <span className="text-2xl font-black text-cyan-300">{stats.faculty}</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-emerald-800/40">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Active Allocations
            </span>
            <span className="text-2xl font-black text-emerald-400">{stats.totalAssignments}</span>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border shadow-xs animate-in fade-in duration-200 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty by name, Arabic, degree, tribe, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                filterRole === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('mudir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                filterRole === 'mudir'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mudir ({stats.mudirs})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('faculty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                filterRole === 'faculty'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Faculty ({stats.faculty})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {tribesList.length > 0 && (
            <select
              value={filterTribe}
              onChange={(e) => setFilterTribe(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              <option value="all">All Tribes</option>
              {tribesList.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white shadow text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Detailed Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Faculty Directory Presentation */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTeachers.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-800 text-base">No faculty members found</h3>
              <p className="text-xs text-slate-500">
                Try searching with different terms or click "+ Register New Teacher" to onboard someone new.
              </p>
            </div>
          ) : (
            filteredTeachers.map((t) => {
              const teacherAllocs = assignments.filter((a) => a.TeacherID === t.TeacherID);
              const teacherSchs = schedules.filter((s) => s.TeacherID === t.TeacherID);

              return (
                <div
                  key={t.TeacherID}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-emerald-300"
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar, Names, Badges, and Action Menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow shrink-0 ${
                            t.IsMudir
                              ? 'bg-gradient-to-tr from-amber-500 to-amber-700'
                              : 'bg-gradient-to-tr from-emerald-600 to-teal-700'
                          }`}
                        >
                          {t.IsMudir ? <Crown className="w-6 h-6" /> : t.Name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm">{t.Name}</h3>
                            {t.IsMudir && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> Mudir
                              </span>
                            )}
                          </div>
                          {t.NameArabic && (
                            <p className="text-xs text-amber-700 font-serif mt-0.5" dir="rtl">
                              {t.NameArabic}
                            </p>
                          )}
                          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                            {t.Degree || 'Faculty Instructor'}
                          </p>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
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

                    {/* Contact & Demographic Metadata */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1 text-slate-600">
                      {t.Email && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{t.Email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        {t.MobileNumber ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {t.MobileNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No mobile phone</span>
                        )}
                        {t.Tribe && (
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                            {t.Tribe}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Assigned Subjects & Timetables */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          Teaching Load ({teacherAllocs.length})
                        </span>
                        <Link
                          href={`/dashboard/teachers/assignments?teacherId=${t.TeacherID}`}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {teacherAllocs.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic bg-slate-50/70 p-2 rounded-lg text-center">
                          No subjects assigned yet
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {teacherAllocs.slice(0, 3).map((alloc) => {
                            const sub = subjects.find((s) => s.SubjectID === alloc.SubjectID);
                            const cls = classes.find((c) => c.ClassID === alloc.ClassID);
                            const slot = teacherSchs.find(
                              (s) => s.SubjectID === alloc.SubjectID && s.ClassID === alloc.ClassID
                            );

                            return (
                              <div
                                key={alloc.ID}
                                className="bg-emerald-50/60 border border-emerald-200/70 rounded-lg px-2.5 py-1 text-xs flex items-center justify-between gap-1"
                              >
                                <div className="truncate">
                                  <span className="font-bold text-slate-800 text-[11px] block truncate">
                                    {sub?.SubjectClass || `Subject #${alloc.SubjectID}`}
                                  </span>
                                  <span className="text-[10px] text-emerald-900 block truncate">
                                    {cls?.ClassName}
                                  </span>
                                </div>
                                {slot ? (
                                  <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                    {slot.Day.substring(0, 3)} {slot.StartTime}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic shrink-0">
                                    Unscheduled
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {teacherAllocs.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-semibold block text-center">
                              +{teacherAllocs.length - 3} more subjects...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: #{t.TeacherID}</span>
                    <Link
                      href={`/dashboard/teachers/assignments?teacherId=${t.TeacherID}`}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Allocate & Schedule</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Designation & Degree</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Tribe / Nationality</th>
                  <th className="py-3 px-4">Assigned Subjects</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const teacherAllocs = assignments.filter((a) => a.TeacherID === t.TeacherID);
                  return (
                    <tr key={t.TeacherID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow shrink-0 ${
                              t.IsMudir
                                ? 'bg-amber-600'
                                : 'bg-emerald-700'
                            }`}
                          >
                            {t.IsMudir ? <Crown className="w-4 h-4" /> : t.Name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{t.Name}</p>
                            {t.NameArabic && (
                              <p className="text-xs text-amber-700 font-serif" dir="rtl">
                                {t.NameArabic}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {t.IsMudir ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                            <Crown className="w-3 h-3" /> Mudir / Principal
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-700">
                            Faculty Teacher
                          </span>
                        )}
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          {t.Degree || 'Instructor'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-slate-600">
                        {t.Email && <p>{t.Email}</p>}
                        {t.MobileNumber && <p className="text-slate-400">{t.MobileNumber}</p>}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-700">
                        <span className="font-semibold">{t.Tribe || 'N/A'}</span>
                        <span className="block text-[10px] text-slate-400">{t.Nationality || 'Filipino'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {teacherAllocs.length} Subjects
                        </span>
                      </td>

                      {canManage && (
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <Link
                            href={`/dashboard/teachers/assignments?teacherId=${t.TeacherID}`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg inline-block transition-colors"
                            title="Assign Subjects"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.TeacherID)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTUITIVE, SPACIOUS MODAL DIALOG: ADD / EDIT TEACHER */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingId ? 'Edit Faculty Details' : 'Register New Faculty Member'}
                  </h2>
                  <p className="text-xs text-amber-200/90">
                    {editingId ? `Updating record #${editingId}` : 'Add instructor to JMAA-MoritAko database'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Step Tabs for easy navigation */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-bold px-5">
              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'academic'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-extrabold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Academic & Title
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'personal'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-extrabold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Demographics & Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'credentials'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-extrabold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Login Credentials
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'academic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name (English) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.Name}
                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                        placeholder="e.g. Ustadh Ahmad Al-Farouqi"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name (Arabic - الاسم بالعربية)
                      </label>
                      <input
                        type="text"
                        value={formData.NameArabic}
                        onChange={(e) => setFormData({ ...formData, NameArabic: e.target.value })}
                        placeholder="e.g. أستاذ أحمد الفاروقي"
                        dir="rtl"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Academic Degree / Qualification
                    </label>
                    <input
                      type="text"
                      value={formData.Degree}
                      onChange={(e) => setFormData({ ...formData, Degree: e.target.value })}
                      placeholder="e.g. MA in Islamic Jurisprudence, BA Shariah (Al-Azhar)"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Mudir Designation Switch */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-600" />
                        Designate as Mudir / Principal / Dean
                      </span>
                      <p className="text-xs text-amber-800/80 mt-0.5">
                        Enables academic governance, approval of unlock requests, and curriculum control.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.IsMudir}
                        onChange={(e) => setFormData({ ...formData, IsMudir: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'personal' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender
                      </label>
                      <select
                        value={formData.Gender}
                        onChange={(e) => setFormData({ ...formData, Gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Male">Male (ذكر)</option>
                        <option value="Female">Female (أنثى)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tribe / Ethnicity (القبيلة)
                      </label>
                      <input
                        type="text"
                        value={formData.Tribe}
                        onChange={(e) => setFormData({ ...formData, Tribe: e.target.value })}
                        placeholder="e.g. Maranao, Maguindanaon, Tausug, Arab"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={formData.Nationality}
                        onChange={(e) => setFormData({ ...formData, Nationality: e.target.value })}
                        placeholder="e.g. Filipino, Egyptian, Saudi"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.DOB}
                        onChange={(e) => setFormData({ ...formData, DOB: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Mobile Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.MobileNumber}
                        onChange={(e) => setFormData({ ...formData, MobileNumber: e.target.value })}
                        placeholder="09123456789"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        value={formData.Address}
                        onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                        placeholder="e.g. Marawi City, BARMM"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'credentials' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Login Email Address <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateEmail}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
                      >
                        Auto-generate from name
                      </button>
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.Email}
                      onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                      placeholder="teacher.name@jmaa.edu"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.Password}
                        onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                        placeholder="teacher123"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Default initial password: <code className="bg-slate-100 px-1 py-0.5 rounded">teacher123</code>
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {activeTab !== 'academic' && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(activeTab === 'credentials' ? 'personal' : 'academic')
                      }
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {activeTab !== 'credentials' && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(activeTab === 'academic' ? 'personal' : 'credentials')
                      }
                      className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl cursor-pointer"
                    >
                      Next Step
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{editingId ? 'Save Changes' : 'Confirm Registration'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
