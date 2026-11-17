'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import AcademicTermSwitcher from '@/app/dashboard/components/AcademicTermSwitcher';
import SchoolArabicTitle from '@/app/components/SchoolArabicTitle';
import {
  ShieldCheck,
  Crown,
  Wallet,
  GraduationCap,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Lock,
  User,
  Award,
  Sparkles,
  BookOpen,
  Users,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = AuthService.login(username, password);
      if (res.success) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      } else {
        setError(res.error || 'Login failed. Please check credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const fillDemoAccount = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'mudir') {
      setUsername('mudir');
      setPassword('mudir123');
    } else if (role === 'cashier') {
      setUsername('cashier');
      setPassword('cashier123');
    } else if (role === 'teacher') {
      setUsername('teacher@school.edu');
      setPassword('teacher123');
    } else if (role === 'ssg') {
      setUsername('ssg');
      setPassword('ssg123');
    } else {
      setUsername('R101');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 relative overflow-hidden flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.16),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(245,158,11,0.12),_transparent_55%)]" />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Official School Identity & Campus Advertising Showcase */}
        <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
          {/* Logo + Arabic Calligraphy Title + English Name */}
          <div className="flex flex-col sm:flex-row items-center lg:items-center gap-4 justify-center lg:justify-start">
            <div className="w-24 h-24 rounded-3xl bg-white p-2 shadow-2xl shadow-emerald-950/50 ring-4 ring-amber-400/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="Jamiatu Monib Alkuzbary Al-Arabia Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-center lg:justify-start">
                <SchoolArabicTitle
                  variant="light"
                  imgClassName="h-14 sm:h-16 w-auto object-contain drop-shadow-lg"
                  fallbackClassName="text-2xl sm:text-3xl font-bold text-amber-300 font-serif tracking-wide"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Jamiatu Monib Alkuzbary Al-Arabia
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wider uppercase">
                <span>Portal: JMAA-MoritAko</span>
              </div>
            </div>
          </div>

          {/* Campus Advertising Showcase Card */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-amber-300/40 relative overflow-hidden">
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900 text-amber-300 text-[11px] font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Main Campus &bull; Admissions Open</span>
              </span>
              <span className="text-xs font-serif font-bold text-emerald-900" dir="rtl">
                التسجيل والقبول مفتوح
              </span>
            </div>

            <div className="rounded-2xl bg-gradient-to-b from-sky-50/70 via-white to-white px-2 pt-2 pb-1">
              <img
                src="/school-building.jpg"
                alt="Jamiatu Monib Alkuzbary Al-Arabia School Building"
                className="w-full h-56 sm:h-64 object-contain mx-auto"
              />
            </div>

            {/* Advertising Highlights Strip */}
            <div className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                <p className="text-sm font-extrabold text-amber-300 tracking-tight">
                  Excellence in Arabic &amp; Islamic Education
                </p>
                <p className="text-xs font-serif text-emerald-200" dir="rtl">
                  التميز في التعليم العربي والإسلامي
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-emerald-100">
                <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2.5 py-2">
                  <GraduationCap className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>6-Dawr Academic System</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2.5 py-2">
                  <BookOpen className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>Digital E-Library</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2.5 py-2">
                  <Users className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>Unified Portal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="lg:col-span-6 w-full max-w-xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-3xl sm:px-9 border border-white/20">
          
          {/* 6-Role Fast Switcher */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Demo Role (الحسابات التجريبية)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'admin'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Super Admin"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('mudir')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'mudir'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Principal / Mudir / Dean"
              >
                <Crown className="w-4 h-4" />
                <span>Mudir</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('cashier')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'cashier'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Cashier & Finance"
              >
                <Wallet className="w-4 h-4" />
                <span>Cashier</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('teacher')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'teacher'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Teacher / Faculty"
              >
                <UserCheck className="w-4 h-4" />
                <span>Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('student')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'student'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Student / Talib"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('ssg')}
                className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'ssg'
                    ? 'bg-rose-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="SSG Student Council (مجلس الطلبة / رصد النشاط)"
              >
                <Award className="w-4 h-4" />
                <span>مجلس الطلبة</span>
              </button>
            </div>

            {/* Principal (Yawmain / Khamsat Ayyam) & 4 College Deans Selector */}
            {selectedRole === 'mudir' && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2" dir="rtl">
                <div className="text-[11px] font-serif font-black text-amber-950 flex items-center justify-between">
                  <span>اختر حساب المدير أو عميد الكلية المختص:</span>
                  <span className="font-mono text-[10px] text-amber-800">Password: mudir123</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-serif">
                  {[
                    { user: 'mudir', label: '🌟 المدير العام (كامل الصلاحيات)' },
                    { user: 'mudir.2days@jmaa.edu', label: 'مدير القسم الأسبوعي - يومين' },
                    { user: 'mudir.5days@jmaa.edu', label: 'مدير القسم الصباحي - خمسة أيام' },
                    { user: 'dean.tarbiyah2@jmaa.edu', label: '١. عميد كلية التربية والدراسات - يومين' },
                    { user: 'dean.shariah@jmaa.edu', label: '٢. عميد كلية الشريعة - خمسة أيام' },
                    { user: 'dean.dawah@jmaa.edu', label: '٣. عميد كلية الدعوة - خمسة أيام' },
                    { user: 'dean.tarbiyah5@jmaa.edu', label: '٤. عميد كلية التربية - خمسة أيام' },
                  ].map(item => (
                    <button
                      key={item.user}
                      type="button"
                      onClick={() => {
                        setUsername(item.user);
                        setPassword('mudir123');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-right font-bold transition-all cursor-pointer ${
                        username === item.user
                          ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                          : 'bg-white hover:bg-amber-100/70 text-slate-800 border-amber-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide">Login Failure</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Username / Email / ID
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Academic Year & Semester (السنة الدراسية والفصل)
              </label>
              <AcademicTermSwitcher canAddYear={false} />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <span>Enter JMAA-MoritAko Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Guide */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2 text-center">
              Active Role Credentials
            </p>
            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p><span className="font-bold text-slate-800">Admin:</span> admin / admin123</p>
              <p><span className="font-bold text-slate-800">Mudir:</span> mudir / mudir123</p>
              <p><span className="font-bold text-slate-800">Cashier:</span> cashier / cashier123</p>
              <p><span className="font-bold text-slate-800">Teacher:</span> teacher@school.edu / teacher123</p>
              <p><span className="font-bold text-slate-800">Student:</span> R101 / student123</p>
            </div>
          </div>
        </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Jamiatu Monib Alkuzbary Al-Arabia &bull; JMAA-MoritAko &bull; Vercel Serverless Ready
          </p>
        </div>
      </div>
    </div>
  );
}
