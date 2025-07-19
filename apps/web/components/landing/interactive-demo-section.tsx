'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Wand2, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock Mizo samples data
const mizoSamples = [
  {
    id: 1,
    title: 'Traditional Mizo Flute',
    description: 'Haunting bamboo flute melody',
    duration: '0:45',
    culture: 'Mizo',
    instrument: 'Bamboo Flute',
    mood: 'Peaceful',
    audioUrl: '/audio/mizo-flute-sample.mp3',
    waveform: Array.from({ length: 50 }, () => Math.random() * 80 + 20),
  },
  {
    id: 2,
    title: 'Mizo Ceremonial Gong',
    description: 'Deep resonant ceremonial tones',
    duration: '0:30',
    culture: 'Mizo',
    instrument: 'Bronze Gong',
    mood: 'Spiritual',
    audioUrl: '/audio/mizo-gong-sample.mp3',
    waveform: Array.from({ length: 50 }, () => Math.random() * 100 + 10),
  },
  {
    id: 3,
    title: 'Mizo Festival Drums',
    description: 'Energetic Chapchar Kut rhythms',
    duration: '1:00',
    culture: 'Mizo',
    instrument: 'Traditional Drums',
    mood: 'Energetic',
    audioUrl: '/audio/mizo-drum-sample.mp3',
    waveform: Array.from({ length: 50 }, () => Math.random() * 90 + 30),
  },
];

// Mini audio player component
const MiniPlayer = ({ sample, isActive, onPlay }: { 
  sample: typeof mizoSamples[0]; 
  isActive: boolean; 
  onPlay: () => void; 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(false);
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      onPlay();
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Audio playback failed - using demo mode:', sample.audioUrl);
        // Still show as playing for demo purposes
        setIsPlaying(true);
        // Auto-stop after sample duration for demo
        setTimeout(() => {
          setIsPlaying(false);
          setProgress(0);
        }, 3000);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <motion.div
      className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        isActive 
          ? 'border-purple-500 bg-purple-50 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPlay}
    >
      <audio
        ref={audioRef}
        src={sample.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <div className="flex items-center space-x-3">
        {/* Play button */}
        <Button
          size="sm"
          variant={isActive ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-10 h-10 rounded-full p-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        {/* Sample info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{sample.title}</h4>
          <p className="text-xs text-gray-500 truncate">{sample.description}</p>
        </div>
        
        {/* Duration */}
        <div className="text-xs text-gray-500">
          {sample.duration}
        </div>
      </div>
      
      {/* Waveform visualization */}
      <div className="mt-3 flex items-end space-x-1 h-8">
        {sample.waveform.map((height, index) => (
          <motion.div
            key={index}
            className={`w-1 rounded-full transition-colors duration-300 ${
              isActive ? 'bg-purple-400' : 'bg-gray-300'
            }`}
            style={{ height: `${(height / 100) * 100}%` }}
            animate={{
              height: isPlaying && (index / sample.waveform.length) * 100 <= progress
                ? `${height * 1.2}%`
                : `${height}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>
      
      {/* Progress bar */}
      {isActive && (
        <motion.div
          className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-purple-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      )}
      
      {/* Sample tags */}
      <div className="mt-2 flex flex-wrap gap-1 justify-between items-center">
        <div className="flex gap-1">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
            {sample.culture}
          </span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
            {sample.mood}
          </span>
        </div>
        <button 
          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/dashboard/library?sample=${sample.id}`;
          }}
        >
          Learn More →
        </button>
      </div>
    </motion.div>
  );
};

// Generation demo component
const GenerationDemo = ({ selectedSample }: { selectedSample: typeof mizoSamples[0] | null }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const generateSoundLogo = async () => {
    if (!selectedSample) return;

    setIsGenerating(true);
    setGeneratedResult(null);

    // Simulate generation process
    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = {
      title: `${selectedSample.title} - Sound Logo`,
      description: 'AI-generated 10-second brand signature',
      duration: '0:10',
      audioUrl: '/audio/generated-sound-logo.mp3',
      style: 'Modern Corporate',
      mood: 'Professional',
    };

    setGeneratedResult(result);
    setIsGenerating(false);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          <span>AI Generation Demo</span>
        </CardTitle>
        <CardDescription>
          Transform cultural sounds into modern business assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSample ? (
          <>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Selected Sample:</p>
              <p className="font-medium">{selectedSample.title}</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Generation Type</label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-lg">
                  <option>Sound Logo (10s)</option>
                  <option>Background Music (60s)</option>
                  <option>Social Media Clip (15s)</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Style</label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-lg">
                  <option>Modern Corporate</option>
                  <option>Cinematic</option>
                  <option>Ambient</option>
                  <option>Electronic</option>
                </select>
              </div>
            </div>

            <Button
              onClick={generateSoundLogo}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Sound Logo
                </>
              )}
            </Button>

            {/* Generation result */}
            <AnimatePresence>
              {generatedResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-800">Generation Complete!</h4>
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  
                  <p className="text-sm text-green-700 mb-3">{generatedResult.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = '/dashboard/generate'}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Try Full Generator
                      </Button>
                    </div>
                    <span className="text-xs text-green-600">{generatedResult.duration}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generation progress */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="text-sm text-gray-600">Processing...</div>
                {['Analyzing source audio', 'Applying AI transformation', 'Generating output'].map((step, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 1 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-purple-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: index * 1 }}
                    />
                    <span className="text-xs text-gray-600">{step}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Wand2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a sample to start generating</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function InteractiveDemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedSample, setSelectedSample] = useState<typeof mizoSamples[0] | null>(null);

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Try It Now
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of AI-driven cultural music generation. 
            Select a Mizo sample and create your own sound logo instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sample selection */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-purple-600" />
                  <span>Select a Cultural Sample</span>
                </CardTitle>
                <CardDescription>
                  Choose from authentic Mizo instruments and sounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mizoSamples.map((sample, index) => (
                  <motion.div
                    key={sample.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <MiniPlayer
                      sample={sample}
                      isActive={selectedSample?.id === sample.id}
                      onPlay={() => setSelectedSample(sample)}
                    />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Generation demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GenerationDemo selectedSample={selectedSample} />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-gray-600 mb-6">
            Ready to explore the full library and advanced generation features?
          </p>
          <Button 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => window.location.href = '/register'}
          >
            Start Creating for Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
}