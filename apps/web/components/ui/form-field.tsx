"use client";

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  success?: string | null;
  description?: string;
  isInvalid?: boolean;
  isValid?: boolean;
  showValidation?: boolean;
  variant?: 'input' | 'textarea';
  rows?: number;
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({
    label,
    error,
    success,
    description,
    isInvalid,
    isValid,
    showValidation = true,
    variant = 'input',
    className,
    id,
    rows = 4,
    ...props
  }, ref) => {
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = showValidation && isInvalid && error;
    const hasSuccess = showValidation && isValid && success;

    const inputClassName = cn(
      "transition-colors duration-200",
      hasError && "border-destructive focus:border-destructive focus:ring-destructive",
      hasSuccess && "border-green-500 focus:border-green-500 focus:ring-green-500",
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={fieldId}
            className={cn(
              hasError && "text-destructive",
              hasSuccess && "text-green-700"
            )}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          {variant === 'textarea' ? (
            <Textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={fieldId}
              rows={rows}
              className={inputClassName}
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={
                hasError ? `${fieldId}-error` : 
                hasSuccess ? `${fieldId}-success` : 
                description ? `${fieldId}-description` : undefined
              }
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <Input
              ref={ref as React.Ref<HTMLInputElement>}
              id={fieldId}
              className={inputClassName}
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={
                hasError ? `${fieldId}-error` : 
                hasSuccess ? `${fieldId}-success` : 
                description ? `${fieldId}-description` : undefined
              }
              {...props}
            />
          )}
          
          {showValidation && (hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {hasError && <AlertCircle className="h-5 w-5 text-destructive" />}
              {hasSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
          )}
        </div>

        {description && !hasError && !hasSuccess && (
          <p id={`${fieldId}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {hasError && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {hasSuccess && (
          <p id={`${fieldId}-success`} className="text-sm text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';