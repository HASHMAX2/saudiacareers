export function VisibilityChart({ searchAppearances = 0, employerActions = 0 }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)" }}>
      <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        Visibility to employers
      </h3>
      <p className="text-[12.5px] mt-0.5 mb-3.5" style={{ color: "var(--text-secondary)" }}>
        Your profile performance on the SaudiaCareers database
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3.5" style={{ background: "var(--bg-base)", border: "1px solid var(--bg-elev)" }}>
          <div className="text-2xl font-semibold leading-none" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {String(searchAppearances).padStart(2, "0")}
          </div>
          <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>Search appearances</div>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "var(--bg-base)", border: "1px solid var(--bg-elev)" }}>
          <div className="text-2xl font-semibold leading-none" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {String(employerActions).padStart(2, "0")}
          </div>
          <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>Employer actions</div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full block" role="img" aria-label="Weekly trend">
          <line x1="0" y1="30" x2="300" y2="30" stroke="var(--bg-elev)" strokeWidth="1" />
          <line x1="0" y1="60" x2="300" y2="60" stroke="var(--bg-elev)" strokeWidth="1" />
          <line x1="0" y1="90" x2="300" y2="90" stroke="var(--bg-elev)" strokeWidth="1" />
          <path d="M0,95 L50,80 L100,88 L150,55 L200,62 L250,34 L300,42 L300,120 L0,120 Z" fill="url(#scGrad)" />
          <path d="M0,95 L50,80 L100,88 L150,55 L200,62 L250,34 L300,42" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="250" cy="34" r="4" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
          <defs>
            <linearGradient id="scGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex justify-between mt-1.5">
          {["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"].map((w) => (
            <span key={w} className="text-[9.5px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
