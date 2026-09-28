'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import {
  GradingPeriod,
  StudentItem,
  ClassItem,
  TeacherItem,
  StudentPaymentLedger,
  TeacherPayrollItem,
  TuitionFeeSetting,
} from '@/lib/types';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  UserPlus,
  DollarSign,
  Clock,
  User,
  ShieldCheck,
  FileSpreadsheet,
  Check,
  X,
  CreditCard,
  FileCheck2
} from 'lucide-react';
import StudentExamReceipt from './StudentExamReceipt';
import StaffPayrollSlip from './StaffPayrollSlip';

export default function FinancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [payments, setPayments] = useState<StudentPaymentLedger[]>([]);
  const [payroll, setPayroll] = useState<TeacherPayrollItem[]>([]);
  const [feesSettings, setFeesSettings] = useState<TuitionFeeSetting[]>([]);

  const [activeTab, setActiveTab] = useState<'payments' | 'fees' | 'payroll' | 'enrollment'>('payments');
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<number | null>(null);
  const [paymentViewMode, setPaymentViewMode] = useState<'receipt' | 'table'>('receipt');

  // Hover popover for cashier payment info
  const [hoveredPayment, setHoveredPayment] = useState<{
    cashierName?: string;
    paidAt?: string;
    amount: number;
    studentName: string;
    period: string;
    x: number;
    y: number;
  } | null>(null);

  // Tuition setup form state
  const [feeForm, setFeeForm] = useState<Record<GradingPeriod, number>>({
    '1st': 300,
    '2nd': 300,
    '3rd': 300,
    '4th': 300,
    '5th': 300,
    '6th': 300,
  });

  // Enrollment Form State
  const [newStudent, setNewStudent] = useState({
    Name: '',
    NameArabic: '',
    RollNo: '',
    Gender: 'Male',
    Tribe: '',
    Nationality: 'Saudi Arabia',
    BirthDate: '2010-01-01',
    BirthPlace: 'Riyadh',
    ClassID: 1,
    MobileNumber: '',
    Address: '',
  });

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = AuthService.getSession();
  const role = currentUser?.role;
  const isCashierOrAdmin = role === 'cashier' || role === 'admin';
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isStaffSalary = role === 'teacher' || role === 'mudir';

  const gradingPeriods: GradingPeriod[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cls = DataStore.getClasses();
    const stds = DataStore.getStudents();
    const tchs = DataStore.getTeachers();
    setClasses(cls);
    setStudents(stds);
    setTeachers(tchs);
    setPayments(DataStore.getPayments());
    setPayroll(DataStore.getPayroll());
    setFeesSettings(DataStore.getFeesSettings());

    if (cls.length > 0 && selectedClassId === 0) {
      setSelectedClassId(cls[0].ClassID);
      const fs = DataStore.getFeesSettings().find(f => f.ClassID === cls[0].ClassID);
      if (fs) setFeeForm(fs.DawrAmount);
    }
  };

  const handleClassChange = (cid: number) => {
    setSelectedClassId(cid);
    const fs = feesSettings.find(f => f.ClassID === cid);
    if (fs) {
      setFeeForm(fs.DawrAmount);
    } else {
      setFeeForm({ '1st': 350, '2nd': 350, '3rd': 350, '4th': 350, '5th': 350, '6th': 350 });
    }
  };

  // Toggle or mark a Dawr payment
  const handleTogglePayment = (student: StudentItem, period: GradingPeriod, currentStatus: boolean) => {
    if (!isCashierOrAdmin) return;
    const newStatus = !currentStatus;
    const fs = feesSettings.find(f => f.ClassID === student.ClassID);
    const amount = fs ? fs.DawrAmount[period] || 300 : 300;

    const cashierName = currentUser?.name || 'Cashier Office';
    DataStore.markDawrPayment(student.StudentID, student.ClassID, period, newStatus, cashierName, amount);

    loadData();
    setMsg({
      type: 'success',
      text: `${student.Name}: ${period} Dawr marked as ${newStatus ? 'PAID' : 'UNPAID'} by ${cashierName}`,
    });
    setTimeout(() => setMsg(null), 3000);
  };

  // Save Tuition fees per Dawr
  const handleSaveFees = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.saveFeesSetting({
      ClassID: selectedClassId,
      DawrAmount: feeForm,
    });
    loadData();
    setMsg({ type: 'success', text: 'Tuition fees structure for all 6 Dawr periods updated!' });
    setTimeout(() => setMsg(null), 3000);
  };

  // Salary Payout
  const handlePaySalary = (prId: string, teacherName: string) => {
    const cashierName = currentUser?.name || 'Finance Office';
    DataStore.releaseSalary(prId, cashierName);
    loadData();
    setMsg({ type: 'success', text: `Salary released to ${teacherName} by ${cashierName}!` });
    setTimeout(() => setMsg(null), 3000);
  };

  // Enrollment submission
  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.Name.trim() || !newStudent.RollNo.trim()) return;

    DataStore.saveStudent({
      ...newStudent,
      ClassID: Number(newStudent.ClassID),
      IdNumber: `STD-2026-${Math.floor(100 + Math.random() * 900)}`,
      AdmissionDate: new Date().toISOString().split('T')[0],
    });

    setMsg({ type: 'success', text: `Student ${newStudent.Name} successfully enrolled!` });
    setNewStudent({
      Name: '',
      NameArabic: '',
      RollNo: '',
      Gender: 'Male',
      Tribe: '',
      Nationality: 'Saudi Arabia',
      BirthDate: '2010-01-01',
      BirthPlace: 'Riyadh',
      ClassID: classes[0]?.ClassID || 1,
      MobileNumber: '',
      Address: '',
    });
    loadData();
    setActiveTab('payments');
    setTimeout(() => setMsg(null), 3000);
  };

  // Excel Export
  const exportFinanceExcel = async () => {
    const XLSX = await import('xlsx');
    const exportData = students
      .filter(s => selectedClassId === 0 || s.ClassID === selectedClassId)
      .map(s => {
        const ledger = payments.find(p => p.StudentID === s.StudentID);
        const row: any = {
          'Roll No': s.RollNo,
          'Student Name': s.Name,
          'Class': classes.find(c => c.ClassID === s.ClassID)?.ClassName || s.ClassID,
        };
        gradingPeriods.forEach(p => {
          const rec = ledger?.Payments[p];
          row[`${p} Dawr`] = rec?.isPaid ? `PAID ($${rec.amount})` : 'UNPAID';
          row[`${p} Cashier`] = rec?.cashierName || '-';
          row[`${p} Paid At`] = rec?.paidAt || '-';
        });
        return row;
      });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tuition_Ledger');
    XLSX.writeFile(wb, `JMAA_Tuition_Ledger_Class_${selectedClassId || 'All'}.xlsx`);
  };

  // Filter students
  const filteredStudents = isStudent
    ? students.filter(s => s.StudentID === currentUser?.linkedId)
    : selectedClassId === 0
    ? students
    : students.filter(s => s.ClassID === selectedClassId);

  // Filter payroll for teachers
  const filteredPayroll = isTeacher
    ? payroll.filter(p => p.TeacherID === currentUser?.linkedId)
    : payroll;

  // 1. Staff Salary & Payroll Statement View (for Principal / Mudir and Teachers)
  if (isStaffSalary) {
    const staffMember =
      teachers.find((t) => t.TeacherID === currentUser?.linkedId) ||
      teachers.find((t) => t.Email === currentUser?.email) ||
      (role === 'mudir' ? teachers.find((t) => t.IsMudir) : null) ||
      teachers[0];
    const staffPayrollRecords = payroll.filter(
      (p) => p.TeacherID === staffMember?.TeacherID
    );

    return staffMember ? (
      <StaffPayrollSlip
        staffMember={staffMember}
        payrollRecords={staffPayrollRecords}
        role={role as 'mudir' | 'teacher'}
      />
    ) : (
      <div className="p-8 text-center text-slate-400">Loading payroll details...</div>
    );
  }

  // 2. Student Billing & Exam Permit View
  if (isStudent) {
    const currentStudent =
      students.find((s) => s.StudentID === currentUser?.linkedId) || students[0];
    const currentEnrolledClass = classes.find(
      (c) => c.ClassID === currentStudent?.ClassID
    );
    const currentLedger = payments.find(
      (p) => p.StudentID === currentStudent?.StudentID
    );
    const currentFeeSetting = feesSettings.find(
      (f) => f.ClassID === currentStudent?.ClassID
    );

    return currentStudent ? (
      <StudentExamReceipt
        student={currentStudent}
        enrolledClass={currentEnrolledClass}
        ledger={currentLedger}
        feeSetting={currentFeeSetting}
      />
    ) : (
      <div className="p-8 text-center text-slate-400">Loading billing details...</div>
    );
  }

  // 3. Cashier & Finance Directorate (Admin & Cashier)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-800" />
            <span>Cashier & Finance Directorate</span>
          </h1>
          <p className="text-sm text-slate-500">
            6-Dawr student tuition matrix, cashier audit logs, salary allocations, and Excel import/export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCashierOrAdmin && (
            <button
              type="button"
              onClick={exportFinanceExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Ledger Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payments' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Student Payment Matrix (6 Dawr)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'fees' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tuition Fee Configuration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('enrollment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'enrollment' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Student Enrollment Module
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payroll' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Faculty Payroll Allocation
        </button>
      </div>

      {/* TAB 1: STUDENT PAYMENT MATRIX OR EXAM RECEIPT CARDS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">Filter By Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option value={0}>All Classes</option>
                {classes.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>
                    [{c.Department.toUpperCase()}] {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher: Receipt Card (Mockup) vs Table */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaymentViewMode('receipt')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  paymentViewMode === 'receipt'
                    ? 'bg-[#126b38] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Exam Receipt Card View (إيصال الفحص)
              </button>
              <button
                type="button"
                onClick={() => setPaymentViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  paymentViewMode === 'table'
                    ? 'bg-[#126b38] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Matrix Table View (كشف الجدول)
              </button>
            </div>
          </div>

          {paymentViewMode === 'receipt' ? (
            (() => {
              const currentInspected =
                filteredStudents.find(s => s.StudentID === selectedStudentForReceipt) ||
                filteredStudents[0] ||
                students[0];
              const inspectedClass = classes.find(c => c.ClassID === currentInspected?.ClassID);
              const inspectedLedger = payments.find(p => p.StudentID === currentInspected?.StudentID);
              const inspectedFeeSetting = feesSettings.find(f => f.ClassID === currentInspected?.ClassID);

              return (
                <div className="space-y-4">
                  {/* Student Switcher for Cashier */}
                  <div className="bg-[#f7f4eb] p-4 rounded-2xl border border-[#ccbf99] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider font-sans">
                        Select Student:
                      </span>
                      <select
                        value={currentInspected?.StudentID || 0}
                        onChange={(e) => setSelectedStudentForReceipt(Number(e.target.value))}
                        className="px-3 py-1.5 border border-[#126b38] rounded-xl text-xs font-bold bg-white text-slate-900 shadow-2xs"
                      >
                        {filteredStudents.map(s => (
                          <option key={s.StudentID} value={s.StudentID}>
                            {s.Name} ({s.RollNo}) {s.NameArabic ? `· ${s.NameArabic}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-xs text-slate-600 font-serif" dir="rtl">
                      بطاقة دخول الامتحان مع سجل التجديد والدورات السابقة
                    </span>
                  </div>

                  {currentInspected && (
                    <StudentExamReceipt
                      student={currentInspected}
                      enrolledClass={inspectedClass}
                      ledger={inspectedLedger}
                      feeSetting={inspectedFeeSetting}
                      onPaymentChange={loadData}
                      canRenew={true}
                    />
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-base font-extrabold text-slate-900">
                  Tuition Payment Status & Cashier Ledger
                </h2>
                <span className="text-xs text-slate-500 font-bold">
                  {filteredStudents.length} Students
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Student Name</th>
                      {gradingPeriods.map(p => (
                        <th key={p} className="py-3 px-3 text-center">
                          {p} Dawr
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400">
                          No students found for this selection.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => {
                        const ledger = payments.find(p => p.StudentID === s.StudentID);
                        const fs = feesSettings.find(f => f.ClassID === s.ClassID);

                        return (
                          <tr key={s.StudentID} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{s.RollNo}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {s.Name}
                              {s.NameArabic && <span className="text-xs text-amber-700 font-serif block font-normal">{s.NameArabic}</span>}
                            </td>

                            {gradingPeriods.map(period => {
                              const rec = ledger?.Payments[period];
                              const isPaid = rec ? rec.isPaid : false;
                              const amount = fs ? fs.DawrAmount[period] || 300 : 300;

                              return (
                                <td key={period} className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    disabled={!isCashierOrAdmin}
                                    onClick={() => handleTogglePayment(s, period, isPaid)}
                                    onMouseEnter={(e) => {
                                      if (isPaid && rec) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredPayment({
                                          cashierName: rec.cashierName,
                                          paidAt: rec.paidAt,
                                          amount: rec.amount || amount,
                                          studentName: s.Name,
                                          period: `${period} Dawr`,
                                          x: rect.left,
                                          y: rect.bottom + 8,
                                        });
                                      }
                                    }}
                                    onMouseLeave={() => setHoveredPayment(null)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                      isPaid
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer shadow-xs'
                                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
                                    } ${!isCashierOrAdmin ? 'cursor-default' : ''}`}
                                  >
                                    {isPaid ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Paid (${rec?.amount || amount})</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Unpaid (${amount})</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              );
                            })}

                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForReceipt(s.StudentID);
                                  setPaymentViewMode('receipt');
                                }}
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-[#dfd4b8] hover:bg-[#d0c39f] text-slate-900 border border-[#ccbf99] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 text-[#126b38]" />
                                <span>Exam Receipt</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Hover Popover for Payment Auditor Details */}
      {hoveredPayment && (
        <div
          className="fixed z-50 pointer-events-none transition-all"
          style={{
            top: Math.min(hoveredPayment.y, window.innerHeight - 150),
            left: Math.min(hoveredPayment.x, window.innerWidth - 300),
          }}
        >
          <div className="w-64 bg-slate-950 text-white p-3.5 rounded-xl shadow-2xl border border-emerald-500/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Payment Receipt Verification</span>
            </div>
            <div>
              <p><span className="text-slate-400 font-semibold">Student:</span> {hoveredPayment.studentName}</p>
              <p><span className="text-slate-400 font-semibold">Term:</span> {hoveredPayment.period}</p>
              <p><span className="text-slate-400 font-semibold">Amount Paid:</span> ${hoveredPayment.amount}</p>
            </div>
            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-300">
              <p className="font-bold flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" /> Cashier: {hoveredPayment.cashierName || 'Finance Dept'}
              </p>
              <p className="flex items-center gap-1 text-slate-400 mt-0.5">
                <Clock className="w-3 h-3" /> Timestamp: {hoveredPayment.paidAt || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TUITION FEES CONFIGURATION */}
      {activeTab === 'fees' && isCashierOrAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1">
            Configure Dawr Tuition Fees
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Set individual billing fee amounts for each of the 6 examination periods (Dawr).
          </p>

          <form onSubmit={handleSaveFees} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {classes.map(c => (
                  <option key={c.ClassID} value={c.ClassID}>
                    [{c.Department.toUpperCase()}] {c.ClassName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gradingPeriods.map(p => (
                <div key={p}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {p} Dawr Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={feeForm[p]}
                    onChange={(e) => setFeeForm({ ...feeForm, [p]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Class Tuition Structure
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: STUDENT ENROLLMENT */}
      {activeTab === 'enrollment' && isCashierOrAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-800" />
            <span>Student Registration & Enrollment</span>
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Cashier and registrar enrollment portal to register new students with full personal and tribal data.
          </p>

          <form onSubmit={handleEnrollStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Student Name (English) *</label>
                <input
                  type="text"
                  required
                  value={newStudent.Name}
                  onChange={(e) => setNewStudent({ ...newStudent, Name: e.target.value })}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Student Name (Arabic)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={newStudent.NameArabic}
                  onChange={(e) => setNewStudent({ ...newStudent, NameArabic: e.target.value })}
                  placeholder="طارق المنصور"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={newStudent.RollNo}
                  onChange={(e) => setNewStudent({ ...newStudent, RollNo: e.target.value })}
                  placeholder="e.g. R110"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Gender *</label>
                <select
                  value={newStudent.Gender}
                  onChange={(e) => setNewStudent({ ...newStudent, Gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Class *</label>
                <select
                  value={newStudent.ClassID}
                  onChange={(e) => setNewStudent({ ...newStudent, ClassID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {classes.map(c => (
                    <option key={c.ClassID} value={c.ClassID}>
                      [{c.Department.toUpperCase()}] {c.ClassName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tribe / Clan (القبيلة)</label>
                <input
                  type="text"
                  value={newStudent.Tribe}
                  onChange={(e) => setNewStudent({ ...newStudent, Tribe: e.target.value })}
                  placeholder="e.g. Bani Tamim"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nationality</label>
                <input
                  type="text"
                  value={newStudent.Nationality}
                  onChange={(e) => setNewStudent({ ...newStudent, Nationality: e.target.value })}
                  placeholder="e.g. Saudi Arabia"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Birth Place</label>
                <input
                  type="text"
                  value={newStudent.BirthPlace}
                  onChange={(e) => setNewStudent({ ...newStudent, BirthPlace: e.target.value })}
                  placeholder="e.g. Riyadh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={newStudent.MobileNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, MobileNumber: e.target.value })}
                  placeholder="+966 50 000 0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address Details</label>
                <input
                  type="text"
                  value={newStudent.Address}
                  onChange={(e) => setNewStudent({ ...newStudent, Address: e.target.value })}
                  placeholder="District, Street name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Enroll Student & Open Tuition Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: TEACHER & STAFF PAYROLL ALLOCATION */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Faculty & Staff Payroll Roster
              </h2>
              <p className="text-xs text-slate-500">
                Monthly salary payouts, bonuses, and disbursement audit timestamps.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredPayroll.length} Pay Slips
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Bonus</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Paid Timestamp</th>
                  {isCashierOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayroll.map(pr => {
                  const tch = teachers.find(t => t.TeacherID === pr.TeacherID);
                  const isPaid = pr.Status === 'Paid';

                  return (
                    <tr key={pr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tch?.Name || `Teacher #${pr.TeacherID}`}
                        {tch?.NameArabic && (
                          <span className="text-xs text-amber-700 font-serif block font-normal">{tch.NameArabic}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-medium">{pr.Month}</td>
                      <td className="py-3 px-4 text-xs font-mono">${pr.BaseSalary}</td>
                      <td className="py-3 px-4 text-xs font-mono text-emerald-700">+${pr.Bonus}</td>
                      <td className="py-3 px-4 font-bold font-mono text-emerald-800">${pr.NetSalary}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pr.Status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {isPaid ? (
                          <div>
                            <div>{pr.PaidAt}</div>
                            <div className="text-[10px] text-slate-400">By: {pr.CashierName}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      {isCashierOrAdmin && (
                        <td className="py-3 px-4 text-right">
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => handlePaySalary(pr.id, tch?.Name || 'Teacher')}
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                            >
                              Disburse Salary
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Disbursed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
