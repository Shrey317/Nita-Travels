"use client";

import { useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ArrowRight, UserRound, LockKeyhole, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "../login.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className={styles.submit}>
      {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
      <span aria-live="polite">{pending ? "Signing in…" : "Sign In"}</span>
      {!pending ? <ArrowRight aria-hidden="true" /> : null}
    </Button>
  );
}

type FieldErrors = { username?: string; password?: string };

export function LoginForm({ action, error }: { action: (formData: FormData) => void | Promise<void>; error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const submitting = useRef(false);

  function validate(event: FormEvent<HTMLFormElement>) {
    if (submitting.current) {
      event.preventDefault();
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const errors: FieldErrors = {};
    if (!String(data.get("username") ?? "").trim()) errors.username = "Enter your username.";
    if (!String(data.get("password") ?? "")) errors.password = "Enter your password.";
    setFieldErrors(errors);
    const firstInvalid = errors.username ? "username" : errors.password ? "password" : null;
    if (firstInvalid) {
      event.preventDefault();
      (form.elements.namedItem(firstInvalid) as HTMLInputElement).focus();
      return;
    }
    // Guard the interval before React's pending state disables the submit button.
    submitting.current = true;
  }

  async function submit(formData: FormData) {
    try {
      await action(formData);
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className={styles.card} aria-labelledby="sign-in-heading">
      <div className={styles.cardHeader}>
        <h2 id="sign-in-heading" className={styles.cardHeading}>Sign in to your account</h2>
        <p>Access your fleet operations dashboard.</p>
      </div>

      <form action={submit} onSubmit={validate} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor="username" className={styles.label}>Username</label>
          <div className={styles.inputWrap}>
            <UserRound className={styles.inputIcon} aria-hidden="true" />
            <input
              id="username" name="username" type="text" autoComplete="username"
              autoCapitalize="none" spellCheck={false} required
              className={styles.input}
              aria-invalid={Boolean(fieldErrors.username || error)}
              aria-describedby={fieldErrors.username ? "username-error" : error ? "login-error" : undefined}
              onChange={() => setFieldErrors(previous => ({ ...previous, username: undefined }))}
            />
          </div>
          <p id="username-error" className={styles.fieldError} aria-live="polite">{fieldErrors.username}</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <div className={styles.inputWrap}>
            <LockKeyhole className={styles.inputIcon} aria-hidden="true" />
            <input
              id="password" name="password" type={showPassword ? "text" : "password"}
              autoComplete="current-password" required className={styles.input}
              aria-invalid={Boolean(fieldErrors.password || error)}
              aria-describedby={fieldErrors.password ? "password-error" : error ? "login-error" : undefined}
              onChange={() => setFieldErrors(previous => ({ ...previous, password: undefined }))}
            />
            <button
              type="button" className={styles.toggle}
              onClick={() => setShowPassword(previous => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword} aria-controls="password"
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className={styles.authError}>
          <p id="password-error" aria-live="polite">{fieldErrors.password}</p>
          {error && !fieldErrors.password ? <p id="login-error" role="alert">Incorrect username or password. Please try again.</p> : null}
        </div>
        <SubmitButton />
      </form>
      <a href="/register" className="mt-4 inline-block text-primary underline">Request a manager account</a>

      <p className={styles.security}>
        <ShieldCheck aria-hidden="true" />
        <span>Secure access to the Nita Travels Fleet Management System</span>
      </p>
    </section>
  );
}
