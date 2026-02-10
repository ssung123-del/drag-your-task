
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MinistryEntry, WeeklyPlan, WeeklyNote, UserProfile } from '../types';
import { TIME_SLOTS } from '../types';

/**
 * 한글(HWP) 표 채우기 전용 복사 기능
 * 헤더를 제외하고 04:00 데이터부터 시작하는 순수 그리드 데이터만 8pt 서식으로 복사합니다.
 */
export const copyToHWPClipboard = async (
    weekStartDate: Date,
    entries: MinistryEntry[],
    weeklyPlans: WeeklyPlan | undefined,
    weeklyNotes: WeeklyNote | undefined,
    profile: UserProfile
) => {
    // 폰트 및 스타일 정의 (한글 호환성 극대화)
    const fontStyle = "font-family: 'Malgun Gothic', '맑은 고딕'; font-size: 8pt;";
    const tdStyle = `border: 0.5pt solid black; padding: 2px; vertical-align: top; ${fontStyle}`;

    // 타임라인 데이터 매핑
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

    const plans = weeklyPlans?.plans || {};

    // HTML 생성 (헤더 없이 데이터 행부터 시작)
    let html = `<table style="border-collapse: collapse; width: 100%;">`;

    TIME_SLOTS.forEach((time, idx) => {
        html += `<tr style="height: 35px;">`;

        // [1] 시간 열
        html += `<td style="${tdStyle} text-align: center; width: 60px; background-color: #F2F2F2;">${time}</td>`;

        // [2] 데이터 열 (7개)
        if (time === '11:40' || time === '17:00') {
            const label = time === '11:40' ? '점 심 식 사' : '저 녁 식 사';
            // 병합된 칸 뒤에도 칸 개수를 맞추기 위해 colspan 사용
            html += `<td colspan="7" style="${tdStyle} text-align: center; background-color: #F2F2F2; font-weight: bold;">${label}</td>`;
        } else {
            for (let d = 0; d < 7; d++) {
                html += `<td style="${tdStyle} text-align: left;">${timeRowData[time][d]}</td>`;
            }
        }

        // [3] 계획 열 (항상 존재해야 구조가 안 깨짐)
        let planText = "";
        if (idx === 0) planText = `[주일] ${plans[0] || ''}`;
        else if (idx === 2) planText = `[월] ${plans[1] || ''}`;
        else if (idx === 4) planText = `[화] ${plans[2] || ''}`;
        else if (idx === 6) planText = `[수] ${plans[3] || ''}`;
        else if (idx === 9) planText = `[목] ${plans[4] || ''}`;
        else if (idx === 11) planText = `[금] ${plans[5] || ''}`;
        else if (idx === 14) planText = `[토] ${plans[6] || ''}`;
        else if (idx === 16) planText = `[비고] ${plans[7] || ''}`;

        html += `<td style="${tdStyle} text-align: left; font-size: 7pt;">${planText}</td>`;

        html += `</tr>`;
    });

    html += `</table>`;

    // 클립보드 복사 (HTML 형식)
    const type = "text/html";
    const blob = new Blob([html], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    try {
        await navigator.clipboard.write(data);
        return true;
    } catch (err) {
        console.error("HWP Copy failed:", err);
        return false;
    }
};
