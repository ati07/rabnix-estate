"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { id: string; name: string };

// Typo-tolerant locality autocomplete. A plain text field named `locality` (so it works inside the
// existing GET form to /search), enhanced with a debounced suggestion dropdown from
// /api/localities/search. Selecting a suggestion fills the field and submits its form.
export function LocalitySearch({
  name = "locality",
  defaultValue = "",
  placeholder,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced fetch as the user types.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/localities/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const body = await res.json();
        setItems(body.localities ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline — ignore */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function choose(s: Suggestion) {
    setValue(s.name);
    setOpen(false);
    // Submit the enclosing search form on the next tick (after the value settles).
    requestAnimationFrame(() => inputRef.current?.form?.requestSubmit());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="autocomplete" ref={boxRef}>
      <input
        ref={inputRef}
        name={name}
        value={value}
        placeholder={placeholder}
        aria-label="Locality"
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && items.length > 0 && (
        <ul className="autocomplete-list" role="listbox">
          {items.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus; fire before blur
                choose(s);
              }}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
