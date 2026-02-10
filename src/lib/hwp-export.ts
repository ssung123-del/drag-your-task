
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MinistryEntry, WeeklyPlan, WeeklyNote, UserProfile } from '../types';
import { TIME_SLOTS } from '../types';

/**
 * 초안정형 한글(HWP) 복사 기능
 * 한글 프로그램의 충돌을 방지하기 위해 9열(1+7+1) 구조를 완벽하게 유지합니다.
 * rowspan을 제거하여 붙여넣기 안정성을 극대화했습니다.
 */
export const copyToHWPClipboard = async (
    weekStartDate: Date,
    entries: MinistryEntry[],
    weeklyPlans: WeeklyPlan | undefined,
    weeklyNotes: WeeklyNote | undefined,
    profile: UserProfile
) => {
    const fontStyle = "font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 8pt; line-height: 1.2;";
    const borderStyle = "border: 0.5pt solid black;";
    const headerBg = "background-color: #BDD7EE;";
    const mealBg = "background-color: #F2F2F2;";

    let html = `<table style="border-collapse: collapse; width: 100%; ${fontStyle}">`;

    // 1. 헤더 (항상 9개 컬럼: 구분1 + 요일7 + 계획1)
    html += `<tr style="${headerBg} font-weight: bold; text-align: center; height: 30px;">`;
    html += `<td style="${borderStyle} width: 50px;">구분</td>`;
    for (let i = 0; i < 7; i++) {
        html += `<td style="${borderStyle}">${format(addDays(weekStartDate, i), 'M.d(eee)', { locale: ko })}</td>`;
    }
    html += `<td style="${borderStyle}">주간계획</td>`;
    html += `</tr>`;

    // 2. 데이터 매핑
    const timeRowData: { [key: string]: string[] } = {};
    TIME_SLOTS.forEach(t => { timeRowData[t] = Array(7).fill(""); });

    entries.forEach(e => {
        const entryDate = new Date(e.date);
        const dayDiff = Math.floor((entryDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff <= 6 && timeRowData[e.time]) {
            const prefix = e.category === '심방' ? '■ ' : '● ';
            timeRowData[e.time][dayDiff] += (timeRowData[e.time][dayDiff] ? "<br/>" : "") + prefix + e.content;
        }
    });

    // 3. 행 생성 (모든 행은 반드시 9개의 논리적 셀을 가져야 함)
    TIME_SLOTS.forEach((time, idx) => {
        html += `<tr style="height: 40px;">`;

        // [1] 시간 셀
        html += `<td style="${borderStyle} ${mealBg} text-align: center;">${time}</td>`;

        // [2] 사역 내용 셀 (7개)
        if (time === '11:40' || time === '17:00') {
            const label = time === '11:40' ? '점 심 식 사' : '저 녁 식 사';
            html += `<td colspan="7" style="${borderStyle} ${mealBg} text-align: center; font-weight: bold;">${label}</td>`;
        } else {
            for (let d = 0; d < 7; d++) {
                html += `<td style="${borderStyle} padding: 4px; vertical-align: top; text-align: left;">${timeRowData[time][d]}</td>`;
            }
        }

        // [3] 계획 셀 (1개) - 행 불일치 방지를 위해 무조건 추가
        // HWP 안정성을 위해 rowspan 대신 텍스트로만 구분
        let planText = "";
        const plans = weeklyPlans?.plans || {};
        if (idx === 0) planText = `[주일] ${plans[0] || ''}`;
        else if (idx === 2) planText = `[월] ${plans[1] || ''}`;
        else if (idx === 4) planText = `[화] ${plans[2] || ''}`;
        else if (idx === 6) planText = `[수] ${plans[3] || ''}`;
        else if (idx === 9) planText = `[목] ${plans[4] || ''}`;
        else if (idx === 11) planText = `[금] ${plans[5] || ''}`;
        else if (idx === 14) planText = `[토] ${plans[6] || ''}`;
        else if (idx === 16) planText = `[비고] ${plans[7] || ''}`;

        html += `<td style="${borderStyle} padding: 4px; vertical-align: top; font-size: 7pt;">${planText}</td>`;

        html += `</tr>`;
    });

    html += `</table>`;

    const type = "text/html";
    const blob = new Blob([html], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    try {
        await navigator.clipboard.write(data);
        return true;
    } catch (err) {
        console.error("HWP Copy Failed:", err);
        return false;
    }
};
