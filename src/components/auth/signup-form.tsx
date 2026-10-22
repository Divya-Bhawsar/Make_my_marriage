'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailParam = new URLSearchParams(window.location.search).get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  function validate(): boolean {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length > 120) {
      errors.name = 'Name must not exceed 120 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.details) {
          setFieldErrors(result.error.details);
        }
        setServerError(result.error?.message || 'Failed to create your account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check whether user has an existing wedding, returnUrl, or needs to create one
      const returnUrl =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('returnUrl')
          : null;
      const hasWedding = result.data?.hasWedding ?? false;

      if (returnUrl && returnUrl.startsWith('/')) {
        router.push(returnUrl);
      } else if (!hasWedding) {
        router.push('/onboarding');
      } else {
        router.push('/app');
      }
    } catch {
      setServerError('A network error occurred. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Server Error Alert Banner */}
      {serverError && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn"
        >
          <span className="text-rose-600 font-bold text-sm shrink-0">⚠️</span>
          <span className="leading-relaxed font-medium">{serverError}</span>
        </div>
      )}

      {/* Full Name Field */}
      <div>
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
          Your Full Name
        </label>
        <div className="relative">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g. Rahul Sharma or Divya Verma"
            disabled={isSubmitting}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
              fieldErrors.name
                ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
            }`}
          />
        </div>
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
        )}
      </div>

      {/* Email Address Field */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="you@example.com"
            disabled={isSubmitting}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
              fieldErrors.email
                ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
            }`}
          />
        </div>
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
          Password <span className="text-zinc-400 font-normal lowercase">(minimum 8 characters)</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            placeholder="••••••••"
            disabled={isSubmitting}
            className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
              fieldErrors.password
                ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-brand-crimson px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-crimson/25 hover:bg-brand-crimson/90 focus:outline-hidden focus:ring-2 focus:ring-brand-crimson/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Creating Your Workspace...</span>
          </span>
        ) : (
          <span>Create Wedding Workspace &rarr;</span>
        )}
      </button>

      {/* Switch to Sign In */}
      <div className="pt-4 text-center border-t border-zinc-100">
        <p className="text-xs text-zinc-600">
          Already have a wedding workspace?{' '}
          <Link
            href="/login"
            className="font-bold text-brand-crimson hover:underline decoration-brand-amber/80 transition-colors"
          >
            Sign In here
          </Link>
        </p>
      </div>
    </form>
  );
}
