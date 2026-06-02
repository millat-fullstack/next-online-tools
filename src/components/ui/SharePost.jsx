import { useEffect, useState } from "react";
import {
  Copy,
  Facebook,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Share2,
  Twitter
} from "lucide-react";

export default function SharePost({ title = "Next Online Tools Blog Post" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  const shareText = `${title} · Read this post on Next Online Tools.`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);
  const nativeShareSupported =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".share-post-menu")
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleCopyLink = async () => {
    if (!url || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (!nativeShareSupported || !url) {
      return;
    }

    try {
      await navigator.share({
        title,
        text: shareText,
        url
      });
      setOpen(false);
    } catch {
      // ignore share cancel or failure
    }
  };

  const shareLinks = [
    {
      label: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      label: "WhatsApp",
      icon: MessageSquare,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`
    }
  ];

  const handleOpenLink = (href) => {
    if (!href) {
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="relative share-post-menu">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="btn-secondary inline-flex items-center justify-center gap-2"
      >
        <Share2 size={18} />
        Share this post
      </button>

      {open && (
        <div className="absolute right-0 bottom-full z-20 mb-2 w-[260px] min-w-[240px] rounded-3xl border border-[var(--border)] bg-white p-3 shadow-xl dark:bg-[#08111f] dark:border-neutral-800">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Share this post</p>
              <p className="text-xs text-[var(--text-secondary)]">Choose a platform or copy the link.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>

          <div className="grid gap-2">
            {nativeShareSupported && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="btn-primary inline-flex items-center justify-between gap-2"
              >
                <MessageCircle size={16} />
                Share with device
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-secondary inline-flex items-center justify-between gap-2"
            >
              <span className="inline-flex items-center gap-2">
                <Copy size={16} />
                {copied ? "Link copied" : "Copy link"}
              </span>
            </button>

            {shareLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleOpenLink(item.href)}
                  className="btn-secondary inline-flex items-center justify-between gap-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon size={16} />
                    {item.label}
                  </span>
                  <Link2 size={14} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
