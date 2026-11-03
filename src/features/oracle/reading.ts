import { moods, visualStyles, type DeskMood, type VisualStyle } from "@/domain/recommendations";

export const oracleMoodStorageKey = "sidequest:oracle:mood";
export const oracleRealmStorageKey = "sidequest:oracle:realm";

export type OracleReading = {
  mood: DeskMood;
  realm: VisualStyle;
};

export function readOracleReading(): OracleReading | null {
  if (typeof window === "undefined") return null;
  try {
    const mood = window.localStorage.getItem(oracleMoodStorageKey);
    const realm = window.localStorage.getItem(oracleRealmStorageKey);
    if (!moods.includes(mood as DeskMood) || !visualStyles.includes(realm as VisualStyle)) return null;
    return { mood: mood as DeskMood, realm: realm as VisualStyle };
  } catch {
    return null;
  }
}

export function saveOracleReading(reading: OracleReading): void {
  try {
    window.localStorage.setItem(oracleMoodStorageKey, reading.mood);
    window.localStorage.setItem(oracleRealmStorageKey, reading.realm);
  } catch {
    // The encounter remains usable when browser storage is unavailable.
  }
}
