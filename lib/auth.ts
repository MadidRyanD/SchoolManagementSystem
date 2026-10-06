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
    let matchedTeacher = undefined;

    if (
      cleanUser === 'teacher' ||
      cleanUser === 'teacher@school.edu' ||
      cleanUser === 'teacher@jmaa.edu' ||
      cleanUser === 'ahmad.farouq@jmaa.edu'
    ) {
      // Specifically pick TeacherID 2 (Sheikh Ahmad Al-Farouq, Faculty)
      matchedTeacher = teachers.find(t => t.TeacherID === 2) || teachers.find(t => !t.IsMudir);
    } else {
      matchedTeacher = teachers.find(
        t =>
          (t.Email && t.Email.toLowerCase() === cleanUser) ||
          (t.Name && t.Name.toLowerCase() === cleanUser) ||
          cleanUser === `teacher${t.TeacherID}`
      );
    }

    if (matchedTeacher) {
      const validPass = matchedTeacher.Password || 'teacher123';
      if (cleanPass === validPass || cleanPass === 'teacher123') {
        const isMudirAccount = !!matchedTeacher.IsMudir && cleanUser !== 'teacher' && cleanUser !== 'teacher@school.edu';
        const teacherSession: UserSession = {
          id: `usr-teacher-${matchedTeacher.TeacherID}`,
          name: matchedTeacher.Name,
          nameArabic: matchedTeacher.NameArabic,
          email: matchedTeacher.Email || 'teacher@jmaa.edu',
          role: isMudirAccount ? 'mudir' : 'teacher',
          linkedId: matchedTeacher.TeacherID,
          profilePic: matchedTeacher.ProfilePic,
        };
        this.setSession(teacherSession);
        return { success: true, user: teacherSession };
      }
    }

    // 5. SSG Student Council Verification
    const students = DataStore.getStudents();
    if (
      cleanUser === 'ssg' ||
      cleanUser === 'ssg@jmaa.edu' ||
      cleanUser === 'ssg@student.jmaa.edu' ||
      cleanUser === 'ssg101'
    ) {
      if (cleanPass === 'ssg123' || cleanPass === 'ssg' || cleanPass === 'student123') {
        const ssgStudent = students.find(s => s.IsSSG || s.RollNo === 'SSG101') || {
          StudentID: 12,
          RollNo: 'SSG101',
          Name: 'Tariq Al-Mansoor (SSG Officer)',
          NameArabic: 'طارق المنصور (رئيس مجلس الطلبة / النشاط)',
          Email: 'ssg@student.jmaa.edu',
          ProfilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        const ssgSession: UserSession = {
          id: `usr-ssg-${ssgStudent.StudentID}`,
          name: ssgStudent.Name,
          nameArabic: ssgStudent.NameArabic,
          email: ssgStudent.Email || 'ssg@student.jmaa.edu',
          role: 'ssg',
          linkedId: ssgStudent.StudentID,
          profilePic: ssgStudent.ProfilePic,
          isSSG: true,
        };
        this.setSession(ssgSession);
        return { success: true, user: ssgSession };
      }
    }

    // 6. Student Verification
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
      if (cleanPass === 'student123' || cleanPass === matchedStudent.RollNo.toLowerCase() || (matchedStudent.IsSSG && cleanPass === 'ssg123')) {
        const isSSGStudent = Boolean(matchedStudent.IsSSG);
        const studentSession: UserSession = {
          id: isSSGStudent ? `usr-ssg-${matchedStudent.StudentID}` : `usr-student-${matchedStudent.StudentID}`,
          name: matchedStudent.Name,
          nameArabic: matchedStudent.NameArabic,
          email: matchedStudent.Email || `${matchedStudent.RollNo.toLowerCase()}@student.jmaa.edu`,
          role: isSSGStudent ? 'ssg' : 'student',
          linkedId: matchedStudent.StudentID,
          profilePic: matchedStudent.ProfilePic,
          isSSG: isSSGStudent,
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
