import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function Carousel({ children }) {
  const railRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, children]);

  function scroll(direction) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(260, el.clientWidth * 0.85), behavior: "smooth" });
  }

  const btnBase = "absolute top-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-white grid place-items-center z-10 transition-colors";
  const btnStyle = { border: "1px solid var(--border-default)", boxShadow: "var(--sh-2)", color: "var(--text-primary)" };

  return (
    <div className="relative">
      {canPrev && (
        <button
          className={`${btnBase} -left-3.5`}
          style={btnStyle}
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <div
        ref={railRef}
        className="flex gap-3.5 overflow-x-auto pb-2 -mx-0.5 px-0.5"
        style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {children}
      </div>
      {canNext && (
        <button
          className={`${btnBase} -right-3.5`}
          style={btnStyle}
          onClick={() => scroll(1)}
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
