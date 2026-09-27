'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/lib/auth';
import { UserSession, UserRole } from '@/lib/types';
import {
  School,
  LayoutDashboard,
  Building2,
  Calendar,
  Award,
  BookOpen,
  GraduationCap,
  Users,
  CalendarCheck,
  ClipboardList,
  Wallet,
  Megaphone,
  UserCog,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Crown,
  UserCheck,
  Phone,
  Clock,
  Facebook,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const user = AuthService.getSession();
    if (!user) {
      router.replace('/login');
    } else {
      setCurrentUser(user);
    }
  }, [router]);

  const handleLogout = () => {
    AuthService.logout();
    router.replace('/login');
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = currentUser.role;
  const isCurrent = (path: string) => pathname === path;

  // Arabic Role Helper
  const getRoleArabic = (r: UserRole) => {
    switch (r) {
      case 'student':
        return { label: 'طالب (Student)', labelAr: 'طالب', bg: 'bg-[#9f7a28]', icon: GraduationCap };
      case 'teacher':
        return { label: 'أستاذ (Teacher)', labelAr: 'أستاذ', bg: 'bg-emerald-700', icon: UserCheck };
      case 'mudir':
        return { label: 'المدير / العميد (Mudir)', labelAr: 'المدير / العميد', bg: 'bg-amber-600', icon: Crown };
      case 'cashier':
        return { label: 'أمين الصندوق (Cashier)', labelAr: 'أمين الصندوق', bg: 'bg-blue-600', icon: Wallet };
      case 'admin':
        return { label: 'المشرف (Admin)', labelAr: 'المشرف الإداري', bg: 'bg-red-600', icon: ShieldCheck };
    }
  };

  const roleInfo = getRoleArabic(role);

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white text-slate-900 shadow-xs z-30 sticky top-0 border-b border-[#dfd4b8]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: JMAA-MoritAko Branding Tag & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-[#dfd4b8] hover:bg-[#d4c6a4] text-[#126b38] focus:outline-none cursor-pointer lg:hidden transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* JMAA-MoritAko Brand Tag matching Mockup */}
            <div className="flex items-center gap-2">
              <span className="bg-[#dfd4b8] border border-[#ccbf99] text-[#126b38] px-3.5 py-1 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-2xs font-mono">
                JMAA-MoritAko
              </span>
              <span className="hidden md:inline-block text-xs text-slate-500 font-serif">
                جامعة منيب الكزبري العربية
              </span>
            </div>
          </div>

          {/* Right: User Profile Avatar, Name, Role Badge, and Logout */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Sign Out Button in Arabic */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full transition-colors cursor-pointer shadow-2xs"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-serif">تسجيل الخروج</span>
            </button>

            {/* Profile Info & Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 font-serif block">
                  {roleInfo.labelAr}
                </span>
              </div>

              <Link
                href="/dashboard/profile"
                className="w-10 h-10 rounded-full bg-[#126b38] ring-2 ring-amber-400/80 flex items-center justify-center text-white overflow-hidden shadow transition-all hover:scale-105"
                title="الملف الشخصي"
              >
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body: Content on Left, Sidebar on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area (Left side on desktop) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Sidebar (Right side on desktop, sliding from right on mobile) */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-50 w-72 bg-[#126b38] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out border-l border-[#0e582e] shadow-2xl lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Sidebar Top: Crest Logo & Arabic Institution Title */}
            <div className="p-5 border-b border-emerald-800/80 bg-emerald-950/20 text-center relative">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-4 left-4 p-1 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Crest Logo */}
              <div className="w-20 h-20 mx-auto rounded-full bg-white/10 p-1.5 border-2 border-amber-400 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="JMAA Emblem"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Institution Title in Arabic */}
              <h2 className="mt-3 font-serif font-black text-lg text-white leading-tight">
                جمعية منيب الكزبري العربية
              </h2>
              <p className="text-[11px] text-amber-200/90 font-sans mt-0.5 font-bold tracking-wider">
                JAMIATU MONIB ALKUZBARY
              </p>
            </div>

            {/* Pill Navigation Buttons */}
            <nav className="p-4 space-y-2.5 font-serif" dir="rtl">
              {/* STUDENT NAVIGATION (Exact Mockup Match) */}
              {role === 'student' ? (
                <>
                  {/* 1. الرئيسية (Home / Dashboard) */}
                  <Link
                    href="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الرئيسية
                  </Link>

                  {/* 2. الملف الشخصي (Profile) */}
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/profile')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الملف الشخصي
                  </Link>

                  {/* 3. الدرجات الأكاديمية (Grades) */}
                  <Link
                    href="/dashboard/grades"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/grades')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الدرجات الأكاديمية
                  </Link>

                  {/* 4. جدول الحصص (Class Schedule) */}
                  <Link
                    href="/dashboard/schedules"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/schedules')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    جدول الحصص
                  </Link>

                  {/* 5. المواد الدراسية (Subjects) */}
                  <Link
                    href="/dashboard/grades"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/grades') && false
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    المواد الدراسية
                  </Link>

                  {/* 6. الرسوم والمستحقات (Billings) */}
                  <Link
                    href="/dashboard/finance"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/finance')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الرسوم والمستحقات
                  </Link>

                  {/* 7. لوحة الشرف والمتفوقين (Honors) */}
                  <Link
                    href="/dashboard/honors"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/honors')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    لوحة الشرف والمتفوقين
                  </Link>

                  {/* 8. الإعلانات والتعاميم */}
                  <Link
                    href="/dashboard/announcements"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2.5 px-4 rounded-full text-center font-bold text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/announcements')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الإعلانات والتعاميم
                  </Link>
                </>
              ) : (
                /* FACULTY & ADMIN NAVIGATION (All translated into Arabic pill buttons) */
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    لوحة التحكم العامة
                  </Link>

                  <Link
                    href="/dashboard/schedules"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/schedules')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    جدول الحصص الأسبوعي
                  </Link>

                  <Link
                    href="/dashboard/grades"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/grades')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    رصد الدرجات والتقييم (6 أدوار)
                  </Link>

                  <Link
                    href="/dashboard/honors"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/honors')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    لوحة الشرف والمتفوقين
                  </Link>

                  <Link
                    href="/dashboard/classes"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/classes')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الأقسام والصفوف الدراسية
                  </Link>

                  <Link
                    href="/dashboard/subjects"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/subjects')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    المواد والمناهج الدراسية
                  </Link>

                  {(role === 'admin' || role === 'mudir') && (
                    <>
                      <Link
                        href="/dashboard/teachers"
                        onClick={() => setSidebarOpen(false)}
                        className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                          isCurrent('/dashboard/teachers')
                            ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                            : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                        }`}
                      >
                        الكادر التعليمي والمعلمين
                      </Link>

                      <Link
                        href="/dashboard/teachers/assignments"
                        onClick={() => setSidebarOpen(false)}
                        className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                          isCurrent('/dashboard/teachers/assignments')
                            ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                            : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                        }`}
                      >
                        توزيع المواد والمعلمين
                      </Link>
                    </>
                  )}

                  <Link
                    href="/dashboard/students"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/students')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    سجل وبيانات الطلاب
                  </Link>

                  <Link
                    href="/dashboard/attendance"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/attendance')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    سجل الحضور والغياب
                  </Link>

                  <Link
                    href="/dashboard/finance"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/finance')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    المالية والصندوق
                  </Link>

                  <Link
                    href="/dashboard/announcements"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/announcements')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الإعلانات والتعاميم
                  </Link>

                  {role === 'admin' && (
                    <>
                      <Link
                        href="/dashboard/forms"
                        onClick={() => setSidebarOpen(false)}
                        className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                          isCurrent('/dashboard/forms')
                            ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                            : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                        }`}
                      >
                        النماذج والتقارير
                      </Link>

                      <Link
                        href="/dashboard/accounts"
                        onClick={() => setSidebarOpen(false)}
                        className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                          isCurrent('/dashboard/accounts')
                            ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                            : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                        }`}
                      >
                        الحسابات والصلاحيات
                      </Link>
                    </>
                  )}

                  <Link
                    href="/dashboard/profile"
                    onClick={() => setSidebarOpen(false)}
                    className={`block w-full py-2 px-3 rounded-full text-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isCurrent('/dashboard/profile')
                        ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md'
                        : 'bg-[#dfd3b7] hover:bg-[#d4c6a4] text-slate-900 border border-[#cfc39f]'
                    }`}
                  >
                    الملف الشخصي
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-emerald-800/60 bg-emerald-950/40 text-center text-xs text-amber-200/80 font-mono">
            <span>جامعة منيب الكزبري &bull; v2.0</span>
          </div>
        </aside>
      </div>

      {/* Bottom Footer Bar (Exact Mockup Match) */}
      <footer className="bg-[#dfd4b8] border-t-2 border-[#ccbf99] text-slate-800 py-2.5 px-4 sm:px-8 z-30 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-bold font-serif" dir="rtl">
          {/* Office Hours */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#126b38]" />
            <span>أوقات الدوام:</span>
            <span className="font-mono text-slate-950 font-black" dir="ltr">8:00 AM - 12:00 PM</span>
          </div>

          {/* Social Follow */}
          <div className="flex items-center gap-2">
            <Facebook className="w-4 h-4 text-[#126b38]" />
            <span>تابعنا:</span>
            <span className="text-[#126b38] hover:underline cursor-pointer">صفحة فيسبوك الرسمية</span>
          </div>

          {/* Phone Contact */}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#126b38]" />
            <span>اتصل بنا:</span>
            <span className="font-mono text-slate-950 font-black" dir="ltr">09123456789</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
