'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  UserSession,
  ClassItem,
  SubjectItem,
  StudentItem,
  TeacherItem,
  StudentGradeItem,
  SubjectTeacherItem,
  GradingPeriod,
} from '@/lib/types';
import {
  Users,
  GraduationCap,
  User,
  ChevronDown,
  Award,
  BookOpen,
  ClipboardList,
  ArrowUpRight,
  UserCheck,
  Star,
} from 'lucide-react';

const GRADING_LIST: GradingPeriod[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

const GRADING_LABELS: Record<GradingPeriod, { en: string; ar: string }> = {
  '1st': { en: '1st Grading', ar: 'دور الأول' },
  '2nd': { en: '2nd Grading', ar: 'دور الثاني' },
  '3rd': { en: '3rd Grading', ar: 'دور الثالث' },
  '4th': { en: '4th Grading', ar: 'دور الرابع' },
  '5th': { en: '5th Grading', ar: 'دور الخامس' },
  '6th': { en: '6th Grading', ar: 'دور السادس' },
};

function getRating(score: number | null): { labelAr: string; labelEn: string; pillClass: string } {
  if (score === null || score === undefined || isNaN(score)) {
    return { labelAr: '-', labelEn: 'N/A', pillClass: 'bg-slate-100 text-slate-500' };
  }
  if (score >= 90) return { labelAr: 'ممتاز', labelEn: 'Excellent', pillClass: 'bg-green-100 text-green-800' };
  if (score >= 80) return { labelAr: 'جيد جدا', labelEn: 'Very Good', pillClass: 'bg-yellow-100 text-yellow-800' };
  if (score >= 70) return { labelAr: 'جيد', labelEn: 'Good', pillClass: 'bg-orange-100 text-orange-800' };
  if (score >= 60) return { labelAr: 'مقبول', labelEn: 'Acceptable', pillClass: 'bg-red-100 text-red-700' };
  return { labelAr: 'راسب', labelEn: 'Fail', pillClass: 'bg-red-200 text-red-900 font-black' };
}

export default function TeacherAdviseeGradesPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);

  // UI state
  const [selectedGrading, setSelectedGrading] = useState<GradingPeriod>('1st');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'class' | 'student'>('class');

  useEffect(() => {
    const session = AuthService.getSession();
    setCurrentUser(session);

    setClasses(DataStore.getClasses());
    setSubjects(DataStore.getSubjects());
    setStudents(DataStore.getStudents());
    setTeachers(DataStore.getTeachers());
    setGrades(DataStore.getGrades());
    setSubjectTeachers(DataStore.getSubjectTeachers());
  }, []);

  const teacherId = currentUser?.linkedId;
  const teacher = teachers.find(t => t.TeacherID === teacherId);

  // Advisee classes = classes where this teacher is the AdviserID
  const adviseeClasses = useMemo(
    () => classes.filter(c => c.AdviserID === teacherId),
    [classes, teacherId]
  );

  // Students in the advisee classes
  const adviseeStudents = useMemo(
    () => students.filter(s => adviseeClasses.some(c => c.ClassID === s.ClassID)),
    [students, adviseeClasses]
  );

  const selectedStudent = selectedStudentId
    ? adviseeStudents.find(s => s.StudentID === selectedStudentId) || null
    : null;

  // Subjects of the selected student's class (or class overview)
  const getSubjectsForClass = (classId: number) =>
    subjects.filter(s => s.ClassID === classId);

  const getGradeScore = (studentId: number, subjectId: number, period: GradingPeriod): number | null => {
    const g = grades.find(
      gr => gr.StudentID === studentId && gr.SubjectID === subjectId && gr.Period === period
    );
    return g && typeof g.FinalGrade === 'number' ? g.FinalGrade : null;
  };

  // Per-student summary across all gradings
  const getStudentSummary = (student: StudentItem) => {
    const classSubjects = getSubjectsForClass(student.ClassID);
    const periodScores = GRADING_LIST.map(period => {
      const scores = classSubjects
        .map(s => getGradeScore(student.StudentID, s.SubjectID, period))
        .filter(s => s !== null) as number[];
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return { period, avg };
    });
    const overall = periodScores
      .filter(p => p.avg !== null)
      .map(p => p.avg as number);
    const overallAvg = overall.length > 0 ? overall.reduce((a, b) => a + b, 0) / overall.length : null;
    return { periodScores, overallAvg, classSubjects };
  };

  if (!currentUser || currentUser.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-400">
        <p>Access restricted to teachers only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-800">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Class Advisee</h1>
            <p className="text-xs text-slate-500 font-serif" dir="rtl">الفصل المشرف عليه — درجات الطلاب</p>
          </div>
        </div>

        {/* Teacher Info Pill */}
        {teacher && (
          <div className="flex items-center gap-2 bg-[#dfd4b8] border border-[#ccbf99] rounded-2xl px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-[#126b38] overflow-hidden flex items-center justify-center">
              {teacher.ProfilePic ? (
                <img src={teacher.ProfilePic} alt={teacher.Name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900" dir="rtl">{teacher.NameArabic || teacher.Name}</p>
              <p className="text-[10px] text-slate-500 font-sans">{teacher.Name} · Class Adviser</p>
            </div>
          </div>
        )}
      </div>

      {/* No Advisee Classes */}
      {adviseeClasses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <UserCheck className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="font-bold text-amber-800">No advisee class assigned yet.</p>
          <p className="text-xs text-amber-600 mt-1 font-serif" dir="rtl">لم يتم تعيينك مشرفاً لأي فصل حتى الآن.</p>
        </div>
      )}

      {adviseeClasses.length > 0 && (
        <>
          {/* Advisee Class Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adviseeClasses.map(cls => {
              const clsStudents = adviseeStudents.filter(s => s.ClassID === cls.ClassID);
              return (
                <div key={cls.ClassID} className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-[#126b38]/10 text-[#126b38]">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b79e55] text-slate-950 font-serif">
                        {cls.Level}
                      </span>
                      <span className="ml-1.5 text-[10px] font-mono text-slate-600 uppercase">{cls.Department}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 font-serif" dir="rtl">{cls.ClassName}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[#126b38] font-bold">
                      <Users className="w-3.5 h-3.5" />
                      {clsStudents.length} Students
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      {getSubjectsForClass(cls.ClassID).length} Subjects
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls: View Mode + Grading Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === 'class' ? 'bg-[#126b38] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Class Overview
              </button>
              <button
                onClick={() => setViewMode('student')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === 'student' ? 'bg-[#126b38] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Student Detail
              </button>
            </div>

            {/* Grading Period Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Grading:</span>
              <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
                {GRADING_LIST.map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedGrading(period)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${selectedGrading === period
                      ? 'bg-[#9f7a28] text-white ring-2 ring-amber-300/40 shadow'
                      : 'bg-[#dfd4b8] text-slate-800 border border-[#ccbf99] hover:bg-[#d4c6a4]'
                      }`}
                  >
                    <span className="font-sans text-[11px]">{GRADING_LABELS[period].en}</span>
                    <span className="block font-serif text-[9px] opacity-80">{GRADING_LABELS[period].ar}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Student Selector (when in student view) */}
            {viewMode === 'student' && (
              <div className="relative">
                <select
                  value={selectedStudentId ?? ''}
                  onChange={e => setSelectedStudentId(Number(e.target.value) || null)}
                  className="pl-3 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-800 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#126b38]/30"
                >
                  <option value="">-- Select Student --</option>
                  {adviseeStudents.map(s => (
                    <option key={s.StudentID} value={s.StudentID}>
                      {s.Name} ({s.RollNo})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* ============================================================
              CLASS OVERVIEW MODE: All students × subjects for selected grading
          ============================================================ */}
          {viewMode === 'class' && (
            <div className="space-y-6">
              {adviseeClasses.map(cls => {
                const clsStudents = adviseeStudents.filter(s => s.ClassID === cls.ClassID);
                const clsSubjects = getSubjectsForClass(cls.ClassID);
                if (clsStudents.length === 0) return null;

                return (
                  <div key={cls.ClassID} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-[#126b38] px-5 py-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-white font-serif" dir="rtl">{cls.ClassName}</h3>
                        <p className="text-[11px] text-emerald-200 font-sans">
                          {GRADING_LABELS[selectedGrading].en} · {GRADING_LABELS[selectedGrading].ar}
                          &nbsp;·&nbsp; {clsStudents.length} Students
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#b79e55] text-slate-950 text-[10px] font-black rounded-full">
                          {cls.Level}
                        </span>
                      </div>
                    </div>

                    {/* Grades Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#b79e55]/20 border-b border-[#ccbf99]">
                            <th className="text-left px-4 py-3 font-black text-slate-700 whitespace-nowrap">Student</th>
                            <th className="text-left px-3 py-3 font-black text-slate-700 whitespace-nowrap">Roll No</th>
                            {clsSubjects.map(sub => (
                              <th key={sub.SubjectID} className="text-center px-3 py-3 font-black text-slate-700 whitespace-nowrap">
                                <span className="block font-serif" dir="rtl">{sub.SubjectArabic}</span>
                                <span className="block font-sans text-[10px] text-slate-500">{sub.SubjectClass.split(' ')[0]}</span>
                              </th>
                            ))}
                            <th className="text-center px-3 py-3 font-black text-slate-700 bg-amber-50/50 whitespace-nowrap">Average</th>
                            <th className="text-center px-3 py-3 font-black text-slate-700 bg-amber-50/50 whitespace-nowrap">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clsStudents.map((student, idx) => {
                            const rowScores = clsSubjects.map(sub =>
                              getGradeScore(student.StudentID, sub.SubjectID, selectedGrading)
                            );
                            const validScores = rowScores.filter(s => s !== null) as number[];
                            const avg = validScores.length > 0
                              ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
                              : null;
                            const rating = getRating(avg);

                            return (
                              <tr
                                key={student.StudentID}
                                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                onClick={() => {
                                  setSelectedStudentId(student.StudentID);
                                  setViewMode('student');
                                }}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-[#126b38]/10 overflow-hidden flex-shrink-0">
                                      {student.ProfilePic ? (
                                        <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-3.5 h-3.5 text-[#126b38]" />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 whitespace-nowrap">{student.Name}</p>
                                      <p className="text-[10px] text-slate-400 font-serif" dir="rtl">{student.NameArabic}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 font-mono font-bold text-slate-600 text-center">{student.RollNo}</td>
                                {rowScores.map((score, i) => {
                                  const r = getRating(score);
                                  return (
                                    <td key={i} className="px-3 py-3 text-center">
                                      {score !== null ? (
                                        <span className={`inline-block px-2 py-0.5 rounded-lg font-black ${r.pillClass}`}>
                                          {score}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-3 text-center bg-amber-50/30">
                                  {avg !== null ? (
                                    <span className="font-black text-slate-900">{avg}</span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center bg-amber-50/30">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${rating.pillClass}`}>
                                    {rating.labelEn}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================
              STUDENT DETAIL MODE: One student, all subjects, all 6 gradings
          ============================================================ */}
          {viewMode === 'student' && (
            <div>
              {!selectedStudentId ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold">Select a student from the dropdown above</p>
                  <p className="text-xs font-serif mt-1" dir="rtl">اختر طالباً من القائمة أعلاه لعرض درجاته</p>
                </div>
              ) : selectedStudent ? (
                <div className="space-y-4">
                  {/* Student Profile Banner */}
                  <div className="bg-[#126b38] rounded-3xl p-5 flex items-center gap-5 text-white shadow-md">
                    <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden flex-shrink-0 border-2 border-amber-300">
                      {selectedStudent.ProfilePic ? (
                        <img src={selectedStudent.ProfilePic} alt={selectedStudent.Name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-7 h-7 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full uppercase">
                          Class Advisee
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 text-emerald-200 text-[10px] font-mono rounded-full">
                          {selectedStudent.RollNo}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-white font-sans">{selectedStudent.Name}</h2>
                      <p className="text-sm text-amber-200 font-serif" dir="rtl">{selectedStudent.NameArabic}</p>
                      <p className="text-xs text-emerald-200 mt-1">
                        {classes.find(c => c.ClassID === selectedStudent.ClassID)?.ClassName}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-emerald-200 mb-1">ID</p>
                      <p className="font-mono font-black text-white text-xs">{selectedStudent.IdNumber}</p>
                    </div>
                  </div>

                  {/* 6-Grading Summary Row */}
                  {(() => {
                    const summary = getStudentSummary(selectedStudent);
                    return (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {summary.periodScores.map(({ period, avg }) => {
                          const r = getRating(avg);
                          const isActive = selectedGrading === period;
                          return (
                            <button
                              key={period}
                              onClick={() => setSelectedGrading(period)}
                              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${isActive
                                ? 'bg-[#9f7a28] text-white border-amber-600 shadow-md ring-2 ring-amber-300/40'
                                : 'bg-white border-slate-200 hover:border-[#126b38]/40 hover:bg-emerald-50/30'
                                }`}
                            >
                              <p className={`text-[10px] font-bold ${isActive ? 'text-amber-200' : 'text-slate-400'}`}>
                                {GRADING_LABELS[period].en}
                              </p>
                              <p className={`font-serif text-[9px] ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>
                                {GRADING_LABELS[period].ar}
                              </p>
                              {avg !== null ? (
                                <p className={`text-lg font-black mt-1 ${isActive ? 'text-white' : 'text-slate-900'}`}>{avg.toFixed(1)}</p>
                              ) : (
                                <p className={`text-sm mt-1 ${isActive ? 'text-amber-200' : 'text-slate-300'}`}>—</p>
                              )}
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black ${r.pillClass}`}>
                                {r.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Grade Table for Selected Grading */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-[#b79e55] px-5 py-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-950">
                          {GRADING_LABELS[selectedGrading].en} — Grades by Subject
                        </h3>
                        <p className="text-[11px] text-slate-800 font-serif" dir="rtl">
                          {GRADING_LABELS[selectedGrading].ar} — درجات المواد
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-5 py-3 font-black text-slate-700">Subject (المادة)</th>
                            <th className="text-center px-4 py-3 font-black text-slate-700">Score (الدرجة)</th>
                            <th className="text-center px-4 py-3 font-black text-slate-700">Rating (التقدير)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSubjectsForClass(selectedStudent.ClassID).map((sub, idx) => {
                            const score = getGradeScore(selectedStudent.StudentID, sub.SubjectID, selectedGrading);
                            const rating = getRating(score);
                            return (
                              <tr key={sub.SubjectID} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                <td className="px-5 py-3">
                                  <p className="font-black text-slate-900 font-serif" dir="rtl">
                                    {sub.SubjectArabic}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-sans">{sub.SubjectClass}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {score !== null ? (
                                    <span className="text-lg font-black text-slate-900">{score}</span>
                                  ) : (
                                    <span className="text-slate-300 text-base">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black ${rating.pillClass}`}>
                                      {rating.labelEn}
                                    </span>
                                    <p className="font-serif text-[10px] text-slate-400 mt-0.5" dir="rtl">
                                      {rating.labelAr}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Overall Row */}
                        {(() => {
                          const scores = getSubjectsForClass(selectedStudent.ClassID)
                            .map(sub => getGradeScore(selectedStudent.StudentID, sub.SubjectID, selectedGrading))
                            .filter(s => s !== null) as number[];
                          const avg = scores.length > 0
                            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                            : null;
                          const rating = getRating(avg);
                          return (
                            <tfoot>
                              <tr className="bg-[#dfd4b8] border-t-2 border-[#ccbf99]">
                                <td className="px-5 py-3 font-black text-slate-900">
                                  Overall Average — المعدل العام
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {avg !== null ? (
                                    <span className="text-lg font-black text-slate-900">{avg}</span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black ${rating.pillClass}`}>
                                    {rating.labelEn} · {rating.labelAr}
                                  </span>
                                </td>
                              </tr>
                            </tfoot>
                          );
                        })()}
                      </table>
                    </div>
                  </div>

                  {/* All 6 Gradings Combined Table */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-800 px-5 py-3">
                      <h3 className="text-sm font-black text-white">All 6 Gradings Overview</h3>
                      <p className="text-[11px] text-slate-300 font-serif" dir="rtl">جميع الأدوار — نظرة شاملة</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200" dir="rtl">
                            <th className="text-right px-5 py-3 font-black text-slate-700">المادة</th>
                            {GRADING_LIST.map(p => (
                              <th key={p} className={`text-center px-3 py-3 font-black whitespace-nowrap ${selectedGrading === p ? 'text-amber-700 bg-amber-50' : 'text-slate-600'}`}>
                                <span className="font-serif text-[11px]">{GRADING_LABELS[p].ar}</span>
                              </th>
                            ))}
                            <th className="text-center px-3 py-3 font-black text-slate-700 bg-amber-50/50">المعدل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSubjectsForClass(selectedStudent.ClassID).map((sub, idx) => {
                            const rowScores = GRADING_LIST.map(p =>
                              getGradeScore(selectedStudent.StudentID, sub.SubjectID, p)
                            );
                            const valid = rowScores.filter(s => s !== null) as number[];
                            const avg = valid.length > 0
                              ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
                              : null;

                            return (
                              <tr key={sub.SubjectID} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`} dir="rtl">
                                <td className="px-5 py-3">
                                  <p className="font-black text-slate-900 font-serif">{sub.SubjectArabic}</p>
                                  <p className="text-[10px] text-slate-400 font-sans" dir="ltr">{sub.SubjectClass}</p>
                                </td>
                                {rowScores.map((score, i) => {
                                  const p = GRADING_LIST[i];
                                  const r = getRating(score);
                                  const isActive = selectedGrading === p;
                                  return (
                                    <td key={i} className={`px-3 py-3 text-center ${isActive ? 'bg-amber-50' : ''}`}>
                                      {score !== null ? (
                                        <span className={`inline-block px-2 py-0.5 rounded font-black text-[11px] ${r.pillClass}`}>
                                          {score}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-3 text-center bg-amber-50/30">
                                  <span className="font-black text-slate-900">{avg !== null ? avg : '—'}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
