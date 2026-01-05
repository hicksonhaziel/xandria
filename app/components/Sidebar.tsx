"use client"
import { useRouter, usePathname } from "next/navigation";
import { ServerIcon, ChartBar, Trophy, Info, Network, BookOpen, Server } from "lucide-react";
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
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const hoverClass = darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100';

  return (
    <aside
      className={`
        fixed left-0 top-10 bottom-0
        ${cardClass} border-r ${borderClass}
        pt-20 
        z-40
        transition-all duration-200 ease-out
        w-[4.5rem] lg:w-64
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
                  justify-center lg:justify-start
                  ${
                    isActive
                      ? `bg-purple-500/15 ${darkMode ? 'text-purple-400' : 'text-purple-600'} shadow-sm`
                      : `${textMutedClass} ${hoverClass}`
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 lg:top-2.5 lg:bottom-auto lg:h-7 w-[3px] bg-purple-500 rounded-r-full" />
                )}
                
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-transform duration-150`} />
                
                <span className={`truncate hidden lg:inline ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>

              {/* Tooltip on hover for non-lg screens */}
              <div className="
                lg:hidden
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
            </div>
          );
        })}
      </nav>

      {/* Support Section */}
      <div className={`mt-12 border-t ${borderClass} pt-4 px-3`}>
        <p className={`hidden lg:block px-3 mb-2 text-xs font-semibold ${textMutedClass} uppercase tracking-wider`}>
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
                    justify-center lg:justify-start
                    ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline truncate">{item.label}</span>
                </a>
              ) : (
                <button
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg
                    text-sm font-medium transition-all duration-150
                    justify-center lg:justify-start
                    ${isActive ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}` : `${textMutedClass} ${hoverClass}`}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline truncate">{item.label}</span>
                </button>
              )}

              {/* Tooltip on hover for non-lg screens */}
              <div className="
                lg:hidden
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
            </div>
          );
        })}
      </div>
    </aside>
  );
}