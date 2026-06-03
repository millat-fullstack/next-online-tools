import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Globe2,
  Layers,
  Loader,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://nextonlinetools.com";
const ABOUT_URL = `${SITE_URL}/about`;
const CONTACT_URL = `${SITE_URL}/contact`;
const TOOLS_URL = `${SITE_URL}/tools`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const NEWSLETTER_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec";

export default function About() {
  const [formData, setFormData] = useState({
    email: "",
    website: "",
  });

  const [responseMsg, setResponseMsg] = useState("");
  const [responseType, setResponseType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const seoTitle =
    "About Next Online Tools | Free Browser-Based Tools for Everyday Tasks";

  const seoDescription =
    "Learn about Next Online Tools, a free browser-based tools platform for image tools, text tools, PDF tools, SEO tools, color tools, conversions, and daily productivity tasks.";

  const seoKeywords =
    "about Next Online Tools, free online tools, browser based tools, image tools, text tools, PDF tools, SEO tools, color tools, productivity tools, online utility tools, free web tools";

  const structuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Next Online Tools",
          url: SITE_URL,
          description:
            "Free browser-based online tools for images, text, PDF, SEO, conversions, colors, productivity, and daily digital tasks.",
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
          logo: DEFAULT_OG_IMAGE,
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
          inLanguage: "en",
          mainEntity: {
            "@id": `${SITE_URL}/#organization`,
          },
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
          mainEntity: [
            {
              "@type": "Question",
              name: "What is Next Online Tools?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Next Online Tools is a free browser-based tools website that helps users complete everyday digital tasks such as image processing, text editing, SEO checks, color work, conversions, and productivity tasks.",
              },
            },
            {
              "@type": "Question",
              name: "Are the tools free to use?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Next Online Tools focuses on providing simple and free online tools for common digital tasks.",
              },
            },
            {
              "@type": "Question",
              name: "Do users need to install software?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. The tools are designed to work directly in the browser without requiring complicated software installation.",
              },
            },
          ],
        },
      ],
    };
  }, [seoDescription, seoTitle]);

  const focusCards = [
    {
      title: "Free to Use",
      label: "Access",
      description:
        "Useful tools for users who need quick online solutions without payment barriers.",
      icon: <CheckCircle size={26} strokeWidth={2.1} />,
    },
    {
      title: "Fast Workflow",
      label: "Speed",
      description:
        "Each tool is designed around one clear task so users can finish work faster.",
      icon: <Zap size={26} strokeWidth={2.1} />,
    },
    {
      title: "User Friendly",
      label: "Simple",
      description:
        "Clean layouts, clear actions, and beginner-friendly tool experiences for everyone.",
      icon: <Users size={26} strokeWidth={2.1} />,
    },
    {
      title: "Practical Tools",
      label: "Utility",
      description:
        "Focused on real daily tasks like image editing, PDF work, SEO, text, and conversions.",
      icon: <Wrench size={26} strokeWidth={2.1} />,
    },
  ];

  const responseIcon =
    responseType === "success" ? (
      <CheckCircle size={20} />
    ) : responseType === "warning" ? (
      <AlertTriangle size={20} />
    ) : responseType === "error" ? (
      <XCircle size={20} />
    ) : null;

  const responseColor =
    responseType === "success"
      ? "green"
      : responseType === "warning"
      ? "#a16207"
      : responseType === "error"
      ? "red"
      : "inherit";

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

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
        setResponseMsg("You have successfully subscribed!");
        setFormData({
          email: "",
          website: "",
        });
      } else {
        setResponseType("error");
        setResponseMsg("Something went wrong. Please try again.");
      }
    } catch (err) {
      setResponseType("error");
      setResponseMsg("Network error, please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta
          name="googlebot"
          content="index, follow, max-image-preview:large"
        />
        <meta name="bingbot" content="index, follow, max-image-preview:large" />

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

      <main className="tools-page">
        {/* HERO */}
        <section className="tools-hero">
          <div className="tools-hero-badge">
            <Sparkles size={16} />
            <span>About Next Online Tools</span>
          </div>

          <h1>Free Online Tools Built for Everyday Digital Tasks</h1>

          <p>
            Next Online Tools helps users complete image, text, PDF, SEO, color,
            conversion, and productivity tasks with simple browser-based tools
            that are fast, clean, and easy to use.
          </p>
        </section>

        {/* ABOUT OVERVIEW */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Who We Are</span>
              <h2>A simple tool platform for faster online work</h2>
            </div>

            <p>No complicated software. No confusing steps. Just useful tools.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="tools-icon shrink-0">
                  <Target size={26} strokeWidth={2.1} />
                </div>

                <div>
                  <span className="text-sm font-semibold text-[var(--primary)]">
                    Our Mission
                  </span>
                  <h2 className="text-2xl font-bold mt-1">
                    Make everyday digital tasks easier for everyone
                  </h2>
                </div>
              </div>

              <p className="text-[var(--text-secondary)] leading-7 mb-4">
                Next Online Tools is created to help students, creators,
                marketers, developers, office users, small business owners, and
                everyday internet users complete small but important digital
                tasks quickly. Many online tasks look simple, but they often
                take extra time when users need to install software, create
                accounts, search for the right feature, or move between
                different websites.
              </p>

              <p className="text-[var(--text-secondary)] leading-7 mb-4">
                Our goal is to bring these useful tools into one clean and
                easy-to-use platform. Whether someone needs to count words,
                compress an image, convert text, prepare a PDF, generate
                colors, check SEO basics, create a quick QR code, or use a
                simple productivity utility, Next Online Tools is designed to
                make the process faster and more comfortable.
              </p>

              <p className="text-[var(--text-secondary)] leading-7 mb-4">
                We focus on browser-based tools that are simple from the first
                click. Users should be able to open a tool, understand what it
                does, complete the task, and move forward without confusion.
                That is why we give importance to clean design, clear labels,
                helpful instructions, fast loading, mobile-friendly layouts, and
                practical features that solve real everyday problems.
              </p>

              <p className="text-[var(--text-secondary)] leading-7">
                As the website grows, we aim to build a wider library of free
                tools for images, text, PDF, SEO, colors, conversions, and daily
                web tasks. Every new tool will follow the same direction: simple
                interface, useful output, smooth experience, and a design that
                helps users finish their work with less effort.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <h3 className="font-bold mb-2">Built for quick tasks</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-6">
                    The platform is focused on everyday actions that users need
                    often, such as editing text, preparing images, checking web
                    content, and converting simple files or values.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <h3 className="font-bold mb-2">Designed for easy use</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-6">
                    Each page is planned with clear instructions, visible
                    buttons, simple input areas, and useful results so visitors
                    can complete tasks without learning complicated steps.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-5">
                  <h3 className="text-2xl font-bold text-[var(--primary)]">
                    100+
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Planned free tools
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-5">
                  <h3 className="text-2xl font-bold text-[var(--primary)]">
                    24/7
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Browser access
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-5">
                  <h3 className="text-2xl font-bold text-[var(--primary)]">
                    Free
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Simple online utility
                  </p>
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-5">
              <div className="tool-card">
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <Globe2 size={26} strokeWidth={2.1} />
                  </div>
                </div>

                <h3>Browser-Based</h3>

                <p>
                  Our tools are designed to work directly online, so users can
                  complete quick tasks without installing extra apps.
                </p>

                <div className="tool-card-bottom">
                  <span>Online Tools</span>
                  <div>
                    <Globe2 size={17} />
                  </div>
                </div>
              </div>

              <div className="tool-card">
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <Layers size={26} strokeWidth={2.1} />
                  </div>
                </div>

                <h3>Multiple Categories</h3>

                <p>
                  We are building tools for images, text, PDF, SEO, colors,
                  conversions, productivity, and everyday digital work.
                </p>

                <div className="tool-card-bottom">
                  <span>Tool Library</span>
                  <div>
                    <Layers size={17} />
                  </div>
                </div>
              </div>

              <div className="tool-card">
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <ShieldCheck size={26} strokeWidth={2.1} />
                  </div>
                </div>

                <h3>Simple & Transparent</h3>

                <p>
                  We keep the interface clear, avoid unnecessary complexity, and
                  design every page to help users understand what to do next.
                </p>

                <div className="tool-card-bottom">
                  <span>Trust</span>
                  <div>
                    <ShieldCheck size={17} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="tools-list-section">
          <div className="card p-6 sm:p-8 text-center">
            <div className="tools-icon mx-auto mb-4">
              <Send size={26} strokeWidth={2.1} />
            </div>

            <span className="text-sm font-semibold text-[var(--primary)]">
              Tool Updates
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-3">
              Stay Updated with Our Latest Tools
            </h2>

            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-6 leading-7">
              Subscribe to get notified when we release new free tools,
              improvements, and useful updates for Next Online Tools.
            </p>

            {responseMsg && (
              <div
                className="mb-5 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 text-sm font-medium max-w-2xl mx-auto"
                style={{ color: responseColor }}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-center gap-2">
                  {responseIcon}
                  <span>{responseMsg}</span>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-2xl flex-col sm:flex-row gap-4 justify-center"
            >
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="hidden"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="input flex-1"
                required
                disabled={isLoading}
                autoComplete="email"
              />

              <button
                type="submit"
                className="btn-primary justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Subscribe
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-[var(--text-secondary)] mt-4">
              We use your email only for tool updates and website news.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Quick Answers</span>
              <h2>About Next Online Tools</h2>
            </div>

            <p>Helpful information for new visitors.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                What is Next Online Tools?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-6">
                It is a free online tools platform for everyday tasks like image
                processing, text editing, PDF work, SEO checks, colors,
                conversions, and productivity.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">Are the tools free?</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-6">
                Yes. The website focuses on simple, free, browser-based tools
                that help users finish common digital tasks quickly.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                Do I need to install anything?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-6">
                No. The tools are designed to work directly in the browser, so
                users can open a page and complete the task online.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}