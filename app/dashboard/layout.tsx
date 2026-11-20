'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/lib/auth';
import { DataStore } from '@/lib/store';
import { UserSession, UserRole } from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import AcademicTermSwitcher from './components/AcademicTermSwitcher';
import BreadcrumbNav from './components/BreadcrumbNav';
import SchoolArabicTitle from '@/app/components/SchoolArabicTitle';
import WebsiteBrandTitle from '@/app/components/WebsiteBrandTitle';
import {
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
  UserPlus,
  Lock,
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
    let active = true;
    const init = async () => {
      const user = AuthService.getSession();
      if (!user) {
        router.replace('/login');
        return;
      }
      await DataStore.syncFromServer();
      if (active) {
        setCurrentUser(user);
      }
    };
    init();
    return () => {
      active = false;
    };
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

  // Role details with English first
  const getRoleDetails = (r: UserRole) => {
    switch (r) {
      case 'student':
        return {
          titleEn: 'Student',
          titleAr: 'طالب',
          portalTitleEn: 'Student Portal',
          portalTitleAr: 'بوابة الطالب الأكاديمية',
          bg: 'bg-[#9f7a28]',
          icon: GraduationCap,
        };
      case 'teacher':
        return {
          titleEn: 'Teacher',
          titleAr: 'أستاذ',
          portalTitleEn: 'Teacher Portal',
          portalTitleAr: 'بوابة الأستاذ والمعلم',
          bg: 'bg-emerald-700',
          icon: UserCheck,
        };
      case 'mudir':
        return {
          titleEn: 'Principal / Dean',
          titleAr: 'المدير / العميد',
          portalTitleEn: 'Principal & Dean Portal',
          portalTitleAr: 'عمادة وإدارة الجامعة',
          bg: 'bg-amber-600',
          icon: Crown,
        };
      case 'cashier':
        return {
          titleEn: 'Cashier / Finance',
          titleAr: 'أمين الصندوق',
          portalTitleEn: 'Cashier & Finance Portal',
          portalTitleAr: 'أمانة الصندوق والمالية',
          bg: 'bg-blue-600',
          icon: Wallet,
        };
      case 'admin':
        return {
          titleEn: 'System Administrator',
          titleAr: 'المشرف العام',
          portalTitleEn: 'Admin Portal',
          portalTitleAr: 'إدارة النظام والمشرف',
          bg: 'bg-red-600',
          icon: ShieldCheck,
        };
      case 'ssg':
        return {
          titleEn: 'SSG Student Council',
          titleAr: 'مجلس الطلبة / مسؤول النشاط',
          portalTitleEn: 'SSG Student Council Portal',
          portalTitleAr: 'بوابة مجلس الطلبة ورصد النشاط',
          bg: 'bg-rose-700',
          icon: Award,
        };
    }
  };

  const roleInfo = getRoleDetails(role);

  // Navigation Items per Portal with English First
  const getNavItems = () => {
    if (role === 'ssg') {
      return [
        { href: '/dashboard', labelEn: 'Home Dashboard', labelAr: 'الرئيسية', icon: LayoutDashboard },
        { href: '/dashboard/grades', labelEn: 'Nashat Grades (النشاط)', labelAr: 'رصد درجات النشاط', icon: ClipboardList },
        { href: '/dashboard/schedules', labelEn: 'Activities Schedule', labelAr: 'جدول الأنشطة والحصص', icon: Calendar },
        { href: '/dashboard/students', labelEn: 'Student Directory', labelAr: 'دليل وبيانات الطلاب', icon: GraduationCap },
        { href: '/dashboard/announcements', labelEn: 'Announcements', labelAr: 'الإعلانات والأنشطة', icon: Megaphone },
        { href: '/dashboard/profile', labelEn: 'My Profile', labelAr: 'الملف الشخصي', icon: User },
      ];
    }

    if (role === 'teacher') {
      return [
        { href: '/dashboard', labelEn: 'Home', labelAr: 'الرئيسية', icon: LayoutDashboard },
        { href: '/dashboard/profile', labelEn: 'Profile', labelAr: 'الملف الشخصي', icon: User },
        { href: '/dashboard/schedules', labelEn: 'Class Schedule', labelAr: 'جدول الحصص', icon: Calendar },
        { href: '/dashboard/subjects', labelEn: 'Subjects', labelAr: 'المواد الدراسية', icon: BookOpen },
        { href: '/dashboard/grades', labelEn: 'Grades', labelAr: 'رصد الدرجات', icon: ClipboardList },
        { href: '/dashboard/classes/advisee', labelEn: 'Class Advisee', labelAr: 'الفصل المشرف عليه', icon: UserCheck },
        { href: '/dashboard/attendance', labelEn: 'Attendance', labelAr: 'سجل الحضور والدوام', icon: CalendarCheck },
        { href: '/dashboard/finance', labelEn: 'Payroll', labelAr: 'الرواتب والمستحقات', icon: Wallet },
      ];
    }

    if (role === 'student') {
      return [
        { href: '/dashboard', labelEn: 'Home Dashboard', labelAr: 'الرئيسية', icon: LayoutDashboard },
        { href: '/dashboard/profile', labelEn: 'My Profile', labelAr: 'الملف الشخصي', icon: User },
        { href: '/dashboard/grades', labelEn: 'My Academic Grades', labelAr: 'الدرجات الأكاديمية', icon: ClipboardList },
        { href: '/dashboard/schedules', labelEn: 'Class Schedule', labelAr: 'جدول الحصص', icon: Calendar },
        { href: '/dashboard/subjects', labelEn: 'Subjects', labelAr: 'المواد الدراسية', icon: BookOpen },
        { href: '/dashboard/finance', labelEn: 'Tuition & Billing', labelAr: 'الرسوم والمستحقات', icon: Wallet },
        { href: '/dashboard/honors', labelEn: 'Honor Roll', labelAr: 'لوحة الشرف والمتفوقين', icon: Award },
        { href: '/dashboard/announcements', labelEn: 'Announcements', labelAr: 'الإعلانات والتعاميم', icon: Megaphone },
      ];
    }

    if (role === 'cashier') {
      return [
        { href: '/dashboard', labelEn: 'Cashier Dashboard', labelAr: 'لوحة المالية', icon: LayoutDashboard },
        { href: '/dashboard/finance', labelEn: 'Tuition & Cashier Ledger', labelAr: 'المالية والصندوق', icon: Wallet },
        { href: '/dashboard/enrollment', labelEn: 'New Year Enrollment', labelAr: 'التسجيل والترفيع السنوي', icon: UserPlus },
        { href: '/dashboard/students', labelEn: 'Student Directory', labelAr: 'بيانات الطلاب', icon: GraduationCap },
        { href: '/dashboard/announcements', labelEn: 'Announcements', labelAr: 'الإعلانات والتعاميم', icon: Megaphone },
        { href: '/dashboard/profile', labelEn: 'My Profile', labelAr: 'الملف الشخصي', icon: User },
      ];
    }

    // Mudir / Admin Navigation
    const adminItems = [
      {
        href: '/dashboard',
        labelEn: role === 'mudir' ? 'Principal Dashboard' : 'Admin Dashboard',
        labelAr: role === 'mudir' ? 'لوحة قيادة المدير والعميد' : 'لوحة التحكم العامة',
        icon: LayoutDashboard,
      },
      { href: '/dashboard/schedules', labelEn: 'Master Schedules', labelAr: 'جدول الحصص العام', icon: Calendar },
      { href: '/dashboard/grades', labelEn: 'Master Grades Matrix', labelAr: 'سجل الدرجات (6 أدوار)', icon: ClipboardList },
      { href: '/dashboard/classes', labelEn: 'Classes & Departments', labelAr: 'الأقسام والصفوف الدراسية', icon: Building2 },
      { href: '/dashboard/subjects', labelEn: 'Curriculum & Subjects', labelAr: 'المناهج والمواد الدراسية', icon: BookOpen },
      { href: '/dashboard/teachers', labelEn: 'Faculty & Teachers', labelAr: 'الكادر التعليمي والمعلمين', icon: Users },
      { href: '/dashboard/teachers/assignments', labelEn: 'Subject Allocations', labelAr: 'توزيع المواد والمعلمين', icon: UserCog },
      { href: '/dashboard/enrollment', labelEn: 'Academic Year Enrollment', labelAr: 'التسجيل والترفيع السنوي', icon: UserPlus },
      { href: '/dashboard/students', labelEn: 'Student Directory', labelAr: 'سجل وبيانات الطلاب', icon: GraduationCap },
      { href: '/dashboard/students/attendance', labelEn: 'Student Attendance', labelAr: 'سجل حضور الطلاب', icon: CalendarCheck },
      { href: '/dashboard/attendance', labelEn: 'Staff Attendance', labelAr: 'سجل دوام المعلمين', icon: Clock },
      {
        href: '/dashboard/finance',
        labelEn: role === 'mudir' ? 'My Salary & Payroll' : 'Finance & Treasury',
        labelAr: role === 'mudir' ? 'كشف الراتب والمستحقات' : 'المالية والصندوق',
        icon: Wallet,
      },
      { href: '/dashboard/honors', labelEn: 'Honor Roll & Awards', labelAr: 'لوحة الشرف والمتفوقين', icon: Award },
      { href: '/dashboard/announcements', labelEn: 'Announcements', labelAr: 'الإعلانات والتعاميم', icon: Megaphone },
    ];

    if (role === 'admin' || role === 'mudir') {
      adminItems.push(
        { href: '/dashboard/time-locks', labelEn: 'Time Locks & Deadlines', labelAr: 'إدارة المهل والأقفال', icon: Lock },
        { href: '/dashboard/forms', labelEn: 'Form Templates', labelAr: 'النماذج والتقارير', icon: FileText },
        { href: '/dashboard/accounts', labelEn: 'User Accounts & Roles', labelAr: 'الحسابات والصلاحيات', icon: UserCog }
      );
    }

    adminItems.push({ href: '/dashboard/profile', labelEn: 'My Profile', labelAr: 'الملف الشخصي', icon: User });
    return adminItems;
  };

  const navItems = getNavItems();

  return (
    <div className="h-screen overflow-hidden bg-[#f3efe6] flex font-sans text-slate-800">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Column: Fixed Top Header + Scrollable Main Content + Fixed Bottom Footer */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar (Positioned inside main column so it never overlaps or bothers the sidebar) */}
        <header className="bg-white text-slate-900 shadow-xs z-20 shrink-0 border-b border-[#dfd4b8]">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            {/* Left: JMAA-MoritAko Branding Tag & Mobile Menu Trigger */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl bg-[#dfd4b8] hover:bg-[#d4c6a4] text-[#126b38] focus:outline-none cursor-pointer md:hidden transition-colors shrink-0"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Website Brand Logo (2nd picture: MoritAko) with Cache & Weak-Internet Fallback to "JMAA-MoritAko" */}
              <div className="flex items-center gap-2 shrink-0">
                <WebsiteBrandTitle
                  variant="navbar"
                  imgClassName="h-9 sm:h-10 w-auto object-contain select-none drop-shadow-2xs"
                  fallbackClassName="bg-[#dfd4b8] border border-[#ccbf99] text-[#126b38] px-3.5 py-1 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-2xs font-mono"
                  fallbackText="JMAA-MoritAko"
                />
                <SchoolArabicTitle
                  variant="dark"
                  imgClassName="hidden xl:inline-block h-7 w-auto object-contain"
                  fallbackClassName="hidden xl:inline-block text-xs text-slate-600 font-serif"
                />
              </div>

              {/* Global Academic Year & Semester Switcher */}
              <div className="hidden lg:block">
                <AcademicTermSwitcher canAddYear={role === 'admin' || role === 'mudir'} />
              </div>
            </div>

            {/* Right: User Profile Avatar, Name, Role Badge, and Logout */}
            <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
              {/* Sign Out Button (English First) */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full transition-colors cursor-pointer shadow-2xs"
                title="Sign Out / تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
                <span className="hidden sm:inline font-serif text-[11px] opacity-75">(خروج)</span>
              </button>

              {/* Profile Info & Avatar */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    {roleInfo.titleEn} <span className="font-serif">({roleInfo.titleAr})</span>
                  </span>
                </div>

                <Link
                  href="/dashboard/profile"
                  className="w-10 h-10 rounded-full bg-[#126b38] ring-2 ring-amber-400/80 flex items-center justify-center text-white overflow-hidden shadow transition-all hover:scale-105 shrink-0"
                  title="Profile / الملف الشخصي"
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

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Tablet/Mobile Academic Year & Semester Switcher */}
            <div className="lg:hidden mb-3">
              <AcademicTermSwitcher canAddYear={role === 'admin' || role === 'mudir'} />
            </div>
            {/* Breadcrumb Navigation with Academic Year & Semester (Shown on Principal & Admin only) */}
            {(role === 'admin' || role === 'mudir') && <BreadcrumbNav canAddYear={true} />}
            {children}
          </div>
        </main>

        {/* Bottom Footer Bar (Positioned inside main column so it never appears on or bothers the sidebar) */}
        <footer className="bg-[#dfd4b8] border-t-2 border-[#ccbf99] text-slate-800 py-2.5 px-4 sm:px-8 z-20 shrink-0 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-bold font-serif" dir="rtl">
            {/* Office Hours */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#126b38]" />
              <span>أوقات الدوام:</span>
              <span className="font-mono text-slate-950 font-black">
                {toHindiNumerals('8:00')} ص - {toHindiNumerals('12:00')} م ({toHindiNumerals('8:00')} AM - {toHindiNumerals('12:00')} PM)
              </span>
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
              <span className="font-mono text-slate-950 font-black" dir="ltr">
                {toHindiNumerals('09123456789')}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Column: Fixed Sidebar (Full height on right, independent from header & footer) */}
      <aside
        className={`fixed md:static inset-y-0 right-0 z-50 md:z-30 w-64 lg:w-72 h-full shrink-0 bg-[#126b38] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out border-l border-[#0e582e] shadow-2xl md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Top: Crest Logo & Institution Title (Fixed at top of sidebar) */}
        <div className="p-3.5 border-b border-emerald-800/80 bg-emerald-950/25 text-center relative shrink-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-3 left-3 p-1 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Well-proportioned Crest Logo (60x60px) */}
          <div
            style={{ width: '60px', height: '60px' }}
            className="w-16 h-16 mx-auto rounded-full bg-white p-1 border-2 border-amber-400 shadow-md flex items-center justify-center overflow-hidden"
          >
            <img
              src="/logo.png"
              alt="JMAA Emblem"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          {/* Institution Title */}
          <h2 className="mt-2 font-black text-sm lg:text-base text-white leading-tight font-sans tracking-tight">
            Jamiatu Monib Alkuzbary
          </h2>
          <div className="mt-1 flex justify-center">
            <SchoolArabicTitle
              variant="light"
              imgClassName="h-6 w-auto object-contain drop-shadow"
              fallbackClassName="text-[11px] text-amber-200/90 font-serif font-bold"
            />
          </div>

          {/* Dedicated Portal Badge */}
          <div className="mt-2 mx-auto px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300 font-sans">
              {roleInfo.portalTitleEn}
            </span>
            <span className="block text-[10px] text-amber-200/80 font-serif" dir="rtl">
              {roleInfo.portalTitleAr}
            </span>
          </div>
        </div>

        {/* Scrollable Pill Navigation Buttons */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {navItems.map((item, idx) => {
            const active = isCurrent(item.href);
            return (
              <Link
                key={item.href + idx}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`block w-full py-2 px-3 rounded-2xl text-center transition-all shadow-xs ${
                  active
                    ? 'bg-[#9f7a28] text-white border border-[#7a5c1b] ring-2 ring-amber-300/40 shadow-md font-bold'
                    : 'bg-[#dfd3b7] hover:bg-[#d8cca9] text-slate-900 border border-[#cfc39f]'
                }`}
              >
                <span className="block font-black text-xs sm:text-[13px] tracking-wide leading-tight">
                  {item.labelEn}
                </span>
                <span className="block text-[11px] font-serif opacity-80 leading-tight mt-0.5" dir="rtl">
                  {item.labelAr}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: © Ryan Madid */}
        <div className="p-3 border-t border-emerald-800/60 bg-emerald-950/40 text-center text-xs text-amber-200/90 font-sans font-bold shrink-0">
          <span>&copy; Ryan Madid</span>
        </div>
      </aside>
    </div>
  );
}
