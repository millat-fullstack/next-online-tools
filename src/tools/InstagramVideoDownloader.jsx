import { useState, useRef } from "react";
import { Download, RotateCcw, Zap, Link2 } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Instagram Video Downloader",
  path: "/instagram-video-downloader",
  category: "Video Tools",
  description:
    "Download Instagram videos directly to your device by simply pasting the video URL. No apps, no signups.",
  metaTitle:
    "Instagram Video Downloader - Download Videos from Instagram | Next Online Tools",
  metaDescription:
    "Instantly download Instagram videos with ease. Simply paste the URL and get the video in high quality without needing any external apps.",
};

export default function InstagramVideoDownloader() {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  
  const urlInputRef = useRef(null);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError("Please enter a valid Instagram video URL.");
      return;
    }
    
    setError("");
    setDownloadMessage("");
    setIsDownloading(true);

    // Fetching the download URL
    try {
      // Placeholder logic for Instagram video URL extraction (for demonstration purposes)
      // You should integrate an actual service or API to retrieve Instagram video download links
      const videoId = url.split("https://www.instagram.com/p/")[1]?.split("/")[0];
      
      if (!videoId) {
        setError("Invalid URL format. Please ensure the URL is correct.");
        setIsDownloading(false);
        return;
      }

      // Simulating fetching video URL from Instagram (this will need a real service or API)
      const videoDownloadUrl = `https://path_to_download_video/${videoId}.mp4`;

      // Set the video download URL
      setDownloadUrl(videoDownloadUrl);
      setDownloadMessage("Video is ready to download!");
      setIsDownloading(false);
    } catch (err) {
      setError("Failed to fetch video. Please try again later.");
      setIsDownloading(false);
    }
  };

  const resetTool = () => {
    setUrl("");
    setVideoUrl("");
    setError("");
    setIsDownloading(false);
    setDownloadUrl("");
    setDownloadMessage("");
    if (urlInputRef.current) urlInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Zap size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Instagram Video Downloader</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Download Instagram videos by pasting the video URL. No apps or signups required.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={20} className="text-[var(--primary)]" />
            <h2 className="text-xl font-semibold">Paste Instagram Video URL</h2>
          </div>

          <input
            ref={urlInputRef}
            type="text"
            placeholder="Enter Instagram Video URL here..."
            onChange={(e) => setUrl(e.target.value)}
            value={url}
            className="w-full p-4 rounded-2xl border border-[var(--border)] bg-white outline-none focus:border-[var(--primary)] transition"
          />

          {error && (
            <p className="mt-5 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary w-full"
            >
              {isDownloading ? "Fetching Video..." : "Download Video"}
            </button>
            <button
              onClick={resetTool}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>

        {/* DOWNLOAD LINK */}
        {downloadUrl && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Video Ready for Download</h3>
            <div className="p-4 bg-white border border-[var(--border)] rounded-xl">
              <div className="text-center">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] font-semibold"
                >
                  Download Video
                </a>
              </div>
              <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                {downloadMessage}
              </div>
            </div>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="instagram-video-downloader" />
    </div>
  );
}