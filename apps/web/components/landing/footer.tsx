'use client';

import { motion } from 'framer-motion';
import { AudioWaveform, Heart, Github, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-obsidian border-t border-charcoal py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gold rounded-medium flex items-center justify-center">
                <AudioWaveform className="w-5 h-5 text-obsidian" />
              </div>
              <span className="font-display text-h3 font-bold text-white">
                Cultural Sound Lab
              </span>
            </div>
            <p className="text-ash text-body mb-6 max-w-md leading-relaxed">
              Empowering traditional musicians to monetize their heritage through AI-powered 
              generation, licensing, and creative tools. Preserving culture while enabling innovation.
            </p>
            <div className="flex items-center space-x-2 text-silver">
              <span className="text-small">Made with</span>
              <Heart className="w-4 h-4 text-gold" />
              <span className="text-small">for cultural preservation</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-h4 font-medium text-white mb-6">Platform</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => window.location.href = '/library'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  Browse Library
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/generate'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  AI Generation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/health'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  System Status
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Community */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-h4 font-medium text-white mb-6">Community</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  Become a Contributor
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  Creator Program
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/dashboard/help'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  Cultural Guidelines
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/dashboard/case-studies'}
                  className="text-ash hover:text-gold transition-colors text-small"
                >
                  Success Stories
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-h4 font-medium text-white mb-6">Stay Updated</h3>
            <p className="text-ash text-small mb-6 leading-relaxed">
              Get the latest cultural sounds and platform updates.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-charcoal border border-slate rounded-small text-white placeholder-ash text-small focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
              <button
                className="px-6 py-3 bg-gold hover:bg-champagne text-obsidian text-small font-medium rounded-small transition-all duration-200"
                onClick={() => {
                  // TODO: Implement newsletter signup
                  alert('Newsletter signup coming soon!');
                }}
              >
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-charcoal mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <div className="text-silver text-small font-mono mb-4 md:mb-0">
            © 2024 Cultural Sound Lab. Preserving heritage, enabling innovation.
          </div>
          
          <div className="flex items-center space-x-6">
            <a 
              href="https://twitter.com/culturalsoundlab" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash hover:text-gold transition-colors duration-200"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://instagram.com/culturalsoundlab" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash hover:text-gold transition-colors duration-200"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/culturalsoundlab" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash hover:text-gold transition-colors duration-200"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}