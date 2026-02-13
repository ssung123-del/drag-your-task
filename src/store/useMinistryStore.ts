
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type MinistryEntry, type WeeklyPlan, type WeeklyNote, type UserProfile } from '../types';
import { db } from '../lib/firebase';
import {
    doc,
    setDoc,
    deleteDoc
} from 'firebase/firestore';

interface MinistryState {
    user: UserAuth | null;
    entries: MinistryEntry[];
    weeklyPlans: WeeklyPlan[];
    weeklyNotes: WeeklyNote[];

    profile: UserProfile | null;

    // Actions
    setUser: (user: UserAuth | null) => void;
    setEntries: (entries: MinistryEntry[]) => void;
    addEntry: (entry: Omit<MinistryEntry, 'id' | 'createdAt'>) => Promise<void>;
    updateEntry: (id: string, entry: Partial<MinistryEntry>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    updateWeeklyPlan: (plan: WeeklyPlan) => Promise<void>;
    updateWeeklyNote: (note: WeeklyNote) => Promise<void>;

    updateProfile: (profile: UserProfile) => Promise<void>;
    clearData: () => void;
}

type UserAuth = {
    uid: string | null;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
};

export const useMinistryStore = create<MinistryState>()(
    persist(
        (set, get) => ({
            user: null,
            entries: [],
            weeklyPlans: [],
            weeklyNotes: [],

            profile: null,

            setUser: (user) => set({ user }),
            setEntries: (entries) => set({ entries }),

            addEntry: async (entryData) => {
                const id = crypto.randomUUID();
                const createdAt = new Date().toISOString();
                const newEntry = { ...entryData, id, createdAt } as MinistryEntry;

                set((state) => ({ entries: [...state.entries, newEntry] }));

                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'entries', id), newEntry);
                }
            },

            updateEntry: async (id, entryUpdate) => {
                set((state) => ({
                    entries: state.entries.map((e) =>
                        e.id === id ? { ...e, ...entryUpdate } : e
                    ),
                }));

                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'entries', id), entryUpdate, { merge: true });
                }
            },

            deleteEntry: async (id) => {
                set((state) => ({
                    entries: state.entries.filter((e) => e.id !== id),
                }));

                const user = get().user;
                if (user?.uid) {
                    await deleteDoc(doc(db, 'users', user.uid, 'entries', id));
                }
            },

            updateWeeklyPlan: async (plan) => {
                set((state) => {
                    const exists = state.weeklyPlans.findIndex(
                        (p) => p.weekStartDate === plan.weekStartDate
                    );
                    const newPlans = [...state.weeklyPlans];
                    if (exists >= 0) newPlans[exists] = plan;
                    else newPlans.push(plan);
                    return { weeklyPlans: newPlans };
                });

                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'plans', plan.weekStartDate), plan);
                }
            },

            updateWeeklyNote: async (note) => {
                set((state) => {
                    const exists = state.weeklyNotes.findIndex((n) => n.weekStartDate === note.weekStartDate);
                    const newNotes = [...state.weeklyNotes];
                    if (exists >= 0) newNotes[exists] = note;
                    else newNotes.push(note);
                    return { weeklyNotes: newNotes };
                });

                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'notes', note.weekStartDate), note);
                }
            },



            updateProfile: async (profile) => {
                set({ profile });
                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'profile', 'info'), profile);
                }
            },

            clearData: () => set({ entries: [], weeklyPlans: [], weeklyNotes: [], profile: null }),
        }),
        {
            name: 'ministry-store',
            partialize: (state) => ({
                entries: state.entries,
                weeklyPlans: state.weeklyPlans,
                weeklyNotes: state.weeklyNotes,

                profile: state.profile,
            }),
        }
    )
);
