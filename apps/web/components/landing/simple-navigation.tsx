'use client';

import { Button } from '@repo/ui';
import { AudioWaveform } from 'lucide-react';

export function SimpleNavigation() {
  return (
    <nav className="nav-refined fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gold rounded-medium flex items-center justify-center">
              <AudioWaveform className="w-5 h-5 text-obsidian" />
            </div>
            <span className="font-display font-bold text-h4 text-white">
              Cultural Sound Lab
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button 
              className="nav-link"
              onClick={() => window.location.href = '/dashboard/library'}
            >
              Library
            </button>
            <button 
              className="nav-link"
              onClick={() => window.location.href = '/dashboard/generate'}
            >
              Generate
            </button>
            <button 
              className="nav-link"
              onClick={() => window.location.href = '/dashboard'}
            >
              Dashboard
            </button>
            
            <div className="flex items-center space-x-4 ml-8">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
              <Button 
                variant="gold"
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