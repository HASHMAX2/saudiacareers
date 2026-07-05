import { CheckSquare, Shield, User } from "lucide-react";

const FAQS = [
  {
    icon: CheckSquare,
    title: "Applying to jobs",
    desc: "How the search and application process works",
    bg: "var(--gold-bg)",
    fg: "var(--gold-ink)",
  },
  {
    icon: User,
    title: "Jobseeker profile",
    desc: "Improve and manage your profile",
    bg: "var(--green-bg)",
    fg: "var(--green)",
  },
  {
    icon: Shield,
    title: "Account & email settings",
    desc: "Configure your account the way you want",
    bg: "var(--accent-subtle)",
    fg: "var(--accent)",
  },
];

export function FAQCard() {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" }}>
      <h3 className="text-base font-bold mb-1.5" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        Frequently asked
      </h3>
      <div>
        {FAQS.map((f, i) => (
          <a
            key={i}
            href="#"
            className="flex items-start gap-3 py-3 px-1.5 transition-colors group"
            style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--bg-elev)" : "none" }}
          >
            <span
              className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px]"
              style={{ background: f.bg, color: f.fg }}
            >
              <f.icon size={19} />
            </span>
            <span>
              <span className="block text-[13.5px] font-bold group-hover:underline" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                {f.title}
              </span>
              <span className="block text-xs mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{f.desc}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
