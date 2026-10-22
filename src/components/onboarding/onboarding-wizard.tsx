'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OnboardingWizardProps {
  initialUserName?: string;
}

export function OnboardingWizard({ initialUserName }: OnboardingWizardProps) {
  const router = useRouter();

  // Wizard Step: 1 = Couple, 2 = Date & Venue, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState('');

  // UI States
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Suggested quick cities
  const popularCities = ['Jaipur', 'Udaipur', 'Goa', 'Delhi NCR', 'Mumbai', 'Bengaluru'];

  // Calculate live countdown preview if date is selected
  const daysToGo = React.useMemo(() => {
    if (!weddingDate) return null;
    const target = new Date(weddingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [weddingDate]);

  // Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!groomName.trim()) {
      errors.groomName = "Please enter the groom's name";
    }
    if (!brideName.trim()) {
      errors.brideName = "Please enter the bride's name";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!weddingDate) {
      errors.weddingDate = 'Please select the auspicious wedding date';
    } else {
      const selected = new Date(weddingDate);
      if (isNaN(selected.getTime())) {
        errors.weddingDate = 'Invalid wedding date';
      }
    }
    if (!city.trim()) {
      errors.city = 'Please enter the wedding city or destination';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setSubmitError('');
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        // Pre-fill default title if empty
        if (!title.trim() && groomName && brideName) {
          setTitle(`${groomName} & ${brideName}'s Wedding`);
        }
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    setSubmitError('');
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/wedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brideName: brideName.trim(),
          groomName: groomName.trim(),
          weddingDate,
          title: title.trim() || `${groomName.trim()} & ${brideName.trim()}'s Wedding`,
          location: city.trim()
            ? {
                city: city.trim(),
                formattedAddress: city.trim(),
              }
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // User already has a wedding workspace
          router.push('/app');
          return;
        }
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to create wedding workspace');
      }

      setIsSuccess(true);
      // Wait momentarily so couple sees celebratory feedback
      setTimeout(() => {
        router.push('/app');
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-xs mx-auto">
          {[
            { num: 1, label: 'The Couple' },
            { num: 2, label: 'Date & City' },
            { num: 3, label: 'Launch' },
          ].map((item, idx) => (
            <React.Fragment key={item.num}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (item.num < step) setStep(item.num as 1 | 2 | 3);
                  }}
                  disabled={item.num > step}
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === item.num
                      ? 'bg-brand-crimson text-white shadow-md ring-4 ring-brand-crimson/15'
                      : step > item.num
                      ? 'bg-brand-emerald text-white cursor-pointer'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {step > item.num ? '✓' : item.num}
                </button>
                <span className="text-[11px] font-medium text-zinc-600 mt-1">{item.label}</span>
              </div>
              {idx < 2 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    step > idx + 1 ? 'bg-brand-emerald' : 'bg-zinc-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Global Error Banner */}
      {submitError && (
        <div
          role="alert"
          className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-3"
        >
          <span className="text-base leading-none text-rose-600">⚠️</span>
          <div className="flex-1 font-medium">{submitError}</div>
        </div>
      )}

      {/* Success Celebration Overlay */}
      {isSuccess ? (
        <div className="text-center py-10 space-y-4 animate-in fade-in duration-500">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl shadow-inner">
            ✨
          </div>
          <h2 className="text-2xl font-serif font-bold text-zinc-900">
            Shubh Aarambh! Congratulations!
          </h2>
          <p className="text-sm text-zinc-600 max-w-sm mx-auto">
            Your wedding workspace for{' '}
            <strong className="text-brand-crimson">
              {groomName} & {brideName}
            </strong>{' '}
            has been created. Launching your command center...
          </p>
          <div className="pt-2">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-crimson border-t-transparent" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* STEP 1: The Couple */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center pb-2">
                <h2 className="text-lg font-serif font-bold text-zinc-900">Who is getting married?</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Enter the auspicious names of the couple
                </p>
              </div>

              <div>
                <label
                  htmlFor="groomName"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Groom&apos;s Name <span className="text-brand-crimson">*</span>
                </label>
                <input
                  id="groomName"
                  type="text"
                  value={groomName}
                  onChange={(e) => {
                    setGroomName(e.target.value);
                    if (fieldErrors.groomName)
                      setFieldErrors((prev) => ({ ...prev, groomName: '' }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
                    fieldErrors.groomName
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
                  }`}
                />
                {fieldErrors.groomName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.groomName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="brideName"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Bride&apos;s Name <span className="text-brand-crimson">*</span>
                </label>
                <input
                  id="brideName"
                  type="text"
                  value={brideName}
                  onChange={(e) => {
                    setBrideName(e.target.value);
                    if (fieldErrors.brideName)
                      setFieldErrors((prev) => ({ ...prev, brideName: '' }));
                  }}
                  placeholder="e.g. Divya Verma"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
                    fieldErrors.brideName
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
                  }`}
                />
                {fieldErrors.brideName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.brideName}</p>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-crimson to-amber-700 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Next: Date & Venue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Date & Location */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center pb-2">
                <h2 className="text-lg font-serif font-bold text-zinc-900">
                  When and where is the celebration?
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Set the main wedding date and destination
                </p>
              </div>

              <div>
                <label
                  htmlFor="weddingDate"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Wedding Date <span className="text-brand-crimson">*</span>
                </label>
                <input
                  id="weddingDate"
                  type="date"
                  value={weddingDate}
                  onChange={(e) => {
                    setWeddingDate(e.target.value);
                    if (fieldErrors.weddingDate)
                      setFieldErrors((prev) => ({ ...prev, weddingDate: '' }));
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
                    fieldErrors.weddingDate
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
                  }`}
                />
                {fieldErrors.weddingDate && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.weddingDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  City or Destination <span className="text-brand-crimson">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden transition-all ${
                    fieldErrors.city
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-zinc-300 bg-white hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.city}</p>
                )}

                {/* Popular City Pills */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-zinc-400 mr-1">Popular:</span>
                  {popularCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCity(c);
                        if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                      }}
                      className="rounded-lg bg-zinc-100 hover:bg-brand-sand/50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-crimson to-amber-700 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Next: Final Review &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Title & Review */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center pb-1">
                <h2 className="text-lg font-serif font-bold text-zinc-900">
                  Ready to launch your workspace!
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Confirm your details and launch your command center
                </p>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-2xl border-2 border-brand-sand bg-gradient-to-b from-brand-ivory/80 to-amber-50/50 p-4 shadow-sm text-center">
                <div className="text-[11px] font-bold tracking-widest uppercase text-brand-gold mb-1">
                  Workspace Preview
                </div>
                <div className="text-xl font-serif font-bold text-zinc-900 flex items-center justify-center gap-1.5">
                  <span>{groomName}</span>
                  <span className="text-red-500 text-sm">❤️</span>
                  <span>{brideName}</span>
                </div>
                <div className="text-xs text-zinc-600 mt-1">
                  {weddingDate || 'Date TBD'} • {city || 'Destination TBD'}
                </div>
                {daysToGo !== null && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-crimson/10 px-3 py-1 text-xs font-semibold text-brand-crimson">
                    <span>⏳</span>
                    <span>{daysToGo} Days to Go</span>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="weddingTitle"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Celebration Title (Optional)
                </label>
                <input
                  id="weddingTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`${groomName} & ${brideName}'s Wedding`}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 hover:border-zinc-400 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15 focus:outline-hidden transition-all"
                />
                <p className="mt-1 text-[11px] text-zinc-400">
                  You can change this later in settings anytime.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-crimson via-brand-crimson to-amber-700 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating Workspace...</span>
                    </>
                  ) : (
                    <span>Launch Wedding Workspace ✨</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
