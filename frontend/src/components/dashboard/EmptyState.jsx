import { Link } from "react-router-dom";

export function EmptyState({ icon: Icon, title, description, linkText, linkTo }) {
  return (
    <div className="py-8 px-5 text-center flex flex-col items-center gap-2">
      {Icon && (
        <span
          className="grid h-[52px] w-[52px] place-items-center rounded-[14px]"
          style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
        >
          <Icon size={24} />
        </span>
      )}
      <h4 className="text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        {title}
      </h4>
      <p className="text-[13.5px] max-w-[340px]" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      {linkText && linkTo && (
        <Link to={linkTo} className="mt-1 text-[13.5px] font-semibold" style={{ color: "var(--accent)" }}>
          {linkText} →
        </Link>
      )}
    </div>
  );
}
