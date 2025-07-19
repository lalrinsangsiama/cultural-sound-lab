"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Play, 
  Pause, 
  Download,
  Music,
  Clock,
  Zap,
  Volume2,
  Loader2,
  CheckCircle2,
  Building2,
  Palette,
  Timer,
  ArrowLeft,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import mizoSamplesData from "@/../../assets/sample-audio/mizo-samples.json";

// Reuse interfaces from the desktop version
interface GenerationFormData {
  selectedSamples: string[];
  generationType: string;
  mood: string;
  length: number;
  businessType: string;
  customLength?: number;
}

interface GenerationResult {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  type: string;
  parameters: GenerationFormData;
  createdAt: string;
}

interface FormErrors {
  [key: string]: string;
}

interface GenerationStatus {
  stage: 'initializing' | 'processing' | 'finalizing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// Reuse data from desktop version
const generationTypes = [
  {
    id: "sound-logo",
    title: "Sound Logo",
    description: "3-15 second branded audio signatures",
    icon: Zap,
    duration: "3-15 seconds",
    minLength: 3,
    maxLength: 15,
    useCase: "Brand identity, app sounds, jingles",
    emoji: "⚡"
  },
  {
    id: "playlist",
    title: "Playlist",
    description: "30+ minutes of curated background music",
    icon: Music,
    duration: "30+ minutes",
    minLength: 30 * 60,
    maxLength: 180 * 60,
    useCase: "Shops, restaurants, events, ambiance",
    emoji: "🎵"
  },
  {
    id: "social-clip",
    title: "Social Clip",
    description: "15-60 seconds optimized for social media",
    icon: Play,
    duration: "15-60 seconds",
    minLength: 15,
    maxLength: 60,
    useCase: "Instagram, TikTok, YouTube Shorts",
    emoji: "📱"
  },
  {
    id: "long-form",
    title: "Long-form",
    description: "Custom length for specific needs",
    icon: Clock,
    duration: "Custom length",
    minLength: 60,
    maxLength: 30 * 60,
    useCase: "Films, documentaries, meditation, podcasts",
    emoji: "🎬"
  }
];

const moods = [
  { id: "chill", name: "Chill", description: "Relaxed and laid-back vibes", emoji: "😌", color: "bg-blue-100 text-blue-800" },
  { id: "energetic", name: "Energetic", description: "High-energy and upbeat", emoji: "⚡", color: "bg-red-100 text-red-800" },
  { id: "traditional", name: "Traditional", description: "Authentic cultural sounds", emoji: "🏛️", color: "bg-purple-100 text-purple-800" },
  { id: "modern-fusion", name: "Modern Fusion", description: "Contemporary meets traditional", emoji: "🎨", color: "bg-green-100 text-green-800" }
];

const businessTypes = [
  { id: "restaurant", name: "Restaurant & Dining", emoji: "🍽️" },
  { id: "retail", name: "Retail Store", emoji: "🛍️" },
  { id: "office", name: "Office Space", emoji: "🏢" },
  { id: "spa", name: "Spa & Wellness", emoji: "🧘" },
  { id: "fitness", name: "Fitness Center", emoji: "💪" },
  { id: "hotel", name: "Hotel & Hospitality", emoji: "🏨" },
  { id: "event", name: "Event & Wedding", emoji: "🎉" },
  { id: "media", name: "Media & Content Creation", emoji: "📺" },
  { id: "app", name: "App & Software", emoji: "📱" },
  { id: "other", name: "Other", emoji: "🔧" }
];

const availableSamples = mizoSamplesData.samples.map(sample => ({
  id: sample.id,
  name: sample.name,
  description: sample.description,
  instrument: sample.instrument,
  duration: sample.duration,
  tags: sample.tags,
  culturalContext: sample.culturalContext
}));

interface MobileGenerationFormProps {
  onGenerationComplete?: (result: GenerationResult) => void;
  className?: string;
}

export default function MobileGenerationForm({
  onGenerationComplete,
  className
}: MobileGenerationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GenerationFormData>({
    selectedSamples: [],
    generationType: "",
    mood: "",
    length: 30,
    businessType: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  
  // Touch/swipe handling
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: 1, title: "Select Samples", description: "Choose source audio", icon: "🎵" },
    { id: 2, title: "Generation Type", description: "Pick your format", icon: "⚙️" },
    { id: 3, title: "Parameters", description: "Set mood & context", icon: "🎨" },
    { id: 4, title: "Generate", description: "Create your audio", icon: "✨" }
  ];

  // Validation (reuse from desktop)
  const validateStep = useCallback((step: number): FormErrors => {
    const stepErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (formData.selectedSamples.length === 0) {
          stepErrors.samples = "Please select at least one audio sample";
        }
        break;
      case 2:
        if (!formData.generationType) {
          stepErrors.generationType = "Please select a generation type";
        }
        break;
      case 3:
        if (!formData.mood) {
          stepErrors.mood = "Please select a mood";
        }
        if (!formData.businessType) {
          stepErrors.businessType = "Please select a business type";
        }
        const selectedType = generationTypes.find(t => t.id === formData.generationType);
        if (selectedType) {
          if (formData.length < selectedType.minLength || formData.length > selectedType.maxLength) {
            const formatTime = (seconds: number) => {
              if (seconds >= 60) {
                const minutes = Math.floor(seconds / 60);
                return `${minutes} minute${minutes > 1 ? 's' : ''}`;
              }
              return `${seconds} second${seconds > 1 ? 's' : ''}`;
            };
            stepErrors.length = `Length must be between ${formatTime(selectedType.minLength)} and ${formatTime(selectedType.maxLength)}`;
          }
        }
        break;
    }

    return stepErrors;
  }, [formData]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0]?.clientX ?? 0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    // Optional: Add visual feedback during drag
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const endX = e.changedTouches[0]?.clientX ?? 0;
    const deltaX = startX - endX;
    const threshold = 100; // Minimum swipe distance

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentStep < 4) {
        // Swipe left - next step
        handleNext();
      } else if (deltaX < 0 && currentStep > 1) {
        // Swipe right - previous step
        handlePrevious();
      }
    }
  };

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStep);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  }, []);

  const handleSampleToggle = useCallback((sampleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSamples: prev.selectedSamples.includes(sampleId)
        ? prev.selectedSamples.filter(id => id !== sampleId)
        : [...prev.selectedSamples, sampleId]
    }));
  }, []);

  const handleGenerationTypeSelect = useCallback((typeId: string) => {
    const selectedType = generationTypes.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      generationType: typeId,
      length: selectedType ? selectedType.minLength : 30
    }));
  }, []);

  const simulateGeneration = useCallback(async () => {
    const stages = [
      { stage: 'initializing', progress: 10, message: 'Initializing AI models...' },
      { stage: 'processing', progress: 30, message: 'Analyzing cultural samples...' },
      { stage: 'processing', progress: 50, message: 'Generating audio patterns...' },
      { stage: 'processing', progress: 70, message: 'Applying mood and style...' },
      { stage: 'finalizing', progress: 85, message: 'Finalizing composition...' },
      { stage: 'finalizing', progress: 95, message: 'Preparing download...' },
      { stage: 'complete', progress: 100, message: 'Generation complete!' }
    ];

    for (const stage of stages) {
      setGenerationStatus({
        stage: stage.stage as any,
        progress: stage.progress,
        message: stage.message
      });
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const selectedType = generationTypes.find(t => t.id === formData.generationType);
    const result: GenerationResult = {
      id: Date.now().toString(),
      title: `Generated ${selectedType?.title || 'Audio'}`,
      audioUrl: '/path/to/generated/audio.mp3',
      duration: formData.length,
      type: formData.generationType,
      parameters: formData,
      createdAt: new Date().toISOString()
    };

    setGenerationResult(result);
    onGenerationComplete?.(result);
  }, [formData, onGenerationComplete]);

  const handleGenerate = useCallback(async () => {
    const finalErrors = validateStep(3);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      return;
    }

    setIsGenerating(true);
    setCurrentStep(4);

    try {
      await simulateGeneration();
    } catch (error) {
      setGenerationStatus({
        stage: 'error',
        progress: 0,
        message: 'Generation failed',
        error: 'An error occurred during generation. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [validateStep, simulateGeneration]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData({
      selectedSamples: [],
      generationType: "",
      mood: "",
      length: 30,
      businessType: ""
    });
    setErrors({});
    setIsGenerating(false);
    setGenerationStatus(null);
    setGenerationResult(null);
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  }, []);

  // Step content renderers for mobile
  const renderMobileStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Choose Audio Samples</h2>
              <p className="text-gray-600 text-sm">Select samples to use in your generation</p>
            </div>
            
            <div className="space-y-3">
              {availableSamples.map((sample) => (
                <Card
                  key={sample.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-sm active:scale-[0.98]",
                    formData.selectedSamples.includes(sample.id) && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleSampleToggle(sample.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                        formData.selectedSamples.includes(sample.id)
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      )}>
                        {formData.selectedSamples.includes(sample.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base">{sample.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sample.instrument} • {formatDuration(sample.duration)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{sample.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sample.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {sample.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{sample.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {errors.samples && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.samples}</AlertDescription>
              </Alert>
            )}
            
            {formData.selectedSamples.length > 0 && (
              <div className="bg-primary/5 rounded-lg p-3 mt-4">
                <p className="text-sm text-primary font-medium">
                  {formData.selectedSamples.length} sample{formData.selectedSamples.length > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Choose Generation Type</h2>
              <p className="text-gray-600 text-sm">What type of audio do you want to create?</p>
            </div>
            
            <div className="space-y-4">
              {generationTypes.map((type) => (
                <Card
                  key={type.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-sm active:scale-[0.98]",
                    formData.generationType === type.id && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleGenerationTypeSelect(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl flex-shrink-0">
                        {type.emoji}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{type.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {type.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {type.duration}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Perfect for: {type.useCase}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {errors.generationType && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.generationType}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        const selectedType = generationTypes.find(t => t.id === formData.generationType);
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Set Parameters</h2>
              <p className="text-gray-600 text-sm">Customize your generation settings</p>
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Mood</Label>
              <div className="grid grid-cols-2 gap-3">
                {moods.map((mood) => (
                  <Card
                    key={mood.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-sm active:scale-[0.98]",
                      formData.mood === mood.id && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, mood: mood.id }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{mood.emoji}</div>
                      <h4 className="font-medium text-sm">{mood.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mood.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {errors.mood && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.mood}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Length Input */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Length: {formatDuration(formData.length)}
              </Label>
              {selectedType && (
                <div className="space-y-3">
                  <Slider
                    value={[formData.length]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, length: value[0] ?? prev.length }))}
                    min={selectedType.minLength}
                    max={selectedType.maxLength}
                    step={selectedType.id === 'playlist' ? 60 : 1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDuration(selectedType.minLength)}</span>
                    <span>{formatDuration(selectedType.maxLength)}</span>
                  </div>
                </div>
              )}
              {errors.length && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.length}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Business Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Business Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {businessTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={formData.businessType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, businessType: type.id }))}
                    className="h-12 flex-col p-2"
                  >
                    <span className="text-lg mb-1">{type.emoji}</span>
                    <span className="text-xs leading-tight">{type.name}</span>
                  </Button>
                ))}
              </div>
              {errors.businessType && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.businessType}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {!generationResult ? (
              <div className="text-center space-y-6">
                {generationStatus && (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto">
                      {generationStatus.stage === 'error' ? (
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-10 w-10 text-red-500" />
                        </div>
                      ) : generationStatus.stage === 'complete' ? (
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                          <Sparkles className="h-10 w-10 text-primary animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">
                        {generationStatus.stage === 'error' ? 'Generation Failed' :
                         generationStatus.stage === 'complete' ? 'Complete!' :
                         'Generating...'}
                      </h3>
                      <p className="text-muted-foreground">{generationStatus.message}</p>
                    </div>

                    {generationStatus.stage !== 'error' && generationStatus.stage !== 'complete' && (
                      <div className="w-full space-y-2">
                        <Progress value={generationStatus.progress} className="w-full h-3" />
                        <p className="text-sm text-muted-foreground">
                          {generationStatus.progress}% complete
                        </p>
                      </div>
                    )}

                    {generationStatus.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{generationStatus.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    Success!
                  </h3>
                  <p className="text-muted-foreground">
                    Your audio has been generated successfully
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{generationResult.title}</CardTitle>
                    <CardDescription>
                      {formatDuration(generationResult.duration)} • 
                      Created {new Date(generationResult.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-6 bg-muted/50 rounded-lg text-center">
                      <Volume2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Audio player will appear here
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button size="lg" className="w-full h-12">
                        <Play className="h-5 w-5 mr-2" />
                        Preview Audio
                      </Button>
                      <Button variant="outline" size="lg" className="w-full h-12">
                        <Download className="h-5 w-5 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="w-full h-12">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("md:hidden", className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="flex items-center justify-between mb-3">
          {currentStep > 1 && !isGenerating ? (
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10 h-10" />
          )}
          
          <div className="text-center">
            <h1 className="font-bold text-lg">AI Generation</h1>
            <p className="text-xs text-muted-foreground">
              Step {currentStep} of {steps.length}
            </p>
          </div>
          
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex space-x-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                currentStep > step.id ? "bg-primary" :
                currentStep === step.id ? "bg-primary/50" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Swipeable Content */}
      <div
        ref={containerRef}
        className="p-4 pb-20 min-h-[calc(100vh-200px)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderMobileStepContent()}
      </div>

      {/* Bottom Navigation */}
      {currentStep < 4 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t md:hidden">
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button onClick={handleNext} size="lg" className="flex-1 h-12">
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="flex-1 h-12">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Audio
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Swipe Hint */}
      {currentStep < 4 && !isGenerating && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
          <p className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
            Swipe to navigate steps
          </p>
        </div>
      )}
    </div>
  );
}