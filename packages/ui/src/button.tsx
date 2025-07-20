import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "obsidian" | "secondary" | "gold" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "obsidian", size = "md", loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 ease-refined focus-refined disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      obsidian: "btn-obsidian",
      secondary: "btn-secondary", 
      gold: "btn-gold",
      ghost: "bg-transparent text-white hover:bg-charcoal border-none",
      link: "bg-transparent text-gold hover:text-champagne underline-offset-4 hover:underline border-none p-0 h-auto",
    };
    
    const sizes = {
      sm: "h-9 px-3 text-small rounded-small",
      md: "h-11 px-6 text-body rounded-small",
      lg: "h-13 px-8 text-h4 rounded-medium",
      icon: "h-11 w-11 rounded-small",
    };
    
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && "cursor-wait",
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Audio Control Button
export function PlayButton({ 
  isPlaying = false, 
  onToggle,
  size = "md",
  className,
  ...props 
}: {
  isPlaying?: boolean;
  onToggle?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };
  
  return (
    <Button
      variant="gold"
      className={cn(
        "rounded-full",
        sizes[size],
        "hover:animate-gold-pulse",
        className
      )}
      onClick={onToggle}
      {...props}
    >
      {isPlaying ? (
        <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className={cn(iconSizes[size], "ml-0.5")} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      )}
    </Button>
  );
}

// Icon Button
export function IconButton({
  icon,
  active = false,
  size = "md",
  className,
  children,
  ...props
}: {
  icon: React.ReactNode;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  
  return (
    <Button
      variant="ghost"
      className={cn(
        "rounded-small border border-iron hover:border-gold",
        sizes[size],
        active && "bg-charcoal border-gold text-gold",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
}