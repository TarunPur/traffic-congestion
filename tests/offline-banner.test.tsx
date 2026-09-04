import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfflineBanner } from "@/components/offline-banner";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
}

describe("OfflineBanner", () => {
  afterEach(() => {
    setOnline(true);
    vi.restoreAllMocks();
  });

  it("renders nothing while online", () => {
    setOnline(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an honest last-known-times notice when offline", () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toHaveTextContent(/last times we loaded/i);
    expect(screen.getByText(/may be out of date/i)).toBeInTheDocument();
  });

  it("reacts to the online/offline events", () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
