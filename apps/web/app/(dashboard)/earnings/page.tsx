"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading, LoadingSkeleton } from "@/components/ui/loading";
import { DollarSign, TrendingUp, Users, Download, RefreshCw } from "lucide-react";
import { SimpleBarChart, SimplePieChart, SimpleLineChart, ChartContainer } from "@/components/ui/chart";

const earningsData = {
  totalEarnings: 1247.50,
  monthlyEarnings: 342.30,
  totalLicenses: 28,
  monthlyLicenses: 8,
  avgLicenseValue: 44.55,
  topGenerations: [
    {
      id: "1",
      title: "Mizo Drum Sound Logo",
      earnings: 450.00,
      licenses: 15,
      avgPrice: 30.00
    },
    {
      id: "2",
      title: "Peaceful Background Playlist",
      earnings: 380.00,
      licenses: 8,
      avgPrice: 47.50
    },
    {
      id: "3",
      title: "Documentary Score",
      earnings: 280.00,
      licenses: 4,
      avgPrice: 70.00
    },
    {
      id: "4",
      title: "Instagram Reel Background",
      earnings: 137.50,
      licenses: 11,
      avgPrice: 12.50
    }
  ]
};

const recentTransactions = [
  {
    id: "1",
    generationTitle: "Mizo Drum Sound Logo",
    licenseType: "Commercial",
    amount: 45.00,
    date: "2024-01-16T10:30:00Z",
    status: "completed"
  },
  {
    id: "2",
    generationTitle: "Peaceful Background Playlist",
    licenseType: "Enterprise",
    amount: 120.00,
    date: "2024-01-15T14:20:00Z",
    status: "completed"
  },
  {
    id: "3",
    generationTitle: "Documentary Score",
    licenseType: "Commercial",
    amount: 75.00,
    date: "2024-01-14T09:15:00Z",
    status: "pending"
  },
  {
    id: "4",
    generationTitle: "Instagram Reel Background",
    licenseType: "Personal",
    amount: 15.00,
    date: "2024-01-13T16:45:00Z",
    status: "completed"
  },
  {
    id: "5",
    generationTitle: "Mizo Drum Sound Logo",
    licenseType: "Commercial",
    amount: 45.00,
    date: "2024-01-12T11:30:00Z",
    status: "completed"
  }
];

const monthlyRevenueData = [
  { label: "Sep", value: 180 },
  { label: "Oct", value: 220 },
  { label: "Nov", value: 285 },
  { label: "Dec", value: 342 },
  { label: "Jan", value: 420 }
];

const generationTypeData = [
  { label: "Sound Logos", value: 45, color: "#8b5cf6" },
  { label: "Playlists", value: 30, color: "#06b6d4" },
  { label: "Social Clips", value: 20, color: "#10b981" },
  { label: "Long-Form", value: 5, color: "#f59e0b" }
];

const geographicData = [
  { label: "North America", value: 450 },
  { label: "Europe", value: 380 },
  { label: "Asia", value: 280 },
  { label: "Other", value: 137 }
];

export default function EarningsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <LoadingSkeleton className="h-8 w-32" />
            <LoadingSkeleton className="h-4 w-64 mt-2" />
          </div>
          <LoadingSkeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <LoadingSkeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-8 w-20" />
                <LoadingSkeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <LoadingSkeleton className="h-6 w-48" />
                <LoadingSkeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Earnings</h2>
          <p className="text-gray-600 text-sm md:text-base">Track your revenue and licensing performance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefreshData}
            disabled={isLoading}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="self-start sm:self-auto"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Exporting...</span>
                <span className="sm:hidden">Export...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">${earningsData.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +${earningsData.monthlyEarnings.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Licenses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{earningsData.totalLicenses}</div>
            <p className="text-xs text-muted-foreground">
              +{earningsData.monthlyLicenses} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Avg License Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">${earningsData.avgLicenseValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">${earningsData.monthlyEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {earningsData.monthlyLicenses} licenses sold
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Generations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Generations</CardTitle>
            <CardDescription>Your best-selling audio content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earningsData.topGenerations.map((generation, index) => (
                <div key={generation.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-medium text-gray-500 flex-shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{generation.title}</p>
                      <p className="text-xs md:text-sm text-gray-500">
                        {generation.licenses} licenses • Avg ${generation.avgPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600 text-sm md:text-base">
                      ${generation.earnings.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest licensing activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base truncate">{transaction.generationTitle}</p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {transaction.licenseType} License • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <Badge 
                      variant={transaction.status === "completed" ? "default" : "secondary"}
                      className={`text-xs ${transaction.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {transaction.status}
                    </Badge>
                    <p className="font-bold text-sm md:text-base">
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly earnings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer>
              <SimpleLineChart data={monthlyRevenueData} />
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Generation Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
            <CardDescription>Earnings distribution by generation type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer>
              <SimplePieChart data={generationTypeData} />
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Usage</CardTitle>
          <CardDescription>Revenue by region</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[250px]">
            <SimpleBarChart data={geographicData} />
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Cultural Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Impact</CardTitle>
          <CardDescription>How your cultural music is being used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">15</div>
              <div className="text-sm text-gray-600">Cultural Stories Preserved</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600">Educational Projects</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <div className="text-sm text-gray-600">Commercial Uses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}