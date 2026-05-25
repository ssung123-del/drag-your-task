
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type MinistryEntry, type WeeklyPlan, type WeeklyNote, type UserProfile, type Sheep } from '../types';
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
    sheep: Sheep[];

    // Actions
    setUser: (user: UserAuth | null) => void;
    setEntries: (entries: MinistryEntry[]) => void;
    setSheep: (sheep: Sheep[]) => void;
    addEntry: (entry: Omit<MinistryEntry, 'id' | 'createdAt'>) => Promise<void>;
    updateEntry: (id: string, entry: Partial<MinistryEntry>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    updateWeeklyPlan: (plan: WeeklyPlan) => Promise<void>;
    updateWeeklyNote: (note: WeeklyNote) => Promise<void>;

    updateProfile: (profile: UserProfile) => Promise<void>;
    clearData: () => void;

    // Sheep Actions
    addSheep: (sheep: Omit<Sheep, 'id' | 'createdAt'>) => Promise<void>;
    updateSheep: (id: string, sheep: Partial<Sheep>) => Promise<void>;
    deleteSheep: (id: string) => Promise<void>;
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
            sheep: [],

            setUser: (user) => set({ user }),
            setEntries: (entries) => set({ entries }),
            setSheep: (sheep) => set({ sheep }),

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

            addSheep: async (sheepData) => {
                const id = crypto.randomUUID();
                const createdAt = new Date().toISOString();
                const newSheep = { ...sheepData, id, createdAt } as Sheep;

                set((state) => ({ sheep: [...state.sheep, newSheep] }));

                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'sheep', id), newSheep);
                }
            },

            updateSheep: async (id, sheepUpdate) => {
                set((state) => ({
                    sheep: state.sheep.map((s) =>
                        s.id === id ? { ...s, ...sheepUpdate } : s
                    ),
                }));

                const user = get().user;
                if (user?.uid) {
                    await setDoc(doc(db, 'users', user.uid, 'sheep', id), sheepUpdate, { merge: true });
                }
            },

            deleteSheep: async (id) => {
                set((state) => ({
                    sheep: state.sheep.filter((s) => s.id !== id),
                }));

                const user = get().user;
                if (user?.uid) {
                    await deleteDoc(doc(db, 'users', user.uid, 'sheep', id));
                }
            },

            clearData: () => set({ entries: [], weeklyPlans: [], weeklyNotes: [], profile: null, sheep: [] }),
        }),
        {
            name: 'ministry-store',
            partialize: (state) => ({
                entries: state.entries,
                weeklyPlans: state.weeklyPlans,
                weeklyNotes: state.weeklyNotes,
                profile: state.profile,
                sheep: state.sheep,
            }),
        }
    )
);
