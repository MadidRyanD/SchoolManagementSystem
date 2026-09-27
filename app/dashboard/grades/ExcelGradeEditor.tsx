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
} from 'lucide-react';

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
      setToastMsg({ type: 'error', text: 'Mudir account is in view-only mode.' });
      setTimeout(() => setToastMsg(null), 3000);
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
              disabled={isMudir}
              className={`px-5 py-2 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 ${
                hasUnsavedChanges
                  ? 'bg-emerald-700 hover:bg-emerald-600 ring-2 ring-amber-400 ring-offset-1 animate-pulse'
                  : 'bg-[#187d44] hover:bg-[#136838]'
              }`}
              title="Save Grades (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span>{hasUnsavedChanges ? 'حفظ التعديلات *' : 'حفظ (Save)'}</span>
            </button>

            {/* Quick Fill Button */}
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
            {!isMudir && (
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
                            disabled={isMudir}
                            value={rawVal}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, selectedPeriod, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 0, [selectedPeriod])}
                            className={`w-28 py-1.5 px-2 text-center font-mono font-bold text-sm rounded-lg border transition-all ${
                              rawVal !== ''
                                ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                                : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 focus:bg-white focus:border-emerald-600'
                            }`}
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
                          {rawVal !== '' ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-0.5">
                              <Unlock className="w-3 h-3" /> متاح
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
                            disabled={isMudir}
                            value={d1Raw}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, activePeriods[0], e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 0, activePeriods)}
                            className="w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </td>

                        {/* 4. Dawr 2 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            ref={el => {
                              inputRefs.current[`${rowIndex}-1`] = el;
                            }}
                            type="text"
                            disabled={isMudir}
                            value={d2Raw}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, activePeriods[1], e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 1, activePeriods)}
                            className="w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </td>

                        {/* 5. Dawr 3 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            ref={el => {
                              inputRefs.current[`${rowIndex}-2`] = el;
                            }}
                            type="text"
                            disabled={isMudir}
                            value={d3Raw}
                            placeholder="—"
                            onChange={e => handleCellChange(student.StudentID, activePeriods[2], e.target.value)}
                            onKeyDown={e => handleKeyDown(e, rowIndex, 2, activePeriods)}
                            className="w-20 py-1.5 px-1 text-center font-mono font-bold text-sm rounded-lg border border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
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
                          {validScores.length > 0 ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-0.5">
                              <Unlock className="w-3 h-3" /> متاح
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
              disabled={isMudir}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              حفظ الكل الآن (Save All)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
