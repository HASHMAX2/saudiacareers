export function StatCard({ icon: Icon, label, sublabel, value, href, bgClass = "accent-subtle", fgClass = "accent" }) {
  const bgMap = {
    "accent-subtle": "var(--accent-subtle)",
    "gold-bg": "var(--gold-bg)",
    "green-bg": "var(--green-bg)",
  };
  const fgMap = {
    accent: "var(--accent)",
    "gold-ink": "var(--gold-ink)",
    green: "var(--green)",
  };

  const content = (
    <>
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ background: bgMap[bgClass] ?? bgMap["accent-subtle"], color: fgMap[fgClass] ?? fgMap.accent }}
      >
        <Icon size={21} />
      </span>
      <span className="min-w-0">
        {value !== undefined ? (
          <>
            <span className="flex items-baseline gap-1.5 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              <span style={{ fontFamily: "var(--font-mono)" }}>{String(value).padStart(2, "0")}</span>
              {label}
            </span>
            <small className="block text-xs" style={{ color: "var(--text-secondary)" }}>{sublabel}</small>
          </>
        ) : (
          <>
            <small className="block text-xs" style={{ color: "var(--text-secondary)" }}>{sublabel}</small>
            <span className="text-[13.5px] font-semibold" style={{ color: "var(--accent)" }}>{label}</span>
          </>
        )}
      </span>
    </>
  );

  const cls = "flex items-center gap-3.5 p-4 bg-white rounded-[14px] transition-shadow transition-transform hover:shadow-lg hover:-translate-y-0.5";
  const style = { border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" };

  if (href) {
    return <a href={href} className={cls} style={style}>{content}</a>;
  }
  return <div className={cls} style={style}>{content}</div>;
}
