"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload,
  Zap,
  Music,
  Palette,
  Activity,
  Volume2,
  Clock,
  Hash,
  FileAudio,
  RotateCcw,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Heart,
  Smile,
  Frown,
  Meh,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GenerationParameters {
  mood: string;
  energy: number;
  culturalIntensity: number;
  bpm: number;
  keySignature: string;
  referenceTrack?: File;
  customInstructions: string;
  styleIntensity: number;
  duration: number;
  fadeIn: boolean;
  fadeOut: boolean;
  loopable: boolean;
}

interface AdvancedParametersProps {
  parameters: GenerationParameters;
  onParametersChange: (parameters: GenerationParameters) => void;
  generationType?: string;
  detectedBpm?: number;
  className?: string;
}

const moodOptions = [
  { id: "energetic", label: "Energetic", color: "from-red-400 to-orange-400", icon: "⚡", description: "High energy, exciting" },
  { id: "peaceful", label: "Peaceful", color: "from-blue-400 to-cyan-400", icon: "🕊️", description: "Calm, serene" },
  { id: "mysterious", label: "Mysterious", color: "from-purple-400 to-indigo-400", icon: "🌙", description: "Enigmatic, intriguing" },
  { id: "joyful", label: "Joyful", color: "from-yellow-400 to-orange-400", icon: "😊", description: "Happy, uplifting" },
  { id: "meditative", label: "Meditative", color: "from-green-400 to-teal-400", icon: "🧘", description: "Contemplative, spiritual" },
  { id: "dramatic", label: "Dramatic", color: "from-gray-600 to-gray-800", icon: "🎭", description: "Intense, emotional" },
  { id: "romantic", label: "Romantic", color: "from-pink-400 to-rose-400", icon: "💕", description: "Tender, loving" },
  { id: "epic", label: "Epic", color: "from-orange-400 to-red-600", icon: "🔥", description: "Grand, powerful" }
];

const keySignatures = [
  "C Major", "G Major", "D Major", "A Major", "E Major", "B Major", "F# Major", "C# Major",
  "F Major", "Bb Major", "Eb Major", "Ab Major", "Db Major", "Gb Major", "Cb Major",
  "A Minor", "E Minor", "B Minor", "F# Minor", "C# Minor", "G# Minor", "D# Minor", "A# Minor",
  "D Minor", "G Minor", "C Minor", "F Minor", "Bb Minor", "Eb Minor", "Ab Minor"
];

const defaultParameters: GenerationParameters = {
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
};

const MoodSelector = ({ 
  selectedMood, 
  onMoodChange 
}: { 
  selectedMood: string; 
  onMoodChange: (mood: string) => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        <Label className="text-sm font-medium">Mood & Atmosphere</Label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {moodOptions.map((mood) => (
          <Button
            key={mood.id}
            variant="outline"
            onClick={() => onMoodChange(mood.id)}
            className={cn(
              "h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 group relative overflow-hidden",
              selectedMood === mood.id 
                ? "ring-2 ring-primary border-primary shadow-lg" 
                : "hover:scale-105 hover:shadow-md"
            )}
          >
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity",
              mood.color,
              selectedMood === mood.id ? "opacity-30" : "group-hover:opacity-25"
            )} />
            
            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="text-2xl mb-1">{mood.icon}</div>
              <div className="text-xs font-medium">{mood.label}</div>
              {selectedMood === mood.id && (
                <div className="text-xs text-muted-foreground mt-1">
                  {mood.description}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

const BpmDetector = ({ 
  detectedBpm, 
  currentBpm, 
  onBpmChange 
}: { 
  detectedBpm?: number; 
  currentBpm: number; 
  onBpmChange: (bpm: number) => void;
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  
  const handleAutoDetect = () => {
    setIsDetecting(true);
    // Mock detection process
    setTimeout(() => {
      setIsDetecting(false);
      if (detectedBpm) {
        onBpmChange(detectedBpm);
      }
    }, 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <Label className="text-sm font-medium">Tempo (BPM)</Label>
        </div>
        {detectedBpm && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="text-xs"
          >
            {isDetecting ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                Detecting...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Auto-detect: {detectedBpm}
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Slider
              value={[currentBpm]}
              onValueChange={([value]) => onBpmChange(value)}
              min={60}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
          <div className="w-20">
            <Input
              type="number"
              value={currentBpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value) || 120)}
              min={60}
              max={200}
              className="text-center text-sm h-8"
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slow (60)</span>
          <span>Moderate (120)</span>
          <span>Fast (200)</span>
        </div>
        
        {/* BPM Suggestions */}
        <div className="flex flex-wrap gap-2">
          {[80, 100, 120, 140, 160].map(bpm => (
            <Button
              key={bpm}
              variant="ghost"
              size="sm"
              onClick={() => onBpmChange(bpm)}
              className={cn(
                "text-xs h-6 px-2",
                currentBpm === bpm && "bg-primary text-white"
              )}
            >
              {bpm}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

const IntensitySlider = ({
  label,
  value,
  onChange,
  icon: Icon,
  description,
  min = 0,
  max = 100,
  step = 5,
  color = "blue"
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ElementType;
  description: string;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
}) => {
  const getIntensityLabel = (value: number) => {
    if (value <= 25) return "Subtle";
    if (value <= 50) return "Moderate";
    if (value <= 75) return "Strong";
    return "Intense";
  };

  const getIntensityColor = (value: number) => {
    if (value <= 25) return "text-blue-600";
    if (value <= 50) return "text-green-600";
    if (value <= 75) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <div className="text-right">
          <div className={cn("text-sm font-medium", getIntensityColor(value))}>
            {getIntensityLabel(value)}
          </div>
          <div className="text-xs text-muted-foreground">{value}%</div>
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

const ReferenceTrackUpload = ({
  file,
  onFileChange,
  onRemove
}: {
  file?: File;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileAudio className="h-4 w-4" />
        <Label className="text-sm font-medium">Reference Track (Optional)</Label>
      </div>
      
      {file ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <FileAudio className="h-5 w-5 text-green-600" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{file.name}</div>
            <div className="text-xs text-green-600">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <div className="text-sm font-medium text-gray-700">Upload Reference Track</div>
          <div className="text-xs text-gray-500 mt-1">
            AI will match the style and characteristics
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Upload a track with similar style or mood. The AI will analyze and incorporate its characteristics.
      </p>
    </div>
  );
};

export default function AdvancedParameters({
  parameters,
  onParametersChange,
  generationType,
  detectedBpm,
  className
}: AdvancedParametersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateParameter = useCallback(<K extends keyof GenerationParameters>(
    key: K,
    value: GenerationParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value
    });
  }, [parameters, onParametersChange]);

  const resetToDefaults = useCallback(() => {
    onParametersChange({ ...defaultParameters });
  }, [onParametersChange]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generation Parameters
          </h3>
          <p className="text-sm text-muted-foreground">
            Fine-tune your audio generation with advanced controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide" : "Show"} Advanced
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Basic Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Mood & Style</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodSelector
              selectedMood={parameters.mood}
              onMoodChange={(mood) => updateParameter("mood", mood)}
            />
          </CardContent>
        </Card>

        {/* Energy & Intensity */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Energy & Intensity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <IntensitySlider
              label="Energy Level"
              value={parameters.energy}
              onChange={(value) => updateParameter("energy", value)}
              icon={TrendingUp}
              description="Overall energy and excitement level of the generated audio"
            />
            
            <IntensitySlider
              label="Cultural Authenticity"
              value={parameters.culturalIntensity}
              onChange={(value) => updateParameter("culturalIntensity", value)}
              icon={Heart}
              description="How closely the output adheres to traditional cultural elements"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tempo & Key */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Tempo Control</CardTitle>
          </CardHeader>
          <CardContent>
            <BpmDetector
              detectedBpm={detectedBpm}
              currentBpm={parameters.bpm}
              onBpmChange={(bpm) => updateParameter("bpm", bpm)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Musical Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <Label className="text-sm font-medium">Key Signature</Label>
              </div>
              
              <select
                value={parameters.keySignature}
                onChange={(e) => updateParameter("keySignature", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                {keySignatures.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              
              <p className="text-xs text-muted-foreground">
                Choose a key that complements your samples or matches your project needs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Parameters */}
      {showAdvanced && (
        <div className="space-y-6 border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900">Advanced Settings</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reference Track */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Reference Track</CardTitle>
              </CardHeader>
              <CardContent>
                <ReferenceTrackUpload
                  file={parameters.referenceTrack}
                  onFileChange={(file) => updateParameter("referenceTrack", file)}
                  onRemove={() => updateParameter("referenceTrack", undefined)}
                />
              </CardContent>
            </Card>

            {/* Style Intensity */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Style Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <IntensitySlider
                  label="Style Intensity"
                  value={parameters.styleIntensity}
                  onChange={(value) => updateParameter("styleIntensity", value)}
                  icon={Sparkles}
                  description="How strongly the AI applies stylistic transformations"
                />
              </CardContent>
            </Card>
          </div>

          {/* Duration & Format Options */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Output Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <Label className="text-sm font-medium">Duration (seconds)</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[parameters.duration]}
                      onValueChange={([value]) => updateParameter("duration", value)}
                      min={5}
                      max={300}
                      step={5}
                      className="flex-1"
                    />
                    <div className="w-16 text-sm font-medium text-center">
                      {parameters.duration}s
                    </div>
                  </div>
                </div>

                {/* Format Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Format Options</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={parameters.fadeIn}
                        onChange={(e) => updateParameter("fadeIn", e.target.checked)}
                        className="rounded"
                      />
                      Fade In
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={parameters.fadeOut}
                        onChange={(e) => updateParameter("fadeOut", e.target.checked)}
                        className="rounded"
                      />
                      Fade Out
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={parameters.loopable}
                        onChange={(e) => updateParameter("loopable", e.target.checked)}
                        className="rounded"
                      />
                      Make Loopable
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Custom Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Additional Instructions (Optional)</Label>
                <textarea
                  value={parameters.customInstructions}
                  onChange={(e) => updateParameter("customInstructions", e.target.value)}
                  placeholder="Describe any specific requirements, style preferences, or creative direction..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Provide specific instructions to guide the AI generation process. Be descriptive about the mood, instruments, or cultural elements you want emphasized.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generation Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h5 className="font-medium text-blue-900 mb-2">Generation Preview</h5>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• <strong>Mood:</strong> {moodOptions.find(m => m.id === parameters.mood)?.label} ({moodOptions.find(m => m.id === parameters.mood)?.description})</div>
            <div>• <strong>Tempo:</strong> {parameters.bpm} BPM</div>
            <div>• <strong>Key:</strong> {parameters.keySignature}</div>
            <div>• <strong>Duration:</strong> {parameters.duration} seconds</div>
            <div>• <strong>Energy Level:</strong> {parameters.energy}% • <strong>Cultural Intensity:</strong> {parameters.culturalIntensity}%</div>
            {parameters.referenceTrack && <div>• <strong>Reference:</strong> {parameters.referenceTrack.name}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}