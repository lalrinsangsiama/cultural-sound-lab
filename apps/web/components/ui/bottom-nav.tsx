"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Music, 
  Sparkles, 
  Library, 
  DollarSign, 
  User,
  PlayCircle
} from "lucide-react";

const primaryNavigation = [
  { name: "Library", href: "/dashboard/library", icon: Library },
  { name: "Generate", href: "/dashboard/generate", icon: Sparkles },
  { name: "Demos", href: "/dashboard/demos", icon: PlayCircle },
  { name: "Earnings", href: "/dashboard/earnings", icon: DollarSign },
  { name: "Profile", href: "/dashboard/settings", icon: User },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden",
      "safe-area-inset-bottom pb-safe",
      className
    )}>
      <nav className="flex items-center justify-around px-2 py-2">
        {primaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1",
                "text-xs font-medium transition-colors duration-200",
                "rounded-lg mx-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}