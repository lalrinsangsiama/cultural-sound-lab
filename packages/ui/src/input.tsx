import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "refined" | "search";
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", error = false, type, ...props }, ref) => {
    const baseClasses = "flex w-full text-body transition-all duration-200 ease-refined focus-refined disabled:cursor-not-allowed disabled:opacity-50";
    
    const variants = {
      default: "input-refined px-4 py-3",
      refined: "input-refined px-4 py-3",
      search: "input-refined pl-10 pr-4 py-3",
    };
    
    return (
      <input
        type={type}
        className={cn(
          baseClasses,
          variants[variant],
          error && "border-ruby focus:border-ruby focus:ring-ruby/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

// Search Input with Icon
export function SearchInput({ 
  className, 
  placeholder = "Search...",
  ...props 
}: InputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-silver"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <Input
        variant="search"
        placeholder={placeholder}
        className={className}
        {...props}
      />
    </div>
  );
}

// Form Group
export function FormGroup({
  label,
  error,
  hint,
  required = false,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-small font-medium text-white">
          {label}
          {required && <span className="text-ruby ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-caption text-ash">{hint}</p>
      )}
      {error && (
        <p className="text-caption text-ruby">{error}</p>
      )}
    </div>
  );
}