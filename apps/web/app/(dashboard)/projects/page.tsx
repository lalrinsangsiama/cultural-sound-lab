"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Share, Trash2, Edit } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Project } from "@/lib/types/audio";
import mizoSamplesData from "@/../../assets/sample-audio/mizo-samples.json";

const sampleNames = mizoSamplesData.samples.reduce((acc, sample) => {
  acc[sample.id] = sample.name;
  return acc;
}, {} as Record<string, string>);

const projects: Project[] = [
  {
    id: "1",
    title: "Mizo Drum Sound Logo",
    type: "sound_logo",
    status: "completed",
    duration: 12,
    createdAt: "2024-01-15T10:30:00Z",
    resultUrl: "/api/projects/1/download",
    description: "Energetic sound logo for tech startup",
    sourceSamples: ["mizo-khuang-01", "mizo-tuibur-01"],
    parameters: {
      mood: "energetic",
      tempo: 120,
      brand_name: "TechStart"
    }
  },
  {
    id: "2",
    title: "Peaceful Background Playlist",
    type: "playlist",
    status: "completed",
    duration: 1800,
    createdAt: "2024-01-14T15:45:00Z",
    resultUrl: "/api/projects/2/download",
    description: "Ambient playlist for meditation app",
    sourceSamples: ["mizo-tuibur-01"],
    parameters: {
      mood: "peaceful",
      playlist_size: 10,
      tempo: 60
    }
  },
  {
    id: "3",
    title: "Instagram Reel Background",
    type: "social_clip",
    status: "processing",
    duration: 30,
    createdAt: "2024-01-16T09:15:00Z",
    description: "Upbeat clip for social media content",
    sourceSamples: ["mizo-darbu-01"],
    parameters: {
      mood: "upbeat",
      video_description: "Dance video"
    }
  },
  {
    id: "4",
    title: "Documentary Score",
    type: "long_form",
    status: "completed",
    duration: 180,
    createdAt: "2024-01-13T14:20:00Z",
    resultUrl: "/api/projects/4/download",
    description: "Atmospheric score for cultural documentary",
    sourceSamples: ["mizo-khuang-01", "mizo-tuibur-01", "mizo-darbu-01"],
    parameters: {
      mood: "atmospheric",
      cultural_style: "traditional"
    }
  },
  {
    id: "5",
    title: "Brand Jingle",
    type: "sound_logo",
    status: "failed",
    duration: 8,
    createdAt: "2024-01-12T11:00:00Z",
    description: "Failed generation - insufficient parameters",
    sourceSamples: ["mizo-khuang-01"],
    parameters: {
      brand_name: "Unknown"
    }
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "sound_logo":
      return "Sound Logo";
    case "playlist":
      return "Playlist";
    case "social_clip":
      return "Social Clip";
    case "long_form":
      return "Long-Form";
    default:
      return type;
  }
};

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const completedProjects = projects.filter(p => p.status === "completed");
  const processingProjects = projects.filter(p => p.status === "processing");
  const failedProjects = projects.filter(p => p.status === "failed");

  const handlePlay = (projectId: string) => {
    console.log(`Playing project ${projectId}`);
  };

  const handleDownload = (projectId: string) => {
    console.log(`Downloading project ${projectId}`);
  };

  const handleShare = (projectId: string) => {
    console.log(`Sharing project ${projectId}`);
  };

  const handleDelete = (projectId: string) => {
    console.log(`Deleting project ${projectId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600">Manage your generated audio content</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary">{projects.length} total projects</Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedProjects.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({processingProjects.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ProjectList projects={projects} onPlay={handlePlay} onDownload={handleDownload} onShare={handleShare} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ProjectList projects={completedProjects} onPlay={handlePlay} onDownload={handleDownload} onShare={handleShare} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <ProjectList projects={processingProjects} onPlay={handlePlay} onDownload={handleDownload} onShare={handleShare} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <ProjectList projects={failedProjects} onPlay={handlePlay} onDownload={handleDownload} onShare={handleShare} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectList({ 
  projects, 
  onPlay, 
  onDownload, 
  onShare, 
  onDelete 
}: {
  projects: Project[];
  onPlay: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {getTypeLabel(project.type)} • {formatDuration(project.duration)}
                </CardDescription>
              </div>
              <Badge 
                variant="secondary" 
                className={getStatusColor(project.status)}
              >
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{project.description}</p>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Source Samples:</p>
              <div className="flex flex-wrap gap-1">
                {project.sourceSamples.map((sampleId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {sampleNames[sampleId] || sampleId}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </div>
            
            <div className="flex gap-2">
              {project.status === "completed" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onPlay(project.id)}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDownload(project.id)}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </>
              )}
              
              {project.status === "processing" && (
                <Button variant="outline" size="sm" disabled className="flex-1">
                  <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
                  Processing
                </Button>
              )}
              
              {project.status === "failed" && (
                <Button variant="outline" size="sm" disabled className="flex-1">
                  Failed
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onShare(project.id)}
                disabled={project.status !== "completed"}
              >
                <Share className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}