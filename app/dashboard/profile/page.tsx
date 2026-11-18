'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { UserSession, TeacherItem, StudentItem } from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import StudentGradeView from '../grades/StudentGradeView';
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
  const [profileTab, setProfileTab] = useState<'profile' | 'grades'>('profile');

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
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-800" />
            <span>Personal & Academic Profile</span>
          </h1>
          <p className="text-sm text-slate-500">
            Manage your official identity credentials, Arabic typography, and profile summary.
          </p>
        </div>

        {(currentUser?.role === 'teacher' || currentUser?.role === 'ssg' || currentUser?.role === 'student') && (
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setProfileTab('profile')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                profileTab === 'profile'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile (الملف الشخصي)</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileTab('grades')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                profileTab === 'grades'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {currentUser.role === 'teacher'
                  ? 'Grades (رصد الدرجات)'
                  : currentUser.role === 'ssg'
                  ? 'Grades (الدرجات والنشاط)'
                  : 'Grades (الدرجات الأكاديمية)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {profileTab === 'grades' && (currentUser?.role === 'teacher' || currentUser?.role === 'ssg' || currentUser?.role === 'student') ? (
        <div className="space-y-6">
          {currentUser.role === 'teacher' && (() => {
            const allSubs = DataStore.getSubjects();
            const allCls = DataStore.getClasses();
            const allMappings = DataStore.getSubjectTeachers().filter(st => st.TeacherID === currentUser.linkedId);
            const assigned = allMappings
              .map(m => ({
                subject: allSubs.find(s => s.SubjectID === m.SubjectID && s.ClassID === m.ClassID),
                classItem: allCls.find(c => c.ClassID === m.ClassID),
              }))
              .filter((x): x is { subject: NonNullable<typeof x.subject>; classItem: NonNullable<typeof x.classItem> } => Boolean(x.subject && x.classItem));

            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-700" />
                      <span>My Assigned Subjects & Grade Entry (المواد المسندة ورصد الدرجات)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Open the Grades portal to enter criteria scores, download/upload RTL Excel templates, and submit Dawr grades.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/grades"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 self-start"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open Gradebook (فتح سجل الدرجات)</span>
                  </Link>
                </div>

                {assigned.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No subjects assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assigned.map(({ subject, classItem }) => (
                      <Link
                        key={`${classItem.ClassID}-${subject.SubjectID}`}
                        href="/dashboard/grades"
                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {subject.SubjectArabic || subject.SubjectClass}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {classItem.ClassName} &bull; {classItem.Department}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold">
                          Enter Grades
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {(currentUser.role === 'ssg' || currentUser.role === 'student') && (() => {
            const allStds = DataStore.getStudents();
            const myStd =
              allStds.find(s => s.StudentID === currentUser.linkedId) ||
              (currentUser.role === 'ssg' ? allStds.find(s => s.IsSSG || s.RollNo === 'SSG101') : undefined) ||
              allStds[0];
            return (
              <div className="space-y-4">
                {currentUser.role === 'ssg' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
                        <Award className="w-4 h-4 text-rose-700" />
                        <span>SSG Officer Nashat Gradebook (رصد درجات النشاط)</span>
                      </h3>
                      <p className="text-xs text-rose-800 mt-0.5">
                        Manage and submit النشاط (Nashat) scores for all classes.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/grades"
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 self-start"
                    >
                      <Award className="w-4 h-4" />
                      <span>Open Nashat Grades</span>
                    </Link>
                  </div>
                )}
                {myStd && (
                  <StudentGradeView
                    student={myStd}
                    classes={DataStore.getClasses()}
                    subjects={DataStore.getSubjects()}
                    teachers={DataStore.getTeachers()}
                    subjectTeachers={DataStore.getSubjectTeachers()}
                    grades={DataStore.getGrades()}
                    allStudents={allStds}
                  />
                )}
              </div>
            );
          })()}
        </div>
      ) : (
      <>

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
      {/* STUDENT PROFILE ACADEMIC GRADES & DAWR CARDS                              */}
      {/* ========================================================================= */}
      {currentUser?.role === 'student' && (() => {
        const allStds = DataStore.getStudents();
        const myStd =
          allStds.find(s => s.StudentID === currentUser.linkedId) || allStds[0];
        if (!myStd) return null;
        return (
          <div className="pt-4 border-t border-[#dfd4b8] space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#126b38]" />
              <span>My Academic Grades (الدرجات الأكاديمية للطالب)</span>
            </h2>
            <StudentGradeView
              student={myStd}
              classes={DataStore.getClasses()}
              subjects={DataStore.getSubjects()}
              teachers={DataStore.getTeachers()}
              subjectTeachers={DataStore.getSubjectTeachers()}
              grades={DataStore.getGrades()}
              allStudents={allStds}
            />
          </div>
        );
      })()}
      </>
      )}
    </div>
  );
}
