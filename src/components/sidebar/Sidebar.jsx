import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Wrench,
  BookOpen,
  Info,
  Mail,
} from "lucide-react";

import LatestTools from "./LatestTools";
import TrendingTools from "./TrendingTools";
import SocialLinks from "./SocialLinks";

export default function Sidebar() {
  const navItems = [
    { name: "Explore", path: "/", icon: Home },
    { name: "All Tools", path: "/tools", icon: Wrench },
    { name: "Blog", path: "/blog", icon: BookOpen },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Mail },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto">
      <a href="/" onClick={(e)=>{e.preventDefault(); navigate('/');}} className="mb-8 flex items-center justify-center">
        {/* Logo Section */}
        <img
          src="/logo.png" 
          alt="Next Online Tools"
          className="w-18 h-10" 
        />
      </a>

      <nav className="flex flex-col gap-2 mb-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <a
              key={item.path}
              href={item.path}
              onPointerDown={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              onClick={(e) => e.preventDefault()}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
                isActive
                  ? "bg-[#f0e7ff] text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[#f7f1ff]"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.name}
            </a>
          );
        })}
      </nav>

      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">
          Latest Tools
        </h3>
        <LatestTools />
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">
          Trending Tools
        </h3>
        <TrendingTools />
      </div>

      <div className="mt-auto">
        <SocialLinks />
      </div>
    </div>
  );
}