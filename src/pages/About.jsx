import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import SmartLink from "../components/ui/SmartLink";
import "../styles/about.css";

const SITE_URL = "https://nextonlinetools.com";
const ABOUT_URL = `${SITE_URL}/about`;
const CONTACT_URL = `${SITE_URL}/contact`;
const TOOLS_URL = `${SITE_URL}/tools`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const NEWSLETTER_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec";

const FOCUS_CARDS = [
  {
    title: "One task, one clear tool",
    description:
      "Every tool is designed around a specific job, so users can understand the page quickly and complete the task without extra steps.",
    icon: "MousePointerClick",
  },
  {
    title: "Faster everyday work",
    description:
      "The platform helps users finish small digital tasks faster, from preparing files to cleaning content and organizing work assets.",
    icon: "Zap",
  },
  {
    title: "Browser-based access",
    description:
      "Users can work directly from a modern browser without installing heavy software for simple daily tasks.",
    icon: "Globe2",
  },
];

const AUDIENCE_CARDS = [
  {
    title: "Students and office users",
    description:
      "Useful for quick document, text, file, and productivity tasks that come up during study, reporting, and daily office work.",
    icon: "BriefcaseBusiness",
  },
  {
    title: "Creators and marketers",
    description:
      "Helpful for preparing content assets, social posts, visuals, thumbnails, captions, and simple campaign materials.",
    icon: "Megaphone",
  },
  {
    title: "Website and SEO teams",
    description:
      "Made to support publishing workflows, content preparation, image optimization, URL cleanup, and small website tasks.",
    icon: "SearchCheck",
  },
];

const PRINCIPLES = [
  "Keep the interface clean and easy to understand.",
  "Make the main action visible from the first screen.",
  "Reduce unnecessary clicks, clutter, and confusing labels.",
  "Write guidance that helps beginners and busy users.",
  "Organize tools so users can find relevant solutions faster.",
];

const FAQ_ITEMS = [
  {
    question: "What is Next Online Tools?",
    answer:
      "Next Online Tools is a free browser-based tools platform for everyday digital tasks such as image work, PDF tasks, text formatting, SEO preparation, spreadsheet cleanup, conversions, colors, and productivity work.",
  },
  {
    question: "What is the mission of the website?",
    answer:
      "The mission is to make common online tasks simple, fast, and accessible through focused tools that work directly in the browser.",
  },
  {
    question: "Do users need to install software?",
    answer:
      "No. The tools are designed to work from a browser, so users can complete quick tasks without installing heavy software.",
  },
  {
    question: "Who is this website useful for?",
    answer:
      "It is useful for students, creators, marketers, office users, developers, website owners, small businesses, and anyone who needs practical online utility tools.",
  },
];

function IconBox({ icon, size = 22 }) {
  const IconComponent = Icons[icon] || Icons.Sparkles;

  return (
    <span className="about-icon" aria-hidden="true">
      <IconComponent size={size} strokeWidth={2.1} />
    </span>
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

  const seoTitle =
    "About Next Online Tools | Free Browser-Based Tools for Daily Work";

  const seoDescription =
    "Learn about Next Online Tools, a clean free online tools platform built to make images, PDFs, text, SEO, spreadsheets, conversions, social media, and everyday digital work easier.";

  const responseIcon =
    responseType === "success" ? (
      <Icons.CheckCircle size={18} />
    ) : responseType === "warning" ? (
      <Icons.AlertTriangle size={18} />
    ) : responseType === "error" ? (
      <Icons.XCircle size={18} />
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
          mainEntity: FAQ_ITEMS.map((item) => ({
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
  }, [seoDescription, seoTitle]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (formData.website) return;

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
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1"
        />

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

      <main className="about-page">
        <nav className="about-breadcrumb" aria-label="Breadcrumb">
          <SmartLink to="/">Home</SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <span>About</span>
        </nav>

        <section className="about-hero about-hero-clean">
          <div className="about-hero-copy">
            <span className="about-kicker">
              <Icons.Sparkles size={15} />
              About Next Online Tools
            </span>

            <h1>Simple online tools for faster everyday digital work.</h1>

            <p>
              Next Online Tools is a free browser-based utility platform that
              helps people complete common digital tasks with less friction,
              cleaner workflows, and no unnecessary software setup.
            </p>

            <div className="about-hero-actions">
              <SmartLink to="/tools" className="about-primary-btn">
                Explore Tools
                <Icons.ArrowRight size={16} />
              </SmartLink>
            </div>
          </div>
        </section>

        <section className="about-section about-overview">
          <div className="about-section-head">
            <span>What the website is about</span>
            <h2>A clean place to finish small but important online tasks.</h2>
            <p>
              Many digital jobs are simple, but they still take time when users
              need to search for the right feature, install software, or move
              between many websites. Next Online Tools brings practical tools
              into one focused platform.
            </p>
          </div>

          <div className="about-copy-block about-copy-large">
            <p>
              The website is built for everyday actions such as preparing files,
              editing text, organizing documents, cleaning data, improving web
              content, and creating quick digital assets. The goal is to make
              each task feel direct: choose the tool, follow the clear action,
              get the result, and continue your work.
            </p>

            <p>
              Tools are organized into relevant groups so visitors can find the
              right solution faster and work more efficiently without digging
              through unrelated pages.
            </p>
          </div>
        </section>

        <section className="about-section about-mission-vision">
          <article className="about-statement-card">
            <IconBox icon="Target" />
            <span>Mission</span>
            <h2>Make useful online tools simple, fast, and accessible.</h2>
            <p>
              We want users to complete common digital tasks from the browser
              without clutter, complicated steps, or heavy software.
            </p>
          </article>

          <article className="about-statement-card">
            <IconBox icon="Eye" />
            <span>Vision</span>
            <h2>Build a trusted utility hub for daily digital work.</h2>
            <p>
              Our vision is to make Next Online Tools a reliable place where
              people can quickly solve everyday file, content, website, and
              productivity problems.
            </p>
          </article>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <span>How we help</span>
            <h2>Focused tools, clear actions, and practical results.</h2>
          </div>

          <div className="about-card-grid">
            {FOCUS_CARDS.map((card) => (
              <article key={card.title} className="about-card">
                <IconBox icon={card.icon} />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-audience-section">
          <div className="about-section-head">
            <span>Built for real work</span>
            <h2>Useful for different people and everyday workflows.</h2>
            <p>
              The platform is designed for anyone who works with digital files,
              content, documents, websites, spreadsheets, or repeated online
              tasks.
            </p>
          </div>

          <div className="about-audience-grid">
            {AUDIENCE_CARDS.map((group) => (
              <article key={group.title} className="about-audience-card">
                <IconBox icon={group.icon} />
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-principles-clean">
          <div className="about-section-head">
            <span>Product principles</span>
            <h2>What guides every page and tool we build.</h2>
            <p>
              Every update should make the website easier to understand, faster
              to use, and more helpful for real digital work.
            </p>
          </div>

          <div className="about-principle-list">
            {PRINCIPLES.map((principle) => (
              <div key={principle} className="about-principle-item">
                <Icons.CheckCircle2 size={18} aria-hidden="true" />
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="about-newsletter about-newsletter-clean"
          aria-label="Newsletter subscription"
        >
          <div className="about-newsletter-copy">
            <IconBox icon="Send" />
            <span>Tool updates</span>
            <h2>Stay updated as the platform improves.</h2>
            <p>
              Get occasional updates about new tools, useful improvements, and
              practical guides from Next Online Tools.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="about-newsletter-form">
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="about-honeypot"
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
                  <Icons.Loader className="about-spin" size={18} />
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
                className={`about-response about-response-${responseType || "info"}`}
                role="status"
                aria-live="polite"
              >
                {responseIcon}
                <span>{responseMsg}</span>
              </div>
            )}

            <p className="about-form-note">
              We use your email only for tool updates and website news.
            </p>
          </form>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <span>FAQ</span>
            <h2>Common questions about Next Online Tools</h2>
          </div>

          <div className="about-faq-grid">
            {FAQ_ITEMS.map((item) => (
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
