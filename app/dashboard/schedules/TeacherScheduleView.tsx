'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClassScheduleItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  SubjectTeacherItem,
} from '@/lib/types';
import { toHindiNumerals, formatTimeHindi } from '@/lib/numerals';
import {
  Clock,
  Filter,
  Calendar,
  BookOpen,
  UserCheck,
  Sparkles,
  ChevronDown,
  X,
  Check,
  Building2,
  ArrowUpRight,
  ClipboardList,
} from 'lucide-react';

interface TeacherScheduleViewProps {
  teacher: TeacherItem;
  schedules: ClassScheduleItem[];
  subjects: SubjectItem[];
  classes: ClassItem[];
  subjectTeachers?: SubjectTeacherItem[];
}

export default function TeacherScheduleView({
  teacher,
  schedules,
  subjects,
  classes,
  subjectTeachers = [],
}: TeacherScheduleViewProps) {
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Department mode: 5-days (Sun-Thu) or 2-days (Fri-Sat)
  const [deptMode, setDeptMode] = useState<'5-days' | '2-days'>('5-days');

  // Selected Subject for highlight (clicking highlights all cells with that subject)
  const [highlightedSubjectId, setHighlightedSubjectId] = useState<number | null>(null);

  // Time periods definition matching StudentScheduleView and institution layout
  const timeSlots = [
    { label: '7:00 - 8:30', start: '07:00', end: '08:30', isBreak: false },
    { label: '8:30 - 9:30', start: '08:30', end: '09:30', isBreak: false },
    { label: '9:30 - 9:40', start: '09:30', end: '09:40', isBreak: true, titleArabic: 'فسحة' },
    { label: '9:40 - 10:40', start: '09:40', end: '10:40', isBreak: false },
    { label: '10:40 - 11:30', start: '10:40', end: '11:30', isBreak: false },
    { label: '11:30 - 12:30', start: '11:30', end: '12:30', isBreak: false },
    { label: '13:00 - 14:30', start: '13:00', end: '14:30', isBreak: false, titleArabic: 'الفترة المسائية' },
  ];

  // Days columns based on department (5-Days: Sun-Thu | 2-Days: Fri-Sat)
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

  const activeDays = deptMode === '2-days' ? twoDaysList : fiveDaysList;

  // Schedules for this teacher
  const teacherSchedules = schedules.filter(s => s.TeacherID === teacher.TeacherID);

  const getSubject = (subjectId: number) => subjects.find(s => s.SubjectID === subjectId);
  const getClass = (classId: number) => classes.find(c => c.ClassID === classId);

  // Find schedule items for a specific day and time slot window
  const getSlotSchedules = (dayKey: string, slotStart: string, slotEnd: string) => {
    return teacherSchedules.filter(s => {
      if (s.Day !== dayKey) return false;
      if (s.StartTime === slotStart) return true;
      return s.StartTime >= slotStart && s.StartTime < slotEnd;
    });
  };

  const highlightedSubject = highlightedSubjectId ? getSubject(highlightedSubjectId) : null;

  // Teacher stats
  const uniqueSubjectsCount = new Set(teacherSchedules.map(s => s.SubjectID)).size;
  const uniqueClassesCount = new Set(teacherSchedules.map(s => s.ClassID)).size;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Teacher Profile & Timetable Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 shadow-md flex items-center justify-center shrink-0">
            {teacher.ProfilePic ? (
              <img
                src={teacher.ProfilePic}
                alt={teacher.Name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCheck className="w-8 h-8 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                جدول حصص الأستاذ &bull; Faculty Schedule
              </span>
              {teacher.IdNumber && (
                <span className="text-xs text-emerald-300 font-mono">
                  {teacher.IdNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>{teacher.NameArabic || teacher.Name}</span>
              <span className="text-emerald-200 text-sm font-normal">
                ({teacher.Name})
              </span>
            </h1>
            <p className="text-xs text-emerald-200/90 mt-0.5 flex items-center gap-1.5 font-serif">
              <span>الرتبة الأكاديمية:</span>
              <span className="font-bold text-amber-300">
                {teacher.Degree || 'عضو هيئة التدريس'}
              </span>
              <span>&bull;</span>
              <span>
                القسم: {deptMode === '2-days' ? 'القسم الأسبوعي (يومين: الجمعة والسبت)' : 'القسم الصباحي (٥ أيام: الأحد إلى الخميس)'}
              </span>
            </p>
          </div>
        </div>

        {/* Counter Badges with Hindi Numerals */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-emerald-300 block font-bold font-serif">الحصص الأسبوعية</span>
            <span className="text-xl font-black text-white font-mono">
              {toHindiNumerals(teacherSchedules.length)}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-amber-300 block font-bold font-serif">المواد المسندة</span>
            <span className="text-xl font-black text-white font-mono">
              {toHindiNumerals(uniqueSubjectsCount)}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-cyan-300 block font-bold font-serif">المراحل والصفوف</span>
            <span className="text-xl font-black text-white font-mono">
              {toHindiNumerals(uniqueClassesCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Schedule Container (Cream styled like StudentScheduleView #dfd4b8) */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        {/* Top Control Bar in Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-[#126b38] hover:bg-[#0e582e] active:scale-95 text-white px-5 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer font-serif"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية ونظام الجدول (Filter)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-30 text-xs text-slate-800 text-right">
                {/* Department Selection */}
                <div className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  نظام القسم الدراسي (Department)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeptMode('5-days');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                    deptMode === '5-days' ? 'font-bold text-emerald-800 bg-emerald-50/60' : ''
                  }`}
                >
                  <span>نظام ٥ أيام (الأحد إلى الخميس)</span>
                  {deptMode === '5-days' && <Check className="w-4 h-4 text-emerald-700" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeptMode('2-days');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                    deptMode === '2-days' ? 'font-bold text-emerald-800 bg-emerald-50/60' : ''
                  }`}
                >
                  <span>نظام يومين (الجمعة والسبت)</span>
                  {deptMode === '2-days' && <Check className="w-4 h-4 text-emerald-700" />}
                </button>

                <div className="my-2 border-t border-slate-100" />

                {/* Semester Selection */}
                <div className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  الفصل الدراسي (Semester)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSemester('1st');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                    selectedSemester === '1st' ? 'font-bold text-emerald-800 bg-emerald-50/60' : ''
                  }`}
                >
                  <span>الفصل الأول ({toHindiNumerals(2025)} - 1st Sem)</span>
                  {selectedSemester === '1st' && <Check className="w-4 h-4 text-emerald-700" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSemester('2nd');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-right px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                    selectedSemester === '2nd' ? 'font-bold text-emerald-800 bg-emerald-50/60' : ''
                  }`}
                >
                  <span>الفصل الثاني ({toHindiNumerals(2025)} - 2nd Sem)</span>
                  {selectedSemester === '2nd' && <Check className="w-4 h-4 text-emerald-700" />}
                </button>
              </div>
            )}
          </div>

          {/* Active Highlight Banner if a subject is clicked */}
          {highlightedSubject && (
            <div className="bg-[#9f7a28] text-white px-4 py-1.5 rounded-full shadow-xs flex items-center gap-2 text-xs font-serif font-bold animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>
                المادة المحددة: {highlightedSubject.SubjectArabic || highlightedSubject.SubjectClass}
              </span>
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

          {/* Semester Badge Capsule with Hindi Numerals */}
          <div className="bg-white border border-[#cfc39f] px-5 py-1.5 rounded-full shadow-2xs text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 font-serif">
            <span className="font-mono text-emerald-950 font-black">
              {toHindiNumerals('2025')} - {selectedSemester === '1st' ? '1st' : '2nd'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-950 font-black">
              {selectedSemester === '1st' ? 'فصل الأول' : 'فصل الثاني'}
            </span>
            {deptMode === '2-days' && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                نظام يومين
              </span>
            )}
          </div>
        </div>

        {/* Schedule Grid Table - STRICT RTL: Time Column on the FAR RIGHT */}
        <div className="overflow-x-auto rounded-2xl border border-[#c5b791] bg-[#dfd4b8]">
          <table className="w-full border-collapse text-center" dir="rtl">
            {/* Table Header Row: TIME ON THE FAR RIGHT */}
            <thead>
              <tr className="bg-[#b79e55] text-white text-xs sm:text-sm font-black border-b border-[#a48c48]">
                {/* 1. Time Column on the RIGHT */}
                <th className="py-3.5 px-3 border-l border-[#a48c48]/60 w-[15%]">
                  <div className="font-serif">الوقت</div>
                  <div className="font-sans text-[11px] font-medium opacity-90">Time</div>
                </th>

                {/* 2. Days Columns flowing from Right to Left */}
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
              {timeSlots.map((slot) => {
                const timeInHindi = formatTimeHindi(slot.label);

                if (slot.isBreak) {
                  // Dedicated Recess Break Row Across All Days
                  return (
                    <tr key={slot.label} className="bg-[#d7ccaf]">
                      {/* Time Column on the RIGHT */}
                      <td className="py-2.5 px-3 border-l border-[#c5b791] font-mono text-xs font-black text-emerald-950 bg-[#d1c4a2]">
                        {timeInHindi}
                      </td>

                      {/* Recess Span across days */}
                      <td
                        colSpan={activeDays.length}
                        className="py-2.5 px-4 text-center font-black font-serif text-sm tracking-wider text-emerald-950 bg-[#d4c9ab]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-8 h-0.5 bg-emerald-800/30 rounded"></span>
                          <span className="text-base text-[#126b38] font-black">
                            {slot.titleArabic} (فسحة / Recess Break)
                          </span>
                          <span className="w-8 h-0.5 bg-emerald-800/30 rounded"></span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.label} className="hover:bg-[#d8cdae] transition-colors">
                    {/* Time Column on the RIGHT in Hindi Numerals */}
                    <td className="py-3 px-3 border-l border-[#c5b791] font-mono text-xs sm:text-sm font-black text-slate-900 bg-[#ded3b6]">
                      {timeInHindi}
                    </td>

                    {/* Day Cells */}
                    {activeDays.map((day, dIdx) => {
                      const items = getSlotSchedules(day.key, slot.start, slot.end);

                      return (
                        <td
                          key={day.key}
                          className={`p-2 align-middle ${
                            dIdx < activeDays.length - 1 ? 'border-l border-[#c5b791]' : ''
                          }`}
                        >
                          {items.length > 0 ? (
                            <div className="space-y-1.5">
                              {items.map((item) => {
                                const sub = getSubject(item.SubjectID);
                                const cls = getClass(item.ClassID);

                                const isHighlighted =
                                  highlightedSubjectId !== null && sub?.SubjectID === highlightedSubjectId;
                                const isDimmed =
                                  highlightedSubjectId !== null && sub?.SubjectID !== highlightedSubjectId;

                                return (
                                  <button
                                    key={item.ID}
                                    type="button"
                                    onClick={() => {
                                      if (sub) {
                                        setHighlightedSubjectId(prev =>
                                          prev === sub.SubjectID ? null : sub.SubjectID
                                        );
                                      }
                                    }}
                                    className={`w-full rounded-xl p-2.5 transition-all text-center flex flex-col items-center justify-center min-h-[72px] cursor-pointer select-none space-y-1 ${
                                      isHighlighted
                                        ? 'bg-[#9f7a28] text-white border-2 border-amber-300 ring-4 ring-amber-400/50 shadow-xl scale-105 transform z-10'
                                        : isDimmed
                                        ? 'bg-white/70 opacity-40 border border-[#ccbf99] hover:opacity-90'
                                        : 'bg-white hover:bg-amber-50/80 text-slate-900 border border-[#ccbf99] shadow-xs hover:shadow-md'
                                    }`}
                                    title={`انقر لتحديد وتلوين كافة حصص مادة ${sub?.SubjectArabic || sub?.SubjectClass}`}
                                  >
                                    {/* Grade Level Tag */}
                                    <span
                                      className={`inline-block px-2 py-0.2 rounded text-[10px] font-black font-serif ${
                                        isHighlighted
                                          ? 'bg-white/20 text-amber-100'
                                          : 'bg-[#b79e55] text-slate-950'
                                      }`}
                                    >
                                      مرحلة: {cls?.Level || cls?.ClassName || 'مرحلة'}
                                    </span>

                                    {/* Subject Name Arabic */}
                                    <div
                                      className={`font-serif font-black text-sm sm:text-base leading-tight ${
                                        isHighlighted ? 'text-white' : 'text-slate-950'
                                      }`}
                                    >
                                      {sub?.SubjectArabic || sub?.SubjectClass}
                                    </div>

                                    {/* Class Name & Room */}
                                    <div
                                      className={`text-xs font-serif flex items-center justify-center gap-1.5 flex-wrap ${
                                        isHighlighted ? 'text-amber-100 font-bold' : 'text-slate-600 font-medium'
                                      }`}
                                    >
                                      <span>{cls?.ClassName}</span>
                                      {item.Room && (
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                            isHighlighted
                                              ? 'bg-black/30 text-white'
                                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                                          }`}
                                        >
                                          {item.Room}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400/70 text-xs font-serif">
                              —
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

        {/* Legend & Instructions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-700 border-t border-[#c5b791]/60 font-serif">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#126b38]"></span>
            <span>
              نصيحة للأستاذ: انقر على أي مادة دراسية داخل الجدول لتلوين وتحديد كافة الحصص التابعة لنفس المادة في الأسبوع.
            </span>
          </div>
          <div className="font-mono text-slate-600 font-bold" dir="ltr">
            JMAA &bull; {toHindiNumerals('2025-2026')}
          </div>
        </div>
      </div>
    </div>
  );
}
