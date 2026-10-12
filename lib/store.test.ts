import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, STORAGE_KEY, useAppStore } from "./store";

const profile = {
  birth: { date: "1996-03-14", timeZone: "Africa/Casablanca" },
  country: "MAR",
  sex: "female" as const,
};

describe("app store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ profile: null, settings: { ...DEFAULT_SETTINGS } });
  });

  it("persists the profile and settings to localStorage only under its key", () => {
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().updateSettings({ unit: "seconds" });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(stored.state.profile).toEqual(profile);
    expect(stored.state.settings.unit).toBe("seconds");
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
  });

  it("merges partial settings updates", () => {
    useAppStore.getState().updateSettings({ hideCountdown: true });
    expect(useAppStore.getState().settings).toEqual({
      ...DEFAULT_SETTINGS,
      hideCountdown: true,
    });
  });

  it("deletes everything, in memory and on disk", () => {
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().updateSettings({ unit: "days" });
    useAppStore.getState().deleteAllData();
    expect(useAppStore.getState().profile).toBeNull();
    expect(useAppStore.getState().settings).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("fills in settings that didn't exist when data was first saved", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { profile, settings: { unit: "days" } },
        version: 1,
      }),
    );
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().profile).toEqual(profile);
    expect(useAppStore.getState().settings).toEqual({
      ...DEFAULT_SETTINGS,
      unit: "days",
    });
  });
});
