'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SubjectItem,
  ClassItem,
  StudentItem,
  StudentGradeItem,
  GradingPeriod,
  GradingCriteria,
} from '@/lib/types';
import { DataStore, getTaqdirRating, DEFAULT_TAQDIR_SCALE } from '@/lib/store';
import { useAcademicTerm } from '@/lib/useAcademicTerm';
import { exportGradesToExcelRTL, exportCriteriaTemplateRTL } from '@/lib/gradeExcel';
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
  Sliders,
  Plus,
  Trash2,
  FileSpreadsheet,
  X,
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
  canManageLocks?: boolean;
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
  canManageLocks,
  isSSG = false,
  onSaveSuccess,
}: ExcelGradeEditorProps) {
  const { semester: globalSemester, setSemester: setGlobalSemester } = useAcademicTerm();
  const hasLockControl = canManageLocks ?? isMudir;
  const [viewMode, setViewMode] = useState<EditorViewMode>('dawr');
  const [selectedPeriod, setSelectedPeriod] = useState<GradingPeriod>(
    globalSemester === '2nd' ? '4th' : '1st'
  );
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>(
    globalSemester === '2nd' ? '2nd' : '1st'
  );

  // Sync with global semester switcher / crumbs (Task 3)
  useEffect(() => {
    setSelectedSemester(globalSemester);
    setSelectedPeriod(prev => {
      if (globalSemester === '1st' && ['4th', '5th', '6th'].includes(prev)) {
        return '1st';
      }
      if (globalSemester === '2nd' && ['1st', '2nd', '3rd'].includes(prev)) {
        return '4th';
      }
      return prev;
    });
  }, [globalSemester]);

  // Working grid state: StudentID -> Period -> value (number | 'INC' | 'DRP' | '')
  const [gridValues, setGridValues] = useState<Record<number, Record<string, string>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [quickFillVal, setQuickFillVal] = useState<string>('85');
  const [showQuickFill, setShowQuickFill] = useState(false);

  // Requirement 12: In the teacher's view, DRP students are automatically hidden unless teacher clicks "View All"
  const [showAllStudentsWithDRP, setShowAllStudentsWithDRP] = useState(false);

  // Task 3: Subject-specific grading criteria (50% Tabulation Score locked + customizable remaining 50%)
  const [subjectCriteria, setSubjectCriteria] = useState<GradingCriteria[]>(() =>
    DataStore.getSubjectCriteria(classItem.ClassID, subject.SubjectID)
  );
  const [criteriaScoresGrid, setCriteriaScoresGrid] = useState<Record<number, Record<string, string>>>({});
  const [showCriteriaSetup, setShowCriteriaSetup] = useState(false);
  const [newCritName, setNewCritName] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(10);

  // Task 4: Excel-like drag up/down to fill
  const [dragFill, setDragFill] = useState<{
    colKey: string;
    startRow: number;
    currentRow: number;
    value: string;
  } | null>(null);

  // Task 5: Taqdir ratio configured by Admin / Principal (always read latest)
  const taqdirScale =
    typeof window !== 'undefined' ? DataStore.getTaqdirScale() : DEFAULT_TAQDIR_SCALE;

  // Remember previous numeric score before toggling INC/DRP so toggling twice restores it
  const prevScoresBeforeSpecial = useRef<Record<number, Record<string, string>>>({});

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

  // Helper to check if a student is SAVED as DRP in the database (Task 6: don't hide before submission!)
  const isStudentSavedDRP = (studentId: number): boolean => {
    const row = gridValues[studentId] || {};
    if (viewMode === 'dawr') {
      const currentVal = (row[selectedPeriod] || '').trim().toUpperCase();
      const saved = allGrades.find(
        g =>
          g.StudentID === studentId &&
          g.SubjectID === subject.SubjectID &&
          g.ClassID === classItem.ClassID &&
          g.Period === selectedPeriod
      );
      // Only hide if it is already saved as DRP and hasn't been changed to something else
      return saved?.FinalGrade === 'DRP' && (currentVal === '' || currentVal === 'DRP');
    } else {
      return activePeriods.some(p => {
        const currentVal = (row[p] || '').trim().toUpperCase();
        const saved = allGrades.find(
          g =>
            g.StudentID === studentId &&
            g.SubjectID === subject.SubjectID &&
            g.ClassID === classItem.ClassID &&
            g.Period === p
        );
        return saved?.FinalGrade === 'DRP' && (currentVal === '' || currentVal === 'DRP');
      });
    }
  };

  // Helper to check if a student currently has DRP in the working grid (for red row highlighting)
  const isStudentDRP = (studentId: number): boolean => {
    const row = gridValues[studentId] || {};
    if (viewMode === 'dawr') {
      const currentVal = (row[selectedPeriod] || '').trim().toUpperCase();
      if (currentVal === 'DRP') return true;
      return isStudentSavedDRP(studentId);
    } else {
      return activePeriods.some(p => (row[p] || '').trim().toUpperCase() === 'DRP');
    }
  };

  // Count of saved DRP students in this class/subject
  const drpStudentsList = useMemo(() => {
    return students.filter(s => isStudentSavedDRP(s.StudentID));
  }, [students, gridValues, allGrades, viewMode, selectedPeriod, activePeriods, subject.SubjectID, classItem.ClassID]);

  // Visible students list: automatically hides SAVED DRP students unless "View All" is clicked
  // Unsubmitted DRP clicks remain visible until Save/Submit (Task 6)
  const visibleStudents = useMemo(() => {
    if (showAllStudentsWithDRP) return students;
    return students.filter(s => !isStudentSavedDRP(s.StudentID));
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

  // Reset local unlock request flag when switching subject, class, or period
  useEffect(() => {
    setUnlockRequestedLocal(false);
  }, [subject.SubjectID, classItem.ClassID, selectedPeriod, selectedSemester, viewMode]);

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
    const deadlineCheck = DataStore.checkGradeLock(undefined, primaryPeriod, classItem.ClassID, subject.SubjectID);
    const subjectOverrideRequested = periodsToCheck.some(
      p => DataStore.getSubjectUnlockOverride(classItem.ClassID, subject.SubjectID, p)?.UnlockRequested
    );

    if (periodGrades.length === 0) {
      return {
        isLocked: deadlineCheck.isLocked,
        remainingMs: deadlineCheck.remainingMs,
        allowedHours: deadlineCheck.allowedHours || defaultHours,
        status: deadlineCheck.status,
        hasUnlockRequest: unlockRequestedLocal || subjectOverrideRequested,
        submittedAt: null as string | null,
        expiresAt: deadlineCheck.expiresAt || null,
      };
    }

    const checks = periodGrades.map(g => ({
      grade: g,
      check: DataStore.checkGradeLock(g, g.Period, classItem.ClassID, subject.SubjectID),
    }));

    const anyLocked = checks.some(c => c.check.isLocked);
    const hasUnlockRequest =
      unlockRequestedLocal || subjectOverrideRequested || periodGrades.some(g => g.UnlockRequested);

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
      DataStore.requestSubjectUnlock(classItem.ClassID, subject.SubjectID, p, teacherId);
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

  // Initialize working grid from stored grades & criteria scores
  useEffect(() => {
    const loadedCriteria = DataStore.getSubjectCriteria(classItem.ClassID, subject.SubjectID);
    setSubjectCriteria(loadedCriteria);

    const initial: Record<number, Record<string, string>> = {};
    const initialCrit: Record<number, Record<string, string>> = {};

    students.forEach(std => {
      initial[std.StudentID] = {};
      initialCrit[std.StudentID] = {};
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

        if (p === selectedPeriod && found?.CriteriaScores) {
          loadedCriteria.forEach(c => {
            const v = found.CriteriaScores[c.id];
            if (v !== undefined && v !== null) {
              // Scale legacy 0-100 seed scores down to the criterion's weight max so SUM <= 100
              const normalized =
                v > c.weight ? Math.round(((v * c.weight) / 100) * 10) / 10 : v;
              initialCrit[std.StudentID][c.id] = String(normalized);
            }
          });
        }
      });
    });

    setGridValues(initial);
    setCriteriaScoresGrid(initialCrit);
    setHasUnsavedChanges(false);
  }, [subject.SubjectID, classItem.ClassID, students, allGrades, selectedPeriod]);

  // Task 4: Apply drag-fill on mouseup
  useEffect(() => {
    if (!dragFill) return;
    const handleMouseUp = () => {
      const { colKey, startRow, currentRow, value } = dragFill;
      const minR = Math.min(startRow, currentRow);
      const maxR = Math.max(startRow, currentRow);

      if (minR !== maxR) {
        if (colKey.startsWith('crit:')) {
          const critId = colKey.slice(5);
          setCriteriaScoresGrid(prev => {
            const updatedCrit = { ...prev };
            const updatedGridValues: Record<number, string> = {};

            for (let r = minR; r <= maxR; r++) {
              const std = visibleStudents[r];
              if (!std) continue;
              const stdCrit = { ...(updatedCrit[std.StudentID] || {}), [critId]: value };
              updatedCrit[std.StudentID] = stdCrit;

              // Recalculate sum for this student
              let sum = 0;
              let hasAny = false;
              subjectCriteria.forEach(c => {
                const n = parseFloat(stdCrit[c.id] || '');
                if (!isNaN(n)) {
                  sum += n;
                  hasAny = true;
                }
              });
              if (hasAny) {
                updatedGridValues[std.StudentID] = String(Math.min(100, Math.round(sum * 10) / 10));
              }
            }

            if (Object.keys(updatedGridValues).length > 0) {
              setGridValues(gv => {
                const next = { ...gv };
                Object.entries(updatedGridValues).forEach(([sid, val]) => {
                  const idNum = Number(sid);
                  next[idNum] = { ...(next[idNum] || {}), [selectedPeriod]: val };
                });
                return next;
              });
            }

            return updatedCrit;
          });
        } else {
          // Period column (e.g. '1st', '2nd', etc.)
          const periodKey = colKey as GradingPeriod;
          setGridValues(prev => {
            const next = { ...prev };
            for (let r = minR; r <= maxR; r++) {
              const std = visibleStudents[r];
              if (!std) continue;
              next[std.StudentID] = { ...(next[std.StudentID] || {}), [periodKey]: value };
            }
            return next;
          });
        }
        setHasUnsavedChanges(true);
      }
      setDragFill(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragFill, visibleStudents, subjectCriteria, selectedPeriod]);

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
  }, [gridValues, hasUnsavedChanges, criteriaScoresGrid]);

  // Rating badge helper using Admin/Principal configured Taqdir scale
  const getRating = (avg: number | null | undefined): { labelAr: string; pillClass: string } => {
    const r = getTaqdirRating(avg, taqdirScale, 'INC');
    return { labelAr: r.labelAr, pillClass: r.pillClass };
  };

  // Task 3: Handle criteria score entry & automatically compute sum into FinalGrade
  const handleCriteriaCellChange = (studentId: number, crit: GradingCriteria, rawVal: string) => {
    const trimmed = rawVal.trim();
    if (trimmed !== '') {
      const num = parseFloat(trimmed);
      if (isNaN(num) || num < 0 || num > crit.weight) return;
    }

    setCriteriaScoresGrid(prev => {
      const stdCrit = { ...(prev[studentId] || {}), [crit.id]: trimmed };
      const next = { ...prev, [studentId]: stdCrit };

      let sum = 0;
      let hasAny = false;
      subjectCriteria.forEach(c => {
        const val = parseFloat(stdCrit[c.id] || '');
        if (!isNaN(val)) {
          sum += val;
          hasAny = true;
        }
      });

      setGridValues(gv => ({
        ...gv,
        [studentId]: {
          ...(gv[studentId] || {}),
          [selectedPeriod]: hasAny ? String(Math.min(100, Math.round(sum * 10) / 10)) : '',
        },
      }));
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleAddSubjectCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;
    const weight = Math.max(1, Math.min(50, Number(newCritWeight) || 10));
    const updated: GradingCriteria[] = [
      ...subjectCriteria.filter(c => !c.isLocked && c.id !== 'crit-tabulation'),
      { id: `crit-${Date.now()}`, name: newCritName.trim(), weight },
      ...subjectCriteria.filter(c => c.isLocked || c.id === 'crit-tabulation'),
    ];
    DataStore.saveSubjectCriteria(classItem.ClassID, subject.SubjectID, updated);
    setSubjectCriteria(DataStore.getSubjectCriteria(classItem.ClassID, subject.SubjectID));
    setNewCritName('');
    setNewCritWeight(10);
  };

  const handleUpdateCriterionWeight = (critId: string, weight: number) => {
    const updated = subjectCriteria.map(c =>
      c.id === critId && !c.isLocked && c.id !== 'crit-tabulation'
        ? { ...c, weight: Math.max(1, Math.min(50, weight || 0)) }
        : c
    );
    DataStore.saveSubjectCriteria(classItem.ClassID, subject.SubjectID, updated);
    setSubjectCriteria(DataStore.getSubjectCriteria(classItem.ClassID, subject.SubjectID));
  };

  const handleDeleteSubjectCriterion = (critId: string) => {
    const target = subjectCriteria.find(c => c.id === critId);
    if (!target || target.isLocked || target.id === 'crit-tabulation') return;
    const updated = subjectCriteria.filter(c => c.id !== critId);
    DataStore.saveSubjectCriteria(classItem.ClassID, subject.SubjectID, updated);
    setSubjectCriteria(DataStore.getSubjectCriteria(classItem.ClassID, subject.SubjectID));
  };

  // Toggle INC or DRP; toggling off restores criteria sum or previous numeric score
  const handleToggleSpecialStatus = (
    studentId: number,
    period: GradingPeriod,
    status: 'INC' | 'DRP'
  ) => {
    const currentRaw = (gridValues[studentId]?.[period] || '').trim().toUpperCase();
    if (currentRaw !== status) {
      if (currentRaw !== '' && currentRaw !== 'INC' && currentRaw !== 'DRP') {
        if (!prevScoresBeforeSpecial.current[studentId]) {
          prevScoresBeforeSpecial.current[studentId] = {};
        }
        prevScoresBeforeSpecial.current[studentId][period] = currentRaw;
      }
      handleCellChange(studentId, period, status);
    } else {
      // Toggling OFF: 1) recalculate sum from criteriaScoresGrid if available
      const critRow = criteriaScoresGrid[studentId] || {};
      let critSum = 0;
      let hasCrit = false;
      subjectCriteria.forEach(c => {
        const n = parseFloat(critRow[c.id] || '');
        if (!isNaN(n)) {
          critSum += n;
          hasCrit = true;
        }
      });

      if (hasCrit) {
        const total = String(Math.min(100, Math.round(critSum * 10) / 10));
        handleCellChange(studentId, period, total);
        return;
      }

      // 2) Otherwise restore remembered score before DRP/INC
      const remembered = prevScoresBeforeSpecial.current[studentId]?.[period];
      if (remembered !== undefined && remembered !== '') {
        handleCellChange(studentId, period, remembered);
        return;
      }

      // 3) Fallback to saved numeric grade in allGrades if any
      const saved = allGrades.find(
        g =>
          g.StudentID === studentId &&
          g.SubjectID === subject.SubjectID &&
          g.ClassID === classItem.ClassID &&
          g.Period === period
      );
      if (saved && typeof saved.FinalGrade === 'number') {
        handleCellChange(studentId, period, String(saved.FinalGrade));
        return;
      }

      handleCellChange(studentId, period, '');
    }
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
        // Task 7: If left blank when submitted, automatically set as INC
        let finalG: number | 'INC' | 'DRP' = 'INC';
        if (rawVal === '' || rawVal === 'INC') {
          finalG = 'INC';
        } else if (rawVal === 'DRP') {
          finalG = 'DRP';
        } else {
          finalG = parseFloat(rawVal) || 0;
        }

        // Preserve or populate criteria scores
        const existingGrade = allGrades.find(
          g =>
            g.StudentID === std.StudentID &&
            g.SubjectID === subject.SubjectID &&
            g.ClassID === classItem.ClassID &&
            g.Period === p
        );

        let criteriaScores: Record<string, number> = {};
        if (typeof finalG === 'number') {
          const critRow = p === selectedPeriod ? criteriaScoresGrid[std.StudentID] : undefined;
          const hasEnteredCrit =
            critRow && Object.values(critRow).some(v => v !== undefined && v !== '');
          if (hasEnteredCrit && critRow) {
            subjectCriteria.forEach(c => {
              const num = parseFloat(critRow[c.id] || '');
              if (!isNaN(num)) criteriaScores[c.id] = num;
            });
          } else if (
            existingGrade?.CriteriaScores &&
            Object.keys(existingGrade.CriteriaScores).length > 0 &&
            existingGrade.FinalGrade === finalG
          ) {
            criteriaScores = existingGrade.CriteriaScores;
          } else {
            subjectCriteria.forEach(c => {
              criteriaScores[c.id] = Math.round(((finalG * c.weight) / 100) * 10) / 10;
            });
          }
        }

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

  // Task 10: Export to RTL Excel matching Picture 5 (with school header, logo, metadata, and table)
  const handleExportExcel = async () => {
    try {
      await exportGradesToExcelRTL({
        subject,
        classItem,
        students: visibleStudents,
        gridValues,
        viewMode,
        selectedPeriod,
        selectedSemester,
        activePeriods,
        academicYear: DataStore.getActiveAcademicYear(),
        taqdirScale,
      });
    } catch {
      setToastMsg({ type: 'error', text: 'تعذر تصدير ملف الإكسل.' });
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Task 11: Download Upload Template generated from Ustadh's criteria with SUM & Taqdir formulas and locked cells
  const handleDownloadTemplate = async () => {
    try {
      await exportCriteriaTemplateRTL({
        subject,
        classItem,
        students: visibleStudents,
        criteriaList: subjectCriteria,
        criteriaScoresGrid,
        selectedPeriod,
        selectedSemester,
        academicYear: DataStore.getActiveAcademicYear(),
        taqdirScale,
      });
    } catch {
      setToastMsg({ type: 'error', text: 'تعذر تحميل قالب الإدخال.' });
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Import from Excel file (supports both the new RTL template with criteria columns & legacy format)
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

        // Read as 2D array first to locate the table header row (since rows 1-6 are school header/metadata)
        const rows2D: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const headerRowIdx = rows2D.findIndex(r =>
          r.some(cell => {
            const s = String(cell || '').trim();
            return (
              s === 'الرقم (ID)' ||
              s === 'الرقم' ||
              s === 'Roll No' ||
              s === 'RollNo' ||
              s === 'IdNumb'
            );
          })
        );

        const importedData: any[] =
          headerRowIdx >= 0
            ? XLSX.utils.sheet_to_json(ws, { range: headerRowIdx, defval: '' })
            : XLSX.utils.sheet_to_json(ws, { defval: '' });

        let matchCount = 0;
        const importedCritUpdates: Record<number, Record<string, string>> = {};

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
              if (matchedStudent) {
                if (!updated[matchedStudent.StudentID]) {
                  updated[matchedStudent.StudentID] = {};
                }

                // Check if template criteria columns are present
                let critSum = 0;
                let hasCritCols = false;
                const critMap: Record<string, string> = {};
                subjectCriteria.forEach(c => {
                  const headerWithWeight = `${c.name} (${c.weight}%)`;
                  const rawC = row[headerWithWeight] !== undefined ? row[headerWithWeight] : row[c.name];
                  if (rawC !== undefined && rawC !== '') {
                    const numC = parseFloat(String(rawC));
                    if (!isNaN(numC)) {
                      const clamped = Math.max(0, Math.min(c.weight, numC));
                      critMap[c.id] = String(clamped);
                      critSum += clamped;
                      hasCritCols = true;
                    }
                  }
                });

                if (hasCritCols) {
                  importedCritUpdates[matchedStudent.StudentID] = critMap;
                }

                if (viewMode === 'dawr') {
                  if (hasCritCols) {
                    updated[matchedStudent.StudentID][selectedPeriod] = String(
                      Math.min(100, Math.round(critSum * 10) / 10)
                    );
                    matchCount++;
                  } else if (grade !== undefined && grade !== '') {
                    updated[matchedStudent.StudentID][selectedPeriod] = String(grade).toUpperCase();
                    matchCount++;
                  }
                } else {
                  if (row['دور ١'] !== undefined && row['دور ١'] !== '')
                    updated[matchedStudent.StudentID][activePeriods[0]] = String(row['دور ١']);
                  if (row['دور 1'] !== undefined && row['دور 1'] !== '')
                    updated[matchedStudent.StudentID][activePeriods[0]] = String(row['دور 1']);
                  if (row['دور ٢'] !== undefined && row['دور ٢'] !== '')
                    updated[matchedStudent.StudentID][activePeriods[1]] = String(row['دور ٢']);
                  if (row['دور 2'] !== undefined && row['دور 2'] !== '')
                    updated[matchedStudent.StudentID][activePeriods[1]] = String(row['دور 2']);
                  if (row['دور ٣'] !== undefined && row['دور ٣'] !== '')
                    updated[matchedStudent.StudentID][activePeriods[2]] = String(row['دور ٣']);
                  if (row['دور 3'] !== undefined && row['دور 3'] !== '')
                    updated[matchedStudent.StudentID][activePeriods[2]] = String(row['دور 3']);
                  matchCount++;
                }
              }
            }
          });
          return updated;
        });

        if (Object.keys(importedCritUpdates).length > 0) {
          setCriteriaScoresGrid(prev => ({ ...prev, ...importedCritUpdates }));
        }

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
    e.target.value = '';
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
              {selectedSemester === '1st' ? (
                <>
                  <option value="1st">دور الأول (1ˢᵗ Dawr - 1st Sem)</option>
                  <option value="2nd">دور الثاني (2ⁿᵈ Dawr - 1st Sem)</option>
                  <option value="3rd">دور الثالث (3ʳᵈ Dawr - 1st Sem)</option>
                </>
              ) : (
                <>
                  <option value="4th">دور الرابع (4ᵗʰ Dawr - 2nd Sem)</option>
                  <option value="5th">دور الخامس (5ᵗʰ Dawr - 2nd Sem)</option>
                  <option value="6th">دور السادس (6ᵗʰ Dawr - 2nd Sem)</option>
                </>
              )}
            </select>
          ) : (
            <select
              value={selectedSemester}
              onChange={e => {
                const nextSem = e.target.value as '1st' | '2nd';
                setSelectedSemester(nextSem);
                setGlobalSemester(nextSem);
              }}
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

            {/* Criteria Setup Button (Task 3 - available to Teacher, Admin & Principal) */}
            {(canUserEditThisSubject || hasLockControl) && viewMode === 'dawr' && (
              <button
                type="button"
                onClick={() => setShowCriteriaSetup(!showCriteriaSetup)}
                className={`px-3 py-1.5 font-bold text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-colors border ${
                  showCriteriaSetup
                    ? 'bg-emerald-800 text-white border-emerald-900'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>معايير الدرجات (Criteria)</span>
              </button>
            )}

            {/* Download Upload Template (Task 11) */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
              title="تحميل قالب الإدخال مع المعادلات التلقائية وحماية الأسماء"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
              <span>قالب الإدخال (Template)</span>
            </button>

            {/* Export to Excel (Task 10) */}
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

        {/* Edit Window & Lock Status / Unlock Controls Banner */}
        {(activeLockInfo.isLocked || activeLockInfo.remainingMs > 0 || hasLockControl) && (
          <div
            className={`rounded-2xl p-3.5 border-2 flex flex-col md:flex-row md:items-center justify-between gap-3 text-right transition-all ${
              activeLockInfo.isLocked
                ? 'bg-red-50 border-red-300 text-red-950'
                : activeLockInfo.status === 'unlocked_by_admin'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeLockInfo.isLocked
                    ? 'bg-red-600 text-white'
                    : activeLockInfo.status === 'unlocked_by_admin'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {activeLockInfo.isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs">
                {activeLockInfo.isLocked ? (
                  <>
                    <div className="font-black text-red-900 text-sm">
                      سجل الدرجات مقفل حالياً (Grades Locked)
                    </div>
                    <div className="text-red-700 mt-0.5">
                      انتهت مهلة التعديل أو الموعد النهائي لهذا الدور. لا يمكن تعديل الدرجات إلا بعد موافقة المدير أو المشرف على فتح المهلة.
                    </div>
                  </>
                ) : activeLockInfo.remainingMs > 0 ? (
                  <>
                    <div className="font-black text-sm flex items-center gap-2 flex-wrap">
                      <span>
                        {activeLockInfo.status === 'unlocked_by_admin'
                          ? 'تم فتح التعديل بإذن الإدارة (Unlocked by Admin)'
                          : 'مهلة التعديل بعد الاعتماد نشطة'}
                      </span>
                      <span className="font-mono bg-white/80 px-2 py-0.5 rounded-lg border border-current/20">
                        متبقي: {countdown.text}
                      </span>
                    </div>
                    <div className="opacity-80 mt-0.5">
                      يغلق السجل تلقائياً في: {formatDateTimeArabic(activeLockInfo.expiresAt)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-black text-sm">السجل مفتوح للإدخال (Open for Submission)</div>
                    <div className="opacity-80 mt-0.5">
                      تبدأ مهلة التعديل ({toHindiNumerals(activeLockInfo.allowedHours)} ساعة) تلقائياً بعد أول حفظ للدرجات.
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {hasLockControl ? (
                <>
                  <select
                    value={mudirGrantHours}
                    onChange={e => setMudirGrantHours(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold cursor-pointer"
                  >
                    <option value={6}>٦ ساعات (6h)</option>
                    <option value={12}>١٢ ساعة (12h)</option>
                    <option value={24}>٢٤ ساعة (24h)</option>
                    <option value={48}>٤٨ ساعة (48h)</option>
                    <option value={72}>٧٢ ساعة (72h)</option>
                    <option value={168}>أسبوع (168h)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleMudirGrantUnlock(mudirGrantHours)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>منح فتح / تمديد</span>
                  </button>
                  {!activeLockInfo.isLocked && (
                    <button
                      type="button"
                      onClick={handleMudirLockNow}
                      className="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>قفل فوراً</span>
                    </button>
                  )}
                </>
              ) : (
                activeLockInfo.isLocked &&
                canUserEditThisSubject && (
                  <button
                    type="button"
                    onClick={handleRequestUnlock}
                    disabled={activeLockInfo.hasUnlockRequest}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-400 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {activeLockInfo.hasUnlockRequest
                        ? 'تم إرسال طلب الفتح (بانتظار المدير)'
                        : 'طلب فتح مهلة التعديل (Request Unlock)'}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Task 3: Criteria Setup Panel (50% Tabulation Score locked + customizable remaining 50%) */}
        {showCriteriaSetup && viewMode === 'dawr' && (
          <div className="bg-white rounded-2xl border-2 border-emerald-300 p-4 shadow-sm space-y-3" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  <span>إعداد معايير الدرجات للمادة (Subject Criteria & Ratio)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  درجة التبويب (Tabulation Score) ثابتة بنسبة ٥٠٪ ولا يمكن تعديلها أو حذفها. يمكنك إضافة أو حذف وتعديل نسب المعايير الأخرى (مثل الحضور، الاختبار القصير، الامتحان).
                </p>
              </div>
              {(() => {
                const totalW = subjectCriteria.reduce((acc, c) => acc + c.weight, 0);
                return (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black font-mono shrink-0 ${
                      totalW === 100
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    المجموع الكلي: {totalW}% / 100%
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {subjectCriteria.map(c => {
                const locked = Boolean(c.isLocked || c.id === 'crit-tabulation');
                return (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      locked
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                        {locked && <Lock className="w-3 h-3 text-amber-700 shrink-0" />}
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          disabled={locked}
                          value={c.weight}
                          onChange={e => handleUpdateCriterionWeight(c.id, Number(e.target.value))}
                          className={`w-16 px-2 py-0.5 rounded border text-xs font-mono font-bold text-center ${
                            locked
                              ? 'bg-amber-100/70 border-amber-300 text-amber-900 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    </div>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubjectCriterion(c.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="حذف المعيار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddSubjectCriterion} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                required
                value={newCritName}
                onChange={e => setNewCritName(e.target.value)}
                placeholder="اسم المعيار الجديد (مثلاً: Participation / المشاركة)"
                className="flex-1 min-w-[200px] px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={newCritWeight}
                  onChange={e => setNewCritWeight(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center bg-white"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة معيار</span>
              </button>
            </form>
          </div>
        )}

        {/* Task 5: Legend for تقدير Ratio (configured by Admin / Principal) */}
        <div
          className="bg-white/90 rounded-xl px-4 py-2 border border-[#d6c9a5] flex flex-wrap items-center justify-between gap-2 text-xs"
          dir="rtl"
        >
          <span className="font-black text-slate-800 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>سلم التقدير المعتمد (تقدير Legend):</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 font-bold">
            <span className="px-2.5 py-0.5 rounded bg-[#6bd953] text-slate-950 font-mono">
              ممتاز: {taqdirScale.mumtazMin}–100
            </span>
            <span className="px-2.5 py-0.5 rounded bg-[#f7d842] text-slate-950 font-mono">
              جيد جدا: {taqdirScale.jayyidJiddanMin}–{taqdirScale.mumtazMin - 1}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-[#fbbd4c] text-slate-950 font-mono">
              جيد: {taqdirScale.jayyidMin}–{taqdirScale.jayyidJiddanMin - 1}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-[#fb8c44] text-slate-950 font-mono">
              مقبول: {taqdirScale.maqboolMin}
              {taqdirScale.jayyidMin - 1 > taqdirScale.maqboolMin ? `–${taqdirScale.jayyidMin - 1}` : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-[#fc5454] text-slate-950 font-mono">
              راسب: 0–{taqdirScale.maqboolMin - 1}
            </span>
          </div>
        </div>

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
                  <th className="py-3 px-4 text-right min-w-[180px]">أسماء الطلاب</th>
                  {subjectCriteria.map(c => (
                    <th key={c.id} className="py-3 px-2 text-center min-w-[96px] text-xs">
                      <div>{c.name}</div>
                      <div className="text-[10px] font-mono opacity-80">({c.weight}%)</div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center w-32">الدرجة (المجموع)</th>
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
                    colSpan={viewMode === 'dawr' ? 5 + subjectCriteria.length : 9}
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
                        onMouseEnter={() => {
                          if (dragFill) {
                            setDragFill(prev => (prev ? { ...prev, currentRow: rowIndex } : null));
                          }
                        }}
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

                        {/* Criteria Score Cells (Task 3 & Task 4 Drag Fill) */}
                        {subjectCriteria.map(crit => {
                          const critVal = criteriaScoresGrid[student.StudentID]?.[crit.id] ?? '';
                          const colKey = `crit:${crit.id}`;
                          const isDragTarget =
                            dragFill &&
                            dragFill.colKey === colKey &&
                            rowIndex >= Math.min(dragFill.startRow, dragFill.currentRow) &&
                            rowIndex <= Math.max(dragFill.startRow, dragFill.currentRow);

                          return (
                            <td key={crit.id} className="py-2 px-1.5 text-center">
                              <div className="relative inline-block">
                                <input
                                  type="text"
                                  disabled={!canUserEditThisSubject || activeLockInfo.isLocked}
                                  value={critVal}
                                  placeholder={`0-${crit.weight}`}
                                  onChange={e => handleCriteriaCellChange(student.StudentID, crit, e.target.value)}
                                  className={`w-16 py-1.5 px-1 text-center font-mono font-bold text-xs rounded-lg border transition-all ${
                                    isDragTarget
                                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-400'
                                      : !canUserEditThisSubject || activeLockInfo.isLocked
                                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                  }`}
                                />
                                {canUserEditThisSubject && !activeLockInfo.isLocked && (
                                  <span
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      setDragFill({
                                        colKey,
                                        startRow: rowIndex,
                                        currentRow: rowIndex,
                                        value: critVal,
                                      });
                                    }}
                                    title="اسحب لأعلى أو لأسفل للتعبئة التلقائية (Drag to Fill)"
                                    className="w-2.5 h-2.5 bg-emerald-700 border border-white rounded-xs absolute -bottom-1 -left-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Final Grade / Sum Cell with Excel Drag Fill Handle */}
                        <td className="py-2 px-3 text-center">
                          <div className="relative inline-block">
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
                              className={`w-24 py-1.5 px-2 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                                dragFill &&
                                dragFill.colKey === selectedPeriod &&
                                rowIndex >= Math.min(dragFill.startRow, dragFill.currentRow) &&
                                rowIndex <= Math.max(dragFill.startRow, dragFill.currentRow)
                                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-400'
                                  : !canUserEditThisSubject || activeLockInfo.isLocked
                                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                  : rowIsDRP
                                  ? 'bg-red-600 text-white border-red-800'
                                  : rawVal !== ''
                                  ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 focus:bg-white focus:border-emerald-600'
                              }`}
                            />
                            {canUserEditThisSubject && !activeLockInfo.isLocked && (
                              <span
                                onMouseDown={e => {
                                  e.preventDefault();
                                  setDragFill({
                                    colKey: selectedPeriod,
                                    startRow: rowIndex,
                                    currentRow: rowIndex,
                                    value: rawVal,
                                  });
                                }}
                                title="اسحب لأعلى أو لأسفل للتعبئة التلقائية (Drag to Fill)"
                                className="w-2.5 h-2.5 bg-emerald-700 border border-white rounded-xs absolute -bottom-1 -left-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              />
                            )}
                          </div>
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
                                    handleToggleSpecialStatus(student.StudentID, selectedPeriod, 'INC')
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
                                    handleToggleSpecialStatus(student.StudentID, selectedPeriod, 'DRP')
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
                      ? { labelAr: 'INC', pillClass: 'bg-amber-200 text-amber-900 font-black' }
                      : getRating(avg);

                    return (
                      <tr
                        key={student.StudentID}
                        onMouseEnter={() => {
                          if (dragFill) {
                            setDragFill(prev => (prev ? { ...prev, currentRow: rowIndex } : null));
                          }
                        }}
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
                          const isDragTarget =
                            dragFill &&
                            dragFill.colKey === p &&
                            rowIndex >= Math.min(dragFill.startRow, dragFill.currentRow) &&
                            rowIndex <= Math.max(dragFill.startRow, dragFill.currentRow);
                          return (
                            <td key={p} className="py-2 px-2 text-center">
                              <div className="relative inline-block">
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
                                    isDragTarget
                                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-400'
                                      : !canUserEditThisSubject || activeLockInfo.isLocked
                                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                                      : valStr === 'DRP'
                                      ? 'bg-red-600 text-white border-red-800'
                                      : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                  }`}
                                />
                                {canUserEditThisSubject && !activeLockInfo.isLocked && (
                                  <span
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      setDragFill({
                                        colKey: p,
                                        startRow: rowIndex,
                                        currentRow: rowIndex,
                                        value: valStr,
                                      });
                                    }}
                                    title="اسحب لأعلى أو لأسفل للتعبئة التلقائية (Drag to Fill)"
                                    className="w-2.5 h-2.5 bg-emerald-700 border border-white rounded-xs absolute -bottom-1 -left-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  />
                                )}
                              </div>
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
                    {subjectCriteria.map(c => (
                      <td key={c.id} className="py-3 px-2 text-center font-mono text-xs text-slate-500">
                        {c.weight}%
                      </td>
                    ))}
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
