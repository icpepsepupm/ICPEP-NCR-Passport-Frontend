"use client";

import * as React from "react";

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
};

const GROUPS: Array<{ label: string; emojis: string[] }> = [
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

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [active, setActive] = React.useState(0);

  return (
    <div className="z-50 mt-2 w-full max-w-[460px] rounded-xl border border-cyan-400/25 bg-black/70 px-4 py-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap gap-3">
        {GROUPS.map((g, idx) => (
          <button
            key={g.label}
            onClick={() => setActive(idx)}
            className={
              "h-8 rounded-full px-3 text-[11px] leading-none " +
              (active === idx
                ? "border border-cyan-400/40 bg-cyan-400/10 text-cyan-100/90 ring-1 ring-cyan-400/30"
                : "border border-cyan-400/25 text-cyan-100/70 hover:border-cyan-300/50")
            }
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-cyan-400/15 bg-[#0b0f13]/70 p-3">
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(2.75rem,_1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,_minmax(3rem,_1fr))] md:grid-cols-[repeat(auto-fill,_minmax(3.25rem,_1fr))]">
          {GROUPS[active].emojis.map((e) => (
            <button
              key={e}
              onClick={() => onSelect(e)}
              className="grid w-full place-content-center rounded-lg border border-cyan-400/20 bg-black/40 text-2xl hover:border-cyan-300/50 aspect-square"
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
