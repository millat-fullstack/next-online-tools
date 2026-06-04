import { useLocation } from "react-router-dom";
import { Home, Wrench, BookOpen, Info, Mail } from "lucide-react";

import SmartLink from "../ui/SmartLink";
import LatestTools from "./LatestTools";
import TrendingTools from "./TrendingTools";
import SocialLinks from "./SocialLinks";

function normalizePath(path) {
  if (!path || path === "/") return "/";
  return String(path).replace(/\/$/, "");
}

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Explore", path: "/", icon: Home },
    { name: "All Tools", path: "/tools", icon: Wrench, hardLink: true },
    { name: "Blog", path: "/blog", icon: BookOpen },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Mail },
  ];

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto">
      <SmartLink
        to="/"
        className="mb-8 flex items-center justify-center"
        aria-label="Next Online Tools Home"
      >
        <img
          src="/logo.png"
          alt="Next Online Tools"
          className="w-18 h-10"
        />
      </SmartLink>

      <nav className="flex flex-col gap-2 mb-8">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            normalizePath(location.pathname) === normalizePath(item.path);

          const navClassName = `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
            isActive
              ? "bg-[#f0e7ff] text-[var(--primary)]"
              : "text-[var(--text-secondary)] hover:bg-[#f7f1ff]"
          }`;

          if (item.hardLink) {
            return (
              <a
                key={item.name}
                href="/tools"
                className={navClassName}
                aria-label="Open All Tools"
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </a>
            );
          }

          return (
            <SmartLink
              key={item.name}
              to={item.path}
              className={navClassName}
              aria-label={`Open ${item.name}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.name}</span>
            </SmartLink>
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