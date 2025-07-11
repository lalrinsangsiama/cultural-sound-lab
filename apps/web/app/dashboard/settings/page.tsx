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

  const handleSave = () => {
    console.log("Saving settings:", settings);
    // In a real app, this would save to the backend
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
        <Button onClick={handleSave}>
          Save Changes
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
    </div>
  );
}