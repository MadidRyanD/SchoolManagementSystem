'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  UserSession,
  ClassItem,
  SubjectItem,
  StudentItem,
  TeacherItem,
  AnnouncementItem,
  ClassScheduleItem,
  StudentGradeItem,
  SubjectTeacherItem,
  StudentPaymentLedger,
  TuitionFeeSetting,
} from '@/lib/types';
import StudentDashboardView from './StudentDashboardView';
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
  BookOpen,
  Clock,
  User,
  Phone,
  MapPin,
  Globe,
  Mail,
  FileBadge,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);
  const [payments, setPayments] = useState<StudentPaymentLedger[]>([]);
  const [feeSettings, setFeeSettings] = useState<TuitionFeeSetting[]>([]);
  const [stats, setStats] = useState({
    totalClasses5Days: 0,
    totalClasses2Days: 0,
    totalTeachers: 0,
    totalStudents: 0,
  });

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
    setStudents(stds);
    setTeachers(tchs);
    setAnnouncements(ann);
    setSchedules(schs);
    setGrades(DataStore.getGrades());
    setSubjectTeachers(DataStore.getSubjectTeachers());
    setPayments(DataStore.getPayments());
    setFeeSettings(DataStore.getFeesSettings());

    setStats({
      totalClasses5Days: cls.filter(c => c.Department === '5-days').length,
      totalClasses2Days: cls.filter(c => c.Department === '2-days').length,
      totalTeachers: tchs.length,
      totalStudents: stds.length,
    });
  }, []);

  const role = currentUser?.role || 'admin';

  // ---------------------------------------------------------------
  // STUDENT HOME VIEW: Comprehensive Dashboard & Announcements Reader
  // ---------------------------------------------------------------
  if (role === 'student') {
    const student = students.find(s => s.StudentID === currentUser?.linkedId) || students[0];
    const enrolledClass = student ? classes.find(c => c.ClassID === student.ClassID) : undefined;

    return student ? (
      <StudentDashboardView
        student={student}
        enrolledClass={enrolledClass}
        subjects={subjects}
        teachers={teachers}
        subjectTeachers={subjectTeachers}
        grades={grades}
        announcements={announcements}
        schedules={schedules}
        payments={payments}
        feeSettings={feeSettings}
      />
    ) : null;
  }

  // ---------------------------------------------------------------
  // TEACHER HOME VIEW: Profile Card + Announcements
  // ---------------------------------------------------------------
  if (role === 'teacher') {
    const teacher = teachers.find(t => t.TeacherID === currentUser?.linkedId) || teachers[1];
    const teacherAllocs = DataStore.getSubjectTeachers().filter(a => a.TeacherID === teacher?.TeacherID);
    const mySubjectIds = teacherAllocs.map(a => a.SubjectID);
    const mySubjects = subjects.filter(s => mySubjectIds.includes(s.SubjectID));
    const myClassIds = Array.from(new Set(mySubjects.map(s => s.ClassID)));
    const myClasses = classes.filter(c => myClassIds.includes(c.ClassID));
    // Advisee class = class where teacher is the AdviserID
    const adviseeClasses = classes.filter(c => c.AdviserID === teacher?.TeacherID);
    const adviseeStudents = students.filter(s => adviseeClasses.some(c => c.ClassID === s.ClassID));

    const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) =>
      value ? (
        <div className="flex items-start gap-3 py-2.5 border-b border-[#e8e0cc] last:border-0">
          <div className="mt-0.5 p-1.5 rounded-lg bg-[#dfd4b8] text-[#126b38]">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">{label}</span>
            <span className="block text-xs font-bold text-slate-800 mt-0.5 break-words">{value}</span>
          </div>
        </div>
      ) : null;

    return (
      <div className="space-y-6">
        {/* Page Heading */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Teacher Home</h1>
            <p className="text-xs text-slate-500 font-serif" dir="rtl">الصفحة الرئيسية للأستاذ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Teacher Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl overflow-hidden shadow-sm">
              {/* Top Banner */}
              <div className="bg-[#126b38] px-5 pt-6 pb-10 text-center">
                <span className="block text-[10px] font-bold uppercase text-amber-200 tracking-widest">
                  Teacher Portal • بوابة الأستاذ
                </span>
                <h2 className="mt-1 text-base font-black text-white">JMAA-MoritAko</h2>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center -mt-8 px-5">
                <div className="w-20 h-20 rounded-full border-4 border-[#dfd4b8] bg-white overflow-hidden shadow-md">
                  {teacher?.ProfilePic ? (
                    <img src={teacher.ProfilePic} alt={teacher.Name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <User className="w-8 h-8 text-[#126b38]" />
                    </div>
                  )}
                </div>

                <span className="mt-2 px-3 py-1 bg-emerald-700 text-white text-[11px] font-black rounded-full">
                  Faculty • أستاذ
                </span>

                <h3 className="mt-2 text-lg font-black text-slate-900 font-serif text-center" dir="rtl">
                  {teacher?.NameArabic || teacher?.Name}
                </h3>
                <p className="text-xs font-bold text-slate-600">{teacher?.Name}</p>

                {teacher?.IdNumber && (
                  <span className="mt-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-[11px] font-black text-amber-900 font-mono">
                    {teacher.IdNumber}
                  </span>
                )}

                {/* Advisee Summary */}
                {adviseeClasses.length > 0 && (
                  <div className="mt-3 w-full bg-white/60 rounded-xl px-4 py-3 text-center border border-[#ccbf99]">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Class Adviser Of</p>
                    <p className="text-xs font-black text-slate-800 font-serif mt-0.5" dir="rtl">
                      {adviseeClasses.map(c => c.ClassName).join(' | ')}
                    </p>
                    <p className="text-[11px] text-emerald-800 font-bold mt-1">{adviseeStudents.length} Students</p>
                  </div>
                )}
              </div>

              {/* Info Rows */}
              <div className="px-5 py-4 mt-2">
                <InfoRow icon={Mail} label="Email" value={teacher?.Email} />
                <InfoRow icon={Phone} label="Mobile" value={teacher?.MobileNumber} />
                <InfoRow icon={MapPin} label="Address" value={teacher?.Address} />
                <InfoRow icon={Globe} label="Nationality" value={teacher?.Nationality} />
                <InfoRow icon={Award} label="Degree" value={teacher?.Degree} />
                <InfoRow icon={Calendar} label="Admission Date" value={teacher?.AdmissionDate} />
                <InfoRow icon={FileBadge} label="Remarks" value={teacher?.Remarks} />
              </div>

              {/* Subjects Teaching */}
              {mySubjects.length > 0 && (
                <div className="px-5 pb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">
                    Teaching Subjects ({mySubjects.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mySubjects.map(s => (
                      <span key={s.SubjectID} className="px-2 py-1 rounded-lg bg-white border border-[#ccbf99] text-[11px] font-bold text-slate-700 font-serif">
                        {s.SubjectArabic || s.SubjectClass}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Profile */}
              <div className="px-5 pb-5">
                <Link
                  href="/dashboard/profile"
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-[#126b38] hover:bg-[#0e5830] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                  <span className="font-serif text-[11px] opacity-80" dir="rtl">(تعديل الملف)</span>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Welcome + Quick Links + Subjects to Teach + Schedule + Announcements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#126b38] via-[#0f572d] to-slate-900 rounded-3xl p-6 text-white shadow-md border border-emerald-800/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white/10 flex-shrink-0 border border-white/10">
                    <UserCheck className="w-8 h-8 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider font-sans">
                        Teacher Portal • بوابة الأستاذ
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-mono font-bold">
                        Academic Year 1447-1448 AH
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                      Welcome, {teacher?.Name || currentUser?.name}!
                    </h2>
                    <h3 className="text-base font-bold text-amber-200 font-serif mt-0.5" dir="rtl">
                      أهلاً بك يا {teacher?.NameArabic || 'أستاذنا الفاضل'} في بوابة التدريس والتقييم الأكاديمي
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
                      Access your assigned teaching subjects, evaluate student scores across the 6 Dawr terms using the Excel spreadsheet editor, and view your weekly timetable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Summary Chips */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5 text-xs">
                <span className="px-3 py-1 bg-white/15 rounded-full font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span>{mySubjects.length} Subjects to Teach</span>
                </span>
                <span className="px-3 py-1 bg-white/15 rounded-full font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{myClasses.length} Assigned Classes</span>
                </span>
                <span className="px-3 py-1 bg-white/15 rounded-full font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-300" />
                  <span>{schedules.filter(s => s.TeacherID === teacher?.TeacherID).length} Weekly Sessions</span>
                </span>
                {adviseeClasses.length > 0 && (
                  <span className="px-3 py-1 bg-amber-400/30 text-amber-200 rounded-full font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    <span>Adviser of {adviseeClasses[0]?.ClassName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Navigation Grid (English First) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  href: '/dashboard/grades',
                  icon: ClipboardList,
                  labelEn: 'Grade Matrix (Excel)',
                  labelAr: 'رصد وتعديل الدرجات',
                  color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900',
                  badge: 'Excel Mode',
                },
                {
                  href: '/dashboard/schedules',
                  icon: Calendar,
                  labelEn: 'My Class Schedule',
                  labelAr: 'جدول الحصص الأسبوعي',
                  color: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900',
                  badge: 'Timetable',
                },
                {
                  href: '/dashboard/classes',
                  icon: Building2,
                  labelEn: 'My Assigned Classes',
                  labelAr: 'فصولي وموادي الدراسية',
                  color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900',
                  badge: `${myClasses.length} Classes`,
                },
                {
                  href: '/dashboard/classes/advisee',
                  icon: UserCheck,
                  labelEn: 'Class Advisee Roster',
                  labelAr: 'الفصل المشرف عليه',
                  color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900',
                  badge: `${adviseeStudents.length} Students`,
                },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${item.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-current opacity-80">
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-tight">{item.labelEn}</p>
                    <p className="text-[10px] font-serif opacity-75 mt-0.5" dir="rtl">{item.labelAr}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* DASHBOARD: SUBJECTS TO TEACH (Requested Feature) */}
            <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c4b68e] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-900" />
                    <h3 className="text-lg font-black text-slate-950 font-sans">
                      Subjects to Teach
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#187d44] text-white text-xs font-black">
                      {mySubjects.length} Subjects
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5 font-serif" dir="rtl">
                    المواد والمناهج المسندة لتدريسها مع خيار فتح محرر الدرجات (Excel) مباشرة.
                  </p>
                </div>

                <Link
                  href="/dashboard/grades"
                  className="px-4 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-full shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Open Full Grade Matrix</span>
                  <span className="font-serif text-[11px] opacity-80" dir="rtl">(رصد الدرجات)</span>
                </Link>
              </div>

              {/* Subjects Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mySubjects.map(sub => {
                  const cls = classes.find(c => c.ClassID === sub.ClassID);
                  const enrolledCount = students.filter(s => s.ClassID === sub.ClassID).length;
                  const subjectSchedules = schedules.filter(
                    s => s.TeacherID === teacher?.TeacherID && s.SubjectID === sub.SubjectID
                  );

                  return (
                    <div
                      key={sub.SubjectID}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-[#cfc39f] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2.5">
                        {/* Header: Grade Level & Department */}
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-[#b79e55] text-slate-950 font-serif">
                            مرحلة: {cls?.Level || cls?.ClassName}
                          </span>
                          <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {cls?.Department || '5-days'}
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

                        {/* Class Info & Student Count */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                          <span className="font-medium">Class: <strong className="text-slate-900">{cls?.ClassName}</strong></span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {enrolledCount} Students Enrolled
                          </span>
                        </div>

                        {/* Scheduled Teaching Slots */}
                        {subjectSchedules.length > 0 && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/60 space-y-1">
                            <span className="font-bold uppercase text-[10px] text-slate-400 block tracking-wider">
                              Class Schedule:
                            </span>
                            {subjectSchedules.map(sch => (
                              <div key={sch.ID} className="flex items-center justify-between font-mono text-slate-700">
                                <span>{sch.Day}: {sch.StartTime} - {sch.EndTime}</span>
                                <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200">{sch.Room}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Direct Edit Grade Button (Excel-Style Editor) */}
                      <div className="pt-3 mt-3 border-t border-slate-100">
                        <Link
                          href="/dashboard/grades"
                          className="w-full py-2.5 px-3 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all hover:shadow"
                        >
                          <ClipboardList className="w-4 h-4 text-emerald-200" />
                          <span>Edit Grades (Excel Editor)</span>
                          <span className="font-serif text-[11px] opacity-80" dir="rtl">(تعديل ورصد الدرجات)</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUGGESTED FEATURE: 6-Dawr Academic Grading Tracker */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-black text-slate-900 font-sans">
                    6-Dawr Term Evaluation Progress
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active Grading Period: 1st Dawr
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { dawr: '1st Dawr', ar: 'الدور الأول', status: 'Open', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
                  { dawr: '2nd Dawr', ar: 'الدور الثاني', status: 'Open', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
                  { dawr: '3rd Dawr', ar: 'الدور الثالث', status: 'Open', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
                  { dawr: '4th Dawr', ar: 'الدور الرابع', status: 'Open', color: 'bg-amber-50 border-amber-300 text-amber-900' },
                  { dawr: '5th Dawr', ar: 'الدور الخامس', status: 'Upcoming', color: 'bg-slate-50 border-slate-200 text-slate-600' },
                  { dawr: '6th Dawr', ar: 'الدور السادس', status: 'Final', color: 'bg-slate-50 border-slate-200 text-slate-600' },
                ].map(d => (
                  <div key={d.dawr} className={`p-2.5 rounded-xl border text-center space-y-0.5 ${d.color}`}>
                    <span className="block font-black text-[11px]">{d.dawr}</span>
                    <span className="block text-[10px] font-serif opacity-80" dir="rtl">{d.ar}</span>
                    <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-white border border-current/20">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SUGGESTED FEATURE: Teacher's Weekly Teaching Timetable Preview */}
            {schedules.filter(s => s.TeacherID === teacher?.TeacherID).length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-800" />
                    <h4 className="text-sm font-black text-slate-900 font-sans">
                      My Teaching Schedule & Class Periods
                    </h4>
                  </div>
                  <Link href="/dashboard/schedules" className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-0.5">
                    <span>Full Schedule</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {schedules.filter(s => s.TeacherID === teacher?.TeacherID).slice(0, 6).map(slot => {
                    const sub = subjects.find(s => s.SubjectID === slot.SubjectID);
                    const cls = classes.find(c => c.ClassID === slot.ClassID);

                    return (
                      <div key={slot.ID} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 hover:bg-emerald-50/40 transition-colors">
                        <div className="flex items-center justify-between text-xs font-mono font-bold pb-1 border-b border-slate-200">
                          <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                            {slot.Day}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {slot.StartTime} - {slot.EndTime}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 font-serif text-right" dir="rtl">
                            {sub?.SubjectArabic || sub?.SubjectClass}
                          </p>
                          <p className="text-[11px] text-slate-500 font-sans truncate">
                            {cls?.ClassName} &bull; {slot.Room}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ANNOUNCEMENTS SECTION (Requested Feature) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black text-slate-900">
                    Faculty & School Announcements
                  </h3>
                  <span className="text-xs text-slate-400 font-serif" dir="rtl">(الإعلانات والتعاميم)</span>
                </div>
                <Link href="/dashboard/announcements" className="text-xs font-bold text-[#126b38] hover:underline flex items-center gap-0.5">
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {announcements.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">
                    No announcements at this time.
                  </div>
                ) : (
                  announcements.slice(0, 4).map(item => (
                    <div key={item.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 text-center">
                          <p className="text-[11px] font-mono font-bold text-slate-500">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '—'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : ''}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                              {item.targetAudience?.toUpperCase() || 'ALL'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              By {item.author || 'Dean Office'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 font-serif" dir="rtl">{item.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{item.content}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // ADMIN / MUDIR / CASHIER DASHBOARD
  // ---------------------------------------------------------------
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
              {role === 'mudir' ? 'Principal / Mudir Portal' : role === 'cashier' ? 'Cashier Portal' : 'Admin Portal'}
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">5-Days Department</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">2-Days Department</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">Faculty & Scholars</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 font-sans">Enrolled Talabah</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800">
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

      {/* Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-800" />
            <span>JMAA-MoritAko System Hub</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: '/dashboard/classes', icon: Building2, color: 'bg-emerald-100 text-emerald-800', title: '5-Days & 2-Days Divisions', desc: 'Ibtidaiyyah, Mutawassit, Thanawi, and Kulliyah programs.' },
              { href: '/dashboard/schedules', icon: Calendar, color: 'bg-amber-100 text-amber-800', title: 'Class Timetable & Conflicts', desc: 'Interactive schedule slots with teacher hover cards.' },
              { href: '/dashboard/grades', icon: ClipboardList, color: 'bg-rose-100 text-rose-800', title: '6 Dawr Examination Matrix', desc: 'Quizzes, attendance, exams criteria, and Excel export.' },
              { href: '/dashboard/finance', icon: Wallet, color: 'bg-blue-100 text-blue-800', title: 'Cashier & Tuition Matrix', desc: '6-period fee collection with cashier timestamps.' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all flex items-start gap-3.5"
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-800" />
            <span>Platform Overview</span>
          </h3>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Institution', value: 'JMAA Al-Arabia' },
              { label: 'System Name', value: 'JMAA-MoritAko', mono: true },
              { label: 'Evaluation Mode', value: '6 Dawr Terms', amber: true },
              { label: 'Status', value: 'Active & Synced', green: true },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                <span className="text-slate-500">{row.label}</span>
                <span className={`font-bold ${row.mono ? 'font-mono text-emerald-800' : ''} ${row.amber ? 'text-amber-800' : ''} ${row.green ? 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold' : 'text-slate-900'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Portal Switching:</p>
            <p>Log in as Teacher, Mudir, Cashier, Student, or Admin to experience each customized view.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
