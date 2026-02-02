/**
 * AppSidebar Component
 * 
 * Main navigation sidebar for SKYNETRA platform.
 * Replaces the navbar for better UX on larger screens.
 */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    Bell,
    BookOpen,
    Bot,
    ChevronLeft,
    ChevronRight,
    Cloud,
    FileWarning,
    Home,
    LogOut,
    MapPin,
    Navigation,
    Package,
    Settings,
    Shield,
    UserCog,
    Users
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Live Map", href: "/map", icon: MapPin },
  { name: "Weather", href: "/weather-map", icon: Cloud },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "AI Assistant", href: "/assistant", icon: Bot },
  { name: "Evacuation", href: "/evacuation", icon: Navigation },
  { name: "Resources", href: "/resources", icon: Package },
  { name: "Report", href: "/report", icon: FileWarning },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Community", href: "/community", icon: Users },
];

const adminLinks = [
  { name: "Admin Dashboard", href: "/admin", icon: Settings },
  { name: "Emergency Alerts", href: "/admin/alerts", icon: AlertTriangle },
  { name: "User Management", href: "/admin/users", icon: UserCog },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-slate-700/50",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <Shield className="w-8 h-8 text-cyan-500 flex-shrink-0" />
        {!collapsed && (
          <span className="text-xl font-bold text-white">SKYNETRA</span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                  collapsed && "justify-center"
                )}
                title={collapsed ? link.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{link.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className={cn(
              "mt-6 mb-2 px-3",
              collapsed ? "hidden" : "block"
            )}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin
              </p>
            </div>
            <div className="space-y-1">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-amber-600/20 text-amber-400 border border-amber-500/30" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? link.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{link.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700/50 p-3">
        {isAuthenticated ? (
          <div className={cn(
            "flex items-center gap-3",
            collapsed ? "flex-col" : ""
          )}>
            <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center flex-shrink-0">
              <span className="text-cyan-400 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className={cn(
            "flex gap-2",
            collapsed ? "flex-col" : ""
          )}>
            <Button
              variant="outline"
              size={collapsed ? "icon" : "sm"}
              onClick={() => navigate('/login')}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {collapsed ? "L" : "Login"}
            </Button>
            <Button
              size={collapsed ? "icon" : "sm"}
              onClick={() => navigate('/signup')}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              {collapsed ? "S" : "Sign Up"}
            </Button>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

export default AppSidebar;
