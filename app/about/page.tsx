'use client';

import { useRef } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import { useSidebarCollapse } from '../hooks/useSidebarCollapse';
import Footer from '@/app/components/Footer';
import { 
  Server, 
  BarChart3, 
  Trophy, 
  Github, 
  Twitter, 
  MessageSquare, 
  ExternalLink,
  Keyboard,
  Search,
  Star,
  Zap,
  Database,
  Network
} from 'lucide-react';

const AboutPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarCollapsed = useSidebarCollapse();
  const { darkMode } = useAppContext();

  const bgClass = darkMode ? 'bg-[#0B0F14]' : 'bg-gray-50';
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-800' : 'border-gray-200';

  const features = [
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Monitor pNode performance and network health"
    },
    {
      icon: Network,
      title: "3D Visualization",
      description: "Interactive network topology view"
    },
    {
      icon: Trophy,
      title: "Leaderboards",
      description: "Track top-performing pNodes"
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Powerful filtering capabilities"
    },
    {
      icon: Star,
      title: "Favorites",
      description: "Save and track important pNodes"
    },
    {
      icon: Database,
      title: "Data Export",
      description: "Export to CSV for analysis"
    }
  ];

  const shortcuts = [
    { keys: ['Ctrl', 'D'], description: 'Toggle Dark/Light Mode' },
    { keys: ['Ctrl', 'K'], description: 'Quick Search' },
    { keys: ['Ctrl', 'F'], description: 'Toggle Favorites' },
    { keys: ['Esc'], description: 'Close Modals' },
  ];

  const links = [
    {
      title: "GitHub",
      url: "https://github.com/hicksonhaziel/xandria",
      icon: Github,
    },
    {
      title: "Twitter",
      url: "https://x.com/devhickson",
      icon: Twitter,
    },
    {
      title: "Discord",
      url: "https://discord.gg/xandeum",
      icon: MessageSquare,
    },
    {
      title: "Xandeum",
      url: "https://github.com/xandeum",
      icon: Github,
    }
  ];

  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      <Header />
      <Sidebar />

      <div 
        className={`
          pt-20 px-6 transition-all duration-200
          ${sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'}
        `}
      >
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-3">About Xandria</h1>
            <p className={`text-lg ${mutedClass}`}>
              A comprehensive analytics platform and operational tool for the Xandeum Network
            </p>
          </div>

          {/* What is Xandeum */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">What is Xandeum?</h2>
            <p className={`${mutedClass} leading-relaxed mb-3`}>
              Xandeum is a next-generation decentralized network built for high-performance distributed systems. 
              It leverages innovative consensus mechanisms and storage solutions to provide robust infrastructure 
              for decentralized applications.
            </p>
            <p className={`${mutedClass} leading-relaxed`}>
              The network is designed to be scalable, secure, and efficient—ideal for enterprises 
              and developers building the future of Web3.
            </p>
          </section>

          {/* What are pNodes */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">What are pNodes?</h2>
            <p className={`${mutedClass} leading-relaxed mb-4`}>
              pNodes (Provider Nodes) are the backbone of the Xandeum Network. These nodes provide 
              computational resources, storage capacity, and network bandwidth to support the decentralized ecosystem.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-4 rounded-lg border ${borderClass}`}>
                <Database className={`w-5 h-5 ${mutedClass} mb-2`} />
                <h3 className="font-medium mb-1 text-sm">Storage Providers</h3>
                <p className={`text-sm ${mutedClass}`}>Decentralized storage capacity</p>
              </div>
              <div className={`p-4 rounded-lg border ${borderClass}`}>
                <Zap className={`w-5 h-5 ${mutedClass} mb-2`} />
                <h3 className="font-medium mb-1 text-sm">Compute Resources</h3>
                <p className={`text-sm ${mutedClass}`}>Processing power on demand</p>
              </div>
              <div className={`p-4 rounded-lg border ${borderClass}`}>
                <Network className={`w-5 h-5 ${mutedClass} mb-2`} />
                <h3 className="font-medium mb-1 text-sm">Network Validators</h3>
                <p className={`text-sm ${mutedClass}`}>Transaction validation</p>
              </div>
            </div>
          </section>

          {/* What is Xandria */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">What is Xandria?</h2>
            <p className={`${mutedClass} leading-relaxed mb-3`}>
              Xandria is more than analytics—it's an operational tool for pNode operators and network administrators. 
              Built with a focus on usability and real-time insights.
            </p>
            <ul className={`space-y-2 ${mutedClass}`}>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0"></span>
                <span>Monitor network health and pNode performance in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0"></span>
                <span>Visualize network topology through interactive 3D interface</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0"></span>
                <span>Track metrics and identify optimization opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0"></span>
                <span>Make data-driven decisions with comprehensive analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0"></span>
                <span>Export data for deeper analysis and reporting</span>
              </li>
            </ul>
          </section>

          {/* Features */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border ${borderClass} hover:shadow-sm transition-shadow`}
                >
                  <feature.icon className={`w-5 h-5 ${mutedClass} mb-2`} />
                  <h3 className="font-medium mb-1 text-sm">{feature.title}</h3>
                  <p className={`text-sm ${mutedClass}`}>{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Keyboard className={`w-5 h-5 ${mutedClass}`} />
              <h2 className="text-2xl font-semibold">Keyboard Shortcuts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${borderClass}`}
                >
                  <span className={`text-sm ${mutedClass}`}>{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, kidx) => (
                      <kbd 
                        key={kidx}
                        className={`px-2 py-1 text-xs font-mono rounded ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } border`}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Built For */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">Built For</h2>
            <p className={`${mutedClass} leading-relaxed mb-4`}>
              Xandria was developed for the Xandeum Superteam Bounty, showcasing the network's capabilities 
              through a practical, production-ready tool that serves real operational needs.
            </p>
            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <h3 className="font-medium mb-1">Hickson Haziel</h3>
              <p className={`${mutedClass} text-sm mb-3`}>
                Developer committed to building tools that empower the decentralized future.
              </p>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://github.com/hicksonhaziel/xandria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${borderClass} hover:shadow-sm transition-shadow`}
                >
                  <Github className="w-4 h-4" />
                  Repository
                </a>
                <a 
                  href="https://x.com/devhickson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${borderClass} hover:shadow-sm transition-shadow`}
                >
                  <Twitter className="w-4 h-4" />
                  @devhickson
                </a>
              </div>
            </div>
          </section>

          {/* Community */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Community</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${borderClass} hover:shadow-sm transition-all group`}
                >
                  <link.icon className={`w-5 h-5 ${mutedClass} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm font-medium">{link.title}</span>
                  <ExternalLink className={`w-3 h-3 ${mutedClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </a>
              ))}
            </div>
          </section>

        </div>

        <Footer />
      </div>
    </div>
  );
};

export default AboutPage;