'use client';

import React, { useState, useMemo } from 'react';
import {
  ClassScheduleItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
} from '@/lib/types';
import { DataStore } from '@/lib/store';
import { toHindiNumerals, formatTimeHindi } from '@/lib/numerals';
import {
  Clock,
  Filter,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronDown,
  X,
  Check,
  Plus,
  Trash2,
  Printer,
  Building2,
  UserCheck,
  AlertTriangle,
  Phone,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface PrincipalMasterScheduleViewProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  teachers: TeacherItem[];
  schedules: ClassScheduleItem[];
  onRefresh: () => void;
  canManage?: boolean;
  initialClassId?: number;
}

export default function PrincipalMasterScheduleView({
  classes,
  subjects,
  teachers,
  schedules,
  onRefresh,
  canManage = true,
  initialClassId = 0,
}: PrincipalMasterScheduleViewProps) {
  // Scope: 0 = "All Schedules & Classes", >0 = specific ClassID
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId);

  // Department mode filter: '5-days' | '2-days' | 'all'
  const [deptFilter, setDeptFilter] = useState<'5-days' | '2-days' | 'all'>('all');

  // Teacher filter: 0 = all teachers
  const [filterTeacherId, setFilterTeacherId] = useState<number>(0);

  // Semester toggle
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st');

  // Highlighted Subject ID
  const [highlightedSubjectId, setHighlightedSubjectId] = useState<number | null>(null);

  // Filter dropdown state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Hover Popover state
  const [hoveredTeacher, setHoveredTeacher] = useState<{
    teacher: TeacherItem;
    subject: SubjectItem;
    schedule: ClassScheduleItem;
    classItem?: ClassItem;
    x: number;
    y: number;
  } | null>(null);

  // Add Schedule Modal
  const [isAdding, setIsAdding] = useState(false);
  const [modalForm, setModalForm] = useState({
    ClassID: classes[0]?.ClassID || 1,
    SubjectID: subjects[0]?.SubjectID || 1,
    TeacherID: teachers[0]?.TeacherID || 1,
    Day: 'Sunday' as any,
    StartTime: '07:00',
    EndTime: '08:30',
    Room: 'Hall 101',
  });
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Time periods definition
  const timeSlots = [
    { label: '7:00 - 8:30', start: '07:00', end: '08:30', isBreak: false },
    { label: '8:30 - 9:30', start: '08:30', end: '09:30', isBreak: false },
    { label: '9:30 - 9:40', start: '09:30', end: '09:40', isBreak: true, titleArabic: 'فسحة / استراحة' },
    { label: '9:40 - 10:40', start: '09:40', end: '10:40', isBreak: false },
    { label: '10:40 - 11:30', start: '10:40', end: '11:30', isBreak: false },
    { label: '11:30 - 12:30', start: '11:30', end: '12:30', isBreak: false },
  ];

  // Days list
  const fiveDaysList = [
    { key: 'Sunday', nameEn: 'Sun', nameAr: 'الأحد' },
    { key: 'Monday', nameEn: 'Mon', nameAr: 'الاثنين' },
    { key: 'Tuesday', nameEn: 'Tue', nameAr: 'الثلاثاء' },
    { key: 'Wednesday', nameEn: 'Wed', nameAr: 'الأربعاء' },
    { key: 'Thursday', nameEn: 'Thur', nameAr: 'الخميس' },
  ];

  const twoDaysList = [
    { key: 'Friday', nameEn: 'Fri', nameAr: 'الجمعة' },
    { key: 'Saturday', nameEn: 'Sat', nameAr: 'السبت' },
  ];

  const allSevenDaysList = [...fiveDaysList, ...twoDaysList];

  const activeDays = useMemo(() => {
    if (deptFilter === '2-days') return twoDaysList;
    if (deptFilter === '5-days') return fiveDaysList;
    return allSevenDaysList;
  }, [deptFilter]);

  const getSubject = (sid: number) => subjects.find(s => s.SubjectID === sid);
  const getTeacher = (tid: number) => teachers.find(t => t.TeacherID === tid);
  const getClass = (cid: number) => classes.find(c => c.ClassID === cid);

  // Filtered schedules according to selected class, department, and teacher
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      // 1. Class filter
      if (selectedClassId > 0 && s.ClassID !== selectedClassId) return false;

      // 2. Department filter
      const cls = getClass(s.ClassID);
      if (deptFilter !== 'all' && cls && cls.Department !== deptFilter) return false;

      // 3. Teacher filter
      if (filterTeacherId > 0 && s.TeacherID !== filterTeacherId) return false;

      return true;
    });
  }, [schedules, selectedClassId, deptFilter, filterTeacherId, classes]);

  // Find all schedule items that belong to a particular day and time range
  const getSlotSchedules = (dayKey: string, slotStart: string, slotEnd: string) => {
    return filteredSchedules.filter(s => {
      if (s.Day !== dayKey) return false;
      if (s.StartTime === slotStart) return true;
      // Overlap or containment in slot
      return s.StartTime >= slotStart && s.StartTime < slotEnd;
    });
  };

  // Conflict detection overview
  const institutionConflicts = useMemo(() => {
    const list: { teacher: TeacherItem; day: string; time: string; classes: string[] }[] = [];
    teachers.forEach(teacher => {
      allSevenDaysList.forEach(day => {
        const teacherSlots = schedules.filter(s => s.TeacherID === teacher.TeacherID && s.Day === day.key);
        const timeMap: Record<string, number[]> = {};
        teacherSlots.forEach(s => {
          if (!timeMap[s.StartTime]) timeMap[s.StartTime] = [];
          timeMap[s.StartTime].push(s.ClassID);
        });

        Object.entries(timeMap).forEach(([time, cIds]) => {
          if (cIds.length > 1) {
            const classNames = cIds.map(cid => getClass(cid)?.ClassName || `Class #${cid}`);
            list.push({ teacher, day: day.key, time, classes: classNames });
          }
        });
      });
    });
    return list;
  }, [teachers, schedules, classes]);

  // Group classes by department for organized select options
  const classes5Days = useMemo(() => classes.filter(c => c.Department === '5-days'), [classes]);
  const classes2Days = useMemo(() => classes.filter(c => c.Department === '2-days'), [classes]);

  const selectedClass = selectedClassId > 0 ? getClass(selectedClassId) : null;
  const highlightedSubject = highlightedSubjectId ? getSubject(highlightedSubjectId) : null;

  // Add schedule submission
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const res = DataStore.saveSchedule({
      ClassID: Number(modalForm.ClassID),
      SubjectID: Number(modalForm.SubjectID),
      TeacherID: Number(modalForm.TeacherID),
      Day: modalForm.Day,
      StartTime: modalForm.StartTime,
      EndTime: modalForm.EndTime,
      Room: modalForm.Room || 'Hall 101',
    });

    if (!res.success) {
      setConflictError(res.conflict || 'Schedule conflict detected!');
      return;
    }

    setSuccessMsg('New schedule session added successfully!');
    setIsAdding(false);
    onRefresh();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDeleteSlot = (id: number) => {
    if (!canManage) return;
    if (confirm('Are you sure you want to remove this schedule slot?')) {
      DataStore.deleteSchedule(id);
      onRefresh();
      setSuccessMsg('Schedule slot removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Executive Master Schedule Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 shadow-md flex items-center justify-center flex-shrink-0">
            <Calendar className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                عمادة وإدارة الجامعة &bull; Master Schedule
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                جامعة منيب الكزبري العربية
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>جدول الحصص والمحاضرات العام</span>
              <span className="text-emerald-200 text-sm font-normal">
                (Master Timetable View)
              </span>
            </h1>
            <p className="text-xs text-emerald-200/90 mt-0.5 flex flex-wrap items-center gap-1.5 font-serif">
              <span>النطاق النشط:</span>
              <span className="font-bold text-amber-300">
                {selectedClass ? selectedClass.ClassName : 'كافة الصفوف والأقسام (All Classes)'}
              </span>
              <span>&bull;</span>
              <span>
                القسم: {deptFilter === '5-days' ? 'القسم الصباحي (٥ أيام)' : deptFilter === '2-days' ? 'القسم الأسبوعي (يومين)' : 'كامل الأقسام (٧ أيام)'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-emerald-300 block font-bold font-serif">الحصص المعروضة</span>
            <span className="text-xl font-black text-white font-mono">
              {toHindiNumerals(filteredSchedules.length)}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-amber-300 block font-bold font-serif">الصفوف المغطاة</span>
            <span className="text-xl font-black text-white font-mono">
              {toHindiNumerals(new Set(filteredSchedules.map(s => s.ClassID)).size)}
            </span>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setConflictError(null);
                setIsAdding(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer font-serif active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حصة دراسية</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold border border-emerald-600/50 shadow transition-all cursor-pointer"
            title="طباعة الجدول"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Conflict Overlap Warning Banner */}
      {institutionConflicts.length > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-2xl shadow-xs space-y-2 text-right">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>تنبيه تضارب مواعيد الأساتذة ({toHindiNumerals(institutionConflicts.length)} تضارب مكتشف)</span>
          </div>
          <p className="text-xs text-amber-800">
            اكتشف النظام تعارضاً في جدول أحد الأساتذة في نفس اليوم والتوقيت عبر أكثر من فصل:
          </p>
          <div className="space-y-1 pr-6 text-xs text-amber-900">
            {institutionConflicts.map((c, i) => (
              <div key={i}>
                &bull; <span className="font-bold">{c.teacher.NameArabic || c.teacher.Name}</span> مجدول في نفس التوقيت يوم{' '}
                <span className="font-semibold">{c.day} الساعة {c.time}</span> في: {c.classes.join(' و ')}.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Schedule Container (Warm Parchment Aesthetic #dfd4b8) */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        {/* Top Control Bar in Card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Class Scope Selector & Department Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Main Class Selector: "All Schedules" or Specific Class */}
            <div className="flex items-center gap-2 bg-white/90 border border-[#cfc39f] rounded-2xl px-3 py-1.5 shadow-2xs">
              <span className="text-xs font-black text-slate-700 font-serif">عرض الجدول:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedClassId(val);
                  setHighlightedSubjectId(null);
                }}
                className="text-xs font-bold bg-transparent text-emerald-950 focus:outline-none cursor-pointer pr-1"
              >
                <option value={0}>🌟 عرض جميع الجداول والصفوف (All Schedules)</option>
                <optgroup label="─── القسم الصباحي (5-Days Department) ───">
                  {classes5Days.map(c => (
                    <option key={c.ClassID} value={c.ClassID}>
                      [{c.Level}] {c.ClassName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="─── القسم الأسبوعي (2-Days Department) ───">
                  {classes2Days.map(c => (
                    <option key={c.ClassID} value={c.ClassID}>
                      [{c.Level}] {c.ClassName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 2. Department Day Scope Pills */}
            <div className="flex items-center bg-white/70 p-1 rounded-2xl border border-[#cfc39f]">
              <button
                type="button"
                onClick={() => setDeptFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-serif ${
                  deptFilter === 'all'
                    ? 'bg-[#126b38] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-[#dfd4b8]/50'
                }`}
              >
                كامل الأيام (٧ أيام)
              </button>
              <button
                type="button"
                onClick={() => setDeptFilter('5-days')}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-serif ${
                  deptFilter === '5-days'
                    ? 'bg-[#126b38] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-[#dfd4b8]/50'
                }`}
              >
                القسم الصباحي (٥ أيام)
              </button>
              <button
                type="button"
                onClick={() => setDeptFilter('2-days')}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-serif ${
                  deptFilter === '2-days'
                    ? 'bg-[#126b38] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-[#dfd4b8]/50'
                }`}
              >
                القسم الأسبوعي (يومين)
              </button>
            </div>

            {/* 3. Teacher Filter */}
            <div className="flex items-center gap-2 bg-white/90 border border-[#cfc39f] rounded-2xl px-3 py-1.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 font-serif">الأستاذ:</span>
              <select
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(Number(e.target.value))}
                className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={0}>كافة الكادر التعليمي (All Teachers)</option>
                {teachers.map(t => (
                  <option key={t.TeacherID} value={t.TeacherID}>
                    {t.NameArabic || t.Name} {t.IsMudir ? '(المدير)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Highlight Banner / Semester Capsule */}
          <div className="flex items-center gap-3">
            {highlightedSubject && (
              <div className="bg-[#9f7a28] text-white px-4 py-1.5 rounded-full shadow-xs flex items-center gap-2 text-xs font-serif font-bold animate-fadeIn">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>المادة: {highlightedSubject.SubjectArabic || highlightedSubject.SubjectClass}</span>
                <button
                  type="button"
                  onClick={() => setHighlightedSubjectId(null)}
                  className="bg-black/20 hover:bg-black/40 rounded-full p-0.5 text-white cursor-pointer mr-1"
                  title="إلغاء التحديد"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Semester Capsule with Hindi Numerals */}
            <div className="bg-white border border-[#cfc39f] px-4 py-1.5 rounded-full shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-2 font-serif">
              <span className="font-mono text-emerald-950 font-black">
                {toHindiNumerals('2025')} - {selectedSemester === '1st' ? '1st' : '2nd'}
              </span>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedSemester(selectedSemester === '1st' ? '2nd' : '1st')}
                className="text-emerald-950 font-black hover:underline cursor-pointer"
              >
                {selectedSemester === '1st' ? 'الفصل الأول' : 'الفصل الثاني'}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Grid Table - RTL: Time Column on the Right */}
        <div className="overflow-x-auto rounded-2xl border border-[#c5b791] bg-[#dfd4b8]">
          <table className="w-full border-collapse text-center" dir="rtl">
            {/* Table Header: TIME ON THE FAR RIGHT */}
            <thead>
              <tr className="bg-[#b79e55] text-white text-xs sm:text-sm font-black border-b border-[#a48c48]">
                {/* 1. Time Column */}
                <th className="py-3.5 px-3 border-l border-[#a48c48]/60 w-[14%]">
                  <div className="font-serif">الوقت</div>
                  <div className="font-sans text-[11px] font-medium opacity-90">Time Period</div>
                </th>

                {/* 2. Days Columns from Right to Left */}
                {activeDays.map((day, idx) => (
                  <th
                    key={day.key}
                    className={`py-3.5 px-3 ${
                      idx < activeDays.length - 1 ? 'border-l border-[#a48c48]/60' : ''
                    }`}
                  >
                    <div className="font-serif text-sm sm:text-base">{day.nameAr}</div>
                    <div className="font-sans text-[11px] font-medium opacity-90">{day.nameEn}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#c9bc97]">
              {timeSlots.map(slot => {
                const timeInHindi = formatTimeHindi(slot.label);

                // Dedicated Recess Break Row
                if (slot.isBreak) {
                  return (
                    <tr key={slot.label} className="bg-[#d7ccaf]">
                      <td className="py-2.5 px-3 border-l border-[#c5b791] font-mono text-xs font-black text-emerald-950 bg-[#d1c4a2]">
                        {timeInHindi}
                      </td>
                      <td
                        colSpan={activeDays.length}
                        className="py-2.5 px-4 text-center font-black font-serif text-sm tracking-wider text-emerald-950 bg-[#d4c9ab]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-8 h-0.5 bg-emerald-800/30 rounded"></span>
                          <span className="text-base text-[#126b38] font-black">
                            {slot.titleArabic} (Recess Break)
                          </span>
                          <span className="w-8 h-0.5 bg-emerald-800/30 rounded"></span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.label} className="hover:bg-[#d8cdae]/50 transition-colors">
                    {/* Time Column on the Right */}
                    <td className="py-3 px-3 border-l border-[#c5b791] font-mono text-xs sm:text-sm font-black text-slate-900 bg-[#ded3b6]">
                      {timeInHindi}
                    </td>

                    {/* Day Cells */}
                    {activeDays.map((day, dIdx) => {
                      const slotItems = getSlotSchedules(day.key, slot.start, slot.end);

                      return (
                        <td
                          key={day.key}
                          className={`p-2 align-top ${
                            dIdx < activeDays.length - 1 ? 'border-l border-[#c5b791]' : ''
                          }`}
                        >
                          {slotItems.length === 0 ? (
                            <div className="h-full min-h-[64px] flex items-center justify-center text-slate-400/70 text-xs font-serif">
                              —
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {slotItems.map(item => {
                                const sub = getSubject(item.SubjectID);
                                const teacher = getTeacher(item.TeacherID);
                                const itemClass = getClass(item.ClassID);

                                const isHighlighted =
                                  highlightedSubjectId !== null && sub?.SubjectID === highlightedSubjectId;
                                const isDimmed =
                                  highlightedSubjectId !== null && sub?.SubjectID !== highlightedSubjectId;

                                return (
                                  <div
                                    key={item.ID}
                                    onMouseEnter={(e) => {
                                      if (teacher && sub) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredTeacher({
                                          teacher,
                                          subject: sub,
                                          schedule: item,
                                          classItem: itemClass,
                                          x: rect.left - 290,
                                          y: rect.top,
                                        });
                                      }
                                    }}
                                    onMouseLeave={() => setHoveredTeacher(null)}
                                    onClick={() => {
                                      if (sub) {
                                        setHighlightedSubjectId(prev =>
                                          prev === sub.SubjectID ? null : sub.SubjectID
                                        );
                                      }
                                    }}
                                    className={`w-full rounded-xl p-2 transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none relative group ${
                                      isHighlighted
                                        ? 'bg-[#9f7a28] text-white border-2 border-amber-300 ring-4 ring-amber-400/50 shadow-xl scale-105 transform z-10'
                                        : isDimmed
                                        ? 'bg-white/70 opacity-40 border border-[#ccbf99] hover:opacity-90'
                                        : 'bg-white hover:bg-amber-50/80 text-slate-900 border border-[#ccbf99] shadow-xs hover:shadow-md'
                                    }`}
                                  >
                                    {/* Class Badge (Especially useful in All Schedules mode) */}
                                    {itemClass && (
                                      <div className="flex items-center justify-between w-full mb-1">
                                        <span
                                          className={`text-[9px] font-bold font-sans px-1.5 py-0.2 rounded ${
                                            itemClass.Department === '2-days'
                                              ? 'bg-amber-100 text-amber-900'
                                              : 'bg-emerald-100 text-emerald-900'
                                          }`}
                                        >
                                          {itemClass.ClassName}
                                        </span>

                                        <span className="text-[9px] font-mono text-slate-400">
                                          {item.Room}
                                        </span>
                                      </div>
                                    )}

                                    {/* Subject Arabic */}
                                    <div
                                      className={`font-serif font-black text-xs sm:text-sm leading-tight ${
                                        isHighlighted ? 'text-white' : 'text-slate-950'
                                      }`}
                                    >
                                      {sub ? sub.SubjectArabic || sub.SubjectClass : 'مادة دراسية'}
                                    </div>

                                    {/* Teacher Name */}
                                    <div
                                      className={`text-[11px] mt-0.5 font-serif ${
                                        isHighlighted ? 'text-amber-100 font-bold' : 'text-slate-600 font-medium'
                                      }`}
                                    >
                                      {teacher?.NameArabic || teacher?.Name || 'الأستاذ'}
                                    </div>

                                    {/* Mudir Delete Slot Quick Action */}
                                    {canManage && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSlot(item.ID);
                                        }}
                                        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-600 bg-white/80 rounded"
                                        title="حذف هذه الحصة"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Interactive Hover Tooltip for Teacher Details */}
      {hoveredTeacher && (
        <div
          className="fixed z-50 pointer-events-none transition-all"
          style={{
            top: Math.max(10, Math.min(hoveredTeacher.y, window.innerHeight - 270)),
            left: Math.max(10, Math.min(hoveredTeacher.x, window.innerWidth - 300)),
          }}
          dir="ltr"
        >
          <div className="w-72 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-800 flex-shrink-0 flex items-center justify-center font-bold text-white text-base">
                {hoveredTeacher.teacher.ProfilePic ? (
                  <img
                    src={hoveredTeacher.teacher.ProfilePic}
                    alt={hoveredTeacher.teacher.Name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  hoveredTeacher.teacher.Name[0]
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                  {hoveredTeacher.teacher.IsMudir ? 'Principal / Mudir' : 'Assigned Faculty'}
                </span>
                <h6 className="font-extrabold text-sm text-white truncate">
                  {hoveredTeacher.teacher.Name}
                </h6>
                {hoveredTeacher.teacher.NameArabic && (
                  <p className="text-xs text-amber-200 font-serif truncate">
                    {hoveredTeacher.teacher.NameArabic}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1 text-xs border-t border-slate-800 pt-2 text-slate-300">
              <p>
                <span className="text-slate-400 font-semibold">Subject:</span>{' '}
                {hoveredTeacher.subject.SubjectArabic || hoveredTeacher.subject.SubjectClass}
              </p>
              {hoveredTeacher.classItem && (
                <p>
                  <span className="text-slate-400 font-semibold">Class:</span>{' '}
                  {hoveredTeacher.classItem.ClassName}
                </p>
              )}
              <p>
                <span className="text-slate-400 font-semibold">Degree:</span>{' '}
                {hoveredTeacher.teacher.Degree}
              </p>
              <p>
                <span className="text-slate-400 font-semibold">Faculty ID:</span>{' '}
                {hoveredTeacher.teacher.IdNumber}
              </p>
              {hoveredTeacher.teacher.MobileNumber && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Phone className="w-3 h-3" /> {hoveredTeacher.teacher.MobileNumber}
                </p>
              )}
            </div>

            <div className="text-[10px] text-amber-400/90 italic bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              &bull; {hoveredTeacher.schedule.Day} from {hoveredTeacher.schedule.StartTime} to {hoveredTeacher.schedule.EndTime} ({hoveredTeacher.schedule.Room})
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-serif">
                    إضافة حصة دراسية جديدة
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Schedule New Class Session Slot
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
              {/* Class Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الصف الدراسي المستهدف (Target Class)
                </label>
                <select
                  value={modalForm.ClassID}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const matchedSubs = subjects.filter(s => s.ClassID === cid);
                    setModalForm(prev => ({
                      ...prev,
                      ClassID: cid,
                      SubjectID: matchedSubs[0]?.SubjectID || prev.SubjectID,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <optgroup label="القسم الصباحي (5-Days)">
                    {classes5Days.map(c => (
                      <option key={c.ClassID} value={c.ClassID}>
                        [{c.Level}] {c.ClassName}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="القسم الأسبوعي (2-Days)">
                    {classes2Days.map(c => (
                      <option key={c.ClassID} value={c.ClassID}>
                        [{c.Level}] {c.ClassName}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  المادة والمقرر (Subject)
                </label>
                <select
                  value={modalForm.SubjectID}
                  onChange={(e) => setModalForm(prev => ({ ...prev, SubjectID: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects
                    .filter(s => s.ClassID === Number(modalForm.ClassID))
                    .map(s => (
                      <option key={s.SubjectID} value={s.SubjectID}>
                        {s.SubjectArabic || s.SubjectClass} ({s.SubjectClass})
                      </option>
                    ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الأستاذ المحاضر (Teacher)
                </label>
                <select
                  value={modalForm.TeacherID}
                  onChange={(e) => setModalForm(prev => ({ ...prev, TeacherID: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {teachers.map(t => (
                    <option key={t.TeacherID} value={t.TeacherID}>
                      {t.NameArabic || t.Name} &bull; {t.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اليوم (Day)
                  </label>
                  <select
                    value={modalForm.Day}
                    onChange={(e) => setModalForm(prev => ({ ...prev, Day: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    {allSevenDaysList.map(d => (
                      <option key={d.key} value={d.key}>
                        {d.nameAr} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    القاعة / الغرفة (Room)
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.Room}
                    onChange={(e) => setModalForm(prev => ({ ...prev, Room: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                    placeholder="e.g. Hall 101"
                  />
                </div>
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    وقت البدء (Start Time)
                  </label>
                  <input
                    type="time"
                    required
                    value={modalForm.StartTime}
                    onChange={(e) => setModalForm(prev => ({ ...prev, StartTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    وقت الانتهاء (End Time)
                  </label>
                  <input
                    type="time"
                    required
                    value={modalForm.EndTime}
                    onChange={(e) => setModalForm(prev => ({ ...prev, EndTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer shadow-md"
                >
                  حفظ الحصة المجدولة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
