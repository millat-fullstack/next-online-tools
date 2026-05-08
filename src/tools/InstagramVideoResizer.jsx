import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Video,
  Crop,
  Settings2,
  Palette,
  AlertCircle,
  CheckCircle,
  Play,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Instagram Video Resizer & Cropper",
  path: "/instagram-video-resizer",
  category: "Video Tools",
  description:
    "Resize and crop videos for Instagram Feed, Reels, and Stories. Upload a video, choose an Instagram size, preview, and download.",
  metaTitle: "Instagram Video Resizer & Cropper | Resize Video Online",
  metaDescription:
    "Resize and crop videos for Instagram online for free. Convert videos to Instagram Reel, Story, Feed Portrait, Square, and Landscape sizes in your browser.",
};

const INSTAGRAM_PRESETS = [
  {
    id: "reel",
    label: "Instagram Reel / Story",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    note: "Best for Reels and Stories",
  },
  {
    id: "portrait",
    label: "Instagram Feed Portrait",
    ratio: "4:5",
    width: 1080,
    height: 1350,
    note: "Best for feed portrait posts",
  },
  {
    id: "square",
    label: "Instagram Feed Square",
    ratio: "1:1",
    width: 1080,
    height: 1080,
    note: "Best for square posts",
  },
  {
    id: "landscape",
    label: "Instagram Landscape",
    ratio: "1.91:1",
    width: 1080,
    height: 566,
    note: "Best for landscape feed posts",
  },
];

const QUALITY_OPTIONS = {
  low: {
    label: "Low",
    bits: 1800000,
  },
  medium: {
    label: "Medium",
    bits: 3500000,
  },
  high: {
    label: "High",
    bits: 6000000,
  },
};

export default function InstagramVideoResizer() {
  const fileInputRef = useRef(null);
  const originalVideoRef = useRef(null);
  const outputVideoRef = useRef(null);

  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [outputBlob, setOutputBlob] = useState(null);
  const [outputName, setOutputName] = useState("");

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [duration, setDuration] = useState(0);

  const [presetId, setPresetId] = useState("reel");
  const [cropMode, setCropMode] = useState("fill");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [quality, setQuality] = useState("medium");
  const [fps, setFps] = useState(30);
  const [keepAudio, setKeepAudio] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPreset =
    INSTAGRAM_PRESETS.find((item) => item.id === presetId) ||
    INSTAGRAM_PRESETS[0];

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [videoUrl, outputUrl]);

  const clearOutput = () => {
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }

    setOutputUrl("");
    setOutputBlob(null);
    setOutputName("");
    setProgress(0);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const isValidVideoFile = (selectedFile) => {
    return (
      selectedFile.type.startsWith("video/") ||
      /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(selectedFile.name)
    );
  };

  const getBaseName = (name) => {
    return name.replace(/\.[^/.]+$/, "");
  };

  const handleFile = (selectedFile) => {
    clearFeedback();
    clearOutput();

    if (!selectedFile) return;

    if (!isValidVideoFile(selectedFile)) {
      setError("Please upload a valid video file such as MP4, WEBM, MOV, or M4V.");
      return;
    }

    const maxSize = 250 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload a video under 250MB.");
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);

    const newUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setVideoUrl(newUrl);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setDuration(0);
    setSuccess("Video uploaded successfully. Choose a preset and resize.");
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleOriginalMetadata = () => {
    const video = originalVideoRef.current;

    if (!video) return;

    setOriginalWidth(video.videoWidth || 0);
    setOriginalHeight(video.videoHeight || 0);
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
  };

  const getSupportedMimeType = () => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];

    return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const drawFrame = (ctx, video, canvasWidth, canvasHeight) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    if (cropMode === "fit") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
      const drawWidth = videoWidth * scale;
      const drawHeight = videoHeight * scale;
      const x = (canvasWidth - drawWidth) / 2;
      const y = (canvasHeight - drawHeight) / 2;

      ctx.drawImage(video, x, y, drawWidth, drawHeight);
      return;
    }

    const sourceRatio = videoWidth / videoHeight;
    const targetRatio = canvasWidth / canvasHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    if (sourceRatio > targetRatio) {
      sourceWidth = videoHeight * targetRatio;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      sourceHeight = videoWidth / targetRatio;
      sourceY = (videoHeight - sourceHeight) / 2;
    }

    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvasWidth,
      canvasHeight
    );
  };

  const processVideo = async () => {
    clearFeedback();
    clearOutput();

    if (!file || !videoUrl) {
      setError("Please upload a video first.");
      return;
    }

    if (!window.MediaRecorder) {
      setError("Your browser does not support video recording for this tool.");
      return;
    }

    const mimeType = getSupportedMimeType();

    if (!mimeType) {
      setError("Your browser does not support WebM video export.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    let audioContext = null;
    let animationFrameId = null;

    try {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.playsInline = true;
      video.preload = "auto";
      video.muted = false;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error("Could not load video."));
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      canvas.width = selectedPreset.width;
      canvas.height = selectedPreset.height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const canvasStream = canvas.captureStream(Number(fps) || 30);

      if (keepAudio) {
        try {
          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

          if (AudioContextClass) {
            audioContext = new AudioContextClass();
            const source = audioContext.createMediaElementSource(video);
            const destination = audioContext.createMediaStreamDestination();

            source.connect(destination);

            destination.stream.getAudioTracks().forEach((track) => {
              canvasStream.addTrack(track);
            });

            await audioContext.resume();
          }
        } catch {
          // If audio capture fails, continue with video-only export.
        }
      }

      const chunks = [];
      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: QUALITY_OPTIONS[quality].bits,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const recordingFinished = new Promise((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error("Recording failed."));
      });

      const render = () => {
        drawFrame(ctx, video, canvas.width, canvas.height);

        if (video.duration && Number.isFinite(video.duration)) {
          setProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
        }

        if (!video.ended && !video.paused) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      video.onended = () => {
        drawFrame(ctx, video, canvas.width, canvas.height);

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      };

      recorder.start(500);

      await video.play();
      render();

      await recordingFinished;

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const name = `${getBaseName(file.name)}-${selectedPreset.id}-${selectedPreset.width}x${selectedPreset.height}.webm`;

      setOutputBlob(blob);
      setOutputUrl(url);
      setOutputName(name);
      setProgress(100);
      setSuccess("Video resized successfully. Preview and download your WebM file.");
    } catch (err) {
      setError(
        "Could not resize this video. Try a shorter video or another format supported by your browser."
      );
    } finally {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (audioContext) {
        audioContext.close();
      }

      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;

    const link = document.createElement("a");
    link.href = outputUrl;
    link.download = outputName || "instagram-resized-video.webm";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);

    setFile(null);
    setVideoUrl("");
    setOutputUrl("");
    setOutputBlob(null);
    setOutputName("");
    setOriginalWidth(0);
    setOriginalHeight(0);
    setDuration(0);
    setPresetId("reel");
    setCropMode("fill");
    setBackgroundColor("#000000");
    setQuality("medium");
    setFps(30);
    setKeepAudio(true);
    setIsDragging(false);
    setIsProcessing(false);
    setProgress(0);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sizeResult = useMemo(() => {
    if (!file || !outputBlob) return "-";

    const difference = outputBlob.size - file.size;
    const percentage = Math.abs((difference / file.size) * 100).toFixed(1);

    if (difference > 0) return `${percentage}% larger`;
    if (difference < 0) return `${percentage}% smaller`;

    return "Same size";
  }, [file, outputBlob]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Video size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Instagram Video Resizer & Cropper
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a video, choose Instagram Reel, Story, Feed Portrait, Square,
          or Landscape size, then crop or fit your video and download the result.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white border shadow-sm flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[var(--primary)]" />
              </div>

              <h2 className="text-xl font-semibold mb-2">Upload Video</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Drag and drop your video here, or click the button below.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.ogg,.ogv"
                onChange={handleInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Choose Video
              </button>

              {file && (
                <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Instagram Output Settings</h3>
              </div>

              <label className="block text-sm font-semibold mb-2">
                Instagram Size
              </label>

              <select
                value={presetId}
                onChange={(e) => {
                  setPresetId(e.target.value);
                  clearOutput();
                }}
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
              >
                {INSTAGRAM_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} — {preset.ratio}
                  </option>
                ))}
              </select>

              <div className="mt-4 bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-4">
                <p className="font-semibold">{selectedPreset.width} × {selectedPreset.height}px</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedPreset.note}
                </p>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">
                  Crop Mode
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCropMode("fill");
                      clearOutput();
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      cropMode === "fill"
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    Fill / Crop
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCropMode("fit");
                      clearOutput();
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      cropMode === "fit"
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    Fit / No Crop
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Fill crops extra edges. Fit keeps the full video and adds background.
                </p>
              </div>

              {cropMode === "fit" && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-[var(--primary)]" />
                    <label className="text-sm font-semibold">
                      Background Color
                    </label>
                  </div>

                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      clearOutput();
                    }}
                    className="w-full h-12 border rounded-xl p-1 bg-white"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Export Quality
                  </label>

                  <select
                    value={quality}
                    onChange={(e) => {
                      setQuality(e.target.value);
                      clearOutput();
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    <option value="low">Low - Smaller File</option>
                    <option value="medium">Medium - Recommended</option>
                    <option value="high">High - Better Quality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    FPS
                  </label>

                  <select
                    value={fps}
                    onChange={(e) => {
                      setFps(Number(e.target.value));
                      clearOutput();
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={keepAudio}
                  onChange={(e) => {
                    setKeepAudio(e.target.checked);
                    clearOutput();
                  }}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                Try to keep original audio
              </label>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={processVideo}
                disabled={!file || isProcessing}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !file || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Zap size={18} />
                {isProcessing ? "Resizing..." : "Resize Video"}
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

            {isProcessing && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Processing video...</p>
                  <p className="text-sm font-medium">{progress}%</p>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* FEEDBACK */}
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
                Version 1 works fully in your browser and exports WebM video.
                MP4 export can be added later with FFmpeg.wasm. Very long videos
                may take more time depending on your device.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* PREVIEWS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Play size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Video Preview</h2>
              </div>

              <div className="grid gap-5">
                <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
                  <h3 className="font-semibold mb-3">Original Video</h3>

                  <div className="min-h-72 rounded-2xl border bg-black flex items-center justify-center p-3">
                    {videoUrl ? (
                      <video
                        ref={originalVideoRef}
                        src={videoUrl}
                        controls
                        onLoadedMetadata={handleOriginalMetadata}
                        className="max-h-80 w-full rounded-xl"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Video size={42} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-300">
                          Original video preview will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
                  <h3 className="font-semibold mb-3">Resized Video</h3>

                  <div className="min-h-72 rounded-2xl border bg-black flex items-center justify-center p-3">
                    {outputUrl ? (
                      <video
                        ref={outputVideoRef}
                        src={outputUrl}
                        controls
                        className="max-h-80 w-full rounded-xl"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Crop size={42} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-300">
                          Resized video preview will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DOWNLOAD */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputUrl}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !outputUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download WebM
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Original Size"
                value={file ? formatBytes(file.size) : "-"}
              />

              <StatCard
                label="Output Size"
                value={outputBlob ? formatBytes(outputBlob.size) : "-"}
              />

              <StatCard
                label="Original Dimension"
                value={
                  originalWidth && originalHeight
                    ? `${originalWidth} × ${originalHeight}`
                    : "-"
                }
              />

              <StatCard
                label="Output Dimension"
                value={`${selectedPreset.width} × ${selectedPreset.height}`}
              />

              <StatCard label="Duration" value={duration ? formatTime(duration) : "-"} />

              <StatCard label="Size Result" value={sizeResult} green />
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="instagram-video-resizer" />
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
}

function formatTime(seconds) {
  if (!seconds) return "0 sec";

  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec`;
  if (remainingSeconds === 0) return `${minutes} min`;

  return `${minutes} min ${remainingSeconds} sec`;
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