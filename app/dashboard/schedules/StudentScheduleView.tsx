'use client';

import React, { useState } from 'react';
import {
  ClassScheduleItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  StudentItem,
} from '@/lib/types';
import {
  Clock,
  Filter,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface StudentScheduleViewProps {
  student: StudentItem;
  enrolledClass?: ClassItem;
  schedules: ClassScheduleItem[];
  subjects: SubjectItem[];
  teachers: TeacherItem[];
}

export default function StudentScheduleView({
  student,
  enrolledClass,
  schedules,
  subjects,
  teachers,
}: StudentScheduleViewProps) {
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Time periods definition matching the mockup
  const timeSlots = [
    { label: '7:00-8:30', start: '07:00', end: '08:30', isBreak: false },
    { label: '8:30-9:30', start: '08:30', end: '09:30', isBreak: false },
    { label: '9:30-9:40', start: '09:30', end: '09:40', isBreak: true, titleArabic: 'فسحة' },
    { label: '9:40-10:40', start: '09:40', end: '10:40', isBreak: false },
    { label: '10:40-11:30', start: '10:40', end: '11:30', isBreak: false },
    { label: '11:30-12:30', start: '11:30', end: '12:30', isBreak: false },
  ];

  // Days columns from Sunday to Thursday matching the mockup
  const weekDays = [
    { key: 'Sunday', nameEn: 'Sun', nameAr: 'الأحد' },
    { key: 'Monday', nameEn: 'Mon', nameAr: 'الاثنين' },
    { key: 'Tuesday', nameEn: 'Tue', nameAr: 'الثلاثاء' },
    { key: 'Wednesday', nameEn: 'Wed', nameAr: 'الأربعاء' },
    { key: 'Thursday', nameEn: 'Thur', nameAr: 'الخميس' },
  ];

  // Only get schedules for the student's enrolled class
  const studentSchedules = schedules.filter(
    s => s.ClassID === student.ClassID
  );

  const getSubject = (subjectId: number) => subjects.find(s => s.SubjectID === subjectId);
  const getTeacher = (teacherId: number) => teachers.find(t => t.TeacherID === teacherId);

  // Find schedule for a specific day and time slot
  const getSlotSchedule = (dayKey: string, startTime: string) => {
    return studentSchedules.find(
      s => s.Day === dayKey && s.StartTime === startTime
    );
  };

  return (
    <div className="space-y-6">
      {/* Student Enrolled Class Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 shadow-md flex items-center justify-center flex-shrink-0">
            {student.ProfilePic ? (
              <img
                src={student.ProfilePic}
                alt={student.Name}
                className="w-full h-full object-cover"
              />
            ) : (
              <GraduationCap className="w-8 h-8 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                جدول حصص الطالب &bull; Student Schedule
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                {student.RollNo}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>{student.NameArabic || student.Name}</span>
              <span className="text-emerald-200 text-sm font-normal">
                ({student.Name})
              </span>
            </h1>
            <p className="text-xs text-emerald-200/90 mt-0.5 flex items-center gap-1.5" dir="rtl">
              <span>الصف والمرحلة:</span>
              <span className="font-bold text-amber-300">
                {enrolledClass?.ClassName || 'الصف الدراسي'}
              </span>
              <span>&bull;</span>
              <span>القسم: {enrolledClass?.Department || 'القسم الصباحي (5-Days)'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-emerald-300 block font-bold">الحصص الأسبوعية</span>
            <span className="text-xl font-black text-white font-mono">{studentSchedules.length}</span>
          </div>
          <div className="bg-slate-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2 text-center">
            <span className="text-[11px] text-amber-300 block font-bold">المواد المسجلة</span>
            <span className="text-xl font-black text-white font-mono">
              {new Set(studentSchedules.map(s => s.SubjectID)).size}
            </span>
          </div>
        </div>
      </div>

      {/* Main Schedule Container (Styled exactly like mockup #dfd4b8) */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        {/* Top Control Bar in Card */}
        <div className="flex items-center justify-between gap-3">
          {/* Filter Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-[#126b38] hover:bg-[#0e582e] active:scale-95 text-white px-5 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-20 text-xs text-slate-800">
                <div className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  اختيار الفصل الدراسي (Semester)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSemester('1st');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                    selectedSemester === '1st' ? 'font-bold text-emerald-800 bg-emerald-50/60' : ''
                  }`}
                >
                  <span>2025 - 1st Semester (الفصل الأول)</span>
                  {selectedSemester === '1st' && <span className="text-emerald-700 font-bold">&check;</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSemester('2nd');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                    selectedSemester === '2nd' ? 'font-bold text-emerald-800 bg-emerald-50/60' : ''
                  }`}
                >
                  <span>2025 - 2nd Semester (الفصل الثاني)</span>
                  {selectedSemester === '2nd' && <span className="text-emerald-700 font-bold">&check;</span>}
                </button>
              </div>
            )}
          </div>

          {/* Semester Badge Capsule */}
          <div className="bg-white border border-[#cfc39f] px-5 py-1.5 rounded-full shadow-2xs text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="font-mono">2025-{selectedSemester === '1st' ? '1st' : '2nd'} Semester</span>
            <span className="text-slate-300">|</span>
            <span className="font-serif text-emerald-950 font-extrabold">
              {selectedSemester === '1st' ? 'فصل الأول' : 'فصل الثاني'}
            </span>
          </div>
        </div>

        {/* Schedule Grid Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#c5b791] bg-[#dfd4b8]">
          <table className="w-full border-collapse text-center">
            {/* Table Header Row (Gold / Khaki Header #b79e55) */}
            <thead>
              <tr className="bg-[#b79e55] text-white text-xs sm:text-sm font-black border-b border-[#a48c48]">
                <th className="py-3.5 px-3 border-r border-[#a48c48]/60 w-[14%]">
                  <div className="font-serif">الوقت</div>
                  <div className="font-sans text-[11px] font-medium opacity-90">Time</div>
                </th>
                {weekDays.map((day, idx) => (
                  <th
                    key={day.key}
                    className={`py-3.5 px-3 w-[17.2%] ${
                      idx < weekDays.length - 1 ? 'border-r border-[#a48c48]/60' : ''
                    }`}
                  >
                    <div className="font-serif text-sm">{day.nameAr}</div>
                    <div className="font-sans text-[11px] font-medium opacity-90">{day.nameEn}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#c9bc97]">
              {timeSlots.map((slot, sIdx) => {
                if (slot.isBreak) {
                  // Dedicated Break / Recess Row Across All Columns
                  return (
                    <tr key={slot.label} className="bg-[#d7ccaf]">
                      {/* Time Column */}
                      <td className="py-2 px-3 border-r border-[#c5b791] font-mono text-xs font-bold text-emerald-950">
                        {slot.label}
                      </td>
                      {/* Recess Cell Spanning all 5 week days */}
                      <td
                        colSpan={5}
                        className="py-2 px-4 text-center font-black font-serif text-sm tracking-wider text-emerald-900 bg-[#d4c9ab]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-8 h-0.5 bg-emerald-800/30 rounded"></span>
                          <span className="text-base text-[#126b38] font-black">{slot.titleArabic} (فسحة / Recess Break)</span>
                          <span className="w-8 h-0.5 bg-emerald-800/30 rounded"></span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.label} className="hover:bg-[#d8cdae] transition-colors">
                    {/* Time Column */}
                    <td className="py-3 px-3 border-r border-[#c5b791] font-mono text-xs sm:text-sm font-bold text-slate-800 bg-[#ded3b6]">
                      {slot.label}
                    </td>

                    {/* Day Columns */}
                    {weekDays.map((day, dIdx) => {
                      const item = getSlotSchedule(day.key, slot.start);
                      const sub = item ? getSubject(item.SubjectID) : null;
                      const teacher = item ? getTeacher(item.TeacherID) : null;

                      return (
                        <td
                          key={day.key}
                          className={`p-2 align-middle ${
                            dIdx < weekDays.length - 1 ? 'border-r border-[#c5b791]' : ''
                          }`}
                        >
                          {item && sub ? (
                            <div className="bg-white rounded-xl p-2.5 shadow-xs border border-[#ccbf99] hover:shadow-md transition-shadow flex flex-col items-center justify-center min-h-[64px]">
                              {/* Subject Name Arabic */}
                              <div className="font-serif font-black text-sm sm:text-base text-slate-900 leading-tight">
                                {sub.SubjectArabic || sub.SubjectClass}
                              </div>

                              {/* Teacher Name */}
                              <div className="text-xs font-medium text-slate-600 mt-1">
                                {teacher?.NameArabic || teacher?.Name || 'المدرس'}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400/70 text-xs">
                              -
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

        {/* Legend / Info Bar at bottom of card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-700 border-t border-[#c5b791]/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#126b38]"></span>
            <span>ملاحظة: هذا الجدول مخصص ومقيد بمواد الطالب المسجلة فقط لهذا الفصل.</span>
          </div>
          <div className="font-mono text-slate-600">
            جامعة منيب الكزبري الإسلامية &bull; JMAA
          </div>
        </div>
      </div>
    </div>
  );
}
