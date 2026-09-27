'use client';

import React, { useState, useMemo } from 'react';
import {
  StudentItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  StudentGradeItem,
  SubjectTeacherItem,
  GradingPeriod,
} from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import {
  Trophy,
  Award,
  Medal,
  Calendar,
  Layers,
  GraduationCap,
  Printer,
  ChevronDown,
  Star,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  TableProperties,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface StudentGradeViewProps {
  student: StudentItem;
  classes: ClassItem[];
  subjects: SubjectItem[];
  teachers: TeacherItem[];
  subjectTeachers: SubjectTeacherItem[];
  grades: StudentGradeItem[];
  allStudents: StudentItem[];
}

export type ViewMode = 'by-grading' | 'all-gradings' | 'semester' | 'year' | 'dual';

export default function StudentGradeView({
  student,
  classes,
  subjects,
  teachers,
  subjectTeachers,
  grades,
  allStudents,
}: StudentGradeViewProps) {
  // Navigation & filter state: Default to "by-grading" as requested
  const [viewMode, setViewMode] = useState<ViewMode>('by-grading');
  const [selectedGrading, setSelectedGrading] = useState<GradingPeriod>('1st');
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st');
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');

  // Criteria score toggle
  const [showCriteriaBreakdown, setShowCriteriaBreakdown] = useState<boolean>(false);

  // Rank Modal State
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankContext, setRankContext] = useState<'grading' | 'all' | 'semester' | 'year'>('grading');

  // Student class info
  const studentClass = classes.find(c => c.ClassID === student.ClassID);

  // All subjects taken by this student's class
  const classSubjects = useMemo(() => {
    const list = subjects.filter(s => s.ClassID === student.ClassID);
    // Fallback if class has no direct mapped subjects yet
    return list.length > 0 ? list : subjects.slice(0, 5);
  }, [subjects, student.ClassID]);

  // Helper to get grade for a subject in a specific grading period
  const getSubjectGrade = (subjectId: number, period: GradingPeriod) => {
    return grades.find(
      g =>
        g.StudentID === student.StudentID &&
        g.SubjectID === subjectId &&
        g.Period === period
    );
  };

  // Helper to get teacher for a subject
  const getSubjectTeacher = (subjectId: number) => {
    const mapping = subjectTeachers.find(
      st => st.ClassID === student.ClassID && st.SubjectID === subjectId
    );
    if (mapping) {
      return teachers.find(t => t.TeacherID === mapping.TeacherID);
    }
    return teachers[0];
  };

  // Rating badge helper
  const getRating = (avg: number | null | undefined): { labelAr: string; labelEn: string; pillClass: string } => {
    if (avg === null || avg === undefined || isNaN(avg)) {
      return { labelAr: '-', labelEn: 'N/A', pillClass: 'bg-slate-200 text-slate-600' };
    }
    if (avg >= 90) {
      return { labelAr: 'ممتاز', labelEn: 'Excellent', pillClass: 'bg-[#3fd866] text-slate-950' };
    }
    if (avg >= 80) {
      return { labelAr: 'جيد جدا', labelEn: 'Very Good', pillClass: 'bg-[#f7d643] text-slate-950' };
    }
    if (avg >= 70) {
      return { labelAr: 'جيد', labelEn: 'Good', pillClass: 'bg-[#fba248] text-slate-950' };
    }
    if (avg >= 60) {
      return { labelAr: 'مقبول', labelEn: 'Acceptable', pillClass: 'bg-[#f97334] text-white' };
    }
    return { labelAr: 'راسب', labelEn: 'Fail', pillClass: 'bg-[#ef4444] text-white' };
  };

  // Grading Periods Mapping
  const gradingList: GradingPeriod[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  const gradingNamesMap: Record<GradingPeriod, { en: string; ar: string; shortAr: string }> = {
    '1st': { en: '1ˢᵗ Grading', ar: 'دور الأول (١)', shortAr: 'دور ١' },
    '2nd': { en: '2ⁿᵈ Grading', ar: 'دور الثاني (٢)', shortAr: 'دور ٢' },
    '3rd': { en: '3ʳᵈ Grading', ar: 'دور الثالث (٣)', shortAr: 'دور ٣' },
    '4th': { en: '4ᵗʰ Grading', ar: 'دور الرابع (٤)', shortAr: 'دور ٤' },
    '5th': { en: '5ᵗʰ Grading', ar: 'دور الخامس (٥)', shortAr: 'دور ٥' },
    '6th': { en: '6ᵗʰ Grading', ar: 'دور السادس (٦)', shortAr: 'دور ٦' },
  };

  // Semesters Dawr list
  const sem1Dawrs: GradingPeriod[] = ['1st', '2nd', '3rd'];
  const sem2Dawrs: GradingPeriod[] = ['4th', '5th', '6th'];
  const activeSemDawrs = selectedSemester === '1st' ? sem1Dawrs : sem2Dawrs;

  // Single Grading Rows (All Subjects Taken for selected grading)
  const singleGradingRows = useMemo(() => {
    return classSubjects.map(sub => {
      const g = getSubjectGrade(sub.SubjectID, selectedGrading);
      const teacher = getSubjectTeacher(sub.SubjectID);
      const score = g && typeof g.FinalGrade === 'number' ? g.FinalGrade : null;
      const rating = getRating(score);
      const criteria = g?.CriteriaScores || {};

      return {
        subject: sub,
        teacher,
        score,
        rating,
        criteria,
        isLocked: g ? g.IsLocked : false,
      };
    });
  }, [classSubjects, selectedGrading, grades, student.StudentID]);

  // Overall metric for single grading
  const singleGradingOverall = useMemo(() => {
    const valid = singleGradingRows.filter(r => r.score !== null);
    if (valid.length === 0) return { totalSum: 0, overallAvg: 0, rating: getRating(null) };
    const totalSum = valid.reduce((acc, r) => acc + (r.score || 0), 0);
    const overallAvg = Math.round((totalSum / valid.length) * 10) / 10;
    return {
      totalSum,
      overallAvg,
      rating: getRating(overallAvg),
    };
  }, [singleGradingRows]);

  // All 6 Gradings Combined Rows (All Subjects Taken across all gradings at same time)
  const allGradingsRows = useMemo(() => {
    return classSubjects.map(sub => {
      const scores: Record<GradingPeriod, number | null> = {
        '1st': null,
        '2nd': null,
        '3rd': null,
        '4th': null,
        '5th': null,
        '6th': null,
      };
      let validCount = 0;
      let total = 0;

      gradingList.forEach(p => {
        const g = getSubjectGrade(sub.SubjectID, p);
        if (g && typeof g.FinalGrade === 'number') {
          scores[p] = g.FinalGrade;
          total += g.FinalGrade;
          validCount++;
        }
      });

      const average = validCount > 0 ? Math.round((total / validCount) * 10) / 10 : null;
      const rating = getRating(average);

      return {
        subject: sub,
        scores,
        total: validCount > 0 ? total : null,
        average,
        rating,
      };
    });
  }, [classSubjects, grades, student.StudentID]);

  // Overall metrics across all 6 gradings
  const allGradingsOverall = useMemo(() => {
    const periodSums: Record<GradingPeriod, { total: number; count: number }> = {
      '1st': { total: 0, count: 0 },
      '2nd': { total: 0, count: 0 },
      '3rd': { total: 0, count: 0 },
      '4th': { total: 0, count: 0 },
      '5th': { total: 0, count: 0 },
      '6th': { total: 0, count: 0 },
    };

    allGradingsRows.forEach(row => {
      gradingList.forEach(p => {
        const val = row.scores[p];
        if (val !== null) {
          periodSums[p].total += val;
          periodSums[p].count++;
        }
      });
    });

    const validRows = allGradingsRows.filter(r => r.average !== null);
    const grandTotal = validRows.reduce((acc, r) => acc + (r.total || 0), 0);
    const grandAvg = validRows.length > 0 ? Math.round((validRows.reduce((acc, r) => acc + (r.average || 0), 0) / validRows.length) * 10) / 10 : 0;

    return {
      periodSums,
      grandTotal,
      grandAvg,
      rating: getRating(grandAvg),
    };
  }, [allGradingsRows]);

  // Semestral Subject Computations
  const semestralRows = useMemo(() => {
    return classSubjects.map(sub => {
      const dawrScores: Record<string, number | null> = {};
      let validCount = 0;
      let total = 0;

      activeSemDawrs.forEach(p => {
        const g = getSubjectGrade(sub.SubjectID, p);
        if (g && typeof g.FinalGrade === 'number') {
          dawrScores[p] = g.FinalGrade;
          total += g.FinalGrade;
          validCount++;
        } else {
          dawrScores[p] = null;
        }
      });

      const average = validCount > 0 ? Math.round((total / validCount) * 10) / 10 : null;
      const rating = getRating(average);

      return {
        subject: sub,
        dawrScores,
        total: validCount > 0 ? total : null,
        average,
        rating,
      };
    });
  }, [classSubjects, activeSemDawrs, grades, student.StudentID]);

  // Overall semester metrics
  const semOverall = useMemo(() => {
    const validRows = semestralRows.filter(r => r.average !== null);
    if (validRows.length === 0) return { totalSum: 0, overallAvg: 0, rating: getRating(null) };

    const totalSum = validRows.reduce((acc, r) => acc + (r.total || 0), 0);
    const overallAvg = Math.round((validRows.reduce((acc, r) => acc + (r.average || 0), 0) / validRows.length) * 10) / 10;
    return {
      totalSum,
      overallAvg,
      rating: getRating(overallAvg),
    };
  }, [semestralRows]);

  // Annual Full Year Computations
  const annualRows = useMemo(() => {
    return classSubjects.map(sub => {
      // Semester 1
      let s1Total = 0;
      let s1Count = 0;
      sem1Dawrs.forEach(p => {
        const g = getSubjectGrade(sub.SubjectID, p);
        if (g && typeof g.FinalGrade === 'number') {
          s1Total += g.FinalGrade;
          s1Count++;
        }
      });
      const sem1Avg = s1Count > 0 ? Math.round((s1Total / s1Count) * 10) / 10 : null;

      // Semester 2
      let s2Total = 0;
      let s2Count = 0;
      sem2Dawrs.forEach(p => {
        const g = getSubjectGrade(sub.SubjectID, p);
        if (g && typeof g.FinalGrade === 'number') {
          s2Total += g.FinalGrade;
          s2Count++;
        }
      });
      const sem2Avg = s2Count > 0 ? Math.round((s2Total / s2Count) * 10) / 10 : null;

      // Annual total and average
      const allCount = s1Count + s2Count;
      const annualTotal = s1Total + s2Total;
      const annualAvg = allCount > 0 ? Math.round((annualTotal / allCount) * 10) / 10 : null;
      const rating = getRating(annualAvg);

      return {
        subject: sub,
        sem1Avg,
        sem2Avg,
        annualTotal: allCount > 0 ? annualTotal : null,
        annualAvg,
        rating,
      };
    });
  }, [classSubjects, grades, student.StudentID]);

  // Overall annual metrics
  const annualOverall = useMemo(() => {
    const validRows = annualRows.filter(r => r.annualAvg !== null);
    if (validRows.length === 0) return { overallAvg: 0, rating: getRating(null) };

    const overallAvg = Math.round((validRows.reduce((acc, r) => acc + (r.annualAvg || 0), 0) / validRows.length) * 10) / 10;
    return {
      overallAvg,
      rating: getRating(overallAvg),
    };
  }, [annualRows]);

  // Class Leaderboard & Rank Calculation
  const classRanking = useMemo(() => {
    const classmates = allStudents.filter(s => s.ClassID === student.ClassID);

    const scores = classmates.map(mate => {
      const mateGrades = grades.filter(
        g => g.StudentID === mate.StudentID && typeof g.FinalGrade === 'number'
      );

      let targetGrades = mateGrades;
      if (rankContext === 'grading') {
        targetGrades = mateGrades.filter(g => g.Period === selectedGrading);
      } else if (rankContext === 'semester') {
        targetGrades = mateGrades.filter(g => activeSemDawrs.includes(g.Period));
      }

      const total = targetGrades.reduce((acc, curr) => acc + (curr.FinalGrade as number), 0);
      const avg = targetGrades.length > 0 ? Math.round((total / targetGrades.length) * 10) / 10 : 0;

      return {
        student: mate,
        avgGrade: avg,
        rating: getRating(avg),
      };
    });

    scores.sort((a, b) => b.avgGrade - a.avgGrade);

    const myIndex = scores.findIndex(s => s.student.StudentID === student.StudentID);
    const myRank = myIndex >= 0 ? myIndex + 1 : 1;

    return {
      scores,
      totalStudents: classmates.length,
      myRank,
      myScore: scores[myIndex]?.avgGrade || 0,
    };
  }, [allStudents, student.ClassID, student.StudentID, grades, rankContext, selectedGrading, activeSemDawrs]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md flex-shrink-0 bg-slate-800 flex items-center justify-center">
            {student.ProfilePic ? (
              <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
            ) : (
              <GraduationCap className="w-8 h-8 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                {student.RollNo}
              </span>
              <span className="text-xs text-emerald-300 font-medium">
                [{studentClass?.Department?.toUpperCase() || '5-DAYS'}] {studentClass?.ClassName}
              </span>
              <span className="text-xs bg-emerald-700/60 px-2 py-0.5 rounded text-emerald-200">
                {classSubjects.length} Subjects Enrolled
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>{student.Name}</span>
              {student.NameArabic && (
                <span className="text-amber-300 font-serif font-normal text-lg" dir="rtl">
                  ({student.NameArabic})
                </span>
              )}
            </h1>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Academic Record & Transcript &bull; Jamiatu Monib Alkuzbary Al-Arabia
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700 shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRankContext(viewMode === 'year' ? 'year' : viewMode === 'semester' ? 'semester' : viewMode === 'all-gradings' ? 'all' : 'grading');
              setIsRankModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Trophy className="w-4 h-4 text-slate-950" />
            <span>My Standing #{classRanking.myRank}</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Navigation Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {/* 1. By Grading Period */}
          <button
            type="button"
            onClick={() => setViewMode('by-grading')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'by-grading'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>By Grading (حسب الفترة)</span>
          </button>

          {/* 2. All 6 Gradings Matrix */}
          <button
            type="button"
            onClick={() => setViewMode('all-gradings')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'all-gradings'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>All 6 Gradings Matrix (جميع الفترات)</span>
          </button>

          {/* 3. Semestral View */}
          <button
            type="button"
            onClick={() => setViewMode('semester')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'semester'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Semestral (فصلي)</span>
          </button>

          {/* 4. Annual View */}
          <button
            type="button"
            onClick={() => setViewMode('year')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'year'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Annual (سنوي)</span>
          </button>

          {/* 5. Dual Cards */}
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'dual'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Dual Cards (كالصورة)
          </button>
        </div>

        {/* Secondary Context Filters */}
        <div className="flex items-center gap-2">
          {viewMode === 'semester' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Semester:</span>
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value as '1st' | '2nd')}
                className="text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="1st">1ˢᵗ Semester (الفصل الأول)</option>
                <option value="2nd">2ⁿᵈ Semester (الفصل الثاني)</option>
              </select>
            </div>
          )}

          {viewMode === 'by-grading' && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100">
              <input
                type="checkbox"
                checked={showCriteriaBreakdown}
                onChange={e => setShowCriteriaBreakdown(e.target.checked)}
                className="rounded text-emerald-700 focus:ring-emerald-700"
              />
              <span>Detailed Criteria Breakdown</span>
            </label>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW BY GRADING (Primary User Request): 1st to 6th Grading Selector */}
      {/* ========================================================================= */}
      {viewMode === 'by-grading' && (
        <div className="space-y-4">
          {/* Quick Grading Period Switcher Bar (1st to 6th Grading) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Select Grading Period (اختر فترة التقييم):</span>
              <button
                type="button"
                onClick={() => setViewMode('all-gradings')}
                className="text-emerald-800 hover:text-emerald-900 font-bold lowercase underline flex items-center gap-1"
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>view all 6 gradings at once</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" dir="rtl">
              {gradingList.map(period => {
                const isActive = selectedGrading === period;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedGrading(period)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isActive
                        ? 'bg-emerald-800 border-emerald-800 text-white shadow-md ring-2 ring-emerald-600/30'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black tracking-wide">
                      {gradingNamesMap[period].en}
                    </span>
                    <span
                      className={`text-xs font-serif ${
                        isActive ? 'text-amber-300 font-bold' : 'text-slate-500'
                      }`}
                      dir="rtl"
                    >
                      {gradingNamesMap[period].ar}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grading Card Table (Exact Visual Theme) */}
          <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
            {/* Header Pill Bar */}
            <div className="bg-white rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xs border border-[#cfc39f]">
              {/* View Rank Button */}
              <button
                type="button"
                onClick={() => {
                  setRankContext('grading');
                  setIsRankModalOpen(true);
                }}
                className="px-5 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>View Rank</span>
              </button>

              {/* Title Section (Grading En | Ar) */}
              <div className="flex items-center gap-3 sm:gap-4 text-right">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
                  {gradingNamesMap[selectedGrading].en}
                </span>
                <div className="h-6 w-[2px] bg-[#c4b68e]" />
                <span className="font-black text-slate-950 font-serif text-sm sm:text-base" dir="rtl">
                  {gradingNamesMap[selectedGrading].ar}
                </span>
              </div>
            </div>

            {/* Table Container listing ALL subjects taken */}
            <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
              <table className="w-full text-right text-sm" dir="rtl">
                <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                  <tr>
                    <th className="py-3 px-4 text-right">المادة (Subject)</th>
                    <th className="py-3 px-4 text-center">المدرس (Teacher)</th>
                    {showCriteriaBreakdown && (
                      <>
                        <th className="py-3 px-2 text-center text-xs">حضور (10%)</th>
                        <th className="py-3 px-2 text-center text-xs">اختبارات (20%)</th>
                        <th className="py-3 px-2 text-center text-xs">نصفي (30%)</th>
                        <th className="py-3 px-2 text-center text-xs">نهائي (40%)</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-center">الدرجة (Grade)</th>
                    <th className="py-3 px-4 text-center">معدل</th>
                    <th className="py-3 px-4 text-center">التقدير (Rating)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7dfc8] font-medium">
                  {singleGradingRows.map(row => {
                    return (
                      <tr key={row.subject.SubjectID} className="hover:bg-[#faf7f0] transition-colors">
                        {/* Subject Name */}
                        <td className="py-3 px-4 text-right font-bold text-slate-950">
                          <span className="font-serif text-base">{row.subject.SubjectArabic || row.subject.SubjectClass}</span>
                          {row.subject.SubjectArabic && row.subject.SubjectClass && (
                            <span className="block text-[11px] text-slate-500 font-sans font-normal" dir="ltr">
                              {row.subject.SubjectClass}
                            </span>
                          )}
                        </td>

                        {/* Teacher Name */}
                        <td className="py-3 px-4 text-center text-xs text-slate-700">
                          {row.teacher?.NameArabic || row.teacher?.Name || '—'}
                        </td>

                        {/* Criteria Breakdown columns if enabled */}
                        {showCriteriaBreakdown && (
                          <>
                            <td className="py-3 px-2 text-center font-mono text-xs text-slate-600">
                              {row.criteria['crit-att'] !== undefined ? toHindiNumerals(row.criteria['crit-att']) : '—'}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-xs text-slate-600">
                              {row.criteria['crit-quiz'] !== undefined ? toHindiNumerals(row.criteria['crit-quiz']) : '—'}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-xs text-slate-600">
                              {row.criteria['crit-mid'] !== undefined ? toHindiNumerals(row.criteria['crit-mid']) : '—'}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-xs text-slate-600">
                              {row.criteria['crit-final'] !== undefined ? toHindiNumerals(row.criteria['crit-final']) : '—'}
                            </td>
                          </>
                        )}

                        {/* Grading Score */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-950 bg-amber-50/30">
                          {row.score !== null ? toHindiNumerals(row.score) : '—'}
                        </td>

                        {/* Average */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-700">
                          {row.score !== null ? toHindiNumerals(row.score) : '—'}
                        </td>

                        {/* Rating Evaluation Badge */}
                        <td className="py-2.5 px-4 text-center w-28">
                          {row.score !== null ? (
                            <span
                              className={`inline-block w-full py-1 px-3 text-center text-xs font-black rounded-sm shadow-xs ${row.rating.pillClass}`}
                            >
                              {row.rating.labelAr}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Grading Footer Summary */}
                <tfoot className="bg-[#ede5d1] text-slate-950 font-bold border-t-2 border-[#b79e55]">
                  <tr>
                    <td className="py-3 px-4 text-right font-black" colSpan={showCriteriaBreakdown ? 6 : 2}>
                      المجموع والمعدل العام للفترة ({gradingNamesMap[selectedGrading].ar})
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-slate-900">
                      {toHindiNumerals(singleGradingOverall.totalSum)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-emerald-950">
                      {toHindiNumerals(singleGradingOverall.overallAvg)}٪
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${singleGradingOverall.rating.pillClass}`}>
                        {singleGradingOverall.rating.labelAr}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ALL 6 GRADINGS MATRIX (View All Subjects Taken Across All Gradings at Once) */}
      {/* ========================================================================= */}
      {viewMode === 'all-gradings' && (
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          {/* Card Header Pill Bar */}
          <div className="bg-white rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xs border border-[#cfc39f]">
            {/* View Rank Button */}
            <button
              type="button"
              onClick={() => {
                setRankContext('all');
                setIsRankModalOpen(true);
              }}
              className="px-5 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span>View Rank</span>
            </button>

            {/* Title Section */}
            <div className="flex items-center gap-3 sm:gap-4 text-right">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
                {selectedYear} Complete 6-Grading Matrix
              </span>
              <div className="h-6 w-[2px] bg-[#c4b68e]" />
              <span className="font-black text-slate-950 font-serif text-sm sm:text-base" dir="rtl">
                سجل الفترات الست لكافة المواد المسجلة
              </span>
            </div>
          </div>

          {/* Full 6-Period Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
            <table className="w-full text-right text-sm" dir="rtl">
              <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                <tr>
                  <th className="py-3 px-4 text-right">المادة (Subject)</th>
                  {gradingList.map(p => (
                    <th key={p} className="py-3 px-2.5 text-center text-xs">
                      {gradingNamesMap[p].shortAr}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center">مجموع</th>
                  <th className="py-3 px-3 text-center">معدل</th>
                  <th className="py-3 px-4 text-center">التقدير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7dfc8] font-medium">
                {allGradingsRows.map(row => {
                  return (
                    <tr key={row.subject.SubjectID} className="hover:bg-[#faf7f0] transition-colors">
                      {/* Subject Name */}
                      <td className="py-3 px-4 text-right font-bold text-slate-950">
                        <span className="font-serif text-base">{row.subject.SubjectArabic || row.subject.SubjectClass}</span>
                        {row.subject.SubjectArabic && row.subject.SubjectClass && (
                          <span className="block text-[11px] text-slate-500 font-sans font-normal" dir="ltr">
                            {row.subject.SubjectClass}
                          </span>
                        )}
                      </td>

                      {/* 1st to 6th Grading Columns */}
                      {gradingList.map(p => {
                        const val = row.scores[p];
                        return (
                          <td key={p} className="py-3 px-2.5 text-center font-mono font-bold text-xs text-slate-800">
                            {val !== null ? toHindiNumerals(val) : '—'}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-xs text-slate-900 bg-amber-50/40">
                        {row.total !== null ? toHindiNumerals(row.total) : '—'}
                      </td>

                      {/* Average */}
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-950 bg-amber-50/70">
                        {row.average !== null ? toHindiNumerals(row.average) : '—'}
                      </td>

                      {/* Rating Evaluation Badge */}
                      <td className="py-2.5 px-4 text-center w-28">
                        {row.average !== null ? (
                          <span
                            className={`inline-block w-full py-1 px-3 text-center text-xs font-black rounded-sm shadow-xs ${row.rating.pillClass}`}
                          >
                            {row.rating.labelAr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Footer Row */}
              <tfoot className="bg-[#ede5d1] text-slate-950 font-bold border-t-2 border-[#b79e55]">
                <tr>
                  <td className="py-3 px-4 text-right font-black">المجموع والمعدل العام</td>
                  {gradingList.map(p => {
                    const col = allGradingsOverall.periodSums[p];
                    const colAvg = col.count > 0 ? Math.round((col.total / col.count) * 10) / 10 : null;
                    return (
                      <td key={p} className="py-3 px-2.5 text-center font-mono text-xs text-slate-800">
                        {colAvg !== null ? toHindiNumerals(colAvg) : '—'}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-center font-mono font-black text-xs text-slate-900">
                    {toHindiNumerals(allGradingsOverall.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-emerald-950">
                    {toHindiNumerals(allGradingsOverall.grandAvg)}٪
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${allGradingsOverall.rating.pillClass}`}>
                      {allGradingsOverall.rating.labelAr}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEMESTRAL VIEW (Sem 1: Dawr 1, 2, 3 | Sem 2: Dawr 4, 5, 6) */}
      {/* ========================================================================= */}
      {viewMode === 'semester' && (
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          {/* Card Header Pill Bar */}
          <div className="bg-white rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xs border border-[#cfc39f]">
            {/* View Rank Button */}
            <button
              type="button"
              onClick={() => {
                setRankContext('semester');
                setIsRankModalOpen(true);
              }}
              className="px-5 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span>View Rank</span>
            </button>

            {/* Title Section (Semester En | Ar) */}
            <div className="flex items-center gap-3 sm:gap-4 text-right">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
                {selectedYear}-{selectedSemester === '1st' ? '1st Semester' : '2nd Semester'}
              </span>
              <div className="h-6 w-[2px] bg-[#c4b68e]" />
              <span className="font-black text-slate-950 font-serif text-sm sm:text-base" dir="rtl">
                {selectedSemester === '1st' ? 'فصل الأول' : 'فصل الثاني'}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
            <table className="w-full text-right text-sm" dir="rtl">
              <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                <tr>
                  <th className="py-3 px-4 text-right">المادة</th>
                  {activeSemDawrs.map((p, idx) => (
                    <th key={p} className="py-3 px-3 text-center">
                      دور {selectedSemester === '1st' ? toHindiNumerals(idx + 1) : toHindiNumerals(idx + 4)}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center">مجموع</th>
                  <th className="py-3 px-3 text-center">معدل</th>
                  <th className="py-3 px-4 text-center">تقدير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7dfc8] font-medium">
                {semestralRows.map(row => {
                  return (
                    <tr key={row.subject.SubjectID} className="hover:bg-[#faf7f0] transition-colors">
                      {/* Subject Name */}
                      <td className="py-3 px-4 text-right font-bold text-slate-950">
                        <span className="font-serif text-base">{row.subject.SubjectArabic || row.subject.SubjectClass}</span>
                        {row.subject.SubjectArabic && row.subject.SubjectClass && (
                          <span className="block text-[11px] text-slate-500 font-sans font-normal" dir="ltr">
                            {row.subject.SubjectClass}
                          </span>
                        )}
                      </td>

                      {/* Dawr Columns */}
                      {activeSemDawrs.map(p => {
                        const val = row.dawrScores[p];
                        return (
                          <td key={p} className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-800">
                            {val !== null ? toHindiNumerals(val) : '—'}
                          </td>
                        );
                      })}

                      {/* Total Score */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-900 bg-amber-50/40">
                        {row.total !== null ? toHindiNumerals(row.total) : '—'}
                      </td>

                      {/* Average Score */}
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-950 bg-amber-50/70">
                        {row.average !== null ? toHindiNumerals(row.average) : '—'}
                      </td>

                      {/* Rating Evaluation Badge */}
                      <td className="py-2.5 px-4 text-center w-28">
                        {row.average !== null ? (
                          <span
                            className={`inline-block w-full py-1 px-3 text-center text-xs font-black rounded-sm shadow-xs ${row.rating.pillClass}`}
                          >
                            {row.rating.labelAr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary Footer Row */}
              <tfoot className="bg-[#ede5d1] text-slate-950 font-bold border-t-2 border-[#b79e55]">
                <tr>
                  <td className="py-3 px-4 text-right font-black">المجموع والمعدل العام</td>
                  {activeSemDawrs.map(p => (
                    <td key={p} className="py-3 px-3 text-center font-mono text-xs text-slate-600">
                      -
                    </td>
                  ))}
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-slate-900">
                    {toHindiNumerals(semOverall.totalSum)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-emerald-900">
                    {toHindiNumerals(semOverall.overallAvg)}٪
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${semOverall.rating.pillClass}`}>
                      {semOverall.rating.labelAr}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ANNUAL VIEW (Full Year) */}
      {/* ========================================================================= */}
      {viewMode === 'year' && (
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          {/* Card Header Pill Bar */}
          <div className="bg-white rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xs border border-[#cfc39f]">
            {/* View Rank Button */}
            <button
              type="button"
              onClick={() => {
                setRankContext('year');
                setIsRankModalOpen(true);
              }}
              className="px-5 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span>View Rank</span>
            </button>

            {/* Title Section (Annual En | Ar) */}
            <div className="flex items-center gap-3 sm:gap-4 text-right">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
                {selectedYear} Academic Year (Full Year)
              </span>
              <div className="h-6 w-[2px] bg-[#c4b68e]" />
              <span className="font-black text-slate-950 font-serif text-sm sm:text-base" dir="rtl">
                العام الدراسي الكامل (سنوي)
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
            <table className="w-full text-right text-sm" dir="rtl">
              <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                <tr>
                  <th className="py-3 px-4 text-right">المادة</th>
                  <th className="py-3 px-4 text-center">الفصل الأول (معدل)</th>
                  <th className="py-3 px-4 text-center">الفصل الثاني (معدل)</th>
                  <th className="py-3 px-4 text-center">المجموع السنوي</th>
                  <th className="py-3 px-4 text-center">المعدل السنوي</th>
                  <th className="py-3 px-4 text-center">التقدير العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7dfc8] font-medium">
                {annualRows.map(row => {
                  return (
                    <tr key={row.subject.SubjectID} className="hover:bg-[#faf7f0] transition-colors">
                      {/* Subject Name */}
                      <td className="py-3 px-4 text-right font-bold text-slate-950">
                        <span className="font-serif text-base">{row.subject.SubjectArabic || row.subject.SubjectClass}</span>
                        {row.subject.SubjectArabic && row.subject.SubjectClass && (
                          <span className="block text-[11px] text-slate-500 font-sans font-normal" dir="ltr">
                            {row.subject.SubjectClass}
                          </span>
                        )}
                      </td>

                      {/* Semester 1 Avg */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-800">
                        {row.sem1Avg !== null ? toHindiNumerals(row.sem1Avg) : '—'}
                      </td>

                      {/* Semester 2 Avg */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-800">
                        {row.sem2Avg !== null ? toHindiNumerals(row.sem2Avg) : '—'}
                      </td>

                      {/* Annual Total Score */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-900 bg-amber-50/40">
                        {row.annualTotal !== null ? toHindiNumerals(row.annualTotal) : '—'}
                      </td>

                      {/* Annual Final Average */}
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-sm text-slate-950 bg-amber-50/70">
                        {row.annualAvg !== null ? toHindiNumerals(row.annualAvg) : '—'}
                      </td>

                      {/* Rating Evaluation Badge */}
                      <td className="py-2.5 px-4 text-center w-28">
                        {row.annualAvg !== null ? (
                          <span
                            className={`inline-block w-full py-1 px-3 text-center text-xs font-black rounded-sm shadow-xs ${row.rating.pillClass}`}
                          >
                            {row.rating.labelAr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Annual Footer Summary */}
              <tfoot className="bg-[#ede5d1] text-slate-950 font-bold border-t-2 border-[#b79e55]">
                <tr>
                  <td className="py-3 px-4 text-right font-black">النتيجة السنوية العامة</td>
                  <td colSpan={3} className="py-3 px-4 text-center text-xs text-slate-600 font-serif">
                    معدل الأداء الأكاديمي السنوي لكافة المواد
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-black text-sm text-emerald-950">
                    {toHindiNumerals(annualOverall.overallAvg)}٪
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${annualOverall.rating.pillClass}`}>
                      {annualOverall.rating.labelAr}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DUAL CARDS VIEW (As in Uploaded Screenshot) */}
      {/* ========================================================================= */}
      {viewMode === 'dual' && (
        <div className="space-y-6">
          {/* Top Card: Single Grading */}
          <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
            <div className="bg-white rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xs border border-[#cfc39f]">
              <button
                type="button"
                onClick={() => {
                  setRankContext('grading');
                  setIsRankModalOpen(true);
                }}
                className="px-5 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>View Rank</span>
              </button>
              <div className="flex items-center gap-3 sm:gap-4 text-right">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
                  {gradingNamesMap[selectedGrading].en}
                </span>
                <div className="h-6 w-[2px] bg-[#c4b68e]" />
                <span className="font-black text-slate-950 font-serif text-sm sm:text-base" dir="rtl">
                  {gradingNamesMap[selectedGrading].ar}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
              <table className="w-full text-right text-sm" dir="rtl">
                <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                  <tr>
                    <th className="py-3 px-4 text-right">المادة</th>
                    <th className="py-3 px-4 text-center">المدرس</th>
                    <th className="py-3 px-4 text-center">الدرجة</th>
                    <th className="py-3 px-4 text-center">معدل</th>
                    <th className="py-3 px-4 text-center">تقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7dfc8] font-medium">
                  {singleGradingRows.map(row => (
                    <tr key={row.subject.SubjectID} className="hover:bg-[#faf7f0] transition-colors">
                      <td className="py-3 px-4 text-right font-bold text-slate-950">
                        <span className="font-serif text-base">{row.subject.SubjectArabic || row.subject.SubjectClass}</span>
                        {row.subject.SubjectArabic && row.subject.SubjectClass && (
                          <span className="block text-[11px] text-slate-500 font-sans font-normal" dir="ltr">
                            {row.subject.SubjectClass}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-700 font-serif">
                        {row.teacher?.NameArabic || row.teacher?.Name || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-900">
                        {row.score !== null ? toHindiNumerals(row.score) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm text-slate-700">
                        {row.score !== null ? toHindiNumerals(row.score) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center w-28">
                        {row.score !== null ? (
                          <span className={`inline-block w-full py-1 px-3 text-center text-xs font-black rounded-sm shadow-xs ${row.rating.pillClass}`}>
                            {row.rating.labelAr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Card: Semestral */}
          <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
            <div className="bg-white rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xs border border-[#cfc39f]">
              <button
                type="button"
                onClick={() => {
                  setRankContext('semester');
                  setIsRankModalOpen(true);
                }}
                className="px-5 py-2 bg-[#187d44] hover:bg-[#136838] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>View Rank</span>
              </button>
              <div className="flex items-center gap-3 sm:gap-4 text-right">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
                  {selectedYear}-{selectedSemester === '1st' ? '1st Semester' : '2nd Semester'}
                </span>
                <div className="h-6 w-[2px] bg-[#c4b68e]" />
                <span className="font-black text-slate-950 font-serif text-sm sm:text-base" dir="rtl">
                  {selectedSemester === '1st' ? 'فصل الأول' : 'فصل الثاني'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
              <table className="w-full text-right text-sm" dir="rtl">
                <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
                  <tr>
                    <th className="py-3 px-4 text-right">المادة</th>
                    {activeSemDawrs.map((p, idx) => (
                      <th key={p} className="py-3 px-3 text-center">
                        دور {selectedSemester === '1st' ? toHindiNumerals(idx + 1) : toHindiNumerals(idx + 4)}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center">مجموع</th>
                    <th className="py-3 px-3 text-center">معدل</th>
                    <th className="py-3 px-4 text-center">تقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7dfc8] font-medium">
                  {semestralRows.map(row => (
                    <tr key={row.subject.SubjectID} className="hover:bg-[#faf7f0] transition-colors">
                      <td className="py-3 px-4 text-right font-bold text-slate-950">
                        <span className="font-serif text-base">{row.subject.SubjectArabic || row.subject.SubjectClass}</span>
                        {row.subject.SubjectArabic && row.subject.SubjectClass && (
                          <span className="block text-[11px] text-slate-500 font-sans font-normal" dir="ltr">
                            {row.subject.SubjectClass}
                          </span>
                        )}
                      </td>
                      {activeSemDawrs.map(p => {
                        const val = row.dawrScores[p];
                        return (
                          <td key={p} className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-800">
                            {val !== null ? toHindiNumerals(val) : '—'}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-900 bg-amber-50/40">
                        {row.total !== null ? toHindiNumerals(row.total) : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-950 bg-amber-50/70">
                        {row.average !== null ? toHindiNumerals(row.average) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center w-28">
                        {row.average !== null ? (
                          <span className={`inline-block w-full py-1 px-3 text-center text-xs font-black rounded-sm shadow-xs ${row.rating.pillClass}`}>
                            {row.rating.labelAr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RANK & DISTINCTION MODAL (When clicking "View Rank") */}
      {/* ========================================================================= */}
      {isRankModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-950 shadow-md">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Academic Standing & Rank</h3>
                  <p className="text-xs text-slate-500 font-serif" dir="rtl">
                    المرتبة والدرجات الأكاديمية على مستوى الصف
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRankModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scholar Identity & Trophy Spotlight */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-sm bg-slate-200 flex items-center justify-center">
                  {student.ProfilePic ? (
                    <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{student.Name}</h4>
                  <p className="text-xs text-amber-800 font-serif">{student.NameArabic}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {studentClass?.ClassName} &bull; Roll: {student.RollNo}
                  </p>
                </div>
              </div>

              {/* Big Rank Pill */}
              <div className="text-center px-4 py-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-sm border border-amber-300">
                <span className="block text-[10px] font-black uppercase tracking-wider">Class Rank</span>
                <span className="text-2xl font-black">#{classRanking.myRank}</span>
                <span className="block text-[10px] font-bold text-slate-900/80">of {classRanking.totalStudents}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Average in {rankContext === 'grading' ? gradingNamesMap[selectedGrading].en : rankContext === 'semester' ? 'Semester' : 'Annual'}
                </span>
                <span className="text-2xl font-black text-emerald-800">
                  {classRanking.myScore}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-serif" dir="rtl">
                  المعدل العام للفترة
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Evaluation Standing
                </span>
                <div className="mt-1">
                  <span className={`inline-block py-1 px-3 text-xs font-black rounded-sm shadow-xs ${getRating(classRanking.myScore).pillClass}`}>
                    {getRating(classRanking.myScore).labelAr}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {getRating(classRanking.myScore).labelEn}
                </span>
              </div>
            </div>

            {/* Class Leaderboard Snippet */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-amber-500" />
                <span>Class Standing Roster ({studentClass?.ClassName})</span>
              </span>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {classRanking.scores.map((item, idx) => {
                  const isMe = item.student.StudentID === student.StudentID;
                  return (
                    <div
                      key={item.student.StudentID}
                      className={`p-2.5 px-3 flex items-center justify-between text-xs transition-colors ${
                        isMe ? 'bg-amber-100/70 font-bold border-l-4 border-amber-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-slate-900">{item.student.Name}</span>
                          {isMe && <span className="ml-1 text-[10px] text-amber-700 font-extrabold">(You)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800">{item.avgGrade}%</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm ${item.rating.pillClass}`}>
                          {item.rating.labelAr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Standing</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRankModalOpen(false)}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
