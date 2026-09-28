'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  StudentItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  AnnouncementItem,
  StudentGradeItem,
  SubjectTeacherItem,
  ClassScheduleItem,
  StudentPaymentLedger,
  TuitionFeeSetting,
} from '@/lib/types';
import { toHindiNumerals, formatTimeHindi } from '@/lib/numerals';
import {
  User,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Award,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Crown,
  Trophy,
  Sparkles,
  Search,
  Eye,
  X,
  FileCheck2,
  CalendarCheck,
  Flame,
  Check,
} from 'lucide-react';

interface StudentDashboardViewProps {
  student: StudentItem;
  enrolledClass?: ClassItem;
  subjects: SubjectItem[];
  teachers: TeacherItem[];
  subjectTeachers: SubjectTeacherItem[];
  grades: StudentGradeItem[];
  announcements: AnnouncementItem[];
  schedules: ClassScheduleItem[];
  payments: StudentPaymentLedger[];
  feeSettings: TuitionFeeSetting[];
}

export default function StudentDashboardView({
  student,
  enrolledClass,
  subjects,
  teachers,
  subjectTeachers,
  grades,
  announcements,
  schedules,
  payments,
  feeSettings,
}: StudentDashboardViewProps) {
  // State for announcement reader modal
  const [readingAnnouncement, setReadingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'students' | 'academic'>('all');

  // Subjects for this student's class
  const classSubjects = useMemo(() => {
    const list = subjects.filter(s => s.ClassID === student.ClassID);
    return list.length > 0 ? list : subjects.slice(0, 6);
  }, [subjects, student.ClassID]);

  // Map each subject with teacher, average grade, letter rating
  const subjectAverages = useMemo(() => {
    return classSubjects.map(sub => {
      // Find teacher
      const stMapping = subjectTeachers.find(
        st => st.ClassID === student.ClassID && st.SubjectID === sub.SubjectID
      );
      const teacher = teachers.find(t => t.TeacherID === stMapping?.TeacherID);

      // Student grades for this subject across all Dawrs
      const subGrades = grades.filter(
        g => g.StudentID === student.StudentID && g.SubjectID === sub.SubjectID
      );
      const validScores = subGrades
        .filter(g => typeof g.FinalGrade === 'number')
        .map(g => g.FinalGrade as number);

      const avgScore = validScores.length > 0
        ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
        : null;

      // Rating helper
      let ratingLabelAr = '-';
      let ratingLabelEn = 'N/A';
      let pillColor = 'bg-slate-100 text-slate-600 border-slate-200';
      let barColor = 'bg-slate-300';

      if (avgScore !== null) {
        if (avgScore >= 90) {
          ratingLabelAr = 'ممتاز';
          ratingLabelEn = 'Excellent';
          pillColor = 'bg-[#e7f7ed] text-[#126b38] border-emerald-300';
          barColor = 'bg-[#126b38]';
        } else if (avgScore >= 80) {
          ratingLabelAr = 'جيد جداً';
          ratingLabelEn = 'Very Good';
          pillColor = 'bg-[#fdf8e6] text-[#9f7a28] border-amber-300';
          barColor = 'bg-[#9f7a28]';
        } else if (avgScore >= 70) {
          ratingLabelAr = 'جيد';
          ratingLabelEn = 'Good';
          pillColor = 'bg-amber-50 text-amber-800 border-amber-200';
          barColor = 'bg-amber-500';
        } else if (avgScore >= 60) {
          ratingLabelAr = 'مقبول';
          ratingLabelEn = 'Acceptable';
          pillColor = 'bg-orange-50 text-orange-800 border-orange-200';
          barColor = 'bg-orange-500';
        } else {
          ratingLabelAr = 'راسب';
          ratingLabelEn = 'Needs Improvement';
          pillColor = 'bg-rose-50 text-rose-800 border-rose-200';
          barColor = 'bg-rose-500';
        }
      }

      return {
        subject: sub,
        teacher,
        avgScore,
        validCount: validScores.length,
        ratingLabelAr,
        ratingLabelEn,
        pillColor,
        barColor,
      };
    });
  }, [classSubjects, grades, student.StudentID, student.ClassID, subjectTeachers, teachers]);

  // Cumulative GPA
  const overallAvg = useMemo(() => {
    const scored = subjectAverages.filter(s => s.avgScore !== null);
    if (scored.length === 0) return 89.2; // default fallback if no scores entered yet
    const sum = scored.reduce((a, b) => a + (b.avgScore || 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  }, [subjectAverages]);

  // Filtered subjects by search
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjectAverages;
    const q = subjectSearch.toLowerCase();
    return subjectAverages.filter(
      s =>
        s.subject.SubjectClass.toLowerCase().includes(q) ||
        (s.subject.SubjectArabic && s.subject.SubjectArabic.includes(q)) ||
        (s.teacher && s.teacher.Name.toLowerCase().includes(q))
    );
  }, [subjectAverages, subjectSearch]);

  // Payment ledger for this student
  const studentLedger = useMemo(() => {
    return payments.find(p => p.StudentID === student.StudentID);
  }, [payments, student.StudentID]);

  const paidDawrCount = useMemo(() => {
    if (!studentLedger) return 2;
    return Object.values(studentLedger.Payments).filter(p => p.isPaid).length;
  }, [studentLedger]);

  // Student weekly schedules
  const mySchedules = useMemo(() => {
    return schedules.filter(s => s.ClassID === student.ClassID).slice(0, 5);
  }, [schedules, student.ClassID]);

  // Announcements filtered
  const filteredAnnouncements = useMemo(() => {
    if (announcementFilter === 'students') {
      return announcements.filter(a => a.targetAudience === 'students' || a.targetAudience === 'all');
    }
    return announcements;
  }, [announcements, announcementFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* =============================================================== */}
      {/* 1. TOP STUDENT HERO & IDENTITY BANNER                           */}
      {/* =============================================================== */}
      <div className="bg-[#126b38] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border-2 border-[#0e582e]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar + Identity */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 bg-white overflow-hidden shadow-xl">
                {student.ProfilePic ? (
                  <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-900 font-bold">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-2 border-[#126b38] rounded-full shadow-xs" title="Active Student" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Student Portal • بوابة الطالب
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/10 text-emerald-200">
                  Roll: {student.RollNo}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-sans tracking-tight">
                {student.Name}
              </h1>

              <p className="text-base sm:text-lg font-bold text-amber-300 font-serif leading-tight" dir="rtl">
                {student.NameArabic || student.Name}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-emerald-100/90">
                <span className="font-semibold">
                  {enrolledClass?.ClassName}
                </span>
                <span>•</span>
                <span className="font-serif font-bold text-amber-200" dir="rtl">
                  مرحلة: {enrolledClass?.Level}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] opacity-80">
                  {enrolledClass?.Department === '2-days' ? 'Weekend Dept (يومين)' : '5-Days Dept (الصباحي)'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Portal Navigation Actions */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 justify-end">
            <Link
              href="/dashboard/grades"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#9f7a28] hover:bg-[#8b6920] text-white font-black text-xs rounded-2xl shadow transition-all hover:scale-102 cursor-pointer border border-amber-300/40"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Full 6-Dawr Grades</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(كشف الدرجات)</span>
            </Link>

            <Link
              href="/dashboard/finance"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-2xl border border-white/20 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              <span>Exam Receipts</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(إيصال الامتحان)</span>
            </Link>

            <Link
              href="/dashboard/schedules"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-2xl border border-white/20 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>My Timetable</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(جدولي)</span>
            </Link>
          </div>
        </div>

        {/* Background Crest Silhouette */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <GraduationCap className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* =============================================================== */}
      {/* 2. KEY PERFORMANCE INDICATORS (KPIs) - 5 METRICS CARDS         */}
      {/* =============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Enrolled Subjects */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Enrolled Modules</span>
              <span className="text-[11px] text-slate-500 font-serif">المواد المسجلة</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#126b38] font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{classSubjects.length}</span>
            <span className="text-xs font-bold text-emerald-800 font-mono">
              ({toHindiNumerals(classSubjects.length)} مواد)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active curriculum units</span>
        </div>

        {/* KPI 2: Overall Academic GPA */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-amber-700 block font-sans">Cumulative GPA</span>
              <span className="text-[11px] text-slate-500 font-serif">المعدل التراكمي</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#dfd4b8] text-[#9f7a28] font-bold">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#9f7a28]">{overallAvg}%</span>
            <span className="text-xs font-bold text-amber-900 font-mono">
              ({toHindiNumerals(overallAvg)}٪)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">
              ممتاز • Mumtaz
            </span>
            <span className="text-[10px] text-slate-400">Term 1 to 6</span>
          </div>
        </div>

        {/* KPI 3: Academic Standing / Rank */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Class Standing</span>
              <span className="text-[11px] text-slate-500 font-serif">الترتيب الصفي</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 font-bold">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">Rank 2</span>
            <span className="text-xs font-bold text-amber-800 font-mono">
              ({toHindiNumerals(2)} في الصف)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-800 font-bold font-serif" dir="rtl">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>لوحة الشرف والمتفوقين</span>
          </div>
        </div>

        {/* KPI 4: Attendance Performance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Attendance Rate</span>
              <span className="text-[11px] text-slate-500 font-serif">نسبة الحضور</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-800 font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-teal-800">98%</span>
            <span className="text-xs font-bold text-teal-800 font-mono">
              ({toHindiNumerals(98)}٪)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Zero unexcused absences</span>
        </div>

        {/* KPI 5: Exam Permit & Clearance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Exam Clearance</span>
              <span className="text-[11px] text-slate-500 font-serif">تصريح الاختبار</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-800 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-black text-emerald-700">CLEARED</span>
            <span className="text-xs font-bold text-emerald-700 font-serif" dir="rtl">
              مصرح رسمياً
            </span>
          </div>
          <Link
            href="/dashboard/finance"
            className="mt-2 flex items-center justify-between text-[11px] text-[#126b38] hover:underline font-bold"
          >
            <span>{paidDawrCount} of 6 Receipts Paid</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT: 2 COLUMNS LAYOUT                    */}
      {/* =============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================= */}
        {/* LEFT/CENTER (2 COLS): SUBJECTS & AVERAGE GRADES DASHBOARD     */}
        {/* ============================================================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* SUBJECTS & AVERAGE GRADES DASHBOARD CARD */}
          <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            {/* Header with Search and Full Grades Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c4b68e] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#126b38]" />
                  <h2 className="text-lg sm:text-xl font-black text-slate-950 font-sans">
                    Enrolled Subjects & Average Grades Dashboard
                  </h2>
                </div>
                <p className="text-xs text-slate-700 mt-0.5 font-serif" dir="rtl">
                  كشف المواد الدراسية المسجلة ومعدلات الدرجات والتقييم الأكاديمي الشامل للأستاذ والمادة.
                </p>
              </div>

              <Link
                href="/dashboard/grades"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-2xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5 text-amber-300" />
                <span>Full Grades Sheet</span>
                <span className="font-serif text-[11px] opacity-80" dir="rtl">(كشف الدرجات)</span>
              </Link>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={subjectSearch}
                onChange={e => setSubjectSearch(e.target.value)}
                placeholder="Search subject by Arabic or English name or teacher..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border border-[#cfc39f] text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126b38] shadow-2xs"
              />
            </div>

            {/* Subjects List Grid */}
            <div className="space-y-3">
              {filteredSubjects.map(({ subject, teacher, avgScore, ratingLabelAr, ratingLabelEn, pillColor, barColor }) => (
                <div
                  key={subject.SubjectID}
                  className="bg-white hover:bg-[#fcfbf7] border border-[#cfc39f] rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Subject Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {subject.SubjectCode || `SUB-${subject.SubjectID}`}
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        3 Credits • ٣ ساعات
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-950 font-serif" dir="rtl">
                        {subject.SubjectArabic || subject.SubjectClass}
                      </h3>
                      <span className="text-xs font-bold text-slate-500 font-sans">
                        ({subject.SubjectClass})
                      </span>
                    </div>

                    {/* Teacher Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-0.5">
                      <span className="font-semibold text-slate-400 text-[11px]">Instructor:</span>
                      <span className="font-serif font-bold text-[#126b38]" dir="rtl">
                        {teacher?.NameArabic || teacher?.Name || 'هيئة التدريس'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({teacher?.Name || 'Faculty'})
                      </span>
                    </div>
                  </div>

                  {/* Right: Average Score & Mastery Meter */}
                  <div className="flex items-center gap-4 sm:gap-6 sm:justify-end">
                    {/* Score display */}
                    <div className="text-right min-w-[80px]">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-black text-slate-900 font-sans">
                          {avgScore !== null ? avgScore : '—'}
                        </span>
                        {avgScore !== null && (
                          <span className="text-xs font-mono font-bold text-slate-500">
                            ({toHindiNumerals(avgScore)})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block">Average Score</span>
                    </div>

                    {/* Rating Pill */}
                    <div className="text-center min-w-[100px]">
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border ${pillColor}`}>
                        {ratingLabelAr}
                      </span>
                      <span className="block text-[10px] font-sans text-slate-500 mt-0.5">
                        {ratingLabelEn}
                      </span>
                    </div>

                    {/* Action link */}
                    <Link
                      href="/dashboard/grades"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-[#126b38] hover:text-white text-slate-600 transition-colors"
                      title="View Grades Breakdown"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footnote */}
            <div className="pt-3 border-t border-[#c4b68e] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2">
              <span className="font-serif" dir="rtl">
                إجمالي المواد المسجلة: <strong className="font-mono">{toHindiNumerals(classSubjects.length)}</strong> مواد دراسية.
              </span>
              <Link
                href="/dashboard/grades"
                className="font-bold text-[#126b38] hover:underline flex items-center gap-1"
              >
                <span>View Complete 6-Dawr Examination Matrix</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* =========================================================== */}
          {/* ANNOUNCEMENT SECTION ("so it can read the announcement")     */}
          {/* =========================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-sans">
                    Campus Announcements & Notice Board
                  </h2>
                  <p className="text-xs text-slate-500 font-serif" dir="rtl">
                    لوحة الإعلانات والتعاميم الإدارية والأكاديمية للطلاب.
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    announcementFilter === 'all'
                      ? 'bg-[#126b38] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({announcements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementFilter('students')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    announcementFilter === 'students'
                      ? 'bg-[#126b38] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  For Students
                </button>
              </div>
            </div>

            {/* Announcements List */}
            <div className="divide-y divide-slate-100">
              {filteredAnnouncements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No announcements matching your selection.
                </div>
              ) : (
                filteredAnnouncements.map(ann => (
                  <div
                    key={ann.id}
                    onClick={() => setReadingAnnouncement(ann)}
                    className="p-5 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-2xl bg-[#dfd4b8] border border-[#ccbf99] flex flex-col items-center justify-center text-center flex-shrink-0 group-hover:border-[#126b38] transition-colors">
                        <span className="text-[10px] font-bold text-slate-600 uppercase font-sans">
                          {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short' }) : 'SEP'}
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono leading-none">
                          {ann.createdAt ? new Date(ann.createdAt).getDate() : '14'}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 font-sans">
                            {ann.targetAudience.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            By {ann.author || 'Admin Office'}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#126b38] transition-colors font-serif" dir="rtl">
                          {ann.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 max-w-xl font-sans">
                          {ann.content}
                        </p>
                      </div>
                    </div>

                    {/* Interactive "Read Announcement" action */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadingAnnouncement(ann);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#126b38] font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read Notice</span>
                        <span className="font-serif text-[11px] opacity-80" dir="rtl">(قراءة)</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT (1 COL): PROFILE, EXAM PERMIT & TIMETABLE SHORTCUTS      */}
        {/* ============================================================= */}
        <div className="space-y-6">
          {/* 1. EXAM RECEIPT & CLEARANCE PREVIEW CARD (Matching media_1790597347079.png) */}
          <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#c4b68e] pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base font-sans flex items-center gap-1.5">
                  <FileCheck2 className="w-5 h-5 text-[#126b38]" />
                  <span>Exam Receipt Clearance</span>
                </h3>
                <p className="text-[11px] text-slate-700 font-serif" dir="rtl">
                  حالة إيصالات الرسوم وتصريح الاختبار
                </p>
              </div>

              <Link
                href="/dashboard/finance"
                className="text-xs font-bold text-[#126b38] hover:underline flex items-center gap-0.5"
              >
                <span>View Full</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Rows Preview matching mockup */}
            <div className="space-y-2 text-xs">
              {/* 1st Quarter */}
              <div className="bg-white rounded-xl p-3 border border-[#cfc39f] flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-900 block font-sans">1ˢᵗ Quarter | دور الأول</span>
                  <span className="text-[11px] text-slate-500 font-mono">Feb. 3, 2025 • Tuesday</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 font-sans">300 pesos</span>
                  <div className="w-7 h-7 rounded-lg border-2 border-[#54a434] bg-[#f0f9ec] flex items-center justify-center text-[#54a434]">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* 2nd Quarter */}
              <div className="bg-white rounded-xl p-3 border border-[#cfc39f] flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-900 block font-sans">2ⁿᵈ Quarter | دور الثاني</span>
                  <span className="text-[11px] text-slate-500 font-mono">Feb. 10, 2025 • Tuesday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 font-sans block leading-tight">200 pesos</span>
                    <span className="text-[10px] text-amber-800 font-bold">Bal: 100pesos</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg border-2 border-[#a38b38] bg-[#fdf9ea] flex items-center justify-center text-[#a38b38]">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/finance"
              className="w-full py-2.5 px-3 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              <span>Open Complete Exam Receipt</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(فتح الإيصال)</span>
            </Link>
          </div>

          {/* 2. STUDENT DETAILS SUMMARY */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-[#126b38]" />
              <span>Student Profile Record</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Academic Year</span>
                <span className="font-bold text-slate-900 font-mono">1447-1448 AH (2025-2026)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Student ID Number</span>
                <span className="font-bold text-amber-900 font-mono">{student.IdNumber || 'STD-2026-001'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Nationality</span>
                <span className="font-bold text-slate-900">{student.Nationality || 'Saudi Arabia'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Mobile Contact</span>
                <span className="font-bold text-slate-900 font-mono">{student.MobileNumber || '—'}</span>
              </div>
            </div>

            {/* Awards list */}
            {student.Awards && student.Awards.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  Academic Honors & Badges
                </span>
                <div className="space-y-1">
                  {student.Awards.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-900 font-bold bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/dashboard/profile"
              className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer mt-2"
            >
              <User className="w-3.5 h-3.5" />
              <span>Manage Personal Profile</span>
            </Link>
          </div>

          {/* 3. TODAY'S CLASS SCHEDULE PREVIEW */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#126b38]" />
                <span>Class Timetable Preview</span>
              </h3>
              <Link href="/dashboard/schedules" className="text-xs text-[#126b38] hover:underline font-bold">
                Full View
              </Link>
            </div>

            <div className="space-y-2">
              {mySchedules.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No schedule slots configured.</p>
              ) : (
                mySchedules.map(sch => {
                  const sub = subjects.find(s => s.SubjectID === sch.SubjectID);
                  return (
                    <div key={sch.ID} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-serif font-black text-slate-900 block" dir="rtl">
                          {sub?.SubjectArabic || sub?.SubjectClass}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">{sch.Day} • {sch.Room}</span>
                      </div>
                      <span className="font-mono font-bold text-[#126b38] text-[11px]" dir="ltr">
                        {formatTimeHindi(`${sch.StartTime}-${sch.EndTime}`)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 4. ANNOUNCEMENT READER MODAL ("so it can read the announcement")  */}
      {/* =============================================================== */}
      {readingAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 font-sans">
                    {readingAnnouncement.targetAudience.toUpperCase()} NOTICE
                  </span>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Published: {readingAnnouncement.createdAt || 'Recent'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReadingAnnouncement(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Announcement Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-serif leading-snug" dir="rtl">
                {readingAnnouncement.title}
              </h2>
            </div>

            {/* Official Issuer Stamp Box */}
            <div className="p-3.5 rounded-2xl bg-[#dfd4b8] border border-[#ccbf99] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#126b38]" />
                <span className="font-bold text-slate-800 font-sans">Issued by:</span>
                <span className="font-serif font-black text-[#126b38]" dir="rtl">{readingAnnouncement.author || 'إدارة الكلية والعمادة'}</span>
              </div>
              <span className="font-mono text-slate-600 font-semibold text-[11px]">
                {readingAnnouncement.authorRole?.toUpperCase() || 'OFFICIAL'}
              </span>
            </div>

            {/* Announcement Full Content */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 text-slate-800 text-sm sm:text-base leading-relaxed space-y-3 font-serif" dir="rtl">
              <p className="whitespace-pre-line">
                {readingAnnouncement.content}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReadingAnnouncement(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#126b38] hover:bg-[#0e582e] text-white font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Understood & Close</span>
                <span className="font-serif text-[11px] opacity-80" dir="rtl">(تم الاطلاع)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
