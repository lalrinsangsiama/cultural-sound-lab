'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Brain, DollarSign, Globe, Building2 } from 'lucide-react';
import { Button } from '@repo/ui';
import CountUp from 'react-countup';

// Animated percentage counter component
const AnimatedCounter = ({ end, suffix = '%', duration = 2 }: { end: number; suffix?: string; duration?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  return (
    <span ref={ref}>
      {isVisible ? (
        <CountUp end={end} duration={duration} suffix={suffix} />
      ) : (
        `0${suffix}`
      )}
    </span>
  );
};

// AI-powered generation animation
const AIAnimation = () => {
  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Central brain */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 bg-gold rounded-medium flex items-center justify-center">
          <Brain className="w-10 h-10 text-obsidian" />
        </div>
      </motion.div>
      
      {/* Pulsing rings */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute inset-0 border-2 border-gold/30 rounded-full"
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 2],
            opacity: [1, 0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.5,
          }}
        />
      ))}
      
      {/* Floating music notes */}
      {['♪', '♫', '♬'].map((note, index) => (
        <motion.div
          key={index}
          className="absolute text-gold/60 text-xl font-mono"
          style={{
            top: '10%',
            left: '10%',
            transform: `rotate(${index * 120}deg) translateY(-60px)`,
          }}
          animate={{
            y: [-5, 5, -5],
            rotate: [0, 360],
          }}
          transition={{
            y: { duration: 2, repeat: Infinity },
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            delay: index * 0.3,
          }}
        >
          {note}
        </motion.div>
      ))}
    </div>
  );
};

// Globe with music pins animation
const GlobeAnimation = () => {
  const pins = [
    { top: '20%', left: '30%', delay: 0 },
    { top: '40%', left: '60%', delay: 0.2 },
    { top: '60%', left: '25%', delay: 0.4 },
    { top: '30%', left: '70%', delay: 0.6 },
    { top: '70%', left: '50%', delay: 0.8 },
  ];

  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Globe */}
      <motion.div
        className="w-32 h-32 rounded-full bg-gradient-to-br from-charcoal to-slate relative overflow-hidden border-2 border-gold/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Continents (simplified) */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-gold/30 rounded-full"
              style={{
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 15 + 8}px`,
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Music pins */}
      {pins.map((pin, index) => (
        <motion.div
          key={index}
          className="absolute w-4 h-4 bg-gold rounded-full shadow-gold flex items-center justify-center"
          style={{ top: pin.top, left: pin.left }}
          initial={{ scale: 0, y: -20 }}
          animate={{ 
            scale: [0, 1.2, 1],
            y: [-20, 0],
          }}
          transition={{
            duration: 0.6,
            delay: pin.delay,
          }}
        >
          <motion.span
            className="text-obsidian text-xs font-mono"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: pin.delay }}
          >
            ♪
          </motion.span>
          
          {/* Pin wave effect */}
          <motion.div
            className="absolute inset-0 border-2 border-gold/30 rounded-full"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: pin.delay + 1,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Business logos animation
const BusinessLogosAnimation = () => {
  const logos = [
    { name: 'Spotify', icon: '♪' },
    { name: 'Apple', icon: '🎵' },
    { name: 'YouTube', icon: '🎬' },
    { name: 'TikTok', icon: '📱' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-32 h-32 mx-auto">
      {logos.map((logo, index) => (
        <motion.div
          key={index}
          className="bg-charcoal border border-gold/20 rounded-medium flex items-center justify-center text-gold text-xs font-mono shadow-subtle"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotate: 0,
          }}
          transition={{
            duration: 0.6,
            delay: index * 0.2,
            type: "spring",
            stiffness: 100,
          }}
          whileHover={{
            scale: 1.1,
            rotate: 5,
            borderColor: '#D4AF37',
            transition: { duration: 0.2 }
          }}
        >
          {logo.icon}
        </motion.div>
      ))}
    </div>
  );
};

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Creation',
    description: 'Transform authentic traditional sounds into contemporary compositions while preserving their cultural essence.',
    animation: <AIAnimation />,
    stats: null,
    link: '/dashboard/generate',
    cta: 'Experience the Magic',
  },
  {
    icon: DollarSign,
    title: 'Ethical Compensation',
    description: 'Artists and cultural keepers receive fair compensation through transparent revenue sharing.',
    animation: null,
    stats: (
      <div className="text-center space-y-3">
        <div className="text-h1 font-display font-bold text-gold font-mono">
          <AnimatedCounter end={85} />
        </div>
        <div className="text-small text-ash">Revenue to Artists</div>
      </div>
    ),
    link: '/register',
    cta: 'Support Artists',
  },
  {
    icon: Globe,
    title: 'Heritage Preservation',
    description: 'Each recording includes rich cultural stories and context, ensuring traditions live on for future generations.',
    animation: <GlobeAnimation />,
    stats: null,
    link: '/dashboard/library',
    cta: 'Explore Heritage',
  },
  {
    icon: Building2,
    title: 'Professional Licensing',
    description: 'Access authentic cultural audio with clear licensing for your creative and business projects.',
    animation: <BusinessLogosAnimation />,
    stats: null,
    link: '/register',
    cta: 'License Respectfully',
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="about" data-section="features" className="py-24 bg-gradient-to-br from-graphite to-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-display md:text-hero font-display font-bold text-white mb-6">
            Where Tradition Meets Innovation
          </h2>
          <p className="text-h3 md:text-h2 text-ash max-w-4xl mx-auto leading-relaxed">
            Experience centuries-old musical traditions reimagined for the modern world. 
            Every sound tells a story, every creation honors its source.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="studio-panel brushed-metal group cursor-pointer hover-lift"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
              }}
            >
              <div className="p-6">
                {/* Icon */}
                <motion.div
                  className="w-14 h-14 knob-control flex items-center justify-center mb-6"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <feature.icon className="w-7 h-7 text-gold" />
                  <div className="led-indicator absolute -top-1 -right-1"></div>
                </motion.div>

                {/* Animation or Stats */}
                {feature.animation && (
                  <motion.div
                    className="mb-6 spectrum-analyzer p-4 rounded-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {feature.animation}
                  </motion.div>
                )}
                
                {feature.stats && (
                  <motion.div
                    className="mb-6 vu-meter p-4 rounded-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {feature.stats}
                  </motion.div>
                )}

                {/* Content */}
                <h3 className="text-h4 font-display font-bold text-white mb-4 group-hover:text-gold transition-all duration-200 ease-refined">
                  {feature.title}
                </h3>
                <p className="text-body text-ash leading-relaxed mb-6 group-hover:text-silver transition-all duration-200 ease-refined">
                  {feature.description}
                </p>

                {/* CTA Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full group-hover:border-gold group-hover:text-gold border-glow"
                  onClick={() => window.location.href = feature.link}
                >
                  {feature.cta}
                </Button>

                {/* Hover effect indicator */}
                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-gold to-transparent mt-6 origin-center"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}