'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { TeacherItem, TeacherAttendanceItem } from '@/lib/types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  CheckCircle,
  Save,
  Clock,
  User,
  ShieldCheck,
  Crown
} from 'lucide-react';

export default function StaffAttendancePage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const currentUser = AuthService.getSession();
  const role = currentUser?.role;
  const canEditAttendance = role === 'admin' || role === 'mudir';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = DataStore.getTeachers();
    setTeachers(list);
    setAttendanceRecords(DataStore.getTeacherAttendance());
  };

  useEffect(() => {
    const logs = DataStore.getTeacherAttendance();
    const newMap: Record<number, boolean> = {};
    teachers.forEach(t => {
      const found = logs.find(a => a.TeacherID === t.TeacherID && a.Date === selectedDate);
      newMap[t.TeacherID] = found ? found.Status : true; // Default Present
    });
    setStatusMap(newMap);
  }, [selectedDate, teachers]);

  const toggleStatus = (tid: number) => {
    if (!canEditAttendance) return;
    setStatusMap(prev => ({ ...prev, [tid]: !prev[tid] }));
  };

  const handleSaveAttendance = () => {
    const editorIdentifier = currentUser?.name ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Principal Office';

    const recordsToSave = teachers.map(t => ({
      TeacherID: t.TeacherID,
      Status: statusMap[t.TeacherID] ?? true,
      Date: selectedDate,
      EditedBy: editorIdentifier,
    }));

    DataStore.saveTeacherAttendance(recordsToSave);
    setAttendanceRecords(DataStore.getTeacherAttendance());
    setMsg(`Staff attendance verified and saved by ${editorIdentifier} for ${selectedDate}!`);
    setTimeout(() => setMsg(null), 3500);
  };

  const markAll = (status: boolean) => {
    if (!canEditAttendance) return;
    const newMap: Record<number, boolean> = {};
    teachers.forEach(t => (newMap[t.TeacherID] = status));
    setStatusMap(newMap);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-800" />
            <span>Faculty & Personnel Attendance</span>
          </h1>
          <p className="text-sm text-slate-500">
            Daily roll call, presence verification, and administrative audit logging.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-64">
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Roster Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>

        {canEditAttendance && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={() => markAll(true)}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
            >
              All Absent
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 shadow-xs cursor-pointer ml-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Audit Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-900">
            Faculty Roster ({teachers.length} Members) &bull; Date: {selectedDate}
          </h2>
          <span className="text-xs text-slate-500">
            Click status button to toggle Present / Absent
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Degree & Title</th>
                <th className="py-3 px-4 text-center">Presence Status</th>
                <th className="py-3 px-4">Audit Trail (Editor & Timestamp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map(t => {
                const isPresent = statusMap[t.TeacherID] ?? true;
                const rec = attendanceRecords.find(a => a.TeacherID === t.TeacherID && a.Date === selectedDate);

                return (
                  <tr key={t.TeacherID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-600">#{t.TeacherID}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                          {t.Name[0]}
                        </div>
                        <div>
                          <div>{t.Name}</div>
                          {t.NameArabic && (
                            <span className="text-xs text-amber-700 font-serif font-normal">{t.NameArabic}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {t.Degree}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canEditAttendance}
                        onClick={() => toggleStatus(t.TeacherID)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        } ${!canEditAttendance ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Present (حاضر)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Absent (غائب)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Audit Trail Column */}
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {rec?.EditedBy ? (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Verified by: {rec.EditedBy}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>On: {rec.EditedAt}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No modifications logged</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
