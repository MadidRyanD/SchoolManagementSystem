'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Building2,
  CalendarCheck,
  Info,
} from 'lucide-react';

export default function TeacherSubjectAssignmentPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacherItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);

  // Permissions
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // Selected state for form
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(0);

  // Schedule slot state for allocation
  const [day, setDay] = useState<
    'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  >('Sunday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [room, setRoom] = useState('Hall 101');
  const [includeSchedule, setIncludeSchedule] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<number>(0);
  const [filterTeacher, setFilterTeacher] = useState<number>(0);

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    const sub = DataStore.getSubjects();
    const tch = DataStore.getTeachers();
    const stMap = DataStore.getSubjectTeachers();
    const sch = DataStore.getSchedules();

    setClasses(cls);
    setSubjects(sub);
    setTeachers(tch);
    setAssignments(stMap);
    setSchedules(sch);

    if (cls.length > 0 && selectedClassId === 0) setSelectedClassId(cls[0].ClassID);
    if (sub.length > 0 && selectedSubjectId === 0) setSelectedSubjectId(sub[0].SubjectID);
    if (tch.length > 0 && selectedTeacherId === 0) setSelectedTeacherId(tch[0].TeacherID);
  };

  // Inspect currently selected teacher
  const inspectedTeacher = useMemo(() => {
    return teachers.find((t) => t.TeacherID === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  // All subjects currently assigned to the inspected teacher
  const teacherAllocations = useMemo(() => {
    if (!inspectedTeacher) return [];
    return assignments.filter((a) => a.TeacherID === inspectedTeacher.TeacherID);
  }, [assignments, inspectedTeacher]);

  // All schedule slots for the inspected teacher
  const teacherSchedules = useMemo(() => {
    if (!inspectedTeacher) return [];
    return schedules.filter((s) => s.TeacherID === inspectedTeacher.TeacherID);
  }, [schedules, inspectedTeacher]);

  // Conflict preview check
  const conflictPreview = useMemo(() => {
    if (!includeSchedule || !selectedTeacherId) return null;
    const conflict = schedules.find(
      (s) =>
        s.TeacherID === selectedTeacherId &&
        s.Day === day &&
        s.StartTime === startTime
    );
    if (conflict) {
      const clsName =
        classes.find((c) => c.ClassID === conflict.ClassID)?.ClassName ||
        `Class #${conflict.ClassID}`;
      const subName =
        subjects.find((sb) => sb.SubjectID === conflict.SubjectID)?.SubjectClass ||
        `Subject #${conflict.SubjectID}`;
      return `Conflict detected! Teacher is already scheduled for "${subName}" (${clsName}) on ${day} at ${startTime}.`;
    }
    return null;
  }, [schedules, selectedTeacherId, day, startTime, includeSchedule, classes, subjects]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'You do not have permission to assign subjects.', type: 'error' });
      return;
    }
    if (!selectedClassId || !selectedSubjectId || !selectedTeacherId) {
      setMsg({ text: 'Please fill out all assignment fields.', type: 'error' });
      return;
    }

    if (includeSchedule && conflictPreview) {
      setMsg({ text: conflictPreview, type: 'error' });
      return;
    }

    // 1. Save SubjectTeacher
    DataStore.saveSubjectTeacher({
      ClassID: selectedClassId,
      SubjectID: selectedSubjectId,
      TeacherID: selectedTeacherId,
    });

    // 2. Save Schedule if included
    if (includeSchedule) {
      const schRes = DataStore.saveSchedule({
        ClassID: selectedClassId,
        SubjectID: selectedSubjectId,
        TeacherID: selectedTeacherId,
        Day: day,
        StartTime: startTime,
        EndTime: endTime,
        Room: room,
      });

      if (!schRes.success) {
        setMsg({ text: schRes.conflict || 'Error saving schedule slot.', type: 'error' });
        loadData();
        return;
      }
    }

    setMsg({
      text: `Successfully assigned teacher to subject with ${
        includeSchedule ? `${day} ${startTime}-${endTime} schedule!` : 'no immediate schedule.'
      }`,
      type: 'success',
    });
    loadData();
    setTimeout(() => setMsg(null), 4000);
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      setMsg({ text: 'You do not have permission to remove allocations.', type: 'error' });
      return;
    }
    const target = assignments.find((a) => a.ID === id);
    if (!target) return;

    if (confirm('Are you sure you want to remove this teacher subject allocation?')) {
      DataStore.deleteSubjectTeacher(id);

      // Clean up corresponding schedule if desired
      const matchSch = schedules.filter(
        (s) =>
          s.TeacherID === target.TeacherID &&
          s.SubjectID === target.SubjectID &&
          s.ClassID === target.ClassID
      );
      matchSch.forEach((ms) => DataStore.deleteSchedule(ms.ID));

      setMsg({ text: 'Allocation and associated schedules removed.', type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const getClassName = (id: number) =>
    classes.find((c) => c.ClassID === id)?.ClassName || `Class #${id}`;
  const getSubjectName = (id: number) =>
    subjects.find((s) => s.SubjectID === id)?.SubjectClass || `Subject #${id}`;
  const getSubjectArabic = (id: number) =>
    subjects.find((s) => s.SubjectID === id)?.SubjectArabic || '';
  const getTeacherName = (id: number) =>
    teachers.find((t) => t.TeacherID === id)?.Name || `Teacher #${id}`;
  const getTeacherArabic = (id: number) =>
    teachers.find((t) => t.TeacherID === id)?.NameArabic || '';

  const filteredSubjects = subjects.filter((s) => s.ClassID === selectedClassId);

  // Filtered allocations for the table
  const filteredAllocations = assignments.filter((a) => {
    const matchesSearch =
      getClassName(a.ClassID).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSubjectName(a.SubjectID).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTeacherName(a.TeacherID).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 0 || a.ClassID === filterClass;
    const matchesTeacher = filterTeacher === 0 || a.TeacherID === filterTeacher;
    return matchesSearch && matchesClass && matchesTeacher;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              Teacher Subject Allocation & Schedules
            </h1>
            {canManage && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin / Mudir Mode
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Assign faculty to subjects, configure class dates and times, and monitor teacher workload.
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

      {/* TOP SECTION: TEACHER INSPECTOR & WORKLOAD VIEWER */}
      {inspectedTeacher && (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-md border border-emerald-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-800/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-slate-950 font-extrabold flex items-center justify-center text-lg shadow">
                {inspectedTeacher.Name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{inspectedTeacher.Name}</h2>
                  {inspectedTeacher.IsMudir && (
                    <span className="text-[11px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">
                      Mudir / Dean
                    </span>
                  )}
                </div>
                <div className="text-xs text-amber-300 font-serif" dir="rtl">
                  {inspectedTeacher.NameArabic || 'عضو هيئة التدريس'}
                </div>
              </div>
            </div>

            {/* Quick Teacher Switcher */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                Inspect Teacher:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="bg-slate-800 border border-emerald-700 text-white text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
              >
                {teachers.map((t) => (
                  <option key={t.TeacherID} value={t.TeacherID}>
                    {t.Name} {t.NameArabic ? `(${t.NameArabic})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher's Current Subjects and Schedule Date & Time */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4" />
                Current Assigned Subjects & Schedule (المواد والجدول الأسبوعي)
              </h3>
              <span className="text-xs text-slate-300">
                Total Subjects: <strong className="text-amber-300">{teacherAllocations.length}</strong> | 
                Scheduled Slots: <strong className="text-amber-300">{teacherSchedules.length}</strong>
              </span>
            </div>

            {teacherAllocations.length === 0 ? (
              <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-dashed border-slate-700 text-slate-300 text-xs">
                No subjects currently assigned to this teacher. They are available for allocation below.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teacherAllocations.map((alloc) => {
                  const subjectName = getSubjectName(alloc.SubjectID);
                  const subjectAr = getSubjectArabic(alloc.SubjectID);
                  const className = getClassName(alloc.ClassID);

                  // Find schedule slots for this subject
                  const relatedSlots = teacherSchedules.filter(
                    (s) => s.SubjectID === alloc.SubjectID && s.ClassID === alloc.ClassID
                  );

                  return (
                    <div
                      key={alloc.ID}
                      className="bg-slate-800/80 border border-emerald-700/60 rounded-xl p-3 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-white">{subjectName}</p>
                          {subjectAr && (
                            <p className="text-xs text-amber-200/90 font-serif" dir="rtl">
                              {subjectAr}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-semibold whitespace-nowrap">
                          {className}
                        </span>
                      </div>

                      {/* Timetable Date & Time */}
                      <div className="pt-1 border-t border-slate-700/60 text-xs space-y-1">
                        {relatedSlots.length > 0 ? (
                          relatedSlots.map((slot) => (
                            <div
                              key={slot.ID}
                              className="flex items-center justify-between text-[11px] bg-slate-900/70 px-2 py-1 rounded text-slate-200"
                            >
                              <span className="flex items-center gap-1 font-semibold text-amber-300">
                                <Calendar className="w-3 h-3" />
                                {slot.Day}
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {slot.StartTime} - {slot.EndTime}
                              </span>
                              <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                                <MapPin className="w-3 h-3" />
                                {slot.Room}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-amber-300/80 italic flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            No time slot assigned yet.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: ASSIGNMENT FORM + CURRENT ALLOCATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Assign Subject to Teacher
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              New Allocation
            </span>
          </div>

          <form onSubmit={handleAssign} className="space-y-4 text-sm">
            {/* Class selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Target Class & Section
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const newCid = Number(e.target.value);
                  setSelectedClassId(newCid);
                  const subs = subjects.filter((s) => s.ClassID === newCid);
                  if (subs.length > 0) setSelectedSubjectId(subs[0].SubjectID);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.ClassID} value={c.ClassID}>
                    {c.ClassName} ({c.Department})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Subject to Assign
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((s) => (
                    <option key={s.SubjectID} value={s.SubjectID}>
                      {s.SubjectClass} {s.SubjectArabic ? `(${s.SubjectArabic})` : ''}
                    </option>
                  ))
                ) : (
                  subjects.map((s) => (
                    <option key={s.SubjectID} value={s.SubjectID}>
                      {s.SubjectClass} ({getClassName(s.ClassID)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Teacher selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Teacher Assigned
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                {teachers.map((t) => (
                  <option key={t.TeacherID} value={t.TeacherID}>
                    {t.Name} {t.NameArabic ? `(${t.NameArabic})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Date & Time Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={includeSchedule}
                  onChange={(e) => setIncludeSchedule(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
                <span>Set Class Schedule (Day & Time) now</span>
              </label>
            </div>

            {/* Schedule slot fields */}
            {includeSchedule && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Scheduled Day
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Sunday">Sunday (الأحد)</option>
                    <option value="Monday">Monday (الإثنين)</option>
                    <option value="Tuesday">Tuesday (الثلاثاء)</option>
                    <option value="Wednesday">Wednesday (الأربعاء)</option>
                    <option value="Thursday">Thursday (الخميس)</option>
                    <option value="Friday">Friday (الجمعة)</option>
                    <option value="Saturday">Saturday (السبت)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Classroom / Hall
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Hall 101, Lab 2"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>

                {/* Conflict Alert Box */}
                {conflictPreview && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{conflictPreview}</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!canManage || (includeSchedule && !!conflictPreview)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirm Teacher Allocation</span>
            </button>
          </form>
        </div>

        {/* Right Column: All Allocations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Allocations & Timetables ({assignments.length})
              </h2>
              <p className="text-xs text-slate-500">
                Complete overview of assigned faculty and scheduled class times
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <th className="py-3 px-4">Subject & Class</th>
                  <th className="py-3 px-4">Assigned Teacher</th>
                  <th className="py-3 px-4">Scheduled Date & Time</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-sm">
                      No matching teacher allocations found.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map((a) => {
                    const teacherName = getTeacherName(a.TeacherID);
                    const teacherAr = getTeacherArabic(a.TeacherID);
                    const subjectName = getSubjectName(a.SubjectID);
                    const subjectAr = getSubjectArabic(a.SubjectID);
                    const className = getClassName(a.ClassID);

                    // Find corresponding schedule(s)
                    const relatedSlots = schedules.filter(
                      (s) =>
                        s.TeacherID === a.TeacherID &&
                        s.SubjectID === a.SubjectID &&
                        s.ClassID === a.ClassID
                    );

                    return (
                      <tr key={a.ID} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{subjectName}</p>
                          {subjectAr && (
                            <span className="text-xs text-amber-700 font-serif block">
                              {subjectAr}
                            </span>
                          )}
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {className}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {teacherName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{teacherName}</p>
                              {teacherAr && (
                                <p className="text-[11px] text-slate-500 font-serif" dir="rtl">
                                  {teacherAr}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {relatedSlots.length > 0 ? (
                            <div className="space-y-1">
                              {relatedSlots.map((slot) => (
                                <div
                                  key={slot.ID}
                                  className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-mono"
                                >
                                  <Calendar className="w-3 h-3 text-emerald-600" />
                                  <span className="font-bold">{slot.Day}</span>
                                  <span className="text-slate-500">
                                    {slot.StartTime} - {slot.EndTime}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    ({slot.Room})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No schedule set
                            </span>
                          )}
                        </td>

                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDelete(a.ID)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Allocation"
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
