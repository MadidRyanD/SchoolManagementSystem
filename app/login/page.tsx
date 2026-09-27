'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import {
  School,
  ShieldCheck,
  Crown,
  Wallet,
  GraduationCap,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Lock,
  User,
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
    } else {
      setUsername('R101');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-amber-400 text-slate-950 shadow-2xl shadow-emerald-500/20 mb-3 ring-4 ring-white/10">
          <School className="w-10 h-10 text-emerald-950" />
        </div>
        
        {/* Arabic Title */}
        <h3 className="text-2xl font-bold text-amber-300 font-serif tracking-wide mb-1" dir="rtl">
          جامعة منيب الكزبري العربية
        </h3>
        {/* English Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Jamiatu Monib Alkuzbary Al-Arabia
        </h1>
        {/* System Name Badge */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wider uppercase">
          <span>Portal: JMAA-MoritAko</span>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          
          {/* 5-Role Fast Switcher */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Demo Role
            </label>
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl">
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
            </div>
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

        <p className="mt-6 text-center text-xs text-slate-400">
          Jamiatu Monib Alkuzbary Al-Arabia &bull; JMAA-MoritAko &bull; Vercel Serverless Ready
        </p>
      </div>
    </div>
  );
}
