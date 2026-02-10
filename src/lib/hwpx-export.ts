import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { format, addDays, getWeekOfMonth } from 'date-fns';
import { type MinistryEntry, type WeeklyPlan, type WeeklyNote, type UserProfile, DAYS_OF_WEEK_KR } from '../types';

export const generateHwpx = async (
    weekStart: Date,
    entries: MinistryEntry[],
    plan: WeeklyPlan | undefined,
    note: WeeklyNote | undefined,
    profile: UserProfile
) => {
    try {
        // 1. 템플릿 파일 로드
        const response = await fetch('/template.hwpx');
        if (!response.ok) throw new Error('템플릿 파일을 찾을 수 없습니다.');
        const templateData = await response.arrayBuffer();

        // 2. ZIP 압축 해제
        const zip = new JSZip();
        await zip.loadAsync(templateData);

        // 3. section0.xml 수정
        const sectionPath = 'Contents/section0.xml';
        const sectionXmlText = await zip.file(sectionPath)?.async('string');
        if (!sectionXmlText) throw new Error('section0.xml 파일을 찾을 수 없습니다.');

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(sectionXmlText, 'text/xml');

        // Helper: 특정 좌표의 셀을 찾고 텍스트 수정
        const setCellText = (row: number, col: number, text: string) => {
            // 네임스페이스가 포함된 태그 검색 (hp:tc 내의 hp:cellAddr를 찾아 부모 tc 반환)
            const cellAddrs = xmlDoc.getElementsByTagName('hp:cellAddr');
            let targetTc: Element | null = null;

            for (let i = 0; i < cellAddrs.length; i++) {
                const addr = cellAddrs[i];
                if (addr.getAttribute('rowAddr') === String(row) &&
                    addr.getAttribute('colAddr') === String(col)) {
                    targetTc = addr.parentElement;
                    break;
                }
            }

            if (targetTc) {
                const tTags = targetTc.getElementsByTagName('hp:t');
                if (tTags.length > 0) {
                    tTags[0].textContent = text;
                    for (let i = 1; i < tTags.length; i++) {
                        tTags[i].textContent = '';
                    }
                } else {
                    const pTags = targetTc.getElementsByTagName('hp:p');
                    if (pTags.length > 0) {
                        const run = xmlDoc.createElementNS('http://www.hancom.co.kr/hwpml/2011/paragraph', 'hp:run');
                        const t = xmlDoc.createElementNS('http://www.hancom.co.kr/hwpml/2011/paragraph', 'hp:t');
                        t.textContent = text;
                        run.appendChild(t);
                        pTags[0].appendChild(run);
                    }
                }
            }
        };

        // --- 데이터 채우기 시작 ---

        // 1. 상단 정보
        const month = format(weekStart, 'M');
        const weekOfMonth = getWeekOfMonth(weekStart);
        setCellText(0, 0, `${month}월 ${weekOfMonth}주`);

        const weekEnd = addDays(weekStart, 6);
        const dateRangeStr = `${format(weekStart, 'yyyy. M. d.')} ~ ${format(weekEnd, 'M. d.')}`;
        setCellText(0, 2, dateRangeStr);

        // Col 7은 "부서" 라벨, Col 8이 부서 데이터 입력 칸
        // Col 9는 "사역자" 라벨, Col 12가 이름 데이터 입력 칸 (C10-C11은 cellAddr 없음)
        setCellText(0, 8, profile.department);
        setCellText(0, 12, profile.name);

        // 2. 날짜 라벨 (주일, 화~토) - Row 2
        const dateOffsets = [0, 2, 3, 4, 5, 6];
        const dateCols = [1, 3, 4, 5, 6, 7];
        dateCols.forEach((col, idx) => {
            const d = addDays(weekStart, dateOffsets[idx]);
            const label = format(d, 'M.d') + `(${DAYS_OF_WEEK_KR[idx]})`;
            setCellText(2, col, label);
        });

        // 3. 타임라인 사역 기록
        // 왜 이 매핑인가? → HWPX 템플릿의 실제 cellAddr rowAddr 값을 분석한 결과
        // Column 0의 시간 라벨이 Row 3~14에 연속 배치됨
        const timeRowMap: { [key: string]: number } = {
            "09:00": 3, "10:00": 4, "11:00": 5, "11:40": 6,
            "12:40": 7, "14:00": 8, "15:00": 9, "16:00": 10,
            "17:00": 11, "18:00": 12, "19:00": 13, "20:00": 14
        };

        dateOffsets.forEach((dayOffset, dayIdx) => {
            const targetDate = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');
            const dayEntries = entries.filter(e => e.date === targetDate).sort((a, b) => a.time.localeCompare(b.time));
            const col = dateCols[dayIdx];

            Object.entries(timeRowMap).forEach(([time, row]) => {
                const entry = dayEntries.find(e => e.time === time);
                if (entry) {
                    const prefix = entry.category === '심방' ? '￭' : '•';
                    setCellText(row, col, `${prefix}${entry.content}`);
                } else {
                    if (time !== "11:40" && time !== "17:00") {
                        setCellText(row, col, "");
                    }
                }
            });
        });

        // 4. 심방 통계 (Row 16=방문, Row 17=카페, Row 18=전화)
        // 왜 이 Row인가? → 템플릿 XML 분석 결과 심방기록 영역이 Row 16~18에 위치
        dateOffsets.forEach((dayOffset, dayIdx) => {
            const targetDate = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');
            const dayEntries = entries.filter(e => e.date === targetDate);
            const col = dateCols[dayIdx];

            const vCount = dayEntries.filter(e => e.subType === '방문심방').length;
            const cCount = dayEntries.filter(e => e.subType === '카페심방').length;
            const pCount = dayEntries.filter(e => e.subType === '전화심방').length;

            setCellText(16, col, `방문심방 : ${vCount || 0} 회`);
            setCellText(17, col, `카페심방 : ${cCount || 0} 회`);
            setCellText(18, col, `전화심방 : ${pCount || 0} 회`);
        });

        // 합계 (Col 10, Row 16~18)
        const totalVisit = entries.filter(e => e.subType === '방문심방').length;
        const totalCafe = entries.filter(e => e.subType === '카페심방').length;
        const totalPhone = entries.filter(e => e.subType === '전화심방').length;
        setCellText(16, 10, `방문심방 : 총 ${totalVisit} 회`);
        setCellText(17, 10, `카페심방 : 총 ${totalCafe} 회`);
        setCellText(18, 10, `전화심방 : 총 ${totalPhone} 회`);

        // 5. 다음 주간 계획 (우측 Col 12)
        // 템플릿에서 다음주간계획 영역은 Col 11에 라벨이 있고, Col 12에 입력 칸이 위치
        if (plan) {
            const planRows = [3, 4, 5, 6, 7, 8, 9]; // 주일, 화, 수, 목, 금, 토, 비고 순서
            planRows.forEach((row, i) => {
                const content = plan.plans[i] || ''; // idx 0~6 매핑
                setCellText(row, 11, content);
            });
        }

        // 6. 특이사항 (하단)
        if (note) {
            setCellText(19, 1, note.specialNote);
        }

        // 7. 새벽예배 참석 (월~금)
        // 템플릿 하단 우측에 "새벽예배" 영역: 월.화.수.목.금 참석 표시
        if (note && note.dawnPrayerDays && note.dawnPrayerDays.length > 0) {
            const dawnDayLabels = ['월', '화', '수', '목', '금'];
            const attendedDays = dawnDayLabels
                .filter(day => note.dawnPrayerDays.includes(day))
                .join('. ');
            const dawnText = `${attendedDays}\n(${note.dawnPrayerDays.length}회 참석)`;
            setCellText(20, 9, dawnText);
        }

        // --- 데이터 채우기 종료 ---

        // 4. 수정된 XML 저장
        const serializer = new XMLSerializer();
        const newXmlText = serializer.serializeToString(xmlDoc);
        zip.file(sectionPath, newXmlText);

        // 5. 파일 생성 및 다운로드
        const content = await zip.generateAsync({ type: 'blob' });
        const fileName = `${month}월_${weekOfMonth}주_주간사역일지_${profile.name}.hwpx`;
        saveAs(content, fileName);

    } catch (error) {
        console.error('HWPX export failed:', error);
        throw error;
    }
};
