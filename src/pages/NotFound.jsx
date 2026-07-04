import { Helmet } from "react-helmet-async";
import { ArrowRight, BookOpen, Compass, FileText, Home, MessageCircle, Search } from "lucide-react";

import SmartLink from "../components/ui/SmartLink";
import "../styles/not-found.css";

const SITE_URL = "https://nextonlinetools.com";
const NOT_FOUND_URL = `${SITE_URL}/404`;

const QUICK_LINKS = [
  {
    title: "Go home",
    description: "Start from the main hub and explore the site from the top.",
    to: "/",
    icon: Home,
  },
  {
    title: "Browse tools",
    description: "Find the right utility for image, PDF, text, SEO, and productivity tasks.",
    to: "/tools",
    icon: Search,
  },
  {
    title: "Read helpful guides",
    description: "Discover practical tutorials, tips, and walkthroughs in the blog.",
    to: "/blog",
    icon: BookOpen,
  },
  {
    title: "Contact support",
    description: "Let us know if a link is broken or if you need help finding something.",
    to: "/contact",
    icon: MessageCircle,
  },
];

const NEXT_STEPS = [
  "Try the search page to look for a specific tool or topic.",
  "Visit the tools library to jump into a free browser-based utility quickly.",
  "Check the blog for step-by-step guides and best practices.",
];

function NotFoundLink({ item }) {
  const Icon = item.icon;

  return (
    <SmartLink to={item.to} className="not-found-link">
      <span className="not-found-link-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="not-found-link-content">
        <span className="not-found-link-title">{item.title}</span>
        <span className="not-found-link-description">{item.description}</span>
      </span>
      <ArrowRight size={18} strokeWidth={2} className="not-found-link-arrow" />
    </SmartLink>
  );
}

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | Next Online Tools</title>
        <meta
          name="description"
          content="The page you were looking for could not be found. Explore helpful tools, guides, and support from Next Online Tools instead."
        />
        <link rel="canonical" href={NOT_FOUND_URL} />
      </Helmet>

      <section className="not-found-page">
        <div className="card not-found-hero">
          <span className="badge">404 • Page not found</span>
          <h1>We couldn’t find that page.</h1>
          <p>
            The link may be outdated, or the page may have moved. The good news is
            that there are plenty of useful tools and guides waiting for you.
          </p>

          <div className="not-found-actions">
            <SmartLink to="/" className="btn-primary">
              Return home
            </SmartLink>
            <SmartLink to="/tools" className="btn-secondary">
              Explore tools
            </SmartLink>
          </div>
        </div>

        <div className="not-found-grid">
          <div className="card not-found-card">
            <div className="not-found-card-header">
              <Compass size={20} strokeWidth={2} />
              <h2>Helpful destinations</h2>
            </div>

            <div className="not-found-links">
              {QUICK_LINKS.map((item) => (
                <NotFoundLink key={item.title} item={item} />
              ))}
            </div>
          </div>

          <div className="card not-found-card">
            <div className="not-found-card-header">
              <FileText size={20} strokeWidth={2} />
              <h2>Popular next steps</h2>
            </div>

            <ul className="not-found-list">
              {NEXT_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
