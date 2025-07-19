"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loading, LoadingSkeleton } from "@/components/ui/loading";
import { Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, Check } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    profile: {
      name: "Demo User",
      email: "demo@culturalsoundlab.com",
      culturalAffiliation: "Mizo",
      bio: "Cultural music creator passionate about preserving and sharing traditional sounds.",
      location: "Mizoram, India"
    },
    notifications: {
      emailNotifications: true,
      generationComplete: true,
      newLicensePurchase: true,
      monthlyReport: false,
      culturalUpdates: true
    },
    privacy: {
      publicProfile: true,
      showEarnings: false,
      allowCollaboration: true,
      culturalContextSharing: true
    },
    generation: {
      defaultDuration: 30,
      defaultMood: "traditional",
      autoSave: true,
      highQualityPreview: true
    }
  });

  const [apiKeys, setApiKeys] = useState([
    {
      id: "1",
      name: "Production API Key",
      key: "csl_sk_live_1234567890abcdef",
      createdAt: "2024-01-15",
      lastUsed: "2024-01-16",
      visible: false
    },
    {
      id: "2", 
      name: "Development API Key",
      key: "csl_sk_test_abcdef1234567890",
      createdAt: "2024-01-10",
      lastUsed: "2024-01-16",
      visible: false
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    console.log("Saving settings:", settings);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, visible: !key.visible } : key
    ));
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    // Show toast notification in real app
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const generateNewApiKey = async () => {
    setIsGeneratingKey(true);
    // Simulate API key generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newKey = {
      id: Date.now().toString(),
      name: "New API Key",
      key: `csl_sk_live_${Math.random().toString(36).substr(2, 16)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: "Never",
      visible: false
    };
    setApiKeys(prev => [...prev, newKey as typeof prev[0]]);
    setIsGeneratingKey(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={settings.profile.name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, name: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.profile.email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, email: e.target.value }
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="culturalAffiliation">Cultural Affiliation</Label>
              <Input
                id="culturalAffiliation"
                value={settings.profile.culturalAffiliation}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, culturalAffiliation: e.target.value }
                }))}
                placeholder="e.g., Mizo, Cherokee, Irish"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={settings.profile.location}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, location: e.target.value }
                }))}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={settings.profile.bio}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                profile: { ...prev.profile, bio: e.target.value }
              }))}
              placeholder="Tell us about yourself and your cultural background..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
            </div>
            <Switch
              checked={settings.notifications.emailNotifications}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailNotifications: checked }
              }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Generation Complete</Label>
              <p className="text-sm text-gray-500">Notify when AI generation is finished</p>
            </div>
            <Switch
              checked={settings.notifications.generationComplete}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, generationComplete: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New License Purchase</Label>
              <p className="text-sm text-gray-500">Notify when someone licenses your content</p>
            </div>
            <Switch
              checked={settings.notifications.newLicensePurchase}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, newLicensePurchase: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Monthly Report</Label>
              <p className="text-sm text-gray-500">Receive monthly earnings and usage reports</p>
            </div>
            <Switch
              checked={settings.notifications.monthlyReport}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, monthlyReport: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cultural Updates</Label>
              <p className="text-sm text-gray-500">Updates about new cultural content and features</p>
            </div>
            <Switch
              checked={settings.notifications.culturalUpdates}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, culturalUpdates: checked }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Sharing</CardTitle>
          <CardDescription>Control how your information is shared</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Profile</Label>
              <p className="text-sm text-gray-500">Allow others to view your profile</p>
            </div>
            <Switch
              checked={settings.privacy.publicProfile}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, publicProfile: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Earnings</Label>
              <p className="text-sm text-gray-500">Display earnings information publicly</p>
            </div>
            <Switch
              checked={settings.privacy.showEarnings}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, showEarnings: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Collaboration</Label>
              <p className="text-sm text-gray-500">Let others invite you to collaborate</p>
            </div>
            <Switch
              checked={settings.privacy.allowCollaboration}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, allowCollaboration: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cultural Context Sharing</Label>
              <p className="text-sm text-gray-500">Share cultural stories with generated content</p>
            </div>
            <Switch
              checked={settings.privacy.culturalContextSharing}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, culturalContextSharing: checked }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Preferences</CardTitle>
          <CardDescription>Default settings for AI music generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Default Duration (seconds)</Label>
              <Select value={settings.generation.defaultDuration.toString()} onValueChange={(value) => 
                setSettings(prev => ({
                  ...prev,
                  generation: { ...prev.generation, defaultDuration: parseInt(value) }
                }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMood">Default Mood</Label>
              <Select value={settings.generation.defaultMood} onValueChange={(value) => 
                setSettings(prev => ({
                  ...prev,
                  generation: { ...prev.generation, defaultMood: value }
                }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="peaceful">Peaceful</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="ceremonial">Ceremonial</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-save Generations</Label>
              <p className="text-sm text-gray-500">Automatically save generated content</p>
            </div>
            <Switch
              checked={settings.generation.autoSave}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                generation: { ...prev.generation, autoSave: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>High Quality Preview</Label>
              <p className="text-sm text-gray-500">Generate higher quality previews (slower)</p>
            </div>
            <Switch
              checked={settings.generation.highQualityPreview}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                generation: { ...prev.generation, highQualityPreview: checked }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>Manage your API keys for programmatic access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Use API keys to integrate Cultural Sound Lab into your applications. Keep your keys secure and never share them publicly.
              </p>
            </div>
            <Button onClick={generateNewApiKey} disabled={isGeneratingKey}>
              {isGeneratingKey ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New API Key
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{apiKey.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created: {apiKey.createdAt} • Last used: {apiKey.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {apiKey.visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyApiKey(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-2 font-mono text-sm">
                  {apiKey.visible ? apiKey.key : '•'.repeat(24) + apiKey.key.slice(-8)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-amber-400 rounded-full mt-2"></div>
              </div>
              <div>
                <h4 className="font-medium text-amber-800">API Usage Guidelines</h4>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  <li>• Rate limit: 100 requests per minute</li>
                  <li>• Keep keys secure and rotate them regularly</li>
                  <li>• Cultural attribution is required for all API usage</li>
                  <li>• Commercial usage requires appropriate licensing</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}