'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Star, Quote, Users, Music, DollarSign, Globe } from 'lucide-react';
import CountUp from 'react-countup';

// Animated counter component
const AnimatedStat = ({ 
  value, 
  suffix = '', 
  prefix = '',
  duration = 2 
}: { 
  value: number; 
  suffix?: string; 
  prefix?: string;
  duration?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30%" });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  return (
    <span ref={ref}>
      {isVisible ? (
        <CountUp 
          start={0}
          end={value} 
          duration={duration} 
          suffix={suffix}
          prefix={prefix}
          separator=","
        />
      ) : (
        `${prefix}0${suffix}`
      )}
    </span>
  );
};

// Testimonial interface
interface Testimonial {
  text: string;
  author: string;
  role: string;
  community: string;
}

// Testimonial card with parallax effect
const TestimonialCard = ({ 
  testimonial, 
  index 
}: { 
  testimonial: Testimonial; 
  index: number;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      {/* Quote icon */}
      <motion.div
        className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-6"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <Quote className="w-6 h-6 text-purple-600" />
      </motion.div>

      {/* Testimonial text */}
      <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
        "{testimonial.text}"
      </blockquote>

      {/* Rating */}
      <div className="flex items-center mb-4">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.1 + i * 0.1 }}
            viewport={{ once: true }}
          >
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          </motion.div>
        ))}
      </div>

      {/* Author info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold mr-4"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {testimonial.author.split(' ').map((n: string) => n[0]).join('')}
          </motion.div>
          <div>
            <p className="font-semibold text-gray-900">{testimonial.author}</p>
            <p className="text-gray-600 text-sm">{testimonial.role}</p>
            <p className="text-purple-600 text-sm">{testimonial.community}</p>
          </div>
        </div>
        
        {/* Share button */}
        <motion.button
          className="text-gray-400 hover:text-purple-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Cultural Sound Lab Testimonial',
                text: `"${testimonial.text}" - ${testimonial.author}`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(`"${testimonial.text}" - ${testimonial.author}, ${testimonial.role}`);
            }
          }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Community impact stats
const stats = [
  {
    icon: Users,
    value: 1200,
    suffix: '+',
    label: 'Heritage Keepers',
    description: 'Artists preserving traditions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    link: '/register',
  },
  {
    icon: Music,
    value: 3500,
    suffix: '+',
    label: 'Authentic Recordings',
    description: 'Cultural masterpieces',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    link: '/dashboard/library',
  },
  {
    icon: DollarSign,
    value: 150000,
    prefix: '$',
    suffix: '+',
    label: 'Supporting Artists',
    description: 'Ethical compensation',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    link: '/register',
  },
  {
    icon: Globe,
    value: 45,
    suffix: '+',
    label: 'Cultural Traditions',
    description: 'Stories preserved',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    link: '/dashboard/library',
  },
];

// Testimonials data
const testimonials = [
  {
    text: "Cultural Sound Lab has transformed how we share our Mizo musical heritage. The platform honors our traditions while creating meaningful opportunities for our community to thrive.",
    author: "Lalrinpuii Sailo",
    role: "Traditional Music Keeper",
    community: "Mizo Cultural Association",
  },
  {
    text: "As a creator, I treasure having access to authentic cultural sounds with respectful licensing. The platform helps me craft unique content while honoring the source traditions.",
    author: "Marcus Chen",
    role: "Digital Storyteller",
    community: "Cultural Content Creator",
  },
  {
    text: "This platform ensures our ancestral music receives the respect and recognition it deserves. For the first time, I'm earning meaningful support while preserving our heritage properly.",
    author: "Zothanmawii",
    role: "Folk Singer & Curator",
    community: "Aizawl, Mizoram",
  },
  {
    text: "We discovered our perfect sonic identity through Cultural Sound Lab. The authenticity and reverence for Mizo traditions elevated our brand story beyond expectations.",
    author: "Sarah Williams",
    role: "Brand Storyteller",
    community: "Creative Agency",
  },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        {/* Animated background elements */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Honoring Cultural Legacy
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Where ancient melodies find new life, artists receive recognition, 
            and cultural treasures are preserved for generations to come.
          </p>
        </motion.div>

        {/* Community Impact Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = stat.link}
            >
              <motion.div
                className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </motion.div>
              
              <motion.div
                className="text-4xl md:text-5xl font-bold mb-2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                viewport={{ once: true }}
              >
                <AnimatedStat 
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={2 + index * 0.2}
                />
              </motion.div>
              
              <h3 className="text-lg font-semibold mb-1">{stat.label}</h3>
              <p className="text-gray-400 text-sm">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Heritage Preservation Message */}
        <motion.div
          className="text-center mb-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              A Living Heritage
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              In the misty hills of Mizoram, where bamboo forests hold centuries of musical wisdom, 
              each melody carries the soul of a people. Cultural Sound Lab ensures these treasures 
              don't fade into memory but flourish in new forms. We honor the past while embracing 
              the future, creating a bridge where tradition and innovation dance together.
            </p>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-3xl font-bold text-center mb-12">
            What Our Community Says
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                testimonial={testimonial}
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold mb-4">
            Join the Heritage Renaissance
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're a cultural keeper, creative professional, or organization seeking 
            authentic sounds, become part of our mission to honor and preserve musical heritage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/register'}
            >
              Honor Your Heritage
            </motion.button>
            
            <motion.button
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 rounded-full transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/dashboard/library'}
            >
              Discover Treasures
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}