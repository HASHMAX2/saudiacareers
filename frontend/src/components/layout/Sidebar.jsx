import { NavLink } from "react-router-dom";

export function Sidebar({ links }) {
  return (
    <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-card lg:sticky lg:top-24 lg:w-64 lg:self-start lg:p-3">
      <nav className="flex gap-1.5 overflow-x-auto lg:flex-col">
        {links.map((link) => (
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
            key={link.to}
            to={link.to}
            end={link.end}
          >
            {link.icon && <link.icon size={16} className="shrink-0" />}
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
