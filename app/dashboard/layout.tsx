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
  UserCheck
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

  // Role badge color helper
  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return { label: 'Admin (المشرف)', bg: 'bg-red-600', icon: ShieldCheck };
      case 'mudir':
        return { label: 'Mudir / Dean (المدير)', bg: 'bg-amber-600', icon: Crown };
      case 'cashier':
        return { label: 'Cashier (أمين الصندوق)', bg: 'bg-blue-600', icon: Wallet };
      case 'teacher':
        return { label: 'Teacher (أستاذ)', bg: 'bg-purple-600', icon: UserCheck };
      case 'student':
        return { label: 'Student (طالب)', bg: 'bg-teal-600', icon: GraduationCap };
    }
  };

  const badge = getRoleBadge(role);
  const BadgeIcon = badge.icon;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-emerald-950 text-white shadow-lg z-30 sticky top-0 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-emerald-800 focus:outline-none cursor-pointer lg:hidden"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-amber-400 rounded-xl shadow text-emerald-950 font-bold">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    Jamiatu Monib Alkuzbary Al-Arabia
                  </span>
                  <span className="hidden sm:inline-block text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                    JMAA-MoritAko
                  </span>
                </div>
                <div className="text-xs text-amber-200/90 font-serif" dir="rtl">
                  جامعة منيب الكزبري العربية
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-white">{currentUser.name}</span>
              <span className="text-xs text-emerald-300 flex items-center gap-1 justify-end">
                <span className={`w-2 h-2 rounded-full ${badge.bg}`}></span>
                {badge.label}
              </span>
            </div>

            <Link
              href="/dashboard/profile"
              className="w-9 h-9 rounded-full bg-emerald-700 hover:ring-2 hover:ring-amber-400 flex items-center justify-center text-white overflow-hidden shadow transition-all"
              title="My Profile"
            >
              {currentUser.profilePic ? (
                <img src={currentUser.profilePic} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600/90 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer shadow"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out border-r border-slate-800 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Profile Card in Sidebar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow ${badge.bg}`}>
                <BadgeIcon className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-amber-300 truncate">{badge.label}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm font-medium">
            
            {/* 1. Dashboard Overview */}
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-emerald-400" />
              <span>Dashboard Home</span>
            </Link>

            {/* 2. Departments & Classes */}
            <Link
              href="/dashboard/classes"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard/classes')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5 text-blue-400" />
              <span>Departments & Classes</span>
            </Link>

            {/* 3. Class Schedules */}
            <Link
              href="/dashboard/schedules"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard/schedules')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Class Schedules</span>
            </Link>

            {/* 4. Grades & Evaluation (6 Gradings / Dawr) */}
            <Link
              href="/dashboard/grades"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard/grades')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-5 h-5 text-rose-400" />
              <span>Grades & 6-Dawr Matrix</span>
            </Link>

            {/* 5. Honor Roll & Tops */}
            <Link
              href="/dashboard/honors"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard/honors')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-5 h-5 text-yellow-400" />
              <span>Honor Roll & Top Scholars</span>
            </Link>

            {/* 6. Subjects / Curriculum */}
            {(role === 'admin' || role === 'mudir' || role === 'teacher') && (
              <Link
                href="/dashboard/subjects"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/subjects')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Curriculum & Subjects</span>
              </Link>
            )}

            {/* 7. Faculty & Staff Directory */}
            {(role === 'admin' || role === 'mudir') && (
              <Link
                href="/dashboard/teachers"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/teachers')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 text-purple-400" />
                <span>Faculty & Teachers</span>
              </Link>
            )}

            {/* Teacher Subject Allocation */}
            {(role === 'admin' || role === 'mudir') && (
              <Link
                href="/dashboard/teachers/assignments"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/teachers/assignments')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-5 h-5 text-pink-400" />
                <span>Teacher Subject Allocation</span>
              </Link>
            )}

            {/* 8. Students Directory */}
            {role !== 'student' && (
              <Link
                href="/dashboard/students"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/students')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <GraduationCap className="w-5 h-5 text-teal-400" />
                <span>Student Directory</span>
              </Link>
            )}

            {/* 9. Attendance & Audit */}
            {(role === 'admin' || role === 'mudir' || role === 'teacher') && (
              <Link
                href="/dashboard/attendance"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/attendance')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CalendarCheck className="w-5 h-5 text-indigo-400" />
                <span>Attendance & Audit</span>
              </Link>
            )}

            {/* 10. Finance & Cashier Module */}
            {(role === 'admin' || role === 'mudir' || role === 'cashier' || role === 'teacher' || role === 'student') && (
              <Link
                href="/dashboard/finance"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/finance')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>
                  {role === 'cashier' ? 'Cashier & Tuition Matrix' : role === 'student' ? 'My Billings & Receipts' : 'Finance & Payroll'}
                </span>
              </Link>
            )}

            {/* 11. Announcements */}
            <Link
              href="/dashboard/announcements"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard/announcements')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Megaphone className="w-5 h-5 text-orange-400" />
              <span>Announcements</span>
            </Link>

            {/* 12. Form Builder (Admin) */}
            {role === 'admin' && (
              <Link
                href="/dashboard/forms"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/forms')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-sky-400" />
                <span>Form Templates</span>
              </Link>
            )}

            {/* 13. User Accounts (Admin) */}
            {role === 'admin' && (
              <Link
                href="/dashboard/accounts"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isCurrent('/dashboard/accounts')
                    ? 'bg-emerald-700 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCog className="w-5 h-5 text-violet-400" />
                <span>User Accounts & Roles</span>
              </Link>
            )}

            {/* 14. Profile */}
            <Link
              href="/dashboard/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isCurrent('/dashboard/profile')
                  ? 'bg-emerald-700 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-5 h-5 text-pink-400" />
              <span>Personal Profile</span>
            </Link>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span>v2.0 &bull; JMAA-MoritAko</span>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
