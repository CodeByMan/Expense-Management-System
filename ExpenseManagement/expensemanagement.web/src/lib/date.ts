export function isSurplusUnlocked(): boolean {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() >= lastDay - 2; // unlocks on 29th for 31-day, 28th for 30-day, etc.
}

export function surplusUnlockDay(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - 2;
}