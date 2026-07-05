import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const POLL_DATA = {
  question: "Which sector is outperforming expectations right now?",
  options: [
    { label: "Oil, gas & energy", pct: 24 },
    { label: "Construction & real estate", pct: 19 },
    { label: "Banking & finance", pct: 12 },
    { label: "Healthcare", pct: 17 },
    { label: "IT & AI", pct: 28 },
  ],
  totalVotes: 3918,
};

export function PollWidget() {
  const [selected, setSelected] = useState(null);
  const [voted, setVoted] = useState(false);

  function submit() {
    if (selected === null) return;
    setVoted(true);
  }

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" }}>
      <span
        className="inline-block text-[10.5px] font-bold tracking-[0.1em] px-2.5 py-1 rounded-full"
        style={{ fontFamily: "var(--font-display)", color: "var(--gold-ink)", background: "var(--gold-bg)" }}
      >
        YOUR OPINION MATTERS
      </span>
      <div className="mt-3 mb-3.5 text-[15.5px] font-bold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        {POLL_DATA.question}
      </div>

      <div className="space-y-2">
        {POLL_DATA.options.map((opt, i) => (
          <label
            key={i}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-[11px] relative overflow-hidden cursor-pointer transition-colors"
            style={{
              border: `1px solid ${selected === i ? "var(--accent)" : "var(--border-default)"}`,
              background: selected === i && !voted ? "var(--accent-subtle)" : undefined,
            }}
          >
            {voted && (
              <span
                className="absolute left-0 top-0 h-full transition-[width] duration-[600ms]"
                style={{ width: `${opt.pct}%`, background: "var(--accent-subtle)", zIndex: 0 }}
              />
            )}
            <input
              type="radio"
              name="poll"
              className="sr-only"
              checked={selected === i}
              onChange={() => !voted && setSelected(i)}
              disabled={voted}
            />
            <span
              className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full relative z-10"
              style={{ border: `2px solid ${selected === i ? "var(--accent)" : "var(--border-default)"}` }}
            >
              {selected === i && (
                <span className="block w-[9px] h-[9px] rounded-full" style={{ background: "var(--accent)" }} />
              )}
            </span>
            <span
              className="text-[13.5px] relative z-10"
              style={{
                color: "var(--text-primary)",
                fontWeight: selected === i ? 600 : 400,
              }}
            >
              {opt.label}
            </span>
            {voted && (
              <span
                className="ml-auto text-xs font-semibold relative z-10"
                style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
              >
                {opt.pct}%
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3.5">
        <span className="text-[11.5px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          Total votes: {POLL_DATA.totalVotes.toLocaleString()}
        </span>
        {voted ? (
          <span className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--green)" }}>
            <CheckCircle2 size={17} /> Thanks for voting
          </span>
        ) : (
          <button
            onClick={submit}
            disabled={selected === null}
            className="text-[13px] font-bold text-white px-5 py-2 rounded-[10px] disabled:opacity-40"
            style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}
          >
            Submit your vote
          </button>
        )}
      </div>
    </div>
  );
}
