/**
 * SidebarLayout Component
 * 
 * Layout wrapper that includes the sidebar and provides
 * proper spacing for page content.
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface SidebarLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean; // For pages like weather map that need full width
}

export function SidebarLayout({ children, className, fullWidth = false }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main 
        className={cn(
          "transition-all duration-300",
          fullWidth ? "ml-16" : "ml-16 lg:ml-64",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default SidebarLayout;
