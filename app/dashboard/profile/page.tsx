'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { UserSession, TeacherItem, StudentItem, GradingPeriod, DawrDeadlineItem } from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import {
  User,
  CheckCircle,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Award,
  BookOpen,
  FileBadge,
  Clock,
  ShieldCheck,
  AlertCircle,
  Save,
  Lock,
  Unlock,
  Hourglass,
  Sparkles,
  Sliders,
  CalendarCheck,
  ListOrdered,
  AlertTriangle,
} from 'lucide-react';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Principal Grade Controls State
  const [editWindowHours, setEditWindowHours] = useState<number>(24);
  const [activeDawr, setActiveDawr] = useState<GradingPeriod>('1st');
  const [selectedDawrTab, setSelectedDawrTab] = useState<GradingPeriod>('1st');
  const [deadlines, setDeadlines] = useState<Partial<Record<GradingPeriod, DawrDeadlineItem>>>({});
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Profile Fields
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [gender, setGender] = useState('Male');
  const [tribe, setTribe] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [degree, setDegree] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [profilePic, setProfilePic] = useState('');

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const session = AuthService.getSession();
    if (!session) return;
    setCurrentUser(session);

    if (session.role === 'teacher' || session.role === 'mudir') {
      const tch = DataStore.getTeachers().find(t => t.TeacherID === session.linkedId) || DataStore.getTeachers()[0];
      if (tch) {
        setNameEn(tch.Name || '');
        setNameAr(tch.NameArabic || '');
        setGender(tch.Gender || 'Male');
        setTribe(tch.Tribe || 'Quraysh');
        setNationality(tch.Nationality || 'Arab');
        setBirthDate(tch.BirthDate || '1985-01-01');
        setBirthPlace(tch.BirthPlace || 'Riyadh');
        setAddress(tch.Address || '');
        setMobile(tch.MobileNumber || '');
        setEmail(tch.Email || '');
        setIdNumber(tch.IdNumber || 'TCH-001');
        setDegree(tch.Degree || 'M.A. in Islamic Studies');
        setAdmissionDate(tch.AdmissionDate || '2020-09-01');
        setRemarks(tch.Remarks || 'Senior Faculty Member');
        setProfilePic(tch.ProfilePic || '');
      }
    } else if (session.role === 'student') {
      const std = DataStore.getStudents().find(s => s.StudentID === session.linkedId) || DataStore.getStudents()[0];
      if (std) {
        setNameEn(std.Name || '');
        setNameAr(std.NameArabic || '');
        setGender(std.Gender || 'Male');
        setTribe(std.Tribe || 'Tamim');
        setNationality(std.Nationality || 'Saudi Arabia');
        setBirthDate(std.BirthDate || '2008-01-01');
        setBirthPlace(std.BirthPlace || 'Riyadh');
        setAddress(std.Address || '');
        setMobile(std.MobileNumber || '');
        setEmail(std.Email || '');
        setIdNumber(std.IdNumber || 'STD-2026');
        setDegree(`Student (Roll No: ${std.RollNo})`);
        setAdmissionDate(std.AdmissionDate || '2024-09-01');
        setRemarks(std.Remarks || 'Active Learner');
        setProfilePic(std.ProfilePic || '');
      }
    } else {
      setNameEn(session.name);
      setNameAr(session.nameArabic || 'المشرف');
      setEmail(session.email);
      setIdNumber('ADM-001');
      setDegree('System Administration');
      setAdmissionDate('2022-01-01');
      setRemarks('Administrator Access');
    }

    // Load Principal Grade Controls Settings
    const currentHours = DataStore.getGradeEditWindowHours();
    const currentActiveDawr = DataStore.getActiveGradingPeriod();
    const currentDeadlines = DataStore.getGradeSubmissionDeadlines();
    setEditWindowHours(currentHours);
    setActiveDawr(currentActiveDawr);
    setSelectedDawrTab(currentActiveDawr);
    setDeadlines(currentDeadlines);
  }, []);

  const DAWRS_LIST: { id: GradingPeriod; nameAr: string; nameEn: string; semester: string }[] = [
    { id: '1st', nameAr: 'الدور الأول', nameEn: '1st Dawr', semester: 'الفصل الأول' },
    { id: '2nd', nameAr: 'الدور الثاني', nameEn: '2nd Dawr', semester: 'الفصل الأول' },
    { id: '3rd', nameAr: 'الدور الثالث', nameEn: '3rd Dawr', semester: 'الفصل الأول' },
    { id: '4th', nameAr: 'الدور الرابع', nameEn: '4th Dawr', semester: 'الفصل الثاني' },
    { id: '5th', nameAr: 'الدور الخامس', nameEn: '5th Dawr', semester: 'الفصل الثاني' },
    { id: '6th', nameAr: 'الدور السادس', nameEn: '6th Dawr', semester: 'الفصل الثاني' },
  ];

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

  const handleSavePrincipalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Number(editWindowHours) > 0 ? Number(editWindowHours) : 24;
    DataStore.setGradeEditWindowHours(hours);
    DataStore.setActiveGradingPeriod(activeDawr);
    DataStore.setAllGradeSubmissionDeadlines(deadlines);

    setSettingsMsg('تم حفظ وتحديث مهلة تعديل الدرجات ومواعيد التسليم بنجاح وتطبيقها على الكادر التعليمي!');
    setTimeout(() => setSettingsMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (currentUser.role === 'teacher' || currentUser.role === 'mudir') {
      const tch = DataStore.getTeachers().find(t => t.TeacherID === currentUser.linkedId);
      if (tch) {
        DataStore.saveTeacher({
          ...tch,
          Name: nameEn,
          NameArabic: nameAr,
          Gender: gender,
          Tribe: tribe,
          Nationality: nationality,
          BirthDate: birthDate,
          BirthPlace: birthPlace,
          Address: address,
          MobileNumber: mobile,
          Email: email,
          ProfilePic: profilePic,
          Remarks: remarks,
        });
      }
    }

    // Update active session
    AuthService.setSession({
      ...currentUser,
      name: nameEn,
      nameArabic: nameAr,
      email,
      profilePic,
    });

    setMsg('Personal profile and academic record updated successfully!');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-800" />
          <span>Personal & Academic Profile</span>
        </h1>
        <p className="text-sm text-slate-500">
          Manage your official identity credentials, Arabic typography, and profile summary.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-emerald-700 shadow-md bg-slate-100 flex items-center justify-center">
              {profilePic ? (
                <img src={profilePic} alt={nameEn} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <label className="absolute bottom-1 right-1 p-2 bg-emerald-800 text-white rounded-xl shadow cursor-pointer hover:bg-emerald-700">
              <Camera className="w-4 h-4" />
              <input
                type="text"
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                placeholder="Paste Image URL"
                className="hidden"
              />
            </label>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              {currentUser?.role} Account
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">{nameEn}</h2>
            {nameAr && <p className="text-sm text-amber-700 font-serif font-bold mt-0.5">{nameAr}</p>}
            <p className="text-xs text-slate-500 mt-1 font-mono">ID: {idNumber}</p>
          </div>

          {/* Profile Summary Bio */}
          <div className="w-full text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <FileBadge className="w-4 h-4 text-emerald-700" />
              <span>Official Dossier Summary</span>
            </div>
            <p><span className="font-semibold text-slate-800">Tribe / Clan:</span> {tribe || 'Not specified'}</p>
            <p><span className="font-semibold text-slate-800">Nationality:</span> {nationality || 'Not specified'}</p>
            <p><span className="font-semibold text-slate-800">Birth Details:</span> {birthPlace} ({birthDate})</p>
            <p><span className="font-semibold text-slate-800">Academic Standing:</span> {degree}</p>
            <p><span className="font-semibold text-slate-800">Admission Date:</span> {admissionDate}</p>
            {remarks && <p className="italic text-slate-500 pt-1">&quot;{remarks}&quot;</p>}
          </div>
        </div>

        {/* Profile Editing Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Update Personal & Contact Information
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Required Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (English Format) *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (Arabic Format) *
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tribe / Clan (القبيلة) *</label>
                <input
                  type="text"
                  required
                  value={tribe}
                  onChange={(e) => setTribe(e.target.value)}
                  placeholder="e.g. Bani Hashim"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nationality *</label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Place of Birth *</label>
                <input
                  type="text"
                  required
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="e.g. Riyadh, Damascus, Cairo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            {/* Optional / Contact Info */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Contact Details & Address (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            {/* Profile Picture URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo URL</label>
              <input
                type="url"
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Profile Updates
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINCIPAL & ADMIN EXECUTIVE CONTROLS: TIME LOCK & SUBMISSION DEADLINES    */}
      {/* ========================================================================= */}
      {(currentUser?.role === 'mudir' || currentUser?.role === 'admin') && (
        <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
          {/* Card Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#cfc39f] shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#126b38] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black uppercase font-mono">
                    Executive Control &bull; صلاحيات المدير العام
                  </span>
                  <span className="text-xs text-slate-500 font-serif" dir="rtl">
                    إدارة الرصد والاعتماد
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>Grade Time Lock &amp; Faculty Submission Deadlines</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 font-serif" dir="rtl">
                  تحديد مهلة تعديل الدرجات بعد الاعتماد ومواعيد التسليم الرسمية للكادر التعليمي لكل دور من الأدوار الستة.
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

          {/* Feedback Message */}
          {settingsMsg && (
            <div className="p-4 bg-emerald-100 border-2 border-emerald-400 text-emerald-950 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs animate-in fade-in" dir="rtl">
              <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>{settingsMsg}</span>
            </div>
          )}

          {/* 1. Grade Edit Time Lock Window (Post-submission edit hours) */}
          <div className="bg-white rounded-2xl p-5 border border-[#cfc39f] shadow-xs space-y-4 text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 font-serif">
                    ١. مهلة تعديل الدرجات بعد الاعتماد (Post-Submission Edit Window)
                  </h3>
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

            {/* Quick Preset Buttons */}
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

                {/* Custom Input */}
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

            {/* Explanatory Policy Alert */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
              <Hourglass className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>آلية عمل مهلة التعديل:</strong> بمجرد قيام الأستاذ بحفظ واعتماد السجل لأول مرة، ينطلق عداد تنازلي مدته{' '}
                <strong className="text-[#126b38]">({toHindiNumerals(editWindowHours)} ساعة)</strong> يظهر في شاشته. خلال هذه المدة يمكنه مراجعة وتصحيح الدرجات بحرية. عند انتهائها، يقفل السجل تلقائياً ولا يمكن فتح التعديل إلا بطلب رسمي من الأستاذ يوافق عليه المدير.
              </div>
            </div>
          </div>

          {/* 2. Faculty Grade Submission Deadlines per Dawr */}
          <div className="bg-white rounded-2xl p-5 border border-[#cfc39f] shadow-xs space-y-5 text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#126b38] flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 font-serif">
                    ٢. مواعيد تسليم الدرجات الرسمية للكادر التعليمي (Deadlines per Dawr)
                  </h3>
                  <p className="text-xs text-slate-500 font-serif">
                    تحديد التاريخ والوقت النهائي المعتمد لتسليم كل دور وإلزام الأساتذة برفعه في الموعد
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
                const dItem = deadlines[d.id];
                const rem = calculateRemainingText(dItem?.deadlineIso);

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
                      <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" title="الدور الحالي النشط" />
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
                  {/* Banner with Active Dawr Switcher & Countdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
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

                    {/* Live Countdown Display */}
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

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Deadline Date & Time Picker */}
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
                      <span className="block text-[11px] text-slate-500 mt-1">
                        سيظهر هذا التاريخ في صفحة رصد الدرجات لكل أستاذ مع عد تنازلي حي.
                      </span>
                    </div>

                    {/* Strict Lock Enforce Toggle */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        سياسة إغلاق الرصد عند انتهاء الموعد
                      </label>
                      <div className="h-[42px] px-3.5 border border-slate-300 rounded-xl bg-white flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          قفل إجباري عند حلول الموعد (Enforce Hard Lock)
                        </span>
                        <input
                          type="checkbox"
                          checked={currentDawrItem.enforceLock ?? true}
                          onChange={e => updateCurrentDawrDeadline('enforceLock', e.target.checked)}
                          className="w-4 h-4 text-[#126b38] rounded-md focus:ring-emerald-600 cursor-pointer"
                        />
                      </div>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {currentDawrItem.enforceLock
                          ? 'نعم: سيتم منع أي إدخال أو تعديل جديد فور انقضاء التاريخ إلا بإذن خاص من المدير.'
                          : 'لا: يسمح بالإدخال المتأخر مع تسجيل تنبيه تأخير.'}
                      </span>
                    </div>
                  </div>

                  {/* Principal Instructions / Guidance for this Dawr */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      توجيهات وتعليمات المدير للكادر التعليمي لهذا الدور (Teacher Directives)
                    </label>
                    <textarea
                      rows={2}
                      value={currentDawrItem.instructions || ''}
                      onChange={e => updateCurrentDawrDeadline('instructions', e.target.value)}
                      placeholder="مثال: يرجى مراجعة وتدقيق درجات الدور الأول بعناية والتأكد من مطابقة دفاتر الحضور قبل الاعتماد النهائي..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-serif bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                    />
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      ستظهر هذه الملاحظة باللون الذهبي في شاشة الإكسل الخاصة بالأستاذ لتذكيره بالتعليمات الرسمية.
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* All Dawrs Overview Table */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-black text-slate-800 font-serif">
                ملخص جدول المواعيد لجميع الأدوار الستة (Overview Table):
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">الدور</th>
                      <th className="py-2.5 px-3">الفصل</th>
                      <th className="py-2.5 px-3">الموعد النهائي المحدد</th>
                      <th className="py-2.5 px-3">الوقت المتبقي</th>
                      <th className="py-2.5 px-3">القفل الإجباري</th>
                      <th className="py-2.5 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {DAWRS_LIST.map(d => {
                      const item = deadlines[d.id];
                      const rem = calculateRemainingText(item?.deadlineIso);
                      const isAct = activeDawr === d.id;

                      let formattedDate = '—';
                      if (item?.deadlineIso) {
                        try {
                          const dt = new Date(item.deadlineIso);
                          formattedDate = `${toHindiNumerals(dt.getFullYear())}/${toHindiNumerals(String(dt.getMonth() + 1).padStart(2, '0'))}/${toHindiNumerals(String(dt.getDate()).padStart(2, '0'))} ${toHindiNumerals(dt.getHours())}:${toHindiNumerals(String(dt.getMinutes()).padStart(2, '0'))}`;
                        } catch {
                          formattedDate = item.deadlineIso;
                        }
                      }

                      return (
                        <tr
                          key={d.id}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedDawrTab === d.id ? 'bg-emerald-50/60 font-bold' : ''
                          }`}
                          onClick={() => setSelectedDawrTab(d.id)}
                        >
                          <td className="py-2.5 px-3 font-serif font-black text-slate-900">
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleSavePrincipalSettings}
                className="px-6 py-2.5 bg-[#126b38] hover:bg-[#0e5830] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>حفظ وتطبيق المواعيد والمهل الزمنية (Save Deadlines)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
