import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";

const SITE_URL = "https://nextonlinetools.com";

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function ensureSingleCanonical(canonicalUrl) {
  const head = document.head;
  const canonicalLinks = Array.from(
    head.querySelectorAll('link[rel="canonical"]')
  );

  if (canonicalLinks.length > 1) {
    canonicalLinks.slice(1).forEach((link) => link.remove());
  }

  const primaryLink = canonicalLinks[0];

  if (primaryLink && primaryLink.href !== canonicalUrl) {
    primaryLink.href = canonicalUrl;
  }
}

export default function MainLayout() {
  const location = useLocation();

  const cleanPath = normalizePath(location.pathname);
  const canonicalUrl = `${SITE_URL}${cleanPath}${location.search}`;

  useEffect(() => {
    ensureSingleCanonical(canonicalUrl);

    const observer = new MutationObserver(() => {
      ensureSingleCanonical(canonicalUrl);
    });

    observer.observe(document.head, {
      childList: true,
      subtree: false,
    });

    return () => observer.disconnect();
  }, [canonicalUrl]);

  useEffect(() => {
    document.dispatchEvent(new Event("prerender-ready"));
  }, []);

  return (
    <>
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] flex">
        <aside className="hidden lg:block w-[270px] fixed left-0 top-0 h-screen z-30 bg-white border-r border-[var(--border)]">
          <Sidebar />
        </aside>

        <div className="flex-1 lg:ml-[270px] min-h-screen relative z-10">
          <Header />

          <main className="px-4 sm:px-6 lg:px-10 py-8">
            <div className="max-w-[1280px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}