"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  requestCandidateLogin,
  verifyCandidateLogin,
} from "@/app/jobs/actions";
import { Field, inputClass, buttonClass } from "./forms";

export function LoginForm({ next = "/jobs/account" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const resendAt = useRef(0);

  useEffect(() => {
    if (!sentTo) return;
    codeInput.current?.focus();
    const timer = setInterval(() => {
      setSeconds(
        Math.max(0, Math.ceil((resendAt.current - Date.now()) / 1000)),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [sentTo]);

  function sendCode() {
    if (busy.current || (sentTo && seconds > 0)) return;
    busy.current = true;
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const address = sentTo || email.trim().toLowerCase();
        const result = await requestCandidateLogin(address, next);
        if (result.error) setError(result.error);
        else {
          setSentTo(address);
          setCode("");
          resendAt.current = Date.now() + 60_000;
          setSeconds(60);
          setMessage(
            "Kode verifikasi sudah diminta. Periksa kotak masuk dan spam.",
          );
          codeInput.current?.focus();
        }
      } catch {
        setError(
          "Tidak dapat mengirim kode. Periksa koneksi Anda dan coba lagi.",
        );
      } finally {
        busy.current = false;
      }
    });
  }

  function verifyCode(value: string) {
    if (busy.current || value.length !== 6) return;
    busy.current = true;
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await verifyCandidateLogin(sentTo, value, next);
        if (result?.error) setError(result.error);
      } catch {
        setError(
          "Tidak dapat memverifikasi kode. Periksa koneksi Anda dan coba lagi.",
        );
      } finally {
        busy.current = false;
      }
    });
  }

  return (
    <form
      className="space-y-4"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (sentTo) verifyCode(code);
        else sendCode();
      }}
    >
      {sentTo ? (
        <>
          <p className="break-words text-sm text-muted-foreground">
            Masukkan kode 6 digit yang dikirim ke{" "}
            <strong className="text-foreground">{sentTo}</strong>.
          </p>
          <Field label="Kode verifikasi">
            <input
              ref={codeInput}
              required
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              value={code}
              readOnly={pending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : "otp-help"}
              className={`${inputClass} text-center font-mono text-2xl tracking-[0.45em]`}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
                setError("");
                if (value.length === 6) verifyCode(value);
              }}
              onPaste={(event) => {
                event.preventDefault();
                if (busy.current) return;
                const value = event.clipboardData
                  .getData("text")
                  .replace(/\D/g, "")
                  .slice(0, 6);
                setCode(value);
                setError("");
                if (value.length === 6) verifyCode(value);
              }}
            />
          </Field>
          <p id="otp-help" className="text-sm text-muted-foreground">
            Kode akan diverifikasi otomatis setelah 6 digit terisi.
          </p>
        </>
      ) : (
        <>
          <Field label="Alamat email">
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              readOnly={pending}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            Tidak perlu kata sandi. Kami akan mengirim kode 6 digit untuk
            memverifikasi email Anda.
          </p>
        </>
      )}
      <button
        disabled={pending || Boolean(sentTo && code.length !== 6)}
        className={buttonClass}
      >
        {pending
          ? "Memproses…"
          : sentTo
            ? "Verifikasi & masuk"
            : "Kirim kode verifikasi"}
      </button>
      {sentTo && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <button
            type="button"
            disabled={pending || seconds > 0}
            onClick={sendCode}
            className="min-h-11 text-primary underline underline-offset-4 disabled:opacity-50"
          >
            {seconds > 0
              ? `Kirim ulang dalam ${seconds} dtk`
              : "Kirim ulang kode"}
          </button>
          <button
            type="button"
            disabled={pending}
            className="min-h-11 text-muted-foreground underline underline-offset-4 disabled:opacity-50"
            onClick={() => {
              setSentTo("");
              setCode("");
              setError("");
              setMessage("");
            }}
          >
            Ubah email
          </button>
        </div>
      )}
      {error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-xl border border-red-500/30 p-3 text-sm text-red-500"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-accent p-3 text-sm text-accent-foreground"
        >
          {message}
        </p>
      )}
    </form>
  );
}
