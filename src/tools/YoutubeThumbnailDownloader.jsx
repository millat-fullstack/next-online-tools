import { useMemo, useState } from "react";
import {
  Youtube,
  Link,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Check,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "YouTube Thumbnail Downloader",
  path: "/youtube-thumbnail-downloader",
  category: "Video Tools",
  description:
    "Download YouTube video thumbnails in multiple sizes. Paste a YouTube video or Shorts link and get thumbnail previews instantly.",
  metaTitle: "YouTube Thumbnail Downloader | Download Video Thumbnail Online",
  metaDescription:
    "Download YouTube video thumbnails online for free. Paste a YouTube video, Shorts, or youtu.be link and get HD, SD, and default thumbnail sizes instantly.",
};

const THUMBNAIL_SIZES = [
  {
    key: "maxres",
    label: "Max Resolution",
    file: "maxresdefault.jpg",
    size: "1280 × 720",
    note: "Best quality, if available",
  },
  {
    key: "sd",
    label: "Standard Quality",
    file: "sddefault.jpg",
    size: "640 × 480",
    note: "Good quality",
  },
  {
    key: "hq",
    label: "High Quality",
    file: "hqdefault.jpg",
    size: "480 × 360",
    note: "Common preview size",
  },
  {
    key: "mq",
    label: "Medium Quality",
    file: "mqdefault.jpg",
    size: "320 × 180",
    note: "Small preview size",
  },
  {
    key: "default",
    label: "Default",
    file: "default.jpg",
    size: "120 × 90",
    note: "Smallest size",
  },
];

export default function YoutubeThumbnailDownloader() {
  const [inputUrl, setInputUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");
  const [imageStatus, setImageStatus] = useState({});

  const thumbnails = useMemo(() => {
    if (!videoId) return [];

    return THUMBNAIL_SIZES.map((item) => ({
      ...item,
      url: `https://img.youtube.com/vi/${videoId}/${item.file}`,
      downloadName: `youtube-thumbnail-${videoId}-${item.key}.jpg`,
    }));
  }, [videoId]);

  const extractYoutubeVideoId = (url) => {
    const value = url.trim();

    if (!value) return "";

    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
      return value;
    }

    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match?.[1]) return match[1];
    }

    try {
      const parsedUrl = new URL(value);
      const idFromQuery = parsedUrl.searchParams.get("v");

      if (idFromQuery && /^[a-zA-Z0-9_-]{11}$/.test(idFromQuery)) {
        return idFromQuery;
      }
    } catch {
      return "";
    }

    return "";
  };

  const handleGenerate = () => {
    setError("");
    setSuccess("");
    setCopiedKey("");
    setImageStatus({});

    const extractedId = extractYoutubeVideoId(inputUrl);

    if (!inputUrl.trim()) {
      setVideoId("");
      setError("Please paste a YouTube video, Shorts, or youtu.be link first.");
      return;
    }

    if (!extractedId) {
      setVideoId("");
      setError("Could not find a valid YouTube video ID from this link.");
      return;
    }

    setVideoId(extractedId);
    setSuccess("Thumbnails generated successfully.");
  };

  const handleCopy = async (thumbnail) => {
    try {
      await navigator.clipboard.writeText(thumbnail.url);
      setCopiedKey(thumbnail.key);
      setError("");

      setTimeout(() => {
        setCopiedKey("");
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the thumbnail URL manually.");
    }
  };

  const handleDownload = async (thumbnail) => {
    setDownloadingKey(thumbnail.key);
    setError("");

    try {
      const response = await fetch(thumbnail.url);

      if (!response.ok) {
        throw new Error("Thumbnail is not available.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = thumbnail.downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(thumbnail.url, "_blank", "noopener,noreferrer");
      setError(
        "Direct download was blocked by the browser. The thumbnail opened in a new tab, so you can save it from there."
      );
    } finally {
      setDownloadingKey("");
    }
  };

  const handleReset = () => {
    setInputUrl("");
    setVideoId("");
    setError("");
    setSuccess("");
    setCopiedKey("");
    setDownloadingKey("");
    setImageStatus({});
  };

  const handleImageLoad = (key) => {
    setImageStatus((prev) => ({
      ...prev,
      [key]: "loaded",
    }));
  };

  const handleImageError = (key) => {
    setImageStatus((prev) => ({
      ...prev,
      [key]: "error",
    }));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Youtube size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          YouTube Thumbnail Downloader
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste a YouTube video, Shorts, or youtu.be link and instantly preview
          thumbnails in multiple sizes. Download the thumbnail you need in one
          click.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-[#f8f4ff]">
              <div className="flex items-center gap-2 mb-4">
                <Link size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Paste YouTube Link</h2>
              </div>

              <label className="block text-sm font-semibold mb-2">
                YouTube URL or Video ID
              </label>

              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setVideoId("");
                  setError("");
                  setSuccess("");
                  setCopiedKey("");
                  setImageStatus({});
                }}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
              />

              <p className="text-sm text-[var(--text-secondary)] mt-3">
                Supports normal YouTube links, Shorts links, youtu.be links,
                embed links, and direct video IDs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Get Thumbnails
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                Please download and use thumbnails only when you own the content
                or have permission. Some thumbnail sizes, especially max
                resolution, may not be available for every video.
              </p>
            </div>

            {videoId && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Video ID" value={videoId} />
                <StatCard label="Sizes Found" value={thumbnails.length} green />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Thumbnail Preview</h2>
              </div>

              {!videoId ? (
                <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <ImageIcon size={44} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[var(--text-secondary)]">
                    Paste a YouTube link and click “Get Thumbnails”.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {thumbnails.map((thumbnail) => {
                    const status = imageStatus[thumbnail.key];

                    return (
                      <div
                        key={thumbnail.key}
                        className="border border-[var(--border)] rounded-2xl bg-gray-50 p-4"
                      >
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold">
                              {thumbnail.label}
                            </h3>

                            <p className="text-xs text-[var(--text-secondary)]">
                              {thumbnail.size} • {thumbnail.note}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(thumbnail)}
                            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                              copiedKey === thumbnail.key
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                            }`}
                            title="Copy thumbnail URL"
                          >
                            {copiedKey === thumbnail.key ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                            {copiedKey === thumbnail.key ? "Copied" : "Copy"}
                          </button>
                        </div>

                        <div className="bg-white border border-[var(--border)] rounded-xl p-3 flex items-center justify-center min-h-[180px]">
                          {status === "error" ? (
                            <div className="text-center py-8">
                              <AlertCircle
                                size={34}
                                className="mx-auto mb-2 text-red-400"
                              />
                              <p className="text-sm text-red-600">
                                This size is not available for this video.
                              </p>
                            </div>
                          ) : (
                            <img
                              src={thumbnail.url}
                              alt={`${thumbnail.label} thumbnail`}
                              onLoad={() => handleImageLoad(thumbnail.key)}
                              onError={() => handleImageError(thumbnail.key)}
                              className="max-h-80 w-full object-contain rounded-lg"
                            />
                          )}
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => handleDownload(thumbnail)}
                            disabled={status === "error"}
                            className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                              status === "error"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Download size={18} />
                            {downloadingKey === thumbnail.key
                              ? "Downloading..."
                              : "Download"}
                          </button>

                          <a
                            href={thumbnail.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                          >
                            <ImageIcon size={18} />
                            Open Image
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="youtube-thumbnail-downloader" />
    </div>
  );
}

function StatCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}