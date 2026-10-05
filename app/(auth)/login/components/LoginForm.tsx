"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ArrowRight, UserRound, Eye, EyeOff, ShieldCheck, Truck } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending} 
      aria-busy={pending}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100"
    >
      {pending ? (
        <>
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          Sign In
          <ArrowRight className="h-5 w-5" />
        </>
      )}
    </button>
  );
}

export function LoginForm({ action, error }: { action: (formData: FormData) => void; error?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-[500px] rounded-[24px] border border-[#3B82F6]/30 bg-[#0A1A32]/80 p-8 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-fade-in lg:animate-slide-in-left lg:[animation-delay:100ms]">
      {/* Mobile Branding (Visible only on mobile/tablet) */}
      <div className="mb-8 flex flex-col items-center text-center lg:hidden">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#050B18] to-[#0A1930] shadow-[0_0_15px_rgba(37,99,235,0.2)] border border-[#2563EB]/30">
          <Truck className="h-7 w-7 text-[#3B82F6]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Nita Travels</h1>
        <p className="text-sm font-medium text-[#AAB7CC]">Fleet Management System</p>
      </div>

      <div className="mb-8 flex items-center justify-center">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent" />
        <span className="px-4 text-sm font-medium text-[#AAB7CC]">Sign in to your account</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent" />
      </div>

      <form action={action} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium text-[#AAB7CC]">
            Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#718096]">
              <UserRound className="h-5 w-5" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="h-[52px] w-full rounded-[10px] border border-[#2563EB]/20 bg-[#050B18] pl-11 pr-4 text-[15px] text-[#F8FAFC] placeholder:text-[#718096] outline-none transition-all focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[#AAB7CC]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="h-[52px] w-full rounded-[10px] border border-[#2563EB]/20 bg-[#050B18] pl-4 pr-11 text-[15px] text-[#F8FAFC] placeholder:text-[#718096] outline-none transition-all focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
            <button
              type="button"
              className="absolute right-0 top-0 flex h-full items-center justify-center px-3.5 text-[#718096] transition-colors hover:text-[#AAB7CC]"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-4 py-3 text-sm text-[#F8FAFC] animate-slide-up">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B91C1C]/20 text-[#EF4444]">!</span>
            Incorrect username or password. Please try again.
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#2563EB]/10 pt-6 text-[13px] text-[#718096]">
        <ShieldCheck className="h-4 w-4" />
        Secure access to Nita Travels Fleet Management System
      </div>
    </div>
  );
}
