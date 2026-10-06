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
import { toHindiNumerals } from '@/lib/numerals';
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
  CheckCircle2,
  Filter,
  X,
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
  const [selectedFilterClassId, setSelectedFilterClassId] = useState<number | null>(null);

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

  const isAdminOrMudir = currentUser?.role === 'admin' || currentUser?.role === 'mudir';
  const [selectedInspectedClassId, setSelectedInspectedClassId] = useState<number>(0);

  const teacherId = currentUser?.linkedId;
  const teacher = teachers.find(t => t.TeacherID === teacherId);

  // Advisee classes = classes where this teacher is the AdviserID (or chosen by Mudir/Admin)
  const adviseeClasses = useMemo(() => {
    if (isAdminOrMudir) {
      if (selectedInspectedClassId > 0) {
        return classes.filter(c => c.ClassID === selectedInspectedClassId);
      }
      const direct = classes.filter(c => c.AdviserID === teacherId);
      return direct.length > 0 ? direct : classes.slice(0, 6);
    }
    return classes.filter(c => c.AdviserID === teacherId);
  }, [classes, teacherId, isAdminOrMudir, selectedInspectedClassId]);

  // Students in the advisee classes
  const adviseeStudents = useMemo(
    () => students.filter(s => adviseeClasses.some(c => c.ClassID === s.ClassID)),
    [students, adviseeClasses]
  );

  const displayedClasses = useMemo(() => {
    if (selectedFilterClassId !== null) {
      return adviseeClasses.filter(c => c.ClassID === selectedFilterClassId);
    }
    return adviseeClasses;
  }, [adviseeClasses, selectedFilterClassId]);

  const handleClassCardClick = (classId: number) => {
    if (selectedFilterClassId === classId) {
      setSelectedFilterClassId(null);
    } else {
      setSelectedFilterClassId(classId);
      const clsStudents = adviseeStudents.filter(s => s.ClassID === classId);
      if (clsStudents.length > 0) {
        setSelectedStudentId(clsStudents[0].StudentID);
      }
      setTimeout(() => {
        const el = document.getElementById('advisee-students-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

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

        {/* Admin / Mudir Class Selector */}
        {isAdminOrMudir && (
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-2xl px-3 py-1.5 shadow-xs">
            <span className="text-xs font-bold text-slate-500">Inspect Class:</span>
            <select
              value={selectedInspectedClassId}
              onChange={(e) => setSelectedInspectedClassId(Number(e.target.value))}
              className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={0}>Default Advisee Classes</option>
              {classes.map((c) => (
                <option key={c.ClassID} value={c.ClassID}>
                  [{c.Department.toUpperCase()}] {c.ClassName}
                </option>
              ))}
            </select>
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
          {/* Advisee Class Info Cards - Clickable to filter students */}
          <div className="space-y-3">
            <div className="flex items-center justify-between" dir="rtl">
              <span className="text-xs font-bold text-slate-600 font-serif">
                اختر الفصل لعرض قائمة الطلاب ورصد درجاتهم (Click a class card to inspect its students):
              </span>
              {selectedFilterClassId !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedFilterClassId(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-all cursor-pointer font-serif"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء التصفية / عرض كافة الفصول (Show All)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adviseeClasses.map(cls => {
                const clsStudents = adviseeStudents.filter(s => s.ClassID === cls.ClassID);
                const isSelected = selectedFilterClassId === cls.ClassID;
                return (
                  <div
                    key={cls.ClassID}
                    onClick={() => handleClassCardClick(cls.ClassID)}
                    role="button"
                    tabIndex={0}
                    className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative select-none ${
                      isSelected
                        ? 'bg-[#f4efe1] border-[#126b38] ring-4 ring-[#126b38]/25 shadow-md scale-[1.01]'
                        : 'bg-[#dfd4b8] border-[#ccbf99] hover:border-[#126b38] hover:shadow-md hover:bg-[#e4dac0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#126b38] text-white' : 'bg-[#126b38]/10 text-[#126b38]'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b79e55] text-slate-950 font-serif">
                            {cls.Level}
                          </span>
                          <span className="ml-1.5 text-[10px] font-mono text-slate-600 uppercase font-bold">{cls.Department}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#126b38] text-white shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-amber-300" />
                          <span>معروض حالياً (Selected)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 hover:text-[#126b38] font-serif">
                          انقر لعرض الطلاب &larr;
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-900 font-serif" dir="rtl">{cls.ClassName}</h3>

                    <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-[#ccbf99]/60">
                      <span className="flex items-center gap-1.5 text-[#126b38] font-bold">
                        <Users className="w-3.5 h-3.5" />
                        <span>{toHindiNumerals(clsStudents.length)} طالب (Students)</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{toHindiNumerals(getSubjectsForClass(cls.ClassID).length)} مواد</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Filter Notice */}
          {selectedFilterClassId !== null && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-bold text-emerald-950 font-serif">
                  يتم الآن عرض طلاب فصل:{' '}
                  <span className="font-black text-[#126b38] text-sm">
                    {adviseeClasses.find(c => c.ClassID === selectedFilterClassId)?.ClassName}
                  </span>
                  &nbsp;({toHindiNumerals(adviseeStudents.filter(s => s.ClassID === selectedFilterClassId).length)} طالب)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFilterClassId(null)}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 cursor-pointer flex items-center gap-1 font-serif"
              >
                <X className="w-3 h-3" />
                <span>إلغاء التصفية (عرض الكل)</span>
              </button>
            </div>
          )}

          {/* Controls: View Mode + Grading Selector (Strictly RTL) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" dir="rtl" id="advisee-students-section">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === 'class' ? 'bg-[#126b38] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <span>نظرة عامة على الفصل (Class Overview)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('student')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === 'student' ? 'bg-[#126b38] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <span>تفاصيل درجات الطالب (Student Detail)</span>
              </button>
            </div>

            {/* Grading Period Selector */}
            <div className="flex items-center gap-2 flex-wrap" dir="rtl">
              <span className="text-xs font-bold text-slate-700 font-serif">اختر الدور (Grading):</span>
              <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
                {GRADING_LIST.map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedGrading(period)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${selectedGrading === period
                      ? 'bg-[#9f7a28] text-white ring-2 ring-amber-300/40 shadow'
                      : 'bg-[#dfd4b8] text-slate-800 border border-[#ccbf99] hover:bg-[#d4c6a4]'
                      }`}
                  >
                    <span className="block font-serif text-[11px]">{GRADING_LABELS[period].ar}</span>
                    <span className="font-sans text-[9px] opacity-80">{GRADING_LABELS[period].en}</span>
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
                  className="pl-8 pr-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-800 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#126b38]/30 font-serif text-right"
                  dir="rtl"
                >
                  <option value="">-- اختر الطالب --</option>
                  {(selectedFilterClassId
                    ? adviseeStudents.filter(s => s.ClassID === selectedFilterClassId)
                    : adviseeStudents
                  ).map(s => (
                    <option key={s.StudentID} value={s.StudentID}>
                      {s.NameArabic || s.Name} ({toHindiNumerals(s.RollNo)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* ============================================================
              CLASS OVERVIEW MODE: Strictly RTL (Names on Right, Ratings on Left)
          ============================================================ */}
          {viewMode === 'class' && (
            <div className="space-y-6">
              {displayedClasses.map(cls => {
                const clsStudents = adviseeStudents.filter(s => s.ClassID === cls.ClassID);
                const clsSubjects = getSubjectsForClass(cls.ClassID);
                if (clsStudents.length === 0) {
                  return (
                    <div key={cls.ClassID} className="bg-white rounded-3xl border border-slate-200 p-8 text-center" dir="rtl">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-black text-slate-800 font-serif">
                        {cls.ClassName}
                      </h4>
                      <p className="text-xs text-slate-500 font-serif mt-1">
                        لا يوجد طلاب مسجلين في هذا الفصل حالياً ({toHindiNumerals(0)} طالب).
                      </p>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5" dir="ltr">
                        No students are currently enrolled in this section.
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={cls.ClassID} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden" dir="rtl">
                    {/* Table Header Banner */}
                    <div className="bg-[#126b38] px-5 py-3 flex items-center justify-between" dir="rtl">
                      <div>
                        <h3 className="text-sm font-black text-white font-serif">{cls.ClassName}</h3>
                        <p className="text-[11px] text-emerald-200 font-serif">
                          {GRADING_LABELS[selectedGrading].ar} ({GRADING_LABELS[selectedGrading].en})
                          &nbsp;·&nbsp; {toHindiNumerals(clsStudents.length)} طلاب مسجلين
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#b79e55] text-slate-950 text-[10px] font-black rounded-full font-serif">
                          مرحلة: {cls.Level}
                        </span>
                      </div>
                    </div>

                    {/* Grades Table - STRICT RTL: Names on Far Right, Avg/Rating on Left */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse" dir="rtl">
                        <thead>
                          <tr className="bg-[#b79e55]/20 border-b border-[#ccbf99]">
                            {/* 1. Student Name Column on FAR RIGHT */}
                            <th className="text-right px-4 py-3 font-black text-slate-900 whitespace-nowrap">
                              <span className="font-serif">الطالب</span>
                              <span className="text-[10px] font-sans text-slate-500 mr-1">(Student)</span>
                            </th>
                            {/* 2. Roll No Column */}
                            <th className="text-center px-3 py-3 font-black text-slate-900 whitespace-nowrap">
                              <span className="font-serif">رقم القيد</span>
                              <span className="text-[10px] font-sans text-slate-500 mr-1">(Roll No)</span>
                            </th>
                            {/* 3. Subjects Columns */}
                            {clsSubjects.map(sub => (
                              <th key={sub.SubjectID} className="text-center px-3 py-3 font-black text-slate-900 whitespace-nowrap">
                                <span className="block font-serif text-sm leading-tight">{sub.SubjectArabic}</span>
                                <span className="block font-sans text-[10px] text-slate-500">{sub.SubjectClass.split(' ')[0]}</span>
                              </th>
                            ))}
                            {/* 4. Average Column */}
                            <th className="text-center px-3 py-3 font-black text-slate-900 bg-amber-50/60 whitespace-nowrap">
                              <span className="font-serif">المعدل</span>
                              <span className="text-[10px] font-sans text-slate-500 mr-1">(Avg)</span>
                            </th>
                            {/* 5. Rating Column on FAR LEFT */}
                            <th className="text-center px-3 py-3 font-black text-slate-900 bg-amber-50/60 whitespace-nowrap">
                              <span className="font-serif">التقدير</span>
                              <span className="text-[10px] font-sans text-slate-500 mr-1">(Rating)</span>
                            </th>
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
                                className={`border-b border-slate-100 hover:bg-amber-50/20 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                onClick={() => {
                                  setSelectedStudentId(student.StudentID);
                                  setViewMode('student');
                                }}
                              >
                                {/* 1. Student Info on Far Right */}
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-[#126b38]/10 overflow-hidden shrink-0 border border-[#126b38]/20">
                                      {student.ProfilePic ? (
                                        <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-4 h-4 text-[#126b38]" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-serif font-black text-slate-950 whitespace-nowrap text-sm">
                                        {student.NameArabic || student.Name}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-sans" dir="ltr">
                                        {student.Name}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Roll No in Hindi Numerals */}
                                <td className="px-3 py-3 font-mono font-black text-slate-700 text-center">
                                  {toHindiNumerals(student.RollNo)}
                                </td>

                                {/* 3. Scores in Hindi Numerals */}
                                {rowScores.map((score, i) => {
                                  const r = getRating(score);
                                  return (
                                    <td key={i} className="px-3 py-3 text-center">
                                      {score !== null ? (
                                        <span className={`inline-block px-2.5 py-0.5 rounded-lg font-black font-mono text-xs ${r.pillClass}`}>
                                          {toHindiNumerals(score)}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 font-serif">—</span>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* 4. Average in Hindi Numerals */}
                                <td className="px-3 py-3 text-center bg-amber-50/40">
                                  {avg !== null ? (
                                    <span className="font-black text-slate-950 font-mono text-sm">
                                      {toHindiNumerals(avg.toFixed(1))}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>

                                {/* 5. Rating on Far Left */}
                                <td className="px-3 py-3 text-center bg-amber-50/40">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black font-serif ${rating.pillClass}`}>
                                    {rating.labelAr} ({rating.labelEn})
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
                  <div className="bg-[#126b38] rounded-3xl p-5 flex items-center justify-between text-white shadow-md" dir="rtl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden shrink-0 border-2 border-amber-300">
                        {selectedStudent.ProfilePic ? (
                          <img src={selectedStudent.ProfilePic} alt={selectedStudent.Name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full uppercase font-serif">
                            طالب الفصل المشرف عليه
                          </span>
                          <span className="px-2.5 py-0.5 bg-white/10 text-emerald-200 text-[10px] font-mono rounded-full">
                            رقم القيد: {toHindiNumerals(selectedStudent.RollNo)}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-white font-serif">{selectedStudent.NameArabic || selectedStudent.Name}</h2>
                        <p className="text-xs text-amber-200 font-sans" dir="ltr">{selectedStudent.Name}</p>
                        <p className="text-xs text-emerald-200 mt-1 font-serif">
                          {classes.find(c => c.ClassID === selectedStudent.ClassID)?.ClassName}
                        </p>
                      </div>
                    </div>
                    <div className="text-left hidden sm:block font-mono" dir="ltr">
                      <p className="text-[10px] text-emerald-200 mb-0.5 uppercase">Student ID</p>
                      <p className="font-bold text-white text-xs">{selectedStudent.IdNumber}</p>
                    </div>
                  </div>

                  {/* 6-Grading Summary Row (RTL) */}
                  {(() => {
                    const summary = getStudentSummary(selectedStudent);
                    return (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" dir="rtl">
                        {summary.periodScores.map(({ period, avg }) => {
                          const r = getRating(avg);
                          const isActive = selectedGrading === period;
                          return (
                            <button
                              key={period}
                              type="button"
                              onClick={() => setSelectedGrading(period)}
                              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${isActive
                                ? 'bg-[#9f7a28] text-white border-amber-600 shadow-md ring-2 ring-amber-300/40'
                                : 'bg-white border-slate-200 hover:border-[#126b38]/40 hover:bg-emerald-50/30'
                                }`}
                            >
                              <p className={`font-serif text-[11px] font-black ${isActive ? 'text-amber-100' : 'text-slate-800'}`}>
                                {GRADING_LABELS[period].ar}
                              </p>
                              <p className={`text-[9px] font-sans ${isActive ? 'text-amber-200' : 'text-slate-400'}`}>
                                {GRADING_LABELS[period].en}
                              </p>
                              {avg !== null ? (
                                <p className={`text-lg font-black mt-1 font-mono ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                  {toHindiNumerals(avg.toFixed(1))}
                                </p>
                              ) : (
                                <p className={`text-sm mt-1 ${isActive ? 'text-amber-200' : 'text-slate-300'}`}>—</p>
                              )}
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black font-serif ${r.pillClass}`}>
                                {r.labelAr}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Grade Table for Selected Grading */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden" dir="rtl">
                    <div className="bg-[#b79e55] px-5 py-3 flex items-center justify-between" dir="rtl">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 font-serif">
                          {GRADING_LABELS[selectedGrading].ar} ({GRADING_LABELS[selectedGrading].en}) — درجات المواد
                        </h3>
                        <p className="text-[11px] text-slate-800 font-sans" dir="ltr">
                          Detailed Subject Scores & Ratings
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse" dir="rtl">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-right px-5 py-3 font-black text-slate-900">المادة (Subject)</th>
                            <th className="text-center px-4 py-3 font-black text-slate-900">الدرجة (Score)</th>
                            <th className="text-center px-4 py-3 font-black text-slate-900">التقدير (Rating)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSubjectsForClass(selectedStudent.ClassID).map((sub, idx) => {
                            const score = getGradeScore(selectedStudent.StudentID, sub.SubjectID, selectedGrading);
                            const rating = getRating(score);
                            return (
                              <tr key={sub.SubjectID} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                <td className="px-5 py-3">
                                  <p className="font-black text-slate-900 font-serif text-sm">
                                    {sub.SubjectArabic}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-sans" dir="ltr">{sub.SubjectClass}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {score !== null ? (
                                    <span className="text-lg font-black text-slate-950 font-mono">
                                      {toHindiNumerals(score)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-base font-serif">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black font-serif ${rating.pillClass}`}>
                                      {rating.labelAr} ({rating.labelEn})
                                    </span>
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
                                <td className="px-5 py-3 font-black text-slate-950 font-serif text-sm">
                                  المعدل العام — Overall Average
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {avg !== null ? (
                                    <span className="text-lg font-black text-slate-950 font-mono">
                                      {toHindiNumerals(avg.toFixed(1))}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black font-serif ${rating.pillClass}`}>
                                    {rating.labelAr} ({rating.labelEn})
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
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden" dir="rtl">
                    <div className="bg-slate-800 px-5 py-3">
                      <h3 className="text-sm font-black text-white font-serif">جميع الأدوار — نظرة شاملة (All 6 Gradings)</h3>
                      <p className="text-[11px] text-slate-300 font-sans" dir="ltr">Comprehensive Academic Scorecard</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse" dir="rtl">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200" dir="rtl">
                            <th className="text-right px-5 py-3 font-black text-slate-900 font-serif">المادة</th>
                            {GRADING_LIST.map(p => (
                              <th key={p} className={`text-center px-3 py-3 font-black whitespace-nowrap ${selectedGrading === p ? 'text-amber-800 bg-amber-50' : 'text-slate-700'}`}>
                                <span className="font-serif text-[11px]">{GRADING_LABELS[p].ar}</span>
                              </th>
                            ))}
                            <th className="text-center px-3 py-3 font-black text-slate-900 bg-amber-50/50 font-serif">المعدل</th>
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
                                  <p className="font-black text-slate-900 font-serif text-sm">{sub.SubjectArabic}</p>
                                  <p className="text-[10px] text-slate-400 font-sans" dir="ltr">{sub.SubjectClass}</p>
                                </td>
                                {rowScores.map((score, i) => {
                                  const p = GRADING_LIST[i];
                                  const r = getRating(score);
                                  const isActive = selectedGrading === p;
                                  return (
                                    <td key={i} className={`px-3 py-3 text-center ${isActive ? 'bg-amber-50' : ''}`}>
                                      {score !== null ? (
                                        <span className={`inline-block px-2.5 py-0.5 rounded font-black font-mono text-xs ${r.pillClass}`}>
                                          {toHindiNumerals(score)}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 font-serif">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-3 text-center bg-amber-50/30">
                                  <span className="font-black text-slate-950 font-mono text-sm">
                                    {avg !== null ? toHindiNumerals(avg.toFixed(1)) : '—'}
                                  </span>
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
