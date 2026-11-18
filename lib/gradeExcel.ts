import type ExcelJS from 'exceljs';
import {
  ClassItem,
  GradingCriteria,
  GradingPeriod,
  StudentItem,
  SubjectItem,
  TaqdirScale,
} from './types';
import { DEFAULT_TAQDIR_SCALE, getTaqdirRating } from './store';

async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function colLetter(colIndex1Based: number): string {
  let letter = '';
  let n = colIndex1Based;
  while (n > 0) {
    const mod = (n - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function getDepartmentArabic(dept?: string): string {
  if (dept === '2-days') return 'يومين';
  if (dept === '5-days') return 'خمسة أيام';
  return dept || '';
}

async function addSchoolHeaderToSheet(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  meta: {
    academicYear: string;
    semesterLabel: string;
    gradeLevel: string;
    subjectName: string;
    periodLabel: string;
  }
) {
  // Set RTL view on the worksheet
  worksheet.views = [{ rightToLeft: true }];

  // Row heights for banner + metadata
  worksheet.getRow(1).height = 38;
  worksheet.getRow(2).height = 24;
  worksheet.getRow(3).height = 22;
  worksheet.getRow(4).height = 22;
  worksheet.getRow(5).height = 22;
  worksheet.getRow(6).height = 12;

  // Fetch logo and calligraphy images
  const [logoBuf, titleBuf] = await Promise.all([
    fetchImageBuffer('/logo.png'),
    fetchImageBuffer('/school-title-ar.png'),
  ]);

  if (logoBuf) {
    const logoId = workbook.addImage({
      buffer: logoBuf,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 1.15, row: 0.1 },
      ext: { width: 72, height: 72 },
    });
  }

  if (titleBuf) {
    const titleId = workbook.addImage({
      buffer: titleBuf,
      extension: 'png',
    });
    worksheet.addImage(titleId, {
      tl: { col: 2.8, row: 0.2 },
      ext: { width: 320, height: 64 },
    });
  }

  // Metadata Block matching Picture 5:
  // Right side (Cols B & C): المرحلة, المادة, الفترة
  // Left side (Cols E & F): العام الدراسي, الفصل
  const metaRight: [number, string, string][] = [
    [3, 'المرحلة:', meta.gradeLevel],
    [4, 'المادة:', meta.subjectName],
    [5, 'الفترة:', meta.periodLabel],
  ];

  metaRight.forEach(([rowIdx, label, val]) => {
    const labelCell = worksheet.getCell(rowIdx, 2); // Col B
    labelCell.value = label;
    labelCell.font = { bold: true, size: 11, name: 'Calibri' };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const valCell = worksheet.getCell(rowIdx, 3); // Col C
    valCell.value = val;
    valCell.font = { size: 11, name: 'Calibri' };
    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valCell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  const metaLeft: [number, string, string][] = [
    [3, 'العام الدراسي:', meta.academicYear],
    [4, 'الفصل:', meta.semesterLabel],
  ];

  metaLeft.forEach(([rowIdx, label, val]) => {
    const labelCell = worksheet.getCell(rowIdx, 5); // Col E
    labelCell.value = label;
    labelCell.font = { bold: true, size: 11, name: 'Calibri' };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const valCell = worksheet.getCell(rowIdx, 6); // Col F
    valCell.value = val;
    valCell.font = { size: 11, name: 'Calibri' };
    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valCell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });
}

function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  return workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD8E4BC' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

export async function exportGradesToExcelRTL(params: {
  subject: SubjectItem;
  classItem: ClassItem;
  students: StudentItem[];
  gridValues: Record<number, Record<string, string>>;
  viewMode: 'dawr' | 'semester';
  selectedPeriod: GradingPeriod;
  selectedSemester: '1st' | '2nd';
  activePeriods: GradingPeriod[];
  academicYear: string;
  taqdirScale?: TaqdirScale;
}) {
  const ExcelJSModule = await import('exceljs');
  const ExcelJSClass = ExcelJSModule.default;
  const workbook = new ExcelJSClass.Workbook();
  const sheetName = (params.subject.SubjectArabic || params.subject.SubjectClass || 'Grades').substring(0, 30);
  const worksheet = workbook.addWorksheet(sheetName);

  const dawrArabicNames: Record<GradingPeriod, string> = {
    '1st': 'دور الأول',
    '2nd': 'دور الثاني',
    '3rd': 'دور الثالث',
    '4th': 'دور الرابع',
    '5th': 'دور الخامس',
    '6th': 'دور السادس',
  };

  const deptAr = getDepartmentArabic(params.classItem.Department);
  const gradeLevel = deptAr ? `${params.classItem.ClassName} (${deptAr})` : params.classItem.ClassName;
  const semesterLabel = params.selectedSemester === '1st' ? 'الأول' : 'الثاني';
  const periodLabel =
    params.viewMode === 'dawr'
      ? dawrArabicNames[params.selectedPeriod]
      : `كشف الفصل ${semesterLabel}`;

  await addSchoolHeaderToSheet(workbook, worksheet, {
    academicYear: params.academicYear.replace(/^SY\s*/i, ''),
    semesterLabel,
    gradeLevel,
    subjectName: params.subject.SubjectArabic || params.subject.SubjectClass,
    periodLabel,
  });

  const scale = params.taqdirScale || DEFAULT_TAQDIR_SCALE;
  const headerRowIdx = 7;

  if (params.viewMode === 'dawr') {
    worksheet.columns = [
      { key: 'id', width: 14 },
      { key: 'seq', width: 8 },
      { key: 'name', width: 38 },
      { key: 'score', width: 14 },
      { key: 'taqdir', width: 16 },
      { key: 'extra', width: 16 },
    ];

    const headers = ['الرقم (ID)', 'م', 'اسم الطالب', 'الدرجة', 'التقدير'];
    const headerRow = worksheet.getRow(headerRowIdx);
    headerRow.height = 24;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 12, name: 'Calibri' };
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    params.students.forEach((s, idx) => {
      const rIdx = headerRowIdx + 1 + idx;
      const row = worksheet.getRow(rIdx);
      row.height = 21;
      const raw = (params.gridValues[s.StudentID]?.[params.selectedPeriod] || '').trim().toUpperCase();
      const num = parseFloat(raw);
      const scoreVal: string | number = !isNaN(num) ? num : raw || '';
      const rating = !isNaN(num)
        ? getTaqdirRating(num, scale, 'INC').labelAr
        : raw === 'INC'
        ? 'INC'
        : raw === 'DRP'
        ? 'DRP'
        : '';

      const vals: (string | number)[] = [
        s.RollNo || String(s.StudentID),
        idx + 1,
        s.NameArabic || s.Name,
        scoreVal,
        rating,
      ];

      vals.forEach((v, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = v;
        cell.font = { size: 11, name: 'Calibri' };
        cell.border = THIN_BORDER;
        cell.alignment = {
          horizontal: colIdx === 2 ? 'right' : 'center',
          vertical: 'middle',
        };
      });
    });
  } else {
    worksheet.columns = [
      { key: 'id', width: 14 },
      { key: 'seq', width: 8 },
      { key: 'name', width: 36 },
      { key: 'd1', width: 12 },
      { key: 'd2', width: 12 },
      { key: 'd3', width: 12 },
      { key: 'sum', width: 13 },
      { key: 'avg', width: 13 },
      { key: 'taqdir', width: 16 },
    ];

    const headers = ['الرقم (ID)', 'م', 'اسم الطالب', 'دور ١', 'دور ٢', 'دور ٣', 'المجموع', 'المعدل', 'التقدير'];
    const headerRow = worksheet.getRow(headerRowIdx);
    headerRow.height = 24;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 12, name: 'Calibri' };
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    params.students.forEach((s, idx) => {
      const rIdx = headerRowIdx + 1 + idx;
      const row = worksheet.getRow(rIdx);
      row.height = 21;
      const studentRow = params.gridValues[s.StudentID] || {};
      const rawList = params.activePeriods.map(p => (studentRow[p] || '').trim().toUpperCase());
      const hasINC = rawList.includes('INC');
      const hasDRP = rawList.includes('DRP');
      const validNums = rawList.map(v => parseFloat(v)).filter(n => !isNaN(n));
      const sum = !hasINC && !hasDRP && validNums.length > 0 ? Math.round(validNums.reduce((a, b) => a + b, 0) * 10) / 10 : '';
      const avg = hasDRP
        ? 'DRP'
        : hasINC
        ? 'INC'
        : validNums.length > 0
        ? Math.round((validNums.reduce((a, b) => a + b, 0) / validNums.length) * 10) / 10
        : '';
      const rating =
        typeof avg === 'number'
          ? getTaqdirRating(avg, scale, 'INC').labelAr
          : avg;

      const vals: (string | number)[] = [
        s.RollNo || String(s.StudentID),
        idx + 1,
        s.NameArabic || s.Name,
        ...rawList.map(v => {
          const n = parseFloat(v);
          return !isNaN(n) ? n : v;
        }),
        sum,
        avg,
        rating,
      ];

      vals.forEach((v, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = v;
        cell.font = { size: 11, name: 'Calibri' };
        cell.border = THIN_BORDER;
        cell.alignment = {
          horizontal: colIdx === 2 ? 'right' : 'center',
          vertical: 'middle',
        };
      });
    });
  }

  const filename = `${params.subject.SubjectClass}_${params.classItem.ClassName}_${
    params.viewMode === 'dawr' ? params.selectedPeriod : params.selectedSemester
  }.xlsx`;
  await downloadWorkbook(workbook, filename);
}

export async function exportCriteriaTemplateRTL(params: {
  subject: SubjectItem;
  classItem: ClassItem;
  students: StudentItem[];
  criteriaList: GradingCriteria[];
  criteriaScoresGrid: Record<number, Record<string, string>>;
  selectedPeriod: GradingPeriod;
  selectedSemester: '1st' | '2nd';
  academicYear: string;
  taqdirScale?: TaqdirScale;
}) {
  const ExcelJSModule = await import('exceljs');
  const ExcelJSClass = ExcelJSModule.default;
  const workbook = new ExcelJSClass.Workbook();
  const sheetName = (params.subject.SubjectArabic || params.subject.SubjectClass || 'Template').substring(0, 30);
  const worksheet = workbook.addWorksheet(sheetName);

  const dawrArabicNames: Record<GradingPeriod, string> = {
    '1st': 'دور الأول',
    '2nd': 'دور الثاني',
    '3rd': 'دور الثالث',
    '4th': 'دور الرابع',
    '5th': 'دور الخامس',
    '6th': 'دور السادس',
  };

  const deptAr = getDepartmentArabic(params.classItem.Department);
  const gradeLevel = deptAr ? `${params.classItem.ClassName} (${deptAr})` : params.classItem.ClassName;
  const semesterLabel = params.selectedSemester === '1st' ? 'الأول' : 'الثاني';
  const periodLabel = dawrArabicNames[params.selectedPeriod];

  await addSchoolHeaderToSheet(workbook, worksheet, {
    academicYear: params.academicYear.replace(/^SY\s*/i, ''),
    semesterLabel,
    gradeLevel,
    subjectName: params.subject.SubjectArabic || params.subject.SubjectClass,
    periodLabel,
  });

  const scale = params.taqdirScale || DEFAULT_TAQDIR_SCALE;
  const headerRowIdx = 7;

  // Columns: ID (1), م (2), اسم الطالب (3), ...criteria (4..3+N), الدرجة (4+N), التقدير (5+N)
  const cols: Partial<ExcelJS.Column>[] = [
    { key: 'id', width: 14 },
    { key: 'seq', width: 7 },
    { key: 'name', width: 34 },
    ...params.criteriaList.map((c, i) => ({ key: `crit_${i}`, width: Math.max(16, c.name.length + 4) })),
    { key: 'total', width: 15 },
    { key: 'taqdir', width: 15 },
  ];
  worksheet.columns = cols;

  const headers = [
    'الرقم (ID)',
    'م',
    'اسم الطالب',
    ...params.criteriaList.map(c => `${c.name} (${c.weight}%)`),
    'الدرجة',
    'التقدير',
  ];

  const headerRow = worksheet.getRow(headerRowIdx);
  headerRow.height = 26;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, name: 'Calibri' };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.protection = { locked: true };
  });

  const firstCritColIdx = 4; // 1-based (Col D)
  const lastCritColIdx = 3 + params.criteriaList.length;
  const totalColIdx = lastCritColIdx + 1;
  const taqdirColIdx = lastCritColIdx + 2;

  const firstCritLetter = colLetter(firstCritColIdx);
  const lastCritLetter = colLetter(lastCritColIdx);
  const totalLetter = colLetter(totalColIdx);

  const unlockedFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFDE7' },
  };

  params.students.forEach((s, idx) => {
    const rIdx = headerRowIdx + 1 + idx;
    const row = worksheet.getRow(rIdx);
    row.height = 22;

    // 1. ID (LOCKED)
    const idCell = row.getCell(1);
    idCell.value = s.RollNo || String(s.StudentID);
    idCell.font = { size: 11, name: 'Calibri' };
    idCell.border = THIN_BORDER;
    idCell.alignment = { horizontal: 'center', vertical: 'middle' };
    idCell.protection = { locked: true };

    // 2. Sequence م (LOCKED)
    const seqCell = row.getCell(2);
    seqCell.value = idx + 1;
    seqCell.font = { size: 11, name: 'Calibri' };
    seqCell.border = THIN_BORDER;
    seqCell.alignment = { horizontal: 'center', vertical: 'middle' };
    seqCell.protection = { locked: true };

    // 3. Student Name (LOCKED)
    const nameCell = row.getCell(3);
    nameCell.value = s.NameArabic || s.Name;
    nameCell.font = { size: 11, bold: true, name: 'Calibri' };
    nameCell.border = THIN_BORDER;
    nameCell.alignment = { horizontal: 'right', vertical: 'middle' };
    nameCell.protection = { locked: true };

    // 4..3+N. Criteria Columns (UNLOCKED - editable by Ustadh)
    const studentCritScores = params.criteriaScoresGrid[s.StudentID] || {};
    params.criteriaList.forEach((c, cIdx) => {
      const cell = row.getCell(firstCritColIdx + cIdx);
      const rawScore = studentCritScores[c.id];
      const numScore = rawScore !== undefined && rawScore !== '' ? parseFloat(rawScore) : NaN;
      cell.value = !isNaN(numScore) ? numScore : null;
      cell.font = { size: 11, name: 'Calibri', bold: true };
      cell.fill = unlockedFill;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.protection = { locked: false };
    });

    // 4+N. الدرجة (SUM Formula - LOCKED)
    const totalCell = row.getCell(totalColIdx);
    totalCell.value = {
      formula: `IF(COUNT(${firstCritLetter}${rIdx}:${lastCritLetter}${rIdx})=0,"",SUM(${firstCritLetter}${rIdx}:${lastCritLetter}${rIdx}))`,
    };
    totalCell.font = { size: 11, bold: true, name: 'Calibri' };
    totalCell.border = THIN_BORDER;
    totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
    totalCell.protection = { locked: true };

    // 5+N. التقدير (Formula based on TaqdirScale - LOCKED)
    const taqdirCell = row.getCell(taqdirColIdx);
    taqdirCell.value = {
      formula: `IF(${totalLetter}${rIdx}="","",IF(${totalLetter}${rIdx}>=${scale.mumtazMin},"ممتاز",IF(${totalLetter}${rIdx}>=${scale.jayyidJiddanMin},"جيد جدا",IF(${totalLetter}${rIdx}>=${scale.jayyidMin},"جيد",IF(${totalLetter}${rIdx}>=${scale.maqboolMin},"مقبول","راسب")))))`,
    };
    taqdirCell.font = { size: 11, bold: true, name: 'Calibri' };
    taqdirCell.border = THIN_BORDER;
    taqdirCell.alignment = { horizontal: 'center', vertical: 'middle' };
    taqdirCell.protection = { locked: true };
  });

  // Protect worksheet so formulas, student IDs, and student names cannot be edited
  await worksheet.protect('jmaa-grades', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertRows: false,
    deleteRows: false,
  });

  const filename = `Template_${params.subject.SubjectClass}_${params.classItem.ClassName}_${params.selectedPeriod}.xlsx`;
  await downloadWorkbook(workbook, filename);
}
