'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  GradingPeriod,
  StudentGradeItem,
  StudentItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  GradingCriteria,
  SubjectTeacherItem,
} from '@/lib/types';
import StudentGradeView from './StudentGradeView';
import ExcelGradeEditor from './ExcelGradeEditor';
import {
  ClipboardList,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Check,
  X,
  FileSpreadsheet,
  GraduationCap,
  Eye,
  BookOpen,
  Users,
  ChevronLeft,
  ArrowRight,
  School,
  Sparkles,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Hourglass,
} from 'lucide-react';
import { toHindiNumerals } from '@/lib/numerals';

export default function GradesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [criteria, setCriteria] = useState<GradingCriteria[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);

  // Active user and permissions
  const currentUser = AuthService.getSession();
  const role = currentUser?.role;
  const isMudir = role === 'mudir';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';

  // Selected teacher for Admin / Mudir inspector
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(
    currentUser?.linkedId || 2
  );

  // Active teacher profile
  const activeTeacherId = isTeacher
    ? currentUser?.linkedId || 2
    : selectedTeacherId;

  const currentTeacher = useMemo(() => {
    return (
      teachers.find(t => t.TeacherID === activeTeacherId) ||
      teachers.find(t => t.Email === currentUser?.email) ||
      teachers[1] ||
      teachers[0]
    );
  }, [teachers, activeTeacherId, currentUser]);

  // Mode switcher for Admin / Mudir
  const [staffTab, setStaffTab] = useState<'teacher-view' | 'matrix' | 'preview'>(
    isTeacher ? 'teacher-view' : 'teacher-view'
  );
  const [previewStudentId, setPreviewStudentId] = useState<number>(1);

  // Selected subject for Excel Grade Editing
  const [selectedEditSubject, setSelectedEditSubject] = useState<{
    subject: SubjectItem;
    classItem: ClassItem;
  } | null>(null);

  // Filters for Global Matrix view (Admin / Mudir)
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<GradingPeriod>('1st');

  // Criteria Manager Modal
  const [isManagingCriteria, setIsManagingCriteria] = useState(false);
  const [newCritName, setNewCritName] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(20);

  // Grade Entry Modal (Matrix View legacy)
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [scoresInput, setScoresInput] = useState<Record<string, number>>({});
  const [finalGradeInput, setFinalGradeInput] = useState<string>('0');
  const [statusSpecial, setStatusSpecial] = useState<'NUMERIC' | 'INC' | 'DRP'>('NUMERIC');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    const subs = DataStore.getSubjects();
    const stds = DataStore.getStudents();
    const tchs = DataStore.getTeachers();
    const stMap = DataStore.getSubjectTeachers();
    setClasses(cls);
    setSubjects(subs);
    setStudents(stds);
    setTeachers(tchs);
    setGrades(DataStore.getGrades());
    setCriteria(DataStore.getCriteria());
    setSubjectTeachers(stMap);

    if (stds.length > 0 && previewStudentId === 1) {
      setPreviewStudentId(stds[0].StudentID);
    }

    if (cls.length > 0 && selectedClassId === 0) {
      setSelectedClassId(cls[0].ClassID);
      const matchedSubs = subs.filter(s => s.ClassID === cls[0].ClassID);
      if (matchedSubs.length > 0) setSelectedSubjectId(matchedSubs[0].SubjectID);
    }
  };

  const gradingPeriods: GradingPeriod[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

  // TEACHER'S ASSIGNED SUBJECTS ONLY:
  // The teacher only can see the list of their subjects that they are teaching.
  const teacherSubjectsList = useMemo(() => {
    if (!currentTeacher) return [];

    const assigned: { subject: SubjectItem; classItem: ClassItem }[] = [];

    // 1. Direct match in SubjectTeacherItem mappings
    const mappings = subjectTeachers.filter(
      st => st.TeacherID === currentTeacher.TeacherID
    );

    mappings.forEach(m => {
      const sub = subjects.find(
        s => s.SubjectID === m.SubjectID && s.ClassID === m.ClassID
      );
      const cls = classes.find(c => c.ClassID === m.ClassID);
      if (sub && cls) {
        if (
          !assigned.some(
            a =>
              a.subject.SubjectID === sub.SubjectID &&
              a.classItem.ClassID === cls.ClassID
          )
        ) {
          assigned.push({ subject: sub, classItem: cls });
        }
      }
    });

    // 2. Fallback to guarantee teacher always sees assigned subjects (e.g. Fiqh, Tawheed, Quran)
    if (assigned.length === 0) {
      const fallbackSubIds = [1, 2, 3, 16];
      const found = subjects.filter(s => fallbackSubIds.includes(s.SubjectID));
      found.forEach(sub => {
        const cls = classes.find(c => c.ClassID === sub.ClassID);
        if (cls) {
          assigned.push({ subject: sub, classItem: cls });
        }
      });
    }

    return assigned;
  }, [subjectTeachers, currentTeacher, subjects, classes]);

  // Students in selected class (for Matrix View)
  const classStudents = students.filter(s => s.ClassID === selectedClassId);
  const classSubjects = subjects.filter(s => s.ClassID === selectedClassId);

  const getStudentGrade = (studentId: number) => {
    return grades.find(
      g =>
        g.StudentID === studentId &&
        g.ClassID === selectedClassId &&
        g.SubjectID === selectedSubjectId &&
        g.Period === selectedPeriod
    );
  };

  const openGradeModal = (student: StudentItem) => {
    setEditingStudent(student);
    const existing = getStudentGrade(student.StudentID);

    if (existing) {
      setScoresInput(existing.CriteriaScores || {});
      if (existing.FinalGrade === 'INC') {
        setStatusSpecial('INC');
        setFinalGradeInput('INC');
      } else if (existing.FinalGrade === 'DRP') {
        setStatusSpecial('DRP');
        setFinalGradeInput('DRP');
      } else {
        setStatusSpecial('NUMERIC');
        setFinalGradeInput(existing.FinalGrade.toString());
      }
    } else {
      const initScores: Record<string, number> = {};
      criteria.forEach(c => (initScores[c.id] = 85));
      setScoresInput(initScores);
      setStatusSpecial('NUMERIC');
      setFinalGradeInput('85');
    }
  };

  const calculateWeighted = (scores: Record<string, number>) => {
    let total = 0;
    let totalWeight = 0;
    criteria.forEach(c => {
      const val = scores[c.id] || 0;
      total += (val * c.weight) / 100;
      totalWeight += c.weight;
    });
    return Math.round(totalWeight > 0 ? (total / totalWeight) * 100 : total);
  };

  const handleScoreChange = (critId: string, val: number) => {
    const updated = { ...scoresInput, [critId]: val };
    setScoresInput(updated);
    if (statusSpecial === 'NUMERIC') {
      const calculated = calculateWeighted(updated);
      setFinalGradeInput(calculated.toString());
    }
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    let finalVal: number | 'INC' | 'DRP' = 0;
    if (statusSpecial === 'INC') finalVal = 'INC';
    else if (statusSpecial === 'DRP') finalVal = 'DRP';
    else {
      const num = parseFloat(finalGradeInput);
      finalVal = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
    }

    const currentTeacherId = currentUser?.linkedId || 2;

    const res = DataStore.saveGrade({
      id: `grd-${editingStudent.StudentID}-${selectedSubjectId}-${selectedPeriod}`,
      StudentID: editingStudent.StudentID,
      ClassID: selectedClassId,
      SubjectID: selectedSubjectId,
      TeacherID: currentTeacherId,
      Period: selectedPeriod,
      CriteriaScores: scoresInput,
      FinalGrade: finalVal,
      GradedAt: new Date().toISOString(),
      IsLocked: false,
    });

    if (!res.success) {
      setMsg({ type: 'error', text: res.error || 'Failed to save grade.' });
      return;
    }

    setMsg({ type: 'success', text: `Grade saved for ${editingStudent.Name} (${selectedPeriod} Dawr).` });
    setEditingStudent(null);
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleRequestUnlock = (gradeId: string) => {
    DataStore.requestGradeUnlock(gradeId);
    loadData();
    setMsg({ type: 'success', text: 'Unlock request submitted to the Principal (Mudir).' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleGrantUnlock = (gradeId: string, grant: boolean, hours?: number) => {
    DataStore.grantGradeUnlock(gradeId, grant, hours);
    loadData();
    setMsg({
      type: 'success',
      text: grant
        ? `تم منح تمديد مهلة التعديل للأستاذ (${toHindiNumerals(hours || 24)} ساعة) بنجاح.`
        : 'تم رفض طلب تعديل الدرجة.',
    });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleGrantSubjectUnlock = (
    classId: number,
    subjectId: number,
    period: GradingPeriod,
    hours: number,
    grant: boolean
  ) => {
    if (grant) {
      DataStore.grantSubjectUnlock(classId, subjectId, period, hours);
      setMsg({
        type: 'success',
        text: `تمت الموافقة وتمديد مهلة التعديل لجميع درجات المادة لمدة (${toHindiNumerals(hours)} ساعة) بنجاح!`,
      });
    } else {
      DataStore.lockSubjectNow(classId, subjectId, period);
      setMsg({
        type: 'error',
        text: 'تم رفض طلب التمديد وقفل سجل المادة.',
      });
    }
    loadData();
    setTimeout(() => setMsg(null), 3500);
  };

  // Pending Unlock Requests from Teachers
  const pendingUnlockRequests = useMemo(() => {
    const map = new Map<
      string,
      { classId: number; subjectId: number; period: GradingPeriod; teacherId: number; count: number }
    >();

    grades
      .filter(g => g.UnlockRequested)
      .forEach(g => {
        const key = `${g.ClassID}-${g.SubjectID}-${g.Period}`;
        if (!map.has(key)) {
          map.set(key, {
            classId: g.ClassID,
            subjectId: g.SubjectID,
            period: g.Period,
            teacherId: g.TeacherID,
            count: 1,
          });
        } else {
          map.get(key)!.count++;
        }
      });

    const list: {
      key: string;
      classId: number;
      subjectId: number;
      period: GradingPeriod;
      teacherId: number;
      count: number;
      className: string;
      subjectName: string;
      teacherName: string;
    }[] = [];

    map.forEach(val => {
      const cls = classes.find(c => c.ClassID === val.classId);
      const sub = subjects.find(s => s.SubjectID === val.subjectId);
      const tch = teachers.find(t => t.TeacherID === val.teacherId);
      list.push({
        key: `${val.classId}-${val.subjectId}-${val.period}`,
        classId: val.classId,
        subjectId: val.subjectId,
        period: val.period,
        teacherId: val.teacherId,
        count: val.count,
        className: cls?.ClassName || `الصف ${val.classId}`,
        subjectName: sub?.SubjectArabic || sub?.SubjectClass || `المادة ${val.subjectId}`,
        teacherName: tch?.NameArabic || tch?.Name || `أستاذ #${val.teacherId}`,
      });
    });

    return list;
  }, [grades, classes, subjects, teachers]);

  // Criteria Management
  const handleAddCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    DataStore.saveCriteria({
      id: `crit-${Date.now()}`,
      name: newCritName.trim(),
      weight: Number(newCritWeight),
    });

    setNewCritName('');
    loadData();
  };

  const handleDeleteCriteria = (id: string) => {
    DataStore.deleteCriteria(id);
    loadData();
  };

  // Excel Export for Matrix View
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const dataToExport = classStudents.map(s => {
      const g = getStudentGrade(s.StudentID);
      const row: any = {
        'Roll No': s.RollNo,
        'Student Name': s.Name,
        'Period': `${selectedPeriod} Dawr`,
        'Final Grade': g ? g.FinalGrade : 'Ungraded',
        'Status': g ? (g.IsLocked ? 'Locked' : 'Open') : 'Pending',
      };
      criteria.forEach(c => {
        row[c.name] = g?.CriteriaScores?.[c.id] ?? '-';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedPeriod}_Grades`);
    XLSX.writeFile(workbook, `JMAA_Grades_${selectedPeriod}_Grading.xlsx`);
  };

  // Excel Import for Matrix View
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const importedData: any[] = XLSX.utils.sheet_to_json(ws);

        let count = 0;
        importedData.forEach(row => {
          const rollNo = row['Roll No'] || row['RollNo'] || row['Roll'];
          const finalG = row['Final Grade'] || row['FinalGrade'] || row['Grade'];
          const matchedStudent = students.find(s => s.RollNo.toLowerCase() === String(rollNo).toLowerCase());

          if (matchedStudent && finalG !== undefined) {
            let processedFinal: number | 'INC' | 'DRP' = 0;
            if (String(finalG).toUpperCase() === 'INC') processedFinal = 'INC';
            else if (String(finalG).toUpperCase() === 'DRP') processedFinal = 'DRP';
            else processedFinal = parseFloat(finalG) || 0;

            DataStore.saveGrade({
              id: `grd-${matchedStudent.StudentID}-${selectedSubjectId}-${selectedPeriod}`,
              StudentID: matchedStudent.StudentID,
              ClassID: selectedClassId,
              SubjectID: selectedSubjectId,
              TeacherID: currentUser?.linkedId || 2,
              Period: selectedPeriod,
              CriteriaScores: {},
              FinalGrade: processedFinal,
              GradedAt: new Date().toISOString(),
              IsLocked: false,
            });
            count++;
          }
        });

        loadData();
        setMsg({ type: 'success', text: `Successfully imported ${count} student grades from Excel!` });
        setTimeout(() => setMsg(null), 3500);
      } catch {
        setMsg({ type: 'error', text: 'Error reading Excel file. Please ensure valid format.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  // If student is logged in, immediately show the Student Grade View
  const isStudent = role === 'student';
  const myStudentProfile = students.find(
    s =>
      s.StudentID === currentUser?.linkedId ||
      s.RollNo.toLowerCase() === currentUser?.name?.toLowerCase() ||
      s.Email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
      s.RollNo.toLowerCase() === 'r101'
  ) || students[0];

  if (isStudent && myStudentProfile) {
    return (
      <StudentGradeView
        student={myStudentProfile}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        subjectTeachers={subjectTeachers}
        grades={grades}
        allStudents={students}
      />
    );
  }

  // Selected student for preview by faculty
  const previewStudent = students.find(s => s.StudentID === previewStudentId) || students[0];

  return (
    <div className="space-y-6">
      {/* Mode Switcher Bar (Faculty & Admin Navigation) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {/* 1. Teacher View (Subjects & Excel Grade Entry) */}
          <button
            type="button"
            onClick={() => {
              setStaffTab('teacher-view');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              staffTab === 'teacher-view'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>كشف الأستاذ وجدول الإكسل (Teacher's View & Excel)</span>
          </button>

          {/* 2. Global Matrix (Admin / Mudir only) */}
          {(isAdmin || isMudir) && (
            <button
              type="button"
              onClick={() => {
                setStaffTab('matrix');
                setSelectedEditSubject(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                staffTab === 'matrix'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-blue-400" />
              <span>الكشف الشامل للمدرسة (Global Matrix)</span>
            </button>
          )}

          {/* 3. Student Report Card Preview */}
          <button
            type="button"
            onClick={() => {
              setStaffTab('preview');
              setSelectedEditSubject(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              staffTab === 'preview'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>معاينة شهادة الطالب (Student Report Card)</span>
          </button>
        </div>

        {/* Teacher Switcher (for Admin/Mudir inspecting teacher views) */}
        {staffTab === 'teacher-view' && (isAdmin || isMudir) && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">View As Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={e => {
                setSelectedTeacherId(Number(e.target.value));
                setSelectedEditSubject(null);
              }}
              className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.TeacherID} value={t.TeacherID}>
                  {t.NameArabic || t.Name} &bull; {t.Name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Student Selector for Preview Mode */}
        {staffTab === 'preview' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Select Student:</span>
            <select
              value={previewStudentId}
              onChange={e => setPreviewStudentId(Number(e.target.value))}
              className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none cursor-pointer"
            >
              {students.map(s => {
                const cls = classes.find(c => c.ClassID === s.ClassID);
                return (
                  <option key={s.StudentID} value={s.StudentID}>
                    {s.NameArabic || s.Name} ({s.RollNo}) &bull; {cls?.ClassName}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. TEACHER'S VIEW: SUBJECT LIST & EXCEL GRADE EDITOR                      */}
      {/* ========================================================================= */}
      {staffTab === 'teacher-view' && (
        selectedEditSubject ? (
          /* When a subject is selected for editing -> Show Excel Grade Editor */
          <ExcelGradeEditor
            subject={selectedEditSubject.subject}
            classItem={selectedEditSubject.classItem}
            students={students.filter(s => s.ClassID === selectedEditSubject.classItem.ClassID)}
            allGrades={grades}
            teacherSubjects={teacherSubjectsList}
            onSelectSubject={(sub, cls) => setSelectedEditSubject({ subject: sub, classItem: cls })}
            onBack={() => setSelectedEditSubject(null)}
            teacherId={currentTeacher?.TeacherID || 2}
            isMudir={isMudir}
            onSaveSuccess={loadData}
          />
        ) : (
          /* When no subject is currently selected -> Display ONLY the list of subjects teaching */
          <div className="space-y-6">
            {/* Teacher Greeting & Identity Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {currentTeacher?.ProfilePic ? (
                    <img src={currentTeacher.ProfilePic} alt={currentTeacher.Name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-8 h-8 text-amber-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                      Faculty / أستاذ
                    </span>
                    <span className="text-xs text-emerald-300 font-medium">
                      JMAA-MoritAko &bull; جامعة منيب الكزبري العربية
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                    <span>{currentTeacher?.Name || 'Ryan Madid'}</span>
                    {currentTeacher?.NameArabic && (
                      <span className="text-amber-300 font-serif font-normal text-lg" dir="rtl">
                        ({currentTeacher.NameArabic})
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    قائمة المواد المسندة للتدريس &bull; يمكنك اختيار المادة لتعديل درجات الطلاب مباشرة بنظام الإكسل
                  </p>
                </div>
              </div>

              {/* Quick Summary Counts */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-950/60 border border-emerald-700/50 rounded-2xl px-4 py-2.5 text-center">
                  <span className="text-[11px] text-emerald-300 block font-bold uppercase">المواد المسندة</span>
                  <span className="text-xl font-black text-white font-mono">{teacherSubjectsList.length}</span>
                </div>
                <div className="bg-slate-950/60 border border-emerald-700/50 rounded-2xl px-4 py-2.5 text-center">
                  <span className="text-[11px] text-amber-300 block font-bold uppercase">إجمالي الطلاب</span>
                  <span className="text-xl font-black text-white font-mono">
                    {teacherSubjectsList.reduce((acc, curr) => {
                      const count = students.filter(s => s.ClassID === curr.classItem.ClassID).length;
                      return acc + count;
                    }, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Subjects Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-800" />
                  <span>المواد الدراسية المسندة للأستاذ (My Teaching Subjects)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  اختر أي مادة لعرض وتعديل درجات الطلاب بالاتجاه من اليمين إلى اليسار (RTL) وبطريقة الإكسل.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {teacherSubjectsList.length} مادة دراسية
              </span>
            </div>

            {/* Subject Cards Grid */}
            {teacherSubjectsList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">لا توجد مواد مسندة لهذا الأستاذ حالياً</h3>
                <p className="text-xs text-slate-500">يرجى التواصل مع إدارة المدرسة لإسناد المواد والصفوف في النظام.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teacherSubjectsList.map(({ subject, classItem }) => {
                  const enrolledCount = students.filter(s => s.ClassID === classItem.ClassID).length;

                  // Count graded students for Dawr 1
                  const gradedCount = students.filter(s => {
                    return grades.some(
                      g =>
                        g.StudentID === s.StudentID &&
                        g.SubjectID === subject.SubjectID &&
                        g.ClassID === classItem.ClassID &&
                        g.Period === '1st' &&
                        g.FinalGrade !== undefined &&
                        g.FinalGrade !== null
                    );
                  }).length;

                  return (
                    <div
                      key={`${subject.SubjectID}-${classItem.ClassID}`}
                      className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                    >
                      {/* Card Header */}
                      <div className="space-y-2">
                        {/* Arabic Tag & Semester */}
                        <div className="flex items-center justify-between" dir="rtl">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#b79e55] text-slate-950 font-serif">
                            مرحلة: {classItem.Level || classItem.ClassName}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 font-sans uppercase">
                            [{classItem.Department.toUpperCase()}]
                          </span>
                        </div>

                        {/* Subject Title */}
                        <div className="pt-2 text-right" dir="rtl">
                          <h3 className="text-xl font-black text-slate-950 font-serif group-hover:text-emerald-950 transition-colors">
                            {subject.SubjectArabic || subject.SubjectClass}
                          </h3>
                          <span className="text-xs text-slate-600 font-sans font-medium block" dir="ltr">
                            {subject.SubjectClass} {subject.SubjectCode && `(${subject.SubjectCode})`}
                          </span>
                        </div>

                        {/* Class Info */}
                        <div className="text-xs text-slate-700 bg-white/70 rounded-xl p-2.5 border border-[#cfc39f] space-y-1 text-right" dir="rtl">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">الصف الدراسي:</span>
                            <span className="font-bold text-slate-900">{classItem.ClassName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">عدد الطلاب المسجلين:</span>
                            <span className="font-mono font-bold text-slate-900">{enrolledCount} طالب</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">حالة الرصد (دور 1):</span>
                            <span className={`font-bold ${gradedCount === enrolledCount && enrolledCount > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {toHindiNumerals(gradedCount)} / {toHindiNumerals(enrolledCount)} مرصود
                            </span>
                          </div>
                          {(() => {
                            const d1Grades = grades.filter(
                              g =>
                                g.SubjectID === subject.SubjectID &&
                                g.ClassID === classItem.ClassID &&
                                g.Period === '1st' &&
                                g.FinalGrade !== undefined &&
                                g.FinalGrade !== null
                            );
                            const defHours = DataStore.getGradeEditWindowHours();
                            let cStatus: 'unsubmitted' | 'editable' | 'locked' = 'unsubmitted';
                            let cHoursLeft = 0;
                            if (d1Grades.length > 0) {
                              const check = DataStore.checkGradeLock(d1Grades[0]);
                              if (check.isLocked) {
                                cStatus = 'locked';
                              } else {
                                cStatus = 'editable';
                                cHoursLeft = Math.ceil(check.remainingMs / 3600000);
                              }
                            }

                            return (
                              <div className="flex items-center justify-between pt-0.5 border-t border-slate-100">
                                <span className="text-slate-500 font-medium">مهلة التعديل (دور 1):</span>
                                {cStatus === 'locked' ? (
                                  <span className="font-bold text-red-700 inline-flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-md">
                                    <Lock className="w-3 h-3 text-red-600" /> مقفل (انتهت المهلة)
                                  </span>
                                ) : cStatus === 'editable' ? (
                                  <span className="font-bold text-emerald-700 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    <Unlock className="w-3 h-3 text-emerald-600" /> متاح ({toHindiNumerals(cHoursLeft)}س)
                                  </span>
                                ) : (
                                  <span className="font-bold text-amber-800 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 text-amber-600" /> {toHindiNumerals(defHours)}س بعد الحفظ
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Prominent Action Button: Option to Edit Grade (Matches Green Pill Button in Screenshot) */}
                      <div className="pt-2 border-t border-[#c4b68e]/80 flex items-center justify-between">
                        {(() => {
                          const d1Grades = grades.filter(
                            g =>
                              g.SubjectID === subject.SubjectID &&
                              g.ClassID === classItem.ClassID &&
                              g.Period === '1st' &&
                              g.FinalGrade !== undefined &&
                              g.FinalGrade !== null
                          );
                          const isSubjectLocked = d1Grades.length > 0 && DataStore.checkGradeLock(d1Grades[0]).isLocked;

                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedEditSubject({ subject, classItem })}
                              className={`w-full py-2.5 px-5 text-white font-extrabold text-sm rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 group-hover:shadow-md ${
                                isSubjectLocked
                                  ? 'bg-[#832626] hover:bg-[#6c1d1d]'
                                  : 'bg-[#187d44] hover:bg-[#136838]'
                              }`}
                            >
                              {isSubjectLocked ? (
                                <>
                                  <Lock className="w-4 h-4 text-red-200" />
                                  <span>معاينة وطلب تمديد (Locked)</span>
                                </>
                              ) : (
                                <>
                                  <Edit className="w-4 h-4 text-emerald-200" />
                                  <span>تعديل الدرجات (Edit Grade)</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 2. STUDENT VIEW PREVIEW (معاينة كشف درجات الطالب)                         */}
      {/* ========================================================================= */}
      {staffTab === 'preview' && previewStudent && (
        <StudentGradeView
          student={previewStudent}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          subjectTeachers={subjectTeachers}
          grades={grades}
          allStudents={students}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. GLOBAL SCHOOL MATRIX (Visible to Admin & Mudir)                         */}
      {/* ========================================================================= */}
      {staffTab === 'matrix' && (isAdmin || isMudir) && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-emerald-800" />
                <span>الكشف الشامل للدرجات (Global 6-Dawr Matrix)</span>
              </h1>
              <p className="text-sm text-slate-500">
                استعراض درجات المدرسة وإدارتها لجميع الصفوف والأدوار.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportToExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => setIsManagingCriteria(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Grading Criteria</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          {msg && (
            <div
              className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {msg.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Principal / Admin Grade Lock Controls & Settings Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0 text-amber-300 mt-0.5">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>إعدادات مهلة تعديل الدرجات المسموحة (Grade Edit Window Settings)</span>
                  <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    صلاحية الإدارة العليا
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  المهلة الزمنية الممنوحة تلقائياً للأساتذة للتعديل بعد أول اعتماد وحفظ للدرجات. يُقفل السجل آلياً عند انقضاء الوقت.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 flex-shrink-0">
              <span className="text-xs font-bold text-slate-300">المهلة الافتراضية:</span>
              <select
                value={DataStore.getGradeEditWindowHours()}
                onChange={e => {
                  const h = Number(e.target.value);
                  DataStore.setGradeEditWindowHours(h);
                  loadData();
                  setMsg({
                    type: 'success',
                    text: `تم تحديث مهلة تعديل الدرجات الافتراضية لتصبح (${toHindiNumerals(h)} ساعة) بنجاح.`,
                  });
                  setTimeout(() => setMsg(null), 3000);
                }}
                className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
              >
                <option value={6}>{toHindiNumerals(6)} ساعات (6 Hours)</option>
                <option value={12}>{toHindiNumerals(12)} ساعة (12 Hours)</option>
                <option value={24}>{toHindiNumerals(24)} ساعة (24 Hours - Default)</option>
                <option value={48}>{toHindiNumerals(48)} ساعة (48 Hours - 2 Days)</option>
                <option value={72}>{toHindiNumerals(72)} ساعة (72 Hours - 3 Days)</option>
                <option value={168}>{toHindiNumerals(168)} ساعة (7 Days - 1 Week)</option>
              </select>
            </div>
          </div>

          {/* Pending Unlock Requests Panel */}
          {pendingUnlockRequests.length > 0 && (
            <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-2 border-amber-500 rounded-2xl p-5 shadow-lg text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-200">
                    طلبات فتح مهلة تعديل الدرجات المعلقة من الأساتذة ({toHindiNumerals(pendingUnlockRequests.length)} طلب)
                  </h3>
                </div>
                <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  بانتظار قرار المدير
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                طلب الأساتذة التالية أسماؤهم تمديد مهلة التعديل لدرجات الصفوف والمواد المقفلة:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {pendingUnlockRequests.map(req => (
                  <div
                    key={req.key}
                    className="bg-slate-900/90 border border-amber-600/50 rounded-xl p-3 flex flex-col justify-between gap-3 text-right"
                    dir="rtl"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>{req.teacherName}</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">{req.period} Dawr</span>
                      </div>
                      <div className="text-sm font-extrabold text-white mt-1">
                        {req.subjectName} &bull; {req.className}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        عدد الدرجات المقفلة المطلوب فتحها: {toHindiNumerals(req.count)} درجات
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleGrantSubjectUnlock(req.classId, req.subjectId, req.period, 24, true)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        تمديد ٢٤ ساعة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrantSubjectUnlock(req.classId, req.subjectId, req.period, 48, true)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        ٤٨ س
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrantSubjectUnlock(req.classId, req.subjectId, req.period, 0, false)}
                        className="px-2.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selector Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const cid = Number(e.target.value);
                  setSelectedClassId(cid);
                  const subs = subjects.filter(s => s.ClassID === cid);
                  if (subs.length > 0) setSelectedSubjectId(subs[0].SubjectID);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {classes.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>
                    [{c.Department.toUpperCase()}] {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {classSubjects.map(s => (
                  <option key={s.SubjectID} value={s.SubjectID}>{s.SubjectClass}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Examination Period (Dawr)</label>
              <div className="grid grid-cols-6 gap-1 bg-slate-100 p-1 rounded-lg">
                {gradingPeriods.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPeriod(p)}
                    className={`py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                      selectedPeriod === p
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grade Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Grading Sheet &bull; {selectedPeriod} Dawr Examination
                </h2>
                <p className="text-xs text-slate-500">
                  Grading scale: 0 to 100, INC (Incomplete), DRP (Dropped).
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {classStudents.length} Students Enrolled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    {criteria.map(c => (
                      <th key={c.id} className="py-3 px-3 text-center">
                        {c.name} ({c.weight}%)
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">Final Score</th>
                    <th className="py-3 px-4 text-center">Lock Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={criteria.length + 5} className="text-center py-8 text-slate-400">
                        No students found in this class.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map(s => {
                      const g = getStudentGrade(s.StudentID);
                      const lockCheck = DataStore.checkGradeLock(g);
                      const isLocked = lockCheck.isLocked;

                      return (
                        <tr key={s.StudentID} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{s.RollNo}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {s.Name}
                            {s.NameArabic && <span className="text-xs text-amber-700 font-serif block font-normal">{s.NameArabic}</span>}
                          </td>

                          {criteria.map(c => (
                            <td key={c.id} className="py-3 px-3 text-center text-xs text-slate-600 font-mono">
                              {g?.CriteriaScores?.[c.id] ?? '-'}
                            </td>
                          ))}

                          <td className="py-3 px-4 text-center">
                            {g ? (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                  g.FinalGrade === 'INC'
                                    ? 'bg-amber-100 text-amber-800'
                                    : g.FinalGrade === 'DRP'
                                    ? 'bg-red-100 text-red-800'
                                    : Number(g.FinalGrade) >= 75
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {g.FinalGrade}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Ungraded</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center text-xs">
                            {g ? (
                              isLocked ? (
                                <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  <Lock className="w-3 h-3 text-red-600" /> مقفل (انتهت المهلة)
                                </span>
                              ) : lockCheck.remainingMs > 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Unlock className="w-3 h-3 text-emerald-600" /> متاح ({toHindiNumerals(Math.ceil(lockCheck.remainingMs / 3600000))}س)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Unlock className="w-3 h-3 text-emerald-600" /> متاح للتعديل
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right space-x-2">
                            {isMudir ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openGradeModal(s)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                >
                                  Inspect
                                </button>
                                {g && (isLocked || g.UnlockRequested) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleGrantUnlock(g.id, true, 24)}
                                    className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer inline-flex items-center gap-1 transition-colors"
                                    title="منح تمديد ٢٤ ساعة للمدرس"
                                  >
                                    <Unlock className="w-3 h-3" />
                                    <span>تمديد ٢٤س</span>
                                  </button>
                                ) : g && !isLocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleGrantUnlock(g.id, false)}
                                    className="px-2 py-1 text-xs font-bold rounded bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 cursor-pointer inline-flex items-center gap-1 transition-colors"
                                    title="قفل الدرجة فوراً"
                                  >
                                    <Lock className="w-3 h-3" />
                                    <span>قفل</span>
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <>
                                {isLocked ? (
                                  <button
                                    type="button"
                                    onClick={() => g && handleRequestUnlock(g.id)}
                                    disabled={g?.UnlockRequested}
                                    className="px-2.5 py-1 text-xs font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-800 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{g?.UnlockRequested ? 'Requested' : 'Request Edit'}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openGradeModal(s)}
                                    className="px-3 py-1 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer shadow-xs"
                                  >
                                    {g ? 'Edit Grade' : 'Enter Grade'}
                                  </button>
                                )}
                              </>
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

      {/* Grade Entry Dialog (Matrix View legacy) */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  {selectedPeriod} Dawr Examination
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{editingStudent.Name}</h3>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Grade Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusSpecial('NUMERIC');
                      setFinalGradeInput(calculateWeighted(scoresInput).toString());
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      statusSpecial === 'NUMERIC' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Numeric (0-100)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusSpecial('INC');
                      setFinalGradeInput('INC');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      statusSpecial === 'INC' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    INC (Incomplete)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusSpecial('DRP');
                      setFinalGradeInput('DRP');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      statusSpecial === 'DRP' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    DRP (Dropped)
                  </button>
                </div>
              </div>

              {statusSpecial === 'NUMERIC' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Evaluation Breakdown
                  </span>
                  {criteria.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-700 font-medium">
                        {c.name} ({c.weight}%):
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isMudir}
                        value={scoresInput[c.id] ?? 0}
                        onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center font-mono font-bold bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Final Dawr Grade Score
                </label>
                <input
                  type="text"
                  disabled={isMudir || statusSpecial !== 'NUMERIC'}
                  value={finalGradeInput}
                  onChange={(e) => setFinalGradeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-extrabold text-center bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {!isMudir && (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow cursor-pointer"
                  >
                    Confirm & Save Grade
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Criteria Management Modal */}
      {isManagingCriteria && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Custom Grading Criteria</h3>
              <button onClick={() => setIsManagingCriteria(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCriteria} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Criteria Name</label>
                <input
                  type="text"
                  required
                  value={newCritName}
                  onChange={(e) => setNewCritName(e.target.value)}
                  placeholder="e.g. Oral Memorization (تسميع شفهي)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Weight Percentage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newCritWeight}
                  onChange={(e) => setNewCritWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Add Criteria
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2 max-h-48 overflow-y-auto">
              {criteria.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="text-slate-500 ml-2">({c.weight}%)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCriteria(c.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete Criteria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
