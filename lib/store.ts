/**
 * App state. Persisted to localStorage only — nothing personal leaves the
 * device (CLAUDE.md privacy rules). Kept small and serialisable so a future
 * sync backend (e.g. Supabase) can mirror `profile` + `settings` as-is.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BirthInput, Sex } from "./life-math";

export const STORAGE_KEY = "life-blackhole";

export type Profile = {
  birth: BirthInput;
  /** ISO3 code from the life tables, or undefined for the world average. */
  country?: string;
  sex: Sex;
};

export type CounterUnit = "calendar" | "days" | "seconds";
export type MotionPreference = "system" | "reduce" | "full";

export type Settings = {
  unit: CounterUnit;
  hideCountdown: boolean;
  sound: boolean;
  motion: MotionPreference;
};

export const DEFAULT_SETTINGS: Settings = {
  unit: "calendar",
  hideCountdown: false,
  sound: false,
  motion: "system",
};

type State = {
  profile: Profile | null;
  settings: Settings;
};

type Actions = {
  setProfile: (profile: Profile) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Deletes everything this app stored, in memory and in localStorage. */
  deleteAllData: () => void;
};

export type AppStore = State & Actions;

const initialState: State = { profile: null, settings: DEFAULT_SETTINGS };

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      setProfile: (profile) => set({ profile }),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      deleteAllData: () => {
        set({ ...initialState, settings: { ...DEFAULT_SETTINGS } });
        useAppStore.persist.clearStorage();
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): State => ({ profile: s.profile, settings: s.settings }),
      // Fill in settings added after a user's data was first saved.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          profile: p.profile ?? null,
          settings: { ...DEFAULT_SETTINGS, ...p.settings },
        };
      },
    },
  ),
);
