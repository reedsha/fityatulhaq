"use client";

import { useCallback, useState, type FormEvent } from "react";

import { resolveUnknownError, type FieldError } from "@/lib/errorMessages";

export type AuthFormValues = Record<string, string>;
export type AuthFormErrors = Record<string, string>;

/** Key used for errors that belong to the form as a whole, not one input. */
export const FORM_ERROR_KEY = "form";

export interface UseAuthFormOptions {
  initialValues: AuthFormValues;
  /** Per-field validation run on blur. Return "" when the value is acceptable. */
  validateField?: (name: string, value: string, values: AuthFormValues) => string;
  /** Whole-form validation run on submit — the authoritative gate. */
  validateAll?: (values: AuthFormValues) => AuthFormErrors;
}

export interface UseAuthFormResult {
  fields: AuthFormValues;
  errors: AuthFormErrors;
  isSubmitting: boolean;
  setField: (name: string, value: string) => void;
  handleBlur: (name: string) => void;
  setFieldError: (name: string, message: string) => void;
  setFormError: (message: string) => void;
  clearErrors: () => void;
  applyApiError: (error: unknown) => FieldError;
  handleSubmit: (
    onValid: (values: AuthFormValues) => Promise<void>,
  ) => (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Local form state for the auth pages: values, per-field errors and a submit
 * flag. Validation always runs before the API call, and an error thrown by the
 * API layer is routed to the field that caused it.
 *
 * Note: this is a project hook, not React 19's `useFormState` — the app runs on
 * React 18, and the React hook has a different (server-action) contract.
 */
export function useAuthForm(options: UseAuthFormOptions): UseAuthFormResult {
  const { initialValues, validateField, validateAll } = options;

  const [fields, setFields] = useState<AuthFormValues>(initialValues);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = useCallback((name: string): void => {
    setErrors((current) => {
      if (!(name in current)) {
        return current;
      }

      const next: AuthFormErrors = { ...current };
      delete next[name];

      return next;
    });
  }, []);

  const setFieldError = useCallback((name: string, message: string): void => {
    setErrors((current) => ({ ...current, [name]: message }));
  }, []);

  const setFormError = useCallback(
    (message: string): void => {
      setFieldError(FORM_ERROR_KEY, message);
    },
    [setFieldError],
  );

  const clearErrors = useCallback((): void => {
    setErrors({});
  }, []);

  const setField = useCallback(
    (name: string, value: string): void => {
      setFields((current) => ({ ...current, [name]: value }));
      clearError(name);
    },
    [clearError],
  );

  const handleBlur = useCallback(
    (name: string): void => {
      if (validateField === undefined) {
        return;
      }

      const message = validateField(name, fields[name] ?? "", fields);

      if (message.length === 0) {
        clearError(name);
        return;
      }

      setFieldError(name, message);
    },
    [clearError, fields, setFieldError, validateField],
  );

  const applyApiError = useCallback((error: unknown): FieldError => {
    const resolved = resolveUnknownError(error);
    setErrors((current) => ({ ...current, [resolved.field]: resolved.message }));

    return resolved;
  }, []);

  const handleSubmit = useCallback(
    (onValid: (values: AuthFormValues) => Promise<void>) =>
      (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        // Requirement: validate before the API call — never send malformed data.
        const nextErrors = validateAll === undefined ? {} : validateAll(fields);

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          return;
        }

        setErrors({});
        setIsSubmitting(true);

        void onValid(fields)
          .catch((error: unknown): void => {
            applyApiError(error);
          })
          .finally((): void => {
            setIsSubmitting(false);
          });
      },
    [applyApiError, fields, validateAll],
  );

  return {
    fields,
    errors,
    isSubmitting,
    setField,
    handleBlur,
    setFieldError,
    setFormError,
    clearErrors,
    applyApiError,
    handleSubmit,
  };
}
