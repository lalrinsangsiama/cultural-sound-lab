"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@repo/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@repo/ui";
import { 
  User, 
  Mail, 
  Lock, 
  Globe, 
  ArrowLeft, 
  Sparkles, 
  Music,
  Mic,
  Headphones,
  Users,
  Award
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    culturalAffiliation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signUp, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    const result = await signUp(
      formData.email, 
      formData.password,
      {
        name: formData.name,
        cultural_affiliation: formData.culturalAffiliation,
        role: 'user'
      }
    );

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Registration successful! Please check your email to confirm your account.");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-gold-glow" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gold/3 rounded-full blur-3xl animate-gold-glow" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            href="/" 
            className="inline-flex items-center text-ash hover:text-gold transition-colors text-small"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </motion.div>

        {/* Studio Branding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gold rounded-medium flex items-center justify-center shadow-gold">
              <Mic className="w-8 h-8 text-obsidian" />
            </div>
          </div>
          <h1 className="font-display text-display font-bold text-white mb-2">
            Join the Studio
          </h1>
          <p className="text-body text-ash">
            Begin your journey in cultural music preservation and creation
          </p>
        </motion.div>

        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="refined" className="glass-refined border-glow">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-h2 font-display font-bold text-white mb-2">
                  Create Account
                </h2>
                <p className="text-body text-ash">
                  Begin preserving and sharing your cultural music heritage
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center space-x-2 text-small text-silver">
                  <Users className="w-4 h-4 text-gold" />
                  <span>Community Access</span>
                </div>
                <div className="flex items-center space-x-2 text-small text-silver">
                  <Award className="w-4 h-4 text-gold" />
                  <span>Fair Recognition</span>
                </div>
                <div className="flex items-center space-x-2 text-small text-silver">
                  <Music className="w-4 h-4 text-gold" />
                  <span>Creative Tools</span>
                </div>
                <div className="flex items-center space-x-2 text-small text-silver">
                  <Headphones className="w-4 h-4 text-gold" />
                  <span>Studio Tools</span>
                </div>
              </div>
              
              {error && (
                <div className="bg-ruby/10 border border-ruby/20 rounded-medium p-4 mb-6">
                  <p className="text-small text-ruby">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-emerald/10 border border-emerald/20 rounded-medium p-4 mb-6">
                  <p className="text-small text-emerald">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-small font-medium text-silver">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="pl-10 input-refined h-11"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-small font-medium text-silver">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-10 input-refined h-11"
                      required
                    />
                  </div>
                </div>

                {/* Cultural Affiliation Field */}
                <div className="space-y-2">
                  <Label htmlFor="culturalAffiliation" className="text-small font-medium text-silver">
                    Cultural Heritage <span className="text-ash">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                    <Input
                      id="culturalAffiliation"
                      type="text"
                      placeholder="e.g., Mizo, Cherokee, Irish, Tibetan"
                      value={formData.culturalAffiliation}
                      onChange={(e) => handleChange("culturalAffiliation", e.target.value)}
                      className="pl-10 input-refined h-11"
                    />
                  </div>
                  <p className="text-caption text-ash">
                    Help us understand your cultural background for better recommendations
                  </p>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-small font-medium text-silver">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="pl-10 input-refined h-11"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-small font-medium text-silver">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className="pl-10 input-refined h-11"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full mr-2" />
                      Creating your studio...
                    </div>
                  ) : (
                    <>
                      Create Studio Account
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Terms */}
              <div className="mt-6 text-center">
                <p className="text-caption text-ash">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-gold hover:text-champagne transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-gold hover:text-champagne transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-6 border-t border-charcoal mt-6">
                <p className="text-small text-ash">
                  Already have a studio account?{" "}
                  <Link 
                    href="/login" 
                    className="text-gold hover:text-champagne font-medium transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-small text-ash"
        >
          <p>© 2024 Cultural Sound Lab</p>
          <p className="mt-1 text-caption">Preserving heritage, enabling innovation</p>
        </motion.div>
      </div>
    </div>
  );
}