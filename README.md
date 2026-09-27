# Mithila English High School - Management System

A fullstack modern School Management System built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. Optimized for seamless deployment on **Vercel** with full database-to-UI implementation and robust multi-role authentication.

---

## 🚀 Live Vercel Deployment

This repository is pre-configured with `vercel.json` for zero-configuration deployment to Vercel:

### Option 1: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: Deploy via GitHub
1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: complete school management system with vercel readiness"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import this repository.
4. Click **Deploy**. Vercel will automatically detect the Next.js project and deploy it.

---

## 🔐 Bulletproof Login & Pre-configured Accounts

The login system supports three separate roles with session persistence, robust input validation, and instant one-click demo presets:

| Role | Username / Identifier | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` or `admin@school.edu` | `admin123` | Full access: Classes, Fees, Subjects, Faculty, Students, Exams, Attendance, Expenses |
| **Teacher** | `teacher@school.edu` | `teacher123` | Faculty access: Assigned Classes, Attendance taking, Marks entry |
| **Student** | `R101` or `student@school.edu` | `student123` | Student access: Class schedule, Grades, Academic standing |

---

## 📊 Database Schema Implementation (From `SQLQuery1.sql`)

All 10 core tables and their relational models from `SQLQuery1.sql` are implemented in `lib/types.ts` and managed through `lib/store.ts`:

1. **`Class`**: Class ID & Class Names (Grades 8, 9, 10, etc.).
2. **`Subject`**: Academic subjects mapped to class levels.
3. **`Student`**: Comprehensive student profiles (Roll No, Class, DOB, Gender, Phone, Address).
4. **`Teacher`**: Faculty directory with contact information and access credentials.
5. **`SubjectTeacher`**: Allocation of teachers to subjects and class grades.
6. **`TeacherAttendance`**: Daily staff presence and absence tracking.
7. **`StudentAttendance`**: Subject-wise daily student roll-call records.
8. **`Fees`**: Tuition and annual fee structures per class.
9. **`Exam`**: Examination scoring, marks recording, and automatic grade classification (A+, A, B, C, D, F).
10. **`Expense`**: School expenditure logging categorized by department and area.

---

## 🖥️ Local Development Setup

To run the application locally on your computer:

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:3000
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting Target**: [Vercel](https://vercel.com/)
