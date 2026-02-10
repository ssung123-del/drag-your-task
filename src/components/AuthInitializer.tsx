
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
                // 로그아웃 시 필요하다면 clearData() 호출 가능
            }
        });

        return () => unsubscribeAuth();
    }, [setUser, clearData]);

    const userUID = useMinistryStore(state => state.user?.uid);

    useEffect(() => {
        if (!userUID) return;

        // 1. 사역 기록 리스너
        const entriesSub = onSnapshot(
            collection(db, 'users', userUID, 'entries'),
            (snapshot) => {
                const entries = snapshot.docs.map(doc => doc.data() as MinistryEntry);
                useMinistryStore.setState({ entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
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
