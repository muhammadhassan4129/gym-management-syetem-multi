import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

export const panelClass =
  'rounded-2xl border border-white/10 bg-[#11171d]';

export const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#0b1015] ' +
  'px-3.5 py-3 text-sm text-zinc-100 outline-none ' +
  'placeholder:text-zinc-600 focus:border-lime-300/60 ' +
  'focus:ring-2 focus:ring-lime-300/10 disabled:opacity-50';

export const buttonClass =
  'inline-flex min-h-[42px] items-center justify-center gap-2 ' +
  'rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold ' +
  'text-zinc-950 transition hover:bg-lime-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200';

export const secondaryClass =
  'inline-flex min-h-[42px] items-center justify-center gap-2 ' +
  'rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 ' +
  'text-sm font-medium text-zinc-200 transition hover:bg-white/10 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300';

export function errorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

export function Notice({ children, success = false }) {
  if (!children) return null;

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
        success
          ? 'border-lime-300/20 bg-lime-300/5 text-lime-200'
          : 'border-red-300/20 bg-red-300/5 text-red-200'
      }`}
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Loading({ text = 'Loading workspace...' }) {
  return (
    <div
      role="status"
      className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-zinc-400"
    >
      <Loader2 size={22} className="animate-spin" />
      {text}
    </div>
  );
}

export function Empty({ text = 'No records found.' }) {
  return (
    <div className="p-12 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

export function Badge({ children, good = false }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        good
          ? 'bg-lime-300/10 text-lime-300'
          : 'bg-white/5 text-zinc-400'
      }`}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, icon: Icon }) {
  return (
    <div className={`${panelClass} flex items-center justify-between gap-4 p-5`}>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="mt-3 break-words text-2xl font-bold text-white">
          {value}
        </p>
      </div>

      {Icon && (
        <div className="rounded-xl bg-lime-300/10 p-3 text-lime-300">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}

export const formatMoney = (value) =>
  `PKR ${Number(value || 0).toLocaleString('en-PK', {
    maximumFractionDigits: 2,
  })}`;

export function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/*
fields: [{ name, label, type, required, options, ... }]
onSubmit: async function; throw an error to keep the modal open.
*/
export function FormModal({
  title,
  description,
  fields,
  initialValues = {},
  submitLabel = 'Save changes',
  onSubmit,
  onClose,
}) {
  const dialogRef = useRef(null);
  const lock = useRef(false);

  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();

    if (lock.current) return;

    lock.current = true;
    setSaving(true);
    setError('');

    try {
      await onSubmit(values);
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="form-modal-title"
      aria-describedby={description ? 'form-modal-description' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#11171d] p-0 text-zinc-100 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
        <div>
          <h2 id="form-modal-title" className="text-xl font-bold">
            {title}
          </h2>

          {description && (
            <p
              id="form-modal-description"
              className="mt-2 text-sm leading-6 text-zinc-400"
            >
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close dialog"
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 disabled:opacity-40"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5 p-6">
        <Notice>{error}</Notice>

        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`modal-${field.name}`}
              className="mb-2 block text-xs font-semibold text-zinc-300"
            >
              {field.label}
              {field.required && ' *'}
            </label>

            {field.options ? (
              <select
                id={`modal-${field.name}`}
                value={values[field.name] ?? ''}
                required={field.required}
                disabled={saving}
                onChange={(event) =>
                  setValues((old) => ({
                    ...old,
                    [field.name]: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Choose an option</option>

                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`modal-${field.name}`}
                type={field.type || 'text'}
                value={values[field.name] ?? ''}
                required={field.required}
                min={field.min}
                max={field.max}
                step={field.step}
                minLength={field.minLength}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                autoComplete={
                  field.type === 'password' ? 'new-password' : 'off'
                }
                disabled={saving}
                onChange={(event) =>
                  setValues((old) => ({
                    ...old,
                    [field.name]: event.target.value,
                  }))
                }
                className={inputClass}
              />
            )}

            {field.hint && (
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {field.hint}
              </p>
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={secondaryClass}
          >
            Cancel
          </button>

          <button disabled={saving} className={buttonClass}>
            {saving && <Loader2 size={17} className="animate-spin" />}
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}