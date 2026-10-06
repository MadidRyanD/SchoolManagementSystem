'use client';

import React, { useState, useMemo } from 'react';
import { TeacherItem, TeacherPayrollItem } from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import {
  Printer,
  ShieldCheck,
  Calendar,
  School,
  X,
  Clock,
  Wallet,
  Crown,
  FileText,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Coins
} from 'lucide-react';

interface StaffPayrollSlipProps {
  staffMember: TeacherItem;
  payrollRecords: TeacherPayrollItem[];
  role: 'mudir' | 'teacher';
}

interface MonthPayrollConfig {
  id: string;
  monthEn: string;
  monthAr: string;
  defaultDate: string;
  defaultDay: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending';
  cashierName: string;
  voucherNo: string;
  paidAtTimestamp: string;
}

export default function StaffPayrollSlip({
  staffMember,
  payrollRecords,
  role,
}: StaffPayrollSlipProps) {
  const [selectedSlip, setSelectedSlip] = useState<MonthPayrollConfig | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Standard monthly salary levels based on role
  const isMudir = role === 'mudir' || staffMember.IsMudir;
  const baseSalaryConfig = isMudir ? 4500 : 3500;
  const bonusConfig = isMudir ? 600 : 350;

  // Build 6 monthly salary slips matching the 6-period exam receipt layout
  const monthlySlips: MonthPayrollConfig[] = useMemo(() => {
    const months = [
      { monthEn: 'October 2024', monthAr: 'راتب شهر أكتوبر', defaultDate: 'Oct. 31, 2024', defaultDay: 'الخميس (Thursday)', voucherNo: 'PAY-2024-10', defaultTimestamp: '2024-10-31 14:30:00' },
      { monthEn: 'November 2024', monthAr: 'راتب شهر نوفمبر', defaultDate: 'Nov. 29, 2024', defaultDay: 'الجمعة (Friday)', voucherNo: 'PAY-2024-11', defaultTimestamp: '2024-11-29 15:15:00' },
      { monthEn: 'December 2024', monthAr: 'راتب شهر ديسمبر', defaultDate: 'Dec. 30, 2024', defaultDay: 'الاثنين (Monday)', voucherNo: 'PAY-2024-12', defaultTimestamp: '2024-12-30 11:45:00' },
      { monthEn: 'January 2025', monthAr: 'راتب شهر يناير', defaultDate: 'Jan. 31, 2025', defaultDay: 'الجمعة (Friday)', voucherNo: 'PAY-2025-01', defaultTimestamp: '2025-01-31 16:00:00' },
      { monthEn: 'February 2025', monthAr: 'راتب شهر فبراير', defaultDate: 'Feb. 28, 2025', defaultDay: 'الجمعة (Friday)', voucherNo: 'PAY-2025-02', defaultTimestamp: '2025-02-28 13:20:00' },
      { monthEn: 'March 2025', monthAr: 'راتب شهر مارس', defaultDate: 'Mar. 31, 2025', defaultDay: 'الاثنين (Monday)', voucherNo: 'PAY-2025-03', defaultTimestamp: '2025-03-31 15:10:00' },
    ];

    return months.map((m, idx) => {
      // Find matching stored record if any
      const stored = payrollRecords.find(
        (p) => p.Month.toLowerCase().includes(m.monthEn.toLowerCase().split(' ')[0])
      );

      const base = stored?.BaseSalary || baseSalaryConfig;
      const bonus = stored?.Bonus !== undefined ? stored.Bonus : bonusConfig;
      const deductions = stored?.Deductions || 0;
      const net = stored?.NetSalary || base + bonus - deductions;
      const status = (stored?.Status as 'Paid' | 'Pending') || 'Paid';
      const cashier = stored?.CashierName || 'الأستاذ كمال المالكي - أمين الصندوق العام (Ustadh Kamal Al-Maliki)';
      const timestamp = stored?.PaidAt || m.defaultTimestamp;

      return {
        id: `slip-${idx + 1}`,
        monthEn: m.monthEn,
        monthAr: m.monthAr,
        defaultDate: stored?.PaidAt ? stored.PaidAt.split(' ')[0] : m.defaultDate,
        defaultDay: m.defaultDay,
        baseSalary: base,
        bonus,
        deductions,
        netSalary: net,
        status,
        cashierName: cashier,
        voucherNo: m.voucherNo,
        paidAtTimestamp: timestamp,
      };
    });
  }, [payrollRecords, baseSalaryConfig, bonusConfig]);

  // Compute totals
  const totalEarningsYTD = monthlySlips.reduce((sum, s) => sum + s.netSalary, 0);
  const totalBaseYTD = monthlySlips.reduce((sum, s) => sum + s.baseSalary, 0);
  const totalBonusYTD = monthlySlips.reduce((sum, s) => sum + s.bonus, 0);
  const currentMonthNet = monthlySlips[monthlySlips.length - 1]?.netSalary || baseSalaryConfig;
  const paidCount = monthlySlips.filter((s) => s.status === 'Paid').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Overview & Action Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#126b38] text-white flex items-center justify-center font-bold shadow-md shrink-0">
            {isMudir ? <Crown className="w-7 h-7 text-amber-300" /> : <Wallet className="w-7 h-7 text-amber-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-serif">
                {isMudir ? 'كشف مخصصات الإدارة • Executive Mudir Payroll' : 'كشف رواتب الهيئة التدريسية • Faculty Payroll'}
              </span>
              <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                #{toHindiNumerals(staffMember.TeacherID ? `TCH-${String(staffMember.TeacherID).padStart(3, '0')}` : 'TCH-001')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-serif">
              {staffMember.NameArabic || staffMember.Name}
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5" dir="ltr">
              {staffMember.Name} • Official Salary & Faculty Payroll Statements
            </p>
          </div>
        </div>

        {/* Print Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedSlip(monthlySlips[monthlySlips.length - 1]);
              setShowPrintModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-2xl text-xs font-bold shadow transition-all cursor-pointer hover:scale-102"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span className="font-serif">طباعة إشعار الراتب الرسمي</span>
            <span className="font-sans text-[11px] opacity-80" dir="ltr">(Print Pay Slip)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row (Right to Left with Hindi Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-right">
          <span className="text-xs font-bold text-slate-500 font-serif block">إجمالي الراتب المكتسب</span>
          <span className="text-[11px] font-sans uppercase text-slate-400 block" dir="ltr">Total YTD Earnings</span>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-2xl font-black text-slate-900 font-serif">
              {toHindiNumerals(totalEarningsYTD)} بيسو
            </span>
            <span className="text-xs font-mono text-emerald-800 font-bold" dir="ltr">
              ({totalEarningsYTD.toLocaleString()} PHP)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-serif">
            مجموع الرواتب لـ {toHindiNumerals(6)} أشهر كاملة
          </span>
        </div>

        {/* Current Monthly Net Salary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-right">
          <span className="text-xs font-bold text-emerald-800 font-serif block">صافي الراتب الشهري الحالي</span>
          <span className="text-[11px] font-sans uppercase text-emerald-600 block" dir="ltr">Current Monthly Net</span>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-2xl font-black text-emerald-700 font-serif">
              {toHindiNumerals(currentMonthNet)} بيسو
            </span>
            <span className="text-xs font-mono text-emerald-700 font-bold" dir="ltr">
              ({currentMonthNet.toLocaleString()} PHP)
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block font-serif">
            تم صرف {toHindiNumerals(paidCount)} من أصل {toHindiNumerals(6)} أشهر
          </span>
        </div>

        {/* Allowances & Bonuses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-right">
          <span className="text-xs font-bold text-amber-900 font-serif block">البدلات والمكافآت الأكاديمية</span>
          <span className="text-[11px] font-sans uppercase text-amber-700 block" dir="ltr">Teaching Incentives & Bonus</span>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-2xl font-black text-amber-900 font-serif">
              +{toHindiNumerals(totalBonusYTD)} بيسو
            </span>
            <span className="text-xs font-mono text-amber-800 font-bold" dir="ltr">
              (+{totalBonusYTD.toLocaleString()} PHP)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-serif">
            بدل تدريس وأعباء إشرافية معتمدة
          </span>
        </div>

        {/* Treasury Standing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-right">
          <span className="text-xs font-bold text-slate-500 font-serif block">حالة استلام الراتب والصرف</span>
          <span className="text-[11px] font-sans uppercase text-slate-400 block" dir="ltr">Salary Taken Status</span>
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${paidCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-sm font-extrabold text-slate-900 font-serif">
              {paidCount >= 6 ? 'تم استلام كافة الرواتب المستحقة' : 'الرواتب مستلمة ومصروفة بالكامل'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block font-serif">
            تم الاستلام والصرف من أمين الصندوق المعتمد
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* PAYROLL VOUCHERS LIST (RTL Warm Parchment Card)                 */}
      {/* =============================================================== */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-5 sm:p-7 shadow-sm">
        {/* Title */}
        <div className="flex items-center justify-between mb-5 flex-row-reverse">
          <span className="text-xs font-mono font-bold text-slate-700" dir="ltr">
            FACULTY PAYROLL DISBURSEMENTS
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-serif tracking-tight">
              كشف استلام الرواتب والمخصصات الشهرية
            </h2>
            <p className="text-xs text-slate-700 font-serif mt-0.5">
              يعرض هذا الكشف تفاصيل استلام الراتب، وقت وتاريخ الاستلام والصرف، وهوية أمين الصندوق المسؤول
            </p>
          </div>
        </div>

        {/* List of Payroll Rows */}
        <div className="space-y-3.5">
          {monthlySlips.map((s) => {
            const isPaid = s.status === 'Paid';

            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSlip(s);
                  setShowPrintModal(true);
                }}
                className="bg-[#fcfbf7] hover:bg-white border border-[#cfc39f] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all shadow-2xs hover:shadow cursor-pointer"
              >
                {/* 1. Status Badge & Icon (Right side in RTL) */}
                <div className="flex items-center gap-3.5 min-w-[210px]">
                  {isPaid ? (
                    <div className="w-12 h-12 rounded-2xl border-2 border-[#54a434] bg-[#f0f9ec] flex items-center justify-center shadow-xs shrink-0">
                      <svg className="w-7 h-7 text-[#54a434]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black font-serif ${
                        isPaid ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>تم استلام وصرف الراتب</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>قيد الصرف ولم يُستلم</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans font-bold text-slate-500 mt-0.5" dir="ltr">
                      {isPaid ? 'Already Taken & Disbursed' : 'Pending Treasury Release'}
                    </p>
                  </div>
                </div>

                {/* 2. Middle Column: Month, Cashier & Timestamp Details */}
                <div className="flex-1 border-y md:border-y-0 md:border-x border-[#ccbf99]/40 py-2 md:py-0 md:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif font-black text-slate-950 text-base sm:text-lg">
                      {s.monthAr}
                    </span>
                    <span className="text-slate-400 font-bold">|</span>
                    <span className="font-sans font-bold text-slate-700 text-xs sm:text-sm" dir="ltr">
                      {s.monthEn}
                    </span>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold" dir="ltr">
                      Voucher #{toHindiNumerals(s.voucherNo.replace('PAY-', ''))}
                    </span>
                  </div>

                  {/* Cashier and Timestamp Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                    {/* Cashier Who Gave Salary */}
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 font-serif block">
                        صُرف وسُلّم بواسطة أمين الصندوق:
                      </span>
                      <p className="font-serif font-black text-slate-900 mt-0.5 text-xs">
                        {s.cashierName}
                      </p>
                      <span className="text-[10px] text-slate-500 font-sans block" dir="ltr">
                        Disbursed by Cashier Office
                      </span>
                    </div>

                    {/* Exact Timestamp */}
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 font-serif block">
                        وقت وتاريخ الاستلام والصرف:
                      </span>
                      <p className="font-mono font-black text-emerald-900 mt-0.5 text-xs">
                        {toHindiNumerals(s.paidAtTimestamp)} م
                      </p>
                      <span className="text-[10px] text-slate-500 font-sans block" dir="ltr">
                        Timestamp: {s.paidAtTimestamp}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-serif">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      الأساسي: {toHindiNumerals(s.baseSalary)} بيسو
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      بدل التدريس: +{toHindiNumerals(s.bonus)} بيسو
                    </span>
                    {s.deductions > 0 && (
                      <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded font-bold">
                        استقطاعات: -{toHindiNumerals(s.deductions)} بيسو
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Salary Amount Column */}
                <div className="text-right md:text-left min-w-[130px] flex flex-col justify-center">
                  <span className="text-[11px] font-serif text-slate-600 block">
                    صافي الراتب المستلم:
                  </span>
                  <p className="font-serif font-black text-emerald-900 text-lg sm:text-xl leading-tight">
                    {toHindiNumerals(s.netSalary)} بيسو
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-0.5" dir="ltr">
                    {s.netSalary.toLocaleString()} PHP
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-800 font-serif font-bold">
                    {isPaid ? 'تم إيداع الراتب نقداً' : 'بانتظار الصرف'}
                  </span>
                </div>

                {/* 4. Action Button */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    className="px-3.5 py-2 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-serif font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-300" />
                    <span>عرض السند</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =============================================================== */}
      {/* OFFICIAL SALARY PAYSLIP MODAL DIALOG (PRINTABLE)                 */}
      {/* =============================================================== */}
      {showPrintModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#126b38] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-serif">
                    سند صرف الراتب الشهري الرسمي المعتمد
                  </h2>
                  <p className="text-xs text-amber-200/90 font-sans" dir="ltr">
                    Official Salary Disbursement Voucher • Jamiatu Monib Alkuzbary
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Body (Print Layout) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 bg-[#fdfdfc]" id="printable-payroll-slip">
              {/* Institution Seal & Watermark Header */}
              <div className="text-center pb-4 border-b-2 border-emerald-800/30 space-y-1">
                <div className="flex items-center justify-center gap-2 text-emerald-900 font-extrabold text-base">
                  <School className="w-6 h-6 text-emerald-700" />
                  <span className="font-serif text-lg font-black">جامعة منيب الكزبري العربية</span>
                </div>
                <p className="text-xs font-sans text-emerald-800 font-bold" dir="ltr">
                  Jamiatu Monib Alkuzbary Al-Arabia • Directorate of Finance & Human Resources
                </p>
                <p className="text-xs font-serif text-slate-600 font-bold">
                  إشعار استلام وصرف الراتب الشهري • {selectedSlip.monthAr} ({selectedSlip.monthEn})
                </p>
              </div>

              {/* Staff Details & Disbursement Verification Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px] font-serif">اسم المستلم (Staff Name):</span>
                  <p className="font-black text-slate-900 text-sm font-serif mt-0.5">
                    {staffMember.NameArabic || staffMember.Name}
                  </p>
                  <p className="text-slate-500 font-sans text-[11px]" dir="ltr">{staffMember.Name}</p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px] font-serif">المسمى الوظيفي (Position):</span>
                  <p className="font-bold text-slate-800 font-serif mt-0.5">
                    {isMudir ? 'مدير الجامعة (Mudir / Dean)' : 'عضو هيئة التدريس (Faculty Instructor)'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
                    ID: #{toHindiNumerals(staffMember.TeacherID ? `TCH-${String(staffMember.TeacherID).padStart(3, '0')}` : 'TCH-001')}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px] font-serif">حالة استلام الراتب (Salary Status):</span>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-serif font-black text-xs border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>تم استلام وصرف الراتب رسمياً (ALREADY TAKEN & PAID)</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1" dir="ltr">
                    Voucher #{toHindiNumerals(selectedSlip.voucherNo)}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px] font-serif">أمين الصندوق المسلّم (Cashier):</span>
                  <p className="font-bold text-emerald-800 font-serif mt-0.5">{selectedSlip.cashierName}</p>
                  <p className="text-[11px] text-slate-600 font-serif mt-0.5">
                    وقت وتاريخ الاستلام والصرف: <span className="font-mono font-bold text-slate-900">{toHindiNumerals(selectedSlip.paidAtTimestamp)} م</span>
                  </p>
                </div>
              </div>

              {/* Itemized Salary Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold font-serif">
                    <tr>
                      <th className="py-2.5 px-4 text-right">بيان الاستحقاق والمخصص المالي</th>
                      <th className="py-2.5 px-4 text-center font-serif">المبلغ بالأرقام الهندية</th>
                      <th className="py-2.5 px-4 text-left font-sans" dir="ltr">Amount (PHP / Pesos)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    <tr>
                      <td className="py-2.5 px-4 font-serif">الراتب الأساسي المعتمد (Basic Salary)</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{toHindiNumerals(selectedSlip.baseSalary)} بيسو</td>
                      <td className="py-2.5 px-4 text-left font-mono text-slate-600" dir="ltr">{selectedSlip.baseSalary.toLocaleString()} pesos</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-serif">بدل التدريس والأعباء الأكاديمية (Teaching Incentive)</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">+{toHindiNumerals(selectedSlip.bonus)} بيسو</td>
                      <td className="py-2.5 px-4 text-left font-mono text-emerald-700" dir="ltr">+{selectedSlip.bonus.toLocaleString()} pesos</td>
                    </tr>
                    {selectedSlip.deductions > 0 && (
                      <tr>
                        <td className="py-2.5 px-4 font-serif text-red-700">الاستقطاعات الإدارية والنظامية (Deductions)</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-red-700">-{toHindiNumerals(selectedSlip.deductions)} بيسو</td>
                        <td className="py-2.5 px-4 text-left font-mono text-red-700" dir="ltr">-{selectedSlip.deductions.toLocaleString()} pesos</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/70 font-black text-sm text-emerald-950">
                      <td className="py-3 px-4 font-serif">صافي الراتب المستلم باليد (Net Disbursed Salary)</td>
                      <td className="py-3 px-4 text-center font-mono text-base text-emerald-800 font-black">
                        {toHindiNumerals(selectedSlip.netSalary)} بيسو
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-base text-emerald-800 font-black" dir="ltr">
                        {selectedSlip.netSalary.toLocaleString()} pesos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-4 grid grid-cols-3 gap-4 text-center text-xs border-t border-slate-200">
                <div className="space-y-2">
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-slate-700">Kamal Al-Maliki</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold text-slate-800 font-serif">أمين الصندوق المسلّم</p>
                    <p className="text-[10px] text-slate-400 font-sans" dir="ltr">Chief Cashier</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-600/60 flex items-center justify-center text-[9px] font-bold text-emerald-800 rotate-[-12deg] font-serif">
                      ختم الجامعة
                    </div>
                  </div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold text-slate-800 font-serif">الإدارة المالية</p>
                    <p className="text-[10px] text-slate-400 font-sans" dir="ltr">Treasury Seal</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-slate-700">{staffMember.NameArabic || staffMember.Name}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold text-slate-800 font-serif">توقيع المستلم</p>
                    <p className="text-[10px] text-slate-400 font-sans" dir="ltr">Faculty Staff Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer font-serif"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2.5 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer font-serif"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>طباعة إشعار الراتب</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-mono" dir="ltr">
                JMAA-Official Financial Payroll Voucher
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
