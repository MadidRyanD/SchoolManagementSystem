'use client';

import React, { useState } from 'react';
import {
  StudentItem,
  ClassItem,
  StudentPaymentLedger,
  TuitionFeeSetting,
  GradingPeriod,
} from '@/lib/types';
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
} from 'lucide-react';

interface StudentExamReceiptProps {
  student: StudentItem;
  enrolledClass?: ClassItem;
  ledger?: StudentPaymentLedger;
  feeSetting?: TuitionFeeSetting;
}

interface QuarterConfig {
  period: GradingPeriod;
  titleEn: string;
  titleAr: string;
  defaultDate: string;
  defaultDay: string;
}

const QUARTERS: QuarterConfig[] = [
  { period: '1st', titleEn: '1st Quarter', titleAr: 'دور الأول', defaultDate: 'Feb. 3, 2025', defaultDay: 'Tuesday' },
  { period: '2nd', titleEn: '2nd Quarter', titleAr: 'دور الثاني', defaultDate: 'Feb. 10, 2025', defaultDay: 'Tuesday' },
  { period: '3rd', titleEn: '3rd Quarter', titleAr: 'دور الثالث', defaultDate: 'Feb. 17, 2025', defaultDay: 'Tuesday' },
  { period: '4th', titleEn: '4th Quarter', titleAr: 'دور الرابع', defaultDate: 'Feb. 24, 2025', defaultDay: 'Tuesday' },
  { period: '5th', titleEn: '5th Quarter', titleAr: 'دور الخامس', defaultDate: 'Mar. 3, 2025', defaultDay: 'Tuesday' },
  { period: '6th', titleEn: '6th Quarter', titleAr: 'دور السادس', defaultDate: 'Mar. 10, 2025', defaultDay: 'Tuesday' },
];

export default function StudentExamReceipt({
  student,
  enrolledClass,
  ledger,
  feeSetting,
}: StudentExamReceiptProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<QuarterConfig | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Compute totals
  const totalDue = QUARTERS.reduce((sum, q) => {
    return sum + (feeSetting?.DawrAmount[q.period] || 300);
  }, 0);

  const totalPaid = QUARTERS.reduce((sum, q) => {
    const rec = ledger?.Payments[q.period];
    if (rec?.isPaid) return sum + (rec.amount || 0);
    return sum;
  }, 0);

  const remainingBalance = Math.max(0, totalDue - totalPaid);
  const paidCount = QUARTERS.filter(q => ledger?.Payments[q.period]?.isPaid).length;

  return (
    <div className="space-y-6">
      {/* Top Overview & Action Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#126b38] text-white flex items-center justify-center font-bold shadow-md">
            <FileCheck2 className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-sans">
                Student Examination Permit • تصريح الامتحان
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {student.RollNo}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1 font-sans">
              Official Tuition & Exam Clearance
            </h1>
            <p className="text-xs text-slate-500 font-serif" dir="rtl">
              كشف سداد الرسوم وإيصالات دخول الاختبارات الأكاديمية للأدوار الستة.
            </p>
          </div>
        </div>

        {/* Print Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-2xl text-xs font-bold shadow transition-all cursor-pointer hover:scale-102"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Official Exam Slip</span>
            <span className="font-serif text-[11px] opacity-80" dir="rtl">(طباعة الإشعار)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row for Finance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Tuition */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Total Annual Tuition</span>
          <span className="text-[11px] text-slate-500 font-serif block">إجمالي الرسوم السنوية</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-sans">{totalDue.toLocaleString()} pesos</span>
            <span className="text-xs font-mono text-emerald-800 font-bold">({toHindiNumerals(totalDue)} بيسو)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Full 6 Quarter Assessment</span>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-700 block font-sans">Total Amount Paid</span>
          <span className="text-[11px] text-slate-500 font-serif block">المبلغ المسدد</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 font-sans">{totalPaid.toLocaleString()} pesos</span>
            <span className="text-xs font-mono text-emerald-700 font-bold">({toHindiNumerals(totalPaid)} بيسو)</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">{paidCount} of 6 Quarters Cleared</span>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-amber-800 block font-sans">Remaining Balance</span>
          <span className="text-[11px] text-slate-500 font-serif block">الرصيد المتبقي</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 font-sans">{remainingBalance.toLocaleString()} pesos</span>
            <span className="text-xs font-mono text-amber-800 font-bold">({toHindiNumerals(remainingBalance)} بيسو)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Payable at Cashier Directorate</span>
        </div>

        {/* Exam Permit Standing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block font-sans">Exam Hall Status</span>
          <span className="text-[11px] text-slate-500 font-serif block">حالة تصريح الامتحان</span>
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${paidCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-sm font-extrabold text-slate-900">
              {paidCount >= 2 ? 'Cleared for Exams' : paidCount === 1 ? '1st Quarter Cleared' : 'Payment Required'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block font-serif" dir="rtl">
            {paidCount >= 2 ? 'مسموح ومطابق للشروط' : 'يُرجى مراجعة الصندوق'}
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* EXACT MOCKUP REPLICATION: "Exam Receipt" Card                    */}
      {/* Matching attached media_1790597347079.png                         */}
      {/* =============================================================== */}
      <div className="bg-[#dfd4b8] border-2 border-[#ccbf99] rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Title matching screenshot */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-sans tracking-tight">
            Exam Receipt
          </h2>
          <span className="text-xs font-serif font-bold text-slate-800" dir="rtl">
            إيصالات دخول الامتحانات الأكاديمية
          </span>
        </div>

        {/* List of Receipt Rows */}
        <div className="space-y-3.5">
          {QUARTERS.map(q => {
            const rec = ledger?.Payments[q.period];
            const isPaid = rec?.isPaid ?? false;
            const amount = rec?.amount || feeSetting?.DawrAmount[q.period] || 300;
            const balance = rec?.balance;
            const note = rec?.note;
            const dateStr = rec?.paidAt || q.defaultDate;
            const dayStr = rec?.dayOfWeek || q.defaultDay;
            const cashierStr = rec?.cashierName || (isPaid ? 'Ustadh Kamal (Cashier)' : 'Cashier: Pending');

            return (
              <div
                key={q.period}
                onClick={() => setSelectedReceipt(q)}
                className="bg-[#fcfbf7] hover:bg-white border border-[#cfc39f] rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all shadow-2xs hover:shadow cursor-pointer"
              >
                {/* 1. Date Column (Left) with vertical divider */}
                <div className="border-r-2 border-[#ccbf99] pr-4 sm:pr-8 min-w-[110px] sm:min-w-[140px]">
                  <p className="font-sans font-black text-slate-900 text-xs sm:text-sm leading-tight">
                    {dateStr}
                  </p>
                  <p className="font-sans text-xs text-slate-600 font-semibold mt-0.5">
                    {dayStr}
                  </p>
                </div>

                {/* 2. Middle Column: Quarter Title & Cashier */}
                <div className="flex-1 px-3 sm:px-6">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-sans font-black text-slate-950 text-sm sm:text-base">
                      {q.titleEn}
                    </span>
                    <span className="text-slate-400 font-bold">|</span>
                    <span className="font-serif font-extrabold text-slate-900 text-sm sm:text-base" dir="rtl">
                      {q.titleAr}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] sm:text-xs text-slate-600 font-mono mt-0.5">
                    {cashierStr}
                  </p>
                </div>

                {/* 3. Amount Column */}
                <div className="text-right pr-4 sm:pr-8 min-w-[90px] sm:min-w-[120px]">
                  <p className="font-sans font-black text-slate-900 text-xs sm:text-base leading-tight">
                    {amount} pesos
                  </p>
                  {balance !== undefined && balance > 0 && (
                    <p className="text-[11px] sm:text-xs text-amber-800 font-bold font-sans mt-0.5">
                      Bal: {balance}pesos
                    </p>
                  )}
                  {note && (
                    <p className="text-[11px] sm:text-xs text-slate-600 font-serif italic mt-0.5">
                      {note}
                    </p>
                  )}
                  {!isPaid && !balance && !note && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Pending
                    </p>
                  )}
                </div>

                {/* 4. Status Checkbox Icon (Far Right) */}
                <div className="flex-shrink-0 pl-2">
                  {isPaid && !balance && !note ? (
                    /* Green Checkmark in rounded square (Paid in full) */
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 border-[#54a434] bg-[#f0f9ec] flex items-center justify-center shadow-xs">
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 text-[#54a434]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : balance || note ? (
                    /* Gold/Olive Checkmark in rounded square (Partial / Balance) */
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 border-[#a38b38] bg-[#fdf9ea] flex items-center justify-center shadow-xs">
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 text-[#a38b38]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    /* Empty Rounded Square (Unpaid / Pending) */
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 border-slate-700 bg-transparent flex items-center justify-center" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-4 border-t border-[#ccbf99] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2">
          <p className="font-serif" dir="rtl">
            ملاحظة: تُقبل تصاريح دخول الامتحانات المعتمدة إلكترونياً والمختومة من إدارة الصندوق.
          </p>
          <span className="font-mono text-slate-800 font-bold">
            JMAA-MoritAko Official Clearance v2.0
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* RECEIPT DETAIL MODAL                                             */}
      {/* =============================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#126b38]" />
                <h3 className="font-black text-slate-900 text-base">
                  {selectedReceipt.titleEn} — Receipt Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const rec = ledger?.Payments[selectedReceipt.period];
              const isPaid = rec?.isPaid ?? false;
              const amount = rec?.amount || feeSetting?.DawrAmount[selectedReceipt.period] || 300;
              const balance = rec?.balance;
              const note = rec?.note;

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-[#dfd4b8] border border-[#ccbf99] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{selectedReceipt.titleEn} | {selectedReceipt.titleAr}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">{student.Name} ({student.RollNo})</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${isPaid ? 'bg-emerald-700 text-white' : 'bg-rose-100 text-rose-800'}`}>
                      {isPaid ? 'CLEARED' : 'PENDING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount</span>
                      <span className="font-black text-slate-900 text-sm">{amount} pesos</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance Due</span>
                      <span className="font-black text-slate-900 text-sm">{balance ? `${balance} pesos` : '0 pesos'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Cashier Endorsement</span>
                    <p className="font-bold text-slate-800">{rec?.cashierName || 'Finance Directorate'}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{rec?.paidAt || selectedReceipt.defaultDate} • {selectedReceipt.defaultDay}</p>
                    {note && <p className="text-amber-800 font-serif italic text-xs mt-1">ملاحظة: {note}</p>}
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReceipt(null);
                        setShowPrintModal(true);
                      }}
                      className="px-4 py-2 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* PRINTABLE OFFICIAL EXAM CLEARANCE SLIP MODAL                     */}
      {/* =============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-300 space-y-6 my-8">
            {/* Header with crest */}
            <div className="flex items-center justify-between border-b-2 border-[#126b38] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-emerald-950 p-1">
                  <img src="/logo.png" alt="JMAA Emblem" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base font-serif" dir="rtl">
                    جامعة منيب الكزبري العربية
                  </h3>
                  <p className="text-xs font-bold text-slate-600 font-sans">
                    Jamiatu Monib Alkuzbary Al-Arabia
                  </p>
                  <p className="text-[10px] text-emerald-800 font-mono uppercase tracking-wider">
                    Official Examination Entrance Permit
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  APPROVED
                </span>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="bg-[#dfd4b8] border border-[#ccbf99] rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Student Name</span>
                <span className="font-extrabold text-slate-900 block">{student.Name}</span>
                <span className="text-[11px] text-amber-900 font-serif block" dir="rtl">{student.NameArabic}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Roll Number</span>
                <span className="font-mono font-black text-slate-900 text-sm block">{student.RollNo}</span>
                <span className="text-[10px] text-slate-500 font-mono">{student.IdNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Class & Level</span>
                <span className="font-bold text-slate-900 block">{enrolledClass?.ClassName}</span>
                <span className="text-[10px] text-emerald-900 font-bold">{enrolledClass?.Department}</span>
              </div>
            </div>

            {/* Quarters Cleared Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Quarter Cleared Status for Academic Exams
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {QUARTERS.map(q => {
                  const rec = ledger?.Payments[q.period];
                  const isPaid = rec?.isPaid ?? false;
                  return (
                    <div
                      key={q.period}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isPaid
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div>
                        <span className="font-bold">{q.titleEn}</span>
                        <span className="font-serif text-[11px] ml-1">({q.titleAr})</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isPaid ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {isPaid ? 'PERMITTED' : 'HOLD'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signature & Official Seal Lines */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                  <span className="font-serif text-slate-600 text-[11px]">أمين الصندوق (Kamal Al-Deen)</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase mt-1 block">Cashier Signature</span>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                  <span className="font-serif text-slate-600 text-[11px]">عمادة شؤون الطلاب (Dean of Affairs)</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase mt-1 block">Dean's Seal & Stamp</span>
              </div>
            </div>

            {/* Print & Close Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#126b38] hover:bg-[#0e582e] text-white rounded-xl text-xs font-bold shadow cursor-pointer inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
