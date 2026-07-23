import { Button } from "./Button.jsx";

function buildPageList(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const keep = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push({ ellipsis: true, key: `ellipsis-${p}` });
    result.push({ ellipsis: false, page: p });
    prev = p;
  }
  return result;
}

export function Pagination({ page, totalPages, onPageChange }) {
  const safeTotalPages = Math.max(totalPages, 1);
  const items = buildPageList(page, safeTotalPages).map((item) =>
    typeof item === "number" ? { ellipsis: false, page: item } : item,
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 rounded-xl border p-3 sm:flex-row"
      style={{ borderColor: "var(--border-default)", background: "var(--bg-white)" }}
    >
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>

      <ul className="order-first flex flex-wrap items-center justify-center gap-1.5 sm:order-none">
        {items.map((item) =>
          item.ellipsis ? (
            <li key={item.key} aria-hidden="true" className="px-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              …
            </li>
          ) : (
            <li key={item.page}>
              <button
                type="button"
                aria-current={item.page === page ? "page" : undefined}
                onClick={() => item.page !== page && onPageChange(item.page)}
                className="grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-medium transition-colors"
                style={
                  item.page === page
                    ? { background: "var(--accent)", color: "#fff" }
                    : { border: "1px solid var(--border-default)", color: "var(--text-secondary)" }
                }
              >
                {item.page}
              </button>
            </li>
          ),
        )}
      </ul>

      <Button
        variant="secondary"
        disabled={page >= safeTotalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
