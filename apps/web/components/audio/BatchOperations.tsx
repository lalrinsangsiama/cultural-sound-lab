"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  CheckSquare,
  Square,
  Download,
  Plus,
  Trash2,
  Share,
  Tag,
  FolderPlus,
  X,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioSample } from "@/lib/types/audio";

interface BatchOperationsProps {
  selectedSamples: string[];
  allSamples: AudioSample[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkDownload?: (sampleIds: string[]) => void;
  onCreateCollection?: (sampleIds: string[], collectionName: string) => void;
  onBulkTag?: (sampleIds: string[], tags: string[]) => void;
  onBulkDelete?: (sampleIds: string[]) => void;
  onBulkShare?: (sampleIds: string[]) => void;
  className?: string;
}

interface Collection {
  id: string;
  name: string;
  sampleCount: number;
  createdAt: string;
}

export default function BatchOperations({
  selectedSamples,
  allSamples,
  onSelectionChange,
  onBulkDownload,
  onCreateCollection,
  onBulkTag,
  onBulkDelete,
  onBulkShare,
  className
}: BatchOperationsProps) {
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [newTags, setNewTags] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string>("");

  const selectedSampleObjects = allSamples.filter(sample => selectedSamples.includes(sample.id));
  const isAllSelected = allSamples.length > 0 && selectedSamples.length === allSamples.length;
  const isPartiallySelected = selectedSamples.length > 0 && selectedSamples.length < allSamples.length;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allSamples.map(sample => sample.id));
    }
  }, [isAllSelected, allSamples, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleAction = async (action: () => Promise<void> | void, actionName: string) => {
    setIsProcessing(true);
    setProcessingAction(actionName);
    try {
      await action();
    } finally {
      setIsProcessing(false);
      setProcessingAction("");
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    await handleAction(async () => {
      await onCreateCollection?.(selectedSamples, newCollectionName);
      setNewCollectionName("");
      setIsCollectionDialogOpen(false);
    }, "Creating collection");
  };

  const handleBulkTag = async () => {
    if (!newTags.trim()) return;
    
    const tags = newTags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    await handleAction(async () => {
      await onBulkTag?.(selectedSamples, tags);
      setNewTags("");
      setIsTagDialogOpen(false);
    }, "Adding tags");
  };

  const handleBulkDownload = async () => {
    await handleAction(async () => {
      await onBulkDownload?.(selectedSamples);
    }, "Preparing download");
  };

  const handleBulkShare = async () => {
    await handleAction(async () => {
      await onBulkShare?.(selectedSamples);
    }, "Sharing samples");
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedSamples.length} samples?`)) {
      await handleAction(async () => {
        await onBulkDelete?.(selectedSamples);
        onSelectionChange([]);
      }, "Deleting samples");
    }
  };

  const getTotalSize = () => {
    return selectedSampleObjects.reduce((total, sample) => total + sample.fileSize, 0);
  };

  const getTotalDuration = () => {
    return selectedSampleObjects.reduce((total, sample) => total + sample.duration, 0);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (selectedSamples.length === 0) {
    return (
      <Card className={cn("border-dashed border-2 border-gray-300", className)}>
        <CardContent className="p-6 text-center">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-muted-foreground">
            Select samples to perform batch operations
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            className="mt-2"
          >
            Select All ({allSamples.length})
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/30 bg-primary/5", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="p-1"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : isPartiallySelected ? (
                  <div className="h-5 w-5 border-2 border-primary bg-primary/20 rounded flex items-center justify-center">
                    <div className="h-2 w-2 bg-primary rounded-sm" />
                  </div>
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </Button>
              
              <div>
                <h3 className="font-semibold text-sm">
                  {selectedSamples.length} sample{selectedSamples.length !== 1 ? 's' : ''} selected
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatSize(getTotalSize())} • {formatDuration(getTotalDuration())}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected samples preview */}
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {selectedSampleObjects.slice(0, 10).map((sample) => (
              <Badge key={sample.id} variant="secondary" className="text-xs">
                {sample.title}
              </Badge>
            ))}
            {selectedSampleObjects.length > 10 && (
              <Badge variant="outline" className="text-xs">
                +{selectedSampleObjects.length - 10} more
              </Badge>
            )}
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Primary actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleBulkDownload}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing && processingAction === "Preparing download" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download All
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsCollectionDialogOpen(true)}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Create Collection
              </Button>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTagDialogOpen(true)}
                disabled={isProcessing}
              >
                <Tag className="h-4 w-4 mr-1" />
                Tag
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkShare}
                disabled={isProcessing}
              >
                {isProcessing && processingAction === "Sharing samples" ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Share className="h-4 w-4 mr-1" />
                )}
                Share
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          {/* Collection creation dialog */}
          {isCollectionDialogOpen && (
            <div className="border rounded-lg p-3 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Create New Collection</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollectionDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCollection();
                  }
                }}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing && processingAction === "Creating collection" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Create
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCollectionDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tag addition dialog */}
          {isTagDialogOpen && (
            <div className="border rounded-lg p-3 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Add Tags</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTagDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                placeholder="Enter tags separated by commas..."
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBulkTag();
                  }
                }}
              />
              
              <div className="text-xs text-muted-foreground">
                Example: traditional, ceremonial, peaceful
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkTag}
                  disabled={!newTags.trim() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing && processingAction === "Adding tags" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Tag className="h-3 w-3 mr-1" />
                      Add Tags
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTagDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 p-2 rounded">
              <Loader2 className="h-4 w-4 animate-spin" />
              {processingAction}...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}