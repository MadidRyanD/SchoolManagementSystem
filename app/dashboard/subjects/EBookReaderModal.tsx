'use client';

import React, { useState, useEffect, useRef } from 'react';
import SchoolArabicTitle from '@/app/components/SchoolArabicTitle';
import {
  DataStore,
  saveEBookBlob,
  getEBookBlob,
  isSubjectSpecificUrl,
} from '@/lib/store';
import { SubjectItem, SubjectEBookItem, UserSession } from '@/lib/types';
import {
  BookOpen,
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  Trash2,
  FileText,
  Plus,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Link as LinkIcon,
  Eye,
} from 'lucide-react';

interface EBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectItem | null;
  classNameStr?: string;
  canUpload?: boolean;
  currentUser?: UserSession | null;
  initialShowUpload?: boolean;
  onBooksChanged?: () => void;
}

export default function EBookReaderModal({
  isOpen,
  onClose,
  subject,
  classNameStr,
  canUpload = false,
  currentUser = null,
  initialShowUpload = false,
  onBooksChanged,
}: EBookReaderModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [books, setBooks] = useState<SubjectEBookItem[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);

  // Upload Form State (Strictly for Ustadh / Admin / Principal)
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [bookTitleInput, setBookTitleInput] = useState('');
  const [bookUrlInput, setBookUrlInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Strict role verification: Students can NEVER upload or delete books
  const isAllowedToUpload =
    Boolean(canUpload) &&
    (currentUser?.role === 'teacher' ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'mudir');

  useEffect(() => {
    if (isOpen && subject) {
      loadSubjectBooks(subject);
      setShowUploadPanel(isAllowedToUpload && initialShowUpload);
      setBookTitleInput('');
      setBookUrlInput('');
      setSelectedFiles([]);
      setFeedback(null);
    } else {
      setBooks([]);
      setActiveBookId(null);
    }
  }, [isOpen, subject, isAllowedToUpload, initialShowUpload]);

  const loadSubjectBooks = (sub: SubjectItem) => {
    const storedBooks = DataStore.getSubjectEBooks(sub.SubjectID);
    const combined: SubjectEBookItem[] = [...storedBooks];

    // Include subject-specific BookDriveUrl if set on SubjectItem (ignoring generic central folder)
    if (isSubjectSpecificUrl(sub.BookDriveUrl)) {
      const alreadyExists = combined.some(b => b.driveUrl === sub.BookDriveUrl);
      if (!alreadyExists) {
        combined.unshift({
          id: `legacy-sub-${sub.SubjectID}`,
          SubjectID: sub.SubjectID,
          ClassID: sub.ClassID,
          title: sub.BookTitle || `كتاب مقرر ${sub.SubjectArabic || sub.SubjectClass}`,
          driveUrl: sub.BookDriveUrl,
          hasLocalFile: false,
          uploadedBy: 'Academic Administration',
          uploadedByRole: 'admin',
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    setBooks(combined);
    if (combined.length > 0) {
      setActiveBookId(prev =>
        prev && combined.some(b => b.id === prev) ? prev : combined[0].id
      );
    } else {
      setActiveBookId(null);
    }
  };

  const activeBook = books.find(b => b.id === activeBookId) || null;

  // Load binary Blob from IndexedDB when activeBook changes
  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    async function resolveBlob() {
      if (!activeBook || !activeBook.hasLocalFile) {
        setActiveBlobUrl(null);
        setLoadingBlob(false);
        return;
      }

      setLoadingBlob(true);
      try {
        const blob = await getEBookBlob(activeBook.id);
        if (!cancelled && blob) {
          const url = URL.createObjectURL(blob);
          revokedUrl = url;
          setActiveBlobUrl(url);
        } else if (!cancelled) {
          setActiveBlobUrl(null);
        }
      } catch {
        if (!cancelled) setActiveBlobUrl(null);
      } finally {
        if (!cancelled) setLoadingBlob(false);
      }
    }

    resolveBlob();

    return () => {
      cancelled = true;
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [activeBook?.id, activeBook?.hasLocalFile]);

  if (!isOpen || !subject) return null;

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';

    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
    }

    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }

    const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
    }

    return url;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList);
    setSelectedFiles(arr);
    if (!bookTitleInput.trim() && arr.length === 1) {
      const cleanName = arr[0].name.replace(/\.[^/.]+$/, '');
      setBookTitleInput(cleanName);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToUpload || !currentUser) {
      setFeedback({
        text: 'غير مصرح: فقط الأستاذ أو المدير أو المشرف يمكنه رفع الكتب الدراسية.',
        type: 'error',
      });
      return;
    }

    if (uploadMode === 'file') {
      if (selectedFiles.length === 0) {
        setFeedback({
          text: 'يرجى اختيار ملف الكتاب (PDF أو مستند) أولاً.',
          type: 'error',
        });
        return;
      }

      setUploading(true);
      try {
        let lastSavedId: string | null = null;
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          const title =
            selectedFiles.length === 1 && bookTitleInput.trim()
              ? bookTitleInput.trim()
              : cleanName || `كتاب ${subject.SubjectArabic || subject.SubjectClass}`;

          const savedMeta = DataStore.saveSubjectEBook({
            SubjectID: subject.SubjectID,
            ClassID: subject.ClassID,
            title,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
            hasLocalFile: true,
            uploadedBy: currentUser.nameArabic || currentUser.name,
            uploadedByRole: currentUser.role,
          });

          await saveEBookBlob(savedMeta.id, file);
          lastSavedId = savedMeta.id;
        }

        loadSubjectBooks(subject);
        if (lastSavedId) setActiveBookId(lastSavedId);
        setSelectedFiles([]);
        setBookTitleInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowUploadPanel(false);
        setFeedback({
          text: `تم رفع الكتاب بنجاح لمادة «${subject.SubjectArabic || subject.SubjectClass}» فقط!`,
          type: 'success',
        });
        onBooksChanged?.();
      } catch (err: any) {
        setFeedback({
          text: err?.message || 'حدث خطأ أثناء رفع وحفظ الكتاب.',
          type: 'error',
        });
      } finally {
        setUploading(false);
      }
    } else {
      if (!bookUrlInput.trim()) {
        setFeedback({
          text: 'يرجى إدخال رابط ملف الكتاب المخصص لهذه المادة.',
          type: 'error',
        });
        return;
      }
      if (!isSubjectSpecificUrl(bookUrlInput.trim())) {
        setFeedback({
          text: 'يرجى إدخال رابط كتاب خاص بهذه المادة فقط وليس مجلد المكتبة العام.',
          type: 'error',
        });
        return;
      }

      const title =
        bookTitleInput.trim() || `كتاب مقرر ${subject.SubjectArabic || subject.SubjectClass}`;
      const savedMeta = DataStore.saveSubjectEBook({
        SubjectID: subject.SubjectID,
        ClassID: subject.ClassID,
        title,
        driveUrl: bookUrlInput.trim(),
        hasLocalFile: false,
        uploadedBy: currentUser.nameArabic || currentUser.name,
        uploadedByRole: currentUser.role,
      });

      loadSubjectBooks(subject);
      setActiveBookId(savedMeta.id);
      setBookTitleInput('');
      setBookUrlInput('');
      setShowUploadPanel(false);
      setFeedback({
        text: `تمت إضافة الكتاب لمادة «${subject.SubjectArabic || subject.SubjectClass}» بنجاح!`,
        type: 'success',
      });
      onBooksChanged?.();
    }
  };

  const handleDeleteBook = (book: SubjectEBookItem) => {
    if (!isAllowedToUpload) return;
    if (
      !confirm(
        `هل أنت متأكد من حذف الكتاب «${book.title}» من مادة ${
          subject.SubjectArabic || subject.SubjectClass
        }؟`
      )
    ) {
      return;
    }

    if (book.id.startsWith('legacy-sub-')) {
      DataStore.saveSubject({
        ...subject,
        BookDriveUrl: undefined,
        BookTitle: undefined,
      });
    } else {
      DataStore.deleteSubjectEBook(book.id);
    }

    loadSubjectBooks({
      ...subject,
      BookDriveUrl: book.id.startsWith('legacy-sub-') ? undefined : subject.BookDriveUrl,
    });
    setFeedback({
      text: `تم حذف الكتاب «${book.title}» بنجاح.`,
      type: 'success',
    });
    onBooksChanged?.();
  };

  const subjectDisplayAr = subject.SubjectArabic || subject.SubjectClass;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'
        }`}
      >
        {/* Modal Top Navigation Bar */}
        <div className="bg-[#126b38] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-sm flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 font-mono">
                  Subject E-Book &bull; كتاب المقرر الخاص بالمادة فقط
                </span>
                {subject.SubjectCode && (
                  <span className="text-[11px] text-emerald-200 font-mono font-bold">
                    [{subject.SubjectCode}]
                  </span>
                )}
                {classNameStr && (
                  <span className="text-[11px] text-amber-200 font-serif" dir="rtl">
                    &bull; {classNameStr}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span className="font-serif">كتاب مقرر: {subjectDisplayAr}</span>
                <span className="text-emerald-200 text-xs font-normal">
                  ({subject.SubjectClass} &bull; {books.length}{' '}
                  {books.length === 1 ? 'Book' : 'Books'})
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Upload Toggle Button — ONLY FOR USTADH / ADMIN / PRINCIPAL */}
            {isAllowedToUpload ? (
              <button
                type="button"
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer ${
                  showUploadPanel
                    ? 'bg-white text-emerald-950'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {showUploadPanel
                    ? 'إغلاق نافذة الرفع (Close Upload)'
                    : 'رفع كتاب لهذه المادة (Upload Book)'}
                </span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/70 border border-emerald-700 text-[11px] text-emerald-200 font-serif">
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>وضع القراءة والتحميل للطلاب (View & Download Only)</span>
              </span>
            )}

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
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-red-700/80 transition-colors cursor-pointer"
              title="إغلاق (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Upload Panel (Strictly for Ustadh / Admin / Principal) */}
        {isAllowedToUpload && showUploadPanel && (
          <div
            className="bg-amber-50/90 border-b-2 border-amber-200 p-4 sm:p-5 shrink-0 animate-fadeIn"
            dir="rtl"
          >
            <form onSubmit={handleUploadSubmit} className="max-w-4xl mx-auto space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 font-serif">
                    رفع كتاب إلكتروني مخصص لمادة «{subjectDisplayAr}» (صلاحية الأستاذ / المدير / المشرف)
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-300">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                      uploadMode === 'file'
                        ? 'bg-[#126b38] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع ملف PDF من الجهاز</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                      uploadMode === 'url'
                        ? 'bg-[#126b38] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>إضافة رابط كتاب خاص بالمادة</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-serif">
                    عنوان الكتاب المقرر (Book Title)
                  </label>
                  <input
                    type="text"
                    value={bookTitleInput}
                    onChange={e => setBookTitleInput(e.target.value)}
                    placeholder={`مثال: كتاب مقرر ${subjectDisplayAr}`}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {uploadMode === 'file' ? (
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-serif">
                      اختر ملف الكتاب (PDF / صورة / مستند)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white file:mr-0 file:ml-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-serif">
                      رابط ملف الكتاب (Direct PDF or Google Drive File URL)
                    </label>
                    <input
                      type="url"
                      value={bookUrlInput}
                      onChange={e => setBookUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view"
                      dir="ltr"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                )}

                <div className="md:col-span-3 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-2 px-4 bg-[#126b38] hover:bg-[#0e582e] disabled:opacity-50 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'جاري الرفع...' : 'حفظ ورفع الكتاب للمادة'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Main Body: Subject Books Sidebar + Reader Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          {books.length === 0 ? (
            /* Empty State: Strictly no generic fallback books from other subjects */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" dir="rtl">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 text-amber-800 flex items-center justify-center mb-4 shadow-sm">
                <BookOpen className="w-10 h-10" />
              </div>
              <h4 className="text-lg sm:text-xl font-black text-slate-900 font-serif">
                لا يوجد كتاب إلكتروني مرفوع لمادة «{subjectDisplayAr}» حتى الآن
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mt-1.5 font-serif leading-relaxed">
                تُعرض هنا فقط الكتب المخصصة لمادة <strong>{subjectDisplayAr}</strong>. لم يتم رفع كتاب لهذه المادة بعد.
              </p>
              <p className="text-xs text-slate-400 font-sans mt-1" dir="ltr">
                No E-Book has been uploaded for {subject.SubjectClass} yet. Only books intended for this subject are displayed here.
              </p>

              {isAllowedToUpload ? (
                <button
                  type="button"
                  onClick={() => setShowUploadPanel(true)}
                  className="mt-5 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md cursor-pointer flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>رفع كتاب مقرر «{subjectDisplayAr}» الآن (Upload Subject E-Book)</span>
                </button>
              ) : (
                <div className="mt-5 px-4 py-2.5 rounded-xl bg-slate-200/80 text-slate-700 text-xs font-bold font-serif">
                  ملاحظة: يتم رفع الكتب الدراسية بواسطة أستاذ المادة (Ustadh) أو المدير أو المشرف فقط.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Books List for THIS Subject Only */}
              <div
                className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 max-h-48 md:max-h-none overflow-y-auto"
                dir="rtl"
              >
                <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 font-serif flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>كتب مادة {subjectDisplayAr} ({books.length})</span>
                  </span>
                  {isAllowedToUpload && (
                    <button
                      type="button"
                      onClick={() => setShowUploadPanel(true)}
                      className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  )}
                </div>

                <div className="p-2.5 space-y-2 flex-1 overflow-y-auto">
                  {books.map(b => {
                    const isSelected = b.id === activeBook?.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setActiveBookId(b.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 font-serif truncate">
                            {b.title}
                          </p>
                          {b.fileName && (
                            <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5" dir="ltr">
                              {b.fileName} {b.fileSize ? `(${formatFileSize(b.fileSize)})` : ''}
                            </p>
                          )}
                          <p className="text-[10px] text-emerald-800 font-serif mt-1">
                            بواسطة: {b.uploadedBy}
                          </p>
                        </div>

                        {isAllowedToUpload && (
                          <button
                            type="button"
                            onClick={ev => {
                              ev.stopPropagation();
                              handleDeleteBook(b);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="حذف الكتاب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Book Embedded Viewer */}
              <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
                {loadingBlob ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-serif">
                    جاري فتح وتحميل كتاب المادة...
                  </div>
                ) : activeBook?.hasLocalFile ? (
                  activeBlobUrl ? (
                    activeBook.mimeType?.startsWith('image/') ? (
                      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-900">
                        <img
                          src={activeBlobUrl}
                          alt={activeBook.title}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={activeBlobUrl}
                        title={activeBook.title}
                        className="w-full h-full border-0 flex-1"
                      />
                    )
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-serif">
                      تعذر قراءة ملف الكتاب المحلي. يرجى إعادة رفعه.
                    </div>
                  )
                ) : activeBook?.driveUrl ? (
                  <iframe
                    src={getEmbedUrl(activeBook.driveUrl)}
                    title={activeBook.title}
                    className="w-full h-full border-0 flex-1"
                    allow="autoplay"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Bottom Status & Download Bar */}
        <div
          className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 shrink-0"
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="inline-flex items-center gap-1.5 font-serif">
              <span>مكتبة المادة المخصصة ({subjectDisplayAr}) &bull;</span>
              <SchoolArabicTitle
                variant="dark"
                imgClassName="h-5 w-auto object-contain inline-block"
                fallbackClassName="font-serif"
              />
              <span>(JMAA-MoritAko)</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeBook && activeBook.hasLocalFile && activeBlobUrl && (
              <a
                href={activeBlobUrl}
                download={activeBook.fileName || `${activeBook.title}.pdf`}
                className="text-emerald-800 hover:underline font-bold flex items-center gap-1 font-serif"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل الكتاب ({activeBook.title})</span>
              </a>
            )}
            {activeBook && !activeBook.hasLocalFile && activeBook.driveUrl && (
              <a
                href={activeBook.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 hover:underline font-bold flex items-center gap-1 font-serif"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح / تنزيل الكتاب ({activeBook.title})</span>
              </a>
            )}
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
