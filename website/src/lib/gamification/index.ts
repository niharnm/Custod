import type { Achievement, Scan, ScanEvent, Streak } from "@/lib/types";

const ACHIEVEMENTS = [
  ["first_checkin", "First Check-In"],
  ["reset_completed", "Reset Completed"],
  ["pattern_spotted", "Pattern Spotted"],
  ["focus_recovered", "Focus Recovered"],
  ["three_stable_days", "Three Stable Days"],
  ["weekly_reflection", "Weekly Reflection"],
] as const;

export function deriveProgress(scans: Scan[], events: ScanEvent[]) {
  const checkinStreak = streakFromDates("checkin", scans.map((scan) => scan.createdAt));
  const resetStreak = streakFromDates(
    "reset",
    events.filter((event) => event.type === "reset_complete").map((event) => event.createdAt)
  );
  const achievements = deriveAchievements(scans, events);
  const weeklyConsistency = distinctDays(scans.filter((scan) => isThisWeek(scan.createdAt)).map((scan) => scan.createdAt)).length;
  const stabilityTrend = scans.slice(0, 7).filter((scan) => scan.status === "green").length;

  return {
    streaks: [checkinStreak, resetStreak],
    achievements,
    weeklyConsistency,
    stabilityTrend,
  };
}

export function unlockedAfterReset(scans: Scan[], events: ScanEvent[]): Achievement[] {
  return deriveAchievements(scans, events).filter((achievement) => achievement.unlockedAt);
}

function deriveAchievements(scans: Scan[], events: ScanEvent[]): Achievement[] {
  const firstScan = oldest(scans.map((scan) => scan.createdAt));
  const firstReset = oldest(events.filter((event) => event.type === "reset_complete").map((event) => event.createdAt));
  const firstPattern = oldest(scans.filter((scan) => scan.mainPattern !== "Stable browsing pattern").map((scan) => scan.createdAt));
  const focusRecovered = findFocusRecovered(scans);
  const threeStable = threeStableDays(scans);
  const firstReflection = oldest(events.filter((event) => event.type === "reflection_added").map((event) => event.createdAt));

  const unlocked: Record<string, string | null> = {
    first_checkin: firstScan,
    reset_completed: firstReset,
    pattern_spotted: firstPattern,
    focus_recovered: focusRecovered,
    three_stable_days: threeStable,
    weekly_reflection: firstReflection,
  };

  return ACHIEVEMENTS.map(([id, name]) => ({
    id,
    name,
    unlockedAt: unlocked[id],
  }));
}

function streakFromDates(type: Streak["type"], isoDates: string[]): Streak {
  const days = distinctDays(isoDates).sort();
  if (days.length === 0) return { type, current: 0, longest: 0, lastDay: "" };

  let longest = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (daysBetween(days[index - 1], days[index]) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  let current = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (daysBetween(days[index - 1], days[index]) !== 1) break;
    current += 1;
  }

  return { type, current, longest, lastDay: days[days.length - 1] };
}

function findFocusRecovered(scans: Scan[]): string | null {
  const chronological = [...scans].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (let index = 1; index < chronological.length; index += 1) {
    if (chronological[index - 1].score >= 55 && chronological[index].score <= 34) {
      return chronological[index].createdAt;
    }
  }
  return null;
}

function threeStableDays(scans: Scan[]): string | null {
  const stableDays = distinctDays(scans.filter((scan) => scan.status === "green").map((scan) => scan.createdAt)).sort();
  let run = 1;
  for (let index = 1; index < stableDays.length; index += 1) {
    run = daysBetween(stableDays[index - 1], stableDays[index]) === 1 ? run + 1 : 1;
    if (run >= 3) return stableDays[index];
  }
  return null;
}

function distinctDays(isoDates: string[]): string[] {
  return Array.from(new Set(isoDates.map((date) => date.slice(0, 10))));
}

function oldest(isoDates: string[]): string | null {
  return isoDates.sort()[0] ?? null;
}

function isThisWeek(iso: string): boolean {
  const now = new Date();
  const date = new Date(iso);
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

function daysBetween(a: string, b: string): number {
  const left = new Date(`${a}T00:00:00.000Z`).getTime();
  const right = new Date(`${b}T00:00:00.000Z`).getTime();
  return Math.round((right - left) / 86_400_000);
}
