"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "@/components/ui/mobile-nav";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ProfileButton } from "@/components/ui/profile-button";
import { 
  Music, 
  Sparkles, 
  Library, 
  DollarSign, 
  Settings, 
  LogOut,
  User,
  HelpCircle,
  PlayCircle,
  TrendingUp,
  CheckSquare
} from "lucide-react";

const navigation = [
  { name: "Library", href: "/dashboard/library", icon: Library },
  { name: "Generate", href: "/dashboard/generate", icon: Sparkles },
  { name: "Demos", href: "/dashboard/demos", icon: PlayCircle },
  { name: "Case Studies", href: "/dashboard/case-studies", icon: TrendingUp },
  { name: "Projects", href: "/dashboard/projects", icon: Music },
  { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
  { name: "Launch Checklist", href: "/dashboard/launch-checklist", icon: CheckSquare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
      {/* Skip Navigation Links */}
      <div className="sr-only">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>
        <a 
          href="#sidebar-navigation" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-36 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
        >
          Skip to navigation
        </a>
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="bg-gradient-to-r from-purple-600 to-orange-600 rounded-lg p-2">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                CSL
              </span>
              <p className="text-xs text-gray-600">Cultural Sound Lab</p>
            </div>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav id="sidebar-navigation" className="flex-1 px-2 pb-4 space-y-1" role="navigation" aria-label="Main navigation">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-gray-500"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Separator />
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  Demo User
                </p>
                <p className="text-xs font-medium text-gray-500">
                  demo@culturalsoundlab.com
                </p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" aria-label="Sign out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 md:py-6">
              <div className="flex items-center">
                <MobileNav />
                <div className="flex items-center md:hidden ml-2">
                  <div className="bg-gradient-to-r from-purple-600 to-orange-600 rounded-lg p-1.5">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                    CSL
                  </span>
                </div>
                <h1 className="ml-2 text-xl md:text-2xl font-bold text-gray-900 md:ml-0">
                  {navigation.find(item => item.href === pathname)?.name || "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <ProfileButton variant="desktop" className="hidden sm:flex" />
                <ProfileButton variant="mobile" className="sm:hidden" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content with bottom padding for mobile nav */}
        <main id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pb-16 md:pb-0" role="main">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
      </div>
    </ProtectedRoute>
  );
}