'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { useAcademicTerm } from '@/lib/useAcademicTerm';
import {
  ClassItem,
  StudentItem,
  StudentEnrollmentRecord,
  StudentPaymentLedger,
  StudentGradeItem,
  SemesterType,
} from '@/lib/types';
import {
  UserPlus,
  ArrowRightLeft,
  History,
  CheckCircle2,
  AlertCircle,
  Search,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  Square,
  Calendar,
  BookOpen,
  Wallet,
} from 'lucide-react';

export default function AcademicYearEnrollmentPage() {
  const { academicYear, semester, availableYears, setAcademicYear, setSemester, addAcademicYear } =
    useAcademicTerm();

  const [activeTab, setActiveTab] = useState<'promote' | 'new-student' | 'history'>('promote');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollmentRecord[]>([]);
  const [ledgers, setLedgers] = useState<StudentPaymentLedger[]>([]);
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);

  // Source & Target Term Controls for Promotion
  const [sourceYear, setSourceYear] = useState<string>('SY 2025-2026');
  const [sourceSemester, setSourceSemester] = useState<SemesterType>('1st');
  const [targetYear, setTargetYear] = useState<string>('SY 2026-2027');
  const [targetSemester, setTargetSemester] = useState<SemesterType>('1st');
  const [enrollBothSemesters, setEnrollBothSemesters] = useState<boolean>(true);
  const [createTuitionLedgers, setCreateTuitionLedgers] = useState<boolean>(true);
  const [newTargetYearInput, setNewTargetYearInput] = useState<string>('');

  // Filters & Selection
  const [sourceClassFilter, setSourceClassFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [customTargetClassMap, setCustomTargetClassMap] = useState<Record<number, number>>({});

  // New Student Registration Form
  const [newStudentForm, setNewStudentForm] = useState({
    Name: '',
    NameArabic: '',
    RollNo: '',
    Gender: 'Male',
    Tribe: 'Maranao',
    Nationality: 'Filipino',
    ClassID: 1,
    MobileNumber: '',
    Address: '',
  });

  // History Inspector
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedHistoryStudentId, setSelectedHistoryStudentId] = useState<number | null>(null);

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = AuthService.getSession();
  const canManage =
    !currentUser ||
    currentUser.role === 'admin' ||
    currentUser.role === 'mudir' ||
    currentUser.role === 'cashier';

  const loadData = () => {
    const cls = DataStore.getClasses();
    const stds = DataStore.getStudents();
    const enrs = DataStore.getEnrollments();
    const pays = DataStore.getPayments();
    const grds = DataStore.getGrades();

    setClasses(cls);
    setAllStudents(stds);
    setEnrollments(enrs);
    setLedgers(pays);
    setGrades(grds);

    if (cls.length > 0 && newStudentForm.ClassID === 1) {
      setNewStudentForm((prev) => ({ ...prev, ClassID: cls[0].ClassID }));
    }
  };

  useEffect(() => {
    loadData();
  }, [academicYear, semester]);

  // Keep targetYear sensible when academicYear changes
  useEffect(() => {
    if (availableYears.length > 0) {
      const idx = availableYears.indexOf(academicYear);
      if (idx >= 0 && idx + 1 < availableYears.length) {
        setSourceYear(academicYear);
        setTargetYear(availableYears[idx + 1]);
      } else {
        setTargetYear(academicYear);
      }
    }
  }, [academicYear, availableYears]);

  const classMap = useMemo(() => new Map(classes.map((c) => [c.ClassID, c])), [classes]);

  // Source term students
  const sourceEnrolledStudents = useMemo(() => {
    const sourceEnrs = enrollments.filter(
      (e) => e.AcademicYear === sourceYear && e.Semester === sourceSemester
    );
    const studentMap = new Map(allStudents.map((s) => [s.StudentID, s]));
    const targetEnrSet = new Set(
      enrollments
        .filter((e) => e.AcademicYear === targetYear && e.Semester === targetSemester)
        .map((e) => e.StudentID)
    );

    return sourceEnrs
      .map((enr) => {
        const student = studentMap.get(enr.StudentID);
        if (!student) return null;
        const suggestedNext = DataStore.suggestNextClassId(enr.ClassID);
        return {
          student,
          enrollment: enr,
          alreadyInTarget: targetEnrSet.has(enr.StudentID),
          suggestedClassId: customTargetClassMap[enr.StudentID] ?? suggestedNext,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => {
        if (sourceClassFilter !== 'all' && item.enrollment.ClassID !== sourceClassFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.student.Name.toLowerCase().includes(q) ||
            (item.student.NameArabic || '').toLowerCase().includes(q) ||
            item.enrollment.RollNo.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [
    enrollments,
    allStudents,
    sourceYear,
    sourceSemester,
    targetYear,
    targetSemester,
    sourceClassFilter,
    searchQuery,
    customTargetClassMap,
  ]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllEligible = () => {
    const eligible = sourceEnrolledStudents
      .filter((item) => !item.alreadyInTarget)
      .map((item) => item.student.StudentID);
    if (eligible.length === 0) return;
    const allSelected = eligible.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : eligible);
  };

  const handleAddCustomTargetYear = () => {
    const trimmed = newTargetYearInput.trim();
    if (!trimmed) return;
    addAcademicYear(trimmed);
    setTargetYear(trimmed);
    setNewTargetYearInput('');
    setBanner({ type: 'success', text: `Academic year "${trimmed}" added and selected as target.` });
  };

  const handlePromoteSelected = () => {
    if (!canManage) return;
    if (selectedIds.length === 0) {
      setBanner({ type: 'error', text: 'Please select at least one student to enroll/promote.' });
      return;
    }
    if (sourceYear === targetYear && sourceSemester === targetSemester) {
      setBanner({
        type: 'error',
        text: 'Source and target academic year & semester cannot be identical.',
      });
      return;
    }

    const targetMap: Record<number, number> = {};
    for (const item of sourceEnrolledStudents) {
      if (selectedIds.includes(item.student.StudentID)) {
        targetMap[item.student.StudentID] = item.suggestedClassId;
      }
    }

    const res = DataStore.promoteStudentsBatch({
      studentIds: selectedIds,
      fromAcademicYear: sourceYear,
      fromSemester: sourceSemester,
      toAcademicYear: targetYear,
      toSemester: targetSemester,
      enrollBothSemesters,
      targetClassMap: targetMap,
      autoAdvanceGrade: true,
      createTuitionLedgers,
    });

    setSelectedIds([]);
    loadData();
    setBanner({
      type: 'success',
      text: `Enrolled ${res.enrolledCount} student(s) into ${targetYear} (${targetSemester} Sem). Previous ${sourceYear} records, grades, and receipts remain preserved!`,
    });
  };

  const handleCreateAndEnrollNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !newStudentForm.Name.trim() || !newStudentForm.RollNo.trim()) return;

    const created = DataStore.saveStudent(
      {
        ...newStudentForm,
        ClassID: Number(newStudentForm.ClassID),
        IdNumber: `STD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        AdmissionDate: new Date().toISOString().split('T')[0],
      },
      {
        academicYear: targetYear,
        semester: targetSemester,
        enrollBothSemesters,
      }
    );

    setNewStudentForm({
      Name: '',
      NameArabic: '',
      RollNo: '',
      Gender: 'Male',
      Tribe: 'Maranao',
      Nationality: 'Filipino',
      ClassID: classes[0]?.ClassID || 1,
      MobileNumber: '',
      Address: '',
    });
    loadData();
    setBanner({
      type: 'success',
      text: `Registered & enrolled ${created.Name} into ${targetYear} (${targetSemester} Semester).`,
    });
  };

  const historyFilteredStudents = useMemo(() => {
    if (!historySearch.trim()) return allStudents;
    const q = historySearch.toLowerCase();
    return allStudents.filter(
      (s) =>
        s.Name.toLowerCase().includes(q) ||
        (s.NameArabic || '').toLowerCase().includes(q) ||
        s.RollNo.toLowerCase().includes(q)
    );
  }, [allStudents, historySearch]);

  const activeHistoryStudent = useMemo(() => {
    if (selectedHistoryStudentId) {
      return allStudents.find((s) => s.StudentID === selectedHistoryStudentId) || null;
    }
    return historyFilteredStudents[0] || null;
  }, [allStudents, historyFilteredStudents, selectedHistoryStudentId]);

  const activeStudentHistoryRecords = useMemo(() => {
    if (!activeHistoryStudent) return [];
    return enrollments
      .filter((e) => e.StudentID === activeHistoryStudent.StudentID)
      .sort((a, b) => {
        if (a.AcademicYear !== b.AcademicYear) return b.AcademicYear.localeCompare(a.AcademicYear);
        return b.Semester.localeCompare(a.Semester);
      });
  }, [enrollments, activeHistoryStudent]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ArrowRightLeft className="w-7 h-7 text-[#126b38]" />
            <span>Academic Year Enrollment & Promotion</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Enroll or promote students into a new academic year & semester while preserving all previous year data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAcademicYear(targetYear);
              setSemester(targetSemester);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#126b38] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer transition-colors"
          >
            Switch Portal View to {targetYear} ({targetSemester} Sem)
          </button>
        </div>
      </div>

      {/* Data Preservation Guarantee Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-extrabold">
            Previous Academic Year Data Preservation (حفظ بيانات السنوات السابقة)
          </p>
          <p className="text-emerald-800">
            Enrolling or promoting students into a new academic year (e.g. <strong>{targetYear}</strong>) creates a
            separate enrollment record and a fresh tuition ledger for that year. All prior academic year
            enrollments, grades, attendance logs, and payment receipts remain safely archived and viewable whenever
            you switch back using the top Academic Year & Semester switcher.
          </p>
        </div>
      </div>

      {banner && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#dfd4b8] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('promote')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'promote'
              ? 'bg-[#126b38] text-white shadow-xs'
              : 'bg-white border border-[#dfd4b8] text-slate-700 hover:bg-[#f8f5ec]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Promote / Re-Enroll Existing Students</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new-student')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'new-student'
              ? 'bg-[#126b38] text-white shadow-xs'
              : 'bg-white border border-[#dfd4b8] text-slate-700 hover:bg-[#f8f5ec]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#126b38] text-white shadow-xs'
              : 'bg-white border border-[#dfd4b8] text-slate-700 hover:bg-[#f8f5ec]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Multi-Year Enrollment History ({enrollments.length})</span>
        </button>
      </div>

      {/* TAB 1: PROMOTE / RE-ENROLL */}
      {activeTab === 'promote' && (
        <div className="space-y-5">
          {/* Source & Target Configuration */}
          <div className="bg-white rounded-2xl border border-[#dfd4b8] p-5 shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Source Term */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                  1. Source (Previous Academic Year)
                </span>
                <span className="text-[11px] font-bold text-slate-500">Data stays untouched</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Academic Year</label>
                  <select
                    value={sourceYear}
                    onChange={(e) => {
                      setSourceYear(e.target.value);
                      setSelectedIds([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester</label>
                  <select
                    value={sourceSemester}
                    onChange={(e) => {
                      setSourceSemester(e.target.value as SemesterType);
                      setSelectedIds([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    <option value="1st">1st Semester (الفصل الأول)</option>
                    <option value="2nd">2nd Semester (الفصل الثاني)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Term */}
            <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  2. Target (New Academic Year)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-suggests next grade
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">Target Academic Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">Target Semester</label>
                  <select
                    value={targetSemester}
                    onChange={(e) => setTargetSemester(e.target.value as SemesterType)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold"
                  >
                    <option value="1st">1st Semester (الفصل الأول)</option>
                    <option value="2nd">2nd Semester (الفصل الثاني)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrollBothSemesters}
                    onChange={(e) => setEnrollBothSemesters(e.target.checked)}
                    className="rounded border-emerald-400 text-emerald-700"
                  />
                  <span>Enroll for full year (1st &amp; 2nd Semesters)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createTuitionLedgers}
                    onChange={(e) => setCreateTuitionLedgers(e.target.checked)}
                    className="rounded border-emerald-400 text-emerald-700"
                  />
                  <span>Open fresh tuition ledger</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTargetYearInput}
                  onChange={(e) => setNewTargetYearInput(e.target.value)}
                  placeholder="Add new year e.g. SY 2027-2028"
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTargetYear}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer"
                >
                  + Add Year
                </button>
              </div>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-white rounded-2xl border border-[#dfd4b8] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or Roll No..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <select
                value={sourceClassFilter}
                onChange={(e) =>
                  setSourceClassFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="all">All Source Classes ({sourceEnrolledStudents.length})</option>
                {classes.map((c) => (
                  <option key={c.ClassID} value={c.ClassID}>
                    [{c.Department.toUpperCase()}] {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={handlePromoteSelected}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#126b38] hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-extrabold shadow-xs cursor-pointer transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>
                  Enroll Selected ({selectedIds.length}) into {targetYear}
                </span>
              </button>
            )}
          </div>

          {/* Student List Table */}
          <div className="bg-white rounded-2xl border border-[#dfd4b8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f5ec] border-b border-[#dfd4b8] text-slate-700 font-extrabold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAllEligible}
                        className="p-1 rounded hover:bg-[#dfd4b8]/60 cursor-pointer"
                        title="Select all eligible students"
                      >
                        <CheckSquare className="w-4 h-4 text-[#126b38]" />
                      </button>
                    </th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Previous Class ({sourceYear})</th>
                    <th className="p-3">Target Class ({targetYear})</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourceEnrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No students found in {sourceYear} ({sourceSemester} Semester).
                      </td>
                    </tr>
                  ) : (
                    sourceEnrolledStudents.map((item) => {
                      const prevCls = classMap.get(item.enrollment.ClassID);
                      const isChecked = selectedIds.includes(item.student.StudentID);
                      return (
                        <tr key={item.enrollment.id} className="hover:bg-slate-50/80">
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelect(item.student.StudentID)}
                              className="p-1 rounded hover:bg-slate-200 cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#126b38]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {item.enrollment.RollNo}
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900">{item.student.Name}</div>
                            {item.student.NameArabic && (
                              <div className="text-[11px] text-slate-500 font-serif" dir="rtl">
                                {item.student.NameArabic}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
                              {prevCls ? `${prevCls.ClassName} (${prevCls.Department})` : `Class #${item.enrollment.ClassID}`}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={item.suggestedClassId}
                              onChange={(e) =>
                                setCustomTargetClassMap((prev) => ({
                                  ...prev,
                                  [item.student.StudentID]: Number(e.target.value),
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-emerald-950 text-xs"
                            >
                              {classes.map((c) => (
                                <option key={c.ClassID} value={c.ClassID}>
                                  [{c.Department.toUpperCase()}] {c.ClassName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            {item.alreadyInTarget ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                                <CheckCircle2 className="w-3 h-3" /> Enrolled in {targetYear}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                                Ready to Enroll
                              </span>
                            )}
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
      )}

      {/* TAB 2: REGISTER NEW STUDENT */}
      {activeTab === 'new-student' && (
        <div className="bg-white rounded-2xl border border-[#dfd4b8] p-6 shadow-xs max-w-3xl">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#126b38]" />
            <span>
              Register &amp; Enroll New Student for {targetYear} ({targetSemester} Semester)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Creates the student profile, enrolls them into {targetYear}, and initializes their tuition ledger.
          </p>

          <form onSubmit={handleCreateAndEnrollNewStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Student Name (English) *</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.Name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, Name: e.target.value })}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Student Name (Arabic)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={newStudentForm.NameArabic}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, NameArabic: e.target.value })}
                  placeholder="طارق المنصور"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-serif"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.RollNo}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, RollNo: e.target.value })}
                  placeholder="e.g. R201"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                <select
                  value={newStudentForm.Gender}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, Gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Assigned Class *</label>
                <select
                  value={newStudentForm.ClassID}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, ClassID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.ClassID} value={c.ClassID}>
                      [{c.Department.toUpperCase()}] {c.ClassName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={newStudentForm.MobileNumber}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, MobileNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={newStudentForm.Address}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, Address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#126b38] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
            >
              Enroll Student in {targetYear} ({targetSemester} Sem)
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MULTI-YEAR ENROLLMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Student Selector */}
          <div className="bg-white rounded-2xl border border-[#dfd4b8] p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {historyFilteredStudents.map((s) => {
                const isSelected = activeHistoryStudent?.StudentID === s.StudentID;
                return (
                  <button
                    key={s.StudentID}
                    type="button"
                    onClick={() => setSelectedHistoryStudentId(s.StudentID)}
                    className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#126b38] text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{s.Name}</div>
                    <div className={`text-[11px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Roll: {s.RollNo}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Multi-Year Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#dfd4b8] p-5 shadow-xs space-y-4">
            {activeHistoryStudent ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-[#126b38]">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{activeHistoryStudent.Name}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Roll No: {activeHistoryStudent.RollNo} &bull; {activeStudentHistoryRecords.length} term record(s)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeStudentHistoryRecords.map((rec) => {
                    const cls = classMap.get(rec.ClassID);
                    const yearGradesCount = grades.filter(
                      (g) =>
                        g.StudentID === activeHistoryStudent.StudentID &&
                        (g.AcademicYear || 'SY 2025-2026') === rec.AcademicYear
                    ).length;
                    const yearLedger = ledgers.find(
                      (l) => l.StudentID === activeHistoryStudent.StudentID && l.AcademicYear === rec.AcademicYear
                    );
                    const paidPeriods = yearLedger
                      ? Object.values(yearLedger.Payments).filter((p) => p.isPaid).length
                      : 0;

                    return (
                      <div
                        key={rec.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#126b38]" />
                            <span className="font-black text-sm text-slate-900">{rec.AcademicYear}</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                              {rec.Semester === '1st' ? '1st Semester' : '2nd Semester'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                rec.Status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {rec.Status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">
                            Class: {cls ? `${cls.ClassName} (${cls.Department})` : `Class #${rec.ClassID}`}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Enrolled: {rec.EnrolledAt} {rec.Remarks ? `• ${rec.Remarks}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="font-bold text-slate-700">{yearGradesCount} Grades</span>
                          </div>
                          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-amber-700" />
                            <span className="font-bold text-slate-700">{paidPeriods}/6 Dawr Paid</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a student to view their multi-year enrollment history.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
