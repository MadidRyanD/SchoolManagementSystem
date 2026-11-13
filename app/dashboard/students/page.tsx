'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { StudentItem, ClassItem } from '@/lib/types';
import {
  GRADE_DEFINITIONS,
  GradeDefinition,
  getArabicClassName,
  getGradeCode,
  sortStudentsByName,
  parseStudentsExcel,
  downloadSampleImportTemplate,
  exportGradeToExcel,
  exportAllGradesToExcel,
} from '@/lib/studentExcel';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  Filter,
  User,
  Calendar,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  ChevronDown,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRightLeft,
  CheckSquare,
  Square,
  Users,
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Permissions
  const currentUser = AuthService.getSession();
  const isAdmin = currentUser?.role === 'admin';
  const isMudir = currentUser?.role === 'mudir';
  const canManage = isAdmin || isMudir;

  // Grade Filter (Picture 2 tabs)
  // 'all' or code like 'ب 1', 'ب 2', '1 م', '1 ث', '1 ك-ت', etc.
  const [selectedGradeCode, setSelectedGradeCode] = useState<string>('all');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Search & Secondary Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<'all' | '5-days' | '2-days'>('all');
  const [sortBy, setSortBy] = useState<'arabic' | 'english' | 'roll'>('arabic');

  // Multiple Selection States
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Bulk Edit Form fields
  const [bulkEditFields, setBulkEditFields] = useState({
    applyClassID: false,
    ClassID: 1,
    applyTribe: false,
    Tribe: 'Maranao',
    applyGender: false,
    Gender: 'Male',
    applyAddress: false,
    Address: '',
    applyAdmissionDate: false,
    AdmissionDate: new Date().toISOString().split('T')[0],
  });

  // Modal States
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Excel Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImport, setParsedImport] = useState<{
    students: Array<Omit<StudentItem, 'StudentID'>>;
    unmatchedCount: number;
    detectedGrades: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    Name: '',
    NameArabic: '',
    RollNo: '',
    IdNumber: '',
    ClassID: 1,
    Gender: 'Male',
    Tribe: 'Maranao',
    Nationality: 'Filipino',
    DOB: '',
    MobileNumber: '',
    Email: '',
    Address: '',
    AdmissionDate: new Date().toISOString().split('T')[0],
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    setClasses(cls);
    setStudents(DataStore.getStudents());
    if (cls.length > 0 && formData.ClassID === 1) {
      setFormData((prev) => ({ ...prev, ClassID: cls[0].ClassID }));
    }
  };

  // Helper to get class name
  const getClassName = (cid: number) =>
    classes.find((c) => c.ClassID === cid)?.ClassName || `Class #${cid}`;
  const getClassDept = (cid: number) =>
    classes.find((c) => c.ClassID === cid)?.Department || '5-days';

  // Primary grade tabs (shown directly in the bar as in Picture 2)
  const primaryTabs = useMemo(() => {
    return GRADE_DEFINITIONS.filter((d) =>
      ['primary', 'intermediate', 'secondary', 'college'].includes(d.category)
    );
  }, []);

  // More grade tabs (for the ... dropdown)
  const moreTabs = useMemo(() => {
    return GRADE_DEFINITIONS.filter((d) => d.category === 'other');
  }, []);

  // Filtered and Sorted Students
  const displayedStudents = useMemo(() => {
    return students
      .filter((s) => {
        const sClass = classes.find((c) => c.ClassID === s.ClassID);

        // Grade filter based on Picture 2 code
        if (selectedGradeCode !== 'all') {
          const matchedDef = GRADE_DEFINITIONS.find((d) => d.code === selectedGradeCode);
          if (matchedDef) {
            const matchesDef =
              sClass?.Level === matchedDef.level &&
              sClass?.YearGrade === matchedDef.yearGrade &&
              (sClass?.Department === '5-days' || matchedDef.category === 'other');
            const matchesId = s.ClassID === matchedDef.classId;
            if (!matchesDef && !matchesId) return false;
          }
        }

        // Department filter
        if (filterDepartment !== 'all' && sClass?.Department !== filterDepartment) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            s.Name.toLowerCase().includes(q) ||
            (s.NameArabic || '').toLowerCase().includes(q) ||
            s.RollNo.toLowerCase().includes(q) ||
            (s.IdNumber || '').toLowerCase().includes(q) ||
            (s.Tribe || '').toLowerCase().includes(q) ||
            (s.Address || '').toLowerCase().includes(q) ||
            getClassName(s.ClassID).toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'arabic') {
          const nameA = (a.NameArabic || a.Name || '').trim();
          const nameB = (b.NameArabic || b.Name || '').trim();
          return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
        } else if (sortBy === 'english') {
          return a.Name.localeCompare(b.Name);
        } else {
          // roll
          const numA = parseInt(a.RollNo.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.RollNo.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        }
      });
  }, [students, classes, selectedGradeCode, filterDepartment, searchQuery, sortBy]);

  // Multiple selection helpers
  const visibleStudentIds = useMemo(() => displayedStudents.map((s) => s.StudentID), [displayedStudents]);

  const allVisibleSelected = useMemo(() => {
    if (visibleStudentIds.length === 0) return false;
    return visibleStudentIds.every((id) => selectedStudentIds.includes(id));
  }, [visibleStudentIds, selectedStudentIds]);

  const toggleSelectStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !visibleStudentIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleStudentIds])));
    }
  };

  // Selected students objects for modals
  const selectedStudentsList = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.StudentID));
  }, [students, selectedStudentIds]);

  // Bulk Delete action
  const handleBulkDelete = () => {
    if (!canManage || selectedStudentIds.length === 0) return;
    DataStore.deleteStudentsBatch(selectedStudentIds);
    setMsg({
      text: `تم حذف ${selectedStudentIds.length} طالب محدد بنجاح من النظام.`,
      type: 'success',
    });
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    loadData();
    setTimeout(() => setMsg(null), 3500);
  };

  // Bulk Edit submit
  const handleBulkEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || selectedStudentIds.length === 0) return;

    const updates: Partial<StudentItem> = {};
    if (bulkEditFields.applyClassID) updates.ClassID = Number(bulkEditFields.ClassID);
    if (bulkEditFields.applyTribe && bulkEditFields.Tribe.trim()) updates.Tribe = bulkEditFields.Tribe.trim();
    if (bulkEditFields.applyGender) updates.Gender = bulkEditFields.Gender;
    if (bulkEditFields.applyAddress && bulkEditFields.Address.trim()) updates.Address = bulkEditFields.Address.trim();
    if (bulkEditFields.applyAdmissionDate && bulkEditFields.AdmissionDate) updates.AdmissionDate = bulkEditFields.AdmissionDate;

    if (Object.keys(updates).length === 0) {
      setMsg({ text: 'يرجى تفعيل خيار واحد على الأقل لتطبيقه على الطلاب المحددين.', type: 'error' });
      return;
    }

    DataStore.updateStudentsBatch(selectedStudentIds, updates);
    setMsg({
      text: `تم تحديث بيانات ${selectedStudentIds.length} طالب بنجاح!`,
      type: 'success',
    });
    setSelectedStudentIds([]);
    setIsBulkEditModalOpen(false);
    loadData();
    setTimeout(() => setMsg(null), 3500);
  };

  // Export Selected Students Only
  const handleExportSelected = () => {
    if (selectedStudentsList.length === 0) return;
    exportGradeToExcel('الطلاب المحددون', selectedStudentsList, 'Selected_Students_Picture4.xlsx');
  };

  // Current selected grade info
  const selectedGradeInfo = useMemo(() => {
    if (selectedGradeCode === 'all') return null;
    return GRADE_DEFINITIONS.find((d) => d.code === selectedGradeCode) || null;
  }, [selectedGradeCode]);

  // Count students in a specific grade
  const getGradeStudentCount = (code: string) => {
    const def = GRADE_DEFINITIONS.find((d) => d.code === code);
    if (!def) return 0;
    return students.filter((s) => {
      const c = classes.find((cls) => cls.ClassID === s.ClassID);
      return (
        c &&
        c.Level === def.level &&
        c.YearGrade === def.yearGrade &&
        (c.Department === '5-days' || def.category === 'other')
      );
    }).length;
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setMsg({ text: 'لا تملك صلاحية: فقط المشرف والمدير يمكنهما تسجيل الطلاب.', type: 'error' });
      return;
    }
    if (!formData.Name.trim() && !formData.NameArabic.trim()) {
      setMsg({ text: 'اسم الطالب مطلوب (بالعربية أو بالإنجليزية).', type: 'error' });
      return;
    }
    if (!formData.RollNo.trim()) {
      setMsg({ text: 'رقم القيد (Roll Number) مطلوب.', type: 'error' });
      return;
    }

    const finalName = formData.Name.trim() || formData.NameArabic.trim();
    const finalNameAr = formData.NameArabic.trim() || formData.Name.trim();

    if (editingId) {
      DataStore.saveStudent({
        ...formData,
        Name: finalName,
        NameArabic: finalNameAr,
        StudentID: editingId,
        ClassID: Number(formData.ClassID),
      });
      setMsg({ text: 'تم تحديث بيانات الطالب بنجاح!', type: 'success' });
      setEditingId(null);
    } else {
      DataStore.saveStudent({
        ...formData,
        Name: finalName,
        NameArabic: finalNameAr,
        ClassID: Number(formData.ClassID),
      });
      setMsg({ text: 'تم تسجيل الطالب الجديد بنجاح في النظام!', type: 'success' });
    }

    resetForm();
    setIsEnrollModalOpen(false);
    loadData();
    setTimeout(() => setMsg(null), 3500);
  };

  const resetForm = () => {
    setEditingId(null);
    const maxRoll = students.reduce((max, s) => {
      const num = parseInt(s.RollNo.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);
    const nextRoll = `R${maxRoll + 1}`;

    setFormData({
      Name: '',
      NameArabic: '',
      RollNo: nextRoll,
      IdNumber: `STD-2026-${String(maxRoll + 1).padStart(3, '0')}`,
      ClassID: classes[0]?.ClassID || 1,
      Gender: 'Male',
      Tribe: 'Maranao',
      Nationality: 'Filipino',
      DOB: '',
      MobileNumber: '',
      Email: '',
      Address: '',
      AdmissionDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleOpenEnrollModal = () => {
    resetForm();
    if (selectedGradeInfo?.classId) {
      setFormData((prev) => ({ ...prev, ClassID: selectedGradeInfo.classId! }));
    }
    setIsEnrollModalOpen(true);
  };

  const handleEdit = (s: StudentItem) => {
    if (!canManage) return;
    setEditingId(s.StudentID);
    setFormData({
      Name: s.Name,
      NameArabic: s.NameArabic || '',
      RollNo: s.RollNo,
      IdNumber: s.IdNumber || '',
      ClassID: s.ClassID,
      Gender: s.Gender || 'Male',
      Tribe: s.Tribe || 'Maranao',
      Nationality: s.Nationality || 'Filipino',
      DOB: s.DOB || s.BirthDate || '',
      MobileNumber: s.MobileNumber || '',
      Email: s.Email || '',
      Address: s.Address || '',
      AdmissionDate: s.AdmissionDate || new Date().toISOString().split('T')[0],
    });
    setIsEnrollModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      setMsg({ text: 'لا تملك صلاحية: فقط المشرف والمدير يمكنهما حذف سجلات الطلاب.', type: 'error' });
      return;
    }
    const target = students.find((s) => s.StudentID === id);
    const displayName = target?.NameArabic || target?.Name;
    if (confirm(`هل أنت متأكد من حذف سجل الطالب (${displayName}) - رقم القيد: ${target?.RollNo}؟`)) {
      DataStore.deleteStudent(id);
      setSelectedStudentIds((prev) => prev.filter((item) => item !== id));
      setMsg({ text: 'تم حذف سجل الطالب بنجاح.', type: 'success' });
      loadData();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // Excel File Upload Handler (Picture 3 Template)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    try {
      const parsed = await parseStudentsExcel(file, classes, students);
      setParsedImport(parsed);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setMsg({ text: 'خطأ أثناء قراءة ملف إكسل. يرجى التأكد من مطابقة نموذج الصورة 3.', type: 'error' });
    }
  };

  const handleConfirmImport = () => {
    if (!parsedImport || parsedImport.students.length === 0) return;
    setIsImporting(true);

    try {
      DataStore.saveStudentsBatch(parsedImport.students);
      setMsg({
        text: `تم استيراد ${parsedImport.students.length} طالب بنجاح وفق نموذج إكسل!`,
        type: 'success',
      });
      loadData();
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedImport(null);
    } catch (err) {
      console.error(err);
      setMsg({ text: 'حدث خطأ أثناء حفظ بيانات الطلاب المستوردة.', type: 'error' });
    } finally {
      setIsImporting(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  // Excel Export Handler (Picture 4 Format)
  const handleExportCurrentGrade = () => {
    if (selectedGradeCode === 'all') {
      exportGradeToExcel('دليل جميع الطلاب المقيدين', displayedStudents, 'All_Enrolled_Students.xlsx');
    } else {
      const title = selectedGradeInfo?.nameAr || 'الطلاب المسجلين';
      exportGradeToExcel(title, displayedStudents);
    }
    setExportDropdownOpen(false);
  };

  const handleExportAllGradesWorkbook = () => {
    exportAllGradesToExcel(classes, students);
    setExportDropdownOpen(false);
  };

  // Color mapper for grade pill badges (Matching Picture 2 styling)
  const getPillStyle = (def: GradeDefinition, isActive: boolean) => {
    switch (def.category) {
      case 'primary': // Deep Purple
        return isActive
          ? 'bg-[#4a156e] text-white ring-2 ring-purple-300 font-extrabold shadow-md scale-105'
          : 'bg-[#6d28d9] text-white hover:bg-[#581c87]';
      case 'intermediate': // Peach / Warm Apricot
        return isActive
          ? 'bg-[#fbbf89] text-[#78350f] ring-2 ring-amber-500 font-extrabold shadow-md scale-105 border border-amber-400'
          : 'bg-[#fde2cb] text-[#84380f] border border-[#f5c6a1] hover:bg-[#fbd3b2]';
      case 'secondary': // Soft Mint Green
        return isActive
          ? 'bg-[#86efac] text-[#14532d] ring-2 ring-emerald-600 font-extrabold shadow-md scale-105 border border-emerald-400'
          : 'bg-[#dbf3d8] text-[#1e5822] border border-[#bee7ba] hover:bg-[#c9edc4]';
      case 'college': // Soft Baby Blue
        return isActive
          ? 'bg-[#93c5fd] text-[#1e3a8a] ring-2 ring-blue-600 font-extrabold shadow-md scale-105 border border-blue-400'
          : 'bg-[#d6e4f9] text-[#1b4372] border border-[#b7d0f3] hover:bg-[#c3d9f6]';
      default:
        return isActive
          ? 'bg-slate-700 text-white ring-2 ring-slate-400 font-extrabold shadow-md'
          : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200';
    }
  };

  return (
    <div dir="rtl" className="space-y-6 font-sans text-slate-800">
      {/* Upper Header: Title on Right, Enroll Button Next to Title, Actions on Left */}
      <div className="bg-white p-5 rounded-2xl border border-[#e2d8c3] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Right portion: Title & "Enroll New Student" Button placed right next to it */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                    دليل وبيانات الطلاب
                  </h1>
                  <span className="text-xs sm:text-sm text-slate-400 font-sans hidden sm:inline">
                    / Student Directory
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  إدارة وتسجيل الطلاب، تصنيف الصفوف، وتصدير واستيراد الكشوفات
                </p>
              </div>
            </div>

            {/* Task 1: "put the enroll new students to a button on the upper right portion next to the title" */}
            {canManage && (
              <button
                onClick={handleOpenEnrollModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow cursor-pointer active:scale-95 mr-2"
                title="تسجيل طالب جديد في النظام"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل طالب جديد</span>
                <span className="hidden md:inline font-sans text-xs opacity-90">(+ Enroll Student)</span>
              </button>
            )}

            {canManage ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> صلاحية الإدارة نشطة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                عرض فقط
              </span>
            )}
          </div>

          {/* Left portion: Excel Import, Export, and Template Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Template Button */}
            <button
              onClick={downloadSampleImportTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#f4f7f4] hover:bg-[#e7f0e7] text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="تحميل نموذج إكسل للاستيراد (مثل الصورة 3)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>نموذج إكسل (الصورة 3)</span>
            </button>

            {/* Excel Import Button */}
            {canManage && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
                title="استيراد ملف الطلاب من إكسل بمطابقة نموذج الصورة 3"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>استيراد من إكسل</span>
              </button>
            )}

            {/* Excel Export Dropdown (Picture 4 Format) */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#217346] hover:bg-[#1a5c38] text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
                title="تصدير كشف الطلاب إلى إكسل بنفس تنسيق الصورة 4"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير إلى إكسل (الصورة 4)</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {exportDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-right animate-in fade-in"
                  onMouseLeave={() => setExportDropdownOpen(false)}
                >
                  <button
                    onClick={handleExportCurrentGrade}
                    className="w-full text-right px-4 py-2.5 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-bold">تصدير الصف المعروض حالياً</p>
                      <p className="text-[10px] text-slate-500 font-sans">
                        {selectedGradeInfo ? selectedGradeInfo.nameAr : 'جميع الطلاب في هذا القسم'}
                      </p>
                    </div>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleExportAllGradesWorkbook}
                    className="w-full text-right px-4 py-2.5 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-bold">تصدير جميع الصفوف (مصنف كامل)</p>
                      <p className="text-[10px] text-slate-500 font-sans">
                        كل صف في ورقة مستقلة بتنسيق الصورة 4
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task 2 & Task 4: Grade Pills Bar (Picture 2: Grouped and sorted names based on grades, RTL layout) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              تصفية الطلاب حسب المرحلة والصف (مطابق للصورة 2):
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              إجمالي الطلاب المسجلين: <strong className="text-slate-700">{students.length}</strong>
            </span>
          </div>

          {/* Horizontal scrollable pills matching Picture 2 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {/* "All" Pill */}
            <button
              onClick={() => setSelectedGradeCode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedGradeCode === 'all'
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              الكل ({students.length})
            </button>

            {/* Primary, Intermediate, Secondary, College Pills (Picture 2) */}
            {primaryTabs.map((def) => {
              const isActive = selectedGradeCode === def.code;
              const count = getGradeStudentCount(def.code);
              return (
                <button
                  key={def.code}
                  onClick={() => setSelectedGradeCode(def.code)}
                  title={`${def.nameAr} - ${def.nameEn}`}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${getPillStyle(
                    def,
                    isActive
                  )}`}
                >
                  <span className="font-bold">{def.code}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full font-sans ${
                        def.category === 'primary'
                          ? 'bg-purple-900/40 text-purple-100'
                          : 'bg-black/10 text-current'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More (...) Dropdown for other classes & colleges */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  moreTabs.some((t) => t.code === selectedGradeCode)
                    ? 'bg-slate-800 text-white ring-2 ring-slate-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
                title="أقسام إضافية: كلية الشريعة، الدعوة، قسم اليومين"
              >
                <span>...</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-right"
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    أقسام وكليات أخرى
                  </div>
                  {moreTabs.map((def) => (
                    <button
                      key={def.code}
                      onClick={() => {
                        setSelectedGradeCode(def.code);
                        setMoreDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 cursor-pointer ${
                        selectedGradeCode === def.code ? 'bg-emerald-100/70 font-bold text-emerald-950' : 'text-slate-700'
                      }`}
                    >
                      <span>{def.nameAr}</span>
                      <span className="font-bold font-mono text-[11px] text-slate-500">{def.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2 border shadow-xs animate-in fade-in ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{msg.text}</span>
        </div>
      )}

      {/* Floating / Sticky Bulk Actions Toolbar (When multiple students are selected) */}
      {canManage && selectedStudentIds.length > 0 && (
        <div className="bg-[#124d2d] text-white p-3.5 sm:px-5 rounded-2xl shadow-lg border border-emerald-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center font-bold text-amber-300 shadow-2xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">
                  تم تحديد {selectedStudentIds.length} طالب
                </span>
                <span className="text-xs bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  {selectedStudentIds.length} / {students.length}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-0.5 font-sans">
                اختر إجراءً جماعياً لتطبيقه على جميع الطلاب المحددين دفعة واحدة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Edit Button */}
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow transition-all cursor-pointer active:scale-95"
              title="تعديل بيانات الطلاب المحددين (نقل صف، قبيلة، إلخ)"
            >
              <Edit className="w-3.5 h-3.5 text-slate-900" />
              <span>تعديل جماعي (Bulk Edit)</span>
            </button>

            {/* Bulk Delete Button */}
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow transition-all cursor-pointer active:scale-95"
              title="حذف جميع الطلاب المحددين من النظام"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف جماعي (Bulk Delete)</span>
            </button>

            {/* Export Selected */}
            <button
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-600"
              title="تصدير بيانات الطلاب المحددين فقط إلى إكسل بتنسيق الصورة 4"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير المحدد</span>
            </button>

            {/* Deselect All */}
            <button
              onClick={() => setSelectedStudentIds([])}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-700/60"
              title="إلغاء تحديد الكل"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء التحديد</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Student Directory Table (Full Width, RTL) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Top Toolbar: Active Title Banner & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-serif">
                {selectedGradeInfo ? selectedGradeInfo.nameAr : 'جميع الطلاب المقيدين في الدليل'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                {displayedStudents.length} طالب
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedGradeInfo
                ? `${selectedGradeInfo.nameEn} - مرتبين أبجدياً وفق أسماء الطلاب`
                : 'قائمة بجميع الطلاب مرتبين أبجدياً حسب المرحلة والصف'}
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، رقم القيد، القبيلة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 pl-3 py-1.5 text-xs border border-slate-300 rounded-lg w-48 sm:w-56 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-none cursor-pointer"
            >
              <option value="all">كافة الأقسام (5 أيام و يومين)</option>
              <option value="5-days">قسم 5 أيام (الصباحي)</option>
              <option value="2-days">قسم يومين (نهاية الأسبوع)</option>
            </select>

            {/* Sort Toggle (Task 2: sorted based on names) */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSortBy('arabic')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  sortBy === 'arabic' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ترتيب أبجدي عربي (أ - ي)"
              >
                أبجدي (أ - ي)
              </button>
              <button
                onClick={() => setSortBy('english')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  sortBy === 'english' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ترتيب أبجدي إنجليزي (A - Z)"
              >
                A - Z
              </button>
              <button
                onClick={() => setSortBy('roll')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  sortBy === 'roll' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ترتيب حسب رقم القيد"
              >
                رقم القيد
              </button>
            </div>
          </div>
        </div>

        {/* Students Table (RTL Layout with Multi-Select Checkboxes) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#f8f9fa] text-slate-700 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                {/* Select All Checkbox Column */}
                {canManage && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                      title="تحديد الكل في هذه الصفحة"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4 w-12 text-center">م</th>
                <th className="py-3.5 px-4 w-28">رقم القيد / ID</th>
                <th className="py-3.5 px-4">اسم الطالب (الاسم بالعربية والإنجليزية)</th>
                <th className="py-3.5 px-4">المرحلة والصف</th>
                <th className="py-3.5 px-4">القبيلة والتواصل</th>
                <th className="py-3.5 px-4">العنوان</th>
                {canManage && <th className="py-3.5 px-4 text-center w-24">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="text-center py-12 text-slate-400">
                    <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">لا يوجد طلاب مطابقين لمعايير البحث والتصفية</p>
                    <p className="text-xs text-slate-400 mt-1">
                      يمكنك تسجيل طلاب جدد أو استيرادهم من ملف إكسل مطابق لنموذج الصورة 3.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s, idx) => {
                  const sClass = classes.find((c) => c.ClassID === s.ClassID);
                  const gradeCode = sClass ? getGradeCode(sClass) : '';
                  const gradeTitleAr = sClass ? getArabicClassName(sClass) : '';
                  const isSelected = selectedStudentIds.includes(s.StudentID);

                  return (
                    <tr
                      key={s.StudentID}
                      className={`transition-colors cursor-default ${
                        isSelected
                          ? 'bg-emerald-50/80 font-medium'
                          : 'hover:bg-amber-50/40'
                      }`}
                    >
                      {/* Checkbox */}
                      {canManage && (
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(s.StudentID)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                          />
                        </td>
                      )}

                      {/* Serial Number (م) */}
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-xs text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Roll / Student ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                          {s.RollNo}
                        </span>
                        {s.IdNumber && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-1">
                            {s.IdNumber}
                          </span>
                        )}
                      </td>

                      {/* Student Name (Arabic & English) */}
                      <td className="py-3.5 px-4">
                        {s.NameArabic ? (
                          <p className="font-bold text-slate-900 font-serif text-base leading-tight">
                            {s.NameArabic}
                          </p>
                        ) : (
                          <p className="font-bold text-slate-900 text-sm leading-tight">{s.Name}</p>
                        )}
                        {s.Name && s.NameArabic && s.Name !== s.NameArabic && (
                          <p className="text-xs text-slate-500 mt-0.5 font-sans">{s.Name}</p>
                        )}
                      </td>

                      {/* Class & Department */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {gradeCode && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                              {gradeCode}
                            </span>
                          )}
                          <span className="font-bold text-xs text-slate-800">
                            {gradeTitleAr || getClassName(s.ClassID)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {getClassDept(s.ClassID) === '5-days' ? 'قسم 5 أيام' : 'قسم يومين'} ({getClassName(s.ClassID)})
                        </span>
                      </td>

                      {/* Tribe & Mobile */}
                      <td className="py-3.5 px-4 text-xs">
                        {s.Tribe && (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium inline-block">
                            {s.Tribe}
                          </span>
                        )}
                        {s.MobileNumber && (
                          <span className="text-slate-600 font-mono text-[11px] block mt-1 flex items-center gap-1" dir="ltr">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.MobileNumber}
                          </span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {s.Address || '—'}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-3.5 px-4 text-center space-x-1 space-x-reverse whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="تعديل بيانات الطالب"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.StudentID)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="حذف سجل الطالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-700 flex items-center justify-center shadow-xs">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-serif">
                    تعديل جماعي للطلاب المحددين (Bulk Edit)
                  </h2>
                  <p className="text-xs text-amber-100 font-sans">
                    تطبيق تغييرات مشتركة على {selectedStudentIds.length} طالب دفعة واحدة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkEditModalOpen(false)}
                className="p-1 rounded-lg text-amber-100 hover:bg-amber-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkEditSubmit} className="p-6 space-y-4 text-sm">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">ملاحظة:</span> قم بتفعيل المربع بجوار الحقل الذي ترغب بتعديله لجميع الطلاب المحددين. الحقول غير المفعلة لن تتغير.
              </div>

              {/* Selected Students Chips Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  الطلاب المشمولون بالتعديل ({selectedStudentsList.length} طالب):
                </label>
                <div className="max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
                  {selectedStudentsList.map((s) => (
                    <span
                      key={s.StudentID}
                      className="inline-flex items-center gap-1 bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded-md text-xs font-serif"
                    >
                      <span className="font-mono text-[10px] text-emerald-800 font-bold">{s.RollNo}</span>
                      <span>{s.NameArabic || s.Name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Field 1: Change Class / Transfer Grade */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={bulkEditFields.applyClassID}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, applyClassID: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>نقل الطلاب إلى صف / قسم آخر (Move to Class)</span>
                </label>

                {bulkEditFields.applyClassID && (
                  <select
                    value={bulkEditFields.ClassID}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, ClassID: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.ClassID} value={c.ClassID}>
                        {getArabicClassName(c)} — {c.ClassName} ({c.Department})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Field 2: Change Tribe */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={bulkEditFields.applyTribe}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, applyTribe: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>تحديث القبيلة (Update Tribe)</span>
                </label>

                {bulkEditFields.applyTribe && (
                  <input
                    type="text"
                    value={bulkEditFields.Tribe}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, Tribe: e.target.value })
                    }
                    placeholder="e.g. Maranao / مراناو"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>

              {/* Field 3: Change Gender */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={bulkEditFields.applyGender}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, applyGender: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>تحديث الجنس (Update Gender)</span>
                </label>

                {bulkEditFields.applyGender && (
                  <select
                    value={bulkEditFields.Gender}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, Gender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Male">ذكر (Male)</option>
                    <option value="Female">أنثى (Female)</option>
                  </select>
                )}
              </div>

              {/* Field 4: Change Address */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={bulkEditFields.applyAddress}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, applyAddress: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>تحديث العنوان (Update Address)</span>
                </label>

                {bulkEditFields.applyAddress && (
                  <input
                    type="text"
                    value={bulkEditFields.Address}
                    onChange={(e) =>
                      setBulkEditFields({ ...bulkEditFields, Address: e.target.value })
                    }
                    placeholder="e.g. Marawi City / مدينة مراوي"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="py-2.5 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  تطبيق التعديلات على {selectedStudentIds.length} طالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="px-6 py-4 bg-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-800 flex items-center justify-center shadow-xs">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-serif">
                    تأكيد حذف الطلاب المحددين (Bulk Delete)
                  </h2>
                  <p className="text-xs text-red-100 font-sans">
                    تحذير: هذا الإجراء سيحذف السجلات نهائياً
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1 rounded-lg text-red-100 hover:bg-red-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold">
                    أنت على وشك حذف {selectedStudentIds.length} طالب من دليل الطلاب.
                  </p>
                  <p className="mt-0.5 text-red-700">
                    لا يمكن التراجع عن هذه العملية بعد التأكيد.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  قائمة الطلاب المراد حذفهم:
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs font-sans">
                  {selectedStudentsList.map((s) => (
                    <div key={s.StudentID} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-bold font-serif text-slate-900">{s.NameArabic || s.Name}</p>
                        <p className="text-[11px] text-slate-400">{getClassName(s.ClassID)}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                        {s.RollNo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="py-2.5 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد حذف {selectedStudentIds.length} طالب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task 1: Enrollment & Edit Modal Dialog */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-serif">
                    {editingId ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}
                  </h2>
                  <p className="text-xs text-emerald-100 font-sans">
                    {editingId ? `تعديل السجل الأكاديمي للطالب رقم #${editingId}` : 'إدخال بيانات طالب جديد وتعيين الصف والقسم'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 rounded-lg text-emerald-100 hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name Arabic */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل (باللغة العربية) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.NameArabic}
                    onChange={(e) => setFormData({ ...formData, NameArabic: e.target.value })}
                    placeholder="مثال: طارق بن زياد"
                    dir="rtl"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Full Name English */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل (باللغة الإنجليزية)
                  </label>
                  <input
                    type="text"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    placeholder="e.g. Tariq Bin Ziyad"
                    dir="ltr"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roll Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم القيد (Roll Number) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.RollNo}
                    onChange={(e) => setFormData({ ...formData, RollNo: e.target.value })}
                    placeholder="e.g. R101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Student ID No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرقم الأكاديمي / الجامعي (Student ID No)
                  </label>
                  <input
                    type="text"
                    value={formData.IdNumber}
                    onChange={(e) => setFormData({ ...formData, IdNumber: e.target.value })}
                    placeholder="e.g. STD-2026-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Assigned Class & Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الصف والقسم الأكاديمي (Assigned Class & Department)
                </label>
                <select
                  value={formData.ClassID}
                  onChange={(e) => setFormData({ ...formData, ClassID: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.ClassID} value={c.ClassID}>
                      {getArabicClassName(c)} — {c.ClassName} ({c.Department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجنس (Gender)</label>
                  <select
                    value={formData.Gender}
                    onChange={(e) => setFormData({ ...formData, Gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Male">ذكر (Male)</option>
                    <option value="Female">أنثى (Female)</option>
                  </select>
                </div>

                {/* Tribe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القبيلة (Tribe)</label>
                  <input
                    type="text"
                    value={formData.Tribe}
                    onChange={(e) => setFormData({ ...formData, Tribe: e.target.value })}
                    placeholder="e.g. Maranao"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (Mobile)</label>
                  <input
                    type="text"
                    value={formData.MobileNumber}
                    onChange={(e) => setFormData({ ...formData, MobileNumber: e.target.value })}
                    placeholder="09123456789"
                    dir="ltr"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد (DOB)</label>
                  <input
                    type="date"
                    value={formData.DOB}
                    onChange={(e) => setFormData({ ...formData, DOB: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان السكني (Address)</label>
                <input
                  type="text"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="e.g. Marawi City / مدينة مراوي"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="py-2.5 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingId ? 'حفظ التعديلات' : 'تسجيل وتأكيد القيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 3: Excel Import Modal (Matching Picture 3 Template) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1f6e43] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-serif">
                    استيراد الطلاب من ملف إكسل (مطابق لنموذج الصورة 3)
                  </h2>
                  <p className="text-xs text-emerald-100 font-sans">
                    Import Student Records from Excel (Attribute & Value Format)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedImport(null);
                }}
                className="p-1 rounded-lg text-emerald-100 hover:bg-[#165332] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Instructions & Template Link */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-emerald-950 text-xs">
                    تنسيق النموذج المطلوب (مثل الصورة 3):
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    العمود الأول: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">Attribute</code> (اسم المرحلة/الصف)، والعمود الثاني: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">Value</code> (اسم الطالب).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleImportTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل النموذج الجاهز (.xlsx)</span>
                </button>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all"
              >
                <Upload className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  {importFile ? importFile.name : 'انقر لاختيار ملف إكسل من جهازك (.xlsx, .xls)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  يدعم ملفات جداول البيانات متضمنة أسماء الطلاب والمراحل الدراسية
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Parsed Preview Table */}
              {parsedImport && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      معاينة البيانات المكتشفة ({parsedImport.students.length} طالب):
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      الصفوف المكتشفة:{' '}
                      <strong className="text-emerald-800">
                        {parsedImport.detectedGrades.join(' ، ') || 'الصف الافتراضي'}
                      </strong>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5 w-10 text-center">م</th>
                          <th className="p-2.5">اسم الطالب (Value)</th>
                          <th className="p-2.5">المرحلة / الصف المطابق</th>
                          <th className="p-2.5 w-24">رقم القيد المقترح</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {parsedImport.students.slice(0, 50).map((std, i) => {
                          const cls = classes.find((c) => c.ClassID === std.ClassID);
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 text-center text-slate-400 font-mono">{i + 1}</td>
                              <td className="p-2 font-bold font-serif text-slate-900">{std.NameArabic}</td>
                              <td className="p-2 text-slate-700">{cls ? getArabicClassName(cls) : 'الصف الأول'}</td>
                              <td className="p-2 font-mono text-emerald-800 font-bold">{std.RollNo}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {parsedImport.students.length > 50 && (
                    <p className="text-[11px] text-slate-400 text-center">
                      (يتم عرض أول 50 سجلاً من أصل {parsedImport.students.length} طالب)
                    </p>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setParsedImport(null);
                  }}
                  className="py-2 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!parsedImport || parsedImport.students.length === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="py-2 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <span>جاري الحفظ...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>تأكيد واستيراد {parsedImport?.students.length || 0} طالب</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
