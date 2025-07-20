import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";
import { PlayButton, IconButton } from "./button";

// Audio Player Component
export function AudioPlayer({
  title,
  artist,
  duration = "0:00",
  currentTime = "0:00",
  isPlaying = false,
  isLoading = false,
  progress = 0,
  volume = 1,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  className,
}: {
  title: string;
  artist: string;
  duration?: string;
  currentTime?: string;
  isPlaying?: boolean;
  isLoading?: boolean;
  progress?: number; // 0-100
  volume?: number; // 0-1
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (progress: number) => void;
  onVolumeChange?: (volume: number) => void;
  className?: string;
}) {
  const handlePlayToggle = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  return (
    <div className={cn("studio-panel", className)}>
      <div className="p-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 mb-6">
          <PlayButton
            isPlaying={isPlaying}
            onToggle={handlePlayToggle}
            disabled={isLoading}
            size="lg"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-h4 font-medium text-white truncate">{title}</h3>
            <p className="text-small text-silver truncate">{artist}</p>
          </div>
          
          <div className="text-caption text-ash font-mono">
            {currentTime} / {duration}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div 
            className="relative h-2 bg-slate rounded-small cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const progress = ((e.clientX - rect.left) / rect.width) * 100;
              onSeek?.(Math.max(0, Math.min(100, progress)));
            }}
          >
            <div
              className="audio-progress rounded-small"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              }
              size="sm"
            />
            <IconButton
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              size="sm"
            />
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <IconButton
              icon={
                volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )
              }
              size="sm"
              onClick={() => onVolumeChange?.(volume === 0 ? 1 : 0)}
            />
            
            <div className="w-24 h-2 bg-slate rounded-small relative cursor-pointer group">
              <div
                className="audio-progress rounded-small"
                style={{ width: `${volume * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${volume * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Waveform Visualizer
export function Waveform({
  data,
  progress = 0,
  height = 64,
  bars = 50,
  isPlaying = false,
  className,
}: {
  data?: number[];
  progress?: number; // 0-100
  height?: number;
  bars?: number;
  isPlaying?: boolean;
  className?: string;
}) {
  // Generate random data if none provided
  const waveformData = data || Array.from({ length: bars }, () => Math.random());
  
  return (
    <div 
      className={cn("flex items-end gap-1", className)}
      style={{ height: `${height}px` }}
    >
      {waveformData.map((amplitude, index) => {
        const isActive = (index / bars) * 100 <= progress;
        const barHeight = Math.max(amplitude * height * 0.8, 2);
        
        return (
          <div
            key={index}
            className={cn(
              "flex-1 rounded-sm transition-all duration-100",
              isActive 
                ? "bg-gold animate-waveform" 
                : "bg-slate",
              isPlaying && "animate-waveform"
            )}
            style={{
              height: `${barHeight}px`,
              animationDelay: `${index * 0.05}s`,
            }}
          />
        );
      })}
    </div>
  );
}

// VU Meter
export function VUMeter({
  level = 0, // 0-100
  channels = 2,
  className,
}: {
  level?: number;
  channels?: number;
  className?: string;
}) {
  return (
    <div className={cn("vu-meter", className)}>
      <div className="flex gap-2">
        {Array.from({ length: channels }).map((_, channelIndex) => (
          <div key={channelIndex} className="flex-1">
            <div className="flex gap-0.5 h-4">
              {Array.from({ length: 20 }).map((_, segmentIndex) => {
                const segmentThreshold = (segmentIndex / 19) * 100;
                const isActive = level >= segmentThreshold;
                
                let segmentColor = "bg-emerald";
                if (segmentIndex > 15) segmentColor = "bg-ruby";
                else if (segmentIndex > 12) segmentColor = "bg-amber";
                
                return (
                  <div
                    key={segmentIndex}
                    className={cn(
                      "flex-1 rounded-micro transition-all duration-100",
                      isActive ? segmentColor : "bg-steel"
                    )}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Spectrum Analyzer
export function SpectrumAnalyzer({
  data,
  bars = 32,
  height = 96,
  isActive = false,
  className,
}: {
  data?: number[];
  bars?: number;
  height?: number;
  isActive?: boolean;
  className?: string;
}) {
  const spectrumData = data || Array.from({ length: bars }, () => Math.random() * 0.8);
  
  return (
    <div className={cn("spectrum-analyzer p-4", className)}>
      <div 
        className="flex items-end justify-center gap-1"
        style={{ height: `${height}px` }}
      >
        {spectrumData.map((amplitude, index) => {
          const barHeight = Math.max(amplitude * height * 0.9, 2);
          
          return (
            <div
              key={index}
              className={cn(
                "w-2 rounded-sm transition-all duration-75",
                isActive 
                  ? "bg-gradient-to-t from-emerald via-amber to-ruby" 
                  : "bg-slate"
              )}
              style={{
                height: `${barHeight}px`,
                opacity: isActive ? amplitude + 0.2 : 0.3,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Audio Knob Control
export const KnobControl = forwardRef<HTMLDivElement, {
  value: number; // 0-100
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
} & HTMLAttributes<HTMLDivElement>>(
  ({ value, onChange, label, className, ...props }, ref) => {
    const rotation = (value / 100) * 270 - 135; // -135° to +135°
    
    return (
      <div className={cn("flex flex-col items-center gap-2", className)} ref={ref} {...props}>
        <div
          className="knob-control"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
          onClick={(e) => {
            // Simple click-to-set functionality
            const rect = e.currentTarget.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const degrees = (angle * 180) / Math.PI + 135;
            const normalizedValue = Math.max(0, Math.min(100, (degrees / 270) * 100));
            onChange?.(normalizedValue);
          }}
        />
        {label && (
          <span className="text-caption text-ash">{label}</span>
        )}
      </div>
    );
  }
);

KnobControl.displayName = "KnobControl";