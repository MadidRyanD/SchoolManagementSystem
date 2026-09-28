'use client';

import React, { useState, useMemo } from 'react';
import { TeacherItem, TeacherPayrollItem } from '@/lib/types';
import { toHindiNumerals } from '@/lib/numerals';
import {
  Printer,
  ShieldCheck,
  CreditCard,
  FileCheck2,
  Calendar,
  User,
  School,
  AlertCircle,
  X,
  Clock,
  Sparkles,
  Download,
  Wallet,
  Crown,
  CheckCircle2,
  FileText,
  BadgeCheck,
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
      { monthEn: 'October 2024', monthAr: 'راتب شهر أكتوبر', defaultDate: 'Oct. 31, 2024', defaultDay: 'Thursday', voucherNo: 'PAY-2024-10' },
      { monthEn: 'November 2024', monthAr: 'راتب شهر نوفمبر', defaultDate: 'Nov. 29, 2024', defaultDay: 'Friday', voucherNo: 'PAY-2024-11' },
      { monthEn: 'December 2024', monthAr: 'راتب شهر ديسمبر', defaultDate: 'Dec. 30, 2024', defaultDay: 'Monday', voucherNo: 'PAY-2024-12' },
      { monthEn: 'January 2025', monthAr: 'راتب شهر يناير', defaultDate: 'Jan. 31, 2025', defaultDay: 'Friday', voucherNo: 'PAY-2025-01' },
      { monthEn: 'February 2025', monthAr: 'راتب شهر فبراير', defaultDate: 'Feb. 28, 2025', defaultDay: 'Friday', voucherNo: 'PAY-2025-02' },
      { monthEn: 'March 2025', monthAr: 'راتب شهر مارس', defaultDate: 'Mar. 31, 2025', defaultDay: 'Monday', voucherNo: 'PAY-2025-03' },
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
      const status = stored?.Status || 'Paid';
      const cashier = stored?.CashierName || 'Ustadh Kamal Al-Maliki (Chief Cashier)';

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
    <div className="space-y-6">
      {/* Top Overview & Action Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#126b38] text-white flex items-center justify-center font-bold shadow-md">
            {isMudir ? <Crown className="w-7 h-7 text-amber-300" /> : <Wallet className="w-7 h-7 text-amber-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-sans">
                {isMudir ? 'Executive Mudir Payroll • كشف مخصصات الإدارة' : 'Faculty Salary Slip • كشف رواتب الهيئة التدريسية'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                #{staffMember.TeacherID ? `TCH-${String(staffMember.TeacherID).padStart(3, '0')}` : 'TCH-001'}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1 font-sans">
              {staffMember.Name}
            </h1>
            <p className="text-xs text-slate-500 font-serif" dir="rtl">
              {staffMember.NameArabic || (isMudir ? 'د. منيب الكزبري - مدير الجامعة' : 'عضو هيئة التدريس')} • كشف الرواتب والمخصصات الشهرية المعتمدة
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
            <span>Print Official Pay Slip</span>
            <span className="font-serif text-[11px] opacity-80" dir="rtl">(طباعة إشعار الراتب)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row (Matching Student Exam Receipt exact 4-card structure) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Total YTD Earnings</span>
          <span className="text-[11px] text-slate-500 font-serif block">إجمالي الراتب المكتسب</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-sans">{totalEarningsYTD.toLocaleString()} pesos</span>
            <span className="text-xs font-mono text-emerald-800 font-bold">({toHindiNumerals(totalEarningsYTD)} بيسو)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Full 6 Months Cumulative</span>
        </div>

        {/* Current Monthly Net Salary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-700 block font-sans">Current Monthly Net</span>
          <span className="text-[11px] text-slate-500 font-serif block">صافي الراتب الشهري</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-sans">{currentMonthNet.toLocaleString()} pesos</span>
            <span className="text-xs font-mono text-emerald-700 font-bold">({toHindiNumerals(currentMonthNet)} بيسو)</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">{paidCount} of 6 Months Disbursed</span>
        </div>

        {/* Allowances & Bonuses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-amber-800 block font-sans">Allowances & Bonuses</span>
          <span className="text-[11px] text-slate-500 font-serif block">البدلات والمكافآت</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 font-sans">{totalBonusYTD.toLocaleString()} pesos</span>
            <span className="text-xs font-mono text-amber-800 font-bold">({toHindiNumerals(totalBonusYTD)} بيسو)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Teaching & Academic Incentive</span>
        </div>

        {/* Treasury Standing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Disbursement Standing</span>
          <span className="text-[11px] text-slate-500 font-serif block">حالة الصرف والاعتماد</span>
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${paidCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-sm font-extrabold text-slate-900">
              {paidCount >= 6 ? 'Disbursed in Full' : 'All Due Vouchers Paid'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block font-serif" dir="rtl">
            مصروف ومطابق للشروط المعتمدة
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* EXACT MOCKUP REPLICATION: "Payroll Slips" Warm Parchment Card     */}
      {/* Styled identically to the Student Exam Receipt Card              */}
      {/* =============================================================== */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Title matching student billing card */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-sans tracking-tight">
            Payroll Receipt & Salary Slips
          </h2>
          <span className="text-xs font-serif font-bold text-slate-800" dir="rtl">
            بيان صرف الرواتب والمخصصات الشهرية
          </span>
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
                className="bg-[#fcfbf7] hover:bg-white border border-[#cfc39f] rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all shadow-2xs hover:shadow cursor-pointer"
              >
                {/* 1. Date Column (Left) with vertical divider */}
                <div className="border-r-2 border-[#ccbf99] pr-4 sm:pr-8 min-w-[110px] sm:min-w-[140px]">
                  <p className="font-sans font-black text-slate-900 text-xs sm:text-sm leading-tight">
                    {s.defaultDate}
                  </p>
                  <p className="font-sans text-xs text-slate-600 font-semibold mt-0.5">
                    {s.defaultDay}
                  </p>
                </div>

                {/* 2. Middle Column: Month Title & Cashier */}
                <div className="flex-1 px-3 sm:px-6">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-sans font-black text-slate-950 text-sm sm:text-base">
                      {s.monthEn}
                    </span>
                    <span className="text-slate-400 font-bold">|</span>
                    <span className="font-serif font-extrabold text-slate-900 text-sm sm:text-base" dir="rtl">
                      {s.monthAr}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] sm:text-xs text-slate-600 font-mono mt-0.5">
                    Disbursed by {s.cashierName} • Voucher #{s.voucherNo}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">Base: {s.baseSalary.toLocaleString()}</span>
                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">+Bonus: {s.bonus.toLocaleString()}</span>
                    {s.deductions > 0 && (
                      <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded">-Ded: {s.deductions.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* 3. Amount Column */}
                <div className="text-right pr-4 sm:pr-8 min-w-[90px] sm:min-w-[120px]">
                  <p className="font-sans font-black text-slate-900 text-xs sm:text-base leading-tight">
                    {s.netSalary.toLocaleString()} pesos
                  </p>
                  <p className="text-[11px] sm:text-xs text-emerald-800 font-bold font-serif mt-0.5" dir="rtl">
                    {toHindiNumerals(s.netSalary)} بيسو
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {isPaid ? 'Cleared & Credited' : 'Pending Treasury'}
                  </p>
                </div>

                {/* 4. Status Checkbox Icon (Far Right matching green check rounded square) */}
                <div className="flex-shrink-0 pl-2">
                  {isPaid ? (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 border-[#54a434] bg-[#f0f9ec] flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6 text-[#54a434]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#126b38] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Official Salary Disbursement Voucher
                  </h2>
                  <p className="text-xs text-amber-200/90 font-serif" dir="rtl">
                    إشعار صرف الراتب المعتمد - جامعة منيب الكزبري العربية
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
                  <span>Jamiatu Monib Alkuzbary Al-Arabia</span>
                </div>
                <p className="text-xs font-serif text-emerald-800 font-bold" dir="rtl">
                  جامعة منيب الكزبري العربية - إدارة الشؤون المالية والموارد البشرية
                </p>
                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Official Salary Pay Slip • {selectedSlip.monthEn} ({selectedSlip.monthAr})
                </p>
              </div>

              {/* Staff Details Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Staff Name:</span>
                  <p className="font-extrabold text-slate-900 text-sm">{staffMember.Name}</p>
                  {staffMember.NameArabic && (
                    <p className="text-amber-800 font-serif" dir="rtl">{staffMember.NameArabic}</p>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Role / Position:</span>
                  <p className="font-bold text-slate-800">
                    {isMudir ? 'Mudir / Principal / Dean' : 'Faculty Instructor'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: #{staffMember.TeacherID ? `TCH-${String(staffMember.TeacherID).padStart(3, '0')}` : 'TCH-001'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Voucher Reference:</span>
                  <p className="font-mono font-bold text-slate-800">#{selectedSlip.voucherNo}</p>
                  <p className="text-slate-500">{selectedSlip.defaultDate}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Disbursement Office:</span>
                  <p className="font-bold text-emerald-800">{selectedSlip.cashierName}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Cleared & Fully Paid
                  </span>
                </div>
              </div>

              {/* Itemized Salary Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Earnings / Allowances Item</th>
                      <th className="py-2.5 px-4 text-right">Amount (PHP / Pesos)</th>
                      <th className="py-2.5 px-4 text-right font-serif">المبلغ بالأرقام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    <tr>
                      <td className="py-2.5 px-4">Basic Monthly Salary (الراتب الأساسي)</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">{selectedSlip.baseSalary.toLocaleString()} pesos</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-600">{toHindiNumerals(selectedSlip.baseSalary)} بيسو</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4">Teaching & Academic Incentive (بدل التدريس والأعباء)</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">+{selectedSlip.bonus.toLocaleString()} pesos</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">+{toHindiNumerals(selectedSlip.bonus)} بيسو</td>
                    </tr>
                    {selectedSlip.deductions > 0 && (
                      <tr>
                        <td className="py-2.5 px-4 text-red-700">Institutional Deductions (استقطاعات)</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-red-700">-{selectedSlip.deductions.toLocaleString()} pesos</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-red-700">-{toHindiNumerals(selectedSlip.deductions)} بيسو</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/70 font-black text-sm text-emerald-950">
                      <td className="py-3 px-4">Net Disbursed Salary (صافي الراتب المستلم)</td>
                      <td className="py-3 px-4 text-right font-mono text-base text-emerald-800 font-black">
                        {selectedSlip.netSalary.toLocaleString()} pesos
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base text-emerald-800 font-black">
                        {toHindiNumerals(selectedSlip.netSalary)} بيسو
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
                    <p className="font-bold text-slate-800">Chief Cashier</p>
                    <p className="text-[10px] text-slate-400">أمين الصندوق العام</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-600/60 flex items-center justify-center text-[9px] font-bold text-emerald-800 rotate-[-12deg]">
                      SEAL
                    </div>
                  </div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold text-slate-800">Finance Directorate</p>
                    <p className="text-[10px] text-slate-400">ختم الإدارة المالية</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-slate-700">{staffMember.Name}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold text-slate-800">Staff Signature</p>
                    <p className="text-[10px] text-slate-400">توقيع المستلم</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                JMAA-MoritAko Official Financial Voucher
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2.5 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pay Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
