"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";

/**
 * OtpInput (screen 02) — 6 single-digit cells. Auto-advance per digit, paste fills all six,
 * backspace moves to the previous cell, numeric keypad. Cells stay filled for correction.
 *
 * Real <input> elements (more accessible than the locked mock's plain divs), so the locked
 * design's custom caret and per-digit entrance animation are ported as CSS rather than literal
 * innerHTML swaps: a custom caret span replaces the browser's native one on the active empty
 * cell (hidden via caret-color), and the entrance animation is driven by a data-filled attribute
 * — the [data-filled] rule only starts matching once a cell goes from empty to holding a digit,
 * which is enough on its own to play a CSS animation once; no remount needed (a remount here
 * would have to happen mid-paste while focus is being set on another cell, right before it, and
 * risked stealing it back).
 */

export interface OtpInputProps {
  value: string; // up to 6 digits
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  length = 6,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [active, setActive] = useState<number | null>(null);

  const setValue = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const handleChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const chars = value.split("");
    chars[i] = digit;
    const next = chars.join("").slice(0, length);
    setValue(next);
    if (i < length - 1) focusCell(i + 1);
  };

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[i]) {
        chars[i] = "";
        onChange(chars.join(""));
      } else if (i > 0) {
        chars[i - 1] = "";
        onChange(chars.join(""));
        focusCell(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focusCell(i - 1);
    } else if (e.key === "ArrowRight") {
      focusCell(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    setValue(pasted);
    focusCell(pasted.length >= length ? length - 1 : pasted.length);
  };

  return (
    <div className="otp" role="group" aria-label={`${length}-digit code`} data-error={error || undefined}>
      {Array.from({ length }).map((_, i) => {
        const filled = Boolean(value[i]);
        const showCaret = active === i && !filled;
        return (
          <span key={i} className="cellwrap">
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="cell"
              data-filled={filled || undefined}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={disabled}
              aria-label={`Digit ${i + 1}`}
              aria-invalid={error || undefined}
              value={value[i] ?? ""}
              style={showCaret ? { caretColor: "transparent" } : undefined}
              onChange={handleChange(i)}
              onKeyDown={handleKeyDown(i)}
              onPaste={handlePaste}
              onFocus={(e) => {
                e.target.select();
                setActive(i);
              }}
              onBlur={() => setActive((a) => (a === i ? null : a))}
            />
            {showCaret ? <span className="caret" aria-hidden="true" /> : null}
          </span>
        );
      })}
    </div>
  );
}
