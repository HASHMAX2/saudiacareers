import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";

export function DashboardLayout({ links }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-7">
      <Sidebar links={links} />
      <section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6 lg:p-8">
        <Outlet />
      </section>
    </div>
  );
}
