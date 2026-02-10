
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MinistryEntry, WeeklyPlan, WeeklyNote, UserProfile } from '../types';
import { TIME_SLOTS } from '../types';

/**
 * 그리드 전용 한글(HWP) 복사 기능
 * 제목, 통계 등을 제외하고 오직 타임라인 그리드 영역만 8pt 서식으로 복사합니다.
 */
export const copyToHWPClipboard = async (
    weekStartDate: Date,
    entries: MinistryEntry[],
    weeklyPlans: WeeklyPlan | undefined,
    weeklyNotes: WeeklyNote | undefined,
    profile: UserProfile
) => {
    // 폰트 스타일 정의
    const fontStyle = "font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 8pt; line-height: 1.2;";
    const borderStyle = "border: 0.5pt solid black;";
    const headerBg = "background-color: #BDD7EE;";
    const timeBg = "background-color: #F2F2F2;";

    // 테이블 시작
    let html = `<table style="border-collapse: collapse; width: 100%; ${fontStyle}">`;

    // 1. 헤더 행 (구분, 날짜들, 계획)
    html += `<tr style="${headerBg} font-weight: bold; text-align: center;">`;
    html += `<td style="${borderStyle} width: 60px;">구분</td>`;
    for (let i = 0; i < 7; i++) {
        html += `<td style="${borderStyle}">${format(addDays(weekStartDate, i), 'M.d(eee)', { locale: ko })}</td>`;
    }
    html += `<td style="${borderStyle}">다음주간계획</td>`;
    html += `</tr>`;

    // 2. 타임라인 데이터 매핑 준비
    const timeRowData: { [key: string]: string[] } = {};
    TIME_SLOTS.forEach(t => {
        timeRowData[t] = Array(7).fill("");
    });

    entries.forEach(e => {
        const entryDate = new Date(e.date);
        const dayDiff = Math.floor((entryDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff <= 6 && timeRowData[e.time]) {
            const prefix = e.category === '심방' ? '■ ' : e.category === '업무' ? '● ' : '';
            timeRowData[e.time][dayDiff] += (timeRowData[e.time][dayDiff] ? "<br/><br/>" : "") + prefix + e.content;
        }
    });

    // 3. 타임라인 행 생성
    TIME_SLOTS.forEach((time, idx) => {
        html += `<tr style="height: 35px;">`;
        // 시간 열
        html += `<td style="${borderStyle} ${timeBg} text-align: center; width: 60px;">${time}</td>`;

        // 데이터 열
        if (time === '11:40') {
            html += `<td colspan="7" style="${borderStyle} ${timeBg} text-align: center;">점 심 식 사</td>`;
        } else if (time === '17:00') {
            html += `<td colspan="7" style="${borderStyle} ${timeBg} text-align: center;">저 녁 식 사</td>`;
        } else {
            for (let d = 0; d < 7; d++) {
                html += `<td style="${borderStyle} padding: 4px; vertical-align: top; text-align: left;">${timeRowData[time][d]}</td>`;
            }
        }

        // 계획 열 (I열) - 병합 구조 구현
        if (idx === 0) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>주일</b><br/>${weeklyPlans?.plans[0] || ''}</td>`;
        else if (idx === 2) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>월</b><br/>${weeklyPlans?.plans[1] || ''}</td>`;
        else if (idx === 4) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>화</b><br/>${weeklyPlans?.plans[2] || ''}</td>`;
        else if (idx === 6) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>수</b><br/>${weeklyPlans?.plans[3] || ''}</td>`;
        else if (idx === 8) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>목</b><br/>${weeklyPlans?.plans[4] || ''}</td>`;
        else if (idx === 10) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>금</b><br/>${weeklyPlans?.plans[5] || ''}</td>`;
        else if (idx === 12) html += `<td rowspan="2" style="${borderStyle} padding: 4px; vertical-align: top;"><b>토</b><br/>${weeklyPlans?.plans[6] || ''}</td>`;
        else if (idx === 14) html += `<td rowspan="7" style="${borderStyle} padding: 4px; vertical-align: top;"><b>비고</b><br/>${weeklyPlans?.plans[7] || ''}</td>`;

        html += `</tr>`;
    });

    html += `</table>`;

    // 클립보드 복사 실행 (HTML 타입)
    const type = "text/html";
    const blob = new Blob([html], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    try {
        await navigator.clipboard.write(data);
        return true;
    } catch (err) {
        console.error("Clipboard copy failed:", err);
        return false;
    }
};
