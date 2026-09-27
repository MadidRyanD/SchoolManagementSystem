'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { ClassItem, TeacherItem, SubjectItem, SubjectTeacherItem, DepartmentType } from '@/lib/types';
import {
  Crown,
  Building2,
  Calendar,
  Users,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  UserCheck,
  ClipboardList,
  ArrowUpRight,
} from 'lucide-react';

export default function DepartmentsAndClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allocations, setAllocations] = useState<SubjectTeacherItem[]>([]);

  const currentUser = AuthService.getSession();
  const isTeacher = currentUser?.role === 'teacher';
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'mudir';

  const [activeTab, setActiveTab] = useState<'my-classes' | '5-days' | '2-days'>(
    isTeacher ? 'my-classes' : '5-days'
  );
  const [activeLevel, setActiveLevel] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // New Class Modal State (for Admin/Mudir)
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newDept, setNewDept] = useState<DepartmentType>('5-days');
  const [newLevel, setNewLevel] = useState('Ibtidaiyyah');
  const [newGrade, setNewGrade] = useState(1);
  const [newAdviserId, setNewAdviserId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClasses(DataStore.getClasses());
    setTeachers(DataStore.getTeachers());
    setSubjects(DataStore.getSubjects());
    setAllocations(DataStore.getSubjectTeachers());
  };

  const mudir = teachers.find(t => t.IsMudir) || teachers[0];

  const levels5Days = [
    'All',
    'Ibtidaiyyah',
    'Mutawassit',
    'Thanawi',
    'Kulliyatu Shariah',
    'Kulliyatu Dawa',
    'Kulliyatu Tarbiya',
  ];

  const levels2Days = [
    'All',
    'Ibtidaiyyah',
    'Mutawassit',
    'Thanawi',
    'Kulliyatu Tarbiyah',
  ];

  const availableLevels = activeTab === '2-days' ? levels2Days : levels5Days;

  // Teacher Assigned Classes
  const teacherId = currentUser?.linkedId || 2;
  const teacherSubjectIds = allocations.filter(a => a.TeacherID === teacherId).map(a => a.SubjectID);
  const teacherClassesFromSubjects = subjects.filter(s => teacherSubjectIds.includes(s.SubjectID)).map(s => s.ClassID);
  const myClassIds = Array.from(new Set([
    ...teacherClassesFromSubjects,
    ...classes.filter(c => c.AdviserID === teacherId).map(c => c.ClassID)
  ]));

  // Filter classes
  const filteredClasses = classes.filter(c => {
    if (activeTab === 'my-classes') {
      return myClassIds.includes(c.ClassID);
    }
    if (c.Department !== activeTab) return false;
    if (activeLevel !== 'All' && c.Level !== activeLevel) return false;
    return true;
  });

  const getAdviser = (adviserId?: number) => {
    if (!adviserId) return null;
    return teachers.find(t => t.TeacherID === adviserId);
  };

  const getClassFaculty = (classId: number) => {
    const classAllocs = allocations.filter(a => a.ClassID === classId);
    const result: { subject: SubjectItem; teacher: TeacherItem }[] = [];
    classAllocs.forEach(a => {
      const sub = subjects.find(s => s.SubjectID === a.SubjectID);
      const tch = teachers.find(t => t.TeacherID === a.TeacherID);
      if (sub && tch) {
        result.push({ subject: sub, teacher: tch });
      }
    });
    return result;
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    DataStore.saveClass({
      ClassName: newClassName.trim(),
      Department: newDept,
      Level: newLevel,
      YearGrade: Number(newGrade),
      AdviserID: newAdviserId ? Number(newAdviserId) : undefined,
    });

    setNewClassName('');
    setIsAddingClass(false);
    loadData();
  };

  const handleDeleteClass = (id: number) => {
    if (confirm('Are you sure you want to delete this class?')) {
      DataStore.deleteClass(id);
      if (selectedClass?.ClassID === id) setSelectedClass(null);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Teacher View vs Principal / Mudir View */}
      {isTeacher ? (
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-md bg-emerald-950 flex items-center justify-center flex-shrink-0">
              {currentUser?.profilePic ? (
                <img src={currentUser.profilePic} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-8 h-8 text-amber-300" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
                <span>Teacher Portal • فصولي وموادي المكلف بها</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                My Assigned Classes & Academic Levels
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                Assigned to: <span className="font-bold text-amber-300">{currentUser?.name}</span> &bull; {myClassIds.length} Classes assigned to your teaching schedule.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/grades"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Grade Management (Excel)</span>
            </Link>
            <Link
              href="/dashboard/schedules"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-600/40"
            >
              <Calendar className="w-4 h-4" />
              <span>My Timetable</span>
            </Link>
          </div>
        </div>
      ) : mudir ? (
        <div className="bg-gradient-to-r from-amber-700 via-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg bg-emerald-950 flex items-center justify-center">
                {mudir.ProfilePic ? (
                  <img src={mudir.ProfilePic} alt={mudir.Name} className="w-full h-full object-cover" />
                ) : (
                  <Crown className="w-10 h-10 text-amber-300" />
                )}
              </div>
              <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow" title="Head of Institution">
                <Crown className="w-4 h-4 fill-slate-950" />
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Principal & General Director (المُدير العام / العميد)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <span>{mudir.Name}</span>
                {mudir.NameArabic && <span className="text-amber-200 font-serif text-lg">({mudir.NameArabic})</span>}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                {mudir.Degree} &bull; {mudir.Remarks}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/schedules"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Inspect All Schedules</span>
            </Link>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsAddingClass(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-500/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Detail View of a Selected Class */}
      {selectedClass ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <button
              onClick={() => setSelectedClass(null)}
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Classes</span>
            </button>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/schedules?classId=${selectedClass.ClassID}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>View This Class Schedule</span>
              </Link>
              {canManage && (
                <button
                  onClick={() => handleDeleteClass(selectedClass.ClassID)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  title="Delete Class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class Info Box */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Class</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedClass.ClassName}</h3>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <p><span className="font-semibold text-slate-800">Department:</span> {selectedClass.Department.toUpperCase()}</p>
                <p><span className="font-semibold text-slate-800">Academic Level:</span> {selectedClass.Level}</p>
                <p><span className="font-semibold text-slate-800">Year / Grade:</span> Level {selectedClass.YearGrade}</p>
              </div>

              {/* Class Adviser Section */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Class Adviser</span>
                {selectedClass.AdviserID ? (
                  (() => {
                    const adv = getAdviser(selectedClass.AdviserID);
                    return adv ? (
                      <div className="mt-2 flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                          {adv.Name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{adv.Name}</p>
                          {adv.NameArabic && <p className="text-xs text-amber-700 font-serif">{adv.NameArabic}</p>}
                          <p className="text-[11px] text-slate-500">{adv.Email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">Adviser not found.</p>
                    );
                  })()
                ) : (
                  <p className="text-xs text-slate-400 mt-1 italic">No adviser assigned yet.</p>
                )}
              </div>
            </div>

            {/* Assigned Teachers & Subjects */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                  Assigned Faculty & Subjects
                </h4>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {getClassFaculty(selectedClass.ClassID).length} Teachers Assigned
                </span>
              </div>

              {getClassFaculty(selectedClass.ClassID).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No teachers or subjects allocated to this class yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getClassFaculty(selectedClass.ClassID).map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                            {item.subject.SubjectCode || 'Subject'}
                          </span>
                          <h5 className="font-bold text-sm text-slate-900">{item.subject.SubjectClass}</h5>
                        </div>
                        <span className="p-1 rounded bg-blue-100 text-blue-800">
                          <Users className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                          {item.teacher.Name[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.teacher.Name}</p>
                          {item.teacher.NameArabic && (
                            <p className="text-[10px] text-amber-700 font-serif truncate">{item.teacher.NameArabic}</p>
                          )}
                          <p className="text-[10px] text-slate-500 truncate">{item.teacher.Degree}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Main Classes Grid View */
        <div className="space-y-6">
          {/* Department / Scope Switcher Tabs */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-classes');
                    setActiveLevel('All');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'my-classes'
                      ? 'bg-[#187d44] text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>My Assigned Classes ({myClassIds.length})</span>
                  <span className="font-serif text-[11px] opacity-80" dir="rtl">(فصولي)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveTab('5-days');
                  setActiveLevel('All');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === '5-days'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>5-Days Department</span>
                <span className="text-[11px] opacity-80 font-serif ml-1">(القسم الصباحي)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('2-days');
                  setActiveLevel('All');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === '2-days'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>2-Days Department</span>
                <span className="text-[11px] opacity-80 font-serif ml-1">(نهاية الأسبوع)</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium px-3">
              Total: {filteredClasses.length} Classes
            </span>
          </div>

          {/* Academic Level Pills Filter (shown when viewing 5-days or 2-days) */}
          {activeTab !== 'my-classes' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {availableLevels.map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setActiveLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeLevel === lvl
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredClasses.map(cls => {
              const adviser = getAdviser(cls.AdviserID);
              const facultyCount = getClassFaculty(cls.ClassID).length;
              const teacherSubjectsInThisClass = isTeacher
                ? subjects.filter(s => s.ClassID === cls.ClassID && teacherSubjectIds.includes(s.SubjectID))
                : [];

              return (
                <div
                  key={cls.ClassID}
                  onClick={() => setSelectedClass(cls)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide">
                        {cls.Level}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Year {cls.YearGrade}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {cls.ClassName}
                    </h4>

                    {/* Teacher specific subject tag in this class */}
                    {teacherSubjectsInThisClass.length > 0 && (
                      <div className="mt-2.5 bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-xl p-2.5 text-xs">
                        <span className="font-bold text-[11px] text-emerald-800 uppercase tracking-wide block">
                          Your Assigned Subject:
                        </span>
                        <p className="font-bold font-serif text-slate-900 mt-0.5" dir="rtl">
                          {teacherSubjectsInThisClass.map(s => s.SubjectArabic || s.SubjectClass).join('، ')}
                        </p>
                      </div>
                    )}

                    {/* Adviser Indicator */}
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-700">Adviser:</span>
                        <span className="text-slate-900 truncate">
                          {adviser ? adviser.Name : <em className="text-slate-400 font-normal">None</em>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{facultyCount} Subjects Assigned</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span>Inspect Class & Faculty</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Class Modal for Admin/Mudir */}
      {isAddingClass && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Add New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Thanawi - Year 1-B"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as DepartmentType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="5-days">5-Days</option>
                    <option value="2-days">2-Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Grade / Year</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Ibtidaiyyah">Ibtidaiyyah</option>
                  <option value="Mutawassit">Mutawassit</option>
                  <option value="Thanawi">Thanawi</option>
                  <option value="Kulliyatu Shariah">Kulliyatu Shariah</option>
                  <option value="Kulliyatu Dawa">Kulliyatu Dawa</option>
                  <option value="Kulliyatu Tarbiya">Kulliyatu Tarbiya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Assign Adviser (Optional)</label>
                <select
                  value={newAdviserId || ''}
                  onChange={(e) => setNewAdviserId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">No Adviser</option>
                  {teachers.map(t => (
                    <option key={t.TeacherID} value={t.TeacherID}>{t.Name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow cursor-pointer"
                >
                  Create Class
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
