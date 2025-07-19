'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

// Floating musical notes component
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
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/20 text-2xl font-bold"
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
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 20,
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
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(0.5, '#A78BFA');
    gradient.addColorStop(1, '#C4B5FD');

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
      gradient.addColorStop(0, '#8B5CF6');
      gradient.addColorStop(0.5, '#A78BFA');
      gradient.addColorStop(1, '#C4B5FD');

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
      
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Cultural Sound Preview</span>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          className="w-full h-20 rounded-lg"
        />
      </div>
    </div>
  );
};

export function HeroSection() {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      background: [
        'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'linear-gradient(45deg, #764ba2 0%, #667eea 50%, #f093fb 100%)',
        'linear-gradient(45deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
        'linear-gradient(45deg, #4facfe 0%, #00f2fe 50%, #667eea 100%)',
      ],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      }
    });
  }, [controls]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-90"
        animate={controls}
        style={{
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Floating musical notes */}
      <FloatingNotes />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Main headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Monetize Your
            <br />
            <motion.span
              className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Cultural Heritage
            </motion.span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform authentic cultural recordings into AI-powered music assets. 
            Create, license, and earn while preserving musical traditions.
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
          
          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-full shadow-lg"
                onClick={() => window.location.href = '/dashboard/library'}
              >
                Explore Sounds
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white/10 text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-4 text-lg rounded-full backdrop-blur-sm shadow-lg"
                onClick={() => window.location.href = '/register'}
              >
                Start Creating
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Stats preview */}
          <motion.div
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            {[
              { value: '500+', label: 'Cultural Sounds', link: '/library' },
              { value: '50+', label: 'Communities', link: '/library' },
              { value: '$100k+', label: 'Creator Earnings', link: '/register' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (stat.link === '/library') {
                    window.location.href = '/dashboard/library';
                  } else {
                    window.location.href = stat.link;
                  }
                }}
              >
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm mt-1 hover:text-white transition-colors">
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
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
          });
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center hover:border-white/80 transition-colors">
          <motion.div
            className="w-1 h-2 bg-white/70 rounded-full mt-2"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      </motion.div>
    </section>
  );
}