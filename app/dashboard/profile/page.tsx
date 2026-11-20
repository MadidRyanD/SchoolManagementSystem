'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { UserSession } from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import {
  User,
  CheckCircle,
  Camera,
  FileBadge,
  AlertCircle,
  Lock,
} from 'lucide-react';

const MAX_STUDENT_PROFILE_EDITS = 2;

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

  // Student personal information edit counter (max 2 edits allowed)
  const [studentEditCount, setStudentEditCount] = useState<number>(0);

  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    } else if (session.role === 'student' || session.role === 'ssg') {
      const allStudents = DataStore.getStudents();
      const std =
        allStudents.find(s => s.StudentID === session.linkedId) ||
        (session.role === 'ssg' ? allStudents.find(s => s.IsSSG) : undefined) ||
        allStudents[0];
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
        setStudentEditCount(std.ProfileEditCount || 0);
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

  const isStudentRole = currentUser?.role === 'student' || currentUser?.role === 'ssg';
  const isStudentEditLocked = isStudentRole && studentEditCount >= MAX_STUDENT_PROFILE_EDITS;
  const remainingStudentEdits = Math.max(0, MAX_STUDENT_PROFILE_EDITS - studentEditCount);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    setMsg(null);

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
    } else if (currentUser.role === 'student' || currentUser.role === 'ssg') {
      const allStudents = DataStore.getStudents();
      const std =
        allStudents.find(s => s.StudentID === currentUser.linkedId) ||
        (currentUser.role === 'ssg' ? allStudents.find(s => s.IsSSG) : undefined) ||
        allStudents[0];

      const currentCount = std?.ProfileEditCount ?? studentEditCount;
      if (currentCount >= MAX_STUDENT_PROFILE_EDITS) {
        setStudentEditCount(currentCount);
        setErrorMsg(
          'Edit limit reached: Personal information for students can only be edited twice (2/2 used). Please contact the Admin or Principal for further changes.'
        );
        return;
      }

      const nextCount = currentCount + 1;
      if (std) {
        DataStore.saveStudent({
          ...std,
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
          ProfileEditCount: nextCount,
        });
      }
      setStudentEditCount(nextCount);

      AuthService.setSession({
        ...currentUser,
        name: nameEn,
        nameArabic: nameAr,
        email,
        profilePic,
      });

      const left = Math.max(0, MAX_STUDENT_PROFILE_EDITS - nextCount);
      setMsg(
        left > 0
          ? `Personal profile updated! You have ${left} of ${MAX_STUDENT_PROFILE_EDITS} personal information edit remaining.`
          : `Personal profile updated (${nextCount}/${MAX_STUDENT_PROFILE_EDITS})! You have used all 2 allowed edits and your profile is now locked.`
      );
      setTimeout(() => setMsg(null), 5000);
      return;
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
            <span>Personal &amp; Academic Profile</span>
          </h1>
          <p className="text-sm text-slate-500">
            Manage your official identity credentials, Arabic typography, and profile summary.
          </p>
        </div>

        {/* Student 2-Edit Limit Badge */}
        {isStudentRole && (
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-extrabold self-start ${
              isStudentEditLocked
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isStudentEditLocked
                ? `Edit Limit Reached (${studentEditCount}/${MAX_STUDENT_PROFILE_EDITS} Edits Used)`
                : `Edits Allowed: ${remainingStudentEdits} of ${MAX_STUDENT_PROFILE_EDITS} Remaining (${toHindiNumerals(remainingStudentEdits)}/${toHindiNumerals(MAX_STUDENT_PROFILE_EDITS)})`}
            </span>
          </div>
        )}
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
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
            {!isStudentEditLocked && (
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
            )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900">
              Update Personal &amp; Contact Information
            </h2>
            {isStudentRole && (
              <span className="text-xs font-bold text-slate-500">
                Edits Used: {studentEditCount} / {MAX_STUDENT_PROFILE_EDITS}
              </span>
            )}
          </div>

          {isStudentEditLocked && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Personal Information Locked (Maximum 2 Edits Reached)</p>
                <p className="mt-0.5">
                  Personal information for students can only be edited twice ({MAX_STUDENT_PROFILE_EDITS}/{MAX_STUDENT_PROFILE_EDITS} used). Please contact the Principal or System Administrator if you need any further corrections.
                </p>
              </div>
            </div>
          )}

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
                  disabled={isStudentEditLocked}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  disabled={isStudentEditLocked}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif text-right disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select
                  disabled={isStudentEditLocked}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  disabled={isStudentEditLocked}
                  value={tribe}
                  onChange={(e) => setTribe(e.target.value)}
                  placeholder="e.g. Bani Hashim"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nationality *</label>
                <input
                  type="text"
                  required
                  disabled={isStudentEditLocked}
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  disabled={isStudentEditLocked}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Place of Birth *</label>
                <input
                  type="text"
                  required
                  disabled={isStudentEditLocked}
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="e.g. Riyadh, Damascus, Cairo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Optional / Contact Info */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Contact Details &amp; Address (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled={isStudentEditLocked}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    disabled={isStudentEditLocked}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  disabled={isStudentEditLocked}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Profile Picture URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo URL</label>
              <input
                type="url"
                disabled={isStudentEditLocked}
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={isStudentEditLocked}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                {isStudentEditLocked
                  ? 'Editing Locked (2/2 Edits Used)'
                  : isStudentRole
                  ? `Save Profile Updates (${remainingStudentEdits} Edit${remainingStudentEdits === 1 ? '' : 's'} Left)`
                  : 'Save Profile Updates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
