import { type ReactNode } from "react";
import { cn } from "./utils";

interface CardProps {
  title?: string;
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: "default" | "refined" | "premium" | "glass";
  hoverable?: boolean;
}

export function Card({
  title,
  children,
  href,
  className,
  variant = "default",
  hoverable = true,
}: CardProps) {
  const baseClasses = "rounded-medium border transition-all duration-200 ease-refined";
  
  const variants = {
    default: "bg-charcoal border-slate shadow-subtle",
    refined: "card-refined",
    premium: "card-premium", 
    glass: "glass-refined",
  };
  
  const hoverClasses = hoverable ? "hover-lift" : "";
  
  const cardClasses = cn(
    baseClasses,
    variants[variant],
    hoverClasses,
    className
  );

  const content = (
    <div className="p-6">
      {title && (
        <h3 className="text-h4 font-medium text-white mb-3 group-hover:text-gold transition-colors">
          {title}
          {href && (
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1 text-gold">
              →
            </span>
          )}
        </h3>
      )}
      <div className="text-body text-ash group-hover:text-silver transition-colors">
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        className={cn("group block", cardClasses)}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
}

// Audio-specific card variant
export function AudioCard({
  title,
  artist,
  duration,
  culture,
  isPlaying = false,
  onPlay,
  children,
  className,
}: {
  title: string;
  artist: string;
  duration: string;
  culture: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-refined group cursor-pointer", className)} onClick={onPlay}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-h4 font-medium text-white truncate group-hover:text-gold transition-colors">
              {title}
            </h3>
            <p className="text-small text-silver truncate">{artist}</p>
            <p className="text-caption text-ash">{culture}</p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className="text-caption text-ash">{duration}</span>
            <button className="w-10 h-10 rounded-full bg-gold text-obsidian flex items-center justify-center hover:bg-champagne transition-colors focus-refined">
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Waveform Visualization */}
        <div className="flex items-center gap-0.5 h-8 mb-4">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-slate rounded-sm transition-all duration-100",
                isPlaying ? "animate-waveform" : ""
              )}
              style={{
                height: `${Math.random() * 70 + 10}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
        
        {children}
      </div>
    </div>
  );
}

// Studio Panel Card
export function StudioCard({ 
  children, 
  className 
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("studio-panel", className)}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
