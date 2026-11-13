import * as XLSX from 'xlsx';
import { StudentItem, ClassItem } from './types';

export interface GradeDefinition {
  code: string; // 'ب 1', 'ب 2', etc.
  nameAr: string; // 'السنة الأولى من المرحلة الابتدائية'
  nameEn: string; // 'Ibtidaiyyah - Grade 1'
  level: 'Ibtidaiyyah' | 'Mutawassit' | 'Thanawi' | 'Kulliyatu Tarbiya' | 'Kulliyatu Shariah' | 'Kulliyatu Dawa' | '2-Days' | 'Other';
  yearGrade: number;
  classId?: number;
  category: 'primary' | 'intermediate' | 'secondary' | 'college' | 'other';
}

export const GRADE_DEFINITIONS: GradeDefinition[] = [
  // Primary (الابتدائية) - Purple
  { code: 'ب 1', nameAr: 'السنة الأولى من المرحلة الابتدائية', nameEn: 'Ibtidaiyyah - Grade 1-A', level: 'Ibtidaiyyah', yearGrade: 1, classId: 1, category: 'primary' },
  { code: 'ب 2', nameAr: 'السنة الثانية من المرحلة الابتدائية', nameEn: 'Ibtidaiyyah - Grade 2-A', level: 'Ibtidaiyyah', yearGrade: 2, classId: 2, category: 'primary' },
  { code: 'ب 3', nameAr: 'السنة الثالثة من المرحلة الابتدائية', nameEn: 'Ibtidaiyyah - Grade 3-A', level: 'Ibtidaiyyah', yearGrade: 3, classId: 3, category: 'primary' },
  { code: 'ب 4', nameAr: 'السنة الرابعة من المرحلة الابتدائية', nameEn: 'Ibtidaiyyah - Grade 4-A', level: 'Ibtidaiyyah', yearGrade: 4, classId: 4, category: 'primary' },
  { code: 'ب 5', nameAr: 'السنة الخامسة من المرحلة الابتدائية', nameEn: 'Ibtidaiyyah - Grade 5-A', level: 'Ibtidaiyyah', yearGrade: 5, classId: 5, category: 'primary' },
  { code: 'ب 6', nameAr: 'السنة السادسة من المرحلة الابتدائية', nameEn: 'Ibtidaiyyah - Grade 6-A', level: 'Ibtidaiyyah', yearGrade: 6, classId: 6, category: 'primary' },

  // Intermediate (المتوسطة) - Peach / Orange
  { code: '1 م', nameAr: 'السنة الأولى من المرحلة المتوسطة', nameEn: 'Mutawassit - Year 1-A', level: 'Mutawassit', yearGrade: 1, classId: 7, category: 'intermediate' },
  { code: '2 م', nameAr: 'السنة الثانية من المرحلة المتوسطة', nameEn: 'Mutawassit - Year 2-A', level: 'Mutawassit', yearGrade: 2, classId: 8, category: 'intermediate' },
  { code: '3 م', nameAr: 'السنة الثالثة من المرحلة المتوسطة', nameEn: 'Mutawassit - Year 3-A', level: 'Mutawassit', yearGrade: 3, classId: 9, category: 'intermediate' },

  // Secondary (الثانوية) - Mint Green
  { code: '1 ث', nameAr: 'السنة الأولى من المرحلة الثانوية', nameEn: 'Thanawi - Year 1-A', level: 'Thanawi', yearGrade: 1, classId: 10, category: 'secondary' },
  { code: '2 ث', nameAr: 'السنة الثانية من المرحلة الثانوية', nameEn: 'Thanawi - Year 2-A', level: 'Thanawi', yearGrade: 2, classId: 11, category: 'secondary' },
  { code: '3 ث', nameAr: 'السنة الثالثة من المرحلة الثانوية', nameEn: 'Thanawi - Year 3-A', level: 'Thanawi', yearGrade: 3, classId: 12, category: 'secondary' },

  // College - Kulliyatu Tarbiya (كلية التربية) - Sky Blue
  { code: '1 ك-ت', nameAr: 'السنة الأولى من كلية التربية', nameEn: 'Kulliyatu Tarbiya - Year 1', level: 'Kulliyatu Tarbiya', yearGrade: 1, classId: 21, category: 'college' },
  { code: '2 ك-ت', nameAr: 'السنة الثانية من كلية التربية', nameEn: 'Kulliyatu Tarbiya - Year 2', level: 'Kulliyatu Tarbiya', yearGrade: 2, classId: 22, category: 'college' },
  { code: '3 ك-ت', nameAr: 'السنة الثالثة من كلية التربية', nameEn: 'Kulliyatu Tarbiya - Year 3', level: 'Kulliyatu Tarbiya', yearGrade: 3, classId: 23, category: 'college' },
  { code: '4 ك-ت', nameAr: 'السنة الرابعة من كلية التربية', nameEn: 'Kulliyatu Tarbiya - Year 4', level: 'Kulliyatu Tarbiya', yearGrade: 4, classId: 24, category: 'college' },

  // Other College - Kulliyatu Shariah (كلية الشريعة)
  { code: '1 ك-ش', nameAr: 'السنة الأولى من كلية الشريعة', nameEn: 'Kulliyatu Shariah - Year 1', level: 'Kulliyatu Shariah', yearGrade: 1, classId: 13, category: 'other' },
  { code: '2 ك-ش', nameAr: 'السنة الثانية من كلية الشريعة', nameEn: 'Kulliyatu Shariah - Year 2', level: 'Kulliyatu Shariah', yearGrade: 2, classId: 14, category: 'other' },
  { code: '3 ك-ش', nameAr: 'السنة الثالثة من كلية الشريعة', nameEn: 'Kulliyatu Shariah - Year 3', level: 'Kulliyatu Shariah', yearGrade: 3, classId: 15, category: 'other' },
  { code: '4 ك-ش', nameAr: 'السنة الرابعة من كلية الشريعة', nameEn: 'Kulliyatu Shariah - Year 4', level: 'Kulliyatu Shariah', yearGrade: 4, classId: 16, category: 'other' },

  // Other College - Kulliyatu Dawa (كلية الدعوة)
  { code: '1 ك-د', nameAr: 'السنة الأولى من كلية الدعوة', nameEn: 'Kulliyatu Dawa - Year 1', level: 'Kulliyatu Dawa', yearGrade: 1, classId: 17, category: 'other' },
  { code: '2 ك-د', nameAr: 'السنة الثانية من كلية الدعوة', nameEn: 'Kulliyatu Dawa - Year 2', level: 'Kulliyatu Dawa', yearGrade: 2, classId: 18, category: 'other' },
  { code: '3 ك-د', nameAr: 'السنة الثالثة من كلية الدعوة', nameEn: 'Kulliyatu Dawa - Year 3', level: 'Kulliyatu Dawa', yearGrade: 3, classId: 19, category: 'other' },
  { code: '4 ك-د', nameAr: 'السنة الرابعة من كلية الدعوة', nameEn: 'Kulliyatu Dawa - Year 4', level: 'Kulliyatu Dawa', yearGrade: 4, classId: 20, category: 'other' },
];

/**
 * Normalizes Arabic text for flexible matching (removes diacritics, unifies alefs and taa marbuta)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();
}

/**
 * Finds a matching class ID from an Attribute string found in Excel (like in Picture 3)
 */
export function matchClassFromAttribute(attributeStr: string, classes: ClassItem[]): ClassItem | null {
  if (!attributeStr) return null;
  const raw = attributeStr.trim();
  const normalized = normalizeArabic(raw);

  // 1. Direct match by Grade Definition
  for (const def of GRADE_DEFINITIONS) {
    if (def.code === raw || normalizeArabic(def.nameAr) === normalized || def.nameEn.toLowerCase() === raw.toLowerCase()) {
      const found = classes.find(c => c.ClassID === def.classId) ||
        classes.find(c => c.Level === def.level && c.YearGrade === def.yearGrade && c.Department === '5-days');
      if (found) return found;
    }
  }

  // 2. Fuzzy Arabic Stage Matching
  const isIbtidai = normalized.includes('ابتدائ') || normalized.includes('ابتدائي');
  const isMutawassit = normalized.includes('متوسط') || normalized.includes('متوسطه');
  const isThanawi = normalized.includes('ثانوي') || normalized.includes('ثانويه');
  const isTarbiya = normalized.includes('تربي') || normalized.includes('تربيه');
  const isShariah = normalized.includes('شريع') || normalized.includes('شريعه');
  const isDawa = normalized.includes('دعو') || normalized.includes('دعوه');

  let gradeNumber = 0;
  if (normalized.includes('اولي') || normalized.includes('اول') || normalized.includes('1')) gradeNumber = 1;
  else if (normalized.includes('ثاني') || normalized.includes('ثانيه') || normalized.includes('2')) gradeNumber = 2;
  else if (normalized.includes('ثالث') || normalized.includes('ثالثه') || normalized.includes('3')) gradeNumber = 3;
  else if (normalized.includes('رابع') || normalized.includes('رابعه') || normalized.includes('4')) gradeNumber = 4;
  else if (normalized.includes('خامس') || normalized.includes('خامسه') || normalized.includes('5')) gradeNumber = 5;
  else if (normalized.includes('سادس') || normalized.includes('سادسه') || normalized.includes('6')) gradeNumber = 6;

  if (isIbtidai && gradeNumber > 0) {
    const found = classes.find(c => c.Level === 'Ibtidaiyyah' && c.YearGrade === gradeNumber && c.Department === '5-days');
    if (found) return found;
  }
  if (isMutawassit && gradeNumber > 0) {
    const found = classes.find(c => c.Level === 'Mutawassit' && c.YearGrade === gradeNumber && c.Department === '5-days');
    if (found) return found;
  }
  if (isThanawi && gradeNumber > 0) {
    const found = classes.find(c => c.Level === 'Thanawi' && c.YearGrade === gradeNumber && c.Department === '5-days');
    if (found) return found;
  }
  if (isTarbiya && gradeNumber > 0) {
    const found = classes.find(c => c.Level.includes('Tarbiya') && c.YearGrade === gradeNumber && c.Department === '5-days');
    if (found) return found;
  }
  if (isShariah && gradeNumber > 0) {
    const found = classes.find(c => c.Level.includes('Shariah') && c.YearGrade === gradeNumber && c.Department === '5-days');
    if (found) return found;
  }
  if (isDawa && gradeNumber > 0) {
    const found = classes.find(c => c.Level.includes('Dawa') && c.YearGrade === gradeNumber && c.Department === '5-days');
    if (found) return found;
  }

  // 3. Match against existing classes ClassName
  for (const c of classes) {
    if (c.ClassName.toLowerCase() === raw.toLowerCase() || normalizeArabic(c.ClassName) === normalized) {
      return c;
    }
  }

  return classes[0] || null;
}

/**
 * Gets the Arabic display name for a ClassItem
 */
export function getArabicClassName(classItem: ClassItem): string {
  const def = GRADE_DEFINITIONS.find(
    d => d.level === classItem.Level && d.yearGrade === classItem.YearGrade && (!d.classId || d.classId === classItem.ClassID)
  );
  if (def) return def.nameAr;
  return classItem.ClassName;
}

/**
 * Gets the short grade code for a ClassItem (e.g. 'ب 1', '2 م', '1 ك-ت')
 */
export function getGradeCode(classItem: ClassItem): string {
  const def = GRADE_DEFINITIONS.find(
    d => d.level === classItem.Level && d.yearGrade === classItem.YearGrade && (!d.classId || d.classId === classItem.ClassID)
  );
  if (def) return def.code;
  return `${classItem.YearGrade} ${classItem.Level.substring(0, 3)}`;
}

/**
 * Sorts students alphabetically by Arabic name (or English name if Arabic is missing)
 */
export function sortStudentsByName(students: StudentItem[]): StudentItem[] {
  return [...students].sort((a, b) => {
    const nameA = (a.NameArabic || a.Name || '').trim();
    const nameB = (b.NameArabic || b.Name || '').trim();
    return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
  });
}

/**
 * Parses an Excel file according to the template in Picture 3:
 * Headers: Attribute | Value
 * Row 1: Grade name in Attribute, 'الأسماء' in Value
 * Subsequent rows: Grade name in Attribute, Student name in Value
 */
export async function parseStudentsExcel(
  file: File,
  classes: ClassItem[],
  existingStudents: StudentItem[]
): Promise<{
  students: Array<Omit<StudentItem, 'StudentID'>>;
  unmatchedCount: number;
  detectedGrades: string[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to 2D array of rows
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length === 0) {
    return { students: [], unmatchedCount: 0, detectedGrades: [] };
  }

  // Find column indices for Attribute and Value
  let attrColIdx = 0;
  let valColIdx = 1;

  // Check row 0 for column headers
  const headerRow = rows[0] || [];
  for (let c = 0; c < headerRow.length; c++) {
    const colVal = String(headerRow[c] || '').trim().toLowerCase();
    if (colVal.includes('attribute') || colVal.includes('الصف') || colVal.includes('المرحلة')) {
      attrColIdx = c;
    }
    if (colVal.includes('value') || colVal.includes('الاسم') || colVal.includes('اسماء') || colVal.includes('name')) {
      valColIdx = c;
    }
  }

  const parsedStudents: Array<Omit<StudentItem, 'StudentID'>> = [];
  const detectedGradesSet = new Set<string>();
  let unmatchedCount = 0;

  // Determine starting row: if row 0 was headers, start at 1
  const startRow = (String(headerRow[attrColIdx] || '').toLowerCase().includes('attribute')) ? 1 : 0;

  // Track max roll number to generate sequential rolls
  let maxRoll = 100;
  for (const s of existingStudents) {
    const num = parseInt(s.RollNo.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxRoll) {
      maxRoll = num;
    }
  }

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const attribute = String(row[attrColIdx] || '').trim();
    const value = String(row[valColIdx] || '').trim();

    if (!value) continue;

    // Check if this row is just a subheader row: e.g. Value is 'الأسماء' or 'Name' or 'الاسم'
    const normValue = normalizeArabic(value);
    if (normValue === 'الاسماء' || normValue === 'اسم' || normValue === 'الاسم' || value.toLowerCase() === 'names' || value.toLowerCase() === 'name') {
      continue;
    }

    // Skip if it looks like the table header repeated
    if (attribute.toLowerCase() === 'attribute' && value.toLowerCase() === 'value') {
      continue;
    }

    const matchedClass = matchClassFromAttribute(attribute, classes);
    if (!matchedClass) {
      unmatchedCount++;
    }

    const targetClass = matchedClass || classes[0];
    if (attribute) detectedGradesSet.add(attribute);

    maxRoll++;
    const rollNo = `R${maxRoll}`;
    const idNumber = `STD-2026-${String(maxRoll).padStart(3, '0')}`;

    parsedStudents.push({
      RollNo: rollNo,
      IdNumber: idNumber,
      NameArabic: value,
      Name: value, // will use Arabic as primary name if transliteration not present
      ClassID: targetClass.ClassID,
      Gender: 'Male',
      Tribe: 'Maranao',
      Nationality: 'Filipino',
      AdmissionDate: new Date().toISOString().split('T')[0],
      Address: 'Marawi City',
    });
  }

  return {
    students: parsedStudents,
    unmatchedCount,
    detectedGrades: Array.from(detectedGradesSet),
  };
}

/**
 * Downloads a sample Excel import template formatted identically to Picture 3
 */
export function downloadSampleImportTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Template matching Picture 3:
  // Attribute | Value
  // السنة الثالثة من المرحلة الابتدائية | الأسماء
  // Subsequent rows: السنة الثالثة من المرحلة الابتدائية | [Student Name]
  const sampleNames = [
    'أسراف فانجنيم نصيف',
    'أسناوي علي مانجونداثو',
    'أمير حسن م. عبدالرحمن',
    'أمير حسين م. عبدالرحمن',
    'حارث حذيفي ك. سانجكوفان',
    'حسني محمود',
    'حمزه محمود',
    'حيان فسندالان',
    'صالح غونانج فنداتون',
    'عبدالحليم عبدالله',
    'عبدالرحمن بشير بندرائج',
    'عبدالمجيب طيب الصغير',
    'علي حسين امام',
    'علي مار فنيوروتان',
    'علي نور مكاسامبيت',
    'فرحان مكاتبار حاج رشيد',
    'فهد نجرون',
    'محاتر د. أبوات',
    'محسين حاج ابراهيم ياسين',
    'محسين رسول عالم الدين',
    'محمد أ. شريف',
    'محمد جدا مكاتبار ديتؤال',
    'محمد حازم عبدالله قمر الدين',
  ];

  const data: any[][] = [
    ['Attribute', 'Value'],
    ['السنة الثالثة من المرحلة الابتدائية', 'الأسماء'],
  ];

  for (const name of sampleNames) {
    data.push(['السنة الثالثة من المرحلة الابتدائية', name]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Styling & column widths
  ws['!cols'] = [
    { wch: 38 }, // Attribute column
    { wch: 35 }, // Value column
  ];

  // Set RTL
  ws['!views'] = [{ rightToLeft: true }];

  XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');
  XLSX.writeFile(wb, 'Student_Import_Template_Picture3.xlsx');
}

/**
 * Exports students to Excel formatted identically to Picture 4:
 * - Row 1 (Merged): Arabic Grade Title Banner (e.g. 'السنة الأولى من المرحلة الابتدائية')
 * - Row 2: Right-to-Left Headers: 'م', 'الأسماء', and blank assessment columns
 * - Row 3+: Numbered rows with sorted Arabic student names
 * - RTL enabled sheet
 */
export function exportGradeToExcel(
  gradeTitleAr: string,
  students: StudentItem[],
  filename?: string
): void {
  const wb = XLSX.utils.book_new();

  // Sort students alphabetically by Arabic name
  const sorted = sortStudentsByName(students);

  // Number of blank columns as shown in Picture 4 (about 8-10 columns)
  const blankColsCount = 10;
  const totalCols = 2 + blankColsCount; // col 0: 'م', col 1: 'الأسماء', cols 2..11: blank

  // Prepare sheet rows
  const sheetData: any[][] = [];

  // Row 1: Merged Title banner
  const titleRow = new Array(totalCols).fill('');
  titleRow[0] = gradeTitleAr || 'السنة الأولى من المرحلة الابتدائية';
  sheetData.push(titleRow);

  // Row 2: Headers (Right to Left)
  // Col 0: م (Number/Serial), Col 1: الأسماء (Names), Col 2..N: Blank
  const headerRow = new Array(totalCols).fill('');
  headerRow[0] = 'م';
  headerRow[1] = 'الأســـــماء';
  sheetData.push(headerRow);

  // Rows 3+: Student rows
  sorted.forEach((std, idx) => {
    const row = new Array(totalCols).fill('');
    row[0] = idx + 1; // Serial Number
    row[1] = std.NameArabic || std.Name; // Arabic Name
    sheetData.push(row);
  });

  // If there are less than 15 rows, add blank rows to match printable template
  const minRows = 15;
  if (sorted.length < minRows) {
    for (let i = sorted.length + 1; i <= minRows; i++) {
      const row = new Array(totalCols).fill('');
      row[0] = i;
      sheetData.push(row);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Merge Row 1 across all columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
  ];

  // Column widths
  const cols = [
    { wch: 6 },  // 'م'
    { wch: 34 }, // 'الأسماء'
  ];
  for (let i = 0; i < blankColsCount; i++) {
    cols.push({ wch: 8 });
  }
  ws['!cols'] = cols;

  // Enable Right-to-Left in Excel
  ws['!views'] = [{ rightToLeft: true }];

  // Clean sheet name (max 31 chars in Excel)
  const cleanSheetName = (gradeTitleAr || 'Class').replace(/[:\\/?*\[\]]/g, ' ').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

  const cleanFileName = filename || `${gradeTitleAr || 'Students'}_Format_Picture4.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}

/**
 * Exports all classes to a multi-sheet Excel workbook where each class has its own Picture 4 format sheet
 */
export function exportAllGradesToExcel(
  classes: ClassItem[],
  students: StudentItem[]
): void {
  const wb = XLSX.utils.book_new();
  const blankColsCount = 10;
  const totalCols = 2 + blankColsCount;

  // Group classes by grade
  for (const cls of classes) {
    const classStudents = students.filter(s => s.ClassID === cls.ClassID);
    const sorted = sortStudentsByName(classStudents);
    const gradeTitleAr = getArabicClassName(cls);

    const sheetData: any[][] = [];

    // Title Row
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = gradeTitleAr;
    sheetData.push(titleRow);

    // Header Row
    const headerRow = new Array(totalCols).fill('');
    headerRow[0] = 'م';
    headerRow[1] = 'الأســـــماء';
    sheetData.push(headerRow);

    // Data rows
    sorted.forEach((std, idx) => {
      const row = new Array(totalCols).fill('');
      row[0] = idx + 1;
      row[1] = std.NameArabic || std.Name;
      sheetData.push(row);
    });

    // Fill to at least 15 rows
    const minRows = 15;
    if (sorted.length < minRows) {
      for (let i = sorted.length + 1; i <= minRows; i++) {
        const row = new Array(totalCols).fill('');
        row[0] = i;
        sheetData.push(row);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
    ];

    const cols = [{ wch: 6 }, { wch: 34 }];
    for (let i = 0; i < blankColsCount; i++) {
      cols.push({ wch: 8 });
    }
    ws['!cols'] = cols;
    ws['!views'] = [{ rightToLeft: true }];

    const safeSheetName = `${getGradeCode(cls)} - ${cls.ClassID}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  }

  XLSX.writeFile(wb, `All_Students_Directory_Picture4.xlsx`);
}
