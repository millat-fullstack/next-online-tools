import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import SmartLink from "../components/ui/SmartLink";
import "../styles/contact.css";

const SITE_URL = "https://nextonlinetools.com";
const CONTACT_URL = `${SITE_URL}/contact`;
const TOOLS_URL = `${SITE_URL}/tools`;
const BLOG_URL = `${SITE_URL}/blog`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const CONTACT_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec";

const CONTACT_REASONS = [
  "General question",
  "Tool feedback",
  "Bug report",
  "Content feedback",
  "Partnership or business",
];

const FAQ_ITEMS = [
  {
    question: "What should I include in my message?",
    answer:
      "Share the page or tool name, what you were trying to do, what happened, and the device or browser you used if it is related to a technical issue.",
  },
  {
    question: "Can I report a bug?",
    answer:
      "Yes. If a tool is not working as expected, send a clear description so we can review the issue and improve the experience.",
  },
  {
    question: "Can I send website feedback?",
    answer:
      "Yes. Feedback about usability, content, guides, or tool experience helps us make Next Online Tools cleaner and more useful.",
  },
];

function ContactIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.MessageCircle;

  return (
    <span className="contact-icon" aria-hidden="true">
      <IconComponent size={22} strokeWidth={2.1} />
    </span>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: CONTACT_REASONS[0],
    message: "",
    website: "",
  });

  const [responseMsg, setResponseMsg] = useState("");
  const [responseType, setResponseType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const seoTitle = "Contact Next Online Tools | Support & Feedback";

  const seoDescription =
    "Contact Next Online Tools for support, website feedback, bug reports, content questions, partnership messages, or help with free browser-based online tools.";

  const seoKeywords =
    "contact Next Online Tools, Next Online Tools support, online tools feedback, report tool issue, browser based tools support, website feedback, free online tools contact";

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
          "@type": "ContactPage",
          "@id": `${CONTACT_URL}#webpage`,
          url: CONTACT_URL,
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
          "@id": `${CONTACT_URL}#breadcrumb`,
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
              name: "Contact",
              item: CONTACT_URL,
            },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${CONTACT_URL}#faq`,
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

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setResponseType("warning");
      setResponseMsg("Please fill in your name, email, and message before sending.");
      return;
    }

    setIsLoading(true);
    setResponseMsg("");
    setResponseType(null);

    const formPayload = new FormData();
    formPayload.append("name", formData.name.trim());
    formPayload.append("email", formData.email.trim());
    formPayload.append("topic", formData.topic);
    formPayload.append("message", formData.message.trim());
    formPayload.append("source", "Contact page");

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        body: formPayload,
      });

      if (response.ok) {
        setResponseType("success");
        setResponseMsg("Your message has been sent successfully.");
        setFormData({
          name: "",
          email: "",
          topic: CONTACT_REASONS[0],
          message: "",
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
        <link rel="canonical" href={CONTACT_URL} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={CONTACT_URL} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:alt" content="Contact Next Online Tools" />
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

      <main className="contact-page">
        <nav className="contact-breadcrumb" aria-label="Breadcrumb">
          <SmartLink to="/">Home</SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <span>Contact</span>
        </nav>

        <section className="contact-hero">
          <div className="contact-hero-copy">
            <span className="contact-kicker">
              <Icons.Sparkles size={15} aria-hidden="true" />
              Contact Next Online Tools
            </span>

            <h1>Need help or want to share feedback?</h1>

            <p>
              Send us a clear message about support questions, website feedback,
              content suggestions, or tool issues. We use every useful note to
              improve the Next Online Tools experience.
            </p>
          </div>

          <aside className="contact-hero-note" aria-label="Contact guidance">
            <ContactIcon icon="MessageCircle" />
            <strong>Clear details help us respond better.</strong>
            <span>
              Mention the page, tool name, issue, and browser/device details if
              your message is about a technical problem.
            </span>
          </aside>
        </section>

        <section className="contact-layout" aria-label="Contact form and support information">
          <div className="contact-form-card">
            <div className="contact-section-head">
              <span>Send a message</span>
              <h2>Tell us how we can help</h2>
              <p>
                Use this form for support, feedback, bug reports, content notes,
                or business questions related to Next Online Tools.
              </p>
            </div>

            {responseMsg && (
              <div
                className={`contact-response contact-response-${responseType || "info"}`}
                role="status"
                aria-live="polite"
              >
                {responseIcon}
                <span>{responseMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="contact-honeypot"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="contact-field-grid">
                <label>
                  <span>Your name</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </label>

                <label>
                  <span>Email address</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </label>
              </div>

              <label>
                <span>Topic</span>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  {CONTACT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Message</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message with as much helpful detail as possible"
                  rows="7"
                  disabled={isLoading}
                />
              </label>

              <button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Icons.Loader className="contact-spin" size={18} />
                    Sending
                  </>
                ) : (
                  <>
                    <Icons.Send size={18} />
                    Send message
                  </>
                )}
              </button>
            </form>
          </div>

          <aside className="contact-info-panel">
            <article className="contact-info-card contact-info-card-primary">
              <ContactIcon icon="Mail" />
              <h3>Support and feedback</h3>
              <p>
                Share questions, issue reports, usability feedback, or content
                notes related to the website and its tools.
              </p>
            </article>

            <article className="contact-info-card">
              <ContactIcon icon="Bug" />
              <h3>Report an issue</h3>
              <p>
                Include the tool name, what you entered, what happened, and what
                result you expected.
              </p>
            </article>

            <article className="contact-info-card">
              <ContactIcon icon="FileText" />
              <h3>Explore first</h3>
              <p>
                You may find a direct solution in the tools library or one of
                our practical guides.
              </p>
              <div className="contact-card-links">
                <SmartLink to="/tools">Browse tools</SmartLink>
                <SmartLink to={BLOG_URL.replace(SITE_URL, "")}>Read guides</SmartLink>
              </div>
            </article>
          </aside>
        </section>

        <section className="contact-faq-section">
          <div className="contact-section-head">
            <span>Quick answers</span>
            <h2>Before you send a message</h2>
          </div>

          <div className="contact-faq-grid">
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
