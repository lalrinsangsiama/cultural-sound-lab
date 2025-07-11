"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Users, Download } from "lucide-react";

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

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Earnings</h2>
          <p className="text-gray-600">Track your revenue and licensing performance</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +${earningsData.monthlyEarnings.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earningsData.totalLicenses}</div>
            <p className="text-xs text-muted-foreground">
              +{earningsData.monthlyLicenses} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg License Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.avgLicenseValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.monthlyEarnings.toFixed(2)}</div>
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
            <div className="space-y-4">
              {earningsData.topGenerations.map((generation, index) => (
                <div key={generation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{generation.title}</p>
                      <p className="text-sm text-gray-500">
                        {generation.licenses} licenses • Avg ${generation.avgPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
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
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{transaction.generationTitle}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.licenseType} License • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={transaction.status === "completed" ? "default" : "secondary"}
                      className={transaction.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {transaction.status}
                    </Badge>
                    <p className="font-bold">
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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