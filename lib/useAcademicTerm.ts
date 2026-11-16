'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataStore } from './store';
import { SemesterType } from './types';

export const TERM_CHANGE_EVENT = 'jmaa-academic-term-changed';

export interface AcademicTermState {
  academicYear: string;
  semester: SemesterType;
  availableYears: string[];
}

export function dispatchAcademicTermChange(academicYear: string, semester: SemesterType) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TERM_CHANGE_EVENT, {
      detail: { academicYear, semester },
    })
  );
}

/**
 * Shared hook to read and switch the active Academic Year and Semester.
 * Automatically stays in sync across components in the same tab and across tabs.
 */
export function useAcademicTerm() {
  const [state, setState] = useState<AcademicTermState>(() => ({
    academicYear: DataStore.getActiveAcademicYear(),
    semester: DataStore.getActiveSemester(),
    availableYears: DataStore.getAvailableAcademicYears(),
  }));

  const refresh = useCallback(() => {
    setState({
      academicYear: DataStore.getActiveAcademicYear(),
      semester: DataStore.getActiveSemester(),
      availableYears: DataStore.getAvailableAcademicYears(),
    });
  }, []);

  useEffect(() => {
    refresh();

    const handleTermEvent = () => refresh();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'jmaa_settings') refresh();
    };

    window.addEventListener(TERM_CHANGE_EVENT, handleTermEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(TERM_CHANGE_EVENT, handleTermEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  const setAcademicYear = useCallback((year: string) => {
    DataStore.setActiveAcademicYear(year);
    const sem = DataStore.getActiveSemester();
    refresh();
    dispatchAcademicTermChange(year, sem);
  }, [refresh]);

  const setSemester = useCallback((sem: SemesterType) => {
    DataStore.setActiveSemester(sem);
    const year = DataStore.getActiveAcademicYear();
    refresh();
    dispatchAcademicTermChange(year, sem);
  }, [refresh]);

  const addAcademicYear = useCallback((year: string) => {
    const trimmed = year.trim();
    if (!trimmed) return;
    DataStore.addAcademicYear(trimmed);
    DataStore.setActiveAcademicYear(trimmed);
    const sem = DataStore.getActiveSemester();
    refresh();
    dispatchAcademicTermChange(trimmed, sem);
  }, [refresh]);

  return {
    academicYear: state.academicYear,
    semester: state.semester,
    availableYears: state.availableYears,
    setAcademicYear,
    setSemester,
    addAcademicYear,
  };
}
