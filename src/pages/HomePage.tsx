
import React from 'react';
import DragDropBoard from '../components/DragDropBoard';

/**
 * 홈 페이지: 사역 기록의 메인 화면
 * 기존 폼 방식에서 드래그 앤 드롭 보드 방식으로 전환
 * 
 * 왜 변경했는가?
 * → 폼 입력은 단조롭고 반복 작업이 많음
 * → 드래그 앤 드롭은 직관적이고 시각적으로 시간대별 기록 현황을 파악 가능
 */
const HomePage: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto">
            <DragDropBoard />
        </div>
    );
};

export default HomePage;
