
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { MinistryEntry, WeeklyPlan, WeeklyNote, UserProfile } from '../types';
import { TIME_SLOTS } from '../types';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export const generateExcel = async (
    weekStartDate: Date, // Sunday
    entries: MinistryEntry[],
    weeklyPlans: WeeklyPlan | undefined,
    weeklyNotes: WeeklyNote | undefined,
    profile: UserProfile,
    returnFile: boolean = false
): Promise<File | void> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('주간사역일지');

    // --- Styles ---
    const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
    const fontBase = { name: 'Malgun Gothic', size: 10 };
    const alignCenter: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const alignLeft: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };

    // --- Layout Setup ---
    // Columns: A(Time), B(Sun), C(Mon), D(Tue), E(Wed), F(Thu), G(Fri), H(Sat), I(Next Plan)
    worksheet.columns = [
        { key: 'time', width: 8 },
        { key: 'sun', width: 14 },
        { key: 'mon', width: 14 },
        { key: 'tue', width: 14 },
        { key: 'wed', width: 14 },
        { key: 'thu', width: 14 },
        { key: 'fri', width: 14 },
        { key: 'sat', width: 14 },
        { key: 'plan', width: 14 },
    ];

    // Title Row (1)
    const titleRow = worksheet.getRow(1);
    titleRow.height = 30;
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '교역자 주간 사역일지';
    titleCell.font = { ...fontBase, size: 20, bold: true };
    titleCell.alignment = alignCenter;

    const churchCell = worksheet.getCell('I1');
    churchCell.value = '오륜교회';
    churchCell.font = { ...fontBase, size: 12, bold: true, color: { argb: 'FF1B4F72' } };
    churchCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Legend Row (2)
    const legendRow = worksheet.getRow(2);
    legendRow.height = 20;
    worksheet.mergeCells('A2:I2');
    const legendCell = worksheet.getCell('A2');
    legendCell.value = ' ■ : 심방   ● : 업무';
    legendCell.font = { ...fontBase, size: 10 };
    legendCell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Info Row (3)
    const infoRow = worksheet.getRow(3);
    infoRow.height = 25;

    const month = format(weekStartDate, 'M', { locale: ko });
    const weekNum = Math.ceil(weekStartDate.getDate() / 7);
    const dateRange = `${format(weekStartDate, 'yyyy년 M월 d일(eee)', { locale: ko })} ~ ${format(addDays(weekStartDate, 6), 'd일(eee)', { locale: ko })}`;

    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `${month}월 ${weekNum}주   ${dateRange}`;
    worksheet.getCell('A3').font = { ...fontBase, bold: true };
    worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' };

    worksheet.mergeCells('G3:H3');
    worksheet.getCell('G3').value = `부서: ${profile.department}`;
    worksheet.getCell('G3').font = fontBase;
    worksheet.getCell('G3').alignment = alignCenter;
    worksheet.getCell('G3').border = borderStyle;

    worksheet.getCell('I3').value = `사역자: ${profile.name}`;
    worksheet.getCell('I3').font = fontBase;
    worksheet.getCell('I3').alignment = alignCenter;
    worksheet.getCell('I3').border = borderStyle;

    // Header Row (4)
    const headerRow = worksheet.getRow(4);
    headerRow.height = 25;
    const days = ['구분', ...Array.from({ length: 7 }, (_, i) => format(addDays(weekStartDate, i), 'M.d(eee)', { locale: ko })), '다음주간계획'];

    days.forEach((day, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = day;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }; // Light blue
        cell.font = { ...fontBase, bold: true };
        cell.alignment = alignCenter;
        cell.border = borderStyle;
    });

    // --- Time Slots (Rows 5-23) ---
    const timeRowMap: { [key: string]: number } = {};

    TIME_SLOTS.forEach((time, idx) => {
        const rowIdx = 5 + idx;
        timeRowMap[time] = rowIdx;
        const row = worksheet.getRow(rowIdx);
        row.height = 30; // Consistent height

        // Time Column (A)
        const timeCell = row.getCell(1);
        timeCell.value = time;
        timeCell.alignment = alignCenter;
        timeCell.font = { ...fontBase, size: 9 };
        timeCell.border = borderStyle;
        timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; // Light gray for time

        // Data Columns (B-H) - Empty with border initially
        for (let c = 2; c <= 8; c++) {
            row.getCell(c).border = borderStyle;
        }
        // Plan Column (I) - Empty with border initially
        row.getCell(9).border = borderStyle;
    });

    // Handle Lunch (11:40) and Dinner (18:00) Merges
    const lunchRowIdx = timeRowMap['11:40'];
    if (lunchRowIdx) {
        worksheet.mergeCells(`B${lunchRowIdx}:H${lunchRowIdx}`);
        const lunchCell = worksheet.getCell(`B${lunchRowIdx}`);
        lunchCell.value = '점 심 식 사';
        lunchCell.alignment = alignCenter;
        lunchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    }

    const dinnerRowIdx = timeRowMap['18:00'];
    if (dinnerRowIdx) {
        worksheet.mergeCells(`B${dinnerRowIdx}:H${dinnerRowIdx}`);
        const dinnerCell = worksheet.getCell(`B${dinnerRowIdx}`);
        dinnerCell.value = '저 녁 식 사';
        dinnerCell.alignment = alignCenter;
        dinnerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    }

    // --- Fill Data ---
    entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayDiff = Math.floor((entryDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff >= 0 && dayDiff <= 6) {
            const colIdx = 2 + dayDiff; // B is 2
            const rowIdx = timeRowMap[entry.time];

            if (rowIdx) {
                const cell = worksheet.getCell(rowIdx, colIdx);
                // Prefix logic
                const prefix = entry.category === '심방' ? '■ ' : entry.category === '업무' ? '● ' : '';
                const text = `${prefix}${entry.content}`;

                // Append if cell already has value
                cell.value = cell.value ? `${cell.value}\n\n${text}` : text;
                cell.alignment = { ...alignLeft, wrapText: true };
            }
        }
    });

    // --- Next Week Plans (Column I) ---
    const planMergeMap = [
        { label: '주일', rows: [5, 6] },
        { label: '월', rows: [7, 8] },
        { label: '화', rows: [9, 10] },
        { label: '수', rows: [11, 12] },
        { label: '목', rows: [13, 14] },
        { label: '금', rows: [15, 16] },
        { label: '토', rows: [17, 18] },
        { label: '비고', rows: [19, 23] },
    ];

    planMergeMap.forEach((plan, idx) => {
        const startRow = plan.rows[0];
        const endRow = plan.rows[1];
        worksheet.mergeCells(startRow, 9, endRow, 9);

        const cell = worksheet.getCell(startRow, 9);
        const content = weeklyPlans?.plans[idx] || ''; // 0=Sun, 1=Mon...

        // Rich text to bold the label
        cell.value = {
            richText: [
                { text: `${plan.label}\n`, font: { ...fontBase, bold: true } },
                { text: content, font: fontBase }
            ]
        };
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    });


    // --- Statistics Rows (24-26) ---
    const statsStartRow = 24;
    const statTypes = ['방문', '카페', '전화']; // Removed "심방" suffix for row key

    // Sidebar "심방 기록" Merged Cell (A24:A26)
    worksheet.mergeCells(`A${statsStartRow}:A${statsStartRow + 2}`);
    const statsLabel = worksheet.getCell(`A${statsStartRow}`);
    statsLabel.value = '심방\n기록';
    statsLabel.alignment = alignCenter;
    statsLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } }; // Light pink
    statsLabel.border = borderStyle;

    // Calculate Stats
    const statsCount: Record<string, Record<string, number>> = {}; // { 'YYYY-MM-DD': { '방문': 2, ... } }
    const totalStats: Record<string, number> = { '방문': 0, '카페': 0, '전화': 0 };

    entries.forEach(e => {
        if (e.category === '심방') {
            const typeKey = e.subType.replace('심방', ''); // remove suffix for matching
            if (['방문', '카페', '전화'].includes(typeKey)) {
                if (!statsCount[e.date]) statsCount[e.date] = { '방문': 0, '카페': 0, '전화': 0 };
                statsCount[e.date][typeKey] = (statsCount[e.date][typeKey] || 0) + 1;
                totalStats[typeKey]++;
            }
        }
    });

    statTypes.forEach((type, idx) => {
        const r = statsStartRow + idx;
        const row = worksheet.getRow(r);
        row.height = 20;

        // Per Day Stats (B-H)
        for (let d = 0; d < 7; d++) {
            const dateStr = format(addDays(weekStartDate, d), 'yyyy-MM-dd');
            const count = statsCount[dateStr]?.[type] || 0;
            const cell = row.getCell(2 + d);
            cell.value = `${type}: ${count}회`;
            cell.font = { ...fontBase, size: 9 };
            cell.alignment = alignCenter;
            cell.border = borderStyle;
        }

        // Total Stats (I)
        const totalCell = row.getCell(9);
        if (idx === 0) totalCell.value = '합계';
        if (idx === 0) totalCell.font = { ...fontBase, bold: true, color: { argb: 'FFFF0000' } };

        totalCell.value = `${type}심방: 총 ${totalStats[type]}회`;
        totalCell.font = { ...fontBase, bold: true };
        totalCell.alignment = alignCenter;
        totalCell.border = borderStyle;
        totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }; // Yellow
    });

    // --- Footer: Notes & Dawn Prayer (27-28) ---
    const footerRowStart = 27;

    // "특이 사항" Label (A27:A28)
    worksheet.mergeCells(`A${footerRowStart}:A${footerRowStart + 1}`);
    const noteLabel = worksheet.getCell(`A${footerRowStart}`);
    noteLabel.value = '특이\n사항';
    noteLabel.alignment = alignCenter;
    noteLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
    noteLabel.border = borderStyle;

    // Special Note Content (B27:H28)
    worksheet.mergeCells(`B${footerRowStart}:H${footerRowStart + 1}`);
    const noteContent = worksheet.getCell(`B${footerRowStart}`);
    noteContent.value = weeklyNotes?.specialNote || '';
    noteContent.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    noteContent.border = borderStyle;

    // Dawn Prayer (I27:I28)
    worksheet.mergeCells(`I${footerRowStart}:I${footerRowStart + 1}`);
    const prayerCell = worksheet.getCell(`I${footerRowStart}`);
    const daysAttended = weeklyNotes?.dawnPrayerDays || [];
    prayerCell.value = {
        richText: [
            { text: '새벽예배\n', font: { ...fontBase, bold: true } },
            { text: `${daysAttended.join(',')}\n`, font: fontBase },
            { text: `(${daysAttended.length}회 참석)`, font: fontBase }
        ]
    };
    prayerCell.alignment = alignCenter;
    prayerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    prayerCell.border = borderStyle;

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `주간사역일지_${format(weekStartDate, 'yyyy-MM-dd')}_${profile.name}.xlsx`;
    const file = new File([buffer], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if (returnFile) {
        return file;
    }

    saveAs(file, fileName);
};
