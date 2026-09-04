"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { OtpInput } from "@/components/otp-input";
import { verifyOtp, resendOtp } from "@/app/login/actions";

const ERROR_COPY: Record<string, string> = {
  wrong_code: "That code didn't match — check and re-enter.",
  expired: "That code expired — resend a new one.",
  verify_failed: "Couldn't verify the code. Try again.",
  no_pending: "Start again from your mobile number.",
};

const RESEND_SECONDS = 24;

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [display, setDisplay] = useState("your number");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const d = sessionStorage.getItem("cl_phone_display");
      if (d) setDisplay(d);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1 && timer.current) clearInterval(timer.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function onVerify(value?: string) {
    const token = value ?? code;
    if (token.length !== 6) return;
    setError(null);
    setLoading(true);
    const res = await verifyOtp(token);
    if (res.ok) {
      router.push("/");
      return;
    }
    setLoading(false);
    setError(res.error);
    setCode(""); // clear for re-entry (cells stay usable)
  }

  async function onResend() {
    const res = await resendOtp();
    if (res.ok) {
      setCode("");
      setError(null);
      setSecondsLeft(RESEND_SECONDS);
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1 && timer.current) clearInterval(timer.current);
          return Math.max(0, s - 1);
        });
      }, 1000);
    }
  }

  return (
    <AppShell
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            We never share your number.
          </div>
          <Cta onClick={() => onVerify()} disabled={code.length !== 6} loading={loading} loadingLabel="Verifying…">
            Verify
          </Cta>
        </>
      }
    >
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/login")}>
          <Icon name="back" size={22} />
        </button>
        <span className="step">Step 1 of 4</span>
      </div>

      <h1 className="h1">Enter the code</h1>
      <div className="said">
        Sent to <b style={{ color: "var(--ink)", fontWeight: 500 }}>{display}</b> ·{" "}
        <button className="linkbtn" type="button" onClick={() => router.push("/login")}>
          Edit
        </button>
      </div>

      <OtpInput value={code} onChange={setCode} onComplete={(v) => onVerify(v)} error={!!error} disabled={loading} />

      {error ? (
        <p role="alert" style={{ fontFamily: "var(--grot)", fontSize: 12, color: "var(--accent)", marginTop: 14 }}>
          {ERROR_COPY[error]}
        </p>
      ) : null}

      <div className="resend">
        {secondsLeft > 0 ? (
          <>
            Didn&rsquo;t get it? Resend in <b>0:{String(secondsLeft).padStart(2, "0")}</b>
          </>
        ) : (
          <>
            Didn&rsquo;t get it?{" "}
            <button className="linkbtn" type="button" style={{ fontSize: 12 }} onClick={onResend}>
              Resend code
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
