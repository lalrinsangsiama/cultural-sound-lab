'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AudioWaveform, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    { label: 'Library', href: '/dashboard/library' },
    { label: 'Generate', href: '/dashboard/generate' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'About', href: '#about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-white/10" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" aria-label="Cultural Sound Lab - Home">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 cursor-pointer"
            >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <AudioWaveform className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Cultural Sound Lab
            </span>
            </motion.div>
          </Link>
          
          {/* Desktop menu */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center space-x-6"
          >
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-2 py-1"
                aria-label={`Navigate to ${item.label}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.href.startsWith('#')) {
                      const element = document.querySelector(item.href);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        const featuresSection = document.querySelector('[data-section="features"]');
                        featuresSection?.scrollIntoView({ behavior: 'smooth' });
                      }
                    } else {
                      router.push(item.href);
                    }
                  }
                }}
                onClick={() => {
                  if (item.href.startsWith('#')) {
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      // Fallback to features section if target not found
                      const featuresSection = document.querySelector('[data-section="features"]');
                      featuresSection?.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    router.push(item.href);
                  }
                }}
              >
                {item.label}
              </button>
            ))}
            <div className="flex items-center space-x-4 ml-6">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
              <Button 
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/register'}
              >
                Get Started
              </Button>
            </div>
          </motion.div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 py-4"
              role="menu"
              aria-label="Mobile navigation menu"
            >
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    className="block w-full text-left text-white/80 hover:text-white transition-colors py-2 px-2 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
                    role="menuitem"
                    aria-label={`Navigate to ${item.label}`}
                    onClick={() => {
                      if (item.href.startsWith('#')) {
                        const element = document.querySelector(item.href);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          // Fallback to features section if target not found
                          const featuresSection = document.querySelector('[data-section="features"]');
                          featuresSection?.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        router.push(item.href);
                      }
                      setIsMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:bg-white/10"
                    onClick={() => {
                      window.location.href = '/login';
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="w-full bg-white text-purple-600 hover:bg-gray-100"
                    onClick={() => {
                      window.location.href = '/register';
                      setIsMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}