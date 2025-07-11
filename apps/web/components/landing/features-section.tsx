'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Brain, DollarSign, Globe, Building2 } from 'lucide-react';
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
        <Brain className="w-16 h-16 text-purple-500" />
      </motion.div>
      
      {/* Pulsing rings */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute inset-0 border-2 border-purple-300 rounded-full"
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
          className="absolute text-purple-400 text-xl font-bold"
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
        className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-green-400 relative overflow-hidden"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Continents (simplified) */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-green-600 rounded-full opacity-70"
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
          className="absolute w-4 h-4 bg-red-500 rounded-full shadow-lg flex items-center justify-center"
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
            className="text-white text-xs"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: pin.delay }}
          >
            ♪
          </motion.span>
          
          {/* Pin wave effect */}
          <motion.div
            className="absolute inset-0 border-2 border-red-300 rounded-full"
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
    { name: 'Spotify', color: 'bg-green-500' },
    { name: 'Apple', color: 'bg-gray-800' },
    { name: 'YouTube', color: 'bg-red-500' },
    { name: 'TikTok', color: 'bg-black' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-32 h-32 mx-auto">
      {logos.map((logo, index) => (
        <motion.div
          key={index}
          className={`${logo.color} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg`}
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
            transition: { duration: 0.2 }
          }}
        >
          {logo.name.slice(0, 2)}
        </motion.div>
      ))}
    </div>
  );
};

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Generation',
    description: 'Transform traditional sounds into modern compositions using cutting-edge AI technology.',
    animation: <AIAnimation />,
    stats: null,
    link: '/generate',
    cta: 'Try AI Generation',
  },
  {
    icon: DollarSign,
    title: 'Fair Revenue Sharing',
    description: 'Creators receive up to 85% of revenue through transparent blockchain-based distribution.',
    animation: null,
    stats: (
      <div className="text-center space-y-2">
        <div className="text-4xl font-bold text-green-500">
          <AnimatedCounter end={85} />
        </div>
        <div className="text-sm text-gray-600">Revenue to Creators</div>
      </div>
    ),
    link: '/register',
    cta: 'Start Earning',
  },
  {
    icon: Globe,
    title: 'Cultural Preservation',
    description: 'Every sound comes with rich cultural context and stories, preserving heritage for future generations.',
    animation: <GlobeAnimation />,
    stats: null,
    link: '/library',
    cta: 'Explore Cultures',
  },
  {
    icon: Building2,
    title: 'Business Solutions',
    description: 'Ready-to-use audio for brands, content creators, and enterprises across all major platforms.',
    animation: <BusinessLogosAnimation />,
    stats: null,
    link: '/register',
    cta: 'For Business',
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Revolutionizing Cultural Music
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform bridges traditional heritage with modern technology, 
            creating new opportunities for artists and preserving cultural legacy.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              {/* Icon */}
              <motion.div
                className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className="w-6 h-6 text-purple-600" />
              </motion.div>

              {/* Animation or Stats */}
              {feature.animation && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                >
                  {feature.animation}
                </motion.div>
              )}
              
              {feature.stats && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                >
                  {feature.stats}
                </motion.div>
              )}

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {feature.description}
              </p>

              {/* CTA Button */}
              <motion.button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = feature.link}
              >
                {feature.cta}
              </motion.button>

              {/* Hover effect indicator */}
              <motion.div
                className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-4 origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}