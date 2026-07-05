import { Camera, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export function ProfileCard({ profile }) {
  const initial = profile.name?.[0]?.toUpperCase() ?? "?";
  const exp = profile.experience ? `${profile.experience} yrs` : "";
  const subtitle = [profile.designation, exp].filter(Boolean).join(" · ");

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-default)", boxShadow: "var(--sh-3)" }}>
      {/* Top */}
      <div
        className="flex flex-col items-center text-center px-5 pt-5 pb-4"
        style={{ background: "linear-gradient(180deg, var(--accent-subtle), #fff)" }}
      >
        <div
          className="grid h-[72px] w-[72px] place-items-center rounded-full text-[26px] font-extrabold text-white"
          style={{
            fontFamily: "var(--font-display)",
            background: `linear-gradient(135deg, var(--accent), var(--accent-hover))`,
            boxShadow: "0 6px 16px rgba(244,67,54,0.3)",
            border: "3px solid #fff",
          }}
        >
          {initial}
        </div>
        <div className="mt-3 text-[17px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {profile.name}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{profile.profileCompletion}%</span> profile completed
          </span>
          <span className="text-[10.5px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
            Updated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${profile.profileCompletion}%`, background: `linear-gradient(90deg, var(--gold), #EBB752)` }}
          />
        </div>

        {/* Missing fields */}
        {profile.missingFields?.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {profile.missingFields.slice(0, 3).map((item) => (
              <div
                key={item.field}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[11px]"
                style={{ border: "1px solid var(--border-default)" }}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px]"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {item.field === "photo" ? <Camera size={16} /> : <CreditCard size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </span>
                  <small className="block text-[10.5px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--green)" }}>
                    ADDS {item.boost}%
                  </small>
                </span>
                <Link
                  to="/dashboard/profile"
                  className="text-[12.5px] font-semibold shrink-0"
                  style={{ color: "var(--accent)" }}
                >
                  {item.field === "photo" ? "Upload" : "Add"}
                </Link>
              </div>
            ))}
          </div>
        )}

        <Link
          to="/dashboard/profile"
          className="block w-full text-center mt-4 py-3 rounded-xl text-[14.5px] font-bold text-white"
          style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}
        >
          View & edit profile
        </Link>
      </div>
    </div>
  );
}
