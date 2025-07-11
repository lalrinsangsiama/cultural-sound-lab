"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Library, TrendingUp, Users, Play } from "lucide-react";
import Link from "next/link";

const recentActivity = [
  {
    id: "1",
    type: "generation",
    title: "Created Mizo Drum Sound Logo",
    time: "2 hours ago",
    status: "completed"
  },
  {
    id: "2",
    type: "license",
    title: "Documentary Score licensed",
    time: "4 hours ago",
    status: "completed"
  },
  {
    id: "3",
    type: "generation",
    title: "Generated Instagram Reel Background",
    time: "1 day ago",
    status: "processing"
  },
  {
    id: "4",
    type: "license",
    title: "Peaceful Playlist licensed",
    time: "2 days ago",
    status: "completed"
  }
];

const quickStats = {
  totalGenerations: 12,
  totalEarnings: 1247.50,
  activeLicenses: 28,
  librarySize: 6
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-blue-100 mt-1">
              Ready to create and share cultural music?
            </p>
          </div>
          <Music className="h-12 w-12 text-blue-200" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generations</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">
              +3 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${quickStats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">
              +8 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Library Size</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.librarySize}</div>
            <p className="text-xs text-muted-foreground">
              Cultural samples
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Generate Audio
            </CardTitle>
            <CardDescription>Create new music from cultural samples</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/generate">
              <Button className="w-full">
                Start Generation
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Library className="h-5 w-5 mr-2 text-primary" />
              Browse Library
            </CardTitle>
            <CardDescription>Explore available cultural sound samples</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/library">
              <Button variant="outline" className="w-full">
                View Library
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Music className="h-5 w-5 mr-2 text-primary" />
              My Projects
            </CardTitle>
            <CardDescription>Manage your generated audio content</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/projects">
              <Button variant="outline" className="w-full">
                View Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-full">
                    {activity.type === "generation" ? (
                      <Sparkles className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <Badge 
                  variant={activity.status === "completed" ? "default" : "secondary"}
                  className={activity.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cultural Context */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Preservation Impact</CardTitle>
          <CardDescription>How your work contributes to cultural preservation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">15</div>
              <div className="text-sm text-gray-600">Cultural Stories Shared</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600">Educational Uses</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">1,247</div>
              <div className="text-sm text-gray-600">People Reached</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}