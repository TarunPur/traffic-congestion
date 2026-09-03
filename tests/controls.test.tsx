import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Cta,
  Segmented,
  FilterTabs,
  TextField,
  SelectableRow,
  TabBar,
} from "@/components/controls";

/** P1.2 — every control's states (default/active/focus/disabled/loading/selected/pressed). */

describe("Cta", () => {
  it("fires onClick when enabled", async () => {
    const onClick = vi.fn();
    render(<Cta onClick={onClick}>Continue</Cta>);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled and does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Cta disabled onClick={onClick}>
        Continue
      </Cta>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading disables, sets aria-busy, and shows the loading label", () => {
    render(
      <Cta loading loadingLabel="Sending…">
        Send code
      </Cta>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toHaveTextContent("Sending…");
  });

  it("ghost variant carries the ghost class", () => {
    render(<Cta ghost>Later</Cta>);
    expect(screen.getByRole("button").className).toContain("ghost");
  });
});

describe("Segmented", () => {
  it("marks the active option aria-pressed and switches on click", async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        ariaLabel="Mode"
        value="free"
        onChange={onChange}
        options={[
          { value: "free", label: "Free" },
          { value: "managed", label: "Managed" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Free" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Managed" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "Managed" }));
    expect(onChange).toHaveBeenCalledWith("managed");
  });
});

describe("FilterTabs", () => {
  it("marks the active tab and changes on click", async () => {
    const onChange = vi.fn();
    render(
      <FilterTabs
        ariaLabel="Sort"
        value="fastest"
        onChange={onChange}
        options={[
          { value: "fastest", label: "Fastest" },
          { value: "cheapest", label: "Cheapest" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Fastest" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Cheapest" }));
    expect(onChange).toHaveBeenCalledWith("cheapest");
  });
});

describe("TextField", () => {
  it("renders label + prefix and forwards typed input", async () => {
    const onChange = vi.fn();
    render(<TextField label="Phone" prefix="+91" value="" onChange={onChange} aria-label="Phone number" />);
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("+91")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Phone number"), "9");
    expect(onChange).toHaveBeenCalledWith("9");
  });

  it("shows the error state (data-error + aria-invalid)", () => {
    render(<TextField value="12" error onChange={() => {}} aria-label="OTP" />);
    const input = screen.getByLabelText("OTP");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".field")).toHaveAttribute("data-error", "true");
  });

  it("shows a clear button only when there is a value and onClear", async () => {
    const onClear = vi.fn();
    const { rerender } = render(<TextField value="" onClear={onClear} onChange={() => {}} aria-label="q" />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    rerender(<TextField value="hauz" onClear={onClear} onChange={() => {}} aria-label="q" />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("SelectableRow", () => {
  it("reflects selection and fires onSelect", async () => {
    const onSelect = vi.fn();
    render(<SelectableRow name="Hauz Khas" sub="Metro" selected onSelect={onSelect} />);
    const row = screen.getByRole("option");
    expect(row).toHaveAttribute("aria-selected", "true");
    await userEvent.click(row);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("supports radio semantics", () => {
    render(<SelectableRow name="Free" selected={false} onSelect={() => {}} role="radio" />);
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "false");
  });
});

describe("TabBar", () => {
  it("marks the current tab and switches", async () => {
    const onChange = vi.fn();
    render(
      <TabBar
        current="home"
        onChange={onChange}
        items={[
          { key: "home", label: "Home", icon: "home" },
          { key: "plan", label: "Plan", icon: "route" },
          { key: "you", label: "You", icon: "user" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /Home/ })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: /Plan/ }));
    expect(onChange).toHaveBeenCalledWith("plan");
  });
});
