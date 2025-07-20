"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@repo/ui";
import { 
  Music, 
  Sparkles, 
  Library, 
  DollarSign, 
  Settings, 
  LogOut,
  User,
  Headphones,
  BarChart3,
  Mic,
  Radio,
  Volume2
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, description: "Studio overview" },
  { name: "Library", href: "/dashboard/library", icon: Library, description: "Cultural samples" },
  { name: "Generate", href: "/dashboard/generate", icon: Sparkles, description: "AI creation" },
  { name: "Projects", href: "/dashboard/projects", icon: Music, description: "Your creations" },
  { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign, description: "Revenue tracking" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, description: "Studio preferences" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-obsidian">
      {/* Studio Console Sidebar */}
      <div className="hidden md:flex md:w-80 md:flex-col">
        <div className="flex flex-col flex-grow bg-charcoal border-r border-slate">
          {/* Studio Branding */}
          <div className="flex items-center flex-shrink-0 p-6 border-b border-slate">
            <div className="w-12 h-12 bg-gold rounded-medium flex items-center justify-center shadow-gold mr-4">
              <Headphones className="h-6 w-6 text-obsidian" />
            </div>
            <div>
              <span className="text-h4 font-display font-bold text-white">
                Studio Console
              </span>
              <p className="text-caption text-ash mt-1">
                Professional Workspace
              </p>
            </div>
          </div>

          {/* Studio Status */}
          <div className="p-6 border-b border-slate">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald rounded-full animate-pulse"></div>
                <span className="text-small text-emerald font-mono">LIVE</span>
              </div>
              <Button variant="ghost" size="sm">
                <Radio className="w-4 h-4 mr-2 text-gold" />
                <span className="text-small text-gold">Session</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-obsidian/50 rounded-small p-3 border border-gold/10">
                <div className="text-body font-mono text-white">12</div>
                <div className="text-caption text-ash">Tracks</div>
              </div>
              <div className="bg-obsidian/50 rounded-small p-3 border border-gold/10">
                <div className="text-body font-mono text-white">2:34</div>
                <div className="text-caption text-ash">Session</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 flex flex-col p-6">
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-4 py-3 text-small font-medium rounded-small transition-all duration-200",
                      isActive
                        ? "bg-gold/10 text-gold border border-gold/20"
                        : "text-silver hover:text-white hover:bg-slate border border-transparent hover:border-iron"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 transition-colors",
                        isActive ? "text-gold" : "text-ash group-hover:text-white"
                      )}
                    />
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium",
                        isActive ? "text-gold" : "text-silver group-hover:text-white"
                      )}>
                        {item.name}
                      </div>
                      <div className="text-caption text-ash group-hover:text-silver transition-colors">
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-gold rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="flex-shrink-0 border-t border-slate p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-medium flex items-center justify-center">
                <User className="h-5 w-5 text-gold" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-small font-medium text-white">
                  Demo User
                </p>
                <p className="text-caption text-ash">
                  demo@culturalsoundlab.com
                </p>
              </div>
              <Button variant="ghost" size="sm" className="hover:text-gold">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Studio Control Bar */}
        <header className="bg-gradient-to-r from-charcoal to-slate border-b border-slate">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <div className="md:hidden mr-4">
                  <Button variant="ghost" size="sm">
                    <Headphones className="h-5 w-5 text-gold" />
                  </Button>
                </div>
                <div>
                  <h1 className="text-h2 font-display font-bold text-white">
                    {navigation.find(item => item.href === pathname)?.name || 
                     (pathname === "/dashboard" ? "Dashboard" : "Studio")}
                  </h1>
                  <p className="text-small text-ash">
                    {navigation.find(item => item.href === pathname)?.description || 
                     "Professional audio workspace"}
                  </p>
                </div>
              </div>
              
              {/* Studio Controls */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-small text-silver">
                  <Volume2 className="w-4 h-4 text-gold" />
                  <span className="font-mono">96kHz</span>
                </div>
                <Button variant="secondary" size="sm" className="border-gold/20 hover:border-gold">
                  <Mic className="h-4 w-4 mr-2" />
                  Record
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-gold">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Studio Workspace */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-obsidian">
          {children}
        </main>
      </div>
    </div>
  );
}