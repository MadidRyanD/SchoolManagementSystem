'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight, Calendar, Layers } from 'lucide-react';
import { useAcademicTerm } from '@/lib/useAcademicTerm';

const ROUTE_LABELS: Record<string, { en: string; ar: string }> = {
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  enrollment: { en: 'Academic Year Enrollment', ar: 'التسجيل والترفيع السنوي' },
  students: { en: 'Student Directory', ar: 'سجل الطلاب' },
  attendance: { en: 'Attendance', ar: 'الحضور والدوام' },
  teachers: { en: 'Faculty & Teachers', ar: 'الكادر التعليمي' },
  assignments: { en: 'Subject Allocations', ar: 'توزيع المواد' },
  classes: { en: 'Classes & Departments', ar: 'الأقسام والصفوف' },
  advisee: { en: 'Class Advisee', ar: 'الفصل المشرف عليه' },
  subjects: { en: 'Subjects', ar: 'المواد الدراسية' },
  schedules: { en: 'Class Schedules', ar: 'جدول الحصص' },
  grades: { en: 'Grades Matrix', ar: 'سجل الدرجات' },
  finance: { en: 'Finance & Tuition', ar: 'المالية والرسوم' },
  fees: { en: 'Tuition Fees', ar: 'هيكل الرسوم' },
  examinations: { en: 'Examinations', ar: 'الاختبارات' },
  expenses: { en: 'Expenses', ar: 'المصروفات' },
  honors: { en: 'Honor Roll', ar: 'لوحة الشرف' },
  announcements: { en: 'Announcements', ar: 'الإعلانات' },
  forms: { en: 'Form Templates', ar: 'النماذج والتقارير' },
  accounts: { en: 'User Accounts', ar: 'الحسابات والصلاحيات' },
  profile: { en: 'My Profile', ar: 'الملف الشخصي' },
};

export default function BreadcrumbNav() {
  const pathname = usePathname();
  const { academicYear, semester, availableYears, setAcademicYear, setSemester } = useAcademicTerm();

  const segments = pathname.split('/').filter(Boolean);
  // Remove leading 'dashboard' since Home points to /dashboard
  const subSegments = segments[0] === 'dashboard' ? segments.slice(1) : segments;

  const semesterLabelEn = semester === '1st' ? '1st Semester' : '2nd Semester';
  const semesterLabelAr = semester === '1st' ? 'الفصل الأول' : 'الفصل الثاني';

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 bg-white/90 backdrop-blur-xs border border-[#dfd4b8] rounded-2xl px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2"
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {/* Home */}
        <li>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#f3efe6] hover:bg-[#dfd4b8] text-[#126b38] font-extrabold transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
            <span className="hidden sm:inline font-serif opacity-75">(الرئيسية)</span>
          </Link>
        </li>

        <li aria-hidden="true" className="text-slate-400">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>

        {/* Active Academic Year in Breadcrumb */}
        <li>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <select
              aria-label="Breadcrumb Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent font-extrabold text-emerald-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </li>

        <li aria-hidden="true" className="text-slate-400">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>

        {/* Active Semester in Breadcrumb (click to toggle) */}
        <li>
          <button
            type="button"
            onClick={() => setSemester(semester === '1st' ? '2nd' : '1st')}
            title="Click to switch Semester"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-extrabold transition-colors cursor-pointer ${
              semester === '1st'
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{semesterLabelEn}</span>
            <span className="hidden md:inline font-serif opacity-80">({semesterLabelAr})</span>
          </button>
        </li>

        {/* Current Page Segments */}
        {subSegments.map((seg, idx) => {
          const href = '/dashboard/' + subSegments.slice(0, idx + 1).join('/');
          const isLast = idx === subSegments.length - 1;
          const label = ROUTE_LABELS[seg] || {
            en: seg.charAt(0).toUpperCase() + seg.slice(1),
            ar: '',
          };

          return (
            <React.Fragment key={href}>
              <li aria-hidden="true" className="text-slate-400">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li>
                {isLast ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#126b38] text-white font-extrabold shadow-2xs">
                    <span>{label.en}</span>
                    {label.ar && (
                      <span className="hidden sm:inline font-serif opacity-85">({label.ar})</span>
                    )}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                  >
                    <span>{label.en}</span>
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
        <span>Active Term:</span>
        <span className="font-mono font-bold text-slate-800">
          {academicYear} &bull; {semesterLabelEn}
        </span>
      </div>
    </nav>
  );
}
