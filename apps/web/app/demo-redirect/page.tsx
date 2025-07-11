'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, ArrowRight, Sparkles, Music, User } from 'lucide-react';

export default function DemoRedirectPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/register';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="text-center shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Wand2 className="w-10 h-10 text-white" />
            </motion.div>
            
            <CardTitle className="text-3xl font-bold mb-2">
              Ready to Create Amazing Music?
            </CardTitle>
            
            <p className="text-xl text-gray-600">
              You've experienced our demo! Now unlock the full power of Cultural Sound Lab.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Features preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                className="p-4 bg-purple-50 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Music className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Full Library Access</h3>
                <p className="text-sm text-gray-600">3,500+ cultural sounds</p>
              </motion.div>
              
              <motion.div
                className="p-4 bg-pink-50 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <h3 className="font-semibold">Advanced AI Tools</h3>
                <p className="text-sm text-gray-600">Unlimited generations</p>
              </motion.div>
              
              <motion.div
                className="p-4 bg-blue-50 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Creator Dashboard</h3>
                <p className="text-sm text-gray-600">Track your projects</p>
              </motion.div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 text-lg"
                  onClick={() => window.location.href = '/register'}
                >
                  Start Creating for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              
              <motion.p
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Redirecting automatically in {countdown} seconds...
              </motion.p>
              
              <motion.div
                className="text-xs text-gray-400 space-x-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="hover:text-gray-600 transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}