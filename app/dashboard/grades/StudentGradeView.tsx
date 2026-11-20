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
  SemesterType,
} from '@/lib/types';
import { DataStore, getTaqdirRating, DEFAULT_TAQDIR_SCALE } from '@/lib/store';
import { useAcademicTerm } from '@/lib/useAcademicTerm';
import { toHindiNumerals } from '@/lib/numerals';
import {
  Trophy,
  Award,
  Medal,
  Calendar,
  Layers,
  GraduationCap,
  Printer,
  Clock,
  CheckCircle2,
  X,
  BookOpen,
  Info,
  AlertTriangle,
  UserCheck,
  Sparkles,
  FileText,
  Lock,
  Hourglass,
  Eye,
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

type FilterCardMode = 'all-in-sem' | '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | 'semester-only';

type PrintScope =
  | 'dawr-1st'
  | 'dawr-2nd'
  | 'dawr-3rd'
  | 'dawr-4th'
  | 'dawr-5th'
  | 'dawr-6th'
  | 'sem-1st'
  | 'sem-2nd'
  | 'full-year';

export default function StudentGradeView({
  student,
  classes,
  subjects,
  teachers,
  subjectTeachers,
  grades,
  allStudents,
}: StudentGradeViewProps) {
  const { academicYear, semester: globalSemester, setSemester: setGlobalSemester } = useAcademicTerm();

  // Active semester tab ('1st' shows Dawr 1, 2, 3 + 1st Sem; '2nd' shows Dawr 4, 5, 6 + 2nd Sem; 'both' shows all)
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd' | 'both'>(
    globalSemester === '2nd' ? '2nd' : '1st'
  );
  const [cardFilter, setCardFilter] = useState<FilterCardMode>('all-in-sem');

  // Sync selectedSemester when globalSemester or academicYear changes via Breadcrumb / Term Switcher
  React.useEffect(() => {
    setSelectedSemester(globalSemester === '2nd' ? '2nd' : '1st');
    setCardFilter('all-in-sem');
    setPrintScope(globalSemester === '2nd' ? 'sem-2nd' : 'sem-1st');
  }, [globalSemester, academicYear]);

  // Enrollment / Class History support (Requirement 9: completed subjects & ustadh remain even after new enrollment)
  const enrollmentHistory = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return DataStore.getStudentEnrollmentHistory(student.StudentID);
  }, [student.StudentID]);

  const [selectedClassId, setSelectedClassId] = useState<number>(student.ClassID);

  // Sync selectedClassId when student prop changes
  React.useEffect(() => {
    setSelectedClassId(student.ClassID);
  }, [student.StudentID, student.ClassID]);

  // Hover state for showing Ustadh's name on subject hover (Requirement 7)
  const [hoveredSubjectKey, setHoveredSubjectKey] = useState<string | null>(null);

  // Clicked Subject Details Modal state (Requirements 5 & 6)
  const [detailModalData, setDetailModalData] = useState<{
    subject: SubjectItem;
    contextType: 'dawr' | 'semester';
    period?: GradingPeriod;
    semester?: SemesterType;
  } | null>(null);

  // Rank Modal State (Requirement 8)
  const [rankModalData, setRankModalData] = useState<{
    contextType: 'dawr' | 'semester';
    period?: GradingPeriod;
    semester?: SemesterType;
  } | null>(null);

  // Form 138 Print Modal State (Requirement 11)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printScope, setPrintScope] = useState<PrintScope>('sem-1st');

  // Student class info
  const studentClass = classes.find(c => c.ClassID === selectedClassId) || classes.find(c => c.ClassID === student.ClassID);

  // Combine current term grades with all historical grades for this student so completed subjects never disappear after new enrollment (Requirement 9)
  const studentAllGrades = useMemo(() => {
    const allStored = typeof window !== 'undefined' ? DataStore.getGrades() : grades;
    const mergedMap = new Map<string, StudentGradeItem>();
    allStored
      .filter(g => g.StudentID === student.StudentID)
      .forEach(g => {
        mergedMap.set(`${g.SubjectID}-${g.Period}`, g);
      });
    grades
      .filter(g => g.StudentID === student.StudentID)
      .forEach(g => {
        mergedMap.set(`${g.SubjectID}-${g.Period}`, g);
      });
    return Array.from(mergedMap.values());
  }, [grades, student.StudentID]);

  // All subjects for this student's class + any completed subjects from previous enrollment in this class
  // Orders classic core subjects (فقه، توحيد، قرآن، تعبير...) first and ensures "نشاط" (Nashat) is always included (Requirements 6 & 9)
  // Also deduplicates subjects taught at different times into a single unified subject entry (Task 9)
  const { classSubjects, subjectGroupMap } = useMemo(() => {
    const classSubList = subjects.filter(s => s.ClassID === selectedClassId);

    // Also include any subject where the student already has completed grades for this class (Requirement 9)
    const gradedSubjectIds = new Set(
      studentAllGrades
        .filter(g => g.ClassID === selectedClassId)
        .map(g => g.SubjectID)
    );
    const extraGradedSubjects = subjects.filter(
      s => gradedSubjectIds.has(s.SubjectID) && !classSubList.some(cs => cs.SubjectID === s.SubjectID)
    );

    const combined = [...classSubList, ...extraGradedSubjects];
    const baseList = combined.length > 0 ? combined : subjects.slice(0, 6);

    // Deduplicate by normalized subject name so different time slots are treated as one subject
    const groupMap = new Map<number, number[]>();
    const byName = new Map<string, SubjectItem>();
    baseList.forEach(sub => {
      const normName = (sub.SubjectArabic || sub.SubjectClass || String(sub.SubjectID)).trim().toLowerCase();
      const existing = byName.get(normName);
      if (!existing) {
        byName.set(normName, sub);
        groupMap.set(sub.SubjectID, [sub.SubjectID]);
      } else {
        const ids = groupMap.get(existing.SubjectID) || [existing.SubjectID];
        if (!ids.includes(sub.SubjectID)) {
          ids.push(sub.SubjectID);
        }
        groupMap.set(existing.SubjectID, ids);
      }
    });

    const deduplicated = Array.from(byName.values());

    // Priority order matching Screenshot 3 (فقه، توحيد، قرآن، تعبير، ... ثم نشاط)
    const priorityOrder = ['فقه', 'توحيد', 'قرآن', 'تعبير', 'حديث', 'قواعد', 'تفسير', 'تجويد'];
    const sorted = [...deduplicated].sort((a, b) => {
      const aIsNashat = Boolean(a.IsNashat || a.SubjectArabic === 'نشاط');
      const bIsNashat = Boolean(b.IsNashat || b.SubjectArabic === 'نشاط');
      // Put النشاط at the end of the subject list
      if (aIsNashat && !bIsNashat) return 1;
      if (!aIsNashat && bIsNashat) return -1;

      const aName = a.SubjectArabic || a.SubjectClass;
      const bName = b.SubjectArabic || b.SubjectClass;
      const aIdx = priorityOrder.indexOf(aName);
      const bIdx = priorityOrder.indexOf(bName);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.SubjectID - b.SubjectID;
    });

    return { classSubjects: sorted, subjectGroupMap: groupMap };
  }, [subjects, selectedClassId, studentAllGrades]);

  // Check if subject is "نشاط" (graded by SSG Officers)
  const isNashatSubject = (sub: SubjectItem) =>
    Boolean(
      sub.IsNashat ||
        sub.SubjectArabic === 'نشاط' ||
        (sub.SubjectClass && sub.SubjectClass.toLowerCase().includes('nashat'))
    );

  // Helper to get grade for a subject in a specific grading period (checks all grouped time-slot SubjectIDs)
  const getSubjectGrade = (subjectId: number, period: GradingPeriod): StudentGradeItem | undefined => {
    const groupIds = subjectGroupMap.get(subjectId) || [subjectId];
    return studentAllGrades.find(g => groupIds.includes(g.SubjectID) && g.Period === period);
  };

  // Helper to get Ustadh / Teacher for a subject (Requirements 6, 7, 9):
  // 1. If subject is "نشاط", it is graded by SSG Student Council Officers.
  // 2. Otherwise, check subjectTeachers (which reflects Principal's latest assignment/edits).
  // 3. Fallback to the TeacherID stored on the student's completed grade record so the Ustadh remains preserved across enrollments unless edited by Principal.
  const getSubjectInstructor = (sub: SubjectItem): {
    nameAr: string;
    nameEn: string;
    roleLabelAr: string;
    roleLabelEn: string;
    isSSG: boolean;
  } => {
    if (isNashatSubject(sub)) {
      const ssgOfficer = allStudents.find(s => s.IsSSG) || {
        Name: 'Tariq Al-Mansoor (SSG Officer)',
        NameArabic: 'طارق المنصور (مسؤول النشاط - مجلس الطلبة)',
      };
      return {
        nameAr: ssgOfficer.NameArabic || 'مجلس الطلبة (SSG)',
        nameEn: ssgOfficer.Name || 'SSG Student Council Officer',
        roleLabelAr: 'مجلس الطلبة (SSG) - مسؤول النشاط',
        roleLabelEn: 'Graded by SSG Student Council Officers',
        isSSG: true,
      };
    }

    // Check Principal's Subject-Teacher allocation table first
    const mapping =
      subjectTeachers.find(st => st.ClassID === sub.ClassID && st.SubjectID === sub.SubjectID) ||
      subjectTeachers.find(st => st.SubjectID === sub.SubjectID);

    if (mapping) {
      const tch = teachers.find(t => t.TeacherID === mapping.TeacherID);
      if (tch) {
        return {
          nameAr: `الأستاذ ${tch.NameArabic || tch.Name}`,
          nameEn: `Ustadh ${tch.Name}`,
          roleLabelAr: 'أستاذ المادة (Ustadh)',
          roleLabelEn: 'Subject Ustadh / Instructor',
          isSSG: false,
        };
      }
    }

    // Fallback to TeacherID preserved on the completed grade record
    const existingGradeWithTeacher = studentAllGrades.find(
      g => g.SubjectID === sub.SubjectID && g.TeacherID
    );
    if (existingGradeWithTeacher) {
      const tch = teachers.find(t => t.TeacherID === existingGradeWithTeacher.TeacherID);
      if (tch) {
        return {
          nameAr: `الأستاذ ${tch.NameArabic || tch.Name}`,
          nameEn: `Ustadh ${tch.Name}`,
          roleLabelAr: 'أستاذ المادة (Ustadh)',
          roleLabelEn: 'Subject Ustadh / Instructor',
          isSSG: false,
        };
      }
    }

    const defaultTch = teachers[1] || teachers[0];
    return {
      nameAr: `الأستاذ ${defaultTch?.NameArabic || 'عبدالجليل'}`,
      nameEn: `Ustadh ${defaultTch?.Name || 'Abduljalil'}`,
      roleLabelAr: 'أستاذ المادة (Ustadh)',
      roleLabelEn: 'Subject Ustadh / Instructor',
      isSSG: false,
    };
  };

  const taqdirScale = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_TAQDIR_SCALE;
    return DataStore.getTaqdirScale();
  }, []);

  // Rating badge helper using Admin/Principal configured Taqdir scale (Task 5) and 'INC' label (Task 8)
  const getRating = (
    val: number | 'INC' | 'DRP' | null | undefined
  ): {
    labelAr: string;
    labelEn: string;
    cellBgClass: string;
    pillClass: string;
  } => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
      return {
        labelAr: '',
        labelEn: 'Not Graded',
        cellBgClass: 'bg-transparent text-slate-400',
        pillClass: 'bg-slate-100 text-slate-400',
      };
    }
    return getTaqdirRating(val, taqdirScale, 'INC');
  };

  // Grading Periods Metadata
  const gradingNamesMap: Record<
    GradingPeriod,
    { quarterEn: string; dawrEn: string; ar: string; shortAr: string; sem: SemesterType }
  > = {
    '1st': { quarterEn: '1st Quarter', dawrEn: '1st Dawr', ar: 'دور الأول', shortAr: 'دور ١', sem: '1st' },
    '2nd': { quarterEn: '2nd Quarter', dawrEn: '2nd Dawr', ar: 'دور الثاني', shortAr: 'دور ٢', sem: '1st' },
    '3rd': { quarterEn: '3rd Quarter', dawrEn: '3rd Dawr', ar: 'دور الثالث', shortAr: 'دور ٣', sem: '1st' },
    '4th': { quarterEn: '4th Quarter', dawrEn: '4th Dawr', ar: 'دور الرابع', shortAr: 'دور ٤', sem: '2nd' },
    '5th': { quarterEn: '5th Quarter', dawrEn: '5th Dawr', ar: 'دور الخامس', shortAr: 'دور ٥', sem: '2nd' },
    '6th': { quarterEn: '6th Quarter', dawrEn: '6th Dawr', ar: 'دور السادس', shortAr: 'دور ٦', sem: '2nd' },
  };

  const sem1Dawrs: GradingPeriod[] = ['1st', '2nd', '3rd'];
  const sem2Dawrs: GradingPeriod[] = ['4th', '5th', '6th'];

  // Helper to get Principal's Teacher Grade Submission Deadline & Notice for a Dawr (Requirement 10)
  const getDawrTeacherNotice = (period: GradingPeriod) => {
    if (typeof window === 'undefined') return null;
    const item = DataStore.getGradeSubmissionDeadline(period);
    if (!item) return null;
    const target = item.deadlineIso ? new Date(item.deadlineIso).getTime() : NaN;
    const isExpired = !isNaN(target) && Date.now() > target;
    let remainingText = '';
    if (!isNaN(target)) {
      if (isExpired) {
        remainingText = 'انتهت المهلة الرسمية لتسليم الدرجات';
      } else {
        const diffSec = Math.floor((target - Date.now()) / 1000);
        const days = Math.floor(diffSec / 86400);
        const hours = Math.floor((diffSec % 86400) / 3600);
        remainingText = `متبقي للمعلمين: ${toHindiNumerals(days)} يوم و ${toHindiNumerals(hours)} ساعة`;
      }
    }
    let formattedDate = item.deadlineIso || '';
    try {
      if (item.deadlineIso) {
        const d = new Date(item.deadlineIso);
        formattedDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
          d.getDate()
        ).padStart(2, '0')}`;
      }
    } catch {
      // keep raw
    }
    return {
      period,
      deadlineDate: formattedDate,
      instructions:
        item.instructions ||
        `يرجى من السادة الأساتذة سرعة رصد واعتماد درجات ${gradingNamesMap[period].ar} قبل الموعد النهائي.`,
      isExpired,
      remainingText,
    };
  };

  // Build data for a single Dawr Card (Requirements 1, 2, 4, 5, 6, 7, 12)
  const buildDawrCardData = (period: GradingPeriod) => {
    const rows = classSubjects.map((sub, idx) => {
      const g = getSubjectGrade(sub.SubjectID, period);
      const instructor = getSubjectInstructor(sub);
      const rawFinal = g?.FinalGrade;
      const isDRP = rawFinal === 'DRP';
      const isINC = rawFinal === 'INC';
      const numericScore = typeof rawFinal === 'number' && !isNaN(rawFinal) ? rawFinal : null;
      const isGradedNumeric = numericScore !== null;

      const displayValue: number | 'INC' | 'DRP' | null = isDRP
        ? 'DRP'
        : isINC
        ? 'INC'
        : numericScore;

      const rating = getRating(displayValue);

      return {
        index: idx + 1,
        subject: sub,
        instructor,
        gradeItem: g,
        rawFinal,
        isDRP,
        isINC,
        numericScore,
        isGradedNumeric,
        displayValue,
        rating,
      };
    });

    // Requirement 2 & Requirement 4:
    // Automatically total and average the grades for this Dawr.
    // If a subject is NOT YET GRADED or is INC (or DRP), it must NOT be included in the average!
    const validNumericRows = rows.filter(r => r.isGradedNumeric && !r.isINC && !r.isDRP);
    const hasUngradedOrINC = rows.some(r => (!r.isGradedNumeric && !r.isDRP) || r.isINC);
    const hasAnyDRP = rows.some(r => r.isDRP);
    const allCompleted = rows.length > 0 && !hasUngradedOrINC;

    const totalSum =
      validNumericRows.length > 0
        ? Math.round(validNumericRows.reduce((acc, r) => acc + (r.numericScore || 0), 0) * 10) / 10
        : null;

    const averageScore =
      validNumericRows.length > 0 && totalSum !== null
        ? Math.round((totalSum / validNumericRows.length) * 10) / 10
        : null;

    const overallRating = getRating(averageScore);

    return {
      period,
      meta: gradingNamesMap[period],
      notice: getDawrTeacherNotice(period),
      rows,
      validCount: validNumericRows.length,
      totalSubjects: rows.length,
      totalSum,
      averageScore,
      overallRating,
      allCompleted,
      hasUngradedOrINC,
      hasAnyDRP,
    };
  };

  // Build data for a Semester Card with DOUBLE SECTION (Requirements 3, 4, 12, 13):
  // Section 1: Average score by Dawr based on student's score on 1st Dawr, 2nd Dawr, and 3rd Dawr.
  // Section 2: Average score by Subjects across the 3 Dawrs, then its Total Average.
  const buildSemesterCardData = (sem: SemesterType) => {
    const semDawrs = sem === '1st' ? sem1Dawrs : sem2Dawrs;
    const dawrCards = semDawrs.map(p => buildDawrCardData(p));

    // SECTION 1: Average Score by Dawr (1st Dawr, 2nd Dawr, 3rd Dawr)
    const section1DawrRows = dawrCards.map((dc, idx) => ({
      index: idx + 1,
      period: dc.period,
      titleAr: dc.meta.ar,
      titleEn: dc.meta.quarterEn,
      totalSum: dc.totalSum,
      averageScore: dc.averageScore,
      rating: dc.overallRating,
      allCompleted: dc.allCompleted,
      validCount: dc.validCount,
      totalSubjects: dc.totalSubjects,
    }));

    // Section 1 Total / Average across the graded Dawrs (Requirement 4: exclude ungraded Dawrs)
    const gradedDawrs = section1DawrRows.filter(d => d.averageScore !== null);
    const section1TotalOfAverages =
      gradedDawrs.length > 0
        ? Math.round(gradedDawrs.reduce((acc, d) => acc + (d.averageScore || 0), 0) * 10) / 10
        : null;
    const section1OverallAvg =
      gradedDawrs.length > 0 && section1TotalOfAverages !== null
        ? Math.round((section1TotalOfAverages / gradedDawrs.length) * 10) / 10
        : null;
    const section1OverallRating = getRating(section1OverallAvg);

    // SECTION 2: Average Score by Subjects (automatically adding grades from the 3 Dawrs to corresponding subjects)
    const section2SubjectRows = classSubjects.map((sub, idx) => {
      const instructor = getSubjectInstructor(sub);
      const dawrValues: Record<GradingPeriod, number | 'INC' | 'DRP' | null> = {
        '1st': null,
        '2nd': null,
        '3rd': null,
        '4th': null,
        '5th': null,
        '6th': null,
      };

      let numericSum = 0;
      let numericCount = 0;
      let hasINC = false;
      let hasDRP = false;
      let hasUngraded = false;

      semDawrs.forEach(p => {
        const g = getSubjectGrade(sub.SubjectID, p);
        if (!g || g.FinalGrade === undefined || g.FinalGrade === null) {
          dawrValues[p] = null;
          hasUngraded = true;
        } else if (g.FinalGrade === 'DRP') {
          dawrValues[p] = 'DRP';
          hasDRP = true;
        } else if (g.FinalGrade === 'INC') {
          dawrValues[p] = 'INC';
          hasINC = true;
        } else if (typeof g.FinalGrade === 'number' && !isNaN(g.FinalGrade)) {
          dawrValues[p] = g.FinalGrade;
          numericSum += g.FinalGrade;
          numericCount++;
        }
      });

      // Requirement 4:
      // If the subject is INC or not yet graded, the average grade must not be included on that.
      const subjectTotal = !hasINC && !hasDRP && numericCount > 0 ? Math.round(numericSum * 10) / 10 : null;
      const subjectAvg: number | 'INC' | 'DRP' | null = hasDRP
        ? 'DRP'
        : hasINC
        ? 'INC'
        : numericCount > 0
        ? Math.round((numericSum / numericCount) * 10) / 10
        : null;

      const numericAvgOnly = typeof subjectAvg === 'number' ? subjectAvg : null;
      const rating = getRating(subjectAvg);

      return {
        index: idx + 1,
        subject: sub,
        instructor,
        dawrValues,
        numericCount,
        hasINC,
        hasDRP,
        hasUngraded,
        subjectTotal,
        subjectAvg,
        numericAvgOnly,
        rating,
      };
    });

    // Requirement 4 & 13: Total average of Section 2 (only include subjects that have a valid numeric average and are NOT INC or DRP)
    const validSubjectRows = section2SubjectRows.filter(
      r => r.numericAvgOnly !== null && !r.hasINC && !r.hasDRP
    );
    const section2TotalSum =
      validSubjectRows.length > 0
        ? Math.round(validSubjectRows.reduce((acc, r) => acc + (r.numericAvgOnly || 0), 0) * 10) / 10
        : null;
    const section2OverallAvg =
      validSubjectRows.length > 0 && section2TotalSum !== null
        ? Math.round((section2TotalSum / validSubjectRows.length) * 10) / 10
        : null;
    const section2OverallRating = getRating(section2OverallAvg);

    const isSemesterComplete =
      section2SubjectRows.length > 0 &&
      section2SubjectRows.every(r => !r.hasINC && !r.hasUngraded && (r.numericCount === 3 || r.hasDRP));

    const hasAnyDRP = section2SubjectRows.some(r => r.hasDRP);

    return {
      semester: sem,
      semDawrs,
      titleEn: `${academicYear} - ${sem === '1st' ? '1st Semester' : '2nd Semester'}`,
      titleAr: sem === '1st' ? 'فصل الأول' : 'فصل الثاني',
      notice: getDawrTeacherNotice(semDawrs[0]),
      section1DawrRows,
      section1TotalOfAverages,
      section1OverallAvg,
      section1OverallRating,
      section2SubjectRows,
      section2TotalSum,
      section2OverallAvg,
      section2OverallRating,
      isSemesterComplete,
      hasAnyDRP,
    };
  };

  // Compute rank among classmates for any Dawr or Semester (Requirement 8)
  const computeClassRank = (
    contextType: 'dawr' | 'semester',
    period?: GradingPeriod,
    sem?: SemesterType
  ) => {
    const classmates = allStudents.filter(s => s.ClassID === selectedClassId);
    const allStoredGrades = typeof window !== 'undefined' ? DataStore.getGrades() : grades;
    const targetPeriods: GradingPeriod[] =
      contextType === 'dawr' && period
        ? [period]
        : (sem || '1st') === '1st'
        ? sem1Dawrs
        : sem2Dawrs;

    const roster = classmates.map(mate => {
      let sum = 0;
      let count = 0;
      let hasINC = false;
      let hasDRP = false;
      let missingCount = 0;

      classSubjects.forEach(sub => {
        targetPeriods.forEach(p => {
          const g =
            grades.find(
              x => x.StudentID === mate.StudentID && x.SubjectID === sub.SubjectID && x.Period === p
            ) ||
            allStoredGrades.find(
              x => x.StudentID === mate.StudentID && x.SubjectID === sub.SubjectID && x.Period === p
            );

          if (!g || g.FinalGrade === undefined || g.FinalGrade === null) {
            missingCount++;
          } else if (g.FinalGrade === 'INC') {
            hasINC = true;
            missingCount++;
          } else if (g.FinalGrade === 'DRP') {
            hasDRP = true;
          } else if (typeof g.FinalGrade === 'number' && !isNaN(g.FinalGrade)) {
            sum += g.FinalGrade;
            count++;
          }
        });
      });

      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
      const isComplete = classSubjects.length > 0 && missingCount === 0 && !hasINC && count > 0;

      return {
        student: mate,
        avgGrade: avg,
        gradedCount: count,
        totalExpected: classSubjects.length * targetPeriods.length,
        isComplete,
        hasINC,
        hasDRP,
        rating: getRating(avg),
      };
    });

    // Sort classmates with numeric averages descending; ungraded at bottom
    roster.sort((a, b) => {
      if (a.avgGrade === null && b.avgGrade === null) return 0;
      if (a.avgGrade === null) return 1;
      if (b.avgGrade === null) return -1;
      return b.avgGrade - a.avgGrade;
    });

    const myIndex = roster.findIndex(r => r.student.StudentID === student.StudentID);
    const myEntry = myIndex >= 0 ? roster[myIndex] : null;
    const myRank = myIndex >= 0 ? myIndex + 1 : 1;

    // Rank is Completed only if the student's grades for this period/semester are completed; otherwise Temporary!
    const isRankCompleted = Boolean(myEntry?.isComplete);

    return {
      roster,
      totalStudents: classmates.length,
      myRank,
      myEntry,
      isRankCompleted,
    };
  };

  // Helper to get detailed criteria scores for a subject & period (Requirements 5 & 6)
  const getCriteriaDetailsForSubject = (sub: SubjectItem, period: GradingPeriod) => {
    const g = getSubjectGrade(sub.SubjectID, period);
    const rawFinal = g?.FinalGrade;
    const numScore = typeof rawFinal === 'number' ? rawFinal : null;
    const storedCriteria = g?.CriteriaScores || {};
    const isNashat = isNashatSubject(sub);

    const criteriaDefs = isNashat
      ? [
          {
            id: 'crit-att',
            nameAr: 'الحضور والمشاركة في الأنشطة الطلابية',
            nameEn: 'Activity Attendance & Participation',
            weight: 10,
          },
          {
            id: 'crit-quiz',
            nameAr: 'الفعاليات والمسابقات الثقافية (SSG)',
            nameEn: 'SSG Events, Quizzes & Competitions',
            weight: 20,
          },
          {
            id: 'crit-mid',
            nameAr: 'الانضباط والسلوك والعمل الجماعي',
            nameEn: 'Student Conduct, Discipline & Teamwork',
            weight: 30,
          },
          {
            id: 'crit-final',
            nameAr: 'التقييم النهائي لمجلس الطلبة (SSG)',
            nameEn: 'Final SSG Council Activity Evaluation',
            weight: 40,
          },
        ]
      : [
          {
            id: 'crit-att',
            nameAr: 'الحضور والمواظبة والسلوك',
            nameEn: 'Attendance & Decorum',
            weight: 10,
          },
          {
            id: 'crit-quiz',
            nameAr: 'الاختبارات القصيرة والواجبات',
            nameEn: 'Quizzes & Class Exercises',
            weight: 20,
          },
          {
            id: 'crit-mid',
            nameAr: 'الاختبار النصفي (منتصف الدور)',
            nameEn: 'Mid-Dawr Examination',
            weight: 30,
          },
          {
            id: 'crit-final',
            nameAr: 'الامتحان النهائي للدور',
            nameEn: 'Final Dawr Examination',
            weight: 40,
          },
        ];

    const breakdown = criteriaDefs.map(c => {
      const explicitVal = storedCriteria[c.id];
      // If teacher entered FinalGrade directly via Excel grid without filling sub-criteria, show proportional component score
      const score =
        explicitVal !== undefined
          ? explicitVal
          : numScore !== null
          ? numScore
          : null;
      const weightedPoints =
        score !== null ? Math.round(((score * c.weight) / 100) * 10) / 10 : null;
      return {
        ...c,
        score,
        weightedPoints,
      };
    });

    // Attendance records from DataStore
    const attendanceRecords =
      typeof window !== 'undefined'
        ? DataStore.getStudentAttendance().filter(
            a =>
              a.RollNo === student.RollNo &&
              a.ClassID === selectedClassId &&
              a.SubjectID === sub.SubjectID
          )
        : [];
    const presentDays = attendanceRecords.filter(a => a.Status).length;
    const absentDays = attendanceRecords.filter(a => !a.Status).length;

    return {
      period,
      gradeItem: g,
      rawFinal,
      numScore,
      rating: getRating(
        rawFinal === 'DRP' ? 'DRP' : rawFinal === 'INC' ? 'INC' : numScore
      ),
      breakdown,
      presentDays,
      absentDays,
      totalRecordedDays: attendanceRecords.length,
    };
  };

  // Pre-build cards to render based on selectedSemester & cardFilter
  const sem1Data = useMemo(
    () => buildSemesterCardData('1st'),
    [classSubjects, studentAllGrades, academicYear, selectedClassId]
  );
  const sem2Data = useMemo(
    () => buildSemesterCardData('2nd'),
    [classSubjects, studentAllGrades, academicYear, selectedClassId]
  );

  // Render a Single Dawr Card (Exact Screenshot 3 Visual Design)
  const renderDawrCard = (period: GradingPeriod) => {
    const data = buildDawrCardData(period);
    const rankInfo = computeClassRank('dawr', period);

    return (
      <div
        key={`dawr-card-${period}`}
        className="bg-[#d8cba8] border-2 border-[#c5b589] rounded-[28px] p-4 sm:p-6 shadow-sm space-y-3"
      >
        {/* Top White/Cream Header Bar (Matches Screenshot 3) */}
        <div className="bg-[#f7f4ed] rounded-2xl p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs border border-[#cfc39f]">
          {/* Left: View Rank Green Pill Button + Temporary/Completed Badge */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRankModalData({ contextType: 'dawr', period })}
              className="px-6 py-2 bg-[#218245] hover:bg-[#196936] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>View Rank</span>
            </button>

            <span
              onClick={() => setRankModalData({ contextType: 'dawr', period })}
              className={`px-3 py-1 rounded-full text-[11px] font-black cursor-pointer border flex items-center gap-1 ${
                rankInfo.isRankCompleted
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title={
                rankInfo.isRankCompleted
                  ? 'اكتمل رصد جميع المواد - الترتيب النهائي المعتمد'
                  : 'لم يكتمل رصد جميع المواد بعد - ترتيب مؤقت'
              }
            >
              <span>#{rankInfo.myRank}</span>
              <span>&bull;</span>
              <span>{rankInfo.isRankCompleted ? 'Final (نهائي)' : 'Temporary (مؤقت)'}</span>
            </span>
          </div>

          {/* Right: 1st Quarter | دور الأول */}
          <div className="flex items-center gap-3 sm:gap-4 text-right ml-auto">
            <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
              {data.meta.quarterEn}
            </span>
            <div className="h-7 w-[2px] bg-[#9c8438]" />
            <span className="font-black text-slate-950 font-serif text-base sm:text-lg" dir="rtl">
              {data.meta.ar}
            </span>
          </div>
        </div>

        {/* Requirement 10: Notice for teachers to pass/submit the grades shown right below the Dawr title */}
        {data.notice && (
          <div
            className={`rounded-xl px-4 py-2.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs ${
              data.notice.isExpired
                ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                : 'bg-[#fcf9f2] border-[#c4b482] text-slate-800'
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <Clock
                className={`w-4 h-4 shrink-0 ${
                  data.notice.isExpired ? 'text-rose-600' : 'text-[#187d44]'
                }`}
              />
              <div>
                <span className="font-black font-serif text-slate-900">
                  إشعار تسليم الدرجات للأساتذة ({data.meta.ar}):{' '}
                </span>
                <span className="font-serif text-slate-700">{data.notice.instructions}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
              {data.notice.deadlineDate && (
                <span className="bg-amber-100/90 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-md font-bold">
                  آخر موعد: {data.notice.deadlineDate}
                </span>
              )}
              {data.notice.remainingText && (
                <span
                  className={`px-2.5 py-0.5 rounded-md font-bold ${
                    data.notice.isExpired
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {data.notice.remainingText}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Requirement 12: Highlight banner if student has any DRP grade in this Dawr */}
        {data.hasAnyDRP && (
          <div
            className="bg-red-600 text-white rounded-xl px-4 py-2.5 border-2 border-red-800 shadow-sm flex items-center justify-between gap-2 text-xs font-black"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                تنبيه هام (DRP Highlight): يوجد مادة مسجلة بحالة منسحب (DRP - Dropped) في هذا الدور وهي مظللة باللون الأحمر أدناه.
              </span>
            </div>
            <span className="px-2.5 py-0.5 bg-white text-red-700 rounded-full font-mono text-[11px]">
              DRP STATUS
            </span>
          </div>
        )}

        {/* Helper Hint for Hover (Ustadh Name) & Click (Subject Details) */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-700 font-medium" dir="rtl">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#187d44]" />
            <span>
              مرر الفأرة فوق اسم المادة لإظهار <strong>اسم الأستاذ (Ustadh)</strong>، واضغط على أي مادة (بما فيها <strong>نشاط</strong>) لعرض تفاصيل الحضور والاختبارات والامتحان.
            </span>
          </span>
          {data.hasUngradedOrINC && (
            <span className="text-amber-900 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded font-bold">
              المواد غير المرصودة أو (INC) لا تدخل في حساب المعدل
            </span>
          )}
        </div>

        {/* Grades Table (Matches Screenshot 3: م | المواد | الدرجة | تقدير) */}
        <div className="overflow-x-auto rounded-lg border-2 border-[#b59e54] bg-[#b59e54] shadow-xs">
          <table className="w-full text-center border-collapse text-sm" dir="rtl">
            <thead>
              <tr className="bg-[#b8a258] text-[#5e4b14] font-black text-sm sm:text-base">
                <th className="py-3 px-3 w-28 border border-[#b59e54]">م</th>
                <th className="py-3 px-4 border border-[#b59e54]">المواد</th>
                <th className="py-3 px-4 w-44 border border-[#b59e54]">الدرجة</th>
                <th className="py-3 px-4 w-36 border border-[#b59e54]">تقدير</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {data.rows.map(row => {
                const hoverKey = `${period}-${row.subject.SubjectID}`;
                const isHovered = hoveredSubjectKey === hoverKey;
                const isNashat = isNashatSubject(row.subject);

                return (
                  <tr
                    key={row.subject.SubjectID}
                    onMouseEnter={() => setHoveredSubjectKey(hoverKey)}
                    onMouseLeave={() => setHoveredSubjectKey(null)}
                    onClick={() =>
                      setDetailModalData({
                        subject: row.subject,
                        contextType: 'dawr',
                        period,
                      })
                    }
                    title={`${row.instructor.roleLabelAr}: ${row.instructor.nameAr} (${row.instructor.nameEn}) — اضغط لعرض تفاصيل الدرجة`}
                    className={`cursor-pointer transition-all ${
                      row.isDRP
                        ? 'bg-red-100 hover:bg-red-200/90 text-red-950 ring-2 ring-red-500 ring-inset font-black'
                        : 'hover:brightness-95'
                    }`}
                  >
                    {/* 1. م (Row Index - White Background) */}
                    <td
                      className={`py-2.5 px-3 border border-[#c5b271] font-sans text-sm ${
                        row.isDRP ? 'bg-red-200 text-red-950 font-black' : 'bg-white text-slate-900'
                      }`}
                    >
                      {row.index}
                    </td>

                    {/* 2. المواد (Subject Name - Cream Background, Hover shows Ustadh, Click opens Details) */}
                    <td
                      className={`py-2.5 px-4 border border-[#c5b271] relative ${
                        row.isDRP
                          ? 'bg-red-100 text-red-950 font-black'
                          : 'bg-[#f6f3ec] text-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-serif text-base font-black">
                          {row.subject.SubjectArabic || row.subject.SubjectClass}
                        </span>
                        {isNashat && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-sans font-bold">
                            SSG نشاط
                          </span>
                        )}
                        {row.isDRP && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-600 text-white font-sans font-black">
                            DRP منسحب
                          </span>
                        )}
                      </div>

                      {/* Floating Tooltip on Hover showing Ustadh's Name (Requirement 7) */}
                      {isHovered && (
                        <div
                          className="
                            z-30 mt-1 mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                            bg-slate-900 text-amber-300 text-xs font-bold shadow-lg border border-amber-400/50
                            animate-in fade-in duration-150
                          "
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {row.instructor.isSSG
                              ? `مسؤول النشاط (SSG): ${row.instructor.nameAr}`
                              : `${row.instructor.nameAr} (${row.instructor.nameEn})`}
                          </span>
                          <span className="text-[10px] text-slate-300 underline mr-1">
                            • اضغط للتفاصيل
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 3. الدرجة (Grade Score - Pure White Background) */}
                    <td
                      className={`py-2.5 px-4 border border-[#c5b271] font-mono text-base font-black ${
                        row.isDRP
                          ? 'bg-red-600 text-white'
                          : row.isINC
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-white text-slate-950'
                      }`}
                    >
                      {row.displayValue !== null ? row.displayValue : ''}
                    </td>

                    {/* 4. تقدير (Rating - Full Cell Colored Background matching Screenshot 3) */}
                    <td
                      className={`py-2.5 px-4 border border-[#c5b271] font-serif text-base ${row.rating.cellBgClass}`}
                    >
                      {row.rating.labelAr}
                    </td>
                  </tr>
                );
              })}

              {/* Bottom Summary Row: مجموع (Automatic Average & Total for Dawr - Requirements 2 & 4) */}
              <tr>
                {/* Empty index cell on right matching Screenshot 3 */}
                <td className="py-3 px-3 border border-[#c5b271] bg-white"></td>

                {/* مجموع label cell */}
                <td className="py-3 px-4 border border-[#c5b271] bg-[#f6f3ec] text-slate-950 font-serif font-black text-base">
                  <div>مجموع / المعدل العام</div>
                  {data.totalSum !== null && (
                    <div className="text-[11px] text-slate-500 font-sans font-bold mt-0.5">
                      مجموع الدرجات: {data.totalSum} ({data.validCount} من {data.totalSubjects} مواد مرصودة)
                    </div>
                  )}
                </td>

                {/* Automatic Average Grade cell (Blank if not yet graded or INC per Requirement 4) */}
                <td className="py-3 px-4 border border-[#c5b271] bg-white font-mono text-base font-black text-slate-950">
                  {data.averageScore !== null ? (
                    <div>
                      <span>{data.averageScore}</span>
                      {data.hasUngradedOrINC && (
                        <span className="block text-[10px] text-amber-700 font-sans font-bold">
                          (مؤقت - غير مكتمل)
                        </span>
                      )}
                    </div>
                  ) : (
                    ''
                  )}
                </td>

                {/* Overall Rating cell */}
                <td
                  className={`py-3 px-4 border border-[#c5b271] font-serif text-base ${
                    data.averageScore !== null ? data.overallRating.cellBgClass : 'bg-white'
                  }`}
                >
                  {data.averageScore !== null ? data.overallRating.labelAr : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render a Semester Card with DOUBLE SECTION (Matches Screenshot 3 + Requirement 3 & Requirement 13)
  const renderSemesterCard = (sem: SemesterType) => {
    const data = sem === '1st' ? sem1Data : sem2Data;
    const rankInfo = computeClassRank('semester', undefined, sem);

    return (
      <div
        key={`sem-card-${sem}`}
        className="bg-[#d8cba8] border-2 border-[#b8a258] rounded-[28px] p-4 sm:p-6 shadow-md space-y-5"
      >
        {/* Top White/Cream Header Bar (Matches Screenshot 3: View Rank | 2025-1st Semester | فصل الأول) */}
        <div className="bg-[#f7f4ed] rounded-2xl p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs border border-[#cfc39f]">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRankModalData({ contextType: 'semester', semester: sem })}
              className="px-6 py-2 bg-[#218245] hover:bg-[#196936] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>View Rank</span>
            </button>

            <span
              onClick={() => setRankModalData({ contextType: 'semester', semester: sem })}
              className={`px-3 py-1 rounded-full text-[11px] font-black cursor-pointer border flex items-center gap-1 ${
                rankInfo.isRankCompleted
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <span>#{rankInfo.myRank}</span>
              <span>&bull;</span>
              <span>{rankInfo.isRankCompleted ? 'Final (نهائي)' : 'Temporary (مؤقت)'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-right ml-auto">
            <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide font-sans">
              {data.titleEn}
            </span>
            <div className="h-7 w-[2px] bg-[#9c8438]" />
            <span className="font-black text-slate-950 font-serif text-base sm:text-lg" dir="rtl">
              {data.titleAr}
            </span>
          </div>
        </div>

        {/* Teacher Grade Submission Notice below Semester Title (Requirement 10) */}
        {data.notice && (
          <div
            className="rounded-xl px-4 py-2 bg-[#fcf9f2] border border-[#c4b482] text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#187d44] shrink-0" />
              <span>
                <strong className="font-serif">إشعار تسليم درجات {data.titleAr}: </strong>
                يتم تجميع درجات الفصول تلقائياً فور اعتماد الأساتذة لدرجات الأدوار الثلاثة ({data.semDawrs.map(p => gradingNamesMap[p].ar).join('، ')}).
              </span>
            </div>
            {data.notice.remainingText && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[11px] font-bold shrink-0">
                {data.notice.remainingText}
              </span>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 1 OF SEMESTER CARD (Requirement 13):                          */}
        {/* Average Score by Dawr based on score on 1st Dawr, 2nd Dawr, 3rd Dawr  */}
        {/* ===================================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1" dir="rtl">
            <h3 className="text-sm sm:text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#126b38] text-white text-xs flex items-center justify-center font-sans">
                1
              </span>
              <span>
                القسم الأول: معدل الأدوار الثلاثة ({sem === '1st' ? 'الدور الأول، الدور الثاني، الدور الثالث' : 'الدور الرابع، الدور الخامس، الدور السادس'})
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-700 font-sans">
              Section 1: Average Score by Dawr
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border-2 border-[#b59e54] bg-[#b59e54] shadow-xs">
            <table className="w-full text-center border-collapse text-sm" dir="rtl">
              <thead>
                <tr className="bg-[#b8a258] text-[#5e4b14] font-black text-sm sm:text-base">
                  <th className="py-3 px-3 w-24 border border-[#b59e54]">م</th>
                  <th className="py-3 px-4 border border-[#b59e54]">الأدوار (Grading Dawrs)</th>
                  <th className="py-3 px-4 w-36 border border-[#b59e54]">مجموع الدور</th>
                  <th className="py-3 px-4 w-40 border border-[#b59e54]">الدرجة (المعدل)</th>
                  <th className="py-3 px-4 w-36 border border-[#b59e54]">تقدير</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {data.section1DawrRows.map(dRow => (
                  <tr key={dRow.period} className="hover:brightness-95 transition-all">
                    <td className="py-2.5 px-3 border border-[#c5b271] bg-white text-slate-900 font-sans">
                      {dRow.index}
                    </td>
                    <td className="py-2.5 px-4 border border-[#c5b271] bg-[#f6f3ec] text-slate-950 font-serif text-base font-black">
                      <span>{dRow.titleAr}</span>
                      <span className="text-xs text-slate-500 font-sans mr-2">({dRow.titleEn})</span>
                    </td>
                    <td className="py-2.5 px-4 border border-[#c5b271] bg-white font-mono text-sm text-slate-700">
                      {dRow.totalSum !== null ? dRow.totalSum : ''}
                    </td>
                    <td className="py-2.5 px-4 border border-[#c5b271] bg-white font-mono text-base font-black text-slate-950">
                      {dRow.averageScore !== null ? dRow.averageScore : ''}
                    </td>
                    <td
                      className={`py-2.5 px-4 border border-[#c5b271] font-serif text-base ${
                        dRow.averageScore !== null ? dRow.rating.cellBgClass : 'bg-white'
                      }`}
                    >
                      {dRow.averageScore !== null ? dRow.rating.labelAr : ''}
                    </td>
                  </tr>
                ))}

                {/* Section 1 Total / Average Row */}
                <tr>
                  <td className="py-3 px-3 border border-[#c5b271] bg-white"></td>
                  <td className="py-3 px-4 border border-[#c5b271] bg-[#f6f3ec] text-slate-950 font-serif font-black text-base">
                    مجموع / المعدل الفصلي للأدوار الثلاثة
                  </td>
                  <td className="py-3 px-4 border border-[#c5b271] bg-white font-mono text-sm font-black text-slate-800">
                    {data.section1TotalOfAverages !== null ? data.section1TotalOfAverages : ''}
                  </td>
                  <td className="py-3 px-4 border border-[#c5b271] bg-white font-mono text-base font-black text-emerald-950">
                    {data.section1OverallAvg !== null ? data.section1OverallAvg : ''}
                  </td>
                  <td
                    className={`py-3 px-4 border border-[#c5b271] font-serif text-base ${
                      data.section1OverallAvg !== null
                        ? data.section1OverallRating.cellBgClass
                        : 'bg-white'
                    }`}
                  >
                    {data.section1OverallAvg !== null ? data.section1OverallRating.labelAr : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 2 OF SEMESTER CARD (Requirements 3, 4, 13):                   */}
        {/* Average Score by Subjects from the 3 Dawrs, then its Total Average    */}
        {/* ===================================================================== */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1" dir="rtl">
            <h3 className="text-sm sm:text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#9f7a28] text-white text-xs flex items-center justify-center font-sans">
                2
              </span>
              <span>
                القسم الثاني: معدل المواد الدراسية للفصل والمعدل العام (تجميع تلقائي من الأدوار الثلاثة)
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-700 font-sans">
              Section 2: Average Score by Subjects &amp; Total Average
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border-2 border-[#b59e54] bg-[#b59e54] shadow-xs">
            <table className="w-full text-center border-collapse text-sm" dir="rtl">
              <thead>
                <tr className="bg-[#b8a258] text-[#5e4b14] font-black text-sm sm:text-base">
                  <th className="py-3 px-2.5 w-16 border border-[#b59e54]">م</th>
                  <th className="py-3 px-4 border border-[#b59e54]">المواد</th>
                  {data.semDawrs.map(p => (
                    <th key={p} className="py-3 px-2.5 w-24 border border-[#b59e54] text-xs sm:text-sm">
                      {gradingNamesMap[p].ar}
                    </th>
                  ))}
                  <th className="py-3 px-2.5 w-24 border border-[#b59e54] text-xs sm:text-sm">
                    المجموع
                  </th>
                  <th className="py-3 px-3 w-32 border border-[#b59e54]">الدرجة (المعدل)</th>
                  <th className="py-3 px-4 w-32 border border-[#b59e54]">تقدير</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {data.section2SubjectRows.map(row => {
                  const hoverKey = `sem-${sem}-${row.subject.SubjectID}`;
                  const isHovered = hoveredSubjectKey === hoverKey;
                  const isNashat = isNashatSubject(row.subject);

                  return (
                    <tr
                      key={row.subject.SubjectID}
                      onMouseEnter={() => setHoveredSubjectKey(hoverKey)}
                      onMouseLeave={() => setHoveredSubjectKey(null)}
                      onClick={() =>
                        setDetailModalData({
                          subject: row.subject,
                          contextType: 'semester',
                          semester: sem,
                        })
                      }
                      title={`${row.instructor.roleLabelAr}: ${row.instructor.nameAr} (${row.instructor.nameEn}) — اضغط لعرض تفاصيل المادة`}
                      className={`cursor-pointer transition-all ${
                        row.hasDRP
                          ? 'bg-red-100 hover:bg-red-200/90 text-red-950 ring-2 ring-red-500 ring-inset font-black'
                          : 'hover:brightness-95'
                      }`}
                    >
                      {/* 1. م */}
                      <td
                        className={`py-2.5 px-2.5 border border-[#c5b271] font-sans ${
                          row.hasDRP ? 'bg-red-200 text-red-950 font-black' : 'bg-white text-slate-900'
                        }`}
                      >
                        {row.index}
                      </td>

                      {/* 2. المواد (Hover shows Ustadh, Click opens Details) */}
                      <td
                        className={`py-2.5 px-4 border border-[#c5b271] relative ${
                          row.hasDRP
                            ? 'bg-red-100 text-red-950 font-black'
                            : 'bg-[#f6f3ec] text-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-serif text-base font-black">
                            {row.subject.SubjectArabic || row.subject.SubjectClass}
                          </span>
                          {isNashat && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-sans font-bold">
                              SSG نشاط
                            </span>
                          )}
                          {row.hasDRP && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-600 text-white font-sans font-black">
                              DRP منسحب
                            </span>
                          )}
                        </div>

                        {isHovered && (
                          <div
                            className="
                              z-30 mt-1 mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                              bg-slate-900 text-amber-300 text-xs font-bold shadow-lg border border-amber-400/50
                            "
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                              {row.instructor.isSSG
                                ? `مسؤول النشاط (SSG): ${row.instructor.nameAr}`
                                : `${row.instructor.nameAr} (${row.instructor.nameEn})`}
                            </span>
                            <span className="text-[10px] text-slate-300 underline mr-1">
                              • اضغط للتفاصيل
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 3, 4, 5. The 3 Dawr Scores for this Subject */}
                      {data.semDawrs.map(p => {
                        const val = row.dawrValues[p];
                        return (
                          <td
                            key={p}
                            className={`py-2.5 px-2.5 border border-[#c5b271] font-mono text-sm ${
                              val === 'DRP'
                                ? 'bg-red-600 text-white font-black'
                                : val === 'INC'
                                ? 'bg-amber-100 text-amber-900 font-black'
                                : 'bg-white text-slate-800'
                            }`}
                          >
                            {val !== null ? val : ''}
                          </td>
                        );
                      })}

                      {/* 6. المجموع (Total sum of the 3 Dawrs for this Subject) */}
                      <td className="py-2.5 px-2.5 border border-[#c5b271] bg-white font-mono text-sm text-slate-800">
                        {row.subjectTotal !== null ? row.subjectTotal : ''}
                      </td>

                      {/* 7. الدرجة / المعدل (Subject Average across the 3 Dawrs; excluded if INC or ungraded) */}
                      <td
                        className={`py-2.5 px-3 border border-[#c5b271] font-mono text-base font-black ${
                          row.hasDRP
                            ? 'bg-red-600 text-white'
                            : row.hasINC
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-white text-slate-950'
                        }`}
                      >
                        {row.subjectAvg !== null ? row.subjectAvg : ''}
                      </td>

                      {/* 8. تقدير (Rating cell) */}
                      <td
                        className={`py-2.5 px-4 border border-[#c5b271] font-serif text-base ${row.rating.cellBgClass}`}
                      >
                        {row.rating.labelAr}
                      </td>
                    </tr>
                  );
                })}

                {/* Bottom Summary Row: مجموع (Total Average of Subjects) */}
                <tr>
                  <td className="py-3 px-2.5 border border-[#c5b271] bg-white"></td>
                  <td className="py-3 px-4 border border-[#c5b271] bg-[#f6f3ec] text-slate-950 font-serif font-black text-base">
                    مجموع / المعدل العام للمواد
                  </td>
                  {data.section1DawrRows.map(d => (
                    <td
                      key={d.period}
                      className="py-3 px-2.5 border border-[#c5b271] bg-white font-mono text-xs text-slate-600"
                    >
                      {d.averageScore !== null ? d.averageScore : ''}
                    </td>
                  ))}
                  <td className="py-3 px-2.5 border border-[#c5b271] bg-white font-mono text-sm font-black text-slate-800">
                    {data.section2TotalSum !== null ? data.section2TotalSum : ''}
                  </td>
                  <td className="py-3 px-3 border border-[#c5b271] bg-white font-mono text-base font-black text-emerald-950">
                    {data.section2OverallAvg !== null ? data.section2OverallAvg : ''}
                  </td>
                  <td
                    className={`py-3 px-4 border border-[#c5b271] font-serif text-base ${
                      data.section2OverallAvg !== null
                        ? data.section2OverallRating.cellBgClass
                        : 'bg-white'
                    }`}
                  >
                    {data.section2OverallAvg !== null ? data.section2OverallRating.labelAr : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Student Identity & Action Bar (Hidden when printing Form 138) */}
      <div className="no-print bg-gradient-to-r from-[#126b38] via-emerald-900 to-slate-900 rounded-3xl p-5 text-white shadow-lg border border-emerald-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0 bg-slate-800 flex items-center justify-center">
            {student.ProfilePic ? (
              <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
            ) : (
              <GraduationCap className="w-7 h-7 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                {student.RollNo}
              </span>
              <span className="text-xs text-emerald-200 font-bold font-serif" dir="rtl">
                {studentClass?.ClassName}
              </span>
              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full text-amber-200 font-bold">
                {academicYear}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-1">
              <span>{student.Name}</span>
              {student.NameArabic && (
                <span className="text-amber-300 font-serif font-normal text-base sm:text-lg" dir="rtl">
                  ({student.NameArabic})
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Right Controls: Enrollment Class History Switcher & Form 138 Print Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Requirement 9: Allow viewing completed subjects across enrollments if student has multiple class records */}
          {enrollmentHistory.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900/70 border border-emerald-700 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-emerald-300 font-bold">السجل الدراسي:</span>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(Number(e.target.value))}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {Array.from(new Set([student.ClassID, ...enrollmentHistory.map(e => e.ClassID)])).map(cid => {
                  const clsObj = classes.find(c => c.ClassID === cid);
                  return (
                    <option key={cid} value={cid} className="bg-slate-900 text-white">
                      {clsObj?.ClassName || `Class #${cid}`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Requirement 11: Print Form 138 Report Card with option for Dawr or Semester */}
          <button
            type="button"
            onClick={() => {
              setPrintScope(selectedSemester === '2nd' ? 'sem-2nd' : 'sem-1st');
              setIsPrintModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Print Form 138 Card (طباعة بطاقة الدرجات)</span>
          </button>
        </div>
      </div>

      {/* Semester & Dawr Filter Bar (No-print) */}
      <div className="no-print bg-white p-3.5 rounded-2xl border border-[#dfd4b8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Semester Selector (Every semester has 3 Dawrs) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f3efe6] rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSelectedSemester('1st');
              setGlobalSemester('1st');
              setCardFilter('all-in-sem');
            }}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              selectedSemester === '1st'
                ? 'bg-[#126b38] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#e5dec9]'
            }`}
          >
            1st Semester • الفصل الأول (الأدوار ١، ٢، ٣ + الفصل الأول)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSemester('2nd');
              setGlobalSemester('2nd');
              setCardFilter('all-in-sem');
            }}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              selectedSemester === '2nd'
                ? 'bg-[#126b38] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#e5dec9]'
            }`}
          >
            2nd Semester • الفصل الثاني (الأدوار ٤، ٥، ٦ + الفصل الثاني)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSemester('both');
              setCardFilter('all-in-sem');
            }}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              selectedSemester === 'both'
                ? 'bg-[#126b38] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#e5dec9]'
            }`}
          >
            Full Year • العام الكامل (٦ أدوار + الفصلين)
          </button>
        </div>

        {/* Quick Jump / Filter within the Semester */}
        {selectedSemester !== 'both' && (
          <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
            <span className="text-xs font-bold text-slate-500 ml-1">عرض:</span>
            <button
              type="button"
              onClick={() => setCardFilter('all-in-sem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                cardFilter === 'all-in-sem'
                  ? 'bg-[#9f7a28] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل (الأدوار ٣ + الفصل)
            </button>
            {(selectedSemester === '1st' ? sem1Dawrs : sem2Dawrs).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setCardFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  cardFilter === p
                    ? 'bg-[#9f7a28] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {gradingNamesMap[p].ar}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCardFilter('semester-only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                cardFilter === 'semester-only'
                  ? 'bg-[#9f7a28] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {selectedSemester === '1st' ? 'فصل الأول فقط' : 'فصل الثاني فقط'}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAIN CARDS STACK (Every Dawr in the Semester, followed by the Semester)   */}
      {/* ========================================================================= */}
      <div className="no-print space-y-6">
        {selectedSemester === '1st' && (
          <>
            {(cardFilter === 'all-in-sem' || cardFilter === '1st') && renderDawrCard('1st')}
            {(cardFilter === 'all-in-sem' || cardFilter === '2nd') && renderDawrCard('2nd')}
            {(cardFilter === 'all-in-sem' || cardFilter === '3rd') && renderDawrCard('3rd')}
            {(cardFilter === 'all-in-sem' || cardFilter === 'semester-only') && renderSemesterCard('1st')}
          </>
        )}

        {selectedSemester === '2nd' && (
          <>
            {(cardFilter === 'all-in-sem' || cardFilter === '4th') && renderDawrCard('4th')}
            {(cardFilter === 'all-in-sem' || cardFilter === '5th') && renderDawrCard('5th')}
            {(cardFilter === 'all-in-sem' || cardFilter === '6th') && renderDawrCard('6th')}
            {(cardFilter === 'all-in-sem' || cardFilter === 'semester-only') && renderSemesterCard('2nd')}
          </>
        )}

        {selectedSemester === 'both' && (
          <>
            {renderDawrCard('1st')}
            {renderDawrCard('2nd')}
            {renderDawrCard('3rd')}
            {renderSemesterCard('1st')}
            {renderDawrCard('4th')}
            {renderDawrCard('5th')}
            {renderDawrCard('6th')}
            {renderSemesterCard('2nd')}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBJECT DETAILS MODAL (Requirements 5 & 6: Attendance, Quiz, Exam, SSG)   */}
      {/* ========================================================================= */}
      {detailModalData && (
        <div
          className="no-print fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setDetailModalData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-[#c5b589] space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {(() => {
              const { subject, contextType, period, semester } = detailModalData;
              const instructor = getSubjectInstructor(subject);
              const isNashat = isNashatSubject(subject);
              const periodsToInspect: GradingPeriod[] =
                contextType === 'dawr' && period
                  ? [period]
                  : (semester || '1st') === '1st'
                  ? sem1Dawrs
                  : sem2Dawrs;

              return (
                <>
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
                          isNashat ? 'bg-rose-700' : 'bg-[#126b38]'
                        }`}
                      >
                        {isNashat ? <Award className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 font-serif">
                            تفاصيل درجة مقرر: {subject.SubjectArabic || subject.SubjectClass}
                          </h3>
                          {isNashat && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                              مقرر النشاط - بإشراف مجلس الطلبة (SSG)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-sans" dir="ltr">
                          {subject.SubjectClass} {subject.SubjectCode ? `(${subject.SubjectCode})` : ''} &bull;{' '}
                          {contextType === 'dawr' && period
                            ? `${gradingNamesMap[period].quarterEn} (${gradingNamesMap[period].ar})`
                            : semester === '2nd'
                            ? '2nd Semester (الفصل الثاني)'
                            : '1st Semester (الفصل الأول)'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailModalData(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Ustadh / SSG Officer Card */}
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isNashat
                        ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                        : 'bg-[#f6f3ec] border-[#cfc39f] text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isNashat ? 'bg-rose-700 text-white' : 'bg-[#126b38] text-white'
                        }`}
                      >
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">
                          {instructor.roleLabelAr} ({instructor.roleLabelEn})
                        </span>
                        <span className="text-sm sm:text-base font-black font-serif block">
                          {instructor.nameAr}
                        </span>
                        <span className="text-xs text-slate-600 font-sans block" dir="ltr">
                          {instructor.nameEn}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-sans text-xs">
                      <span className="px-3 py-1 rounded-full bg-white border border-slate-300 font-bold text-slate-800 inline-block">
                        {studentClass?.ClassName}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Breakdown per Period (Attendance, Quiz, Mid-Exam, Final Exam) */}
                  <div className="space-y-4">
                    {periodsToInspect.map(p => {
                      const details = getCriteriaDetailsForSubject(subject, p);

                      return (
                        <div
                          key={p}
                          className="rounded-2xl border border-[#cfc39f] bg-[#fcfaf5] p-4 space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-[#e5dec9] pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg bg-[#b8a258] text-slate-950 font-black font-serif text-xs sm:text-sm">
                                {gradingNamesMap[p].ar} ({gradingNamesMap[p].quarterEn})
                              </span>
                              {details.totalRecordedDays > 0 && (
                                <span className="text-xs text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                                  سجل الحضور: حاضر {toHindiNumerals(details.presentDays)} / غائب{' '}
                                  {toHindiNumerals(details.absentDays)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600">الدرجة النهائية:</span>
                              <span className="px-3 py-1 rounded-lg bg-white border border-slate-300 font-mono font-black text-sm text-slate-950">
                                {details.rawFinal !== undefined && details.rawFinal !== null
                                  ? details.rawFinal
                                  : 'غير مرصود'}
                              </span>
                              {details.rating.labelAr && (
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-black font-serif ${details.rating.pillClass}`}
                                >
                                  {details.rating.labelAr}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 4 Criteria Boxes: Attendance, Quiz, Mid-Exam, Final Exam */}
                          {details.rawFinal === 'DRP' ? (
                            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>الطالب مسجل كمنسحب (DRP - Dropped) في هذه المادة لهذا الدور.</span>
                            </div>
                          ) : details.rawFinal === 'INC' ? (
                            <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>
                                الدرجة غير مكتملة (INC - Incomplete). لا تدخل في حساب المعدل حتى يتم استكمال المتطلبات.
                              </span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {details.breakdown.map(item => (
                                <div
                                  key={item.id}
                                  className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="text-xs font-black text-slate-900 font-serif block">
                                      {item.nameAr}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-sans block" dir="ltr">
                                      {item.nameEn} ({item.weight}%)
                                    </span>
                                  </div>
                                  <div className="text-left shrink-0">
                                    <span className="font-mono font-black text-sm text-[#126b38] block">
                                      {item.score !== null ? `${item.score} / 100` : '—'}
                                    </span>
                                    {item.weightedPoints !== null && (
                                      <span className="text-[10px] font-mono text-slate-500 block">
                                        ({item.weightedPoints} من {item.weight})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setDetailModalData(null)}
                      className="px-6 py-2 bg-[#126b38] hover:bg-[#0e582e] text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      إغلاق (Close)
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RANK AMONG CLASSMATES MODAL (Requirement 8: Completed vs Temporary)       */}
      {/* ========================================================================= */}
      {rankModalData && (
        <div
          className="no-print fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setRankModalData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#c5b589] space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const { contextType, period, semester } = rankModalData;
              const rankInfo = computeClassRank(contextType, period, semester);
              const periodLabelEn =
                contextType === 'dawr' && period
                  ? gradingNamesMap[period].quarterEn
                  : semester === '2nd'
                  ? '2nd Semester'
                  : '1st Semester';
              const periodLabelAr =
                contextType === 'dawr' && period
                  ? gradingNamesMap[period].ar
                  : semester === '2nd'
                  ? 'فصل الثاني'
                  : 'فصل الأول';

              return (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-950 shadow-md">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          Class Rank &bull; {periodLabelEn} ({periodLabelAr})
                        </h3>
                        <p className="text-xs text-slate-500 font-serif" dir="rtl">
                          ترتيب الطالب بين زملائه في الصف ({studentClass?.ClassName})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRankModalData(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Requirement 8: Completed vs Temporary Status Banner */}
                  {rankInfo.isRankCompleted ? (
                    <div
                      className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex items-center gap-3 text-xs font-bold"
                      dir="rtl"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-black block text-sm font-serif">
                          الترتيب النهائي المعتمد (Completed Official Rank)
                        </span>
                        <span>
                          تم استكمال رصد جميع المواد الدراسية لهذه الفترة، وهذا الترتيب نهائي ومعتمد.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-center gap-3 text-xs font-bold"
                      dir="rtl"
                    >
                      <Hourglass className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-black block text-sm font-serif">
                          ترتيب مؤقت (Temporary Standing - Grades Not Yet Completed)
                        </span>
                        <span>
                          لم يكتمل رصد جميع المواد الدراسية بعد (أو توجد مادة غير مكتملة INC). هذا الترتيب مؤقت بناءً على المواد المرصودة حالياً ({rankInfo.myEntry?.gradedCount || 0} من{' '}
                          {rankInfo.myEntry?.totalExpected || classSubjects.length}).
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Student Spotlight Card */}
                  <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-200 flex items-center justify-center">
                        {student.ProfilePic ? (
                          <img src={student.ProfilePic} alt={student.Name} className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{student.Name}</h4>
                        <p className="text-xs text-amber-800 font-serif">{student.NameArabic}</p>
                        <span
                          className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            rankInfo.isRankCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {rankInfo.isRankCompleted ? 'Final Standing' : 'Temporary Rank (مؤقت)'}
                        </span>
                      </div>
                    </div>

                    <div className="text-center px-4 py-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-sm border border-amber-300">
                      <span className="block text-[10px] font-black uppercase">
                        {rankInfo.isRankCompleted ? 'Class Rank' : 'Temp Rank'}
                      </span>
                      <span className="text-2xl font-black">#{rankInfo.myRank}</span>
                      <span className="block text-[10px] font-bold">of {rankInfo.totalStudents}</span>
                    </div>
                  </div>

                  {/* Classmates Leaderboard */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-amber-500" />
                      <span>Classmates Ranking ({studentClass?.ClassName})</span>
                    </span>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {rankInfo.roster.map((item, idx) => {
                        const isMe = item.student.StudentID === student.StudentID;
                        return (
                          <div
                            key={item.student.StudentID}
                            className={`p-2.5 px-3 flex items-center justify-between text-xs ${
                              isMe
                                ? 'bg-amber-100/80 font-bold border-l-4 border-amber-500'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                                  idx === 0
                                    ? 'bg-amber-400 text-slate-950'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-800'
                                    : idx === 2
                                    ? 'bg-amber-200 text-amber-900'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <span className="text-slate-900 font-bold">
                                  {item.student.NameArabic || item.student.Name}
                                </span>
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] text-emerald-800 font-black">
                                    (أنت / You)
                                  </span>
                                )}
                                <span className="block text-[10px] text-slate-500">
                                  {item.isComplete ? (
                                    <span className="text-emerald-700 font-semibold">
                                      مكتمل (Completed)
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 font-semibold">
                                      مؤقت ({item.gradedCount}/{item.totalExpected} مرصود)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-sm">
                                {item.avgGrade !== null ? `${item.avgGrade}%` : '—'}
                              </span>
                              {item.rating.labelAr && (
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-black rounded ${item.rating.pillClass}`}
                                >
                                  {item.rating.labelAr}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setRankModalData(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FORM 138 REPORT CARD PRINT MODAL & PRINTABLE VIEW (Requirement 11)        */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border-2 border-[#b8a258] space-y-5 my-8 print:my-0 print:border-0 print:shadow-none print:rounded-none print:max-w-full print:p-2">
            {/* Modal Top Controls (Hidden when printing) */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#126b38] text-white flex items-center justify-center shadow">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Form 138 Student Report Card &bull; بطاقة الدرجات الرسمية (نموذج ١٣٨)
                  </h3>
                  <p className="text-xs text-slate-500">
                    اختر الدور أو الفصل الدراسي المراد طباعته على شكل بطاقة Form 138 الرسمية
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Option which Dawr or Semester to Print */}
                <select
                  value={printScope}
                  onChange={e => setPrintScope(e.target.value as PrintScope)}
                  className="px-3 py-2 border-2 border-[#126b38] rounded-xl text-xs font-black text-slate-900 bg-emerald-50/60 focus:outline-none cursor-pointer"
                >
                  <optgroup label="By Semester (حسب الفصل الدراسي)">
                    <option value="sem-1st">1st Semester • الفصل الأول (الأدوار ١، ٢، ٣)</option>
                    <option value="sem-2nd">2nd Semester • الفصل الثاني (الأدوار ٤، ٥، ٦)</option>
                    <option value="full-year">Full Academic Year • العام الدراسي الكامل</option>
                  </optgroup>
                  <optgroup label="By Single Dawr (حسب الدور الفردي)">
                    <option value="dawr-1st">1st Dawr • دور الأول</option>
                    <option value="dawr-2nd">2nd Dawr • دور الثاني</option>
                    <option value="dawr-3rd">3rd Dawr • دور الثالث</option>
                    <option value="dawr-4th">4th Dawr • دور الرابع</option>
                    <option value="dawr-5th">5th Dawr • دور الخامس</option>
                    <option value="dawr-6th">6th Dawr • دور السادس</option>
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-black shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Print Form 138 Now (طباعة)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* OFFICIAL FORM 138 REPORT CARD LAYOUT                              */}
            {/* ================================================================= */}
            <div className="border-4 border-double border-[#126b38] rounded-2xl p-5 sm:p-7 bg-[#fdfbf7] text-slate-900 space-y-5">
              {/* Form 138 Header */}
              <div className="flex items-center justify-between border-b-2 border-[#126b38] pb-4 gap-4">
                <div className="text-left text-xs space-y-0.5 font-sans">
                  <div className="font-black text-[#126b38] text-sm uppercase tracking-wider">
                    FORM 138 - REPORT CARD
                  </div>
                  <div className="font-bold text-slate-700">Jamiatu Monib Alkuzbary Al-Arabia</div>
                  <div className="text-slate-500">System: JMAA-MoritAko</div>
                  <div className="font-mono text-[11px] text-slate-600">Academic Year: {academicYear}</div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div
                    style={{ width: '64px', height: '64px' }}
                    className="w-16 h-16 rounded-full border-2 border-[#9f7a28] bg-white p-1 flex items-center justify-center overflow-hidden shadow-xs"
                  >
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="mt-1.5 font-serif font-black text-base sm:text-lg text-[#126b38]">
                    جامعة منيب الكزبري العربية
                  </h2>
                  <span className="text-[11px] font-bold text-[#9f7a28] uppercase tracking-widest">
                    Official Learner&apos;s Progress Report Card (Form 138)
                  </span>
                </div>

                <div className="text-right text-xs space-y-0.5 font-serif" dir="rtl">
                  <div className="font-black text-[#126b38] text-sm">كشف الدرجات المدرسي الرسمي</div>
                  <div className="font-bold text-slate-700">نموذج ١٣٨ (Form 138)</div>
                  <div className="text-slate-600">
                    الفترة:{' '}
                    <strong>
                      {printScope.startsWith('dawr-')
                        ? gradingNamesMap[printScope.replace('dawr-', '') as GradingPeriod].ar
                        : printScope === 'sem-1st'
                        ? 'الفصل الدراسي الأول (الأدوار ١-٣)'
                        : printScope === 'sem-2nd'
                        ? 'الفصل الدراسي الثاني (الأدوار ٤-٦)'
                        : 'العام الدراسي الكامل (٦ أدوار)'}
                    </strong>
                  </div>
                  <div className="text-slate-500">
                    تاريخ الإصدار: {new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Student Particulars Box on Form 138 */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-[#c5b589] text-xs"
                dir="rtl"
              >
                <div>
                  <span className="text-slate-500 block">اسم الطالب (Student Name):</span>
                  <span className="font-black text-slate-950 font-serif text-sm">
                    {student.NameArabic || student.Name}
                  </span>
                  <span className="block text-[11px] text-slate-600 font-sans" dir="ltr">
                    {student.Name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">الرقم الأكاديمي (Roll / ID):</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {student.RollNo} {student.IdNumber ? `• ${student.IdNumber}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">الصف والمرحلة (Class &amp; Stage):</span>
                  <span className="font-bold text-slate-900 font-serif text-sm">
                    {studentClass?.ClassName} ({studentClass?.Level})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">القسم والعام (Dept &amp; SY):</span>
                  <span className="font-bold text-slate-900 font-sans text-sm">
                    [{studentClass?.Department?.toUpperCase()}] {academicYear}
                  </span>
                </div>
              </div>

              {/* Form 138 Body Content based on printScope */}
              {printScope.startsWith('dawr-') && (() => {
                const p = printScope.replace('dawr-', '') as GradingPeriod;
                const dCard = buildDawrCardData(p);
                const rInfo = computeClassRank('dawr', p);

                return (
                  <div className="space-y-4" dir="rtl">
                    <div className="flex items-center justify-between bg-[#ede5d1] px-4 py-2 rounded-lg border border-[#b8a258]">
                      <span className="font-serif font-black text-sm text-slate-950">
                        بيان درجات {dCard.meta.ar} ({dCard.meta.quarterEn})
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        الترتيب الصفي: #{rInfo.myRank} من {rInfo.totalStudents} (
                        {rInfo.isRankCompleted ? 'نهائي معتمد' : 'ترتيب مؤقت'})
                      </span>
                    </div>

                    <table className="w-full text-center border-collapse text-xs sm:text-sm border-2 border-[#b59e54]">
                      <thead>
                        <tr className="bg-[#b8a258] text-slate-950 font-black">
                          <th className="py-2 px-2 border border-[#9c8438] w-12">م</th>
                          <th className="py-2 px-3 border border-[#9c8438]">المواد الدراسية (Subjects)</th>
                          <th className="py-2 px-3 border border-[#9c8438]">أستاذ المادة (Ustadh)</th>
                          <th className="py-2 px-3 border border-[#9c8438] w-28">الدرجة</th>
                          <th className="py-2 px-3 border border-[#9c8438] w-28">تقدير</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold">
                        {dCard.rows.map(r => (
                          <tr
                            key={r.subject.SubjectID}
                            className={r.isDRP ? 'bg-red-100 text-red-950 font-black' : 'bg-white'}
                          >
                            <td className="py-2 px-2 border border-[#c5b271]">{r.index}</td>
                            <td className="py-2 px-3 border border-[#c5b271] bg-[#f6f3ec] font-serif">
                              {r.subject.SubjectArabic || r.subject.SubjectClass}
                            </td>
                            <td className="py-2 px-3 border border-[#c5b271] text-xs font-serif text-slate-700">
                              {r.instructor.nameAr}
                            </td>
                            <td className="py-2 px-3 border border-[#c5b271] font-mono">
                              {r.displayValue !== null ? r.displayValue : ''}
                            </td>
                            <td className={`py-2 px-3 border border-[#c5b271] font-serif ${r.rating.cellBgClass}`}>
                              {r.rating.labelAr}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#f6f3ec] font-black">
                          <td className="py-2.5 px-2 border border-[#9c8438]"></td>
                          <td className="py-2.5 px-3 border border-[#9c8438] font-serif" colSpan={2}>
                            المجموع والمعدل العام ({dCard.meta.ar})
                          </td>
                          <td className="py-2.5 px-3 border border-[#9c8438] font-mono">
                            {dCard.averageScore !== null ? dCard.averageScore : ''}
                          </td>
                          <td
                            className={`py-2.5 px-3 border border-[#9c8438] font-serif ${
                              dCard.averageScore !== null ? dCard.overallRating.cellBgClass : ''
                            }`}
                          >
                            {dCard.averageScore !== null ? dCard.overallRating.labelAr : ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {(printScope === 'sem-1st' || printScope === 'sem-2nd') && (() => {
                const sem: SemesterType = printScope === 'sem-1st' ? '1st' : '2nd';
                const sData = sem === '1st' ? sem1Data : sem2Data;
                const rInfo = computeClassRank('semester', undefined, sem);

                return (
                  <div className="space-y-4" dir="rtl">
                    <div className="flex items-center justify-between bg-[#ede5d1] px-4 py-2 rounded-lg border border-[#b8a258]">
                      <span className="font-serif font-black text-sm text-slate-950">
                        بيان درجات {sData.titleAr} ({sData.titleEn})
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        الترتيب الصفي: #{rInfo.myRank} من {rInfo.totalStudents} (
                        {rInfo.isRankCompleted ? 'نهائي معتمد' : 'ترتيب مؤقت'})
                      </span>
                    </div>

                    {/* Section 1: Average by Dawr */}
                    <div className="space-y-1">
                      <div className="text-xs font-black font-serif text-slate-800">
                        أولاً: خلاصة معدل الأدوار الثلاثة للفصل (Average Score by Dawr)
                      </div>
                      <table className="w-full text-center border-collapse text-xs border-2 border-[#b59e54]">
                        <thead>
                          <tr className="bg-[#b8a258] text-slate-950 font-black">
                            <th className="py-1.5 px-2 border border-[#9c8438] w-12">م</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">الدور</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">مجموع الدور</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">معدل الدور</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">التقدير</th>
                          </tr>
                        </thead>
                        <tbody className="font-bold">
                          {sData.section1DawrRows.map(d => (
                            <tr key={d.period} className="bg-white">
                              <td className="py-1.5 px-2 border border-[#c5b271]">{d.index}</td>
                              <td className="py-1.5 px-3 border border-[#c5b271] bg-[#f6f3ec] font-serif">
                                {d.titleAr} ({d.titleEn})
                              </td>
                              <td className="py-1.5 px-3 border border-[#c5b271] font-mono">
                                {d.totalSum !== null ? d.totalSum : ''}
                              </td>
                              <td className="py-1.5 px-3 border border-[#c5b271] font-mono">
                                {d.averageScore !== null ? d.averageScore : ''}
                              </td>
                              <td
                                className={`py-1.5 px-3 border border-[#c5b271] font-serif ${
                                  d.averageScore !== null ? d.rating.cellBgClass : ''
                                }`}
                              >
                                {d.averageScore !== null ? d.rating.labelAr : ''}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-[#f6f3ec] font-black">
                            <td className="py-2 px-2 border border-[#9c8438]"></td>
                            <td className="py-2 px-3 border border-[#9c8438] font-serif">
                              مجموع / المعدل العام للأدوار
                            </td>
                            <td className="py-2 px-3 border border-[#9c8438] font-mono">
                              {sData.section1TotalOfAverages ?? ''}
                            </td>
                            <td className="py-2 px-3 border border-[#9c8438] font-mono">
                              {sData.section1OverallAvg ?? ''}
                            </td>
                            <td
                              className={`py-2 px-3 border border-[#9c8438] font-serif ${
                                sData.section1OverallAvg !== null
                                  ? sData.section1OverallRating.cellBgClass
                                  : ''
                              }`}
                            >
                              {sData.section1OverallAvg !== null
                                ? sData.section1OverallRating.labelAr
                                : ''}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Section 2: Average by Subjects */}
                    <div className="space-y-1">
                      <div className="text-xs font-black font-serif text-slate-800">
                        ثانياً: درجات ومعدلات المواد الدراسية للفصل (Average Score by Subjects)
                      </div>
                      <table className="w-full text-center border-collapse text-xs border-2 border-[#b59e54]">
                        <thead>
                          <tr className="bg-[#b8a258] text-slate-950 font-black">
                            <th className="py-1.5 px-2 border border-[#9c8438] w-12">م</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">المواد</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">الأستاذ</th>
                            {sData.semDawrs.map(p => (
                              <th key={p} className="py-1.5 px-2 border border-[#9c8438]">
                                {gradingNamesMap[p].ar}
                              </th>
                            ))}
                            <th className="py-1.5 px-2 border border-[#9c8438]">المجموع</th>
                            <th className="py-1.5 px-2 border border-[#9c8438]">المعدل</th>
                            <th className="py-1.5 px-3 border border-[#9c8438]">تقدير</th>
                          </tr>
                        </thead>
                        <tbody className="font-bold">
                          {sData.section2SubjectRows.map(r => (
                            <tr
                              key={r.subject.SubjectID}
                              className={r.hasDRP ? 'bg-red-100 text-red-950 font-black' : 'bg-white'}
                            >
                              <td className="py-1.5 px-2 border border-[#c5b271]">{r.index}</td>
                              <td className="py-1.5 px-3 border border-[#c5b271] bg-[#f6f3ec] font-serif">
                                {r.subject.SubjectArabic || r.subject.SubjectClass}
                              </td>
                              <td className="py-1.5 px-2 border border-[#c5b271] font-serif text-[11px] text-slate-700">
                                {r.instructor.nameAr}
                              </td>
                              {sData.semDawrs.map(p => (
                                <td key={p} className="py-1.5 px-2 border border-[#c5b271] font-mono">
                                  {r.dawrValues[p] !== null ? r.dawrValues[p] : ''}
                                </td>
                              ))}
                              <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                                {r.subjectTotal ?? ''}
                              </td>
                              <td className="py-1.5 px-2 border border-[#c5b271] font-mono font-black">
                                {r.subjectAvg ?? ''}
                              </td>
                              <td
                                className={`py-1.5 px-3 border border-[#c5b271] font-serif ${r.rating.cellBgClass}`}
                              >
                                {r.rating.labelAr}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-[#f6f3ec] font-black">
                            <td className="py-2 px-2 border border-[#9c8438]"></td>
                            <td className="py-2 px-3 border border-[#9c8438] font-serif" colSpan={5}>
                              المجموع والمعدل الفصلي العام للمواد
                            </td>
                            <td className="py-2 px-2 border border-[#9c8438] font-mono">
                              {sData.section2TotalSum ?? ''}
                            </td>
                            <td className="py-2 px-2 border border-[#9c8438] font-mono">
                              {sData.section2OverallAvg ?? ''}
                            </td>
                            <td
                              className={`py-2 px-3 border border-[#9c8438] font-serif ${
                                sData.section2OverallAvg !== null
                                  ? sData.section2OverallRating.cellBgClass
                                  : ''
                              }`}
                            >
                              {sData.section2OverallAvg !== null
                                ? sData.section2OverallRating.labelAr
                                : ''}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {printScope === 'full-year' && (
                <div className="space-y-4" dir="rtl">
                  <div className="bg-[#ede5d1] px-4 py-2 rounded-lg border border-[#b8a258] font-serif font-black text-sm">
                    كشف الدرجات السنوي الشامل (الأدوار الستة والفصلين الأول والثاني)
                  </div>
                  <table className="w-full text-center border-collapse text-xs border-2 border-[#b59e54]">
                    <thead>
                      <tr className="bg-[#b8a258] text-slate-950 font-black">
                        <th className="py-1.5 px-2 border border-[#9c8438]">م</th>
                        <th className="py-1.5 px-3 border border-[#9c8438]">المواد</th>
                        <th className="py-1.5 px-2 border border-[#9c8438]">دور ١</th>
                        <th className="py-1.5 px-2 border border-[#9c8438]">دور ٢</th>
                        <th className="py-1.5 px-2 border border-[#9c8438]">دور ٣</th>
                        <th className="py-1.5 px-2 border border-[#9c8438] bg-amber-200/60">فصل ١</th>
                        <th className="py-1.5 px-2 border border-[#9c8438]">دور ٤</th>
                        <th className="py-1.5 px-2 border border-[#9c8438]">دور ٥</th>
                        <th className="py-1.5 px-2 border border-[#9c8438]">دور ٦</th>
                        <th className="py-1.5 px-2 border border-[#9c8438] bg-amber-200/60">فصل ٢</th>
                        <th className="py-1.5 px-3 border border-[#9c8438]">تقدير الفصل ١</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {sem1Data.section2SubjectRows.map((r1, idx) => {
                        const r2 = sem2Data.section2SubjectRows[idx];
                        return (
                          <tr key={r1.subject.SubjectID} className="bg-white">
                            <td className="py-1.5 px-2 border border-[#c5b271]">{r1.index}</td>
                            <td className="py-1.5 px-3 border border-[#c5b271] bg-[#f6f3ec] font-serif">
                              {r1.subject.SubjectArabic || r1.subject.SubjectClass}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                              {r1.dawrValues['1st'] ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                              {r1.dawrValues['2nd'] ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                              {r1.dawrValues['3rd'] ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono bg-amber-50 font-black">
                              {r1.subjectAvg ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                              {r2?.dawrValues['4th'] ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                              {r2?.dawrValues['5th'] ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono">
                              {r2?.dawrValues['6th'] ?? ''}
                            </td>
                            <td className="py-1.5 px-2 border border-[#c5b271] font-mono bg-amber-50 font-black">
                              {r2?.subjectAvg ?? ''}
                            </td>
                            <td
                              className={`py-1.5 px-2 border border-[#c5b271] font-serif ${r1.rating.cellBgClass}`}
                            >
                              {r1.rating.labelAr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Form 138 Grading Scale Descriptors & Signature Blocks */}
              <div className="pt-3 border-t border-[#c5b589] space-y-4" dir="rtl">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-black text-slate-800">دليل التقديرات (Grading Scale):</span>
                  <span className="px-2 py-0.5 rounded bg-[#6bd953] text-slate-950 font-bold">
                    90-100: ممتاز (Excellent)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f7d842] text-slate-950 font-bold">
                    80-89: جيد جدا (Very Good)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#fbbd4c] text-slate-950 font-bold">
                    70-79: جيد (Good)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#fb8c44] text-slate-950 font-bold">
                    60-69: مقبول (Acceptable)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#fc5454] text-slate-950 font-bold">
                    أقل من 60: راسب (Failed)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold">
                    INC: غير مكتمل
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                    DRP: منسحب
                  </span>
                </div>

                {/* Official Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs font-serif">
                  <div className="space-y-6">
                    <div className="font-bold text-slate-700">توقيع رائد الفصل (Class Adviser)</div>
                    <div className="border-b border-slate-400 mx-6"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="font-bold text-slate-700">توقيع ولي الأمر (Parent / Guardian)</div>
                    <div className="border-b border-slate-400 mx-6"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="font-bold text-slate-700">اعتماد مدير الجامعة (Principal / Dean)</div>
                    <div className="font-black text-slate-900">د. منيب الكزبري</div>
                    <div className="border-b border-slate-400 mx-6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
