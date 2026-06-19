import { Button } from "./Button.jsx";

export function Pagination({ page, totalPages, onPageChange }) {
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="order-first text-sm font-medium text-slate-600 sm:order-none">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <Button
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
