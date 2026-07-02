import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import tools from "../data/tools.json";
import SmartLink from "../components/ui/SmartLink";
import "../styles/about.css";

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

  const categories = useMemo(() => {
    return [
      ...new Set(tools.map((tool) => normalizeText(tool.category)).filter(Boolean)),
    ];
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
      label: "Clarity",
      description:
        "Every tool page is planned around one clear task, obvious actions, useful guidance, and a result that is easy to copy or download.",
      icon: "MousePointerClick",
    },
    {
      title: "Fast everyday workflow",
      label: "Speed",
      description:
        "Users can open a tool, complete the job, and continue their work without installing heavy software or creating complicated setups.",
      icon: "Zap",
    },
    {
      title: "Practical tool library",
      label: "Utility",
      description:
        "The platform focuses on useful categories such as image tools, PDF tools, text tools, SEO tools, spreadsheet tools, and converters.",
      icon: "Layers",
    },
    {
      title: "Built for real use cases",
      label: "People",
      description:
        "The site is shaped for students, creators, marketers, office users, developers, website owners, and small business teams.",
      icon: "Users",
    },
  ];

  const audiences = [
    {
      title: "Creators and marketers",
      description:
        "Prepare visuals, format social posts, compress files, create thumbnails, generate QR codes, and polish campaign assets.",
      icon: "Megaphone",
    },
    {
      title: "Students and office users",
      description:
        "Work with PDFs, count words, convert files, clean text, organize documents, and finish repeated daily tasks faster.",
      icon: "Briefcase",
    },
    {
      title: "Website and SEO teams",
      description:
        "Generate slugs, optimize images, clean copy, prepare content assets, and support publishing workflows.",
      icon: "SearchCheck",
    },
  ];

  const principles = [
    "Keep every tool focused on one clear job.",
    "Make the first action easy to understand.",
    "Reduce clutter and unnecessary steps.",
    "Write helpful instructions for beginners and busy users.",
    "Improve the platform based on real workflow problems.",
  ];

  const categoryPreview = [
    "Image Tools",
    "PDF Tools",
    "Text Tools",
    "Spreadsheet Tools",
    "SEO Tools",
    "Social Media Tools",
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
        "Yes. The platform focuses on simple free tools that help users complete common digital jobs quickly.",
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

        <section className="about-hero">
          <div className="about-hero-copy">
            <span className="about-kicker">
              <Icons.Sparkles size={15} />
              About Next Online Tools
            </span>

            <h1>Practical browser-based tools for everyday digital work.</h1>

            <p>
              Next Online Tools brings focused utilities for images, PDFs, text,
              SEO, spreadsheets, social content, and quick conversions into one
              clean platform.
            </p>

            <div className="about-hero-actions">
              <SmartLink to="/tools" className="about-primary-btn">
                Explore Tools
                <Icons.ArrowRight size={16} />
              </SmartLink>

              <SmartLink to="/contact" className="about-secondary-btn">
                Request a Tool
              </SmartLink>
            </div>
          </div>

          <aside className="about-snapshot" aria-label="Website snapshot">
            <div>
              <strong>{totalTools}+</strong>
              <span>Free tools available</span>
            </div>

            <div>
              <strong>{totalCategories}+</strong>
              <span>Organized categories</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Browser access</span>
            </div>
          </aside>
        </section>

        <section className="about-section about-intro-grid">
          <div>
            <div className="about-section-head">
              <span>Who we are</span>
              <h2>A focused utility platform built around real user tasks.</h2>
              <p>
                Many digital jobs are small, but they slow people down when the
                right tool is hard to find. Next Online Tools makes those tasks
                easier to complete from one clean place.
              </p>
            </div>

            <div className="about-copy-block">
              <p>
                Our goal is to help users open a tool, understand the next step,
                complete the task, and continue their work without confusion.
                That is why the platform focuses on clean pages, direct actions,
                helpful instructions, and outputs that are easy to reuse.
              </p>

              <p>
                Whether someone needs to resize an image, compress a PDF, count
                words, format a LinkedIn post, generate a slug, extract links
                from a spreadsheet, or convert a file, the experience should be
                fast and simple.
              </p>
            </div>
          </div>

          <aside className="about-mission-card">
            <IconBox icon="Target" />
            <span>Our mission</span>
            <h3>Make useful online tools simple, fast, and accessible.</h3>
            <p>
              We are building a growing library of free browser tools that solve
              common digital tasks without clutter, heavy software, or a steep
              learning curve.
            </p>
          </aside>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <span>What we focus on</span>
            <h2>Clear tools, clean design, and faster workflows.</h2>
          </div>

          <div className="about-card-grid">
            {focusCards.map((card) => (
              <article key={card.title} className="about-card">
                <div className="about-card-top">
                  <IconBox icon={card.icon} />
                  <small>{card.label}</small>
                </div>

                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-audience-section">
          <div className="about-section-row">
            <div className="about-section-head">
              <span>Built for</span>
              <h2>Different users, one simple tool library.</h2>
              <p>
                The platform is useful for anyone who works with digital files,
                content, documents, websites, or everyday online tasks.
              </p>
            </div>

            <SmartLink to="/tools" className="about-tertiary-btn">
              Browse all tools
            </SmartLink>
          </div>

          <div className="about-audience-grid">
            {audiences.map((group) => (
              <article key={group.title} className="about-audience-card">
                <IconBox icon={group.icon} />
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-principles">
          <div>
            <div className="about-section-head">
              <span>How we build</span>
              <h2>Product principles that keep the site useful.</h2>
              <p>
                Every update should make the website easier to understand,
                faster to use, and more helpful for real work.
              </p>
            </div>

            <SmartLink to="/contact" className="about-secondary-btn">
              Suggest an improvement
            </SmartLink>
          </div>

          <div className="about-principle-list">
            {principles.map((principle) => (
              <div key={principle} className="about-principle-item">
                <Icons.CheckCircle2 size={18} aria-hidden="true" />
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-row">
            <div className="about-section-head">
              <span>Tool categories</span>
              <h2>Useful categories for common digital tasks.</h2>
            </div>

            <SmartLink to="/tools" className="about-tertiary-btn">
              View all categories
            </SmartLink>
          </div>

          <div className="about-category-strip">
            {categoryPreview.map((category) => (
              <SmartLink
                key={category}
                to={`/tools?category=${encodeURIComponent(category)}`}
              >
                {category}
                <Icons.ArrowUpRight size={14} />
              </SmartLink>
            ))}
          </div>
        </section>

        <section
          className="about-newsletter"
          aria-label="Newsletter subscription"
        >
          <div className="about-newsletter-copy">
            <IconBox icon="Send" />
            <span>Tool updates</span>
            <h2>Get updates when new tools are released.</h2>
            <p>
              Subscribe for new tool launches, improvements, and practical
              updates from Next Online Tools.
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
