'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { TeacherItem, StudentItem, UserRole } from '@/lib/types';
import {
  UserCog,
  KeyRound,
  ShieldCheck,
  Trash2,
  Edit,
  CheckCircle,
  Search,
  UserCheck,
  GraduationCap,
  Crown,
  Wallet
} from 'lucide-react';

export default function UserAccountsPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [search, setSearch] = useState('');

  // Password reset modal
  const [resettingUser, setResettingUser] = useState<{ id: number; name: string; type: 'teacher' | 'student' } | null>(null);
  const [newPassword, setNewPassword] = useState('password123');

  // Role Promotion modal
  const [promotingTeacher, setPromotingTeacher] = useState<TeacherItem | null>(null);
  const [targetRole, setTargetRole] = useState<'teacher' | 'mudir' | 'admin' | 'cashier'>('teacher');

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTeachers(DataStore.getTeachers());
    setStudents(DataStore.getStudents());
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim()) return;

    if (resettingUser.type === 'teacher') {
      const t = teachers.find(tch => tch.TeacherID === resettingUser.id);
      if (t) {
        DataStore.saveTeacher({ ...t, Password: newPassword.trim() });
      }
    }

    setMsg(`Password for ${resettingUser.name} has been successfully reset!`);
    setResettingUser(null);
    setNewPassword('password123');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleRolePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingTeacher) return;

    const isMudir = targetRole === 'mudir';
    DataStore.saveTeacher({
      ...promotingTeacher,
      IsMudir: isMudir,
      Remarks: `Promoted to ${targetRole.toUpperCase()} by Administrator`,
    });

    setMsg(`Role of ${promotingTeacher.Name} has been updated to ${targetRole.toUpperCase()}!`);
    setPromotingTeacher(null);
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteTeacher = (id: number) => {
    if (confirm('Delete this faculty account?')) {
      DataStore.deleteTeacher(id);
      loadData();
    }
  };

  const handleDeleteStudent = (id: number) => {
    if (confirm('Delete this student account?')) {
      DataStore.deleteStudent(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-emerald-800" />
            <span>User Accounts & Role Permissions</span>
          </h1>
          <p className="text-sm text-slate-500">
            Reset passwords, manage security credentials, and promote staff members.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search account name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Faculty & Staff Accounts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-900">
            Faculty & Personnel Accounts ({teachers.length})
          </h2>
          <span className="text-xs font-bold text-slate-500">Roles: Mudir, Teacher, Staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Account Holder</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Role / Title</th>
                <th className="py-3 px-4 text-right">Security & Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers
                .filter(t => t.Name.toLowerCase().includes(search.toLowerCase()) || (t.Email || '').toLowerCase().includes(search.toLowerCase()))
                .map(t => (
                  <tr key={t.TeacherID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-600">#{t.TeacherID}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {t.Name}
                      {t.NameArabic && <span className="text-xs text-amber-700 font-serif block font-normal">{t.NameArabic}</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-mono">{t.Email}</td>
                    <td className="py-3 px-4">
                      {t.IsMudir ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Crown className="w-3 h-3" /> Mudir / Principal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          <UserCheck className="w-3 h-3" /> Teacher
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setPromotingTeacher(t)}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        Promote Role
                      </button>
                      <button
                        type="button"
                        onClick={() => setResettingUser({ id: t.TeacherID, name: t.Name, type: 'teacher' })}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(t.TeacherID)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Accounts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-900">
            Student Accounts ({students.length})
          </h2>
          <span className="text-xs font-bold text-slate-500">Learners</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Default Login Password</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students
                .filter(s => s.Name.toLowerCase().includes(search.toLowerCase()) || (s.RollNo || '').toLowerCase().includes(search.toLowerCase()))
                .map(s => (
                  <tr key={s.StudentID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{s.RollNo}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.Name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">{s.IdNumber}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">student123 (or roll no)</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(s.StudentID)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Reset Password for {resettingUser.name}
            </h3>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Promotion Modal */}
      {promotingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Promote Role for {promotingTeacher.Name}
            </h3>
            <form onSubmit={handleRolePromotion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Select New Role Title *</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="teacher">Teacher (مدرس)</option>
                  <option value="mudir">Mudir / Principal / Dean (مدير / عميد)</option>
                  <option value="cashier">Cashier & Finance (أمين الصندوق)</option>
                  <option value="admin">System Administrator (مشرف نظام)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Confirm Promotion
                </button>
                <button
                  type="button"
                  onClick={() => setPromotingTeacher(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
