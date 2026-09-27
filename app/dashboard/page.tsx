'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  UserSession,
  ClassScheduleItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
} from '@/lib/types';
import {
  School,
  Building2,
  Calendar,
  ClipboardList,
  Wallet,
  Users,
  GraduationCap,
  Award,
  ArrowUpRight,
  Megaphone,
  CheckCircle2,
  Crown,
  BookOpen,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState({
    totalClasses5Days: 0,
    totalClasses2Days: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAnnouncements: 0,
  });

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);

  useEffect(() => {
    const session = AuthService.getSession();
    setCurrentUser(session);

    const cls = DataStore.getClasses();
    const tchs = DataStore.getTeachers();
    const stds = DataStore.getStudents();
    const ann = DataStore.getAnnouncements();
    const subs = DataStore.getSubjects();
    const schs = DataStore.getSchedules();

    setClasses(cls);
    setSubjects(subs);
    setSchedules(schs);

    setStats({
      totalClasses5Days: cls.filter(c => c.Department === '5-days').length,
      totalClasses2Days: cls.filter(c => c.Department === '2-days').length,
      totalTeachers: tchs.length,
      totalStudents: stds.length,
      totalAnnouncements: ann.length,
    });
  }, []);

  const role = currentUser?.role || 'admin';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/60">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
              Academic Session 1447 - 1448 AH (2026 - 2027)
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 text-xs font-mono font-bold rounded-full">
              JMAA-MoritAko
            </span>
          </div>

          <h2 className="text-2xl font-bold text-amber-300 font-serif mb-1" dir="rtl">
            جامعة منيب الكزبري العربية
          </h2>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Jamiatu Monib Alkuzbary Al-Arabia
          </h1>
          <p className="mt-2 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Welcome, <span className="font-bold text-white">{currentUser?.name}</span> ({currentUser?.role.toUpperCase()} Portal).
            Access schedules, academic evaluation across 6 Dawr terms, and institutional administration.
          </p>

          {/* Quick role actions */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/classes"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Explore Departments</span>
            </Link>

            <Link
              href="/dashboard/schedules"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/40 shadow transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Timetable & Schedules</span>
            </Link>

            <Link
              href="/dashboard/grades"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/40 shadow transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>6-Dawr Grades Matrix</span>
            </Link>

            <Link
              href="/dashboard/honors"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/40 shadow transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-yellow-400" />
              <span>Honor Roll</span>
            </Link>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <School className="w-96 h-96" />
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 5-Days Dept Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">5-Days Department</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalClasses5Days}</span>
            <Link href="/dashboard/classes" className="text-xs text-emerald-800 hover:underline font-bold flex items-center">
              Classes <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ibtidaiyyah to Kulliyatu Tarbiya</span>
        </div>

        {/* 2-Days Dept Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">2-Days Department</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalClasses2Days}</span>
            <Link href="/dashboard/classes" className="text-xs text-amber-800 hover:underline font-bold flex items-center">
              Weekend <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Friday & Saturday programs</span>
        </div>

        {/* Faculty Personnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Faculty & Scholars</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalTeachers}</span>
            <Link href="/dashboard/teachers" className="text-xs text-purple-800 hover:underline font-bold flex items-center">
              Faculty <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Headed by Mudir Al-Aam</span>
        </div>

        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Enrolled Talabah</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800 font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalStudents}</span>
            <Link href="/dashboard/students" className="text-xs text-teal-800 hover:underline font-bold flex items-center">
              Scholars <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active enrolled learners</span>
        </div>
      </div>

      {/* Teacher Specific Section: My Schedule, Corresponding Subjects & Grade Level */}
      {role === 'teacher' && (
        (() => {
          const teacherId = currentUser?.linkedId || 2;
          const mySchedules = schedules.filter(s => s.TeacherID === teacherId);

          return (
            <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c4b68e] pb-3" dir="rtl">
                <div>
                  <h3 className="text-xl font-black text-slate-950 font-serif flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-900" />
                    <span>جدولي التدريسي والمواد والمراحل المسندة (My Schedule, Subjects & Grade Levels)</span>
                  </h3>
                  <p className="text-xs text-slate-700 mt-0.5">
                    استعراض الحصص الأسبوعية والمواد والمراحل الدراسية لسرعة الوصول ورصد الدرجات.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/schedules"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>عرض الجدول الكامل</span>
                  </Link>

                  <Link
                    href="/dashboard/grades"
                    className="px-4 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-full shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
                    <span>رصد درجات المواد</span>
                  </Link>
                </div>
              </div>

              {/* Schedule Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {mySchedules.map(slot => {
                  const sub = subjects.find(s => s.SubjectID === slot.SubjectID);
                  const cls = classes.find(c => c.ClassID === slot.ClassID);

                  return (
                    <div
                      key={slot.ID}
                      className="bg-white p-4 rounded-2xl border border-[#cfc39f] shadow-xs space-y-2 text-right hover:shadow-md transition-shadow"
                      dir="rtl"
                    >
                      {/* Day & Time */}
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-950 pb-1.5 border-b border-slate-100">
                        <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md font-serif">
                          {slot.Day}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" dir="ltr">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          {slot.StartTime} - {slot.EndTime}
                        </span>
                      </div>

                      {/* Grade Level Tag */}
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                          مرحلة: {cls?.Level || cls?.ClassName}
                        </span>
                        <span className="block text-xs font-bold text-slate-800 mt-0.5">
                          {cls?.ClassName}
                        </span>
                      </div>

                      {/* Subject Name */}
                      <div className="pt-1">
                        <h4 className="text-sm font-black text-slate-950 font-serif">
                          {sub?.SubjectArabic || sub?.SubjectClass}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-sans block" dir="ltr">
                          {sub?.SubjectClass}
                        </span>
                      </div>

                      {/* Room & Quick Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {slot.Room}
                        </span>
                        <Link
                          href="/dashboard/grades"
                          className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                        >
                          <span>الدرجات</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      )}

      {/* Two Columns Layout: Module Hub & Institutional Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Capabilities */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-800" />
            <span>JMAA-MoritAko System Hub</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/classes"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">5-Days & 2-Days Divisions</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ibtidaiyyah, Mutawassit, Thanawi, and Kulliyatul Shariah / Dawa / Tarbiya.
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/schedules"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Class Timetable & Conflicts</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interactive schedule slots with teacher hover cards and overlap conflict alerts.
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/grades"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 flex-shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">6 Dawr Examination Matrix</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quizzes, attendance, exams criteria, locking timer, and Excel export/import.
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/finance"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 flex-shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Cashier & Tuition Matrix</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  6-period fee collection, hover cashier name with timestamps, and payroll.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Institutional System Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-800" />
            <span>Platform Overview</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Institution</span>
              <span className="font-bold text-slate-900">JMAA Al-Arabia</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">System Name</span>
              <span className="font-mono font-bold text-emerald-800">JMAA-MoritAko</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Evaluation Mode</span>
              <span className="font-bold text-amber-800">6 Dawr Terms</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Vercel Readiness</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                100% Zero-Config
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Quick Navigation Hint:</p>
            <p>
              Switch between roles on the login page anytime to explore features tailored for the Principal (Mudir), Cashier, Faculty, and Students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
