"use client";

import { useState, useCallback, useEffect } from "react";
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
  Timer
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
import AudioPlayer from "@/components/audio/AudioPlayer";
import mizoSamplesData from "@/../../assets/sample-audio/mizo-samples.json";

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

const generationTypes = [
  {
    id: "sound-logo",
    title: "Sound Logo",
    description: "3-15 second branded audio signatures",
    icon: Zap,
    duration: "3-15 seconds",
    minLength: 3,
    maxLength: 15,
    useCase: "Brand identity, app sounds, jingles"
  },
  {
    id: "playlist",
    title: "Playlist",
    description: "30+ minutes of curated background music",
    icon: Music,
    duration: "30+ minutes",
    minLength: 30 * 60, // 30 minutes in seconds
    maxLength: 180 * 60, // 3 hours in seconds
    useCase: "Shops, restaurants, events, ambiance"
  },
  {
    id: "social-clip",
    title: "Social Clip",
    description: "15-60 seconds optimized for social media",
    icon: Play,
    duration: "15-60 seconds",
    minLength: 15,
    maxLength: 60,
    useCase: "Instagram, TikTok, YouTube Shorts"
  },
  {
    id: "long-form",
    title: "Long-form",
    description: "Custom length for specific needs",
    icon: Clock,
    duration: "Custom length",
    minLength: 60, // 1 minute
    maxLength: 30 * 60, // 30 minutes
    useCase: "Films, documentaries, meditation, podcasts"
  }
];

const moods = [
  { id: "chill", name: "Chill", description: "Relaxed and laid-back vibes" },
  { id: "energetic", name: "Energetic", description: "High-energy and upbeat" },
  { id: "traditional", name: "Traditional", description: "Authentic cultural sounds" },
  { id: "modern-fusion", name: "Modern Fusion", description: "Contemporary meets traditional" }
];

const businessTypes = [
  { id: "restaurant", name: "Restaurant & Dining" },
  { id: "retail", name: "Retail Store" },
  { id: "office", name: "Office Space" },
  { id: "spa", name: "Spa & Wellness" },
  { id: "fitness", name: "Fitness Center" },
  { id: "hotel", name: "Hotel & Hospitality" },
  { id: "event", name: "Event & Wedding" },
  { id: "media", name: "Media & Content Creation" },
  { id: "app", name: "App & Software" },
  { id: "other", name: "Other" }
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

interface MultiStepGenerationFormProps {
  onGenerationComplete?: (result: GenerationResult) => void;
  className?: string;
}

export default function MultiStepGenerationForm({
  onGenerationComplete,
  className
}: MultiStepGenerationFormProps) {
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

  const steps = [
    { id: 1, title: "Select Samples", description: "Choose source audio" },
    { id: 2, title: "Generation Type", description: "Pick your format" },
    { id: 3, title: "Parameters", description: "Set mood & context" },
    { id: 4, title: "Generate", description: "Create your audio" }
  ];

  // Validation functions
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
        stage: stage.stage as 'initializing' | 'processing' | 'finalizing' | 'complete' | 'error',
        progress: stage.progress,
        message: stage.message
      });
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }

    // Create mock result
    const selectedType = generationTypes.find(t => t.id === formData.generationType);
    const result: GenerationResult = {
      id: Date.now().toString(),
      title: `Generated ${selectedType?.title || 'Audio'}`,
      audioUrl: '/path/to/generated/audio.mp3', // Mock URL
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

  // Step content renderers
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {availableSamples.map((sample) => (
                <Card
                  key={sample.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.selectedSamples.includes(sample.id) && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleSampleToggle(sample.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        formData.selectedSamples.includes(sample.id)
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      )}>
                        {formData.selectedSamples.includes(sample.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{sample.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sample.instrument} • {formatDuration(sample.duration)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{sample.description}</p>
                        <div className="flex gap-1 mt-2">
                          {sample.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generationTypes.map((type) => (
                <Card
                  key={type.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.generationType === type.id && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleGenerationTypeSelect(type.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <type.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{type.duration}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {type.useCase}
                      </span>
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
            {/* Mood Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Mood
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moods.map((mood) => (
                  <Card
                    key={mood.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-sm",
                      formData.mood === mood.id && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, mood: mood.id }))}
                  >
                    <CardContent className="p-3 text-center">
                      <h4 className="font-medium">{mood.name}</h4>
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
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Length: {formatDuration(formData.length)}
              </Label>
              {selectedType && (
                <div className="space-y-2">
                  <Slider
                    value={[formData.length]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, length: value[0] ?? prev.length }))}
                    min={selectedType.minLength}
                    max={selectedType.maxLength}
                    step={selectedType.id === 'playlist' ? 60 : 1} // 1 minute steps for playlist
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
              <Label className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Type
              </Label>
              <Select value={formData.businessType} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, businessType: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select your business type for context" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {/* Generation Status */}
                {generationStatus && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto">
                      {generationStatus.stage === 'error' ? (
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                      ) : generationStatus.stage === 'complete' ? (
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-primary animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {generationStatus.stage === 'error' ? 'Generation Failed' :
                         generationStatus.stage === 'complete' ? 'Generation Complete!' :
                         'Generating Your Audio...'}
                      </h3>
                      <p className="text-muted-foreground">{generationStatus.message}</p>
                    </div>

                    {generationStatus.stage !== 'error' && generationStatus.stage !== 'complete' && (
                      <div className="w-full max-w-md mx-auto space-y-2">
                        <Progress value={generationStatus.progress} className="w-full" />
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
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    Generation Complete!
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
                    {/* Audio Player would go here */}
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <Volume2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Audio player would be embedded here
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <Button variant="outline" onClick={resetForm} className="w-full">
                      Generate Another
                    </Button>
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
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm",
              currentStep > step.id 
                ? "bg-primary border-primary text-primary-foreground"
                : currentStep === step.id
                ? "border-primary text-primary"
                : "border-gray-300 text-gray-400"
            )}>
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            <div className="ml-3 hidden sm:block">
              <p className={cn(
                "text-sm font-medium",
                currentStep >= step.id ? "text-primary" : "text-gray-400"
              )}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-12 mx-4",
                currentStep > step.id ? "bg-primary" : "bg-gray-300"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Step {currentStep}: {steps[currentStep - 1]?.title || "Unknown"}</span>
            {currentStep < 4 && (
              <Badge variant="outline">
                {currentStep}/3
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {steps[currentStep - 1]?.description || "Step description not available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isGenerating}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : currentStep === 3 ? (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Audio
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}