"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StepProgressIndicator, { Step } from "@/components/generation/StepProgressIndicator";
import EnhancedSampleSelection from "@/components/generation/EnhancedSampleSelection";
import GenerationTypeCards, { GenerationType } from "@/components/generation/GenerationTypeCards";
import AdvancedParameters, { GenerationParameters } from "@/components/generation/AdvancedParameters";
import GenerationProgress, { GenerationStep } from "@/components/generation/GenerationProgress";
import { Tooltip, HelpIcon, HelpPanel, generationHelpSections } from "@/components/generation/TooltipSystem";
import { AudioSample } from "@/lib/types/audio";
import { 
  Sparkles, 
  Music, 
  Upload, 
  Settings, 
  Download, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight,
  BookOpen,
  Share
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock audio samples data
const mockAudioSamples: AudioSample[] = [
  {
    id: "1",
    title: "Mizo Traditional Drum",
    description: "Traditional Mizo drum pattern used in ceremonial dances",
    culturalOrigin: "Mizo",
    instrumentType: "Percussion",
    fileUrl: "/api/audio/samples/1",
    duration: 45,
    fileSize: 2200000,
    sampleRate: 44100,
    tags: ["traditional", "ceremonial", "drums"],
    metadata: {
      tempo: 120,
      mood: "energetic",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-15T10:30:00Z"
    }
  },
  {
    id: "2",
    title: "Mizo Flute Melody",
    description: "Soothing flute melody from Mizo folk tradition",
    culturalOrigin: "Mizo",
    instrumentType: "Wind",
    fileUrl: "/api/audio/samples/2",
    duration: 38,
    fileSize: 1900000,
    sampleRate: 44100,
    tags: ["traditional", "peaceful", "flute"],
    metadata: {
      tempo: 80,
      mood: "peaceful",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-14T15:45:00Z"
    }
  },
  {
    id: "3",
    title: "Mizo String Instrument",
    description: "Traditional Mizo string instrument with authentic tuning",
    culturalOrigin: "Mizo",
    instrumentType: "String",
    fileUrl: "/api/audio/samples/3",
    duration: 52,
    fileSize: 2500000,
    sampleRate: 44100,
    tags: ["traditional", "strings", "melodic"],
    metadata: {
      tempo: 100,
      mood: "melodic",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-13T09:15:00Z"
    }
  },
  {
    id: "4",
    title: "Mizo Vocal Chant",
    description: "Traditional Mizo vocal chant with cultural significance",
    culturalOrigin: "Mizo",
    instrumentType: "Vocal",
    fileUrl: "/api/audio/samples/4",
    duration: 67,
    fileSize: 3200000,
    sampleRate: 44100,
    tags: ["traditional", "vocal", "chant"],
    metadata: {
      tempo: 60,
      mood: "ceremonial",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-12T14:20:00Z"
    }
  },
  {
    id: "5",
    title: "Mizo Bamboo Flute",
    description: "Handcrafted bamboo flute with natural resonance",
    culturalOrigin: "Mizo",
    instrumentType: "Wind",
    fileUrl: "/api/audio/samples/5",
    duration: 41,
    fileSize: 2000000,
    sampleRate: 44100,
    tags: ["traditional", "bamboo", "flute"],
    metadata: {
      tempo: 90,
      mood: "peaceful",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-11T11:30:00Z"
    }
  },
  {
    id: "6",
    title: "Mizo Ensemble",
    description: "Traditional ensemble piece with multiple instruments",
    culturalOrigin: "Mizo",
    instrumentType: "Ensemble",
    fileUrl: "/api/audio/samples/6",
    duration: 89,
    fileSize: 4300000,
    sampleRate: 44100,
    tags: ["traditional", "ensemble", "complex"],
    metadata: {
      tempo: 110,
      mood: "uplifting",
      uploadedBy: "Cultural Music Archive",
      uploadedAt: "2024-01-10T16:45:00Z"
    }
  }
];

export default function GeneratePage() {
  const [currentStep, setCurrentStep] = useState("select-samples");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSamples, setSelectedSamples] = useState<any[]>([]);
  const [generationParams, setGenerationParams] = useState<GenerationParameters>({
    mood: "peaceful",
    energy: 50,
    culturalIntensity: 70,
    bpm: 120,
    keySignature: "C Major",
    customInstructions: "",
    styleIntensity: 60,
    duration: 30,
    fadeIn: true,
    fadeOut: true,
    loopable: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGenerationStep, setCurrentGenerationStep] = useState<GenerationStep | null>(null);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>();

  const steps: Step[] = [
    {
      id: "select-samples",
      title: "Select Samples",
      description: "Choose your cultural audio samples",
      icon: Upload,
      status: currentStep === "select-samples" ? "current" : selectedSamples.length > 0 ? "completed" : "pending",
      estimatedTime: "2 min"
    },
    {
      id: "choose-type",
      title: "Generation Type",
      description: "Select what you want to create",
      icon: Music,
      status: currentStep === "choose-type" ? "current" : selectedType ? "completed" : "pending",
      estimatedTime: "1 min"
    },
    {
      id: "configure",
      title: "Configure",
      description: "Set parameters and preferences",
      icon: Settings,
      status: currentStep === "configure" ? "current" : "pending",
      estimatedTime: "3 min"
    },
    {
      id: "generate",
      title: "Generate",
      description: "AI creates your custom audio",
      icon: Sparkles,
      status: currentStep === "generate" ? "current" : "pending",
      estimatedTime: "5-15 min"
    },
    {
      id: "download",
      title: "Download",
      description: "Get your generated audio files",
      icon: Download,
      status: generatedResult ? "completed" : "pending",
      estimatedTime: "1 min"
    }
  ];

  const handleSamplesChange = useCallback((samples: any[]) => {
    setSelectedSamples(samples);
  }, []);

  const handleAddSample = useCallback(() => {
    // In a real app, this would open a sample browser
    const availableSample = mockAudioSamples.find(s => !selectedSamples.some(sel => sel.id === s.id));
    if (availableSample && selectedSamples.length < 5) {
      const newSample = {
        ...availableSample,
        volume: 1,
        isMuted: false,
        isSolo: false,
        position: selectedSamples.length
      };
      setSelectedSamples(prev => [...prev, newSample]);
    }
  }, [selectedSamples]);

  const handleStepNavigation = useCallback((stepId: string) => {
    setCurrentStep(stepId);
  }, []);

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case "select-samples":
        return selectedSamples.length > 0;
      case "choose-type":
        return selectedType !== "";
      case "configure":
        return true; // Parameters have defaults
      default:
        return false;
    }
  };

  const getNextStep = () => {
    const stepOrder = ["select-samples", "choose-type", "configure", "generate"];
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[currentIndex + 1] || "generate";
  };

  const getPreviousStep = () => {
    const stepOrder = ["select-samples", "choose-type", "configure", "generate"];
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[currentIndex - 1] || "select-samples";
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      const next = getNextStep();
      if (next === "generate") {
        handleGenerate();
      } else {
        setCurrentStep(next);
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(getPreviousStep());
  };

  const handleGenerate = async () => {
    if (!selectedType || selectedSamples.length === 0) {
      alert("Please select a generation type and at least one sample");
      return;
    }

    setCurrentStep("generate");
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedResult(null);
    
    // Mock generation steps
    const generationSteps: GenerationStep[] = [
      {
        id: "analyze",
        title: "Analyzing Samples",
        description: "Understanding cultural elements and musical characteristics",
        status: "active",
        progress: 0,
        estimatedTime: 15,
        icon: Music
      },
      {
        id: "compose",
        title: "AI Composition",
        description: "Creating musical structure and harmony patterns",
        status: "pending",
        progress: 0,
        estimatedTime: 45,
        icon: Sparkles
      },
      {
        id: "synthesize",
        title: "Audio Synthesis",
        description: "Generating high-quality audio with cultural authenticity",
        status: "pending",
        progress: 0,
        estimatedTime: 30,
        icon: Music
      },
      {
        id: "enhance",
        title: "Enhancement & Mastering",
        description: "Applying final touches and audio mastering",
        status: "pending",
        progress: 0,
        estimatedTime: 20,
        icon: Settings
      },
      {
        id: "finalize",
        title: "Finalizing Output",
        description: "Preparing your generated audio for download",
        status: "pending",
        progress: 0,
        estimatedTime: 10,
        icon: Download
      }
    ];
    
    // Simulate step-by-step progress
    for (let i = 0; i < generationSteps.length; i++) {
      const step = generationSteps[i];
      setCurrentGenerationStep({ ...step, status: "active" });
      setEstimatedTimeRemaining((generationSteps.length - i) * 20);
      
      // Simulate step progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setCurrentGenerationStep(prev => prev ? { ...prev, progress } : null);
        setGenerationProgress((i * 100 + progress) / generationSteps.length);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setCurrentGenerationStep({ ...step, status: "completed", progress: 100 });
    }
    
    // Complete generation
    setGenerationProgress(100);
    setGeneratedResult("/api/audio/generated/mock-audio.mp3"); // Mock audio URL
    setIsGenerating(false);
    setCurrentStep("download");
  };

  const handleCancelGeneration = () => {
    setIsGenerating(false);
    setGenerationProgress(0);
    setCurrentGenerationStep(null);
    setGeneratedResult(null);
    setCurrentStep("configure");
  };

  const handleDownload = () => {
    // Mock download
    console.log("Downloading generated audio...");
  };

  const handleShare = () => {
    // Mock share
    console.log("Sharing generated audio...");
  };

  const handleRegenerate = () => {
    setGeneratedResult(null);
    setCurrentStep("configure");
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Music Generation</h1>
            <p className="text-gray-600 text-lg">
              Create authentic cultural compositions using advanced AI technology
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip content="Get help with the generation process" type="help">
              <Button
                variant="outline"
                onClick={() => setShowHelpPanel(true)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
            </Tooltip>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {selectedSamples.length}/5
              </div>
              <div className="text-xs text-muted-foreground">samples selected</div>
            </div>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <StepProgressIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepNavigation}
          allowNavigation={true}
        />

        {/* Main Content */}
        <div className="space-y-8">
          {/* Step Content */}
          {currentStep === "select-samples" && (
            <EnhancedSampleSelection
              availableSamples={mockAudioSamples}
              selectedSamples={selectedSamples}
              onSamplesChange={handleSamplesChange}
              onAddSample={handleAddSample}
              maxSamples={5}
            />
          )}

          {currentStep === "choose-type" && (
            <GenerationTypeCards
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
              showPricing={true}
            />
          )}

          {currentStep === "configure" && (
            <AdvancedParameters
              parameters={generationParams}
              onParametersChange={setGenerationParams}
              generationType={selectedType}
              detectedBpm={selectedSamples[0]?.metadata?.tempo}
            />
          )}

          {(currentStep === "generate" || currentStep === "download") && (
            <GenerationProgress
              isGenerating={isGenerating}
              progress={generationProgress}
              currentStep={currentGenerationStep}
              estimatedTimeRemaining={estimatedTimeRemaining}
              generatedPreview={generatedResult}
              onCancel={handleCancelGeneration}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
              onShare={handleShare}
            />
          )}
        </div>

        {/* Navigation */}
        {!isGenerating && !generatedResult && (
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === "select-samples"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-4">
              {currentStep !== "generate" && (
                <Tooltip 
                  content={!canProceedToNextStep() ? "Complete current step to continue" : "Proceed to next step"}
                  type={!canProceedToNextStep() ? "warning" : "info"}
                >
                  <Button
                    onClick={handleNextStep}
                    disabled={!canProceedToNextStep()}
                    className="flex items-center gap-2"
                  >
                    {getNextStep() === "generate" ? (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Start Generation
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Help Panel */}
        <HelpPanel
          title="Generation Guide"
          sections={generationHelpSections}
          isOpen={showHelpPanel}
          onClose={() => setShowHelpPanel(false)}
        />
      </div>
    </div>
  );
}