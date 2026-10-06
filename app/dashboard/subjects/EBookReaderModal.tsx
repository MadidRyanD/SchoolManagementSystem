'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Download,
  FolderOpen,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface EBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  arabicTitle?: string;
  subjectName?: string;
  driveUrl?: string;
}

export default function EBookReaderModal({
  isOpen,
  onClose,
  title,
  arabicTitle,
  subjectName,
  driveUrl = 'https://drive.google.com/drive/folders/1fCXKezhMzm93fm9S98keWyxLfG-N2NDf?usp=drive_link',
}: EBookReaderModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  // Extract Google Drive ID (Folder ID or File ID)
  const getEmbedUrl = (url: string) => {
    if (!url) {
      return 'https://drive.google.com/embeddedfolderview?id=1fCXKezhMzm93fm9S98keWyxLfG-N2NDf#grid';
    }

    // 1. Folder URL match: /folders/([a-zA-Z0-9_-]+)
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
    }

    // 2. File URL match: /d/([a-zA-Z0-9_-]+)
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }

    // 3. Query param id=([a-zA-Z0-9_-]+)
    const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${idMatch[1]}#grid`;
    }

    return url;
  };

  const embedUrl = getEmbedUrl(driveUrl);
  const isFolder = embedUrl.includes('embeddedfolderview');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Modal Top Navigation Bar */}
        <div className="bg-[#126b38] text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 shadow-sm flex items-center justify-center">
              {isFolder ? <FolderOpen className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 font-mono">
                  {isFolder ? 'Google Drive E-Library • المكتبة الرقمية' : 'Course E-Book • كتاب المقرر'}
                </span>
                {subjectName && (
                  <span className="text-[11px] text-emerald-200 font-serif">
                    &bull; {subjectName}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>{arabicTitle || title}</span>
                {title && arabicTitle && (
                  <span className="text-emerald-200 text-xs font-normal">({title})</span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Help Button */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
              title="تعليمات الاستخدام (Help)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* External Google Drive Link */}
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فتح في Google Drive</span>
              <span className="sm:hidden">Drive</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-red-700/80 transition-colors cursor-pointer ml-1"
              title="إغلاق (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helpful Tip Banner (Collapsible) */}
        {showHelp && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>تلميح:</strong> يمكنك النقر المزدوج على أي ملف داخل المجلد لتصفحه وقراءته مباشرة، أو تنزيله لجهازك عبر الزر أعلى اليمين. تأكد من ضبط إذن المجلد في Google Drive إلى <em>"أي شخص لديه الرابط يمكنه العرض"</em>.
              </span>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Iframe Reader Container */}
        <div className="flex-1 w-full bg-slate-100 relative overflow-hidden">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>

        {/* Bottom Status & Download Bar */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 shrink-0" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-serif">
              المكتبة السحابية متصلة &bull; جامعة منيب الكزبري العربية (JMAA-MoritAko)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-800 hover:underline font-bold flex items-center gap-1 font-serif"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل الملفات والمقررات (Download Files)</span>
            </a>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
