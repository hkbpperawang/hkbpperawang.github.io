"use client";

import * as React from "react";

export type BookValue = "be" | "bn" | "kj";

type Props = {
  id?: string;
  value: BookValue;
  onChange: (v: BookValue) => void;
  className?: string;
  labelMap?: Partial<Record<BookValue, string>>;
};

const BOOKS: { value: BookValue; label: string }[] = [
  { value: "be", label: "Buku Ende (BE)" },
  { value: "bn", label: "Buku Nyanyian (BN)" },
  { value: "kj", label: "Kidung Jemaat (KJ)" },
];

function cls(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export function BookSelect({ id, value, onChange, className, labelMap }: Props) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<BookValue>(value);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const listboxId = React.useId();

  React.useEffect(() => setActive(value), [value]);

  React.useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node | null;
      if (popRef.current && t && !popRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    }
    function onDocKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onDocKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onDocKey);
    };
  }, [open]);

  const selected = BOOKS.find((b) => b.value === value)!;
  const map = labelMap ?? {};

  return (
    <div className={cls("relative", className)}>
      <button
        id={id}
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full text-left px-3 py-2 rounded-md glass-input shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="block truncate">
          {map[selected.value] ?? selected.label}
        </span>
      </button>

      {open && (
        <div
          ref={popRef}
          role="listbox"
          id={listboxId}
          aria-labelledby={id}
          className="absolute left-0 right-0 z-50 mt-1 rounded-md glass-panel shadow-lg overflow-hidden"
        >
          {BOOKS.map((b) => (
            <div
              key={b.value}
              role="option"
              aria-selected={b.value === value}
              className={cls(
                "px-3 py-2 text-sm text-white cursor-pointer",
                b.value === active ? "bg-white/10" : "hover:bg-white/10"
              )}
              onMouseEnter={() => setActive(b.value)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(b.value);
                setOpen(false);
              }}
            >
              {map[b.value] ?? b.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

