'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SubjectItem,
  ClassItem,
  StudentItem,
  StudentGradeItem,
  GradingPeriod,
} from '@/lib/types';
import { DataStore } from '@/lib/store';
import {
  Save,
  Download,
  Upload,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
  Unlock,
  Info,
  Clock,
  Hourglass,
  ShieldCheck,
  ShieldAlert,
  Send,
  Award,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { toHindiNumerals } from '@/lib/numerals';

interface ExcelGradeEditorProps {
  subject: SubjectItem;
  classItem: ClassItem;
  students: StudentItem[];
  allGrades: StudentGradeItem[];
  teacherSubjects: { subject: SubjectItem; classItem: ClassItem }[];
  onSelectSubject: (sub: SubjectItem, cls: ClassItem) => void;
  onBack: () => void;
  teacherId: number;
  isMudir?: boolean;
  isSSG?: boolean;
  onSaveSuccess: () => void;
}

type EditorViewMode = 'dawr' | 'semester';

export default function ExcelGradeEditor({
  subject,
  classItem,
  students,
  allGrades,
  teacherSubjects,
  onSelectSubject,
  onBack,
  teacherId,
  isMudir = false,
  isSSG = false,
  onSaveSuccess,
}: ExcelGradeEditorProps) {
  const [viewMode, setViewMode] = useState<EditorViewMode>('dawr');
  const [selectedPeriod, setSelectedPeriod] = useState<GradingPeriod>('1st');
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st');

  // Working grid state: StudentID -> Period -> value (number | 'INC' | 'DRP' | '')
  const [gridValues, setGridValues] = useState<Record<number, Record<string, string>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [quickFillVal, setQuickFillVal] = useState<string>('85');
  const [showQuickFill, setShowQuickFill] = useState(false);

  // Requirement 12: In the teacher's view, DRP students are automatically hidden unless teacher clicks "View All"
  const [showAllStudentsWithDRP, setShowAllStudentsWithDRP] = useState(false);

  // Nashat Subject & SSG Permission Checks
  const isNashatSubject = Boolean(
    subject.IsNashat ||
      subject.SubjectArabic === 'نشاط' ||
      (subject.SubjectClass && subject.SubjectClass.toLowerCase().includes('nashat'))
  );

  // Permission logic:
  // - SSG can ONLY edit Nashat subjects
  // - Regular teachers can edit academic subjects, but NOT Nashat (since SSG keeps Nashat grades)
  // - Mudir is supervisory inspector
  const canUserEditThisSubject = useMemo(() => {
    if (isMudir) return false;
    if (isSSG) return isNashatSubject;
    if (isNashatSubject) return false;
    return true;
  }, [isMudir, isSSG, isNashatSubject]);

  // Focus matrix for Excel-style keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sem1Periods: GradingPeriod[] = ['1st', '2nd', '3rd'];
  const sem2Periods: GradingPeriod[] = ['4th', '5th', '6th'];
  const activePeriods = selectedSemester === '1st' ? sem1Periods : sem2Periods;

  const dawrArabicNames: Record<GradingPeriod, string> = {
    '1st': 'دور الأول',
    '2nd': 'دور الثاني',
    '3rd': 'دور الثالث',
    '4th': 'دور الرابع',
    '5th': 'دور الخامس',
    '6th': 'دور السادس',
  };

  // Helper to check if a student is graded as DRP in the current view (Requirement 12)
  const isStudentDRP = (studentId: number): boolean => {
    const row = gridValues[studentId] || {};
    if (viewMode === 'dawr') {
      const currentVal = (row[selectedPeriod] || '').trim().toUpperCase();
      if (currentVal === 'DRP') return true;
      const saved = allGrades.find(
        g =>
          g.StudentID === studentId &&
          g.SubjectID === subject.SubjectID &&
          g.ClassID === classItem.ClassID &&
          g.Period === selectedPeriod
      );
      return saved?.FinalGrade === 'DRP' && currentVal === '';
    } else {
      return activePeriods.some(p => (row[p] || '').trim().toUpperCase() === 'DRP');
    }
  };

  // Count of DRP students in this class/subject
  const drpStudentsList = useMemo(() => {
    return students.filter(s => isStudentDRP(s.StudentID));
  }, [students, gridValues, allGrades, viewMode, selectedPeriod, activePeriods, subject.SubjectID, classItem.ClassID]);

  // Visible students list: automatically hides DRP students unless "View All" is clicked (Requirement 12)
  const visibleStudents = useMemo(() => {
    if (showAllStudentsWithDRP) return students;
    return students.filter(s => !isStudentDRP(s.StudentID));
  }, [students, showAllStudentsWithDRP, gridValues, allGrades, viewMode, selectedPeriod, activePeriods]);

  // Lock state & ticker
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [mudirGrantHours, setMudirGrantHours] = useState<number>(24);
  const [unlockRequestedLocal, setUnlockRequestedLocal] = useState<boolean>(false);

  // Live timer ticker every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute active lock info for the current view (selectedPeriod or activePeriods)
  const activeLockInfo = useMemo(() => {
    const periodsToCheck: GradingPeriod[] = viewMode === 'dawr' ? [selectedPeriod] : activePeriods;
    const periodGrades = allGrades.filter(
      g =>
        g.ClassID === classItem.ClassID &&
        g.SubjectID === subject.SubjectID &&
        periodsToCheck.includes(g.Period) &&
        g.FinalGrade !== undefined &&
        g.FinalGrade !== null
    );

    const defaultHours = DataStore.getGradeEditWindowHours();
    const primaryPeriod = viewMode === 'dawr' ? selectedPeriod : activePeriods[0];
    const deadlineCheck = DataStore.checkGradeLock(undefined, primaryPeriod);

    if (periodGrades.length === 0) {
      return {
        isLocked: deadlineCheck.isLocked,
        remainingMs: 0,
        allowedHours: defaultHours,
        status: deadlineCheck.isLocked ? ('expired_locked' as const) : ('unsubmitted' as const),
        hasUnlockRequest: unlockRequestedLocal,
        submittedAt: null as string | null,
        expiresAt: deadlineCheck.expiresAt || null,
      };
    }

    const checks = periodGrades.map(g => ({
      grade: g,
      check: DataStore.checkGradeLock(g, g.Period),
    }));

    const anyLocked = checks.some(c => c.check.isLocked);
    const hasUnlockRequest = unlockRequestedLocal || periodGrades.some(g => g.UnlockRequested);

    const graceCheck = checks.find(c => c.check.remainingMs > 0) || checks[0];
    const sampleCheck = graceCheck.check;

    return {
      isLocked: anyLocked,
      remainingMs: sampleCheck.remainingMs,
      allowedHours: sampleCheck.allowedHours || defaultHours,
      status: anyLocked ? ('expired_locked' as const) : sampleCheck.status,
      hasUnlockRequest,
      submittedAt: sampleCheck.submittedAt || null,
      expiresAt: sampleCheck.expiresAt || null,
    };
  }, [allGrades, classItem.ClassID, subject.SubjectID, viewMode, selectedPeriod, activePeriods, nowTime, unlockRequestedLocal]);

  // Dawr submission deadline set by principal
  const currentDawrDeadline = useMemo(() => {
    const periodToInspect = viewMode === 'dawr' ? selectedPeriod : activePeriods[0];
    const item = DataStore.getGradeSubmissionDeadline(periodToInspect);
    if (!item?.deadlineIso) return null;
    const target = new Date(item.deadlineIso).getTime();
    const isExpired = !isNaN(target) && Date.now() > target;
    let days = 0;
    let hours = 0;
    let mins = 0;
    if (!isExpired && !isNaN(target)) {
      const diffSec = Math.floor((target - Date.now()) / 1000);
      days = Math.floor(diffSec / 86400);
      hours = Math.floor((diffSec % 86400) / 3600);
      mins = Math.floor((diffSec % 3600) / 60);
    }
    return {
      period: periodToInspect,
      deadlineIso: item.deadlineIso,
      instructions: item.instructions,
      enforceLock: item.enforceLock ?? true,
      isExpired,
      days,
      hours,
      mins,
    };
  }, [viewMode, selectedPeriod, activePeriods, nowTime]);

  // Countdown timer in Hindi numerals
  const countdown = useMemo(() => {
    const ms = activeLockInfo.remainingMs;
    if (ms <= 0) {
      return { h: '٠', m: '٠', s: '٠', totalSec: 0, percentRemaining: 0, text: 'انتهت المهلة' };
    }
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const totalAllowedSec = (activeLockInfo.allowedHours || 24) * 3600;
    const percentRemaining = Math.min(100, Math.max(0, Math.round((totalSec / totalAllowedSec) * 100)));

    return {
      h: toHindiNumerals(hours),
      m: toHindiNumerals(mins),
      s: toHindiNumerals(secs),
      totalSec,
      percentRemaining,
      text: `${toHindiNumerals(hours)} ساعة و ${toHindiNumerals(mins)} دقيقة و ${toHindiNumerals(secs)} ثانية`,
    };
  }, [activeLockInfo.remainingMs, activeLockInfo.allowedHours]);

  const formatDateTimeArabic = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      const year = toHindiNumerals(d.getFullYear());
      const month = toHindiNumerals(String(d.getMonth() + 1).padStart(2, '0'));
      const day = toHindiNumerals(String(d.getDate()).padStart(2, '0'));
      let hours = d.getHours();
      const ampm = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12 || 12;
      const min = toHindiNumerals(String(d.getMinutes()).padStart(2, '0'));
      return `${year}/${month}/${day} ${toHindiNumerals(hours)}:${min} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  const handleRequestUnlock = () => {
    const periodsToRequest: GradingPeriod[] = viewMode === 'dawr' ? [selectedPeriod] : activePeriods;
    periodsToRequest.forEach(p => {
      DataStore.requestSubjectUnlock(classItem.ClassID, subject.SubjectID, p);
    });
    setUnlockRequestedLocal(true);
    setToastMsg({
      type: 'success',
      text: 'تم إرسال طلب تمديد مهلة التعديل إلى المدير بنجاح! في انتظار الموافقة.',
    });
    onSaveSuccess();
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleMudirGrantUnlock = (hours: number) => {
    const periodsToGrant: GradingPeriod[] = viewMode === 'dawr' ? [selectedPeriod] : activePeriods;
    periodsToGrant.forEach(p => {
      DataStore.grantSubjectUnlock(classItem.ClassID, subject.SubjectID, p, hours);
    });
    setUnlockRequestedLocal(false);
    setToastMsg({
      type: 'success',
      text: `تم منح تمديد مهلة التعديل لمدة (${toHindiNumerals(hours)} ساعة) بنجاح!`,
    });
    onSaveSuccess();
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleMudirLockNow = () => {
    const periodsToLock: GradingPeriod[] = viewMode === 'dawr' ? [selectedPeriod] : activePeriods;
    periodsToLock.forEach(p => {
      DataStore.lockSubjectNow(classItem.ClassID, subject.SubjectID, p);
    });
    setToastMsg({
      type: 'success',
      text: 'تم قفل سجل الدرجات فوراً بنجاح.',
    });
    onSaveSuccess();
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Initialize working grid from stored grades
  useEffect(() => {
    const initial: Record<number, Record<string, string>> = {};

    students.forEach(std => {
      initial[std.StudentID] = {};
      const allPeriods: GradingPeriod[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
      allPeriods.forEach(p => {
        const found = allGrades.find(
          g =>
            g.StudentID === std.StudentID &&
            g.SubjectID === subject.SubjectID &&
            g.ClassID === classItem.ClassID &&
            g.Period === p
        );
        if (found && found.FinalGrade !== undefined && found.FinalGrade !== null) {
          initial[std.StudentID][p] = String(found.FinalGrade);
        } else {
          initial[std.StudentID][p] = '';
        }
      });
    });

    setGridValues(initial);
    setHasUnsavedChanges(false);
  }, [subject.SubjectID, classItem.ClassID, students, allGrades]);

  // Handle Ctrl+S / Cmd+S save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gridValues, hasUnsavedChanges]);

  // Rating badge helper matching the user's screenshot
  const getRating = (avg: number | null | undefined): { labelAr: string; pillClass: string } => {
    if (avg === null || avg === undefined || isNaN(avg)) {
      return { labelAr: '—', pillClass: 'bg-slate-200 text-slate-500' };
    }
    if (avg >= 90) {
      return { labelAr: 'ممتاز', pillClass: 'bg-[#6bd953] text-slate-950 font-black' };
    }
    if (avg >= 80) {
      return { labelAr: 'جيد جدا', pillClass: 'bg-[#f7d842] text-slate-950 font-black' };
    }
    if (avg >= 70) {
      return { labelAr: 'جيد', pillClass: 'bg-[#fbbd4c] text-slate-950 font-black' };
    }
    if (avg >= 60) {
      return { labelAr: 'مقبول', pillClass: 'bg-[#fb8c44] text-slate-950 font-black' };
    }
    return { labelAr: 'راسب', pillClass: 'bg-[#fc5454] text-slate-950 font-black' };
  };

  const handleCellChange = (studentId: number, period: GradingPeriod, rawVal: string) => {
    const val = rawVal.trim().toUpperCase();
    // Allow partial typing of INC or DRP or numeric 0-100
    if (
      val !== '' &&
      !'INC'.startsWith(val) &&
      !'DRP'.startsWith(val)
    ) {
      const num = parseFloat(val);
      if (isNaN(num)) return;
      if (num < 0 || num > 100) return;
    }

    setGridValues(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [period]: val,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Excel-like navigation between cells
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    periodsList: GradingPeriod[]
  ) => {
    const totalRows = visibleStudents.length;
    const totalCols = periodsList.length;

    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        targetRow = Math.max(0, rowIndex - 1);
      } else {
        targetRow = Math.min(totalRows - 1, rowIndex + 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      targetRow = Math.min(totalRows - 1, rowIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      targetRow = Math.max(0, rowIndex - 1);
    } else if (e.key === 'ArrowLeft' && totalCols > 1) {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        targetCol = Math.min(totalCols - 1, colIndex + 1);
      }
    } else if (e.key === 'ArrowRight' && totalCols > 1) {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        targetCol = Math.max(0, colIndex - 1);
      }
    } else {
      return;
    }

    const refKey = `${targetRow}-${targetCol}`;
    const targetInput = inputRefs.current[refKey];
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  // Quick fill remaining empty cells
  const handleApplyQuickFill = () => {
    const fillNumber = parseFloat(quickFillVal);
    if (isNaN(fillNumber) && quickFillVal !== 'INC' && quickFillVal !== 'DRP') return;

    setGridValues(prev => {
      const updated = { ...prev };
      visibleStudents.forEach(s => {
        const row = { ...(updated[s.StudentID] || {}) };
        if (viewMode === 'dawr') {
          if (!row[selectedPeriod]) row[selectedPeriod] = quickFillVal;
        } else {
          activePeriods.forEach(p => {
            if (!row[p]) row[p] = quickFillVal;
          });
        }
        updated[s.StudentID] = row;
      });
      return updated;
    });

    setHasUnsavedChanges(true);
    setShowQuickFill(false);
  };

  // Save all changes in batch (Preserving or populating CriteriaScores for Student Subject Details Modal)
  const handleSaveAll = () => {
    if (isMudir) {
      setToastMsg({ type: 'error', text: 'حساب المدير في وضع القراءة والمعاينة فقط.' });
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    if (!canUserEditThisSubject) {
      setToastMsg({
        type: 'error',
        text: isSSG
          ? 'عذراً، يحق لمجلس الطلبة تعديل درجات مادة النشاط فقط.'
          : 'عذراً، مادة النشاط مسندة لمجلس الطلبة (SSG) للتقييم والرصد.',
      });
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    if (activeLockInfo.isLocked) {
      setToastMsg({
        type: 'error',
        text: 'انتهت المهلة المحددة لتعديل الدرجات! السجل مقفل حالياً. يرجى طلب تمديد مهلة من المدير العام.',
      });
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    const gradesToSave: StudentGradeItem[] = [];

    students.forEach(std => {
      const row = gridValues[std.StudentID] || {};
      const targetPeriods: GradingPeriod[] =
        viewMode === 'dawr' ? [selectedPeriod] : activePeriods;

      targetPeriods.forEach(p => {
        const rawVal = (row[p] || '').trim().toUpperCase();
        if (rawVal !== '') {
          let finalG: number | 'INC' | 'DRP' = 0;
          if (rawVal === 'INC') finalG = 'INC';
          else if (rawVal === 'DRP') finalG = 'DRP';
          else finalG = parseFloat(rawVal) || 0;

          // Preserve existing criteria scores or auto-populate component breakdown for numeric grades
          const existingGrade = allGrades.find(
            g =>
              g.StudentID === std.StudentID &&
              g.SubjectID === subject.SubjectID &&
              g.ClassID === classItem.ClassID &&
              g.Period === p
          );
          const hasExistingCriteria =
            existingGrade?.CriteriaScores && Object.keys(existingGrade.CriteriaScores).length > 0;
          const criteriaScores =
            typeof finalG === 'number'
              ? hasExistingCriteria && existingGrade.FinalGrade === finalG
                ? existingGrade.CriteriaScores
                : {
                    'crit-att': finalG,
                    'crit-quiz': finalG,
                    'crit-mid': finalG,
                    'crit-final': finalG,
                  }
              : {};

          gradesToSave.push({
            id: `grd-${std.StudentID}-${subject.SubjectID}-${p}`,
            StudentID: std.StudentID,
            ClassID: classItem.ClassID,
            SubjectID: subject.SubjectID,
            TeacherID: teacherId || 2,
            Period: p,
            CriteriaScores: criteriaScores,
            FinalGrade: finalG,
            GradedAt: new Date().toISOString(),
            IsLocked: false,
          });
        }
      });
    });

    const res = DataStore.saveMultipleGrades(gradesToSave);
    if (res.success) {
      setToastMsg({
        type: 'success',
        text: `تم حفظ ${res.savedCount} درجات بنجاح في النظام (Saved ${res.savedCount} grades successfully).`,
      });
      setHasUnsavedChanges(false);
      onSaveSuccess();
    } else {
      setToastMsg({
        type: 'error',
        text: res.errors?.join(', ') || 'Failed to save some grades.',
      });
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Export to Excel file
  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const dataToExport = visibleStudents.map(s => {
      const row = gridValues[s.StudentID] || {};
      if (viewMode === 'dawr') {
        const val = row[selectedPeriod];
        const num = parseFloat(val);
        const rating = !isNaN(num) ? getRating(num).labelAr : val === 'INC' ? 'INC' : val === 'DRP' ? 'DRP' : '—';
        return {
          'الرقم (ID)': s.RollNo,
          'اسم الطالب': s.NameArabic || s.Name,
          'المادة': subject.SubjectArabic || subject.SubjectClass,
          'الفترة': dawrArabicNames[selectedPeriod],
          'الدرجة': val || '—',
          'التقدير': rating,
        };
      } else {
        const rawList = activePeriods.map(p => (row[p] || '').trim().toUpperCase());
        const hasINC = rawList.includes('INC');
        const hasDRP = rawList.includes('DRP');
        const validNums = rawList.map(v => parseFloat(v)).filter(n => !isNaN(n));
        const sum =
          !hasINC && !hasDRP && validNums.length > 0
            ? Math.round(validNums.reduce((a, b) => a + b, 0) * 10) / 10
            : '—';
        const avg =
          hasDRP
            ? 'DRP'
            : hasINC
            ? 'INC'
            : validNums.length > 0
            ? Math.round((validNums.reduce((a, b) => a + b, 0) / validNums.length) * 10) / 10
            : '—';
        const rating = typeof avg === 'number' ? getRating(avg).labelAr : avg;

        return {
          'الرقم (ID)': s.RollNo,
          'اسم الطالب': s.NameArabic || s.Name,
          'المادة': subject.SubjectArabic || subject.SubjectClass,
          'الفصل': selectedSemester === '1st' ? 'الفصل الأول' : 'الفصل الثاني',
          'دور 1': row[activePeriods[0]] || '—',
          'دور 2': row[activePeriods[1]] || '—',
          'دور 3': row[activePeriods[2]] || '—',
          'المجموع': sum,
          'المعدل': avg,
          'التقدير': rating,
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `${subject.SubjectArabic || 'Grades'}`.substring(0, 30)
    );
    XLSX.writeFile(
      workbook,
      `${subject.SubjectClass}_${classItem.ClassName}_${viewMode === 'dawr' ? selectedPeriod : selectedSemester}.xlsx`
    );
  };

  // Import from Excel file
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const importedData: any[] = XLSX.utils.sheet_to_json(ws);

        let matchCount = 0;
        setGridValues(prev => {
          const updated = { ...prev };
          importedData.forEach(row => {
            const roll =
              row['الرقم (ID)'] ||
              row['الرقم'] ||
              row['Roll No'] ||
              row['RollNo'] ||
              row['IdNumb'];
            const grade =
              row['الدرجة'] || row['Grade'] || row['Score'] || row['FinalGrade'];

            if (roll) {
              const matchedStudent = students.find(
                s => s.RollNo.toLowerCase() === String(roll).trim().toLowerCase()
              );
              if (matchedStudent && grade !== undefined) {
                if (!updated[matchedStudent.StudentID]) {
                  updated[matchedStudent.StudentID] = {};
                }
                if (viewMode === 'dawr') {
                  updated[matchedStudent.StudentID][selectedPeriod] = String(grade).toUpperCase();
                } else {
                  if (row['دور 1'] !== undefined) updated[matchedStudent.StudentID][activePeriods[0]] = String(row['دور 1']);
                  if (row['دور 2'] !== undefined) updated[matchedStudent.StudentID][activePeriods[1]] = String(row['دور 2']);
                  if (row['دور 3'] !== undefined) updated[matchedStudent.StudentID][activePeriods[2]] = String(row['دور 3']);
                }
                matchCount++;
              }
            }
          });
          return updated;
        });

        setHasUnsavedChanges(true);
        setToastMsg({
          type: 'success',
          text: `تم استيراد ${matchCount} سجلات من ملف الإكسل بنجاح! اضغط حفظ لاعتمادها.`,
        });
        setTimeout(() => setToastMsg(null), 3500);
      } catch {
        setToastMsg({ type: 'error', text: 'خطأ في قراءة ملف الإكسل. يرجى التأكد من الصيغة الصحيحة.' });
        setTimeout(() => setToastMsg(null), 3000);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Class Summary Calculations (Excludes ungraded, INC, and DRP per Requirement 4)
  const classSummary = useMemo(() => {
    let totalScore = 0;
    let validCount = 0;
    let passCount = 0;
    let highest = -1;
    let lowest = 101;

    visibleStudents.forEach(s => {
      const row = gridValues[s.StudentID] || {};
      let valNum: number | null = null;

      if (viewMode === 'dawr') {
        const r = (row[selectedPeriod] || '').trim().toUpperCase();
        if (r && r !== 'INC' && r !== 'DRP' && !isNaN(parseFloat(r))) {
          valNum = parseFloat(r);
        }
      } else {
        const rawVals = activePeriods.map(p => (row[p] || '').trim().toUpperCase());
        if (!rawVals.includes('INC') && !rawVals.includes('DRP')) {
          const vals = rawVals
            .filter(v => v && !isNaN(parseFloat(v)))
            .map(v => parseFloat(v));
          if (vals.length > 0) {
            valNum = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
          }
        }
      }

      if (valNum !== null) {
        totalScore += valNum;
        validCount++;
        if (valNum >= 60) passCount++;
        if (valNum > highest) highest = valNum;
        if (valNum < lowest) lowest = valNum;
      }
    });

    const average = validCount > 0 ? Math.round((totalScore / validCount) * 10) / 10 : 0;
    return {
      validCount,
      average,
      passRate: validCount > 0 ? Math.round((passCount / validCount) * 100) : 0,
      highest: highest >= 0 ? highest : '—',
      lowest: lowest <= 100 ? lowest : '—',
      rating: getRating(validCount > 0 ? average : null),
    };
  }, [visibleStudents, gridValues, viewMode, selectedPeriod, activePeriods]);

  return (
    <div className="space-y-4">
      {/* Top Bar / Navigation & Subject Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3 sm:px-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <span>العودة للمواد (Back to Subjects)</span>
          </button>

          {/* Quick Switch Dropdown */}
          {teacherSubjects.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">المادة الحالية:</span>
              <select
                value={`${subject.SubjectID}-${classItem.ClassID}`}
                onChange={e => {
                  const [sId, cId] = e.target.value.split('-').map(Number);
                  const target = teacherSubjects.find(
                    ts => ts.subject.SubjectID === sId && ts.classItem.ClassID === cId
                  );
                  if (target) onSelectSubject(target.subject, target.classItem);
                }}
                className="bg-transparent text-emerald-300 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {teacherSubjects.map(ts => (
                  <option
                    key={`${ts.subject.SubjectID}-${ts.classItem.ClassID}`}
                    value={`${ts.subject.SubjectID}-${ts.classItem.ClassID}`}
                    className="bg-slate-900 text-white"
                  >
                    {ts.subject.SubjectArabic || ts.subject.SubjectClass} &bull; {ts.classItem.ClassName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Mode & Dawr / Semester Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('dawr')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'dawr'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              دوري (Single Dawr)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('semester')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'semester'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              فصلي (Semester Matrix)
            </button>
          </div>

          {viewMode === 'dawr' ? (
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as GradingPeriod)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value="1st">دور الأول (1ˢᵗ Dawr)</option>
              <option value="2nd">دور الثاني (2ⁿᵈ Dawr)</option>
              <option value="3rd">دور الثالث (3ʳᵈ Dawr)</option>
              <option value="4th">دور الرابع (4ᵗʰ Dawr)</option>
              <option value="5th">دور الخامس (5ᵗʰ Dawr)</option>
              <option value="6th">دور السادس (6ᵗʰ Dawr)</option>
            </select>
          ) : (
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value as '1st' | '2nd')}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value="1st">الفصل الأول (دور 1، 2، 3)</option>
              <option value="2nd">الفصل الثاني (دور 4، 5، 6)</option>
            </select>
          )}
        </div>
      </div>

      {/* Notifications / Toast */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-between gap-2 shadow-sm ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Excel Sheet</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN EXCEL CARD CONTAINER                                                 */}
      {/* ========================================================================= */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
        {/* Card Header Pill Bar */}
        <div className="bg-white rounded-2xl p-3 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs border border-[#cfc39f]">
          {/* Action Buttons (Left) */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Green Pill Edit / Save Button */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
              className={`px-5 py-2 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 ${
                !canUserEditThisSubject
                  ? 'bg-slate-600 cursor-not-allowed opacity-80'
                  : activeLockInfo.isLocked
                  ? 'bg-slate-600 cursor-not-allowed opacity-80'
                  : hasUnsavedChanges
                  ? 'bg-emerald-700 hover:bg-emerald-600 ring-2 ring-amber-400 ring-offset-1 animate-pulse'
                  : 'bg-[#187d44] hover:bg-[#136838]'
              }`}
            >
              {!canUserEditThisSubject ? (
                <>
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>{isSSG ? 'خاص بالنشاط فقط' : 'مسند لمجلس الطلبة'}</span>
                </>
              ) : activeLockInfo.isLocked ? (
                <>
                  <Lock className="w-4 h-4 text-red-300" />
                  <span>السجل مقفل (Locked)</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{hasUnsavedChanges ? 'حفظ التعديلات *' : 'حفظ (Save)'}</span>
                </>
              )}
            </button>

            {/* Quick Fill Button */}
            {canUserEditThisSubject && !activeLockInfo.isLocked && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQuickFill(!showQuickFill)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تعبئة سريعة (Quick Fill)</span>
                </button>

                {showQuickFill && (
                  <div
                    className="absolute left-0 top-full mt-2 w-56 p-3 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 space-y-2 text-right"
                    dir="rtl"
                  >
                    <span className="block text-xs font-bold text-slate-700">تعبئة الدرجات الفارغة:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={quickFillVal}
                        onChange={e => setQuickFillVal(e.target.value)}
                        placeholder="85"
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-sm bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={handleApplyQuickFill}
                        className="flex-1 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Requirement 12: View All / Hide DRP Students Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAllStudentsWithDRP(!showAllStudentsWithDRP)}
              className={`px-3.5 py-1.5 font-extrabold text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors border ${
                showAllStudentsWithDRP
                  ? 'bg-red-600 text-white border-red-700'
                  : drpStudentsList.length > 0
                  ? 'bg-red-50 hover:bg-red-100 text-red-800 border-red-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="إظهار أو إخفاء الطلاب المنسحبين (DRP)"
            >
              {showAllStudentsWithDRP ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>إخفاء المنسحبين DRP ({drpStudentsList.length})</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    عرض الكل (View All{drpStudentsList.length > 0 ? ` • ${drpStudentsList.length} DRP مخفي` : ''})
                  </span>
                </>
              )}
            </button>

            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>

            {/* Import from Excel */}
            {!isMudir && canUserEditThisSubject && (
              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-colors border border-slate-300">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>استيراد Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title Section (Right) */}
          <div className="flex items-center gap-3 sm:gap-4 text-right justify-end" dir="rtl">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
              <span className="font-serif">المادة: {subject.SubjectArabic || subject.SubjectClass}</span>
              <span className="text-amber-800 font-serif">
                مرحلة: {classItem.Level || classItem.ClassName}
              </span>
            </div>
            <div className="h-6 w-[2px] bg-[#c4b68e]" />
            <span className="font-black text-slate-950 font-serif text-sm sm:text-base">
              {viewMode === 'dawr'
                ? dawrArabicNames[selectedPeriod]
                : selectedSemester === '1st'
                ? 'فصل الأول'
                : 'فصل الثاني'}
            </span>
          </div>
        </div>

        {/* Requirement 12: Banner explaining automatic hiding of DRP students in Teacher's View */}
        {drpStudentsList.length > 0 && (
          <div
            className={`px-4 py-2.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold ${
              showAllStudentsWithDRP
                ? 'bg-red-100 border-red-400 text-red-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {showAllStudentsWithDRP ? (
                  <>
                    يتم الآن عرض جميع الطلاب بما فيهم الطلاب المنسحبين <strong>(DRP - عددهم {drpStudentsList.length})</strong> وهم مظللون باللون الأحمر في الجدول أدناه.
                  </>
                ) : (
                  <>
                    تم إخفاء <strong>({drpStudentsList.length}) طالب مسجل كمنسحب [DRP]</strong> تلقائياً من قائمة الأستاذ. اضغط على زر <strong>&quot;عرض الكل (View All)&quot;</strong> لإظهارهم.
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllStudentsWithDRP(!showAllStudentsWithDRP)}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer shrink-0"
            >
              {showAllStudentsWithDRP ? 'إخفاء المنسحبين (Hide DRP)' : 'عرض الكل (View All)'}
            </button>
          </div>
        )}

        {/* Principal's Official Submission Deadline Banner */}
        {currentDawrDeadline && (
          <div
            className={`rounded-2xl p-4 border-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-right transition-all ${
              currentDawrDeadline.isExpired && currentDawrDeadline.enforceLock
                ? 'bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 border-red-700 text-white'
                : 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-emerald-600/80 text-white'
            }`}
            dir="rtl"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border shadow-inner ${
                  currentDawrDeadline.isExpired && currentDawrDeadline.enforceLock
                    ? 'bg-red-600/30 border-red-400 text-red-200'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                }`}
              >
                {currentDawrDeadline.isExpired && currentDawrDeadline.enforceLock ? (
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                ) : (
                  <Calendar className="w-6 h-6 text-amber-300" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white font-serif text-sm sm:text-base">
                    الموعد النهائي لتسليم درجات {dawrArabicNames[currentDawrDeadline.period]} (المحدد من المدير)
                  </span>
                </div>
                {currentDawrDeadline.instructions && (
                  <div className="bg-white/10 border border-amber-400/40 rounded-xl px-3 py-1.5 mt-1 text-xs text-amber-200 font-serif">
                    <span className="font-bold text-amber-300">توجيهات المدير للأستاذ: </span>
                    &quot;{currentDawrDeadline.instructions}&quot;
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
              {currentDawrDeadline.isExpired ? (
                <div className="px-4 py-2 bg-red-600/30 border border-red-500 text-red-200 rounded-xl text-xs font-black inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>انقضى موعد التسليم الرسمي</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-emerald-800/80 border border-emerald-400 text-white rounded-xl text-xs font-black inline-flex items-center gap-2 shadow-inner">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>متبقي:</span>
                  <span className="text-amber-300 font-mono text-sm">
                    {toHindiNumerals(currentDawrDeadline.days)} يوم و {toHindiNumerals(currentDawrDeadline.hours)} س
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Excel Instructions Banner */}
        <div
          className="bg-amber-100/70 text-amber-950 text-xs px-4 py-2 rounded-xl border border-amber-300/80 flex items-center justify-between"
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-800 flex-shrink-0" />
            <span>
              <strong>طريقة الإدخال المباشر:</strong> اكتب الدرجة (0-100 أو INC أو DRP)، واضغط <strong>Enter</strong> للانتقال للطالب التالي. الطلاب الحاصلون على <strong>DRP</strong> يتم تظليلهم وإخفاؤهم تلقائياً إلا عند الضغط على <strong>عرض الكل</strong>.
            </span>
          </div>
          {hasUnsavedChanges && (
            <span className="font-bold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-md">
              يوجد تعديلات غير محفوظة
            </span>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SPREADSHEET TABLE - STRICT RTL (Names on Right)                           */}
        {/* ========================================================================= */}
        <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
          <table className="w-full text-right text-sm" dir="rtl">
            <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
              {viewMode === 'dawr' ? (
                <tr>
                  <th className="py-3 px-3 text-center w-24">IdNumb</th>
                  <th className="py-3 px-4 text-right">أسماء الطلاب</th>
                  <th className="py-3 px-4 text-center w-36">الدرجة</th>
                  <th className="py-3 px-4 text-center w-32">تقدير</th>
                  <th className="py-3 px-3 text-center w-36">حالة / إجراء سريع</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-3 text-center w-24">IdNumb</th>
                  <th className="py-3 px-4 text-right">أسماء الطلاب</th>
                  <th className="py-3 px-3 text-center w-24">دور 1</th>
                  <th className="py-3 px-3 text-center w-24">دور 2</th>
                  <th className="py-3 px-3 text-center w-24">دور 3</th>
                  <th className="py-3 px-3 text-center w-24">مجموع</th>
                  <th className="py-3 px-3 text-center w-24">معدل</th>
                  <th className="py-3 px-4 text-center w-32">تقدير</th>
                  <th className="py-3 px-3 text-center w-28">حالة</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-[#e7dfc8] font-medium">
              {visibleStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={viewMode === 'dawr' ? 5 : 9}
                    className="py-8 text-center text-slate-400 font-medium"
                  >
                    {students.length > 0 && !showAllStudentsWithDRP ? (
                      <div className="space-y-2">
                        <p>جميع الطلاب في هذا السجل مسجلون كمنسحبين (DRP).</p>
                        <button
                          type="button"
                          onClick={() => setShowAllStudentsWithDRP(true)}
                          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          عرض الكل (View All Students)
                        </button>
                      </div>
                    ) : (
                      'لا يوجد طلاب مسجلين في هذا الصف حالياً.'
                    )}
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student, rowIndex) => {
                  const row = gridValues[student.StudentID] || {};
                  const rowIsDRP = isStudentDRP(student.StudentID);

                  if (viewMode === 'dawr') {
                    const rawVal = (row[selectedPeriod] || '').trim().toUpperCase();
                    const num = parseFloat(rawVal);
                    const rating = !isNaN(num)
                      ? getRating(num)
                      : rawVal === 'INC'
                      ? { labelAr: 'غير مكتمل (INC)', pillClass: 'bg-amber-200 text-amber-900 font-black' }
                      : rawVal === 'DRP'
                      ? { labelAr: 'منسحب (DRP)', pillClass: 'bg-red-600 text-white font-black' }
                      : getRating(null);

                    const refKey = `${rowIndex}-0`;

                    return (
                      <tr
                        key={student.StudentID}
                        className={`transition-colors group ${
                          rowIsDRP
                            ? 'bg-red-100 hover:bg-red-200/80 text-red-950 border-y-2 border-red-400 font-black'
                            : 'hover:bg-[#faf7f0]'
                        }`}
                      >
                        <td
                          className={`py-2.5 px-3 text-center font-mono font-bold text-xs ${
                            rowIsDRP ? 'bg-red-200 text-red-950' : 'text-slate-600 bg-slate-50/50'
                          }`}
                        >
                          {student.RollNo || student.StudentID}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-950 font-serif text-base">
                              {student.NameArabic || student.Name}
                            </span>
                            {rowIsDRP && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-600 text-white font-sans font-black">
                                DRP منسحب
                              </span>
                            )}
                          </div>
                          {student.NameArabic && student.Name && (
                            <span className="text-[11px] text-slate-500 font-sans block" dir="ltr">
                              {student.Name}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-center">
                          <input
                            ref={el => {
                              inputRefs.current[refKey] = el;
                            }}
                            type="text"
                            disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
                            value={rawVal}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, selectedPeriod, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 0, [selectedPeriod])}
                            className={`w-28 py-1.5 px-2 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                              !canUserEditThisSubject || activeLockInfo.isLocked
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                : rowIsDRP
                                ? 'bg-red-600 text-white border-red-800'
                                : rawVal !== ''
                                ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 focus:bg-white focus:border-emerald-600'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${rating.pillClass}`}
                          >
                            {rating.labelAr}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center text-xs">
                          <div className="flex items-center justify-center gap-1">
                            {canUserEditThisSubject && !activeLockInfo.isLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCellChange(
                                      student.StudentID,
                                      selectedPeriod,
                                      rawVal === 'INC' ? '' : 'INC'
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                                    rawVal === 'INC'
                                      ? 'bg-amber-500 text-slate-950 border-amber-600'
                                      : 'bg-slate-100 hover:bg-amber-100 text-slate-600 border-slate-300'
                                  }`}
                                  title="تحديد غير مكتمل (INC)"
                                >
                                  INC
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCellChange(
                                      student.StudentID,
                                      selectedPeriod,
                                      rawVal === 'DRP' ? '' : 'DRP'
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                                    rawVal === 'DRP'
                                      ? 'bg-red-600 text-white border-red-700'
                                      : 'bg-slate-100 hover:bg-red-100 text-slate-600 border-slate-300'
                                  }`}
                                  title="تحديد منسحب (DRP) - سيتم إخفاؤه تلقائياً إلا عند عرض الكل"
                                >
                                  DRP
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  } else {
                    const d1Raw = (row[activePeriods[0]] || '').trim().toUpperCase();
                    const d2Raw = (row[activePeriods[1]] || '').trim().toUpperCase();
                    const d3Raw = (row[activePeriods[2]] || '').trim().toUpperCase();

                    const hasINC = [d1Raw, d2Raw, d3Raw].includes('INC');
                    const hasDRP = [d1Raw, d2Raw, d3Raw].includes('DRP');

                    const d1Num = parseFloat(d1Raw);
                    const d2Num = parseFloat(d2Raw);
                    const d3Num = parseFloat(d3Raw);

                    // Requirement 4: Exclude ungraded or INC from average
                    const validScores = [d1Num, d2Num, d3Num].filter(n => !isNaN(n));
                    const sum =
                      !hasINC && !hasDRP && validScores.length > 0
                        ? Math.round(validScores.reduce((a, b) => a + b, 0) * 10) / 10
                        : null;
                    const avg =
                      !hasINC && !hasDRP && validScores.length > 0
                        ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
                        : null;
                    const rating = hasDRP
                      ? { labelAr: 'منسحب (DRP)', pillClass: 'bg-red-600 text-white font-black' }
                      : hasINC
                      ? { labelAr: 'غير مكتمل (INC)', pillClass: 'bg-amber-200 text-amber-900 font-black' }
                      : getRating(avg);

                    return (
                      <tr
                        key={student.StudentID}
                        className={`transition-colors group ${
                          rowIsDRP
                            ? 'bg-red-100 hover:bg-red-200/80 text-red-950 border-y-2 border-red-400 font-black'
                            : 'hover:bg-[#faf7f0]'
                        }`}
                      >
                        <td
                          className={`py-2.5 px-3 text-center font-mono font-bold text-xs ${
                            rowIsDRP ? 'bg-red-200 text-red-950' : 'text-slate-600 bg-slate-50/50'
                          }`}
                        >
                          {student.RollNo || student.StudentID}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-950 font-serif text-base">
                              {student.NameArabic || student.Name}
                            </span>
                            {rowIsDRP && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-600 text-white font-sans font-black">
                                DRP منسحب
                              </span>
                            )}
                          </div>
                          {student.NameArabic && student.Name && (
                            <span className="text-[11px] text-slate-500 font-sans block" dir="ltr">
                              {student.Name}
                            </span>
                          )}
                        </td>

                        {[0, 1, 2].map(colIdx => {
                          const p = activePeriods[colIdx];
                          const valStr = (row[p] || '').trim().toUpperCase();
                          return (
                            <td key={p} className="py-2 px-2 text-center">
                              <input
                                ref={el => {
                                  inputRefs.current[`${rowIndex}-${colIdx}`] = el;
                                }}
                                type="text"
                                disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
                                value={valStr}
                                placeholder="—"
                                onChange={e => handleCellChange(student.StudentID, p, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIndex, colIdx, activePeriods)}
                                className={`w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                                  !canUserEditThisSubject || activeLockInfo.isLocked
                                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                    : valStr === 'DRP'
                                    ? 'bg-red-600 text-white border-red-800'
                                    : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                }`}
                              />
                            </td>
                          );
                        })}

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-slate-900 bg-amber-50/40">
                          {sum !== null ? sum : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-extrabold text-sm text-slate-950 bg-amber-50/70">
                          {hasDRP ? 'DRP' : hasINC ? 'INC' : avg !== null ? avg : '—'}
                        </td>

                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${rating.pillClass}`}
                          >
                            {rating.labelAr}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center text-xs">
                          {rowIsDRP ? (
                            <span className="px-2 py-0.5 bg-red-600 text-white rounded font-black text-[10px]">
                              DRP
                            </span>
                          ) : hasINC ? (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-950 rounded font-black text-[10px]">
                              INC
                            </span>
                          ) : validScores.length > 0 ? (
                            <span className="text-emerald-700 font-bold">مرصود</span>
                          ) : (
                            <span className="text-slate-400 italic">معلق</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>

            {/* Summary Footer Row */}
            <tfoot className="bg-[#ede5d1] text-slate-950 font-bold border-t-2 border-[#b79e55]">
              <tr>
                <td className="py-3 px-3 text-center font-mono text-xs text-slate-600">
                  {visibleStudents.length}
                </td>
                <td className="py-3 px-4 text-right font-black">
                  إحصائيات المادة العامة (Class Average &amp; Stats)
                </td>
                {viewMode === 'dawr' ? (
                  <>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-emerald-950">
                      {classSummary.average > 0 ? `${classSummary.average}%` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${classSummary.rating.pillClass}`}
                      >
                        {classSummary.rating.labelAr}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-mono font-bold text-slate-700">
                      نجاح {classSummary.passRate}%
                    </td>
                  </>
                ) : (
                  <>
                    <td colSpan={3} className="py-3 px-2 text-center text-xs text-slate-600 font-medium">
                      أعلى: {classSummary.highest} &bull; أدنى: {classSummary.lowest}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-600">
                      -
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-sm text-emerald-950">
                      {classSummary.average > 0 ? `${classSummary.average}%` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${classSummary.rating.pillClass}`}
                      >
                        {classSummary.rating.labelAr}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-mono font-bold text-slate-700">
                      نجاح {classSummary.passRate}%
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
