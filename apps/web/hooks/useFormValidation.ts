import { useState, useCallback, useEffect } from 'react';

export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
}

export interface FieldValidation {
  isValid: boolean;
  error: string | null;
  touched: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validationRules: Partial<Record<keyof T, ValidationRule>>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  onSubmit?: (values: T) => Promise<void> | void;
}

export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  validationRules,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  onSubmit,
}: UseFormValidationOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {} as Record<keyof T, string | null>,
    touched: {} as Record<keyof T, boolean>,
    isValid: false,
    isSubmitting: false,
    submitCount: 0,
  });

  const [debounceTimeouts, setDebounceTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback((name: keyof T, value: unknown): string | null => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rules.message || `${String(name)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) return null;

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `${String(name)} must be at least ${rules.minLength} characters`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `${String(name)} must be no more than ${rules.maxLength} characters`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.message || `${String(name)} format is invalid`;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return rules.message || `${String(name)} must be at least ${rules.min}`;
      }

      if (rules.max !== undefined && value > rules.max) {
        return rules.message || `${String(name)} must be no more than ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [validationRules]);

  const validateForm = useCallback((values: T): Record<keyof T, string | null> => {
    const errors = {} as Record<keyof T, string | null>;
    
    Object.keys(values).forEach((key) => {
      const fieldName = key as keyof T;
      errors[fieldName] = validateField(fieldName, values[fieldName]);
    });

    return errors;
  }, [validateField]);

  const setValue = useCallback((name: keyof T, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
    }));

    if (validateOnChange) {
      // Clear existing timeout for this field
      if (debounceTimeouts[String(name)]) {
        clearTimeout(debounceTimeouts[String(name)]);
      }

      // Set new timeout for validation
      const timeoutId = setTimeout(() => {
        const error = validateField(name, value);
        setFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, [name]: error },
        }));
      }, debounceMs);

      setDebounceTimeouts(prev => ({
        ...prev,
        [String(name)]: timeoutId,
      }));
    }
  }, [validateField, validateOnChange, debounceMs, debounceTimeouts]);

  const setTouched = useCallback((name: keyof T, touched = true) => {
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [name]: touched },
    }));

    if (validateOnBlur && touched) {
      const error = validateField(name, formState.values[name]);
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error },
      }));
    }
  }, [validateField, validateOnBlur, formState.values]);

  const setError = useCallback((name: keyof T, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {} as Record<keyof T, string | null>,
      touched: {} as Record<keyof T, boolean>,
      isValid: false,
      isSubmitting: false,
      submitCount: 0,
    });

    // Clear all debounce timeouts
    Object.values(debounceTimeouts).forEach(clearTimeout);
    setDebounceTimeouts({});
  }, [initialValues, debounceTimeouts]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
    }));

    try {
      // Validate all fields
      const errors = validateForm(formState.values);
      const hasErrors = Object.values(errors).some(error => error !== null);

      setFormState(prev => ({
        ...prev,
        errors,
        touched: Object.keys(prev.values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<keyof T, boolean>
        ),
        isValid: !hasErrors,
      }));

      if (!hasErrors && onSubmit) {
        await onSubmit(formState.values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [formState.values, validateForm, onSubmit]);

  // Update isValid when errors change
  useEffect(() => {
    const hasErrors = Object.values(formState.errors).some(error => error !== null);
    setFormState(prev => ({
      ...prev,
      isValid: !hasErrors,
    }));
  }, [formState.errors]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts).forEach(clearTimeout);
    };
  }, [debounceTimeouts]);

  const getFieldProps = useCallback((name: keyof T) => ({
    value: formState.values[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(name, e.target.value);
    },
    onBlur: () => setTouched(name, true),
    error: formState.touched[name] ? formState.errors[name] : null,
    isInvalid: formState.touched[name] && !!formState.errors[name],
  }), [formState, setValue, setTouched]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    submitCount: formState.submitCount,
    setValue,
    setTouched,
    setError,
    resetForm,
    handleSubmit,
    getFieldProps,
    validateField,
  };
}