import { UserSession, UserRole } from './types';
import { DataStore } from './store';

const SESSION_KEY = 'jmaa_session';

export const AuthService = {
  login(usernameOrEmail: string, password: string): { success: boolean; user?: UserSession; error?: string } {
    const cleanUser = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Username/Email and Password are required.' };
    }

    // 1. Super Admin
    if (
      (cleanUser === 'admin' || cleanUser === 'admin@jmaa.edu') &&
      (cleanPass === 'admin123' || cleanPass === 'admin')
    ) {
      const adminSession: UserSession = {
        id: 'usr-admin-1',
        name: 'System Administrator (Al-Mushrif)',
        nameArabic: 'المشرف العام على النظام',
        email: 'admin@jmaa.edu',
        role: 'admin',
      };
      this.setSession(adminSession);
      return { success: true, user: adminSession };
    }

    // 2. Mudir / Principal / Dean (Amid)
    if (
      (cleanUser === 'mudir' || cleanUser === 'mudir@jmaa.edu' || cleanUser === 'dean' || cleanUser === 'amid') &&
      (cleanPass === 'mudir123' || cleanPass === 'mudir')
    ) {
      const mudir = DataStore.getTeachers().find(t => t.IsMudir) || DataStore.getTeachers()[0];
      const mudirSession: UserSession = {
        id: `usr-mudir-${mudir.TeacherID}`,
        name: mudir.Name,
        nameArabic: mudir.NameArabic || 'د. منيب الكزبري',
        email: mudir.Email || 'mudir@jmaa.edu',
        role: 'mudir',
        linkedId: mudir.TeacherID,
        profilePic: mudir.ProfilePic,
      };
      this.setSession(mudirSession);
      return { success: true, user: mudirSession };
    }

    // 3. Cashier / Finance
    if (
      (cleanUser === 'cashier' || cleanUser === 'cashier@jmaa.edu' || cleanUser === 'finance') &&
      (cleanPass === 'cashier123' || cleanPass === 'cashier')
    ) {
      const cashierSession: UserSession = {
        id: 'usr-cashier-1',
        name: 'Ustadh Kamal Al-Maliki (Chief Cashier)',
        nameArabic: 'أستاذ كمال المالكي (أمين الصندوق)',
        email: 'cashier@jmaa.edu',
        role: 'cashier',
      };
      this.setSession(cashierSession);
      return { success: true, user: cashierSession };
    }

    // 4. Teacher Verification
    const teachers = DataStore.getTeachers();
    const matchedTeacher = teachers.find(
      t =>
        (t.Email && t.Email.toLowerCase() === cleanUser) ||
        (t.Name && t.Name.toLowerCase() === cleanUser) ||
        cleanUser === `teacher${t.TeacherID}` ||
        cleanUser === 'teacher' ||
        cleanUser === 'teacher@school.edu'
    );

    if (matchedTeacher) {
      const validPass = matchedTeacher.Password || 'teacher123';
      if (cleanPass === validPass || cleanPass === 'teacher123') {
        const teacherSession: UserSession = {
          id: `usr-teacher-${matchedTeacher.TeacherID}`,
          name: matchedTeacher.Name,
          nameArabic: matchedTeacher.NameArabic,
          email: matchedTeacher.Email || 'teacher@jmaa.edu',
          role: matchedTeacher.IsMudir ? 'mudir' : 'teacher',
          linkedId: matchedTeacher.TeacherID,
          profilePic: matchedTeacher.ProfilePic,
        };
        this.setSession(teacherSession);
        return { success: true, user: teacherSession };
      }
    }

    // 5. Student Verification
    const students = DataStore.getStudents();
    const matchedStudent = students.find(
      s =>
        s.RollNo.toLowerCase() === cleanUser ||
        s.Name.toLowerCase() === cleanUser ||
        (s.Email && s.Email.toLowerCase() === cleanUser) ||
        cleanUser === 'student' ||
        cleanUser === 'student@jmaa.edu' ||
        cleanUser === 'r101'
    );

    if (matchedStudent) {
      if (cleanPass === 'student123' || cleanPass === matchedStudent.RollNo.toLowerCase()) {
        const studentSession: UserSession = {
          id: `usr-student-${matchedStudent.StudentID}`,
          name: matchedStudent.Name,
          nameArabic: matchedStudent.NameArabic,
          email: matchedStudent.Email || `${matchedStudent.RollNo.toLowerCase()}@student.jmaa.edu`,
          role: 'student',
          linkedId: matchedStudent.StudentID,
          profilePic: matchedStudent.ProfilePic,
        };
        this.setSession(studentSession);
        return { success: true, user: studentSession };
      }
    }

    return { success: false, error: 'Invalid username or password. Please use one of the quick demo buttons below.' };
  },

  setSession(user: UserSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      document.cookie = `jmaa_role=${user.role}; path=/; max-age=86400`;
    } catch (e) {
      console.error('Session write error:', e);
    }
  },

  getSession(): UserSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SESSION_KEY);
      document.cookie = 'jmaa_role=; path=/; max-age=0';
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },
};
