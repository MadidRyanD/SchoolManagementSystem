'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { StudentItem, ClassItem } from '@/lib/types';
import { Award, Trophy, Medal, Star, GraduationCap, Building2, Crown } from 'lucide-react';

export default function HonorRollPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [topStudents, setTopStudents] = useState<{ student: StudentItem; avgGrade: number; rank: number }[]>([]);

  useEffect(() => {
    const cls = DataStore.getClasses();
    setClasses(cls);
    setTopStudents(DataStore.getTopStudents(selectedClassId === 0 ? undefined : selectedClassId));
  }, [selectedClassId]);

  const getClass = (cid: number) => classes.find(c => c.ClassID === cid);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-200 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4 text-amber-300" />
            Academic Distinction
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Honor Roll & Top Scholars (لوحة الشرف)
          </h1>
          <p className="mt-2 text-amber-100/90 text-sm sm:text-base">
            Recognizing the top academic performers across all levels of Jamiatu Monib Alkuzbary Al-Arabia.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
          <Trophy className="w-96 h-96" />
        </div>
      </div>

      {/* Class Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-500">Filter By Class Level:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white max-w-xs"
          >
            <option value={0}>All Classes (Overall Top Scholars)</option>
            {classes.map(c => (
              <option key={c.ClassID} value={c.ClassID}>
                [{c.Department.toUpperCase()}] {c.ClassName}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing top ranked students
        </span>
      </div>

      {/* Top 3 Podium Cards */}
      {topStudents.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Rank 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center flex flex-col items-center justify-between order-2 md:order-1">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-2 font-extrabold text-lg shadow-inner">
              2
            </div>
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-slate-300">
              {topStudents[1].student.ProfilePic ? (
                <img src={topStudents[1].student.ProfilePic} alt={topStudents[1].student.Name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {topStudents[1].student.Name[0]}
                </div>
              )}
            </div>
            <h3 className="font-extrabold text-base text-slate-900">{topStudents[1].student.Name}</h3>
            {topStudents[1].student.NameArabic && (
              <p className="text-xs text-amber-700 font-serif">{topStudents[1].student.NameArabic}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{getClass(topStudents[1].student.ClassID)?.ClassName}</p>
            <div className="mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold">
              Average: {topStudents[1].avgGrade}% (Mumtaz)
            </div>
          </div>

          {/* Rank 1 */}
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-400 p-6 shadow-md text-center flex flex-col items-center justify-between order-1 md:order-2 transform md:-translate-y-2">
            <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 mb-2 font-extrabold text-xl shadow">
              <Crown className="w-7 h-7 fill-slate-950" />
            </div>
            <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-4 border-amber-400 shadow">
              {topStudents[0].student.ProfilePic ? (
                <img src={topStudents[0].student.ProfilePic} alt={topStudents[0].student.Name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-200 flex items-center justify-center font-bold text-amber-900 text-xl">
                  {topStudents[0].student.Name[0]}
                </div>
              )}
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">{topStudents[0].student.Name}</h3>
            {topStudents[0].student.NameArabic && (
              <p className="text-sm text-amber-700 font-serif font-bold">{topStudents[0].student.NameArabic}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{getClass(topStudents[0].student.ClassID)?.ClassName}</p>
            <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold shadow-xs">
              Valedictorian: {topStudents[0].avgGrade}% (First Honor)
            </div>
          </div>

          {/* Rank 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center flex flex-col items-center justify-between order-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-2 font-extrabold text-lg shadow-inner">
              3
            </div>
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-amber-200">
              {topStudents[2].student.ProfilePic ? (
                <img src={topStudents[2].student.ProfilePic} alt={topStudents[2].student.Name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {topStudents[2].student.Name[0]}
                </div>
              )}
            </div>
            <h3 className="font-extrabold text-base text-slate-900">{topStudents[2].student.Name}</h3>
            {topStudents[2].student.NameArabic && (
              <p className="text-xs text-amber-700 font-serif">{topStudents[2].student.NameArabic}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{getClass(topStudents[2].student.ClassID)?.ClassName}</p>
            <div className="mt-3 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-extrabold">
              Average: {topStudents[2].avgGrade}% (Third Honor)
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900">Ranked Roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Scholar Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Awards & Recognitions</th>
                <th className="py-3 px-4 text-center">Score Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topStudents.map((item) => (
                <tr key={item.student.StudentID} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-extrabold text-xs ${
                        item.rank === 1
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : item.rank === 2
                          ? 'bg-slate-200 text-slate-700'
                          : item.rank === 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'text-slate-400 font-mono'
                      }`}
                    >
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-xs text-slate-600">{item.student.RollNo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.student.Name}
                    {item.student.NameArabic && (
                      <span className="text-xs text-amber-700 font-serif block font-normal">{item.student.NameArabic}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {getClass(item.student.ClassID)?.ClassName}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {item.student.Awards && item.student.Awards.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.student.Awards.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                      {item.avgGrade}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
