import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";

const SITE_URL = "https://nextonlinetools.com";

export default function MainLayout() {
  const location = useLocation();
  const canonicalUrl = `${SITE_URL}${location.pathname}${location.search}`;

  useEffect(() => {
    document.dispatchEvent(new Event("prerender-ready"));
  }, []);

  return (
    <>
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-[var(--bg)] flex">
        <aside className="hidden lg:block w-[270px] fixed left-0 top-0 h-screen bg-white border-r border-[var(--border)]">
          <Sidebar />
        </aside>

        <div className="flex-1 lg:ml-[270px] min-h-screen">
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