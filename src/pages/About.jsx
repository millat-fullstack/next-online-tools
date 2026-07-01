import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Helmet } from "react-helmet-async";

import tools from "../data/tools.json";
import SmartLink from "../components/ui/SmartLink";

const SITE_URL = "https://nextonlinetools.com";
const ABOUT_URL = `${SITE_URL}/about`;
const CONTACT_URL = `${SITE_URL}/contact`;
const TOOLS_URL = `${SITE_URL}/tools`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const NEWSLETTER_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec";

function normalizeText(value) {
  return String(value || "").trim();
}

function IconBox({ icon, className = "" }) {
  const IconComponent = Icons[icon] || Icons.Sparkles;

  return (
    <div className={`about-v2-icon ${className}`} aria-hidden="true">
      <IconComponent size={24} strokeWidth={2.1} />
    </div>
  );
}

export default function About() {
  const [formData, setFormData] = useState({
    email: "",
    website: "",
  });

  const [responseMsg, setResponseMsg] = useState("");
  const [responseType, setResponseType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = useMemo(() => {
    return [...new Set(tools.map((tool) => normalizeText(tool.category)).filter(Boolean))];
  }, []);

  const totalTools = tools.length;
  const totalCategories = categories.length;

  const seoTitle =
    "About Next Online Tools | Free Browser-Based Tools for Daily Work";

  const seoDescription =
    "Learn about Next Online Tools, a clean free online tools platform for images, PDFs, text, SEO, spreadsheets, conversions, social media, and everyday digital work.";

  const focusCards = [
    {
      title: "Simple by design",
      label: "UX",
      description:
        "Every page is built around one clear task, visible actions, helpful labels, and a clean result area.",
      icon: "MousePointerClick",
    },
    {
      title: "Fast everyday workflow",
      label: "Speed",
      description:
        "Open a tool, complete the job, and continue your work without installing heavy software.",
      icon: "Zap",
    },
    {
      title: "Useful tool categories",
      label: "Library",
      description:
        "Images, PDFs, text, SEO, spreadsheets, social content, converters, colors, and productivity tools.",
      icon: "Layers",
    },
    {
      title: "Built for real users",
      label: "Practical",
      description:
        "Made for students, creators, marketers, office teams, developers, and small business owners.",
      icon: "Users",
    },
  ];

  const userGroups = [
    {
      title: "Creators and marketers",
      description:
        "Resize social images, format LinkedIn posts, compress visuals, prepare thumbnails, and clean campaign assets.",
      icon: "Megaphone",
    },
    {
      title: "Students and office users",
      description:
        "Work with PDFs, count words, convert files, organize documents, and prepare quick daily tasks.",
      icon: "BriefcaseBusiness",
    },
    {
      title: "Website and SEO teams",
      description:
        "Generate slugs, prepare image files, clean text, create QR codes, and improve publishing workflows.",
      icon: "SearchCheck",
    },
  ];

  const operatingPrinciples = [
    "Keep every tool focused on one clear job.",
    "Make the first action obvious for new visitors.",
    "Avoid clutter, unnecessary steps, and confusing labels.",
    "Create pages that are useful for both users and search engines.",
    "Improve tools based on real workflow problems.",
  ];

  const faqItems = [
    {
      question: "What is Next Online Tools?",
      answer:
        "Next Online Tools is a free browser-based tools platform for everyday digital tasks such as image editing, PDF work, text formatting, SEO preparation, spreadsheet cleanup, conversions, colors, and productivity tasks.",
    },
    {
      question: "Are the tools free to use?",
      answer:
        "Yes. The platform is focused on simple free tools that help users finish common digital jobs quickly.",
    },
    {
      question: "Do I need to install any software?",
      answer:
        "No. The tools are designed to work directly in the browser, so users can open a page, complete a task, and download or copy the result.",
    },
    {
      question: "Who is this website made for?",
      answer:
        "It is made for creators, students, marketers, office users, developers, website owners, small businesses, and anyone who needs quick online utility tools.",
    },
  ];

  const responseIcon =
    responseType === "success" ? (
      <Icons.CheckCircle size={20} />
    ) : responseType === "warning" ? (
      <Icons.AlertTriangle size={20} />
    ) : responseType === "error" ? (
      <Icons.XCircle size={20} />
    ) : null;

  const structuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Next Online Tools",
          alternateName: ["NextOnlineTools", "nextonlinetools.com"],
          url: SITE_URL,
          description:
            "Free browser-based online tools for images, PDFs, text, SEO, spreadsheets, conversions, social media, colors, and daily digital tasks.",
          inLanguage: "en",
          potentialAction: {
            "@type": "SearchAction",
            target: `${TOOLS_URL}?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Next Online Tools",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: DEFAULT_OG_IMAGE,
          },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            areaServed: "Worldwide",
            availableLanguage: ["English"],
            url: CONTACT_URL,
          },
        },
        {
          "@type": "AboutPage",
          "@id": `${ABOUT_URL}#webpage`,
          url: ABOUT_URL,
          name: seoTitle,
          description: seoDescription,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          about: {
            "@id": `${SITE_URL}/#organization`,
          },
          mainEntity: {
            "@id": `${SITE_URL}/#organization`,
          },
          inLanguage: "en",
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${ABOUT_URL}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "About",
              item: ABOUT_URL,
            },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${ABOUT_URL}#faq`,
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ],
    };
  }, [faqItems, seoDescription, seoTitle]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (formData.website) {
      return;
    }

    if (!formData.email) {
      setResponseType("warning");
      setResponseMsg("Please enter your email address before subscribing.");
      return;
    }

    setIsLoading(true);
    setResponseMsg("");
    setResponseType(null);

    const formPayload = new FormData();
    formPayload.append("email", formData.email);
    formPayload.append("source", "About page newsletter");

    try {
      const response = await fetch(NEWSLETTER_ENDPOINT, {
        method: "POST",
        body: formPayload,
      });

      if (response.ok) {
        setResponseType("success");
        setResponseMsg("You have successfully subscribed.");
        setFormData({
          email: "",
          website: "",
        });
      } else {
        setResponseType("error");
        setResponseMsg("Something went wrong. Please try again.");
      }
    } catch (error) {
      setResponseType("error");
      setResponseMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={ABOUT_URL} />
        <meta
          name="keywords"
          content="about Next Online Tools, free online tools, browser based tools, image tools, PDF tools, text tools, SEO tools, spreadsheet tools, social media tools, productivity tools"
        />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={ABOUT_URL} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:alt" content="About Next Online Tools" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

        <meta name="author" content="Next Online Tools" />
        <meta name="publisher" content="Next Online Tools" />
        <meta name="application-name" content="Next Online Tools" />
        <meta name="theme-color" content="#9B6CE3" />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <main className="about-v2-page">
        <nav className="about-v2-breadcrumb" aria-label="Breadcrumb">
          <SmartLink to="/">Home</SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <span>About</span>
        </nav>

        <section className="about-v2-hero">
          <div className="about-v2-hero-content">
            <div className="about-v2-kicker">
              <Icons.Sparkles size={16} />
              <span>About Next Online Tools</span>
            </div>

            <h1>Clean, practical online tools for everyday digital work.</h1>

            <p>
              Next Online Tools helps people complete small but important tasks
              faster, including image editing, PDF work, text formatting, SEO
              preparation, spreadsheet cleanup, social media content, and quick
              file conversions.
            </p>

            <div className="about-v2-hero-actions">
              <SmartLink to="/tools" className="about-v2-primary-btn">
                Explore Tools
                <Icons.ArrowRight size={17} />
              </SmartLink>

              <SmartLink to="/contact" className="about-v2-secondary-btn">
                Request a Tool
              </SmartLink>
            </div>
          </div>

          <div className="about-v2-hero-panel" aria-label="Website highlights">
            <div className="about-v2-stat-card about-v2-stat-main">
              <strong>{totalTools}+</strong>
              <span>Free browser-based tools available now</span>
            </div>

            <div className="about-v2-stat-card">
              <strong>{totalCategories}+</strong>
              <span>Organized tool categories</span>
            </div>

            <div className="about-v2-stat-card">
              <strong>24/7</strong>
              <span>Access from any modern browser</span>
            </div>
          </div>
        </section>

        <section className="about-v2-section about-v2-story">
          <div className="about-v2-story-main">
            <div className="about-v2-section-head">
              <span>Who we are</span>
              <h2>A focused utility platform built around real user tasks.</h2>
              <p>
                Many digital jobs are small, but they slow people down when the
                right tool is hard to find. Next Online Tools brings those
                everyday utilities into one clean place.
              </p>
            </div>

            <div className="about-v2-copy">
              <p>
                The goal of Next Online Tools is simple: help users open a tool,
                understand the next step, complete the task, and continue their
                work without confusion. That is why the platform focuses on
                clean pages, direct actions, helpful instructions, and outputs
                that are easy to copy, download, or reuse.
              </p>

              <p>
                The website is designed for practical workflows. A creator may
                need to resize and compress an image before publishing. A student
                may need to count words or prepare a PDF. A marketer may need to
                format a LinkedIn post, clean a list, or generate a quick QR
                code. Each tool is built to solve these moments with less effort.
              </p>
            </div>
          </div>

          <aside className="about-v2-mission-card">
            <IconBox icon="Target" />

            <span>Our mission</span>

            <h3>Make useful online tools simple, fast, and accessible.</h3>

            <p>
              We are building a growing library of free tools that support
              everyday online work without complicated software, unnecessary
              clutter, or a steep learning curve.
            </p>
          </aside>
        </section>

        <section className="about-v2-section">
          <div className="about-v2-section-head">
            <span>What we focus on</span>
            <h2>Clear tools, clean design, and faster workflows.</h2>
          </div>

          <div className="about-v2-focus-grid">
            {focusCards.map((card) => (
              <article key={card.title} className="about-v2-focus-card">
                <div className="about-v2-card-top">
                  <IconBox icon={card.icon} />
                  <span>{card.label}</span>
                </div>

                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-v2-section">
          <div className="about-v2-section-head-row">
            <div className="about-v2-section-head">
              <span>Built for</span>
              <h2>Different users, one simple tool library.</h2>
              <p>
                The platform is useful for anyone who works with digital files,
                content, documents, websites, or everyday online tasks.
              </p>
            </div>

            <SmartLink to="/tools" className="about-v2-view-all">
              Browse all tools
            </SmartLink>
          </div>

          <div className="about-v2-user-grid">
            {userGroups.map((group) => (
              <article key={group.title} className="about-v2-user-card">
                <IconBox icon={group.icon} />
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-v2-section about-v2-principles">
          <div>
            <div className="about-v2-section-head">
              <span>How we build</span>
              <h2>Our product principles</h2>
              <p>
                Every update should make the website easier to understand,
                faster to use, and more helpful for real work.
              </p>
            </div>

            <SmartLink to="/contact" className="about-v2-secondary-btn">
              Suggest an improvement
            </SmartLink>
          </div>

          <div className="about-v2-principle-list">
            {operatingPrinciples.map((principle) => (
              <div key={principle} className="about-v2-principle-item">
                <Icons.CheckCircle2 size={18} aria-hidden="true" />
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-v2-newsletter" aria-label="Newsletter subscription">
          <div className="about-v2-newsletter-content">
            <IconBox icon="Send" />
            <span>Tool updates</span>
            <h2>Get updates when new tools are released.</h2>
            <p>
              Subscribe for new tool launches, improvements, and practical
              updates from Next Online Tools.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="about-v2-newsletter-form">
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="about-v2-honeypot"
              tabIndex="-1"
              autoComplete="off"
              aria-hidden="true"
            />

            <label>
              <span>Email address</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </label>

            <button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.Loader className="about-v2-spin" size={18} />
                  Subscribing
                </>
              ) : (
                <>
                  <Icons.Send size={18} />
                  Subscribe
                </>
              )}
            </button>

            {responseMsg && (
              <div
                className={`about-v2-response about-v2-response-${responseType || "info"}`}
                role="status"
                aria-live="polite"
              >
                {responseIcon}
                <span>{responseMsg}</span>
              </div>
            )}

            <p className="about-v2-form-note">
              We use your email only for tool updates and website news.
            </p>
          </form>
        </section>

        <section className="about-v2-section">
          <div className="about-v2-section-head">
            <span>FAQ</span>
            <h2>Common questions about Next Online Tools</h2>
          </div>

          <div className="about-v2-faq-grid">
            {faqItems.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
