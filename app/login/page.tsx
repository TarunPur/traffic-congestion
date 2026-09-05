"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClearingSplash } from "@/components/clearing-splash";
import { Cta } from "@/components/controls";
import { FilmStrip } from "@/components/film-strip";
import { formatNationalMobile, isValidMobile } from "@/lib/phone";
import { sendOtp } from "@/app/login/actions";

const MODE_PHOTOS = ["/img/mode-metro.jpg", "/img/mode-bus.jpg", "/img/mode-auto.jpg", "/img/mode-walk.jpg"];

const ERROR_COPY: Record<string, string> = {
  invalid: "Enter a 10-digit mobile number.",
  send_failed: "Couldn't send the code. Try again.",
  rate_limited: "Too many tries. Wait a minute and resend.",
};

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = isValidMobile(phone);

  async function onContinue() {
    if (!valid) {
      setError("invalid");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await sendOtp(phone);
    if (res.ok) {
      try {
        sessionStorage.setItem("cl_phone_display", `+91 ${formatNationalMobile(phone)}`);
      } catch {
        /* private mode — non-fatal */
      }
      router.push("/verify");
      return;
    }
    setLoading(false);
    setError(res.error);
  }

  return (
    <AppShell
      foot={
        <>
          <Cta onClick={onContinue} disabled={!valid} loading={loading} loadingLabel="Sending code…">
            Continue
          </Cta>
        </>
      }
    >
      <div className="strip">
        <FilmStrip images={MODE_PHOTOS} alt="Metro, bus, auto and walk" />
      </div>
      <div style={{ marginTop: 26 }}>
        <ClearingSplash />
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="lab" style={{ textAlign: "center" }}>
          Mobile number
        </div>
        <span
          className="field"
          data-error={error === "invalid" || undefined}
          style={{ maxWidth: 270, marginLeft: "auto", marginRight: "auto" }}
        >
          <span className="prefix">+91</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={11}
            placeholder="98xxx xxxxx"
            aria-label="Mobile number"
            aria-invalid={error === "invalid" || undefined}
            style={{ textAlign: "center" }}
            value={phone}
            onChange={(e) => {
              setPhone(formatNationalMobile(e.target.value));
              if (error) setError(null);
            }}
            onBlur={() => {
              if (phone.length > 0 && !valid) setError("invalid");
            }}
          />
        </span>

        {error ? (
          <p
            role="alert"
            style={{
              fontFamily: "var(--grot)",
              fontSize: 12,
              color: "var(--accent)",
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {ERROR_COPY[error]}
          </p>
        ) : null}

        <p
          style={{
            fontFamily: "var(--grot)",
            fontSize: 10.5,
            color: "var(--grey2)",
            lineHeight: 1.5,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          We&rsquo;ll send a one-time code to verify it.
          <br />
          By continuing you agree to the Terms and Privacy&nbsp;Policy.
        </p>
      </div>
    </AppShell>
  );
}
