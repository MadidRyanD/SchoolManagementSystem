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
  StudentItem,
  AnnouncementItem,
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
  ChevronRight,
  CalendarCheck,
  User,
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
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

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
    setStudents(stds);
    setAnnouncements(ann);

    setStats({
      totalClasses5Days: cls.filter(c => c.Department === '5-days').length,
      totalClasses2Days: cls.filter(c => c.Department === '2-days').length,
      totalTeachers: tchs.length,
      totalStudents: stds.length,
      totalAnnouncements: ann.length,
    });
  }, []);

  const role = currentUser?.role || 'admin';

  // -------------------------------------------------------------
  // DEDICATED TEACHER PORTAL VIEW
  // -------------------------------------------------------------
  if (role === 'teacher') {
    const teacherId = currentUser?.linkedId || 2;
    const teacherAllocs = DataStore.getSubjectTeachers().filter(a => a.TeacherID === teacherId);
    const mySubjectIds = teacherAllocs.map(a => a.SubjectID);
    const mySubjects = subjects.filter(s => mySubjectIds.includes(s.SubjectID));
    const myClassIds = Array.from(new Set(mySubjects.map(s => s.ClassID)));
    const myClasses = classes.filter(c => myClassIds.includes(c.ClassID));
    const myStudents = students.filter(s => myClassIds.includes(s.ClassID));
    const mySchedules = schedules.filter(s => s.TeacherID === teacherId);

    return (
      <div className="space-y-6">
        {/* Teacher Welcome Banner (English First) */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/60">
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider font-sans">
                Academic Session 1447 - 1448 AH (2026 - 2027)
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 text-xs font-mono font-bold rounded-full">
                Teacher Portal • بوابة الأستاذ
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              Welcome, {currentUser?.name || 'Ustadh'}!
            </h1>
            <h2 className="text-xl font-bold text-amber-300 font-serif mt-0.5" dir="rtl">
              أهلاً بك في بوابة الكادر التعليمي - جامعة منيب الكزبري العربية
            </h2>

            <p className="mt-2.5 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Your personalized faculty workspace to view your weekly timetable, inspect assigned classes & grade levels, and record student evaluation marks using the Excel-style grade editor.
            </p>

            {/* Quick Action Pill Buttons (English First) */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/grades"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow transition-all cursor-pointer hover:scale-102"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Grade Management (Excel)</span>
                <span className="font-serif text-[11px] opacity-80" dir="rtl">(رصد الدرجات)</span>
              </Link>

              <Link
                href="/dashboard/schedules"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/40 shadow transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>My Weekly Schedule</span>
                <span className="font-serif text-[11px] opacity-80" dir="rtl">(جدولي الأسبوعي)</span>
              </Link>

              <Link
                href="/dashboard/classes"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/40 shadow transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>My Classes & Subjects</span>
                <span className="font-serif text-[11px] opacity-80" dir="rtl">(فصولي وموادي)</span>
              </Link>

              <Link
                href="/dashboard/students/attendance"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600/40 shadow transition-colors cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Student Attendance</span>
                <span className="font-serif text-[11px] opacity-80" dir="rtl">(حضور الطلاب)</span>
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <School className="w-96 h-96" />
          </div>
        </div>

        {/* Teacher's 4 Personalized Metric Cards (English First) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Teaching Subjects */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 font-sans block">Teaching Subjects</span>
                <span className="text-[11px] text-slate-400 font-serif">المواد المسندة</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{mySubjects.length}</span>
              <Link href="/dashboard/grades" className="text-xs text-emerald-800 hover:underline font-bold flex items-center gap-0.5">
                <span>Enter Grades</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active curriculum modules</span>
          </div>

          {/* 2. Assigned Classes & Grade Levels */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 font-sans block">Classes & Levels</span>
                <span className="text-[11px] text-slate-400 font-serif">الفصول والمراحل</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{myClasses.length}</span>
              <Link href="/dashboard/classes" className="text-xs text-amber-800 hover:underline font-bold flex items-center gap-0.5">
                <span>View Classes</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Ibtidaiyyah to Kulliyah</span>
          </div>

          {/* 3. My Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 font-sans block">Enrolled Students</span>
                <span className="text-[11px] text-slate-400 font-serif">الطلاب في فصولي</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800 font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{myStudents.length}</span>
              <Link href="/dashboard/students/attendance" className="text-xs text-teal-800 hover:underline font-bold flex items-center gap-0.5">
                <span>Roll Call</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Registered in your courses</span>
          </div>

          {/* 4. Weekly Schedule Sessions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 font-sans block">Weekly Schedule</span>
                <span className="text-[11px] text-slate-400 font-serif">الحصص الأسبوعية</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{mySchedules.length}</span>
              <Link href="/dashboard/schedules" className="text-xs text-purple-800 hover:underline font-bold flex items-center gap-0.5">
                <span>Timetable</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Scheduled teaching periods</span>
          </div>
        </div>

        {/* SECTION 1: My Assigned Subjects & Direct Excel Grade Entry */}
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c4b68e] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-900" />
                <h3 className="text-lg sm:text-xl font-black text-slate-950 font-sans">
                  My Assigned Subjects & Excel Grade Entry
                </h3>
              </div>
              <p className="text-xs text-slate-700 mt-0.5 font-serif" dir="rtl">
                المواد الدراسية المكلف بتدريسها مع خيار فتح محرر الدرجات (Excel) لكل مادة مباشرة.
              </p>
            </div>

            <Link
              href="/dashboard/grades"
              className="px-4 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-full shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-emerald-200" />
              <span>Open Grade Portal</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(رصد الدرجات)</span>
            </Link>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySubjects.map(sub => {
              const cls = classes.find(c => c.ClassID === sub.ClassID);
              const classStudentsCount = students.filter(s => s.ClassID === sub.ClassID).length;

              return (
                <div
                  key={sub.SubjectID}
                  className="bg-white p-5 rounded-2xl border border-[#cfc39f] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    {/* Header: Grade Level & Department */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                        مرحلة: {cls?.Level || cls?.ClassName}
                      </span>
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {cls?.Department}
                      </span>
                    </div>

                    {/* Subject Titles */}
                    <div>
                      <h4 className="text-base font-black text-slate-950 font-serif text-right" dir="rtl">
                        {sub.SubjectArabic || sub.SubjectClass}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 font-sans mt-0.5">
                        {sub.SubjectClass}
                      </p>
                    </div>

                    {/* Class Details */}
                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Class: {cls?.ClassName}</span>
                      <span className="font-bold text-emerald-800">{classStudentsCount} Students</span>
                    </div>
                  </div>

                  {/* Direct Edit Grade Option */}
                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <Link
                      href="/dashboard/grades"
                      className="w-full py-2.5 px-3 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all hover:shadow"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Edit Grades (Excel)</span>
                      <span className="font-serif text-[11px] opacity-80" dir="rtl">(تعديل الدرجات)</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: My Weekly Teaching Timetable & Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900 font-sans">
                  My Weekly Teaching Timetable
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-serif" dir="rtl">
                جدول الحصص والمواعيد والقاعات الدراسية المسندة للأستاذ.
              </p>
            </div>

            <Link
              href="/dashboard/schedules"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Full Weekly Timetable</span>
              <span className="font-serif text-[11px] opacity-80" dir="rtl">(الجدول الأسبوعي)</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mySchedules.map(slot => {
              const sub = subjects.find(s => s.SubjectID === slot.SubjectID);
              const cls = classes.find(c => c.ClassID === slot.ClassID);

              return (
                <div
                  key={slot.ID}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold pb-1.5 border-b border-slate-200">
                    <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-sans font-bold">
                      {slot.Day}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="w-3 h-3 text-emerald-700" />
                      {slot.StartTime} - {slot.EndTime}
                    </span>
                  </div>

                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-[#b79e55] text-slate-950 font-serif">
                      مرحلة: {cls?.Level || cls?.ClassName}
                    </span>
                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                      {cls?.ClassName}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-950 font-serif text-right" dir="rtl">
                      {sub?.SubjectArabic || sub?.SubjectClass}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-sans block">
                      {sub?.SubjectClass}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {slot.Room}
                    </span>
                    <Link
                      href="/dashboard/grades"
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                    >
                      <span>Grades</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: School & Academic Announcements */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-black text-slate-900 font-sans">
                Faculty & School Announcements
              </h3>
            </div>
            <Link
              href="/dashboard/announcements"
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.slice(0, 4).map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900 font-sans">
                    {item.targetAudience.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-serif" dir="rtl">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PRINCIPAL (MUDIR) & SYSTEM ADMINISTRATOR DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/60">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider font-sans">
              Academic Session 1447 - 1448 AH (2026 - 2027)
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 text-xs font-mono font-bold rounded-full">
              {role === 'mudir' ? 'Principal / Mudir Portal' : 'Admin Portal'}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-amber-300 font-serif mb-1" dir="rtl">
            جامعة منيب الكزبري العربية
          </h2>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
            Jamiatu Monib Alkuzbary Al-Arabia
          </h1>
          <p className="mt-2 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            Welcome, <span className="font-bold text-white">{currentUser?.name}</span> ({role.toUpperCase()} Portal).
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
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">5-Days Department</span>
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
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">2-Days Department</span>
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
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">Faculty & Scholars</span>
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
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">Enrolled Talabah</span>
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
              <span className="text-slate-500">Zero-Config</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                Active & Synced
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Portal Switching:</p>
            <p>
              Log in as Teacher, Principal (Mudir), Cashier, Student, or Admin to experience each customized view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
