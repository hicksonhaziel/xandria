"use client"
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, ChartBar, Trophy, Info, Network, BookOpen, ChevronLeft, ChevronRight, Menu, X, Server } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";

type VisualStatus = 'pNodes_Explore' | 'Network_3D' | 'pNodes_Analysis';

type NavItem = {
  id: string;
  label: string;
  icon: import('lucide-react').LucideIcon;
  routes: string[];
  visualState?: VisualStatus;
};

const navItems: NavItem[] = [
  { 
    id: "overview", 
    label: "Overview", 
    icon: LayoutDashboard, 
    routes: ["/", "/overview"],
    visualState: "pNodes_Explore"
  },
  { 
    id: "pnodes", 
    label: "pNodes", 
    icon: Server, 
    routes: ["/pnodes"]
  },
  { 
    id: "analysis", 
    label: "Analysis", 
    icon: ChartBar, 
    routes: ["/", "/overview"],
    visualState: "pNodes_Analysis"
  },
  { 
    id: "network3d", 
    label: "Network 3D", 
    icon: Network, 
    routes: ["/", "/overview"],
    visualState: "Network_3D"
  },
  { 
    id: "leaderboard", 
    label: "Leaderboards", 
    icon: Trophy, 
    routes: ["/leaderboard"]
  },
];

const supportItems = [
  { id: "docs", label: "Docs", icon: BookOpen, href: "https://docs.xandeum.network", external: true },
  { id: "about", label: "About", icon: Info, href: "/about", external: false },
];

// Dispatch custom event for same-window updates
const dispatchCollapseChange = (collapsed: boolean) => {
  window.dispatchEvent(new CustomEvent('sidebar-collapse-change', { detail: collapsed }));
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { visualStatus, setVisualStatus, darkMode } = useAppContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapse state and dispatch event
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
    dispatchCollapseChange(newState);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleNavClick = (item: NavItem) => {
    const isOnHomeOrOverview = pathname === "/" || pathname === "/overview";

    if (item.visualState) {
      if (isOnHomeOrOverview) {
        setVisualStatus(item.visualState);
      } else {
        router.push("/");
        setTimeout(() => setVisualStatus(item.visualState!), 100);
      }
    } else {
      router.push(item.routes[0]);
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.visualState) {
      const isOnHomeOrOverview = pathname === "/" || pathname === "/overview";
      return isOnHomeOrOverview && visualStatus === item.visualState;
    } else {
      return item.routes.includes(pathname);
    }
  };

  const cardClass = darkMode 
    ? 'bg-[#0B0F14] backdrop-blur-lg' 
    : 'bg-white/80 backdrop-blur-lg';
  const borderClass = darkMode ? 'border-gray-800' : 'border-gray-200';
  const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const hoverClass = darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={`lg:hidden fixed top-24 left-4 z-50 p-2.5 rounded-lg ${cardClass} border ${borderClass} hover:shadow-lg transition-all duration-150`}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-150"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-10 h-[calc(100vh-5rem)]
          ${cardClass} border-r ${borderClass}
          pt-20 
          z-40
          transition-all duration-200 ease-out
          ${isCollapsed ? 'w-[4.5rem]' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Collapse Toggle Button - Desktop Only */}
        <button
          onClick={toggleCollapse}
          className={`
            hidden lg:flex
            absolute -right-3 top-24
            w-6 h-6 rounded-full
            ${cardClass} border ${borderClass}
            items-center justify-center
            hover:shadow-lg hover:scale-110 transition-all duration-150
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleNavClick(item)}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-3 rounded-lg
                    text-sm font-medium transition-all duration-150
                    ${isCollapsed ? 'justify-center' : ''}
                    ${
                      isActive
                        ? `bg-purple-500/15 ${darkMode ? 'text-purple-400' : 'text-purple-600'} shadow-sm`
                        : `${textMutedClass} ${hoverClass}`
                    }
                  `}
                >
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-2.5 h-7 w-[3px] bg-purple-500 rounded-r-full" />
                  )}
                  {isActive && isCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-500 rounded-r-full" />
                  )}
                  
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-transform duration-150`} />
                  
                  {!isCollapsed && (
                    <span className={`truncate ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  )}
                </button>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-3 px-3 py-1.5 rounded-lg
                    bg-gray-900 text-white text-sm font-medium
                    whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    pointer-events-none
                    transition-opacity duration-150
                    z-50
                    top-1/2 -translate-y-1/2
                    shadow-lg
                  ">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Support Section */}
        <div className={`mt-12 border-t ${borderClass} pt-4 px-3`}>
          {!isCollapsed && (
            <p className={`px-3 mb-2 text-xs font-semibold ${textMutedClass} uppercase tracking-wider`}>
              Support
            </p>
          )}
          
          {supportItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <div key={item.id} className="relative group">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg
                      text-sm font-medium transition-all duration-150
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </a>
                ) : (
                  <button
                    onClick={() => router.push(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg
                      text-sm font-medium transition-all duration-150
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                )}

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-3 px-3 py-1.5 rounded-lg
                    bg-gray-900 text-white text-sm font-medium
                    whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    pointer-events-none
                    transition-opacity duration-150
                    z-50
                    top-1/2 -translate-y-1/2
                    shadow-lg
                  ">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}