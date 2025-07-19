"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Music2, Play, Download, Clock, Trash2, Share2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import MultiStepGenerationForm from "@/components/generation/MultiStepGenerationForm";
import MobileGenerationForm from "@/components/generation/MobileGenerationForm";
import AudioPlayer from "@/components/audio/AudioPlayer";

interface GenerationResult {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  type: string;
  createdAt: string;
}

export default function GeneratePage() {
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const handleGenerationComplete = (result: GenerationResult) => {
    setGenerationHistory(prev => [result, ...prev]);
    toast({
      title: "Generation Complete!",
      description: `${result.title} has been created successfully.`,
      duration: 5000,
    });
  };

  const handlePlay = useCallback(async (generationId: string, audioUrl: string) => {
    try {
      if (isPlaying === generationId) {
        setIsPlaying(null);
        return;
      }
      
      setIsPlaying(generationId);
      
      // In a real implementation, you would play the actual audio
      // For now, we'll simulate playback
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsPlaying(null);
      
      toast({
        title: "Playback Complete",
        description: "Audio preview finished.",
      });
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Unable to play audio. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(null);
    }
  }, [isPlaying]);

  const handleDownload = useCallback(async (generation: GenerationResult) => {
    try {
      toast({
        title: "Download Started",
        description: `Downloading ${generation.title}...`,
      });
      
      // In a real implementation, this would trigger actual download
      // For demo purposes, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Download Complete",
        description: `${generation.title} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Unable to download file. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const handleDelete = useCallback((generationId: string) => {
    setGenerationHistory(prev => prev.filter(g => g.id !== generationId));
    toast({
      title: "Generation Deleted",
      description: "The generation has been removed from your history.",
    });
  }, []);

  const handleShare = useCallback((generation: GenerationResult) => {
    if (navigator.share) {
      navigator.share({
        title: generation.title,
        text: `Check out this AI-generated music: ${generation.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard.",
      });
    }
  }, []);

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileGenerationForm onGenerationComplete={handleGenerationComplete} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Music Generation
            </h2>
            <p className="text-gray-600 text-lg">
              Transform cultural sound samples into unique compositions
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                AI Models Online
              </span>
              <span>{generationHistory.length} generations created</span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="history">Generation History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <MultiStepGenerationForm onGenerationComplete={handleGenerationComplete} />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>Your previously generated audio content</CardDescription>
              </CardHeader>
              <CardContent>
                {generationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Music2 className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">No generations yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Start creating unique musical compositions from cultural sound samples. 
                      Your generations will appear here for easy access and management.
                    </p>
                    <Button 
                      onClick={() => {
                        const element = document.querySelector('[data-state="active"][value="create"]') as HTMLElement;
                        element?.click();
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Your First Generation
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {generationHistory.map((generation) => {
                      const isCurrentlyPlaying = isPlaying === generation.id;
                      return (
                        <Card key={generation.id} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-lg truncate text-gray-900">{generation.title}</h4>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                    >
                                      {generation.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(generation.duration / 60)}:{(generation.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleShare(generation)}>
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(generation.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                Created: {new Date(generation.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              
                              <div className="space-y-2">
                                <Button 
                                  variant={isCurrentlyPlaying ? "default" : "outline"}
                                  size="sm" 
                                  className="w-full h-9"
                                  onClick={() => handlePlay(generation.id, generation.audioUrl)}
                                  disabled={isPlaying !== null && !isCurrentlyPlaying}
                                >
                                  {isCurrentlyPlaying ? (
                                    <>
                                      <div className="animate-pulse h-3 w-3 mr-2 bg-white rounded-full" />
                                      Playing...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3 mr-2" />
                                      Preview
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-9"
                                  onClick={() => handleDownload(generation)}
                                >
                                  <Download className="h-3 w-3 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}