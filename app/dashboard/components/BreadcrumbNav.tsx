'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight, Calendar, Layers, Plus, Check, X } from 'lucide-react';
import { useAcademicTerm } from '@/lib/useAcademicTerm';
import { AuthService } from '@/lib/auth';
import { UserRole } from '@/lib/types';

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
  'time-locks': { en: 'Time Locks & Deadlines', ar: 'إدارة المهل والأقفال' },
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

interface BreadcrumbNavProps {
  canAddYear?: boolean;
}

export default function BreadcrumbNav({ canAddYear = false }: BreadcrumbNavProps) {
  const pathname = usePathname();
  const { academicYear, semester, availableYears, setAcademicYear, setSemester, addAcademicYear } =
    useAcademicTerm();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  useEffect(() => {
    const session = AuthService.getSession();
    setUserRole(session?.role || null);
  }, []);

  // Task 8: Crumbs will show on the Principal (mudir) and Admin only
  if (userRole !== 'admin' && userRole !== 'mudir') {
    return null;
  }

  // Task 4: Students, teachers, and SSG officers cannot add a school year
  const isAllowedToAddYear = Boolean(canAddYear) && (userRole === 'admin' || userRole === 'mudir');

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToAddYear) return;
    const trimmed = newYearInput.trim();
    if (!trimmed) return;
    addAcademicYear(trimmed);
    setNewYearInput('');
    setIsAddingYear(false);
  };

  const segments = pathname.split('/').filter(Boolean);
  // Remove leading 'dashboard' since Home points to /dashboard
  const subSegments = segments[0] === 'dashboard' ? segments.slice(1) : segments;

  const semesterLabelEn = semester === '1st' ? '1st Semester' : '2nd Semester';

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
          {isAddingYear && isAllowedToAddYear ? (
            <form onSubmit={handleAddYear} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-emerald-50 border border-emerald-300">
              <input
                type="text"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                placeholder="SY 2027-2028"
                autoFocus
                className="w-24 px-1.5 py-0.5 text-xs font-bold border border-emerald-400 rounded-md bg-white text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                className="p-0.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                title="Add Academic Year"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingYear(false);
                  setNewYearInput('');
                }}
                className="p-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
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
              {isAllowedToAddYear && (
                <button
                  type="button"
                  onClick={() => setIsAddingYear(true)}
                  className="ml-0.5 p-0.5 rounded bg-emerald-200/70 hover:bg-emerald-300 text-emerald-900 transition-colors cursor-pointer"
                  title="Add New Academic Year"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </li>

        <li aria-hidden="true" className="text-slate-400">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>

        {/* Direct 1st Semester & 2nd Semester Buttons in Breadcrumb (Task 3) */}
        <li>
          <div className="inline-flex items-center gap-1 bg-[#f8f5ec] p-0.5 rounded-xl border border-[#dfd4b8]">
            <button
              type="button"
              onClick={() => setSemester('1st')}
              title="Show 1st Semester data (Dawrs 1-3, grades, scores, schedules)"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                semester === '1st'
                  ? 'bg-[#126b38] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-[#dfd4b8]/60 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1st Semester</span>
              <span className="hidden md:inline font-serif opacity-90">(الفصل الأول)</span>
            </button>
            <button
              type="button"
              onClick={() => setSemester('2nd')}
              title="Show 2nd Semester data (Dawrs 4-6, grades, scores, schedules)"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                semester === '2nd'
                  ? 'bg-[#9f7a28] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-[#dfd4b8]/60 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2nd Semester</span>
              <span className="hidden md:inline font-serif opacity-90">(الفصل الثاني)</span>
            </button>
          </div>
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
