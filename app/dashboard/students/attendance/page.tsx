'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { StudentItem, ClassItem, SubjectItem, StudentAttendanceItem } from '@/lib/types';
import { Calendar, CheckCircle2, XCircle, CheckCircle, Save, Filter } from 'lucide-react';

export default function StudentAttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<StudentAttendanceItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Roll call statuses map: rollNo -> boolean (true: Present, false: Absent)
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = () => {
    const cls = DataStore.getClasses();
    const sub = DataStore.getSubjects();
    const std = DataStore.getStudents();
    setClasses(cls);
    setSubjects(sub);
    setStudents(std);
    setAttendanceLogs(DataStore.getStudentAttendance());

    if (cls.length > 0 && selectedClassId === 0) {
      setSelectedClassId(cls[0].ClassID);
      const matchedSubs = sub.filter(s => s.ClassID === cls[0].ClassID);
      if (matchedSubs.length > 0) setSelectedSubjectId(matchedSubs[0].SubjectID);
    }
  };

  // Sync attendance for selected class, subject, date
  const classStudents = students.filter(s => s.ClassID === selectedClassId);

  useEffect(() => {
    const currentLogs = DataStore.getStudentAttendance();
    const newMap: Record<string, boolean> = {};
    classStudents.forEach(s => {
      const found = currentLogs.find(
        a => a.ClassID === selectedClassId && a.SubjectID === selectedSubjectId && a.RollNo === s.RollNo && a.Date === selectedDate
      );
      newMap[s.RollNo] = found ? found.Status : true; // Default present
    });
    setStatusMap(newMap);
  }, [selectedClassId, selectedSubjectId, selectedDate, students]);

  const toggleStatus = (rollNo: string) => {
    setStatusMap(prev => ({ ...prev, [rollNo]: !prev[rollNo] }));
  };

  const handleSave = () => {
    const records = classStudents.map(s => ({
      ClassID: selectedClassId,
      SubjectID: selectedSubjectId,
      RollNo: s.RollNo,
      Status: statusMap[s.RollNo] ?? true,
      Date: selectedDate,
    }));

    DataStore.recordStudentAttendance(records);
    setAttendanceLogs(DataStore.getStudentAttendance());
    setMsg(`Attendance for ${classStudents.length} students recorded successfully for ${selectedDate}!`);
    setTimeout(() => setMsg(null), 3000);
  };

  const markAll = (status: boolean) => {
    const newMap: Record<string, boolean> = {};
    classStudents.forEach(s => {
      newMap[s.RollNo] = status;
    });
    setStatusMap(newMap);
  };

  const getClassName = (cid: number) => classes.find(c => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  const getSubjectName = (sid: number) => subjects.find(s => s.SubjectID === sid)?.SubjectClass || `Subject #${sid}`;

  const availableSubjects = subjects.filter(s => s.ClassID === selectedClassId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-600" />
          Student Attendance
        </h1>
        <p className="text-sm text-slate-500">Record and inspect daily subject attendance roll-call</p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {msg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Class Grade</label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              const cid = Number(e.target.value);
              setSelectedClassId(cid);
              const subs = subjects.filter(s => s.ClassID === cid);
              if (subs.length > 0) setSelectedSubjectId(subs[0].SubjectID);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            {classes.map(c => (
              <option key={c.ClassID} value={c.ClassID}>{c.ClassName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            {availableSubjects.map(s => (
              <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectClass}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>
      </div>

      {/* Roll Call Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Roll Call: {getClassName(selectedClassId)} - {getSubjectName(selectedSubjectId)} ({selectedDate})
            </h2>
            <p className="text-xs text-slate-500">Click student status button to toggle Present / Absent</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll(true)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
            >
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer ml-2"
            >
              <Save className="w-3.5 h-3.5" />
              Save Record
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400">
                    No students registered in this class.
                  </td>
                </tr>
              ) : (
                classStudents.map((s) => {
                  const isPresent = statusMap[s.RollNo] ?? true;
                  return (
                    <tr key={s.StudentID} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{s.RollNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.Name}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{getClassName(s.ClassID)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.RollNo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Absent
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
