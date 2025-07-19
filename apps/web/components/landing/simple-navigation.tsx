'use client';

import { Button } from '@/components/ui/button';
import { AudioWaveform } from 'lucide-react';

export function SimpleNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <AudioWaveform className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              Cultural Sound Lab
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => window.location.href = '/dashboard/library'}
            >
              Library
            </button>
            <button 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => window.location.href = '/dashboard/generate'}
            >
              Generate
            </button>
            <button 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => window.location.href = '/dashboard'}
            >
              Dashboard
            </button>
            
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
          </div>
        </div>
      </div>
    </nav>
  );
}