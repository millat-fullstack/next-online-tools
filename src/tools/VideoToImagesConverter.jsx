import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Scissors,
  Settings2,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import JSZip from "jszip";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Video to Images Converter",
  path: "/video-to-images",
  category: "Video Tools",
  description:
    "Upload a video, pause at any moment, capture frames, view images, and download them as PNG or JPG.",
  metaTitle: "Video to Images Converter Online Free | Capture Video Frames",
  metaDescription:
    "Convert video frames to images online. Upload a video, play and pause, capture frames, preview images, and download single images or all images as a ZIP.",
};

const MAX_FILE_SIZE_MB = 250;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_PROCESSING_TIME_MS = 420;
const MAX_PROCESSING_TIME_MS = 7000;

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG", mime: "image/png", extension: "png" },
  { value: "jpg", label: "JPG", mime: "image/jpeg", extension: "jpg" },
  { value: "webp", label: "WEBP", mime: "image/webp", extension: "webp" },
];

const SIZE_OPTIONS = [
  { value: "original", label: "Original video size" },
  { value: "1080", label: "1080px width" },
  { value: "720", label: "720px width" },
  { value: "custom", label: "Custom width" },
];

export default function VideoToImagesConverter() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const [captures, setCaptures] = useState([]);
  const [fullViewCapture, setFullViewCapture] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outputFormat, setOutputFormat] = useState("png");
  const [jpgQuality, setJpgQuality] = useState(0.92);
  const [captureSize, setCaptureSize] = useState("original");
  const [customWidth, setCustomWidth] = useState(1080);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedFormat = useMemo(() => {
    return FORMAT_OPTIONS.find((format) => format.value === outputFormat) || FORMAT_OPTIONS[0];
  }, [outputFormat]);

  const estimatedProcessingTime = useMemo(() => {
    const pixels = Math.max(1, videoSize.width * videoSize.height);
    const megapixels = pixels / 1000000;
    const estimated = MIN_PROCESSING_TIME_MS + megapixels * 110;

    return clampNumber(Math.round(estimated), MIN_PROCESSING_TIME_MS, MAX_PROCESSING_TIME_MS);
  }, [videoSize.height, videoSize.width]);

  const canCapture = Boolean(videoUrl && videoSize.width && videoSize.height && !isProcessing);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function validateVideo(file) {
    if (!file) return "Please choose a video file.";

    const fileName = file.name.toLowerCase();
    const isVideo =
      file.type.startsWith("video/") ||
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm") ||
      fileName.endsWith(".mov") ||
      fileName.endsWith(".m4v");

    if (!isVideo) {
      return "Please upload a valid video file like MP4, WEBM, MOV, or M4V.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Video must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  function handleFiles(fileList) {
    if (isProcessing) return;

    const file = Array.from(fileList || [])[0];

    if (!file) return;

    const validationError = validateVideo(file);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    cleanupVideo();
    clearAllCaptures({ silent: true });
    clearFeedback();

    const objectUrl = URL.createObjectURL(file);

    setVideoFile(file);
    setVideoUrl(objectUrl);
    setVideoName(file.name);
    setVideoDuration(0);
    setCurrentTime(0);
    setVideoSize({ width: 0, height: 0 });
    setProcessingTimeMs(0);
    setProcessingPhase("Loading video...");
    setSuccess("Video uploaded. Play, pause, then capture the frame you want.");
    resetFileInput();
  }

  function handleFileInputChange(event) {
    handleFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isProcessing) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;

    if (!video) return;

    setVideoDuration(Number(video.duration || 0));
    setCurrentTime(Number(video.currentTime || 0));
    setVideoSize({
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
    });
    setProcessingPhase("");
  }

  function handleTimeUpdate() {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(Number(video.currentTime || 0));
  }

  function seekBy(seconds) {
    const video = videoRef.current;

    if (!video || !Number.isFinite(video.duration)) return;

    video.currentTime = clampNumber(video.currentTime + seconds, 0, video.duration);
    setCurrentTime(video.currentTime);
  }

  function seekTo(value) {
    const video = videoRef.current;
    const time = Number(value);

    if (!video || !Number.isFinite(time)) return;

    video.currentTime = clampNumber(time, 0, videoDuration || 0);
    setCurrentTime(video.currentTime);
  }

  async function captureFrame() {
    const video = videoRef.current;

    if (!video || !canCapture) {
      setError("Please upload a video and wait until it is ready.");
      return;
    }

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProgress(8);
    setProcessingPhase("Preparing frame...");

    const startTime = performance.now();

    try {
      if (!video.paused) {
        video.pause();
      }

      await wait(80);
      setProgress(34);
      setProcessingPhase("Capturing current frame...");

      const outputSize = getCaptureOutputSize({
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        mode: captureSize,
        customWidth,
      });

      const canvas = document.createElement("canvas");
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(video, 0, 0, outputSize.width, outputSize.height);

      setProgress(68);
      setProcessingPhase("Creating image file...");

      await waitRemaining(startTime, estimatedProcessingTime);

      const blob = await canvasToBlob(canvas, selectedFormat.mime, outputFormat === "jpg" ? jpgQuality : undefined);
      const imageUrl = URL.createObjectURL(blob);
      const captureNumber = captures.length + 1;
      const capture = {
        id: makeId(),
        number: captureNumber,
        time: Number(video.currentTime || 0),
        width: outputSize.width,
        height: outputSize.height,
        format: selectedFormat.extension,
        mime: selectedFormat.mime,
        blob,
        url: imageUrl,
        size: blob.size,
        fileName: `video-frame-${captureNumber}-${formatTimeForFile(video.currentTime)}.${selectedFormat.extension}`,
      };

      setCaptures((current) => [...current, capture]);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setProgress(100);
      setProcessingPhase("Frame captured.");
      setSuccess(`Frame ${captureNumber} captured in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (captureError) {
      console.error("Video frame capture error:", captureError);
      setError("Could not capture this frame. Try another moment or use an MP4 video.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function downloadCapture(capture) {
    if (!capture) return;

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProgress(20);
    setProcessingPhase(`Starting Frame ${capture.number} download...`);

    const startTime = performance.now();

    try {
      await saveBlob(capture.blob, capture.fileName);

      setProgress(82);
      setProcessingPhase("Download started...");

      await wait(120);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setProcessingTimeMs(actualTime);
      setProgress(100);
      setSuccess(`Frame ${capture.number} download started in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (downloadError) {
      if (downloadError?.name === "AbortError") {
        setSuccess("Download cancelled.");
      } else {
        setError("Could not download this image. Please try again.");
      }
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function downloadAllCaptures() {
    if (!captures.length) {
      setError("Capture at least one image first.");
      return;
    }

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing ZIP file...");

    const startTime = performance.now();

    try {
      const zip = new JSZip();

      for (let index = 0; index < captures.length; index += 1) {
        const capture = captures[index];

        setProcessingPhase(`Adding image ${index + 1} of ${captures.length}...`);
        zip.file(capture.fileName, capture.blob, {
          binary: true,
          compression: "STORE",
        });
        setProgress(Math.round(((index + 1) / captures.length) * 62));
        await wait(12);
      }

      setProcessingPhase("Creating ZIP file...");
      const generatedZipBlob = await zip.generateAsync(
        {
          type: "blob",
          streamFiles: true,
          compression: "STORE",
          mimeType: "application/zip",
        },
        (metadata) => {
          const zipProgress = 62 + Math.round((metadata.percent || 0) * 0.25);
          setProgress(Math.min(88, zipProgress));
        }
      );

      const zipBlob = generatedZipBlob.type === "application/zip"
        ? generatedZipBlob
        : new Blob([generatedZipBlob], { type: "application/zip" });

      await waitRemaining(startTime, Math.max(700, captures.length * 120));

      setProcessingPhase("Starting ZIP download...");
      setProgress(92);
      await saveBlob(zipBlob, "captured-video-images.zip");

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setProcessingTimeMs(actualTime);
      setProgress(100);
      setSuccess(`All images prepared in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (zipError) {
      console.error("Download all captures error:", zipError);
      setError("Could not create the ZIP file. Try JPG or 1080px size if the captured images are very large.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function removeCapture(id) {
    setCaptures((current) => {
      const capture = current.find((item) => item.id === id);

      if (capture?.url) {
        URL.revokeObjectURL(capture.url);
      }

      return current.filter((item) => item.id !== id);
    });

    if (fullViewCapture?.id === id) {
      setFullViewCapture(null);
    }

    clearFeedback();
  }

  function clearAllCaptures({ silent = false } = {}) {
    captures.forEach((capture) => {
      if (capture.url) {
        URL.revokeObjectURL(capture.url);
      }
    });

    setCaptures([]);
    setFullViewCapture(null);

    if (!silent) {
      setSuccess("Captured images cleared.");
      setError("");
    }
  }

  function cleanupVideo() {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoFile(null);
    setVideoUrl("");
    setVideoName("");
    setVideoDuration(0);
    setCurrentTime(0);
    setVideoSize({ width: 0, height: 0 });
  }

  function resetTool() {
    cleanupVideo();
    clearAllCaptures({ silent: true });
    setSettingsOpen(false);
    setOutputFormat("png");
    setJpgQuality(0.92);
    setCaptureSize("original");
    setCustomWidth(1080);
    setIsDragging(false);
    setIsProcessing(false);
    setProcessingPhase("");
    setProgress(0);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FileVideo size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Video to Images Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a video, play and pause at the exact moment, capture frames, view
          each image in full size, and download one or all images.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              isDragging
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] hover:bg-[#f8f4ff]"
            } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />

            <h2 className="text-xl font-semibold mb-2">Choose or drop a video here</h2>

            <p className="text-sm text-[var(--text-secondary)]">
              MP4 and WEBM work best. MOV/M4V may depend on browser support. Max{" "}
              <strong>{MAX_FILE_SIZE_MB} MB</strong>.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isProcessing}
            />
          </label>

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

          {videoUrl && (
            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Video size={20} className="text-[var(--primary)]" />
                    <h2 className="font-bold text-lg">Video Preview</h2>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                    {videoName} {videoSize.width ? `• ${videoSize.width}×${videoSize.height}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetTool}
                  disabled={isProcessing}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>
              </div>

              <div className="p-4 sm:p-5">
                <div className="rounded-2xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full max-h-[640px] bg-black"
                  />
                </div>

                <div className="mt-4 grid lg:grid-cols-[1fr_auto] gap-3 items-end">
                  <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold">Choose capture moment</p>
                      <p className="text-xs font-bold text-[var(--primary)]">
                        {formatTime(currentTime)} / {formatTime(videoDuration)}
                      </p>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, videoDuration)}
                      step="0.01"
                      value={Math.min(currentTime, videoDuration || 0)}
                      onChange={(event) => seekTo(event.target.value)}
                      className="w-full accent-[var(--primary)]"
                    />

                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <button type="button" onClick={() => seekBy(-1)} className="small-action-btn">-1s</button>
                      <button type="button" onClick={() => seekBy(-0.1)} className="small-action-btn">-0.1s</button>
                      <button type="button" onClick={() => seekBy(0.1)} className="small-action-btn">+0.1s</button>
                      <button type="button" onClick={() => seekBy(1)} className="small-action-btn">+1s</button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={captureFrame}
                    disabled={!canCapture}
                    className={`btn-primary min-h-[54px] inline-flex items-center justify-center gap-2 ${
                      !canCapture ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Scissors size={18} />}
                    Capture Frame
                  </button>
                </div>
              </div>
            </div>
          )}

          {videoUrl && (
            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setSettingsOpen((current) => !current)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <Settings2 size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Capture Settings</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {selectedFormat.label} • {SIZE_OPTIONS.find((item) => item.value === captureSize)?.label || "Original"}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-[var(--primary)] transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {settingsOpen && (
                <div className="border-t border-[var(--border)] bg-[#fafafa] p-4 sm:p-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormControl label="Image Format">
                      <select
                        value={outputFormat}
                        onChange={(event) => setOutputFormat(event.target.value)}
                        className="tool-input"
                      >
                        {FORMAT_OPTIONS.map((format) => (
                          <option key={format.value} value={format.value}>
                            {format.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>

                    <FormControl label="Capture Size">
                      <select
                        value={captureSize}
                        onChange={(event) => setCaptureSize(event.target.value)}
                        className="tool-input"
                      >
                        {SIZE_OPTIONS.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>

                    {captureSize === "custom" && (
                      <FormControl label="Custom Width">
                        <input
                          type="number"
                          min="120"
                          max="4096"
                          value={customWidth}
                          onChange={(event) => setCustomWidth(Number(event.target.value))}
                          className="tool-input"
                        />
                      </FormControl>
                    )}

                    {outputFormat === "jpg" && (
                      <FormControl label={`JPG Quality: ${Math.round(jpgQuality * 100)}%`}>
                        <input
                          type="range"
                          min="0.6"
                          max="1"
                          step="0.01"
                          value={jpgQuality}
                          onChange={(event) => setJpgQuality(Number(event.target.value))}
                          className="w-full accent-[var(--primary)]"
                        />
                      </FormControl>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing..."}</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!isProcessing && processingTimeMs > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
              <span className="font-semibold">Processing completed</span>
              <span className="font-bold">{(processingTimeMs / 1000).toFixed(1)}s</span>
            </div>
          )}

          {captures.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Captured Images</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={downloadAllCaptures}
                    disabled={isProcessing}
                    className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={17} />
                    Download All
                  </button>

                  <button
                    type="button"
                    onClick={() => clearAllCaptures()}
                    disabled={isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={17} />
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {captures.map((capture) => (
                  <CaptureCard
                    key={capture.id}
                    capture={capture}
                    onDownload={() => downloadCapture(capture)}
                    onFullView={() => setFullViewCapture(capture)}
                    onRemove={() => removeCapture(capture.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!videoUrl && (
            <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
              <FileVideo size={42} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload a video to start capturing images.
              </p>
            </div>
          )}
        </div>
      </section>

      {fullViewCapture && (
        <div className="fixed inset-0 z-50 bg-black/75 p-4 flex items-center justify-center">
          <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Frame {fullViewCapture.number}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Captured at {formatTime(fullViewCapture.time)} • {fullViewCapture.width}×{fullViewCapture.height}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCapture(fullViewCapture)}
                  className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={17} />
                  Download
                </button>

                <button
                  type="button"
                  onClick={() => setFullViewCapture(null)}
                  className="h-10 w-10 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]"
                  aria-label="Close full image preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="h-[78vh] bg-[#f8f4ff] flex items-center justify-center p-4 overflow-auto">
              <img
                src={fullViewCapture.url}
                alt={`Captured frame ${fullViewCapture.number}`}
                className="max-h-full max-w-full object-contain rounded-xl shadow"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tool-input {
          width: 100%;
          height: 44px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0 0.9rem;
          background: white;
          outline: none;
          font-weight: 600;
        }
        .tool-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
        .small-action-btn {
          min-height: 38px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          padding: 0.45rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: 160ms ease;
        }
        .small-action-btn:hover:not(:disabled) {
          background: #f8f4ff;
          color: var(--primary);
        }
        .small-action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      <SuggestedTools currentToolId="video-to-images" />
    </div>
  );
}

function FormControl({ label, children }) {
  return (
    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4">
      <span className="block text-sm font-semibold mb-3">{label}</span>
      {children}
    </label>
  );
}

function CaptureCard({ capture, onDownload, onFullView, onRemove }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm">
      <div className="relative bg-[#f8f4ff] h-44 flex items-center justify-center">
        <div className="absolute left-3 top-3 z-10 rounded-full bg-white/95 border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--primary)] shadow-sm">
          Frame {capture.number}
        </div>

        <img
          src={capture.url}
          alt={`Captured frame ${capture.number}`}
          className="max-h-full max-w-full object-contain"
        />

        <button
          type="button"
          onClick={onFullView}
          className="absolute bottom-3 right-3 z-10 h-10 w-10 rounded-xl border border-[var(--border)] bg-white/95 shadow-sm inline-flex items-center justify-center transition hover:bg-[#f4edff] hover:text-[var(--primary)]"
          title={`View frame ${capture.number} full size`}
          aria-label={`View frame ${capture.number} full size`}
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm">Time: {formatTime(capture.time)}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {capture.width}×{capture.height} • {capture.format.toUpperCase()} • {formatBytes(capture.size)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onDownload}
            className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff] transition"
            title={`Download frame ${capture.number}`}
            aria-label={`Download frame ${capture.number}`}
          >
            <Download size={18} />
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="h-10 w-10 rounded-xl border border-red-200 bg-red-50 inline-flex items-center justify-center text-red-600 hover:bg-red-100 transition"
            title={`Remove frame ${capture.number}`}
            aria-label={`Remove frame ${capture.number}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function getCaptureOutputSize({ videoWidth, videoHeight, mode, customWidth }) {
  const originalWidth = Math.max(1, Number(videoWidth || 1));
  const originalHeight = Math.max(1, Number(videoHeight || 1));
  const ratio = originalHeight / originalWidth;

  if (mode === "1080") {
    const width = Math.min(1080, originalWidth);
    return { width, height: Math.round(width * ratio) };
  }

  if (mode === "720") {
    const width = Math.min(720, originalWidth);
    return { width, height: Math.round(width * ratio) };
  }

  if (mode === "custom") {
    const width = clampNumber(Number(customWidth || originalWidth), 120, 4096);
    return { width, height: Math.round(width * ratio) };
  }

  return { width: originalWidth, height: originalHeight };
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create image."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function saveBlob(blob, filename) {
  const safeBlob = blob instanceof Blob
    ? blob
    : new Blob([blob], { type: "application/octet-stream" });

  const safeName = sanitizeDownloadFileName(filename || "download");
  const mimeType = safeBlob.type || getMimeTypeFromFileName(safeName);
  const file = new File([safeBlob], safeName, { type: mimeType });

  const canUseNativeShare =
    isIosLikeDevice() &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canUseNativeShare) {
    await navigator.share({
      files: [file],
      title: safeName,
    });
    return;
  }

  const url = URL.createObjectURL(safeBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isIosLikeDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1)
  );
}

function sanitizeDownloadFileName(fileName) {
  const cleanName = String(fileName || "download")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleanName || "download";
}

function getMimeTypeFromFileName(fileName) {
  const name = String(fileName || "").toLowerCase();

  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".zip")) return "application/zip";

  return "application/octet-stream";
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.floor(value % 60);
  const centiseconds = Math.floor((value % 1) * 100);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function formatTimeForFile(seconds) {
  return formatTime(seconds).replace(/[:.]/g, "-");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitRemaining(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  const remaining = Math.max(0, minimumMs - elapsed);
  if (remaining > 0) await wait(remaining);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}
