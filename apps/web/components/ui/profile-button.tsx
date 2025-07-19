"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

interface ProfileButtonProps {
  className?: string;
  variant?: "desktop" | "mobile";
}

export function ProfileButton({ 
  className, 
  variant = "desktop"
}: ProfileButtonProps) {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };
  if (variant === "mobile") {
    return (
      <div className="relative">
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "border-2 border-pink-500 text-pink-600 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-600",
            className
          )}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <User className="h-4 w-4" />
        </Button>
        
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-left p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        className={cn(
          "border-2 border-pink-500 text-pink-600 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-600 font-medium",
          className
        )}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <User className="h-4 w-4 mr-2" />
        {user?.email?.split('@')[0] || 'Profile'}
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>
      
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-left p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}