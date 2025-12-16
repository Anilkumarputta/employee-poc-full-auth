// List of major festivals and their date ranges (month and day)
// Add more as needed
export type FestivalTheme = {
  name: string;
  start: string; // MM-DD
  end: string;   // MM-DD
  colors: string[]; // [primary, secondary, accent]
  backgroundImage?: string; // Optional festive image URL
  greeting: string;
};

export const FESTIVAL_THEMES: FestivalTheme[] = [
  {
    name: "New Year",
    start: "12-30",
    end: "01-02",
    colors: ["#FFD700", "#1E90FF", "#FFFFFF"],
    backgroundImage: undefined, // Add image URL if desired
    greeting: "Happy New Year! 🎉",
  },
  {
    name: "Christmas",
    start: "12-20",
    end: "12-27",
    colors: ["#E53935", "#43A047", "#FFFFFF"],
    backgroundImage: undefined,
    greeting: "Merry Christmas! 🎄",
  },
  {
    name: "Diwali",
    start: "10-20",
    end: "10-28",
    colors: ["#FFD700", "#FF6F00", "#FFFFFF"],
    backgroundImage: undefined,
    greeting: "Happy Diwali! 🪔",
  },
  // Add more festivals here
];

// DEMO: Allow override of festival theme by name or date
let demoOverride: { name?: string; date?: Date } | null = null;
export function setFestivalDemoOverride(override: { name?: string; date?: Date } | null) {
  demoOverride = override;
}

// Utility to get the current festival theme (if any)
export function getCurrentFestivalTheme(date: Date = new Date()): FestivalTheme | null {
  // DEMO: If override is set, use it
  if (demoOverride) {
    if (demoOverride.name) {
      return FESTIVAL_THEMES.find(f => f.name === demoOverride.name) || null;
    }
    if (demoOverride.date) {
      date = demoOverride.date;
    }
  }
  const mmdd = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = mmdd(date);
  for (const fest of FESTIVAL_THEMES) {
    // Handle year wrap (e.g., New Year)
    if (fest.start > fest.end) {
      if (today >= fest.start || today <= fest.end) return fest;
    } else {
      if (today >= fest.start && today <= fest.end) return fest;
    }
  }
  return null;
}
