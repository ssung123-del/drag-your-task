
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MinistryEntry, WeeklyPlan, WeeklyNote, UserProfile } from '../types';
import { TIME_SLOTS } from '../types';

/**
 * 전용 한글(HWP) 복사 기능
 * 8pt 서식이 박힌 HTML Table을 클립보드에 HTML 형식으로 복사합니다.
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

    // 1행: 제목
    html += `
        <tr>
            <td colspan="8" style="${borderStyle} padding: 10px; text-align: center; font-size: 16pt; font-weight: bold;">교역자 주간 사역일지</td>
            <td style="${borderStyle} padding: 5px; text-align: right; font-weight: bold; color: #1B4F72;">오륜교회</td>
        </tr>
    `;

    // 2행: 범례
    html += `
        <tr>
            <td colspan="9" style="${borderStyle} padding: 5px; text-align: left;"> ■ : 심방   ● : 업무</td>
        </tr>
    `;

    // 3행: 정보
    const month = format(weekStartDate, 'M', { locale: ko });
    const weekNum = Math.ceil(weekStartDate.getDate() / 7);
    const dateRange = `${format(weekStartDate, 'yyyy년 M월 d일(eee)', { locale: ko })} ~ ${format(addDays(weekStartDate, 6), 'd일(eee)', { locale: ko })}`;

    html += `
        <tr>
            <td colspan="6" style="${borderStyle} padding: 5px; font-weight: bold;">${month}월 ${weekNum}주   ${dateRange}</td>
            <td colspan="2" style="${borderStyle} padding: 5px; text-align: center;">부서: ${profile.department}</td>
            <td style="${borderStyle} padding: 5px; text-align: center text-align: center;">사역자: ${profile.name}</td>
        </tr>
    `;

    // 4행: 헤더 (구분, 날짜들, 계획)
    html += `<tr style="${headerBg} font-weight: bold; text-align: center;">`;
    html += `<td style="${borderStyle} width: 60px;">구분</td>`;
    for (let i = 0; i < 7; i++) {
        html += `<td style="${borderStyle}">${format(addDays(weekStartDate, i), 'M.d(eee)', { locale: ko })}</td>`;
    }
    html += `<td style="${borderStyle}">다음주간계획</td>`;
    html += `</tr>`;

    // 5행 ~ 24행: 타임라인 데이터
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

    // 계획 데이터 매핑
    const planLabels = ["주일", "월", "화", "수", "목", "금", "토", "비고"];

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
        else if (idx === 14) html += `<td rowspan="6" style="${borderStyle} padding: 4px; vertical-align: top;"><b>비고</b><br/>${weeklyPlans?.plans[7] || ''}</td>`;

        html += `</tr>`;
    });

    // 25행 ~ 27행: 통계
    const statsStartRowHtml = `
        <tr>
            <td rowspan="3" style="${borderStyle} background-color: #FFFFE0; text-align: center;">심방<br/>기록</td>
    `;
    html += statsStartRowHtml;

    const statTypes = ['방문', '카페', '전화'];
    const statsCount: Record<string, Record<string, number>> = {};
    const totalStats: Record<string, number> = { '방문': 0, '카페': 0, '전화': 0 };

    entries.forEach(e => {
        if (e.category === '심방') {
            const typeKey = e.subType.replace('심방', '');
            if (['방문', '카페', '전화'].includes(typeKey)) {
                if (!statsCount[e.date]) statsCount[e.date] = { '방문': 0, '카페': 0, '전화': 0 };
                statsCount[e.date][typeKey] = (statsCount[e.date][typeKey] || 0) + 1;
                totalStats[typeKey]++;
            }
        }
    });

    statTypes.forEach((type, idx) => {
        if (idx > 0) html += `<tr>`;
        for (let d = 0; d < 7; d++) {
            const dateStr = format(addDays(weekStartDate, d), 'yyyy-MM-dd');
            const count = statsCount[dateStr]?.[type] || 0;
            html += `<td style="${borderStyle} text-align: center;">${type}: ${count}회</td>`;
        }
        html += `<td style="${borderStyle} background-color: #FFFFF9; text-align: center; font-weight: bold;">${type}심방: 총 ${totalStats[type]}회</td>`;
        html += `</tr>`;
    });

    // 28행: 특이사 항 및 새벽기도
    const daysAttended = weeklyNotes?.dawnPrayerDays || [];
    html += `
        <tr>
            <td style="${borderStyle} background-color: #FFFFE0; text-align: center;">특이<br/>사항</td>
            <td colspan="7" style="${borderStyle} padding: 5px; vertical-align: top;">${weeklyNotes?.specialNote || ''}</td>
            <td style="${borderStyle} background-color: #EEEEEE; text-align: center;">
                <b>새벽예배</b><br/>
                ${daysAttended.join(',')}<br/>
                (${daysAttended.length}회 참석)
            </td>
        </tr>
    `;

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
