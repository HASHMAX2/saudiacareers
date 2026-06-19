import { useState } from "react";

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  return {
    page,
    setPage,
    nextPage: () => setPage((current) => current + 1),
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
  };
}

