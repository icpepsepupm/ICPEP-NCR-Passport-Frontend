export const DEFAULT_EVENT_BADGE = "🏅";

export const BADGE_PRESET_GROUPS: Array<{ label: string; emojis: string[] }> = [
  {
    label: "Awards",
    emojis: ["🏅", "🏆", "🎖️", "🥇", "🥈", "🥉", "🎉", "🎊", "🎓"],
  },
  {
    label: "Tech",
    emojis: ["💻", "🖥️", "🧠", "🤖", "🌐", "🔧", "🛠️", "🧪", "📡"],
  },
  {
    label: "Community",
    emojis: ["💚", "🤝", "🙌", "✋", "👏", "💬", "📣"],
  },
  {
    label: "Learning",
    emojis: ["📚", "📝", "🧩", "🧬", "📊", "📅", "📍", "🎤"],
  },
  {
    label: "Fun",
    emojis: ["🚀", "⭐", "✨", "🔥", "💥", "🎯", "🧭"],
  },
];

export const BADGE_PRESETS = BADGE_PRESET_GROUPS.flatMap((g) => g.emojis);
