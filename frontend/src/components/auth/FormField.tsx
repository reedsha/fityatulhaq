"use client";

import type { ChangeEvent, ReactElement } from "react";

export type FieldInputMode = "text" | "email" | "tel" | "numeric";

export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  value: string;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: FieldInputMode;
  maxLength?: number;
}

const BASE_INPUT_CLASSES =
  "mt-1 block w-full rounded-lg border px-3 py-2 text-body-sm shadow-card transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-ink-50";

const NORMAL_INPUT_CLASSES =
  "border-ink-300 focus:border-brand-600 focus:ring-brand-200";

const ERROR_INPUT_CLASSES = "border-state-error-300 focus:border-state-error-600 focus:ring-state-error-200";

/**
 * Labelled input that renders its validation message directly above the input
 * it belongs to (requirement 9), wired up for assistive technology.
 */
export function FormField(props: FormFieldProps): ReactElement {
  const {
    id,
    name,
    label,
    type,
    value,
    onChange,
    onBlur,
    error,
    hint,
    required = false,
    optional = false,
    disabled = false,
    autoComplete,
    placeholder,
    inputMode,
    maxLength,
  } = props;

  const hasError = error !== undefined && error.length > 0;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedByIds: string[] = [];

  if (hasError) {
    describedByIds.push(errorId);
  }

  if (hint !== undefined) {
    describedByIds.push(hintId);
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(name, event.target.value);
  };

  const handleBlur = (): void => {
    if (onBlur !== undefined) {
      onBlur(name);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-body-sm font-medium text-ink-700">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-ink-500">(ไม่บังคับ)</span>
        ) : null}
      </label>

      {hasError ? (
        <p id={errorId} className="mt-1 text-body-sm text-state-error-600">
          {error}
        </p>
      ) : null}

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={hasError}
        aria-describedby={describedByIds.length > 0 ? describedByIds.join(" ") : undefined}
        className={`${BASE_INPUT_CLASSES} ${hasError ? ERROR_INPUT_CLASSES : NORMAL_INPUT_CLASSES}`}
      />

      {hint !== undefined ? (
        <p id={hintId} className="mt-1 text-caption text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
