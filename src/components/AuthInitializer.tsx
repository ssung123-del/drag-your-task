
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useMinistryStore } from '../store/useMinistryStore';
import { type MinistryEntry, type WeeklyPlan, type WeeklyNote, type UserProfile } from '../types';

/**
 * AuthInitializer: 로그인 상태 변화를 감지하고 데이터를 동기화함
 */
export const AuthInitializer = () => {
    const { setUser, clearData } = useMinistryStore();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                });
            } else {
                setUser(null);
                clearData();
            }
        });

        return () => unsubscribeAuth();
    }, [setUser, clearData]);

    const userUID = useMinistryStore(state => state.user?.uid);

    useEffect(() => {
        if (!userUID) return;

        // 1. 사역 기록 리스너 — docChanges() 기반 인크리멘탈 업데이트
        // 전체 배열을 매번 교체하면 72개 슬롯이 전부 리렌더되므로,
        // 변경된 문서만 추적하여 최소한의 상태 변경만 수행
        let isInitialLoad = true;
        const entriesSub = onSnapshot(
            collection(db, 'users', userUID, 'entries'),
            (snapshot) => {
                if (isInitialLoad) {
                    // 초기 로드: 전체 데이터 한 번에 설정 (불가피)
                    const entries = snapshot.docs.map(doc => doc.data() as MinistryEntry);
                    useMinistryStore.setState({ entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
                    isInitialLoad = false;
                    return;
                }

                // 이후: 변경분만 인크리멘탈하게 적용
                const changes = snapshot.docChanges();
                if (changes.length === 0) return;

                useMinistryStore.setState((state) => {
                    let updated = [...state.entries];
                    let hasChange = false;

                    for (const change of changes) {
                        const entry = change.doc.data() as MinistryEntry;
                        if (change.type === 'added') {
                            // 이미 로컬에 있으면(optimistic update) 스킵
                            if (!updated.find(e => e.id === entry.id)) {
                                updated.push(entry);
                                hasChange = true;
                            }
                        } else if (change.type === 'modified') {
                            const idx = updated.findIndex(e => e.id === entry.id);
                            if (idx >= 0) {
                                updated[idx] = entry;
                                hasChange = true;
                            }
                        } else if (change.type === 'removed') {
                            const idx = updated.findIndex(e => e.id === entry.id);
                            if (idx >= 0) {
                                updated.splice(idx, 1);
                                hasChange = true;
                            }
                        }
                    }

                    // 실제 변경이 있을 때만 새 배열 참조 생성
                    return hasChange
                        ? { entries: updated.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
                        : {};
                });
            }
        );

        // 2. 주간 계획 리스너
        const plansSub = onSnapshot(
            collection(db, 'users', userUID, 'plans'),
            (snapshot) => {
                const plans = snapshot.docs.map(doc => doc.data() as WeeklyPlan);
                useMinistryStore.setState({ weeklyPlans: plans });
            }
        );

        // 3. 주간 메모 리스너
        const notesSub = onSnapshot(
            collection(db, 'users', userUID, 'notes'),
            (snapshot) => {
                const notes = snapshot.docs.map(doc => doc.data() as WeeklyNote);
                useMinistryStore.setState({ weeklyNotes: notes });
            }
        );

        // 4. 프로필 리스너
        const profileSub = onSnapshot(
            collection(db, 'users', userUID, 'profile'),
            (snapshot) => {
                const profileDoc = snapshot.docs.find(d => d.id === 'info');
                if (profileDoc) {
                    useMinistryStore.setState({ profile: profileDoc.data() as UserProfile });
                }
            }
        );

        return () => {
            entriesSub();
            plansSub();
            notesSub();
            profileSub();
        };
    }, [userUID]);

    return null;
};
