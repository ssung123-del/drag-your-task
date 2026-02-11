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

        // Helper: 특정 좌표의 셀에서 문단(hp:p) 가져오기 (스타일 복제용)
        const getCellParagraph = (row: number, col: number): Element | null => {
            const cellAddrs = xmlDoc.getElementsByTagName('hp:cellAddr');
            for (let i = 0; i < cellAddrs.length; i++) {
                const addr = cellAddrs[i];
                if (addr.getAttribute('rowAddr') === String(row) &&
                    addr.getAttribute('colAddr') === String(col)) {
                    const targetTc = addr.parentElement;
                    if (targetTc) {
                        const pTags = targetTc.getElementsByTagName('hp:p');
                        if (pTags.length > 0) return pTags[0];
                    }
                }
            }
            return null;
        };

        // Helper: 텍스트 내용을 포함하는 문단(hp:p) 찾기 (범례 스타일 찾기용)
        const findParagraphByText = (searchText: string): Element | null => {
            const tTags = xmlDoc.getElementsByTagName('hp:t');
            for (let i = 0; i < tTags.length; i++) {
                if (tTags[i].textContent && tTags[i].textContent.includes(searchText)) {
                    const p = tTags[i].closest('hp\\:p') ||
                        // DOMParser sometimes handles namespaces uniquely, fallback to loop
                        (() => {
                            let el = tTags[i].parentNode;
                            while (el && el.nodeName !== 'hp:p') el = el.parentNode;
                            return el;
                        })();

                    if (p && p.nodeName === 'hp:p') return p as Element;
                }
            }
            return null;
        };

        // 타임라인 데이터 셀의 스타일 표준(Master Template)을 가져옵니다.
        // 1순위: 범례(Legend)에 있는 '심방' 텍스트 문단 ("네모 박스 폰트" 등 스타일 원본)
        // 2순위: 월요일 09:00 셀 기준 (Row 3, Col 1)
        let timelineStyleTemplate = findParagraphByText('심방');
        if (!timelineStyleTemplate) {
            timelineStyleTemplate = getCellParagraph(3, 1);
        }

        // Helper: 특정 좌표의 셀을 찾고 텍스트 수정 (멀티라인 & 스타일 템플릿 지원)
        const setCellText = (row: number, col: number, textOrLines: string | string[], styleTemplate?: Element) => {
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
                // 1. 셀 내의 hp:subList (문단 리스트) 찾기
                // hp:tc -> hp:subList -> hp:p 구조가 일반적
                // 그러나 때로는 DOM 구조상 바로 자식일 수도 있으므로, p를 먼저 찾고 부모를 식별
                const pTags = targetTc.getElementsByTagName('hp:p');
                // 기존 문단이 아예 없으면 무시, 단 styleTemplate이 있으면 생성 가능
                if (pTags.length === 0 && !styleTemplate) return;

                // subList 찾기 (p의 부모)
                let parent: Node | null = null;
                if (pTags.length > 0) parent = pTags[0].parentNode;

                // 만약 현재 셀에 p가 없는데 styleTemplate은 있다? 그래도 parent(hp:subList)는 찾아야 함.
                if (!parent) return;

                // 2. 템플릿 문단 결정
                // 외부에서 주입된 styleTemplate(표준 스타일)이 있으면 그걸 우선 사용
                // 없으면 현재 셀의 첫 번째 문단을 사용
                let templateP: Element;
                if (styleTemplate) {
                    templateP = styleTemplate.cloneNode(true) as Element;
                } else if (pTags.length > 0) {
                    templateP = pTags[0].cloneNode(true) as Element;
                } else {
                    return;
                }

                // 3. 기존 문단 모두 제거 (깨끗한 상태에서 다시 씀)
                while (parent.firstChild) {
                    parent.removeChild(parent.firstChild);
                }

                // 4. 입력 데이터 배열화
                const lines = Array.isArray(textOrLines) ? textOrLines : [textOrLines];

                // 빈 내용이라도 문단 하나는 있어야 함 (안 그러면 셀이 깨질 수 있음)
                if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
                    // 텍스트 비우기
                    const tTags = templateP.getElementsByTagName('hp:t');
                    for (let i = 0; i < tTags.length; i++) tTags[i].textContent = '';
                    parent.appendChild(templateP);
                    return;
                }

                // 5. 새 문단 생성 및 추가
                lines.forEach(lineText => {
                    const newP = templateP.cloneNode(true) as Element;

                    // [중요] 줄 간격 고정(Fixed) 문제 해결
                    // 템플릿의 줄간격이 '고정'으로 되어있으면, 여러 줄 입력 시 텍스트가 겹쳐 보임.
                    // 이를 '퍼센트(Percent)' 방식으로 강제 변경하여 줄바꿈이 자연스럽게 되도록 함.
                    let pPr = newP.getElementsByTagName('hp:pPr')[0];
                    if (!pPr) {
                        // pPr이 없으면 생성
                        pPr = xmlDoc.createElementNS('http://www.hancom.co.kr/hwpml/2011/paragraph', 'hp:pPr');
                        if (newP.firstChild) {
                            newP.insertBefore(pPr, newP.firstChild);
                        } else {
                            newP.appendChild(pPr);
                        }
                    }
                    // 줄간격 강제 설정 (160% Percent)
                    pPr.setAttribute('lineSpacing', '160');
                    pPr.setAttribute('lineSpacingType', 'Percent');

                    const tTags = newP.getElementsByTagName('hp:t');

                    if (tTags.length > 0) {
                        tTags[0].textContent = lineText;
                        // 나머지 hp:t는 비움 (혹시 여러 hp:t가 섞여있을 경우 대비)
                        for (let i = 1; i < tTags.length; i++) {
                            tTags[i].textContent = '';
                        }
                    } else {
                        // hp:t가 없는 경우 비상 생성 (hp:run -> hp:t)
                        // 런(hp:run)이 없을 수도 있음
                        let run = newP.getElementsByTagName('hp:run')[0];
                        if (!run) {
                            run = xmlDoc.createElementNS('http://www.hancom.co.kr/hwpml/2011/paragraph', 'hp:run');
                            newP.appendChild(run);
                        }
                        const t = xmlDoc.createElementNS('http://www.hancom.co.kr/hwpml/2011/paragraph', 'hp:t');
                        t.textContent = lineText;
                        run.appendChild(t);
                    }
                    parent.appendChild(newP);
                });
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
            // 해당 날짜의 모든 엔트리 가져오기 (시간순 정렬)
            const dayEntries = entries.filter(e => e.date === targetDate);
            const col = dateCols[dayIdx];

            Object.entries(timeRowMap).forEach(([time, row]) => {
                // filter로 해당 시간대의 모든 엔트리 찾기
                const slotEntries = dayEntries.filter(e => e.time === time);

                if (slotEntries.length > 0) {
                    const lines: string[] = [];
                    slotEntries.forEach(entry => {
                        const prefix = entry.category === '심방' ? '￭ ' : '• ';
                        // 엔트리 내용에 줄바꿈이 있는 경우 처리
                        const contentLines = entry.content.split('\n');
                        contentLines.forEach((line, idx) => {
                            // 첫 줄에만 불렛 포인트, 나머지는 들여쓰기(공백)
                            if (idx === 0) lines.push(`${prefix}${line}`);
                            else lines.push(`  ${line}`);
                        });
                    });
                    // [핵심] 여기서 timelineStyleTemplate을 전달하여 모든 셀의 스타일을 통일시킴
                    setCellText(row, col, lines, timelineStyleTemplate || undefined);
                } else {
                    if (time !== "11:40" && time !== "17:00") {
                        // 빈 셀이라도 스타일 통일을 위해 템플릿 적용해서 비움
                        setCellText(row, col, "", timelineStyleTemplate || undefined);
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
