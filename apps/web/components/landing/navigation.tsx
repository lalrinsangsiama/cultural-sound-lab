'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Waveform, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Library', href: '/library' },
    { label: 'Generate', href: '/generate' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Health Check', href: '/health' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Waveform className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Cultural Sound Lab
            </span>
          </motion.div>
          
          {/* Desktop menu */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center space-x-6"
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="text-white/80 hover:text-white transition-colors"
                onClick={() => window.location.href = item.href}
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
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 py-4"
            >
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    className="block w-full text-left text-white/80 hover:text-white transition-colors py-2"
                    onClick={() => {
                      window.location.href = item.href;
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