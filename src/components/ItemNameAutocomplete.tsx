"use client";

import { useEffect, useRef, useState } from "react";

type CatalogEntry = { name: string; code: string | null };

export function ItemNameAutocomplete({
  value,
  onChange,
  onSelect,
  onEnter,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (entry: CatalogEntry) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [options, setOptions] = useState<CatalogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    if (!query) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/item-catalog?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((entries: CatalogEntry[]) => {
          setOptions(entries);
          setOpen(entries.length > 0);
        })
        .catch(() => setOptions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => options.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            setOpen(false);
            onEnter();
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[240px] overflow-y-auto bg-surface border border-border rounded-lg shadow-lg z-20 py-1">
          {options.map((entry) => (
            <div
              key={entry.name}
              onClick={() => {
                onSelect(entry);
                setOpen(false);
              }}
              className="px-3 py-[7px] text-[13px] cursor-pointer hover:bg-brand-bg flex items-center justify-between gap-2"
            >
              <span className="text-text-primary">{entry.name}</span>
              {entry.code && <span className="text-[11px] text-text-muted shrink-0">{entry.code}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
