'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClassScheduleItem,
  ClassItem,
  SubjectItem,
  TeacherItem,
} from '@/lib/types';
import { DataStore } from '@/lib/store';
import SchoolArabicTitle from '@/app/components/SchoolArabicTitle';
import { toHindiNumerals, formatTimeHindi } from '@/lib/numerals';
import {
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  X,
  Plus,
  Trash2,
  Printer,
  Building2,
  AlertTriangle,
  Phone,
  CheckCircle,
  Edit3,
  Palette,
  RotateCcw,
  GripVertical,
  Megaphone,
  ChevronRight,
  ChevronLeft,
  ArrowLeftRight,
  Check,
} from 'lucide-react';

interface PrincipalMasterScheduleViewProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  teachers: TeacherItem[];
  schedules: ClassScheduleItem[];
  onRefresh: () => void;
  canManage?: boolean;
  initialClassId?: number;
}

interface TimeSlotRow {
  label: string;
  start: string;
  end: string;
  isBreak: boolean;
  period: 'morning' | 'afternoon';
  titleArabic?: string;
}

// Curated color presets for subjects (soft, readable backgrounds with dark or white text)
const SUBJECT_COLOR_PRESETS: Array<{ name: string; hex: string; textHex: string }> = [
  { name: 'الأصلي (Original)', hex: '', textHex: '#0f172a' },
  { name: 'ذهبي دافئ (Warm Gold)', hex: '#e6c786', textHex: '#1e293b' },
  { name: 'أخضر زمردي (Emerald)', hex: '#a7f3d0', textHex: '#064e3b' },
  { name: 'أزرق سماوي (Sky Blue)', hex: '#bae6fd', textHex: '#0c4a6e' },
  { name: 'بنفسجي هادئ (Lavender)', hex: '#ddd6fe', textHex: '#3b0764' },
  { name: 'وردي فاتح (Rose)', hex: '#fecdd3', textHex: '#881337' },
  { name: 'برتقالي مشمشي (Peach)', hex: '#fed7aa', textHex: '#7c2d12' },
  { name: 'أصفر ليموني (Soft Yellow)', hex: '#fef08a', textHex: '#713f12' },
  { name: 'فيروزي (Teal)', hex: '#99f6e4', textHex: '#134e4a' },
  { name: 'رمادي صخري (Slate)', hex: '#cbd5e1', textHex: '#0f172a' },
  { name: 'أخضر داكن (Deep Green)', hex: '#15803d', textHex: '#ffffff' },
  { name: 'كحلي رسمي (Navy Blue)', hex: '#1d4ed8', textHex: '#ffffff' },
  { name: 'عنابي (Burgundy)', hex: '#be123c', textHex: '#ffffff' },
  { name: 'بني كاكاو (Rich Brown)', hex: '#78350f', textHex: '#ffffff' },
];

function getContrastTextColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#') || hexColor.length < 7) return '#0f172a';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 145 ? '#0f172a' : '#ffffff';
}

function format12HourRange(start: string, end: string): string {
  const fmt = (hhmm: string) => {
    const [hStr, mStr] = hhmm.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return hhmm;
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${mStr}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

function getShortClassCode(cls: ClassItem): string {
  // Extract short code before ' - ' if present (e.g. "1ب-أ - الأول الابتدائي أ" -> "1ب-أ")
  if (cls.ClassName.includes(' - ')) {
    const [firstPart, secondPart] = cls.ClassName.split(' - ');
    if (cls.Level.toLowerCase().includes('kulliya') || firstPart.includes('كلية')) {
      return secondPart.trim();
    }
    return firstPart.trim();
  }
  return cls.ClassName;
}

function isKulliyahClass(cls: ClassItem): boolean {
  const lvl = (cls.Level || '').toLowerCase();
  const name = cls.ClassName || '';
  return lvl.includes('kulliya') || name.includes('كلية');
}

function getStageBadgeColor(cls: ClassItem): { headerBg: string; border: string; labelAr: string } {
  const lvl = (cls.Level || '').toLowerCase();
  if (lvl.includes('kulliya') || cls.ClassName.includes('كلية')) {
    return { headerBg: '#126b38', border: '#0d522a', labelAr: 'كلية التربية' };
  }
  if (lvl.includes('thanawi') || cls.ClassName.includes('ث')) {
    return { headerBg: '#3b7a57', border: '#2d5f43', labelAr: 'الثانوي' };
  }
  if (lvl.includes('mutawassit') || cls.ClassName.includes('م')) {
    return { headerBg: '#c86d51', border: '#a8573e', labelAr: 'المتوسط' };
  }
  if (lvl.includes('tamhidi') || cls.ClassName.includes('ج')) {
    return { headerBg: '#c8648c', border: '#a64d71', labelAr: 'التمهيدي' };
  }
  // Default: Ibtidaiyyah (Primary purple from 2nd picture)
  return { headerBg: '#635994', border: '#4e457a', labelAr: 'الابتدائي' };
}

export default function PrincipalMasterScheduleView({
  classes,
  subjects,
  teachers,
  schedules,
  onRefresh,
  canManage = true,
  initialClassId = 0,
}: PrincipalMasterScheduleViewProps) {
  // 1. Division Tab: Separate General Grades (ابتدائي • متوسط • ثانوي • تمهيدي) vs Kulliyah (كلية التربية)
  const [divisionTab, setDivisionTab] = useState<'general' | 'kulliyah'>('general');

  // 2. Column Order: 'asc' (1ب -> 2ب -> 3ب ... -> متوسط -> ثانوي) vs 'board' (1ث -> 1م -> 6ب -> 1ج like 2nd image)
  const [columnOrder, setColumnOrder] = useState<'asc' | 'board'>('asc');

  // 3. Department & Day Selection
  const [deptFilter, setDeptFilter] = useState<'2-days' | '5-days' | 'all'>('2-days');
  const [selectedDay, setSelectedDay] = useState<string>('Friday');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'morning' | 'afternoon'>('all');

  // 4. Stage / Class / Teacher Filters
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId || 0);
  const [filterTeacherId, setFilterTeacherId] = useState<number>(0);
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st');
  const [highlightedSubjectName, setHighlightedSubjectName] = useState<string | null>(null);

  // 5. Optional Principal/Admin Top Notice State
  const [scheduleNotice, setScheduleNotice] = useState<string>('');
  const [isEditingNotice, setIsEditingNotice] = useState<boolean>(false);
  const [noticeDraft, setNoticeDraft] = useState<string>('');

  // 6. Custom Subject Colors State (Default is {} = Original look)
  const [subjectColors, setSubjectColors] = useState<Record<string, string>>({});
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);

  // 7. Edit / Add Subject & Time Modal State
  const [editingSlot, setEditingSlot] = useState<{
    mode: 'add' | 'edit';
    scheduleId?: number;
    ClassID: number;
    SubjectID: number;
    CustomSubjectName: string;
    TeacherID: number;
    Day: ClassScheduleItem['Day'];
    StartTime: string;
    EndTime: string;
    OriginalStartTime: string;
    OriginalEndTime: string;
    UpdateTimeScope: 'row' | 'single';
    Room: string;
    CustomColor: string;
  } | null>(null);
  const [modalConflictError, setModalConflictError] = useState<string | null>(null);

  // 8. Edit Entire Time Row Modal (when clicking the Time column directly)
  const [editingTimeRow, setEditingTimeRow] = useState<{
    day: string;
    oldStart: string;
    oldEnd: string;
    newStart: string;
    newEnd: string;
  } | null>(null);

  // 9. Drag-and-Drop & Conflict Confirmation Modal State
  const [draggedSlot, setDraggedSlot] = useState<ClassScheduleItem | null>(null);
  const [dragOverCellKey, setDragOverCellKey] = useState<string | null>(null);
  const [pendingDropConflict, setPendingDropConflict] = useState<{
    sourceId: number;
    targetClassId: number;
    targetDay: ClassScheduleItem['Day'];
    targetStartTime: string;
    targetEndTime: string;
    targetSlotId?: number;
    conflicts: Array<{
      teacherName: string;
      day: string;
      time: string;
      conflictClassName: string;
      conflictSubjectName: string;
    }>;
  } | null>(null);

  // 10. Toast Notification & Hover Tooltip
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hoveredTeacher, setHoveredTeacher] = useState<{
    teacher: TeacherItem;
    subject: SubjectItem;
    schedule: ClassScheduleItem;
    classItem?: ClassItem;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setScheduleNotice(DataStore.getScheduleNotice());
    setSubjectColors(DataStore.getSubjectColors());
  }, [schedules]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const getSubject = (sid: number) => subjects.find(s => s.SubjectID === sid);
  const getTeacher = (tid: number) => teachers.find(t => t.TeacherID === tid);
  const getClass = (cid: number) => classes.find(c => c.ClassID === cid);

  // Days configuration
  const fiveDaysList = [
    { key: 'Sunday', nameEn: 'Sunday', nameAr: 'الأحد' },
    { key: 'Monday', nameEn: 'Monday', nameAr: 'الاثنين' },
    { key: 'Tuesday', nameEn: 'Tuesday', nameAr: 'الثلاثاء' },
    { key: 'Wednesday', nameEn: 'Wednesday', nameAr: 'الأربعاء' },
    { key: 'Thursday', nameEn: 'Thursday', nameAr: 'الخميس' },
  ];

  const twoDaysList = [
    { key: 'Friday', nameEn: 'Friday', nameAr: 'الجمعة' },
    { key: 'Saturday', nameEn: 'Saturday', nameAr: 'السبت' },
  ];

  const allSevenDaysList = [...twoDaysList, ...fiveDaysList];

  const availableDays = useMemo(() => {
    if (deptFilter === '2-days') return twoDaysList;
    if (deptFilter === '5-days') return fiveDaysList;
    return allSevenDaysList;
  }, [deptFilter]);

  // Keep selectedDay valid when switching department filter
  useEffect(() => {
    if (selectedDay !== 'all' && !availableDays.some(d => d.key === selectedDay)) {
      setSelectedDay(availableDays[0]?.key || 'Friday');
    }
  }, [deptFilter, availableDays, selectedDay]);

  const activeDaysToRender = useMemo(() => {
    if (selectedDay === 'all') return availableDays;
    return availableDays.filter(d => d.key === selectedDay);
  }, [selectedDay, availableDays]);

  // Separate classes into General Grades vs Kulliyah
  const divisionClasses = useMemo(() => {
    const filtered = classes.filter(cls => {
      const isKul = isKulliyahClass(cls);
      if (divisionTab === 'kulliyah' && !isKul) return false;
      if (divisionTab === 'general' && isKul) return false;
      if (deptFilter !== 'all' && cls.Department !== deptFilter) return false;
      if (selectedClassId > 0 && cls.ClassID !== selectedClassId) return false;
      if (divisionTab === 'general' && stageFilter !== 'all') {
        if (stageFilter === 'ibtidaiyyah' && cls.Level !== 'Ibtidaiyyah') return false;
        if (stageFilter === 'mutawassit' && cls.Level !== 'Mutawassit') return false;
        if (stageFilter === 'thanawi' && cls.Level !== 'Thanawi') return false;
        if (stageFilter === 'tamhidi' && cls.Level !== 'Tamhidi') return false;
      }
      return true;
    });

    // Sort columns according to user preference
    const sorted = [...filtered];
    if (divisionTab === 'kulliyah') {
      sorted.sort((a, b) => a.YearGrade - b.YearGrade || a.ClassID - b.ClassID);
    } else if (columnOrder === 'asc') {
      // Ascending order from right to left:
      // 1ب-أ، 1ب-ب، 2ب-أ، 2ب-ب، 3ب، 4ب، 5ب، 6ب -> 1م، 2م، 3م -> 1ث، 2ث، 3ث -> 1ج، 2ج، 3ج
      const stageRank: Record<string, number> = {
        Ibtidaiyyah: 1,
        Mutawassit: 2,
        Thanawi: 3,
        Tamhidi: 4,
      };
      sorted.sort((a, b) => {
        const rA = stageRank[a.Level] || 5;
        const rB = stageRank[b.Level] || 5;
        if (rA !== rB) return rA - rB;
        if (a.YearGrade !== b.YearGrade) return a.YearGrade - b.YearGrade;
        // For 1ب-أ (ClassID 14) before 1ب-ب (ClassID 13)
        return b.ClassID - a.ClassID;
      });
    } else {
      // Picture 2 board order from right to left:
      // 1ث، 2ث، 3ث -> 1م، 2م، 3م -> 6ب..1ب -> 1ج..3ج
      sorted.sort((a, b) => a.ClassID - b.ClassID);
    }

    return sorted;
  }, [classes, divisionTab, deptFilter, selectedClassId, stageFilter, columnOrder]);

  // All classes in current division (ignoring single-class filter) for dropdowns
  const allClassesInDivision = useMemo(() => {
    return classes.filter(cls =>
      divisionTab === 'kulliyah' ? isKulliyahClass(cls) : !isKulliyahClass(cls)
    );
  }, [classes, divisionTab]);

  // Build time slots for a specific day and division
  const getTimeSlotsForDay = (dayKey: string): { morning: TimeSlotRow[]; afternoon: TimeSlotRow[] } => {
    const classIdSet = new Set(allClassesInDivision.map(c => c.ClassID));
    const daySchedules = schedules.filter(s => s.Day === dayKey && classIdSet.has(s.ClassID));

    const defaultGeneralMorning: TimeSlotRow[] = [
      { label: '7:15 - 7:55', start: '07:15', end: '07:55', isBreak: false, period: 'morning' },
      { label: '7:55 - 8:35', start: '07:55', end: '08:35', isBreak: false, period: 'morning' },
      { label: '8:35 - 9:15', start: '08:35', end: '09:15', isBreak: false, period: 'morning' },
      { label: '9:15 - 9:30', start: '09:15', end: '09:30', isBreak: true, period: 'morning', titleArabic: 'فسحــــــــــــــــــــة / BREAK' },
      { label: '9:30 - 10:10', start: '09:30', end: '10:10', isBreak: false, period: 'morning' },
      { label: '10:10 - 10:50', start: '10:10', end: '10:50', isBreak: false, period: 'morning' },
      { label: '10:50 - 11:30', start: '10:50', end: '11:30', isBreak: false, period: 'morning' },
    ];

    const defaultGeneralAfternoon: TimeSlotRow[] = [
      { label: '1:00 - 1:40', start: '13:00', end: '13:40', isBreak: false, period: 'afternoon' },
      { label: '1:40 - 2:20', start: '13:40', end: '14:20', isBreak: false, period: 'afternoon' },
      { label: '2:20 - 3:00', start: '14:20', end: '15:00', isBreak: false, period: 'afternoon' },
      { label: '3:00 - 3:40', start: '15:00', end: '15:40', isBreak: false, period: 'afternoon' },
      { label: '3:40 - 4:20', start: '15:40', end: '16:20', isBreak: false, period: 'afternoon' },
    ];

    const defaultKulliyahMorning: TimeSlotRow[] = [
      { label: '8:00 - 9:00', start: '08:00', end: '09:00', isBreak: false, period: 'morning' },
      { label: '9:00 - 10:00', start: '09:00', end: '10:00', isBreak: false, period: 'morning' },
      { label: '10:00 - 11:00', start: '10:00', end: '11:00', isBreak: false, period: 'morning' },
    ];

    const defaultKulliyahAfternoon: TimeSlotRow[] = [
      { label: '2:00 - 3:00', start: '14:00', end: '15:00', isBreak: false, period: 'afternoon' },
      { label: '3:00 - 4:00', start: '15:00', end: '16:00', isBreak: false, period: 'afternoon' },
      { label: '4:00 - 5:00', start: '16:00', end: '17:00', isBreak: false, period: 'afternoon' },
    ];

    if (daySchedules.length === 0) {
      return divisionTab === 'kulliyah'
        ? { morning: defaultKulliyahMorning, afternoon: defaultKulliyahAfternoon }
        : { morning: defaultGeneralMorning, afternoon: defaultGeneralAfternoon };
    }

    const uniqueMap = new Map<string, { start: string; end: string }>();
    for (const s of daySchedules) {
      const key = `${s.StartTime}-${s.EndTime}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { start: s.StartTime, end: s.EndTime });
      }
    }

    const sorted = Array.from(uniqueMap.values()).sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
    );

    const morning: TimeSlotRow[] = [];
    const afternoon: TimeSlotRow[] = [];
    let breakInserted = false;

    for (const item of sorted) {
      const isAfternoon = item.start >= '12:00';
      if (!isAfternoon) {
        if (
          divisionTab === 'general' &&
          !breakInserted &&
          item.start >= '09:30' &&
          morning.some(m => m.end <= '09:20')
        ) {
          morning.push({
            label: '9:15 - 9:30',
            start: '09:15',
            end: '09:30',
            isBreak: true,
            period: 'morning',
            titleArabic: 'فسحــــــــــــــــــــة / BREAK',
          });
          breakInserted = true;
        }
        morning.push({
          label: format12HourRange(item.start, item.end),
          start: item.start,
          end: item.end,
          isBreak: false,
          period: 'morning',
        });
      } else {
        afternoon.push({
          label: format12HourRange(item.start, item.end),
          start: item.start,
          end: item.end,
          isBreak: false,
          period: 'afternoon',
        });
      }
    }

    return { morning, afternoon };
  };

  // Detect if a specific schedule slot has a teacher overlap conflict across the entire school
  const getSlotTeacherConflict = (slot: ClassScheduleItem): string | null => {
    const conflicts = schedules.filter(
      s =>
        s.ID !== slot.ID &&
        s.TeacherID === slot.TeacherID &&
        s.Day === slot.Day &&
        ((s.StartTime < slot.EndTime && s.EndTime > slot.StartTime) || s.StartTime === slot.StartTime)
    );
    if (conflicts.length === 0) return null;
    const otherClasses = conflicts.map(c => getClass(c.ClassID)?.ClassName || `فصل #${c.ClassID}`);
    const t = getTeacher(slot.TeacherID);
    return `تضارب موعد الأستاذ (${t?.NameArabic || t?.Name}): مجدول في نفس التوقيت في ${otherClasses.join(' و ')}`;
  };

  // Resolve Subject Color (Priority: slot.CustomColor -> subjectColors[subjectArabic] -> default original)
  const resolveSubjectColor = (slot: ClassScheduleItem, sub?: SubjectItem): { bg: string; text: string; isCustom: boolean } => {
    if (slot.CustomColor) {
      return {
        bg: slot.CustomColor,
        text: getContrastTextColor(slot.CustomColor),
        isCustom: true,
      };
    }
    const subKey = (sub?.SubjectArabic || sub?.SubjectClass || '').trim();
    if (subKey && subjectColors[subKey]) {
      const hex = subjectColors[subKey];
      return {
        bg: hex,
        text: getContrastTextColor(hex),
        isCustom: true,
      };
    }
    // Original default from Picture 2: warm classic beige/parchment tint
    return {
      bg: '#d9ceb8',
      text: '#0f172a',
      isCustom: false,
    };
  };

  // Unique subject names in current division for the Color Customizer modal
  const uniqueSubjectNamesInDivision = useMemo(() => {
    const classIdSet = new Set(allClassesInDivision.map(c => c.ClassID));
    const names = new Set<string>();
    subjects.forEach(s => {
      if (classIdSet.has(s.ClassID)) {
        const name = (s.SubjectArabic || s.SubjectClass || '').trim();
        if (name) names.add(name);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [subjects, allClassesInDivision]);

  // Open Edit Modal when clicking a subject cell
  const handleOpenEditSlot = (slot: ClassScheduleItem) => {
    if (!canManage) return;
    const sub = getSubject(slot.SubjectID);
    const subName = sub?.SubjectArabic || sub?.SubjectClass || '';
    const currentColor = slot.CustomColor || (subName && subjectColors[subName]) || '';
    setModalConflictError(null);
    setEditingSlot({
      mode: 'edit',
      scheduleId: slot.ID,
      ClassID: slot.ClassID,
      SubjectID: slot.SubjectID,
      CustomSubjectName: subName,
      TeacherID: slot.TeacherID,
      Day: slot.Day,
      StartTime: slot.StartTime,
      EndTime: slot.EndTime,
      OriginalStartTime: slot.StartTime,
      OriginalEndTime: slot.EndTime,
      UpdateTimeScope: 'row',
      Room: slot.Room || `قاعة ${getShortClassCode(getClass(slot.ClassID) || classes[0])}`,
      CustomColor: currentColor,
    });
  };

  // Open Add Modal when clicking an empty cell or the "+ إضافة حصة" button
  const handleOpenAddSlot = (prefill?: {
    classId?: number;
    day?: ClassScheduleItem['Day'];
    startTime?: string;
    endTime?: string;
  }) => {
    if (!canManage) return;
    const targetClassId = prefill?.classId || divisionClasses[0]?.ClassID || classes[0]?.ClassID || 1;
    const classSubjects = subjects.filter(s => s.ClassID === targetClassId);
    const firstSub = classSubjects[0] || subjects[0];
    const subName = firstSub?.SubjectArabic || firstSub?.SubjectClass || 'توحيد';
    const cls = getClass(targetClassId);

    setModalConflictError(null);
    setEditingSlot({
      mode: 'add',
      ClassID: targetClassId,
      SubjectID: firstSub?.SubjectID || 0,
      CustomSubjectName: subName,
      TeacherID: teachers[0]?.TeacherID || 1,
      Day: prefill?.day || (selectedDay !== 'all' ? (selectedDay as ClassScheduleItem['Day']) : 'Friday'),
      StartTime: prefill?.startTime || (divisionTab === 'kulliyah' ? '08:00' : '07:15'),
      EndTime: prefill?.endTime || (divisionTab === 'kulliyah' ? '09:00' : '07:55'),
      OriginalStartTime: prefill?.startTime || '07:15',
      OriginalEndTime: prefill?.endTime || '07:55',
      UpdateTimeScope: 'single',
      Room: cls ? `قاعة ${getShortClassCode(cls)}` : 'قاعة ١',
      CustomColor: (subName && subjectColors[subName]) || '',
    });
  };

  // Save Add/Edit Subject & Time Modal
  const handleSaveSlotModal = (e: React.FormEvent, forceIgnoreConflict = false) => {
    e.preventDefault();
    if (!editingSlot) return;
    setModalConflictError(null);

    // 1. Resolve or create/update the Subject if the user typed a custom subject name
    const trimmedSubName = editingSlot.CustomSubjectName.trim();
    let finalSubjectId = Number(editingSlot.SubjectID);
    const existingSubForClass = subjects.find(
      s =>
        s.ClassID === Number(editingSlot.ClassID) &&
        (s.SubjectArabic === trimmedSubName || s.SubjectClass === trimmedSubName)
    );

    if (existingSubForClass) {
      finalSubjectId = existingSubForClass.SubjectID;
    } else if (trimmedSubName) {
      // Create a new subject for this class on the fly so the user can type any subject name effortlessly
      const createdSub = DataStore.saveSubject({
        ClassID: Number(editingSlot.ClassID),
        SubjectClass: trimmedSubName,
        SubjectArabic: trimmedSubName,
        SubjectCode: `SUB-${Date.now().toString().slice(-4)}`,
        Semester: selectedSemester,
      });
      finalSubjectId = createdSub.SubjectID;
    }

    // 2. Save Subject Color preference if changed
    if (trimmedSubName) {
      DataStore.setSubjectColor(trimmedSubName, editingSlot.CustomColor);
      setSubjectColors(DataStore.getSubjectColors());
    }

    // 3. If editing and the user changed StartTime/EndTime with UpdateTimeScope === 'row', update the whole row first
    const timeChanged =
      editingSlot.mode === 'edit' &&
      (editingSlot.StartTime !== editingSlot.OriginalStartTime ||
        editingSlot.EndTime !== editingSlot.OriginalEndTime);

    if (timeChanged && editingSlot.UpdateTimeScope === 'row') {
      const divClassIds = allClassesInDivision.map(c => c.ClassID);
      DataStore.updateTimeSlotAcrossRow({
        oldStartTime: editingSlot.OriginalStartTime,
        oldEndTime: editingSlot.OriginalEndTime,
        newStartTime: editingSlot.StartTime,
        newEndTime: editingSlot.EndTime,
        day: editingSlot.Day,
        classIds: divClassIds,
      });
    }

    // 4. Save the schedule item itself
    const res = DataStore.saveSchedule(
      {
        ID: editingSlot.scheduleId,
        ClassID: Number(editingSlot.ClassID),
        SubjectID: finalSubjectId,
        TeacherID: Number(editingSlot.TeacherID),
        Day: editingSlot.Day,
        StartTime: editingSlot.StartTime,
        EndTime: editingSlot.EndTime,
        Room: editingSlot.Room,
        CustomColor: editingSlot.CustomColor || undefined,
      },
      { ignoreConflict: forceIgnoreConflict }
    );

    if (!res.success) {
      setModalConflictError(res.conflict || 'يوجد تضارب في موعد الأستاذ!');
      return;
    }

    setEditingSlot(null);
    onRefresh();
    showToast(
      editingSlot.mode === 'edit'
        ? 'تم تحديث بيانات الحصة والوقت بنجاح!'
        : 'تمت إضافة الحصة الدراسية بنجاح!'
    );
  };

  // Handle Drag Start / Over / Drop
  const handleDragStart = (e: React.DragEvent, slot: ClassScheduleItem) => {
    if (!canManage) return;
    setDraggedSlot(slot);
    e.dataTransfer.setData('text/plain', String(slot.ID));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnCell = (
    e: React.DragEvent,
    targetClassId: number,
    targetDay: ClassScheduleItem['Day'],
    targetStartTime: string,
    targetEndTime: string,
    targetSlot?: ClassScheduleItem
  ) => {
    e.preventDefault();
    setDragOverCellKey(null);
    if (!canManage || !draggedSlot) return;

    // Ignore dropping onto the exact same cell
    if (
      draggedSlot.ID === targetSlot?.ID ||
      (draggedSlot.ClassID === targetClassId &&
        draggedSlot.Day === targetDay &&
        draggedSlot.StartTime === targetStartTime)
    ) {
      setDraggedSlot(null);
      return;
    }

    const result = DataStore.moveOrSwapScheduleSlot({
      sourceId: draggedSlot.ID,
      targetClassId,
      targetDay,
      targetStartTime,
      targetEndTime,
      targetSlotId: targetSlot?.ID,
      ignoreConflict: false,
    });

    if (!result.success && result.conflicts && result.conflicts.length > 0) {
      // Show conflict warning modal asking user whether to cancel or allow/swap anyway
      setPendingDropConflict({
        sourceId: draggedSlot.ID,
        targetClassId,
        targetDay,
        targetStartTime,
        targetEndTime,
        targetSlotId: targetSlot?.ID,
        conflicts: result.conflicts,
      });
      setDraggedSlot(null);
      return;
    }

    setDraggedSlot(null);
    onRefresh();
    showToast(targetSlot ? 'تم تبديل موقع الحصتين بنجاح!' : 'تم نقل الحصة إلى التوقيت الجديد بنجاح!');
  };

  const handleConfirmForceDrop = () => {
    if (!pendingDropConflict) return;
    DataStore.moveOrSwapScheduleSlot({
      ...pendingDropConflict,
      ignoreConflict: true,
    });
    setPendingDropConflict(null);
    onRefresh();
    showToast('تم نقل الحصة مع الاحتفاظ بالتنبيه.');
  };

  // Save Notice
  const handleSaveNotice = () => {
    const trimmed = noticeDraft.trim();
    DataStore.setScheduleNotice(trimmed);
    setScheduleNotice(trimmed);
    setIsEditingNotice(false);
    showToast(trimmed ? 'تم حفظ الملاحظة الإدارية أعلى الجدول.' : 'تمت إزالة الملاحظة من أعلى الجدول.');
  };

  const handleRemoveNotice = () => {
    DataStore.setScheduleNotice('');
    setScheduleNotice('');
    setNoticeDraft('');
    setIsEditingNotice(false);
    showToast('تمت إزالة الملاحظة من أعلى الجدول.');
  };

  // Render a single matrix table section (e.g. Morning or Afternoon of a given Day)
  const renderScheduleMatrixSection = (
    dayObj: { key: string; nameEn: string; nameAr: string },
    period: 'morning' | 'afternoon',
    rows: TimeSlotRow[]
  ) => {
    if (rows.length === 0) return null;
    const tableKey = `${dayObj.key}-${period}`;
    const sectionTitleAr =
      period === 'morning' ? `صباح يوم ${dayObj.nameAr}` : `مساء يوم ${dayObj.nameAr}`;
    const sectionTitleEn =
      period === 'morning' ? `${dayObj.nameEn} Morning` : `${dayObj.nameEn} Afternoon`;

    return (
      <div key={tableKey} className="space-y-2 break-inside-avoid">
        {/* Section Header Bar + Horizontal Scroll Quick Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-t-xl bg-[#3b5366] text-white font-serif font-black text-sm sm:text-base shadow-xs">
              <Clock className="w-4 h-4 text-amber-300 no-print" />
              <span>{sectionTitleAr}</span>
              <span className="text-xs font-sans font-normal text-slate-200">({sectionTitleEn})</span>
            </span>
            {canManage && (
              <span className="text-[11px] text-slate-600 font-serif hidden sm:inline no-print">
                &bull; اضغط على أي مادة لتعديلها أو اسحبها لوقت آخر
              </span>
            )}
          </div>


        </div>

        {/* Horizontal Scrollable Matrix Table matching Picture 2 */}
        <div className="schedule-scroll-container overflow-x-auto rounded-2xl border-2 border-[#3b5366] bg-[#ebe5d5] shadow-md">
          <table className="schedule-print-table w-full border-collapse text-center" dir="rtl">
            <thead>
              <tr className="text-white text-xs sm:text-sm font-black">
                {/* 1. Far Right Sticky Column: الساعة / الوقت */}
                <th
                  className="bg-[#3b5366] py-3 px-3 border-l-2 border-[#2c3e4d] min-w-[105px] sm:min-w-[118px] shadow-md"
                >
                  <div className="font-serif text-sm sm:text-base">الساعة / الوقت</div>
                  <div className="font-sans text-[10px] font-medium text-slate-200 no-print">
                    Time Slot
                  </div>
                </th>

                {/* 2. Grade Columns across from right to left */}
                {divisionClasses.map(cls => {
                  const stageStyle = getStageBadgeColor(cls);
                  const shortCode = getShortClassCode(cls);
                  return (
                    <th
                      key={cls.ClassID}
                      style={{
                        backgroundColor: stageStyle.headerBg,
                        borderColor: stageStyle.border,
                      }}
                      className="py-2.5 px-2 border-l border-white/25 min-w-[92px] sm:min-w-[104px] select-none"
                      title={cls.ClassName}
                    >
                      <div className="font-serif text-sm sm:text-base font-black tracking-wide leading-tight">
                        {toHindiNumerals(shortCode)}
                      </div>
                      <div className="text-[10px] font-serif font-normal opacity-85 mt-0.5 truncate max-w-[96px] mx-auto">
                        {stageStyle.labelAr}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#948c76]">
              {rows.map(slotRow => {
                const timeHindi = formatTimeHindi(slotRow.label);

                // Dedicated Recess Break Row (فسحة / BREAK) matching Picture 2
                if (slotRow.isBreak) {
                  return (
                    <tr key={slotRow.label} className="bg-[#e2ddd2]">
                      <td className="py-2 px-2 bg-[#3b5366] text-amber-200 font-mono text-xs font-black border-l-2 border-[#2c3e4d]">
                        {timeHindi}
                      </td>
                      <td
                        colSpan={Math.max(1, divisionClasses.length)}
                        className="py-2 px-4 text-center font-serif font-black text-sm sm:text-base tracking-widest text-slate-800 bg-[#e6e1d6]"
                      >
                        {slotRow.titleArabic || 'فسحــــــــــــــــــــة / BREAK'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={`${slotRow.start}-${slotRow.end}`} className="bg-[#f4f1ea] hover:bg-[#ece7dc] transition-colors">
                    {/* Far Right Time Cell (Clickable to edit entire row's time!) */}
                    <td
                      onClick={() => {
                        if (!canManage) return;
                        setEditingTimeRow({
                          day: dayObj.key,
                          oldStart: slotRow.start,
                          oldEnd: slotRow.end,
                          newStart: slotRow.start,
                          newEnd: slotRow.end,
                        });
                      }}
                      className={`py-2.5 px-2 bg-[#3b5366] text-white font-mono text-xs sm:text-sm font-black border-l-2 border-[#2c3e4d] select-none group ${
                        canManage ? 'cursor-pointer hover:bg-[#2c3e4d]' : ''
                      }`}
                      title={canManage ? 'اضغط لتعديل توقيت هذا الصف بالكامل' : slotRow.label}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span dir="ltr">{timeHindi}</span>
                        {canManage && (
                          <Edit3 className="w-3 h-3 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity no-print" />
                        )}
                      </div>
                      <div className="text-[10px] font-sans font-normal text-slate-300 dir-ltr" dir="ltr">
                        {slotRow.label}
                      </div>
                    </td>

                    {/* Grade Cells across the Time Row */}
                    {divisionClasses.map(cls => {
                      const cellSlot = schedules.find(
                        s =>
                          s.ClassID === cls.ClassID &&
                          s.Day === dayObj.key &&
                          s.StartTime === slotRow.start &&
                          s.EndTime === slotRow.end &&
                          (filterTeacherId === 0 || s.TeacherID === filterTeacherId)
                      );

                      const cellKey = `${dayObj.key}-${slotRow.start}-${cls.ClassID}`;
                      const isDragOver = dragOverCellKey === cellKey;

                      if (!cellSlot) {
                        return (
                          <td
                            key={cls.ClassID}
                            onDragOver={e => {
                              if (!canManage) return;
                              e.preventDefault();
                              if (dragOverCellKey !== cellKey) setDragOverCellKey(cellKey);
                            }}
                            onDragLeave={() => {
                              if (dragOverCellKey === cellKey) setDragOverCellKey(null);
                            }}
                            onDrop={e =>
                              handleDropOnCell(
                                e,
                                cls.ClassID,
                                dayObj.key as ClassScheduleItem['Day'],
                                slotRow.start,
                                slotRow.end
                              )
                            }
                            onClick={() =>
                              handleOpenAddSlot({
                                classId: cls.ClassID,
                                day: dayObj.key as ClassScheduleItem['Day'],
                                startTime: slotRow.start,
                                endTime: slotRow.end,
                              })
                            }
                            className={`p-0 border-l border-[#948c76] align-middle transition-all group ${
                              canManage ? 'cursor-pointer hover:bg-emerald-50/70' : ''
                            } ${
                              isDragOver
                                ? 'bg-emerald-100/90 ring-2 ring-inset ring-emerald-600'
                                : 'bg-[#f8f6f1]'
                            }`}
                            title={
                              canManage
                                ? `إضافة حصة لصف ${getShortClassCode(cls)} (${slotRow.label})`
                                : ''
                            }
                          >
                            <div className="min-h-[60px] flex flex-col items-center justify-center text-slate-300 group-hover:text-emerald-700">
                              <span className="group-hover:hidden text-xs">—</span>
                              {canManage && (
                                <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[10px] font-serif font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full no-print">
                                  <Plus className="w-3 h-3" />
                                  <span>إضافة</span>
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      const sub = getSubject(cellSlot.SubjectID);
                      const teacher = getTeacher(cellSlot.TeacherID);
                      const subName = sub?.SubjectArabic || sub?.SubjectClass || 'مادة';
                      const teacherName = teacher?.NameArabic || teacher?.Name || 'الأستاذ';
                      const colorStyle = resolveSubjectColor(cellSlot, sub);
                      const conflictWarning = getSlotTeacherConflict(cellSlot);

                      const isHighlighted =
                        highlightedSubjectName !== null && subName === highlightedSubjectName;
                      const isDimmed =
                        highlightedSubjectName !== null && subName !== highlightedSubjectName;

                      return (
                        <td
                          key={cls.ClassID}
                          draggable={canManage}
                          onDragStart={e => handleDragStart(e, cellSlot)}
                          onDragEnd={() => {
                            setDraggedSlot(null);
                            setDragOverCellKey(null);
                          }}
                          onDragOver={e => {
                            if (!canManage) return;
                            e.preventDefault();
                            if (dragOverCellKey !== cellKey) setDragOverCellKey(cellKey);
                          }}
                          onDragLeave={() => {
                            if (dragOverCellKey === cellKey) setDragOverCellKey(null);
                          }}
                          onDrop={e =>
                            handleDropOnCell(
                              e,
                              cls.ClassID,
                              dayObj.key as ClassScheduleItem['Day'],
                              slotRow.start,
                              slotRow.end,
                              cellSlot
                            )
                          }
                          onMouseEnter={e => {
                            if (teacher && sub) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredTeacher({
                                teacher,
                                subject: sub,
                                schedule: cellSlot,
                                classItem: cls,
                                x: rect.left - 285,
                                y: rect.top,
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredTeacher(null)}
                          onClick={() => {
                            if (canManage) {
                              handleOpenEditSlot(cellSlot);
                            } else {
                              setHighlightedSubjectName(prev =>
                                prev === subName ? null : subName
                              );
                            }
                          }}
                          className={`p-0 border-l border-[#948c76] align-stretch select-none relative group transition-all ${
                            canManage ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                          } ${
                            isDragOver
                              ? 'ring-3 ring-inset ring-amber-500 z-10'
                              : isHighlighted
                              ? 'ring-3 ring-inset ring-emerald-700 z-10'
                              : isDimmed
                              ? 'opacity-40 hover:opacity-95'
                              : ''
                          }`}
                        >
                          {/* Split Cell matching Picture 2: Top Row = Subject, Bottom Row = Teacher */}
                          <div className="flex flex-col h-full min-h-[62px] justify-between">
                            {/* Top Half: Subject Name */}
                            <div
                              style={{
                                backgroundColor: colorStyle.bg,
                                color: colorStyle.text,
                              }}
                              className="px-1.5 py-1.5 border-b border-[#b5ab94] font-serif font-black text-xs sm:text-[13px] leading-snug flex items-center justify-center gap-1 relative"
                            >
                              {canManage && (
                                <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-60 absolute right-0.5 top-1.5 no-print" />
                              )}

                              <span className="truncate max-w-[92px] sm:max-w-[110px]">
                                {subName}
                              </span>

                              {/* Conflict indicator badge if teacher is double-booked */}
                              {conflictWarning && (
                                <span
                                  title={conflictWarning}
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex-shrink-0 animate-pulse"
                                >
                                  !
                                </span>
                              )}

                              {/* Quick Edit Button on Hover / Focus (Task 3) */}
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleOpenEditSlot(cellSlot);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0.5 top-1 p-0.5 rounded bg-slate-900/80 text-white hover:bg-emerald-700 no-print"
                                  title="تعديل المادة والوقت (Edit Subject & Time)"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Bottom Half: Teacher Name */}
                            <div className="px-1.5 py-1.5 bg-[#fbfaf6] group-hover:bg-amber-50/70 text-slate-800 font-serif font-bold text-[11px] sm:text-xs leading-tight flex items-center justify-center">
                              <span className="truncate max-w-[95px] sm:max-w-[115px]">
                                {teacherName}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* ===================================================================== */}
      {/* OFFICIAL PRINT HEADER (Task 7: Visible when printing the schedule)    */}
      {/* ===================================================================== */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-3 mb-3" dir="rtl">
        <div className="flex items-center justify-between gap-4">
          {/* Right: Arabic School Name & Division */}
          <div className="text-right space-y-0.5">
            <h1 className="text-lg font-black font-serif text-slate-950">
              جامعة منيب الكزبري العربية
            </h1>
            <p className="text-xs font-bold font-sans text-slate-700">
              Jamiatu Monib Alkuzbary Al-Arabia
            </p>
            <p className="text-xs font-serif font-bold text-emerald-900">
              {divisionTab === 'kulliyah'
                ? 'قسم الكلية: كلية التربية والدراسات الإسلامية'
                : 'المراحل الدراسية العامة: الابتدائي • المتوسط • الثانوي • التمهيدي'}
            </p>
          </div>

          {/* Center: Emblem + Official Schedule Badge matching Picture 2 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
              <SchoolArabicTitle
                variant="dark"
                imgClassName="h-10 w-auto object-contain"
                fallbackClassName="text-base font-serif font-black"
              />
            </div>
            <div className="inline-flex items-center border-2 border-[#a87932] rounded-full overflow-hidden text-xs font-serif font-black">
              <span className="bg-[#a87932] text-white px-4 py-0.5">الجدول</span>
              <span className="bg-white text-slate-900 px-4 py-0.5">
                {deptFilter === '5-days' ? 'خمسة أيام' : 'يومين'}
              </span>
            </div>
          </div>

          {/* Left: Academic Year, Semester & Date */}
          <div className="text-left font-serif text-xs space-y-0.5">
            <div className="font-bold text-slate-900">
              العام الدراسي: {toHindiNumerals('2025 - 2026')}م ({toHindiNumerals('1447')}هـ)
            </div>
            <div className="font-bold text-slate-700">
              الفصل الدراسي: {selectedSemester === '1st' ? 'الفصل الأول' : 'الفصل الثاني'}
            </div>
            <div className="text-[11px] text-slate-600">
              اليوم: {selectedDay === 'all' ? 'كامل الأيام' : availableDays.find(d => d.key === selectedDay)?.nameAr}
            </div>
          </div>
        </div>

        {/* If Principal/Admin added a custom notice, include it in print header */}
        {scheduleNotice && (
          <div className="mt-2 p-2 border border-amber-600 bg-amber-50/70 rounded-lg text-xs font-serif font-bold text-slate-900 text-right">
            <span className="font-black text-amber-900 ml-1">ملاحظة الإدارة:</span>
            <span>{scheduleNotice}</span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 1. EXECUTIVE MASTER SCHEDULE BANNER (Screen Only)                     */}
      {/* ===================================================================== */}
      <div className="no-print bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-white p-1 shadow-md flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="JMAA" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 font-mono">
                عمادة وإدارة الجامعة &bull; Master Schedule
              </span>
              <SchoolArabicTitle
                variant="light"
                imgClassName="h-6 w-auto object-contain"
                fallbackClassName="text-xs text-emerald-300 font-mono"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex flex-wrap items-center gap-2 mt-0.5">
              <span>جدول الحصص والمحاضرات العام</span>
              <span className="inline-flex items-center border border-amber-400/60 rounded-full overflow-hidden text-xs font-serif">
                <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 font-black">الجدول</span>
                <span className="bg-slate-900/90 text-amber-200 px-2.5 py-0.5 font-bold">
                  {deptFilter === '5-days' ? '٥ أيام' : 'يومين'}
                </span>
              </span>
            </h1>
            <p className="text-xs text-emerald-200/90 mt-1 flex flex-wrap items-center gap-1.5 font-serif">
              <span>القسم المعروض:</span>
              <span className="font-bold text-amber-300">
                {divisionTab === 'kulliyah'
                  ? 'كلية التربية والدراسات الإسلامية (Kulliyatu Tarbiyah)'
                  : 'المراحل الدراسية العامة (الابتدائي • المتوسط • الثانوي • التمهيدي)'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons for Admin & Principal */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <>
              {/* Add / Edit Top Notice Button (Task 2) */}
              <button
                type="button"
                onClick={() => {
                  setNoticeDraft(scheduleNotice);
                  setIsEditingNotice(true);
                }}
                className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-amber-200 border border-amber-400/40 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-serif"
                title="إضافة أو تعديل ملاحظة أعلى الجدول"
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>{scheduleNotice ? 'تعديل الملاحظة' : '+ إضافة ملاحظة'}</span>
              </button>

              {/* Subject Color Customizer Button (Task 5) */}
              <button
                type="button"
                onClick={() => setIsColorModalOpen(true)}
                className="px-3.5 py-2.5 bg-emerald-800/90 hover:bg-emerald-700 text-white border border-emerald-600/60 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-serif"
                title="تخصيص ألوان المواد الدراسية"
              >
                <Palette className="w-4 h-4 text-amber-300" />
                <span>ألوان المواد</span>
              </button>

              {/* Add New Schedule Slot Button */}
              <button
                type="button"
                onClick={() => handleOpenAddSlot()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer font-serif active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حصة دراسية</span>
              </button>
            </>
          )}

          {/* Print Button (Task 7) */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold border border-white/25 shadow flex items-center gap-1.5 transition-all cursor-pointer font-serif"
            title="طباعة الجدول مع الترويسة الرسمية"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>طباعة الجدول</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. OPTIONAL PRINCIPAL / ADMIN NOTICE BANNER (Task 2)                  */}
      {/* Hidden by default; only appears if Principal/Admin adds a notice      */}
      {/* ===================================================================== */}
      {isEditingNotice && canManage && (
        <div className="no-print bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-950 font-serif font-black text-sm">
              <Megaphone className="w-4 h-4 text-amber-600" />
              <span>إضافة / تعديل ملاحظة أو تنبيه إداري أعلى الجدول</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingNotice(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            rows={2}
            value={noticeDraft}
            onChange={e => setNoticeDraft(e.target.value)}
            placeholder="اكتب هنا أي ملاحظة أو توجيه يظهر أعلى الجدول وعند الطباعة (اتركه فارغاً لإخفاء الملاحظة)..."
            className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex items-center justify-end gap-2">
            {scheduleNotice && (
              <button
                type="button"
                onClick={handleRemoveNotice}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold font-serif cursor-pointer"
              >
                حذف الملاحظة
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditingNotice(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 font-serif cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveNotice}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black font-serif cursor-pointer"
            >
              حفظ الملاحظة
            </button>
          </div>
        </div>
      )}

      {!isEditingNotice && scheduleNotice && (
        <div className="no-print bg-amber-50/95 border-r-4 border-amber-500 border border-amber-200 rounded-2xl p-3.5 shadow-2xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-serif text-amber-950">
              <span className="font-black ml-1.5">ملاحظة إدارية:</span>
              <span className="font-bold">{scheduleNotice}</span>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNoticeDraft(scheduleNotice);
                  setIsEditingNotice(true);
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold font-serif cursor-pointer"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={handleRemoveNotice}
                className="p-1 bg-white hover:bg-red-100 text-red-600 border border-amber-300 rounded-lg cursor-pointer"
                title="إزالة الملاحظة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {successMsg && (
        <div className="no-print p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs sm:text-sm flex items-center gap-2 font-serif font-bold shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SEPARATE DIVISION TABS: GENERAL GRADES VS. KULLIYAH (Task 1)       */}
      {/* ===================================================================== */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setDivisionTab('general');
            setSelectedClassId(0);
          }}
          className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-center justify-between ${
            divisionTab === 'general'
              ? 'bg-[#126b38] text-white border-amber-400 shadow-lg ring-2 ring-amber-400/40'
              : 'bg-white hover:bg-[#f5efe0] text-slate-800 border-[#cfc39f]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                divisionTab === 'general' ? 'bg-amber-400 text-slate-950' : 'bg-[#dfd4b8] text-[#126b38]'
              }`}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="font-serif font-black text-base sm:text-lg">
                جدول المراحل الدراسية العامة
              </div>
              <div
                className={`text-xs font-serif ${
                  divisionTab === 'general' ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                الابتدائي (١ب - ٦ب) &bull; المتوسط (١م - ٣م) &bull; الثانوي (١ث - ٣ث) &bull; التمهيدي (١ج - ٣ج)
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-black ${
              divisionTab === 'general' ? 'bg-black/25 text-amber-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {toHindiNumerals(classes.filter(c => !isKulliyahClass(c)).length)} فصول
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setDivisionTab('kulliyah');
            setSelectedClassId(0);
          }}
          className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-center justify-between ${
            divisionTab === 'kulliyah'
              ? 'bg-[#126b38] text-white border-amber-400 shadow-lg ring-2 ring-amber-400/40'
              : 'bg-white hover:bg-[#f5efe0] text-slate-800 border-[#cfc39f]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                divisionTab === 'kulliyah' ? 'bg-amber-400 text-slate-950' : 'bg-[#dfd4b8] text-[#126b38]'
              }`}
            >
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-serif font-black text-base sm:text-lg">
                جدول قسم الكلية (كلية التربية)
              </div>
              <div
                className={`text-xs font-serif ${
                  divisionTab === 'kulliyah' ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                المستوى الأول &bull; المستوى الثالث &bull; المستوى الخامس &bull; المستوى السابع (مستقل عن المراحل العامة)
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-black ${
              divisionTab === 'kulliyah' ? 'bg-black/25 text-amber-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {toHindiNumerals(classes.filter(c => isKulliyahClass(c)).length)} مستويات
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 4. MAIN SCHEDULE CONTAINER & FILTER CONTROLS                          */}
      {/* ===================================================================== */}
      <div className="bg-[#dfd4b8] print:bg-transparent border-2 print:border-0 border-[#ccbf99] rounded-3xl p-4 sm:p-6 print:p-0 shadow-md print:shadow-none space-y-5">
        {/* Top Filter & View Toolbar (Hidden in Print) */}
        <div className="no-print flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white/60 p-3 rounded-2xl border border-[#cfc39f]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Day Selector Pills */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-[#cfc39f] shadow-2xs">
              <span className="text-[11px] font-serif font-bold text-slate-500 px-2">اليوم:</span>
              {availableDays.map(day => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDay(day.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-serif font-black transition-all cursor-pointer ${
                    selectedDay === day.key
                      ? 'bg-[#3b5366] text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day.nameAr}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedDay('all')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-black transition-all cursor-pointer ${
                  selectedDay === 'all'
                    ? 'bg-[#3b5366] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                كامل الأيام
              </button>
            </div>

            {/* Period Filter (Morning / Afternoon / Both) */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-[#cfc39f] shadow-2xs">
              <button
                type="button"
                onClick={() => setSessionFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold cursor-pointer ${
                  sessionFilter === 'all'
                    ? 'bg-[#126b38] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                صباحاً ومساءً
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('morning')}
                className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold cursor-pointer ${
                  sessionFilter === 'morning'
                    ? 'bg-[#126b38] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                الفترة الصباحية
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('afternoon')}
                className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold cursor-pointer ${
                  sessionFilter === 'afternoon'
                    ? 'bg-[#126b38] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                الفترة المسائية
              </button>
            </div>

            {/* Stage Filter (For General Grades) */}
            {divisionTab === 'general' && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#cfc39f] shadow-2xs">
                <span className="text-[11px] font-serif font-bold text-slate-500">المرحلة:</span>
                <select
                  value={stageFilter}
                  onChange={e => {
                    setStageFilter(e.target.value);
                    setSelectedClassId(0);
                  }}
                  className="text-xs font-serif font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="all">جميع المراحل (الابتدائي • المتوسط • الثانوي • التمهيدي)</option>
                  <option value="ibtidaiyyah">المرحلة الابتدائية (١ب - ٦ب)</option>
                  <option value="mutawassit">المرحلة المتوسطة (١م - ٣م)</option>
                  <option value="thanawi">المرحلة الثانوية (١ث - ٣ث)</option>
                  <option value="tamhidi">المرحلة التمهيدية (١ج - ٣ج)</option>
                </select>
              </div>
            )}

            {/* Specific Class Filter */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#cfc39f] shadow-2xs">
              <span className="text-[11px] font-serif font-bold text-slate-500">الصف:</span>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(Number(e.target.value))}
                className="text-xs font-serif font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={0}>كل الفصول (عرض شبكي كامل)</option>
                {allClassesInDivision.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>
                    {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Filter */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#cfc39f] shadow-2xs">
              <span className="text-[11px] font-serif font-bold text-slate-500">الأستاذ:</span>
              <select
                value={filterTeacherId}
                onChange={e => setFilterTeacherId(Number(e.target.value))}
                className="text-xs font-serif font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={0}>جميع الأساتذة</option>
                {teachers.map(t => (
                  <option key={t.TeacherID} value={t.TeacherID}>
                    {t.NameArabic || t.Name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right side of toolbar: Column Order Toggle & Department Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {divisionTab === 'general' && (
              <button
                type="button"
                onClick={() => setColumnOrder(prev => (prev === 'asc' ? 'board' : 'asc'))}
                className="px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-800 border border-[#cfc39f] rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="تبديل ترتيب أعمدة الصفوف"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#126b38]" />
                <span>
                  {columnOrder === 'asc'
                    ? 'الترتيب: ١ب ← ٦ب ← متوسط ← ثانوي'
                    : 'الترتيب: ١ث ← ١م ← ٦ب ← ١ج'}
                </span>
              </button>
            )}

            <div className="flex items-center bg-white p-1 rounded-xl border border-[#cfc39f] text-xs font-serif font-bold">
              <button
                type="button"
                onClick={() => setDeptFilter('2-days')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  deptFilter === '2-days' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600'
                }`}
              >
                يومين
              </button>
              <button
                type="button"
                onClick={() => setDeptFilter('5-days')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  deptFilter === '5-days' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600'
                }`}
              >
                ٥ أيام
              </button>
              <button
                type="button"
                onClick={() => setDeptFilter('all')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  deptFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600'
                }`}
              >
                الكل
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Matrix Sections per Active Day & Session */}
        {divisionClasses.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-10 text-center space-y-2 border border-[#cfc39f]">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-base font-serif font-black text-slate-800">
              لا توجد فصول مطابقة لفلتر البحث الحالي
            </p>
            <button
              type="button"
              onClick={() => {
                setDeptFilter('all');
                setStageFilter('all');
                setSelectedClassId(0);
              }}
              className="px-4 py-2 bg-[#126b38] text-white rounded-xl text-xs font-serif font-bold cursor-pointer"
            >
              إظهار جميع الفصول
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeDaysToRender.map(dayObj => {
              const { morning, afternoon } = getTimeSlotsForDay(dayObj.key);
              return (
                <div key={dayObj.key} className="space-y-6">
                  {(sessionFilter === 'all' || sessionFilter === 'morning') &&
                    renderScheduleMatrixSection(dayObj, 'morning', morning)}
                  {(sessionFilter === 'all' || sessionFilter === 'afternoon') &&
                    renderScheduleMatrixSection(dayObj, 'afternoon', afternoon)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. EDIT / ADD SUBJECT & TIME MODAL (Task 3 & Task 5)                  */}
      {/* ===================================================================== */}
      {editingSlot && canManage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-serif">
                    {editingSlot.mode === 'edit'
                      ? 'تعديل المادة والتوقيت والأستاذ'
                      : 'إضافة حصة دراسية جديدة'}
                  </h3>
                  <p className="text-xs text-slate-500 font-serif">
                    يمكنك تعديل اسم المادة، الأستاذ، الوقت، أو لون الخلية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalConflictError && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-400 text-amber-950 rounded-2xl text-xs space-y-2">
                <div className="flex items-start gap-2 font-serif font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{modalConflictError}</span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={e => handleSaveSlotModal(e as any, true)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-serif font-black cursor-pointer"
                  >
                    حفظ على أي حال (تجاهل التضارب)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={e => handleSaveSlotModal(e, false)} className="space-y-3.5 text-xs font-serif">
              {/* Target Class & Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    الصف الدراسي (Grade / Class)
                  </label>
                  <select
                    value={editingSlot.ClassID}
                    onChange={e => {
                      const cid = Number(e.target.value);
                      const clsSubs = subjects.filter(s => s.ClassID === cid);
                      const firstSub = clsSubs[0];
                      setEditingSlot(prev =>
                        prev
                          ? {
                              ...prev,
                              ClassID: cid,
                              SubjectID: firstSub?.SubjectID || prev.SubjectID,
                              CustomSubjectName:
                                firstSub?.SubjectArabic || firstSub?.SubjectClass || prev.CustomSubjectName,
                            }
                          : null
                      );
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                  >
                    {classes.map(c => (
                      <option key={c.ClassID} value={c.ClassID}>
                        {c.ClassName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اليوم (Day)</label>
                  <select
                    value={editingSlot.Day}
                    onChange={e =>
                      setEditingSlot(prev =>
                        prev ? { ...prev, Day: e.target.value as ClassScheduleItem['Day'] } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                  >
                    {allSevenDaysList.map(d => (
                      <option key={d.key} value={d.key}>
                        {d.nameAr} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Name (Select from list OR type directly!) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800">المادة الدراسية (Subject)</label>
                  <span className="text-[11px] text-slate-500">اختر من القائمة أو اكتب اسم المادة</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={editingSlot.SubjectID}
                    onChange={e => {
                      const sid = Number(e.target.value);
                      const sub = getSubject(sid);
                      const name = sub?.SubjectArabic || sub?.SubjectClass || '';
                      setEditingSlot(prev =>
                        prev
                          ? {
                              ...prev,
                              SubjectID: sid,
                              CustomSubjectName: name,
                              CustomColor: subjectColors[name] || prev.CustomColor,
                            }
                          : null
                      );
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                  >
                    {subjects
                      .filter(s => s.ClassID === Number(editingSlot.ClassID))
                      .map(s => (
                        <option key={s.SubjectID} value={s.SubjectID}>
                          {s.SubjectArabic || s.SubjectClass}
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    required
                    value={editingSlot.CustomSubjectName}
                    onChange={e =>
                      setEditingSlot(prev =>
                        prev ? { ...prev, CustomSubjectName: e.target.value } : null
                      )
                    }
                    placeholder="اسم المادة (مثال: توحيد، فقه...)"
                    className="w-full px-3 py-2 border border-emerald-400 rounded-xl bg-white text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Teacher & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    الأستاذ المحاضر (Teacher)
                  </label>
                  <select
                    value={editingSlot.TeacherID}
                    onChange={e =>
                      setEditingSlot(prev =>
                        prev ? { ...prev, TeacherID: Number(e.target.value) } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                  >
                    {teachers.map(t => (
                      <option key={t.TeacherID} value={t.TeacherID}>
                        {t.NameArabic || t.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القاعة (Room)</label>
                  <input
                    type="text"
                    value={editingSlot.Room}
                    onChange={e =>
                      setEditingSlot(prev => (prev ? { ...prev, Room: e.target.value } : null))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Time Editing Section (Task 3) */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-1.5 font-black text-emerald-950">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>توقيت الحصة (الساعة من - إلى)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      وقت البدء (Start Time)
                    </label>
                    <input
                      type="time"
                      required
                      value={editingSlot.StartTime}
                      onChange={e =>
                        setEditingSlot(prev =>
                          prev ? { ...prev, StartTime: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      وقت الانتهاء (End Time)
                    </label>
                    <input
                      type="time"
                      required
                      value={editingSlot.EndTime}
                      onChange={e =>
                        setEditingSlot(prev => (prev ? { ...prev, EndTime: e.target.value } : null))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {editingSlot.mode === 'edit' &&
                  (editingSlot.StartTime !== editingSlot.OriginalStartTime ||
                    editingSlot.EndTime !== editingSlot.OriginalEndTime) && (
                    <div className="pt-1 flex flex-col gap-1.5 text-[11px] text-emerald-950">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="radio"
                          checked={editingSlot.UpdateTimeScope === 'row'}
                          onChange={() =>
                            setEditingSlot(prev =>
                              prev ? { ...prev, UpdateTimeScope: 'row' } : null
                            )
                          }
                        />
                        <span>تحديث هذا الوقت لجميع الفصول في نفس الصف الزمني</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="radio"
                          checked={editingSlot.UpdateTimeScope === 'single'}
                          onChange={() =>
                            setEditingSlot(prev =>
                              prev ? { ...prev, UpdateTimeScope: 'single' } : null
                            )
                          }
                        />
                        <span>تحديث وقت هذه الحصة فقط</span>
                      </label>
                    </div>
                  )}
              </div>

              {/* Subject Color Picker in Edit Modal (Task 5) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-600" />
                    <span>لون المادة (الأصلي افتراضياً):</span>
                  </span>
                  {editingSlot.CustomColor && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSlot(prev => (prev ? { ...prev, CustomColor: '' } : null))
                      }
                      className="text-[11px] text-amber-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة اللون الأصلي</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SUBJECT_COLOR_PRESETS.map(preset => {
                    const isSelected = editingSlot.CustomColor === preset.hex;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setEditingSlot(prev =>
                            prev ? { ...prev, CustomColor: preset.hex } : null
                          )
                        }
                        style={{
                          backgroundColor: preset.hex || '#d9ceb8',
                          color: preset.textHex,
                        }}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-transform ${
                          isSelected
                            ? 'ring-2 ring-emerald-700 scale-110 border-slate-900'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        title={preset.name}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                  <input
                    type="color"
                    value={editingSlot.CustomColor || '#d9ceb8'}
                    onChange={e =>
                      setEditingSlot(prev =>
                        prev ? { ...prev, CustomColor: e.target.value } : null
                      )
                    }
                    className="w-8 h-7 rounded cursor-pointer border border-slate-300"
                    title="اختيار لون مخصص"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingSlot.mode === 'edit' && editingSlot.scheduleId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذه الحصة من الجدول؟')) {
                        DataStore.deleteSchedule(editingSlot.scheduleId!);
                        setEditingSlot(null);
                        onRefresh();
                        showToast('تم حذف الحصة الدراسية.');
                      }
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحصة</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer shadow-md"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. QUICK EDIT ENTIRE TIME ROW MODAL                                   */}
      {/* ===================================================================== */}
      {editingTimeRow && canManage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-serif">
                <Clock className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-slate-900">
                  تعديل توقيت الصف الزمني بالكامل
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTimeRow(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-serif">
              <div>
                <label className="block font-bold text-slate-700 mb-1">وقت البدء الجديد</label>
                <input
                  type="time"
                  value={editingTimeRow.newStart}
                  onChange={e =>
                    setEditingTimeRow(prev => (prev ? { ...prev, newStart: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">وقت الانتهاء الجديد</label>
                <input
                  type="time"
                  value={editingTimeRow.newEnd}
                  onChange={e =>
                    setEditingTimeRow(prev => (prev ? { ...prev, newEnd: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-serif text-xs">
              <button
                type="button"
                onClick={() => setEditingTimeRow(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const divClassIds = allClassesInDivision.map(c => c.ClassID);
                  DataStore.updateTimeSlotAcrossRow({
                    oldStartTime: editingTimeRow.oldStart,
                    oldEndTime: editingTimeRow.oldEnd,
                    newStartTime: editingTimeRow.newStart,
                    newEndTime: editingTimeRow.newEnd,
                    day: editingTimeRow.day,
                    classIds: divClassIds,
                  });
                  setEditingTimeRow(null);
                  onRefresh();
                  showToast('تم تحديث توقيت الصف الزمني لجميع الفصول بنجاح!');
                }}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer"
              >
                حفظ التوقيت الجديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. DRAG-AND-DROP TEACHER CONFLICT WARNING MODAL (Task 4)              */}
      {/* ===================================================================== */}
      {pendingDropConflict && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-500 space-y-4"
            dir="rtl"
          >
            <div className="flex items-center gap-3 text-amber-900">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black font-serif text-slate-950">
                  تنبيه تضارب في موعد الأستاذ!
                </h3>
                <p className="text-xs font-serif text-slate-600">
                  الأستاذ مرتبط بحصة أخرى في نفس اليوم والتوقيت المستهدف
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs font-serif text-amber-950">
              {pendingDropConflict.conflicts.map((c, idx) => (
                <div key={idx} className="leading-relaxed">
                  &bull; الأستاذ <span className="font-black underline">{c.teacherName}</span> لديه
                  حصة <span className="font-black">({c.conflictSubjectName})</span> يوم{' '}
                  <span className="font-bold">{c.day}</span> الساعة{' '}
                  <span className="font-mono font-bold" dir="ltr">
                    {c.time}
                  </span>{' '}
                  في فصل <span className="font-black">({c.conflictClassName})</span>.
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 font-serif text-xs">
              <button
                type="button"
                onClick={() => setPendingDropConflict(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black cursor-pointer"
              >
                إلغاء النقل (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmForceDrop}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black shadow cursor-pointer"
              >
                متابعة ونقل على أي حال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. SUBJECT COLOR CUSTOMIZER MODAL (Task 5)                            */}
      {/* ===================================================================== */}
      {isColorModalOpen && canManage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[88vh] flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-serif">
                    تخصيص ألوان المواد الدراسية
                  </h3>
                  <p className="text-xs text-slate-500 font-serif">
                    اختر لوناً مخصصاً لأي مادة أو استعد التصميم الأصلي الافتراضي بنقرة واحدة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    DataStore.resetSubjectColors();
                    setSubjectColors({});
                    onRefresh();
                    showToast('تمت استعادة الألوان الأصلية الافتراضية لجميع المواد.');
                  }}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-serif font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الألوان الأصلية (Original)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsColorModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {uniqueSubjectNamesInDivision.map(subName => {
                const currentHex = subjectColors[subName] || '';
                const textHex = currentHex ? getContrastTextColor(currentHex) : '#0f172a';
                return (
                  <div
                    key={subName}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl border border-slate-200 bg-slate-50/70"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{
                          backgroundColor: currentHex || '#d9ceb8',
                          color: textHex,
                        }}
                        className="px-3.5 py-1.5 rounded-xl font-serif font-black text-xs border border-slate-300 min-w-[100px] text-center shadow-2xs"
                      >
                        {subName}
                      </span>
                      <span className="text-[11px] font-serif text-slate-500">
                        {currentHex ? 'لون مخصص' : 'اللون الأصلي الافتراضي'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {SUBJECT_COLOR_PRESETS.slice(0, 9).map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            DataStore.setSubjectColor(subName, preset.hex);
                            setSubjectColors(DataStore.getSubjectColors());
                          }}
                          style={{
                            backgroundColor: preset.hex || '#d9ceb8',
                          }}
                          className={`w-6 h-6 rounded-lg border cursor-pointer ${
                            currentHex === preset.hex
                              ? 'ring-2 ring-emerald-700 border-slate-900 scale-110'
                              : 'border-slate-300'
                          }`}
                          title={preset.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={currentHex || '#d9ceb8'}
                        onChange={e => {
                          DataStore.setSubjectColor(subName, e.target.value);
                          setSubjectColors(DataStore.getSubjectColors());
                        }}
                        className="w-7 h-6 rounded cursor-pointer border border-slate-300"
                        title="اختيار أي لون"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-serif font-black cursor-pointer"
              >
                تم (إغلاق)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. FLOATING TEACHER HOVER TOOLTIP (Screen Only)                       */}
      {/* ===================================================================== */}
      {hoveredTeacher && !draggedSlot && (
        <div
          className="fixed z-40 pointer-events-none transition-all no-print"
          style={{
            top: Math.max(10, Math.min(hoveredTeacher.y, typeof window !== 'undefined' ? window.innerHeight - 240 : 400)),
            left: Math.max(10, Math.min(hoveredTeacher.x, typeof window !== 'undefined' ? window.innerWidth - 300 : 400)),
          }}
          dir="rtl"
        >
          <div className="w-64 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 space-y-2 text-xs font-serif">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <div className="font-black text-amber-300 text-sm">
                  {hoveredTeacher.subject.SubjectArabic || hoveredTeacher.subject.SubjectClass}
                </div>
                <div className="text-slate-300 font-bold">
                  الأستاذ: {hoveredTeacher.teacher.NameArabic || hoveredTeacher.teacher.Name}
                </div>
              </div>
              {hoveredTeacher.classItem && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-800 text-emerald-100 font-bold text-[11px]">
                  {getShortClassCode(hoveredTeacher.classItem)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>
                التوقيت: <span className="font-mono text-amber-200">{hoveredTeacher.schedule.StartTime} - {hoveredTeacher.schedule.EndTime}</span>
              </div>
              <div>القاعة: {hoveredTeacher.schedule.Room}</div>
            </div>
            {canManage && (
              <div className="text-[10px] text-emerald-300 pt-1 border-t border-slate-800">
                اضغط للتعديل أو اسحب الخلية لتغيير الوقت
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
