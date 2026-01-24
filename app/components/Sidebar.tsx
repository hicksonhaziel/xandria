"use client"
import { useRouter, usePathname } from "next/navigation";
import { ServerIcon, ChartBar, Trophy, Info, Network, BookOpen, Users2, MoreHorizontal, X } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import Image from "next/image";
import { useState } from "react";

type VisualStatus = 'pNodes_Explore' | 'Network_3D' | 'pNodes_Analysis';

type NavItem = {
  id: string;
  label: string;
  icon: import('lucide-react').LucideIcon;
  routes: string[];
  visualState?: VisualStatus; 
};

const XandriaIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <Image 
      src="/xandria.png" 
      alt="Xandria AI" 
      width={20} 
      height={20} 
      className="rounded-sm"
    />
  </div>
);

const navItems: NavItem[] = [
  { 
    id: "pNodes", 
    label: "pNodes", 
    icon: ServerIcon, 
    routes: ["/", "/pnodes/[nodePubkey]"],
    visualState: "pNodes_Explore"
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
    id: "xandria-ai", 
    label: "Xandria AI", 
    icon: XandriaIcon as any, 
    routes: ["/xandria-ai"],
  },
  { 
    id: "managers", 
    label: "Managers", 
    icon: Users2, 
    routes: ["/managers"],
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

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { visualStatus, setVisualStatus, darkMode } = useAppContext();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    
    // Close more menu on mobile after navigation
    setShowMoreMenu(false);
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
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const hoverClass = darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100';

  // Split nav items for mobile
  const mobileMainItems = navItems.slice(0, 4); // First 4 items
  const mobileMoreItems = navItems.slice(4); // Remaining items

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:block
          fixed left-0 top-10 bottom-0
          ${cardClass} border-r ${borderClass}
          pt-20 
          z-40
          transition-all duration-200 ease-out
          w-64
        `}
      >
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
                    justify-start
                    ${
                      isActive
                        ? `bg-purple-500/15 ${darkMode ? 'text-purple-400' : 'text-purple-600'} shadow-sm`
                        : `${textMutedClass} ${hoverClass}`
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2.5 bottom-auto h-7 w-[3px] bg-purple-500 rounded-r-full" />
                  )}
                  
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-transform duration-150`} />
                  
                  <span className={`truncate ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Support Section */}
        <div className={`mt-12 border-t ${borderClass} pt-4 px-3`}>
          <p className={`px-3 mb-2 text-xs font-semibold ${textMutedClass} uppercase tracking-wider`}>
            Support
          </p>
          
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
                      justify-start
                      ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                ) : (
                  <button
                    onClick={() => router.push(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg
                      text-sm font-medium transition-all duration-150
                      justify-start
                      ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 ${cardClass} border-t ${borderClass} z-50 pb-safe`}>
        <div className="flex items-center justify-around px-2 py-2">
          {/* First 4 nav items */}
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-150 flex-1 min-w-0
                  ${
                    isActive
                      ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                      : `${textMutedClass}`
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-transform duration-150`} />
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-purple-500 mt-0.5" />
                )}
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-lg
              transition-all duration-150 flex-1 min-w-0
              ${textMutedClass}
            `}
          >
            <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Modal (Mobile) */}
      {showMoreMenu && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className={`absolute bottom-0 left-0 right-0 ${cardClass} rounded-t-2xl border-t ${borderClass} max-h-[70vh] overflow-y-auto pb-safe`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`sticky top-0 ${cardClass} border-b ${borderClass} px-4 py-3 flex items-center justify-between`}>
              <h3 className="text-lg font-semibold">More Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className={`p-2 rounded-lg ${hoverClass} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* More Nav Items */}
            <div className="px-2 py-3 space-y-1">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      text-sm font-medium transition-all duration-150
                      ${
                        isActive
                          ? `bg-purple-500/15 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                          : `${textMutedClass} ${hoverClass}`
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Support Items */}
            <div className={`border-t ${borderClass} px-2 py-3 space-y-1`}>
              <p className={`px-4 mb-2 text-xs font-semibold ${textMutedClass} uppercase tracking-wider`}>
                Support
              </p>
              {supportItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <div key={item.id}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg
                          text-sm font-medium transition-all duration-150
                          ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          router.push(item.href);
                          setShowMoreMenu(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-lg
                          text-sm font-medium transition-all duration-150
                          ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}