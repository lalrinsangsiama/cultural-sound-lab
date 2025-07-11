"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Check,
  Upload,
  Settings,
  Wand2,
  Download,
  ChevronRight,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "current" | "completed" | "error";
  optional?: boolean;
  estimatedTime?: string;
}

interface StepProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  allowNavigation?: boolean;
  className?: string;
}

const defaultSteps: Step[] = [
  {
    id: "select-samples",
    title: "Select Samples",
    description: "Choose your cultural audio samples",
    icon: Upload,
    status: "current",
    estimatedTime: "2 min"
  },
  {
    id: "choose-type",
    title: "Generation Type", 
    description: "Select what you want to create",
    icon: Wand2,
    status: "pending",
    estimatedTime: "1 min"
  },
  {
    id: "configure",
    title: "Configure",
    description: "Set parameters and preferences",
    icon: Settings,
    status: "pending",
    estimatedTime: "3 min"
  },
  {
    id: "generate",
    title: "Generate",
    description: "AI creates your custom audio",
    icon: Sparkles,
    status: "pending",
    estimatedTime: "5-15 min"
  },
  {
    id: "download",
    title: "Download",
    description: "Get your generated audio files",
    icon: Download,
    status: "pending",
    estimatedTime: "1 min"
  }
];

export default function StepProgressIndicator({
  steps = defaultSteps,
  currentStep,
  onStepClick,
  allowNavigation = true,
  className
}: StepProgressIndicatorProps) {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  const getStepStatus = useCallback((step: Step, index: number) => {
    if (step.id === currentStep) return "current";
    if (index < currentStepIndex) return "completed";
    return step.status === "error" ? "error" : "pending";
  }, [currentStep, currentStepIndex]);

  const canNavigateToStep = useCallback((step: Step, index: number) => {
    if (!allowNavigation) return false;
    const status = getStepStatus(step, index);
    return status === "completed" || status === "current";
  }, [allowNavigation, getStepStatus]);

  const handleStepClick = useCallback((step: Step, index: number) => {
    if (canNavigateToStep(step, index)) {
      onStepClick?.(step.id);
    }
  }, [canNavigateToStep, onStepClick]);

  const getStepIcon = (step: Step, status: string) => {
    const IconComponent = step.icon;
    
    if (status === "completed") {
      return (
        <div className="relative">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <Check className="h-5 w-5" />
          </div>
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
        </div>
      );
    }
    
    if (status === "current") {
      return (
        <div className="relative">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-primary/20">
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-30" />
        </div>
      );
    }
    
    if (status === "error") {
      return (
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
          <IconComponent className="h-5 w-5" />
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-gray-300">
        <IconComponent className="h-5 w-5" />
      </div>
    );
  };

  const getConnectorStatus = (index: number) => {
    if (index >= currentStepIndex) return "pending";
    return "completed";
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Progress Bar */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="mt-2">
          <h3 className="font-semibold text-lg">{steps[currentStepIndex]?.title}</h3>
          <p className="text-muted-foreground">{steps[currentStepIndex]?.description}</p>
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background connector line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0" />
          
          {/* Animated progress line */}
          <div 
            className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-primary to-green-500 z-10 transition-all duration-1000 ease-out"
            style={{ 
              width: `${Math.max(0, ((currentStepIndex) / (steps.length - 1)) * 100)}%` 
            }}
          />
          
          <div className="relative z-20 flex justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step, index);
              const isClickable = canNavigateToStep(step, index);
              const isHovered = hoveredStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center group"
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Step Circle */}
                  <Button
                    variant="ghost"
                    className={cn(
                      "relative p-0 h-auto bg-transparent hover:bg-transparent transition-all duration-200",
                      isClickable && "cursor-pointer hover:scale-110",
                      !isClickable && "cursor-not-allowed"
                    )}
                    onClick={() => handleStepClick(step, index)}
                    disabled={!isClickable}
                  >
                    {getStepIcon(step, status)}
                  </Button>
                  
                  {/* Step Info */}
                  <div className={cn(
                    "mt-3 text-center transition-all duration-200 max-w-32",
                    isHovered && "transform scale-105"
                  )}>
                    <h4 className={cn(
                      "font-medium text-sm transition-colors",
                      status === "current" && "text-primary",
                      status === "completed" && "text-green-600",
                      status === "error" && "text-red-600",
                      status === "pending" && "text-gray-500"
                    )}>
                      {step.title}
                      {step.optional && (
                        <span className="text-xs text-gray-400 ml-1">(optional)</span>
                      )}
                    </h4>
                    <p className={cn(
                      "text-xs mt-1 transition-colors",
                      status === "current" && "text-gray-700",
                      (status === "completed" || status === "pending") && "text-gray-500"
                    )}>
                      {step.description}
                    </p>
                    
                    {/* Estimated Time */}
                    {step.estimatedTime && (status === "current" || isHovered) && (
                      <div className={cn(
                        "flex items-center justify-center gap-1 mt-2 text-xs transition-all duration-200",
                        status === "current" ? "text-primary" : "text-gray-500"
                      )}>
                        <Clock className="h-3 w-3" />
                        <span>{step.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Tooltip */}
                  {isHovered && isClickable && status !== "current" && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-30 whitespace-nowrap">
                      Click to jump to this step
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Overall Progress Summary */}
        <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{steps.filter((_, i) => i < currentStepIndex).length} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Current: {steps[currentStepIndex]?.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span>{steps.length - currentStepIndex - 1} remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}