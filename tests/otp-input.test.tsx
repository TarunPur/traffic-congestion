import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { OtpInput } from "@/components/otp-input";

/** P3.2 — OTP cell behaviour: auto-advance, paste-fill, backspace, onComplete. */

function Harness({ onComplete }: { onComplete?: (v: string) => void }) {
  const [v, setV] = useState("");
  return <OtpInput value={v} onChange={setV} onComplete={onComplete} />;
}

describe("OtpInput", () => {
  it("renders 6 numeric cells", () => {
    render(<Harness />);
    const cells = screen.getAllByRole("textbox");
    expect(cells).toHaveLength(6);
    expect(cells[0]).toHaveAttribute("inputmode", "numeric");
  });

  it("auto-advances and fires onComplete at 6 digits", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const cells = screen.getAllByRole("textbox");
    cells[0]!.focus();
    await userEvent.keyboard("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("paste fills all six cells", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const cells = screen.getAllByRole("textbox") as HTMLInputElement[];
    cells[0]!.focus();
    await userEvent.paste("424242");
    expect(onComplete).toHaveBeenCalledWith("424242");
    expect(cells[5]!.value).toBe("2");
  });

  it("ignores non-digits on paste", async () => {
    render(<Harness />);
    const cells = screen.getAllByRole("textbox") as HTMLInputElement[];
    cells[0]!.focus();
    await userEvent.paste("4a2b42x4"); // digits → 42424
    expect(cells.map((c) => c.value).join("")).toBe("42424");
  });

  it("backspace clears the current then steps back", async () => {
    render(<Harness />);
    const cells = screen.getAllByRole("textbox") as HTMLInputElement[];
    cells[0]!.focus();
    await userEvent.keyboard("12");
    // focus now on cell 2 (empty); backspace steps back and clears cell 1
    await userEvent.keyboard("{Backspace}");
    await userEvent.keyboard("{Backspace}");
    expect(cells[0]!.value).toBe("");
  });

  it("shows the error state on the group", () => {
    render(<OtpInput value="12" onChange={() => {}} error />);
    expect(screen.getByRole("group")).toHaveAttribute("data-error", "true");
  });
});
