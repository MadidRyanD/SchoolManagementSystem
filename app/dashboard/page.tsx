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
  CalendarCheck,
  Sparkles,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
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

    setClasses(cls);
    setSubjects(subs);
    setStudents(stds);
    setTeachers(tchs);
    setAnnouncements(ann);

    setStats({
      totalClasses5Days: cls.filter(c => c.Department === '5-days').length,
      totalClasses2Days: cls.filter(c => c.Department === '2-days').length,
      totalTeachers: tchs.length,
      totalStudents: stds.length,
    });
  }, []);

  const role = currentUser?.role || 'admin';

  // ---------------------------------------------------------------
  // STUDENT / SSG HOME VIEW: Profile Card + Announcements
  // ---------------------------------------------------------------
  if (role === 'student' || role === 'ssg') {
    const isSSG = role === 'ssg';
    const student = students.find(s => s.StudentID === currentUser?.linkedId || (isSSG && s.IsSSG)) || students[0];
    const enrolledClass = student ? classes.find(c => c.ClassID === student.ClassID) : null;
    const classSubjects = student ? subjects.filter(s => s.ClassID === student.ClassID) : [];

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
          <div className={`p-2.5 rounded-xl ${isSSG ? 'bg-rose-100 text-rose-800' : 'bg-[#126b38]/10 text-[#126b38]'}`}>
            {isSSG ? <Award className="w-5 h-5 text-rose-700" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {isSSG ? 'SSG Student Council Portal' : 'Student Home'}
            </h1>
            <p className="text-xs text-slate-500 font-serif" dir="rtl">
              {isSSG ? 'الصفحة الرئيسية لمجلس الطلبة ورصد النشاط' : 'الصفحة الرئيسية للطالب'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl overflow-hidden shadow-sm">
              {/* Top Banner */}
              <div className="bg-[#126b38] px-5 pt-6 pb-10 text-center relative">
                <span className="block text-[10px] font-bold uppercase text-amber-200 tracking-widest font-sans">
                  Student Portal • بوابة الطالب
                </span>
                <h2 className="mt-1 text-base font-black text-white font-sans">
                  JMAA-MoritAko
                </h2>
              </div>

              {/* Avatar overlapping banner */}
              <div className="flex flex-col items-center -mt-8 px-5">
                <div className="w-20 h-20 rounded-full border-4 border-[#dfd4b8] bg-white overflow-hidden shadow-md">
                  {student?.ProfilePic ? (
                    <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#126b38]/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-[#126b38]" />
                    </div>
                  )}
                </div>

                {/* Level / Class Badge */}
                {enrolledClass && (
                  <span className="mt-2 px-3 py-1 bg-[#126b38] text-white text-[11px] font-black rounded-full font-serif" dir="rtl">
                    مرحلة: {enrolledClass.Level}
                  </span>
                )}

                {/* Student Name */}
                <h3 className="mt-2 text-lg font-black text-slate-900 font-serif text-center" dir="rtl">
                  {student?.NameArabic || student?.Name}
                </h3>
                <p className="text-xs font-bold text-slate-600 font-sans">{student?.Name}</p>

                {/* Roll & ID */}
                <div className="flex items-center gap-3 mt-2">
                  {student?.RollNo && (
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#ccbf99] text-[11px] font-black text-slate-700 font-mono">
                      Roll: {student.RollNo}
                    </span>
                  )}
                  {student?.IdNumber && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-[11px] font-black text-amber-900 font-mono">
                      {student.IdNumber}
                    </span>
                  )}
                </div>

                {/* Class Info */}
                {enrolledClass && (
                  <div className="mt-3 w-full bg-white/60 rounded-xl px-4 py-3 text-center border border-[#ccbf99]">
                    <p className="text-xs font-black text-slate-800 font-serif" dir="rtl">{enrolledClass.ClassName}</p>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">{enrolledClass.Department === '2-days' ? 'Weekend Department' : '5-Days Department'}</p>
                  </div>
                )}
              </div>

              {/* Info Rows */}
              <div className="px-5 py-4 mt-2">
                <InfoRow icon={Mail} label="Email" value={student?.Email} />
                <InfoRow icon={Phone} label="Mobile" value={student?.MobileNumber} />
                <InfoRow icon={MapPin} label="Address" value={student?.Address} />
                <InfoRow icon={Globe} label="Nationality" value={student?.Nationality} />
                <InfoRow icon={Calendar} label="Admission Date" value={student?.AdmissionDate} />
                <InfoRow icon={FileBadge} label="Remarks" value={student?.Remarks} />
              </div>

              {/* Subjects Enrolled */}
              {classSubjects.length > 0 && (
                <div className="px-5 pb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">
                    Subjects Enrolled ({classSubjects.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {classSubjects.map(s => (
                      <span key={s.SubjectID} className="px-2 py-1 rounded-lg bg-white border border-[#ccbf99] text-[11px] font-bold text-slate-700 font-serif">
                        {s.SubjectArabic || s.SubjectClass}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {student?.Awards && student.Awards.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Awards & Honors
                  </p>
                  <div className="space-y-1">
                    {student.Awards.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-amber-900 font-bold bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Profile Link */}
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

          {/* RIGHT: Announcements + Quick Links */}
          <div className="lg:col-span-2 space-y-5">
            {/* Welcome Banner */}
            <div className={`rounded-3xl px-6 py-5 text-white shadow-md ${
              isSSG ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border border-rose-700/60' : 'bg-[#126b38]'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${isSSG ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-amber-300'}`}>
                  {isSSG ? <Award className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">
                    {isSSG ? 'SSG STUDENT COUNCIL • مجلس الطلبة والأنشطة' : 'BOLOS KANO! • مرحباً'}
                  </p>
                  <h2 className="text-xl font-black text-white font-sans">
                    Welcome, {student?.Name || currentUser?.name}!
                  </h2>
                  <p className="text-sm text-emerald-100/90 mt-1.5 font-serif leading-relaxed" dir="rtl">
                    {isSSG
                      ? 'مرحباً بك في بوابة مجلس الطلبة (SSG) في JMAA-MoritAko. بصفتك مسؤولاً في مجلس الطلبة، يمكنك تقييم ورصد درجات مقرر النشاط (Nashat) حصرياً لجميع الصفوف والأدوار.'
                      : 'مرحباً بك في حساب الطالب الخاص بك في JMAA-MoritAko، هو بوابة أكاديمية على الويب للطلاب وموظفي جامعة منيب الكزبري العربية.'}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-2 font-sans">
                    {isSSG
                      ? 'Your SSG Officer permissions allow direct Nashat grade evaluation and spreadsheet entry.'
                      : <>Your student MoritAko account is active for Academic Session <span className="font-bold text-amber-300">2025–2026</span>.</>}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Nav Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(isSSG
                ? [
                    { href: '/dashboard/grades', icon: Award, labelEn: 'Nashat Grades', labelAr: 'رصد درجات النشاط', color: 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/40 shadow-xs' },
                    { href: '/dashboard/schedules', icon: Calendar, labelEn: 'Activities Schedule', labelAr: 'جدول الأنشطة', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                    { href: '/dashboard/students', icon: GraduationCap, labelEn: 'Student Directory', labelAr: 'دليل وبيانات الطلاب', color: 'bg-amber-50 border-amber-200 text-amber-900' },
                    { href: '/dashboard/announcements', icon: Megaphone, labelEn: 'Announcements', labelAr: 'الإعلانات والأنشطة', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                  ]
                : [
                    { href: '/dashboard/grades', icon: ClipboardList, labelEn: 'My Grades', labelAr: 'الدرجات الأكاديمية', color: 'bg-rose-50 border-rose-200 text-rose-800' },
                    { href: '/dashboard/schedules', icon: Calendar, labelEn: 'Schedule', labelAr: 'جدول الحصص', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                    { href: '/dashboard/subjects', icon: BookOpen, labelEn: 'Books & E-Library', labelAr: 'المناهج والكتب الدراسية', color: 'bg-amber-50 border-amber-200 text-amber-900' },
                    { href: '/dashboard/finance', icon: Wallet, labelEn: 'Billing', labelAr: 'الرسوم والمستحقات', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                  ]
              ).map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow cursor-pointer ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-black">{item.labelEn}</p>
                    <p className="text-[10px] font-serif opacity-70 mt-0.5" dir="rtl">{item.labelAr}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Announcements Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black text-slate-900">Announcement Section</h3>
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
                  announcements.slice(0, 5).map(item => (
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 font-sans">
                              {item.targetAudience?.toUpperCase() || 'ALL'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 font-serif" dir="rtl">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.content}</p>
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

              {/* Edit Profile */}
              <div className="px-5 py-4">
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

          {/* RIGHT: Welcome + Announcements (At Beginning) + Features */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Welcome Banner */}
            <div className="bg-[#126b38] rounded-3xl px-6 py-5 text-white shadow-md">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white/10 flex-shrink-0">
                  <UserCheck className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-200 mb-1 font-serif">Teacher Portal • بوابة الأستاذ الأكاديمية</p>
                  <h2 className="text-xl font-black text-white">
                    Welcome, {teacher?.Name || currentUser?.name}!
                  </h2>
                  <p className="text-sm text-emerald-100/90 mt-1.5 font-serif leading-relaxed" dir="rtl">
                    أهلاً بك في بوابة الكادر التعليمي لجامعة منيب الكزبري العربية. يمكنك الاطلاع على التعاميم الرسمية، جدول الحصص، رصد الدرجات، ومتابعة سجل الحضور.
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-0.5 bg-white/20 rounded-full font-bold">{mySubjects.length} Subjects to Teach</span>
                    <span className="px-2.5 py-0.5 bg-white/20 rounded-full font-bold">{myClasses.length} Classes</span>
                    <span className="px-2.5 py-0.5 bg-amber-400/30 text-amber-200 rounded-full font-bold">{adviseeStudents.length} Advisees</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Announcements Section (Placed at the beginning per user request) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-sans">Official Announcements</h3>
                    <p className="text-xs text-slate-500 font-serif" dir="rtl">التعاميم والإعلانات الأكاديمية الرسمية</p>
                  </div>
                </div>
                <Link href="/dashboard/announcements" className="text-xs font-bold text-[#126b38] hover:underline flex items-center gap-0.5 font-serif">
                  عرض كافة التعاميم <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {announcements.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm font-serif">
                    لا توجد تعاميم جديدة في الوقت الحالي.
                  </div>
                ) : (
                  announcements.slice(0, 4).map(item => (
                    <div key={item.id} className="px-5 py-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 text-center pt-1">
                          <p className="text-[11px] font-mono font-bold text-slate-600">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '—'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : ''}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                              {item.targetAudience?.toUpperCase() || 'ALL'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              By {item.author || 'Admin Office'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 font-serif leading-snug" dir="rtl">{item.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-2" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Teacher Features & Portals ("these can be shown to features") */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Teacher Features & Services</h3>
                    <p className="text-xs text-slate-500 font-serif" dir="rtl">ميزات وخدمات البوابة الأكاديمية للأستاذ</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  {
                    href: '/dashboard/subjects',
                    icon: BookOpen,
                    labelEn: 'Subjects & Syllabi',
                    labelAr: 'المواد والمناهج المسندة',
                    desc: `${mySubjects.length} Assigned subjects to teach`,
                    color: 'hover:border-emerald-500 bg-emerald-50/50 text-emerald-950',
                    iconColor: 'bg-emerald-700 text-white',
                  },
                  {
                    href: '/dashboard/grades',
                    icon: ClipboardList,
                    labelEn: 'Edit Grades (Excel)',
                    labelAr: 'رصد وتعديل الدرجات Excel',
                    desc: 'Input marks across all 6 Dawr terms',
                    color: 'hover:border-amber-500 bg-amber-50/50 text-amber-950',
                    iconColor: 'bg-amber-600 text-white',
                  },
                  {
                    href: '/dashboard/schedules',
                    icon: Calendar,
                    labelEn: 'Class Schedule',
                    labelAr: 'جدول الحصص الأسبوعي',
                    desc: 'Weekly teaching timetable & periods',
                    color: 'hover:border-blue-500 bg-blue-50/50 text-blue-950',
                    iconColor: 'bg-blue-600 text-white',
                  },
                  {
                    href: '/dashboard/classes/advisee',
                    icon: UserCheck,
                    labelEn: 'Class Advisee',
                    labelAr: 'الفصل المشرف عليه والطلاب',
                    desc: `${adviseeStudents.length} Students under supervision`,
                    color: 'hover:border-purple-500 bg-purple-50/50 text-purple-950',
                    iconColor: 'bg-purple-600 text-white',
                  },
                  {
                    href: '/dashboard/attendance',
                    icon: CalendarCheck,
                    labelEn: 'My Attendance',
                    labelAr: 'سجل الحضور والدوام',
                    desc: 'Personal presence & audit records',
                    color: 'hover:border-teal-500 bg-teal-50/50 text-teal-950',
                    iconColor: 'bg-teal-700 text-white',
                  },
                  {
                    href: '/dashboard/finance',
                    icon: Wallet,
                    labelEn: 'Payroll & Salary',
                    labelAr: 'الرواتب والمستحقات المالية',
                    desc: 'Disbursement status & pay slips',
                    color: 'hover:border-rose-500 bg-rose-50/50 text-rose-950',
                    iconColor: 'bg-rose-700 text-white',
                  },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3 hover:shadow-md transition-all cursor-pointer ${item.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl shadow-xs ${item.iconColor}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 opacity-40 hover:opacity-100" />
                    </div>
                    <div>
                      <p className="text-xs font-black">{item.labelEn}</p>
                      <p className="text-[11px] font-serif font-bold text-slate-800 mt-0.5" dir="rtl">{item.labelAr}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-sans">{item.desc}</p>
                    </div>
                  </Link>
                ))}
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
              { 
                href: '/dashboard/finance', 
                icon: Wallet, 
                color: 'bg-blue-100 text-blue-800', 
                title: role === 'mudir' ? 'My Salary & Payroll' : 'Cashier & Tuition Matrix', 
                desc: role === 'mudir' ? 'Personal monthly salary slips, earnings breakdown, and vouchers.' : '6-period fee collection with cashier timestamps.' 
              },
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
