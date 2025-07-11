'use client';

import { motion } from 'framer-motion';
import { Waveform, Heart, Github, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
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
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Waveform className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-xl font-bold">
                Cultural Sound Lab
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Empowering traditional musicians to monetize their heritage through AI-powered 
              generation, licensing, and creative tools. Preserving culture while enabling innovation.
            </p>
            <div className="flex items-center space-x-1 text-gray-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for cultural preservation</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => window.location.href = '/library'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Browse Library
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/generate'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  AI Generation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/health'}
                  className="text-gray-300 hover:text-white transition-colors"
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
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Become a Contributor
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Creator Program
                </button>
              </li>
              <li>
                <a 
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Cultural Guidelines
                </a>
              </li>
              <li>
                <a 
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Success Stories
                </a>
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
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-300 text-sm mb-4">
              Get the latest cultural sounds and platform updates.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300"
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
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 Cultural Sound Lab. Preserving heritage, enabling innovation.
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors"
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