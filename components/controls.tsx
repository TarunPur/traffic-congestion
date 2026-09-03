"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

/**
 * Core controls (P1.2) — thin wrappers over the control CSS ported from clearline.css
 * (see app/globals.css @layer components). Hairlines, not cards. All states handled by the
 * ported CSS: default / active / focus-visible / disabled / loading / selected / pressed.
 */

/* ── Primary CTA — full-bleed ink bar, lives in the foot ── */
export interface CtaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ghost?: boolean;
  loading?: boolean;
  /** Text shown while loading (defaults to children). */
  loadingLabel?: ReactNode;
}

export function Cta({
  ghost = false,
  loading = false,
  loadingLabel,
  disabled,
  children,
  className = "",
  type = "button",
  ...rest
}: CtaProps) {
  return (
    <button
      type={type}
      className={`cta${ghost ? " ghost" : ""} ${className}`.trim()}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (loadingLabel ?? children) : children}
    </button>
  );
}

/* ── Segmented control ── */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}
export interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div className={`seg ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Filter tabs (sentence case, underline active) ── */
export interface FilterTabsProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: FilterTabsProps<T>) {
  return (
    <div className={`filters ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Text field ── */
export interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  iconLeft?: IconName;
  error?: boolean;
  onClear?: () => void;
  type?: "text" | "tel" | "email" | "search";
  inputMode?: "text" | "tel" | "email" | "numeric" | "search";
  autoComplete?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  iconLeft,
  error = false,
  onClear,
  type = "text",
  inputMode,
  autoComplete,
  id,
  name,
  ...aria
}: TextFieldProps) {
  return (
    <label className="block">
      {label ? <span className="lab">{label}</span> : null}
      <span className="field" data-error={error || undefined}>
        {iconLeft ? <Icon name={iconLeft} size={20} /> : null}
        {prefix ? <span className="prefix">{prefix}</span> : null}
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          aria-invalid={error || undefined}
          aria-label={aria["aria-label"]}
          onChange={(e) => onChange(e.target.value)}
        />
        {onClear && value ? (
          <button type="button" className="clear" aria-label="Clear" onClick={onClear}>
            <Icon name="plus" size={16} className="rotate-45" />
          </button>
        ) : null}
      </span>
    </label>
  );
}

/* ── Selectable / radio ruled row ── */
export interface SelectableRowProps {
  name: ReactNode;
  sub?: ReactNode;
  icon?: IconName;
  selected: boolean;
  onSelect: () => void;
  /** radio semantics within a group; default is option. */
  role?: "option" | "radio";
}
export function SelectableRow({
  name,
  sub,
  icon,
  selected,
  onSelect,
  role = "option",
}: SelectableRowProps) {
  return (
    <button
      type="button"
      className="rowline"
      role={role}
      {...(role === "radio" ? { "aria-checked": selected } : { "aria-selected": selected })}
      data-selected={selected}
      onClick={onSelect}
    >
      <span className="ic">{icon ? <Icon name={icon} size={20} /> : null}</span>
      <span className="lines">
        <span className="nm">{name}</span>
        {sub ? <span className="sub">{sub}</span> : null}
      </span>
      <span className="tick">
        <Icon name="check" size={20} />
      </span>
    </button>
  );
}

/** Container for ruled rows (adds the top/bottom hairlines via .rowline). */
export function RuledRows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rows ${className}`.trim()}>{children}</div>;
}

/* ── Bottom tab bar (Home · Plan · You) ── */
export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon: IconName;
}
export interface TabBarProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  current: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
}
export function TabBar<T extends string>({
  items,
  current,
  onChange,
  ariaLabel = "Main",
}: TabBarProps<T>) {
  return (
    <nav className="tabbar" aria-label={ariaLabel}>
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          aria-current={it.key === current}
          onClick={() => onChange(it.key)}
        >
          <Icon name={it.icon} size={22} />
          {it.label}
        </button>
      ))}
    </nav>
  );
}
