"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  MessageCircle, 
  Mail, 
  ExternalLink, 
  Play, 
  ChevronDown, 
  ChevronRight,
  HelpCircle,
  Video,
  FileText,
  Users
} from "lucide-react";

const tutorials = [
  {
    id: "1",
    title: "Getting Started with Cultural Sound Lab",
    description: "Learn the basics of generating AI music from cultural samples",
    duration: "5 min",
    type: "video",
    completed: false
  },
  {
    id: "2", 
    title: "Understanding Cultural Context",
    description: "How to respect and preserve cultural heritage in your creations",
    duration: "8 min",
    type: "video",
    completed: true
  },
  {
    id: "3",
    title: "Advanced Generation Techniques",
    description: "Master complex parameters for professional results",
    duration: "12 min",
    type: "video",
    completed: false
  },
  {
    id: "4",
    title: "Licensing and Monetization Guide",
    description: "Everything you need to know about earning from your content",
    duration: "6 min",
    type: "guide",
    completed: false
  }
];

const faqData = [
  {
    id: "1",
    question: "How do I generate my first sound logo?",
    answer: "Navigate to the Generate page, select 'Sound Logo' as your type, choose 1-3 cultural samples, set your desired mood and duration (3-15 seconds), then click Generate. The AI will create a unique sound logo preserving the cultural essence of your selected samples."
  },
  {
    id: "2",
    question: "What are the different licensing types?",
    answer: "We offer three licensing tiers: Personal (free for non-commercial use), Commercial ($15-50 for business use), and Enterprise ($100+ for large-scale commercial projects). Each license includes proper cultural attribution and royalty distribution to original cultural communities."
  },
  {
    id: "3",
    question: "How are cultural communities compensated?",
    answer: "30% of all licensing revenue goes directly to the cultural communities whose samples were used. This is automatically distributed through our smart contract system, ensuring fair and transparent compensation for cultural preservation work."
  },
  {
    id: "4",
    question: "Can I collaborate with other creators?",
    answer: "Yes! Enable collaboration in your Settings > Privacy section. You can then invite other creators to work on projects together, share sample libraries, and co-create cultural fusion pieces."
  },
  {
    id: "5",
    question: "What file formats are supported?",
    answer: "Generated content is available in WAV (uncompressed), MP3 (compressed), and FLAC (lossless) formats. All downloads include embedded metadata with cultural attribution and licensing information."
  },
  {
    id: "6",
    question: "How long does generation typically take?",
    answer: "Most generations complete within 2-5 minutes. Sound logos (3-15 seconds) are fastest, while long-form content (3+ minutes) may take up to 10 minutes. You'll receive an email notification when complete."
  }
];

export default function HelpPage() {
  const [selectedFaq, setSelectedFaq] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "general",
    message: "",
    email: "demo@culturalsoundlab.com"
  });

  const handleFaqToggle = (faqId: string) => {
    setSelectedFaq(selectedFaq === faqId ? null : faqId);
  };

  const handleSupportSubmit = () => {
    console.log("Support form submitted:", supportForm);
    // Reset form
    setSupportForm({
      subject: "",
      category: "general", 
      message: "",
      email: "demo@culturalsoundlab.com"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Help & Resources</h2>
          <p className="text-gray-600">Get support and learn how to make the most of Cultural Sound Lab</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Video Tutorials</h3>
            <p className="text-sm text-gray-500">Learn step by step</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">FAQ</h3>
            <p className="text-sm text-gray-500">Common questions</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Community</h3>
            <p className="text-sm text-gray-500">Connect with creators</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Contact Support</h3>
            <p className="text-sm text-gray-500">Get direct help</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Tutorials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Interactive Tutorials
            </CardTitle>
            <CardDescription>Learn at your own pace with guided tutorials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tutorials.map((tutorial) => (
                <div key={tutorial.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {tutorial.type === "video" ? (
                        <Play className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{tutorial.title}</h4>
                      <p className="text-sm text-gray-500">{tutorial.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {tutorial.duration}
                        </Badge>
                        {tutorial.completed && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {tutorial.completed ? "Review" : "Start"}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Learning Progress</h4>
                  <p className="text-sm text-blue-700">1 of 4 tutorials completed</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">25%</div>
              </div>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {faqData.map((faq) => (
                <div key={faq.id} className="border rounded-lg">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => handleFaqToggle(faq.id)}
                  >
                    <span className="font-medium">{faq.question}</span>
                    {selectedFaq === faq.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {selectedFaq === faq.id && (
                    <div className="px-3 pb-3 text-sm text-gray-600 border-t bg-gray-50">
                      <div className="pt-3">{faq.answer}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Contact Support
          </CardTitle>
          <CardDescription>Can't find what you're looking for? Get in touch with our team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Support Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={supportForm.category}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="general">General Question</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="cultural">Cultural Context</option>
                  <option value="licensing">Licensing</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={supportForm.message}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please describe your issue in detail..."
                  className="min-h-[120px]"
                />
              </div>
              
              <Button onClick={handleSupportSubmit} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Response Times</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>General inquiries:</span>
                    <span className="text-gray-600">24-48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technical issues:</span>
                    <span className="text-gray-600">12-24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing questions:</span>
                    <span className="text-gray-600">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cultural concerns:</span>
                    <span className="text-gray-600">Priority response</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Other Ways to Get Help</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Join Community Forum
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentation
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="h-4 w-4 mr-2" />
                    Video Tutorials
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-1">Cultural Sensitivity</h4>
                <p className="text-sm text-yellow-700">
                  For questions about cultural appropriation, attribution, or proper usage of traditional music, 
                  we prioritize these inquiries and work with cultural consultants to provide guidance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}