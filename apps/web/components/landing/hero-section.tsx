'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Button, PlayButton } from '@repo/ui';
import { Volume2 } from 'lucide-react';

// Refined floating musical notes component
const FloatingNotes = () => {
  const notes = ['♪', '♫', '♬', '♩', '♭', '♯'];
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-gold/10 text-2xl font-mono"
          initial={{
            x: Math.random() * dimensions.width,
            y: dimensions.height + 50,
            rotate: 0,
          }}
          animate={{
            x: Math.random() * dimensions.width,
            y: -50,
            rotate: 360,
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 15,
            ease: "linear",
          }}
        >
          {notes[Math.floor(Math.random() * notes.length)]}
        </motion.div>
      ))}
    </div>
  );
};

// Audio wave visualization component
const AudioWaveVisualization = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const initAudioVisualization = async () => {
    if (!audioRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    } catch (error) {
      console.error('Error initializing audio visualization:', error);
    }
  };

  const drawVisualization = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = dataArrayRef.current;
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / dataArray.length;
    let x = 0;

    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(0.5, '#F4D03F');
    gradient.addColorStop(1, '#FFF8DC');

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = ((dataArray[i] ?? 0) / 255) * canvas.height * 0.8;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      
      x += barWidth;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawVisualization);
    }
  };

  const drawDemoVisualization = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 50;
    const barWidth = canvas.width / barCount;
    
    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#D4AF37');
      gradient.addColorStop(0.5, '#F4D03F');
      gradient.addColorStop(1, '#FFF8DC');

      for (let i = 0; i < barCount; i++) {
        const barHeight = (Math.sin(Date.now() * 0.005 + i * 0.2) * 0.5 + 0.5) * canvas.height * 0.8;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      try {
        if (!audioContextRef.current) {
          await initAudioVisualization();
        }
        
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
        drawVisualization();
      } catch (error) {
        console.warn('Audio playback failed, showing demo visualization instead');
        // Show demo visualization even without audio
        setIsPlaying(true);
        drawDemoVisualization();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src="/audio/demo-preview.mp3"
        loop
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          console.warn('Demo audio file not found, using fallback visualization');
          setIsPlaying(false);
        }}
      />
      
      <div className="glass-refined rounded-medium p-6 hover-audio-glow animate-studio-breathe">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="knob-control w-6 h-6 flex items-center justify-center">
              <Volume2 className="w-3 h-3 text-gold" />
              <div className="led-indicator absolute -top-1 -right-1"></div>
            </div>
            <span className="text-white font-display font-medium text-body">Cultural Sound Preview</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="led-indicator"></div>
            <PlayButton
              isPlaying={isPlaying}
              onToggle={togglePlay}
              size="sm"
              className="click-ripple"
            />
          </div>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="w-full h-20 rounded-small bg-charcoal/50 border border-gold/10"
          />
          
          {/* Professional Studio Overlay */}
          <div className="absolute top-2 left-2 flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="knob-control w-2 h-2" />
            ))}
          </div>
          
          <div className="absolute top-2 right-2 frequency-analyzer w-8 h-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="frequency-bar spectrum-bar" />
            ))}
          </div>
          
          <div className="absolute bottom-2 left-2 flex items-center space-x-2">
            <div className="led-indicator amber"></div>
            <span className="text-caption text-gold font-mono">96kHz</span>
          </div>
          
          <div className="absolute bottom-2 right-2 data-visualization w-12 h-1"></div>
        </div>
      </div>
    </div>
  );
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-obsidian">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian via-graphite to-charcoal" />
      
      {/* Floating musical notes */}
      <FloatingNotes />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          {/* Main headline */}
          <motion.h1
            className="text-hero md:text-hero font-display font-bold text-white leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Preserve & Share
            <br />
            <span className="text-gradient-gold">
              Musical Heritage
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            className="text-h3 md:text-h2 text-ash max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Access centuries-old cultural sounds and transform them into modern compositions. 
            Honor traditions while creating new musical possibilities.
          </motion.p>
          
          {/* Audio visualization */}
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <AudioWaveVisualization />
          </motion.div>
          
          {/* Enhanced CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <Button
                variant="gold"
                size="lg"
                className="px-8 py-4 text-h4 font-medium click-ripple animate-gold-pulse hover-console-lift"
                onClick={() => window.location.href = '/dashboard/library'}
              >
                Discover Heritage
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="secondary"
                size="lg"
                className="px-8 py-4 text-h4 font-medium"
                onClick={() => window.location.href = '/register'}
              >
                Join the Studio
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Stats preview */}
          <motion.div
            className="grid grid-cols-3 gap-12 max-w-3xl mx-auto pt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            {[
              { value: '500+', label: 'Heritage Recordings', link: '/library' },
              { value: '50+', label: 'Cultural Communities', link: '/library' },
              { value: '100k+', label: 'Artists Supported', link: '/register' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (stat.link === '/library') {
                    window.location.href = '/dashboard/library';
                  } else {
                    window.location.href = stat.link;
                  }
                }}
              >
                <div className="text-h1 md:text-display font-bold text-white font-mono">
                  {stat.value}
                </div>
                <div className="text-silver text-body mt-2 group-hover:text-gold transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
          });
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="w-6 h-10 border-2 border-silver rounded-full flex justify-center hover:border-gold transition-colors">
          <motion.div
            className="w-1 h-2 bg-gold rounded-full mt-2"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      </motion.div>
    </section>
  );
}