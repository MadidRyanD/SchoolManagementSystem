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
  RotateCcw,
  Layers,
  Calendar,
  Lock,
  Unlock,
  ChevronDown,
  Info,
  Clock,
  Hourglass,
  ShieldCheck,
  ShieldAlert,
  Send,
  Check,
  Award,
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
    // Regular teacher cannot edit Nashat (it's managed exclusively by SSG)
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

    if (periodGrades.length === 0) {
      return {
        isLocked: false,
        remainingMs: 0,
        allowedHours: defaultHours,
        status: 'unsubmitted' as const,
        hasUnlockRequest: unlockRequestedLocal,
        submittedAt: null as string | null,
        expiresAt: null as string | null,
      };
    }

    const checks = periodGrades.map(g => ({
      grade: g,
      check: DataStore.checkGradeLock(g),
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
      return { labelAr: 'ممتاز', pillClass: 'bg-[#3fd866] text-slate-950 font-black' };
    }
    if (avg >= 80) {
      return { labelAr: 'جيد جدا', pillClass: 'bg-[#f7d643] text-slate-950 font-black' };
    }
    if (avg >= 70) {
      return { labelAr: 'جيد', pillClass: 'bg-[#fba248] text-slate-950 font-black' };
    }
    if (avg >= 60) {
      return { labelAr: 'مقبول', pillClass: 'bg-[#f97334] text-white font-black' };
    }
    return { labelAr: 'راسب', pillClass: 'bg-[#ef4444] text-white font-black' };
  };

  const handleCellChange = (studentId: number, period: GradingPeriod, rawVal: string) => {
    const val = rawVal.trim().toUpperCase();
    // Validate value
    if (val !== '' && val !== 'INC' && val !== 'DRP') {
      const num = parseFloat(val);
      if (isNaN(num)) return; // Don't accept invalid characters
      if (num < 0 || num > 100) return; // Must be 0 to 100
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
    const totalRows = students.length;
    const totalCols = periodsList.length;

    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (e.key === 'Enter') {
      e.preventDefault();
      // Move down like Excel
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
      // In RTL, ArrowLeft moves forward in reading order (leftwards)
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        targetCol = Math.min(totalCols - 1, colIndex + 1);
      }
    } else if (e.key === 'ArrowRight' && totalCols > 1) {
      // In RTL, ArrowRight moves backward (rightwards)
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
      students.forEach(s => {
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

  // Save all changes in batch
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
        const rawVal = row[p];
        if (rawVal !== undefined && rawVal !== '') {
          let finalG: number | 'INC' | 'DRP' = 0;
          if (rawVal === 'INC') finalG = 'INC';
          else if (rawVal === 'DRP') finalG = 'DRP';
          else finalG = parseFloat(rawVal) || 0;

          gradesToSave.push({
            id: `grd-${std.StudentID}-${subject.SubjectID}-${p}`,
            StudentID: std.StudentID,
            ClassID: classItem.ClassID,
            SubjectID: subject.SubjectID,
            TeacherID: teacherId || 2,
            Period: p,
            CriteriaScores: {},
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
    const dataToExport = students.map((s, idx) => {
      const row = gridValues[s.StudentID] || {};
      if (viewMode === 'dawr') {
        const val = row[selectedPeriod];
        const num = parseFloat(val);
        const rating = !isNaN(num) ? getRating(num).labelAr : val === 'INC' ? 'معلق' : val === 'DRP' ? 'منسحب' : '—';
        return {
          'الرقم (ID)': s.RollNo,
          'اسم الطالب': s.NameArabic || s.Name,
          'المادة': subject.SubjectArabic || subject.SubjectClass,
          'الفترة': dawrArabicNames[selectedPeriod],
          'الدرجة': val || '—',
          'التقدير': rating,
        };
      } else {
        const d1 = parseFloat(row[activePeriods[0]]) || 0;
        const d2 = parseFloat(row[activePeriods[1]]) || 0;
        const d3 = parseFloat(row[activePeriods[2]]) || 0;
        const hasAny = row[activePeriods[0]] !== '' || row[activePeriods[1]] !== '' || row[activePeriods[2]] !== '';
        const sum = hasAny ? Math.round((d1 + d2 + d3) * 10) / 10 : '—';
        const avg = hasAny ? Math.round(((d1 + d2 + d3) / 3) * 10) / 10 : '—';
        const rating = hasAny && typeof avg === 'number' ? getRating(avg).labelAr : '—';

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

  // Class Summary Calculations
  const classSummary = useMemo(() => {
    let totalScore = 0;
    let validCount = 0;
    let passCount = 0;
    let highest = -1;
    let lowest = 101;

    students.forEach(s => {
      const row = gridValues[s.StudentID] || {};
      let valNum: number | null = null;

      if (viewMode === 'dawr') {
        const r = row[selectedPeriod];
        if (r && !isNaN(parseFloat(r))) valNum = parseFloat(r);
      } else {
        const vals = activePeriods
          .map(p => row[p])
          .filter(v => v && !isNaN(parseFloat(v)))
          .map(v => parseFloat(v));
        if (vals.length > 0) {
          valNum = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
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
      rating: getRating(average),
    };
  }, [students, gridValues, viewMode, selectedPeriod, activePeriods]);

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
      {/* MAIN EXCEL CARD CONTAINER - MATCHING EXACT VISUAL DESIGN FROM SCREENSHOT  */}
      {/* ========================================================================= */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
        {/* Card Header Pill Bar */}
        <div className="bg-white rounded-2xl p-3 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs border border-[#cfc39f]">
          {/* Action Buttons (Left) */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Green Pill Edit / Save Button (Matches Screenshot) */}
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
              title={
                !canUserEditThisSubject
                  ? isSSG
                    ? 'خاص بمادة النشاط فقط لمجلس الطلبة'
                    : 'مادة النشاط مخصصة لمجلس الطلبة فقط'
                  : activeLockInfo.isLocked
                  ? 'سجل الدرجات مقفل (انتهت مهلة التعديل)'
                  : 'Save Grades (Ctrl+S)'
              }
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
                    <div className="flex gap-1 justify-center pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setQuickFillVal('95')}
                        className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        95 (ممتاز)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickFillVal('85')}
                        className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        85 (جيد جدا)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickFillVal('75')}
                        className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        75 (جيد)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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

          {/* Title Section (Right - Matching Screenshot: المادة: فقه مرحلة: 3 كلية | دور الأول) */}
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

        {/* SSG Role & Nashat Subject Status Banner */}
        {isSSG ? (
          isNashatSubject ? (
            <div
              className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white p-4 rounded-2xl border-2 border-rose-500 shadow-sm flex items-center justify-between gap-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400 flex items-center justify-center flex-shrink-0 text-rose-300">
                  <Award className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-rose-200 font-serif text-sm sm:text-base">
                      بوابة مجلس الطلبة (SSG) &bull; رصد درجات مادة النشاط
                    </span>
                    <span className="text-[11px] font-bold bg-rose-500/30 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-400/40">
                      صلاحية كاملة للمجلس
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed mt-0.5">
                    بصفتك مسؤولاً في مجلس الطلبة (SSG)، يحق لك تقييم ورصد درجات مقرر النشاط والفعاليات لهذا الصف وتحديثها مباشرة.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="bg-gradient-to-r from-amber-900/90 via-slate-900 to-slate-950 text-white p-4 rounded-2xl border-2 border-amber-600/80 shadow-sm flex items-center justify-between gap-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0 text-amber-300">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="font-black text-amber-300 font-serif text-sm sm:text-base">
                    تنبيه مجلس الطلبة: مادة أكاديمية عامة للقراءة فقط
                  </span>
                  <p className="text-xs text-amber-200/90 leading-relaxed mt-0.5">
                    هذه المادة تابعة للأساتذة الأكاديميين. وفقاً للصلاحيات، يحق لمجلس الطلبة رصد وتعديل مادة <strong>(النشاط / Nashat)</strong> فقط.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : isNashatSubject && !isMudir ? (
          <div
            className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white p-4 rounded-2xl border-2 border-rose-700 shadow-sm flex items-center justify-between gap-4 text-right"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400 flex items-center justify-center flex-shrink-0 text-rose-300">
                <Award className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <span className="font-black text-rose-300 font-serif text-sm sm:text-base">
                  مادة النشاط مسندة حصرياً لمجلس الطلبة (SSG)
                </span>
                <p className="text-xs text-rose-200/90 leading-relaxed mt-0.5">
                  رصد وتقييم هذا المقرر تحت إشراف ومسؤولية مجلس الطلبة (SSG). السجل متاح للعرض فقط للكادر التعليمي.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Excel Instructions Banner */}
        <div
          className="bg-amber-100/70 text-amber-950 text-xs px-4 py-2 rounded-xl border border-amber-300/80 flex items-center justify-between"
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-800 flex-shrink-0" />
            <span>
              <strong>طريقة الإدخال المباشر (مثل الإكسل):</strong> اكتب الدرجة مباشرة في الخلية (0-100 أو INC أو DRP)، واضغط <strong>Enter</strong> للانتقال للطالب التالي مباشرة. اضغط <strong>Ctrl+S</strong> للحفظ في أي وقت.
            </span>
          </div>
          {hasUnsavedChanges && (
            <span className="font-bold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-md">
              يوجد تعديلات غير محفوظة
            </span>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TIME LOCK & ALLOWED EDIT WINDOW BANNER (Principal/Admin Lock Control)     */}
        {/* ========================================================================= */}
        {activeLockInfo.status === 'unsubmitted' ? (
          /* Unsubmitted State: Info about allowed edit window upon first submission */
          <div
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-right"
            dir="rtl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0 text-amber-900 mt-0.5">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-950 font-serif text-sm sm:text-base">
                    مهلة التعديل المحددة من الإدارة: ({toHindiNumerals(activeLockInfo.allowedHours)} ساعة)
                  </span>
                  <span className="text-[11px] font-bold bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full">
                    قبل أول اعتماد
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  سيتم تفعيل العد التنازلي التلقائي لمهلة التعديل الممنوحة من المدير فور اعتماد وحفظ السجل. بعد انقضاء المهلة ({toHindiNumerals(activeLockInfo.allowedHours)} ساعة)، سيتم قفل السجل تلقائياً لحفظ موثوقية النتائج.
                </p>
              </div>
            </div>

            {/* If Mudir is viewing, allow setting the default allowed window */}
            {isMudir && (
              <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200 flex-shrink-0">
                <span className="text-xs font-bold text-slate-700">تحديد المهلة:</span>
                <select
                  value={activeLockInfo.allowedHours}
                  onChange={e => {
                    const h = Number(e.target.value);
                    DataStore.setGradeEditWindowHours(h);
                    onSaveSuccess();
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value={6}>{toHindiNumerals(6)} ساعات (6h)</option>
                  <option value={12}>{toHindiNumerals(12)} ساعة (12h)</option>
                  <option value={24}>{toHindiNumerals(24)} ساعة (24h - الافتراضي)</option>
                  <option value={48}>{toHindiNumerals(48)} ساعة (48h - يومان)</option>
                  <option value={72}>{toHindiNumerals(72)} ساعة (72h - 3 أيام)</option>
                  <option value={168}>{toHindiNumerals(168)} ساعة (7 أيام)</option>
                </select>
              </div>
            )}
          </div>
        ) : activeLockInfo.status === 'expired_locked' || activeLockInfo.status === 'manually_locked' ? (
          /* Expired / Locked State: Strong warning banner with Teacher Unlock Request or Mudir Unlock Controls */
          <div
            className="bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 text-white border-2 border-red-700 rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-right"
            dir="rtl"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center flex-shrink-0 text-red-300 mt-0.5">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white font-serif text-base sm:text-lg text-red-200">
                    انتهت المهلة المحددة للتعديل &bull; سجل الدرجات مقفل
                  </span>
                  <span className="text-[11px] font-bold bg-red-500/30 text-red-200 border border-red-400/50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" /> مقفل رسمياً
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  انقضت مهلة التعديل الممنوحة من المدير العام ({toHindiNumerals(activeLockInfo.allowedHours)} ساعة). أغلق السجل بتاريخ {formatDateTimeArabic(activeLockInfo.expiresAt)}. لا يمكن إدخال أو تعديل الدرجات حالياً دون إذن مسبق.
                </p>
                <div className="text-[11px] text-slate-300 flex items-center gap-3 pt-1">
                  <span>تاريخ الاعتماد: <strong>{formatDateTimeArabic(activeLockInfo.submittedAt)}</strong></span>
                  <span>&bull;</span>
                  <span>المهلة الكلية: <strong>{toHindiNumerals(activeLockInfo.allowedHours)} ساعة</strong></span>
                </div>
              </div>
            </div>

            {/* Actions for Locked State */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isMudir ? (
                /* Mudir Controls: Quick Grant Extension */
                <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-rose-800">
                  <select
                    value={mudirGrantHours}
                    onChange={e => setMudirGrantHours(Number(e.target.value))}
                    className="px-2 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={6}>تمديد {toHindiNumerals(6)} س</option>
                    <option value={12}>تمديد {toHindiNumerals(12)} س</option>
                    <option value={24}>تمديد {toHindiNumerals(24)} س (يوم)</option>
                    <option value={48}>تمديد {toHindiNumerals(48)} س (يومان)</option>
                    <option value={72}>تمديد {toHindiNumerals(72)} س (3 أيام)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleMudirGrantUnlock(mudirGrantHours)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>منح تمديد</span>
                  </button>
                </div>
              ) : (
                /* Teacher Action: Request Unlock */
                activeLockInfo.hasUnlockRequest ? (
                  <div className="px-3.5 py-2 bg-amber-500/20 border border-amber-400 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                    <Clock className="w-4 h-4" />
                    <span>تم إرسال طلب تمديد للمدير &bull; بانتظار الموافقة</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestUnlock}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>طلب فتح مهلة تعديل من المدير (Request Unlock)</span>
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          /* Active Grace Period State: Live countdown ticker in Hindi numerals with elapsed/remaining progress bar */
          <div
            className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white border-2 border-emerald-600 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 text-right"
            dir="rtl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Right Side: Headline and Info */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center flex-shrink-0 text-emerald-300 mt-0.5 shadow-inner">
                  <Hourglass className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white font-serif text-base sm:text-lg">
                      مهلة تعديل الدرجات المتاحة من الإدارة
                    </span>
                    <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {activeLockInfo.status === 'unlocked_by_admin' ? 'تمديد بإذن المدير' : 'مهلة نظامية جارية'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    يمكن للأستاذ تعديل الدرجات وحفظها بحرية خلال هذه المهلة. عند انتهاء الوقت سيتم قفل السجل تلقائياً.
                  </p>
                  <div className="text-[11px] text-slate-300 flex items-center gap-3 pt-1 flex-wrap font-sans">
                    <span>المهلة الممنوحة: <strong className="text-amber-300">{toHindiNumerals(activeLockInfo.allowedHours)} ساعة</strong></span>
                    <span>&bull;</span>
                    <span>الاعتماد: <strong>{formatDateTimeArabic(activeLockInfo.submittedAt)}</strong></span>
                    <span>&bull;</span>
                    <span>موعد القفل: <strong className="text-rose-300">{formatDateTimeArabic(activeLockInfo.expiresAt)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Left Side: Prominent Live Digital Countdown Display in Hindi Numerals */}
              <div className="flex flex-col items-center sm:items-end gap-1.5 flex-shrink-0 bg-slate-900/90 p-3 sm:px-4 rounded-2xl border border-emerald-700/60 shadow-inner">
                <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  <span>الوقت المتبقي للتعديل (Remaining Time):</span>
                </span>
                <div className="flex items-center gap-1.5 font-mono text-lg sm:text-2xl font-black text-white" dir="ltr">
                  <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-emerald-800 text-emerald-300">
                    {countdown.h} <span className="text-[10px] text-slate-400 block -mt-1 font-sans">ساعة</span>
                  </div>
                  <span className="text-emerald-500 font-bold">:</span>
                  <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-emerald-800 text-emerald-300">
                    {countdown.m} <span className="text-[10px] text-slate-400 block -mt-1 font-sans">دقيقة</span>
                  </div>
                  <span className="text-emerald-500 font-bold">:</span>
                  <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-emerald-800 text-amber-300 animate-pulse">
                    {countdown.s} <span className="text-[10px] text-slate-400 block -mt-1 font-sans">ثانية</span>
                  </div>
                </div>

                {/* Mudir Controls during active grace period */}
                {isMudir && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800 w-full justify-end">
                    <button
                      type="button"
                      onClick={() => handleMudirGrantUnlock(24)}
                      className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-[11px] text-white font-bold rounded cursor-pointer"
                    >
                      +٢٤س تمديد
                    </button>
                    <button
                      type="button"
                      onClick={handleMudirLockNow}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-[11px] text-white font-bold rounded cursor-pointer"
                    >
                      قفل فوراً
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-emerald-900/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  countdown.percentRemaining > 40
                    ? 'bg-gradient-to-l from-emerald-500 to-teal-400'
                    : countdown.percentRemaining > 15
                    ? 'bg-gradient-to-l from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-l from-red-500 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${Math.max(2, countdown.percentRemaining)}%` }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SPREADSHEET TABLE - STRICT RTL (Names on Right)                           */}
        {/* ========================================================================= */}
        <div className="overflow-x-auto rounded-xl border border-[#c4b68e] bg-white shadow-xs">
          <table className="w-full text-right text-sm" dir="rtl">
            {/* Header Row with Gold School Theme */}
            <thead className="bg-[#b79e55] text-slate-950 font-black text-xs sm:text-sm border-b border-[#a88f47]">
              {viewMode === 'dawr' ? (
                /* Single Dawr View (Exact match to top card in screenshot) */
                <tr>
                  <th className="py-3 px-3 text-center w-24">IdNumb</th>
                  <th className="py-3 px-4 text-right">أسماء الطلاب</th>
                  <th className="py-3 px-4 text-center w-36">الدرجة</th>
                  <th className="py-3 px-4 text-center w-32">تقدير</th>
                  <th className="py-3 px-3 text-center w-24">حالة</th>
                </tr>
              ) : (
                /* Semester Matrix View (Exact match to bottom card in screenshot) */
                <tr>
                  <th className="py-3 px-3 text-center w-24">IdNumb</th>
                  <th className="py-3 px-4 text-right">أسماء الطلاب</th>
                  <th className="py-3 px-3 text-center w-24">دور 1</th>
                  <th className="py-3 px-3 text-center w-24">دور 2</th>
                  <th className="py-3 px-3 text-center w-24">دور 3</th>
                  <th className="py-3 px-3 text-center w-24">مجموع</th>
                  <th className="py-3 px-3 text-center w-24">معدل</th>
                  <th className="py-3 px-4 text-center w-32">تقدير</th>
                  <th className="py-3 px-3 text-center w-24">حالة</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-[#e7dfc8] font-medium">
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={viewMode === 'dawr' ? 5 : 9}
                    className="py-8 text-center text-slate-400 font-medium"
                  >
                    لا يوجد طلاب مسجلين في هذا الصف حالياً.
                  </td>
                </tr>
              ) : (
                students.map((student, rowIndex) => {
                  const row = gridValues[student.StudentID] || {};

                  if (viewMode === 'dawr') {
                    // Single Dawr Row
                    const rawVal = row[selectedPeriod] || '';
                    const num = parseFloat(rawVal);
                    const rating = !isNaN(num)
                      ? getRating(num)
                      : rawVal === 'INC'
                      ? { labelAr: 'INC', pillClass: 'bg-amber-200 text-amber-900 font-bold' }
                      : rawVal === 'DRP'
                      ? { labelAr: 'DRP', pillClass: 'bg-red-200 text-red-900 font-bold' }
                      : getRating(null);

                    const refKey = `${rowIndex}-0`;

                    return (
                      <tr
                        key={student.StudentID}
                        className="hover:bg-[#faf7f0] transition-colors group"
                      >
                        {/* 1. IdNumb (Rightmost) */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-xs text-slate-600 bg-slate-50/50">
                          {student.RollNo || student.StudentID}
                        </td>

                        {/* 2. Student Name (أسماء الطلاب - On the Right) */}
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-bold text-slate-950 font-serif text-base block">
                            {student.NameArabic || student.Name}
                          </span>
                          {student.NameArabic && student.Name && (
                            <span className="text-[11px] text-slate-500 font-sans block" dir="ltr">
                              {student.Name}
                            </span>
                          )}
                        </td>

                        {/* 3. Grade Cell (الدرجة - Editable Input) */}
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
                                : rawVal !== ''
                                ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 focus:bg-white focus:border-emerald-600'
                            }`}
                            title={
                              !canUserEditThisSubject
                                ? isSSG
                                  ? 'يحق لمجلس الطلبة تعديل مادة النشاط فقط'
                                  : 'مادة النشاط مخصصة لمجلس الطلبة فقط'
                                : activeLockInfo.isLocked
                                ? 'سجل الدرجات مقفل (انتهت مهلة التعديل المحددة من الإدارة)'
                                : ''
                            }
                          />
                        </td>

                        {/* 4. Rating Badge (تقدير) */}
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${rating.pillClass}`}
                          >
                            {rating.labelAr}
                          </span>
                        </td>

                        {/* 5. Status / Lock */}
                        <td className="py-2.5 px-3 text-center text-xs">
                          {activeLockInfo.isLocked ? (
                            <span className="text-red-700 font-bold inline-flex items-center gap-1 bg-red-100/80 px-2 py-0.5 rounded-md border border-red-200">
                              <Lock className="w-3 h-3 text-red-600" /> مقفل
                            </span>
                          ) : activeLockInfo.hasUnlockRequest ? (
                            <span className="text-amber-800 font-bold inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> طلب تمديد
                            </span>
                          ) : rawVal !== '' ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Unlock className="w-3 h-3 text-emerald-600" /> متاح ({countdown.h}س)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">معلق</span>
                          )}
                        </td>
                      </tr>
                    );
                  } else {
                    // Semester View Row (دور 1, 2, 3 with Sum, Avg, Rating)
                    const d1Raw = row[activePeriods[0]] || '';
                    const d2Raw = row[activePeriods[1]] || '';
                    const d3Raw = row[activePeriods[2]] || '';

                    const d1Num = parseFloat(d1Raw);
                    const d2Num = parseFloat(d2Raw);
                    const d3Num = parseFloat(d3Raw);

                    const validScores = [d1Num, d2Num, d3Num].filter(n => !isNaN(n));
                    const sum = validScores.length > 0
                      ? Math.round(validScores.reduce((a, b) => a + b, 0) * 10) / 10
                      : null;
                    const avg = validScores.length > 0
                      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
                      : null;
                    const rating = getRating(avg);

                    return (
                      <tr
                        key={student.StudentID}
                        className="hover:bg-[#faf7f0] transition-colors group"
                      >
                        {/* 1. IdNumb (Rightmost) */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-xs text-slate-600 bg-slate-50/50">
                          {student.RollNo || student.StudentID}
                        </td>

                        {/* 2. Student Name (أسماء الطلاب - On the Right) */}
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-bold text-slate-950 font-serif text-base block">
                            {student.NameArabic || student.Name}
                          </span>
                          {student.NameArabic && student.Name && (
                            <span className="text-[11px] text-slate-500 font-sans block" dir="ltr">
                              {student.Name}
                            </span>
                          )}
                        </td>

                        {/* 3. Dawr 1 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            ref={el => {
                              inputRefs.current[`${rowIndex}-0`] = el;
                            }}
                            type="text"
                            disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
                            value={d1Raw}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, activePeriods[0], e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 0, activePeriods)}
                            className={`w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                              !canUserEditThisSubject || activeLockInfo.isLocked
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                            }`}
                            title={
                              !canUserEditThisSubject
                                ? isSSG
                                  ? 'خاص بمادة النشاط فقط'
                                  : 'مادة النشاط مخصصة لمجلس الطلبة'
                                : activeLockInfo.isLocked
                                ? 'سجل الدرجات مقفل (انتهت مهلة التعديل)'
                                : ''
                            }
                          />
                        </td>

                        {/* 4. Dawr 2 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            ref={el => {
                              inputRefs.current[`${rowIndex}-1`] = el;
                            }}
                            type="text"
                            disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
                            value={d2Raw}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, activePeriods[1], e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 1, activePeriods)}
                            className={`w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                              !canUserEditThisSubject || activeLockInfo.isLocked
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                            }`}
                            title={
                              !canUserEditThisSubject
                                ? isSSG
                                  ? 'خاص بمادة النشاط فقط'
                                  : 'مادة النشاط مخصصة لمجلس الطلبة'
                                : activeLockInfo.isLocked
                                ? 'سجل الدرجات مقفل (انتهت مهلة التعديل)'
                                : ''
                            }
                          />
                        </td>

                        {/* 5. Dawr 3 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            ref={el => {
                              inputRefs.current[`${rowIndex}-2`] = el;
                            }}
                            type="text"
                            disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
                            value={d3Raw}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, activePeriods[2], e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 2, activePeriods)}
                            className={`w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                              !canUserEditThisSubject || activeLockInfo.isLocked
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                            }`}
                            title={
                              !canUserEditThisSubject
                                ? isSSG
                                  ? 'خاص بمادة النشاط فقط'
                                  : 'مادة النشاط مخصصة لمجلس الطلبة'
                                : activeLockInfo.isLocked
                                ? 'سجل الدرجات مقفل (انتهت مهلة التعديل)'
                                : ''
                            }
                          />
                        </td>

                        {/* 6. Total (مجموع - Live calculated) */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-slate-900 bg-amber-50/40">
                          {sum !== null ? sum : '—'}
                        </td>

                        {/* 7. Average (معدل - Live calculated) */}
                        <td className="py-2.5 px-3 text-center font-mono font-extrabold text-sm text-slate-950 bg-amber-50/70">
                          {avg !== null ? avg : '—'}
                        </td>

                        {/* 8. Rating Badge (تقدير - Live calculated) */}
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block w-full py-1 px-2.5 text-center text-xs font-black rounded-sm shadow-xs ${rating.pillClass}`}
                          >
                            {rating.labelAr}
                          </span>
                        </td>

                        {/* 9. Status */}
                        <td className="py-2.5 px-3 text-center text-xs">
                          {activeLockInfo.isLocked ? (
                            <span className="text-red-700 font-bold inline-flex items-center gap-1 bg-red-100/80 px-2 py-0.5 rounded-md border border-red-200">
                              <Lock className="w-3 h-3 text-red-600" /> مقفل
                            </span>
                          ) : activeLockInfo.hasUnlockRequest ? (
                            <span className="text-amber-800 font-bold inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> طلب تمديد
                            </span>
                          ) : validScores.length > 0 ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Unlock className="w-3 h-3 text-emerald-600" /> متاح ({countdown.h}س)
                            </span>
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

            {/* Summary Footer Row (Excel Summary Totals) */}
            <tfoot className="bg-[#ede5d1] text-slate-950 font-bold border-t-2 border-[#b79e55]">
              <tr>
                <td className="py-3 px-3 text-center font-mono text-xs text-slate-600">
                  {students.length}
                </td>
                <td className="py-3 px-4 text-right font-black">
                  إحصائيات المادة العامة (Class Average & Stats)
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

        {/* Footer Shortcut Helper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 pt-1 px-1 font-medium">
          <div className="flex items-center gap-3">
            <span>
              <strong>ملاحظة:</strong> يتم حفظ جميع الدرجات مباشرة في قاعدة بيانات المدرسة.
            </span>
            <span className="hidden md:inline text-slate-400">&bull;</span>
            <span className="hidden md:inline">
              اضغط على أي خلية للكتابة، واستخدم أسهم الكيبورد أو Enter للتنقل.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isMudir || activeLockInfo.isLocked}
              className={`px-4 py-1.5 font-bold rounded-lg text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors ${
                activeLockInfo.isLocked
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed opacity-80'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-white'
              }`}
            >
              {activeLockInfo.isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-red-300" />
                  <span>السجل مقفل (Locked)</span>
                </>
              ) : (
                <span>حفظ الكل الآن (Save All)</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
