export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type Day = typeof DAYS[number];

export const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

export interface Category {
  id: number;
  name: string;
  colorVar: string; // e.g. "--cat-1"
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Sleeping', colorVar: '--cat-1' },
  { id: 2, name: 'Family time', colorVar: '--cat-2' },
  { id: 3, name: 'Work', colorVar: '--cat-3' },
  { id: 4, name: 'Couple time', colorVar: '--cat-4' },
  { id: 5, name: 'Exercise & wellbeing', colorVar: '--cat-5' },
  { id: 6, name: 'Free', colorVar: '--cat-6' },
  { id: 7, name: 'Routine', colorVar: '--cat-7' },
];

export const MAX_CATEGORIES = 10;

// Grid data: schedule[day][timeSlotIndex] = categoryName or ''
export type ScheduleData = Record<Day, string[]>;

export function createEmptySchedule(): ScheduleData {
  const schedule: Partial<ScheduleData> = {};
  for (const day of DAYS) {
    schedule[day] = new Array(48).fill('');
  }
  return schedule as ScheduleData;
}

export interface SleepSettings {
  sameEveryDay: boolean;
  default: { sleep: string; wake: string };
  perDay: Record<Day, { sleep: string; wake: string }>;
}

export function createDefaultSleepSettings(): SleepSettings {
  const perDay: Partial<Record<Day, { sleep: string; wake: string }>> = {};
  for (const day of DAYS) {
    perDay[day] = { sleep: '22:30', wake: '06:30' };
  }
  return {
    sameEveryDay: true,
    default: { sleep: '22:30', wake: '06:30' },
    perDay: perDay as Record<Day, { sleep: string; wake: string }>,
  };
}

export function applySleepToSchedule(schedule: ScheduleData, settings: SleepSettings): ScheduleData {
  const newSchedule = { ...schedule };
  for (const day of DAYS) {
    const slots = [...newSchedule[day]];
    // Clear all existing sleep slots first
    for (let i = 0; i < 48; i++) {
      if (slots[i] === 'Sleeping') slots[i] = '';
    }
    const { sleep, wake } = settings.sameEveryDay ? settings.default : settings.perDay[day];
    const sleepIdx = TIME_SLOTS.indexOf(sleep);
    const wakeIdx = TIME_SLOTS.indexOf(wake);

    // Mark sleep slots
    if (sleepIdx >= 0 && wakeIdx >= 0) {
      if (sleepIdx > wakeIdx) {
        for (let i = sleepIdx; i < 48; i++) {
          if (!slots[i]) slots[i] = 'Sleeping';
        }
        for (let i = 0; i < wakeIdx; i++) {
          if (!slots[i]) slots[i] = 'Sleeping';
        }
      } else {
        for (let i = sleepIdx; i < wakeIdx; i++) {
          if (!slots[i]) slots[i] = 'Sleeping';
        }
      }
    }
    newSchedule[day] = slots;
  }
  return newSchedule;
}

export function getCategoryColor(name: string, categories: Category[]): string {
  const cat = categories.find(c => c.name === name);
  return cat ? `hsl(var(${cat.colorVar}))` : 'hsl(var(--muted))';
}

export function getCategoryStats(schedule: ScheduleData, categories: Category[]): { name: string; slots: number; percentage: number; color: string }[] {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const day of DAYS) {
    for (const slot of schedule[day]) {
      if (slot) {
        counts[slot] = (counts[slot] || 0) + 1;
        total++;
      }
    }
  }
  return Object.entries(counts)
    .map(([name, slots]) => ({
      name,
      slots,
      percentage: Math.round((slots / (48 * 7)) * 100),
      color: getCategoryColor(name, categories),
    }))
    .sort((a, b) => b.slots - a.slots);
}
