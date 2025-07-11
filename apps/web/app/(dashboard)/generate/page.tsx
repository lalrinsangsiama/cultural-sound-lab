"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import MultiStepGenerationForm from "@/components/generation/MultiStepGenerationForm";

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

  const handleGenerationComplete = (result: GenerationResult) => {
    setGenerationHistory(prev => [result, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Music Generation</h2>
          <p className="text-gray-600">Create new compositions from cultural sound samples</p>
        </div>
        <Sparkles className="h-8 w-8 text-primary" />
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
                <div className="text-center py-8">
                  <p className="text-gray-500">No generations yet. Create your first audio generation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generationHistory.map((generation) => (
                    <Card key={generation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{generation.title}</h4>
                            <p className="text-sm text-gray-500">
                              Duration: {Math.floor(generation.duration / 60)}:{(generation.duration % 60).toString().padStart(2, '0')} • 
                              Created: {new Date(generation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {/* Action buttons would go here */}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}