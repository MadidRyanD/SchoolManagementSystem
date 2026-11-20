'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { useAcademicTerm } from '@/lib/useAcademicTerm';
import {
  UserSession,
  GradingPeriod,
  DawrDeadlineItem,
  StudentGradeItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
  SubjectTeacherItem,
} from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Save,
  Lock,
  Unlock,
  Hourglass,
  CalendarCheck,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
  Search,
  Zap,
  BookOpen,
} from 'lucide-react';

const DAWRS_LIST: { id: GradingPeriod; nameAr: string; nameEn: string; semester: string }[] = [
  { id: '1st', nameAr: 'الدور الأول', nameEn: '1st Dawr', semester: 'الفصل الأول' },
  { id: '2nd', nameAr: 'الدور الثاني', nameEn: '2nd Dawr', semester: 'الفصل الأول' },
  { id: '3rd', nameAr: 'الدور الثالث', nameEn: '3rd Dawr', semester: 'الفصل الأول' },
  { id: '4th', nameAr: 'الدور الرابع', nameEn: '4th Dawr', semester: 'الفصل الثاني' },
  { id: '5th', nameAr: 'الدور الخامس', nameEn: '5th Dawr', semester: 'الفصل الثاني' },
  { id: '6th', nameAr: 'الدور السادس', nameEn: '6th Dawr', semester: 'الفصل الثاني' },
];

const formatLocalDateTimeInput = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export default function TimeLocksPage() {
  const { academicYear, semester } = useAcademicTerm();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Executive Time Lock & Deadline States
  const [editWindowHours, setEditWindowHours] = useState<number>(24);
  const [activeDawr, setActiveDawr] = useState<GradingPeriod>('1st');
  const [selectedDawrTab, setSelectedDawrTab] = useState<GradingPeriod>('1st');
  const [deadlines, setDeadlines] = useState<Partial<Record<GradingPeriod, DawrDeadlineItem>>>({});
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State for Overview Table rows
  const [editingDawr, setEditingDawr] = useState<GradingPeriod | null>(null);
  const [modalDraft, setModalDraft] = useState<DawrDeadlineItem>({
    period: '1st',
    deadlineIso: '2026-10-31T23:59',
    instructions: '',
    enforceLock: true,
  });
  const [modalSetActive, setModalSetActive] = useState<boolean>(false);

  // Subject-level Lock & Unlock Requests State
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);
  const [subjectFilterPeriod, setSubjectFilterPeriod] = useState<GradingPeriod>('1st');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [grantHoursMap, setGrantHoursMap] = useState<Record<string, number>>({});

  const loadAllData = () => {
    setEditWindowHours(DataStore.getGradeEditWindowHours());
    const currentActiveDawr = DataStore.getActiveGradingPeriod();
    setActiveDawr(currentActiveDawr);
    setDeadlines(DataStore.getGradeSubmissionDeadlines());
    setGrades(DataStore.getGradesForTerm());
    setClasses(DataStore.getClasses());
    setSubjects(DataStore.getSubjects());
    setTeachers(DataStore.getTeachers());
    setSubjectTeachers(DataStore.getSubjectTeachers());
  };

  useEffect(() => {
    const session = AuthService.getSession();
    setCurrentUser(session);
    if (session && (session.role === 'mudir' || session.role === 'admin')) {
      loadAllData();
      const targetDawr: GradingPeriod = semester === '2nd' ? '4th' : '1st';
      setSelectedDawrTab(targetDawr);
      setSubjectFilterPeriod(targetDawr);
    }
    setLoaded(true);
  }, [academicYear, semester]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setSettingsMsg({ type, text });
    setTimeout(() => setSettingsMsg(null), 4000);
  };

  const calculateRemainingText = (isoString?: string) => {
    if (!isoString) return { expired: false, text: 'لم يحدد موعد' };
    const target = new Date(isoString).getTime();
    if (isNaN(target)) return { expired: false, text: 'موعد غير صالح' };
    const diff = target - Date.now();
    if (diff <= 0) {
      return { expired: true, text: 'انتهت المهلة الرسمية' };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      expired: false,
      text: `${toHindiNumerals(days)} يوم و ${toHindiNumerals(hours)} ساعة و ${toHindiNumerals(mins)} دقيقة`,
    };
  };

  const isDawrCurrentlyLocked = (item?: DawrDeadlineItem) => {
    if (!item?.deadlineIso) return false;
    const enforce = item.enforceLock ?? true;
    if (!enforce) return false;
    const t = new Date(item.deadlineIso).getTime();
    return !isNaN(t) && Date.now() > t;
  };

  const updateCurrentDawrDeadline = (field: keyof DawrDeadlineItem, value: any) => {
    setDeadlines(prev => {
      const existing = prev[selectedDawrTab] || {
        period: selectedDawrTab,
        deadlineIso: '2026-10-31T23:59',
        instructions: '',
        enforceLock: true,
      };
      return {
        ...prev,
        [selectedDawrTab]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleSavePrincipalSettings = () => {
    const hours = Number(editWindowHours) > 0 ? Number(editWindowHours) : 24;
    DataStore.setGradeEditWindowHours(hours);
    DataStore.setActiveGradingPeriod(activeDawr);
    DataStore.setAllGradeSubmissionDeadlines(deadlines);
    loadAllData();
    showToast('success', 'تم حفظ وتطبيق مهلة تعديل الدرجات ومواعيد التسليم بنجاح على النظام!');
  };

  // Open Edit Modal from Overview Table
  const openEditDawrModal = (period: GradingPeriod) => {
    const existing = deadlines[period] || {
      period,
      deadlineIso: '2026-10-31T23:59',
      instructions: '',
      enforceLock: true,
    };
    setModalDraft({
      period,
      deadlineIso: existing.deadlineIso || '2026-10-31T23:59',
      instructions: existing.instructions || '',
      enforceLock: existing.enforceLock ?? true,
    });
    setModalSetActive(activeDawr === period);
    setEditingDawr(period);
  };

  const handleSaveModalDawr = () => {
    if (!editingDawr) return;
    const updatedDeadlines = {
      ...deadlines,
      [editingDawr]: modalDraft,
    };
    setDeadlines(updatedDeadlines);
    DataStore.setAllGradeSubmissionDeadlines(updatedDeadlines);

    if (modalSetActive) {
      setActiveDawr(editingDawr);
      DataStore.setActiveGradingPeriod(editingDawr);
    }

    setSelectedDawrTab(editingDawr);
    setEditingDawr(null);
    loadAllData();
    const dawrLabel = DAWRS_LIST.find(d => d.id === editingDawr)?.nameAr || editingDawr;
    showToast('success', `تم تحديث إعدادات وقفل ${dawrLabel} وحفظها بنجاح!`);
  };

  const handleQuickModalExtend = (hoursToAdd: number) => {
    const baseMs = Math.max(Date.now(), new Date(modalDraft.deadlineIso).getTime() || Date.now());
    const nextDate = new Date(baseMs + hoursToAdd * 3600 * 1000);
    setModalDraft(prev => ({
      ...prev,
      deadlineIso: formatLocalDateTimeInput(nextDate),
    }));
  };

  const handleQuickModalLockNow = () => {
    const pastDate = new Date(Date.now() - 60 * 1000);
    setModalDraft(prev => ({
      ...prev,
      deadlineIso: formatLocalDateTimeInput(pastDate),
      enforceLock: true,
    }));
  };

  // Pending Unlock Requests (from grades + subject overrides)
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

    DataStore.getSubjectUnlockOverrides()
      .filter(o => o.UnlockRequested)
      .forEach(o => {
        const key = `${o.ClassID}-${o.SubjectID}-${o.Period}`;
        if (!map.has(key)) {
          map.set(key, {
            classId: o.ClassID,
            subjectId: o.SubjectID,
            period: o.Period,
            teacherId: o.TeacherID || 0,
            count: 0,
          });
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
      const tch =
        teachers.find(t => t.TeacherID === val.teacherId) ||
        (() => {
          const st = subjectTeachers.find(
            x => x.ClassID === val.classId && x.SubjectID === val.subjectId
          );
          return st ? teachers.find(t => t.TeacherID === st.TeacherID) : undefined;
        })();
      list.push({
        key: `${val.classId}-${val.subjectId}-${val.period}`,
        classId: val.classId,
        subjectId: val.subjectId,
        period: val.period,
        teacherId: val.teacherId,
        count: val.count,
        className: cls?.ClassName || `Class #${val.classId}`,
        subjectName: sub?.SubjectArabic || sub?.SubjectClass || `Subject #${val.subjectId}`,
        teacherName: tch?.NameArabic || tch?.Name || 'أستاذ المادة',
      });
    });

    return list;
  }, [grades, classes, subjects, teachers, subjectTeachers]);

  const handleGrantSubjectUnlock = (
    classId: number,
    subjectId: number,
    period: GradingPeriod,
    hours: number,
    grant: boolean
  ) => {
    if (grant) {
      DataStore.grantSubjectUnlock(classId, subjectId, period, hours);
      showToast(
        'success',
        `تم منح فتح وتمديد مهلة التعديل لمدة (${toHindiNumerals(hours)} ساعة) بنجاح!`
      );
    } else {
      DataStore.lockSubjectNow(classId, subjectId, period);
      showToast('error', 'تم قفل سجل المادة ورفض طلب التمديد.');
    }
    loadAllData();
  };

  // Subject Lock Status rows for Section 3
  const subjectLockRows = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return subjects
      .map(sub => {
        const cls = classes.find(c => c.ClassID === sub.ClassID);
        const st = subjectTeachers.find(
          x => x.SubjectID === sub.SubjectID && x.ClassID === sub.ClassID
        );
        const tch = st ? teachers.find(t => t.TeacherID === st.TeacherID) : undefined;
        const subGrades = grades.filter(
          g =>
            g.SubjectID === sub.SubjectID &&
            g.ClassID === sub.ClassID &&
            g.Period === subjectFilterPeriod &&
            g.FinalGrade !== undefined &&
            g.FinalGrade !== null
        );
        const check = DataStore.checkGradeLock(
          subGrades[0],
          subjectFilterPeriod,
          sub.ClassID,
          sub.SubjectID
        );
        return {
          key: `${sub.ClassID}-${sub.SubjectID}`,
          subject: sub,
          classItem: cls,
          teacher: tch,
          gradeCount: subGrades.length,
          lockCheck: check,
        };
      })
      .filter(row => {
        if (!q) return true;
        const hay = `${row.subject.SubjectClass} ${row.subject.SubjectArabic || ''} ${
          row.classItem?.ClassName || ''
        } ${row.teacher?.Name || ''} ${row.teacher?.NameArabic || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [subjects, classes, subjectTeachers, teachers, grades, subjectFilterPeriod, subjectSearch]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict Role Guard: Principal (mudir) & Admin ONLY
  if (!currentUser || (currentUser.role !== 'mudir' && currentUser.role !== 'admin')) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white border-2 border-red-200 rounded-3xl p-8 text-center shadow-sm space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Access Restricted &bull; صلاحية مقيدة</h1>
        <p className="text-sm text-slate-600">
          This section (Grade Time Locks &amp; Deadlines) is restricted exclusively to the{' '}
          <strong>Principal (Mudir)</strong> and <strong>System Administrator</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Executive Container */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#cfc39f] shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#126b38] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black uppercase font-mono">
                  Principal &amp; Admin Only &bull; صلاحيات المدير والمشرف
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Grade Time Locks &amp; Submission Deadlines (إدارة المهل والأقفال)
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-serif" dir="rtl">
                التحكم الكامل بمهل تعديل الدرجات، مواعيد تسليم الأدوار الستة، وطلبات فتح الأقفال للمعلمين.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePrincipalSettings}
            className="px-6 py-2.5 bg-[#126b38] hover:bg-[#0e5830] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>حفظ وتطبيق المواعيد والمهل</span>
          </button>
        </div>

        {/* Feedback Toast */}
        {settingsMsg && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs border-2 ${
              settingsMsg.type === 'success'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                : 'bg-red-100 border-red-400 text-red-950'
            }`}
            dir="rtl"
          >
            {settingsMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
            )}
            <span>{settingsMsg.text}</span>
          </div>
        )}

        {/* Pending Teacher Unlock Requests */}
        {pendingUnlockRequests.length > 0 && (
          <div
            className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-2 border-amber-500 rounded-2xl p-5 shadow-lg text-white space-y-3"
            dir="rtl"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <h2 className="font-extrabold text-sm sm:text-base text-amber-200">
                  طلبات فتح مهلة تعديل الدرجات المعلقة ({toHindiNumerals(pendingUnlockRequests.length)} طلب)
                </h2>
              </div>
              <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                بانتظار موافقة المدير / المشرف
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {pendingUnlockRequests.map(req => (
                <div
                  key={req.key}
                  className="bg-slate-900/90 border border-amber-600/50 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-right"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>{req.teacherName}</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                        {req.period} Dawr
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1">
                      {req.subjectName} &bull; {req.className}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {req.count > 0
                        ? `عدد الدرجات المقفلة: ${toHindiNumerals(req.count)}`
                        : 'طلب فتح سجل غير مرصود بعد'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        handleGrantSubjectUnlock(req.classId, req.subjectId, req.period, 24, true)
                      }
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      تمديد ٢٤ ساعة
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleGrantSubjectUnlock(req.classId, req.subjectId, req.period, 48, true)
                      }
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      ٤٨ س
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleGrantSubjectUnlock(req.classId, req.subjectId, req.period, 0, false)
                      }
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

        {/* 1. Post-Submission Edit Window */}
        <div
          className="bg-white rounded-2xl p-5 border border-[#cfc39f] shadow-xs space-y-4 text-right"
          dir="rtl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 font-serif">
                  ١. مهلة تعديل الدرجات بعد الاعتماد (Post-Submission Edit Window)
                </h2>
                <p className="text-xs text-slate-500 font-serif">
                  المدة المتاحة للأستاذ لتعديل درجات المادة بعد أول اعتماد قبل قفل السجل تلقائياً
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-slate-600">المهلة الحالية:</span>
              <span className="text-sm font-black text-[#126b38] font-mono">
                {toHindiNumerals(editWindowHours)} ساعة ({editWindowHours}h)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر مهلة جاهزة أو اكتب عدداً مخصصاً بالساعات:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { hours: 6, label: '٦ ساعات (6h)' },
                { hours: 12, label: '١٢ ساعة (12h)' },
                { hours: 24, label: '٢٤ ساعة (يوم - الافتراضي)' },
                { hours: 48, label: '٤٨ ساعة (يومان)' },
                { hours: 72, label: '٧٢ ساعة (٣ أيام)' },
                { hours: 168, label: '١٦٨ ساعة (أسبوع كامل)' },
              ].map(preset => (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => setEditWindowHours(preset.hours)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editWindowHours === preset.hours
                      ? 'bg-[#126b38] text-white shadow-sm ring-2 ring-amber-400 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              <div className="flex items-center gap-1.5 mr-auto">
                <span className="text-xs font-bold text-slate-600">أو مخصص:</span>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={editWindowHours}
                  onChange={e => setEditWindowHours(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 px-2 py-1 text-center font-mono font-bold text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-600">ساعة</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
            <Hourglass className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>آلية عمل مهلة التعديل:</strong> بمجرد قيام الأستاذ بحفظ واعتماد السجل لأول مرة، ينطلق عداد تنازلي مدته{' '}
              <strong className="text-[#126b38]">({toHindiNumerals(editWindowHours)} ساعة)</strong> يظهر في شاشته. عند انتهائها، يقفل السجل تلقائياً ولا يمكن فتح التعديل إلا بطلب رسمي من الأستاذ يوافق عليه المدير أو المشرف.
            </div>
          </div>
        </div>

        {/* 2. Deadlines per Dawr + Overview Table with Edit Button */}
        <div
          className="bg-white rounded-2xl p-5 border border-[#cfc39f] shadow-xs space-y-5 text-right"
          dir="rtl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#126b38] flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 font-serif">
                  ٢. مواعيد تسليم الدرجات الرسمية للكادر التعليمي (Deadlines per Dawr)
                </h2>
                <p className="text-xs text-slate-500 font-serif">
                  تحديد التاريخ والوقت النهائي المعتمد لتسليم كل دور وإدارة حالة القفل (مقفل / غير مقفل)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">الدور النشط حالياً بالمدرسة:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300">
                {DAWRS_LIST.find(d => d.id === activeDawr)?.nameAr || activeDawr}
              </span>
            </div>
          </div>

          {/* Dawr Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {DAWRS_LIST.map(d => {
              const isSelected = selectedDawrTab === d.id;
              const isActive = activeDawr === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDawrTab(d.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#126b38] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{d.nameAr}</span>
                  <span className="text-[10px] font-mono opacity-80">({d.nameEn})</span>
                  {isActive && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white animate-pulse"
                      title="الدور الحالي النشط"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Dawr Configuration Form */}
          {(() => {
            const currentDawrItem = deadlines[selectedDawrTab] || {
              period: selectedDawrTab,
              deadlineIso: '2026-10-31T23:59',
              instructions: '',
              enforceLock: true,
            };
            const dawrMeta = DAWRS_LIST.find(d => d.id === selectedDawrTab)!;
            const remaining = calculateRemainingText(currentDawrItem.deadlineIso);

            return (
              <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-black text-slate-900 font-serif">
                      إعدادات {dawrMeta.nameAr} ({dawrMeta.semester})
                    </span>
                    {activeDawr === selectedDawrTab ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> هو الدور النشط حالياً
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveDawr(selectedDawrTab)}
                        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        تعيين كدور نشط حالياً للمدرسة
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">الوقت المتبقي للمعلمين:</span>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${
                        remaining.expired
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      }`}
                    >
                      <Hourglass className="w-3.5 h-3.5" />
                      <span>{remaining.text}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الموعد النهائي لتسليم الدرجات (Deadline Date &amp; Time) *
                    </label>
                    <input
                      type="datetime-local"
                      value={currentDawrItem.deadlineIso?.substring(0, 16) || '2026-10-31T23:59'}
                      onChange={e => updateCurrentDawrDeadline('deadlineIso', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-sans font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      سياسة إغلاق الرصد عند انتهاء الموعد
                    </label>
                    <label className="h-[42px] px-3.5 border border-slate-300 rounded-xl bg-white flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-800">
                        قفل إجباري عند حلول الموعد (Enforce Hard Lock)
                      </span>
                      <input
                        type="checkbox"
                        checked={currentDawrItem.enforceLock ?? true}
                        onChange={e => updateCurrentDawrDeadline('enforceLock', e.target.checked)}
                        className="w-4 h-4 text-[#126b38] rounded-md focus:ring-emerald-600 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    توجيهات وتعليمات المدير للكادر التعليمي لهذا الدور (Teacher Directives)
                  </label>
                  <textarea
                    rows={2}
                    value={currentDawrItem.instructions || ''}
                    onChange={e => updateCurrentDawrDeadline('instructions', e.target.value)}
                    placeholder="مثال: يرجى مراجعة وتدقيق درجات الدور الأول بعناية..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-serif bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                  />
                </div>
              </div>
            );
          })()}

          {/* All Dawrs Overview Table with Lock Status & Edit Button */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="block text-xs font-black text-slate-800 font-serif">
                ملخص جدول المواعيد وحالة الأقفال لجميع الأدوار الستة (Overview Table):
              </span>
              <span className="text-[11px] text-slate-500">
                اضغط على زر <strong>تعديل</strong> بجانب أي دور لتغيير الموعد أو فتح/قفل الدور مباشرة
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">الدور</th>
                    <th className="py-2.5 px-3">الفصل</th>
                    <th className="py-2.5 px-3">الموعد النهائي المحدد</th>
                    <th className="py-2.5 px-3">الوقت المتبقي</th>
                    <th className="py-2.5 px-3">حالة القفل</th>
                    <th className="py-2.5 px-3">القفل الإجباري</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {DAWRS_LIST.map(d => {
                    const item = deadlines[d.id];
                    const rem = calculateRemainingText(item?.deadlineIso);
                    const isAct = activeDawr === d.id;
                    const lockedNow = isDawrCurrentlyLocked(item);

                    let formattedDate = '—';
                    if (item?.deadlineIso) {
                      try {
                        const dt = new Date(item.deadlineIso);
                        formattedDate = `${toHindiNumerals(dt.getFullYear())}/${toHindiNumerals(
                          String(dt.getMonth() + 1).padStart(2, '0')
                        )}/${toHindiNumerals(String(dt.getDate()).padStart(2, '0'))} ${toHindiNumerals(
                          dt.getHours()
                        )}:${toHindiNumerals(String(dt.getMinutes()).padStart(2, '0'))}`;
                      } catch {
                        formattedDate = item.deadlineIso;
                      }
                    }

                    return (
                      <tr
                        key={d.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedDawrTab === d.id ? 'bg-emerald-50/60 font-bold' : ''
                        }`}
                      >
                        <td
                          className="py-2.5 px-3 font-serif font-black text-slate-900 cursor-pointer"
                          onClick={() => setSelectedDawrTab(d.id)}
                        >
                          {d.nameAr}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{d.semester}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              rem.expired ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                            }`}
                          >
                            {rem.text}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {lockedNow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-black text-[11px]">
                              <Lock className="w-3 h-3" /> مقفل الآن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[11px]">
                              <Unlock className="w-3 h-3" /> غير مقفل
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {item?.enforceLock ?? true ? (
                            <span className="text-emerald-800 font-bold inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-emerald-600" /> صارم
                            </span>
                          ) : (
                            <span className="text-slate-500 inline-flex items-center gap-1">
                              <Unlock className="w-3 h-3" /> مرن
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isAct ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                              نشط حالياً
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">قادم / سابق</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => openEditDawrModal(d.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-black text-[11px] cursor-pointer transition-colors shadow-2xs"
                            title={`تعديل قفل وموعد ${d.nameAr}`}
                          >
                            <Pencil className="w-3 h-3" />
                            <span>تعديل (Edit)</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleSavePrincipalSettings}
              className="px-6 py-2.5 bg-[#126b38] hover:bg-[#0e5830] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>حفظ وتطبيق المواعيد والمهل الزمنية (Save Deadlines)</span>
            </button>
          </div>
        </div>

        {/* 3. Subject-Level Lock & Unlock Manager */}
        <div
          className="bg-white rounded-2xl p-5 border border-[#cfc39f] shadow-xs space-y-4 text-right"
          dir="rtl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-300 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 font-serif">
                  ٣. إدارة أقفال المواد والصفوف (Subject Lock &amp; Unlock Controls)
                </h2>
                <p className="text-xs text-slate-500 font-serif">
                  فتح التعديل أو قفل سجل أي مادة مباشرة بدون انتظار طلب الأستاذ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={subjectFilterPeriod}
                onChange={e => setSubjectFilterPeriod(e.target.value as GradingPeriod)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
              >
                {DAWRS_LIST.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nameAr} ({d.nameEn})
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  placeholder="بحث بالمادة، الصف، أو الأستاذ..."
                  className="pr-8 pl-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none w-56"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[380px]">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">المادة</th>
                  <th className="py-2.5 px-3">الصف</th>
                  <th className="py-2.5 px-3">الأستاذ</th>
                  <th className="py-2.5 px-3 text-center">المرصود</th>
                  <th className="py-2.5 px-3">الحالة الآن</th>
                  <th className="py-2.5 px-3 text-center">فتح / قفل التعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {subjectLockRows.slice(0, 40).map(row => {
                  const hoursVal = grantHoursMap[row.key] || 24;
                  const isLocked = row.lockCheck.isLocked;
                  const hoursLeft = Math.ceil(row.lockCheck.remainingMs / 3600000);

                  return (
                    <tr key={row.key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {row.subject.SubjectArabic || row.subject.SubjectClass}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {row.classItem?.ClassName || `Class #${row.subject.ClassID}`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {row.teacher?.NameArabic || row.teacher?.Name || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {toHindiNumerals(row.gradeCount)}
                      </td>
                      <td className="py-2.5 px-3">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                            <Lock className="w-3 h-3" /> مقفل
                          </span>
                        ) : row.lockCheck.remainingMs > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <Unlock className="w-3 h-3" /> مفتوح ({toHindiNumerals(hoursLeft)}س)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            <Unlock className="w-3 h-3" /> غير مقفل
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={hoursVal}
                            onChange={e =>
                              setGrantHoursMap(prev => ({
                                ...prev,
                                [row.key]: Number(e.target.value),
                              }))
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-[11px] font-bold bg-white cursor-pointer"
                          >
                            <option value={12}>١٢ س</option>
                            <option value={24}>٢٤ س</option>
                            <option value={48}>٤٨ س</option>
                            <option value={72}>٧٢ س</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              handleGrantSubjectUnlock(
                                row.subject.ClassID,
                                row.subject.SubjectID,
                                subjectFilterPeriod,
                                hoursVal,
                                true
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>فتح</span>
                          </button>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() =>
                                handleGrantSubjectUnlock(
                                  row.subject.ClassID,
                                  row.subject.SubjectID,
                                  subjectFilterPeriod,
                                  0,
                                  false
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              <span>قفل</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Dawr Lock & Deadline Modal */}
      {editingDawr && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl border-2 border-[#ccbf99] shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    تعديل حالة القفل والموعد &bull;{' '}
                    {DAWRS_LIST.find(d => d.id === editingDawr)?.nameAr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تحكم مباشر في ما إذا كان الدور مقفلاً أو مفتوحاً للتعديل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDawr(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Lock Status Preview + Quick Actions */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDawrCurrentlyLocked(modalDraft)
                  ? 'bg-red-50 border-red-200 text-red-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-black">
                {isDawrCurrentlyLocked(modalDraft) ? (
                  <>
                    <Lock className="w-4 h-4 text-red-600" />
                    <span>الحالة الحالية: مقفل (Locked)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <span>الحالة الحالية: غير مقفل / مفتوح (Unlocked)</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickModalExtend(24)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" /> فتح +٢٤ ساعة
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickModalExtend(168)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold cursor-pointer"
                >
                  +٧ أيام
                </button>
                <button
                  type="button"
                  onClick={handleQuickModalLockNow}
                  className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" /> قفل الآن
                </button>
              </div>
            </div>

            {/* Deadline Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الموعد النهائي للتسليم (Deadline Date &amp; Time)
              </label>
              <input
                type="datetime-local"
                value={modalDraft.deadlineIso?.substring(0, 16) || '2026-10-31T23:59'}
                onChange={e =>
                  setModalDraft(prev => ({ ...prev, deadlineIso: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Enforce Lock Toggle */}
            <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-black text-slate-900">
                  قفل إجباري عند حلول الموعد (Enforce Hard Lock)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {modalDraft.enforceLock
                    ? 'صارم: يمنع التعديل بعد انتهاء الموعد إلا بإذن المدير'
                    : 'مرن: يسمح للمعلمين بالتعديل حتى بعد انتهاء الموعد'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={modalDraft.enforceLock ?? true}
                onChange={e =>
                  setModalDraft(prev => ({ ...prev, enforceLock: e.target.checked }))
                }
                className="w-5 h-5 text-[#126b38] rounded-md cursor-pointer"
              />
            </label>

            {/* Set as Active Dawr Toggle */}
            <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">
                تعيين هذا الدور كالدور النشط حالياً للمدرسة
              </span>
              <input
                type="checkbox"
                checked={modalSetActive}
                onChange={e => setModalSetActive(e.target.checked)}
                className="w-4 h-4 text-[#126b38] rounded-md cursor-pointer"
              />
            </label>

            {/* Teacher Directives */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                توجيهات المدير للكادر التعليمي
              </label>
              <textarea
                rows={2}
                value={modalDraft.instructions || ''}
                onChange={e =>
                  setModalDraft(prev => ({ ...prev, instructions: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-serif bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingDawr(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModalDawr}
                className="px-5 py-2 rounded-xl bg-[#126b38] hover:bg-[#0e5830] text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5 text-amber-300" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
