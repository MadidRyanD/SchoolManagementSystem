import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  initialSettings,
  initialClasses,
  initialTeachers,
  initialSubjects,
  initialSubjectTeachers,
  initialSchedules,
  initialStudents,
  buildInitialAccounts,
  initialCriteria,
  initialGrades,
  initialFeesSetting,
  initialPayments,
  initialPayroll,
  initialAnnouncements,
  initialForms,
} from '@/lib/store';
import { StudentEnrollmentRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB_VERSION = 'v3_roster_db_sync';
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'school-db.json');
const TMP_DB_PATH = path.join(os.tmpdir(), 'jmaa-school-db.json');

const LS_KEY_TO_DB_KEY: Record<string, string> = {
  jmaa_settings: 'settings',
  jmaa_classes: 'classes',
  jmaa_teachers: 'teachers',
  jmaa_subjects: 'subjects',
  jmaa_sub_teachers: 'subjectTeachers',
  jmaa_schedules: 'schedules',
  jmaa_students: 'students',
  jmaa_enrollments: 'enrollments',
  jmaa_accounts: 'accounts',
  jmaa_criteria: 'criteria',
  jmaa_grades: 'grades',
  jmaa_fees: 'fees',
  jmaa_payments: 'payments',
  jmaa_payroll: 'payroll',
  jmaa_announcements: 'announcements',
  jmaa_forms: 'forms',
  jmaa_teacher_attendance: 'teacherAttendance',
  jmaa_student_attendance: 'studentAttendance',
};

function buildInitialEnrollments(): StudentEnrollmentRecord[] {
  const seeded: StudentEnrollmentRecord[] = [];
  for (const s of initialStudents) {
    seeded.push({
      id: `enr-SY2025-2026-1st-${s.StudentID}`,
      StudentID: s.StudentID,
      AcademicYear: 'SY 2025-2026',
      Semester: '1st',
      ClassID: s.ClassID,
      RollNo: s.RollNo,
      Status: 'Active',
      EnrolledAt: s.AdmissionDate || '2025-09-01',
    });
    seeded.push({
      id: `enr-SY2025-2026-2nd-${s.StudentID}`,
      StudentID: s.StudentID,
      AcademicYear: 'SY 2025-2026',
      Semester: '2nd',
      ClassID: s.ClassID,
      RollNo: s.RollNo,
      Status: 'Active',
      EnrolledAt: s.AdmissionDate || '2026-01-15',
    });
  }
  return seeded;
}

function buildSeedDb(): Record<string, unknown> {
  return {
    version: DB_VERSION,
    updatedAt: new Date().toISOString(),
    settings: initialSettings,
    classes: initialClasses,
    teachers: initialTeachers,
    subjects: initialSubjects,
    subjectTeachers: initialSubjectTeachers,
    schedules: initialSchedules,
    students: initialStudents,
    enrollments: buildInitialEnrollments(),
    accounts: buildInitialAccounts(initialTeachers, initialStudents),
    criteria: initialCriteria,
    grades: initialGrades,
    fees: initialFeesSetting,
    payments: initialPayments,
    payroll: initialPayroll,
    announcements: initialAnnouncements,
    forms: initialForms,
    teacherAttendance: [],
    studentAttendance: [],
  };
}

function writeDbFile(db: Record<string, unknown>): void {
  const serialized = JSON.stringify(db);
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, serialized, 'utf8');
  } catch {
    // Fallback to OS temp dir on read-only serverless filesystems
    fs.writeFileSync(TMP_DB_PATH, serialized, 'utf8');
  }
}

function readDbFile(): Record<string, unknown> {
  const candidates = [TMP_DB_PATH, DB_PATH];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === DB_VERSION) {
          return parsed;
        }
      }
    } catch {
      // Try next candidate
    }
  }
  const seeded = buildSeedDb();
  writeDbFile(seeded);
  return seeded;
}

export async function GET() {
  try {
    const db = readDbFile();
    return NextResponse.json(db);
  } catch (error) {
    console.error('GET /api/db error:', error);
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key?: string; value?: unknown };
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }
    const dbKey = LS_KEY_TO_DB_KEY[key] || key;
    const db = readDbFile();
    db[dbKey] = value;
    db.updatedAt = new Date().toISOString();
    writeDbFile(db);
    return NextResponse.json({ ok: true, dbKey });
  } catch (error) {
    console.error('POST /api/db error:', error);
    return NextResponse.json({ error: 'Failed to write database' }, { status: 500 });
  }
}
