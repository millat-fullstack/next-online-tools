import { useMemo, useState } from "react";
import {
  Mail,
  MessageCircle,
  Send,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Sparkles,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://nextonlinetools.com";
const CONTACT_URL = `${SITE_URL}/contact`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [responseMsg, setResponseMsg] = useState("");
  const [responseIcon, setResponseIcon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const seoTitle =
    "Contact Next Online Tools | Support, Feedback & Free Tool Requests";

  const seoDescription =
    "Contact Next Online Tools for support, website feedback, bug reports, partnership questions, or suggestions for new free online tools. Send your message easily online.";

  const seoKeywords =
    "contact Next Online Tools, Next Online Tools support, online tools support, free tools feedback, tool request, suggest online tool, website feedback, report tool issue, free web tools contact, browser based tools support";

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
            target: `${SITE_URL}/tools?search={search_term_string}`,
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
            "@type": "Organization",
            name: "Next Online Tools",
            url: SITE_URL,
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
      ],
    };
  }, [seoDescription, seoTitle]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setResponseIcon(<AlertTriangle size={20} />);
      setResponseMsg("Please fill in all fields before sending your message.");
      return;
    }

    setIsLoading(true);
    setResponseMsg("");
    setResponseIcon(null);

    const formPayload = new FormData();
    formPayload.append("name", formData.name);
    formPayload.append("email", formData.email);
    formPayload.append("message", formData.message);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec",
        {
          method: "POST",
          body: formPayload,
        }
      );

      if (response.ok) {
        setResponseIcon(<CheckCircle size={20} />);
        setResponseMsg("Your message has been sent successfully!");
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      } else {
        setResponseIcon(<XCircle size={20} />);
        setResponseMsg("Something went wrong. Please try again.");
      }
    } catch (err) {
      setResponseIcon(<AlertTriangle size={20} />);
      setResponseMsg("Network error, please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const responseColor = responseMsg.includes("success")
    ? "green"
    : responseMsg
    ? "red"
    : "inherit";

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        <meta name="bingbot" content="index, follow, max-image-preview:large" />

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

      <main className="tools-page">
        {/* HERO */}
        <section className="tools-hero">
          <div className="tools-hero-badge">
            <Sparkles size={16} />
            <span>Contact Us</span>
          </div>

          <h1>Get in Touch with Next Online Tools</h1>

          <p>
            Have a question, suggestion, bug report, or new tool request? Send
            us a message. We are always working to improve our free online
            tools for everyone.
          </p>
        </section>

        {/* CONTACT */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Support & Feedback</span>
              <h2>Send a Message</h2>
            </div>

            <p>We usually review tool requests and feedback carefully</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-5">Send a Message</h2>

              {responseMsg && (
                <div
                  className="mb-5 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 text-sm font-medium"
                  style={{ color: responseColor }}
                >
                  <div className="flex items-center gap-2">
                    {responseIcon}
                    <span>{responseMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="input"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="input"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message or tool request"
                    rows="6"
                    className="input resize-none"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-fit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            <aside className="flex flex-col gap-5">
              <div className="tool-card">
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <Mail size={26} strokeWidth={2.1} />
                  </div>
                </div>

                <h3>Email Support</h3>

                <p>
                  Contact us for general questions, online tool support,
                  technical issues, or website feedback.
                </p>

                <div className="tool-card-bottom">
                  <span>Support</span>
                  <div>
                    <Mail size={17} />
                  </div>
                </div>
              </div>

              <div className="tool-card">
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <MessageCircle size={26} strokeWidth={2.1} />
                  </div>
                </div>

                <h3>Tool Suggestions</h3>

                <p>
                  Suggest new free online tools that can help users complete
                  image, PDF, SEO, text, and conversion tasks faster.
                </p>

                <div className="tool-card-bottom">
                  <span>Suggestions</span>
                  <div>
                    <MessageCircle size={17} />
                  </div>
                </div>
              </div>

              <div className="tool-card">
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <HelpCircle size={26} strokeWidth={2.1} />
                  </div>
                </div>

                <h3>Need Help?</h3>

                <p>
                  Tell us what is not working properly and we will try to
                  improve the tool experience for future users.
                </p>

                <div className="tool-card-bottom">
                  <span>Help</span>
                  <div>
                    <HelpCircle size={17} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}