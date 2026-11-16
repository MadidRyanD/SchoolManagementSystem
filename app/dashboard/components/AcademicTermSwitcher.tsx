'use client';

import React, { useState } from 'react';
import { CalendarDays, Plus, Check, X } from 'lucide-react';
import { useAcademicTerm } from '@/lib/useAcademicTerm';

interface AcademicTermSwitcherProps {
  canAddYear?: boolean;
  compact?: boolean;
}

export default function AcademicTermSwitcher({
  canAddYear = false,
  compact = false,
}: AcademicTermSwitcherProps) {
  const { academicYear, semester, availableYears, setAcademicYear, setSemester, addAcademicYear } =
    useAcademicTerm();
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newYearInput.trim();
    if (!trimmed) return;
    addAcademicYear(trimmed);
    setNewYearInput('');
    setIsAddingYear(false);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${
        compact ? '' : 'bg-[#f8f5ec] border border-[#dfd4b8] rounded-2xl px-2.5 py-1 shadow-2xs'
      }`}
    >
      {/* Academic Year Selector */}
      <div className="flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5 text-[#126b38] shrink-0" />
        {isAddingYear ? (
          <form onSubmit={handleAddYear} className="flex items-center gap-1">
            <input
              type="text"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="SY 2027-2028"
              autoFocus
              className="w-28 px-2 py-0.5 text-xs font-bold border border-emerald-400 rounded-lg bg-white text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              className="p-1 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
              title="Add Academic Year"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingYear(false);
                setNewYearInput('');
              }}
              className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1">
            <select
              aria-label="Academic Year Switcher"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-white border border-[#ccbf99] text-slate-900 text-xs font-extrabold rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#126b38]/40 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            {canAddYear && (
              <button
                type="button"
                onClick={() => setIsAddingYear(true)}
                className="p-1 rounded-lg bg-[#dfd4b8] hover:bg-[#d1c39e] text-[#126b38] transition-colors cursor-pointer"
                title="Add New Academic Year"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <span className="hidden sm:inline-block h-4 w-px bg-[#ccbf99]" />

      {/* Semester Segmented Switcher */}
      <div
        role="group"
        aria-label="Semester Switcher"
        className="inline-flex items-center bg-[#dfd4b8]/70 p-0.5 rounded-xl border border-[#ccbf99]"
      >
        <button
          type="button"
          onClick={() => setSemester('1st')}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
            semester === '1st'
              ? 'bg-[#126b38] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          1st Sem <span className="hidden md:inline font-serif opacity-90">(ف١)</span>
        </button>
        <button
          type="button"
          onClick={() => setSemester('2nd')}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
            semester === '2nd'
              ? 'bg-[#9f7a28] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          2nd Sem <span className="hidden md:inline font-serif opacity-90">(ف٢)</span>
        </button>
      </div>
    </div>
  );
}
